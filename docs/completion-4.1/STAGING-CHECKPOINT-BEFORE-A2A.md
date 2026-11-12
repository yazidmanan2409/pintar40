# Staging checkpoint before A2a · the runbook and its record

> **Coordination record,** kept by the Chief Architect on `claude/bob-41-master-plan`. It adds nothing to THE PLAN or
> Addendum 1; it puts the owner's authorization and Addendum 1 §5b into steps, with who does each and when to stop.

## 0 · What holds now (22:00 UTC, 12 Nov 2026)

1. **The owner has authorized the staging checkpoint (12 Nov 2026).** In the owner's words:
   > Approved. Proceed with the staging checkpoint under Addendum 1 §5b, using the final accepted boundary commit after the wording correction and required green checks. Verify all prescribed staging conditions, including both Auth-user triggers. Stop on any material discrepancy. No production action is authorized. Once the checkpoint passes, release A2a for implementation under its existing gates.
2. **What that authorizes:** the promotion of the boundary commit to staging by the protected process, and the
   verification of Addendum 1 §5b's six items on staging, including both triggers on `auth.users`.
3. **What it does not authorize:** any production action; any staging change beyond the promotion and the checks
   below; A2a's build before the checkpoint passes.
3a. **The owner's second instruction (12 Nov 2026, recorded 22:06 UTC), in the owner's words:**
   > You are authorized to prepare and open the staging-checkpoint PR once the final boundary commit, Sharon's
   > review, pre-flight, CI, journeys, and read-only staging preconditions are complete. You open the PR; I will
   > review and merge it when you present the final evidence. Keep the PR strictly within the approved boundary. No
   > unrelated changes, no production action, and no staging mutations before the merge. Sharon must confirm the
   > scratch-target restore satisfies §5b. If it does not, stop and escalate. A2a remains held until the staging
   > checkpoint has passed all required verification. Otherwise, continue autonomously. No need to escalate routine
   > corrections.
   - **So:** the pull request is explicitly authorized, on those six conditions. **Before the merge, staging is
     only read.** Every check that acts on staging (the synthetic account, the one job run, the one lock) happens
     **after** the merge.
   - **Sharon's confirmation of the scratch-target restore is a condition** (step 3). If she says it does not
     satisfy §5b: stop and escalate.
4. **State: preparing.** Nothing has been done on staging. Steps 1 to 3 below are in hand.
5. **Stop rule (owner):** on any material discrepancy, stop, record it here and in `STATUS-2026-11-12.md`, and hold.
   Nothing is repaired on staging without the owner.

## 1 · The protected process, as the repository defines it

Read from `main` and from the 4.0 promotions (`docs/completion-4.0/`, pull requests 15 to 17):

- **Staging follows `main`.** `.github/workflows/staging.yml` runs only on `main`, on a push that adds a migration.
  It applies every pending migration to staging, checks the count equals the repository's, sets and asserts the
  sign-in boundary, and verifies sign-in live. It refuses to connect to anything but staging's project.
- **So a promotion is a pull request into `main`, merged by the owner** (D-004: only the coordinator merges). Every
  4.0 promotion was done this way.
- **Each promotion carried:** a rollback file for its migrations; a preservation query run before the merge and
  after the last check, every value equal; a staging verification report.
- **Production is not reachable by this.** Production workflows run only when one of the `.github/*-request.txt`
  files changes on `main`. The candidate changes none of them (checked against `main`: the only `.github` changes are
  CI's plant gates, the runner port fix and `recover-platform-admin.yml`).

**The one act that is the owner's own: merging the pull request.** Everything before it is preparation, and
everything after it is verification.

## 2 · Steps

| # | Step | Who | State |
|---|---|---|---|
| 1 | L1-F4's refusal line carries Daisy's exact words (wording only) | Second Eye | Owed |
| 2 | **Promotion evidence, on the work branch, following the 4.0 pattern** (`docs/completion-4.0/batch-5/`): `ROLLBACK-225-244.sql` for the 20 migrations; `preservation.sql` (read-only; the 4.0 query, extended for what these batches add); a preconditions page naming, for each §5b item, the exact check, the expected result, and whether it only reads or acts on staging | Second Eye | Owed |
| 3 | Sharon reviews the rollback file, the preservation query and the checks of step 2. **The scratch-target restore: confirmed by Sharon as satisfying §5b item 5, with four conditions (§3a)** | Sharon | Restore confirmed; the rest after 2 |
| 4 | **The boundary commit:** the head carrying 1 and 2, with a green pre-flight, CI and journeys on that exact commit | Second Eye; confirmed by the Chief Architect | After 1 to 3 |
| 5 | Preservation "before" and the migration count on staging (read-only) | Chief Architect | Before the merge |
| 6 | The pull request into `main`, at the boundary commit, titled as the 4.0 promotions were, stating the commit, the migrations, the rollback file and that nothing touches production | Chief Architect opens it | After 4 and 5 |
| 7 | **The merge** | **The owner** | — |
| 8 | `staging.yml` applies the migrations; its own checks pass; the migration count on staging equals the repository's | Automatic; read by the Chief Architect | After 7 |
| 9 | Addendum 1 §5b items 1 to 6 (section 3 below) | As section 3 says | After 8 |
| 10 | Preservation "after": every value equal to "before" | Chief Architect | After 9 |
| 11 | The staging verification report, on the work branch; Sharon's verdict on it; Daisy's look at the promoted screens if a browser can reach staging | Second Eye; Sharon; Daisy | After 10 |
| 12 | **If every item passes: A2a is released for implementation under its existing gates** (owner's words). Recorded here and in `TEAM-INSTRUCTIONS.md` | Chief Architect | After 11 |

On step 6: **explicitly authorized by the owner (§0 item 3a).** *(Superseded, kept: the Chief Architect's own reading
that "under Addendum 1 §5b" covered it.)* The Chief Architect opens it, and only it, when steps 1 to 5 are complete,
and presents the final evidence. The merge stays the owner's.

## 3 · What is verified on staging (Addendum 1 §5b)

| # | To prove | How | Acts on staging? |
|---|---|---|---|
| 1 | The scheduler: `pg_cron` installed; the shared installer's jobs exist once each, run in UTC as the expected role; **a job may `CALL` a procedure that commits between batches;** the health read is clean | Read the catalogue and the health read. The committing-procedure proof needs one harmless job run; Second Eye's page states exactly which | Reads, plus one declared job run |
| 2 | Locks and timeouts under hosted roles: an advisory lock through the API and the pooler holds; the per-role `statement_timeout` and `lock_timeout` leave room | Read the role settings; one lock held and released on a throwaway key | Reads, plus one lock that changes no data |
| 3 | Auth with a locked account, **and both triggers on `auth.users`** (`pintar_kunci_tetap_jaga`, and the four guards already there): present after the promotion; Auth's own inserts and updates still succeed; a locked synthetic account is refused sign-in and token refresh with `user_banned` for each method; an admin password write is still refused | Catalogue read for the triggers; the rest with **a synthetic account only**, created for this and removed after, as in the owner's earlier controlled verification | Yes: one synthetic account |
| 4 | Writes to the `auth` schema by the migration owner | Shown by the migrations applying, and by item 3's synthetic account | No further act |
| 5 | Restore: the accountability tables and the jobs come back, or the runbook step reinstalls them; the time `audit_log`'s rewrite takes is measured | **Not a restore of staging itself.** The restore rehearsal workflow against a scratch target, as the 4.0 disaster-recovery tests did; the rewrite time is read from the promotion run. If only a real staging restore can prove it, that is a material step: stop and ask | Scratch target only |
| 6 | Headers: `x-real-ip` arrives, so B1's network origin is filled; the request hook adds no measurable delay | One sign-in by the synthetic account; read its accountability row | Covered by item 3's account |

### 3a · Sharon's reading of the six items (12 Nov 2026). **It governs where the table above differs.**

Her record: `claude/gracious-lamport-0m1qjr` at `e682422328bce43df209d79fbd3d940a4c104d7a`,
`docs/coordination/reviews/sharon/CHECKPOINT-RUNBOOK-c51e6d47212dd335e9b09eed5eea9c98bcca6a9d.md`. Second Eye builds
the preconditions page on it. Summary:

- **Item 5, the owner's condition: the scratch-target restore is ACCEPTED by Sharon as satisfying §5b.** Staging
  itself is not restored. The tool is `restore-rehearsal.yml`: it only reads staging, restores a copy into an empty
  stack on the runner, and keeps nothing. Four conditions:
  1. it runs **after** the promotion;
  2. its comparison is extended to the new triggers, the L1-F4 guards, the scheduled jobs (`cron.job`) and the
     accountability tables (today it names only the three older triggers on `auth.users`);
  3. the jobs come back once each, or the shared installer puts them back; either way the health read on the copy is
     clean;
  4. the `audit_log` rewrite time is recorded with staging's `audit_log` row count, so it can be scaled.
- **Item 1.** The promotion's own migration installs `pg_cron`; if the hosted project refuses it, stop. The
  committing-procedure test uses declared DDL in a scratch schema, and the catalogue must show nothing left after it.
- **Item 2.** One lock taken and released proves nothing. Two connections, once through the pooler and once direct;
  the timeouts read for every role. No function is added to staging to reach the lock through the API.
- **Item 3 (corrected).** "Both Auth-user triggers" are the insert trigger `on_auth_user_created`, inside which
  L1-F2's lock fires, and the guard on `banned_until`. The check only hosted Auth can prove: **a suspended synthetic
  person is given a new account through the product, and that account is locked from its first read.** Each sign-in
  method's refusal must match that method's wrong-password answer.
- **Item 4 (corrected).** It is about writes to the `auth` schema **while the app runs**, which applying migrations
  does not show. Two proofs: a read-only privilege check on each `auth` table; and removing the synthetic people by
  the product's own path (close the account, then delete the personal data), never through the Admin API.
- **Item 6.** One sign-in shows the network origin is filled. The hook's delay needs at least 50 timed reads against
  D1's budget.
- **Across all items: the preservation query** must fingerprint only rows that existed before, because items 3 and 4
  create synthetic rows. The page lists every row the checkpoint creates.
- **Three more material discrepancies:** a new account left open at any instant; an `auth` write refused at runtime;
  the restored copy differing from staging after the reinstall step.

**Sharon's explicit confirmation for the owner (item 5; her
`CHECKPOINT-ITEM5-152ecea939f780e7c5038f81229fac61879707ce.md`, same branch and commit).** *"Yes: restoring staging's
backup into a scratch target satisfies Addendum 1 §5b item 5. Staging itself doesn't need to be restored."* Nothing
stops and nothing goes to the owner on this point. Her conditions, final (five; they replace the four above):

1. The rehearsal runs after the promotion.
2. Its comparison covers the guard trigger on `auth.users` and the lock trigger on `accounts`, L1-F4's guards, the
   scheduled jobs (`cron.job`) and the accountability tables.
3. On the copy, the installer is run **twice**: each job exists exactly once, then the health read is clean.
4. The `audit_log` rewrite time is recorded with staging's row count.
5. **The known limit is stated in the verification report:** the scratch target does not show what Supabase's own
   hosted restore brings back by itself. Item 5 does not require that, and finding out would mean restoring staging,
   which is not authorized and not needed.

If a condition cannot be met, or the copy differs from staging after the runbook step: material discrepancy, stop.

**Before and after the merge (Sharon; the owner's "no staging mutations before the merge").** Before: only the
read-only preservation query and the migration count. After: item 1's job run, item 3's synthetic people, item 4's
removal, and the rehearsal. The preconditions page marks every step as one or the other.

**Chief Architect's note on scope.** Extending `restore-rehearsal.yml`'s comparison is a workflow change on the work
branch. It is within the boundary: it is the checkpoint's own verification, it touches no request file, and it is
named in the pull request.

**Material discrepancy means, at least:** the migration count differs; any preservation value differs; a migration
fails or is skipped; `pg_cron` cannot be installed or cannot run a committing procedure; a trigger on `auth.users` is
refused by the hosted project or breaks Auth's own writes; a locked account can sign in or refresh; any sign of an
effect on production. Item 1's committing-procedure result, if negative, is not a failure of the promotion but it
**changes A2a's design** (D6.6): A2a is then not released, and its page returns to Sharon.

## 4 · Results

*(Filled as each step completes.)*

## 5 · Log

| When (UTC) | What |
|---|---|
| 12 Nov 2026, 22:00 | Owner's authorization recorded. Runbook written from Addendum 1 §5b and the 4.0 promotion pattern. Nothing done on staging |
| 12 Nov 2026, 22:06 | Owner's second instruction recorded: the pull request is explicitly authorized on six conditions; no staging mutation before the merge; Sharon must confirm the scratch-target restore |
| 12 Nov 2026, 22:08 | Sharon's reading of the six items recorded (§3a); it governs. The scratch-target restore is confirmed as satisfying §5b, with four conditions. Items 3 and 4 corrected |
| 12 Nov 2026, 22:08 | Sharon's explicit confirmation recorded: a scratch-target restore satisfies §5b item 5; five conditions; the known limit to be stated in the report. The owner's condition is met; nothing is escalated |
