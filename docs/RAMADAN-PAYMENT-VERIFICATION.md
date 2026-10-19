# Fasa 10.2b — Ramadan Payment Verification, Atomic Slot Assignment & Receipt

## Fasa 10.3 — COMPLETE / owner-approved

Owner approved the dashboard, three independently reviewed five-sheet workbooks and the three-page A4 operating schedule. Checkpoint: `phase-10.3-ramadan-reporting-excel`. Fasa 10.0/10.1/10.2a/10.2b/10.2c/10.3 are COMPLETE / owner-approved. Fasa 11 — Security Hardening NEXT (not implemented); Fasa 12 — Production Launch Preparation NOT STARTED. MVP completion does not claim production readiness. Open follow-ups: Foundation mobile Menu accessibility; explicit manual calendar/financial-exception resolution and sponsor notification; low-priority repeated Masjid header on every printed schedule page. None is implemented or suppressed by this checkpoint.


[Ramadan dashboard, reporting and protected Excel](RAMADAN-REPORTING-EXCEL.md) reads authoritative verified payments, items, assignments and approved current calendar dates. It adds bounded role-masked reports, a consistent five-sheet XLSX and a safe print schedule. No financial/receipt/slot mutation or new source of financial truth. Fasa 10.0–10.2c remain COMPLETE / owner-approved; Fasa 10 — Ramadan Sponsorship MVP COMPLETE / owner-approved. Fasa 11 — Security Hardening NEXT; Fasa 12 — Production Launch Preparation NOT STARTED. Owner authorized the final checkpoint commit/tag/push only; no hosted service mutation/deployment.


## Fasa 10.2c — COMPLETE / owner-approved

[Official Ramadan calendar and safe schedule amendments](RAMADAN-CALENDAR-AMENDMENTS.md) adds typed private proposals/revisions, bounded impact preview, super-admin AAL2/recent-TOTP publication, current versus accepted dates and day-30 operational exceptions. Original quote/payment/slot/receipt history remains unchanged. Fasa 10.0/10.1/10.2a/10.2b remain COMPLETE / owner-approved; 10.3 COMPLETE / owner-approved. Fasa 10 — Ramadan Sponsorship MVP COMPLETE / owner-approved. Checkpoint: `phase-10.2c-ramadan-calendar-amendments` (resolve tag for commit). No hosted deployment, automatic date feed, refund, receipt reissue or automatic notifications.

**Fasa 10.2b COMPLETE / OWNER-APPROVED.** Owner approval: 19 October 2026 (+08:00), including payment verification, atomic assignments, receipt and final public-schedule/download UX. Checkpoint: `phase-10.2b-ramadan-payment-verification` (resolve tag for commit). Baseline: `860b6314007d5def323063f5d6feb42ff5ac6717` / `phase-10.2a-ramadan-payment-proof`. Fasa 10.0, 10.1 and 10.2a remain complete / owner-approved. Fasa 10 — Ramadan Sponsorship MVP COMPLETE / owner-approved. 10.2c official Ramadan calendar change management is COMPLETE / owner-approved; 10.3 COMPLETE / owner-approved. No hosted mutation/deployment.

## Financial decision and scope

Only an active Foundation admin or super_admin may review a submitted proof. Super_admin writes retain AAL2 and recent TOTP. The manager must independently check actual bank evidence and explicitly confirm the exact payment; an uploaded image and a checkbox alone are not evidence that the bank received funds. Website method remains Pindahan Bank — Bank Islam from the existing trusted server source.

Claimed amount must equal the Sponsorship's immutable quoted_total_minor exactly. Even one minor unit above or below fails. There is no replacement amount, tolerance, force flag, instalment, partial payment or splitting. All arithmetic is integer minor units, including FIXED_SLOT quantity × accepted price and OPEN_AMOUNT contribution.

## Additive database inventory

Migration: `20261018145036_ramadan_payment_verification.sql`, the seventeenth migration. All sixteen approved historical files retain their original bytes. No Qurban business table or helper is reused.

| New private table | Exact main fields and constraints |
| --- | --- |
| ramadan_payments | id, campaign_id, sponsorship_id UNIQUE, verified_proof_id UNIQUE, quoted_total_minor, verified_amount_minor (equal), payment_date, verified_at, verified_by, receipt_id UNIQUE; composite same-owner proof/sponsor/receipt FKs |
| ramadan_slot_assignments | id, campaign_id, sponsorship_id, item_id, schedule_entry_id, slot_id UNIQUE, payment_id, assigned_at/by; exact item/sponsor/campaign and slot/schedule/campaign FKs; deferred same-owner verified payment FK |
| ramadan_receipt_counters | campaign_id PK, last_serial 1..999999; only a +1 advance is allowed |
| ramadan_receipts | id, campaign_id, sponsorship_id UNIQUE, payment_id UNIQUE, serial, receipt_number, campaign_year/title, hijri_display_label, public_reference, payer_name, currency MYR, verified_amount_minor, payment_method bank_transfer, payment_date, issued_at/by, items, content_hash; unique campaign+serial and campaign+receipt number; deferred payment FK |
| ramadan_capacity_exceptions | id, campaign_id, sponsorship_id, proof_id UNIQUE, fixed reason capacity_insufficient, occurred_at, actor_id; same-owner proof FK; immutable non-financial record |

Proof attempts add reviewed_at, reviewed_by and controlled rejection_reason. States: submitted/v1 → rejected/v2 or verified/v2. Rejected and verified are terminal; old evidence identity, amount, date, source, hash and file remain immutable. A new rejected-proof replacement is a different attempt/object/idempotency key. The original one-submitted-proof unique index remains.

New indexes: ramadan_assignments_sponsorship, ramadan_assignments_schedule, ramadan_capacity_exception_campaign, ramadan_review_audit_once (one rejected/shortage/verified/issued event per proof/action). Composite identity UNIQUE constraints are added to existing items and slots.

Each new table has a named _guard trigger calling ramadan_financial_guard. Four deferred _integrity constraint triggers on payments, receipts, assignments and proofs enforce complete verified payment/receipt/assignment/audit integrity at COMMIT. Ordinary update/delete of financial evidence is denied. The original cancellation guard additionally denies verified financial cancellation without releasing any slot, proof or receipt.

## Authorization and RPCs

| Role | Review status | Proof/history and financial details | Reject/verify | Receipt PDF |
| --- | --- | --- | --- | --- |
| Public without scoped capability | No private access | No | No | No |
| Scoped participant session | Own state, controlled rejection reason, exception and issued receipt/slots | Own bounded quote only; no proof download | No | Own only |
| Staff | Minimal proof_status only | No financial metadata, proof bytes or receipt snapshot | No | No |
| Admin | Full authorized operational detail | Yes, protected download | Yes | Yes |
| Super_admin | Same, Foundation rules preserved | Yes | AAL2 + recent TOTP | Current Foundation manager/MFA checks |

All new private tables have RLS enabled, zero policies and zero raw CRUD for PUBLIC, anon, authenticated, service_role, supabase_auth_admin, authenticator, campaign_scheduler and both proof workers. Private helper EXECUTE is revoked. The existing narrow ramadan_storage_authorized grant is preserved unchanged; no runtime service_role, signing key or new Storage scope is added.

New authenticated wrappers, fixed empty search_path and SECURITY DEFINER: admin_ramadan_payment_verify, admin_ramadan_payment_reject, admin_ramadan_payment_review, admin_ramadan_receipt. New anon/authenticated safe wrappers: public_ramadan_receipt (requires scoped session) and public_ramadan_confirmed_sponsors (public safe names only). No initial allocation command is granted to runtime roles.

New private functions: ramadan_receipt_items, ramadan_financial_guard, ramadan_financial_integrity, ramadan_review_lock, ramadan_assign_verified_set, ramadan_payment_verify, ramadan_payment_reject, ramadan_receipt_payload, ramadan_payment_review, ramadan_receipt_access, ramadan_confirmed_sponsors and ramadan_initial_sponsor_pages. Nine existing Ramadan functions are additively replaced: payment_guard, proof_prepare, proof_commit, proof_cancellation_guard, payment_context, proof_detail, public_context, admin_workspace, admin_slots. Foundation/Campaign/Qurban functions and Storage authorization are unchanged.

## Authoritative verification and locking

Command parameters: campaign, proof, expected proof version, expected Sponsorship version and bank_payment_confirmed=true. No amount, slot number, receipt number or override can be supplied. Authorization and exact shape are enforced independently of browser controls.

Order: Foundation actor/session locks → shared global/module flag advisory locks and flag rows → campaign-scoped ramadan advisory lock → campaign row → Sponsorship → proof/intent → items → schedules in UUID order → earliest free slots → campaign receipt counter. Admin offering/schedule and evidence operations use the same campaign serialization boundary. Separate campaigns remain independently operable.

The transaction checks supported valid campaign, effective flags, non-archived campaign, submitted Sponsorship, exact version/proof ownership and submitted state, stored private object metadata/hash, immutable quote sum and accepted item requirements. It does not reapply public intake window/visibility or current offering/schedule active flags to accepted historical commitments. Closing/renaming an offering cannot invalidate the accepted quote/label.

Requirements are SUM(quantity) per schedule, including repeated references in a trusted existing aggregate. All required schedules are locked and checked before any assignment. Within each item/schedule, earliest free slot_number wins. Unique slot identity and deferred aggregate checks prevent duplicate or partial occupancy. OPEN_AMOUNT consumes no slots; an all-open aggregate may verify with zero assignments.

Successful verification commits all assignments, exactly one payment, one numbered immutable receipt, proof transition and required payment.verified + receipt.issued audits together. Injected allocation/receipt/audit failure rolls everything back. Same verified proof/version replay returns the same receipt, without duplicate audit or business rows. Stale/conflicting terminal transitions fail safely.

## Insufficient capacity is not proof rejection

A shortage returns status capacity_insufficient and commits only one immutable exception and minimized payment.capacity_insufficient audit. Proof remains submitted; payment, assignments, receipt and receipt counter do not advance. It intentionally returns a structured outcome instead of raising an exception that would roll back the administrative marker.

UI: **Memerlukan Tindakan Admin — Slot Tidak Mencukupi**. Bayaran belum dapat disahkan kerana slot yang dipohon tidak lagi mencukupi. Sila hubungi penaja untuk tindakan lanjut.

This marker does not certify bank receipt, amount, occupancy or final payment. Original quote, evidence and item history remain intact. Retrying rechecks all financial/security/capacity conditions atomically; repeated shortage does not duplicate the marker. Active exception presentation is derived from a still-submitted proof with no payment. Later rejection or successful verification retains the old exception history. There is no release, refund, waitlist, date substitution, requote, amendment or capacity bypass workflow. Manual resolution requires future owner-reviewed rules.

## Rejection and resubmission

Controlled codes: jumlah_tidak_tepat, bukti_tidak_jelas, bukti_tidak_sah, bayaran_tidak_ditemui, lain_lain_operasi. Natural Malay labels are rendered from the shared strict contract; no free text. Rejection records actor/server time/version and one audit. Same-reason terminal replay is safe; different terminal decisions conflict. Rejected evidence/file is retained. Existing scoped capability or authorized admin assistance can submit a fresh attempt. Rejected-proof download is manager-only, with bounded history pagination (20 per page) and current authorization on every request.

## Receipt and PDF

RAM-<accepted campaign_year>-000001 is campaign scoped, DB generated, separate from Qurban. A row counter is locked transactionally and advances once per committed receipt; failed transactions do not consume an issued serial. No issued identity is reused or caller-selected; no generic reset/reissue operation exists. This is not a claim that every future accounting workflow will remain gapless.

Immutable receipt captures campaign title at issuance, accepted year/Hijri, RSP, private payer name, amount/date/method/time and each accepted item: item/schedule identity, accepted offering label, explicit program date/day, mode, quantity, accepted unit price or open contribution, exact line total and final slot numbers. Maximum 100 items/1 MiB. Snapshot is guarded against current-row reconstruction or editing; hash covers exact item evidence. Mutable future offering names cannot change historical receipt meaning. No Ramadan reassignment is authorized in this phase.

Native pdf-lib A4 blue/white template uses existing public/brand/logo-masjid.png and src/assets/receipt/NotoSans-Regular.ttf / NotoSans-Bold.ttf. Searchable Malay text, full RSP wrapping, dynamic FIXED_SLOT/OPEN_AMOUNT table, slot detail, total, compact continuation header and page numbers are supported. OPEN_AMOUNT has no fake quantity/unit price/date. No payer phone/email/address, proof image, Storage path, access secret, Qurban cattle note, tax claim or external asset fetch is added. Footer: Resit ini dijana secara digital dan tidak memerlukan tandatangan.

Protected routes:

- GET /admin/api/campaigns/[id]/ramadan/payments/[sponsorship]?page=1 — role-masked review/history/capacity.
- POST same route — exact verify/reject DTO, same-origin and bounded 1 KiB JSON.
- GET .../payments/[sponsorship]/receipt — current Foundation manager/MFA, private attachment.
- POST /kempen/[slug]/tajaan/bayaran/resit — scoped short-lived HttpOnly session, same-origin, exact bounded expected_reference JSON; RSP alone authorizes nothing.
- GET /kempen/[slug]/tajaan/penaja — eligible campaign, bounded offering/schedule/page, safe confirmed names only.

PDF is generated on demand from snapshot, application/pdf attachment, nosniff, private/no-store/no-referrer. No public PDF bucket/URL. Receipt access writes structural receipt.downloaded without copying document contents; it records authorized access, not a claim that the client saved every byte.

## Public verified projection

Occupancy is derived only from assignments joined to verified payments. Pending/rejected/exception cases count zero and reveal no public identity. Public safe name pages contain only slot_number and display_name, 20 per page; OPEN_AMOUNT lists names without fabricated coordinates. Named uses the immutable stored payer-derived display name; anonymous uses exactly Hamba Allah. No contact, RSP, private Sponsorship UUID, proof, bank reference, receipt or capability is included.

Deactivated offerings/schedules with verified history remain readable with accepting_new=false. Public intake never reopens as a side effect. Original campaign lifecycle/DB-time window/visibility/flag gates remain. Public context tokens include actual occupancy, so an outdated form may need reload/review. Admin schedule counts/grid read the same verified domain; slot grid is bounded to its configured 1..N entries and contains no payer PII.

## Audit

Existing intake and protected proof-download actions remain. Added actions: payment.proof.rejected, payment.capacity_insufficient, payment.verified, receipt.issued, receipt.downloaded. Exact shape constrains campaign/Sponsorship/proof/payment/receipt IDs, Foundation actor where applicable, controlled reason, version transition and server time. No raw request, names, contact, amount copies, receipt snapshot, object path/URL, file bytes or token is logged. Generic Campaign audit remains unchanged.

## Local review, preservation and cleanup

Run from repository root. Existing owned review fixture is preserved; do not run setup over existing data or reset the stack.

~~~powershell
node scripts/ramadan-management/review-fixture.mjs inspect
node scripts/ramadan-management/serve.mjs
# In another terminal: normal Foundation-authenticated synthetic reviewer
node scripts/ramadan-management/review-browser.mjs admin
# Optional staff/owner role review: replace admin with staff/owner.
~~~

Open http://localhost:3082/kempen/local-ramadan-review/tajaan. Use synthetic payer data only, select varied fixed dates plus an open contribution, retain secure link and upload a synthetic file. In admin Pendaftaran Tajaan, search the full RSP, open Butiran tajaan, check the actual synthetic quote/proof, select the bank review confirmation and Sahkan Bayaran. Review automatic slots, own participant status, confirmed public names and Muat Turun Resit. Test wrong amount by rejecting with a controlled reason, then submit a new attempt. Do not transfer real money.

Repeatable non-destructive evidence (requires existing manifest-owned fixture and running review server):

~~~powershell
node --import tsx --test scripts/ramadan-verification/local.test.mjs
$env:RAMADAN_REVIEW_RECOVERY='1'
node --import tsx --test scripts/ramadan-payment/upload-recovery-local.test.mjs
~~~

These append synthetic records under the proven local session and verify all preceding sponsorship fingerprints; they never setup/reset/cleanup. Separate scripts demonstrate exact/mismatched payments, last-slot races, multi-item shortage and scoped injected rollback. Review artifacts are ignored under .cache/ramadan-102b. Never publish secure-link/token files.

Selective cleanup is an explicitly authorized operator action only; no cleanup was invoked for this candidate. The existing local-only manifest/fingerprint cleanup graph now includes capacity exceptions, assignments, receipts, payments, counters and expanded audits before proof/access/parents. All named immutable guards are restored symmetrically before a successful cleanup commit; an isolated committed guard-cycle test and a rollback dependency-order test verify this without invoking live cleanup. Same-campaign/root/actor ownership must be proved, and a transaction revalidates every graph fingerprint; unrelated records or unknown objects are never adopted. Storage deletion remains separate from the revalidated DB transaction, with failure refusing DB cleanup; there is no cross-service atomicity claim or public/admin HTTP hard-delete. Eight known unrelated Qurban orphan backing files remain untouched. Approved prior reset/cleanup evidence is separate from the active retained review data.

Only after explicit owner authorization and verified ownership, the existing command is:

~~~powershell
node scripts/ramadan-management/review-fixture.mjs cleanup
~~~

The local runner's 45-minute renewal/one-hour scoped token lifetime remains unchanged. Production receives externally issued Storage credentials; no application signing key or HTTP renewal endpoint. Expired credentials fail closed. Malware scanning, retention, production edge hardening and future manual financial resolution remain separate gates.

## Verification evidence

Evidence and exact fresh/retained counts are recorded in the final candidate report. Isolated full-chain upgrade tests prove empty business/Auth/Storage rows without resetting the active local stack. Historical byte hashes, original owner-row fingerprints and all eight Qurban orphan backing-file hashes are checked separately. Native PDF artifacts: receipt-normal.pdf, receipt-multi-item.pdf and receipt-long-multipage.pdf plus rendered PNGs under .cache/ramadan-102b/visual. Real issued receipt: .cache/ramadan-102b/artifacts/receipt-real.pdf. Production build, generated public type parity, secret/PII/bundle scans and docs links are required before owner review.

10.3 reporting/Excel has not started. No refund, waitlist, partial payment, gateway, financial correction/reissue or capacity-substitution feature is implemented.

## Pre-polish candidate verification evidence — retained

**Earlier checkpoint evidence: 1,380 unique passing cases.** Breakdown: 1,326 isolated domain/contract/upgrade/Campaign/Foundation/Qurban regressions, 23 real PostgreSQL/Auth/PostgREST/Storage verification and responsive cases, two native public→admin→receipt browser workflows, eight real private-Storage expiry/recovery/intake cases, thirteen original prototype browser cases, four production-mode authorization/PDF/public-privacy cases and four native PDF extraction/layout inspections. Responsive cases cover 375/430/768/1440. Earlier approved real Qurban/Campaign/Foundation/full-reset and destructive cleanup evidence is retained separately and is not added to this fresh count. No reset or active fixture cleanup was run.

Real verification proves exact mixed/open-only acceptance, ±1 and larger amount denials, retained rejection/resubmission, admin assistance, Foundation staff/MFA boundaries, same-proof replay, concurrent final-slot contention, verify/reject races, unique receipt serials and scoped injected assignment/receipt/audit failure rollback. Shortage commits only the non-financial marker/audit, with zero payment/receipt/partial assignment. Native browser tests exercise real form submission, file upload, review checkbox, controlled rejection, corrected proof, verification, receipt download and staff masking. A discovered same-tab capability-link change is re-exchanged through the unchanged secure session boundary; it never relies on RSP or retains the secret in browser storage.

Production Webpack build passed. TypeScript, repository lint (ignored .cache evidence excluded), generated public type parity, 305 browser JavaScript/map chunk secret/PII/private-helper/PDF-library/embedded privileged-JWT scans, documentation links and full tracked+untracked diff checks passed. All sixteen historical migration raw hashes match preflight; all Qurban/Campaign/Foundation/Storage definitions and privileges are preserved by upgrade tests. Fresh isolated chain has seventeen migrations and zero business/flag/Auth/Storage-object rows. Real local stack was upgraded without reset; its original eleven business-table fingerprint sets remain present unchanged. All live Ramadan guards are enabled and scoped fault-injection helpers are removed. Final inspection detected six inherited disabled intake guards from earlier local cleanup; exactly those guards were re-enabled without touching business rows. Migration 17 also restores these known guards on upgrade, and a new isolated upgrade test starts with all six disabled and proves restoration. The fixed local cleanup builder restores every named guard before commit. Financial/browser/Storage tests were rerun with every guard active.

Eight known unmanifested Qurban backing files retain their exact hashes. No adoption/deletion, broad cleanup bypass or hosted mutation occurred. Existing owner records plus synthetic test additions are retained under the proven review session, separate from fresh-empty-chain evidence. Pre-polish retained local totals: 186 Sponsorships, 183 proof attempts, 82 verified payments/receipts, 48 fixed-slot assignments and 12 capacity exceptions. Exact counts are captured in the ignored preservation evidence. OPEN_AMOUNT-only verified aggregates correctly create no slots. These are synthetic local evidence, not production seed or real banking records. Later authorized downloads may add structural access audits.

At the pre-polish snapshot, the official review runner was restored at http://localhost:3082/kempen/local-ramadan-review/tajaan with the unchanged 45-minute/one-hour scoped Storage-token renewal model. Docker was resumed after the interrupted session without resetting its existing volumes. No owner/demo business data was cleaned. No commit, push or tag; HEAD/main/origin/main/live remote main and the dereferenced approved 10.2a tag remain at the baseline commit. The actual staging index remains clean; this is a dirty uncommitted candidate awaiting owner review, not a completed 10.2b checkpoint.

Security-sensitive changes are confined to five new private immutable/deny-first tables, six narrow public-schema wrappers, controlled proof terminal transitions, bounded audit shapes, protected server receipt generation, verified-only safe name/occupancy projection and ownership-verified local cleanup graph/guard restoration. There is no direct allocator entry point, raw private CRUD, Storage worker scope expansion or service-role runtime client. There is no amount override, partial verified payment, partial fixed assignment, receipt before verification, automatic capacity bypass/refund/date substitution, anonymous payer/contact disclosure, pending public sponsor identity, Qurban business-table reuse, receipt correction/reissue, refund, waitlist, gateway, Ramadan Excel/reporting or 10.3 implementation.

Ignored review evidence: .cache/ramadan-102b/full-diff.patch, full-diff-stat.txt, git-status.txt, changed-files.txt, offline.log, local.log, browser.log, storage-recovery.log, prototype-browser.log, production.log, bundle-scan.json, docs-links.json and preservation snapshots. Synthetic normal/multi-item/multipage PDFs and rendered PNGs are under visual/; the real synthetic browser/production-issued PDFs are under artifacts/. No generated proof, secret, token, PDF or review-cache file is included in Git.

## Final owner UX polish — owner-approved

The public schedule now renders confirmed names and every small schedule's materialized slot coordinates immediately from the server response. There is no initial reveal button or per-card HTTP fetch. Named uses only the immutable approved payer-derived public display snapshot; anonymous displays exactly **Hamba Allah**. Empty materialized slots display **Belum ditaja**. Pending/rejected/exception cases do not occupy a slot or disclose a name. OPEN_AMOUNT verified donors have a separate section and null slot coordinates.

A single set-based private ramadan_initial_sponsor_pages(jsonb) read constructs the initial pages alongside the base counts in the same SQL statement/snapshot. It has fixed empty search_path and no runtime EXECUTE. Existing context limits remain 100 offerings, 500 schedules and 256 KiB base JSON; each initial list contains at most 20 entries, with an additional 12 MiB hard ceiling on the bounded initial-page payload. At most 10,000 slot rows and 2,000 open-donor rows can be initially serialized under those catalog limits. Later pages use the same authorized public verified-only projection and replace the previous 20-row window, rather than accumulating unbounded names in the browser. Small schedules have no pagination controls; large schedules use **Papar Lagi** and, after the first page, **Sebelumnya**. No business/payment/allocation command changed for this presentation work.

Download investigation: the old protected HTTP response already returned 200, correct MIME, Content-Disposition filename and nonempty valid bytes. A baseline native Edge test preserved RAM-2051-000085.pdf and the old proof filename; the reported UUID-only filename was not reproducible in standalone Edge. The admin UI nevertheless converted every attachment into an unnamed blob URL and depended on a detached anchor's download attribute, discarding the original HTTP attachment metadata at that browser hand-off. The precise embedded-browser failure cannot be asserted from the Edge reproduction. The fix removes that fragile hand-off: native protected attachment links preserve server filenames end-to-end. Receipt remains RAM-year-serial.pdf; proof is **Bukti-Bayaran-RPF-opaque-reference.jpg/png/pdf**, with the validated extension. No payer or Storage identity appears in filenames. Participant receipt handling is unchanged.

The existing proof download route additionally accepts an exact bounded GET query (proof_id, history_page) for native navigation. It repeats Foundation role/MFA, campaign/sponsorship/history ownership and private Storage checks for every request, just as the retained POST route. Rejected attempts remain accessible to authorized managers. Staff/unauthorized errors return private sanitized JSON with no attachment header, so an error is not saved as a misleading PDF/image. No proof URL points to Storage, and no worker/capability scope was expanded.

The affected schedule page also has an explicit main landmark; the existing axe suite initially caught its absence. The tooling files and scan assertions were not changed.

New repeatable tests: scripts/ramadan-verification/ux-local.test.mjs. Evidence is kept under ignored .cache/ramadan-102b/ux, including public-slots-375/430/768/1440.png, actual protected proof downloads, filename/MIME/hash reports and receipt-admin.pdf. Synthetic additions belong to the existing proven local review session; no reset or cleanup is performed. All prior rows and the eight unrelated Qurban orphan file hashes are compared before/after. The five concurrent tooling files are fingerprinted and excluded from candidate staging/report indexes.

Documentation lookup: Context7's indexed Next.js releases stop before installed 16.3.6, so the bundled 16.3.6 route-handler documentation governs this change. Supabase connected function-security documentation and the repository's fixed-path/grant conventions were consulted. Browser evidence uses the repository's real Edge Playwright tests; no security check is disabled.

## Prior final-polish verification results — retained

**1,386 freshly rerun unique passing cases**: 1,330 isolated domain/contract/upgrade/Campaign/Foundation/Qurban cases; 23 real PostgreSQL/Auth/PostgREST financial/concurrency/rollback/responsive cases; two native end-to-end public/admin/receipt workflows; eight private-Storage token-expiry/recovery/upload cases; four production authorization/privacy/PDF cases; four native PDF extraction/layout cases; thirteen new automatic-schedule/download/Edge-PDF UX cases; and two unchanged axe desktop/mobile scans. The thirteen original prototype browser cases retain their earlier passing evidence and were not rerun on the active owner server: **1,399 distinct cases including retained prototype evidence**, not 1,399 fresh reruns. Destructive predecessor reset/cleanup suites were not invoked. Existing isolated fresh seventeen-migration/no-business-data and cleanup-rollback tests remain passing.

An initial parallel browser run correctly hit stale form protection while the other suite changed the same campaign's schedule context. Both native workflows passed sequentially; stale checks were not bypassed. Test selectors were updated from button to link for native admin downloads. Incorrect test fixture property/column names were corrected. Preliminary failures are retained in ignored logs and are not represented as passing runs.

TypeScript, lint, final production Webpack build, generated public type parity, 305-chunk bundle/privileged-token/PII/private-helper scans, 73-document/461-link scan and full candidate whitespace checks pass. The main landmark discovered by the first accessibility scan is fixed only on the affected public page. The five independently edited tooling files retain exact pre-polish hashes and are excluded from the temporary candidate-only report index; the real staging index remains empty.

Preservation: 2,598 pre-existing rows across the original eighteen Ramadan tables retain exact fingerprints, excluding the one intentionally advancing receipt counter. That same campaign counter advanced monotonically from 85 to 109 for additional owned synthetic test receipts; no old receipt was rewritten. All sixteen historical migration byte hashes and the eight unrelated Qurban orphan file hashes are unchanged. No reset, cleanup, ownership adoption, hosted mutation or deployment occurred. Final retained synthetic totals: 242 sponsorships, 236 proof attempts, 109 verified payments/receipts, 73 assignments and fourteen capacity exceptions. These are local-only test additions, not production seeds or real banking evidence.

Native Windows Edge visually renders the downloaded receipt; evidence: .cache/ramadan-102b/ux/edge-pdf-headed.png. PNG/JPEG decode in Edge, original proof bytes match stored SHA-256, and PDF proof/receipt files have correct MIME and extensions. The actual receipt tested is RAM-2051-000105.pdf; later test receipts are independent synthetic records. Staff downloads remain 404 with sanitized JSON and no attachment header. PDF visual/content authority and all financial commands remain unchanged.

## Owner retest: local reviewer download root cause

The earlier standalone tests did not reproduce the actual local reviewer naming behavior. The owner uses the Edge window launched by scripts/ramadan-management/review-browser.mjs because local auth.external.google.enabled is intentionally false. Ordinary Google login therefore returns Unsupported provider: provider is not enabled. Do not enable OAuth or add a runtime login bypass for this review; use the existing synthetic reviewer command, with fresh local fixture session and unchanged Foundation authorization. Rerun it when that one-hour synthetic session expires.

The exact owner receipt RAM-2051-000084 reproduced the filename failure on the existing localhost:3082 app: Playwright 1.63.0 configures Chromium Browser.setDownloadBehavior with allowAndName, which names the actual downloaded artifact by GUID without its extension. Edge Downloads displayed that GUID. The server's suggested filename and PDF bytes were already correct. Earlier tests used download.saveAs and therefore concealed the filename the owner saw. This was a local review runner failure, not payment/receipt corruption, stale server output or disabled Google causing a bad file response.

The local-only review-downloads.mjs helper now sets behavior allow for exactly the isolated synthetic review browser context. It keeps the controlling CDP session alive until that context closes, preserving the server's native Content-Disposition name. Files are retained under ignored .cache/ramadan-review-downloads; no owner profile settings, global browser behavior, hosted auth, application RBAC or Storage authorization change. Only relaunching the reviewer applies this change to a new review window; the already-open old reviewer remains unchanged. Existing GUID download-history entries are not renamed or deleted.

Run from the repository root, while the existing local app stays running:

~~~powershell
node scripts/ramadan-management/review-browser.mjs admin
~~~

Close the old review window manually, open the new one with the command, and download again. Use Ctrl+J to inspect the NEW Downloads entries. Three fresh actions on receipt 84 passed: current PNG, receipt PDF and its history-row PNG. Each returned HTTP 200 with zero redirects, correct MIME/attachment/private-no-store/nosniff headers, real native filenames and valid file bytes, with no saveAs or manual renaming. Current/history PNG SHA-256 equals the stored original. For this particular sponsorship, the history row is the same retained attempt as the current proof; both UI actions were tested separately. Files remain readable after the review browser closes. Staff requests remain 404 JSON with no attachment header.

Fresh regression: three reviewer-download cases pass, including the failing default GUID reproduction and native Edge Downloads/file-open evidence. Artifacts: .cache/ramadan-102b/owner-downloads/before-edge-downloads.png, after-edge-downloads.png, opened-current-proof.png, opened-receipt.png, opened-history-proof.png, three-actions.json and tests.log. Prior 10.2b application/financial/build evidence is retained separately; this correction changes only local reviewer tooling/tests/docs. Owner subsequently confirmed that the new download names/extensions and file opening work; the final UX is approved. The following checkpoint evidence supersedes the earlier pending-review status.

## History-file opening and owner confirmation

A further owner retest reported **fail tidak dijumpai** when opening the saved history PNG. The proof remained present, its 453,195 bytes matched its stored SHA-256, and current/history buttons referenced the same retained attempt. The review runner's HTTP-only network filter intercepted and aborted file:// requests from Edge Downloads. The earlier file-open test had omitted that exact filter. A controlled old-filter/no-filter reproduction isolated this local runner issue; the subsequent live tests use the same request predicate as the real reviewer.

The local-only predicate permits existing, non-redirected regular PNG/JPEG/PDF proof/receipt files directly inside .cache/ramadan-review-downloads with the exact normalized filenames. Unrelated files, nested paths, remote shares, HTML/SVG and external HTTP remain denied. Production routes, Foundation authorization, Storage access and evidence bytes are unchanged. The owner confirmed successful downloads/opening after relaunching the reviewer. Current and history actions may legitimately download the same retained proof attempt. Files are saved in the ignored review-download directory, not the personal Windows Downloads folder.

Owner also approved automatic verified sponsor display, **Hamba Allah**, **Belum ditaja**, bounded pagination, exact payment verification, complete slot assignment and immutable receipt. At that historical 10.2b checkpoint, 10.2c and 10.3 remained unimplemented; 10.2c is now COMPLETE / owner-approved and 10.3 COMPLETE / owner-approved. No reset, cleanup or adoption/deletion of the eight unrelated Qurban orphan files is authorized for this checkpoint.

## Owner-approved final checkpoint verification — 19 October 2026

**1,402 distinct passing automated cases: 1,389 freshly rerun and 13 retained prototype-browser cases.** Fresh breakdown: 1,330 isolated Ramadan/Qurban/Campaign/Foundation domain/contract/upgrade cases; 23 real PostgreSQL/Auth/PostgREST/Storage verification, concurrency, rollback and responsive cases; eight private-Storage expiry/recovery/intake cases; two public-to-admin-to-receipt native workflows; thirteen automatic sponsor/download/responsive UX cases; four production authorization/privacy/PDF cases; three exact review-runner native download/file-opening cases; four PDF text/layout inspections; and two unchanged independent-tooling axe desktop/mobile scans. The unchanged thirteen prototype UI cases retain their prior passing evidence; they are not counted as fresh. Older destructive predecessor/reset/cleanup evidence is retained separately and is not added to this count.

TypeScript, source/script lint, production Webpack, real local generated-public-type parity, 305-chunk browser secret/privileged-JWT/PII/private-helper/server-library scan, documentation links and tracked/untracked candidate whitespace checks pass. The Windows Python alias was unavailable; the four PDF inspections passed using the bundled Python runtime. No application behavior changed during this owner-approved closeout.

All sixteen historical migration raw hashes match preflight; the additive migration brings the total to seventeen. All 3,628 pre-existing business rows across eighteen tables retain exact fingerprints, excluding the one campaign receipt counter, which advanced monotonically from 110 to 127 only for newly created synthetic test receipts. Existing submissions, proofs, payments, receipts, assignments and exceptions remain retained. No local reset or cleanup occurred. All eight unrelated Qurban orphan backing-file hashes are unchanged, with no adoption/deletion. Every live Ramadan guard is enabled and scoped failure-injection helpers are absent; verified aggregate/receipt/assignment integrity has zero broken rows.

Owner confirmed usable admin proof/receipt filenames, file opening and automatic verified public names. Pending/rejected/exception identity is never public; anonymous is **Hamba Allah**, empty slot is **Belum ditaja**. Exact amount, complete atomic capacity admission, immutable receipt and Foundation/Storage boundaries remain unchanged. No runtime service_role, Qurban business-table reuse, refund, capacity bypass/date substitution or hosted mutation/deployment. Fasa 10.2b is complete / owner-approved; 10.2c official Ramadan calendar change management is COMPLETE / owner-approved and 10.3 COMPLETE / owner-approved.

Exactly forty-four candidate files are authorized for this checkpoint. The five independent tooling files below remain byte-identical to the closeout preflight, unstaged and excluded from the commit. Consequently the final working tree is intentionally dirty only for those five files; a clean staging index is required. Ignored proof/PDF/token/cache artifacts remain excluded. Detailed fresh logs, counts, preservation and Git evidence are under .cache/ramadan-102b/checkpoint.

## Exact candidate file inventory

Runbook paths below are repository relative. The full diff/stat and actual Git status are captured separately in ignored review evidence; the real index is not staged by the reporting-index operation.

~~~text
README.md
docs/RAMADAN-PAYMENT-PROOF.md
docs/RAMADAN-PAYMENT-VERIFICATION.md
docs/RAMADAN-SPONSORSHIP-ARCHITECTURE.md
docs/RAMADAN-SPONSORSHIP-MANAGEMENT.md
docs/ROADMAP.md
scripts/ramadan-domain/database.test.mjs
scripts/ramadan-management/database.test.mjs
scripts/ramadan-management/review-fixture.mjs
scripts/ramadan-management/review-browser.mjs
scripts/ramadan-management/review-downloads.mjs
scripts/ramadan-payment/contracts.test.ts
scripts/ramadan-payment/database.test.mjs
scripts/ramadan-payment/upload-recovery-local.test.mjs
scripts/ramadan-verification/browser-local.test.mjs
scripts/ramadan-verification/database.test.mjs
scripts/ramadan-verification/local.test.mjs
scripts/ramadan-verification/production-local.test.mjs
scripts/ramadan-verification/receipt-inspection.py
scripts/ramadan-verification/receipt.test.ts
scripts/ramadan-verification/reviewer-downloads-local.test.mjs
scripts/ramadan-verification/upgrade.test.mjs
scripts/ramadan-verification/ux-local.test.mjs
src/app/admin/api/campaigns/[id]/ramadan/payments/[sponsorship]/receipt/route.ts
src/app/admin/api/campaigns/[id]/ramadan/payments/[sponsorship]/route.ts
src/app/admin/api/campaigns/[id]/ramadan/proofs/[sponsorship]/download/route.ts
src/app/kempen/[slug]/tajaan/bayaran/page.tsx
src/app/kempen/[slug]/tajaan/bayaran/resit/route.ts
src/app/kempen/[slug]/tajaan/penaja/route.ts
src/app/kempen/[slug]/tajaan/page.tsx
src/components/admin/ramadan-panel.tsx
src/components/admin/ramadan-proof.tsx
src/components/public/ramadan-checkout.tsx
src/components/public/ramadan-payment.tsx
src/components/public/ramadan-sponsors.tsx
src/lib/ramadan/contracts.ts
src/lib/ramadan/payment-contract.ts
src/lib/ramadan/payment.ts
src/lib/ramadan/receipt-contract.ts
src/lib/ramadan/receipt-pdf.ts
src/lib/ramadan/verification-contract.ts
src/lib/ramadan/verification.ts
src/lib/supabase/database.types.ts
supabase/migrations/20261018145036_ramadan_payment_verification.sql
~~~

## Concurrent workspace tooling

Five additional workspace changes appeared independently during final review: package.json, package-lock.json, docs/WEBSITE-TOOLING.md, scripts/accessibility/accessibility.spec.ts and scripts/accessibility/playwright.config.ts. They are preserved, not authored or counted as the 44-file 10.2b candidate. The whole working tree contains 49 changed files at this snapshot. Separate candidate-only and whole-workspace diff/stat inventories are retained in ignored review evidence. The earlier 1,380-case count is historical. The final polish rerun separately executes the unchanged accessibility suite against the affected public page. No source from that tooling work was reverted or overwritten.
