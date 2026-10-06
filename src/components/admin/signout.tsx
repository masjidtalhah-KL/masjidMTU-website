"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import type { BrowserConfig } from "@/lib/supabase/config";
export function SignOut({ config }: { config?: BrowserConfig }) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    document.querySelectorAll<HTMLElement>("[data-admin-sensitive]").forEach(element => { element.hidden = true; });
    try {
      await fetch("/admin/auth/signout", { method: "POST", signal: AbortSignal.timeout(8000) });
      if (config) await Promise.race([browserClient(config).auth.signOut({ scope: "local" }), new Promise(resolve => setTimeout(resolve, 3000))]);
    } finally {
      // Full document navigation discards the router cache and account-specific UI.
      window.location.replace("/admin/login?state=signed-out");
    }
  }
  return <button className="admin-button admin-button-secondary" onClick={() => void logout()} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>;
}
