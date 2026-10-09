import type { NextRequest } from "next/server";
import { sameOrigin, json, failure } from "@/lib/admin/http";
import { AdminError } from "@/lib/admin/policy";
import { readCampaign, updateCampaign } from "@/lib/campaigns/management";
import { readManagementBody } from "@/lib/campaigns/management-body";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    if (request.nextUrl.search) throw new AdminError(422, "invalid");
    const view = await readCampaign((await context.params).id);
    return view ? json(view) : json({ error: "not_found" }, 404);
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    if (request.nextUrl.search || request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") throw new AdminError(422, "invalid");
    const raw = await readManagementBody(request.body);
    let value: unknown; try { value = JSON.parse(raw); } catch { throw new AdminError(422, "invalid"); }
    return json(await updateCampaign((await context.params).id, value));
  } catch (error) { return failure(error); }
}
