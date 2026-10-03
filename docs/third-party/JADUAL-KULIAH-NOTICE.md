# Jadual Kuliah — provenance dan lesen renderer

Adaptasi dibuat pada **2026-10-01** untuk fidelity poster prototype Fasa 4.2A.

## Sumber

- Edisi Masjid Talhah: <https://github.com/masjidtalhah-KL/JadualKuliahBulanan>
- Commit yang diperiksa: `378b1bbb4084b4f7b6c55ac70a5c4f769d221d28`.
- Kredit projek asal: <https://github.com/Kengkorok/jadual-kuliah-generator>.
- Notice upstream: **Jadual Kuliah Generator — Copyright (c) 2026**.
- Lesen upstream: **GNU General Public License version 3.0**. Salinan notice
  asal: [JADUAL-KULIAH-UPSTREAM-LICENSE.txt](JADUAL-KULIAH-UPSTREAM-LICENSE.txt).
  Teks lesen penuh: [GPL-3.0.txt](GPL-3.0.txt), diperoleh daripada
  <https://www.gnu.org/licenses/gpl-3.0.txt>.

## Bahagian yang diadaptasi

`src/sanity/tools/lecture-generator/LecturePoster.tsx` dan `poster-layout.ts`
ialah adaptasi renderer di bawah **GPL-3.0-only**. Sumber rujukan:

- `app-core.js`: `slotHTML`, `monthCells`, `renderPoster`, `fitText`, bayang sel.
- `app.css`: geometri 1240 × 877, header, weekday pills, badge tarikh,
  slot bands, portrait, dua sesi/reverse, Yasin dan saiz enam baris.
- `profile.js`: pemetaan identiti/aset dan treatment kitab.
- `app-ui.js`: geometri export A4/A3 dan semakan overflow sebelum export.
- `data/jadual-talhah-semua-bulan.json`: diperiksa untuk bentuk data/presentation,
  bukan diimport sebagai jadual aplikasi ini.
- Poster yang benar-benar dirender oleh `jadual-kuliah-generator.html` diperiksa
  dalam browser. Bundle Talhah menggunakan beberapa ukuran header/artwork yang
  berbeza daripada override profil generik dalam `app.css`; ukuran paparan Talhah
  sebenar digunakan untuk adaptasi header.

Perubahan: React menerima props berstruktur; rendering SVG dan text measurement
canvas menggantikan string HTML, query DOM, CSS global dan canvas artwork teks.
Compact calendar diadaptasi kepada bulan 1–12. Portrait menerima dimensi, fit,
posisi dan zoom dengan `contain` sebagai default selamat. Export SVG menggunakan
renderer sama, aset same-origin diembedded, dan saiz raster A4/A3 diselaraskan.
Tiada localStorage, workspace JSON, iframe atau salinan aplikasi HTML penuh dalam
implementation production. Tiada dependency baharu.

Kekalkan notice ini, tanda perubahan dan GPL-3.0 bersama adapted source apabila
menyalin atau mengedar. Pengedaran derivative/combined work perlu memenuhi GPL-3.0,
termasuk Corresponding Source apabila terpakai; jangan anggap pemisahan fail ini
mengecualikan kewajipan lesen bagi hasil gabungan. Tugas ini tidak menerbitkan
aplikasi atau menukar lesen semua fail repository yang lain.

## Aset rujukan terpilih

Enam imej berikut diekstrak **byte-for-byte** daripada `ASSETS` dalam bundle
upstream pada commit di atas. Tiada crop, resize, retouch atau AI enhancement.

| Key upstream | Fail tempatan | Kegunaan |
| --- | --- | --- |
| `logos` | `public/lecture-demo/header-logos.webp` | Komposisi logo JAWI + masjid, khusus poster |
| `mosque` | `public/lecture-demo/mosque-cutout.webp` | Artwork foto masjid sedia ada; background sudah diproses upstream |
| `yasin` | `public/lecture-demo/yasin-book.webp` | Gambar kitab Yasin/Tahlil |
| `abu` | `public/lecture-demo/speaker-a.webp` | Portrait rujukan untuk fixture Contoh A |
| `arfah` | `public/lecture-demo/speaker-b.webp` | Portrait rujukan untuk fixture Contoh B |
| `hasnol` | `public/lecture-demo/speaker-c.webp` | Portrait rujukan untuk fixture Contoh C |

Upstream README menyatakan gambar/QR milik pemilik masing-masing; lesen kod
tidak dianggap memindahkan hak imej tersebut. Aset ini digunakan sebagai rujukan
visual atas arahan pemilik projek. Jadual/nama A/B/C ialah **demo rekaan**, bukan
identiti sebenar dalam foto, pengesahan kehadiran atau jadual rasmi individu itu.
Label demo kekal pada UI dan export. QR infaq dan data jadual sebenar tidak disalin.

## Fasa 5.3A workflow audit — 3 October 2026

Fresh clone plus remote refs/heads/main check confirmed the exact review source
378b1bbb4084b4f7b6c55ac70a5c4f769d221d28. LICENSE/README and app-core.js/app-ui.js/
profile.js were inspected for provenance, direct cell selection, full/mixed banners,
rule preservation, browser monthly storage and export.

Native HTML overlay buttons, selected-day React state changes, original local raster
reader and optional specialPoster model/validation are independently implemented
from the observed workflow; no substantial legacy editor source was newly pasted.
The existing adapted LecturePoster/poster-layout files keep their GPL-3.0-only
notices when extended. special-event-demo.svg/png is independently authored
non-production artwork, not an upstream/owner event poster.

D18's derivative/combined-application licensing decision remains open. This review
does not change the reference license, remove attribution, settle distribution
obligations or claim rights over upstream portraits. [Review matrix](../LECTURE-GENERATOR-UX-RECOVERY.md).

## Adaptive infaq follow-up — 4 October 2026

Legacy behavior reviewed at the same exact source 378b1bbb4084b4f7b6c55ac70a5c4f769d221d28. New infaq eligibility, centered sizing and SVG composition are independently implemented from observed behavior and owner requirements; no substantial legacy donation implementation is pasted. Existing adapted file notices stay intact and D18 remains unresolved. The QR is supplied separately by the owner for local review, not extracted from legacy source. It is copied byte-for-byte without Sanity upload; historical source classifications remain unchanged.
