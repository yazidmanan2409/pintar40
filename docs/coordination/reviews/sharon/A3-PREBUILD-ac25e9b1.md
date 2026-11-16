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

## Addendum, 23:00 UTC: N-5 proven red, and §5 clarified

- **N-5 is red on `ac25e9b1`:** F37-R02, local `38505a44` on `claude/a3`. Two OPEN assignments of one definition, on real connections: B completed while A held, both committed, and the learner holds 2 sittings against a limit of 1. **That confirms the blocker.** The fix is a later product commit, as specified in §2.
- **§5 is clarified. Second Eye's reading is right, and this replaces my wording.** "After the controller check" should have read **"after the ownership check"**:
  1. **First, the ownership check.**
     - **For the learner:** the caller is the sitting's learner.
     - **For staff authorising a recovery:** the caller may manage the sitting's place, under the school's authority rule, which is the same one that governs managing sittings today.
  2. **An unknown id, another learner's sitting, or a sitting outside the staff member's authority** all answer SITTING_NOT_CONTROLLER.
  3. **RECOVERY_NOTHING and the authorisation codes appear only for a sitting that passed (1).**
  4. **On every other learner boundary** (answer, pause, resume, submit, item view), a session of the same learner that is not the current controller answers SITTING_NOT_CONTROLLER.

## Addendum, 23:15 UTC: the N-5 fix (local, reviewed as text) and the `minta_percobaan` sibling

**The N-5 fix** (`claude/a3`, local: `38505a44` the red test, `cd5b37c3` the product, `cff03c26` the pins): **accepted on the text.**
- **The lock key** is (learner, definition, version), and it stays first, before the assignment FOR SHARE and before the count.
- **The structural check** asserts four things:
  - the key names the definition and version;
  - no lock keyed by the assignment remains;
  - the lock comes first;
  - A2b's start-path refusals are kept.
- **F37-R02 is red then green, and F37 passes 40/0.**
- **One condition: the key is read without a lock, and that is safe only if it cannot change.** Pin it with a test that an assignment's `assessment_definition_id` and a definition's `version` cannot be updated once the definition can be sat: a trigger, or `assessment_definitions_taught_immutable` asserted to cover both. Otherwise a later writer could silently reopen N-5.
- When the branch is pushed, I diff `cd5b37c3` against the text: only migration 20270121200000.

**The sibling, `minta_percobaan`, which keys its lock and its grant count per (learner, assignment): register it for Z, not A3.**
- It creates no sitting, and each extra attempt is a deliberate staff approval, so it is not a race past the limit.
- **Case (b) is conservative.** A grant on assignment X does not raise the allowance for a start through Y, so a learner can be refused when one might expect a start. It never grants more than was approved.
- **Case (a)** is two approvals for two assignments. That is two staff decisions, not a bypass.
- **For Z:** the grant should share the count's scope, (definition, version). Add a test that one approval adds exactly one attempt, whichever assignment the learner starts through. *Could reasonably have been anticipated (Q2, the neighbouring act):* it is the same scope widening as N-5.

## Addendum, 23:30 UTC: my immutability condition was wrong, as Second Eye found. A simpler fix.

- **Second Eye is right.**
  - A definition's `version` is immutable once the definition can be sat (INV-04).
  - **But an assignment's `assessment_definition_id` is not.** `move_learning_assignment_release` and C1w's `koreksi_kunci_pindah` change it by design, under the learning assignment FOR UPDATE, then the assignment row.
  - So my condition, as written, would fail by design. **It is withdrawn,** superseded here.
- **The gap is real:** the key is read without a lock, then the advisory lock is taken, then the assignment FOR SHARE. A move that commits between the read and the share lock leaves the start holding the old key while the count uses the new one.
- **My ruling: take the assignment FOR SHARE first, then read the key, then the advisory lock.** That replaces both of Second Eye's options (a second advisory lock, or a retryable refusal).
  - **The order on the start path:** person FOR KEY SHARE, then the fence (shared), then `assessment_assignments` FOR SHARE, then the key read under that lock, then the advisory lock (definition, version), then the count, then the new sitting.
  - **No gap:** while the share lock is held, no move can commit, so the key the start locks is the key it counts.
  - **No deadlock:**
    - two starts take compatible share locks and then serialise on the advisory key;
    - a move or «Akhiri penugasan» waits for the share lock, and neither takes the advisory lock;
    - a start never waits on an assignment while it holds an advisory key.
  - **It changes the order ruled at 22:40 (§3).** "Advisory before the assignment" becomes "the assignment, then the advisory". The ranks in A2A-L01 are recorded so.
- **The tests:**
  - INV-04 asserted for `version`;
  - **F37-R03, on real connections:** start A holds after the share lock; a key correction (`koreksi_kunci_pindah`) on the same assignment **waits** until A ends, then commits; the next start takes the new key;
  - the structural check: the share lock comes before the key read and the advisory lock, and the advisory lock comes before the count;
  - **a deadlock check:** two starts on two assignments of one definition, plus «Akhiri penugasan» on one of them, all at once. All finish, with no deadlock error.
- **Second Eye's question,** whether a corrected key's new revision counts the old revision's sittings, **is a product rule, not mine.**
  - Under ruling 1's text ("a new version … brings its own allowance") a correction gives a fresh attempt.
  - Whether a key *correction* should count as a "new version" for attempts is Bob's or the owner's to rule.
  - F37-R03 as above does not depend on the answer.

## Addendum, 23:50 UTC: how a corrected revision links to its original (Bob's question)

**What I read, on `ac25e9b14d51928f6991f8932b3bb572a262c096`:** `koreksi_kunci_pindah` and `tegaskan_koreksi_kunci` (20270115110000), and `salin_kursus_revisi` (20270115100000). I also searched the schema for lineage columns.

**The facts:**
1. **Lineage lives at the course level.**
   - `courses.supersedes_course_id` chains each revision to the one it replaces (20260915120000).
   - `modules.supersedes_module_id` does the same for chapters, and `items.supersedes_item_id` for questions.
   - Key corrections are grouped by `key_corrections.line_root_course_id`.
2. **An assessment definition has no lineage column.** `salin_kursus_revisi` inserts a **new definition row**, with a new id, for each definition of the course.
   - It sets the new definition's `course_id` or `module_id` to the new revision's.
   - It sets `version` to the highest existing `version` plus 1, among definitions with the same institution, title and mode.
   - So the link to the original is implicit: the course or module chain, plus the same title and mode.
3. **The consequence, wider than key corrections.** Today's count, per (definition id, version), gives a fresh allowance after **every** course revision made by `salin_kursus_revisi`, not only after a key correction.
   - So the owner's question is really: *does any revision of an assessment re-open it?*
   - Ruling 1's text ("a new version … brings its own allowance") currently says yes.

**What the key would be, if the owner rules "count across revisions": add an explicit lineage, not a derived one.**
- **A new column, `assessment_definitions.lineage_root_definition_id`,** NOT NULL and immutable once set.
  - `salin_kursus_revisi` sets it to the source definition's root.
  - A new definition is its own root.
  - Existing rows are backfilled from the course or module chain plus title and mode. The migration then verifies that every non-root revision found **exactly one** predecessor, or it refuses.
- **The lock key and `may_start`'s count both use (person, `lineage_root_definition_id`),** within the school and the school year, as ruled on 10 Nov.
- **Why not derive it at run time from title and mode:**
  - a renamed title breaks the line, and the learner gets a fresh attempt;
  - two unrelated definitions with one title merge, and the learner is wrongly refused;
  - and a recursive walk would have to run under the lock.
  - An explicit, immutable root avoids all three. Because it never changes, it is also safe to read under the assignment's share lock, as ruled above.
- **The tests:**
  - **red first:** a learner who sat revision 1 is refused on the corrected revision 2 once the limit is reached;
  - **a race:** two starts, on assignments of revisions 1 and 2, serialise on the one key;
  - **the backfill check:** each revision maps to exactly one root;
  - **no fresh attempt after a revision** (if the owner rules that way).

**Held, as Bob ruled, until the owner answers:** the N-5 re-key's columns.
- If the owner keeps ruling 1 as written, the key stays (person, definition, version), with the share-lock order above.
- If he rules "count across revisions", the key becomes (person, `lineage_root_definition_id`).

## Addendum, 17 Nov 2026 00:05 UTC: my share-first order deadlocks (F37-R04 red). Second Eye's correction accepted.

- **My 23:30 no-deadlock argument was incomplete,** and it is superseded here.
  - I covered "no start waits on an assignment while it holds a key", but not the reverse: a start waits on a key while it holds an assignment.
  - I also missed that **the sitting insert's foreign key takes `learning_assignments` FOR KEY SHARE.**
- **The cycle F37-R04 shows,** with assignments 1 and 2 of one definition under one learning assignment:
  - A holds the advisory key and goes on to the insert, which needs the learning assignment's KEY SHARE;
  - «Akhiri» holds the learning assignment FOR UPDATE and waits for assessment assignment 2;
  - B holds assessment assignment 2 FOR SHARE and waits for A's key.
  - On `ac25e9b1`'s order it is green, so the share-first order introduces it.
  - *Could reasonably have been anticipated (Q3, the locks):* foreign-key KEY SHARE locks count, as A2A-L01 already says, and I did not include them.
- **Ruling: build Second Eye's order.** The start path becomes:
  1. the person, FOR KEY SHARE;
  2. the fence, shared;
  3. **`learning_assignments` FOR KEY SHARE,** the assignment's own row, when it has one;
  4. `assessment_assignments` FOR SHARE;
  5. the key read;
  6. the advisory lock (learner, definition, version);
  7. the count;
  8. the sitting.
- **Why it holds:**
  - The start now takes the two assignments in the same order as «Akhiri» and both moves: learning first, then assessment.
  - The insert's KEY SHARE is already held, so a start never waits for the learning assignment while holding anything later in the order.
  - Every wait is towards a later lock, so there is no cycle.
  - The key is still read under the assignment's share lock, so F37-R03 holds.
- **The NOWAIT alternative is rejected:** staff would see an error in a race the right order avoids.
- **For A2A-L01's ranks:** the fence, then `learning_assignments`, then `assessment_assignments`, then the advisory key, then `assessment_sessions`.
  - The enumeration test asserts that every writer touching these follows this order.
  - That includes `akhiri_penugasan`, `move_learning_assignment_release` and `koreksi_kunci_pindah`.
- **Required:**
  - F37-R04 is green on the new order, and still red on `eaa37aea`'s;
  - F37-R01 to R03 stay green;
  - INV-04 is asserted.
- The key's columns remain held, as Bob ruled, for the owner's attempt-rule answer.

## Addendum, 17 Nov 00:20 UTC: the A2A-L01 ranks for the two assignment tables. Ruling: (b), with one piece of evidence.

- **The order is built:** `aed35103`, local, with F37-R01 to R04 and A3-R1V green (F37 43/0) and R04 red on `eaa37aea`. **Accepted.**
- **Ranking the two tables after the fence** puts 23 distinct violations into nine existing functions (`akhiri_penugasan`, both moves, `tegaskan_koreksi_kunci`, `assign_release`, `minta_percobaan`, and the start itself through the insert's foreign keys).
  - They exist today. They were only invisible because the tables were unranked.
  - Most are `persons` taken **after** an assignment or a sitting.
- **Ruling: (b) for A3.**
  - The two tables stay unranked in L01, and a **dedicated pairwise check** is added:
    - every function that locks both takes `learning_assignments` before `assessment_assignments`;
    - no start holds an assessment assignment while it waits on a learning assignment.
  - F37-R04 is the behavioural proof.
  - **(a)**, reordering those functions to persons, then the fence, then learning, then assessment, **is registered for Z.** It is outside A3's boundary list.
- **The condition for (b), required before A3's page is accepted: prove the persons-after waits cannot deadlock.**
  - Each of them is `FOR KEY SHARE` on `persons`, and KEY SHARE conflicts only with `FOR UPDATE`, a DELETE, or an update of a key column.
  - **Required:** a catalogue sweep listing every function that takes `persons` FOR UPDATE, deletes a `persons` row, or updates its key, with what it holds at that moment.
  - **If there are none,** the 23 are harmless now, and that goes on record with the sweep's output.
  - **If there is one** that can also wait on a sitting or an assignment (an account departure, for example), that pair is a real deadlock. It then gets a red test in A3, not a Z item.
  - *Could reasonably have been anticipated (Q3, the locks):* L01 ranks by table, not by lock strength, so an unranked table hides waits that a strength-aware reading would check.

## Addendum, 17 Nov 00:35 UTC: the sweep, A3-L1P and F37-R05 (local `8861ffc3`, reviewed as text). The condition is met.

- **The sweep found 17 functions that take `persons` FOR UPDATE.** Each takes it **first, holding nothing else.**
  - None of them locks an assignment.
  - Three of them lock sittings afterwards: the suspension, the departure and the promotion.
  - No function deletes a `persons` row or updates its key.
- **So "persons after an assignment" cannot close a cycle.** The 23 L01 breaches are harmless now, and are recorded as such, with the sweep's table in A3-COMPLETION.md.
- **The one possible pair, «Akhiri»'s "persons after a sitting", is closed by its order.** «Akhiri» takes the `persons` of every open sitting FOR KEY SHARE **before** any sitting, so its later KEY SHARE is of a row it already holds.
  - **F37-R05** proves it on real connections for the departure, in both orders.
  - **The suspension and the promotion need no race of their own.** They have the same shape: the person first, holding nothing, then the fence, then the sittings. The structural argument covers all 17.
  - **One requirement instead: pin the property the argument rests on.**
    - A structural check that `akhiri_penugasan` takes every open sitting's `persons` before its first sitting lock.
    - A check that every `persons` FOR UPDATE in the catalogue is its function's first lock.
    - **Either can be added to A3-L1P.** Without the pins, a later edit could silently reopen the pair.
- **A3-L1P is accepted.** All 10 functions that lock both tables take `learning_assignments` first, the plant is reported, the check is red on `eaa37aea`'s start, and A2A-L01 is unchanged.
- **F06-S01 (ADR-0021), found by the static set, is fixed** in `d960c93f`: the grants are restated in the redefining file, and the grantees are unchanged. **The full pre-flight on `8861ffc3` is still owed to me.**
- **Still held for the owner:** the key's columns.
