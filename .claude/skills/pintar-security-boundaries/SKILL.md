---
name: pintar-security-boundaries
description: PINTAR's security and confidentiality boundaries and where their authoritative text lives — grants and RPC exposure, secrets and no-store, locked-account indistinguishability, identity (NIS), staff-ness, integrity-review confidentiality, AI request accountability. Use before touching grants, RPCs, auth, sign-in, PINs, recovery, intake, certificates, integrity or AI code, and when reviewing such code.
---

# Security boundaries

**Authority:**
- `docs/ENGINEERING-LESSONS.md` (L1, L2: grants), on main;
- `docs/rebuild/05-PINTAR-AUTHORIZATION-MATRIX.md`, on main;
- ADR-0013 and ADR-0021, on main;
- Sharon's records, `docs/coordination/reviews/sharon/` on her branch.

**Her record governs** where this skill differs. Any change touching one of these boundaries needs **Sharon's pre-build review**.

## The standing boundaries (summaries; read the record before building)
- **A grant is an exposure decision.** No `grant execute` to `anon` or `authenticated` without a `client_rpc_registry` row carrying a deliberate `rpc_exposure`. Every migration revokes from `public, anon, authenticated` explicitly (L1, L2; ADR-0021).
- **Locked accounts (L-78, CI-2):**
  - a locked account's sign-in refusal is indistinguishable from a wrong password or PIN: same status, body and timing, for email and card;
  - locking rotates the credential; it never bans;
  - **anything that tells a locked account apart from a wrong password reopens L-78.**
- **Secrets (L-131, L-142):**
  - a PIN is shown once, never in a URL or history, and never re-shown;
  - every response carrying a secret is `no-store` through the one helper;
  - no route on the secret-bearing list calls `NextResponse.json` directly.
- **Identity (L-127):**
  - a name is never identity;
  - NIS is per school, never matched across schools, never a sign-in, and never on a certificate, the public check or an export;
  - never auto-merge.
- **Staff-ness (L-155):** recorded server-side. No card for anyone recorded as staff, or who ever held a staff role. The DB trigger is the boundary.
- **Integrity review (L-134):** a teacher's screen and RPC carry no reason, reviewer or override record.
- **AI requests (L-126):** every refusal records a closed reason code in the same transaction.
- **Principle 5:** confidentiality holds throughout the system, not only on the screens.

## Supply chain
- No new dependency, plugin, MCP server or external service without Sharon's review.
- Nothing sends PINTAR source or data to a third party.
