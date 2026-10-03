# Fasa 5.2A — Publication, final donation copy and closeout

Completed **3 October 2026 (+08:00)** with owner-approved Studio review, controlled publication, final copy refinement and live desktop/mobile QA. Checkpoint: `phase-5.2a-editorial-public-information`; resolve this tag for the final commit hash. Commit message: `feat: complete Fasa 5.2A editorial public information`.

## Architecture and current content

The typed server-only public read layer remains published-only, token-free and revalidates every **300 seconds**. Five public routes retain the approved local temporary-outage fallback. Homepage editorial uses intentional healthy empty states and explicit outage messages, without fabricated editorial records. Malformed/auth/query failures remain visible errors.

Program supports optional `scheduleType: scheduled | ongoing`; legacy missing values mean scheduled. Scheduled dates retain their existing rules. Ongoing permits absent start/end timestamps, respects genuine supplied bounds and isActive, and invents no end date or clock time. **Dapur Zohor Barakah** is the first published Program, active and ongoing, displayed under **Program dan inisiatif** with **Inisiatif berterusan**. Its original approved description and poster reference are unchanged.

Optional `siteSettings.ncrService` supplies evergreen NCR facts to `/hubungi#nikah-cerai-ruju`; names/roles are accessible text and the two dial links are `tel:0193749937` and `tel:01129378366`. Existing office/contact/social/location fields remain intact.

Optional `siteSettings.donationInfo` supplies the general mosque QR/copy to `/#donations`. The full original branded QR is rendered unoptimized on white, without cropping/hotspot/quality transformations. Recipient label, QR reference/artwork/alt and the existing contact/open-image actions are unchanged. Dapur-specific QR stays separate; bare QR remains excluded/unclassified.

## Exact final donation refinement

**Only two remote content fields changed:**

- `siteSettings.donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- `siteSettings.donationInfo.copy`:

> Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.
>
> Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.

The CMS text contains exactly those paragraphs separated by `\n\n`. The component respects that paragraph break and renders the second paragraph as a subordinate 14px reminder. The description stays 16px. The presentation-only eyebrow changed from **Sokong rumah Allah** to **Salurkan sumbangan anda**; no CMS field was added for the decorative label. Heading font sizes and layout structure remain unchanged.

The refinement used **one new `drafts.siteSettings`**, cloned from the complete published singleton with every other field preserved. Fresh pre-create guards confirmed the expected settings revision, zero drafts, 53 assets and the approved editorial counts. Exact authenticated draft read-back, full schema validation and three reference checks passed; the draft was then reviewed against the owner-approved copy. Fresh draft/published revision checks passed immediately before publication of **siteSettings only**.

| Stage/document | Exact revision |
| --- | --- |
| First publication: siteSettings and program-dapur-zohor-barakah | `SSdKRdF7e0XIFT3zzFziKH` |
| Final donation-copy draft: drafts.siteSettings | `chGo6kzbOkh09ebDsClON0` |
| Final published siteSettings | `SSdKRdF7e0XIFT3zzGU8xL` |
| Final published Program, unchanged | `SSdKRdF7e0XIFT3zzFziKH` |

Authenticated post-publication comparison found exactly the approved payload: heading/copy changes only. **All 43 other published content documents** and **all 53 image assets** retain their full payloads/revisions. No other record was published and no asset was uploaded during refinement.

## Final remote state

| Item | Verified state |
| --- | --- |
| Drafts | **0** |
| Published Program | **1**, active ongoing Dapur |
| Published Announcement | **0**, intentionally empty |
| Published News | **0** |
| Image assets | **53** |
| siteSettings.ncrService | Published |
| siteSettings.donationInfo | Published with the revised approved copy |
| Three approved image references | Resolved |
| Unrelated documents and artwork | Unchanged |

NCR asset: `image-62bee78573fc94f3a232528eefff834fa7ed11b4-1080x761-png`.
Dapur asset: `image-1a4abfdd734f4ef7b74aa4e8bdf3b0a5adb3d334-1131x1600-png`.
General QR asset: `image-6ba112c3ffc0107ea20e277aa11ff0729eba926b-853x853-png`.

## Final validation

| Check | Result |
| --- | --- |
| npm run lint | PASS, no lint warnings/errors |
| npm run build | PASS, compilation/typecheck/prerender; all six public routes retain five-minute revalidation |
| git diff --check | PASS |
| Full relevant automated suite | **124 passed, 0 failed**: public 27, homepage 41, migration 17, historical publication 15, information/ongoing/current-parity 24 |
| Outage/malformed/auth/query tests | PASS in the full suite, including explicit outage rendering, no invented QR/officers/mock editorial, and errors never suppressed |
| Sanity schema extraction | PASS, local closeout artifact; no schema deployment |
| Full current document/schema/reference validation | PASS, zero errors/warnings; both current settings and Program validated |
| npm run public-content:verify:current | PASS; all 43 historical base payloads and 50 historical source hashes preserved; declared settings additions strictly validated separately |
| npm run homepage-content:verify | PASS; raw/eligible Announcement 0, Program 1, News 0 |
| Authenticated final Sanity check | PASS; final counts/revisions/reference resolution and unrelated revision comparison |
| Public route smoke | PASS; homepage and all five public routes HTTP 200 |
| Fasa 5.1 route regression | PASS; four other public main sections identical to baseline; Hubungi base main identical after isolating the intentional new NCR section |
| Fasa 5.2 homepage regression | PASS; prayer/lecture/about/contact HTML unchanged; Announcement/News healthy empty sections identical to approved 5.2 baseline |
| Browser bundle boundary | PASS; 10 loaded public scripts contain no server read-layer markers or write-token marker |
| Desktop/mobile visual QA | PASS; no horizontal overflow, balanced three-line heading, readable description and subordinate visible reminder |
| General QR and actions | PASS; loaded original 853×853 artwork, displayed 416×416 desktop and 288×288 mobile; contact action reaches #contact; open-image link retains the full original URL and 44px target |
| Browser warnings/errors | None observed |

QA sizes: **1440×1000 desktop** and **375×1100 mobile**. Heading sizes stay **52px desktop / 32px mobile**. The navy/gold composition, card hierarchy and spacing remain balanced. No physical-device payment or banking transaction was performed.

Current public inventory fingerprint: `7153171802bad56bacd0d4ad09bf94197c9c9f8f5518ee3280cf030d5680e336`.
This is current-state verification, not a replacement Fasa 4.3 approval fingerprint.

An outdated running preview briefly regenerated old component output into the shared build directory. Only the verified local project preview processes were restarted, followed by a fresh successful build. Final QA and smoke used the refreshed production preview at **http://127.0.0.1:3005/#donations**. There is no unresolved content, validation or visual conflict.

## Preserved boundaries and evidence

- Existing homepage editorial mocks were never seeded or published.
- Genius Aulad is pending unresolved required website publishedAt; no News/image seeding.
- Qiam/Bubur Asyura remains HOLD because the source is promotional/invitation material.
- Announcement intentionally empty.
- Facebook remains curated/manual; no importer implemented.
- Jadual Kuliah remains outside this phase; Lecture Generator Publish disabled.
- No Fasa 5.3, Supabase, admin, campaign, payment gateway or other subsequent phase work.
- Original Fasa 4.3 manifests, migration/publication approval and production mutation implementation remain unchanged. Historical tests load locked tagged evidence and reject use of historical approval with today's schemas.
- First dry-run JSON is retained unchanged; draft-seeding/source/batch reports distinguish historical stages from the final published state.

Supporting current evidence is stored locally outside the repository in the task outputs: authenticated before/after/refinement-review JSON, schema-phase-5.2a-closeout.json, phase-5.2a-final-route-smoke.json, phase-5.2a-final-browser-qa.json, phase-5.2a-final-donation-desktop.png and phase-5.2a-final-donation-mobile.png. These are verification artifacts, not browser fixtures or CMS production records.

## Files in the Fasa 5.2A checkpoint

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/EDITORIAL-CONTENT-PREPARATION.md`
- `docs/EDITORIAL-DRAFT-SEEDING-DRY-RUN.json`
- `docs/EDITORIAL-DRAFT-SEEDING-RESULT.md`
- `docs/EDITORIAL-FIRST-DRAFT-BATCH.md`
- `docs/EDITORIAL-PUBLICATION-CLOSEOUT.md`
- `docs/EDITORIAL-SOURCE-REGISTER.md`
- `docs/PROJECT-JOURNEY.md`
- `docs/PROJECT-STATE.md`
- `docs/PUBLIC-CONTACT.md`
- `docs/ROADMAP.md`
- `docs/SANITY-CONTENT-MODEL.md`
- `docs/SANITY-HOMEPAGE-CONTENT.md`
- `package.json`
- `scripts/public-content/css-test-stub.mjs`
- `scripts/public-content/current-base-parity.mjs`
- `scripts/public-content/current-verify.mjs`
- `scripts/public-content/homepage-content.test.mjs`
- `scripts/public-content/information-content.test.mjs`
- `scripts/public-content/next-image-test-interop.mjs`
- `scripts/sanity-migration/publication.test.mjs`
- `src/app/page.tsx`
- `src/components/public/contact-details.tsx`
- `src/components/public/donation-section.tsx`
- `src/components/public/homepage-editorial.tsx`
- `src/components/public/ncr-service.tsx`
- `src/components/public/public-information.module.css`
- `src/lib/public-content/cms/homepage-adapters.ts`
- `src/lib/public-content/cms/homepage-queries.ts`
- `src/lib/public-content/cms/homepage-types.ts`
- `src/lib/public-content/cms/information-adapters.ts`
- `src/lib/public-content/cms/information-types.ts`
- `src/lib/public-content/cms/queries.ts`
- `src/lib/public-content/cms/server.ts`
- `src/lib/public-content/contact.ts`
- `src/sanity/schemaTypes/program.ts`
- `src/sanity/schemaTypes/siteSettings.ts`

The list includes the previously approved uncommitted architecture/preparation work plus final presentation copy, current-state documentation and closeout record. No source artwork, mock module, Lecture Generator or historical production mutation file is changed. Stop after this checkpoint.
