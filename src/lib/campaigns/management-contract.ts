import { AdminError } from "@/lib/admin/policy";
import { campaignId, type LifecycleAction, type Windows } from "./lifecycle-contract";
import { availableCampaignTypes, campaignEditor, parseAdapterConfiguration, type Configuration, type TypeDescriptor, type CampaignAdminAdapter } from "./admin-registry";
export const statuses = ["draft", "scheduled", "open", "paused", "closed", "archived"] as const;
export type CampaignStatus = typeof statuses[number];
export const visibilities = ["private", "public", "unlisted"] as const;
export type Visibility = typeof visibilities[number];
export const coreFields = ["slug", "title", "visibility", "scheduled_public_display", "archived_history_display", "config_version", "configuration"] as const;
export type CampaignCore = { slug: string; title: string; visibility: Visibility; scheduled_public_display: boolean;
  archived_history_display: boolean; config_version: number; configuration: Configuration };
export type CampaignListItem = Omit<CampaignCore, "configuration"> & Windows & {
  id: string; type_key: string; status: CampaignStatus; version: number; created_at: string;
};
export type CampaignDetail = CampaignListItem & { configuration: Configuration; slug_editable: boolean; updated_at: string;
  editorial_binding: { project_id: string; dataset: string; document_type: string; document_id: string } | null };
export type CampaignAudit = { id: string; occurred_at: string; action: string; actor_category: "user" | "scheduler";
  expected_version: number; resulting_version: number; cause?: string };
export type CampaignView = { campaign: CampaignDetail; catalog: TypeDescriptor[]; audit: CampaignAudit[] | null;
  canManage: boolean; recentMfa: boolean };

export function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== keys.length ||
    keys.some(key => !Object.hasOwn(value, key))) throw new AdminError(422, "invalid");
  return value as Record<string, unknown>;
}
function positiveInteger(value: unknown, maximum = 2147483647): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > maximum) throw new AdminError(422, "invalid");
  return value as number;
}
export function positiveVersion(value: unknown): number { return positiveInteger(value, 2147483645); }
export function configuration(value: unknown): Configuration {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value) || new TextEncoder().encode(JSON.stringify(value)).length > 4096)
      throw Error("invalid");
    return value as Configuration;
  } catch { throw new AdminError(422, "invalid"); }
}
function identity(data: Record<string, unknown>) {
  if (typeof data.slug !== "string" || data.slug.length < 3 || data.slug.length > 100 ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug) || ["admin","studio","api","auth","login","settings","users","kempen","new"].includes(data.slug) ||
    typeof data.title !== "string" || [...data.title].length < 1 || [...data.title].length > 160 ||
    data.title.trim() !== data.title || /[\u0000-\u001f\u007f-\u009f]/.test(data.title)) throw new AdminError(422, "invalid");
  return { slug: data.slug, title: data.title };
}
export function createCampaignCommand(value: unknown, catalog: TypeDescriptor[], adapters?: readonly CampaignAdminAdapter[]) {
  const data = exactObject(value, ["type_key", "config_version", "slug", "title", "configuration"]);
  const names = identity(data), cv = positiveInteger(data.config_version);
  const editor = campaignEditor(catalog, String(data.type_key), cv, configuration(data.configuration), adapters);
  if (!editor || data.type_key !== editor.type_key) throw new AdminError(422, "invalid");
  return { ...names, type_key: editor.type_key, config_version: cv, configuration: parseAdapterConfiguration(editor, data.configuration)! };
}
export function updateCampaignCommand(value: unknown, current: CampaignDetail, catalog: TypeDescriptor[], adapters?: readonly CampaignAdminAdapter[]) {
  const data = exactObject(value, ["expectedVersion", ...coreFields]);
  const expectedVersion = positiveVersion(data.expectedVersion);
  if (expectedVersion !== current.version) throw new AdminError(409, "conflict");
  const names = identity(data), cv = positiveInteger(data.config_version);
  if (!visibilities.includes(data.visibility as Visibility) || typeof data.scheduled_public_display !== "boolean" ||
    typeof data.archived_history_display !== "boolean") throw new AdminError(422, "invalid");
  const editor = campaignEditor(catalog, current.type_key, cv, configuration(data.configuration), adapters);
  if (!editor || !campaignEditor(catalog, current.type_key, current.config_version, current.configuration, adapters)) throw new AdminError(422, "invalid");
  return { expectedVersion, payload: { ...names, config_version: cv, configuration: parseAdapterConfiguration(editor, data.configuration)!,
    visibility: data.visibility as Visibility, scheduled_public_display: data.scheduled_public_display,
    archived_history_display: data.archived_history_display } };
}
const windowFields = ["registration_opens_at", "registration_closes_at", "event_starts_at", "event_ends_at"] as const;
function instant(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)) || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) throw Error("invalid DTO");
  return value;
}
function base(value: unknown): CampaignListItem {
  const d = value as CampaignListItem;
  if (!d || typeof d !== "object" || !/^[a-z][a-z0-9_]{1,47}$/.test(d.type_key) || !statuses.includes(d.status) ||
    !visibilities.includes(d.visibility) || typeof d.scheduled_public_display !== "boolean" || typeof d.archived_history_display !== "boolean") throw Error("invalid DTO");
  identity(d as unknown as Record<string, unknown>); positiveInteger(d.config_version); positiveInteger(d.version); campaignId(d.id);
  const windows = {} as Windows;
  for (const key of windowFields) windows[key] = d[key] === null ? null : instant(d[key]);
  return { id: d.id, type_key: d.type_key, config_version: d.config_version, slug: d.slug, title: d.title, status: d.status,
    visibility: d.visibility, scheduled_public_display: d.scheduled_public_display, archived_history_display: d.archived_history_display,
    version: d.version, created_at: instant(d.created_at), ...windows };
}
export function campaignList(value: unknown): CampaignListItem[] {
  try { if (!Array.isArray(value) || value.length > 50) throw Error("invalid"); return value.map(base); }
  catch { throw new AdminError(503, "unavailable"); }
}
export function campaignDetail(value: unknown): CampaignDetail | null {
  if (value === null) return null;
  try {
    const d = value as CampaignDetail, safe = base(value);
    if (typeof d.slug_editable !== "boolean" || (d.slug_editable && d.status !== "draft")) throw Error("invalid");
    let editorial_binding: CampaignDetail["editorial_binding"] = null;
    if (d.editorial_binding !== null) {
      const b = d.editorial_binding;
      if (!b || typeof b.project_id !== "string" || !/^[a-z0-9]{8}$/.test(b.project_id) ||
        typeof b.dataset !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(b.dataset) ||
        typeof b.document_type !== "string" || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(b.document_type) ||
        typeof b.document_id !== "string" || !/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$/.test(b.document_id) || /^(drafts|versions)\./.test(b.document_id)) throw Error("invalid");
      editorial_binding = { project_id: b.project_id, dataset: b.dataset, document_type: b.document_type, document_id: b.document_id };
    }
    return { ...safe, configuration: configuration(d.configuration), slug_editable: d.slug_editable,
      updated_at: instant(d.updated_at), editorial_binding };
  } catch { throw new AdminError(503, "unavailable"); }
}
const auditActions = ["campaign.create","campaign.update","schedule.change","lifecycle.schedule","lifecycle.unschedule","lifecycle.open","lifecycle.pause","lifecycle.resume","lifecycle.close","lifecycle.archive"];
export function campaignAudit(value: unknown, id: string): CampaignAudit[] {
  try {
    if (!Array.isArray(value) || value.length > 50) throw Error("invalid");
    return value.map(a => {
      if (a.campaign_id !== id || a.flag_key !== null || !auditActions.includes(a.action) ||
        !["user", "scheduler"].includes(a.actor_category) || !Number.isInteger(a.expected_version) || a.expected_version < 0 ||
        a.resulting_version !== a.expected_version + 1) throw Error("invalid");
      const cause = a.metadata?.cause;
      if (cause !== undefined && !["manager", "deadline", "missed_window", "schedule_edit_deadline"].includes(cause)) throw Error("invalid");
      return { id: campaignId(a.id), occurred_at: instant(a.occurred_at), action: a.action, actor_category: a.actor_category,
        expected_version: a.expected_version, resulting_version: a.resulting_version, ...(cause ? { cause } : {}) };
    });
  } catch { throw new AdminError(503, "unavailable"); }
}
// API responses already contain the safe projection, never the raw DB shape.
export function campaignAuditView(value: unknown): CampaignAudit[] {
  try {
    if (!Array.isArray(value) || value.length > 50) throw Error("invalid");
    return value.map(a => {
      const keys = ["id", "occurred_at", "action", "actor_category", "expected_version", "resulting_version", ...(a?.cause === undefined ? [] : ["cause"])];
      exactObject(a, keys);
      if (!auditActions.includes(a.action) || !["user", "scheduler"].includes(a.actor_category) ||
        !Number.isInteger(a.expected_version) || a.expected_version < 0 || a.resulting_version !== a.expected_version + 1 ||
        (a.cause !== undefined && !["manager", "deadline", "missed_window", "schedule_edit_deadline"].includes(a.cause))) throw Error("invalid");
      return { id: campaignId(a.id), occurred_at: instant(a.occurred_at), action: a.action, actor_category: a.actor_category,
        expected_version: a.expected_version, resulting_version: a.resulting_version, ...(a.cause ? { cause: a.cause } : {}) };
    });
  } catch { throw new AdminError(503, "unavailable"); }
}
export const lifecycleActionSets: Record<CampaignStatus, readonly LifecycleAction[]> = {
  draft: ["schedule", "open", "archive"], scheduled: ["unschedule", "open", "close"], open: ["pause", "close"],
  paused: ["resume", "close"], closed: ["archive"], archived: [],
};
export function supportedCreationTypes(catalog: TypeDescriptor[]) { return availableCampaignTypes(catalog); }
