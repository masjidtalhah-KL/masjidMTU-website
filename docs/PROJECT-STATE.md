# Project State — Masjid Talhah Bin Ubaidillah

## Current work — Fasa 6.1B-1 hosted staging checkpoint

7 October 2026 (+08:00), from HEAD 4ab521b484d034e102ae405476c12183554e61f4.
Dedicated Supabase staging azypohqpupphapasweln (Singapore) is linked; the unchanged
20261006000100 migration, hosted catalog/grants/RLS, private-hook wiring and genuine
negative GoTrue admission pass. 36 hosted HTTP/SQL/contract cases pass with explicit
synthetic boundaries. No Auth users/profiles/invites/audit fixture rows remain.

Owner subsequently authorized the B-1 checkpoint and first deployment from the
canonical local repo. CLI 62.7.0 verified the exact linked Vercel project/team,
all eight required Production environment names and no privileged credential.
No Git/fork source connection exists. The connector still returns 403; CLI access
works. Deployment is the next authorized step after this clean checkpoint.
Google remains disabled; no real owner, production resource or 6.1B-2 work.
Fasa 6.1 remains open. Runtime/migration unchanged; .vercelignore excludes local
Supabase caches and credential/build files detected by the upload dry-run.

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
management remains super_admin-only in 6.1; admin/staff may initially operate at
AAL1. Invites last 7 days; privileged mutations require recent MFA/step-up,
targeting around 10 minutes where supported. Session timeout values remain targets
pending the hosted plan. Recovery uses primary + backup TOTP, owner-only
Vaultwarden material and independently protected Supabase project-owner access.
Audit starts with the first mutation, with proposed 12-month retention. Local +
hosted staging is sufficient for 6.1; future production must remain separate and
requires explicit owner provisioning approval. Operational modules remain out of scope.

[Approved plan and implementation gates](ADMIN-FOUNDATION-PLAN.md).
Checkpoint: `phase-6.0-admin-foundation-architecture` (resolve tag for final commit).
Fasa 6.1 has not started. Documentation-only closeout: no runtime/configuration,
database, Supabase remote resources or Sanity changes. Earlier phase sections are
historical records; their prior Fasa 6 status does not describe this checkpoint.

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

## Fasa 5.3C — completed

4 October 2026 (+08:00). Checkpoint:
`phase-5.3c-controlled-lecture-publication` (resolve the tag for the final commit).

October 2026 is the first published `lectureMonth`: `lectureMonth-2026-10`,
revision `zVZDfWLj75qTdy5eh9rsNA`, 30 stored dates / 34 sessions / 29 resolved
portrait references. Authenticated verification confirms 0 drafts, 1 published
lecture month, 85 image assets, 0 lectureSpeaker and 0 lectureRule documents.
`showInfaq: true`; the compact QR remains mosque-wide
`siteSettings.donationInfo.compactQr`, never duplicated into a month.

Publish Jadual requires a saved, unchanged draft, explicit modal confirmation and
fresh schema/reference/revision/content guards immediately before mutation.
Stale or conflicting drafts stop publication. It never autosaves. Supported Sanity
publication removed the October draft as observed; authenticated read-back and
refresh/reopen show Published with identical content. The Studio UI did not retain
the action transaction ID; none is invented or inferred from the document revision.

Content SHA256:
`d18eb8c75642d32065fe509e9ba5f219a7d68c5989c7fc6cf4b538cb5fa547b6`.
All six approved Unicode/name/topic/portrait-alt fields remain exact. The original
failed/corrupted plan, guard failure, approved correction/fingerprint and prior
execution evidence remain immutable. No unrelated revisions or assets changed.

Desktop/mobile and PNG/A4 landscape PDF QA are owner-approved. Studio operations
remain English-first; poster output remains Malay. **Public /kuliah and homepage
lecture integration have not started.** Earlier phase sections below are historical
checkpoint records; they do not describe the current publication state.

[Publication workflow](LECTURE-PUBLICATION.md);
[immutable execution evidence](LECTURE-FIRST-PUBLICATION-EXECUTION.md);
[final closeout verification](LECTURE-PUBLICATION-CLOSEOUT.md).

## Fasa 5.3B — completed
4 October 2026 (+08:00). Checkpoint: `phase-5.3b-lecture-draft-persistence`.
The first real October snapshot is persisted only as
`drafts.lectureMonth-2026-10`: 30 dates, 34 sessions, 29 original portraits.
Draft revision: `SSdKRdF7e0XIFT3zzNP2ab`; published settings revision:
`chGo6kzbOkh09ebDsGFF22`.

The actual authenticated Studio **Save Draft** button was physically exercised
without content edits. It validated and read back the identical payload, reported
**Draft saved — no changes needed**, and performed no update/upload. Reopening
Studio loaded exactly the same poster. Manual saving is now operational through
the authenticated Studio client, with schema validation, original-asset reuse,
optimistic revision guards, exact read-back and visible saved/conflict/error states.
No autosave. Publish Jadual remains disabled with no handler.

Loading precedence remains draft → published → locally generated rules.
Monthly snapshots preserve Penceramah name/photo/topic and rule references.
Only showInfaq is stored per month; approved mosque-wide compactQr is resolved
from published siteSettings, without branded primaryQr fallback. Public donation
QR, NCR and unrelated published content remain unchanged.

Final inventory: 1 draft, 0 published lecture documents, 0 lectureSpeaker,
0 lectureRule, 85 image assets, 1 Program, 0 Announcement, 1 News.
Real October accessibility now says draft/review, while genuine fixtures retain
demo labels. Poster artwork stays Malay; Studio operations stay English-first.
Desktop/mobile, fresh actual PNG/PDF exports and conflict simulation pass.

The original failed/corrupted first-save plan and guard audit remain immutable.
Six approved Unicode corrections restored fingerprint
`906611b8069b1c07b105da950be4f6b7cedd6d1a79a5357e912faee6e3264bb8`.
No production mutation occurred before correction. The original first execution
record remains historical evidence; this closeout supersedes its unset generic
Studio approval gate. GPL/provenance notices and the unresolved combined-application
licensing decision remain intact. Public /kuliah and homepage lecture integration
have not started.

[Final Studio save and validation evidence](LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.md).

## Preparation record before controlled execution (historical)

4 October 2026 (+08:00), baseline 27e23a2528c72144a1fe7e0d5ecbd45dc3343912 /
phase-5.3a-lecture-generator-ux. Authenticated Studio month loading prefers draft,
then published, then a local snapshot from published active rules. With no rules,
the new month is empty; demo data is never migrated.

Manual Save Draft prepares a schema-validated, fingerprinted plan. The save service
implements original-asset reuse/upload, guarded create/update and authenticated
exact read-back, but the compiled first-write approval is unset. **No production
lecture save/upload, publish, commit or push has occurred.** Publish remains
disabled; public /kuliah and homepage lecture integration remain outside scope.

State protection covers dirty month switches, revision conflicts and explicit
reload/review. Monthly snapshots preserve speaker name/photo/topic; optional
lectureSession.photoLayout retains existing portrait fit/position/zoom/inset.
Special posters preserve the locked 5.3A takeover/cover/contain/position behavior.
Only showInfaq is persisted; compact QR resolves from published
siteSettings.donationInfo.compactQr, never branded primaryQr.

First recommendation: independently QA'd original October 2026 source, 34 sessions,
one draft and 29 original portraits. Complete payload, asset IDs/hashes, source
provenance, counts and exact approval fingerprint are in the dry-run file.
Production remains 0 drafts / 0 lecture documents / 45 published non-asset records /
55 images / 1 Program / 0 Announcement / 1 News.

Fresh refinement QA now passes on authenticated desktop/mobile Studio and the
isolated compact-QR fixture. Actual PNG/PDF exports were reviewed for 2-cell,
3-cell and larger eligible groups. The original blocked-browser review remains
historical; these are new browser/export proofs. No later phase has started.

Operational Studio UI is English-first, retaining Malay Masjid/Kuliah terms;
generated poster output stays Malay. Weekday labels use measured painted-bound
centering with unchanged fonts/pills/grid. Proposed optional
siteSettings.donationInfo.compactQr is exclusive to Jadual Infaq. Missing compact
configuration omits the panel with a warning, with no branded QR fallback.
Public donationInfo.primaryQr and every public setting remain unchanged.
Separate QR upload/settings draft/review/publication approvals precede the
desired October Infaq output. No QR or production settings write has occurred.

[Refinement, proofs and setup gates](LECTURE-UI-COMPACT-QR-REFINEMENT.md).

[Persistence architecture and validation](LECTURE-DRAFT-PERSISTENCE.md) · [Exact first-save payload](LECTURE-FIRST-SAVE-DRY-RUN.json).

## Historical record through Fasa 5.3A

Snapshot disemak pada **4 Oktober 2026 (+08:00)**. Dokumen ini ialah ringkasan
keadaan semasa untuk sambungan kerja. Arahan pengguna terkini dan keadaan Git/kod
perlu diperiksa semula; snapshot ini bukan kebenaran automatik untuk fasa berikutnya.

## Fasa 5.3A — completed

Fasa 5.3A **completed dan owner-approved pada 4 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.3a-lecture-generator-ux`; resolve tag untuk commit akhir.
Baseline main/tag: `f4b473b1df54af695599a735a1fb2d1c5d9fd372` / `phase-5.2b-first-news`.
Klik petak poster sebenar memilih tarikh; Enter/Space, fokus dan selected state tersedia.
Poster khas full kini full-bleed dengan cover default, contain alternatif dan posisi atas/tengah/bawah; badge tarikh overlay, sesi asal kekal tersimpan.
Panel infaq adaptif owner-approved: kumpulan petak tanpa tarikh minimum 2, kumpulan terbesar dipilih dan seri mengutamakan awal bulan. Kandungan kumpulan 4–6 dipusatkan dengan lebar maksimum 3 petak. Toggle Papar ruang infaq ON secara lalai; QR umum asal setempat tidak diubah atau diupload. Cadangan persistence hanya lectureMonth.showInfaq; sumber QR mosque-wide, bukan lectureDay. Tiada Sanity writes/persistence; checkpoint Git sahaja. 5.3B belum bermula.

Fixture 24/25 berkongsi satu artwork demo. Save Draft/Publish disabled; tiada production
Sanity writes, lecture migration, public /kuliah atau homepage lecture feed. Git checkpoint sahaja; tiada production lecture writes.
Production kekal 45 published documents, 0 drafts, 1 Program, 0 Announcement, 1 News,
55 image assets dan 0 lecture documents. Fasa 5.3B belum bermula.

[Audit workflow, model, QA dan proposed 5.3B](LECTURE-GENERATOR-UX-RECOVERY.md).

## Rekod checkpoint terdahulu — Fasa 5.2B

Fasa 5.2B completed pada **3 Oktober 2026 (+08:00)**. Checkpoint: `phase-5.2b-first-news`; resolve tag untuk hash commit akhir.
Genius Aulad ialah News pertama: 0 drafts / 1 Program / 0 Announcement / 1 News / 55 image assets.
Optional newsPost.eventDate = 2026-05-14 dipaparkan sebagai **14 Mei 2026**; publishedAt = 2026-10-03T11:18:02Z ialah masa penerbitan website sebenar dan metadata eligibility/sorting.
Homepage News kini memaparkan imej CMS dengan alt approved dan optional no-image fallback; eyebrow **BULETIN MTU**, heading **Berita dan aktiviti**, description **Sorotan program, aktiviti dan perkembangan semasa Masjid Talhah Bin Ubaidillah.**
Read layer kekal typed/server-only, published-only, token-free, cache 300 saat. Healthy empty Announcement disengajakan; outage tidak mencipta editorial mock, malformed/auth/query errors kekal visible.
Facebook curated/manual tanpa importer. Dapur/NCR/donation dan 44 published records sedia ada tidak berubah dalam publication News.
Jadual Kuliah local/mock, Lecture Generator Publish disabled; **Fasa 5.3 belum bermula**.
Rekod: [EDITORIAL-GENIUS-AULAD-PUBLICATION.md](EDITORIAL-GENIUS-AULAD-PUBLICATION.md).

### Rekod checkpoint terdahulu — Fasa 5.2A

Baseline sebelum 5.2A: `72506d2f7b6d5fb7a176c7ac848beade4186bfd3` / `phase-5.2-homepage-editorial-integration`.
Fasa 5.1: `5125ba46a52ddfd2a7d790fc8c490b427662133a` / `phase-5.1-sanity-public-content`.
Lima route Profil/Organisasi/Surau/Galeri/Hubungi kekal published Sanity; approved local content hanya temporary-outage fallback.
Studio review, controlled publication dan desktop/mobile QA telah diluluskan owner.
Final donation copy melalui draft → exact review/schema validation → publish siteSettings sahaja.
Published settings revision `SSdKRdF7e0XIFT3zzGU8xL`; Program revision `SSdKRdF7e0XIFT3zzFziKH`.
43 other published records dan 53 assets unchanged dalam copy refinement.
Rujuk [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md) untuk exact scope, copy, revisions, validation dan checkpoint.
Draft-seeding JSON kekal historical approval evidence; ia bukan current-state inventory.

Fasa 4.1, model Fasa 4.2 dan prototype
Fasa 4.2A telah diluluskan. Checkpoint akhir 4.2/4.2A ialah
`phase-4.2-sanity-content-model` (`f2aa594`).
**Fasa 4.3A preparation/dry-run siap, dikomit/dipush sebagai `ea8dd09`,
checkpoint `phase-4.3a-migration-dry-run`. Fasa 4.3B draft-only production
migration siap: 43 draft, 50 aset imej unik, 0 konflik, 43 `skip-identical`.
Checkpoint draft: `phase-4.3b-draft-migration`. Controlled Publication 4.3C
selesai: 43 published editorial, 0 draft, 50 aset imej, 55 references kepada
50 aset unik, 0 konflik. Checkpoint penutupan
`phase-4.3c-controlled-publication`. Pada checkpoint 4.3C frontend masih
local/static dan Lecture Generator Publish disabled.**

Repository rasmi: <https://github.com/masjidtalhah-KL/masjidMTU-website>.
Commit Fasa 4.1 ialah `d48e36c7c5b43f8d934b3e9ee89ab6aa5785f2b1`.
Resolve tag checkpoint 4.2 untuk hash akhir; sahkan `main`, `origin/main` dan
working tree ketika bootstrap sesi baharu. Hash commit sendiri tidak dimasukkan
ke dokumen dalam commit yang sama.

| Fasa siap | Commit penutupan / bukti Git | Checkpoint tag |
| --- | --- | --- |
| 0 — Foundation | `c8c9252` | Tiada tag ditemukan |
| 1 — Design System, termasuk refinement 1.1/1.2 | `f24b1ee` | `phase-1-design-system` — sasaran tidak sepadan, lihat nota |
| 2 — Homepage, termasuk refinement foto/QA | `4ab8a03`, merge main `d92a571` | `phase-2-homepage` — sasaran tidak sepadan, lihat nota |
| 3.0 — Planning & Asset Mapping | Diluluskan menurut ROADMAP; tiada commit khusus | Tiada tag ditemukan |
| 3.1 — Content & Assets | `12d8bc8` | Tiada tag ditemukan |
| 3.2 — Navigation & Page Shell | `71a2d95` | Tiada tag ditemukan |
| 3.3 — Profil | `9a9c0a3` | Tiada tag ditemukan |
| 3.4 — Organisasi | `d7d93ff` | `phase-3.4-organisasi` |
| 3.5 — Surau Kariah | `61d09f3`, merge main `de64d3f` | `phase-3.5-surau-kariah` |
| 3.6 — Galeri | `5936bfd` | `phase-3.6-gallery` |
| 3.7 — Hubungi | `c9d0d20` | `phase-3.7-contact` |
| 4.1 — Sanity Foundation | `d48e36c` | `phase-4.1-sanity-foundation` |
| 4.2 / 4.2A — Content Model & prototype kuliah | Commit yang dirujuk tag checkpoint | `phase-4.2-sanity-content-model` |
| 4.3A — Migration preparation/dry-run | `ea8dd09` | `phase-4.3a-migration-dry-run` |
| 4.3B — Draft-only production migration & review | Resolve tag untuk commit penutupan | `phase-4.3b-draft-migration` |
| 4.3C — Controlled Publication & closeout | Resolve tag untuk commit penutupan | `phase-4.3c-controlled-publication` |
| 5.1 — Published Sanity public content | Resolve tag untuk commit penutupan | `phase-5.1-sanity-public-content` |
| 5.2 — Homepage editorial published read integration | Resolve tag untuk commit penutupan | `phase-5.2-homepage-editorial-integration` |
| 5.2A — Editorial public information | `91ad9f2` | `phase-5.2a-editorial-public-information` |
| 5.2B — First News, CMS image and event date | Resolve tag untuk commit penutupan | `phase-5.2b-first-news` |

**Ketidakpadanan tag lama:** kedua-dua tag Fasa 1/2 sebenarnya menunjuk ke
`19f3c6c` (penjelasan pattern rasmi), sebelum penutupan Fasa 1 dan implementation
homepage. Jangan gunakan tag itu sebagai snapshot akhir fasa. Tag tidak diubah
dalam tugas ini. Tarikh/rujukan penuh berada dalam [PROJECT-JOURNEY.md](PROJECT-JOURNEY.md).
Fasa 5.1/5.2/5.2A/5.2B siap; Fasa 5.3 dan Fasa 6–12 belum bermula.

## Architecture semasa

- Next.js App Router **16.3.6**, React **19.2.8**, TypeScript, Tailwind CSS 4,
  ESLint; versi tepat dikawal oleh `package.json` dan lockfile. Node >=22.12.
- Route awam: `/`, `/profil`, `/profil/organisasi`, `/profil/surau-kariah`,
  `/galeri`, `/hubungi`. `/design-system` ialah katalog reka bentuk.
- Lima public pages menggunakan `src/lib/public-content/cms/server.ts` dan
  adapter typed; modul tempatan/aset approved kekal fallback. Homepage editorial
  menggunakan `cms/homepage-server.ts`, bundle typed dan cache lima minit.
  Dataset editorial: 1 ongoing Program, 0 Announcement, 1 News; eventDate mengatasi publishedAt untuk display, CMS image optional; empty sections kekal neutral; temporary outage menggunakan
  explicit UI fallback kosong. Waktu solat/kuliah masih mock data daripada
  `src/lib/homepage-content.ts`; editorial mocks lain tidak lagi dirender.
- Embedded Studio rasmi pada `/studio/[[...tool]]`, menggunakan NextStudio dan
  Sanity authentication. Ia tidak menggunakan custom login atau route transition awam.
- Sanity **6.17.0**, next-sanity **13.3.4**, @sanity/client **8.9.0**.
  Konfigurasi berpusat di `src/sanity/env.ts`, digunakan oleh config/client/CLI.
- Project ID `2o95jmms`, organisasi `o5cig7je6`, dataset `production`;
  fixed API version `2026-09-01`. Env: `NEXT_PUBLIC_SANITY_PROJECT_ID`,
  `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`.
  `.env.local` diabaikan Git; hanya `.env.example` dijejak. Tiada token rahsia
  diperlukan dalam browser. Login/CORS origin review telah disemak semasa Fasa 4.1;
  origin deployment sebenar perlu disahkan kemudian.

### Sempadan editorial dan operasi

**Sanity:** identiti/contact public, profil, pengumuman, program, berita,
organisasi, surau, galeri dan jadual kuliah editorial.
**Supabase/PostgreSQL + `/admin`:** peserta Qurban, pendaftaran, bayaran, resit
dan transaksi Ramadan. Bahagian operasi ini masih rancangan.
Campaign engine Qurban/Ramadan/wakaf/sumbangan, payment, email dan authentication
admin belum diimplement. Kategori galeri `qurban` tidak bermaksud transaksi Qurban.

## Keputusan visual dan kandungan yang dikunci

- Nama public penuh: **Masjid Talhah Bin Ubaidillah**; lokasi Bukit Jalil,
  Kuala Lumpur. Institutional sans-serif sistem (Segoe UI/Arial), mobile-first.
- Gunakan token navy/blue/gold/ivory sedia ada; tiada visual language baharu.
  Warna utama `navy-950 #071A3E`, `blue-700 #254E8A`, `ivory #F7F4EC`;
  emas `gold-400 #D7B75B`, `gold-500 #B79639`, `gold-600 #9F7C27` untuk aksen.
  Token lengkap: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **`/brand/brand-pattern-official.png` ialah satu-satunya pattern geometri.**
  Gunakan aset sebenar; hanya opacity, navy overlay, gradient, size, position
  dan responsive cropping. Jangan recreate, trace atau ubah geometri.
  Pattern terkawal pada hero/header/signature sections; navy polos pada bahagian lain.
- `MihrabMark` ialah dua garis arch minimal, hiasan sahaja; bukan logo kedua,
  tanpa frame atau teks. Logo rasmi `/brand/logo-masjid.png` tidak diubah.
- Hero menggunakan `masjid-dome.jpg` (DSC03425). Exterior DSC03423 disimpan
  sebagai `masjid-exterior.jpg`; homepage menggunakan derivative `masjid-exterior.webp`.
  Foto memakai `next/image`; original tidak dicrop/destructive edit.
- Kandungan penting visible tanpa animation/JavaScript/IntersectionObserver;
  hormati reduced motion. Main-only route transition ringan; Navbar stabil.
- Desktop Profil ialah text link: hover/focus membuka dropdown, klik menuju
  `/profil`, Escape menutup. Mobile tap expand/collapse. Sumbangan → `/#donations`.
- Sumber Fasa 3 ialah Markdown `Asset-phase-3`; runtime menggunakan salinan data
  berstruktur tempatan, bukan path OneDrive. Jangan reka fakta/nama/contact.
- Profil memakai lima foto sahaja: #8 dewan, #11 foyer, #15 kubah, #17 mihrab
  portrait, #19 sudut bacaan. Tiada penerangan teknikal seni bina yang direka.
- Organisasi: **25 slot jawatan, 23 foto**. ID berasaskan slot, bukan individu;
  pemegang dua jawatan kekal dalam kedua-dua konteks. Soffan kekal tanpa foto
  dengan placeholder neutral; Timbalan Pengerusi kekal dengan status **Kosong**.
  Urutan Imam/Bilal dan perjawatan mengikuti data tempatan yang telah diluluskan.
- Surau: **3 Jumaat + 12 Biasa**, 15 logo asal tanpa redraw/upscale; MIMOS kecil
  dan pudar dalam source. UI kad logo/nama; alamat tersedia dalam data.
- Galeri: 12 foto interior #2/4/5/6/8/9/10/11/14/15/17/19, nisbah asal,
  lightbox accessible. #18 carta kewangan/contact sheet dikecualikan public.
- Hubungi: Facebook/Instagram **ikon sahaja** hitam → warna pada hover/focus,
  URL daripada structured contact data, label accessible. Sabtu/Ahad/cuti umum
  tutup. Tiada map embedded/pin tepat; pautan carian berdasarkan alamat sahaja.

## Schema Fasa 4.2 yang diluluskan

Registry: `src/sanity/schemaTypes/index.ts` — **11 document types, 6 support types**.

| Document type | Tujuan / status |
| --- | --- |
| `siteSettings` | Singleton ID tetap; identiti/contact/waktu pejabat |
| `profilePage` | Singleton ID tetap; pengenalan, visi/misi/moto, rasional, maksimum lima foto |
| `announcement` | Pengumuman, tarikh, CTA pilihan dan ordering/visibility |
| `program` | Program, tarikh/lokasi/registration link pilihan |
| `newsPost` | Berita/aktiviti, artikel dan publish date |
| `organisationMember` | Satu slot jawatan, vacancy, foto/perjawatan pilihan |
| `surau` | Nama, kategori, logo/alamat pilihan, ordering |
| `galleryCollection` | Koleksi dengan media embedded berurutan |
| `lectureSpeaker` | Penceramah reusable — dalaman prototype |
| `lectureRule` | Aturan berulang — dalaman prototype |
| `lectureMonth` | Dokumen bulanan dengan tarikh/sesi embedded — dalaman prototype |

Support types: `editorialImage`, `galleryMedia`, `blockContent`, `paragraphText`,
`lectureDay`, `lectureSession`. Schema `lecture` ringkas terdahulu diganti oleh
model bulanan; kerja schema editorial lain dikekalkan. Singleton tidak ditawarkan
melalui Create new/duplicate/delete biasa. Tiga document kuliah read-only,
tersembunyi dari Structure/Create new dan tanpa actions semasa prototype.
Guardrail UI ini bukan authorization API. Butiran: [SANITY-CONTENT-MODEL.md](SANITY-CONTENT-MODEL.md).

## Penjana Jadual Kuliah: prototype, bukan penerbitan rasmi

- Tool native `/studio/penjana-jadual-kuliah`, implementation
  `src/sanity/tools/lecture-generator/`. React/CSS/SVG, tanpa dependency baharu.
- Data fiksyen dalam React state sahaja: bulan, penceramah, aturan, editor
  tarikh, maksimum dua sesi sehari dan live poster. Aturan tidak menimpa
  override manual, termasuk tarikh yang sengaja dikosongkan.
- PNG 3508 × 2480 dan PDF A4/A3 satu halaman tersedia untuk **demo**;
  tiada jaminan print-ready/vector PDF. Tiga portrait rujukan upstream digunakan
  di bawah label fiksyen untuk QA visual dan tidak dimigrasikan ke Sanity.
- Tiada dataset fetch, upload, mutation, localStorage atau Save draft.
  **Publish disabled. Refresh/keluar tool menghilangkan data demo.**
- Model yang dicadangkan: penceramah/aturan reusable → draft bulanan → snapshot
  published yang sama untuk website/poster. Save/publish, concurrency dan frontend
  query belum dibina. Rujuk [SANITY-LECTURE-GENERATOR.md](SANITY-LECTURE-GENERATOR.md).
- QA berasingan memakai snapshot Oktober sebenar: 34 sesi, semua foto dapat
  dipadankan, 63 elemen teks tanpa clipping dan tiada overflow. PNG/PDF A4/A3
  lulus. Fixture kekal read-only di luar runtime Studio/dataset; keputusan kekal
  dalam [SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md).
- Renderer akhir diluluskan, termasuk allowance clip 0.6 unit SVG tanpa perubahan
  saiz/kedudukan teks. Kandungan synthetic terlalu panjang masih boleh ditolak
  oleh guard export; font sistem, raster PDF, DPI PNG dan proof cetakan ialah had
  prototype yang didokumenkan. Ini tidak menghalang checkpoint yang diluluskan.

Fasa 0–3, 4.1 dan checkpoint 4.2/4.2A ialah implementation yang diluluskan. Ini tidak bermaksud
website telah launch atau security/operational readiness telah selesai.
Checkpoint 4.2/4.2A tidak merangkumi migration/seed/CMS fetch public, `/kuliah`,
draft preview, Presentation Tool atau webhook. Semakan terdahulu direkodkan dalam
SANITY docs; keputusan itu bukan validation baharu oleh tugas dokumentasi ini.
Npm advisories sedia ada kekal seperti didokumenkan; jangan `audit fix --force`.

## Keputusan belum selesai dan langkah terdekat

1. Fasa 4.3A, migration draft 4.3B dan Controlled Publication 4.3C siap.
   Fasa 5.1 dan Fasa 5.2 Pengumuman/Program/Berita & Aktiviti siap dan diluluskan.
   Fasa 5.2A completed dengan Dapur/NCR/general QR published dan final copy approved.
   Genius Aulad masih pending required publishedAt; Qiam/Bubur Asyura HOLD.
   Tiada seeding lanjut atau scope fasa baharu diluluskan dalam checkpoint ini.
   Jadual Kuliah dikecualikan; Fasa 5.3 belum bermula.
   Save/publish kuliah, snapshot dan print QA memerlukan scope lanjut.
2. **Keputusan pre-production masih terbuka:** tentukan pematuhan GPL-3.0 bagi
   adapted renderer/combined application dan hak aset sebelum pengedaran produksi.
   Provenance telah direkodkan; approval checkpoint tidak menyelesaikan lesen.
3. Cadangan migration ialah draft dahulu → review Studio → publish selepas
   approval. Jadual sebenar dan content lecture kekal di luar scope migration ini.
4. Keputusan domain/hosting/production origins, plan/billing service, kos dan
   usaha kerja menunggu bukti. Catat dalam [PROJECT-COSTS.md](PROJECT-COSTS.md).
5. Ketidakpadanan dua tag lama memerlukan keputusan berasingan jika mahu dibetulkan.
   Nota status public-page/ledger yang lapuk diperbetulkan dalam preparation
   4.3A tanpa mengubah sejarah Git atau anomaly tag.

## Fasa 4.3A — preparation/dry-run siap

- Utility: `scripts/sanity-migration/`; default dry-run, explicit future
  write-drafts memerlukan target tepat/fingerprint/token. Tiada command write
  production dilaksanakan dalam sesi ini.
- Pelan: 43 dokumen — 1 settings, 1 Profil, 25 slot organisasi, 15 surau
  (3 Jumaat/12 Biasa), 1 koleksi Interior Masjid dengan 12 foto.
- 50 fail imej unik/55 penggunaan; lima imej Profil menggunakan semula aset
  Galeri. Logo rasmi tidak diupload. Tiada aset hilang atau validation failure.
- ID tetap singleton, ID slot organisasi, ID source surau, dan
  `galleryCollection-interior-masjid`. Array keys stabil; source text kekal.
- Authenticated read-only raw dataset pada 2026-10-01 16:18:13 +08:00:
  11 `system.group` + 1 `system.retention`; 0 editorial/draft/image/file assets.
  Snapshot ini bukan jaminan keadaan dataset pada masa migration kelak.
- Validator schema sebenar lulus untuk 43 calon; reference placeholders disemak
  offline, bukan dakwaan aset telah wujud. 16 ujian mapping/conflict/idempotency
  lulus menggunakan client dalam memori. Lint/build, schema extraction dengan
  enforced required fields dan whitespace check lulus. Enam public routes
  HTTP 200; H1/navigation/footer/images disemak. Tiada diff source runtime/aset.
- Public source/components/assets, schemas dan penjana kuliah tidak diubah;
  Publish disabled. Mock homepage, semua lecture demo/QA/legacy dikecualikan.
- Panduan/audit: [SANITY-MIGRATION.md](SANITY-MIGRATION.md). Preparation
  tidak melakukan production migration/upload/publish; commit dan push
  penutupan `ea8dd09` disahkan pada 1 Oktober 2026.

## Fasa 4.3B — migration draft production dan review

- Pengguna mengesahkan migration sebenar; authenticated raw read-back pada
  2 Oktober 2026 mengesahkan 105 rekod: 12 sistem, 43 draft editorial,
  50 `sanity.imageAsset`, 0 file assets, 0 published editorial.
- Draft: 1 Site Settings, 1 Profil, 25 slot organisasi, 15 surau
  (3 Jumaat/12 Biasa), 1 Interior Masjid dengan 12 foto berurutan.
- Fingerprint diluluskan kekal
  `cbe642f6bdc5265705dbe6079d64dfa2243c83f369a1f32690a5cf83ee30cbae`.
  Semua 43 sasaran `skip-identical`, 50 aset boleh digunakan semula,
  55 references diselesaikan; tiada konflik atau reference hilang.
- Lima foto Profil berkongsi references Galeri. Timbalan Pengerusi kosong,
  Soffan tanpa foto dan pemegang berbilang jawatan kekal slot berasingan.
- QA Studio menggunakan sesi login pada origin sedia ada
  `http://127.0.0.1:3002`; tiada edit atau Publish dibuat.
  Susunan dalam kumpulan/kategori sama dengan source. Studio menggunakan
  pilihan sort sedia ada; rank kumpulan organisasi kekal tanggungjawab adapter.
- Isu sedia ada: subtitle preview Galeri menyebut “0 foto”; editor dan raw
  array membuktikan 12 foto. Pembaikan preview ditangguhkan untuk scope berasingan.
- Closeout lulus lint/build/diff check, 17 migration tests, schema extraction,
  validator 43 payload remote, 50 imej Studio dan enam public routes HTTP 200.
- Laporan write berlabel `WRITE-DRAFTS`, tahap preflight; JSON mode/stage
  tepat. Safety model dan writer tidak diubah. Review closeout tidak
  menjalankan write/upload semula.
- Public frontend kekal local/static; schema, aset public dan renderer tidak
  diubah. Lecture Generator Publish disabled. Mock homepage/lecture/QA
  tidak dimigrasikan; GPL/provenance kekal terbuka sebelum production.

## Fasa 4.3C — Controlled Publication selesai

- Baseline diperiksa sebelum edit: branch `main`, working tree bersih, HEAD
  `156cdf542c5a44ca9006222dbd30eb40ffc2ebb2` / `phase-4.3b-draft-migration`.
- Authenticated raw preflight pada **2026-10-02T08:59:45.674Z**
  (16:59:45 +08:00): 105 rekod = 43 draft + 50 imej + 12 sistem;
  0 published editorial, 0 konflik, semua 43 payload/revisi sepadan,
  55 references kepada 50 aset unik. Edge cases 4.3B kekal.
- Manifest exact ID/type/revisi/aset dalam
  `scripts/sanity-migration/approved-publication.json`. Default publication CLI
  ialah read-only; target, fingerprint pelan dan fingerprint publication wajib
  untuk tindakan write. Snapshot tidak boleh authorize publication.
- Publish action rasmi dengan revision locks, absence guards dan atomic batch;
  tiada upload, manual replace/delete, purge atau automatic retry.
- Linux (Hermes sebagai execution agent sahaja) melakukan publication; Work
  mengemas repository dan membaca remote secara read-only. Percubaan awal
  HTTP 400 kerana ID `mtu-4.3c-*` tidak sah; pengguna mengesahkan tiada mutation.
  Prefix diperbetul kepada `mtu-4-3c-`; transaksi mesti `[a-zA-Z0-9_-]+`.
- Transaksi berjaya: `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb`.
  Request `2026-10-02T11:48:30.173Z`, response `11:48:31.971Z`, acknowledged
  `11:48:33.137Z` (19:48 +08:00). API dry-run dan atomic retry berjaya.
  Retry ini tindakan operator selepas fix; tiada automatic mutation retry.
- Read-back bebas authenticated/raw `2026-10-02T11:59:03.021Z`:
  105 rekod = 43 published + 50 imej + 12 sistem, 0 draft/konflik/unexpected
  editorial. Semua payload identical; 55 references/50 aset diselesaikan.
  Metadata bukan sasaran tidak berubah. Published `_updatedAt=11:48:30Z`.
- Gallery list “0 foto” dibetulkan melalui override preview dalam
  `sanity.config.ts`: count scalar `items.length` berasingan daripada thumbnail
  `items.0.image`. Schema source/model, payload dan fingerprints asal tidak berubah.
- QA Studio menggunakan perspektif Published; lima foto Profil, 25 slot,
  vacancy/Soffan, 15 surau dan 12 galeri disemak. Public frontend local/static,
  Lecture Generator Publish disabled. Tiada content lecture/mock/QA diterbitkan.
- Rekod timestamp, exact IDs/types, safety gates dan semakan:
  [SANITY-PUBLICATION.md](SANITY-PUBLICATION.md). Checkpoint
  `phase-4.3c-controlled-publication`; Fasa 5 belum bermula.

## New Work Session Bootstrap

1. Baca dokumen ini, `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`,
   `DESIGN-SYSTEM.md`, `DECISIONS.md` dan dokumen fasa yang hendak disentuh.
2. Sahkan repository rasmi/remote, folder aktif, branch, HEAD, tags,
   `git status` dan diff termasuk fail untracked. Jangan reset/clean/stash atau
   membuang kerja Fasa 4.2/4.2A tanpa arahan pengguna. Pada mesin baharu, clone
   gunakan checkpoint `phase-5.2a-editorial-public-information` untuk kod/docs penutupan
   terkini. Git tidak menyimpan dataset remote; sahkan published/draft/aset melalui raw
   read-back. Checkpoint `phase-4.2-sanity-content-model` ialah baseline prototype.
3. Inspect kod sebenar: public-content, route/components, schema registry,
   Studio structure dan generator jika relevan. Jangan bergantung pada chat lama,
   port server atau screenshot QA di luar repo sebagai satu-satunya bukti.
4. Sahkan env daripada `.env.example` tanpa mencetak/commit rahsia; login/CORS
   Studio jika diperlukan. Tanya pengguna hanya bagi keputusan yang belum dikunci.
5. Nyatakan scope semasa dan approval yang diperlukan; jangan masuk fasa lain
   atau commit/push secara automatik. Ikuti validation dalam arahan fasa.
6. Selepas kemajuan diluluskan, kemas state/roadmap, tambah keputusan dan timeline
   berasaskan bukti; kemas ledger kos hanya dengan bukti sebenar.
