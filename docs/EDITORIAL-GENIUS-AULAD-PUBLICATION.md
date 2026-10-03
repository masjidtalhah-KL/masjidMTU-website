# Fasa 5.2B — First News publication and closeout

Completed **3 October 2026 (+08:00)** from checkpoint `91ad9f21db7cefc838f6ca4d6bc90a388173267f` / `phase-5.2a-editorial-public-information`.
Checkpoint: `phase-5.2b-first-news`; resolve the tag for its final Git commit.

## Exact controlled publication

Only `newsPost-lawatan-genius-aulad-bandar-kinrara` was published.
Approved draft revision before timestamp: `chGo6kzbOkh09ebDsDB6sf`.
Timestamp-only draft revision: `SSdKRdF7e0XIFT3zzHLRv2`.
Published revision: `zJzdY1EB95ZHrNvpJpZmOO`.
Website `publishedAt`: **2026-10-03T11:18:02Z**, equivalent to **3 October 2026, 19:18:02 +08:00**.
This is the actual execution-time publication timestamp, not a backdated source timestamp.
Event `eventDate`: **2026-05-14**; homepage label **14 Mei 2026**.
Facebook source post: **14 May 2026, 10:19 AM**; documentation provenance only, with no inferred timezone or photo-clock substitution.

The fresh authenticated guard confirmed the approved draft revision, no published target/slug conflict, exactly one draft, no release versions and a resolving approved original photo. Only publishedAt was patched, with an optimistic revision lock. Authenticated read-back and the actual local schema validator then reported zero errors/warnings with remote reference checks. A second fresh guard confirmed the complete timestamped draft immediately before publication.

[Exact published payload and resulting metadata](EDITORIAL-GENIUS-AULAD-PUBLICATION.json).
[Approved pre-publication draft and historical preparation](EDITORIAL-GENIUS-AULAD-DRAFT.md); its JSON intentionally preserves the approved payload before publishedAt was set.

## Content and scope

Title, slug, category, excerpt, three body paragraphs, eventDate, original photo #4 and its alt remain exactly approved.
Image: `image-0bb5476f0d6726f01588ef6480e30d0750524f3a-1280x963-png` (1280×963).
Asset SHA-1: `0bb5476f0d6726f01588ef6480e30d0750524f3a`.
Original source SHA-256: `5dc6e1fa6e3728765a1810501374e79ef3a418508cdad2fa714a79942c0c5a4d`.
No new upload or source edit during final publication. The historical caption screenshot asset is retained but is not the article image.

Authenticated final inventory: **0 drafts, 45 published content documents, 1 Program, 0 Announcement, 1 News, 55 image assets**.
All **44 pre-existing published content documents** and **55 existing image asset IDs/revisions** match the before-publication snapshot.
Dapur remains active/ongoing; NCR and donation remain published and unchanged.
No Announcement, Program, settings, Lecture or other document was created/patched/published in this final publication step.

## Homepage and architecture

- Eyebrow: **BULETIN MTU** (previously CERITA KOMUNITI).
- Heading unchanged: **Berita dan aktiviti**.
- Description: **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
- Optional Sanity date `newsPost.eventDate` records the actual event. Existing News without it remain valid and display publishedAt. Required publishedAt still controls publication eligibility and newest-first ordering.
- The typed server-only query/adapter carries optional CMS image asset, dimensions and alt. The existing PublicImage/Next Image loader handles responsive sizes; browser cover cropping preserves the original source.
- The existing 160px visual frame prevents image-loading layout shift. Cards without images retain the approved decorative MTU layout.
- Published-only, token-free reads and five-minute revalidation remain intact. Healthy empty sections stay empty; temporary transport outages use explicit unavailable UI without mock editorial cards. Malformed/auth/query failures stay visible errors.

## Final verification

- Lint, production build/TypeScript and git diff --check passed.
- **138 automated tests passed** across public content (27), homepage (47), information (24), News date (8), migration (18) and publication guards (14).
- Local schema extraction passed; current published siteSettings, Program and News validate with zero errors/warnings and remote reference checks.
- Read-only current-state verifier passed: all 43 historical base payloads and 50 historical image hashes retained. Historical Fasa 4.3 manifests/fingerprints/evidence were not modified or weakened.
- Fasa 5.1 regressions retain 25 organisation slots, vacant deputy, Soffan without photo, 3 Jumaat + 12 Biasa Surau, 12 ordered gallery images, five Profil space images and contact/social content.
- All six real public routes returned HTTP 200: /, /profil, /profil/organisasi, /profil/surau-kariah, /galeri, /hubungi. NCR telephone links, Dapur and donation passed smoke checks.
- Real production homepage desktop 1440×1000 and mobile 375×1100 passed: CMS image loaded, exact alt/date/copy, readable title/excerpt, balanced crop, 160px image area and no horizontal overflow.
- Separate local preview used the exact real component and an image-free duplicate fixture; it was never seeded. Desktop cards 373.33×383.31px; mobile cards 336×405.73px before full-page capture. Image/no-image card heights match. Isolated review measured CLS 0 with stable loading dimensions and no overflow.
- Outage, malformed images/dates, invalid auth/query responses, draft/release exclusions and legacy no-image/date behavior are covered by the passing tests.

Facebook remains curated/manual; no importer. Announcement intentionally remains empty.
Qiam/Bubur Asyura remains HOLD. Dapur-specific QR remains separate; QR-only asset remains excluded/unclassified.
Jadual Kuliah remains local/mock; Lecture Generator Publish stays disabled. **Fasa 5.3 has not started.**


## Files changed in this checkpoint

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/EDITORIAL-CONTENT-PREPARATION.md`
- `docs/EDITORIAL-SOURCE-REGISTER.md`
- `docs/PROJECT-JOURNEY.md`
- `docs/PROJECT-STATE.md`
- `docs/ROADMAP.md`
- `docs/SANITY-CONTENT-MODEL.md`
- `docs/SANITY-HOMEPAGE-CONTENT.md`
- `docs/EDITORIAL-GENIUS-AULAD-DRAFT.json`
- `docs/EDITORIAL-GENIUS-AULAD-DRAFT.md`
- `docs/EDITORIAL-GENIUS-AULAD-PUBLICATION.json`
- `docs/EDITORIAL-GENIUS-AULAD-PUBLICATION.md`
- `scripts/public-content/current-verify.mjs`
- `scripts/public-content/homepage-content.test.mjs`
- `scripts/public-content/homepage-verify.mjs`
- `scripts/public-content/news-date.test.mjs`
- `src/app/globals.css`
- `src/components/public/homepage-editorial.tsx`
- `src/lib/calendar-date.ts`
- `src/lib/public-content/cms/homepage-adapters.ts`
- `src/lib/public-content/cms/homepage-queries.ts`
- `src/lib/public-content/cms/homepage-server.ts`
- `src/lib/public-content/cms/homepage-types.ts`
- `src/sanity/schemaTypes/newsPost.ts`
