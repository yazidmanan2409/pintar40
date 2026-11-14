# A2a change C · early read of commit 30 (C18-1: no marking at the lift; the credit once; D1)

Sharon, 14 Nov 2026 (07:20 UTC). Read-only. I read commit `8cbda9cca05718986a0b87fa2e44fc683564a204` (migration `20270119160000`) against my ruling at `50dab36f`.

## What holds now

- **The design is built as ruled:**
  - the lift no longer marks;
  - a watermark, `darurat_dikredit_sampai`;
  - the pending credit is inside `pengerjaan_tenggat_efektif` (D1);
  - the credit is persisted once, under the sitting's lock, at first touch and in the release batch.
- **C18-1 does NOT close yet: two blockers.**
  - **C30-1:** `record_answer` decides late sync on the uncredited deadline.
  - **C30-2:** a sitting under A1's hold cannot take the credit, and its time left during a stop is wrong.
- **The D1 readers cover every read-only HARUS reader, except `record_answer`** (C30-1).

## Verified

- **The lift** writes `t_lift`, the window, its notices and the audit row. `pengerjaan_tandai_saat_angkat` is dropped, and the migration asserts that the lift does not mark. **0.5 s under the fence: yes.**
- **`penghentian_kredit(s)`** returns the pending credit:
  - lifted windows with `t_stop` at or after the watermark;
  - the sitting created by `t_stop`, open, or EXPIRED inside its grace (C17-1's helper);
  - the person affected at `t_stop`;
  - the union chain;
  - it stops at a chain still in force.
- **`pengerjaan_kredit_darurat`** locks the sitting and re-reads the watermark under that lock. It moves the deadline, or the window-timed shift, later. The guard allows exactly that and never lets the watermark go back.
- **First touch** is `pengerjaan_pagar`, after the person and the shared fence. **The release batch** credits from the windows' people in bounded batches, with no fence.
- **D1, the read-only readers:** `session_state`, `may_continue_session`, `maintenance_draining` and `daftar_pengerjaan` (with AturPengerjaan's KLIEN through it) now read `pengerjaan_tenggat_efektif`. `pengerjaan_saya` already did.
- **The writers** reach `pengerjaan_pagar` first (A2A-C702), so they are credited before they read:
  - the decider, finalize's grace, extend, added time, resume;
  - the hold (through the decider);
  - the closer's step.
- **The closer's selection** reads the raw deadline. That is harmless: a selected sitting is credited at `pengerjaan_tutup_satu`'s first touch, then judged.

## C30-1 · BLOCKER: `record_answer` decides on the uncredited deadline

- `record_answer` (`20261005100000…`, :114 onward) reads `s.authoritative_deadline` and the grace. **It decides the answer's mode before it inserts the response:** in time, LATE_SYNC, or beyond the grace.
- The first touch is in the response trigger (`enforce_response_write` → `pengerjaan_pagar`), which runs **after** that decision.
- So, after a lift and before any other touch, an answer inside the credited time is judged against the deadline without the credit. It can be classed beyond the grace.
- That breaks D-1 for the learner's answers. It is the one HARUS reader that decides first and touches second.
- **Required:**
  - `record_answer` calls `pengerjaan_pagar(p_session)` first. That takes the learner, then the fence, credits, and refuses while protected. It then reads `pengerjaan_tenggat_efektif`.
  - **A2A-C708 gets a structural rule:** a HARUS reader that reads `authoritative_deadline` either reads it through `pengerjaan_tenggat_efektif`, or calls `pengerjaan_pagar` before the read. A reader that does neither fails the test.
- **Test:** after a lift, with no batch and no touch, an answer inside the credited time is accepted in time, and one inside the credited grace is LATE_SYNC. Add a plant: `record_answer` without the helper.
- Could reasonably have been anticipated: yes (Q1). A reader whose decision comes before its own write's trigger.

## C30-2 · BLOCKER: A1's hold (a suspension) meets an emergency stop

**(i) The credit on a frozen sitting is refused, and that blocks the sitting.**
- `penghentian_kredit` does not exclude a sitting under A1's hold.
- At first touch, `pengerjaan_kredit_darurat` moves `authoritative_deadline`. The guard's frozen branch then raises `SITTING_FROZEN`, because the deadline changed and `darurat_sejak` is null.
- `pengerjaan_pagar` propagates that. So **every act on that sitting fails after the lift:** resuming after reinstatement, terminating, closing.

**(ii) The time left is wrong either way.**
- **When the hold comes during a stop** (scenario 6):
  - `pengerjaan_tahan_orang` sets `frozen_remaining_seconds` from the effective deadline at the hold. That counts the time from `T_stop` to the hold as used, although the learner was stopped. The learner loses that time.
  - After reinstatement and resume, a credit for the stop's whole chain would then be added on top, which gives time back for the period the sitting was frozen as well.
- **When the hold covers the whole stop,** the frozen time left already preserves the stop. Any credit after the resume is extra.

**The rule required:** a sitting's time is used only while it is neither stopped (protected) nor held by A1.
- **At an A1 hold of a protected or marked sitting:** the time left is measured at the protecting window's `T_stop` (or at `darurat_sejak`), not at the hold.
- **No emergency mark, release shift or credit applies for any part of a chain the sitting spent under A1's hold.**
  - For a chain wholly inside the hold, nothing.
  - For a chain that began before the hold, the time left already measured at `T_stop` covers it.
  - So the sitting's watermark is moved past that chain when it is resumed.
- **While frozen,** the pending credit is zero, and the credit write is skipped. Do not raise.

**Tests, each with a plant:**
- scenario 6: stop, then suspension, then lift, then reinstatement and resume. The time left after resuming equals the time left at `T_stop`;
- suspension, then stop, then lift, then reinstatement. The time left equals the time left at the suspension;
- a frozen sitting touched after a lift: the act succeeds and nothing is credited.

Could reasonably have been anticipated: yes (Q2, the neighbouring act). D6.5 said "A1's held state, extended (no second system)", and the time arithmetic of the two holds was not composed. I name it now for the first time; my reads of commits 7 and 30 should have asked it.

## The question asked: does it close C18-1?

- **Not yet.** It closes when C30-1 and C30-2 are built, and when A2A-C711 adds the cases above.
- Also required for the close, from my ruling: scenario 8's three numbers, run on the frozen commit:
  - the lift ≤ 0.5 s with no batch run;
  - the release batch's throughput;
  - the cost of D1's read.

## Addendum (07:40 UTC): is C30-2's rule new behaviour? No. It composes D-1 and A1's hold

- **Taken separately,** each approved rule is unchanged:
  - **A1 alone:** the time left is frozen at the hold and given back on resume.
  - **D-1 alone:** a stopped sitting resumes with the time it had at `T_stop`.
- **Only where both apply** does the rule decide, and it gives the learner what D-1 already promises: the time they had when they were first stopped.
  - A hold that comes during a stop measures from `T_stop`, which gives at least as much as A1's own measure.
  - A stop that comes during a hold adds nothing, because A1's frozen time already preserves it.
- No refusal, no act and no wording changes. The teacher's held line (`sisa_ditahan_detik`) shows that same time left.
- **Nothing for the owner.**
