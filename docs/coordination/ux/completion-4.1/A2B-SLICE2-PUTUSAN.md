# A2b against my 4.0 Slice-2 rulings: does Second Eye's restatement of UX1-S2-MELIHAT-01 keep their intent? (Daisy, 16 Nov 2026)

> **What holds now:**
> - **(a) Yes, with one condition.** **"After" also satisfies it** (§(a), 05:15 note): the sentence stays where it is.
> - ~~**(b) Yes, with two conditions.**~~ **(b) corrected, 16 Nov 05:15:** my condition rested on a false premise. **No assessment has a time limit of its own** (Second Eye, from the code). **My wording advice: D4's sentences drop the duration** and state only the window's times (§(b), correction). What the D4 check means is Bob's ruling. **Bob ruled (05:16): D4's duration sentence and `pemeliharaan.d4.*` leave A2b. Untimed sittings are refused only inside T−15, with the existing `galat.maintenance_no_new_start`. My duration-free table below is therefore not needed for A2b; it is kept only as a record.**
> - The conditions are what the test should assert. ~~**The screen does not change.**~~ For (b), the D4 lines change (below).
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
- **05:15 note, on Second Eye's fact that the sentence renders directly AFTER the button: "after" satisfies this.**
  - What matters is that the sentence is visible, adjacent, and next in reading order, with nothing focusable between them.
  - "Before" was my wording, not a need. Do not move it.

## (b) D4's duration under `pemeliharaan.d4.*`; `siklus.*` stays free of durations. **Yes.**

**What the ruling guards against:**
- An orientation inventing or estimating a duration the assessment does not have. The `Orientation` type carries none, and the component derived none.
- The namespace split keeps that true for the orientation itself.

**But the intent is about where the number comes from, not only which key holds it. Two conditions:**
~~1. **{d} is the assessment's own time limit, read from the same field the database's D4 check uses.** It is never computed or estimated in the component. The test should assert that the component receives {d} from that read, as it asserts today that it derives no duration.~~
~~2. **Untimed work never shows a D4 duration line.** An untimed assessment refused near a window shows `galat.maintenance_no_new_start`, which has no duration. «memerlukan {d} menit» on untimed work would be exactly the invented duration Slice-2 forbids.~~

**Correction (16 Nov, 05:15).** Second Eye found from the code:
- **No assessment has a time limit.** A sitting's deadline is its assignment's `closes_at`, which D4's check uses.
- So {d} would be "minutes until the assignment closes", which can be months.

**So «Asesmen ini memerlukan {d} menit» states something false, however D4 is computed.** It is the invented duration Slice-2 forbids.

**My wording advice: remove the duration and state only the window's times, which are real.** Whatever Bob rules D4's check means, these lines stay true:

| Case | ID | EN |
|---|---|---|
| Window with an end | «Pemeliharaan mulai pukul {jam} {zona}, jadi asesmen ini belum dapat dimulai sekarang. Mulailah setelah pemeliharaan selesai, pukul {jam selesai} {zona}.» | «Maintenance starts at {jam} {zona}, so this assessment cannot be started now. Start it after maintenance ends, at {jam selesai} {zona}.» |
| No end set | «Pemeliharaan mulai pukul {jam} {zona}, jadi asesmen ini belum dapat dimulai sekarang. Mulailah setelah pemeliharaan selesai.» | «Maintenance starts at {jam} {zona}, so this assessment cannot be started now. Start it after maintenance ends.» |
| Class-scoped | «pemeliharaan kelas {kelas} mulai …», otherwise as above | «maintenance for class {kelas} starts …» |
| End on another day | «… pukul {jam selesai} {zona}, {tanggal}.» | «… at {jam selesai} {zona} on {tanggal}.» |

- **With this wording, Slice-2's duration rule needs no exception:** no copy anywhere offers a duration, `pemeliharaan.d4.*` included. The test can then assert that across all copy.
- **Batch 1's D4 shots** (a 90-minute fixture) show the screen as built. I will review the words against this table, not against «memerlukan».

## Anticipation

- **V-2, mine, anticipable, question 1:** my condition assumed a time-limit field without reading what D4's check actually reads. So did my original D4 line in `A2-KATA-DESAIN.md` B2. Recorded in `ANTISIPASI-4.1.md`.
- **Otherwise not a defect:** the restatement was raised before the freeze. Question 1 (what else reads this state: the 4.0 test reads the orientation surface) caught it.
