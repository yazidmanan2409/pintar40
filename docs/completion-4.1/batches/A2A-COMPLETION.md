# A2a · Emergency containment and class scope for the emergency (completion page, before build)

## State of change A (13 Nov, 21:30 UTC; kept here so that nothing depends on a session's memory)

**Branches:**
- `claude/a2a`: this page.
- `claude/a2a-change-a`: change A, built on `main` at `a6b47466`. Its head is `c446030c`.
- `claude/a2a-nokey` (`289d4865`): the reference for the deferred register item "the person `FOR NO KEY UPDATE`".
  It is left exactly as it is and never merged.
- `claude/a2a-l01` (`d748ef05`): superseded, left as it was pushed.

**The commits of change A:**
1. `f09da528`: A2A-L01, the lock-order catalogue test, its plants and its report. Red on `main`, recorded.
2. `d9bad797`: Auth's recovery password write no longer waits on a person (migration `20270118100000`). A2A-L02 is
   its two-connection proof.
3. `96f3c308`: a sitting is written after its learner (migration `20270118110000`). It covers `finalize_session` and
   nine siblings. A2A-L03 is its two-connection proof.
4. `40753420`: three defects in A2A-L01's engine. Verification tooling only.
5. `c4d53975`: the class-level declared exceptions: `audit_write` (one exception, one assertion), new `auth.users`
   rows, and the window functions ("pending B1", removed in C).
6. `c446030c`: the same-row re-locks, declared one by one. Each names its variable and carries a condition on the
   writer's own lock list.

**What is green, and what is red:**
- **Green:** A2A-L02 and A2A-L03, each red with its plant; the two migration pins at 246; typecheck and lint.
- **Red:** A2A-L01, with 3 breaches (232 before the exceptions). The 3 are **a new finding, not fixed**: "The
  permit's key on `auth.users`", below.
- No full pre-flight has been run.

**Waiting on whom:**
- **Sharon:** her ruling on commit 3, which changes the locking of ten functions. No more product code is changed in
  change A until she has read it.
- **The Chief Architect and Sharon:** the new finding. Fix it in change A, declare it, or carry it.
- **The Chief Architect:** the freeze of change A. There is no pre-flight and no dispatch before it.

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

**The early reads of `7b3b3d31`, carried below where each belongs.**
- Sharon: `A2A-EARLY-READ-7b3b3d31.md` on `claude/gracious-lamport-0m1qjr` at `1b919c92`.
- Daisy: `A2A-BACA-AWAL-7b3b3d31.md` on `ux-1/daisy-experience` at `6a2055dd`.

| From | What | Where now |
|---|---|---|
| Sharon B1 (blocker, the lift only) | the window row and the fence were taken in both orders | §4 Q3; §6's order; condition 1 |
| Sharon rulings 1 to 5 | the corrected order; foreign keys count; the fix with its addition and its two-connection test; two commits; R1 to R3 | §6 |
| Sharon, §3 | a shared taker's worst wait is 2.0 s, not 0.5 s; the fence's timeout is a `SET` clause | §2, §3 |
| Daisy 1a (blocker, page only) | THE PLAN §5.3 F items 1 to 6, exact text | §5 |
| Daisy 1b (blocker, page only) | the fence refusal's line; the learner's existing retry path | §3, §5 |
| Daisy §2 | the activation refusal's whole line; her ten screens | §3, §7 |
| Daisy §3 | she cannot open Actions artifacts: screenshots go on a branch | §7 |
| The Chief Architect | the scale job's four limits | §7, Size |

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

~~**Built as one fence function** … `public.pagar_darurat(p_eksklusif boolean)` … It sets its own lock timeout.~~
*(Superseded by Sharon's required setting, early read §6: the timeout is a `SET` clause, not `set_config(…, true)`,
which would leave the short timeout on every later row lock in the caller's transaction. A `SET` clause holds one
value per function, and the two sides need two values, so there are two functions on one key.)*

**Built as two fence functions on one fixed key**, so there is one place to read:
- `public.pagar_darurat_eksklusif()`, `security definer`, **`set lock_timeout = '1500ms'`**: takes
  `pg_advisory_xact_lock`. Used by the activation and the lift.
- `public.pagar_darurat_bersama()`, `security definer`, **`set lock_timeout = '2s'`**: takes
  `pg_advisory_xact_lock_shared`. Used by every protected decision and each of the closer's batches.
- The `SET` clause applies only while the function runs; the transaction-level lock it takes lasts to the end of the
  transaction. The caller's own `lock_timeout` is untouched.
- **Every fenced decision calls one of them as its first lock after the lifecycle ranks** (§6's rule: no other row
  before the fence).

**The test, A2A-F01 · "the fence is taken only inside the database":**
1. **From the catalogue:**
   - exactly two functions take an advisory lock on the fence key: `pagar_darurat_eksklusif` and
     `pagar_darurat_bersama`, each with its `SET lock_timeout` clause;
   - every function and procedure that calls one of them is one of three kinds: an RPC (`EXECUTE` granted to
     `authenticated`, never to `anon`), the closer procedure, or a trigger function on a table that clients write only
     through such RPCs;
   - none of them is granted to `anon`.
2. **From the repository:**
   - no deployed code path imports a database driver (`pg`, `postgres`), names a pooler address or port (`:6543`,
     `pooler.supabase.com`), or calls `pg_advisory`: `src/` today, and `supabase/functions/` if it is ever added
     (Sharon's note, early read §6);
   - no migration takes an advisory lock on the fence key outside the two fence functions.
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
- **Each fence function carries its own `lock_timeout` as a `SET` clause, never the session's** (§2). The value
  depends on which side takes it:

| Who takes the fence | Mode | `lock_timeout` | Attempts | Worst wait | Its own work under the fence | Worst total | Under 8 s by |
|---|---|---|---|---|---|---|---|
| The activation (`stop_pintar_now`) | exclusive | 1.5 s | 3, with 100 ms between, each in a subtransaction (`lock_not_available` is caught) | 3 × 1.5 + 2 × 0.1 = **4.7 s** | the window row, `T_stop`, the audit row: budget **0.5 s**; the marking runs after, in its own batches (D6.7) | **5.2 s** | **2.8 s** |
| The lift (fenced, through `change_maintenance … 'AKHIRI'` and the lift action) | exclusive | 1.5 s | 3 | 4.7 s | `T_lift`, the window's end, the audit row: 0.5 s | 5.2 s | 2.8 s |
| A protected decision (D6.2's table) | shared | 2 s | 1 | **2.0 s** (below) | its own work, as today: the slowest, `finalize_session`, budget 1 s | **3.0 s** | **5.0 s** |
| The closer, each batch (`pg_cron`, as `postgres`: no role timeout) | shared | 2 s | 1; a batch that waits longer is left for the next run, and the skip is counted (R1) | 2 s | one small batch | — | not bound by 8 s |

- ~~**The exclusive side holds the fence only for its own work** (≤ 0.5 s). So a shared taker's real wait is that, not
  its 2 s limit.~~ *(Wrong; Sharon, early read §6.)*
- **A shared taker's worst wait is 2.0 s, its whole limit.**
  - While an exclusive request is queued, a new shared request queues behind it.
  - The exclusive request waits up to 1.5 s for the shared holders already in, then holds the fence for its work
    (≤ 0.5 s): 1.5 + 0.5 = **2.0 s**.
  - So during an activation or a lift, **some protected decisions are refused.** That is clean: the act is not done,
    with Daisy's line (below). The refusals are **counted in scenario 8**, not assumed away.
- **The arithmetic still holds under the timeouts:**

  | Side | Worst total | Under 8 s by |
  |---|---|---|
  | The exclusive side | 3 × 1.5 + 2 × 0.1 + 0.5 = **5.2 s** | 2.8 s |
  | A shared taker | 2.0 + 1.0 = **3.0 s** | 5.0 s |

  Between the activation's attempts the exclusive request leaves the queue, so the shared requests behind it go
  through.
- **A whole call over 8 s is rolled back** (`statement_timeout`), so it is a refusal, never a half-done act.
- **When the activation gets no fence** after three attempts, it refuses with THE PLAN §5.3 F's whole line: «Penghentian
  belum berlaku. Tidak ada yang dihentikan. Coba lagi.» *(Corrected: Daisy, early read §2; the last words were
  missing.)* The lift refuses with Daisy's «Penghentian belum diakhiri. Tidak ada yang berubah. Coba lagi.»
- **When a shared taker gets no fence,** it refuses with its own code in A1's domain, and with Daisy's line (early read
  1b), never the stopped-class refusal, because the class may not be stopped at all:
  - ID: «PINTAR sedang memproses penghentian atau pembukaannya, jadi ini belum dapat dilakukan. Tidak ada yang diubah.
    Coba lagi sebentar lagi.»
  - EN: «PINTAR is processing a stop or its end, so this cannot be done yet. Nothing was changed. Try again in a
    moment.»
  - **A learner's save or hand-in that meets it takes the player's existing retry path.** «Tersimpan» does not appear
    until the answer is accepted. No new learner line.
- **Measured, not assumed:**
  - the activation's and the lift's work under the fence is timed in the scale job (scenario 8, 50,000 sittings), and
    must stay under 0.5 s;
  - the stop's wait on the fence is measured there as well, and so are the shared takers refused while it waits.
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
   - **the order is §6's** (Sharon's corrected order, early read ruling 1): persons → `account_requests` →
     `person_suspensions` → `auth.users` → `accounts` → `password_write_permits` → the fence → `maintenance_windows` →
     sittings in id order;
   - **`change_maintenance` on an EMERGENCY window** (Sharon's B1) reads the window's kind without a lock, takes the
     fence, and only then locks the window row. Before this, it took the row first and then the fenced lift: window →
     fence on one path, fence → window on the lift's, so two lifts of one window could deadlock (40P01);
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

**And THE PLAN §5.3 F items 1 to 6, carried exactly as THE PLAN has them** (`THE-PLAN.md` on
`claude/bob-41-master-plan` at `17cf4a7e`; Daisy's early-read blocker 1a). In Indonesian and English, in `hle.ts`:

| THE PLAN §5.3 F | Where it renders | Key | Text |
|---|---|---|---|
| Item 1, during the stop: **replaces** today's sentence «Bila waktunya habis selama penghentian, beri tahu guru Anda.», which D-1 makes false (a held sitting loses no time) | the pause page | `pemeliharaan.darurat.asesmen` | «Penghentian ini tidak mengumpulkan dan tidak menilai asesmen yang sedang dikerjakan. Asesmen itu ditahan bersama jawaban yang sudah tersimpan dan sisa waktunya. Setelah PINTAR kembali, buka lagi asesmen tersebut; sisa waktunya sama seperti saat dihentikan.» · EN «This stop does not submit or score an assessment that was in progress. It is held with the answers already saved and the time that was left. When PINTAR is back, open that assessment again; the time left is what it was when the stop began.» |
| Item 2, after the lift, for a learner whose sitting was held | «PINTAR dapat digunakan» | `pemeliharaan.kembali.*` | «Asesmen yang ditahan selama penghentian dapat dibuka lagi. Jawaban yang sudah «Tersimpan» tetap ada, dan sisa waktunya sama seperti saat dihentikan.» · EN «An assessment held during the stop can be opened again. Answers that showed «Saved» are still there, and the time left is what it was when the stop began.» |
| Item 3, on reopening the sitting, `role="status"` | the player | new | «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: {n} menit.» · EN «This assessment was held during the stop. Your time left: {n} min.» |
| Item 4, the new refusals | each act's result line | new | A teacher's act on a stopped class: «Kelas {kelas} sedang dihentikan oleh Admin PINTAR. Tindakan ini dapat dilakukan setelah penghentian diakhiri. Tidak ada yang diubah.» · EN «Class {kelas} has been stopped by an Admin PINTAR. This can be done once the stop has ended. Nothing was changed.» Ending or withdrawing an assignment (O1): «Penugasan ini tidak dapat diakhiri atau ditarik selama penghentian. Tidak ada yang diubah.» · EN «This assignment cannot be ended or withdrawn during a stop. Nothing was changed.» The promotion run (M-1): «Kenaikan kelas belum dapat diterapkan: asesmen {n} murid sedang ditahan karena penghentian. Coba lagi setelah penghentian diakhiri.» · EN «The promotion cannot be applied yet: {n} students' assessments are on hold because of the stop. Try again once the stop has ended.» The activation that did not take effect: «Penghentian belum berlaku. Tidak ada yang dihentikan. Coba lagi.» · EN «The stop has not taken effect. Nothing was stopped. Try again.» *(The start refused before a window is A2b's D4.)* |
| Item 5, the teacher's list during a stop, with no «Atur»; after the lift the row returns to its live state with no notice | `/mengajar/[kelas]/siapa` | new | «Ditahan · dilanjutkan setelah penghentian diakhiri» · EN «On hold · continues once the stop has ended». A suspension-held sitting keeps A1's «Ditahan · menunggu keputusan Anda» |
| Item 6, one name for the role | `pemeliharaan.darurat.arti` | existing | «Admin PINTAR» in place of «Admin platform» |

**And the fence refusal** (Daisy, early read 1b), for an admin's or a teacher's act in the moment a stop or a lift
takes effect: the line in §3.

- **Her check for the page:** a failed status read is never taken as "no stop". The open player keeps its existing
  behaviour on a failed read, and the next request shows the pause page.
- A2b's sections (B1 to B3) are A2b's.

### 6 · The lock-order safeguard (the owner's decision after the 4.0 look-back; Sharon's catalogue test)

**Why it is here.**
- 4.0 declared no lock order for a person's rows, and each function took them in its own order.
- L1-F2 and L1-F4 each found a cycle by review, and each cost a block and a rework round.
- Sharon's required change 3 above is the third time the order has had to be written down.
- This test makes the order permanent, under working rule 3 ("a defect is swept for its siblings").

**The order, as Sharon corrected it** (early read, ruling 1; superseding the six-rank table that stood here):

| Rank | What | Why there |
|---|---|---|
| 1 | `persons` | |
| 2 | `account_requests` | `hapus_data_pribadi` and `buka_kembali_akun` take it between the person and the suspension (L1-F4) |
| 3 | `person_suspensions` | the reinstatement takes it after the person and the request |
| 4 | `auth.users` | |
| 5 | `accounts` | |
| 6 | `password_write_permits` | the password guard deletes it while it holds `auth.users` |
| 7 | the fence | required change 3 |
| 8 | `maintenance_windows` | Sharon's B1: after the fence |
| 9 | `assessment_sessions` | the sittings, in id order within the table |

**And one rule for every table, not only the ranked ones** (Sharon's B1, its sweep): **the fence is the first lock
after ranks 1 to 6.** A fenced function that locks any other row before its fence fails. That covers
`maintenance_windows`, and every sibling: D6.2's acts lock sittings, `learning_assignments` and `lesson_progress`.

**Sharon's three required changes to the test** (early read §5):
- **R1, foreign keys count** (ruling 2), added from `pg_constraint`:
  - an insert, and an update of a foreign-key column, take `FOR KEY SHARE` on the table referred to;
  - `ON DELETE CASCADE` and `SET NULL` take a lock on the referring table after the deleted row;
  - `INSERT … ON CONFLICT DO UPDATE` and `MERGE` count as updates.

  A report this produces (for example `audit_write`'s actor) is a declared exception only with its reason.
- **R2, triggers:** an UPDATE or DELETE trigger function starts with its table's rank held; an INSERT trigger starts with
  nothing held.
- **R3, the report:** the engine's full per-function list is committed with the test, so a later run can be compared
  with it.

**The test: A2A-L01 · "the account lifecycle takes its rows in one order"** (the database runner).
1. **From the catalogue, never a list of names:**
   - it reads every function and procedure in `public`, and every trigger function on the four tables;
   - functions A2a and A3 add fall under it the day they land.
2. **For each function, the ordered list of row locks it takes on the nine ranks** (and, for the "fence first" rule, on
   every table):
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
   - (P2) `akun_kunci` with its `auth.users` and `accounts` locks swapped turns it red. *(Corrected: it runs inside the
     test's own rolled-back transaction, like P1, because `scripts/dev/plants.mjs` drives only the SQL suites. Postgres
     DDL is transactional, so the plant replaces the real function there and nowhere else);*
   - (P3, once the fence exists) a fenced function that locks `accounts` after the fence turns it red.

**What it does not establish** (said here, so a green run is not over-read):
- **Branches:** it reads every branch of a function in text order together. It may over-report, never under-report,
  for straight-line code. An over-report is resolved by reading the function and, if the order is in fact safe, by a
  declared exception with its reason.
- ~~**Foreign keys:** … listed as a limit; Sharon rules whether it counts.~~ *(Ruled: they count, R1 above.)*
- **Order between rows of one table** (sittings in id order, accounts in id order) is proven by the two-connection
  race tests (`selftest/balapan.ts`), not here.

**Sittings, the fence and the window are covered** by the same lists (ranks 7 to 9). So required change 3's structural test (no
lock of a person or an account after the fence) is this test's rank rule, not a second test.

**If it finds an existing writer out of order**, that is a real defect:
- swept first, for every sibling;
- the smallest fix proposed here;
- if the fix would change approved account-lifecycle behaviour, stopped and taken to the Chief Architect.

**What the corrected engine reports on `main`'s code** (change A, commit 1, `claude/a2a-change-a` at `f09da528`;
the red run in `selftest/a2a-l01-merah-main.txt`, the per-writer report in `selftest/a2a-l01-laporan.txt`). **A new
finding, put here before anything is fixed** (the Chief Architect's instruction). Nothing in it is fixed.
- **The engine first found three errors of its own**, fixed before its reading was trusted:
  - `auth.*` names were read as a table called `auth`, which lost every real `auth.users` lock;
  - foreign-key checks were placed before BEFORE triggers (Postgres runs them as AFTER triggers);
  - a call's arguments were read after the call.
- **It reads 216 writers, and reports 62 breaches: 56 out of order, 6 upgrades.** By cause:

| Cause | Breaches | Reading |
|---|---|---|
| A foreign key's `FOR KEY SHARE` on a person after a higher rank, **through `audit_write`** | 30 | **Over-reports in ordinary use.** `audit_log`'s only foreign keys are `evaluation_actor_person_id` and `evaluation_session_id`. `audit_write` fills them only while the acting user is a persona in an open evaluation session (the synthetic human-evaluation feature). Otherwise they are null, and a null foreign key takes no lock. A declared exception with that reason, and with a condition the test checks, is the proposal |
| A re-lock of a row the function already holds (the attachment guards' `FOR SHARE` on the person; `sesi_akhiri_orang`'s `KEY SHARE` on the `auth.users` row `akun_kunci` or Auth already holds; the reinstatement; the deletion) | about 11 | **Harmless when it is the same row, and in each one read it is.** The engine reads tables, not rows |
| A new `auth.users` row (Auth's insert, `handle_new_auth_user`) | 2 | Harmless: no one else can see the row |
| Auth's recovery password write → `sekolah_memegang` | 3 | **The known finding.** Closed by commit 2 |
| The window functions (`change_maintenance`, `publish_notice`, the list): the actor's foreign key after the window row | about 4 | No reverse path found. `change_maintenance`'s order changes under B1 anyway |
| **A person's `KEY SHARE` after a sitting:** `finalize_session`, `terminate_session`, `lanjutkan_pengerjaan`, `tutup_pengerjaan_ditahan`, `open_assessment_session`; and the six upgrades (`KEY SHARE`, then `FOR SHARE` or `FOR UPDATE`, on a person) | about 12 | **Possibly real, inherited (4.0 and A1), not yet read to the end.** Where the foreign key is the sitting's own learner, a suspension of that learner (person `FOR UPDATE` → their sittings) can deadlock with it. Postgres detects that and aborts one side with 40P01: one act fails with an error, nothing is lost. **This is the shape A2a's fence and held sittings sit in** |

- **The sweep's common cause:** 15 functions take `persons` `FOR UPDATE`, and a foreign key's `KEY SHARE` conflicts
  with exactly that:
  - `akhiri_tugas_staf`, `aktifkan_kembali_akun`, `buka_kembali_akun`, `confirm_my_name`, `correct_person_name`;
  - `daftarkan_kembali`, `enrol_for_professional_learning`, `enrollments_programme_alone`, `hapus_data_pribadi`;
  - `issue_institutional_id`, `kenaikan_tetapkan`, `minta_akun`, `sekolah_memegang`, `tangguhkan_akun`, `ubah_peran`.
- **The smallest fix that covers the whole class at its source, proposed and NOT built:** those 15 take the person
  `FOR NO KEY UPDATE` instead of `FOR UPDATE`.
  - A person's key never changes, and no person is ever deleted (`persons_no_delete`).
  - `FOR NO KEY UPDATE` still excludes every other lifecycle act, because it conflicts with itself, with `FOR SHARE`
    and with `FOR UPDATE`. L1-F2's and L1-F4's designed serialisation (the guards' `FOR SHARE`) is kept.
  - What stops is only a foreign-key check waiting on a lifecycle act. So every cycle of this shape is gone, and the
    test could prove it from the catalogue, without exceptions: "a `KEY SHARE` on a table that no function locks
    `FOR UPDATE` and nothing deletes cannot wait".
  - **It changes approved account-lifecycle locking in 15 functions.** That is beyond change A. Under the Chief
    Architect's rule it is stopped here, for him and Sharon. L1-F2's page names the foreign key `FOR KEY SHARE` as one
    of the incidental serialisers of account creation against suspension; the designed one stays.
- **Until that decision:** change A's commit 2 (the recovery fix and its two-connection test) can be built as ruled.
  A2A-L01 stays red on the other reports, which is correct in development, and no freeze is possible while it is.

**The possibly-real reports, read to the end and raced on two connections** (the Chief Architect, 13 Nov: "a
reproduced deadlock is evidence; a reading is a claim"):

| Function | The later lock, and whose person row | Real, or an over-report | Reproduced |
|---|---|---|---|
| `finalize_session` (and every path that finalizes: submit, deadline, the closer) | the result row's `person_id`: **the sitting's own learner** (`KEY SHARE`), after the sitting `FOR UPDATE` | **Real.** A suspension of that learner takes the learner, then their open sittings | **Yes: deadlock detected,** against the real `tangguhkan_akun` (the draft's A2A-L03, red without the draft; change A's own A2A-L03, below, races the real `finalize_session`) |
| `terminate_session`, `tutup_pengerjaan_ditahan`, `lanjutkan_pengerjaan` | `terminated_by`, `closure_by`, `unfrozen_by`: **the actor** | Over-report: the actor's suspension never holds this learner's sitting | no (no cycle to race) |
| `open_assessment_session` | the new sitting's `person_id`: the learner, already held `FOR SHARE` by the same function | Over-report: the same row | no |
| `certificate_prepare`, `sertifikat_koreksi_siapkan` (upgrade `KEY SHARE` → `FOR SHARE`) | the same person | **Safe:** Postgres lets the holder strengthen to `FOR SHARE` past a `FOR UPDATE` waiter | **Yes, no deadlock** (two connections) |
| `move_learner_to_class`, `record_integrity_review`, `recovery_by_pin`, `transfer_execute` (upgrades) | the first `KEY SHARE` is `audit_write`'s, whose keys are null outside evaluation | Over-report | the shape `KEY SHARE` → `FOR UPDATE`, twice at once, **does** deadlock (two connections); these four do not take that first lock |
| Auth's recovery password write (commit 2) | `sekolah_memegang` `FOR UPDATE` on the person, while Auth holds `auth.users` | **Real, and reachable on `main`**, not latent as this page said: the planner does evaluate it | **Yes:** on `main` the write waited and timed out (A2A-L02 without the fix) |

**A second real class, hidden until now.** The test reports only the first breach of each function. With the draft
applied (`claude/a2a-nokey` at `289d4865`), the foreign-key reports fall away, and later breaches show (59 → 22, in
`selftest/a2a-l01-merah-nokey.txt`):
- `akhiri_pendaftaran`, `kenaikan_tetapkan` and `transfer_execute` close a learner's open sittings (`tutup_asesmen_terbuka`
  → finalize) **before** they lock the learner (through `enrollments_programme_alone`, or a guard's `FOR SHARE`). A
  suspension takes the learner, then the sittings: the reverse.
- `minta_percobaan` takes the learner `FOR SHARE` after locking a sitting.
- These are full-strength locks, not foreign keys: **real by reading, not yet raced.** The draft does not cover them.
  Their fix is an order change in those functions (the person first), not a lock strength. It is not built, and it
  is for the Chief Architect and Sharon.
- The rest of the 22 are the classes above: same-row re-locks and new rows. With a ruling, they would become declared
  exceptions, each with its reason.

**Sharon's ruling on these reports** (`A2A-L01-FINDING-f09da528.md` at `09f1706c`), carried in change A:
- **Commit 3, `96f3c308`: a sitting is written after its learner** (migration `20270118110000`).
  - `finalize_session` takes its learner `FOR KEY SHARE` as its first lock, before the deadline update.
  - **A2A-L03**, two real connections:
    - A takes the learner `FOR UPDATE`, then the learner's sittings by `pengerjaan_tahan_orang`'s own query;
    - B runs the real `finalize_session` of a sitting past its deadline;
    - on 245's code: **"deadlock detected"**; with the fix, B waits for A, then finishes;
    - its plant (the first locks removed) turns it red again.
  - **The sweep for siblings found the same shape in nine more, fixed in the same shape, same commit:**
    - `pengerjaan_putus_tenggat` (every finalizing path passes through it);
    - `akhiri_pengerjaan`, `tambah_waktu_pengerjaan`, `pengerjaan_tutup_terjadwal`, `tutup_asesmen_terbuka`;
    - `akhiri_penugasan` (its learners, in id order);
    - `terminate_session` (see below), all `FOR KEY SHARE`;
    - `minta_percobaan` `FOR SHARE`, because it takes `FOR SHARE` later, so there is no upgrade;
    - `akhiri_pendaftaran` `FOR UPDATE`, because its enrolment trigger takes `FOR UPDATE` later. This is the second
      real class above.
  - **Read, not changed:** `kenaikan_tetapkan` and `transfer_execute` already hold the learner `FOR UPDATE` before they
    close sittings.
- **Commit 4, `40753420`: three defects in the engine**, found by that sweep. Verification tooling only.
  - It reported only the first breach of each writer, so a declared exception would have hidden the ones after it.
    It now reports every breach.
  - A lock list read under a call cycle was memoised without the cut caller's locks. That was an under-report.
  - It read the catalogue in scan order. Triggers now fire in Postgres's name order, and the report is the same on
    every read.
- **The over-reports, one line each:**
  - `terminate_session`: **not confirmed.** Nothing stops the actor being the sitting's own learner: a system admin
    can end their own professional-learning sitting. **So it is fixed in commit 3.**
  - `lanjutkan_pengerjaan`, `tutup_pengerjaan_ditahan`: the `KEY SHARE` is the actor's. Besides, both write only a
    held (frozen) sitting, which the hold does not take (`pengerjaan_ditahan_periksa`). Confirmed.
  - `open_assessment_session`, `start_learning_session`: **confirmed.** The first lock is the learner `FOR SHARE`,
    taken by the new sitting's insert trigger (`orang_lampiran_jaga` on `NEW.person_id`). The `person_suspensions`
    key is `frozen_suspension_id`, which is null on a new sitting.
  - The five `KEY SHARE` → `FOR SHARE` upgrades: compatible. The holder may strengthen past a `FOR UPDATE` waiter;
    raced, no deadlock.
  - `transfer_execute`: its first `KEY SHARE` is `audit_write`'s, which is null outside evaluation.
- **Still open before change A is green:** A2A-L01 now lists all 232 breaches.
  - 128 are through `audit_write`: one declared exception, with its `pg_proc` assertion.
  - 104 are at about 48 lock sites, each read one by one: the same-row re-locks naming their variable, the new
    `auth.users` rows, and the window functions.

**New finding, not fixed: the permit's key on `auth.users`** (commit 6; the Chief Architect's rule: listed, not raced,
not fixed).
- `password_write_permit`, `recovery_grant_permit` and `authorize_card_reissue` each lock the account (`FOR SHARE`,
  or `FOR UPDATE`). They then insert `password_write_permits`, whose foreign key takes that account's `auth.users` row
  `FOR KEY SHARE`. The row is not held first, so this is `auth.users` (rank 4) after accounts (rank 5).
- **The reading:**
  - `KEY SHARE` waits only on `FOR UPDATE` or `DELETE` of that `auth.users` row. Auth's ordinary writes are
    non-key updates, and do not conflict with it.
  - A cycle needs a transaction that deletes the auth user (or takes it `FOR UPDATE`) and then reaches that account
    while one of these holds it. Auth's deletion of a user, cascading to the account, would be one.
  - Not raced.
- **The smallest fix, not built:** each takes the `auth.users` row `FOR KEY SHARE` before the account (the
  person-first shape, one rank down).

**Deferred register item: the person `FOR NO KEY UPDATE`** (Sharon, `A2A-L01-FINDING-f09da528.md`).
- **The draft:** the 15 functions above would take the person `FOR NO KEY UPDATE` instead of `FOR UPDATE`.
- **Deferred, for Sharon's reason:** it loses the serialisation of inserts into the exempt (BEBAS) tables against the
  lifecycle acts. The deletion's scrub could then miss a row committed just after it.
- **Its branch:** `claude/a2a-nokey` at `289d4865` was pushed before the instruction not to create it was read.
  - It is not merged, and nothing is built on it.
  - It is left as it is until the Chief Architect says whether to delete it.
- The fix of record is the person-first order (commit 3).

**The branches:**
- `claude/a2a`: this page.
- `claude/a2a-change-a`: change A, `f09da528` … `c446030c` (six commits; the state above).
- `claude/a2a-nokey`: the deferred register item's reference (above); left exactly as it is, never merged.
- *`claude/a2a-l01` (`d748ef05`) is superseded by `claude/a2a-change-a` and left as it was pushed.*

**It is built first, as its own change** (working rule 5: verification tooling never travels with a product
change). It is green or red on `main`'s code before any of A2a's product changes is made.

**As two commits in one change** (Sharon, ruling 4):
1. A2A-L01, its plants and its report, **with its red run on `main`'s code recorded**.
2. The fix, its two-connection test and the declared exception.

The test is seen to bite before the product is touched. *(The first build, `claude/a2a-l01` at `d748ef05`, put both in
one commit. It is kept as it was pushed, and superseded by the two-commit change.)*

**What a prototype of the engine found on `main`'s code** (13 Nov, the local stack at `a6b47466`; the prototype is a
scratch script, not committed):
- It read 745 functions; 61 lock one of the ranked tables, directly or through what they call or fire.
- Their lists match the order L1-F2 and L1-F4 set. For example:
  - `tangguhkan_akun`: persons → `auth.users` → accounts → sittings;
  - `aktifkan_kembali_akun`: persons → suspensions → `auth.users` → accounts.
- The two plants were caught: a function locking accounts then persons, and a weaker-then-stronger lock on one person.
  Both were dropped afterwards.
- **Two reports, one cause:** Auth's password write fires `auth_password_write_guard` while holding the `auth.users`
  row. On an email recovery with the recovery ladder at level 3, that guard calls `recovery_restore_core` →
  `audit_write(…, recovery_assist_school(…))` → `sekolah_memegang`, which takes the person `FOR UPDATE`. That is
  **`auth.users` → persons, against the order.**
  - ~~**Not reached today:** … only the planner's order of evaluation makes that so.~~ *(Wrong, shown by A2A-L02: on
    `main`, Auth's recovery password write waited on a held person and timed out. The planner does evaluate
    `sekolah_memegang` there. The path is reachable today, and change A's commit 2 closes it.)*
  - **The second report is a false positive:** `hapus_data_pribadi` updates `auth.users`, but it never changes the
    password, so the guard returns at once. That is a branch the engine reads together with the rest: a declared
    exception, with that reason.
  - **The sweep for siblings** (rule 3):
    - `sekolah_memegang` has four other callers, `authorize_account_activation`, `authorize_card_conversion`,
      `authorize_card_reissue` and `authorize_email_correction`;
    - each takes the person `FOR UPDATE` through it before anything else, so in order;
    - none upgrades a weaker lock;
    - the only other dynamic SQL naming these tables is `assemble_session` (sittings only), declared.
  - **The smallest fix, accepted by Sharon with one addition** (early read, ruling 3):
    - `recovery_assist_school` becomes plpgsql, `stable`, with its grants kept;
    - it returns null at once **when `current_person_id()` is null, or when it equals `p_person`**. The second
      condition matters because the filter `p_person is distinct from current_person_id()` rested on the same planner
      order;
    - both cases return null today, so the behaviour is preserved.
  - **It stays a declared exception,** because the engine reads every branch together and still sees the call. It is
    backed by a two-connection test:
    - connection A holds the person `FOR UPDATE`;
    - connection B, carrying no PINTAR person, makes the level-3 recovery's password write with a 1 s `lock_timeout`;
    - B must succeed;
    - plant: `sekolah_memegang` reached with no early return turns it red.
- **One rule added to the test from the sweep:** a weaker lock followed by a stronger one on the same table (`FOR
  SHARE`, then `FOR UPDATE` or an `UPDATE`) fails. Two such transactions on one row deadlock with each other. Today
  there are none.

### 7 · Acceptance evidence (working rule 1: named before building)

| What proves it | Who runs it | With what access | Where |
|---|---|---|---|
| A2A-L01 and its plants; A2A-F01 and its plants (§2) | Second Eye builds them; the suite runs them | the repository; the local stack | the static and database runners: locally in development; CI on the frozen commit |
| Sharon's nine scenarios and the per-blocker tests B1 to B6, R1 and R2, on two real connections (`selftest/balapan.ts`) | Second Eye builds them; the suite runs them | the local stack | the database runner: local; CI |
| The writer enumeration (required change 4) and its plants; the reader test (required change 1); the two "Between A2a and A2b" tests; condition 1's `ended_at` test | the same | the same | the same |
| **Scenario 8 at scale** (50,000 affected sittings; R1's skip count; R2's 5 s at p95; the activation's and the lift's work under the fence ≤ 0.5 s, §3; the shared takers refused while it waits, counted) | the Chief Architect dispatches, once, on A2a's frozen commit; Second Eye builds the job | GitHub Actions, on the runner's own local stack | **change (B): a dedicated job, which does not exist today**, built and reviewed before A2a's freeze, within the four limits below. A CI-sized variant runs in the suite |
| The journey "stop one class during Uji Penguasaan, lift it, and the class finishes with the time it had" | the Chief Architect dispatches journeys on the frozen commit; Second Eye runs it locally in development | Actions; the local stack | journeys (job A or B) |
| Daisy's ten screens (below) | Daisy | **the screenshots committed to `docs/completion-4.1/batches/a2a-layar/` on the frozen commit's branch.** She cannot open Actions artifacts: the download goes to an Azure blob host her proxy refuses, and the host varies per run (her early read §3). Committed by Second Eye after the freeze's verification, as a documentation-only commit, not a code change | the repository |
| Sharon's result review | Sharon | the repository at the frozen commit | read-only |
| The full pre-flight, once | Second Eye | the local stack | local, on the frozen commit |
| CI | the Chief Architect, through the pull request | Actions | CI |

**Daisy's ten screens** (her early read §2), each at 390 and 320 px, and item 3 also at 1280:
1. the emergency form with a class chosen, by keyboard, with the person-level hint and the impact sentence;
2. the node refusal;
3. the pause page for a learner of the class;
4. the pause page for a teacher who also teaches another class (the other-class line);
5. the player on reopening after the lift (item 3's line, with the time left);
6. «PINTAR dapat digunakan» after the lift (item 2);
7. the teacher's list during the stop (item 5);
8. the list row and «Akhiri penghentian», with its confirmation and result line, as an Admin PINTAR;
9. the same row as the school's own admin («Hanya Admin PINTAR …»), with nothing else showing;
10. the refused lift.

**The scale job (change B): its four limits** (the owner's condition, through the Chief Architect, 13 Nov):
1. **Tied to an existing requirement.** It measures only scenario 8 of Sharon's accepted nine, and only the numbers
   already on this page:
   - R1's skip count;
   - R2's 5 s at p95;
   - the activation's and the lift's work under the fence, ≤ 0.5 s (§3's input);
   - with Sharon's correction, the shared takers refused while the exclusive side waits, counted.

   No new measurement, no new threshold.
2. **Bounded.** Dispatch only. Synthetic data on the runner's own local stack, never staging, never production. One
   job with a hard timeout of 20 minutes. It reads no secret beyond what CI already uses, and it fails on any of the
   numbers.
3. **Small.** It reuses the existing harness (`selftest/balapan.ts`, and the local stack set-up CI already does): one
   script and one workflow, or one job added to an existing workflow if that is smaller. If it needs a new framework
   or more than a few hundred lines, Second Eye stops and tells the Chief Architect before building it.
4. **Not part of the per-push CI.** The Chief Architect dispatches it once, on A2a's frozen commit.

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
| 1 | **A2a owns every path that ends an emergency.** `change_maintenance(…, 'AKHIRI', …)` can end an EMERGENCY window today; in A2a it goes through D6's fenced lift, **taking the fence before it locks the window row** (Sharon's B1, early read). A2b's extend and resume early apply to PLANNED windows only. *Test:* every function that sets `ended_at` on an EMERGENCY window takes the fence; it joins D6.2's enumeration | `change_maintenance` with `AKHIRI` on an EMERGENCY window calls the fenced lift (exclusive fence, `T_lift` read under it, then commit; release afterwards). The enumeration test lists every function that writes `maintenance_windows.ended_at` and requires the fence for an EMERGENCY row |
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

## Size, in development (the Chief Architect's packaging, 13 Nov: three changes)

- **(A) A2A-L01**, with its plants, its declared exceptions and the `recovery_assist_school` fix: ~~about half a day~~
  **about one day.** A first build exists (`claude/a2a-l01` at `d748ef05`, four plants, red then green). Sharon's
  early read adds:
  - R1, the foreign keys, cascades and upserts;
  - R2 and R3;
  - the window rank, and the "fence first" rule for every table;
  - the fix's second condition;
  - the two-connection test with its plant.

  **The risk:** R1 may report new paths on `main`'s code. Each would be swept and brought to the Chief Architect before
  it is fixed, not fixed inside (A).
- **(B) the scale job for scenario 8:** **about half a day**, within its four limits (§7).
- **(C) A2a's product changes:** **about three days**, as estimated above, without (A) and (B).

**Accepted in principle (the Chief Architect, 13 Nov):** the catalogue enumeration of the readers of
`closure_deadline`, `closes_at` and the grace, built before any of D6.3, as its own small commit inside (C), reviewed
early. It is product-adjacent tooling.

**The single most likely thing to go wrong in (C): D6.3's one time rule.**
- Every reader of a sitting's closing time must add the protected interval. That means the effective deadline, the
  window-timed `closes_at`, the grace and late sync, the closer's selection, the teacher's list and the player.
- **Missing one re-times or ends a sitting silently**, and only scenarios B3, B4 and B5 would show it.
- **So, before any of D6.3 is written:** the same catalogue enumeration as the writers', but for the readers of
  `closure_deadline`, `closes_at` and the grace, each classed as shift-aware or not. That turns a missed reader into a
  red test, not a finding at acceptance.

## Friction (the owner's measure; one line, filled at the freeze)

Duration —; full verification attempts —; avoidable rework —; defects caught in development or in acceptance: —.
