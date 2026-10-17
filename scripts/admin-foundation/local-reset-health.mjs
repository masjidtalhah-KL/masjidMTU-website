// Local CLI lifecycle recovery only; no application import, secret logging or hosted operation.
import {execFileSync}from'node:child_process';import {readdirSync}from'node:fs';import path from'node:path';import {root}from'./database.mjs';import {localStack,rows}from'./local-stack.mjs';
export async function recoverLocalReset(output){
 if(!/Restarting containers\.\.\.[\s\S]*Error status 502: An invalid response was received from the upstream server/.test(output)||/ERROR:|failed to apply|migration failed/i.test(output))return false;
 if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.ADMIN_SUPABASE_ENV&&process.env.ADMIN_SUPABASE_ENV!=='local')return false;
 const endpoint=JSON.parse(execFileSync('docker',['context','inspect'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))[0]?.Endpoints?.docker?.Host;
 if(typeof endpoint!=='string'||! /^(npipe:\/\/\/\/\.\/pipe\/[^/]+|unix:\/\/\/[^\r\n]+)$/.test(endpoint))return false;
 const stack=localStack(),expected=readdirSync(path.join(root,'supabase/migrations')).filter(f=>f.endsWith('.sql')).map(f=>f.split('_')[0]).sort();
 const actual=rows('select version from supabase_migrations.schema_migrations order by version').map(r=>r.version);if(JSON.stringify(expected)!==JSON.stringify(actual))return false;
 const tables=rows("select schemaname,tablename from pg_tables where schemaname='private' and tablename<>'campaign_type_descriptors' or schemaname='public' and tablename in('admin_profiles') or schemaname='auth' and tablename='users' or schemaname='storage' and tablename='objects'");
 // Verify every operational table is empty, not merely the handful affected by this phase.
 for(const t of tables){if(!/^[a-z_]+$/.test(t.schemaname)||!/^[a-z_]+$/.test(t.tablename))return false;if(rows('select count(*)::int n from '+t.schemaname+'.'+t.tablename)[0].n!==0)return false;}
 const d=rows('select type_key,config_version,module_flag_key from private.campaign_type_descriptors order by type_key');if(JSON.stringify(d)!==JSON.stringify([{type_key:'qurban',config_version:1,module_flag_key:'qurban.enabled'},{type_key:'ramadan',config_version:1,module_flag_key:'ramadan.enabled'}]))return false;
 const b=rows("select public,file_size_limit from storage.buckets where id='qurban-payment-proofs'");if(b.length!==1||b[0].public!==false||Number(b[0].file_size_limit)!==10485760)return false;
 let gatewayRestarted=false;const end=Date.now()+90000;while(Date.now()<end){let ok=true;const statuses=[];for(const route of ['/storage/v1/status','/auth/v1/health','/rest/v1/'])try{const r=await fetch(stack.url+route,{headers:{apikey:stack.anon,Authorization:'Bearer '+stack.anon},signal:AbortSignal.timeout(3000)});await r.arrayBuffer();statuses.push(r.status);if(!r.ok)ok=false;}catch{ok=false;statuses.push(0);}if(!gatewayRestarted&&statuses[0]===502&&statuses[1]===200&&statuses[2]===200){
 const kong=JSON.parse(execFileSync('docker',['inspect','supabase_kong_mtu-admin-local'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))[0];
 if(kong.Name!=='/supabase_kong_mtu-admin-local')return false;
 // Storage itself must be healthy: recover only the local gateway's stale upstream cache.
 execFileSync('docker',['exec','supabase_storage_mtu-admin-local','wget','--no-verbose','--tries=1','--timeout=3','--spider','http://127.0.0.1:5000/status'],{stdio:'pipe'});
 execFileSync('docker',['restart','supabase_kong_mtu-admin-local'],{stdio:'pipe'});gatewayRestarted=true;
 console.log('Restarted only the verified local API gateway after Storage internal health and exact empty-reset proof.');
 }if(ok){console.log('Local no-seed reset independently verified: exact migrations, empty business/Auth data, private bucket and API/Storage health. Recovered CLI post-restart 502 only.');return true;}await new Promise(r=>setTimeout(r,1000));}return false;
}
