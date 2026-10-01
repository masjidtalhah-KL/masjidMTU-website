# Audit akhir poster Fasa 4.2A

Tarikh: 2026-10-01. Audit sahaja; tiada commit, push atau migration.

## Verdict

**Diluluskan pengguna untuk checkpoint Fasa 4.2/4.2A pada 2026-10-01.**
QA Oktober sebenar 34 sesi lulus tanpa overflow; P3 subpixel clipping dibaiki
dengan allowance 0.6 unit SVG tanpa perubahan komposisi. Lihat
[SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md). Isu P2 di bawah ialah hasil fixture
synthetic panjang dan kekal sebagai had future content, bukan blocker checkpoint
yang telah diluluskan. Guard export terus menolak overflow.

Renderer, schemas dan UI tool tidak diubah dalam audit ini. QA diperluas di luar
repo. Assertion fixture QA lama dikemas kini daripada 7 tarikh kepada 29 entries,
27 manual overrides dan 33 sessions, mengikut fixture renderer semasa.

## Isu mengikut keutamaan

### P2 — nama penuh dan tajuk panjang tidak muat

Fixture audit rekaan menggunakan nama seperti
`Ustaz Nik Muhammad Fadlan Bin Nik Mahmood` dan
`Ustaz Wan Abdul Halim Bin Muhammad Yusoff`, dengan tajuk
`Syarah Hadis Riyadus Salihin` / `Fiqh Ibadah: Panduan Solat Berjemaah`.
Nama tersebut hanya string ujian; bukan jadual/identiti individu dalam foto.

Selepas font browser selesai diukur, kedua-dua kumpulan single/dual turun kepada
minimum 8 unit SVG. Beberapa baris terakhir terpotong oleh copy clip. Amaran
menyenaraikan 22 tarikh dan PNG/PDF ditolak dengan mesej yang betul.
Bulan enam baris juga gagal dengan fixture panjang ini. Tajuk sekitar 96 aksara
meningkatkan overflow; eksport tetap ditolak.

Pada A4, 8 unit poster bersamaan kira-kira 5.4pt, atau 7.7pt pada A3. Resolusi
300dpi tidak menjadikan saiz huruf fizikal lebih besar. Pengguna perlu keputusan
tentang had/paparan nama dan tajuk sebelum boleh menerima refinement sebagai
selesai. Jangan memendekkan nama secara senyap. Jangan mengecilkan font lebih
daripada minimum sekarang untuk menyembunyikan kegagalan.

Normalisasi font mengikut kumpulan turut mengecilkan slot lain apabila satu slot
panjang menentukan minimum. Ini mengikut arahan visual keseragaman sebelumnya,
tetapi trade-off readability perlu diterima secara jelas.

Screenshot: workspace `qa/poster-fidelity/audit-realistic-overflow.png` dan
`audit-six-rows.png`. `audit-moderate.png` menunjukkan fixture yang lulus.

### P3 — metadata cetakan PNG

PNG A4 mempunyai 3508 × 2480 pixel; pixel density mencukupi untuk A4 sekitar
300dpi apabila saiz cetakan ditetapkan secara manual. Fail tidak mempunyai chunk
`pHYs` (DPI fizikal). Aplikasi imej boleh menentukan saiz cetakan default yang
berbeza. PDF A4/A3 mempunyai ukuran halaman fizikal yang betul. Proof cetakan
fizikal belum dibuat.

### P3 — cleanup dan konsistensi fon

- `posterLines`, helper truncation lama yang tidak digunakan, telah dibuang.
- Dokumen prototype telah diselaraskan dengan fixture semasa: 29 tarikh berisi,
  33 sesi dan tiga portrait rujukan yang digunakan di bawah label fiksyen.
- Klip salinan kini mempunyai allowance 0.6 unit SVG pada kiri dan kanan untuk
  menampung overhang subpixel teks italic/stroked. Kedudukan teks, saiz fon,
  text fitting dan nisbah layout tidak berubah.
- Geometri/sizing JSX yang panjang boleh diekstrak kepada helper kecil selepas
  isu teks diselesaikan. Tiada dependency tambahan diperlukan.
- Arial Black/Arial Narrow bergantung kepada fon sistem dan fallback browser;
  belum ada bukti fidelity yang sama pada macOS/Linux. Export dan preview pada
  browser Windows yang diuji adalah sepadan.

## Fidelity terhadap legacy

Rujukan dipin pada JadualKuliahBulanan commit
`378b1bbb4084b4f7b6c55ac70a5c4f769d221d28`.
Source modular dan output Talhah sebenar dibandingkan dengan renderer React.

Padanan kuat: kanvas 1240 × 877, header logo/foto, hierarchy kuning/putih,
month pill, weekday pills, grid/gap/badge tarikh, warna sesi, white empty dates,
portrait kiri/kanan bagi dual sessions, Yasin/Tahlil dan compact month layout.
Bingkai biru tertanam pada portrait B disembunyikan melalui viewport inset;
fail WebP asal kekal sama byte dengan legacy. Stroke nama kini berkadar dengan
saiz font (0.07 × size), dengan allowance clip kecil untuk menjaga tepi stroke.

Perbezaan yang tinggal:

- Header SVG mempunyai bentuk glyph/baseline/anti-aliasing berbeza daripada
  artwork raster legacy; belum pixel-identical.
- Portrait default contain mengekalkan kepala/songkok dan mungkin mempunyai
  ruang putih; legacy turut menggunakan cover/zoom bagi beberapa portrait.
- Font diseragamkan mengikut single/dual, sedangkan legacy fit per slot.
- Label data contoh disengajakan. QR/event banner/multi-profile tiada dalam scope.
- Eksport PDF ialah raster satu halaman, bukan selectable text/vector PDF.

## Stability, data flow dan boundary

`LectureGeneratorTool` menyimpan speakers/rules/schedules/settings dalam React
state. Renderer menerima structured props; tiada legacy localStorage, old DOM,
iframe atau workspace JSON. Export clone SVG yang sama, embed same-origin assets,
menunggu font dan menolak overflow. Object URL dilepaskan selepas digunakan.

Publish Jadual disahkan disabled pada Studio sebenar. Tool tiada Sanity client,
mutation/request save/publish; `fetch` digunakan hanya untuk membaca aset eksport.
Lecture documents kekal readOnly, dengan creation templates dan document actions
ditutup. Ini guard prototype UI; bukan pengganti polisi akses production kemudian.

Tiada migration script atau perubahan public content ditemui dalam diff semasa.
Tiada production writes dibuat oleh audit ini. Audit tidak membandingkan dataset
remote dengan snapshot terdahulu atau menyatakan aktiviti pengguna lain tiada.

Semua public source/assets sedia ada sama dengan baseline sebelum refinement;
Git juga menunjukkan tiada diff terhadap HEAD untuk public routes/components/data
atau brand/interior/people/surau assets. Public routes belum fetch Sanity.

## Keputusan validation

| Semakan | Keputusan |
| --- | --- |
| npm run lint | Lulus |
| npm run build | Lulus, termasuk TypeScript dan semua public routes |
| git diff --check | Lulus untuk tracked diff; new-file whitespace turut disemak |
| Sanity schema extract, enforce required fields | Lulus, output QA tempatan sahaja |
| Actual Sanity validator | 51 kes lulus; client/reference/uniqueness query di-stub offline |
| Empty previews / singleton guardrails | 11 previews dan 2 singletons lulus |
| Recurrence / manual override / 2-session conflicts | 2,916 recurrence/date combinations lulus |
| Legacy compact calendar | 1,944 kombinasi 2020–2100 / compact on-off lulus |
| Portrait bounds dan aset | Dimensi/contain/position lulus; 6 aset sama byte upstream |
| Moderate text | Nama 24–31 aksara, tajuk hingga 22 aksara muat; single/dual/Yasin lulus |
| Empty days / empty topic and speaker | Render stabil; 31 tarikh, 30 kosong dalam fixture blank |
| Long / extreme / 6-row content | Overflow dikenal pasti dan eksport ditolak; lihat P2 |
| PNG | Download sebenar 3508 × 2480, dibuka dan diperiksa |
| PDF A4 | Download sebenar; 1 halaman 841.89 × 595.28pt; dirender semula dan diperiksa |
| PDF A3 | Download sebenar; 1 halaman 1190.55 × 841.89pt; dirender semula dan diperiksa |
| Current public routes | /, /profil, /profil/organisasi, /profil/surau-kariah, /galeri, /hubungi lulus browser smoke check; H1/nav/footer betul, tiada 404/overflow |
| Historical visual regression fixture | 12 stored before/after comparisons masih lulus; bukan screenshot fresh daripada audit ini |

## Provenance

Notice merekod repo/commit, upstream credit/copyright, bahagian yang diadaptasi,
tarikh/perubahan, asset mapping dan boundary hak imej. Full GPL-3.0 dan upstream
notice turut tersedia; dua adapted renderer files mempunyai SPDX GPL-3.0-only.
Rekod ini mencukupi untuk jejak provenance audit. Keputusan lesen/distribution
untuk combined application perlu diselesaikan sebelum public distribution;
pemisahan fail tidak secara automatik mengecualikan kewajipan GPL.

## Fail disentuh audit ini

Audit awal menyentuh dokumen ini sahaja. Refinement kemudian membaiki copy clip
renderer, membuang `posterLines` dan menyelaraskan dokumentasi prototype.
Di luar repo: `qa/phase-4.2A-validation.cjs` (assertion fixture) dan
`qa/poster-fidelity/audit-preview.tsx`, `build-audit.cjs`, beserta outputs,
screenshots/schema dan fail eksport untuk review.
