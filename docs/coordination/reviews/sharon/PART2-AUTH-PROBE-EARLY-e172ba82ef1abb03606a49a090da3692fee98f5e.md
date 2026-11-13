# Part 2 · early read of the auth probe · `claude/part2-auth-probe` at `e172ba82ef1abb03606a49a090da3692fee98f5e`

Sharon, 13 Nov 2026 (09:10 UTC). Read-only. Both files read whole (`audit/staging/auth-probe-41.mjs`,
`.github/workflows/staging-auth-probe-41.yml`). Read against my ruling's rows 2 and 6, and against my two earlier
blocks on the big script (clean-up on stop; cancel and timeout).

## NO BLOCKER TO FREEZE

**One precondition on the dispatch, not on the code.** Before dispatching, Bob reads SA's and PA's set-up state
(`account_setup.state`) and `person_pins.reset_required`, read-only.
- Both must be complete, with no PIN reset owed.
- Otherwise the walks' helper `selesaikan()` may set a PIN or a username on an account that existed before the cutoff.
  That would change preservation lines 41 and 42, and fire the stop for a non-result.
- If either is not clean, do not dispatch. Pick another school, or bring it to me.

**Optional, not required:** record what `selesaikan()` did, in `hasil` (its return value is dropped today).

## My earlier blocks, in this script

- **The clean-up on stop:**
  - one exit (`selesai`) for a step that differs, a rate limit (`RETRY`), an error outside a step, SIGINT and SIGTERM;
  - acts are gated once a stop has begun;
  - the undo reads staging: it reinstates by this run's note, then removes L through the product as far as it can, and
    prints what is left by id.
- **Cancel and timeout:**
  - signal handlers;
  - an `always()` step that checks the URL is staging's before connecting, reads only, and reports any suspension of
    this run left open and L's state;
  - it fails the job if a suspension is open.
- **Main's head equals the dispatched commit;** it does not start while `staging.yml` runs. My S1 is met at the start.
- **The probe writes nothing directly.** Every act is through the app's routes, or a database function as the
  signed-in actor. No Admin API. Only a `sekolah-uji-` school, checked in both the workflow and the script.

## Against rows 2 and 6

- **Row 6(b):**
  - **suspended with no account:** P2, P3;
  - **a card through the app, locked at the first read:** P4;
  - **one right-PIN sign-in refused with the ordinary mismatch:** P5;
  - **reinstatement releases the account:** P6;
  - **clean-up through the product:** P8.
  - **P7 makes P5 conclusive.** The same card and PIN sign in once released, so P5's refusal was the lock, not a wrong
    PIN. That is the point of Bob's item 5 (GoTrue checks the lock before the credential).
  - P5 compares with the card contract's single answer (`401 CARD_NOT_MATCHED`), not with a live wrong-PIN attempt.
    That is acceptable: the contract gives one answer for both, the local suites prove it, and it spares an attempt.
- **Row 2:**
  - build: P1, and again at P9;
  - network origin: P7;
  - no recovery: P0 refuses rather than recovers;
  - the preservation pair: Bob's.

## Rulings on Bob's three points

1. **Two actors, by password, no recovery: accepted.** Only the platform admin may suspend. P0 stops if either
   password is not accepted.
2. **build_sha restated: accepted, as Bob words it:**
   - the app's audit rows carry the SHA of `main`'s head at dispatch;
   - that head differs from `40ca971f` only in the two files under `audit/` and `.github/` (show the diff's names);
   - `environment-facts` is green on that head immediately before the run.

   **The rows written by direct function calls carrying no build is acceptable.** Suspend, reinstate and end-enrolment
   reach the database through PostgREST, exactly as a screen's own call does, and the database's build is already
   proven (244, Part 1). The app's build matters only for acts through the app: P4's activation and P8's deletion,
   both covered by P9. They do not have to go through the app.
3. **The extra sign-in after reinstatement: accepted.** It strengthens "reinstatement releases the account", and it
   makes P5 conclusive. **No effect on preservation:** L and all of L's rows are created after the cutoff.

## Two things for the result read (not changes)

- If a stop falls between P3 and P4 (L suspended, no card yet), the clean-up reinstates L and ends the enrolment, but
  cannot sign L in to request the deletion. L is then left rostered, with the enrolment ended, no account, and not
  anonymised. That is synthetic, reported by id, and acceptable.
- A cancel signal gives the clean-up a few seconds before the runner kills it. If it is cut short, the `always()`
  step's report is the record. Also acceptable.
