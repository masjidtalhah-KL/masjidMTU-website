# Website Rasmi Masjid Talhah Bin Ubaidillah, Bukit Jalil

Project ini ialah asas website rasmi masjid yang dibangunkan secara berfasa. Fasa 0 menyediakan aplikasi Next.js dan dokumentasi; kandungan sebenar, CMS, dashboard operasi serta transaksi akan ditambah dalam fasa masing-masing.

## Teknologi utama

- Next.js dan React
- TypeScript
- Tailwind CSS
- ESLint

Sanity, Supabase/PostgreSQL, email dan payment gateway belum disambungkan.

## Keperluan

Pasang Node.js versi 20.9 atau lebih baharu dan npm. Untuk projek ini, gunakan arahan npm di bawah.

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

`.env.example` menyenaraikan nama tetapan yang mungkin diperlukan pada fasa kemudian. Ia tidak mengandungi credentials. Salin sebagai `.env.local` hanya apabila integrasi berkaitan dimulakan, dan masukkan nilai sebenar pada komputer sendiri. Jangan commit `.env.local`.

## Struktur asas

```text
src/app/          Halaman dan layout Next.js
src/components/   Komponen yang boleh digunakan semula
src/lib/          Fungsi bantuan dan sambungan service
src/config/       Tetapan aplikasi
src/types/        Jenis TypeScript bersama
public/           Fail statik seperti imej dan ikon
docs/             Architecture dan roadmap projek
```

Lihat [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) untuk gambaran sistem dan [docs/ROADMAP.md](docs/ROADMAP.md) untuk susunan fasa.
