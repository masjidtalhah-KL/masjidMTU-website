# Fasa 9.1 — Payment Verification + Atomic Capacity Admission + Receipt

**Fasa 9.1 complete / owner-approved, including final receipt visual. Fasa 8 COMPLETE / owner-approved. Fasa 9 — Payment & Receipt COMPLETE / owner-approved. Fasa 10 next / not started.**

Owner reviewed and approved the implementation and receipt visual with no further changes on 17 October 2026 (+08:00). Checkpoint: `phase-9.1-qurban-payment-verification` (resolve tag for commit), representing Fasa 9 completion. No redundant aggregate tag.
Canonical baseline: `fb223abbf69480229a3f9c1a235fe7b11670dad7`, tag `phase-9.0-qurban-payment-proof`.
Additive migration: [20261016235348_qurban_payment_verification.sql](../supabase/migrations/20261016235348_qurban_payment_verification.sql).
All twelve previous migrations are preserved; thirteen total migrations. Owner authorises one checkpoint commit and canonical main/tag push without force after final verification. Local implementation/testing only; no hosted mutation/deployment or Fasa 10 work.

## Owner rules

Bank Islam transfer only: 1227 0010 0045 60, MASJID TALHAH BIN UBAIDILLAH.
Proof submission is evidence intake, not verification/reservation. Only an authorised admin/super_admin may review; Foundation identity, active membership, AAL and recent TOTP rules remain authoritative.
Verification requires an existing submitted proof, eligible submitted registration, no verified payment, exact integer declared amount equal to the immutable original quote, unchanged expected proof/registration versions and full capacity for every participation. A one-minor-unit difference is denied. No force override, tolerance, partial payment/allocation, instalment or overpayment workflow.

## Private model / constraints

- `qurban_payments`: UUID; same-campaign Registration/proof FKs; one payment per registration/proof; original quote, exactly equal verified amount, payment date, server verified timestamp, Foundation actor and immutable receipt identity.
- `qurban_receipts`: UUID; same-campaign Registration/payment FKs; campaign-scoped number/serial, accepted campaign year, campaign title at verification, QBN, applicant name at verification, currency/amount and accepted integer price_per_share_minor, bank_transfer method, payment date, issuance timestamp and bounded exact participant snapshot. No address/email/phone/proof file/access token.
- `qurban_receipt_counters`: one campaign-owned counter; controlled +1 transitions only, maximum 999999. No seeded counter/annual values.
- Receipt participants are a strictly validated JSON array of 1–100 exact objects: participation_id, participant_name, purpose, cattle_number, slot_number. Unknown keys, duplicate identities/coordinates, oversized/malformed data fail. Content hash covers the participant evidence. Full row and snapshot are immutable.
- Deferred composite FKs bind payment ↔ receipt; deferred integrity triggers require verified proof, exact amount, complete allocation/count and matching financial/receipt identity at commit. The private deferred integrity reader is SECURITY DEFINER because PostgreSQL fires it after the public wrapper's security context ends. Fixed empty search_path, trusted migration owner, no runtime/PUBLIC EXECUTE; it is not a mutation API.
- RLS enabled, zero permissive policies; raw CRUD revoked from PUBLIC, anon, authenticated, service_role, supabase_auth_admin, authenticator, campaign_scheduler and qurban_proof_storage_worker. No private schema exposure or service-role runtime.
- Existing Storage policies/role/credentials and the initial allocator body/ACL are unchanged.

## Review commands / locking

`admin_qurban_payment_verify(campaign, proof, expected_proof_version, expected_registration_version)`
`admin_qurban_payment_reject(campaign, proof, expected_proof_version, expected_registration_version, reason)`

Authenticated wrappers only; private implementations enforce Foundation authorisation. No caller-supplied amount, price, receipt number, allocation coordinates or force field. Server HTTP uses a strict bounded JSON discriminator contract, current Foundation checks and same-origin checks. Direct RPC remains independently protected.

Lock order: Foundation actor profile → global/module advisory shared locks and flag rows in key order → exclusive campaign row → Registration → proof → participation rows in created/id order → existing allocator under that same campaign lock → campaign receipt counter. Existing amendment/cancellation, grid initialization and reassignment use compatible campaign-before-registration ordering. Same-campaign admissions serialize to avoid overbooking/deadlocks; no skip-locked partial groups.

Verify rechecks eligibility and exact quote/count, invokes the unchanged private 8.4 allocator for the entire participant set, advances counter, inserts payment/receipt, terminally updates proof and writes structural audit in one DB transaction. Allocator/receipt/audit/constraint failure rolls back all effects. Capacity shortage leaves proof submitted, no payment, no receipt, no partial allocations. UI: “Kapasiti tidak mencukupi — pembayaran belum dapat disahkan.” No waitlist/refund fallback.

Same-cattle is best effort exactly as 8.4: lowest suitable cattle if the full set fits, otherwise earliest cattle/slot split, never reshuffling other allocations. No generic initial-allocation button/RPC or runtime EXECUTE appears.

## Proof lifecycle / rejection

Only `submitted → rejected` or `submitted → verified`, version 1 → 2. Server reviewer/time are recorded. Amount/date/source/hash/object identity/submission time never change. Terminal states cannot reopen/transition. New evidence after rejection uses a new intent/key/object; old evidence is retained and private. A same-key replay returns the existing attempt's current terminal result, never reopens it. Fresh submissions are denied once payment is verified; one open submitted proof remains enforced.

Controlled reasons only:
| Code | Malay |
| --- | --- |
| jumlah_tidak_tepat | Jumlah bayaran tidak tepat |
| bukti_tidak_jelas | Bukti bayaran tidak jelas |
| bukti_tidak_sah | Bukti bayaran tidak sah |
| bayaran_tidak_ditemui | Bayaran tidak dapat dikenal pasti |
| lain_lain_operasi | Lain-lain sebab operasi |

Participant sees the reason and “Hantar bukti baharu”; no public historical proof download. Admin history is separately bounded/paginated (50 per page), retains original evidence/downloads and review provenance. The pending-intent limit excludes already committed attempts.

## Receipt number / immutability

`QUR-<campaign_year>-000001`, campaign-scoped. Year comes from the Registration's immutable accepted annual configuration; no hardcoded future year. Counter increment is transactional under the exclusive campaign lock. An aborted transaction publishes no receipt/number and rolls back its unused increment; committed receipt numbers never duplicate/reuse and no runtime reset/delete exists. This is not a promise of accounting gaplessness or a PostgreSQL nextval sequence. A separate campaign may have its own same-year sequence; identity/authorisation is always campaign/Registration scoped.

Receipt snapshot is captured from current participants/allocations at successful verification. Later authorised name/purpose/contact correction or allocation reassignment does not edit it. Current grid, admin/participant “Susunan semasa”, Peserta/Susunan Lembu/Legacy export show current data. Original receipt/PDF retain historical issuance data. No automatic reissue/correction.

Exact receipt note:
> Maklumat lembu/bahagian adalah susunan pada waktu resit dikeluarkan dan tertakluk kepada perubahan

## PDF / scoped access

Server-only pdf-lib 1.17.1 + @pdf-lib/fontkit 1.1.1 generate A4 PDFs on demand from the immutable DB snapshot. Noto Sans is embedded locally with its SIL OFL license; no external fetch, HTML engine, proof embedding or arbitrary resource path. Long names wrap, identifying/table headers repeat and pages have numbers. Characters outside this font's coverage are represented explicitly as Unicode code-point escapes rather than silently dropped/replaced. Malay/Latin text and 100 long-name participant pagination are tested.

PDF visual/print polish uses the unchanged approved project logo `public/brand/logo-masjid.png`, local Noto Sans Regular/Bold, white A4 paper, mosque blue, native separator rules/geometric decoration and a dynamically bordered participant table. No Canva/JPG full-page background. All content remains searchable text (the logo alone is an image); this does not claim full PDF/UA tagging. Long names wrap; continuation pages repeat compact identity and table headings, with page numbering. No fixed blank participant rows.

Malay organisational header: RESIT PEMBAYARAN; MASJID TALHAH BIN UBAIDILLAH, TAMAN ALAM SUTERA, 57000 BUKIT JALIL, WILAYAH PERSEKUTUAN KUALA LUMPUR, 03-8074 7414, masjidtalhahubaidillah@gmail.com. Dates distinguish Tarikh Bayaran (approved declared date) and Tarikh Disahkan (issuance timestamp in MYT). DITERIMA DARIPADA shows only the immutable applicant name. Kempen uses the immutable receipt title/year.

Table: Nama Peserta, Tujuan, No. Lembu, Bahagian, Jumlah (RM). Each one-share row uses `price_per_share_minor`, newly snapshotted from the immutable Registration accepted quote at issuance in the still-uncommitted 9.1 migration. DB guard requires exact quote equality; a check requires price × snapshot participant count = immutable verified amount. No live campaign-price read or blind division. Formatting uses integer arithmetic with two decimal places and thousands separators. Total follows the final row. Kaedah Pembayaran: Pindahan Bank — Bank Islam.

Closing: “Terima kasih atas penyertaan anda.”, the exact owner allocation note above, and “Resit ini dijana secara digital dan tidak memerlukan tandatangan.” The redesign preserves all verification, allocation, numbering, immutable evidence, authorisation, Storage/audit/cancellation and Excel boundaries.

PDF includes mosque/title, receipt/date/QBN/applicant, Pindahan Bank, approved amount/payment date, participant purposes and issuance cattle/share coordinates. It excludes proof filename/path, tokens, internal actor/audit IDs and uploaded slip. Filename is actual `QUR-YYYY-NNNNNN.pdf`.

Participant POST `/kempen/[slug]/bayaran/resit`: existing scoped HttpOnly Secure SameSite session, exact ≤256-byte JSON expected_reference, same-origin/no-query. Server compares the frozen reference to the session context before the receipt RPC; reference is a stale-tab check, never authorisation. No QBN-only retrieval. Existing flags/not-archived/session eligibility is preserved.
Admin GET `/admin/api/campaigns/[id]/qurban/payments/[registration]/receipt`: current Foundation manager/MFA checks every request; staff denied, no permanent URL. Both are attachment/application/pdf/nosniff/private/no-store/no-referrer/noindex. No proof Storage credential is needed to generate PDF.

## Admin / participant projections

| Capability | Participant | Staff | Admin | Super admin |
| --- | --- | --- | --- | --- |
| Context | Own valid capability | Minimal four-key status | Full operational | Foundation checks |
| Proof bytes/history | Denied | Denied | Protected | MFA/recency |
| Reject / verify | Denied | Denied | Controlled transaction | AAL2/recent TOTP |
| Receipt | Own scoped receipt | Denied | Protected download | MFA/recency |
| Full Excel | Denied | Denied | Protected | Foundation checks |

Public context adds controlled rejection reason, minimal verified receipt/amount/date summary and only the own current participant allocations when verified. No address/email/phone/storage path/admin internals.
Staff list remains reference/registration ID/registration status/proof status only, enforced by DB projection.
Admin list stays bounded; selected detail/history uses a separate protected read. Explicit review checkbox is UI safety only. No signature/akad change.
Verified Registration cancellation is denied with “Bayaran telah disahkan. Gunakan proses kewangan yang berasingan.” No financial cancellation/refund workflow exists.

## Audit / export

Minimized immutable domain events: payment.proof.rejected, payment.verified, receipt.issued, receipt.downloaded plus all 9.0 intake/download events. Only IDs, actor, controlled reason, versions, time/count/source; no names/phone/email/raw JSON/receipt snapshot/Storage path/token. Receipt download audit means authorised access, not proof a remote user finished saving bytes. Generic Campaign audit is unchanged.

Workbook remains seven sheets: Ringkasan, Pendaftaran, Peserta, Sukarelawan, Susunan Lembu, Bayaran, Format Audit - Legacy View.
One protected materialized MVCC snapshot supplies every sheet. Bayaran shows one deterministic latest proof per Registration; DB/detail retain full history. Added Tarikh Disahkan and No. Resit; Malay status none/submitted/rejected/verified. No file/path/token/receipt binary.
Ringkasan separates active registrations with no evidence, pending proof, rejected/needs-new-proof and verified payment. Rejected evidence is not labelled accounting “unpaid”.
Legacy Tarikh Bayaran is populated only from a verified payment's declared/approved payment date. Pending/rejected remains blank; current allocation sorting unchanged. Existing text-cell formula-injection controls remain.

## Local owner review / cleanup

Run from repository root, synthetic data only:
```powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/qurban-registration/review-fixture.mjs setup
node scripts/qurban-payment/review-fixture.mjs files
node scripts/qurban-registration/serve.mjs
```
Open http://localhost:3082/kempen/local-qurban-review, fill dummy registrations and keep each private secure link. In a second terminal:
```powershell
node scripts/qurban-admin/review-browser.mjs admin
```
Open Bayaran, initialize grid via Kapasiti / Lembu, inspect exact/mismatched evidence, reject with controlled reason, resubmit through saved participant link or protected assistance, confirm verification and download receipt/Excel. Reassign an occupied slot and compare current arrangement with unchanged receipt.
Optional repeatable prefilled A/B/C proof scenarios (before any registrations):
```powershell
node scripts/qurban-verification/review-fixture.mjs seed
```
A: 3 exact shares. B: 1 share +1 minor unit (reject, submit new exact evidence). C: 12 shares, insufficient after A+B verify in 15-slot fixture. No real transfer or production seed. Prefilled secret capabilities are kept only in command memory, never printed/persisted; use admin-assisted corrected upload for prefilled B or manually create a browser registration to retain its secure link.

Stop app/reviewer before cleanup:
```powershell
node scripts/qurban-registration/review-fixture.mjs inspect
node scripts/qurban-registration/review-fixture.mjs cleanup
```
Manifest/parent fingerprint ownership and child same-campaign FKs are mandatory. Adds receipt/payment/counter/review/audit dependencies before old proof/allocation/Registration graph. Deferred circular FK checks flush before immutable guards are restored. Unknown cross-campaign actor dependencies/Storage objects remain refused, repeat-safe, no public/admin hard-delete endpoint. Storage verified-owned exact bytes cleanup and atomic DB cleanup remain separate services; no cross-service atomicity is claimed. Unknown 9.0 eight synthetic orphan backing files remain untouched/unadopted. Legacy/no-manifest fallback remains explicit disposable local reset, never automatic over owner data.

## Verification / remaining gates

The historical pre-approval evidence below covers predecessor contracts and the reviewed 9.1 candidate; the final owner-approved checkpoint evidence follows it.
No refund, waitlist, overpayment handling, partial payment/instalment, gateway, financial cancellation, receipt correction/reissue or production deployment. Retention, production credential provisioning/rotation, malware scanning and edge hardening remain separately reviewed gates. These future enhancements do not block the owner-approved Fasa 9 MVP closeout.

Primary implementation references: [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html), [pdf-lib](https://pdf-lib.js.org/), [Noto fonts / SIL OFL](https://github.com/googlefonts/noto-fonts). Runtime never fetches these references.


## Exact HTTP / DTO contracts

Manager POST `/admin/api/campaigns/[id]/qurban/payments/review`:
```json
{"action":"verify","proof_id":"<uuid>","expected_proof_version":1,"expected_registration_version":1}
```
Rejection has the same fields with action=reject and one additional `reason` from the five controlled codes. Extra force/amount/actor/receipt/reference/identity fields fail. Success is `{"status":"verified","receipt_number":"QUR-YYYY-NNNNNN"}` or `{"status":"rejected"}`. Capacity/amount conflicts are safe 409 codes; stale state asks to refresh.

Public context has exactly nine keys: reference, participant_count, currency, price_per_share_minor, total_minor, proof_status, rejection_reason, payment, current_allocation. Before verification payment=null and current_allocation=[]; rejected reason is controlled, otherwise null. Verified payment contains only receipt_number/amount_minor/verified_at. Own current allocation entries contain participant_name/purpose/cattle_number/slot_number.
Manager detail POST `.../payments/[registration]/detail` accepts only `{"page":1}`, 50 historical attempts/page. Staff cannot call this full projection.
Participant receipt POST accepts only `{"expected_reference":"QBN-..."}`; session is HttpOnly and never supplied by client JavaScript. Admin receipt GET is campaign/Registration scoped with no query fields. Both return actual PDF attachment, not a stored URL.

## Additive SQL surface

New tables: private.qurban_payments, private.qurban_receipts, private.qurban_receipt_counters.
Proof adds reviewed_by/reviewed_at/rejection_reason and controlled terminal version/lifecycle constraints. Audit adds payment_id/receipt_id/rejection_reason/expected_version/resulting_version and reviewed action/FK constraints.

New functions:

- `private.qurban_receipt_participants_valid`
- `private.qurban_financial_guard`
- `private.qurban_financial_commit_guard`
- `private.qurban_proof_review_guard`
- `private.qurban_payment_review`
- `public.admin_qurban_payment_verify`
- `public.admin_qurban_payment_reject`
- `private.qurban_verified_cancellation_guard`
- `private.qurban_receipt_data`
- `private.qurban_receipt_download`
- `public.public_qurban_receipt_download`
- `public.admin_qurban_receipt_download`
- `private.qurban_payment_detail`
- `public.admin_qurban_payment_detail`

Reviewed replacements in this additive migration (old files untouched):

- `private.qurban_proof_prepare`
- `private.qurban_proof_commit`
- `private.qurban_payment_context`
- `private.qurban_payment_list`
- `private.qurban_payment_activity`
- `private.qurban_admin_export_snapshot`

Seven new triggers plus the replaced proof evidence guard:

- `qurban_payment_proofs.qurban_payment_proofs_guard` (replacement)
- `qurban_payment_proofs.qurban_proof_commit_guard`
- `qurban_payments.qurban_payment_commit_guard`
- `qurban_payments.qurban_payments_guard`
- `qurban_receipt_counters.qurban_receipt_counters_guard`
- `qurban_receipts.qurban_receipt_commit_guard`
- `qurban_receipts.qurban_receipts_guard`
- `qurban_registrations.qurban_00_verified_cancellation_guard`

Three explicit indexes: qurban_payments_campaign, qurban_receipts_campaign, qurban_payment_review_audit. Twelve additional new indexes back primary/unique keys on the three new tables (15 total). Composite same-campaign FKs and deferred payment/receipt integrity constraints are described above. Authenticated receives EXECUTE only on the four new admin wrappers; anon/authenticated receive the own-capability receipt wrapper. All new private helpers revoke PUBLIC/runtime EXECUTE. No allocator grant, Storage policy/grant change, permissive raw-table policy or schema exposure.

## Historical initial candidate verification — 17 October 2026 (+08:00)

**1,642 unique automated cases passed; reruns excluded.**

| Counted group | Passed |
| --- | ---: |
| Offline contracts, SQL, upgrades, config/adapter, workbook/PDF and guards | 924 |
| Real 9.1 PostgreSQL/Auth/PostgREST/Storage/HTTP/browser/concurrency | 36 |
| Real 9.0 private Storage/intake/idempotency/cleanup regression | 62 |
| Prior real volunteer/allocation/admin/domain/registration/production gates | 166 |
| Real Campaign Engine / Admin Foundation | 429 |
| Isolated real cleanup | 1 |
| Public participant browser / local prototype browser | 24 |
| **Total** | **1,642** |

Actual PostgreSQL proved exact amount ±1 minor unit and larger mismatch denial, all five rejection reasons and later resubmission, admin-assisted evidence requiring a separate review, Foundation RBAC/MFA, full rollback on allocator/receipt/audit failure, concurrent same-proof verification, competing final shares, verify/reject/cancel/grid/reassign races and unique monotonically increasing receipt numbers. No partial capacity admission or false financial/audit outcome.

Participant and admin submitted/rejected/verified states were checked at 375/430/768/1440, including verification confirmation, resubmission, receipt download, no horizontal overflow and empty localStorage/sessionStorage/IndexedDB. Current coordinates changed after reassignment while immutable receipt row and regenerated PDF remained byte-identical. The actual receipt has the exact owner note; an additional 100-participant long-name PDF rendered across 11 pages with identifying headers.

Final TypeScript, zero-warning lint, production Webpack build, generated public-type parity, 291 production browser-chunk secret/PII/fixture/server-library scans and documentation/local-link checks passed. All twelve prior migration native SHA-256 values and canonical Git content remain unchanged. git diff --check passed. Reviewer Auth identities are synthetic local evidence; no genuine hosted OAuth/MFA onboarding is claimed.

Artifacts (ignored local review evidence): .cache/qurban-91/receipt-real.pdf, receipt-browser.pdf, receipt-long.pdf, receipt-real.png, verification-real.xlsx, verification-workbook.xlsx, reassignment-evidence.json, concurrency.json, sql-objects.json and test-counts.json. Responsive screenshots: participant/admin-{submitted,rejected,verified}-{375,430,768,1440}.png.

Owner seed command itself was exercised: 3 registrations / 16 requested participations / 3 proofs / 15 empty grid slots / zero verified payments or receipts. Selective cleanup was then exercised twice and returned all fixture/Auth/business/Storage metadata rows to zero. Descriptor=1, production adapter=1, private bucket=1; payments/receipts/counters=0. Current-parent manifest/fingerprint checks remain strict; the browser stale-context test restores only its exact known revision perturbation rather than adopting a new fingerprint or resetting unrelated data.

Fresh local no-seed resets for the real regression suites applied the complete 13-migration chain. Final cleanup uses the ownership-proven selective path, not another redundant broad reset. The eight previously documented unmanifested synthetic backing files remain separately present, all known synthetic hashes and runtime-denied, never adopted/deleted. No claim of cross-service atomic file erasure or physical-volume reset.

**At that initial pre-approval checkpoint, 9.1 remained a candidate awaiting owner review; no commit/tag/push or hosted mutation/deployment had occurred. Owner approval and final checkpoint are recorded below.**

## Owner-approved receipt visual polish evidence (pre-checkpoint verification)

Owner requested presentation/print changes only. The sole receipt schema enhancement is immutable `price_per_share_minor`, copied from accepted Registration quote, validated against it at insert and against total/count. Existing twelve migrations, allocator, receipt numbering, payment/admission authorisation, Storage, audit vocabulary, cancellation and Excel are unchanged.

Local synthetic artifacts (ignored `.cache/qurban-91/visual/`): `receipt-normal.pdf` / `.png` (3 participants), `receipt-7-participants.pdf`, `receipt-long-multipage.pdf` (100 long-name participants, 15 pages). One-participant output is also checked. No fixed blank rows, cropped text, applicant phone/address/email or full-page background. Native vectors, real searchable text and embedded official logo/fonts are inspected by rendering the first, continuation and final pages.

Run from repository root:
```powershell
node --import tsx --test scripts/qurban-verification/receipt.test.ts
# Python with the PDF review dependencies pypdf and pdfplumber:
python scripts/qurban-verification/receipt-inspection.py
node --import tsx --test scripts/qurban-verification/database.test.mjs scripts/qurban-verification/upgrade.test.mjs
```
The PDF inspection verifies Malay organisational/receipt labels, exact immutable values/dates/MYT/amounts, exact dynamic table row count and cells, note/footer, repeated A4 headers/page numbers, searchable text, cell/page bounds and no external/script actions. Financial tests also change later campaign price and prove the original receipt price remains unchanged.

Focused rerun: 932 unique offline cases plus 8 PDF inspection cases = 940, all passed. Combined candidate evidence is now 1,658 unique cases, excluding reruns; the 718 prior real/full-stack/browser cases remain recorded separately rather than claimed as a new full reset run. TypeScript, lint, production Webpack, actual local generated-type parity, all three production bundle scans, documentation links and diff checks pass. All 13 migrations additionally apply to an isolated real PostgreSQL test database, removed afterwards without touching the active owner demo database.

The active local owner fixture was preserved: no reset/cleanup. Its existing receipt received only the new immutable accepted-price field; all previous receipt column values and business row counts were checked unchanged. A protected local admin PDF download succeeds, anonymous download denies, and a real reassignment in a rollback-only transaction leaves the historical receipt/PDF unchanged. The local server was restarted after the production build. No normal runtime immutable guard was weakened, and no hosted resource, commit, tag or push was performed.

## Final owner-approved Fasa 9 checkpoint

Fasa 9.0 and 9.1 complete the approved Payment & Receipt MVP. The owner-approved receipt design is retained unchanged, including immutable accepted `price_per_share_minor`, official logo, Malay labels, full QBN wrapping, MYT confirmation time, exact per-share/verified amount, issuance cattle/share snapshot, Pindahan Bank — Bank Islam, exact allocation note, digital/no-signature footer and repeated multi-page headers. It contains no applicant phone/address/email, proof/slip or full-page raster background and never reads current mutable campaign price.

Future enhancements (outside completed MVP): refund, waitlist, partial payment, instalment, overpayment handling, financial cancellation, receipt correction/reissue, gateway/card/FPX and multiple payments per Registration. They do not block Fasa 9 closure. Fasa 10 next / not started.

Final checkpoint verification rerun: **1,658 unique automated cases passed; zero failed, zero skipped; reruns excluded.** All listed suites were rerun for this owner-approved checkpoint, superseding the retained-integration-evidence limitation of the historical visual-polish run above.

| Verification group | Unique cases |
| --- | ---: |
| Offline Qurban/Campaign/Foundation contracts, DB/upgrade, adapter, workbook, PDF and gates | 932 |
| Real payment verification / races / rollback / receipt access | 36 |
| Real private proof Storage / intake / replay / download / ZIP | 62 |
| Real prior Qurban foundation, registration, admin, allocation, volunteer and production gates | 166 |
| Real Campaign Engine / Admin Foundation | 429 |
| Isolated selective cleanup | 1 |
| Public registration / prototype browser QA | 24 |
| Native PDF extracted-text, table, bounds and visual-contract inspection | 8 |
| **Total** | **1,658** |

Production Webpack, TypeScript, lint, actual local generated-type parity, browser/secret/PII scans (291 production chunks), documentation links and git diff --check pass. Responsive checks cover 375/430/768/1440. Receipt checks retain 1/3/7 participant A4 outputs, mixed purposes, long-name 100-participant continuation, exact MYR, full QBN wrapping and final total/footer. Real receipt regeneration after reassignment is byte-identical. No fixed blank rows, applicant contact PII, embedded slip or full-page raster background.

Thirteen migrations apply locally, including this single additive 9.1 migration; all twelve earlier migration files retain their byte hashes. Owner explicitly approved selective cleanup of the active local demo before full regression. Fresh local resets plus ownership-proven repeat-safe test cleanup leave: descriptor=1, production adapter=1, campaigns/flags/registrations/participations/akad/consent/submission audit/volunteers/labels/allocation grid/allocations/payment access/sessions/proof intents/proofs/payments/receipts/counters/payment audit/download grants/Storage metadata/Auth fixture users=0. No invented annual business values survive. All review/test servers are stopped.

The eight unmanifested synthetic local backing files retain their exact path/content hashes, known synthetic content and denied runtime access. They remain untouched/unadopted; selective cleanup has no broad bypass. Private proof Storage and the no-service-role runtime boundary are unchanged. No historical migration changes, hosted mutation/deployment or Fasa 10 implementation.

Owner authorises one final checkpoint commit, annotated tag `phase-9.1-qurban-payment-verification` and canonical main/tag push without force, followed by remote/ref equality and clean tree/index verification. This tag represents Fasa 9 COMPLETE / owner-approved; no redundant aggregate completion tag.
