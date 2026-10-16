import test,{before} from'node:test';import assert from'node:assert/strict';import {validateProofFile,proofCrc}from'../../src/lib/qurban/proof-file';import {amountMinor,proofDate,PROOF_BYTES}from'../../src/lib/qurban/payment-contract';
import {proofFiles,boundaryPng}from'./fixtures.mjs';
let files:Record<string,Buffer>;before(async()=>{files=await proofFiles();});
for(const [ext,type]of Object.entries({jpg:'image/jpeg',png:'image/png',pdf:'application/pdf'})){
 test('valid synthetic '+ext+' signature/structure/hash normalized without original name',()=>{const r=validateProofFile(files[ext],'person-name.'+ext,type);assert.equal(r.content_type,type);assert.equal(r.byte_size,files[ext].length);assert.match(r.content_hash,/^[0-9a-f]{64}$/);assert.equal(Object.keys(r).length,4);});
 test(ext+' MIME mismatch rejected',()=>assert.throws(()=>validateProofFile(files[ext],'test.'+ext,'text/plain')));
 test(ext+' extension mismatch rejected',()=>assert.throws(()=>validateProofFile(files[ext],'test.exe',type)));
 test(ext+' truncation rejected',()=>assert.throws(()=>validateProofFile(files[ext].subarray(0,-9),'test.'+ext,type)));
 test(ext+' corrupted signature rejected',()=>{const b=Buffer.from(files[ext]);b[0]=0;assert.throws(()=>validateProofFile(b,'test.'+ext,type));});
}
test('inclusive 10 MiB valid PNG; >10 MiB rejected',async()=>{const b=await boundaryPng();assert.equal(b.length,PROOF_BYTES);assert.equal(validateProofFile(b,'boundary.png','image/png').byte_size,PROOF_BYTES);assert.throws(()=>validateProofFile(Buffer.concat([b,Buffer.from([0])]),'too-big.png','image/png'));});
test('empty/executable/HTML/SVG rejected regardless MIME filename',()=>{for(const b of [Buffer.alloc(0),Buffer.from('MZ executable'),Buffer.from('<html>'),Buffer.from('<svg/>')])assert.throws(()=>validateProofFile(b,'slip.png','image/png'));});
test('CRC known reference and corrupt PNG CRC',()=>{assert.equal(proofCrc(Buffer.from('123456789')),0xcbf43926);const b=Buffer.from(files.png);b[29]^=1;assert.throws(()=>validateProofFile(b,'bad.png','image/png'));});
for(const [input,n]of [['1760.00',176000],['0.01',1],['880',88000],['1.2',120],['1000000000.00',100000000000]] as const)test('exact minor parsing '+input,()=>assert.equal(amountMinor(input),n));
for(const value of ['1.001','-1','+1','1e3','1,000',' 1','1 ','00.01','0','0.00','1000000000.01','99999999999',1.76,null])test('invalid/overflow money '+String(value),()=>assert.throws(()=>amountMinor(value)));
for(const value of ['2026-02-30','2026-13-01','16/10/2026','2026-1-1'])test('impossible/non-ISO date '+value,()=>assert.throws(()=>proofDate(value)));
test('valid explicit date unchanged',()=>assert.equal(proofDate('2026-10-16'),'2026-10-16'));
