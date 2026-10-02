# Controlled Publication — Fasa 4.3C

**Selesai pada 2 Oktober 2026.** Fasa 4.3A menyediakan migration/dry-run tanpa
write/upload (`ea8dd09`, `phase-4.3a-migration-dry-run`). Fasa 4.3B memigrasikan
43 production drafts dan 50 aset imej (`156cdf5`, `phase-4.3b-draft-migration`).
Fasa 4.3C menerbitkan tepat 43 draft tersebut; checkpoint penutupan
`phase-4.3c-controlled-publication`. Resolve tag untuk hash commit penutupan;
hash commit sendiri tidak direkodkan dalam commit yang sama.

Frontend masih local/static; Lecture Generator Publish disabled. Fasa 5 belum
bermula. Homepage mock, announcements/programs/news dan semua lecture/demo/QA/
legacy content tidak dimigrasi atau diterbitkan. Tiada upload baharu dalam 4.3C.

## Pelaksanaan dan bukti transaksi

Hermes digunakan sebagai Linux execution agent sahaja. Work tidak menjalankan
Sanity mutation atau bergantung pada Hermes untuk perubahan repository.
Tooling/fix/dokumentasi/QA repository dikendalikan dalam checkout sebenar oleh Work.

Menurut laporan Linux yang disahkan pengguna, percubaan pertama ditolak dengan
HTTP 400 kerana generated transaction ID `mtu-4.3c-*` mengandungi dot.
Sanity menerima `^[a-zA-Z0-9_-]+$`; **tiada mutation berlaku dalam percubaan gagal**.
Timestamp gagal tidak diberikan dan tidak direka. Prefix diperbetul kepada
`"mtu-4-3c-" + randomUUID()`. Local guard juga menolak ID tidak sah sebelum
API dry-run/request, dengan ujian regresi. Guards publication lain tidak berubah.

Selepas API dry-run lulus, operator melakukan satu atomic retry yang berjaya.
Ini retry manual selepas fix, bukan automatic SDK/application mutation retry.

| Rekod Linux disahkan pengguna | Nilai |
| --- | --- |
| Target | `2o95jmms/production` |
| Transaction ID | `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb` |
| Request | `2026-10-02T11:48:30.173Z` |
| Response | `2026-10-02T11:48:31.971Z` |
| Acknowledged | `2026-10-02T11:48:33.137Z` |

Waktu tempatan ialah 19:48 +08:00 pada 2 Oktober 2026. Request/response/acknowledged
ialah timestamps client Linux, bukan timesheet. Metadata published read-back
secara bebas menunjukkan `_updatedAt=2026-10-02T11:48:30Z`; `_createdAt` asal
`2026-10-02T01:43:46Z` kekal. Semua 43 published mempunyai satu revisi transaksi.

## Keadaan sebelum dan selepas

Preflight Work authenticated/raw `2026-10-02T08:59:45.674Z`: 43 approved drafts,
0 published editorial, 50 image assets, 12 dokumen sistem; 105 rekod keseluruhan.
Semua payload/revisi sepadan, 0 konflik. Handoff read semula
`2026-10-02T09:33:12.480Z` mengesahkan state sama sebelum publication Linux.

Read-back bebas Work authenticated/raw selepas publication,
**2026-10-02T11:59:03.021Z**, mengesahkan:

| Type | Draft sebelum | Published akhir | Draft akhir |
| --- | ---: | ---: | ---: |
| siteSettings | 1 | 1 | 0 |
| profilePage | 1 | 1 | 0 |
| organisationMember | 25 | 25 | 0 |
| surau | 15 | 15 | 0 |
| galleryCollection | 1 | 1 | 0 |
| **Jumlah** | **43** | **43** | **0** |

105 rekod akhir = 43 published + 50 image assets + 12 sistem. Tiada file asset
atau unexpected editorial. Semua 43 published payload identical dengan approved
plan; **0 konflik, 55 references → 50 aset unik**. Metadata inventory bukan sasaran
sepadan preflight; tiada unrelated content disentuh. Tiada rollback/repair diperlukan.
Keadaan draft diinspect secara raw, bukan diandaikan daripada semantik publish.
Read-back penutupan selepas QA pada **2026-10-02T12:18:04.523Z** mengesahkan
counts/payload/revisi masih sama: 43/43 identical, 0 draft, 50 aset, 0 konflik.

Exact 43 IDs/types, original draft revisions dan 50 asset IDs/hash/saiz berada
dalam manifest berjejak `scripts/sanity-migration/approved-publication.json`.
Manifest ialah approval sebelum publication, bukan senarai revisi published baharu.
Singleton IDs `siteSettings`/`profilePage`, organisation IDs berasaskan slot,
surau source IDs dan `galleryCollection-interior-masjid` kekal.

Timbalan Pengerusi kosong; Soffan tanpa foto; pemegang berbilang jawatan kekal
slot berasingan. Surau 3 Jumaat/12 Biasa. Galeri mempunyai tepat 12 imej dalam
urutan source approved; Profil lima foto menggunakan semula aset galeri.
`shortName` absent; tiada maklumat direka atau dilengkapkan.

## Publication tool dan safety gates

`publication-cli.mjs` default kepada authenticated read-only preflight.
`npm run sanity:publish` tidak melakukan mutation. Snapshot dibenarkan untuk
read-only audit sahaja; tidak boleh authorize publication. `publication.mjs`
memerlukan exact target, fingerprint pelan/set, token server setempat, audit
directory baharu di luar repo, raw/non-CDN client dan `maxRetries: 0`.
Local transaction ID format guard berjalan sebelum sebarang action API.

Schema validator dan authenticated references dijalankan sebelum write.
Work menggunakan authenticated snapshot untuk asset-existence checks; live slug
validator tidak dijalankan dalam snapshot mode. Raw inventory, aliases, exact
IDs/payloads diperiksa berasingan; tiada dakwaan public/anonymous read boleh
mengesahkan drafts. Missing/changed draft, extra editorial/aset, partial/mixed
publication atau inventory bukan sasaran berubah menyebabkan STOP, tanpa repair.

[Actions API rasmi](https://www.sanity.io/docs/http-reference/actions) digunakan
melalui @sanity/client **8.9.0**, fixed API **2026-09-01**. Satu atomic request
mengandungi 43 create-ignore absence guards, kemudian 43 supported publish actions
dengan `ifDraftRevisionId`. Existing published version menyebabkan create guard
gagal; ignore membiarkan existing drafts tanpa perubahan. Revision guard menolak
draft yang diedit/dipadam/dicipta semula. Guards tidak mencipta kandungan dalam
approved state. API dry-run tanpa simpanan mesti lulus, kemudian fresh read sebelum
real request. Action gagal membatalkan keseluruhan batch.

Tiada manual create/replace/delete untuk meniru publication, upload/purge atau
silent overwrite. Tiada automatic retry/rollback selepas error/response loss;
inspect authenticated state dahulu. Already-published identical set boleh
diverifikasi tanpa sebarang action. Migration writer create-only asal tidak diubah.

Approved migration fingerprint kekal:
`cbe642f6bdc5265705dbe6079d64dfa2243c83f369a1f32690a5cf83ee30cbae`.
Approved publication fingerprint kekal:
`6234ab9d6d2b958c482d6552351d96c80b8cc3901583581caf83f5cd4c7d6b17`.
Exact Git archive LF fingerprint `f8463e89c8e599ec31b8522995e059c10b05749838f69e4576915e6d83f53569`
turut diterima setelah verifikasi baseline: semua payload/aset sama, 16 fail
schema hanya CRLF/LF. Tool menerima dua raw hashes tepat ini sahaja, bukan arbitrary
schema normalization. Runtime source fingerprint turut direkodkan dalam audit.

## Studio QA dan pembetulan preview galeri

QA menggunakan build production tempatan dan perspektif **Published** pada Studio
logged in: Site Settings, Profil, Carta Organisasi, vacancy/Soffan, Surau dan
Interior Masjid. Published status/read-only controls sepadan remote; tiada draft
diedit atau tindakan Publish dilakukan oleh Work. Susunan payload dan dalam setiap
kumpulan/kategori sepadan source. Studio default group/category sorting dikekalkan;
rank kumpulan frontend kekal tanggungjawab adapter Fasa 5 kelak.

Punca “0 foto”: preview memilih keseluruhan `items` serta child `items.0.image`.
Sanity path observer membina objek path bagi head yang mempunyai child selection,
maka `items` bukan array pada prepare; `Array.isArray(items)` mengembalikan false.
Fix kecil dalam **sanity.config.ts** memilih scalar `items.length` berasingan
daripada thumbnail, kemudian menggunakan numeric count dalam subtitle.
Studio list memaparkan **Interior Masjid · 12 foto**.

Override ini hanya mengubah preview UI. Schema source bytes, fields/validation,
gallery content/order, migration payload/fingerprints dan public rendering kekal.
Tiada field count baharu atau content mutation diperlukan.

## Validation, audit dan checkpoint

Penutupan menyemak lint/build/diff check, 17 migration tests, 14 publication tests
(client dalam memori), schema extraction dengan enforced required fields,
validator 43 remote payloads, authenticated final read-back dan enam public routes.
Public routes kekal local/static dengan HTTP 200, H1/navigation/footer/imej normal.
Perubahan runtime terhad kepada config preview Studio; tiada public source/aset
atau lockfile berubah. Tiada `npm audit fix --force`; advisories sedia ada kekal
scope production hardening.

Audit Linux merekod target, before/schema validation, API dry-run receipt,
exact actions/request/transaction ID/time, response, after counts dan result/error.
Rekod ringkasan bukan rahsia di atas berasaskan laporan pengguna dan read-back Work;
token, `.env.local`, audit directories, execution copies dan temporary logs tidak
dimasukkan ke Git. Fingerprints/manifest tidak menyimpan credentials.

Checkpoint penutupan **phase-4.3c-controlled-publication**. Fasa 4.3C tidak
menyambungkan public frontend ke Sanity atau membolehkan Publish penjana kuliah.
Fasa 5 belum bermula; tiada tindakan publication lanjut diperlukan untuk set ini.
