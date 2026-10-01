# Content Migration Preparation — Fasa 4.3A

Disediakan pada **1 Oktober 2026 (+08:00)** untuk review sahaja. Bootstrap dan
preparation/dry-run diluluskan; **Fasa 4.3B, production writes, asset uploads,
publish, commit dan push belum diluluskan/dijalankan**.

## Architecture

Utility Node dalam `scripts/sanity-migration/` berasingan daripada runtime
website dan Studio. Tiada dependency baharu atau schema change.
`jiti` sedia ada memuat source/schema TypeScript, TypeScript membaca kapsyen
Profil secara statik, dan Sharp sedia ada melalui Next.js membaca metadata
imej sahaja. Tiada resize/recompression/regeneration.

1. `plan.mjs`: source → deterministic candidate payloads, stable array keys,
   asset audit (existence, metadata, SHA-1/SHA-256), schema/source fingerprint.
2. `validation.mjs`: compile schema semasa melalui Sanity `createSchema` dan
   jalankan `validateDocument` untuk semua calon sebelum future writes.
3. `dataset.mjs`: raw/non-CDN read-only inventory, asset reuse, conflict
   detection dan future create-only drafts transaction.
4. `cli.mjs`: default dry-run, explicit mode/target/approval/token guards.
5. `report.mjs`: human-readable audit dan optional JSON payload/asset manifest.
6. `migration.test.mjs`: ujian scope, wording, guards, konflik dan rerun
   menggunakan client dalam memori; ujian tidak menghubungi dataset.

## Mapping dan bilangan tepat

| Schema | Bilangan | ID |
| --- | ---: | --- |
| `siteSettings` | 1 | `siteSettings` |
| `profilePage` | 1 | `profilePage` |
| `organisationMember` | 25 | `organisationMember-<slot.id>` |
| `surau` | 15 | `surau.id` asal, contoh `surau-darul-jalil` |
| `galleryCollection` | 1 | `galleryCollection-interior-masjid` |
| **Jumlah** | **43** | Draft kelak memakai prefix `drafts.` |

- Site Settings: nama penuh daripada `profile.name`, alamat/telefon/email/
  Facebook/Instagram/waktu pejabat daripada `contact.ts`. Instagram dikekalkan.
  Alamat disambung dengan newline; waktu pejabat mempunyai keys stabil.
  `shortName` pilihan dibiarkan absent kerana tiada source diluluskan.
- Profil: empat perenggan Pengenalan dan empat Rasional Logo ditukar kepada
  Portable Text normal/span tanpa menukar wording. Visi/Misi/Moto/sourceNote
  kekal. Lima foto mengikuti `spacePhotoIds`; kapsyen tepat daripada
  `spaceCaptions` yang sedang digunakan oleh halaman `/profil`, dibaca secara
  statik tanpa executing/importing page. Heading layout/UI bukan data CMS baharu.
- Organisasi: semua 25 slot, group/role/name/perjawatan/local displayOrder kekal.
  `isVacant` dipetakan daripada `status`; Timbalan Pengerusi tiada name/photo.
  Soffan occupied tanpa photo. Nama sama merentas jawatan tidak dideduplicate.
  `appointment` → `employmentTitle`; null pilihan tidak dijadikan teks.
- Surau: tepat 3 Jumaat + 12 Biasa, nama/category/logo/local order kekal.
  Alamat pilihan hanya daripada data tempatan yang memang wujud; tiada map,
  phone atau facilities ditambah.
- Galeri: satu Interior Masjid, 12 foto sorted by current `order`; stable keys
  daripada `galleryPhotos.id`, room → title, caption/alt sedia ada kekal.
  Slug `interior-masjid` ialah transform schema daripada label kategori diluluskan.
- `isActive=true` bagi slot/surau dipetakan daripada senarai yang sedang
  dipaparkan, bukan kandungan atau jadual rekaan. Semua candidate ialah drafts
  kelak, maka boolean ini tidak menerbitkan kandungan sendiri.
- Schema tiada medan untuk rank kumpulan organisasi; enum/group dan order dalam
  kumpulan dipelihara. Label/parent/rank kumpulan kekal dalam source/UI; schema
  hanya menyimpan group ID dan displayOrder slot. Frontend grouping kekal
  tanggungjawab adapter kemudian, bukan medan baharu yang direka dalam migrasi.

## Aset

**50 fail imej unik: 12 interior + 23 portrait jawatan + 15 logo surau.**
Terdapat **55 penggunaan**: 5 Profil + 23 organisasi + 15 surau + 12 galeri.
Lima foto Profil menggunakan semula imej Galeri. Logo masjid rasmi, brand
pattern dan foto hero kekal local website kerana tiada medan CMS yang memerlukannya.

Audit menyenaraikan path local production, kewujudan, format, saiz bait,
dimensi, hash, owning document dan intended field. Byte fail tidak diubah.
Path direalpath dan mesti kekal dalam `public/interior`, `public/people`
atau `public/surau`; fail hilang/dimensi tidak sepadan menghentikan future writes.

Reference `pending-image-*` dalam JSON dry-run ialah placeholder **sah untuk
semakan struktur sahaja**, bukan Sanity image asset sebenar. Future writer:
query `sanity.imageAsset.sha1hash` → reuse actual `_id` → upload bytes hanya
jika perlu → gunakan actual `_id` returned → validate references read-only.
Dua local files dengan hash sama turut boleh share hasil upload.
Tiada predictable/fake image IDs dihantar oleh writer.

## Command dry-run

```bash
npm run sanity:migrate -- --dry-run
npm run sanity:migrate
npm run sanity:migrate:test
```

Command kedua juga dry-run. Tiada network diperlukan untuk mapping/validation
local. Offline validation menerima hanya reference placeholder aset yang
benar-benar wujud dalam pelan; slug uniqueness remote belum dibuktikan.

Untuk raw dataset read-only:

```bash
npm run sanity:migrate -- --dry-run --inspect-dataset
```

Client menggunakan public read access atau `SANITY_API_READ_TOKEN` server jika
disediakan. Laporan menyatakan visibility berdasarkan permissions client;
anonymous access bukan bukti semua private/draft/system documents dapat dibaca.
Tidak menggunakan token browser, CORS changes atau auth bypass.

Snapshot daripada authenticated connector/CLI juga boleh diaudit:

```bash
npm run sanity:migrate -- --dry-run --dataset-snapshot /path/outside-repo/snapshot.json --report /path/outside-repo/dry-run.md --json /path/outside-repo/dry-run.json
```

Snapshot mesti project/dataset tepat, perspective raw, `complete=true`,
`observedAt`, `total`, full metadata `inventory`, full relevant `documents`
dan matching image `assets`. Known draft/published IDs dan singleton/gallery
inventory mesti mempunyai payload untuk perbandingan. Snapshot bukan pengganti
fresh preflight pada masa write. Simpan di luar repo; jangan commit credentials
atau private dataset exports. Output files mesti di luar repo dan tidak
overwrite fail sedia ada (`wx`).

## Pengendalian dataset dan future write

- Operasi dokumen hanya pada 43 known IDs dan `drafts.` counterparts.
- Existing published/draft payload sama: skip; rerun tiada pendua.
- Different type, editor field, content change, missing matched asset, singleton
  ID lain atau same gallery slug pada unrelated ID: report conflict, stop.
- Document equality mengabaikan hanya `_rev`, `_createdAt`, `_updatedAt`;
  additional editorial fields tidak dibuang atau ditindih.
- Tiada createOrReplace, patch, delete, discard, unpublish atau dataset purge.
- Future writes memerlukan command berasingan:

```bash
npm run sanity:migrate:write-drafts -- --confirm-production 2o95jmms/production --approve-plan <fingerprint-from-reviewed-dry-run>
```

**Jangan jalankan dalam 4.3A.** Command memerlukan server env
`SANITY_MIGRATION_WRITE_TOKEN`. Flag hilang/typo, mode bercanggah, wrong target,
missing token atau fingerprint berubah menghentikan operasi. Snapshot tidak
boleh digunakan untuk mengesahkan write. Jangan masukkan token dalam argument,
laporan, Git atau `NEXT_PUBLIC_*`.

Fresh preflight berlaku sebelum upload. Semua bytes disemak dengan SHA-256 dan
ditahan dalam memori supaya upload memakai bytes yang telah diluluskan.
Schema/actual references divalidasi semula selepas upload, kemudian dataset
disemak semula. Atomic `create` bagi missing drafts gagal jika ID dicipta oleh
editor secara concurrent; ia tidak secara senyap skip/overwrite. Jika uploads
sudah berlaku dan konflik/write error muncul, asset uploads boleh tinggal
unused; tool tidak memadamnya. Rerun boleh reuse aset itu.

Initial migration yang dicadangkan: **draft dahulu → review Studio →
publish secara sengaja selepas kelulusan**. Tool tidak mempublish apa-apa.
Existing identical published document di-skip, tanpa membuat draft tambahan.
Perubahan source selepas initial import menghasilkan konflik untuk review,
bukan automatic synchronization/overwrite.

## Kandungan dikecualikan

- `announcement`, `program`, `newsPost`: homepage mock tiada approved
  production source. Tiada dummy documents.
- Semua lectureSpeaker/rule/month demo, October 2026 QA, legacy lecture data.
- `public/lecture-demo`, gallery rejected imagery, contact sheets, financial chart.
- Supabase/operational records. Frontend CMS fetch, generator Save/Publish,
  `/kuliah`, previews/webhooks tidak termasuk.

## Hasil preparation pada 1 Oktober 2026

Authenticated Sanity MCP raw snapshot **16:18:13 +08:00**:
11 `system.group`, 1 `system.retention`; **0 editorial documents, 0 drafts,
0 image assets, 0 file assets**. Sistem tidak dipadam/disentuh.
Dry-run berdasarkan snapshot tersebut: **43 create-draft candidates, 0 conflicts,
50 local images/55 uses, 0 missing assets, 0 ID collisions, 0 validation errors**.

16 ujian mapping/safety/idempotency lulus; lint dan production build lulus.
Schema extraction dengan required fields, whitespace check dan smoke check enam
public routes (HTTP 200, H1/navigation/footer/images) lulus. Git mengesahkan
tiada perubahan pada public source/components/assets, schemas/config atau lockfile.
Validator sebenar sudah menguji 43 payload;
offline placeholders bukan dakwaan uploaded assets/remote reference existence.

Short name tiada tetapi pilihan: tidak menghalang preparation. Tiada hard
source/schema mismatch atau kandungan tambahan yang memerlukan rekaan.
Kelulusan 4.3B serta cara review/publish diperlukan sebelum migration sebenar.
Provenance/GPL penjana kekal open pre-production dan tidak diubah oleh utility ini.
