import { spawn } from 'node:child_process';
import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { root } from './database.mjs';
// Explicit allowlist: this runner can never link, push, deploy or create hosted resources.
const args=process.argv.slice(2);
const allowed = ['start', 'db reset --local --no-seed', 'gen types typescript --local --schema public'];
if(!allowed.includes(args.join(' '))) throw Error('Only approved project-local CLI commands are allowed');
const cliHome=path.join(root,'.cache','supabase-cli');
await mkdir(cliHome,{recursive:true});
const pkg=JSON.parse(await readFile(path.join(root,'node_modules/supabase/package.json'),'utf8'));
const bin=path.join(root,'node_modules/supabase',pkg.bin.supabase);
const command=bin.endsWith('.js')?process.execPath:bin;
const cliArgs=bin.endsWith('.js')?[bin,...args]:args;
const isReset=args.join(' ')==='db reset --local --no-seed';let resetOutput='';
const child=spawn(command,cliArgs,{
  cwd:root, stdio:isReset?['inherit','pipe','pipe']:'inherit',env:{...process.env,SUPABASE_HOME:cliHome,SUPABASE_TELEMETRY_DISABLED:'true',SUPABASE_NO_UPDATE_NOTIFIER:'true'},
});
if(isReset){for(const [stream,target]of [[child.stdout,process.stdout],[child.stderr,process.stderr]])stream.on('data',data=>{resetOutput=(resetOutput+data.toString()).slice(-1024*1024);target.write(data);});}
child.on(isReset?'close':'exit',async code=>{if(isReset&&code!==0){try{const {recoverLocalReset}=await import('./local-reset-health.mjs');if(await recoverLocalReset(resetOutput)){process.exitCode=0;return;}}catch{/*Unknown failure stays failed; never infer successful reset.*/}}process.exitCode=code??1;});
