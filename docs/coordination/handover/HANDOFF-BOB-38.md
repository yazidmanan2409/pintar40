READY FOR GATE: CI #239 (run 36575178181) green on 651b160a0907d967469617efdfa11fec097eb755

# Bob → coordinator: BOB-38 (a successful email sign-in never shows the failed-link screen)

**SHA:** `c088f58`, its own commit, and `6f3bfda` (the test for your gate question). They sit on top of the lane head that carried BOB-24, 34, 35 and 36 (CI #236).
- **Manifest:** BOB38-K01. The lane's manifest is v125 with 437 ids.
- **CI:** CI #239 (run `36575178181`, https://github.com/yazidmanan2409/pintar40/actions/runs/36575178181) on `651b160a0907d967469617efdfa11fec097eb755`, green. It is the one run for BOB-38 to BOB-41. CI #238 was red on F06-P22's helper, as explained under CI.
- Post-login review #1, approved for 4.0 correction (D-061).

## CHANGED
**The defect.** `TukarTautan` called `tukarKode(...).then(() => setMati(true)).catch(() => setMati(true))`, and its comment assumed success never returns. In Next 16.3.5 a server action that redirects **rejects** its caller's promise with the redirect. So every successful exchange fell into the catch and rendered S14 («Tautan ini sudah tidak berlaku … Minta tautan baru», with focus moved to it) until the role home had rendered.

**The mechanism: success is an answer, not a redirect.**
- **`tukarKode`** (`src/app/auth/callback/actions.ts`) answers `{ ok: true, tujuan }` with `tujuanMasuk(lanjut)`'s destination, which is unchanged: a carried `lanjut` still wins, else the role's home. A refused exchange still answers `{ ok: false }`.
- **`sesudahTukar`** (new, `src/lib/tukar-kontrak.ts`) is the page's decision.
  - A success leaves for its destination. The destination is narrowed once more through `tujuanInternal`, so a shape that is not a path lands on `/`, the role's home.
  - Anything else is S14.
- **`TukarTautan`** leaves with `window.location.replace(destination)`. S13 («menukar…») stays up during the departure, and the used callback is **not left in history**. A refusal, or a request that never came back, is S14.

## PROOF
**Where `location.replace` goes (your question): only a same-site path, from `tujuanMasuk` over the `lanjut` cleaned exactly as today.** The chain:
1. `page.tsx` cleans the link's `lanjut` with `tujuanInternal(sp.lanjut, "")`. That line is unchanged, and the cleaned value is what reaches `TukarTautan`.
2. `TukarTautan` passes that same `lanjut` to `tukarKode(kode, lanjut)`.
3. On the server, `tukarKode` answers `tujuan: await tujuanMasuk(lanjut)`. That is exactly what it redirected to before: `tujuanInternal` again, falling back to the role's home. A direct call of the action with any `lanjut` is cleaned there too.
4. The page's only `window.location.replace(...)` takes `sesudahTukar`'s answer, which runs `tujuanInternal(tujuan, "/")` once more.

BOB38-K01 asserts each step. It also executes `sesudahTukar` over six hostile shapes returned in the destination's place (`//host`, `https://host`, `/\host`, `javascript:`, a tab-led `//host`, `http:/x`), and each lands on `/`, the role's home.

- **BOB38-K01** (static, `selftest/bob38.test.ts`).
  - **What it checks:**
    - it executes `sesudahTukar`: a success goes to its destination, whole with query and fragment; a non-path goes to `/`; and every refusal shape is S14;
    - it reads the action: no `redirect`, and the two answers;
    - it reads the page: success calls `location.replace`, and only a refusal or a failed request sets S14.
  - **Red on today's code:** `the callback page has no way to tell a successful exchange from a refused one: src/lib/tukar-kontrak.ts has no sesudahTukar; tukarKode still redirects on success, which rejects the page's promise into S14; tukarKode does not answer success with tujuanMasuk's destination; TukarTautan still shows S14 when the exchange settles, success included; TukarTautan does not leave for the destination on success (replacing the used callback in history)`.
  - **Green now.**
- **Preserved, with tests:**
  - S14 still shows at once for a missing code or error parameters. The page is unchanged, and BOB38-K01 reads its condition.
  - An expired, used or other-browser link (audit S1b) is a refused exchange, `{ ok: false }`, so still S14.
  - «Minta tautan baru» still goes to `/masuk` with no destination (D1): BOB38-K01 and the existing D1 check.
  - A carried `lanjut` still wins, since `tujuanMasuk` is unchanged; the existing destination tests pass.
  - The class-card path is untouched: no file under `src/app/masuk/kartu` or `src/app/api/masuk/kartu` changed.
  - No copy change.
- **The behavioural check is yours,** in the audit (journey B, S1: S14's heading never appears during a successful sign-in).
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
`tukarKode(kode, lanjut)` now answers `{ ok: true, tujuan } | { ok: false }` (type `HasilTukar`). It is called only by `TukarTautan`.

## MIGRATIONS
None.

## COPY
None.

## D-060
Nothing grades, assembles or computes a metric.

## QUESTIONS
None.

## READY
Yes. All four go to your gate together, on CI #239.

---
### Summary (ready to paste)
```
BOB-38 (c088f58, test 6f3bfda), ready for the gate in CI #239 (run 36575178181) on 651b160, with BOB-38 to BOB-41.
tukarKode answers { ok: true, tujuan } instead of redirecting (a server action's redirect rejected the page's promise into
S14 on every success); TukarTautan decides through sesudahTukar and leaves with location.replace, so S14 never renders on
success and the used callback leaves history. Refusals still show S14; «Minta tautan baru» still starts clean; lanjut still wins.
Where location.replace goes: only tujuanMasuk's answer over the lanjut cleaned as today, re-narrowed; six hostile shapes land on /.
BOB38-K01 red on today's code, green now. No migration, no copy. D-060: none.
```
