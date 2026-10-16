import "server-only";
import {adminContext} from "@/lib/admin/dal";import {databaseError} from "@/lib/admin/http";import {campaignManager} from "@/lib/campaigns/lifecycle-contract";
import {uuid} from "./admin-contract";import {reassignment,type AllocationGrid} from "./allocation-contract";
export async function qurbanGrid(id:string,page=1){const {client}=await adminContext("operational");const r=await client.rpc("admin_qurban_grid",{target_campaign:uuid(id),page_number:page});databaseError(r.error);return r.data as unknown as AllocationGrid;}
export async function qurbanInitializeGrid(id:string){const {client,state}=await adminContext("operational",true);campaignManager(state);const r=await client.rpc("admin_qurban_initialize_grid",{target_campaign:uuid(id)});databaseError(r.error);return r.data;}
export async function qurbanReassign(id:string,value:unknown){const {client,state}=await adminContext("operational",true);campaignManager(state);const r=await client.rpc("admin_qurban_reassign_allocation",{target_campaign:uuid(id),...reassignment(value)});databaseError(r.error);return r.data;}
