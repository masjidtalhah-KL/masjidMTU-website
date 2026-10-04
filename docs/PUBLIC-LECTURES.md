# Fasa 5.3D — Public Jadual Kuliah

Completed on 4 October 2026 (+08:00), after owner approval and final public QA.
Baseline: `4130fbda4aa690da86a54a0792a6d836ed5bde56`,
`phase-5.3c-controlled-lecture-publication`. Checkpoint:
`phase-5.3d-public-kuliah` (resolve the tag for the final commit).
Commit message: `feat: complete Fasa 5.3D public kuliah page`.
No Sanity writes.

## Public read architecture

`/kuliah` chooses the current calendar month in Asia/Kuala_Lumpur when published;
otherwise it shows the latest published month with an explicit Malay notice.
`/kuliah/YYYY-MM` is the bookmarkable month view. Only published months appear
in previous/next navigation and the month list. Missing/invalid months return 404.
One published month has a centred month link; unavailable neighbours are hidden.
Real neighbouring published months render previous/next links automatically.

The dedicated `src/lib/public-content/lectures/server.ts` read boundary is
server-only, typed, token-free and uses Sanity's published perspective. GROQ also
excludes draft/release IDs explicitly. Reads revalidate every 300 seconds.
Whole-document validation rejects malformed dates, sessions, IDs and unresolved
images. No fixture schedule, local editorial fallback or Studio mutation code
is used by the public page.

Healthy absence: **Jadual kuliah belum diterbitkan.**
Temporary transport/timeout/5xx failure: explicit temporary-unavailable state.
Authentication/query/malformed failures remain errors with a Malay error boundary;
they are not reported as empty schedules or silently repaired.
Missing compact QR omits only the Infaq panel; malformed QR is an error.

## Shared official poster and exports

The public page reuses the existing GPL-noticed `LecturePoster`, geometry,
font measurement and export pipeline. A runtime-only `official` presentation
removes the administrative footer/badges, preserving the approved artwork and
calendar geometry. No clickable edit cells or Studio controls are rendered.
Pure poster definitions live in `poster-model.ts`; the original `model.ts`
reexports them for Studio compatibility. Public browser chunks omit the Studio
editor, persistence/publication workflow and demo speaker/rule payloads.

Responsive SVG preserves the full landscape composition without cropping.
**Buka poster penuh** opens a native accessible dialog with internal poster
scrolling, close control and native Escape/focus handling.

PNG/PDF buttons lazily load only the shared exporter. They export the displayed
published snapshot: PNG **3508 × 2480**, PDF **one A4 landscape page**
(841.89 × 595.28 points). Public filenames omit the Studio prototype suffix.
Existing Studio filename/default export behaviour remains unchanged.

`/kuliah/YYYY-MM/imej/ASSET_ID` is a read-only same-origin image source for
downloads, avoiding project CORS dependence. It permits only portraits,
special posters and the enabled compact QR referenced by that published view.
No arbitrary URL/asset fetch, draft read, token, image upload or transformation.
It passes through uncropped CDN bytes with a five-minute public cache.
The compact CDN PNG has identical decoded pixels/dimensions to the approved
source even though CDN recompression gives its response a different binary hash.

## Accessible public schedule

Stored meaningful dates render chronologically in HTML with `time datetime`,
session headings, optional Penceramah snapshots and topic/kitab text. Two sessions
remain distinct. Group-recitation dates show no artificial speaker placeholder.
October has **30 stored dates / 34 sessions**; the poster's empty 31st calendar
cell does not generate an invented text entry.

A full special poster exposes **Program khas**, its supplied alt description
and an original artwork link. Underlying sessions remain in the monthly snapshot
but are hidden from this public text presentation, matching the poster override.

Compact Infaq resolves from published `siteSettings.donationInfo.compactQr`.
The primary public donation QR and Dapur QR remain separate. This page adds only
a supporting **Salurkan sumbangan** link to `/#donations`.
**Kuliah** appears in shared desktop/mobile public navigation, active on month
subroutes. Page metadata is Malay and includes the month on shareable views.
No speculative Event JSON-LD or homepage lecture feed.

## Verification

- Lint, live-Sanity production build and required-field schema extraction pass.
- 229 relevant tests pass: published-only/no-draft queries, month precedence and
  navigation, empty/outage/auth/malformed states, accessible two-session schedule,
  Unicode, special-poster semantics, restricted image sources and PNG/PDF;
  all existing Studio persistence/publication/renderer and public regressions.
- Real browser QA at 375, 430, 768 and 1440: no horizontal page overflow; poster,
  controls, mobile navigation, long text and two-session cards remain usable.
- Actual PNG/PDF actions complete. The in-app download event/file API did not
  expose artifacts; an isolated localhost QA receiver captured the identical
  generated Blob bytes without changing production source. Captured PNG/PDF were
  inspected. Compared with the approved Studio PNG, geometry/content match;
  differences are the omitted admin footer and three single-pixel raster variations.
  The final repeat also differs from the prior public PNG by only three pixels.
- Public HTTP smoke checks cover the homepage, five content routes, Studio,
  default/shareable Kuliah, unavailable-month 404 and unreferenced-image 404.
  Public JS chunks contain no Studio save/publish workflow or demo speaker data.
- Token-free current-state verification checks the exact October revision,
  canonical fingerprint, 29 portraits and compact QR. Authenticated before/after
  inventory comparison records production unchanged.

QA evidence is under the task's `outputs/phase-5.3d-*` files, including
desktop/mobile screenshots, captured PNG/PDF, responsive measurements, schema,
test log, route smoke and authenticated inventory comparison.
Repeatable commands: `npm run lecture-public:test`,
`npm run lecture-public:verify`, `npm run lecture-public:smoke`.

## Files changed (29)

- Public routes: `src/app/kuliah/page.tsx`, `src/app/kuliah/error.tsx`,
  `src/app/kuliah/[month]/page.tsx`,
  `src/app/kuliah/[month]/imej/[asset]/route.ts`.
- Read layer: `src/lib/public-content/lectures/content.ts`, `images.ts`,
  `queries.ts`, `server.ts`.
- Public presentation: `src/components/public/lecture-page.tsx`,
  `lecture-poster.tsx`, `lecture-schedule.tsx`,
  `public-lectures.module.css`, `public-navigation.tsx`.
- Shared renderer boundary: `src/sanity/tools/lecture-generator/LecturePoster.tsx`,
  `export-poster.ts`, `model.ts`, `poster-model.ts`, `poster-layout.ts`.
- Verification: `scripts/public-content/lecture-content.test.mjs`,
  `lecture-route-smoke.mjs`, `lecture-verify.mjs`, plus `package.json` commands.
- Documentation: `README.md`, `docs/ARCHITECTURE.md`, `DECISIONS.md`,
  `PROJECT-JOURNEY.md`, `PROJECT-STATE.md`, `ROADMAP.md`, `PUBLIC-LECTURES.md`.

The existing upstream notices and unresolved GPL combined-application decision
remain applicable; no new legacy implementation was copied in this phase.
Earlier migration/publication/Unicode audit records remain unchanged.
No homepage lecture integration, later phase or production mutation.

## Final owner-facing QA and unchanged production

- At 375 and 430px, accessible HTML contains 30 dates / 34 sessions. Dates 3, 11,
  18 and 24 have two separate session blocks. No text element or page overflows;
  group recitations have no artificial Penceramah placeholder.
- Mobile full-poster screenshots show the enlarged landscape artwork in an
  internally scrollable region. Keyboard/rightward panning works; Tutup and Escape
  close it, and the underlying page retains its width. The poster is inspected
  by panning rather than cropped or squeezed into an unreadable modal image.
- Both download buttons were physically exercised on the real public
  `http://127.0.0.1:3037/kuliah` route and displayed success without console errors.
  The in-app browser download API still times out without exposing a saved file.
  A QA-only localhost mirror then captured generated Blob bytes from the same
  public route/export pipeline; no production code or CMS content was modified.
- Inspected final PNG: 3508 × 2480. Inspected PDF: one page, A4 landscape,
  841.89 × 595.28 pt. Portraits, compact Infaq QR and approved Unicode are correct.
- Authenticated whole-inventory, settings, assets and October content comparison
  confirms no changed production revisions. October remains revision
  `zVZDfWLj75qTdy5eh9rsNA`, 0 drafts / 1 published lecture month / 85 image assets.
  Content SHA256 remains
  `d18eb8c75642d32065fe509e9ba5f219a7d68c5989c7fc6cf4b538cb5fa547b6`.

Final evidence: task `outputs/phase-5.3d-closeout-*` screenshots, PNG/PDF,
download measurements, test log, schema and authenticated inventory comparison.
Earlier evidence remains unchanged.
