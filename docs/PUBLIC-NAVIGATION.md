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
- `PublicNavigation` ialah komponen client untuk active state dan interaksi
  keyboard. Menu Profil mobile menggunakan native `details`/`summary`; desktop
  menggunakan pautan Profil dengan panel yang didedahkan melalui hover/focus.
- `PublicPageHeader` menerima `title`, optional `eyebrow`, `introduction` dan
  `breadcrumbs`. Header ringkas menggunakan navy dan pattern rasmi
  `/brand/brand-pattern-official.png` dengan overlay navy.
- `PublicPageLayout` menyatukan Navbar, header, ruang placeholder dan Footer.
  Homepage mengekalkan komposisinya sendiri.
- Lima route shell menggunakan metadata tajuk, breadcrumb dan placeholder sahaja.
  Tiada import daripada `src/lib/public-content/`.

## Behaviour navigation

- Desktop mulai 800px: semua navigation utama sentiasa visible dan horizontal;
  Sumbangan kekal sebagai CTA. Profil ialah pautan biasa ke `/profil`; hover atau
  focus membuka dropdown. Cursor boleh bergerak terus ke panel tanpa gap. Escape
  menutup panel dan memulangkan focus kepada pautan Profil.
- Bawah 800px: Menu membuka navigation dalam aliran halaman. Profil boleh
  expand/collapse dengan tiga sublink berindent. Tiada modal atau focus trap.
- Target menu/link sekurang-kurangnya 44px tinggi. Focus keyboard kelihatan dan
  `aria-expanded` mengikut keadaan disclosure selepas hydration.
- Link semasa menggunakan `aria-current="page"`; Profil ditandakan aktif pada
  semua route `/profil` dan turunannya. Menu ditutup selepas memilih link.
- Pada mobile, Profil expand/collapse melalui tap dan tidak bergantung kepada
  hover. Dropdown desktop menggunakan opacity fade dan translate 5px selama
  170ms; dropdown dan rotasi chevron menghormati `prefers-reduced-motion`.
- Kandungan `main` antara route awam menggunakan fade dan pergerakan 6px ke atas
  ketika masuk serta ke bawah ketika keluar. Navbar dan Footer kekal stabil;
  transisi tidak dijalankan jika `prefers-reduced-motion` aktif.
- Navbar katalog `/design-system` kekal menggunakan navigation katalog asal.

## QA

Semakan browser dibuat pada 375px, 430px, 768px dan 1440px: menu touch/keyboard,
Enter, Space, Tab, Escape, klik luar, active states, target 44px dan overflow.
Kelima-lima route render; logo kembali ke homepage dan Sumbangan dari subpage
membawa pengguna ke `/#donations`.

Lint, production build dan `git diff --check` dijalankan sebelum review.
Fasa 3.2 telah diluluskan. Chevron desktop menghala ke bawah ketika tertutup dan
ke atas ketika terbuka. Refinement Fasa 3.3 mengekalkan susun atur mobile dan CTA.
