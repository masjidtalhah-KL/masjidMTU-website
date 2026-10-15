import test from "node:test";import assert from "node:assert/strict";
import { registrationRequest, registrationContext, registrationResult, money } from "../../src/lib/qurban/registration-contract";
import { readQurbanBody } from "../../src/lib/qurban/registration-body";
import { request } from "./fixtures.mjs";
const c={slug:"local-qurban-review",title:"Local fixture",campaign_version:1,config_version:1,global_flag_version:1,module_flag_version:1,campaign_year:2044,hijri_display_label:"Local fixture label",currency:"MYR",price_per_share_minor:12345,allowed_purposes:["qurban","aqiqah"],max_participants:12,registration_closes_at:null,akad_reference:"local-reviewed-v1",akad_text:"Local fixture text",akad_hash:"a".repeat(64)};
test("safe exact context and request preserve types, reject unknown/private fields",()=>{
 assert.deepEqual(registrationContext(c,c.slug),c);assert.equal(registrationContext(null,c.slug),null);const p=request(c);assert.deepEqual(registrationRequest(p),p);
 for(const k of ["amount","reference","id","currency","akad_text","campaign_id"])assert.throws(()=>registrationRequest({...p,[k]:"caller"}));
 for(const k of ["applicant","participants","configuration","approved_by","capacity"])assert.throws(()=>registrationContext({...c,[k]:"private"},c.slug));
});
for(const [name,change] of [["no consent",(p: ReturnType<typeof request>)=>p.accepted_akad=false],["phone",(p: ReturnType<typeof request>)=>p.applicant.phone="invalid"],["name",(p: ReturnType<typeof request>)=>p.applicant.name="\n"],["empty",(p: ReturnType<typeof request>)=>p.participants=[]],["purpose",(p: ReturnType<typeof request>)=>p.participants[0].purpose="unsupported"],["raw address bound",(p: ReturnType<typeof request>)=>p.applicant.address="a".repeat(498)+"\r\n"+"x"],["slug control",(p: ReturnType<typeof request>)=>p.slug+="\n"],["weak key",(p: ReturnType<typeof request>)=>p.idempotency_key="sequential-1"],["unexpected child",(p: ReturnType<typeof request>)=>Object.assign(p.participants[0],{id:"chosen"})]] as const)test("request rejects "+name,()=>{const p=request(c);change(p);assert.throws(()=>registrationRequest(p));});
test("integer money and exact result arithmetic",()=>{assert.equal(money(37035),"RM370.35");const r={reference:"QBN-"+"a".repeat(64),participant_count:3,currency:"MYR",price_per_share_minor:12345,total_minor:37035};assert.deepEqual(registrationResult(r),r);for(const total_minor of [37035.5,-1,37034])assert.throws(()=>registrationResult({...r,total_minor}));});
const body=(chunks:Uint8Array[])=>new ReadableStream<Uint8Array>({start(controller){chunks.forEach(c=>controller.enqueue(c));controller.close();}});
test("stream boundary rejects oversized single/chunked bodies and malformed UTF8/JSON",async()=>{
 assert.deepEqual(await readQurbanBody(body([new TextEncoder().encode('{"safe":true}')])),{safe:true});
 for(const chunks of [[new Uint8Array(65537)],[new Uint8Array(32768),new Uint8Array(32769)],[new Uint8Array([255])],[new TextEncoder().encode('{')]])await assert.rejects(readQurbanBody(body(chunks)));
 await assert.rejects(readQurbanBody(null));
});
