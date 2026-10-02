# Homepage editorial — Fasa 5.2

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
Fasa 5.2A content preparation and Fasa 5.3 have not started. Supabase, admin,
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
