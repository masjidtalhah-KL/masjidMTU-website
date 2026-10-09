# Fasa 7.4 — Admin Campaign Management

**Fasa 7.4 complete / owner-approved — local implementation checkpoint.**
Baseline: `27fbed8a471fa437ed4d1626d686dfed074f8cf8`, tag
`phase-7.3-campaign-lifecycle-scheduling`. Fasa 7.0–7.4 are owner-approved;
overall Fasa 7 remains in progress/not complete. Checkpoint:
`phase-7.4-admin-campaign-management`; resolve the tag for the checkpoint commit.

Contracts: [architecture](CAMPAIGN-ENGINE-PLAN.md),
[database](CAMPAIGN-ENGINE-DATABASE.md), [flags](CAMPAIGN-FEATURE-FLAGS.md),
[lifecycle](CAMPAIGN-LIFECYCLE.md), [roadmap](ROADMAP.md).

## Scope and production empty state

This checkpoint adds protected list/detail/new pages, safe management reads,
create/core-update infrastructure, typed admin adapter boundary, schedule and
lifecycle controls, safe campaign history, conflict handling and responsive UI.
It extends the existing Admin Foundation shell; no second layout or design system.

Production **campaign descriptors = 0; admin adapters = 0; flag seeds = 0**.
`/admin/campaigns/new` deliberately displays **“Belum ada jenis kempen yang
tersedia.”** A reviewed future domain migration must install a descriptor and a
matching reviewed application adapter before its form becomes available. There
is no raw type-key input, arbitrary form builder, raw JSON editor, generic type,
dummy domain, environment switch or hidden production fixture.

Existing campaigns without an available adapter remain safely inspectable and
can use separately authorized schedule/lifecycle commands. Their core/config
editor displays **“Editor jenis kempen tidak tersedia”**; configuration is not
discarded, replaced with defaults or exposed through a generic form fallback.
DB create success is verified with isolated local descriptors, not a fabricated
successful production creation screen. The pure test seam may inject adapters;
the application and browser registry stay empty.

## Additive database management boundary

Migration: [`20261009083553_campaign_admin_management.sql`](../supabase/migrations/20261009083553_campaign_admin_management.sql).
All four historical migrations are unchanged. No table, seed, RLS policy,
existing function replacement, scheduler membership or schema exposure is added.

| Public authenticated wrapper | Private guarded implementation | Purpose |
| --- | --- | --- |
| `admin_campaign_types()` | `campaign_type_catalog()` | At most 100 safe descriptor tuples |
| `admin_campaign_detail(uuid)` | `campaign_management_detail(uuid)` | Fresh safe detail, null for unknown UUID |
| `admin_campaign_create(jsonb)` | `campaign_management_create(jsonb)` | Validated draft/private creation |
| `admin_campaign_update(uuid,integer,jsonb)` | `campaign_management_update(uuid,integer,jsonb)` | Exact core update under version lock |

Public wrappers are SECURITY INVOKER; guarded implementations are SECURITY
DEFINER owned by the trusted migration owner with fixed empty `search_path`.
EXECUTE is revoked from PUBLIC, anon, authenticated, service_role,
supabase_auth_admin, authenticator and campaign_scheduler, then granted only to
authenticated for these four wrappers and their four independently guarded
implementations. The internal payload validator/projection receive no runtime
EXECUTE. PostgREST exposes public only; private remains inaccessible. Existing
RLS and lack of authenticated raw SELECT/INSERT/UPDATE/DELETE remain unchanged.
This follows the repository's approved wrapper pattern and the official
[database function security guidance](https://supabase.com/docs/guides/database/functions).

`campaign_management_payload` validates exact keys, normalized slug, bounded
operational title, positive config version, <=4096-byte JSONB configuration and
the migration-installed private validator. `campaign_management_projection`
returns explicit fields only. Detail contains identity/type/config version,
title/slug/status, four windows, visibility/opt-ins, validated config, version,
timestamps, derived slug-editable state and optional safe editorial binding.
No creator/updater IDs, validator names, ACLs, auth/session or raw audit fields.

Existing `campaign_foundation_list(50)`, `campaign_audit_history(id,50)`,
`admin_campaign_window`, `admin_campaign_lifecycle` and `admin_campaign_schedule`
are reused. Catalog over its finite bound fails unavailable rather than silently
presenting an incomplete intersection. Unknown detail is null/HTTP 404; invalid
identity is rejected. A database failure is unavailable/503, never an empty list.

## Create and core-update contracts

Create POST `/admin/api/campaigns` accepts exactly:

```json
{
  "type_key": "<reviewed installed type>",
  "config_version": 1,
  "slug": "<normalized unique slug>",
  "title": "<operational title>",
  "configuration": {}
}
```

The example describes a shape, not a registered type or valid domain config.
DB creation always derives UUID/actors/timestamps/version, status draft,
visibility private, false display opt-ins, null registration/event windows and
version 1. Payload cannot choose status, windows, actor/role, result version,
editorial links or flags. Exactly one atomic `campaign.create` event uses
expected version 0/resulting version 1; audit failure rolls back insertion.
No hard delete exists.

Core POST `/admin/api/campaigns/[id]` requires `expectedVersion` plus exactly:
`slug`, `title`, `visibility`, `scheduled_public_display`,
`archived_history_display`, `config_version`, `configuration`. It cannot alter
type, status, windows, actor IDs, binding or flags. There is no arbitrary PATCH.
The DB checks expected version under campaign row lock **before no-op**. Stale
identical requests also conflict (PT409/HTTP 409). A genuine current-version
identical request returns changed=false without version/audit. Real changes
increment once and append one `campaign.update` with exact allowlisted
`changed_fields`; audit failure rolls back the entire mutation.

Slug is editable only in draft before it has ever been sealed. Leaving draft
seals it permanently; unscheduling does not unlock it. Updates preserve this
existing row guard. Config version changes require a reviewed DB descriptor and
exact application adapter at both the existing and proposed versions; type is
immutable. No application DB DML or service-role runtime key is introduced.

## Typed adapter intersection

[`admin-registry.ts`](../src/lib/campaigns/admin-registry.ts) contains a frozen
empty production registry and a typed adapter factory. A future adapter owns
exact type/config/module tuple, label, validated defaults, exact configuration
parser and domain-specific form component. `defineCampaignAdminAdapter<C>`
retains a concrete config type behind the common boundary.

Catalog and adapter must match all three tuple fields. Unknown/mismatched or
duplicate adapters, unsupported versions, malformed defaults/configs and parser
errors fail closed. A parser cannot silently strip unknown fields or manufacture
defaults: original and parsed canonical JSON must match. Configuration remains
bounded JSON; no function, non-finite number or exotic object is accepted.
Future forms must use their concrete parser; no fallback editor is provided.
Test descriptors/validators are installed only inside the local harness and
removed by no-seed reset. Test adapters exist only in test imports/injected pure
calls; production bundle scanning verifies they are absent.

## Authorization and routes

| Capability | Staff | Admin | Super-admin |
| --- | --- | --- | --- |
| Catalog/list/detail/windows | Read | Read | Existing AAL2 operational guard |
| Create/core/schedule/lifecycle | Denied | Manage | AAL2 + verified TOTP + recent signed step-up |
| Safe campaign-only history | Denied | Read | Existing operational MFA |
| Users/invites/global flag changes | Denied | Denied | Existing owner-only rules unchanged |

Fresh verified server context and live DB membership remain independent
authorities. Disabled/revoked/outsider/anon are denied; client metadata cannot
change role or impersonate scheduler. Staff pages contain no mutation forms,
lifecycle controls or audit history. AAL1 owners follow existing MFA routing;
stale step-up is denied even if UI state was previously authorized.

Protected routes are `/admin/campaigns`, `/admin/campaigns/new` and
`/admin/campaigns/[id]`, inside the existing `(protected)` group. The existing
navigation gains **Kempen**, including mobile navigation and current-route state.
No public cookie/proxy expansion, Studio change or alternate shell. Safe MFA
return paths accept these exact protected paths/canonical UUIDs only.

## Operational UI, schedule and lifecycle

List is bounded to 50 campaigns and shows title/type/status (text, not colour
alone), visibility, windows, version and display opt-ins, without configuration.
Empty catalog/empty list are deliberate states; outages remain explicit errors.
Detail separates summary, core/config, schedule, lifecycle and activity sections.
Existing editorial binding is read-only; link/unlink/relink and Sanity campaign
schema/adapter remain deferred to 7.5.

Lifecycle controls reuse the exact 7.3 POST API and conceptual action sets:

| Stored state | Controls |
| --- | --- |
| draft | schedule, open, archive |
| scheduled | unschedule, open, close |
| open | pause, close |
| paused | resume, close |
| closed | archive |
| archived | none |

No status selector/PATCH/browser-clock authorization. A native labelled modal
offers cancel first, keyboard focus/Escape support and explicit confirmation.
Close cannot reopen; archive is terminal; draft schedule/open warns about the
permanent slug lock. Stale lifecycle actions are never replayed automatically.

Schedule editor reuses the exact 7.3 command, keeping registration/event windows
separate. All displayed/entered times explicitly use **Asia/Kuala_Lumpur / MYT
UTC+08:00**. Local input converts to an explicit UTC ISO instant; date-only,
ambiguous/invalid/rollover dates fail validation. Unchanged displayed fields
retain original DB microseconds rather than being rounded into an artificial
mutation. Open/paused registration-open is read-only; closed/archived schedules
are immutable. DB time/window validation remains authoritative.

An existing persisted close deadline that is already due is reconciled to
closed before considering proposed windows; proposed extension/event edits are
not persisted, version advances once, only lifecycle.close is audited with
schedule_edit_deadline and the original planned deadline. A future close may be
extended only before that existing deadline. No change to 7.3 reconciliation,
NOLOGIN capability, race/locking model or hosted provider gate.

Flags have no lifecycle side effects. This UI adds no flag mutation controls,
flag rows, implicit enable/pause/close or public availability path.

## Conflict, error and freshness boundaries

Every edit uses the loaded version. HTTP 409 displays:
“Kempen ini telah berubah sejak halaman dibuka. Muat semula data terkini sebelum
cuba lagi.” Further submission is blocked until explicit reload fetches fresh
canonical state. Unsaved form inputs stay mounted for manual comparison; config
is not auto-merged and destructive actions are not auto-retried. A failed/unknown
mutation response also requires reload before another detail mutation.

401 follows login; 403 follows denied/MFA/step-up as appropriate; 422 uses generic
safe validation copy; 503 shows operational unavailability. No SQL/internal
error text reaches the browser. Double submit is blocked with an immediate
submission lock and disabled controls. Labels, described error/status text,
visible focus, textual status and responsive layout reuse existing admin CSS.

Server-only DAL, force-dynamic protected pages/API, cookies/session authorization,
fresh uncached RPC and private/no-store JSON responses prevent operational CMS
cache or authenticated public storage. No Sanity dependency for authority, no
static authenticated page or browser persistent campaign cache.

## Request-body and same-origin boundary

Create/core POST require exact `application/json` media type and sameOrigin
**before** reading body; no query actions. Exact payload validation follows JSON
parse. The incremental reader retains at most **8192 UTF-8 bytes (8 KiB)** and
cancels overflowing/broken streams. This accommodates the <=4096-byte config
plus bounded title (<=160 code points), slug/type and finite command envelope.
DB also bounds the independently called RPC payload/config. No dependency added.
Content-Length is not trusted or required. Chunked/multibyte overflow is tested.
Existing 256-byte feature-flag and 1024-byte lifecycle readers are unchanged.

This is a **route-level retention** guarantee. Next 16.3.6 upstream/proxy buffering
is outside it; no early network rejection before upstream EOF is claimed.
Deployment-level size/rate limits remain Fasa 11, not implemented here.

## Local verification evidence

Final local verification completed successfully. New management
tests use real local PostgreSQL/Auth/PostgREST and real production Next/browser
requests. Ordinary Google identities/JWTs are isolated SQL/signed fixtures;
owner AAL2 uses genuine local Auth-issued TOTP. No hosted Google/Cron verification
claim. Upgrade/PGlite/Auth-stub contracts are supplementary. Production adapters
stay empty: positive typed form/create contracts use pure injection and DB
fixtures, not a hidden deployed test adapter. Existing admin browser regression
retains its documented synthetic HTTP adapter; real PNG/PDF exports are verified.
Public/Studio/Kuliah fixture regressions and local route checks do not write CMS.

| Suite | Passed / total |
| --- | --- |
| Management real local SQL/Auth/PostgREST/Next + Edge browser | 76/76 |
| Management typed contracts/body/time/DTO/form tests | 28/28 |
| Management additive upgrade (PGlite/Auth contracts) | 6/6 |
| Lifecycle real local + scheduler LOGIN/races/deadline hardening | 140/140 |
| Lifecycle contracts + additive upgrade | 16/16 |
| Campaign foundation real local | 67/67 |
| Campaign foundation additive upgrade | 14/14 |
| Feature flags real local | 42/42 |
| Flag contracts/body + additive upgrade | 14/14 |
| Foundation SQL/policy/MFA | 44/44 |
| Foundation real local stack | 31/31 |
| Existing admin browser + genuine PNG/PDF exports | 22/22 |
| Public/Studio/Kuliah fixture regressions | 243/243 |
| **Unique total** | **743/743** |

The complete 633-case baseline was rerun; 110 unique management cases were added.
Repeated runs after corrections are not counted twice. The new real browser
suite uses actual local Auth/PostgREST and production Next, not the older HTTP
adapter. It proves two distinct manager identities racing the same version,
rollback on forced audit failure, safe catalog/detail, raw-write/private/RPC
denial, actor forgery denial, owner TOTP/stale step-up, anonymous/inactive API
denial and same-origin/media-type/normal/chunked/multibyte body rejection.
Production Next correctly rejects fixture creation/core config editing because
the application registry is empty; DB success and injected typed contracts are
recorded separately. Staff has no forms/actions/audit. Real browser conflicts
preserve unsaved schedule input, require explicit reload and do not replay
destructive commands. Successful browser open/pause/resume/close/archive uses
the unchanged 7.3 API and exact resulting state/version/audit. Persisted-expired
deadline ignores proposed extension; future extension remains lifecycle-neutral.

The browser run caught and fixed a safe audit DTO reload mismatch: the API
already returns the minimized projection, so client reload validates that exact
shape rather than expecting raw DB target/actor metadata. Dedicated regression
contracts cover this boundary. Read/config versions retain the full DB integer
range; mutation expected-version overflow protection remains the 7.3 boundary.

Fresh reset, generated public type parity, TypeScript, lint (no warnings),
production Webpack build, changed-file secrets, docs/link checks and diff checks
pass. **256 production browser chunks** pass privileged-secret/import and
test-fixture/adapter scans. Desktop 1440, tablet 768 and mobile 390 have no
horizontal overflow, associated labels and visible focus. Confirmation dialogs
have cancel focus/Escape behavior. Local screenshots were visually reviewed.
Four historical migrations match their preflight byte hashes. Package-lock,
Auth/RLS/flags/lifecycle APIs and hosted configuration are untouched. The minimal
ROADMAP checkpoint update records owner approval; 7.5, 7.6 and 7.C remain unstarted.
The PGlite harness only adds a test analogue of the real PostgREST authenticator
role so the additive migration's explicit ACL revocation is tested faithfully.

Final owner-approved checkpoint verification reran **34/34 management contracts
+ additive-upgrade tests and 76/76 real-local SQL/Auth/PostgREST/Next/browser
tests**. The suite completed a fresh no-seed reset; descriptor/campaign/flag,
audit/Auth/profile/invite and test validator/role counts are zero. The scheduler
capability remains NOLOGIN with no runtime membership. Generated public type
parity, 256-chunk management/secret bundle scans, documentation/local links and
diff checks pass. These repeat the approved tests and do not increase the retained
**743/743 unique-test evidence**. No runtime change was needed for finalization.

Exact commands:

```text
npm run admin:local:reset
npm run admin:types
npm run admin:types:check
npm run build -- --webpack
npm exec -- tsc --noEmit
npm run lint
npm run campaign:management:test
npm run campaign:management:local:test
npm run campaign:lifecycle:test
npm run campaign:lifecycle:local:test
npm run campaign:local:test
npm run campaign:upgrade:test
npm run campaign:flags:test
npm run campaign:flags:local:test
npm run admin:db:test
npm run admin:policy:test
npm run admin:mfa:test
npm run admin:local:test
npm run admin:e2e
node --test scripts/public-content/*.test.mjs scripts/lecture-generator/*.test.mjs scripts/sanity-migration/*.test.mjs
npm run admin:bundle:check
npm run campaign:management:bundle:check
npm run admin:local:reset
git diff --check
```

PowerShell enumerates public test files before passing them to Node. Stack
suites run sequentially with no-seed resets; final cleanup proves zero campaigns,
descriptors, flags, audit/Auth/profile/invite fixtures, validator functions and
disposable roles. The approved campaign_scheduler NOLOGIN capability persists
without runtime membership or any Cron job. Generated types include only four
new public RPCs, not private helpers/scheduler. Historical migration byte hashes
are compared to the preflight record. Documentation/local links and changed-file
secret scans cover tracked and new files.

## Approved checkpoint and deferred boundary

No production descriptor/admin adapter, Qurban/Ramadan/volunteer/generic type,
registration, participant, payment, public `/kempen`, anonymous projection,
listing/sitemap, Sanity schema/write/binding control, flag-management UI, hosted
access/migration, Cron activation, deployment or Fasa 7.5 work. Hosted LOGIN
executor/entitlement/grants/cost/activation remain separately owner-authorized.
Owner approved the local implementation checkpoint with **743/743 unique tests
passed**. Fasa 7.5, 7.6 and 7.C remain unstarted; this approval does not authorize
hosted migration, deployment or Cron activation.
