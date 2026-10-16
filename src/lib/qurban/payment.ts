import "server-only";
import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {adminContext} from "@/lib/admin/dal";
import {databaseError} from "@/lib/admin/http";
import {campaignManager} from "@/lib/campaigns/lifecycle-contract";
import {publicCampaignSlug} from "@/lib/campaigns/public-contract";
import type {Json} from "@/lib/supabase/database.types";
import {uuid} from "./admin-contract";
import {QurbanError} from "./registration-contract";
import {publicQurbanClient} from "./registration";
import {paymentContext,proofResult,proofHash,proofUuid,type ProofEvidence} from "./payment-contract";
import {storeProof,readStoredProof,storageIntentToken,type ProofObject} from "./proof-storage";
export const paymentCookie="__Secure-qurban-payment";
export const paymentPath=(slug:string)=>"/kempen/"+slug+"/bayaran";
export async function paymentSession(){const token=(await cookies()).get(paymentCookie)?.value;return proofHash(token)?token:null;}
function rpcError(error:{code?:string}|null){if(!error)return;if(error.code==="42501")throw new QurbanError(404,"denied");if(["PT409","23505","40001"].includes(error.code??""))throw new QurbanError(409,"conflict");if(error.code==="22023")throw new QurbanError(422,"invalid");throw new QurbanError(503,"unavailable");}
export async function readPayment(slug:string,session:string|null){if(!publicCampaignSlug(slug)||!session)return null;const r=await publicQurbanClient().rpc("public_qurban_payment_context",{target_slug:slug,session_secret:session}).abortSignal(AbortSignal.timeout(8000));rpcError(r.error);return paymentContext(r.data);}
export async function exchangePayment(slug:string,value:unknown){if(!publicCampaignSlug(slug)||!value||typeof value!=="object"||Object.keys(value).sort().join()!=="access_id,access_secret")throw new QurbanError(404,"denied");const v=value as Record<string,unknown>;if(!proofUuid(v.access_id)||!proofHash(v.access_secret))throw new QurbanError(404,"denied");const secret=randomBytes(32).toString("hex");const r=await publicQurbanClient().rpc("public_qurban_payment_exchange",{payload:{slug,...v,session_secret:secret} as Json}).abortSignal(AbortSignal.timeout(8000));rpcError(r.error);if(!r.data)throw new QurbanError(404,"denied");return secret;}
export type ProofInput={content:Uint8Array;payload:ProofEvidence&{idempotency_key:string;declared_amount_minor:number;payment_date:string}};
export async function submitProof(input:ProofInput,scope:{slug:string;session:string}|{campaign:string;registration:string}){
 const isAdmin="campaign" in scope;
 const client=isAdmin?(await adminContext("operational",true)).client:publicQurbanClient();
 const prepared=isAdmin?await client.rpc("admin_qurban_proof_prepare",{target_campaign:uuid(scope.campaign),target_registration:uuid(scope.registration),payload:input.payload as Json}):await client.rpc("public_qurban_proof_prepare",{target_slug:scope.slug,session_secret:scope.session,payload:input.payload as Json});
 if(isAdmin)databaseError(prepared.error);else rpcError(prepared.error);
 const p=prepared.data as unknown as {committed:boolean;result?:unknown}&ProofObject;if(!p||typeof p.committed!=="boolean")throw new QurbanError(503,"unavailable");if(p.committed)return proofResult(p.result);
 await storeProof(p,storageIntentToken(input.payload.idempotency_key),input.content);
 const committed=isAdmin?await client.rpc("admin_qurban_proof_commit",{target_campaign:uuid(scope.campaign),target_proof:p.proof_id}):await client.rpc("public_qurban_proof_commit",{target_slug:scope.slug,session_secret:scope.session,target_proof:p.proof_id});
 if(isAdmin)databaseError(committed.error);else rpcError(committed.error);return proofResult(committed.data);
}
export async function paymentList(campaign:string,value:unknown){const {client}=await adminContext("operational");const r=await client.rpc("admin_qurban_payment_list",{target_campaign:uuid(campaign),options:value as Json});databaseError(r.error);return r.data;}
export async function paymentActivity(campaign:string,page=1){const {client,state}=await adminContext("operational");campaignManager(state);const r=await client.rpc("admin_qurban_payment_activity",{target_campaign:uuid(campaign),page_number:page});databaseError(r.error);return r.data;}
export type DownloadItem=ProofObject&{reference:string;proof_reference:string};
export function proofFilename(p:DownloadItem){if(p.reference.length!==68||p.proof_reference.length!==68||!/^QBN-[0-9a-f]{64}$/.test(p.reference)||!/^PFP-[0-9a-f]{64}$/.test(p.proof_reference))throw new QurbanError(503,"unavailable");return p.reference+"__proof-"+p.proof_reference+"."+p.extension;}
export async function proofDownload(campaign:string,proof:string|null,cursor:string|null){const {client,state}=await adminContext("operational",true);campaignManager(state);const secret=randomBytes(32).toString("hex");const r=await client.rpc("admin_qurban_proof_download",{target_campaign:uuid(campaign),payload:{proof_id:proof===null?null:uuid(proof),cursor:cursor===null?null:uuid(cursor),grant_secret:secret}});databaseError(r.error);const d=r.data as unknown as {items:DownloadItem[];file_count:number;byte_size:number;next_cursor:string|null;captured_at:string};if(!d||!Array.isArray(d.items)||d.items.length<1||d.items.length>50||d.file_count!==d.items.length||d.byte_size>100*1024*1024)throw new QurbanError(503,"unavailable");return {...d,read:(item:DownloadItem)=>readStoredProof(item,secret)};}
