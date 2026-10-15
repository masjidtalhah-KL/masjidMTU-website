# Fasa 8.2 — Public Qurban Registration Submission

15 October 2026 (+08:00). **Fasa 8.2 complete / owner-approved — Public Qurban Registration Submission.**
Baseline: `f4a8fd47642db18f69ecf61e2511e2c4f5658ea4`, tag `phase-8.1-qurban-domain-foundation`.
8.0 and 8.1 remain complete / owner-approved. Owner manually tested the real local Qurban/Aqiqah form
and approved this implementation, including the selective demo cleanup refinement.
Checkpoint: `phase-8.2-qurban-public-registration` (resolve the tag for the commit).
Owner authorizes canonical main/tag push without force, followed by a clean dedicated website clone.
No hosted Supabase/Sanity/Vercel mutation or deployment.
8.3 has not started. This is local implementation evidence, not permission to open a real campaign.

Authoritative contracts: [owner decisions](QURBAN-MVP-PLAN.md), [8.1 foundation](QURBAN-DOMAIN-DATABASE.md),
[Campaign architecture](CAMPAIGN-ENGINE-PLAN.md), [public gating](CAMPAIGN-PUBLIC-ROUTE.md),
[flags](CAMPAIGN-FEATURE-FLAGS.md), [roadmap](ROADMAP.md).

## Public route and UX

`/kempen/[slug]` retains the generic public projection and editorial boundary unchanged.
A separate safe Qurban context read decides whether to render **Daftar Qurban / Aqiqah**.
It does not add Qurban records/configuration to the generic Campaign DTO.
Only an eligible Qurban v1 campaign gets this CTA. A missing/not-ready akad denies it.

`/kempen/[slug]/daftar` uses the existing public header, navigation, footer, brand colours and buttons.
Steps: applicant/wakil → participants/attendance/group preference → actual approved akad → final review.
Applicant can differ from every participant. Purpose options and participant limit come from current context;
the limit is not inferred from shares per cattle. Attendance belongs to Registration only.
Same-cattle choice is a request, never a guaranteed allocation.

Labels, inline errors, focused error summary/headings, keyboard controls and stable participant keys support mobile use.
User text and akad are escaped React text, with preserved address/akad line breaks; no HTML renderer.
The browser computes a display-only integer-minor-unit quote. It sends no currency, price, year or total authority.
Checkbox consent is mandatory; no typed/drawn signature.

Success displays the database-generated QBN reference, share count and exact immutable quoted total.
It explicitly says **“Pendaftaran ini belum mengesahkan bayaran dan belum menempah bahagian.”**
The optional read-only Bank Islam information is the owner-approved account 1227 0010 0045 60,
MASJID TALHAH BIN UBAIDILLAH. No payment selector, gateway, proof-upload control, verification or receipt.
Registration remains submitted/cancelled; no payment state or reserved/eligible counter is persisted.

## Safe public context contract

`public.public_qurban_registration_context(target_slug text)` returns JSON null on an ineligible/unknown slug.
The page returns neutral 404 for that result. Unexpected operational failure is sanitized unavailable,
using the existing neutral public error boundary; no SQL/private denial reason is rendered.

Exact successful DTO keys:

```text
slug, title
campaign_version, config_version (=1)
global_flag_version, module_flag_version
campaign_year, hijri_display_label, currency
price_per_share_minor, allowed_purposes, max_participants
registration_closes_at
akad_reference, akad_text, akad_hash
```

No internal campaign/akad ID, applicant, participant, admin profile, capacity internals,
raw configuration, volunteer, proof/storage or audit data is projected.
The server uses a sessionless publishable-key client, no-store fetch, bounded timeout, and exact DTO validation.
Both pages are force-dynamic with revalidate=0. Production documents and submission responses are no-store.
Next's development page-document header is no-cache; the underlying context fetch and POST response remain no-store.
No persistent application/context cache is introduced.

Context requires exact qurban/config v1/descriptor/module tuple, valid current configuration,
both flags present and ON, public or unlisted visibility, stored open status and current DB-time window.
Draft/scheduled/paused/closed/archived, missing/OFF flags, private, future opening or elapsed close deny.
A delayed scheduler cannot extend registration. No event date substitutes for the registration window.
The configured same-campaign AkadVersion must exist; its stored hash must match SHA-256 of its exact text.
Reference syntax alone never proves an approved AkadVersion exists.

## Exact request and result

Browser POST: `/kempen/[slug]/daftar/hantar`. Only exact `application/json`, no query parameters,
matching route/body slug and configured same-origin browser requests are accepted.
The route uses anonymous server RPC access and never forwards an admin cookie/session.

Exact body shape (no other keys accepted):

```text
slug: bounded normalized slug
idempotency_key: 64 lowercase hex characters, browser-generated 32 random bytes
expected_campaign_version: positive int32
expected_global_flag_version: positive int32
expected_module_flag_version: positive int32
expected_akad_reference: exact bounded reference
expected_akad_hash: 64 lowercase hex characters
applicant: { name, phone, address, email: string | null }
participants: [{ name, purpose: qurban | aqiqah }]
attendance: yes | no | unsure
same_cattle_preference: boolean
accepted_akad: true
```

No caller-selected IDs, reference, amount, currency, config, actor, timestamps or akad text.
Application and DB independently reject unknown keys, malformed types and invalid fields.

Successful response, HTTP 201 (including committed idempotent replay):

```text
{ reference, participant_count, currency, price_per_share_minor, total_minor }
```

No applicant/participant data or internal identity is returned. Totals are generated from the accepted DB config;
the response parser requires exact keys and arithmetic. No reference-only PII lookup/status endpoint exists.
Error envelopes contain only invalid/conflict/denied/unavailable. The route maps unknown or changed admission
conditions uniformly to a safe 409 conflict; the UI asks to reload and review current information.
It never reveals whether a private campaign, participant or applicant exists.

## Atomic admission and concurrency

The only new business command is `public.public_qurban_registration_submit(payload jsonb)`.
Its trusted private implementation validates the bounded exact payload before any business write.

For a new submission, lock order is idempotency identity → global flag → Qurban flag → campaign → new Registration/children.
Shared advisory flag locks use the existing flag setter's exact namespaces; flags are also row-share locked.
This serializes normal OFF/ON commands and existing-row changes with admission. Missing flags deny.
Campaign FOR UPDATE serializes config/lifecycle/schedule/visibility changes and submissions.
No admin identity lock is acquired by this public flow. Existing admin/owner MFA guards are unchanged.

After waiting for locks, the transaction rereads the full safe context using DB time. It requires exact expected
campaign revision, both flag versions and approved akad reference/hash. This catches price/config/purpose changes,
OFF→ON cycles, lifecycle/visibility/window changes and annual akad replacement. No silent repricing/substitution.
It resolves the real same-campaign immutable AkadVersion, derives the quote/config evidence and writes:

1. One Registration with generated identity/reference and immutable accepted config/quote.
2. All intended Participations with independent generated identities.
3. One immutable ConsentAcceptance with actual AkadVersion FK/hash, server timestamp and exact inserted-child snapshot.
4. One immutable idempotency record.
5. One immutable bounded registration.submitted audit event.

The registration window is checked again immediately before returning. Passing the deadline while waiting/writing
rolls the transaction back. Flags/config/lifecycle remain locked until commit.
Any insert, constraint or required audit failure rolls every record back, including the idempotency record.
The function sanitizes unexpected SQL errors; it never returns raw SQL, payloads or consent details.

Storage triggers from 8.1 still verify exact quote/campaign ownership, allowed purposes and immutable acceptance.
They are not substitutes for admission authorization. The new command performs all admission checks.

## Idempotency

The key is random, not derived from names/contact/year/sequence. Only SHA-256 key hash and canonical JSONB
payload hash are stored; no raw request or key is persisted. Payload hash includes the full exact request/context.
An advisory transaction lock on the hashed key serializes concurrent requests. Hash-lock collisions merely serialize.

- Same key + same canonical submission returns the same committed non-PII result; no additional business/audit rows.
- Same key + different submission returns conflict.
- A failed transaction leaves no key reservation/result; retry can succeed after the underlying problem is resolved.
- A committed replay remains available after campaign closure/flag changes. It acknowledges a previous commit,
  does not perform new admission and exposes only reference/count/quote, requiring the strong key and matching full request.

UI blocks rapid submissions synchronously and freezes the exact request for ambiguous retries. After an unavailable
response it permits retry, not editing the frozen request. A confirmed invalid request may return to editing.
After success it clears applicant/participant/request state and retains only the non-PII result in component memory.
No localStorage, sessionStorage, IndexedDB, cookie, URL token or service worker stores the submission.
Refreshing clears the form/result. Refresh during an ambiguous response loses the in-memory retry key;
private recovery/retrieval is a separately reviewed future capability, not a new endpoint here.

## Dedicated audit and privacy

`private.qurban_submission_audit` stores exactly registration_id, campaign_id, controlled action,
participant_count, request_hash and server occurred_at. One event per admitted Registration.
No raw diffs, names, contact, email, address, participant text, consent snapshot/text, IP or financial data.
Generic Campaign audit schema/writer/metadata remain unchanged. No public audit reader or admin audit UI is added.

All six Qurban private tables deny raw CRUD to PUBLIC, anon, authenticated (including staff/admin/super_admin),
service_role, supabase_auth_admin, authenticator and campaign_scheduler. RLS is enabled; no permissive policy.
Private schema exposure is unchanged. New private helpers have no runtime EXECUTE.
Only two fixed-empty-search-path trusted-owner public wrappers receive anon/authenticated EXECUTE.
Private implementations are invoker functions; the tiny definer wrappers are necessary because callers receive
neither private-schema USAGE nor raw privileges. No new runtime role, service-role key or credential escalation.
See official [function security](https://supabase.com/docs/guides/database/functions) and
[RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

No real PII is imported into fixtures, source, screenshots, bundles or documentation. Test identities/names are synthetic.
Request bodies are not logged. Browser bundles contain form code/safe types only; domain records remain private.

## Technical abuse bounds and remaining production gate

Streaming HTTP body limit: 65,536 bytes, with fatal UTF-8 decoding and JSON validation; overflow HTTP 413.
The DB independently enforces its JSONB byte limit for direct RPC callers. Exact field/key/type checks apply there too.
Participants: 1–100 technical bound and the current reviewed per-registration campaign limit.
Names 1–160 characters; phone 8–15 digits in bounded supported syntax; address maximum 500 with safe line breaks;
optional email maximum 254; controlled purpose/attendance; boolean group preference and mandatory consent.
Combined participant-name UTF-8 text is limited to 20,000 bytes, leaving room for the existing 32 KiB consent snapshot.
These are payload/storage bounds, not an invented seven-share/family or annual campaign rule.

Same-origin is defense-in-depth; direct RPC callers must pass identical DB validation/gates. No CAPTCHA/vendor added.
There is no durable rate limiter, global quota or final production edge protection in 8.2.
Direct PostgREST still parses an incoming body before the SQL JSONB limit can run.
Provider/edge request/rate limits, abuse monitoring and operational protection remain explicit **Fasa 11 production gates**.
No claim of production hardening/readiness or permission to enable hosted flags.

## Additive SQL inventory

Migration: [20261015022554_qurban_public_registration.sql](../supabase/migrations/20261015022554_qurban_public_registration.sql).
All seven baseline migrations, including 8.1, remain unchanged. No old function, table ACL/RLS, descriptor or audit is replaced.

Tables: private.qurban_submission_idempotency; private.qurban_submission_audit.
Idempotency columns: key_hash PK, payload_hash, unique registration_id FK, server created_at.
Audit columns: registration_id PK, campaign_id composite FK, action, participant_count, unique request_hash FK, occurred_at.
No financial Receipt table: idempotency records are retry evidence only.

Functions (all fixed empty search_path):

- private.qurban_submission_evidence_guard() — immutable new evidence-table guard; invoker.
- private.qurban_submission_payload_valid(jsonb) — immutable exact bounded request validator; invoker.
- private.qurban_registration_context(text) — safe current-context projection; invoker.
- private.qurban_registration_submit(jsonb) — atomic public-admission implementation; invoker, private EXECUTE denied.
- public.public_qurban_registration_context(text) — tiny trusted-owner definer wrapper.
- public.public_qurban_registration_submit(jsonb) — tiny trusted-owner definer wrapper.

Triggers: qurban_submission_idempotency_guard; qurban_submission_audit_guard.
Five indexes including constraints: qurban_submission_idempotency_pkey,
qurban_submission_idempotency_registration_id_key, qurban_submission_audit_pkey,
qurban_submission_audit_request_hash_key, qurban_submission_audit_campaign.
Default PUBLIC and all listed runtime grants are revoked; only the two public wrappers are granted to anon/authenticated.
Generated public types add exactly these two RPC signatures; private table types are not generated/exposed.

## Local owner-review runbook

Run from the repository root with installed dependencies and Docker Desktop Linux engine.
Only the configured disposable mtu-admin-local stack is supported. No hosted key/settings are loaded.
Setup refuses existing campaigns/flags/Auth users/profiles/admin audit/invites; it never overwrites or adopts existing local records.
For an empty stack, start and set up the review session:

```powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/qurban-registration/review-fixture.mjs setup
node scripts/qurban-registration/serve.mjs
```

Open **http://localhost:3082/kempen/local-qurban-review**, then click Daftar Qurban / Aqiqah.
Use dummy applicant data; add multiple mixed participants; select attendance/group request; read the actual fixture akad;
accept, review and submit. A real local DB-backed QBN reference and immutable quote are returned.
Fixture values are explicitly synthetic: 2044, invented Hijri label, RM123.45, 3 cattle × 5 shares, limit 12,
and a local-review-only akad. They are not defaults/seeds or approval for a real annual campaign. Do not pay for this fixture.
The SQL-only admin/MFA fixture is not genuine OAuth/MFA evidence or a usable authenticator.

The launcher supplies local publishable settings in process memory, empty privileged keys, and an offline editorial guard.
Next development diagnostic IndexedDB is disabled for all development sessions so real form PII cannot enter
that diagnostic store, including when the launcher is not used. This setting does not authorize admission;
admission always uses the DB conditions. The separate 8.0 prototype gate remains unchanged.

In another terminal, inspect safe counts and up to 20 non-PII quote/consent evidence summaries:

```powershell
node scripts/qurban-registration/review-fixture.mjs inspect
```

One clean three-person submission gives Registration=1, Participations=3, ConsentAcceptance=1,
AkadVersion=1, submission audit=1, idempotency=1. Flags=2/campaign=1/Auth SQL fixtures=9 belong to setup only.
Match the returned public_reference with the success screen. quoted_total_minor is the stored exact amount;
quote_matches_snapshot and consent_evidence_matches must be true immediately after submission.
This CLI inspection is migration-owner local review only, not an admin/public read API, and prints no contact/participant text.
Concurrent same-key retries leave these counts unchanged. No payment/allocation/volunteer tables exist.
Stop the local app (Ctrl+C), then remove only this recorded demo session and its dependent submissions with **one command**:

```powershell
node scripts/qurban-registration/review-fixture.mjs cleanup
node scripts/admin-foundation/generate-types.mjs --check
```

This is selective cleanup, **not a reset**. It is repeatable: running cleanup again after success performs no deletion.
For another AJK demonstration, run `setup` and `serve.mjs` again. Each setup creates new random session/campaign/identity IDs.
With only the session's fixture/demo data present, expected final counts are descriptor=1/application adapter=1;
campaigns, flags, registrations, participations, akad versions, consent acceptances, submission audit,
idempotency, Auth fixture users, fixture profiles and bootstrap audit all zero. No annual values survive.
An unrelated Auth user is preserved; its presence is not falsely reported as an empty database.

### Selective cleanup ownership and safety

The local-only CLI writes `.cache/qurban-review-session.json` (Git-ignored) containing a random session UUID,
the exact IDs allocated by setup and SHA-256 fingerprints of its campaign, flags, akad, synthetic Auth graph,
profiles and bootstrap audit. It contains no submitted applicant/participant/contact data, keys, JWT or password.
An immutable fixture AkadVersion approval reference binds the session UUID and ownership-plan hash to the exact campaign.
Setup inserts the complete fixture in one DB transaction; a filesystem lock prevents simultaneous CLI setup/cleanup.
An interrupted/incomplete ownership manifest fails closed rather than guessing ownership.

Cleanup requires the approved loopback API, configured mtu-admin-local project and corresponding local Auth/database
container and a local Docker pipe/socket (SSH/TCP Docker contexts are denied). It rejects production mode, hosted deployment markers, non-local API environment settings and non-local
admin environment. The manifest and DB marker must agree. Full fingerprints must still match the setup records.
Ownership is never inferred from the fixed slug, a QBN prefix, applicant names, participant names or telephone numbers.
Only registrations rooted by FK in the exact recorded, session-marked fixture campaign are demo-session submissions.

In one migration-owner CLI transaction, cleanup locks the relevant tables, verifies the recorded graph and rejects
changed setup records, another campaign using shared flags/identities, unowned administrative dependencies,
additional Auth sessions/identities/factors and unknown Auth cascade dependencies. It deletes in this order:

1. Fixture campaign's submission audit and idempotency records.
2. ConsentAcceptance, Participation and Registration for that exact campaign.
3. Its exact fixture AkadVersion and campaign.
4. The fingerprint-matched fixture feature flags.
5. The exact bootstrap audit, fixture profiles, recorded Auth AMR/factor/identity/session/user records.

Only the named immutable-delete guards are temporarily disabled inside this locked transaction and restored before
commit. RLS, ACLs, FK constraints and all other triggers remain intact. A failed check, FK or trigger rolls back
every delete and every guard change. There is no TRUNCATE, CASCADE delete command, persistent bypass function,
new grant, migration, HTTP endpoint or normal production admin hard-delete control. The retained manifest makes
repeat cleanup a safe no-op. Unrelated rows are preserved; ambiguity causes refusal, not a broader delete.

### Explicit full-reset fallback / older untracked fixtures

Fixtures created before session ownership tracking cannot be proven by the new manifest. Selective cleanup deliberately
refuses them. Missing/corrupt evidence, changed fixture setup or extra dependencies likewise require inspection;
never manufacture/adopt a manifest to target existing data. When the owner chooses to discard **all** data in this
disposable local stack, the existing explicit fallback remains:

```powershell
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed
node scripts/qurban-registration/review-fixture.mjs setup
node scripts/qurban-registration/serve.mjs
```

The reset is never invoked automatically by the selective cleanup command. Unlike selective cleanup it discards all
local business/test data. Regression suites that create additional test descriptors still use this explicit full reset
in their isolated test teardown. No fallback command targets hosted Supabase.

## Verification evidence

**1,096 unique automated cases passed**, excluding repeat runs (the original 1,083 plus 13 cleanup cases):

| Check | Passing cases |
| --- | ---: |
| Offline contracts: 8.2 DB/upgrade 99 + request/body 12 + 8.1 DB/upgrade 186 + typed adapter 41 + Campaign/Foundation 172 + prototype gates 18 | 528 |
| Real local 8.2 PostgREST, denial/rollback/concurrent idempotency | 36 |
| Real local 8.1 domain regression | 63 |
| 8.0 prototype browser regression | 13 |
| Real public-form browser tests, 375/430/768/1440px | 11 |
| Final production-mode browser/context/deadline/prototype checks | 3 |
| Real Campaign/Foundation: database 67 + flags 42 + lifecycle 140 + management 78 + public 55 + Admin Foundation 31 + security 16 | 429 |
| Selective demo cleanup contracts / rollback / unrelated-data protection | 12 |
| Real PostgreSQL isolated setup/admission/cleanup/repeat smoke test | 1 |

Cleanup refinement: two real DB-backed registrations / four participations / two consents / two audit events /
two idempotency records plus one fixture akad were deleted in the isolated real PostgreSQL test, returning all
business/Auth/profile/bootstrap counts to zero, descriptor=1 and every immutable guard enabled. A repeat cleanup
remained empty. Unit tests additionally prove unrelated Auth preservation, changed/unknown ownership refusal,
shared-campaign refusal, extra/unknown Auth dependencies, atomic setup failure and late cleanup rollback.
The real test copies schema/ACLs only into a random, newly created local test database (not owner data), and removes
only that database afterward. Existing-object ACLs are retained; Auth-owner future-object default ACL statements
are omitted from this schema copy. The owner's active legacy fixture database is fingerprint-checked unchanged.
Selective CLI cleanup against its missing ownership manifest was refused without deleting anything.
It remains available for owner testing; its current counts are campaign=1, flags=2, akad=1, synthetic Auth users=9,
registrations/participations/consents/audit/idempotency=0. The earlier full-regression final-reset evidence below
predates that owner demo setup; no full reset was repeated over the active untracked fixture during this refinement.
Focused refinement checks: 123 cleanup/registration contract cases plus one real PostgreSQL smoke case passed;
TypeScript, lint, generated type parity, 400 local Markdown links, and tracked/untracked whitespace checks passed.
The seven historical migrations remain unchanged. No application route, API, production migration or grant was
added or changed by the selective-cleanup refinement; browser/build evidence above belongs to the preceding 8.2 candidate.

Owner-approved final checkpoint verification: all 540 offline cases (including the 12 cleanup cases) and the real
isolated PostgreSQL admission/cleanup case were rerun successfully. Production Webpack, TypeScript, lint,
generated public type parity, 263-chunk secret/fixture scans, documentation links and whitespace checks passed again.
Read-only production browser checks repeated 375/430/768/1440px, no overflow, no-store, empty browser storage,
prototype 404 even with its flag, and unknown campaign 404. The active owner demo DB was verified unchanged.
The prior 1,096 unique-case evidence, including real HTTP idempotency/concurrency, responsive submission QA and
Campaign/Foundation regressions, is retained; it is not represented as a fresh full-reset rerun over owner data.
No automatic owner-data reset was performed. The isolated cleanup smoke test returned only its own new test DB
to zero business/Auth/profile/bootstrap rows and removed that DB; the earlier full no-seed reset counts remain
separate historical evidence. All seven baseline migrations remain unchanged.

After the checkpoint is safely remote, further development uses a clean dedicated clone of canonical main,
normal `npm ci` dependencies and repository-root commands. Ignored caches, builds, evidence, manifests,
environment secrets and local DB state are not copied. Stop old checkout servers before using the same
mtu-admin-local stack from another checkout. Legacy untracked demo data remains refused by selective cleanup;
the explicit owner-controlled full reset above is still its fallback. 8.3 remains not started.

Production Webpack build, full TypeScript and lint (zero errors/warnings) pass. Real generated public type parity passes
against the final fresh local reset. Production browser scans cover 263 chunks: no privileged secret, test adapter or PII fixture leak.
Historical Git content hashes match all seven baseline migrations; no historical source was rewritten. The existing Windows
checkout includes native mixed line endings in the 8.1 file, so checks preserve that representation rather than rewrite it.

A fresh real three-person fixture proved exactly 1 Registration / 3 Participations / 1 ConsentAcceptance / 1 AkadVersion /
1 submission audit / 1 idempotency row, with matching immutable config, exact total 37,035 minor units, child snapshot and hash.
Eight concurrent same-key requests returned one reference. Audit failure left every intended record absent.
The complete browser run also inspected eight registrations / 35 participations with all quote/consent evidence matching;
those additional synthetic browser records were then reset.

Earlier full-regression final no-seed counts: descriptor=1, production application adapter=1; campaigns=0, flags=0, registrations=0,
participations=0, akad versions=0, consent acceptances=0, submission audit=0, idempotency=0, Auth fixture users=0.
Both missing flags remain effectively OFF. No fake annual values survive reset. No test-only descriptor/helper survives.

The sole old test assertion changed is the 8.1 full catalog expectation: it now includes the two reviewed 8.2 private evidence
tables. Existing guards/ACLs were not relaxed. Early harness/origin/schema-reset issues were corrected before the final passing runs.
The final focus/address/privacy adjustments were covered by the final 528 offline, 36 real admission, 11 browser and 3 production cases.
Campaign/Foundation regressions cover unchanged generic runtime boundaries.

Reproduce new and relevant verification (run local suites sequentially on the shared disposable stack):

```powershell
node --import tsx --test scripts/qurban-registration/database.test.mjs scripts/qurban-registration/upgrade.test.mjs scripts/qurban-registration/contract.test.ts
node --test scripts/qurban-registration/cleanup.test.mjs
# Safe against an active owner fixture: uses its own temporary local PostgreSQL database.
node --test scripts/qurban-registration/cleanup-local.test.mjs
node --test scripts/qurban-registration/local.test.mjs
# Setup fixture and start serve.mjs as above, then in a second terminal:
node node_modules/@playwright/test/cli.js test -c scripts/qurban-registration/playwright.config.ts
# Stop dev server and cleanup before build/production suites:
node scripts/qurban-registration/review-fixture.mjs cleanup
node scripts/qurban-domain/build.mjs
node --test scripts/qurban-registration/production.test.mjs
node scripts/qurban-domain/regression-local.mjs
node scripts/admin-foundation/generate-types.mjs --check
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js
node scripts/admin-foundation/bundle-check.mjs
node scripts/campaign-engine/management-bundle-check.mjs
```

Final whitespace and local documentation-link checks pass. Ignored evidence artifacts are under .cache/qurban-82;
the existing seven-suite runner records local regression logs under .cache/qurban-81.
No hosted evidence is claimed. Tests use migration-owner fixtures without installing runtime bypasses.
The PGlite contracts supplement real PostgreSQL/Auth/PostgREST tests, not replace them.

Screenshots (synthetic test data only): .cache/qurban-82/registration-review-375.png,
registration-review-1440.png, registration-success-375.png and registration-success-1440.png.
Security-sensitive review diff: .cache/qurban-82/security-sensitive.diff (new migration, server/request boundary and form/CTA changes).

## Exact checkpoint files

- `docs/QURBAN-PUBLIC-REGISTRATION.md`
- `README.md`
- `docs/ROADMAP.md`
- `docs/QURBAN-MVP-PLAN.md` — portable runbook wording only.
- `docs/QURBAN-PROTOTYPE-VALIDATION.md` — portable runbook wording only.
- `next.config.ts`
- `scripts/qurban-domain/database.test.mjs`
- `scripts/qurban-registration/contract.test.ts`
- `scripts/qurban-registration/cleanup.test.mjs`
- `scripts/qurban-registration/cleanup-local.test.mjs`
- `scripts/qurban-registration/database.test.mjs`
- `scripts/qurban-registration/fixtures.mjs`
- `scripts/qurban-registration/fixture-session.mjs`
- `scripts/qurban-registration/local.test.mjs`
- `scripts/qurban-registration/playwright.config.ts`
- `scripts/qurban-registration/production.test.mjs`
- `scripts/qurban-registration/review-fixture.mjs`
- `scripts/qurban-registration/review.spec.ts`
- `scripts/qurban-registration/serve.mjs`
- `scripts/qurban-registration/upgrade.test.mjs`
- `src/app/kempen/[slug]/daftar/hantar/route.ts`
- `src/app/kempen/[slug]/daftar/page.tsx`
- `src/app/kempen/[slug]/page.tsx`
- `src/components/public/campaign-page.tsx`
- `src/components/qurban/registration-form.tsx`
- `src/components/qurban/registration.css`
- `src/lib/qurban/registration-body.ts`
- `src/lib/qurban/registration-contract.ts`
- `src/lib/qurban/registration.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/20261015022554_qurban_public_registration.sql`

## Remaining gates

8.3: protected operational management, amendments/reacceptance/cancellation, exact staff masking,
annual akad administrative approval workflow and audited admin/super_admin Excel snapshot export.
8.4/Fasa 9: authorised verified payment + atomic capacity admission under locked Policy B; allocation operations.
8.5: separate volunteer persistence/assignment. Fasa 9: private proof storage/retention/validation, manual payment verification,
receipts and financial audit. Annual price/year/Hijri values and actual approved wording remain campaign-launch gates.
Overflow/refund/waitlist, retention and recovery procedures remain reviewed future operational decisions.

No payment-proof persistence/upload, verification, receipt, cattle/allocation, volunteer persistence, Excel implementation,
public PII lookup, service_role runtime, hosted mutation/deployment or invented annual production values.
**Owner-approved 8.2 checkpoint. STOP after commit/tag/push and dedicated workspace verification; 8.3 has not started.**
