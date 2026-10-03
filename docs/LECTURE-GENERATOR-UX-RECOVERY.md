# Fasa 5.3A — Calendar-first Lecture Generator checkpoint

Status: **Fasa 5.3A completed, owner-approved 4 October 2026 (+08:00)**.
Checkpoint: `phase-5.3a-lecture-generator-ux`; resolve the tag for the final commit.
Baseline: `f4b473b1df54af695599a735a1fb2d1c5d9fd372`, tag `phase-5.2b-first-news`.
No production lecture migration, Sanity assets/drafts/publication, public `/kuliah` or
homepage lecture feed is included. The owner authorized the Git closeout checkpoint only. Save Draft and
Publish remain disabled; lecture document types remain read-only/hidden in Studio.

## Source reviewed and feature matrix

Fresh review of remote `main` on 3 October 2026 (+08:00):
[`378b1bbb4084b4f7b6c55ac70a5c4f769d221d28`](https://github.com/masjidtalhah-KL/JadualKuliahBulanan/tree/378b1bbb4084b4f7b6c55ac70a5c4f769d221d28).
The remote SHA equals the earlier renderer reference, but was checked afresh.
Inspected LICENSE, README, app-core.js, app-ui.js, profile.js and editor/export styles.
The canonical baseline actually has a separate miniature calendar and a static
main poster. The requested recovery makes the **main poster itself** editable;
it does not merely replace an existing dropdown.

| Feature | Legacy main | Studio 4.2A baseline | 5.3A decision |
| --- | --- | --- | --- |
| Click real poster date | Yes; click and Enter/Space | Separate mini-calendar; poster static | Adapt: native HTML buttons over the real SVG cells |
| Selected-day editor | Slot/event modes, explicit per-form save/cancel | Immediate in-memory session edits | Keep live preview; add clear sessions/poster modes and selected-date heading |
| Recurring rules | Every/nth weekday; explicit apply | Same core rule choices | Keep UTC calendar calculation and manual preservation |
| Manual override | changedDays plus banners preserved on apply | isManualOverride; cleared dates preserved | Keep; special poster is a one-date manual visual override |
| Maximum two sessions | Yes, conflict checks | Yes | Keep, reject third session before state replacement |
| Restore | Confirmed day restore; destructive whole-month reset also available | Day restore, previously without confirmation | Adapt explicit inline confirmation for one date; defer whole-month reset |
| Speaker library | Name/topic/photo copied into slots; reusable library | Reusable names/topics, active flag, demo portraits; snapshot schema already exists | Keep active/inactive selection; renderer honors existing name/photo snapshots when supplied |
| Special/event artwork | Full and mixed modes | Absent | Add full only; defer mixed |
| Poster fit | Contain/cover; banner defaults cover; uploads resized/re-encoded | Portrait fit only | Adapt full-bleed cover default, contain alternative, crop warning and vertical alignment; original raster bytes retained |
| Reuse artwork | Banner refs/inline art; no dedicated reused-poster picker | Absent | Simple previously-used poster picker; same source/hash reused across dates |
| Monthly persistence | Browser localStorage workspace/profiles; JSON backup | React state per month, lost on reload | Keep local review semantics; design authenticated Studio draft lifecycle for 5.3B |
| PNG/PDF | html2canvas/jsPDF; A4/A3; overflow guard | Shared SVG/canvas; raster PDF; A4/A3 | Keep existing poster/export identity; special artwork uses the same renderer |
| Adaptive infaq / QR | Merged empty cells; enabled false by default | Absent | Recover independently: minimum 2, largest end, leading tie; local review default ON, centered 3-column content cap |
| Extra legacy features | Custom session types, profiles, imports, daily features | Not integrated | Defer; no mechanical UI/source clone |

## Editing and rendering contract

The preview comes first in DOM order and appears beside the selected-day editor
on desktop; it stacks above it at smaller widths. Every valid date has one native
button. Keyboard order is chronological even when the compact poster places final
dates in an earlier visual row. Enter/Space select; aria-pressed exposes selection,
aria-controls points to the selected-day heading, and focus is visibly blue.
The date list is inside a collapsed secondary disclosure.

Selecting 24 then 25 changes the selected-day state without changing the month.
Normal mode supports 0–2 sessions, the existing four session types, speaker and
topic. An inactive library speaker is available only when already selected.
Sessions with speakerName/photo snapshots render those values, including an absent
snapshot portrait, instead of mutable library data. Unpersisted demo selections
continue to resolve their current library entry. Selecting another speaker clears
the previous snapshot; the future save adapter will capture the new one.

Poster mode uses one image, alt, fit, optional position and `mode: full`. After the
owner visual refinement, the artwork uses the entire date cell at x=0/y=0 with no
internal padding or reserved header. The date badge is painted above the image.
Normal lecture text/portraits are not rendered over it. Cover is the default, with
a visible crop warning and Atas/Tengah/Bawah alignment. Contain explicitly shows
the full source on clean white; alignment is inactive for contain. Rounded cell
corners still clip the artwork. Original source bytes remain unchanged.
Removing the poster reveals unchanged sessions and sourceRule IDs. The day remains
manual until explicitly restored, avoiding an unexpected rule overwrite.
Full-poster sessions may still be edited via the sessions mode; the editor clearly
states they are stored but hidden. Applying rules preserves this whole manual day.
Restoring regenerates only the selected date, removes its visual/manual override,
and leaves other dates/rules intact. A conflict on an unrelated date does not prevent
restoring a valid selected date; a conflict on that selected date fails visibly.

Small-screen **editing** rows grow vertically to keep click targets at least 44px
high; the desktop poster and offscreen export snapshot retain the 1240×877 print
geometry. The export snapshot has no buttons, selection outlines or focus chrome.
The compact-calendar setting can be disabled to inspect a real six-row month.

## Non-production asset reuse and original file handling

October demo dates 24 and 25 reference the same independently authored
`public/lecture-demo/special-event-demo.png`; its editable SVG source is included.
Artwork explicitly says CONTOH REKAAN / BUKAN PROGRAM SEBENAR. It is neither a
real event announcement nor a production asset. Underlying fixture sessions are
two on 24 and one on 25. No owner program poster was uploaded or seeded.

The picker can assign a previously used image to another date without reading the
file again. Local PNG/JPEG/WebP files (maximum 25 MB) retain their original bytes,
dimensions and SHA-256; repeated file selections share one local catalog entry per
hash. A delayed file read cannot overwrite newer edits or attach to a subsequently
selected date/month. Images already embedded as local data URLs pass through the
same PNG/PDF renderer; only the exported raster is rendered, not the source edited.
Dedicated copy-to-many-date controls are deferred to 5.3B; the picker is sufficient now.

## Approved Sanity model and future 5.3B persistence boundary

Existing high-level types remain lectureSpeaker, lectureRule, lectureMonth,
embedded lectureDay and lectureSession. A single monthly authoritative snapshot
has stable ID `lectureMonth-YYYY-MM`. No per-date documents are introduced.

The optional date-poster schema object is added; a separate poster-level boolean is described below:

```text
lectureDay.specialPoster?
  image: editorialImage           # required when the object exists; ref + alt
  fit: cover | contain            # required; default cover
  position?: top | center | bottom # optional; absent means center
  mode: full                      # required; hidden fixed choice for now
```

Its day must have isManualOverride=true. Existing days without it remain valid;
sessions retain their 0–2 limit. A later mixed enum can extend this object without
moving monthly entries or asset references. No schema is deployed in this phase.

Future flow: published/draft month → authenticated Studio load → typed adapter →
local working state → explicit Save Draft → Studio review → separately authorized Publish.
The current editor/state/renderer are shared by that future flow. The adapter will:

1. Prefer an existing Studio draft, otherwise load the published monthly snapshot;
   keep IDs, revision and immutable baseline beside editable state.
2. Convert ISO dates to selected-month day numbers, refs to speaker/rule IDs and
   resolved image view models. Round-trip existing speakerName/photo snapshots.
3. On explicit Save Draft, validate the exact monthly payload and use optimistic
   revision checks. Stop on drift instead of overwriting another editor's changes.
4. Preserve unchanged snapshots and manual/empty days; capture speaker name/photo
   for newly selected or regenerated sessions. Library edits must not rewrite an
   existing month implicitly. Keep topic and sourceRule provenance separately.
5. Resolve/upload original approved artwork once, then reuse the same Sanity asset
   `_ref` for both dates. Local hashes are transient catalog keys, never asset IDs.
   No data URLs should be persisted in Sanity monthly documents.
6. Use Studio's authenticated client and dataset roles, never a custom private/write
   credential embedded in public code. Add a narrowly scoped Sanity-image export
   resolver/cache when persistence exists; current export only needs same-origin
   fixture images and locally embedded originals.
7. Publish only after separate review of the exact draft/revision; loading or applying
   rules must never auto-save/publish. Leave unrelated documents/fields untouched.

Recommended **5.3B** scope is authenticated loading/Save Draft, revision conflicts,
month adapter and snapshot round-trip, original-image upload/reuse, speaker/rule
library management, draft review and authenticated export resolution. Specify
permissions, failure recovery and controlled production-content plan before writes.
Keep initial publication, real schedule migration, public `/kuliah`, homepage feed
and all automations as separately approved gates/scopes. Save Draft/Publish are not
enabled by this recommendation. Bulk poster copy can be added after the basic
load/save/reuse flow is reviewed.

## License and provenance

The reference LICENSE declares GPL v3 and credits the original upstream
Kengkorok/jadual-kuliah-generator. Existing renderer/layout adaptations already
carry GPL-3.0-only SPDX notices and the repository retains GPL/attribution files.
This phase independently implements the native-button overlay, selected-day
state, local original-file reader and optional model/validation from observed
behaviour; no substantial legacy editor implementation was pasted into the app.
Changes inside the existing adapted renderer/layout keep their notices.
The new demo artwork is independently authored, not extracted from the reference.

This does not settle derivative/combined-application distribution obligations or
image rights. D18's pre-production licensing decision stays open; see
[JADUAL-KULIAH-NOTICE.md](third-party/JADUAL-KULIAH-NOTICE.md).
Historical 4.2A/4.3 evidence remains unchanged; this report describes current review work.

## Validation evidence

The final local review record includes automated recurrence/model/schema/renderer
tests, actual click/Enter/Space/focus checks, responsive 375/430/768/1440 screenshots,
same-artwork dates, original-byte read-back, PNG and A4/A3 PDF export artifacts.
Real Studio authentication and CORS are preserved. The isolated local fixture
imports the exact Studio tool without connecting to Sanity; no canonical public
preview route is added. Final results and any environment limitation are recorded
below after the closeout checks.

### Final results — 3 October 2026

| Check | Result |
| --- | --- |
| npm run lint | Pass, 0 errors/warnings |
| npm run build | Pass with read-only published Sanity access; unchanged public route set and 5-minute revalidation |
| git diff --check | Pass; no commit/staging/push |
| Relevant automated suites | 153 passed: 15 lecture + 138 public/homepage/information/migration/publication regressions; migration/publication test writes use in-memory fake clients only |
| Recurrence coverage | 2,016 weekday/occurrence/month cases including leap years and 2100 |
| Schema extraction | Pass, local output only; no schema deployment |
| Schema validation | Existing legacy month + shared full-poster fixture accepted; seven malformed poster/date/session cases rejected; current real editorial documents valid |
| Keyboard/cell QA | Direct 24/25 selection, Enter/Space, chronological native controls and visible 3px focus; month unchanged |
| Full-poster/session QA | Two/one hidden sessions preserved on 24/25; removal reveals sessions; applying rules keeps posters; restore confirmation can be cancelled |
| 375 / 430 / 768 / 1440 | 31 valid clickable dates; no document/internal horizontal overflow; minimum cell height 44.48px on phones |
| Six-row month | March 2026, compact off: six rows and all 31 date buttons |
| Original file | Local selection SHA-256 matches all 39,989 source bytes; 780×480; no upload/crop/re-encoding |
| PNG export | A4 3508×2480, both date artworks present; original input and same-image selection also exercised locally |
| PDF export | A4 and A3 single landscape pages; 3508×2480 and 4961×3508 raster images; both artworks present; Poppler renders visually inspected |
| Current-state/homepage verification | Pass, read-only; historical migration evidence unchanged |
| Public smoke | Homepage plus five public-content routes HTTP 200 with real current News/Program/NCR; Studio route 200; /kuliah 404 |
| Authenticated production inventory | Exact before/after document and asset IDs/revisions unchanged: 45 published, 0 drafts, 55 assets, 0 lecture documents; Program 1 / Announcement 0 / News 1 |

The full embedded Studio UI on `http://127.0.0.1:3005/studio/penjana-jadual-kuliah`
shows its existing **Connect this Studio / CORS origin** gate in this browser.
No CORS, registration or authentication settings were changed. Responsive and
interactive QA used the exact tool in the isolated preview at
`http://127.0.0.1:3022/`; its source files match the canonical tool. It has no Sanity
connection or public CMS bypass. Full authenticated Studio-shell visual QA remains
an environment/owner-review step; the local component/fixture QA is complete.

Evidence files in the calling task's outputs directory: phase-5.3a-desktop.png,
phase-5.3a-375.png, phase-5.3a-430.png, phase-5.3a-768.png,
phase-5.3a-responsive-qa.json, phase-5.3a-original-file-qa.json,
phase-5.3a-full-poster-a4.png, phase-5.3a-full-poster-a4.pdf,
phase-5.3a-full-poster-a3.pdf, phase-5.3a-export-validation.json,
phase-5.3a-route-smoke.json, phase-5.3a-schema.json and authenticated inventory snapshots.
These artifacts are QA evidence, not production schedules or publishing approval.

### Files changed (26)

- Runtime/schema: src/sanity/schemaTypes/lectureMonth.ts;
  src/sanity/tools/lecture-generator/LectureGeneratorTool.tsx,
  InteractiveLecturePoster.tsx, LecturePoster.tsx, model.ts, poster-layout.ts,
  local-poster.ts, export-poster.ts, generator.module.css.
- QA assets: public/lecture-demo/special-event-demo.svg, special-event-demo.png and general-mosque-qr.png.
- Tests/tooling: package.json; scripts/lecture-generator/lecture-generator.test.mjs,
  styles-test-loader.mjs and styles-test-interop.mjs.
- Documentation: README.md; docs/PROJECT-STATE.md, PROJECT-JOURNEY.md, ROADMAP.md,
  DECISIONS.md, ARCHITECTURE.md, SANITY-LECTURE-GENERATOR.md,
  SANITY-CONTENT-MODEL.md, LECTURE-GENERATOR-UX-RECOVERY.md and
  docs/third-party/JADUAL-KULIAH-NOTICE.md.

HEAD and origin/main remain the baseline f4b473b1df54af695599a735a1fb2d1c5d9fd372.
This review is now approved. Git checkpoint is authorized; 5.3B and production publication are not started.

## Owner full-cell visual refinement — approved

The owner approved 5.3A generally and requested true full-bleed takeover. The
32-unit reserved artwork header was removed, cover became the default in the
fixture, new selections/imports and proposed schema, and the yellow date badge
remains overlaid. Explicit fit labels are Penuhi kotak (cover) and Paparkan
keseluruhan poster (contain). Simple vertical alignment was practical and is
included now; no new Sanity persistence or substantial focal/crop system was added.

Actual browser QA confirmed both dates share one source, cover/contain switching,
top/bottom alignment, removal revealing the two underlying sessions on 24 while
25 retains its poster, and new poster selection defaulting to cover. Responsive
375/430/768/1440 checks retain 31 accessible cells and no horizontal overflow.

Lint, build, diff-check and 153 relevant automated tests pass. The real schema
accepts legacy month, legacy poster without position, and shared cover fixtures;
eight malformed cases fail. Local schema extraction passes, with no deployment.
PNG/PDF proofs for both fits are generated by the exact canonical export module
and renderer, A4 3508×2480 / one landscape PDF page. A fixture-only DOM capture
retains export bytes because the in-app browser did not deliver the native blob
download; canonical export code is unchanged. Both PDFs were rendered using
Poppler and visually inspected. Same-artwork and PNG/PDF pixel comparisons pass.
The owner screenshot is a visual target only; QA uses the clearly fictional demo
artwork, and does not upload the reference or create production content.

Evidence: phase-5.3a-fullbleed-{375,430,768,1440}.jpg;
phase-5.3a-fullbleed-comparison.png; phase-5.3a-fullbleed-{cover,contain}.png/.pdf;
phase-5.3a-fullbleed-responsive.json; phase-5.3a-fullbleed-export-check.json;
phase-5.3a-fullbleed-schema.json. The preview remains http://127.0.0.1:3022/.
Studio-shell CORS limitation is unchanged. No production write, commit or push;
Save Draft/Publish remain disabled. Owner visual review is approved; 5.3B not started.

## Adaptive infaq recovery — 4 October 2026, owner-approved

The panel is presentation on an existing no-date group, never a lectureDay. Compute
leading actual no-date span immediately before day 1 and trailing span at the end
of the rendered grid. Reject each group smaller than 2; pick the larger eligible
group, with leading chosen on a tie. The established compact calendar may already
wrap final dates to the first row; this feature neither changes that layout nor
reserves raw-offset cells that now contain valid dates. All valid date positions,
sessions, manual overrides, full posters and recurrence behavior remain unchanged.
No panel appears when disabled, QR unavailable, or neither group qualifies.

| QA month (2026) | Leading / trailing actual blank spans | Decision |
| --- | --- | --- |
| October | 3 / 1 | Leading 3; trailing single rejected |
| April | 2 / 3 | Trailing 3; larger eligible group |
| September | 1 / 4 | Leading single rejected; trailing 4 used |
| June | 0 / 5 | Trailing only, 5 |
| July | 2 / 2 | Leading 2, tie |
| March, compact off | 6 / 5 | Leading 6, six rows |
| August, compact off | 5 / 6 | Trailing 6 |
| February, compact on | 0 / 0 | No panel |

Synthetic single-leading-only, single-trailing-only and 1/1 groups also produce no
panel. The one-cell rule is per group: it does not suppress an eligible opposite
group. Tests exhaust 1,944 combinations (2020–2100, 12 months, both layouts),
asserting every date appears exactly once and no coordinates/schedule are mutated.

The existing merged white no-date area spans the entire selected group. QR/copy
are centered with content width capped to three columns; this keeps 4–6 groups
balanced without changing cell positions. Square QR sits left, exact approved
three-line copy right, no date badge. QR uses SVG meet/contain, not cover, and
retains source quiet zone plus outer white margins. No crop, overlay, recoloring
or artwork editing. Toggle **Papar ruang infaq** defaults ON in this local review
and proposed optional schema field (legacy reference defaults OFF). Off restores
plain blank space and preserves exact valid-cell geometry/session content.

The newly supplied general mosque QR is used locally at
public/lecture-demo/general-mosque-qr.png: 853×853, 1,480,205 bytes, SHA-256
1b86b6336223e38fb103f23368cafae07cb0c1ea66e5a3bc1bb53b9eb6ed792d.
It matches C:/Users/User/Downloads/qr masjid mtu.png byte-for-byte. This latest
owner instruction authorizes local poster QA; the historical 5.2A S04 QR-only
excluded/unclassified evidence is not rewritten. The branded public donation
asset/reference and Dapur-specific QR stay untouched. No asset upload is made.

Proposed lectureMonth.showInfaq is optional boolean only; old months remain valid.
Runtime settings carry a resolved generalDonationQr image, never embedded month
or per-date QR content. The future authenticated Studio adapter must resolve the
mosque-wide approved donation source; no per-month duplicate upload, local URL or
data-URL persistence. No schema deployment/Save Draft/Publish/persistence now.

Shared LecturePoster/infaqPlacement/infaqGeometry render preview and export.
Actual canonical PNG/PDF generation is exercised via UI and a fixture-only local
download capture. October/April/March exports: PNG 3508×2480, PDF one landscape A4
page (841.89×595.28 pt), same selected edge and QR composition. PDFs are rendered
with Poppler and visually inspected; PNG/PDF pixel differences and original-QR
scale-only comparisons pass with unobstructed white margins. This verifies artwork
preservation/rendering, not a physical bank-app scan or payment transaction.

Validation: lint (0 warnings), build, diff-check, local schema extraction pass;
20 lecture + 138 regression tests pass. 375/430/768/1440 browser checks retain all
31 October date buttons, square QR, minimum phone targets 44.48px and no document
horizontal overflow. Toggle and keyboard Enter/Space on dates 24/25 pass. Underlying
2/1 sessions and shared full-bleed artwork remain intact. Authentic Studio-shell
CORS review limitation is unchanged; exact isolated tool remains at
http://127.0.0.1:3022/. No production mutations, staging, commit or push.

Evidence: phase-5.3a-infaq-{october,april}-desktop.jpg,
phase-5.3a-infaq-march-six-row.jpg, phase-5.3a-infaq-{375,430,768,1440}.jpg,
phase-5.3a-infaq-{october,april,march}.png/.pdf, matching PDF renders and
phase-5.3a-infaq-{calendar-cases,browser-cases,responsive,export-check,schema}.json.
The owner approved the implemented sizing/default and locked the listed UX behaviors. 5.3B is not started.

## Fasa 5.3A final closeout — 4 October 2026 (+08:00)

Owner approval locks the calendar/poster as primary date navigation, keyboard direct
editing, maximum two sessions per date, recurring rules with preserved manual
overrides, explicit one-date restore and reusable speaker architecture. Full-cell
posters retain cover default, contain alternative and vertical position controls;
underlying sessions remain stored and reappear after removal. One artwork can be
reused across dates. No further UX features are added during closeout.

Adaptive infaq uses actual leading/trailing no-date groups in the existing layout,
minimum two contiguous cells, largest eligible group, leading on ties; a single
cell never qualifies. Valid dates are never displaced. Content is centered/capped
at approximately three-column width inside larger white merged groups. General
mosque QR is reused, unchanged; Dapur QR is unrelated. Preview/PNG/PDF share the
renderer contract. Optional lectureMonth.showInfaq is poster configuration only;
full posters remain embedded lectureDay.specialPoster, not separate date documents.

Monthly snapshots remain lectureMonth-YYYY-MM. Authenticated loading/persistence,
real Save Draft/Publish, production lecture migration, public /kuliah and homepage
lecture feed are not implemented. Save Draft and Publish remain disabled; lecture
types remain read-only/hidden. Fasa 5.3B has not started. No Sanity production
mutation, upload or schema deployment was performed during this closeout.

GPL/SPDX notices, exact legacy source 378b1bbb4084b4f7b6c55ac70a5c4f769d221d28,
upstream attribution and the independently implemented workflow provenance remain
recorded. D18's GPL/combined-application distribution decision is unresolved;
this owner UX approval makes no licensing/legal conclusion. Historical migration
and publication evidence remains immutable.

Final checks: lint (0 warnings), production build with published read-only Sanity,
git diff --check, local schema extraction and 158 relevant tests pass (20 lecture,
138 public/homepage/information/migration/publication regressions; fake-client
writes in tests only). Coverage includes recurrence, keyboard cell semantics,
special posters, shared artwork 24/25, restore/manual preservation, infaq selection
over 1,944 calendar/layout combinations, outage and malformed/auth failures.
Approved PNG/PDF proofs were revalidated: full-bleed cover/contain and infaq
October/April/six-row March, 3508×2480 PNG and single landscape A4 PDF. Shared
artwork, export pixels, QR source hash, scale-only rendering and white margins pass.
Existing 375/430/768/1440 QA and owner visual approval stand; exact preview tool
matches canonical sources. All six public routes return 200, Studio route 200,
public /kuliah remains 404. Production published current-state parity passes:
Program 1, Announcement 0, News 1, 55 image assets; NCR/donation unchanged.
The public inventory fingerprint remains
7fc9e5a0b248b2350576b9c291cd7ccf49d895d6ebfff5e48ce819328c7692ce.

The isolated exact-component preview remains local QA only. The existing embedded
Studio CORS registration gate was not bypassed or changed. The owner accepted the
visual review; no additional Studio-shell capability is claimed by this checkpoint.
Checkpoint: phase-5.3a-lecture-generator-ux. Stop after checkpoint; no 5.3B work.
