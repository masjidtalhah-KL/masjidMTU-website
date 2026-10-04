# Fasa 5.3C — authenticated lecture publication

Completed and owner-approved, 4 October 2026 (+08:00).
Baseline: `2bedc0afc482c2100b428abbe1a9190776e0f736` /
`phase-5.3b-lecture-draft-persistence`.
**October is published in CMS; Fasa 5.3C completed.**
Checkpoint: `phase-5.3c-controlled-lecture-publication`.
[Immutable execution](LECTURE-FIRST-PUBLICATION-EXECUTION.md) and
[final closeout verification](LECTURE-PUBLICATION-CLOSEOUT.md).

## Publish Jadual UX and eligibility

Authenticated Studio loads draft → published → locally generated rules.
The Publish Jadual button is disabled with a visible explanation until:
a saved draft exists; its revision and month/year are known and match the selected
month; there are no local unsaved edits; schema validation passes; all references
resolve; and fresh remote draft/published revisions match the loaded base.
Fixture/demo mode cannot publish. No automatic Save Draft occurs.

Eligibility is checked read-only on load/save/local-state changes. Clicking an
eligible button repeats that check before opening a native modal confirmation.
The modal displays month/year, date/session counts, draft revision, published
version/revision, resolved assets and exact content identity.
Cancel is focused by default; Escape cancels before submission; native modal focus
trapping makes the background inert. The explicit **Confirm Publish Jadual** button
is the only UI dispatch path. While confirming/publishing, editing and month
switching are locked. Publishing shows progress and cannot be cancelled/repeated.
No global publish shortcut is registered.

During the initial read-only implementation review, the real authenticated Studio
confirmation was opened, reviewed and **cancelled**
at desktop 1440×1100 and mobile 375×900. Mobile modal has no horizontal overflow.
No confirmation of production publication was clicked; no save/upload/action
occurred during that initial QA. The owner later approved the exact plan; the
actual confirmation button published October with unchanged content. Refresh/reopen
and PNG/PDF exports passed. The UI did not retain the transaction ID.

## Revision and supported publication semantics

Publication uses authenticated Studio `useClient`, raw reads, no CDN and SDK
mutation retries disabled. Schema/reference validation uses the current workspace.
No private environment write token is added to the public browser application.

Immediately before mutation the service re-fetches the exact draft/published pair,
checks IDs/year/month/revisions, recomputes canonical source-content identity and
compares the full prepared plan fingerprint to the explicitly confirmed plan.
It never publishes local unsaved state or normalizes source strings.

Use the supported `sanity.action.document.publish` action with
`ifDraftRevisionId`; a subsequent update also supplies
`ifPublishedRevisionId`. For first publication, a preceding create action with
`ifExists: ignore` leaves the already-existing draft unchanged but rejects a
concurrently created published target. Both actions are one atomic transaction.
The installed SDK documents that create requires the published target to be absent,
and that publish replaces published content and removes the corresponding draft.
The application sends no manual delete/discard, no payload repair and no asset
upload. See the [Sanity Actions API](https://www.sanity.io/docs/http-reference/actions)
and installed `@sanity/client/src/types.ts` CreateAction/PublishAction.

Successful authenticated read-back must show the draft absent and the new
published revision with exactly the reviewed canonical content. A second load must
match that result before the editor shows **Published** and its revision.
Subsequent local edits show **Unsaved changes**; Save Draft creates/updates a draft
under the published-base revision guard, preserving the published version until
a later reviewed publication. Only published CMS content is involved; no public
Kuliah route/feed is added.

## Failure/recovery and double submission

Synchronous UI single-use confirmation tickets plus per-client/month service
locks prevent double dispatch. Conflicts preserve the local editor and surface
a reload/review action. No auto-merge, retry, autosave or rollback.

Acknowledgement alone cannot show success. If the action response is lost but
authenticated read-back proves exact publication, the UI reports Published with
a warning explaining the missing response. If reads fail, the draft remains, the
payload drifts or another draft appears, publication stays **unverified/uncertain**.
Editing/submission is locked until explicit reload/review. There is no ambiguous
success toast or automatic second operation. A HTTP 409 is a visible conflict.

## Exact first-publication dry-run

Full reviewed payload, references, canonical identities and exact actions:
[LECTURE-FIRST-PUBLICATION-DRY-RUN.json](LECTURE-FIRST-PUBLICATION-DRY-RUN.json).

| Guard | Exact state |
| --- | --- |
| Project / dataset | `2o95jmms / production` |
| Selected month | October 2026 |
| Draft ID | `drafts.lectureMonth-2026-10` |
| Draft revision | `SSdKRdF7e0XIFT3zzNP2ab` |
| Published target | `lectureMonth-2026-10` |
| Published target before | Absent |
| Dates / sessions | 30 / 34 |
| Unique month asset references | 29, all resolved; no upload |
| Schema validation | 0 errors / 0 warnings |
| Expected draft after publication | Absent |
| Expected published target after | Same reviewed content, new server revision |
| Expected inventory after | 0 drafts / 1 published lecture month / 85 image assets |
| Other mutation scope | None; settings, compact/public QR, NCR, Program, Announcement, News, speakers/rules/assets unchanged |

Canonical content SHA256:
`d18eb8c75642d32065fe509e9ba5f219a7d68c5989c7fc6cf4b538cb5fa547b6`.

Exact publication-plan SHA256:
`875b6e19e4fcbbad4b5c741a46dc815770b6aa8536fbad5ea146c18ddf4aa160`.

The content digest excludes only server metadata and version ID; the plan digest
includes exact target/revisions/counts/references/payload/validation/expected state.
It is separate from the historical approved first-save fingerprint and does not
rewrite that evidence. The six approved U+2019 strings and matching portrait alt
are tested through actual publication preparation, simulator publish and read-back.

The compact mosque QR remains a renderer runtime source from published
`siteSettings.donationInfo.compactQr`, not a month reference or duplicated upload.

## Validation and current production state

- Lint and production build: pass; five-minute public revalidation unchanged.
- Enforced-required-field schema extraction: pass; no CMS schema fields changed.
- Real saved October schema/reference validation: 0 errors / 0 warnings.
- Full relevant tests, including publication eligibility/confirmation/conflicts,
  network failure/double submit/Unicode/state transitions, Save Draft, recurrence,
  PNG/PDF and public/outage/malformed regressions: 213 passed, 0 failed/skipped.
- Fresh actual Studio PNG: 3508×2480; PDF: one-page A4 landscape, rendered/reviewed.
- Current-state public contract: pass; historical Fasa 4.3 evidence untouched.
- Production HTTP smoke: homepage, Profil, Organisasi, Surau, Galeri, Hubungi and
  Studio return 200; `/kuliah` remains 404.
- Controlled execution authenticated before/after comparison: only the exact
  draft/published month changed. The October draft was removed. Final state:
  0 drafts, 1 published lecture month, 0 lectureSpeaker, 0 lectureRule,
  85 image assets; Program 1, Announcement 0, News 1.
- Published revision `zVZDfWLj75qTdy5eh9rsNA`; 30 dates / 34 sessions /
  29 resolved portraits; content fingerprint unchanged and showInfaq true.
- Original Unicode guard failure, failed plan, approved replacement, execution
  audit and GPL/unresolved combined-application licensing evidence remain unchanged.
- Public /kuliah and homepage lecture integration have not started.
- Final checkpoint/validation: [LECTURE-PUBLICATION-CLOSEOUT.md](LECTURE-PUBLICATION-CLOSEOUT.md).

## Files changed

Runtime under `src/sanity/tools/lecture-generator/`:

- `publication.ts` — exact read-only plans, supported guarded action, read-back and service latch.
- `usePublicationWorkflow.ts` — eligibility, single-use confirmation, progress/conflict/uncertain states.
- `PublishConfirmation.tsx` — accessible modal review and explicit confirmation.
- `StudioLectureGenerator.tsx` — authenticated validation/publication adapter.
- `draft-persistence.ts` — optional publication adapter contract and shared target assertion; Save Draft behavior preserved.
- `useDraftWorkflow.ts` — synchronized published result/status and subsequent draft edits.
- `LectureGeneratorTool.tsx` — guarded button, modal, visible revisions and CMS-only copy.
- `generator.module.css` — responsive modal styling.
- `model.ts` and `LecturePoster.tsx` — presentation-only published review state; existing draft/demo artwork unchanged.

Tests:

- `scripts/lecture-generator/publication-simulator.mjs`
- `scripts/lecture-generator/publication.test.mjs`
- `scripts/lecture-generator/publication-ui.test.mjs`

Canonical documentation:

- `README.md`
- `docs/PROJECT-STATE.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/PROJECT-JOURNEY.md`
- `docs/SANITY-LECTURE-GENERATOR.md`
- `docs/LECTURE-PUBLICATION.md`
- `docs/LECTURE-FIRST-PUBLICATION-DRY-RUN.json`

The exact publication plan and execution records remain immutable history.
Fasa 5.3C is complete; stop after this checkpoint without starting public integration.
