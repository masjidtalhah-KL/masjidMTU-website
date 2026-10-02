# Architecture Projek

Dokumen ini merekodkan architecture semasa dan susunan fasa berikutnya.
Fasa 4.1 menyediakan embedded Sanity Studio; Fasa 4.2/4.2A menambah content
model editorial dan prototype kuliah. Fasa 4.3A menyediakan mapping, validation
dan dry-run migration. Fasa 4.3B menambah 43 draft editorial dan 50 aset imej
unik dalam production, tanpa konflik atau penerbitan. Fasa 4.3C kemudian
menerbitkan 43 dokumen approved. Fasa 5.1 siap menyambungkan lima route
kepada published Sanity melalui typed server read layer, cache lima minit dan
explicit local fallback bagi temporary outage. Local editorial data lima route
kekal fallback sahaja; homepage pengumuman/program/berita/kuliah kekal mock.
Lecture Generator Publish disabled; Fasa 5.2 belum bermula.
Pangkalan data operasi, dashboard, kempen dan pembayaran belum dibina.

```text
Pengunjung
   ↓
Public Website — Next.js
   ├── Lima public pages — published Sanity → typed adapter → presentation
   │   └── Next cache 5 minit; local fallback bagi temporary outage
   ├── Homepage editorial — mock/local
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

Homepage Fasa 2 menggunakan imej rasmi `public/brand/masjid-dome.jpg` untuk visual kubah dalam hero dan `public/brand/masjid-exterior.jpg` untuk foto bahagian luar. Homepage memaparkan foto exterior melalui derivative WebP `public/brand/masjid-exterior.webp`; JPG asal dikekalkan. Kandungan waktu solat, pengumuman, program, kuliah dan berita datang daripada mock data dalam `src/lib/homepage-content.ts`. Homepage tidak membuat fetch CMS atau pangkalan data.

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
model source-independent. Homepage, Navbar/Footer dan prototype kuliah kekal
source asal. Tiada webhook, mutation endpoint atau preview ditambah.

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
