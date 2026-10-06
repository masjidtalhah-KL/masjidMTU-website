import { pageContext } from "@/lib/admin/dal";
import { adminConfig } from "@/lib/supabase/env";
import { MfaPanel } from "@/components/admin/mfa";
import { SignOut } from "@/components/admin/signout";
import { safeAdminReturn } from "@/lib/admin/policy";
export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { state } = await pageContext("security");
  const config = adminConfig();
  const { next } = await searchParams;
  return <main className="admin-auth"><p className="admin-eyebrow">Account security</p><h1>Verify your authenticator</h1>
    <p>{state.role === "super_admin" ? "Supabase TOTP verification is required before owner access." : "You can add and verify an authenticator for your account."}</p>
    <MfaPanel config={config} userId={state.user_id} next={safeAdminReturn(next)} /><SignOut config={config} />
  </main>;
}
