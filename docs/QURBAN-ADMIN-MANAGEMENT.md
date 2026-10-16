# Fasa 8.3 — Qurban Admin Registration Management + Excel Audit Export

**Fasa 8.3 complete / owner-approved — Qurban Admin Registration Management + Excel Audit Export.**
Owner-approved on 16 October 2026 (+08:00), including the three presentation/reporting refinements below. Baseline:
8c15eea47b14b4a79d050bf5d929ce091573abb7, tag phase-8.2-qurban-public-registration.
8.0–8.3 are owner-approved. Checkpoint: `phase-8.3-qurban-admin-management` (resolve tag for commit).
At the historical 8.3 checkpoint, 8.4 was next / not started. The owner-approved 8.4 allocation/export refinement is documented below and in [Qurban allocation](QURBAN-ALLOCATION.md); 8.5 is now complete / owner-approved; see the current volunteer checkpoint below. No hosted mutation/deployment.
Work uses the dedicated website repository, never the legacy colouring-book review checkout.
Run every command below from the repository root.

Contracts: [owner architecture](QURBAN-MVP-PLAN.md), [8.1 database](QURBAN-DOMAIN-DATABASE.md),
[8.2 public admission](QURBAN-PUBLIC-REGISTRATION.md), [Campaign admin](CAMPAIGN-ADMIN-MANAGEMENT.md),
[roadmap](ROADMAP.md). All eight previous migration files remain byte-for-byte unchanged.
New additive migration: [20261015140703_qurban_admin_management.sql](../supabase/migrations/20261015140703_qurban_admin_management.sql).

## Owner decisions and MVP scope

Ordinary authorised participant-name or Qurban/Aqiqah-purpose correction **does not require akad reacceptance**.
Current Participation may differ from the original ConsentAcceptance. The original snapshot/hash/reference/text,
accepted timestamp and submitted quote/config/count remain immutable. No pending_reacceptance state, acceptance
rewrite, typed signature or public reacceptance route. Audit records the correction's category/actor/version, not its PII values.

**Choice A:** edit existing participants only. No add/remove participant, requote, new current quote or price/count override.
A count change is a separately reviewed higher-impact workflow. Cancelled registrations are read-only in this MVP;
submitted -> cancelled is terminal, with no reopening command. The added storage trigger also denies cancelled -> submitted.
Future allocation/payment exceptions and cancellation after financial eligibility require 8.4/Fasa 9 review.

Capacity Policy B remains locked: registration is not a reservation. No payment state, eligibility, reserved counter,
cattle/slot, volunteer, proof, receipt or Excel import is introduced. Capacity shown here is configuration/theory only.

## Permission matrix and masking

| Capability | Staff | Admin | Super admin |
| --- | --- | --- | --- |
| Campaign-scoped bounded list/detail | Yes | Yes | Foundation AAL2/live TOTP |
| Reference, applicant name, phone, participants/purpose | Yes | Yes | Yes |
| Attendance, same-cattle preference, status, time, safe context | Yes | Yes | Yes |
| Postal address/email | Omitted at DB projection | Yes | Yes |
| Consent summary/hash/internal reference | Omitted | Safe summary only | Safe summary only |
| Operational audit | Denied | Bounded paginated view | Foundation operational read |
| Contact/participant amendments | Denied | Yes | AAL2 + recent TOTP |
| Cancellation | Denied | Yes | AAL2 + recent TOTP |
| Full Excel snapshot/export | Denied | Yes | AAL2 + recent TOTP |
| Raw table CRUD / private helper EXECUTE | Denied | Denied | Denied |

Foundation active membership, Google identity/session, disabled/revoked checks, optional enrolled-admin MFA,
super-admin AAL2/live TOTP and recent-TOTP manage rules are reused through private.require_campaign_access.
The server also calls the existing adminContext/campaignManager. UI controls do not authorize requests.
Public/outsider receive no operational records. service_role receives no new runtime shortcut or grants.
Private schema exposure is unchanged. Staff does not receive hidden address/email/consent/audit/export JSON.

Admin management remains available independently of public flags/window/lifecycle: these gate public admission,
not legitimate protected review of already submitted records. Campaign must still be exact Qurban v1 with valid config.
Generic Campaign list/DTO/audit remain free of Qurban PII.

## Protected navigation and projections

From /admin -> Kempen -> /admin/campaigns/[id], a Qurban-only link opens
/admin/campaigns/[id]/qurban. Sections: Ringkasan; Pendaftaran / Peserta; Kapasiti / Lembu (8.4); Export; Aktiviti. Sukarelawan is implemented in the approved 8.5 checkpoint; Bayaran proof intake/downloads are implemented in the approved 9.0 checkpoint below. Verification/Resit remain deferred.

List default 20, maximum 50 registrations/page, page 1–10000; stable ID tiebreaker.
Sort: newest/oldest submission, reference, applicant. Status: all/submitted/cancelled.
Purpose filter includes registrations with the selected current purpose.
Search: exact case-normalized QBN reference, normalized applicant-name prefix or normalized phone-digit prefix.
There is no fuzzy matching, deduplication or identity linking. Staff may search the name/phone fields it is approved to read.
Browser search uses a bounded POST JSON read, keeping name/phone search out of browser address/history URLs.
Summary counts describe the whole campaign; filtered total describes the current list query.

List items contain only ID/reference, applicant/phone, participant/Qurban/Aqiqah counts, attendance/group request,
registration status, submitted time and version. No full hidden browser table/export preload.
Detail is separately fetched and campaign-scoped. It returns current participants with versions, immutable original quote,
accepted year/label and allowed purposes. Managers additionally receive address/email and a compact original consent
reference/hash/timestamp/count/current-difference summary. Full consent snapshots/text are not dumped to browsers.
Names and all user text use escaped React text/input values; no HTML renderer.

## Commands, locking and errors

Seven new authenticated public RPC wrappers, trusted migration owner, SECURITY DEFINER, fixed empty search_path:

| RPC | Purpose |
| --- | --- |
| admin_qurban_list(target_campaign, options) | Role-masked bounded list/summary |
| admin_qurban_detail(target_campaign, target_registration) | Role-masked detail |
| admin_qurban_amend(target_campaign, target_registration, payload) | Exact reviewed correction |
| admin_qurban_cancel(target_campaign, target_registration, expected_version, reason) | Terminal soft cancellation |
| admin_qurban_activity(target_campaign, page_number) | Managers' latest 50 events/page |
| admin_qurban_export_snapshot(target_campaign) | Protected consistent input + export ticket |
| admin_qurban_export_complete(target_campaign, export_reference, snapshot_fingerprint) | Audit successful generation |

Private implementations are invoker helpers with runtime EXECUTE revoked. Public wrappers grant EXECUTE only to
authenticated; no anon/PUBLIC/service_role/authenticator/scheduler/Auth-admin EXECUTE. No generic CRUD API.

HTTP boundary under /admin/api/campaigns/[id]/qurban:
GET/POST list, GET/POST registrations/[registration], POST .../cancel, GET activity, POST export.
Mutating/read-search POSTs require exact application/json, same origin, no query string and <=8192 streamed UTF-8 bytes.
Payload shape/type is exact; the DB independently validates mutation JSON <=4096 bytes and query <=1024 bytes.
No client-selected price/config/reference/actor/quote/consent. Errors use Foundation's small denied/invalid/conflict/unavailable
responses with no raw SQL or PII body logging. Every response is private, no-store; export adds nosniff/attachment headers.

Amendment body for contact:
{kind:"registration", expected_version, changes:{applicant_name,phone,address,email,attendance,same_cattle_preference}}.
All six current fields are supplied; email null removes it. Existing bounded/trimmed/control-safe domain constraints apply.
Participant body:
{kind:"participation", expected_version, participation_id, expected_participation_version,
 changes:{participant_name,purpose}}.
Purpose must occur in the Registration's **accepted** configuration, even if current campaign purposes later expand.
Identity/campaign/config/original quote/count/created time/consent fields cannot be supplied or changed.

Read projections hold a SHARE lock on the Foundation actor profile until the transaction finishes; role changes cannot
interleave with masking. Activity permission is checked under that lock. Manager mutations/export use the existing
Foundation actor FOR UPDATE authorization.
Lock order: Foundation actor/membership -> campaign SHARE -> Registration FOR UPDATE -> existing Participation FOR UPDATE.
Every child correction also advances aggregate Registration version. Concurrent contact/child/session edits therefore
cannot silently overwrite each other. Both registration and participant expected versions are checked.
No-op corrections return unchanged/version without new audit. Stale or cancelled mutation returns conflict with zero
partial writes/audit; UI asks to reload/review. Network ambiguity blocks editing until reload, not automatic mutation retries.

Cancellation body: {expected_version,reason}. The reason is mandatory and bounded **controlled vocabulary**:
applicant_request, duplicate_registration, entry_error, other_operational.
These reviewable reason choices deliberately avoid storing free-text names/telephone/address in audit.
The UI provides Malay labels and a terminal-history warning. Repeated cancellation safely conflicts; no restore/delete.
No private fixture purge is exposed through any application HTTP route.

## Dedicated operational audit and SQL inventory

private.qurban_operational_audit:
id, campaign_id, registration_id?, participation_id?, actor_id, action, occurred_at,
expected_version?, resulting_version?, changed_fields[], reason?, export_id?,
registration_count?, participation_count?.

Controlled actions: registration.amended; participation.amended; registration.cancelled; qurban.export.xlsx.
Changed fields contain only allowlisted field names. Participant events report the participant version transition;
the command also increments Registration's aggregate revision. Actor/time are server-derived.
Reasons are controlled codes, never free text. No names, phone, address, email, before/after values, raw JSON diffs,
IP, consent snapshot or payment data. Intermediate PII corrections cannot be reconstructed from this minimized audit;
the original acceptance and current state remain separate authoritative evidence.
Same-campaign Registration FK and participant ownership guard apply. Audit UPDATE/DELETE always denied.

private.qurban_export_requests:
id, campaign_id, actor_id, captured_at, expires_at, snapshot_hash,
registration_count, participation_count, completed_at?.
It stores only bounded structural metadata/hash, not workbook content or PII snapshots.
One permitted update marks completion; every other update and delete is denied.
15 minutes is a completion deadline, not an approved retention/deletion period.
Expired/incomplete ticket retention remains a reviewed future policy.

Functions: 17 total.
Private: qurban_operational_guard; qurban_terminal_guard; qurban_admin_campaign;
qurban_admin_list; qurban_admin_detail; qurban_admin_amend; qurban_admin_cancel;
qurban_admin_activity; qurban_admin_export_snapshot; qurban_admin_export_complete.
Public: the seven wrappers above. All have fixed empty search_path.

Triggers: qurban_operational_audit_guard; qurban_export_request_guard; qurban_terminal_guard.
The terminal guard is additive on Registration UPDATE; the original 8.1/8.2 guards are not replaced/weakened.
Indexes including constraints: qurban_export_requests_pkey; qurban_export_campaign;
qurban_operational_audit_pkey; qurban_operational_audit_export_id_key;
qurban_operational_audit_campaign; qurban_operational_audit_registration;
qurban_registration_status_page; qurban_participation_purpose.

Both new tables have RLS enabled, zero policies, and raw privileges revoked from PUBLIC, anon, authenticated,
service_role, supabase_auth_admin, authenticator and campaign_scheduler. Existing table/function ACL/RLS unchanged.
No production seed, flags, campaign, annual values, approved akad, participants or test accounts.

## Excel snapshot and completion semantics

New narrowly scoped production dependency: **ExcelJS 4.4.0**, exact package-lock.
It writes genuine Office Open XML .xlsx on the Node server, supports typed text/styles/panes/filters/print settings
and is excluded from browser bundles. [ExcelJS documentation](https://github.com/exceljs/exceljs)
and [Supabase function security](https://supabase.com/docs/guides/database/functions).

Snapshot RPC obtains manager authorization and campaign lock, then reads all sheet inputs/counts in **one SQL/MVCC
statement** with materialized registration/participant CTEs. Bound: 5000 registrations, 20000 participants, 16 MiB JSON.
Capacity/config is a reviewed current campaign context; original submission obligations are not repriced.
An immutable ticket binds actor/campaign/hash/counts. The app serializes and validates the real workbook first;
only then it completes the ticket and writes qurban.export.xlsx in one DB transaction.
Failed serialization/validation writes no completed event. Failed completion withholds the download.
Completion checks current membership/MFA, same actor/campaign, fingerprint and deadline; repeat completion within the deadline is idempotent.
Completed means workbook generated/authorized for release, not proof the browser saved or printed it.
No workbook is written to server disk, uploaded or cached in normal runtime. Test artifacts are intentionally local/ignored.

Sheets:

- **Ringkasan**: title/year/Hijri/currency/config price/cattle/share/theoretical capacity; total/submitted/cancelled registrations;
  all-record, active and cancelled participant counts, all-record/active Qurban/Aqiqah counts; generated time/actor/reference.
- **Pendaftaran**: Bil; No. Rujukan; Nama Pemohon; No. Telefon; Alamat; Email; Kehadiran; Permintaan Lembu Sama;
  Status; Bil. Peserta; Tarikh Daftar; Tarikh Kemaskini.
- **Peserta**: Bil; No. Rujukan; Nama Pemohon; Nama Peserta; Tujuan; Status Pendaftaran; Tarikh Daftar; No. Lembu; No. Bahagian. Keeps participant/registration-oriented ordering.
- **Sukarelawan** (8.5 owner-approved): Bil; No. Rujukan; Nama; No. Telefon; Email; Saiz Baju; Juga Peserta; Nama Peserta (Maklumat); Tugasan; Status; Tarikh Daftar; Tarikh Kemaskini. Manager-only full export, current data/labels, historical cancelled records retained.
- **Susunan Lembu**: print-friendly cattle blocks ascending; every configured Bahagian ascending. Columns: Bahagian; Nama Peserta; Tujuan; No. Rujukan (full); Nama Pemohon; No. Telefon. Empty slots explicitly show Kosong.
- **Format Audit - Legacy View**: Bil; No. Rujukan; Nama Peserta; Qurban/Aqiqah; No. Lembu; No. Bahagian;
  No. Telefon; Tarikh Bayaran; Catatan. Existing allocation coordinates only; unallocated cells and payment dates are true blanks. Catatan only Dibatalkan or blank. Allocated rows sort cattle then slot; unallocated rows follow in created_at/id order.

Owner explicitly requires Susunan Lembu for departmental operational printing. It uses the same protected materialized
snapshot, not a second DB read. Current allocation/current participant data only; no address/email/akad/payment extras.
Top note: “Susunan operasi allocation sahaja. Bukan bukti bayaran atau pengesahan pembayaran.”
Configured slots are displayed even before grid initialization, with an explicit uninitialized/configuration-only label;
no rows are inserted. A4 landscape, repeated identifying rows 1–3, wrapped names/references, bold cattle headings,
and page breaks before subsequent cattle groups keep ordinary groups together where practical. Oversized groups or
exceptionally long text may need native Excel print adjustment. All strings remain inert text, including formula-leading values.

Sukarelawan was omitted at the historical 8.3/8.4 checkpoints and is now present in the approved 8.5 checkpoint. At the 8.5 checkpoint Bayaran/Resit were deferred; the owner-approved 9.0 checkpoint below adds proof-intake Bayaran only. Verification/Resit remain deferred. Flattening is export-only, not the normalized DB model.
Filename: Qurban-MTU-YYYY-Export-YYYY-MM-DD-HHMMSS-UUID.xlsx; year comes from reviewed config, time from DB.
Date cells are numeric Excel dates displayed in MYT; phone/reference/names/email/address are explicit string cells
with text format @. Strings starting =,+,-,@,tab never become formula objects; no formula element is generated.
Invalid XML control characters are excluded. Counts/date/currency have typed numeric/date formats; money remains
integer minor units in the authoritative DB and converts only for display formatting.
Frozen bold headers, bounded column widths, filters, wrapped fitted rows, landscape wide sheets and repeated print headers.
The widest registration sheet may span two A4 landscape pages horizontally with identifying columns repeated.
Exceptionally multiline fields retain their full cell value; Excel's row-height limit may require manual print adjustment.
Downloaded edits never update DB; no workbook import/update endpoint exists.

## Final owner-approved presentation and summary semantics

DB status values remain **submitted / cancelled**. List, detail, filters, summary and Excel presentation use
**Dihantar / Dibatalkan**; activity already uses Malay action/reason labels. Legacy Catatan is Dibatalkan or blank.
Full QBN references remain in DB, detail, exact search, Excel and domain/audit references. Only the registration list
visually abbreviates them (prefix + ellipsis + seven suffix characters). Full text remains screen-reader accessible.
The keyboard-accessible Salin button copies only the full reference; no HTTP/DB mutation or reference query/URL.

Ringkasan uses the same authoritative export snapshot; no extra read/migration is required:
- Jumlah peserta — semua rekod: every current Participation, including retained cancelled registrations.
- Peserta pendaftaran aktif: current participants whose registration status is submitted.
- Peserta pendaftaran dibatalkan: current participants whose registration status is cancelled.
- Qurban — semua rekod / Aqiqah — semua rekod: current-purpose counts across both registration statuses.
- Qurban — aktif / Aqiqah — aktif: current-purpose counts only for submitted registrations.
- All participants = active + cancelled; all Qurban + all Aqiqah = all participants;
  active Qurban + active Aqiqah = active participants.
Here active means operationally submitted, never paid, eligible or reserved. Cancelled records are retained history;
neither these counts nor active registrations establish payment/capacity eligibility. Policy B is unchanged.
Original consent/quote snapshots remain immutable even when current purpose/name differs.
Production migration and all eight prior migrations are unchanged by this final polish.

## Local owner/AJK review workflow

Requires installed dependencies, Docker Desktop local Linux stack, and Microsoft Edge for the optional review launcher.
No normal production authentication is weakened to ease review.

If the local stack is already empty:

~~~powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/qurban-registration/review-fixture.mjs setup
node scripts/qurban-registration/serve.mjs
~~~

Open http://localhost:3082/kempen/local-qurban-review. Submit several dummy registrations through the real form.
The fixture is explicitly synthetic (2044/RM123.45/3 x 5/local-only akad), never annual defaults/seeds. Do not pay it.
In another terminal:

~~~powershell
node scripts/qurban-admin/review-browser.mjs admin
# Separate read-only review:
node scripts/qurban-admin/review-browser.mjs staff
~~~

The local CLI verifies configured loopback stack, local Docker endpoint, manifest/immutable session marker and DB
fingerprints before creating an ephemeral signed fixture session cookie. No token is printed, saved in source or URL.
Browser context is disposable, external navigation blocked, normal server/DB authorization still runs.
This is synthetic SQL identity/AMR evidence, **not genuine Google OAuth/MFA proof or a hosted login**.
Admin has the existing no-enrolled-TOTP local fixture policy. Optional owner mode uses clearly synthetic AAL2/TOTP
evidence; actual Foundation TOTP/session regressions remain separately tested. Close browser to end; relaunch after expiry.
Never use the launcher or fixture credentials with real/hosted accounts.

In the opened /admin: Kempen -> fixture campaign -> Buka pengurusan Qurban.
Review list; open a registration; edit contact; correct participant name/purpose; save; inspect Aktiviti;
cancel another registration with reason; Export -> Muat turun Excel (.xlsx); open the actual downloaded workbook.
Compare current data, cancelled row and summary; allocation/payment cells must be blank.
Staff browser must show no address/email/consent internals, mutation/cancel/export/activity controls.

Close all review browsers, stop serve.mjs with Ctrl+C, then one repeat-safe command:

~~~powershell
node scripts/qurban-registration/review-fixture.mjs cleanup
node scripts/qurban-registration/review-fixture.mjs inspect
~~~

Cleanup retains manifest/fingerprint proof and atomicity. New operational audit/export tickets for the exact marked
fixture campaign are deleted first, then prior submission evidence/consent/participation/registration/akad/campaign/flags
and exact fixture Auth/profile/bootstrap dependencies. Named delete guards are disabled/restored only within this
locked local owner transaction. No runtime grants/function bypass, broad TRUNCATE or CASCADE command.
Unrelated/changed/unprovable data aborts cleanup; legacy pre-manifest fixtures are still refused.
For owner-authorized disposal of the whole local stack only, the explicit fallback remains:
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed.
It is never an admin/public HTTP control or automatic selective-cleanup fallback.

inspect now also reports operational_audit/export_requests and immutable_consent_hash_valid.
The older consent_evidence_matches means current child values/revisions match the original snapshot; it may correctly
be false after a participant amendment. That does not invalidate the immutable accepted hash/original evidence.

## Verification and owner-review evidence

New offline suites: 83 cases; real 8.3 PostgreSQL/Auth/HTTP/browser/export suite: 18 cases, passing.
Prior offline Campaign/Foundation/Qurban/prototype/cleanup regression: 540 cases, passing.
Final real regression totals and checks are recorded below.

The real suite verifies two registrations/five participants, full versus masked detail, no raw-role shortcuts,
HTTP shape/body/origin constraints, four responsive widths, escaped text, concurrent browser conflict, actual UI correction,
terminal UI cancellation, two completed Excel generations, structural-only audit, a concurrent role-change lock probe
and repeat-safe selective cleanup to zero.
Consent JSON is compared byte-for-byte before/after participant changes; original 49,380-minor-unit quote remains unchanged.
Offline additionally covers all contact fields, both purpose directions, accepted-purpose restriction after config expansion,
rollback on audit failure, stale child/parent versions, immutable-key injection, no reacceptance, terminal storage guard,
cross-actor/expired export completion, export-after-serialization failure, OOXML formula-injection and phone preservation.

Actual DB-backed browser download: .cache/qurban-83/admin-live-export.xlsx.
Independent adversarial workbook: .cache/qurban-83/Qurban-MTU-2044-Export-2026-10-15-220000-33333333-3333-4333-8333-333333333333.xlsx.
Historical 8.3 validation: PK/Office Open XML package, four sheet names, row counts/relationships/statuses/summary, blank future cells,
inert string cells/no formula XML, phone plus/leading zero, print headers/panes/filters/formats and safe filename.
All four historical 8.3 sheets were imported/inspected/rendered with bundled spreadsheet tooling. The 8.4 checkpoint additionally verifies the fifth sheet, cattle/slot ordering, empty slots, print properties and same-snapshot coordinate agreement; see its verification evidence.
Its renderer normalizes numeric-looking text in previews (phone plus/zero); actual saved OOXML and ExcelJS round-trip
verify the source workbook retains the exact typed strings. Native Excel opening/printing remains part of owner manual review.

Screenshots: .cache/qurban-83/admin-list-{375,430,768,1440}.png; admin-detail-{375,430,768,1440}.png;
staff-375.png; cancelled-375.png; export-{375,1440}.png; activity-{375,1440}.png.
Workbook previews: .cache/qurban-83/render/*.png. All are ignored synthetic QA artifacts, not public assets.

Reproduce:
~~~powershell
node --import tsx --test scripts/qurban-admin/contract.test.ts scripts/qurban-admin/upgrade.test.mjs scripts/qurban-admin/database.test.mjs scripts/qurban-admin/workbook.test.ts
node --test scripts/qurban-admin/local.test.mjs
~~~
Local suite requires a clean disposable stack and production build from scripts/qurban-domain/build.mjs.
Never run shared-stack reset suites concurrently or from two checkouts.

## Remaining gates

This checkpoint is owner-approved. Native Excel opening/printing was not automated; the OOXML/round-trip validation
and local review workbook remain available for departmental print checks.
8.4 cattle/slots/allocation and Fasa 9 payment-qualified capacity admission; overflow/refund/waitlist and release rules.
8.5 separate volunteer registration/assignment. Fasa 9 private proof/payment verification/receipts/refunds.
Annual price/year/Hijri/approved akad launch values, exact retention/export-ticket retention and higher-impact requote rules.
No public PII lookup/recovery, real payment proof, payment verification, receipt, cattle/allocation, volunteer persistence,
production hard-delete, hosted mutation/deployment or old migration edit. **This was the historical 8.3 STOP boundary; current 8.4 is complete / owner-approved. 8.5 is now complete / owner-approved; Fasa 9 has not started.**

## Final regression/check evidence

**1,197 unique automated cases passed**, excluding reruns and the two reviewer-launcher smoke checks:

| Suite | Passed |
| --- | ---: |
| Approved prior offline DB/config/typed adapter/Campaign/Foundation/prototype gate/cleanup contracts | 540 |
| New 8.3 DB 52 + request/presentation 18 + upgrade 2 + workbook/pipeline 11 | 83 |
| Real 8.3 PostgreSQL/Auth/HTTP/browser/Excel | 18 |
| Real 8.1 Qurban foundation | 63 |
| Real 8.2 admission/idempotency | 36 |
| Real 8.2 production boundary | 3 |
| Real Campaign/Foundation database/flags/lifecycle/management/public/Auth/security | 429 |
| Public registration browser | 11 |
| Gated 8.0 prototype browser | 13 |
| Real isolated selective cleanup smoke | 1 |

Final-polish rerun: the 83-case offline and 18-case real suites pass, including Malay status mapping, all/active/cancelled
summary arithmetic (mixed/all-cancelled/empty), formula injection, full-reference keyboard copy with no network/DB mutation,
and list/detail responsiveness at 375/430/768/1440. The other unique case totals above retain the approved candidate evidence.
Admin and staff local reviewer --check both passed using the normal protected route.
TypeScript, zero-warning lint, final production Webpack, generated public RPC type parity,
269 production browser-chunk secret/PII/test-adapter/server-workbook scans, local documentation links and
tracked/untracked whitespace checks pass. Eight old migration native bytes match canonical checkout filters.
No pre-existing locked dependency version changed; only exact ExcelJS and its required dependency closure were added.

Fresh real local resets and selective cleanup were both exercised.
Final operational reset/inspection: production Qurban descriptor=1, application adapter=1;
campaigns=0; flags=0; Registration=0; Participation=0; AkadVersion=0; ConsentAcceptance=0;
submission audit=0; idempotency=0; operational audit=0; export tickets=0; Auth fixture users=0.
No synthetic annual values or PII fixtures remain in DB. Screenshots/workbooks remain only ignored local test artifacts.
All test/review servers were stopped. Owner testing starts with explicit setup/serve/reviewer commands above.

Public browser stale-context tests intentionally change the fixture campaign and use the explicit full test reset afterward;
ordinary admin edit/cancel/export demo cleanup is selective and was repeated safely.
If a reviewer clicks normal Sign out, the owned synthetic Auth graph can change and strict fingerprint cleanup may refuse.
Close the disposable review browser as instructed; inspect refusal rather than weakening the guard or adopting data.

Security-sensitive patch: .cache/qurban-83/security-sensitive.diff.
Complete tracked+untracked patch/stat: .cache/qurban-83/full-candidate.diff / full-diff-stat.txt.
Native git diff --stat and status: .cache/qurban-83/git-diff-stat.txt / git-status.txt.
These files are ignored review evidence, not staged checkpoint content.

## Exact checkpoint files

~~~text
README.md
docs/QURBAN-ADMIN-MANAGEMENT.md
docs/QURBAN-MVP-PLAN.md
docs/ROADMAP.md
package-lock.json
package.json
scripts/qurban-admin/contract.test.ts
scripts/qurban-admin/database.test.mjs
scripts/qurban-admin/local.test.mjs
scripts/qurban-admin/review-browser.mjs
scripts/qurban-admin/upgrade.test.mjs
scripts/qurban-admin/workbook.test.ts
scripts/qurban-domain/database.test.mjs
scripts/qurban-registration/fixture-session.mjs
scripts/qurban-registration/review-fixture.mjs
src/app/admin/(protected)/campaigns/[id]/qurban/page.tsx
src/app/admin/api/campaigns/[id]/qurban/activity/route.ts
src/app/admin/api/campaigns/[id]/qurban/export/route.ts
src/app/admin/api/campaigns/[id]/qurban/registrations/[registration]/cancel/route.ts
src/app/admin/api/campaigns/[id]/qurban/registrations/[registration]/route.ts
src/app/admin/api/campaigns/[id]/qurban/route.ts
src/components/admin/campaign-detail.tsx
src/components/admin/qurban-admin.css
src/components/admin/qurban-panel.tsx
src/lib/qurban/admin-contract.ts
src/lib/qurban/admin-http.ts
src/lib/qurban/admin-presentation.ts
src/lib/qurban/admin.ts
src/lib/qurban/export-workbook.ts
src/lib/qurban/export.ts
src/lib/supabase/database.types.ts
supabase/migrations/20261015140703_qurban_admin_management.sql
~~~

## Fasa 8.5 owner-approved integration

Protected Sukarelawan section has bounded list/search/filter, exact XS–5XL size counts, manager corrections, terminal cancellation, flexible campaign-scoped label management and one current assignment. Staff sees reference/name/phone/size/informational participant name/current label/status/time, with email omitted at DB/server projection; no edit/cancel/label mutation/assignment/audit/full-export capability. No matching or participant FK. Foundation live membership/MFA/recency remains mandatory.

Full workbook adds Sukarelawan and a separate Ringkasan volunteer section. Total includes retained cancelled records; active=submitted. Assigned/unassigned, also-participant and all nine shirt-size counts are active-only. Volunteer row order: active assigned grouped by label, logical size, name/reference; active unassigned with logical size/name/reference; cancelled last. No coupling with Qurban participant/capacity/payment counters. At the approved 8.5 checkpoint all six sheets used one materialized protected snapshot, including current assignment label text; completed export audit adds safe volunteer_count only after successful serialization. Existing =,+,-,@,tab/control formula-injection defenses, +/leading-zero phone text and private export authorization remain.

[Volunteer contract, RPCs, local review/cleanup and verification](QURBAN-VOLUNTEERS.md). 8.5 and Fasa 8 Qurban MVP Foundation are complete / owner-approved. Fasa 9 is next / not started. Stop after the owner-authorized 8.5 checkpoint.


## Fasa 9.0 complete / owner-approved — private payment-proof intake

[Payment-proof contract](QURBAN-PAYMENT-PROOF.md) records owner approval of the narrow pre-issued Storage-only JWT (no service_role/runtime signing key) and post-window intake for existing submitted registrations while flags ON/campaign not archived. Private participant/admin-assisted proof intake, minimal staff status, manager-only individual/segmented ZIP downloads and seven-sheet Excel are complete / owner-approved on 17 October 2026 (+08:00). Bayaran contains declared evidence only; Legacy Tarikh Bayaran remains blank. Cancellation with submitted proof fails closed. No verification/rejection, allocation admission, receipt/refund/waitlist/gateway; 9.1 not started. All Fasa 8 decisions and historical checkpoints remain intact.
