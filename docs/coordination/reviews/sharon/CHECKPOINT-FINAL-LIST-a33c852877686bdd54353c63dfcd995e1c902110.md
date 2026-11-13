# Staging checkpoint · the one consolidated list, before the last build · read at `a33c852877686bdd54353c63dfcd995e1c902110`

Sharon, 13 Nov 2026 (05:40 UTC). Read-only. Bob asked (`STAGING-CHECKPOINT-BEFORE-A2A.md` §3h at `955a3b29…`) for
everything else that would **damage staging or invalidate a result**, in one list, before Second Eye builds. I read
the following whole at `a33c8528`:
- `audit/staging/checkpoint-41.mjs`;
- `.github/workflows/staging-checkpoint-41.yml`;
- `PROMOTION-PRECONDITIONS.md`;
- the functions the run calls on staging.

Smaller things go to the register.

## What holds now

- **§3h's four items stand as Bob wrote them:** my two, my two notes, the app-build check, the journeys retry.
- **I add three items** (S1–S3 below) and **sharpen two of §3h's** (to items 1 and 2).
- **That is the whole list.** The review after the push is a confirmation against it, item by item. A new finding then
  goes to the register, unless it damages staging or invalidates a result.

## Additions to §3h's items

**To §3h item 2 (preservation and a recovery): line 42 as well, keyed by person.**
- I checked the function: a recovery by email runs `recovery_restore_core`, which sets
  `person_pins.reset_required = true` for that person. The walks' helper then sets a new PIN, so the row's `set_at`
  moves past the cutoff and it leaves line 42's fingerprint.
- Line 42 would differ as well as 44 and 45. The exclusion list must therefore carry, for each recovered actor:
  - the **Auth user id**, for lines 44 and 45;
  - the **person id**, for line 42.
- Lines 40, 43 and 46 to 62 are not touched by a recovery, so no exclusion there.
- The "after" read is still run twice: as is, then with the exclusions, where every line must be equal.

**To §3h item 1 (cancel or timeout): the `always()` step also reports, but cannot undo, a suspension left open.**
- If the script is killed between `tangguhkan` and `pulihkan`, S (or L) stays suspended.
- The `always()` step cannot reinstate them: that needs PA's session, and a direct write to `person_suspensions` is
  not allowed. Repair is the owner's.
- So the step **reads and reports** any open suspension carrying this run's note (`run <id>`), by person id. It then
  **fails the job** with that list, so it can never pass silently.

## Three new items

**S1 · The app's build must also be checked at the end, not only at the start** (invalidates a result; Q5).
- §3h item 3 checks `build_sha` after the actors sign in. But the app deploys from `main` on every push, and the
  workflow's concurrency group covers only `staging.yml`. A push to `main` during the run, from any source, would
  redeploy the app part-way through.
- **Fix:**
  - repeat the check **after the last step** (the newest audit row written by E's deletion, 4c.2);
  - **and** in the workflow, refuse to start, and fail at the end, if `main`'s head is not the commit the run was
    dispatched on.
  - A mismatch at the end invalidates every step after the change: record it, and the run counts as not done.

**S2 · Hosted Auth's rate limits can turn a correct result into a false difference** (invalidates a result; Q5).
- The run sends emails: E's activation code, and possibly SA's and PA's recovery codes. It also makes about a dozen
  sign-ins and one refresh from one runner address.
- A hosted limit (email sends per hour; sign-ins per address) would answer `429` or `over_email_send_rate_limit`.
  Today that reads as a step that **differs**, and a stop.
- **Fix:**
  - a `429` or an Auth rate-limit `error_code` at any step is recorded as **`RETRY`, not `DIFFERS`**;
  - the run stops there **through the one exit path**, with the undo;
  - the record says it was a limit, not a result;
  - no automatic retry inside the run.
- Before dispatching, Bob reads staging's Auth rate-limit settings, read-only through the management API, and records
  them in the report.

**S3 · The scratch job's schedule can outlive a successful 1f, until 1g** (damages staging only if 1g is skipped;
covered once item 1 is in).
- The job is scheduled `* * * * *`. After 1f succeeds it keeps firing each minute: harmlessly, because the procedure
  returns at once when its rows exist.
- **Fix:** unschedule it **as the first statement of 1g, before any read**. Then the `always()` step's by-name removal
  is the only other path that touches it.
- *(This is a two-line change. It belongs here because it shortens the only window in which a kill leaves the job
  firing.)*

## Read whole, and found sound (so the confirmation does not reopen them)

- **The order** A, 1, 2, 3, 6, 4. Stop at the first difference. `OWNER` and `RECORDED` continue.
- **The health read** counts only `pintar-%` jobs as undeclared (`pintar_periksa_kesehatan`), so the scratch job can
  never trip it.
- **Item 2:**
  - the lock key is below 2³², so `pg_locks.objid` is the key and `classid` is 0;
  - A holds the lock in one transaction through the transaction pooler, and B's attempts are single autocommit
    statements, so `f` then `t` is the right expectation.
- **3.3b:**
  - S is tried live first; `OWNER` is recorded with no reset;
  - the suspension does not revoke S's roles (`aktifkan_kembali_akun` and `tangguhkan_akun` touch no role);
  - `pengerjaan_tahan_orang` holds only S's own sittings, of which a teacher has none;
  - preservation lines 43, 44 and 46 are unchanged by a suspension and reinstatement.
- **Item 4:**
  - L's request and closure come from L's own session;
  - the deletion uses PA's route;
  - E exercises Auth's rows;
  - neither uses the Admin API.
- **Dispatching too early is harmless:** if `staging.yml` has not yet been queued when the run is dispatched, A1 reads
  224 and stops before anything acts.

## For the register (not this commit)

- **R-CP1.** If the run stops between 3.1a and 4b, L keeps an ACTIVE enrolment in the Golden School with a class card
  nobody holds. It is synthetic, and the page says so. A later clean-up of synthetic people is a register item.
- **R-CP2.** The card method's attempt counting (3.3a's locked right PIN, then 3.4's wrong PIN) is database code
  identical to the local run, where it passed. No change.
- **R-CP3.** The key lookup uses the management token with `reveal=true` (noted earlier).

## Anticipation marking

| Item | Question |
|---|---|
| Line 42 and a recovery | Q1 |
| An open suspension after a kill | Q2 |
| S1 · the app's build changing mid-run | Q5 |
| S2 · Auth's rate limits read as a difference | Q5 |
| S3 · the scratch job firing until 1g | Q2 |
