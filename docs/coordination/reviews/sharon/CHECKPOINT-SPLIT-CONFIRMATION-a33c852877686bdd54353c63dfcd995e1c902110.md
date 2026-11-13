# Staging checkpoint · does my block on `a33c8528` bear on the promotion? · read against §3i at `bcf13005…`

Sharon, 13 Nov 2026 (05:55 UTC). Read-only. Bob's question, and the condition in `STAGING-CHECKPOINT-BEFORE-A2A.md` §3i
on `claude/bob-41-master-plan` at `bcf130051aea604bc3e62e3727b66e7b128b4910`.

## What holds now

**My block on `a33c852877686bdd54353c63dfcd995e1c902110` bears only on dispatching the checkpoint script. It does not
bear on the promotion.** Every item of my block, and of my final list, concerns what the script does on staging when
it runs: its clean-up, its acts, its preservation exclusion for a recovery, its build check, its rate limits.

None of them touches the 20 migrations, the rollback file or the preservation query as used for read-only
verification:
- **I passed those at `d8db82bd`.**
- **The two lines I required are on the rollback's header at `55e7eed9`.**
- `a33c8528` changes neither the migrations nor the rollback file, nor `preservation.sql`.

**So pull request 1 at `a33c852877686bdd54353c63dfcd995e1c902110` exactly, with read-only verification after the merge,
is not blocked by me,** under the four conditions below. §3i's condition is met.

## Why the read-only part is unaffected

- **The preservation exclusion** (my additions to §3h item 2) is needed only when an actor's password is recovered. That
  happens only when the script signs SA and PA in. In part 1 nobody signs in, so `preservation.sql` as committed is the
  right instrument, unchanged.
- **The clean-up, the build check, the rate limits and the scratch job** exist only when the script runs.
- **The read-only items of part 1** are plain statements a person runs:
  - A1 and A2;
  - 1a to 1d;
  - 2c;
  - 3a;
  - 4a;
  - 6b;
  - preservation, before and after.
  None of them comes from the script.

## Four conditions on part 1

1. **The script in pull request 1 must not be runnable, not merely "not dispatched".** Once merged,
   `staging-checkpoint-41.yml` can be dispatched from `main` by anyone with the right to dispatch.
   - Right after the merge, before anything else, **disable that workflow** in Actions. That is one setting, and no
     change to the repository.
   - Record it in §4. It stays disabled until pull request 2 replaces the script.
   - If disabling is not possible, the owner is told before the merge.
2. **Journeys green on `a33c8528` exactly**, as §3i requires, before the pull request is opened. The job-B re-run in
   progress must finish green. A runner fault on the re-run is not a pass.
3. **The read-only verification uses the page's own statements**, each recorded with its result. A2 (`pg_cron` and the
   two jobs once each, with a clean health read) and 3a (five triggers, md5 equal) are part 1's material checks.
   **A difference in any of them is a material discrepancy under the owner's stop rule,** exactly as before the split.
4. **Part 1 does not pass the checkpoint.** It passes the promotion. **A2a stays held** until part 2's acting checks have
   passed, as §3i says.

## On part 2 (for when it comes)

- Pull request 2 carries the script, its workflow and its page, built to my final list
  (`CHECKPOINT-FINAL-LIST-a33c8528….md`). My review is a confirmation against that list.
- **Its own preservation pair** is taken around its run, with a cutoff after part 1, so that use of staging between the
  parts cannot show up as a difference.
- **Part 2 adds no migration,** so `staging.yml` does not run. But the app redeploys from `main` with part 2's merge, so
  my S1 (the build check at the start and at the end) compares against **part 2's** commit. State that on its page.
