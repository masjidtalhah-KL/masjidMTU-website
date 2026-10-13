import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".", testMatch: "review.spec.ts", workers: 1, fullyParallel: false,
  timeout: 60000, reporter: "list", outputDir: `${process.cwd()}/test-results/qurban-prototype`,
  use: { baseURL: "http://127.0.0.1:3080", browserName: "chromium", channel: "msedge", trace: "off" },
});
