# Fasa 5.3B UI / language / compact-QR refinement

## Fasa 5.3B — completed
4 October 2026 (+08:00). Checkpoint: `phase-5.3b-lecture-draft-persistence`.
The first real October snapshot is persisted only as
`drafts.lectureMonth-2026-10`: 30 dates, 34 sessions, 29 original portraits.
Draft revision: `SSdKRdF7e0XIFT3zzNP2ab`; published settings revision:
`chGo6kzbOkh09ebDsGFF22`.

The actual authenticated Studio **Save Draft** button was physically exercised
without content edits. It validated and read back the identical payload, reported
**Draft saved — no changes needed**, and performed no update/upload. Reopening
Studio loaded exactly the same poster. Manual saving is now operational through
the authenticated Studio client, with schema validation, original-asset reuse,
optimistic revision guards, exact read-back and visible saved/conflict/error states.
No autosave. Publish Jadual remains disabled with no handler.

Loading precedence remains draft → published → locally generated rules.
Monthly snapshots preserve Penceramah name/photo/topic and rule references.
Only showInfaq is stored per month; approved mosque-wide compactQr is resolved
from published siteSettings, without branded primaryQr fallback. Public donation
QR, NCR and unrelated published content remain unchanged.

Final inventory: 1 draft, 0 published lecture documents, 0 lectureSpeaker,
0 lectureRule, 85 image assets, 1 Program, 0 Announcement, 1 News.
Real October accessibility now says draft/review, while genuine fixtures retain
demo labels. Poster artwork stays Malay; Studio operations stay English-first.
Desktop/mobile, fresh actual PNG/PDF exports and conflict simulation pass.

The original failed/corrupted first-save plan and guard audit remain immutable.
Six approved Unicode corrections restored fingerprint
`906611b8069b1c07b105da950be4f6b7cedd6d1a79a5357e912faee6e3264bb8`.
No production mutation occurred before correction. The original first execution
record remains historical evidence; this closeout supersedes its unset generic
Studio approval gate. GPL/provenance notices and the unresolved combined-application
licensing decision remain intact. Public /kuliah and homepage lecture integration
have not started.

[Final Studio save and validation evidence](LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.md).

## Implementation / refinement record before execution (historical)

4 October 2026 (+08:00). Local implementation and fresh QA completed; awaiting
owner review. **No production upload/write, first lecture Save Draft, publication,
commit or push.** Publish Jadual remains disabled. Baseline:
27e23a2528c72144a1fe7e0d5ecbd45dc3343912 / phase-5.3a-lecture-generator-ux.

## Weekday alignment

Before: text anchor used the column centre and fixed baseline y=223, without
compensating for glyph overhang/cap-height. After: measure each uppercase label's
painted bounds after browser fonts are ready, centre its ink horizontally and
vertically inside the same pill. On this Windows browser the cap ascent is 20,
descent 0, so baseline becomes y=225 and top/bottom ink padding is 4 poster units.

Arial Black / Arial fallback, size 27, weight 900, letter spacing -1.1, pill y=201,
height 28, pink fill and seven-column geometry remain unchanged. No smaller font.
SELASA, KHAMIS and JUMAAT fit without clipping and have symmetric side padding.
The shared SVG carries the measured positions into PNG and PDF exports.

## Operational language

Studio navigation: Calendar / Penceramah / Recurring Rules / Settings.
Instructions, form labels, helpers, loading/save/conflict/validation messages,
recurrence and image controls use English-first wording. Examples: Selected date,
Special program poster, Choose poster, Poster fit, Poster position, Remove poster,
Restore from rules, Show Infaq panel, Save Draft, Unsaved changes, Draft saved and
Revision conflict. Schema option labels use separate English editor arrays.

Penceramah, Infaq, Kuliah, Subuh, Maghrib, Tazkirah, Jadual and Masjid remain natural
domain terms. Poster weekdays, headings, session names, dates/months and Infaq
copy remain Malay. No source schedule/name/topic translations or editorial changes.

## Compact QR source and renderer

Minimal optional field: **siteSettings.donationInfo.compactQr**.
Image with asset reference and required alt (max 300), square PNG/JPG/WebP,
hotspot disabled, any crop/hotspot metadata rejected. Old settings remain valid.

Authenticated runtime resolves published siteSettings.donationInfo.compactQr only. Missing,
unusable, non-square, cropped or unresolved image configuration omits Infaq with a
warning and leaves the month usable. Authentication/network/query errors remain
visible failures. A settings draft alone cannot activate the panel.

Public donationInfo.primaryQr stays byte/reference/copy-identical:
image-6ba112c3ffc0107ea20e277aa11ff0729eba926b-853x853-png.
No public read-layer/component changes. No branded artwork fallback; no Dapur QR.
Only lectureMonth.showInfaq is stored, never QR copies or merged-cell geometry.

Original: C:/Users/User/Downloads/qr masjid mtu.png, 853 × 853 PNG, 1,480,205 bytes.
SHA-1: 46cfd9cd56c2bdf6ad48cf6bdba8e83cc6f41ba8.
SHA-256: 1b86b6336223e38fb103f23368cafae07cb0c1ea66e5a3bc1bb53b9eb6ed792d.
Proposed asset ID:
image-46cfd9cd56c2bdf6ad48cf6bdba8e83cc6f41ba8-853x853-png.
It is not present remotely and has not been uploaded. Local review reuses the
byte-identical approved QR-only file, with no resizing/re-encoding/reconstruction.

QR remains left, text right. Square contain/meet preserves every edge and quiet
zone; no crop, overlay or recolour. QR geometry cap increased from 100 to 116
poster units with 8-unit white clearance. Adaptive placement retains minimum two
genuine no-date cells, largest group, leading tie preference, no date displacement
and centred maximum three-cell content width.

July (2-cell) and October (3-cell) exports render a 101-unit square: approximately
286 px at 3508 × 2480 or 24.2 mm on A4 landscape. March noncompact (6-cell group,
six rows) renders 80 units / about 226 px / 19.2 mm, capped by row height. The code
now occupies the whole image square instead of being a small part of branded
artwork. Rendering size, square/quiet-zone preservation and output composition
were checked; an actual phone/bank-app scan or printed-paper scan is not claimed.

## Ordered production prerequisites — all awaiting approval

1. Approve [complete compact QR/settings draft plan](LECTURE-COMPACT-QR-DRY-RUN.json):
   production project 2o95jmms; upload exactly one original QR; create exactly
   drafts.siteSettings. Draft absent; published base revision
   SSdKRdF7e0XIFT3zzGU8xL. Preserve every field and add only donationInfo.compactQr
   with the proposed asset reference/alt. Drafts 0 → 1; images 55 → 56.
2. Authenticated read-back, Studio review, then separately approve controlled
   siteSettings publication. No lecture changes in that setup batch.
3. Refresh production guards/inventory and approve the exact October month plan:
   create drafts.lectureMonth-2026-10 with null draft/published base revisions;
   30 real-date entries, 34 source-backed sessions, 29 original portrait uploads,
   no speaker/rule document creation and no demo special-poster migration.
   Monthly payload/fingerprint unchanged; showInfaq=true only.
   After prerequisite publication: drafts 0 → 1 and images 56 → 85;
   published lecture documents remain 0.
4. First Save Draft remains blocked until that exact approval. No autosave.
   Missing compact QR is safe (omit/warn), but setup is necessary for the desired
   approved Infaq output. The old month fingerprint does not approve new QR scope.

[Complete month payload and all portrait hashes](LECTURE-FIRST-SAVE-DRY-RUN.json).
Source recommendation/provenance and historical October QA remain unchanged.
Fresh guard differences must stop execution before any upload/action.

## Fresh verification evidence

- Lint, production build, diff check, enforced local schema extraction pass.
  First build timed out on a Sanity /galeri query; retry passed without changing
  error/fallback behavior.
- All 187 tests pass: recurrence/manual overrides, two-session limit, schema,
  serialization/create/update/conflicts, dirty month switches, snapshots, same
  asset reuse, missing/malformed QR, public content/homepage outage/malformed
  regressions, language and weekday painted-bound tests.
- Authenticated Studio: desktop 1440 and mobile 375, no horizontal overflow;
  keyboard date selection works; Calendar-first controls and disabled Publish
  remain intact. Live missing-compact-QR warning is correct.
- Isolated no-Sanity fixture: 2/3/6-cell cases, original compact QR, real browser
  PNG/PDF exports. All three full PNGs and all three rendered PDF pages reviewed.
  Preview/export use shared renderer; no fake production content.
- Production build: six public routes plus Studio return 200; 27 script chunks
  healthy; /kuliah remains 404. Current-state verification fingerprint unchanged:
  7fc9e5a0b248b2350576b9c291cd7ccf49d895d6ebfff5e48ce819328c7692ce.
- Authenticated before/after complete settings, ID/type/revision inventory and
  asset hash/size/type comparison is identical: 0 drafts, 0 lecture documents,
  45 published non-assets, 55 images, 1 Program, 0 Announcement, 1 News.
  No production upload/write occurred.

Screenshots and export proofs are under:
C:/Users/User/Documents/Codex/2026-10-02/files-pasted-by-the-user-mtu/outputs/

- refinement-studio-desktop.jpg / refinement-studio-mobile.jpg
- refinement-compact-qr-desktop.jpg / refinement-compact-qr-mobile.jpg
- refinement-poster-2-cell.png / .pdf
- refinement-poster-3-cell.png / .pdf
- refinement-poster-large-group.png / .pdf
- refinement-schema.json, refinement-all-tests.log, refinement-build.log,
  refinement-current-state.log, phase-5.3b-final-production-smoke.json,
  phase-5.3b-refinement-before.json / phase-5.3b-refinement-after.json

Owner previews:
http://127.0.0.1:3002/studio/penjana-jadual-kuliah (authenticated, real empty state)
and http://127.0.0.1:3022/draft-review (local-only compact QR fixture).

Historical Fasa 4.3/October/GPL notices remain unchanged. D18 combined-application
licensing decision is unresolved; no new upstream implementation copied. Fasa
5.3B remains uncommitted and no subsequent phase has started.


## Historical implementation file list before operational closeout

Includes the prior persistence implementation and this requested refinement.
37 repository files; no commit or push:

- README.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md
- docs/LECTURE-GENERATOR-UX-RECOVERY.md
- docs/PROJECT-JOURNEY.md
- docs/PROJECT-STATE.md
- docs/ROADMAP.md
- docs/SANITY-CONTENT-MODEL.md
- docs/SANITY-LECTURE-GENERATOR.md
- package.json
- sanity.config.ts
- scripts/lecture-generator/lecture-generator.test.mjs
- src/sanity/lecture-types.ts
- src/sanity/schemaTypes/lectureMonth.ts
- src/sanity/schemaTypes/lectureRule.ts
- src/sanity/schemaTypes/lectureSpeaker.ts
- src/sanity/schemaTypes/siteSettings.ts
- src/sanity/tools/lecture-generator/InteractiveLecturePoster.tsx
- src/sanity/tools/lecture-generator/LectureGeneratorTool.tsx
- src/sanity/tools/lecture-generator/LecturePoster.tsx
- src/sanity/tools/lecture-generator/export-poster.ts
- src/sanity/tools/lecture-generator/generator.module.css
- src/sanity/tools/lecture-generator/index.tsx
- src/sanity/tools/lecture-generator/local-poster.ts
- src/sanity/tools/lecture-generator/model.ts
- src/sanity/tools/lecture-generator/poster-layout.ts
- docs/LECTURE-COMPACT-QR-DRY-RUN.json
- docs/LECTURE-DRAFT-PERSISTENCE.md
- docs/LECTURE-FIRST-SAVE-DRY-RUN.json
- docs/LECTURE-UI-COMPACT-QR-REFINEMENT.md
- scripts/lecture-generator/draft-persistence.test.mjs
- scripts/lecture-generator/refinement.test.mjs
- src/sanity/tools/lecture-generator/StudioLectureGenerator.tsx
- src/sanity/tools/lecture-generator/draft-approval.ts
- src/sanity/tools/lecture-generator/draft-persistence.ts
- src/sanity/tools/lecture-generator/month-document.ts
- src/sanity/tools/lecture-generator/useDraftWorkflow.ts
