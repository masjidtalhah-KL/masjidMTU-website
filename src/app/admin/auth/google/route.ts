import type { NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { adminConfig } from "@/lib/supabase/env";
import { sameOrigin, json, failure } from "@/lib/admin/http";
import { AdminError } from "@/lib/admin/policy";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const c = adminConfig();
    const client = await serverClient(true);
    const result = await client.auth.signInWithOAuth({ provider: "google", options: {
      redirectTo: `${c.origin}/admin/auth/callback`, scopes: "openid email profile",
      queryParams: { prompt: "select_account" }, skipBrowserRedirect: true,
    } });
    if (result.error || !result.data.url) throw new AdminError(503, "unavailable");
    // Only the configured Auth origin can initiate the OAuth redirect.
    if (new URL(result.data.url).origin !== c.url) throw new AdminError(503, "unavailable");
    return json({ url: result.data.url });
  } catch (error) { return failure(error); }
}
