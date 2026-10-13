import type { Configuration } from "@/lib/campaigns/admin-registry";
export type QurbanPurpose = "qurban" | "aqiqah";
export type QurbanConfiguration = Configuration & {
  campaign_year: number; hijri_display_label: string; currency: "MYR";
  price_per_cattle_share_minor: number; cattle_count: number; shares_per_cattle: number;
  allowed_purposes: QurbanPurpose[]; approved_akad_version: string;
  registration_rules: { max_participants_per_registration: number };
  volunteer_whatsapp_group_url?: string | null;
};
export type QurbanFormState = Configuration & {
  campaign_year: number | ""; hijri_display_label: string; currency: string;
  price_per_cattle_share_minor: number | ""; cattle_count: number | ""; shares_per_cattle: number | "";
  allowed_purposes: QurbanPurpose[]; approved_akad_version: string;
  registration_rules: { max_participants_per_registration: number | "" };
  volunteer_whatsapp_group_url?: string | null;
};
const required = ["campaign_year", "hijri_display_label", "currency", "price_per_cattle_share_minor", "cattle_count", "shares_per_cattle", "allowed_purposes", "approved_akad_version", "registration_rules"];
const integer = (v: unknown, lo: number, hi: number) => typeof v === "number" && Number.isSafeInteger(v) && v >= lo && v <= hi;
const text = (v: unknown, max: number, blank: boolean) => typeof v === "string" && v.trim() === v && [...v].length <= max && (blank || v.length > 0) && !/[\u0000-\u001f\u007f-\u009f]/.test(v);
function parse(value: unknown, draft: boolean): QurbanFormState | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return null;
  const c = value as QurbanFormState;
  try { if (new TextEncoder().encode(JSON.stringify(c)).length > 4096) return null; } catch { return null; }
  if (required.some(k => !Object.hasOwn(c, k)) || Object.keys(c).some(k => ![...required, "volunteer_whatsapp_group_url"].includes(k))) return null;
  for (const [k, lo, hi] of [["campaign_year", 1900, 9999], ["price_per_cattle_share_minor", 1, 1000000000], ["cattle_count", 1, 10000], ["shares_per_cattle", 1, 100]] as const)
    if (draft ? !(c[k] === "" || typeof c[k] === "number" && Number.isFinite(c[k])) : !integer(c[k], lo, hi)) return null;
  if (draft ? typeof c.hijri_display_label !== "string" || c.hijri_display_label.length > 80 || typeof c.currency !== "string" || c.currency.length > 3 || typeof c.approved_akad_version !== "string" || c.approved_akad_version.length > 80 : !text(c.hijri_display_label, 80, false) || c.currency !== "MYR" || !text(c.approved_akad_version, 80, false) || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(c.approved_akad_version)) return null;
  if (!Array.isArray(c.allowed_purposes) || c.allowed_purposes.length > 2 || !draft && !c.allowed_purposes.length ||
    c.allowed_purposes.some(p => !["qurban", "aqiqah"].includes(p)) || new Set(c.allowed_purposes).size !== c.allowed_purposes.length) return null;
  const rules = c.registration_rules;
  if (!rules || typeof rules !== "object" || Array.isArray(rules) || Object.keys(rules).length !== 1 || !Object.hasOwn(rules, "max_participants_per_registration") ||
    (draft ? !(rules.max_participants_per_registration === "" || typeof rules.max_participants_per_registration === "number" && Number.isFinite(rules.max_participants_per_registration)) : !integer(rules.max_participants_per_registration, 1, 100))) return null;
  if (c.volunteer_whatsapp_group_url !== undefined && c.volunteer_whatsapp_group_url !== null &&
    (typeof c.volunteer_whatsapp_group_url !== "string" || c.volunteer_whatsapp_group_url.length > 154 || !draft && (!text(c.volunteer_whatsapp_group_url, 154, false) || !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{1,128}$/.test(c.volunteer_whatsapp_group_url)))) return null;
  return c;
}
export const parseQurbanConfiguration = (v: unknown): QurbanConfiguration | null => parse(v, false) as QurbanConfiguration | null;
export const parseQurbanFormState = (v: unknown): QurbanFormState | null => parse(v, true);
// UI-only initial state. It intentionally FAILS persisted configuration validation.
export const initialQurbanFormState = (): QurbanFormState => ({ campaign_year: "", hijri_display_label: "", currency: "", price_per_cattle_share_minor: "", cattle_count: "", shares_per_cattle: "", allowed_purposes: [], approved_akad_version: "", registration_rules: { max_participants_per_registration: "" }, volunteer_whatsapp_group_url: null });
