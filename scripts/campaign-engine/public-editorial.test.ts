import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse, evaluate } from "groq-js";
import { campaignEditorialLocator, campaignEditorial, editorialEnvironmentMatches, composePublicCampaign } from "../../src/lib/campaigns/public-editorial-contract";
import { publicCampaign, type PublicCampaignOperational } from "../../src/lib/campaigns/public-contract";
import { readWithFallback, PublicContentError } from "../../src/lib/public-content/cms/read-policy";

const locator = { project_id: "2o95jmms", dataset: "production", document_type: "program" as const, document_id: "bound-program" };
const doc = { _id: locator.document_id, _type: "program", description: "Penerangan published." };
const operational: PublicCampaignOperational = { slug: "operational-slug", title: "Operational title", state: "open", unlisted: false,
  registration_opens_at: null, registration_closes_at: "2027-01-01T00:00:00Z", event_starts_at: null, event_ends_at: null, editorial_locator: locator };
const server = readFileSync("src/lib/campaigns/public-editorial.ts", "utf8");
const query = server.match(/campaignEditorialQuery = `([^`]+)`/)![1];

test("operational denial never invokes editorial resolver", async () => {
  let calls = 0;
  assert.equal(await composePublicCampaign(null, async () => { calls++; throw Error("must not run"); }), null);
  assert.equal(calls, 0);
});
test("unbound eligible campaign is minimal with no editorial query", async () => {
  let calls = 0;
  const result = await composePublicCampaign({ ...operational, editorial_locator: null }, async () => { calls++; return doc; });
  assert.equal(calls, 0); assert.equal(result?.editorial, null); assert(!Object.hasOwn(result!.campaign, "editorial_locator"));
});
test("exact stable published binding enriches only description and strips locator", async () => {
  const result = await composePublicCampaign(operational, async selected => { assert.deepEqual(selected, locator); return { ...doc, title: "Wrong title", state: "closed", flags: true, actor_id: "private", registration_closes_at: "2099-01-01T00:00:00Z" }; });
  assert.deepEqual(result?.editorial, { description: doc.description });
  assert.equal(result?.campaign.title, operational.title); assert.equal(result?.campaign.state, "open");
  assert.equal(result?.campaign.registration_closes_at, operational.registration_closes_at);
  assert(!JSON.stringify(result).includes("bound-program")); assert(!JSON.stringify(result).includes("private"));
});
for (const [name, value] of [
  ["missing", null], ["deleted", undefined], ["draft", { ...doc, _id: "drafts.bound-program" }],
  ["version", { ...doc, _id: "versions.release.bound-program" }], ["wrong type", { ...doc, _type: "newsPost" }],
  ["wrong exact ID", { ...doc, _id: "same-title-other-program", slug: { current: operational.slug }, title: operational.title }],
  ["malformed description", { ...doc, description: { html: "<script>bad</script>" } }],
  ["oversized description", { ...doc, description: "x".repeat(401) }], ["control character", { ...doc, description: "bad\u0000text" }],
] as const) test("editorial " + name + " leaves minimal operational presentation", async () => {
  const result = await composePublicCampaign(operational, async () => value);
  assert.equal(result?.editorial, null); assert.equal(result?.campaign.title, operational.title);
});
test("locator is exact allowlisted non-secret shape; draft/version/unsupported/extra keys ignored", () => {
  assert.deepEqual(campaignEditorialLocator(locator), locator);
  for (const value of [null, {}, { ...locator, token: "not-allowed" }, { ...locator, document_type: "newsPost" },
    { ...locator, document_id: "drafts.bound-program" }, { ...locator, document_id: "versions.release.bound-program" },
    { ...locator, project_id: "https://evil.invalid" }, { ...locator, dataset: "../private" }]) assert.equal(campaignEditorialLocator(value), null);
  const malformed = publicCampaign({ ...operational, editorial_locator: { ...locator, token: "unexpected" } }, operational.slug);
  assert.equal(malformed?.editorial_locator, null);
});
test("wrong project or dataset cannot select another Sanity client", () => {
  assert(editorialEnvironmentMatches(locator, { projectId: locator.project_id, dataset: locator.dataset }));
  assert(!editorialEnvironmentMatches({ ...locator, project_id: "abcdefgh" }, { projectId: locator.project_id, dataset: locator.dataset }));
  assert(!editorialEnvironmentMatches({ ...locator, dataset: "other" }, { projectId: locator.project_id, dataset: locator.dataset }));
});
test("actual GROQ exact ID/type excludes draft/version and slug/title collisions", async () => {
  const dataset = [doc, { ...doc, _id: "drafts.bound-program" }, { ...doc, _id: "versions.release.bound-program" },
    { ...doc, _id: "collision", slug: { current: operational.slug }, title: operational.title }, { ...doc, _id: "wrong-type", _type: "newsPost" }];
  for (const id of ["missing", "drafts.bound-program", "versions.release.bound-program", "wrong-type", operational.slug, operational.title]) {
    assert.equal(await (await evaluate(parse(query), { dataset, params: { documentId: id } })).get(), null);
  }
  assert.deepEqual(await (await evaluate(parse(query), { dataset, params: { documentId: locator.document_id } })).get(), doc);
  assert(!query.includes("slug")); assert(!query.includes("title"));
});
test("HTML-shaped description remains plain text only with no private fields", () => {
  const description = "<script>window.bad=true</script>";
  assert.deepEqual(campaignEditorial({ ...doc, description, token: "private" }, locator), { description });
  const component = readFileSync("src/components/public/campaign-page.tsx", "utf8");
  assert(!component.includes("dangerouslySetInnerHTML")); assert(component.includes("{editorial.description}"));
});
for (const state of ["paused", "closed"] as const) test("editorial cannot override operational " + state, async () => {
  assert.equal((await composePublicCampaign({ ...operational, state }, async () => ({ ...doc, state: "open" })))?.campaign.state, state);
});
test("temporary CMS transport failure uses minimum; permanent failure remains unavailable", async () => {
  assert.equal(await readWithFallback("campaign-editorial", async () => { throw Object.assign(Error("offline"), { code: "ECONNREFUSED" }); }, v => v, () => null, () => {}), null);
  await assert.rejects(readWithFallback("campaign-editorial", async () => { throw new PublicContentError("bad query"); }, v => v, () => null), PublicContentError);
});
test("server published reader uses fixed configured client, no token/CDN/cache or broad project/type query", () => {
  assert(server.includes('perspective: "published"')); assert(server.includes('token: undefined'));
  assert(server.includes('useCdn: false')); assert(server.includes('cache: "no-store"'));
  assert(server.includes("editorialEnvironmentMatches")); assert(!server.includes("createClient("));
});
