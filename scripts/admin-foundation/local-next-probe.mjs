import { spawn } from 'node:child_process';
import path from 'node:path';
import { root } from './database.mjs';
export async function nextProbe(stack) {
  const origin='http://localhost:3038';
  const child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-p','3038','-H','localhost'],{
    cwd:root,stdio:'ignore',env:{...process.env,
      NEXT_PUBLIC_SANITY_PROJECT_ID:'2o95jmms',NEXT_PUBLIC_SANITY_DATASET:'production',NEXT_PUBLIC_SANITY_API_VERSION:'2026-09-01',
      ADMIN_SUPABASE_ENV:'local',ADMIN_APP_ORIGIN:origin,NEXT_PUBLIC_SUPABASE_URL:stack.url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:stack.anon,SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',
    },
  });
  let started=false;
  const close=async()=>{
    if(child.exitCode!==null)return;
    await new Promise(resolve=>{child.once('exit',resolve);child.kill();});
  };
  try{
    const deadline=Date.now()+15000;
    while(true){
      if(child.exitCode!==null)throw Error('Real local Next probe failed to start');
      try{const response=await fetch(origin+'/admin/login');if(response.ok){started=true;break;}}catch{/*startup*/}
      if(Date.now()>deadline)throw Error('Real local Next probe unavailable');
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    return {
      close,
      async request(route,{token,method='GET',body}={}){
        let cookie;
        if(token){
          const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url'));
          const session={access_token:token,refresh_token:'synthetic-cookie-no-refresh',token_type:'bearer',expires_in:3600,expires_at:claims.exp,user:{id:claims.sub,email:claims.email}};
          cookie='sb-127-auth-token=base64-'+Buffer.from(JSON.stringify(session)).toString('base64url');
        }
        const response=await fetch(origin+route,{method,redirect:'manual',headers:{...(cookie?{Cookie:cookie}:{}),
          ...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
        return {status:response.status,headers:response.headers,text:await response.text()};
      },
    };
  }catch(error){if(started||child.exitCode===null)await close();throw error;}
}
