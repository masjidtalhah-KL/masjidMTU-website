# Fasa 5.3B — final operational closeout

Completed on 4 October 2026 (+08:00). Checkpoint:
`phase-5.3b-lecture-draft-persistence`. Resolve this tag to obtain the final
commit. Commit message: `feat: complete Fasa 5.3B lecture draft persistence`.

## Actual authenticated Studio save

The real Studio at `http://127.0.0.1:3002/studio/penjana-jadual-kuliah`
loaded the existing October Sanity draft. The actual **Save Draft** button was
clicked without editing the approved content. Status progressed from **Saving…**
to **Draft saved — no changes needed**. Whole-month/schema validation and
authenticated exact read-back succeeded. The identical-payload branch performed
no document action and no asset upload.

The full authenticated dataset snapshot before/after is identical: every document
revision and asset hash/metadata is unchanged. October remains
`drafts.lectureMonth-2026-10`, revision `SSdKRdF7e0XIFT3zzNP2ab`,
30 stored dates / 34 sessions. Reopening the real Studio shows **Draft saved** and
identical poster text. No duplicate portraits were created.

## Operational persistence and conflict protection

The Studio adapter now invokes the generic manual `saveDraft` service via its
authenticated `useClient` session. The old compiled first-save approval gate is
removed from the operational entry point. Exact batch approval remains a separate
tested audit wrapper; historical execution records retain their original status.

Prepare/save validate canonical monthly content, target, fingerprint, assets and
both loaded draft/published revisions. Changed drafts use atomic
`patch.ifRevisionID`. New months use guarded create; published-base cloning uses
`ifBaseRevisionId`. All successful paths authenticated-read-back before setting
saved status. Conflicts preserve local edits and offer reload/review; there is no
automatic merge, retry or autosave. No private environment write credential is
introduced into the public browser application.

Controlled tests prove stale draft/published guards, the atomic update conflict,
unchanged-readback revision races, validation failure, create/update, asset reuse
and unsaved month switching. No destructive production conflict was created.
Publish Jadual remains disabled with no publication action or shortcut.

## Accessibility, render and public regression

Real October accessible poster wording is now:

> Draft Jadual Kuliah Oktober 2026. Belum diterbitkan; untuk semakan Studio.

Genuine fixture/demo environments retain their own demo wording. A render test
proves this accessibility-only change leaves the poster artwork unchanged.
Studio operations remain English-first; poster content remains Malay.

Desktop 1440×1100 and mobile 375×900 review pass; mobile has no horizontal overflow.
The compact square mosque QR renders in the adaptive three-cell October panel.
Published `siteSettings` revision stays `chGo6kzbOkh09ebDsGFF22`.
The branded primary public donation QR, NCR and all other settings stay unchanged.
The month stores only `showInfaq`; no QR is duplicated into a month.

Fresh actual Studio downloads pass:
PNG 3508×2480, and one-page A4 landscape PDF rendered and visually inspected.
Compact QR, weekday centring, portraits and 34 sessions render consistently.

## Validation

- Lint, production build and whitespace diff check: pass.
- Full relevant automated suite: **192 passed, 0 failed, 0 skipped**.
- Enforced-required-field schema extraction: pass.
- Authenticated saved October/settings schema validation: 2 documents, 0 errors, 0 warnings; references resolve.
- Read-only current-state public contract: 43 historical base payloads / 50 historical image hashes retained; no historical evidence rewritten.
- Fasa 5.1/5.2 public/homepage, information, recurrence/manual override, PNG/PDF, outage/malformed, keyboard, special-poster and asset-reuse regressions: pass.
- Production build served at port 3031: homepage, Profil, Organisasi, Surau, Galeri, Hubungi and Studio return HTTP 200; `/kuliah` remains HTTP 404.

Final authenticated inventory: **1 draft, 0 published lecture documents,
0 lectureSpeaker, 0 lectureRule, 85 image assets, 1 Program, 0 Announcement,
1 News** (143 raw documents including assets/system records).

## Immutable source/encoding audit

The original corrupted first-save plan and failed guard record are preserved.
Historical failed plan byte SHA256:
`5e0c1826f1b9bab2fc2cafe94d555710ecd0b77bb541cc92db4d3eaec531095a`.

Six approved U+2019 corrections remain exact in the saved draft:
3 October second topic `AL-QUR’AN\n& TAJWID`;
10 October name `UST K. NI’MAT` and matching portrait alt;
24 October name `UST MUHD MU’IZZ` and matching portrait alt;
25 October topic `KITAB MATLA’\nAL-BADRAIN`.
Restored approved fingerprint:
`906611b8069b1c07b105da950be4f6b7cedd6d1a79a5357e912faee6e3264bb8`.
No production upload/mutation occurred before correction.
Original approved replacement and execution evidence remain unchanged:
[approved plan](LECTURE-FIRST-SAVE-APPROVED.json),
[guard failure](LECTURE-FIRST-SAVE-GUARD-FAILURE.json),
[first execution](LECTURE-FIRST-SAVE-EXECUTION.md).
GPL/provenance notices and the unresolved combined-application licensing decision
remain intact.

## Files in this checkpoint

- README.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md
- docs/LECTURE-COMPACT-QR-DRY-RUN.json
- docs/LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.json
- docs/LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.md
- docs/LECTURE-DRAFT-PERSISTENCE.md
- docs/LECTURE-FIRST-SAVE-APPROVED.json
- docs/LECTURE-FIRST-SAVE-DRY-RUN.json
- docs/LECTURE-FIRST-SAVE-EXECUTION.json
- docs/LECTURE-FIRST-SAVE-EXECUTION.md
- docs/LECTURE-FIRST-SAVE-GUARD-FAILURE.json
- docs/LECTURE-GENERATOR-UX-RECOVERY.md
- docs/LECTURE-UI-COMPACT-QR-REFINEMENT.md
- docs/PROJECT-JOURNEY.md
- docs/PROJECT-STATE.md
- docs/ROADMAP.md
- docs/SANITY-CONTENT-MODEL.md
- docs/SANITY-LECTURE-GENERATOR.md
- package.json
- sanity.config.ts
- scripts/lecture-generator/draft-persistence.test.mjs
- scripts/lecture-generator/lecture-generator.test.mjs
- scripts/lecture-generator/refinement.test.mjs
- src/sanity/lecture-types.ts
- src/sanity/schemaTypes/lectureMonth.ts
- src/sanity/schemaTypes/lectureRule.ts
- src/sanity/schemaTypes/lectureSpeaker.ts
- src/sanity/schemaTypes/siteSettings.ts
- src/sanity/tools/lecture-generator/InteractiveLecturePoster.tsx
- src/sanity/tools/lecture-generator/LectureGeneratorTool.tsx
- src/sanity/tools/lecture-generator/LecturePoster.tsx
- src/sanity/tools/lecture-generator/StudioLectureGenerator.tsx
- src/sanity/tools/lecture-generator/draft-persistence.ts
- src/sanity/tools/lecture-generator/export-poster.ts
- src/sanity/tools/lecture-generator/generator.module.css
- src/sanity/tools/lecture-generator/index.tsx
- src/sanity/tools/lecture-generator/local-poster.ts
- src/sanity/tools/lecture-generator/model.ts
- src/sanity/tools/lecture-generator/month-document.ts
- src/sanity/tools/lecture-generator/poster-layout.ts
- src/sanity/tools/lecture-generator/useDraftWorkflow.ts

[Structured closeout evidence](LECTURE-DRAFT-PERSISTENCE-CLOSEOUT.json).
The owner-approved boundary remains draft-only October. No lecture publication,
public /kuliah, homepage lecture integration, speaker/rule seeding or later phase
was started.
