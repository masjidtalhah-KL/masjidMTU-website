# QA Oktober 2026 — checkpoint Fasa 4.2A

Disemak 2026-10-01; diluluskan bersama checkpoint
`phase-4.2-sanity-content-model`. Ini rekod keputusan QA, bukan data production.

## Sumber dan sempadan

Fail pengguna `jadual-talhah-semua-bulan.json` ialah snapshot legacy version 2.
Hanya key `2026-10` diimport ke state harness QA tempatan, bukan demo default
Studio atau dataset. Legacy month 9 dipetakan ke model month 10. Source Oktober
sepadan dengan repo JadualKuliahBulanan commit
`378b1bbb4084b4f7b6c55ac70a5c4f769d221d28`.

Symbolic photos dibaca daripada ASSETS bundle upstream secara read-only dan
disajikan sebagai buffer tempatan. Dua inline photos dibaca daripada snapshot
asal. Tiada asset QA tambahan disalin ke `public/` atau dimuat naik ke Sanity.
Source asal tidak diubah. Bulan lain tidak dijana melalui inferens.

## Hasil import tepat

| Semakan | Hasil |
| --- | --- |
| Jumlah sesi | 34 |
| Subuh / Maghrib / Jumaat / Yasin | 8 / 16 / 5 / 5 |
| Hari single / dual / kosong | 26 / 4 / 1 |
| Tarikh dual | 3, 11, 18, 24 |
| Tarikh kosong | 31 |
| Sumber default / manual | 29 / 5 sesi |
| changedDays asal | 2, 9, 23, 30, 27 |
| Symbolic portraits / inline portraits | 27 / 2 |
| Unresolved image references | Tiada |

Nama, topik/kitab, newline, urutan sesi, source manual/default dan tarikh
disemak terhadap JSON asal tanpa pemendekan. `photoFit`, `photoZoom`, `photoY`
dikekalkan melalui fit/zoom/positionY; snapshot menggunakan cover, zoom 1,
Y 50 dan fontScale 1. @donationQR wujud dalam bundle tetapi tidak digunakan.

## Renderer dan eksport

- 31 date cells, 34 sessions dan 29 portrait render.
- 63 native SVG text elements diuji selepas fon browser ready: **0 clipping**.
- `data-overflow` kosong: **tiada overflow Oktober**.
- Clip allowance 0.6 unit kiri/kanan membaiki overhang italic/stroke subpixel;
  kedudukan teks, saiz fon, fitting dan nisbah layout kekal.
- Single-session name 9.9 unit; dual topic/name 9.6/8.1; Yasin 12/10.8.
  Single, dual dan Yasin mengekalkan treatment yang diluluskan.
- PNG A4 dieksport sebenar pada 3508 × 2480 sRGB.
- PDF A4: satu halaman 841.89 × 595.28pt; PDF A3: satu halaman
  1190.55 × 841.89pt. Kedua-duanya berjaya dirender semula.

P2 synthetic long-copy tidak menghalang checkpoint untuk kandungan Oktober
sebenar. Kandungan masa depan yang terlalu panjang masih boleh gagal fitting;
guard export menolak overflow dan tidak memendekkan nama secara senyap.
Dual text kecil pada A4 (~5.5pt; A3 ~7.8pt), PDF masih raster, PNG tiada metadata
DPI fizikal, font sistem/cross-platform dan proof cetakan belum production-ready.

## Bukti tempatan dan reproducibility

Harness/artifacts berada di workspace `qa/poster-fidelity/`, di luar repo:
`october-import-validation.json`, `october-asset-manifest.json`,
`october-native-text-validation.json`, `october-fixture.json`,
`prepare-october.cjs`, `october-preview.tsx`, `build-october.cjs`,
`serve-october.cjs`, screenshots dan eksport. Output ini mungkin tidak tersedia
pada mesin lain. Untuk ulang QA, dapatkan semula snapshot asal dan repo legacy
pada commit dipin; import hanya Oktober ke harness in-memory tanpa writes.
Keputusan ringkas dalam dokumen ini sengaja disimpan bersama checkpoint.

Publish kekal disabled; tiada migration, upload, save/publish atau production
mutation dilaksanakan. Provenance/GPL dan keputusan pre-production terbuka:
[DECISIONS.md](DECISIONS.md),
[third-party/JADUAL-KULIAH-NOTICE.md](third-party/JADUAL-KULIAH-NOTICE.md).
