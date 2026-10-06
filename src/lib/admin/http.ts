import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { adminConfig } from "@/lib/supabase/env";
import { AdminError } from "./policy";
export function sameOrigin(request: NextRequest) {
  let origin: string;
  try { origin = adminConfig().origin; } catch { throw new AdminError(503, "unavailable"); }
  if (request.headers.get("origin") !== origin || request.nextUrl.origin !== origin ||
    request.headers.get("sec-fetch-site") === "cross-site") throw new AdminError(403, "denied");
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Expires": "0" } });
}
export function failure(error: unknown) {
  const e = error instanceof AdminError ? error : new AdminError(503, "unavailable");
  return json({ error: e.reason }, e.status);
}
export function databaseError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new AdminError(403, error.message === "Recent MFA required" ? "step-up" : "denied");
  if (["PT409", "40001", "23505"].includes(error.code ?? "")) throw new AdminError(409, "conflict");
  if (error.code === "22023") throw new AdminError(422, "invalid");
  throw new AdminError(503, "unavailable");
}
