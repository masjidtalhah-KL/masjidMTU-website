# Fasa 9.0 — Qurban Payment Proof Intake + Private Evidence Storage

**Fasa 9.0 complete / owner-approved — Payment Proof Intake + Private Evidence Storage. Fasa 8 COMPLETE / owner-approved. Fasa 9 in progress; 9.1 next / not started.**

Owner reviewed and approved the current implementation on 17 October 2026 (+08:00), with no additional functional changes. Checkpoint: `phase-9.0-qurban-payment-proof` (resolve tag for commit).
Baseline: `05132eacaa7a76baec1ff0c990ecca7cacc66495`, tag `phase-8.5-qurban-volunteers`.
Additive migration: [20261016151108_qurban_payment_proof_intake.sql](../supabase/migrations/20261016151108_qurban_payment_proof_intake.sql).
The 11 earlier migrations remain unchanged. Owner authorises the approved 9.0 checkpoint commit, tag and canonical main/tag push without force. No hosted mutation/deployment is authorised. Stop after checkpoint; do not begin 9.1.

## Owner decisions and scope

Bank transfer only: **Bank Islam · 1227 0010 0045 60 · MASJID TALHAH BIN UBAIDILLAH**.
Participant uploads through the website. An authorised admin may upload the same evidence on the participant's behalf after WhatsApp/counter/physical assistance. No conversation/contact metadata is retained and there is no mark-paid-without-proof shortcut.

Owner approved the section 13 security decision: **pre-issued Storage-only custom-role JWT with single-bucket RLS; no runtime service_role or JWT signing key**.
Owner also approved proof intake for an **existing submitted Registration after the registration window closes**, provided both flags remain ON, the current campaign is supported/valid and it is not archived. This does not reopen new registration admission. Proof intake uses its own existing-registration capability; it does not depend on public discovery/visibility or an open registration window. Cancellation/archival/flags OFF deny intake.

9.0 implements intake/evidence/downloads only. No verification, rejection, payment-qualified allocation, receipt, refund, waitlist or gateway is implemented. `submitted` proof means **Bukti dihantar**, never paid/verified. Policy B is unchanged: registration and proof submission create **zero allocations** and reserve no capacity.

## Payment-access capability and secure link

The existing frozen/idempotent public registration request additively requires `payment_access_secret`: 32 independent cryptographically random browser bytes encoded as 64 lowercase hex characters. It is independent of registration idempotency and QBN. The atomic registration command inserts one `qurban_payment_access` row and returns its random UUID `payment_access_id`; only SHA-256(secret) is stored. The canonical request fingerprint binds the secret without persisting its plaintext. Same-key exact replay returns the same access ID/reference. Changing the secret under the same key conflicts.

The browser builds `/kempen/[slug]/bayaran#<access_id>.<access_secret>`. This is an explicitly private bearer link: anyone holding it can submit proof for that one registration. The success screen provides an ordinary anchor and a user-initiated copy control. It is not placed in a query string or sent to the server in the navigation URL. No analytics or browser storage is used. Browser extensions, clipboard managers, malicious same-origin scripts and screenshots are outside fragment confidentiality; the link must be kept private.

On payment-page hydration the fragment is captured and removed immediately with `history.replaceState`, then exchanged by same-origin bounded POST `/bayaran/akses`. Server creates a fresh 32-byte scoped session secret, stores only its hash, and sets `__Secure-qurban-payment`: **HttpOnly, Secure, SameSite=Strict, exact campaign payment path, 20 minutes**. It is not an Auth/admin account. A new saved link is exchanged even if an older payment cookie exists. At most ten live sessions per access capability; expired sessions can be pruned by the narrow exchange command. A fresh fragment-free navigation with no valid session contains no registration data.

Long-lived access secret is never persisted plaintext or logged. Session cookie necessarily contains its separate scoped bearer secret; DB stores only its hash. Neither secret enters localStorage/sessionStorage/IndexedDB, generic audit, query parameters or proof metadata. No QBN-only PII lookup/recovery endpoint exists. Lost-link fallback is authorised admin assistance. There is no automated recovery or legacy capability backfill.

## Public context and routes

`public_qurban_payment_context(slug, session_secret)` returns exactly:
`reference`, `participant_count`, `currency`, `price_per_share_minor`, `total_minor`, `proof_status` (`none | submitted`).
No applicant/participant names, phone, address, email, file path, hash, financial verification, receipt, cattle coordinates or admin data.

The page is dynamic/private/no-store/noindex/no-referrer/nosniff. A route-specific CSP denies objects, framing and external connections; scripts/styles retain the allowances required by the current Next runtime. Unsupported/wrong/expired access has a neutral unavailable/denied response. Operational failures are sanitized. QBN alone is never authorization.

`POST /kempen/[slug]/bayaran/akses`: exact JSON `{access_id, access_secret}`, <=1 KiB, no query parameters, exact `application/json`, same-origin browser checks. Response `{ok:true}` plus scoped cookie; never reflects secrets.

`POST /kempen/[slug]/bayaran/hantar`: exact multipart fields `amount`, `payment_date`, `idempotency_key`, `file`, `expected_reference`. The HTTP response contains only `proof_reference`, `status: submitted`, `submitted_at`, `amount_mismatch`.

## File validation and amounts

One JPEG/PNG/PDF, **1 byte–10 MiB inclusive**. Multipart is read with a hard streaming bound of 10 MiB + 64 KiB before form parsing; duplicate/unknown fields fail. Original filename/MIME are ephemeral hints only and must agree with validated actual format; they are never persisted.

Server validates actual bytes: JPEG frame/scan/marker/end structure; PNG signature, chunk bounds/CRC, dimensions, bounded zlib scanlines/filter structure; PDF header, objects, xref/startxref/root/end structure. Normalized extension/type is jpg/image/jpeg, png/image/png or pdf/application/pdf. Hash is SHA-256 of exact bytes. This is bounded structural validation, **not full semantic decoding, malware scanning, OCR or a guarantee a document is harmless**. HTML/SVG/executables, empty/truncated/corrupt/mismatched/oversized evidence are rejected. Files are downloaded as attachments, never embedded or transformed by this application.

`amount` is an exact decimal string converted through integer/BigInt arithmetic to bounded minor units; no floating-point financial authority. `payment_date` is an explicit ISO date. DB validates real/nonfuture dates against `clock_timestamp()` in Asia/Kuala_Lumpur; `submitted_at` is separately server-owned. No EXIF/PDF metadata date inference.

A mismatched declared amount is retained for review and visibly warned about. It is never verified in 9.0. Immutable quote remains the registration's original obligation; current campaign edits cannot reprice it.

## Private model and immutable evidence

All six tables are private, RLS enabled, zero permissive table policies, no raw runtime CRUD:

| Table | Purpose |
| --- | --- |
| qurban_payment_access | One random capability ID + secret hash per Registration; same-campaign FK |
| qurban_payment_sessions | Hashed scoped session, server lifetime |
| qurban_proof_intents | Immutable attempt identity/content/amount/date/source/actor; key/payload/token hashes; pending storage lease |
| qurban_payment_proofs | Committed attempt, only submitted status/version 1; same-campaign composite FK |
| qurban_payment_audit | Immutable minimized structural intake/download events |
| qurban_proof_download_grants | Short-lived hashed per-object download grants bound to Foundation actor/session |

Intent-generated object key is `<campaign UUID>/<registration UUID>/<intent UUID>.<normalized extension>`; never PII, original filename or bank account. Reference is opaque `PFP-` + two random UUID hex components. One submitted proof per registration is enforced by a unique partial index and registration row lock. A second participant/admin-assisted upload cannot replace it. The evidence attempt's amount/date/source/actor/hash/type/size/object identity and committed submission remain immutable; a future correction after rejection must be a new attempt.

Only an uncommitted intent's server storage lease can be renewed for an exact retry. No normal production update/delete evidence command exists. Storage worker has no UPDATE/DELETE permission. Cancellation with an active proof fails with a safe operational conflict; file/proof/history/slot are not deleted/released/refunded. Proof-free registration cancellation preserves the previous allocation guard and approved rules.

## Exact runtime Storage credential/security decision

Runtime setting: server-only `QURBAN_PROOF_STORAGE_TOKEN`. This is a **pre-issued custom-role JWT**, <=1 hour lifetime, role `qurban_proof_storage_worker`, expected issuer/audience, signed outside application runtime. Application never receives its signing key or a reusable service_role/secret-key client. An expired/missing credential fails closed. The app decodes claims only as a configuration guard; the Storage service verifies the actual JWT signature/expiry before applying RLS. Provisioning/rotation/distribution before a hosted launch remains an operations gate; this task changes local configuration only.

Worker is NOLOGIN/NOINHERIT/NOBYPASSRLS, no private-schema USAGE, no business table CRUD/public business RPC execution. Grant to the trusted authenticator permits Storage SET ROLE. Only Storage-schema SELECT on the dedicated bucket and SELECT/INSERT on objects are granted. RLS additionally requires:

- exact private bucket `qurban-payment-proofs`;
- exact Storage operation upload or authenticated get; no list/sign/S3/transform/update/delete;
- a separate hashed per-intent/per-download nonce in `x-qurban-storage-token`;
- exact server-generated object identity;
- unexpired pending intent plus still-eligible registration for intake, or current active manager/session plus unexpired object download grant.

The worker JWT **alone** does not grant object access/listing. A narrow fixed-search-path SECURITY DEFINER boolean policy helper performs only this predicate; EXECUTE is granted only to worker. No private schema is exposed. App transport is fixed Storage REST fetch, not a general-purpose Supabase business client. RLS grants are necessary but cannot inspect bytes during Storage's permission simulation, so trusted server validation precedes upload and readback verifies exact size/hash/format before business commit.

Compromise of worker JWT alone cannot read arbitrary objects or write business records. Compromise together with a live scoped nonce allows its matching object operation; compromise of the entire application can exercise the narrowly authorized server paths. It is not a claim of immunity to server compromise. Bucket is PRIVATE, 10 MiB/allowed-type restrictions, no public policy. An unauthorised listing may return an empty array rather than HTTP 403; data remains unavailable.

Alternatives reviewed and rejected: runtime service_role/general secret key (broad DB bypass); runtime signing key (can mint privileged roles); generated S3 access pair (all-bucket RLS bypass); borrowing admin sessions for accountless visitors; public anon direct upload (can bypass application byte validation); extra external storage broker/provider or anonymous Auth accounts (unreviewed architecture expansion). Current primary references: [Storage custom roles](https://supabase.com/docs/guides/storage/schema/custom-roles), [access control](https://supabase.com/docs/guides/storage/security/access-control), [S3 authentication](https://supabase.com/docs/guides/storage/s3/authentication). Local Storage v1.41.8 was exercised with real requests.

## Idempotency and cross-service consistency

Proof request uses a new independent 32-byte random key, frozen with fields/file in UI memory for ambiguous retry. Prepare locks the trusted actor context, flag/campaign/registration state in the reviewed order, validates evidence, and stores key hash + canonical payload hash bound to registration/source/actor. Same key/same evidence returns same intent/result; changed metadata/file hash conflicts. At most three live pending intents per registration, 15-minute leases. No raw request/filename is retained. Local PostgreSQL uses log_statement=ddl and log_parameter_max_length_on_error=0; public business RPC parameters are not intentionally logged. Any hosted logging setup must preserve this no-body/no-token policy; hosted configuration was not changed.

Prepare -> immutable unique-key Storage POST (upsert false) -> exact bounded readback/hash validation -> DB commit. On ambiguous upload failure, only exact existing bytes can be reused. DB commit rechecks eligibility/source/actor/one-open rule and exact Storage metadata, then atomically inserts proof + one domain audit. Commit failure rolls both DB rows back; same request can retry. Concurrent same-key requests commit once; different keys compete for the single open-proof constraint.

**Storage and Postgres are not one transaction.** Pending intent may survive failed upload; uploaded file may survive failed/crashed DB commit; a lost browser request key after refresh can leave an orphan pending attempt. No unsafe automatic deletion/overwrite is performed. Production orphan reconciliation, leased-intent retention/quotas, antivirus/content scanning and edge rate limiting are explicit later operations/Fasa 11 gates. Bounds/idempotency/scoped access do not replace edge abuse protection.

## Protected admin and downloads

Bayaran tab exposes bounded deterministic 20-row pages (max 50), exact reference/manager prefix name/phone search and proof-status filter. Manager detail shows original quote, declared amount/date/source/submission/reference and mismatch warning. Admin-assisted upload uses exactly the same file/amount/idempotency/storage/commit pipeline, records the actual Foundation actor, and never assigns payment trust.

| Capability | Public | Staff | Admin | Super admin |
| --- | --- | --- | --- | --- |
| Own scoped context/intake | Valid payment capability only | No privilege from staff role | Assisted upload | Assisted upload + Foundation MFA/recency |
| Proof status projection | Own minimal context | QBN/registration status/proof status only | Full operational projection | Full + Foundation checks |
| Financial details/file/path | No proof download | Denied | Protected downloads | Protected + MFA/recency |
| Intake/download audit | None | Denied | Protected structural activity | Protected structural activity |
| Verify/reject/receipt | Unavailable | Unavailable | Unavailable | Unavailable |

Every download rechecks current Foundation manager/session/MFA authorization. A short 5-minute hashed object grant is bound to actor/session; Storage RLS also checks active profile/current role/session existence. Individual downloads are server-mediated, byte/hash checked, attachment/nosniff/private/no-store. Filename is `<full QBN>__proof-<opaque PFP>.<ext>`, no names/contact. No permanent signed URL, storage path in ordinary browser JSON, public URL or participant download endpoint.

Bulk ZIP is real streamed OOXML-independent ZIP, campaign scoped, deterministic safe filenames and immutable evidence bytes. **Max 50 files / 100 MiB per batch**. Server reads/validates one bounded proof into memory at a time and streams archive output; browser receives only an explicitly requested download. If more, `X-Qurban-Next-Cursor` enables the next deterministic batch; no silent truncation. Each batch selects one DB snapshot; new submissions can appear in later batches. No persistent ZIP/public object is created. Download audit records authorized access/grant issuance, not a claim that a remote user finished saving/printing the bytes. Failed/aborted network transfer may therefore still have an access audit event.

## Audit

Actions: `payment.proof.submitted`, `payment.proof.admin_submitted`, `payment.proof.downloaded`, `payment.proof.bulk_downloaded`.
Only campaign/registration/proof/actor UUIDs, source, bounded file count and server timestamp. Submission audit is unique per committed proof. Composite ownership prevents mismatched campaign/registration evidence. No names/phone/email/address/amount/file path/original filename/bytes/raw body/token/WhatsApp data; generic Campaign audit unchanged. No unrestricted raw-diff audit.

## Seven-sheet protected Excel snapshot

`Ringkasan`, `Pendaftaran`, `Peserta`, `Sukarelawan`, `Susunan Lembu`, `Bayaran`, `Format Audit - Legacy View`.
The protected export's same materialized SQL statement/MVCC snapshot includes payment evidence; no independent follow-up read. Existing snapshot fingerprint/completion audit binds all inputs. Bayaran columns: Bil, No. Rujukan QBN, Rujukan Bukti, Nama Pemohon, Jumlah Sepatutnya, Jumlah Dilaporkan, Tarikh Bayaran Dilaporkan, Sumber, Status Bukti, Tarikh Bukti Dihantar. No binary/path/URL/verification/receipt. PII export remains manager-only; staff denied. Existing ExcelJS 4.4.0 remains generator. JSZip 3.10.2 is now an exact direct dependency for bounded server ZIP generation (previously transitive).

Ringkasan adds active registrations with/without submitted evidence; these are intake counts, not paid/unpaid/verified. Legacy `Tarikh Bayaran` remains blank. Existing allocation/volunteer metrics remain separate. User content is typed text and formula-leading values remain inert. The workbook is a read-only point-in-time snapshot, never a DB import mechanism.

## Repeatable local owner/AJK review

Run from the repository root. Only the disposable `mtu-admin-local` stack and local Docker endpoint are allowed. Existing owner/untracked data is never automatically reset or adopted.

```bash
node scripts/admin-foundation/local-cli.mjs start
node scripts/qurban-registration/review-fixture.mjs setup
node scripts/qurban-payment/review-fixture.mjs files
node scripts/qurban-registration/serve.mjs
```

Open `http://localhost:3082/kempen/local-qurban-review`, register synthetic participants, copy the secure link, transfer no real money, select a generated synthetic file and submit proof. Reopen the saved link to confirm pending intake status. The local launcher pre-issues a Storage-only JWT in memory and passes only that limited token to Next; restart launcher after one hour. No signing key is passed to application runtime or written to .env.

In a second terminal:

```bash
node scripts/qurban-admin/review-browser.mjs admin
```

The synthetic reviewer launcher is local evidence only; it does not weaken normal app/DB auth and is not genuine Google/MFA testing. Open the owned Qurban campaign -> Bayaran. Submit a separate registration without proof, upload a synthetic file via admin assistance, inspect source, download individual proof / ZIP / seven-sheet Excel. Staff reviewer may inspect minimal status only. Local generated proof paths are printed by the files command, contain synthetic bytes only, and are ignored by Git.

Stop app/reviewer browser before cleanup. No in-flight upload may race the demo cleanup.

```bash
node scripts/qurban-registration/review-fixture.mjs inspect
node scripts/qurban-registration/review-fixture.mjs cleanup
node scripts/qurban-registration/review-fixture.mjs cleanup
```

Manifest + exact parent DB fingerprints are checked by a rollback dry-run before Storage deletion. The Storage child independently proves the same manifest/intent graph; exact object identity, metadata and SHA-256 bytes must match. Any unmanifested/mismatched object in the fixture namespace refuses deletion. Objects outside that namespace are preserved. Only exact owned keys are removed via the supported local Storage API, never raw storage.objects DELETE or filesystem guesses. Local operator credential is test/tooling only; production worker has no DELETE.

After objects are gone, a second ownership/intent-fingerprint check precedes one atomic dependency-ordered DB cleanup: download grants -> payment audit -> proofs -> intents -> payment sessions/access -> existing volunteer/allocation/registration graph -> owned parents/Auth/flags. Guards are disabled/re-enabled only inside this local validated fixture transaction. No production HTTP/admin hard-delete endpoint exists. Repeat calls are safe no-ops.

Cross-service cleanup is **not globally atomic**: a failed object-delete can leave some bytes removed and DB evidence retained; retry uses unchanged manifest and tolerates missing objects. DB ownership change/concurrent intent creation fails closed. If a previously authorized upload outlives the stopped demo process, reconciliation is an explicit operator task; never claim transactionality across services. Legacy/untracked/pre-manifest fixture data is refused. Explicit fallback for the entire disposable stack only:

```bash
node scripts/admin-foundation/local-cli.mjs db reset --local --no-seed
```

Do not automatically invoke this fallback over owner data. A DB reset does not promise erasure of already-orphaned Storage backing files: run proven selective cleanup first. Orphans whose manifest/DB fingerprints have already been lost must remain refused by selective tooling and require a separately reviewed local storage-volume/reconciliation operation.

## Verification evidence

Focused automated suites are in `scripts/qurban-payment/`: DB/ACL contracts, exact file/money validation, seven-sheet workbook inspection, real PostgreSQL/Auth/PostgREST/Storage/admission/idempotency/concurrency/download/ZIP/browser/cleanup tests. Ignored `.cache/qurban-90/` contains logs, synthetic JPG/PNG/PDF, ZIP, actual xlsx, responsive screenshots and final counts. Final test totals/checks are recorded after the complete regression run; no pending check is claimed passed.

## Explicit 9.1 contract — not implemented

Only authorised admin/super_admin verifies/rejects. Verification requires declared amount **exactly equals the immutable quoted total**, with no force bypass. Future transaction must lock financial verification context, verify eligible payment, atomically admit the complete eligible participant set through trusted capacity allocator and issue immutable receipt. Insufficient capacity rolls back financial verification and all allocation/receipt work; proof remains pending/action-required. No partial allocation, automatic refund or automatic waitlist. Proposed receipt `QUR-<campaign_year>-000001`; exact numbering/storage/state/retention/exception/release implementation belongs to 9.1 and later reviewed gates.

## Exact additive DB surface

New functions (all fixed empty search_path; only the policy predicate and public wrappers are SECURITY DEFINER):

- `private.qurban_proof_hash`
- `private.qurban_payment_guard`
- `private.qurban_proof_cancellation_guard`
- `private.qurban_payment_registration_payload_valid`
- `private.qurban_payment_available`
- `private.qurban_payment_session_registration`
- `private.qurban_payment_exchange`
- `private.qurban_payment_context`
- `private.qurban_proof_payload_valid`
- `private.qurban_proof_result`
- `private.qurban_proof_prepare`
- `private.qurban_proof_commit`
- `private.qurban_storage_authorized`
- `private.qurban_payment_list`
- `private.qurban_proof_download`
- `private.qurban_payment_activity`
- `public.admin_qurban_payment_list`
- `public.admin_qurban_proof_download`
- `public.admin_qurban_payment_activity`
- `public.public_qurban_payment_exchange`
- `public.public_qurban_payment_context`
- `public.public_qurban_proof_prepare`
- `public.public_qurban_proof_commit`
- `public.admin_qurban_proof_prepare`
- `public.admin_qurban_proof_commit`

Replaced current definitions in this new migration only (historical migration files untouched): `private.qurban_registration_submit`, `private.qurban_admin_export_snapshot`.

Named explicit indexes: `qurban_payment_sessions_access`, `qurban_proof_intents_registration`, `qurban_one_open_proof`, `qurban_payment_proofs_campaign`, `qurban_payment_submission_audit`, `qurban_payment_audit_page`, `qurban_proof_download_expiry`. Primary/unique/composite keys also generate their constraint indexes. Six per-table evidence guards plus the Registration cancellation guard are added; no old trigger is removed. Bucket/object RLS has exactly three worker policies (bucket read, scoped object INSERT, scoped object SELECT). Grants: four public capability RPCs to anon+authenticated; five protected admin RPCs to authenticated, with Foundation authorization inside; policy predicate EXECUTE to worker only. All six private tables revoke raw privileges from PUBLIC, anon, authenticated, service_role, supabase_auth_admin, authenticator, campaign_scheduler and worker. No private schema USAGE/runtime helper grant.

### Observed local reset/orphan limitation

An early synthetic test failed the exact parent-fingerprint cleanup check and used the explicit disposable DB-reset fallback. Later read-only inspection found eight backing files under that retired test campaign namespace, while Storage API metadata/business rows were zero. They contain synthetic test bytes, remain private/unreachable by all runtime grants, and are not adopted/deleted after manifest/DB evidence was lost. This is concrete evidence that DB reset is not cross-service file erasure. Subsequent manifest-owned selective cleanup is tested against actual bytes and removes current objects before DB cleanup, preserving unrelated objects. Final DB/API no-fixture counts are reported separately from this retained legacy backing-file limitation. Production orphan reconciliation/retention and any local volume-wide cleanup need an explicit reviewed operational procedure; no broad filesystem/delete bypass is added.

### Local reset health recovery

Enabling Storage exposed a pinned CLI 2.78.0 post-restart gateway 502: migrations/business reset completed and Storage internal health was good, while the local gateway retained a stale upstream connection. The local CLI wrapper can recover **only** that exact post-restart error after independently proving all migration versions, empty operational/Auth/object tables, the one descriptor/private bucket, local Docker endpoint and service health. If Storage alone is 502 while Auth/REST are healthy, it restarts only the verified mtu-admin-local API gateway, then requires all three HTTP services healthy. Unknown errors, failed migrations, nonempty data, wrong schema, nonlocal/production context or failed health checks remain failures. This is local process lifecycle tooling, not an application credential/API or a hosted operation.

### Same-campaign multi-tab session binding

The public upload form freezes expected_reference from its safe context. Before any intent/object write, server resolves the incoming scoped cookie and requires its immutable Registration reference to match. QBN is only an expected-context check, never authorization or a caller-selected stored identity. Opening a different saved payment link in another tab can replace the campaign-scoped cookie; the stale first tab then receives a safe conflict and creates no intent/proof/audit. The session-to-capability-to-registration relationship is immutable, and the DB transaction rechecks that same fixed session and its eligibility. Admin-assisted upload instead uses its explicit protected Registration route and retains the exact four-field multipart contract. No extra public lookup/identity endpoint is introduced.

## Final approved candidate verification — 17 October 2026 (+08:00)

**1,568 unique automated cases passed; reruns excluded.**

| Final counted group | Passed |
| --- | ---: |
| Offline SQL/contracts/upgrades/workbooks including 67 new payment cases | 886 |
| Real payment PostgreSQL/Auth/PostgREST/Storage/HTTP/browser/concurrency/cleanup | 62 |
| Prior real volunteer / allocation / admin / domain / registration / production gates | 166 |
| Real Campaign Engine / Admin Foundation | 429 |
| Isolated real selective cleanup | 1 |
| Public participant browser / review prototype browser | 24 |
| **Total** | **1,568** |

Final TypeScript, zero-warning lint, production Webpack build, real generated public-type parity, 287 production browser-chunk secret/PII/fixture/server-import scans, 67 documentation files / 437 local links and git diff --check passed. All 11 previous migration native SHA-256 hashes remain unchanged. Public proof form/success and admin list were checked at 375/430/768/1440; saved screenshots are under .cache/qurban-90/. The final payment suite also exercises same-campaign two-tab cookie replacement, rejecting a stale form before any evidence write.

Actual seven-sheet workbook: .cache/qurban-90/payment-proof-workbook.xlsx (snapshot: 3 registrations, 4 participants, 2 proof submissions; all Legacy payment dates blank). Actual ZIP: .cache/qurban-90/proof-download-test.zip (exact-byte/hash matching synthetic PNG/PDF). Synthetic file artifacts: .cache/qurban-90/synthetic-proof.jpg, .png, .pdf. No real financial/person records were used.

Final DB/API state verified read-only after the completed browser no-seed reset and the final ownership-proven payment cleanup: descriptor=1, application adapter=1, private proof bucket=1; campaigns/flags/registrations/participations/akad/consents/volunteers/allocations/payment capabilities/sessions/intents/proofs/audit/download grants/Auth fixture users/Storage object metadata=0. The eight retained legacy backing files described above are separate; this is not a claim of physical-volume erasure.

An additional redundant reset was rejected by automatic approval review because a broad reset could erase owner data; it was not executed. Independent read-only checks of all 32 operational/Auth/Storage tables and stopped review servers verified the already completed reset/cleanup state instead. No approval rejection was bypassed. At that pre-approval verification, no hosted operation, commit, push or tag had occurred and all canonical refs remained at the 8.5 baseline. Owner has now approved Fasa 9.0 and authorised its checkpoint commit/tag/push. The known eight unmanifested synthetic orphan backing files remain untouched and unadopted. No broad deletion bypass or 9.1 implementation is included.

### Owner-approved checkpoint final checks

After owner approval, 886 offline contracts/SQL/upgrades/workbook cases and all 62 real payment PostgreSQL/Auth/PostgREST/Storage/HTTP/browser/concurrency/cleanup cases were rerun successfully. These are reruns within the 1,568 unique cases above, not additional cases. Prior Qurban/Campaign/Foundation and public/prototype regression evidence remains green for the unchanged approved runtime implementation. TypeScript, zero-warning lint, production Webpack, generated-type parity, all three browser bundle scans, documentation links and historical migration hashes were rechecked. No functional change was requested or made during closeout.

The final payment suite used a proven-empty disposable local DB and ownership-proven selective cleanup, with no additional reset. Read-only inspection again confirms zero fixture/business/Auth/Storage metadata rows, descriptor=1, and exactly eight retained unmanifested synthetic backing files with runtime access denied. None was adopted or deleted; no broad deletion bypass was added. All review/test servers were stopped. Fasa 9.0 is complete / owner-approved; Fasa 9 remains in progress and 9.1 next / not started.
