# PINTAR 4.0 identity/login: decision package (C1–C18)

> **Historical input, superseded 29 Sep by the canonical specification `IDENTITY-4.0.md` (D-054 to D-058).** Kept as evidence; where it differs, the specification wins.

**Status: PROPOSED, for Yazid's rulings.** Nothing is implemented, ticketed, configured or recorded as a decision.
- Basis: `2026-09-28-identity-login-architecture-review.md` (main `52f312f`).
- New evidence: one read-only count query each on production and staging (28 Sep).

**Account state (read-only, 28 Sep):**
- **Production:** 1 person, 1 EMAIL account (the sole SYSTEM_ADMIN); 0 class cards; 0 evaluation personas; 0 active sessions.
- **Staging:** 53 persons: 3 EMAIL accounts (synthetic admin, synthetic teacher, system admin; all with active roles) and 50 synthetic class cards; 0 personas; 116 sessions from test runs.
- **Both:** no duplicate or non-lowercase addresses, no orphaned accounts or persons.
- `auth.users.encrypted_password` is non-empty for every EMAIL account. That does **not** prove anyone knows a password, so all existing staff are treated as having none.

## A. Decision table

| ID | Decision / conflict | Current architecture | Second Eye recommendation | Risk if wrong | Dependency | Proposed ruling |
|---|---|---|---|---|---|---|
| **C1** | Registration vs. provisioning | Identities are created only by admin activation (single-use grant → `createUser`); the trigger is fail-closed (PR010); `disable_signup` true; `shouldCreateUser:false` | "Aktifkan akun" = claiming a provisioned EMAIL account. A code is sent only to existing accounts whose set-up is unfinished; every other address gets the identical screen and no email | Open sign-up creates persons with no school and bypasses L-2/F-01 | C2, C8, C10 | **Yazid, preliminary: ACCEPT.** "Aktifkan akun PINTAR Anda"; neutral copy; provisioning boundary unchanged |
| **C2** | D-019 ("activation sends no email") | Admin activation creates the auth user, sends nothing, and tells the person to open /masuk | Admin activation stays silent; the person starts "Aktifkan akun"; codes, card and security emails come from PINTAR's own flows | Screens promising an email that never comes, or two competing invitation paths | C1, C8 | **Proposed:** amend D-019. Activation by an admin sends nothing; its copy points to "Aktifkan akun PINTAR Anda"; an invitation email is out of scope |
| **C3** | D2 forbids any countdown on sign-in | Code comment and L2-KONTRAK-01 freeze "no timer, no countdown" | A countdown on **code-resend screens only**, started identically after every submission (known or unknown address); the server enforces per-address limits silently | A countdown driven by the provider's per-address state would recreate the existence oracle D2 closed | C1, BOB-12 | **Yazid: ACCEPT narrow amendment.** ⚑ It must be uniform, not "real per-address state" (§G) |
| **C4** | D-009 session policy | Email 7 days sliding idle; card 60 min; Supabase-side unlimited | Personal device: unchanged (7 days). Shared device: lock after 5 min, sign-out after 60 min; fallback idle sign-out 10–15 min without PIN. Cards unchanged | Too short: teachers re-authenticate constantly. Too long: exposure on shared PCs | C11, Gate 6 | **Proposed:** extend D-009 with the two device modes as stated |
| **C5** | PIN-recovery escalation | No recovery exists | 3 wrong → 1 h; 3 wrong → 4 h; 3 wrong → **suspended**. Restore only by (a) email recovery **plus a new PIN chosen in that flow**, or (b) an audited platform-admin reset that forces a new PIN at next sign-in. Owner notified at each lock and each success. Only the method is locked | Unbounded retries ≈ 11%/year takeover of a photographed card; an over-broad lock is a DoS | C6, C7, C8, BOB-12 | **Yazid: ACCEPT (bounded).** Reset semantics as in this row |
| **C6** | Escalation reset | — | Levels 1–2 fall back to 0 after 30 days with no failure; a successful PIN recovery → 0; suspension is lifted **only** by C5's restore paths, never by time | Resetting by waiting hands attackers new guesses | C5 | **Proposed:** as recommended |
| **C7** | Who is notified | No notification infrastructure; SYSTEM_ADMIN and school-admin scopes exist | Owner by email; platform admin by an in-app security list plus email to a named security recipient; no school admins in 4.0 | School admins receiving cross-school or sensitive security data | C8; Gate 0 (recipient) | **Yazid: ACCEPT.** No existing school-admin function depends on this, so nothing is removed |
| **C8** | App email capability | The app sends no email; only Supabase Auth emails through Stellar SMTP | One PINTAR mail path for all six emails. Codes are issued by Supabase (admin `generate_link` → `email_otp`), sent by PINTAR, verified by `verifyOtp`. PINTAR rate-limits its own sends | Raw Supabase emails; sends without limits; deliverability failures | Gate 0 (SMTP, DNS, D-053), BOB-12 | **Yazid: ACCEPT.** ⚑ Sending architecture to confirm at Gate 0 (§G) |
| **C9** | Username rules | None | Global; canonical lowercase; `a–z 0–9 . _`, 4–20 characters, starts with a letter; not shaped like an email, a PINTAR ID or a number; reserved list; changeable once per 30 days, old name held 90 days; server-only resolver (§D) | School-scoped names would need a school picker at login; weak rules invite impersonation | Gate 2 | **Proposed:** as recommended |
| **C10** | Existing staff | Production: 1 EMAIL account (sole SYSTEM_ADMIN). Staging: 3 EMAIL accounts. None has a known password | Every EMAIL account starts in SET-UP REQUIRED and goes through the same activation with a fresh code; no new person or account is created; rehearsed on staging; break-glass for the sole admin (§C) | Stranding the only production admin; duplicate persons | C1, C8, C14 | **Proposed:** the transition in §C |
| **C11** | Device classification | None | Declared per browser; shared is the default; kept in an httpOnly browser cookie and on the session record; students are never asked; school-managed designation later through the same field | Users choosing "personal" on shared PCs | C4, Gate 6 | **Yazid: ACCEPT provisionally**, subject to Gate 6 evidence |
| **C12** | Sessions after a successful recovery | — | Any successful password reset (email or PIN) signs out **all other** sessions and emails the owner ("Bukan Anda? Pulihkan melalui email"). Locks never sign anything out | An attacker keeps a session after the owner resets; or an attacker's reset signs the owner out (mitigated by the email and email recovery) | C5, C8 | **Proposed:** sign out all others on reset; locks sign nothing out |
| **C13** | Evaluation personas | No password; access-token-only sessions (EVAL-S01, `assert_evaluation_boundary`) | Excluded from password, PIN, username, PINTAR ID, set-up gating and device prompts | Breaking the evaluation boundary assertion | Gates 2–3 | **Proposed:** exclude |
| **C14** | Magic link | Everyday staff sign-in; `/auth/callback` | Removed from all user-facing flows **in the same release** as activation, password sign-in and email recovery; `/auth/callback` kept for admin-generated links (staging checks, evaluation) | Removing it before passwords and recovery exist strands users, including the sole admin | C10, Gates 3–4 | **Proposed:** retire with the Gate 3–4 release |
| **C15** | Order with BOB-12 | BOB-12 TODO; Bob on BOB-23 | Keep BOB-23 → BOB-12. Extend BOB-12's approved forwarding (currently `POST /auth/v1/token` only) to the code-verification endpoint | Passwords and codes live behind one shared IP limit | Gate 1 | **Proposed:** order unchanged; scope extension agreed with Bob at Gate 1 |
| **C16** | Readiness (D-052) | Working toward ENGINEERING COMPLETE | This work sits inside ENGINEERING COMPLETE; the pilot is Gate 8 | Rushing to a date | — | **Proposed:** recorded under D-052 |
| **C17** | PINTAR ID for students | — | Every person gets an ID (backfill: production 1, staging 53); only staff see or use it in 4.0; the card experience is unchanged | Surfacing IDs to students by accident | Gate 2 | **Proposed:** all persons; visible to staff only |
| **C18** | Plan-dependent features | Plan unknown | Read the plan: leaked-password check, `sessions_timebox`, inactivity limit. Use them if available; the design must not depend on them | Assuming features that don't exist | Gate 0 | **Proposed:** a Gate 0 read, not a design dependency |

## B. Contradiction and dependency findings

**A. Conflicting pairs:** none irreconcilable. Three need exact wording:
- **C3 × C1:** a countdown reflecting real per-address state would reveal which addresses exist. It must be uniform.
- **C5 × C12:** a *lock* signs nothing out; a successful *reset* signs out all other sessions. These are different events, so no conflict.
- **C5's lock message × PINTAR ID enumeration:** showing "locked" only for real IDs would reveal which IDs exist. Counters must be keyed by the typed canonical ID whether or not it exists, so the answers stay uniform.

**B. Changes to core models:**
- Identity model: C9 (username on the account) and C17 (PINTAR ID on the person). Both add attributes; the person ↔ account ↔ Auth binding is unchanged.
- Tenancy: none. RLS: no existing policy changes; new tables are closed to clients.
- Role authority: none. C7 adds only a read for SYSTEM_ADMIN.
- School provisioning: C1 keeps it; C2 changes wording only.
- Class cards: none (C11 and C17 exclude students).

**C. Rulings needing a migration:**
- C1/C10 (set-up state);
- C5/C6 (recovery ladder);
- C9 (usernames);
- the PIN table;
- C11/C4 (session modes and locks);
- C17 (PINTAR ID and backfill);
- C7 (security events);
- C8 (send log and limits).

**D. Supabase configuration:**
- C8/C14: OTP expiry and length; templates set to a branded fallback even if unused;
- C4/C18: plan-dependent session limits;
- the password policy;
- BOB-12: IP forwarding and rate limits;
- C3: GoTrue's resend frequency.
- `disable_signup` stays true.

**E. Vercel secrets:** C8 (SMTP credentials per environment, D-039 naming) and BOB-12 (forwarding key). Recovery grants and device cookies use random values stored hashed on the server, so no new signing secret.

**F. External email/DNS/provider work:** C8 (SMTP mailbox, SPF/DKIM/DMARC, Stellar Business per D-053) and C7 (security recipient mailbox).

**G. Security depending on BOB-12:**
- password sign-in (credential stuffing);
- code verification;
- per-IP throttles on activation, recovery and ID or username lookups.

PINTAR's per-account counters (C5, codes) are the primary control and don't depend on BOB-12.

**H. Hard to roll back:**
- C14's magic-link retirement: reversible, since accounts stay valid for links.
- DNS policy: start DMARC at `p=none`.
- Gate 6's database pre-request hook: reversible with `reset pgrst.db_pre_request`, but must be planned.
- Signed-out sessions (C12): not reversible, but harmless.
- Column additions (C9, C17): can be left in place.

**I. Affects existing users:** C1, C4, C9, C10, C12, C14, C17.

**J. Needs migration or backfill for existing users:** C17 (PINTAR IDs: production 1, staging 53) and C10 (set-up state initialised as REQUIRED for EMAIL accounts: production 1, staging 3). No username or PIN backfill: people choose their own.

## C. Existing-user transition

1. **At release,** every EMAIL account (except personas, C13) is in SET-UP REQUIRED. Class cards are untouched.
2. **"Masuk ke PINTAR" also offers "Aktifkan akun PINTAR Anda".** An existing staff member types their address and gets a **fresh** 6-digit code. This proves ownership now, not by a months-old magic link.
   - An address that is already set up gets the same screen, and its inbox receives a neutral "akun Anda sudah aktif — masuk atau pulihkan" email.
3. **The wizard runs:** username → password → PIN → PINTAR ID and card → role home (D-010).
4. **The proxy holds any session in SET-UP REQUIRED to the wizard.** An old session at release (production has 0 today) is sent to the fresh-code step first. Keluar always works.
5. **Nothing creates a person or an account.** The flow acts only on existing Auth users (`shouldCreateUser:false` or admin `generate_link` for existing users), and the fail-closed trigger stays. So no duplicates are possible.
6. **The sole production admin:**
   - rehearse the exact transition on staging's system admin first;
   - prove production mail delivery before the release that retires magic links;
   - break-glass is documented: Yazid can issue a recovery from the Supabase dashboard, and an operator can generate an admin link.
7. **Staging's synthetic staff** complete set-up once through the real wizard (synthetic school, labelled), so journeys and U-PERF are not held in the wizard.

## D. Semantics

**PINTAR ID**
- **Format:** 8 characters from Crockford Base32 (0–9 and A–Z except I, L, O, U), giving 32⁸ ≈ 1.1×10¹².
  - Input is case-insensitive and ignores spaces and hyphens; O→0 and I/L→1, so there is no ambiguity.
  - Stored uppercase without separators; shown as 4+4 ("A14C D7ST").
- **Generation:** server-side, cryptographically random (`gen_random_bytes`), retried on a unique-index conflict. Not sequential, and not derived from the person UUID.
- **Global uniqueness:** one PINTAR person (D-049(c)), unique btree index.
- **Immutable:** a trigger refuses updates.
- **Never recycled:** persons are never deleted, only anonymised.
- **Not a secret.**

**Username**
- **Scope and shape:** global unique; canonical lowercase; `a–z 0–9 . _`, 4–20 characters, starts with a letter, no leading, trailing or doubled `.`/`_`. Never shaped like an email, a PINTAR ID or all digits.
- **Reserved:** role and system words, route names and a short offensive list.
- **Changes:** at most once per 30 days after re-entering the password; the old name is held for 90 days. The platform admin may reset an abusive name (audited).
- **Race:** a unique index on the canonical form, with an insert that loses cleanly on conflict. The availability hint is advisory; the claim is authoritative.
- **Where it lives:** in a PINTAR table, **never** in Supabase `user_metadata` (the user can edit it).
- **Mapping:** username → account → Auth email, **server-side only**, inside the sign-in and recovery API routes (service key, F01-S03). There is no anonymous lookup. Unknown names get the same answer with a dummy check for timing.
- **Availability checks** happen only inside the wizard, after the code is verified, and are throttled.
- Staff only.

**PIN**
- One personal PIN per EMAIL account, bcrypt (`crypt`, cost ≥ 10) in a table with no client access. It is never returned or logged, and admins cannot see it.
- Setting or changing it needs fresh proof (a code or the password).
- **Blocklist:** repeated digits, ascending and descending runs, ABAB, AABB, keypad lines, years 1950–2030, and a top-50 list.
- **Two uses, two independent counters:**
  - **(A) Session resume:** counted per `session_id`. 3 wrong → that session ends. It resets on a successful resume.
  - **(B) Recovery:** counted per typed canonical PINTAR ID, whether or not it exists. Ladder 1 h → 4 h → suspended (C5, C6).
- The counters are not shared: a passer-by at a shared PC can't push the owner's recovery ladder, and recovery attempts can't end sessions.
- A PIN never signs anyone in. (A) needs the owner's live locked session. (B) only allows setting a new password, after which the person signs in normally.

**QR**
- **Content:** only the public ID URL (`https://<origin>/id/A14CD7ST`). No name, secret, token or session.
- **The `/id/` page:** public, and registered in `public_surface_registry` as a new public surface (INV-38 covers certificates only). It is the same for every well-formed ID and reveals neither existence, name nor school.
  - It offers "Masuk ke PINTAR" and "Lupa password? Pulihkan dengan PIN".
  - The second opens the **same** recovery flow and function as typing the ID: same counters, lockout, audit and notification.
- **Future physical cards** may add a revocable card serial behind the QR.

## E. Gate 0 external facts

| Fact needed | Why needed | How to verify (evidence to capture) | Blocking gate |
|---|---|---|---|
| Supabase password policy (minimum length, required characters), staging and production | Password rules and copy | Read-only Management API read of `/config/auth` via a workflow (values printed, secrets masked), or a dashboard screenshot | 3 |
| Leaked-password protection and plan tier | Credential-stuffing defence (C18) | Same read plus a billing-page screenshot | 3 |
| Hosted `sessions_timebox` / inactivity availability | Server-side backstop (C4) | Same read | 6 |
| Hosted email templates and subjects (edited or default) | Branded fallback if Supabase sends anything | Same read (print subjects and a content hash, not bodies) | 3 |
| Production Auth snapshot: OTP expiry/length, `rate_limit_email_sent`, `smtp_max_frequency`, sender | Never read for production | Same read | 3 |
| Namecheap plan: Stellar vs. Stellar Business, and the upgrade date | Volume (D-053) | Namecheap dashboard screenshot | 3 (walk), 8 |
| SMTP mailbox for app sending and connectivity from Vercel (465/587) | The C8 sending path | Staging-only send of one test message to a named inbox (needs approval); SMTP log line | 3 |
| SPF on `pintarselalu.com` | Deliverability | `dig TXT pintarselalu.com` from Yazid's machine or a GitHub runner (not this sandbox: egress 403), or an MXToolbox screenshot | 3, 7 |
| DKIM enabled (cPanel Email Deliverability) and its selector | Deliverability | cPanel screenshot plus `dig TXT <selector>._domainkey.pintarselalu.com` | 3, 7 |
| DMARC policy (`_dmarc`) | Deliverability and spoofing | `dig TXT _dmarc.pintarselalu.com`; recommend `p=none` with reporting for the pilot | 7 |
| Real-inbox authentication results | Proof, not assumption | Gmail and Outlook "Show original" screenshots showing SPF, DKIM and DMARC = PASS | 7 |
| Stellar Business per-mailbox or recipient limits | 150-tester volume | Namecheap documentation or a support answer (screenshot) | 8 |
| Expected volume | Capacity | Estimate: 150 × (1–2 codes + 1 card + ≈0.3 recovery + security) ≈ 450–750 emails; peak ≈ 60 in 10 min for a group of 30. **Exceeds Stellar's 50/h, fits Stellar Business** | 8 |
| Security recipient mailbox and its owner | C7 | Yazid names it | 5 |
| Mail operations owner (bounces, noreply, DNS) | Supportability | Yazid names them | 3 |
| BOB-12 settings: IP forwarding on the plan; forwarding key created | Gate 1 | Yazid's dashboard screenshot; key presence checked by shape only | 1 |
| Vercel env var names for SMTP per project | D-039 separation | Naming agreed; presence checked, never printed | 3 |
| `pg_cron` on hosted; delete right on `auth.sessions` | Server-side termination of abandoned sessions | Read-only SQL (`pg_available_extensions`, `has_table_privilege`) | 6 |
| PostgREST pre-request hook on hosted | The lock's database enforcement | Local prototype, then one read on staging | 6 |

## F. Gate 0–8 sequence (checked against dependencies)

Yazid's proposed order is right in substance, with two changes:
- **Email infrastructure** runs **in parallel with Gate 2**, not inside Gate 3. It depends only on Gate 0 facts, and Gates 3, 4, 5 and 7 all need it. This shortens the critical path.
- **Never release passwords without recovery.** Staging proceeds gate by gate, but no production release carries Gate 3 without Gate 4.

| Gate | Content | Hard dependencies |
|---|---|---|
| **0** | Rulings (C1–C18) and external facts; sending architecture confirmed | — |
| **1** | BOB-12 (+ forwarding on the verification endpoint) | 0; Bob's queue: BOB-23 first |
| **2** | Identity foundation: PINTAR ID + backfill, usernames, PIN, set-up state, counters and ladder, security events | 0 (not BOB-12) |
| **2E** (parallel) | Email infrastructure: server mailer, send log and limits, SMTP secrets on staging, base branded template, deliverability proof started | 0 (SMTP, DNS) |
| **3** | Activation (new and existing users), password sign-in (email or username), magic link retired from the UI, existing-user transition proven | 1, 2, 2E |
| **4** | Email password recovery; password-changed email; other sessions signed out | 3 |
| **5** | PINTAR ID + PIN recovery, ladder, owner and platform-admin notifications, `/id/` QR page (if in scope) | 2, 2E, 3; per-IP part needs 1 |
| **6** | Device modes and the server-enforced shared lock (or the fallback) | 2, 3; U-PERF. Can run in parallel with 5 |
| **7** | Polish: all six emails, the digital card, journey copy; internal dry run | 3–6 |
| **8** | Validation matrix V on staging → **one production release** (migrations, Auth settings, app, REL checks) → 3–5 educator walk → fixes → ~150 testers | all; Stellar Business active; DNS PASS |

## G. Preliminary rulings not to accept as written

None rejected. Three need tightening before they are frozen:
1. **C3:** the countdown must be **uniform** (the same after every submission), not "real system state" per address. Otherwise it recreates the enumeration oracle D2 closed.
2. **C5:** "restore via successful email recovery" must also **require a new PIN** in that flow. Otherwise restoring gives whoever holds the card another 9 guesses at the same PIN.
3. **C8:** "build app email" leaves the **sending architecture** open. Recommended: one PINTAR path for all six emails, with Supabase issuing codes through admin `generate_link`. That uses the service key on public API routes (allowed by F01-S03), so PINTAR's own send limits become mandatory.

Also: the corrected sequence (§F) moves email infrastructure earlier and fixes the production release boundary.

## H. Decisions still required from Yazid

1. **Approve C1, C3, C5, C7, C8 and C11** with the three tightenings in §G.
2. **Approve or amend the proposed rulings** for C2, C4, C6, C9, C10, C12–C18.
3. **Sending architecture:** one PINTAR mail path for all six emails, with codes from Supabase via `generate_link` (recommended), or Supabase-sent auth emails plus app mail for the card and security notices.
4. **Shared-device values:** 5 min lock / 60 min sign-out confirmed, and the fallback idle value if Gate 6 fails (10 or 15 min).
5. **Release shape:** one production release after Gate 7, with the 3–5 educator walk on production (real people, real schools) before the ~150 cohort (recommended).
6. **Name** the security-notification recipient and the mail operations owner.
