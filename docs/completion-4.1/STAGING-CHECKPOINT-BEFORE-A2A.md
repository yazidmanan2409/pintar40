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
| 3 | Sharon reviews the rollback file, the preservation query and the checks of step 2 | Sharon | After 2 |
| 4 | **The boundary commit:** the head carrying 1 and 2, with a green pre-flight, CI and journeys on that exact commit | Second Eye; confirmed by the Chief Architect | After 1 to 3 |
| 5 | Preservation "before" and the migration count on staging (read-only) | Chief Architect | Before the merge |
| 6 | The pull request into `main`, at the boundary commit, titled as the 4.0 promotions were, stating the commit, the migrations, the rollback file and that nothing touches production | Chief Architect opens it | After 4 and 5 |
| 7 | **The merge** | **The owner** | — |
| 8 | `staging.yml` applies the migrations; its own checks pass; the migration count on staging equals the repository's | Automatic; read by the Chief Architect | After 7 |
| 9 | Addendum 1 §5b items 1 to 6 (section 3 below) | As section 3 says | After 8 |
| 10 | Preservation "after": every value equal to "before" | Chief Architect | After 9 |
| 11 | The staging verification report, on the work branch; Sharon's verdict on it; Daisy's look at the promoted screens if a browser can reach staging | Second Eye; Sharon; Daisy | After 10 |
| 12 | **If every item passes: A2a is released for implementation under its existing gates** (owner's words). Recorded here and in `TEAM-INSTRUCTIONS.md` | Chief Architect | After 11 |

On step 6: the owner's rule is that no pull request is opened without authorization. The authorization above is to
proceed "under Addendum 1 §5b", which requires the protected process, and that process is a pull request into `main`.
The Chief Architect therefore opens it, and only it, when steps 1 to 5 are complete. The merge stays the owner's.

## 3 · What is verified on staging (Addendum 1 §5b)

| # | To prove | How | Acts on staging? |
|---|---|---|---|
| 1 | The scheduler: `pg_cron` installed; the shared installer's jobs exist once each, run in UTC as the expected role; **a job may `CALL` a procedure that commits between batches;** the health read is clean | Read the catalogue and the health read. The committing-procedure proof needs one harmless job run; Second Eye's page states exactly which | Reads, plus one declared job run |
| 2 | Locks and timeouts under hosted roles: an advisory lock through the API and the pooler holds; the per-role `statement_timeout` and `lock_timeout` leave room | Read the role settings; one lock held and released on a throwaway key | Reads, plus one lock that changes no data |
| 3 | Auth with a locked account, **and both triggers on `auth.users`** (`pintar_kunci_tetap_jaga`, and the four guards already there): present after the promotion; Auth's own inserts and updates still succeed; a locked synthetic account is refused sign-in and token refresh with `user_banned` for each method; an admin password write is still refused | Catalogue read for the triggers; the rest with **a synthetic account only**, created for this and removed after, as in the owner's earlier controlled verification | Yes: one synthetic account |
| 4 | Writes to the `auth` schema by the migration owner | Shown by the migrations applying, and by item 3's synthetic account | No further act |
| 5 | Restore: the accountability tables and the jobs come back, or the runbook step reinstalls them; the time `audit_log`'s rewrite takes is measured | **Not a restore of staging itself.** The restore rehearsal workflow against a scratch target, as the 4.0 disaster-recovery tests did; the rewrite time is read from the promotion run. If only a real staging restore can prove it, that is a material step: stop and ask | Scratch target only |
| 6 | Headers: `x-real-ip` arrives, so B1's network origin is filled; the request hook adds no measurable delay | One sign-in by the synthetic account; read its accountability row | Covered by item 3's account |

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
