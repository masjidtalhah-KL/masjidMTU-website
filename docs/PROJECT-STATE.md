# Project State — Masjid Talhah Bin Ubaidillah

Snapshot disemak pada **1 Oktober 2026 (+08:00)**. Dokumen ini ialah ringkasan
keadaan semasa untuk sambungan kerja. Arahan pengguna terkini dan keadaan Git/kod
perlu diperiksa semula; snapshot ini bukan kebenaran automatik untuk fasa berikutnya.

## Fasa dan checkpoint

**Fasa semasa: 4 — Sanity CMS.** Fasa 4.1, model Fasa 4.2 dan prototype
Fasa 4.2A telah diluluskan. Checkpoint akhir 4.2/4.2A ialah
`phase-4.2-sanity-content-model`. **Fasa 4.3 belum bermula.**

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

**Ketidakpadanan tag lama:** kedua-dua tag Fasa 1/2 sebenarnya menunjuk ke
`19f3c6c` (penjelasan pattern rasmi), sebelum penutupan Fasa 1 dan implementation
homepage. Jangan gunakan tag itu sebagai snapshot akhir fasa. Tag tidak diubah
dalam tugas ini. Tarikh/rujukan penuh berada dalam [PROJECT-JOURNEY.md](PROJECT-JOURNEY.md).
Fasa 5–12 belum bermula.

## Architecture semasa

- Next.js App Router **16.3.6**, React **19.2.8**, TypeScript, Tailwind CSS 4,
  ESLint; versi tepat dikawal oleh `package.json` dan lockfile. Node >=22.12.
- Route awam: `/`, `/profil`, `/profil/organisasi`, `/profil/surau-kariah`,
  `/galeri`, `/hubungi`. `/design-system` ialah katalog reka bentuk.
- Public pages menggunakan `src/lib/public-content/*`. Homepage menggunakan
  **mock data** `src/lib/homepage-content.ts`; waktu solat/program/kuliah contoh
  belum menjadi maklumat rasmi atau data CMS.
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

1. Tunggu scope dan arahan Fasa 4.3; jangan mulakan secara automatik.
   Save/publish, snapshot, concurrency dan print QA memerlukan scope lanjut.
2. **Keputusan pre-production masih terbuka:** tentukan pematuhan GPL-3.0 bagi
   adapted renderer/combined application dan hak aset sebelum pengedaran produksi.
   Provenance telah direkodkan; approval checkpoint tidak menyelesaikan lesen.
3. Selepas kelulusan scope seterusnya, rancang migration/editorial workflow;
   jadual sebenar, pemilik kandungan dan proses kelulusan belum diisi di CMS.
4. Keputusan domain/hosting/production origins, plan/billing service, kos dan
   usaha kerja menunggu bukti. Catat dalam [PROJECT-COSTS.md](PROJECT-COSTS.md).
5. Ketidakpadanan dua tag lama memerlukan keputusan berasingan jika mahu dibetulkan.
   Sebahagian nota akhir PUBLIC docs masih snapshot review lama; status semasa
   diselesaikan melalui Git + ROADMAP, bukan ayat “belum dikomit” yang lapuk.

## New Work Session Bootstrap

1. Baca dokumen ini, `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`,
   `DESIGN-SYSTEM.md`, `DECISIONS.md` dan dokumen fasa yang hendak disentuh.
2. Sahkan repository rasmi/remote, folder aktif, branch, HEAD, tags,
   `git status` dan diff termasuk fail untracked. Jangan reset/clean/stash atau
   membuang kerja Fasa 4.2/4.2A tanpa arahan pengguna. Pada mesin baharu, clone
   Gunakan checkpoint `phase-4.2-sanity-content-model` untuk memulihkan prototype
   yang diluluskan; HEAD Fasa 4.1 sahaja tidak mengandunginya.
3. Inspect kod sebenar: public-content, route/components, schema registry,
   Studio structure dan generator jika relevan. Jangan bergantung pada chat lama,
   port server atau screenshot QA di luar repo sebagai satu-satunya bukti.
4. Sahkan env daripada `.env.example` tanpa mencetak/commit rahsia; login/CORS
   Studio jika diperlukan. Tanya pengguna hanya bagi keputusan yang belum dikunci.
5. Nyatakan scope semasa dan approval yang diperlukan; jangan masuk fasa lain
   atau commit/push secara automatik. Ikuti validation dalam arahan fasa.
6. Selepas kemajuan diluluskan, kemas state/roadmap, tambah keputusan dan timeline
   berasaskan bukti; kemas ledger kos hanya dengan bukti sebenar.
