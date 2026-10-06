# PINTAR 4.0 identity, activation, sign-in, session and recovery: FROZEN SPECIFICATION

**Status: CANONICAL.** Frozen 29 Sep 2026 by Yazid ("Final ruling freeze + proceed").
- Recorded as **D-054 to D-058** in `DECISIONS.md`.
- This document is the one reference the identity tickets cite. Where it and an earlier document differ, this document wins.
- **Historical inputs, kept as evidence:** `2026-09-28-staff-signin-shared-computers.md`, `2026-09-28-identity-login-architecture-review.md`, `2026-09-28-identity-login-decision-package.md`.
- **Scope rule:** nothing beyond these rulings. Out of scope for 4.0 (X): social, Google or Microsoft sign-in; passkeys; biometrics; device management (MDM); a notification platform; any redesign of class cards; cross-device hand-off; username changes.

## 1. Concepts (kept separate)

| Concept | Meaning | Where it lives |
|---|---|---|
| Email | Ownership, verification and recovery channel | `auth.users.email` (unchanged) |
| Email or username + password | Everyday staff sign-in | Supabase password; username in a PINTAR table |
| Personal PIN (4 digits) | A second secret: resumes a locked session; recovers with the PINTAR ID | PINTAR table, bcrypt |
| PINTAR ID | Durable, human-readable identity reference; **not a secret** | `persons` |
| QR | Pointer to the public ID page; never a credential | Generated from the PINTAR ID |
| PINTAR Card | Digital in 4.0; physical later | Rendered from name + PINTAR ID + QR |
| Role and school relationship | Authorisation, unchanged | `role_assignments`, RLS |

## 2. Rulings C1–C18 (final)

| ID | Final ruling |
|---|---|
| **C1** | No open self-registration. **"Aktifkan akun PINTAR Anda"** means claiming an already-provisioned identity. A code is sent only to an existing EMAIL account whose set-up is unfinished. Unknown or unprovisioned addresses get neutral behaviour and copy that reveals nothing. The provisioning boundary (activation grants, fail-closed `handle_new_auth_user`, `disable_signup`) is unchanged. |
| **C2** | D-019 amended. Admin provisioning stays silent; the person starts activation in PINTAR. **No invitation-email system in 4.0.** Verification, recovery, card and security emails come from the approved identity flows. |
| **C3** | D2 amended **narrowly**. A resend countdown ("Kirim ulang kode dalam 42 detik") is allowed **only on verification and recovery code screens**. It behaves identically whether or not the identity exists and never exposes provider or per-address state. No countdown anywhere else. |
| **C4** | **Personal device:** D-009's ~7-day staff behaviour kept, unless Gate 0 evidence requires a security correction. **Shared device:** 5 min of genuine inactivity → server-enforced PIN lock; 60 min locked or unattended → that device's session ends. **Fallback** if the lock fails Gate 6: 15 min inactivity → automatic sign-out, no PIN resume. **No client-only lock.** Class-card sessions unchanged. |
| **C5** | Recovery by PINTAR ID + PIN: 3 wrong → locked 1 h; after expiry 3 wrong → 4 h; after expiry 3 wrong → **SUSPENDED** (no automatic retries after that). Restore only by (1) successful email recovery **followed by a NEW PIN**, or (2) an authorised, audited platform-admin reset that also **forces a NEW PIN**. The old PIN never becomes usable again after a suspension. It locks **only this recovery method**, never the account, sessions, other devices or email recovery. |
| **C6** | Levels 1–2 return to 0 after 30 clean days without a recovery-PIN failure. A successful legitimate PIN recovery resets the ladder. Suspension never clears with time, only through C5's restore paths. |
| **C7** | Security and recovery events notify (1) the **account owner** and (2) the **platform admin**, recipient `admin_gt@pintarselalu.com`. **No school-admin notification in 4.0.** No cross-school security information. |
| **C8** | One PINTAR-controlled email path for: (1) activation code, (2) resend, (3) recovery, (4) password changed, (5) PINTAR Digital Card, (6) security and recovery notices. Supabase may issue the codes, but users see PINTAR communications. PINTAR enforces its own send limits. Privileged operations stay server-side, and no powerful credential reaches the browser. Gate 0 fixes the sending architecture and deliverability. |
| **C9** | Username: globally unique; canonical lowercase; `a–z 0–9 . _`; 4–20 characters; starts with a letter; never shaped like an email, a PINTAR ID or a pure number; reserved-name rules; resolved server-side only; protected against enumeration; races settled by a database unique index. **No self-service username change in 4.0**: the name chosen at activation is fixed. A genuine correction is an exceptional, audited platform-admin operation. No rename flow, change history or reservation of old names. |
| **C10** | Existing staff are not recreated, and no duplicate person or account is made. They complete activation: fresh code → username → password → PIN → PINTAR ID and card → their home. Treated as having no known password. Rehearsed on staging first. The sole production system admin is protected by a **documented and tested break-glass procedure before the production release**. Evidence (28 Sep, read-only): production 1 person / 1 EMAIL account (system admin) / no cards / no sessions; staging 3 EMAIL accounts + 50 synthetic cards; no duplicates or orphans. |
| **C11** | Provisional for the pilot: after authentication on an unknown browser, ask **"Komputer siapa ini?"**, offering "Komputer bersama" (the default and safer choice) and "Komputer pribadi saya". It is a user-declared browser context, not proof of ownership. No MDM. A path stays open for school-managed devices to be forced to shared. Class-card users are never asked. Gate 6 must show it is safe and understandable. |
| **C12** | A **successful** password reset (email or PINTAR ID + PIN) ends the person's other active sessions and informs the owner. Failed attempts and lockouts end nothing. |
| **C13** | Evaluation personas are excluded from password, PIN, username, PINTAR ID, the activation wizard and the device question. The existing evaluation safeguard (`assert_evaluation_boundary`, EVAL-S01) is kept. |
| **C14** | Everyday magic-link sign-in leaves user-facing screens **only in the same production release** in which activation, password sign-in, email recovery and the existing-staff transition all work. Callback, admin and evaluation support that is still technically needed stays. |
| **C15** | Bob is not interrupted: BOB-23 → BOB-12. At Gate 1, BOB-12's approved forwarding (currently `POST /auth/v1/token`) is reconciled with the password and code-verification requirements, without expanding BOB-12 beyond what they require. |
| **C16** | This work is part of **ENGINEERING COMPLETE** (D-052). The ~150-person test begins only after the gates and the small walk pass. |
| **C17** | Every real PINTAR person gets a PINTAR ID in the data model. Staff see and use it in 4.0. Students keep the class-card experience and see no new PINTAR-ID screens. |
| **C18** | Gate 0 establishes the real plan and features. Use genuine security features; never depend on unverified ones. (29 Sep: the ZAYD organisation is on **Pro**.) |

## 3. PIN (frozen)

**One personal PIN, two contexts, separate counters:**
- **Session resume:** 3 wrong → end **that** session. A correct PIN resumes that still-valid locked session.
- **Recovery:** 3 wrong → 1 h, 3 → 4 h, 3 → suspended (C5, C6).
- Attempts in one context never affect the other.

**Keeping it safe:**
- Never plaintext, never logged, never visible to administrators.
- Strongly hashed (bcrypt via `pgcrypto`) and verified server-side only.
- Common or trivial PINs are rejected: repeated digits, ascending or descending runs, ABAB, AABB, keypad lines, years 1950–2030, and a top-50 list (at least 0000, 1111, 1234, 4321).

**What a PIN can never do:** sign anyone in from a signed-out state.
- Resume needs that browser's own live, locked session.
- Recovery only permits setting a new password; the person then signs in normally.

**Recovery counters** are keyed by the typed canonical PINTAR ID, whether or not it exists, so a lock message never reveals which IDs exist.

## 4. PINTAR ID (frozen)

- **Format:** 8 characters, Crockford Base32 (0–9, A–Z without I, L, O, U).
  - Entry is case-insensitive; spaces and hyphens are ignored; O→0 and I/L→1.
  - Stored and shown in uppercase; displayed 4+4 ("A14C D7ST").
- **Generation:** from secure randomness on the server; unique index with retry. Never sequential, never derived from internal ids.
- **Scope:** global. Immutable in normal operation; never recycled (persons are never deleted).
- **Not a secret.**

## 5. QR (frozen)

- **Content:** only the public ID URL (`https://<origin>/id/<PINTAR ID>`). No password, PIN, session, bearer token or reusable secret.
- **The `/id/` page:**
  - public; registered in `public_surface_registry` and the proxy's public paths;
  - identical for every well-formed ID; reveals neither existence, name nor school;
  - offers "Masuk ke PINTAR" and recovery with the PIN, which uses **exactly** the typed-ID recovery (same function, counters, lockout, suspension, audit and notifications).
- No second policy for QR.

## 6. Email roles (frozen; values confirmed at Gate 0, 29 Sep)

| Role | Value |
|---|---|
| FROM (what users see) | **Tim PINTAR <noreply@pintarselalu.com>** (staging: "Tim PINTAR (Staging)") |
| Reply-To / public contact | **info@pintarselalu.com** |
| Security recipient and initial email-operations owner (C7) | **admin_gt@pintarselalu.com** |
| SMTP authentication mailbox | noreply@pintarselalu.com (technical; never shown to users) |
| Reserved for future security operations | security@pintarselalu.com (exists; unused in 4.0) |

The SMTP settings and the four Vercel variable names are in `GATE-0-FACTS.md` §2.

## 7. Timings (frozen)

| Situation | Behaviour |
|---|---|
| Personal device | ~7 days sliding (D-009) |
| Shared device idle 5 min | PIN lock (server-enforced) |
| Shared device, 3 wrong PINs | That session ends |
| Shared device locked 60 min | That session ends |
| Fallback (lock fails Gate 6) | 15 min idle → sign-out, no PIN resume |
| Class cards | Unchanged (60 min idle) |
| Other devices | Never affected by another device's lock or failures |

## 8. Release shape (frozen)

- Develop and prove gate by gate on **staging**. No half-complete authentication gate goes to production on its own. **Password sign-in never reaches production without working recovery.**
- **Sequence:** staging gates pass → an internal complete journey → **one controlled production release** → 3–5 real educators → fixes → affected gates re-run → toward ~150 testers.

## 9. Gates (frozen dependency sequence)

| Gate | Content | Depends on |
|---|---|---|
| 0 | Rulings (done) + external facts + sending architecture | — |
| 1 | BOB-12 (after BOB-23), reconciled per C15 | 0 |
| 2 | Identity foundation: PINTAR ID, username, PIN, set-up state, recovery counters and ladder, security events | 0 |
| 2E | Email infrastructure (parallel after Gate 0): sending module, send log, limits, staging credentials, base PINTAR template, first deliverability evidence | 0 |
| 3 | Activation (new and existing staff) + sign-in with email or username + password; magic link out of everyday UI only when safe (C14) | 1, 2, 2E |
| 4 | Email recovery: reset, confirmation, other sessions ended | 3 |
| 5 | PINTAR ID + PIN recovery: ladder, suspension, restoration, notifications; QR only if in scope and safe | 2, 2E, 3 (per-IP part: 1) |
| 6 | Device context, 5-min lock, PIN resume, 3-failure termination, 60-min abandonment, server and database enforcement, **or** the 15-min fallback | 2, 3 |
| 7 | Polish: all six emails, the digital card, final copy, the complete journey, internal dry run | 3–6 |
| 8 | Full automated and red-case matrix, staging proof, controlled production release, 3–5 educator walk, fixes and regression, ~150 testers | all |

Every gate needs, in order: a bounded ticket, an owner, its dependencies, acceptance evidence, implementation, tests, an audit, and **PASS** before dependent work advances. Parallel work only where this graph allows it.

## 10. Non-negotiable boundaries

**Never weakened:**
- tenancy, RLS and role authority;
- school provisioning;
- class-card security;
- service-role isolation (F01-S03: only under `src/app/api/`);
- cross-school boundaries.

**Never exposed:**
- service-role keys or SMTP credentials;
- PIN hashes or passwords;
- verification codes in logs;
- raw auth secrets;
- bearer credentials in QR codes.

**Never done:**
- a browser-only control where the server must enforce;
- weakening a boundary to ease the pilot.

**Principle.** Easy to use. Easy to understand. Difficult to misuse accidentally.

## 11. PINTAR Card addendum (D-059, 29 Sep): belonging, not authority

- **The ID is the person.** The permanent PINTAR ID never encodes level, institution or role. It stays with the person through every stage (Murid · SD → … → Dosen → Dekan, or → Tim PINTAR).
- **The card is the current chapter.** It is rendered from stable identity (name, PINTAR ID, QR, brand) plus the **current** context (level, role, institution) read at render time from existing records. Transient context is never stored in the identity.
- **Card families** are a design taxonomy, not roles:
  - students: SD, SMP, SMA/SMK, Universitas;
  - educators and academic leadership: Guru, Dosen, Kepala Sekolah, Dekan, Rektor;
  - PINTAR: Tim PINTAR, leadership, Founder.
- **Visual language:** one calm, muted PINTAR family. The context is always also stated in text; colour is supplementary only.
- **Card appearance is never authority.** Only person, account, role assignment, school relationship and RLS decide what someone may do.
- **Keepsake, not gamification.** Designed to be worth keeping; no badges, points, rewards or collecting mechanics.
- **PINTAR Journey:** preserved (dated relationships already record chapters), **not built** in 4.0.
- **In 4.0 only staff cards are delivered (C17).** Student and PINTAR-team designs are explored in Gate 7 but not shipped. A label with no source in today's data (e.g. "Founder", a student's level) stays a design asset until a later release gives it one.
