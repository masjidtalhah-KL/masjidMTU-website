# Website Rasmi Masjid Talhah Bin Ubaidillah, Bukit Jalil

Project ini ialah asas website rasmi masjid yang dibangunkan secara berfasa. Fasa 0 menyediakan aplikasi Next.js dan dokumentasi; kandungan sebenar, CMS, dashboard operasi serta transaksi akan ditambah dalam fasa masing-masing.

## Teknologi utama

- Next.js dan React
- TypeScript
- Tailwind CSS
- ESLint

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
lima minit dan explicit local fallback bagi temporary outage. Homepage editorial
kekal mock/local. Local editorial content lima route kekal hanya sebagai explicit
fallback; Fasa 5.2 belum bermula. Rujuk [public read layer](docs/SANITY-PUBLIC-CONTENT.md).
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
