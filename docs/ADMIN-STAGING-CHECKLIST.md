# Fasa 6.1 — Staging Provisioning Checklist for Owner Review

**Updated 7 October 2026 (+08:00): existing staging migration and negative hook
verification passed; remaining steps require owner review.** This checklist does
not authorize Google, deployment, owner onboarding or production by itself.
[Current hosted evidence](ADMIN-FOUNDATION-STAGING-VERIFICATION.md). Baseline HEAD
4ab521b484d034e102ae405476c12183554e61f4. Owner subsequently authorized the B-1
checkpoint/push and first staging deployment, now READY and verified; no OAuth.

## 1. Freeze the target before provisioning

The staging target is selected and independently verified. Remaining plan, Google/test
identity and bootstrap decisions need owner review; no secrets in chat:

| Parameter | Required reviewed value |
| --- | --- |
| Supabase organization | Owner-controlled organization; independently protected project-owner recovery |
| Project name | masjid-mtu-admin-staging; exactly one separate hosted staging project |
| Region | Verified Southeast Asia (Singapore), ap-southeast-1 |
| Hosted plan | Selected staging plan with its actual supported Auth hooks/MFA/session settings recorded |
| Supabase project ref | azypohqpupphapasweln |
| Stable staging origin | https://masjid-mtu-admin-staging.vercel.app; READY, first staging deployment verified |
| Google Cloud project/client | Dedicated mtu-admin-staging project and mtu-admin-staging-web Web application OAuth client |
| Test identities | Approved Google test accounts held by the operator; separate from a real owner bootstrap |
| DB operator | Named protected operator permitted to apply only the reviewed foundation migration/bootstrap test procedure |

Singapore is a proximity recommendation for Kuala Lumpur, not an assertion about
data residency requirements or a latency guarantee. It is an available specific
Supabase region. Choose it explicitly rather than relying on the broad Asia
selection when the exact location matters.
[Supabase regions](https://supabase.com/docs/guides/platform/regions).

The ref and stable staging origin are now confirmed. Google remains disabled;
no Google client/secret was configured in this task. The projects remain staging regardless of the
services' main/Production labels. Owner entered eight Vercel Production variables; CLI metadata verifies all names
and absence of privileged credentials. Connector remains 403; CLI succeeds.

## 2. Exact OAuth and callback configuration

| Service/setting | Exact value after parameter substitution |
| --- | --- |
| Supabase API URL | https://azypohqpupphapasweln.supabase.co |
| Google authorized redirect URI | https://azypohqpupphapasweln.supabase.co/auth/v1/callback |
| Supabase Auth Site URL | https://masjid-mtu-admin-staging.vercel.app |
| Supabase allowed redirect URL | https://masjid-mtu-admin-staging.vercel.app/admin/auth/callback |
| App Google redirectTo | https://masjid-mtu-admin-staging.vercel.app/admin/auth/callback |
| App Google entry | https://masjid-mtu-admin-staging.vercel.app/admin/auth/google, same-origin POST |
| App login | https://masjid-mtu-admin-staging.vercel.app/admin/login |
| Google authorized JavaScript origin, if configured | https://masjid-mtu-admin-staging.vercel.app exactly, without path |

The Google redirect points to Supabase, not the Next callback. Supabase then
returns to the Next PKCE callback. This implementation uses the server redirect
flow, not Google One Tap/GIS. Do not add wildcard callbacks, production, arbitrary
preview deployments or unrelated localhost URLs to the staging OAuth client.
[Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google);
[Google web OAuth configuration](https://developers.google.com/identity/protocols/oauth2/web-server).

Google consent configuration: choose External/Testing with explicitly approved
test accounts unless the owner actually has a suitable Google Workspace Internal
audience. Request only openid/email/profile. No Drive/calendar/offline access.
Manually enter the staging OAuth client ID and secret in Supabase Google provider
settings; do not place the client secret in Next public variables or Git.

If genuine Google OAuth is later tested against the disposable Docker stack,
use a **different local Web OAuth client**:

- Google redirect URI: http://127.0.0.1:54321/auth/v1/callback.
- App origin/Supabase Site URL: http://localhost:3037.
- Supabase allowed redirect/app callback: http://localhost:3037/admin/auth/callback.
- Local Google client ID in ignored local configuration; secret supplied privately
  through SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET.
- No reuse of the staging client secret, staging project or production callbacks.

## 3. Environment variables and manual secret entry

For the staging application deployment, enter:

| Variable | Value |
| --- | --- |
| ADMIN_SUPABASE_ENV | staging |
| ADMIN_SUPABASE_PROJECT_REF | azypohqpupphapasweln |
| ADMIN_APP_ORIGIN | https://masjid-mtu-admin-staging.vercel.app |
| NEXT_PUBLIC_SUPABASE_URL | https://azypohqpupphapasweln.supabase.co |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Actual staging sb_publishable_ key |
| Existing NEXT_PUBLIC_SANITY_* | Existing reviewed public read configuration, unchanged |
| SUPABASE_SECRET_KEY | Leave blank; ordinary foundation runtime does not require it |
| SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET | Not needed in hosted Next; hosted provider secret is entered in Supabase settings |

Enter these secrets manually through the service's protected settings or
operator-owned vault, **never in chat, Git, screenshots or public variables**:

- Strong unique staging database password, held by the DB operator/owner vault.
- Google OAuth client secret, entered into Supabase's Google provider configuration.
- Any migration credential/access token used by the reviewed deployment operator,
  supplied via restricted local/deployment secret storage, not source files.
- Independently protected Supabase project-owner account recovery and MFA material.
- Future authenticator/recovery material only when its separate test/bootstrap
  procedure is approved; primary and backup factors must be independently usable.

The publishable key and client ID are public identifiers; DB passwords,
service/secret keys, refresh tokens, JWT private signing keys and OAuth client
secrets are not. Supabase manages JWT signing keys; do not export them into the app.
An isolated future Auth Admin session-termination client needs its own review;
do not fill the reserved secret placeholder merely to make this checklist pass.

## 4. Reviewed schema and deny-first configuration

The project already exists. Steps 1–4 schema/hook checks passed in 6.1B-1;
non-Google Site URL/redirect and provider denial are set. The numbered sequence
remains the review checklist for later re-verification, not authorization to
create another project or repeat a completed migration:

1. Create only masjid-mtu-admin-staging, in the approved organization/region/plan.
   Verify the literal ref and app origin before any migration command.
2. Apply exactly
   supabase/migrations/20261006000100_admin_foundation.sql through the approved
   migration mechanism. No future table, fixture, seed or production migration.
   The committed migration source must match the reviewed local source.
3. Verify three tables, constraints, FK behaviour, RLS, column/function grants,
   private schema exposure and audit trigger. Actual Auth schema provider_id,
   identity_data email/sub, sessions and mfa_factors must match the query contract.
4. Configure Before User Created to call private.before_user_created.
   Confirm hosted hook configuration supports this private function, role grant
   and empty-search-path implementation. Failure to configure/test denies release.
5. Keep Google disabled until hook absence/error/uninvited-account denial is
   demonstrated and the callback allowlist is exact. First-time invited OAuth
   needs global signup creation enabled; the private hook is the admission gate.
   Disable email/password/SMS/anonymous signup, manual linking and every other
   provider. Do not expose a public signup/password/magic-link UI.
6. Enable supported TOTP enrollment/verification; review factor-limit/unenrollment
   settings against primary + backup recovery. Application tables never hold seeds.
7. Configure only supported plan/session controls after review. Targets remain
   15-minute JWT, 8-hour maximum session and 30-minute inactivity; do not present
   defaults or a JavaScript timer as enforcement. Record any unsupported target
   as an unresolved release gate.
8. Generate public DB types from the actual staging/local full-stack schema and
   reconcile relationships/PostgREST metadata with checked-in catalog types.
9. Deploy only this reviewed branch to https://masjid-mtu-admin-staging.vercel.app with the above environment.
   Verify public and Studio identity/data boundaries remain separate.

The current local CLI wrapper intentionally does not provide remote link/push.
A later authorized operator task must use a deliberately reviewed remote
migration target; no command in the current task points at a hosted project.
[Hook guidance](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook);
[hosted session controls](https://supabase.com/docs/guides/auth/sessions).

## 5. Bootstrap boundary and audit requirement

There is no deployed bootstrap route/secret and no real owner account. Ordinary
invite/accept/UI cannot create a super_admin. Therefore real owner-role staging
tests require a **separately reviewed isolated test/bootstrap procedure**:

- Review the exact environment and approved test identity independently.
- Record the first foundation mutation and all bootstrap/recovery events
  atomically in private.admin_audit_log; a synthetic test harness seed is not a
  production bootstrap procedure.
- Any temporary super_admin admission record is created only by the protected
  operator, with trusted Auth-owned UUID/confirmed Google email/subject checked
  directly. The normal callback cannot consume a super_admin invite.
- Create the single approved profile, close its isolated invite and record the
  bootstrap event in one guarded operator transaction after identity verification.
- Require TOTP + separate backup and demonstrate AAL2 before testing owner work.
- Remove the one-time operator facility and retain evidence. No application
  endpoint, UI promotion or reusable bootstrap secret.
- The real owner's onboarding/recovery requires later explicit authorization;
  this checklist does not create that account or solicit its credentials.

No test bypass should be copied into deployed src or normal migrations.

## 6. Ordered real staging test sequence

Use approved test identities only; record results without tokens/seeds/secrets.

1. **Admission negative cases:** random new Google account, uninvited/expired/
   revoked/wrong-email account, alternate provider, anonymous/password/signup,
   hook unavailable/misconfigured. Confirm generic denial, no active profile and
   no invite consumption. Check an existing Auth user with no membership.
2. **Authorized invite:** approved test owner at AAL2 creates admin/staff invites;
   exact seven-day expiry; duplicate and concurrent create calls reject duplicates.
   Accept via real PKCE Google OAuth; role comes from DB. Double callback/replay
   yields one profile/accept audit; wrong email/subject cannot reuse admission.
3. **Data API authorization:** call real PostgREST directly with anon and valid
   outsider/staff/admin/owner AAL1/AAL2 tokens. Verify table writes, private schema,
   privileged/helper RPCs and altered user metadata cannot bypass guards.
4. **Live revocation:** disable/revoke while the old JWT is valid; server/API/RLS
   immediately deny. Check reactivation versions, protected owner, explicit same-
   identity re-invite and Google email changes. Run concurrent actor/target actions.
5. **Real MFA:** enroll and challenge primary, then a separate backup factor.
   Owner AAL1 has only MFA/security/sign-out; AAL2 unlocks foundation reads.
   Verify invalid/replayed TOTP, removed factor, stale AAL2, account switch and
   primary-factor loss using the approved backup/recovery procedure.
6. **Recent MFA:** inspect verified claim shape without logging its raw JWT.
   Confirm signed AMR totp timestamp persists correctly through refresh, reads
   may continue at AAL2, mutations deny after 600 seconds and a new genuine
   challenge restores them. Missing/malformed/future evidence must deny.
   If hosted AMR semantics do not support robust enforcement, retain deny,
   stop this feature and review a supported server-side step-up design.
7. **Atomicity:** inject an approved disposable audit-write failure; profile and
   invitation issue/accept/revoke/status changes roll back together. Confirm
   immutable history, request IDs, version conflicts and actor mutation limit.
8. **Session/SSR:** PKCE/state replay, exact callbacks, expired access tokens,
   refresh/rotation, provider outages, plan-backed timeout controls, cookie
   /admin scope/Secure/SameSite, no-store/RSC/cache and CSRF checks.
9. **Display isolation:** logout and history back; switch Google accounts/tabs;
   MFA account switch/provisioning material; navigate to public pages; BFCache
   restoration/mobile. No retained authorized screen or cross-user response.
10. **Provider termination/recovery:** review an isolated server-only Auth Admin
    implementation/operator procedure; exercise termination/ban/unban failure
    reporting after live deny, recovery authorization and atomic recovery audit.
    This is pending, not implemented or claimed by the local verification checkpoint.
11. **Regression:** lint, production build, real DB reset/migration/type checks,
    complete security matrix, public homepage, /kuliah and real PNG/PDF exports,
    /studio rendering and existing Studio workflow tests. No Sanity writes unless
    separately authorized for a concrete test.
12. **Owner decision:** review evidence and unresolved items before declaring
    Fasa 6.1 complete. Production provisioning, owner onboarding, backups/retention
    policy and any operational module require their own explicit decisions.

## Current completed foundation and remaining items

Local Docker reset/migration, actual Auth schema/grants, PostgREST/RLS/bypass/
concurrency, public CLI types, private-hook execution and genuine TOTP/AAL2/
AMR refresh/step-up/factor-removal denial are verified (30 real-stack tests).
They are no longer unresolved local blockers.

Remaining hosted gates: genuine Google PKCE/provider identity and positive
first-user hook admission; selected hosted versions/configuration; genuine
Google-session TOTP/refresh/deployment cookies/rotation/outages; reviewed isolated
test bootstrap and real owner onboarding; provider session termination/recovery;
selected-plan timeout and retention/backup procedures. Repeat the matrix on
staging rather than inferring hosted success from local or synthetic fixtures.
Hosted staging now exists; 6.1B-1 applied only the reviewed migration, enabled
the private hook and passed 36 hosted HTTP/SQL/contract cases. The first staging
deployment is READY and verified; no real owner, Google setup or production resource. Vercel variable completeness
is verified through CLI metadata; connector still returns 403. See the hosted record for genuine versus
synthetic test boundaries; no full hosted Auth/TOTP/session success is inferred.
Fasa 6.1 remains open; production and operational modules are not authorized.
