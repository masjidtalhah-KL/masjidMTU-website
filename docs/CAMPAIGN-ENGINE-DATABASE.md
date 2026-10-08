# Fasa 7.1 — Campaign Engine Database Foundation

8 October 2026 (+08:00). **Fasa 7.1 complete / owner-approved.**
Owner approved the hardened database foundation and canonical main checkpoint:
`phase-7.1-campaign-database-foundation` (resolve the tag for the checkpoint commit).
Verification is local only; no deployment or hosted Supabase/Sanity mutation.
Fasa 7.2 has not begun; overall Fasa 7 remains in progress/not complete.

## Baseline and resolved owner decision

Preflight: clean canonical `main`, HEAD/local `origin/main`/remote main and peeled
tag `phase-7.0-campaign-engine-architecture` all at
`5d80473d91438de6c5548a69f64a6f06114afecb`.
The [owner-approved architecture](CAMPAIGN-ENGINE-PLAN.md) remains the contract;
All Fasa 6 and 7.0 checkpoint evidence is preserved; the [ROADMAP](ROADMAP.md)
now records owner-approved 7.1 completion and the unchanged later-phase boundary.

Owner subsequently resolved the initial type-vocabulary gate: **zero production
campaign descriptors in 7.1**. There is no `generic` catch-all, registered future
domain, or permanent CHECK listing Qurban/Ramadan/volunteer types. Absence is
intentional fail-closed behaviour. Test-only descriptors are not migration seeds.
No further owner design decision blocks this approved database foundation.

Owner security-review hardening (8 October 2026): amended the same uncommitted
candidate migration in place. Flag audit metadata now enforces exact enable/
disable transitions, and descriptor admission enforces effective private validator
EXECUTE ACLs. The persisted local test fixture records a real enable then disable,
with consecutive versions/audits. Operational flag ownership is clarified below.
All requested verification was rerun after these changes: 421/421 cases passed.
The owner subsequently approved final 7.1 completion and commit/push/tag.

## Additive migration and schema placement

The pinned CLI `migration new campaign_database_foundation` created
[`20261008102157_campaign_database_foundation.sql`](../supabase/migrations/20261008102157_campaign_database_foundation.sql).
The historical `20261006000100_admin_foundation.sql` is byte-for-byte unchanged.
The new migration is transactional and applies after it on a local no-seed reset.

Three new relations use the established unexposed **private** schema:

| Relation | Responsibility |
| --- | --- |
| `private.campaign_type_descriptors` | Migration-owned `(type_key, config_version)` registry, required module flag key and reviewed config validator identifier. Empty in production migration state. No admin type-editor or generic form schema. |
| `private.campaigns` | Typed campaign core, configuration/editorial binding and server-derived identity/mutation metadata. No domain registrations, participants, volunteers, payments, receipts, allocations, consent or classroom records. |
| `private.system_feature_flags` | Allowlisted flag key, boolean (default false), positive version and server-derived actor/time metadata. Empty in production migration state. No enable/disable command or service. |

Private placement protects operational configuration from raw Data API exposure.
Even authorized users receive only explicit read projections. Existing public
profiles and Foundation public invoker wrappers are retained. No new schema is
added to `supabase/config.toml` or Data API exposure.

## Core constraints, registry and indexes

Campaign core includes immutable UUID/type; unique normalized lowercase bounded
slug; bounded trimmed plain-text title; the six approved statuses; optional
registration/event instants; private/public/unlisted visibility; false-by-default
scheduled-public/history opt-ins; JSON configuration; schema/config versions;
optional complete editorial binding; actor/time metadata; positive row version.

- Uppercase/whitespace/noncanonical/reserved slugs are rejected, not silently
  normalized to a different identity. Slug uniqueness retains archived identities.
  A server-derived slug_locked_at seals slug identity on first departure from
  draft, conservatively before possible public exposure. Unscheduling back to
  draft cannot unlock it; client-supplied lock metadata is ignored. This preserves
  stability without a 7.5 publication service. UUID/type/creator/creation time
  cannot change.
- Registration/event ranges must be strictly ordered when both endpoints exist.
  Scheduled requires an opening instant; infinite instants are rejected. Null
  close represents later manual closure. DB stores timestamps with timezone;
  future application input/display must enforce explicit timezone handling.
- `closed` cannot return to draft/scheduled/open/paused; only archival remains.
  Archived cannot exit. These are storage invariants, not lifecycle commands.
  Due-time transitions, manual open/pause/resume guards and scheduler belong to 7.3.
- Configuration must be an object, at most 4096 UTF-8 bytes as JSONB text, with a
  known `(type_key, config_version)` descriptor and validator returning exactly true.
  Schema version currently accepts only 1. Unknown/absent types and versions fail.
- A descriptor requires a private immutable security-invoker `boolean(jsonb)`
  function with empty search path. Admission also rejects EXECUTE available to
  PUBLIC (including default ACLs), anon, authenticated, service_role or
  supabase_auth_admin. Effective role checks include inherited privileges; the
  migration/function owner retains its required validation privilege. This is
  enforced by the descriptor trigger, not just a future migration convention.
  Descriptors are insertion-only: future reviewed
  migrations add supported versions. There is no application grant to register one.
  Validator dispatch quotes a migration-owned identifier with `%I`, parameterizes
  JSON input, and fixes the schema; no browser SQL/name or arbitrary executable
  configuration is accepted. This limited registry dispatch is distinct from an
  arbitrary dynamic SQL endpoint. Reviewed future validators must reject PII,
  credentials, money/payment records and unsupported configuration fields.
- Editorial context is either fully absent or all four fields present. DB checks
  bounded project/dataset/type/document-ID syntax and rejects `drafts.*`/`versions.*`.
  Binding uniqueness uses project/dataset/document ID. Real publication, approved
  environment/dataset/type and cross-system existence validation are deferred to
  the editorial adapter; syntactic validation is not a Sanity lookup.
- Storage triggers derive current actor, timestamps and insert version 1/update
  version +1; supplied creation metadata cannot impersonate another actor. Creators
  reference retained Foundation profiles with restrictive foreign keys. No delete
  path exists for campaigns, flags or registered descriptors.

Indexes: campaign slug/UUID uniqueness, descriptor composite key and campaign
type/version FK lookup, unique editorial binding, scheduled-open and eligible-close
deadline indexes, creator/updater FK indexes, flag primary key and actor indexes,
campaign/flag audit target+time indexes. There are no domain/capacity indexes.

Flag admission allows the foundation key `campaigns.enabled` plus module keys
mapped by reviewed descriptors. It does not allow a caller to invent a key.
**No flag rows are seeded**, including campaigns.enabled: no 7.1 operation requires
one, and missing is OFF by contract. No qurban.enabled or ramadan.enabled seed.
The future 7.2 service must preserve missing/unknown/off denial and safe public
404 semantics; authorized inspection does not depend on public flag state.
Operational flag rows/state are expected to be created/mutated through future
owner-only 7.2 service/commands. A separate bootstrap migration would require
explicit review/authorization; ordinary flag state changes do not require a
migration. Type descriptors/validators, by contrast, require explicit reviewed
future migrations. No such service/command or bootstrap seed is added in 7.1.

## Authorization, RLS and function grants

All three new tables have RLS enabled, **zero permissive policies**, and no raw
SELECT/INSERT/UPDATE/DELETE/TRUNCATE grants to PUBLIC, anon, authenticated,
supabase_auth_admin or service_role. Grants are deliberately narrower than merely
adding RLS. Neither a normal browser nor normal server runtime needs a privileged
credential. No new role, service key, environment variable or dependency is added.

`private.require_campaign_access(capability)` is an internal scoped guard:

| Actor | read | manage primitive | audit |
| --- | --- | --- | --- |
| Anonymous/no membership/disabled/revoked/unbound identity/ended session | Denied | Denied | Denied |
| staff | Safe read | Denied | Denied |
| admin | Safe read | Allowed | Safe campaign-only |
| super_admin AAL1 | Denied | Denied | Denied |
| super_admin AAL2 + verified live TOTP | Allowed | Also requires signed recent TOTP within existing 600 seconds | Allowed |

Admin/staff with an enrolled verified TOTP also require AAL2, matching existing
Foundation policy. Roles come from `private.active_role()` and live Google
binding/session/membership, never editable metadata. Manage locks the actor
membership row before rechecking authority. The core row trigger applies this
guard; the flag row trigger uses unchanged `private.require_owner(true)`.
Thus even a trusted SQL fixture carrying staff/admin context cannot bypass flag
owner authorization. There is no public management RPC in 7.1.

Two public security-invoker read wrappers, granted only to authenticated, call
reviewed private security-definer implementations with fixed empty search paths:

- `public.campaign_foundation_list(page_size default 50)` returns at most 100
  safe core records, including ID/type/slug/title/state/windows/visibility/opt-ins/
  version/creation timestamp. No config, editorial binding or actor profile data.
  It is an operational foundation read, not a public campaign projection/page.
- `public.campaign_audit_history(target_campaign default null, page_size default 50)`
  returns the bounded approved governance projection described below.

Only those two wrappers and their two private implementations receive authenticated
EXECUTE. Internal authorization, row/descriptor triggers, metadata validator and
audit writer retain no client EXECUTE. Revocations name new functions explicitly;
they do not sweep away Foundation function/table grants. New functions are created
by the existing database migration owner, not a browser/system role.

No existing Foundation helper/RPC definition, policy, grant, identity rule,
invitation acceptance, membership mutation, MFA/recency or session guard changes.
Users/invites/foundation security audit remain super_admin-only. The existing
policy/DAL and runtime code are untouched apart from generated RPC types.

## Backward-compatible audit extension

Reuse `private.admin_audit_log`; no second audit relation. Add target_kind,
actor_category, campaign_id, flag_key, expected_version, resulting_version and
bounded metadata. Existing rows acquire constant foundation defaults/empty metadata
without rewriting historical event values or bypassing the immutable trigger.
Existing action/role/status/outcome/AAL/request fields remain valid.

The closed governance constraint replaces the prior foundation-only action/null-
actor checks while retaining their original branch. New governance events require
specific campaign/flag targets, positive consecutive resulting version, UUID
correlation identity and appropriate actor. They cannot populate invitation,
member-role/status or Foundation target columns. Campaign/flag FKs restrict deletion.

Allowlisted events: campaign.create/update, schedule.change,
lifecycle.open/pause/resume/close/archive, system_flag.enable/disable.
The metadata validator allows only action-specific typed values: config version,
visibility/state enums, reviewed changed-field names, ISO UTC schedule timestamps
or boolean flag states. Maximum 2048 JSONB text bytes. No arbitrary before/after
objects or free-text reasons; participant/customer names, contacts, addresses,
consent, banking/payment/receipt payloads, tokens/seeds/secrets fail closed.
Flag metadata accepts only `system_flag.enable: false → true` and
`system_flag.disable: true → false`. Both no-op combinations and contradictory
transitions are rejected by the audit constraint. Future idempotent commands must
return without a business mutation, version increment or audit when effective
state is unchanged; implementing those commands remains 7.2 work.

`private.record_campaign_event(...)` is an internal writer: derives actor/AAL,
rechecks the relevant campaign/owner guard, checks stored resulting version,
target shape and safe event metadata. No authenticated/anon EXECUTE, public
mutation wrapper or automatic registration side effect exists. Future mutation
commands must call it in the same transaction as state changes and check expected
version under lock. 7.1 tests prove this atomic contract rolls back state when an
audit insert fails; no claim is made that a 7.2/7.3 command has been implemented.

Structural `scheduler` actor support is confined to null-user/system-AAL campaign
open/close events with nonzero prior version. No general arbitrary null actor or
action. There is **no scheduler writer execution path**, role, credential, token,
endpoint or cron; a future 7.3 restricted actor path needs separate implementation.

Audit read projection:

- super_admin with AAL2 can read campaign/flag governance events here; original
  Foundation owner snapshot remains owner-only.
- admin sees only target_kind=campaign with safe governance fields; no flag,
  invitation, access, MFA/security, bootstrap/recovery or raw Foundation events.
- staff is denied. Client scope/actor parameters cannot widen the projection.

Audit UPDATE/DELETE stays impossible through the existing append-only trigger,
including for database-owner ordinary SQL. Prior retention targets remain targets;
this migration creates no purge/cleanup policy.

## Generated types and test harness changes

Existing `admin:types` generates `src/lib/supabase/database.types.ts` from real
local Supabase `--schema public`; only two public read RPC signatures are added.
Private/Auth table types remain excluded, and the existing Foundation contracts
stay unchanged. Type generation has no stub or remote fallback.

The PGlite harness adds Supabase's real service_role to its explicit role stubs
and an optional migrationThrough selector for additive-upgrade tests. Real-stack
Foundation tests now compare all repository migration versions to local history,
instead of assuming one migration forever. No denial test has been removed.

## Local verification evidence

Environment: CLI 2.78.0, Docker 29.8.2, PostgreSQL **17.11**,
GoTrue v2.187.0, PostgREST v14.5. Existing local API remains
http://127.0.0.1:54321; project/container suffix mtu-admin-local. No hosted CLI link,
push, migration application, query or resource action was run.

| Check | Result / evidence boundary |
| --- | --- |
| Fresh real local reset | Both 20261006000100 and 20261008102157 apply successfully, no seed. |
| Campaign real-stack matrix | **67/67 pass**: actual SQL constraints/grants/RLS, direct PostgREST, live role/identity/session denial, safe audit, isolated descriptors, genuine local Auth/TOTP-issued owner AAL2 and atomic rollback. Includes all eight flag transition combinations, private-validator acceptance, five unsafe grants and inherited runtime EXECUTE denial. |
| Additive upgrade contracts | **14/14 pass**, PostgreSQL/PGlite with explicit Auth stubs: historical audit values and original function definitions/ACLs preserved; original owner-only access, metadata allowlist and immutability retained. Includes all eight flag combinations and private/unsafe validator ACL admission. Supplementary, not hosted evidence. |
| Foundation SQL regression | **28/28 pass**, PGlite/Auth stubs. |
| Foundation policy/environment | **8/8 pass**. |
| Foundation MFA selection | **8/8 pass**. |
| Generated public types | Real local generation and exact parity pass. |
| Production Webpack build | Pass using existing documented public Sanity build values in process environment. No env file/resource change. |
| Foundation real local stack | **31/31 pass**, real Auth/TOTP/refresh/hook/PostgREST/Next SSR; original deny-first matrix, invitation/member operations and atomic audits unchanged. |
| Admin browser | **22/22 pass**, real local production Next + scripts-only synthetic Auth/SQL adapter. Includes session/logout/account change, route isolation and genuine PNG/PDF downloads; not OAuth evidence. |
| Public/Studio/Kuliah automated regression | **243/243 pass**, existing fixture/schema/content/export tests; no Studio/CMS mutation. |
| Independent TypeScript/lint | Pass after production build completed. |
| Public browser bundle | 248 chunks scanned; no privileged key literal or privileged env import. No real privileged credential was supplied to the build. |

Total distinct automated cases: **421/421** (67 + 14 + 28 + 8 + 8 + 31 + 22 +
243). Repeated verification runs are not counted as additional tests.

Test boundaries: staff/admin/disabled/revoked Google identities and JWTs are
explicitly isolated local fixtures. Owner AAL2 is genuinely issued by local Auth
after TOTP challenge, with an OAuth AMR fixture; this is not Google OAuth evidence.
The enrolled-admin AAL contract and stale signed proof cases are clearly SQL/JWT
fixtures. No current hosted behaviour or external Google browser admission is claimed.

The local suite refuses an existing identity database; its test-only descriptor,
validator, campaigns, flags and Auth fixtures are removed by no-seed local reset
in the after hook, including when assertions fail. Final descriptor/campaign/flag/
Auth user counts were zero following the focused suite. After Foundation regressions,
a final reset also left Auth users/profiles/invites/audits/descriptors/campaigns/flags
all at zero. No test type survives in
production migration state, generated public types or the runtime application.

Initial fixture timestamp incompatibility was corrected to match actual Auth
NOT NULL columns. Initial build attempts required existing public Sanity values
and Windows filesystem permission for generated output; no application fix was
needed. Standalone TypeScript must run after build finishes regenerating .next
types, not concurrently with that output mutation.

## Reproduce locally

From the repository root, use the installed dependencies and running Docker Linux
engine. Set only the existing documented public Sanity process environment for
the build (no CMS token or new credential). These commands target local resources:

```powershell
$env:NEXT_PUBLIC_SANITY_PROJECT_ID = '2o95jmms'
$env:NEXT_PUBLIC_SANITY_DATASET = 'production'
$env:NEXT_PUBLIC_SANITY_API_VERSION = '2026-09-01'
npm run admin:local:start
npm run admin:local:reset
npm run campaign:local:test
npm run campaign:upgrade:test
npm run admin:types
npm run admin:types:check
npm run build -- --webpack
npx tsc --noEmit
npm run lint
npm run admin:db:test
npm run admin:policy:test
npm run admin:mfa:test
npm run admin:local:test
npm run admin:e2e
npm run admin:bundle:check
$regressionFiles = @(Get-ChildItem scripts/public-content,scripts/lecture-generator,scripts/sanity-migration -Filter '*.test.mjs' -File | ForEach-Object { $_.FullName })
node --test @regressionFiles
npm run admin:local:reset
npm run admin:types:check
git diff --check
```

Campaign tests perform their own final reset; Foundation real-stack tests leave
synthetic fixtures, so reset after them. Run stack-mutating suites sequentially.
Keys/tokens/TOTP seeds are obtained only into test memory, never reports/source.

## Deferred work and checkpoint boundary

7.2 flag service/read/effective availability/enable-disable commands; 7.3 full
transition/window guards, scheduler, concurrency and audit wiring; 7.4 CRUD/admin
UI; 7.5 public projection/route and reviewed editorial adapter/schema; 7.6 final
hosted QA remain unimplemented. Positive optimistic versions are stored/derived
now; application conflict commands and pagination expansion remain later work.
No future domain availability or module readiness is implied by a type descriptor.

Hosted promotion must be separately authorized. Production descriptor vocabulary
and validator/domain rules require explicit reviewed future migrations. Operational
global/module flag rows/state belong to future owner-only 7.2 service/commands,
unless a separate reviewed bootstrap migration is explicitly authorized. Sanity
binding publication/ownership checks are deferred, not falsely
claimed from DB syntax validation. Primary/Backup staging test factors, identities
and historical audit evidence were not accessed or modified.

Fasa 7.1 is complete and owner-approved for this local database foundation only.
Final checkpoint verification repeats the fresh no-seed local reset, generated
type parity, documentation/link/diff checks and changed-source secret scan.
The historical Foundation migration remains unchanged. No runtime/SQL change
was needed during documentation finalization; the 421/421 approved evidence above
remains applicable. Hosted application/deployment requires separate authorization.
Do not start 7.2 from this checkpoint.

References: [Admin architecture](ADMIN-FOUNDATION-PLAN.md),
[real local Foundation evidence](ADMIN-FOUNDATION-LOCAL-VERIFICATION.md),
[final Fasa 6 recovery evidence](ADMIN-FOUNDATION-MFA-RECOVERY-VERIFICATION.md),
[Supabase RLS/grants guidance](https://supabase.com/docs/guides/database/postgres/row-level-security),
[database function security](https://supabase.com/docs/guides/database/functions).
Validator ACL inspection follows [PostgreSQL privilege inquiry and ACL semantics](https://www.postgresql.org/docs/17/functions-info.html#FUNCTIONS-INFO-ACCESS-TABLE).
The [changelog](https://supabase.com/changelog) was checked; the markdown index
returned 503, so the HTML index was used. Relevant PostgreSQL minor-release and
extension guidance does not require an extension/schema or dependency upgrade here.
