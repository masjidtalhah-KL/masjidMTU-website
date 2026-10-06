# Fasa 6.1 — Admin Foundation Local Implementation

6 October 2026 (+08:00). **UI owner-approved; full real local verification
passed in Fasa 6.1A. Fasa 6.1 remains open for hosted staging.** Checkpoint:
`phase-6.1a-local-admin-foundation` (resolve tag for commit).
[Exact 6.1A evidence](ADMIN-FOUNDATION-LOCAL-VERIFICATION.md). Baseline commit:
`91117322f7ac81043bbe9d952811dfbe02d8ccde`, tag
`phase-6.0-admin-foundation-architecture`. The approved
[6.0 architecture](ADMIN-FOUNDATION-PLAN.md) remains authoritative.

The initial 6.1 no-commit boundary was superseded by the owner's conditional
6.1A commit/push/tag authorization after green local verification. No hosted
Supabase resource, real owner account, production provisioning or operational
module. Tests use synthetic identities. Existing
published Sanity content was read for public regression only, never mutated.

## Dependencies and compatibility

| Dependency | Exact version | Purpose |
| --- | --- | --- |
| @supabase/ssr | 0.12.7 | Browser/server PKCE clients and cookie refresh |
| @supabase/supabase-js | 2.117.2 | Typed user-scoped Auth/Data API client |
| server-only | 0.0.1 | Compile-time boundary on server modules |
| supabase (development) | 2.78.0 | Pinned local CLI |
| @electric-sql/pglite (development) | 0.5.8 | Execute migrations/RLS with explicit test Auth contracts |
| @playwright/test (development) | 1.63.0 | Real browser integration using synthetic adapter |
| tsx (development) | 4.23.15 | TypeScript policy tests |
| tar (Supabase override) | 7.5.22 | Avoid the older CLI transitive tar advisory |

Next 16.3.6, React 19.2.8 and Sanity versions remain unchanged. Node must satisfy
the existing >=22.12.0 requirement and supabase-js Node >=22 requirement.
Bundled Next authentication/proxy/cookie documentation and installed SDK types
were checked. Build and TypeScript compile pass. SSR cookie options include
/admin path, SameSite=Lax and Secure for HTTPS; cache headers supplied by SSR
are propagated during proxy refresh.
[Current SSR client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).

The older Go-based CLI is deliberately pinned. Its package install script must
run to obtain the matching binary; some package-manager script allowlists may
require explicitly enabling the Supabase install script. The local wrapper sets
SUPABASE_HOME under ignored .cache and permits only local start/reset/type
generation. It refuses remote link/push/deploy. An ordinary npm install does not
provision a project. The tested install downloaded the version-matched binary.

## Migration and schema

Only `supabase/migrations/20261006000100_admin_foundation.sql` is added.
It runs in a transaction and creates:

| Table | Constraints and scope |
| --- | --- |
| public.admin_profiles | Auth UUID primary key/FK with delete restrict; unique normalized approved email and unique Google subject; roles super_admin/admin/staff; statuses active/disabled/revoked; bounded display name; timestamps/version |
| private.admin_invites | Unique live pending email; seven-day default expiry; pending/accepted/expired/revoked; role from DB; acceptance/revoke consistency checks; version and immutable actor identifiers |
| private.admin_audit_log | Allowlisted event and role/status fields; actor/target/invite identifiers; server timestamp/request UUID; assurance; successful committed events only; append-only trigger |

The private schema is excluded from exposed API schemas. All three tables have
RLS enabled and explicit privilege revocation. No module tables or seeds.
No real owner/bootstrap SQL runs. The invite table reserves the approved
super_admin role for a future isolated, audited operator procedure; ordinary
invite/accept functions reject it.

Profiles preserve revoked tombstones. Re-invitation requires explicit fresh owner
approval through a new admin/staff invite, then acceptance by the same UUID,
approved email and Google subject. Email/subject/provider changes deny access;
no automatic merging. Audit identifiers do not cascade with account deletion.
The proposed 12-month retention remains a governance target: no purge job or
client purge is implemented. A separately reviewed retention/archive procedure
must preserve append-only access and backup obligations.

## Authorization and guarded operations

The database verifies Auth-owned confirmed email, non-anonymous user, exactly
one Google identity, provider subject consistency, verified provider email,
signed OAuth AMR and the current session row. Browser-editable metadata is
never read for authority. Live profile status/email/subject determines role.

| Caller | Permitted foundation reads/actions |
| --- | --- |
| Anonymous | Denied |
| Authenticated without membership | Denied except narrowly guarded invite acceptance with exact identity |
| Disabled/revoked membership | No profile/security/operational access; deliberate same-identity re-invite is required for revoked admission |
| Staff/admin | Own allowed profile columns and generic Home/Settings; no access management |
| Super_admin AAL1 | Minimal own security DTO, enroll/challenge/sign-out only |
| Super_admin AAL2 with verified TOTP | Foundation profile/owner snapshot; mutations additionally require recent TOTP |

Admin/staff may use AAL1 until they enroll a verified factor; thereafter operational
access requires AAL2. Google subject is excluded from client-readable profile
columns and owner snapshot. No client INSERT/UPDATE/DELETE on profiles.
No direct private invite/audit reads or writes.

Public authenticated-only security-invoker wrappers call private guarded
security-definer functions with empty search_path:

- admin_security_state(): minimal live security/MFA state.
- admin_owner_snapshot(): foundation users, live pending invites and latest
  50 access audit events; owner AAL2 only.
- admin_accept_invite(): no email, actor, role or user-ID input; resolves exact
  trusted identity and invitation role in DB; atomic acceptance/profile/audit.
- admin_create_invite(email, role): admin/staff only, normalized trim/lowercase
  without Gmail dot/plus aliases; closes expired pending records atomically.
- admin_revoke_invite(id, expected_version): owner/current version + audit.
- admin_change_member(target, expected_version, action, next_role): admin/staff
  role changes or disable/reactivate/revoke; all super_admin targets protected.

Caller identity is always auth.uid(). Actor-row and target/invite locks,
identity advisory locks, partial unique index and optimistic versions protect
conflicts/replays. Owner operations recheck authority under the actor lock and
limit audited mutations to 60 events per actor/minute. Duplicate SQL invocation
cannot assign another identity or role. Audit insert failure rolls back the
entire membership/invite mutation, including acceptance. Failed attempts are not
recorded as successful audit events; no raw tokens/identity error bodies are logged.

Disable/revoke immediately denies subsequent live checks even with a valid JWT.
Provider refresh-session termination is **pending**, not claimed successful:
runtime has no privileged Auth Admin client. The API/UI explicitly report this
remaining task after saving the live deny. Recovery/bootstrap and provider
termination require the separately reviewed staging procedure. No generic
privileged database proxy exists.

## Invite-only admission and Auth hook

private.before_user_created(event) is executable only by supabase_auth_admin.
It permits only a non-anonymous Google event whose exact normalized email has a
pending, unexpired invitation. It never consumes the invitation or creates a
profile. Error paths deny generically. Auth config disables email/SMS/anonymous
signup and manual identity linking; Google is disabled until owner-reviewed
configuration. The global Auth enable_signup switch is true only because
first-time invited OAuth creation needs the Before User Created hook.

**The hook must be wired and tested before enabling Google on any real project.**
There is no open membership signup; existing Auth users who bypass the creation
hook still need guarded DB acceptance. Even if the hook fails to run, arbitrary
Auth users cannot gain application membership. A hook configuration failure
must not be treated as acceptable invite-only Auth admission.

Expired invitations are invalid on every read/accept/hook attempt. They are
marked expired and audited on reissue; no scheduled cleanup is assumed.
Duplicate live pending invites are rejected. Active/disabled profiles and all
owner tombstones cannot be ordinarily re-invited.
[Before User Created contract](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).

## SSR, DAL and routes

src/lib/supabase contains distinct browser/server clients, a fail-closed server
environment reader and migration-generated Database types. Configuration accepts
explicit local loopback HTTP or staging HTTPS tied to the reviewed project ref.
Production mode, misaligned hosts/origins, privileged public keys and malformed
configuration fail closed. All .env.example values are empty placeholders;
the actual existing public Sanity configuration is unchanged. SUPABASE_SECRET_KEY is reserved
and blank, not imported by runtime.

src/proxy.ts matches only /admin/:path*, refreshes claims/cookies and adds
private/no-store, no-referrer, nosniff and frame/base/form restrictions.
It grants no authorization. src/lib/admin/dal.ts independently uses verified
getClaims plus fresh getUser, issuer/audience/subject/expiry validation, live
database security state and a mode-specific gate. No getSession-based authority.
Network/provider failures return unavailable rather than grant access.

| Route | Behaviour |
| --- | --- |
| /admin/login | Invitation-only Google entry; generic denied/unavailable state |
| /admin/auth/google | Same-origin POST; server PKCE; fixed callback/Google scopes |
| /admin/auth/callback | PKCE code exchange, verified identity, guarded acceptance, live membership/MFA gate |
| /admin/mfa | Minimal own TOTP enrollment/challenge and sign-out |
| /admin | Authorized Home without invented operational metrics |
| /admin/users | Owner AAL2-only users/invites/audit |
| /admin/settings | Own identity/role/security state |
| /admin/auth/signout | Same-origin POST; local session/cookie clearing and hard navigation |
| /admin/api/security | Verified minimal own state; 401/403/503 |
| /admin/api/access | Owner snapshot or narrow mutation; 401/403/409/422/503 |

Mutation handlers check fixed same-origin/CSRF, strict JSON payload shape,
bounded input, allowed operations and fresh owner MFA. DB guards also apply to
direct RPC calls. Browser target IDs select records; they are never proof of
authority. Return URLs are allowlisted to /admin, /admin/settings or /admin/users.
Callback/HTTP error details are generic. Authentication cookies are scoped to
/admin; server components delegate refresh writes to the proxy.

## MFA and retained-screen protection

Supabase TOTP enrollment displays Auth-provided QR/manual setup material only in
component memory. No TOTP seed enters an application table, log or local storage.
Primary and separate backup authenticator enrollment/challenge are supported;
no factor-removal, owner promotion or public recovery UI.

Owner operational reads require JWT AAL2 plus a current verified Auth TOTP
factor. Privileged mutations additionally inspect signed AMR method=totp and
numeric timestamp, compared with PostgreSQL clock_timestamp() within 600 seconds,
including after an actor-lock wait.
Missing/malformed/future/stale proof denies. Browser clocks and UI flags never
grant mutation access. MFA success is followed by refresh and a fresh server
security check; unavailable/incompatible metadata keeps the mutation blocked.
[JWT AMR fields](https://supabase.com/docs/guides/auth/jwt-fields).

Real local Supabase challenge/refresh, signed AMR continuity, primary/backup
factors, consumed-challenge replay rejection, aged-proof mutation denial,
genuine step-up restoration and still-valid JWT denial after Auth factor removal
are verified in 6.1A. Hosted Google/provider/deployment behaviour remains pending. Do not weaken
the DB check to a UI timer if staging fails; stop the feature at deny and review
a supported server-side design. Auth-owned factor changes/unenrollment policy
also requires provider testing. Recovery custody stays primary + backup TOTP,
owner-only Vaultwarden material and independent project-owner protection.

The admin shell is a distinct navy internal workspace, with sidebar/topbar,
identity/role/sign-out, Home/Settings and owner-only Users. Mobile navigation
uses a native modal dialog with keyboard focus containment and Escape.
Complete /admin and /studio branches bypass public outgoing transition retention.
Logout/account changes hide sensitive content before hard navigation. Admin
views and MFA screens invalidate on account/sign-out events; BFCache restores
force a fresh load. The operational shell also rechecks live security state on
visibility/30-second intervals; this is display invalidation, not authority.

## Local workflow and database types

Run from the repo root with installed Node dependencies:

```sh
npm run admin:db:test
npm run admin:policy:test
npm run admin:types:check
npm run lint
npm run build -- --webpack
npm run admin:bundle:check
npm run admin:e2e
```

The production build requires the existing public Sanity environment values.
For a meaningful public secret scan, set a synthetic ADMIN_TEST_SECRET_SENTINEL
and the same synthetic SUPABASE_SECRET_KEY during the build, then scan with
that sentinel. Never use a real secret for this test.

With Docker Desktop's Linux daemon running:

```sh
npm run admin:local:start
npm run admin:local:reset
npm run build -- --webpack
npm run admin:local:test
npm run admin:types:check
npm run admin:local:types
```

Reset is explicitly local/no-seed and destructive only to this disposable local
stack. Set local .env.local outside Git with ADMIN_SUPABASE_ENV=local,
ADMIN_APP_ORIGIN=http://localhost:3037, NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
and the CLI's local publishable/anon key. No privileged key. Start Next on 3037.
Google remains disabled until a reviewed separate local OAuth client is configured.
The local JWT 3600-second value is a service default, not the approved hosted
15-minute/8-hour/30-minute target implementation.

admin:types generates src/lib/supabase/database.types.ts with the pinned CLI
against actual local Supabase (--local --schema public). admin:types:check
requires exact parity; no PGlite fallback. The physical Auth FK/delete restriction
and PostgREST relationship cache were verified. Public-only Relationships: []
is expected for an unexposed Auth target, not a missing FK. Absent next_role is
omitted to match the actual generated RPC signature and SQL default.

The real suite requires empty disposable Auth/profile tables and built production
output; reset before a repeat. Only configured loopback services are permitted.
Local keys are held in process memory, never source/reports. Supplementary SQL
and browser suites retain explicitly labelled synthetic Auth contracts.

## Validation evidence and remaining gates

| Check | Genuine result |
| --- | --- |
| Real local Supabase/Next SSR | 30/30 pass against real PostgreSQL, Auth, PostgREST, hook/TOTP and SDK/DAL |
| Migration/RLS/auth contracts | 28/28 PostgreSQL/PGlite tests pass, with Auth-owned tables/functions stubbed only in test harness |
| DAL/payload/environment policies | 8/8 tests pass |
| Browser/admin integration | 18/18 Microsoft Edge tests pass against the real Next production server and synthetic SQL-backed Auth/RPC adapter |
| Existing public/Studio/Kuliah suites | 243/243 tests pass |
| Lint | Pass, no warnings/errors |
| Production build | Pass with --webpack, including TypeScript and all admin dynamic routes |
| Default Turbopack build | Stalled in compilation and was stopped; not passed |
| Public browser bundle | 248 production chunks scanned, no privileged import or synthetic secret value |
| Admin HTTP smoke | Pass: redirects, API denial, CSRF, no-store and POST-only logout |
| Public/Studio HTTP smoke | 9 routes return 200; October remains 30 dates/34 sessions; unreferenced/unpublished images 404; no Studio mutation code in public chunks |
| Documentation/diff checks | Pass: tracked diff whitespace, all changed/new files for conflict/Unicode checks and local Markdown link resolution |
| Full Supabase start/reset | Pass, CLI 2.78.0 / PostgreSQL 17.6 / Auth v2.187.0 / PostgREST 14.5 |
| Hook/TOTP/PostgREST | Local real service tests pass; positive Google OAuth admission and hosted session behaviour remain staging-only |
| Total automated tests | 327/327 pass; real and synthetic boundaries detailed in 6.1A evidence |
| Authenticated live Studio mutation | Not run/authorized; Studio regressions are routes, schemas and existing synthetic workflow tests |

The synthetic browser adapter deliberately returns provider/TOTP failures rather
than fabricate successful authentication. It is scripts-only, outside src,
starts its own local process and never enters the production browser bundle.
SQL tests cover direct table/RPC bypass, stale valid claims, disabled/revoked,
wrong email, expiry, duplicate/replay, editable metadata, current-factor and
signed-MFA evidence, protected owner, version conflicts and audit rollback.
Real concurrent PostgreSQL/PostgREST requests, current Auth schema/grants and
types passed in 6.1A. Intentional stale versions now use PT409/HTTP 409 instead
of 40001, which caused actual PostgREST retry loops. Hosted versions/configuration
must still be verified on the selected staging project.

The exact owner-reviewed provisioning and test sequence is in
[ADMIN-STAGING-CHECKLIST.md](ADMIN-STAGING-CHECKLIST.md).
No hosted provisioning command has been run. The owner approved the foundation
UI; 6.1A closes only local verification. Do not close Fasa 6.1, start staging
provisioning or start a module without the corresponding owner decision and
remaining hosted gates passing.

Dependency audit reports 26 advisories (12 moderate/14 high, zero critical),
matching the existing baseline count; none is attributed to the added Supabase,
PGlite, Playwright, tsx or server-only packages. Existing ecosystem advisories
remain for a separately scoped dependency review; no broad audit fix was run.
