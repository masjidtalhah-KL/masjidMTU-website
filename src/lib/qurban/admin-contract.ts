import { AdminError } from "@/lib/admin/policy";
export type Attendance="yes"|"no"|"unsure"; export type Purpose="qurban"|"aqiqah";
export type Summary={registrations:number;submitted:number;cancelled:number;participants:number;qurban:number;aqiqah:number};
export type QurbanContext={id:string;title:string;campaign_year:number;hijri_display_label:string;currency:string;price_per_share_minor:number;cattle_count:number;shares_per_cattle:number};
export type RegistrationItem={id:string;public_reference:string;applicant_name:string;phone:string;participant_count:number;qurban:number;aqiqah:number;attendance:Attendance;same_cattle_preference:boolean;status:"submitted"|"cancelled";created_at:string;version:number};
export type ListView={campaign:QurbanContext;summary:Summary;total:number;page:number;page_size:number;items:RegistrationItem[];can_manage:boolean;recent_mfa:boolean};
export type Participant={id:string;participant_name:string;purpose:Purpose;version:number;created_at:string;updated_at:string};
export type Detail={id:string;campaign_id:string;public_reference:string;applicant_name:string;phone:string;address?:string;email?:string|null;attendance:Attendance;same_cattle_preference:boolean;status:"submitted"|"cancelled";created_at:string;updated_at:string;version:number;participants:Participant[];allowed_purposes:Purpose[];can_manage:boolean;recent_mfa:boolean;quote:{currency:string;price_per_share_minor:number;participant_count:number;total_minor:number;campaign_year:number;hijri_display_label:string};consent?:{accepted_at:string;akad_reference:string;content_hash:string;original_participant_count:number;current_participants_differ:boolean}|null};
export type Activity={page:number;items:{id:string;registration_id:string|null;participation_id:string|null;actor_id:string;action:string;occurred_at:string;expected_version:number|null;resulting_version:number|null;changed_fields:string[];reason:string|null;export_id:string|null;registration_count:number|null;participation_count:number|null}[]};
export const attendanceLabels={yes:"Ya",no:"Tidak",unsure:"Belum pasti"};
export const cancellationReasons={applicant_request:"Permintaan pemohon",duplicate_registration:"Pendaftaran berulang",entry_error:"Kesilapan pendaftaran",other_operational:"Sebab operasi lain"};
export const activityLabels:Record<string,string>={"registration.amended":"Maklumat pemohon dipinda","participation.amended":"Peserta dipinda","registration.cancelled":"Pendaftaran dibatalkan","qurban.export.xlsx":"Excel dijana"};
export function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=="object"||Array.isArray(value))throw new AdminError(422,"invalid");return value as Record<string,unknown>;}
export function exact(value:unknown,keys:string[]){const v=object(value);if(Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))throw new AdminError(422,"invalid");return v;}
export function uuid(v:unknown):string{if(typeof v!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v))throw new AdminError(422,"invalid");return v;}
export function version(v:unknown):number{if(typeof v!=="number"||!Number.isInteger(v)||v<1||v>2147483647)throw new AdminError(422,"invalid");return v;}
export function listOptions(query:URLSearchParams){
 const allowed=["page","page_size","search","status","purpose","sort"];
 for(const k of query.keys())if(!allowed.includes(k)||query.getAll(k).length!==1)throw new AdminError(422,"invalid");
 const page=Number(query.get("page")??1),page_size=Number(query.get("page_size")??20),search=(query.get("search")??"").trim(),status=query.get("status")??"all",purpose=query.get("purpose")??"all",sort=query.get("sort")??"newest";
 if(!Number.isInteger(page)||page<1||page>10000||!Number.isInteger(page_size)||page_size<1||page_size>50||search.length>100||/[\u0000-\u001f\u007f-\u009f]/.test(search)||!["all","submitted","cancelled"].includes(status)||!["all","qurban","aqiqah"].includes(purpose)||!["newest","oldest","reference","applicant"].includes(sort))throw new AdminError(422,"invalid");
 return {page,page_size,search,status,purpose,sort};
}
export function amendment(value:unknown){
 const raw=object(value);
 if(raw.kind==="registration"){const v=exact(raw,["kind","expected_version","changes"]);version(v.expected_version);const c=exact(v.changes,["applicant_name","phone","address","email","attendance","same_cattle_preference"]);
 if(typeof c.applicant_name!=="string"||typeof c.phone!=="string"||typeof c.address!=="string"||(c.email!==null&&typeof c.email!=="string")||!["yes","no","unsure"].includes(String(c.attendance))||typeof c.same_cattle_preference!=="boolean")throw new AdminError(422,"invalid");
 }else if(raw.kind==="participation"){const v=exact(raw,["kind","expected_version","participation_id","expected_participation_version","changes"]);version(v.expected_version);uuid(v.participation_id);version(v.expected_participation_version);const c=exact(v.changes,["participant_name","purpose"]);if(typeof c.participant_name!=="string"||!["qurban","aqiqah"].includes(String(c.purpose)))throw new AdminError(422,"invalid");
 }else throw new AdminError(422,"invalid");return raw;
}
export function cancellation(value:unknown){const v=exact(value,["expected_version","reason"]),expected_version=version(v.expected_version);if(typeof v.reason!=="string"||!Object.hasOwn(cancellationReasons,v.reason))throw new AdminError(422,"invalid");return {expected_version,reason:v.reason};}

export function listPayload(value:unknown){const v=exact(value,["page","page_size","search","status","purpose","sort"]);if(typeof v.page!=="number"||typeof v.page_size!=="number"||typeof v.search!=="string"||typeof v.status!=="string"||typeof v.purpose!=="string"||typeof v.sort!=="string")throw new AdminError(422,"invalid");return listOptions(new URLSearchParams(Object.entries(v).map(([k,x])=>[k,String(x)])));}
