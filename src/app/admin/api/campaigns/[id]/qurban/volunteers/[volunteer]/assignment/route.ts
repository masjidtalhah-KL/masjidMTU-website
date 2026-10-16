import type {NextRequest}from "next/server";import {json,failure}from "@/lib/admin/http";import {qurbanBody}from "@/lib/qurban/admin-http";
export const dynamic="force-dynamic";
import {volunteerAssign}from "@/lib/qurban/volunteer-admin";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;volunteer:string}>}){try{const p=await params;return json(await volunteerAssign(p.id,p.volunteer,await qurbanBody(request)));}catch(e){return failure(e);}}
