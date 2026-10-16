import type {NextRequest} from "next/server";import {json,failure} from "@/lib/admin/http";import {qurbanGrid,qurbanInitializeGrid} from "@/lib/qurban/allocation";import {qurbanBody} from "@/lib/qurban/admin-http";import {exact} from "@/lib/qurban/admin-contract";import {gridPage} from "@/lib/qurban/allocation-contract";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{return json(await qurbanGrid((await params).id,gridPage(request.nextUrl.searchParams)));}catch(e){return failure(e);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{exact(await qurbanBody(request),[]);return json(await qurbanInitializeGrid((await params).id));}catch(e){return failure(e);}}
