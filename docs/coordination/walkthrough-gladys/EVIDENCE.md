# Dr Gladys's walkthrough · evidence and findings (D-117)

**State: POSTPONED (D-118, 6 Oct).** The freeze below did not begin. This record and its instruments are kept, and are re-pinned to the specimen Dr Gladys eventually walks; §1 and §2 describe the 6 Oct specimen. Earlier state: FROZEN, waiting for the walkthrough. Nothing is remediated from this record until the owner and the Second
Eye have reviewed the findings report (§6) and approved each finding.

This walkthrough does not change #150, Production Ready, the legal and data-protection gate, the capacity gate, or the use
of real external student data (D-117(m)).

## 1. The specimen

| | |
|---|---|
| **Staging app** | deployment `dpl_4f9zxVXUnTPmQ3WcxzysR3hf3Yar` (READY), commit `12b480b` (`environment-facts.yml` run 37438389611, GREEN, 6 Oct 08:46 UTC) |
| **Application code** | identical to `bcfd72c`, the commit Sekolah Demo PINTAR was walked on (no line of `src`, `supabase`, `public` or the package files differs), and to `3a7501b` (CI 37430770665, 35/35, 595 tests) |
| **Database** | 165 migrations; `staging.yml` run 37437241796 green: the sign-in boundary, the email sender and the identity settings read back |
| **The demo school** | walked GS-01 to GS-21, every step PASS. GS-16's four extra students reach their tests by typed address: declared, and a bypass under the evidence model (runs 37431278133, 37431385287, 37432707928, 37433910433, 37434862707; JOURNEY-LOG 48) |
| **Production** | untouched: `5b5b68d`, 111 migrations |

### The freeze

**The pause:** from Yazid's own sign-in on the evening of 6 Oct (his pass before he hands over) until Dr Gladys signs
off, PINTAR 4.0 pauses (D-117(a)). Nothing changes in that window:
- application code, UI, copy or database behaviour;
- demo-school data, except to restore an accidental test-state problem (recorded here first);
- Daisy's design system;
- `main` (staging deploys from it).

The coordinator's records go to the branch `claude/awesome-rubin-bqxp6p` only.

**Checked twice:**
- `environment-facts.yml` before she starts and after she finishes must show this deployment and commit;
- anything else is recorded here as a condition of the evidence.

**Scheduled jobs:** none writes to staging during the walkthrough.
- `environment-facts` (nightly) and `production-watch` (hourly) only read.
- `restore-drill` next runs on 2 Nov.
- `backup-offsite` runs only once the owner turns it on, and only reads staging.
- `key-possession-check` next runs on 1 Jan.

## 2. Baseline: Sekolah Demo PINTAR before her account (read only, 6 Oct 08:46 UTC)

| | |
|---|---|
| Active places | 6 (the school, «Jenjang», «Kelas Tinggi», «Reguler», «Kelas 5», «Kelas 5A») |
| Active roles | INSTITUTION_ADMIN 1, EDUCATOR 1, HEAD_OF_DEPARTMENT 1, DEAN 1 |
| People recorded at the school | 8: 3 staff, 5 students (the walk's admin was added outside the intake, so is not among them) |
| Chapters / given to classes | 1 / 1 |
| Official results | 10 (five students × two tests) |
| Certificates | 3 ISSUED |
| In-app problem reports («Laporkan masalah») | 0 at this school; none on staging |
| Audit rows at this school | 91; the latest audit row on staging is 6875 |

The same read after she signs off shows what changed. Yazid's pass comes first: the audit trail separates his actions
(the platform admin) from hers (the second «Admin sekolah»). The diff corroborates her words; it never replaces them.
Yazid's own observations, if he keeps any, are recorded apart from hers.

## 3. The instruments

- **Her guide:** `docs/onboarding/PINTAR-Panduan-Walkthrough-Sekolah-Demo.md`, the non-leading version (D-117(c)): the
  journeys to attempt, no buttons, no meanings, no expected results.
- The earlier version, on `main` at `12b480b`, named buttons and stated the results. Whether it reached her is recorded
  in §4.
- **The observer's sheet:** `OBSERVER-SHEET.md`, for Yazid only.

## 4. Conditions of the walkthrough (filled after)

| | |
|---|---|
| Date, start, end | |
| Device, browser | |
| Observer present? Who? | |
| Roles she held | |
| Yazid's pass before hers: when, and what he changed in the demo school | |
| Guide version she had (and whether the earlier one reached her) | |
| Recording? | |
| `environment-facts` after: the same deployment and commit? | |

## 5. Raw observations (filled after, verbatim first)

One row per observation, in time order. Her words exactly, in the language she used. Nothing is classified here.

| # | Time | Journey / screen | Role | What she tried | What happened | Her words | What she expected (only if she said) | Continued alone? | Help required (where, why, what help) |
|---|---|---|---|---|---|---|---|---|---|

**Corroboration (read only, by role, never her name or email):**
- the after-read against §2;
- the audit trail of the second «Admin sekolah»;
- any «Laporkan masalah» she sent.

## 6. The findings report (filled after; then STOP)

| ID | Journey / screen | Role | Observation | Her words | Expected behaviour (only if established) | Actual behaviour | Help required? | Classification | Severity | Existing ruling / specification | Destination |
|---|---|---|---|---|---|---|---|---|---|---|---|

**Classification, one primary each.** Where a finding spans two, the root decides and the note names the other.

| | |
|---|---|
| **A. Defect** | The behaviour contradicts a canonical decision, specification, security or data rule, or clearly intended behaviour |
| **B. Comprehension** | The behaviour is correct, but the terminology, a status, a consequence, the next step or a relationship is not readily understood |
| **C. Visual / interaction** | The meaning is correct, but hierarchy, visibility, spacing, affordance, emphasis, navigation or interaction makes the task harder |
| **D. Product question** | Her expectation reveals behaviour never decided, or one that conflicts with a ruling: the owner decides |

**Severity, separate from the category.**

| | |
|---|---|
| **BLOCKER** | The intended journey cannot reasonably continue, or there is a serious security, data or integrity risk |
| **IMPORTANT** | The journey continues, but the misunderstanding or friction should be addressed before final acceptance |
| **MINOR** | Real, but it does not materially obstruct comprehension or completion |
| **OBSERVATION** | Useful human evidence; no change necessarily needed |

**Destination:** Engineering · Daisy · Owner decision · No action.

A recommendation states the problem to solve, never a UI implementation.

**Lenses:**
- receive → acknowledge → explain status → give next step;
- every screen answers one question and naturally offers the next.

Neither lens is a reason to add features.

**STOP.** The report goes to the owner and the Second Eye. No remediation starts until a finding is approved.
