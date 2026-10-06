import { pageContext } from "@/lib/admin/dal";
import { ownerSnapshot } from "@/lib/admin/input";
import { UsersPanel } from "@/components/admin/users";
import { databaseError } from "@/lib/admin/http";
export default async function UsersPage() {
  const { client, state } = await pageContext("owner");
  const result = await client.rpc("admin_owner_snapshot");
  databaseError(result.error);
  return <><p className="admin-eyebrow">Foundation access</p><h1>Users &amp; invitations</h1>
    <p>Access management is restricted to super_admin. Invitations expire after 7 days.</p>
    <UsersPanel initial={ownerSnapshot(result.data)} recentMfa={state.recent_mfa} />
  </>;
}
