import { AdminError } from "@/lib/admin/policy";

export type FlagState = { key: string; present: boolean; enabled: boolean; version: number };
export type FlagCommand = { key: string; enabled: boolean; expectedVersion: number };
export type FlagResult = FlagState & { changed: boolean };
export type Availability = { available: boolean; reason: "on" | "off" | "unsupported" | "unavailable" };
const keyValid = (key: unknown): key is string => typeof key === "string" && /^[a-z][a-z0-9_]{1,47}\.enabled$/.test(key);
const versionValid = (v: unknown): v is number => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 2147483647;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k));
export function flagCommand(value: unknown): FlagCommand {
  if (!record(value) || !exact(value,["key","enabled","expectedVersion"]) || !keyValid(value.key) ||
    typeof value.enabled !== "boolean" || !versionValid(value.expectedVersion)) throw new AdminError(422,"invalid");
  return {key:value.key,enabled:value.enabled,expectedVersion:value.expectedVersion};
}
export function flagState(value: unknown): FlagState {
  if (!record(value) || !keyValid(value.key) || typeof value.present !== "boolean" || typeof value.enabled !== "boolean" ||
    !versionValid(value.version) || (value.present ? value.version < 1 : value.version !== 0 || value.enabled)) throw new AdminError(503,"unavailable");
  return {key:value.key,present:value.present,enabled:value.enabled,version:value.version};
}
export function flagSnapshot(value: unknown): FlagState[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) throw new AdminError(503,"unavailable");
  const flags = value.map(flagState);
  if (new Set(flags.map(f=>f.key)).size !== flags.length || !flags.some(f=>f.key === "campaigns.enabled")) throw new AdminError(503,"unavailable");
  return flags;
}
export function flagResult(value: unknown, command: FlagCommand): FlagResult {
  const state = flagState(value);
  if (!record(value) || typeof value.changed !== "boolean" || state.key !== command.key || state.enabled !== command.enabled ||
    state.version !== command.expectedVersion + (value.changed ? 1 : 0)) throw new AdminError(503,"unavailable");
  return {...state,changed:value.changed};
}
// Only a fresh trusted DB snapshot is authority. Future callers derive moduleKey
// from a reviewed descriptor, never a browser-selected substitute admission key.
export function composeAvailability(flags: FlagState[], moduleKey?: string): Availability {
  if (moduleKey !== undefined && (!keyValid(moduleKey) || moduleKey === "campaigns.enabled")) return {available:false,reason:"unsupported"};
  const required = moduleKey === undefined ? ["campaigns.enabled"] : ["campaigns.enabled",moduleKey];
  if (required.some(key=>!flags.some(f=>f.key === key))) return {available:false,reason:"unsupported"};
  const on = required.every(key=>flags.find(f=>f.key === key)?.enabled === true);
  return {available:on,reason:on ? "on" : "off"};
}
