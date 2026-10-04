# Architecture Projek

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

## Preparation record before controlled execution (historical)

4 October 2026 (+08:00), baseline 27e23a2528c72144a1fe7e0d5ecbd45dc3343912 /
phase-5.3a-lecture-generator-ux. Authenticated Studio month loading prefers draft,
then published, then a local snapshot from published active rules. With no rules,
the new month is empty; demo data is never migrated.

Manual Save Draft prepares a schema-validated, fingerprinted plan. The save service
implements original-asset reuse/upload, guarded create/update and authenticated
exact read-back, but the compiled first-write approval is unset. **No production
lecture save/upload, publish, commit or push has occurred.** Publish remains
disabled; public /kuliah and homepage lecture integration remain outside scope.

State protection covers dirty month switches, revision conflicts and explicit
reload/review. Monthly snapshots preserve speaker name/photo/topic; optional
lectureSession.photoLayout retains existing portrait fit/position/zoom/inset.
Special posters preserve the locked 5.3A takeover/cover/contain/position behavior.
Only showInfaq is persisted; compact QR resolves from published
siteSettings.donationInfo.compactQr, never branded primaryQr.

First recommendation: independently QA'd original October 2026 source, 34 sessions,
one draft and 29 original portraits. Complete payload, asset IDs/hashes, source
provenance, counts and exact approval fingerprint are in the dry-run file.
Production remains 0 drafts / 0 lecture documents / 45 published non-asset records /
55 images / 1 Program / 0 Announcement / 1 News.

Fresh refinement QA now passes on authenticated desktop/mobile Studio and the
isolated compact-QR fixture. Actual PNG/PDF exports were reviewed for 2-cell,
3-cell and larger eligible groups. The original blocked-browser review remains
historical; these are new browser/export proofs. No later phase has started.

Operational Studio UI is English-first, retaining Malay Masjid/Kuliah terms;
generated poster output stays Malay. Weekday labels use measured painted-bound
centering with unchanged fonts/pills/grid. Proposed optional
siteSettings.donationInfo.compactQr is exclusive to Jadual Infaq. Missing compact
configuration omits the panel with a warning, with no branded QR fallback.
Public donationInfo.primaryQr and every public setting remain unchanged.
Separate QR upload/settings draft/review/publication approvals precede the
desired October Infaq output. No QR or production settings write has occurred.

[Refinement, proofs and setup gates](LECTURE-UI-COMPACT-QR-REFINEMENT.md).

[Persistence architecture and validation](LECTURE-DRAFT-PERSISTENCE.md) · [Exact first-save payload](LECTURE-FIRST-SAVE-DRY-RUN.json).

## Historical record through Fasa 5.3A

Dokumen ini merekodkan architecture semasa dan susunan fasa berikutnya.
Fasa 4.1 menyediakan embedded Sanity Studio; Fasa 4.2/4.2A menambah content
model editorial dan prototype kuliah. Fasa 4.3A menyediakan mapping, validation
dan dry-run migration. Fasa 4.3B menambah 43 draft editorial dan 50 aset imej
unik dalam production, tanpa konflik atau penerbitan. Fasa 4.3C kemudian
menerbitkan 43 dokumen approved. Fasa 5.1 siap menyambungkan lima route
kepada published Sanity melalui typed server read layer, cache lima minit dan
explicit local fallback bagi temporary outage. Local editorial data lima route
kekal fallback sahaja. Fasa 5.2 siap menyambungkan homepage Pengumuman,
Program dan Berita & Aktiviti kepada published Sanity; pada checkpoint 5.2 setiap
jenis mempunyai 0 published documents. Neutral empty states dan explicit
empty UI fallback outage tidak mempromosikan mock editorial.
Jadual Kuliah/waktu solat kekal mock; Lecture Generator Publish disabled.
Empty-state disengajakan dan manual visual review pengguna telah diluluskan.
Mock tidak diseed; tiada production content writes/publication dalam Fasa 5.2.
Checkpoint `phase-5.2-homepage-editorial-integration`.
Fasa 5.2A completed: scheduled/ongoing Program, optional siteSettings.ncrService
dan donationInfo, typed published mapping dan accessible presentation. Dapur ialah
first published Program; NCR dan general mosque QR published. Current counts:
0 drafts, 1 Program, 0 Announcement, 0 News, 53 assets. Checkpoint
`phase-5.2a-editorial-public-information`; historical evidence remains unchanged.
Fasa 5.3 belum bermula.
Plan dan gaps ongoing Program/NCR/QR:
[EDITORIAL-CONTENT-PREPARATION.md](EDITORIAL-CONTENT-PREPARATION.md).
Pangkalan data operasi, dashboard, kempen dan pembayaran belum dibina.

```text
Pengunjung
   ↓
Public Website — Next.js
   ├── Lima public pages — published Sanity → typed adapter → presentation
   │   └── Next cache 5 minit; local fallback bagi temporary outage
   ├── Homepage editorial — published Sanity → typed adapter → presentation
   │   └── Next cache 5 minit; neutral empty states / explicit outage UI fallback
   ├── Homepage Jadual Kuliah / waktu solat — mock/local
   ├── Data operasi — Supabase / PostgreSQL (kemudian)
   └── Kempen — Qurban / Ramadan / Wakaf / Sumbangan (kemudian)

Admin operasi — /admin (kemudian)
Pengurusan kandungan — /studio (Sanity Studio, Fasa 4.1)
Payment gateway, resit dan email — fasa kemudian
```

## Peranan setiap bahagian

- **Next.js:** memaparkan halaman awam dan, pada fasa kemudian, dashboard operasi.
- **Sanity CMS:** mengurus halaman, berita, program dan kandungan editorial.
- **Supabase/PostgreSQL:** menyimpan data operasi seperti penyertaan kempen dan rekod transaksi.
- **Campaign engine:** menggunakan struktur kempen bersama untuk Qurban, Ramadan, wakaf dan sumbangan khas.
- **Sanity Studio:** antara muka editor kandungan pada `/studio`; berasingan daripada dashboard operasi `/admin`.
- **Pembayaran, resit dan email:** tidak termasuk dalam asas ini; akan ditambah selepas proses kempen dibina.

## Prinsip keselamatan

- Jangan letakkan credentials dalam kod atau commit fail `.env.local`.
- Akses data operasi dan tindakan admin perlu disahkan serta diberi kebenaran apabila ciri itu dibina.
- Jangan simpan maklumat kad pembayaran dalam aplikasi.

## Lapisan reka bentuk

Fasa 1 menetapkan token visual, komponen React yang boleh digunakan semula, dan route pratonton `/design-system`. Halaman ini ialah katalog komponen; ia bukan homepage awam. Token dan garis panduan terperinci berada dalam [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## Homepage awam

Homepage menggunakan imej rasmi `public/brand/masjid-dome.jpg` untuk visual kubah
dan derivative `public/brand/masjid-exterior.webp` untuk exterior; JPG asal
dikekalkan. Fasa 5.2 mengubah hanya sumber tiga section editorial kepada typed
server-only published Sanity. Waktu solat dan Jadual Kuliah terus membaca
`src/lib/homepage-content.ts`; mocks editorial asal tidak lagi dirender.
Markup/design tokens/card visuals sedia ada dikekalkan; tiada fetch operasi.

## Sanity Foundation

`/studio` menggunakan official NextStudio dan Sanity authentication. Config,
client dan schema berkongsi env di `src/sanity/env.ts`. Singleton `siteSettings`
ialah schema pertama; pengisian draft berlaku dalam Fasa 4.3B.
Lima public pages kini disambung melalui server-only read layer Fasa 5.1.
Rujuk [SANITY.md](SANITY.md) untuk configuration, singleton dan CORS.

Sanity hanya untuk kandungan editorial/public. Registrations, peserta Qurban,
bayaran, resit dan transaksi Ramadan ialah data operasi Supabase/PostgreSQL
dengan `/admin` berasingan pada fasa kemudian.

## Content model dan migration preparation

Registry akhir 4.2/4.2A mempunyai 11 document types dan 6 support types.
Penjana Jadual Kuliah native ialah prototype dalam memori dengan Publish disabled.
Pada checkpoint Fasa 4, public frontend tidak mengimport client CMS.
Integrasi 5.1 menggunakan server-only boundary; query/token tidak masuk browser.

## Public dynamic content — Fasa 5.1

Query, mapping, visibility/order, original-image composition, caching dan
fallback/error policy berada dalam [SANITY-PUBLIC-CONTENT.md](SANITY-PUBLIC-CONTENT.md).
Fetch berpusat di `src/lib/public-content/cms/server.ts`, presentation menerima
model source-independent. Navbar/Footer dan prototype kuliah kekal source asal.
Homepage editorial Fasa 5.2 menggunakan `cms/homepage-server.ts`, query bundle,
strict adapter dan explicit empty UI fallback, dengan policy/interval 5.1.
Rujuk [SANITY-HOMEPAGE-CONTENT.md](SANITY-HOMEPAGE-CONTENT.md).
Tiada webhook, mutation endpoint atau preview ditambah.

`scripts/sanity-migration/` ialah utility Node berasingan daripada runtime
website/Studio. Ia membaca sumber public diluluskan, membentuk 43 dokumen dengan
ID deterministik, menyemak 50 fail imej dan menjalankan validator schema sebenar.
Dry-run ialah default. Preflight raw/non-CDN menyemak ID known, singleton/slug
conflicts dan reuse aset berdasarkan SHA-1. Mod write create-only kepada
draft IDs, tanpa replace/delete/purge/publish; payload sedia ada yang berbeza
menghentikan writes. Semua 43 sasaran remote kini `skip-identical`.
Laporan mod write berlabel `WRITE-DRAFTS`, tahap preflight sebelum operasi;
JSON merekod mode/stage sebenar. Safety model tidak berubah.

Butiran: [SANITY-MIGRATION.md](SANITY-MIGRATION.md). Tiada production migration
atau asset upload dibuat dalam 4.3A; migration draft dilaksanakan dalam 4.3B.
Controlled Publication editorial selesai dalam 4.3C: 43 published, 0 draft,
50 aset; pada checkpoint itu frontend CMS fetch dan migration kuliah belum dibuat. Tool publication
berasingan menggunakan supported publish actions/atomic guards dan explicit
target/set confirmations. Preview galeri dibetulkan dalam config Studio sahaja,
tanpa perubahan schema source atau payload. Rujuk [SANITY-PUBLICATION.md](SANITY-PUBLICATION.md).
Lecture Generator Publish disabled. Integrasi frontend 5.1 semasa direkodkan di atas;
migration/publication kuliah kekal ditangguhkan.

## Fasa 5.2A — current architecture (3 Oktober 2026)
Program.scheduleType is optional for legacy compatibility: missing means scheduled.
Scheduled dates/eligibility remain as before. Ongoing may omit startAt/endAt;
isActive controls visibility, with genuine supplied datetime boundaries respected.
Homepage heading is Program dan inisiatif; ongoing cards use Inisiatif berterusan
and no time label. Date-only Dapur launch remains in sourced description.

The central published settings query projects optional ncrService and donationInfo.
information-adapters strictly maps them and validates existing contact fields.
getContactContent returns accessible NCR data for /hubungi#nikah-cerai-ruju;
getDonationContent returns the general donation object for /#donations.
Both stay server-only/token-free and reuse 300-second Next caching. Absent objects
are healthy absent; transport outage never fabricates officers or QR artwork;
populated malformed/auth/query failures remain errors. NCR appears between office
information and Lokasi. No top-level navigation item or operational system added.

General QR is a semantic white-surface figure using original src/dimensions and
Next Image unoptimized, with meaningful alt/caption and Buka imej QR action.
No photo loader, crop/hotspot, format/quality transform or payment processing.
Only primary general artwork is modeled; secondary QR is unnecessary for current
requirements. Dapur QR is reserved for a separate initiative detail context.

Historical exact payload verifier remains unchanged, with explicit checkpoint alias.
Current-contract verifier separately validates new information/editorial reads and
checks all historical base payloads, allowing only the two declared settings keys.
It reports extensions and does not certify editorial approval. Publication tests
recover tagged schema bytes and verify locked fixture digests; production approval
manifest and fingerprint guards remain unchanged and reject today's changed schema.
See EDITORIAL-CONTENT-PREPARATION.md, EDITORIAL-SOURCE-REGISTER.md and
EDITORIAL-FIRST-DRAFT-BATCH.md.

## Fasa 5.2A closeout and final donation rendering

Final public donation copy:

- Presentation eyebrow: **Salurkan sumbangan anda**.
- CMS `donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- CMS `donationInfo.copy`, paragraph 1: **Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.**
- CMS copy, paragraph 2: **Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.**

Copy uses the existing text field with a blank-line paragraph separator. No decorative CMS field added.
The reminder is a separate 14px paragraph; description stays 16px. Existing heading sizes,
navy/gold layout, QR artwork/reference/alt/caption and both actions remain intact.

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

Evidence: [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md).

## Fasa 5.2B — published News images and separate event date

The published-only homepage GROQ projects optional eventDate and image alt/dereferenced asset URL/ID/dimensions. The typed adapter reuses mapImage and a shared strict date-only parser. All candidates are validated before filtering/limiting. A malformed projected image is retained for validation, not silently dropped.

Required publishedAt controls eligibility and latest-first ordering. Optional eventDate only changes the displayed Malay date; legacy articles fall back to publishedAt. A date-only value never implies a public event clock time. The CMS schema validates calendar dates and preserves existing publishedAt requirements.

News uses the established PublicImage/Sanity width-only loader and centered object-fit cover inside a reserved 160px frame. No destructive crop or asset editing. Missing images keep the approved decorative frame. Server-only token-free reads, 300-second cache, explicit outage messages, healthy empty states and visible malformed/auth/query failures remain intact.

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

## Fasa 5.3A — local calendar-first editing architecture

Fasa 5.3A **completed dan owner-approved pada 4 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.3a-lecture-generator-ux`; resolve tag untuk commit akhir.
Baseline main/tag: `f4b473b1df54af695599a735a1fb2d1c5d9fd372` / `phase-5.2b-first-news`.
Klik petak poster sebenar memilih tarikh; Enter/Space, fokus dan selected state tersedia.
Poster khas full kini full-bleed dengan cover default, contain alternatif dan posisi atas/tengah/bawah; badge tarikh overlay, sesi asal kekal tersimpan.
Fixture 24/25 berkongsi satu artwork demo. Save Draft/Publish disabled; tiada production
Sanity writes, lecture migration, public /kuliah atau homepage lecture feed. Git checkpoint sahaja; tiada production lecture writes.
Production kekal 45 published documents, 0 drafts, 1 Program, 0 Announcement, 1 News,
55 image assets dan 0 lecture documents. Fasa 5.3B belum bermula.

InteractiveLecturePoster places native accessible date buttons over coordinates shared
with LecturePoster. Both use posterCellRects; only narrow editing previews gain taller
rows. Fixed export snapshot uses the same SVG renderer without interaction chrome.
The selected-day state preserves sessions under a full specialPoster; restoring one
date is explicit and cannot replace other dates. Local original-file catalog uses
SHA-256/data URLs without upload or resize. Authenticated load/save adapters will
round-trip monthly ISO dates, references and existing name/photo snapshots in 5.3B.
Proposed schema adds lectureDay.specialPoster and optional lectureMonth.showInfaq only; no per-day document.

Panel infaq adaptif owner-approved: kumpulan petak tanpa tarikh minimum 2, kumpulan terbesar dipilih dan seri mengutamakan awal bulan. Kandungan kumpulan 4–6 dipusatkan dengan lebar maksimum 3 petak. Toggle Papar ruang infaq ON secara lalai; QR umum asal setempat tidak diubah atau diupload. Cadangan persistence hanya lectureMonth.showInfaq; sumber QR mosque-wide, bukan lectureDay. Tiada Sanity writes/persistence; checkpoint Git sahaja. 5.3B belum bermula.

The shared SVG renderer selects actual no-date groups from the existing compact/noncompact layout. It adds QR/copy to one blank group without altering valid cell coordinates or monthly entries. Preview, PNG and PDF use the same placement helper; the offscreen print snapshot retains fixed print geometry. QR resolves from poster runtime settings; a future authenticated adapter must reuse mosque-wide donation configuration, never persist the local source URL or QR copies in monthly documents.
The published public read layer and five-minute revalidation remain untouched.
See [5.3A architecture and QA](LECTURE-GENERATOR-UX-RECOVERY.md).
