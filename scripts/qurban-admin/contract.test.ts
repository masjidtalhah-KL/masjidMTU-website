import test from 'node:test';import assert from 'node:assert/strict';
import {listOptions,listPayload,amendment,cancellation} from '../../src/lib/qurban/admin-contract';
const q={page:1,page_size:20,search:'',status:'all',purpose:'all',sort:'newest'};
test('list exact normalized and bounded request',()=>{assert.deepEqual(listPayload(q),q);assert.equal(listOptions(new URLSearchParams('search=+Ahmad+')).search,'Ahmad');});
for(const patch of [{page:0},{page:10001},{page_size:51},{page_size:'20'},{search:null},{search:{}},{search:'x'.repeat(101)},{search:String.fromCharCode(0)},{sort:'raw'},{purpose:'invalid'},{status:'verified'},{extra:1}])test('list rejects '+JSON.stringify(patch),()=>assert.throws(()=>listPayload({...q,...patch})));
test('duplicate query keys rejected',()=>assert.throws(()=>listOptions(new URLSearchParams('page=1&page=2'))));
test('amendments exact fields only; no new participant, identity, price or consent authority',()=>{
 const changes={applicant_name:'Pemohon Ujian',phone:'0123456789',address:'Alamat',email:null,attendance:'unsure',same_cattle_preference:false};
 assert.doesNotThrow(()=>amendment({kind:'registration',expected_version:1,changes}));
 for(const extra of ['id','campaign_id','status','quoted_total_minor','quoted_participation_count','submission_configuration','consent'])assert.throws(()=>amendment({kind:'registration',expected_version:1,changes:{...changes,[extra]:'x'}}));
 assert.throws(()=>amendment({kind:'add_participant',expected_version:1,changes:{}}));assert.throws(()=>amendment({kind:'remove_participant',expected_version:1,changes:{}}));
});
test('controlled cancellation reason mandatory and no PII/free-text audit reason',()=>{assert.deepEqual(cancellation({expected_version:1,reason:'applicant_request'}),{expected_version:1,reason:'applicant_request'});for(const reason of [null,'', '0123456789','Pemohon Name','x'.repeat(201)])assert.throws(()=>cancellation({expected_version:1,reason}));});

import {registrationStatusLabels,compactQurbanReference} from "../../src/lib/qurban/admin-presentation";
test("registration labels are Malay without changing authoritative status/filter values",()=>{assert.deepEqual(registrationStatusLabels,{submitted:"Dihantar",cancelled:"Dibatalkan"});assert.equal(listPayload({...q,status:"submitted"}).status,"submitted");assert.equal(listPayload({...q,status:"cancelled"}).status,"cancelled");});
test("compact QBN presentation keeps prefix/suffix without modifying the full reference",()=>{const full="QBN-"+"abcdef0123456789".repeat(4);assert.equal(compactQurbanReference(full),"QBN-abcdef…3456789");assert.equal(full.length,68);assert.equal(compactQurbanReference("QBN-short"),"QBN-short");});
