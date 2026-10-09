import { AdminError, type SecurityState } from "@/lib/admin/policy";
export const lifecycleActions = ["schedule","unschedule","open","pause","resume","close","archive"] as const;
export type LifecycleAction = typeof lifecycleActions[number];
const fields = ["registration_opens_at","registration_closes_at","event_starts_at","event_ends_at"] as const;
export type Windows = Record<typeof fields[number], string | null>;
function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value,key))) throw new AdminError(422,"invalid");
  return value as Record<string,unknown>;
}
function version(value: unknown): number {
  if (!Number.isInteger(value) || (value as number)<1 || (value as number)>2147483645) throw new AdminError(422,"invalid");
  return value as number;
}
export function campaignId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)) throw new AdminError(422,"invalid");
  return value;
}
export function lifecycleCommand(value: unknown) {
  const data=object(value,["action","expectedVersion"]);
  if (!lifecycleActions.includes(data.action as LifecycleAction)) throw new AdminError(422,"invalid");
  return {action:data.action as LifecycleAction,expectedVersion:version(data.expectedVersion)};
}
export function scheduleCommand(value: unknown) {
  const data=object(value,["expectedVersion",...fields]);
  const windows={} as Windows;
  for (const key of fields) {
    const instant=data[key];
    if (instant !== null && (typeof instant !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(instant) ||
      !Number.isFinite(Date.parse(instant)))) throw new AdminError(422,"invalid");
    windows[key]=instant as string | null;
  }
  return {expectedVersion:version(data.expectedVersion),windows};
}
export function campaignManager(state: SecurityState) {
  if (state.role === "staff") throw new AdminError(403,"denied");
  if (state.role === "super_admin" && !state.recent_mfa) throw new AdminError(403,"step-up");
}
export function lifecycleResult(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AdminError(503,"unavailable");
  const data=value as Record<string,unknown>;
  if (typeof data.id !== "string" || !["draft","scheduled","open","paused","closed","archived"].includes(String(data.status)) ||
    !Number.isInteger(data.version) || (data.version as number)<1 || typeof data.changed !== "boolean") throw new AdminError(503,"unavailable");
  return {id:data.id,status:data.status as string,version:data.version as number,changed:data.changed};
}

export function campaignWindowResult(value: unknown) {
  if (!value || typeof value!=="object" || Array.isArray(value)) throw new AdminError(503,"unavailable");
  const data=value as Record<string,unknown>;
  if (typeof data.id!=="string" || !["draft","scheduled","open","paused","closed","archived"].includes(String(data.status)) ||
    !Number.isInteger(data.version) || (data.version as number)<1 || typeof data.registrationAvailable!=="boolean" ||
    (data.registrationAvailable && data.status!=="open")) throw new AdminError(503,"unavailable");
  return {id:data.id,status:data.status as string,version:data.version as number,registrationAvailable:data.registrationAvailable};
}
