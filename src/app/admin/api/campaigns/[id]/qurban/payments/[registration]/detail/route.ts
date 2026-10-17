import type{NextRequest}from"next/server";
import{qurbanBody}from"@/lib/qurban/admin-http";
import{paymentDetail}from"@/lib/qurban/verification";
import{paymentJson,paymentFailure}from"@/lib/qurban/payment-http";
import{QurbanError}from"@/lib/qurban/registration-contract";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;registration:string}>}){try{const v=await qurbanBody(request)as {page:number};if(!v||Object.keys(v).join()!=="page"||!Number.isInteger(v.page)||v.page<1||v.page>1000)throw new QurbanError(422,"invalid");const p=await params;return paymentJson(await paymentDetail(p.id,p.registration,v.page));}catch(e){return paymentFailure(e);}}
