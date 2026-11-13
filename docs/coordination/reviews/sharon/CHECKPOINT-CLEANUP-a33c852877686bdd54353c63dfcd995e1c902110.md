# Staging checkpoint · the clean-up delta · `a33c852877686bdd54353c63dfcd995e1c902110` (on `55e7eed9…`)

Sharon, 13 Nov 2026 (04:55 UTC). Read-only. The delta: `audit/staging/checkpoint-41.mjs`, the page, and the local test
record. Also the head of `promote/4.1-staging-checkpoint`.

## What holds now

- **My blocker on `55e7eed9` is fixed as I asked:** one exit path, try/finally, and the undos recorded.
- **BLOCKED on two new, small items**, both found because the fix made the exit paths visible:
  1. **A cancel or a timeout** still bypasses the clean-up.
  2. **A password recovery by the sign-in helper** would make preservation line 44 differ, so the stop rule would fire
     on a declared act.
- Each is a few lines. **I review the delta as soon as it is pushed, these two points only.**

## The clean-up: verified

- **`selesai()` is the one exit**, for a step that differs, an unhandled rejection or exception, and success. It runs
  `rapikan()`, which **reads staging** and does not trust what the run believes:
  - **Item 1:** if 1g has not completed, it finds the job and schema **by name**, unschedules, deletes the run details
    and drops the schema, then reads the catalogue. The result is recorded `removed` or `FAILED … the owner's`.
  - **Suspensions:** each person is registered **before** the suspension is asked for, so one whose answer was lost is
    still found. It is matched on staging by the run's own note (`run <id>`) and reinstated with PA's session, then
    checked. Removed from the list only on success, so a failed reinstatement in a `finally` is retried by the exit
    path.
- **3.3b and 3.5:** suspend and reinstate in try/finally.
- **The undo does not turn a stop into a pass.** The step that differed still stops, as I required.
- **Local forced failures** (`CHECKPOINT_PAKSA`, refused against staging) at 1f, 3.2, 3.3b and the undo itself.

## The two new items

**1 · A cancel or a timeout bypasses the exit path** (could reasonably have been anticipated: Q5, who runs it, here
the runner, which can stop it).
- The job has `timeout-minutes: 40`, and the Chief Architect can cancel a run. Either way the runner signals the
  process (SIGINT, then SIGTERM, then kills it).
- There is no signal handler, so `rapikan()` never runs, and 1e's job is left firing every minute.
- **Fix, both parts:**
  - (a) `process.on("SIGINT" | "SIGTERM", () => selesai(1))`;
  - (b) **an `if: always()` step in `staging-checkpoint-41.yml`**, after the script, that removes the scratch job and
    schema **by name** with `psql` and prints the `0 0 0 0` catalogue read. It must not depend on Node surviving, since
    a kill is not catchable.
  - The step is idempotent: it does nothing if they are already gone.

**2 · A password recovery collides with the preservation query** (could reasonably have been anticipated: Q1, what
else reads this state).
- The page now declares, correctly, that if SA's or PA's derived password fails, the walks' helper recovers it and sets
  the same password again.
- Preservation line 44 fingerprints `md5(encrypted_password)` for every Auth user created before the cutoff. SA and PA
  are such users. A new bcrypt hash differs even for the same password, so line 44's "after" would differ.
- Under my own rule that is a stop, and it must not be explained away afterwards. A declared act would then fire the
  stop.
- **Fix:** declare it in advance, mechanically.
  - `preservation.sql` gains a third `batas` value: a list of Auth user ids to exclude from lines 44 and 45 only.
  - The "after" read is run **twice**:
    - as is, where line 44 may differ;
    - with `pemulihan`'s user ids (SA's and PA's, read from the record by id) in that list, where **every line must
      be equal**.
  - Any difference in the second read is a material discrepancy. Any account other than those named that differs is a
    stop.
- (No exclusion is needed for the other tables the page lists. They are new rows after the cutoff, or new tables, or
  outside the fingerprints.)

## Notes (non-blocking)

- **An undo of L's suspension** at a stop between 3.1a and 3.4 leaves L with a live class card.
  - The card's number and PIN are never stored or printed, so nobody can use it.
  - Say so on the page, beside "L and E are not undone".
- **If `cron.schedule` succeeded but `hasil.ids.jobid` was not captured,** the run-detail rows survive the undo, and the
  `0 0 0 0` read (which uses `jobid ?? 0`) would not see them.
  - Harmless rows in `cron`'s own table.
  - Safer: delete by `jobid in (select jobid from cron.job where jobname = 'uji-41-prosedur-komit')` **before** the
    unschedule.

## The four questions

- **And then what?** Every way the run can end now leaves staging as it found it, apart from the recorded synthetic
  rows, once item 1's two parts are in.
- **What else did that change?** The preservation comparison gains a declared, recorded exclusion for at most two named
  accounts.
- **What happens when things go wrong?** Today a cancel leaves the job running. After the fix, the workflow's
  `always()` step removes it even if the script was killed.
- **Can it be reversed, and what survives?** Unchanged.

## Anticipation marking

| Defect | Anticipable? | Question |
|---|---|---|
| A cancel or a timeout bypasses the clean-up | Yes | Q5 |
| The helper's password recovery against preservation line 44 | Yes | Q1 |
