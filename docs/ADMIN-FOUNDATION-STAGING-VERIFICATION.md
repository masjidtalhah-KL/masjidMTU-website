# Fasa 6.1B-1 — Hosted Staging Migration and Auth Hook

7 October 2026 (+08:00). **Hosted migration, schema/grants and negative Auth-hook
verification passed. Owner entered the eight Vercel Production variables; CLI
verified their names and no privileged credential. Checkpoint/push and first
staging deployment are complete and verified. Stop before Google and 6.1B-2.**

Baseline HEAD: `4ab521b484d034e102ae405476c12183554e61f4`, tag
`phase-6.1a-local-admin-foundation`. No runtime, dependency, migration or checked-in
type change was needed. Owner subsequently authorized commit/push/tag and first
staging deployment. No Google OAuth configuration, real
owner bootstrap, real personal test identity, operational module or production
resource. Fasa 6.1 remains open. The 327 local tests remain the completed 6.1A
evidence and were not rerun for documentation-only changes.

## First staging deployment — finalization verified

Owner entered the eight environment variables and authorized commit/push/tag plus
first staging deployment, superseding the initial B-1 no-deploy/no-commit boundary.
Both projects remain dedicated staging. Google and real-owner work remain excluded.

| Item | Verified result |
| --- | --- |
| B-1/deployed source commit | 79a87e97c16573968eb4c57d0b19e421d6f7fba0 |
| Checkpoint tag | phase-6.1b1-hosted-supabase-staging, pushed and preserved |
| Vercel deployment | dpl_DT9F1qXyZYbpKQMUHGSwzihYeDVn, READY |
| Immutable deployment URL | https://masjid-mtu-admin-staging-5xlzub8jt-korok.vercel.app |
| Stable staging alias | https://masjid-mtu-admin-staging.vercel.app, verified domain and alias |
| Source/target | CLI local upload; clean canonical repo/main; Production target of dedicated staging project; no Git/fork source connection |
| Build | Next.js 16.3.6 Turbopack; TypeScript passed; 15 static pages; 338 source files uploaded; READY in about 92 seconds |
| Runtime | Node 24.x; hosted build CLI 62.1.0; operator CLI 62.7.0; build region iad1 |
| Environment contract | Exactly eight configured keys, all Production targets; names verified without decrypt/pull; no service-role/secret/DB/OAuth credential |
| HTTP checks | 8/8 passed |
| Genuine anonymous browser | 5/5 passed; no console/page errors or response >=500; no Google login attempted |
| Public bundle scan | 30 actual deployed app chunks from public/admin/Studio pages passed; no privileged key/token/reference/service-role JWT |
| Runtime log inspection | Latest 100 bounded request records include 200/307, no error/fatal/5xx; earlier API records include expected 401; separate 30-minute error and 5xx queries each return zero |

The alias login page also returned 200 without a Vercel bypass header. Protection
remains configured as all_except_custom_domains; no protection setting was disabled.
The CLI generated its protection-aware access credential internally; no credential
value was printed or committed. The official external Sanity bridge.js is outside
this app build and excluded from the 30-chunk scan.

| Route | HTTP evidence |
| --- | --- |
| / | 200, Sanity-backed Kuliah terdekat section renders |
| /kuliah | 200, official October poster, 30 dates / 34 sessions |
| /kuliah/2026-10 | 200, matching published Sanity schedule; browser poster hydrates |
| /admin/login | 200, configured invitation-only login, enabled Google entry button; provider intentionally not configured |
| /admin | 307 to /admin/login?state=signed-out; browser follows to 200 login |
| /admin/api/security and /admin/api/access | 401, unauthenticated access denied; no initialization failure |
| /studio | 200 shell; no editorial mutation/login attempted |

Initial ad-hoc test selectors assumed a query-free redirect and abbreviated login
text; harnesses were corrected to the existing DAL/UI contracts, without app changes.
The first bundle harness also encountered the external Sanity bridge after scanning
all 30 app chunks; its allowlist now explicitly excludes that external script.
Build warnings concern existing Node engine range, package deprecations and npm
install-script allowlist, not a failed build. No dependencies/runtime/migration changed.
Full 327 local tests were not rerun: 6.1A remains their evidence. Hosted build and the
deployment checks above are new evidence. Local documentation/link/diff checks pass.

Post-deployment documentation records these results separately from the source
checkpoint. The tag still identifies the exact deployed source; no redeploy is
needed for a documentation-only results commit. B-1 is complete; Fasa 6.1 stays open.

Remaining exact B-2 gates, requiring next-task approval:

1. Dedicated staging Google Web OAuth consent/client and Supabase Google provider;
   origin https://masjid-mtu-admin-staging.vercel.app, Google redirect
   https://azypohqpupphapasweln.supabase.co/auth/v1/callback, Next redirect
   https://masjid-mtu-admin-staging.vercel.app/admin/auth/callback. Enter Google
   secret directly in the approved provider dashboard, never chat or Next env.
2. Real hosted OAuth admission: eligible invite, arbitrary/wrong/expired/revoked
   rejection, trusted provider binding, PKCE/callback/cookies and authenticated
   PostgREST role/status/stale-JWT matrix using approved isolated test identities.
3. Approved isolated test-owner procedure; hosted TOTP primary/backup, Auth-issued
   AAL2, signed recent AMR/refresh/step-up and factor removal. No real owner yet.
4. Hosted session plan/timeout/rotation/logout/account-change and deployment callback
   behaviour; separately reviewed recovery and provider session termination.

## Verified targets and preflight

| Item | Actual result |
| --- | --- |
| Supabase name/ref | masjid-mtu-admin-staging / azypohqpupphapasweln, authenticated project inventory and Management API agree |
| API URL | https://azypohqpupphapasweln.supabase.co; actual HTTP requests use this origin |
| Region/status | ap-southeast-1 (Singapore), ACTIVE_HEALTHY |
| Hosted database | PostgreSQL 17.11; project image 17.11.0.003 |
| Hosted Auth | GoTrue v2.197.0, actual /auth/v1/health |
| Hosted PostgREST | 14.18, actual hosted CLI type metadata |
| Vercel project | masjid-mtu-admin-staging, prj_Pf0AtaZOb4welcPw7l2eamDowumR |
| Vercel team | team_DcKJaZWKEApp8VZC96cGVlIF |
| Stable staging origin | https://masjid-mtu-admin-staging.vercel.app |
| Initial repo | Clean, exact baseline HEAD |
| Initial hosted state | No migration history table, no public/private application tables; standard Supabase schemas only; Auth users/Storage buckets/objects all zero |

These are dedicated staging projects regardless of a dashboard's main/Production
label. No mosque production target is authorized. Vercel metadata returned
Next.js/Node 24.x, no deployment and `live=false`. Protection reports SSO
`all_except_custom_domains`; verify access when a deployment is later ready.

Owner completed pinned CLI interactive login through browser/terminal. The
operator credential was consumed from its existing secure Windows CLI store in
memory only. No token/password/secret key was requested in chat or saved in
repository/evidence. No DB password was required by the tested CLI flow.

## Link and migration

Pinned Supabase CLI **2.78.0** linked this repo to the exact ref. Generated
`supabase/.temp/project-ref` is ignored and not tracked. Local migration history,
config.toml and source remained unchanged. The local-only wrapper was preserved;
hosted work explicitly used the pinned CLI executable.

Pre-apply migration list had one local pending version and no remote migration.
Dry-run proposed only `20261006000100_admin_foundation.sql`. The same reviewed
source was applied using `db push --linked --yes`; history now agrees:

| Field | Result |
| --- | --- |
| Version/name | 20261006000100 / admin_foundation |
| Logical migration timestamp | 2026-10-06 00:01:00 UTC (filename/version, not application time) |
| Applied | Successfully in this task on 7 October 2026 (+08:00) |
| Source SHA-256 | bc79bb1b97f6e22de2ce9df2fb32766b7d9dc7c6e96ab02e71807af87e13f753 |
| Hosted history | 45 stored SQL statements, matching version; final dry-run has no pending migration |

No `db pull`, migration repair/replacement, seed, custom role file or manually
recreated Dashboard table. No compatibility patch was necessary.

## Hosted catalog, grants and security

Actual hosted catalog was compared with the verified real local PostgreSQL
catalog, not with PGlite. The three tables, columns/defaults, all constraints,
seven indexes, one SELECT policy, triggers, 21 function bodies/owners/definer
modes/search paths, and anon/authenticated/Auth-role grants match.

- Only public.admin_profiles, private.admin_invites and private.admin_audit_log.
  RLS enabled on all three; private tables deliberately have no client policies.
- Auth-user PK/FK with delete restrict, role/status checks, exact normalized
  email and subject uniqueness, seven-day invite expiry, partial pending-email
  uniqueness, versions, append-only audit trigger and audit index confirmed.
- No anon/authenticated INSERT/UPDATE/DELETE grants. Authenticated SELECT is
  column-limited; google_subject is not readable. Live membership/identity/MFA
  predicates remain exactly the approved source.
- Six public wrappers are SECURITY INVOKER, owned by postgres. Guarded private
  functions are SECURITY DEFINER with empty search_path and trusted identity/live
  membership checks. Trigger helper remains invoker. No public definer shortcut.
- Before User Created is executable by supabase_auth_admin, not anon or
  authenticated. The Management API read-only SQL role also cannot execute it;
  contract probes therefore use isolated rollback-only operator transactions.
- Actual exposed Data API schemas are public,graphql_public; private is excluded.
  Public/private table and helper bypass checks fail as expected.
- Security advisors returned **two INFO findings only**: RLS enabled with no
  policy on private invites/audit. These describe intentional deny-first design;
  no permissive policy or SQL change was added to silence them.

## Hosted test evidence: 36 cases passed

| Group | Result / actual boundary |
| --- | --- |
| Direct real HTTP/PostgREST/Auth | 15/15 |
| Actual authenticated PostgreSQL role | 13/13, synthetic request claims and rollback-only transactions |
| Hosted hook event contracts | 8/8, rollback-only synthetic invitations |
| Catalog/body/type-core parity and privilege assertions | Pass |

HTTP cases: anon profile SELECT/INSERT/UPDATE/DELETE and four guarded RPCs return
401/42501; private invite/audit schema requests return 406/PGRST106; private helper
RPCs return 404/PGRST202; unverified metadata-bearing JWT returns 401/PGRST301.
Two actual GoTrue signup attempts return the hook's **403 Access denied**, including
user-editable provider=google/role=super_admin spoofing. Hosted Auth encodes the
custom hook response as numeric `code=403`, `error_code=unknown`; this is recorded
exactly, not invented as `hook_error` or treated as migration incompatibility.

The real authenticated DB-role probes verify current_user=authenticated with a
nonexistent synthetic UUID and edited role metadata. RLS exposes zero profiles;
security/owner/accept/invite/revoke/role calls, direct profile writes, private
tables and direct hook execution deny with SQLSTATE 42501. This is a genuine
hosted role/SQL test, **not an Auth-issued hosted bearer token or Google login**.
Actual authenticated PostgREST tokens/full active-role matrix remain 6.1B-2.

Hook contracts: eligible Google event and trim/lowercase exact email allow;
wrong email, expired, revoked, nonexistent, non-Google and anonymous deny.
These use disposable invitation rows inside one explicit transaction ending in
ROLLBACK. No fixture was committed, no Auth user/profile/bootstrap was created,
and the database positive event is not claimed as positive Google OAuth admission.

Final counts: **Auth users = profiles = invites = audit rows = 0**. Schema and
migration history remain. First actual membership/access mutation must still
audit atomically through the approved guarded path.
Final hosted count/config verification: 2026-10-07 07:22:03 UTC / 15:22:03 +08:00.

## Auth hook and final non-Google settings

Hook enabled through a narrow Management API patch, then read back independently:

```text
hook_before_user_created_enabled=true
hook_before_user_created_uri=pg-functions://postgres/private/before_user_created
site_url=https://masjid-mtu-admin-staging.vercel.app
uri_allow_list=https://masjid-mtu-admin-staging.vercel.app/admin/auth/callback
external_email_enabled=false
external_phone_enabled=false
external_anonymous_users_enabled=false
external_google_enabled=false
disable_signup=false
```

The existing default email provider was used only to exercise real negative
GoTrue hook invocation, then disabled in line with approved Google-only admission.
No provider is currently enabled. Global disable_signup remains false because
future invited OAuth user creation must reach the mandatory hook; this does not
grant membership or expose an application signup UI. No Google client/secret,
consent or provider setting was configured.

The hosted default JWT expiry remains 3600 seconds, not claimed as the approved
timeout targets. Hosted plan/session/MFA settings require later verification.
Local config.toml was not pushed; localhost defaults were never copied to hosted
Auth. [Hook response contract](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).

## Hosted versus local differences

Hosted versions are newer: PG 17.11 vs 17.6, GoTrue 2.197.0 vs 2.187.0, PostgREST
14.18 vs 14.5. No foundation schema/function incompatibility was found.

Actual hosted generated types contain new __InternalSupabase/PostgrestVersion
metadata and helper generic defaults. The **public table/RPC/enum/composite type
core is identical** to the checked-in 6.1A types; no runtime/type patch is needed.
The real physical FK is unchanged; its unexposed Auth target correctly remains
outside public-only generated relationship entries.

Hosted six public RPC ACLs omit the local implicit service_role EXECUTE grant.
Anon/authenticated/Auth-role grants, function bodies and guarded behaviour match.
This is a narrower operator default, not a requirement to add a privileged key
or widen hosted grants. Ordinary runtime needs only user-scoped public clients.

## Exact Vercel values and verified environment contract

Initial connector inspection returned **403, not authorized under scope korok**.
The finalization task used pinned Vercel CLI 62.7.0 and existing CLI credentials:
project/team/link match; all eight keys exist with Production target; these are
the only configured project variables. No service-role/secret credential exists.
Values were not decrypted/pulled or printed. CLI metadata and env list agree.
The project has no Git connection, and deployment uses local canonical source.
Connector service authorization remains unavailable; CLI access succeeds.

Enter or verify at **Vercel → masjid-mtu-admin-staging → Settings → Environment
Variables**. The stable alias uses the Production build target of this dedicated
staging project; it is not mosque production. Do not use a different project.

| Implemented variable | Exact value |
| --- | --- |
| ADMIN_SUPABASE_ENV | staging |
| ADMIN_SUPABASE_PROJECT_REF | azypohqpupphapasweln |
| ADMIN_APP_ORIGIN | https://masjid-mtu-admin-staging.vercel.app |
| NEXT_PUBLIC_SUPABASE_URL | https://azypohqpupphapasweln.supabase.co |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Actual staging sb_publishable_ key, retrieved and validated; supplied in the separate public-only Vercel configuration output |
| NEXT_PUBLIC_SANITY_PROJECT_ID | 2o95jmms |
| NEXT_PUBLIC_SANITY_DATASET | production, existing Sanity editorial dataset |
| NEXT_PUBLIC_SANITY_API_VERSION | 2026-09-01 |

Names come from implemented config/env/clients and src/sanity/env.ts. The Sanity
values preserve the 6.1A public read build configuration. The prepared external
`VERCEL-STAGING-PUBLIC.env` contains only these eight public/non-secret values;
no environment file/key value is committed to the repository.

**No service-role/secret key or DB password is required by normal foundation
runtime.** Leave SUPABASE_SECRET_KEY unset/blank; do not add a service-role key,
DB URL/password, CLI token or Google secret to Next. Privileged operator access
used for migrations/settings is separate from application credentials.

No agent Vercel variable mutation or environment pull was needed. Owner entered
the variables. Source upload dry-run initially included nested Supabase caches;
.vercelignore now excludes caches, environment/credential files and local build
outputs. Safe dry-run confirms exclusions. First deployment passed; see finalization evidence above.
[Vercel environment settings](https://vercel.com/docs/environment-variables).

## Exact 6.1B-2 OAuth values (prepared, not configured)

| Setting | Value |
| --- | --- |
| Google client type | Dedicated staging Web application |
| Google authorized JavaScript origin | https://masjid-mtu-admin-staging.vercel.app |
| Google authorized redirect URI | https://azypohqpupphapasweln.supabase.co/auth/v1/callback |
| Supabase Site URL | https://masjid-mtu-admin-staging.vercel.app, already set |
| Supabase allowed redirect / Next callback | https://masjid-mtu-admin-staging.vercel.app/admin/auth/callback, already set |
| Application entry | https://masjid-mtu-admin-staging.vercel.app/admin/auth/google, same-origin POST |
| Scopes | openid email profile only |

Current code fixes redirectTo to the Next callback, uses SSR PKCE and verified
exchangeCodeForSession plus guarded acceptance. Google first returns to Supabase,
then Supabase redirects to Next. No wildcard, extra scope or production URL.
[Official Google/PKCE setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

Remaining 6.1B-2 gates: deployed callback/protection behaviour;
Google consent/client/provider configuration under next-task approval; genuine
positive/negative OAuth admission and trusted provider identity fields; approved
isolated test-owner procedure/full Auth-issued hosted role matrix; hosted TOTP/
backup/AAL2/recent-AMR refresh/step-up; session/cookie/rotation/plan targets;
separately reviewed recovery/provider termination. No real owner onboarding or
operational modules are authorized by this task.

## Local validation and review boundary

Final CLI migration list and dry-run, schema/type-core comparisons, grants/RLS,
Auth settings readback, zero-data counts, security advisors, git diff --check,
documentation/link checks and tracked-credential checks pass. Only staging
documentation plus upload exclusions are intentionally changed. B-1 checkpoint
commit/push/tag is now authorized. Full local lint/build/327 suite rerun is unnecessary without
runtime changes and is not presented as a new hosted result.
