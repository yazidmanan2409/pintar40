# R-15 · Sharon's carried items, closed or open, on main 7ba18b03

Sharon, 18 Nov 2026 (12:45 UTC). Read-only. I read `main` at `7ba18b03b47ec78f61b0e66cf1f11f1a4044534a` and the acceptance records. Nothing was re-run.

## 4.0 run check (EXECUTION-PLAN §5)

| Item | Status | Where |
|---|---|---|
| School guard before `not (v_summary ? 'run_id')` | **Open, mitigated** | The guard is still inside that branch (`20270112210000:120–125`), so a caller-supplied `run_id` skips it. The deferred `audit_run_parent_check` refuses any run row whose school differs from its run's `promotion.applied` row, and fable37 K08 covers that |
| The school filter in the run check | **Closed** | `audit_run_parent_check`: `p.institution_id is not distinct from new.institution_id` (`20270112210000`) |
| F37-K06 proved by a plant | **Closed (one-off)** | `SYSTEM-INTEGRITY-MATRIX.md:164`: two plants on 10 Nov, the second red. The plant is not committed |

## A1, Sharon's seven

| Item | Status | Where |
|---|---|---|
| Mark granted attempts, and say which result reports use | **Marking closed; the reports part open** | `percobaan_tandai` sets `attempt_request_id` (`20270114100000:295`). I found no record of which result reports use |
| A cap on extra time | **Closed** | `SITTING_EXTEND_LIMIT` (three times) and `SITTING_MINUTES_INVALID` (1 to 120) |
| A window change never reopens a CLOSED assignment | **Closed** | `WINDOW_ASSIGNMENT_ENDED` (`20270114100000:40, 74`) |
| Time lost to maintenance | **Closed** | A2a's credit (`pengerjaan_kredit_darurat`) and A2b's drain (D5). Both batches are accepted |
| The lock order with A3 | **Closed on `claude/a3`** | A2A-L01 and A3-E01 (`d19c9a6b`). It reaches `main` when A3 merges |
| Re-check the conditions at approval, not only at request | **Open** | `putuskan_percobaan` checks only PENDING, authority and the reason (`20270114100000:841–872`). It is mitigated: the start re-checks through `may_start_assessment` |
| A request is single-use and lapses with the school year or the assignment | **Closed in effect** | Each APPROVED request adds one attempt, counted per learner and assignment (`percobaan_izin_jumlah`), and is marked on one sitting. The assignment and its year bound it. On `claude/a3` it spans the lineage (ruling 46) |

## C1w, Sharon's six

| Item | Status | Where |
|---|---|---|
| Statistics after a one-question revision | **Open (to 4.5)** | No rule found. It belongs with RD-4 and Question Intelligence |
| Lessons of a withdrawn release | **Closed** | The 10 Nov ruling excludes such sittings. I took this from the planning audit's citation; the test was not re-read |
| Who can see «Riwayat soal» | **Partly closed** | `riwayat_soal_koreksi` is not client-callable (`20270115110000:1208`). I did not re-read the authority of the reader that calls it |
| `create_course_revision` revises only the current head | **Closed** | `REVISION_NOT_HEAD` (`20270115100000:28`) |
| Prefer a confirmer who is not the author of the faulty revision | **Open (it was a preference)** | The proposer never confirms (`20270115110000:11`). The author of the faulty revision is not excluded |
| Every result change opens a certificate review, with a one-step confirm where the outcome is unchanged | **Review: closed. Confirm: not re-read** | `20270115110000:36`: a review opens even when the outcome is the same |

## B0

| Item | Status | Where |
|---|---|---|
| Closing an account can leave a school with no usable admin | **Open, mitigated** | The last-admin guard covers role revocation only (`20270113170000`). `tangguhkan_akun` has no last-admin check. It is platform-admin only, and a platform admin can appoint a new school admin, so it is recoverable, not a lockout |
