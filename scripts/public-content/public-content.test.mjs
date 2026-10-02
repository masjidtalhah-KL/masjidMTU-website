import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { createJiti } from "jiti";
import { parse, evaluate } from "groq-js";
import { buildPlan, resolveImages, ROOT } from "../sanity-migration/plan.mjs";

const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: true });
const load = (name) => jiti.import(path.join(ROOT, "src/lib/public-content/cms", `${name}.ts`));
const [adapters, fallback, policy, { publicQueries }] = await Promise.all(["adapters", "fallback", "read-policy", "queries"].map(load));
const { sanityImageLoader } = await load("image-loader");
const plan = await buildPlan();
const assetBase = "https://cdn.sanity.io/images/2o95jmms/production/";
const assets = plan.assets.map((asset) => ({
  _id: `image-${asset.sha1}-${asset.width}x${asset.height}-${asset.format}`,
  _type: "sanity.imageAsset",
  url: `${assetBase}${asset.sha1}-${asset.width}x${asset.height}.${asset.format}`,
  metadata: { dimensions: { width: asset.width, height: asset.height } },
}));
const ids = Object.fromEntries(plan.assets.map((asset, index) => [asset.assetId, assets[index]._id]));
const documents = plan.documents.map((document) => resolveImages(document, ids));
const dataset = [...documents, ...assets,
  ...documents.map((document) => ({ ...document, _id: `drafts.${document._id}`, role: "UNPUBLISHED", title: "UNPUBLISHED" })),
  ...documents.map((document) => ({ ...document, _id: `versions.release.${document._id}`, role: "UNPUBLISHED", title: "UNPUBLISHED" })),
  { ...documents.find((document) => document._type === "organisationMember"), _id: "organisationMember-inactive", isActive: false },
  { ...documents.find((document) => document._type === "surau"), _id: "surau-inactive", isActive: false },
  { ...documents.find((document) => document._type === "galleryCollection"), _id: "galleryCollection-other", category: "activities" },
];
async function query(boundary, input = dataset) {
  return (await evaluate(parse(publicQueries[boundary]), { dataset: input })).get();
}
const queried = Object.fromEntries(await Promise.all(Object.keys(publicQueries).map(async (boundary) => [boundary, await query(boundary)])));
function expectedImage(local) {
  const index = plan.assets.findIndex((asset) => `/${asset.localPath.slice("public/".length)}` === local.src);
  return { src: assets[index].url, alt: local.alt, width: local.width, height: local.height };
}

test("published query boundaries exclude drafts, releases, inactive records and other collections", () => {
  assert.equal(queried.profile._id, "profilePage");
  assert.equal(queried.settings._id, "siteSettings");
  assert.equal(queried.organisation.length, 25);
  assert.equal(queried.surau.length, 15);
  assert.equal(queried.gallery._id, "galleryCollection-interior-masjid");
  for (const boundary of Object.values(publicQueries)) {
    assert.match(boundary, /drafts\.\*\*/);
    assert.match(boundary, /versions\.\*\*/);
  }
});
test("CMS photo URLs resize without cropping/upscaling or changing the asset", () => {
  const url = new URL(sanityImageLoader({ src: assets[0].url, width: 640, quality: 75 }));
  assert.equal(url.origin + url.pathname, assets[0].url);
  assert.equal(url.searchParams.get("w"), "640");
  assert.equal(url.searchParams.get("fit"), "max");
  assert.equal(url.searchParams.get("q"), "75");
  assert.equal(url.searchParams.get("auto"), "format");
  assert.equal(url.searchParams.has("h"), false);
  assert.equal(url.searchParams.has("crop"), false);
});
test("profile paragraphs, alt text, captions, images and five-image order match the approved source", () => {
  const captions = Object.fromEntries(plan.documents.find((d) => d._type === "profilePage").spaceImages.map((image) => [image._key, image.caption]));
  const local = fallback.localProfile(captions);
  const expected = { ...local, spaces: local.spaces.map((space) => ({ ...space, image: expectedImage(space.image) })) };
  assert.deepEqual(adapters.mapProfile(queried.profile, assetBase), expected);
  assert.equal(expected.spaces.length, 5);
});
test("organisation preserves every role slot, group order, appointments and portraits", () => {
  const expected = fallback.localOrganisation().map((slot) => ({ ...slot, photo: slot.photo ? expectedImage(slot.photo) : null }));
  const rank = (id) => ["jawatankuasa-utama", "ajk-biro", "imam", "bilal", "noja", "pembantu-tadbir"].indexOf(id);
  expected.sort((a, b) => rank(a.groupId) - rank(b.groupId) || a.order - b.order);
  const actual = adapters.mapOrganisation(queried.organisation, assetBase);
  assert.deepEqual(actual, expected);
  assert.equal(actual.length, 25);
  assert.equal(actual.filter((slot) => slot.photo).length, 23);
  assert.equal(actual.find((slot) => slot.id === "ajk-timbalan-pengerusi").status, "vacant");
  assert.equal(actual.find((slot) => slot.name === "Soffan Affendi Bin Aminudin").photo, null);
});
test("surau preserves logos, addresses, order and 3 Jumaat + 12 Biasa", () => {
  const expected = fallback.localSurau().map((surau) => ({ ...surau, logo: expectedImage(surau.logo) }));
  const actual = adapters.mapSurau(queried.surau, assetBase);
  assert.deepEqual(actual, expected);
  assert.equal(actual.filter((surau) => surau.category === "jumaat").length, 3);
  assert.equal(actual.filter((surau) => surau.category === "biasa").length, 12);
});
test("gallery preserves 12 original ratios, alt texts, captions and array order", () => {
  const local = fallback.localGallery();
  const expected = { ...local, items: local.items.map((item) => ({ ...expectedImage(item), id: item.id, category: item.category, order: item.order, caption: item.caption })) };
  assert.deepEqual(adapters.mapGallery(queried.gallery, assetBase), expected);
  assert.equal(expected.items.length, 12);
});
test("contact lines, dial/email links, social URLs and hours match approved content", () => {
  assert.deepEqual(adapters.mapContact(queried.settings), { ...fallback.localContact(), source: "sanity:siteSettings" });
});
test("valid CMS changes are used instead of local wording and ordering", () => {
  const changed = structuredClone(queried.profile);
  changed.vision = "Visi editorial baharu";
  assert.equal(adapters.mapProfile(changed, assetBase).vision, changed.vision);
  const reversed = { ...queried.gallery, items: queried.gallery.items.toReversed() };
  assert.equal(adapters.mapGallery(reversed, assetBase).items[0].id, queried.gallery.items.at(-1)._key);
});
test("optional profile notes/captions and missing surau logos do not invent local CMS values", () => {
  const profile = structuredClone(queried.profile);
  delete profile.sourceNote; delete profile.spaceImages[0].caption;
  const actual = adapters.mapProfile(profile, assetBase);
  assert.equal(actual.sourceNote, null); assert.equal(actual.spaces[0].caption, null);
  const surau = structuredClone(queried.surau); surau[0].logo = null;
  assert.equal(adapters.mapSurau(surau, assetBase).find((item) => item.id === surau[0]._id).logo, null);
});
test("missing singleton and empty collection errors are explicit", () => {
  for (const fn of [adapters.mapProfile, adapters.mapContact, adapters.mapGallery]) assert.throws(() => fn(null, assetBase), policy.PublicContentError);
  assert.throws(() => adapters.mapOrganisation([], assetBase), policy.PublicContentError);
  assert.throws(() => adapters.mapSurau([], assetBase), policy.PublicContentError);
});
test("broken image references, missing alt, invalid dimensions and wrong dataset are rejected", () => {
  const image = queried.profile.spaceImages[0].image;
  for (const bad of [{ ...image, asset: null }, { ...image, alt: "" }, { ...image, asset: { ...image.asset, width: 0 } }, { ...image, asset: { ...image.asset, url: "https://cdn.sanity.io/images/other/production/image.png" } }]) {
    assert.throws(() => adapters.mapImage(bad, assetBase, "test"), policy.PublicContentError);
  }
});
test("unknown groups/categories, duplicate ordering and inconsistent vacancies are rejected", () => {
  const mutateOrganisation = (mutate) => { const records = structuredClone(queried.organisation); mutate(records); return () => adapters.mapOrganisation(records, assetBase); };
  assert.throws(mutateOrganisation((records) => { records[0].group = "unknown"; }), policy.PublicContentError);
  assert.throws(mutateOrganisation((records) => { records[1].group = records[0].group; records[1].displayOrder = records[0].displayOrder; }), policy.PublicContentError);
  assert.throws(mutateOrganisation((records) => { records.find((record) => record.isVacant).name = "Invalid holder"; }), policy.PublicContentError);
  assert.throws(() => adapters.mapSurau([{ ...queried.surau[0], category: "unknown" }], assetBase), policy.PublicContentError);
});
test("unsupported rich text fails rather than losing formatting silently", () => {
  const changed = structuredClone(queried.profile);
  changed.introduction[0].children[0].marks = ["strong"];
  assert.throws(() => adapters.mapProfile(changed, assetBase), policy.PublicContentError);
});
test("contact missing required public fields or unsafe links fails explicitly", () => {
  for (const change of [{ phone: null }, { email: "invalid" }, { facebookUrl: "javascript:alert(1)" }, { officeHours: [] }]) {
    assert.throws(() => adapters.mapContact({ ...queried.settings, ...change }), policy.PublicContentError);
  }
});
for (const error of [{ statusCode: 408 }, { statusCode: 429 }, { statusCode: 503 }, { code: "ECONNRESET" }, { name: "TimeoutError" }, new TypeError("fetch failed")]) {
  test(`temporary failure ${error.statusCode ?? error.code ?? error.name}: approved local fallback and one warning`, async () => {
    const warnings = [];
    const result = await policy.readWithFallback("test", async () => { throw error; }, () => assert.fail("adapter must not run"), () => "local", (warning) => warnings.push(warning));
    assert.equal(result, "local"); assert.equal(warnings.length, 1);
  });
}
for (const error of [{ statusCode: 400 }, { statusCode: 401 }, { statusCode: 403 }, { statusCode: 404 }, new Error("configuration"), new policy.PublicContentError("invalid data")]) {
  test(`non-temporary ${error.statusCode ?? error.message}: never falls back`, async () => {
    await assert.rejects(policy.readWithFallback("test", async () => { throw error; }, (value) => value, () => assert.fail("fallback must not run")), (caught) => caught === error);
  });
}
test("adapter mismatches are never caught by the transport fallback", async () => {
  await assert.rejects(policy.readWithFallback("profile", async () => null, (value) => adapters.mapProfile(value, assetBase), () => assert.fail("fallback must not run")), policy.PublicContentError);
});
