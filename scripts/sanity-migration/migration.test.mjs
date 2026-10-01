import assert from "node:assert/strict";
import test from "node:test";
import { of } from "rxjs";
import { buildPlan, loadSources, TARGET, resolveImages, hash } from "./plan.mjs";
import { validatePlan } from "./validation.mjs";
import { analyseDataset, validateSnapshot, writeDrafts } from "./dataset.mjs";
import { parseOptions } from "./cli.mjs";

const sources = await loadSources();
const plan = await buildPlan(sources);
const validation = await validatePlan(plan);
const empty = () => ({ ...TARGET, perspective: "raw", complete: true, observedAt: "2026-10-01T00:00:00Z", visibility: "in-memory test", total: 0, inventory: [], documents: [], assets: [] });
const snapshotFor = (documents, assets = []) => {
  const inventory = [...documents, ...assets].map(({ _id, _type }) => ({ _id, _type }));
  return { ...empty(), total: inventory.length, inventory, documents, assets };
};
const assetDocs = plan.assets.map((asset) => ({ _id: "image-" + asset.sha1 + "-" + asset.width + "x" + asset.height + "-" + (asset.format === "jpeg" ? "jpg" : asset.format), _type: "sanity.imageAsset", sha1hash: asset.sha1, size: asset.size }));
const assetIds = Object.fromEntries(plan.assets.map((asset, index) => [asset.assetId, assetDocs[index]._id]));
const seeded = plan.documents.map((doc) => ({ ...resolveImages(doc, assetIds), _id: "drafts." + doc._id, _rev: "editor-revision", _createdAt: "2026-10-01T00:00:00Z" }));

test("approved scope, counts, no homepage/lecture or brand uploads", () => {
  assert.equal(plan.documents.length, 43);
  assert.equal(plan.assets.length, 50);
  assert.equal(plan.assetUses.length, 55);
  assert.equal(plan.missing.length, 0);
  assert.deepEqual(validation.errors, []);
  assert.equal(plan.documents.filter((doc) => doc._type === "surau" && doc.category === "jumaat").length, 3);
  assert.equal(plan.documents.filter((doc) => doc._type === "surau" && doc.category === "biasa").length, 12);
  assert.ok(plan.documents.every((doc) => !["announcement", "program", "newsPost", "lectureMonth", "lectureRule", "lectureSpeaker"].includes(doc._type)));
  assert.ok(plan.assets.every((asset) => !asset.localPath.startsWith("public/brand/") && !asset.localPath.startsWith("public/lecture-demo/")));
});
test("exact profile paragraphs, contact/Instagram and optional short name", () => {
  const profile = plan.documents.find((doc) => doc._type === "profilePage");
  assert.deepEqual(profile.introduction.map((block) => block.children[0].text), sources.profile.introduction.paragraphs);
  assert.deepEqual(profile.logoRationale.map((block) => block.children[0].text), sources.profile.logo.paragraphs);
  assert.deepEqual(profile.spaceImages.map((media) => media.caption), sources.profile.spacePhotoIds.map((id) => sources.captions[id]));
  const settings = plan.documents[0];
  assert.equal(settings.instagramUrl, sources.contact.instagram.href);
  assert.equal(settings.address, sources.contact.addressLines.join("\n"));
  assert.equal(settings.shortName, undefined);
});
test("positions preserve vacancy, missing photo, roles, names and local order without deduplication", () => {
  const members = plan.documents.filter((doc) => doc._type === "organisationMember");
  assert.equal(members.length, 25);
  for (const source of sources.organisationSlots) {
    const document = members.find((doc) => doc._id === "organisationMember-" + source.id);
    assert.equal(document.role, source.role);
    assert.equal(document.group, source.groupId);
    assert.equal(document.displayOrder, source.order);
    assert.equal(document.name, source.name ?? undefined);
    assert.equal(document.employmentTitle, source.appointment ?? undefined);
    assert.equal(!!document.photo, !!source.photoId);
  }
  const vacancy = members.find((doc) => doc._id.endsWith("timbalan-pengerusi"));
  assert.equal(vacancy.isVacant, true);
  assert.equal(vacancy.name, undefined);
  assert.equal(vacancy.photo, undefined);
  const soffan = members.find((doc) => doc.name === "Soffan Affendi Bin Aminudin");
  assert.equal(soffan.isVacant, false);
  assert.equal(soffan.photo, undefined);
  assert.equal(members.filter((doc) => doc.name === "Nik Muhammad Fadlan Bin Nik Mahmood").length, 2);
});
test("gallery keys, captions and order match the approved 12 images", () => {
  const items = plan.documents.at(-1).items;
  const sorted = [...sources.galleryPhotos].sort((a, b) => a.order - b.order);
  assert.deepEqual(items.map((item) => item._key), sorted.map((item) => item.id));
  assert.deepEqual(items.map((item) => item.caption), sorted.map((item) => item.caption));
  assert.ok(!sorted.some((item) => item.sourceIndex === 18));
});
test("same inputs produce identical document IDs, array keys and plan fingerprint", async () => {
  const rerun = await buildPlan();
  assert.equal(rerun.fingerprint, plan.fingerprint);
  assert.deepEqual(rerun.documents, plan.documents);
});
test("no flag defaults to dry-run; typos, conflicting modes and incomplete write are rejected", () => {
  assert.equal(parseOptions([]).write, false);
  assert.equal(parseOptions(["--dry-run"]).write, false);
  for (const args of [["--write"], ["--write-drafts"], ["--write-drafts", "--dry-run"], ["--dry-run", "--dry-run"], ["--report"]]) assert.throws(() => parseOptions(args));
  assert.throws(() => parseOptions(["--report", "README.md"]));
});
test("write requires exact target and fingerprint; snapshots cannot authorize writes", () => {
  const approved = ["--write-drafts", "--confirm-production", "2o95jmms/production", "--approve-plan", plan.fingerprint];
  assert.equal(parseOptions(approved).write, true);
  assert.throws(() => parseOptions([...approved, "--dataset-snapshot", "snapshot.json"]));
  assert.throws(() => parseOptions(["--write-drafts", "--confirm-production", "other/production", "--approve-plan", plan.fingerprint]));
});
test("empty inspected dataset plans 43 draft creates; uninspected dataset is labelled unknown", () => {
  assert.equal(analyseDataset(plan, empty()).actions.filter((item) => item.action === "create-draft").length, 43);
  assert.equal(analyseDataset(plan).inspected, false);
});
test("all seeded drafts skip identically on rerun, reusing 50 asset references", () => {
  const result = analyseDataset(plan, snapshotFor(seeded, assetDocs));
  assert.equal(result.actions.filter((item) => item.action === "skip-identical").length, 43);
  assert.equal(result.reusedAssets, 50);
  assert.deepEqual(result.conflicts, []);
});
test("editor field changes, extra fields and published/draft divergence produce conflicts", () => {
  for (const document of [{ ...seeded[0], mosqueName: "Editor change" }, { ...seeded[0], editorNote: "Do not overwrite" }, { ...seeded[0], _type: "unexpectedType" }]) {
    assert.equal(analyseDataset(plan, snapshotFor([document], assetDocs)).conflicts.length, 1);
  }
  const published = { ...seeded[0], _id: "siteSettings", mosqueName: "Published editor change" };
  assert.equal(analyseDataset(plan, snapshotFor([seeded[0], published], assetDocs)).conflicts.length, 1);
});
test("unrelated records remain untouched; singleton/slug aliases conflict", () => {
  const unrelated = { _id: "editor-news", _type: "newsPost" };
  assert.deepEqual(analyseDataset(plan, snapshotFor([unrelated])).conflicts, []);
  for (const document of [{ _id: "another-settings", _type: "siteSettings" }, { _id: "another-gallery", _type: "galleryCollection", slug: { current: "interior-masjid" } }]) assert.equal(analyseDataset(plan, snapshotFor([document])).conflicts.length, 1);
});
test("wrong/incomplete snapshots, ID collisions and missing assets cannot pass", async () => {
  assert.throws(() => validateSnapshot({ ...empty(), dataset: "other" }, plan));
  assert.throws(() => validateSnapshot({ ...empty(), total: 1 }, plan));
  const incomplete = snapshotFor(seeded);
  incomplete.documents = [];
  assert.throws(() => validateSnapshot(incomplete, plan));
  const duplicate = structuredClone(sources);
  duplicate.organisationSlots.push(duplicate.organisationSlots[0]);
  assert.equal((await buildPlan(duplicate)).collisions.length, 1);
  const missing = structuredClone(sources);
  missing.publicAssets["interior-mihrab"].src = "/interior/does-not-exist.webp";
  const missingPlan = await buildPlan(missing);
  assert.equal(missingPlan.missing.length, 1);
  assert.ok((await validatePlan(missingPlan)).errors.length > 0);
});
test("actual schema rejects changed alt and profile content", async () => {
  const changed = structuredClone(plan);
  changed.documents[1].spaceImages[0].image.alt = "";
  changed.documents[1].introduction = [];
  const result = await validatePlan(changed);
  assert.ok(result.errors.some((error) => error.documentId === "profilePage"));
});
function memoryClient() {
  const storage = { documents: [], assets: [], uploads: 0, commits: 0 };
  const client = {
    config: () => ({ ...TARGET, useCdn: false, perspective: "raw" }), withConfig() { return this; },
    fetch: async () => true, observable: { fetch: () => of(true), request: () => of(true) },
    getDocument: async (id) => storage.assets.find((asset) => asset._id === id),
    assets: { upload: async (_type, bytes) => {
      storage.uploads++;
      const asset = assetDocs.find((item) => item.sha1hash === hash(bytes, "sha1"));
      storage.assets.push(asset);
      return asset;
    } },
    transaction: () => {
      const pending = [];
      const transaction = {
        create: (doc) => { pending.push(doc); return transaction; },
        commit: async () => {
          if (pending.some((doc) => storage.documents.some((existing) => existing._id === doc._id))) throw new Error("Concurrent create collision");
          storage.commits++;
          storage.documents.push(...pending);
        },
      };
      return transaction;
    },
  };
  const inspect = async () => snapshotFor(storage.documents, storage.assets);
  return { client, storage, inspect };
}
test("future write path is idempotent using an in-memory client only", async () => {
  const { client, storage, inspect } = memoryClient();
  assert.equal((await writeDrafts(client, plan, validation, inspect)).createdDrafts, 43);
  assert.equal(storage.uploads, 50);
  assert.equal(storage.commits, 1);
  assert.equal((await writeDrafts(client, plan, validation, inspect)).createdDrafts, 0);
  assert.equal(storage.uploads, 50);
  assert.equal(storage.documents.length, 43);
  assert.equal(storage.commits, 1);
  assert.ok(storage.documents.every((doc) => doc._id.startsWith("drafts.")));
});
test("conflict or failed validation aborts before any future upload/write", async () => {
  const { client, storage, inspect } = memoryClient();
  await assert.rejects(() => writeDrafts(client, plan, { errors: [{ message: "invalid" }] }, inspect));
  storage.documents.push({ _id: "drafts.siteSettings", _type: "siteSettings", mosqueName: "Editor" });
  await assert.rejects(() => writeDrafts(client, plan, validation, inspect), /Konflik/);
  assert.equal(storage.uploads, 0);
  assert.equal(storage.commits, 0);
});
test("new conflict after upload aborts document transaction and never deletes editor data", async () => {
  const { client, storage, inspect } = memoryClient();
  let calls = 0;
  const concurrentInspect = async () => {
    calls++;
    if (calls === 2) storage.documents.push({ _id: "drafts.siteSettings", _type: "siteSettings", mosqueName: "Concurrent editor" });
    return inspect();
  };
  await assert.rejects(() => writeDrafts(client, plan, validation, concurrentInspect), /Dataset berubah/);
  assert.equal(storage.commits, 0);
  assert.equal(storage.documents[0].mosqueName, "Concurrent editor");
});
