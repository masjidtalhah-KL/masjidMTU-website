import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { createJiti } from "jiti";
import { createClient } from "@sanity/client";
import { buildPlan, resolveImages, equal, ROOT } from "../sanity-migration/plan.mjs";

// Public identifiers only; this verifier never reads or attaches a Sanity token.
createRequire(import.meta.url)("@next/env").loadEnvConfig(ROOT);
const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true });
const { projectId, dataset, apiVersion } = await jiti.import(path.join(ROOT, "src/sanity/env.ts"));
const { publicQueries } = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/queries.ts"));
const adapters = await jiti.import(path.join(ROOT, "src/lib/public-content/cms/adapters.ts"));
const client = createClient({ projectId, dataset, apiVersion, perspective: "published", useCdn: false, timeout: 15000, maxRetries: 2 });
const assetBase = `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
const results = Object.fromEntries(await Promise.all(Object.entries(publicQueries).map(async ([boundary, query]) => [boundary, await client.fetch(query)])));
const mapped = {
  profile: adapters.mapProfile(results.profile, assetBase),
  organisation: adapters.mapOrganisation(results.organisation, assetBase),
  surau: adapters.mapSurau(results.surau, assetBase),
  gallery: adapters.mapGallery(results.gallery, assetBase),
  contact: adapters.mapContact(results.settings),
};
const inventory = await client.fetch(`{
  "documents": *[_type in ["siteSettings", "profilePage", "organisationMember", "surau", "galleryCollection"] && !(_id in path("drafts.**")) && !(_id in path("versions.**"))],
  "assets": *[_type == "sanity.imageAsset"]{_id, sha1hash}
}`);
const plan = await buildPlan();
const ids = Object.fromEntries(plan.assets.map((asset) => [asset.assetId, inventory.assets.find((remote) => remote.sha1hash === asset.sha1)?._id]));
assert.equal(Object.values(ids).filter(Boolean).length, 50, "Approved image hashes must all exist");
const mismatches = plan.documents.filter((document) => {
  const actual = inventory.documents.find((remote) => remote._id === document._id);
  const payload = Object.fromEntries(Object.entries(actual ?? {}).filter(([key]) => !["_createdAt", "_updatedAt", "_rev"].includes(key)));
  return !equal(resolveImages(document, ids), payload);
}).map((document) => document._id);
assert.deepEqual(mismatches, [], "Published content differs from approved local baseline; review explicitly");
assert.equal(inventory.documents.length, 43);
assert.equal(mapped.organisation.length, 25);
assert.equal(mapped.profile.spaces.length, 5);
assert.equal(mapped.gallery.items.length, 12);
assert.equal(mapped.surau.filter((entry) => entry.category === "jumaat").length, 3);
assert.equal(mapped.surau.filter((entry) => entry.category === "biasa").length, 12);
console.log(JSON.stringify({
  mode: "READ-ONLY-PUBLISHED-PARITY", target: { projectId, dataset, apiVersion },
  documents: inventory.documents.length, imageAssets: inventory.assets.length,
  approvedImageHashes: 50, mismatches, organisationSlots: 25, surau: { jumaat: 3, biasa: 12 },
  profileImages: 5, galleryImages: 12,
  drafts: "Not observable through a token-free published read; no assertion made",
}, null, 2));
