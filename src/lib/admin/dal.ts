import "server-only";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { adminConfig } from "@/lib/supabase/env";
import { AdminError, authorize, securityState, verifiedSessionClaims, type AccessMode } from "./policy";

export async function verifiedClient(writable = false) {
  try { adminConfig(); } catch { throw new AdminError(503, "unavailable"); }
  const client = await serverClient(writable);
  const claimsResult = await client.auth.getClaims();
  if (claimsResult.error || !claimsResult.data) {
    const unavailable = claimsResult.error?.status === 0 || (claimsResult.error?.status ?? 0) >= 500;
    throw new AdminError(unavailable ? 503 : 401, unavailable ? "unavailable" : "unauthenticated");
  }
  const result = await client.auth.getUser();
  if (result.error || !result.data.user) {
    const unavailable = result.error?.status === 0 || (result.error?.status ?? 0) >= 500;
    throw new AdminError(unavailable ? 503 : 401, unavailable ? "unavailable" : "unauthenticated");
  }
  verifiedSessionClaims(claimsResult.data.claims, result.data.user.id, adminConfig().url);
  return { client, user: result.data.user };
}
export async function adminContext(mode: AccessMode = "operational", writable = false) {
  const { client, user } = await verifiedClient(writable);
  const result = await client.rpc("admin_security_state");
  if (result.error) throw new AdminError(result.error.code === "42501" ? 403 : 503, result.error.code === "42501" ? "denied" : "unavailable");
  const state = securityState(result.data);
  if (state.user_id !== user.id) throw new AdminError(403, "denied");
  authorize(state, mode);
  return { client, user, state };
}
export async function pageContext(mode: AccessMode = "operational") {
  try { return await adminContext(mode); }
  catch (error) {
    const reason = error instanceof AdminError ? error.reason : "unavailable";
    if (reason === "mfa" || reason === "step-up") redirect(`/admin/mfa?next=${mode === "owner" ? "/admin/users" : "/admin"}`);
    redirect(`/admin/login?state=${reason === "unauthenticated" ? "signed-out" : reason === "denied" ? "denied" : "unavailable"}`);
  }
}
