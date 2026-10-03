# Fasa 5.2A — Exact first draft-seeding dry-run
Prepared **3 October 2026 (+08:00)** after the owner's architecture/content confirmations. **Review only: no uploads, Sanity mutation, draft creation, publication, commit or push.** The owner must explicitly approve this exact dry-run before execution.

This supersedes the earlier conditional three-document proposal. The executable scope proposed for later approval is **two draft creates and three original PNG uploads**. Genius Aulad is excluded because its required website publication date remains unresolved.

## Read-only production snapshot and exact revisions
Project `2o95jmms`; dataset `production`; raw perspective, including drafts and release versions. Read completed **2026-10-03 03:40:32 UTC / 11:40:32 +08:00**.

| Exact ID | Current state | Current revision |
| --- | --- | --- |
| `siteSettings` | Existing published singleton; neither new information group is populated | `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb` |
| `drafts.siteSettings` | Absent | None — no draft revision exists |
| `program-dapur-zohor-barakah` | Absent | None |
| `drafts.program-dapur-zohor-barakah` | Absent | None |
| `newsPost-lawatan-genius-aulad-bandar-kinrara` | Absent; excluded candidate | None |
| `drafts.newsPost-lawatan-genius-aulad-bandar-kinrara` | Absent; excluded candidate | None |

Published editorial: **announcement 0 / program 0 / newsPost 0**. Raw editorial inventory is also empty; no existing editorial drafts or release versions were found. No releases were found. Existing production remains **43 published base documents and 50 image assets**. No asset matches the three proposed original SHA-1 hashes. These are snapshot facts, not a guarantee that state will remain unchanged.

## Exact upload files and reference bindings
Only these three archived, byte-identical originals are proposed. Upload as `image/png` with the original filenames below, without cropping, resizing, re-encoding, recoloring or hotspot edits.

| Source | Original filename | Dimensions / size | Expected future asset ID |
| --- | --- | --- | --- |
| S01 | `codex-clipboard-06954715-856f-4e62-ac32-280a78778ea1.png` | 1080×761; 1,159,915 bytes | `image-62bee78573fc94f3a232528eefff834fa7ed11b4-1080x761-png` |
| S02 | `codex-clipboard-ca42a07a-0fad-4833-aa8a-0b8475ecb356.png` | 1131×1600; 2,682,866 bytes | `image-1a4abfdd734f4ef7b74aa4e8bdf3b0a5adb3d334-1131x1600-png` |
| S03 | `qr full.png` | 853×853; 343,402 bytes | `image-6ba112c3ffc0107ea20e277aa11ff0729eba926b-853x853-png` |

Local upload paths and SHA-256 hashes:
- **S01**: `C:/Users/User/Documents/Codex/2026-10-02/files-pasted-by-the-user-mtu/outputs/phase-5.2a-sources/S01-codex-clipboard-06954715-856f-4e62-ac32-280a78778ea1.png`
  SHA-256: `f6e5ea54b5899515438f24bbe2bd61f3194d9f709794f2eff7f0f72c9901e0db`
- **S02**: `C:/Users/User/Documents/Codex/2026-10-02/files-pasted-by-the-user-mtu/outputs/phase-5.2a-sources/S02-codex-clipboard-ca42a07a-0fad-4833-aa8a-0b8475ecb356.png`
  SHA-256: `b0b5781e2bbcd59fbd0f19d4059e50a608fd542525f89c6115325a48f3799daa`
- **S03**: `C:/Users/User/Documents/Codex/2026-10-02/files-pasted-by-the-user-mtu/outputs/phase-5.2a-sources/S03-qr full.png`
  SHA-256: `8b9222e5b6385d72b1fa6c4a4372852bc4c838eb933de43b9f8412fa6b62b17e`

The asset IDs above are **expected content-addressed IDs, not existing uploaded records**. The later upload response must match the expected ID, original SHA-1, size, MIME and dimensions before any draft reference is bound. A mismatch stops execution for review. If an identical asset appears after this snapshot, reuse it only after verifying those properties; do not update its metadata. No custom asset tags, titles or unrelated metadata patches are proposed. Sanity-generated asset metadata and creation timestamps are assigned by Sanity.

S01 → settings NCR poster; S02 → ongoing Program poster; S03 → general mosque donation QR. **S05 Dapur QR stays separate and is not an upload in this batch.** S04 bare QR, S06 invitation and S07 Genius screenshot/image are also excluded. The supplied Dapur poster is preserved in full, including its original payment instructions; its embedded QR is not repurposed for general donations.

## Draft 1 — Dapur Zohor Barakah
**Create only** `drafts.program-dapur-zohor-barakah`; its eventual published counterpart would be `program-dapur-zohor-barakah`. No published Program is created.

The owner confirmed launch **28 September 2026 (Monday)**, starting price, refill, hours/days, QR-only/no-cash policy and congregational-Zohor purpose. Additional organizer/meal/extra-dish copy is taken from S02 and retained from the approved preparation. The description is **356 characters**. Date-only launch remains in the description. **startAt, endAt and registrationUrl are omitted**; no launch clock time or end date is invented.

Exact complete draft payload, after verified asset upload:
```json
{
  "_id": "drafts.program-dapur-zohor-barakah",
  "_type": "program",
  "title": "Dapur Zohor Barakah",
  "slug": {
    "_type": "slug",
    "current": "dapur-zohor-barakah"
  },
  "category": "Inisiatif komuniti",
  "scheduleType": "ongoing",
  "description": "Dikendalikan oleh Biro Muslimat MTU sejak 28 September 2026 untuk menggalakkan solat Zohor berjemaah. Isnin–Khamis, 11.00 pagi–2.00 petang. Makan tengah hari bermula RM6: nasi putih, ayam seketul, air dan sayur. Nasi dan air boleh ditambah tanpa caj. Harga lauk tambahan mengikut harga semasa bahan mentah. Bayaran QR masjid sahaja; tunai tidak disediakan.",
  "venue": "Masjid Talhah Bin Ubaidillah",
  "isActive": true,
  "displayOrder": 1,
  "image": {
    "_type": "editorialImage",
    "asset": {
      "_type": "reference",
      "_ref": "image-1a4abfdd734f4ef7b74aa4e8bdf3b0a5adb3d334-1131x1600-png"
    },
    "alt": "Poster Dapur Zohor Barakah, inisiatif Biro Muslimat MTU, dengan waktu operasi, harga makanan dan kaedah bayaran."
  }
}
```

`isActive: true` describes eligibility **after a future separately authorized publication**. It does not publish the draft.

## Draft 2 — Existing siteSettings extension
**Create only** `drafts.siteSettings`, cloned from published `siteSettings` at revision `mtu-4-3c-6a191d7e-4169-419b-91d2-4def7a024fcb`, with only `ncrService` and `donationInfo` added. This is the existing singleton's draft, not another settings singleton.

Preserve all existing fields and office-hours keys exactly. `shortName` is currently absent and remains absent. Do not send `_rev`, `_createdAt` or `_updatedAt` in the new draft payload; Sanity assigns new draft metadata. The published singleton is not patched.

Both officer roles and their shared heading use the owner's exact **Penolong Pendaftar Nikah, Cerai & Ruju’ (NCR)** wording. General donation uses only the full S03 branded QR; there is no secondary/Dapur QR field.

Exact complete draft payload, after verified asset upload:
```json
{
  "_id": "drafts.siteSettings",
  "_type": "siteSettings",
  "address": "MASJID TALHAH BIN UBAIDILLAH\nTAMAN ALAM SUTERA\n57000 BUKIT JALIL\nWILAYAH PERSEKUTUAN KUALA LUMPUR",
  "email": "masjidtalhahubaidillah@gmail.com",
  "facebookUrl": "https://www.facebook.com/masjidtalhahkl",
  "instagramUrl": "https://www.instagram.com/masjidtalhahubaidillahofficial/",
  "mosqueName": "Masjid Talhah Bin Ubaidillah",
  "officeHours": [
    {
      "_key": "hours-1",
      "_type": "officeHoursRow",
      "days": "Isnin – Jumaat",
      "hours": "9:00 pagi – 5:00 petang"
    },
    {
      "_key": "hours-2",
      "_type": "officeHoursRow",
      "days": "Sabtu, Ahad dan Cuti Umum",
      "hours": "Tutup"
    }
  ],
  "phone": "+60 3-8074 7414",
  "ncrService": {
    "_type": "object",
    "heading": "Penolong Pendaftar Nikah, Cerai & Ruju’ (NCR)",
    "introduction": "Untuk pertanyaan berkaitan urusan nikah, cerai dan ruju’, hubungi pegawai yang disenaraikan.",
    "officers": [
      {
        "_type": "object",
        "_key": "ncr-wan-halim",
        "name": "USTAZ WAN HALIM BIN MD.YUSOFF",
        "role": "Penolong Pendaftar Nikah, Cerai & Ruju’ (NCR)",
        "phone": "019 374 9937"
      },
      {
        "_type": "object",
        "_key": "ncr-nik-fadlan",
        "name": "USTAZ NIK MUHAMMAD FADLAN BIN NIK MAHMOOD",
        "role": "Penolong Pendaftar Nikah, Cerai & Ruju’ (NCR)",
        "phone": "011 2937 8366"
      }
    ],
    "poster": {
      "_type": "editorialImage",
      "asset": {
        "_type": "reference",
        "_ref": "image-62bee78573fc94f3a232528eefff834fa7ed11b4-1080x761-png"
      },
      "alt": "Poster Penolong Pendaftar Nikah, Cerai & Ruju’ Masjid Talhah Bin Ubaidillah dengan dua pegawai dan nombor telefon."
    }
  },
  "donationInfo": {
    "_type": "object",
    "heading": "Sumbangan umum masjid",
    "copy": "Gunakan DuitNow QR rasmi masjid untuk sumbangan umum. Semak nama penerima sebelum mengesahkan transaksi dalam aplikasi bank atau e-dompet anda.",
    "recipientLabel": "Masjid Talhah Bin 'Ubaidillah, Bukit Jalil — sumbangan umum",
    "primaryQr": {
      "_type": "image",
      "asset": {
        "_type": "reference",
        "_ref": "image-6ba112c3ffc0107ea20e277aa11ff0729eba926b-853x853-png"
      },
      "alt": "Artwork penuh DuitNow QR sumbangan umum Masjid Talhah Bin 'Ubaidillah, Bukit Jalil, dengan jenama DuitNow dan Bank Islam."
    }
  }
}
```

The existing public presentation retains **Hubungi pihak masjid**, **Buka imej QR** and the approved responsive layout. Those labels are already implemented in the component; no new settings fields or runtime edits are needed.

## Genius Aulad — STOP: required date missing
The owner approved this as the first News candidate. Proposed future ID: `newsPost-lawatan-genius-aulad-bandar-kinrara`; draft ID: `drafts.newsPost-lawatan-genius-aulad-bandar-kinrara`.

**No News payload, draft creation or News image upload is included in this dry-run.** Schema field `publishedAt` is required, and no timestamp has been sourced or explicitly approved. The supplied S07 screenshot has no Facebook post timestamp; “hari ini” does not establish an absolute date. Event date and original Facebook source date remain unknown and must not be replaced with today's date.

Missing prerequisite: **a sourced or explicitly owner-approved website `publishedAt` date/time with timezone**. If the original Facebook date is later supplied, record it separately as provenance; it is not automatically the website publication date. Do not add unmodeled provenance fields to the News document. After the required date is resolved, prepare a separately reviewed exact News payload and any approved image binding. Do not silently extend this two-document batch.

Qiam/Bubur Asyura remains **HOLD**: supplied material is an invitation, not a completed-event report. No participant numbers or completed-event claims are invented.

## Execution boundary after future explicit approval
1. Repeat raw target-ID/slug/asset checks and verify the full published settings payload and revision before any upload. Stop on changed revision/payload, an existing target draft or any editorial ID/slug collision.
2. Upload/reuse only the three verified original files, and verify returned asset properties. References must equal the expected IDs in the payloads above.
3. Immediately before draft creation, repeat settings revision/payload and absence/collision checks. Create the two drafts with strict create semantics in one transaction. Never use createIfNotExists/createOrReplace, overwrite another draft or patch a published record.
4. Read back both drafts and verify all exact fields, preserved base settings, approved references and unchanged published content. Leave drafts unpublished.

The revision rechecks are read-time guards, **not an atomic lock on the published singleton across draft creation**. Preserve this captured source revision and detect/report intervening changes; any later publication requires fresh comparison and separate authorization. Do not patch the published document merely to obtain a guard.

Allowed future effects: up to **3 approved image asset creates and 2 draft creates**. **0 existing-document patches, published writes, deletes or publications.** No unrelated records will be touched: all existing published base records and their image assets are read-only, all announcement/News/lecture records are excluded, and existing homepage mocks remain outside CMS. No Lecture Generator, Supabase/admin/campaign/payment, Fasa 5.3, commit, push or tag operation is included.

## Local dry-run validation
- Both full draft payloads validate against the current local schema: **0 errors, 0 warnings**.
- Expected future asset references were mapped to known planned placeholders **only in local validation copies**; no claim of uploaded asset existence is made.
- Settings base fields/office-hours keys match the read-only published snapshot exactly.
- Source SHA-1/SHA-256, PNG dimensions and byte sizes match; archived originals match their supplied files.
- Ongoing Program has no invented datetime/end date; NCR heading/roles/names/phones match owner confirmation; general donation QR has no crop/hotspot or Dapur-purpose substitution.
- Local held-News validation reports the expected **Required publishedAt** error. News and its image remain excluded.

Machine-readable exact snapshot, assets, preconditions and draft values: [EDITORIAL-DRAFT-SEEDING-DRY-RUN.json](EDITORIAL-DRAFT-SEEDING-DRY-RUN.json). No executable production writer has been created or invoked for this batch.

## Subsequent execution/publication status — dated history

The exact proposal and frozen JSON above remain the approved pre-execution record. Owner later authorized the three asset uploads/two draft creates, reviewed Studio drafts, approved the website donation alt/recipient spelling correction, and published only those two documents. Final donation heading/copy was separately approved and republished through one settings draft. Fasa 5.2A is now completed; see [EDITORIAL-PUBLICATION-CLOSEOUT.md](EDITORIAL-PUBLICATION-CLOSEOUT.md) for current revisions, counts, final copy and checkpoint. No News/Announcement/lecture scope was added.
