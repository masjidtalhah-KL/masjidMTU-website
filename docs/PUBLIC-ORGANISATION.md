# Carta Organisasi — Fasa 3.4

Route `/profil/organisasi` menggunakan `PublicPageLayout`, `PublicPageHeader` dan
navigation serta route transition yang telah diluluskan. Kandungan masih tempatan,
daripada `src/lib/public-content/organisation.ts`. Tiada data atau aset sumber diubah.

## Struktur

- Ahli Jawatankuasa Kariah: 4 slot Jawatankuasa Utama dan 10 AJK / Biro.
- Pegawai Masjid: 5 Imam, 4 Bilal, 1 Noja dan 1 Pembantu Tadbir.
- Pautan anchor selepas header membolehkan pengguna melompat ke setiap bahagian.
- Heading navy, aksen gold kecil dan blok tajuk Pegawai Masjid membezakan hierarchy.
  Pattern rasmi hanya digunakan oleh page header sedia ada.

## PersonCard

`src/components/public/person-card.tsx` menerima satu slot jawatan. Kad menyokong
foto, nama, jawatan, perjawatan pilihan, vacancy dan placeholder tanpa foto.

- ID, urutan, nama, jawatan dan foto kekal mengikut source.
- Timbalan Pengerusi dipaparkan sebagai `Timbalan Pengerusi` dan `Kosong`;
  data asal `Timbalan Pengerusi (Kosong)` tidak diubah.
- Susunan Imam: Wan Abd Halim, Nik Muhammad Fadlan, Muhammad Taqiyuddin,
  Muhammad Zulqurnain dan Faris Mifzal.
- Susunan Bilal: Mohd Safwan, Tarmizie, Roslan dan Muhamad Raziq Sufi.
- Soffan Affendi Bin Aminudin kekal dengan placeholder geometri neutral, tanpa wajah
  atau siluet manusia. Placeholder ialah hiasan; nama dan jawatan ialah teks sebenar.
- Individu dengan dua jawatan dipaparkan pada kedua-dua slot dengan foto masing-masing.
- Perjawatan hanya dipaparkan apabila diberikan; ruang metadata desktop dikekalkan
  supaya kad dalam kumpulan yang sama mempunyai tinggi konsisten.
- Semua 23 foto WebP menggunakan `next/image`, nisbah asal dan `object-fit: contain`.
  Tiada crop, retouch, upscale atau perubahan fail foto.
- Mobile menggunakan kad mendatar dengan foto kecil; desktop menggunakan grid.

CSS Modules mengasingkan styling organisasi daripada homepage, Profil dan navigation.
Tiada animation kad ditambah; kandungan tersedia tanpa JavaScript. Route transition
dan tetapan reduced motion sedia ada dikekalkan.

## Semakan review

Paparan 375px, 430px, 768px dan 1440px disemak: 25 slot, 23 foto, padanan
manifest, tinggi kad setiap kumpulan, tiada overflow, foto tanpa crop, anchor
keyboard, reduced motion dan kandungan tanpa JavaScript. Screenshot disimpan di
folder QA workspace di luar repository. Fasa 3.4 telah diluluskan dan ditutup dalam
commit khusus; checkpoint tag turut disediakan pada repository.
