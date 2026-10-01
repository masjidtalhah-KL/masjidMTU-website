import path from "node:path";
import { createJiti } from "jiti";
import { createSchema, validateDocument } from "sanity";
import { of } from "rxjs";
import { ROOT } from "./plan.mjs";

export async function validatePlan(plan, documents = plan.documents, realClient) {
  const jiti = createJiti(import.meta.url, { fsCache: false, moduleCache: false });
  const { schemaTypes } = await jiti.import(path.join(ROOT, "src/sanity/schemaTypes/index.ts"));
  const schema = createSchema({ name: "approved-local-migration", types: schemaTypes });
  const pending = new Set(plan.assets.filter((asset) => asset.exists).map((asset) => "pending-image-" + asset.assetId));
  // Only known planned assets are accepted offline. Slug uniqueness is checked separately
  // against the raw dataset during preflight; offline validation cannot prove remote uniqueness.
  const offline = {
    fetch: async () => true, withConfig() { return this; },
    config: () => ({ projectId: "offline-only", dataset: "offline-only" }),
    observable: { fetch: () => of(true), request: () => of(true) },
  };
  const errors = [...plan.errors.map((message) => ({ message })), ...plan.collisions.map((id) => ({ message: "ID collision: " + id }))];
  const warnings = [];
  for (const document of documents) {
    const markers = await validateDocument({
      workspace: { schema, getClient: () => realClient || offline }, document,
      getDocumentExists: realClient
        ? async ({ id }) => !!(await realClient.getDocument(id))
        : async ({ id }) => pending.has(id),
      environment: "studio",
    });
    for (const marker of markers) (marker.level === "error" ? errors : warnings).push({ documentId: document._id, path: marker.path, message: marker.message });
  }
  for (const asset of plan.missing) errors.push({ message: "Aset hilang/tidak sah: " + asset.localPath });
  return { errors, warnings, documentsValidated: documents.length, references: realClient ? "remote read-only" : "planned placeholders only; remote availability not asserted" };
}
