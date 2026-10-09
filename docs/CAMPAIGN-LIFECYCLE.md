# Fasa 7.3 — Campaign Lifecycle + Scheduling

9 October 2026 (+08:00). **Fasa 7.3 complete / owner-approved — local implementation checkpoint.**
Checkpoint: `phase-7.3-campaign-lifecycle-scheduling`; resolve the tag for the
actual commit. Local implementation only; no hosted query/migration, deployment
or Cron job was performed. Overall Fasa 7 remains in progress/not complete.

## Baseline and reviewed contracts

Clean canonical `main`, local/remote main and peeled checkpoint tag
`phase-7.2-feature-flag-service` were verified at
`ef989f8102f3d71d43ae8bc3efd46c7962652c64` before this work.
The three historical migrations remain byte-for-byte unchanged:
`20261006000100`, `20261008102157`, `20261008155719`.

Reviewed [architecture](CAMPAIGN-ENGINE-PLAN.md),
[database foundation](CAMPAIGN-ENGINE-DATABASE.md),
[feature flags](CAMPAIGN-FEATURE-FLAGS.md), [ROADMAP](ROADMAP.md), existing
migrations, live membership/MFA guards, DAL, same-origin and body-reader patterns.
The earlier pre-migration actor gate is resolved by the owner's explicit approval:
NOLOGIN scheduler capability, migration-owned execution code, original database
session identity, truthful scheduler update attribution, and identical-window
deadline reconciliation before no-op. No locked architecture was redesigned.

## Additive migration and actual database boundary

`supabase/migrations/20261008234824_campaign_lifecycle.sql` was created by the
pinned CLI's `migration new` command. It applies after the three historical
migrations on genuine fresh local Supabase. No descriptor/flag/campaign seed.

The existing private campaign table gains `updated_actor_category`, default
`user`. `updated_by` retains its profile FK but becomes nullable **iff** the actor
category is `scheduler`. Inverse constraint: user requires a non-null updater;
scheduler requires a null updater. `created_by` stays mandatory and immutable.
The trigger always derives user attribution from current authorized membership;
scheduler attribution is always scheduler/NULL. No scheduler profile is fabricated.

Existing raw campaign/descriptor/flag grants, RLS and zero permissive policies
remain unchanged. No raw INSERT/UPDATE/DELETE privilege is granted to runtime or
scheduler capability roles. Fixed empty search paths are used throughout.

Actual functions:

| Function | Boundary |
| --- | --- |
| `private.scheduler_caller()` | Original session membership check; internal only. |
| `private.campaign_row_guard()` | Replaced additively; existing identity/config/version/terminal checks plus manual transition/window invariants and restricted scheduler branch. |
| `private.campaign_audit_metadata_v71_valid(text,jsonb)` | Private delegate preserving historical metadata validation. |
| `private.campaign_audit_metadata_valid(text,jsonb)` | Replaced additively; closed lifecycle cause and schedule/unschedule vocabulary, backward compatible old metadata. |
| `private.campaign_window_state(uuid)` | Fresh authorized operational lifecycle/window evaluation. |
| `private.campaign_lifecycle_event(campaigns,campaigns,text,text,uuid)` | Internal atomic user/scheduler lifecycle audit writer. |
| `private.campaign_lifecycle_command(uuid,text,integer)` | Live campaign manager guard, lock/version/action/window checks and atomic audit. |
| `private.campaign_schedule_command(uuid,integer,jsonb)` | Exact window edit, deadline reconciliation and atomic audit. |
| `private.reconcile_campaign_lifecycle(integer)` | Only due close/open, total bounded batch, scheduler capability. |
| `public.admin_campaign_lifecycle`, `public.admin_campaign_schedule`, `public.admin_campaign_window` | Authenticated invoker wrappers for the guarded private implementations. |

Authenticated has EXECUTE on the three manual/read wrappers and their guarded
private implementations, following the repository's existing invoker-wrapper
pattern. Anonymous/service_role/supabase_auth_admin have no new execution grant.
Internal writers/guards/validators and scheduler engine are not client RPCs.
The PostgREST authenticator has no scheduler membership or effective EXECUTE.
No existing Foundation/flag authorization function was replaced or loosened.

## Explicit lifecycle command contract

Manual input is UUID + positive integer expectedVersion + one allowlisted action.
There is no target status PATCH, actor/role input, override or free-text reason.
Version is checked under row lock **before** transition/window evaluation.
Stale operations return PT409 (409), including stale retries. Repeating a command
with the resulting version does not invent an idempotent transition: an invalid
current edge is rejected without audit. Schedule no-op semantics are separate.

| Action | From | To | DB-time guard |
| --- | --- | --- | --- |
| schedule | draft | scheduled | Current valid type/config; opens exists and strictly future. |
| unschedule | scheduled | draft | Explicit action; retain dates and permanently sealed slug. |
| open | draft / scheduled | open | Current valid type/config; opens null/due, close null/future. Scheduled already requires non-null opens. |
| pause | open | paused | Explicit manager command. |
| resume | paused | open | Current valid type/config; opens null/due, close null/future. |
| close | scheduled / open / paused | closed | Explicit manager close; no fabricated opening. |
| archive | draft / closed | archived | Explicit manager command. |

Everything else is denied. Closed can only archive; archived has no exit.
No owner or scheduler override. The row guard also rejects forbidden manual
nonterminal edges and future/expired opening windows, independently of wrappers.
Trusted fixture installation may initialize historical states; it grants no raw
client path and is removed by test cleanup.

## Explicit schedule edit contract

An exact object supplies all four fields (each null or a finite timezone-aware
ISO instant), plus expectedVersion at the application boundary:
registration_opens_at, registration_closes_at, event_starts_at, event_ends_at.
Database rejects extra/missing keys, oversized JSON, ambiguous local/date-only
strings and malformed instants. Proposed windows must have finite values and
valid ordered ranges before they can persist. Already-expired existing windows
take the close-only reconciliation path before proposed range/state evaluation.
The API body bound is 1,024 UTF-8 bytes; database window JSON bound is 512 bytes.

Draft/scheduled may edit all windows; scheduled must retain non-null opens.
Open/paused cannot change historical registration_opens_at. Closing/event windows
may be edited. Closed/archived reject normal schedule edits. Editing opens to a
past/due instant does not open; unschedule does not erase dates; date edits never
resume paused campaigns. Extension of a closing window is allowed only before
the existing authoritative close deadline, subject to the state/window guards.
Stored open/paused/scheduled state alone does not permit rescuing an expired
window. A committed closed campaign cannot reopen.

After row lock and expected-version validation, a fresh clock_timestamp() checks
the persisted existing deadline **before considering proposed schedule edits**:

- Existing close already due in scheduled/open/paused: ignore all proposed
  windows, preserve the stored dates, and commit only lifecycle.close. Increment
  version exactly once; cause is schedule_edit_deadline and planned_at is the
  existing persisted close. This includes future extensions, further-past close,
  changed event dates and identical windows. No schedule.change is manufactured.
- Existing close not due (or absent), but changed windows set close due:
  schedule.change then lifecycle.close, consecutive versions, one transaction/
  correlation ID. The proposed windows are persisted in this distinct case.
- Existing close still future and proposed close later future: normal
  schedule.change may retain the current lifecycle state.
- Identical windows without required reconciliation: true no-op, no version/audit.
- Stale version or audit failure: no state/window/version/audit change survives.

Manager behavior therefore does not depend on scheduler punctuality. Scheduler
first or schedule edit first reaches the same terminal admission truth when the
existing deadline has expired; the winning path records one close audit.

## Authorization, lock ordering and DB time

Staff read only; admin may manage campaigns; super_admin keeps existing operational
AAL2/verified TOTP and recent signed TOTP requirements for mutations. Server checks
use verified `adminContext('operational',true)` plus a scoped campaign manager
check. Database independently uses unchanged `require_campaign_access('manage')`.
Foundation Users/invites/membership and global flags remain owner-only.

Manual commands lock/recheck the live actor profile before the campaign row.
The row trigger/writer recheck authorization; commands sample clock_timestamp()
after waiting for campaign locks. A pre-lock transaction timestamp cannot preserve
an expired resume. Scheduler acquires campaign locks only, never profile/flag locks.
Both paths advance the trigger-derived version and audit it atomically.
Scheduler scans UUID order in each priority class with FOR UPDATE SKIP LOCKED;
it rechecks state/window after lock. Concurrent ticks skip locked rows and retry
on later ticks; manual commands wait and then recheck version/window. No stale
precomputed snapshot, actor-row workaround or UI timer is authority.

## Scheduler capability and executor identity

`campaign_scheduler` is **capability/group only**, not a pg_cron LOGIN identity:
NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION,
NOBYPASSRLS. No password/token, role membership for hosted/runtime identities,
object ownership or general table grants. It receives only private schema USAGE
and EXECUTE on `private.reconcile_campaign_lifecycle(integer)`.

All execution code remains owned by the trusted migration owner (`postgres`
locally). Future executor SET ROLE to the capability cannot modify/replace code.
Inside nested SECURITY DEFINER functions, authority derives from **session_user
membership**, never definer current_user, absent JWT/auth.uid, GUC, header, payload
or actor label. The trusted definer owner itself is excluded as a scheduler caller,
including PostgreSQL's possible creator ADMIN membership; this also makes a null
Auth context in an ordinary operator connection insufficient scheduler authority.

The restricted trigger branch allows only due scheduled → open or due
scheduled/open/paused → closed, preserves all other core fields, validates the
current type/config, and derives scheduler/NULL update attribution. The internal
writer permits only scheduler due open/close audit, null actor_id, actor_aal=system.
No profile/flag/member/domain mutation or general scheduler edit command exists.

Local verification creates two disposable LOGIN roles with random in-memory
passwords: a capability member and an outsider. The member is NOINHERIT and
explicitly SET ROLEs to campaign_scheduler for the tick; original session_user
remains the LOGIN. The outsider is temporarily granted outer EXECUTE solely to
prove the independent inner session identity denial despite definer privileges.
All temporary grants/roles are removed before no-seed reset, even after failures.
These are local fixtures, not production identities or an approved hosted executor.

## Reconciliation algorithm and late scheduler correctness

Input batch_size is 1..100, default 50, a **total reconciliation cap**:

1. Consume capacity closing due scheduled/open/paused campaigns first.
2. Scheduled missed window closes directly with missed_window; never fake
   scheduled → open → closed history. Open/paused close with deadline.
3. Remaining capacity opens due scheduled campaigns with null/future close.
4. Draft never auto-opens; paused never auto-resumes; closed/archived never exit.

Every mutation and business audit is in the same transaction; failure rolls back
the whole tick. Repeated/overlapping ticks create no duplicate audit. If a close
becomes due during the opening pass, that row is not opened; a later tick closes
it. Invalid current type/config fails safely rather than opening unsupported data.
All flags are independent: global OFF does not change lifecycle, and ticks never
read/write/seed feature flags or enable domain modules.

`admin_campaign_window` returns only id/status/version/registrationAvailable from
fresh DB clock evaluation. Close <= now is unavailable even if stored state is
open and scheduler is late; scheduled remains unavailable until transition commits.
Server DTO validation fails closed for malformed/contradictory data. This is an
operational window primitive, not complete public/domain admission: later phases
must additionally compose fresh flags, supported type/config and domain readiness.
No public registration endpoint or /kempen route exists.

## Audit extension and safe projections

Reuse append-only private.admin_audit_log. Add lifecycle.schedule and
lifecycle.unschedule; retain open/pause/resume/close/archive and schedule.change.
New writers derive exact from/to, expected/resulting versions, campaign target,
request UUID, controlled cause (manager/deadline/missed_window/schedule_edit_deadline)
and planned UTC opening/closing deadline where applicable. DB occurrence time is
actual processing time. Schedule changes carry only the existing eight typed
before/after date fields. No free-text reasons, Foundation role/status overload,
PII, financial payload, token/secret or second audit stream.

Legacy lifecycle metadata without cause remains valid; old Foundation/flag/campaign
rows are preserved unchanged. New schedule/unschedule require manager cause;
contradictory/unknown causes and sensitive extra keys fail closed. Existing safe
campaign audit projection is unchanged: admin sees campaign-only data, staff sees
none, owner operational MFA still applies; Foundation/flag audit stays owner-only.

## Server/API integration without UI

Server-only `src/lib/campaigns/lifecycle.ts` offers manual lifecycle/schedule
services and fresh window evaluation. Pure exact contracts and bounded reader are
separate testable modules. Internal POST routes:

- /admin/api/campaigns/[id]/lifecycle: {action,expectedVersion}
- /admin/api/campaigns/[id]/schedule: {expectedVersion, four window fields}

Same-origin enforcement precedes incremental body reads. Missing/foreign Origin
and cross-site Fetch Metadata are denied; non-JSON/malformed/oversized/extra input
is rejected. Responses use private/no-store and generic safe errors. Independent
RPC guards remain authoritative against direct calls. No scheduler HTTP endpoint,
client privileged key, UI or arbitrary actor/status payload was added.
The existing 256-byte flag reader remains unchanged. The lifecycle reader retains
at most 1,024 bytes, cancels overflow without waiting for EOF/cancellation completion.
Next 16.3.6 upstream/proxy buffering is outside this boundary: no claim of early
network rejection before upstream EOF. Deployment request-size/rate limits remain
Fasa 11 work.

## Intended provider and unresolved hosted gate

Selected intended provider: **Supabase Cron / pg_cron**, direct fixed SQL invocation,
with approximately one-minute target cadence. Official
[Cron overview](https://supabase.com/docs/guides/cron) and
[quickstart](https://supabase.com/docs/guides/cron/quickstart) support DB functions
and minute schedules; cron.job_run_details and Cron history provide run visibility.
The [upstream pg_cron contract](https://github.com/citusdata/pg_cron) executes with
the scheduling LOGIN user's permissions, allows worker/connection modes and queues
overlapping runs of one job. campaign_scheduler is not that LOGIN user.

Separate future owner authorization/hosted verification must establish actual
LOGIN executor, minimal membership/SET ROLE or inheritance, worker/connection
mode, extension entitlement, scheduling grants and plan/cost. No permanent LOGIN
executor, hosted membership, extension or Cron job was created here. No current
account capability/plan readback is claimed. Prior Free evidence is historical.
Public [pricing](https://supabase.com/pricing) does not establish this account's
incremental cost; inactivity pause and no guaranteed punctuality remain concerns.
No application HTTP secret, stored user token or Vercel service-role runtime key
is required by the intended direct-DB design. Any connection authentication needed
by the actual hosted execution mode remains part of that gate, not a claim that
all provider execution is credential-free.

Monitor last successful tick, failures/backlog and provider run-history retention.
Recurring ticks are retry/reconciliation opportunities, not a guarantee of immediate
failed-job retry. Business audit is independent of provider history cleanup.
[Vercel Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing) is not selected:
Hobby cadence is daily, Pro/Enterprise minute cadence adds a paid Functions/HTTP
identity boundary. No Vercel plan/resource was inspected or changed.

## Local verification evidence

Final verification results are recorded below after the complete local run.
Google identities/admin JWT matrix use isolated local SQL/signed fixtures;
owner AAL2 uses **genuine local Auth-issued TOTP sessions**, not fabricated MFA.
The scheduler uses a genuine disposable local PostgreSQL LOGIN connection;
no pg_cron provider job execution or hosted Google/provider behavior is claimed.
Upgrade tests explicitly use PGlite/Auth contracts as supplementary evidence;
admin browser regression uses the documented synthetic HTTP adapter. Public
content regressions use fixtures; browser route/export checks use the local build.
No tests write Sanity.

| Suite | Passed / total |
| --- | --- |
| Lifecycle real local PostgreSQL/Auth/PostgREST/Next + scheduler LOGIN/races | 140/140 |
| Lifecycle exact contracts/bounded reader | 9/9 |
| Lifecycle additive upgrade (PGlite/Auth contracts) | 7/7 |
| Campaign foundation real local SQL/Auth/PostgREST | 67/67 |
| Campaign foundation additive upgrade | 14/14 |
| Feature flags real local Next/Auth/PostgREST | 42/42 |
| Feature flag contracts/body + upgrade | 14/14 |
| Foundation SQL/policy/MFA contracts | 44/44 |
| Foundation real local stack | 31/31 |
| Admin browser regression | 22/22 |
| Public/Studio/Kuliah fixture regressions | 243/243 |
| **Unique total** | **633/633** |

The 477-case baseline is retained; 156 unique new cases were added. The two
historical fixture assertions affected by introducing a scheduler/state engine
now use legal transition setup and assert inaccessible scheduler EXECUTE; they
retain terminal-state and audit denial coverage. Two distinct manager profiles
exercise target-row concurrency rather than only a shared actor-row lock.

Fresh no-seed reset, production Webpack build, TypeScript, lint, generated public
type parity, documentation links and diff checks pass. Bundle scan: **251**
production browser chunks, no privileged secret value/import. Existing Edge
browser tests download real PNG/PDF artifacts and verify public/Studio/Kuliah,
logout/account switch and no retained authenticated public-transition content.
The owner-required expired-existing-deadline hardening adds 21 unique real-local
cases. All three live states test ignored future extension, further-past close,
unrelated event edits, valid future-to-later-future extension, scheduler-first vs
late equivalence and schedule-extension/scheduler-close races. Existing identical
expired-window tests now verify exact stored windows, single version increment,
close-only audit, user attribution, controlled cause and persisted planned_at.
Additional cases prove audit-failure rollback, expected-version conflict priority
and a fresh deadline check after waiting for a campaign lock. No proposed window
survives an already-expired existing deadline; no duplicate close audit is created.
No early-network-response guarantee is inferred from body-reader tests.

Exact commands (local only; synthetic fixtures are reset between stack suites):

```text
npm run admin:local:reset
npm run admin:types
npm run admin:types:check
npm run build -- --webpack
npm exec -- tsc --noEmit
npm run lint
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
npm run admin:local:reset
git diff --check
```

PowerShell enumerates the public test paths before passing them to Node. Build
uses only the repository's approved public Sanity settings. No env file/secret
change. Generated types contain only the three new public RPC signatures; private
scheduler is absent. Final reset leaves descriptors/campaigns/flags/Auth/audit
fixtures zero and no disposable LOGIN role or validator. Persistent approved
NOLOGIN capability remains, with no runtime membership/job.

## Approved checkpoint boundary and deferred work

Fasa 7.3 is complete and owner-approved as a local implementation checkpoint,
including the expired-persisted-deadline hardening and 633/633 local evidence.
Final checkpoint verification repeats the 140-case real-local lifecycle suite
and the 16 lifecycle contract/upgrade cases; these are not counted twice.
ROADMAP records 7.3 complete; all earlier checkpoint evidence is preserved.
7.4 campaign management UI, 7.5 public projection/route, 7.6 authorized hosted QA
and all domain modules remain deferred. No descriptor registration, Qurban/Ramadan
implementation, public route, Sanity write, hosted access/job/migration, deployment,
or 7.4 work occurred. Supabase Cron / pg_cron is the intended provider only.
Actual hosted LOGIN executor, membership/SET ROLE model, execution mode, extension
entitlement, grants, cost and Cron activation remain a separate owner-authorized
hosted gate. This checkpoint claims neither hosted scheduler activation nor
hosted verification and grants no permission to provision it.
