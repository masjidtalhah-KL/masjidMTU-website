import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { createClient } from "@sanity/client";
import { of } from "rxjs";
import { buildPlan, ROOT, TARGET } from "./plan.mjs";
import { inspectDataset } from "./dataset.mjs";
import { validatePlan } from "./validation.mjs";
import { APPROVED_PLAN, publishApproved, reviewPublication } from "./publication.mjs";

const manifestPath = fileURLToPath(new URL("./approved-publication.json", import.meta.url));
const outsideRepo = (filename) => {
  const relative = path.relative(ROOT, path.resolve(filename));
  return relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative);
};

export function parsePublicationOptions(args) {
  const options = { publish: false };
  const names = { "--dataset-snapshot": "snapshot", "--confirm-production": "confirm", "--approve-plan": "approvePlan", "--approve-publication": "approvePublication", "--audit-dir": "auditDirectory" };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error("Flag berulang: " + flag);
    seen.add(flag);
    if (flag === "--publish") options.publish = true;
    else if (flag === "--preflight") continue;
    else if (names[flag]) {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error("Nilai diperlukan: " + flag);
      options[names[flag]] = value;
    } else throw new Error("Flag tidak dikenali: " + flag);
  }
  if (options.auditDirectory && !outsideRepo(options.auditDirectory)) throw new Error("Audit directory mesti di luar repo.");
  if (options.publish && (seen.has("--preflight") || options.snapshot || options.confirm !== "2o95jmms/production" || options.approvePlan !== APPROVED_PLAN || !/^[a-f0-9]{64}$/.test(options.approvePublication || "") || !options.auditDirectory)) throw new Error("Publication memerlukan target/pelan/set tepat dan audit directory; snapshot tidak boleh authorize publication.");
  if (!options.publish && (options.confirm || options.approvePlan || options.approvePublication)) throw new Error("Pengesahan publication tidak boleh digunakan dalam preflight.");
  return options;
}

export async function main(args = process.argv.slice(2)) {
  const options = parsePublicationOptions(args);
  const approval = JSON.parse(await readFile(manifestPath, "utf8"));
  if (options.publish && options.approvePublication !== approval.fingerprint) throw new Error("Approved publication fingerprint tidak sepadan.");
  nextEnv.loadEnvConfig(ROOT, false, { info() {}, error() {} });
  for (const [key, expected] of [["NEXT_PUBLIC_SANITY_PROJECT_ID", TARGET.projectId], ["NEXT_PUBLIC_SANITY_DATASET", TARGET.dataset], ["NEXT_PUBLIC_SANITY_API_VERSION", TARGET.apiVersion]]) if (process.env[key] && process.env[key] !== expected) throw new Error("Env target tidak sepadan: " + key);
  const token = options.publish ? process.env.SANITY_MIGRATION_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN || process.env.SANITY_MIGRATION_WRITE_TOKEN;
  if (!options.snapshot && !token) throw new Error("Credential authenticated setempat diperlukan; gunakan snapshot hanya untuk preflight. Tiada mutation.");
  let audit = async () => {};
  if (options.auditDirectory) {
    const directory = path.resolve(options.auditDirectory);
    const parent = await realpath(path.dirname(directory));
    if (!outsideRepo(path.join(parent, path.basename(directory)))) throw new Error("Lokasi sebenar audit mesti di luar repo.");
    await mkdir(directory); // Exclusive: an existing directory is never overwritten.
    audit = (stage, value) => writeFile(path.join(directory, stage + ".json"), JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  }
  try {
    await audit("metadata", { phase: "4.3C", mode: options.publish ? "CONTROLLED-PUBLICATION" : "READ-ONLY-PREFLIGHT", target: TARGET, sourceCommit: approval.sourceCommit, planFingerprint: approval.planFingerprint, approvalFingerprint: approval.fingerprint, startedAt: new Date().toISOString() });
    const plan = await buildPlan();
    const client = options.snapshot ? undefined : createClient({ ...TARGET, useCdn: false, perspective: "raw", token, maxRetries: 0 });
    if (options.publish) {
      const result = await publishApproved({ client, plan, approval, ...options, transactionId: "mtu-4-3c-" + randomUUID(), audit, validate: validatePlan });
      console.log(JSON.stringify({ ...result, after: { ...result.after, documents: undefined } }, null, 2));
    } else {
      const snapshot = options.snapshot ? JSON.parse(await readFile(path.resolve(options.snapshot), "utf8")) : await inspectDataset(client, plan);
      const review = reviewPublication(plan, snapshot, approval);
      // Authenticated snapshot asset IDs are sufficient for reference checks.
      // Snapshot mode does not claim a live slug-uniqueness validator.
      const snapshotClient = {
        fetch: async () => true, withConfig() { return this; }, config: () => TARGET,
        observable: { fetch: () => of(true), request: () => of(true) },
        getDocument: async (id) => snapshot.assets.find((asset) => asset._id === id),
      };
      const validation = await validatePlan(plan, review.documents.map((doc) => ({ ...doc, _id: review.state === "ready" ? "drafts." + doc._id : doc._id })), client || snapshotClient);
      if (options.snapshot) validation.references = "authenticated snapshot asset IDs; live slug validation not executed; raw inventory checked separately";
      const result = { mode: "READ-ONLY-PREFLIGHT", executedPublication: false, approvalFingerprint: approval.fingerprint, planFingerprint: plan.fingerprint, review: { ...review, documents: undefined }, validation };
      await audit("preflight", result);
      console.log(JSON.stringify(result, null, 2));
      if (validation.errors.length) process.exitCode = 1;
    }
  } catch (error) {
    // Never serialize SDK requests, headers, responses or credential-bearing config.
    await audit("error", { at: new Date().toISOString(), statusCode: error.statusCode, status: "STOP; inspect authenticated remote state before any further action; no automatic retry/rollback" });
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => {
  // SDK messages can contain request details: retain only a status for HTTP errors.
  console.error(error.statusCode || error.request || error.response ? "Publication STOP: remote/API error; inspect audit and remote state." : "Publication STOP: " + error.message);
  process.exitCode = 1;
});
