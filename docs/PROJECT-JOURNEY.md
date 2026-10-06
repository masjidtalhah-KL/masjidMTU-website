# Perjalanan Projek — Fasa 0 hingga 4.3B

## 6 October 2026 (+08:00) — Fasa 6.0 approved and closed

Continued from clean synchronized `dff2327939060dc79641c6014961f7055f777279`
after Fasa 0–5 completion. Inspected canonical docs, App Router/configuration and
existing service boundaries: Supabase/admin are placeholders only, with no auth
package, client, admin routes or migrations. Official Supabase/Next.js guidance
and the bundled Next.js authentication guide informed the planning.

Prepared and owner-approved [Admin Foundation architecture/security plan](ADMIN-FOUNDATION-PLAN.md):
Google invite-only admission, live membership, owner TOTP/AAL2, generic roles,
minimum three-table model, RLS policy matrix, lifecycle/recovery, routing/session,
staging/production strategy, audit/threat model and a bounded 6.1 proposal.
The owner confirmed super_admin-only access management, 7-day invitations,
Google + Supabase TOTP/AAL2 for super_admin, recent privileged MFA/step-up with
an approximately 10-minute target where supported, and initial AAL1 for admin/staff.
Recovery custody is primary + backup TOTP, owner-only Vaultwarden and independently
protected project-owner recovery. Local + hosted staging is sufficient for 6.1;
separate production must wait for explicit owner provisioning approval. Audit
begins with the first foundation mutation, with proposed 12-month retention.
Session timeout values remain conditional targets pending hosted-plan support.
Qurban, Ramadan, BKK, payment, receipt, registration and finance remain excluded.

Fasa 6.0 is closed. Documentation/diff checks cover canonical links, consistent
owner decisions/status, documentation-only scope and preserved historical records.
Checkpoint: `phase-6.0-admin-foundation-architecture` (resolve tag for final commit).
Only documentation and Git checkpoint work is authorized here. Fasa 6.1 has not
started; no runtime/env/package/database changes or Supabase remote resources.

The prior timeline and execution/audit records below remain unchanged.

Rekonstruksi pada **1 Oktober 2026** daripada `git log --all`, refs/tags,
ROADMAP dan dokumen fasa. GitHub `main`/tag refs turut disemak secara read-only.
Semua waktu di bawah ialah **+08:00**. Author dan committer dates bagi commit
yang disenaraikan adalah sama. Ini metadata Git yang direkodkan, bukan bukti
masa mula kerja, jumlah jam, approval, push atau deployment.

## Timeline commit yang boleh disahkan

Hash pendek mengenal pasti commit dalam repo; setiap baris mempunyai tarikh dan
waktu tepat daripada Git. Label fasa dirumus daripada subject, perubahan dan docs.

| Tarikh | Waktu | Commit | Peristiwa / kaitan fasa |
| --- | --- | --- | --- |
| 2026-09-26 | 19:24:10 | `38f2d9e` | Initial website project — asas Fasa 0 |
| 2026-09-26 | 20:12:25 | `c8c9252` | Fasa 0: kemas kini tetapan, dokumentasi dan README |
| 2026-09-27 | 11:48:31 | `4b42872` | Add official mosque brand assets |
| 2026-09-27 | 11:57:12 | `341bfc5` | Organize mosque brand assets |
| 2026-09-27 | 11:59:11 | `0c9893e` | Add mosque branding assets |
| 2026-09-27 | 12:23:27 | `6d0314b` | feat: add Masjid Talhah design system — Fasa 1 |
| 2026-09-27 | 13:05:36 | `69a45de` | feat: refine Masjid Talhah visual identity — refinement 1.1 |
| 2026-09-27 | 13:21:30 | `16fa97e` | feat: refine official brand pattern fidelity — refinement 1.2 |
| 2026-09-27 | 13:36:14 | `19f3c6c` | chore: clarify official brand pattern asset |
| 2026-09-27 | 14:40:53 | `f24b1ee` | feat: complete Masjid Talhah design system — penutupan Fasa 1 |
| 2026-09-28 | 08:26:41 | `4ab8a03` | feat: complete public homepage — penutupan Fasa 2 |
| 2026-09-28 | 08:36:43 | `d92a571` | Merge PR #1 dari `feat/public-homepage` ke main |
| 2026-09-29 | 15:29:06 | `12d8bc8` | chore: prepare phase 3 public content and assets — Fasa 3.1 |
| 2026-09-29 | 16:14:31 | `71a2d95` | feat: add public navigation and page shell — Fasa 3.2 |
| 2026-09-29 | 22:24:19 | `9a9c0a3` | feat: complete public profile page — Fasa 3.3 |
| 2026-09-30 | 00:10:07 | `d7d93ff` | feat: complete organisation chart page — Fasa 3.4 |
| 2026-09-30 | 09:53:59 | `6db9a65` | Update README.md — commit pada sejarah remote yang kemudian dimerge |
| 2026-09-30 | 15:17:26 | `61d09f3` | feat: complete surau kariah page — Fasa 3.5 |
| 2026-09-30 | 15:18:24 | `de64d3f` | Merge remote-tracking branch `origin/main` |
| 2026-09-30 | 16:24:38 | `5936bfd` | feat: complete public gallery page — Fasa 3.6 |
| 2026-09-30 | 19:53:06 | `c9d0d20` | feat: complete public contact page — Fasa 3.7 |
| 2026-09-30 | 20:59:04 | `d48e36c` | feat: add Sanity CMS foundation — Fasa 4.1 |

Checkpoint 4.2/4.2A diluluskan pengguna pada 2026-10-01 (tarikh sesi).
Commit/tag akhir boleh disahkan melalui `git show phase-4.2-sanity-content-model`;
masa commit/tag mestilah dibaca daripada Git selepas close-out, bukan dianggarkan
daripada masa kerja. Tag ini merangkumi model editorial, prototype kuliah,
refinement renderer, QA Oktober dan dokumen project-memory.

Fasa 2.1 (foto rasmi, crop responsive, section visibility dan exterior rendering)
terkandung dalam hasil homepage. **Tarikh setiap sub-refinement tidak dapat
dipisahkan dengan tepat daripada commit penutupan.** Peristiwa merge ialah bukti
integrasi main, bukan waktu deploy. Commit README selari dan merge 30 September
dicatat untuk menjelaskan sejarah, bukan sebagai fasa produk tambahan.

## Checkpoint tags sebenar

Tarikh tagger hanya tersedia untuk annotated tags. Lightweight tags tiada
metadata tarikh ciptaan; tarikh target commit tidak boleh dianggap tarikh tag.

| Tag | Jenis | Target commit | Tagger date tepat (+08:00) |
| --- | --- | --- | --- |
| `phase-1-design-system` | Lightweight | `19f3c6c` | Tidak tersedia |
| `phase-2-homepage` | Lightweight | `19f3c6c` | Tidak tersedia |
| `phase-3.4-organisasi` | Annotated | `d7d93ff` | 2026-09-30 00:10:27 |
| `phase-3.5-surau-kariah` | Annotated | `61d09f3` | 2026-09-30 15:17:39 |
| `phase-3.6-gallery` | Annotated | `5936bfd` | 2026-09-30 16:24:38 |
| `phase-3.7-contact` | Annotated | `c9d0d20` | 2026-09-30 19:53:58 |
| `phase-4.1-sanity-foundation` | Annotated | `d48e36c` | 2026-09-30 21:00:03 |

**Anomali:** tag Fasa 1 dan 2 menunjuk ke commit yang sama, `19f3c6c`.
ROADMAP pada commit itu masih menandakan Fasa 1 “Semasa”, Fasa 2 “Belum bermula”.
Jadi kedua-duanya bukan checkpoint penutupan sebenar. Gunakan `f24b1ee` untuk
hasil akhir Fasa 1 dan `4ab8a03`/`d92a571` untuk Fasa 2. Jangan memindahkan tag
secara senyap. Tiada tag Fasa 0/3.0–3.3 ditemukan dalam refs yang disemak.
Checkpoint gabungan 4.2/4.2A menggunakan annotated tag
`phase-4.2-sanity-content-model`; resolve tag itu untuk target dan tarikh Git tepat.

## Peristiwa tanpa commit/tarikh khusus

| Peristiwa | Bukti dan status | Kepastian tarikh |
| --- | --- | --- |
| Fasa 3.0 — planning/asset mapping | ROADMAP menyatakan diluluskan; source dan mapping diteruskan dalam Fasa 3.1 | Sebelum Fasa 3.1 ialah inferens urutan; tarikh asal tidak tersedia |
| Visual review/QA aset 3.1 | Hasil preparation serta dokumen PUBLIC-CONTENT | Masa review tidak mempunyai commit khusus |
| Kelulusan setiap refinement visual | Hasil terkandung dalam commit fasa dan docs | Tidak boleh menyamakan tarikh commit dengan tarikh approval |
| Fasa 4.2 — content schemas | SANITY-CONTENT-MODEL dan kod schema | Diluluskan untuk checkpoint 2026-10-01; masa mula kerja tidak diketahui |
| Fasa 4.2A — penjana kuliah | Native tool dan renderer React; QA October 34 sesi | Diluluskan untuk checkpoint 2026-10-01; masa mula kerja tidak diketahui |
| Project memory/cost foundation | Empat dokumen project-memory | Disusun 2026-10-01; disertakan dalam checkpoint 4.2 |

Urutan selepas Fasa 4.1 berdasarkan ROADMAP dan dependensi implementation;
bukan tarikh Git bagi kerja belum dikomit. File modification time bukan bukti
stabil tarikh keputusan kerana boleh berubah ketika copy/checkout/edit.

## Ringkasan perkembangan

- **Fasa 0:** aplikasi dan panduan repo disediakan.
- **Fasa 1:** token/komponen, visual refinement dan pembetulan kepada penggunaan
  PNG pattern rasmi; institutional sans-serif dan motif mihrab hiasan dikunci.
- **Fasa 2:** homepage mock lengkap, foto kubah/exterior rasmi dan progressive
  animation; integrated ke main melalui PR #1.
- **Fasa 3:** Markdown tempatan/asset manifest → shared shell → Profil →
  Organisasi → Surau → Galeri → Hubungi. Kandungan masih static/local.
- **Fasa 4.1:** embedded Sanity Studio, login, central env dan Site Settings;
  public website belum membaca CMS.
- **Fasa 4.2/4.2A checkpoint diluluskan:** 11 document types/6 support types,
  penjana kuliah dalam memori dan renderer berdasarkan legacy yang dipin.
  QA Oktober sebenar 34 sesi/63 elemen teks lulus; PNG dan PDF A4/A3 dieksport.
  Fixture tidak dimigrasikan. Tiada save/publish atau production writes.
  Pada checkpoint model ini Fasa 4.3 belum bermula; kemajuan berikutnya direkod
  di bawah. Keputusan GPL sebelum production masih terbuka.
  Rujuk [PROJECT-STATE.md](PROJECT-STATE.md) untuk sempadan semasa.

## Had rekonstruksi dan cara mengemas kini

### Sambungan kerja Fasa 4.3A — 1 Oktober 2026

Bootstrap repository diluluskan, kemudian preparation/dry-run sahaja diminta.
Utility ber-ID deterministik menyediakan 43 dokumen editorial, 50 fail imej
unik/55 penggunaan dan draft-first workflow kelak. 16 ujian dalam memori serta
lint/build, enforced-required schema extraction, whitespace check dan enam
public runtime smoke checks lulus; source public, schemas dan penjana tidak diubah.

Dataset raw diperiksa melalui Sanity MCP secara authenticated/read-only pada
16:18:13 +08:00: 12 dokumen sistem, tiada editorial/draft/aset. Tiada upload,
mutation/publish, commit/push atau Fasa 4.3B. Hasil preparation berada dalam
working tree untuk review ketika snapshot preparation ini dibuat; penutupan
kemudian dikomit sebagai `ea8dd09` pada 17:39:33 +08:00 dan dipush ke main,
tag `phase-4.3a-migration-dry-run` pada 17:39:41 +08:00.
Tiada write/upload berlaku dalam Fasa 4.3A; milestone Git bukan bukti jam kerja.
Rujuk [SANITY-MIGRATION.md](SANITY-MIGRATION.md). Nota status docs public/ledger
yang lapuk diperbetulkan; anomaly dua tag lama tidak diubah.

### Migration draft dan penutupan Fasa 4.3B — 2 Oktober 2026

Pengguna mengesahkan remote migration berjaya. Metadata 43 draft merekod
`_createdAt=2026-10-02T01:43:46Z` (09:43:46 +08:00); timestamp ini ialah
bukti creation remote, bukan masa mula/end sesi kerja. Closeout membaca remote
secara authenticated/raw: 43 draft, 50 imej unik, 12 sistem, 0 published editorial.
Semua sasaran `skip-identical`, tiada konflik atau references hilang.

QA visual Studio menggunakan login/origin review sedia ada dan tidak mengedit
atau mempublish draft. Laporan write dibetulkan untuk label `WRITE-DRAFTS`
dan tahap preflight tanpa menukar safety model. Public source/schema/aset
tidak diubah; frontend masih local/static, Publish penjana kuliah disabled.
Checkpoint penutupan `phase-4.3b-draft-migration`; resolve tag untuk hash dan
timestamp Git tepat. Fasa 4.3C dan Fasa 5 belum bermula.

### Controlled Publication 4.3C diluluskan; persediaan sahaja — 2 Oktober 2026

Baseline `main` bersih dan HEAD/tag 4.3B `156cdf542c5a44ca9006222dbd30eb40ffc2ebb2`
disahkan sebelum perubahan. Authenticated raw preflight pada
2026-10-02T08:59:45.674Z mengesahkan 43 draft, 50 imej, 12 sistem,
0 published editorial dan 0 konflik. Semua 43 payload/revisi dan 55 references
kepada 50 aset sepadan. Timestamp ini ialah pemeriksaan, bukan publication.

Arahan pengguna membenarkan controlled publication hanya untuk 43 ID migration.
Work tidak mempunyai credential tulis setempat, maka tooling, manifest dan
preflight disediakan untuk Linux. Tiada Work mutation/upload/publication,
commit/push atau tag 4.3C; read-back/QA selepas publication belum boleh direkodkan.
Frontend local/static dan Publish penjana disabled. Subtitle gallery “0 foto”
ditangguh kerana pembetulan schema preview mengubah fingerprint yang dikunci.
Rujuk [SANITY-PUBLICATION.md](SANITY-PUBLICATION.md); Fasa 5 belum bermula.

### Publication Linux dan penutupan 4.3C — 2 Oktober 2026

Hermes digunakan sebagai Linux execution agent sahaja; perubahan repository
penutupan dilakukan oleh Work. Menurut laporan pengguna, percubaan awal HTTP 400
kerana prefix `mtu-4.3c-*` mengandungi dot tidak melakukan mutation. Timestamp
percubaan gagal tidak diberikan; jangan menganggarkannya. Prefix dibetulkan
kepada `mtu-4-3c-`; selepas API dry-run lulus, operator melakukan atomic retry.

Transaksi `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb` request
`2026-10-02T11:48:30.173Z`, response `11:48:31.971Z`, acknowledged
`11:48:33.137Z` (19:48 +08:00), daripada rekod Linux yang disahkan pengguna.
Metadata published remote secara bebas menunjukkan `_updatedAt=11:48:30Z`;
ini bukan ukuran jam kerja atau timestamp respons client.

Read-back Work authenticated/raw `2026-10-02T11:59:03.021Z` mengesahkan
43 published, 0 draft, 50 aset, 55 references kepada 50 aset unik, 0 konflik;
semua 43 payload identical, inventory bukan sasaran tidak berubah.
QA Studio dalam perspektif Published menyemak settings/profile/organisasi/surau/
galeri dan imej. Subtitle “0 foto” diperbetul melalui scalar length selection
dalam config Studio; schema meaning/bytes, payload dan fingerprints tidak berubah.
Local transaction ID regex guard menghalang insiden dot berulang sebelum API call.

Checkpoint `phase-4.3c-controlled-publication`; resolve tag untuk commit/tarikh
Git penutupan. Public frontend masih local/static, Publish penjana kuliah disabled,
Fasa 5 belum bermula. Butiran dan exact target IDs/types:
[SANITY-PUBLICATION.md](SANITY-PUBLICATION.md). Tiada token/audit directories/log
atau salinan execution Linux dikomit.

Semasa rekonstruksi asal, sebahagian dokumen PUBLIC masih mempunyai ayat status
lama seperti “belum dikomit” atau “placeholder”. Itu snapshot fasa terdahulu;
commit/ROADMAP membuktikan halaman telah siap. Housekeeping Fasa 4.3A kemudian
memperjelas status semasa sambil mengekalkan konteks implementation asal.

Waktu push, approval, sesi kerja, login/CORS dashboard dan deployment tidak boleh
dipulihkan tepat daripada Git tempatan sahaja. Screenshot/QA di luar repo tidak
semestinya tersedia pada mesin baharu. Tiada invoices, usage ledger atau timesheet
yang mengesahkan kos/usaha kerja; rujuk [PROJECT-COSTS.md](PROJECT-COSTS.md).

### Dynamic Content Integration 5.1 untuk review — 2 Oktober 2026

Bootstrap memulihkan main bersih pada `5303a7a` dan tag
`phase-4.3c-controlled-publication`. Arahan pengguna membenarkan integration
lima route approved tanpa redesign/content writes/commit/push. Public read
baharu mengesahkan 43 published payload dan 50 hash imej identical kepada
sumber approved; public perspective tidak digunakan untuk mendakwa audit draft.

Typed server-only query/adapter layer, Next revalidation 300 saat dan explicit
temporary-outage fallback diimplement. CSS/aset source/homepage editorial dan
lecture publication tidak berubah. QA responsive, production rendering dan
fallback direkodkan dalam [SANITY-PUBLIC-CONTENT.md](SANITY-PUBLIC-CONTENT.md).
Ini implementation untuk review; tiada commit/tag/push atau production mutation.

### Kelulusan dan penutupan Fasa 5.1 — 2 Oktober 2026

Pengguna meluluskan implementation sedia ada untuk checkpoint, dengan final
closeout sebelum commit/push. Lima route public menggunakan published Sanity
melalui server-only read layer; local editorial content kekal explicit fallback
bagi temporary outage dan revalidation kekal lima minit. Approved parity,
lint/build, 58 relevant automated tests, query/content checks, outage/fallback
dan public smoke disemak semula. Rekod penuh dalam
[SANITY-PUBLIC-CONTENT.md](SANITY-PUBLIC-CONTENT.md).

Fasa 5.1 siap; checkpoint `phase-5.1-sanity-public-content`, resolve tag untuk
hash/timestamp Git sebenar. Homepage pengumuman/program/berita/kuliah masih
local/mock; Lecture Generator Publish disabled. Tiada production content writes.
Fasa 5.2 belum bermula; sesi penutupan berhenti selepas checkpoint.

Apabila fasa berikutnya dikomit, tambah commit/date/tag sebenar dan pautan bukti
review jika tersedia. Kekalkan label inferens pada peristiwa yang tiada bukti tepat.

### Fasa 5.2 — Homepage editorial frontend untuk review, 2 Oktober 2026

Baseline 5.1 disahkan pada `5125ba46a52ddfd2a7d790fc8c490b427662133a`,
tag `phase-5.1-sanity-public-content`. Pengguna memberi scope khusus Pengumuman,
Program dan Berita & Aktiviti; Jadual Kuliah dikecualikan untuk Fasa 5.3.
Fresh published read mendapati 0 announcement, 0 program dan 0 newsPost.
Tiada approved published content tersedia; private drafts tidak dapat diaudit
melalui public read. Mock homepage tidak dijadikan production content.

Architecture/frontend menggunakan typed server-only published bundle,
revalidation 300 saat, strict projected-content validation dan neutral empty
states. Temporary outage fallback ialah UI kosong yang jelas unavailable;
tiada editorial mock facts. Existing layout/card/design source dikekalkan.
Lima route 5.1, schema, Lecture Generator dan operasi tidak diubah.
Butiran/checks: [SANITY-HOMEPAGE-CONTENT.md](SANITY-HOMEPAGE-CONTENT.md).
Berhenti untuk review sebelum seeding/publication/commit/push; tiada checkpoint
5.2 atau claim content completion. Fasa 5.3 belum bermula, Publish disabled.

### Kelulusan dan penutupan Fasa 5.2 — 2 Oktober 2026

Pengguna meluluskan technical review, kemudian manual browser visual review
bagi homepage empty-state Pengumuman, Program dan Berita & Aktiviti. Empty-state
ini disengajakan: production masih 0 announcement, 0 program dan 0 newsPost
published. Existing mocks tidak diseed atau diterbitkan. Automated browser
launch disekat sandbox; kelulusan visual ialah review manual pengguna.

Fasa 5.2 siap dengan typed server-only published bundle, revalidation lima minit,
healthy empty states, explicit temporary-outage UI tanpa editorial rekaan dan
visible malformed/auth/query errors. Final lint/build, 99 automated tests,
Sanity parity/query, public route smoke, outage/malformed runtime checks dan
whitespace/scope checks direkodkan dalam
[SANITY-HOMEPAGE-CONTENT.md](SANITY-HOMEPAGE-CONTENT.md).

Pengguna meluluskan commit/push origin/main dan checkpoint
`phase-5.2-homepage-editorial-integration` selepas checks lulus; resolve tag
untuk hash/timestamp sebenar. Jadual Kuliah kekal di luar 5.2; Lecture Generator
Publish disabled. Tiada seeding/publication/production writes. Fasa 5.2A content
preparation dan Fasa 5.3 belum bermula. Berhenti selepas checkpoint.

### Fasa 5.2A — source inspection dan preparation plan, 3 Oktober 2026

Main bersih/synced pada `72506d2f7b6d5fb7a176c7ac848beade4186bfd3`;
remote main dan tag `phase-5.2-homepage-editorial-integration` disahkan pada
commit yang sama. Ini mengesahkan push checkpoint 5.2 kini selesai; semakan
preparation tidak melakukan push semula. Fresh published reads masih 0
announcement, 0 program dan 0 newsPost; baseline 43 public payload/50 hashes
masih sepadan.

Schema/read layer/navigation/Sumbangan sedia ada diperiksa. Program startAt
wajib dan eligibility bertarikh tidak clean untuk ongoing Dapur; gap NCR/QR
structured data juga dikenal pasti. Tiada schema/frontend changes.
Attachment hanya mengandungi brief; original captions/posters, event report,
NCR officer phones dan QR originals belum tersedia dalam source semasa.
Tidak ada fakta tambahan atau CMS-ready report direka.

Klasifikasi 10 contoh, Program/News candidate holds, evergreen NCR placement,
QR presentation dan preparation → draft seeding → Studio review → controlled
publication dicadangkan dalam
[EDITORIAL-CONTENT-PREPARATION.md](EDITORIAL-CONTENT-PREPARATION.md).
Polisi curated website/human-reviewed Facebook workflow direkodkan sebagai D24.
Hanya dokumentasi tempatan diubah, belum dikomit. Berhenti untuk approval plan
sebelum implementation/writes/uploads/draft creation/publication/commit/push.
Tiada Facebook automation atau Fasa 5.3; Lecture Generator Publish disabled.

### Fasa 5.2A — source reconciliation and architecture, 3 Oktober 2026
Following the preparation-only pass above, the user supplied seven source images
and explicitly approved low-risk implementation. Added ongoing Program support,
optional structured NCR and general donation settings, strict typed published read
mapping, accessible officers and original full branded QR presentation. Current
published settings still omit both optional fields and all three editorial types
remain zero; no production source was seeded. Existing public routes and protected
homepage sections pass rendered-content regression checks. Historical publication
tests now recover fixed tagged schema evidence and explicitly reject using old
approval with current schemas; manifests/production mutation guards are unchanged.
Source register and exact three-document/three-asset draft proposal prepared.
The Qiam source only invites attendance; completed Qiam/Bubur Asyura candidate held.
Genius Aulad report recommended first, with unknown event/source dates omitted and
website timestamp still requiring owner approval. General and Dapur QR are separate;
bare QR excluded. No uploads/writes/drafts/publication/Git checkpoint/Facebook API
or Fasa 5.3. See the current preparation report for validation and review status.

### Fasa 5.2A — controlled publication, final refinement and closeout, 3 Oktober 2026

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

After exact three-asset/two-draft seeding, owner approved Studio review and published only siteSettings and program-dapur-zohor-barakah. Initial published revisions were `SSdKRdF7e0XIFT3zzFziKH`. Owner then approved the final donation copy; new `drafts.siteSettings` revision `chGo6kzbOkh09ebDsClON0` changed only heading/copy, passed exact review and schema/reference validation, and published as `SSdKRdF7e0XIFT3zzGU8xL`. Program unchanged.

Final public donation copy:

- Presentation eyebrow: **Salurkan sumbangan anda**.
- CMS `donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- CMS `donationInfo.copy`, paragraph 1: **Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.**
- CMS copy, paragraph 2: **Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.**

Copy uses the existing text field with a blank-line paragraph separator. No decorative CMS field added.
The reminder is a separate 14px paragraph; description stays 16px. Existing heading sizes,
navy/gold layout, QR artwork/reference/alt/caption and both actions remain intact.

Lint/build, 124 tests, schema extraction/current validation, current-state parity, six route smoke/regressions and desktop/mobile QA passed. Preview restarted to remove stale old-server ISR output; final review uses the current production build at port 3005. [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md) records the evidence.

## Fasa 5.2B — first News publication and checkpoint, 3 Oktober 2026

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

Owner approved the supplied original photo #4, image/card integration and optional event date, then the exact section copy and single publication. The fresh approved draft revision was checked, only publishedAt was set to the real execution timestamp, validation passed, and exactly one News was published as revision zJzdY1EB95ZHrNvpJpZmOO. Authenticated snapshots prove no changes to other published documents/assets. Lint/build, 138 tests, schema extraction/current verification, six public-route smokes and real desktop/mobile QA passed.

## Fasa 5.3A — UX recovery implementation review, 3 Oktober 2026

Fasa 5.3A calendar-first UX/model/renderer diimplement untuk **owner review**, belum checkpointed.
Baseline main/tag: `f4b473b1df54af695599a735a1fb2d1c5d9fd372` / `phase-5.2b-first-news`.
Klik petak poster sebenar memilih tarikh; Enter/Space, fokus dan selected state tersedia.
Poster khas full kini full-bleed dengan cover default, contain alternatif dan posisi atas/tengah/bawah; badge tarikh overlay, sesi asal kekal tersimpan.
Fixture 24/25 berkongsi satu artwork demo. Save Draft/Publish disabled; tiada production
Sanity writes, lecture migration, public /kuliah atau homepage lecture feed. Tiada commit/push.
Production kekal 45 published documents, 0 drafts, 1 Program, 0 Announcement, 1 News,
55 image assets dan 0 lecture documents. Fasa 5.3B belum bermula.

The owner requested the current reference workflow rather than the separate
mini-calendar of 4.2A. Fresh remote-main audit recovered direct date-cell editing,
non-destructive full banners, manual rule preservation and explicit restoration.
Implementation uses native overlay buttons, the existing React/SVG poster and a
local original-artwork catalog. Production snapshots remain unchanged. D18 licensing
question stays open; [audit and evidence](LECTURE-GENERATOR-UX-RECOVERY.md).

## Fasa 5.3A — adaptive infaq local review, 4 Oktober 2026

Panel infaq adaptif kini tersedia untuk local review: kumpulan petak tanpa tarikh minimum 2, kumpulan terbesar dipilih dan seri mengutamakan awal bulan. Kandungan kumpulan 4–6 dipusatkan dengan lebar maksimum 3 petak. Toggle Papar ruang infaq ON secara lalai; QR umum asal setempat tidak diubah atau diupload. Cadangan persistence hanya lectureMonth.showInfaq; sumber QR mosque-wide, bukan lectureDay. Tiada Sanity writes/persistence/checkpoint; 5.3B belum bermula.

20 lecture tests plus 138 existing regressions pass. Lint/build/diff-check and local schema extraction pass. October leading 3, April trailing 3, July 2/2 leading tie, September single leading ignored/trailing 4, June no leading/trailing 5, March six-row leading 6, February no group and synthetic single-only groups verified. 1,944 year/month/layout combinations preserve all valid dates. Actual PNG/PDF exports for October/April/March were read back and Poppler-rendered; QR scale-only and white-margin comparisons pass. Responsive 375/430/768/1440 retains 31 date controls and no horizontal overflow. No Sanity production mutations, staging, commit or push.

## Fasa 5.3A final closeout — 4 October 2026 (+08:00)

Owner approval locks the calendar/poster as primary date navigation, keyboard direct
editing, maximum two sessions per date, recurring rules with preserved manual
overrides, explicit one-date restore and reusable speaker architecture. Full-cell
posters retain cover default, contain alternative and vertical position controls;
underlying sessions remain stored and reappear after removal. One artwork can be
reused across dates. No further UX features are added during closeout.

Adaptive infaq uses actual leading/trailing no-date groups in the existing layout,
minimum two contiguous cells, largest eligible group, leading on ties; a single
cell never qualifies. Valid dates are never displaced. Content is centered/capped
at approximately three-column width inside larger white merged groups. General
mosque QR is reused, unchanged; Dapur QR is unrelated. Preview/PNG/PDF share the
renderer contract. Optional lectureMonth.showInfaq is poster configuration only;
full posters remain embedded lectureDay.specialPoster, not separate date documents.

Monthly snapshots remain lectureMonth-YYYY-MM. Authenticated loading/persistence,
real Save Draft/Publish, production lecture migration, public /kuliah and homepage
lecture feed are not implemented. Save Draft and Publish remain disabled; lecture
types remain read-only/hidden. Fasa 5.3B has not started. No Sanity production
mutation, upload or schema deployment was performed during this closeout.

GPL/SPDX notices, exact legacy source 378b1bbb4084b4f7b6c55ac70a5c4f769d221d28,
upstream attribution and the independently implemented workflow provenance remain
recorded. D18's GPL/combined-application distribution decision is unresolved;
this owner UX approval makes no licensing/legal conclusion. Historical migration
and publication evidence remains immutable.

Final checks: lint (0 warnings), production build with published read-only Sanity,
git diff --check, local schema extraction and 158 relevant tests pass (20 lecture,
138 public/homepage/information/migration/publication regressions; fake-client
writes in tests only). Coverage includes recurrence, keyboard cell semantics,
special posters, shared artwork 24/25, restore/manual preservation, infaq selection
over 1,944 calendar/layout combinations, outage and malformed/auth failures.
Approved PNG/PDF proofs were revalidated: full-bleed cover/contain and infaq
October/April/six-row March, 3508×2480 PNG and single landscape A4 PDF. Shared
artwork, export pixels, QR source hash, scale-only rendering and white margins pass.
Existing 375/430/768/1440 QA and owner visual approval stand; exact preview tool
matches canonical sources. All six public routes return 200, Studio route 200,
public /kuliah remains 404. Production published current-state parity passes:
Program 1, Announcement 0, News 1, 55 image assets; NCR/donation unchanged.
The public inventory fingerprint remains
7fc9e5a0b248b2350576b9c291cd7ccf49d895d6ebfff5e48ce819328c7692ce.

The isolated exact-component preview remains local QA only. The existing embedded
Studio CORS registration gate was not bypassed or changed. The owner accepted the
visual review; no additional Studio-shell capability is claimed by this checkpoint.
Checkpoint: phase-5.3a-lecture-generator-ux. Stop after checkpoint; no 5.3B work.

## 4 October 2026 — Fasa 5.3B implementation review (uncommitted)

Started from 27e23a2528c72144a1fe7e0d5ecbd45dc3343912 / phase-5.3a-lecture-generator-ux.
Authenticated loading and manual draft persistence are implemented with revision
guards, exact read-back, snapshots, original-asset reuse and dirty-state protection.
The first production write remains blocked pending exact dry-run approval.
Recommended October 2026 source retains the independently QA'd 34 real sessions;
proposed batch is one draft and 29 original portrait assets, without speaker/rule
seeding or any publication. No production write, commit, push or new checkpoint.

Automated validation and production HTTP smoke pass. Fresh browser visual/export
QA was blocked by browser security policy and is explicitly pending.
[Full current record and first-save plan](LECTURE-DRAFT-PERSISTENCE.md).

## 4 October 2026 — Fasa 5.3B owner UI/compact-QR refinement (uncommitted)

Weekday painted-bound centering retains approved font/pill/grid geometry.
Operational Studio UI/schema labels are English-first; Malay mosque terms and
poster output remain unchanged. Proposed optional published donationInfo.compactQr
separates the QR-only Jadual source from public branded primaryQr. No monthly QR.

Fresh authenticated desktop/mobile QA and browser PNG/PDF exports for 2/3/larger
groups passed after the earlier browser block. 187 tests, lint, build, enforced
schema extraction, current-state verification and route smoke pass. One initial
Sanity build query timed out; retry passed without changing code/fallback policy.
Production unchanged: 0 drafts/0 lecture records/55 images/1 Program/0 Announcement/1 News.

Separate QR upload/settings draft plan requires owner approval, then separate
review/publication approval. October payload remains 34 source-backed sessions/
29 portraits/showInfaq only. No production upload/write, publication, commit/push
or subsequent phase. [Current report](LECTURE-UI-COMPACT-QR-REFINEMENT.md).

## Fasa 5.3B — first October draft saved; owner review pending

4 October 2026 (+08:00): the owner explicitly approved the corrected October
candidate after the original fingerprint guard failed. Controlled execution added
only the reusable `donationInfo.compactQr` to published `siteSettings`, then saved
`drafts.lectureMonth-2026-10`: 30 date entries, 34 sessions and 29 original portraits.
Published settings revision: `chGo6kzbOkh09ebDsGFF22`.
October draft revision: `SSdKRdF7e0XIFT3zzNP2ab`.

Authenticated inventory: 1 draft, 0 published lecture documents, 0 speakers/rules,
85 image assets, 1 Program, 0 Announcement and 1 News. Primary branded QR, public
donation output, NCR and unrelated documents remain unchanged. October stores
only `showInfaq`; the compact QR resolves from published mosque-wide settings.
Studio refresh/reopen loads the identical real draft; desktop/mobile and actual
PNG/PDF exports pass. The operational UI stays English-first; poster stays Malay.

Original failed plan/audit are preserved unchanged. Six owner-approved Unicode
corrections restored fingerprint
`906611b8069b1c07b105da950be4f6b7cedd6d1a79a5357e912faee6e3264bb8`;
no production mutation occurred before that correction. The approved replacement
is [LECTURE-FIRST-SAVE-APPROVED.json](LECTURE-FIRST-SAVE-APPROVED.json).
The candidate's original review-required annotation is preserved as history;
the owner's later explicit approval is recorded in the execution record.

Execution used the authenticated Sanity connector with the exact approved payload.
The generic Studio save approval remains unset; this does not enable unreviewed
future writes. Publish Jadual remains disabled. No lecture publication, public
Kuliah integration, later phase, commit, push or Fasa 5.3B checkpoint.
[Execution and audit evidence](LECTURE-FIRST-SAVE-EXECUTION.md).

## Fasa 5.3B operational closeout — 4 October 2026 (+08:00)

The owner authorized generic authenticated manual Studio saves. The actual button validated and read back October unchanged, without upload or mutation; revision stayed SSdKRdF7e0XIFT3zzNP2ab. Create/update paths retain optimistic revision guards, with conflicts tested in a controlled simulator. Real draft accessibility replaces stale demo wording. Publish remains disabled; October remains unpublished. Compact QR stays mosque-wide and primary public QR unchanged. The six Unicode corrections, original guard failure and immutable audit remain recorded. GPL provenance and unresolved licensing decision remain intact. Checkpoint: `phase-5.3b-lecture-draft-persistence`. No subsequent/public lecture phase started. [Closeout evidence](LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.md).

## Fasa 5.3C — publication implementation / read-only plan, 4 October 2026 (+08:00)

Eligible saved, unchanged months can open an explicit publication confirmation. Whole-month schema/reference validation and draft/published revision guards are rechecked before the supported Sanity publish action. First publication guards absence of the published target atomically; later updates guard its revision. Authenticated read-back determines success, including lost-response recovery. Conflicts/uncertain responses preserve editor state, stop retries and require reload/review. Double-submit is blocked. Exact source Unicode and alt text are covered by regression tests. The real confirmation was opened/cancelled; no production mutation or upload occurred. October remains draft-only. No public /kuliah, homepage lecture feed, commit or push. [Exact plan](LECTURE-FIRST-PUBLICATION-DRY-RUN.json); [implementation/QA](LECTURE-PUBLICATION.md).

## Fasa 5.3C controlled publication closeout — 4 October 2026 (+08:00)

Owner approval authorized only the exact October publication. Supported atomic
Sanity actions and authenticated read-back produced `lectureMonth-2026-10`,
revision `zVZDfWLj75qTdy5eh9rsNA`; its draft was removed as observed.
Current inventory is 0 drafts / 1 published lecture month / 85 images /
0 lectureSpeaker / 0 lectureRule, with 30 stored dates and 34 sessions.
All 29 portraits resolve, showInfaq remains true and content fingerprint remains
`d18eb8c75642d32065fe509e9ba5f219a7d68c5989c7fc6cf4b538cb5fa547b6`.

Publish requires explicit confirmation and fresh saved-draft schema, asset,
revision and content checks. Stale/conflicting drafts stop publication; Publish
never autosaves. Authenticated read-back determines the final Published state.
The UI did not retain the transaction ID; it is not invented or inferred.
The compact Infaq QR stays mosque-wide; primary public donation QR/settings,
all unrelated revisions and assets remain unchanged.

Original Unicode/fingerprint guard failure and corrected replacement evidence
remain immutable. GPL/provenance notices and the unresolved combined-application
licensing decision remain unchanged. Public /kuliah and homepage lecture
integration have not started. Owner-approved desktop/mobile and PNG/PDF QA pass.
Checkpoint: `phase-5.3c-controlled-lecture-publication`.
[Final validation](LECTURE-PUBLICATION-CLOSEOUT.md);
[immutable publication execution](LECTURE-FIRST-PUBLICATION-EXECUTION.md).


## 4 October 2026 (+08:00) — Fasa 5.3D completed

Read-only public Jadual Kuliah, shareable published-month navigation, official
shared poster/public PNG/PDF, accessible date/session HTML and Navbar integration
are complete. Owner-approved implementation received final mobile schedule,
full-poster viewer and public download QA. Single-month navigation hides
unavailable neighbours. All 229 relevant tests, lint, production build,
schema/current-state verification and route regressions pass.
Production remains unchanged: October revision `zVZDfWLj75qTdy5eh9rsNA`,
0 drafts / 1 published lecture month / 85 images, 30 dates / 34 sessions.
Checkpoint: `phase-5.3d-public-kuliah`.
No CMS mutation or homepage lecture integration.
[Architecture and QA](PUBLIC-LECTURES.md).

## 4 October 2026 (+08:00) — Fasa 5.3E implemented for review

Replaced homepage mock Kuliah rows with a concise published upcoming-date
presentation. Date-only selection includes today, preserves two sessions, skips
exhausted months and uses later published months. Special poster dates expose
their description instead of hidden sessions. No applicable date, no published
months and temporary outage have distinct states; malformed/auth/query failures
remain errors. Shared server reads retain published-only perspective, no token
and 300-second revalidation. No CMS mutation, commit or push.
Responsive QA at 375/430/768/1440, full-schedule CTA and public Kuliah/export
regressions pass. Owner visual review remains pending.
[Implementation and QA](HOMEPAGE-LECTURES.md).

## Fasa 5.3E completed — 5 October 2026 (+08:00)

Owner-approved public copy: **PENGAJIAN DI MASJID / Kuliah terdekat**.
Description: **Pengajian terdekat berdasarkan jadual yang diterbitkan oleh pihak masjid.**
Same-day label: **Hari ini**. This supersedes the initial 4 October wording;
date-only selection cannot imply a same-day session is still next. Selection,
two-session/special-poster behaviour, cross-month handling and `/kuliah` CTA remain
unchanged. Final desktop/mobile QA, all 243 tests, lint/build, current-state
validation and route checks pass. Authenticated comparison confirms all production
revisions unchanged: 143 documents, 0 drafts, 1 published lecture month, 85 images;
October revision `zVZDfWLj75qTdy5eh9rsNA`, 30 dates / 34 sessions and the approved
fingerprint remain unchanged. Historical evidence is preserved.
Checkpoint: `phase-5.3e-homepage-lecture`. Fasa 6 has not started.
