# Website Rasmi Masjid Talhah Bin Ubaidillah, Bukit Jalil

Project ini ialah asas website rasmi masjid yang dibangunkan secara berfasa. Fasa 0 menyediakan aplikasi Next.js dan dokumentasi; kandungan sebenar, CMS, dashboard operasi serta transaksi akan ditambah dalam fasa masing-masing.

## Keadaan semasa — Fasa 5.3A completed

Fasa 5.3A **completed dan owner-approved pada 4 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.3a-lecture-generator-ux`; resolve tag untuk commit akhir.
Baseline main/tag: `f4b473b1df54af695599a735a1fb2d1c5d9fd372` / `phase-5.2b-first-news`.
Klik petak poster sebenar memilih tarikh; Enter/Space, fokus dan selected state tersedia.
Poster khas full kini full-bleed dengan cover default, contain alternatif dan posisi atas/tengah/bawah; badge tarikh overlay, sesi asal kekal tersimpan.
Panel infaq adaptif owner-approved: kumpulan petak tanpa tarikh minimum 2, kumpulan terbesar dipilih dan seri mengutamakan awal bulan. Kandungan kumpulan 4–6 dipusatkan dengan lebar maksimum 3 petak. Toggle Papar ruang infaq ON secara lalai; QR umum asal setempat tidak diubah atau diupload. Cadangan persistence hanya lectureMonth.showInfaq; sumber QR mosque-wide, bukan lectureDay. Tiada Sanity writes/persistence; checkpoint Git sahaja. 5.3B belum bermula.

Fixture 24/25 berkongsi satu artwork demo. Save Draft/Publish disabled; tiada production
Sanity writes, lecture migration, public /kuliah atau homepage lecture feed. Git checkpoint sahaja; tiada production lecture writes.
Production kekal 45 published documents, 0 drafts, 1 Program, 0 Announcement, 1 News,
55 image assets dan 0 lecture documents. Fasa 5.3B belum bermula.

Rujuk [UX recovery / feature matrix / persistence plan](docs/LECTURE-GENERATOR-UX-RECOVERY.md).

## Rekod checkpoint terdahulu — Fasa 5.2B

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](docs/EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

## Teknologi utama

- Next.js dan React
- TypeScript
- Tailwind CSS
- ESLint

### Sejarah checkpoint hingga Fasa 5.2A

Sanity Studio tersedia pada `/studio`; Foundation 4.1 serta content model dan
prototype Penjana Jadual Kuliah 4.2/4.2A telah dikomit dan checkpointed.
Fasa 4.3A preparation/dry-run siap pada checkpoint `phase-4.3a-migration-dry-run`.
Fasa 4.3B memigrasikan 43 draft dan 50 aset imej unik ke Sanity production,
tanpa konflik atau penerbitan kandungan.
Fasa 4.3C Controlled Publication selesai: 43 published, 0 draft, 50 aset dan
0 konflik. Checkpoint `phase-4.3c-controlled-publication`;
rujuk [rekod publication](docs/SANITY-PUBLICATION.md).
Fasa 5.1 siap dan diluluskan untuk checkpoint `phase-5.1-sanity-public-content`:
lima route Profil,
Organisasi, Surau, Galeri dan Hubungi membaca published Sanity dengan revalidation
lima minit dan explicit local fallback bagi temporary outage. Local editorial
content lima route kekal hanya sebagai explicit fallback.
Fasa 5.2 homepage Pengumuman, Program dan Berita & Aktiviti siap dan diluluskan,
menggunakan published Sanity. Pada checkpoint 5.2 ketiga-tiga jenis mempunyai
0 published documents; empty states diluluskan tanpa mock cards. Keadaan pada checkpoint 5.2A: Program 1, Announcement 0, News 0.
Fallback outage ialah UI kosong dengan mesej unavailable, bukan editorial mock.
Empty-state ini disengajakan dan diluluskan melalui manual visual review pengguna.
Mock sedia ada tidak diseed atau diterbitkan. Checkpoint:
`phase-5.2-homepage-editorial-integration`.
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
Rujuk [closeout/publication](docs/EDITORIAL-PUBLICATION-CLOSEOUT.md) dan
[editorial preparation history](docs/EDITORIAL-CONTENT-PREPARATION.md).
Rujuk [public read layer](docs/SANITY-PUBLIC-CONTENT.md) dan
[homepage editorial](docs/SANITY-HOMEPAGE-CONTENT.md).
Supabase/PostgreSQL, email dan
payment belum disambungkan; Publish penjana kuliah kekal disabled.

## Keperluan

Pasang Node.js versi 22.12 atau lebih baharu dan npm (Node 24 LTS disyorkan).
Versi ini diperlukan oleh Sanity 6. Untuk projek ini, gunakan arahan npm di bawah.

## Mula menggunakan projek

Di dalam folder `masjid-website`, jalankan:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk hentikan server, tekan `Ctrl+C` di terminal.

## Semakan projek

```bash
npm run lint
npm run build
```

Untuk menjalankan build production secara tempatan:

```bash
npm run start
```

## Tetapan persekitaran

Salin `.env.example` sebagai `.env.local` sebelum menjalankan aplikasi atau build.
Tiga tetapan `NEXT_PUBLIC_SANITY_*` diperlukan untuk Studio; nilai contoh ialah
identifier public projek yang diluluskan, bukan credentials. Service lain masih
placeholder. Jangan commit `.env.local`. Rujuk [docs/SANITY.md](docs/SANITY.md)
untuk login, CORS dan konfigurasi `/studio`.

## Struktur asas

```text
src/app/          Halaman dan layout Next.js
src/components/   Komponen yang boleh digunakan semula
src/lib/          Fungsi bantuan dan sambungan service
src/config/       Tetapan aplikasi
src/types/        Jenis TypeScript bersama
src/sanity/       Konfigurasi, client dan schema Sanity
public/           Fail statik seperti imej dan ikon
docs/             Architecture dan roadmap projek
```

Lihat [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) untuk gambaran sistem dan [docs/ROADMAP.md](docs/ROADMAP.md) untuk susunan fasa.

## Migration preparation — Fasa 4.3A

`npm run sanity:migrate -- --dry-run` menyemak sumber diluluskan, 43 dokumen
editorial dan 50 fail imej production tanpa upload/write. Tanpa flag juga
default dry-run. `npm run sanity:migrate:test` menguji mapping, idempotency dan
pengendalian konflik melalui client dalam memori sahaja.

Rujuk [docs/SANITY-MIGRATION.md](docs/SANITY-MIGRATION.md) untuk pemetaan ID,
audit dataset read-only dan draft-first strategy. Mod write memerlukan
command berasingan, target tepat, fingerprint pelan dan token server sahaja.
Migration draft Fasa 4.3B kemudian diterbitkan dalam Fasa 4.3C:
semua 43 published payload `skip-identical`, 0 draft, 50 aset tersedia,
55 references kepada 50 aset unik, tanpa konflik/reference rosak.
Laporan write menggunakan label `WRITE-DRAFTS` pada tahap preflight; ia bukan
bukti operasi selesai. Frontend pada checkpoint 4.3C kekal local/static dan Publish penjana kuliah
kekal disabled. `npm run sanity:publish` ialah authenticated read-only verification;
`npm run sanity:publish:test` menguji publication dalam memori.

## Public content — Fasa 5.1

`npm run public-content:test` menguji published query boundaries, adapters,
content parity dan kegagalan/fallback tanpa network atau writes.
`npm run public-content:verify` melakukan read-only production parity check,
tanpa token, upload atau mutation. Selepas editorial CMS berubah, review
perbezaan kepada local checkpoint secara eksplisit. Lint/build/diff check tetap
diperlukan; rujuk [architecture dan QA](docs/SANITY-PUBLIC-CONTENT.md).

Untuk current approved Fasa 5.2A state, gunakan `npm run public-content:verify:current`
dan `npm run homepage-content:verify`. Current verifier validates the new settings
groups separately while preserving all 43 historical base payloads and 50 source hashes.
Exact historical parity/approval evidence kekal immutable; full settings kini berbeza
secara intentional kerana NCR/donation additions yang diluluskan. Jangan ubah manifest
asal untuk membuat current publication kelihatan identical kepada checkpoint 4.3.

## Final donation presentation — Fasa 5.2A

Final public donation copy:

- Presentation eyebrow: **Salurkan sumbangan anda**.
- CMS `donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- CMS `donationInfo.copy`, paragraph 1: **Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.**
- CMS copy, paragraph 2: **Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.**

Copy uses the existing text field with a blank-line paragraph separator. No decorative CMS field added.
The reminder is a separate 14px paragraph; description stays 16px. Existing heading sizes,
navy/gold layout, QR artwork/reference/alt/caption and both actions remain intact.
