import type { NextRequest } from "next/server";
import { sameOrigin, json, failure } from "@/lib/admin/http";
import { AdminError } from "@/lib/admin/policy";
import { commandLifecycle } from "@/lib/campaigns/lifecycle";
import { readLifecycleBody } from "@/lib/campaigns/lifecycle-body";
export const dynamic="force-dynamic";
// Internal manual integration only: no UI, public admission or scheduler HTTP.
export async function POST(request: NextRequest,context: {params: Promise<{id: string}>}) {
  try {
    sameOrigin(request);
    if (request.nextUrl.search || request.headers.get("content-type")?.split(";",1)[0].trim().toLowerCase() !== "application/json") throw new AdminError(422,"invalid");
    const raw=await readLifecycleBody(request.body);
    let value: unknown;
    try {value=JSON.parse(raw);} catch {throw new AdminError(422,"invalid");}
    return json(await commandLifecycle((await context.params).id,value));
  } catch(error) {return failure(error);}
}
