import test,{before,after} from 'node:test';import assert from 'node:assert/strict';
import {setup,reset as cleanup,inspect} from './review-fixture.mjs';import {request,slug,config} from './fixtures.mjs';import {sql,rows,quote,rpc,api,signedToken} from '../admin-foundation/local-stack.mjs';
let stack,users,campaign;
const ctx=async()=>{const r=await rpc(stack,'public_qurban_registration_context',undefined,{target_slug:slug});assert.equal(r.status,200);return r.data;};
const submit=p=>rpc(stack,'public_qurban_registration_submit',undefined,{payload:p});
const count=()=>Number(sql('select count(*) from private.qurban_registrations'));
const ownerSql=body=>{const now=Math.floor(Date.now()/1000),t=signedToken(stack,users.owner,{aal:'aal2',amr:[{method:'oauth',timestamp:now},{method:'totp',timestamp:now}]});const claims=JSON.parse(Buffer.from(t.split('.')[1],'base64url'));return sql("begin;select set_config('request.jwt.claims',"+quote(JSON.stringify(claims))+',true);'+body+';commit;');};
// Fixtures intentionally emulate already-stored states/corruption impossible through reviewed admin commands.
const edit=body=>ownerSql('alter table private.campaigns disable trigger campaign_row_guard;update private.campaigns set '+body+',version=version+1 where id='+quote(campaign)+';alter table private.campaigns enable trigger campaign_row_guard');
const restore=()=>edit("type_key='qurban',config_version=1,configuration="+quote(JSON.stringify(config))+"::jsonb,status='open',visibility='public',registration_opens_at=clock_timestamp()-interval '1 hour',registration_closes_at=clock_timestamp()+interval '2 days'");
before(()=>{({stack,users,campaign}=setup());});after(()=>{if(stack)cleanup();});
for(const key of ['campaigns.enabled','qurban.enabled'])for(const state of ['off','missing'])test('real fail closed '+key+' '+state,async()=>{
 const c=await ctx(),p=request(c);
 if(state==='off')ownerSql('update private.system_feature_flags set enabled=false where flag_key='+quote(key));
 else ownerSql('alter table private.system_feature_flags disable trigger user;delete from private.system_feature_flags where flag_key='+quote(key)+';alter table private.system_feature_flags enable trigger user');
 assert.equal(await ctx(),null);assert.equal((await submit(p)).status,409);
 if(state==='off')ownerSql('update private.system_feature_flags set enabled=true where flag_key='+quote(key));else ownerSql('insert into private.system_feature_flags(flag_key,enabled) values('+quote(key)+',true)');
});
for(const [name,change] of [...['draft','scheduled','paused','closed','archived'].map(s=>[s,"status="+quote(s)+",registration_opens_at=clock_timestamp()+interval '1 hour'"]),['private',"visibility='private'"],['before window',"registration_opens_at=clock_timestamp()+interval '1 hour'"],['past deadline',"registration_opens_at=clock_timestamp()-interval '2 days',registration_closes_at=clock_timestamp()-interval '1 day'"],['invalid config',"configuration='{}'::jsonb"],['missing akad',"configuration=jsonb_set(configuration,'{approved_akad_version}','\"missing-local-akad\"')"]])test('real denial '+name,async()=>{
 const p=request(await ctx());edit(change);try{assert.equal(await ctx(),null);assert.equal((await submit(p)).status,409);}finally{restore();}
});
test('real wrong type cannot gain context',async()=>{ownerSql(`create function private.local_qurban_denial(jsonb) returns boolean language sql immutable set search_path='' as $$ select $1='{}'::jsonb $$;revoke all on function private.local_qurban_denial(jsonb) from public,anon,authenticated,service_role,supabase_auth_admin;insert into private.campaign_type_descriptors values('local_fixture',1,'local_fixture.enabled','local_qurban_denial')`);const p=request(await ctx());edit("type_key='local_fixture',configuration='{}'::jsonb");try{assert.equal(await ctx(),null);assert.equal((await submit(p)).status,409);}finally{restore();}});
for(const key of ['expected_campaign_version','expected_global_flag_version','expected_module_flag_version','expected_akad_reference','expected_akad_hash'])test('real stale '+key,async()=>{const p=request(await ctx());p[key]=typeof p[key]==='number'?p[key]+1:key.endsWith('hash')?'0'.repeat(64):'wrong-reference';assert.equal((await submit(p)).status,409);});
for(const [name,patch] of [['consent',p=>p.accepted_akad=false],['zero participants',p=>p.participants=[]],['too many',p=>p.participants=Array.from({length:13},()=>p.participants[0])],['purpose',p=>p.participants[0].purpose='unsupported'],['phone',p=>p.applicant.phone='invalid'],['name',p=>p.applicant.name=''],['address raw CRLF bound',p=>p.applicant.address='a'.repeat(498)+'\r\n'+'x'],...['amount','reference','id','campaign_id','currency','akad_text'].map(k=>[k,p=>p[k]='caller-selected'])])test('real payload denial '+name,async()=>{const p=request(await ctx());patch(p);assert.equal((await submit(p)).status,400);});
test('real Data API/raw table/helper access denied to runtime roles',async()=>{
 for(const table of ['qurban_submission_idempotency','qurban_submission_audit']){
  for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator','campaign_scheduler'])for(const op of ['select * from','insert into','update','delete from']){
   const query=op==='insert into'?op+' private.'+table+' default values':op==='update'?op+' private.'+table+' set registration_id=registration_id':op+' private.'+table;
   assert.throws(()=>sql('begin;set local role '+role+';'+query+';rollback;'),/permission denied/);
  }
  for(const opts of [{},{token:signedToken(stack,users.admin)},{service:true}])assert.notEqual((await api(stack,'/rest/v1/'+table+'?select=*',opts)).status,200);
 }
 for(const fn of ['qurban_registration_submit','qurban_registration_context','qurban_submission_payload_valid'])assert.notEqual((await rpc(stack,fn,undefined,{})).status,200);
 assert([401,403].includes((await api(stack,'/rest/v1/rpc/public_qurban_registration_context',{service:true,method:'POST',body:{target_slug:slug}})).status));
});
test('real audit failure rolls all business/idempotency rows back',async()=>{
 sql("create function private.isolated_audit_failure() returns trigger language plpgsql as $$ begin raise exception 'isolated failure'; end $$;create trigger isolated_failure before insert on private.qurban_submission_audit for each row execute function private.isolated_audit_failure()");
 try{assert.equal((await submit(request(await ctx()))).status,503);assert.equal(count(),0);assert.equal(Number(sql('select count(*) from private.qurban_submission_idempotency')),0);assert.equal(Number(sql('select count(*) from private.qurban_consent_acceptances')),0);}finally{sql('drop trigger isolated_failure on private.qurban_submission_audit;drop function private.isolated_audit_failure()');}
});
test('real concurrent exact retry commits only once with immutable quote/consent/audit',async()=>{
 const p=request(await ctx());const results=await Promise.all(Array.from({length:8},()=>submit(p)));assert(results.every(r=>r.status===200));assert(results.every(r=>r.data.reference===results[0].data.reference));assert.equal(results[0].data.total_minor,37035);
 const c=inspect();assert.equal(Number(c.registrations),1);assert.equal(Number(c.participations),3);assert.equal(Number(c.consents),1);assert.equal(Number(c.akad_versions),1);assert.equal(Number(c.audit),1);assert.equal(Number(c.idempotency),1);
 const proof=rows(`select r.submission_configuration=c.configuration quote_match,r.quoted_total_minor=37035 total_match,a.accepted_content_hash=v.content_hash hash_match,(select count(*)=3 from private.qurban_participations p where p.registration_id=r.id) children_match,not exists(select 1 from jsonb_array_elements(a.participation_snapshot) e where not exists(select 1 from private.qurban_participations p where p.id=(e->>'id')::uuid and p.registration_id=r.id and p.participant_name=e->>'participant_name' and p.purpose=e->>'purpose' and p.version=(e->>'version')::integer)) snapshot_match from private.qurban_registrations r join private.campaigns c on c.id=r.campaign_id join private.qurban_consent_acceptances a on a.registration_id=r.id join private.qurban_akad_versions v on v.id=a.akad_version_id`)[0];assert(Object.values(proof).every(Boolean));
 assert.equal((await submit({...p,attendance:'yes'})).status,409);assert.equal(count(),1);
 assert.equal((await rpc(stack,'public_qurban_registration_status',undefined,{reference:results[0].data.reference})).status,404);
 console.log(JSON.stringify({successfulFixture:{registration:1,participations:3,consent:1,akad:1,audit:1,idempotency:1},evidence:proof}));
});
