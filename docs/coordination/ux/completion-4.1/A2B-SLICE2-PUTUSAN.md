# A2b against my 4.0 Slice-2 rulings: does Second Eye's restatement of UX1-S2-MELIHAT-01 keep their intent? (Daisy, 16 Nov 2026)

> **What holds now:**
> - **(a) Yes, with one condition.**
> - **(b) Yes, with two conditions.**
> - The conditions are what the test should assert. **The screen does not change.**
> - **Read:** Bob's note (16 Nov, 04:57) on `claude/a2b` at `8e147195`; the 4.0 test's own statement of the four rulings (`docs/completion-4.0/batch-6/evidence/full-suite-local.txt`).

## (a) One disabled control: «Mulai» on the maintenance branch. **Yes.**

**What the ruling guards against:**
- A learner who **may not take** an assessment should reach the one refusal page. They should never get a greyed-out orientation that leaves them guessing.
- The surface should not ask a second eligibility question of its own.

**Why D8-3 does neither:**
- A maintenance window is **not ineligibility**. The learner may take this assessment, just not now. The screen says why and until when, in D4's sentence.
- The disabled state comes from the database's own refusal (D4 / `MAINTENANCE_NO_NEW_START` / `MAINTENANCE_PLACE`), so it is the same question, not a second one.

**Condition (the test should assert it):**
- Whenever that «Mulai» is disabled, **D4's sentence is rendered as visible text** directly before it, as well as tied by `aria-describedby`.
- A disabled control leaves the tab order, so a reason found only through `aria-describedby` would reach nobody who navigates by keyboard.
- **A greyed «Mulai» without its sentence fails.** That keeps the ruling's "never greyed out without a reason" true.

## (b) D4's duration under `pemeliharaan.d4.*`; `siklus.*` stays free of durations. **Yes.**

**What the ruling guards against:**
- An orientation inventing or estimating a duration the assessment does not have. The `Orientation` type carries none, and the component derived none.
- The namespace split keeps that true for the orientation itself.

**But the intent is about where the number comes from, not only which key holds it. Two conditions:**
1. **{d} is the assessment's own time limit, read from the same field the database's D4 check uses.** It is never computed or estimated in the component. The test should assert that the component receives {d} from that read, as it asserts today that it derives no duration.
2. **Untimed work never shows a D4 duration line.** An untimed assessment refused near a window shows `galat.maintenance_no_new_start`, which has no duration. «memerlukan {d} menit» on untimed work would be exactly the invented duration Slice-2 forbids.

## Anticipation

**Not a defect:** the restatement was raised before the freeze. Question 1 (what else reads this state: the 4.0 test reads the orientation surface) caught it.
