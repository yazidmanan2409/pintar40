# A3 · pre-build review: N-4, N-5, the lock order, ruling 42's recovery rule, the D12 codes

Sharon, 16 Nov 2026 (22:40 UTC). Read-only.

**What I read, all on A2b's refrozen candidate `ac25e9b14d51928f6991f8932b3bb572a262c096`:**
- `may_start_assessment`'s attempt count (20270113140000), its lock in `start_learning_session` (20270112120000:31–40), and F37-R01 (`2b09421d399ba1446fcbf840656f75ecdadf7505`);
- `SCOPE-REGISTER.md:255`;
- Second Eye's pre-build note, as sent to me.

## What holds now

- **One new blocker for A3's start path, N-5.** The attempt-limit lock does not cover what the count counts.
- **The lock order is accepted, with two conditions** (§3).
- **I agree with ruling 42's recovery rule, with three conditions** (§4).
- **The D12 codes are accepted, with one condition** (§5).
- **N-4 is restated here,** as ten red cases.

## 1 · N-4: my ten further red cases

- **My original review is not on any branch I can read either.** `SCOPE-REGISTER.md:255` cites it as `1f7b6fc2`. That short id is *also* the prefix of SI-D02's commit `1f7b6fc2a4554ecdb5db615c1201bbd9b9928276`, which is exactly why full SHAs are the rule.
- I restate the cases below from the register's summary of my five gaps: device identity from verified claims, the generation decided by the server, final-answer selection across generations, the boundary list, and the lock order. **This list supersedes the lost text.**

1. **Device identity:** a device id or label passed as a parameter is ignored. Identity comes only from verified JWT claims. A forged parameter recovers nothing.
2. **Generation:**
   - a generation number sent by the client is ignored, because the server assigns it;
   - after a recovery, every write from the superseded generation is refused, including answers, pause, resume and submit.
3. **Final answer across generations:** an answer recorded by the old device after the recovery committed never counts. An item answered on both devices takes the current generation's answer. Assert the scored result, not only the row.
4. **Nothing to recover:** a FINALIZED, submitted, expired or terminated sitting gives RECOVERY_NOTHING, and nothing is written.
5. **Teacher authorisation for Uji Penguasaan:**
   - it is used once (RECOVERY_AUTHORISATION_USED);
   - it expires (RECOVERY_AUTHORISATION_EXPIRED);
   - it is bound to that sitting and that learner, so it cannot be used on another sitting or by another learner;
   - a low-stakes self-recovery never applies to an Uji Penguasaan.
6. **What a recovery preserves:** the original deadline (with no extension), the accepted answers, and the attempt count. A recovery is not a new attempt.
7. **Concurrent acts on one sitting are serialised:**
   - recovery against submit, recovery against recovery, and recovery against an emergency stop's marking;
   - each has exactly one outcome, asserted by the row's final state, in both orders.
8. **Maintenance (ruling 42):**
   - allowed in a work-scoped planned window for a sitting that window drains (`maintenance_draining_di`);
   - refused for the same learner's sitting in a class the window does not cover, if that sitting is not draining;
   - refused in a platform-wide window and in an emergency (D10).
9. **Who may recover:** a non-controller, another school's staff, and another learner are all refused. An unknown sitting id is refused **with the same code** as a sitting the caller does not control (§5).
10. **The trail:**
    - every recovery, and every refused authorisation, writes an audit row with the actor and the generation, from and to;
    - the superseded device gets a stated "continued on another device" state, not an error page, checked against the built app.

## 2 · N-5: the SI-D02 stronger race. The lock key is narrower than the count (blocker for A3's start path).

- **F37-R01's stronger form** (`2b09421d`) is right for what it tests. A commits, B waits, then B is refused ATTEMPT_LIMIT_REACHED, and the count is asserted. The structural check puts the lock before the count. **I accept that.**
- **But the count changed after the lock was set.** The lock is `pg_advisory_xact_lock(hash('start_learning_session:' || person || ':' || assignment))`, which is per learner and per assignment.
  - Since 20270113140000 (owner rulings, 9 and 10 Nov), `may_start` counts the learner's sittings of **the same definition and version, under any assignment, in the same school and school year**.
  - So two concurrent starts on **two different OPEN assignments of the same assessment** take different locks. Each counts the other as not yet committed, and both can insert.
  - **That is two attempts against a limit of one.** It can happen when the same assessment is given to two groups the learner belongs to, or when a reassignment leaves the earlier assignment open.
- **Required, in A3 or before it:**
  - **The key must match the count's scope.** Key the lock on (person, definition, version). A school-year qualifier is optional, since it only narrows the key.
  - **A red-first case:** two connections starting two OPEN assignments of one definition. The second is refused, and the learner holds exactly `attempt_limit` sittings.
  - **Extend the structural check:** the lock's key names the definition, not the assignment.
- *Could reasonably have been anticipated (Q4, before and after):* when F2 and ruling 1 widened the count, nobody re-read the lock that guards it. I reviewed both changes and missed it too.

## 3 · The lock order: accepted, with two conditions

- **Learner and staff boundaries:** person FOR KEY SHARE, then the emergency fence shared, then the sitting FOR UPDATE, then the controller check, then A1's gate. **This is consistent with A2A-L01:** persons (1) before FENCE (7) before `assessment_sessions` (9).
- **The start path:** person, then fence, then the advisory lock (re-keyed per N-5), then the assignment FOR SHARE, then the new sitting.
- **Condition 1:**
  - **no lock of a lower rank after the sitting row lock.** In particular A1's gate and the controller check must only read `maintenance_windows` (8), `accounts`, `password_write_permits` and the persons, never lock them;
  - **the advisory key and `assessment_assignments`** get their place in A2A-L01's ranks and committed report, so the enumeration test can see them.
- **Condition 2: D5's sweep, which I endorse.**
  - It must cover every function that reads and then updates a sitting: `terminate_session`, `extend_session_deadline` and `finalize_session` (which lock only the person), and `submit_session`, `pause_session`, `resume_session` and `percobaan_tandai` (which lock nothing).
  - Each takes the sitting FOR UPDATE in this order, and the enumeration test fails on any new writer that does not.

## 4 · Ruling 42's recovery rule: I agree, with three conditions

**The rule:** a recovery of a draining sitting is allowed in a work-scoped planned window, and refused in a platform-wide window and in an emergency.

1. **It is read through `maintenance_draining_di(person, window)`,** per window and per place, not through the person-wide `maintenance_draining`. D15's pin keeps the latter for its one caller.
2. **A recovery during a window changes nothing that maintenance relies on.**
   - No deadline extension.
   - The sitting stays in its place.
   - It is not counted as a new start, so no maintenance start refusal applies, and it does not create a sitting.
3. **The emergency check is read under the shared fence,** the same instant as A2a. So a stop that commits first wins, and the recovery is then refused.

## 5 · The D12 codes (PR170): accepted, with one condition

- **The codes:** SITTING_NOT_CONTROLLER, RECOVERY_NOT_AUTHORISED, RECOVERY_AUTHORISATION_EXPIRED, RECOVERY_AUTHORISATION_USED, and RECOVERY_NOTHING.
- **The condition: there must be no existence oracle.**
  - An unknown sitting id, and a sitting the caller does not control, both answer SITTING_NOT_CONTROLLER.
  - RECOVERY_NOTHING and the authorisation codes are given only after the controller check has passed.
- The words are Daisy's.

## Addendum, 22:50 UTC: Second Eye's risk list (via Bob)

- **Agreed, and added as red case 11: a null `sesi_saya()` must refuse.** On a card sign-in or a shared-computer sign-in, `sesi_saya()` can come back null. Every recovery and controller boundary must then refuse with SITTING_NOT_CONTROLLER. It must never treat null as "no other device, so allowed". This is the same fail-closed principle as S-1 and A2B-R3.
- **The 20 writer functions, 7 of them with no row lock,** are covered by D5's sweep and the enumeration test (§3, condition 2).
- **The 9 plants and 5 `ci.yml` anchors to re-aim:** each is re-aimed with its defect unchanged and shown red, as A2b's 3g, 3h and 3i were. None may be loosened to make it pass.
