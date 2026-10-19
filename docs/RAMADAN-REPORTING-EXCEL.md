# Ramadan Reporting & Excel — Fasa 10.3

**COMPLETE / owner-approved.** Baseline `b56806d724b97137b8806ecc772af2256d2dc9d7` / `phase-10.2c-ramadan-calendar-amendments`. Fasa 10.0–10.2c remain COMPLETE / owner-approved. Fasa 10 — Ramadan Sponsorship MVP COMPLETE / owner-approved. Fasa 11/12 have not started. The owner authorizes the final checkpoint commit/tag/push only. No hosted service mutation/deployment.


Owner approved the dashboard, three independently reviewed five-sheet workbooks and the three-page A4 operating schedule. Checkpoint: `phase-10.3-ramadan-reporting-excel`. Fasa 10.0/10.1/10.2a/10.2b/10.2c/10.3 are COMPLETE / owner-approved. Fasa 11 — Security Hardening NEXT (not implemented); Fasa 12 — Production Launch Preparation NOT STARTED. MVP completion does not claim production readiness. Open follow-ups: Foundation mobile Menu accessibility; explicit manual calendar/financial-exception resolution and sponsor notification; low-priority repeated Masjid header on every printed schedule page. None is implemented or suppressed by this checkpoint.

## Source and counting definitions

Reporting reads only typed Ramadan Sponsorships/Items, verified Payments, Receipt identities, verified Slot Assignments, Proof history, current Capacity Exceptions and approved Calendar Revisions. No financial fact is copied into a reporting ledger table. No reporting command updates payment, receipt, item, assignment, schedule or quote rows. Qurban business tables/functions are unchanged.

- **Jumlah Bayaran Disahkan:** SUM of distinct selected `ramadan_payments.verified_amount_minor`, once per payment/Sponsorship. A mixed multi-item checkout is one financial transaction.
- **Bilangan Transaksi Disahkan:** count of those same verified payment rows. Submitted/rejected proofs, pending Sponsorships and capacity exceptions contribute no verified revenue.
- **Sumbangan Terbuka Disahkan:** SUM of accepted OPEN_AMOUNT lines within the selected verified Sponsorships. No slot is manufactured for these lines.
- **Nilai Item Padanan:** SUM of accepted verified item lines matching offering/day/current-date boundaries. It is separate from whole-aggregate verified payment totals.
- **Slot Disahkan:** actual materialized slots with assignments joined to their verified payment. Pending quantities never occupy slots.
- **Kapasiti:** configured slots in selected schedules. **Slot Kosong Fizikal** = capacity minus verified occupancy. **Boleh Ditaja** = physically empty slots whose offering/schedule are active, calendar day is valid and campaign lifecycle/visibility/DB-time window plus both required flags permit new intake. **Disekat** = physically empty minus available for intake. An invalid day never becomes an ordinary available opportunity.
- **Menunggu Semakan:** selected Sponsorships whose latest proof is submitted and which have no verified payment. No-proof submissions are distinct and searchable using the appropriate status filter.
- **Bukti Ditolak:** retained rejected proof attempts within selected Sponsorships, including history after later resubmission/verification. The rejected view shows controlled reason, review time, current payment status and whether a later proof was submitted. It is not an accounting claim that funds were/weren't received.
- **Kes Memerlukan Tindakan Admin:** distinct selected Sponsorships with an invalid calendar day or a capacity-insufficient marker for the current submitted proof. Old capacity attempts do not keep an otherwise corrected/verified case falsely open. Action detail rows are item-level follow-ups and must not be summed as financial transactions. Current rejected evidence is also included in the follow-up sheet/view, separately labelled.

Financial status remains independent from operational exceptions. Verified day-30 payments retain their full financial amount and receipt even after official29 invalidation. No automatic refund, substitution, fulfillment, cancellation, reassignment or receipt reissue is implied.

## Filter scopes and dates

One existing protected Campaign/year workspace is the reporting scope; selecting a different campaign uses the existing Campaign navigation. The optional year must match that campaign. Exact bounded filters: year, same-campaign offering_id, day1..30, current program date_from/date_to, payment_status, sponsorship_status, exception, literal partial/full RSP search, view and page. Unknown fields/types, invalid dates, reversed ranges, wildcard identity searches, foreign offering IDs and unbounded pages fail closed. Pages contain at most25 rows; full XLSX ignores page/view selectors and exports all matching rows within its explicit limits; no full database browser payload.

Financial selection is **whole Sponsorship** if any accepted item matches offering/day/current-date filters, followed by aggregate payment/Sponsorship/exception/RSP filters. The payment ledger still contains its full verified amount once, and Butiran Program contains **all** accepted lines of that selected payment, so totals reconcile exactly. The item-match subtotal makes a narrower program/date amount explicit. Open contributions in a selected mixed aggregate remain financially represented.

Schedule capacity is a separate operational scope: offering/day/current-date and calendar-validity filters select schedules; payment/Sponsorship/RSP filters never hide their actual occupants. These scope differences are shown in UI and Ringkasan. A date range excludes NULL invalid-day current dates; use the calendar exception filter to review invalid days. No replacement date is invented. Capacity-category filters select current parent exceptions; they do not manufacture a per-slot financial status.

Date-only strings are displayed DD/MM/YYYY without conversion to an instant. Payment date is distinct from verified_at. Server timestamps are formatted in Asia/Kuala_Lumpur/MYT. Accepted item dates use `ramadan_item_calendar_acceptances` or the original locked schedule for pre-overlay items. Current operational dates use the latest approved overlay. Receipt snapshots are neither rewritten nor regenerated with new dates by reporting.

## Authorization and HTTP

| Role | Safe schedule/capacity | Payer/financial detail | Full XLSX |
|---|---|---|---|
| Public/outsider/revoked/disabled | Denied | Denied | Denied |
| Staff | Read-only; approved verified display names/slots only | Amounts/payment counts/review lists masked or denied; no hidden payer/contact JSON | Denied |
| Admin | Read and existing protected detail links | Full authorized operational reporting | Allowed |
| Super_admin | Same reviewed operations | Foundation AAL2/recent-TOTP remains mandatory | Same Foundation gate |

All endpoints reauthorize. No runtime service_role or general private CRUD. No payer phone/email is included in these exports; authorized follow-up uses the existing protected detail view. Schedule/print names are verified-only approved named display names or exactly Hamba Allah. Empty slots say Belum ditaja. Pending/rejected identity is never a public/schedule sponsor.

- `/admin/campaigns/[id]/ramadan`: Laporan Ramadan tab, filters, bounded views and protected detail action.
- `/admin/api/campaigns/[id]/ramadan/reports`: GET defaults or same-origin bounded JSON POST `{filters}`.
- `/admin/api/campaigns/[id]/ramadan/reports/export`: same-origin JSON POST prepares a scoped CSRF challenge; native form POST contains filters plus csrf_token and returns the XLSX attachment. **No RSP or private export filters are put in a download URL.**
- `/admin/campaigns/[id]/ramadan/laporan/cetak`: protected print-only safe slot projection. The UI strips RSP/payment/Sponsorship filters from the print link; the server rejects those private URL filters as well. Only safe catalog selectors apply. No receipt-PDF generator is introduced.

Existing `no-referrer` causes native navigation POST to carry Origin:null. It is not accepted on the JSON preparation path. Native export requires same-origin Fetch Metadata, exact trusted host, an allowed Origin, current manager/Foundation/session authorization and a cryptographically random32-byte challenge matching a HttpOnly, host-only, SameSite Strict cookie. Production HTTPS uses Secure/__Host- cookie semantics; exact local-only HTTP uses its reviewed development equivalent. Cookie stores challenge/filter/campaign/session hashes, expires after90 seconds and is cleared after success. Challenge values are neither logged nor persisted in DB/storage/URL/localStorage. No signing key or privileged credential is added. The short-lived CSRF value is not a payment capability or an independent reporting authorization. It is not claimed to be a globally one-shot nonce under simultaneous authorized requests.

## Snapshot, bounds and audit

Migration `20261019164729_ramadan_reporting_excel.sql` adds only reporting functions and one private export-evidence table; the18 approved migrations remain byte-identical. New private helpers: ramadan_report_filter, ramadan_report_data and ramadan_report_guard. All helper EXECUTE is denied to runtime roles. Narrow authenticated-only SECDEF wrappers: admin_ramadan_report, admin_ramadan_report_export, admin_ramadan_report_export_complete, admin_ramadan_report_print. Fixed empty search paths, current Foundation checks and campaign ownership apply. No existing financial/allocator/receipt/Storage function is replaced.

`ramadan_report_data` is STABLE and computes each response/export in one SQL statement/MVCC snapshot. Every export sheet comes from the same returned object. No independent read per sheet occurs. Previewing export feasibility is a separate read; the authoritative file snapshot is captured only for its actual generation. Concurrent verification may precede or follow that snapshot, never half-update its financial/slot view.

Full export bounds:2000 selected Sponsorships,10000 verified items,10000 slots,500 schedules/catalog entries,10000 rejected attempts and10000 action rows. Snapshot JSON is capped at16MiB and serialized workbook at20MiB. Process-local concurrency caps simultaneous workbook generation at2 with no unbounded queue. Over-bound exports fail and request narrower filters; nothing is silently dropped. Page queries remain25 rows. Print is bounded by the same slot/catalog envelope. Deployment-wide workload/rate limiting remains a later production-hardening concern, not a claim of distributed worker throttling.

`private.ramadan_report_exports`: UUID, campaign FK, actor FK, fixed report_type=ramadan.xlsx, server captured/expiry/completion times, snapshot SHA256, controlled filter boundaries (RSP search is hashed), payment/item/slot row counts. Index ramadan_report_export_campaign. RLS enabled, zero policies, raw CRUD revoked. ramadan_report_export_guard prevents deletion or mutation of evidence except the single authorized completion transition. Prepared requests do not count as completed exports. Completion is actor/campaign/hash bound, expires after10 minutes and rechecks Foundation access. Serialization must succeed before completion; audit failure prevents a successful download response. Completion means successful server generation/access, not proof that a browser opened the file. No workbook contents, names/contact, monetary values, private capability, Storage path or raw audit diff are stored in export evidence.

New export evidence is intentionally retained. Existing local cleanup was not run or broadened; its historical manifest/fingerprint workflow must be reviewed before deleting any campaign with new reporting references. Ordinary production hard-delete is not added.

## Workbook contract

Filename: `Laporan-Tajaan-Ramadan-<campaign_year>-<YYYYMMDD in MYT>.xlsx`. Server-side existing ExcelJS is reused without package/lockfile changes. Responses use actual XLSX MIME, attachment filename, nosniff, private/no-store and no-referrer. Normal browser native downloads preserve the extension; the local synthetic reviewer saves them under ignored `.cache/ramadan-review-downloads` using its reviewed bounded filename/file policy.

1. **Ringkasan:** campaign/year/Hijri, generation timestamp, readable filter labels/scope, verified amounts and transactions, configured/confirmed/physical-empty/intake/blocked slots, submitted/rejected/exception counts, confirmed open contributions, matched item amount, current calendar status/revision.
2. **Jadual Tajaan:** Program Tajaan; Hari Ramadan; Tarikh Program Terkini; Nombor Slot; Status Slot; Nama Paparan Penaja; Harga Seunit (RM); Status Takwim; Tarikh Asal; Tajaan Baharu. Exactly one row per configured selected slot. Invalid day current date is blank/dash and clearly flagged.
3. **Bayaran Disahkan:** No. Rujukan RSP; Nama Pembayar; No. Resit; Jumlah Disahkan (RM); Tarikh Bayaran; Tarikh Disahkan (MYT); Kaedah Pembayaran; Pengecualian Takwim. One row per verified payment, including historical calendar exceptions.
4. **Butiran Program:** No. Rujukan RSP; Program Diterima; Jenis; Hari Ramadan; Tarikh Diterima; Tarikh Program Terkini; Kuantiti; Harga Unit Diterima (RM); Jumlah Item Diterima (RM); No. Resit. OPEN_AMOUNT has no fake quantity/unit price/date/slot.
5. **Tindakan Admin:** No. Rujukan RSP; Status Bukti / Bayaran; Program Terjejas; Hari Ramadan; Tarikh Program Terkini; Kategori Isu; Masa Bukti Dihantar (MYT); Masa Semakan (MYT); Bayaran Disahkan?; Penyelesaian Operasi. No phone/email or invented resolution workflow.

The renderer reconciles each payment against exact accepted item sums, distinct parent references, overall verified sum, open-amount sum and actual slot capacity/occupancy/intake. Financial report totals above100000000000000 minor units fail closed and require narrower filters before browser JSON is emitted. Money uses integer minor units and BigInt for authority; safe numeric MYR cells are bounded to100000000000000 minor units and must round-trip to exactly the original cents. Unsafe conversion or reconciliation fails closed. No worksheet/user formula, macro, external link or remote content is generated. User strings are explicit text; formula-leading/control-leading values are neutralized. Headers are bold/frozen, widths/wrapping/date labels/currency formats are controlled, identifying rows repeat for print. A separate dynamic A4 native-browser schedule view is the simpler physical operating board.

## Repeatable local review, without reset/cleanup

Run from repository root with the existing localhost:3082 review app and mtu-admin-local stack. No real payment or hosted resources.

~~~powershell
node scripts/ramadan-reporting/review-browser.mjs admin
node scripts/ramadan-reporting/review-browser.mjs staff
# Existing original review campaign with broader payment/rejection history:
node scripts/ramadan-reporting/review-browser.mjs admin --original
node --test scripts/ramadan-reporting/local.test.mjs scripts/ramadan-reporting/concurrency-local.test.mjs
node --import tsx --test scripts/ramadan-reporting/database.test.mjs scripts/ramadan-reporting/workbook.test.ts scripts/ramadan-reporting/export-contract.test.ts
~~~

Review summary, schedules, paid/pending/rejected/actions, filter a program/day/current-date range, compare full payment vs item totals, open existing authorized detail, download/open all five sheets and print the safe schedule. The latest approved calendar dataset demonstrates named/Hamba Allah/empty slots, mixed items and day30; the original approved dataset adds rejected and capacity examples. Reviewer identity is synthetic local evidence, not a production Google/MFA bypass. Its manifest/fingerprint proves the existing campaign; no record is adopted or deleted.

Known Foundation mobile Menu label-content-name-mismatch remains OPEN as the separately recorded accessibility/security hardening backlog. It is not suppressed or modified. This phase does not begin Fasa11/12 hardening. Manual calendar exception resolution and sponsor contact remain operations requiring separate reviewed financial policy; no automatic notification/refund/substitution/correction tool is introduced.

## Final checkpoint verification evidence

Fresh reruns:1520 unique passing automated cases;42 separately retained passing cases from approved checkpoints,1562 distinct cases overall. Fresh coverage includes1468 isolated domain/contract/upgrade/workbook cases;14 current real-browser reporting/export cases across the latest calendar dataset and the original broader review dataset; one real PostgreSQL verification/read-snapshot race fully rolled back;12 production route cases;8 calendar browser cases;3 native proof/receipt regression cases;4 receipt PDF inspections;6 scoped/public accessibility cases; and4 independent workbook/LibreOffice checks. Repeated runs are not counted twice. Retained evidence is12 real calendar mutation/race workflows,8 full private-Storage expiry/recovery/intake workflows,13 prototype browser cases and9 previous checkpoint gates. Those fixture-creating workflows were not repeated against the live owner dataset.

TypeScript, lint, production Webpack build, public generated-type parity,309 browser-chunk secret/PII/server-module scans, documentation links and diff checks pass. The fresh19-migration chain and18→19 upgrade run in isolated test databases; the live owner stack is never reset. Its18 historical migration bytes,5116 original row fingerprints across50 tables, original receipt SHA256 and all8 known Qurban orphan bytes remain unchanged. The five unrelated tooling hashes match preflight exactly.

Actual native Edge XLSX downloads reconcile to database totals: latest approved calendar dataset RM990.36 /4 payments /24 configured slots; original review dataset RM14596.15 /127 payments /489 configured slots. Five-sheet files are readable by ExcelJS and openpyxl and the live downloaded workbook is opened/rendered by LibreOffice. This is not a claim of a Microsoft Excel desktop GUI test. All artifacts and sanitized evidence stay ignored under .cache/ramadan-103; none is intended for Git.

Owner artifact review and final independent checks also confirm the synthetic workbook RM598.72 /2 verified payments, exact per-aggregate reconciliation across all three workbooks, no formulas/macros/external workbook links, and a three-page A4 operating schedule. Original receipts and accepted quotes remain unchanged. Optional repeated Masjid header on each print page is a low-priority UX backlog, not a completed enhancement.
