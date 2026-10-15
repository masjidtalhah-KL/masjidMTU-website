import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {database,root} from '../admin-foundation/database.mjs';import path from 'node:path';
const baseline='8c15eea47b14b4a79d050bf5d929ce091573abb7',migration='20261015140703_qurban_admin_management.sql';
test('eight historical migration bytes match canonical checkout filters',()=>{
 const files=execFileSync('git',['ls-tree','-r','--name-only',baseline,'supabase/migrations'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);assert.equal(files.length,8);
 for(const f of files)assert(readFileSync(path.join(root,f)).equals(execFileSync('git',['cat-file','--filters',baseline+':'+f],{cwd:root,maxBuffer:2*1024*1024})),f);
});
test('additive upgrade preserves every old function and table ACL/RLS; no new raw grants',async()=>{
 const db=await database({migrationThrough:'20261015022554'});
 const fn=async()=> (await db.query("select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,p.prosrc,p.prosecdef,p.proconfig,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') order by n.nspname,p.proname,args")).rows;
 const tables=async()=> (await db.query("select n.nspname,c.relname,c.relrowsecurity,c.relacl::text acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('public','private') order by n.nspname,c.relname")).rows;
 const before=await fn(),oldTables=await tables();try{await db.exec(readFileSync(path.join(root,'supabase/migrations',migration),'utf8'));const after=await fn();
 for(const f of before)assert.deepEqual(after.find(a=>a.nspname===f.nspname&&a.proname===f.proname&&a.args===f.args),f);
 for(const t of oldTables)assert.deepEqual((await tables()).find(a=>a.nspname===t.nspname&&a.relname===t.relname),t);
 assert.equal(after.length-before.length,17);assert.equal((await tables()).length-oldTables.length,2);
 assert.equal((await db.query("select count(*)::int n from private.qurban_export_requests")).rows[0].n,0);
 assert.equal((await db.query("select count(*)::int n from private.qurban_operational_audit")).rows[0].n,0);
 }finally{await db.close();}
});
