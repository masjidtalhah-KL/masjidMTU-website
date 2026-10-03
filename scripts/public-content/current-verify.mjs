import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import { createRequire } from "node:module";
import { createJiti } from "jiti";
import { createClient } from "@sanity/client";
import { buildPlan, ROOT } from "../sanity-migration/plan.mjs";
import { assertCurrentBaseParity } from "./current-base-parity.mjs";
import { validatePlan } from "../sanity-migration/validation.mjs";
createRequire(import.meta.url)("@next/env").loadEnvConfig(ROOT);
const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true });
const load = (file) => jiti.import(path.join(ROOT, file));
const { projectId, dataset, apiVersion } = await load("src/sanity/env.ts");
const { publicQueries } = await load("src/lib/public-content/cms/queries.ts");
const adapters = await load("src/lib/public-content/cms/adapters.ts");
const { mapSettingsInformation } = await load("src/lib/public-content/cms/information-adapters.ts");
const { homepageEditorialQuery } = await load("src/lib/public-content/cms/homepage-queries.ts");
const { mapHomepageEditorial } = await load("src/lib/public-content/cms/homepage-adapters.ts");
const client = createClient({ projectId, dataset, apiVersion, token: undefined, perspective: "published", useCdn: false, timeout: 15000, maxRetries: 0 });
const base = `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
const results = Object.fromEntries(await Promise.all(Object.entries(publicQueries).map(async ([key, query]) => [key, await client.fetch(query)])));
const editorial = await client.fetch(homepageEditorialQuery);
const mapped = mapHomepageEditorial(editorial, Date.now(), base);
const information = mapSettingsInformation(results.settings, base);
adapters.mapProfile(results.profile, base); adapters.mapOrganisation(results.organisation, base);
adapters.mapSurau(results.surau, base); adapters.mapGallery(results.gallery, base);
const inventory = await client.fetch('*[!(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_id asc)');
const plan = await buildPlan();
const validation = await validatePlan(plan, inventory.filter((d) => ["siteSettings", "announcement", "program", "newsPost"].includes(d._type)), client);
assert.deepEqual(validation.errors, [], "Current full editorial/settings documents must pass schema validation");
const ids = Object.fromEntries(plan.assets.map((a) => [a.assetId, inventory.find((d) => d._type === "sanity.imageAsset" && d.sha1hash === a.sha1)?._id]));
assert.equal(Object.values(ids).filter(Boolean).length, 50, "Historical source image hashes must remain available");
assertCurrentBaseParity(plan, inventory, ids);
const counts = { announcement: editorial.announcements.length, program: editorial.programs.length, newsPost: editorial.news.length };
console.log(JSON.stringify({
  mode: "READ-ONLY-CURRENT-CONTRACT", target: { projectId, dataset },
  historicalBasePayloads: 43, approvedHistoricalImageHashes: 50,
  optionalInformation: { ncrService: !!information.contact.ncrService, donationInfo: !!information.donation.information },
  published: counts, eligible: { program: mapped.programs.length, newsPost: mapped.news.length },
  publicImageAssets: inventory.filter((d) => d._type === "sanity.imageAsset").length,
  currentDocumentsValidated: validation.documentsValidated, schemaWarnings: validation.warnings,
  publicInventoryFingerprint: crypto.createHash("sha256").update(JSON.stringify(inventory)).digest("hex"),
  approval: "Contract verification is not editorial approval. Historical exact parity remains a separate command.",
  drafts: "Not observable through token-free published reads", writes: 0,
}, null, 2));
