import test,{beforeEach,afterEach} from 'node:test';import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {database} from '../admin-foundation/database.mjs';
import {assertLocalEnvironment,assertLocalDockerEndpoint,planSession,validatePlan,setupSql,cleanupSql,evidenceSql} from './fixture-session.mjs';
import {request,slug} from './fixtures.mjs';
let db,p,evidence;
const q=async(s,args=[]) => (await db.query(s,args)).rows;
const counts=async()=> (await q(`select (select count(*)::int from private.campaigns) campaigns,(select count(*)::int from private.system_feature_flags) flags,
 (select count(*)::int from private.qurban_registrations) registrations,(select count(*)::int from private.qurban_participations) participations,
 (select count(*)::int from private.qurban_consent_acceptances) consents,(select count(*)::int from private.qurban_submission_audit) audit,
 (select count(*)::int from private.qurban_submission_idempotency) idempotency,(select count(*)::int from private.qurban_akad_versions) akad,
 (select count(*)::int from auth.users) users,(select count(*)::int from public.admin_profiles) profiles,(select count(*)::int from private.admin_audit_log) admin_audit`))[0];
beforeEach(async()=>{
 db=await database();
 // Test-only completion of the minimal Auth contract to accept the real local fixture SQL.
 await db.exec(`alter table auth.users add column aud text,add column role text,add column created_at timestamptz,add column updated_at timestamptz,
 add column raw_app_meta_data jsonb,add column instance_id uuid,add column confirmation_token text,add column recovery_token text,
 add column email_change_token_new text,add column email_change text,add column encrypted_password text;
 alter table auth.identities add column created_at timestamptz,add column updated_at timestamptz;
 alter table auth.sessions add column created_at timestamptz,add column updated_at timestamptz,add column aal text;
 alter table auth.mfa_factors add column friendly_name text,add column secret text,add column created_at timestamptz,add column updated_at timestamptz;
 create table auth.mfa_amr_claims(id uuid primary key,session_id uuid references auth.sessions(id),created_at timestamptz,updated_at timestamptz,authentication_method text);`);
 p=planSession();const now=Math.floor(Date.now()/1000);
 const claims={sub:p.users.owner.id,role:'authenticated',session_id:p.users.owner.session,aal:'aal2',amr:[{method:'oauth',timestamp:now},{method:'totp',timestamp:now}]};
 const result=await db.exec(setupSql(p,claims));
 evidence=result.flatMap(r=>r.rows).find(r=>r.evidence).evidence;
 await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(claims)]);
});
afterEach(async()=>db?.close());
const submit=async(n)=>{const c=(await q('select public.public_qurban_registration_context($1) data',[slug]))[0].data;
 return (await q('select public.public_qurban_registration_submit($1) data',[JSON.stringify(request(c,n))]))[0].data;};
const cleanup=async()=>db.exec(cleanupSql(p,evidence));
test('local-only guard rejects production, hosted URLs and hosted deployment before DB access',()=>{
 for(const env of [{NODE_ENV:'production'},{VERCEL:'1'},{ADMIN_SUPABASE_ENV:'staging'},{SUPABASE_URL:'https://example.supabase.co'},{NEXT_PUBLIC_SUPABASE_URL:'http://localhost:54321'},{DOCKER_HOST:'tcp://remote:2376'}])assert.throws(()=>assertLocalEnvironment(env),/local/);
 for(const endpoint of ['ssh://remote','tcp://127.0.0.1:2375',undefined])assert.throws(()=>assertLocalDockerEndpoint(endpoint),/remote Docker/);
 for(const endpoint of ['npipe:////./pipe/dockerDesktopLinuxEngine','unix:///var/run/docker.sock'])assert.doesNotThrow(()=>assertLocalDockerEndpoint(endpoint));
 assert.doesNotThrow(()=>assertLocalEnvironment({NODE_ENV:'development',ADMIN_SUPABASE_ENV:'local',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321'}));
});
test('ownership plan rejects unknown keys, duplicated IDs and malformed identities',()=>{
 assert.throws(()=>validatePlan({...p,extra:'x'}));assert.throws(()=>validatePlan({...p,session:p.campaign}));assert.throws(()=>validatePlan({...p,campaign:"';delete from auth.users;--"}));
 assert.throws(()=>cleanupSql(p,null),/ownership evidence/);assert.throws(()=>cleanupSql(p,{...evidence,unexpected:{}}),/ownership evidence/);
});
test('two genuine registrations and all dependencies removed; descriptor and guards retained; repeat is a no-op',async()=>{
 await submit(3);await submit(1);assert.deepEqual(await counts(),{campaigns:1,flags:2,registrations:2,participations:4,consents:2,audit:2,idempotency:2,akad:1,users:9,profiles:5,admin_audit:1});
 await cleanup();assert(Object.values(await counts()).every(v=>v===0));assert.equal((await q('select count(*)::int n from private.campaign_type_descriptors'))[0].n,2);
 assert.equal((await q("select count(*)::int n from pg_trigger where not tgisinternal and tgenabled<>'O'"))[0].n,0);
 await cleanup();assert(Object.values(await counts()).every(v=>v===0));
});
test('unrelated Auth user is preserved, rather than deleting all local users',async()=>{
 const id=randomUUID();await q('insert into auth.users(id,email) values($1,$2)',[id,'unrelated@example.test']);await submit(1);await cleanup();
 assert.equal((await q('select id from auth.users'))[0].id,id);assert.equal((await counts()).registrations,0);await cleanup();assert.equal((await counts()).users,1);
});
test('missing or changed session marker cannot adopt legacy or other fixtures',async()=>{
 const altered={...p,session:randomUUID()};await assert.rejects(db.exec(cleanupSql(altered,evidence)),/marker mismatch/);await db.exec('rollback');assert.equal((await counts()).campaigns,1);
});
test('changed fixture flag aborts cleanup without deleting business rows',async()=>{
 await submit(1);await db.exec("update private.system_feature_flags set enabled=false where flag_key='qurban.enabled'");
 await assert.rejects(cleanup(),/ownership evidence changed/);await db.exec('rollback');assert.equal((await counts()).registrations,1);assert.equal((await counts()).flags,2);
});
test('another campaign refuses deletion of shared global flags and identities',async()=>{
 await db.exec("insert into private.campaigns(type_key,config_version,slug,title,configuration) select type_key,config_version,'unrelated-local-campaign','Unrelated campaign',configuration from private.campaigns");
 await assert.rejects(cleanup(),/another campaign/);await db.exec('rollback');assert.equal((await counts()).campaigns,2);assert.equal((await counts()).users,9);
});
test('unowned extra Auth session is not removed by implicit cascade',async()=>{
 await q('insert into auth.sessions(id,user_id) values($1,$2)',[randomUUID(),p.users.owner.id]);await assert.rejects(cleanup(),/Unowned Auth dependency/);await db.exec('rollback');assert.equal((await counts()).campaigns,1);
});
test('unknown Auth FK cascade dependency fails closed',async()=>{
 await db.exec('create table auth.local_unknown_dependency(user_id uuid references auth.users(id) on delete cascade)');await q('insert into auth.local_unknown_dependency values($1)',[p.users.owner.id]);
 await assert.rejects(cleanup(),/Unknown Auth dependency/);await db.exec('rollback');assert.equal((await q('select count(*)::int n from auth.local_unknown_dependency'))[0].n,1);
});
test('failure late in cleanup rolls back all deletes and restores immutable guards',async()=>{
 await submit(3);const before=await counts();await db.exec("create function private.local_cleanup_failure() returns trigger language plpgsql as $$ begin raise exception 'injected cleanup failure'; end $$;create trigger local_cleanup_failure before delete on private.system_feature_flags for each row execute function private.local_cleanup_failure()");
 await assert.rejects(cleanup(),/injected cleanup failure/);await db.exec('rollback');assert.deepEqual(await counts(),before);
 assert.equal((await q("select count(*)::int n from pg_trigger where not tgisinternal and tgenabled<>'O'"))[0].n,0);
});
test('setup is atomic when an unexpected failure occurs',async()=>{
 await cleanup();await db.exec("create function private.local_setup_failure() returns trigger language plpgsql as $$ begin raise exception 'injected setup failure'; end $$;create trigger local_setup_failure before insert on private.qurban_akad_versions for each row execute function private.local_setup_failure()");
 const fresh=planSession(),now=Math.floor(Date.now()/1000);await assert.rejects(db.exec(setupSql(fresh,{sub:fresh.users.owner.id,role:'authenticated',session_id:fresh.users.owner.session,aal:'aal2',amr:[{method:'oauth',timestamp:now},{method:'totp',timestamp:now}]})),/injected setup failure/);
 await db.exec('rollback');assert(Object.values(await counts()).every(v=>v===0));
});
test('setup refuses occupied DB and never overwrites current ownership',async()=>{
 const before=await counts();await assert.rejects(db.exec(setupSql(planSession(),{})),/empty local database/);await db.exec('rollback');assert.deepEqual(await counts(),before);
 assert.deepEqual((await q(evidenceSql(p)))[0].evidence,evidence);
});

test('owned grid/allocation/audit removed before parents, guards restored, repeat-safe',async()=>{
 await submit(3);await q('select private.qurban_admin_initialize_grid($1)',[p.campaign]);
 const r=(await q('select id from private.qurban_registrations where campaign_id=$1',[p.campaign]))[0].id,ps=(await q('select id from private.qurban_participations where registration_id=$1',[r])).map(p=>p.id);
 await q('select private.qurban_allocate_registration($1,$2,$3::uuid[])',[p.campaign,r,'{'+ps.join(',')+'}']);
 assert.equal((await q('select count(*)::int n from private.qurban_allocations'))[0].n,3);await cleanup();await cleanup();
 for(const t of ['qurban_allocations','qurban_cattle_slots','qurban_cattle','qurban_operational_audit'])assert.equal((await q('select count(*)::int n from private.'+t))[0].n,0);
 for(const name of ['qurban_allocation_guard','qurban_cattle_slot_guard','qurban_cattle_guard'])assert.equal((await q('select tgenabled from pg_trigger where tgname=$1',[name]))[0].tgenabled,'O');
});
test('synthetic allocator command requires exact ownership preflight and never disables guards',async()=>{
 const {ownedFixtureSql}=await import('../qurban-allocation/review-fixture.mjs');
 const claims={sub:p.users.owner.id,role:'authenticated',session_id:p.users.owner.session,aal:'aal2',amr:[{method:'totp',timestamp:Math.floor(Date.now()/1000)}]};
 assert.throws(()=>ownedFixtureSql(p,null,'perform 1;',claims),/ownership evidence/);
 const command=ownedFixtureSql(p,evidence,'perform 1;',claims);assert(!command.includes('disable trigger'));assert(!command.includes('delete from'));assert(command.includes('Fixture ownership evidence changed'));
 await q("update private.campaigns set title='Tampered review title' where id=$1",[p.campaign]);await assert.rejects(db.exec(command),/ownership evidence changed/);await db.exec('rollback');assert.equal((await counts()).campaigns,1);
});

test('owned volunteer/label/idempotency/audit cleanup is ordered atomic repeat-safe with all guards restored',async()=>{
 const ctx=(await q('select public.public_qurban_volunteer_context($1) data',[slug]))[0].data;
 const payload={slug,idempotency_key:randomUUID().replaceAll('-','')+randomUUID().replaceAll('-',''),expected_campaign_version:ctx.campaign_version,expected_global_flag_version:ctx.global_flag_version,expected_module_flag_version:ctx.module_flag_version,volunteer:{name:'LOCAL CLEANUP VOLUNTEER',phone:'0123456789',email:null,shirt_size:'2XL',also_participant:true,participant_name_information:'Informational only'}};
 const receipt=(await q('select public.public_qurban_volunteer_submit($1) data',[JSON.stringify(payload)]))[0].data,v=(await q('select id from private.qurban_volunteers where public_reference=$1',[receipt.reference]))[0];
 const label=(await q('select private.qurban_volunteer_label_command($1,$2) data',[p.campaign,JSON.stringify({action:'create',name:'Local cleanup label'})]))[0].data;
 await q('select private.qurban_volunteer_assign($1,$2,1,$3,1)',[p.campaign,v.id,label.id]);await submit(2);
 for(const t of ['qurban_volunteers','qurban_volunteer_assignment_labels','qurban_volunteer_audit','qurban_volunteer_idempotency'])assert((await q('select count(*)::int n from private.'+t))[0].n>0);
 await cleanup();await cleanup();assert(Object.values(await counts()).every(n=>n===0));for(const t of ['qurban_volunteers','qurban_volunteer_assignment_labels','qurban_volunteer_audit','qurban_volunteer_idempotency'])assert.equal((await q('select count(*)::int n from private.'+t))[0].n,0);
 for(const guard of ['qurban_volunteer_guard','qurban_volunteer_label_guard','qurban_volunteer_idempotency_guard','qurban_volunteer_audit_guard'])assert.equal((await q('select tgenabled from pg_trigger where tgname=$1',[guard]))[0].tgenabled,'O');
});
test('selective volunteer cleanup refuses unowned campaign/volunteers without partial deletion',async()=>{
 const c=(await q("insert into private.campaigns(type_key,config_version,slug,title,configuration) select type_key,config_version,'unrelated-volunteer-campaign','Unrelated volunteer campaign',configuration from private.campaigns returning id"))[0];
 await q("insert into private.qurban_volunteers(campaign_id,name,phone,shirt_size,also_participant) values($1,'UNRELATED VOLUNTEER','0123456789','XS',false)",[c.id]);
 await assert.rejects(cleanup(),/another campaign/);await db.exec('rollback');assert.equal((await q('select count(*)::int n from private.qurban_volunteers where campaign_id=$1',[c.id]))[0].n,1);assert.equal((await counts()).campaigns,2);
});
