// Synthetic HTTP adapter for pinned SDK + Next route/browser integration tests.
// NOT Supabase Auth/PostgREST, Google OAuth, a TOTP verifier or a real owner.
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { database, fixtures, asUser, root, ids, sessions } from './database.mjs';
const db=await database(); await fixtures(db);
const signingKey=crypto.randomBytes(32);
const port=54329;
const authOrigin=`http://127.0.0.1:${port}`;
const appOrigin='http://localhost:3037';
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt=claims=>{const data=`${encode({alg:'HS256',typ:'JWT'})}.${encode(claims)}`;return `${data}.${crypto.createHmac('sha256',signingKey).update(data).digest('base64url')}`;};
const user=name=>({id:ids[name],aud:'authenticated',role:'authenticated',email:`${name}@example.test`,email_confirmed_at:new Date().toISOString(),created_at:new Date().toISOString(),app_metadata:{provider:'google',providers:['google']},user_metadata:{},identities:[{id:`google-${name}`,user_id:ids[name],provider:'google',identity_data:{sub:`google-${name}`,email:`${name}@example.test`,email_verified:true}}],factors:name==='owner'?[{id:ids.owner,factor_type:'totp',status:'verified',friendly_name:'Synthetic test factor'}]:[]});
function session(name,aal,stale=false) {
  const now=Math.floor(Date.now()/1000);
  const amr=[{method:'oauth',timestamp:now},...(name==='owner'?[{method:'totp',timestamp:now-(stale?700:0)}]:[])];
  return {access_token:jwt({sub:ids[name],role:'authenticated',aud:'authenticated',iss:`${authOrigin}/auth/v1`,aal:aal??(name==='owner'?'aal2':'aal1'),amr,session_id:sessions[name],iat:now,exp:now+3600}),refresh_token:'synthetic-local-test-only',expires_in:3600,expires_at:now+3600,token_type:'bearer',user:user(name)};
}
function verified(request) {
  const token=request.headers.authorization?.replace(/^Bearer /,'');
  if(!token) return null;
  const [header,payload,signature]=token.split('.');
  if(!signature) return null;
  const expected=crypto.createHmac('sha256',signingKey).update(`${header}.${payload}`).digest();
  const actual=Buffer.from(signature,'base64url');
  if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected)) return null;
  const claims=JSON.parse(Buffer.from(payload,'base64url'));
  const name=Object.keys(ids).find(name=>ids[name]===claims.sub);
  return name&&claims.exp>Date.now()/1000?{name,claims}:null;
}
const rpc={
  admin_security_state:()=>['select public.admin_security_state() as data',[]],
  admin_owner_snapshot:()=>['select public.admin_owner_snapshot() as data',[]],
  admin_accept_invite:()=>['select public.admin_accept_invite() as data',[]],
  admin_create_invite:b=>['select public.admin_create_invite($1,$2) as data',[b.invitee_email,b.invitee_role]],
  admin_revoke_invite:b=>['select public.admin_revoke_invite($1,$2) as data',[b.invite_id,b.expected_version]],
  admin_change_member:b=>['select public.admin_change_member($1,$2,$3,$4) as data',[b.target_user,b.expected_version,b.change_action,b.next_role??null]],
};
let queue=Promise.resolve();
const serialized=fn=>{const task=queue.then(fn);queue=task.catch(()=>{});return task;};
const server=http.createServer(async(request,response)=>{
  const reply=(data,status=200)=>{response.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':appOrigin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info,x-supabase-api-version','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'});response.end(data===null?'':JSON.stringify(data));};
  try {
    if(request.method==='OPTIONS') return reply(null,204);
    const url=new URL(request.url,authOrigin);
    if(url.pathname.startsWith('/__fixture/session/')) {
      const name=url.pathname.split('/').pop();
      if(!ids[name]) return reply({error:'unknown synthetic user'},404);
      const s=session(name,url.searchParams.get('aal'),url.searchParams.has('stale'));
      return reply({name:'sb-127-auth-token',value:`base64-${Buffer.from(JSON.stringify(s)).toString('base64url')}`,session:s});
    }
    const identity=verified(request);
    if(url.pathname==='/auth/v1/user') return identity?reply(user(identity.name)):reply({msg:'Invalid JWT',code:'bad_jwt'},401);
    if(url.pathname==='/auth/v1/logout') return identity?reply(null,204):reply({msg:'Invalid JWT'},401);
    if(url.pathname==='/auth/v1/factors' && request.method==='GET') return identity?reply(user(identity.name).factors):reply({msg:'Invalid JWT'},401);
    if(url.pathname.startsWith('/auth/v1/')) return reply({msg:'Provider authentication/TOTP intentionally not simulated'},501);
    if(url.pathname.startsWith('/rest/v1/rpc/')) {
      const name=url.pathname.split('/').pop();
      if(!rpc[name]) return reply({message:'Not exposed',code:'42501'},403);
      const chunks=[];for await(const chunk of request)chunks.push(chunk);
      const body=JSON.parse(Buffer.concat(chunks).toString()||'{}');
      const [sql,args]=rpc[name](body);
      const result=await serialized(()=>asUser(db,identity?.name,sql,args,{aal:identity?.claims.aal,amr:identity?.claims.amr}));
      return reply(result.rows[0]?.data??null);
    }
    if(url.pathname==='/rest/v1/admin_profiles') {
      const sql=request.method==='GET'?'select user_id, approved_email, role, status, version from public.admin_profiles':"update public.admin_profiles set role='super_admin'";
      return reply((await serialized(()=>asUser(db,identity?.name,sql,[],{aal:identity?.claims.aal,amr:identity?.claims.amr}))).rows);
    }
    return reply({message:'Not exposed'},404);
  } catch(error) { return reply({code:error.code??'error',message:error.message},error.code==='42501'?403:['23505','40001','PT409'].includes(error.code)?409:400); }
});
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
const child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-p','3037','-H','localhost'],{
  cwd:root,stdio:'inherit',env:{...process.env,NEXT_PUBLIC_SANITY_PROJECT_ID:'2o95jmms',NEXT_PUBLIC_SANITY_DATASET:'production',NEXT_PUBLIC_SANITY_API_VERSION:'2026-09-01',ADMIN_SUPABASE_ENV:'local',ADMIN_APP_ORIGIN:appOrigin,NEXT_PUBLIC_SUPABASE_URL:authOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic_test_only'},
});
child.on('exit',async code=>{server.close();await db.close();process.exit(code??1);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill());
