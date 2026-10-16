import type {NextRequest}from "next/server";import {json,failure}from "@/lib/admin/http";import {qurbanBody}from "@/lib/qurban/admin-http";
export const dynamic="force-dynamic";
import {volunteerLabels,volunteerLabelCommand}from "@/lib/qurban/volunteer-admin";import {AdminError}from "@/lib/admin/policy";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{const query=request.nextUrl.searchParams,page=Number(query.get("page")??1);if([...query.keys()].some(k=>k!=="page")||query.getAll("page").length>1||!Number.isInteger(page)||page<1||page>10000)throw new AdminError(422,"invalid");return json(await volunteerLabels((await params).id,page));}catch(e){return failure(e);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{return json(await volunteerLabelCommand((await params).id,await qurbanBody(request)));}catch(e){return failure(e);}}
