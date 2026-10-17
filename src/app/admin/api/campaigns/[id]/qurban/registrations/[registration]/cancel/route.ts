import type {NextRequest} from "next/server";import {json,failure} from "@/lib/admin/http";import {qurbanCancel,FinancialCancellationConflict} from "@/lib/qurban/admin";import {qurbanBody} from "@/lib/qurban/admin-http";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;registration:string}>}){try{const p=await params;return json(await qurbanCancel(p.id,p.registration,await qurbanBody(request)));}catch(e){if(e instanceof FinancialCancellationConflict)return json({error:"verified_financial"},409);return failure(e);}}
