READY FOR GATE: CI #239 (run 36575178181) green on 651b160a0907d967469617efdfa11fec097eb755

# Bob → coordinator: BOB-41 (a question-health review can be concluded)

**SHA:** `3fef67c`, its own commit, on top of BOB-40, and `adae662`, a follow-up to it (below).
- **Manifest:** BOB41-K01 and F05-T20b. The lane's manifest is v125 with 437 ids.
- **CI:** CI #239 (run `36575178181`, https://github.com/yazidmanan2409/pintar40/actions/runs/36575178181) on `651b160a0907d967469617efdfa11fec097eb755`, green. It is the one run for BOB-38 to BOB-41. CI #238 was red on F06-P22's helper, as explained under CI.
- Post-login review #6, approved for 4.0 correction (D-061).

## CHANGED
**The defect.**
- Bank Soal (`src/app/studio/bank/page.tsx`) rendered the review form only at SIGNAL_RAISED, and offered UNDER_REVIEW, ACKNOWLEDGED_OK and ACTION_TAKEN there.
- `question_health_transitions` allows only SIGNAL_RAISED → UNDER_REVIEW from there, so the other two were refused with a generic line.
- After UNDER_REVIEW no form rendered, so ACKNOWLEDGED_OK and ACTION_TAKEN were unreachable.
- The list was the latest 40 items, and health was read from the first 200 rows, so a flagged older item might never be shown.

**Page only.** The transition table, the states, `record_question_health_review`'s rules and the capability are unchanged, and existing copy is reused.
- **`pilihanTinjauan`** (new, `src/lib/kesehatan-soal.ts`) gives the reviewer's decisions that are legal from the current state:
  - at SIGNAL_RAISED, taking it up (UNDER_REVIEW, labelled «Kesehatan soal» as before);
  - at UNDER_REVIEW, «Sudah ditinjau, soal ini wajar» (ACKNOWLEDGED_OK) or «Sudah ditinjau, soal ini diperbaiki» (ACTION_TAKEN);
  - nothing elsewhere.
- **The form is drawn from those choices.**
- **The list.** Besides the latest 40, every item at SIGNAL_RAISED or UNDER_REVIEW in the reviewer's schools is listed, whatever its age, and health is read for exactly the items shown.
- **`adae662`, the follow-up.** On `3fef67c`, F05-S02 went red. It is the Studio sweep, and one of its rules is that no Studio file writes an empirical value (`empirical_(difficulty|discrimination|evidence_count)\s*[:=]`). A hand-written row type on the page declared `empirical_difficulty: number | null`, and the sweep reads that as a write.
  - The fix removes the type and lets the rows keep the client's inferred type. F05-S02 is unchanged.
  - **Restated with it:** one assertion of my own BOB41-K01. Its pattern for the appended older items was `[...baru, ...((lama ?? []) as Soal[])]` and is now `[...baru, ...(lama ?? [])]`, since the `Soal` cast went with the type. What it asserts is the same.

## PROOF
- **BOB41-K01** (static, `selftest/bob41.test.ts`). It executes `pilihanTinjauan` at six states against the transition table read from its own migration (`20260912200213`), and reads the page.
  - **Red on today's code:** `the page offers the same three decisions at every state: src/lib/kesehatan-soal.ts has no pilihanTinjauan; the review form is still drawn only at SIGNAL_RAISED; the form's decisions are not the ones legal from the item's state; an item waiting on a reviewer that is older than the latest 40 is not listed; health is read from the first 200 rows rather than for the items shown`.
  - **Green now.**
- **F05-T20b** (db, new): the preserved rules, walked by the bootstrap school's admin over two of its items (School A carries none), and undone.
  - From SIGNAL_RAISED, ACKNOWLEDGED_OK and ACTION_TAKEN are **refused by the database**, and UNDER_REVIEW is taken.
  - UNDER_REVIEW twice is refused.
  - From UNDER_REVIEW, both conclusions work.
  - Both return to OBSERVING, **unchanged**.
  - `db-bob35-gates`' control (`run_fable05`) moves 23 → 24 for this row.
- **Items with no signal are listed as before** (the latest 40, asserted), with the existing copy (asserted).
- **Local, on `651b160`** (main `4df914a` merged; every database with an `en-US` ICU collation and Supabase's default privileges emulated):
  - full suite: 405 passed, 0 failed, 31 justified skips; the one unjustified skip, UX1-PIMPINAN-AKSES-01, needs network, as before;
  - plants: 124 of 124 proved their gates on a copy taken straight after the seeds;
  - shared red cases: all 20 gates exited 0, with the schema digest the same and every recheck 258 of 258.
- **CI's way, on fresh stacks that load no selftest file until each job loads `selftest/db/fable0*.sql`:**
  - `fable06.sql` on `d34a3ce` gave CI #238's exact line, `F06-P22 | f | the probe itself failed: function selftest.f11_user(text, unknown, uuid) does not exist`;
  - on `651b160`, `run_fable06()` gave 35 of 35 rows green, F06-P22 among them;
  - `red case · db-fable06-gates`, run from `ci.yml`: every one of its 13 planted defects turned its own test red;
  - `red case · db-tour-gates`, run from `ci.yml`: 37 rows green before planting, and each of its 8 planted defects turned its own test red;
  - `db-bob39-gates`: 34 green rows before planting, and bob39-1 turned F06-P22 red for its own reason;
  - `fable06.sql` truly alone cannot load: it refuses without fable01 and fable04, and fable04 refuses without fable03, so the job's `fable0*` set is the smallest set it runs in.

## CI
- **CI #239 (run `36575178181`, https://github.com/yazidmanan2409/pintar40/actions/runs/36575178181), green, 31 of 31 jobs.** It was a `workflow_dispatch` on `claude/quirky-meitner-a04smj` at `651b160a0907d967469617efdfa11fec097eb755`, with `main` `4df914a` merged in. It is the one run for BOB-38 to BOB-41, and I watched it to the end.
- **It replaces CI #238** (run `36566019037`, on `e9cff4a`), which was red.
  - `red case · db-fable06-gates` and `red case · db-tour-gates` both stopped on `F06-P22 | f | the probe itself failed: function selftest.f11_user(text, unknown, uuid) does not exist`.
  - **The cause:** F06-P22 (BOB-39's test) made its second Head of Department with `selftest.f11_user`, defined in `fable11.sql`. Those two jobs load only `selftest/db/fable0*.sql`. My local proof loaded `fable0*` and `fable1*` together, which hid it: the same kind of problem as F05-C01 at BOB-24.
  - **The fix is `651b160`.** F06-P22 now makes that person with fable06's own `selftest.f06p10_person` and a HEAD_OF_DEPARTMENT role at the other department, the way `wp2_school` makes its people. What it asserts is unchanged. No other helper that fable06 calls is defined outside `fable0*.sql`.
- The red-case matrix includes `db-bob24-gates`, `db-bob35-gates`, `db-bob36-gates` and `db-bob39-gates`.

## CONTRACT
None changed. The page reads `question_health` by state and by the items shown, both RLS-bounded as before.

## MIGRATIONS
None.

## COPY
None: the existing «Kesehatan soal», «Sudah ditinjau, soal ini wajar» and «Sudah ditinjau, soal ini diperbaiki».

## D-060
None; the health computation is untouched.

## QUESTIONS
None. Out of scope, as ruled: showing what raised the signal.

## READY
Yes. All four go to your gate together, on CI #239.

---
### Summary (ready to paste)
```
BOB-41 (3fef67c + adae662), ready for the gate in CI #239 (run 36575178181) on 651b160, with BOB-38 to BOB-41.
Bank Soal offers only the reviewer's legal next step (take up at SIGNAL_RAISED; «wajar» or «diperbaiki» at UNDER_REVIEW),
lists every item at SIGNAL_RAISED or UNDER_REVIEW in the reviewer's schools whatever its age, and reads health for the
items shown. Page only; transitions and rules unchanged. BOB41-K01 red on today's code, green now; F05-T20b holds the
database's rules. D-060: none.
```
