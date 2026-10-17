import type { Configuration } from "@/lib/campaigns/admin-registry";
export type RamadanConfiguration = Configuration & { campaign_year: number; hijri_display_label: string; currency: "MYR" };
export type RamadanFormState = Configuration & { campaign_year: number | ""; hijri_display_label: string; currency: string };
function parse(value: unknown, draft: boolean): RamadanFormState | null {
 if (!value || typeof value!=="object" || Array.isArray(value) || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) return null;
 const c=value as RamadanFormState;
 if(Object.keys(c).sort().join()!=="campaign_year,currency,hijri_display_label")return null;
 try{if(new TextEncoder().encode(JSON.stringify(c)).length>512)return null;}catch{return null;}
 if(draft){if(!(c.campaign_year===""||typeof c.campaign_year==="number"&&Number.isFinite(c.campaign_year))||typeof c.currency!=="string"||c.currency.length>3||typeof c.hijri_display_label!=="string"||[...c.hijri_display_label].length>80)return null;}
 else if(!Number.isSafeInteger(c.campaign_year)||Number(c.campaign_year)<1900||Number(c.campaign_year)>9999||c.currency!=="MYR"||typeof c.hijri_display_label!=="string"||[...c.hijri_display_label].length<1||[...c.hijri_display_label].length>80||c.hijri_display_label.trim()!==c.hijri_display_label||/[\u0000-\u001f\u007f-\u009f<>]/.test(c.hijri_display_label))return null;
 return c;
}
export const parseRamadanConfiguration=(value:unknown):RamadanConfiguration|null=>parse(value,false) as RamadanConfiguration|null;
export const parseRamadanFormState=(value:unknown):RamadanFormState|null=>parse(value,true);
// Generic Campaign annual-config form only; not a Ramadan offering/management UI.
export const initialRamadanFormState=():RamadanFormState=>({campaign_year:"",hijri_display_label:"",currency:""});
