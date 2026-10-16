import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {database,fixtures,asUser,ids} from '../admin-foundation/database.mjs';
import {validConfig,invalidConfigs} from './fixtures.mjs';
let db,campaign,reg,part,akad;
const tables=['qurban_registrations','qurban_participations','qurban_akad_versions','qurban_consent_acceptances'];
const roles=['anon','authenticated','service_role','supabase_auth_admin','authenticator','campaign_scheduler'];
const registration = (patch={}) => ({campaign_id:campaign,campaign_config_version:1,campaign_revision:1,submission_configuration:validConfig,quoted_participation_count:1,applicant_name:'Applicant Fixture',phone:'0123456789',address:'Isolated fixture address',attendance:'unsure',...patch});
async function insert(table, data) {
 const keys=Object.keys(data);return (await db.query('insert into private.'+table+'('+keys.join(',')+') values('+keys.map((_,i)=>'$'+(i+1)).join(',')+') returning *',keys.map(k=>typeof data[k]==='object'&&data[k]!==null?JSON.stringify(data[k]):data[k]))).rows[0];
}
before(async()=>{db=await database();});after(async()=>db?.close());
test('fresh reset-equivalent migration state: sole descriptor, zero campaigns/flags/domain rows',async()=>{
 assert.deepEqual((await db.query('select type_key,config_version,module_flag_key,validator_name from private.campaign_type_descriptors')).rows,[{type_key:'qurban',config_version:1,module_flag_key:'qurban.enabled',validator_name:'qurban_config_v1_valid'}]);
 for(const t of ['campaigns','system_feature_flags',...tables])assert.equal((await db.query('select count(*)::int n from private.'+t)).rows[0].n,0);
 assert.equal((await db.query("select private.system_flag_effectively_enabled('qurban.enabled') ok")).rows[0].ok,false);
 assert.deepEqual((await db.query("select tablename from pg_tables where schemaname='private' and tablename like 'qurban_%' order by tablename")).rows.map(r=>r.tablename),[...tables,'qurban_operational_audit','qurban_export_requests','qurban_submission_audit','qurban_submission_idempotency','qurban_cattle','qurban_cattle_slots','qurban_allocations','qurban_volunteers','qurban_volunteer_assignment_labels','qurban_volunteer_idempotency','qurban_volunteer_audit'].sort());
});
for(const [name,value] of invalidConfigs)test('DB config rejects '+name,async()=>assert.equal((await db.query('select private.qurban_config_v1_valid($1) ok',[JSON.stringify(value)])).rows[0].ok,false));
test('DB config accepts exact valid fixture / optional official URL; no current price defaults',async()=>{
 for(const c of [validConfig,{...validConfig,volunteer_whatsapp_group_url:'https://chat.whatsapp.com/DEMOREVIEWONLY'}])assert.equal((await db.query('select private.qurban_config_v1_valid($1) ok',[JSON.stringify(c)])).rows[0].ok,true);
 const f=(await db.query("select p.provolatile,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='qurban_config_v1_valid'")).rows[0];assert.equal(f.provolatile,'i');assert.equal(f.prosecdef,false);assert(f.proconfig.includes('search_path=""'));
});
for(const t of tables)test(t+' RLS enabled, zero policies/PUBLIC ACL',async()=>{
 assert((await db.query("select relrowsecurity from pg_class where oid=$1::regclass",['private.'+t])).rows[0].relrowsecurity);
 assert.equal((await db.query("select count(*)::int n from pg_policies where schemaname='private' and tablename=$1",[t])).rows[0].n,0);
 assert.equal((await db.query("select count(*)::int n from pg_class c,lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where c.oid=$1::regclass and a.grantee=0",['private.'+t])).rows[0].n,0);
});
for(const t of tables)for(const role of roles)for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])test(role+' cannot raw '+privilege+' '+t,async()=>assert.equal((await db.query('select has_table_privilege($1,$2,$3) ok',[role,'private.'+t,privilege])).rows[0].ok,false));
for(const f of ['qurban_config_v1_valid(jsonb)','qurban_text_valid(text,integer,integer)','qurban_consent_snapshot_valid(jsonb)','qurban_record_guard()'])for(const role of roles)test(role+' cannot execute '+f,async()=>assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') ok",[role,'private.'+f])).rows[0].ok,false));
test('existing manager boundary: admin valid draft/private; invalid config and staff/AAL1/stale TOTP denied',async()=>{
 await fixtures(db);
 const payload={type_key:'qurban',config_version:1,slug:'isolated-qurban-test',title:'Isolated verification',configuration:validConfig};
 for(const who of ['staff','outsider','disabled','revoked'])await assert.rejects(asUser(db,who,'select public.admin_campaign_create($1)',[JSON.stringify(payload)]),e=>e.code==='42501');
 await assert.rejects(asUser(db,'owner','select public.admin_campaign_create($1)',[JSON.stringify(payload)],{aal:'aal1'}),e=>e.code==='42501');
 await assert.rejects(asUser(db,'owner','select public.admin_campaign_create($1)',[JSON.stringify(payload)],{amr:[{method:'totp',timestamp:Math.floor(Date.now()/1000)-700}]}),e=>e.code==='42501');
 for(const c of [{},...invalidConfigs.map(x=>x[1])])await assert.rejects(asUser(db,'admin','select public.admin_campaign_create($1)',[JSON.stringify({...payload,configuration:c})]));
 const result=(await asUser(db,'admin','select public.admin_campaign_create($1) data',[JSON.stringify(payload)])).rows[0].data;campaign=result.id;
 const row=(await db.query('select * from private.campaigns where id=$1',[campaign])).rows[0];assert.equal(row.status,'draft');assert.equal(row.visibility,'private');assert.equal(row.registration_opens_at,null);
 reg=await insert('qurban_registrations',registration());
 part=await insert('qurban_participations',{registration_id:reg.id,participant_name:'Participation Fixture',purpose:'qurban'});
 akad=await insert('qurban_akad_versions',{campaign_id:campaign,version_reference:validConfig.approved_akad_version,approved_text:'Isolated approved text, not annual wording.',approved_by:ids.admin,approval_reference:'ISOLATED-MINUTES-REFERENCE'});
});
test('opaque unique public references / quote derived exact integer minor units',async()=>{
 const r=await insert('qurban_registrations',registration());assert.match(r.public_reference,/^QBN-[0-9a-f]{64}$/);assert.notEqual(r.public_reference,reg.public_reference);assert.equal(Number(r.quoted_total_minor),123456);assert.equal(r.quoted_currency,'MYR');
 await assert.rejects(insert('qurban_registrations',registration({public_reference:reg.public_reference})),e=>e.code==='23505');
 for(const reference of ['1','QBN-2042-001','Participation Fixture'])await assert.rejects(insert('qurban_registrations',registration({public_reference:reference})),e=>e.code==='23514');
});
for(const patch of [{applicant_name:' padded '},{applicant_name:'x'.repeat(161)},{phone:'123'},{phone:'hello there'},{address:'a\u0001b'},{email:'invalid'},{attendance:'maybe'},{status:'confirmed'},{quoted_participation_count:0},{campaign_revision:2},{submission_configuration:{...validConfig,price_per_cattle_share_minor:-1}}])test('registration constraints '+JSON.stringify(patch).slice(0,60),async()=>await assert.rejects(insert('qurban_registrations',registration(patch))));
test('registration campaign FK/ownership and quote immutability',async()=>{
 await assert.rejects(insert('qurban_registrations',registration({campaign_id:'ffffffff-ffff-4fff-8fff-ffffffffffff'})));
 await assert.rejects(db.query("update private.qurban_registrations set submission_configuration=jsonb_set(submission_configuration,'{campaign_year}','2043') where id=$1",[reg.id]),e=>e.code==='23514');
 await assert.rejects(db.query('update private.qurban_registrations set public_reference=$1 where id=$2',['QBN-'+'a'.repeat(64),reg.id]),e=>e.code==='23514');
});
for(const patch of [{participant_name:' padded '},{participant_name:''},{purpose:'ramadan'},{registration_id:'ffffffff-ffff-4fff-8fff-ffffffffffff'}])test('participation constraints '+JSON.stringify(patch),async()=>await assert.rejects(insert('qurban_participations',{registration_id:reg.id,participant_name:'Fixture',purpose:'qurban',...patch})));
test('immutable akad/fingerprint, exact immutable consent snapshot and future amendment history',async()=>{
 assert.match(akad.content_hash,/^[0-9a-f]{64}$/);
 for(const q of ['update private.qurban_akad_versions set approved_text=\'changed\'','delete from private.qurban_akad_versions'])await assert.rejects(db.exec(q),e=>e.code==='42501');
 const snap=[{id:part.id,participant_name:part.participant_name,purpose:part.purpose,version:part.version}];
 const data={registration_id:reg.id,campaign_id:campaign,akad_version_id:akad.id,participation_snapshot:snap};
 for(const snapshot of [[],[{...snap[0],unknown:true}],[{...snap[0],participant_name:'Wrong person'}],Array(101).fill(snap[0]),[{...snap[0],participant_name:'x'.repeat(33000)}]])await assert.rejects(insert('qurban_consent_acceptances',{...data,participation_snapshot:snapshot}));
 const consent=await insert('qurban_consent_acceptances',data);assert.equal(consent.accepted_content_hash,akad.content_hash);assert.equal(new Date(consent.accepted_at).getUTCFullYear(),new Date().getUTCFullYear());
 await assert.rejects(db.exec('update private.qurban_consent_acceptances set participation_snapshot=\'[]\''),e=>e.code==='42501');await assert.rejects(db.exec('delete from private.qurban_consent_acceptances'),e=>e.code==='42501');
 await db.query('update private.qurban_participations set participant_name=$1 where id=$2',['Amended Fixture',part.id]);
 assert.deepEqual((await db.query('select participation_snapshot from private.qurban_consent_acceptances where id=$1',[consent.id])).rows[0].participation_snapshot,snap);
 const before=reg.submission_configuration;await asUser(db,'admin','select public.admin_campaign_update($1,1,$2)',[campaign,JSON.stringify({slug:'isolated-qurban-test',title:'Isolated verification',visibility:'private',scheduled_public_display:false,archived_history_display:false,config_version:1,configuration:{...validConfig,price_per_cattle_share_minor:222222}})]);
 assert.deepEqual((await db.query('select submission_configuration from private.qurban_registrations where id=$1',[reg.id])).rows[0].submission_configuration,before);
 const audits=(await db.query('select metadata from private.admin_audit_log')).rows;assert(!JSON.stringify(audits).includes('Participation Fixture'));assert(!JSON.stringify(audits).includes('Applicant Fixture'));
});

test('same-campaign ownership, configured purpose and immutable evidence references',async()=>{
 const cfg={...validConfig,allowed_purposes:['qurban']};
 const cmd={type_key:'qurban',config_version:1,slug:'isolated-second-qurban',title:'Isolated second campaign',configuration:cfg};
 const second=(await asUser(db,'admin','select public.admin_campaign_create($1) data',[JSON.stringify(cmd)])).rows[0].data.id;
 const r=await insert('qurban_registrations',registration({campaign_id:second,submission_configuration:cfg}));
 await assert.rejects(insert('qurban_participations',{registration_id:r.id,participant_name:'Isolated Second',purpose:'aqiqah'}),e=>e.code==='23514');
 const p=await insert('qurban_participations',{registration_id:r.id,participant_name:'Isolated Second',purpose:'qurban'});
 await assert.rejects(insert('qurban_consent_acceptances',{registration_id:r.id,campaign_id:second,akad_version_id:akad.id,participation_snapshot:[{id:p.id,participant_name:p.participant_name,purpose:p.purpose,version:p.version}]}),e=>e.code==='23514');
 await assert.rejects(db.query('update private.qurban_participations set registration_id=$1 where id=$2',[reg.id,p.id]),e=>e.code==='23514');
});

test('duplicate participant names remain independent shares and consent IDs',async()=>{
 const r=await insert('qurban_registrations',registration({campaign_revision:2,submission_configuration:{...validConfig,price_per_cattle_share_minor:222222},quoted_participation_count:2}));
 const first=await insert('qurban_participations',{registration_id:r.id,participant_name:'Same Fixture Name',purpose:'qurban'});
 const second=await insert('qurban_participations',{registration_id:r.id,participant_name:'Same Fixture Name',purpose:'aqiqah'});
 assert.notEqual(first.id,second.id);
 const snapshot=[first,second].map(p=>({id:p.id,participant_name:p.participant_name,purpose:p.purpose,version:p.version}));
 const acceptance=await insert('qurban_consent_acceptances',{registration_id:r.id,campaign_id:campaign,akad_version_id:akad.id,participation_snapshot:snapshot});
 assert.equal(acceptance.participation_snapshot.length,2);
});

test('postal address keeps safe internal line breaks, other controls remain denied',async()=>{const r=await insert('qurban_registrations',registration({campaign_revision:2,submission_configuration:{...validConfig,price_per_cattle_share_minor:222222},address:'Isolated house\nIsolated street'}));assert.equal(r.address,'Isolated house\nIsolated street');await assert.rejects(insert('qurban_registrations',registration({address:'Invalid\taddress'})));});
