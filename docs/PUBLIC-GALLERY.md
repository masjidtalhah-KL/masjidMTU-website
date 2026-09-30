# Galeri — Fasa 3.6

Route `/galeri` menggunakan `PublicPageLayout` dan `PublicPageHeader` sedia ada.
Sumber data: `src/lib/public-content/gallery.ts` dan manifest `publicAssets`.
Hanya 12 foto interior yang diluluskan digunakan. Foto #18 carta kewangan,
contact sheet dan sumber lain tidak dimasukkan.

Halaman menyusun foto mengikut `category` dan `order`. Sekarang hanya kategori
`Interior Masjid` dipaparkan. Di sempadan halaman, data tempatan ditukar kepada
`MediaGalleryItem` (id, src, alt, width, height, category, order, title pilihan,
caption pilihan). `MediaGallery` menerima item ini tanpa mengetahui nama kategori
atau sumber fail. Penukaran kepada data CMS kemudian hanya memerlukan mapping
ke bentuk yang sama.

Foto pertama menjadi visual anchor lebar, foto landscape berikutnya membentuk
pasangan, dan semua foto portrait mendapat tile penuh dengan imej tidak dipotong.
Semua foto menggunakan `next/image`, dimensi manifest, responsive sizes dan
nisbah asal. Hanya foto pertama diberi priority; selebihnya lazy secara lalai.

Thumbnail ialah butang yang membuka native `<dialog>`. Lightbox mempunyai
Tutup, Sebelumnya, Seterusnya, Escape dan kekunci panah kiri/kanan. Dialog
mengurus focus ketika dibuka; selepas ditutup focus pulang ke thumbnail asal.
Tiada dependency galeri baharu atau motion berat. Caption hanya daripada data
yang sudah disediakan; komponen juga menyokong foto tanpa title/caption.

Fasa 3.6 menunggu visual review; belum dikomit atau dipush.
