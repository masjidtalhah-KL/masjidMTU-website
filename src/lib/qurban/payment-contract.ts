import {QurbanError} from './registration-contract';
export const PROOF_BYTES=10*1024*1024;
export const PROOF_MULTIPART_BYTES=PROOF_BYTES+65536;
export const proofHash=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v)&&v.length===64;
export const proofUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v)&&v.length===36;
export const proofTypes={'image/jpeg':'jpg','image/png':'png','application/pdf':'pdf'} as const;
export type ProofType=keyof typeof proofTypes;
export type ProofEvidence={content_type:ProofType;extension:'jpg'|'png'|'pdf';byte_size:number;content_hash:string};
export type ProofResult={proof_reference:string;status:ProofStatus;submitted_at:string;amount_mismatch:boolean};
export const REJECTION_REASONS={jumlah_tidak_tepat:"Jumlah bayaran tidak tepat",bukti_tidak_jelas:"Bukti bayaran tidak jelas",bukti_tidak_sah:"Bukti bayaran tidak sah",bayaran_tidak_ditemui:"Bayaran tidak dapat dikenal pasti",lain_lain_operasi:"Lain-lain sebab operasi"} as const;
export type RejectionReason=keyof typeof REJECTION_REASONS;
export type ProofStatus="submitted"|"rejected"|"verified";
export const proofStatusLabels={none:"Belum dihantar",submitted:"Bukti dihantar",rejected:"Bukti ditolak",verified:"Bayaran disahkan"} as const;
export type CurrentAllocation={participant_name:string;purpose:"qurban"|"aqiqah";cattle_number:number;slot_number:number};
export type VerifiedSummary={receipt_number:string;amount_minor:number;verified_at:string};
export type PaymentContext={reference:string;participant_count:number;currency:'MYR';price_per_share_minor:number;total_minor:number;proof_status:'none'|ProofStatus;rejection_reason:RejectionReason|null;payment:VerifiedSummary|null;current_allocation:CurrentAllocation[]};
export function amountMinor(value:unknown):number{
 if(typeof value!=='string'||! /^(0|[1-9][0-9]{0,9})(\.[0-9]{1,2})?$/.test(value))throw new QurbanError(422,'invalid');
 const [whole,fraction='']=value.split('.');const n=BigInt(whole)*BigInt(100)+BigInt(fraction.padEnd(2,'0'));if(n<BigInt(1)||n>BigInt("100000000000"))throw new QurbanError(422,'invalid');return Number(n);
}
export function proofDate(value:unknown):string{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new QurbanError(422,'invalid');const d=new Date(value+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw new QurbanError(422,'invalid');return value;}
export function paymentContext(value:unknown):PaymentContext|null{
 if(value===null)return null;const v=value as PaymentContext;
 if(!v||typeof v!=='object'||Object.keys(v).sort().join()!=="currency,current_allocation,participant_count,payment,price_per_share_minor,proof_status,reference,rejection_reason,total_minor"||!/^QBN-[0-9a-f]{64}$/.test(v.reference)||v.currency!=='MYR'||!Number.isInteger(v.participant_count)||v.participant_count<1||v.participant_count>100||!Number.isSafeInteger(v.price_per_share_minor)||v.price_per_share_minor<1||v.price_per_share_minor>1000000000||v.total_minor!==v.price_per_share_minor*v.participant_count||!Object.hasOwn(proofStatusLabels,v.proof_status)||!Array.isArray(v.current_allocation)||v.current_allocation.length>100)throw new QurbanError(503,'unavailable');
 if(v.proof_status==="rejected"? !v.rejection_reason||!Object.hasOwn(REJECTION_REASONS,v.rejection_reason):v.rejection_reason!==null)throw new QurbanError(503,'unavailable');
 if(v.proof_status==="verified"){
  if(!v.payment||Object.keys(v.payment).sort().join()!=="amount_minor,receipt_number,verified_at"||!/^QUR-[0-9]{4}-[0-9]{6}$/.test(v.payment.receipt_number)||v.payment.amount_minor!==v.total_minor||!Number.isFinite(Date.parse(v.payment.verified_at))||v.current_allocation.length!==v.participant_count)throw new QurbanError(503,'unavailable');
  for(const a of v.current_allocation)if(!a||Object.keys(a).sort().join()!=="cattle_number,participant_name,purpose,slot_number"||typeof a.participant_name!=="string"||a.participant_name.length<1||[...a.participant_name].length>160||!["qurban","aqiqah"].includes(a.purpose)||!Number.isInteger(a.cattle_number)||a.cattle_number<1||!Number.isInteger(a.slot_number)||a.slot_number<1)throw new QurbanError(503,'unavailable');
 }else if(v.payment!==null||v.current_allocation.length!==0)throw new QurbanError(503,'unavailable');
 return v;
}
export type PaymentReview={action:"verify"|"reject";proof_id:string;expected_proof_version:number;expected_registration_version:number;reason?:RejectionReason};
export function paymentReview(value:unknown):PaymentReview{
 const v=value as PaymentReview;
 if(!v||typeof v!=="object"||!["verify","reject"].includes(v.action)||Object.keys(v).sort().join()!==(v.action==="verify"?"action,expected_proof_version,expected_registration_version,proof_id":"action,expected_proof_version,expected_registration_version,proof_id,reason")||!proofUuid(v.proof_id)||![v.expected_proof_version,v.expected_registration_version].every(n=>Number.isSafeInteger(n)&&n>0&&n<=2147483647)||v.action==="reject"&&(!v.reason||!Object.hasOwn(REJECTION_REASONS,v.reason)))throw new QurbanError(422,"invalid");
 return v;
}
export function proofResult(value:unknown):ProofResult{const v=value as ProofResult;if(!v||typeof v!=='object'||Object.keys(v).length!==4||!/^PFP-[0-9a-f]{64}$/.test(v.proof_reference)||!['submitted','rejected','verified'].includes(v.status)||typeof v.amount_mismatch!=='boolean'||!Number.isFinite(Date.parse(v.submitted_at)))throw new QurbanError(503,'unavailable');return v;}
