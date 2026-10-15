import { NextResponse, type NextRequest } from "next/server";
import { adminConfig } from "@/lib/supabase/env";
import { QurbanError, registrationRequest } from "@/lib/qurban/registration-contract";
import { readQurbanBody } from "@/lib/qurban/registration-body";
import { submitQurban } from "@/lib/qurban/registration";
export const dynamic = "force-dynamic";
const respond = (value: unknown, status: number) => NextResponse.json(value, { status, headers: {
  "Cache-Control": "private, no-store", Pragma: "no-cache", Expires: "0", "X-Content-Type-Options": "nosniff",
} });
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { origin } = adminConfig();
    if (request.headers.get("origin") !== origin || request.nextUrl.origin !== origin || request.headers.get("sec-fetch-site") === "cross-site") throw new QurbanError(403, "denied");
    if (request.nextUrl.search || request.headers.get("content-type") !== "application/json") throw new QurbanError(422, "invalid");
    const value = registrationRequest(await readQurbanBody(request.body));
    if (value.slug !== (await params).slug) throw new QurbanError(422, "invalid");
    return respond(await submitQurban(value), 201);
  } catch (error) {
    const e = error instanceof QurbanError ? error : new QurbanError(503, "unavailable");
    return respond({ error: e.reason }, e.status);
  }
}
