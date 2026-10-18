# Fasa 10.1 — Ramadan Offering Management, Public Schedule & Sponsorship Registration

**Fasa 10.1 COMPLETE / OWNER-APPROVED — Ramadan Offering Management, Public Schedule & Sponsorship Registration.** Owner approval: 18 October 2026 (+08:00), including final Malay UX and public-name contract, with no further functional or visual changes. Approved baseline: 69b221f2e83b5a2f949cdf7a914e295c7a36812c / phase-10.0-ramadan-domain-foundation. Checkpoint: `phase-10.1-ramadan-management-submission` (resolve tag for commit). Fasa 8/9/10.0 remain owner-approved. Fasa 10 overall remains IN PROGRESS; 10.2 next / NOT STARTED and 10.3 NOT STARTED. No hosted mutation/deployment.

## Owner decisions and immutable meaning

Deactivation is **close new intake**, not invalidation of existing commitments. Offering/schedule active=false removes it from new public selections and invalidates a previously opened context. Existing submitted Sponsorship and Items remain retained and visible to authorized managers, with their original quote. Future 10.2 verification must not deny an otherwise eligible old sponsorship solely because its offering/schedule is now inactive. Campaign lifecycle, flags, archival and future financial eligibility are separate gates.

Each item now captures accepted_offering_name on INSERT from its same-campaign Offering. Caller text is never trusted. The original immutable item guard still denies UPDATE/DELETE, and a narrow additional trigger prevents label rewriting. Renaming a current program does not rename accepted historical items. Schedule date/day/price/count are already locked by any referenced item, including historical/cancelled activity; referenced offering mode is locked. Owner refinement: named submissions derive the stored public_display_name from the validated payer_name; anonymous submissions store NULL and future verified projection renders **Hamba Allah**. There is no independent display-name input or request key. Both server shape validation and DB submission validation reject caller-supplied public_display_name, even NULL or a value equal to payer_name. Accepted payer_name/public_display_mode/public_display_name are immutable under an additional UPDATE guard; payer contact remains private. No pending sponsor identity is publicly projected.

Submission is not reservation. All public quote/success states say exactly: **Penghantaran borang belum menjamin slot tajaan. Slot hanya akan diberikan selepas bayaran disahkan oleh pihak masjid.** Pending checkouts may overlap quantities. No payment, occupied-slot identity, assignment, receipt or confirmed sponsor data is created in 10.1.

## Additive DB boundary

Migration: [20261018002947_ramadan_management_submission.sql](../supabase/migrations/20261018002947_ramadan_management_submission.sql). All fourteen previous migrations remain byte-for-byte unchanged. Existing Qurban/Campaign/Foundation function definitions and ACL are unchanged.

The reviewed 10.0 foundation exposed no runtime submission and has no production business rows. Upgrade explicitly refuses pre-existing private foundation fixture items, instead of disabling their immutable guard or guessing historical accepted labels. Clean such owned local foundation fixtures through their reviewed tool before upgrade; unknown data requires owner review, never adoption.

The five business tables remain typed and separate from Qurban. One immutable text field is added to ramadan_sponsorship_items: accepted_offering_name (plain trimmed 1–100 characters, NOT NULL). Two private support tables:

| Table | Exact fields / purpose |
| --- | --- |
| ramadan_submission_idempotency | key_hash (64 hex PK), payload_hash (64 hex), sponsorship_id (unique restrictive FK), created_at (server). No key plaintext or raw request. |
| ramadan_operational_audit | id UUID, campaign_id, nullable offering_id/schedule_id/sponsorship_id/actor_id restrictive FKs, controlled action, expected_version/resulting_version, controlled changed_fields text array (max 8), item_count (1–40 when submission), occurred_at (server). No names/contact, raw diffs or quotes. |

Four triggers: ramadan_item_label_guard, ramadan_accepted_identity_guard, ramadan_audit_guard, ramadan_idempotency_guard. New explicit indexes: ramadan_sponsorship_reference_search (campaign/lower reference), ramadan_audit_campaign_time. Audit UUID PK plus idempotency key PK and unique sponsorship FK backing indexes also enforce uniqueness. No slot-occupation columns/tables exist.

Fifteen new private functions: ramadan_item_label_guard, ramadan_evidence_guard, ramadan_exact_object, ramadan_admin_campaign, ramadan_admin_offering, ramadan_admin_schedule, ramadan_public_context, ramadan_submission_valid, ramadan_submission_result, ramadan_submit, ramadan_admin_workspace, ramadan_admin_slots, ramadan_admin_sponsorships, ramadan_admin_detail, ramadan_admin_activity.

All use fixed empty search_path. Private helpers are invoker functions called only beneath narrow trusted-owner SECURITY DEFINER public wrappers; private EXECUTE remains revoked. Both support tables have RLS enabled, zero policies, raw privileges revoked from PUBLIC/anon/authenticated/service_role/supabase_auth_admin/authenticator/campaign_scheduler/qurban_proof_storage_worker. No private Data API exposure or runtime service-role client is added.

## Public context and submission

Route: /kempen/[slug]/tajaan, linked from an eligible generic campaign page. Generic public Campaign DTO remains unchanged. Narrow DB context wrapper: public_ramadan_context(target_slug text), granted only anon/authenticated. It returns neutral NULL unless exact ramadan/1 descriptor/config, public/unlisted visibility, flags ON, open lifecycle and the registration window at DB time are eligible. Missing flags mean OFF. Server reads use no-store; unavailable failures are sanitized.

Context fields: slug, title, campaign_year, hijri_display_label, currency, campaign_version, global_flag_version, module_flag_version, registration_closes_at, offerings, schedules, context_token. Offering fields: id/name/mode/version. Schedule fields: id/offering_id/version/day/date/unit_price_minor/slot_count/confirmed_occupied/available. Only active offering/schedule intake is projected. No payer/contact/reference/PII/other campaign data, sponsor display names or private sponsorship IDs are exposed.

Confirmed occupied is exactly zero in 10.1 because no Ramadan verified-payment/assignment domain exists. Available equals configured slot_count, never capacity minus pending items. The isolated projection must later read only 10.2 verified assignments; no fake verified funding or pending public names may be substituted.

Public HTTP POST: /kempen/[slug]/tajaan/hantar. DB wrapper public_ramadan_submit(payload jsonb), anon/authenticated only. Exact request shape:

- slug; context_token (SHA-256 of exact bounded context); idempotency_key (32 random browser bytes encoded as 64 hex).
- payer: exactly name, phone, email (nullable).
- public_display_mode: named/anonymous. No public_display_name request key; DB derives named from validated payer.name or stores NULL for anonymous.
- items: 1–40 entries. FIXED_SLOT: exactly offering_id/offering_version/schedule_id/schedule_version/quantity. OPEN_AMOUNT: exactly offering_id/offering_version/amount_minor (canonical positive integer string).

No client price/total/year/reference/DB sponsorship identity/slot number is accepted. One fixed schedule may occur once per checkout; the UI asks users to combine its quantity. Quantity must fit that schedule's configured capacity. Open donations require no quantity/date/unit, and the one-minor-unit technical positive floor is not a business minimum. Exact decimal parsing uses integer BigInt; DB exact NUMERIC minor-unit arithmetic remains authoritative. Aggregate cap 1e12 minor units; schedule unit cap 1e9. No future annual value is invented.

Lock order for new public admission: idempotency hash advisory lock; reviewed shared global/module flag locks and rows; campaign-specific Ramadan advisory lock; campaign SHARE lock; parent/child rows. Management: Foundation actor authorization/lock; Ramadan advisory lock; campaign/parents. Existing Foundation flag setters and campaign writers are respected. Context includes flag/campaign/offering/schedule versions, labels and prices, so changes—even deactivate/reactivate or OFF/ON—force review. Window eligibility is checked again at commit admission. Consistent domain serialization also protects activity-free grid rebuild versus first sponsorship.

Transaction revalidates all selections, derives immutable price/total, creates Sponsorship + every Item + one idempotency row + one structural sponsorship.submitted audit, or rolls everything back. Same hashed key + canonical JSONB payload replays the same frozen quote/reference (even after closure); a different payload conflicts. The strong key is independent of PII. No public RSP-only lookup/recovery exists.

Response: reference, currency, total_minor, items (accepted offering label/mode/date/day/quantity/unit price/line total). No payer contact is returned. UI keeps the successful quote only in memory; refresh clears it. Network ambiguity retries the same frozen request and disables return-to-edit until resolved, so the UI cannot silently replace an uncertain committed request with a new key. Conflict disables retry and asks the visitor to reload/review, rather than silently repricing.

HTTP defense in depth: exact application/json, exact shape, 16 KiB streamed UTF-8 body limit, same-origin/Origin/Sec-Fetch-Site checks, route/slug equality, 40-item cap, bounded plain text, no URL/storage persistence, escaped React text. Direct RPC is independently validated. External anti-bot vendor is absent; provider/edge rate limiting remains a Fasa 11 launch-hardening gate. Request bodies, idempotency keys and PII are never logged by new code.

## Admin workflow, RBAC and audit

Protected workspace: /admin/campaigns/[id]/ramadan, reached from the exact Ramadan adapter's Campaign detail. Sections: Program Tajaan, Jadual Tajaan, Pendaftaran Tajaan, and manager-only Aktiviti. Staff receives read-only configuration/slot coordinates and a minimal sponsorship projection.

| Role | Offering/schedule/grid | Sponsorship projection | Writes / audit |
| --- | --- | --- | --- |
| Public / outsider / revoked / disabled | Public-safe eligible context only, or denied | No private read/lookup | Public bounded submission only; no management |
| staff | Read-only | Reference, ID, status/version/submitted time, accepted year/Hijri, labels/date/quantity; no payer name/phone/email/display-name/financial quote/audit internals | No management, cancellation, audit or export |
| admin | Operational full read | Payer name/contact, public choice, accepted item quote and total | Versioned offering/schedule management; structural audit read |
| super_admin | Same domain capabilities | Same protected operational projection | Existing Foundation AAL2/MFA and recent TOTP required for writes; no bypass |

Nine public wrappers and exact grants:

| RPC | Input / permission |
| --- | --- |
| public_ramadan_context | target_slug; anon/authenticated, safe projection |
| public_ramadan_submit | exact payload above; anon/authenticated, transaction |
| admin_ramadan_workspace | target_campaign; authenticated Foundation read |
| admin_ramadan_offering | target_campaign + payload; manager only |
| admin_ramadan_schedule | target_campaign + payload; manager only |
| admin_ramadan_slots | target_campaign + target_schedule; approved read, at most 1000 coordinates |
| admin_ramadan_sponsorships | target_campaign + options page/search/status; approved read, 20 rows per page |
| admin_ramadan_detail | target_campaign + target_sponsorship; role-projected detail |
| admin_ramadan_activity | target_campaign + page_number; manager/audit authorization, 20 rows |

Offering command: id/expected_version (both NULL for CREATE), name, mode, display_order, active. Schedule command: id/expected_version (NULL for CREATE), offering_id, ramadan_day_number, service_date, unit_price_minor (integer string), slot_count, active. Explicit date/day and reviewed annual price/count only. OPEN_AMOUNT schedules denied. Same-campaign normalized offering-name uniqueness; display order 0–9999. Technical bounded catalog: 100 offerings, 500 schedules, 1000 slots per schedule. Workspace/public context fail closed above bounds. Staff search is exact normalized RSP only; manager search also supports bounded case-insensitive payer-name and phone substring, with deterministic newest-time/UUID pagination. No fuzzy identity matching/deduplication.

Ordinary schedule changes can rebuild empty Slot 1..N only before any accepted Item exists. After activity, date/day/price/count edits conflict; active toggling remains allowed. Mode changes conflict while schedules or items reference the Offering. No hard-delete UI/RPC, quote mutation, sponsorship contact amendment, cancellation, export or financial workflow is introduced. Sponsorship management in 10.1 is bounded inspection only; pre-payment cancellation was optional and is deferred rather than inventing future financial eligibility rules.

Audit vocabulary: offering.created, offering.updated, schedule.created, schedule.updated, sponsorship.submitted. Records contain only controlled field categories/versions, IDs, actor for administrative writes, count and server timestamp. Audit is immutable. Failed/stale/unauthorized operations do not commit an audit. No generic Campaign audit change, PII copy, raw JSON diff or arbitrary reason is added.

## Repeatable local owner/AJK review — repository root

Use only the official dedicated website repository and disposable mtu-admin-local stack. No real money/identities. Start Docker Desktop first. No production flags/defaults are seeded. Run these commands from repository root:

```powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/ramadan-management/review-fixture.mjs setup
node scripts/ramadan-management/serve.mjs
```

Open http://localhost:3082/kempen/local-ramadan-review/tajaan. Use dummy names/contact only. Synthetic annual year 2051, day/date 4/2051-03-04, 11/2051-03-11, 22/2051-03-22; prices 18765/24321/31987 minor units, slot counts 4/6/5. Three arbitrary local programs, including OPEN_AMOUNT. These values are local tooling only, different from historical owner references, not application defaults.

In a second terminal, open a normal protected reviewer browser (synthetic local identity only, not genuine OAuth/MFA evidence):

```powershell
node scripts/ramadan-management/review-browser.mjs admin
node scripts/ramadan-management/review-browser.mjs staff
node scripts/ramadan-management/review-fixture.mjs inspect
```

Submit anonymous and named checkouts (named uses payer name automatically, without another input); mix multiple dates/programs plus open donation. Inspect full RSP and exact accepted quote, zero occupancy and no-reservation warning. In admin, create/rename programs, create explicit schedules, rebuild an unused grid, inspect accepted items. Deactivate a referenced schedule: new/stale submission conflicts while old sponsorship remains visible. Try a locked price/count/date/day edit and stale expected version; they conflict without changing quote. No real transfer, proof, payment or receipt testing belongs here.

Repeat-safe one-command selective cleanup (stop review browsers/server first):

```powershell
node scripts/ramadan-management/review-fixture.mjs cleanup
```

Setup requires an empty disposable Foundation/campaign baseline and refuses existing/untracked records; it never resets them automatically. Local-only guard rejects production/Vercel/nonlocal/unproven Docker endpoints before DB access. The prewritten random ownership manifest .cache/ramadan-review-session.json and canonical DB fingerprints prove campaign, flags, Auth identities/sessions/factors and generic setup audit ownership. Fingerprints are rechecked under table locks in the **same local-only cleanup transaction**. Dependency order: Ramadan audit, idempotency, items, sponsorships, schedules/slots, offerings, owned generic audit/campaign/flags/profile and Auth graph. Named immutable guards are temporarily disabled only by local migration-owner tooling for the proved graph, restored before commit; unknown guards/manifest changes/partial graph fail closed. Qurban capacity guard remains enabled. No runtime privilege or HTTP hard-delete endpoint exists. Other records, including an independently owned invite, remain intact; repeat cleanup is a no-op. Unknown foundation/session data is never adopted. An interrupted setup without completed fingerprints is refused, not automatically recovered/deleted.

Full disposable reset remains an explicit fallback only after proving no owner data needs preservation; it is never automatic merely to start demo setup:

```powershell
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed
```

The eight known unmanifested Qurban synthetic orphan backing files are unrelated: no Ramadan Storage access or deletion is performed, and their ownership is never adopted.

## Owner UX refinement

The public choice is “Paparkan nama pada jadual tajaan?” with “Ya, paparkan nama saya” / “Tidak, paparkan sebagai Hamba Allah”. Phone/email and pending identities are never publicly projected. Admin “Tarikh Program” and schedule displays use DD/MM/YYYY by rearranging the stored calendar-date components, never timezone conversion; the date input and DB continue to use YYYY-MM-DD/date. “Hari Ramadan” remains independent. Editors offer “Tutup Tajaan Baharu” or “Buka Semula Tajaan” when changing active state. A scoped compact checkbox/label layout prevents the generic admin text-input sizing from stretching this control. Closing intake does not invalidate accepted commitments.

## Verification and remaining gates

New suites: scripts/ramadan-management/database.test.mjs, contracts.test.ts, upgrade.test.mjs, local.test.mjs, review.spec.ts. Evidence covers immutable quote/label, mode/date/day/price/count, normalized uniqueness, exact slots/rebuild, deactivation retention/new denial, mixed checkout, quantity/duplicate bounds, anonymous privacy, stale tokens, raw ACL/RLS, Foundation roles/MFA, real Auth/PostgREST concurrent replay and version races, rollback/audit consistency, manifest tampering/missing ownership, repeat cleanup and unrelated-row preservation. Responsive screenshots cover 375/430/768/1440 public schedule/review/success and protected admin offerings/grid/detail; staff contact fields are absent at DB projection level.

Owner-approved verification evidence: **1,944 unique automated cases passed; zero final failures; reruns excluded**. This comprises 1,175 isolated contracts/domain/upgrade cases, 724 real local DB/API/Storage cases, 37 public/admin/prototype browser cases and eight native receipt PDF regressions. The focused name/date/migration suite passed 120 cases (included in the full count). Browser cases prove derived named values and anonymous NULL in the real DB, rejection of an independent HTTP display-name field, unchanged quote/replay, no pending identity after refresh, exact copy, closed/reopened intake actions, calendar-date display in Pacific/Honolulu, no overflow at 375/430/768/1440, and compact keyboard-native intake controls. TypeScript, source lint (zero errors/warnings), production Webpack, generated public-type parity, browser bundle/secret/private-schema/PII-fixture scans, 70-document/451-link checks and git diff --check passed. The fresh fifteen-migration chain and selective cleanup leave two reviewed descriptors, zero campaigns/flags/business/Auth fixture rows across all 38 operational/Auth/Storage-metadata tables. All fourteen prior migration byte hashes and eight known unmanifested Qurban backing files are unchanged. Synthetic screenshots and detailed per-suite evidence are under .cache/ramadan-101; the owner-review report records their exact paths. Owner has approved this implementation and the final Malay name, date and intake UX; 10.1 is complete. This checkpoint does not claim hosted deployment or production launch readiness.

10.2 owns separate Ramadan payment capability/private proof, financial eligibility, verified all-or-nothing capacity admission, deterministic earliest slots and Ramadan receipt. Its transaction must respect accepted quotes/labels and not invalidate a prior commitment solely due to offering/schedule deactivation. 10.3 owns reporting/Excel/public operational refinement. No partial assignment, pending reservation, verified sponsor simulation, gateway/cash/cheque/CDM workflow, receipt or reporting exists in 10.1.

Final checkpoint verification reruns all 1,175 isolated Ramadan/Qurban/Campaign/Foundation contracts/domain/upgrade cases, 29 real Ramadan foundation/management Auth/PostgREST cases, 37 responsive Qurban/prototype/Ramadan browser cases and eight native Qurban receipt PDF checks (1,249 cases). The 695 prior real Qurban/Campaign/Foundation regression cases remain valid from the unchanged approved candidate; all non-document candidate file hashes are preserved during closeout. The combined unique coverage remains 1,944 cases, with reruns excluded. Fresh local reset/type parity/build/security/docs/diff/integrity and empty-state checks are repeated. No additional business or visual behavior is changed.
