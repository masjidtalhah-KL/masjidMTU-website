import type{NextRequest}from"next/server";
import{receiptDownload}from"@/lib/qurban/verification";
import{paymentHeaders,paymentFailure}from"@/lib/qurban/payment-http";
import{QurbanError}from"@/lib/qurban/registration-contract";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string;registration:string}>}){try{if(request.nextUrl.search||request.headers.get("sec-fetch-site")==="cross-site")throw new QurbanError(404,"denied");const p=await params,r=await receiptDownload({campaign:p.id,registration:p.registration});return new Response(new Uint8Array(r.bytes),{headers:{...paymentHeaders,"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="'+r.filename+'"'}});}catch(e){return paymentFailure(e);}}
