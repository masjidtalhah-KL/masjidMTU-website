# Fasa 8.5 — Qurban Volunteer Registration & Admin Assignment

**Fasa 8.5 complete / owner-approved — Qurban Volunteer Registration & Admin Assignment.**
**Fasa 8 — Qurban MVP Foundation complete / owner-approved (8.0–8.5).**
Owner reviewed and approved the implementation without further functional changes.
Checkpoint: `phase-8.5-qurban-volunteers` (resolve tag for commit).
Baseline: `3394b06a11081f5103f38f3aeeea9a2ec0265c13`, tag `phase-8.4-qurban-allocation-foundation`.
16 October 2026 (+08:00). Official dedicated Masjid repository; 8.0–8.4 complete / owner-approved.
Fasa 9 is next / not started. No hosted mutation or deployment. This checkpoint closes Fasa 8 only.

Contracts: [owner architecture](QURBAN-MVP-PLAN.md), [domain](QURBAN-DOMAIN-DATABASE.md),
[public participant admission](QURBAN-PUBLIC-REGISTRATION.md), [protected admin](QURBAN-ADMIN-MANAGEMENT.md),
[allocation](QURBAN-ALLOCATION.md), [roadmap](ROADMAP.md).
All ten previous migration files retain their original native bytes and Git contents.
New CLI-generated additive migration: [20261016035251_qurban_volunteer_foundation.sql](../supabase/migrations/20261016035251_qurban_volunteer_foundation.sql).
No campaign, feature flag, annual year/price/capacity/akad, task label or volunteer is seeded.

## Owner-locked public fields

Exactly: name; phone; optional email; shirt_size; also_participant; participant_name_information.
Shirt vocabulary is **XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL**, with exact case/spelling.
HTML select and DB CHECK enforce the same vocabulary. XXL, 6XL, xxxx-xl variants, blank/padded/free text are denied.
Name/informational name: trimmed, control-safe, 1–160 characters. Phone: trimmed, at most 30 characters,
8–15 digits and only digits/spaces/parentheses/hyphens/optional leading +. Email is null or bounded 3–254 characters
with reviewed basic syntax. The browser trims before validation; direct callers must send canonical trimmed values.

also_participant=false requires participant_name_information=null. True requires the bounded informational name.
This is an owner-supplied operational note, not a verified person identity, participant FK or matching key.
No name/phone deduplication, participant lookup, Registration/Participation creation, cattle assignment or financial link.
The sibling participant flow continues to create zero Volunteers; the volunteer flow creates zero Qurban
Registrations, Participations, ConsentAcceptances and Allocations. Neither submission reserves a share.
No preferred task/department, availability/shift, WhatsApp consent, payment, IC, address or emergency contact control.

## Public routes, safe context and eligibility

Eligible `/kempen/[slug]` shows independent **Daftar Qurban / Aqiqah** and **Daftar Sukarelawan** CTAs.
The generic Campaign DTO is unchanged. Volunteer CTA/form eligibility uses its own narrow read:
`public.public_qurban_volunteer_context(target_slug text)`.
Route: `/kempen/[slug]/sukarelawan`; JSON POST: `/kempen/[slug]/sukarelawan/hantar`.
Dynamic/no-store reads; invalid/ineligible context gives neutral 404; operational errors are sanitized unavailable.

Safe context is exactly:

~~~typescript
{
  slug, title, config_version: 1, campaign_version,
  global_flag_version, module_flag_version,
  campaign_year, hijri_display_label
}
~~~

No private IDs/records/configuration, names/phone/email, audit, price/capacity, akad internals or WhatsApp group URL.
The expected descriptor is qurban / 1 / qurban.enabled with its approved private config validator.
Configuration must remain valid. campaigns.enabled and qurban.enabled must exist and be true.
Visibility public/unlisted only; stored status open and DB clock inside the existing registration window.
Draft/scheduled/paused/closed/archived/private, missing/OFF flags, before-open/after-close and wrong type/config deny.
A delayed scheduler never extends eligibility. No separate volunteer window/config version is introduced.

Volunteer registration is not an ibadah acceptance transaction: unlike participant admission it does not resolve or
accept AkadVersion. Valid annual Qurban configuration is still required, but a volunteer is not forced to perform
participant akad acceptance. This does not weaken the existing participant admission/akad gate.

## Admission, idempotency and privacy

Exact request (8192 UTF-8 bytes maximum at HTTP and DB, nested fields also bounded to 2048 JSONB bytes):

~~~typescript
{
  slug, idempotency_key, // 64 lowercase hex; browser crypto.getRandomValues(32 bytes)
  expected_campaign_version,
  expected_global_flag_version,
  expected_module_flag_version,
  volunteer: {
    name, phone, email, shirt_size, also_participant,
    participant_name_information
  }
}
~~~

No caller-selected internal ID/public reference, status, assignment, price, payment or raw extra keys.
JSON object key order is canonicalized by PostgreSQL JSONB before SHA-256 hashing. Persist only key hash,
canonical payload hash and committed volunteer ID, not the raw key or raw request. PII lives only in its domain row.
A transaction advisory lock per key serializes retries. Same key/same payload returns the same opaque receipt;
same key/different payload conflicts. A committed replay returns no private fields, even after closure.

New admission locks flag namespaces/rows in the reviewed global-then-module order, then the campaign FOR UPDATE.
It rechecks current context and exact revision tokens, inserts Volunteer + idempotency + structural submission audit,
and rechecks DB window before commit. Failure rolls everything back; no partial volunteer/evidence result.
No service-role application client, raw runtime table CRUD or private schema exposure.

Response is exactly `{ reference, whatsapp_group_url }`. Reference is DB-generated `VLT-` plus two random UUIDv4
hex strings (64 hex characters, approximately 244 random bits), matching the reviewed QBN reference design.
It is unique/opaque, unrelated to name/phone/year/cattle numbering. It is not a public PII read capability.
There is no public reference-only status/detail lookup endpoint.

Success: **Pendaftaran sukarelawan berjaya**, full VLT reference, just-submitted name/size in current UI memory,
Dihantar and **Tugasan akan ditentukan oleh pihak pengurusan masjid.**
The safe configured volunteer_whatsapp_group_url appears only in the successful receipt; an absent URL produces
no control or placeholder. The exact approved https://chat.whatsapp.com/<token> URL is validated again before
rendering a new-tab noopener/noreferrer link. No joined/consent/acceptance record is stored.
The idempotency receipt preserves that original public-safe URL for stable replay.

The browser freezes the request/key for ambiguous network retries and blocks double-click submission. Invalid
input may be corrected; stale revision/availability requires reload/review. Success clears form/frozen request;
only the memory-only receipt/display name/size remain. Refresh returns to a blank form, no PII URL/storage.
No localStorage, sessionStorage or IndexedDB. React text rendering escapes user input; no HTML rendering.
Exact Content-Type application/json, configured same origin, no query payload, streamed body limit and safe errors
provide basic abuse defenses. Direct RPC callers must still pass all DB validation/gates.
Provider/edge rate limiting remains a Fasa 11 production-hardening gate; no external CAPTCHA/vendor is introduced.

## Private model and deny-first boundaries

| Table | Responsibility |
| --- | --- |
| private.qurban_volunteers | UUID, same-campaign label FK, DB-generated unique public_reference, six reviewed fields, submitted/cancelled, optional assignment_label_id, DB timestamps/version |
| private.qurban_volunteer_assignment_labels | Stable UUID/campaign, bounded name, stored normalized_name, active state, DB timestamps/version |
| private.qurban_volunteer_idempotency | key_hash PK, payload_hash, unique volunteer FK, original optional public-safe group URL, server time; immutable |
| private.qurban_volunteer_audit | UUID/campaign, optional same-campaign volunteer/label/previous-label IDs, actor, controlled action/field categories/reason, expected/result version, request hash for submission, server time; immutable |

RLS enabled on all four, zero policies. Raw privileges revoked from PUBLIC, anon, authenticated, service_role,
supabase_auth_admin, authenticator, campaign_scheduler. Private helper EXECUTE revoked from the same roles.
Only tiny migration-owner SECURITY DEFINER public wrappers have exact runtime execution grants; all functions
have fixed empty search_path. Private implementations are invoker functions, not a second runtime bypass.
Public context/submit EXECUTE: anon + authenticated. Admin wrappers: authenticated, with current Foundation checks.
No grant exposes private schema or privileged browser credentials. Normal DELETE is denied by guards and ACLs.

Four guards: qurban_volunteer_guard; qurban_volunteer_label_guard; qurban_volunteer_idempotency_guard;
qurban_volunteer_audit_guard. Volunteer UUID/reference/campaign/created_at immutable; version and update time
are server-controlled. Cancelled is terminal. Evidence UPDATE/DELETE denied. Production guard behavior is never
weakened to simplify review. FK campaign ownership prevents cross-campaign label/audit relationships.

Keys/indexes: label PK, (id,campaign_id) unique and (campaign_id,normalized_name) unique;
volunteer PK, public_reference unique, (id,campaign_id) unique, campaign/status/time/id pagination,
campaign/assignment/id index; idempotency key PK and volunteer unique; audit PK, unique request_hash,
campaign/time/id index. The UUID label FK represents one current assignment, not multiple shifts/records.

## Assignment labels and controlled operations

No task names are hardcoded in production code or seeded. Admin defines campaign-scoped labels.
Normalize case and consecutive whitespace for uniqueness; name trimmed, 1–80 characters, no controls or < > HTML.
Stable UUID identity survives rename/archive. Archived names remain unique and labels remain readable.
Archive is terminal in this MVP: no reactivate/delete workflow. Archiving does not clear or silently move existing
assignments. Archived labels cannot receive new assignments, including a stale set request.

Admin/super_admin can correct the six public fields, set/change/clear one current assignment, and soft-cancel.
All writes require expected volunteer version; label rename/archive and non-null assignment also require exact label
version. Lock order is Foundation actor → campaign FOR UPDATE → volunteer → target label. A private volunteer-only write gate reuses Foundation authorization and the reviewed lock order, with no capacity-grid dependency; it never calls or grants the allocation primitive. Concurrent writes cannot overwrite;
stale/archived/occupied-version conflict produces no partial update/audit and asks the UI to reload/review.
Corrections do not match/create participant records. False also_participant clears information to null; true requires it.
No-op correction/assignment/rename does not advance version or create misleading audit.

Cancellation submitted → cancelled requires one existing reviewed reason code:
applicant_request; duplicate_registration; entry_error; other_operational.
No arbitrary reason text. It atomically clears current assignment, records assignment.cleared if needed and
volunteer.cancelled, with the same volunteer version transition. Both events are committed together; ordering
within a timestamp tie is not a separate business guarantee. History/labels remain retained, no reopen or hard delete.

## Admin projection and UI

Protected `/admin/campaigns/[id]/qurban` gains **Sukarelawan** with paginated operational cards/table,
current detail, label management, assignment controls and bounded manager-only activity.
Generic campaign list remains free of volunteer PII.

| Capability | staff | admin | super_admin |
| --- | --- | --- | --- |
| Reference/name/phone/size/informational participant/current label/status/time | Read-only | Yes | Foundation-gated |
| Email in detail/full export | Omitted/denied | Yes | Foundation-gated |
| Amend/cancel/assign/label management | Denied | Yes | AAL2 + recent TOTP required for write |
| Audit/full workbook | Denied | Yes | Existing Foundation rules |

DB read projection omits email keys for staff; hidden browser JSON never contains the email.
Read acquires the existing actor SHARE guard against concurrent membership changes. Disabled/revoked/outsider
and public identities cannot use admin commands. UI hiding is defense-in-depth, never authorization.

List search/reference/name/phone/filter travels as bounded same-origin POST JSON, not PII in URL.
Page 1–10000, size 1–50; exact filters status, shirt size, assigned yes/no, label UUID, also_participant yes/no.
Order created_at DESC, UUID DESC. Label choices/list have separate 50-label pages; no unbounded browser preload.
Detail GET requires campaign + volunteer UUID. Staff has read-only label view and no command controls.
Activity pages contain up to 50 structural events; no private request/snapshot/PII diff is returned.

Summary: total includes retained cancelled records. Active=submitted; assigned/unassigned and also-participant
counts apply only to active volunteers. Every shirt-size distribution is active-only for operational stock planning.
Cancelled volunteers neither consume an assignment nor inflate active shirt stock counts.

## RPC inventory

Private functions (14 new): qurban_volunteer_guard(); qurban_volunteer_fields_valid(jsonb) immutable;
qurban_volunteer_context(text); qurban_volunteer_submit(jsonb); qurban_volunteer_summary(uuid);
qurban_volunteer_list(uuid,jsonb); qurban_volunteer_detail(uuid,uuid);
qurban_volunteer_campaign(uuid); qurban_volunteer_amend(uuid,uuid,integer,jsonb); qurban_volunteer_cancel(uuid,uuid,integer,text);
qurban_volunteer_labels(uuid,integer); qurban_volunteer_label_command(uuid,jsonb);
qurban_volunteer_assign(uuid,uuid,integer,uuid,integer); qurban_volunteer_activity(uuid,integer).

Public wrappers (10 new): public_qurban_volunteer_context; public_qurban_volunteer_submit;
admin_qurban_volunteer_list; admin_qurban_volunteer_detail; admin_qurban_volunteer_amend;
admin_qurban_volunteer_cancel; admin_qurban_volunteer_labels; admin_qurban_volunteer_label_command;
admin_qurban_volunteer_assign; admin_qurban_volunteer_activity.

The additive migration replaces only two existing private export bodies:
qurban_admin_export_snapshot and qurban_admin_export_complete. Their signatures/security/ACLs remain unchanged.
It adds bounded volunteer_count to export tickets and nullable export-only volunteer_count to the existing
Qurban operational audit. No generic Campaign audit schema/writer or allocation function/ACL is changed.
Generated public Supabase types add only the ten wrappers, with private tables still unexposed.
SQL nullable assignment-clear args are validated and passed as actual JSON null; the generator's argument types
cannot express SQL parameter nullability, so that one server call uses a documented exact Args type assertion.

## Audit vocabulary

volunteer.submitted; volunteer.amended; volunteer.cancelled; volunteer.assignment.set;
volunteer.assignment.changed; volunteer.assignment.cleared; volunteer.assignment_label.created;
volunteer.assignment_label.renamed; volunteer.assignment_label.archived.
Submission: no actor PII; campaign/volunteer ID, key hash, time, version 0→1. Operational events record current actor
UUID, target identities, controlled changed_fields/version/reason and label IDs. Never names, phone, email,
participant_name_information, raw request/diff, IP address, payment or consent. Label display text is not copied into
audit; history references stable label identities. Audit table constraints bound action-specific shapes and guards
verify submission receipt ownership / operational actor. Audit failure rolls back its business mutation.

## Excel integration

Exactly six sheets in order: **Ringkasan; Pendaftaran; Peserta; Sukarelawan; Susunan Lembu; Format Audit - Legacy View**.
Existing participant/cattle views and Policy B meanings remain. Payment dates stay blank; no payment status invented.
Sukarelawan columns: Bil; No. Rujukan; Nama; No. Telefon; Email; Saiz Baju; Juga Peserta;
Nama Peserta (Maklumat); Tugasan; Status; Tarikh Daftar (MYT); Tarikh Kemaskini (MYT).
Current data and current label text, cancelled history retained; no identity linking or workbook import/write-back.

Canonical operational ordering: active assigned first, label case-insensitive, logical shirt-size order, name/reference;
active unassigned next, logical size then name/reference; cancelled last. This gives deterministic grouping and
XS < S < M < L < XL < 2XL < 3XL < 4XL < 5XL, never lexical size ordering.
Ringkasan appends a separately labelled volunteer section after existing participant/grid metrics:
all/active/cancelled; active assigned/unassigned; active also-participant; all nine active shirt-size counts.
It never conflates volunteers with cattle capacity/ibadah shares/verified payment.

One protected materialized SQL/MVCC snapshot supplies registrations, participants, allocations and volunteers/labels
for all six sheets. No second per-sheet query. Bound: existing 5000 registrations/20000 participants/16 MiB snapshot
plus at most 10000 volunteers. Snapshot fingerprint includes all volunteer data; export ticket binds actor/hash/counts.
Workbook serialization must succeed before existing protected completion/audit RPC; completion failure withholds output.
The completed export audit records safe volunteer_count only, not workbook PII. Staff full export remains denied.
No new dependency: existing ExcelJS 4.4.0. Explicit text cells preserve +/leading-zero phones and make =,+,-,@,
tab/control-leading strings inert; no formula objects/elements. Invalid XML controls are removed defensively.
Typed dates/counts, frozen bold headers, wrapping, filters, print titles and existing landscape printing remain.
Native Excel opening/printing is an owner review step; preview rendering alone does not prove native printer behavior.

## Repeatable local owner/AJK review

Run from the repository root in the official dedicated Masjid checkout. Requires Docker Desktop, installed deps
and Microsoft Edge for the optional local reviewer. One checkout only against mtu-admin-local.

~~~powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/qurban-registration/review-fixture.mjs setup
# Optional: nine synthetic volunteers covering every shirt size; refuses existing volunteers.
node scripts/qurban-volunteers/review-fixture.mjs seed
node scripts/qurban-registration/serve.mjs
~~~

Public URL: http://localhost:3082/kempen/local-qurban-review/sukarelawan
Or campaign http://localhost:3082/kempen/local-qurban-review and choose Daftar Sukarelawan.
Fill synthetic name/phone, optional email, controlled size, also-participant no/yes + informational name, review/submit.
No task preference or participant search. Save the real local DB-backed VLT reference; no WhatsApp link when absent.
In another terminal:

~~~powershell
node scripts/qurban-admin/review-browser.mjs admin
# Separate read-only reviewer if needed:
node scripts/qurban-admin/review-browser.mjs staff
~~~

Reviewer uses synthetic local OAuth/MFA evidence through unchanged production auth/DAL/DB guards, not genuine
Google login or a production bypass. Tokens remain in disposable browser memory; external navigation is blocked.
Use Qurban → Sukarelawan: inspect summary/sizes; create your own labels; rename/archive; correct contact/size;
assign/reassign/clear; cancel one with controlled reason; inspect activity; Export → actual workbook.
Inspect Sukarelawan/Ringkasan and the preserved cattle/participant sheets. Email is manager-only.

Close reviewer browsers and stop the app with Ctrl+C, then one selective cleanup command:

~~~powershell
node scripts/qurban-volunteers/review-fixture.mjs cleanup
# Equivalent existing cross-domain selective cleanup:
node scripts/qurban-registration/review-fixture.mjs cleanup
node scripts/qurban-registration/review-fixture.mjs inspect
~~~

Ownership manifest + original campaign/akad/Auth/flags fingerprints are verified under table locks, atomically.
Volunteer audit → idempotency → volunteers → labels are removed before parent/session records, alongside the
existing owned allocation/registration graph. Repeat cleanup is a no-op; unrelated records/ambiguous ownership
are refused/preserved. Guard disable/delete exists only inside this proven local migration-owner CLI transaction;
all guards are restored atomically. No public/admin HTTP hard-delete or runtime bypass is exposed.
The shared synthetic command preflight stops before the first guard-disable irrespective of domain ordering;
seed/allocation review commands never disable a guard. Legacy fixtures without ownership manifest remain refused.
Explicit full disposable fallback, never automatic owner-data reset:

~~~powershell
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed
~~~

## Verification evidence

Final verification: **1,439 unique automated cases passed**, with no failed/skipped cases in the counted suites.
Reruns are excluded, as are the additional local reviewer launch checks and CLI smoke walkthrough.
Evidence is retained in ignored .cache/qurban-85 logs/artifacts. Test data is synthetic only, never production seeds.
Tests cover exact fields/sizes; flags/lifecycle/window/type/config; stale context; canonical replay/concurrency;
transaction rollback; DB/RPC/raw ACL; current Foundation roles/MFA; staff masking; corrections and immutable identity;
labels/one-assignment/cancellation; structural audit; six-sheet OOXML/formula safety/snapshot semantics;
public/admin responsive UX at 375/430/768/1440; owner-tool ownership/cleanup; all prior Qurban/Campaign/Foundation suites.


## Final owner-approved checkpoint evidence — 16 October 2026

Owner-checkpoint rerun: all eleven counted suite groups were rerun after owner approval and passed again,
retaining **1,439 unique cases** (reruns excluded). The final fresh-log/no-fixture assertion is recorded in
.cache/qurban-85/final-checkpoint-verification.json; build/browser/cleanup/type/bundle/catalogue steps are in
checkpoint-rerun.json and their logs. Selective cleanup was repeated twice, all business/Auth fixture counts
returned to zero, all guards are enabled, one descriptor/production adapter remains, and no initial allocator
runtime access exists. TypeScript, zero-warning lint, production Webpack, generated-type parity, 280-chunk
secret/PII/private-helper scans, 430 documentation links and diff whitespace checks passed.
No functional changes were made during this owner-approved finalization. Fasa 8 is complete; Fasa 9 not started.


| Counted suite | Passed unique cases |
| --- | ---: |
| Offline SQL/contracts/workbooks/upgrades and prior suites | 819 |
| Real volunteer PostgreSQL/Auth/PostgREST/HTTP/browser/concurrency/Excel | 27 |
| Real allocation | 19 |
| Real protected registration admin | 18 |
| Real Qurban domain foundation | 63 |
| Real public participant registration | 36 |
| Real production-mode participant gates | 3 |
| Real Campaign Engine / Admin Foundation | 429 |
| Isolated real selective cleanup | 1 |
| Public campaign/registration browser | 11 |
| Review prototype browser/gates | 13 |
| **Total (reruns excluded)** | **1,439** |

The 819 offline cases include 137 new volunteer cases (99 database, 24 typed contracts,
12 workbook, 2 upgrade) plus 2 extra cleanup safety cases; 680 prior cases remain passing.
The 429 real Campaign/Foundation cases comprise 67 + 42 + 140 + 78 + 55 + 31 + 16.
The final 27-case volunteer run uses the final production Webpack build and the independent volunteer campaign
write gate; it includes the final 2,048-byte nested payload guard. TypeScript, zero-warning lint, generated public
Supabase type parity, production Webpack, both Foundation/Campaign bundle checks, 280-chunk secret/fixture/private-helper
scan, 430 repository-local documentation links, tracked and new-file whitespace checks all pass.
No package or lockfile dependency change. The ten prior migrations retain their original native SHA-256 bytes.

Concurrency evidence: 12 simultaneous same-key/same-payload requests yield one opaque reference,
one volunteer and one submission audit; changed payload conflicts. Simultaneous differing payloads on one key
produce one success and one conflict. Two versioned assignment requests produce one commit, one conflict,
and one audit. Assigned cancellation creates exactly assignment.cleared + cancelled with the same revision.
Injected submission-audit failure rolls the entire transaction back with a sanitized unavailable result;
test-only trigger/function are removed. Evidence: idempotency-concurrency.json, assignment-concurrency.json,
volunteer-local.log under .cache/qurban-85.

Responsive browser QA covers public form/success, admin list/detail/label/assignment controls at
375, 430, 768 and 1440 px. No horizontal overflow; labels/focus/error announcements, escaped user input,
review, rapid/double submission, refresh clearing and no localStorage/sessionStorage/IndexedDB PII pass.
Actual screenshots: public-empty-375.png; public-form-{375,430,768,1440}.png;
public-success-{375,430,768,1440}.png; admin-{list,detail,labels}-{375,430,768,1440}.png;
admin-staff-375.png; admin-activity-375.png; admin-cancelled-375.png, under .cache/qurban-85.

### Actual workbook and local fixture evidence

Actual protected browser download: .cache/qurban-85/admin-volunteer-export.xlsx.
Six exact sheets, 16 volunteer rows, 14 active, 2 cancelled, 1 active assigned, 13 active unassigned,
2 active also-participant. Valid Office Open XML, zero formula elements; typed strings preserve optional +
and leading-zero phone numbers. Separate injection/ordering artifact: volunteer-workbook-test.xlsx.
Print/render QA: render/Sukarelawan.png and render/Ringkasan-Sukarelawan.png, generated from a read-only import.
The preview renderer may visually normalize numeric-looking phone strings; the authoritative OOXML/ExcelJS
inspection confirms original typed phone text. Native Excel opening/printing remains owner manual review.
No exported workbook is imported into the database.

The final native suite before cleanup records 16 volunteers / 3 labels / 32 volunteer audit rows /
16 idempotency rows. The independent participant sibling regression separately creates one Registration,
two Participations, one ConsentAcceptance, one AkadVersion, one submission audit and one idempotency row;
original quote/hash/participation evidence matches. The export completion has one bounded operational audit
and one export ticket. There are zero cattle, slots or allocations. The volunteer-only seed separately proves
9 volunteers / 9 idempotency / 9 audit and zero Qurban Registration/Participation/Allocation.
These synthetic states are archived in fixture-before-cleanup.json, export-evidence.json and fixture-smoke.json.

CLI smoke: setup → seed all nine exact shirt sizes → refuse repeat seed without changes → create a synthetic
local label / assign / cancel → selective cleanup twice. One label and 13 volunteer audits are accounted for;
all fixture rows are removed and all guards restored. Unrelated/ambiguous/legacy fixture refusal and atomic
rollback remain covered by offline and isolated PostgreSQL cleanup tests. No owner data is reset automatically.
Fresh real local no-seed resets are exercised on the verified disposable test stack, independently of any
active owner demo. Final cleanup evidence in final-cleanup.json:

~~~text
Qurban descriptor = 1; production application adapter = 1
campaigns = flags = registrations = participations = akad versions = consent acceptances = 0
submission audit = registration idempotency = operational audit = export tickets = 0
cattle = cattle slots = allocations = 0
volunteers = assignment labels = volunteer audit = volunteer idempotency = 0
local fixture Auth users = 0
~~~

### Final database catalogue / security-sensitive diff

Catalogue evidence: database-inventory.json. Four new private tables, 24 new functions (14 private INVOKER,
10 narrow public SECURITY DEFINER wrappers), four enabled guard triggers, 13 indexes, RLS on all four tables,
zero permissive policies. Each function has fixed empty search_path and trusted postgres ownership.
All six enumerated runtime roles lack raw table CRUD and private helper EXECUTE; PUBLIC privileges are revoked
by migration and SQL grant tests. Existing initial allocator runtime EXECUTE remains denied.
Only existing qurban_admin_export_snapshot and qurban_admin_export_complete bodies are replaced to extend the
same protected snapshot/completion audit with bounded volunteer counts; signatures and prior security stay intact.
The volunteer-only campaign write gate never calls the allocation/payment gate.

Exact new indexes (including constraint indexes):

~~~text
qurban_volunteer_assignment_lab_campaign_id_normalized_name_key
qurban_volunteer_assignment_labels_id_campaign_id_key
qurban_volunteer_assignment_labels_pkey
qurban_volunteer_audit_page
qurban_volunteer_audit_pkey
qurban_volunteer_audit_request_hash_key
qurban_volunteer_idempotency_pkey
qurban_volunteer_idempotency_volunteer_id_key
qurban_volunteer_assignment
qurban_volunteer_page
qurban_volunteers_id_campaign_id_key
qurban_volunteers_pkey
qurban_volunteers_public_reference_key
~~~

Security-sensitive candidate diff: .cache/qurban-85/security-sensitive.diff (all source/migration and local
fixture ownership/cleanup tools). Full tracked + new-file diff/stat, exact changed files and Git status are
full-candidate.diff, full-diff-stat.txt, changed-files.txt and git-status.txt. The pre-checkpoint evidence was captured with nothing staged, committed,
pushed or tagged on the owner-approved 8.4 baseline. Owner has now authorized the final 8.5 commit/tag/push;
the checkpoint tag resolves the final commit. No hosted resource is contacted
for mutation or deployment. No new production annual values, labels or fixtures are seeded.

### Exact checkpoint changed files

~~~text
README.md
docs/QURBAN-ADMIN-MANAGEMENT.md
docs/QURBAN-MVP-PLAN.md
docs/QURBAN-VOLUNTEERS.md
docs/ROADMAP.md
scripts/qurban-admin/database.test.mjs
scripts/qurban-admin/local.test.mjs
scripts/qurban-admin/workbook.test.ts
scripts/qurban-allocation/local.test.mjs
scripts/qurban-allocation/review-fixture.mjs
scripts/qurban-allocation/workbook.test.ts
scripts/qurban-domain/database.test.mjs
scripts/qurban-registration/cleanup.test.mjs
scripts/qurban-registration/database.test.mjs
scripts/qurban-registration/fixture-session.mjs
scripts/qurban-registration/review-fixture.mjs
scripts/qurban-volunteers/contract.test.ts
scripts/qurban-volunteers/database.test.mjs
scripts/qurban-volunteers/local.test.mjs
scripts/qurban-volunteers/review-fixture.mjs
scripts/qurban-volunteers/upgrade.test.mjs
scripts/qurban-volunteers/workbook.test.ts
src/app/admin/api/campaigns/[id]/qurban/volunteers/[volunteer]/assignment/route.ts
src/app/admin/api/campaigns/[id]/qurban/volunteers/[volunteer]/cancel/route.ts
src/app/admin/api/campaigns/[id]/qurban/volunteers/[volunteer]/route.ts
src/app/admin/api/campaigns/[id]/qurban/volunteers/activity/route.ts
src/app/admin/api/campaigns/[id]/qurban/volunteers/labels/route.ts
src/app/admin/api/campaigns/[id]/qurban/volunteers/route.ts
src/app/kempen/[slug]/page.tsx
src/app/kempen/[slug]/sukarelawan/hantar/route.ts
src/app/kempen/[slug]/sukarelawan/page.tsx
src/components/admin/qurban-admin.css
src/components/admin/qurban-panel.tsx
src/components/admin/qurban-volunteers.tsx
src/components/qurban/registration.css
src/components/qurban/volunteer-form.tsx
src/lib/qurban/export-workbook.ts
src/lib/qurban/registration-body.ts
src/lib/qurban/registration.ts
src/lib/qurban/volunteer-admin-contract.ts
src/lib/qurban/volunteer-admin.ts
src/lib/qurban/volunteer-contract.ts
src/lib/qurban/volunteer.ts
src/lib/supabase/database.types.ts
supabase/migrations/20261016035251_qurban_volunteer_foundation.sql
~~~

## Remaining gates / STOP

Fasa 8.5 and the Fasa 8 Qurban MVP Foundation are complete / owner-approved.
Completion does not authorize opening a real campaign or assert production readiness.
Annual configuration/akad approval, production abuse controls and Fasa 9 integration remain explicit launch gates.
No multiple simultaneous assignments, shifts/scheduling, check-in, public preferred-task/availability selection,
volunteer/participant identity matching, payment/proof/receipt/refund/waitlist or allocation eligibility work.
No hosted mutation/deployment or previous migration edit. Fasa 9 not started.
**STOP after the owner-authorized 8.5 commit/tag/push. Do not begin Fasa 9.**
