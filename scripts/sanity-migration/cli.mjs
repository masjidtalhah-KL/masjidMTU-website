import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { createClient } from "@sanity/client";
import { buildPlan, ROOT, TARGET } from "./plan.mjs";
import { validatePlan } from "./validation.mjs";
import { analyseDataset, inspectDataset, writeDrafts } from "./dataset.mjs";
import { report } from "./report.mjs";

export function parseOptions(args) {
  const options = { write: false, inspect: false };
  const seen = new Set();
  const valueOptions = { "--dataset-snapshot": "snapshot", "--report": "report", "--json": "json", "--confirm-production": "confirm", "--approve-plan": "approval" };
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error("Flag berulang: " + flag);
    seen.add(flag);
    if (flag === "--dry-run") continue;
    if (flag === "--write-drafts") { options.write = true; continue; }
    if (flag === "--inspect-dataset") { options.inspect = true; continue; }
    if (valueOptions[flag]) {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error("Nilai diperlukan untuk " + flag);
      options[valueOptions[flag]] = value;
      continue;
    }
    throw new Error("Flag tidak dikenali: " + flag);
  }
  if (options.write && seen.has("--dry-run")) throw new Error("Dry-run dan write tidak boleh digabungkan.");
  if (options.snapshot && options.inspect) throw new Error("Pilih snapshot atau pemeriksaan live.");
  if (!options.write && (options.confirm || options.approval)) throw new Error("Pengesahan write tidak digunakan dalam dry-run.");
  if (options.write && (options.snapshot || options.confirm !== TARGET.projectId + "/" + TARGET.dataset || !/^[a-f0-9]{64}$/.test(options.approval || ""))) throw new Error("Write memerlukan --confirm-production 2o95jmms/production dan --approve-plan <fingerprint>; snapshot tidak diterima.");
  // Reports cannot accidentally overwrite source files, .env, or any file inside the repo.
  for (const filename of [options.report, options.json].filter(Boolean)) {
    const resolved = path.resolve(filename);
    const relative = path.relative(ROOT, resolved);
    if (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative)) throw new Error("Output laporan mesti di luar repository.");
  }
  return options;
}

export async function main(args = process.argv.slice(2)) {
  const options = parseOptions(args);
  nextEnv.loadEnvConfig(ROOT, false, { info() {}, error() {} });
  for (const [variable, expected] of [["NEXT_PUBLIC_SANITY_PROJECT_ID", TARGET.projectId], ["NEXT_PUBLIC_SANITY_DATASET", TARGET.dataset]]) if (process.env[variable] && process.env[variable] !== expected) throw new Error("Env target tidak sepadan: " + variable);
  if (options.write && !process.env.SANITY_MIGRATION_WRITE_TOKEN) throw new Error("SANITY_MIGRATION_WRITE_TOKEN diperlukan; tiada write dibuat.");
  const plan = await buildPlan();
  const validation = await validatePlan(plan);
  if (options.write && options.approval !== plan.fingerprint) throw new Error("Fingerprint pelan berubah; ulang dry-run dan review.");
  let snapshot;
  let client;
  if (options.snapshot) snapshot = JSON.parse(await readFile(path.resolve(options.snapshot), "utf8"));
  if (options.inspect || options.write) {
    client = createClient({
      ...TARGET, useCdn: false, perspective: "raw",
      token: options.write ? process.env.SANITY_MIGRATION_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN,
    });
    snapshot = await inspectDataset(client, plan);
  }
  const dataset = analyseDataset(plan, snapshot);
  const summary = report(plan, validation, dataset);
  console.log(summary);
  if (options.report) await writeFile(path.resolve(options.report), summary, { flag: "wx" });
  if (options.json) await writeFile(path.resolve(options.json), JSON.stringify({ mode: "dry-run", plan, validation, dataset }, null, 2) + "\n", { flag: "wx" });
  if (validation.errors.length || dataset.conflicts.length) { process.exitCode = 1; return; }
  if (options.write) {
    const result = await writeDrafts(client, plan, validation);
    console.log("Write draft selesai: " + JSON.stringify(result) + ". Tiada publish.");
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => {
  console.error("Migration dihentikan: " + error.message);
  process.exitCode = 1;
});
