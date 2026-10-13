# Fasa 8.0 — local prototype verification

13 October 2026 (+08:00). **Fasa 8.0 complete / owner-approved — architecture and local UX prototype checkpoint.**

Owner confirms manual testing and approval of both the participant/payment-proof dummy flow and volunteer flow as the current MVP direction. This is owner-reported acceptance, separate from automated verification below. Prototype remains non-persistent and is not production registration.

Preflight canonical local/remote main: `abdcd9b929b2d705a9add07fc799f94a8eb6d10b` / `phase-7-campaign-engine-complete`; no newer pushed refinement was present. All approved uncommitted refinement files were preserved. Final checkpoint: `phase-8.0-qurban-architecture-prototype` (resolve tag for commit). Owner authorises canonical main/tag push without force; no deployment, hosted service work or 8.1 implementation.

## Verified story and scope

Owner selects participant or volunteer registration → enters invented information →
reviews it → submits a dummy → sees a memory-only reference → resets/reloads.
Participant success additionally demonstrates Bank Islam details → synthetic proof
selection → dummy proof submission → Menunggu pengesahan admin. Volunteer success
shows the official WhatsApp-group reminder with a clean unconfigured fallback.
There is no registration API or database path to test in 8.0. The network boundary is
intentionally absent; introducing one would violate this phase's scope.

Both source files were reopened locally during the initial 8.0 work; they were not
reopened again for this refinement. Bank details and revised decisions come directly
from the owner feedback in this task. The plan records source findings and
distinguishes proven 2026 data from proposed rules. No real participant/contact/
volunteer records were imported into source, browser fixtures, screenshots or logs.
The source PDF was visually inspected in a temporary render outside the checkout;
the original PDF/workbook were never modified.

## Results

| Check | Observed result |
| --- | --- |
| Final browser suite | **13/13 passed** in Edge/Chromium, rerun for the final owner-approved checkpoint. |
| Actual compiled server-page gate | **18/18 passed**: 8 actual page-gate cases, 8 optional group-URL cases, 2 actual volunteer-success markup cases (configured/absent group). Development + exact `1` only; production denied even with flag. Page UI imports stubbed; success rendering uses actual components with a success-state stub and performs no navigation. |
| Enabled HTTP request | Actual local **200**. |
| Flag removed + server restarted | Actual local **404**, no prototype form content, noindex present. |
| Existing offline Campaign Engine contracts | **71/71 passed**: management, public projection/gating and editorial contracts. |
| TypeScript | `tsc --noEmit` passed after framework-generated local route types existed. |
| Targeted lint | Passed for next.config, prototype TSX and all review scripts. |
| Whitespace | `git diff --check` passed. |
| Canonical preflight | Original checkout clean; local main, origin/main and live GitHub main all matched the Fasa 7 baseline. No newer approved/pushed work to overwrite. |
| Docs / links / scope | **79 local links** passed; 2 owner-lock/status docs, 8 config keys, exact 12-file allowlist, all 6 unchanged migrations and empty production registry confirmed. |

No production build/deployment or hosted Supabase/Sanity/Vercel checks were run.
Production denial is verified by execution of the compiled page guard, not a claim
of a deployed production-route test. The 71 contracts are a scoped regression run,
not a rerun of the historical 864-test full Fasa 7 suite. No DB/RLS security claims
are made for an unimplemented Qurban persistence layer.

## Scenario coverage

Participant:

- One Qurban participant; three mixed participants (two Qurban, one Aqiqah); seven participants.
- Applicant different from every participant, optional email and contact details only once.
- Add/remove/re-add retains the correct remaining names and fresh card identity.
- Empty applicant/name/phone/address, short phone and invalid optional email show errors.
- Empty participant name and missing attendance show errors; error summary receives focus.
- Missing akad leaves review disabled; removing consent after returning from review blocks it again.
- Attendance Ya/Tidak/Belum pasti, optional same-cattle preference and truthful request wording.
- Review arithmetic RM880, RM2,640 and RM6,160; purposes and attendance preserved.
- Review → edit → review → dummy success → reset, and successful-submission refresh clearing state.
- Keyboard activation, stable focus after add and error-summary focus.
- HTML-shaped dummy participant name renders as text, never markup.

Volunteer:

- Volunteer only: name, phone, optional email and shirt size; no task-preference controls, availability/time field, group/cattle field or WhatsApp consent checkbox.
- Tidak/Ya participant question. Ya reveals exactly one additional text field: Nama peserta Qurban/Aqiqah. Missing name for Ya shows a visible error.
- Name is informational user-supplied text only; no FK/link/identity verification. Selecting Tidak clears it, and reselecting Ya shows an empty field.
- Request observer confirms zero requests (including local lookup GETs) while selecting Ya and entering the informational name after assets settle.
- Missing basic fields/shirt size show errors. XL and informational name survive review.
- Success/reference and official WhatsApp-group reminder. Default has no link and shows both owner-requested fallback sentences.
- Configured HTTPS group setting passes through the page and renders the exact CTA; invalid protocol/domain/credentials/query settings fall back safely. This branch was rendered locally in isolation; no external invite was opened.
- Reset and refresh clear form state. No participation/payment prerequisite or task assignment.

Bank-transfer / proof dummy:

- Exact Bank Islam, 1227 0010 0045 60 and MASJID TALHAH BIN UBAIDILLAH details; three-share amount RM2,640.
- No payment-method selector or payment-gateway CTA. Registration success initially says Menunggu bayaran.
- JPEG, PNG and PDF selections are synthetic in-memory buffers supplied directly to the browser, with no receipt fixture written to disk. Filename/type are safely shown as text.
- Proof dummy submit changes only current UI state to Bukti pembayaran diterima untuk semakan / Menunggu pengesahan admin; it never indicates verified funds.
- Replacing the file clears the submitted indication; unsupported text/plain is rejected with a visible error and disabled submit. HTML-shaped filename remains text, no injected image.
- No FileReader, file-content read, object-URL preview, request or storage path in the component. No real upload or proof content is logged.
- Refresh removes registration reference and proof UI/state; reset unmounts the proof form. Explicit non-upload/non-storage warning stays visible.

Both participant and volunteer flows ran at **375, 430, 768 and 1440px**.
Horizontal overflow assertions pass at landing, form, review, payment/proof success and volunteer success boundaries.
Screenshots were visually reviewed for labels, spacing, stacking, readable summaries,
source akad and demo/reference warnings. This is targeted keyboard/accessibility
coverage; it does not claim a screen-reader audit or real-device Safari verification.

## Privacy and non-persistence evidence

Browser probes observe requests throughout participant and volunteer flows:

- No POST/PUT/PATCH/DELETE or other mutation request.
- No request to an external origin; observed page/asset reads remain on loopback.
- No uncaught browser page errors.
- No localStorage/sessionStorage writes; both stores remain empty in fresh test contexts.
- No cookies; no IndexedDB databases after enabled prototype flows.
- Reload loses submitted results, proof selection and entered values. Reset mounts fresh form state.
- No proof data/file bytes are sent or written; only synthetic filename/type appear in screenshots.

Static checks reject persistence/network/integration calls in the client component.
No Supabase/Sanity service is imported by the review route. No production adapter,
descriptor, seed, API, storage bucket, payment persistence or receipt file is added. Existing production registry
remains frozen/empty; existing contract tests confirm that boundary.

Next 16.3.6 initially created `__next_debug_channel` IndexedDB for framework debug
metadata. A temporary development-and-flag-only next.config condition disables
`experimental.reactDebugChannel` and the dev indicator. Final privacy assertions
pass with that condition. Framework packages were not patched. Source inspection
also found stale field errors after edits; targeted error clearing fixed that UX
and the final suite includes its regression assertion.

The initial closeout browser rerun passed 12/13; the validation test attempted to clear email before the existing next-frame error-summary focus completed, leaving the previous email value. Explicit focus/value assertions stabilise this test without changing prototype UX. Three focused repetitions and the final full suite verify the correction.

During initial 8.0 work, the first browser attempt failed on sandbox loopback access. Tests were rerun with the
server/browser permitted to use the local listener. Earlier failure artifacts were
moved into ignored `.cache/qurban-review/earlier-test-results`; they contain invented
test inputs only. Final verification output is in ignored root `test-results`.

## Files and screenshots

Exact checkpoint files relative to repository root (reviewed prototype intentionally included):

- README.md
- docs/ROADMAP.md
- docs/QURBAN-MVP-PLAN.md
- docs/QURBAN-PROTOTYPE-VALIDATION.md
- next.config.ts
- scripts/qurban-prototype/gate.test.mjs
- scripts/qurban-prototype/playwright.config.ts
- scripts/qurban-prototype/review.spec.ts
- scripts/qurban-prototype/serve.mjs
- src/app/%5F%5Freview/qurban/page.tsx
- src/app/%5F%5Freview/qurban/prototype.css
- src/app/%5F%5Freview/qurban/prototype.tsx

The four documentation files were edited for the final decision lock. The browser validation test also gained explicit focus/value assertions to wait for the existing deferred error-summary focus before clearing email; prototype UX/source remains unchanged. All other files preserve the approved development prototype/refinement. No reset, overwrite or rollback of newer approved work. Package/lock files, all six historical migrations, engine registries, generic DTOs, Sanity schemas and protected admin routes remain byte-unchanged from the canonical baseline. No new migrations, descriptors, adapters, APIs, buckets or hosted resources.

Ignored screenshots, .cache, test-results, .next and the node_modules junction are not checkpoint content. No real PII, proof bytes or hosted credentials are included.

Screenshots (absolute checkout root is
`C:\Users\User\Documents\ChatGPT\game mewarna\qurban-review`):

- `.cache/qurban-review/landing-1440.png` — desktop choices.
- `.cache/qurban-review/landing-375.png` — mobile choices.
- `.cache/qurban-review/participants-1440.png` — three mixed participants and source akad.
- `.cache/qurban-review/participants-375.png` — mobile participant cards and consent.
- `.cache/qurban-review/review-430.png` — mobile final review and RM2,640 arithmetic.
- .cache/qurban-review/payment-proof-375.png and payment-proof-1440.png — Bank Islam panel, synthetic file metadata, dummy submission response.
- .cache/qurban-review/volunteer-revised-375.png, -430.png, -768.png, -1440.png — revised basic form; 375/430 include the conditional informational participant name.
- .cache/qurban-review/volunteer-success-375.png, -430.png, -768.png, -1440.png — success and unconfigured WhatsApp-group reminder.

Older volunteer-768.png / volunteer-1440.png screenshots are superseded initial-8.0 artifacts; use volunteer-revised-* for this owner review.

Screenshots are ignored QA artifacts with synthetic data; none is a real submission.

## Run locally for owner testing

The local server was restarted with the flag enabled and left running for owner manual testing. To start it again if needed:

```powershell
Set-Location 'C:\Users\User\Documents\ChatGPT\game mewarna\qurban-review'
$env:QURBAN_PROTOTYPE='1'
node scripts/qurban-prototype/serve.mjs
```

Open `http://127.0.0.1:3080/__review/qurban`. Use rekaan data only. Choose either
workflow, complete the review and submit dummy. For Qurban, select a synthetic JPEG/PNG/PDF and submit dummy proof; for volunteer, inspect the group reminder. “Isi borang baru” resets it. Refresh also
clears state. Ctrl+C stops the server. The launcher binds only to 127.0.0.1 and
supplies fictional Sanity config solely to satisfy existing Next configuration;
no hosted environment files or credentials were copied.

Reproduce checks while the enabled local server runs:

```powershell
node node_modules/@playwright/test/cli.js test -c scripts/qurban-prototype/playwright.config.ts
node --test scripts/qurban-prototype/gate.test.mjs
node --import tsx --test scripts/campaign-engine/public-contract.test.ts scripts/campaign-engine/management-contract.test.ts scripts/campaign-engine/public-editorial.test.ts
node node_modules/typescript/bin/tsc --noEmit
```

To reproduce HTTP denial, stop the server, remove `Env:QURBAN_PROTOTYPE`, restart
the launcher and request the same URL. It returns 404. Do not deploy this development
prototype. Fasa 8.1 is next / not started and must be a separate task.

## Final owner decision lock

Resolved: **Capacity Policy B** (verified payment + atomic eligibility; neither registration nor proof submission reserves), applicant/wakil attendance yes/no/unsure, checkbox akad MVP with exact version/reference + accepted timestamp + immutable fingerprint/snapshot and no typed/drawn/electronic signature, annual configuration structure with currency and integer minor-unit money, and initial least-privilege RBAC. Minimal registration status is submitted/cancelled, separate from campaign lifecycle and payment state.

Preserved decisions: Bank Islam transfer only (1227 0010 0045 60, MASJID TALHAH BIN UBAIDILLAH), website proof and authorised admin manual verification, no gateway; simplified volunteer form without task/time/WhatsApp-consent controls, informational participant name only, later admin assignments and optional group URL/reminder. No automatic identity matching/linkage.

**Excel .xlsx operational/audit snapshot export is a formal Fasa 8.3 requirement.** Database stays authoritative; downloaded edits never update it. Protected server/admin generation, full PII export defaults to super_admin + admin, no unrestricted staff/public export or hidden bulk browser data. Initial sheets: Ringkasan, Pendaftaran, Peserta, Sukarelawan, Format Audit / Legacy View. Fasa 9 adds Bayaran/Resit and verified financial data. No export implementation here.

Remaining future details: actual annual year/Hijri/price values and final approved annual akad wording (launch gates), overflow/refund/waitlist/payment exceptions, allocation/reassignment/cancellation rules, exact staff masking, data/audit retention periods, Fasa 9 private-proof storage/validation/retention, receipt numbering/policy and final volunteer admin task vocabulary. RM880 remains 2026 fixture only; no future price is invented/seeded. Policy B and the MVP acceptance mechanism are resolved, not open.

8.4 can build capacity/allocation structure and protected operations; final payment-qualified eligibility depends on Fasa 9 verified payment and an atomic capacity check. A full campaign must never silently confirm an extra participation. **8.1 has not started; stop after the approved 8.0 checkpoint.**
