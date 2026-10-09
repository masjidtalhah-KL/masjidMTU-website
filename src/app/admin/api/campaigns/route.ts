import type { NextRequest } from "next/server";
import { sameOrigin, json, failure } from "@/lib/admin/http";
import { AdminError } from "@/lib/admin/policy";
import { createCampaign, readCampaigns } from "@/lib/campaigns/management";
import { readManagementBody } from "@/lib/campaigns/management-body";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try { if (request.nextUrl.search) throw new AdminError(422, "invalid"); return json(await readCampaigns()); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (request.nextUrl.search || request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") throw new AdminError(422, "invalid");
    const raw = await readManagementBody(request.body);
    let value: unknown; try { value = JSON.parse(raw); } catch { throw new AdminError(422, "invalid"); }
    return json(await createCampaign(value), 201);
  } catch (error) { return failure(error); }
}
