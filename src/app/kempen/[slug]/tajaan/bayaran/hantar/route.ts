import type {NextRequest} from "next/server";
import {paymentSession,readPayment,submitProof} from "@/lib/ramadan/payment";
import {proofMultipart,paymentJson,paymentFailure} from "@/lib/ramadan/payment-http";
import {RamadanError} from "@/lib/ramadan/contracts";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){try{const session=await paymentSession();if(!session)throw new RamadanError(404,"denied");const {slug}=await params,context=await readPayment(slug,session);if(!context)throw new RamadanError(404,"denied");const input=await proofMultipart(request,true);if(input.expected_reference!==context.reference)throw new RamadanError(409,"conflict");return paymentJson(await submitProof(input,{slug,session}),201);}catch(e){return paymentFailure(e);}}
