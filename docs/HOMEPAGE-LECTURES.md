# Fasa 5.3E — Homepage Upcoming Kuliah

Completed after owner visual approval and copy refinement on 5 October 2026 (+08:00).
Baseline: `5b6962b5c54d4a73849dac8df06e248eb31ffda4`,
`phase-5.3d-public-kuliah`. Checkpoint: `phase-5.3e-homepage-lecture`
(resolve the tag for the final commit). No Sanity mutation. Fasa 6 has not started.

## Selection and read boundary

Reuse the typed, server-only `lectures/server.ts` client, published-only GROQ
index/month queries, strict full-month mapper and public text-schedule adapter.
No new query, credential or browser client. Shared cached index/month fetches
serve both the homepage and public month views with the existing 300-second
revalidation settings.

Deterministic selection:

1. Compute today's ISO calendar date in Asia/Kuala_Lumpur.
2. Validate the published month index and sort chronologically.
3. Read the current month if published, then later published months as necessary.
4. Validate each visited month, including references. Ignore past dates and
   stored entries without sessions or a special poster.
5. Select the earliest actual content date on/after today. Include every session
   on that date, preserving the approved stored order. This is not a claim about
   clock-time order or which session has finished.

Today remains eligible even late in the evening: the model has no exact time or
completion status. Public wording is **Hari ini**. Future dates
are labelled **Tarikh terdekat**. Selection updates with the existing five-minute
homepage revalidation; there is no browser countdown.

No applicable dates in the current month means inspect the next available
published month, including gaps and year rollover. Never retrieve an unpublished
month or present the latest old date as upcoming. A temporary read failure stops
selection with unavailable state instead of skipping potentially nearer content.

Full special posters expose **Program khas** and their approved image alt/public
description. Preserved underlying sessions stay hidden, as on `/kuliah`.

## Homepage presentation and states

One date presentation in the established navy/gold design:

- **PENGAJIAN DI MASJID**
- **Kuliah terdekat**
- **Pengajian terdekat berdasarkan jadual yang diterbitkan oleh pihak masjid.**
- Date, session type, actual optional Penceramah snapshot and topic/kitab.
- **Lihat jadual penuh** → `/kuliah`.

No poster, month calendar, portrait grid or fabricated imagery. Two sessions have
separate headings/blocks and a divider within the one date card. Semantic
`article`, heading hierarchy and `time datetime` retain accessible text.
Group recitations omit Penceramah when absent. Original Unicode is preserved.
The old `lectureSchedule` mock export remains historical local source only;
the homepage no longer imports or renders it. Other homepage content is untouched.

Healthy no published month: **Jadual kuliah belum diterbitkan.**
Published months but no future date:
**Jadual kuliah terkini boleh dilihat di halaman Jadual Kuliah.**
Temporary outage:
**Maklumat kuliah tidak tersedia buat sementara waktu. Sila cuba lagi kemudian.**
All keep the full-schedule CTA. Malformed/auth/query/reference failures propagate
as errors rather than becoming empty states or mock content.

## Verification

- Lint, production build and diff check pass.
- 243 automated tests pass, including 14 new upcoming tests: Malaysia midnight,
  same-day two sessions at both midnight/late evening, chronological selection,
  empty dates, cross-month gaps/year rollover, no-future/empty states,
  full posters, outage/malformed/auth failures and raw-perspective draft exclusion.
- Existing Fasa 5.1/5.2/5.3 read, renderer, Save Draft, publication, Unicode,
  image and public PNG/PDF pipeline regressions remain green.
- Real homepage responsive QA at 375, 430, 768, 1440: no horizontal page overflow
  or overflowing section text. Initial 4 October QA used the published example:
  Kuliah Subuh / UST ARFAH / PENAWAR BAGI HATI, truthfully labelled for today.
- Physical CTA opens `/kuliah`; default/shareable October views still render
  30 dates / 34 sessions. Public PNG/PDF actions complete without console errors.
  Export geometry remains covered by the unchanged shared-pipeline regression:
  3508 × 2480 PNG and one-page A4 landscape PDF.
- Published current-state validation passes with zero schema errors/warnings;
  October revision/fingerprint and 29 portraits/compact QR remain unchanged.
  Authenticated before/after comparison verifies all production revisions,
  settings, assets and October content unchanged.

Production: 0 drafts / 1 published lecture month / 85 images; 1 Program,
1 News, 0 Announcement; no speaker/rule documents created.
No seed, upload, publication or Studio UX change. Final 5 October desktop/mobile
QA shows **Hari ini / 5 Oktober 2026 / Kuliah Maghrib / USTAZ ABU BAKAR / AL-QURAN**
with the revised heading/description. Date selection is unchanged. Final authenticated
comparison confirms all 143 documents and 85 assets unchanged. Commit message:
`feat: complete Fasa 5.3E homepage lecture integration`.

Evidence: task `outputs/phase-5.3e-*` responsive screenshots/measurements,
test log and authenticated before/after inventory comparison. Final closeout
proof uses `outputs/phase-5.3e-closeout-*`; initial QA records are preserved.

## Files changed

- `src/app/page.tsx`
- `src/lib/public-content/lectures/server.ts`, new `upcoming.ts`
- New `src/components/public/homepage-lectures.tsx`, `homepage-lectures.module.css`
- `scripts/public-content/homepage-content.test.mjs`,
  `lecture-route-smoke.mjs`, new `upcoming-lecture.test.mjs`
- `README.md`, `docs/PROJECT-STATE.md`, `ARCHITECTURE.md`, `ROADMAP.md`,
  `PROJECT-JOURNEY.md`, `DECISIONS.md`, new `HOMEPAGE-LECTURES.md`.

Existing `/kuliah` routes/components/exporter are unchanged; only shared
read-fetch wrappers are reused by the new selector. Historical phase/audit
records and GPL/provenance decisions remain unchanged.
