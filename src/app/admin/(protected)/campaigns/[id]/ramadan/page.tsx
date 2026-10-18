import {notFound}from "next/navigation";import {workspace}from "@/lib/ramadan/server";import {RamadanAdmin}from "@/components/admin/ramadan-panel";import {CampaignReadFailure}from "@/components/admin/campaign-read-failure";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!/^[0-9a-f-]{36}$/.test(id))notFound();let w;try{w=await workspace(id);}catch(e){return <CampaignReadFailure error={e} next={"/admin/campaigns/"+id}/>;}return <RamadanAdmin initial={w}/>;}
