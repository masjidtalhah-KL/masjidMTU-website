import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {database,fixtures,asUser,root,ids,sessions} from '../admin-foundation/database.mjs';
let db,previous,functions,previousCampaign;
const query=`select n.nspname,p.proname,pg_get_functiondef(p.oid) as definition,p.proacl::text as acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') order by p.oid`;
before(async()=>{
  db=await database({migrationThrough:'20261008155719'});await fixtures(db);
  await asUser(db,'owner',"select public.admin_create_invite('local-upgrade@example.test','staff')");
  await asUser(db,'owner',"select public.admin_set_system_flag('campaigns.enabled',true,0)");
  await db.exec("create function private.local_upgrade_validator(data jsonb) returns boolean language sql immutable set search_path='' as $$select data='{}'::jsonb$$;revoke all on function private.local_upgrade_validator(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin;insert into private.campaign_type_descriptors values ('local_upgrade',1,'local_upgrade.enabled','local_upgrade_validator')");
  await db.exec('begin');
  await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:ids.admin,role:'authenticated',session_id:sessions.admin,aal:'aal1',amr:[{method:'oauth',timestamp:Math.floor(Date.now()/1000)}]})]);
  await db.exec("insert into private.campaigns(type_key,slug,title) values ('local_upgrade','local-upgrade','Local upgrade');select private.record_campaign_event('campaign.create',(select id from private.campaigns),null,0,1,'{\"to_status\":\"draft\"}');update private.campaigns set status='open';select private.record_campaign_event('lifecycle.open',(select id from private.campaigns),null,1,2,'{\"from_status\":\"draft\",\"to_status\":\"open\"}');commit");
  previousCampaign=(await db.query('select * from private.campaigns')).rows[0];
  previous=(await db.query('select * from private.admin_audit_log order by id')).rows;
  functions=(await db.query(query)).rows;
  await db.exec(await readFile(path.join(root,'supabase/migrations/20261008234824_campaign_lifecycle.sql'),'utf8'));
});
after(async()=>db?.close());
test('7.3 additive upgrade preserves all Foundation/flag audit values',async()=>assert.deepEqual((await db.query('select * from private.admin_audit_log order by id')).rows,previous));
test('7.3 preserves all existing function definitions/ACLs except two reviewed campaign guards',async()=>{
  const after=(await db.query(query)).rows;
  for(const fn of functions)if(!['campaign_row_guard','campaign_audit_metadata_valid'].includes(fn.proname))assert.deepEqual(after.find(f=>f.nspname===fn.nspname&&f.proname===fn.proname),fn);
});
test('7.3 upgrade adds no descriptors/campaigns and retains existing operational flag',async()=>{
  assert.equal((await db.query('select count(*)::int n from private.campaign_type_descriptors')).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int n from private.campaigns')).rows[0].n,1);
  assert.equal((await asUser(db,'admin','select public.admin_system_flags() as flags')).rows[0].flags[0].enabled,true);
});
test('7.3 keeps Foundation and flags owner-only, campaign admin/staff audit boundary',async()=>{
  for(const name of ['admin','staff']){
    await assert.rejects(asUser(db,name,'select public.admin_owner_snapshot()'),e=>e.code==='42501');
    await assert.rejects(asUser(db,name,"select public.admin_set_system_flag('campaigns.enabled',false,1)"),e=>e.code==='42501');
  }
  assert((await asUser(db,'admin','select public.campaign_audit_history() as events')).rows[0].events.every(e=>e.campaign_id && !e.flag_key));
  await assert.rejects(asUser(db,'staff','select public.campaign_audit_history()'),e=>e.code==='42501');
});
test('7.3 audit remains append-only and lifecycle causes remain closed',async()=>{
  await assert.rejects(db.exec('delete from private.admin_audit_log'),e=>e.code==='42501');
  await assert.rejects(db.exec("update private.admin_audit_log set action='recovery'"),e=>e.code==='42501');
  for(const [action,data,valid] of [['lifecycle.schedule',{from_status:'draft',to_status:'scheduled',cause:'manager'},true],
    ['lifecycle.unschedule',{from_status:'scheduled',to_status:'draft',cause:'manager'},true],
    ['lifecycle.schedule',{from_status:'draft',to_status:'scheduled',cause:'scheduler'},false],
    ['lifecycle.open',{from_status:'draft',to_status:'open',cause:'deadline'},false],['lifecycle.open',{from_status:'scheduled',to_status:'open',cause:'deadline'},true],['lifecycle.close',{from_status:'open',to_status:'closed'},true]])assert.equal((await db.query('select private.campaign_audit_metadata_valid($1,$2) as ok',[action,JSON.stringify(data)])).rows[0].ok,valid);
});
test('7.3 scheduler capability has no runtime membership/EXECUTE or table grants',async()=>{
  for(const role of ['anon','authenticated','service_role','supabase_auth_admin']){
    assert.equal((await db.query("select pg_has_role($1,'campaign_scheduler','MEMBER') as ok",[role])).rows[0].ok,false);
    assert.equal((await db.query("select has_function_privilege($1,'private.reconcile_campaign_lifecycle(integer)','EXECUTE') as ok",[role])).rows[0].ok,false);
  }
  assert.equal((await db.query("select has_table_privilege('campaign_scheduler','private.campaigns','UPDATE') as ok")).rows[0].ok,false);
});

test('7.3 preserves pre-existing campaigns and backfills truthful user attribution only',async()=>{
  const current=(await db.query('select * from private.campaigns')).rows[0];
  for(const key of Object.keys(previousCampaign))assert.deepEqual(current[key],previousCampaign[key]);
  assert.equal(current.updated_actor_category,'user');assert.equal(current.updated_by,ids.admin);assert.equal(current.created_by,ids.admin);
});
