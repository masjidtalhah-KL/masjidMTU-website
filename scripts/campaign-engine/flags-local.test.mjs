import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {request as httpRequest} from 'node:http';
import {createClient} from '@supabase/supabase-js';
import {localStack,fixtures,sql,rows,quote,signedToken,api,rpc,totp} from '../admin-foundation/local-stack.mjs';
import {nextProbe} from '../admin-foundation/local-next-probe.mjs';
import {composeAvailability} from '../../src/lib/campaigns/flag-contract.ts';
let stack,users,ownerClient,ownerToken,otherOwnerClient,otherOwnerToken,probe,created=false;
const token=(name,options)=>signedToken(stack,users[name],options);
const claims=auth=>JSON.parse(Buffer.from(auth.split('.')[1],'base64url'));
const snapshot=auth=>rpc(stack,'admin_system_flags',auth);
const set=(auth,enabled,version,key='campaigns.enabled')=>rpc(stack,'admin_set_system_flag',auth,{target_key:key,desired_enabled:enabled,expected_version:version});
const count=()=>Number(sql("select count(*) from private.admin_audit_log where target_kind='system_flag'"));
const flag=()=>rows("select enabled,version from private.system_feature_flags where flag_key='campaigns.enabled'")[0];
const unchanged=async(operation,status)=>{
  const state=flag(),audits=count();assert.equal((await operation()).status,status);
  assert.deepEqual(flag(),state);assert.equal(count(),audits);
};
const origin='http://localhost:3038';
const commandBody=()=>JSON.stringify({key:'campaigns.enabled',enabled:true,expectedVersion:3});
function routeHeaders(overrides={}){
  const jwt=claims(ownerToken);
  const session={access_token:ownerToken,refresh_token:'synthetic-cookie-no-refresh',token_type:'bearer',expires_in:3600,
    expires_at:jwt.exp,user:{id:jwt.sub,email:jwt.email}};
  const headers={Cookie:'sb-127-auth-token=base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),
    Origin:origin,'Content-Type':'application/json',...overrides};
  return Object.fromEntries(Object.entries(headers).filter(([,value])=>value!==null));
}
async function rawRoute(body=commandBody(),overrides={}){
  const response=await fetch(origin+'/admin/api/feature-flags',{method:'POST',headers:routeHeaders(overrides),body});
  return {status:response.status,headers:response.headers,text:await response.text()};
}
async function rejectedRoute(operation,status){
  const beforeFlags=rows('select * from private.system_feature_flags order by flag_key');
  const beforeAudits=rows('select * from private.admin_audit_log order by id');
  const result=await operation();assert.equal(result.status,status);
  assert.deepEqual(JSON.parse(result.text),{error:status===403?'denied':'invalid'});
  assert.match(result.headers.get('cache-control'),/no-store/);
  assert.deepEqual(rows('select * from private.system_feature_flags order by flag_key'),beforeFlags);
  assert.deepEqual(rows('select * from private.admin_audit_log order by id'),beforeAudits);
}
// Real chunked HTTP request without Content-Length. Next proxy finalizes its
// upstream clone before invoking the route; reader early cancellation is tested
// separately against an unfinished ReadableStream in flags-contract.test.ts.
function chunkedRoute(){
  return new Promise((resolve,reject)=>{
    const request=httpRequest(origin+'/admin/api/feature-flags',{method:'POST',headers:routeHeaders({'Transfer-Encoding':'chunked'})},response=>{
      let text='';response.setEncoding('utf8');response.on('data',chunk=>{text+=chunk;});
      response.on('end',()=>{
        request.destroy();resolve({status:response.statusCode,headers:new Headers(response.headers),text});
      });
      response.on('error',reject);
    });
    request.setTimeout(5000,()=>{request.destroy(Error('Chunked request did not complete'));});
    request.on('error',reject);
    assert.equal(request.hasHeader('content-length'),false);
    const body=commandBody().padEnd(257,' ');
    request.write(body.slice(0,100));request.write(body.slice(100,200));request.end(body.slice(200));
  });
}
async function issueOwner(name){
  const client=createClient(stack.url,stack.anon,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const link=await api(stack,'/auth/v1/admin/generate_link',{service:true,method:'POST',body:{type:'magiclink',email:users[name].email}});
  assert.equal(link.status,200);
  const session=await api(stack,'/auth/v1/verify',{method:'POST',body:{token_hash:link.data.hashed_token,type:'magiclink'}});assert.equal(session.status,200);
  users[name].session=claims(session.data.access_token).session_id;
  sql("insert into auth.mfa_amr_claims(id,session_id,created_at,updated_at,authentication_method) values ("+quote(randomUUID())+','+quote(users[name].session)+",now(),now(),'oauth')");
  assert.equal((await client.auth.setSession({access_token:session.data.access_token,refresh_token:session.data.refresh_token})).error,null);
  assert.equal((await client.auth.refreshSession()).error,null);
  const factor=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Local flag service verification'});assert.equal(factor.error,null);
  const verified=await client.auth.mfa.challengeAndVerify({factorId:factor.data.id,code:totp(factor.data.totp.secret)});
  assert.equal(verified.error,null);return {client,token:verified.data.access_token};
}
before(async()=>{
  stack=localStack();users=fixtures();created=true;
  // Separate local fixture owners force the flag-key lock to coordinate requests,
  // rather than allowing a shared actor-row lock alone to mask a missing-row race.
  sql("insert into public.admin_profiles(user_id,approved_email,google_subject,role,status) values ("+quote(users.other.id)+','+quote(users.other.email)+','+quote(users.other.subject)+",'super_admin','active');"+
    "insert into private.admin_audit_log(action,actor_aal,target_id,new_role,new_status) values ('bootstrap','system',"+quote(users.other.id)+",'super_admin','active')");
  const owner=await issueOwner('owner');ownerClient=owner.client;ownerToken=owner.token;
  const other=await issueOwner('other');otherOwnerClient=other.client;otherOwnerToken=other.token;
  probe=await nextProbe(stack);
});
after(async()=>{
  await probe?.close();await ownerClient?.auth.stopAutoRefresh();await otherOwnerClient?.auth.stopAutoRefresh();
  if(created){
    execFileSync(process.execPath,['scripts/admin-foundation/local-cli.mjs','db','reset','--local','--no-seed'],{stdio:'pipe'});
    for(const table of ['campaign_type_descriptors','campaigns','system_feature_flags'])assert.equal(sql('select count(*) from private.'+table),'0');
    assert.equal(sql('select count(*) from auth.users'),'0');
    assert.equal(sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'local_fixture%'"),'0');
  }
});
test('real empty migration state: missing foundation flag reads effective OFF/version 0 without seeds',async()=>{
  for(const auth of [token('staff'),token('admin'),ownerToken]){
    const result=await snapshot(auth);assert.equal(result.status,200);
    assert.deepEqual(result.data,[{key:'campaigns.enabled',present:false,enabled:false,version:0}]);
  }
  assert.equal(sql('select count(*) from private.campaign_type_descriptors'),'0');
});
for(const name of [null,'outsider','disabled','revoked','staff','admin','owner']){
  test('real flag read authorization '+(name??'anon'),async()=>{
    const result=await snapshot(name?token(name):undefined);
    assert.equal(result.status,name===null?401:['staff','admin'].includes(name)?200:403);
  });
  test('real flag mutation denied for '+(name??'anon'),async()=>{
    await unchanged(()=>set(name?token(name):undefined,true,0),name===null?401:403);
  });
}
test('owner AAL2 missing/stale/future signed TOTP proof cannot mutate',async()=>{
  for(const amr of [[{method:'oauth'}],[{method:'oauth'},{method:'totp',timestamp:Math.floor(Date.now()/1000)-601}],
    [{method:'oauth'},{method:'totp',timestamp:Math.floor(Date.now()/1000)+60}]])
    await unchanged(()=>set(token('owner',{aal:'aal2',amr}),true,0),403);
});
test('missing supported flag disable is no row/no version/no audit; stale missing version conflicts',async()=>{
  const audits=count();const result=await set(ownerToken,false,0);assert.equal(result.status,200);
  assert.deepEqual(result.data,{key:'campaigns.enabled',present:false,enabled:false,version:0,changed:false});
  assert.equal(flag(),undefined);assert.equal(count(),audits);
  await unchanged(()=>set(ownerToken,false,1),409);
});
test('unknown/future unregistered flags fail closed without creating rows or leaking registry data',async()=>{
  for(const key of ['qurban.enabled','ramadan.enabled','volunteer.enabled','generic.enabled','unknown.enabled']){
    await unchanged(()=>set(ownerToken,true,0,key),400);
    assert.deepEqual(composeAvailability((await snapshot(ownerToken)).data,key),{available:false,reason:'unsupported'});
  }
});
test('concurrent missing-row enables: one Auth-issued owner winner, one PT409, one row/audit',async()=>{
  assert.equal(claims(ownerToken).aal,'aal2');assert(claims(ownerToken).amr.some(a=>a.method==='totp'));
  const audits=count();const results=await Promise.all([set(ownerToken,true,0),set(otherOwnerToken,true,0)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.deepEqual(flag(),{enabled:true,version:1});assert.equal(count(),audits+1);
  const audit=rows("select * from private.admin_audit_log where target_kind='system_flag'")[0];
  assert.equal(audit.action,'system_flag.enable');assert([users.owner.id,users.other.id].includes(audit.actor_id));
  assert.equal(audit.expected_version,0);assert.equal(audit.resulting_version,1);
  assert.deepEqual(audit.metadata,{before_enabled:false,after_enabled:true});assert.match(audit.request_id,/^[0-9a-f-]{36}$/);
});
test('already ON enable is idempotent; stale retry conflicts without duplicate business audit',async()=>{
  const audits=count();const result=await set(ownerToken,true,1);assert.equal(result.status,200);assert.equal(result.data.changed,false);
  assert.deepEqual(flag(),{enabled:true,version:1});assert.equal(count(),audits);
  await unchanged(()=>set(ownerToken,true,0),409);
});
test('ON -> OFF increments once and audit metadata records exact transition',async()=>{
  const audits=count();const result=await set(ownerToken,false,1);assert.equal(result.status,200);assert.equal(result.data.changed,true);
  assert.deepEqual(flag(),{enabled:false,version:2});assert.equal(count(),audits+1);
  const event=rows("select * from private.admin_audit_log where action='system_flag.disable'")[0];
  assert.deepEqual(event.metadata,{before_enabled:true,after_enabled:false});assert.equal(event.expected_version,1);assert.equal(event.resulting_version,2);
  const read=await snapshot(token('admin'));assert.deepEqual(read.data,[{key:'campaigns.enabled',present:true,enabled:false,version:2}]);
});
test('already OFF disable is idempotent with no version/audit',async()=>{
  const audits=count();const result=await set(ownerToken,false,2);assert.equal(result.status,200);assert.equal(result.data.changed,false);
  assert.deepEqual(flag(),{enabled:false,version:2});assert.equal(count(),audits);
});
test('concurrent existing OFF -> ON: one version winner; current ON safe read',async()=>{
  const audits=count();const result=await Promise.all([set(ownerToken,true,2),set(otherOwnerToken,true,2)]);
  assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);assert.equal(count(),audits+1);
  assert.deepEqual(flag(),{enabled:true,version:3});assert.equal((await snapshot(token('staff'))).data[0].enabled,true);
});
test('audit failure rolls back real flag state/version and app returns safe unavailable',async()=>{
  sql("create function private.local_fixture_flag_audit() returns trigger language plpgsql set search_path='' as $$ begin if new.target_kind='system_flag' then raise exception 'Local forced audit failure'; end if;return new;end $$;create trigger local_fixture_flag_audit before insert on private.admin_audit_log for each row execute function private.local_fixture_flag_audit()");
  try{
    await unchanged(()=>set(ownerToken,false,3),400);
    const result=await probe.request('/admin/api/feature-flags',{token:ownerToken,method:'POST',body:{key:'campaigns.enabled',enabled:false,expectedVersion:3}});
    assert.equal(result.status,503);assert.deepEqual(JSON.parse(result.text),{error:'unavailable'});
    assert.deepEqual(flag(),{enabled:true,version:3});
  }finally{sql('drop trigger local_fixture_flag_audit on private.admin_audit_log;drop function private.local_fixture_flag_audit()');}
});
test('only isolated reviewed test descriptors admit future module flags; composition requires both states',async()=>{
  sql("create function private.local_fixture_flag_config(jsonb) returns boolean language sql immutable set search_path='' as $$ select $1='{}'::jsonb $$;revoke all on function private.local_fixture_flag_config(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin;insert into private.campaign_type_descriptors values ('local_fixture',1,'local_fixture.enabled','local_fixture_flag_config')");
  let read=await snapshot(token('admin'));const moduleState=read.data.find(f=>f.key==='local_fixture.enabled');
  assert.deepEqual(moduleState,{key:'local_fixture.enabled',present:false,enabled:false,version:0});
  assert.equal(composeAvailability(read.data,'local_fixture.enabled').available,false);
  assert.equal((await set(ownerToken,true,0,'local_fixture.enabled')).status,200);
  read=await snapshot(token('staff'));assert.equal(composeAvailability(read.data,'local_fixture.enabled').available,true);
  assert.equal((await set(ownerToken,false,1,'local_fixture.enabled')).status,200);
  assert.equal(composeAvailability((await snapshot(token('staff'))).data,'local_fixture.enabled').available,false);
});
test('raw table writes/private schema/internal helpers remain denied through real Data API/ACLs',async()=>{
  assert.equal((await api(stack,'/rest/v1/system_feature_flags',{token:ownerToken,method:'PATCH',body:{enabled:false}})).status,404);
  assert.equal((await api(stack,'/rest/v1/system_feature_flags',{token:ownerToken,headers:{'Accept-Profile':'private'}})).status,406);
  for(const fn of ['system_flag_supported','system_feature_flag_set','system_feature_flags_read','record_campaign_event'])
    assert.equal((await rpc(stack,fn,ownerToken)).status,404);
  for(const role of ['anon','authenticated','service_role','supabase_auth_admin']){
    assert.equal(sql("select has_function_privilege("+quote(role)+",'private.system_flag_supported(text)','execute')"),'f');
    assert.equal(sql("select has_table_privilege("+quote(role)+",'private.system_feature_flags','INSERT,UPDATE,DELETE')"),'f');
  }
  assert.throws(()=>sql("begin;set local role authenticated;update private.system_feature_flags set enabled=false;rollback;"),/permission denied/);
});
test('metadata/payload role or actor forgery cannot elevate direct RPC authority',async()=>{
  await unchanged(()=>set(token('admin',{metadata:{role:'super_admin',user_id:users.owner.id,aal:'aal2'}}),false,3),403);
  const result=await rpc(stack,'admin_set_system_flag',ownerToken,{target_key:'campaigns.enabled',desired_enabled:false,expected_version:3,actor_id:users.owner.id});
  assert.equal(result.status,404);
});
test('invalid/null expected versions, invalid keys and desired state are rejected by DB',async()=>{
  for(const args of [{target_key:'campaigns.enabled',desired_enabled:true,expected_version:-1},
    {target_key:'campaigns.enabled',desired_enabled:true,expected_version:null},
    {target_key:null,desired_enabled:true,expected_version:3},{target_key:'campaigns.enabled',desired_enabled:null,expected_version:3}])
    await unchanged(()=>rpc(stack,'admin_set_system_flag',ownerToken,args),400);
});
test('new Next service read/mutation independently enforces Auth/MFA and no-store safe DTO',async()=>{
  for(const name of [null,'outsider','disabled','revoked','staff','admin','owner']){
    const auth=name?token(name):undefined;
    const read=await probe.request('/admin/api/feature-flags',{token:auth});
    assert.equal(read.status,name===null?401:['staff','admin'].includes(name)?200:403);
    assert.match(read.headers.get('cache-control'),/no-store/);
    const result=await probe.request('/admin/api/feature-flags',{token:auth,method:'POST',body:{key:'campaigns.enabled',enabled:false,expectedVersion:3}});
    assert.equal(result.status,name===null?401:403);
  }
  const read=await probe.request('/admin/api/feature-flags',{token:ownerToken});assert.equal(read.status,200);
  for(const dto of JSON.parse(read.text).flags)assert.deepEqual(Object.keys(dto).sort(),['enabled','key','present','version']);
  const saved=await probe.request('/admin/api/feature-flags',{token:ownerToken,method:'POST',body:{key:'campaigns.enabled',enabled:true,expectedVersion:3}});
  assert.equal(saved.status,200);assert.equal(JSON.parse(saved.text).changed,false);
  const audits=count();
  const transition=await probe.request('/admin/api/feature-flags',{token:ownerToken,method:'POST',body:{key:'local_fixture.enabled',enabled:true,expectedVersion:2}});
  assert.equal(transition.status,200);assert.equal(JSON.parse(transition.text).changed,true);assert.equal(count(),audits+1);
  const fresh=await probe.request('/admin/api/feature-flags',{token:ownerToken});
  assert.equal(JSON.parse(fresh.text).flags.find(f=>f.key==='local_fixture.enabled').enabled,true);
  const stale=token('owner',{aal:'aal2',amr:[{method:'oauth'},{method:'totp',timestamp:Math.floor(Date.now()/1000)-601}]});
  assert.equal((await probe.request('/admin/api/feature-flags',{token:stale,method:'POST',body:{key:'campaigns.enabled',enabled:false,expectedVersion:3}})).status,403);
});
test('Next input bounds/cross-origin/unsupported and stale conflicts have generic safe failures',async()=>{
  const query=await probe.request('/admin/api/feature-flags?key=qurban.enabled',{token:ownerToken});assert.equal(query.status,422);
  for(const body of [{key:'campaigns.enabled',enabled:false,expectedVersion:3,role:'super_admin'},
    {key:'campaigns.enabled',enabled:false,expectedVersion:3,actor_id:users.owner.id},{padding:'x'.repeat(300)},
    {key:'qurban.enabled',enabled:true,expectedVersion:0}]){
    const result=await probe.request('/admin/api/feature-flags',{token:ownerToken,method:'POST',body});assert.equal(result.status,422);
  }
  const stale=await probe.request('/admin/api/feature-flags',{token:ownerToken,method:'POST',body:{key:'campaigns.enabled',enabled:true,expectedVersion:2}});assert.equal(stale.status,409);
  const noOrigin=await probe.request('/admin/api/feature-flags',{token:ownerToken,method:'POST'});assert.equal(noOrigin.status,403);
});
test('same-origin JSON command at exact 256-byte limit succeeds with safe no-store response',async()=>{
  const body=commandBody().padEnd(256,' '),audits=count();
  assert.equal(Buffer.byteLength(body,'utf8'),256);
  const result=await rawRoute(body,{'Content-Type':'application/json; charset=utf-8','Sec-Fetch-Site':'same-origin'});
  assert.equal(result.status,200);assert.match(result.headers.get('cache-control'),/no-store/);
  assert.equal(JSON.parse(result.text).changed,false);assert.deepEqual(flag(),{enabled:true,version:3});assert.equal(count(),audits);
});
test('missing Origin denies valid JSON and preserves all state/audit',async()=>{
  await rejectedRoute(()=>rawRoute(commandBody(),{Origin:null}),403);
});
test('explicit foreign Origin denies the mutation without state/version/audit changes',async()=>{
  await rejectedRoute(()=>rawRoute(commandBody(),{Origin:'https://foreign.invalid'}),403);
});
test('Sec-Fetch-Site cross-site denies even a matching Origin without any mutation',async()=>{
  await rejectedRoute(()=>rawRoute(commandBody(),{'Sec-Fetch-Site':'cross-site'}),403);
});
test('missing/non-JSON/misleading Content-Type rejects valid JSON without any mutation',async()=>{
  for(const contentType of [null,'text/plain','application/jsonish','application/x-www-form-urlencoded'])
    await rejectedRoute(()=>rawRoute(commandBody(),{'Content-Type':contentType}),422);
});
test('normal 257-byte valid JSON command is rejected without flag/version/audit mutation',async()=>{
  await rejectedRoute(()=>rawRoute(commandBody().padEnd(257,' ')),422);
});
test('oversized UTF-8 body below 256 characters is rejected without mutation',async()=>{
  const body=JSON.stringify({padding:'é'.repeat(128)});
  assert(body.length<256);assert(Buffer.byteLength(body,'utf8')>256);
  await rejectedRoute(()=>rawRoute(body),422);
});
test('real chunked valid JSON body without Content-Length exceeds 256 bytes and is denied without mutation',async()=>{
  await rejectedRoute(()=>chunkedRoute(),422);
});
test('malformed JSON has a generic 422 response and leaves every flag/audit unchanged',async()=>{
  await rejectedRoute(()=>rawRoute('{"key":'),422);
});
test('DB read failure is unavailable at server boundary, never a fabricated ON snapshot',async()=>{
  sql("alter table private.system_feature_flags rename to local_fixture_unavailable_flags");
  try{
    const result=await probe.request('/admin/api/feature-flags',{token:ownerToken});assert.equal(result.status,503);
    assert.deepEqual(JSON.parse(result.text),{error:'unavailable'});
  }finally{sql('alter table private.local_fixture_unavailable_flags rename to system_feature_flags');}
});
test('live owner disable/revoke and ended session deny stale real Auth-issued JWT without lockout',async()=>{
  for(const status of ['disabled','revoked']){
    sql('update public.admin_profiles set status='+quote(status)+' where user_id='+quote(users.owner.id));
    try{await unchanged(()=>snapshot(ownerToken),403);await unchanged(()=>set(ownerToken,false,3),403);}
    finally{sql("update public.admin_profiles set status='active' where user_id="+quote(users.owner.id));}
  }
  assert.equal((await snapshot(ownerToken)).status,200);
  assert.equal((await ownerClient.auth.signOut({scope:'global'})).error,null);
  await unchanged(()=>set(ownerToken,false,3),403);
});
test('oversized reviewed test registry fails unavailable without truncating effective authority',async()=>{
  sql("insert into private.campaign_type_descriptors(type_key,config_version,module_flag_key,validator_name) select 'local_fixture_cap_'||lpad(i::text,3,'0'),1,'local_fixture_cap_'||lpad(i::text,3,'0')||'.enabled','local_fixture_flag_config' from generate_series(1,100) i");
  assert.equal((await snapshot(otherOwnerToken)).status,503);
  const result=await probe.request('/admin/api/feature-flags',{token:otherOwnerToken});assert.equal(result.status,503);
  assert.deepEqual(JSON.parse(result.text),{error:'unavailable'});
  // The suite after-hook resets all isolated descriptors; none is a seed.
});
