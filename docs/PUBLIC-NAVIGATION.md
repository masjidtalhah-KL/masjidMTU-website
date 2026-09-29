# Navigation & Shell Halaman Public — Fasa 3.2

Fasa ini menyediakan navigation dan shell minimum untuk review. Kandungan penuh
halaman, sambungan CMS dan data operasi belum dibina.

## Routes

| Navigation | Destination | Paparan semasa |
| --- | --- | --- |
| Logo | `/` | Homepage Fasa 2 |
| Profil → Pengenalan | `/profil` | Header + placeholder Fasa 3.3 |
| Profil → Carta Organisasi | `/profil/organisasi` | Header + placeholder Fasa 3.4 |
| Profil → Surau Kariah | `/profil/surau-kariah` | Header + placeholder Fasa 3.5 |
| Galeri | `/galeri` | Header + placeholder Fasa 3.6 |
| Hubungi | `/hubungi` | Header + placeholder Fasa 3.7 |
| Sumbangan | `/#donations` | Section sumbangan homepage, termasuk dari subpage |

## Komponen

- `Navbar` dengan `variant="public"` menggunakan `PublicNavigation`.
- `PublicNavigation` ialah komponen client untuk active state dan tambahan interaksi
  keyboard. Disclosure asas menggunakan native `details`/`summary` supaya menu
  masih boleh dibuka sebelum hydration atau tanpa JavaScript.
- `PublicPageHeader` menerima `title`, optional `eyebrow`, `introduction` dan
  `breadcrumbs`. Header ringkas menggunakan navy dan pattern rasmi
  `/brand/brand-pattern-official.png` dengan overlay navy.
- `PublicPageLayout` menyatukan Navbar, header, ruang placeholder dan Footer.
  Homepage mengekalkan komposisinya sendiri.
- Lima route shell menggunakan metadata tajuk, breadcrumb dan placeholder sahaja.
  Tiada import daripada `src/lib/public-content/`.

## Behaviour navigation

- Desktop mulai 800px: semua navigation utama sentiasa visible dan horizontal;
  Sumbangan kekal sebagai CTA. Profil dibuka melalui klik, Enter atau Space. Escape
  menutup dan memulangkan focus kepada trigger. Klik luar atau focus keluar
  menutup dropdown.
- Bawah 800px: Menu membuka navigation dalam aliran halaman. Profil boleh
  expand/collapse dengan tiga sublink berindent. Tiada modal atau focus trap.
- Target menu/link sekurang-kurangnya 44px tinggi. Focus keyboard kelihatan dan
  `aria-expanded` mengikut keadaan disclosure selepas hydration.
- Link semasa menggunakan `aria-current="page"`; Profil ditandakan aktif pada
  semua route `/profil` dan turunannya. Menu ditutup selepas memilih link.
- Tiada hover-only interaction. Dropdown desktop menggunakan opacity fade dan
  translate 5px selama 170ms ketika dibuka. Animation dropdown dan rotasi chevron
  dihentikan untuk `prefers-reduced-motion`.
- Navbar katalog `/design-system` kekal menggunakan navigation katalog asal.

## QA

Semakan browser dibuat pada 375px, 430px, 768px dan 1440px: menu touch/keyboard,
Enter, Space, Tab, Escape, klik luar, active states, target 44px dan overflow.
Kelima-lima route render; logo kembali ke homepage dan Sumbangan dari subpage
membawa pengguna ke `/#donations`.

Lint, production build dan `git diff --check` dijalankan sebelum review.
Fasa 3.2 telah diluluskan. Chevron desktop disahkan menghala ke bawah ketika
tertutup dan ke atas ketika terbuka selepas animasi selesai. Fasa 3.3 belum bermula.
