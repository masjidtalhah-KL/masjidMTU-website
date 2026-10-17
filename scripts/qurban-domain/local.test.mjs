import test,{before,after} from 'node:test';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';import {localStack,fixtures,sql,rows,quote,rpc,signedToken,api} from '../admin-foundation/local-stack.mjs';
import {validConfig,invalidConfigs} from './fixtures.mjs';
let stack,users,campaign;
const tables=['qurban_registrations','qurban_participations','qurban_akad_versions','qurban_consent_acceptances'];
const token=name=>signedToken(stack,users[name]);
before(()=>{stack=localStack();users=fixtures();});
after(()=>{execFileSync(process.execPath,['scripts/admin-foundation/local-cli.mjs','db','reset','--local','--no-seed'],{stdio:'pipe'});});
test('real descriptor and global/module OFF without seeds',async()=>{
 assert.deepEqual(rows("select type_key,config_version,module_flag_key,validator_name from private.campaign_type_descriptors where type_key='qurban'"),[{type_key:'qurban',config_version:1,module_flag_key:'qurban.enabled',validator_name:'qurban_config_v1_valid'}]);
 assert.equal(sql("select private.system_flag_effectively_enabled('qurban.enabled')"),'f');assert.equal(sql('select count(*) from private.system_feature_flags'),'0');
 const r=await rpc(stack,'admin_campaign_types',token('admin'));assert.equal(r.status,200);assert.deepEqual(r.data,[{type_key:'qurban',config_version:1,module_flag_key:'qurban.enabled'},{type_key:'ramadan',config_version:1,module_flag_key:'ramadan.enabled'}]);
});
for(const [name,c] of invalidConfigs)test('real validator denies '+name,()=>assert.equal(sql('select private.qurban_config_v1_valid('+quote(JSON.stringify(c))+'::jsonb)'),'f'));
for(const table of tables)for(const role of ['anon','authenticated','service_role','supabase_auth_admin','authenticator','campaign_scheduler'])test('real '+role+' denies raw CRUD '+table,()=>{
 for(const query of ['select * from private.'+table,'insert into private.'+table+' default values','update private.'+table+' set id=id','delete from private.'+table])assert.throws(()=>sql('begin;set local role '+role+';'+query+';rollback;'),/permission denied/);
 assert.equal(sql("select relrowsecurity from pg_class where oid="+quote('private.'+table)+'::regclass'),'t');
});
test('real Data API cannot expose private tables/functions through anon/auth/service roles',async()=>{
 for(const table of tables)for(const options of [{},{token:token('admin')},{token:token('staff')},{service:true}]){
  assert.notEqual((await api(stack,'/rest/v1/'+table+'?select=*',options)).status,200);
  assert.notEqual((await api(stack,'/rest/v1/'+table,{...options,headers:{'Accept-Profile':'private'}})).status,200);
 }
 for(const name of ['qurban_config_v1_valid','qurban_record_guard','qurban_registration_create'])assert.notEqual((await rpc(stack,name,token('admin'),{})).status,200);
});
test('real existing generic manager creates only valid Qurban draft; invalid config/staff/owner AAL1 denied',async()=>{
 const payload={type_key:'qurban',config_version:1,slug:'isolated-real-qurban',title:'Isolated real verification',configuration:validConfig};
 for(const c of [{},{...validConfig,phone:'hidden'}, {...validConfig,price_per_cattle_share_minor:1.5}])assert.equal((await rpc(stack,'admin_campaign_create',token('admin'),{payload:{...payload,configuration:c}})).status,400);
 for(const name of ['staff','owner','disabled','revoked','outsider'])assert.equal((await rpc(stack,'admin_campaign_create',token(name),{payload})).status,403);
 const r=await rpc(stack,'admin_campaign_create',token('admin'),{payload});assert.equal(r.status,200);campaign=r.data.id;
 assert.deepEqual(rows('select status,visibility,version from private.campaigns where id='+quote(campaign)),[{status:'draft',visibility:'private',version:1}]);
 assert.equal(sql('select count(*) from private.system_feature_flags'),'0');for(const table of tables)assert.equal(sql('select count(*) from private.'+table),'0');
});
test('real quote/akad/acceptance snapshot integrity in rollback-only owner fixtures',()=>{
 const q=quote;
 const result=sql(`begin;
 insert into private.qurban_registrations(campaign_id,campaign_config_version,campaign_revision,submission_configuration,quoted_participation_count,applicant_name,phone,address,attendance)
 values(${q(campaign)},1,1,${q(JSON.stringify(validConfig))},1,'Isolated Applicant','0123456789',E'Isolated address\nIsolated street','yes');
 insert into private.qurban_participations(registration_id,participant_name,purpose) select id,'Isolated Participant','qurban' from private.qurban_registrations;
 insert into private.qurban_akad_versions(campaign_id,version_reference,approved_text,approved_by,approval_reference) values(${q(campaign)},'isolated-reviewed-v1','Isolated approved text',${q(users.admin.id)},'ISOLATED-REFERENCE');
 insert into private.qurban_consent_acceptances(registration_id,campaign_id,akad_version_id,participation_snapshot)
 select r.id,r.campaign_id,a.id,(select jsonb_agg(jsonb_build_object('id',p.id,'participant_name',p.participant_name,'purpose',p.purpose,'version',p.version)) from private.qurban_participations p where p.registration_id=r.id)
 from private.qurban_registrations r join private.qurban_akad_versions a on a.campaign_id=r.campaign_id;
 select bool_and(c.accepted_content_hash=a.content_hash and a.content_hash=encode(sha256(convert_to(a.approved_text,'UTF8')),'hex')) from private.qurban_consent_acceptances c join private.qurban_akad_versions a on a.id=c.akad_version_id;
 rollback;`);assert(result.endsWith('t'));for(const table of tables)assert.equal(sql('select count(*) from private.'+table),'0');
});
