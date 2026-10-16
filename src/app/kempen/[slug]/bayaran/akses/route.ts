import type {NextRequest} from "next/server";
import {exchangePayment,paymentCookie,paymentPath} from "@/lib/qurban/payment";
import {boundedBytes,paymentOrigin,paymentJson,paymentFailure} from "@/lib/qurban/payment-http";
import {QurbanError} from "@/lib/qurban/registration-contract";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{slug:string}>}){try{paymentOrigin(request);if(request.headers.get("content-type")!=="application/json")throw new QurbanError(422,"invalid");let value;try{value=JSON.parse((await boundedBytes(request.body,1024)).toString("utf8"));}catch(e){if(e instanceof QurbanError)throw e;throw new QurbanError(422,"invalid");}const {slug}=await params,secret=await exchangePayment(slug,value);const response=paymentJson({ok:true});response.cookies.set(paymentCookie,secret,{httpOnly:true,secure:true,sameSite:"strict",path:paymentPath(slug),maxAge:1200});return response;}catch(e){return paymentFailure(e);}}
