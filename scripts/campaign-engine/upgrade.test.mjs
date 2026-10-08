import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { database, fixtures, asUser, root } from '../admin-foundation/database.mjs';

// Supplementary PostgreSQL/PGlite upgrade contracts, with explicitly stubbed Auth.
// Real local reset/Auth/PostgREST evidence is in local-database.test.mjs.
let db, previousRows, previousFunctions;
const foundationFunctions = `select n.nspname,p.proname,pg_get_functiondef(p.oid) as definition,p.proacl::text as acl
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('private','public') order by n.nspname,p.proname`;
before(async () => {
  db = await database({migrationThrough:'20261006000100'}); await fixtures(db);
  await asUser(db,'owner',"select public.admin_create_invite('upgrade@example.test','staff')");
  await db.exec("insert into private.admin_audit_log(action,actor_aal) values ('bootstrap','system'),('recovery','system')");
  previousRows = (await db.query('select * from private.admin_audit_log order by id')).rows;
  previousFunctions = (await db.query(foundationFunctions)).rows;
  await db.exec(await readFile(path.join(root,'supabase/migrations/20261008102157_campaign_database_foundation.sql'),'utf8'));
});
after(async () => { await db?.close(); });
test('additive upgrade preserves all original audit values and function definitions/ACLs', async () => {
  const rows = (await db.query('select * from private.admin_audit_log order by id')).rows;
  assert.equal(rows.length,previousRows.length);
  for (let i=0;i<rows.length;i++) {
    for (const key of Object.keys(previousRows[i])) assert.deepEqual(rows[i][key],previousRows[i][key]);
    assert.equal(rows[i].target_kind,'foundation'); assert.equal(rows[i].actor_category,'foundation');
    assert.deepEqual(rows[i].metadata,{});
  }
  const current = (await db.query(foundationFunctions)).rows;
  for (const fn of previousFunctions) assert.deepEqual(current.find(row=>row.nspname===fn.nspname && row.proname===fn.proname),fn);
});
test('upgrade keeps foundation management/security audit owner-only', async () => {
  for (const user of ['staff','admin']) {
    await assert.rejects(asUser(db,user,'select public.admin_owner_snapshot()'),e=>e.code==='42501');
    await assert.rejects(asUser(db,user,"select public.admin_create_invite('denied@example.test','staff')"),e=>e.code==='42501');
  }
  const result = await asUser(db,'admin','select public.campaign_audit_history() as history');
  assert.deepEqual(result.rows[0].history,[]);
  assert((await asUser(db,'owner','select public.admin_owner_snapshot() as data')).rows[0].data.audit.length > 0);
});
test('legacy and new audit remain append-only after upgrade', async () => {
  await assert.rejects(db.exec("update private.admin_audit_log set action='recovery'"),e=>e.code==='42501');
  await assert.rejects(db.exec('delete from private.admin_audit_log'),e=>e.code==='42501');
});
test('event-specific audit metadata validates typed safe fields and rejects sensitive or contradictory forms', async () => {
  for (const [action,metadata,expected] of [
    ['campaign.create',{config_version:1,visibility:'private'},true],
    ['campaign.update',{changed_fields:['title','editorial_binding']},true],
    ['campaign.update',{changed_fields:['phone']},false],
    ['campaign.update',{changed_fields:'title'},false],
    ['schedule.change',{after_opens_at:'2027-01-01T00:00:00Z'},true],
    ['schedule.change',{after_opens_at:'person@example.test'},false],
    ['schedule.change',{after_opens_at:'2027-99-99T00:00:00Z'},false],
    ['lifecycle.open',{from_status:'scheduled',to_status:'open'},true],
    ['lifecycle.open',{from_status:'closed',to_status:'open'},false],
    ['lifecycle.resume',{from_status:'paused',to_status:'open'},true],
    ['lifecycle.close',{from_status:'paused',to_status:'closed'},true],
    ['lifecycle.archive',{from_status:'closed',to_status:'archived'},true],
    ['lifecycle.pause',{from_status:'open',to_status:'paused',reason:'sensitive'},false],
    ['lifecycle.open',{},false],
    ['system_flag.enable',{before_enabled:false,after_enabled:true},true],
    ['system_flag.enable',{before_enabled:false,after_enabled:false},false],
    ['system_flag.disable',{before_enabled:true,after_enabled:false},true],
    ['campaign.create',{config_version:1.5},false],
    ['campaign.create',{before:{email:'person@example.test'}},false],
  ]) assert.equal((await db.query('select private.campaign_audit_metadata_valid($1,$2) as valid',[action,JSON.stringify(metadata)])).rows[0].valid,expected);
});
test('upgrade intentionally leaves registry and system flags empty', async () => {
  for(const table of ['campaign_type_descriptors','campaigns','system_feature_flags'])
    assert.equal((await db.query('select count(*)::int n from private.'+table)).rows[0].n,0);
});

for (const action of ['system_flag.enable','system_flag.disable']) for (const before of [false,true]) for (const after of [false,true])
  test('upgrade ' + action + ' transition ' + before + ' -> ' + after, async () => {
    const valid = action === 'system_flag.enable' ? !before && after : before && !after;
    const result = await db.query('select private.campaign_audit_metadata_valid($1,$2) as valid',
      [action,JSON.stringify({before_enabled:before,after_enabled:after})]);
    assert.equal(result.rows[0].valid,valid);
  });

test('upgrade descriptor ACL accepts private validator and rejects every unsafe runtime grant', async () => {
  await db.exec("begin;create function private.local_fixture_upgrade(jsonb) returns boolean language sql immutable set search_path='' as $$ select true $$;" +
    "revoke all on function private.local_fixture_upgrade(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin;" +
    "insert into private.campaign_type_descriptors values ('local_fixture',1,'local_fixture.enabled','local_fixture_upgrade');rollback;");
  for (const role of ['public','anon','authenticated','service_role','supabase_auth_admin']) {
    try {
      await db.exec("begin;create function private.local_fixture_upgrade(jsonb) returns boolean language sql immutable set search_path='' as $$ select true $$;" +
        "revoke all on function private.local_fixture_upgrade(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin;" +
        'grant execute on function private.local_fixture_upgrade(jsonb) to ' + role + ';');
      await assert.rejects(db.exec("insert into private.campaign_type_descriptors values ('local_fixture',1,'local_fixture.enabled','local_fixture_upgrade')"),
        e=>e.code==='23514');
    } finally { await db.exec('rollback;'); }
  }
});
