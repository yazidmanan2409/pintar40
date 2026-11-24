# Audit 79 · the plan of record to closure (Bob, 24 Nov 2026; ruling 99)

**Authority:** ruling 99. The owner is away, and the team works independently.

**Boundaries, unchanged:**
- No merge, staging promotion or production deployment without the owner.
- No Part II, and no 4.5.
- No silent deferral, reduced coverage or premature completion.

**Escalate only:** a material decision, a critical discovery, a genuine blocker, or an action needing the owner's authorisation. Everything else Bob decides and records here.

## 1 · Workstreams

| # | Stream | Who | Ends at |
|---|---|---|---|
| W1 | **The journeys:** J9, J11 and J12 walked; every outstanding branch, plus SR, throttled and reduced-motion, captured for all twelve | Daisy (walks and judges); the audit builder (captures, committed per run to `claude/audit-79-world` under `audit/79/tangkapan/`) | Every journey's TEMUAN file complete, with no «left for the builder» line still open |
| W2 | **Classification:** every finding has an L-id, dimension, severity, cause and disposition | Bob (ledger), Daisy (severity), Sharon (anything touching access, privacy, integrity or disclosure) | The ledger has no unclassified row |
| W3 | **The common-cause analysis, final** | Bob, reviewed by Sharon, Daisy and Second Eye | `AUDIT-79-COMMON-CAUSES.md` marked FINAL after J12 |
| W4 | **CI-1** (L-67), to its spec and Sharon's amendments | Second Eye builds; Sharon verifies | Frozen, PR open, CI green in one attempt, Sharon PASS. **Merge and staging 309→310 wait for the owner** |
| W5 | **CI-2** (L-78, PR-22), to its spec and Sharon's amendments | Second Eye builds, after CI-1 freezes; Sharon verifies | As W4, with its own promotion → 311, **waiting for the owner** |
| W6 | **AR-79, the consolidated correction:** one revision resolving causes C-1 to C-10 and every confirmed finding within scope | The plan by Bob; pre-build review by Sharon and Daisy; Second Eye builds (after CI-2); the audit builder writes the cross-surface journey assertions | Frozen, PR open, CI and journeys green in one attempt; Sharon and Daisy verify; every finding re-walked. **Merge and promotion wait for the owner** |
| W7 | **The closure report** | Bob | `docs/post-4.1/AUDIT-79-CLOSURE-REPORT.md`, the seven sections ruling 99 names |

## 2 · Sequencing decisions (Bob, routine)

- **Branch stacking:**
  - **CI-1:** `claude/ci-1` from main `429b7dcc`, migration 310.
  - **CI-2:** `claude/ci-2` from **CI-1's frozen head**, migration 311. CI-2 doesn't touch CI-1's functions, but stacking keeps the migration order and the AFTER reads honest.
  - **AR-79:** `claude/ar-79` from **CI-2's frozen head**, migrations 312 onwards. AR-79 touches certificate screens (C-3) that read CI-1's helper.
  - **The PRs merge in that order**, each under its own owner authorisation, each with its own step 0 / BEFORE / AFTER. If the owner wants a different order, only the bases change.
- **AR-79's scope** is every confirmed finding whose fix is a correction of existing behaviour: wording, layout, consistency, a missing state on a sibling screen, a prerequisite read, the result in force. **Excluded, and named in the closure report with the reason:**
  - (a) findings already placed in 4.5 by ruling (L-26 to L-30, L-35's 4.5 parts);
  - (b) anything that is a new feature or a policy change (ruling 79's scope), such as bulk class entry (L-91), if judged a feature;
  - (c) world-data gaps, which are fixed in the world, not the product.
  Each excluded row says why. **Nothing is silently deferred.**
- **AR-79's design rules** (rulings 95–98; the master sequence §2c):
  - one authority per state;
  - cross-surface assertions;
  - the database-owned «may do / why not» reads, with the action still deciding at press time;
  - no unsupported promise;
  - confidentiality throughout;
  - no new framework.
- **Verification discipline (ruling 93):**
  - focused tests during development;
  - the full pre-flight and the freeze check before any push;
  - one frozen candidate per PR;
  - no speculative reruns.

## 3 · Status

| Stream | State |
|---|---|
| W1 | J1–J8 and J10 walked by Daisy (J5 and J8 in part); J2's capture run done (`da220028`); J9, J11 and J12 to walk; branches and passes from the builder |
| W2 | L-1 to L-93 recorded |
| W3 | INTERIM: C-1 to C-10 |
| W4 | Second Eye building |
| W5 | Approved; Sharon's pre-build review pending |
| W6 | Not started (after W3) |
| W7 | Not started |

## 4 · Pacing (owner, 24 Nov: usage isn't monitored overnight)

Bob paces the work. The usage allowance is shared by every session.
- **One heavy build at a time.** Second Eye's streams run in sequence, never in parallel. The builder's CI capture runs aren't stacked on top of Second Eye's full pre-flights.
- **No waste.** Use focused tests during development, a full verification only at the acceptance boundary (ruling 93), and no speculative reruns. Messages stay short.
- **If a session hits a usage limit, it stops cleanly.** It commits its work-in-progress notes (never a half-finished push to a PR), resumes after the reset from its own record, and never reports partial work as done.
- **Quality isn't traded for pace.** If the allowance runs short, the work takes longer; it doesn't get thinner.

## 5 · Owner decisions collected for the closure report (none blocks the work tonight)

| # | Decision | Needed before | Recommendation |
|---|---|---|---|
| OD-1 | **CI-2: a reinstated or reopened account signs in with a fresh credential** (a password reset; a new PIN from the school) | CI-2's merge | Accept (Sharon). The alternative, restoring the old password hash, isn't recommended |
| OD-2 | Merge and staging promotion of CI-1, CI-2 and AR-79, in order, each with its own evidence | Each merge | — |
