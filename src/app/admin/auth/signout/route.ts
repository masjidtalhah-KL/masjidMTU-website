import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifiedClient } from "@/lib/admin/dal";
import { sameOrigin, json, failure } from "@/lib/admin/http";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const { client } = await verifiedClient(true);
    await client.auth.signOut({ scope: "local" });
    const store = await cookies();
    // Clear local cookies even if provider-side termination is unavailable.
    for (const { name } of store.getAll()) if (name.startsWith("sb-")) store.set(name, "", { path: "/admin", maxAge: 0 });
    return json({ signedOut: true });
  } catch (error) { return failure(error); }
}
