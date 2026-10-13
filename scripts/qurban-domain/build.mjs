import {spawn} from 'node:child_process';import path from 'node:path';import {pathToFileURL} from 'node:url';import {localStack} from '../admin-foundation/local-stack.mjs';
const stack=localStack();
const offline=pathToFileURL(path.resolve('scripts/campaign-engine/public-editorial-fixture.mjs')).href;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:{...process.env,
 NODE_OPTIONS:'--import="'+offline+'"',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SANITY_PROJECT_ID:'2o95jmms',NEXT_PUBLIC_SANITY_DATASET:'production',NEXT_PUBLIC_SANITY_API_VERSION:'2026-01-01',
 ADMIN_SUPABASE_ENV:'local',ADMIN_APP_ORIGIN:'http://localhost:3038',NEXT_PUBLIC_SUPABASE_URL:stack.url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:stack.anon,
 SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',ADMIN_TEST_SECRET_SENTINEL:'isolated-private-secret-scan-sentinel',QURBAN_PROTOTYPE:'1',
}});child.on('exit',code=>{process.exitCode=code??1;});
