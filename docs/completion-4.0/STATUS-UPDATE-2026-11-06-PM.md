# PINTAR 4.0: status update (6 Nov 2026, afternoon)

This update is measured against the morning update (`STATUS-UPDATE-2026-11-06.md`) and its 09:20 addendum.

## At a glance

| | Morning (07:30) | Now (13:30 UTC) |
|---|---|---|
| `main` / staging | `12d357ce` (P-2) | **`d672a94a`** (P-4), the same code as the audited `5a78d979` |
| Migrations | 196 | 196 (no migration since P-1) |
| Session enforcement on staging | correct | **correct**: broken by W9.19 for about 4 hours on staging only, then fixed and verified |
| Production | not touched | not touched |

**Promotions today**, each authorised by the owner, with no migrations:

| Promotion | PR | `main` | What it carried |
|---|---|---|---|
| P-2 | #11 | `12d357ce` | the Konfigurasi audit read, Node 22, the restore posture, harness fixes |
| P-3 | #12 | `4d325a33` | W9.19 (the proxy verifies the token locally); the J2.7 walk |
| P-4 | #13 | `d672a94a` | W9.19 reversed; journeys pinned to the exact candidate |

---

## 1 · The session regression: found, fixed, verified

### What happened
- **The defect:** W9.19 (P-3) replaced the proxy's Auth call with a local token check (`getClaims()`).
- **Why it mattered:** on a computer marked PERSONAL, the proxy skips the database's session check, and Auth's answer was what refused a session ended elsewhere.
- **The effect:** after a password reset, «Keluar semua» or an assisted reset, an old browser stayed signed in until its token expired, for up to an hour.
- **Where:** staging only, roughly 09:00–13:00 UTC. Production runs the old release and was never affected.

### How it was found
- **On staging:** the walk GS-21 R2/R3 (run 42195722895). The old browser still reached `/mengajar`.
- **In CI:** the local journeys J2.9 and J2.12 (run 42198619759) found the same thing.

### Why it got through
- **The cause:** the journeys workflow tested its `ref` input, which defaulted to `main`, and it was dispatched without one.
- **The consequence:** the "green" journeys I relied on before P-3 (run 42179347500) tested the old `main`. **W9.19 was never journey-tested before promotion. That was my error.**

### The fix (P-4)
- **The code:** the proxy asks Auth's server again (`auth.getUser()`), exactly as before W9.19.
- **The tests:**
  - W919-CABUT-01 runs the real client with a token signed by the project's own key. A session Auth reports gone is refused, although its token verifies. It is red against the defective code.
  - W919-CABUT-02 checks that the proxy never verifies the token itself and still runs the session check.

### Verification
| Check | Run | Result |
|---|---|---|
| Journeys on the exact candidate `5a78d979` (both jobs printed it) | 42202855039 | GREEN: 9/9 Batch 8 steps, including J2.9, J2.12, J2.20 |
| CI on PR #13's head | 42202852602 | GREEN (W919-CABUT-01/02, KANDIDAT-SHA-01/02) |
| Promoted equals audited | `kandidat-sama.sh` | **SAME** (tree `033ac770`) |
| Staging read-only post-check | — | every value identical |
| Fresh school Sekolah Uji B8 1106: GS-01–03, GS-04–11, GS-07/12–16 | 42211714233, 42213701786, 42217292476 | GREEN |
| **GS-17–21 on the deployed app** | **42220729346** | **GREEN, 18/18** |

**Detail of GS-17–21:**
- **R2/R3:** a session ended elsewhere is signed out on its next page (→ `/masuk`).
- **U1:** the class card locks at 303 s.
- **U2:** the shared computer is locked by the server at 653 s.
- **X1:** nothing is left open.

### The workflow gap is fixed
- **The input:** `audit-journeys.yml` now requires `ref` as a full 40-character SHA, with no default.
- **The checkout:** each job verifies that the checked-out commit is that SHA, then records it (the job summary, and `audit-out/AUDITED_SHA` in the artifact).
- **The match:** `scripts/release/kandidat-sama.sh <audited> <promoted>` must say SAME before a promotion counts.
- **The guard:** KANDIDAT-SHA-01/02. It is red against the old workflow, and the fix's own first run (42202855039) proved it.

### The cost, and the decision
- **The cost:** the W9.19 speed gain (348 → 0 proxy Auth calls per journey) is given back. Immediate enforcement wins.
- **The owner's decision (a), 6 Nov:** `sesi_periksa` is unchanged. There is no relocation, no cached session answers, and no further optimisation project.

---

## 2 · Batch 8

| Row | State | Detail |
|---|---|---|
| **W6.2** U-PERF | **OPEN, NOT MET** | Konfigurasi fixed (3.3 s → 1.3–2.3 s); clicks and saves are under 3 s on the measurements taken. The first screen after sign-in is 2.5–3.2 s from a US runner, measured with W9.19 live; W9.19 is now reversed, so the figures overstate today's code. Stays open until there is representative regional evidence (owner: no US re-runs, no test machine for now) |
| **W6.8** 50 learners | **OPEN, NOT MET** (D-031) | Correctness met: 0 lost, 0 duplicated, 0 errors. Save p95 1,828 ms against 1 s, dominated by distance |
| **W6.9** checklist | **v2.8 RENDERED** | `RELEASE-CHECKLIST.md` + `.docx`, staging-evidence rows only. P0 77 of 84: U-PERF FAIL, CAP-02 FAIL at 50, CAP-07 PASS at 50, STU-19 PASS again after P-4 |
| **W6.12** a11y | PARTIAL | Zoom, keyboard and colour vision green. **NVDA and TalkBack** need a person with the devices |
| W6.4, W6.5, W6.7, W6.10 | verified | (as before) |

## 3 · Batch 9

| Item | State |
|---|---|
| **W9.12** restore readiness | **VERIFIED**: the restored copy passes 24/24 launch-readiness checks (run 42174482669) |
| **W9.14 / J2.7** staff transition | **STAGING VERIFIED**: GS-001's four existing staff, 15/15 (run 42163941604); the email link is gone. Open: the rehearsal on a copy of production (W9.10) |
| **W9.18** release mechanics | Node 22 proven on staging; release evidence pack current. `RELEASE_SHA` untouched |
| **W9.19** efficiency | Auth round trip **reversed** (above); the Konfigurasi read fix kept. No further optimisation (owner) |
| W9.10, W9.13, W9.5–W9.7, W9.11, W9.15–W9.17 | owner or external (unchanged) |

## 4 · Other work today
- **W4.4 reconciled:** the interface words are all in `hle.ts`. What remains is Dr Gladys's copy review.
- **The register:** W6.2, W6.8, W6.9, W9.12, W9.14, W9.18 and W9.19 updated.
- **The evidence:** `batch-8/evidence/staging-praperiksa-p2.md` and `staging-pascaperiksa-p2.md` (P-2, P-3, the regression, P-4), and `w69-bukti-pemeriksaan.md` §2b.

---

## 5 · Open: what each item waits on

| Waits on | Items |
|---|---|
| **The owner** | production read and upgrade rehearsal (F-5, F-18 → W9.10); capacity tier (F-15); DNS; support; backup escrow; residency for K6 (after counsel); any further staging promotion |
| **Counsel** | F-16, the legal gate |
| **Dr Gladys** | the question pack (K1, K2); copy (W2.13, W4.3, W4.4 review) |
| **Daisy** | W1.2, W3.8, W3.21 |
| **A person with devices** | NVDA, TalkBack |
| **Regional evidence** | W6.2, W6.8 |

## 6 · Next (no owner action needed)
1. Keep the register and the release evidence pack current as items move.
2. Routine development and testing on the branch: only work that is unblocked and needs no promotion.
3. Nothing else will be promoted to staging, and production is not touched, without the owner's authorisation.
