import { pageContext } from "@/lib/admin/dal";
import { AdminShell } from "@/components/admin/shell";
import { adminConfig } from "@/lib/supabase/env";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, state } = await pageContext();
  return <AdminShell key={user.id} config={adminConfig()} userId={user.id} email={user.email ?? ""} role={state.role}>{children}</AdminShell>;
}
