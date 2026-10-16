# Fasa 8.4 — Qurban Capacity / Cattle / Allocation Foundation

**Fasa 8.4 complete / owner-approved — Qurban Cattle / Share Capacity & Allocation Foundation.**
Baseline: 8be077af6a246f2de0b3d54c39e8c1402d209230, tag phase-8.3-qurban-admin-management.
16 October 2026 (+08:00). Work is in the dedicated Masjid website repository.
8.0–8.4 complete / owner-approved. Fasa 8 remains in progress; 8.5 next / not started. Fasa 9 has not started.
Owner authorizes the checkpoint commit and tag phase-8.4-qurban-allocation-foundation, then canonical main/tag push without force. No hosted Supabase/Sanity/Vercel changes or deployment.

Contracts: [owner architecture](QURBAN-MVP-PLAN.md), [private domain](QURBAN-DOMAIN-DATABASE.md),
[public admission](QURBAN-PUBLIC-REGISTRATION.md), [protected admin/export](QURBAN-ADMIN-MANAGEMENT.md).
All nine previous migrations retain their original native bytes. The 8.3 file was LF at preflight while the earlier eight
use checkout-filter CRLF; neither encoding/line-ending form was rewritten.

Additive migration: [20261016004640_qurban_allocation_foundation.sql](../supabase/migrations/20261016004640_qurban_allocation_foundation.sql).
No flags, campaign, annual config, registrations, eligibility or allocation rows are seeded.

## Owner-locked decisions

- Future payment-qualified Participations are allocated automatically to the earliest suitable free slots.
- Same-cattle preference applies to the eligible set in that admission transaction. Try the lowest-numbered cattle
  with enough free slots; otherwise split by cattle number then slot number. It is never a public guarantee.
- Cattle and share numbering is scoped to one campaign. UUIDs remain internal identity.
- Admin/super_admin may reassign an existing allocation to an empty slot; staff is read-only.
- No swapping, reshuffling to fit a group, initial manual assignment, release, refund, waitlist or reopening workflow.

## Policy B and the missing Fasa 9 boundary

Registration submission != reservation. Proof submission != reservation or verified funds.
Ordinary public registration continues creating Registration/Participations/ConsentAcceptance/submission audit/idempotency
and **zero Allocation**, even when a populated capacity grid exists.

The private allocator cannot prove financial eligibility in 8.4 because the payment domain does not exist.
Its security contract is a trusted future caller, not a paid/verified/payment_eligible column or caller boolean.
There is no public/admin initial-allocation wrapper, HTTP endpoint, UI action or runtime EXECUTE grant.
Admin and super_admin cannot convert an unallocated participant into allocated through the production application.
Migration-owner local fixtures explicitly simulate eligibility; they do not verify payment.

Normal production operations are limited to initialize grid, protected read and reassign an existing allocation.

## Private schema and integrity

| Table | Columns / constraints |
| --- | --- |
| private.qurban_cattle | UUID id, campaign_id, display_number 1–10000, capacity 1–100, server created_at. Unique campaign/display number and id/campaign. |
| private.qurban_cattle_slots | UUID id, campaign_id, cattle_id, slot_number 1–100, server created_at. Same-campaign composite cattle FK, unique cattle/slot and id/campaign. Slot <= cattle capacity. |
| private.qurban_allocations | UUID id, campaign_id, registration_id, participation_id, slot_id, version, server created_at/updated_at. Unique Participation and slot; composite ownership FKs enforce same Registration/campaign and slot/campaign. |

An additive unique constraint on existing Participation(id,registration_id) supports its allocation ownership FK.
No contact/name/phone/email is duplicated in cattle/slot/allocation rows.
Grid rows are immutable. Allocation identity/ownership/created_at are immutable; only slot may change through reviewed
reassignment, deriving version+1 and updated_at on the server. Ordinary DELETE is denied, including migration-owner
attempts unless explicit isolated fixture cleanup temporarily disables its exact delete guards.

All three tables: private unexposed schema, RLS enabled, zero permissive policies.
Raw privileges revoked from PUBLIC, anon, authenticated, service_role, supabase_auth_admin, authenticator and campaign_scheduler.
Existing private table ACL/RLS, Foundation authorization and generic/public campaign DTO remain unchanged.
No new runtime DB role, privileged browser credential, service_role application path or public PII lookup.

## Grid initialization and configuration freeze

admin_qurban_initialize_grid(target_campaign uuid):
Foundation manager authorization (including super_admin live AAL2/TOTP and signed recent-TOTP requirement),
valid exact Qurban v1 config, exclusive campaign lock, create configured cattle and every configured slot, then bounded audit.
Initialization creates no allocations and reserves no shares.
Repeating initialization safely returns unchanged=true without duplicate rows or audit.

UI warns before initialization:
“Pastikan bilangan lembu dan bahagian setiap lembu telah disemak.
Selepas grid disediakan, perubahan struktur kapasiti memerlukan workflow berasingan.”

Once any cattle exists, a campaign UPDATE trigger denies changes to cattle_count/shares_per_cattle and campaign/type identity.
This covers generic Campaign config commands and direct storage updates, without modifying an old migration/function.
Unrelated otherwise-valid configuration edits remain possible and never reprice original submissions.
No expansion/shrink/correction workflow is implemented, even before the first allocation.
Grid operations reject partial/incoherent grid counts rather than silently repair them.

## Internal deterministic admission

private.qurban_allocate_registration(target uuid, registration uuid, participations uuid[]) returns jsonb.
SECURITY INVOKER, fixed empty search_path, no PUBLIC/runtime EXECUTE. Only trusted migration-owner code can invoke it now.

Input is a distinct, non-null set of 1–100 opaque Participation IDs belonging to exactly that submitted Registration/campaign.
Already allocated members reject the admission; no implicit deduplication/replay/participant lookup by name.
Future payment command owns payment-level idempotency. No unrelated participant or prior allocation is changed.

Lock order: Foundation actor authorization -> campaign FOR UPDATE -> Registration FOR UPDATE -> allocation/slots.
Initialization and reassignment use the same campaign mutex directly, avoiding shared-to-exclusive lock upgrade races.
Existing amendment/cancellation/export commands hold campaign SHARE before Registration; these serialize safely with allocation.
Storage guards, composite FKs and unique Participation/slot constraints provide additional integrity defenses.
[PostgreSQL locking reference](https://www.postgresql.org/docs/17/explicit-locking.html).

Algorithm:
1. Validate complete grid, Registration status/ownership and exact requested set.
2. Determine free slots. If a preferred cattle can contain the whole batch, choose the first by display_number.
3. Otherwise order free slots by cattle display_number, slot_number.
4. Require all N slots before writing anything; insufficient space raises safe operational conflict.
5. Pair slots with Participation order created_at, id; insert all allocations and one bounded assigned audit per row.

No randomness, name matching, global slot numbering, automatic reshuffle or partial admission.
A failure in any insert/constraint/audit rolls the whole command back.

Example synthetic 3 x 5 grid:
- 3 normal participants -> Lembu 1 slots 1–3.
- 4 same-cattle participants -> Lembu 2 slots 1–4.
- 6 same-cattle participants -> split Lembu 1 slots 4–5, Lembu 2 slot 5, Lembu 3 slots 1–3.
Two slots remain; no existing group was reshuffled.

## Protected reads and reassignment

admin_qurban_grid(target_campaign uuid,page_number integer):
role-authorized read, actor SHARE lock, campaign SHARE lock, bounded 10 cattle/page and <=100 slots/cattle.
Page 1–1000; no bulk hidden browser dataset.
Summary: configured cattle/share counts, actual initialized capacity, allocated count, empty count.
Occupied slot projection: opaque allocation/version/Participation/Registration IDs, participant name, purpose, full Registration
reference. Staff receives no address/email/contact/consent/payment internals from this projection.

admin_qurban_reassign_allocation(target_campaign uuid,allocation_id uuid,expected_version integer,target_cattle uuid,target_slot uuid):
- Manager/MFA authorization; existing source allocation in the campaign; submitted Registration.
- Exact expected allocation version; target slot and cattle in the same campaign; target empty.
- Same source/target is an unchanged no-op. Occupied/stale targets conflict; unknown/cross-campaign targets deny.
- No allocation INSERT occurs. Source becomes free, target occupied, row version advances, one audit stores old/new coordinates.
- Quote/config, participant identity, Registration state and historical ConsentAcceptance stay unchanged.

UI: existing /admin/campaigns/[id]/qurban gains Kapasiti / Lembu, responsive cattle/slot cards and pagination.
Managers can inspect an empty target cattle/slot and confirm Dari/Ke before “Sahkan pindah bahagian”.
It states “Ini mengubah susunan operasi sahaja. Rekod pendaftaran, akad dan quote asal tidak berubah.”
Staff has no initialize/move controls and cannot invoke their commands directly.
No initial-allocation button exists for an empty slot/unallocated participant.

## Cancellation safety

An additive Registration UPDATE trigger rejects cancellation whenever any current allocation exists.
Ordinary 8.3 admin_qurban_cancel returns safe conflict with no status/audit/slot change.
No automatic release, delete, refund, participant movement or cancellation override.
Unallocated Registration cancellation and all other reviewed 8.3 semantics remain intact.
Future financial/release rules require owner review in Fasa 9.

## Audit and SQL inventory

Existing private.qurban_operational_audit gains bounded nullable:
allocation_id, cattle_number, slot_number, previous_cattle_number, previous_slot_number,
grid_cattle_count, grid_shares_per_cattle.
Old action shapes/immutability/actor derivation remain enforced. No PII or raw JSON diff is added.

New vocabulary:
- allocation.grid_initialized: campaign/actor/time and exact grid dimensions; no Registration/Participation.
- allocation.assigned: campaign/Registration/Participation/allocation IDs, new coordinates, version 0 -> 1.
- allocation.reassigned: same IDs, previous/new coordinates, expected -> expected+1.
Coordinates are operational facts, not copied names/contact. Failed mutations produce no event.

Twelve new functions:
Private: qurban_allocation_campaign; qurban_capacity_config_guard; qurban_allocated_cancellation_guard;
qurban_allocation_record_guard; qurban_allocation_audit_guard; qurban_admin_grid; qurban_admin_initialize_grid;
qurban_allocate_registration; qurban_admin_reassign.
Public: admin_qurban_grid; admin_qurban_initialize_grid; admin_qurban_reassign_allocation.
Only the three tiny trusted-owner SECURITY DEFINER public wrappers grant authenticated EXECUTE.
All new functions have fixed empty search_path; private EXECUTE and all other runtime public-wrapper grants are revoked.

Exactly two existing private projection bodies are replaced additively:
qurban_admin_activity (allocation metadata), qurban_admin_export_snapshot (coordinates/summary).
Their signatures, ACL and security mode remain unchanged; all other old functions remain identical.

Six triggers:
qurban_capacity_config_guard; qurban_allocated_cancellation_guard; qurban_cattle_guard;
qurban_cattle_slot_guard; qurban_allocation_guard; qurban_allocation_audit_guard.

Fourteen indexes including PK/unique constraints:
qurban_cattle_pkey; qurban_cattle_campaign_id_display_number_key; qurban_cattle_id_campaign_id_key;
qurban_cattle_slots_pkey; qurban_cattle_slots_cattle_id_slot_number_key; qurban_cattle_slots_id_campaign_id_key;
qurban_slot_campaign; qurban_allocations_pkey; qurban_allocations_participation_id_key;
qurban_allocations_slot_id_key; qurban_allocation_registration; qurban_allocation_campaign;
qurban_participation_identity_registration; qurban_audit_allocation.

## Excel snapshot enrichment

Owner requires a distinct print-friendly cattle-grouped operational view. The workbook now has exactly five sheets,
in order: Ringkasan; Pendaftaran; Peserta; Susunan Lembu; Format Audit - Legacy View.
ExcelJS 4.4.0 is retained; no dependency change.
Susunan Lembu displays cattle ascending and every configured slot ascending, including explicit Kosong rows.
Occupied slots use current participant/purpose/full QBN/applicant/phone from the same snapshot; no address/email,
akad internals, payment dates or financial conclusions. Exact note:
“Susunan operasi allocation sahaja. Bukan bukti bayaran atau pengesahan pembayaran.”
Before grid initialization, configured slots are still represented as Kosong and the title explicitly says
“Grid belum disediakan; slot konfigurasi sahaja.” This display creates no cattle, participation or allocation rows.
A4 landscape, frozen/repeated identifying rows 1–3, wrapped text and full references, restrained bold headings,
and manual page breaks before each subsequent cattle group support printing. A group fits together where its
configured size/text permits; unusually large groups or long names may require native Excel print adjustment.
Peserta adds No. Lembu / No. Bahagian after the date column.
Legacy View fills its existing cattle/share columns and sorts allocated rows by cattle then slot ascending.
Unallocated rows follow, ordered by created_at then opaque Participation id (code-point ordering), including
retained cancelled records. Unallocated coordinates and every Tarikh Bayaran remain true blanks.
Peserta retains the original snapshot participant order; it is not repurposed as a cattle print view.
Ringkasan adds actual Kapasiti grid / Slot diperuntukkan / Slot kosong; theoretical configuration and
all/active/cancelled participant semantics remain separate. No paid/verified/received-funds labels.

One materialized SQL/MVCC snapshot includes every participant's allocation coordinates and grid summary.
All five sheets consume that identical in-memory snapshot; no per-sheet DB read can observe different reassignments.
Existing export caps, manager-only release, hash-bound ticket, completion audit, failure withholding, injection protection
and staff export denial are preserved. Strings never become formulas. Exported workbook edits never write back to DB.

## Local-only owner/AJK review

Run from the repository root. Requires Docker Desktop, installed dependencies and Edge for the optional reviewer.
No genuine production authentication is weakened.

~~~powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/qurban-registration/review-fixture.mjs setup
# Optional: only when the fixture has no registrations:
node scripts/qurban-allocation/review-fixture.mjs registrations
node scripts/qurban-registration/serve.mjs
~~~

Alternatively fill dummy registrations at http://localhost:3082/kempen/local-qurban-review.
In another terminal:

~~~powershell
node scripts/qurban-admin/review-browser.mjs admin
~~~

Open Kempen -> fixture -> Buka pengurusan Qurban -> Kapasiti / Lembu. Review dimensions and initialize the grid.
Then a terminal command explicitly simulates future eligibility:

~~~powershell
node scripts/qurban-allocation/review-fixture.mjs allocate
node scripts/qurban-allocation/review-fixture.mjs inspect
~~~

**LOCAL REVIEW ONLY — synthetic eligibility, not payment verification.**
No eligible/paid column is written. The private allocator is invoked as the disposable migration/test owner,
using the owned synthetic Foundation actor; no runtime/public HTTP bypass is introduced.
The entire CLI allocation batch is atomic; oversize batches refuse without partial work. Repeating after all allocations is a no-op.
The optional registrations seed refuses an existing Registration rather than adding duplicate demo data.

Both commands require local environment, approved loopback Docker/Supabase stack, exact manifest, immutable marker,
original setup-row fingerprints, enabled guards and known dependencies. Preflight is locked in the same transaction as writes.
They reuse selective cleanup's ownership preflight but stop before any guard-disable/delete, preserving all production guards.
A missing/tampered/legacy manifest refuses; an absent fixture campaign cannot be adopted.
Normal admin session launcher remains synthetic local identity/AMR evidence, not genuine OAuth/MFA proof.

Refresh grid, inspect automatic placement, move one occupied share to an empty target, inspect Aktiviti, export .xlsx.
Read-only review: node scripts/qurban-admin/review-browser.mjs staff.
Do not pay any synthetic fixture.

Close reviewer browsers and stop serve.mjs, then:

~~~powershell
node scripts/qurban-registration/review-fixture.mjs cleanup
node scripts/qurban-registration/review-fixture.mjs inspect
~~~

Cleanup removes owned operational/allocation audit -> allocations -> cattle slots -> cattle -> export tickets ->
submission evidence/consent/participants/registrations/akad -> campaign/flags -> exact fixture Auth dependencies.
Allocation descendants belong to the manifest-proven campaign through enforced FKs; setup identity/config/akad fingerprints
are unchanged by grid/reassignment commands. No unrelated campaign/row is adopted; ambiguous shared ownership refuses.
Only exact local delete guards are disabled/restored in one locked transaction; repeat-safe; no TRUNCATE/CASCADE or HTTP endpoint.
Unknown dependencies cause atomic refusal. Legacy pre-manifest data still requires the explicit disposable fallback:
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed.
Never reset owner demo data automatically.

## Fasa 9 integration contract — not implemented

Future authorized financial verification must:
1. Authenticate through Foundation and lock its reviewed payment verification context in a consistent global lock order.
2. Verify actual funds/proof using the future payment-domain rules and accepted immutable quote.
3. Invoke this trusted allocation admission for the full server-determined eligible set.
4. Require every requested share to fit.
5. Commit verified-payment transition + allocation + their mandatory audits atomically.

Capacity conflict must roll back the financial verification transition as well; a proof alone never qualifies a share.
Financial idempotency/locking must compose with Foundation actor -> campaign -> Registration ordering.
Exact overflow/refund/waitlist, release/cancellation, payment exceptions and recovery remain owner-unresolved.
No payment/proof/receipt/refund/waitlist/volunteer schema or workflow is implemented here.

## Verification evidence

**1,273 unique automated cases passed**, excluding reruns, two reviewer-launcher checks and the final owned-fixture smoke:

| Suite | Passing cases |
| --- | ---: |
| Offline Foundation/Campaign/Qurban/prototype gate/cleanup and new allocation contracts | 680 |
| Real 8.4 PostgreSQL/HTTP/browser/allocation/concurrency/Excel | 19 |
| Real 8.3 admin/contact/participant/cancellation/export | 18 |
| Real 8.1 Qurban foundation | 63 |
| Real 8.2 public admission/idempotency | 36 |
| Real public production boundary | 3 |
| Real Campaign/Foundation/flags/lifecycle/management/public/Auth/security | 429 |
| Real isolated selective-cleanup PostgreSQL smoke | 1 |
| Public registration browser | 11 |
| Gated 8.0 prototype browser | 13 |

New focused coverage: 37 allocation DB cases + 2 request contracts + 2 additive-upgrade cases + 14 actual workbook cases,
two additional selective-cleanup/ownership cases, and 19 real allocation cases. The final Excel polish reran all 680 offline cases, real allocation/admin suites (19/18), and the final build/security checks; the other unique suite totals retain the prior approved candidate evidence. Reruns are not counted twice.
Historical absence-of-allocation assertions now explicitly permit only the three reviewed allocation tables while
continuing to prove zero allocation from public submissions and no payment/volunteer tables.
A cancellation-corruption scenario exists only in a rollback-only migration-owner test; no production guard is weakened.

Native PostgreSQL concurrency: three independent psql transactions each request two shares with only two slots free.
Exactly one complete set commits; two fail for insufficient capacity; no partial rows or audit; final occupancy 15/15.
Record: .cache/qurban-84/concurrency.json. Synthetic placement: synthetic-evidence.json.
Reassignment native/browser checks preserve byte-identical quote/consent, free the source, occupy target, increment version,
and audit once. Browser cancellation with allocation receives explicit operational conflict with no slot release.

Responsive grid/read/reassignment at 375/430/768/1440 passes without horizontal overflow; staff has no mutation controls.
Screenshots: .cache/qurban-84/grid-{375,430,768,1440}.png; grid-empty-375.png; grid-staff-375.png;
reassign-375.png; cancel-denied-375.png.
Actual browser-downloaded DB-backed workbook: .cache/qurban-84/admin-allocation-export.xlsx.
It contains four registrations/fourteen retained participants at capture: thirteen allocated, one cancelled/unallocated.
Grid capacity=15, allocated=13, empty=2; one reassigned participant is Lembu 3 / Bahagian 4 in Peserta, Susunan Lembu and Legacy View.
The later concurrency fixture is a separate point after that export snapshot, not a different sheet read.
Independent injection/consistency workbooks: .cache/qurban-84/allocation-test.xlsx and grouped-cattle-test.xlsx.
The latter deliberately scrambles source participant order and includes =,+,-,@ names across three cattle, eleven empty slots and retained unallocated/cancelled records.
Print render: .cache/qurban-84/render/Susunan Lembu.png.
All ten reviewed migration files, including the 8.4 additive candidate, remain byte-for-byte unchanged during final polish.
Office Open XML package, sheet/row counts, coordinate agreement, blank payment/unallocated cells, inert strings/phones,
summary arithmetic and completion-audit semantics are validated. The new five-sheet OOXML structure and cattle print layout were programmatically inspected; Susunan Lembu and the reordered Legacy View were rendered with multiple cattle and empty slots.
Bundled preview tooling may normalize phone text visually; the source OOXML/ExcelJS round-trip preserves exact strings.
Native Microsoft Excel opening/printing remains an owner review step, not automated evidence.

Final production Webpack, TypeScript, zero-warning lint and real generated-type parity pass.
271 browser chunks pass privileged-secret/PII-fixture/test-adapter/private-allocator/server-workbook scans.
No dependency/lockfile change. Nine historical migration native-byte hashes remain identical.
Only three public RPC signatures are added to generated types; private tables remain unexposed.
Local docs links and tracked/untracked whitespace checks pass.

Fresh real no-seed resets were exercised. Final native inspection:
descriptor=1, production adapter=1;
campaigns=0, flags=0, Registration=0, Participation=0, AkadVersion=0, ConsentAcceptance=0,
submission audit=0, idempotency=0, operational audit=0, export tickets=0,
cattle=0, cattle slots=0, allocations=0, Auth fixture users=0.
The final setup/seed/protected-init/private synthetic admission smoke produced 3 cattle / 15 slots / 13 allocations,
then selective cleanup ran twice and returned every business/Auth count to zero. All six new guards remain enabled.
No owner data was automatically reset: the initial stack was verified empty before any full disposable reset.

Evidence in .cache/qurban-84/: database-inventory.json, final-cleanup.json, fixture-smoke.json, test-counts.json,
source-verification.json, security-sensitive.diff, full-candidate.diff, full-diff-stat.txt, git-diff-stat.txt, git-status.txt.
All are ignored synthetic local review artifacts, not browser/public assets or production seed data.
Test/review servers are stopped; owner review uses the explicit runbook above.

Reproduce focused suites:
~~~powershell
node --import tsx --test scripts/qurban-allocation/database.test.mjs scripts/qurban-allocation/contract.test.ts scripts/qurban-allocation/upgrade.test.mjs scripts/qurban-allocation/workbook.test.ts
node --test scripts/qurban-allocation/local.test.mjs
~~~
The real suite requires a clean disposable local stack and the production build from scripts/qurban-domain/build.mjs.
Never run shared-stack reset suites concurrently or from two checkouts.

**8.4 complete / owner-approved. 8.5 next / not started; Fasa 9 has not started.**
No public PII lookup, production initial-allocation bypass, payment proof, verification, receipt, refund, waitlist,
volunteer persistence, hosted mutation/deployment or previous migration edit. STOP after the 8.4 checkpoint commit/tag/push.

## Exact checkpoint files

~~~text
README.md
docs/QURBAN-ALLOCATION.md
docs/QURBAN-ADMIN-MANAGEMENT.md
docs/QURBAN-MVP-PLAN.md
docs/ROADMAP.md
scripts/qurban-admin/database.test.mjs
scripts/qurban-admin/local.test.mjs
scripts/qurban-admin/workbook.test.ts
scripts/qurban-allocation/contract.test.ts
scripts/qurban-allocation/database.test.mjs
scripts/qurban-allocation/local.test.mjs
scripts/qurban-allocation/review-fixture.mjs
scripts/qurban-allocation/upgrade.test.mjs
scripts/qurban-allocation/workbook.test.ts
scripts/qurban-domain/database.test.mjs
scripts/qurban-registration/cleanup.test.mjs
scripts/qurban-registration/database.test.mjs
scripts/qurban-registration/fixture-session.mjs
scripts/qurban-registration/review-fixture.mjs
src/app/admin/api/campaigns/[id]/qurban/capacity/reassign/route.ts
src/app/admin/api/campaigns/[id]/qurban/capacity/route.ts
src/components/admin/qurban-admin.css
src/components/admin/qurban-capacity.tsx
src/components/admin/qurban-panel.tsx
src/lib/qurban/admin-contract.ts
src/lib/qurban/allocation-contract.ts
src/lib/qurban/allocation.ts
src/lib/qurban/export-workbook.ts
src/lib/supabase/database.types.ts
supabase/migrations/20261016004640_qurban_allocation_foundation.sql
~~~
