import type { NextRequest } from "next/server";
import { sameOrigin, json, failure } from "@/lib/admin/http";
import { AdminError } from "@/lib/admin/policy";
import { readSystemFlags, setSystemFlag } from "@/lib/campaigns/flags";
import { readFlagBody } from "@/lib/campaigns/flag-body";

export const dynamic = "force-dynamic";
// Internal integration boundary for future admin services; no management UI.
export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.search) throw new AdminError(422,"invalid");
    return json({flags:await readSystemFlags()});
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (request.headers.get("content-type")?.split(";",1)[0].trim().toLowerCase() !== "application/json") throw new AdminError(422,"invalid");
    const raw = await readFlagBody(request.body);
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new AdminError(422,"invalid"); }
    return json(await setSystemFlag(value));
  } catch (error) { return failure(error); }
}
