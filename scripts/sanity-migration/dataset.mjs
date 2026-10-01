import { TARGET, equal, resolveImages } from "./plan.mjs";

export function validateSnapshot(snapshot, plan) {
  if (!snapshot || snapshot.projectId !== TARGET.projectId || snapshot.dataset !== TARGET.dataset || snapshot.perspective !== "raw" || snapshot.complete !== true) throw new Error("Snapshot mesti lengkap, raw, dan daripada project/dataset yang betul.");
  if (!snapshot.observedAt || !Array.isArray(snapshot.inventory) || !Array.isArray(snapshot.documents) || !Array.isArray(snapshot.assets) || snapshot.total !== snapshot.inventory.length) throw new Error("Snapshot inventory tidak lengkap.");
  const ids = new Set(plan.documents.flatMap((doc) => [doc._id, "drafts." + doc._id]));
  const details = new Set(snapshot.documents.map((doc) => doc._id));
  for (const item of snapshot.inventory) if ((ids.has(item._id) || ["siteSettings", "profilePage", "galleryCollection"].includes(item._type)) && !details.has(item._id)) throw new Error("Snapshot tiada payload untuk semakan konflik: " + item._id);
  if (new Set(snapshot.inventory.map((doc) => doc._id)).size !== snapshot.total) throw new Error("Snapshot inventory mengandungi ID duplicate.");
  return snapshot;
}
async function pages(client, filter, params, projection) {
  const values = [];
  let after = "";
  for (;;) {
    const page = await client.fetch("*[(" + filter + ") && _id > $after] | order(_id asc)[0...500]" + projection, { ...params, after });
    values.push(...page);
    if (page.length < 500) return values;
    after = page.at(-1)._id;
  }
}

export async function inspectDataset(client, plan) {
  const config = client.config();
  if (config.projectId !== TARGET.projectId || config.dataset !== TARGET.dataset || config.useCdn || config.perspective !== "raw") throw new Error("Client preflight mesti target tepat, raw dan tanpa CDN.");
  const ids = plan.documents.flatMap((doc) => [doc._id, "drafts." + doc._id]);
  const [inventory, documents, assets] = await Promise.all([
    pages(client, "true", {}, "{_id, _type, _rev}"),
    pages(client, '_id in $ids || _type in ["siteSettings", "profilePage", "galleryCollection"]', { ids }, ""),
    pages(client, '_type == "sanity.imageAsset" && sha1hash in $hashes', { hashes: plan.assets.map((asset) => asset.sha1).filter(Boolean) }, "{_id, _type, sha1hash, size, mimeType}"),
  ]);
  return validateSnapshot({ projectId: TARGET.projectId, dataset: TARGET.dataset, perspective: "raw", complete: true, visibility: "current client permissions", observedAt: new Date().toISOString(), total: inventory.length, inventory, documents, assets }, plan);
}

function content(document) {
  return Object.fromEntries(Object.entries(document).filter(([key]) => !["_rev", "_createdAt", "_updatedAt"].includes(key)));
}

export function analyseDataset(plan, snapshot) {
  if (!snapshot) return { inspected: false, conflicts: [], actions: [], assetIds: {}, reusedAssets: 0 };
  validateSnapshot(snapshot, plan);
  const counts = {};
  for (const item of snapshot.inventory) counts[item._type] = (counts[item._type] || 0) + 1;
  const assetIds = {};
  const conflicts = [];
  for (const asset of plan.assets) {
    const matches = snapshot.assets.filter((item) => item.sha1hash === asset.sha1).sort((a, b) => a._id.localeCompare(b._id));
    if (matches.length) {
      if (matches[0].size !== asset.size) conflicts.push({ id: matches[0]._id, reason: "SHA-1 aset sepadan tetapi saiz berbeza." });
      else assetIds[asset.assetId] = matches[0]._id;
    }
  }
  const ids = new Set(plan.documents.flatMap((doc) => [doc._id, "drafts." + doc._id]));
  const actions = [];
  for (const candidate of plan.documents) {
    const current = snapshot.documents.filter((doc) => doc._id === candidate._id || doc._id === "drafts." + candidate._id);
    if (!current.length) { actions.push({ documentId: candidate._id, action: "create-draft" }); continue; }
    let matched = true;
    for (const existing of current) {
      try {
        const expected = { ...resolveImages(candidate, assetIds), _id: existing._id };
        if (!equal(content(existing), expected)) { matched = false; conflicts.push({ id: existing._id, reason: "Dokumen sedia ada berbeza atau mempunyai medan editor tambahan; tidak ditindih." }); }
      } catch { matched = false; conflicts.push({ id: existing._id, reason: "Dokumen sedia ada tidak dapat dipadankan dengan semua aset sumber." }); }
    }
    actions.push({ documentId: candidate._id, action: matched ? "skip-identical" : "conflict" });
  }
  for (const existing of snapshot.documents) {
    if (ids.has(existing._id)) continue;
    if (["siteSettings", "profilePage"].includes(existing._type)) conflicts.push({ id: existing._id, reason: "Singleton wujud pada ID lain; review diperlukan." });
    if (existing._type === "galleryCollection" && existing.slug?.current === "interior-masjid") conflicts.push({ id: existing._id, reason: "Slug galeri digunakan oleh dokumen lain; review diperlukan." });
  }
  return { inspected: true, observedAt: snapshot.observedAt, visibility: snapshot.visibility, total: snapshot.total, counts, conflicts, actions, assetIds, reusedAssets: Object.keys(assetIds).length };
}

export async function writeDrafts(client, plan, validation, inspect = inspectDataset) {
  // This function is only called after explicit CLI approval checks. Never replace/patch/delete.
  if (validation.errors.length) throw new Error("Validation gagal; tiada upload/write dibenarkan.");
  let state = analyseDataset(plan, await inspect(client, plan));
  if (state.conflicts.length) throw new Error("Konflik dataset; tiada upload/write dibenarkan.");
  const assetIds = { ...state.assetIds };
  const { readFile } = await import("node:fs/promises");
  const { default: path } = await import("node:path");
  const { ROOT, hash } = await import("./plan.mjs");
  const checkedBytes = new Map();
  for (const asset of plan.assets) {
    // Check bytes before any upload. An approved plan must not drift after preflight.
    const bytes = await readFile(path.join(ROOT, asset.localPath));
    if (hash(bytes) !== asset.sha256) throw new Error("Fail aset berubah selepas preflight: " + asset.localPath);
    checkedBytes.set(asset.assetId, bytes);
  }
  for (const asset of plan.assets) {
    if (assetIds[asset.assetId]) continue;
    const sameBytes = plan.assets.find((other) => other.sha1 === asset.sha1 && assetIds[other.assetId]);
    if (sameBytes) { assetIds[asset.assetId] = assetIds[sameBytes.assetId]; continue; }
    const uploaded = await client.assets.upload("image", checkedBytes.get(asset.assetId), { filename: path.basename(asset.localPath) });
    assetIds[asset.assetId] = uploaded._id;
  }
  const documents = plan.documents.map((doc) => ({ ...resolveImages(doc, assetIds), _id: "drafts." + doc._id }));
  const { validatePlan } = await import("./validation.mjs");
  const resolved = await validatePlan(plan, documents, client);
  if (resolved.errors.length) throw new Error("Validation reference sebenar gagal; dokumen tidak ditulis. Aset yang telah diupload tidak dipadam.");
  // Refresh after uploads. Atomic create rejects a concurrent editor/create; no silent upsert.
  state = analyseDataset(plan, await inspect(client, plan));
  if (state.conflicts.length) throw new Error("Dataset berubah/konflik selepas upload; dokumen tidak ditulis. Aset tidak dipadam.");
  const createIds = new Set(state.actions.filter((action) => action.action === "create-draft").map((action) => "drafts." + action.documentId));
  let transaction = client.transaction();
  for (const document of documents) if (createIds.has(document._id)) transaction = transaction.create(document);
  if (createIds.size) await transaction.commit({ visibility: "sync" });
  return { createdDrafts: createIds.size, skippedIdentical: documents.length - createIds.size };
}
