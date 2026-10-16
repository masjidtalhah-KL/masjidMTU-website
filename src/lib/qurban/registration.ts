import "server-only";
import { createClient } from "@supabase/supabase-js";
import { adminConfig } from "@/lib/supabase/env";
import type { Database, Json } from "@/lib/supabase/database.types";
import { publicCampaignSlug } from "@/lib/campaigns/public-contract";
import { QurbanError, registrationContext, registrationRequest, registrationResult } from "./registration-contract";

export function publicQurbanClient() {
  const config = adminConfig();
  return createClient<Database>(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) },
  });
}
export async function readQurbanContext(slug: string) {
  if (!publicCampaignSlug(slug)) return null;
  try {
    const result = await publicQurbanClient().rpc("public_qurban_registration_context", { target_slug: slug }).abortSignal(AbortSignal.timeout(8000));
    if (result.error) throw new QurbanError(503, "unavailable");
    return registrationContext(result.data, slug);
  } catch { throw new QurbanError(503, "unavailable"); }
}
export async function submitQurban(value: unknown) {
  const payload = registrationRequest(value);
  try {
    const result = await publicQurbanClient().rpc("public_qurban_registration_submit", { payload: payload as unknown as Json }).abortSignal(AbortSignal.timeout(15000));
    if (result.error) {
      if (result.error.code === "PT409") throw new QurbanError(409, "conflict");
      if (result.error.code === "22023") throw new QurbanError(422, "invalid");
      throw new QurbanError(503, "unavailable");
    }
    return registrationResult(result.data);
  } catch (error) { throw error instanceof QurbanError ? error : new QurbanError(503, "unavailable"); }
}
