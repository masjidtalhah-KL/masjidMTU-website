import "server-only";
import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {adminContext} from "@/lib/admin/dal";
import {databaseError} from "@/lib/admin/http";
import {campaignManager} from "@/lib/campaigns/lifecycle-contract";
import {publicCampaignSlug} from "@/lib/campaigns/public-contract";
import type {Json} from "@/lib/supabase/database.types";
import {campaignId as uuid}from"@/lib/campaigns/lifecycle-contract";
import {RamadanError} from "./contracts";
import {publicRamadanClient}from"./server";
import {paymentContext,proofResult,proofHash,proofUuid,type ProofEvidence} from "./payment-contract";
import {storeProof,readStoredProof,storageIntentToken,type ProofObject} from "./proof-storage";
export const paymentCookie="__Secure-ramadan-payment";
export const paymentPath=(slug:string)=>"/kempen/"+slug+"/tajaan/bayaran";
export async function paymentSession(){const token=(await cookies()).get(paymentCookie)?.value;return proofHash(token)?token:null;}
function rpcError(error:{code?:string}|null){if(!error)return;if(error.code==="42501")throw new RamadanError(404,"denied");if(["PT409","23505","40001"].includes(error.code??""))throw new RamadanError(409,"conflict");if(error.code==="22023")throw new RamadanError(422,"invalid");throw new RamadanError(503,"unavailable");}
export async function readPayment(slug:string,session:string|null){if(!publicCampaignSlug(slug)||!session)return null;const r=await publicRamadanClient().rpc("public_ramadan_payment_context",{target_slug:slug,session_secret:session}).abortSignal(AbortSignal.timeout(8000));rpcError(r.error);return paymentContext(r.data);}
export async function exchangePayment(slug:string,value:unknown){if(!publicCampaignSlug(slug)||!value||typeof value!=="object"||Object.keys(value).sort().join()!=="access_id,access_secret")throw new RamadanError(404,"denied");const v=value as Record<string,unknown>;if(!proofUuid(v.access_id)||!proofHash(v.access_secret))throw new RamadanError(404,"denied");const secret=randomBytes(32).toString("hex");const r=await publicRamadanClient().rpc("public_ramadan_payment_exchange",{payload:{slug,...v,session_secret:secret} as Json}).abortSignal(AbortSignal.timeout(8000));rpcError(r.error);if(!r.data)throw new RamadanError(404,"denied");return secret;}
export type ProofInput={content:Uint8Array;payload:ProofEvidence&{idempotency_key:string;declared_amount_minor:number;payment_date:string}};
export async function submitProof(input:ProofInput,scope:{slug:string;session:string}|{campaign:string;sponsorship:string}){
 const isAdmin="campaign" in scope;
 const client=isAdmin?(await adminContext("operational",true)).client:publicRamadanClient();
 const prepared=isAdmin?await client.rpc("admin_ramadan_proof_prepare",{target_campaign:uuid(scope.campaign),target_sponsorship:uuid(scope.sponsorship),payload:input.payload as Json}):await client.rpc("public_ramadan_proof_prepare",{target_slug:scope.slug,session_secret:scope.session,payload:input.payload as Json});
 if(isAdmin)databaseError(prepared.error);else rpcError(prepared.error);
 const p=prepared.data as unknown as {committed:boolean;result?:unknown}&ProofObject;if(!p||typeof p.committed!=="boolean")throw new RamadanError(503,"unavailable");if(p.committed)return proofResult(p.result);
 await storeProof(p,storageIntentToken(input.payload.idempotency_key),input.content);
 const committed=isAdmin?await client.rpc("admin_ramadan_proof_commit",{target_campaign:uuid(scope.campaign),target_proof:p.proof_id}):await client.rpc("public_ramadan_proof_commit",{target_slug:scope.slug,session_secret:scope.session,target_proof:p.proof_id});
 if(isAdmin)databaseError(committed.error);else rpcError(committed.error);return proofResult(committed.data);
}
export async function readProof(campaign:string,sponsor:string){const{client}=await adminContext('operational');const r=await client.rpc('admin_ramadan_proof_detail',{target_campaign:uuid(campaign),target_sponsorship:uuid(sponsor)});databaseError(r.error);return r.data as unknown as import('./payment-contract').ProofDetail|null;}
export async function downloadProof(campaign:string,proof:string){const{client,state}=await adminContext('operational',true);campaignManager(state);const secret=randomBytes(32).toString('hex');const r=await client.rpc('admin_ramadan_proof_download',{target_campaign:uuid(campaign),target_proof:uuid(proof),grant_secret:secret});databaseError(r.error);const item=r.data as unknown as ProofObject&{reference:string;proof_reference:string};if(!item||!/^RSP-[0-9a-f]{64}$/.test(item.reference)||!/^RPF-[0-9a-f]{64}$/.test(item.proof_reference))throw new RamadanError(503,'unavailable');const bytes=await readStoredProof(item,secret);return{bytes,content_type:item.content_type,filename:item.reference+'__proof-'+item.proof_reference+'.'+item.extension};}
