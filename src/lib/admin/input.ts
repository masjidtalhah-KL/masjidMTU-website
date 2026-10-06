import { AdminError } from "./policy";
export type AccessInput = { operation: "invite"; email: string; role: "admin" | "staff" } |
  { operation: "revoke-invite"; id: string; version: number } |
  { operation: "member"; id: string; version: number; action: "role" | "disable" | "reactivate" | "revoke"; role?: "admin" | "staff" };
export function accessInput(value: unknown): AccessInput {
  const bad = () => { throw new AdminError(422, "invalid"); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return bad();
  const v = value as Record<string, unknown>;
  const only = (keys: string[]) => Object.keys(v).every(key => keys.includes(key));
  const role = v.role === "admin" || v.role === "staff";
  if (v.operation === "invite" && only(["operation", "email", "role"]) && role && typeof v.email === "string" &&
    v.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) return { operation: "invite", email: v.email.trim().toLowerCase(), role: v.role as "admin" | "staff" };
  if (typeof v.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.id) ||
    !Number.isSafeInteger(v.version) || Number(v.version) < 1) return bad();
  if (v.operation === "revoke-invite" && only(["operation", "id", "version"])) return { operation: v.operation, id: v.id, version: Number(v.version) };
  if (v.operation === "member" && only(["operation", "id", "version", "action", "role"]) &&
    ["role", "disable", "reactivate", "revoke"].includes(String(v.action)) &&
    (v.action === "role" ? role : v.role === undefined)) return v as AccessInput;
  return bad();
}
export type FoundationUser = { user_id: string; approved_email: string; display_name: string; role: "super_admin" | "admin" | "staff"; status: "active" | "disabled" | "revoked"; version: number; created_at: string };
export type FoundationInvite = { id: string; email_normalized: string; role: "admin" | "staff"; version: number; created_at: string; expires_at: string };
export type AuditEvent = { id: string; occurred_at: string; actor_id: string | null; target_id: string | null; invite_id: string | null; action: string; old_role: string | null; new_role: string | null; old_status: string | null; new_status: string | null; actor_aal: string; request_id: string };
export type OwnerSnapshot = { users: FoundationUser[]; invites: FoundationInvite[]; audit: AuditEvent[] };
export function ownerSnapshot(value: unknown): OwnerSnapshot {
  if (!value || typeof value !== "object") throw new AdminError(503, "unavailable");
  const s = value as OwnerSnapshot;
  if (!Array.isArray(s.users) || !Array.isArray(s.invites) || !Array.isArray(s.audit) || s.audit.length > 50 ||
    s.users.some(u => typeof u.user_id !== "string" || typeof u.approved_email !== "string" || !["super_admin", "admin", "staff"].includes(u.role) || !["active", "disabled", "revoked"].includes(u.status)) ||
    s.invites.some(i => !["admin", "staff"].includes(i.role) || typeof i.id !== "string" || typeof i.email_normalized !== "string")) throw new AdminError(503, "unavailable");
  return s;
}
