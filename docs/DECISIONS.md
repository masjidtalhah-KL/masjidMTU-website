# Rekod Keputusan Projek

Disusun pada **1 Oktober 2026 (+08:00)** daripada kod, dokumentasi dan sejarah
repository. Tarikh commit di bawah ialah **tarikh keputusan dapat dibuktikan
dalam Git**, bukan semestinya tarikh perbincangan atau kelulusan sebenar.
Model dan prototype akhir Fasa 4.2/4.2A diluluskan untuk checkpoint pada
2026-10-01 (tarikh sesi). Masa mula kerja asal tidak diketahui.

## D01 — Pembangunan berfasa dan architecture ringkas

- **Tarikh/bukti:** 2026-09-26, `c8c9252`; [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md).
- **Keputusan:** Next.js/React/TypeScript/Tailwind/ESLint; komponen reusable,
  mobile-first dan scope satu fasa pada satu masa.
- **Rasional:** Memudahkan review dan maintenance oleh pengurus projek bukan developer.
- **Kesan:** Tiada feature fasa kemudian ditambah tanpa scope/approval; status
  “Siap” sesuatu fasa tidak bermakna keseluruhan sistem sedia dilancarkan.

## D02 — Sanity untuk editorial; Supabase untuk operasi

- **Tarikh/bukti:** 2026-09-26, `c8c9252`; diperincikan 2026-09-30, `d48e36c`, [SANITY.md](SANITY.md).
- **Keputusan:** Sanity mengurus kandungan public; Supabase/PostgreSQL mengurus
  peserta, pendaftaran, pembayaran, resit dan transaksi. `/studio` dan `/admin` berasingan.
- **Rasional:** Kandungan editorial dan rekod operasi memerlukan model serta kawalan berbeza.
- **Kesan:** Program/galeri Qurban boleh editorial; transaksi Qurban bukan dokumen
  Sanity. Campaign engine bersama Qurban/Ramadan/wakaf/sumbangan dirancang kemudian.

## D03 — Identiti institusi dan nama penuh

- **Tarikh/bukti:** 2026-09-27, `f24b1ee`; [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **Keputusan:** Nama public penuh Masjid Talhah Bin Ubaidillah; navy/blue/gold/ivory,
  sans-serif sistem Segoe UI/Arial, token serta komponen Fasa 1 dikekalkan.
- **Rasional:** Rasa institusi rasmi, bacaan jelas di telefon dan pemuatan fon stabil.
- **Kesan:** Gold untuk aksen/CTA, bukan semua teks. Halaman baharu menyambung
  design system; tiada redesign atau clone visual reference.

## D04 — PNG pattern rasmi sebagai sumber tunggal

- **Tarikh/bukti:** 2026-09-27, `19f3c6c` dan hasil akhir `f24b1ee`.
- **Keputusan:** `banner-reference-01.png` dinamakan `brand-pattern-official.png`;
  fail itu sudah merupakan pattern bersih rasmi, bukan hanya reference.
- **Rasional:** Mengekalkan geometri identiti masjid secara tepat.
- **Kesan:** Implementasi pattern yang direka/diulang semula tidak digunakan.
  Hanya presentation melalui opacity, overlay, gradient, size, position/crop.
  Tiada tracing/generating geometri lain; pattern digunakan secara terkawal.

## D05 — Mihrab hiasan dan tiga tahap gold

- **Tarikh/bukti:** 2026-09-27, `f24b1ee`; [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **Keputusan:** `MihrabMark` dua garis arch minimal tanpa frame/teks, bukan emblem
  atau logo kedua. Gold menggunakan token 400/500/600 sedia ada.
- **Rasional:** Detail beridentiti tanpa bersaing dengan logo rasmi atau readability.
- **Kesan:** Jangan menambah secondary logo; depth aksen gold kekal terkawal.

## D06 — Foto rasmi dan animation sebagai progressive enhancement

- **Tarikh/bukti:** 2026-09-28, `4ab8a03`; [ARCHITECTURE.md](ARCHITECTURE.md).
- **Keputusan:** DSC03425 → hero `masjid-dome.jpg`; DSC03423 → exterior JPG asal
  dengan derivative WebP. Gunakan `next/image`; kandungan visible tanpa animation.
- **Rasional:** Kubah sebagai focal point dan foto sebenar kekal muncul pada review
  penuh, termasuk ketika observer/JavaScript tidak berjalan.
- **Kesan:** Original tidak diubah secara destructive. Reduced motion dihormati;
  animation/lazy loading tidak boleh menjadi syarat untuk kandungan kelihatan.

## D07 — Data tempatan, manifest dan aset terpilih

- **Tarikh/bukti:** 2026-09-29, `12d8bc8`; [PUBLIC-CONTENT.md](PUBLIC-CONTENT.md).
- **Keputusan:** Markdown sumber → modul profile/organisation/surau/gallery/contact
  dan manifest ber-ID. Copy hanya 12 interior, 23 staff, 15 logo surau yang digunakan.
- **Rasional:** Provenance jelas, asset ringan dan mudah dimigrasi kemudian.
- **Kesan:** Runtime tidak membaca OneDrive. WebP mengekalkan nisbah/warna tanpa
  upscale/crop/AI; logo asal dikekalkan, logo masjid tidak diduplikasi.

## D08 — Organisasi berasaskan slot jawatan

- **Tarikh/bukti:** model 2026-09-29, `12d8bc8`; paparan akhir 2026-09-30, `d7d93ff`.
- **Keputusan:** 25 slot, 23 foto; individu dengan dua jawatan dipaparkan pada
  kedua-dua konteks. Soffan kekal tanpa foto; Timbalan Pengerusi kekal dengan **Kosong**.
- **Rasional:** Mengekalkan struktur organisasi sebenar walaupun nama berulang,
  foto tidak tersedia atau jawatan belum diisi.
- **Kesan:** Jangan deduplicate berdasarkan nama, reka perjawatan atau wajah.
  Urutan Imam/Bilal mengikuti review akhir; model CMS juga satu dokumen per slot.

## D09 — Shared navigation dan public shell

- **Tarikh/bukti:** 2026-09-29, `71a2d95`, refinement `9a9c0a3`; [PUBLIC-NAVIGATION.md](PUBLIC-NAVIGATION.md).
- **Keputusan:** Desktop horizontal; Profil text link dengan dropdown hover/focus
  dan Escape; mobile tap disclosure. Header public compact. Sumbangan → `/#donations`.
- **Rasional:** Navigation mudah ditemui, accessible dan konsisten merentas halaman.
- **Kesan:** Bukan hover-only pada mobile; bukan boxed Profil atau mega-menu.
  Transisi main ringan/reduced motion, Navbar/Footer stabil.

## D10 — Profil berdasarkan source dan lima foto

- **Tarikh/bukti:** 2026-09-29, `9a9c0a3`; [PUBLIC-PROFILE.md](PUBLIC-PROFILE.md).
- **Keputusan:** Pengenalan/visi/misi/moto/rasional daripada data asal; hanya foto
  #8, #11, #15, #17 dan #19. Mihrab portrait tidak dipaksa landscape.
- **Rasional:** Profil institusi yang tepat, readable dan seimbang.
- **Kesan:** Tiada fakta sejarah/arkitek/bahan/gaya seni bina direka. #2/#5 untuk Galeri.

## D11 — Surau tanpa maklumat tambahan yang direka

- **Tarikh/bukti:** 2026-09-30, `61d09f3`; [PUBLIC-SURAU.md](PUBLIC-SURAU.md).
- **Keputusan:** 3 Surau Jumaat + 12 Surau Biasa; kad logo/nama mengikut source.
- **Rasional:** Memaparkan identiti sebenar tanpa andaian contact atau lokasi tepat.
- **Kesan:** Alamat tersedia dalam data, bukan kad semasa. Tiada map/telefon/
  koordinat tambahan. MIMOS kekal pada saiz sumber atau lebih kecil.

## D12 — Galeri melalui adapter media dan koleksi berurutan

- **Tarikh/bukti:** UI 2026-09-30, `5936bfd`; model CMS diluluskan 2026-10-01,
  checkpoint `phase-4.2-sanity-content-model`.
- **Keputusan:** Adapter `MediaGalleryItem` memisahkan sumber data daripada UI;
  nisbah foto asal, lightbox keyboard/focus. Model CMS `galleryCollection.items`
  menggunakan object embedded berurutan, bukan dokumen berasingan setiap foto.
- **Rasional:** Boleh menambah kategori/menukar ke CMS tanpa mengulang layout atau
  memecahkan pengurusan satu koleksi menjadi terlalu banyak dokumen.
- **Kesan:** Initial gallery 12 interior; #18 carta kewangan/contact sheet
  dikecualikan public tetapi original tidak dipadam. Caption/alt hanya berdasarkan source.
  Bahagian model CMS diluluskan dalam checkpoint Fasa 4.2.

## D13 — Contact structured dan social icon-only

- **Tarikh/bukti:** 2026-09-30, `c9d0d20`; [PUBLIC-CONTACT.md](PUBLIC-CONTACT.md).
- **Keputusan:** Facebook/Instagram icon-only dengan label accessible; URL dalam
  `contact.ts`. Sabtu/Ahad/cuti umum tutup. Tel/mailto ialah pautan yang berfungsi.
- **Rasional:** Keputusan visual pengguna, data mudah dipindah ke CMS dan akses jelas.
- **Kesan:** Hitam → warna pada hover/focus; reduced motion tanpa animasi.
  Lokasi hanya carian alamat Google Maps, bukan embedded map/pin yang disahkan.

## D14 — Studio embedded, auth rasmi dan singleton

- **Tarikh/bukti:** 2026-09-30, `d48e36c`; [SANITY.md](SANITY.md).
- **Keputusan:** Official NextStudio `/studio`, Sanity authentication, env berpusat,
  fixed API `2026-09-01`, project `2o95jmms` / dataset `production`.
  Site Settings singleton; Profil singleton ditambah dalam checkpoint Fasa 4.2.
- **Rasional:** Editing standard tanpa custom login serta configuration yang tidak berulang.
- **Kesan:** Tiada write token browser/public mutation endpoint. Filter singleton
  menghalang pendua melalui Studio biasa, bukan constraint keselamatan API.
  Sanity tidak memerlukan downgrade Next/React/Tailwind; advisories didokumentasi,
  bukan diselesaikan melalui `npm audit fix --force`.

## D15 — Model dahulu, migration kemudian

- **Tarikh/bukti:** boundary 2026-09-30, `d48e36c`; model diperiksa 2026-10-01 dan dikomit dalam checkpoint `f2aa594`.
- **Keputusan:** Fasa 4.2 menyediakan schema editorial tanpa seeds, initial content,
  uploads atau fetch CMS pada halaman public.
- **Rasional:** Review model dahulu sambil menjaga public website yang telah diluluskan.
- **Kesan:** Static/local masih source runtime; draft preview/Presentation Tool/
  webhook dan frontend dynamic ditangguhkan. 11 document + 6 support types semasa
  diperincikan dalam [PROJECT-STATE.md](PROJECT-STATE.md).

## D16 — Penjana kuliah native sebagai prototype

- **Tarikh/bukti:** diluluskan 2026-10-01, checkpoint `phase-4.2-sanity-content-model`;
  [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md).
- **Keputusan:** Native tool React/CSS/SVG dalam Studio, bukan iframe. Model
  `lectureSpeaker` + `lectureRule` + `lectureMonth` menggantikan lecture ringkas;
  hari/sesi embedded, maksimum dua sesi. Aturan menjaga manual/cleared overrides.
- **Rasional:** Custom workflow bulanan yang sepadan dengan kerja editor masjid,
  dengan monthly snapshot untuk website/poster apabila penerbitan dibina nanti.
- **Kesan:** Demo fiksyen dalam memori, Publish disabled, tiada production writes.
  PNG/PDF asas bukan jaminan poster print-ready. Save/publish, upload, concurrency,
  snapshot sebenar, migration, public `/kuliah` dan export parity memerlukan scope/review lanjut.
- **Status:** Model dan prototype akhir diluluskan untuk checkpoint 4.2 pada
  2026-10-01; penerbitan produksi belum tersedia.

## D17 — Rekod kekal dan kewangan berasaskan bukti

- **Tarikh/bukti:** 2026-10-01, arahan pengguna; disertakan dalam checkpoint 4.2.
- **Keputusan:** State, keputusan, perjalanan dan ledger kos disimpan dalam repo
  supaya sesi baharu tidak bergantung pada sejarah chat.
- **Rasional:** Continuity kerja dan laporan AJK yang boleh disemak.
- **Kesan:** Tarikh inferens dilabel; tiada harga/jam direka. Git timestamps bukan
  timesheet atau bukti pembayaran. Dokumen ini tidak membenarkan commit/push sendiri.

## D18 — Renderer legacy dan lesen sebelum production

- **Tarikh/bukti:** 2026-10-01, renderer yang diluluskan dan
  [third-party/JADUAL-KULIAH-NOTICE.md](third-party/JADUAL-KULIAH-NOTICE.md).
- **Keputusan:** Kekalkan komposisi poster legacy yang dipin pada commit
  `378b1bbb4084b4f7b6c55ac70a5c4f769d221d28`, diadaptasi sebagai React/SVG
  berstruktur tanpa iframe/HTML bundle penuh. Refinement akhir clip 0.6 unit
  dan stroke/fon yang diluluskan dikekalkan dalam checkpoint.
- **Rasional:** Fidelity kepada reka bentuk masjid sedia ada dan renderer yang
  boleh digunakan dengan model data baharu.
- **Kesan:** Notice, upstream copyright dan GPL-3.0 disertakan. **Keputusan
  pre-production terbuka:** sahkan kewajipan GPL bagi derivative/combined
  application, Corresponding Source dan hak aset sebelum pengedaran produksi.
  Approval checkpoint tidak mengesahkan lesen gabungan telah diselesaikan.

## D19 — Oktober sebenar sebagai QA read-only

- **Tarikh/bukti:** 2026-10-01, arahan pengguna dan
  [SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md).
- **Keputusan:** Hanya bulan `2026-10` daripada snapshot version 2 digunakan
  secara sementara; symbolic portraits diresolve daripada bundle upstream.
- **Rasional:** Mengesahkan fitting dan fidelity dengan nama/topik sebenar.
- **Kesan:** 34 sesi lulus import, tiada unresolved portrait, clipping/overflow
  Oktober diselesaikan. Publish kekal disabled. Tiada JSON sebenar, portrait QA
  tambahan atau jadual dimigrasikan ke Sanity; tiada inferens bulan berikutnya.
  Synthetic long-copy, print proof dan cross-platform fonts kekal had prototype.

## D20 — Preparation migration deterministik, draft-first dan create-only

- **Tarikh/bukti:** 2026-10-01, arahan Fasa 4.3A; commit `ea8dd09`,
  checkpoint `phase-4.3a-migration-dry-run`.
  [SANITY-MIGRATION.md](SANITY-MIGRATION.md), `scripts/sanity-migration/`.
- **Keputusan:** 43 dokumen daripada source public diluluskan, ID tetap berasaskan
  slot/source, 50 fail imej tanpa recompression. Default dry-run; production
  upload/write/publish dilarang dalam 4.3A. Ketetapan ID deterministik mengikuti
  arahan eksplisit pengguna, walaupun panduan import umum Sanity mengutamakan ID generated.
- **Rasional:** Audit boleh diulang, vacancy/multiple positions dipelihara,
  dan source/editor content tidak ditindih secara senyap.
- **Kesan:** Mod write kelak hanya create drafts dengan target tepat,
  fingerprint dan token server; preflight raw/non-CDN sebelum upload dan sebelum
  atomic create. Payload identical di-skip; unexpected content menghentikan
  writes. Tiada replace/delete/purge/publish. Aset reuse melalui hash dan _id
  sebenar hasil query/upload. Upload terdahulu boleh tinggal jika write gagal;
  tool tidak memadamnya.
- **Boundary:** Short name tiada source; logo kekal website. Mock homepage dan
  semua lecture/demo/QA/legacy dikecualikan. Frontend CMS integration dan
  penerbitan kuliah memerlukan scope berasingan. Kelulusan draft migration
  Fasa 4.3B direkodkan dalam D21.

## D21 — Penutupan migration production sebagai draft sahaja

- **Tarikh/bukti:** 2026-10-02, arahan pengguna dan authenticated raw read-back
  project `2o95jmms` / dataset `production`; [SANITY-MIGRATION.md](SANITY-MIGRATION.md).
- **Keputusan:** 43 draft, 50 aset imej unik, 0 konflik; semua sasaran
  `skip-identical`. Tiada migrated content published. Review ini tidak
  menjalankan write/upload semula; draft tidak diedit semasa QA Studio.
- **Rasional:** Sahkan payload, imej, susunan dan references sebelum sebarang
  penerbitan atau frontend integration yang memerlukan kelulusan berasingan.
- **Kesan:** Laporan write menggunakan `WRITE-DRAFTS` dan tahap preflight,
  bukan label `DRY-RUN`. Guard target/fingerprint/token, conflict detection
  dan create-only transaction tidak diubah. Public frontend kekal local/static;
  Lecture Generator Publish disabled. Fasa 4.3C dan Fasa 5 belum bermula.

## D22 — Controlled Publication terhad kepada set migration yang diluluskan

- **Tarikh/bukti:** 2026-10-02, arahan eksplisit Fasa 4.3C dan authenticated
  preflight; [SANITY-PUBLICATION.md](SANITY-PUBLICATION.md).
- **Keputusan:** Publish hanya 43 deterministic draft 4.3B ke
  `2o95jmms/production`. Manifest mengikat ID/type/revisi/aset dan pelan yang
  diluluskan; confirmations wajib. Supported Actions API, atomic absence/revision
  guards, API dry-run terlebih dahulu, tiada silent overwrite/automatic retry.
- **Kesan:** Tool migration create-only asal kekal. Public frontend local/static,
  mock/lecture/QA/legacy dikecualikan; Lecture Generator Publish disabled.
- **Status:** Selesai. Linux melakukan publication; Work melakukan read-back/QA
  dan repository closeout. 43 published, 0 draft, 50 aset, 55 references,
  0 konflik. Checkpoint `phase-4.3c-controlled-publication`; Fasa 5 belum bermula.
- **Insiden/fix:** Percubaan awal HTTP 400 kerana `mtu-4.3c-*` mengandungi dot;
  tiada mutation menurut verifikasi Linux pengguna. Prefix `mtu-4-3c-` dan
  local ID regex guard digunakan; atomic retry operator berjaya. Safety gates,
  manifest dan kedua-dua fingerprint diluluskan tidak berubah.
- **Preview:** `sanity.config.ts` memilih `items.length` berasingan daripada
  thumbnail. Fix Studio-only mengelakkan array path object yang menghasilkan
  false “0 foto”; fields/validations/schema source/public rendering kekal.

## Cara menambah rekod

Tambah ID seterusnya bersama tarikh, status, bukti, rasional dan kesan. Jika
keputusan berubah, nyatakan keputusan yang diganti; jangan padam provenance lama.
Pisahkan cadangan/prototype daripada keputusan yang telah diluluskan.
