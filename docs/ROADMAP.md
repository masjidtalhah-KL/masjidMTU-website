# Roadmap Projek

Selesaikan dan semak setiap fasa sebelum memulakan fasa seterusnya.

| Fasa | Fokus | Status |
| --- | --- | --- |
| **0** | Project Foundation | **Siap** |
| **1** | Design System | **Siap** |
| **2** | Public Homepage | **Siap** |
| **3** | Public Pages | **Siap** |
| **4** | Sanity CMS | **Semasa** |
| 5 | Dynamic Content | Belum bermula |
| 6 | Admin Foundation | Belum bermula |
| 7 | Feature Flags & Campaign Engine | Belum bermula |
| 8 | Qurban MVP | Belum bermula |
| 9 | Payment & Receipt | Belum bermula |
| 10 | Ramadan Iftar | Belum bermula |
| 11 | Security & Production Hardening | Belum bermula |
| 12 | Production Launch | Belum bermula |

## Pecahan Fasa 3

| Langkah | Fokus | Status |
| --- | --- | --- |
| 3.0 | Planning & Asset Mapping | Diluluskan |
| 3.1 | Content & Asset Preparation | **Siap** — dikomit dan dipush |
| 3.2 | Shared Navigation & Public Page Shell | **Siap** — diluluskan |
| 3.3 | Halaman Profil | **Siap** — dikomit dan dipush |
| 3.4 | Carta Organisasi | **Siap** — dikomit dan dipush |
| 3.5 | Surau Kariah | **Siap** — dikomit dan dipush |
| 3.6 | Galeri | **Siap** — dikomit dan dipush |
| 3.7 | Hubungi | **Siap** — diluluskan |

Rujuk [PUBLIC-CONTENT.md](PUBLIC-CONTENT.md) untuk sumber kandungan, manifest dan
mapping aset. Navigation serta lima route shell Fasa 3.2 direkodkan dalam
[PUBLIC-NAVIGATION.md](PUBLIC-NAVIGATION.md). Halaman `/profil` menggunakan data
tempatan Fasa 3.1; rujuk [PUBLIC-PROFILE.md](PUBLIC-PROFILE.md). Halaman organisasi
direkodkan dalam [PUBLIC-ORGANISATION.md](PUBLIC-ORGANISATION.md). Surau Kariah
direkodkan dalam [PUBLIC-SURAU.md](PUBLIC-SURAU.md). Galeri direkodkan dalam
[PUBLIC-GALLERY.md](PUBLIC-GALLERY.md). Halaman Hubungi direkodkan dalam
[PUBLIC-CONTACT.md](PUBLIC-CONTACT.md).

## Pecahan Fasa 4

| Langkah | Fokus | Status |
| --- | --- | --- |
| 4.1 | Sanity CMS Foundation — embedded Studio dan Site Settings singleton | **Siap** — diluluskan, dikomit dan dipush |
| 4.2 | Content Models — schema editorial dan singleton Profil | **Siap** — diluluskan untuk checkpoint |
| 4.2A | Prototype Penjana Jadual Kuliah — tool native, model bulanan dan poster demo | **Siap sebagai prototype** — diluluskan untuk checkpoint; Publish disabled |
| 4.3 | Content Migration / Seeding | Preparation sahaja; tiada production migration |
| 4.3A | Content Migration Preparation & Dry Run | Implementation untuk review — belum dikomit/dipush; tanpa upload/write |
| 4.3B | Migration production sebenar | Belum bermula — menunggu review/kelulusan berasingan |

Rujuk [SANITY.md](SANITY.md) dan [SANITY-CONTENT-MODEL.md](SANITY-CONTENT-MODEL.md).
Halaman public kekal menggunakan data tempatan;
utility mapping/validation/dry-run tersedia dalam Fasa 4.3A. Migration production
dan frontend CMS fetch belum dimulakan. Rujuk [SANITY-MIGRATION.md](SANITY-MIGRATION.md).

Prototype kuliah direkodkan dalam [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md).

Checkpoint: `phase-4.2-sanity-content-model`. QA Oktober sebenar direkodkan dalam
[SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md). Tiada content migration atau production
writes. Keputusan lesen GPL adapted renderer/combined application masih terbuka
sebelum production; rujuk [DECISIONS.md](DECISIONS.md).
