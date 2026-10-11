import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { adminConfig } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import { publicCampaign, publicCampaignSlug, PublicCampaignUnavailable } from "./public-contract";
import { composePublicCampaign } from "./public-editorial-contract";

// React cache deduplicates only within this request. No operational persistence/cache.
// Anonymous client has no cookie/session store or service-role credential.
export const readPublicCampaign = cache(async (slug: string) => {
  if (!publicCampaignSlug(slug)) return null;
  try {
    const config = adminConfig();
    const client = createClient<Database>(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) },
    });
    const result = await client.rpc("public_campaign_page", { target_slug: slug }).abortSignal(AbortSignal.timeout(8000));
    if (result.error) throw new PublicCampaignUnavailable();
    // Even the editorial module/config is loaded only after operational eligibility and a valid locator.
    return await composePublicCampaign(publicCampaign(result.data, slug), async locator => {
      const { readCampaignEditorial } = await import("./public-editorial");
      return readCampaignEditorial(locator);
    });
  } catch { throw new PublicCampaignUnavailable(); }
});
