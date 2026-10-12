# Fasa 7.6 — Campaign Engine Audit, Security & Regression QA

**Fasa 7.6 complete / owner-approved — local security and regression checkpoint**
12 October 2026 (+08:00). Owner review approved the local evidence and final
explicit NOINHERIT assertion. Checkpoint: `phase-7.6-campaign-engine-security-qa`;
resolve the tag for the checkpoint commit. No deployment or hosted verification
is claimed or authorized by this checkpoint.

## Baseline and scope

Clean canonical `main`, `origin/main` and read-only remote main verification all
resolved to documentation-maintenance commit
`f15d4c34c3f84c8f43c3d48a9a651343df743c8f`. The implementation checkpoint remains
`405a5987794e580a076cc8def79fbcb9068535dd`, tag
`phase-7.5-public-campaign-route`. No existing tag is changed.

Reviewed contracts: [architecture](CAMPAIGN-ENGINE-PLAN.md),
[database](CAMPAIGN-ENGINE-DATABASE.md), [flags](CAMPAIGN-FEATURE-FLAGS.md),
[lifecycle](CAMPAIGN-LIFECYCLE.md), [management](CAMPAIGN-ADMIN-MANAGEMENT.md),
[public/editorial](CAMPAIGN-PUBLIC-ROUTE.md),
[Foundation authorization](ADMIN-FOUNDATION-PLAN.md) and [ROADMAP](ROADMAP.md).
Review includes all six migrations, current Foundation Auth/DAL/policy/http/MFA,
campaign services/APIs, typed adapters, projections, public composition, generated
types, route isolation and cache handling. Historical migrations stay immutable.

This checkpoint contains only tests and documentation. No runtime, schema,
migration, dependency, environment contract or RBAC redesign is introduced.
Production migration descriptors and application admin adapters remain empty.

## Evidence method

The approved **848/848 unique-test baseline** is preserved and rerun, including
all campaign suites, Foundation and public/Studio/Kuliah/export regressions.
Additional adversarial coverage lives in
[`security-local.test.mjs`](../scripts/campaign-engine/security-local.test.mjs).
The ten actor cases each exercise a combined direct-RPC/application matrix;
individual assertions inside them are not counted as separate tests.

Real-local evidence uses disposable `mtu-admin-local` PostgreSQL/Auth/PostgREST,
Next production Webpack output and Edge. Ordinary identities, Google identity
records and some signed claims are explicit local operator fixtures. The owner
path uses actual local Auth-issued AAL1/TOTP/AAL2; synthetic stale/no-step-up JWTs
test signed-claim contracts separately. No real Google OAuth is performed here.

Upgrade/PGlite/Auth-stub tests remain supplementary. The existing 22-case browser
suite retains its documented synthetic Foundation HTTP adapter; its PNG/PDF
downloads use the real browser exporter. The existing export case now inspects
PNG signature/IHDR/dimensions/IEND and PDF header, one-page A4 geometry, raster
dimensions and cross-reference/trailer location. It is not counted as hosted Auth.

The existing offline Node preload rejects non-loopback transport and supplies
explicit GROQ fixtures. Browser regression also aborts external resource requests.
No live Sanity/Supabase/Vercel project is queried. Published editorial evidence
is offline, not a hosted publication or permission test.

## Actor / operation matrix

| Actor | Campaign/catalog/detail/window + safe flags | Campaign mutation | Global flag mutation | Campaign audit | Foundation owner snapshot |
| --- | --- | --- | --- | --- | --- |
| Anonymous | Denied | Denied | Denied | Denied | Denied |
| Authenticated outsider | Denied | Denied | Denied | Denied | Denied |
| Disabled / revoked member with valid token | Denied | Denied | Denied | Denied | Denied |
| Active staff | Read | Denied | Denied | Denied | Denied |
| Active admin | Read | Manage | Denied | Campaign-only | Denied |
| Super-admin AAL1, despite verified stored factor | Denied | Denied | Denied | Denied | Denied |
| Super-admin AAL2, no recent signed TOTP | Read | Denied | Denied | Read | Read |
| Super-admin AAL2, stale signed TOTP | Read | Denied | Denied | Read | Read |
| Super-admin AAL2, fresh verified TOTP | Read | Manage | Manage | Read | Read |
| Disposable scheduler LOGIN with capability | No general read/API privilege | Due open/close only | Denied | Internal writer only | Denied |
| Forged scheduler-like caller, no capability | No scheduler privilege | Denied | Denied | Denied | Denied |

Direct RPC checks cover list, catalog, detail, window, create, core update,
schedule, lifecycle, flag snapshot/command, campaign audit and Foundation
snapshot. Real Next checks cover campaign list/detail and create/update/schedule/
lifecycle POSTs, flag reads/mutations and Foundation access denial. Existing
suites independently test legitimate state-changing commands, owner MFA,
same-origin/media-type/bounded-body failures and staff read-only rendering.

Production application create/config editing intentionally rejects a fixture DB
descriptor without a reviewed application adapter. Successful DB create/update
uses isolated descriptors; successful typed forms use injected test seams. No
test adapter or raw JSON fallback is installed in the production application.

Anonymous descriptive access is a separate capability: all callers receive only
the public projection after its gates, regardless of their operational identity.
Private or flag-disabled fixtures return null/neutral 404 even for an admin.

## Adversarial additions

- Cross-boundary actor matrix checks direct RPC and actual Next in one case per
  actor, including current-version no-ops and rejection without state/audit changes.
- Editing signed JWT payloads without a valid signature cannot borrow owner
  subject/session/AAL/TOTP. Direct Data API and Next families reject the token.
- A correctly signed local subject cannot use another user's live session ID.
  Membership, detail/update, audit and flags stay denied at both boundaries.
- Audit target null, guessed UUID, profile UUID, limits and extra scope/actor
  parameters cannot select Foundation/security/flag history as admin. The
  application audit DTO drops actor IDs and raw metadata.
- Inventory checks all migration-defined function search paths, trusted definer
  ownership, absence of default PUBLIC EXECUTE, scheduler role attributes,
  runtime non-membership and its exact single private execution capability.
- Whole operational-table ACL/RLS inventory checks no raw runtime CRUD, no
  permissive private policies and Data API private-schema rejection.
- Mobile browser reload after global OFF removes the campaign, returns 404,
  retains no outgoing campaign transition and stores no campaign authority in
  local/session storage. A descriptive page has no admission/form capability.

## Audit isolation and atomicity

The existing append-only `private.admin_audit_log` is reused. No second log,
free-text reason, raw diff or unrestricted metadata path is added. Controlled
campaign events and sanitized metadata retain their database constraints.
Foundation bootstrap/recovery/invitation/member events remain owner-only.
Admin's direct audit RPC permits campaign targets only, even with null scope;
staff and anonymous cannot retrieve history. Owner-only flag history is not
exposed to admin through the campaign projection.

Baseline suites force writer failures and prove rollback of campaign create,
update, schedule/lifecycle, scheduler batch and flag state. No-op/retry/conflict
cases produce no duplicate successful business audit. Versions, before/after
booleans, controlled lifecycle causes and planned deadlines are asserted.
Scheduler events derive scheduler/null/system attribution; user operations
derive live user attribution. Tokens, participant PII, finance payloads, consent
snapshots and unrestricted internal reasons cannot enter campaign metadata.

## Lifecycle, scheduler and flags

All approved edges and denied terminal exits are rerun. Closed admission cannot
reopen; archived cannot exit; unscheduling never unlocks a sealed slug. Paused
never auto-resumes and draft never auto-opens. Close-first reconciliation uses
DB time, row locks/SKIP LOCKED and one bounded total batch cap.

Race coverage includes manager/manager, open/open, close/close, pause or resume
against deadline close, unschedule against scheduler open, schedule edits against
scheduler and overlapping scheduler ticks. Losing stale operations do not
overwrite winners or add duplicate audits. Persisted expired deadlines close
before proposed schedule edits; the proposed extension/event windows remain
unapplied, with one close/version/audit. Scheduler-first and scheduler-late
paths agree on terminal truth. Audit failure rolls back that reconciliation.

`campaign_scheduler` remains NOLOGIN/NOINHERIT and cannot own execution code or
assume user/profile/flag/schedule privileges. Disposable local LOGIN tests use
real session_user membership through nested SECURITY DEFINER calls. Null Auth,
JWT/GUC/header/actor claims and definer current_user do not grant capability.
Runtime roles have no scheduler membership or reconciliation EXECUTE.

Missing global/module flags are OFF; unknown modules are unsupported/OFF. Flag
commands use live owner AAL2/recent TOTP and expected version before idempotency;
concurrent requests yield one change/audit. Flags do not alter lifecycle, and
lifecycle/scheduler commands never create or change flags.

## Public, editorial and cache boundaries

Unknown/malformed/private/draft/non-opted scheduled and archived campaigns are
neutral 404. Opted scheduled remains scheduled until opening actually commits;
open/paused/closed show their approved descriptive states. Expired persisted
scheduled/open/paused displays closed without a read-side mutation. Required
global/module OFF hides all states before any editorial query. The direct RPC
DTO has exactly nine allowlisted fields, including the optional non-secret
four-field locator; no actor/config/audit/version/validator data is exposed.

Operational failures remain sanitized PT503 at Data API / neutral approved 500
at the Next page boundary. They do not become empty success or false 404.
Published `program.description` uses only exact stable ID and fixed configured
project/dataset/type. Missing/draft/version/wrong binding falls back to minimum
presentation. Malformed/oversized/unsafe-control-character descriptions are
omitted; HTML-shaped strings are escaped text. Editorial cannot override
operational title/state/dates/flags and the locator is stripped before React.

Operational pages/RPC fetches remain dynamic/no-store, with request-only React
deduplication. Public campaign/admin branches bypass retained public transitions.
The next request/reload sees a kill switch; no browser storage carries merged
campaign authority. A previously delivered description grants no admission.
Homepage/Kuliah's existing five-minute editorial cache remains unchanged.

## Static, bundle and regression review

Security-sensitive functions retain fixed empty search_path and explicit ACLs.
Trusted migration owner owns definers; invoker wrappers keep independent DB
authorization. Private schema is not exposed through PostgREST. Anonymous has
no private schema USAGE. Authenticated has the intentionally reviewed private
USAGE needed by invoker wrappers, not raw table/helper access; the scheduler
capability has only the minimum schema usage and reconciliation EXECUTE.

Runtime uses publishable credentials only. Server-only DAL and exact parsed
DTOs separate browser authority. No privileged environment import, service-role
runtime usage, fixture adapter, CMS token or seed is introduced. Static logging
review finds no campaign/Auth token/claim/PII dump; the existing CMS fallback
logger emits a controlled boundary message rather than the raw error object.

Public/Studio/Kuliah contracts, homepage/profile/gallery/contact and admin route
regressions are rerun offline. Desktop/mobile campaign pages, admin roles/MFA/
Users, conflict/reload, modal accessibility and actual lecture PNG/PDF downloads
remain part of the regression evidence.

## Verification results

**864/864 unique tests passed: 848 baseline + 16 new adversarial cases.**
No skipped, cancelled or failed cases. Extra assertions in an existing test and
repeat verification runs are not added to the unique count.

| Suite | Passed |
| --- | ---: |
| Campaign database + additive upgrade | 67 + 14 = 81 |
| Feature flags local + contracts/upgrade | 42 + 14 = 56 |
| Lifecycle local + contracts/upgrade | 140 + 16 = 156 |
| Management local + contracts/upgrade | 76 + 34 = 110 |
| Public/editorial local + contracts/upgrade | 55 + 50 = 105 |
| Foundation SQL/policy/MFA + real local stack | 28 + 8 + 8 + 31 = 75 |
| Admin browser, including actual PNG/PDF downloads | 22 |
| Public/Studio/Kuliah contracts and regressions | 243 |
| New cross-boundary adversarial suite | 16 |
| **Total** | **864** |

Production Webpack build, TypeScript, lint and generated public-schema type
parity passed. Both production browser scans passed across 259 chunks: no
privileged secret/import or test adapter/fixture leak; production admin adapters
remain zero. The strengthened 22-case browser suite, TypeScript and affected
lint were rerun after the final export assertions. All six migration SHA-256
hashes match preflight; no runtime, migration, schema/type or dependency changed.
Documentation local-link checks and `git diff --check` passed.

Real local service inventory: Supabase CLI 2.78.0, PostgreSQL 17.11
(`17.11.0.003` image), Auth/GoTrue v2.187.0, PostgREST v14.5, Kong 2.8.1,
Realtime v2.78.10, postgres-meta v0.96.1 and Studio
`2026.03.04-sha-0043607`. These are observed local versions, not hosted readback.

The final fresh `db reset --local --no-seed` applied all six historical
migrations successfully. Independent post-reset inventory confirmed:

| Relation / fixture | Final count |
| --- | ---: |
| Campaign descriptors, campaigns, system flags | 0 each |
| Foundation audit, invitations, profiles | 0 each |
| Auth users, identities, sessions, refresh tokens | 0 each |
| MFA factors, AMR claims, challenges, Auth flow state | 0 each |
| `local_fixture%` validator functions / temporary roles | 0 each |
| Production application admin adapters | 0 |

The approved `campaign_scheduler` capability remains NOLOGIN/NOINHERIT,
NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOREPLICATION/NOBYPASSRLS. No disposable
executor membership remains. The platform-created membership for trusted
`postgres`, granted by `supabase_admin`, remains administrative only
(`admin_option=true`, `inherit_option=false`, `set_option=false`); application
roles have no membership. It is not a hosted Cron executor configuration.

### Reproduction and evidence

Run from the repository root in PowerShell, with Docker Linux engine available:

```powershell
$env:NODE_OPTIONS='--import=./scripts/campaign-engine/public-editorial-fixture.mjs'
$env:NEXT_PUBLIC_SANITY_PROJECT_ID='2o95jmms'
$env:NEXT_PUBLIC_SANITY_DATASET='production'
$env:NEXT_PUBLIC_SANITY_API_VERSION='2026-09-01'
$env:NEXT_TELEMETRY_DISABLED='1'
npm.cmd run build -- --webpack
npm.cmd run campaign:public:test
npm.cmd run campaign:management:test
npm.cmd run campaign:lifecycle:test
npm.cmd run campaign:flags:test
npm.cmd run campaign:upgrade:test
npm.cmd run admin:db:test
npm.cmd run admin:policy:test
npm.cmd run admin:mfa:test
$publicTests = @('scripts/public-content','scripts/lecture-generator','scripts/sanity-migration') | ForEach-Object {
  Get-ChildItem -LiteralPath $_ -Filter '*.test.mjs' | ForEach-Object FullName
}
node --test $publicTests
npm.cmd run campaign:public:local:test
npm.cmd run campaign:management:local:test
npm.cmd run campaign:lifecycle:local:test
npm.cmd run campaign:flags:local:test
npm.cmd run campaign:local:test
npm.cmd run admin:local:test
npm.cmd run admin:e2e
npm.cmd run admin:local:reset
node --test scripts/campaign-engine/security-local.test.mjs
npm.cmd run admin:local:reset
npm.cmd run admin:types:check
node node_modules/typescript/bin/tsc --noEmit
npm.cmd run lint -- .
npm.cmd run admin:bundle:check
npm.cmd run campaign:management:bundle:check
git diff --check
```

The adversarial suite resets its disposable database during cleanup; the final
independent reset and count inspection above confirm the resulting inventory.
The public Sanity values configure the offline GROQ fixture, not a live CMS
request. Keep the preload active for all child app/browser-verification servers.

Local evidence files under the task's `outputs` directory are
`FASA-7.6-BASELINE-EVIDENCE.json`, `FASA-7.6-FINAL-EVIDENCE.json`,
`f76-security-local-final.log`, `f76-admin-browser-final.log`, `f76-build.log`,
`f76-final-reset.log` and `f76-types-final.log`, alongside per-suite logs.
They contain verification summaries, not privileged credentials. Evidence
artifacts outside the repository are not part of the checkpoint.

## Findings

**BLOCKER — none found within the reviewed local matrix.** No runtime patch or
architecture change was required. This is bounded verification evidence, not a
claim that local fixtures establish hosted provider behavior.

**HARDENING H-01 — completed:** browser-originated HTTP requests in the existing
Foundation/browser/export suite now abort non-loopback destinations, matching
the existing Node offline transport restriction. This prevents automatic CMS
resource access during regression verification without altering runtime code.

**HARDENING H-02 — completed:** the existing real-export case now validates PNG
and PDF bytes/geometry/structure, rather than relying only on file extension and
successful download. This strengthens evidence without inflating test counts.

**DEFERRED D-01 — hosted integration and scheduler:** real hosted migration,
provider/session/CMS verification and the Cron executor/activation gate below
remain outside this phase.

**DEFERRED D-02 — deployment controls:** framework upstream buffering and
deployment request-size/rate limits remain Fasa 11 concerns; route-level byte
bounds do not prove network rejection before upstream EOF.

**DEFERRED D-03 — domain workflows:** zero production descriptors/adapters and
absent registration/payment modules are intentional. Fixture success does not
claim a production domain/editor/admission workflow exists.

**DEFERRED D-04 — hosted image fidelity:** offline regression intentionally
refuses Sanity CDN image access. Expected image-proxy/fallback errors appear in
local browser logs; genuine PNG/PDF structure passes with available offline
content. Hosted portrait/image fidelity and live CMS availability are not
certified, and no zero-runtime-error claim is made for these blocked resources.

## Deferred boundaries and owner review

- Hosted migration integration and real provider/session/CMS behavior are not
  verified by this local phase; no hosted resource access is authorized.
- Supabase Cron/pg_cron remains the intended provider. Actual hosted LOGIN
  executor, membership/SET ROLE model, worker/connection mode, entitlement,
  grants, cost, monitoring and job activation remain a separate owner gate.
  Before any future Cron executor grant, separately authorized hosted preflight
  must verify the exact safe scheduler role attributes (NOLOGIN, NOINHERIT,
  NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS) and expected
  memberships, including absence of runtime/unapproved executor membership.
- Domain descriptors/admin adapters remain zero. The first domain and positive
  production typed-editor workflow require their separately reviewed future phase.
- Next upstream body buffering remains outside route-level retention limits.
  Deployment request-size/rate limits and production hardening remain Fasa 11.
- There is no registration/payment/participant/volunteer/domain CTA or admission
  workflow to verify. Fasa 8+ remains unstarted.

ROADMAP records 7.6 complete / owner-approved while overall Fasa 7 remains
in progress / not complete. 7.C and Fasa 8 remain not started. Hosted migration,
deployment and Cron activation remain outside this local checkpoint.
