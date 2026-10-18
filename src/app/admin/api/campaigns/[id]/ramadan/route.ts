import type {NextRequest}from "next/server";import {json,failure,sameOrigin}from "@/lib/admin/http";import {AdminError}from "@/lib/admin/policy";import {body,exact,RamadanError}from "@/lib/ramadan/contracts";import {workspace,write,sponsors,detail,slots,activity}from "@/lib/ramadan/server";
export const dynamic="force-dynamic";
export async function GET(_r:NextRequest,{params}:{params:Promise<{id:string}>}){try{return json(await workspace((await params).id));}catch(e){return failure(e);}}
export async function POST(r:NextRequest,{params}:{params:Promise<{id:string}>}){try{sameOrigin(r);if(r.nextUrl.search||r.headers.get("content-type")!=="application/json")throw new AdminError(422,"invalid");const p=exact(await body(r.body),["action","payload"]),id=(await params).id;
if(p.action==="offering"||p.action==="schedule")return json(await write(id,p.action,p.payload));
if(p.action==="list")return json(await sponsors(id,p.payload));
if(p.action==="detail"){const d=exact(p.payload,["id"]);return json(await detail(id,String(d.id)));}
if(p.action==="slots"){const d=exact(p.payload,["id"]);return json(await slots(id,String(d.id)));}
if(p.action==="activity"){const d=exact(p.payload,["page"]);if(!Number.isInteger(d.page))throw new AdminError(422,"invalid");return json(await activity(id,Number(d.page)));}throw new AdminError(422,"invalid");}catch(e){return failure(e instanceof RamadanError?new AdminError(e.status===413?422:422,"invalid"):e);}}
