# Fasa 8.1 — Qurban Domain DB/RLS Foundation

13 October 2026 (+08:00). **Fasa 8.1 complete / owner-approved — Qurban Domain DB/RLS Foundation.**
Checkpoint: `phase-8.1-qurban-domain-foundation` (resolve the tag for the final commit).
Baseline: `7e591e1d9bf81e3ce3b14596798e1f240011457c`, tag `phase-8.0-qurban-architecture-prototype`.
[Owner-locked architecture](QURBAN-MVP-PLAN.md), [8.0 validation](QURBAN-PROTOTYPE-VALIDATION.md),
[Campaign architecture](CAMPAIGN-ENGINE-PLAN.md), [database](CAMPAIGN-ENGINE-DATABASE.md),
[admin management](CAMPAIGN-ADMIN-MANAGEMENT.md) remain authoritative.

Preflight: review checkout clean, main/origin-main and canonical live GitHub main/tag at baseline.
Implementation was reviewed in the isolated `qurban-review` checkout. Owner approved this candidate for the canonical main checkpoint; 8.2 remains next / not started.
Six historical migrations remain byte-for-byte equal to the baseline checkout using Git's checkout filters;
no line-ending rewrite was performed. The existing Windows checkout filter produces CRLF while Git blobs use LF.
No historical migration is modified. Finalization includes the owner-authorized commit/tag/push only; no hosted resources or deployment are touched.

## Scope and additive migration

Pinned Supabase CLI `migration new qurban_domain_foundation` created
[20261013081724_qurban_domain_foundation.sql](../supabase/migrations/20261013081724_qurban_domain_foundation.sql).
It adds only four private domain tables, four internal invoker functions, four integrity triggers,
thirteen indexes (including PK/unique indexes), and one migration-owned descriptor.
No public wrapper/RPC, business CRUD API, runtime domain grant, feature flag seed or campaign seed.

Descriptor: **qurban / config v1 / qurban.enabled**, validator `private.qurban_config_v1_valid(jsonb)`.
It is immutable, SECURITY INVOKER, fixed empty search_path and inaccessible to PUBLIC/runtime roles,
matching the existing descriptor guard. No existing SQL function/ACL or table structure is replaced.
Missing `campaigns.enabled` / `qurban.enabled` remain OFF. Installing a type does not enable a flag.
Generic Campaign lifecycle/open status is not evidence that a public domain submission module exists.

## Configuration v1 exact persisted contract

| Key | Persisted contract |
| --- | --- |
| campaign_year | Integer 1900–9999 |
| hijri_display_label | Trimmed nonempty plain label, 1–80 characters, no control characters |
| currency | Supported v1 currency MYR; explicitly selected, never prefilled |
| price_per_cattle_share_minor | Exact integer minor units, 1–1,000,000,000; no float/string/zero/negative |
| cattle_count | Integer 1–10,000 |
| shares_per_cattle | Integer 1–100 |
| allowed_purposes | Nonempty unique array, maximum two, vocabulary qurban / aqiqah only |
| approved_akad_version | Exact reference, 1–80 ASCII letters/digits/dot/underscore/colon/hyphen; starts alphanumeric |
| registration_rules | Exactly `{ max_participants_per_registration: integer 1–100 }` |
| volunteer_whatsapp_group_url | Optional omitted/null or HTTPS chat.whatsapp.com invite path with 1–128 alphanumeric characters; no credentials, port, query or fragment |

All other keys fail; all required keys must exist. JSON object <=4096 UTF-8 bytes, strict types and
bounded nested rules. The TypeScript parser and immutable SQL validator are tested against the same
isolated corpus. No participant/contact/proof/storage/payment records or executable rules in config.
The numeric bounds are technical payload/representation bounds, not annual selections or religious rules.
Any further purpose/ritual restrictions require reviewed requirements. MYR is v1's supported currency,
not an invented exchange rate or default annual price; broader currency support requires review.

No actual year, Hijri label, price, cattle/share count, purpose selection, registration limit or akad reference
is defaulted or seeded. RM880 / 15 x 7 remain in the previously approved 2026 review fixture only.
No next-campaign price or annual wording has been approved. A reference's syntax alone does not establish
administrative approval/readiness; 8.2 must resolve the approved same-campaign AkadVersion at admission.

## Explicit 8.2 public admission gate

A syntactically valid approved_akad_version in campaign configuration does **not** prove that the approved AkadVersion exists.
Before any real public registration is accepted in 8.2, its admission transaction must fail closed unless all checks hold:

- Campaign is the expected Qurban type and config version.
- Global campaigns.enabled and module qurban.enabled are effectively enabled.
- Campaign lifecycle/window permits registration using database time.
- Current configuration remains valid.
- The referenced same-campaign AkadVersion actually exists.
- Its immutable reference/hash is captured by the Registration/ConsentAcceptance transaction.

These checks must be transactional; syntax validation or browser controls cannot substitute for admission authorization.
**This public transaction is not implemented in 8.1.** No registration API/RPC is exposed.

## Form state versus valid persisted configuration

[admin-registry.ts](../src/lib/campaigns/admin-registry.ts) has the smallest generic extension:

- `defaults()` now returns UI form state, not necessarily a valid persisted Configuration.
- Optional `parseFormState` validates bounded exact form shape separately from `parseConfiguration`.
  Legacy adapters without it keep their existing persisted-parser fallback and validated-default behavior.
- `defineCampaignAdminAdapter<C,F>` returns **CampaignAdminAdapter<C>**, retaining concrete persisted C.
  The common form wrapper checks F before rendering/accepting edits; it never strips keys or manufactures defaults.
- Available types require the exact descriptor/adapter tuple and valid initial **form** shape. Persisted CREATE/UPDATE
  still require the strict persisted parser independently on browser/server/DB boundaries.
- The existing create/core forms disable submit when persisted config is invalid and recheck before submission.
  Removing a required value while editing cannot become an incomplete UPDATE. No raw JSON fallback.

[config.ts](../src/lib/qurban/config.ts) defines `QurbanConfiguration` and separate `QurbanFormState`.
[admin-adapter.tsx](../src/lib/qurban/admin-adapter.tsx) supplies the sole production typed adapter,
label **Qurban / Aqiqah**. All annual fields initially blank; purposes empty; optional group null.
Draft state permits intermediate numeric/URL text while typing, but none of it is persistable until valid.
The form contains reviewed config fields only; it has no applicant/participant/payment PII fields.
No arbitrary/test registry switch. Existing generic Campaign create/update commands and Foundation
RBAC/MFA/audit continue to own campaign management; no new Qurban business mutation command exists.

## Four private entities

### Registration — private.qurban_registrations

UUID PK; unique non-guessable public reference; campaign FK; applicant name/phone/address/optional email;
Registration/applicant-wakil attendance yes/no/unsure; same_cattle_preference; status submitted/cancelled;
immutable campaign_config_version, campaign_revision, submission_configuration and quoted_participation_count;
server timestamps and optimistic row version.

Public reference default is QBN- followed by two independent UUIDv4 values encoded as 64 lowercase hex
characters (244 random bits after UUID version/variant bits). It is unrelated to names, phones, year,
spreadsheet Bil, cattle or share slots. Unique constraint and bounded syntax; future 8.2 must not accept
caller-selected identity/reference. A reference alone is never a private read capability; no read endpoint here.

Accepted submission_configuration is a bounded exact config-v1 snapshot, not an arbitrary JSON bag.
On insert, campaign type/version, revision and snapshot must match the current Qurban campaign exactly.
Generated quoted_currency, quoted_price_per_share_minor and quoted_total_minor use exact bigint arithmetic.
Original quote identity/config/count cannot be updated. Later campaign config edits never rewrite it.
Approved quote count must fit the accepted registration-rule limit. This is requested-share evidence, not reservation.

Names/contact values are required where specified, trimmed, bounded and control-safe. Postal addresses preserve safe internal LF/CRLF line breaks (matching the reviewed textarea); other C0/C1 controls remain denied. Phone syntax and
8–15 digits are checked. Optional email null or bounded valid shape. No unique name/phone rule or global Person.
Updates derive version+1 and updated timestamp; future commands must enforce expected-version checks.
No hard-delete runtime path. Amendment/requote and data-retention commands require 8.3 review.

### Participation — private.qurban_participations

UUID PK, registration FK, bounded participant_name, purpose qurban/aqiqah, server timestamps/version.
Exactly one ibadah/share record per row; no phone/address, payment, attendance, cattle or slot columns.
Purpose must also occur in the Registration's accepted allowed_purposes. UUID/registration/created time immutable;
future controlled amendments can change name/purpose and increment version without rewriting consent history.
No name matching/deduplication. Exact complete participation count is checked when acceptance is recorded.

### AkadVersion — private.qurban_akad_versions

UUID, campaign FK, unique campaign-scoped version_reference, exact approved_text (1–12,000 characters),
SHA-256 content_hash, approved_by FK to retained admin profile, bounded approval_reference and server approved_at.
Approval actor/reference are provenance supplied by a future authorised command, not authorization granted by a row.
The internal insert guard computes hash from UTF-8 text and derives timestamp. No runtime approval command now.
Every ordinary UPDATE/DELETE is denied, including fixture-owner attempts; wording change requires a new version.
No future annual wording or 2026 source wording is seeded. Production AkadVersion rows remain zero.

### ConsentAcceptance — private.qurban_consent_acceptances

UUID, registration/campaign composite FK and akad-version/campaign composite FK enforce same-campaign evidence.
Server accepted_at and accepted_content_hash derived from the immutable AkadVersion, plus an immutable bounded
participation snapshot: array 1–100, <=32768 JSONB UTF-8 bytes; each entry exactly id, participant_name, purpose, version;
unique IDs, bounded names, valid purposes and positive integer revisions. Full original content remains in immutable
AkadVersion; hash + exact FK/reference prove which text was accepted.

Insert locks the Registration and requires the snapshot to match its quoted count and every current Participation's
ID/name/purpose/version. Akad reference must equal the accepted config reference. Subsequent participant/config edits
cannot update this snapshot. Multiple later acceptances can preserve history; detailed amendment/requote semantics are
for 8.3. Every ordinary UPDATE/DELETE is denied. No checkbox-only boolean evidence, typed/drawn signature or seed rows.

## Exact SQL inventory

Tables: private.qurban_registrations, private.qurban_participations, private.qurban_akad_versions,
private.qurban_consent_acceptances.

Internal functions (all fixed empty search_path, invoker, runtime EXECUTE revoked):

- private.qurban_text_valid(text,integer,integer) — immutable plain-text constraint helper.
- private.qurban_config_v1_valid(jsonb) — immutable exact descriptor/config validator.
- private.qurban_consent_snapshot_valid(jsonb) — immutable bounded exact snapshot validator.
- private.qurban_record_guard() — trigger storage-integrity implementation; not a callable business mutation API.

Triggers: qurban_registration_guard, qurban_participation_guard, qurban_akad_guard, qurban_consent_guard.

Indexes including constraint indexes:

```text
qurban_akad_approver
qurban_akad_versions_campaign_id_version_reference_key
qurban_akad_versions_id_campaign_id_key
qurban_akad_versions_pkey
qurban_consent_acceptances_pkey
qurban_consent_akad
qurban_consent_registration
qurban_participation_registration
qurban_participations_pkey
qurban_registration_campaign
qurban_registrations_id_campaign_id_key
qurban_registrations_pkey
qurban_registrations_public_reference_key
```

## PII / RLS / ACL and audit boundary

All four tables: private unexposed schema, RLS enabled, zero permissive policies. No schema exposure/config change.
Raw privileges explicitly revoked from PUBLIC, anon, authenticated, service_role, supabase_auth_admin,
authenticator and campaign_scheduler. All four internal functions have no runtime EXECUTE. No SECURITY DEFINER
function is added. Migration-owner fixture setup is isolated from production grants.

| Role/context | Raw Qurban table CRUD | New internal function EXECUTE | Qurban business RPC/API |
| --- | --- | --- | --- |
| PUBLIC / anon | Denied | Denied | None |
| authenticated (including staff/admin/super_admin) | Denied | Denied | None |
| service_role | Denied by ACL even though it bypasses RLS | Denied | None |
| supabase_auth_admin / authenticator / campaign_scheduler | Denied | Denied | None |
| Migration owner (local fixture/schema work) | Storage constraints/triggers apply | Owner only | No runtime shortcut introduced |

Existing protected generic Campaign commands remain admin-managed, staff read-only; super_admin AAL2/live TOTP
and signed recent-TOTP mutation requirements unchanged. New domain role-specific commands and masked views are
not implemented; UI controls never authorize raw data access. No privileged key, new credential or dependency.
The combination of table grants and RLS follows official [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
and fixed-path invoker [function security guidance](https://supabase.com/docs/guides/database/functions).

No Qurban business-audit writer yet: no Registration business mutation is exposed. The first real 8.2 command must
be transactional and audited in a dedicated bounded domain boundary. Applicant/participant/contact/consent snapshot
and future payment data never enter generic Campaign audit metadata or unrestricted raw diffs. Existing campaign-create
and core-update audit contains only the approved generic action/changed-field metadata.

## Policy B and later gates

Locked Policy B remains: **authorised verified payment + atomic capacity admission -> future eligible/reserved share**.
Registration submitted != reserved; proof submitted != verified/reserved. There are no reserved counters, payment states,
cattle/slot columns or allocation commands here. 8.4 structure/protected operations precede Fasa 9 payment-qualified integration.

- 8.2: narrow transactional public submission, full write-time campaign/flag/window/config/akad checks, opaque reference,
  immutable acceptance/quote, bounded payload/idempotency/abuse handling and dedicated audit. Lock/recheck campaign and Registration in a consistent order; participant amendments in 8.3 must lock the Registration before changing its children. Storage triggers alone are not a full admission/concurrency service. No generic/raw table grants.
- 8.3: protected registrations/participants, amendment/requote/cancellation, staff masking and audited admin/super_admin
  Excel snapshot export. Export is not implemented here.
- 8.4 + Fasa 9: allocation and verified-payment-qualified capacity admission; overflow/refund/waitlist procedure remains future.
- 8.5: separate volunteer persistence and protected assignment; informational supplied participant name only, no automatic matching.
- Fasa 9: private proof storage/validation/retention, verification, payments/receipts/financial audit. No proof/receipt in public Sanity assets.

No Payment, PaymentProof, Receipt, Cattle, Allocation, VolunteerRegistration or VolunteerAssignment table is created.
No public registration API, real Qurban submission, proof upload or Excel implementation. Actual annual values/wording remain launch gates.

## Verification evidence

All values/persons used by tests are explicitly isolated fixtures, never annual defaults or production seeds.
PGlite tests are supplementary PostgreSQL contracts with stubbed Auth; real local tests use PostgreSQL 17/Auth/PostgREST.
No hosted evidence is claimed. Existing offline editorial fixtures intercept actual read-only GROQ; external I/O is refused.

| Check | Evidence |
| --- | --- |
| Qurban DB contracts | 183/183 passed |
| Qurban typed adapter/config | 41/41 passed, including compile-time concrete config/purpose checks |
| Additive upgrade preservation | 3/3 passed; every historical function/ACL and table RLS/ACL unchanged |
| Real local Qurban | 63/63 passed; raw CRUD denial, Data API isolation, strict config, existing campaign-manager authorization, rollback-only consent/quote fixtures |
| Focused offline Campaign/Foundation regressions | 172/172 passed |
| 8.0 prototype | 13/13 browser + 18/18 gate/group tests passed; 375/430/768/1440px, memory-only dummy proof/storage/network guarantees preserved |
| Production Webpack build | Passed using local publishable settings and offline editorial transport |
| Browser bundle scans | 261 chunks; no privileged secrets, test adapters or Qurban PII fixtures |
| Real generated public type parity | Passed; public schema/type file unchanged because new entities are private and no public RPC is added |
| Historical migration bytes | Six files exactly match baseline checkout filters; no historical file rewrite |

Real Campaign/Foundation regression: 67 database + 42 flags + 140 lifecycle + 78 management + 55 public + 31 Admin Foundation + 16 security = **429 unique passing cases**. All seven suites were rerun successfully for this owner-approved closeout, with fresh local resets between suites and after the final suite. Management also verifies real browser creation of a Qurban private draft, incomplete edit denial and 375/430/768/1440px overflow checks. The management suite includes the additional Qurban HTTP contract case.

Final local no-seed state: descriptors 1 (qurban v1), application adapters 1; campaigns 0; feature flags 0; registrations 0; participations 0; akad versions 0; consent acceptances 0; Auth users 0. No isolated participant/annual configuration survives reset. Missing global/module flags remain effective OFF.

Final TypeScript, lint, docs/link checks and whitespace checks pass. 90 local Markdown links checked across README, ROADMAP and this document. Generated public type parity passes against the final real local reset; the checked-in public type file is unchanged. Total focused automated test cases: **922** (186 new DB/upgrade, 41 typed adapter, 63 real Qurban, 172 offline regression, 429 real regression, 31 prototype/gate). Build/type/lint/link/bundle checks are additional.
Initial expected failures were obsolete zero-registry/unsupported-qurban assumptions; those assertions now explicitly
require the single Qurban descriptor and absent module flag, while unsupported test keys still deny. No production guard was relaxed.
The complete 13-case prototype browser suite and 18 gate/group cases were rerun successfully for closeout.

Reproduction from the isolated checkout (Docker Linux engine and installed local packages required):

```powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed
node --test scripts/qurban-domain/database.test.mjs scripts/qurban-domain/upgrade.test.mjs
node --import tsx --test scripts/qurban-domain/adapter.test.ts
node --test scripts/qurban-domain/local.test.mjs
node scripts/qurban-domain/build.mjs
node scripts/qurban-domain/regression-local.mjs
node scripts/admin-foundation/generate-types.mjs --check
node node_modules/typescript/bin/tsc --noEmit
node scripts/admin-foundation/bundle-check.mjs
node scripts/campaign-engine/management-bundle-check.mjs
```

The regression runner resets only mtu-admin-local before each suite and finally, uses private test credentials in memory,
and writes ignored logs under .cache/qurban-81. The production build is a local verification artifact, not a deployment.
Do not run a dev server and production build against the same .next directory concurrently. The 8.0 browser runbook remains unchanged.

## Exact checkpoint files / security-sensitive diff

- README.md
- docs/QURBAN-DOMAIN-DATABASE.md
- docs/ROADMAP.md
- scripts/campaign-engine/flags-local.test.mjs
- scripts/campaign-engine/lifecycle-local.test.mjs
- scripts/campaign-engine/local-database.test.mjs
- scripts/campaign-engine/management-bundle-check.mjs
- scripts/campaign-engine/management-contract.test.ts
- scripts/campaign-engine/management-local.test.mjs
- scripts/campaign-engine/public-contract.test.ts
- scripts/campaign-engine/public-local.test.mjs
- scripts/campaign-engine/security-local.test.mjs
- scripts/qurban-domain/adapter.test.ts
- scripts/qurban-domain/build.mjs
- scripts/qurban-domain/database.test.mjs
- scripts/qurban-domain/fixtures.mjs
- scripts/qurban-domain/local.test.mjs
- scripts/qurban-domain/regression-local.mjs
- scripts/qurban-domain/upgrade.test.mjs
- scripts/qurban-prototype/review.spec.ts
- src/components/admin/campaign-forms.tsx
- src/components/admin/campaign-new.tsx
- src/lib/campaigns/admin-registry.ts
- src/lib/qurban/admin-adapter.tsx
- src/lib/qurban/config.ts
- supabase/migrations/20261013081724_qurban_domain_foundation.sql

The approved checkpoint contains fifteen modified baseline files plus eleven added files. Security-sensitive changes are limited to the new private migration, config/adapter and generic registry/form-validation boundary. Existing Foundation/DAL/RPC/proxy/session/MFA/auth credentials, public DTOs, six historical migrations and Supabase schema exposure remain unchanged.

An ignored local review artifact, .cache/qurban-81/security-sensitive.diff, combines the registry/create/core-form diff with the complete new migration/config/adapter. Production source contains no imported test fixture or new privileged credential. Responsive config screenshots are .cache/qurban-81/qurban-config-375.png, -430.png, -768.png and -1440.png (invented review data only).

**Owner-approved 8.1 checkpoint complete. STOP after commit/tag/push; 8.2 has not started.**
