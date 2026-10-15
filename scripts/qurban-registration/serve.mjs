import {spawn} from 'node:child_process';import path from 'node:path';import {pathToFileURL} from 'node:url';import {localStack} from '../admin-foundation/local-stack.mjs';
const stack=localStack(),offline=pathToFileURL(path.resolve('scripts/campaign-engine/public-editorial-fixture.mjs')).href;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','localhost','--port','3082'],{stdio:'inherit',env:{...process.env,
 NODE_OPTIONS:'--import="'+offline+'"',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SANITY_PROJECT_ID:'2o95jmms',NEXT_PUBLIC_SANITY_DATASET:'production',NEXT_PUBLIC_SANITY_API_VERSION:'2026-01-01',
 ADMIN_SUPABASE_ENV:'local',ADMIN_APP_ORIGIN:'http://localhost:3082',NEXT_PUBLIC_SUPABASE_URL:stack.url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:stack.anon,
 SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',
}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>{process.exitCode=code??1;});
