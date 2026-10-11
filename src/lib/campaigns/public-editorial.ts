import "server-only";
import { client } from "@/sanity/client";
import { projectId, dataset } from "@/sanity/env";
import { readWithFallback } from "@/lib/public-content/cms/read-policy";
import { campaignEditorialLocator, editorialEnvironmentMatches, type CampaignEditorialLocator } from "./public-editorial-contract";

// Existing reviewed program schema; no CMS lifecycle/date/CTA or arbitrary type projection.
export const campaignEditorialQuery = `*[_id == $documentId && _type == "program" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))][0]{_id,_type,description}`;
const publishedClient = client.withConfig({ useCdn: false, perspective: "published", token: undefined, timeout: 8000, maxRetries: 0 });
export async function readCampaignEditorial(locator: CampaignEditorialLocator): Promise<unknown> {
  if (!campaignEditorialLocator(locator) || !editorialEnvironmentMatches(locator, { projectId, dataset })) return null;
  return readWithFallback("campaign-editorial", () => publishedClient.fetch<unknown>(campaignEditorialQuery,
    { documentId: locator.document_id }, { perspective: "published", cache: "no-store" }), value => value, () => null);
}
