// Temporary local review launcher. Never loads hosted credentials/configuration.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SANITY_PROJECT_ID: "localdemo",
  NEXT_PUBLIC_SANITY_DATASET: "prototype", NEXT_PUBLIC_SANITY_API_VERSION: "2026-01-01" };
// These syntactically valid fictional Sanity values satisfy existing next.config.ts only.
// The review page imports no Sanity/Supabase service and makes no external calls.
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3080"],
  { cwd: root, env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => process.exit(code ?? 0));
