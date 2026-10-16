import type {NextRequest} from "next/server";
import {submitProof} from "@/lib/qurban/payment";
import {proofMultipart,paymentJson,paymentFailure} from "@/lib/qurban/payment-http";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;registration:string}>}){try{const {id,registration}=await params;return paymentJson(await submitProof(await proofMultipart(request),{campaign:id,registration}),201);}catch(e){return paymentFailure(e);}}
