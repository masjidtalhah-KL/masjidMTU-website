import type {NextRequest}from "next/server";import {json,failure}from "@/lib/admin/http";import {qurbanBody}from "@/lib/qurban/admin-http";
export const dynamic="force-dynamic";
import {volunteerList}from "@/lib/qurban/volunteer-admin";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{return json(await volunteerList((await params).id,await qurbanBody(request)));}catch(e){return failure(e);}}
