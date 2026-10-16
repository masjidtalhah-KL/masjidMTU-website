import type {NextRequest} from "next/server";
import {paymentSession,readPayment,submitProof} from "@/lib/qurban/payment";
import {proofMultipart,paymentJson,paymentFailure} from "@/lib/qurban/payment-http";
import {QurbanError} from "@/lib/qurban/registration-contract";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){try{const session=await paymentSession();if(!session)throw new QurbanError(404,"denied");const {slug}=await params,input=await proofMultipart(request,true),context=await readPayment(slug,session);if(!context)throw new QurbanError(404,"denied");if(input.expected_reference!==context.reference)throw new QurbanError(409,"conflict");return paymentJson(await submitProof(input,{slug,session}),201);}catch(e){return paymentFailure(e);}}
