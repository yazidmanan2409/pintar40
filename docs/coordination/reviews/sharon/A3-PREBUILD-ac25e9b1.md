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

## Addendum, 17 Nov 00:45 UTC: my formal approval of the deadlock solution, with the lineage key (owner's rulings 45 to 47, `181638b9`)

**APPROVED: the start's lock order as built in `aed35103`** (my 00:05 ruling), now with ruling 46's lineage key:
1. the person, FOR KEY SHARE;
2. the fence, shared;
3. `learning_assignments` FOR KEY SHARE, when the assignment has one;
4. `assessment_assignments` FOR SHARE;
5. under that lock, read `assessment_definitions.lineage_root_definition_id` for the assignment's current definition;
6. `pg_advisory_xact_lock` on (learner, lineage root);
7. `may_start`'s count, over the same lineage, within the school and school year;
8. the sitting.

**Why the lineage key keeps every property that was proved:**
- **The root is immutable,** and it is read under the assignment's share lock. A move or a key correction cannot commit between the read and the count, which is F37-R03's property.
- **Every revision of one assessment shares the root, so every revision shares the lock.** N-5's two-assignment race, and its cross-revision form, serialise on one key. That is F37-R02, plus a new revision-1 against revision-2 race.
- **The order of row locks is unchanged** from `aed35103`, so F37-R04 (no deadlock with «Akhiri»), F37-R05 and A3-L1P hold as they are.

**What the lineage build must add (my 23:50 design, now the build):**
- **The column:** `lineage_root_definition_id`, NOT NULL, immutable by trigger, set by `salin_kursus_revisi` from the source's root. A new definition is its own root.
- **The backfill:** from the course and module chain plus title and mode. It refuses unless each revision finds exactly one predecessor.
- **The count:** `may_start` counts over the lineage. Version-specific history and audit stay untouched, as ruling 46 requires.
  - **No reset path exists.** An exceptional reset needs the owner's explicit authorisation, so there must be no function that grants one.
- **Red first:**
  - a revision-1 sitting refuses revision 2 at the limit;
  - the cross-revision race;
  - the backfill's uniqueness;
  - the immutability trigger, with its plant;
  - F37-R01 to R05 and A3-L1P re-run on the new key.
- **The two pins from 00:35 still apply:** «Akhiri»'s person-before-sitting order, and every `persons` FOR UPDATE being its function's first lock.

**The affected implementation may proceed on this.** I review the lineage migration and the re-keyed start when they are pushed.

## Addendum, 17 Nov 02:00 UTC: pin 2 does not hold (one exception is a real deadlock), and the two questions

**What I read:** Second Eye's report on local `007d7acb`, as text. Noted from it:
- `percobaan_terpakai` was a sibling the lineage sweep missed. It is now over the lineage, red first (A3-PT1).
- Pin 1 is built as A3-L2P.
- 91196deb's test copies are now their own roots.

**Pin 2: my 00:35 statement that "each takes it first" was wrong for 3 of the 17.** Second Eye's reader is right, and I accepted the sweep too quickly. *Could reasonably have been anticipated (Q3, the locks):* I took the sweep's summary without asking for the per-function first lock.

The test for each exception: **can a function that takes the person first (a start, «Akhiri») later request the lock the exception already holds?** If yes, there is a cycle.

1. **`issue_institutional_id` holds `institutions` FOR UPDATE, then waits for `persons` FOR UPDATE. This is a real deadlock with a start.**
   - The start holds `persons` FOR KEY SHARE first.
   - Its sitting insert's foreign key to `institutions` then takes **KEY SHARE on that school's row**, which FOR UPDATE blocks.
   - So: the start waits for the institution, and `issue_institutional_id` waits for the person.
   - **Ruling (b), in A3, red first:**
     - **F37-R06** races a start with `issue_institutional_id` for the same learner and school, on real connections, and is red today;
     - **the fix:** take `institutions` **FOR NO KEY UPDATE** if the function only updates non-key columns, such as a counter. NO KEY UPDATE does not conflict with KEY SHARE, so the cycle cannot form. Otherwise take the person first.
     - R06 is then green, and the other F37 cases stay green.
2. **`confirm_my_name` (`account_setup` FOR UPDATE first) and `handle_new_auth_user` (`account_activation_grants` FOR UPDATE first): ruling (a), named exceptions,** on one condition.
   - **The check:** no function that takes the person first, nor any foreign key from a table they write, locks `account_setup` or `account_activation_grants`.
   - If the check holds, no cycle can pass through them. Each exception names its reason.
   - If the check finds a locker, it becomes (b) as above.
3. **Pin 2, restated:** every `persons` FOR UPDATE taker either takes the person first, or holds only locks that no person-first function can request, foreign keys included. The named exceptions are checked against that rule.

**Question 1: an approved attempt request is not a "reset". I agree with Second Eye.**
- It is an explicit, authorised and audited extra attempt, and it keeps every sitting and its history. A reset would erase or discount past sittings.
- **The "no reset path" requirement stands as written:** no function may discount past sittings of the lineage.

**Question 2: a grant must span the lineage too. Fix it in A3, not Z. This supersedes my 23:15 Z placement.**
- **Under ruling 46, today's per-assignment grant is a dead end.** A learner who used the attempt on revision 1 is at the limit on revision 2. They cannot ask on revision 2's assignment, because `minta_percobaan` needs a sitting there, and they cannot start one because of the limit. That is a learner stuck, not a conservative refusal.
- **A3 creates this, so A3 fixes it:**
  - `percobaan_izin_jumlah` counts approved grants over the same lineage, school and year as the count;
  - `minta_percobaan`'s eligibility reads a sitting anywhere in the lineage, and its lock key is the lineage root;
  - **red first:** used on revision 1, a request is allowed and granted, then **exactly one** start through revision 2's assignment is allowed;
  - two approvals still give two attempts, each a staff decision.
- **The Z item for `minta_percobaan` (CARRIED-ITEMS) is withdrawn,** superseded by this.

## Addendum, 17 Nov 02:15 UTC: A3-R4's exposure at production's migration 111. Bob's reading is confirmed: not exposed.

**What I read:** the repository only. The first 111 migrations on `main` run up to `20261005120000_activation_is_granted_not_inferred.sql`. I read `issue_institutional_id` at 20260926100000, and searched all 111 for `persons` locks.

- **At 111, `issue_institutional_id` takes `institutions` FOR UPDATE and then inserts `institutional_identities`.** That insert's foreign key takes **KEY SHARE** on `persons`, not FOR UPDATE. The `persons` FOR UPDATE that closes the cycle came later.
- **At 111, no function takes `persons` FOR UPDATE, updates a `persons` key, or deletes a `persons` row.**
  - The only `update public.persons` statements are inside two migrations' one-off self-check blocks (20261001100000:567 and 20261004110000:121). Those are non-key updates, so FOR NO KEY UPDATE, and they run once, at migration.
  - Every run-time `persons` lock at 111 is therefore a foreign key's KEY SHARE. KEY SHARE locks never conflict with each other, so no cycle can pass through `persons`.
- **What a start at 111 does meet:** its sitting insert takes KEY SHARE on `institutions`, so it **waits** behind `issue_institutional_id`'s FOR UPDATE on the same school, until that commits. **It is a wait, not a deadlock,** because `issue_institutional_id` waits for nothing the start holds.
- **Conclusion:** production at 111 is not exposed. The exposure starts with A2a's person lock and A1's `persons` FOR UPDATE takers. Bob's "staging" record is right.

## Addendum, 17 Nov 02:30 UTC: Second Eye's plan for my 02:00 rulings

- **The plan is accepted:**
  - `issue_institutional_id` moves to FOR NO KEY UPDATE, since it only reads `namespace`, and the race under its own new name;
  - the sweep of every "institutions FOR UPDATE, then persons", `import_advance` included;
  - pin 2 with the two named exceptions and their check;
  - the five places where grants change to span the lineage, with A3-PG1.
- **`attempt_requests_one_pending` stays per (person, assignment). Accepted.**
  - The lineage-root advisory lock is the serialiser.
  - **One condition:** a check that `minta_percobaan` is the only writer of `attempt_requests`, through grants and the function catalogue, so the narrower index never has to stand alone.

## Addendum, 17 Nov 04:45 UTC: A3-R02I red then green; the wider class of `institutions` FOR UPDATE. Ruling: (b).

**A3-R02I and its fix are accepted, as text.**
- **The commits are local:** `a1c373c7` (the test) and `e49634c6` (the product).
- **The race was a real deadlock:** red twice, with the start aborted.
- **The fix:** `issue_institutional_id` now takes the school FOR NO KEY UPDATE.
  - NO KEY UPDATE conflicts with itself, so numbering stays serialised.
  - It no longer blocks a foreign key's KEY SHARE, so the cycle is gone.
  - The SI-D03 order (school, then person) is re-checked, and the grants are unchanged.
- I will diff it against this text when it is pushed.

**The wider class is real, and Second Eye's example closes a cycle by my own test:**
- **X, `tangguhkan_akun`:** it holds the person FOR UPDATE first, then inserts an audit row referencing the school. That foreign key takes KEY SHARE on `institutions`.
- **Y, `grant_role` through the last-administrator guard:** it holds `institutions` FOR UPDATE, then the `role_assignments` foreign key takes the person at KEY SHARE, which X's FOR UPDATE blocks.
- **So X waits for Y, and Y waits for X.** Suspending a teacher while granting that teacher a role is ordinary staff work. Second Eye has not reproduced it, but the reasoning holds.

**Ruling: (b), in A3.**
1. **Convert every `institutions` FOR UPDATE to FOR NO KEY UPDATE:** `atur_zona_waktu_sekolah`, `perpanjang_peran`, and both sites of `peran_terakhir_kode`, alongside `issue_institutional_id`.
   - Every site only reads the row or updates non-key columns.
   - NO KEY UPDATE conflicts with NO KEY UPDATE, so each site's serialisation against its siblings is kept, and the last-administrator guard still cannot be raced into zero administrators.
2. **One race, red first, for the role guard:** suspending a teacher, on X, against granting that teacher a role in the school, on Y, on real connections. It must be red before the fix.
3. **One structural check:**
   - **no `FOR UPDATE` on `institutions` anywhere in the catalogue;**
   - **A2A-L01's reader records the strength of each `institutions` lock,** so that a later FOR UPDATE fails the check.
   - **A plant** puts one site back to FOR UPDATE and is caught.
4. **The last-administrator guarantee is re-proven after the change:** two concurrent revocations of the last two administrators leave at least one, in both orders. That is the property the FOR UPDATE was there for.

*Could reasonably have been anticipated (Q3, the locks):* this is A3-R4's pattern on other tables. My "the test for each exception" covered `persons`; the same test applies to every row a foreign key reaches.

## Addendum, 17 Nov 05:00 UTC: pin 2 is red on three. Rulings, and a correction to my 04:45 ruling.

**What I reviewed:** A3-P2 (local), built as I restated pin 2. It finds three functions.

**Items 1 and 2 become (b), as Second Eye proposes. Accepted.**
- **`confirm_my_name`:** a person-first re-activation or lock updates `account_setup`, so it takes the person first.
- **`handle_new_auth_user`:** `hapus_data_pribadi` updates `account_activation_grants`, so it takes the person first.
  - The grant's person is read without a lock, then the person is locked, then the grant is **re-read under the lock**. If the grant changed, it is refused or retried. A grant that creates a new person is unchanged.
- **Each is red first,** with its race on real connections.

**Item 3: `issue_institutional_id` against the last-administrator guard.**

**My 04:45 ruling does not fix it, so it is corrected here.** Converting the guard to FOR NO KEY UPDATE is not enough, because NO KEY UPDATE conflicts with NO KEY UPDATE:
- the role function holds the person and waits for the school;
- `issue_institutional_id` holds the school and waits for the person.
That is still a cycle.

**Ruling: Second Eye's (b).** The last-administrator guard, `peran_terakhir_kode` at both sites, serialises on a transaction-scoped **advisory key per school** and takes no lock on the school row.
- **Why it closes every cycle found so far:**
  - **The role functions** take the person (first), then the advisory key, then their `role_assignments` write, whose foreign key takes KEY SHARE on the school.
  - **`issue_institutional_id` and the import** hold the school FOR NO KEY UPDATE, then the person.
  - **KEY SHARE is compatible with NO KEY UPDATE,** so the role function never waits on the school row while `issue_institutional_id` holds it.
  - **The only remaining wait** is `issue_institutional_id` on the person, behind a role function that waits for nothing it holds. So there is no cycle.
  - **SI-D03's order, school then person, is kept** for the import and for issuing.
- **The guarantee is unchanged:** every role change in one school serialises on that school's key, so the last administrator still cannot be removed by two concurrent revocations.
  - **A function touching several schools** takes their keys in school-id order.
- **The two plain readers,** `atur_zona_waktu_sekolah` and `perpanjang_peran`, take FOR NO KEY UPDATE, as ruled at 04:45. Both take the school before the person, so they serialise with `issue_institutional_id` on the school and cannot form a cycle with it. Against person-first FOR UPDATE takers, their school lock does not block foreign-key KEY SHARE.
- **A2A-L01:** the guard's advisory key is ranked after `persons` and before the school row, and the reader records it.

**So my 04:45 points become:**
1. NO KEY UPDATE for `issue_institutional_id` (done), `atur_zona_waktu_sekolah` and `perpanjang_peran`, and **the advisory key for the guard**;
2. **two races, red first:** suspension against a role grant (04:45), and **numbering a person in a school against a role change of theirs there** (item 3);
3. the structural check: no `institutions` FOR UPDATE, with strength recorded, plus the plant, and the guard holding no row lock on `institutions`;
4. the last-administrator guarantee re-proven under the advisory key, in both orders.

**A3-P2 turns green** when items 1 to 3 are fixed. It stays as the standing pin.
