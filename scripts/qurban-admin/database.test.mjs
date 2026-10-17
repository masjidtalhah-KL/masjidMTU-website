import test,{before,after} from 'node:test';import assert from 'node:assert/strict';
import {database,fixtures,asUser,ids} from '../admin-foundation/database.mjs';import {config,slug,text,request} from '../qurban-registration/fixtures.mjs';
let db,campaign,registration,participant,original,submittedPayload,submittedResult;
const q=async(s,a=[]) =>(await db.query(s,a)).rows;
const call=async(name,fn,args=[],options={})=>(await asUser(db,name,'select public.'+fn+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') data',args.map(a=>a&&typeof a==='object'?JSON.stringify(a):a),options)).rows[0].data;
const options={page:1,page_size:20,search:'',status:'all',purpose:'all',sort:'newest'};
const detail=(name='admin')=>call(name,'admin_qurban_detail',[campaign,registration]);
const auditCount=async()=> (await q('select count(*)::int n from private.qurban_operational_audit'))[0].n;
const regChanges=d=>Object.fromEntries(['applicant_name','phone','address','email','attendance','same_cattle_preference'].map(k=>[k,d[k]]));
before(async()=>{
 db=await database();await fixtures(db);
 campaign=(await call('admin','admin_campaign_create',[{type_key:'qurban',config_version:1,slug,title:'UJIAN Qurban Admin',configuration:config}])).id;
 const claims=(await asUser(db,'owner','select auth.jwt() claims')).rows[0].claims;await q("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(claims)]);
 await q("update private.campaigns set visibility='public',status='open',registration_opens_at=clock_timestamp()-interval '1 hour',registration_closes_at=clock_timestamp()+interval '1 day' where id=$1",[campaign]);
 await q("insert into private.system_feature_flags(flag_key,enabled) values('campaigns.enabled',true),('qurban.enabled',true)");
 await q('insert into private.qurban_akad_versions(campaign_id,version_reference,approved_text,approved_by,approval_reference) values($1,$2,$3,$4,$5)',[campaign,config.approved_akad_version,text,ids.admin,'LOCAL ONLY ADMIN TEST']);
 const context=(await q('select public.public_qurban_registration_context($1) data',[slug]))[0].data;
 submittedPayload=request(context);const result=await call(null,'public_qurban_registration_submit',[submittedPayload]);submittedResult=result;
 registration=(await q('select id from private.qurban_registrations where public_reference=$1',[result.reference]))[0].id;
 participant=(await q('select id from private.qurban_participations where registration_id=$1 order by created_at,id',[registration]))[0].id;
 original=(await q('select to_jsonb(t) data from private.qurban_consent_acceptances t where registration_id=$1',[registration]))[0].data;
});
after(async()=>db?.close());
for(const name of [null,'outsider','disabled','revoked'])test('read and mutation denied '+name,async()=>{await assert.rejects(call(name,'admin_qurban_list',[campaign,options]),e=>e.code==='42501');await assert.rejects(call(name,'admin_qurban_cancel',[campaign,registration,1,'applicant_request']),e=>e.code==='42501');});
test('staff list/detail omit address/email/consent and audit',async()=>{
 const list=await call('staff','admin_qurban_list',[campaign,options]);assert.equal(list.items.length,1);assert.equal(list.can_manage,false);const d=await detail('staff');
 for(const key of ['address','email','consent','submission_configuration','accepted_content_hash'])assert(!Object.hasOwn(d,key));assert(d.applicant_name&&d.phone&&d.participants[0].participant_name);
 await assert.rejects(call('staff','admin_qurban_activity',[campaign,1]),e=>e.code==='42501');
});
for(const fn of ['admin_qurban_amend','admin_qurban_cancel','admin_qurban_export_snapshot','admin_qurban_export_complete'])test('staff command denied '+fn,async()=>{
 const args=fn.endsWith('amend')?[campaign,registration,{kind:'registration',expected_version:1,changes:{}}]:fn.endsWith('cancel')?[campaign,registration,1,'entry_error']:fn.endsWith('snapshot')?[campaign]:[campaign,campaign,'f'.repeat(64)];
 await assert.rejects(call('staff',fn,args),e=>e.code==='42501');
});
test('admin full detail includes contact and safe consent summary',async()=>{const d=await detail();assert(d.address);assert(Object.hasOwn(d,'email'));assert.equal(d.consent.akad_reference,config.approved_akad_version);assert(!Object.hasOwn(d.consent,'participation_snapshot'));});
for(const patch of [{applicant_name:'Pemohon Dibetulkan'},{phone:'+60 12-3334444'},{address:'Alamat Baru\nBandar Ujian'},{email:'updated@example.test'},{email:'changed@example.test'},{email:null},{attendance:'yes'},{attendance:'no'},{same_cattle_preference:false}])test('admin contact amendment '+JSON.stringify(patch),async()=>{
 const d=await detail(),n=await auditCount();const r=await call('admin','admin_qurban_amend',[campaign,registration,{kind:'registration',expected_version:d.version,changes:{...regChanges(d),...patch}}]);assert.equal(r.version,d.version+1);assert.equal(await auditCount(),n+1);for(const [k,v]of Object.entries(patch))assert.deepEqual((await detail())[k],v);
});
for(const purpose of ['aqiqah','qurban'])test('participant name/purpose amendment '+purpose+' preserves consent, quote and aggregate concurrency',async()=>{
 const d=await detail(),p=d.participants.find(p=>p.id===participant),quote=d.quote;
 const r=await call('admin','admin_qurban_amend',[campaign,registration,{kind:'participation',expected_version:d.version,participation_id:participant,expected_participation_version:p.version,changes:{participant_name:'Peserta Dikemaskini '+purpose,purpose}}]);
 const after=await detail();assert.equal(after.version,d.version+1);assert.equal(r.version,after.version);assert.deepEqual(after.quote,quote);assert.equal(after.consent.current_participants_differ,true);
 assert.deepEqual((await q('select to_jsonb(t) data from private.qurban_consent_acceptances t where registration_id=$1',[registration]))[0].data,original);
 assert.equal((await q('select count(*)::int n from private.qurban_consent_acceptances'))[0].n,1);
});
test('stale contact/participant version denies all changes and audit',async()=>{
 const d=await detail(),n=await auditCount();await assert.rejects(call('admin','admin_qurban_amend',[campaign,registration,{kind:'registration',expected_version:d.version-1,changes:regChanges(d)}]),e=>e.code==='PT409');
 const p=d.participants[0];await assert.rejects(call('admin','admin_qurban_amend',[campaign,registration,{kind:'participation',expected_version:d.version,participation_id:p.id,expected_participation_version:p.version+1,changes:{participant_name:p.participant_name,purpose:p.purpose}}]),e=>e.code==='PT409');assert.equal(await auditCount(),n);assert.deepEqual(await detail(),d);
});
for(const key of ['id','public_reference','campaign_id','submission_configuration','quoted_participation_count','status','created_at'])test('immutable field injection denied '+key,async()=>{
 const d=await detail(),n=await auditCount();await assert.rejects(call('admin','admin_qurban_amend',[campaign,registration,{kind:'registration',expected_version:d.version,changes:{...regChanges(d),[key]:'override'}}]),e=>e.code==='22023');assert.equal(await auditCount(),n);
});
test('unsupported purpose denied; unchanged correction has no audit',async()=>{
 const d=await detail(),p=d.participants[0],n=await auditCount();
 await assert.rejects(call('admin','admin_qurban_amend',[campaign,registration,{kind:'participation',expected_version:d.version,participation_id:p.id,expected_participation_version:p.version,changes:{participant_name:p.participant_name,purpose:'unsupported'}}]),e=>e.code==='22023');
 assert.equal((await call('admin','admin_qurban_amend',[campaign,registration,{kind:'registration',expected_version:d.version,changes:regChanges(d)}])).unchanged,true);assert.equal(await auditCount(),n);
});
test('super-admin AAL2 and recent TOTP guards preserved',async()=>{
 await assert.rejects(call('owner','admin_qurban_list',[campaign,options],{aal:'aal1'}),e=>e.code==='42501');
 const old=[{method:'oauth',timestamp:Math.floor(Date.now()/1000)},{method:'totp',timestamp:Math.floor(Date.now()/1000)-601}];
 const d=await detail();await assert.rejects(call('owner','admin_qurban_cancel',[campaign,registration,d.version,'entry_error'],{amr:old}),e=>e.code==='42501');
 assert.equal((await call('owner','admin_qurban_list',[campaign,options])).can_manage,true);
});
test('pagination/filter/safe search are bounded and exact',async()=>{
 const d=await detail();assert.equal((await call('staff','admin_qurban_list',[campaign,{...options,search:d.public_reference.toLowerCase()}])).total,1);
 assert.equal((await call('staff','admin_qurban_list',[campaign,{...options,search:'notfound'}])).total,0);
 for(const patch of [{page:0},{page_size:51},{sort:'DROP'},{extra:true},{search:'x'.repeat(101)}])await assert.rejects(call('admin','admin_qurban_list',[campaign,{...options,...patch}]),e=>e.code==='22023');
});
test('export snapshot coherent; generation not completed yet; finish bounded/idempotent',async()=>{
 const n=await auditCount(),s=await call('admin','admin_qurban_export_snapshot',[campaign]);assert.equal(s.summary.registrations,1);assert.equal(s.summary.participants,3);assert.equal(s.registrations.length,1);assert.equal(s.participants.length,3);assert.equal(await auditCount(),n);
 await assert.rejects(call('admin','admin_qurban_export_complete',[campaign,s.export_id,'0'.repeat(64)]),e=>e.code==='PT409');assert.equal(await auditCount(),n);
 await call('admin','admin_qurban_export_complete',[campaign,s.export_id,s.snapshot_hash]);assert.equal(await auditCount(),n+1);
 await call('admin','admin_qurban_export_complete',[campaign,s.export_id,s.snapshot_hash]);assert.equal(await auditCount(),n+1);
 const audit=(await q("select to_jsonb(t) data from private.qurban_operational_audit t where action='qurban.export.xlsx'"))[0].data;assert.equal(audit.registration_count,1);assert(!JSON.stringify(audit).includes('Pemohon'));
});
test('cancel requires bounded controlled reason; then terminal, no hard delete or loss of consent',async()=>{
 const d=await detail(),n=await auditCount();for(const reason of [null,'','x'.repeat(201),'Name 0123456789'])await assert.rejects(call('admin','admin_qurban_cancel',[campaign,registration,d.version,reason]),e=>e.code==='22023');
 await call('admin','admin_qurban_cancel',[campaign,registration,d.version,'applicant_request']);const after=await detail();assert.equal(after.status,'cancelled');assert.equal(after.participants.length,3);assert.equal(await auditCount(),n+1);
 await assert.rejects(call('admin','admin_qurban_cancel',[campaign,registration,after.version,'applicant_request']),e=>e.code==='PT409');
 await assert.rejects(call('admin','admin_qurban_amend',[campaign,registration,{kind:'registration',expected_version:after.version,changes:regChanges(after)}]),e=>e.code==='PT409');
 assert.deepEqual((await q('select to_jsonb(t) data from private.qurban_consent_acceptances t where registration_id=$1',[registration]))[0].data,original);
});
for(const table of ['qurban_operational_audit','qurban_export_requests'])for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator','campaign_scheduler'])test('deny-first '+table+' '+role,async()=>{
 for(const op of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal((await q("select has_table_privilege($1,$2,$3) ok",[role,'private.'+table,op]))[0].ok,false);
 assert.equal((await q("select relrowsecurity ok from pg_class where oid=$1::regclass",['private.'+table]))[0].ok,true);
});
test('no refund/waitlist tables; reviewed independent volunteer tables allowed; reviewed allocation structure remains empty for public submissions, no private runtime EXECUTE or public grant',async()=>{
 assert.equal((await q("select count(*)::int n from pg_tables where schemaname='private' and tablename ~ '^qurban_(refund|waitlist|payment_verification)'"))[0].n,0);
 for(const table of ['qurban_cattle','qurban_cattle_slots','qurban_allocations','qurban_payments','qurban_receipts'])assert.equal((await q('select count(*)::int n from private.'+table))[0].n,0);
 const f=await q("select n.nspname,p.proname,p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'EXECUTE') anon,has_function_privilege('authenticated',p.oid,'EXECUTE') auth from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'qurban_admin_%' or p.proname like 'admin_qurban_%'");
 for(const r of f){assert(r.proconfig.includes('search_path=""'));assert.equal(r.anon,false);assert.equal(r.auth,r.nspname==='public');assert.equal(r.prosecdef,r.nspname==='public');}
});

test('audit write failure rolls back contact update and its version',async()=>{
 const d=await detail(),n=await auditCount();await db.exec("create function private.isolated_qurban_audit_failure() returns trigger language plpgsql as $$ begin raise exception 'isolated audit failure'; end $$;create trigger isolated_qurban_audit_failure before insert on private.qurban_operational_audit for each row execute function private.isolated_qurban_audit_failure()");
 // The record is cancelled at this point, so use a separate valid fixture registration.
 const context=(await q('select public.public_qurban_registration_context($1) data',[slug]))[0].data;
 const result=await call(null,'public_qurban_registration_submit',[request(context,1)]),id=(await q('select id from private.qurban_registrations where public_reference=$1',[result.reference]))[0].id;
 const r=await call('admin','admin_qurban_detail',[campaign,id]);
 try{await assert.rejects(call('admin','admin_qurban_amend',[campaign,id,{kind:'registration',expected_version:r.version,changes:{...regChanges(r),applicant_name:'Rollback Ujian'}}]),/isolated audit failure/);
 assert.deepEqual(await call('admin','admin_qurban_detail',[campaign,id]),r);assert.equal(await auditCount(),n);}finally{await db.exec('drop trigger isolated_qurban_audit_failure on private.qurban_operational_audit;drop function private.isolated_qurban_audit_failure()');}
 assert.equal(d.status,'cancelled');
});
test('cancelled cannot reopen even through storage-owner UPDATE',async()=>{
 const d=await detail();await assert.rejects(q("update private.qurban_registrations set status='submitted' where id=$1",[registration]),e=>e.code==='42501');assert.equal((await detail()).version,d.version);
});
test('expired export and cross-actor completion denied without audit',async()=>{
 const s=await call('admin','admin_qurban_export_snapshot',[campaign]),n=await auditCount();
 await assert.rejects(call('owner','admin_qurban_export_complete',[campaign,s.export_id,s.snapshot_hash]),e=>e.code==='42501');
 await db.exec('alter table private.qurban_export_requests disable trigger qurban_export_request_guard');
 // Both timestamps use statement time, keeping the exact 15 minute invariant.
 await q("update private.qurban_export_requests set captured_at=statement_timestamp()-interval '20 minutes',expires_at=statement_timestamp()-interval '5 minutes' where id=$1",[s.export_id]);
 await db.exec('alter table private.qurban_export_requests enable trigger qurban_export_request_guard');
 await assert.rejects(call('admin','admin_qurban_export_complete',[campaign,s.export_id,s.snapshot_hash]),e=>e.code==='PT409');assert.equal(await auditCount(),n);
});

test('accepted purpose configuration governs amendment even after campaign config expands',async()=>{
 await q("update private.campaigns set configuration=jsonb_set(configuration,'{allowed_purposes}','[\"qurban\"]') where id=$1",[campaign]);
 const context=(await q('select public.public_qurban_registration_context($1) data',[slug]))[0].data;
 const r=await call(null,'public_qurban_registration_submit',[request(context,1)]),id=(await q('select id from private.qurban_registrations where public_reference=$1',[r.reference]))[0].id;
 await q("update private.campaigns set configuration=jsonb_set(configuration,'{allowed_purposes}','[\"qurban\",\"aqiqah\"]') where id=$1",[campaign]);
 const d=await call('admin','admin_qurban_detail',[campaign,id]),p=d.participants[0];
 assert.deepEqual(d.allowed_purposes,['qurban']);
 await assert.rejects(call('admin','admin_qurban_amend',[campaign,id,{kind:'participation',expected_version:d.version,participation_id:p.id,expected_participation_version:p.version,changes:{participant_name:p.participant_name,purpose:'aqiqah'}}]),e=>e.code==='22023');
});
test('8.2 exact idempotent replay after admin amendments/cancellation/config edit returns original immutable quote',async()=>{
 const d=await detail(),n=await auditCount();assert.deepEqual(await call(null,'public_qurban_registration_submit',[submittedPayload]),submittedResult);
 assert.equal((await detail()).version,d.version);assert.equal(await auditCount(),n);
 assert.deepEqual((await q('select to_jsonb(t) data from private.qurban_consent_acceptances t where registration_id=$1',[registration]))[0].data,original);
});
