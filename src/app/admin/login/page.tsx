import { adminConfig } from "@/lib/supabase/env";
import { LoginPanel } from "@/components/admin/login";
import Link from "next/link";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  let configured = false;
  try { adminConfig(); configured = true; } catch { /* no public default/project fallback */ }
  return <main className="admin-auth"><p className="admin-eyebrow">Masjid Talhah Bin Ubaidillah</p><h1>Admin sign in</h1>
    <p>Use the Google account approved for your invitation.</p>
    {state === "denied" && <p role="alert">Access denied. Contact the owner if you need access.</p>}
    {(state === "unavailable" || !configured) && <p role="status">Admin sign in is unavailable. Please try again after setup is complete.</p>}
    <LoginPanel configured={configured} />
    <p className="admin-muted">Invitation only. No public registration.</p><Link href="/" prefetch={false}>Return to the public website</Link>
  </main>;
}
