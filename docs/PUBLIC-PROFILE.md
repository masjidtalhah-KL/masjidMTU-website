# Halaman Profil — Fasa 3.3

Route `/profil` menggunakan `src/lib/public-content/profile.ts`, yang berasal
daripada `profile/profile-masjid.md`. Semua perenggan pengenalan, Visi, Misi,
Moto, rasional logo dan nota sumber dipaparkan mengikut data asal. Tiada fakta
sejarah atau penerangan teknikal seni bina ditambah.

## Komposisi

1. `PublicPageHeader`: tajuk Profil Masjid dan breadcrumb Utama / Profil Masjid.
   Tiada introduction tambahan kerana sumber tidak menyediakan ringkasan khusus.
2. Pengenalan: empat perenggan asal; lebar bacaan maksimum 70ch dengan heading
   di kolum kiri pada desktop.
3. Visi & Misi: dua panel pada 768px ke atas; satu kolum pada mobile.
4. Moto: signature section navy polos dengan aksen gold.
5. Rasional Logo: logo rasmi sehingga 340px pada desktop dan empat perenggan asal;
   pada mobile logo berada di atas teks.
6. Ruang & Seni Bina: lima foto daripada `profile.spacePhotoIds`.
7. Pautan ringan ke Carta Organisasi, Surau Kariah dan Galeri.

Pattern rasmi hanya digunakan dalam `PublicPageHeader`. Typography dan token
sedia ada dikekalkan. Kandungan Profil ialah komponen server, tanpa reveal
animation atau syarat JavaScript untuk memaparkan kandungan.

## Foto

| Source index | Production WebP | Caption |
| --- | --- | --- |
| #8 | `/interior/dewan-solat-utama.webp` | Dewan solat |
| #11 | `/interior/foyer-02.webp` | Foyer |
| #15 | `/interior/kubah-interior.webp` | Kubah dalaman |
| #17 | `/interior/mihrab.webp` | Mihrab |
| #19 | `/interior/sudut-bacaan.webp` | Sudut bacaan |

Foto menggunakan `next/image`, dimensi dan alt daripada manifest. CSS
`width: 100%; height: auto` mengekalkan nisbah asal tanpa crop; mihrab kekal
portrait. Dewan solat ialah visual utama, diikuti pasangan foyer/kubah dan
komposisi portrait/landscape mihrab/sudut bacaan. Mobile menggunakan satu kolum.
Logo menggunakan aset sedia ada `/brand/logo-masjid.png` tanpa pengubahsuaian.

## Shared shell & semakan

`PublicPageLayout` menerima `contentLayout="sections"` untuk Profil.
Pada implementation asal Fasa 3.3, placeholder halaman lain dikekalkan;
halaman-halaman tersebut kini telah siap dalam Fasa 3.4–3.7. Pautan desktop Profil membuka
dropdown melalui hover/focus dan menuju `/profil` apabila diklik. Mobile kekal
menggunakan menu tap. Route awam berkongsi transisi kandungan `main` selama 190ms;
Navbar/Footer kekal stabil dan reduced motion memaparkan halaman tanpa animasi.

QA pada 375px, 430px, 768px dan 1440px merangkumi overflow, heading hierarchy,
lebar teks, nisbah/alt foto, semua kandungan visible serta navigation.
Screenshot penuh diambil selepas foto lazy-load dimuatkan. Lint, production build
dan `git diff --check` dijalankan untuk review.

Fasa 3.3 telah diluluskan, dikomit dan dipush melalui `9a9c0a3`.
Fasa 3.4–3.7 turut selesai. Profil masih membaca data tempatan; migration
production dan frontend CMS fetch belum dibuat.
