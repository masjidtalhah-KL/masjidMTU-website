# Ledger Kos & Usaha Projek

Disediakan pada **1 Oktober 2026** untuk rekod dan pembentangan AJK.
**Tiada amaun kos atau jumlah jam dapat disahkan daripada repository/docs yang
disemak.** Semua nilai kewangan di bawah menunggu bukti; ini bukan anggaran harga
pasaran atau pengesahan bahawa perkhidmatan percuma/berbayar tertentu digunakan.
Jumlah kos sebenar **belum boleh dikira**, bukan RM0.

## 1. Kos sebenar disahkan

Belum ada transaksi yang disokong invoice/resit/usage statement dalam bahan yang
disemak. Tambah hanya apabila amaun, tempoh, pembayar dan bukti telah disahkan.
Kos langganan yang sudah dibayar masuk di sini; komitmen akan datang masuk Bahagian 2.

| ID | Tarikh / tempoh | Item / penyedia | Amaun & mata wang asal | Bahagian untuk projek | Pembayar | Bukti / status |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-001 | Menunggu bukti | ChatGPT subscription — pelan belum disahkan | Menunggu bukti | Menunggu kaedah agihan | Menunggu bukti | Resit langganan belum tersedia |
| ACT-002 | Menunggu bukti | Work/Codex — caj tambahan jika benar-benar ada | Menunggu bukti | Menunggu project attribution | Menunggu bukti | Billing/usage; mungkin termasuk dalam langganan, belum disahkan |
| ACT-003 | Menunggu bukti | OpenRouter / Astra / API — penggunaan dan penyedia belum disahkan | Menunggu bukti | Menunggu attribution | Menunggu bukti | Invoice/CSV/model ID; jangan anggap model/akaun tertentu telah digunakan |
| ACT-004 | Menunggu bukti | Domain — domain/provider belum disahkan | Menunggu bukti | Menunggu bukti | Menunggu bukti | Resit pendaftaran/renewal |
| ACT-005 | Menunggu bukti | Hosting/server — provider/plan belum disahkan | Menunggu bukti | Menunggu bukti | Menunggu bukti | Invoice hosting/server |
| ACT-006 | Menunggu bukti | Sanity — project wujud, plan/caj belum disahkan | Menunggu bukti | Menunggu bukti | Menunggu bukti | Billing project/organization |
| ACT-007 | Menunggu bukti | Supabase/PostgreSQL — integrasi belum dibina | Menunggu bukti | Menunggu bukti | Menunggu bukti | Bukti jika pernah dibayar; implementation belum membuktikan perbelanjaan |
| ACT-008 | Menunggu bukti | Email service — integrasi belum dibina | Menunggu bukti | Menunggu bukti | Menunggu bukti | Invoice jika berkenaan |
| ACT-009 | Menunggu bukti | Payment gateway — integrasi belum dibina | Menunggu bukti | Menunggu bukti | Menunggu bukti | Statement fee/transaksi jika berkenaan |
| ACT-010 | Menunggu bukti | Infrastruktur lain / backup / monitoring / storage | Menunggu bukti | Menunggu bukti | Menunggu bukti | Penyedia dan invoice belum tersedia |

Baris ini ialah **placeholder, bukan actual cost yang telah disahkan**. Setelah
bukti diterima, tambah nombor invoice/receipt, tax/fee, tarikh pembayaran,
rujukan bank dan status seperti Disahkan / Perlu padanan / Dikecualikan.

## 2. Kos berulang / komitmen

Rekod kontrak atau kadar renewal yang disahkan secara berasingan daripada
pembayaran lampau. Tiada harga, pelan, cycle atau komitmen kewangan disahkan sekarang.

| ID | Item | Status penggunaan projek | Plan / cycle / kadar | Tarikh renewal | Bukti / keputusan diperlukan |
| --- | --- | --- | --- | --- | --- |
| REC-001 | ChatGPT subscription | Bantuan pembangunan diminta; butiran billing tiada | Menunggu bukti | Menunggu bukti | Receipt/pelan dan kaedah agihan peribadi vs projek |
| REC-002 | Work/Codex atau API usage | Pengukuran/caj sebenar belum disahkan | Menunggu bukti | Jika berkenaan | Billing/usage dan sama ada included atau berasingan |
| REC-003 | Domain | Domain belum disahkan | Menunggu bukti | Menunggu bukti | Domain/provider dan renewal receipt |
| REC-004 | Hosting/server | Deployment/provider belum disahkan | Menunggu bukti | Menunggu bukti | Invoice/pelan/server dan tempoh |
| REC-005 | Sanity | Studio project `2o95jmms`, dataset `production` tersedia | Menunggu bukti | Jika berkenaan | Plan, seats, quota dan billing statement; nama dataset bukan plan berbayar |
| REC-006 | Supabase/PostgreSQL | Dirancang untuk operasi; belum diintegrasi | Menunggu keputusan/bukti | Jika berkenaan | Plan/usage apabila dipilih |
| REC-007 | Email, backup, monitoring, storage | Fasa kemudian | Menunggu keputusan/bukti | Jika berkenaan | Provider dan subscription sebenar |

Apabila invoice renewal dibayar, pautkan ID REC kepada baris ACT yang berkenaan;
jangan jumlahkan komitmen dan pembayaran yang sama dua kali.

## 3. Kos pilihan / masa hadapan

Ini senarai keputusan bajet, **bukan perbelanjaan yang telah dibuat**. Belum ada
quotation/kadar yang boleh digunakan; semua amaun menunggu bukti.

| ID | Keperluan | Bila dinilai | Model kos / bukti yang perlu dikumpul |
| --- | --- | --- | --- |
| FUT-001 | Domain + production hosting | Sebelum production launch | Pendaftaran/renewal/server/traffic; quote rasmi apabila provider dipilih |
| FUT-002 | Sanity plan/seats/storage/usage tambahan | Migration dan kandungan dinamik | Billing/quote berdasarkan plan dan penggunaan sebenar |
| FUT-003 | Supabase/PostgreSQL + backup | Admin/campaign operasi | Plan database/storage/compute; quote dan backup policy |
| FUT-004 | Email transactional | Resit/notifikasi kemudian | Plan atau caj per penghantaran; quote rasmi |
| FUT-005 | Payment gateway | Fasa pembayaran | Setup/recurring/per transaksi, tax dan settlement fees; agreement rasmi |
| FUT-006 | OpenRouter/Astra/API tambahan | Hanya jika dipilih bagi workflow projek | Nama penyedia/model tepat, unit usage dan rate pada statement; belum disahkan |
| FUT-007 | Monitoring/security/backup/infrastruktur lain | Hardening/launch | Quote/provider/renewal; elakkan menambah service tanpa keperluan |
| FUT-008 | Print proof poster atau bantuan profesional | Jika diluluskan | Quotation, deliverable dan resit; bukan scope generator demo semasa |

## 4. Usaha pembangunan — belum ada anggaran jam yang disahkan

Pisahkan kerja manusia, penggunaan AI dan caj service. Bilangan commit, julat
tarikh atau durasi build tidak membuktikan jam kerja aktif. Jangan menukar
jarak antara timestamps Git menjadi timesheet.

| ID | Fasa / deliverable | Bukti hasil | Jam direkod | Anggaran baki | Kadar / nilai usaha |
| --- | --- | --- | --- | --- | --- |
| EFF-001 | 0 — Foundation | `c8c9252` | Menunggu timesheet | Tidak dianggarkan | Menunggu keputusan |
| EFF-002 | 1 — Design System/refinements | `f24b1ee` | Menunggu timesheet | Tidak dianggarkan | Menunggu keputusan |
| EFF-003 | 2 — Homepage/foto/QA | `4ab8a03`, `d92a571` | Menunggu timesheet | Tidak dianggarkan | Menunggu keputusan |
| EFF-004 | 3 — Content/assets/public pages | `12d8bc8` hingga `c9d0d20` | Menunggu timesheet | Tidak dianggarkan | Menunggu keputusan |
| EFF-005 | 4.1 — Sanity Foundation | `d48e36c` | Menunggu timesheet | Tidak dianggarkan | Menunggu keputusan |
| EFF-006 | 4.2/4.2A — Schemas/prototype kuliah | Working tree, belum commit | Menunggu timesheet | Tidak dianggarkan | Menunggu keputusan |
| EFF-007 | Fasa akan datang | ROADMAP | Belum direkod | Menunggu scope/estimate berasingan | Menunggu keputusan |

Timesheet minimum: tarikh, orang, aktiviti/fasa, masa mula/tamat, rehat dan jumlah
jam aktif. Jika anggaran retrospektif diperlukan, label **anggaran**, nyatakan
kaedah serta siapa mengesahkan. Jika kerja sukarela, catat hanya selepas pengesahan;
jangan anggap ia percuma atau menambah nilai usaha sebagai pembayaran sebenar.

## 5. Bukti yang perlu dikumpul

- Invoice/resit semua service, nombor dokumen, tarikh/tempoh, mata wang, tax,
  pembayar dan pembayaran yang sepadan.
- Resit ChatGPT subscription dan billing Work/Codex jika ada caj berasingan.
  Account usage percentage/quota bukan nilai wang atau penggunaan projek khusus.
- OpenRouter CSV/usage export atau provider API statements: request/date/model,
  unit/tokens, caj, credits/refunds dan cara mengenal pasti request projek.
  Bezakan top-up kredit daripada penggunaan kredit.
- Domain registration/renewal receipts; server/hosting invoices; Sanity,
  Supabase, email dan payment gateway statements apabila berkaitan.
- Git commit/tag timestamps sebagai bukti milestone sahaja, bersama timesheet
  dan rekod review untuk menerangkan usaha; bukan pengganti invoice atau jam aktif.

Simpan dokumen kewangan/account sensitif dalam lokasi peribadi yang diluluskan;
ledger boleh memegang ID/rujukan sahaja. Jangan simpan credentials, nombor kad
penuh atau bukti sensitif dalam `public/` atau repo public.

## 6. Kaedah ringkasan untuk AJK

1. Jumlah **actual disahkan** mengikut mata wang dan tempoh laporan. Tukaran RM
   hanya dengan kadar/transaksi yang ada bukti, sambil mengekalkan amaun asal.
2. Paparkan komitmen berulang, cadangan bajet masa hadapan dan nilai usaha di
   bahagian berasingan; jangan campurkan semuanya sebagai “kos telah dibayar”.
3. Langganan termasuk Work/Codex usage tidak dikira dua kali. Top-up dan
   consumption API bukan dua perbelanjaan tambahan untuk kredit yang sama.
4. Bagi akaun dikongsi/peribadi, catat kadar agihan projek yang dipersetujui.
   Sehingga ada bukti, nilai kekal **Menunggu bukti**, bukan sifar.
5. Tarikh sejarah boleh dirujuk pada [PROJECT-JOURNEY.md](PROJECT-JOURNEY.md).
   Status teknologi/scope ada dalam [PROJECT-STATE.md](PROJECT-STATE.md).
