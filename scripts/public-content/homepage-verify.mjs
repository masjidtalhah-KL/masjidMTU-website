import path from "node:path";
import { createRequire } from "node:module";
import { createJiti } from "jiti";
import { createClient } from "@sanity/client";
import { ROOT } from "../sanity-migration/plan.mjs";

// Read-only and token-free. Publication/approval are separate editorial steps.
createRequire(import.meta.url)("@next/env").loadEnvConfig(ROOT);
const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true });
const { projectId, dataset, apiVersion } = await jiti.import(path.join(ROOT, "src/sanity/env.ts"));
const { homepageEditorialQuery } = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/homepage-queries.ts"));
const { mapHomepageEditorial } = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/homepage-adapters.ts"));
const client = createClient({ projectId, dataset, apiVersion, token: undefined, perspective: "published", useCdn: false, timeout: 15000, maxRetries: 0 });
const bundle = await client.fetch(homepageEditorialQuery, {}, { perspective: "published" });
const mapped = mapHomepageEditorial(bundle, Date.now(), `https://cdn.sanity.io/images/${projectId}/${dataset}/`);
const counts = { announcement: bundle.announcements.length, program: bundle.programs.length, newsPost: bundle.news.length };
console.log(JSON.stringify({
  mode: "READ-ONLY-PUBLISHED-HOMEPAGE", checkedAt: new Date().toISOString(),
  target: { projectId, dataset, apiVersion }, published: counts,
  eligible: { announcement: mapped.announcement ? 1 : 0, program: mapped.programs.length, newsPost: mapped.news.length },
  contentState: Object.values(counts).every((count) => count === 0) ? "No published editorial documents; no approved published content available to render." : "Published editorial documents exist; editorial approval remains a separate human responsibility.",
  drafts: "Not observable through a token-free published read; no assertion made.",
  writes: 0,
}, null, 2));
