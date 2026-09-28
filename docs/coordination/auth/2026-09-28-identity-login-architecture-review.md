# PINTAR 4.0: identity, registration, login, session and recovery. Architecture review

**Status: REVIEW ONLY, awaiting Yazid's rulings. No code, migration, setting, ticket or decision has been changed.**
- Evidence: the repository at `main` `d200387`, and staging's hosted Auth settings read on 28 Sep (run 36382909677).
- Companion: `2026-09-28-staff-signin-shared-computers.md` (yesterday's blast radius).
- DNS records (SPF/DKIM/DMARC) could not be read from here: the egress proxy refused, and was not routed around.

**Headline.** The specification fits PINTAR's architecture **with one material conflict** (C1: open self-registration against institution provisioning) and several rulings. Taken as a whole it is **LARGE**: about 4–5 migrations, ~15 database functions, ~10 new screens, 6 emails, and a new app mail capability. The shared-computer lock is the only cross-cutting part (§6). Nothing requires changing roles, RLS policies, tenancy or the student card model. BOB-12 is **not started** and is a hard prerequisite for exposing passwords or PINs.

---

## 1. Current state (what exists today, verified)

| Area | Exactly what exists |
|---|---|
| **Registration** | **None.** Identities are created only by administrator activation (`src/app/api/akun/aktivasi/route.ts`): the database grants a single-use `account_activation_grants` row (`authorize_account_activation` needs CAN_PROVISION_PEOPLE; `authorize_new_person` needs SYSTEM_ADMIN), then `admin.createUser({email_confirm:true})` runs **with no password**. `handle_new_auth_user` links the account and is **fail-closed**: "PINTAR creates no identity from a sign-up" (PR010). Hosted `disable_signup` = true. Activation sends no email (D-019). |
| **Staff login** | Email magic link with PKCE: `signInWithOtp({shouldCreateUser:false})` (`src/app/masuk/actions.ts:37`), then the `/auth/callback` code exchange. Unknown addresses and throttles are folded into one answer (L-2, D2). The link works on the same device only. |
| **Student login** | Class card (10-digit number plus 6-digit PIN): `signInWithPassword(card-<n>@<card domain>, sha256(pepper‖card‖PIN))` (`src/lib/card.ts`). The PIN is never stored. Cookie idle limit 60 min. |
| **Supabase Auth** (staging) | `disable_signup` true · `jwt_exp` 3600 · `mailer_otp_exp` 3600 · `rate_limit_email_sent` 2/h · `rate_limit_otp` 30 · `rate_limit_verify` 30 · `rate_limit_token_refresh` 150 · refresh rotation on (reuse 10 s) · `sessions_inactivity_timeout` 0 · `sessions_timebox` 0 · `sessions_single_per_user` false · SMTP `pintarselalu.com`, sender "PINTAR Staging". **Not read:** password policy, leaked-password protection, email templates and subjects (no PINTAR workflow sets them, so they are Supabase defaults unless edited in the dashboard), `mailer_otp_length`, the plan tier, and all of production. |
| **Account/person binding** | `persons` (never deleted, anonymised) ← `accounts` (`auth_user_id` unique, `kind` EMAIL or CLASSROOM_CARD, `card_number` unique). One account per person, enforced by the trigger. |
| **Sessions/cookies** | `@supabase/ssr` cookies, **not httpOnly**; the browser client is used only for signed uploads (`PanelUnggah.tsx:127`). Max-Age is forced to 7 days (email) or 60 min (card) and slides on every request. The proxy calls `getUser()` on every request (`src/proxy.ts`). |
| **Password support** | The provider is on and used by cards (derived secrets) and by local test fixtures (staff personas sign in with passwords, `selftest/app.test.ts:134`). No hosted staff account has a password. There is no set, change or reset screen. |
| **Username** | None. |
| **Staff PIN** | None. The card PIN is a derivation input, not a stored secret. |
| **PINTAR ID** | None. `persons.id` is a UUID; `card_number` exists for cards only. |
| **QR** | None for identity. The only public QR pattern is certificate verification (`/verifikasi/<token>`, INV-38, `public_surface_registry`, proxy `PUBLIC_PREFIXES`). |
| **Recovery** | None. |
| **Email** | Only Supabase Auth emails, through custom SMTP on Namecheap Stellar (50/h per domain). D-053 moves to Stellar Business before external testing. **The app sends no email and has no mail library.** |
| **Rate limiting** | Only GoTrue's per-IP limits. Every Auth call is made from PINTAR's server, so GoTrue sees one address for everybody. PINTAR has no attempt or lockout counters. |
| **BOB-12** | **TODO.** Contract published 25 Sep; DAISY-13 is built against it and held off Daisy's lane. There is no forwarding code (`Sb-Forwarded-For` appears nowhere in `src/`). Bob's queue: BOB-23, then BOB-12. |
| **Audit** | `audit_log` is append-only and generic (`audit_write(action, table, id, institution, summary)`, ~70 action names). **Zero** sign-in, sign-out, session or credential events are recorded. Supabase keeps its own `auth.audit_log_entries`. |
| **Admin notification** | **None**: no email and no security inbox. Authority exists as SYSTEM_ADMIN (platform) and school admins scoped by institution, whose person visibility is set by D-048 and D-049. |
| **Hashing / scheduling** | `pgcrypto` is installed (so `crypt()` with bcrypt is available). No `pg_cron`. |

---

## 2. Gap matrix

EXISTS · SMALL · MODERATE · LARGE (cross-cutting) · BLOCKED · FUTURE

| Req | Requirement | Class | Note |
|---|---|---|---|
| A | Concepts kept separate | SMALL | PINTAR ID on `persons`; username, password and PIN on the account; roles untouched |
| B1 | "Buat akun PINTAR" by email | MODERATE + **conflict C1** | Must be bound to provisioning (§5) |
| B2 | 6-digit code, server-verified | SMALL (config) | Supabase OTP code: the template carries `{{ .Token }}`, then `verifyOtp({type:'email'})`. No magic link needed |
| B2 | Short validity | SMALL | `mailer_otp_exp` 3600 → 600 |
| B2 | Resend, cooldown | SMALL + **conflict C3** | GoTrue `smtp_max_frequency` 60 s per address; a visible countdown needs D2 amended |
| B2 | Rate limit / attempt limit | MODERATE, BLOCKED on BOB-12 | GoTrue has no per-code attempt cap, so PINTAR needs its own counter; per-IP limits are meaningless until BOB-12 |
| B2 | No enumeration, audit | EXISTS (pattern) + MODERATE | Extend the L-2/D2 fold; new audit actions |
| B3 | "Email berhasil diverifikasi" and continue | SMALL | `verifyOtp` returns a session |
| C | Username (rules, canonical form, uniqueness, reserved names, availability, change policy) | MODERATE | New table with a unique canonical index; race handled by the index; availability only after verification, rate-limited |
| C | Username → email for login | MODERATE (security-sensitive) | Service-role-only resolver in an API route (F01-S03), never anon-callable, never returns the email to a client |
| C | Password, policy, show/hide, confirm | SMALL | `updateUser({password})`; policy is a Supabase setting |
| D | Personal PIN (blocklist, bcrypt, never returned, admins never see it, server counters) | MODERATE | New table with no client access; functions only |
| E | PINTAR ID (8 chars, 4+4, random, no confusing characters, unique, durable) | MODERATE | `persons.pintar_id` plus a backfill of existing persons |
| E | QR on the final screen | SMALL–MODERATE | New dependency (a QR library, rendered server-side as SVG); content = the public ID URL |
| F | Digital card **by email** | MODERATE + **decision C8** | Needs an app mail capability (none today) |
| F | Digital card on screen / download | SMALL | Same data |
| G | Physical card | FUTURE | Keep the QR a pointer, not a credential |
| H | Email + password login | SMALL | Native |
| H | Username + password login | MODERATE | The resolver above |
| H | Authorisation unchanged | EXISTS | Nothing depends on the sign-in method |
| I | Students keep class cards | EXISTS | Unchanged; BOB-12 hardens it |
| J | "Komputer siapa ini?" remembered per browser, default shared | MODERATE + **decision C11** | httpOnly browser cookie plus mode recorded on the server session; school-managed designation FUTURE |
| K | Personal session persistent | EXISTS (D-009, 7 days sliding) | An absolute lifetime (`sessions_timebox`) depends on the plan |
| L1 | Shared lock after 5 min, server-enforced | **LARGE** | §6 |
| L2 | Lock → sign-out after 60 min | MODERATE (on L1) | Server TERMINATED state, refusal by the database check, shared cookie ≈ 65 min, delete of the `auth.sessions` row (to prove on hosted) |
| M | Inactivity defined properly | MODERATE | §6 |
| N1 | Email recovery by code, then new password | SMALL–MODERATE | `resetPasswordForEmail` with a code template, `verifyOtp({type:'recovery'})`, `updateUser`, `signOut({scope:'others'})` |
| N2 | PINTAR ID + PIN recovery | **LARGE** (security-critical) | A new unauthenticated path that can take over an account: a service-side password set through a single-use grant |
| O | Progressive lockout 1 h / 4 h / 24 h | MODERATE + **decisions C5, C6** | State machine per account |
| P | Lock only the PIN-recovery method | SMALL (given O) | By design |
| Q | Admin notifications at thresholds | MODERATE + **decision C7** | No infrastructure; an in-app list is MODERATE, email depends on C8 |
| R | QR recovery = same policy | SMALL (after N2) | QR opens the same endpoint; one counter. FUTURE/OPTIONAL for the pilot |
| S | Keluar (this device) | EXISTS | D-009, BOB-05 |
| S | Keluar dari semua perangkat | SMALL | `signOut({scope:'global'})` with confirmation |
| T | Branded auth emails (code, resend, recovery, password changed) | SMALL–MODERATE (config + design) | Supabase templates and subjects set through the Auth-settings workflow; "password changed" depends on the hosted notification support (to read) |
| T | Card email and security email | depends on C8 | App mail |
| T | Deliverability and volume | BLOCKED on D-053 (Stellar Business) + unknown SPF/DKIM/DMARC | Gate 0 |
| U | BOB-12 | **BLOCKED / prerequisite** | TODO |
| V | 150-tester proof matrix | MODERATE | Harness work (§8); codes can be read without an inbox via admin `generate_link` (`email_otp`) on staging and Mailpit locally |
| W | Unassisted usability | MODERATE | A moderated walk with 3–5 real educators |

---

## 3. Blast radius

| Item | Scope |
|---|---|
| **Migrations** | ~4–5, forward-only and additive: (1) `persons.pintar_id` + generator + backfill; (2) usernames, personal PINs, credential-setup state; (3) attempt counters, recovery lockouts, security events; (4) session lock state + the database's pre-request check; (5) audit action coverage. |
| **Tables/columns** | `persons.pintar_id` (unique); `account_usernames` (canonical unique, reserved list, change history); `account_pins` (bcrypt hash, set_at); `credential_setup` (password/username/PIN done); `verification_attempts` (keyed by address hash); `recovery_locks` (per account: level, locked_until, clean_since); `session_locks` (per `session_id`: mode, last_activity, locked_at, attempts, state); a `security_events` view over `audit_log`. |
| **Functions (~15)** | `generate_pintar_id`, `claim_username`, `username_available` (throttled), `resolve_login_identifier` (service-only), `set_personal_pin`, `resume_session_with_pin`, `recovery_verify_pin` (service-only, progressive), `recovery_state`, `record_code_attempt`, `session_heartbeat`, `session_lock`, `session_lock_state`, `terminate_session`, `check_request` (pre-request), `list_security_events` (scoped), `credential_setup_state`. |
| **Auth hooks** | **None needed**: `session_id` is already in the JWT. The pre-request check is PostgREST configuration (`alter role authenticator set pgrst.db_pre_request …`), which PINTAR does not use today. |
| **Proxy** | Lock-state check; forcing unfinished set-up into the wizard; shared-mode cookie lifetime; new public paths (`/daftar`, `/lupa`, `/id/<PINTAR ID>`). |
| **Frontend** (Daisy) | `/daftar` (email → code → account → PIN → welcome with PINTAR ID and QR); `/masuk` (email or username + password); `/lupa` (method choice, code, PINTAR ID + PIN, lockout message); `/kunci` (lock); the "Komputer siapa ini?" step; **Akun saya** (card, password, PIN, sign out everywhere); an admin security events page; activation copy (D-019); roughly 100+ new `hle` keys. |
| **Email templates** | Supabase: code (registration), recovery code, password changed (if supported). App: digital card, security notification (C8). |
| **Tests** | Adapt ~15–18 (sign-in contract: L2-KONTRAK-01, UX1-MASUK-*, DAISY-01-*, DAISY-09-AKTIVASI-01, UX1-DATA-JUJUR-01, L1-SENSUS-01; session: BOB05-K01/R01, F01-R05, DAISY-02-KELUAR-01, DAISY-18-DENGAR-01). New ~60–80 red cases across db, static and app. About 270 authorisation, RLS, publishing and assessment tests unchanged; card tests unchanged. |
| **RLS** | No existing policy changes. New tables have RLS on and no direct client access. |
| **CI/selftests** | Manifest additions; no new runner if browser-only behaviour is proven in the audit journeys (Playwright). |
| **Harnesses** | Audit job B: 6 email sign-ins → code registration + password (Mailpit). Staging journey and U-PERF: synthetic staff need completed set-up and must survive or unlock the lock. `staging.yml`'s link check stays valid. |
| **Supabase config** (staging, then production at release) | Templates and subjects, sender "PINTAR", `mailer_otp_exp`/`length`, `rate_limit_email_sent`, password policy, plan-dependent session limits, IP forwarding (BOB-12). `disable_signup` **stays true**. |
| **Vercel** | SMTP credentials per environment if app mail is approved (D-039 naming); the public ID URL base. |
| **Operational** | Stellar Business (D-053); SPF/DKIM/DMARC; a security recipient; a support procedure for recovery-lock resets. |

---

## 4. Security review (threat model)

| Threat | Control in the design | Residual |
|---|---|---|
| **Stolen or photographed card** (name, ID, QR, no secret) | ID + PIN recovery with progressive lockout, email to the owner at every lock and every successful recovery, all sessions revoked on recovery | With the specified never-ending 24 h cycles, a persistent attacker gets ~9 tries on day 1 then 3 per day: about **11% within a year** against a uniformly chosen PIN, more against human-chosen ones. **Recommend a bounded policy (C5):** after the third lock, PIN recovery stays closed until an email recovery or an admin reset (≤12 tries in total, ≈0.1%). |
| Guessed PIN at the lock screen | Needs the live locked session; 3 tries, then termination; blocklist | Low |
| Distributed PIN guessing | Counters per account, not per IP; PINTAR IDs are not enumerable (32⁸ ≈ 1.1×10¹²); alert on bursts of locks | Low–medium (needs many physical cards) |
| Username enumeration | Same error and similar timing on login (dummy sign-in); availability checks only after verification and throttled | Low |
| PINTAR ID enumeration | Random, uniform answers, per-IP limit (after BOB-12) | Low |
| Credential stuffing / brute force | **BOB-12** (real IP), PINTAR per-account backoff, password policy, leaked-password check if the plan allows | **Medium until BOB-12** |
| Lost personal device | "Keluar dari semua perangkat"; a password change revokes other sessions | Up to 7 days if unnoticed |
| Shared browser left signed in | Lock after 5 min, termination after 60 min | The first 5 minutes; devices misclassified as personal (C11) |
| Malicious second user at a locked screen | PIN required; 3 fails → this session ends; Keluar only ends that session | Low |
| **Browser token bypass** (cookies are JS-readable) | Server-side lock keyed by `session_id`, enforced in the proxy **and** the database's pre-request check; refreshed tokens keep the same `session_id`; no Storage policies (signed URLs only) | Low. Optional hardening: httpOnly cookies (the browser client only needs signed uploads), which has its own blast radius |
| Multiple tabs | Server state plus a cross-tab broadcast | Low |
| Session fixation | Supabase issues a new session at each sign-in; recovery grants are single-use, httpOnly, bound to the browser; nothing accepts a session id from a URL | Low |
| Recovery denial of service | Only the PIN method locks; sessions and email recovery are unaffected; notifications only at thresholds; send limits per address | Low |
| Cross-school leakage | Security events: the platform admin sees all; school admins only for persons visible under D-048/D-049 (C7); ID pages reveal no name or school | Low |
| Administrator misuse | No secret is ever visible; lock resets audited | Platform-admin insider (as today) |
| QR copying | The QR is only the public ID URL | Same as a stolen card |
| Registration abuse | Codes are sent only to provisioned, unfinished accounts (C1); limits per address | Low |

**Is a 4-digit PIN acceptable?** For **session resume**, yes: it needs the live locked session, 3 tries, and a blocklist. For **account recovery**, only with the bounded escalation, owner notification and BOB-12. Otherwise the recovery path is the weakest door into the account.

---

## 5. Conflicts and decisions required (not resolved here)

| # | Conflict / decision | Recommendation (for Yazid to rule) |
|---|---|---|
| **C1** | **Open self-registration vs. institution provisioning** (L-2, F-01, the fail-closed trigger, `disable_signup`, D-048/D-049). "Buat akun PINTAR" reads as registration by anyone. | **Registration = claiming a provisioned account.** An admin records and activates the person as today. The person then enters their email; a code is sent **only** if the account exists and is unfinished. Unknown addresses see the same screen and get no email. The model stays intact. |
| C2 | D-019 (activation sends no email) | Activation itself stays email-free; the person starts registration. Activation copy changes from "/masuk" to "/daftar". |
| C3 | D2 (frozen: "no timer, no countdown, no cooldown" on the sign-in screen) vs. a visible resend cooldown | Amend D2: a **uniform** 60 s countdown shown after every submission, known or unknown address alike, so nothing is revealed. |
| C4 | D-009 session policy | Personal: unchanged (7 days sliding). Shared: lock at 5 min, sign-out at 60 min. |
| C5 | Recovery escalation that "remains at 24 h" indefinitely | **Bounded:** after the third lock, PIN recovery stays closed until email recovery or an admin reset. |
| C6 | Escalation reset | A successful legitimate recovery, an audited admin reset, or 30 clean days. |
| C7 | Who "admin" is for notifications | Platform admin (SYSTEM_ADMIN) sees all. School admins only for persons within their D-048 visibility (or not at all for the pilot). The account owner is emailed too. |
| C8 | Digital card and security emails need an **app mail capability** (none today) | Pilot: card on screen and downloadable from Akun saya, plus in-app security list. App mail as its own gate if the email is required for the pilot. |
| C9 | Username scope and changes | Global and unique; lowercase `a–z 0–9 . _`, 4–20 characters, starting with a letter; reserved list; changeable at most once per 30 days, with the old name held for 90 days. |
| C10 | Existing staff | Forced set-up at next sign-in (password and PIN required; username optional?). |
| C11 | Device classification is user-declared | Accept for the pilot with shared as the default; school-managed designation is future work. The residual risk is acknowledged. |
| C12 | Sessions after recovery | Email recovery: revoke all other sessions. PIN recovery: revoke all sessions and email the owner. |
| C13 | Evaluation personas | Excluded from password, PIN and PINTAR ID flows (`assert_evaluation_boundary` stays). |
| C14 | Magic link | Removed from user-facing flows (codes replace it); `/auth/callback` stays for admin-generated links (staging checks, evaluation). |
| C15 | Order | BOB-23, then BOB-12 (prerequisite), then the auth gates. BOB-12 needs Yazid's settings (IP forwarding, forwarding key). |
| C16 | Readiness (D-052) | This is a large addition inside ENGINEERING COMPLETE; the pilot gate follows it. |
| C17 | Students | Give everyone a PINTAR ID (cheap backfill); PIN recovery and set-up flows are for staff only in 4.0. |
| C18 | Plan-dependent features | Read the plan: leaked-password protection, `sessions_timebox`, `sessions_inactivity_timeout`. |

---

## 6. The shared-computer lock (L, M): can it make the pilot?

**Yes, as its own gate, with a defined fallback.**

**Enforcement.** The lock needs server-side state per Supabase `session_id` (a claim already in the JWT), checked in two places:
1. **The proxy**, on every staff request: one more database lookup on the hot path, which U-PERF must re-measure (D-031/D-046).
2. **The database's pre-request check**, on every API call. The browser can read its own tokens, and the database API accepts a revoked session's token until it expires (up to 1 h). This check must be near-free for card sessions.

**Terminating after 3 wrong PINs, or 60 minutes locked:**
- the server signs the session out with local scope (as `/keluar` already does), or deletes its `auth.sessions` row when the browser never returns;
- the pre-request check refuses what remains of the token's life;
- the person's other sessions stay alive (`sessions_single_per_user` false; BOB05-R01 proves local scope).

**Client side:**
- activity events (pointer, touch, key, wheel, input) from any tab, shared across tabs;
- a heartbeat about once a minute; the **server** judges idleness, so sleep/wake and background tabs resolve at the next request;
- a 30–60 s warning ("PINTAR akan terkunci… Saya masih di sini");
- media playing or full-screen counts as activity;
- the lock is a **hard navigation** to `/kunci`, with no-store caching and a back/forward-cache handler; reload, deep links and new tabs all hit the proxy check;
- unsaved form input is lost at lock unless drafts are kept (kept drafts are readable on that computer).

**Teaching:** the warning plus pointer movement covers presenting. A "mode presentasi" is a product option, not part of this design.

**Fallback if the gate is not green at the pilot:** shared mode = automatic sign-out after 10–15 min idle, with no PIN resume. It reuses BOB-05 and is safe. The PIN then serves recovery only until the lock ships.

---

## 7. Recommended 4.0 pilot boundary

**In:**
- registration as claiming a provisioned account, with a 6-digit code;
- username, password and PIN;
- the PINTAR ID with its QR (the QR shows the public ID URL);
- the digital card on screen and downloadable (by email if C8 = yes);
- login by email or username with a password;
- email recovery by code;
- PINTAR ID + PIN recovery with **bounded** progressive lockout;
- threshold notifications (platform admin in-app, and the owner by email once app mail exists);
- personal and shared device modes, with shared as the default;
- a personal session of 7 days;
- the shared lock (5 min) and sign-out (60 min), server-enforced, **with the fallback above**;
- Keluar and Keluar dari semua perangkat;
- branded Supabase auth emails;
- BOB-12 as a prerequisite.

**Future or optional:** QR-scan recovery (R); physical cards; school-managed shared designation; everything in X.

---

## 8. Implementation sequence and acceptance evidence

Lanes:
- **Bob:** migrations, functions, API routes, proxy, the pre-request check, the Auth-settings workflows.
- **Daisy:** every screen, all copy, email and card design.
- **Coordinator:** harnesses, U-PERF, gates, releases, decisions and board.
- **Yazid:** rulings and account settings (Supabase, Vercel, Namecheap).
- **Lana:** not involved.

**Gate 0: rulings and facts** (Yazid, coordinator)
- Rulings C1–C18 recorded as numbered decisions; this specification frozen in `docs/coordination/auth/`.
- A read-only settings report for staging and production (password policy, templates, OTP length, plan features; secrets masked).
- SPF/DKIM/DMARC result; Stellar Business date; security recipient; count of existing production staff accounts.

**Gate 1: BOB-12** (Bob; Yazid's settings)
- BOB-12's tests red, then green: the forwarding header is present on Auth calls and absent on data calls; a per-card attempt counter.
- A staging probe shows two client addresses limited independently.
- CI green; audit no worse.

**Gate 2: identity foundation** (Bob) — database selftests:
- PINTAR ID: format and alphabet; 100 concurrent inserts are unique; the backfill leaves 0 persons without an ID.
- Usernames: canonical form, reserved names, and two concurrent claims → exactly one wins.
- PIN: the blocklist is refused; the stored hash never equals the input; no function returns it.
- Counters are atomic under concurrency.
- anon and authenticated can read none of the new tables (red cases).
- Audit rows are written; both migration paths are green in CI.

**Gate 3: registration and password login** (Bob, Daisy; coordinator harness)
- A provisioned address gets a code and reaches the wizard. An unknown address gets the identical screen, no email (Mailpit empty) and no auth user.
- Wrong code: the counter stops it. An expired code is refused.
- Username collision handled; password policy applied.
- Login by email and by username. A wrong password gives the same error with similar timing.
- Existing card tests green; D-010 homes unchanged; school-isolation tests green.
- Audit job B: Gladys registers and signs in by password on the real screens. The staging journey is green.

**Gate 4: email recovery** (Bob, Daisy)
- Recovery by code works.
- Another session of the same person can no longer refresh afterwards (red, then green).
- Uniform answers for unknown addresses; the password-changed email arrives (Mailpit).

**Gate 5: PINTAR ID + PIN recovery** (Bob, Daisy)
- The success path works.
- Lockouts escalate 3 fails → 1 h, → 4 h, → 24 h, then the bounded rule (tested with a controlled clock).
- Email recovery works during a lock; sessions and other devices are untouched.
- Notifications fire only at thresholds and contain no secret (static scan plus a database assertion).
- The QR, if included, uses the same function.
- Answers are uniform; the per-IP limit holds after BOB-12.

**Gate 6: device modes and the shared lock** (Bob, Daisy; coordinator harness)
- HTTP-level:
  - a locked `session_id` is redirected on every protected path, and its API calls are refused;
  - a **direct database API call with the locked session's JWT is refused** (red before, green after), and so is a refreshed token;
  - 3 wrong PINs: that session's refresh fails while another session of the same person still works;
  - 60 min abandoned: the session is terminated (controlled clock);
  - card sessions are unaffected.
- U-PERF: within the agreed budget.
- Playwright (audit journeys):
  - multi-tab lock;
  - Back shows nothing, reload shows the lock, a new tab shows the lock;
  - activity prevents locking; 5 minutes idle locks after the warning.

**Gate 7: emails and the card** (Daisy design; Bob and coordinator config; app mail if approved)
- Every email rendered on desktop and mobile (screenshots).
- A static scan finds no developer or Supabase terms.
- The sender identity is correct.
- SPF/DKIM/DMARC pass in a real inbox.
- 150 registrations simulated within the configured limits (Stellar Business).

**Gate 8: pilot validation** (coordinator, Yazid)
- Matrix V executed on staging with evidence for each row.
- 3–5 educators complete W1–W7 unaided (observed and recorded).
- Production release through the normal process (migrations, Auth settings, app, REL checks), with a rollback point.

**Queue fit:**
- Bob: BOB-23 (in progress) → BOB-12 (Gate 1) → Gates 2–6.
- Daisy: continues the reader walk; auth screens start at Gate 3 against Bob's published contracts.
- The cross-device sign-in relay (M1) stays 4.5; password login removes most of its need.
