import "server-only";
import { client } from "../../../sanity/client";
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from "./server";
import { mapHomepageEditorial, unavailableHomepageEditorial } from "./homepage-adapters";
import { homepageEditorialQuery } from "./homepage-queries";
import { readWithFallback } from "./read-policy";

const publicClient = client.withConfig({ useCdn: false, perspective: "published", token: undefined, timeout: 8000, maxRetries: 0 });

export const getHomepageEditorial = () => readWithFallback(
  "homepage-editorial",
  () => publicClient.fetch<unknown>(homepageEditorialQuery, {}, {
    perspective: "published",
    cache: "force-cache",
    next: { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ["public-content:homepage-editorial"] },
  }),
  mapHomepageEditorial,
  unavailableHomepageEditorial,
);
