# Homepage editorial — Fasa 5.2

**Current checkpoint: Fasa 5.2B completed.** Published homepage: 1 Program, 1 News, 0 Announcement. Optional CMS image/eventDate support is live; BULETIN MTU copy approved. Earlier phase/review sections below are historical. See [publication/closeout record](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).


**Current published state: Fasa 5.2A completed, 1 ongoing Program / 0 Announcement / 0 News.**
Fasa 5.2B News image rendering is implemented locally for review; the approved Genius Aulad draft remains unpublished. See the final Fasa 5.2B section below.
See the final section and [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md).
The original Fasa 5.2 inspection/validation below records its historical empty-state checkpoint.

Fasa 5.2 completed and approved, based on Fasa 5.1 commit
`5125ba46a52ddfd2a7d790fc8c490b427662133a` and tag
`phase-5.1-sanity-public-content`. This work connects only Pengumuman, Program
and Berita & Aktiviti. Technical review and the user's manual visual review of
the real current empty-state homepage are approved. The empty state is intentional.
Checkpoint: `phase-5.2-homepage-editorial-integration`; resolve the tag for the
final commit hash. The user authorized commit/push/tag after final closeout checks.
No content seeding, production writes or publication are included.

## Content inspection — 2 October 2026

Token-free, non-CDN, published-perspective reads of project `2o95jmms`,
dataset `production`, API `2026-09-01` return:

| Document type | Published documents | Homepage eligible |
| --- | --- | --- |
| announcement | 0 | 0 |
| program | 0 | 0 |
| newsPost | 0 | 0 |

No approved published production content is available for these sections.
This public read cannot establish whether private drafts exist. Publication
does not itself prove human editorial approval when documents are added later.

The inspected local mock module `src/lib/homepage-content.ts` contains:

- Pengumuman: “Ruang makluman rasmi masjid”, explicitly labelled example content.
- Program: “Gotong-royong komuniti” (10 October 2026, 8:30 pagi),
  “Bicara keluarga sakinah” (17 October 2026, 9:00 pagi), and
  “Kelas asas al-Quran” (24 October 2026, 10:00 pagi).
- Berita & Aktiviti: “Sorotan program komuniti”, “Pengisian ilmu di masjid”,
  and “Makluman untuk jemaah”, all dated “Kandungan contoh”.

These entries are unapproved mocks. The module remains unchanged for provenance
and for the out-of-scope prayer/lecture examples. Its editorial entries are
neither migrated nor used as runtime CMS fallback.

## Read architecture

`src/app/page.tsx` is an async Server Component. It awaits
`getHomepageEditorial()` in `cms/homepage-server.ts`, which reuses the
Fasa 5.1 transport policy and 300-second constant. No browser fetch, token,
draft preview, webhook or mutation endpoint is introduced.

One stable GROQ bundle projects the three document types, with explicit
`drafts.**` and `versions.**` exclusions. The client pins
`perspective: "published"`, `token: undefined`, `useCdn: false`,
an eight-second timeout and zero SDK retries. Next owns freshness:
`cache: "force-cache"`, `next.revalidate: 300`,
tag `public-content:homepage-editorial`, and route `revalidate = 300`.
ISR can serve stale content while it refreshes; this is a five-minute
revalidation interval, not an exact wall-clock publication guarantee.

The typed adapter validates the projected bundle and every candidate before
filtering or limiting. Empty lists are valid; missing/null lists, invalid
identities, duplicates, required text, controls, dates, chronology, unknown
news categories or unsafe CTA URLs raise `PublicContentError`. Authentication,
configuration and query errors remain errors. Validation applies to fields
the homepage consumes; unrendered full article/body/image fields remain under
Studio schema validation.

| Section | Eligibility | Ordering and limit |
| --- | --- | --- |
| Pengumuman | Published, active, publishedAt <= server time; no expiry or expiresAt > server time | displayOrder ascending, publication descending, ID ascending; one |
| Program | Published, active; upcoming start or explicit end still in future | displayOrder ascending, start ascending, ID ascending; three |
| Berita & Aktiviti | Published, publishedAt <= server time | publication descending, ID ascending; three |

An already-started program is retained only when its explicit end is still
in the future. A program without an end stops qualifying once its start has
passed. `newsPost` has no `isActive` or `displayOrder` field; neither is invented.
Dates and times use Malay labels and `Asia/Kuala_Lumpur`. Temporal eligibility
is recalculated when the page regenerates, using a stable cached query rather
than adding a changing clock parameter to its cache key.

## Empty state, outage and presentation

A healthy empty CMS response has source `sanity`. The existing announcement
shell and program/news section headings remain visible with neutral “Belum ada”
messages. No mock dates, mock program cards or mock news cards are shown.

Temporary transport/408/429/5xx failures alone use an explicit local UI fallback:
`source: "unavailable"`, null announcement and empty program/news arrays.
It renders “tidak tersedia buat sementara waktu” messages and emits the existing
safe server warning. This fallback contains no editorial facts. Malformed
content never falls back. Next may continue serving an earlier valid cached page
when regeneration fails; errors remain visible in server diagnostics.

The three presentation components retain the original section/container/grid
classes, typography, cards, spacing rules, reveal behavior, heading hierarchy,
decorative `aria-hidden` attributes and accessible announcement link. Optional
category/CTA values are not invented; absent categories omit badges, and the
existing static contact arrow remains when no editorial CTA exists.
The news visual remains the existing decorative MTU card visual; optional CMS
images and full article pages are outside this phase.

No stylesheet, design-system component or asset is changed. With zero real
documents, fewer cards naturally mean a shorter page; preserving fake mock
cards to imitate the populated layout would misrepresent production content.

## Completed scope and future content boundary

Real content requires a separate controlled preparation/seeding step, if the
owner chooses to populate these sections: confirmed wording and dates, owners,
active/order controls, expiry and optional CTA/category values; draft creation,
Studio review, then explicit publication approval. No seed script or production
documents are created by Fasa 5.2 frontend integration.

Fasa 5.1 routes and their approved fallback data remain unchanged. Jadual Kuliah
and prayer times remain local/mock. Lecture Generator Publish stays disabled.
At the historical Fasa 5.2 checkpoint, Fasa 5.2A preparation and Fasa 5.3 had not started. Fasa 5.2A is now completed as recorded below. Supabase, admin,
campaign and payment work is untouched. Existing homepage mocks remain excluded
from CMS production.

## Verification

Completed checks on 2 October 2026:

| Check | Result |
| --- | --- |
| Lint and production build | Passed; homepage prerender manifest records revalidate 300 seconds |
| Automated tests | 99 passed: 41 homepage, 27 existing public-content, 17 migration, 14 publication |
| Published homepage read | Passed; raw and eligible counts 0 / 0 / 0, no fallback warning on healthy empty data |
| Existing public parity | Passed; 43 approved payloads, 50 approved image hashes, no mismatches |
| Production HTTP smoke | Homepage and five public routes return 200 |
| Protected presentation | Five route main HTML and five out-of-scope homepage section HTML identical to baseline |
| Local Next runtime fixtures | Populated: 200, one announcement/three programs/three news cards; outage: 200 with explicit unavailable messages and safe server warning; malformed: 500 with PublicContentError |
| Browser bundle boundary | Loaded public homepage scripts omit the new server read-layer query/adapter markers |
| Whitespace and scope | Passed; no schema, CSS, asset, Fasa 5.1 route/read-layer, mock-source or lecture-generator edits |
| Manual visual QA | User approved the real current empty-state homepage after manual browser review |
| Automated responsive screenshots | Not generated: sandbox denied installed browser execution; no automated visual result is claimed |

Local runtime fixtures use an isolated development copy with fetch interception
only at the homepage read query. Synthetic values exist in the local harness
only; they never reach Sanity. Production HTTP checks use the real published
dataset and the production build. The user completed and approved manual visual
QA, resolving the remaining visual gate without claiming automated screenshots.

- `npm run homepage-content:test`: query, eligibility/order, strict validation,
  transport fallback/error handling and server-rendered presentation fixtures.
  All populated fixtures are synthetic and in memory only.
- `npm run homepage-content:verify`: fresh token-free published read; reports
  raw/eligible counts, never writes, and fails on malformed projected content.
- Existing `public-content:test`, migration/publication tests and
  `public-content:verify` protect the Fasa 5.1 baseline.
- Lint, build, diff whitespace checks and production public-route HTTP smoke.
- Responsive screenshot verification requires a browser launch. In this session
  the sandbox denied both Playwright and native browser launch even after
  explicit browser read permission; no new visual screenshots are claimed.
  The user subsequently approved the current empty-state presentation manually.

## Fasa 5.2A completed — current homepage contract

Fasa 5.2A completed pada 3 Oktober 2026. Checkpoint: `phase-5.2a-editorial-public-information`; resolve tag untuk hash commit akhir.
Published Sanity: 0 drafts, 1 Program, 0 Announcement, 0 News, 53 image assets.
Dapur Zohor Barakah ialah Program pertama, active dan ongoing tanpa tarikh tamat rekaan.
NCR evergreen dan general mosque DuitNow QR published melalui siteSettings.
Typed server-only read layer kekal published-only, token-free dan revalidate 300 saat.
Healthy empty Announcement/News disengajakan; outage tidak mencipta editorial/QR/contact fakta,
dan malformed/auth/query failures kekal visible errors. Mock editorial tidak diseed.
Genius Aulad pending required publishedAt; Qiam/Bubur Asyura HOLD.
Dapur-specific QR kekal berasingan; QR-only asset excluded/unclassified.
Facebook curated/manual, tiada importer. Jadual Kuliah local/mock;
Lecture Generator Publish disabled dan Fasa 5.3 belum bermula.
Historical Fasa 4.3 manifests, approval payloads dan mutation guards kekal immutable.

Homepage Program heading is **Program dan inisiatif**; the first card is **Dapur Zohor Barakah** with **Inisiatif berterusan** and no invented time metadata. Announcement and News remain intentionally empty. The existing responsive card grid/order is preserved.

Final public donation copy:

- Presentation eyebrow: **Salurkan sumbangan anda**.
- CMS `donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- CMS `donationInfo.copy`, paragraph 1: **Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.**
- CMS copy, paragraph 2: **Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.**

Copy uses the existing text field with a blank-line paragraph separator. No decorative CMS field added.
The reminder is a separate 14px paragraph; description stays 16px. Existing heading sizes,
navy/gold layout, QR artwork/reference/alt/caption and both actions remain intact.

Controlled temporary outage tests retain explicit empty editorial/availability messages and no invented content; malformed/auth/query failures remain errors. Fasa 5.2 empty Announcement/News sections and protected prayer/lecture/about/contact HTML remain identical to the baseline. See [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md).


## Fasa 5.2B — real CMS News image rendering, pending final approval

The production News query now projects optional image alt text and the dereferenced asset ID, URL and intrinsic dimensions. A malformed scalar is retained by coalesce for validation, rather than being silently projected to null. Draft/release exclusions are unchanged.

HomepageNews carries image: PublicImage | null. The homepage server passes its configured dataset asset base to the adapter, which reuses the established mapImage validator. An absent/null image is valid. A broken reference, missing alt, foreign dataset/URL or invalid dimensions raises PublicContentError before eligibility filtering or limiting. The current-state and homepage read-only verifiers use the same configured image base.

HomepageNewsSection now renders PublicImage for records with an image. The existing Sanity width-only CDN loader resizes with fit=max; browser object-fit: cover and centered positioning crop only the presentation. The existing relative visual area reserves 10rem (160px), with fill and responsive sizes. No crop/hotspot/source editing or schema change. Records without images keep the existing aria-hidden navy MTU decoration. The grid, card body, typography, spacing and section layout remain unchanged.

Production is still server-only, token-free, published-only and revalidated every 300 seconds. Healthy empty News stays empty; temporary outages show the established explicit empty/unavailable UI. Malformed/auth/query failures remain visible.

### Verification — 3 October 2026

- Lint, final production build/TypeScript and git diff --check pass.
- Relevant automated tests: **98 passed**, including six new News image cases, Fasa 5.1/5.2 regressions, no-image rendering and outage/malformed/auth/query policy tests.
- Read-only current-state Sanity verification passes: historical base parity remains protected, NCR/donation intact, 1 Program / 0 Announcement / 0 News / 55 image assets.
- Authenticated read-back confirms the complete Genius Aulad draft and revision **SSdKRdF7e0XIFT3zzGrX6W** unchanged, publishedAt absent; all 44 published content records and 55 assets unchanged. No Sanity writes.
- Homepage plus all five Fasa 5.1 public routes return HTTP 200. The production homepage has the healthy empty News message and does not expose the draft.
- An isolated production-built Next app uses the exact real News component, adapter/model, image loader and stylesheet. Its local-only fixture supplies the approved photo/copy, with a second duplicate presentation case lacking an image. The preview label “Belum diterbitkan” is UI-only; no publication timestamp is fabricated. No preview route, data hook or draft perspective was added to the canonical app.
- Browser QA at 1440×1000 desktop and 375×1100 mobile passes: the actual Sanity CDN image loads, exact alt is exposed, centered cover preserves the instructor/children, visual height remains 160px, title wraps to two lines, excerpt to four/five lines respectively, and both image/no-image cards have equal height. Observed CLS is 0 with no horizontal overflow. Initial and loaded card measurements remain stable.

Local review: http://127.0.0.1:3017/review-news-image. Production published-only preview: http://127.0.0.1:3005/.
No publication, commit, push or subsequent-phase work. Stop for final approval.


## Optional News event date — 3 October 2026, approved draft-only addition

The owner approved optional newsPost.eventDate (Sanity date) for the actual activity/event date. publishedAt remains the required actual website publication timestamp; Facebook/source-post dates remain provenance documentation only. No timestamp is inferred from photo clocks.

Only drafts.newsPost-lawatan-genius-aulad-bandar-kinrara.eventDate was set to **2026-05-14**, under a fresh revision-locked guard. Authenticated revision after the patch: **chGo6kzbOkh09ebDsDB6sf**. Title, slug, category, excerpt, all body blocks, approved photo 4 and alt remain unchanged. publishedAt is absent. All 44 published content documents and 55 image assets are unchanged; counts remain 1 draft / 1 Program / 0 Announcement / 0 News.

The query/model carry the optional eventDate. The shared calendar parser rejects malformed/rollover dates in both Studio schema and the adapter. News visible date uses eventDate when present, otherwise the existing publishedAt formatter in Malay/Kuala Lumpur timezone. Filtering and newest-first order remain based on publishedAt. Legacy documents without eventDate remain valid.

The isolated real-component preview uses the actual formatter on the authenticated draft eventDate and displays **14 Mei 2026** at desktop/mobile. No publishedAt placeholder is fabricated. Approved 160px cover image layout is unchanged; no overflow and observed CLS 0. The original source Facebook post provenance remains **14 May 2026, 10:19 AM**, with no inferred timezone or public CMS Facebook time field.

Lint and production build/TypeScript pass. **138 automated tests** pass, including eight new schema/date cases, News images, homepage/public-content, Fasa 5.1/5.2 regressions and migration/publication safeguards. Authenticated draft schema/reference validation has zero warnings and the sole expected pending publication error: **publishedAt: Required**. Current-state and published homepage read verification pass. Historical migration evidence is preserved.

No publication, commit, push or subsequent phase. Stop for final review.

## Fasa 5.2B completed — published homepage current state

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

The preceding draft-only/image/event-date review sections are historical verification records. Final live homepage now shows the approved image and 14 Mei 2026. Desktop/mobile and no-image fallback QA passed; all 138 relevant tests, schema extraction/current validation and six route smoke checks passed. See the closeout record for exact publication revision/time and validation evidence.
