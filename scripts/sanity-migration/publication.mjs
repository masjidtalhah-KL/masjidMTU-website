import { canonical, equal, EXPECTED, hash, resolveImages, TARGET } from "./plan.mjs";
import { analyseDataset, inspectDataset, validateSnapshot } from "./dataset.mjs";

export const APPROVED_PLAN = "cbe642f6bdc5265705dbe6079d64dfa2243c83f369a1f32690a5cf83ee30cbae";
// Exact raw fingerprints of the approved working-copy bytes and Git HEAD archive.
// All document/asset payloads match; the 16 schema-file differences are CRLF/LF
// only. Do not normalize or accept arbitrary schema hashes at publication time.
export const CHECKPOINT_PLANS = Object.freeze([APPROVED_PLAN, "f8463e89c8e599ec31b8522995e059c10b05749838f69e4576915e6d83f53569"]);
export const publicationDigest = (approval) => hash(JSON.stringify(canonical(Object.fromEntries(Object.entries(approval).filter(([key]) => key !== "fingerprint")))));

export function assertApproval(plan, approval) {
  if (!CHECKPOINT_PLANS.includes(plan.fingerprint) || approval.planFingerprint !== APPROVED_PLAN || !equal(approval.sourcePlanFingerprints, CHECKPOINT_PLANS) || !equal(approval.target, TARGET)) throw new Error("Pelan/target bukan checkpoint 4.3B yang diluluskan.");
  const actualPlan = hash(JSON.stringify(canonical({ documents: plan.documents, assets: plan.assets, schemaHash: plan.schemaHash, target: plan.target })));
  if (actualPlan !== plan.fingerprint) throw new Error("Payload pelan berubah selepas fingerprint dibuat.");
  if (plan.errors.length || plan.missing.length || plan.collisions.length) throw new Error("Pelan sumber tidak sah.");
  if (approval.fingerprint !== publicationDigest(approval)) throw new Error("Manifest publication berubah.");
  const scope = plan.documents.map(({ _id, _type }) => ({ publishedId: _id, draftId: "drafts." + _id, type: _type })).sort((a, b) => a.publishedId.localeCompare(b.publishedId));
  const approvedScope = approval.documents.map(({ publishedId, draftId, type }) => ({ publishedId, draftId, type })).sort((a, b) => a.publishedId.localeCompare(b.publishedId));
  if (scope.length !== 43 || !equal(scope, approvedScope) || approval.documents.some((doc) => !doc.draftRevision)) throw new Error("Manifest mesti tepat 43 ID/type/revisi yang diluluskan.");
  for (const [type, count] of Object.entries(EXPECTED)) if (scope.filter((doc) => doc.type === type).length !== count) throw new Error("Bilangan type tidak diluluskan.");
  if (approval.assets.length !== 50 || new Set(approval.assets.map((asset) => asset._id)).size !== 50) throw new Error("Manifest aset mesti tepat 50 ID unik.");
}

export function stateCounts(snapshot, approval) {
  const ids = new Set(approval.documents.map((doc) => doc.publishedId));
  const drafts = new Set(approval.documents.map((doc) => doc.draftId));
  const published = snapshot.inventory.filter((doc) => ids.has(doc._id));
  return {
    total: snapshot.total,
    targetDrafts: snapshot.inventory.filter((doc) => drafts.has(doc._id)).length,
    targetPublished: published.length,
    imageAssets: snapshot.inventory.filter((doc) => doc._type === "sanity.imageAsset").length,
    publishedTypes: Object.fromEntries(Object.keys(EXPECTED).map((type) => [type, published.filter((doc) => doc._type === type).length])),
  };
}

export function reviewPublication(plan, snapshot, approval) {
  assertApproval(plan, approval);
  validateSnapshot(snapshot, plan);
  const dataset = analyseDataset(plan, snapshot);
  if (dataset.conflicts.length || dataset.actions.length !== 43 || dataset.actions.some((item) => item.action !== "skip-identical")) throw new Error("Draft/published hilang atau kandungan berbeza; tiada repair/overwrite dibenarkan.");
  const counts = stateCounts(snapshot, approval);
  const targetIds = new Set(approval.documents.flatMap((doc) => [doc.publishedId, doc.draftId]));
  const unrelated = snapshot.inventory.filter((doc) => !targetIds.has(doc._id)).sort((a, b) => a._id.localeCompare(b._id));
  if (!equal(unrelated, approval.unrelatedInventory)) throw new Error("Inventory bukan sasaran berubah atau kandungan tambahan wujud.");
  const assets = snapshot.assets.map(({ _id, _type, sha1hash, size, mimeType }) => ({ _id, _type, sha1hash, size, mimeType })).sort((a, b) => a._id.localeCompare(b._id));
  if (counts.imageAssets !== 50 || dataset.reusedAssets !== 50 || !equal(assets, approval.assets)) throw new Error("50 aset diluluskan tidak sepadan/tersedia.");
  let state;
  if (counts.targetDrafts === 43 && counts.targetPublished === 0) {
    state = "ready";
    for (const approved of approval.documents) {
      const draft = snapshot.documents.find((doc) => doc._id === approved.draftId);
      const item = snapshot.inventory.find((doc) => doc._id === approved.draftId);
      if (draft?._rev !== approved.draftRevision || item?._rev !== draft._rev || item?._type !== draft._type) throw new Error("Revisi draft berubah: " + approved.draftId);
    }
  } else if (counts.targetPublished === 43 && counts.targetDrafts === 0) {
    state = "already-published-identical";
    for (const approved of approval.documents) {
      const document = snapshot.documents.find((doc) => doc._id === approved.publishedId);
      const item = snapshot.inventory.find((doc) => doc._id === approved.publishedId);
      if (!document?._rev || item?._rev !== document._rev || item?._type !== document._type) throw new Error("Published snapshot tidak konsisten: " + approved.publishedId);
    }
  } else throw new Error("Keadaan partial/mixed publication; STOP tanpa mutation.");
  const documents = plan.documents.map((doc) => resolveImages(doc, dataset.assetIds));
  const references = [];
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") {
      if (value._type === "reference" && value._ref?.startsWith("image-")) references.push(value._ref);
      Object.values(value).forEach(visit);
    }
  };
  documents.forEach(visit);
  if (references.length !== 55 || new Set(references).size !== 50 || references.some((id) => !snapshot.assets.some((asset) => asset._id === id))) throw new Error("References imej tidak lengkap.");
  return { state, sourcePlanFingerprint: plan.fingerprint, observedAt: snapshot.observedAt, visibility: snapshot.visibility, counts, conflicts: 0, identicalTargets: 43, imageReferences: references.length, uniqueReferencedAssets: new Set(references).size, documents };
}

export function publicationActions(approval) {
  // Installed @sanity/client CreateAction rejects an existing published version.
  // ignore leaves each existing draft intact. In the SAME atomic transaction,
  // publish revision guards reject a removed/recreated/edited draft. These guards
  // create nothing in the approved state and close the read-to-publish race.
  const absenceGuards = approval.documents.map((doc) => ({
    actionType: "sanity.action.document.create", publishedId: doc.publishedId,
    attributes: { _id: doc.draftId, _type: doc.type }, ifExists: "ignore",
  }));
  const publish = approval.documents.map((doc) => ({
    actionType: "sanity.action.document.publish", publishedId: doc.publishedId,
    draftId: doc.draftId, ifDraftRevisionId: doc.draftRevision,
  }));
  return [...absenceGuards, ...publish];
}

function assertActionResult(result) {
  if (!result?.transactionId || (result.results && result.results.some((item) => item.status === "error" || item.error))) throw new Error("Actions API tidak mengesahkan kejayaan; inspect semula, jangan retry mutation secara automatik.");
}

export async function publishApproved({ client, plan, approval, confirm, approvePlan, approvePublication, transactionId, audit, validate, inspect = inspectDataset }) {
  // Guards are also enforced here, not only by the CLI.
  if (confirm !== TARGET.projectId + "/" + TARGET.dataset || approvePlan !== APPROVED_PLAN || approvePublication !== approval.fingerprint || !/^[a-zA-Z0-9_-]+$/.test(transactionId || "") || typeof audit !== "function" || typeof validate !== "function") throw new Error("Pengesahan target/set/transaction ID/audit/validation diperlukan; tiada mutation.");
  const config = client.config();
  if (config.projectId !== TARGET.projectId || config.dataset !== TARGET.dataset || config.apiVersion !== TARGET.apiVersion || config.perspective !== "raw" || config.useCdn || !config.token || config.maxRetries !== 0) throw new Error("Client publication mesti authenticated, target tepat, raw, tanpa CDN/retry.");
  let before = await inspect(client, plan);
  let review = reviewPublication(plan, before, approval);
  const validation = await validate(plan, review.documents.map((doc) => ({ ...doc, _id: review.state === "ready" ? "drafts." + doc._id : doc._id })), client);
  if (validation.errors.length) throw new Error("Schema/reference validation gagal; tiada mutation.");
  await audit("before", { snapshot: before, review, validation });
  if (review.state === "already-published-identical") {
    const result = { status: "verified-already-published", executedPublication: false, skippedIdentical: 43, after: review };
    await audit("result", result);
    return result;
  }
  const actions = publicationActions(approval);
  // Validate all action semantics with the server without saving any result.
  const dryRun = await client.action(actions, { dryRun: true });
  assertActionResult(dryRun);
  await audit("api-dry-run", { at: new Date().toISOString(), persisted: false, transactionId: dryRun.transactionId, actionCount: actions.length });
  before = await inspect(client, plan);
  review = reviewPublication(plan, before, approval);
  if (review.state !== "ready") throw new Error("Dataset berubah selepas API dry-run; tiada publication.");
  await audit("request", { transactionId, requestedAt: new Date().toISOString(), before, actions });
  // One atomic action call, with no application or SDK mutation retries.
  const response = await client.action(actions, { transactionId });
  await audit("response", { receivedAt: new Date().toISOString(), transactionId: response?.transactionId, statuses: response?.results?.map((item) => item.status) });
  assertActionResult(response);
  if (response.transactionId !== transactionId) throw new Error("Transaction ID response tidak sepadan; inspect remote, tiada retry automatik.");
  const afterSnapshot = await inspect(client, plan);
  // Save the observed counts even if a postcondition detects editor activity.
  await audit("after-snapshot", { snapshot: afterSnapshot, counts: stateCounts(afterSnapshot, approval) });
  const after = reviewPublication(plan, afterSnapshot, approval);
  if (after.state !== "already-published-identical") throw new Error("Post-publication belum sepadan; inspect semula, tiada rollback/retry automatik.");
  const result = { status: "published-and-verified", executedPublication: true, transactionId: response.transactionId, publicationAcknowledgedAt: new Date().toISOString(), published: 43, skippedIdentical: 0, after };
  await audit("result", result);
  return result;
}
