import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {localStack,fixtures,sql,rows,quote,signedToken,api,rpc,totp,dbContainer} from '../admin-foundation/local-stack.mjs';
import {nextProbe} from '../admin-foundation/local-next-probe.mjs';
let stack,users,ownerClient,ownerToken,probe,created=false;
const login='local_fixture_scheduler',outside='local_fixture_no_capability',password=randomBytes(24).toString('hex');
const token=(name,options)=>signedToken(stack,users[name],options);
const claims=t=>JSON.parse(Buffer.from(t.split('.')[1],'base64url'));
const context=t=>"select set_config('request.jwt.claims',"+quote(JSON.stringify(claims(t)))+',true);';
const tx=(query,auth=token('admin'),commit=false)=>sql('begin;'+context(auth)+query+';'+(commit?'commit;':'rollback;'));
const execute=(query,role=login)=>new Promise((resolve,reject)=>{
  const child=spawn('docker',['exec','-i','-e','PGPASSWORD='+password,dbContainer,'psql','-h','127.0.0.1','-U',role,'-d','postgres','-Atq','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
  let output='',error=''; child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>error+=b);
  child.on('error',reject);child.on('close',code=>code===0?resolve(output.trim()):reject(Error(error.split('\n').filter(l=>l.startsWith('ERROR:')).join(' '))));child.stdin.end(query);
});
const tick=(size=100)=>execute('set role campaign_scheduler;select private.reconcile_campaign_lifecycle('+size+')');
function create(status='draft',options={}) {
  const id=randomUUID();
  const opens=options.opens===undefined?(status==='scheduled'?"clock_timestamp()-interval '2 minutes'":'null'):options.opens;
  const closes=options.closes??'null';
  tx("insert into private.campaigns(id,type_key,slug,title,status,registration_opens_at,registration_closes_at) values ("+
    quote(id)+",'local_fixture',"+quote('fixture-'+id)+",'Lifecycle fixture',"+quote(status)+','+opens+','+closes+')',token('admin'),true);
  return id;
}
const row=id=>rows('select * from private.campaigns where id='+quote(id))[0];
const audits=id=>rows('select * from private.admin_audit_log where campaign_id='+quote(id)+' order by resulting_version');
const command=(id,action,version=1,auth=token('admin'))=>rpc(stack,'admin_campaign_lifecycle',auth,{target_campaign:id,command_action:action,expected_version:version});
const windowFields=['registration_opens_at','registration_closes_at','event_starts_at','event_ends_at'];
const windows=id=>Object.fromEntries(windowFields.map(k=>[k,row(id)[k]]));
const edit=(id,value,version=1,auth=token('admin'))=>rpc(stack,'admin_campaign_schedule',auth,{target_campaign:id,expected_version:version,windows:value});
async function unchanged(id,operation,status){const prior=row(id),events=audits(id);assert.equal((await operation()).status,status);assert.deepEqual(row(id),prior);assert.deepEqual(audits(id),events);}
async function ownerSession(){
  ownerClient=createClient(stack.url,stack.anon,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const link=await api(stack,'/auth/v1/admin/generate_link',{service:true,method:'POST',body:{type:'magiclink',email:users.owner.email}});assert.equal(link.status,200);
  const result=await api(stack,'/auth/v1/verify',{method:'POST',body:{token_hash:link.data.hashed_token,type:'magiclink'}});assert.equal(result.status,200);
  users.owner.session=claims(result.data.access_token).session_id;
  sql("insert into auth.mfa_amr_claims(id,session_id,created_at,updated_at,authentication_method) values ("+quote(randomUUID())+','+quote(users.owner.session)+",now(),now(),'oauth')");
  assert.equal((await ownerClient.auth.setSession({access_token:result.data.access_token,refresh_token:result.data.refresh_token})).error,null);
  assert.equal((await ownerClient.auth.refreshSession()).error,null);
  const factor=await ownerClient.auth.mfa.enroll({factorType:'totp',friendlyName:'Local lifecycle verification'});assert.equal(factor.error,null);
  const verified=await ownerClient.auth.mfa.challengeAndVerify({factorId:factor.data.id,code:totp(factor.data.totp.secret)});assert.equal(verified.error,null);ownerToken=verified.data.access_token;
}
before(async()=>{
  stack=localStack();users=fixtures();created=true;await ownerSession();
  sql("insert into public.admin_profiles(user_id,approved_email,google_subject,role,status) values ("+quote(users.other.id)+','+quote(users.other.email)+','+quote(users.other.subject)+",'admin','active')");
  sql(`create function private.local_fixture_validator(data jsonb) returns boolean language sql immutable set search_path='' as $$ select data='{}'::jsonb $$;
    revoke all on function private.local_fixture_validator(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin;
    insert into private.campaign_type_descriptors values ('local_fixture',1,'local_fixture.enabled','local_fixture_validator');
    create role ${login} login noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls password ${quote(password)};
    create role ${outside} login noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls password ${quote(password)};
    grant campaign_scheduler to ${login};`);
  probe=await nextProbe(stack);
});
after(async()=>{
  await probe?.close();await ownerClient?.auth.stopAutoRefresh();
  if(created){
    // A failed setup may precede creation of either LOGIN. DROP ROLE also
    // removes its capability membership; no role ever owns application objects.
    try {
      sql(`do $$ declare fixture_role text; begin
        foreach fixture_role in array array['${login}','${outside}'] loop
          if exists (select 1 from pg_roles where rolname=fixture_role) then
            execute format('revoke all on schema private from %I',fixture_role);
            execute format('revoke execute on function private.reconcile_campaign_lifecycle(integer) from %I',fixture_role);
            execute format('drop role %I',fixture_role);
          end if;
        end loop;
      end $$;`);
    } finally {
      execFileSync(process.execPath,['scripts/admin-foundation/local-cli.mjs','db','reset','--local','--no-seed'],{stdio:'pipe'});
    }
    for(const table of ['private.campaign_type_descriptors','private.campaigns','private.system_feature_flags','private.admin_audit_log','auth.users'])assert.equal(sql('select count(*) from '+table),'0');
    assert.equal(sql("select count(*) from pg_roles where rolname like 'local_fixture%'"),'0');
  }
});
const allowed={draft:{schedule:'scheduled',open:'open',archive:'archived'},scheduled:{unschedule:'draft',open:'open',close:'closed'},open:{pause:'paused',close:'closed'},paused:{resume:'open',close:'closed'},closed:{archive:'archived'},archived:{}};
for(const [from,actions] of Object.entries(allowed))for(const action of ['schedule','unschedule','open','pause','resume','close','archive']){
  test(from+' '+action+' '+(actions[action]?'allowed':'denied'),async()=>{
    const id=create(from,action==='schedule'?{opens:"clock_timestamp()+interval '1 hour'"}:{});
    if(!actions[action])return unchanged(id,()=>command(id,action),400);
    const result=await command(id,action);assert.equal(result.status,200);assert.equal(result.data.status,actions[action]);assert.equal(result.data.version,2);
    const event=audits(id)[0];assert.equal(event.action,'lifecycle.'+action);assert.equal(event.expected_version,1);assert.equal(event.resulting_version,2);
    if(['schedule','unschedule'].includes(action))assert(event.metadata.planned_at);
    assert.equal(event.actor_id,users.admin.id);assert.equal(event.metadata.cause,'manager');assert.equal(event.metadata.from_status,from);assert.equal(event.metadata.to_status,actions[action]);
    assert.equal(row(id).updated_actor_category,'user');assert.equal(row(id).updated_by,users.admin.id);
  });
}
for(const [label,state,action,options] of [
  ['schedule missing opens','draft','schedule',{}],['schedule due opens','draft','schedule',{opens:"clock_timestamp()-interval '1 minute'"}],
  ['open future draft','draft','open',{opens:"clock_timestamp()+interval '1 hour'"}],['open future scheduled','scheduled','open',{opens:"clock_timestamp()+interval '1 hour'"}],
  ['open expired','scheduled','open',{closes:"clock_timestamp()-interval '1 minute'"}],['resume expired','paused','resume',{closes:"clock_timestamp()-interval '1 minute'"}],
  ['resume future','paused','resume',{opens:"clock_timestamp()+interval '1 hour'"}],
])test(label,async()=>{const id=create(state,options);await unchanged(id,()=>command(id,action),400);});
test('manual null-close/null-opens resume and unschedule retaining dates',async()=>{
  const id=create('paused');assert.equal((await command(id,'resume')).status,200);
  const scheduled=create('scheduled'),before=windows(scheduled);assert.equal((await command(scheduled,'unschedule')).status,200);assert.deepEqual(windows(scheduled),before);assert(row(scheduled).slug_locked_at);
});
for(const name of [null,'outsider','disabled','revoked','staff','owner'])test('direct lifecycle authorization '+(name??'anon'),async()=>{
  const id=create();await unchanged(id,()=>command(id,'open',1,name?token(name):null),name?403:401);
  await unchanged(id,()=>edit(id,windows(id),1,name?token(name):null),name?403:401);
});
test('owner real Auth TOTP accepted; stale/missing signed evidence denied',async()=>{
  const id=create();assert.equal(claims(ownerToken).aal,'aal2');assert.equal((await command(id,'open',1,ownerToken)).status,200);
  for(const amr of [[{method:'oauth'}],[{method:'oauth'},{method:'totp',timestamp:Math.floor(Date.now()/1000)-601}]]){
    const next=create();await unchanged(next,()=>command(next,'open',1,token('owner',{aal:'aal2',amr})),403);
  }
});
test('metadata/actor/action forgery and direct raw mutation stay denied',async()=>{
  const id=create();await unchanged(id,()=>command(id,'open',1,token('staff',{metadata:{role:'super_admin',actor_category:'scheduler'}})),403);
  await unchanged(id,()=>command(id,'paused'),400);
  for(const endpoint of ['/rest/v1/campaigns','/rest/v1/admin_audit_log'])assert.notEqual((await api(stack,endpoint,{token:token('admin'),method:'PATCH',body:{status:'open',updated_actor_category:'scheduler'}})).status,200);
  assert.equal((await api(stack,'/rest/v1/campaigns',{token:token('admin'),headers:{'Accept-Profile':'private'}})).status,406);
});
for(const state of ['draft','scheduled','open','paused'])test('schedule edit '+state+' and date no-op',async()=>{
  const id=create(state),before=windows(id);const body={...before,event_starts_at:'2027-01-01T00:00:00Z',event_ends_at:'2027-01-02T00:00:00Z'};
  const result=await edit(id,body);assert.equal(result.status,200);assert.equal(result.data.status,state);assert.equal(result.data.version,2);assert.equal(audits(id)[0].action,'schedule.change');
  const noop=await edit(id,body,2);assert.equal(noop.status,200);assert.equal(noop.data.changed,false);assert.equal(audits(id).length,1);
});
for(const state of ['closed','archived'])test(state+' schedule immutable',async()=>{const id=create(state);await unchanged(id,()=>edit(id,windows(id)),400);});
for(const state of ['open','paused'])test(state+' opens historical',async()=>{const id=create(state);await unchanged(id,()=>edit(id,{...windows(id),registration_opens_at:'2020-01-01T00:00:00Z'}),400);});
for(const state of ['scheduled','open','paused']){
  test(state+' changed schedule due closes atomically with consecutive audit versions',async()=>{
    const id=create(state),body={...windows(id),registration_closes_at:new Date(Date.now()-30000).toISOString()};
    const result=await edit(id,body);assert.equal(result.status,200);assert.equal(result.data.status,'closed');assert.equal(result.data.version,3);
    const events=audits(id);assert.equal(events.length,2);assert.deepEqual(events.map(e=>e.action),['schedule.change','lifecycle.close']);assert.equal(events[0].request_id,events[1].request_id);
    assert.equal(events[1].expected_version,2);assert.equal(events[1].metadata.cause,'schedule_edit_deadline');
  });
  test(state+' identical due schedule closes with only close audit',async()=>{
    const id=create(state,{closes:"clock_timestamp()-interval '1 minute'"});await expiredEditCloses(id,windows(id));
  });
}
for(const bad of ['date-only','no-zone','reversed','extra','missing','invalid','infinity','scheduled-null'])test('schedule rejects '+bad,async()=>{
  const id=create(bad==='scheduled-null'?'scheduled':'draft'),body=windows(id);
  if(bad==='date-only')body.event_starts_at='2027-01-01';if(bad==='no-zone')body.event_starts_at='2027-01-01T00:00:00';
  if(bad==='reversed'){body.event_starts_at='2027-02-01T00:00:00Z';body.event_ends_at='2027-01-01T00:00:00Z';}
  if(bad==='extra')body.actor_category='scheduler';if(bad==='missing')delete body.event_starts_at;
  if(bad==='invalid')body.event_starts_at='2027-99-99T00:00:00Z';if(bad==='infinity')body.event_starts_at='infinity';
  if(bad==='scheduled-null')body.registration_opens_at=null;
  await unchanged(id,()=>edit(id,body),400);
});
test('due opening edit does not auto-open, then scheduler commits opening',async()=>{
  const id=create('scheduled',{opens:"clock_timestamp()+interval '1 hour'"});const body={...windows(id),registration_opens_at:'2020-01-01T00:00:00Z'};
  assert.equal((await edit(id,body)).data.status,'scheduled');const evaluation=await rpc(stack,'admin_campaign_window',token('staff'),{target_campaign:id});assert.equal(evaluation.data.registrationAvailable,false);
  await tick();assert.equal(row(id).status,'open');
});
test('authoritative expired open is unavailable before scheduler',async()=>{
  const id=create('open',{closes:"clock_timestamp()-interval '1 minute'"});const result=await rpc(stack,'admin_campaign_window',token('staff'),{target_campaign:id});assert.equal(result.status,200);assert.equal(result.data.status,'open');assert.equal(result.data.registrationAvailable,false);
});
test('capability NOLOGIN attributes, ownership and exact ACL boundary',async()=>{
  const role=rows("select rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls from pg_roles where rolname='campaign_scheduler'")[0];assert(Object.values(role).every(v=>v===false));
  const owner=sql("select pg_get_userbyid(proowner) from pg_proc where oid='private.reconcile_campaign_lifecycle(integer)'::regprocedure");assert.equal(owner,'postgres');assert.notEqual(owner,'campaign_scheduler');
  for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator']){
    assert.equal(sql('select pg_has_role('+quote(role)+",'campaign_scheduler','MEMBER')"),'f');
    assert.equal(sql('select has_function_privilege('+quote(role)+",'private.reconcile_campaign_lifecycle(integer)','EXECUTE')"),'f');
  }
  assert.equal(sql("select has_table_privilege('campaign_scheduler','private.campaigns','UPDATE')"),'f');
  assert.equal(sql("select has_schema_privilege('campaign_scheduler','private','CREATE')"),'f');
  assert.equal(sql("select has_function_privilege('campaign_scheduler','private.campaign_lifecycle_command(uuid,text,integer)','EXECUTE')"),'f');
  assert.equal(sql("select has_function_privilege('campaign_scheduler','private.reconcile_campaign_lifecycle(integer)','EXECUTE')"),'t');
  for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator'])assert.throws(()=>sql('begin;set local role '+role+';set local role campaign_scheduler;rollback;'),/permission denied/);
});
test('real disposable LOGIN executor gets definer privilege but not code ownership',async()=>{
  assert.equal(await execute('select session_user'),login);
  await tick();
  await assert.rejects(execute('alter function private.reconcile_campaign_lifecycle(integer) rename to hacked'),/must be owner|permission denied/);
  await assert.rejects(execute('set role campaign_scheduler;alter function private.reconcile_campaign_lifecycle(integer) rename to hacked'),/must be owner|permission denied/);
});
test('null-auth/current_user/GUC/JWT forgery is not scheduler authority',async()=>{
  assert.throws(()=>sql("select set_config('request.jwt.claims','{}',false);select set_config('campaign.scheduler','true',false);select private.reconcile_campaign_lifecycle(1)"),/Scheduler capability required/);
  // Grant EXECUTE temporarily to an untrusted LOGIN to test the independent
  // session_user guard inside SECURITY DEFINER, even if an outer ACL were wrong.
  sql('grant usage on schema private to '+outside+';grant execute on function private.reconcile_campaign_lifecycle(integer) to '+outside);
  try{await assert.rejects(execute("select set_config('request.jwt.claims','{\"role\":\"campaign_scheduler\",\"actor_category\":\"scheduler\"}',false);select set_config('campaign.scheduler','true',false);select private.reconcile_campaign_lifecycle(1)",outside),/Scheduler capability required/);}
  finally{sql('revoke execute on function private.reconcile_campaign_lifecycle(integer) from '+outside+';revoke usage on schema private from '+outside);}
});
for(const operation of ["update private.campaigns set status='paused'","update private.campaigns set status='archived'","update private.campaigns set registration_closes_at=null","update private.system_feature_flags set enabled=true","update public.admin_profiles set role='super_admin'","select private.campaign_lifecycle_command(null,'pause',1)"])
  test('scheduler no general privilege '+operation,async()=>assert.rejects(execute(operation),/permission denied/));
test('close priority and total batch cap, missed windows, paused expiry and attribution',async()=>{
  await tick();
  const ids=[create('scheduled',{closes:"clock_timestamp()-interval '1 minute'"}),create('open',{closes:"clock_timestamp()-interval '1 minute'"}),create('paused',{closes:"clock_timestamp()-interval '1 minute'"})];
  const open=create('scheduled'),paused=create('paused'),draft=create('draft');
  const result=JSON.parse(await tick(2));assert.deepEqual(result,{closed:2,opened:0,processed:2});assert.equal(row(open).status,'scheduled');
  const second=JSON.parse(await tick(2));assert.deepEqual(second,{closed:1,opened:1,processed:2});
  for(const id of ids){const c=row(id);assert.equal(c.status,'closed');assert.equal(c.updated_actor_category,'scheduler');assert.equal(c.updated_by,null);assert.equal(c.created_by,users.admin.id);
    const event=audits(id)[0];assert.equal(event.actor_id,null);assert.equal(event.actor_aal,'system');assert.equal(event.actor_category,'scheduler');assert.equal(event.metadata.cause,id===ids[0]?'missed_window':'deadline');assert(event.metadata.planned_at);}
  assert.equal(row(open).status,'open');assert.equal(row(paused).status,'paused');assert.equal(row(draft).status,'draft');
  assert.deepEqual(JSON.parse(await tick()),{closed:0,opened:0,processed:0});
});
for(const size of [0,101,-1,null])test('invalid scheduler batch '+size,async()=>assert.rejects(tick(size===null?'null':size),/Invalid batch/));
test('terminal/draft/paused and null-close unaffected; no flag side effects',async()=>{
  const ids=['draft','paused','closed','archived'].map(s=>create(s,{closes:s==='paused'?'null':"clock_timestamp()-interval '1 minute'"}));const before=ids.map(row);
  await tick();assert.deepEqual(ids.map(row),before);assert.equal(sql('select count(*) from private.system_feature_flags'),'0');
  const flag=await rpc(stack,'admin_set_system_flag',ownerToken,{target_key:'campaigns.enabled',desired_enabled:true,expected_version:0});assert.equal(flag.status,200);
  const id=create('scheduled'),saved=row(id);assert.equal((await rpc(stack,'admin_set_system_flag',ownerToken,{target_key:'campaigns.enabled',desired_enabled:false,expected_version:1})).status,200);assert.deepEqual(row(id),saved);
  await tick();assert.equal(row(id).status,'open');assert.equal(sql("select enabled from private.system_feature_flags where flag_key='campaigns.enabled'"),'f');assert.equal(sql("select version from private.system_feature_flags where flag_key='campaigns.enabled'"),'2');
});
test('actor constraint inverse and manual resets scheduler attribution',async()=>{
  const id=create('scheduled');await tick();assert.equal(row(id).updated_by,null);assert.equal((await command(id,'pause',2)).status,200);assert.equal(row(id).updated_actor_category,'user');assert.equal(row(id).updated_by,users.admin.id);
  for(const update of ["updated_actor_category='scheduler',updated_by="+quote(users.admin.id),"updated_actor_category='user',updated_by=null","updated_actor_category='forged'"])
    assert.throws(()=>tx('alter table private.campaigns disable trigger campaign_row_guard;update private.campaigns set '+update+' where id='+quote(id)),/campaign_update_actor_check/);
});
test('controlled causes reject unknown/sensitive shapes; old audits remain valid',()=>{
  for(const from of ['draft','scheduled'])assert.equal(sql("select private.campaign_audit_metadata_valid('lifecycle.open',"+quote(JSON.stringify({from_status:from,to_status:'open',cause:'deadline'}))+')'),from==='scheduled'?'t':'f');
  for(const [data,valid] of [[{from_status:'open',to_status:'closed'},true],[{from_status:'open',to_status:'closed',cause:'manager'},true],
    [{from_status:'open',to_status:'closed',cause:'missed_window'},false],[{from_status:'open',to_status:'closed',cause:'secret reason'},false],[{from_status:'open',to_status:'closed',email:'private@example.test'},false]])
    assert.equal(sql("select private.campaign_audit_metadata_valid('lifecycle.close',"+quote(JSON.stringify(data))+')'),valid?'t':'f');
});
async function fault(operation){
  sql("create function private.local_fixture_audit_failure() returns trigger language plpgsql as $$begin if new.action like 'lifecycle.%' then raise exception 'Forced lifecycle audit failure';end if;return new;end$$;create trigger local_fixture_audit_failure before insert on private.admin_audit_log for each row execute function private.local_fixture_audit_failure()");
  try{await operation();}finally{sql('drop trigger local_fixture_audit_failure on private.admin_audit_log;drop function private.local_fixture_audit_failure()');}
}
test('manual/schedule atomic audit failure rolls back both versions and schedule',async()=>{
  const id=create(),schedule=create('open');const before=row(schedule);await fault(async()=>{
    await unchanged(id,()=>command(id,'open'),400);
    await unchanged(schedule,()=>edit(schedule,{...windows(schedule),registration_closes_at:new Date(Date.now()-1000).toISOString()}),400);
  });assert.deepEqual(row(schedule),before);
});
test('scheduler audit failure rolls back entire tick',async()=>{
  const id=create('scheduled'),before=row(id);await fault(async()=>assert.rejects(tick(),/Forced lifecycle audit failure/));assert.deepEqual(row(id),before);assert.equal(audits(id).length,0);await tick();
});
test('two managers same expected version: one transition/audit, one conflict',async()=>{
  const id=create();const results=await Promise.all([command(id,'open'),command(id,'open',1,token('other'))]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(audits(id).length,1);
});
for(const [name,status,action,options] of [
  ['manual open vs scheduler','scheduled','open',{}],['manual close vs scheduler','open','close',{closes:"clock_timestamp()-interval '1 minute'"}],
  ['pause vs deadline','open','pause',{closes:"clock_timestamp()-interval '1 minute'"}],['resume vs deadline','paused','resume',{closes:"clock_timestamp()-interval '1 minute'"}],
  ['unschedule vs open','scheduled','unschedule',{}],
])test('race '+name,async()=>{
  await tick();const id=create(status,options);const [manual]=await Promise.all([command(id,action),tick()]);assert([200,400,409].includes(manual.status));
  const events=audits(id);assert.equal(new Set(events.map(e=>e.resulting_version)).size,events.length);assert.equal(row(id).version,events.length+1);
  if(name.includes('deadline')||name.includes('close')){await tick();assert.equal(row(id).status,'closed');}else if(name.includes('unschedule'))assert(['draft','open'].includes(row(id).status));else assert.equal(row(id).status,'open');
});
test('schedule edit vs scheduler serializes with version check and no duplicate audit',async()=>{
  await tick();const id=create('scheduled');const [manager]=await Promise.all([edit(id,{...windows(id),registration_opens_at:'2030-01-01T00:00:00Z'}),tick()]);
  assert([200,409,400].includes(manager.status));assert.equal(audits(id).length,1);assert.equal(row(id).version,2);
});
test('overlapping scheduler ticks serialize/skip locked with one audit',async()=>{
  await tick();const id=create('scheduled');await Promise.all([tick(),tick()]);assert.equal(row(id).status,'open');assert.equal(audits(id).length,1);
});
test('DB clock rechecked after manual row lock waits',async()=>{
  const id=create('paused',{closes:"clock_timestamp()+interval '2 seconds'"});
  let locked;
  const ready=new Promise(r=>locked=r);
  const blocker=spawn('docker',['exec','-i',dbContainer,'psql','-U','postgres','-d','postgres','-Atq','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
  let output='';blocker.stdout.on('data',b=>{output+=b;if(output.includes('LOCK_READY'))locked();});
  const done=new Promise((resolve,reject)=>{blocker.on('close',code=>code===0?resolve():reject(Error('Local lock probe failed')));});
  blocker.stdin.end('begin;select id from private.campaigns where id='+quote(id)+" for update;select 'LOCK_READY';select pg_sleep(3);commit;");
  await ready;await unchanged(id,()=>command(id,'resume'),400);await done;
});
test('admin safe projection excludes Foundation/flag and staff history denied',async()=>{
  const history=await rpc(stack,'campaign_audit_history',token('admin'));assert.equal(history.status,200);assert(history.data.length>0);assert(history.data.every(e=>e.campaign_id && !e.flag_key && !e.action.startsWith('member.') && !e.action.startsWith('invite.')));
  assert.equal((await rpc(stack,'campaign_audit_history',token('staff'))).status,403);
});
for(const route of ['lifecycle','schedule'])test('real Next route '+route+' authorization/input/same-origin/bounded body',async()=>{
  const id=create(),url='/admin/api/campaigns/'+id+'/'+route;
  const body=route==='lifecycle'?{action:'open',expectedVersion:1}:{...windows(id),event_starts_at:'2027-01-01T00:00:00Z',expectedVersion:1};
  const denied=await probe.request(url,{token:token('staff'),method:'POST',body});assert.equal(denied.status,403);assert.equal(row(id).version,1);
  const good=await probe.request(url,{token:token('admin'),method:'POST',body});assert.equal(good.status,200);assert.match(good.headers.get('cache-control'),/no-store/);
  const prior=row(id),events=audits(id);
  const session={access_token:ownerToken,refresh_token:'fixture-no-refresh',expires_at:claims(ownerToken).exp,user:{id:users.owner.id,email:users.owner.email}};
  const headers={Cookie:'sb-127-auth-token=base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),Origin:'http://localhost:3038','Content-Type':'application/json'};
  for(const [override,raw,status] of [[{Origin:null},JSON.stringify(body),403],[{Origin:'https://foreign.example'},JSON.stringify(body),403],[{'Sec-Fetch-Site':'cross-site'},JSON.stringify(body),403],[{'Content-Type':'text/plain'},JSON.stringify(body),422],[{},'x'.repeat(1025),422],[{},'{',422],[{},JSON.stringify({...body,status:'open'}),422]]){
    const h=Object.fromEntries(Object.entries({...headers,...override}).filter(([,v])=>v!==null));const response=await fetch('http://localhost:3038'+url,{method:'POST',headers:h,body:raw});assert.equal(response.status,status);
    assert.deepEqual(row(id),prior);assert.deepEqual(audits(id),events);
  }
});
test('stale/duplicate retry cannot create another lifecycle or schedule audit',async()=>{
  const id=create();assert.equal((await command(id,'open')).status,200);
  await unchanged(id,()=>command(id,'open',1),409);await unchanged(id,()=>command(id,'open',2),400);
  await unchanged(id,()=>edit(id,windows(id),1),409);
});
test('scheduler LOGIN cannot change original session identity or invoke unrelated private functions',async()=>{
  await assert.rejects(execute('set session authorization postgres'),/permission denied|must be superuser/);
  for(const call of ["private.scheduler_caller()","private.require_owner(true)","private.campaign_schedule_command(null,1,'{}')","private.system_feature_flag_set('campaigns.enabled',true,0)"])
    await assert.rejects(execute('set role campaign_scheduler;select '+call),/permission denied/);
});
test('safe window evaluator denies outsiders/inactive/anon and permits active staff/admin',async()=>{
  const id=create('open');
  for(const name of [null,'outsider','disabled','revoked','staff','admin']){
    const response=await rpc(stack,'admin_campaign_window',name?token(name):null,{target_campaign:id});assert.equal(response.status,name===null?401:['staff','admin'].includes(name)?200:403);
    if(response.status===200)assert.equal(response.data.registrationAvailable,true);
  }
});
test('direct private implementation/scheduler is not exposed by PostgREST',async()=>{
  for(const name of ['scheduler_caller','reconcile_campaign_lifecycle','campaign_lifecycle_event'])assert.equal((await rpc(stack,name,token('admin'))).status,404);
  assert.equal((await api(stack,'/rest/v1/rpc/reconcile_campaign_lifecycle',{method:'POST',token:token('admin'),body:{batch_size:1},headers:{'Content-Profile':'private'}})).status,406);
});
test('trusted row guard also rejects forbidden nonterminal edge and future open',()=>{
  const id=create('draft',{opens:"clock_timestamp()+interval '1 hour'"});
  assert.throws(()=>tx("update private.campaigns set status='closed' where id="+quote(id)),/Invalid lifecycle transition/);
  assert.throws(()=>tx("update private.campaigns set status='open' where id="+quote(id)),/Invalid lifecycle window/);
});

test('scheduler attribution ignores JWT/user actor claims and relies on original LOGIN membership',async()=>{
  const id=create('scheduled');
  await execute("set role campaign_scheduler;select set_config('request.jwt.claims',"+quote(JSON.stringify(claims(token('staff'))))+",false);select set_config('campaign.actor_category','user',false);select private.reconcile_campaign_lifecycle(100)");
  assert.equal(row(id).status,'open');assert.equal(row(id).updated_actor_category,'scheduler');assert.equal(row(id).updated_by,null);
  assert.equal(audits(id)[0].actor_category,'scheduler');assert.equal(audits(id)[0].actor_id,null);
});

// Expired persisted deadlines must close before ANY proposed windows can persist.
async function expiredEditCloses(id,proposal) {
  const before=row(id),stored=Object.fromEntries(windowFields.map(k=>[k,before[k]]));
  const planned=sql("select to_char(registration_closes_at at time zone 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') from private.campaigns where id="+quote(id));
  const result=await edit(id,proposal,before.version);
  assert.equal(result.status,200);assert.deepEqual(result.data,{id,status:'closed',version:before.version+1,changed:true});
  assert.deepEqual(windows(id),stored);assert.equal(row(id).version,before.version+1);assert.equal(row(id).updated_actor_category,'user');assert.equal(row(id).updated_by,users.admin.id);
  const events=audits(id);assert.equal(events.length,1);const event=events[0];
  assert.equal(event.action,'lifecycle.close');assert.equal(event.expected_version,before.version);assert.equal(event.resulting_version,before.version+1);
  assert.equal(event.actor_id,users.admin.id);assert.equal(event.actor_category,'user');
  assert.deepEqual(event.metadata,{from_status:before.status,to_status:'closed',cause:'schedule_edit_deadline',planned_at:planned});
}
for(const state of ['open','paused','scheduled']) {
  for(const change of ['future extension','further past close','unrelated event dates'])test(state+' expired persisted deadline ignores '+change,async()=>{
    const id=create(state,{closes:"clock_timestamp()-interval '1 minute'"}),proposal=windows(id);
    if(change==='future extension')proposal.registration_closes_at=new Date(Date.now()+3600000).toISOString();
    if(change==='further past close')proposal.registration_closes_at=new Date(Date.parse(proposal.registration_closes_at)-15000).toISOString();
    if(change==='unrelated event dates'){proposal.event_starts_at='2027-01-01T00:00:00Z';proposal.event_ends_at='2027-01-02T00:00:00Z';}
    await expiredEditCloses(id,proposal);
  });
  test(state+' future persisted deadline permits later future extension',async()=>{
    const id=create(state,{closes:"clock_timestamp()+interval '1 hour'"}),before=windows(id),proposal={...before,registration_closes_at:new Date(Date.now()+7200000).toISOString()};
    const result=await edit(id,proposal);assert.equal(result.status,200);assert.deepEqual(result.data,{id,status:state,version:2,changed:true});
    assert.equal(Date.parse(windows(id).registration_closes_at),Date.parse(proposal.registration_closes_at));
    for(const key of windowFields.filter(k=>k!=='registration_closes_at'))assert.equal(windows(id)[key],before[key]);
    const events=audits(id);assert.equal(events.length,1);assert.equal(events[0].action,'schedule.change');assert.equal(events[0].expected_version,1);assert.equal(events[0].resulting_version,2);
    assert.equal(Date.parse(events[0].metadata.before_closes_at),Date.parse(before.registration_closes_at));assert.equal(Date.parse(events[0].metadata.after_closes_at),Date.parse(proposal.registration_closes_at));
  });
  test(state+' scheduler-late and scheduler-first have the same closed lifecycle truth',async()=>{
    await tick();const early=create(state,{closes:"clock_timestamp()-interval '1 minute'"}),earlyWindows=windows(early);
    await tick();assert.equal(row(early).status,'closed');
    await unchanged(early,()=>edit(early,{...earlyWindows,registration_closes_at:new Date(Date.now()+3600000).toISOString()},2),400);
    const late=create(state,{closes:"clock_timestamp()-interval '1 minute'"}),lateWindows=windows(late);
    await expiredEditCloses(late,{...lateWindows,registration_closes_at:new Date(Date.now()+3600000).toISOString()});
    for(const id of [early,late]){assert.equal(row(id).status,'closed');assert.equal(row(id).version,2);assert.equal(audits(id).length,1);
      const evaluation=await rpc(stack,'admin_campaign_window',token('staff'),{target_campaign:id});assert.equal(evaluation.data.registrationAvailable,false);}
    assert.deepEqual(windows(early),earlyWindows);assert.deepEqual(windows(late),lateWindows);
    assert.equal(audits(early)[0].metadata.cause,state==='scheduled'?'missed_window':'deadline');
  });
  test(state+' race future extension versus scheduler due close never reopens or duplicates audit',async()=>{
    await tick();const id=create(state,{closes:"clock_timestamp()-interval '1 minute'"}),before=windows(id);
    const proposal={...before,registration_closes_at:new Date(Date.now()+3600000).toISOString()};
    const [manager]=await Promise.all([edit(id,proposal),tick()]);assert([200,409].includes(manager.status));
    assert.equal(row(id).status,'closed');assert.equal(row(id).version,2);assert.deepEqual(windows(id),before);
    const events=audits(id);assert.equal(events.length,1);const event=events[0];assert.equal(event.action,'lifecycle.close');assert.equal(event.expected_version,1);assert.equal(event.resulting_version,2);
    assert.equal(event.metadata.from_status,state);assert.equal(event.metadata.to_status,'closed');assert.equal(Date.parse(event.metadata.planned_at),Date.parse(before.registration_closes_at));
    assert.equal(event.metadata.cause,event.actor_category==='user'?'schedule_edit_deadline':state==='scheduled'?'missed_window':'deadline');
    if(manager.status===200)assert.deepEqual(manager.data,{id,status:'closed',version:2,changed:true});
  });
}
test('expired persisted close audit failure rolls back close and ignores proposed extension',async()=>{
  const id=create('open',{closes:"clock_timestamp()-interval '1 minute'"});
  await fault(async()=>unchanged(id,()=>edit(id,{...windows(id),registration_closes_at:new Date(Date.now()+3600000).toISOString()}),400));
});
test('expired persisted close keeps stale-version conflict before deadline reconciliation',async()=>{
  const id=create('open',{closes:"clock_timestamp()-interval '1 minute'"});
  await unchanged(id,()=>edit(id,{...windows(id),registration_closes_at:new Date(Date.now()+3600000).toISOString()},2),409);
});
test('schedule extension rechecks persisted deadline after campaign lock wait',async()=>{
  const id=create('open',{closes:"clock_timestamp()+interval '2 seconds'"}),proposal={...windows(id),registration_closes_at:new Date(Date.now()+3600000).toISOString()};
  let locked;const ready=new Promise(resolve=>locked=resolve);
  const blocker=spawn('docker',['exec','-i',dbContainer,'psql','-U','postgres','-d','postgres','-Atq','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
  let output='';blocker.stdout.on('data',b=>{output+=b;if(output.includes('LOCK_READY'))locked();});
  const done=new Promise((resolve,reject)=>{blocker.on('error',reject);blocker.on('close',code=>code===0?resolve():reject(Error('Local lock probe failed')));});
  blocker.stdin.end('begin;select id from private.campaigns where id='+quote(id)+" for update;select 'LOCK_READY';select pg_sleep(3);commit;");
  try{await ready;await expiredEditCloses(id,proposal);}finally{await done;}
});
