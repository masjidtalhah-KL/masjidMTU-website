# Surau Kariah — Fasa 3.5

Route `/profil/surau-kariah` menggunakan `PublicPageLayout`, `PublicPageHeader`,
`Container`, `Section` dan `Heading` sedia ada. Kandungan daripada
`src/lib/public-content/surau.ts`; logo melalui manifest `publicAssets`.

- Dua bahagian: 3 Surau Jumaat dan 12 Surau Biasa, mengikut kategori dan urutan source.
- Nama rasmi dan mapping logo dikekalkan. Kad memaparkan logo dan nama sahaja.
- Pengenalan menyatakan bilangan surau daripada data; tiada dakwaan pentadbiran ditambah.
- Kad Surau Jumaat sedikit lebih lapang, dengan aksen gold; semua tiga berada
  dalam satu baris pada tablet 768px dan desktop. Surau Biasa menggunakan grid responsif.
- Mobile menggunakan kad mendatar supaya logo jelas tanpa kad terlalu tinggi.
- Setiap grid mempunyai tinggi kad seragam dan nama penuh boleh wrap.
- Logo menggunakan `next/image` dengan fail production asal (`unoptimized`).
  Jumlah fail kecil dan dimensi asal terhad; ini mengelakkan compression tambahan
  pada logo yang mempunyai teks/dekorasi halus. Aspect ratio kekal, `object-fit: contain`,
  tanpa crop, redraw, enhancement atau pembesaran melebihi dimensi sumber.
- MIMOS dihadkan kepada 99 × 97px atau lebih kecil apabila ruang terhad;
  warna dan ketajaman sumber yang pudar dikekalkan.
- Kad ialah maklumat sahaja: tiada link, cursor pointer atau hover animation.
- Pattern rasmi hanya pada header bersama. Tiada motion baharu; route transition
  dan reduced motion sedia ada dikekalkan. Kandungan dirender di server.

CSS Modules mengasingkan styling halaman ini. Data, aset, Navbar, PersonCard,
Profil, Organisasi, homepage dan halaman placeholder lain tidak diubah.
Fasa 3.5 telah diluluskan dan ditutup dalam commit khusus; checkpoint tag turut
disediakan pada repository.

## QA untuk review

Semakan 375px, 430px, 768px dan 1440px: 15 kad (3 Jumaat, 12 Biasa), nama
dan urutan tepat, mapping 15 logo tepat, tinggi kad/ruang logo seragam dalam setiap
grid, nama penuh tanpa truncate, tiada overflow dan logo tidak dibesarkan melebihi
dimensi sumber. Kandungan turut disemak tanpa JavaScript dan dengan reduced motion.
Screenshot penuh desktop/mobile, close-up kedua-dua kumpulan dan MIMOS disimpan
di folder QA workspace di luar repo. Lint, production build dan diff check lulus.

Had aset: logo MIMOS memang kecil dan pudar dalam fail sumber; tiada pembetulan
warna atau reconstruction dibuat. Logo lain berbeza whitespace dan ketajaman,
yang dikekalkan untuk menjaga kesetiaan kepada fail rasmi.
