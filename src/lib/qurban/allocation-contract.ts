import {exact,uuid,version} from "./admin-contract";
import {AdminError} from "@/lib/admin/policy";
export type GridAllocation={id:string;version:number;participation_id:string;registration_id:string;participant_name:string;purpose:"qurban"|"aqiqah";reference:string};
export type GridSlot={id:string;number:number;allocation:GridAllocation|null};
export type GridCattle={id:string;number:number;slots:GridSlot[]};
export type AllocationGrid={page:number;page_size:number;cattle_count:number;shares_per_cattle:number;initialized:boolean;capacity:number;allocated:number;empty:number;can_manage:boolean;recent_mfa:boolean;cattle:GridCattle[]};
export function gridPage(query:URLSearchParams){if([...query.keys()].some(k=>k!=="page")||query.getAll("page").length>1)throw new AdminError(422,"invalid");const n=Number(query.get("page")??1);if(!Number.isInteger(n)||n<1||n>1000)throw new AdminError(422,"invalid");return n;}
export function reassignment(value:unknown){const v=exact(value,["allocation_id","expected_version","target_cattle","target_slot"]);return {allocation_id:uuid(v.allocation_id),expected_version:version(v.expected_version),target_cattle:uuid(v.target_cattle),target_slot:uuid(v.target_slot)};}
