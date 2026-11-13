# A2a · Emergency containment and class scope for the emergency (completion page, before build)

**RELEASED FOR IMPLEMENTATION, 13 Nov 2026.**
- Sharon wrote **PART 2 ACCEPTED** (`PART2-VERDICT.md` on `claude/gracious-lamport-0m1qjr` at `2c90d178`). The staging
  checkpoint is closed, and the Chief Architect released A2a.
- `main` is at `a6b47466d3f8242b2740f81c186a5cb0f341eac0`; staging serves it at 244.
- **Not built yet.** This revision is for Sharon's early read, before code. It adds the section below,
  "Before the build: what the checkpoint settled, and the design constraints". Everything after that section is the
  reviewed design, unchanged, with Sharon's four required changes.

*(Superseded: "Not built. This page is for Sharon's pre-build review only. A2a does not start until the owner has
considered the staging checkpoint.")*

## Before the build: what the checkpoint settled, and the design constraints

### 1 · The closer is a committing procedure that cron `CALL`s, proven on hosted staging

D6.6 stands as designed: `pengerjaan_tutup_terjadwal` becomes a procedure that commits per small batch, with the shared
fence inside each batch. The installer's job text changes from `select …` to `call …`.
- **Proven on hosted staging this morning** (Part 2, row 4; `docs/completion-4.1/checkpoint/PART2-EVIDENCE.md` on
  `claude/bob-41-master-plan`). One scheduled run of `CALL _probe_p2.p()` finished `succeeded`, message `CALL`. It wrote
  three rows in three transactions, in order (xids 77402, 77403, 77404). The scratch objects were then removed:
  `0 0 0 0`.
- *(Superseded: "Depends on checkpoint item 1" in D6.6's row, and the section "What A2a depends on that is not yet
  proven", below.)*

### 2 · The fence is taken only inside the database (Sharon's ruling, Part 2 row 5)

**The condition.** The fence (D6.1: a transaction-level advisory lock) is taken only inside database functions,
reached through PostgREST (an RPC) or `pg_cron` (the closer's `CALL`). It is never taken by a client through the
transaction pooler (port 6543), and never by the app's own code.
- **Why that suffices:** each PostgREST RPC, and each of the closer's batches, is one transaction in the database. A
  transaction-level lock then lives exactly as long as the decision it fences, whatever pool the request came through.
- **What the app is today:** `src/` holds no database driver, no pooler address and no `pg_advisory` call. It reaches
  the database only through Supabase's client, which is PostgREST. Read on `a6b47466`.

**Built as one fence function**, so there is one place to read:
- `public.pagar_darurat(p_eksklusif boolean)`, `security definer`. It sets its own lock timeout (§3) and takes
  `pg_advisory_xact_lock` (exclusive) or `pg_advisory_xact_lock_shared` on one fixed key.
- Every fenced decision calls it as the first lock of its transaction, apart from the person → accounts locks of
  required change 3.

**The test, A2A-F01 · "the fence is taken only inside the database":**
1. **From the catalogue:**
   - exactly one function's definition takes an advisory lock on the fence key: `pagar_darurat`;
   - every function and procedure that calls `pagar_darurat` is one of three kinds: an RPC (`EXECUTE` granted to
     `authenticated`, never to `anon`), the closer procedure, or a trigger function on a table that clients write only
     through such RPCs;
   - none of them is granted to `anon`.
2. **From the repository:**
   - no file under `src/` imports a database driver (`pg`, `postgres`), names a pooler address or port (`:6543`,
     `pooler.supabase.com`), or calls `pg_advisory`;
   - no migration takes an advisory lock on the fence key outside `pagar_darurat`.
3. **Plants:**
   - a second function taking the fence key directly turns it red;
   - so does an advisory-lock call added under `src/`.

It runs in the static and database runners, locally and in CI. No hosted run is needed: the hosted half is
PostgREST's and `pg_cron`'s own transaction model, and row 4 proved `pg_cron`'s.

### 3 · The hosted timeouts are design constraints, with the arithmetic

**Read on staging at Part 1** (item 2c):

| Role | `statement_timeout` | `lock_timeout` |
|---|---|---|
| `authenticated` | 8 s | (none: the session's applies) |
| `authenticator` | 8 s | 8 s |
| `anon` | 3 s | — |

An RPC runs as `authenticated` on `authenticator`'s session. So **a whole fenced call must finish in 8 s**, and the
session's default lock wait (8 s) would use all of it. Hence:
- **The fence function sets its own `lock_timeout`, never the session's.** The value depends on which side takes it:

| Who takes the fence | Mode | `lock_timeout` | Attempts | Worst wait | Its own work under the fence | Worst total | Under 8 s by |
|---|---|---|---|---|---|---|---|
| The activation (`stop_pintar_now`) | exclusive | 1.5 s | 3, with 100 ms between, each in a subtransaction (`lock_not_available` is caught) | 3 × 1.5 + 2 × 0.1 = **4.7 s** | the window row, `T_stop`, the audit row: budget **0.5 s**; the marking runs after, in its own batches (D6.7) | **5.2 s** | **2.8 s** |
| The lift (fenced, through `change_maintenance … 'AKHIRI'` and the lift action) | exclusive | 1.5 s | 3 | 4.7 s | `T_lift`, the window's end, the audit row: 0.5 s | 5.2 s | 2.8 s |
| A protected decision (D6.2's table) | shared | 2 s | 1 | 2 s | its own work, as today: the slowest, `finalize_session`, budget 1 s | 3 s | 5 s |
| The closer, each batch (`pg_cron`, as `postgres`: no role timeout) | shared | 2 s | 1; a batch that waits longer is left for the next run, and the skip is counted (R1) | 2 s | one small batch | — | not bound by 8 s |

- **The exclusive side holds the fence only for its own work** (≤ 0.5 s). So a shared taker's real wait is that, not
  its 2 s limit.
- **When the activation gets no fence** after three attempts, it refuses with the designed line: «Penghentian belum
  berlaku. Tidak ada yang dihentikan.» (THE PLAN §5.3 F). The lift refuses with Daisy's «Penghentian belum diakhiri.
  Tidak ada yang berubah. Coba lagi.»
- **When a shared taker gets no fence,** it refuses with its own code in A1's domain: the act is retried, never
  half-done.
- **Measured, not assumed:**
  - the activation's and the lift's work under the fence is timed in the scale job (scenario 8, 50,000 sittings), and
    must stay under 0.5 s;
  - the stop's wait on the fence is measured there as well.
  - A result over budget comes back to this page before the freeze.
- **No fenced function is granted to `anon`** (3 s), as A2A-F01 asserts.

### 4 · The five questions, for the state A2a touches

The state: `maintenance_windows` (the new `node_ids`; `ended_at` for an emergency); the sitting's deadline, its held
state and its two causes; the fence; the closer's selection; and the audit rows.

1. **What else reads or writes it?**
   - Readers: every reader of a window's schools (required change 1's table), the request hook, the status read, the
     pause page and the banner.
   - Writers: the writer enumeration (required change 4), from the catalogue, with triggers and dynamic SQL included.
   - Also: the closer (cron); the suspension and the reinstatement (A1's held state, D6.5); the enrolment, transfer and
     promotion paths (O1, M-1); and the response trigger.
2. **The opposite and the neighbouring act:**
   - stop and lift;
   - stop twice, lift twice (scenario 9: no second audit row);
   - a second stop before the release (scenario 5);
   - a suspension during a stop, and a reinstatement during it (scenario 6, D6.5);
   - `change_maintenance … 'AKHIRI'` on an emergency, which goes through the fenced lift (condition 1);
   - a PLANNED window with a class (refused by the CHECK);
   - a teacher of the stopped class who also teaches another class: stopped there too, because the emergency is
     person-level (R-1). Daisy's line says so on the form and on the pause page.
3. **Which locks, in what order, and who else takes them:**
   - **person → accounts → fence → sittings in id order** (required change 3);
   - the fence is exclusive for the activation and the lift, shared for the protected decisions and each of the
     closer's batches;
   - the hook takes no lock;
   - the rule: no transaction holding the fence asks for a person or an account row afterwards (a structural test,
     and B6 on two connections).
4. **How "before" is told from "after":**
   - `T_stop` and `T_lift` are read with `clock_timestamp()` under the exclusive fence;
   - the protection read is a later statement at READ COMMITTED, after the fence, so it sees every committed stop;
   - a decision that passed its fence before the stop is "before", and its write stands (scenario 7);
   - the marking and the release are idempotent and resumable (D6.7, scenario 9).
5. **Who runs each check, with what access, and where it renders:**
   - the database runner (as `postgres`, two real connections through `selftest/balapan.ts`) for B1 to B6, the
     ordering and the enumeration;
   - the static runner for A2A-F01;
   - the dedicated scale job for scenario 8;
   - CI and journeys on the frozen commit for "stop one class during Uji Penguasaan, lift it, and the class finishes
     with the time it had";
   - Daisy's screens at 390 and 320 px (her list in `A2-KATA-DESAIN.md`): the form in Konfigurasi, `/pemeliharaan`,
     and the list row.
   - On hosted staging: nothing new. Row 4 has already shown `pg_cron`'s `CALL`, and no staging write is planned in
     A2a.

### 5 · Daisy's words (`A2-KATA-DESAIN.md` on `ux-1/daisy-experience` at `b5cde1ab`)

Carried into `src/lib/hle.ts`, in Indonesian and English, exactly as she wrote them:

| Her section | Where it renders | What is built |
|---|---|---|
| A1 · the emergency form | Konfigurasi › «Pemeliharaan dan pengumuman» › «Hentikan sekarang» (Admin PINTAR) | «Satu kelas atau lebih»; the class list after one school is chosen; the person-level hint; the impact sentence in its class form ({n} counts everyone the stop reaches, the classes' teachers included) |
| A2 · the node refusal | the form's result line, `role="alert"` | `galat.maintenance_node_invalid`, one line for the four causes (required change 2's designed code) |
| A3 · the pause page | `/pemeliharaan` | «PINTAR dihentikan sementara untuk kelas {kelas}»; the other-class line, only where true; `.arti` for a class |
| A4 · the lift | the maintenance list | the row «Dihentikan · kelas …»; «Akhiri penghentian» behind `KonfirmasiBahaya`; the confirmation; the result line; the refused lift |
| A5 · the status read | `pintar_status_saya` | the class's people only; no banner; nobody else in the school sees anything |

- **Her check for the page:** a failed status read is never taken as "no stop". The open player keeps its existing
  behaviour on a failed read, and the next request shows the pause page.
- A2b's sections (B1 to B3) are A2b's.

### 6 · The lock-order safeguard (the owner's decision after the 4.0 look-back; Sharon's catalogue test)

**Why it is here.**
- 4.0 declared no lock order for a person's rows, and each function took them in its own order.
- L1-F2 and L1-F4 each found a cycle by review, and each cost a block and a rework round.
- Sharon's required change 3 above is the third time the order has had to be written down.
- This test makes the order permanent, under working rule 3 ("a defect is swept for its siblings").

**The order:**

| Rank | What | Note |
|---|---|---|
| 1 | `persons` | |
| 2 | `person_suspensions` | after the person, before Auth's row, as the reinstatement takes it today (L1-F4) |
| 3 | `auth.users` | |
| 4 | `accounts` | |
| 5 | the fence | A2a, required change 3 |
| 6 | `assessment_sessions` | the sittings; in id order within the table |

The owner's rule names ranks 1, 3 and 4. Ranks 2, 5 and 6 are placed where today's code and required change 3 put
them. **Sharon rules on that placement in her read.**

**The test: A2A-L01 · "the account lifecycle takes its rows in one order"** (the database runner).
1. **From the catalogue, never a list of names:**
   - it reads every function and procedure in `public`, and every trigger function on the four tables;
   - functions A2a and A3 add fall under it the day they land.
2. **For each function, the ordered list of row locks it takes on the six ranks:**
   - `select … for update`, `for no key update`, `for share` or `for key share` on the table; `update`; `delete`;
     a call to the fence function;
   - transitively, the locks of every function it calls, found by name in the catalogue (cycle-safe);
   - the locks of the row triggers its updates and deletes fire on those tables;
   - **an `insert` of a new row is not counted** (no one else can see the row until it commits); the triggers it
     fires are counted. That is how L1-F4's guards take the person.
3. **The verdict:**
   - **a function fails if a later lock has a lower rank than an earlier one;**
   - taking the same rank again is allowed (the order between rows of one table is the race tests' job).
4. **Dynamic SQL:** a function that builds SQL with `execute` naming these tables must be on a declared list, with its
   reason. A new one fails.
5. **Shown to fail before it is trusted** (three plants):
   - (P1) inside the test's own rolled-back transaction, a function that locks `accounts` and then `persons` must be
     reported;
   - (P2, `scripts/dev/plants.mjs`) `akun_kunci` with its `auth.users` and `accounts` locks swapped turns it red;
   - (P3, once the fence exists) a fenced function that locks `accounts` after the fence turns it red.

**What it does not establish** (said here, so a green run is not over-read):
- **Branches:** it reads every branch of a function in text order together. It may over-report, never under-report,
  for straight-line code. An over-report is resolved by reading the function and, if the order is in fact safe, by a
  declared exception with its reason.
- **Foreign keys:** an insert of a row that refers to a person takes `FOR KEY SHARE` on that person by itself, and
  the text does not show it. **Listed as a limit; Sharon rules whether it counts.** If it does, the test adds it from
  `pg_constraint`.
- **Order between rows of one table** (sittings in id order, accounts in id order) is proven by the two-connection
  race tests (`selftest/balapan.ts`), not here.

**Sittings and the fence are covered** by the same lists (ranks 5 and 6). So required change 3's structural test (no
lock of a person or an account after the fence) is this test's rank rule, not a second test.

**If it finds an existing writer out of order**, that is a real defect:
- swept first, for every sibling;
- the smallest fix proposed here;
- if the fix would change approved account-lifecycle behaviour, stopped and taken to the Chief Architect.

**It is built first, as its own change** (working rule 5: verification tooling never travels with a product
change). It is green or red on `main`'s code before any of A2a's product changes is made.

### 7 · Acceptance evidence (working rule 1: named before building)

| What proves it | Who runs it | With what access | Where |
|---|---|---|---|
| A2A-L01 and its plants; A2A-F01 and its plants (§2) | Second Eye builds them; the suite runs them | the repository; the local stack | the static and database runners: locally in development; CI on the frozen commit |
| Sharon's nine scenarios and the per-blocker tests B1 to B6, R1 and R2, on two real connections (`selftest/balapan.ts`) | Second Eye builds them; the suite runs them | the local stack | the database runner: local; CI |
| The writer enumeration (required change 4) and its plants; the reader test (required change 1); the two "Between A2a and A2b" tests; condition 1's `ended_at` test | the same | the same | the same |
| **Scenario 8 at scale** (50,000 affected sittings; R1's skip count; R2's 5 s at p95; the activation's and the lift's work under the fence ≤ 0.5 s, §3) | the Chief Architect dispatches; Second Eye builds the job | GitHub Actions, on a runner's local stack | **a dedicated job, which does not exist today. It is its own small change** (rule 5), built and reviewed before A2a's freeze. A CI-sized variant runs in the suite |
| The journey "stop one class during Uji Penguasaan, lift it, and the class finishes with the time it had" | the Chief Architect dispatches journeys on the frozen commit; Second Eye runs it locally in development | Actions; the local stack | journeys (job A or B) |
| Daisy's screens at 390 and 320 px (her list in `A2-KATA-DESAIN.md`) | Daisy | the journeys' screenshot artifacts on GitHub, and the frozen commit | journeys' artifacts, on the frozen commit |
| Sharon's result review | Sharon | the repository at the frozen commit | read-only |
| The full pre-flight, once | Second Eye | the local stack | local, on the frozen commit |
| CI | the Chief Architect, through the pull request | Actions | CI |

**Hosted-only proof: none is needed beyond yesterday's.**
- `pg_cron` `CALL`ing a committing procedure is proven (Part 2 row 4).
- The fence's transaction model is accepted by construction (row 5), and A2A-F01 tests it.
- The timeouts are read, and §3 holds a 2.8 s margin under them, with the work measured by the scale job.
- **If Sharon wants hosted timing of the activation:** that would mean stopping one class at a test school on staging,
  a staging act. It would be its own small change after promotion, not part of A2a. It is not planned.
- **The promotion of A2a to staging** follows the existing steps: `staging.yml` applies the migrations, and the Chief
  Architect takes the preservation pair. Nothing new.

### 8 · Already on this page (the Chief Architect's checklist)

| Item | Where |
|---|---|
| Sharon's four required changes | "Sharon's pre-build review", required changes 1 to 4 |
| Row 5's condition, with its named test | §2 (A2A-F01) |
| The 8-second arithmetic | §3: 3 × 1.5 s + 2 × 0.1 s + 0.5 s = 5.2 s, under 8 s by 2.8 s; the shared side 3 s |
| The five design questions | §4 |

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
| D6.6 · The scheduled closer | A procedure committing per small batch, the shared fence inside each; selection excludes protected and held sittings in the query and uses the shifted closing time. The job text `select …` → `call …`; A1-S08, A1-S09 and the DR tests restated with notes | `pengerjaan_tutup_terjadwal`; the shared installer. ~~**Depends on checkpoint item 1**~~ *(proven on hosted staging: §1 above)* |
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

*(Superseded, 13 Nov: both items are settled. Item 1 is proven on hosted staging (§1 above, Part 2 row 4). Item 2 is
accepted by construction under Sharon's condition, stated and tested in §2, with the timeouts in §3. Kept as written.)*

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

## Friction (the owner's measure; one line, filled at the freeze)

Duration —; full verification attempts —; avoidable rework —; defects caught in development or in acceptance: —.
