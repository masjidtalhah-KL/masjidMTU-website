# Project State — Masjid Talhah Bin Ubaidillah

Snapshot disemak pada **3 Oktober 2026 (+08:00)**. Dokumen ini ialah ringkasan
keadaan semasa untuk sambungan kerja. Arahan pengguna terkini dan keadaan Git/kod
perlu diperiksa semula; snapshot ini bukan kebenaran automatik untuk fasa berikutnya.

## Fasa dan checkpoint

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

### Rekod checkpoint terdahulu — Fasa 5.2A

Baseline sebelum 5.2A: `72506d2f7b6d5fb7a176c7ac848beade4186bfd3` / `phase-5.2-homepage-editorial-integration`.
Fasa 5.1: `5125ba46a52ddfd2a7d790fc8c490b427662133a` / `phase-5.1-sanity-public-content`.
Lima route Profil/Organisasi/Surau/Galeri/Hubungi kekal published Sanity; approved local content hanya temporary-outage fallback.
Studio review, controlled publication dan desktop/mobile QA telah diluluskan owner.
Final donation copy melalui draft → exact review/schema validation → publish siteSettings sahaja.
Published settings revision `SSdKRdF7e0XIFT3zzGU8xL`; Program revision `SSdKRdF7e0XIFT3zzFziKH`.
43 other published records dan 53 assets unchanged dalam copy refinement.
Rujuk [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md) untuk exact scope, copy, revisions, validation dan checkpoint.
Draft-seeding JSON kekal historical approval evidence; ia bukan current-state inventory.

Fasa 4.1, model Fasa 4.2 dan prototype
Fasa 4.2A telah diluluskan. Checkpoint akhir 4.2/4.2A ialah
`phase-4.2-sanity-content-model` (`f2aa594`).
**Fasa 4.3A preparation/dry-run siap, dikomit/dipush sebagai `ea8dd09`,
checkpoint `phase-4.3a-migration-dry-run`. Fasa 4.3B draft-only production
migration siap: 43 draft, 50 aset imej unik, 0 konflik, 43 `skip-identical`.
Checkpoint draft: `phase-4.3b-draft-migration`. Controlled Publication 4.3C
selesai: 43 published editorial, 0 draft, 50 aset imej, 55 references kepada
50 aset unik, 0 konflik. Checkpoint penutupan
`phase-4.3c-controlled-publication`. Pada checkpoint 4.3C frontend masih
local/static dan Lecture Generator Publish disabled.**

Repository rasmi: <https://github.com/masjidtalhah-KL/masjidMTU-website>.
Commit Fasa 4.1 ialah `d48e36c7c5b43f8d934b3e9ee89ab6aa5785f2b1`.
Resolve tag checkpoint 4.2 untuk hash akhir; sahkan `main`, `origin/main` dan
working tree ketika bootstrap sesi baharu. Hash commit sendiri tidak dimasukkan
ke dokumen dalam commit yang sama.

| Fasa siap | Commit penutupan / bukti Git | Checkpoint tag |
| --- | --- | --- |
| 0 — Foundation | `c8c9252` | Tiada tag ditemukan |
| 1 — Design System, termasuk refinement 1.1/1.2 | `f24b1ee` | `phase-1-design-system` — sasaran tidak sepadan, lihat nota |
| 2 — Homepage, termasuk refinement foto/QA | `4ab8a03`, merge main `d92a571` | `phase-2-homepage` — sasaran tidak sepadan, lihat nota |
| 3.0 — Planning & Asset Mapping | Diluluskan menurut ROADMAP; tiada commit khusus | Tiada tag ditemukan |
| 3.1 — Content & Assets | `12d8bc8` | Tiada tag ditemukan |
| 3.2 — Navigation & Page Shell | `71a2d95` | Tiada tag ditemukan |
| 3.3 — Profil | `9a9c0a3` | Tiada tag ditemukan |
| 3.4 — Organisasi | `d7d93ff` | `phase-3.4-organisasi` |
| 3.5 — Surau Kariah | `61d09f3`, merge main `de64d3f` | `phase-3.5-surau-kariah` |
| 3.6 — Galeri | `5936bfd` | `phase-3.6-gallery` |
| 3.7 — Hubungi | `c9d0d20` | `phase-3.7-contact` |
| 4.1 — Sanity Foundation | `d48e36c` | `phase-4.1-sanity-foundation` |
| 4.2 / 4.2A — Content Model & prototype kuliah | Commit yang dirujuk tag checkpoint | `phase-4.2-sanity-content-model` |
| 4.3A — Migration preparation/dry-run | `ea8dd09` | `phase-4.3a-migration-dry-run` |
| 4.3B — Draft-only production migration & review | Resolve tag untuk commit penutupan | `phase-4.3b-draft-migration` |
| 4.3C — Controlled Publication & closeout | Resolve tag untuk commit penutupan | `phase-4.3c-controlled-publication` |
| 5.1 — Published Sanity public content | Resolve tag untuk commit penutupan | `phase-5.1-sanity-public-content` |
| 5.2 — Homepage editorial published read integration | Resolve tag untuk commit penutupan | `phase-5.2-homepage-editorial-integration` |
| 5.2A — Editorial public information | `91ad9f2` | `phase-5.2a-editorial-public-information` |
| 5.2B — First News, CMS image and event date | Resolve tag untuk commit penutupan | `phase-5.2b-first-news` |

**Ketidakpadanan tag lama:** kedua-dua tag Fasa 1/2 sebenarnya menunjuk ke
`19f3c6c` (penjelasan pattern rasmi), sebelum penutupan Fasa 1 dan implementation
homepage. Jangan gunakan tag itu sebagai snapshot akhir fasa. Tag tidak diubah
dalam tugas ini. Tarikh/rujukan penuh berada dalam [PROJECT-JOURNEY.md](PROJECT-JOURNEY.md).
Fasa 5.1/5.2/5.2A/5.2B siap; Fasa 5.3 dan Fasa 6–12 belum bermula.

## Architecture semasa

- Next.js App Router **16.3.6**, React **19.2.8**, TypeScript, Tailwind CSS 4,
  ESLint; versi tepat dikawal oleh `package.json` dan lockfile. Node >=22.12.
- Route awam: `/`, `/profil`, `/profil/organisasi`, `/profil/surau-kariah`,
  `/galeri`, `/hubungi`. `/design-system` ialah katalog reka bentuk.
- Lima public pages menggunakan `src/lib/public-content/cms/server.ts` dan
  adapter typed; modul tempatan/aset approved kekal fallback. Homepage editorial
  menggunakan `cms/homepage-server.ts`, bundle typed dan cache lima minit.
  Dataset editorial: 1 ongoing Program, 0 Announcement, 1 News; eventDate mengatasi publishedAt untuk display, CMS image optional; empty sections kekal neutral; temporary outage menggunakan
  explicit UI fallback kosong. Waktu solat/kuliah masih mock data daripada
  `src/lib/homepage-content.ts`; editorial mocks lain tidak lagi dirender.
- Embedded Studio rasmi pada `/studio/[[...tool]]`, menggunakan NextStudio dan
  Sanity authentication. Ia tidak menggunakan custom login atau route transition awam.
- Sanity **6.17.0**, next-sanity **13.3.4**, @sanity/client **8.9.0**.
  Konfigurasi berpusat di `src/sanity/env.ts`, digunakan oleh config/client/CLI.
- Project ID `2o95jmms`, organisasi `o5cig7je6`, dataset `production`;
  fixed API version `2026-09-01`. Env: `NEXT_PUBLIC_SANITY_PROJECT_ID`,
  `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`.
  `.env.local` diabaikan Git; hanya `.env.example` dijejak. Tiada token rahsia
  diperlukan dalam browser. Login/CORS origin review telah disemak semasa Fasa 4.1;
  origin deployment sebenar perlu disahkan kemudian.

### Sempadan editorial dan operasi

**Sanity:** identiti/contact public, profil, pengumuman, program, berita,
organisasi, surau, galeri dan jadual kuliah editorial.
**Supabase/PostgreSQL + `/admin`:** peserta Qurban, pendaftaran, bayaran, resit
dan transaksi Ramadan. Bahagian operasi ini masih rancangan.
Campaign engine Qurban/Ramadan/wakaf/sumbangan, payment, email dan authentication
admin belum diimplement. Kategori galeri `qurban` tidak bermaksud transaksi Qurban.

## Keputusan visual dan kandungan yang dikunci

- Nama public penuh: **Masjid Talhah Bin Ubaidillah**; lokasi Bukit Jalil,
  Kuala Lumpur. Institutional sans-serif sistem (Segoe UI/Arial), mobile-first.
- Gunakan token navy/blue/gold/ivory sedia ada; tiada visual language baharu.
  Warna utama `navy-950 #071A3E`, `blue-700 #254E8A`, `ivory #F7F4EC`;
  emas `gold-400 #D7B75B`, `gold-500 #B79639`, `gold-600 #9F7C27` untuk aksen.
  Token lengkap: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **`/brand/brand-pattern-official.png` ialah satu-satunya pattern geometri.**
  Gunakan aset sebenar; hanya opacity, navy overlay, gradient, size, position
  dan responsive cropping. Jangan recreate, trace atau ubah geometri.
  Pattern terkawal pada hero/header/signature sections; navy polos pada bahagian lain.
- `MihrabMark` ialah dua garis arch minimal, hiasan sahaja; bukan logo kedua,
  tanpa frame atau teks. Logo rasmi `/brand/logo-masjid.png` tidak diubah.
- Hero menggunakan `masjid-dome.jpg` (DSC03425). Exterior DSC03423 disimpan
  sebagai `masjid-exterior.jpg`; homepage menggunakan derivative `masjid-exterior.webp`.
  Foto memakai `next/image`; original tidak dicrop/destructive edit.
- Kandungan penting visible tanpa animation/JavaScript/IntersectionObserver;
  hormati reduced motion. Main-only route transition ringan; Navbar stabil.
- Desktop Profil ialah text link: hover/focus membuka dropdown, klik menuju
  `/profil`, Escape menutup. Mobile tap expand/collapse. Sumbangan → `/#donations`.
- Sumber Fasa 3 ialah Markdown `Asset-phase-3`; runtime menggunakan salinan data
  berstruktur tempatan, bukan path OneDrive. Jangan reka fakta/nama/contact.
- Profil memakai lima foto sahaja: #8 dewan, #11 foyer, #15 kubah, #17 mihrab
  portrait, #19 sudut bacaan. Tiada penerangan teknikal seni bina yang direka.
- Organisasi: **25 slot jawatan, 23 foto**. ID berasaskan slot, bukan individu;
  pemegang dua jawatan kekal dalam kedua-dua konteks. Soffan kekal tanpa foto
  dengan placeholder neutral; Timbalan Pengerusi kekal dengan status **Kosong**.
  Urutan Imam/Bilal dan perjawatan mengikuti data tempatan yang telah diluluskan.
- Surau: **3 Jumaat + 12 Biasa**, 15 logo asal tanpa redraw/upscale; MIMOS kecil
  dan pudar dalam source. UI kad logo/nama; alamat tersedia dalam data.
- Galeri: 12 foto interior #2/4/5/6/8/9/10/11/14/15/17/19, nisbah asal,
  lightbox accessible. #18 carta kewangan/contact sheet dikecualikan public.
- Hubungi: Facebook/Instagram **ikon sahaja** hitam → warna pada hover/focus,
  URL daripada structured contact data, label accessible. Sabtu/Ahad/cuti umum
  tutup. Tiada map embedded/pin tepat; pautan carian berdasarkan alamat sahaja.

## Schema Fasa 4.2 yang diluluskan

Registry: `src/sanity/schemaTypes/index.ts` — **11 document types, 6 support types**.

| Document type | Tujuan / status |
| --- | --- |
| `siteSettings` | Singleton ID tetap; identiti/contact/waktu pejabat |
| `profilePage` | Singleton ID tetap; pengenalan, visi/misi/moto, rasional, maksimum lima foto |
| `announcement` | Pengumuman, tarikh, CTA pilihan dan ordering/visibility |
| `program` | Program, tarikh/lokasi/registration link pilihan |
| `newsPost` | Berita/aktiviti, artikel dan publish date |
| `organisationMember` | Satu slot jawatan, vacancy, foto/perjawatan pilihan |
| `surau` | Nama, kategori, logo/alamat pilihan, ordering |
| `galleryCollection` | Koleksi dengan media embedded berurutan |
| `lectureSpeaker` | Penceramah reusable — dalaman prototype |
| `lectureRule` | Aturan berulang — dalaman prototype |
| `lectureMonth` | Dokumen bulanan dengan tarikh/sesi embedded — dalaman prototype |

Support types: `editorialImage`, `galleryMedia`, `blockContent`, `paragraphText`,
`lectureDay`, `lectureSession`. Schema `lecture` ringkas terdahulu diganti oleh
model bulanan; kerja schema editorial lain dikekalkan. Singleton tidak ditawarkan
melalui Create new/duplicate/delete biasa. Tiga document kuliah read-only,
tersembunyi dari Structure/Create new dan tanpa actions semasa prototype.
Guardrail UI ini bukan authorization API. Butiran: [SANITY-CONTENT-MODEL.md](SANITY-CONTENT-MODEL.md).

## Penjana Jadual Kuliah: prototype, bukan penerbitan rasmi

- Tool native `/studio/penjana-jadual-kuliah`, implementation
  `src/sanity/tools/lecture-generator/`. React/CSS/SVG, tanpa dependency baharu.
- Data fiksyen dalam React state sahaja: bulan, penceramah, aturan, editor
  tarikh, maksimum dua sesi sehari dan live poster. Aturan tidak menimpa
  override manual, termasuk tarikh yang sengaja dikosongkan.
- PNG 3508 × 2480 dan PDF A4/A3 satu halaman tersedia untuk **demo**;
  tiada jaminan print-ready/vector PDF. Tiga portrait rujukan upstream digunakan
  di bawah label fiksyen untuk QA visual dan tidak dimigrasikan ke Sanity.
- Tiada dataset fetch, upload, mutation, localStorage atau Save draft.
  **Publish disabled. Refresh/keluar tool menghilangkan data demo.**
- Model yang dicadangkan: penceramah/aturan reusable → draft bulanan → snapshot
  published yang sama untuk website/poster. Save/publish, concurrency dan frontend
  query belum dibina. Rujuk [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md).
- QA berasingan memakai snapshot Oktober sebenar: 34 sesi, semua foto dapat
  dipadankan, 63 elemen teks tanpa clipping dan tiada overflow. PNG/PDF A4/A3
  lulus. Fixture kekal read-only di luar runtime Studio/dataset; keputusan kekal
  dalam [SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md).
- Renderer akhir diluluskan, termasuk allowance clip 0.6 unit SVG tanpa perubahan
  saiz/kedudukan teks. Kandungan synthetic terlalu panjang masih boleh ditolak
  oleh guard export; font sistem, raster PDF, DPI PNG dan proof cetakan ialah had
  prototype yang didokumenkan. Ini tidak menghalang checkpoint yang diluluskan.

Fasa 0–3, 4.1 dan checkpoint 4.2/4.2A ialah implementation yang diluluskan. Ini tidak bermaksud
website telah launch atau security/operational readiness telah selesai.
Checkpoint 4.2/4.2A tidak merangkumi migration/seed/CMS fetch public, `/kuliah`,
draft preview, Presentation Tool atau webhook. Semakan terdahulu direkodkan dalam
SANITY docs; keputusan itu bukan validation baharu oleh tugas dokumentasi ini.
Npm advisories sedia ada kekal seperti didokumenkan; jangan `audit fix --force`.

## Keputusan belum selesai dan langkah terdekat

1. Fasa 4.3A, migration draft 4.3B dan Controlled Publication 4.3C siap.
   Fasa 5.1 dan Fasa 5.2 Pengumuman/Program/Berita & Aktiviti siap dan diluluskan.
   Fasa 5.2A completed dengan Dapur/NCR/general QR published dan final copy approved.
   Genius Aulad masih pending required publishedAt; Qiam/Bubur Asyura HOLD.
   Tiada seeding lanjut atau scope fasa baharu diluluskan dalam checkpoint ini.
   Jadual Kuliah dikecualikan; Fasa 5.3 belum bermula.
   Save/publish kuliah, snapshot dan print QA memerlukan scope lanjut.
2. **Keputusan pre-production masih terbuka:** tentukan pematuhan GPL-3.0 bagi
   adapted renderer/combined application dan hak aset sebelum pengedaran produksi.
   Provenance telah direkodkan; approval checkpoint tidak menyelesaikan lesen.
3. Cadangan migration ialah draft dahulu → review Studio → publish selepas
   approval. Jadual sebenar dan content lecture kekal di luar scope migration ini.
4. Keputusan domain/hosting/production origins, plan/billing service, kos dan
   usaha kerja menunggu bukti. Catat dalam [PROJECT-COSTS.md](PROJECT-COSTS.md).
5. Ketidakpadanan dua tag lama memerlukan keputusan berasingan jika mahu dibetulkan.
   Nota status public-page/ledger yang lapuk diperbetulkan dalam preparation
   4.3A tanpa mengubah sejarah Git atau anomaly tag.

## Fasa 4.3A — preparation/dry-run siap

- Utility: `scripts/sanity-migration/`; default dry-run, explicit future
  write-drafts memerlukan target tepat/fingerprint/token. Tiada command write
  production dilaksanakan dalam sesi ini.
- Pelan: 43 dokumen — 1 settings, 1 Profil, 25 slot organisasi, 15 surau
  (3 Jumaat/12 Biasa), 1 koleksi Interior Masjid dengan 12 foto.
- 50 fail imej unik/55 penggunaan; lima imej Profil menggunakan semula aset
  Galeri. Logo rasmi tidak diupload. Tiada aset hilang atau validation failure.
- ID tetap singleton, ID slot organisasi, ID source surau, dan
  `galleryCollection-interior-masjid`. Array keys stabil; source text kekal.
- Authenticated read-only raw dataset pada 2026-10-01 16:18:13 +08:00:
  11 `system.group` + 1 `system.retention`; 0 editorial/draft/image/file assets.
  Snapshot ini bukan jaminan keadaan dataset pada masa migration kelak.
- Validator schema sebenar lulus untuk 43 calon; reference placeholders disemak
  offline, bukan dakwaan aset telah wujud. 16 ujian mapping/conflict/idempotency
  lulus menggunakan client dalam memori. Lint/build, schema extraction dengan
  enforced required fields dan whitespace check lulus. Enam public routes
  HTTP 200; H1/navigation/footer/images disemak. Tiada diff source runtime/aset.
- Public source/components/assets, schemas dan penjana kuliah tidak diubah;
  Publish disabled. Mock homepage, semua lecture demo/QA/legacy dikecualikan.
- Panduan/audit: [SANITY-MIGRATION.md](SANITY-MIGRATION.md). Preparation
  tidak melakukan production migration/upload/publish; commit dan push
  penutupan `ea8dd09` disahkan pada 1 Oktober 2026.

## Fasa 4.3B — migration draft production dan review

- Pengguna mengesahkan migration sebenar; authenticated raw read-back pada
  2 Oktober 2026 mengesahkan 105 rekod: 12 sistem, 43 draft editorial,
  50 `sanity.imageAsset`, 0 file assets, 0 published editorial.
- Draft: 1 Site Settings, 1 Profil, 25 slot organisasi, 15 surau
  (3 Jumaat/12 Biasa), 1 Interior Masjid dengan 12 foto berurutan.
- Fingerprint diluluskan kekal
  `cbe642f6bdc5265705dbe6079d64dfa2243c83f369a1f32690a5cf83ee30cbae`.
  Semua 43 sasaran `skip-identical`, 50 aset boleh digunakan semula,
  55 references diselesaikan; tiada konflik atau reference hilang.
- Lima foto Profil berkongsi references Galeri. Timbalan Pengerusi kosong,
  Soffan tanpa foto dan pemegang berbilang jawatan kekal slot berasingan.
- QA Studio menggunakan sesi login pada origin sedia ada
  `http://127.0.0.1:3002`; tiada edit atau Publish dibuat.
  Susunan dalam kumpulan/kategori sama dengan source. Studio menggunakan
  pilihan sort sedia ada; rank kumpulan organisasi kekal tanggungjawab adapter.
- Isu sedia ada: subtitle preview Galeri menyebut “0 foto”; editor dan raw
  array membuktikan 12 foto. Pembaikan preview ditangguhkan untuk scope berasingan.
- Closeout lulus lint/build/diff check, 17 migration tests, schema extraction,
  validator 43 payload remote, 50 imej Studio dan enam public routes HTTP 200.
- Laporan write berlabel `WRITE-DRAFTS`, tahap preflight; JSON mode/stage
  tepat. Safety model dan writer tidak diubah. Review closeout tidak
  menjalankan write/upload semula.
- Public frontend kekal local/static; schema, aset public dan renderer tidak
  diubah. Lecture Generator Publish disabled. Mock homepage/lecture/QA
  tidak dimigrasikan; GPL/provenance kekal terbuka sebelum production.

## Fasa 4.3C — Controlled Publication selesai

- Baseline diperiksa sebelum edit: branch `main`, working tree bersih, HEAD
  `156cdf542c5a44ca9006222dbd30eb40ffc2ebb2` / `phase-4.3b-draft-migration`.
- Authenticated raw preflight pada **2026-10-02T08:59:45.674Z**
  (16:59:45 +08:00): 105 rekod = 43 draft + 50 imej + 12 sistem;
  0 published editorial, 0 konflik, semua 43 payload/revisi sepadan,
  55 references kepada 50 aset unik. Edge cases 4.3B kekal.
- Manifest exact ID/type/revisi/aset dalam
  `scripts/sanity-migration/approved-publication.json`. Default publication CLI
  ialah read-only; target, fingerprint pelan dan fingerprint publication wajib
  untuk tindakan write. Snapshot tidak boleh authorize publication.
- Publish action rasmi dengan revision locks, absence guards dan atomic batch;
  tiada upload, manual replace/delete, purge atau automatic retry.
- Linux (Hermes sebagai execution agent sahaja) melakukan publication; Work
  mengemas repository dan membaca remote secara read-only. Percubaan awal
  HTTP 400 kerana ID `mtu-4.3c-*` tidak sah; pengguna mengesahkan tiada mutation.
  Prefix diperbetul kepada `mtu-4-3c-`; transaksi mesti `[a-zA-Z0-9_-]+`.
- Transaksi berjaya: `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb`.
  Request `2026-10-02T11:48:30.173Z`, response `11:48:31.971Z`, acknowledged
  `11:48:33.137Z` (19:48 +08:00). API dry-run dan atomic retry berjaya.
  Retry ini tindakan operator selepas fix; tiada automatic mutation retry.
- Read-back bebas authenticated/raw `2026-10-02T11:59:03.021Z`:
  105 rekod = 43 published + 50 imej + 12 sistem, 0 draft/konflik/unexpected
  editorial. Semua payload identical; 55 references/50 aset diselesaikan.
  Metadata bukan sasaran tidak berubah. Published `_updatedAt=11:48:30Z`.
- Gallery list “0 foto” dibetulkan melalui override preview dalam
  `sanity.config.ts`: count scalar `items.length` berasingan daripada thumbnail
  `items.0.image`. Schema source/model, payload dan fingerprints asal tidak berubah.
- QA Studio menggunakan perspektif Published; lima foto Profil, 25 slot,
  vacancy/Soffan, 15 surau dan 12 galeri disemak. Public frontend local/static,
  Lecture Generator Publish disabled. Tiada content lecture/mock/QA diterbitkan.
- Rekod timestamp, exact IDs/types, safety gates dan semakan:
  [SANITY-PUBLICATION.md](SANITY-PUBLICATION.md). Checkpoint
  `phase-4.3c-controlled-publication`; Fasa 5 belum bermula.

## New Work Session Bootstrap

1. Baca dokumen ini, `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`,
   `DESIGN-SYSTEM.md`, `DECISIONS.md` dan dokumen fasa yang hendak disentuh.
2. Sahkan repository rasmi/remote, folder aktif, branch, HEAD, tags,
   `git status` dan diff termasuk fail untracked. Jangan reset/clean/stash atau
   membuang kerja Fasa 4.2/4.2A tanpa arahan pengguna. Pada mesin baharu, clone
   gunakan checkpoint `phase-5.2a-editorial-public-information` untuk kod/docs penutupan
   terkini. Git tidak menyimpan dataset remote; sahkan published/draft/aset melalui raw
   read-back. Checkpoint `phase-4.2-sanity-content-model` ialah baseline prototype.
3. Inspect kod sebenar: public-content, route/components, schema registry,
   Studio structure dan generator jika relevan. Jangan bergantung pada chat lama,
   port server atau screenshot QA di luar repo sebagai satu-satunya bukti.
4. Sahkan env daripada `.env.example` tanpa mencetak/commit rahsia; login/CORS
   Studio jika diperlukan. Tanya pengguna hanya bagi keputusan yang belum dikunci.
5. Nyatakan scope semasa dan approval yang diperlukan; jangan masuk fasa lain
   atau commit/push secara automatik. Ikuti validation dalam arahan fasa.
6. Selepas kemajuan diluluskan, kemas state/roadmap, tambah keputusan dan timeline
   berasaskan bukti; kemas ledger kos hanya dengan bukti sebenar.
