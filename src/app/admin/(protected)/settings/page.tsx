import Link from "next/link";
import { pageContext } from "@/lib/admin/dal";
export default async function SettingsPage() {
  const { state, user } = await pageContext();
  return <><p className="admin-eyebrow">Your account</p><h1>Settings</h1><section className="admin-card">
    <dl><dt>Email</dt><dd>{user.email}</dd><dt>Role</dt><dd>{state.role}</dd><dt>Authentication</dt><dd>Google · {state.aal.toUpperCase()}</dd></dl>
    <p>TOTP {state.has_totp ? "is enrolled" : "is not enrolled"} for this account.</p>
    <Link className="admin-button" href="/admin/mfa?next=/admin/settings" prefetch={false}>Manage authenticator / verify again</Link>
    <p>Recovery and factor removal require the owner&apos;s reviewed recovery procedure.</p>
  </section></>;
}
