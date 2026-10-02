# Sanity CMS

## Architecture

Studio rasmi menggunakan `NextStudio` daripada `next-sanity` pada `/studio`,
dengan optional catch-all route untuk navigation dalaman Studio. Project/dataset
dikongsi oleh Studio, CLI dan client melalui `src/sanity/env.ts`.

- Project: `2o95jmms`
- Organization: `o5cig7je6` (rujukan pengurusan; tidak diperlukan oleh runtime)
- Dataset: `production`
- Title: `Masjid Talhah CMS`
- API version tetap: `2026-09-01`

`sanity.config.ts` mendaftarkan Structure Tool dan schema registry.
`sanity.cli.ts` membolehkan arahan CLI dalam repo yang sama.
`src/sanity/client.ts` menyediakan client read-only tanpa token untuk fasa
kemudian; tiada halaman public mengimport atau membuat query dengannya sekarang.
Studio dikecualikan daripada public route transition supaya editor tidak
diduplikasi semasa navigation dalaman. Public transition asal dikekalkan.

## Local development

Gunakan Node.js **22.12+** (Node 24 LTS disyorkan), mengikut keperluan Sanity 6.

1. Jalankan `npm install`.
2. Salin `.env.example` kepada `.env.local`; jangan commit fail ini.
3. Pastikan tiga nilai public berikut tersedia:

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID=2o95jmms
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-09-01
```

4. Jalankan `npm run dev`, buka `http://localhost:3000/studio` dan login
   dengan akaun Sanity yang telah diberi akses projek.

Nilai ini ialah identifier/config public, bukan credentials. Jangan tambah
write token atau secret dalam pembolehubah `NEXT_PUBLIC_*`. Studio menggunakan
authentication dan project roles Sanity asal, tanpa custom login atau auth bypass.
Jika nilai env berubah, restart server; deployment perlu rebuild.

## CORS dan akses projek

Di [Sanity Manage](https://www.sanity.io/manage), pilih project `2o95jmms`.
Pastikan dataset `production` wujud dan akaun editor mempunyai membership/role
yang sesuai. Dalam **API → CORS origins**, benarkan origin Studio yang sebenar
dengan **Allow credentials** untuk login/editor:

- `http://localhost:3000` untuk dev biasa.
- `http://127.0.0.1:3002` jika menggunakan server review pada port 3002.
- Origin HTTPS website sebenar apabila deployment diputuskan.

Origin ialah protocol + hostname + port, tanpa `/studio`. Gunakan origin tepat,
bukan wildcard. Tetapan dashboard ini tidak ditukar oleh kod repo.

## Content model — Fasa 4.2

Registry kini menyediakan sebelas document types: `siteSettings`, `profilePage`,
`announcement`, `program`, `newsPost`, `organisationMember`, `surau`,
`galleryCollection`, `lectureSpeaker`, `lectureRule` dan `lectureMonth`.
Tiga type kuliah bersifat dalaman/read-only semasa prototype Fasa 4.2A.
Rujuk [SANITY-CONTENT-MODEL.md](SANITY-CONTENT-MODEL.md)
untuk medan, validation, susunan Studio dan keputusan pemodelan.

`siteSettings` dan `profilePage` ialah singleton dengan ID tetap mengikut nama
type. Kedua-duanya dibuka terus melalui menu **Site Settings** dan **Profil Masjid**.
Template serta pilihan penciptaan umum ditapis; action duplicate/delete juga
disembunyikan. Publish, discard changes dan restore dikekalkan.

Site Settings menyediakan identiti/contact global, termasuk Facebook, Instagram
dan waktu pejabat. Profil Masjid mengekalkan section halaman yang telah diluluskan.
Tiada initial values automatik. Fasa 4.3B mengisi singleton sebagai draft
melalui migration diluluskan; QA tidak memerlukan editor mempublish dokumen.
Singleton ialah guardrail Studio, bukan constraint uniqueness pada seluruh API;
project permissions kekal mengawal siapa boleh menulis.

## Penjana Jadual Kuliah — Fasa 4.2A

Tool native dibuka melalui navigation Studio atau
`/studio/penjana-jadual-kuliah`. Ia menggunakan React + SVG, dimuatkan apabila
tool dibuka. Tiada iframe, dependency baharu, token, upload, mutation atau
penyimpanan demo dalam localStorage/dataset. Public pages masih tidak membuat
query CMS. Rujuk [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md).

Nama penceramah dan jadual ialah contoh fiksyen. Refresh atau meninggalkan tool
memadam perubahan demo. Publish dilumpuhkan; PNG/PDF berlabel prototype ialah
export asas untuk review sahaja. Schema kuliah disembunyikan daripada workflow
editor biasa dan actions dinyahaktifkan; ini guardrail Studio, bukan pengganti
permissions Sanity bagi penulis API luar.

## Sempadan kandungan

**Sanity:** kandungan editorial/public seperti pengumuman, program, kuliah,
berita/aktiviti, profil, galeri dan contact/site information pada fasa kemudian.

**Supabase/PostgreSQL + `/admin`:** peserta Qurban, registration, pembayaran,
resit, transaksi Ramadan dan rekod operasi. Jangan simpan rekod ini dalam Sanity.

Fasa 4.1–4.2 tidak mengubah `src/lib/public-content/*` atau mock homepage.
Semua public routes masih menggunakan source tempatan asal.

## Ditangguhkan

Fasa 4.3A menyediakan utility preparation/dry-run. Fasa 4.3B telah
memigrasikan 43 draft dan 50 aset imej unik ke production, tanpa konflik/publish.
`npm run sanity:migrate -- --dry-run` memvalidasi 43 calon dokumen
dan audit 50 fail imej tanpa upload/write. Dataset boleh diperiksa read-only
melalui `--inspect-dataset` atau snapshot authenticated yang diaudit.
Panduan lengkap: [SANITY-MIGRATION.md](SANITY-MIGRATION.md).

- Penerbitan kandungan, migration lecture dan langkah Fasa 4.3C.
- Frontend fetch, dynamic content, preview, Presentation Tool dan Draft Mode.
- Webhook, mutation endpoint, admin/auth custom, database dan payment.

## Semakan

Jalankan `npm run lint`, `npm run build` dan `git diff --check`.
Schema boleh diekstrak tanpa mengubah dataset melalui
`npx sanity schema extract --path <fail-output-di-luar-repo>`.
Review `/studio` ketika logged out dan logged in, pastikan project/dataset betul,
serta editor singleton dan public routes berfungsi. Login yang berjaya memerlukan
akaun dan CORS sebenar; screenshot login sahaja tidak membuktikan akses editor.

### Hasil review implementation Fasa 4.1

- Lint, production build dan diff whitespace check lulus.
- Schema extraction CLI lulus; registry mengandungi satu schema document `siteSettings`.
- Config/client menggunakan project dan dataset yang diberikan, tanpa token.
- Singleton ID, template filtering dan action filtering telah disemak.
- Pengguna menambah CORS origin review `http://127.0.0.1:3002` dan login.
  Sesi authenticated serta editor Site Settings kosong telah disahkan dalam browser.
  Tiada data disimpan atau dipublish semasa semakan.
- Enam public routes pada 375px dan 1440px: kandungan, gambar dan screenshot
  sepadan dengan baseline (tiada perubahan piksel ketara); tiada Sanity requests.
- Public content, homepage, page components, Navbar dan Footer tidak diubah.

### Hasil review implementation Fasa 4.2 sebelum semakan kuliah 4.2A

- Sembilan document types dan empat jenis sokongan didaftarkan; schema extraction lulus.
- Kesemua editor kosong boleh dibuka dalam sesi Studio authenticated.
  Site Settings/Profil Masjid dibuka terus dan tiada dalam menu Create new.
- 35 kes validation melalui validator Sanity dalam konteks Studio lulus,
  menggunakan fixture dalam memori sahaja. Semakan uniqueness slug dan kewujudan
  asset distub untuk ujian offline; tiada rekod production atau upload dibuat.
- Preview kosong bagi sembilan document types dan filter dua singleton lulus.
- Enam public routes pada 375px/1440px sepadan dengan baseline dari segi teks,
  gambar dan screenshot; tiada request Sanity atau runtime error.
- Tiada perubahan pada dependency, authentication, public pages atau data tempatan.

### Hasil review prototype Fasa 4.2A

- Lint tanpa warning, production build, diff whitespace check dan schema extraction lulus.
- Registry akhir: sebelas document types dan enam jenis sokongan.
- 51 kes validator Sanity dengan fixture dalam memori lulus, termasuk tarikh
  bulanan, tarikh duplicate, dua sesi maksimum dan image alt. Semakan reference
  existence/slug uniqueness distub untuk ujian offline sahaja.
- 2,916 kombinasi tahun/bulan/aturan (2020–2100) lulus. Manual override, tarikh
  manual kosong, konflik aturan, preview kosong dan guardrail prototype lulus.
- Tool native dibuka dalam sesi authenticated. Lapan menu editorial asal
  dikekalkan; Create new hanya menawarkan enam type bukan singleton, tanpa
  schema kuliah dalaman. Tiada dokumen production disimpan atau dipublish.
- Live edit tajuk/penceramah, dua sesi, apply rules, manual override, restore
  dan bulan enam baris disemak dalam browser. Publish disabled.
- Viewport 375/430/768/1440px tiada horizontal overflow. Lapan screenshot
  review disediakan di luar repo aplikasi.
- Download PNG 3508 × 2480 serta PDF A4/A3 satu halaman lulus; PDF dirender
  semula dan diperiksa secara visual. Export ialah raster demo, bukan full parity.
- Enam public routes pada 375/1440px: 12 semakan kandungan/gambar dan
  screenshot sepadan dengan baseline; tiada request Sanity atau runtime error.
- Tiada perubahan public pages, data tempatan, public assets atau dependency.

## Checkpoint akhir Fasa 4.2 / 4.2A

Model editorial dan prototype penjana diluluskan pada 2026-10-01, checkpoint
`phase-4.2-sanity-content-model`. Renderer approved dikekalkan; Publish disabled
dan public pages masih membaca data tempatan. QA October sebenar 34 sesi lulus,
63 teks tiada clipping, eksport PNG/PDF A4/A3 lulus; keputusan lengkap:
[SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md). Tiada production migration/writes.
Keputusan GPL bagi adapted renderer/combined application dan hak aset sebelum
production masih terbuka. Preparation Fasa 4.3A kemudian ditutup pada `ea8dd09`;
draft migration Fasa 4.3B direkodkan di bawah.

Validation close-out: lint/build lulus; schema extraction dengan enforced
required fields lulus; 51 kes validator sebenar (reference/uniqueness offline
di-stub), 11 empty previews, 2 singleton guards, 2,916 recurrence combinations
dan 1,944 calendar comparisons lulus. 12 stored public visual comparisons lulus;
public source/assets tiada diff. Renderer tool disahkan sama hash sebelum/selepas
housekeeping. Whitespace diff seluruh checkpoint disemak sebelum commit.

## Penutupan Fasa 4.3B

Read-back authenticated raw pada 2 Oktober 2026 mengesahkan **43 draft,
50 unique image assets, 0 konflik, 43 skip-identical, 0 published editorial**.
Dataset mempunyai 12 dokumen sistem, jumlah 105; tiada editorial tidak dijangka
atau file asset. Semua references imej diselesaikan.
QA Studio menggunakan origin sedia ada `http://127.0.0.1:3002`, tanpa
menukar CORS, mengedit draft atau Publish. Public frontend kekal local/static
dan Lecture Generator Publish disabled. Laporan write menggunakan mode sebenar
`WRITE-DRAFTS` / preflight; safety model kekal.
Rujuk [SANITY-MIGRATION.md](SANITY-MIGRATION.md) untuk bukti dan pemetaan.
Checkpoint: `phase-4.3b-draft-migration`; Fasa 4.3C dan Fasa 5 belum bermula.

### Dependency audit

Pemasangan versi stabil melaporkan 15 npm advisories (11 moderate, 4 high),
berasal daripada dependency transitif Sanity CLI/tooling: `adm-zip`, `js-yaml`,
`smol-toml`, `undici` dan `uuid`, bersama pakej induknya. Semakan ini bukan
jaminan keselamatan keseluruhan aplikasi. `npm audit fix --force` mencadangkan
downgrade major Sanity dan tidak digunakan. Semak pembaikan upstream sebelum
production hardening; tiada override versi major yang belum diuji ditambah.

Rujukan: [Embedded Studio rasmi](https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs)
dan [singleton Studio](https://www.sanity.io/guides/singleton-document).
