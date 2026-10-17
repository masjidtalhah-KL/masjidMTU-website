import type{NextRequest}from"next/server";
import{paymentSession,readPayment}from"@/lib/qurban/payment";
import{receiptDownload}from"@/lib/qurban/verification";
import{paymentHeaders,paymentFailure,paymentOrigin,boundedBytes}from"@/lib/qurban/payment-http";
import{QurbanError}from"@/lib/qurban/registration-contract";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){try{paymentOrigin(request);if(request.headers.get("content-type")!=="application/json")throw new QurbanError(422,"invalid");let v;try{v=JSON.parse((await boundedBytes(request.body,256)).toString("utf8"));}catch{throw new QurbanError(422,"invalid");}if(!v||typeof v!=="object"||Object.keys(v).join()!=="expected_reference"||typeof v.expected_reference!=="string"||!/^QBN-[0-9a-f]{64}$/.test(v.expected_reference))throw new QurbanError(422,"invalid");
const session=await paymentSession(),{slug}=await params;if(!session)throw new QurbanError(404,"denied");const context=await readPayment(slug,session);if(!context)throw new QurbanError(404,"denied");if(context.reference!==v.expected_reference)throw new QurbanError(409,"conflict");const r=await receiptDownload({slug,session});return new Response(new Uint8Array(r.bytes),{headers:{...paymentHeaders,"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="'+r.filename+'"'}});}catch(e){return paymentFailure(e);}}
