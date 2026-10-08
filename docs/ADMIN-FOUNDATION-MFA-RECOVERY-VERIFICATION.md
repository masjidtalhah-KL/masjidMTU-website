# Fasa 6.1B-2R — MFA recovery verification

8 October 2026 (+08:00). Critical hosted recovery and final checks passed under
explicit owner authorization. **Fasa 6.1 implementation and verification complete;
owner-approved for closeout on 8 October 2026.** Owner authorizes the canonical
main commit/push and tag `phase-6.1-admin-foundation-complete`. No next phase started.

## Scope and source

Dedicated staging: masjid-mtu-admin-staging, azypohqpupphapasweln, Singapore;
https://masjid-mtu-admin-staging.vercel.app.
Git baseline: 05a1e394c2dce9a6c816020072e5bc9c3d466540.
Owner authorized deployment of the current uncommitted recovery patch and the
controlled Primary recovery in the [historical review](ADMIN-FOUNDATION-STAGING-RECOVERY-REVIEW.md).

## Minimum patch and local validation

`src/lib/admin/mfa.ts` selects the missing approved friendly name: Backup-only
offers Primary, Primary-only offers Backup, two factors disable enrollment.
The existing two-factor cap also applies to unknown labels. Selection preserves
a valid previous ID; an initial default prefers Primary independent of Auth order.
The component applies selection with a functional state update on list reload.
No authorization, roles, seed custody, AAL2, signed AMR, RLS or migration changed.
No removal UI, recovery endpoint or dependency was added.

| Check before deployment/factor mutation | Result |
| --- | --- |
| Lint / TypeScript | Passed |
| Production Webpack build, Next.js 16.3.6 | Passed |
| MFA helper / existing policy tests | 8/8 + 8/8 |
| PGlite database contracts | 28/28; supplementary evidence |
| Real local Supabase reset / full-stack matrix | 31/31, including genuine Auth `mfa_factor_name_conflict` with the original factor preserved |
| Browser suite | 22/22, including recovery labels/order, deny-first MFA, session isolation, public/Studio/Kuliah and PNG/PDF downloads |
| Production browser bundle scan | 248 chunks, no privileged secret value/import |

97 automated tests passed. Browser fixtures do not simulate successful Google or
TOTP verification. Name uniqueness was tested against genuine local Auth.
Initial build attempts encountered missing public Sanity values and sandbox EPERM;
the final build used the existing public configuration and normal workspace access.
TypeScript was repeated after build-generated types were stable. New test locator
defects were corrected before the final full browser suite passed.

Local reset applied the existing migration only. Running container readback:
PostgreSQL 17.11.0.003, Auth v2.187.0, PostgREST v14.5; CLI remains pinned 2.78.0.
No hosted migration or factor was mutated during these tests.

## Hosted ledger

| Gate | Result |
| --- | --- |
| Deployment READY / MFA labels | READY; genuine Backup-only screen offers Add primary authenticator |
| Fresh retained Backup challenge / AAL2 | Passed: genuine Backup AAL2 readback 00:07:38Z, age 60s |
| Supported API removal of only lost Primary | Passed: Auth Admin MFA DELETE; same verified Backup retained |
| Replacement Primary enrollment/challenge | Passed: owner saved new entry, verified privately and reached genuine Primary AAL2 |
| Retained Backup independent challenge | Passed after replacement: same original Backup ID, fresh real AAL2 challenge 00:25:09Z |
| Refresh-only signed AMR / stale mutation denial | Passed: same TOTP timestamp, natural age 632s, AAL2/recent=false, mutation 403 |
| Auth-issued direct API bypass matrix | Passed: direct real-session write/private/role/RPC/metadata checks |
| Safe live-membership boundary | Disabled/revoked rollback contracts passed with actual issued claims; no permanent lockout |
| Logout/relogin AAL1 / public transition regression | Passed: real Google relogin stays AAL1; Users redirects to MFA; five actual API checks deny privileged access |
| Final cleanup/counts | Passed: global Auth logout, zero sessions/live refresh records/pending invites; both factors and 12 audits preserved |

Readback 2026-10-07T23:52:18Z: one Auth identity, one active isolated super_admin,
Primary and Backup both verified, zero pending invites, eight audits. Interim only.

## Authorized staging deployment

Deployment `dpl_5EZM2KX68cK154fxWHbN5megXqqs` is READY.
Immutable URL: https://masjid-mtu-admin-staging-5chafbho1-korok.vercel.app.
Stable alias: https://masjid-mtu-admin-staging.vercel.app.
Canonical local source plus uncommitted patch deployed; no fork/Git source connected.
Vercel remote Next.js 16.3.6 Turbopack build passed, following the local Webpack
build gate. Eight required Production-target environment names remain present;
no service-role or other privileged runtime credential exists.
Fresh 8/8 HTTP checks passed: homepage, both Kuliah routes, Studio, Admin login,
signed-out Admin redirect and both denied anonymous Admin APIs. Public Sanity-backed
Kuliah still has 30 days/34 entries. No factor or hosted schema mutation occurred.
30 actual deployed browser chunks were scanned with no privileged credential/reference.
Bounded Vercel runtime window 2026-10-07T23:58:00Z–2026-10-08T00:02:43Z:
eight records, five 200, one 307 and two 401; zero 5xx/error/fatal/nested errors
or checked credential/seed patterns. This window covers the anonymous route smoke,
not the remaining human-operated recovery flow.

Interim readback 2026-10-08T00:04:12Z: one Auth user, one Google identity, one
active super_admin profile, one Auth session, two verified TOTP factors, zero
pending invites, one accepted and three revoked historical invites, eight audits.
No cleanup/removal has been performed before the required Backup proof.
HEAD/local origin-main tracking remain at the baseline, main zero ahead/behind.

## Controlled recovery evidence

Owner confirmed fresh Backup login. Independent readback at 2026-10-08T00:07:38Z
(08:07:38 +08:00) showed AAL2 using Backup, TOTP age 60s, exact sole isolated
Google identity/active profile and both verified factors. The guarded operator
fallback used the existing Auth Admin credential only in process memory; it was
not printed or saved in chat, repository, output files or Vercel runtime.

Authorization audit: 00:08:11Z. Supported Auth Admin factor DELETE completed at
00:08:58Z and targeted only the lost Primary ID. Independent readback at 00:09:10Z
confirmed exactly the original verified Backup ID remained. Completion audit
appended at 00:09:24Z. Both system recovery events share correlation
f3fbd324-fbe1-4d2c-bd83-694df2f165c3. Auth and database audit were separate
transactions; no cross-service atomicity. No Auth-table SQL mutation occurred.

The deployed Backup-only MFA screen offered Add primary authenticator and selected
Backup. Owner personally saved a new Primary entry and entered TOTP privately.
Readback at 00:12:59Z confirmed the new verified Primary ID and its session at AAL2,
with the original Backup still verified. QR/seed/code were not read or recorded.
Auth AMR created_at retained the first challenge time; updated_at reflected this
Primary verification at 00:10:47Z. Signed JWT AMR remains authoritative for recency;
metadata created_at alone is not treated as the latest challenge timestamp.

Interim 00:10:26Z counts: one Auth user/Google identity/profile, two sessions, one
verified Backup and then-unverified replacement enrollment, zero pending invites,
ten audits (original eight plus two recovery events). Both factors were verified
by the later 00:12:59Z readback. Final cleanup counts remain pending.

## Real Auth-issued API and refresh evidence

25/25 new hosted checks passed using the actual isolated Google/new-Primary TOTP
session. The secure project operator read only its existing opaque refresh
credential into process memory, then used the supported Auth refresh endpoint.
All test Auth/PostgREST requests used the public publishable key and actual
Auth-issued JWT, not a service-role bypass, forged token or synthetic AMR.
No access/refresh credential was printed or saved. Operator session rotation may
require a fresh browser login; it is a verification workflow, not app runtime.

Real Auth getUser verified the bound identity. The fresh signed MFA state permitted
an ordinary staff test invite and its guarded revocation; two atomic foundation
audit events were added, leaving zero pending invites. Direct profile POST/PATCH/
DELETE returned 403. Private tables through public returned 404; private schema
selection 406; protected identity column 403; private helper 404. Ordinary guarded
invite refuses super_admin (400), extra actor parameter cannot match RPC (404),
and owner role mutation is protected (403). Anonymous security RPC returned 401.
Changing browser-editable user metadata role to staff did not change the trusted
database role; that test metadata was restored through supported Auth API.

Refresh at 00:16:48Z issued a new JWT while retaining signed TOTP timestamp
1791418247 (00:10:47Z). No subsequent challenge or clock/AMR mutation was made.
At 00:21:19Z, natural age was 632 seconds; another genuine refresh retained that
exact timestamp. Database state stayed AAL2 but recent_mfa=false, and privileged
invitation RPC returned 403. No stale invite, extra audit or pending invitation
resulted. Audit count remained 12. No UI timer is an authority.

At 00:23:21Z, three supplementary hosted membership/rollback assertions passed.
Copied actual Auth-issued authorization claims were checked inside explicit SQL
rollback transactions while the sole test profile was temporarily disabled/revoked.
Active-role, profile RLS and security/owner RPC contracts denied those states.
Both profile and temporary audit changes rolled back; real PostgREST security
read after each rollback returned 200 for the restored active owner, with 12
audits unchanged. This is not an externally replayed committed revoked-user browser
test; that one-identity limitation remains explicit. No Auth-table SQL mutation.

Supabase bounded logs 00:06:00Z–00:20:30Z contained 66 Auth/101 edge events,
zero Auth error/fatal levels and zero 5xx in the inspected Auth/edge status fields.
Only aggregates/attribute names were read; no raw session/credential log dump.

## Retained Backup and session regression

Owner explicitly selected the retained Backup and entered its code after Primary
replacement. Readback 00:25:40Z confirmed the same original Backup ID, real AAL2,
latest TOTP challenge 00:25:09Z, age 31s, both factors verified and 12 audit rows.
The genuine two-factor MFA UI showed Primary as deterministic initial selection
even with Backup listed first, and enrollment remained disabled.

Agent operated normal app Sign out after that successful Backup challenge. The
sensitive Home content immediately disappeared; final page was the signed-out
login page. At 00:26:10Z the current browser session was removed, with one older
test session still present (app sign-out scope is local). Direct navigation to
Users redirected to login?state=signed-out. The actual login-to-public navigation
showed the public homepage, zero admin shells and zero retained outgoing admin
elements. No Google provider sign-out or session revocation is claimed.
Owner logged in through Google again and stopped at MFA before entering a code.
Five actual Auth/PostgREST checks passed: verified factors did not elevate the
new OAuth session above AAL1; only minimal own security state was returned; profile
rows were hidden; owner snapshot and privileged invitation RPC returned 403.
Direct deployed Users navigation redirected to MFA, with Primary selected by
default and no operational admin shell. Owner then challenged the replacement
Primary again. Independent 00:55:33Z readback confirmed its exact new factor ID,
verified status and AAL2; latest genuine challenge was 00:54:54Z. The deployed
Users page opened successfully, with the sole active test profile and audit history.

At 00:56:37Z, supported Auth global logout terminated all test sessions. The same
genuine, still-unexpired Auth-issued JWT then returned 403 for security and owner
RPCs; profile SELECT returned no rows. Two cleanup assertions passed. No fake JWT,
Auth-table write, factor removal or audit deletion was used. Browser reload of
Users redirected to login; navigation to public Home retained no admin shell.
Normal app sign-out then cleared the remaining browser credential state.

Independent final hosted counts at 00:57:17Z (08:57:17 +08:00):

| Object | Count |
| --- | ---: |
| Auth user / Google identity / active test-super-admin profile | 1 / 1 / 1 |
| Auth sessions / live unrevoked refresh records | 0 / 0 |
| Verified Primary / verified Backup | 1 / 1 |
| Pending / accepted / revoked invitations | 0 / 1 / 4 |
| Append-only audit rows | 12 |

Only the minimum isolated identity and both possessed factors are retained for
owner review of the recovered staging flow. Its sessions are removed. No ordinary
test identity, extra membership or pending synthetic admission remains. Historical
accepted/revoked invites preserve audit context and cannot admit another user.

Final bounded log window 00:06:00Z–00:57:00Z: Vercel 63 records (58 HTTP 200,
five 307), zero 5xx/error/fatal/nested error or checked credential/seed patterns.
Supabase 130 Auth / 189 edge events, zero inspected error/fatal levels or 5xx.
Only sanitized aggregate evidence was retained. No new runtime configuration
change occurred after the deployed bundle scan.

No second isolated Google identity exists. Ordinary external admin/staff browser
admission remains untested; existing real-local and hosted SQL/RLS contracts remain
its evidence. Owner explicitly accepts this as non-blocking when critical gates pass.
Future real-owner custody requires independently retained Primary/Backup, owner-only
Vaultwarden recovery material and independently protected Supabase project-owner
recovery. The two successful test factors do not prove independent device custody
or a project-owner recovery drill. App sign-out does not revoke Google's provider
session; loss/compromise also requires Google account security/session review.
No real-owner recovery material or account is created here.
Free-plan limits remain in [hosted evidence](ADMIN-FOUNDATION-HOSTED-AUTH-VERIFICATION.md).
Current hosted JWT lifetime remains 3600 seconds. Paid-plan inactivity/timebox/
single-session controls are not claimed. Approved shorter JWT/session targets
remain production decisions; live DB membership/session and signed MFA guards
remain enforced independently.

## Closeout decision and review scope

97/97 local automated tests plus 30/30 actual hosted API/refresh/AAL1 assertions,
3/3 supplementary hosted rollback contracts, 2/2 genuine-session cleanup assertions
and 8/8 deployment route smoke checks passed. These separate suites are not a
rerun or renumbering of the historical 327-test 6.1A checkpoint. Genuine Primary,
Backup, Google login, AAL1/AAL2 and browser transitions are separately evidenced.

All owner-defined critical closure gates passed. Fasa 6.1 is complete and ready
for owner review; the explicitly accepted lack of a second isolated Google
identity remains a non-blocking limitation. A committed disabled/revoked-profile
external browser replay was not attempted against the sole recovery identity;
rollback contracts and previous local/hosted contracts are stated accurately.
No authorization/RLS/schema/migration/dependency change was required. Runtime
changes are limited to deterministic missing-factor naming and selection.

Changed repo files: README.md; docs/ADMIN-FOUNDATION-PLAN.md, ARCHITECTURE.md,
DECISIONS.md, PROJECT-STATE.md, ROADMAP.md; three evidence/recovery documents;
package.json; src/components/admin/mfa.tsx; src/lib/admin/mfa.ts;
scripts/admin-foundation/mfa.test.ts, browser.spec.ts and local-supabase.test.mjs.
External operator scripts/sanitized evidence are outside the repo. No credential
or generated hosted configuration is tracked. Owner-approved checkpoint commit/push/tag does not authorize real owner
onboarding or production provisioning. Fasa 7 remains unstarted.

Final review checks: git diff --check passed; all 15 changed/new repository files
passed local documentation-link/Unicode/conflict checks. Checked credential-shaped
literals, privileged JWT literals and generated credential/config file names had
zero findings. Existing migration SHA-256 remains
bc79bb1b97f6e22de2ce9df2fb32766b7d9dc7c6e96ab02e71807af87e13f753.
Canonical origin/main was fetched; HEAD and origin/main remain
05a1e394c2dce9a6c816020072e5bc9c3d466540, zero ahead/behind. The 15 intentional
changes remain uncommitted for review. Final browser Users navigation displays
signed-out login, not authenticated content.

## Owner-approved checkpoint

8 October 2026 (+08:00): owner approved Fasa 6.1/6.1A/6.1B-1/6.1B-2/6.1B-2R
completion and authorized commit `feat: complete Fasa 6.1 admin foundation`, main
push and tag `phase-6.1-admin-foundation-complete`. Resolve that tag for the final
commit. Earlier uncommitted-review and baseline sync statements above describe
the pre-approval verification boundary. The sole staging test identity, Primary,
Backup and audits are retained. No production mutation or Fasa 7 start is authorized.
