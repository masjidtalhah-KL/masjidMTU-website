import "server-only";
import {readFileSync,lstatSync,realpathSync}from'node:fs';
import pathModule from'node:path';
import {createHash}from'node:crypto';
import {adminConfig}from'@/lib/supabase/env';
import {RamadanError}from'./contracts';
import {proofHash,proofUuid,PROOF_BYTES,type ProofEvidence}from'./payment-contract';
import {validateProofFile}from'./proof-file';
export type ProofObject=ProofEvidence&{proof_id:string;object_key:string};
const bucket='ramadan-payment-proofs';
export const storageIntentToken=(idempotencyKey:string)=>{if(!proofHash(idempotencyKey))throw new RamadanError(422,'invalid');return createHash('sha256').update('ramadan-storage:'+idempotencyKey).digest('hex');};
function workerToken(url:string){
 if(process.env.RAMADAN_LOCAL_REVIEW_STORAGE_TOKEN!=='1')return process.env.RAMADAN_PROOF_STORAGE_TOKEN;
 // Only the local operator runner rotates this pre-issued credential; the app never signs JWTs.
 if(process.env.NODE_ENV!=='development'||process.env.ADMIN_SUPABASE_ENV!=='local'||url!=='http://127.0.0.1:54321'||process.env.ADMIN_APP_ORIGIN!=='http://localhost:3082')throw new RamadanError(503,'unavailable');
 const cache=pathModule.join(process.cwd(),'.cache'),file=pathModule.join(cache,'ramadan-review-storage-token.json');
 try{const stat=lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096||realpathSync(cache)!==cache||realpathSync(file)!==file)throw Error();const value=JSON.parse(readFileSync(file,'utf8'));if(Object.keys(value).join()!=='token'||typeof value.token!=='string')throw Error();return value.token as string;}catch{throw new RamadanError(503,'unavailable');}
}
function headers(scope:string){const c=adminConfig(),token=workerToken(c.url);if(!token||!proofHash(scope))throw new RamadanError(503,'unavailable');try{const parts=token.split('.');const p=JSON.parse(Buffer.from(parts[1],'base64url').toString());const now=Date.now()/1000;if(Number.isInteger(p.exp)&&p.exp<=now)console.warn('[ramadan-proof] storage_worker_expired');if(parts.length!==3||p.role!=='ramadan_proof_storage_worker'||p.iss!==c.url+'/auth/v1'||p.aud!=='authenticated'||!Number.isInteger(p.exp)||!Number.isInteger(p.iat)||p.exp<=now||p.iat>now+30||p.exp-p.iat>3600)throw Error();}catch{throw new RamadanError(503,'unavailable');}return{apikey:c.key,Authorization:'Bearer '+token,'x-ramadan-storage-token':scope};}
function path(o:ProofObject){if(!proofUuid(o.proof_id)||!/^([0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\/){2}[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(jpg|png|pdf)$/.test(o.object_key)||!o.object_key.endsWith('/'+o.proof_id+'.'+o.extension)||!proofHash(o.content_hash)||!Number.isInteger(o.byte_size)||o.byte_size<1||o.byte_size>PROOF_BYTES)throw new RamadanError(503,'unavailable');return o.object_key.split('/').map(encodeURIComponent).join('/');}
export async function readStoredProof(o:ProofObject,scope:string):Promise<Uint8Array>{
 const response=await fetch(adminConfig().url+'/storage/v1/object/authenticated/'+bucket+'/'+path(o),{headers:headers(scope),cache:'no-store',signal:AbortSignal.timeout(45000)}).catch(()=>{throw new RamadanError(503,'unavailable');});if(!response.ok||response.headers.get('content-type')?.split(';')[0]!==o.content_type)throw new RamadanError(503,'unavailable');const reader=response.body?.getReader();if(!reader)throw new RamadanError(503,'unavailable');let total=0;const parts:Uint8Array[]=[];try{while(true){const next=await reader.read();if(next.done)break;total+=next.value.byteLength;if(total>PROOF_BYTES||total>o.byte_size){await reader.cancel();throw new RamadanError(503,'unavailable');}parts.push(next.value);}}finally{reader.releaseLock();}const bytes=Buffer.concat(parts);if(bytes.length!==o.byte_size||createHash('sha256').update(bytes).digest('hex')!==o.content_hash)throw new RamadanError(503,'unavailable');validateProofFile(bytes,'proof.'+o.extension,o.content_type);return bytes;
}
export async function storeProof(o:ProofObject,scope:string,bytes:Uint8Array){
 const evidence=validateProofFile(bytes,'proof.'+o.extension,o.content_type);if(evidence.content_hash!==o.content_hash||evidence.byte_size!==o.byte_size)throw new RamadanError(409,'conflict');
 const response=await fetch(adminConfig().url+'/storage/v1/object/'+bucket+'/'+path(o),{method:'POST',headers:{...headers(scope),'Content-Type':o.content_type,'cache-control':'max-age=0','x-upsert':'false','x-metadata':Buffer.from(JSON.stringify({sha256:o.content_hash})).toString('base64')},body:new Uint8Array(bytes),cache:'no-store',signal:AbortSignal.timeout(45000)}).catch(()=>null);
 // Unique immutable key: ambiguous retry may only reuse exact validated bytes, never overwrite.
 if(!response?.ok){await readStoredProof(o,scope);return;}
 await readStoredProof(o,scope);
}
