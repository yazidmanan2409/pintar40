READY FOR GATE: CI #239 (run 36575178181) green on 651b160a0907d967469617efdfa11fec097eb755

# Bob → coordinator: BOB-40 (the teacher's «Layak dikerjakan lebih dulu» fits the class)

**SHA:** `66160a3`, its own commit, on top of BOB-38/39's hand-off commits.
- **Manifest:** BOB40-K01. The lane's manifest is v125 with 437 ids.
- **CI:** CI #239 (run `36575178181`, https://github.com/yazidmanan2409/pintar40/actions/runs/36575178181) on `651b160a0907d967469617efdfa11fec097eb755`, green. It is the one run for BOB-38 to BOB-41. CI #238 was red on F06-P22's helper, as explained under CI.
- Post-login review #3, approved for 4.0 correction (D-061).

## CHANGED
**The defect.** `satuHal` (`src/lib/pengajar.ts`) proposed any PUBLISHED school release not yet assigned to a class in scope, and never compared subject or grade. Today's loop, run over the test's school, tells **a Grade 5 class that holds both Matematika SD 5 releases that «Matematika SMA 10» comes first**. The school has Matematika SD 5 (two releases), a revision of it, SD 1, SMA 10 and Bahasa Indonesia SD 5 published. Output of today's loop: `{"kelasId":"5A","terbitanId":"r-mat10","kursus":"Matematika SMA 10","lanjutan":false}`.

**The rule, as you set it.**
- A (class, release) pair is a candidate only when the class already holds an assignment whose course has the same `subject`, `stage` and `grade_label` as the release's course. The next release of a lineage the class already takes is included.
- The order among candidates is unchanged: a course the class already takes first, then newest.
- A class with no assignment gets no course suggestion. Its first material still comes through «Siapkan materi» on the class page, which lists every published release, unchanged.

**The code.**
- **`pilihSatuHal`** (new, exported) is the choice itself, over rows already read, so a test can drive it.
- **`satuHal`** reads each course's `subject, stage, grade_label` in one extra query and chooses through it.
- `terbitan` and `penugasan` are untouched, so the class page and Siapkan are unchanged.
- No schema change, no copy.

## PROOF
- **BOB40-K01** (static, `selftest/bob40.test.ts`) executes `pilihSatuHal` over that school.
  - **Red on today's code:** `the teacher's first suggestion compares no subject or grade: src/lib/pengajar.ts has no pilihSatuHal to choose by them; satuHal does not read each course's subject, stage and grade_label and choose through pilihSatuHal`. The behaviour it replaces is today's loop shown above: SMA 10 for a Grade 5 class.
  - **Green now:**
    - The Grade 5 class is never offered SMA 10, SD 1 or Bahasa Indonesia.
    - The next release of its own course comes first, as a continuation, with the same card and link.
    - With that assigned, the next course in its lineage (same subject, stage and grade) comes next.
    - With nothing of its kind left, nothing is suggested, and the quiet line «Tidak ada yang menunggu keputusan Anda hari ini.» shows.
    - A class with no assignment is offered nothing.
    - A course with no subject, stage or grade is never matched.
- **Preserved, with tests:**
  - the next chapter of a course the class takes is still suggested, with the card's link to step 2 of Siapkan (`/mengajar/<class>/siapkan?terbitan=<release>`, asserted);
  - the quiet line shows when nothing qualifies (asserted);
  - the class page and Siapkan are unchanged, since `terbitan`, `penugasan` and their pages are untouched.
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
`satuHal(kelas)` has the same signature and the same `SatuHal` shape. There is a new export, `pilihSatuHal`, and one more RLS-bounded read of `courses` (id, subject, stage, grade_label) per landing.

## MIGRATIONS
None.

## COPY
None.

## D-060
None.

## QUESTIONS
None.

## READY
Yes. All four go to your gate together, on CI #239.

---
### Summary (ready to paste)
```
BOB-40 (66160a3), ready for the gate in CI #239 (run 36575178181) on 651b160, with BOB-38 to BOB-41.
satuHal now proposes a release only when the class already holds a course of the same subject, stage and grade_label
(the lineage's next course included); order unchanged; a class with no assignment gets no suggestion (Siapkan unchanged).
Today's loop told a Grade 5 class «Matematika SMA 10» first; BOB40-K01 (pilihSatuHal executed) red on today's code, green now.
No schema, no copy. D-060: none.
```
