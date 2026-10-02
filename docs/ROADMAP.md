# Roadmap Projek

Selesaikan dan semak setiap fasa sebelum memulakan fasa seterusnya.

| Fasa | Fokus | Status |
| --- | --- | --- |
| **0** | Project Foundation | **Siap** |
| **1** | Design System | **Siap** |
| **2** | Public Homepage | **Siap** |
| **3** | Public Pages | **Siap** |
| **4** | Sanity CMS | **Siap** — checkpoint 4.3C |
| **5** | Dynamic Content | **Semasa** — 5.1 siap; 5.2 belum bermula |
| 6 | Admin Foundation | Belum bermula |
| 7 | Feature Flags & Campaign Engine | Belum bermula |
| 8 | Qurban MVP | Belum bermula |
| 9 | Payment & Receipt | Belum bermula |
| 10 | Ramadan Iftar | Belum bermula |
| 11 | Security & Production Hardening | Belum bermula |
| 12 | Production Launch | Belum bermula |

## Pecahan Fasa 5

| Langkah | Fokus | Status |
| --- | --- | --- |
| 5.1 | Published public read layer: Profil, Organisasi, Surau, Galeri, Hubungi | **Siap** — diluluskan; `phase-5.1-sanity-public-content`, cache 5 minit dan explicit fallback |
| 5.2 | Dynamic content seterusnya; scope belum diluluskan | **Belum bermula**; memerlukan arahan berasingan |

Rujuk [SANITY-PUBLIC-CONTENT.md](SANITY-PUBLIC-CONTENT.md). Tiada production
content writes, redesign atau operasi/admin dalam scope 5.1 ini. Pengguna
meluluskan commit/push dan checkpoint selepas final closeout lulus.
Local editorial content lima route kekal explicit fallback sahaja;
homepage pengumuman/program/berita/kuliah kekal local/mock dan Publish penjana disabled.

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
| 4.3 | Content Migration / Seeding | **Siap** — preparation, draft migration dan controlled publication; frontend integration belum bermula |
| 4.3A | Content Migration Preparation & Dry Run | **Siap** — `ea8dd09`, checkpoint `phase-4.3a-migration-dry-run`; tanpa upload/write |
| 4.3B | Migration production sebagai draft sahaja | **Siap** — 43 draft, 50 aset imej unik, 0 konflik; checkpoint `phase-4.3b-draft-migration` |
| 4.3C | Controlled Publication bagi 43 draft diluluskan | **Siap** — 43 published, 0 draft, 50 aset, 0 konflik; `phase-4.3c-controlled-publication` |

Rujuk [SANITY.md](SANITY.md) dan [SANITY-CONTENT-MODEL.md](SANITY-CONTENT-MODEL.md).
Pada checkpoint Fasa 4 halaman public kekal menggunakan data tempatan;
utility mapping/validation/dry-run tersedia dalam Fasa 4.3A. Fasa 4.3B telah
memigrasikan draft production sahaja; frontend CMS fetch belum dimulakan.
Fasa 4.3C menerbitkan tepat 43 dokumen itu; Publish penjana kuliah kekal disabled.
Rujuk [SANITY-MIGRATION.md](SANITY-MIGRATION.md).
Publication dilaksanakan di Linux dan independently verified oleh Work;
rekod transaksi, safe HTTP 400 failure/fix dan QA berada dalam
[SANITY-PUBLICATION.md](SANITY-PUBLICATION.md). Integrasi 5.1 semasa direkodkan di atas.

Prototype kuliah direkodkan dalam [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md).

Checkpoint model: `phase-4.2-sanity-content-model`; checkpoint migration:
`phase-4.3c-controlled-publication`. QA Oktober sebenar direkodkan dalam
[SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md) dan kekal dikecualikan daripada migration.
Keputusan lesen GPL adapted renderer/combined application masih terbuka
sebelum production; rujuk [DECISIONS.md](DECISIONS.md).
