# Fasa 6.1B-2 — Real Google OAuth and Hosted Auth/MFA Verification

Historical B-2 evidence below. Authorized B-2R patch/recovery progress is tracked
in [MFA recovery verification](ADMIN-FOUNDATION-MFA-RECOVERY-VERIFICATION.md).

8 October 2026 (+08:00). **First real no-invite Google OAuth denial passed.
Owner-operated isolated bootstrap allowlist provisioned and independently verified.
Genuine allowlisted Google Auth identity admitted; isolated test-super-admin profile
bound and invitation consumed with atomic audit. Genuine AAL1 session and privileged
route exclusion, hosted primary TOTP/AAL2 and real-session invitation operations
verified. Backup TOTP, fresh step-up retry, logout and public regressions passed.
Separate-identity and direct API/remaining session gates remain explicitly open.**

Baseline/main: `05a1e394c2dce9a6c816020072e5bc9c3d466540`.
Deployed source: `79a87e97c16573968eb4c57d0b19e421d6f7fba0`, tag
`phase-6.1b1-hosted-supabase-staging`. Repo was clean and origin/main synced
(0 ahead/behind) before these intentional documentation updates. No commit/push.

## Actual preflight evidence

| Check | Readback result |
| --- | --- |
| Dedicated staging | masjid-mtu-admin-staging / azypohqpupphapasweln, ACTIVE_HEALTHY, ap-southeast-1 |
| Supabase URL | https://azypohqpupphapasweln.supabase.co |
| Google provider | Enabled, actual hosted Auth config readback |
| Email / phone / anonymous | All disabled |
| Before User Created | Enabled; pg-functions://postgres/private/before_user_created |
| Site URL | https://masjid-mtu-admin-staging.vercel.app, unchanged |
| Redirect allowlist | https://masjid-mtu-admin-staging.vercel.app/admin/auth/callback, unchanged |
| Vercel target | prj_Pf0AtaZOb4welcPw7l2eamDowumR / masjid-mtu-admin-staging, correct team/link |
| Vercel runtime config | Eight required Production variables; no additional service-role/secret/DB/OAuth variable; values not decrypted |
| Stable login alias | 200; invitation-only page; configured Google button |
| Baseline hosted counts | Auth users 0, profiles 0, invitations 0 (pending 0), audit rows 0 |
| Count readback time | 2026-10-07 16:10:52 UTC / 8 October 2026 00:10:52 +08:00 |
| Log visibility | Unified logs source discovery includes auth_logs, edge_logs, postgres_logs and pgbouncer_logs; only aggregate counts inspected |

Google client configuration is owner-confirmed. Provider flag and application
callback/scopes were independently verified. Genuine browser results are below.
No Google secret was printed, copied into a report/repo or configured in Vercel.
Google authorized JavaScript origin is the stable staging origin; authorized
Google redirect is https://azypohqpupphapasweln.supabase.co/auth/v1/callback.
The deployed application uses fixed SSR PKCE redirectTo, same-origin POST entry,
openid email profile, and prompt=select_account.

## First genuine browser test — no invitation, passed

The owner must personally open
https://masjid-mtu-admin-staging.vercel.app/admin/login, select Continue with
Google, and use an isolated secondary Google identity dedicated to staging tests.
Do not use the owner's real primary identity. No eligible invitation exists.
Expected: Google may authenticate, but the mandatory hook rejects user creation;
the app returns a generic denied state or Auth reports admission failure. No
operational /admin access. The owner reports the displayed result, without
passwords, full callback query strings/codes, tokens or secrets.

Owner confirmed using the secondary Google account and seeing the application
message: Access denied. Contact the owner if you need access. The owner provided
no email, password or secret in chat. Actual hosted logs were correlated over
2026-10-07T16:10:52Z through 16:22:45Z (8 October, +08:00).

- Auth /authorize: 2 records, one contains Google provider evidence.
- Auth /callback: 3 records, two contain Access denied evidence and one identifies
  before_user_created. Only aggregate flags/counts were returned; raw URLs,
  authorization codes, emails, tokens and callback payloads were not printed.
- Counts readback at 2026-10-07T16:23:24Z / 8 October 00:23:24 +08:00:
  Auth users=identities=sessions=profiles=invitations=audit rows=0.

This is genuine owner-operated Google browser OAuth plus hosted Auth hook/log/count
evidence, not a synthetic event. Subsequent bootstrap admission is recorded below;
ordinary admin/staff invitation admission and MFA remain untested.

## Next step — isolated bootstrap allowlist, operator terminal

The external owner-operated STAGING-TEST-BOOTSTRAP.ps1 artifact is prepared and
PowerShell syntax checked. The test email is entered hidden in the terminal;
no personal email is stored in scripts, docs, local state or chat. The intended
write is exactly one 30-minute super_admin allowlist invitation plus one atomic
system/bootstrap audit row. actor_id is null for the explicit bootstrap exception;
invited_by/request_id use an operator correlation UUID, not a fake Auth identity.
Ordinary app RPCs still cannot invite/promote super_admin. There is no endpoint.

Before its one allowed committed transaction, the script checks the exact staging
project/name/region, Auth hook/providers/URLs, baseline and migration SHA-256;
the protected SQL operator, migration history, and empty initial foundation/Auth
state are guarded again inside the transaction. Correlation-only local state
prevents blind repeat after an uncertain network result. It contains no email or
credential. Owner entered the test email directly in the terminal and reported
the non-secret STAGING ALLOWLIST READY completion message. The initial direct
script invocation was blocked by the owner's execution policy before execution;
the reviewed script then ran under a temporary PowerShell 7 process policy.
No persistent Windows policy change or secret disclosure was needed.

Hosted readback confirms exactly one pending super_admin bootstrap invitation,
normalized email (boolean only, no email read/output), matching operator correlation
and exactly one matching system/bootstrap audit event. Created
8 October 2026 00:36:34 +08:00; expiry **01:06:34 +08:00**. Eligibility was verified
before asking the owner to attempt the next Google login. Counts at provisioning: Auth users,
identities, sessions and profiles=0; invitations=1; audit rows=1. Audit evidence is
preserved. This is bootstrap allowlist provisioning, not ordinary invitation flow
or a claim of positive membership/Google session.

The exact provisioning SQL was exercised against hosted PostgreSQL with a reserved
synthetic example.test email and an explicit ROLLBACK. Both invite and matching
bootstrap audit existed atomically during the test; readback after rollback leaves
users/profiles/invitations/audit at zero. This is an operator transaction contract
test, not a positive Google admission or a committed bootstrap.

The bootstrap role intentionally cannot be accepted by the ordinary admin/staff
invite RPC. After the real Google Auth identity is created, the controlled operator
procedure must verify the genuine provider/email/subject, bind the profile, consume
the bootstrap invitation and audit in one transaction. Until that binding exists,
the application may still show Access denied. The owner should wait for explicit
instructions before that next login; no genuine Auth rows are manually fabricated.

## Second genuine Google login and controlled bootstrap binding — passed

Owner repeated Google login using the isolated identity matching the allowlist and
again observed the generic denied page. Hosted readback at 2026-10-07T16:43:25Z
proved one Auth user, one trusted Google identity, no profile and no remaining
session. The exact normalized email matched the invitation; confirmed email,
identity email_verified, provider=google, and sub/provider_id binding all passed.
Only boolean/count evidence was returned; no personal email or provider subject.

Actual hosted Auth logs, 2026-10-07T16:36:34Z through 16:43:02Z:
/authorize=2 records (Google evidence), /callback=2 (one hook and one Google
reference, zero Access denied records), /token=1, /user=1, /logout=1.
This corroborates genuine Google admission and PKCE/session exchange followed by
the application's deliberate sign-out when the ordinary RPC rejects the reserved
bootstrap role. Auth users/identities persisted; the session was removed.
It does not prove ordinary admin/staff invitation acceptance.

The reviewed operator-only binding transaction was first exercised with ROLLBACK,
then committed against the exact staging project. Guards require the reviewed
migration, the sole unexpired correlated bootstrap invitation/audit, no profiles
or MFA factors, and exactly one genuine confirmed Google identity matching the
allowlisted normalized email. Profile identity values come from Auth-owned rows
and the invitation; no Auth row is fabricated and no user_metadata supplies a role.
The same transaction creates the isolated active super_admin profile, consumes the
invitation and appends a second actor-null/system bootstrap audit. No endpoint,
runtime patch, schema change or ordinary super_admin invitation path was added.

Independent committed readback at 2026-10-07T16:44:34Z / 8 October 00:44:34 +08:00:
Auth users=1, Google identities=1, sessions=0, MFA factors=0, profiles=1,
pending invitations=0, accepted invitations=1, audit rows=2.
Trusted profile/email/subject/invitation binding=1. Both bootstrap audits remain.
Next owner browser action: login again with this same isolated identity; expected
/admin/mfa at AAL1. Pause before enrollment so AAL1 denial can be verified first.

## Third genuine login — AAL1 and privileged route exclusion, passed

Owner reported /admin/mfa displaying Verify your authenticator and the primary
enrollment prompt. Browser inspection independently confirmed that page and no
verified factor. Hosted readback at 2026-10-07T16:47:38Z showed one live Auth
session with aal=aal1, genuine OAuth AMR, no TOTP AMR/factor_id, zero MFA factors,
one active isolated test super_admin and two unchanged bootstrap audits.
Direct navigation in that authenticated browser to /admin/users redirected to
/admin/mfa?next=/admin; no Users operational content was displayed.

The browser controller could not navigate directly to /admin/api/security:
net::ERR_BLOCKED_BY_CLIENT. No API response/status was obtained from that attempt.
This browser-tool limitation is not evidence of an application 403, nor proof of
direct PostgREST/RPC denial. Auth-issued API/mutation checks remain pending.
Only read-only page and hosted metadata checks were performed. No token, QR,
TOTP setup key or code was inspected/copied. Primary enrollment/challenge must
be completed personally by the owner before AAL2 can be claimed.

## Hosted primary TOTP / AAL2 and guarded invitation operations — passed

Owner personally enrolled and challenged the primary authenticator, then reported
the authenticated /admin Home screen. Hosted readback at 2026-10-07T16:52:10Z
confirmed one verified TOTP factor labelled Primary authenticator, one live AAL2
session with OAuth and TOTP AMR, and a factor_id. The latest TOTP AMR was 86 seconds
old. No factor secret/QR/code/token was selected or output. Successful Home entry
also exercised the application's verification-time refreshSession followed by its
server /admin/api/security check. Separate direct token/refresh inspection is pending.
Browser navigation to /admin/users now rendered Users & invitations, compared
with the prior genuine AAL1 redirect. No additional super_admin role option exists.

Using that genuine hosted OAuth/TOTP session through the deployed application:

- Reserved synthetic example.test staff invitation created at 00:58:24 +08:00.
- Identical pending invitation retried: UI reported duplicate/conflict, no second
  invitation or success audit created.
- Staff invitation revoked at 00:58:50 +08:00.
- Reserved synthetic example.test admin invitation created at 00:59:25 +08:00,
  then revoked. No real external identity received these invitations.

Independent database readback at 2026-10-07T17:00:10Z confirmed two synthetic
invitations, both revoked, each lifetime=604800 seconds (exactly seven days),
zero pending invites; two invite.create and two invite.revoke audits, all actor
AAL2 with the genuine isolated actor, plus the two preserved bootstrap audits.
The app used its guarded server API and Supabase RPC under the user's session;
these are real Auth-issued-session mutations, not forged SQL JWT claims.
Direct client/PostgREST bypass and rollback-on-audit-failure tests remain pending.

## Hosted recent MFA expiry — passed for the real application mutation

The same AAL2 browser remained on Users after successful invitation tests. No
additional challenge was performed. After ten minutes, a Create invitation attempt
with a fresh reserved synthetic email reached the server; UI showed Verify your
authenticator again before making changes and disabled further changes.
Readback at 2026-10-07T17:01:15Z confirmed the session remained AAL2, TOTP AMR age
631 seconds, rejected invitation rows=0, pending invites=0, audit rows unchanged=6.
The submitted request was denied by server authorization, then the UI responded;
this was not merely disabling a button using a browser timer. Database recency
uses signed JWT TOTP AMR and the server clock; no runtime/SQL patch was needed.

Hosted Auth log aggregates from 16:47:38Z through 17:01:00Z corroborate one
/factors enrollment, one /factors/[id]/challenge, one /factors/[id]/verify, and one
/token request. IDs were redacted; no token/seed/code payload was returned.
The challenge-time refresh did not make AAL2 indefinitely recent. An additional
deliberate refresh-without-challenge test and fresh step-up retry remain pending.
The browser is now at /admin/mfa?next=/admin/users with Primary authenticator and
Add backup authenticator available. Owner must perform the next enrollment.

## Hosted backup factor and fresh step-up retry — passed

Owner personally enrolled/challenged the backup authenticator and reported the
Users page. Readback at 2026-10-07T17:04:16Z confirmed two verified TOTP factors
with distinct Primary authenticator / Backup authenticator labels; the AAL2
session's factor_id matched Backup, not Primary. Latest TOTP AMR age=82 seconds.
Thus genuine primary and backup factor verification have both restored AAL2.
No seed/QR/code/token was inspected or stored in application tables/artifacts.
Independent backup-device custody is owner-operated, not observable from Auth.

After the prior stale-MFA denial, the newly challenged backup session created
another reserved synthetic invitation at 01:04:50 +08:00 and revoked it at
01:05:05. Hosted readback at 17:06:08Z confirms both matching AAL2 audit events;
pending invites=0, total audit rows=8. Fresh server-authorized mutation works again.
This supplements the stale denial; deliberate refresh-without-challenge remains
pending and factor removal/loss recovery has not been exercised.

## Session/navigation/logout and deployed regressions — passed boundaries

Real authenticated Settings navigation showed Google AAL2 and TOTP enrolled.
Browser reload retained authorized Settings. The public-website link navigated
to /; the public Kuliah section was visible and the admin shell was absent.
App Sign out returned /admin/login?state=signed-out. Browser Back reached the
public homepage without authenticated Home content. Direct /admin/users navigation
after logout redirected to login without rendering Users content.

Readback at 2026-10-07T17:08:22Z / 8 October 01:08:22 +08:00:
Auth users=1, Google identities=1, live sessions=0, unrevoked refresh tokens=0,
verified TOTP factors=2, profiles=1, pending invites=0, accepted invites=1,
revoked synthetic invites=3, preserved audits=8. No ordinary test user or temporary
extra membership exists. The sole isolated test profile/factors are retained for
the outstanding relogin/owner review; cleanup is not yet declared final.

This app deliberately signs out the current Supabase session (scope=local).
It does not implement Google provider sign-out/revocation or global all-device
sign-out. Google provider-session revocation remains untested. No surviving access
token was copied/replayed; live auth.sessions enforcement was already verified
locally and by hosted contracts, but a direct stale-token B-2 replay is pending.

Fresh unauthenticated deployed HTTP regressions: 8/8 passed:
/ and /kuliah and /kuliah/2026-10 and /admin/login and /studio=200;
/admin=307 to signed-out login; /admin/api/security and /admin/api/access=401.
The Sanity-backed public upcoming section rendered; October Kuliah contains the
expected 30 days / 34 rendered schedule entries. Thirty actual deployed Next.js
JavaScript chunks were scanned again; no privileged credential/reference patterns
or service_role JWT were found. Official external Sanity bridge excluded as in B-1.
No runtime/env change or redeployment occurred; the 327 local tests were not rerun.

Vercel CLI runtime log review for 2026-10-07T16:10:52Z through 17:10:30Z returned
111 request records within the 200-record cap: 101x200, 6x307, 2x401, 1x403, 1x409.
Zero 5xx, error/fatal request levels or nested error/fatal logs. The 4xx totals
align with the anonymous API, stale-MFA and duplicate-invite denial checks.
No checked privileged credential/OAuth-secret pattern was found in the in-memory
log scan. Only status/count metadata was saved; raw messages/requests/token values
were not printed or stored. This is a bounded-window review, not a guarantee
about all platform logs or every possible secret format.
Hosted Auth aggregates from 17:01:15Z through 17:09:15Z also corroborate backup
enrollment/challenge/verify, refresh and one logout; no Access denied Auth records
in that window. Expected application policy denials are separately described above.

## Remaining identity and verification boundaries

Owner explicitly confirms no second isolated Google test identity is available.
Do not manufacture additional personal accounts or use the real owner's identity.
Ordinary admin/staff positive invitation acceptance, independently authenticated
staff/admin authorization, live disabled/revoked membership with retained tokens,
ordinary member role/status mutations, and account-change tests remain unverified
with separate genuine hosted identities. B-1 hosted SQL/hook contracts and 6.1A
real-local tests are supplementary evidence, not replacement browser successes.
Wrong/expired/revoked/non-Google admission cases likewise retain their contract
evidence; only the no-invite Google denial was a genuine external browser test.
Direct authenticated PostgREST/RPC bypass and signed-token rollback checks remain
open after the browser tool's API navigation limitation. No temporary endpoint,
forged session or weakened authorization was introduced to produce a green result.

Factor removal/loss-of-primary and independent project-owner recovery are reviewed
designs, not completed recovery drills. The app exposes no ordinary factor-removal
UI; removal/recovery requires the reviewed owner procedure. Future real-owner
onboarding requires independently held primary/backup TOTP, owner-only Vaultwarden
material and separately protected Supabase project-owner recovery. No real owner
recovery material is created by this staging task.

## Relogin after logout — AAL1 with existing factors, passed

Owner repeated Google login with the same isolated identity and reported /admin/mfa
with Add backup authenticator disabled. Hosted readback at
2026-10-07T17:16:05Z / 8 October 01:16:05 +08:00 confirms one new AAL1 session,
OAuth AMR=true, TOTP AMR=false, no factor_id, both Primary and Backup factors
still verified, and eight unchanged audits. Prior enrollment does not bypass a
fresh session's MFA challenge. Auth users remain one.

Browser inspection confirmed both distinct factor options. Add backup authenticator
is intentionally disabled by this application's two-factor UI limit
(factors.length >= 2), not a hosted Auth failure or a claimed Supabase plan limit.
Direct navigation to /admin/users again redirected to /admin/mfa?next=/admin,
with no Users content visible. No new credential or factor is needed.
Next owner action: select the existing Primary authenticator, manually enter its
current six-digit code and Verify and continue. This will test a fresh challenge
of an existing factor after relogin, separately from enrollment-time verification.

### Existing-factor challenge after relogin — Backup verified; Primary clarification open

Owner then reported authenticated Home. Readback at 2026-10-07T17:20:22Z confirms
the new session is AAL2, OAuth/TOTP AMR present, latest TOTP age=76 seconds, with
session.factor_id matching Backup authenticator. Audit rows remain eight.
Only the factor label/security metadata was selected, not any OTP/seed/token.
The latest real Auth challenge history confirms Backup verified at 17:19:06Z.
Primary challenges created at 17:18:12Z and 17:18:38Z have verified_at=null.
Primary's original enrollment challenge at 16:50:44Z was genuinely verified.

Auth logs for 17:16:05Z through 17:20:49Z contain three challenge requests and
three verify requests, with two invalid-MFA error flags and one successful
verified Backup challenge in database history. Only aggregate counts were read.
Invalid-code rejection worked; the reason for the owner's Primary code mismatch
still requires clarification rather than a runtime fix.

Do not report the latest relogin as a successful Primary challenge. Backup
restored AAL2 after relogin; the two unfinished Primary challenges require owner
clarification about the observed result and authenticator custody. No cause,
credential loss or application defect is inferred from timestamps alone. Session
closure is deferred until this clarification, rather than silently passing recovery.

Owner clarification: the page asked for a fresh code; the owner waited for the
next code and submitted it without intentionally changing Primary/Backup selection.
Do not attribute the switch to owner interaction. Code inspection shows the app
defaults to data.totp[0] when factors load; the pinned SDK preserves the Auth
response order and does not sort or automatically retry verification against
another factor. The current UI still renders Primary as default on a fresh load.
Whether selection reset/response ordering contributed to the earlier request
sequence is not reproduced or proven. No runtime patch is made from that inference.
The browser has been returned to the existing-factor MFA screen with Primary
visibly selected and no credential entered, for a controlled Primary-only retry.
Independent backup storage/custody remains unanswered.

### Controlled Primary retry — invalid TOTP confirmed, unresolved

Owner reported the same Verification failed / fresh-code message. Readback at
2026-10-07T17:29:06Z confirms four new Primary challenges at 17:27:20Z,
17:27:41Z, 17:27:51Z and 17:28:17Z, all unverified. Auth log aggregates for
17:24:00Z through 17:29:02Z contain four challenge and four verify requests,
with four invalid-MFA error flags. Therefore these are actual Auth code denials,
not successful verification followed by an application refresh/security-check
failure. The existing session remains AAL2 from the earlier verified Backup
challenge; it does not imply that any latest Primary attempt succeeded.
Both enrolled factors remain verified in Auth; eight audits remain unchanged.

Repeated code attempts are paused. Owner must clarify whether the Primary and
Backup entries remain separate and whether the authenticator device time is
correct/synchronized. Current Supabase troubleshooting identifies device clock
configuration as a possible invalid-TOTP cause, not a diagnosis here:
[Official invalid-TOTP troubleshooting](https://supabase.com/docs/guides/troubleshooting/error-invalid-totp-code-entered-CukLCj).
Do not read/retrieve seeds, compare submitted codes, delete factors, weaken MFA,
or patch runtime code merely to turn this unresolved recovery test green.
Primary enrollment-time verification remains historical evidence; continuing
Primary possession/rechallenge is now explicitly an unresolved hosted gate.

### Owner custody clarification — one remaining local entry

Owner confirms a single authenticator device and one visible code entry. Entries
were deleted in an attempt to obtain fresh codes. Explain that six-digit TOTP
values rotate automatically; deleting an entry removes the local provisioning
material rather than refreshing its code. Do not blame the owner or infer a
server seed change. Auth still retains its two verified factors.

The remaining local entry likely corresponds to Backup, because that factor
was the last genuinely verified challenge while Primary codes were denied.
This is an inference, not a seed comparison. The next safe manual check is to
select Backup and verify the current code from the one remaining entry. Do not
delete any remaining local entry or either hosted factor during diagnosis.

Independent backup-device custody was not achieved in this staging test. Primary
enrollment-time verification and actual Backup recovery remain evidence, while
continuing possession of Primary and independent recovery custody remain open.
A reviewed controlled recovery procedure must preserve the working Backup until
replacement Primary is enrolled and verified; no database seed retrieval, direct
Auth-table mutation or automatic factor removal is authorized by this clarification.

### Explicit Backup confirmation after local entry loss — passed

Owner explicitly selected Backup, entered the current code from the remaining
entry and reported authenticated Home. Independent readback at
2026-10-07T17:40:51Z / 8 October 01:40:51 +08:00 confirms genuine AAL2 with
session.factor_id matching Backup, TOTP age=75 seconds, two verified factors and
eight unchanged audit rows. Remaining local Backup possession is demonstrated;
Primary possession has not been recovered.

Current enrollment naming uses factors.length, so removing the lost Primary
while retaining Backup would make the UI attempt a duplicate Backup friendlyName.
The pinned Auth SDK requires that name to be unique. No factor was removed to
discover this: source inspection alone establishes the replacement-path gap.
[Concrete staging recovery review and minimum patch proposal](ADMIN-FOUNDATION-STAGING-RECOVERY-REVIEW.md)
is prepared; no runtime patch, Auth reset/removal or deployment is performed.
The test identity/factors remain minimally retained for controlled recovery and
owner review. There are no ordinary test users, extra memberships or pending invites.

## Hosted evidence status

| Required boundary | Current B-2 result |
| --- | --- |
| Real no-invite Google OAuth | Passed: owner browser result + Google/hook callback logs + zero identity/membership/session counts |
| Isolated staging test-super-admin bootstrap | Passed: genuine Google identity, controlled operator binding, consumed invite and two atomic bootstrap audits |
| Positive Google invite/PKCE/admission/audit | Bootstrap Auth admission/PKCE exchange evidenced; ordinary admin/staff invitation acceptance still pending |
| Wrong/expired/revoked/replay/non-Google cases | Real browser cases pending; existing B-1 hosted contracts remain supplementary evidence |
| Auth-issued hosted JWT / role / stale-membership matrix | Genuine super_admin AAL1/AAL2 route boundary and AAL2 guarded invitation mutations passed; ordinary roles/stale membership/direct bypass pending |
| Hosted primary and backup TOTP / AAL1/AAL2 | Both enrollment challenges historically passed; Backup rechallenge after relogin passed; latest Primary rechallenges return invalid TOTP and remain unresolved; AAL1 exclusion passed |
| Hosted signed AMR / 10-minute recency / refresh / step-up | Real stale-MFA server denial and fresh backup step-up mutation retry passed; deliberate refresh-without-challenge still pending |
| Hosted access-management operations / atomic audit | Staff/admin synthetic invite creation, duplicate denial and revoke passed with real AAL2 actor/eight matching audits; ordinary membership mutations pending |
| Session / logout / account-change / transition retention | Navigation/reload, sign-out/session removal, relogin AAL1 exclusion and existing Backup challenge back to AAL2 passed; Primary rechallenge clarification, account-change/direct stale-token replay pending |
| Recovery / provider-session review | Local entry loss now observed; last successful Backup restores AAL2, Primary possession/recovery unresolved; single-device custody confirmed, independent recovery/project-owner drill and Google revocation unverified |
| Cleanup and final hosted counts | Interim retained for outstanding review: one test Auth identity/profile, two verified factors, one AAL2 session after Backup rechallenge, zero pending invites, one accepted and three revoked invites, eight audits |
| Runtime / SQL change | No runtime/schema/migration patch; bootstrap/invitation DML only. Replacement-Primary naming gap found and a minimum recovery patch proposed for review |
| Fasa 6.1 ready to close | No; genuine OAuth/Auth/MFA/session gates remain |

Existing [B-1 evidence](ADMIN-FOUNDATION-STAGING-VERIFICATION.md) and
[6.1A evidence](ADMIN-FOUNDATION-LOCAL-VERIFICATION.md) remain historical results.
The 327 local tests and 36 B-1 hosted checks are not presented as new B-2 tests.

## Hosted Free-plan readback and limits

Actual organization subscription readback: plan=free / tier_free. Actual config:
jwt_exp=3600 seconds; sessions_timebox=0; sessions_inactivity_timeout=0;
sessions_single_per_user=false. No timeout configuration was changed.

Current official documentation restricts time-boxed sessions, inactivity timeout
and single-session enforcement to Pro and above. Therefore the approved 15-minute
JWT / 8-hour maximum / 30-minute inactivity values remain targets, not deployed
guarantees. A JWT remains valid until expiry unless sensitive authorization checks
reject it; refresh rotation and sign-out/provider behaviour must still be verified
with the genuine test session. Unsupported paid controls are production decisions,
not a reason to weaken live membership/MFA checks or invent a custom browser timer.
[Official session controls and rotation](https://supabase.com/docs/guides/auth/sessions).

## Scope and custody

Use only dedicated staging resources and isolated test identities. The approved
bootstrap uses a short-lived invite allowlist, genuine Google Auth identity,
controlled audited profile/bootstrap transaction, and no permanent endpoint.
The test email is entered directly through an approved terminal/UI workflow;
never a client constant or documentation value. Ordinary invites remain admin/staff
only. Real owner onboarding, production resources, Fasa 6.2/7 and commit/push are
not authorized. Do not save passwords, OAuth secrets, tokens or TOTP seeds.

Primary/backup authenticator custody and independently protected Supabase
project-owner recovery remain requirements for future real owner onboarding.
No real owner recovery material has been created. Cleanup must preserve audits.

## Local files and review boundary

Documentation-only repo changes: README.md, ADMIN-FOUNDATION-PLAN.md,
ARCHITECTURE.md, DECISIONS.md, PROJECT-STATE.md, ROADMAP.md and this new
ADMIN-FOUNDATION-HOSTED-AUTH-VERIFICATION.md and the staging recovery review.
External reviewed bootstrap scripts,
correlation-only state and sanitized HTTP/bundle/log evidence live outside the repo.
No credential/generated hosted configuration became a tracked file.
Documentation links/diff checks pass; HEAD and origin/main remain
05a1e394c2dce9a6c816020072e5bc9c3d466540, zero ahead/behind, no commit or push.
No real owner onboarding, production provisioning, new deployment or phase start.
Fasa 6.1 is not ready to close on this partial hosted matrix. Outstanding Primary
custody clarification is a human verification boundary; missing independent test
identity and direct authenticated API access are separately recorded limitations.

## B-2 owner-review deliverables

| # | Requested result | Actual result at this review boundary |
| --- | --- | --- |
| 1 | Google provider readback | Enabled; email/phone/anonymous disabled; hook and exact callback/origin config verified |
| 2 | First no-invite real OAuth | Genuine owner-operated Google attempt denied; zero Auth/profile/session rows afterward |
| 3 | Test-super-admin bootstrap | Short-lived operator allowlist, genuine Google identity and atomic profile/invite/system-audit binding; isolated staging only |
| 4 | Positive real Google admission | Bootstrap Auth/PKCE admitted; ordinary admin/staff invitation admission not tested without another isolated identity |
| 5 | Negative admission | Real no-invite denial and real-session duplicate invite denial; other identities/expiry/replay/provider cases retain hosted contract evidence |
| 6 | Auth-issued RLS matrix | Genuine owner AAL1 exclusion, AAL2 read/mutations and live-session logout checks; ordinary roles/stale-token/direct bypass incomplete |
| 7 | Hosted primary/backup TOTP | Both enrollment verifications passed historically; explicit remaining Backup challenge passed; deleted local Primary entry requires controlled replacement |
| 8 | AAL1/AAL2 | Initial and post-logout AAL1 exclusions passed; genuine Primary enrollment and Backup challenges reached AAL2 |
| 9 | Recent MFA | Real mutation allowed when fresh, server-denied after 600 seconds while AAL2 remained, allowed again after fresh Backup step-up; explicit refresh-only test pending |
| 10 | Access/audit | Three synthetic invites created/revoked, duplicate denied, seven-day lifetime; six genuine AAL2 invite audits plus two bootstrap audits; ordinary membership operations not tested |
| 11 | Session/logout/account change | Navigation/reload/public departure/logout/session removal/relogin gates passed; independent account-change and direct token replay unverified |
| 12 | Hosted plan | Free; JWT 3600 seconds, no configured timebox/inactivity/single-session control; approved timeout targets remain future decisions |
| 13 | Recovery/provider session | Actual local Primary-entry loss observed; remaining Backup restores access; independent custody/replacement/project-owner drill and Google revocation remain open |
| 14 | Security/log scan | 8/8 fresh HTTP checks; 30 deployed chunks scanned; bounded 111-request Vercel window no 5xx/error/fatal/checked-secret patterns; only sanitized Auth aggregates |
| 15 | Cleanup/counts | At 8 October 01:44:25 +08:00: one test Auth user/Google identity/profile/AAL2 session, two verified Auth factors, zero pending invites, one accepted/three revoked historical invites, eight preserved audits |
| 16 | Runtime/SQL change | No runtime/schema/migration/dependency change; reviewed staging DML only. Replacement enrollment naming gap has a concrete minimum-patch proposal, not an implementation |
| 17 | Ready to close Fasa 6.1 | No. Owner review required for controlled Primary recovery and remaining hosted verification gates; no commit/push or next phase |

The single test identity/session/factors remain intentionally available for the
outstanding controlled recovery and owner review. Historical non-pending invites
preserve audit context and cannot admit users. No unnecessary ordinary identities,
extra memberships or live synthetic invitations remain. This is the exact current
readback, not a claim that all final recovery/cleanup work is complete.
