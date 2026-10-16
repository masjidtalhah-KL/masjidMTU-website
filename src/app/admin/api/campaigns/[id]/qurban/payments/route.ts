import type {NextRequest} from "next/server";
import {qurbanBody} from "@/lib/qurban/admin-http";
import {paymentList} from "@/lib/qurban/payment";
import {paymentJson,paymentFailure} from "@/lib/qurban/payment-http";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{return paymentJson(await paymentList((await params).id,await qurbanBody(request)));}catch(e){return paymentFailure(e);}}
