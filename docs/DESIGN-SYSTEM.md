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
- `IslamicPattern` dan `MihrabMark` dalam `src/components/brand-motifs.tsx` ialah hiasan SVG/CSS yang boleh diguna semula. Corak bintang berjalin diilhamkan oleh kisi geometri banner; mihrab runcing, garis emas, finial dan jalur berlian diilhamkan oleh logo serta seni bina masjid.

`Reveal` dalam `src/components/reveal.tsx` menambah kemunculan fade-up apabila kandungan masuk ke viewport. Ia tidak menyembunyikan kandungan jika `IntersectionObserver` tiada dan menghormati tetapan `prefers-reduced-motion`.

## Perincian visual

Banner rasmi menunjukkan lattice bintang geometri berulang pada midnight navy. Motif itu diterjemahkan sebagai pattern SVG kecil dengan kelegapan terkawal, bukan imej banner penuh. Bentuk mihrab mengambil lengkung bertemu puncak dan jalur berlian daripada logo; garis emas berganda dan bingkai berlapis memberi detail tanpa mengganggu isi.

Halaman `/design-system` memaparkan variasi permukaan midnight, royal dan deep navy, contoh motif, dan kad terang untuk semakan kontras. Gunakan utility `section--navy-pattern` untuk seksyen navy bermotif dan `section--blue` untuk seksyen biru sekunder. Emas dalam (`gold-600`) sesuai untuk aksen atau detail kecil; teks isi kekal navy/charcoal atau putih dengan kontras yang jelas.
