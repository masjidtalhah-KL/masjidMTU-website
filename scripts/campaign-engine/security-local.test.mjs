// Fasa 7.6 adversarial verification only: disposable local identities, no hosted I/O.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {chromium} from '@playwright/test';
import {localStack, fixtures, sql, rows, quote, signedToken, api, rpc, totp} from '../admin-foundation/local-stack.mjs';
import {nextProbe} from '../admin-foundation/local-next-probe.mjs';

let stack, users, ownerClient, ownerFresh, ownerAal1, probe, browser, campaign, created=false;
const claim=t=>JSON.parse(Buffer.from(t.split('.')[1],'base64url'));
const token=(name,options)=>signedToken(stack,users[name],options);
const payload={slug:'security-review-local',title:'Local security review',visibility:'private',scheduled_public_display:false,
  archived_history_display:false,config_version:1,configuration:{}};
const windows={registration_opens_at:null,registration_closes_at:null,event_starts_at:null,event_ends_at:null};
const snapshot=()=>sql("select jsonb_build_object('campaigns',(select jsonb_agg(to_jsonb(c) order by id) from private.campaigns c), 'flags',(select jsonb_agg(to_jsonb(f) order by flag_key) from private.system_feature_flags f), 'audits',(select count(*) from private.admin_audit_log))");
const emptyCounts=['private.campaign_type_descriptors','private.campaigns','private.system_feature_flags','private.admin_audit_log',
  'private.admin_invites','public.admin_profiles','auth.users','auth.identities','auth.sessions','auth.mfa_factors'];
before(async()=>{
  stack=localStack(); users=fixtures(); created=true;
  ownerClient=createClient(stack.url,stack.anon,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const link=await api(stack,'/auth/v1/admin/generate_link',{service:true,method:'POST',body:{type:'magiclink',email:users.owner.email}});
  assert.equal(link.status,200);
  const verified=await api(stack,'/auth/v1/verify',{method:'POST',body:{token_hash:link.data.hashed_token,type:'magiclink'}});
  assert.equal(verified.status,200); users.owner.session=claim(verified.data.access_token).session_id;
  sql(`insert into auth.mfa_amr_claims(id,session_id,created_at,updated_at,authentication_method) values (${quote(randomUUID())},${quote(users.owner.session)},now(),now(),'oauth')`);
  await ownerClient.auth.setSession({access_token:verified.data.access_token,refresh_token:verified.data.refresh_token});
  const refreshed=await ownerClient.auth.refreshSession(); assert.equal(refreshed.error,null); ownerAal1=refreshed.data.session.access_token;
  const factor=await ownerClient.auth.mfa.enroll({factorType:'totp',friendlyName:'Local QA factor'});assert.equal(factor.error,null);
  const challenge=await ownerClient.auth.mfa.challengeAndVerify({factorId:factor.data.id,code:totp(factor.data.totp.secret)});
  assert.equal(challenge.error,null);ownerFresh=challenge.data.access_token;
  sql(`create function private.local_fixture_security(data jsonb) returns boolean language sql immutable set search_path='' as $$ select data='{}'::jsonb $$;
    revoke all on function private.local_fixture_security(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin,authenticator;
    insert into private.campaign_type_descriptors values ('local_fixture_security',1,'local_fixture_security.enabled','local_fixture_security');`);
  const result=await rpc(stack,'admin_campaign_create',token('admin'),{payload:{type_key:'local_fixture_security',config_version:1,slug:payload.slug,title:payload.title,configuration:{}}});
  assert.equal(result.status,200); campaign=result.data.id;
  probe=await nextProbe(stack);browser=await chromium.launch({channel:'msedge',headless:true});
});
after(async()=>{
  await browser?.close();await probe?.close();await ownerClient?.auth.stopAutoRefresh();
  if(created){execFileSync(process.execPath,['scripts/admin-foundation/local-cli.mjs','db','reset','--local','--no-seed'],{stdio:'pipe'});
    for(const table of emptyCounts)assert.equal(sql('select count(*) from '+table),'0',table);
    assert.equal(sql("select count(*) from pg_proc where proname like 'local_fixture%'"),'0');
    assert.equal(sql("select count(*) from pg_roles where rolname like 'local_fixture%'"),'0');
  }
});

function actor(name){
  if(name==='anon')return undefined;
  if(name==='owner-aal1')return ownerAal1;
  if(name==='owner-fresh')return ownerFresh;
  if(name==='owner-stale')return token('owner',{aal:'aal2',amr:[{method:'oauth',timestamp:Math.floor(Date.now()/1000)},{method:'totp',timestamp:Math.floor(Date.now()/1000)-700}]});
  if(name==='owner-no-step-up')return token('owner',{aal:'aal2'});
  return token(name,{metadata:{role:'super_admin',actor_category:'scheduler',recent_mfa:true,aal:'aal2'}});
}
for(const name of ['anon','outsider','disabled','revoked','staff','admin','owner-aal1','owner-no-step-up','owner-stale','owner-fresh'])
test('cross-boundary operation matrix: '+name,async()=>{
  const t=actor(name),read=['staff','admin','owner-no-step-up','owner-stale','owner-fresh'].includes(name),manage=['admin','owner-fresh'].includes(name),owner=name==='owner-fresh';
  const prior=snapshot();
  for(const [fn,body] of [['campaign_foundation_list',{page_size:50}],['admin_campaign_types',{}],['admin_campaign_detail',{target_campaign:campaign}],['admin_campaign_window',{target_campaign:campaign}],['admin_system_flags',{}]]){
    const r=await rpc(stack,fn,t,body); if(read)assert.equal(r.status,200,fn);else assert([401,403].includes(r.status),fn+': '+r.status);
  }
  for(const [fn,body,success] of [
    ['admin_campaign_create',{payload:{type_key:'unknown_security',config_version:1,slug:'not-created',title:'Denied',configuration:{}}},400],
    ['admin_campaign_update',{target_campaign:campaign,expected_version:1,payload},200],
    ['admin_campaign_schedule',{target_campaign:campaign,expected_version:1,windows},200],
    ['admin_campaign_lifecycle',{target_campaign:campaign,expected_version:1,command_action:'reopen'},400],
  ]){const r=await rpc(stack,fn,t,body);if(manage)assert.equal(r.status,success,fn);else assert([401,403].includes(r.status),fn+': '+r.status);}
  const set=await rpc(stack,'admin_set_system_flag',t,{target_key:'campaigns.enabled',desired_enabled:false,expected_version:0});
  if(owner)assert.equal(set.status,200);else assert([401,403].includes(set.status));
  const audit=await rpc(stack,'campaign_audit_history',t,{target_campaign:campaign,page_size:50});
  assert.equal(audit.status===200,read&&name!=='staff');
  const foundation=await rpc(stack,'admin_owner_snapshot',t);assert.equal(foundation.status===200,name.startsWith('owner-')&&name!=='owner-aal1');
  assert.equal((await rpc(stack,'public_campaign_page',t,{target_slug:payload.slug})).data,null);
  const list=await probe.request('/admin/api/campaigns',{token:t});assert.equal(list.status,read?200:name==='anon'?401:403);
  const detail=await probe.request('/admin/api/campaigns/'+campaign,{token:t});assert.equal(detail.status,read?200:name==='anon'?401:403);
  for(const [route,body,accepted] of [
    ['/admin/api/campaigns',{type_key:'local_fixture_security',config_version:1,slug:'not-created',title:'Denied',configuration:{}},422],
    ['/admin/api/campaigns/'+campaign,{expectedVersion:1,...payload},422],
    ['/admin/api/campaigns/'+campaign+'/schedule',{expectedVersion:1,...windows},200],
    ['/admin/api/campaigns/'+campaign+'/lifecycle',{action:'resume',expectedVersion:1},422],
  ]){const r=await probe.request(route,{token:t,method:'POST',body});assert.equal(r.status,manage?accepted:name==='anon'?401:403,route);}
  const flags=await probe.request('/admin/api/feature-flags',{token:t});assert.equal(flags.status,read?200:name==='anon'?401:403);
  const flagCommand=await probe.request('/admin/api/feature-flags',{token:t,method:'POST',body:{key:'campaigns.enabled',enabled:false,expectedVersion:0}});
  assert.equal(flagCommand.status,owner?200:name==='anon'?401:403);
  assert.equal(snapshot(),prior,'rejected/no-op commands must not mutate version/state/audit');
});

test('unsigned claim editing fails cryptographic verification at every exposed RPC and application family',async()=>{
  const parts=token('staff').split('.');const c=claim(token('staff'));c.sub=users.owner.id;c.aal='aal2';c.session_id=users.owner.session;c.amr.push({method:'totp',timestamp:Math.floor(Date.now()/1000)});
  parts[1]=Buffer.from(JSON.stringify(c)).toString('base64url');const forged=parts.join('.'),prior=snapshot();
  for(const [fn,body] of [['campaign_foundation_list',{}],['admin_campaign_detail',{target_campaign:campaign}],['campaign_audit_history',{}],['admin_system_flags',{}],['admin_set_system_flag',{target_key:'campaigns.enabled',desired_enabled:true,expected_version:0}],['admin_owner_snapshot',{}]])assert.equal((await rpc(stack,fn,forged,body)).status,401,fn);
  for(const route of ['/admin/api/campaigns','/admin/api/campaigns/'+campaign,'/admin/api/feature-flags','/admin/api/access'])assert.equal((await probe.request(route,{token:forged})).status,401,route);
  assert.equal(snapshot(),prior);
});

test('a validly signed local subject cannot borrow another live user session ID',async()=>{
  const prior=snapshot(),other={...users.admin,session:users.staff.session},t=signedToken(stack,other);
  for(const [fn,body] of [['admin_security_state',{}],['admin_campaign_detail',{target_campaign:campaign}],['admin_campaign_update',{target_campaign:campaign,expected_version:1,payload}],['campaign_audit_history',{}],['admin_system_flags',{}]])assert.equal((await rpc(stack,fn,t,body)).status,403,fn);
  assert.equal((await probe.request('/admin/api/campaigns',{token:t})).status,403);assert.equal(snapshot(),prior);
});

test('audit scope manipulation never returns Foundation or owner flag history to admin',async()=>{
  sql(`insert into private.admin_audit_log(action,actor_aal) values ('recovery','system');`);
  assert.equal((await rpc(stack,'admin_set_system_flag',ownerFresh,{target_key:'campaigns.enabled',desired_enabled:true,expected_version:0})).status,200);
  for(const target of [null,campaign,users.owner.id,randomUUID()]){
    const r=await rpc(stack,'campaign_audit_history',token('admin'),{target_campaign:target,page_size:100});assert.equal(r.status,200);
    assert.equal(r.data.length,target===null||target===campaign?1:0);
    assert(r.data.every(e=>e.campaign_id===campaign&&e.flag_key===null&&e.action==='campaign.create'));
  }
  for(const extra of [{target_kind:'foundation'},{actor_category:'foundation'},{actor_id:users.owner.id},{include_foundation:true}])assert.notEqual((await rpc(stack,'campaign_audit_history',token('admin'),{...extra})).status,200);
  for(const limit of [0,-1,101,null])assert.equal((await rpc(stack,'campaign_audit_history',token('admin'),{page_size:limit})).status,400);
  const view=await probe.request('/admin/api/campaigns/'+campaign,{token:token('admin')});const audit=JSON.parse(view.text).audit;
  assert.equal(audit.length,1);assert(!JSON.stringify(audit).includes(users.admin.id));
  for(const e of audit)assert.deepEqual(Object.keys(e).sort(),['id','occurred_at','action','actor_category','expected_version','resulting_version'].sort());
  const owner=await rpc(stack,'admin_owner_snapshot',ownerFresh);assert.equal(owner.status,200);assert(owner.data.audit.some(e=>e.action==='recovery'));
});

test('all migration-defined functions retain safe search paths and expected minimal campaign ACLs',()=>{
  const names=[...new Set(readdirSync('supabase/migrations').flatMap(f=>[...readFileSync('supabase/migrations/'+f,'utf8').matchAll(/create(?: or replace)? function (?:private|public)\.([a-z_][a-z_0-9]*)/g)].map(m=>m[1])))];
  const functions=rows(`select n.nspname,p.proname,p.prosecdef,p.proconfig,r.rolname owner,exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE') public_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_roles r on r.oid=p.proowner where n.nspname in ('public','private') and p.proname=any(array[${names.map(quote).join(',')}])`);
  for(const name of names)assert(functions.some(f=>f.proname===name),'Missing function: '+name);
  for(const f of functions){assert(f.proconfig?.includes('search_path=""'),f.proname);assert.equal(f.public_execute,false,f.proname);if(f.prosecdef)assert.equal(f.owner,'postgres',f.proname);}
  for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator'])assert.equal(sql(`select pg_has_role('${role}','campaign_scheduler','MEMBER')`),'f');
  const executable=rows("select n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and has_function_privilege('campaign_scheduler',p.oid,'EXECUTE')");
  assert.deepEqual(executable,[{nspname:'private',proname:'reconcile_campaign_lifecycle'}]);
  assert.equal(sql("select count(*) from pg_roles where rolname='campaign_scheduler' and not rolcanlogin and not rolinherit and not rolsuper and not rolcreatedb and not rolcreaterole and not rolreplication and not rolbypassrls"),'1');
});

test('all operational raw tables remain RLS enabled, policy-free and non-writable by runtime roles',async()=>{
  for(const table of ['campaigns','campaign_type_descriptors','system_feature_flags','admin_audit_log','admin_invites']){
    assert.equal(sql(`select relrowsecurity from pg_class where oid='private.${table}'::regclass`),'t');
    assert.equal(sql(`select count(*) from pg_policy where polrelid='private.${table}'::regclass`),'0');
    for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator','campaign_scheduler'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal(sql(`select has_table_privilege('${role}','private.${table}','${privilege}')`),'f',role+':'+table+':'+privilege);
  }
  for(const role of ['anon','authenticated','campaign_scheduler'])for(const privilege of ['INSERT','UPDATE','DELETE'])assert.equal(sql(`select has_table_privilege('${role}','public.admin_profiles','${privilege}')`),'f');
  for(const role of ['anon','authenticated'])for(const table of ['campaigns','admin_audit_log'])assert.equal((await api(stack,'/rest/v1/'+table,{token:role==='authenticated'?token('admin'):undefined,headers:{'Accept-Profile':'private'}})).status,406);
});

test('actual browser refresh after kill switch removes descriptive content and stores no campaign authority',async()=>{
  const t=token('admin'),claims=claim(t);
  sql(`begin;select set_config('request.jwt.claims',${quote(JSON.stringify(claims))},true);update private.campaigns set status='open',visibility='public' where id=${quote(campaign)};commit;`);
  assert.equal((await rpc(stack,'admin_set_system_flag',ownerFresh,{target_key:'local_fixture_security.enabled',desired_enabled:true,expected_version:0})).status,200);
  const context=await browser.newContext({viewport:{width:390,height:844}});await context.route(/^https?:\/\/(?!localhost[:/]|127\.0\.0\.1[:/])/,r=>r.abort());
  const page=await context.newPage();try{
    const r=await page.goto('http://localhost:3038/kempen/'+payload.slug);assert.equal(r.status(),200);assert.match(r.headers()['cache-control'],/no-store/);
    await page.getByRole('heading',{name:payload.title,exact:true}).waitFor();assert.equal(await page.locator('form,input').count(),0);
    const storage=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));assert(!JSON.stringify(storage).includes(payload.slug));assert(!JSON.stringify(storage).includes(payload.title));
    assert.equal((await rpc(stack,'admin_set_system_flag',ownerFresh,{target_key:'campaigns.enabled',desired_enabled:false,expected_version:1})).status,200);
    assert.equal((await page.reload()).status(),404);assert.equal(await page.getByRole('heading',{name:payload.title,exact:true}).count(),0);
    await page.goto('http://localhost:3038/');assert.equal(await page.locator('.public-route-transition').getByText(payload.title,{exact:true}).count(),0);
  }finally{await context.close();}
});
