# Ramadan Private Payment Proof — Fasa 10.2a

**Fasa 10.2a COMPLETE / OWNER-APPROVED — Ramadan Private Payment Proof Intake.** Owner manually retested synthetic sponsorship registration and proof upload, confirmed verification is intentionally unavailable, and approved the resolved local Storage-worker expiry issue. No further functional changes requested. Baseline `32f563ae7e2160f77a0dec3dc3aedd7b621dfa88`, tag `phase-10.1-ramadan-management-submission`. Checkpoint: `phase-10.2a-ramadan-payment-proof` (resolve tag for commit). Fasa 10.0/10.1 remain complete / owner-approved; Fasa 10 remains IN PROGRESS; 10.2b NEXT / NOT STARTED and 10.3 NOT STARTED. No hosted mutation/deployment or production-launch claim.

## Scope and owner decisions

Website payment method is **Pindahan Bank only**. The trusted server-only organisational source is `src/lib/payments/bank.ts`: Bank Islam; `1227 0010 0045 60`; MASJID TALHAH BIN UBAIDILLAH. Participant input cannot choose a bank destination.

An accepted Sponsorship may submit proof after the registration window closes, provided its status remains `submitted`, both `campaigns.enabled` and `ramadan.enabled` are ON, and its supported/valid campaign is not archived. This is an explicit owner approval, separate from new-intake rules. Offering/schedule deactivation closes NEW sponsorship intake only; it does not invalidate accepted quote items or their evidence intake. Existing scoped capability access is distinct from the public schedule/new-intake visibility boundary.

Submission and proof intake reserve **zero slots**. No Ramadan verified payment, assignment, rejection transition, receipt, reporting/Excel, gateway, refund, waitlist, instalment or partial-payment acceptance exists here. A claimed amount mismatch is retained as unverified evidence, not acceptance of a partial payment. No new proof can replace an existing submitted attempt.

## Additive database boundary

Migration: `20261018100426_ramadan_payment_proof_intake.sql`. All 15 earlier migrations remain untouched. Six new private tables, all with RLS and zero raw policies:

| Table | Bounded purpose |
| --- | --- |
| `ramadan_payment_access` | One random UUID access identity per Sponsorship, SHA-256 secret hash only, campaign ownership, reserved revocation marker; no public reissue/recovery command |
| `ramadan_payment_sessions` | Hashed scoped session tokens, 20-minute server expiry, at most ten live sessions per access identity |
| `ramadan_proof_intents` | Immutable upload identity, hashed idempotency/payload/storage nonce, amount/date/source/actor, format/size/SHA-256, 15-minute renewable pending lease, generated opaque object key |
| `ramadan_payment_proofs` | Committed attempt identity, `submitted` only, server submission time/version; unique open proof per Sponsorship |
| `ramadan_payment_audit` | Immutable structural submission/admin-submission/download-access events, IDs/actor/source/count/time only |
| `ramadan_proof_download_grants` | Hashed nonce for one proof, Foundation actor/Auth session, five-minute maximum grant |

Composite FKs enforce campaign/Sponsorship/intent/proof ownership. Intent metadata and committed proof are immutable. Ordinary cancellation of a Sponsorship with a submitted proof fails closed; no financial cancellation workflow is added. Expired session/download-grant pruning is the only ordinary evidence deletion exception. No public/table CRUD is granted to anon, authenticated, service_role, scheduler, Auth service or either Storage worker.

The migration additively replaces `private.ramadan_submit` only: the frozen request now requires `payment_access_secret` (32 random bytes encoded as 64 lowercase hex), creates its hashed capability in the same admission transaction and returns `payment_access_id`. The canonical idempotency hash binds the whole request, including the secret; replay returns the same access identity and immutable quote. Changed secret or payload conflicts. There is no legacy capability adoption/backfill: a pre-capability Sponsorship uses authorized admin assistance. There is no RSP-only private lookup.

## Public capability and HTTP contract

Normal routes:

- `/kempen/[slug]/tajaan` — existing schedule/checkout; success now contains the accepted item quote, trusted bank instructions, upload action and copyable secure link.
- `/kempen/[slug]/tajaan/bayaran#<access_id>.<access_secret>` — fragment is removed immediately before exchange; the secret is never sent in a query/path or server GET.
- `POST .../bayaran/akses` — exact `{access_id, access_secret}`, JSON only, 1 KiB maximum, same origin. Server generates the session secret and exchanges through `public_ramadan_payment_exchange`.
- `POST .../bayaran/hantar` — exact multipart `amount`, `payment_date`, `file`, `idempotency_key`, `expected_reference`. The RSP reference is only a stale-tab consistency check, never authorization.

Cookie: `__Secure-ramadan-payment`; HttpOnly, Secure, SameSite Strict, exact campaign payment path, 20-minute lifetime. It authenticates one Ramadan payment context, never an admin account or Qurban capability. Expired/revoked/invalid/cross-campaign access denies neutrally. Lost-link recovery is admin assistance; no public identity matching/reissuance.

The safe scoped context contains only `reference`, `currency`, `total_minor`, accepted `items`, and `proof_status` (`none` or `submitted`). It contains no payer contact, Storage identity, access secret, admin data or another sponsorship. Server responses/pages are dynamic/private/no-store/noindex/no-referrer/nosniff; payment pages also prohibit embedding and arbitrary document execution through CSP. No localStorage/sessionStorage/IndexedDB or URL query persistence.

The public success retains the approved instructions:

> Pendaftaran tajaan anda telah diterima. Sila buat bayaran mengikut jumlah yang tertera dan muat naik bukti pembayaran untuk semakan pihak masjid.

> Bukti pembayaran yang dihantar belum bermaksud bayaran telah disahkan. Slot tajaan hanya akan diberikan selepas bayaran disahkan dan kekosongan slot disemak.

## File validation and submission

One JPEG, PNG or PDF, maximum **10 MiB**. Multipart streams have an absolute 10 MiB + 64 KiB limit before parsing; exact field keys deny duplicates/unknown fields. Amount parsing uses exact integer minor units, positive up to the existing Ramadan technical bound of 1,000,000,000,000 minor units. Declared date is explicit finite calendar date, no future date according to DB time in Asia/Kuala_Lumpur. Optional transaction-reference collection is omitted to avoid unnecessary data.

The stateless existing byte validator is reused through a Ramadan error wrapper, not Qurban business records: PNG chunk CRC/decompression bounds, JPEG marker/frame/scan/end structure, PDF object/xref/root/end structure. Actual content, allowlisted MIME and extension must agree. Original filename is ephemeral validation input only; never stored or used in object/download identity. File SHA-256 and normalized format/size are checked again on bounded Storage readback. No uploaded HTML/SVG, OCR, document execution or arbitrary external resources.

Transaction/Storage sequence:

1. Validate bytes before creating an intent.
2. Private prepare checks Foundation actor for assistance or the exact participant session, shared flag locks, Ramadan campaign lock, campaign/Sponsorship rows, then idempotency. Same request returns the same immutable intent or committed result; changed request conflicts. At most three live pending intents per Sponsorship.
3. Server uploads once to an immutable unique key with upsert disabled, then bounded readback verifies exact SHA/size/content. Ambiguous duplicate upload may reuse only exact matching bytes.
4. Private commit rechecks authorization/eligibility/lease/one-open-proof and exact Storage metadata, then atomically writes proof + structural submission audit. Public wrappers recheck their session after the transaction helper.

Lock order: Foundation actor for manager operations → shared global/module flag namespaces/rows → `ramadan:<campaign>` advisory lock → campaign → Sponsorship → idempotency/intent. It is compatible with reviewed Ramadan management/new submission. A committed replay creates no duplicate proof/audit. Competing keys may create pending upload intents, but only one committed submitted proof can win.

**Storage and PostgreSQL are not one atomic service transaction.** An upload followed by DB failure/crash may leave an intent-owned object; a failed upload leaves a bounded pending intent without a committed proof/audit. Retries are exact/idempotent, never overwrite evidence. Production orphan reconciliation, abandoned-intent retention, malware scanning, provider/edge abuse protection and retention/deletion are future operational/security gates. This phase does not claim malware scanning or impossible cross-service rollback. Before deployment, provider ingress/multipart limits must also be checked against the reviewed 10 MiB plus overhead contract; current proof is local Node runtime evidence.

## Exact runtime Storage credential model

Separate role: `ramadan_proof_storage_worker` (NOLOGIN, NOINHERIT, NOBYPASSRLS), bucket `ramadan-payment-proofs` (PRIVATE, allowlisted types, 10 MiB). No Qurban objects/capabilities/policies are reused or changed.

The server consumes **only** a pre-issued JWT in `RAMADAN_PROOF_STORAGE_TOKEN`, role-limited, issuer-bound to configured Supabase, audience authenticated, maximum one hour. The application has **no signing key and no service_role client/key**. The transport exposes only exact object POST/read, not arbitrary DB commands, listing, signing, transform, update or deletion. The worker has no private schema usage or raw business table privilege. Its sole private EXECUTE is the fixed-search-path boolean Storage authorization predicate, called by Storage RLS.

The JWT alone cannot access proof bytes. An independent `x-ramadan-storage-token` must match a live exact-object pending intent or a current five-minute manager download grant. Upload nonce domain is `ramadan-storage:` and cannot authorize Qurban. Download grants bind the Foundation actor and real Auth session; revoked/disabled actor/session fails the Storage predicate. File paths/worker tokens/nonces never enter normal browser DTOs.

This follows [Supabase custom Storage roles](https://supabase.com/docs/guides/storage/schema/custom-roles) and [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), verified against current docs/changelog; the pinned local Storage operation guard remains unchanged for Qurban. Issuance/rotation of externally issued worker tokens is a deployment operations gate; no hosted configuration is performed here.

## Protected evidence review

| Capability | Staff | Admin | Super admin |
| --- | --- | --- | --- |
| Minimal `none/submitted` proof status | Yes | Yes | Foundation-authorized |
| Amount/date/source/file metadata | No | Yes | Foundation-authorized |
| Assisted upload | No | Yes | AAL2 + recent TOTP |
| Proof attachment download | No | Yes | AAL2 + recent TOTP |
| Verify/reject/assign/receipt | Unavailable | Unavailable | Unavailable |

Existing staff Sponsorship masking remains intact; no hidden proof metadata or payer email/phone JSON is delivered. Management detail adds a separate status-only or manager evidence projection.

Protected endpoints under `/admin/api/campaigns/[id]/ramadan/proofs/[sponsorship]`:

- GET — `admin_ramadan_proof_detail`, role-masked at DB boundary.
- POST multipart — `admin_ramadan_proof_prepare` + same Storage validation + `admin_ramadan_proof_commit`; source `admin_assisted_upload`, current Foundation actor DB-recorded.
- POST `/download`, exact JSON `{proof_id}` — require this Sponsorship/campaign/proof and fresh Foundation manager authorization, mint `admin_ramadan_proof_download` grant, validate a bounded buffered file (at most 10 MiB), then return exact bytes as attachment. Filename is opaque RSP + RPF reference + normalized extension, never name/contact.

Download access writes `payment.proof.downloaded` when authorization/grant succeeds; it records authorized access, not a guarantee that a network client finished receiving bytes. Submission events are `payment.proof.submitted` and `payment.proof.admin_submitted`. No PII, claimed amounts, raw payloads, paths, secrets, filename, bytes or WhatsApp conversation is copied into audit. Generic Campaign audit remains unchanged. Bulk ZIP is not added in this phase.

## Repeatable local review and selective cleanup

Run from repository root. Only the disposable `mtu-admin-local` loopback stack and local Docker context are accepted. No real transfer or actual payer PII.

```powershell
node scripts/admin-foundation/local-cli.mjs start
node scripts/ramadan-management/review-fixture.mjs setup
node scripts/ramadan-payment/review-fixture.mjs
node scripts/ramadan-management/serve.mjs
```

Open `http://localhost:3082/kempen/local-ramadan-review/tajaan`. Submit a synthetic mixed fixed/open sponsorship, save the secure payment link, then upload a synthetic file from `.cache/ramadan-review-proofs`. Try JPEG, PNG and PDF on different submissions; only one submitted proof per Sponsorship. The local operator runner issues a one-hour scoped worker token and renews it atomically every 45 minutes in ignored `.cache/ramadan-review-storage-token.json`. The running development server re-reads this bounded pre-issued credential per Storage request, so renewal does not restart the app or discard an in-memory retry. The file source requires development mode, the exact local Supabase URL, local environment and localhost:3082 origin; production continues using only the externally pre-issued environment token. No signing material enters the application runtime. If the runner dies or renewal fails, expiry still fails closed. Never share/copy the credential file. A safe manual local renewal, without database changes, is:

```powershell
node scripts/ramadan-payment/review-token.mjs renew
```

To restart, stop only this checkout's `serve.mjs` process tree and rerun `node scripts/ramadan-management/serve.mjs`. Do not run setup, cleanup or reset merely to renew access. Existing demo records and manifest ownership are preserved. The 20-minute participant session is independent: reopen the saved secure link if the session expired.

In another terminal:

```powershell
node scripts/ramadan-management/review-browser.mjs admin
# Separately, inspect the masked/read-only reviewer:
node scripts/ramadan-management/review-browser.mjs staff
node scripts/ramadan-management/review-fixture.mjs inspect
```

Admin: Pendaftaran Tajaan → Butiran tajaan → Semak Bukti Pembayaran → Muat turun bukti. On another Sponsorship without proof, upload via the admin-assisted form. This is normal Foundation authorization using explicit synthetic local identities, not a production login/MFA bypass.

Stop the local review server and reviewer before cleanup:

```powershell
node scripts/ramadan-management/review-fixture.mjs cleanup
# Safe repeat:
node scripts/ramadan-management/review-fixture.mjs cleanup
```

The prewritten manifest + DB root fingerprints prove owned campaign/flags/Auth graph. Cleanup first validates the entire SQL deletion transaction with rollback and freezes child evidence fingerprints. It verifies every present owned Storage object's exact identity, metadata, size and byte hash before deleting any. Unknown/mismatched objects refuse cleanup. After selective object deletion, one newly validated DB transaction checks the same graph and removes audit/download grants/proofs/intents/sessions/access before sponsorship parents. Guards are disabled only by the local migration owner for named owned fixture rows inside that transaction and restored before commit. No runtime/public/admin hard-delete or broad listing/deletion bypass.

Cross-service cleanup is **Storage first, DB second**, not globally atomic. A partial Storage failure retains DB/manifest ownership for safe retry; concurrent graph changes refuse DB cleanup. Repeat after successful cleanup is a no-op. Unmanifested/legacy fixture data is never adopted. Full disposable reset remains an explicit fallback after reviewing local data:

```powershell
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed
```

The eight known unrelated Qurban synthetic orphan backing files are preserved, not adopted or deleted. No runtime cleanup touches them.

## Future 10.2b — not implemented

Authorized admin verification must compare claimed amount with the immutable aggregate quote exactly, inspect submitted evidence, and atomically admit **all** fixed items through deterministic earliest-free slots or none. OPEN_AMOUNT consumes no slots. Payment can become verified and one immutable RAM receipt issued only with full successful capacity admission. Offering/schedule deactivation after acceptance is not itself a rejection condition. No force override, partial approval/allocation, automatic refund or waitlist. Future controlled rejection/resubmission retains old proof attempts/files. Existing Qurban verification/receipts remain isolated and unchanged.

## Verification evidence

2,059 unique automated cases passed; reruns excluded. This includes 1,257 isolated contracts/upgrade/regression cases, 724 predecessor real PostgreSQL/Auth/Storage cases, 32 Ramadan evidence end-to-end cases (including four responsive widths), one selective Storage-cleanup case, 37 predecessor browser cases and eight native Qurban receipt inspections. TypeScript, lint, production Webpack, generated public type parity, bundle/secret/PII scans, documentation links and diff checks passed. Fresh local chain: 16 migrations; all 15 canonical historical files byte-identical. Cleanup evidence proved zero operational/Auth/Storage-metadata rows; the eight known unrelated orphan backing-file hashes remained unchanged. Evidence is under `.cache/ramadan-102a` (ignored synthetic artifacts). No hosted behavior is claimed. Any later owner-review fixture is separately initialized and must not be confused with the verified clean baseline.

## Owner upload failure investigation — 18 October 2026

The recorded review runner started at 11:06 UTC (19:06 MYT) and issued its worker once. Its one-hour worker therefore expired at 12:06 UTC (20:06 MYT). Owner attempts at 13:20–13:23 UTC created pending intents but zero Storage objects, proof rows or proof audits. Historical HTTP logs show registration/capability/context success and both participant/admin upload HTTP 503. The old process was no longer running when inspected; it was not possible to recover its live environment. A controlled reproduction with a correctly signed token at the recorded issuance time reproduced HTTP 503 `unavailable` and the sanitized server diagnostic `storage_worker_expired`, before Storage POST or proof commit. This corroborates expiry as the upload failure, rather than a missing verification feature or registration failure. No secret/token/cookie is included in evidence.

The correction is local runner renewal only; the one-hour transport checks, private Storage RLS, proof immutability/idempotency and production credential model remain intact. Upload UI now explicitly says proof could not be submitted and keeps the request for safe retry. Automated browser coverage expires the local worker, asserts visible failure/no committed proof/object, renews without restart, retries the exact frozen multipart request, and proves one proof/one submission audit. JPEG, PNG and PDF succeed through the real public browser flow; admin downloads match exact SHA-256 and staff receives 404/minimal projection. Amount mismatch remains evidence only. Responsive success/admin screenshots cover 375/430/768/1440. Owner demo data is retained; this investigation performs no cleanup/reset. The previously documented no-business-data reset evidence remains separate.

Additional test entry points (repository root):

```powershell
node --import tsx --test scripts/ramadan-payment/storage-token.test.ts
$env:RAMADAN_REVIEW_RECOVERY='1'
node --import tsx --test scripts/ramadan-payment/upload-recovery-local.test.mjs
```

The second command requires the already-owned fixture and running local review runner. It appends synthetic review sponsorships/proofs and checks existing sponsorship fingerprints; it never runs setup, reset or cleanup. Its records remain under the existing manifest for an explicitly requested later selective cleanup. Evidence: `.cache/ramadan-102a-upload-recovery`.

Final investigation verification: **2,075 unique candidate cases** have passing evidence (2,059 preceding candidate cases plus eight new token-boundary and eight new live recovery cases; reruns excluded). This investigation reran **1,273 cases**: 1,265 isolated Ramadan/Qurban/Campaign/Foundation contracts and upgrade regressions, plus eight non-destructive real browser/Auth/Storage/HTTP cases. Earlier real/full-reset and selective-cleanup evidence remains retained separately; no destructive full reset/lifecycle suite was rerun against the active owner demo. TypeScript, lint, production Webpack, generated public type parity, 301-chunk bundle scan, 71-document/455-link checks and diff checks passed again. All 15 previous migration hashes and all eight protected orphan file hashes remain identical.

## Owner-approved 10.2a checkpoint

Owner manually retested sponsorship registration and proof upload successfully and approved the resolved review-worker expiry issue. Verification remains intentionally unavailable; 10.2b is NEXT / NOT STARTED, 10.3 NOT STARTED and Fasa 10 overall IN PROGRESS. Checkpoint: `phase-10.2a-ramadan-payment-proof`.

Final closeout reran **1,273 unique cases** (1,265 isolated contracts/domain/upgrade/predecessor cases and eight real browser/Auth/Storage/HTTP recovery/intake cases). **802 prior real/cleanup/browser/PDF cases** remain retained from the unchanged approved implementation, giving **2,075 unique cases overall**, with reruns excluded. Additional live private-bucket/anonymous/worker/Qurban-isolation and Foundation staff/admin/super_admin AAL2/recent-TOTP smoke checks passed. TypeScript, lint, production Webpack, generated public type parity, bundle/security/PII scans, documentation links and diff checks passed again. All fifteen historical migrations remain byte-identical; the local chain contains sixteen migrations. Non-document implementation hashes are unchanged from the owner-approved candidate.

At closeout preflight the existing local stack was already empty; owner explicitly confirmed that the earlier demo had been cleaned before this task. No reset or cleanup was performed during finalization. A new ownership-manifested synthetic fixture was created for the requested live tests and retained afterward. No unrelated object or record was adopted/deleted. The eight known Qurban orphan backing-file hashes remain unchanged. Earlier no-business-data/reset evidence is separate from this retained final review fixture. Evidence: `.cache/ramadan-102a-checkpoint` (ignored). No generated files, secrets, credentials, local token files or review-cache artifacts are included in Git.
