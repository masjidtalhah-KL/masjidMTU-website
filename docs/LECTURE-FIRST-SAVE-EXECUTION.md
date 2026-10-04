# Fasa 5.3B — controlled compact QR setup and first October draft

This execution is complete; October remains an unpublished draft awaiting owner
review. It is not a phase checkpoint. No commit or push occurred.

## Approval and immutable audit

The original approved dry-run failed its fingerprint guard because six Unicode
fields had become mojibake. Actual failed-plan fingerprint:
`4619c0893237ec71003f5e0e8c8698251eb091bce98c603348f5bda94815731a`.
The failed plan and guard report remain unchanged; the failed plan file SHA256 is
`5e0c1826f1b9bab2fc2cafe94d555710ecd0b77bb541cc92db4d3eaec531095a`.
No production upload, mutation or publication occurred before correction.

The owner explicitly approved the corrected candidate as the replacement execution
payload. Its restored original fingerprint is
`906611b8069b1c07b105da950be4f6b7cedd6d1a79a5357e912faee6e3264bb8`.
The exact U+2019 apostrophes round-trip without normalization:

| Field | Approved value |
| --- | --- |
| 3 October, session 2 topic | `AL-QUR’AN` + newline + `& TAJWID` |
| 10 October, session 1 speakerName | `UST K. NI’MAT` |
| 10 October, session 1 photo.alt | `Potret UST K. NI’MAT` |
| 24 October, session 1 speakerName | `UST MUHD MU’IZZ` |
| 24 October, session 1 photo.alt | `Potret UST MUHD MU’IZZ` |
| 25 October, session 1 topic | `KITAB MATLA’` + newline + `AL-BADRAIN` |

## Executed scope

Target remained `2o95jmms / production`. Before Stage 1: zero drafts/lecture
records and 55 images. Published settings base revision matched
`SSdKRdF7e0XIFT3zzGU8xL`. Original QR SHA1/SHA256 and all settings fields matched
before upload. Exactly one compact QR asset was uploaded unchanged, a settings
draft was created/read back/schema-validated, and only settings were published.
Published settings revision is `chGo6kzbOkh09ebDsGFF22`.
Asset: `image-46cfd9cd56c2bdf6ad48cf6bdba8e83cc6f41ba8-853x853-png`.
SHA256: `1b86b6336223e38fb103f23368cafae07cb0c1ea66e5a3bc1bb53b9eb6ed792d`.
Only `donationInfo.compactQr` changed; primaryQr/NCR/all other fields match exactly.
The public homepage still displays the full branded QR; NCR telephone links match.

Stage 2 fresh guards confirmed absent draft/published October targets, the exact
corrected fingerprint, owner backup hash and all 29 original portrait hashes.
29 original WebP assets were uploaded, zero existing portraits reused. Every asset
ID, SHA1, SHA256, byte count and dimensions matches the plan. The connector created
exactly `drafts.lectureMonth-2026-10`, revision `SSdKRdF7e0XIFT3zzNP2ab`, at
`2026-10-04T04:42:03Z` / `2026-10-04T12:42:03+08:00`.
Authenticated exact read-back verifies 30 date entries / 34 sessions / showInfaq.
All portraits resolve; no speaker/rule documents, demo data or embedded monthly QR.
The empty 31 October cell is rendered from calendar geometry, not a fabricated entry.

Final raw inventory: 143 documents including 85 images, 1 October draft,
0 published lecture documents, 0 lectureSpeaker, 0 lectureRule, 1 Program,
0 Announcement, 1 News. All unrelated revisions are unchanged.

## Verification and limitations

Both persisted payloads pass real local schema validation: zero errors/warnings.
Enforced schema extraction, lint, live-Sanity production build, current public
contract verification, 188 automated tests and diff whitespace validation pass.
The restricted-network build exercised explicit outage fallback; a subsequent
network-enabled build passed against live Sanity without fallback warnings.
Public homepage and five public routes return 200; Studio returns 200;
public /kuliah remains absent (404). Outage/malformed and recurrence/persistence
regressions pass. Initial CLI absolute-path extraction was rejected before output;
relative-path extraction succeeded without schema changes.

Real authenticated Studio shows Draft saved / 34 sessions, approved date/weekday
placements and Penceramah snapshots. Desktop 1440/mobile 375 QA passes, with no
horizontal page overflow. Compact QR uses the leading three no-date cells.
Refresh and independent reopen load identical poster text; final authenticated
month/settings/inventory revisions are unchanged after QA. Studio remains
English-first and poster Malay. Actual Studio exports passed visual inspection:
3508×2480 PNG and one-page A4 landscape PDF, with all portraits/QR present.
The browser download-event observer timed out; the actual downloaded original
files and export success state were verified directly, without regenerating them.

Existing accessibility text still describes the poster as a demo despite real
saved content. This wording issue is recorded, not silently altered in this task.
The generic Studio first-write gate/copy remains unchanged: execution used the
owner-approved exact batch through the authenticated Sanity connector. The UI
save service's concurrency contract remains unit-tested; this execution does not
claim that the generic UI physical save handler was exercised in production.
Publish Jadual stays disabled. No lecture publication or future scope was enabled.

[Approved replacement](LECTURE-FIRST-SAVE-APPROVED.json),
[immutable guard failure](LECTURE-FIRST-SAVE-GUARD-FAILURE.json),
[original failed dry-run](LECTURE-FIRST-SAVE-DRY-RUN.json),
[complete execution/assets/verification record](LECTURE-FIRST-SAVE-EXECUTION.json).
