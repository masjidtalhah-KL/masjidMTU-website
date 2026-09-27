# Sistem Reka Bentuk

Panduan ini merekodkan token dan pilihan visual untuk website rasmi Masjid Talhah Bin Ubaidillah. Pratonton komponen tersedia di `/design-system`.

## Warna

| Peranan | Token | Hex |
| --- | --- | --- |
| Latar utama gelap | `navy-950` | `#071A3E` |
| Navy sekunder | `navy-900` | `#102B59` |
| Biru diraja | `blue-700` | `#254E8A` |
| Biru lembut | `blue-100` | `#E8EEF7` |
| Emas aksen | `gold-400` | `#D7B75B` |
| Emas gelap untuk teks kecil | `gold-500` | `#B79639` |
| Latar ivory | `ivory` | `#F7F4EC` |
| Latar putih | `paper` | `#FFFFFF` |
| Teks utama | `ink` | `#202938` |
| Teks sekunder | `ink-muted` | `#657184` |

Emas dikhaskan untuk butang tindakan utama, sempadan, lencana dan aksen hiasan. Gunakan teks navy atau charcoal untuk isi utama.

## Tipografi

- **Tajuk:** `Iowan Old Style`, `Palatino Linotype` atau `Georgia`, dengan fallback serif sistem.
- **Isi dan kawalan:** `Segoe UI` atau `Arial`, dengan fallback sans-serif sistem.
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

`Reveal` dalam `src/components/reveal.tsx` menambah kemunculan fade-up apabila kandungan masuk ke viewport. Ia tidak menyembunyikan kandungan jika `IntersectionObserver` tiada dan menghormati tetapan `prefers-reduced-motion`.

## Perincian visual

Lengkung mihrab dilukis sebagai hiasan CSS dan corak geometri pada latar ialah motif baharu yang halus. Logo, foto luar masjid dan warna banner rasmi digunakan untuk memahami identiti; banner tidak disalin sebagai layout laman.
