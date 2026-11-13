# A2a · early read of the page, before code · `7b3b3d31191e5cff4a02823b591eea018cd4aa1f`

Sharon, 13 Nov 2026 (19:40 UTC). Read-only. The page is `docs/completion-4.1/batches/A2A-COMPLETION.md` on `claude/a2a`. The code is read on `main` at `a6b47466`.

## What holds now

- **NO BLOCKER TO BUILD the first change:** A2A-L01, its plants and exceptions, and the fix in point 3.
- **ONE BLOCKER for the emergency lift's code only.** The page must carry it before the lift is built. It is a page change, not a new round. See B1.
- **Three required changes to the test,** carried on the page: R1 to R3.
- My four required changes are carried unchanged since `3c46d521`. Since then the diff only adds text and marks superseded lines.

## B1 · BLOCKER: the window row and the fence are taken in both orders (§4 Q3, condition 1)

- `change_maintenance` takes the window row first: `select … from maintenance_windows … for update` (`20261120100000…`, :395). The page then sends its `'AKHIRI'` on an EMERGENCY window through the fenced lift. That makes the order **window → fence**.
- The lift action takes **fence → window**.
- Two lifts of one window, one from each path, deadlock (40P01). That is not `lock_not_available`, so no designed line answers it. The stop stays in force, which is safe, but the lock-order invariant is broken by design. The page's order has no rank for the window, so A2A-L01 cannot see it.
- **Required:**
  - rank `maintenance_windows` after the fence;
  - `change_maintenance` reads the window's kind without a lock, takes the fence, and only then locks the row.
- **Sweep (rule 3), the same shape:** any row that a fenced function takes before its fence, other than ranks 1 to 6 below. The protected decisions of D6.2 lock sittings, `learning_assignments` and `lesson_progress`. So the test rule is: **"the fence is the first lock after ranks 1 to 6"**, for every table, not only the ranked ones. That closes this case and every sibling.
- Could reasonably have been anticipated: yes. Q3 (locks), at my own required change 3, which ordered the fence against persons and accounts only.

## Rulings

**1 · The order: corrected.** Two rows are added from the orders already in force (L1-F4's and L1-F2's), and the window from B1:

`persons` → `account_requests` → `person_suspensions` → `auth.users` → `accounts` → `password_write_permits` → the fence → `maintenance_windows` → `assessment_sessions` (in id order)

- `hapus_data_pribadi` and `buka_kembali_akun` lock `account_requests` between the person and the suspension (`20270117200000…`, :97–105).
- The guard deletes `password_write_permits` while it holds the `auth.users` row.
- If those two tables are left unranked, a function that reverses them is invisible to the test. The placement of ranks 2, 5 and 6 is confirmed.

**2 · Foreign keys: they count (R1).**
- `FOR KEY SHARE` conflicts with `FOR UPDATE`, and `sekolah_memegang`, `akun_kunci` and the suspension take `FOR UPDATE` on these rows. So an insert after a higher rank, referring to a lower one, is one side of a real cycle.
- From `pg_constraint` the test adds:
  - inserts, and updates of a foreign-key column: `KEY SHARE` on the table referred to;
  - `ON DELETE CASCADE` and `SET NULL`: a lock on the referring table after the deleted row;
  - `INSERT … ON CONFLICT DO UPDATE` and `MERGE`, counted as an update.
- A report this produces (for example, `audit_write`'s actor) is a declared exception only with its reason.

**3 · The finding: real, the fix accepted with one addition, and the sweep accepted.**
- The finding: a password write by Auth on an email recovery at level 3 goes guard → `recovery_restore_core` → `recovery_assist_school` → `sekolah_memegang`, which takes `persons` `FOR UPDATE` while `auth.users` is held.
- Today only the planner's order of evaluating the conditions keeps it from being reached.
- **The fix:** `recovery_assist_school` becomes plpgsql, `stable`, with its grants kept. It returns null at once **when `current_person_id()` is null, or when it equals `p_person`**.
  - The second condition matters because the filter `p_person is distinct from current_person_id()` rests on the same planner order.
  - Both cases return null today, so the behaviour is preserved.
- **The engine still reports this path after the fix,** because it reads every branch together. So it stays a declared exception, backed by a two-connection test:
  - connection A holds the person `FOR UPDATE`;
  - connection B, carrying no PINTAR person, makes the level-3 recovery's password write with `lock_timeout` 1 s;
  - B must succeed;
  - plant: `sekolah_memegang` called with no early return turns it red.
- **The sweep:** no function updates `encrypted_password` except through Auth; the only one is a test plant (`20260917150000…`, :357). The four other callers of `sekolah_memegang` take the person first.

**4 · Packaging: accepted, as two commits in one change.**
- Commit 1 is A2A-L01 and its plants, with its run on `main`'s code recorded: the two reports.
- Commit 2 is the fix, its two-connection test and the declared exception.
- That keeps rule 5's purpose: the test is seen to bite before the product is touched. The scale job stays separate.

**5 · The limits.**
- Reading branches together: acceptable. It over-reports; it does not hide a lock.
- Dynamic SQL on a declared list: acceptable. Rows of one table are left to the race tests: acceptable.
- **Two places it under-reports,** now required:
  - foreign keys and upserts (R1);
  - tables outside the ranks taken before the fence (B1).
- **R2:** a trigger function starts with its table's rank held, for UPDATE and DELETE triggers. An INSERT trigger starts with nothing held. The page states this; the engine already behaves so, since it reported the guard.
- **R3:** the engine's full per-function report (the 61 lists) is committed with the test, so a later run can be compared.

**6 · My original task.**
- My four required changes: carried.
- Row 5 and A2A-F01: they meet my Part 2 condition. The repository check should cover every deployed code path, including `supabase/functions/` if it is ever added, not only `src/`. This is a note, not required.
- **The 8-second arithmetic is correct: 4.7 + 0.5 = 5.2 s.** One sentence is wrong, and one setting is required:
  - **The wrong sentence:** "a shared taker's real wait is ≤ 0.5 s". A queued exclusive waiter makes new shared takers queue behind it. Their worst case is 1.5 + 0.5 = 2.0 s, which is their full limit, so some protected decisions are refused during an activation. That is clean, but it must be counted in scenario 8, not assumed.
  - **The setting:** the fence's `lock_timeout` must be a `SET` clause on `pagar_darurat`. `set_config(…, true)` would leave 1.5 s on every later row lock in the caller's transaction.
  - A whole call over 8 s is rolled back, so it is a refusal, never a half-done act.
- **§7, hosted-only evidence: confirmed, none is missing.**
  - With the fix's two early returns, the guard path no longer depends on what Auth's connection carries.
  - Advisory locks join deadlock detection, and a `SET` clause scopes a setting; both are standard Postgres and are proven locally.
  - The 2.8 s margin is wide enough for local measurement.

## The four questions

- **And then what?** One order, enforced by the catalogue, for every lifecycle writer and every fenced one.
- **What else did that change?** `change_maintenance`'s lock order, and `recovery_assist_school`'s form.
- **What happens when it goes wrong?** A wrong order fails CI. Without B1, two lifts deadlock while the stop stays in force.
- **Can it be reversed, and what survives?** All of it is code and tests; no data changes.
