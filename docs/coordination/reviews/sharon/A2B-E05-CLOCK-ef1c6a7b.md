# A2b batch 2: change_maintenance reads the clock (E05)

Sharon, 16 Nov 2026 (10:40 UTC). Read-only. **What I reviewed:**
- `ef1c6a7b05f1f1a9fe40324db3bc1f596b104589` on `claude/a2b`: migration 20270120200000, in full.
- `change_maintenance`'s body before it, at 20261120100000, plus A2a's edits (the fence, `v_lift`).

## What holds now

- **PASS, subject to the full suite** that Second Eye is running on `c903e71f`. I have not seen that result.
- **One instant, after the locks.** `v_kini` is assigned where the state used to be read, which is after:
  - the window's `FOR UPDATE`;
  - for an EMERGENCY, A2a's exclusive fence, which comes earlier (rank 7, before 8).
- **The stamps:** the state read and every stamp use `v_kini`. That covers `starts_at`, `activation_recorded_at`, `ended_at`, `deactivation_recorded_at` and the notice's `withdrawn_at`.
  - The migration's own check fails if any other `now()` remains.
- **PLANNED windows:** `v_kini` is `clock_timestamp()`. So a window that ended on the clock is NOT_OPEN, not "ended early", and MULAI on a window under way is refused. That is E05's two effects.
- **EMERGENCY windows:** `v_kini` is `now()`, so the lift computes exactly the values it did before. `t_lift` is still `clock_timestamp()`, and E05 pins both values in a 2-second-old transaction.
  - My earlier ask was that this branch stay "byte-identical". **That is superseded, and I accept the change:** the statements are shared between the two kinds, so the text cannot stay the same. Equal values, pinned by E05 and A2a's tests staying green, is the right test. That is Bob's ruling, "values unchanged".
- **The audit:** a PLANNED early end's summary gains `ended_at = v_kini`, which is what A07 compares. An EMERGENCY summary is unchanged.
- **No lock is added or reordered.** A2A-L01's report for `change_maintenance` must be unchanged in the suite.
