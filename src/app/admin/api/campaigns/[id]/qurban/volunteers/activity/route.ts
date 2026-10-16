import type {NextRequest}from "next/server";import {json,failure}from "@/lib/admin/http";
export const dynamic="force-dynamic";
import {volunteerActivity}from "@/lib/qurban/volunteer-admin";import {AdminError}from "@/lib/admin/policy";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{const query=request.nextUrl.searchParams,page=Number(query.get("page")??1);if([...query.keys()].some(k=>k!=="page")||query.getAll("page").length>1||!Number.isInteger(page)||page<1||page>10000)throw new AdminError(422,"invalid");return json(await volunteerActivity((await params).id,page));}catch(e){return failure(e);}}
