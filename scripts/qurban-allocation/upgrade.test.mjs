import {createHash} from "node:crypto";
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {database,root} from '../admin-foundation/database.mjs';
const baseline='8be077af6a246f2de0b3d54c39e8c1402d209230',migration='20261016004640_qurban_allocation_foundation.sql';
test('nine historical files unchanged including original native bytes recorded at preflight',()=>{
 const files=execFileSync('git',['ls-tree','-r','--name-only',baseline,'supabase/migrations'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
 assert.equal(files.length,9);
 const capture=path.join(root,'.cache/qurban-84/migration-hashes.json'),hashes=fs.existsSync(capture)?JSON.parse(fs.readFileSync(capture,'utf8')):null;
 if(hashes)assert.equal(Object.keys(hashes).length,9);
 for(const p of files){const b=fs.readFileSync(path.join(root,p)),blob=execFileSync('git',['show',baseline+':'+p],{cwd:root}),filter=execFileSync('git',['cat-file','--filters',baseline+':'+p],{cwd:root});assert(b.equals(blob)||b.equals(filter),p);if(hashes)assert.equal(createHash('sha256').update(b).digest('hex'),hashes[p]);}
});
test('additive upgrade changes only two reviewed private projections, preserving old functions/grants/RLS',async()=>{
 const db=await database({migrationThrough:'20261015140703'});const fn=async()=>(await db.query("select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,p.prosrc,p.prosecdef,p.proconfig,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') order by 1,2,3")).rows;
 const tables=async()=>(await db.query("select n.nspname,c.relname,c.relrowsecurity,c.relacl::text acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('public','private') order by 1,2")).rows;
 const old=await fn(),before=await tables();try{await db.exec(fs.readFileSync(path.join(root,'supabase/migrations',migration),'utf8'));const after=await fn();assert.equal(after.length-old.length,12);for(const p of old){const a=after.find(a=>a.nspname===p.nspname&&a.proname===p.proname&&a.args===p.args);if(p.nspname==='private'&&['qurban_admin_activity','qurban_admin_export_snapshot'].includes(p.proname))assert.deepEqual({...a,prosrc:p.prosrc},p);else assert.deepEqual(a,p);}
 for(const t of before)assert.deepEqual((await tables()).find(a=>a.nspname===t.nspname&&a.relname===t.relname),t);assert.equal((await tables()).length-before.length,3);
 for(const t of ['qurban_cattle','qurban_cattle_slots','qurban_allocations'])assert.equal((await db.query('select count(*)::int n from private.'+t)).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from private.campaign_type_descriptors')).rows[0].n,1);
 }finally{await db.close();}
});
