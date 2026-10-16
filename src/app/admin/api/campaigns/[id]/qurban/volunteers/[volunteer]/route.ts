import type {NextRequest}from "next/server";import {json,failure}from "@/lib/admin/http";import {qurbanBody}from "@/lib/qurban/admin-http";
export const dynamic="force-dynamic";
import {volunteerDetail,volunteerAmend}from "@/lib/qurban/volunteer-admin";
export async function GET(_r:NextRequest,{params}:{params:Promise<{id:string;volunteer:string}>}){try{const p=await params,v=await volunteerDetail(p.id,p.volunteer);return json(v,v?200:404);}catch(e){return failure(e);}}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string;volunteer:string}>}){try{const p=await params;return json(await volunteerAmend(p.id,p.volunteer,await qurbanBody(request)));}catch(e){return failure(e);}}
