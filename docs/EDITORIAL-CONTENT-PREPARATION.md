# Fasa 5.2A — Preparation history and completed closeout

## Fasa 5.2B completed — current update

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

Owner-confirmed event and Facebook post dates resolved the earlier provenance hold. The exact approved article and original GA-P04 were reviewed in draft, then published with actual website time. The historical 5.2A preparation restrictions and prior draft-only stops below were superseded only by subsequent explicit owner approvals.

## Historical Fasa 5.2A checkpoint and preparation

**State at the Fasa 5.2A checkpoint.** Fasa 5.2A completed pada 3 Oktober 2026. Checkpoint: `phase-5.2a-editorial-public-information`; resolve tag untuk hash commit akhir.
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

Rujuk [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md) untuk current publication/copy/validation. All numbered preparation and dry-run observations below are dated historical stages, including their former stop boundaries; subsequent owner approvals authorized seeding, Studio review, publication and this checkpoint. The frozen dry-run JSON is retained unchanged.


## 1. Recovered Git/project state
Canonical repository: `C:/Users/User/Documents/Codex/2026-09-26/referenced-chatgpt-conversation-this-is-an/work/masjidMTU-website`.
HEAD and remote main: **72506d2f7b6d5fb7a176c7ac848beade4186bfd3**.
Checkpoint: **phase-5.2-homepage-editorial-integration**, remote peeled tag at the same commit; ahead/behind **0/0**.
The working tree was not clean at task recovery: six modified canonical docs and the untracked preparation plan from the earlier preparation pass were present. Those were preserved and updated. Current architecture/docs changes remain uncommitted; no new tag.
Fasa 5.1/5.2 remain checkpointed. Production editorial counts are still **announcement 0, program 0, newsPost 0**. New settings objects are absent.

## 2–3. Facts and updated source register
[EDITORIAL-SOURCE-REGISTER.md](EDITORIAL-SOURCE-REGISTER.md) records every supplied filename, exact dimensions, extracted claims, mapped fields, proposed alt text, approval status, dates and unresolved facts. Seven byte-identical originals and SHA-256 metadata are archived in the local review outputs, outside public assets.
- S01: NCR poster, 1080×761; two officer contacts and common role heading. No source date/service hours/jurisdiction.
- S02: Dapur poster, 1131×1600; Biro Muslimat MTU, launch 28 September 2026, Monday–Thursday 11 am–2 pm, meals from RM6, specified meal components, rice/water refill, variable extra-dish pricing, QR-only/no-cash payment, congregational-Zohor purpose.
- S03: general mosque branded QR, 853×853, labelled mosque/Bukit Jalil, DuitNow/Bank Islam.
- S04: QR-only, 853×853; purpose unresolved.
- S05: Dapur Zohor MTU branded QR, 853×853; initiative payment, not general donations.
- S06: Qiam invitation/post caption, 1798×851; advertised 4 July 2026 at 4.15 am, named Qiamullail/Subuh speakers and topic, advertised refreshments. No completed-report/Bubur Asyura evidence.
- S07: Genius Aulad completed-visit caption/photos, 675×770; school, Ustaz Irfan Muiz and teaching areas. No exact dates or participant count.
The daily menu, October lecture example, JAWI/MAIWP appreciation example and completed Qiam/Bubur Asyura report were **not actually attached**. Only visible captions are transcribed as original caption text; poster summaries are labelled as extracts.
Source publication date, event date and website publication date remain distinct. No timestamp is inferred from “hari ini” or receipt of the screenshots.

## 4. Exact NCR transcription — owner confirmed
| Officer | Name printed on poster | Shared role heading | Phone printed |
| --- | --- | --- | --- |
| 1 | **USTAZ WAN HALIM BIN MD.YUSOFF** | **PENOLONG PENDAFTAR NIKAH, CERAI & RUJU’** | **019 374 9937** |
| 2 | **USTAZ NIK MUHAMMAD FADLAN BIN NIK MAHMOOD** | **PENOLONG PENDAFTAR NIKAH, CERAI & RUJU’** | **011 2937 8366** |
The owner confirmed both exact names/phones and the shared public heading/roles **Penolong Pendaftar Nikah, Cerai & Ruju’ (NCR)**. No individualized appointment is inferred from Organisasi. The final dry-run uses this exact wording.

## 5. Proposed Dapur Program
Full exact fields/copy are in [EDITORIAL-FIRST-DRAFT-BATCH.md](EDITORIAL-FIRST-DRAFT-BATCH.md).
P01: `program-dapur-zohor-barakah`; draft ID `drafts.program-dapur-zohor-barakah`; title **Dapur Zohor Barakah**; category **Inisiatif komuniti**; scheduleType **ongoing**; displayOrder **1**; isActive **true**; venue **Masjid Talhah Bin Ubaidillah**; original S02 poster. The owner confirmed launch 28 September 2026 (Monday), operating days/hours, starting price, refill and QR-only/no-cash payment facts; no end date is invented.
Description includes the source-backed launch date, organizer, purpose, days/hours, starting price/meal, refill, variable extra-dish pricing and QR-only policy within 400 characters. startAt/endAt are omitted because launch has no clock time and no end is supplied. No contact person, room, menu or recurrence is invented. Existing homepage Program cards do not gain an image/detail route in this task.

## 6–7. News candidates and recommendation
**Candidate B / N01 — recommended first:** “Lawatan Sambil Belajar Genius Aulad Bandar Kinrara”, category activity. Proposed excerpt and three-paragraph body accurately report the visit, Ustaz Irfan Muiz, mosque etiquette, Tahiyatul Masjid demonstration, donations teaching and appreciation to school management. No participant count or date is invented.
The owner approved Genius Aulad as the first News candidate. Event/source dates remain unknown; S07 has no visible Facebook timestamp. Required website publishedAt is neither sourced nor explicitly approved, so **STOP for this News: no draft or News image upload is included in the current dry-run**. A separately reviewed exact News plan is required once the date is resolved.
**Candidate A — held:** working title “Laporan Qiam Sebelum Fajar, Hijrah Sebelum Ajal”, potential category activity. The register/batch document supplies provenance title/excerpt/advertised details and image/alt mapping. A completed-report body cannot be responsibly written: S06 is an invitation and does not verify completion or Bubur Asyura. No Candidate A draft is included. An actual completion report/photo is required before completing it.
News B is recommended because its source already describes a completed visit.

## 8. Pengumuman
Remains **0**. No filler records from NCR, Dapur or completed activity reports. No qualifying official notice is evidenced among the supplied files.

## 9. Final scheduled / ongoing Program architecture
Optional schema scheduleType enum: scheduled | ongoing; legacy/missing means scheduled.
Scheduled retains required startAt, optional endAt not before start and existing upcoming/bounded-event eligibility.
Ongoing may omit both dates. isActive controls visibility; supplied start/end bounds are respected (not before genuine start, not after genuine end). No fabricated end date or moving startAt to simulate recurrence.
All projected candidates are strictly validated before filtering/limiting, including inactive records and records beyond the card limit. Sorting remains deterministic by display order, known start and ID; three-card limit remains.
Typed model exposes normalized scheduleType and nullable time. Homepage heading **Program dan inisiatif**; ongoing date label **Inisiatif berterusan**, with no time metadata. Existing grid/cards/typography remain.

## 10. NCR schema/read/UI
Optional `siteSettings.ncrService`: heading, introduction, officers(name/role/phone), optional poster.
Central published settings GROQ → strict information adapter → typed server read → ContactDetailsView/NcrServiceView.
Public destination **/hubungi#nikah-cerai-ruju**, after office contact/hours and before Lokasi. Officers are normal HTML headings/text/tel links with accessible labels; poster is supplementary and optional. Office data remains separate. No top-level nav item.
Absent objects render no invented service. Transport fallback retains only previously approved local office data, with no new officer facts. Populated malformed data raises an error.

## 11–13. Sumbangan and QR architecture
Optional `siteSettings.donationInfo`: heading, copy, recipientLabel, primaryQr. No secondary QR field is added because no approved secondary general-donation requirement exists.
Central published settings query/read/mapping → semantic DonationSection at **/#donations**, preserving existing Sumbangan CTA and navy/gold/pattern.
Full artwork is rendered on white with original aspect ratio/dimensions, meaningful alt/caption, and **Buka imej QR** in a new tab. Next Image is **unoptimized**; source has no quality/format parameters; crop/hotspot transforms are rejected. No re-encoding, photographic loader, gateway, transaction tracking, receipts or fixed amount.
S03 is general donation artwork. S05 is Dapur-specific payment artwork, reserved for a future initiative detail surface. S04 remains unconfirmed and excluded.
Healthy absent donation objects preserve the approved existing contact-based panel. Temporary outage adds an explicit availability message and never invents QR data. Malformed/auth/query failures stay errors.
Both information reads remain **server-only, token-free, published-only, 300-second revalidation**.

## 14. Historical / current verification
The original 43-document manifest, publication approval, migration plan and production mutation guards are **unchanged**.
`public-content:verify` remains the exact payload check; new `public-content:verify:checkpoint` is an explicit alias.
New `public-content:verify:current` checks typed public/editorial reads, full current settings/editorial schema validation, original 50 image hashes, exact historical base payloads and scope count. Only the two declared, strictly validated settings extensions are allowed; unknown settings fields and other historical drift still fail. It reports current extensions and does not claim editorial approval.
Historical publication tests now recover fixed tagged schema files, verify their exact raw hash, reconstruct the separately locked CRLF fixture **in tests only**, and verify the approved fingerprint. Production code still hashes raw current bytes; it does not normalize or accept new fingerprints. Added test confirms today's schemas **cannot** reuse historical 4.3 publication authorization. No manifest was rewritten to make current content appear identical.

## 15. Files changed
33 repository files, including previously pending preparation docs:
- Documentation: README.md; docs/ARCHITECTURE.md, DECISIONS.md, PROJECT-JOURNEY.md, PROJECT-STATE.md, ROADMAP.md, EDITORIAL-CONTENT-PREPARATION.md, EDITORIAL-SOURCE-REGISTER.md, EDITORIAL-FIRST-DRAFT-BATCH.md.
- Schema: src/sanity/schemaTypes/program.ts, siteSettings.ts.
- Read/model: src/lib/public-content/contact.ts; cms/homepage-adapters.ts, homepage-queries.ts, homepage-types.ts, queries.ts, server.ts, information-adapters.ts, information-types.ts.
- Presentation: src/app/page.tsx; src/components/public/contact-details.tsx, homepage-editorial.tsx, donation-section.tsx, ncr-service.tsx, public-information.module.css.
- Validation/scripts: package.json; scripts/public-content/homepage-content.test.mjs, information-content.test.mjs, current-verify.mjs, current-base-parity.mjs, css-test-stub.mjs, next-image-test-interop.mjs; scripts/sanity-migration/publication.test.mjs.
No public source assets, other four public-route components/pages, Lecture Generator files, lecture schemas, historical manifests or production mutation implementation changed. Local review harness/assets/screenshots are outside the canonical repository.

## 16. Validation results
| Check | Result |
| --- | --- |
| npm run lint | Pass, no warnings/errors |
| npm run build | Pass, type check and production prerender; all six public routes revalidate at 5 minutes |
| git diff --check | Pass |
| Automated tests | **124 passed, 0 failed**: public 27, homepage 41, migration 17, historical publication 15, new information/ongoing/current-parity 24 |
| Schema extraction | Pass; local artifact schema-phase-5.2a.json |
| Schema validation | Pass, empty error/warning list |
| Historical published parity | Pass: 43 payloads, 50 hashes, 25 organisation slots, vacancy/photo parity, 15 Surau (3 Jumaat/12 Biasa), 12 gallery images/order, 5 Profil images, contact/social parity |
| Current content verification | Pass; both optional settings objects absent; full current singleton schema validates with no warnings |
| Homepage published queries | announcement 0 / program 0 / newsPost 0; healthy empty state |
| Production-build route smoke/regression | Homepage + five public routes HTTP 200; five public main sections identical to approved baseline; prayer/lecture/donation/about/contact homepage sections identical when optional objects absent |
| Browser bundle inspection | Server read layer not shipped to browser |
| Controlled runtime outage | HTTP 200, explicit unavailable messages, no mock editorial cards |
| Controlled malformed runtime | HTTP 500, visible PublicContentError; no fallback suppression |
| New information failure tests | Missing optional objects safe; malformed officer/QR/asset failures visible; auth/query errors never fallback; outage invents no QR/officers |
| Responsive browser review | 375 / 768 / 1440 widths, no horizontal overflow; ongoing/NCR readable; QR loaded at full ratio, 288px mobile and 416px tablet/desktop, no srcset/optimization |
| QR source preservation | Seven original archives byte-identical; raw review QR HTTP response matches S03 SHA-256 exactly |
| Published production inventory | Fingerprint unchanged throughout verification: 4401cdcc16c2d20f5dbecc3d1a236fd2f3c4f1dadd1653a6143b46ed74c0ec40; still 43 documents + 50 image assets |
| Git checkpoint / remote | No commit/push/tag; baseline HEAD/origin main remain synchronized |

The architecture validation above used token-free published reads, which cannot establish private draft inventory. A subsequent authenticated read-only raw query for the exact seed dry-run, completed 2026-10-03 03:40:32 UTC, found no editorial draft/version documents and no settings draft. It confirmed the unchanged 43 published base documents and 50 image assets; published settings revision is `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb`. No Sanity mutation/upload API was called. No banking transaction or physical-device QR scan was performed. The owner subsequently approved the proposed general-donation presentation; this approval does not authorize uploads or drafts.

## 17. Exact proposed first draft-seeding batch
After separate explicit approval of the final dry-run, **3 original assets + 2 create-only drafts**:
1. Assets: S01 NCR poster; S02 Dapur poster; S03 general mosque full branded QR.
2. New P01 ongoing Program `program-dapur-zohor-barakah`.
3. Create absent `drafts.siteSettings` from the exact existing published singleton snapshot, adding only ncrService + donationInfo and preserving original fields. Refuse existing drafts, revision drift or ID/slug conflicts; do not patch the published document.
N01 News and its image are excluded because required publishedAt remains unresolved.
Zero announcements, Candidate A, bare QR, Dapur-specific QR, screenshot News hero, menus, lectures, JAWI/MAIWP examples or publications. Full exact copy/fields/assets are in [EDITORIAL-FIRST-DRAFT-BATCH.md](EDITORIAL-FIRST-DRAFT-BATCH.md).
The [exact JSON](EDITORIAL-DRAFT-SEEDING-DRY-RUN.json) freezes current revision, complete field values and three asset bindings. Both proposed drafts validate locally with no errors/warnings using planned offline references. Source bytes/hashes/dimensions match; settings base fields are identical. The held News fails local validation exactly at required publishedAt, as expected. This proposal is **not an authorized executable batch** until the owner explicitly approves this exact dry-run.

## 18. Owner confirmations and historical dry-run stop point
NCR names/phones/common role, Dapur facts and general-donation presentation are owner confirmed. Genius Aulad is the first approved News candidate, with no invented dates or participant count. Its required website publishedAt is still missing; do not seed it or upload its image. Original Facebook date, if later sourced, belongs separately in provenance.
At dry-run preparation, explicit approval of [the exact final dry-run](EDITORIAL-FIRST-DRAFT-BATCH.md) was required. The owner subsequently authorized only those three uploads and two draft creates. They are now verified; publication and Git checkpoint remain unauthorized. Approval of architecture/content facts alone was not treated as write authorization.
Candidate A requires a completed Qiam/Bubur Asyura source; standalone News images and missing contextual examples may be supplied later. QR-only purpose remains unresolved and need not delay this proposed first batch.
Stop before all asset uploads, Sanity writes/drafts/publication and Git checkpoint. **Fasa 5.3 and Lecture Generator Publish remain untouched/disabled.**

## Future editorial workflow — documentation only
Facebook stays the fast/social channel; website is curated official reference.
Future: Facebook Page → import/inbox → suggested category → human review → Sanity draft → manual publication → website.
#MTUPengumuman / #MTUProgram / #MTUBerita / #MTUKuliah are hints, never publication authorization.
Daily menus/routine promotions/every Friday stream may remain Facebook-only.
Future persistent “Siaran Langsung Jumaat” CTA may link to the official Facebook page without claiming live status, khatib or time.
Monthly lectures stay dedicated future scope. Religious program lifecycle: upcoming Program, then separately sourced post-event News. JAWI/MAIWP classification follows intent. No Facebook API/tokens/webhooks/import job/autopublication was implemented.

## Fasa 5.2A final approved public copy and historical content holds

Final public donation copy:

- Presentation eyebrow: **Salurkan sumbangan anda**.
- CMS `donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- CMS `donationInfo.copy`, paragraph 1: **Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.**
- CMS copy, paragraph 2: **Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.**

Copy uses the existing text field with a blank-line paragraph separator. No decorative CMS field added.
The reminder is a separate 14px paragraph; description stays 16px. Existing heading sizes,
navy/gold layout, QR artwork/reference/alt/caption and both actions remain intact.

Genius Aulad date remains unresolved; no News draft/image upload. Qiam/Bubur Asyura remains HOLD. No Announcement filler. Facebook curation is manual; no importer. Dapur-specific QR remains reserved separately, QR-only excluded/unclassified.
