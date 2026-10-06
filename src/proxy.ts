import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminConfig } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const privateHeaders = () => {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Frame-Options", "DENY");
    // Next uses inline bootstrap scripts; preserve its framework CSP needs.
    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
  };
  try {
    const c = adminConfig();
    const client = createServerClient<Database>(c.url, c.key, {
      cookieOptions: { path: "/admin", sameSite: "lax", secure: c.origin.startsWith("https:") },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, cacheHeaders) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(cacheHeaders).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    });
    // Authentication refresh only. DAL/RPC independently authorize every use.
    await client.auth.getClaims();
  } catch { /* DAL fails closed; configuration-free login stays renderable. */ }
  privateHeaders();
  return response;
}
export const config = { matcher: ["/admin/:path*"] };
