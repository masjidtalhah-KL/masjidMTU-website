import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { buildPlan, canonical, hash, resolveImages, ROOT, TARGET } from "./plan.mjs";
import { APPROVED_PLAN, CHECKPOINT_PLANS, assertApproval, publicationActions, publicationDigest, publishApproved, reviewPublication } from "./publication.mjs";
import { parsePublicationOptions } from "./publication-cli.mjs";

const currentPlan = await buildPlan();
// Publication 4.3 is immutable historical evidence. Verify the exact tagged LF bytes,
// then reconstruct the separately locked CRLF test fixture. This conversion is test-only;
// production CLI still hashes current raw bytes and never normalizes approval fingerprints.
const checkpoint = "phase-4.3c-controlled-publication";
const schemaPaths = execFileSync("git", ["ls-tree", "-r", "--name-only", checkpoint, "src/sanity/schemaTypes"], { cwd: ROOT, encoding: "utf8" }).trim().split("\n").filter((file) => file.endsWith(".ts")).sort();
assert.equal(schemaPaths.length, 16);
const historicalFiles = schemaPaths.map((file) => ({ name: file.split("/").at(-1), bytes: execFileSync("git", ["show", checkpoint + ":" + file], { cwd: ROOT }) }));
assert.equal(hash(historicalFiles.map(({ name, bytes }) => name + ":" + hash(bytes)).join("\n")), "b41ca23623dbf7094e0a15221874afa1f82ee547ecc1049432cdbad2a15996c6");
const schemaHash = hash(historicalFiles.map(({ name, bytes }) => name + ":" + hash(bytes.toString("utf8").replace(/\n/g, "\r\n"))).join("\n"));
assert.equal(schemaHash, "abfe970927799477132eabbf7ca16fc6326b906343cb96b4332fe2b596ac0b7a");
const plan = { ...currentPlan, schemaHash };
plan.fingerprint = hash(JSON.stringify(canonical({ documents: plan.documents, assets: plan.assets, schemaHash, target: plan.target })));
const approval = JSON.parse(await readFile(new URL("./approved-publication.json", import.meta.url), "utf8"));
const assetIds = Object.fromEntries(plan.assets.map((asset) => [asset.assetId, approval.assets.find((item) => item.sha1hash === asset.sha1)._id]));
const drafts = plan.documents.map((doc) => ({ ...resolveImages(doc, assetIds), _id: "drafts." + doc._id, _rev: approval.documents.find((item) => item.publishedId === doc._id).draftRevision }));
const snapshotFor = (documents = drafts) => ({
  ...TARGET, perspective: "raw", complete: true, visibility: "in-memory tests only", observedAt: "2026-10-02T09:00:00Z",
  total: approval.unrelatedInventory.length + documents.length,
  documents: structuredClone(documents), assets: structuredClone(approval.assets),
  inventory: [...structuredClone(approval.unrelatedInventory), ...documents.map(({ _id, _type, _rev }) => ({ _id, _type, _rev }))],
});
const published = () => drafts.map((doc) => ({ ...doc, _id: doc._id.slice(7), _rev: "published-revision" }));
const successfulValidation = async () => ({ errors: [], warnings: [] });
const options = { confirm: "2o95jmms/production", approvePlan: APPROVED_PLAN, approvePublication: approval.fingerprint, transactionId: "test-publication-transaction" };
const config = { ...TARGET, useCdn: false, perspective: "raw", token: "in-memory-test-only", maxRetries: 0 };

// The fake models the installed client's documented create-ignore/publish semantics,
// including atomic rollback and revision conflicts. It never contacts Sanity.
function harness({ before = snapshotFor(), race, dryRunFails = false, responseLost = false, auditFails = false, postDrift = false } = {}) {
  let state = structuredClone(before);
  let inspections = 0;
  const calls = [];
  const auditRecords = [];
  const client = {
    config: () => config,
    action: async (actions, actionOptions) => {
      calls.push(structuredClone({ actions, options: actionOptions }));
      if (actionOptions.dryRun && dryRunFails) throw new Error("server dry-run failure");
      const original = structuredClone(state);
      if (!actionOptions.dryRun && race) state = race(state);
      const changed = structuredClone(state.documents);
      for (const action of actions) {
        if (action.actionType === "sanity.action.document.create") {
          if (changed.some((doc) => doc._id === action.publishedId)) throw new Error("published version already exists");
          if (!changed.some((doc) => doc._id === action.attributes._id)) changed.push({ ...action.attributes, _rev: "new-draft-revision" });
        } else if (action.actionType === "sanity.action.document.publish") {
          const draft = changed.find((doc) => doc._id === action.draftId);
          if (!draft || draft._rev !== action.ifDraftRevisionId) throw new Error("draft revision conflict");
          changed.splice(changed.indexOf(draft), 1);
          changed.push({ ...draft, _id: action.publishedId, _rev: "published-revision" });
        } else throw new Error("unsupported action");
      }
      if (actionOptions.dryRun) state = original;
      else {
        state = snapshotFor(changed);
        if (postDrift) { state.documents[0].editorNote = "concurrent editor"; }
        if (responseLost) throw new Error("response lost after server success");
      }
      return { transactionId: actionOptions.transactionId || "dry-run-transaction", results: actions.map(() => ({ status: "success" })) };
    },
  };
  return {
    client, calls, auditRecords, state: () => state,
    inspect: async () => { inspections++; return structuredClone(state); },
    inspections: () => inspections,
    audit: async (stage, value) => { if (auditFails && stage === "request") throw new Error("audit unavailable"); auditRecords.push({ stage, value }); },
  };
}
const run = (mock, overrides = {}) => publishApproved({ ...options, client: mock.client, plan, approval, audit: mock.audit, validate: successfulValidation, inspect: mock.inspect, ...overrides });

test("current schema changes cannot reuse historical 4.3 publication approval", () => {
  assert.throws(() => assertApproval(currentPlan, approval), /checkpoint 4.3B/);
});

test("approval binds the exact checkpoint, 43 IDs/types/revisions and 50 actual assets", () => {
  assertApproval(plan, approval);
  assert.equal(approval.fingerprint, publicationDigest(approval));
  const review = reviewPublication(plan, snapshotFor(), approval);
  assert.equal(review.state, "ready");
  assert.deepEqual([review.counts.targetDrafts, review.counts.targetPublished, review.counts.imageAssets, review.imageReferences, review.uniqueReferencedAssets], [43, 0, 50, 55, 50]);
  const changed = structuredClone(plan); changed.documents[0].mosqueName = "altered after hash";
  assert.throws(() => assertApproval(changed, approval));
  const manifest = structuredClone(approval); manifest.documents[0].draftRevision = "altered";
  assert.throws(() => assertApproval(plan, manifest));
});

test("CLI defaults to read-only and rejects missing confirmations, snapshots, ambiguous modes and unsafe audit locations", () => {
  assert.equal(parsePublicationOptions([]).publish, false);
  assert.equal(parsePublicationOptions(["--dataset-snapshot", "snapshot.json"]).publish, false);
  const args = ["--publish", "--confirm-production", options.confirm, "--approve-plan", options.approvePlan, "--approve-publication", options.approvePublication, "--audit-dir", "../publication-audit"];
  assert.equal(parsePublicationOptions(args).publish, true);
  for (const bad of [["--publish"], [...args, "--dataset-snapshot", "snapshot.json"], [...args, "--preflight"], ["--publish-all"], ["--audit-dir", "docs/audit"], ["--preflight", "--preflight"], ["--audit-dir"]]) assert.throws(() => parsePublicationOptions(bad));
});

test("only the separately verified exact LF checkpoint fingerprint is also accepted", () => {
  const lf = structuredClone(plan);
  lf.schemaHash = "abfe970927799477132eabbf7ca16fc6326b906343cb96b4332fe2b596ac0b7a";
  lf.fingerprint = CHECKPOINT_PLANS[1];
  assert.equal(reviewPublication(lf, snapshotFor(), approval).state, "ready");
  lf.schemaHash = "arbitrary-schema-change";
  assert.throws(() => assertApproval(lf, approval));
});

test("missing target/set confirmation or unsafe client cannot issue even an API dry-run", async () => {
  for (const overrides of [{ confirm: undefined }, { approvePlan: "wrong" }, { approvePublication: "wrong" }, { audit: undefined }, { validate: undefined }]) {
    const mock = harness(); await assert.rejects(run(mock, overrides)); assert.equal(mock.calls.length, 0);
  }
  for (const unsafe of [{ projectId: "other" }, { dataset: "other" }, { apiVersion: "2020-01-01" }, { useCdn: true }, { perspective: "published" }, { token: undefined }, { maxRetries: 5 }]) {
    const mock = harness(); mock.client.config = () => ({ ...config, ...unsafe });
    await assert.rejects(run(mock)); assert.equal(mock.calls.length, 0);
  }
});

test("transaction IDs reject the dot that caused the safe Linux HTTP 400 failure", async () => {
  for (const transactionId of ["mtu-4.3c-invalid", "with space", "", undefined]) {
    const mock = harness(); await assert.rejects(run(mock, { transactionId }));
    assert.equal(mock.calls.length, 0);
  }
  const mock = harness(); const result = await run(mock, { transactionId: "mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb" });
  assert.equal(result.published, 43);
});

test("missing draft, changed content/revision and unexpected editorial content fail before publication", async () => {
  const missing = snapshotFor(drafts.slice(1));
  const changed = snapshotFor(); changed.documents[0].editorNote = "preserve edit";
  const revision = snapshotFor(); revision.documents[0]._rev = "edited-revision"; revision.inventory.find((doc) => doc._id === revision.documents[0]._id)._rev = "edited-revision";
  const unexpected = snapshotFor([...drafts, { _id: "drafts.news-extra", _type: "newsPost", _rev: "extra" }]);
  for (const before of [missing, changed, revision, unexpected]) {
    const mock = harness({ before }); await assert.rejects(run(mock)); assert.equal(mock.calls.length, 0);
  }
});

test("wrong/incomplete/duplicate inventory and missing/changed assets fail closed", () => {
  const badAssets = snapshotFor(); badAssets.assets[0].size++;
  const badInventory = snapshotFor(); badInventory.inventory[0]._rev = "modified-system-or-asset";
  const duplicate = snapshotFor(); duplicate.inventory.push(duplicate.inventory[0]); duplicate.total++;
  const missing = snapshotFor(); missing.assets.pop();
  for (const snapshot of [{ ...snapshotFor(), dataset: "other" }, { ...snapshotFor(), complete: false }, duplicate, badAssets, badInventory, missing]) assert.throws(() => reviewPublication(plan, snapshot, approval));
});

test("partial or mixed publication stops; complete identical publication verifies without any action", async () => {
  const partial = snapshotFor([published()[0], ...drafts.slice(1)]);
  const mixed = snapshotFor([...published(), ...drafts]);
  for (const before of [partial, mixed]) {
    const mock = harness({ before }); await assert.rejects(run(mock)); assert.equal(mock.calls.length, 0);
  }
  const complete = harness({ before: snapshotFor(published()) });
  const result = await run(complete);
  assert.equal(result.status, "verified-already-published"); assert.equal(result.executedPublication, false);
  assert.equal(result.skippedIdentical, 43); assert.equal(complete.calls.length, 0);
});

test("server dry-run, schema failure and unavailable audit stop before persisted publication", async () => {
  const schema = harness(); await assert.rejects(run(schema, { validate: async () => ({ errors: [{ message: "invalid" }] }) })); assert.equal(schema.calls.length, 0);
  const dry = harness({ dryRunFails: true }); await assert.rejects(run(dry)); assert.equal(dry.calls.length, 1); assert.equal(dry.calls[0].options.dryRun, true);
  const audit = harness({ auditFails: true }); await assert.rejects(run(audit)); assert.equal(audit.calls.length, 1); assert.equal(audit.state().documents.length, 43);
});

test("exact approved drafts publish atomically once and audit actual resulting counts/references", async () => {
  const mock = harness(); const result = await run(mock);
  assert.equal(result.status, "published-and-verified"); assert.equal(result.published, 43);
  assert.deepEqual(result.after.counts.publishedTypes, { siteSettings: 1, profilePage: 1, organisationMember: 25, surau: 15, galleryCollection: 1 });
  assert.equal(result.after.counts.targetDrafts, 0); assert.equal(result.after.imageReferences, 55);
  assert.equal(mock.calls.length, 2); assert.equal(mock.calls[0].options.dryRun, true);
  assert.deepEqual(mock.calls[1].options, { transactionId: options.transactionId });
  assert.deepEqual(mock.calls[1].actions, publicationActions(approval));
  assert.equal(mock.calls[1].actions.filter((action) => action.actionType === "sanity.action.document.publish").length, 43);
  assert.deepEqual(mock.auditRecords.map((record) => record.stage), ["before", "api-dry-run", "request", "response", "after-snapshot", "result"]);
  assert.deepEqual(mock.state().inventory.filter((item) => !approval.documents.some((doc) => doc.publishedId === item._id)).sort((a, b) => a._id.localeCompare(b._id)), approval.unrelatedInventory);
  const rerun = harness({ before: mock.state() }); await run(rerun); assert.equal(rerun.calls.length, 0);
});

test("concurrent published document cannot be silently overwritten by the atomic absence guards", async () => {
  const mock = harness({ race: (state) => snapshotFor([...state.documents, { ...published()[0], editorNote: "preserve published editor change" }]) });
  await assert.rejects(run(mock), /already exists/);
  assert.equal(mock.calls.length, 2);
  assert.equal(mock.state().documents.filter((doc) => doc._id.startsWith("drafts.")).length, 43);
  assert.equal(mock.state().documents.find((doc) => doc._id === published()[0]._id).editorNote, "preserve published editor change");
});

test("concurrent removed/recreated/edited draft rolls back the entire action transaction", async () => {
  for (const race of [
    (state) => snapshotFor(state.documents.slice(1)),
    (state) => { state.documents[0]._rev = "new-editor-revision"; state.documents[0].editorNote = "keep"; return snapshotFor(state.documents); },
  ]) {
    const mock = harness({ race }); await assert.rejects(run(mock), /revision conflict/);
    assert.equal(mock.state().documents.filter((doc) => !doc._id.startsWith("drafts.")).length, 0);
  }
});

test("lost publication response is not retried; a subsequent authenticated inspect can verify success", async () => {
  const mock = harness({ responseLost: true }); await assert.rejects(run(mock), /response lost/);
  assert.equal(mock.calls.length, 2); assert.equal(reviewPublication(plan, mock.state(), approval).counts.targetPublished, 43);
  const verify = harness({ before: mock.state() }); await run(verify); assert.equal(verify.calls.length, 0);
});

test("post-publication drift records observed counts then stops without rollback or another mutation", async () => {
  const mock = harness({ postDrift: true }); await assert.rejects(run(mock));
  assert.equal(mock.calls.length, 2);
  assert.equal(mock.auditRecords.at(-1).stage, "after-snapshot");
  assert.equal(mock.auditRecords.at(-1).value.counts.targetPublished, 43);
});
