import { NextResponse, type NextRequest } from "next/server";
import { adminConfig } from "@/lib/supabase/env";
import { serverClient } from "@/lib/supabase/server";
import { adminContext, verifiedClient } from "@/lib/admin/dal";
import { safeAdminReturn, AdminError } from "@/lib/admin/policy";
import { databaseError, failure } from "@/lib/admin/http";
export async function GET(request: NextRequest) {
  let c;
  try { c = adminConfig(); } catch { return failure(new AdminError(503, "unavailable")); }
  const go = (route: string) => NextResponse.redirect(`${c.origin}${route}`, { headers: { "Cache-Control": "private, no-store" } });
  let client;
  try {
    if (request.nextUrl.origin !== c.origin) throw new AdminError(403, "denied");
    const code = request.nextUrl.searchParams.get("code");
    if (!code || code.length > 4096 || request.nextUrl.searchParams.has("error")) throw new AdminError(403, "denied");
    client = await serverClient(true);
    const exchange = await client.auth.exchangeCodeForSession(code);
    if (exchange.error) throw new AdminError(403, "denied");
    await verifiedClient(true);
    databaseError((await client.rpc("admin_accept_invite")).error);
    const { state } = await adminContext("security", true);
    if ((state.role === "super_admin" || state.has_totp) && state.aal !== "aal2") return go("/admin/mfa");
    return go(safeAdminReturn(request.nextUrl.searchParams.get("next")));
  } catch {
    if (client) await client.auth.signOut({ scope: "local" });
    return go("/admin/login?state=denied");
  }
}
