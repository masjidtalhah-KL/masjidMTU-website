import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {database} from '../admin-foundation/database.mjs';
test('8.2 upgrade preserves all 8.1/historical function definitions and table ACL/RLS',async()=>{
 const db=await database({migrationThrough:'20261013081724'});
 try{
  const functions=async()=>(await db.query("select n.nspname,p.proname,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') order by p.oid")).rows;
  const tables=async()=>(await db.query("select c.oid,c.relname,c.relrowsecurity,c.relacl::text acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' order by c.oid")).rows;
  const beforeFunctions=await functions(),beforeTables=await tables();await db.exec(readFileSync('supabase/migrations/20261015022554_qurban_public_registration.sql','utf8'));
  const afterFunctions=await functions(),afterTables=await tables();for(const row of beforeFunctions)assert.deepEqual(afterFunctions.find(r=>r.nspname===row.nspname&&r.proname===row.proname),row);for(const row of beforeTables)assert.deepEqual(afterTables.find(r=>r.oid===row.oid),row);
  assert.equal(afterFunctions.length,beforeFunctions.length+6);assert.equal(afterTables.length,beforeTables.length+2);
  assert.equal((await db.query("select count(*)::int n from private.campaigns")).rows[0].n,0);
  assert.equal((await db.query("select count(*)::int n from private.system_feature_flags")).rows[0].n,0);
 }finally{await db.close();}
});
