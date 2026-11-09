# Kelas 5 → Kelas 6 promotion: what PINTAR 4.0 actually does (local stack, synthetic, 9 Nov 2026)

**How this was run:**
- Evidence from a run through the real screens. The step log is `journey-log.md`, 43 screenshots are in `shots/`, and
  the SQL snapshots and audit rows are in `sql/`.
- Schools: «SD Sintetis Kenaikan» (A) and «SD Sintetis Penerima» (B).
- Learners: Satu, Dua, Tiga, Empat, Lima, Enam, Tujuh (Kelas 5A 2026/2027), and Delapan (Tingkat 5 only).
- The repository was not changed.

## Verdicts

| Capability | Verdict | Evidence |
|---|---|---|
| Promote | **Works, one class at a time.** «Pergantian tahun ajaran» maps class to class. There is no preview and no confirmation | 5A→6A, «✓Selesai. Keanggotaan kelas yang dipindahkan ke tahun ajaran baru: 6.» |
| Outcome reporting | **Missing.** One count only: no names, no per-class count, no list of who did not move | the function returns a number |
| Silent omission | **Defect.** A learner recorded in a Tingkat but not a Kelas (Delapan) was left behind with no mention | 8B |
| Failure handling | **Atomic, but unnamed.** A deactivated target class (6Z) refused the whole run, so nothing moved; the message names no class or learner. The deactivated class is still offered in the form | 8A |
| Double submit / repeat | **Works.** One submission reached the database; a later press moved 0. No duplicate membership or enrolment for any learner. A no-op run still writes an audit row; a refused run writes none | per-learner table |
| Repeat a grade | **Partial, a workaround.** No choice per learner: roll the class over, then «Pindah kelas» Lima 6A → 5A 2027/2028, so the history shows a brief stay in 6A | 8D |
| Transfer | **Works, with defects.** Request → accept → execute ran with both admins. Only ACTIVE (signed-in) learners can be offered, and each school sees the other as «—». **Defect:** A's «Murid yang belum punya kelas» still offers «Masukkan ke kelas» for the departed Enam (a probe would create a PENDING enrolment at A while Enam is ACTIVE at B) | shots 10–17 |
| Withdraw / complete | **Missing.** No screen or function sets WITHDRAWN or COMPLETED. The workaround the inventory found (D2: a raw table update) withdraws but leaves the membership open | shots 20–23; a rolled-back probe |
| Authorization | **Works.** The Guru is refused the page and the RPC; school B's admin sees only B, and its RPC calls and direct updates on A change nothing | |
| History | **Memberships: works.** Closed with `valid_to` and PERIOD_ROLLOVER, ENROLLMENT_ENDED or MOVED; row totals only grow. **Enrolments: partial,** because promoted learners keep an enrolment tagged 2026/2027. **Teacher roles are not carried** to the new class | snapshots |
| Audit | **The database works, with gaps:** `period.rollover` has the mapping but no count. **The screen is partial:** «Jejak audit» shows Waktu, Tindakan, Sasaran only (no actor, no reason) | `sql/audit.txt`, shots 50 |
| Assessment evidence | **Not demonstrated:** no local package with a pre-test or post-test could be assigned | |

## Against the owner's benchmark

The benchmark is: select the class's learners, choose their next grade, review the exceptions (repeat, transfer,
withdraw), confirm, and see each learner's actual outcome.

| Step | Today |
|---|---|
| Select the learners | a whole class only |
| Choose the next grade | **yes:** class → class |
| Review the exceptions | **no:** no per-learner choice; repeat is a workaround; withdraw is missing; a Tingkat-only learner is dropped silently |
| Confirm | **no:** one press, no confirmation |
| The outcome per learner | **no:** one number |
