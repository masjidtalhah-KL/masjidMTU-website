# Sanity CMS — Fasa 4.1 Foundation

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

## Site Settings singleton

Schema pertama sahaja: `siteSettings`. ID dokumen tetap `siteSettings`.
Menu **Kandungan → Site Settings** membuka editor terus tanpa senarai dokumen.
Template penciptaan umum dikeluarkan dan action duplicate/delete disembunyikan;
publish, discard changes dan restore dikekalkan.

Field asas: nama penuh, nama ringkas pilihan, alamat rasmi, telefon pejabat dan
emel rasmi. Tiada initial values, seed atau migration daripada data tempatan.
Editor boleh membuka schema kosong; tiada dokumen perlu diisi untuk review ini.
Singleton ialah guardrail Studio, bukan constraint uniqueness pada seluruh API;
project permissions kekal mengawal siapa boleh menulis.

## Sempadan kandungan

**Sanity:** kandungan editorial/public seperti pengumuman, program, kuliah,
berita/aktiviti, profil, galeri dan contact/site information pada fasa kemudian.

**Supabase/PostgreSQL + `/admin`:** peserta Qurban, registration, pembayaran,
resit, transaksi Ramadan dan rekod operasi. Jangan simpan rekod ini dalam Sanity.

Fasa 4.1 tidak mengubah `src/lib/public-content/*` atau mock homepage.
Semua public routes masih menggunakan source tempatan asal.

## Ditangguhkan

- Content models penuh dan migration (Fasa 4.2 atau fasa berikutnya).
- Frontend fetch, dynamic content, preview, Presentation Tool dan Draft Mode.
- Webhook, mutation endpoint, admin/auth custom, database dan payment.

## Semakan

Jalankan `npm run lint`, `npm run build` dan `git diff --check`.
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

### Dependency audit

Pemasangan versi stabil melaporkan 15 npm advisories (11 moderate, 4 high),
berasal daripada dependency transitif Sanity CLI/tooling: `adm-zip`, `js-yaml`,
`smol-toml`, `undici` dan `uuid`, bersama pakej induknya. Semakan ini bukan
jaminan keselamatan keseluruhan aplikasi. `npm audit fix --force` mencadangkan
downgrade major Sanity dan tidak digunakan. Semak pembaikan upstream sebelum
production hardening; tiada override versi major yang belum diuji ditambah.

Rujukan: [Embedded Studio rasmi](https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs)
dan [singleton Studio](https://www.sanity.io/guides/singleton-document).
