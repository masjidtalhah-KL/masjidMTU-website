# Sanity Content Model — Fasa 4.2 and Fasa 5.2A

Historical Fasa 4.2 snapshot below menyediakan schema editorial sahaja. Current Fasa 5.2A additions/publication are recorded at the end of this document. Kandungan public terus datang
daripada `src/lib/public-content/*` dan `src/lib/homepage-content.ts`. Tiada nilai
source tersebut disalin ke Sanity, tiada gambar diupload dan tiada query CMS
ditambah pada halaman public.

## Document types

| Type / menu editor | Tujuan | Medan utama |
| --- | --- | --- |
| `siteSettings` / Site Settings | Identiti dan contact global; singleton | `mosqueName`, `shortName`, `address`, `phone`, `email`, `facebookUrl`, `instagramUrl`, `officeHours[]` |
| `profilePage` / Profil Masjid | Section halaman `/profil`; singleton | `introduction`, `sourceNote`, `vision`, `mission`, `motto`, `logoRationale`, `spaceImages[]` |
| `announcement` / Pengumuman | Pengumuman public | `title`, `slug`, `summary`, `body`, `publishedAt`, `expiresAt`, `cta {label, url}`, `displayOrder`, `isActive` |
| `program` / Program | Maklumat program akan datang | `title`, `slug`, `description`, `category`, `image`, `startAt`, `endAt`, `venue`, `registrationUrl`, `displayOrder`, `isActive` |
| `lectureSpeaker` / dalaman | Penceramah reusable, model prototype | `name`, `photo`, `defaultTopic`, `isActive` |
| `lectureRule` / dalaman | Aturan berulang, model prototype | `weekday`, `occurrence`, `sessionType`, `speaker`, `topic`, `isActive` |
| `lectureMonth` / dalaman | Satu bulan, tarikh dan sesi embedded | `year`, `month`, `entries[] {date, sessions[], isManualOverride}` |
| `newsPost` / Berita & Aktiviti | Artikel berita/aktiviti | `title`, `slug`, `excerpt`, `image`, `body`, `publishedAt`, `category` |
| `organisationMember` / Carta Organisasi | Satu dokumen untuk satu slot jawatan | `role`, `group`, `isVacant`, `name`, `employmentTitle`, `photo`, `displayOrder`, `isActive` |
| `surau` / Surau Kariah | Senarai surau kariah | `name`, `category`, `logo`, `address`, `displayOrder`, `isActive` |
| `galleryCollection` / Galeri | Koleksi foto berurutan | `title`, `slug`, `description`, `category`, `items[]` |

Label dan penerangan medan editor menggunakan Bahasa Malaysia. Medan pilihan
tidak perlu dilengkapkan untuk sekadar menyamakan tinggi kandungan.

## Singleton dan navigation

Studio **Kandungan** dibahagikan oleh divider kepada tiga kelompok:

1. Site Settings dan Profil Masjid.
2. Pengumuman, Program dan Berita & Aktiviti.
3. Carta Organisasi, Surau Kariah dan Galeri.

Singleton menggunakan ID tetap `siteSettings` dan `profilePage`. Template serta
pilihan **Create new** tidak menawarkan kedua-dua type ini. Duplicate/delete
ditapis daripada document actions. Ini mengelakkan pendua melalui penggunaan
Studio biasa; ia bukan constraint database bagi penulisan terus melalui API.

## Kandungan dan validation

- Tajuk diperlukan, maksimum 160 aksara. Slug menggunakan behaviour normal
  Sanity (`source: title`, Generate, maksimum 96 aksara), termasuk semakan
  uniqueness biasa dalam type berkenaan. Slug bukan penentu route frontend dalam
  fasa ini.
- Ringkasan pengumuman/artikel diperlukan dan dihadkan kepada 300 aksara;
  penerangan pendek program kepada 400 aksara.
- `displayOrder` diperlukan, integer bukan negatif; angka lebih kecil dahulu.
  `isActive` diperlukan tetapi tidak mempunyai initial value. Editor perlu memilih
  visibility ketika kandungan sebenar disediakan nanti.
- Tarikh publish/start diperlukan. Tarikh expiry/end pilihan tidak boleh lebih
  awal daripada tarikh publish/start.
- CTA pengumuman pilihan ialah satu object: apabila ditambah, label dan URL
  kedua-duanya diperlukan. URL menyokong HTTP(S), `/pautan-dalaman` dan
  `#bahagian`, tanpa executable scheme, protocol-relative URL atau credentials.
  URL pendaftaran program mesti HTTP(S) mutlak. URL sosial mesti HTTPS.
- Body artikel menggunakan `blockContent`: perenggan, heading H2/H3, senarai,
  bold/italic dan pautan. Body yang diwajibkan mesti mempunyai teks, bukan array
  kosong. Body pengumuman adalah pilihan.
- Pengenalan dan Rasional Logo menggunakan `paragraphText` yang lebih ringkas:
  perenggan serta bold/italic, tanpa menambah heading bebas. Visi, Misi dan Moto
  diperlukan. Struktur section public yang diluluskan kekal dikawal oleh UI.
- Waktu pejabat ialah array baris `{days, hours}` berurutan, sesuai dengan jadual
  contact semasa. Tiada schedule engine.

Validation ialah bantuan editor Studio. Ia tidak menggantikan authorization
Sanity atau validation bagi sebarang penulis API masa hadapan.

## Keputusan mengikut kandungan semasa

### Profil

`sourceNote` pilihan mengekalkan ruang untuk nota sumber sedia ada. Logo rasmi
kekal `/brand/logo-masjid.png`; tiada upload logo alternatif dalam schema Profil.
`spaceImages` ialah array pilihan, maksimum lima foto seperti komposisi Profil
yang telah diluluskan. Urutan dikawal dengan drag/reorder dalam Studio.

### Organisasi

Group menggunakan nilai stabil daripada data tempatan:
`jawatankuasa-utama`, `ajk-biro`, `imam`, `bilal`, `noja`, `pembantu-tadbir`.

Setiap dokumen ialah slot jawatan, bukan identiti individu. Nama tidak unik:
individu dengan dua jawatan boleh mempunyai dua dokumen dan foto berlainan
mengikut konteks. Nama diperlukan apabila `isVacant` false. Vacancy sah tanpa
nama/foto, dan name/photo perlu dikosongkan bagi slot vacant supaya tidak
menggambarkan orang sebenar. `employmentTitle` serta foto ialah pilihan.
Soffan tanpa foto sah; Timbalan Pengerusi vacant juga sah. Tiada rekod tersebut
dicipta dalam fasa ini.

### Kuliah — semakan Fasa 4.2A

Model `lecture` ringkas diganti dengan penceramah, aturan dan dokumen bulanan.
`lectureDay` / `lectureSession` ialah object embedded, maksimum dua sesi sehari.
Tarikh mesti unik, sah dan sepadan dengan bulan/tahun. Tarikh manual boleh
mempunyai sesi kosong supaya aturan tidak mengisi semula tarikh yang dikosongkan.

Ketiga-tiga document types ini read-only dan tidak ditawarkan dalam Structure,
templates, Create new atau document actions semasa prototype. Tool native
**Penjana Jadual Kuliah** menggunakan data contoh dalam memori sahaja, bukan
dokumen production. Draft/publish sebenar menggunakan lifecycle Sanity nanti;
tiada medan status tambahan yang menduplikasi draft Sanity.

Rujuk [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md) untuk model,
workflow, export demo dan sempadan penerbitan.

### Surau

Kategori surau ialah `jumaat` dan `biasa`. Alamat ialah pilihan kerana medan itu
memang tersedia dalam `src/lib/public-content/surau.ts`, walaupun UI senarai
semasa hanya memaparkan logo/nama/kategori. Tiada telefon, koordinat, map,
jawatankuasa atau fasiliti tambahan direka.

### Gambar dan galeri

`editorialImage` menggunakan asset image Sanity biasa dengan `alt` yang diperlukan
apabila asset dipilih. Gambar pilihan boleh dibiarkan kosong sepenuhnya. Object
gambar separuh diisi tanpa asset meminta editor memilih fail atau membuangnya.
Hotspot/crop tersedia untuk foto; logo surau tidak menggunakan hotspot.

Foto program, berita, organisasi dan logo surau adalah pilihan. Berita mock
semasa tiada foto yang dipetakan; schema tidak memaksa editor mencipta foto.

`galleryMedia` mengandungi `image` yang diperlukan, `title` / ruang pilihan dan
`caption` pilihan. Alt text berada dalam `image.alt`, satu lokasi sahaja.
`galleryCollection.items` ialah array ordered object, minimum satu item apabila
publish. Tiada dokumen berasingan bagi setiap foto. Room dalam manifest tempatan
boleh dipetakan ke title ketika migration nanti; caption tidak direka sekarang.

Kategori koleksi: `interior`, `activities`, `ramadan`, `qurban`. Ini kategori media
editorial sahaja, bukan transaksi kempen. Tiada koleksi/kandungan dicipta sekarang.

## Preview dan ordering

Setiap document type mempunyai preview dengan fallback untuk editor kosong.
Preview menggunakan tajuk/nama/jawatan, kategori atau status yang sesuai dan
gambar jika tersedia. Koleksi menunjukkan bilangan foto; organisasi menunjukkan
`Kosong` bagi vacancy. Item media mempunyai preview title/caption/alt dan gambar.

Ordering disediakan bagi senarai dokumen: display order, tarikh program,
publish date berita/pengumuman, atau tajuk koleksi. Urutan kategori organisasi
public tetap menjadi tanggungjawab pemetaan frontend kemudian, bukan sorting
abjad nama individu.

## Sempadan dan kerja berikutnya

Model Fasa 4.2 dan prototype 4.2A diluluskan pada 2026-10-01 untuk checkpoint
`phase-4.2-sanity-content-model`. Registry akhir mempunyai 11 document types dan
6 support types. Model bulanan kuliah kekal read-only dengan Publish disabled;
ini bukan workflow penerbitan produksi. Fasa 4.3A preparation dan Fasa 4.3B
draft-only migration kemudian disiapkan; model schema ini tidak diubah.
Fasa 4.3C Controlled Publication juga selesai pada 2 Oktober 2026.

Sanity hanya untuk kandungan editorial/public. Peserta Qurban, registrations,
payments, receipts dan transaksi Ramadan kekal dirancang untuk
Supabase/PostgreSQL + `/admin`.

Fasa 4.3B mengisi 43 draft dan 50 aset imej unik, tanpa konflik/publish;
rujuk [SANITY-MIGRATION.md](SANITY-MIGRATION.md).
Keadaan selepas 4.3C: 43 published editorial, 0 draft, 50 aset unik dan 0 konflik;
rujuk [SANITY-PUBLICATION.md](SANITY-PUBLICATION.md). Preview count galeri
dibetulkan dalam config Studio sahaja; fields/model/payload kekal. Frontend
masih local/static dan Fasa 5 belum bermula.
Public CMS queries, draft preview, Presentation Tool dan webhook belum dilaksanakan. Authentication Studio asal
kekal. Tiada dependency baharu diperlukan untuk model ini.

Rujukan API: [validation Sanity](https://www.sanity.io/docs/studio/validation),
[preview](https://www.sanity.io/docs/studio/previews-list-views) dan
[image type](https://www.sanity.io/docs/studio/image-type).

## Current Fasa 5.2A model and published state

Program adds optional scheduleType (`scheduled` / `ongoing`). Missing means legacy scheduled; scheduled requires startAt. Ongoing may omit startAt/endAt, respects genuine supplied bounds and isActive, and invents no end date or clock time. Dapur is the first active ongoing published Program.

siteSettings adds optional ncrService (heading, introduction, officers with name/role/phone, optional poster) and donationInfo (heading, copy, recipientLabel, primaryQr with alt). Populated objects validate strictly; QR crop/hotspot/transforms are rejected. No new decorative eyebrow field.

Final public donation copy:

- Presentation eyebrow: **Salurkan sumbangan anda**.
- CMS `donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- CMS `donationInfo.copy`, paragraph 1: **Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.**
- CMS copy, paragraph 2: **Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.**

Copy uses the existing text field with a blank-line paragraph separator. No decorative CMS field added.
The reminder is a separate 14px paragraph; description stays 16px. Existing heading sizes,
navy/gold layout, QR artwork/reference/alt/caption and both actions remain intact.

Fasa 5.2A completed pada 3 Oktober 2026. Checkpoint: `phase-5.2a-editorial-public-information`; resolve tag untuk hash commit akhir.
Published Sanity: 0 drafts, 1 Program, 0 Announcement, 0 News, 53 image assets.
Dapur Zohor Barakah ialah Program pertama, active dan ongoing tanpa tarikh tamat rekaan.
NCR evergreen dan general mosque DuitNow QR published melalui siteSettings.
Typed server-only read layer kekal published-only, token-free dan revalidate 300 saat.
Healthy empty Announcement/News disengajakan; outage tidak mencipta editorial/QR/contact fakta,
dan malformed/auth/query failures kekal visible errors. Mock editorial tidak diseed.
Genius Aulad pending required publishedAt; Qiam/Bubur Asyura HOLD.
Dapur-specific QR kekal berasingan; QR-only asset excluded/unclassified.
Facebook curated/manual, tiada importer. Jadual Kuliah local/mock;
Lecture Generator Publish disabled dan Fasa 5.3 belum bermula.
Historical Fasa 4.3 manifests, approval payloads dan mutation guards kekal immutable.

Historical Fasa 4.3 registry/evidence is frozen at its checkpoint; today's schemas cannot reuse that mutation approval. Current schema extraction and document validation passed. See [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md).


## Fasa 5.2B optional News event-date semantics

newsPost.eventDate is an optional Sanity date (YYYY-MM-DD), the actual date an activity/event occurred. The owner-approved Genius Aulad draft stores 2026-05-14. Existing documents without the field remain valid.

publishedAt remains required datetime: the actual website publication time. Homepage date display prefers eventDate and falls back to publishedAt; publishedAt continues to control eligibility/order. Facebook/source-post date/time remains provenance documentation only. A strict shared calendar parser prevents date rollover and malformed dates; no image/card redesign or historical evidence rewrite. The draft remains unpublished with publishedAt absent; its sole intended publication validation gate remains Required.

## Fasa 5.2B completed — current News contract

The optional newsPost.eventDate date and image contract described above are now used by the first published Genius Aulad record. eventDate records 2026-05-14; publishedAt is 2026-10-03T11:18:02Z, the actual website publication instant. Source Facebook post date remains provenance documentation only. Existing articles without eventDate/image stay valid. Required publishedAt is unchanged; it governs publication eligibility and ordering. Historical Fasa 4.2/4.3 tables and approval evidence remain snapshots. See [publication/closeout record](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

## Fasa 5.3A — approved optional full date poster (not deployed)

lectureDay.specialPoster is optional. When present it requires image: editorialImage
(existing asset reference and alt validation), fit: cover/contain (default cover), optional position: top/center/bottom (default center),
and mode: full (hidden fixed choice). Its containing day must be manual. Sessions
remain 0–2 and are preserved beneath the visual override. Existing lectureSpeaker,
lectureRule, lectureMonth, lectureDay and lectureSession stay authoritative; no new
document/support type is added. Monthly ID is lectureMonth-YYYY-MM. Existing optional
speakerName/photo fields retain snapshot semantics. No dataset migration, schema
deployment or production documents were created. [Design/5.3B plan](LECTURE-GENERATOR-UX-RECOVERY.md).

## Fasa 5.3A — approved optional poster-level infaq flag (not deployed)

lectureMonth.showInfaq is an optional boolean with initialValue true. Legacy months without it remain valid; the runtime default is ON. No QR/image field is added to lectureMonth or lectureDay for this panel. Resolve the approved general mosque QR once from mosque-wide donation configuration in the future Studio adapter; repeated months do not require repeated uploads. The current owner-supplied QR is a byte-identical local review asset only. Document types remain read-only; no schema deployment, production mutation or persistence occurs.

## Fasa 5.3B — persisted lecture snapshot

Existing lectureSpeaker / lectureRule / lectureMonth / embedded lectureDay and
lectureSession stay authoritative. No per-date/session document is added.
Optional lectureSession.photoLayout (fit, positionY, zoom, borderInset) retains
the approved portrait rendering settings across conversion without changing bytes.
specialPoster image/alt/full/fit/position and showInfaq retain the 5.3A contract.
Name/photo/topic snapshots remain stable if speaker/rule profiles change later.
Schema extraction/validation passes. The real October monthly draft is persisted; no lecture publication or speaker/rule seeding.

[Authenticated persistence and exact first-save proposal](LECTURE-DRAFT-PERSISTENCE.md).

## Fasa 5.3B — published optional compact QR

siteSettings.donationInfo.compactQr is an optional image with required asset and
alt (max 300), square PNG/JPG/WebP, hotspot disabled and explicit rejection of any
crop/hotspot. Existing settings without it remain valid. Jadual runtime reads
published compactQr exclusively; absent/unusable configuration warns and omits.
Public primaryQr remains branded. The compact QR is published in mosque-wide settings. No month/day QR fields. Operational lecture schema labels are
English with domain terms retained; IDs/values/poster Malay unchanged.
[Complete settings draft proposal](LECTURE-COMPACT-QR-DRY-RUN.json).

Fasa 5.3B is completed; [actual Studio Save Draft closeout](LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.md). Historical Fasa 5.3A evidence above retains its original no-write boundary.
