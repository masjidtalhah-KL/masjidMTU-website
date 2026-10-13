import {spawn,spawnSync} from 'node:child_process';import {mkdirSync,writeFileSync} from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const dir=path.resolve('.cache/qurban-81');mkdirSync(dir,{recursive:true});
const fixture=pathToFileURL(path.resolve('scripts/campaign-engine/public-editorial-fixture.mjs')).href;
// Shared disposable stack: suites must run sequentially, with a clean reset each time.
const allSuites=['scripts/campaign-engine/local-database.test.mjs','scripts/campaign-engine/flags-local.test.mjs','scripts/campaign-engine/lifecycle-local.test.mjs','scripts/campaign-engine/management-local.test.mjs','scripts/campaign-engine/public-local.test.mjs','scripts/admin-foundation/local-supabase.test.mjs','scripts/campaign-engine/security-local.test.mjs'];
const requested=process.argv.slice(2);
if(requested.some(name=>!allSuites.some(s=>path.basename(s)===name)))throw Error('Unknown local regression suite');
const suites=requested.length?allSuites.filter(s=>requested.includes(path.basename(s))):allSuites;
const reset=()=>{const r=spawnSync(process.execPath,['scripts/admin-foundation/local-cli.mjs','db','reset','--local','--no-seed'],{encoding:'utf8'});if(r.status!==0)throw Error('Disposable local reset failed');};
let failures=0,total=0;
try{
 for(const suite of suites){
  reset();let output='';const code=await new Promise(resolve=>{const child=spawn(process.execPath,['--import','tsx','--test',suite],{env:{...process.env,NODE_OPTIONS:'--import="'+fixture+'"',FORCE_COLOR:'0',QURBAN_PROTOTYPE:'1',ADMIN_TEST_SECRET_SENTINEL:'isolated-private-secret-scan-sentinel'}});child.stdout.on('data',b=>{output+=b.toString();});child.stderr.on('data',b=>{output+=b.toString();});child.on('exit',resolve);});
  writeFileSync(path.join(dir,path.basename(suite)+'.log'),output);
  const tests=Number(output.match(/tests (\d+)/)?.[1]??0),passed=Number(output.match(/pass (\d+)/)?.[1]??0),failed=Number(output.match(/fail (\d+)/)?.[1]??0);total+=passed;
  console.log(JSON.stringify({suite,exit:code,tests,passed,failed}));
  if(code!==0){failures++;console.log(output.slice(-5000));}
 }
}finally{reset();}
console.log(JSON.stringify({localRegressionPassed:total,failedSuites:failures,finalReset:'no-seed'}));process.exitCode=failures?1:0;
