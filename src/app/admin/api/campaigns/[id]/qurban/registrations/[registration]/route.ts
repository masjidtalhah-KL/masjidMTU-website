import type {NextRequest} from "next/server";import {json,failure} from "@/lib/admin/http";import {AdminError} from "@/lib/admin/policy";import {qurbanDetail,qurbanAmend} from "@/lib/qurban/admin";import {qurbanBody} from "@/lib/qurban/admin-http";
export const dynamic="force-dynamic";
type Context={params:Promise<{id:string;registration:string}>};
export async function GET(request:NextRequest,{params}:Context){try{if(request.nextUrl.search)throw new AdminError(422,"invalid");const p=await params;return json(await qurbanDetail(p.id,p.registration));}catch(e){return failure(e);}}
export async function POST(request:NextRequest,{params}:Context){try{const p=await params;return json(await qurbanAmend(p.id,p.registration,await qurbanBody(request)));}catch(e){return failure(e);}}
