"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import type { BrowserConfig } from "./config";
export function browserClient(config: BrowserConfig) {
  return createBrowserClient<Database>(config.url, config.key, {
    cookieOptions: { path: "/admin", sameSite: "lax", secure: config.origin.startsWith("https:") },
  });
}
