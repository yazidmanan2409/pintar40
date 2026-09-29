# Staff sign-in on shared school computers: investigation, 28 Sep 2026

> **Historical input, superseded 29 Sep by the canonical specification `IDENTITY-4.0.md` (D-054 to D-058).** Kept as evidence; where it differs, the specification wins.

**Status: for Yazid's decision on 29 Sep. Nothing has been changed.** No tickets and no decision-log entries yet. All three investigations below were read-only (source, migrations, selftests, workflows, and staging's Auth settings read through the `limits` mode of `staging-journey.yml`, run 36382909677).

**The problem (Yazid).** School computers are shared by students and educators, and shared computers may not have email set up. How do people sign in easily, and what happens when someone forgets to sign out? This has to balance security, ease of use and experience.

---

## 1. Balanced recommendation (the discussion's end point)

Treat these as two separate problems. **Signing in without email** is solved by a password. **Forgetting to sign out** is solved by the computer ending the session itself. The 4-digit PIN is a convenience on top of that timeout, not a replacement for it.

**Signing in on a computer with no email.** The difficulty comes from the magic link, not from email itself.
- **Staff:** type their email address and a password. The inbox is needed only once (to set the password) and when a password is forgotten, and both can be done on a phone.
- **Students:** keep the class card. It was built for shared devices and needs no email.

**When someone forgets to sign out.** The person at risk is whoever sits down next, so the session must end on that computer by itself. Closing the browser is not reliable, because browsers restore sessions. What works is an idle timeout that signs the person out of that computer only; their phone stays signed in. The mechanism already exists (BOB-05: class cards 60 minutes).

**Recommended shape:**
- **On the sign-in screen:** email, password, and a box "Ini perangkat pribadi saya", unticked by default.
- **Shared computer (default):** signed out after about 10–15 minutes without activity.
- **Personal device (box ticked):** stays signed in up to 7 days, as today (D-009).
- **Later, 4.5, the PIN lock:** after about 3–5 minutes idle the screen locks and the PIN resumes; after about 30 minutes the session ends anyway. This makes a very short privacy window bearable for teachers.

**Why the PIN waits.** A lock that truly protects must be enforced on the server for every request; a screen overlay can be bypassed. That is the large part of the blast radius (§3). The timeout reuses what exists and gives most of the protection. The PIN mainly saves the same teacher from retyping a password after a short break.

| Situation | Handled by |
|---|---|
| Teacher at a lab PC, email only on the phone | password |
| Teacher forgets to sign out; a student sits down 20 minutes later | idle sign-out |
| Same, but only 2 minutes later | not covered until the lock (4.5); a shorter timeout narrows the gap |
| Teacher presents 15 minutes without touching the PC | tick "perangkat pribadi" on the classroom PC, or a longer shared limit |
| Teacher forgets the password | "Lupa kata sandi", email opened on the phone |
| Student in the computer lab | class card, unchanged |
| Someone else finds a locked screen (4.5) | presses Keluar; 3 wrong PINs sign that computer out, the teacher's phone is unaffected |

**Security conditions for passwords:**
- BOB-12 (the real client address forwarded to Supabase) must land first. Until then Supabase's per-IP brute-force limits see only PINTAR's server, which means they neither stop one attacker nor avoid locking out everyone.
- A password policy must be set in Supabase.
- If a PIN comes later, common PINs (1234, 1111, 0000: close to one person in five in published PIN studies) must be blocked.

**Decisions for tomorrow (Yazid):**
1. Email + password as the everyday staff sign-in, and whether magic link stays as a fallback (it stays in any case for activation and recovery).
2. The shared-computer idle limit (suggested 10–15 minutes) and the "perangkat pribadi" option.
3. How a first password is set: by the teacher, through email on the phone, or given by an admin once, like class cards.
4. Whether the PIN lock waits for 4.5 (recommended) or is needed for the pilot.
5. If the lock goes ahead: what happens while a teacher presents (a teaching mode, a longer limit, or a school setting); and whether the PIN is one per person or chosen at each sign-in.
6. Email + password, or true usernames (usernames imply staff without email and admin-only recovery).

---

## 2. What PINTAR has today (evidence)

The four layers are separate:
- **Authentication:** `auth.users` (Supabase).
- **Person:** `persons`.
- **Binding:** `accounts`: unique `auth_user_id`, kind EMAIL or CLASSROOM_CARD, one account per person (`handle_new_auth_user`, migration `20261005120000`).
- **Authority:** `role_assignments`, applied through RLS and the database's own functions.
- **Session:** a Supabase session in `sb-*-auth-token` cookies.

Changing the sign-in method touches only authentication and session.

| Stage | Today |
|---|---|
| Account established | `/api/akun/aktivasi`: the database grants a single-use activation; `admin.createUser` with `email_confirm: true` and **no password**; the trigger links `accounts`. Audited as `account.activation_authorized`. |
| Sign-in | Magic link with PKCE: `signInWithOtp({shouldCreateUser:false})` (`src/app/masuk/actions.ts:37`), enumeration folded (L-2, D2; pinned by L2-KONTRAK-01). `disable_signup` true. Link valid 1 h (`mailer_otp_exp` 3600). |
| Session | JWT 1 h (`jwt_exp` 3600), refresh rotation on. Cookie Max-Age forced to **7 days** (email) or **60 min** (card) and slid on every request by the proxy (`src/lib/sesi.ts:20`, `src/proxy.ts:66–76`). Cookies are **not httpOnly** (the browser client reads them: `src/components/unggah/PanelUnggah.tsx:127`). |
| Inactivity | Only the cookie lifetime; "inactive" means "no request". Supabase-side `sessions_inactivity_timeout` **0** and `sessions_timebox` **0** on staging (unlimited). No activity detection exists in the app. |
| Browser closed | Persistent cookie: still signed in, for up to 7 idle days. |
| Logout | `signOut({scope:'local'})`: this device only (D-009, BOB-05; `src/lib/keluar.ts`). |
| Recovery | None: no password exists for staff, no reset flow. |
| Audit | `audit_write` is generic and append-only (~70 action names); **no sign-in, sign-out or session events** are recorded by PINTAR. |

**Coexistence already proven:** class cards sign in with `signInWithPassword` over a server-derived secret (`src/lib/card.ts`). Selftests sign seeded **staff** personas in with passwords (`selftest/app.test.ts:134`), and roles and RLS work unchanged for them.

**Cross-device magic link today** (also investigated 28 Sep): the link opened on a phone fails safely. The phone lacks the PKCE verifier, so `exchangeCodeForSession` fails, the phone shows "Tautan ini sudah tidak berlaku", and the link is spent; neither device is signed in (audit S1b; backlog M1). The smallest secure fix is a server-side relay of the PKCE code with number matching, which is new authentication architecture and belongs in **4.5**. Password sign-in reduces the need for it.

---

## 3. Blast radius of the options

**Classification of the full proposal** (password → normal use → 3-minute lock → 4-digit PIN → 3 wrong PINs log out this computer): **LARGE**, carried entirely by the lock/PIN. Email + password alone is SMALL–MODERATE. Nothing reopens identity, tenancy or authorization.

**Why the lock is the large part:**
- A cosmetic overlay is bypassable: the browser can read its tokens, refresh them with Supabase, and call the database API directly.
- A real lock needs new per-session server state keyed on the JWT's `session_id`, enforced in two places:
  - in the proxy on every staff request (one more database lookup on the hot path, D-031);
  - in the database's pre-request check for every API call (PINTAR uses none today; it must be near-free for card sessions).
- The database API accepts a revoked session's token until it expires (up to 1 h), so a forced logout must also be refused there.
- It needs a cross-tab activity heartbeat judged by the server, no-store caching, and a hard navigation to the lock screen.
- Back, reload, new-tab and multi-tab behaviour can only be tested in a real browser; CI's app runner is HTTP-only.

**What already works:**
- Local sign-out revokes one session and leaves the phone signed in (BOB05-R01).
- Multiple sessions per user are allowed (`sessions_single_per_user` false).

| | B Email+password | C B + shared-computer timeout | D Full (lock+PIN) | E Username+password+PIN |
|---|---|---|---|---|
| Files modified / new | ~10–14 / ~4–6 | +1–2 / 0 | ~16–22 / ~12–16 | D + intake/activation/identity |
| Migrations / functions | 0 / 0 | 0 / 0 | 1–2 / ~6–7 + pre-request | D + identifier table and lookup |
| Existing tests adapted | ~8–10 static | +4 (BOB05-K01/R01, F01-R05, DAISY-02-KELUAR-01) | ~14 + audit job B (6 email sign-ins), staging journey, U-PERF harness | D + activation/intake |
| New red cases | ~10 | ~4 | ~30, many browser-only | ~40 |
| Decisions touched | D-019, L-2/D2 | + D-009 | + D-031/D-046, new lock/PIN decisions | + identity rules |
| Shared-computer safety | unchanged (7 days, survives browser close) | real | strongest, if enforced server-side | as D |
| Existing users | set a password once | same | + set a PIN | + assign usernames |

Tests of about 270 authorization, RLS, publishing and assessment behaviours are unaffected. Card tests (F01-T16, F01-R06, F03-T01, F09-A02, F09-C02) are unaffected.

**Existing users.** They keep every id and relationship (person, roles, school links, audit, authorship, evidence). They set a password once, after one more magic-link or recovery sign-in; no data migration is needed. Evaluation personas (`assert_evaluation_boundary`) and card accounts must never get a password.

**True usernames.** Supabase signs in by email or phone only. Usernames need:
- a new unique identifier;
- an anonymous-reachable lookup (a new account-existence risk);
- synthetic Auth addresses for staff without email (like cards), with admin-only recovery.

That is a change to the identity model.

**4.0 or 4.5 (evidence, not a decision):**
- **4.0 candidates:**
  - email + password (conditional on BOB-12 and a password policy);
  - password activation and reset (reuses the PKCE callback);
  - the shared-computer timeout (reuses BOB-05; changes D-009's numbers only).
- **4.5 candidates:**
  - the inactivity lock;
  - PIN resume;
  - 3-fail logout (the mechanism exists but depends on the lock);
  - true usernames;
  - cross-device sign-in.

**Recommended next technical step (only if approved):**
1. Read-only first:
   - staging's and production's password-policy settings;
   - whether the current Supabase plan supports idle/maximum-session limits and the leaked-password check;
   - a count of production staff accounts.
2. For D only: a throwaway local prototype, not merged, proving two claims:
   - the database's pre-request check refuses a locked or terminated `session_id`, including an access token issued before the lock;
   - a forced local sign-out leaves the same person's other session working.

   Then measure its overhead with U-PERF.
