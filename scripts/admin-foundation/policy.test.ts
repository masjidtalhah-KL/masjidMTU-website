import test from "node:test";
import assert from "node:assert/strict";
import { authorize, securityState, safeAdminReturn, isIsolatedRoute, verifiedSessionClaims, type SecurityState } from "../../src/lib/admin/policy";
import { accessInput } from "../../src/lib/admin/input";
import { validateConfig } from "../../src/lib/supabase/config";
const state: SecurityState = { user_id: "synthetic", role: "super_admin", status: "active", aal: "aal2", has_totp: true, recent_mfa: true };
test("DAL permission matrix independently denies insufficient roles, assurance and recency", () => {
  for (const role of ["admin", "staff"] as const) {
    assert.doesNotThrow(() => authorize({ ...state, role, aal: "aal1", has_totp: false }, "operational"));
    assert.throws(() => authorize({ ...state, role }, "owner"));
    assert.throws(() => authorize({ ...state, role }, "mutation"));
  }
  assert.throws(() => authorize({ ...state, aal: "aal1" }, "operational"));
  assert.throws(() => authorize({ ...state, has_totp: false }, "owner"));
  assert.throws(() => authorize({ ...state, recent_mfa: false }, "mutation"));
  assert.doesNotThrow(() => authorize({ ...state, aal: "aal1" }, "security"));
  assert.doesNotThrow(() => authorize(state, "mutation"));
});
test("opted-in admin/staff require their verified factor assurance", () => {
  assert.throws(() => authorize({ ...state, role: "staff", aal: "aal1" }, "operational"));
});
test("malformed/unknown security DTO fails closed", () => {
  for (const bad of [null, {}, { ...state, role: "owner" }, { ...state, status: "disabled" }, { ...state, aal: "aal3" }, { ...state, has_totp: "true" }]) assert.throws(() => securityState(bad));
});
test("redirect allowlist rejects external, encoded, protocol-relative and privileged arbitrary returns", () => {
  for (const value of ["//evil.test", "https://evil.test", "/admin/auth/callback", "/admin/../evil", "/admin?next=evil", "/%2f%2fevil", "\\evil"]) assert.equal(safeAdminReturn(value), "/admin");
  assert.equal(safeAdminReturn("/admin/settings"), "/admin/settings");
});
test("entire admin/studio branches isolate from retained public transitions", () => {
  for (const route of ["/admin", "/admin/login", "/admin/auth/callback", "/admin/users", "/studio", "/studio/penjana-jadual-kuliah"]) assert.equal(isIsolatedRoute(route), true);
  for (const route of ["/", "/kuliah", "/admin-public", "/studio-guide"]) assert.equal(isIsolatedRoute(route), false);
});
test("same-role metadata, owner promotion, extra actor identity and invalid versions are rejected", () => {
  const id = "00000000-0000-4000-8000-000000000003";
  for (const value of [
    { operation: "invite", email: "x@example.test", role: "super_admin" },
    { operation: "invite", email: "x@example.test", role: "staff", actor: "owner" },
    { operation: "member", id, version: 1, action: "role", role: "super_admin" },
    { operation: "member", id, version: 0, action: "disable" },
    { operation: "member", id, version: 1, action: "revoke", role: "staff" },
  ]) assert.throws(() => accessInput(value));
  assert.deepEqual(accessInput({operation:"invite",email:" X@Example.Test ",role:"staff"}),{operation:"invite",email:"x@example.test",role:"staff"});
});
test("verified SDK claims must still match issuer, audience, subject and expiry", () => {
  const claims = { sub: "user", iss: "http://localhost:54321/auth/v1", aud: "authenticated", role: "authenticated", exp: Date.now()/1000+3600 };
  assert.doesNotThrow(() => verifiedSessionClaims(claims,"user","http://localhost:54321"));
  for (const change of [{sub:"other"},{iss:"https://evil.test"},{role:"service_role"},{aud:"anon"},{exp:1}]) assert.throws(()=>verifiedSessionClaims({...claims,...change},"user","http://localhost:54321"));
});
test("environment must be explicit, aligned and low privilege; no production/fallback path", () => {
  const env = { ADMIN_SUPABASE_ENV:"local", ADMIN_APP_ORIGIN:"http://localhost:3037", NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_synthetic" };
  assert.doesNotThrow(()=>validateConfig(env));
  for (const patch of [{ADMIN_SUPABASE_ENV:undefined},{ADMIN_SUPABASE_ENV:"production"},{NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co"},{ADMIN_APP_ORIGIN:"https://evil.test"},{NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_secret_test"}]) assert.throws(()=>validateConfig({...env,...patch}));
  const token = (role: string) => `header.${Buffer.from(JSON.stringify({role})).toString("base64url")}.signature`;
  assert.throws(()=>validateConfig({...env,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:token("service_role")}));
  assert.doesNotThrow(()=>validateConfig({...env,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:token("anon")}));
  const staging={...env, ADMIN_SUPABASE_ENV:"staging", ADMIN_APP_ORIGIN:"https://admin-staging.example.test", ADMIN_SUPABASE_PROJECT_REF:"abcdefghijklmnopqrst",NEXT_PUBLIC_SUPABASE_URL:"https://abcdefghijklmnopqrst.supabase.co"};
  assert.doesNotThrow(()=>validateConfig(staging));
  assert.throws(()=>validateConfig({...staging,ADMIN_SUPABASE_PROJECT_REF:"other"}));
});
