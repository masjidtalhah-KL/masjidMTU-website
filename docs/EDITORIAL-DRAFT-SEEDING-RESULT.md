# Fasa 5.2A — Authorized draft seeding and authenticated verification
Executed **3 October 2026** following explicit owner approval of the exact two-draft/three-asset dry-run. Draft creation time **2026-10-03 05:03:06 UTC / 13:03:06 +08:00**. **Draft-only complete; stop for Studio review. No publication, commit, push or Fasa 5.3 work.**

## Fresh guards before mutation
Authenticated target: **Masjid Talhah Bin Ubaidillah**, project **2o95jmms**, organization **o5cig7je6**, dataset **production**. Both target drafts were absent, and published `siteSettings` still exactly matched the approved payload and revision `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb`.
All three source SHA-1/SHA-256 hashes, PNG dimensions and sizes matched the approved plan. The canonical plan matched its reviewed output copy. Exactly the two approved payloads were used, with no copy/date/ID/mapping changes and no News/Announcement document. The pre-create absence/revision checks were repeated after uploads; all passed.

The original dry-run [JSON](EDITORIAL-DRAFT-SEEDING-DRY-RUN.json) is retained unchanged as the approval record; its pre-execution status is historical.

## Exactly three uploaded assets
Each is a new asset uploaded in this run; no pre-existing asset was reused, edited or deleted. Original filenames are preserved. No custom asset metadata patches or image transforms were submitted.

| Source | Sanity asset ID | Authenticated SHA-1 | Source SHA-256 |
| --- | --- | --- | --- |
| S01 NCR poster | `image-62bee78573fc94f3a232528eefff834fa7ed11b4-1080x761-png` | `62bee78573fc94f3a232528eefff834fa7ed11b4` | `f6e5ea54b5899515438f24bbe2bd61f3194d9f709794f2eff7f0f72c9901e0db` |
| S02 Dapur poster | `image-1a4abfdd734f4ef7b74aa4e8bdf3b0a5adb3d334-1131x1600-png` | `1a4abfdd734f4ef7b74aa4e8bdf3b0a5adb3d334` | `b0b5781e2bbcd59fbd0f19d4059e50a608fd542525f89c6115325a48f3799daa` |
| S03 general mosque QR | `image-6ba112c3ffc0107ea20e277aa11ff0729eba926b-853x853-png` | `6ba112c3ffc0107ea20e277aa11ff0729eba926b` | `8b9222e5b6385d72b1fa6c4a4372852bc4c838eb933de43b9f8412fa6b62b17e` |

Sanity asset size/MIME/dimensions and hashes match the approved sources. S01/S02 CDN delivery also matched original SHA-256 byte for byte. For S03, authenticated Sanity `sha1hash`, size and original file match approval, while CDN delivery has a different PNG container encoding (345,202 bytes versus source 343,402). An additional decoded RGBA comparison found **all pixels identical** at 853×853. Delivered SHA-256: `7c666e6ba5ae5a10b19732ae2209a737f44e5268156b6b9df3f3cc78285f5180`. No cropping, resizing, recoloring or frontend change was requested/performed. This CDN observation is retained for Studio review, rather than claiming delivery byte identity.

## Exactly two created drafts
| Exact draft ID | Read-back revision |
| --- | --- |
| `drafts.program-dapur-zohor-barakah` | `chGo6kzbOkh09ebDsCRTSZ` |
| `drafts.siteSettings` | `chGo6kzbOkh09ebDsCRTVa` |

The create call reported **2 successful, 0 failed**. Authenticated raw read-back matched every approved payload field after excluding only Sanity-assigned `_rev`, `_createdAt`, `_updatedAt`. Total dataset draft count is **2**, consisting solely of these records. There are no News/Announcement drafts or release versions.

Dapur retains **ongoing**, approved facts/poster, `isActive: true`, display order 1, and no `startAt`, `endAt` or registration URL. It is unpublished, so active eligibility does not make it public.

## Published state and settings diff
- All **43 published base/editorial documents**, including payloads and revisions, are exactly unchanged versus the fresh pre-write authenticated snapshot.
- Published **program 0 / announcement 0 / newsPost 0**.
- Published `siteSettings` remains at revision `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb`, with neither new group added.
- `drafts.siteSettings` preserves all existing base fields: mosqueName, address, phone, email, facebookUrl, instagramUrl, officeHours and their original keys/types. Absent shortName stays absent.
- Only two content fields are added: **ncrService** (confirmed heading/intro/two officers/S01 poster) and **donationInfo** (approved heading/copy/recipient/S03 QR).
- Draft system ID/revision/timestamps differ as expected; these are creation metadata, not source/event/publication dates.
- All **50 pre-existing image assets**, including their revisions/hash/size/MIME/dimensions/filenames, are unchanged. Total image assets now **53**, with exactly the three approved additions.

## Validation and references
The exact authenticated read-back documents pass current local Studio schema validation: **2 documents, 0 errors, 0 warnings**. Reference existence is checked against the authenticated snapshot and confirmed by GROQ dereferencing: **all 3 approved image references resolve**, with exact matching asset IDs/hashes.
Raw inventory confirms no slug conflict. The entire settings base comparison and exact payload comparison pass. No write conflicts or unresolved errors remain.

The upload endpoint omits SHA-1 from its abbreviated success response. The initial local response check detected that omission; authenticated asset metadata verified the expected hash before continuing. No upload was repeated and no additional asset was created. The QR CDN byte-encoding check was resolved by the pixel comparison above.

## Exclusions and stop point
Genius Aulad stays excluded pending sourced/approved required website publishedAt; no image upload. Qiam/Bubur Asyura remains HOLD. S04 bare QR and S05 Dapur-specific QR were not uploaded or referenced. Existing mocks, Lecture Generator, Jadual Kuliah/Fasa 5.3, operational/admin/payment work and historical approvals remain untouched.
No publication tool, published patch, document deletion, Git commit, push or tag operation was performed. Public website still reads published content only.

Local audit artifacts outside the repository: pre/post authenticated snapshots, exact payload comparisons, source/asset metadata, QR delivery/pixel check and final JSON verification report. **Ready for owner Studio review; further mutation/publication requires separate authorization.**

## Subsequent owner approvals and publication

This report preserves the historical draft-seeding outcome and revisions above. The owner subsequently approved the donation visible/alt spelling correction, Studio review and controlled publication of both drafts. A final approved donation heading/copy refinement created and reviewed one new settings draft, then published it. Current state is 0 drafts / 1 Program / 0 Announcement / 0 News / 53 assets; Dapur remains active ongoing. Fasa 5.2A completed. See [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md); no historical JSON payload or source artwork was rewritten.
