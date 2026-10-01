# Fasa 4.2A — fidelity poster Jadual Kuliah

Refinement visual pada 2026-10-01, diluluskan untuk checkpoint
`phase-4.2-sanity-content-model`. Dokumen ini melengkapkan
nota prototype terdahulu untuk **renderer poster sahaja**. Architecture Sanity,
schema, calendar editor, speaker/rule management dan Publish tidak diubah.

## Boundary komponen

`LecturePoster` menerima `schedule`, `speakers`, `settings` dan `svgRef`.
Jadual masih model Fasa 4.2A: bulan/tahun → tarikh → sesi → speaker ID.
Optional `Speaker.photo` memberi src/dimensi/fit/positionY/zoom untuk rendering.
Optional `PosterSettings.identity` dan `compactCalendar` mengawal presentation.
Tiada dependency terhadap workspace JSON, localStorage atau DOM aplikasi lama.

`poster-layout.ts` mengurus compact month geometry, wrapping, text fitting dan
portrait bounds. Text fitting mengukur fon browser sebenar, mengecil sehingga
minimum 8px, dan memaparkan amaran apabila kandungan masih tidak muat. Export
ditolak ketika overflow; nama/tajuk tidak dipendekkan secara senyap.

## Legacy berbanding renderer baharu

| Aspek | Adaptasi |
| --- | --- |
| Kanvas/header | 1240 × 877 landscape; ukuran header Talhah daripada output browser asal |
| Identiti | Komposit logo, cutout foto masjid dan kitab asal dipakai semula untuk poster sahaja |
| Tajuk/bulan | Hierarchy kuning/putih, bayang, label BULAN dan pill putih beroutline hitam |
| Kalendar | Grid x34/y238, lebar1172/tinggi621, gap13 × 9; weekday pink dan kosong berwarna putih |
| Tarikh | Badge kuning 31 × 32 di penjuru kanan, lengkung bawah kiri |
| Sesi biasa | Tajuk hijau gelap, jalur warna penuh, topic italic, nama uppercase beroutline, portrait bertindih |
| Dua sesi | Dua blok separuh tinggi; portrait sesi kedua di kanan, dengan teks di kiri |
| Jumaat | Heading TAZKIRAH JUMAAT, biru; tanpa speaker memaparkan Penceramah belum ditetapkan |
| Yasin/Tahlil | Sel teal, kitab asal di kiri, jalur pink dan teks putih; topik masih datang daripada sesi |
| Compact | Tarikh akhir boleh mengisi ruang minggu pertama seperti legacy; pilihan false menyokong enam baris |
| Export | SVG preview sama diraster ke A4 3508 × 2480 atau A3 4961 × 3508; PDF satu halaman landscape |

Default warna sesi: Subuh/Jumaat `#007aa3`, Maghrib `#ed0b58`, Yasin `#00a99d`.
Ini warna khusus poster daripada rujukan, bukan perubahan token website.
Background gradient poster asal dikekalkan; tiada pattern geometri baharu.

## Fixture dan had

Demo Oktober 2026 dipadatkan untuk review normal/two-session/pending/Yasin/empty
dates. Tiga portrait rujukan digunakan dengan nama Contoh A/B/C; susunan/topik
demo bukan jadual rasmi atau migration. Aturan demo sedia ada dan algoritma
calendar/overrides kekal; tambahan tarikh hanyalah fixture manual dalam memori.
Refresh masih memulihkan demo dan Publish masih disabled.

Perbezaan yang disengajakan atau belum sepadan sepenuhnya:

- Nama/tajuk ialah teks SVG editable, berbanding sebahagian artwork raster dalam
  bundle Talhah; bentuk glyph, baseline dan anti-aliasing mungkin berbeza sedikit.
- Default portrait `contain` menjaga kepala/songkok; framing boleh ada ruang putih
  berbanding `cover` legacy. Sumber portrait kecil kekal kecil; tiada enhancement.
- Ada label DATA CONTOH dalam export. QR infaq/event banner/multi-profile tidak
  ditambah; ruang undated kekal putih apabila tiada kandungan.
- PDF masih raster. Dimensi raster menyamai target piksel 300dpi legacy, tetapi
  proof cetakan/peranti pencetak dan metadata DPI PNG belum disahkan sebagai sama.

Provenance dan lesen adapted renderer:
[third-party/JADUAL-KULIAH-NOTICE.md](third-party/JADUAL-KULIAH-NOTICE.md).
Keputusan GPL derivative/combined application dan hak aset ialah keputusan
pre-production yang masih terbuka, bukan dianggap selesai melalui checkpoint.

QA Oktober sebenar dan pembetulan P3 clipping direkodkan dalam
[SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md): 34 sesi dan 63 elemen teks lulus.
Allowance clip 0.6 unit SVG kiri/kanan mengekalkan posisi/fon/nisbah layout.

## Semakan refinement ini

- `npm run lint`, `npm run build` dan `git diff --check` lulus.
- 1,944 kombinasi bulan 2020–2100 / compact on-off sepadan dengan fungsi
  `monthCells` upstream; semua tarikh muncul sekali dan tiada tarikh hilang.
- Dimensi tiga portrait disahkan daripada fail sebenar; `contain`, nisbah dan
  posisi atas/bawah disemak. Enam aset sama byte dengan upstream.
- Browser renderer pada 375/430/768/1440px tanpa horizontal overflow atau runtime
  errors. Single/two-session, Jumaat pending/speaker, Yasin dan enam baris disemak.
- Teks melampau memaparkan amaran dan menghalang export; fixture biasa tiada overflow.
- PNG A4/A3 mempunyai dimensi sasaran; PDF A4/A3 satu halaman disahkan dengan
  `pdfinfo`. PDF A4 dirender semula dan diperiksa secara visual.
- Studio authenticated memaparkan renderer baharu dengan Publish masih disabled.
- Hash sebelum/selepas mengesahkan tiada perubahan pada public pages, schema,
  architecture/config atau empat dokumen project-memory dalam tugas ini.

Screenshot dan skrip QA berada dalam folder workspace `qa/poster-fidelity/`
di luar repository; ia bukan dependency build/runtime. Fail implementation yang
disentuh ialah `LecturePoster.tsx`, `poster-layout.ts`, `export-poster.ts`,
`model.ts` (optional presentation metadata + fixture/default warna sahaja), dan
dua teks hint dalam `LectureGeneratorTool.tsx`. CSS editor dan logik speaker,
calendar, recurring rules, save/publish tidak diubah.
