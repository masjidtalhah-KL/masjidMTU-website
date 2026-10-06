import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { adminConfig } from "./env";
import type { Database } from "./database.types";
export async function serverClient(writable = false) {
  const config = adminConfig();
  const store = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookieOptions: { path: "/admin", sameSite: "lax", secure: config.origin.startsWith("https:") },
    cookies: {
      getAll: () => store.getAll(),
      // Proxy owns refresh writes on renders. Route handlers opt into writes.
      ...(writable ? { setAll: (values: { name: string; value: string; options: import("@supabase/ssr").CookieOptions }[]) => {
        values.forEach(({ name, value, options }) => store.set(name, value, options));
      } } : {}),
    },
  });
}
