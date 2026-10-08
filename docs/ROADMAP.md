# Roadmap Projek

## Fasa 7.0 — Campaign Engine Architecture Lock complete / owner-approved

8 October 2026 (+08:00). [Campaign Engine architecture](CAMPAIGN-ENGINE-PLAN.md)
is owner-approved. Required global/module flag OFF returns public 404; closed
admission cannot reopen and archived is terminal; admin audit is safe campaign-only,
staff has no audit history and foundation/security audit remains super_admin-only.
Documentation checkpoint: `phase-7.0-campaign-engine-architecture`; resolve this
tag for the actual checkpoint commit. Overall Fasa 7 is **in progress/not complete**.
No implementation, deployment or hosted resource change. Fasa 8+ remains unstarted.

### Pecahan Fasa 7

| Langkah | Fokus | Status |
| --- | --- | --- |
| **7.0** | Campaign Engine Architecture Lock | **Complete / owner-approved** — documentation checkpoint `phase-7.0-campaign-engine-architecture` |
| 7.1 | Database schema + RLS | Belum bermula |
| 7.2 | Feature flag service | Belum bermula |
| 7.3 | Campaign lifecycle + scheduling | Belum bermula |
| 7.4 | Admin campaign management | Belum bermula |
| 7.5 | Public `/kempen/[slug]` gating | Belum bermula |
| 7.6 | Audit, security and regression QA | Belum bermula |
| 7.C | Owner-approved Campaign Engine implementation checkpoint | Belum bermula |

Fasa 6 historical evidence/checkpoints below are preserved. Their Fasa 7
not-started statements describe those earlier checkpoint boundaries.

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

## Historical checkpoint — Fasa 6.1B-1 hosted staging

7 October 2026 (+08:00), from HEAD 4ab521b484d034e102ae405476c12183554e61f4.
Dedicated Supabase staging azypohqpupphapasweln (Singapore) is linked; the unchanged
20261006000100 migration, hosted catalog/grants/RLS, private-hook wiring and genuine
negative GoTrue admission pass. 36 hosted HTTP/SQL/contract cases pass with explicit
synthetic boundaries. No Auth users/profiles/invites/audit fixture rows remain.

B-1 is checkpointed at 79a87e97c16573968eb4c57d0b19e421d6f7fba0, tag
phase-6.1b1-hosted-supabase-staging. First Vercel deployment is READY:
dpl_DT9F1qXyZYbpKQMUHGSwzihYeDVn, stable alias
https://masjid-mtu-admin-staging.vercel.app. CLI verifies eight Production env
names and no privileged credential; source is the clean canonical local repo,
with no Git/fork connection. Connector remains 403; CLI access works.
8/8 HTTP checks, 5/5 anonymous browser checks and 30 deployed JS chunk scans pass;
runtime logs contain no error/fatal/5xx. Google remains disabled; no real owner,
production resource or 6.1B-2 work. Fasa 6.1 stays open. Runtime/migration unchanged;
.vercelignore excludes local caches/credential/build files.

[Hosted results and exact runtime/OAuth values](ADMIN-FOUNDATION-STAGING-VERIFICATION.md);
[remaining staging checklist](ADMIN-STAGING-CHECKLIST.md).

## Historical checkpoint — Fasa 6.1A full local verification

6 October 2026 (+08:00). The owner approved the existing desktop/mobile Admin
Foundation UI. Real local Supabase start/reset, PostgreSQL/Auth schema,
PostgREST/RLS/grants, guarded RPCs, private hook invocation, genuine TOTP/AAL2,
AMR refresh/step-up and real Next SSR/DAL verification pass. No unresolved local
blocker. Checkpoint: `phase-6.1a-local-admin-foundation` (resolve tag for commit),
from baseline `91117322f7ac81043bbe9d952811dfbe02d8ccde`.

All 327 automated tests pass (30 real local, 28 supplementary SQL, 8 policy,
18 browser, 243 public/Studio/Kuliah), plus lint, TypeScript, production Webpack
build, types, route/export/bundle and documentation checks. Google identity
fixtures are synthetic; genuine Google OAuth/positive admission and hosted
session/plan/recovery checks still require staging. **Fasa 6.1 remains open.**
No hosted resources, production provisioning, real owner or operational modules.
Provider session termination remains an explicit staging gate; live membership
disable/revoke already denies still-valid JWTs.

[Real local evidence](ADMIN-FOUNDATION-LOCAL-VERIFICATION.md);
[implementation/workflow](ADMIN-FOUNDATION-LOCAL.md);
[prepared staging checklist](ADMIN-STAGING-CHECKLIST.md).

Earlier checkpoint sections below are historical records.

## Historical checkpoint — Fasa 6.0 completed

6 October 2026 (+08:00). Fasa 0–5 is complete; baseline
`dff2327939060dc79641c6014961f7055f777279`. Fasa 6.0 architecture is
owner-approved and closed: invite-only `/admin` uses Supabase Auth/PostgreSQL, separate from
Sanity `/studio`. Google identity requires live active membership; the owner is
the sole initial super_admin and requires Google + Supabase TOTP/AAL2. Access
management stays super_admin-only in 6.1, invitations last 7 days and admin/staff
may initially use AAL1. Privileged step-up targets around 10 minutes where
supported; session timeouts remain targets pending the selected hosted plan.
Audit begins at the first mutation, with proposed 12-month retention. Recovery
uses primary + backup TOTP, owner-only Vaultwarden and independent project-owner
recovery. Local + hosted staging is sufficient for 6.1; production remains a
separate future environment requiring explicit owner provisioning approval.

[Approved plan and implementation gates](ADMIN-FOUNDATION-PLAN.md).
Checkpoint: `phase-6.0-admin-foundation-architecture` (resolve tag for final commit).
Fasa 6.1 has not started. No runtime/configuration, database, Supabase remote
resources or Sanity changes. Qurban, Ramadan, BKK, payment, receipt, registration
and finance modules remain out of scope. Earlier phase sections are historical records.

## Fasa 5.3E — completed

5 October 2026 (+08:00). The homepage now shows one nearest published Kuliah
date through the existing server-only lecture read boundary. Selection includes
today in Malaysia, displays both sessions on a date and checks later published
months. Empty/outage states never use mock sessions. The full monthly poster stays
on `/kuliah`. Final owner-approved wording uses **Kuliah terdekat** and **Hari ini**
without claiming exact session completion. All 243 tests, lint/build, current-state
validation and route checks pass. Production is unchanged. Checkpoint:
`phase-5.3e-homepage-lecture` (resolve the tag for the final commit).
Fasa 6 has not started.
[Selection rule and QA](HOMEPAGE-LECTURES.md).
Earlier checkpoint sections remain historical records.

## Fasa 5.3D — completed

4 October 2026 (+08:00). The read-only public `/kuliah` and bookmarkable
`/kuliah/YYYY-MM` views are implemented using published Sanity only, with
five-minute revalidation, shared official poster/PNG/PDF and accessible Malay
schedule. Kuliah is in desktop/mobile navigation. Production remains unchanged;
homepage lecture integration has not started. Checkpoint:
`phase-5.3d-public-kuliah` (resolve the tag for the final commit).
Final 375/430px schedule/viewer QA and real public PNG/PDF actions pass.
Unavailable month neighbours are hidden. All 229 tests and final validation pass.
[Architecture and verification](PUBLIC-LECTURES.md). Earlier checkpoint sections below
remain historical records.

Selesaikan dan semak setiap fasa sebelum memulakan fasa seterusnya.

| Fasa | Fokus | Status |
| --- | --- | --- |
| **0** | Project Foundation | **Siap** |
| **1** | Design System | **Siap** |
| **2** | Public Homepage | **Siap** |
| **3** | Public Pages | **Siap** |
| **4** | Sanity CMS | **Siap** — checkpoint 4.3C |
| **5** | Dynamic Content | **Siap** — 5.1/5.2/5.2A/5.2B dan 5.3A–5.3E siap, termasuk public `/kuliah` (5.3D) dan homepage lecture integration (5.3E) |
| **6** | Admin Foundation | **6.0 dan 6.1 complete, owner-approved**; 6.1A/6.1B-1/6.1B-2/6.1B-2R complete; checkpoint `phase-6.1-admin-foundation-complete`; no production |
| **7** | Feature Flags & Campaign Engine | **In progress / not complete** — 7.0 architecture complete/owner-approved; 7.1–7.6 dan 7.C belum bermula |
| 8 | Qurban MVP | Belum bermula |
| 9 | Payment & Receipt | Belum bermula |
| 10 | Ramadan Iftar | Belum bermula |
| 11 | Security & Production Hardening | Belum bermula |
| 12 | Production Launch | Belum bermula |

## Pecahan Fasa 6

| Langkah | Fokus | Status |
| --- | --- | --- |
| **6.0** | Admin architecture, invite-only access, MFA, RLS and environment plan | **Siap dan owner-approved** — `phase-6.0-admin-foundation-architecture`; dokumentasi sahaja |
| **6.1** | Generic authenticated admin foundation | **Complete, owner-approved** — local and hosted staging foundation verified; `phase-6.1-admin-foundation-complete`; no production |
| **6.1A** | Full local Supabase verification | **Complete** — real PostgreSQL/Auth/PostgREST, hook/TOTP/SSR and all 327 tests passed; `phase-6.1a-local-admin-foundation` |
| **6.1B-1** | Hosted staging migration and Auth hook | **Complete** — hosted migration/hook verified, Vercel READY; `phase-6.1b1-hosted-supabase-staging` |
| **6.1B-2** | Real Google OAuth and hosted Auth/MFA verification | **Complete** — genuine Google admission, AAL1/AAL2 and hosted MFA; final recovery/security gates resolved in 6.1B-2R; accepted separate-identity test limitations documented |
| **6.1B-2R** | MFA recovery patch and final hosted closeout | **Complete** — replacement Primary and retained Backup verified; refresh-only recency/direct API/session checks passed; all test sessions removed, identity/factors and 12 audits retained |

Fasa 7 remains **belum bermula**; this checkpoint does not authorize starting it.
Fasa 8+ operational module choices remain subject to AJK requirements and owner
approval; existing Qurban/Ramadan rows are roadmap candidates, not an instruction
to implement them next. No module workflow is designed in 6.0.

## Historical checkpoint — Fasa 5.3C completed

Owner-approved controlled October publication is complete. The first published
month has 30 dates / 34 sessions; production has 0 drafts / 1 published lecture
month / 85 images, and no lectureSpeaker or lectureRule documents.
Checkpoint: `phase-5.3c-controlled-lecture-publication`.
Publication requires explicit confirmation and fresh revision/content guards;
stale drafts stop, and Publish Jadual never autosaves.
[Closeout verification](LECTURE-PUBLICATION-CLOSEOUT.md);
[immutable execution](LECTURE-FIRST-PUBLICATION-EXECUTION.md).
**Public /kuliah and homepage lecture integration have not started.**

## Pecahan Fasa 5

| Langkah | Fokus | Status |
| --- | --- | --- |
| 5.1 | Published public read layer: Profil, Organisasi, Surau, Galeri, Hubungi | **Siap** — diluluskan; `phase-5.1-sanity-public-content`, cache 5 minit dan explicit fallback |
| 5.2 | Homepage Pengumuman, Program, Berita & Aktiviti | **Siap** — manual visual approval; `phase-5.2-homepage-editorial-integration`; pada checkpoint asal 0 published documents bagi setiap jenis |
| 5.2A | Source reconciliation dan public information architecture | **Siap** — published ongoing Dapur, evergreen NCR, general QR dan final donation copy; `phase-5.2a-editorial-public-information`; 0 drafts / 1 Program / 0 Announcement / 0 News / 53 assets |
| 5.2B | First real News, CMS images and optional eventDate | **Siap** — Genius Aulad published; `phase-5.2b-first-news`; 0 drafts / 1 Program / 0 Announcement / 1 News / 55 assets |
| 5.3 | Jadual Kuliah integration | **Siap** — 5.3A–5.3E, termasuk public `/kuliah` dan homepage lecture integration |
| 5.3A | Calendar-first UX, full poster, model/renderer and local QA | **Siap** — owner-approved UX/model/renderer; `phase-5.3a-lecture-generator-ux`; tiada production writes |
| 5.3B | Authenticated month loading/draft persistence, snapshots and reusable assets | **Siap** — real October draft; authenticated Studio Save Draft exercised; compact QR published; Publish disabled; `phase-5.3b-lecture-draft-persistence` |
| 5.3C | Controlled authenticated CMS lecture publication | **Siap** — first October month published after explicit approval and fresh guards; 0 drafts / 1 published month; `phase-5.3c-controlled-lecture-publication` |
| 5.3D | Public `/kuliah` page, month navigation, accessible schedule and PNG/PDF downloads | **Siap** — `phase-5.3d-public-kuliah` |
| 5.3E | Published homepage lecture integration | **Siap** — Kuliah terdekat, date-based selection and CTA to `/kuliah`; `phase-5.3e-homepage-lecture` |

## Historical Fasa 5.3A checkpoint

Fasa 5.3A **completed dan owner-approved pada 4 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.3a-lecture-generator-ux`; resolve tag untuk commit akhir.
Baseline main/tag: `f4b473b1df54af695599a735a1fb2d1c5d9fd372` / `phase-5.2b-first-news`.
Klik petak poster sebenar memilih tarikh; Enter/Space, fokus dan selected state tersedia.
Poster khas full kini full-bleed dengan cover default, contain alternatif dan posisi atas/tengah/bawah; badge tarikh overlay, sesi asal kekal tersimpan.
Panel infaq adaptif owner-approved: kumpulan petak tanpa tarikh minimum 2, kumpulan terbesar dipilih dan seri mengutamakan awal bulan. Kandungan kumpulan 4–6 dipusatkan dengan lebar maksimum 3 petak. Toggle Papar ruang infaq ON secara lalai; QR umum asal setempat tidak diubah atau diupload. Cadangan persistence hanya lectureMonth.showInfaq; sumber QR mosque-wide, bukan lectureDay. Tiada Sanity writes/persistence; checkpoint Git sahaja. 5.3B belum bermula.

Fixture 24/25 berkongsi satu artwork demo. Save Draft/Publish disabled; tiada production
Sanity writes, lecture migration, public /kuliah atau homepage lecture feed. Git checkpoint sahaja; tiada production lecture writes.
Production kekal 45 published documents, 0 drafts, 1 Program, 0 Announcement, 1 News,
55 image assets dan 0 lecture documents. Fasa 5.3B belum bermula.

Rujuk [5.3A audit dan recommended scope](LECTURE-GENERATOR-UX-RECOVERY.md).

Rujuk [SANITY-PUBLIC-CONTENT.md](SANITY-PUBLIC-CONTENT.md). Tiada production
content writes, redesign atau operasi/admin dalam scope 5.1 ini. Pengguna
meluluskan commit/push dan checkpoint selepas final closeout lulus.
Local editorial content lima route kekal explicit fallback sahaja;
Homepage Pengumuman/Program/Berita & Aktiviti kini disambung melalui published
read layer Fasa 5.2 dengan cache 5 minit dan neutral empty states; tiada
editorial mock digunakan sebagai fallback. Rujuk
[SANITY-HOMEPAGE-CONTENT.md](SANITY-HOMEPAGE-CONTENT.md).
Jadual Kuliah/waktu solat kekal local/mock dan Publish penjana disabled.
Empty-state 5.2 disengajakan dan telah diluluskan oleh pengguna secara manual.
Existing mocks tidak diseed. Fasa 5.2A dan Fasa 5.3 tidak dimulakan dalam closeout.
Selepas checkpoint, pengguna memulakan Fasa 5.2A preparation pada 3 Oktober 2026.
Plan klasifikasi, candidate batch, NCR/QR, model gaps dan future Facebook policy:
[EDITORIAL-CONTENT-PREPARATION.md](EDITORIAL-CONTENT-PREPARATION.md).
Architecture diimplement dengan optional fields absent-safe; content facts/presentation
dan exact [draft-only batch](EDITORIAL-FIRST-DRAFT-BATCH.md) telah diluluskan.
3 original assets dan 2 drafts kemudian melalui approved Studio review dan controlled publication.
Final copy refinement republished siteSettings sahaja. Fasa 5.2A completed; rujuk [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md).
Pada checkpoint 5.2A, Genius Aulad required publishedAt belum resolved. Fasa 5.2B kemudian menyelesaikan provenance, menerbitkan artikel pertama dengan masa website sebenar dan menambah optional eventDate/CMS image. Rujuk [publication/closeout record](EDITORIAL-GENIUS-AULAD-PUBLICATION.md). Fasa 5.3 belum bermula.

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
