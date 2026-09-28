# Sistem Reka Bentuk

Panduan ini merekodkan token dan pilihan visual untuk website rasmi Masjid Talhah Bin Ubaidillah. Pratonton komponen tersedia di `/design-system`.

## Warna

| Peranan | Token | Hex |
| --- | --- | --- |
| Latar utama gelap | `navy-950` | `#071A3E` |
| Navy sekunder | `navy-900` | `#102B59` |
| Navy royal | `navy-850` | `#0B214C` |
| Navy berlapis | `navy-800` | `#17396E` |
| Biru diraja | `blue-700` | `#254E8A` |
| Biru diraja gelap | `blue-800` | `#1D3F78` |
| Biru lembut | `blue-100` | `#E8EEF7` |
| Emas aksen | `gold-400` | `#D7B75B` |
| Emas sederhana | `gold-500` | `#B79639` |
| Emas dalam | `gold-600` | `#9F7C27` |
| Latar ivory | `ivory` | `#F7F4EC` |
| Latar putih | `paper` | `#FFFFFF` |
| Teks utama | `ink` | `#202938` |
| Teks sekunder | `ink-muted` | `#657184` |

Emas dikhaskan untuk butang tindakan utama, sempadan, lencana dan aksen hiasan. Gunakan teks navy atau charcoal untuk isi utama.

## Tipografi

- **Tajuk, isi dan kawalan:** `Segoe UI` atau `Arial`, dengan fallback sans-serif sistem. Berat tajuk sederhana-tebal dan bentuk huruf terbuka memberi rasa institusi yang jelas pada skrin telefon.
- Fon sistem dipilih supaya teks pantas dimuatkan dan stabil tanpa sambungan fon luaran.

## Skala dan bentuk

- **Jarak:** token `--spacing-*` daripada 4, 8, 12, 16, 24, 32, 40, 48, 64, 80 hingga 96 px.
- **Sudut:** 8 px kecil, 14 px sederhana, 20 px besar, 28 px kad utama, dan pill untuk butang/lencana.
- **Bayang:** `soft` untuk kad biasa dan `raised` untuk lapisan yang lebih tinggi.
- **Lebar kandungan:** 48 rem sempit, 72 rem biasa, dan 82 rem lebar.
- **Breakpoint:** 30 rem, 40 rem, 48 rem, 64 rem dan 80 rem. Layout disusun mobile-first.

Semua token berada dalam `src/app/globals.css` di dalam blok Tailwind v4 `@theme`.

## Komponen

Komponen React berada dalam `src/components/design-system.tsx`:

- `Button`: primary, secondary, outline dan ghost; saiz kecil, sederhana dan besar.
- `Container`: lebar narrow, default dan wide.
- `Section` dan `SectionHeading` / `Heading`.
- `Badge`: neutral, blue, gold dan dark.
- `Card`: light, navy dan highlighted.
- `Input` dan `Textarea` dengan label serta hint yang dikaitkan secara semantik.
- `Navbar` dan `Footer` menggunakan logo rasmi.
- `MihrabMark` dalam `src/components/brand-motifs.tsx` ialah hiasan SVG mihrab yang boleh diguna semula. Pattern geometri menggunakan terus `public/brand/brand-pattern-official.png` sebagai sumber tunggal.
- Nama yang dipaparkan pada website menggunakan nama penuh **Masjid Talhah Bin Ubaidillah**.

`Reveal` dalam `src/components/reveal.tsx` menambah gerakan masuk yang halus apabila kandungan masuk ke viewport. Kandungan sentiasa kelihatan walaupun JavaScript atau `IntersectionObserver` tidak berjalan; animasi menghormati tetapan `prefers-reduced-motion`.

## Perincian visual

`public/brand/brand-pattern-official.png` ialah satu-satunya sumber pattern geometri. Gunakan fail asal sebagai tekstur background; presentation boleh dilaras melalui opacity, overlay navy, gradient, saiz, posisi dan crop responsif sahaja. Jangan trace, lukis semula atau ubah geometri pattern. Halaman `/design-system` menunjukkan aset asal, overlay navy lembut dan contoh teks sebenar di atas pattern.

Bentuk mihrab kini dipaparkan sebagai dua garis arch yang halus sahaja, tanpa bingkai atau label, untuk digunakan sebagai hiasan latar yang subtle.

Pattern rasmi digunakan pada hero dan beberapa signature section sahaja. Section navy lain boleh menggunakan latar navy polos atau gradient supaya halaman mempunyai variasi. Emas dalam (`gold-600`) sesuai untuk aksen atau detail kecil; teks isi kekal navy/charcoal atau putih dengan kontras yang jelas.

## Borang

Field nama dan emel menggunakan grid dua kolum sama lebar dengan gap 24 px (`--spacing-6`) pada skrin 768 px dan ke atas. Setiap field dan input dibenarkan mengecil supaya tidak melimpah; kawalan menggunakan lebar penuh. Di bawah 768 px, field disusun satu kolum. Helper text berada di bawah input emel dan textarea mesej menggunakan lebar penuh.
