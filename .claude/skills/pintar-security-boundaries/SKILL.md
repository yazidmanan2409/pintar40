---
name: pintar-security-boundaries
description: PINTAR's security and confidentiality boundaries and where their authoritative text lives — grants and RPC exposure, secrets and no-store, locked-account indistinguishability, identity (NIS), staff-ness, integrity-review confidentiality, AI request accountability. Use before touching grants, RPCs, auth, sign-in, PINs, recovery, intake, certificates, integrity or AI code, and when reviewing such code.
---

# Security boundaries

**Authority:**
- `docs/ENGINEERING-LESSONS.md` (L1, L2: grants), on main;
- `docs/rebuild/05-PINTAR-AUTHORIZATION-MATRIX.md`, on main;
- ADR-0013 and ADR-0021, on main;
- Sharon's records, `docs/coordination/reviews/sharon/` on `claude/gracious-lamport-0m1qjr`.

**Her record governs** where this skill differs. Any change touching one of these boundaries needs **Sharon's pre-build review**.

## The standing boundaries (summaries; read the record before building)
- **A grant is an exposure decision.** No `grant execute` to `anon` or `authenticated` without a `client_rpc_registry` row carrying a deliberate `rpc_exposure`. Every migration revokes from `public, anon, authenticated` explicitly (L1, L2; ADR-0021).
- **Locked accounts (L-78, CI-2):**
  - a locked account's sign-in refusal is indistinguishable from a wrong password or PIN: same status, body and timing, for email and card;
  - locking rotates the credential and never bans, **and unlocking rotates again** (OD-1: fresh credentials after reinstatement);
  - `card_holders` returns only `terkunci`, never why;
  - lock state is read from the verified session only (`akun_auth_terkunci`);
  - **anything that tells a locked account apart from a wrong password reopens L-78.**
- **C-9, L-75, L-76:**
  - a refusal says more only after strong proof (a password, not a PIN);
  - **L-75 is withdrawn under CI-2,** so its line is the neutral one only;
  - the PIN-recovery line is shown on every refusal, unconditioned, with timing unchanged.
- **Secrets (L-131, L-142):**
  - a PIN is shown once, never in a URL or history, and never re-shown on reload;
  - every response carrying a secret is `no-store` through the one helper;
  - no route on the secret-bearing list calls `NextResponse.json` directly.
- **Identity (L-127):**
  - a name is never identity;
  - NIS is unique within the institution and shown only to that school's intake and admin staff;
  - NIS is never matched across schools, never a sign-in, and never on a certificate, the public check or an export;
  - the same name is a *possible* duplicate, resolved by an audited per-pair admin choice;
  - never auto-merge; removing an import row never touches a person record.
- **Staff-ness (L-155):**
  - recorded server-side; no card for anyone recorded as staff, or who ever held a staff role;
  - the only exception is an audited reclassification;
  - the DB trigger `accounts_card_is_learners` is the boundary (CARD_FOR_STAFF), and the reverse trigger `role_assignments_card_holds_no_role` stays;
  - a lapsed role never makes a person eligible for a card.
- **Names (L-151):**
  - encode on output;
  - refuse control, bidi and zero-width characters at storage;
  - a CSV export neutralises a leading `= + - @`, TAB and CR.
- **The shared-computer lock (L-112):** a confidentiality control that counts only real input (PR-23).
- **Across schools (C-3):** a boolean only, never the sending school's reason.
- **Review marks (L-124, L-143):** bound to the revision checked; approve and publish re-check the current revision.
- **Certifying results:**
  - counts only when the sitting's captured `bersertifikasi` is true (R-h);
  - `verify_certificate` keeps `predikat` null, and validity follows CI-1.
- **Integrity review (L-134):** a teacher's screen and RPC carry no reason, reviewer or override record.
- **AI requests (L-126):** every refusal records a closed reason code in the same transaction.
- **SQL hygiene:**
  - every SECURITY DEFINER function sets `search_path`;
  - read definitions with `pg_get_functiondef`, never `prosrc` (it's empty for BEGIN ATOMIC);
  - guards often live in **triggers**, so search them (L-152).
- **Principle 5:** confidentiality holds throughout the system, not only on the screens.

## Supply chain
The rules are in `CLAUDE.md`'s «Never» list, which is always loaded. This skill adds only how to apply them: a proposed tool gets its source read, its network and hook behaviour checked, a throwaway environment, and Sharon's review before any use.
