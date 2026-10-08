# Fasa 6.0 — Admin Foundation Architecture & Security Plan

> Current status, 8 October 2026: **Fasa 6.1 complete and owner-approved.**
> Minimum MFA naming/selection patch passed 97/97 local tests and deployed READY
> to dedicated staging. Lost Primary removed only through supported Auth MFA API;
> genuine replacement Primary and retained Backup AAL2 verified. Google relogin
> AAL1 exclusion, signed refresh-only recency, stale mutation denial and direct
> API guards passed. All test sessions globally signed out; actual unexpired JWT
> denied by live-session checks. Two verified factors, 12 audits, zero pending invites.
> Existing authorization/RLS/migration unchanged; no privileged browser/runtime key.
> Lack of second isolated Google identity and safe sole-owner revoked-replay limits
> remain explicitly documented and accepted as non-blocking. Free-plan session
> targets and independent real-owner recovery custody remain future decisions.
> [Complete B-2R evidence](ADMIN-FOUNDATION-MFA-RECOVERY-VERIFICATION.md).
> Owner authorizes main commit/push and tag `phase-6.1-admin-foundation-complete`.
> No real-owner onboarding or production provisioning; Fasa 7 remains unstarted.

> Historical B-2 status, 8 October 2026: genuine no-invite denial and allowlisted Google admission passed.
> Isolated staging test-super-admin binding/invite consumption/audit committed atomically.
> Genuine OAuth AAL1 exclusion and primary hosted TOTP/AAL2 passed; Users opens.
> Staff/admin invite creation, duplicate denial and revoke passed via real session.
> Backup TOTP, fresh step-up retry and local-scope hosted logout passed.
> Relogin returns to AAL1; existing verified factors do not automatically grant AAL2.
> Backup rechallenge works; Primary rechallenge returns invalid TOTP and is under
> owner entry/custody review. Explicit remaining Backup challenge passed.
> [Replacement-Primary recovery proposal](ADMIN-FOUNDATION-STAGING-RECOVERY-REVIEW.md)
> is prepared; no runtime patch/factor reset/deployment performed.
> No runtime change; separate-identity admission/role matrix and direct API gates are open.
> [Historical B-2 hosted Auth/MFA evidence](ADMIN-FOUNDATION-HOSTED-AUTH-VERIFICATION.md).

> Historical hosted status, 7 October 2026: owner-authorized 6.1B-1 applied the unchanged
> reviewed migration and verified staging RLS/grants/private hook/negative admission.
> [Hosted evidence](ADMIN-FOUNDATION-STAGING-VERIFICATION.md). Vercel CLI confirmed eight Production env names and no privileged key. Owner
> authorized checkpoint/push and first canonical-source staging deployment, now
> READY at the stable staging alias. HTTP/browser/bundle/log checks pass. Google,
> owner bootstrap and production remain excluded; Fasa 6.1 stays open.
>
> Historical implementation status, 6 October 2026: the owner subsequently authorized the
> local Fasa 6.1 task from commit 91117322f7ac81043bbe9d952811dfbe02d8ccde.
> This document preserves the approved 6.0 architecture and historical closeout
> below. Current implementation/evidence is in
> [ADMIN-FOUNDATION-LOCAL.md](ADMIN-FOUNDATION-LOCAL.md), with the separate
> [staging review checklist](ADMIN-STAGING-CHECKLIST.md). Fasa 6.1 is open;
> the owner approved the UI and authorized the green 6.1A local checkpoint
> `phase-6.1a-local-admin-foundation`. Real local Supabase verification passes:
> [exact evidence](ADMIN-FOUNDATION-LOCAL-VERIFICATION.md). No hosted resources,
> real owner or production. Historical 6.0 closeout below remains unchanged.

**Owner-approved architecture; Fasa 6.0 completed — 6 October 2026 (+08:00).**
Baseline: `dff2327939060dc79641c6014961f7055f777279`, clean and synchronized
with `origin/main` before this documentation work. Fasa 0–5 completed.
Fasa 6.0 is planning only; Fasa 6.1 implementation has not started.
This closeout records the owner's decisions and creates the Git checkpoint
`phase-6.0-admin-foundation-architecture` (resolve the tag for the final commit).
No runtime, package, environment, database or remote configuration changes.
Architecture approval does not authorize starting Fasa 6.1 in this task.

## 1. Inspected baseline and boundary

Reviewed ROADMAP, ARCHITECTURE, PROJECT-STATE, DECISIONS, PROJECT-JOURNEY,
README, AGENTS, package/configuration files and the App Router source tree.

- Next.js 16.3.6 / React 19.2.8 / TypeScript, App Router; no existing admin
  route, Supabase client/dependency, auth middleware/proxy or migrations directory.
- `.env.example` has unconfigured Supabase URL, legacy anon/service-role,
  email and payment placeholders. These are not evidence of provisioned services.
  `.env*` is ignored except the example. Real local secret values were not read.
- `/studio/[[...tool]]` embeds NextStudio with Sanity authentication. Public
  typed Sanity reads are token-free, published-only and cached for five minutes.
  Studio lecture mutations belong to its authenticated Sanity client.
- `AppRouteLayout` excludes Studio from public route transitions but would
  currently animate any future `/admin` route. In 6.1 exclude the complete admin
  branch as well: transitions retain outgoing content and must not retain an
  authenticated screen across logout/account switches.
- Reuse design-system tokens/components, not the public page shell or Studio UI.
  Historical phase/audit records and unresolved GPL decision remain unchanged.

```mermaid
flowchart LR
  Public[Public website] --> Reads[Published Sanity reads]
  Studio[/studio] --> Sanity[Sanity editorial CMS]
  Admin[/admin] --> Auth[Supabase Auth: Google + TOTP]
  Admin --> DAL[Server authorization and typed access]
  DAL --> DB[PostgreSQL: membership, RLS, guarded operations]
```

Sanity stores editorial/public content; Supabase stores operational identity and
future operational records. Google or Supabase membership does not grant Sanity
access, and Sanity membership does not grant admin access. No shared role/token.

## 2. Authentication and invite-only admission

Use Supabase Auth Google OAuth via the supported SSR PKCE flow. Only request
basic identity/email scopes; no Google Drive, calendar or offline access scopes.
Supabase exchanges the provider response; the app verifies its own Supabase
session, never a browser-supplied email. Configure exact Google/Supabase/app
callback URLs per environment, OAuth state/PKCE protection and fixed or tightly
allowlisted `/admin` return paths. Reject external/protocol-relative redirects.
[Google integration](https://supabase.com/docs/guides/auth/social-login/auth-google).

**No public signup, password, magic-link, anonymous or alternate-provider path.**
No domain-wide allowlist: an arbitrary Gmail/Workspace account is insufficient.
Approved admission architecture (to be implemented and tested in 6.1):

1. An active super_admin at AAL2 creates an invitation for one approved email
   and either `admin` or `staff`. The assigned role comes from the database.
2. Invitee opens the admin login and authenticates with that Google account.
3. A private Before User Created Auth hook allows creation only for a pending,
   unexpired invite and the Google provider. Otherwise it rejects generically.
   Hook failure denies creation. It never activates membership or consumes an invite.
4. Callback verifies the session and current Auth user/Google identity. A narrow
   acceptance operation checks the verified email, locks the invite and binds it
   once to `auth.uid()`. It creates/activates the profile and audits acceptance
   atomically. Existing Auth users without a profile need the same valid invite.
5. Every operational request subsequently needs live active membership plus
   its role/capability and any required AAL2. Callback approval alone is insufficient.

This is **invite-restricted identity provisioning**, not open admin registration.
Globally disabling all Auth new-user creation can prevent invited first-time OAuth
users too. In staging, test the hook-controlled configuration rather than assuming
a hidden signup form or global toggle solves admission. Hook-only privileges go
to `supabase_auth_admin`, not anonymous/authenticated API callers. The hook is
supported independently of an application UI, but only runs on new Auth users;
it is not the authorization mechanism for existing users.
[Hook contract](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook),
[hook permissions](https://supabase.com/docs/guides/auth/auth-hooks).

Require provider-confirmed email and a verified Google identity, not editable
`user_metadata`, query parameters or a role in a signup payload. Validate actual
identity fields against the pinned SDK in staging. Bind the Supabase UUID and
Google subject/identity ID on acceptance; do not transfer access by email alone.
Disable manual identity linking in this initial single-provider design. Provider
email changes, removed/replaced identities or unexpected linking suspend access
pending explicit owner review; do not automatically rebind an existing membership.
[Identity linking behaviour](https://supabase.com/docs/guides/auth/auth-identity-linking).

## 3. Super_admin MFA and recovery

Require **Google plus Supabase TOTP**, with **AAL2 for all super_admin operational
access**, not only the user-management buttons. Google account MFA is encouraged
but is not a substitute for the Supabase session's assurance level.
Admin/staff may initially enter at AAL1; offer TOTP and require AAL2 if opted in.
Future sensitive modules may impose AAL2 independently of role.

An authenticated super_admin at AAL1 may access only sign-out, minimal own-account
status and TOTP enrollment/challenge. No member list, invitations or operational
records. After verification refresh/synchronize cookies; server and database must
observe AAL2 before granting access. Missing AAL is treated as AAL1. Current
membership role and verified factor presence are also checked, so stale role/factor
claims cannot restore privileges. Never store TOTP seeds in application tables.
[Supabase MFA and AAL enforcement](https://supabase.com/docs/guides/auth/auth-mfa),
[TOTP flows](https://supabase.com/docs/guides/auth/auth-mfa/totp).

Owner-approved privileged mutations require recent MFA/step-up, targeting
**around 10 minutes where technically supported**, for invite, role, disable,
revoke and factor-removal actions. Validate trusted authentication-method
timestamps and enforcement support during 6.1; this target is not a claim of an
already supported or deployed control. If usable proof is missing, require
another challenge, not a UI-only timer. Resolve and document any technical
limitation before enabling privileged mutations. Test direct Auth factor
unenrollment too: a remaining stale
AAL2 token must not authorize administration after the last verified factor is removed.

Owner-approved recovery custody: use a separate primary authenticator plus a
backup owner-controlled TOTP factor/device; keep encrypted recovery material in
owner-only Vaultwarden and an independently recoverable backup. Independently
protect and preserve Supabase project-owner recovery access. Storing Google
credentials and TOTP together weakens separation. No shared mosque password or staff access
to the owner's vault. Do not assume recovery codes are available: confirm the
chosen SDK/project behaviour before implementation; the current JS reference
documents multiple factors and says recovery codes are unsupported.
[MFA SDK reference](https://supabase.com/docs/reference/javascript/auth-mfa).

If all factors are lost, use a documented **out-of-band project-owner recovery**:
verify owner identity, disable the membership, terminate sessions, record the
recovery, reset factors through authorized Auth administration, re-enroll and
verify TOTP, then deliberately reactivate. No public recovery endpoint that removes
MFA. A sole-super_admin lockout cannot depend on another application super_admin;
maintain independent access to the Supabase project owner account, itself protected
by MFA. Recovery does not change the role or erase the audit trail.

## 4. Roles and future capabilities

| Technical role | Foundation access | Access management |
| --- | --- | --- |
| `super_admin` | All foundation functions, always AAL2 | Invite, revoke/disable/reactivate, change admin/staff roles, review audit |
| `admin` | Own identity/security settings and foundation home | None; cannot invite another admin or staff |
| `staff` | Own identity/security settings and restricted home | None |

**Lock access management to super_admin for 6.1.** The owner is initially the
only super_admin. Only super_admin may ever assign/remove that role; recommend
no additional super_admin invitation/promotion UI in 6.1. A later owner-approved
procedure must guard against removal/disable of the last active super_admin,
require step-up and audit changes. Recovery/bootstrap is a controlled exception,
not a role that ordinary admins can acquire.

Mosque positions may later be descriptive profile metadata; Bendahari, Naqib,
Ketua Imam or AJK are not authorization roles. Add a small capability-grant table
only with the first real module: `(user_id, capability, granted_by, granted_at)`
with a uniqueness constraint and controlled vocabulary. Capability names express
actions such as `module.read` / `module.manage`; deny unknown/ungranted actions.
Use a single shared server/database permission contract, never client-editable
permission JSON. Do not create finance/BKK/campaign permissions or module tables now.
Broad admin access is defined by each future module's reviewed policy, not a
blanket `authenticated` or `admin` grant over every table.

## 5. Proposed minimum database schema

Conceptual design only: no executable migration or deployed table in 6.0.

| Table | Minimum fields and constraints |
| --- | --- |
| `public.admin_profiles` | `user_id uuid` PK/FK to `auth.users.id`; `approved_email` normalized unique; `google_subject` unique; `display_name`; `role` constrained to three roles; `status` constrained to `active/disabled/revoked`; `created_at`, `updated_at` UTC; `version` for guarded admin edits |
| `private.admin_invites` | `id uuid`; `email_normalized`; `role` constrained to three roles (ordinary 6.1 operations allow only `admin/staff`; `super_admin` is restricted to the isolated bootstrap); `status` (`pending/accepted/expired/revoked`); `invited_by`; `created_at`, `expires_at`; `accepted_by`, `accepted_at`; `revoked_at`; `version` |
| `private.admin_audit_log` | `id`; server timestamp; actor UUID (nullable only for explicit bootstrap/system events); target UUID/invite ID; action; allowlisted old/new role or status; outcome; request/correlation ID; actor assurance level |

`invited` lives in the invitation table, not a fabricated Auth user/profile.
This makes expiry and pre-login admission possible without a nullable profile FK.
No profile row is created automatically on generic `auth.users` creation.
No JWT, OAuth token, password, TOTP seed, arbitrary form body or private documents
in audit metadata. Display names are untrusted text and escaped on rendering.

Pending invites have one live invitation per normalized email. Expired rows are
marked/closed transactionally before reissue; a partial unique pending-email
constraint plus locking prevents concurrent duplicate invites. All times use UTC
and expiry uses database time. Normalize by trimming/lowercasing only; do not merge
Gmail dots, plus aliases or different addresses. No bearer invitation token is
needed for this first Google/email allowlist flow: possession of an invite ID/link
alone grants nothing. Approved email ownership and live invite status are required.

Use soft disable/revoke, not destructive Auth-user deletion. Audit actors/targets
are retained identifiers rather than cascading foreign keys into `auth.users`.
Do not let Auth-user deletion cascade-delete governance history. FK/deletion and
retention constraints must be tested in the initial migrations.

## 6. Database/RLS and privileged operations

RLS is enabled in the creating migration, before granting Data API access.
Revoke default table/function privileges; `anon` has no operational grants.
Private schema is not exposed. User-session queries use the public key plus
the caller's JWT, preserving RLS even when called from Next.js.
[RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Conceptual predicates (not deployment SQL):

```text
active_member := auth.uid exists AND live profile.status = active
                 AND current verified Google identity/email matches the approved binding
super_access := active_member AND live role = super_admin
                AND verified session AAL = aal2 AND current verified TOTP exists
manage_access := super_access AND recent second-factor proof
future_operation := active_member AND required role/capability AND required assurance
```

| Caller/state | Own minimal profile | Other member profiles / audit | Invite/role/status mutation | Future module data |
| --- | --- | --- | --- | --- |
| Anonymous | Deny | Deny | Deny | Deny |
| Google user with no membership | Deny; limited acceptance operation only with valid invite | Deny | Deny | Deny |
| Disabled/revoked profile, any still-valid JWT | Deny | Deny | Deny | Deny |
| Active staff/admin | Allow own approved fields | Deny | Deny | Explicit future policy only |
| Active super_admin AAL1 | Minimal own status only for MFA recovery/enrollment | Deny | Deny | Deny |
| Active super_admin AAL2 | Allow | Allow reviewed fields | Guarded operations + recent MFA | Explicit reviewed policy |

Profiles have no direct client INSERT/UPDATE/DELETE grant, even for super_admin.
Profile creation, role/status changes and invite acceptance run through narrow
database operations which lock rows, check expected versions, enforce caller
identity and record audit changes in the same transaction. Never accept an actor
UUID or new privileges as proof of authority. Acceptance derives role from the
locked invite and actor from `auth.uid()`; it cannot create super_admin.

Keep privileged helper implementations in the unexposed `private` schema with
fixed empty `search_path`, qualified names, minimum grants and no dynamic SQL.
If Data API RPCs are used, expose only narrow security-invoker wrappers calling
reviewed private functions, with execution restricted and authorization inside
the operation. Treat a direct SDK/RPC call exactly like a server action. Prevent
profile policy recursion using a reviewed private membership helper; do not query
the same profile policy recursively. Check UPDATE `USING` and `WITH CHECK`,
view security-invoker behaviour and default PUBLIC function EXECUTE grants.

A secret/service-role client bypasses RLS. Do not use it for ordinary membership
reads or management transactions. Optional isolated server-only Auth Admin usage
is limited to deliberate session termination/ban and recovery/bootstrap after
the same live super_admin/AAL2 authorization; it is never a generic database proxy.
If termination fails, the committed membership deny still blocks operational
access and the UI reports the remaining task accurately.

## 7. Invitation, disable and revoke lifecycle

Owner-approved invitations are valid for **7 days**, with expiry evaluated on each attempt.
An expired/revoked invitation cannot activate a profile even if OAuth created an
Auth user earlier. Existing active membership rejects duplicate invitation attempts.
Acceptance is idempotent for the same bound identity; concurrent attempts cannot
consume the invite twice or assign a different user's UUID.

```text
pending invite → accepted + active profile
pending invite → expired or revoked (no membership)
active profile → disabled (temporary) → explicit super_admin reactivation
active/disabled profile → revoked → new explicit invite and reviewed acceptance
```

Role changes, reactivation and re-invites need fresh super_admin MFA and guarded
versions. A revoked tombstone is never silently overwritten by ordinary login.
No re-invite creates a second profile or transfers the former user's identity.
Changed Google email requires approved re-verification/rebinding, not an automatic
email-based merge. Until resolved, deny operational access, with sign-out available.

Disable/revoke commits the live deny and audit first, then attempts refresh-session
termination. JWT role claims are not the source of truth. Old access tokens may
survive sign-out until expiry; live membership/RLS must deny the next database
request immediately, even without token refresh. Concurrent operations already
committed cannot be undone; serialize membership-management transactions against
the actor/target rows and recheck access before sensitive commits.
[Session lifecycle](https://supabase.com/docs/guides/auth/sessions).

## 8. Routes, session and server boundary

Proposed App Router routes only:

| Route | Purpose / protection |
| --- | --- |
| `/admin/login` | Google sign-in; no signup; generic denied feedback |
| `/admin/auth/callback` | PKCE exchange, verified identity, invite acceptance; fixed safe redirect |
| `/admin/mfa` | Owner enrollment/challenge; minimal authenticated identity, no operational data |
| `/admin` | Protected minimal foundation home, current identity and permitted navigation |
| `/admin/users` | Super_admin AAL2: invitations, member role/status, compact audit view |
| `/admin/settings` | Own identity, security/MFA and sign-out; no campaign/payment/global module settings |

Group protected pages below a dedicated layout; keep login/callback/MFA outside
its operational gate. Use `@supabase/ssr` and `@supabase/supabase-js` at versions
verified in 6.1. Add server-only identity/authorization DAL and typed database
clients. Browser client handles Google/MFA/logout, not privileged DB credentials.
Generate `Database` types from migrations rather than hand-maintaining parallel types.

Next.js 16 uses `proxy.ts`. Restrict session-refresh interception to `/admin`
and its subroutes so public Sanity pages/Studio retain their existing behaviour.
Proxy verifies/refreshed cookies for navigation; it is not the authorization
authority. Use SDK-verified `getClaims()` for signature verification and `getUser()`
where fresh identity/account state is needed. Never authorize from `getSession()`'s
unverified embedded user. Each server action/route handler/data read rechecks live
membership, assurance and action-specific authorization; protected layout/UI alone
is insufficient. Database checks remain authoritative for direct API access.
[SSR/session guidance](https://supabase.com/docs/guides/auth/server-side/nextjs),
[Next.js authorization DAL](https://nextjs.org/docs/app/guides/authentication).

Admin routes and session refresh responses are dynamic, private/no-store; never
reuse the public five-minute ISR/cache for users, invites, tokens or roles.
Preserve refresh cookie/cache headers, validate environment-fixed origin, use HTTPS
Secure cookies and suitable SameSite settings via SDK. Do not promise HttpOnly
cookies where browser SDK flows require access; audit actual cookie configuration.
No persistent/shared cache keyed only by route. Clear sensitive client state on logout.

Unauthenticated page requests redirect to login; APIs return 401. Missing/inactive
membership returns generic access denied/403, without revealing the allowlist.
Super_admin without AAL2 is directed to MFA; mutations return an explicit MFA-needed
failure. Network/authorization-query failure fails closed, with retry/sign-out;
never substitute cached authority. Logout is an authenticated POST/server action,
clears the session cookies and resets client state; no state-changing GET link.

Protect mutations against CSRF/origin abuse; validate all inputs and return paths,
rate-limit OAuth/acceptance/access-management attempts, escape output and establish
an admin-specific CSP without breaking Studio. No sensitive URL query data or
token/error-body logging. Existing public route-transition retention must be
bypassed for `/admin`. Authentication checks precede any sensitive HTML/DTO.

Minimal shell: compact sidebar (Home, Users only for owner, Settings), top bar
with current user/role and sign-out, clear save/error states; mobile drawer with
keyboard focus management. Use navy/gold tokens lightly and English-first admin
operations with natural Masjid/Kuliah/Infaq terminology. No placeholder operational
metrics or invented module links. Public website remains Malay.

## 9. Environment and credentials strategy

Owner-approved architecture separates **local, hosted staging and production**.
For Fasa 6.1, **local + hosted staging is sufficient; do not create production**
until the owner explicitly approves production provisioning. Production remains
a future separate project, not a resource authorized by architecture approval.
Separate Google OAuth clients/callbacks and deployment secrets per environment.
Never reuse staging as the live data store while developers run tests against it.
No preview deployment may connect to production operational data by default.

Develop versioned `supabase/migrations/` locally, test from a clean reset with
synthetic identities, promote the same reviewed migrations to staging, run
auth/RLS integration tests, then separately approve production promotion/backup.
No dashboard-only schema edits or copied production users/registrations into
staging. Record environment refs and migration versions, review drift, use forward
fixes rather than destructive live resets. Production backup/restore and region
choice require owner approval before real data. Generate/test types on promotion.
[Environment workflow](https://supabase.com/docs/guides/deployment/managing-environments).

Proposed environment names for 6.1 (documentation only now):

- `NEXT_PUBLIC_SUPABASE_URL`: environment-specific endpoint.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public low-privilege application key.
  Existing ANON_KEY placeholder is legacy compatibility, not an admin credential.
- `SUPABASE_SECRET_KEY`: optional server-only privileged Auth Admin client; no
  `NEXT_PUBLIC_` prefix. Existing SERVICE_ROLE_KEY is legacy equivalent.
- `ADMIN_APP_ORIGIN`: fixed validated server origin for OAuth returns.
- Deployment-only migration credentials/project references belong to a restricted
  CI secret store, not browser/runtime bundles. Google client secret is configured
  in Supabase/provider secret settings, never in public Next.js env.

Supabase currently recommends publishable/secret keys for new integrations;
legacy anon/service-role keys have the corresponding low/elevated privileges.
Public key + authenticated JWT is distinct from a privileged key; the latter
bypasses RLS and must never reach browsers, logs, screenshots or client imports.
[Key model](https://supabase.com/docs/guides/getting-started/api-keys).

Local `.env.local` stays ignored; `.env.example` will document names with empty
placeholders only. In 6.1 add fail-closed startup/config checks for intended project
and origin, separate server-only key imports, CI secret scanning and public-bundle
checks. Never silently use production credentials when staging variables are absent.

## 10. First-super_admin bootstrap

After separate approval of the target environment and schema deployment:

1. Owner/project operator enters the approved owner email through a trusted
   out-of-band administrative procedure, not a public form/client constant/Git file.
2. Create a short-lived bootstrap allowlist record using the invite schema and an
   explicit isolated bootstrap procedure. Ordinary app invites cannot select
   super_admin. Assert no existing super_admin before this one-time operation.
3. Owner signs in with Google. Verify provider email and identity; bind the real
   Auth UUID. Do not insert raw rows into Supabase-managed Auth tables or fake identities.
4. A controlled bootstrap transaction creates the sole owner super_admin profile,
   closes the bootstrap invitation and records an explicit bootstrap audit event.
   The AAL1 profile still cannot enter privileged routes.
5. Owner enrolls TOTP/backup factor and demonstrates AAL2 plus audited access.
   Verify random-user, AAL1 and revoked-session denial in staging.
6. Disable/remove the one-time bootstrap facility; keep no deployed bootstrap
   HTTP endpoint or permanent bootstrap secret. Subsequent membership uses the
   owner-only invitation workflow. Production bootstrap needs its own reviewed plan.

The project operator's infrastructure access is separate from an application role.
No owner's real email, credentials or TOTP secret is requested/stored in 6.0.

## 11. Audit from the first foundation mutation

**Include audit from the first foundation mutation**, not after operational modules.
Three tables remain small, and privilege changes otherwise lack attribution.
Invitation issue/reissue/revoke/accept, role/status changes, bootstrap and recovery
are append-only governance events with server-derived actor/time/assurance. Commit
successful membership mutation and its event atomically; audit failure aborts it.
Browser users cannot insert/update/delete audit rows. Owner-only reviewed reads.

Authentication-provider audit covers login/factor events; it does not replace
business access-management events. Denied attempts/network failures go to sanitized
structured server logs with correlation IDs, separate from a transaction rolled
back on denial. Do not falsely claim those events persisted atomically. Avoid full
IP/user-agent collection initially; these add personal-data retention obligations.
The owner approved inclusion from the first mutation with **proposed 12-month
retention** for access-management events and no client purge action. Confirm final
retention, cleanup/backup behaviour and access before production. Not tamper-proof against infrastructure
owners; backups/restricted project access provide lightweight additional protection.

## 12. Threat model

| Threat | Main mitigation / residual limit |
| --- | --- |
| Random Google user | New-user invite hook plus independent live membership/RLS; generic denial for existing Auth users without a profile |
| Stolen authenticated session | HTTPS, cookie/session hygiene, CSP/XSS controls, short-lived JWTs, live membership and owner MFA/step-up; a stolen AAL2 session is still dangerous until denied/revoked |
| Leaked service-role/secret key | No browser use; isolated secret store/least deployment access; rotate/revoke immediately, inspect logs/data; RLS cannot protect against a privileged-key leak |
| Compromised admin account | No member-management power; limited future capabilities; owner disable and session termination; MFA encouraged for all |
| Staff privilege escalation | No direct role/profile writes; transactional guarded operations derive actor from session; reject editable metadata and role payload authority |
| Disabled/revoked user retains JWT | Live status/identity checks in RLS and server on each request, no cached role authority; terminate refresh sessions as additional measure |
| Browser authorization bypass | Server and DB authorize every action and direct API/RPC call; hidden buttons/Proxy are not security boundaries |
| RLS/grant misconfiguration | Deny-first migrations, explicit grants, policy matrix and direct-client negative tests; no production promotion until tests pass |
| Invite replay/expiry/race | Verified exact email/identity, transactional one-time acceptance, database expiry/locking/unique constraints |
| OAuth redirect/CSRF or wrong account | SDK PKCE/state, fixed callbacks/safe returns, verified provider identity, POST mutation origin checks |
| Sole owner MFA lockout | Backup factor plus independently protected infrastructure-owner recovery; no public bypass |
| Cross-user caching or outgoing screen retention | Dynamic private/no-store admin responses and bypass of public transition wrapper |

## 13. Proposed Fasa 6.1 implementation scope and gates

Fasa 6.0 architecture is owner-approved and closed. **Fasa 6.1 has not started
and must not start in this closeout.** The following is a future implementation
sequence, requiring a separately authorized 6.1 task; architecture approval is
not production provisioning approval:

1. Local clients/config validation, typed migrations for the three tables,
   private helpers/acceptance hook/guarded operations and audit.
2. Local automated auth/RLS tests using synthetic data; generated DB types.
3. Minimal routes/shell, Google callback/session refresh, owner TOTP and manual
   user management. No autosave or operational module features.
4. Use local + hosted staging only. Separately approve the concrete staging
   resource/Google OAuth configuration, then test real identity/MFA behaviour there.
5. Present owner-review results. Production project, migrations and first owner
   provisioning each require a concrete reviewed target/setup/bootstrap plan.

Acceptance checks: unauthenticated, no-profile, inactive/revoked, AAL1/AAL2,
admin/staff/owner policy matrix; direct Data API/RPC bypass; edited metadata;
expired/duplicate/racing invites; changed email/provider; version conflicts;
last-owner protection; removed factors; stale tokens after disable/logout;
session refresh, safe redirects/CSRF, no cross-user caching; secret-free public
bundle/logs; immutable audit and rollback on audit failure. Then lint/build,
public/Studio/Kuliah regressions and responsive/keyboard admin QA. No claims of
security verification until these implementation tests actually run.

Future Fasa 7 can consume identity/capabilities for feature flags and campaign
configuration; **a feature flag is not authorization**. Future Fasa 8+ module scope
must follow AJK requirements, not an assumed Qurban-first implementation. Do not
design Qurban/Ramadan/BKK, payment/receipt/registration/donation transactions or
finance accounting tables/workflows in this foundation.

## 14. Owner-approved decisions and remaining implementation gates

Already required: Google primary login, no public signup, invite-only access,
generic three roles, owner-only initial super_admin, mandatory stronger owner
authentication, separate Studio/admin/data stores. Do not ask to reconfirm these.

Approved by the owner on 6 October 2026 (+08:00), explicitly for the Fasa 6.0
architecture closeout. These decisions are architectural requirements/targets,
not evidence of deployed or tested runtime controls.

| Decision | Owner-approved architecture / implementation boundary |
| --- | --- |
| Access management | Remains super_admin-only in Fasa 6.1; invite admin/staff only, no extra super_admin UI |
| Invitation lifetime | 7 days, checked using database time on every admission/acceptance attempt |
| Super_admin authentication | Google OAuth + Supabase TOTP; AAL2 for all operational access |
| Privileged mutations | Require recent MFA/step-up, target around 10 minutes where technically supported; validate trusted proof/enforcement in 6.1 |
| Admin/staff authentication | May initially operate at AAL1 |
| Owner recovery | Primary authenticator + backup TOTP factor; owner-only Vaultwarden recovery material; independently protected Supabase project-owner recovery |
| Environment separation | Local + hosted staging + future separate production; local + staging sufficient for 6.1; no production provisioning until explicit owner approval |
| Audit | Included from the first foundation mutation, including bootstrap; proposed 12-month retention, restricted access and no application purge |
| Session timeouts | Targets pending selected hosted plan/support; no hardcoded unsupported assumptions |
| Scope | Qurban, Ramadan, BKK, payment, receipt, registration and finance modules remain out of scope |
| Closeout authorization | Documentation/diff checks, commit/push and checkpoint tag only; no runtime auth/database code, Supabase remote resources or Fasa 6.1 start |

Implementation gates still to resolve in a future authorized task: selected hosted
plan and actual timeout/step-up support; concrete staging ownership, region, cost
and callback origins; tested recovery operator/procedure and bootstrap plan.
Manual delivery of generic login instructions is the initial implementation
recommendation; no email integration is part of this foundation scope. Final
audit retention/backup policy and production provisioning need owner review before
production use. Owner identity is supplied privately at execution, not in Git.

Session lifetime/inactivity limits must be confirmed against the selected hosted
plan before deployment; do not promise a plan-specific feature without testing.
The planning targets remain a 15-minute access-token lifetime, 8-hour session
maximum and 30-minute inactivity limit, pending the selected hosted plan and
verified support. Do not hardcode or treat them as approved deployed settings.
They are not guarantees of immediate token invalidation; live membership denial
still applies.
Do not leave production sessions indefinitely renewable by default, or implement
an unreviewed custom timeout mechanism to avoid selecting an appropriate plan.
No remote resource has been inspected, created or configured for Supabase here.

## Review/verification record

Official documentation reviewed on 6 October 2026 (+08:00); links above support
platform behaviour. Schema, roles, lifecycle, defaults and implementation scope
are project architecture, not copied reference implementations. Owner approval
is recorded in section 14; platform-dependent targets remain conditional.
Local Next.js bundled authentication guide was also inspected. Documentation-only
diff/links/scope are checked; runtime lint/build/auth tests are not claimed for a
planning change. Historical execution/audit files remain untouched.

Closeout checks cover the seven canonical Markdown files, local document links,
owner-decision/status consistency, unchanged historical records, whitespace/diff
validity and documentation-only scope. Runtime lint/build/auth/database tests are
not applicable to this checkpoint and are not claimed.

**Fasa 6.0 completed. Checkpoint: `phase-6.0-admin-foundation-architecture`.
Fasa 6.1 has not started. No Supabase remote resources created or configured.**
