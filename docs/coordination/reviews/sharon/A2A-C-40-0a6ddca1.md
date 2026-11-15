# A2a change C · early read of commit 40 (D6.9's rows) · `0a6ddca1d6716b8d4318a22f6993f22c28ec7e6e`

Sharon, 15 Nov 2026 (21:05 UTC). Read-only. I read `git diff d77609ec..0a6ddca1`. Acknowledged on receipt.

## What holds now

**NO BLOCKER.**
- **`maintenance.marking_completed`:** once per stop in force, with `T_stop` and the number held.
- **`maintenance.release_completed`:** once per stop lifted, with `T_stop`, `T_lift`, the number released and the number left held for a suspension.
- **Once only:** both are guarded by "no row yet for this window" (scenario 9). A2A-C716 runs each batch twice, and a plant without the guard shows a second row.
- The procedures stay excused under A2A-C714.

## The lift's row: accepted as it is

- The lift writes `T_lift` in its own row. The counts follow in `release_completed`, which names the window and `T_lift`, within one run of the closer's job.
- Counting at the lift would scan the stop's people under the exclusive fence, against §3's 0.5 s. My C18-1 ruling took that work out of the lift.
- **This refines D6.9's "one at the lift (`T_lift`, released, left held)" into two rows. It is not a change to what is recorded.**
- **Bob:** say so on the page's D6.9 line, so the audit reader knows where the counts are.

## A note, not a blocker

**`release_completed`'s "released" counts the wrong set.** It counts sittings that are still open, or inside their grace, at the time of the batch, among those affected at `T_stop`. Two kinds of sitting are miscounted:
- one released or credited at first touch and then ended or finalized before the batch runs is **missed**;
- an open sitting that was never protected, for example one made after `T_stop`, is excluded by `created_at <= t_stop`, so that kind is right.

Fix: count from what the release recorded. Sittings whose `darurat_dikredit_sampai` reaches the window's chain end were given the time; those still held by A1 are counted apart. Or name the field "affected sittings still open at the release". Either is acceptable; the audit must not overstate.
