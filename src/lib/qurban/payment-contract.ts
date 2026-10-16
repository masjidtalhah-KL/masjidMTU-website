import {QurbanError} from './registration-contract';
export const PROOF_BYTES=10*1024*1024;
export const PROOF_MULTIPART_BYTES=PROOF_BYTES+65536;
export const proofHash=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v)&&v.length===64;
export const proofUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v)&&v.length===36;
export const proofTypes={'image/jpeg':'jpg','image/png':'png','application/pdf':'pdf'} as const;
export type ProofType=keyof typeof proofTypes;
export type ProofEvidence={content_type:ProofType;extension:'jpg'|'png'|'pdf';byte_size:number;content_hash:string};
export type ProofResult={proof_reference:string;status:'submitted';submitted_at:string;amount_mismatch:boolean};
export type PaymentContext={reference:string;participant_count:number;currency:'MYR';price_per_share_minor:number;total_minor:number;proof_status:'none'|'submitted'};
export function amountMinor(value:unknown):number{
 if(typeof value!=='string'||! /^(0|[1-9][0-9]{0,9})(\.[0-9]{1,2})?$/.test(value))throw new QurbanError(422,'invalid');
 const [whole,fraction='']=value.split('.');const n=BigInt(whole)*BigInt(100)+BigInt(fraction.padEnd(2,'0'));if(n<BigInt(1)||n>BigInt("100000000000"))throw new QurbanError(422,'invalid');return Number(n);
}
export function proofDate(value:unknown):string{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new QurbanError(422,'invalid');const d=new Date(value+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw new QurbanError(422,'invalid');return value;}
export function paymentContext(value:unknown):PaymentContext|null{if(value===null)return null;const v=value as PaymentContext;if(!v||typeof v!=='object'||Object.keys(v).length!==6||!/^QBN-[0-9a-f]{64}$/.test(v.reference)||v.currency!=='MYR'||!Number.isInteger(v.participant_count)||v.participant_count<1||v.participant_count>100||!Number.isSafeInteger(v.price_per_share_minor)||v.price_per_share_minor<1||v.price_per_share_minor>1000000000||v.total_minor!==v.price_per_share_minor*v.participant_count||!['none','submitted'].includes(v.proof_status))throw new QurbanError(503,'unavailable');return v;}
export function proofResult(value:unknown):ProofResult{const v=value as ProofResult;if(!v||typeof v!=='object'||Object.keys(v).length!==4||!/^PFP-[0-9a-f]{64}$/.test(v.proof_reference)||v.status!=='submitted'||typeof v.amount_mismatch!=='boolean'||!Number.isFinite(Date.parse(v.submitted_at)))throw new QurbanError(503,'unavailable');return v;}
