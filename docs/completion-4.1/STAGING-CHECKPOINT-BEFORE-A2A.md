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
| 1 | L1-F4's refusal line carries Daisy's exact words (wording only) | Second Eye | **Done** at `049e21ad1875b399a4ed2111897dbda8b14cf1d2` |
| 2 | *(Pushed at `d8db82bde8d7a47e9936a34fd21686ca11adb472`; one more commit owed, §3c.)* **Promotion evidence, on the work branch, following the 4.0 pattern** (`docs/completion-4.0/batch-5/`): `ROLLBACK-225-244.sql` for the 20 migrations; `preservation.sql` (read-only; the 4.0 query, extended for what these batches add); a preconditions page naming, for each §5b item, the exact check, the expected result, and whether it only reads or acts on staging | Second Eye | Owed |
| 3 | Sharon reviews the rollback file, the preservation query and the checks of step 2. **The scratch-target restore: confirmed by Sharon as satisfying §5b item 5, with four conditions (§3a)** | Sharon | **PASS on the evidence at `d8db82bde8d7a47e9936a34fd21686ca11adb472`**, with two required lines (§3c); her review of the §3c commit's delta is owed |
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

**A correction to §5b's text, found by Second Eye (22:11 UTC, 12 Nov).** §5b item 5 attributes the `audit_log`
generated-column rewrite to B1. It is migration 215 (the class move-up), **already on staging at 224.** This
promotion's run therefore cannot time it. The rehearsal's new step times it on the scratch copy (the column rewrite
and both index builds, as migration 215 wrote them), recorded with `audit_log`'s row count. The purpose of the
measurement is unchanged: sizing production's window later. **Sharon confirms this at her review** (step 3).

### 3b · Chief Architect's rulings on the open points of the preconditions page (23:25 UTC, 12 Nov)

Ordinary technical questions, settled here; Sharon may correct any of them at her review.

1. **How each after-merge check is run, and by whom.** The page states this for every step. **No credential passes
   through any team member:** a check that needs a secret runs as a dispatched workflow using the repository's
   existing staging secrets, as the 4.0 staging walks did. If that needs a new workflow file, it is part of the
   boundary commit and named in the pull request. A step that only a person holding a credential could do is marked
   so, and is the owner's.
2. **Password sign-in and PIN recovery for a locked account (item 3).** In this order: (a) a synthetic account that
   already exists on staging and whose credential is already a repository secret; (b) if none, the method is **not
   exercised on staging**, the page says so with the reason, and names the local tests that prove it. No new mailbox,
   and no credential created for this. Sharon rules whether (b) is enough for the item.
3. **The request hook's delay (item 6).** The owner allows no mutation before the merge. A baseline may be taken
   before the merge **only if it creates no row at all**: no sign-in, no session. If a baseline needs a signed-in
   read, there is no baseline; the hook's cost is then measured after the merge by a method the page states. THE PLAN
   gives D1's budget no number, so the page states its criterion in advance (for example, the difference in medians
   is smaller than the run-to-run spread) and the report gives the figures.
4. **The rollback does not turn a lock back into `'infinity'`.** Agreed: `'infinity'` is the value L-1 removed
   because Auth failed on it. Sharon rules at her review.
5. **DR-D02's failure during the round-trip run** is settled only by the clean pre-flight on the boundary commit. If
   it is red there, it is real and is fixed before any push.
6. **The rollback's restoring of withdrawn explanations before 224's NOT NULL** is right, and is the kind of thing
   the fourth question exists for.

**Chief Architect's note on scope.** Extending `restore-rehearsal.yml`'s comparison is a workflow change on the work
branch. It is within the boundary: it is the checkpoint's own verification, it touches no request file, and it is
named in the pull request.

**Material discrepancy means, at least:** the migration count differs; any preservation value differs; a migration
fails or is skipped; `pg_cron` cannot be installed or cannot run a committing procedure; a trigger on `auth.users` is
refused by the hosted project or breaks Auth's own writes; a locked account can sign in or refresh; any sign of an
effect on production. Item 1's committing-procedure result, if negative, is not a failure of the promotion but it
**changes A2a's design** (D6.6): A2a is then not released, and its page returns to Sharon.

### 3c · The evidence at `d8db82bde8d7a47e9936a34fd21686ca11adb472`: read, reviewed, and one more commit owed (13 Nov 2026, 00:56 UTC)

**Pushed by Second Eye:** the rehearsal change (`8f27ff256d27cf98a97e7a849c85597de59805c0`) and the evidence
(`d8db82bde8d7a47e9936a34fd21686ca11adb472`): `docs/completion-4.1/checkpoint/` with `PROMOTION-PRECONDITIONS.md`,
`ROLLBACK-225-244.sql` and its test record, `evidence/staging/preservation.sql`. Pre-flight green (engineer's report);
CI `43335326671` and journeys `43335340904` green.

**Sharon: PASS on the evidence** (her `CHECKPOINT-EVIDENCE-d8db82bde8d7a47e9936a34fd21686ca11adb472.md`,
`claude/gracious-lamport-0m1qjr` at `33e1c648c53b31db4439c6f1750f1dbca0e1b839`). Her rulings, which stand:
- **Required, two lines on the rollback's header and the page (no code):** (1) a rollback returns the *database* to
  224, but staging's app is deployed from `main`, so it is paired with reverting the merge, in a stated order, and
  both are the owner's to decide; (2) what a rollback re-opens under 224's code (L1-F4, L1-F2, L1-R2), so nobody
  approves a reopen or creates an account for a suspended or anonymised person on staging until 244 is back.
- **Password sign-in on a locked account: to be exercised** on an existing synthetic staff account (not a platform
  administrator), right password and wrong password, compared field by field. **PIN recovery: skipped,** reason
  recorded (decided in the database, proven locally; an attempt would add to the recovery ladder).
- **The hook (6b): allowed before the merge in a read-only transaction.** Gate: p95 ≤ 1 ms with no window active,
  before and after, and after ≤ before + 0.5 ms. The endpoint timing (6c) is recorded, not gated.
- **`banned_until` kept in the rollback: accepted.** **The rewrite timed on the copy: confirmed.**
- **To watch:** if staging's own data makes a preserved line differ after the promotion, that is a stop; it is not
  explained away on staging.

**Chief Architect's read.** Scope against `main`: 20 migrations; no request file; no `supabase/config.toml`; the
`.github` changes are CI's plant gates, the runner port fix, `recover-platform-admin.yml` (B0) and the rehearsal.
`preservation.sql` is a single read. **One gap, which decides the boundary commit:**

- The page says "unless stated otherwise, the Chief Architect runs it" for the after-merge steps. Many of them **act
  as staging's synthetic administrators** (sign-ins, suspending, creating a card, deleting) or need **two database
  connections, one through the pooler.** Those need credentials. **No credential passes through any team member**
  (the owner's standing rule; §3b ruling 1). The Chief Architect can read staging's database; he cannot and must not
  sign in as anyone.
- **So the acting steps run as one dispatched workflow** on the repository's existing staging secrets, as the 4.0
  staging walks did (`staging-golden-school*.yml`, `staging-platform-operator.yml`): items 1 (the scratch job), 2,
  3, 4 and 6c, in the page's order, stopping at the first result that differs, uploading its evidence, with the same
  refusal of any project but staging that `staging.yml` has. A workflow can only be dispatched once it is on
  `main`, so **it must be in the boundary commit.**
- **Sharon's "a synthetic staff account whose password the operator holds":** the operator is that workflow. If no
  existing staging secret holds such an account's password, the page says so plainly; that one step is then the
  owner's to run or to waive, and it is brought to him with the pull request. It is not solved by creating or
  passing a credential.
- **6b is restated as one `select` that returns its figures** (a `do` block's notice cannot be read through the
  database tool the Chief Architect has), and is run the same way before and after.

**Owed, as one more commit on the work branch (it becomes the boundary commit):** Sharon's two lines; the checkpoint
workflow and its script; 6b as a select; the page's "who runs it" corrected for every step. Then: full pre-flight,
push, CI and journeys, and Sharon's review of the delta.

### 3d · The five questions, asked of the checkpoint itself before it runs (13 Nov 2026, 01:18 UTC)

The owner (13 Nov): *"Apply the five questions rigorously. Let's see fewer avoidable correction cycles, without
weakening any verification gates."* Applied here first, because the checkpoint is the next thing built and run.

| # | Question | Answer for the checkpoint | Follows |
|---|---|---|---|
| 1 | What else reads or writes this state? | **The scheduled jobs.** From the moment 227 and 231 apply, jobs run on staging's **existing** data every few minutes: the closer ends and scores sittings left open past their deadline; the retention job removes records past their term. Staging holds testers' and the demonstration school's data. Nobody has yet counted what the first runs will act on | **Owed in the boundary commit:** for each declared job, a read-only statement that counts what its first run will act on, by school. The Chief Architect runs them before the merge and puts the figures in front of the owner with the pull request. A sitting in the demonstration school being closed and scored is expected behaviour, but the owner sees the number first |
| 1 | (the same) | The staging app deploys from `main` as well. For the minutes between the app's deploy and `staging.yml` finishing, a 244 app may meet a 224 database | The same as every 4.0 promotion. Stated in the pull request; no check runs until `staging.yml` has finished |
| 2 | The opposite act? | The rollback, paired with reverting the merge (Sharon's first required line). The synthetic learner stays anonymised, by design | Already owed |
| 3 | Which locks, and who else takes them? | The checkpoint workflow shares the `staging` concurrency group question with `staging.yml`; its lock test uses a throwaway key | **Owed:** the workflow cannot start while `staging.yml` runs, and says so |
| 4 | Before from after? | The preservation query's recorded cutoff and audit watermark | Done |
| 5 | Who runs each check, with what access? | Reads: the Chief Architect. Acts: the dispatched workflow, on existing secrets. **Do the synthetic administrators the page names (SA, PA) exist on staging today, with secrets?** | **Owed:** the page names the exact existing accounts by their role and the secret names (never values), or says which do not exist |


### 3e · The boundary candidate `55e7eed9573d7396973b48665cd9d67a048da5bf`: Chief Architect's read (13 Nov 2026, 03:10 UTC)

Two commits above the evidence: `8b3e07a3e80e31298a88e5912de34cc528866599` (the workflow, Sharon's two lines, 6b as
one select, `first-runs.sql`, the page) and `55e7eed9573d7396973b48665cd9d67a048da5bf` (redaction; the artifact is the
record alone). CI `43355398130` and journeys `43355401326` were in progress.

- **Scope against `main`:** still no request file and no `supabase/config.toml`. New: `staging-checkpoint-41.yml`,
  `audit/staging/checkpoint-41.mjs`, and documents under `docs/completion-4.1/checkpoint/`.
- **The workflow, read in full.** Dispatch only; its job runs only on `main`; a typed confirmation; it refuses while
  `staging.yml` has any unfinished run and shares its concurrency group; it checks the database URL names staging and
  not production before anything connects; it reads the database URL, staging's public key and the test mailbox's
  password, and not the service key; it uploads `checkpoint-41.json` alone, with every line redacted of tokens, keys,
  passwords, PINs, card numbers and settings. Permissions: read only.
- **Its dispatch needs two inputs** (the synthetic school's slug and a class name). The Chief Architect reads them
  from staging before dispatching; they are not secrets.
- **Five questions:** answered by §3d, and its three owed items are in.
- **Still owed before the pull request:** green CI and journeys on `55e7eed9573d7396973b48665cd9d67a048da5bf`;
  Sharon's review of the delta (her two lines; the workflow; the derived staff password; the "direct" lock test's
  fallback); then preservation "before" and 6b on staging.

### 3f · BLOCKED by Sharon on one item at `55e7eed9573d7396973b48665cd9d67a048da5bf` (13 Nov 2026, 03:16 UTC)

Her record governs: `claude/gracious-lamport-0m1qjr` at `183554b32b2148537f597828a74db0b4d029fd11`,
`docs/coordination/reviews/sharon/CHECKPOINT-BOUNDARY-55e7eed9573d7396973b48665cd9d67a048da5bf.md`.

- **The blocker: the script does not clean up when it stops.** It stops by exiting, with no exit handler. Two acts
  on staging are undone only by a later step:
  1. **Item 1's scratch job** is scheduled every minute at step 1e and removed only at 1g. A stop at 1f leaves it
     firing on staging, and that includes the very result the item exists to find (the procedure failing on
     transaction control).
  2. **The teacher account S** is suspended and then reinstated in 3.3b. A failure between the two leaves S
     suspended; other walks use S.
- **The fix (Sharon):** one exit path, run on every stop and on success, that unschedules and drops the scratch job
  if 1g has not run and reinstates anyone this run suspended; suspend and reinstate in `try`/`finally`; each undo
  written to the record; a local test that forces both failures.
- **This does not weaken the owner's stop rule.** A stop still stops and holds. The clean-up only returns the
  checkpoint's own two temporary acts, so that staging is left as the checkpoint found it. Nothing else is repaired.
  **If a clean-up step itself fails, the record says so and that is the owner's.**
- **Correction to my read (§3e).** I wrote "no blocker". I checked what the workflow does and did not ask what it
  leaves behind when it stops. That is question 2, the opposite act, on the failure path: anticipable, and mine.
  *(§3e's "no blocker" is superseded.)*
- **Her answers to the five points, which stand:** her two lines are in as written; the workflow does only the
  declared acts; the derived staff password is acceptable (an `OWNER` step is not a material discrepancy); **the
  session-pooler fallback does satisfy item 2** (only the transaction pooler could break a transaction-level lock,
  and that is tested; the reasoning goes in the report); E and the refresh answer are agreed.
- **One addition from the Chief Architect, same commit.** The page lists what remains on staging for a stop at each
  stage: the synthetic people L and E, in whatever state they had reached, are **left as they are and recorded**;
  they are the checkpoint's own rows and removing them is the product's path, not a clean-up.
- **Owed:** the fixed commit (it becomes the boundary commit), full pre-flight, CI and journeys on it, and Sharon's
  review of the clean-up delta.

### 3g · The clean-up fix is pushed; the boundary is frozen at it (13 Nov 2026, 04:23 UTC)

- **The fix:** `a33c852877686bdd54353c63dfcd995e1c902110` (one exit path that undoes the run's own acts on every stop
  and on success, reading staging and not the run's memory; suspensions in `try`/`finally`; each undo recorded, a
  failed undo recorded `FAILED` and the owner's; a recovery of SA's or PA's password recorded; what a stop leaves at
  each stage on the page). Pre-flight green (engineer's report).
- **What happened to its runs.** The engineer dispatched CI and journeys on it, then pushed a documentation commit
  (A2b's page and the report's skeleton, `63f27b3ed3fe8012958fc8ae862cb2b6c40072a1`) a minute later, as I had asked
  him to do after the push. The newer dispatch cancelled the first pair. **My sequencing caused that:** I should have
  said "after its runs finish".
- **The boundary commit is `a33c852877686bdd54353c63dfcd995e1c902110`, not the head.** A2b's design page is not part
  of the approved boundary, and the owner's instruction is that the pull request holds nothing unrelated.
- **So the boundary is frozen on its own branch:** `promote/4.1-staging-checkpoint`, created at that commit by the
  Chief Architect (an existing, pre-flighted commit; nothing new was pushed). The pull request will be from that
  branch. The work branch can move on without widening it.
- **CI and journeys dispatched on the frozen branch, for that exact commit,** by the Chief Architect at 04:23
  UTC. The run numbers are recorded at the next check.
- **Owed:** those two runs green; Sharon's review of the clean-up delta; then the read-only readings and the pull
  request.

### 3h · `a33c852877686bdd54353c63dfcd995e1c902110` is not the boundary commit: one last consolidated fix (13 Nov 2026, 04:57 UTC)

**Its runs, on the frozen branch.** CI `43365152777`: green. Journeys `43365156148`: job A green; **job B failed at
stack start, "failed to bind host port for 0.0.0.0:54322 … address already in use"**, before any migration or test.
That is the same failure as on 12 Nov, and **it happened with the port reservation in place.** So the reservation
(`b24d73ffd0e84b139a02fe26f52fa21c52a94a25`) did not remove it, and its stated cause is unproven. I queued the one
permitted re-run of that job.

**Sharon: her blocker is fixed; BLOCKED on two new small items** (her
`CHECKPOINT-CLEANUP-…a33c8528….md`, `claude/gracious-lamport-0m1qjr` at `4ac74cd1a602214d2a71acbf840f331792cd21f5`). Both pass the line I drew with the owner
(a fix only if it would damage staging or invalidate a result):
1. **A cancel or a timeout bypasses the clean-up** (damages staging: the scratch job is left firing). Fix: signal
   handlers for SIGINT and SIGTERM that go through the one exit path, **and** an `if: always()` step in the workflow
   that removes the scratch job and schema by name with `psql` and prints the catalogue read, because a kill cannot
   be caught.
2. **A recovery of SA's or PA's password changes a fingerprinted value** (invalidates a result: preservation line 44
   hashes each Auth user's password digest, so a declared act would trip the stop rule). Fix: `preservation.sql`
   takes a list of Auth user ids to leave out of lines 44 and 45 only; the "after" read is run twice, as is, and
   with the recovered accounts' ids from the record, where every line must be equal.
   - Her two notes, taken in the same commit: say on the page that an undone suspension leaves L with a class card
     nobody holds; delete the run details by job name before the unschedule.

**One more, from the Chief Architect's own read of the script (question 5: which build does it run against?).**
3. **Nothing checks that staging's app is serving the promoted build.** The app deploys to staging from `main` through
   Vercel's own connection, separately from `staging.yml`. Step A proves the *database* is at 244. Items 3, 4 and 6c
   then act through the *app's* routes. If that deployment is late or failed, they run against the older app on the
   newer database, and a result could differ for no real reason, or pass on code that is not the candidate
   (invalidates a result). Fix: the app stamps its commit on every audit row it writes (`build_sha`). **Right after
   the actors' sign-ins and before L is created, read the newest audit row those sign-ins wrote and require its
   `build_sha` to equal the commit the workflow was dispatched on.** Otherwise stop: nothing has been created yet.

**And the runner fault (not the script, but it blocks the boundary's evidence).**
4. Job B of the journeys starts its stack with no retry; CI's shared action has one. Give job B's stack start the
   same single retry, and correct the port fix's claim: the reservation is kept as harmless, but "the cause" is
   **not established.** Finding it is register item **CI-1**, before Z.

**To make this the last cycle (the owner's ruling on review before the push).** This list is the specification.
**Sharon is asked now, before anything is built, to add anything else she can see** in the script, the workflow or
the page. Second Eye builds to the combined list. The review after the push is then a confirmation against it.

**Sharon's final list (05:00 UTC; `CHECKPOINT-FINAL-LIST-a33c852877686bdd54353c63dfcd995e1c902110.md`,
`claude/gracious-lamport-0m1qjr` at `778a68bf6d8ab657b36614ed5df6c3ea24081ef5`). She read the script, the workflow and the page whole, with the
database functions the run calls. Her file is the specification; Second Eye builds to it, and her review after the
push confirms against it item by item.**
- Items 1 to 4 above stand, two sharpened: **item 2 also covers line 42** (a recovery sets `person_pins.reset_required`
  and the helper sets a new PIN; the exclusion carries the person id for line 42 and the Auth user id for 44 and 45);
  **item 1's `always()` step cannot reinstate S or L** (no session, and no direct write is allowed), so it lists any
  suspension left open with this run's note and fails the job; that repair is the owner's.
- **S1:** the app's build is checked again after the last step, and the workflow refuses if `main`'s head is not the
  dispatched commit.
- **S2:** an Auth rate limit is recorded `RETRY`, not `DIFFERS`, and stops through the exit path. The Chief Architect
  reads staging's rate-limit settings before dispatching.
- **S3:** step 1g unschedules the scratch job first, before any read.
- Read whole and found sound, not reopened at the confirmation: the step order; the health read; the lock test; 3.3b's
  effects; item 4's paths; a too-early dispatch stopping at A1.

**After the push:** the Chief Architect moves the frozen branch to that commit and dispatches its CI and journeys
there. The work branch is not pushed to until Second Eye's own runs on it have finished.

**For after the merge (recorded now so it is not found then).** If the owner merges by squash, as pull request 17
was, `main` gets a new commit. The Chief Architect then checks that `main`'s tree equals the boundary commit's tree
exactly, before anything else is read; and Second Eye restarts the work branch from `main` for the commits that are
not in the boundary (A2b's page and what follows).

### 3i · The decision: the promotion and the acting checks are separated (13 Nov 2026, 05:09 UTC). **This governs.**

**The owner (13 Nov):** retain `a33c852877686bdd54353c63dfcd995e1c902110` as the boundary; green CI and journeys on that
exact commit; Sharon's review; the read-only evidence; the pull request for his review; no merge without his
authorization; protect the runs; do not widen the checkpoint; no further changes to the verification workflow or to
how the team works until the checkpoint is closed. Then: *"do what you have to do to get positive result … do it
right, the first time."*

**Sharon's block on that commit is on the checkpoint script only** (the program that performs the acting checks
after the merge). She passed the migrations' evidence, the rollback file and the preservation query. So:

| Part | What | Carried by | Gate |
|---|---|---|---|
| **1 · The promotion** | The 20 migrations reach staging. Everything that only reads is verified: the migration count and digest; `pg_cron` installed and the two jobs once each; the health read; the triggers on `auth.users` and their definitions; the timeouts; the hook's time; preservation "before" and "after", taken minutes apart around the merge | **Pull request 1: `a33c852877686bdd54353c63dfcd995e1c902110`, exactly,** from `promote/4.1-staging-checkpoint` | The owner's merge |
| **2 · The acting checks** | Items 1 (the scratch job), 2 (the lock), 3 (Auth with a locked account), 4 (runtime writes to `auth`), 6c, and the restore rehearsal, with their own preservation "before" and "after" around the run | **Pull request 2: the corrected script, its workflow and its page only,** built to Sharon's final list, on a branch from `main` after part 1 | Sharon's confirmation against her list; pre-flight, CI and journeys on that exact commit; the owner's merge |

- **The script in pull request 1 is never dispatched.** Only the Chief Architect dispatches it, and he does not.
- **A2a is held until both parts have passed.**
- **Preservation is read in two pairs,** each pair minutes apart, so that use of staging between the parts cannot
  show up as a difference. Staging is left alone during each pair.
- **Dropped from the fix, by the owner's instruction on workflow changes:** the retry for the journeys' second job.
  The port fault's cause stays open as register item CI-1. **On hold until the checkpoint closes:** the red-case
  parallelisation.
- **Condition:** Sharon confirms in writing that her block does not bear on the promotion itself. If she says it
  does, this is withdrawn and the owner is told.

**Sharon's confirmation (05:11 UTC; `CHECKPOINT-SPLIT-CONFIRMATION-a33c852877686bdd54353c63dfcd995e1c902110.md`,
`claude/gracious-lamport-0m1qjr` at `8d68a5f9`):** her block concerns only dispatching the checkpoint script and
**does not bear on the promotion.** Pull request 1 at that commit, with read-only verification, is not blocked by
her. Four conditions:
1. **The script is made unrunnable, not merely left undispatched:** the workflow is disabled in Actions right after
   the merge, before anything else, and that is recorded in §4. *The Chief Architect has no tool that disables a
   workflow, so, as she requires, the owner is told before the merge: it is one action of his in the Actions page.*
2. The journeys re-run finishes green on that commit before the pull request is opened. A runner fault on the re-run
   is not a pass.
3. The read-only checks keep their stop rule. Two are material: `pg_cron` installed with both jobs once each and a
   clean health read; and the five triggers on `auth.users` with matching definitions.
4. Part 1 passes the promotion, not the checkpoint. A2a stays held until part 2's acting checks pass.

For part 2: its own preservation pair with a cutoff after part 1; its end-of-run build check compares against part
2's own commit.

**Before pull request 1 is opened, all of:** the journeys re-run green on `a33c852877686bdd54353c63dfcd995e1c902110`
(in progress; its stack started, the walk is running); Sharon's confirmation above. Already done: CI green on it;
scope against `main` (20 migrations, 213 files, no request file, no `supabase/config.toml`, a clean merge); no pull
request template in the repository; the read-only readings.

## 4 · Results

| Step | When (UTC) | Result |
|---|---|---|
| B2 · migration count, before the merge (read-only; one `select`) | 13 Nov 2026, 00:56 | `224`, `20270113160000`, `d11e89838ecb656c4ca5b06b18941316`: **as expected.** Staging is at 224 and its versions are the repository's first 224 |
| **First runs of the scheduled jobs** (§3d; `evidence/staging/first-runs.sql`, one read) | 13 Nov 2026, 03:10 | **The closer's first run will end and score 5 sittings, all past their deadline, all in synthetic test schools:** 4 in «Sekolah Uji Kinerja (sintetis)» (deadline 16 Oct; answers kept) and 1 in «Sekolah Uji Daisy 885» (deadline 8 Nov; no answers). **None in the demonstration school or any other school.** The retention job's first run removes nothing (its table is created empty). For the owner, with the pull request |
| B1 · preservation, **trial read** (the boundary's `preservation.sql` as committed; one `select`) | 13 Nov 2026, 05:05 | **It runs on staging's real data and completes.** Values in §4a. Staging holds 1,579 people, no suspension and no locked account; 5 sittings open, all 5 past their deadline (as the first-runs read said) |
| B1 · preservation **"before", the one that counts** | — | **Taken when the owner says he is about to merge,** not earlier: every line fingerprints existing rows, so any use of staging between "before" and "after" would show as a difference. Staging is left alone from that reading until the checkpoint ends |

### 4a · The trial preservation read (13 Nov 2026, 05:05 UTC; read-only)

| Line | Value |
|---|---|
| cutoff | `2026-11-13 05:05:52.809699+00` |
| audit_log watermark | `10675` |
| state · migrations | `224 / 20270113160000; versions digest d11e89838ecb656c4ca5b06b18941316` |
| state · pg_cron | `absent` |
| state · triggers on auth.users | `4: on_auth_user_created, pintar_card_email_guard, pintar_email_correction_guard, pintar_password_write_guard` |
| demo_roles | `4` |
| demo_results | `10` |
| demo_official | `10` |
| demo_certificates | `3` |
| demo_enrolments | `5` |
| demo_courses | `1` |
| demo_audit | `91 (6860)` |
| demo_people | `bd41b3c9605519cffb916d0352b5148d` |
| demo_accounts | `7deebf17f87ba3ee6bd192f776db01fb` |
| results_outside_tests | `ee7d9479ba2f9b7301a2a6899e5d6319` |
| official_outside_tests | `43f6cc69b6e8eee4854a46f88ebe0385` |
| certificates_outside_tests | `e428cb7fc08e301b0f96864bf0487ea4` |
| integrity_signals_outside_tests | `f6e7a4fa62ff7ff83d3e9cd7f36b76c7` |
| management_decisions_all | `d41d8cd98f00b204e9800998ecf8427e` |
| persons | `1579 4ff9a8e9c335eeb36501e8b532c8c76d` |
| person_usernames | `100 072a88136a241be4d483bbdbce1a1b72` |
| person_pins (without the hash) | `100 75532463e4f5b282c1b05b24b7e1762b` |
| accounts | `1579 36f959dc32161dbb310e640dcf1cbd2f` |
| auth users (id, email, locked, password digest) | `1579 9808cca705d476aa656784566961f5c2` |
| auth users locked | `0` |
| role_assignments | `99 c9e0d5c267798cb2e4974e829ea63a75` |
| person_suspensions | `0 d41d8cd98f00b204e9800998ecf8427e` |
| account_requests | `0 d41d8cd98f00b204e9800998ecf8427e` |
| enrollments | `1488 fe0fdb6c3202026eefa950d87dab84fd` |
| institutions | `27 40f65e668cb06bf743f3b7dc741e9d08` |
| org_nodes | `175 1c11a3cd3707a935d6b0e0b8f81534d1` |
| courses | `68 3aa3502ddcf4072be04c9b879c37db3e` |
| plp_releases | `57 f74cdf425da54c86527c8593ec470d3d` |
| items | `1388 ff2ffb825aabfdfc4fdd330da477b460` |
| item_options | `5552 56370fd89dddf0543052c1b1ee4a4226` |
| learning_assignments | `80 366c0b4108bf2460f994203ba6749b23` |
| assessment_assignments | `182 f046bf7fb4c6d740b54bf7bc3ea30cdd` |
| assessment_sessions ended at the cutoff | `1774 98de445e3f967fbfd6a212ecd034bd3a` |
| assessment_results | `1774 5b39b5f16438efc7ae6a5f44f4265e14` |
| official_results | `248 a5a87784bc98f9f91001646fa55ca119` |
| certificates | `66 550c32200cbbd51a54c9e6385f468165` |
| audit_log up to the watermark | `10421 4b9ec8c9379fd34f686097f8a70f0103` |
| sittings open at this read | `5 0b1e1907a0e719afad143fabf7317636` |
| of which past their deadline | `5` |
| closed by the schedule since the cutoff | `0 d41d8cd98f00b204e9800998ecf8427e` |

## 5 · Log

| When (UTC) | What |
|---|---|
| 12 Nov 2026, 22:00 | Owner's authorization recorded. Runbook written from Addendum 1 §5b and the 4.0 promotion pattern. Nothing done on staging |
| 12 Nov 2026, 22:06 | Owner's second instruction recorded: the pull request is explicitly authorized on six conditions; no staging mutation before the merge; Sharon must confirm the scratch-target restore |
| 12 Nov 2026, 22:08 | Sharon's reading of the six items recorded (§3a); it governs. The scratch-target restore is confirmed as satisfying §5b, with four conditions. Items 3 and 4 corrected |
| 12 Nov 2026, 22:08 | Sharon's explicit confirmation recorded: a scratch-target restore satisfies §5b item 5; five conditions; the known limit to be stated in the report. The owner's condition is met; nothing is escalated |
| 12 Nov 2026, 22:11 | Second Eye: the `audit_log` rewrite is migration 215, already on staging; it will be timed on the scratch copy. Recorded as a correction to §5b's text, for Sharon's review. Wording commit local at `049e21ad`, in pre-flight |
| 12 Nov 2026, 23:25 | Wording commit pushed by Second Eye (local `049e21ad`, full hash at the next check). Rollback, preservation query and rehearsal change built and round-trip-tested locally, not yet committed. Rulings on the page's open points recorded (§3b) |
| 13 Nov 2026, 00:56 | Evidence at `d8db82bde8d7a47e9936a34fd21686ca11adb472` read; Sharon PASS with two required lines. Gap found: the acting steps need credentials, so they run as a dispatched workflow, which must be in the boundary commit. One more commit owed. Migration count read on staging: 224, as expected |
| 13 Nov 2026, 01:18 | Owner: apply the five questions rigorously. Asked of the checkpoint itself (§3d): three more things owed in the boundary commit, chiefly a count of what each scheduled job's first run will act on in staging's existing data |
| 13 Nov 2026, 02:04 | Second Eye: boundary candidate local at `8b3e07a3e80e31298a88e5912de34cc528866599`, in pre-flight, not pushed. It carries the dispatched workflow `staging-checkpoint-41.yml` (dispatch from `main` only, typed confirmation, staging only, existing secrets, tested end to end locally), 6b as one select, `first-runs.sql`, Sharon's two lines. For Sharon: the staff password is derived from an existing secret and checked before use, else that step is the owner's; the "direct" lock test may fall back to the session pooler. For the Chief Architect's read on push: the uploaded record and screenshots hold no token, key or setting value (a local run once printed a local JWT secret; fixed before any push) |
| 13 Nov 2026, 03:10 | Boundary candidate pushed at `55e7eed9573d7396973b48665cd9d67a048da5bf` and read (§3e): no blocker. First-runs read on staging: 5 overdue sittings in two synthetic test schools will be ended and scored; none in the demonstration school. Waiting on its runs and Sharon's delta |
| 13 Nov 2026, 03:16 | Sharon BLOCKED the boundary candidate `55e7eed9573d7396973b48665cd9d67a048da5bf` on one item: no clean-up on a stop (the scratch job; the suspended teacher account). Her other five answers stand, including that the session-pooler fallback satisfies item 2. My "no blocker" corrected. Fix with Second Eye |
| 13 Nov 2026, 04:23 | Clean-up fix pushed at `a33c852877686bdd54353c63dfcd995e1c902110`. Boundary frozen at it on `promote/4.1-staging-checkpoint`; CI and journeys dispatched there by the Chief Architect, because the engineer's runs on that commit were cancelled by the next push. With Sharon for the clean-up delta |
| 13 Nov 2026, 04:57 | `a33c852877686bdd54353c63dfcd995e1c902110`: CI green; journeys job B failed again on the port, with the reservation in place (re-run queued). Sharon BLOCKED on two small items (cancel or timeout; password recovery against preservation). My read adds a third (the app's build is never checked). One consolidated fix specified (§3h); Sharon asked to add to it before the build |
| 13 Nov 2026, 05:00 | Sharon's final list recorded: her whole-script read, before any build. Second Eye builds to it in one commit |
| 13 Nov 2026, 05:06 | Preservation query run on staging as a trial (read-only): it completes; values in §4a. The "before" that counts is taken when the owner is about to merge, and staging is left alone from then until the checkpoint ends |
| 13 Nov 2026, 05:09 | Decision (§3i): the promotion goes as pull request 1 at `a33c852877686bdd54353c63dfcd995e1c902110` with read-only verification; the acting checks follow as pull request 2 with the corrected script. Sharon asked to confirm her block does not bear on the promotion |
| 13 Nov 2026, 05:11 | Sharon confirmed in writing: her block does not bear on the promotion. Four conditions recorded (§3i). Waiting only on the journeys re-run before pull request 1 is opened |
