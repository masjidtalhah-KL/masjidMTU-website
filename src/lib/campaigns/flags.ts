import "server-only";
import { adminContext } from "@/lib/admin/dal";
import { databaseError } from "@/lib/admin/http";
import { flagCommand, flagResult, flagSnapshot, composeAvailability, type Availability } from "./flag-contract";

// cookies()/verified Auth + a new POST RPC per call; no memoization or CMS cache.
export async function readSystemFlags() {
  const { client } = await adminContext("operational");
  const result = await client.rpc("admin_system_flags");
  databaseError(result.error);
  return flagSnapshot(result.data);
}
export async function setSystemFlag(value: unknown) {
  const { client } = await adminContext("mutation",true);
  const command = flagCommand(value);
  const result = await client.rpc("admin_set_system_flag", {
    target_key:command.key,desired_enabled:command.enabled,expected_version:command.expectedVersion,
  });
  databaseError(result.error);
  return flagResult(result.data,command);
}
// Authenticated operational composition only, not a public admission/projection.
export async function effectiveFeatureAvailability(moduleKey?: string): Promise<Availability> {
  try { return composeAvailability(await readSystemFlags(),moduleKey); }
  catch { return {available:false,reason:"unavailable"}; }
}
