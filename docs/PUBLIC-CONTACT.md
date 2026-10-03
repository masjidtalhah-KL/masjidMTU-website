# Hubungi — Fasa 3.7

Route `/hubungi` memaparkan data tempatan daripada `src/lib/public-content/contact.ts`,
yang disediakan berdasarkan `hubungi.md`. Komponen `ContactDetailsView` menerima
data berstruktur supaya sumber kandungan boleh ditukar kemudian tanpa mengulang
susun atur halaman.

Alamat, telefon, emel, Facebook dan waktu pejabat dipaparkan tepat seperti data
tempatan. Nombor telefon menggunakan pautan `tel:`, emel menggunakan `mailto:`,
dan Facebook membuka URL yang disediakan dalam tab baharu.

Semasa review Fasa 3.7, pengguna meluluskan tambahan Instagram rasmi
`https://www.instagram.com/masjidtalhahubaidillahofficial/` dan waktu tutup
`Sabtu, Ahad dan Cuti Umum: Tutup`. Kedua-duanya disimpan dalam data tempatan.

Subtajuk perhubungan ialah “Hubungi kami”. Ikon outline Heroicons (map-pin,
phone, envelope, share) menggantikan label visual; label pembaca skrin dikekalkan.
Lesen ikon disimpan dalam `docs/third-party/HEROICONS-LICENSE.txt`.
Empat ikon sosial PNG yang dibekalkan pengguna disimpan tanpa perubahan dalam
`public/social/`. Ikon Facebook/Instagram berukuran 32px dalam kawasan pautan
48px, dengan crossfade hitam ke warna pada hover/fokus. Reduced motion
menukar warna tanpa animasi. Kedua-dua pautan membuka tab baharu.
Paparan ikon sahaja ialah keputusan visual yang diluluskan. URL Facebook dan
Instagram datang daripada `contact.facebook.href` dan `contact.instagram.href`,
bukan URL hardcoded dalam JSX. Setiap pautan mempunyai label accessible yang
menyebut platform dan pembukaan tab baharu.

Bahagian Lokasi menawarkan carian Google Maps berdasarkan teks alamat rasmi.
Tiada koordinat, Place ID atau pin lokasi yang disahkan dalam sumber; oleh itu
halaman tidak memaparkan peta terbenam atau mendakwa titik lokasi yang tepat.
Tiada borang hubungan atau integrasi API ditambah.

Fasa 3.7 telah diluluskan. Checkpoint: `phase-3.7-contact`.
Fasa 4.3B telah mengisi Site Settings sebagai draft production;
kandungan halaman kekal static/local tanpa integrasi CMS atau publish.

## Fasa 5.2A completed — published evergreen NCR

Published siteSettings.ncrService now renders at `/hubungi#nikah-cerai-ruju`, after office details/hours and before Lokasi. Heading: **Penolong Pendaftar Nikah, Cerai & Ruju’ (NCR)**.

- **USTAZ WAN HALIM BIN MD.YUSOFF** — **019 374 9937**, `tel:0193749937`.
- **USTAZ NIK MUHAMMAD FADLAN BIN NIK MAHMOOD** — **011 2937 8366**, `tel:01129378366`.

Officer facts are accessible HTML; the original NCR poster is supplementary. Desktop cards are paired; mobile cards stack. No invented service hours/jurisdiction. Office contacts/social/hours/location remain unchanged and passed Fasa 5.1 base-presentation regression. Server-only published reads use five-minute revalidation; absent/outage NCR fabricates no officer data and malformed content stays visible. General donation copy/QR lives separately at /#donations. See [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md).
