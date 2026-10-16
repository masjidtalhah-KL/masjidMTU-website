import { publicCampaignSlug } from "@/lib/campaigns/public-contract";

export const QURBAN_BODY_BYTES = 65536;
export type Purpose = "qurban" | "aqiqah";
export type Attendance = "yes" | "no" | "unsure";
export type RegistrationContext = {
  slug: string; title: string; campaign_version: number; config_version: 1;
  global_flag_version: number; module_flag_version: number;
  campaign_year: number; hijri_display_label: string; currency: "MYR";
  price_per_share_minor: number; allowed_purposes: Purpose[]; max_participants: number;
  registration_closes_at: string | null; akad_reference: string; akad_text: string; akad_hash: string;
};
export type Applicant = { name: string; phone: string; address: string; email: string | null };
export type Participant = { name: string; purpose: Purpose };
export type RegistrationRequest = {
  slug: string; idempotency_key: string; payment_access_secret: string; expected_campaign_version: number;
  expected_global_flag_version: number; expected_module_flag_version: number;
  expected_akad_reference: string; expected_akad_hash: string;
  applicant: Applicant; participants: Participant[]; attendance: Attendance;
  same_cattle_preference: boolean; accepted_akad: true;
};
export type RegistrationResult = { payment_access_id: string; reference: string; participant_count: number; currency: "MYR"; price_per_share_minor: number; total_minor: number };
export class QurbanError extends Error {
  constructor(public status: number, public reason: "invalid" | "conflict" | "unavailable" | "denied") { super(reason); }
}
const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => plain(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const integer = (v: unknown, lo = 1, hi = 2147483647): v is number => Number.isSafeInteger(v) && Number(v) >= lo && Number(v) <= hi;
export const boundedText = (v: unknown, max: number): v is string => typeof v === "string" && v === v.trim() && [...v].length >= 1 && [...v].length <= max && !/[\u0000-\u001f\u007f-\u009f]/.test(v);
const hash = (v: unknown) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v) && v.length === 64;
const reference = (v: unknown) => boundedText(v, 80) && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(v);
export function validApplicant(v: unknown): v is Applicant {
  return exact(v, ["name", "phone", "address", "email"]) && boundedText(v.name, 160) && boundedText(v.phone, 30) &&
    /^\+?[0-9 ()-]+$/.test(v.phone) && v.phone.replace(/\D/g, "").length >= 8 && v.phone.replace(/\D/g, "").length <= 15 &&
    typeof v.address === "string" && [...v.address].length <= 500 && boundedText(v.address.replace(/\r\n/g, "\n").replace(/\n/g, " "), 500) &&
    (v.email === null || boundedText(v.email, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email));
}
export function registrationRequest(v: unknown): RegistrationRequest {
  if (!exact(v, ["slug", "idempotency_key", "payment_access_secret", "expected_campaign_version", "expected_global_flag_version", "expected_module_flag_version", "expected_akad_reference", "expected_akad_hash", "applicant", "participants", "attendance", "same_cattle_preference", "accepted_akad"]) ||
    !publicCampaignSlug(v.slug) || !boundedText(v.slug, 100) || !hash(v.idempotency_key) || !hash(v.payment_access_secret) || !integer(v.expected_campaign_version) || !integer(v.expected_global_flag_version) || !integer(v.expected_module_flag_version) ||
    !reference(v.expected_akad_reference) || !hash(v.expected_akad_hash) || !validApplicant(v.applicant) || !["yes", "no", "unsure"].includes(String(v.attendance)) ||
    typeof v.same_cattle_preference !== "boolean" || v.accepted_akad !== true || !Array.isArray(v.participants) || v.participants.length < 1 || v.participants.length > 100 ||
    v.participants.some(p => !exact(p, ["name", "purpose"]) || !boundedText(p.name, 160) || !["qurban", "aqiqah"].includes(String(p.purpose))) ||
    new TextEncoder().encode(v.participants.map(p => p.name).join("")).length > 20000 || new TextEncoder().encode(JSON.stringify(v)).length > QURBAN_BODY_BYTES) throw new QurbanError(422, "invalid");
  return v as RegistrationRequest;
}
export function registrationContext(v: unknown, slug: string): RegistrationContext | null {
  if (v === null) return null;
  if (!exact(v, ["slug", "title", "campaign_version", "config_version", "global_flag_version", "module_flag_version", "campaign_year", "hijri_display_label", "currency", "price_per_share_minor", "allowed_purposes", "max_participants", "registration_closes_at", "akad_reference", "akad_text", "akad_hash"]) ||
    !publicCampaignSlug(v.slug) || v.slug !== slug || !boundedText(v.title, 160) || !integer(v.campaign_version) || v.config_version !== 1 || !integer(v.global_flag_version) || !integer(v.module_flag_version) ||
    !integer(v.campaign_year, 1900, 9999) || !boundedText(v.hijri_display_label, 80) || v.currency !== "MYR" || !integer(v.price_per_share_minor, 1, 1000000000) ||
    !integer(v.max_participants, 1, 100) || !Array.isArray(v.allowed_purposes) || v.allowed_purposes.length < 1 || v.allowed_purposes.length > 2 || new Set(v.allowed_purposes).size !== v.allowed_purposes.length ||
    v.allowed_purposes.some(p => !["qurban", "aqiqah"].includes(p)) || !reference(v.akad_reference) || !hash(v.akad_hash) || typeof v.akad_text !== "string" || [...v.akad_text].length < 1 || [...v.akad_text].length > 12000 ||
    (v.registration_closes_at !== null && (typeof v.registration_closes_at !== "string" || !Number.isFinite(Date.parse(v.registration_closes_at))))) throw new QurbanError(503, "unavailable");
  return v as RegistrationContext;
}
export function registrationResult(v: unknown): RegistrationResult {
  if (!exact(v, ["payment_access_id", "reference", "participant_count", "currency", "price_per_share_minor", "total_minor"]) || typeof v.payment_access_id !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v.payment_access_id) || typeof v.reference !== "string" || !/^QBN-[0-9a-f]{64}$/.test(v.reference) || v.reference.length !== 68 ||
    !integer(v.participant_count, 1, 100) || v.currency !== "MYR" || !integer(v.price_per_share_minor, 1, 1000000000) || !integer(v.total_minor, 1, 100000000000) || v.total_minor !== v.price_per_share_minor * v.participant_count) throw new QurbanError(503, "unavailable");
  return v as RegistrationResult;
}
export function money(minor: number) {
  // Exact integer split; no binary floating-point multiplication of monetary values.
  return `RM${Math.floor(minor / 100).toLocaleString("ms-MY")}.${String(minor % 100).padStart(2, "0")}`;
}
