import type {NextRequest}from"next/server";
import{qurbanBody}from"@/lib/qurban/admin-http";
import{reviewPayment,PaymentReviewError}from"@/lib/qurban/verification";
import{paymentJson,paymentFailure}from"@/lib/qurban/payment-http";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{return paymentJson(await reviewPayment((await params).id,await qurbanBody(request)));}catch(e){if(e instanceof PaymentReviewError)return paymentJson({error:e.reason},409);return paymentFailure(e);}}
