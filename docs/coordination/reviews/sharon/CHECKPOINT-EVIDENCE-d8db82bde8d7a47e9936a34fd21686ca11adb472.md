# Staging checkpoint · review of the promotion evidence · `d8db82bde8d7a47e9936a34fd21686ca11adb472`

Sharon, 13 Nov 2026 (00:55 UTC). Read-only. Runbook step 3. On the work branch:
- `docs/completion-4.1/checkpoint/PROMOTION-PRECONDITIONS.md`;
- `ROLLBACK-225-244.sql` and its test record;
- `evidence/staging/preservation.sql`;
- the restore rehearsal's extension at `8f27ff256d27cf98a97e7a849c85597de59805c0` (`restore-rehearsal.yml`,
  `audit/restore/fakta.sql`).

Read against my `CHECKPOINT-RUNBOOK-c51e6d47….md` and `CHECKPOINT-ITEM5-152ecea9….md`.

## What holds now

- **PASS on the evidence.** The rollback file, the preservation query and the per-item checks meet my reading of
  §5b.
- The page's four open points are ruled below.
- Two lines are **required on the rollback's header and the page** (no code; below). They can ride in the boundary
  commit.
- Item 5: as confirmed, a scratch-target restore satisfies §5b item 5. The rehearsal's extension implements my
  conditions 2 to 4.
- Nothing here is a reason to stop. The runbook may go on to step 4 (the boundary commit's runs) and step 5 (the two
  read-only reads).

## The rollback file

**Verified:**
- It refuses unless the database holds exactly the 20 migrations after 224.
- It refuses if `cron.job` holds a job not named `pintar-*`.
- Each loss is counted in a notice before it happens.
- The migration rows are removed.
- PART 4 checks the result is 224 before the commit.
- It runs in one transaction and is never applied by a workflow.
- **Tested well:**
  - migra finds no difference, with privileges;
  - a 4,520-line catalogue fingerprint is identical on an empty copy and on a seeded one;
  - a full round trip 244 → 224 → 244 runs the whole suite green.

**F1-R1b's withdrawn rationales written back:** right for a rollback. 224 requires a rationale. The file stops before
any change if a text cannot be found.

**Open point 3: keeping `banned_until` (not turned back into `'infinity'`). Accepted.**
- `'infinity'` is the very value that made Auth fail every request for the user, which L-1 corrected.
- 224's `akun_kunci` only writes a lock and clears it to null, so the 2999 instant reads as a lock under 224 and
  clears the same way.
- A locked account stays locked and an unlocked one stays unlocked. Not a literal reverse, and right not to be.

**Required: two lines, on the header and on the page.**
1. **The database and the app go back together.** The script returns staging's **database** to 224. Staging's app is
   deployed from `main`, so a 244 app on a 224 database calls functions that no longer exist.
   - State that a rollback is paired with reverting the merge on `main` (the app back to 224's commit), and in which
     order.
   - Both are the owner's to decide.
2. **What a rollback re-opens.**
   - Under 224's code, these protections are gone:
     - L1-F4: an anonymised person can be reopened again (L1F4-A2), and that includes the checkpoint's own
       synthetic L;
     - L1-F2: a suspended person's new account is created open;
     - L1-R2: permits are not deleted at a lock.
   - State it, so that nobody approves a reopen or creates an account for a suspended or anonymised person on staging
     until 244 is applied again.

## The preservation query

**Accepted. It meets the cross-cutting requirement.**
- It fingerprints only rows that existed at the "before" read: by creation time up to a recorded cutoff, and
  `audit_log` by id up to a recorded watermark.
- So the checkpoint's own rows are outside both reads by construction, and no marker is needed.
- The same text reads at 224 and at 244, because it drops the 24 columns 225–244 add.
- Users are fingerprinted by whether they are locked, not by the stored instant (233's rewrite).
- Sittings still open are on their own lines, because the scheduled closure is A1's purpose.
- Tested across a real local 224 → 244 promotion: every preserved line equal, and rows made after the cutoff outside
  it.

**One thing to watch, not a change:** lines 40–62 hash whole rows with `to_jsonb`. If staging's own data makes any
migration from 225 to 244 touch an existing row in a fingerprinted column, the "after" read differs, and that is
correctly a stop. The seeded test cannot prove staging's data is like the seed. If it happens: stop, record which line,
and bring it to me. Do not explain it away on staging.

## The six items: the page against my reading

| Item | Finding |
|---|---|
| A · the promotion | Count and versions digest, before (224) and after (244). `pg_cron` present, or stop |
| 1 · scheduler | Jobs exactly once, schedule, command, role, UTC; the health read clean; run history. The committing-procedure proof is in a scratch schema with a non-`pintar-*` name, declared statement by statement, run locally first (`succeeded`, rows 1 and 2 in order, `0 0 0 0` after the clean-up). As I asked |
| 2 · locks | Two connections, through the pooler (6543) and direct, `false` then `true`. The API path stated as reasoning, with no function added. The timeouts read for the five roles, and the constraint A2a must design to stated. As I asked |
| 3 · Auth | The five triggers and the link lock, with definition md5s equal to the repository's. **The insert path:** a synthetic learner L, rostered, suspended, then given a class card. The account must be locked at the first read. Using a class card because a staff person is never "suspended with no account" is correct reasoning. The reissue while locked keeps the lock. Card sign-in is compared field by field with a wrong PIN, refresh is refused with `user_banned`, and reinstatement releases |
| 4 · `auth` writes | The privilege read for both definers' owner. **L is removed by the product's own path:** enrolment ended, then L's own deletion request and closure, then `hapus_data_pribadi`, checked table by table. The Admin API is never used. As I asked |
| 5 · restore | The rehearsal on a scratch copy. It gives the copy `pg_cron` if needed (recorded), runs the installer twice (each job exactly once both times), checks the health read, and compares the named facts and the accountability tables. The known limit is stated in the report |
| 6 · headers | The origin read from L's sign-in row. The hook timed in the database (200 calls) and the endpoint timed as L (50 calls, p50 and p95) |

The rows list (§4) is complete as far as I can check. Each row is created after the cutoff, and L stays anonymised and
terminal.

## Rulings on the four open points

**1 · Password sign-in and PIN recovery for a locked account (3.3b).**
- **Password: option (a).** Use an existing synthetic **staff** account whose password the operator holds. Not a
  platform administrator. PA suspends it, the two sign-ins run, PA reinstates it.
  - **Both sign-ins while locked:** the right password and a wrong one. The two answers are compared field by field.
  - This is the hosted step that matters: GoTrue's password grant on a locked user.
  - Preservation is unaffected: line 44 reads "locked or not", the password digest and the email, and none of them
    changes.
  - The suspension ends that account's live sessions. That is expected, and `auth.sessions` is not fingerprinted.
- **PIN recovery: option (c), skipped, with this reason recorded.**
  - PIN recovery is decided in the database (`recovery_attempt`), with no hosted Auth step before the PIN check, so
    it behaves as it does locally, where L-1's tests prove it.
  - A wrong-PIN attempt would add failures to that account's recovery ladder, which reinstatement does not clear.

**2 · D1's budget.**
- **(a) Accepted:** 6b runs before the merge, in a read-only transaction. It writes nothing. If the hook tried to write,
  the read-only transaction would refuse it, and that would itself be worth recording.
- **(b) For this checkpoint:**
  - the hook in the database (6b) passes at **p95 ≤ 1 ms with no window active**, before and after, and **after
    ≤ before + 0.5 ms**;
  - 6c (the endpoint as L) is recorded, not gated: it is dominated by the network.
  - The hook's cost **with a window active** is A2a's to measure, against the same figure, in its own acceptance.

**3 · `banned_until` in the rollback:** accepted, above.

**4 · The rewrite timing on the copy: confirmed.**
- Migration 215 is already on staging, so the promotion cannot time it.
- What item 5 needs is the time production will take, and production does not yet have 215.
- Timing the column and its two indexes on the copy, in a rolled-back transaction, with `audit_log`'s row count, is
  the right measure. That corrects §5b's wording, as runbook §3a records.

## The four questions

- **And then what?** After the merge, the checks run in the page's order. Any material discrepancy stops everything
  and holds.
- **What else did that change?** On staging: only the declared acts (one scratch job, one advisory lock, the synthetic
  people's lives through the product). On the copy: the rehearsal's writes, discarded with the runner.
- **What happens when things go wrong?**
  - The rollback exists, is tested, and refuses a database it does not recognise.
  - The physical backup remains the recovery point for data.
  - The two required lines make sure a rollback is complete (app and database) and safe while it stands.
- **Can it be reversed, and what survives?**
  - Every act except L's anonymisation is reversed or removed.
  - L stays anonymised, by design.
  - The audit and accountability rows of the checkpoint survive, as records should.
