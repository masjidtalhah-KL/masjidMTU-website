import "server-only";
import {adminContext} from "@/lib/admin/dal";
import {databaseError} from "@/lib/admin/http";
import {campaignManager} from "@/lib/campaigns/lifecycle-contract";
import {uuid} from "./admin-contract";
import {publicQurbanClient} from "./registration";
import {paymentReview} from "./payment-contract";
import {QurbanError} from "./registration-contract";
import {receiptSnapshot,buildReceiptPdf} from "./receipt-pdf";
export class PaymentReviewError extends Error{constructor(public reason:"amount_mismatch"|"capacity"){super(reason);}}
export async function reviewPayment(campaign:string,value:unknown){
 const v=paymentReview(value),{client,state}=await adminContext("operational",true);campaignManager(state);
 const args={target_campaign:uuid(campaign),target_proof:v.proof_id,expected_proof_version:v.expected_proof_version,expected_registration_version:v.expected_registration_version};
 const r=v.action==="verify"?await client.rpc("admin_qurban_payment_verify",args):await client.rpc("admin_qurban_payment_reject",{...args,reason:v.reason!});
 if(r.error?.code==="PT412")throw new PaymentReviewError("amount_mismatch");
 if(r.error?.code==="PT413")throw new PaymentReviewError("capacity");
 databaseError(r.error);return r.data;
}
export async function paymentDetail(campaign:string,registration:string,page=1){const {client,state}=await adminContext("operational",true);campaignManager(state);const r=await client.rpc("admin_qurban_payment_detail",{target_campaign:uuid(campaign),target_registration:uuid(registration),page_number:page});databaseError(r.error);return r.data;}
export async function receiptDownload(scope:{slug:string;session:string}|{campaign:string;registration:string}){
 let value:unknown;
 if("campaign"in scope){const {client,state}=await adminContext("operational",true);campaignManager(state);const r=await client.rpc("admin_qurban_receipt_download",{target_campaign:uuid(scope.campaign),target_registration:uuid(scope.registration)});databaseError(r.error);value=r.data;}
 else{const r=await publicQurbanClient().rpc("public_qurban_receipt_download",{target_slug:scope.slug,session_secret:scope.session});if(r.error?.code==="42501")throw new QurbanError(404,"denied");if(r.error)throw new QurbanError(503,"unavailable");value=r.data;}
 const snapshot=receiptSnapshot(value);return {filename:snapshot.receipt_number+".pdf",bytes:await buildReceiptPdf(snapshot)};
}
