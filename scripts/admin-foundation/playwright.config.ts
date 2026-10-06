import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".", testMatch: "browser.spec.ts", workers: 1, fullyParallel: false, outputDir: `${process.cwd()}/test-results`,
  timeout: 30000, reporter: "list", use: { baseURL: "http://localhost:3037", browserName: "chromium", channel: "msedge", trace: "retain-on-failure" },
  webServer: { command: "node scripts/admin-foundation/e2e-server.mjs", cwd: process.cwd(), url: "http://localhost:3037/admin/login", reuseExistingServer: false, timeout: 60000 },
});
