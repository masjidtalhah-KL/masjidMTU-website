import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: ".", testMatch: "review.spec.ts", workers: 1, timeout: 60000,
  use: { baseURL: "http://localhost:3082", channel: "msedge", headless: true }, reporter: "list" });
