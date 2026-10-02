import "server-only";
import { client } from "../../../sanity/client";
import { dataset, projectId } from "../../../sanity/env";
import { mapContact, mapGallery, mapOrganisation, mapProfile, mapSurau } from "./adapters";
import { localContact, localGallery, localOrganisation, localProfile, localSurau } from "./fallback";
import { publicQueries } from "./queries";
import { readWithFallback } from "./read-policy";

/** Next.js owns freshness; avoid stacking the Sanity API CDN cache on top. */
const publicClient = client.withConfig({ useCdn: false, perspective: "published", token: undefined, timeout: 8000, maxRetries: 0 });
const assetBase = `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
export const PUBLIC_CONTENT_REVALIDATE_SECONDS = 300;

function fetchPublished(boundary: keyof typeof publicQueries): Promise<unknown> {
  return publicClient.fetch<unknown>(publicQueries[boundary], {}, {
    perspective: "published",
    cache: "force-cache",
    next: { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: [`public-content:${boundary}`] },
  });
}

export const getProfileContent = (captions: Readonly<Record<string, string>>) =>
  readWithFallback("profile", () => fetchPublished("profile"), (value) => mapProfile(value, assetBase), () => localProfile(captions));
export const getOrganisationContent = () =>
  readWithFallback("organisation", () => fetchPublished("organisation"), (value) => mapOrganisation(value, assetBase), localOrganisation);
export const getSurauContent = () =>
  readWithFallback("surau", () => fetchPublished("surau"), (value) => mapSurau(value, assetBase), localSurau);
export const getGalleryContent = () =>
  readWithFallback("gallery", () => fetchPublished("gallery"), (value) => mapGallery(value, assetBase), localGallery);
export const getContactContent = () =>
  readWithFallback("settings", () => fetchPublished("settings"), mapContact, localContact);
