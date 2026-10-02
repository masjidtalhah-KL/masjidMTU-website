# Fasa 5.1 — Public content reads

**Fasa 5.1 siap dan diluluskan untuk checkpoint pada 2 Oktober 2026 (+08:00).**
Implementation bermula daripada
`main` / `5303a7a97d5125d0068dbd1ade13843af9e4cb5a`, tag
`phase-4.3c-controlled-publication`. Checkpoint akhir:
`phase-5.1-sanity-public-content`; resolve tag untuk hash commit penutupan.
Pengguna meluluskan commit/push selepas final closeout lulus. Fasa 5.2 belum bermula.
Lima route menggunakan published Sanity; local editorial data kekal hanya
explicit fallback untuk temporary outage, dengan revalidation lima minit.

## Scope dan aliran data

| Route | Published query | Presentation |
| --- | --- | --- |
| `/profil` | ID singleton `profilePage` | Sections asal; logo rasmi kekal aset website |
| `/profil/organisasi` | `organisationMember`, `isActive == true` | Kumpulan asal dan `PersonCard` menerima foto terus |
| `/profil/surau-kariah` | `surau`, `isActive == true` | Kategori Jumaat/Biasa asal; logo tidak diupscale |
| `/galeri` | ID `galleryCollection-interior-masjid` sahaja | Adapter `MediaGalleryItem`; lightbox asal |
| `/hubungi` | ID singleton `siteSettings` | `ContactDetailsView` asal |

`src/lib/public-content/cms/server.ts` ialah satu-satunya entrypoint fetch untuk
pages. Import `server-only` menghalang import runtime ke Client Components.
Ia menggunakan base client/env sedia ada; client khusus public tidak mempunyai
token, menggunakan `perspective: published`, `useCdn: false`, timeout 8 saat dan
tiada automatic retry. Identifier public sahaja digunakan. Dataset production
sudah boleh dibaca tanpa authentication; jangan tambah write token browser.

`queries.ts` menyimpan lima projection eksplisit; semua query mengecualikan
`drafts.**` serta `versions.**`, termasuk singleton. Tiada query editorial
homepage, lecture, operasi atau mutation. `types.ts` memisahkan record CMS dan
model presentation. `adapters.ts` memvalidasi runtime sebelum menghasilkan model
typed. GROQ tidak berada dalam page/components.

Kumpulan organisasi disusun mengikut rank UI asal, kemudian `displayOrder` dalam
kumpulan; nama individu tidak dideduplicate. Surau menggunakan rank kategori
asal, kemudian `displayOrder`. Array `spaceImages` dan `items` kekal berurutan;
gallery order berasal daripada index array, bukan nama fail atau asset ID.
Duplicate ID/order, kategori/kumpulan tidak dikenali, vacancy bercanggah,
rich text yang tidak disokong, imej tanpa alt/dimensi atau reference rosak
menjadi `PublicContentError`, bukan kandungan tempatan.

Record aktif boleh berubah melalui penerbitan editor: bilangan baseline disahkan
oleh QA, bukan dikunci dalam runtime. Singleton/koleksi tiada, list aktif kosong,
atau Profil tanpa foto menghentikan mapping secara eksplisit. Ini public contract
Fasa 5.1 yang lebih ketat daripada beberapa field pilihan dalam schema. Contact
alamat/telefon/emel/social/waktu pejabat wajib untuk presentation semasa; nilai
yang dipadam menjadi error, bukan diisi semula daripada fallback. Source note,
caption, perjawatan, foto individu dan logo surau pilihan tidak direka apabila
tiada. Profil mengekalkan maksimum lima foto seperti schema.

## Imej dan visual

Projection imej menggunakan URL serta dimensi original daripada asset reference.
Adapter hanya menerima URL `cdn.sanity.io/images/<configured project>/<dataset>/`
tanpa query/fragment, dengan reference dan dimensi sah. Tiada ID local digunakan
untuk memilih foto CMS; imej baharu yang sah boleh dipaparkan.

`PublicImage` mengekalkan `next/image`, `sizes`, dimensions, lazy loading dan
class asal. Foto CMS diresize sekali melalui Sanity CDN dengan `w`, `q=75`,
`fit=max`, `auto=format`: tiada crop atau upscale. Ini mengelakkan download
original sebelum second optimization oleh Next; QA asal menemui timeout 7 saat
dalam optimizer tersebut. Local fallback memakai optimizer Next asal.
Logo surau kekal `unoptimized` dan scaled berdasarkan dimensi sumber asal.
Remote image pattern Next terhad kepada project/dataset yang dikonfigurasi.

Komposisi approved mengekalkan nisbah seluruh foto. Crop/hotspot editorial tidak
diterapkan dalam Fasa 5.1; ia tidak menggantikan komposisi full-image yang
diluluskan. Tiada CSS, palette, responsive breakpoints atau brand asset berubah.
Foto/title metadata galeri yang tidak pernah dipaparkan pada UI asal tidak
ditambah sebagai kandungan visual baharu.

## Caching, freshness dan kegagalan

- Setiap public fetch menggunakan `force-cache` dan `next.revalidate: 300`,
  dengan tag `public-content:<boundary>`. Tiada webhook atau invalidation endpoint.
- Lima route juga mengeksport literal `revalidate = 300`, termasuk apabila fetch
  gagal dan local fallback digunakan. Build memaparkan kelima-limanya `5m`.
- API Sanity bukan CDN; Next Data Cache dan Full Route Cache mengurus freshness.
  Page boleh diprerender ketika build dan biasanya dilayan daripada cache.
- Selepas 300 saat, request seterusnya mencetuskan background refresh; request
  pencetus boleh menerima page lama. Kandungan baharu muncul selepas regeneration
  berjaya dan request berikutnya. Ini bukan jaminan tepat lima minit; website
  tanpa trafik, outage dan tab browser yang sudah terbuka boleh kekal lama.
  Navigasi/refresh diperlukan untuk tab terbuka; tiada live subscription.
- Temporary network/DNS/connect timeout, abort/timeout, HTTP 408/429/5xx sahaja
  boleh menggunakan sumber tempatan approved. Warning server menamakan boundary
  dan fallback tanpa headers, credentials atau seluruh error response.
- `fallback.ts` membaca modul tempatan/aset asal. Caption Profil fallback kekal
  pada mapping approved dalam page; extractor migration/fingerprint tidak diubah.
  Fallback dilakukan untuk seluruh boundary, bukan campuran field CMS/local.
- Fetch dan mapping dipisahkan: missing documents, invalid payload/reference,
  konfigurasi, bad query, HTTP 400/401/403/404 tidak menjadi fallback.
  Jika error berlaku ketika ISR, Next mengekalkan page terakhir berjaya dan
  mencuba regeneration pada request berikutnya. Initial build tanpa page cache
  gagal pada mismatch; ini mengelakkan schema mismatch tersembunyi.
- Next Data Cache boleh mengekalkan successful read ketika refresh gagal;
  jika failure sampai ke read layer, local fallback digunakan dan route itu
  layak refresh semula selepas lima minit. Tiada cache last-good dalam process
  tambahan atau dependency kepada state satu server instance.
- Fallback ialah snapshot Fasa 3 yang boleh menjadi lebih lama daripada editorial
  CMS kemudian. Semak warning server; kemas kini snapshot melalui review berasingan
  apabila perlu. Ia bukan mekanisme undo/unpublish.

Rujukan: [Next.js ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration).
Panduan versi installed dalam `node_modules/next/dist/docs/` diperiksa sebelum
implementation; Cache Components tidak diaktifkan untuk fasa ini.

## Verifikasi dan had bukti

`npm run public-content:test`: 27 ujian query sebenar melalui GROQ evaluator,
mapping/parity, image resizing, future CMS edit, visibility, vacancy/missing
photo, invalid references/content dan fallback/error policy. Fixture berasal
daripada migration plan approved; draft/release/inactive/other-gallery decoys
memastikan boundary. Tiada mutation/dataset writes dalam tests.

`npm run public-content:verify`: token-free read-only production query bagi
kelima-lima boundary dan image inventory; mapping sebenar serta comparison kepada
baseline approved. Pada review ini: 43 payload identical, 50 hash imej sepadan,
25 slot/23 foto, Timbalan Pengerusi vacant, Soffan tanpa foto, 3 Jumaat/12 Biasa,
5 foto Profil, 12 foto Interior Masjid, contact/social/waktu sepadan. Command ini
ialah parity checkpoint; editorial change yang sah selepas review boleh berbeza
daripada local baseline dan memerlukan review perbezaan secara eksplisit.

Public read hanya membuktikan published perspective; ia tidak membuktikan
bilangan draft. Rekod authenticated closeout Fasa 4.3C ialah sumber bukti
43 published/0 draft/50 aset pada checkpoint, bukan authenticated audit baharu.

QA merangkumi before/after screenshots dan public smoke pada 375/768/1440px,
termasuk homepage guard. Text, links, alt, dimensions dan page heights sepadan;
tiada broken image, horizontal overflow atau page error. Perbezaan pixel kecil
berasal daripada image encoding/resizing (hingga 1.122% pixel dengan perbezaan
channel >16 pada satu Galeri tablet capture), bukan layout/content change.
Gallery keyboard open/arrows/wrap/Escape/focus restoration lulus pada tiga lebar.
Production build dan runtime disemak berasingan. Headers kelima-lima route
menunjukkan `s-maxage=300`; selepas expiry, pemeriksaan runtime bergerak daripada
`STALE` kepada `HIT` selepas background regeneration, tanpa edit CMS.
Outage simulation menggunakan salinan execution terasing dan blocked API reads:
kelima-lima boundary mengeluarkan warning fallback, semua route masih HTTP 200
pada tiga lebar dengan text/links/alt/dimensions/heights sepadan dan local image
URLs sahaja. Tiada flag failure dalam produk.

Lint, production build, `git diff --check`, 17 migration tests dan 14 publication
tests juga lulus. Schema extraction dengan enforced required fields dijalankan
tanpa deployment atau perubahan schema/content production. Bukti screenshot/log
terletak di workspace review luar repository; tiada token/snapshot mentah dikomit.

Homepage Pengumuman, Program, Berita & Aktiviti dan Jadual Kuliah kekal mock/local.
Navbar/Footer kekal source asal. Lecture Generator Publish masih disabled.
Tiada kerja `/admin`, Supabase, campaign, Qurban/Ramadan transactions atau payments.

## Final closeout sebelum checkpoint — 2 Oktober 2026

Selepas kelulusan pengguna, approved implementation dikekalkan dan semua checks
dijalankan semula: lint tanpa warning/error, production build dengan lima route
`5m`, whitespace check, 27 public-content tests + 17 migration tests + 14
publication tests (58/58). Live token-free parity check mengesahkan 43 published
payload identical dan 50 hash imej approved tanpa mismatch; vacancy Timbalan
Pengerusi, Soffan tanpa foto, 25 slot/23 foto, 3 Jumaat/12 Biasa, 12 galeri
berurutan, 5 foto Profil dan contact/social/waktu sepadan.

Production smoke 18 checks (lima route + homepage guard pada 375/768/1440px)
dan isolated outage smoke 18 checks lulus: HTTP 200, text/links/alt/dimensions
sepadan baseline, tiada broken image/overflow/page error. Production menggunakan
CMS image URLs; outage mengeluarkan explicit warning bagi semua lima boundaries
dan menggunakan local URLs sahaja. Source execution copy disahkan sama hash
dengan canonical source. Gallery keyboard/focus checks lulus pada tiga lebar.
Server read layer tidak berada dalam browser chunks; tiada private/write token
ditambah. Homepage/local data/aset/schema/lecture/lockfile kekal tanpa diff.

Canonical state/roadmap/architecture/decisions/journey dikemas untuk Fasa 5.1
siap. Checkpoint `phase-5.1-sanity-public-content`; Fasa 5.2 belum bermula.
