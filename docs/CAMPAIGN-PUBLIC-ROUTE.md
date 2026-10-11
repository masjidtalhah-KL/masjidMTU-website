# Fasa 7.5 — Public Campaign Route + Gating

**Fasa 7.5 complete / owner-approved — local implementation checkpoint.**
Owner approval: 12 October 2026 (+08:00); implementation/full regression evidence
recorded on 9 October 2026. Checkpoint: `phase-7.5-public-campaign-route`;
resolve the tag for the final checkpoint commit.
Baseline `b2c8cc0dfe045587bcc780474a48bebe84b8340d`, tag
`phase-7.4-admin-campaign-management`. Canonical local/origin/remote main and tag
were equal and the tree was clean before implementation. Fasa 7.0–7.4 remain
owner-approved; overall Fasa 7 remains in progress. No hosted operational
access/mutation, deployment, Cron activation or 7.6 work. Only the owner-approved
local implementation checkpoint commit/tag/push is authorized by this closeout.

Contracts: [architecture](CAMPAIGN-ENGINE-PLAN.md),
[database](CAMPAIGN-ENGINE-DATABASE.md), [flags](CAMPAIGN-FEATURE-FLAGS.md),
[lifecycle](CAMPAIGN-LIFECYCLE.md), [admin management](CAMPAIGN-ADMIN-MANAGEMENT.md),
[ROADMAP](ROADMAP.md).

## Owner-approved implementation clarifications

Two implementation gates were explicitly resolved by the owner during 7.5:

- **Archived always returns 404 in 7.5**, even with `archived_history_display`.
  The 7.0 optional historical presentation is deferred because existing persisted
  metadata does not fully prove prior public eligibility. No inferred history,
  new publication marker or write-on-read was introduced.
- **Operational outage page returns neutral 500**, not 404 or a successful empty
  200. Next 16.3.6 App Router pages do not provide a general 503 status setter.
  The owner accepted the existing error-boundary status instead of broadening
  the `/admin` proxy to public routes. This explicitly refines the initial 7.0
  proposed 503 page contract; no unsupported status claim is made.

## Route and scope

`src/app/kempen/[slug]/page.tsx` implements the canonical detail route. It calls
one server-only campaign read service and renders the approved generic public
shell. The route component has no persistence query or eligibility formula.
Existing Navbar, PublicPageLayout/header, Container, Section, Heading, Card,
Badge, Footer and brand styles are reused. No new visual language, global Kempen
navigation item, index, listing or sitemap entry.

Eligible presentation contains title, controlled public state and available
registration/event instants in explicit Asia/Kuala_Lumpur / MYT UTC+08:00.
No raw configuration, arbitrary rich text, campaign type internals, actor IDs,
version, flags, audit data, editorial locator or internal denial reasons are sent
to public React props. No CTA, form, submission or operational readiness grant.

The page now resolves published editorial through the existing reviewed `program`
schema after operational eligibility. No Sanity schema, document, binding command
or write is created. Exact binding is authoritative; no title/slug join or invented
document ID is used. The minimal title/state page remains the fallback described
by the locked architecture.

## Published editorial adapter and stable binding

Capability inspection covered all existing Sanity schemas, the token-free public
client/environment validation, published GROQ helpers, fallback policy and image/
plain-text serializers. `program` already represents descriptive public programme
content and has a required plain-text `description` of at most 400 characters.
That existing field supplies the minimum descriptive campaign shape without a
new schema. `newsPost` rich article content and image/Portable Text serializers
are unnecessary for this minimum adapter. No schema design gate or schema change.

The operational RPC adds just `editorial_locator`: null, or exact non-secret
`{project_id,dataset,document_type,document_id}`. The database emits a locator only
after every operational gate passes and only for the reviewed type `program`.
The existing complete binding constraints enforce ID/project/dataset syntax and
reject `drafts.*`/`versions.*`. The server independently validates the four-key
shape, exact configured public Sanity project/dataset and reviewed type. It never
constructs a client from caller/binding-selected environment values.

`public.ts` loads the server-only editorial module lazily after successful
operational projection and a syntactically valid locator. The published reader
uses the existing configured client with `perspective: published`, no token,
no CDN, no-store, 8-second timeout and no retries. The parameterized query is:

```groq
*[_id == $documentId && _type == "program" &&
  !(_id in path("drafts.**")) && !(_id in path("versions.**"))][0]{_id,_type,description}
```

Only exact returned published ID/type and bounded plain-text description are
accepted. Locator, IDs and all unknown fields are discarded before public React
props. Description is rendered as escaped React text; no HTML renderer, raw JSON,
image/domain CTA or operational override. Sanity title/slug, `isActive`, dates,
registration URL and invented flag/lifecycle fields are neither queried nor used
as campaign authority. Editorial prose still needs ordinary editorial review;
this adapter does not infer prices/consent/registration readiness from prose.

| Case | Composition behavior |
| --- | --- |
| Operationally denied, including global/module OFF, draft, archived | Neutral 404; editorial resolver/query is never invoked |
| Eligible + exact published `program` description | Enrich generic presentation with description only |
| Eligible + no binding, missing/deleted/draft/version document, wrong ID/type/project/dataset | Minimum operational title/state/windows; no guessed join |
| Malformed/empty/oversized description or control characters | Omit editorial; minimum operational page |
| HTML-shaped string | Plain escaped text only; cannot execute markup/script |
| Temporary editorial network/408/429/5xx failure | Minimum page under existing approved public-content fallback policy |
| Permanent query/auth/configuration failure | Sanitized unavailable 500 under existing public-content policy; no raw error details |

Operational title/state/dates always win. Paused/closed remain operationally
determined; published editorial never makes a campaign available. No binding
link/unlink/relink controls are added; those require their separate audited
management boundary. This completes the 7.5 published adapter, not a CMS write path.

## Database projection and reuse

Additive migration:
`supabase/migrations/20261009113217_campaign_public_projection.sql`.
Created by the pinned local CLI `migration new`; no table, seed, policy, role or
index changes. All five historical migration files remain byte-for-byte unchanged.

| Function | Actual boundary |
| --- | --- |
| `private.campaign_registration_window_available(text,timestamptz,timestamptz,timestamptz)` | Internal immutable shared formula: stored open, opens null/due, closes null/future, supplied authoritative instant. No runtime EXECUTE. |
| `private.campaign_window_state(uuid)` | Replaced additively to delegate to that formula; existing live admin read guard, exact DTO and authenticated ACL preserved. |
| `private.system_flag_effectively_enabled(text)` | Internal registry-supported flag read; absent/OFF/unsupported is false. No raw public snapshot or runtime EXECUTE. |
| `private.system_feature_flags_read()` | Replaced additively to reuse that flag evaluator; existing campaign-read guard, bounds, exact admin DTO and ACL preserved. |
| `private.campaign_public_projection(text)` | Migration-owned fixed-empty-search-path definer; unchanged operational gates, safe DTO plus optional allowlisted non-secret locator or SQL NULL. Internal only. |
| `public.public_campaign_page(text)` | Tiny fixed-empty-search-path definer wrapper with explicit EXECUTE only for anon/authenticated. Both direct PostgREST and server service use identical projection. |

The public wrapper is deliberately definer so **anon receives no private-schema
USAGE or helper EXECUTE**. It has no actor/mutation authority and accepts only
bounded normalized slug. All new functions revoke default PUBLIC and runtime
grants; service_role, supabase_auth_admin, authenticator and campaign_scheduler
are not given EXECUTE on the wrapper. Trusted migration owner retains ownership.
Existing raw private grants/RLS and all owner/campaign mutation guards are unchanged.

The projection reuses reviewed `system_flag_supported` and exact
`campaign_management_payload` descriptor/config validator. Unknown type/version,
missing descriptor or invalid configuration returns neutral NULL; unexpected
dependency/validator failures become sanitized `PT503` at the direct Data API,
then the approved neutral 500 page boundary. SQL relation/function details are
not exposed. Errors never become fallback ON.
Only the single public RPC is added to generated public database TypeScript types.
No private schema or scheduler types are generated for the browser.

## Public eligibility and display contract

All of these are required in the database: valid normalized slug; campaign exists;
exact reviewed type/config descriptor and valid config; `campaigns.enabled` ON;
descriptor-derived module flag ON; public/unlisted visibility; permitted state
and applicable public-display opt-in. Missing flags are OFF. Callers cannot
choose their module key, public state, actor, time or capability.

| Stored state / condition | Public result |
| --- | --- |
| Unknown/malformed slug, missing/unsupported descriptor/config | Neutral 404 |
| Global/module missing or OFF | Neutral 404 for every lifecycle, including closed |
| Private visibility | Neutral 404 |
| Draft | Neutral 404, never reveals unpublished title/windows |
| Scheduled, public-display opt-in OFF | Neutral 404 |
| Scheduled, opt-in ON, future or due opening not yet reconciled | 200, `Pendaftaran belum dibuka`; never treated as open |
| Open, opening absent/due and closing absent/future | 200, `Kempen aktif`; descriptive only |
| Open with inconsistent future opening | Neutral 404, fail closed |
| Paused, deadline not reached | 200, `Pendaftaran dihentikan sementara`; no internal reason |
| Scheduled with opt-in ON / open / paused, persisted close already due | 200 read-only closed display, without changing stored state |
| Closed | 200 read-only, `Pendaftaran telah ditutup` |
| Archived, either history opt-in value | Neutral 404 under the owner-approved 7.5 boundary |
| Configuration/database/RPC/transport unavailable | Neutral 500 error boundary; no campaign metadata, no false 404/200 |

There is no second campaign `enabled` boolean. Instance disable/nonvisibility
uses existing visibility/state and public-display opt-in semantics; temporary
registration suspension remains paused. Flags never change lifecycle.

The anonymous operational DTO has exactly nine fields: `slug`, `title`, `state`,
`unlisted`, `registration_opens_at`, `registration_closes_at`, `event_starts_at`,
`event_ends_at`, `editorial_locator`. The last field is removed during composition;
the public component receives the original eight operational fields and an
independent description-only editorial object, never the locator.
`state` is a controlled public display state, not raw stored lifecycle/version.
The server parser rejects missing/extra DTO keys, malformed operational values,
mismatched slug, unsupported public states and invalid timezone/date ranges.
Malformed/unsupported locator is ignored for the minimal fallback. React renders plain
text; there is no `dangerouslySetInnerHTML` or public configuration editor.

## Descriptor and adapter boundary

Production descriptors = **0**, production admin adapters = **0**, flag seeds = **0**.
No generic/Qurban/Ramadan/volunteer/domain descriptor is installed. Consequently
the production route cannot currently show a campaign: guessed URLs fail closed.

Generic public presentation requires the reviewed **DB descriptor and validator**;
it does not use or bypass the empty typed admin form adapter registry. Public
presentation has no domain/config editor to install. The existing 7.4 exact
descriptor + admin adapter intersection remains unchanged for create/edit forms.
There is no application test-mode environment switch, hidden browser adapter or demo seed.
Positive public QA uses an isolated local descriptor/validator and explicit offline
published editorial fixtures only.

## Scheduling, flags and request-time truth

One fresh `clock_timestamp()` is used after lookup/validation for the public
decision. At `registration_closes_at <= DB now`, open/paused (and opted-in
scheduled) presentation is closed even when the worker is late. It never claims
new admission is available. Due scheduled opening still waits until the actual
scheduled → open command commits. Draft and paused never auto-open/resume.

The public read does not reconcile/mutate state, version, flags, profiles or audit.
The approved scheduler, actor capability, lifecycle and schedule commands are
unchanged. Hosted Cron/pg_cron execution identity/activation remains a separate
owner-authorized gate. Public reads require no scheduler secret or service-role key.

## Server, cache and browser boundary

`src/lib/campaigns/public.ts` is server-only and creates an anonymous
publishable-key client using the existing validated environment contract.
No admin cookie client, browser session, getUser/getClaims or auth refresh is
used. PersistSession/autoRefresh/detectSessionInUrl are disabled; RPC reads have
an 8-second transport timeout and fetch `cache: no-store`. No public Auth user,
session or cookie is created. `/admin` proxy matcher/cookie path are unchanged.

The page is `force-dynamic`, `revalidate=0`; genuine response headers are no-store.
React `cache` only deduplicates a read within one request, never between requests.
Both the operational and bound editorial reads are no-store. No CMS cache, static
generation, ISR, LRU or merged operational content cache.
Initial pages are conservatively noindexed, including unlisted, with no listing
or search-index commitment. Existing homepage/Kuliah editorial caching is unchanged.

The campaign branch bypasses the public outgoing transition retention, while
existing `/admin` and `/studio` isolation remains intact. Desktop/mobile reload
after kill-switch OFF becomes neutral 404 without retaining the old campaign UI.
A previously open tab is a descriptive snapshot, not continuously pushed live
authority; future domain submissions must atomically revalidate eligibility.
No working CTA exists in 7.5, and no stale page can confer admission.

## Local verification and evidence boundary

Focused contracts/upgrade/editorial: **50/50**. Genuine local
PostgreSQL/Auth-schema/PostgREST/production-Next/Edge browser cases: **55/55**.
No hosted Google, hosted scheduler or production descriptor verification claim.
Positive anonymous projection uses real PostgREST, not an Auth HTTP stub. Local
identity/MFA setup is explicitly a SQL/signed fixture; it is not a new genuine
TOTP/OAuth assertion. Existing Foundation regressions retain their evidence types.

Covered: flags absent/OFF/ON, all six stored states and opt-ins, visibility,
unknown/direct guessing, exact public DTO, no actor/config/type leakage, runtime
ACL/raw API denial, forged metadata, DB-time deadline, delayed opening, no writes
on reads, no-store change visibility, 404/500 distinction, desktop 1440/mobile 390,
responsive layout, date timezone, no auth cookies/forms/CTA/nav addition, no
outgoing retained content and existing route smoke checks. Corrupt descriptor/config
checks deliberately bypass constraints only inside a local rollback transaction;
ordinary API bypass tests preserve all guards and grants.

The original **808/808** candidate evidence is preserved. All original tests were
rerun, with the exact DTO assertion updated for the approved ninth locator field.
The editorial completion adds **40/40** composition/locator/GROQ/transport/browser
cases: **848/848 unique tests passed**, without counting repeated cases twice.
Twenty new contracts and twenty new real-local cases prove stable published-ID
resolution, CMS missing/draft/version/wrong binding fallback, zero CMS queries
after operational denial, no locator/private-field React leakage and escaped HTML.
CMS evidence is actual local GROQ transport/fixtures, never live Sanity.

Final checkpoint verification on 12 October 2026 reran the focused **50/50**
contracts/upgrade/editorial and **55/55** genuine real-local/browser cases.
Generated type parity, production bundle/secret scans, documentation/local links
and diff checks passed; final no-seed reset again left all fixtures at zero.
Only owner-approved documentation/status finalization changed since review;
the full **848/848** regression evidence above is retained, not claimed as a
second full regression run during checkpoint finalization.

| Suite | Passed / total | Evidence boundary |
| --- | --- | --- |
| Public contracts + additive upgrade + editorial | 50/50 | Original 30 retained, 20 editorial cases added |
| Public real local + browser | 55/55 | Original 35 retained, 20 offline editorial cases added |
| Campaign management contracts + upgrade | 34/34 | Existing contracts and additive upgrade |
| Campaign management real local | 76/76 | Existing local DB/API/browser matrix |
| Lifecycle contracts + upgrade | 16/16 | Existing contracts and additive upgrade |
| Lifecycle real local | 140/140 | Existing local scheduler/deadline/race matrix |
| Campaign foundation upgrade | 14/14 | Existing additive upgrade |
| Campaign foundation real local | 67/67 | Existing real SQL/Auth-schema/PostgREST |
| Flag contracts + upgrade | 14/14 | Existing contracts and additive upgrade |
| Flag real local | 42/42 | Existing real Next/Auth/PostgREST |
| Foundation SQL / policy / MFA | 28 + 8 + 8 = 44/44 | Existing database and application contracts |
| Foundation real local stack | 31/31 | Existing genuine local Auth/PostgREST/TOTP matrix |
| Admin browser | 22/22 | Existing synthetic Auth adapter; offline editorial fixture |
| Public / Studio / Kuliah | 243/243 | Existing fixture/contract regressions |
| **Final candidate total** | **848/848** | **Local evidence only; original 808/808 preserved** |

TypeScript, lint, production Webpack build, generated public type parity,
documentation/local-link checks and `git diff --check` passed. The 259 production
browser chunks contain no privileged secret import/value or test campaign
adapter/fixture. Real PNG/PDF files downloaded in the existing browser test;
editorial content came from the repository snapshot and external portrait/image
requests were refused, so this does not verify live CMS/image fidelity.

The final fresh no-seed reset applied all six migrations. Descriptor, campaign,
flag, audit, invite, profile, Auth user/identity/session/MFA-factor counts are all
**0**; fixture validators and roles are **0**. Production admin adapters remain
**0**. `campaign_scheduler` remains NOLOGIN/NOSUPERUSER/NOCREATEDB/NOCREATEROLE/
NOREPLICATION/NOBYPASSRLS with no runtime membership. The five historical
migrations match their preflight byte hashes. No hosted verification is claimed.

## Offline build and reproduction

Automatic approval review rejected a build that could access hosted Sanity.
The safer `scripts/campaign-engine/public-offline.mjs` verification-only preload
refuses non-loopback fetch/http/https I/O and propagates to Next build workers/test
processes. It does **not** inject published success data. Existing editorial
network-failure policy supplies its approved fallback/unavailable state.
Production Webpack build succeeds offline, with `/kempen/[slug]` dynamic.
Local public smoke coverage therefore proves fallback/fixture regressions, not
live Sanity availability; there were no hosted CMS reads/writes in this phase.
The preload is not imported by application runtime or deployed code.

For the unchanged admin browser poster/export assertions, the additional
verification-only `public-editorial-fixture.mjs` evaluates actual read-only GROQ
against `docs/LECTURE-FIRST-PUBLICATION-DRY-RUN.json` plus explicit test-only
program documents. It intercepts only lectureMonth queries and the exact bound
program read query on the configured endpoint; all other non-loopback I/O stays
refused. A test-only query trace proves denied/wrong-environment paths make zero
program queries. No trace endpoint or fixture environment switch is added to the app.
This is explicit test transport, never a production fallback. A second Webpack
build and the 22 browser cases passed with this snapshot. Neither offline build
is deployed, and no live Sanity content/availability claim is made.

```powershell
$offlineUri = [Uri]::new((Resolve-Path scripts/campaign-engine/public-offline.mjs).Path)
$env:NODE_OPTIONS = '--import="' + $offlineUri.AbsoluteUri + '"'
$env:NEXT_PUBLIC_SANITY_PROJECT_ID = '2o95jmms'
$env:NEXT_PUBLIC_SANITY_DATASET = 'production'
$env:NEXT_PUBLIC_SANITY_API_VERSION = '2026-09-01'
npm.cmd run admin:local:reset
npm.cmd run admin:types
npm.cmd run build -- --webpack
npm.cmd run campaign:public:test
$fixtureUri = [Uri]::new((Resolve-Path scripts/campaign-engine/public-editorial-fixture.mjs).Path)
$env:NODE_OPTIONS = '--import="' + $fixtureUri.AbsoluteUri + '"'
npm.cmd run campaign:public:local:test
npm.cmd run campaign:management:test
npm.cmd run campaign:management:local:test
npm.cmd run campaign:lifecycle:test
npm.cmd run campaign:lifecycle:local:test
npm.cmd run campaign:local:test
npm.cmd run campaign:upgrade:test
npm.cmd run campaign:flags:test
npm.cmd run campaign:flags:local:test
npm.cmd run admin:db:test
npm.cmd run admin:policy:test
npm.cmd run admin:mfa:test
npm.cmd run admin:local:test
npm.cmd run admin:local:reset
$fixtureUri = [Uri]::new((Resolve-Path scripts/campaign-engine/public-editorial-fixture.mjs).Path)
$env:NODE_OPTIONS = '--import="' + $fixtureUri.AbsoluteUri + '"'
npm.cmd run build -- --webpack
npm.cmd run admin:e2e
$regressionFiles = @(Get-ChildItem scripts/public-content,scripts/lecture-generator,scripts/sanity-migration -Filter '*.test.mjs' -File | ForEach-Object { $_.FullName })
node --test @regressionFiles
npm.cmd exec -- tsc --noEmit
npm.cmd run lint
npm.cmd run admin:bundle:check
npm.cmd run campaign:management:bundle:check
npm.cmd run admin:local:reset
npm.cmd run admin:types:check
git diff --check
Remove-Item Env:NODE_OPTIONS
```

Stack-mutating suites run sequentially. No-seed cleanup removes local descriptors,
campaigns, flags, audit/Auth/profile/invite fixtures, local validators and disposable
roles. Approved campaign_scheduler NOLOGIN capability persists without runtime
membership. Test secrets remain in memory; no .env or credential file is added.

## Explicit deferred scope / checkpoint stop

No registration/submission, participant/customer/member record, Qurban/Aqiqah,
Ramadan, volunteer, khairat, Quran Class, payment/receipt, email, upload,
capacity/quota booking, public index/listing/sitemap, operational CTA, Sanity
schema/write, public history proof, domain descriptor/adapter, hosted scheduler,
hosted migration/deployment or Fasa 7.6 implementation. Stop after the approved
7.5 checkpoint; 7.6 and 7.C remain not started.

Official [Supabase function security](https://supabase.com/docs/guides/database/functions)
and [changelog](https://supabase.com/changelog), pinned Next 16.3.6 local page,
not-found, error and caching guides, and existing repo contracts were consulted.
