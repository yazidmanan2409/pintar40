# A2a · Emergency containment and class scope for the emergency (completion page, before build)

**Not built. This page is for Sharon's pre-build review only.** A2a does not start until the owner has considered
the staging checkpoint (Addendum 1, condition 3; TEAM-INSTRUCTIONS.md, "What may close without the owner").
**Source:** THE PLAN §5.3 (A2), Addendum 1 §5a (the split and Sharon's three conditions), §5b (the checkpoint) and
§5d R-1 (planned maintenance is work-scoped), on `claude/bob-41-master-plan` at
`e8a3996925ba46539125dc8e8cd5706fb6703695`. Code read on `claude/system-integrity-4.0` at
`bfe949b11935763a8c8ed7b91f4adcdbcea93645`. Companion: `A2B-MAINTENANCE-INVENTORY.md` (the eight operations).

## Sharon's pre-build review of `55fb9b9b…`: PASS on the design, with four required changes (carried below)

Her record: `claude/gracious-lamport-0m1qjr` at `a809058bbc2dfd6b0aea0b92f98e77e8901c3dbf`,
`docs/coordination/reviews/sharon/A2A-PREBUILD-55fb9b9b93d75c0d683f8be543f30436246c3be2.md`. **A review of a design,
not a build authorization:** A2a is still not built until the owner has considered the staging checkpoint. She checks
the four changes at the result review; no further pre-build round. Her answers to the five points: the split, her three
conditions, D6's placement and the nine scenarios verified; **the CHECK in place of a refusal inside
`schedule_maintenance` accepted** (one is enough in A2a; A2b adds a designed refusal before the CHECK when it adds the
node parameter; the CHECK also stops `change_maintenance` turning a class-scoped EMERGENCY window into a PLANNED one).

### Required change 1 · every reader of a window's schools is node-aware

A class-scoped window still names its school in `institution_ids` (the table's CHECK requires `platform or
cardinality(institution_ids) > 0`), so every reader that matches on `institution_ids` alone would read it as
school-wide. Each reader, and how a non-empty `node_ids` narrows it:

| Reader | Where | Narrowed to the class by |
|---|---|---|
| `maintenance_affects(w, person)` | `20261120100000…:109` | when `node_ids` is non-empty, the person's live enrolment's placement (`memberships` with `valid_to is null`) at one of the nodes, or a live role whose scope node is one of them or below it; the school match alone no longer counts |
| `maintenance_block_for_me()` (the request hook) | `:147` | through `maintenance_affects`, unchanged otherwise; it stays one indexed lookup, skipped when no class-scoped window is active or approaching (D1's cost) |
| `maintenance_draining(person)` | `:135` | through `maintenance_affects` |
| `pintar_status_saya()` | `:274` | through `maintenance_affects`; the window returned names the class, never only the school |
| The sitting-start trigger (`enforce_no_new_sitting_in_maintenance`) | `:175` | through `maintenance_affects` for an EMERGENCY window; PLANNED class windows cannot exist in A2a (the CHECK) |
| `maintenance_controls(w)` | `:123` | unchanged in reach: the school's admins and the platform admin control a class window of that school |
| `maintenance_collisions(p_platform, p_institutions, …)` | `:326` | a class window overlaps its school's window and another window over one of the same nodes; two windows over different classes of one school do not collide |
| `maintenance_may_act(p_platform, p_institutions)` | `:317` | unchanged: whether the actor may act on a window of that school |
| `maintenance_record_edges()` | `:236` | its audit rows carry `node_ids` beside `institution_ids` |
| `maintenance_list()` and its paged form | `:512`; `20261221100000…:16-67` | each row returns its classes' names beside the school's; the school filter still matches the school |
| `change_maintenance`, `stop_pintar_now`, `publish_notice`, `withdraw_notice` | `:390`, `:430`, `:461`, `:489` | the writers: they carry `node_ids` (the stop at class scope is D7); the notices are school or platform only in A2a |
| The pause page and the banner | `src/app/pemeliharaan/page.tsx`, `src/components/pemeliharaan/*`, `src/lib/pemeliharaan-kontrak.ts` (`sekolah: string[]`) | the contract gains the class names; the page names the class when the window has one |

**Test (required):** a class-scoped EMERGENCY window affects the class's learners and teachers, and nobody else in the
school, **through every reader on this list**, not only the hook.

### Required change 2 · the node column is validated beyond the CHECK

A CHECK cannot read other rows. A trigger on insert and update of `maintenance_windows` requires, when `node_ids` is
non-empty:
- each id is a CLASS node;
- each belongs to the window's one school;
- `cardinality(institution_ids) = 1`;
- the window is not platform-wide.

`stop_pintar_now` refuses a bad node first, with a designed code (in A1's domain, wording Daisy's), before the trigger
would.

### Required change 3 · the lock order, stated in full

**The order: person → accounts → emergency fence → sittings in id order.** "The emergency fence first" (below) holds
for the stop and the lift, **not for a suspension**: `tangguhkan_akun` takes the person row, then the account rows
(`akun_kunci`), then holds the person's sittings (`pengerjaan_tahan_orang`), and D6.5 makes that hold a fenced
decision. So its fence comes after the person and account locks.

- **The rule:** no transaction holding the fence ever asks for a person or an account row afterwards.
- **Tests:** a structural test that no fenced function locks `persons` or `accounts` after its fence call; and B6
  (suspension during a stop) on two real connections, with the stop's activation in progress.
- This is Sharon's person-before-account rule (L1-F2), extended to the fence. L1-F2's fix makes the full order
  persons → `auth.users` → accounts → permits; A2a adds the fence after accounts, then sittings.

*(The line "The emergency fence first, then sittings in id order" under "Lock order" below is superseded by this
statement.)*

### Required change 4 · how the writer enumeration finds the writers

- **From the catalogue,** not a list kept by hand: every function and trigger function in `pg_proc` whose definition
  writes the named tables or columns (`assessment_sessions`' status, deadline or held state; `learning_assignments`'
  schedule, status or release; `lesson_progress`; `maintenance_windows.ended_at`).
- **Triggers count as writers.**
- **Dynamic SQL:** any function that builds SQL with `execute` and touches those tables is on the declared list, with
  its reason.
- **No direct grants:** the test also asserts that no client role holds INSERT, UPDATE or DELETE on
  `assessment_sessions`, `learning_assignments`, `lesson_progress` or `maintenance_windows`.
- **Plants:** an unclassified writer turns it red; so does a fenced writer with its fence removed.

## For Sharon: the pre-build review (the first prompt, answered above)

Please verify, on this page:
1. **The split.** A2a is class scope for EMERGENCY only, all of D6, and D7. Nothing class-scoped and PLANNED can be
   created in A2a.
2. **Your three conditions** (§5a) as answered below, with condition 2 as you refined it (emergency only).
3. **The rule between A2a and A2b,** held by a table CHECK rather than by one function (below). Please say whether a
   CHECK is acceptable in place of a refusal inside `schedule_maintenance`, or whether you want both.
4. **The shared writer enumeration:** one test, built in A2a, that A2b and A3 extend.
5. **Your nine scenarios,** copied word for word below, and the per-blocker tests.

PASS or BLOCKED, on the commit that carries this page.

## What holds now

- **A2a:** D1 (class scope) **for EMERGENCY windows only**; D6 in full (D6.1 to D6.9); D7 (emergency at class
  scope). Acceptance: C8 at class, school and platform scope, and the journey "stop one class during Uji Penguasaan,
  lift it, and the class finishes with the time it had" (Addendum §5a).
- **A2b:** D2 (reason list), D3 (extend and resume early, PLANNED only), D4 ("cannot finish before the window"), D8
  (the school's zone), and R-1: class-scoped and school-scoped PLANNED windows, work-scoped (option A, decided by the
  owner). A2b lands before A3 (condition 3).
- **The emergency stays person-level** in the request hook, with all of D6 (R-1).
- **The two-connection harness exists** (`selftest/balapan.ts`, built in L1-F2). A2a's fence tests use it.

## Between A2a and A2b: no class-scoped PLANNED window can exist

**What the code is today:** `maintenance_windows` stores `kind` (PLANNED or EMERGENCY), `platform` and
`institution_ids`, with `check (platform or cardinality(institution_ids) > 0)`. `schedule_maintenance` always writes
`kind = 'PLANNED'`. `stop_pintar_now` always writes `kind = 'EMERGENCY'`. No column names a class node.

**Proposed for A2a:**
- A new column for class nodes (for example `node_ids uuid[] not null default '{}'`), each a class node of one school
  in `institution_ids`.
- **A CHECK on the table:** `cardinality(node_ids) = 0 or kind = 'EMERGENCY'`. It holds for every writer, including
  any added later and `change_maintenance`, not only for `schedule_maintenance`.
- `schedule_maintenance` gains no class-node parameter in A2a. If one is passed through any route, the CHECK refuses
  it.
- `stop_pintar_now` accepts class nodes (D7), under the same typed confirmation and reason.
- **Tests in A2a** (Addendum §5d, "Between A2a and A2b"):
  - a PLANNED window with a class node is refused, by `schedule_maintenance` and by a direct insert;
  - an EMERGENCY window at class scope is accepted, and is person-level: it refuses every request of the class's
    learners and teachers and of nobody else in the school.
- School-scoped PLANNED windows stay as they are today until A2b.

## Sharon's three conditions (§5a)

| # | Condition | How A2a answers it |
|---|---|---|
| 1 | **A2a owns every path that ends an emergency.** `change_maintenance(…, 'AKHIRI', …)` can end an EMERGENCY window today; in A2a it goes through D6's fenced lift. A2b's extend and resume early apply to PLANNED windows only. *Test:* every function that sets `ended_at` on an EMERGENCY window takes the fence; it joins D6.2's enumeration | `change_maintenance` with `AKHIRI` on an EMERGENCY window calls the fenced lift (exclusive fence, `T_lift` read under it, then commit; release afterwards). The enumeration test lists every function that writes `maintenance_windows.ended_at` and requires the fence for an EMERGENCY row |
| 2 | **The status read for class scope** (refined by Sharon under R-1: class-scoped **emergency** windows only) | `pintar_status_saya` returns a class-scoped EMERGENCY window to the people it affects (enrolled in or teaching the class), and to no one else in the school. Class-scoped PLANNED windows and their warnings are A2b's |
| 3 | **A2b lands before A3** | The sequence of Addendum §2 already has it. A2a's enumeration test and lock order are written so that A3 extends them |

## D6 in full: where each part is built

The design text is THE PLAN §5.3 D6, unchanged. This table says where A2a builds each part.

| Part | What A2a builds | Where |
|---|---|---|
| D6.1 · The fence | A transaction-level advisory lock, shared by every protected decision as the first lock of its transaction, exclusive for activation and lift. The protection read is a later statement at READ COMMITTED. `T_stop` and `T_lift` read with `clock_timestamp()` under the exclusive fence. Activation with a lock timeout and retries | `stop_pintar_now`, the fenced lift, and each function of D6.2's table |
| D6.2 · Protection on every protected decision | `is this sitting protected?` under the fence, in every act of the table (`pengerjaan_putus_tenggat`, `finalize_session`, `akhiri_pengerjaan`, `terminate_session`, `tambah_waktu_pengerjaan`, `extend_session_deadline`, `lanjutkan_pengerjaan`, `tutup_pengerjaan_ditahan`, `ubah_jadwal_penugasan`, `akhiri_penugasan`, `note_item_view`, `pengerjaan_gerbang` and the response trigger). Enrolment termination permitted (O1), the sitting preserved unscored and judged after the lift. The promotion run refused for a learner with a protected sitting (M-1). Each refusal with its own code in A1's domain | the functions named; `tutup_asesmen_terbuka`; codes and sentences in `src/lib/hle.ts` |
| D6.3 · One time rule | The effective deadline moves by exactly the protected interval: the own deadline changed; a window-timed sitting's shift recorded beside it and added where its closing time is read; no grace created where A1 gives none; an `EXPIRED` sitting inside its grace protected without being held. `pengerjaan_jaga` allows exactly the release's transition | `pengerjaan_tenggat_efektif`, the deadline decider, `pengerjaan_jaga` |
| D6.4 · Overlapping and successive stops | The protected interval as the union of the person's active EMERGENCY windows; release once, at the last lift; a pending release applied before a second hold | the release rule |
| D6.5 · Suspension holds | The held state carries both causes; `pengerjaan_ditahan` answers yes for either; the lift removes the emergency hold only | A1's held state, extended (no second system) |
| D6.6 · The scheduled closer | A procedure committing per small batch, the shared fence inside each; selection excludes protected and held sittings in the query and uses the shifted closing time. The job text `select …` → `call …`; A1-S08, A1-S09 and the DR tests restated with notes | `pengerjaan_tutup_terjadwal`; the shared installer. **Depends on checkpoint item 1** (a `pg_cron` job may `CALL` a committing procedure) |
| D6.7 · Marking and release | Bounded batches, sittings in id order, `SKIP LOCKED`, idempotent, resumable; first touch releases by the same rule | new marking and release procedures |
| D6.8 · Failure behaviour | No half-stop; retried marking and release give identical outcomes; a failed lift leaves the stop in force | activation and lift |
| D6.9 · Audit | One row at effect (`T_stop`), one when marking completes, one at the lift (`T_lift`, released, left held); each O1 refusal audited; enrolment terminations keep their ordinary record | `audit_log` |

~~**Lock order** (THE PLAN §6.2): the emergency fence first, then sittings in id order, in short transactions. L1-F2's
locks (the person's row, then the person's `accounts` rows) touch no sitting and take no fence, so they add no cycle.~~
*(Superseded by Sharon's required change 3 above: person → accounts → fence → sittings in id order.)*

## The shared writer enumeration (one test, built in A2a)

One test reads every function that writes a sitting's status, deadline or held state; an assignment's schedule,
status or release; `lesson_progress`; or `maintenance_windows.ended_at`. It classes each as one of:
- **fenced:** applies D6.2's protection check under the fence (A2a);
- **place-guarded:** asks the place question of a work-scoped PLANNED window (A2b fills this class);
- **declared allowed:** on a short named list, each with its reason (the marking, the release, the enrolment path,
  the window controllers).

A writer in none of the three fails the test. That includes a writer added later. **No such test exists today**
(inventory, row 4). A2b extends it with the place class; A3 extends it for recovery. The writers the inventory found
outside Sharon's row 4 (`launch_quick_assessment`, `move_learning_assignment_release`, `minta_percobaan`,
`putuskan_percobaan`, `kenaikan_tetapkan`, `koreksi_kunci_pindah`) are classed in A2a for the fence, and again in
A2b for the place.

## Verification: Sharon's nine scenarios, word for word (THE PLAN §5.3 H)

> 1. **The fence (B1):** the decider, the stop and the marking, interleaved in two sessions at each point: before
>    the stop's lock, while it is held, and after the commit.
>    - Invariant: no sitting ends by deadline with `closure_deadline > starts_at` for a window affecting its person.
>    - Plant: remove the fence, and this goes red.
> 2. **The acts during a stop (B2):** under a class-scoped stop, a head of department and the school admin are each
>    refused end, extend, resume, close and window change on an affected but unmarked sitting. The same acts on an
>    unaffected class succeed.
> 3. **Late sync (B3):**
>    - a sitting in its grace at the stop's instant, with the stop longer than the grace;
>    - after the lift, the answer arriving within the restored grace is LATE_SYNC and scored, and scoring waits
>      until `late_sync_until`;
>    - an answer after `late_sync_until` is kept, not scored;
>    - a manifest-complete hand-in after the lift closes it early.
>    - Red today: the scoring happens at the lift.
> 4. **A window-timed sitting (B4):** its `closes_at` passes during the stop. After the lift it has
>    `ended_at + (closes_at − starts_at)` and isn't ended at the lift.
> 5. **Re-stop (B5):** W1 lifts, the gap passes, W3 starts before release. The final deadline equals
>    `W3.ended_at + (W1 restored deadline − W3.starts_at)`, so the learner gains no gap time.
>    - Also: with overlapping W1 and W2, the remaining time comes from the earlier `starts_at`.
> 6. **Suspension during a stop (B6):** suspended during the stop, then the stop lifts. The sitting stays held as
>    ACCOUNT_SUSPENDED with the same remaining time, and the scheduler doesn't end it.
> 7. **In-flight requests:** a hand-in and an answer whose requests passed the gate before the stop's commit. Both
>    are committed and kept, and neither is refused or lost.
> 8. **Scale and starvation (R1, R2):** 50,000 affected sittings and one unaffected expired sitting. The unaffected
>    one is ended on the first scheduler run, and the skipped count is reported. The stop's wait on the fence is
>    measured, as is the hook's time before and after (D1).
> 9. **Idempotency and recovery:** the marking interrupted after half the sittings, then the lift. Every outcome is
>    identical to a clean run: the same deadlines, nothing scored.
>    - Also: stopping twice or lifting twice writes no second audit row.

Read in this plan's terms by Sharon's own mapping (THE PLAN §5.3 H): `starts_at` is `T_stop` and `ended_at` is
`T_lift`; in scenario 2 an enrolment ending is permitted (O1) and scores nothing, while `akhiri_penugasan` and the
promotion run are refused; "`late_sync_until`" is the grace left after D6.3's shift, own-deadline sittings only; in
scenario 4 the window-timed sitting keeps no deadline of its own; scenarios 4 and 5 equal D6.3 and D6.4; scenario 8
runs as the dedicated scale job, with a CI-sized variant in the suite.

**Scenario 2 at class scope is A2a's own:** it needs the class-scoped EMERGENCY window, which A2a builds.

**The per-blocker tests** of THE PLAN §5.3 H (B1 to B6, R1, the shift-aware closer, the enrolment ended during a
stop, grace only where A1 gives it, R2's 5-second threshold at the 95th percentile with the queue delay measured) and
the dedicated 50,000-sitting scale job are all A2a's. **Added by this page:** the two tests of "Between A2a and A2b",
condition 1's fence test on `ended_at`, and the writer enumeration.

## What A2a depends on that is not yet proven

- **Checkpoint item 1** (Addendum §5b): a `pg_cron` job may `CALL` a procedure that commits between batches. D6.6
  needs it. If it does not hold on hosted staging, the closer needs a different shape, and this page comes back to
  Sharon before the build.
- **Checkpoint item 2:** a transaction-level advisory lock taken through the API and the pooler holds as expected,
  and hosted timeouts leave room for activation. D6.1 needs it.

## Cross-module inventory (planned)

| Module | Effect |
|---|---|
| Sittings and A1's held state | Protected decisions take the fence; the held state carries two causes; the closer becomes a procedure |
| Enrolment, transfer, promotion | Enrolment ending permitted and scores nothing during a stop; the promotion run refused for a learner with a protected sitting |
| Maintenance scheduling | Class nodes for EMERGENCY only; PLANNED unchanged until A2b |
| Status read, pause page | Class-scoped EMERGENCY windows reach only the class's people |
| Accounts (L1-F2) | None. No shared lock beyond the order above |

## Next state (planned)

| After A2a | Holds |
|---|---|
| An emergency stop at class, school or platform scope | No affected sitting is ended, scored or re-timed while it holds; after the lift every sitting has exactly the time it had; suspension holds survive |
| A class-scoped PLANNED window | Cannot be created (the CHECK). Arrives in A2b, work-scoped |
