import test from"node:test";import assert from"node:assert/strict";import fs from"node:fs";import{PDFDocument}from"pdf-lib";import{buildReceiptPdf,receiptSnapshot,receiptMoney,RECEIPT_NOTE,type ReceiptSnapshot}from"../../src/lib/qurban/receipt-pdf";import{paymentReview,paymentContext,REJECTION_REASONS}from"../../src/lib/qurban/payment-contract";
const id="11111111-1111-4111-8111-111111111111";export const sample:ReceiptSnapshot={receipt_number:"QUR-2044-000001",campaign_year:2044,campaign_title:"UJIAN TEMPATAN - Qurban / Aqiqah",reference:"QBN-"+"a".repeat(64),applicant_name:"Pemohon Ujian - Áminah",currency:"MYR",amount_minor:24690,price_per_share_minor:12345,payment_method:"bank_transfer",payment_date:"2026-10-16",issued_at:"2026-10-17T00:00:00Z",participants:[{participation_id:id,participant_name:"Peserta Qurban Ujian",purpose:"qurban",cattle_number:1,slot_number:1},{participation_id:"22222222-2222-4222-8222-222222222222",participant_name:"Peserta Aqiqah Ujian",purpose:"aqiqah",cattle_number:1,slot_number:2}]};
test("actual safe PDF with immutable synthetic snapshot saved for render inspection",async()=>{const bytes=await buildReceiptPdf(sample);assert.equal(Buffer.from(bytes).subarray(0,5).toString(),"%PDF-");const d=await PDFDocument.load(bytes);assert.equal(d.getPageCount(),1);assert.equal(d.getTitle(),"Resit Bayaran Qurban / Aqiqah "+sample.receipt_number);fs.mkdirSync(".cache/qurban-91",{recursive:true});fs.writeFileSync(".cache/qurban-91/receipt-unit.pdf",bytes);});
test("long Malay names and 100 participants paginate with repeated identifying headers",async()=>{const s=structuredClone(sample);s.participants=Array.from({length:100},(_,i)=>({participation_id:"11111111-1111-4111-8111-"+String(i+1).padStart(12,"0"),participant_name:("Peserta Nama Panjang Melayu Áminah "+i+" ").repeat(3).slice(0,160),purpose:i%2?"aqiqah":"qurban",cattle_number:Math.floor(i/5)+1,slot_number:i%5+1}));s.amount_minor=s.price_per_share_minor*s.participants.length;const b=await buildReceiptPdf(s);assert((await PDFDocument.load(b)).getPageCount()>5);fs.writeFileSync(".cache/qurban-91/receipt-long.pdf",b);});
test("user HTML remains literal text; generator contains no HTML parser or external fetch",async()=>{const s=structuredClone(sample);s.applicant_name="<script>alert(1)</script>";await buildReceiptPdf(s);const code=fs.readFileSync("src/lib/qurban/receipt-pdf.ts","utf8");assert(!/fetch\(|https?:|innerHTML|dangerouslySetInnerHTML/.test(code));assert.equal(RECEIPT_NOTE,"Maklumat lembu/bahagian adalah susunan pada waktu resit dikeluarkan dan tertakluk kepada perubahan");});
test("PDF pure generation preserves receipt snapshot after current allocation changes",async()=>{const a=structuredClone(sample),original=JSON.stringify(a);const b=await buildReceiptPdf(a);await buildReceiptPdf({...a,participants:a.participants.map(p=>({...p,cattle_number:4}))});assert.equal(JSON.stringify(a),original);assert((await PDFDocument.load(b)).getPageCount()===1);});
test("malformed receipt/oversized snapshot/duplicate participation/unknown keys fail closed",()=>{for(const patch of [{receipt_number:"bad"},{amount_minor:1.1},{price_per_share_minor:12344},{price_per_share_minor:1.1},{price_per_share_minor:0},{price_per_share_minor:1000000001},{campaign_year:2027},{participants:[]},{participants:Array(101).fill(sample.participants[0])},{participants:[sample.participants[0],sample.participants[0]]},{secret:"leak"}])assert.throws(()=>receiptSnapshot({...sample,...patch}));});
test("exact review contract rejects force override and controlled reason only",()=>{const base={action:"verify",proof_id:id,expected_proof_version:1,expected_registration_version:1};assert.equal(paymentReview(base).action,"verify");for(const patch of [{force:true},{amount:1},{reason:"override"},{expected_proof_version:1.1},{expected_registration_version:0}])assert.throws(()=>paymentReview({...base,...patch}));for(const reason of Object.keys(REJECTION_REASONS))assert.equal(paymentReview({...base,action:"reject",reason}).reason,reason);assert.throws(()=>paymentReview({...base,action:"reject",reason:"free text"}));});
test("context state/amount/allocation coherence fail closed",()=>{const b={reference:sample.reference,participant_count:2,currency:"MYR",price_per_share_minor:12345,total_minor:24690,proof_status:"none",rejection_reason:null,payment:null,current_allocation:[]};assert.equal(paymentContext(b)!.proof_status,"none");assert.throws(()=>paymentContext({...b,proof_status:"verified"}));assert.throws(()=>paymentContext({...b,proof_status:"rejected"}));assert.throws(()=>paymentContext({...b,secret:"unknown"}));assert.equal(paymentContext({...b,proof_status:"rejected",rejection_reason:"bukti_tidak_jelas"})!.proof_status,"rejected");});

function example(count:number,long=false):ReceiptSnapshot{
 return {...structuredClone(sample),price_per_share_minor:88000,amount_minor:88000*count,participants:Array.from({length:count},(_,i)=>({
  participation_id:"11111111-1111-4111-8111-"+String(i+1).padStart(12,"0"),
  participant_name:long?("Peserta Nama Panjang Melayu Áminah "+i+" ").repeat(5).slice(0,160):["Ahmad bin Abdullah","Aminah binti Abdullah","Yusuf bin Abdullah"][i%3]+(i>2?" "+(i+1):""),
  purpose:i%3===2?"aqiqah":"qurban",cattle_number:Math.floor(i/7)+1,slot_number:i%7+1}))};
}
for(const count of [1,3,7])test("native branded A4 receipt: exactly "+count+" rows, one page and exact quote",async()=>{
 const s=example(count),bytes=await buildReceiptPdf(s),d=await PDFDocument.load(bytes);assert.equal(d.getPageCount(),1);
 assert.deepEqual(d.getPage(0).getSize(),{width:595.28,height:841.89});
 const stem=count===3?"receipt-normal":count===7?"receipt-7-participants":"receipt-1-participant";
 fs.mkdirSync(".cache/qurban-91/visual",{recursive:true});fs.writeFileSync(".cache/qurban-91/visual/"+stem+".pdf",bytes);
 fs.writeFileSync(".cache/qurban-91/visual/"+stem+".json",JSON.stringify(s,null,2));
});
test("100 participant stress uses dynamic rows and repeated compact headers",async()=>{
 const s=example(100,true),bytes=await buildReceiptPdf(s),d=await PDFDocument.load(bytes);assert(d.getPageCount()>5);
 fs.writeFileSync(".cache/qurban-91/visual/receipt-long-multipage.pdf",bytes);fs.writeFileSync(".cache/qurban-91/visual/receipt-long-multipage.json",JSON.stringify(s,null,2));
});
test("integer MYR formatting preserves cents, thousands and maximum accepted totals",()=>{
 for(const [v,expected]of [[1,"0.01"],[99,"0.99"],[100,"1.00"],[88000,"880.00"],[264000,"2,640.00"],[100000000000,"1,000,000,000.00"]]as const)assert.equal(receiptMoney(v),expected);
 for(const v of [-1,1.1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>receiptMoney(v));
});
test("snapshot quote must be present and mathematically coherent; never divided from total",()=>{
 const {price_per_share_minor:omitted,...missing}=sample;assert.equal(omitted,12345);assert.throws(()=>receiptSnapshot(missing));
 assert.throws(()=>receiptSnapshot({...sample,amount_minor:24691}));
 assert.throws(()=>receiptSnapshot({...sample,price_per_share_minor:12345.5}));
});
test("identical immutable snapshot regenerates byte-identical PDF after unrelated current changes",async()=>{
 const s=example(3),before=await buildReceiptPdf(s),current=structuredClone(s);current.participants[0].cattle_number=9;
 await buildReceiptPdf(current);assert.deepEqual(await buildReceiptPdf(s),before);assert.equal(s.participants[0].cattle_number,1);
});
