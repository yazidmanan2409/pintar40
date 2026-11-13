# Staging checkpoint · the boundary candidate's delta · `55e7eed9573d7396973b48665cd9d67a048da5bf`

Sharon, 13 Nov 2026 (03:45 UTC). Read-only. The delta on `d8db82bde8d7a47e9936a34fd21686ca11adb472` (which passed):
- `8b3e07a3…` and `55e7eed9…`;
- `.github/workflows/staging-checkpoint-41.yml`, `audit/staging/checkpoint-41.mjs`;
- the rollback header and the page.

Bob's read: `STAGING-CHECKPOINT-BEFORE-A2A.md` §3c to §3e at `bc419736…`.

## What holds now

- **BLOCKED on one item: the clean-up must run when the workflow stops.** The fix is small, in the script. Everything
  else is verified, and Bob's five questions are answered below.
- **Answer 4, plainly: the session-pooler fallback for "direct" does satisfy item 2.** It is not a stop for the owner.
- My next review is a delta on the fixed commit, of the clean-up only.

## The blocker (could reasonably have been anticipated: Q2, the opposite act on the failure path)

The script stops at the first difference by `process.exit(1)` inside `langkah`. Two steps act on staging and are only
undone by a **later** step. On a stop, those later steps never run.

1. **Item 1's scratch job.**
   - 1e creates schema `uji_cron_41` and schedules `uji-41-prosedur-komit` **every minute**. Only 1g unschedules and
     drops them.
   - If 1f stops, the job is left firing every minute on staging, with its schema. 1f stops if the run fails, does
     not run within five minutes, or **fails because of transaction control**, which is the very case the item exists
     to find.
   - Under the owner's stop rule nothing is then repaired on staging without the owner. So the most informative
     negative result would itself leave an undeclared standing act that needs the owner to remove.
2. **The staff account S in 3.3b.**
   - `tangguhkan(sid)` suspends a Golden School teacher whom other staging walks use. `pulihkan(sid)` runs before the
     comparisons, which is right.
   - But if `rute()` throws between the two (a network error, a timeout), the run stops with S still suspended.
   - The same holds for L in 3.5. L is synthetic and the record says so, but S is shared.

**The fix:**
- **One exit path that undoes what was done**, run on every stop and on success:
  - if `hasil.ids.jobid` is set and 1g has not completed: `cron.unschedule`, delete its run details, and
    `drop schema uji_cron_41 cascade`;
  - if S (or L) was suspended by this run and not reinstated: reinstate them through the same function.
  - Record each undo in `checkpoint-41.json`, with the catalogue read `0 0 0 0` after it.
- **Put `tangguhkan` and `pulihkan` in `try`/`finally`** in 3.3b and 3.5.
- **The undo does not make the stop a pass.** The step that differed still stops the checkpoint. The undo only means
  the stop leaves staging as the checkpoint found it, apart from the recorded synthetic rows.
- **Test it locally** (`CHECKPOINT_LOCAL=1`): force 1f to fail, and show the job and schema gone afterwards. Force a
  throw between `tangguhkan` and `pulihkan`, and show S reinstated.

## Bob's five questions

**1 · My two required lines: confirmed.**
- They are on the rollback's header as I wrote them.
- The order is stated: revert the merge, wait for the app at 224, then run the script. The interval is named, and both
  steps are the owner's.
- What a rollback re-opens names L and E.
- The page carries the same.

**2 · The workflow: confirmed, apart from the blocker.**
- It is dispatched only, runs only on `main`, and needs a typed confirmation.
- It refuses while `staging.yml` has an unfinished run, and shares its concurrency group.
- Before anything connects, it checks that the database URL and the Supabase URL name staging and not production, and
  that the origin is `staging.pintarselalu.com`.
- It reads staging's public key only, not the service key, and no Admin API is used for a person's act.
- **The only direct writes** are item 1's scratch DDL and job and item 2's advisory lock, as declared.
- **The page's order:** A, 1, 2, 3, 6, 4. It **stops at the first difference.**
- `OWNER` and `RECORDED` verdicts continue, as designed.
- It uploads only `checkpoint-41.json`, passed through the redaction.
- *Note (non-blocking):* the key lookup uses the management token with `reveal=true` and keeps only the anon key. The
  management API has no narrower call for this, and the service key is never put in the environment. Acceptable.

**3 · The staff password derived from an existing secret: acceptable for item 3.**
- It is derived as every staging walk derives it, masked, and tried **live first**. If it does not sign S in, the step
  records `OWNER` and changes nothing: no reset, no new credential.
- `OWNER` is not a material discrepancy. It is a gap in item 3's password method that the owner runs or waives, with
  the pull request.
- The check also refuses if S holds a platform role, as I ruled.

**4 · "Direct" falling back to the session pooler: it proves item 2. Not a stop.**
- What A2a's fence needs: a transaction-level advisory lock excludes other sessions for exactly its transaction.
- The only thing that can break that is a proxy that multiplexes transactions, which is the **transaction pooler**
  (6543), and that is tested.
- The **session pooler** gives each client its own server connection for the whole session. For transactions and
  their locks it behaves exactly as a direct connection; the semantics are Postgres's own.
- So the fallback proves what "direct" was there to prove. Record it as the script does
  (`directUnreachable`, then the session pooler `f then t`), with this reasoning in the verification report.

**5 · The two additions.**
- **E, a second synthetic person with an email account: agreed, and it corrects my own reading.**
  - `hapus_data_pribadi` rewrites and deletes Auth's rows only for an **EMAIL** account. A class card's address is the
    card's.
  - So removing L alone would not have exercised item 4's writes, though I said it would.
  - That is my defect in the reading: anticipable, Q1 (what does the deletion write for this account kind). E is the
    right fix.
- **A refresh on a locked account accepting `user_banned` or `refresh_token_not_found`: agreed.**
  - `akun_kunci` ends the person's sessions (`sesi_akhiri_orang`), so the refresh token is gone before Auth could
    check the ban.
  - Either answer is a refusal with no new session, and `refresh_token_not_found` is the stronger state, since the
    token no longer exists.
  - §5b item 3's "user_banned returned" is therefore met by design for refresh, and the report records which code was
    seen.
  - The check that no access token is returned is the one that matters, and it is there.

## The four questions

- **And then what?** After the fix, Bob dispatches the workflow after the merge. It runs the declared acts and stops at
  the first difference, leaving staging as it found it apart from the recorded synthetic rows.
- **What else did that change?** On staging: only the declared acts. Two synthetic people (L, E) remain, anonymised and
  terminal.
- **What happens when things go wrong?** That is the blocker. Today a stop can leave a scheduled job firing, or S
  suspended. After the fix, the exit path undoes both and records it.
- **Can it be reversed, and what survives?**
  - Everything but L's and E's anonymisation is reversed or removed.
  - The record (`checkpoint-41.json`), the audit rows and the accountability rows survive.

## Anticipation marking (the owner's principle)

| Defect | Anticipable? | Question |
|---|---|---|
| No clean-up on a stop after 1e and in 3.3b and 3.5 | Yes | Q2 (the opposite act, on the failure path) |
| My reading said L's removal exercises item 4's writes; for a class card it does not (found by Second Eye) | Yes | Q1 |
