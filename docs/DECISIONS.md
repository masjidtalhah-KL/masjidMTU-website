# Rekod Keputusan Projek

## Fasa 6.1 complete — owner-approved checkpoint

8 October 2026 (+08:00). Minimum deterministic MFA naming/selection patch deployed
READY to dedicated staging: dpl_5EZM2KX68cK154fxWHbN5megXqqs,
https://masjid-mtu-admin-staging.vercel.app. 97/97 local automated tests, lint,
TypeScript and production Webpack build passed; authorization/RLS/migration unchanged.
Only lost Primary was removed through supported Auth Admin MFA API after fresh
Backup/AAL2 proof. Replacement Primary and the retained Backup independently
restored genuine hosted AAL2. Google relogin stays AAL1 until a fresh TOTP challenge.

30/30 actual hosted API/refresh/AAL1 assertions passed; refresh does not advance
signed TOTP recency, and naturally stale privileged mutation returns 403. Three
supplementary live-membership rollback contracts and two genuine-session cleanup
assertions passed. An unexpired real JWT is denied after supported global logout.
8/8 deployed route regressions, public/Studio/Kuliah, bundle and bounded logs checks
are green. Public navigation retains no authenticated admin content.

Final counts: one isolated Auth user/Google identity/active test-super-admin profile,
two verified factors, zero sessions/live refresh records/pending invites, one accepted
and four revoked historical invites, 12 preserved audit rows. Sole review identity
and factors retained; all test sessions removed. No real owner onboarded.
No second isolated Google identity exists: ordinary external staff/admin browser
admission and independent account switching were not exercised. A committed revoked
sole-owner browser replay was avoided; existing contracts and rollback evidence
remain explicit. Owner accepts these limitations with critical closure gates green.
Free-plan timeout limitations and future independent owner recovery custody remain
documented. **Fasa 6.1 complete and owner-approved on 8 October 2026.**
Owner authorizes the canonical main commit and tag
`phase-6.1-admin-foundation-complete`; resolve the tag for the checkpoint commit.
No production resources or real-owner onboarding; Fasa 7 remains unstarted. [Actual B-2R evidence](ADMIN-FOUNDATION-MFA-RECOVERY-VERIFICATION.md).

## Historical B-2 owner-review evidence

8 October 2026 (+08:00). Preflight from clean/synced main
05a1e394c2dce9a6c816020072e5bc9c3d466540 passed. Google is now enabled in dedicated
staging; email/phone/anonymous remain disabled. Auth hook and exact staging URLs
are unchanged. Login responds 200; Vercel has eight required variables and no
privileged runtime key. Initial hosted users/profiles/invites/audit counts were zero.
First real no-invite Google denial passed: owner browser result, Google/hook Auth
logs and zero users/identities/sessions/profiles/invites/audits corroborate it.
Second genuine Google login passed hosted admission and created one exact-email
Google identity. The controlled staging operator transaction bound the isolated
test super-admin profile, consumed the bootstrap invitation and added an audit.
Readback: one Auth user/Google identity/active profile, one accepted invitation,
two bootstrap audits. Next login produced a genuine OAuth AAL1 session with no
MFA factors; /admin/users redirected to /admin/mfa. Owner verified primary TOTP;
hosted session now AAL2 and Users opens. Real-session staff/admin invite create,
duplicate denial and revoke passed; six audits retained, zero pending invitations.
After 10 minutes, AAL2 remained but the server denied mutation until fresh MFA.
Backup enrollment/challenge and fresh step-up retry passed. Relogin after logout
returned to AAL1 despite both stored verified factors; Users redirects to MFA.
Logout removed the
session/refresh tokens; post-logout Users redirects to login. Eight route checks
and 30 deployed bundle scans pass. One test profile/two factors/eight audits retained.
No separate Google test account is available; ordinary admission/role/account-switch
and direct API gates remain explicitly unverified. No claim that Fasa 6.1 is closed.
Primary rechallenge is now blocked by genuine invalid-TOTP responses; owner
Owner confirms only one authenticator device/entry remains after deleting entries
while trying to obtain fresh codes. Primary possession is unverified; Backup is
the last successful factor. Explicit Backup challenge after entry loss passed.
Replacement-Primary enrollment naming needs a minimum reviewed patch; no reset,
runtime patch or deployment performed. [Recovery review](ADMIN-FOUNDATION-STAGING-RECOVERY-REVIEW.md).
No runtime/migration change or commit/push. Fasa 6.1 stays open.
[Actual B-2 evidence and pending gates](ADMIN-FOUNDATION-HOSTED-AUTH-VERIFICATION.md).

The following B-1 checkpoint is a historical record; its Google-disabled state
was true at that checkpoint, before the owner's B-2 provider configuration.

## Fasa 6.1B-1 — hosted staging decisions (7 October 2026, +08:00)

- Owner authorized the existing dedicated staging ref azypohqpupphapasweln,
  Singapore, and Vercel origin https://masjid-mtu-admin-staging.vercel.app.
  Primary service main/Production labels do not make these mosque production.
- Apply only the unchanged reviewed 20261006000100 migration after empty-state
  preflight. Hosted catalog, bodies, guards and public type core match local;
  no runtime or schema patch. Hosted versions/default operator grants differ
  without requiring wider privileges or a service key.
- Enable the private Before User Created hook, prove genuine negative invocation,
  then disable the initially enabled email provider. Set only approved non-Google
  staging Site URL/redirect. Google remains disabled; global signup creation is
  gated by the hook. No identities or membership fixtures remain committed.
- Authenticated DB-role and rollback-only invitation probes are synthetic
  contracts, not real Google/Auth-issued token success. Positive admission and
  hosted TOTP/session tests remain 6.1B-2.
- Keep two INFO no-policy private-table advisor findings as intentional deny-first
  design. Do not add policies merely to remove warnings.
- Initial scope prepared Vercel values only. Owner subsequently entered all eight
  variables and authorized commit/push/tag and first staging deployment. CLI
  verified their names/Production targets without decryption; no privileged key.
  Connector scope korok remains 403, but CLI credentials have correct project access.
- Deploy local canonical source; Vercel project has no Git/fork connection. The
  Production target belongs to this dedicated staging project. Add .vercelignore
  because source dry-run included nested Supabase caches despite Git ignoring them.
  No runtime/migration change; no Google, real owner, operational module or mosque
  production. Checkpoint tag: phase-6.1b1-hosted-supabase-staging.
- First deployment from tagged canonical commit 79a87e97c16573968eb4c57d0b19e421d6f7fba0
  is READY, ID dpl_DT9F1qXyZYbpKQMUHGSwzihYeDVn, stable staging alias verified.
  Hosted Turbopack build/TypeScript, 8 HTTP, 5 browser and 30 app-chunk checks pass.
  Record post-deployment evidence in a separate documentation commit; preserve the
  tag and deployed source commit without force-push or retagging.

[Hosted evidence and remaining gates](ADMIN-FOUNDATION-STAGING-VERIFICATION.md).

## Fasa 6.1A — real local verification decisions (6 October 2026, +08:00)

The owner approved the existing desktop/mobile foundation UI and authorized a
commit/push/tag after green full local verification, superseding the initial
6.1 no-commit boundary. All local checks passed; the checkpoint is
`phase-6.1a-local-admin-foundation`. Fasa 6.1 remains open. No UI redesign,
hosted resources, production, real owner or operational feature is authorized.

- Actual Docker Supabase replaces the previous local service uncertainty:
  PostgreSQL 17.6, Auth v2.187.0 and PostgREST 14.5, CLI 2.78.0.
- Intentional optimistic-version conflicts use SQLSTATE PT409 (HTTP 409).
  PostgREST retried intentional 40001 indefinitely in actual testing. Guards,
  locks, deny-first policy and transactional audits are preserved.
- Public types come from the real local pinned CLI, with exact parity and no
  synthetic fallback. The Auth FK exists; an unexposed Auth target intentionally
  does not appear in public-only generated relationship entries.
- Genuine local TOTP primary/backup, Auth-issued AAL2, refresh AMR, 600-second
  step-up and live factor-removal denial passed. Google identity/OAuth AMR setup
  is a declared trusted fixture; no successful Google OAuth is claimed.
- Actual private hook grants and real GoTrue rejection passed using an isolated
  local non-Google probe. Positive Google events passed the DB contract only;
  genuine first-time Google OAuth admission remains a staging gate.
- Existing browser adapter tests stay supplementary; real Next SSR/DAL also
  passed independently against actual local Auth and PostgREST.
- Provider session termination, hosted plan controls, recovery/bootstrap and
  real owner onboarding remain separately reviewed staging gates.

[Exact evidence and local reproduction](ADMIN-FOUNDATION-LOCAL-VERIFICATION.md).
The following initial 6.1 decisions/results are historical and are superseded
where the 6.1A evidence above resolves local uncertainty.

## Historical Fasa 6.1 — local implementation decisions (6 October 2026, +08:00)

The owner authorized local runtime/configuration/migrations/tests from
`91117322f7ac81043bbe9d952811dfbe02d8ccde`, with no hosted resources, real
owner, production provisioning, operational module, commit or push.

- Keep ordinary runtime entirely user-scoped: no privileged key imports.
  Guard all foundation mutations in PostgreSQL, including atomic audit.
- Owner reads require AAL2 and a current verified TOTP factor. Mutations also
  require signed TOTP AMR no older than 600 seconds using the database clock.
  This is locally verified against synthetic signed claims; real hosted AMR
  continuity/refresh/step-up behaviour remains a mandatory staging gate.
- One pending invitation per normalized exact email, seven-day expiry, DB role
  assignment, same Google subject binding and no ordinary super_admin changes.
- Preserve live deny on disable/revoke. Auth-provider session termination and
  infrastructure recovery are not silently claimed complete; UI reports the
  remaining staging task. No owner bootstrap endpoint or account is created.
- Pinned SSR 0.12.7 / supabase-js 2.117.2 supports the existing Next 16.3.6
  cookie/proxy API. Pinned local CLI 2.78.0 uses an overridden tar 7.5.22.
  Local wrappers reject remote link/push/deploy operations.
- Docker daemon unavailable: actual migration/RLS tests use PostgreSQL/PGlite
  with explicit Auth contract stubs; browser integration uses a synthetic
  Auth/RPC adapter. Neither proves real Supabase service/provider behaviour.
- Production builds pass with Webpack. The default Turbopack attempt stalled
  and was stopped; it is not reported as passed.

Fasa 6.1 remains open for owner review and full local/staging verification.
[Implementation and evidence](ADMIN-FOUNDATION-LOCAL.md);
[exact staging checklist](ADMIN-STAGING-CHECKLIST.md).

## Fasa 6.0 — owner-approved architecture decisions (6 October 2026, +08:00)

Owner requirements: operational `/admin` uses Supabase Auth/PostgreSQL, separate
from editorial Sanity `/studio`; no public signup, Google primary login, invite-only
membership, generic super_admin/admin/staff roles, owner-only initial super_admin
and mandatory stronger owner authentication. Mosque job titles do not define roles.

The owner approved the architecture with these decisions:

| Area | Decision |
| --- | --- |
| Access management | Remains super_admin-only in Fasa 6.1 |
| Invitations | Lifetime of 7 days |
| Super_admin assurance | Google OAuth + Supabase TOTP; AAL2 for operational access |
| Privileged mutations | Require recent MFA/step-up, target around 10 minutes where technically supported |
| Admin/staff assurance | May initially operate at AAL1 |
| Owner recovery | Primary authenticator + backup TOTP factor; owner-only Vaultwarden recovery material; independently protected Supabase project-owner recovery |
| Environments | Separate local, hosted staging and production; local + staging sufficient for 6.1; do not provision production until the owner explicitly approves |
| Audit | Included from the first foundation mutation; proposed 12-month retention |
| Session timeouts | Remain targets pending selected hosted-plan support; no hardcoded unsupported assumptions |
| Excluded modules | Qurban, Ramadan, BKK, payment, receipt, registration and finance |

The approved design uses Google SSR PKCE with private invite admission, live
identity/membership checks and deny-first RLS. Three minimum conceptual tables:
admin_profiles, expiring admin_invites and append-only admin_audit_log.
Normal operations preserve user-session RLS; privileged Auth administration stays
isolated. These are architectural requirements/conditional targets, not deployed
or runtime-tested controls. Concrete staging setup/bootstrap/recovery and
platform support must be reviewed in a separately authorized implementation task.

[Complete plan, policy matrix, threats and owner decisions](ADMIN-FOUNDATION-PLAN.md).
Fasa 6.0 closed at `phase-6.0-admin-foundation-architecture` (resolve tag for commit).
Fasa 6.1 has not started.
This task authorizes documentation checks and commit/push/tag only. No Fasa 6.1
implementation, runtime auth/database code, Supabase remote resources or modules.
All earlier decisions and immutable audit evidence remain unchanged.

Disusun pada **1 Oktober 2026 (+08:00)** daripada kod, dokumentasi dan sejarah
repository. Tarikh commit di bawah ialah **tarikh keputusan dapat dibuktikan
dalam Git**, bukan semestinya tarikh perbincangan atau kelulusan sebenar.
Model dan prototype akhir Fasa 4.2/4.2A diluluskan untuk checkpoint pada
2026-10-01 (tarikh sesi). Masa mula kerja asal tidak diketahui.

## D01 — Pembangunan berfasa dan architecture ringkas

- **Tarikh/bukti:** 2026-09-26, `c8c9252`; [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md).
- **Keputusan:** Next.js/React/TypeScript/Tailwind/ESLint; komponen reusable,
  mobile-first dan scope satu fasa pada satu masa.
- **Rasional:** Memudahkan review dan maintenance oleh pengurus projek bukan developer.
- **Kesan:** Tiada feature fasa kemudian ditambah tanpa scope/approval; status
  “Siap” sesuatu fasa tidak bermakna keseluruhan sistem sedia dilancarkan.

## D02 — Sanity untuk editorial; Supabase untuk operasi

- **Tarikh/bukti:** 2026-09-26, `c8c9252`; diperincikan 2026-09-30, `d48e36c`, [SANITY.md](SANITY.md).
- **Keputusan:** Sanity mengurus kandungan public; Supabase/PostgreSQL mengurus
  peserta, pendaftaran, pembayaran, resit dan transaksi. `/studio` dan `/admin` berasingan.
- **Rasional:** Kandungan editorial dan rekod operasi memerlukan model serta kawalan berbeza.
- **Kesan:** Program/galeri Qurban boleh editorial; transaksi Qurban bukan dokumen
  Sanity. Campaign engine bersama Qurban/Ramadan/wakaf/sumbangan dirancang kemudian.

## D03 — Identiti institusi dan nama penuh

- **Tarikh/bukti:** 2026-09-27, `f24b1ee`; [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **Keputusan:** Nama public penuh Masjid Talhah Bin Ubaidillah; navy/blue/gold/ivory,
  sans-serif sistem Segoe UI/Arial, token serta komponen Fasa 1 dikekalkan.
- **Rasional:** Rasa institusi rasmi, bacaan jelas di telefon dan pemuatan fon stabil.
- **Kesan:** Gold untuk aksen/CTA, bukan semua teks. Halaman baharu menyambung
  design system; tiada redesign atau clone visual reference.

## D04 — PNG pattern rasmi sebagai sumber tunggal

- **Tarikh/bukti:** 2026-09-27, `19f3c6c` dan hasil akhir `f24b1ee`.
- **Keputusan:** `banner-reference-01.png` dinamakan `brand-pattern-official.png`;
  fail itu sudah merupakan pattern bersih rasmi, bukan hanya reference.
- **Rasional:** Mengekalkan geometri identiti masjid secara tepat.
- **Kesan:** Implementasi pattern yang direka/diulang semula tidak digunakan.
  Hanya presentation melalui opacity, overlay, gradient, size, position/crop.
  Tiada tracing/generating geometri lain; pattern digunakan secara terkawal.

## D05 — Mihrab hiasan dan tiga tahap gold

- **Tarikh/bukti:** 2026-09-27, `f24b1ee`; [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **Keputusan:** `MihrabMark` dua garis arch minimal tanpa frame/teks, bukan emblem
  atau logo kedua. Gold menggunakan token 400/500/600 sedia ada.
- **Rasional:** Detail beridentiti tanpa bersaing dengan logo rasmi atau readability.
- **Kesan:** Jangan menambah secondary logo; depth aksen gold kekal terkawal.

## D06 — Foto rasmi dan animation sebagai progressive enhancement

- **Tarikh/bukti:** 2026-09-28, `4ab8a03`; [ARCHITECTURE.md](ARCHITECTURE.md).
- **Keputusan:** DSC03425 → hero `masjid-dome.jpg`; DSC03423 → exterior JPG asal
  dengan derivative WebP. Gunakan `next/image`; kandungan visible tanpa animation.
- **Rasional:** Kubah sebagai focal point dan foto sebenar kekal muncul pada review
  penuh, termasuk ketika observer/JavaScript tidak berjalan.
- **Kesan:** Original tidak diubah secara destructive. Reduced motion dihormati;
  animation/lazy loading tidak boleh menjadi syarat untuk kandungan kelihatan.

## D07 — Data tempatan, manifest dan aset terpilih

- **Tarikh/bukti:** 2026-09-29, `12d8bc8`; [PUBLIC-CONTENT.md](PUBLIC-CONTENT.md).
- **Keputusan:** Markdown sumber → modul profile/organisation/surau/gallery/contact
  dan manifest ber-ID. Copy hanya 12 interior, 23 staff, 15 logo surau yang digunakan.
- **Rasional:** Provenance jelas, asset ringan dan mudah dimigrasi kemudian.
- **Kesan:** Runtime tidak membaca OneDrive. WebP mengekalkan nisbah/warna tanpa
  upscale/crop/AI; logo asal dikekalkan, logo masjid tidak diduplikasi.

## D08 — Organisasi berasaskan slot jawatan

- **Tarikh/bukti:** model 2026-09-29, `12d8bc8`; paparan akhir 2026-09-30, `d7d93ff`.
- **Keputusan:** 25 slot, 23 foto; individu dengan dua jawatan dipaparkan pada
  kedua-dua konteks. Soffan kekal tanpa foto; Timbalan Pengerusi kekal dengan **Kosong**.
- **Rasional:** Mengekalkan struktur organisasi sebenar walaupun nama berulang,
  foto tidak tersedia atau jawatan belum diisi.
- **Kesan:** Jangan deduplicate berdasarkan nama, reka perjawatan atau wajah.
  Urutan Imam/Bilal mengikuti review akhir; model CMS juga satu dokumen per slot.

## D09 — Shared navigation dan public shell

- **Tarikh/bukti:** 2026-09-29, `71a2d95`, refinement `9a9c0a3`; [PUBLIC-NAVIGATION.md](PUBLIC-NAVIGATION.md).
- **Keputusan:** Desktop horizontal; Profil text link dengan dropdown hover/focus
  dan Escape; mobile tap disclosure. Header public compact. Sumbangan → `/#donations`.
- **Rasional:** Navigation mudah ditemui, accessible dan konsisten merentas halaman.
- **Kesan:** Bukan hover-only pada mobile; bukan boxed Profil atau mega-menu.
  Transisi main ringan/reduced motion, Navbar/Footer stabil.

## D10 — Profil berdasarkan source dan lima foto

- **Tarikh/bukti:** 2026-09-29, `9a9c0a3`; [PUBLIC-PROFILE.md](PUBLIC-PROFILE.md).
- **Keputusan:** Pengenalan/visi/misi/moto/rasional daripada data asal; hanya foto
  #8, #11, #15, #17 dan #19. Mihrab portrait tidak dipaksa landscape.
- **Rasional:** Profil institusi yang tepat, readable dan seimbang.
- **Kesan:** Tiada fakta sejarah/arkitek/bahan/gaya seni bina direka. #2/#5 untuk Galeri.

## D11 — Surau tanpa maklumat tambahan yang direka

- **Tarikh/bukti:** 2026-09-30, `61d09f3`; [PUBLIC-SURAU.md](PUBLIC-SURAU.md).
- **Keputusan:** 3 Surau Jumaat + 12 Surau Biasa; kad logo/nama mengikut source.
- **Rasional:** Memaparkan identiti sebenar tanpa andaian contact atau lokasi tepat.
- **Kesan:** Alamat tersedia dalam data, bukan kad semasa. Tiada map/telefon/
  koordinat tambahan. MIMOS kekal pada saiz sumber atau lebih kecil.

## D12 — Galeri melalui adapter media dan koleksi berurutan

- **Tarikh/bukti:** UI 2026-09-30, `5936bfd`; model CMS diluluskan 2026-10-01,
  checkpoint `phase-4.2-sanity-content-model`.
- **Keputusan:** Adapter `MediaGalleryItem` memisahkan sumber data daripada UI;
  nisbah foto asal, lightbox keyboard/focus. Model CMS `galleryCollection.items`
  menggunakan object embedded berurutan, bukan dokumen berasingan setiap foto.
- **Rasional:** Boleh menambah kategori/menukar ke CMS tanpa mengulang layout atau
  memecahkan pengurusan satu koleksi menjadi terlalu banyak dokumen.
- **Kesan:** Initial gallery 12 interior; #18 carta kewangan/contact sheet
  dikecualikan public tetapi original tidak dipadam. Caption/alt hanya berdasarkan source.
  Bahagian model CMS diluluskan dalam checkpoint Fasa 4.2.

## D13 — Contact structured dan social icon-only

- **Tarikh/bukti:** 2026-09-30, `c9d0d20`; [PUBLIC-CONTACT.md](PUBLIC-CONTACT.md).
- **Keputusan:** Facebook/Instagram icon-only dengan label accessible; URL dalam
  `contact.ts`. Sabtu/Ahad/cuti umum tutup. Tel/mailto ialah pautan yang berfungsi.
- **Rasional:** Keputusan visual pengguna, data mudah dipindah ke CMS dan akses jelas.
- **Kesan:** Hitam → warna pada hover/focus; reduced motion tanpa animasi.
  Lokasi hanya carian alamat Google Maps, bukan embedded map/pin yang disahkan.

## D14 — Studio embedded, auth rasmi dan singleton

- **Tarikh/bukti:** 2026-09-30, `d48e36c`; [SANITY.md](SANITY.md).
- **Keputusan:** Official NextStudio `/studio`, Sanity authentication, env berpusat,
  fixed API `2026-09-01`, project `2o95jmms` / dataset `production`.
  Site Settings singleton; Profil singleton ditambah dalam checkpoint Fasa 4.2.
- **Rasional:** Editing standard tanpa custom login serta configuration yang tidak berulang.
- **Kesan:** Tiada write token browser/public mutation endpoint. Filter singleton
  menghalang pendua melalui Studio biasa, bukan constraint keselamatan API.
  Sanity tidak memerlukan downgrade Next/React/Tailwind; advisories didokumentasi,
  bukan diselesaikan melalui `npm audit fix --force`.

## D15 — Model dahulu, migration kemudian

- **Tarikh/bukti:** boundary 2026-09-30, `d48e36c`; model diperiksa 2026-10-01 dan dikomit dalam checkpoint `f2aa594`.
- **Keputusan:** Fasa 4.2 menyediakan schema editorial tanpa seeds, initial content,
  uploads atau fetch CMS pada halaman public.
- **Rasional:** Review model dahulu sambil menjaga public website yang telah diluluskan.
- **Kesan:** Static/local masih source runtime; draft preview/Presentation Tool/
  webhook dan frontend dynamic ditangguhkan. 11 document + 6 support types semasa
  diperincikan dalam [PROJECT-STATE.md](PROJECT-STATE.md).

## D16 — Penjana kuliah native sebagai prototype

- **Tarikh/bukti:** diluluskan 2026-10-01, checkpoint `phase-4.2-sanity-content-model`;
  [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md).
- **Keputusan:** Native tool React/CSS/SVG dalam Studio, bukan iframe. Model
  `lectureSpeaker` + `lectureRule` + `lectureMonth` menggantikan lecture ringkas;
  hari/sesi embedded, maksimum dua sesi. Aturan menjaga manual/cleared overrides.
- **Rasional:** Custom workflow bulanan yang sepadan dengan kerja editor masjid,
  dengan monthly snapshot untuk website/poster apabila penerbitan dibina nanti.
- **Kesan:** Demo fiksyen dalam memori, Publish disabled, tiada production writes.
  PNG/PDF asas bukan jaminan poster print-ready. Save/publish, upload, concurrency,
  snapshot sebenar, migration, public `/kuliah` dan export parity memerlukan scope/review lanjut.
- **Status:** Model dan prototype akhir diluluskan untuk checkpoint 4.2 pada
  2026-10-01; penerbitan produksi belum tersedia.

## D17 — Rekod kekal dan kewangan berasaskan bukti

- **Tarikh/bukti:** 2026-10-01, arahan pengguna; disertakan dalam checkpoint 4.2.
- **Keputusan:** State, keputusan, perjalanan dan ledger kos disimpan dalam repo
  supaya sesi baharu tidak bergantung pada sejarah chat.
- **Rasional:** Continuity kerja dan laporan AJK yang boleh disemak.
- **Kesan:** Tarikh inferens dilabel; tiada harga/jam direka. Git timestamps bukan
  timesheet atau bukti pembayaran. Dokumen ini tidak membenarkan commit/push sendiri.

## D18 — Renderer legacy dan lesen sebelum production

- **Tarikh/bukti:** 2026-10-01, renderer yang diluluskan dan
  [third-party/JADUAL-KULIAH-NOTICE.md](third-party/JADUAL-KULIAH-NOTICE.md).
- **Keputusan:** Kekalkan komposisi poster legacy yang dipin pada commit
  `378b1bbb4084b4f7b6c55ac70a5c4f769d221d28`, diadaptasi sebagai React/SVG
  berstruktur tanpa iframe/HTML bundle penuh. Refinement akhir clip 0.6 unit
  dan stroke/fon yang diluluskan dikekalkan dalam checkpoint.
- **Rasional:** Fidelity kepada reka bentuk masjid sedia ada dan renderer yang
  boleh digunakan dengan model data baharu.
- **Kesan:** Notice, upstream copyright dan GPL-3.0 disertakan. **Keputusan
  pre-production terbuka:** sahkan kewajipan GPL bagi derivative/combined
  application, Corresponding Source dan hak aset sebelum pengedaran produksi.
  Approval checkpoint tidak mengesahkan lesen gabungan telah diselesaikan.

Fasa 5.3A provenance follow-up (3 October 2026): remote main was freshly checked
at 378b1bbb4084b4f7b6c55ac70a5c4f769d221d28. Native button/editor/local-file behaviour
was independently implemented; no substantial new legacy editor code was pasted.
Changes to the existing adapted renderer/layout retain GPL notices. New special
artwork is independently authored demo material. The combined-application decision
above **remains unresolved**; this is not a legal clearance. See the updated
[provenance notice](third-party/JADUAL-KULIAH-NOTICE.md) and [audit](LECTURE-GENERATOR-UX-RECOVERY.md).

## D19 — Oktober sebenar sebagai QA read-only

- **Tarikh/bukti:** 2026-10-01, arahan pengguna dan
  [SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md).
- **Keputusan:** Hanya bulan `2026-10` daripada snapshot version 2 digunakan
  secara sementara; symbolic portraits diresolve daripada bundle upstream.
- **Rasional:** Mengesahkan fitting dan fidelity dengan nama/topik sebenar.
- **Kesan:** 34 sesi lulus import, tiada unresolved portrait, clipping/overflow
  Oktober diselesaikan. Publish kekal disabled. Tiada JSON sebenar, portrait QA
  tambahan atau jadual dimigrasikan ke Sanity; tiada inferens bulan berikutnya.
  Synthetic long-copy, print proof dan cross-platform fonts kekal had prototype.

## D20 — Preparation migration deterministik, draft-first dan create-only

- **Tarikh/bukti:** 2026-10-01, arahan Fasa 4.3A; commit `ea8dd09`,
  checkpoint `phase-4.3a-migration-dry-run`.
  [SANITY-MIGRATION.md](SANITY-MIGRATION.md), `scripts/sanity-migration/`.
- **Keputusan:** 43 dokumen daripada source public diluluskan, ID tetap berasaskan
  slot/source, 50 fail imej tanpa recompression. Default dry-run; production
  upload/write/publish dilarang dalam 4.3A. Ketetapan ID deterministik mengikuti
  arahan eksplisit pengguna, walaupun panduan import umum Sanity mengutamakan ID generated.
- **Rasional:** Audit boleh diulang, vacancy/multiple positions dipelihara,
  dan source/editor content tidak ditindih secara senyap.
- **Kesan:** Mod write kelak hanya create drafts dengan target tepat,
  fingerprint dan token server; preflight raw/non-CDN sebelum upload dan sebelum
  atomic create. Payload identical di-skip; unexpected content menghentikan
  writes. Tiada replace/delete/purge/publish. Aset reuse melalui hash dan _id
  sebenar hasil query/upload. Upload terdahulu boleh tinggal jika write gagal;
  tool tidak memadamnya.
- **Boundary:** Short name tiada source; logo kekal website. Mock homepage dan
  semua lecture/demo/QA/legacy dikecualikan. Frontend CMS integration dan
  penerbitan kuliah memerlukan scope berasingan. Kelulusan draft migration
  Fasa 4.3B direkodkan dalam D21.

## D21 — Penutupan migration production sebagai draft sahaja

- **Tarikh/bukti:** 2026-10-02, arahan pengguna dan authenticated raw read-back
  project `2o95jmms` / dataset `production`; [SANITY-MIGRATION.md](SANITY-MIGRATION.md).
- **Keputusan:** 43 draft, 50 aset imej unik, 0 konflik; semua sasaran
  `skip-identical`. Tiada migrated content published. Review ini tidak
  menjalankan write/upload semula; draft tidak diedit semasa QA Studio.
- **Rasional:** Sahkan payload, imej, susunan dan references sebelum sebarang
  penerbitan atau frontend integration yang memerlukan kelulusan berasingan.
- **Kesan:** Laporan write menggunakan `WRITE-DRAFTS` dan tahap preflight,
  bukan label `DRY-RUN`. Guard target/fingerprint/token, conflict detection
  dan create-only transaction tidak diubah. Public frontend kekal local/static;
  Lecture Generator Publish disabled. Fasa 4.3C dan Fasa 5 belum bermula.

## D22 — Controlled Publication terhad kepada set migration yang diluluskan

- **Tarikh/bukti:** 2026-10-02, arahan eksplisit Fasa 4.3C dan authenticated
  preflight; [SANITY-PUBLICATION.md](SANITY-PUBLICATION.md).
- **Keputusan:** Publish hanya 43 deterministic draft 4.3B ke
  `2o95jmms/production`. Manifest mengikat ID/type/revisi/aset dan pelan yang
  diluluskan; confirmations wajib. Supported Actions API, atomic absence/revision
  guards, API dry-run terlebih dahulu, tiada silent overwrite/automatic retry.
- **Kesan:** Tool migration create-only asal kekal. Public frontend local/static,
  mock/lecture/QA/legacy dikecualikan; Lecture Generator Publish disabled.
- **Status:** Selesai. Linux melakukan publication; Work melakukan read-back/QA
  dan repository closeout. 43 published, 0 draft, 50 aset, 55 references,
  0 konflik. Checkpoint `phase-4.3c-controlled-publication`; Fasa 5 belum bermula.
- **Insiden/fix:** Percubaan awal HTTP 400 kerana `mtu-4.3c-*` mengandungi dot;
  tiada mutation menurut verifikasi Linux pengguna. Prefix `mtu-4-3c-` dan
  local ID regex guard digunakan; atomic retry operator berjaya. Safety gates,
  manifest dan kedua-dua fingerprint diluluskan tidak berubah.
- **Preview:** `sanity.config.ts` memilih `items.length` berasingan daripada
  thumbnail. Fix Studio-only mengelakkan array path object yang menghasilkan
  false “0 foto”; fields/validations/schema source/public rendering kekal.

## D23 — Published public reads dengan bounded freshness dan explicit fallback

- **Tarikh/bukti:** 2026-10-02, arahan Fasa 5.1 dan kelulusan checkpoint selepas
  review; `phase-5.1-sanity-public-content`.
  [SANITY-PUBLIC-CONTENT.md](SANITY-PUBLIC-CONTENT.md).
- **Keputusan:** Lima route approved sahaja membaca published perspective
  melalui server-only typed queries/adapters. Next cache/route revalidation
  300 saat, Sanity non-CDN API, tiada token, webhook atau mutation endpoint.
- **Rasional:** Source editorial hidup tanpa mengubah visual/layout approved;
  API requests dikawal dan CMS changes muncul selepas request-driven refresh.
- **Kesan:** Temporary network/timeout/408/429/5xx menggunakan local snapshot
  approved dengan server warning. Schema/reference/config/access mismatch tidak
  menjadi fallback. CMS photos diresize sekali pada Sanity CDN tanpa crop/upscale;
  logo asal dan local fallback image rendering dikekalkan. Homepage mock dan
  Lecture Generator Publish disabled; tiada admin/operasi/campaign/payment scope.
- **Status:** Fasa 5.1 siap dan diluluskan; commit/push checkpoint dibenarkan
  selepas final validation. Fasa 5.2 belum bermula.

## D24 — Website curated dan Facebook melalui review manusia

- **Tarikh/bukti:** 2026-10-03 (+08:00), arahan pengguna Fasa 5.2A;
  [EDITORIAL-CONTENT-PREPARATION.md](EDITORIAL-CONTENT-PREPARATION.md).
- **Keputusan pengguna:** Facebook kekal saluran pantas/social; website rasmi
  kekal curated, structured dan mudah dirujuk. Tiada full automatic mirror
  atau direct Facebook-to-website publishing.
- **Klasifikasi:** Official notice → Pengumuman; upcoming program/campaign
  atau ongoing Dapur Zohor Barakah → Program/inisiatif; completed event/visit/
  appreciation/report → Berita & Aktiviti. Kuliah kekal dedicated module.
  NCR ialah evergreen public information; Sumbangan/QR ialah presentation
  public khusus, bukan news atau payment gateway.
- **Workflow masa hadapan:** Facebook Page → import/inbox → suggested category
  → human source/fact/category review → Sanity draft → manual publish → website.
  #MTUPengumuman/#MTUProgram/#MTUBerita/#MTUKuliah hanya category hints;
  hints tidak memberikan kebenaran publish. Menu harian dan routine livestream
  tidak automatik menjadi berita kekal.
- **Status:** Polisi ini dipersetujui pengguna. Placement/schema/copy/asset
  proposals masih untuk review. Tiada automation, source import, asset upload,
  draft creation atau publication dilaksanakan dalam preparation ini.

## Cara menambah rekod

Tambah ID seterusnya bersama tarikh, status, bukti, rasional dan kesan. Jika
keputusan berubah, nyatakan keputusan yang diganti; jangan padam provenance lama.
Pisahkan cadangan/prototype daripada keputusan yang telah diluluskan.

## D25 — Fasa 5.2A source-backed public information architecture
3 Oktober 2026: user authorizes implementation, but no Sanity asset upload,
mutation, draft, publication, commit or push. Keep Program scheduled/ongoing minimal;
legacy means scheduled, ongoing needs no invented datetime/recurrence/end date.
NCR is evergreen optional settings → /hubungi#nikah-cerai-ruju. General donation
is optional settings → /#donations, full unoptimized branded general artwork only.
Dapur-specific QR stays separate; QR-only purpose remains owner-unconfirmed.
Missing optional objects fabricate nothing; malformed objects are errors.
Historical 4.3 manifest is immutable. Current verification and historical publication
tests have separate purposes; new schemas cannot reuse old publication approval.
Genius Aulad is the recommended first News. Qiam source is an invitation and
cannot substantiate a completed Qiam/Bubur Asyura report. Website publishedAt
must not substitute event/source dates. Exact batch requires owner review.
No filler Pengumuman, monthly kuliah, Facebook automation, payment gateway,
Lecture Generator changes or Fasa 5.3 work.

## D26 — Owner-confirmed facts and exact first draft-only boundary
3 October 2026: owner approves Fasa 5.2A architecture/content preparation,
both NCR names/phones under **Penolong Pendaftar Nikah, Cerai & Ruju’ (NCR)**,
Dapur launch/operating/price/refill/payment facts and the proposed general
donation presentation. Dapur remains ongoing with no invented end date.
Genius Aulad is approved as the first News candidate, but required website
publishedAt has no source/explicit approval. Exclude its draft and image until
the date is resolved; source Facebook date remains separate provenance.
Qiam/Bubur Asyura stays HOLD; no source-to-completion inference.
The exact dry-run proposes only `drafts.program-dapur-zohor-barakah`,
`drafts.siteSettings` and three unchanged original assets S01/S02/S03.
Published singleton revision and every existing field are frozen in
[the JSON review plan](EDITORIAL-DRAFT-SEEDING-DRY-RUN.json); raw read found
no existing target drafts or editorial documents. Recheck before future uploads
or creates and stop on drift/collisions. Never overwrite a draft or patch published
settings. Draft creation/upload needs explicit approval of this exact dry-run;
publication and Git checkpoint remain separate and unauthorized.

Subsequent explicit owner authorization allowed execution of exactly that draft-only
batch. On 2026-10-03 05:03:06 UTC, both drafts were created. Authenticated read-back
confirmed 2 total drafts, 3 approved assets added (53 total), 43 published documents
and all 50 pre-existing assets unchanged, exact payloads and 3 resolved references.
Current schema validation has 0 errors/warnings. Published program/announcement/newsPost
counts remain 0. General QR source and Sanity SHA-1 match approval; CDN PNG container
encoding differs but all decoded pixels match. See [execution result](EDITORIAL-DRAFT-SEEDING-RESULT.md).
Stop for Studio review; no publication/commit/push or Fasa 5.3.

## D27 — Owner-approved controlled publication and Fasa 5.2A checkpoint

Fasa 5.2A completed pada 3 Oktober 2026. Checkpoint: `phase-5.2a-editorial-public-information`; resolve tag untuk hash commit akhir.
Published Sanity: 0 drafts, 1 Program, 0 Announcement, 0 News, 53 image assets.
Dapur Zohor Barakah ialah Program pertama, active dan ongoing tanpa tarikh tamat rekaan.
NCR evergreen dan general mosque DuitNow QR published melalui siteSettings.
Typed server-only read layer kekal published-only, token-free dan revalidate 300 saat.
Healthy empty Announcement/News disengajakan; outage tidak mencipta editorial/QR/contact fakta,
dan malformed/auth/query failures kekal visible errors. Mock editorial tidak diseed.
Genius Aulad pending required publishedAt; Qiam/Bubur Asyura HOLD.
Dapur-specific QR kekal berasingan; QR-only asset excluded/unclassified.
Facebook curated/manual, tiada importer. Jadual Kuliah local/mock;
Lecture Generator Publish disabled dan Fasa 5.3 belum bermula.
Historical Fasa 4.3 manifests, approval payloads dan mutation guards kekal immutable.

The historical draft-only boundaries in D25/D26 were superseded only by subsequent explicit owner approvals. Publish only the two reviewed documents, then the final donation copy via a single settings draft. No additional editorial seeding. Historical publication fingerprints/approval files remain locked; use current-state verification for the intentional optional settings extensions. Evidence: [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md).

## D28 — Donation copy remains CMS-led with a presentation eyebrow

Final public donation copy:

- Presentation eyebrow: **Salurkan sumbangan anda**.
- CMS `donationInfo.heading`: **Moga menjadi saham akhirat dan rezeki diberkati**.
- CMS `donationInfo.copy`, paragraph 1: **Sumbangan anda akan digunakan untuk pengimarahan masjid, saguhati penceramah, pembangunan & pembaikan masjid, alatan & kemudahan para jemaah.**
- CMS copy, paragraph 2: **Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.**

Copy uses the existing text field with a blank-line paragraph separator. No decorative CMS field added.
The reminder is a separate 14px paragraph; description stays 16px. Existing heading sizes,
navy/gold layout, QR artwork/reference/alt/caption and both actions remain intact.

Only donationInfo.heading/copy change remotely; preserve every other settings field. QR source/reference/recipient/NCR and Dapur are untouched. Full original general QR is separate from Dapur payment QR; no gateway or financial workflow is introduced.

## D29 — News event provenance, CMS image and BULETIN MTU

eventDate is optional Sanity date for the actual activity; publishedAt remains required website publication datetime and sorting/eligibility metadata. Public label uses eventDate when present, otherwise publishedAt in Kuala Lumpur timezone. Source Facebook date stays documentation-only. Reject malformed calendar dates, broken image references and missing alt without hiding them as fallback. Missing image keeps the established MTU card.

The News presentation label is BULETIN MTU with the exact owner-approved section description; no schema field or global terminology rewrite is added. Curated/manual Facebook workflow remains unchanged.

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

## D30 — Calendar-first lecture editing with reversible date posters

The main monthly poster is the primary date navigation surface, with native button
keyboard semantics and a secondary collapsed date list. A full special poster is
a manual date-level visual override, never a recurrence rule and never an implicit
session deletion. Remove reveals stored sessions; explicit confirmed restore returns
only that day to current rules. Owner refinement changes full posters to edge-to-edge
cover by default with an overlaid date badge, visible crop warning, explicit contain
alternative and optional top/center/bottom alignment. Original artwork bytes stay unchanged. Same artwork can be selected for multiple dates. Keep monthly
Sanity snapshots and existing speaker name/photo snapshots. Mixed mode and bulk copy
are deferred. Small-screen editing rows may grow; print/export geometry is preserved.

Fasa 5.3A **completed dan owner-approved pada 4 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.3a-lecture-generator-ux`; resolve tag untuk commit akhir.
Baseline main/tag: `f4b473b1df54af695599a735a1fb2d1c5d9fd372` / `phase-5.2b-first-news`.
Klik petak poster sebenar memilih tarikh; Enter/Space, fokus dan selected state tersedia.
Poster khas full kini full-bleed dengan cover default, contain alternatif dan posisi atas/tengah/bawah; badge tarikh overlay, sesi asal kekal tersimpan.
Fixture 24/25 berkongsi satu artwork demo. Save Draft/Publish disabled; tiada production
Sanity writes, lecture migration, public /kuliah atau homepage lecture feed. Git checkpoint sahaja; tiada production lecture writes.
Production kekal 45 published documents, 0 drafts, 1 Program, 0 Announcement, 1 News,
55 image assets dan 0 lecture documents. Fasa 5.3B belum bermula.

[Full audit and future persistence contract](LECTURE-GENERATOR-UX-RECOVERY.md).

## D31 — Adaptive poster-level infaq in genuine unused cells

4 October 2026: recover the observed legacy donation-panel behavior with independently implemented shared SVG geometry. A leading or trailing group requires at least two actual no-date cells; choose the larger eligible group and prefer leading on ties. A one-cell group never qualifies, even when the opposite eligible group is used. Never move dates to make panel space, consume valid empty dates or synthesize lectureDay content. Respect the established compact layout rather than its raw calendar offset.

Keep the complete white merged group, but center QR/copy within at most three columns for large 4–6 groups. Owner-approved on 4 October 2026: the centered three-column cap is locked. Toggle defaults ON; upstream default was OFF. Source QR is unchanged, uncropped, contain/meet, with quiet zone and no overlay/badge. Monthly schema stores optional showInfaq only; future persistence reuses mosque-wide QR configuration. Save/Publish remain disabled and 5.3B is not started. The owner now authorizes the supplied QR-only source for local lecture-poster review. Historical 5.2A S04 exclusion/unclassified evidence remains unchanged; this is no production asset upload or reclassification.

## D32 — Authenticated manual lecture draft persistence with a first-write gate

4 October 2026: one stable lectureMonth-YYYY-MM identity, embedded real-date
snapshots and no per-session/day document. Authenticated Studio client; raw reads
prefer draft, then published, then published-rule defaults generated locally.
Manual Save Draft validates/serializes a complete month and issues only guarded
draft actions with original-asset hash reuse and exact authenticated read-back.
Retain draft/published revisions, reject conflicts visibly, preserve unsaved local
state and require explicit reload/review; no autosave, auto-merge or automatic retry.

The implementation is ready for review, not permission to write. Approval is
compiled unset; before the first production upload/save, the owner must approve
the complete fingerprinted plan. October source recommendation is the independently
QA'd owner snapshot, not Studio demo. No speaker/rule seeding in that first batch.
Optional photoLayout preserves approved existing portrait settings. Persist only
showInfaq; resolve general mosque QR at runtime and omit it safely when absent.

Publish disabled; no production mutations, public kuliah/feed, commit or push.
The initial browser-policy block is historical; fresh refinement Studio/export
QA subsequently passed as recorded in the refinement report.
D18 GPL/combined-application decision and existing provenance notices are unchanged.
[Architecture, guards, exact plan and validation limits](LECTURE-DRAFT-PERSISTENCE.md).

## D33 — English operational editor and separate compact mosque QR

4 October 2026 owner refinement: English-first operational Studio instructions,
labels, helpers, errors and states; retain natural Malay mosque terms and all
poster-facing Malay output. Center weekday painted bounds inside unchanged pills;
font family/27px/900 and seven-column geometry stay fixed in preview/export.

Use optional donationInfo.compactQr (image/reference/alt, square PNG/JPG/WebP,
no crop/hotspot) for Jadual only. Resolve published settings; absent/unusable QR
omits panel with a warning. Never fall back to branded primaryQr. Public Donation
continues using full branded primaryQr unchanged. Months store showInfaq only.
Keep D31 adaptive placement and three-cell cap; original QR bytes, quiet zone,
contain and no overlays/recolour are mandatory.

QR setup needs a separately approved original upload + settings draft preserving
all existing fields, followed by review and separate settings publication approval.
This implementation authorizes no mutation. The October fingerprint does not
authorize QR setup. Month save remains gated; Publish Jadual disabled.
D18 GPL/combined-application decision and historical provenance remain unchanged.
[Exact prerequisites and QA](LECTURE-UI-COMPACT-QR-REFINEMENT.md).

## Fasa 5.3B — first October draft saved; owner review pending

4 October 2026 (+08:00): the owner explicitly approved the corrected October
candidate after the original fingerprint guard failed. Controlled execution added
only the reusable `donationInfo.compactQr` to published `siteSettings`, then saved
`drafts.lectureMonth-2026-10`: 30 date entries, 34 sessions and 29 original portraits.
Published settings revision: `chGo6kzbOkh09ebDsGFF22`.
October draft revision: `SSdKRdF7e0XIFT3zzNP2ab`.

Authenticated inventory: 1 draft, 0 published lecture documents, 0 speakers/rules,
85 image assets, 1 Program, 0 Announcement and 1 News. Primary branded QR, public
donation output, NCR and unrelated documents remain unchanged. October stores
only `showInfaq`; the compact QR resolves from published mosque-wide settings.
Studio refresh/reopen loads the identical real draft; desktop/mobile and actual
PNG/PDF exports pass. The operational UI stays English-first; poster stays Malay.

Original failed plan/audit are preserved unchanged. Six owner-approved Unicode
corrections restored fingerprint
`906611b8069b1c07b105da950be4f6b7cedd6d1a79a5357e912faee6e3264bb8`;
no production mutation occurred before that correction. The approved replacement
is [LECTURE-FIRST-SAVE-APPROVED.json](LECTURE-FIRST-SAVE-APPROVED.json).
The candidate's original review-required annotation is preserved as history;
the owner's later explicit approval is recorded in the execution record.

Execution used the authenticated Sanity connector with the exact approved payload.
The generic Studio save approval remains unset; this does not enable unreviewed
future writes. Publish Jadual remains disabled. No lecture publication, public
Kuliah integration, later phase, commit, push or Fasa 5.3B checkpoint.
[Execution and audit evidence](LECTURE-FIRST-SAVE-EXECUTION.md).

## Fasa 5.3B operational closeout — 4 October 2026 (+08:00)

The owner authorized generic authenticated manual Studio saves. The actual button validated and read back October unchanged, without upload or mutation; revision stayed SSdKRdF7e0XIFT3zzNP2ab. Create/update paths retain optimistic revision guards, with conflicts tested in a controlled simulator. Real draft accessibility replaces stale demo wording. Publish remains disabled; October remains unpublished. Compact QR stays mosque-wide and primary public QR unchanged. The six Unicode corrections, original guard failure and immutable audit remain recorded. GPL provenance and unresolved licensing decision remain intact. Checkpoint: `phase-5.3b-lecture-draft-persistence`. No subsequent/public lecture phase started. [Closeout evidence](LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.md).

## Fasa 5.3C — publication implementation / read-only plan, 4 October 2026 (+08:00)

Eligible saved, unchanged months can open an explicit publication confirmation. Whole-month schema/reference validation and draft/published revision guards are rechecked before the supported Sanity publish action. First publication guards absence of the published target atomically; later updates guard its revision. Authenticated read-back determines success, including lost-response recovery. Conflicts/uncertain responses preserve editor state, stop retries and require reload/review. Double-submit is blocked. Exact source Unicode and alt text are covered by regression tests. The real confirmation was opened/cancelled; no production mutation or upload occurred. October remains draft-only. No public /kuliah, homepage lecture feed, commit or push. [Exact plan](LECTURE-FIRST-PUBLICATION-DRY-RUN.json); [implementation/QA](LECTURE-PUBLICATION.md).

## Fasa 5.3C controlled publication closeout — 4 October 2026 (+08:00)

Owner approval authorized only the exact October publication. Supported atomic
Sanity actions and authenticated read-back produced `lectureMonth-2026-10`,
revision `zVZDfWLj75qTdy5eh9rsNA`; its draft was removed as observed.
Current inventory is 0 drafts / 1 published lecture month / 85 images /
0 lectureSpeaker / 0 lectureRule, with 30 stored dates and 34 sessions.
All 29 portraits resolve, showInfaq remains true and content fingerprint remains
`d18eb8c75642d32065fe509e9ba5f219a7d68c5989c7fc6cf4b538cb5fa547b6`.

Publish requires explicit confirmation and fresh saved-draft schema, asset,
revision and content checks. Stale/conflicting drafts stop publication; Publish
never autosaves. Authenticated read-back determines the final Published state.
The UI did not retain the transaction ID; it is not invented or inferred.
The compact Infaq QR stays mosque-wide; primary public donation QR/settings,
all unrelated revisions and assets remain unchanged.

Original Unicode/fingerprint guard failure and corrected replacement evidence
remain immutable. GPL/provenance notices and the unresolved combined-application
licensing decision remain unchanged. Public /kuliah and homepage lecture
integration have not started. Owner-approved desktop/mobile and PNG/PDF QA pass.
Checkpoint: `phase-5.3c-controlled-lecture-publication`.
[Final validation](LECTURE-PUBLICATION-CLOSEOUT.md);
[immutable publication execution](LECTURE-FIRST-PUBLICATION-EXECUTION.md).


## Fasa 5.3D public lecture decisions — 4 October 2026 (+08:00)

Public URLs are `/kuliah` (current published month, otherwise latest with notice)
and `/kuliah/YYYY-MM` (shareable published snapshot). Typed server-only token-free
published reads revalidate every 300 seconds. No schedules are invented during
absence/outage; malformed/auth/query failures remain errors. Shared poster/export
code is reused with an official presentation that removes admin labels. Full
special posters hide preserved sessions in both artwork and public text; text
exposes their alt description/artwork link. A restricted GET-only same-origin
image endpoint serves only referenced published assets for CORS-independent
downloads. Pure poster definitions are separated from editor fixtures so the
public browser bundle excludes demo/save/publish workflows.

The D18 GPL/combined-application decision remains unresolved and unchanged.
Existing renderer/layout notices are retained; no new reference-repository
implementation is copied. No Sanity mutation or homepage lecture integration.
Fasa 5.3D is complete after owner approval and final QA. Unavailable previous/next
controls are hidden; the centred current-month link remains. Published neighbours
appear naturally when available. Mobile inspection uses an internally pannable
landscape poster dialog, with keyboard panning, Tutup and Escape.
Public exports use the published month and preserve Studio's default behaviour.
Checkpoint: `phase-5.3d-public-kuliah`.
[Full public contract and QA](PUBLIC-LECTURES.md).

## Fasa 5.3E homepage upcoming Kuliah — 4 October 2026 (+08:00)

Use the existing published month index/query/validation path rather than a
second CMS query architecture. Sort candidate published months chronologically
and select the earliest meaningful date on/after today's Asia/Kuala_Lumpur date.
Include all sessions on the selected date; never infer exact clock order,
completion, countdowns or future month data from local fixtures. Today is labelled
Disenaraikan untuk hari ini. A full special poster hides its underlying sessions
and exposes its approved public description. A failed candidate month is not
skipped, because it could contain the nearest date.

No future date yields a restrained full-schedule link, not the latest old session.
No published months and temporary outage have separate Malay messages.
Malformed/auth/query/reference failures propagate as errors. Homepage revalidation
stays five minutes. No CMS mutations or Studio changes; awaiting owner review.
[Contract and evidence](HOMEPAGE-LECTURES.md).

## Fasa 5.3E final wording — 5 October 2026 (+08:00)

Owner-approved public copy: **PENGAJIAN DI MASJID / Kuliah terdekat**.
Description: **Pengajian terdekat berdasarkan jadual yang diterbitkan oleh pihak masjid.**
Same-day label: **Hari ini**. This supersedes the initial 4 October wording;
date-only selection cannot imply a same-day session is still next. Selection,
two-session/special-poster behaviour, cross-month handling and `/kuliah` CTA remain
unchanged. Final desktop/mobile QA, all 243 tests, lint/build, current-state
validation and route checks pass. Authenticated comparison confirms all production
revisions unchanged: 143 documents, 0 drafts, 1 published lecture month, 85 images;
October revision `zVZDfWLj75qTdy5eh9rsNA`, 30 dates / 34 sessions and the approved
fingerprint remain unchanged. Historical evidence is preserved.
Checkpoint: `phase-5.3e-homepage-lecture`. Fasa 6 has not started.
