# Perjalanan Projek — Fasa 0 hingga 4.3B

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

Apabila fasa berikutnya dikomit, tambah commit/date/tag sebenar dan pautan bukti
review jika tersedia. Kekalkan label inferens pada peristiwa yang tiada bukti tepat.
