# Architecture Projek

Dokumen ini merekodkan susunan yang dirancang. Sambungan CMS, pangkalan data, dashboard, kempen dan pembayaran belum dibina dalam Fasa 0.

```text
Pengunjung
   ↓
Public Website — Next.js
   ├── Kandungan — Sanity CMS (kemudian)
   ├── Data operasi — Supabase / PostgreSQL (kemudian)
   └── Kempen — Qurban / Ramadan / Wakaf / Sumbangan (kemudian)

Admin operasi — /admin (kemudian)
Pengurusan kandungan — /studio (Sanity Studio, kemudian)
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

Homepage Fasa 2 menggunakan imej rasmi `public/brand/masjid-dome.jpg` untuk visual kubah dalam hero dan `public/brand/masjid-exterior.jpg` untuk foto bahagian luar. Homepage memaparkan foto exterior melalui derivative WebP `public/brand/masjid-exterior.webp`; JPG asal dikekalkan. Kandungan waktu solat, pengumuman, program, kuliah dan berita datang daripada mock data dalam `src/lib/homepage-content.ts`. Tiada CMS atau pangkalan data disambungkan.
