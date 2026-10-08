import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { localStack, fixtures, sql, rows, quote, signedToken, api, rpc, totp, cli } from './local-stack.mjs';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { hookProbe } from './local-hook-probe.mjs';
import { nextProbe } from './local-next-probe.mjs';
let stack, users, ownerToken, ownerClient, ownerFactor, primarySeed;
const token = name => signedToken(stack, users[name]);
const manage = (name, args) => rpc(stack, name, ownerToken, args);
const allowedColumns = 'user_id,approved_email,role,status,version';
const profiles = auth => api(stack, '/rest/v1/admin_profiles?select=' + allowedColumns, { token: auth });
const profile = name => rows('select * from public.admin_profiles where user_id=' + quote(users[name].id))[0];

before(() => {
  stack = localStack(); users = fixtures(); ownerToken = token('owner');
});
after(async () => { if(ownerClient) await ownerClient.auth.stopAutoRefresh(); primarySeed = undefined; });

test('real migration version, PostgreSQL/Auth schema and hook configuration match', () => {
  assert.equal(sql("select version from supabase_migrations.schema_migrations;"), '20261006000100');
  for (const [table,column] of [['identities','provider_id'],['sessions','aal'],['mfa_factors','factor_type'],['mfa_amr_claims','authentication_method']])
    assert.equal(sql("select count(*) from information_schema.columns where table_schema='auth' and table_name="+quote(table)+" and column_name="+quote(column)), '1');
  assert.equal(stack.authEnv.GOTRUE_HOOK_BEFORE_USER_CREATED_ENABLED,'true');
  assert.equal(stack.authEnv.GOTRUE_HOOK_BEFORE_USER_CREATED_URI,'pg-functions://postgres/private/before_user_created');
  assert.equal(stack.authEnv.GOTRUE_EXTERNAL_EMAIL_ENABLED,'false');
});
test('actual RLS, column grants, no write grants and Auth FK relationships', () => {
  assert.equal(sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where ((n.nspname='public' and c.relname='admin_profiles') or (n.nspname='private' and c.relname in ('admin_invites','admin_audit_log'))) and c.relrowsecurity"),'3');
  assert.equal(sql("select has_column_privilege('authenticated','public.admin_profiles','approved_email','select')"),'t');
  assert.equal(sql("select has_column_privilege('authenticated','public.admin_profiles','google_subject','select')"),'f');
  for(const role of ['anon','authenticated'])for(const privilege of ['insert','update','delete'])
    assert.equal(sql("select has_table_privilege("+quote(role)+",'public.admin_profiles',"+quote(privilege)+")"),'f');
  assert.equal(sql("select count(*) from pg_constraint where conrelid='public.admin_profiles'::regclass and confrelid='auth.users'::regclass and contype='f' and confdeltype='r'"),'1');
});
test('anon denied through real PostgREST table and RPC', async () => {
  assert.equal((await profiles()).status,401);
  for(const name of ['admin_security_state','admin_owner_snapshot','admin_accept_invite'])assert.equal((await rpc(stack,name)).status,401);
});
for(const name of ['outsider','disabled','revoked'])test('real PostgREST '+name+' denied despite valid signed local JWT',async()=>{
  const response=await profiles(token(name));assert.equal(response.status,200);assert.deepEqual(response.data,[]);
  for(const method of ['admin_security_state','admin_owner_snapshot','admin_accept_invite'])assert.equal((await rpc(stack,method,token(name))).status,403);
});
for(const name of ['staff','admin'])test('real PostgREST '+name+' reads own permitted fields; owner and role RPC denied',async()=>{
  const response=await profiles(token(name));assert.equal(response.status,200);assert.deepEqual(response.data.map(p=>p.user_id),[users[name].id]);
  assert.equal((await api(stack,'/rest/v1/admin_profiles?select=google_subject',{token:token(name)})).status,403);
  assert.equal((await rpc(stack,'admin_owner_snapshot',token(name))).status,403);
  assert.equal((await rpc(stack,'admin_create_invite',token(name),{invitee_email:'no@example.test',invitee_role:'staff'})).status,403);
});
test('real owner AAL1 gets minimal state only; forged AAL2 without verified factor denied',async()=>{
  const t=token('owner');
  assert.deepEqual((await profiles(t)).data,[]);
  const state=await rpc(stack,'admin_security_state',t);assert.equal(state.status,200);assert.equal(state.data.aal,'aal1');assert.equal(state.data.has_totp,false);
  assert.equal((await rpc(stack,'admin_owner_snapshot',t)).status,403);
  const fake=signedToken(stack,users.owner,{aal:'aal2',amr:[{method:'oauth',timestamp:Math.floor(Date.now()/1000)},{method:'totp',timestamp:Math.floor(Date.now()/1000)}]});
  assert.equal((await rpc(stack,'admin_owner_snapshot',fake)).status,403);
});
test('genuine local Auth TOTP enrollment/challenge creates Auth-issued AAL2 and signed AMR',async()=>{
  ownerClient=createClient(stack.url,stack.anon,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  // Auth Admin link is only for this existing synthetic identity. Public email
  // login remains disabled. Google identity/OAuth AMR are explicit DB fixtures.
  const link=await api(stack,'/auth/v1/admin/generate_link',{service:true,method:'POST',body:{type:'magiclink',email:users.owner.email}});
  assert.equal(link.status,200);
  const session=await api(stack,'/auth/v1/verify',{method:'POST',body:{token_hash:link.data.hashed_token,type:'magiclink'}});
  assert.equal(session.status,200);
  const initialClaims=JSON.parse(Buffer.from(session.data.access_token.split('.')[1],'base64url'));
  users.owner.session=initialClaims.session_id;
  sql("insert into auth.mfa_amr_claims(id,session_id,created_at,updated_at,authentication_method) values ("+quote(randomUUID())+','+quote(users.owner.session)+",now(),now(),'oauth')");
  const initial=await ownerClient.auth.setSession({access_token:session.data.access_token,refresh_token:session.data.refresh_token});
  assert.equal(initial.error,null);
  assert.equal((await ownerClient.auth.refreshSession()).error,null);
  const enrolled=await ownerClient.auth.mfa.enroll({factorType:'totp',friendlyName:'Local test primary',issuer:'Local foundation verification'});
  assert.equal(enrolled.error,null);assert.equal(enrolled.data.type,'totp');
  ownerFactor=enrolled.data.id;primarySeed=enrolled.data.totp.secret;
  assert.match(enrolled.data.totp.qr_code,/^data:image\/svg\+xml/);
  const verify=await ownerClient.auth.mfa.challengeAndVerify({factorId:ownerFactor,code:totp(primarySeed)});
  assert.equal(verify.error,null);ownerToken=verify.data.access_token;
  const claims=JSON.parse(Buffer.from(ownerToken.split('.')[1],'base64url'));
  assert.equal(claims.aal,'aal2');assert(claims.amr.some(a=>a.method==='totp' && typeof a.timestamp==='number'));
  assert.equal(sql("select status from auth.mfa_factors where id="+quote(ownerFactor)),'verified');
  const state=await rpc(stack,'admin_security_state',ownerToken);
  assert.equal(state.status,200);assert.equal(state.data.recent_mfa,true);assert.equal(state.data.has_totp,true);
});
test('genuine local Auth rejects duplicate factor friendly name without replacing the verified factor',async()=>{
  const duplicate=await ownerClient.auth.mfa.enroll({factorType:'totp',friendlyName:'Local test primary'});
  assert(duplicate.error);
  assert.equal(duplicate.error.code,'mfa_factor_name_conflict');
  assert.equal(sql("select count(*) from auth.mfa_factors where user_id="+quote(users.owner.id)+" and friendly_name='Local test primary' and status='verified'"),'1');
  assert.equal(sql("select status from auth.mfa_factors where id="+quote(ownerFactor)),'verified');
});

test('real Auth-issued owner AAL2 allows foundation snapshot and profile reads',async()=>{
  const response=await profiles(ownerToken);assert.equal(response.status,200);assert.equal(response.data.length,5);
  const snapshot=await manage('admin_owner_snapshot');assert.equal(snapshot.status,200);assert.equal(snapshot.data.users.length,5);
});
test('real PostgREST direct profile writes denied for staff/admin/owner',async()=>{
  for(const t of [token('staff'),token('admin'),ownerToken]){
    for(const method of ['POST','PATCH','DELETE']){
      const response=await api(stack,'/rest/v1/admin_profiles?user_id=eq.'+users.staff.id,{token:t,method,...(method==='DELETE'?{}:{body:{role:'super_admin'}})});
      assert.equal(response.status,403);
    }
  }
});
test('private schema and non-exposed RPC helpers unavailable through actual Data API',async()=>{
  for(const path of ['/rest/v1/admin_invites','/rest/v1/admin_audit_log'])assert.equal((await api(stack,path,{token:ownerToken})).status,404);
  assert.equal((await api(stack,'/rest/v1/admin_invites',{token:ownerToken,headers:{'Accept-Profile':'private'}})).status,406);
  assert.equal((await rpc(stack,'invite_create',ownerToken,{invitee_email:'bypass@example.test',invitee_role:'staff'})).status,404);
  assert.equal(sql("select has_function_privilege('authenticated','private.record_event(text,uuid,uuid,text,text,text,text)','execute')"),'f');
  assert.equal(sql("select has_function_privilege('authenticated','private.before_user_created(jsonb)','execute')"),'f');
  assert.equal(sql("select has_function_privilege('supabase_auth_admin','private.before_user_created(jsonb)','execute')"),'t');
});
test('user-editable metadata and payload cannot promote role through real API',async()=>{
  const changed=await api(stack,'/auth/v1/user',{token:token('staff'),method:'PUT',body:{data:{role:'super_admin',status:'active'}}});
  assert.equal(changed.status,200);
  assert.equal((await rpc(stack,'admin_owner_snapshot',token('staff'))).status,403);
  assert.equal(profile('staff').role,'staff');
  assert.equal((await manage('admin_create_invite',{invitee_email:'bad@example.test',invitee_role:'super_admin'})).status,400);
  assert.equal((await rpc(stack,'admin_create_invite',token('staff'),{invitee_email:'bad@example.test',invitee_role:'staff',actor_id:users.owner.id})).status,404);
});
test('guarded real invite: 7 days, normalized exact email, duplicate denied',async()=>{
  const response=await manage('admin_create_invite',{invitee_email:' '+users.invitee.email.toUpperCase()+' ',invitee_role:'staff'});
  assert.equal(response.status,200);
  assert.equal(sql("select extract(epoch from expires_at-created_at)::integer from private.admin_invites where id="+quote(response.data)),'604800');
  assert.equal((await manage('admin_create_invite',{invitee_email:users.invitee.email,invitee_role:'admin'})).status,409);
});
test('wrong-email acceptance denied; existing Auth user accepts once with DB role',async()=>{
  assert.equal((await rpc(stack,'admin_accept_invite',token('other'))).status,403);
  assert.equal((await rpc(stack,'admin_accept_invite',token('invitee'))).status,204);
  assert.equal(profile('invitee').role,'staff');
  const events=sql("select count(*) from private.admin_audit_log where action='invite.accept'");
  assert.equal((await rpc(stack,'admin_accept_invite',token('invitee'))).status,204);
  assert.equal(sql("select count(*) from private.admin_audit_log where action='invite.accept'"),events);
});
test('expired invitation denied, reissued invitation version and revoke guarded',async()=>{
  const issued=await manage('admin_create_invite',{invitee_email:users.other.email,invitee_role:'admin'});assert.equal(issued.status,200);
  sql("update private.admin_invites set created_at=now()-interval '8 days',expires_at=now()-interval '1 day' where id="+quote(issued.data));
  assert.equal((await rpc(stack,'admin_accept_invite',token('other'))).status,403);
  const reissue=await manage('admin_create_invite',{invitee_email:users.other.email,invitee_role:'staff'});assert.equal(reissue.status,200);
  assert.equal((await manage('admin_revoke_invite',{invite_id:reissue.data,expected_version:99})).status,409);
  assert.equal((await manage('admin_revoke_invite',{invite_id:reissue.data,expected_version:1})).status,204);
  assert.equal((await rpc(stack,'admin_accept_invite',token('other'))).status,403);
});
test('real role/disable/reactivate/revoke guards deny stale valid JWT immediately',async()=>{
  const old=token('staff');let version=profile('staff').version;
  assert.equal((await manage('admin_change_member',{target_user:users.owner.id,expected_version:1,change_action:'disable'})).status,403);
  assert.equal((await manage('admin_change_member',{target_user:users.staff.id,expected_version:version,change_action:'role',next_role:'super_admin'})).status,400);
  for(const action of ['role','disable','reactivate','revoke']){
    assert.equal((await manage('admin_change_member',{target_user:users.staff.id,expected_version:version,change_action:action,...(action==='role'?{next_role:'admin'}:{})})).status,204);
    version++;
    if(['disable','revoke'].includes(action)){
      assert.deepEqual((await profiles(old)).data,[]);
      assert.equal((await rpc(stack,'admin_security_state',old)).status,403);
    }
  }
  assert.equal((await manage('admin_change_member',{target_user:users.staff.id,expected_version:1,change_action:'reactivate'})).status,409);
  assert.equal((await rpc(stack,'admin_accept_invite',old)).status,403);
});
test('real revoked re-invite retains original identity and cannot silently reactivate',async()=>{
  const p=profile('staff');
  assert.equal((await manage('admin_change_member',{target_user:p.user_id,expected_version:p.version,change_action:'reactivate'})).status,400);
  assert.equal((await manage('admin_create_invite',{invitee_email:users.staff.email,invitee_role:'staff'})).status,200);
  assert.equal((await rpc(stack,'admin_accept_invite',token('staff'))).status,204);
  assert.equal(profile('staff').google_subject,users.staff.subject);
});
test('real missing/stale/future MFA AMR denies privileged mutation',async()=>{
  for(const amr of [[{method:'oauth',timestamp:1}],...[[-601],[60]].map(([offset])=>[{method:'oauth',timestamp:1},{method:'totp',timestamp:Math.floor(Date.now()/1000)+offset}])]){
    const t=signedToken(stack,users.owner,{aal:'aal2',amr});
    assert.equal((await rpc(stack,'admin_create_invite',t,{invitee_email:'stale@example.test',invitee_role:'staff'})).status,403);
  }
});
test('real audit insertion failure rolls back invite/profile mutations and consumption',async()=>{
  assert.equal((await manage('admin_create_invite',{invitee_email:users.rollback.email,invitee_role:'staff'})).status,200);
  sql("create function private.local_test_audit_failure() returns trigger language plpgsql as $$ begin raise exception 'local audit failure'; end $$; create trigger local_test_fail before insert on private.admin_audit_log for each row execute function private.local_test_audit_failure();");
  try{
    assert.equal((await manage('admin_change_member',{target_user:users.admin.id,expected_version:profile('admin').version,change_action:'disable'})).status,400);
    assert.equal(profile('admin').status,'active');
    assert.equal((await manage('admin_create_invite',{invitee_email:'rolled-back@example.test',invitee_role:'staff'})).status,400);
    assert.equal(sql("select count(*) from private.admin_invites where email_normalized='rolled-back@example.test'"),'0');
    assert.equal((await rpc(stack,'admin_accept_invite',token('rollback'))).status,400);
    assert.equal(profile('rollback'),undefined);
    assert.equal(sql("select status from private.admin_invites where email_normalized="+quote(users.rollback.email)),'pending');
  }finally{sql('drop trigger local_test_fail on private.admin_audit_log; drop function private.local_test_audit_failure();');}
});
test('real Before User Created DB hook grants exact live Google event under actual Auth role',()=>{
  for(const [email,provider,allow] of [[users.rollback.email,'google',true],[users.rollback.email+'x','google',false],[users.rollback.email,'email',false],[users.other.email,'google',false]]){
    const output=sql('select private.before_user_created('+quote(JSON.stringify({user:{email,app_metadata:{provider},is_anonymous:false}}))+'::jsonb);','supabase_auth_admin');
    assert.equal(!JSON.parse(output).error,allow);
  }
  const pending=rows('select id,created_at,expires_at from private.admin_invites where email_normalized='+quote(users.rollback.email)+" and status='pending'")[0];
  sql("update private.admin_invites set created_at=now()-interval '8 days',expires_at=now()-interval '1 day' where id="+quote(pending.id));
  try {
    const expired=sql('select private.before_user_created('+quote(JSON.stringify({user:{email:users.rollback.email,app_metadata:{provider:'google'},is_anonymous:false}}))+'::jsonb);','supabase_auth_admin');
    assert(JSON.parse(expired).error);
  } finally {
    sql('update private.admin_invites set created_at='+quote(pending.created_at)+',expires_at='+quote(pending.expires_at)+' where id='+quote(pending.id));
  }
});
test('actual CLI-generated public types match reviewed checked-in types',()=>{
  const expected=cli(['gen','types','typescript','--local','--schema','public']);
  assert.equal(readFileSync('src/lib/supabase/database.types.ts','utf8').replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n').trimEnd()+'\n');
});
test('real GoTrue invokes the private hook and rejects uninvited/non-Google creation',async()=>{
  const pending='local-hook-pending@example.test';
  assert.equal((await manage('admin_create_invite',{invitee_email:pending,invitee_role:'staff'})).status,200);
  const probe=await hookProbe(stack);
  try {
    for(const email of ['local-hook-uninvited@example.test',pending]){
      const result=await probe.signup(email,{provider:'google',role:'super_admin'});
      assert.equal(result.status,403);assert.match(result.data.msg,/Access denied/);
      assert.equal(sql('select count(*) from auth.users where email='+quote(email)),'0');
    }
    assert.equal(sql('select status from private.admin_invites where email_normalized='+quote(pending)),'pending');
  } finally { await probe.close(); }
});
test('genuine local Auth backup enrollment, invalid TOTP and challenge replay denial',async()=>{
  const backup=await ownerClient.auth.mfa.enroll({factorType:'totp',friendlyName:'Local test backup'});
  assert.equal(backup.error,null);
  const challenge=await ownerClient.auth.mfa.challenge({factorId:backup.data.id});assert.equal(challenge.error,null);
  const correct=totp(backup.data.totp.secret);
  const bad=String((Number(correct)+1)%1000000).padStart(6,'0');
  const invalid=await ownerClient.auth.mfa.verify({factorId:backup.data.id,challengeId:challenge.data.id,code:bad});assert(invalid.error);
  const used=await ownerClient.auth.mfa.challenge({factorId:backup.data.id});assert.equal(used.error,null);
  const verified=await ownerClient.auth.mfa.verify({factorId:backup.data.id,challengeId:used.data.id,code:correct});assert.equal(verified.error,null);
  ownerToken=verified.data.access_token;
  const replay=await ownerClient.auth.mfa.verify({factorId:backup.data.id,challengeId:used.data.id,code:correct});assert(replay.error);
});
test('genuine Auth refresh retains signed TOTP recency and real database owner gate',async()=>{
  const refreshed=await ownerClient.auth.refreshSession();assert.equal(refreshed.error,null);ownerToken=refreshed.data.session.access_token;
  const claims=JSON.parse(Buffer.from(ownerToken.split('.')[1],'base64url'));assert.equal(claims.aal,'aal2');assert(claims.amr.some(a=>a.method==='totp'));
  const state=await rpc(stack,'admin_security_state',ownerToken);assert.equal(state.status,200);assert.equal(state.data.recent_mfa,true);
});

test('concurrent real invite create and versioned member change have one committed winner',async()=>{
  const email='local-concurrent@example.test';
  const invitations=await Promise.all([manage('admin_create_invite',{invitee_email:email,invitee_role:'staff'}),manage('admin_create_invite',{invitee_email:email,invitee_role:'staff'})]);
  assert.deepEqual(invitations.map(r=>r.status).sort(),[200,409]);
  assert.equal(sql('select count(*) from private.admin_invites where email_normalized='+quote(email)+" and status='pending'"),'1');
  assert.equal(sql("select count(*) from private.admin_audit_log a join private.admin_invites i on i.id=a.invite_id where i.email_normalized="+quote(email)+" and a.action='invite.create'"),'1');
  const p=profile('admin');const args={target_user:p.user_id,expected_version:p.version,change_action:'role',next_role:'staff'};
  const changes=await Promise.all([manage('admin_change_member',args),manage('admin_change_member',args)]);
  assert.deepEqual(changes.map(r=>r.status).sort(),[204,409]);
  assert.equal(profile('admin').version,p.version+1);
});
test('real Auth-issued aged TOTP AMR denies mutation; genuine step-up restores fresh proof',async()=>{
  sql("update auth.mfa_amr_claims set created_at=now()-interval '660 seconds',updated_at=now()-interval '660 seconds' where session_id="+quote(users.owner.session)+" and authentication_method='totp'");
  let refreshed=await ownerClient.auth.refreshSession();assert.equal(refreshed.error,null);ownerToken=refreshed.data.session.access_token;
  const aged=await rpc(stack,'admin_security_state',ownerToken);
  assert.equal(aged.status,200);assert.equal(aged.data.aal,'aal2');assert.equal(aged.data.recent_mfa,false);
  assert.equal((await manage('admin_create_invite',{invitee_email:'local-stale-auth@example.test',invitee_role:'staff'})).status,403);
  const stepped=await ownerClient.auth.mfa.challengeAndVerify({factorId:ownerFactor,code:totp(primarySeed)});
  assert.equal(stepped.error,null);ownerToken=stepped.data.access_token;
  refreshed=await ownerClient.auth.refreshSession();assert.equal(refreshed.error,null);ownerToken=refreshed.data.session.access_token;
  assert.equal((await rpc(stack,'admin_security_state',ownerToken)).data.recent_mfa,true);
  assert.equal((await manage('admin_create_invite',{invitee_email:'local-step-up@example.test',invitee_role:'staff'})).status,200);
});
test('real Next SSR/DAL independently authorizes against local Auth and PostgREST',async()=>{
  const next=await nextProbe(stack);
  try {
    assert.equal((await next.request('/admin/api/security')).status,401);
    for(const name of ['outsider','disabled','revoked']){
      const denied=await next.request('/admin',{token:token(name)});assert.equal(denied.status,307);assert.match(denied.headers.get('location'),/state=denied/);
      assert.equal((await next.request('/admin/api/security',{token:token(name)})).status,403);
    }
    for(const name of ['staff','admin']){
      assert.equal((await next.request('/admin',{token:token(name)})).status,200);
      assert.equal((await next.request('/admin/settings',{token:token(name)})).status,200);
      assert.equal((await next.request('/admin/api/access',{token:token(name)})).status,403);
    }
    const aal1=await next.request('/admin/users',{token:token('owner')});assert.equal(aal1.status,307);assert.match(aal1.headers.get('location'),/admin\/mfa/);
    const owner=await next.request('/admin/users',{token:ownerToken});assert.equal(owner.status,200);assert.match(owner.headers.get('cache-control'),/no-store/);
    const mutation=await next.request('/admin/api/access',{token:ownerToken,method:'POST',body:{operation:'invite',email:'local-next-api@example.test',role:'staff'}});
    assert.equal(mutation.status,200);assert.equal(JSON.parse(mutation.text).saved,true);
  } finally { await next.close(); }
});
test('genuine Auth factor removal makes still-valid AAL2 JWT fail live DB owner access',async()=>{
  const stale=ownerToken;
  const factors=rows('select id from auth.mfa_factors where user_id='+quote(users.owner.id));
  for(const factor of factors){
    const removed=await api(stack,'/auth/v1/admin/users/'+users.owner.id+'/factors/'+factor.id,{service:true,method:'DELETE'});
    assert.equal(removed.status,200);
  }
  assert.equal(sql('select count(*) from auth.mfa_factors where user_id='+quote(users.owner.id)),'0');
  assert.deepEqual((await profiles(stale)).data,[]);
  assert.equal((await rpc(stack,'admin_owner_snapshot',stale)).status,403);
});
