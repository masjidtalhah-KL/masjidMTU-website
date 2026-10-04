# Fasa 5.3B — authenticated draft persistence

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

## Implementation / refinement record before execution (historical)

Implemented locally on 4 October 2026 (+08:00), from commit
`27e23a2528c72144a1fe7e0d5ecbd45dc3343912` /
`phase-5.3a-lecture-generator-ux`. Awaiting owner review and explicit first-write
approval. No production upload/mutation, publication, commit or push.

## Lifecycle and write boundary

The Studio tool obtains its client from `useClient` and checks `useCurrentUser`.
It uses authenticated raw reads, no CDN, no mutation retries and the existing
Studio session; it imports no private environment token. Public website reads
remain separate, published-only and server-only with five-minute revalidation.

Month loading prefers `drafts.lectureMonth-YYYY-MM`, then
`lectureMonth-YYYY-MM`, then a local snapshot generated from published active
rules. Published speaker/rule libraries are read-only in this phase. With no
rules, a new month is empty with an explicit warning; never substitute demo data.
Selecting a month/year performs reads only, never creates a document.

Manual **Save Draft** is enabled after authenticated loading. It prepares and
schema-validates an exact plan, then calls the guarded save service. The compiled
`draft-approval.ts` approval is deliberately `undefined`: all production uploads
and actions are rejected until the owner approves the first exact plan. There is
no browser checkbox/environment flag that bypasses approval. The approved source
snapshot is staged separately in the dry-run record, not automatically injected
into an empty Studio month. A future approved execution must use its exact payload
and original assets; approving this implementation does not authorize different
local edits. Enabling later operational saves requires an explicit scope decision.

The physical save path is implemented and tested against an in-memory Actions
contract simulator. It has **not** been exercised against production. An approved
first execution must complete fresh guards and authenticated read-back before
claiming persistence success. **Publish Jadual** remains disabled, without handler,
shortcut, publish action, public `/kuliah`, or homepage lecture feed.

## Revision and state protection

Retain both draft and published `_rev` values from loading. Recheck before plan
preparation, before upload, after upload and after the document action. Updating
an existing draft sends `patch.ifRevisionID`; a new month uses document-create
with `ifExists: fail`. From a published base, an atomic Actions transaction clones
the base with `ifBaseRevisionId` and replaces only the new draft payload. The
installed Studio uses the same version-create API for copying a version to drafts,
discarding an existing target first; this implementation never discards a target.
See [Sanity Actions API](https://www.sanity.io/docs/http-reference/actions) and
[version base-revision guards](https://www.sanity.io/docs/apis-and-sdks/js-client-releases).

Compare the complete read-back draft content with the canonical payload, verify
the published revision remains unchanged, then retain the saved revision. A
second loading read must match the verified revisions too. Conflicts, auth/query
errors, validation failures and uncertain responses remain visible. No automatic
retry, complex auto-merge, published patch, rollback or asset deletion occurs.
Uploaded assets can remain if a subsequent conflict prevents the draft write;
prepare again to discover/reuse them after review.

Operational UI is English-first. Statuses include Not saved, Loading month,
Saving, Draft saved, Based on published version, Unsaved changes and Revision
conflict. Malay mosque/domain terminology and poster-facing copy remain intact. Editing is
disabled during load/save. Dirty month switching requires an explicit choice;
local working months and their infaq flags remain in memory. Reload fetches remote
for review without replacing local state; an explicit remote-selection action
keeps a memory backup. These buffers are not durable and disappear on page reload.
Dirty page exit has a browser beforeunload guard. No autosave.

## Canonical monthly snapshot

One explicit `month-document.ts` conversion layer persists:

```text
lectureMonth: _id, _type, year, month, showInfaq, entries[]
  lectureDay: _key, _type, date, isManualOverride, sessions[], specialPoster?
    lectureSession: _key, _type, sessionType, speaker?, speakerName?,
                    topic?, photo?, photoLayout?, sourceRule?
    specialPoster: image, mode=full, fit=cover|contain, position=top|center|bottom?
```

Validate stable month identity, year/month, real ISO dates in that month, duplicate
dates/keys, at most two valid sessions, snapshot names, correctly typed published
references, image/alt, poster shape and manual override, fit/position and boolean
showInfaq. Unsupported month/day/session fields fail visibly rather than being
silently erased. Runtime URLs, File objects, hashes, QR copies and merged geometry
are excluded. Cleared manual days remain entries. Rules are provenance/defaults;
the saved monthly snapshot does not depend on later rule changes.

Selected speakers retain their reference plus display-name and portrait reference
snapshots; topic is the edited session value. Loaded snapshots win over subsequent
library changes, including an explicitly absent portrait. Changing the selection
explicitly resets the old snapshot. The only additional schema field is optional
`lectureSession.photoLayout` (fit, positionY, zoom, borderInset), preserving existing
portrait rendering values across persistence without resizing/re-encoding images.
No new editing controls are added for those values.

Special posters retain original PNG/JPG/WebP File bytes until an approved save.
SHA-256 verifies the source; SHA-1/dimensions/format derive the Sanity asset ID.
Reuse an existing matching asset or upload once per unique hash. Multiple dates
reference the same asset. Never persist blob/data/filesystem URLs. Existing CMS
crop metadata requiring an unsupported stored crop fails visibly for review.
Full poster takeover, reversible underlying sessions, cover/contain/position and
the approved calendar/keyboard workflow remain unchanged.

Resolve general mosque infaq from published `siteSettings.donationInfo.compactQr`
at runtime. Store only showInfaq. Missing/unusable configuration omits the panel
with a Studio warning and leaves the month usable; no fabricated, branded fallback
or Dapur QR. Compact QR requires square dimensions, alt and no crop/hotspot.
Public donationInfo.primaryQr remains unchanged.
The 5.3A adaptive placement algorithm and geometry remain renderer-derived.
Exports may embed only same-origin assets or the explicitly allowed project/dataset
public image CDN, sending no Studio credentials to the CDN. Preview/export remain
shared-renderer paths. Working output has a draft review label.

## Exact first-save proposal

Use the original owner `jadual-talhah-semua-bulan.json`, month key `2026-10`, whose
independent name/topic/order/photo QA is recorded in [SANITY-OCTOBER-QA.md](SANITY-OCTOBER-QA.md).
Reference source commit: `378b1bbb4084b4f7b6c55ac70a5c4f769d221d28`.
Technical source QA is not automatic approval to migrate the content.

[LECTURE-FIRST-SAVE-DRY-RUN.json](LECTURE-FIRST-SAVE-DRY-RUN.json) contains the
**complete payload, every asset ID/filename/dimension/size/SHA-1/SHA-256, all
references, source provenance and exact plan fingerprint**.

| Guard / action | Proposed value |
| --- | --- |
| Project / dataset | `2o95jmms` / `production` |
| Month / operation | October 2026 / create exactly one draft |
| Document | `drafts.lectureMonth-2026-10` |
| Draft revision / published base revision | both absent (`null`) |
| Snapshot | 30 real-date entries, 34 sessions; date 31 is genuinely empty |
| Type counts | Subuh 8, Maghrib 16, Jumaat 5, Yasin 5 |
| Assets | 29 original portraits; 29 new, 0 remotely reused at inspection |
| References | 29 image IDs; no speaker/rule references invented |
| Speaker/rule documents | none created; names/topics/photos stored as snapshots |
| Compact QR / special posters | separate QR setup; no special poster migration; showInfaq=true |
| Draft count | 0 → 1 |
| Image asset count | 56 → 85 after separate compact-QR setup, with 29 portraits in month batch |
| Published documents | no change; 0 published lecture documents |

Source SHA-256: `ebddec2e34efce4f5e1447bd642e86a8f40d28e291f5780cdb69654955413795`.
Plan fingerprint: `906611b8069b1c07b105da950be4f6b7cedd6d1a79a5357e912faee6e3264bb8`.
The month payload/fingerprint is unchanged but does not authorize the new QR
setup. Approve the original QR upload and settings draft separately; review and
separately approve settings publication, then refresh and approve the month plan.
Combined images: 55 → 56 → 85; published lecture count stays 0. See
[complete QR/settings proposal](LECTURE-COMPACT-QR-DRY-RUN.json).
Before any future execution, fresh target/absence/revision/count/source-hash and
reference guards must match this record. Stop if anything differs.

GPL/provenance notices and D18's unresolved combined-application licensing decision
remain intact. Portrait provenance is listed in the plan; no new upstream
implementation code was copied. No licensing conclusion or deployment approval
is implied by this local implementation.

## Verification and remaining review

Lint, TypeScript, production build and enforced schema extraction passed. All eight
automated suites pass (**187 tests**, including 25 draft-persistence tests), including serialization/create/update/conflict/snapshot,
asset reuse, React dirty-switch/reload, missing donation, recurrence/manual override,
shared renderer and public outage/malformed regressions. Exact proposed payload
passes the real schema with **planned asset references only**, not a claim that
those new assets already exist remotely. Production HTTP route smoke passed.

Owner review previews are running:

- Authenticated Studio: `http://127.0.0.1:3002/studio/penjana-jadual-kuliah`.
  This origin already has credential-enabled CORS; no CORS settings were changed.
- Isolated UI fixture: `http://127.0.0.1:3022/draft-review`. No Sanity client
  instance, credentials, upload or mutation; it simulates the empty lecture state
  and uses the byte-identical QR-only local original, not published configuration.

Fresh browser access now works. Authenticated desktop (1440) and mobile (375)
Studio were reviewed, including keyboard date selection and no horizontal
overflow. The isolated QR fixture supplies local-only artwork. Actual browser PNG
and PDF exports for July/October/March 2026 cover 2-cell, 3-cell and 6-cell capped
groups. All three PNGs and all three PDF pages were visually inspected. Weekdays
retain font/size/weight; QR has no crop, overlay or recolour. These are new proofs;
the earlier blocked attempt remains historical. See
[refinement and exact setup gates](LECTURE-UI-COMPACT-QR-REFINEMENT.md).

Authenticated Studio create/clone/update endpoints also await the approved first
production execution. Do not label those checks as production-tested.

Read-only current-state parity retains the published fingerprint
`7fc9e5a0b248b2350576b9c291cd7ccf49d895d6ebfff5e48ce819328c7692ce`.
Authenticated before/after inventory comparison verifies the dataset is unchanged:
0 drafts, 0 lecture documents, 45 published non-asset documents, 55 images,
1 Program, 0 Announcement and 1 News. No commit/push/checkpoint is authorized here.

## Files changed

- `README.md`, `package.json`
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`,
  `docs/LECTURE-GENERATOR-UX-RECOVERY.md`, `docs/PROJECT-JOURNEY.md`,
  `docs/PROJECT-STATE.md`, `docs/ROADMAP.md`, `docs/SANITY-CONTENT-MODEL.md`,
  `docs/SANITY-LECTURE-GENERATOR.md`, `docs/LECTURE-DRAFT-PERSISTENCE.md`,
  `docs/LECTURE-FIRST-SAVE-DRY-RUN.json`
- `src/sanity/schemaTypes/lectureMonth.ts`
- `src/sanity/tools/lecture-generator/StudioLectureGenerator.tsx`,
  `LectureGeneratorTool.tsx`, `LecturePoster.tsx`, `index.tsx`, `model.ts`,
  `local-poster.ts`, `export-poster.ts`, `generator.module.css`,
  `month-document.ts`, `draft-persistence.ts`, `draft-approval.ts`,
  `useDraftWorkflow.ts`
- `scripts/lecture-generator/draft-persistence.test.mjs`

The complete current file inventory is in the refinement record. Temporary source/HTTP/schema/test artifacts and the
isolated fixture live outside the repository. Public app/read layers and the
historical October QA/GPL notices are unchanged.
