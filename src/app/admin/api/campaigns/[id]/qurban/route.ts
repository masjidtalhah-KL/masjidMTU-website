import type {NextRequest} from "next/server";import {json,failure} from "@/lib/admin/http";import {qurbanList} from "@/lib/qurban/admin";import {qurbanBody} from "@/lib/qurban/admin-http";import {listPayload,listOptions} from "@/lib/qurban/admin-contract";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{return json(await qurbanList((await params).id,listOptions(request.nextUrl.searchParams)));}catch(e){return failure(e);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{const options=listPayload(await qurbanBody(request));return json(await qurbanList((await params).id,options));}catch(e){return failure(e);}}
