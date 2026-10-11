import { campaignEditorialLocator, type CampaignEditorialLocator } from "./public-editorial-contract";

export type PublicCampaignState = "scheduled" | "open" | "paused" | "closed";
export type PublicCampaign = {
  slug: string; title: string; state: PublicCampaignState; unlisted: boolean;
  registration_opens_at: string | null; registration_closes_at: string | null;
  event_starts_at: string | null; event_ends_at: string | null;
};
export type PublicCampaignOperational = PublicCampaign & { editorial_locator: CampaignEditorialLocator | null };
export class PublicCampaignUnavailable extends Error {
  constructor() { super("Campaign information unavailable"); }
}
export function publicCampaignSlug(value: unknown): value is string {
  return typeof value === "string" && value.length >= 3 && value.length <= 100 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}
export function publicCampaign(value: unknown, slug: string): PublicCampaignOperational | null {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PublicCampaignUnavailable();
  const data = value as Record<string, unknown>;
  const keys = ["slug", "title", "state", "unlisted", "registration_opens_at", "registration_closes_at", "event_starts_at", "event_ends_at", "editorial_locator"];
  if (Object.keys(data).length !== keys.length || !keys.every(key => Object.hasOwn(data, key)) ||
    !publicCampaignSlug(data.slug) || data.slug !== slug || typeof data.title !== "string" ||
    data.title.length < 1 || data.title.length > 160 || data.title !== data.title.trim() || /[\u0000-\u001f\u007f]/.test(data.title) ||
    !["scheduled", "open", "paused", "closed"].includes(String(data.state)) || typeof data.unlisted !== "boolean") throw new PublicCampaignUnavailable();
  for (const key of keys.slice(4, 8)) {
    const date = data[key];
    if (date !== null && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(date) || !Number.isFinite(Date.parse(date)))) throw new PublicCampaignUnavailable();
  }
  for (const [start, end] of [["registration_opens_at", "registration_closes_at"], ["event_starts_at", "event_ends_at"]]) {
    if (data[start] !== null && data[end] !== null && Date.parse(String(data[end])) <= Date.parse(String(data[start]))) throw new PublicCampaignUnavailable();
  }
  return { ...data, editorial_locator: campaignEditorialLocator(data.editorial_locator) } as PublicCampaignOperational;
}
export const publicCampaignLabels: Readonly<Record<PublicCampaignState, string>> = {
  scheduled: "Pendaftaran belum dibuka", open: "Kempen aktif",
  paused: "Pendaftaran dihentikan sementara", closed: "Pendaftaran telah ditutup",
};
export function publicCampaignDate(value: string) {
  return new Intl.DateTimeFormat("ms-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}
export function isPublicCampaignRoute(pathname: string) {
  return pathname === "/kempen" || pathname.startsWith("/kempen/");
}
