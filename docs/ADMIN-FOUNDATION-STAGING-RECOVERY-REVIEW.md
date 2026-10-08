# Fasa 6.1B-2 — Staging Primary TOTP recovery review

Historical review below. Owner subsequently authorized the minimum patch,
staging deployment and controlled recovery in Fasa 6.1B-2R. Current results:
[MFA recovery verification](ADMIN-FOUNDATION-MFA-RECOVERY-VERIFICATION.md).

8 October 2026 (+08:00). **Prepared for owner review; no factor reset/removal,
runtime patch or deployment has been performed. Fasa 6.1 remains open.**

## Exact target and current evidence

Dedicated staging only: masjid-mtu-admin-staging, azypohqpupphapasweln,
https://azypohqpupphapasweln.supabase.co, Singapore.
Application: https://masjid-mtu-admin-staging.vercel.app.
Source/main remains 05a1e394c2dce9a6c816020072e5bc9c3d466540;
deployed source remains 79a87e97c16573968eb4c57d0b19e421d6f7fba0.

The isolated test identity is bound by the accepted bootstrap invitation and
system audit correlation recorded in the external bootstrap state. Do not name
or enter a real owner's identity. No personal email belongs in this document.

Owner confirms one authenticator device and one remaining local entry after
deleting entries while trying to obtain fresh codes. Primary was verified during
initial enrollment, but its later challenges return invalid TOTP. The one remaining
entry successfully verified Backup after the owner explicitly selected Backup.
Readback at 2026-10-07T17:40:51Z / 8 October 01:40:51 +08:00 confirms AAL2 using
Backup, TOTP AMR age=75 seconds, two Auth-verified factors and eight audit rows.
Recovery custody is consequently incomplete; independent backup custody is unproven.

## Application gap found; minimum proposed patch

Current MfaPanel chooses the enrollment friendlyName from factors.length:
zero -> Primary authenticator; one -> Backup authenticator.
The pinned Auth SDK requires friendlyName to be unique for the user's factors.
If the lost Primary is removed while the verified Backup is preserved, the
existing UI would attempt the existing Backup name instead of replacement Primary.
This is a recovery gap, not evidence that Supabase accepted invalid Primary codes.

Proposed minimum change, **not implemented**:

1. Determine the missing approved factor label from verified factor names:
   Primary missing -> enroll Primary; otherwise Backup missing -> enroll Backup;
   both present -> keep enrollment disabled.
2. Keep the selected existing factor stable across factor-list reloads; choose
   Primary deterministically for an initial default when it exists. This avoids
   depending on unspecified Auth response order. No claim that it caused the
   earlier owner-observed sequence.
3. Leave authorization, two-factor UI limit, QR/seed memory-only handling, AAL2,
   signed AMR/recent-MFA guards and audited foundation operations unchanged.
4. Do not add a general factor-removal UI, reset endpoint, privilege key in runtime,
   module, new migration or another super_admin.
5. Test reversed factor order, explicit selection preservation, Backup-only
   replacement-Primary enrollment, Primary-only Backup enrollment and both-factor
   disabled state, plus actual local Auth name uniqueness. Run lint, TypeScript,
   production Webpack build and affected MFA browser/security checks after code
   changes. A fresh staging deployment needs an explicit reviewed follow-up.

## Controlled recovery sequence for a later approved follow-up

Complete and validate the replacement-enrollment path before removing any factor.

1. Re-read the exact staging project/provider/hook/migration/identity binding.
   Confirm precisely one isolated test profile, the correlated bootstrap audit,
   the lost verified Primary, and the retained verified Backup. Match IDs from
   trusted Auth metadata; never select by browser-supplied authority.
2. Owner personally challenges Backup again. Verify real AAL2 and recent TOTP;
   preserve that local entry. Use independent project-owner access for operator
   recovery approval/custody. Do not depend on another application super_admin.
3. Record a correlated recovery authorization through the protected project
   operator procedure. For any membership mutation, require its audit atomically.
4. Use the supported Supabase Auth MFA unenroll API under the owner's AAL2 session,
   or a separately reviewed Auth Admin recovery operation, to remove **only the
   lost Primary ID**. Do not use direct SQL DELETE/UPDATE on auth tables.
   Verified user-factor unenrollment requires AAL2 in Supabase.
   A privileged Auth Admin key, if that fallback is actually needed, must be
   entered/used only in a secure operator workflow, never chat/repo/Vercel runtime.
   No privileged credential has been requested, read or provisioned for this plan.
5. Auth operations and the application's PostgreSQL audit are separate service
   transactions. Do not claim cross-service atomicity. Record authorization,
   inspect the supported Auth result/readback and append a correlated completion;
   stop/reconcile a partial failure instead of pretending an atomic rollback.
6. Owner enrolls a new Primary through the reviewed replacement path, saves its
   entry, enters the code privately, and demonstrates AAL2 with that exact new
   factor. Do not retrieve/reuse the deleted local seed or print a new seed.
7. Independently demonstrate retained Backup still restores AAL2; confirm labels
   are distinguishable. A single-device two-entry staging drill can demonstrate
   factors, but does not satisfy independent owner recovery custody.
8. Recheck no direct access/promotion and append-only audit, close unnecessary
   sessions, and report exact counts. Preserve historical audit evidence.

No membership disable, role change, factor removal or re-enrollment is authorized
merely by this review document. No action above has been executed. Current test
identity/factors are retained minimally because controlled recovery and owner
review remain outstanding; no other ordinary test identity or pending invite exists.

## References and open gates

[Hosted evidence](ADMIN-FOUNDATION-HOSTED-AUTH-VERIFICATION.md).
[Approved custody and operator recovery](ADMIN-FOUNDATION-PLAN.md).
[Supabase factor unenrollment](https://supabase.com/docs/reference/javascript/auth-mfa-unenroll).
[Supabase enrollment reference](https://supabase.com/docs/reference/javascript/auth-mfa-enroll).
The uniqueness requirement was read directly from the installed pinned Auth SDK
src/lib/types.ts enrollment contract; the node_modules file is not committed.

Real-owner onboarding, independent Vaultwarden/project-owner recovery material,
production provisioning and Fasa 6.2/7 are excluded. Missing separate Google test
identity, ordinary invitation/role/status matrix, direct authenticated API bypass,
explicit refresh-only recency and provider revocation remain distinct hosted gates.
No commit/push, additional dependency, migration or runtime change.
