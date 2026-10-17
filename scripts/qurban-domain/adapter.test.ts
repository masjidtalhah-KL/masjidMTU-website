import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {campaignAdminAdapters,qurbanAdminAdapter,availableCampaignTypes,parseAdapterConfiguration,parseAdapterFormState} from '../../src/lib/campaigns/admin-registry';
import {createCampaignCommand,updateCampaignCommand,type CampaignDetail} from '../../src/lib/campaigns/management-contract';
import {QurbanConfigurationForm} from '../../src/lib/qurban/admin-adapter';
import {parseQurbanConfiguration,parseQurbanFormState,initialQurbanFormState,type QurbanConfiguration,type QurbanPurpose} from '../../src/lib/qurban/config';
import {validConfig,invalidConfigs} from './fixtures.mjs';
const descriptor={type_key:'qurban',config_version:1,module_flag_key:'qurban.enabled'};
const payload={...descriptor,slug:'isolated-qurban',title:'Isolated campaign',configuration:validConfig};
const creation={type_key:payload.type_key,config_version:1,slug:payload.slug,title:payload.title,configuration:validConfig};
const typed:QurbanConfiguration|null=qurbanAdminAdapter.parseConfiguration(validConfig);
const alsoTyped:QurbanConfiguration|null=parseAdapterConfiguration(qurbanAdminAdapter,validConfig);
// @ts-expect-error Controlled domain purpose excludes unrelated vocabulary.
const invalidTypedPurpose:QurbanPurpose='ramadan';void invalidTypedPurpose;
test('concrete persisted config type survives factory + parser',()=>{assert.equal(typed?.price_per_cattle_share_minor,123456);assert.deepEqual(typed,alsoTyped);});
test('sole production Qurban tuple, frozen registry, exact DB intersection',()=>{
 assert(Object.isFrozen(campaignAdminAdapters));assert.equal(campaignAdminAdapters.length,2);assert.equal(campaignAdminAdapters.filter(a=>a.type_key==='qurban').length,1);assert.equal(availableCampaignTypes([descriptor])[0],qurbanAdminAdapter);
 for(const c of [[],[{...descriptor,config_version:2}],[{...descriptor,module_flag_key:'other.enabled'}]])assert.deepEqual(availableCampaignTypes(c),[]);
 assert.deepEqual(availableCampaignTypes([descriptor],[qurbanAdminAdapter,qurbanAdminAdapter]),[]);
});
test('blank form is not persisted configuration and creates no invented defaults',()=>{
 const blank=initialQurbanFormState();assert.deepEqual(blank,qurbanAdminAdapter.defaults());assert.equal(parseQurbanConfiguration(blank),null);assert.deepEqual(parseAdapterFormState(qurbanAdminAdapter,blank),blank);
 assert(!JSON.stringify(blank).includes('2027'));assert(!JSON.stringify(blank).includes('880'));
 assert.throws(()=>createCampaignCommand({...creation,configuration:blank},[descriptor]));
 const html=renderToStaticMarkup(createElement(QurbanConfigurationForm,{value:blank,onChange:()=>{},disabled:false}));
 for(const field of ['qurban-campaign_year','qurban-cattle_count','qurban-shares_per_cattle','qurban-price_per_cattle_share_minor','qurban-hijri','qurban-akad','qurban-limit'])assert.match(html,new RegExp('id="'+field+'"[^>]*value=""'));
 assert.doesNotMatch(html,/textarea|JSON|Nama peserta|No. telefon|bukti pembayaran/);
});
test('incremental form editing allows incomplete numeric/URL text, never persisted validity',()=>{
 for(const draft of [{...initialQurbanFormState(),campaign_year:2},{...initialQurbanFormState(),volunteer_whatsapp_group_url:'h'},{...initialQurbanFormState(),price_per_cattle_share_minor:1.5}]){assert(parseQurbanFormState(draft));assert.equal(parseQurbanConfiguration(draft),null);}
});
for(const [name,c] of invalidConfigs)test('typed persisted config rejects '+String(name),()=>{assert.equal(parseQurbanConfiguration(c),null);assert.equal(parseAdapterConfiguration(qurbanAdminAdapter,c),null);assert.throws(()=>createCampaignCommand({...creation,configuration:c},[descriptor]));});
test('unknown draft keys and manufactured defaults cannot escape wrapper',()=>{
 assert.equal(parseAdapterFormState(qurbanAdminAdapter,{...initialQurbanFormState(),phone:'hidden'}),null);
 assert.equal(parseAdapterConfiguration({...qurbanAdminAdapter,parseConfiguration:()=>typed},{...validConfig,unknown:true}),null);
 assert.equal(parseAdapterConfiguration({...qurbanAdminAdapter,parseConfiguration:()=>typed},{}),null);
});
test('exact valid config supports existing CREATE/UPDATE boundary',()=>{
 assert.deepEqual(createCampaignCommand(creation,[descriptor]),creation);
 const current={...creation,id:'00000000-0000-4000-8000-000000000001',version:1,status:'draft',visibility:'private',scheduled_public_display:false,archived_history_display:false,slug_editable:true,created_at:'2042-01-01T00:00:00Z',updated_at:'2042-01-01T00:00:00Z',registration_opens_at:null,registration_closes_at:null,event_starts_at:null,event_ends_at:null,editorial_binding:null} as CampaignDetail;
 const update={expectedVersion:1,slug:creation.slug,title:creation.title,visibility:'private',scheduled_public_display:false,archived_history_display:false,config_version:1,configuration:validConfig};
 assert(updateCampaignCommand(update,current,[descriptor]));assert.throws(()=>updateCampaignCommand({...update,configuration:initialQurbanFormState()},current,[descriptor]));
});
