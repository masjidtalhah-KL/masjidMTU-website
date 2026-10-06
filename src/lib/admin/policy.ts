export type AdminRole = "super_admin" | "admin" | "staff";
export type SecurityState = { user_id: string; role: AdminRole; status: "active"; aal: "aal1" | "aal2"; has_totp: boolean; recent_mfa: boolean };
export type AccessMode = "security" | "operational" | "owner" | "mutation";
export class AdminError extends Error {
  constructor(public readonly status: 401 | 403 | 409 | 422 | 503, public readonly reason: "unauthenticated" | "denied" | "mfa" | "step-up" | "conflict" | "invalid" | "unavailable") { super(reason); }
}
export function authorize(state: SecurityState, mode: AccessMode) {
  if (mode === "security") return;
  if ((state.role === "super_admin" || state.has_totp) && (state.aal !== "aal2" || !state.has_totp)) throw new AdminError(403, "mfa");
  if ((mode === "owner" || mode === "mutation") && state.role !== "super_admin") throw new AdminError(403, "denied");
  if (mode === "mutation" && !state.recent_mfa) throw new AdminError(403, "step-up");
}
export function securityState(value: unknown): SecurityState {
  if (!value || typeof value !== "object") throw new AdminError(503, "unavailable");
  const s = value as Record<string, unknown>;
  if (typeof s.user_id !== "string" || !["super_admin", "admin", "staff"].includes(String(s.role)) || s.status !== "active" ||
    !["aal1", "aal2"].includes(String(s.aal)) || typeof s.has_totp !== "boolean" || typeof s.recent_mfa !== "boolean") throw new AdminError(503, "unavailable");
  return s as SecurityState;
}
export function safeAdminReturn(value: unknown): string {
  return typeof value === "string" && ["/admin", "/admin/users", "/admin/settings"].includes(value) ? value : "/admin";
}
export function isIsolatedRoute(pathname: string) {
  return ["/admin", "/studio"].some(root => pathname === root || pathname.startsWith(`${root}/`));
}
export function verifiedSessionClaims(claims: Record<string, unknown>, userId: string, url: string) {
  if (claims.sub !== userId || claims.iss !== `${url}/auth/v1` || claims.role !== "authenticated" ||
    (claims.aud !== "authenticated" && !(Array.isArray(claims.aud) && claims.aud.includes("authenticated"))) ||
    typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000) throw new AdminError(401, "unauthenticated");
}
