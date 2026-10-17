import "server-only";
import {adminContext} from "@/lib/admin/dal";
import {databaseError} from "@/lib/admin/http";
import {campaignManager} from "@/lib/campaigns/lifecycle-contract";
import type {Json} from "@/lib/supabase/database.types";
import {amendment,cancellation,listOptions,uuid,type ListView,type Detail,type Activity} from "./admin-contract";
export async function qurbanList(id:string,options:ReturnType<typeof listOptions>){const {client}=await adminContext("operational");const r=await client.rpc("admin_qurban_list",{target_campaign:uuid(id),options});databaseError(r.error);return r.data as unknown as ListView;}
export async function qurbanDetail(id:string,registration:string){const {client}=await adminContext("operational");const r=await client.rpc("admin_qurban_detail",{target_campaign:uuid(id),target_registration:uuid(registration)});databaseError(r.error);return r.data as unknown as Detail|null;}
export async function qurbanActivity(id:string,page=1){const {client,state}=await adminContext("operational");campaignManager(state);const r=await client.rpc("admin_qurban_activity",{target_campaign:uuid(id),page_number:page});databaseError(r.error);return r.data as unknown as Activity;}
export async function qurbanAmend(id:string,registration:string,value:unknown){const {client,state}=await adminContext("operational",true);campaignManager(state);const r=await client.rpc("admin_qurban_amend",{target_campaign:uuid(id),target_registration:uuid(registration),payload:amendment(value) as Json});databaseError(r.error);return r.data;}
export class FinancialCancellationConflict extends Error {}
export async function qurbanCancel(id:string,registration:string,value:unknown){const {client,state}=await adminContext("operational",true);campaignManager(state);const c=cancellation(value);const r=await client.rpc("admin_qurban_cancel",{target_campaign:uuid(id),target_registration:uuid(registration),expected_version:c.expected_version,reason:c.reason});if(r.error?.code==="PT409"&&r.error.message==="Bayaran telah disahkan. Gunakan proses kewangan yang berasingan.")throw new FinancialCancellationConflict();databaseError(r.error);return r.data;}
