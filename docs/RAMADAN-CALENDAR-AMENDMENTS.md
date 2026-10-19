# Ramadan Calendar Amendments — Fasa 10.2c

**Fasa 10.2c COMPLETE / owner-approved.** Baseline: `9cbbe8e3213abb7ead693c0033e748469bc57ac2` / `phase-10.2b-ramadan-payment-verification`. Fasa 10.0/10.1/10.2a/10.2b remain COMPLETE / owner-approved. Fasa 10 remains IN PROGRESS; 10.3 NEXT / NOT STARTED. Owner approved the final checkpoint on 20 October 2026 (+08:00); only the isolated 34-file candidate is authorized for commit/tag/push. No hosted deployment.

## Calendar authority and decisions

Only an administrator-entered reference to an official announcement can support an approved official calendar. This feature does not fetch government dates, calculate Hijri calendars or infer delivery/fulfillment. Calendar labels are **Anggaran** and **Disahkan**. A confirmed start with `duration=NULL` explicitly means the final 29/30-day duration has not been announced. Estimated calendars cannot claim a confirmed duration. A confirmed calendar cannot silently downgrade to estimated.

The Campaign's reviewed year and Hijri label are copied into the proposal. Once a calendar is published, the three-key annual configuration is locked by a narrow Ramadan-only guard; title, lifecycle and ordinary campaign operations retain their existing rules. A new annual campaign or a separately reviewed correction workflow is required to change that annual identity.

A valid Ramadan day has one corresponding program date across offerings: the entered start date plus day minus one. The system supports an arbitrary subset of days, not an assumed full month. A selected correction must restore that consistent mapping; it cannot invent an alternative date for the same Ramadan day. Conflicting duplicates for one offering/day/date require owner review. No automatic merge, financial amendment or substitution is provided.

## Three different dates

| Evidence | Meaning | Can a calendar revision rewrite it? |
| --- | --- | --- |
| Schedule `service_date` / `ramadan_day_number` | Original planning identity, activity-locked by 10.0/10.1 | No |
| Accepted sponsorship item date | Date accepted at submission | No |
| Approved effective program date | Current operational date from the latest published revision | New immutable revision only |
| Receipt issuance snapshot | Historical accepted date and financial/item evidence captured when issued | No |
| Invalid-day exception | Planned day does not occur; no valid current program date | Future reviewed resolution required |

No old item is backfilled or rewritten. Earlier items continue to resolve their accepted date from their original locked schedule. New fixed items capture a separate typed `ramadan_item_calendar_acceptances` row during the item INSERT, recording the approved effective date/revision at acceptance. Direct later insertion/update/delete of that acceptance is denied. OPEN_AMOUNT has no calendar acceptance or slot coordinates.

The original submission result/idempotent replay and receipt use the accepted date. Current operational projections carry separate current/accepted dates. An existing sponsorship verified after a calendar amendment still receives a receipt reflecting its immutable accepted evidence; current dates are clearly displayed separately. Receipt regeneration never reads a future mutable price or replaces historical dates. No second receipt is issued for a calendar change.

## Additive database inventory

Migration: `20261019094733_ramadan_calendar_amendments.sql` (eighteenth migration). The seventeen historical migration files remain byte-for-byte unchanged. No annual values, flags, calendar or business records are seeded.

| Private table | Typed fields / constraints |
| --- | --- |
| ramadan_calendar_proposals | UUID, campaign FK, base revision, campaign year/Hijri, estimated/confirmed status, finite start date, nullable confirmed 29/30 duration, bounded plain announcement reference, controlled reason/mode, source/preview/payload/idempotency hashes, server preparation time/actor; unique campaign + key hash |
| ramadan_calendar_entries | Proposal/campaign/schedule composite FKs, original day, expected schedule version, original/previous/effective dates, resolution_required; one entry per proposal/schedule; invalid day has NULL effective date |
| ramadan_calendar_revisions | UUID, campaign/proposal FK, campaign-scoped unique positive revision, unique proposal, server approval actor/time |
| ramadan_calendar_audit | Controlled prepared/published action, campaign/proposal/revision IDs, actor/time, expected/resulting revision, bounded affected count; unique action per proposal |
| ramadan_item_calendar_acceptances | Item PK, same-campaign aggregate/item/revision FKs, accepted date/day, server time; inserted only by the new-item trigger |

Every new table is private, RLS enabled, with zero policies and raw CRUD revoked from PUBLIC, anon, authenticated, service_role, authenticator, supabase_auth_admin, scheduler and both Storage workers. All private calendar helpers deny runtime EXECUTE. Nothing exposes the private schema or introduces a service_role client.

Indexes cover campaign proposal history, schedule/proposal history, item/aggregate lookup and unique revision/idempotency identities. Immutable BEFORE guards reject update/delete, with deferred proposal/publication audit requirements. Additional guards enforce calendar-consistent new/draft schedules, invalid-day assignment denial and annual-config locking. The original activity-locking schedule guard and trusted allocator are unchanged.

## Protected workflow and API

`/admin/campaigns/[id]/ramadan` adds **Takwim Ramadan** and **Semak Pindaan Takwim Ramadan**.

1. Enter estimated/confirmed start, optional officially confirmed duration, announcement reference and controlled reason.
2. Select full alignment or explicit selected corrections. One-day earlier/later buttons only prepare a proposal.
3. Preview original/previous/new dates, affected unique sponsorships, pending/verified counts, assignments, receipts and conflicts.
4. Admin/super_admin saves an immutable proposal. Saving changes no effective date.
5. Super_admin opens the proposal, explicitly reviews its impact and publishes with current Foundation AAL2/recent TOTP.
6. One revision atomically makes every validated entry effective and records required audit. No partial publication.

| RPC | Authorization / contract |
| --- | --- |
| admin_ramadan_calendar(campaign) | Foundation read; bounded current metadata, catalog and latest history; staff has no proposal/actor internals |
| admin_ramadan_calendar_preview(campaign,payload) | Manager; bounded exact input, read-only impact calculation |
| admin_ramadan_calendar_propose(campaign,payload,expected_preview,key) | Manager; exact preview/hash, idempotent same-key/same-payload preparation |
| admin_ramadan_calendar_proposal(campaign,proposal) | Manager; campaign-owned immutable proposal/impact, current staleness |
| admin_ramadan_calendar_publish(campaign,proposal,expected_revision,expected_preview) | Super_admin only; Foundation AAL2/recent TOTP, exact saved proposal/version, atomic publication and terminal replay |

HTTP boundary: `/admin/api/campaigns/[id]/ramadan/calendar`, GET or exact bounded POST. POST requires same-origin and exact application/json; request streams are bounded to 16 KiB. At most 100 selected corrections, 500 catalog/impact rows, 20 proposal/history heads. Public users cannot preview, propose or publish. Staff reads approved operational calendar context only. No financial confirmation or arbitrary date write is accepted through generic Campaign JSON.

Input fields: expected_revision, status, start_date, duration, reference, reason, mode and changes. A selected change has schedule_id, expected_version and effective_date. No payer, amount, receipt or actor may be caller-selected. The server generates preparation/publication identity, actor and timestamps.

## Concurrency, stale previews and audit

Lock order: Foundation actor/session authorization → shared global/module flag locks and rows → existing campaign-scoped Ramadan advisory lock → campaign row → proposal/entries. Offering/schedule/submission/verification share the same campaign boundary. No allocator lock ordering is changed.

The preview hash includes canonical input, impact and a PII-free source fingerprint: DB-local review day, current calendar, campaign/config/version, flag versions, catalog versions and sponsorship/payment/receipt identities/state relevant to the impact. New sponsorships, verification, configuration/version changes or a DB-day rollover invalidate a saved preview/proposal. Every publish rechecks source, row versions, full row set, mapping, uniqueness and past-day rules. Same proposal replay returns its original published revision without duplicate history/audit; competing proposals cannot both publish the same base revision.

Audit vocabulary: `calendar.proposal.prepared`, `calendar.revision.published`. Typed entries retain exact operational date changes and the proposal retains the announcement reference. Audit contains structural IDs, actors, revision transition, count and server time; no payer name/contact, financial amount, receipt snapshot, raw request JSON or Storage/token data.

## Past programs and exceptional days

A change affecting a program on or before the current DB date in Asia/Kuala_Lumpur, or moving it into that period, fails closed. Preview says the program may already have taken place and requires explicit owner review. No completion/delivery state is fabricated. Unchanged historical dates are retained.

When an officially confirmed duration is 29 days, planned day-30 entries publish with `resolution_required=true` and no valid effective date. They never become Syawal sponsorships. **Memerlukan Tindakan Admin — Hari Program Tidak Berlaku** is an operational exception, distinct from ordinary offering/schedule deactivation and the 10.2b capacity shortage marker.

- New public intake is denied even with a fresh context or a manually crafted request.
- Pending aggregates containing any affected fixed item cannot verify; no unaffected line is independently verified/assigned.
- Existing submitted proof remains evidence; it is not automatically rejected or deleted.
- Existing verified payment, slots, receipt number/snapshot and proof remain intact.
- Public operational cards keep history/verified names with a clear unavailable warning and no selectable intake. Remaining physical slots are not offered as sponsorship opportunities.
- Secure participant view shows the exception separately from retained verified-payment truth. A current valid date is NULL; the last planned date can still label the unavailable catalog/history card.
- Ordinary active/inactive toggles and a later calendar entry cannot silently clear a published invalid-day marker. Resolution, substitution, refund, financial correction and reissue require a separately owner-reviewed future workflow.

## Projections and privacy

The public schedule uses current approved dates, automatic verified-only names, Hamba Allah, Belum ditaja, exact verified counts and bounded 20-slot pages. Pending/rejected/capacity/calendar-exception submissions do not create new occupancy. Existing verified history is retained when its program later becomes invalid.

Public calendar metadata is limited to revision number, Anggaran/Disahkan state, start, known duration and approval timestamp. No new private revision/proposal/actor/sponsorship UUID, contact, proof, banking reference or capability is exposed. Existing opaque public offering/schedule selectors remain unchanged. Current revision/date metadata participates in the existing stale-form context token.

Admin and the scoped participant payment session display accepted versus current dates and **Tarikh Program Dikemas Kini**. The payment page remains capability-bound and private/no-store. RSP alone is not authorization. Payer phone/email, pending identities and receipt access remain private. No automatic email, WhatsApp or SMS is sent.

## Local review without reset or cleanup

Run from the repository root. Keep the existing owner review app/DB/Storage running; do not start a second stack or reset it.

~~~powershell
node scripts/ramadan-calendar/review-fixture.mjs setup
node scripts/ramadan-calendar/review-fixture.mjs inspect
node scripts/ramadan-calendar/review-browser.mjs admin
# Separate reviewer window for approval:
node scripts/ramadan-calendar/review-browser.mjs owner
# Optional read-only role:
node scripts/ramadan-calendar/review-browser.mjs staff
# Open the retained fully tested amendment/day-30 example:
node scripts/ramadan-calendar/review-browser.mjs owner --latest-run
~~~

Public fixture: http://localhost:3082/kempen/local-ramadan-calendar-review/tajaan. The setup prints its protected admin URL. Existing app startup, only when not already running: `node scripts/ramadan-management/serve.mjs`.

Setup is local-only and repeat-safe; it refuses an unmanifested existing root or changed ownership fingerprints. It creates independent synthetic Foundation identities so the original owner demo manifest is unaffected. It reuses enabled local flags without updating/adopting them. Manifest is ignored `.cache/ramadan-calendar-review.json`; no credentials are committed. Reviewer tokens use the existing local synthetic Auth test pattern and real protected routes, not a production login/MFA bypass. They are not genuine Google/TOTP ceremony evidence.

Synthetic year 2057, start 03/02/2057, three arbitrary program labels, selected days 4/6/30, varied RM197.43/RM243.21/RM182.76/RM287.65 and slot counts 4/3/3/2 are explicitly NOT an actual Malaysian calendar, announcement, payment, production seed or business default.

Manual review: submit dummy fixed+open items, upload synthetic proof, verify exact synthetic evidence, save/download the first receipt; admin previews a one-day shift using a clearly synthetic reference; owner approves; compare current program date with original receipt; confirm duration is still unknown; later preview/publish 29 days; inspect pending and verified day-30 cases. Do not transfer real money.

~~~powershell
node --test scripts/ramadan-calendar/local.test.mjs
node --import tsx --test scripts/ramadan-calendar/contracts.test.ts scripts/ramadan-calendar/database.test.mjs scripts/ramadan-calendar/upgrade.test.mjs
~~~

Live tests create separate per-run campaigns under the independently owned local identities and retain every test record. Ignored `.cache/ramadan-102c/run-*.json` and latest-run.json identify them without storing payment-access secrets. No reset, fixture deletion or Storage cleanup is invoked. The existing selective-cleanup builder includes the new typed dependencies for a separately authorized future cleanup, retains ownership/fingerprint checks and preserves production guards. The new calendar review fixture deliberately has no cleanup/reset command. Unknown objects and the eight known unrelated Qurban orphan backing files are never adopted/deleted.

## Evidence and remaining gates

Fresh isolated tests cover estimated/confirmed unknown duration, 29/30 cases, explicit corrections, multiple revisions, accepted/new date snapshots, old receipt upgrades, PII-free projections, RLS/grants, Foundation roles/MFA, stale versions, partial-publication/audit rollback and activity locks. Fresh local tests exercise actual public checkout/JPEG/private Storage, admin-assisted PNG/PDF, protected PDF bytes, admin preview and super-admin approval, all four responsive widths, invalid-day all-or-nothing denial, simultaneous publication and financial-verification races. Exact fresh/retained counts, artifact locations, migration hashes and preservation evidence are recorded in the final candidate report.

Native before/after PDFs and current/invalid participant/admin/public screenshots are ignored under `.cache/ramadan-102c`. Receipt renderer and original financial/allocator/Storage authorization remain unchanged. No refund, payment rewriting, silent date substitution, receipt reissuance, automatic notification, hosted mutation/deployment or Fasa 10.3 reporting is implemented. The owner-approved isolated checkpoint is authorized below.

## Implementation verification evidence retained at checkpoint

Fresh reruns: **1,433 passing automated cases** — 1,386 isolated contract/domain/database/upgrade cases (1,330 predecessors plus 56 calendar cases), 12 real calendar checkout/Storage/Auth/publication/financial-race workflows, eight bounded responsive/download/security browser cases, eight 10.2a real private-Storage expiry/recovery/intake cases, eight production-mode cases (four predecessor and four calendar), three exact owner-review-runner download/file-opening cases, four native PDF text/layout inspections, and four axe checks (public desktop/mobile plus the new calendar component at 375/1440). These include fresh migration-chain creation in an isolated test database; the active owner stack was never reset. Thirteen unchanged prototype-browser cases retain earlier passing evidence and are not claimed as freshly rerun: 1,446 distinct passing cases with that retained set. Older destructive/reset/cleanup integration evidence is retained separately and is not added.

An additional whole-admin axe run reports one **pre-existing** mobile `label-content-name-mismatch` on the Foundation shell Menu button (`aria-label=Open admin navigation`); its baseline source is unchanged. The desktop whole-admin scan passes. This finding is retained under ignored `axe-admin-375.json`; it was not suppressed or fixed by changing Foundation scope. The new calendar component and public page scans have zero violations. Manual keyboard/field-error and 375/430/768/1440 checks also passed; automated scans alone are not full accessibility certification.

TypeScript, lint, production Webpack build, generated public-type parity (normalized line endings/trailing whitespace), documentation links and diff checks pass. Browser scan covers 306 static JS/map chunks with zero tested privileged-token/secret/private-helper/server-PDF/fixture-PII matches. All 32 function definitions in the additive migration match the actual local database bodies; private helper grants, table RLS/zero policies and enabled guards are checked.

Preservation: all 4,232 pre-existing row fingerprints across 18 original Ramadan tables remain exact, including the original receipt counters; the original review manifest still proves ownership. All seventeen prior raw migration hashes, five independent tooling hashes and eight known Qurban orphan backing-file hashes remain unchanged. The new total is eighteen migrations. No fixture/Storage cleanup, reset, adoption or deletion occurred. New independent synthetic campaigns/identities and their payment history are retained for review.

Actual calendar before/after/participant PDF downloads are byte-identical; the verification/publication race committed one complete financial outcome with the original receipt unchanged. Final evidence and exact candidate-only file/diff inventories are in ignored `.cache/ramadan-102c/`; no proof, token, synthetic PII, screenshot or generated PDF belongs in the checkpoint. The active review app remains on localhost:3082.

## Owner-approved final checkpoint — 20 October 2026 (+08:00)

**Fasa 10.2c COMPLETE / owner-approved.** Checkpoint tag: `phase-10.2c-ramadan-calendar-amendments` (resolve tag for exact SHA). Fasa 10.0/10.1/10.2a/10.2b remain COMPLETE / owner-approved. Fasa 10 overall remains IN PROGRESS; 10.3 NEXT / NOT STARTED. No functional or financial changes were requested at approval. Only the 34 calendar candidate files are included; five independent tooling files remain outside the checkpoint and byte-identical to preflight.

Final checks reuse the existing synthetic environment and immutable publication history: no new duplicate fixture, calendar revision, payment or sponsorship is needed. Fresh contract/DB/upgrade tests use an isolated database, never reset the owner stack. Real Auth/PostgREST checks exercise authorized terminal publication replay, denied roles/AAL/stale-TOTP, read-only impact preview, invalid-day submission denial, blocked mixed verification and original receipt bytes. Earlier successful proposal-save/publication and actual concurrent calendar/payment race evidence is explicitly retained rather than rerun by creating more business data. Exact fresh/retained counts and preservation fingerprints are recorded with final checkpoint evidence.

### Outstanding manual operations and accessibility backlog

Invalid-day exceptions require an authorized Masjid administrator to review the preserved case and contact the sponsor manually. Calendar publication sends no automatic email, WhatsApp or SMS. No refund, substitution, payment amendment, cancellation, fulfillment or receipt correction/reissue tool is provided; these require a separately reviewed policy/workflow. The retained receipt remains historical evidence.

Accessibility/security hardening follow-up: the pre-existing mobile Foundation Menu button has `label-content-name-mismatch` (visible Menu; accessible name Open admin navigation). This finding remains open, was not suppressed or reported resolved, and Foundation navigation is unchanged by this checkpoint. Public/new calendar component scans are recorded separately.

Final approval rerun: **1,422 freshly passing cases** — 1,386 isolated prior/domain/calendar/upgrade cases, eight live calendar/browser cases, nine existing-data Auth/PostgREST/checkpoint gates, eight production cases, three exact owner-review-runner download/open cases, four PDF inspections, and four public/calendar-component accessibility cases. **33 retained passing cases** comprise twelve previously completed real calendar creation/publication/payment-race workflows, eight real private-Storage expiry/recovery/intake workflows and thirteen prototype-browser cases. Total distinct passing evidence: **1,455**. Retained mutation workflows were not rerun against live data solely to duplicate fixtures. The existing mobile Foundation Menu accessibility finding remains open separately.

The approval run preserved all **5,088 pre-existing row fingerprints across 50 tables** (Ramadan, Qurban, campaigns/flags and Storage metadata), including every calendar proposal/revision already present. The earlier **4,232 original fingerprints across 18 Ramadan tables** still match independently. All seventeen historical migration hashes, five independent tooling files and eight Qurban orphan backing files retain exact parity. No owner data was reset, reseeded, adopted, cleaned or deleted; no duplicate fixture was created. TypeScript, lint, Webpack production build, generated public types,306 browser chunks, local documentation links and diff checks passed.
