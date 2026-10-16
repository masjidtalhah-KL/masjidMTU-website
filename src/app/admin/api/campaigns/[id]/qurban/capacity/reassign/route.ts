import type {NextRequest} from "next/server";import {json,failure} from "@/lib/admin/http";import {qurbanReassign} from "@/lib/qurban/allocation";import {qurbanBody} from "@/lib/qurban/admin-http";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{return json(await qurbanReassign((await params).id,await qurbanBody(request)));}catch(e){return failure(e);}}
