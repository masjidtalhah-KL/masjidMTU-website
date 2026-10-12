# Fasa 7.C — Campaign Engine Final Owner Checkpoint

**Fasa 7 complete / owner-approved — local implementation foundation.**
12 October 2026 (+08:00). Fasa 7.0–7.6 and this documentation-only 7.C closeout
are approved. Baseline canonical main: `65879c3a5d128dc60e72ac1ca9880caab1fa11a5`.
Final checkpoint: `phase-7-campaign-engine-complete`; resolve the tag for its
commit. This records local foundation completion, not production readiness,
hosted Campaign Engine verification or scheduler activation.

Fasa 8 — Qurban MVP is next and **not started**. No domain design or implementation
is authorized by this closeout. The source records below remain the detailed
contracts and evidence; this document consolidates their final boundaries.

## Approved checkpoints and evidence progression

All seven implementation/architecture tags were verified locally and against
canonical remote refs, with each commit an ancestor of the closeout baseline.
Counts are cumulative unique-test evidence at each checkpoint, not additive.

| Phase / canonical record | Checkpoint tag | Verified commit prefix | Approved evidence |
| --- | --- | --- | --- |
| [7.0 architecture lock](CAMPAIGN-ENGINE-PLAN.md) | `phase-7.0-campaign-engine-architecture` | `5d80473d9143` | Architecture-only |
| [7.1 database/RLS](CAMPAIGN-ENGINE-DATABASE.md) | `phase-7.1-campaign-database-foundation` | `20daf8d28e96` | 421/421 local |
| [7.2 feature flags](CAMPAIGN-FEATURE-FLAGS.md) | `phase-7.2-feature-flag-service` | `ef989f8102f3` | 477/477 local |
| [7.3 lifecycle/scheduler](CAMPAIGN-LIFECYCLE.md) | `phase-7.3-campaign-lifecycle-scheduling` | `27fbed8a471f` | 633/633 local |
| [7.4 admin management](CAMPAIGN-ADMIN-MANAGEMENT.md) | `phase-7.4-admin-campaign-management` | `b2c8cc0dfe04` | 743/743 local |
| [7.5 public/editorial](CAMPAIGN-PUBLIC-ROUTE.md) | `phase-7.5-public-campaign-route` | `405a5987794e` | 848/848 local; original 808 preserved |
| [7.6 security/regression QA](CAMPAIGN-ENGINE-SECURITY-QA.md) | `phase-7.6-campaign-engine-security-qa` | `65879c3a5d12` | **864/864 local** |

## Architecture and responsibility boundaries

The Next.js App Router application retains the existing public design system,
protected `/admin` shell and separate Sanity `/studio`. Supabase Auth identifies
users; live PostgreSQL membership/session checks authorize operations. Supabase
is the operational system of record for campaign core, descriptor registry,
system flags and governance audit. Sanity supplies descriptive published content
only. It cannot authorize availability, lifecycle, flags or registration.

The engine is generic core plus reviewed typed domain extensions, not an
arbitrary form builder. Campaign persistence, descriptor validators and system
flags remain private; clients use narrow guarded RPCs and server-only services.
The append-only Foundation audit is extended, not replaced by a parallel system.
The existing [Admin Foundation](ADMIN-FOUNDATION-PLAN.md) authority is preserved.

Production **campaign descriptors = 0; admin adapters = 0; flag seeds = 0**.
No generic, Qurban, Ramadan or volunteer type is installed. A future type needs
an explicit reviewed descriptor/validator migration and a matching typed admin
adapter before it is creatable/editable. Unknown type/version/configuration fails
closed. Local fixture descriptors/adapters are verification seams only.

## Security and RBAC

Authorization is enforced independently in verified server DAL and database
guards; navigation visibility is not authority. Google identity binding, live
active membership and session binding remain required. Anonymous operational
callers, outsiders, disabled/revoked memberships and invalid sessions are denied.
No normal application service-role credential is needed.

| Capability | Staff | Admin | Super-admin |
| --- | --- | --- | --- |
| Safe campaign/detail/window/flag reads | Read | Read | Read under existing owner AAL2 policy |
| Campaign create/update/schedule/lifecycle | Denied | Manage under Foundation policy | Manage with AAL2/verified TOTP and recent signed step-up |
| Global/system flag mutation | Denied | Denied | Existing owner-only AAL2/recent-TOTP guard |
| Campaign audit | Denied | Safe campaign-only projection | Authorized campaign audit |
| Users/invites/membership/Foundation security audit | Denied | Denied | Existing owner-only rules |

All roles inherit the existing Foundation MFA rules; a stored factor does not
manufacture AAL2. Signed recent TOTP evidence is authoritative, not a browser
timer. Raw table writes remain denied; RLS and explicit ACLs provide defense in
depth. Sensitive functions have fixed empty search paths and reviewed ownership/
EXECUTE grants. No new super-admin promotion or bootstrap path is introduced.

## Feature flags, lifecycle and scheduling

System/module flags are owner-only governance. Missing/off/unsupported state
fails closed; read failure is unavailable, never ON. Required global/module OFF
returns public 404 before CMS lookup, while authorized admin inspection remains
available. Flags never change lifecycle; lifecycle/scheduler never alter flags.

Explicit lifecycle commands enforce this state machine; there is no arbitrary
status PATCH or owner/scheduler override:

| Stored state | Allowed next states |
| --- | --- |
| draft | scheduled, open, archived |
| scheduled | draft, open, closed |
| open | paused, closed |
| paused | open, closed |
| closed | archived |
| archived | none |

Opening/resuming requires valid current type/config and DB-time window guards.
Closed cannot reopen; archived is terminal. The first departure from draft seals
the slug permanently, including later unscheduling. Schedule edits are separate
versioned commands. Open/paused registration-open is historical; closed/archived
windows are immutable through normal commands. Inputs use explicit timezone-aware
instants; admin/public displays use Asia/Kuala_Lumpur / MYT UTC+08:00.

An already-due persisted close is reconciled before proposed schedule edits:
close once, preserve old windows, advance version once and emit only
`lifecycle.close` with `schedule_edit_deadline` and the original planned deadline.
A future close can be extended only before that existing deadline. Editing dates
never implicitly opens/resumes a campaign. Delayed scheduler execution cannot
rescue expired admission; a due scheduled opening remains unavailable until the
actual opening transition commits. Public reads never mutate operational state.

The provider-neutral reconciliation engine uses DB time, deterministic locking,
bounded total batches and close-before-open priority. Elapsed scheduled windows
close directly without fabricating an opening; paused never auto-resumes, draft
never auto-opens and terminal states never exit. Retries do not duplicate audit.

`campaign_scheduler` is a capability/group role only: **NOLOGIN, NOINHERIT,
NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS**. It has minimum
schema usage/reconciliation EXECUTE, no general table mutation or code ownership.
Trusted migration-owned SECURITY DEFINER code derives authority from original
`session_user` membership, never null Auth, definer `current_user`, JWT/GUC/header
or caller actor metadata. Scheduler attribution is scheduler/NULL/system, not a
fabricated user. It can only perform due open/close.

Supabase Cron/pg_cron is the intended provider with an approximately one-minute
target. The actual scheduling LOGIN executor is a separate hosted gate; the
NOLOGIN capability is not that executor. No hosted executor, credential or Cron
job was configured by Fasa 7. Repository/local evidence is not live hosted
readback; hosted state is deliberately not accessed during this closeout.

## Admin, public and editorial presentation

Protected `/admin/campaigns`, `/new` and `/[id]` reuse the existing shell and
bounded list/detail/catalog projections. Creation derives draft/private/default
opt-ins/null windows/version 1. Core update cannot change type, lifecycle or
schedule. Typed adapter/config validation is mandatory; there is no raw JSON
editor fallback. The deliberate zero-type new-campaign empty state is correct.
Staff reads only; managers reuse 7.3 schedule/lifecycle APIs and safe audit history.
Close/archive confirmations, slug-lock warnings and explicit timezone conversion
are present. No global flag management UI or CMS binding-write UI is added.

Dynamic `/kempen/[slug]` calls the server service and narrow anonymous projection.
Descriptor/config validity, required flags, visibility, lifecycle/opt-ins and DB
time control eligibility. Private/draft/unknown/denied campaigns are neutral 404;
scheduled needs display opt-in, paused is neutral, closed is read-only. Expired
stored scheduled/open/paused renders closed without a mutation. Archived remains
404 under the approved 7.5 refinement; operational outage uses the approved
neutral Next 500 boundary, not a false 404/200. No public index or admission CTA.

Only after operational success may exact stable editorial binding resolve the
configured Sanity project/dataset, reviewed `program` type and published document
ID. No slug/title join, draft/version document or caller-selected environment.
Only bounded plain-text `program.description` enriches presentation. Missing/
invalid binding or content falls back to the minimum operational page; malformed
content is omitted and HTML-shaped text is escaped. Existing content read-policy
handles temporary editorial failures with fallback and permanent query/auth/config
failures with sanitized unavailable output. Editorial cannot override operational
title/state/dates/flags. The non-secret locator is removed before React props.
No Sanity schema/write, registration URL or domain workflow is introduced.

## Audit, concurrency and cache

Successful business mutations and `private.admin_audit_log` writes are atomic;
audit failure rolls back state. Controlled event/target/cause vocabulary, actor
category, server-derived attribution, request identity and expected/resulting
versions prevent arbitrary metadata dumps. Campaign metadata excludes participant
PII, tokens, finance/receipt payloads and unrestricted internal reasons. Admin's
campaign-only projection cannot expose Foundation/access/MFA/recovery or flag
history; staff/anonymous have no audit history.

Row/advisory locks and expected-version checks prevent stale overwrites; conflicts
return 409 before applicable no-op evaluation. Flag/core/schedule true no-ops do
not advance version or create successful audit. Lifecycle edges remain explicit.
UI does not auto-retry destructive actions or silently merge stale configuration;
reload retrieves current canonical state. Existing races/rollback evidence is
linked in 7.3/7.4/7.6 rather than duplicated here.

Operational admin/public reads are fresh/dynamic/no-store; React public-read
deduplication is request-only. No persistent merged authority in browser storage,
Sanity cache or public route-retention layer. Admin/campaign route isolation
discards outgoing sensitive/stale content. Next reload observes kill-switch OFF;
an old descriptive page grants no admission capability. Existing public homepage/
Kuliah editorial cache behavior is unchanged.

## Closeout verification and evidence limits

The final **864/864** is prior verified evidence from 7.6, not a newly rerun test
suite or a sum of phase totals. It covers real local PostgreSQL/Auth/PostgREST,
DB/application actor matrix, lifecycle/scheduler races, atomic audit, flags,
public/editorial/cache gates, browser/mobile and PNG/PDF/export regressions.
PGlite/Auth-stub and offline editorial fixtures are explicitly distinguished in
the [QA record](CAMPAIGN-ENGINE-SECURITY-QA.md). Local Auth-issued TOTP/AAL2 is not
a new real Google OAuth test. Hosted CMS images/fidelity remain unverified.

This documentation-only closeout verified clean/synced canonical main, all seven
checkpoint tags and unchanged bytes/SHA-256 for all six historical migrations.
Current generated public database types match the real local schema. Read-only
local inventory confirms descriptors/campaigns/flags and remaining test data at
zero; production source adapter registry is empty. No domain operational tables,
registration/payment routes or executor/job configuration is introduced.
Documentation/local-link checks and `git diff --check` pass. No runtime/test/
migration/dependency changed, so the 864 tests were not rerun for this closeout.

## Explicit remaining gates

- **Hosted Supabase:** separately authorize application/verification of the
  Campaign Engine migrations, generated schema/grants/RLS/RPC consistency and
  real provider/session behavior. Earlier Foundation staging evidence does not
  verify later Campaign Engine migrations.
- **Hosted scheduler:** verify extension entitlement, cost, execution/connection
  mode, exact role attributes/memberships and least-privilege LOGIN executor/
  SET ROLE model before any executor grant. Then separately authorize one-minute
  job activation, retry/health monitoring and operational ownership. No runtime
  role may acquire scheduler capability as a shortcut.
- **Hosted CMS/provider:** verify real published binding, content availability,
  environment/session/provider behavior and CMS image fidelity separately. The
  Campaign Engine's editorial evidence remains entirely offline.
- **Fasa 11:** deployment/network/request-size/rate-limit and production security
  controls remain open. Route-level byte retention limits do not prove rejection
  before Next upstream EOF/buffering. No production readiness/deployment claim.
- **First real domain:** install an explicitly reviewed production descriptor,
  private validator and matching typed admin adapter; create supported operational
  module flag state through owner-only commands. No catch-all generic type or
  enabled future module seed is present.
- **Fasa 8+:** Qurban/Aqiqah domain tables, participant/contact/volunteer/allocation/
  consent rules and all registration/payment/receipt workflows remain unbuilt.
  Ramadan is a future typed domain; Kelas Mengaji is a separate non-campaign
  operational module. Their design/provisioning needs separate authorization.

Fasa 7 is closed as the approved local generic foundation. Fasa 8 is the next
roadmap phase, remains not started, and is not begun by this checkpoint.
