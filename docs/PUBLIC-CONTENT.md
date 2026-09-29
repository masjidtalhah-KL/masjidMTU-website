# Kandungan Tempatan & Aset Public — Fasa 3.1

Fasa 3.1 menyediakan data dan production assets sahaja. Commit Fasa 3.1 tidak mengubah
halaman, Navbar/Footer atau integrasi CMS. Homepage dan design system dikekalkan.

## Sumber kandungan

Original berada dalam folder luaran `Asset-phase-3`. Folder itu tidak diperlukan
semasa build atau runtime website. Semua kandungan berpandukan Markdown berikut:

| Modul | Source of truth |
| --- | --- |
| `src/lib/public-content/profile.ts` | `profile/profile-masjid.md` |
| `src/lib/public-content/organisation.ts` | `staff/staff.md` |
| `src/lib/public-content/surau.ts` | `profile/surau-kariah.md` |
| `src/lib/public-content/gallery.ts` | `interior/interior.md` |
| `src/lib/public-content/contact.ts` | `hubungi.md` |

`HANDOFF.md` memberikan konteks dan keputusan kandungan. Tiada fakta tambahan direka.

## Cara menggunakan data nanti

- `assets.ts` mengeksport `publicAssets` dan jenis `PublicAssetId`.
- Setiap aset mempunyai ID, `src` (production URL), alt text, kategori, context halaman,
  dimensi dan rujukan source relatif.
- Data halaman merujuk ID aset. Contohnya `publicAssets[photo.assetId]` menyediakan
  `src`, `alt`, `width` dan `height` untuk `next/image`.
- `source` dan `sourceIndex` ialah provenance sahaja; jangan digunakan untuk membaca
  fail OneDrive atau membina production path.
- Galeri mempunyai kategori, room, caption asas dan order. Semua 12 foto berada
  dalam kategori Interior Masjid.
- Profil merujuk lima aset interior yang sama dengan Galeri; tiada salinan berganda.
- Data masih static/local. Tiada Sanity, Supabase atau API ditambah.

## Organisasi

Terdapat 25 slot: 4 Jawatankuasa Utama, 10 AJK/Biro, 5 Imam, 4 Bilal, 1 Noja
dan 1 Pembantu Tadbir.

- ID berdasarkan slot jawatan/kumpulan, bukan nama individu.
- Timbalan Pengerusi: `status: "vacant"`, `name: null`, `photoId: null`.
  Slot dan wording jawatan daripada source dikekalkan.
- Soffan Affendi Bin Aminudin: `status: "occupied"`, nama dikekalkan,
  `photoId: null`. UI kemudian menggunakan placeholder neutral.
- Individu dengan dua jawatan mempunyai dua slot dan foto mengikut konteks masing-masing.
- Hanya tiga skim perjawatan yang diberikan disimpan. Selebihnya `null`.

## Production assets

| Kumpulan | Bilangan baharu | Source size (MiB) | Production size (MiB) |
| --- | ---: | ---: | ---: |
| Interior WebP | 12 | 173.21 | 3.36 |
| Staff WebP | 23 | 18.03 | 1.54 |
| Logo surau PNG/JPEG | 15 | 0.38 | 0.38 |

MiB = 1,048,576 bytes. Saiz merujuk fail yang dipilih sahaja.
Manifest mempunyai 51 aset: 50 fail baharu dan logo masjid sedia ada
`/brand/logo-masjid.png`. Logo masjid tidak diduplikasi.

### Conversion

- Menggunakan Sharp yang sudah tersedia dalam installation Next.js; tiada dependency ditambah.
- Interior: WebP quality 85, effort 6, sisi panjang maksimum 2000px,
  `fit: inside`, tanpa upscale. Nisbah asal dikekalkan termasuk mihrab portrait.
- Staff: WebP quality 88, effort 6; dimensi asal dikekalkan tanpa upscale.
- Profil warna ICC dikekalkan apabila tersedia. Tiada colour grading, sharpening,
  AI enhancement, crop atau pengubahsuaian geometri.
- Logo surau disalin byte-for-byte dengan extension asal.
- Original dalam folder sumber tidak ditulis, dinamakan semula atau diubah.

### Pilihan interior

12 nombor sumber yang digunakan: **#2, #4, #5, #6, #8, #9, #10, #11, #14, #15, #17, #19**.

Profil menggunakan #8, #11, #15, #17 dan #19. Foto #18
`papaninfo-carta-kewangan.jpg` dan contact sheet tidak disalin ke production.

### Mapping fail

Semua source path di bawah relatif kepada `Asset-phase-3/`.
Production path relatif kepada repository. ID, alt dan context lengkap berada dalam
`src/lib/public-content/assets.ts`.

| Source asset | Production asset | Dimensi production | Source bytes | Production bytes |
| --- | --- | --- | ---: | ---: |
| `interior/dewan-solat-wide.jpg` | `public/interior/dewan-solat-utama.webp` | 2000 × 1333 | 16255553 | 348082 |
| `interior/dewan-solat-aerial2.jpg` | `public/interior/dewan-solat-aerial-02.webp` | 2000 × 1333 | 19999624 | 481028 |
| `interior/dewan-solat-angle-tepi.jpg` | `public/interior/dewan-solat-sisi.webp` | 2000 × 1333 | 17850320 | 390638 |
| `interior/dewan-solat-safdepan.jpg` | `public/interior/dewan-solat-saf-depan.webp` | 2000 × 1333 | 19567140 | 428904 |
| `interior/dewan-solat.jpg` | `public/interior/dewan-solat-pandangan-umum.webp` | 2000 × 1333 | 18029522 | 342042 |
| `interior/decoration-dewansolat2.jpg` | `public/interior/kaligrafi-dewan-solat.webp` | 2000 × 1333 | 12140424 | 141724 |
| `interior/interior-kubah.jpg` | `public/interior/kubah-interior.webp` | 2000 × 1333 | 15827578 | 266152 |
| `interior/mihrab.jpg` | `public/interior/mihrab.webp` | 1333 × 2000 | 10252191 | 71824 |
| `interior/foyer-masjid.jpg` | `public/interior/foyer-01.webp` | 2000 × 1333 | 14276843 | 209760 |
| `interior/foyer-masjid2.jpg` | `public/interior/foyer-02.webp` | 2000 × 1333 | 11749271 | 269674 |
| `interior/foyer-masjid5.jpg` | `public/interior/foyer-05.webp` | 2000 × 1333 | 12169450 | 206322 |
| `interior/sudut-bacaan-putakamini.jpg` | `public/interior/sudut-bacaan.webp` | 2000 × 1333 | 13504246 | 364370 |
| `staff/ajk/PENGERUSI-ABD-AZIZ-ALI.png` | `public/people/ajk/pengerusi-abd-aziz-ali.webp` | 827 × 1181 | 727069 | 48164 |
| `staff/ajk/SETIAUSAHA-WAN-ABD-HALIM.png` | `public/people/ajk/setiausaha-wan-abd-halim.webp` | 827 × 1181 | 322437 | 19782 |
| `staff/ajk/BENDAHARI-NIK-MUHAMMAD-FADLAN.png` | `public/people/ajk/bendahari-nik-muhammad-fadlan.webp` | 827 × 1181 | 834271 | 69134 |
| `staff/ajk/AJK-BELIA-MOHD-SAFWAN.png` | `public/people/ajk/ajk-belia-mohd-safwan.webp` | 827 × 1181 | 921035 | 85620 |
| `staff/ajk/AJK-BELIAWANIS-MUNIROH.png` | `public/people/ajk/ajk-beliawanis-muniroh.webp` | 827 × 1181 | 917108 | 72726 |
| `staff/ajk/AJK-ZAIDATUL-HASNIDA.png` | `public/people/ajk/ajk-zaidatul-hasnida.webp` | 827 × 1181 | 883097 | 67390 |
| `staff/ajk/AJK-FARAH-FARHAN.png` | `public/people/ajk/ajk-farah-farhan.webp` | 827 × 1181 | 912209 | 74516 |
| `staff/ajk/AJK-MAZLAN-MAHMUD.png` | `public/people/ajk/ajk-mazlan-mahmud.webp` | 827 × 1181 | 868446 | 71188 |
| `staff/ajk/AJK-MOHD-SHAMSUDDIN.png` | `public/people/ajk/ajk-mohd-shamsuddin.webp` | 827 × 1181 | 733468 | 48998 |
| `staff/ajk/AJK-MOHD-HAFIZIE.png` | `public/people/ajk/ajk-mohd-hafizie.webp` | 827 × 1181 | 796500 | 55772 |
| `staff/ajk/AJK-MOHD-FAIZUL-HIZAM.png` | `public/people/ajk/ajk-mohd-faizul-hizam.webp` | 827 × 1181 | 776908 | 62984 |
| `staff/ajk/AJK-MD-HALIM-OMAR.png` | `public/people/ajk/ajk-md-halim-omar.webp` | 827 × 1181 | 531198 | 33630 |
| `staff/pegawai-masjid/imam/IMAM-FARIS.png` | `public/people/pegawai-masjid/imam/imam-faris.webp` | 827 × 1181 | 957571 | 93014 |
| `staff/pegawai-masjid/imam/IMAM-NIK-MUHAMMAD-FADLAN.png` | `public/people/pegawai-masjid/imam/imam-nik-muhammad-fadlan.webp` | 827 × 1181 | 961714 | 97888 |
| `staff/pegawai-masjid/imam/IMAM-TAQIYUDDIN.png` | `public/people/pegawai-masjid/imam/imam-taqiyuddin.webp` | 827 × 1181 | 834421 | 71596 |
| `staff/pegawai-masjid/imam/IMAM-WAN-ABD-HALIM.png` | `public/people/pegawai-masjid/imam/imam-wan-abd-halim.webp` | 827 × 1181 | 578450 | 42128 |
| `staff/pegawai-masjid/imam/IMAM-ZULQURNAIN.png` | `public/people/pegawai-masjid/imam/imam-zulqurnain.webp` | 827 × 1181 | 955994 | 96888 |
| `staff/pegawai-masjid/bilal/BILAL-ROSLAN.png` | `public/people/pegawai-masjid/bilal/bilal-roslan.webp` | 827 × 1181 | 879273 | 78428 |
| `staff/pegawai-masjid/bilal/BILAL-MOHD-SAFWAN.png` | `public/people/pegawai-masjid/bilal/bilal-mohd-safwan.webp` | 827 × 1181 | 917686 | 90206 |
| `staff/pegawai-masjid/bilal/BILAL-SUFI.png` | `public/people/pegawai-masjid/bilal/bilal-sufi.webp` | 827 × 1181 | 935249 | 85472 |
| `staff/pegawai-masjid/bilal/BILAL-TARMIZI.png` | `public/people/pegawai-masjid/bilal/bilal-tarmizi.webp` | 827 × 1181 | 846586 | 79454 |
| `staff/pegawai-masjid/noja/NOJA-HADI.png` | `public/people/pegawai-masjid/noja/noja-hadi.webp` | 827 × 1181 | 888256 | 89636 |
| `staff/pegawai-masjid/pembantu-tadbir/PEMBANTU-TADBIR-IRFAN.png` | `public/people/pegawai-masjid/pembantu-tadbir/pembantu-tadbir-irfan.webp` | 827 × 1181 | 924014 | 81858 |
| `profile/logos-surau/surau-darul-jalil.png` | `public/surau/surau-darul-jalil.png` | 218 × 197 | 10683 | 10683 |
| `profile/logos-surau/surau-al-faizin.png` | `public/surau/surau-al-faizin.png` | 228 × 184 | 25302 | 25302 |
| `profile/logos-surau/surau-al-mustaqim-ppr.png` | `public/surau/surau-al-mustaqim-ppr.png` | 210 × 177 | 30190 | 30190 |
| `profile/logos-surau/surau-khalid-al-walid.png` | `public/surau/surau-khalid-al-walid.png` | 262 × 231 | 58608 | 58608 |
| `profile/logos-surau/surau-al-hidayah-klsc.png` | `public/surau/surau-al-hidayah-klsc.png` | 246 × 246 | 32615 | 32615 |
| `profile/logos-surau/surau-al-muttaqin.png` | `public/surau/surau-al-muttaqin.png` | 177 × 180 | 18229 | 18229 |
| `profile/logos-surau/surau-al-mustaqim-ltat.jpeg` | `public/surau/surau-al-mustaqim-ltat.jpeg` | 235 × 209 | 18239 | 18239 |
| `profile/logos-surau/surau-al-furqan.png` | `public/surau/surau-al-furqan.png` | 432 × 136 | 25232 | 25232 |
| `profile/logos-surau/surau-an-nur-abc.png` | `public/surau/surau-an-nur-abc.png` | 300 × 242 | 18848 | 18848 |
| `profile/logos-surau/surau-al-jannah.png` | `public/surau/surau-al-jannah.png` | 254 × 254 | 37558 | 37558 |
| `profile/logos-surau/surau-al-jalil.png` | `public/surau/surau-al-jalil.png` | 288 × 288 | 49324 | 49324 |
| `profile/logos-surau/surau-an-nur-jalil-mas.png` | `public/surau/surau-an-nur-jalil-mas.png` | 329 × 232 | 55299 | 55299 |
| `profile/logos-surau/surau-ar-raudhoh.jpeg` | `public/surau/surau-ar-raudhoh.jpeg` | 248 × 248 | 7260 | 7260 |
| `profile/logos-surau/surau-mimos.png` | `public/surau/surau-mimos.png` | 99 × 97 | 6607 | 6607 |
| `profile/logos-surau/surau-mercu-jalil.jpeg` | `public/surau/surau-mercu-jalil.jpeg` | 389 × 264 | 6015 | 6015 |

## Kualiti sumber

- Logo Surau MIMOS hanya 99 × 97px dan kelihatan faint. Paparkan pada saiz semula jadi
  atau lebih kecil; jangan upscale.
- Beberapa portrait, termasuk foto Setiausaha dan Md Halim, agak lembut daripada
  sumber. Tiada enhancement dilakukan.
- Logo yang lebar/bulat perlu `object-fit: contain`; jangan crop menjadi logo baharu.

## Validation Fasa 3.1

Semakan merangkumi production path, jumlah aset, ID unik, kandungan/rujukan daripada
Markdown, 25 slot organisasi, vacancy, placeholder, foto jawatan berganda, nisbah gambar,
logo byte-for-byte dan pengecualian #18/contact sheet.

Keutuhan semua original disemak dengan SHA-256, saiz dan masa modification sebelum
serta selepas preparation. Lint, production build dan `git diff --check` dijalankan
sebelum diserahkan untuk review.

Fasa 3.1 telah diluluskan, dikomit dan dipush. Fasa 3.2 menyediakan navigation dan
route shell sahaja; data ini masih belum digunakan oleh UI. Rujuk
[PUBLIC-NAVIGATION.md](PUBLIC-NAVIGATION.md).
