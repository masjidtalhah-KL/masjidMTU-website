# Fasa 7.2 — Feature Flag Service

9 October 2026 (+08:00). **Fasa 7.2 complete / owner-approved.**
Checkpoint: `phase-7.2-feature-flag-service`; resolve the tag for the checkpoint commit.
Local verification only; no hosted mutation or deployment.
Fasa 7.3 has not begun.

## Baseline and verified architecture

Preflight: clean canonical `main`; HEAD/local origin/main/remote main and peeled
`phase-7.1-campaign-database-foundation` at
`20daf8d28e9678c4777fa9cb180e70082e7dd9a0`.
[Approved architecture](CAMPAIGN-ENGINE-PLAN.md), [7.1 foundation](CAMPAIGN-ENGINE-DATABASE.md),
[ROADMAP](ROADMAP.md), both historical migrations, admin DAL/policy/http patterns
and generated public RPC types were reviewed. No architecture contradiction.

Existing `private.require_owner(true)` retains Google binding, live membership/
session, verified TOTP/AAL2, signed recent TOTP within 600 seconds, actor-row lock
and existing operation limit. No Foundation helper, profile/invite/security policy,
7.1 storage rule or historical migration was modified.

## Additive database boundary

CLI-created migration:
[`20261008155719_campaign_feature_flags.sql`](../supabase/migrations/20261008155719_campaign_feature_flags.sql).
No new tables, raw grants, RLS policies, seeds or production descriptors.
Production registry remains empty; only `campaigns.enabled` is currently supported.
Future module keys require a reviewed migration-owned type descriptor. A flag
does not install or authorize a domain module. There is no generic catch-all.

| Function | Boundary |
| --- | --- |
| `private.system_flag_supported(text)` | Internal allowlist: foundation key or descriptor-backed module key. No runtime EXECUTE. |
| `private.system_feature_flags_read()` | Definer implementation: existing campaign read authorization, bounded snapshot of supported keys only. |
| `private.system_feature_flag_set(text,boolean,integer)` | Definer implementation: unchanged owner mutation guard, key/version validation, transaction lock, state change and atomic audit. |
| `public.admin_system_flags()` | Invoker read wrapper; no arbitrary key/registry query argument. |
| `public.admin_set_system_flag(text,boolean,integer)` | Invoker command wrapper with the identical guarded DB path. |

All five functions have fixed empty search paths. Explicit revokes cover PUBLIC,
anon, authenticated, service_role and supabase_auth_admin. Only the two public
wrappers and their two guarded private implementations receive authenticated
EXECUTE, following existing Foundation invoker-wrapper architecture. Private
schema stays unexposed through PostgREST; internal allowlist/audit/authorization
helpers cannot be called through Data API. Raw private flag access remains denied.
The normal runtime uses the existing publishable key and user session only.

## Read semantics and DTO

Safe read fields: `key`, `present`, `enabled`, `version`. No actor IDs, timestamps,
validator names, descriptor/config versions, audit payload or access/security history.
Snapshot includes at most 100 supported keys; exceeding that bound fails rather
than silently truncating authority. Database keys come from the trusted registry,
not browser selection. Migration state contains no flag rows.

| Condition | Semantics |
| --- | --- |
| Supported key, missing row | `present=false`, `enabled=false`, version 0; effective OFF. |
| Existing false | `present=true`, `enabled=false`, positive version; OFF. |
| Existing true | `present=true`, `enabled=true`, positive version; ON. |
| Unknown/unregistered key | Absent from snapshot; composition returns unsupported/OFF. |
| Auth, DB/read or malformed DTO failure | Unavailable/fail closed; never fabricated ON. |

Active admin/staff can read according to existing operational authorization.
Super-admin read requires operational AAL2/live verified TOTP; read does not require
recent step-up. Enrolled admin/staff TOTP retains existing AAL2 requirements.
Anon, outsider, disabled/revoked member or ended session is denied.

## Command, concurrency and idempotency contract

Application input has exactly `{key, enabled, expectedVersion}`: bounded key syntax,
boolean desired state and integer version 0–2147483647. Extra actor/role/correlation
fields are rejected. DB independently checks authority, registered key and values.

**Version 0 means missing row.** Existing rows use their positive stored version.
The expected version is checked **before idempotency**, even if the desired state
matches. A stale request returns PT409 / application 409 and changes nothing.
Retry the old version after successful mutation returns conflict, without another
audit; reload then retry with current version yields a no-op if state already matches.

| Current effective state | Command with matching expected version | Result |
| --- | --- | --- |
| Missing/OFF, version 0 | disable | No row created, version 0, `changed=false`, no audit. |
| Missing/OFF, version 0 | enable | Create ON version 1, `changed=true`, one enable audit false → true. |
| Existing ON | enable | No row/version/timestamp mutation or audit; `changed=false`. |
| Existing OFF | disable | No row/version/timestamp mutation or audit; `changed=false`. |
| Existing OFF | enable | ON, version +1, one enable audit false → true. |
| Existing ON | disable | OFF, version +1, one disable audit true → false. |

Command result adds `changed` to the safe flag state DTO. Supported missing disable
still requires owner authorization/step-up; no-op never weakens that boundary.

Lock order: existing actor membership lock, transaction-level advisory lock keyed
by flag identity, then existing flag row `FOR UPDATE`. Missing rows cannot be row-
locked, so the advisory lock serializes creation without inserting an OFF sentinel.
Owner authority/step-up is rechecked after lock acquisition, including no-ops;
waiting cannot carry expired or ended-session authority through the early return.
Hash collisions only serialize requests; they cannot confer authority. Distinct
synthetic owners with genuine Auth-issued AAL2 verify both missing-row creation and
existing-row concurrent version conflicts. Future admission/lifecycle writers must
reuse this serialization identity/lock order and recheck state within their own
transaction; that admission/scheduler integration is not implemented here.

## Atomic audit

Real changes call existing `private.record_campaign_event(...)` within the same
database transaction. The existing row trigger derives actor/time/version; writer
derives actor/AAL and server-generated request UUID. Audit records target flag,
expected/resulting version and exact booleans. No arbitrary metadata or caller actor.
7.1 metadata validation still rejects no-op/contradictory transitions. Audit failure
rolls back flag state/version. No-op/conflict creates no successful business audit.
Existing append-only audit and safe campaign-only admin audit boundary are retained.

## Server/application boundary and effective composition

- `src/lib/campaigns/flags.ts`: server-only; uses existing verified DAL and operational
  mode for reads, owner mutation mode for writes, existing generic DB error mapping.
- `flag-contract.ts`: bounded input, validated safe DTOs and shared pure composition.
  It grants no authority and does not read a browser session or untrusted metadata.
- `flag-body.ts`: incremental request-body reader retaining at most 256 UTF-8 bytes.
  Overflow cancels the reader and returns safe 422 without waiting for cancellation
  to complete; malformed UTF-8/read failures also fail closed. No dependency added.
- `/admin/api/feature-flags`: narrow internal future-service integration boundary,
  no visual UI. GET accepts no query parameters and reads a fresh supported snapshot.
  POST checks unchanged `sameOrigin()` first, then exact JSON media type, then reads
  `request.body` incrementally within 256 bytes. It never calls `request.text()` or
  trusts Content-Length as enforcement. JSON.parse and exact `flagCommand()` validation
  run only after the bounded read succeeds. No general arbitrary action or registry
  interface. Normal failures are 401/403/409/422/503 with generic
  reasons. Both responses use existing private/no-store headers and force-dynamic.

The 256-byte bound applies to the route reader, not the entire network/framework
pipeline. Pinned Next 16.3.6 proxy clones upstream bodies with its existing default
10 MB buffer limit and waits for upstream EOF before invoking this route (verified
in bundled `server/body-streams.js` and `proxyClientMaxBodySize.md`). An initial
unfinished HTTP probe therefore timed out before the handler could reject; it is
not evidence of an early network response. Proxy/configuration is unchanged.
Separate reader tests prove cancellation immediately at overflow without consuming
the remaining stream or waiting for sender cancellation. Real Next tests prove a
completed multi-chunk HTTP request without Content-Length returns 422 and preserves
all flag/version/audit state. No claim of 422 before upstream EOF is made.
Deployment-level request-size and rate-limit hardening is deferred to Fasa 11.

Every service read verifies Auth/live DB state and makes a fresh POST RPC; no
memoization, Sanity dependency, editorial cache, merged five-minute availability
cache or privileged key. Cookie-based DAL is request-time; outgoing RPC reads use
POST, with no GET/cache option. Authority is rechecked independently inside RPCs.

`effectiveFeatureAvailability(moduleKey?)` composes the global flag and, when
provided, the descriptor-backed module flag from one fresh snapshot. All required
keys must be present as supported and ON. Explicit global key cannot masquerade
as a module key. Future internal callers obtain moduleKey from a reviewed descriptor;
the HTTP API has no module-selection/effective-admission query. Failures return
`available=false, reason=unavailable`; unknown module returns unsupported; missing
supported state or false returns off. This authenticated service is not a public
campaign projection or proof of lifecycle/domain admission readiness.

The public kill-switch/404 contract remains for 7.5. Authorized admin campaign
inspection remains available while flags are OFF. No campaign lifecycle record is
changed by flag commands; temporary registration suspension will use paused in 7.3.

## Local verification evidence

Real local CLI 2.78.0, PostgreSQL 17.11, Auth v2.187.0, PostgREST v14.5,
Docker 29.8.2; loopback API 127.0.0.1:54321 / mtu-admin-local only.

| Suite/check | Result and evidence boundary |
| --- | --- |
| New feature flag local matrix | 42/42: real SQL/Auth-issued TOTP/AAL2/PostgREST and production Next service; two-owner concurrency, version conflicts/no-ops, atomic audit failure, live membership/session denial, safe reads, server input/errors, real DB outage and capacity overflow returning unavailable without truncation; exact-limit same-origin JSON, missing/foreign Origin, cross-site, missing/non-JSON Content-Type, normal/UTF-8/chunked overflow and malformed JSON. Each new security rejection compares all flag rows/versions and the complete audit fixture set before/after. |
| Flag contracts/body reader | 11/11: bounded DTO/input and effective global/module truth table; unknown/malformed fail closed; exact 256-byte and split UTF-8, oversized single chunk, incremental overflow without reading the tail, cancellation without waiting, missing/misleading Content-Length, invalid UTF-8/read failure. |
| New 7.2 additive upgrade | 3/3 PGlite/Auth-stub contracts: unchanged original functions/ACLs/audit rows, no seeds, scoped read/mutation boundaries. |
| Existing Campaign local matrix | 67/67 real local cases. |
| Existing 7.1 upgrade | 14/14 supplementary PGlite/Auth-stub cases. |
| Foundation SQL/policy/MFA | 28 + 8 + 8 = 44/44. |
| Foundation real local stack | 31/31 Auth/hook/TOTP/refresh/PostgREST/SSR cases. |
| Admin browser | 22/22 production Next with explicit test Auth adapter, including session/isolation and genuine PNG/PDF downloads. |
| Public/Studio/Kuliah | 243/243 existing automated fixture/content/export regressions. |
| Types/TypeScript/lint/Webpack | Real generated public RPC types/parity and local validation pass. |
| Bundle/secret/diff/docs | 249 production browser chunks and changed-source secret scan, whitespace/link checks pass. |

Total distinct cases: **477/477**, preserving all 421 baseline cases plus 56 new
flag cases. Repeated runs are not counted again. The new server read/mutation path
has real local Auth-issued owner evidence; ordinary identities and Google/OAuth AMR
remain explicit local fixtures, not Google OAuth or hosted claims. Outage testing
temporarily renames only the disposable local flag table and restores it; audit
failure uses a removable local-only trigger. No such artifact is in migrations.
Separate local owner and descriptor fixtures are test-only; suite after-hook no-seed reset
removes them. Final reset leaves descriptors/campaigns/flags and Auth/profile/invite/
audit fixtures zero. No staging identity, factor or resource was accessed.

## Reproduction

Use running Docker Linux engine and existing documented public Sanity build process
values; no credential/env-file change. Stack-mutating suites run sequentially:

```powershell
$env:NEXT_PUBLIC_SANITY_PROJECT_ID = '2o95jmms'
$env:NEXT_PUBLIC_SANITY_DATASET = 'production'
$env:NEXT_PUBLIC_SANITY_API_VERSION = '2026-09-01'
npm run admin:local:reset
npm run admin:types
npm run build -- --webpack
npm run campaign:flags:test
npm run campaign:flags:local:test
npm run campaign:local:test
npm run campaign:upgrade:test
npm run admin:db:test
npm run admin:policy:test
npm run admin:mfa:test
npm run admin:local:test
npm run admin:e2e
$regressionFiles = @(Get-ChildItem scripts/public-content,scripts/lecture-generator,scripts/sanity-migration -Filter '*.test.mjs' -File | ForEach-Object { $_.FullName })
node --test @regressionFiles
npx tsc --noEmit
npm run lint
npm run admin:bundle:check
npm run admin:local:reset
npm run admin:types:check
git diff --check
```

Foundation real-stack tests leave fixtures; reset after them. Auth credentials/
tokens/TOTP seeds remain test-memory only. No remote fallback is used. Generated
types add only the two new public RPC contracts, not private/Auth table exposure.

## Deferred implementation boundary

No domain descriptors, module flag seeds, campaign lifecycle/transition/scheduler,
campaign CRUD/admin UI, public `/kempen/[slug]`, public admission, Sanity schema/write
or Qurban/Ramadan/volunteer operational logic. 7.3–7.6/7.C remain deferred; staging
application/migration requires separate authorization. Existing completed 7.1
documentation remains historical evidence; ROADMAP records 7.2 complete while
overall Fasa 7 remains in progress. Owner authorizes the canonical main checkpoint
commit/tag only; Fasa 7.3 has not started. No deployment or hosted migration is authorized.

Official [function security](https://supabase.com/docs/guides/database/functions),
[PostgreSQL advisory locking](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS)
and pinned local Next route-handler/request-time guides were consulted. The
[Supabase changelog](https://supabase.com/changelog) was checked using HTML when
the markdown index could not be fetched; no dependency/configuration upgrade was
needed for this scoped service.
