import type { NextRequest } from "next/server";
import { adminContext } from "@/lib/admin/dal";
import { accessInput, ownerSnapshot } from "@/lib/admin/input";
import { sameOrigin, json, failure, databaseError } from "@/lib/admin/http";
import { AdminError } from "@/lib/admin/policy";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { client } = await adminContext("owner");
    const result = await client.rpc("admin_owner_snapshot");
    databaseError(result.error);
    return json(ownerSnapshot(result.data));
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const { client } = await adminContext("mutation", true);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AdminError(422, "invalid");
    const raw = await request.text();
    if (raw.length > 4096) throw new AdminError(422, "invalid");
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new AdminError(422, "invalid"); }
    const input = accessInput(body);
    const result = input.operation === "invite" ? await client.rpc("admin_create_invite", { invitee_email: input.email, invitee_role: input.role }) :
      input.operation === "revoke-invite" ? await client.rpc("admin_revoke_invite", { invite_id: input.id, expected_version: input.version }) :
      await client.rpc("admin_change_member", { target_user: input.id, expected_version: input.version, change_action: input.action, ...(input.role ? { next_role: input.role } : {}) });
    databaseError(result.error);
    const terminationPending = input.operation === "member" && ["disable", "revoke"].includes(input.action);
    return json({ saved: true, ...(terminationPending ? { session_termination: "pending-staging" } : {}) });
  } catch (error) { return failure(error); }
}
