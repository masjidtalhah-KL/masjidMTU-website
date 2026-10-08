import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {database,fixtures,asUser,root} from '../admin-foundation/database.mjs';
let db,functions,audits;
const definitions="select n.nspname,p.proname,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('private','public') order by n.nspname,p.proname";
before(async()=>{
  db=await database({migrationThrough:'20261008102157'});await fixtures(db);
  await asUser(db,'owner',"select public.admin_create_invite('upgrade-flag@example.test','staff')");
  functions=(await db.query(definitions)).rows;audits=(await db.query('select * from private.admin_audit_log')).rows;
  const files=(await readdir(path.join(root,'supabase/migrations'))).filter(f=>f.endsWith('_campaign_feature_flags.sql'));
  assert.equal(files.length,1);
  await db.exec(await readFile(path.join(root,'supabase/migrations',files[0]),'utf8'));
});
after(async()=>{await db?.close();});
test('7.2 additive upgrade preserves every Foundation/7.1 function ACL/definition and audit row',async()=>{
  const current=(await db.query(definitions)).rows;
  for(const fn of functions)assert.deepEqual(current.find(f=>f.nspname===fn.nspname&&f.proname===fn.proname),fn);
  assert.deepEqual((await db.query('select * from private.admin_audit_log')).rows,audits);
});
test('7.2 upgrade creates no descriptors/campaigns/flags and all old tables stay deny-first',async()=>{
  for(const table of ['campaign_type_descriptors','campaigns','system_feature_flags']){
    assert.equal((await db.query('select count(*)::int n from private.'+table)).rows[0].n,0);
    assert.equal((await db.query("select has_table_privilege('authenticated',$1,'INSERT,UPDATE,DELETE') allowed",['private.'+table])).rows[0].allowed,false);
  }
});
test('7.2 upgrade keeps staff/admin read-only for flags and foundation access owner-only',async()=>{
  for(const name of ['staff','admin']){
    assert.equal((await asUser(db,name,'select public.admin_system_flags() snapshot')).rows[0].snapshot[0].enabled,false);
    await assert.rejects(asUser(db,name,"select public.admin_set_system_flag('campaigns.enabled',true,0)"),e=>e.code==='42501');
    await assert.rejects(asUser(db,name,'select public.admin_owner_snapshot()'),e=>e.code==='42501');
  }
});
