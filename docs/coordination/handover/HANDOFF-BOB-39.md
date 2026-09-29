READY FOR GATE: CI #239 (run 36575178181) green on 651b160a0907d967469617efdfa11fec097eb755

# Bob → coordinator: BOB-39 («Diteruskan ke pihak sekolah» reaches the decision queue)

**SHA:** `10ba1c7`, its own commit; `5eb779b` (the tests for your gate questions); and `651b160` (F06-P22 made self-contained after CI #238). They sit on top of BOB-38.
- **Manifest:** F06-P22 and BOB39-K01. The lane's manifest is v125 with 437 ids.
- **CI:** CI #239 (run `36575178181`, https://github.com/yazidmanan2409/pintar40/actions/runs/36575178181) on `651b160a0907d967469617efdfa11fec097eb755`, green. It is the one run for BOB-38 to BOB-41. CI #238 was red on F06-P22's helper, as explained under CI.
- Post-login review #2, approved for 4.0 correction (D-061).

## CHANGED
**The defect.**
- The Studio's «Tinjauan Integritas» recorded REFERRED_TO_INSTITUTION through `record_integrity_review` (20260915160000), which writes an audit row and creates nothing.
- No code in `src/` calls `refer_integrity_signal` (20260924110000).
- So `/pimpinan`'s «Keputusan», the Head of Department's and Dean's attention surface, could never fill, and «Tidak ada keputusan yang menunggu Anda» was guaranteed.

**Migration `20261024100000_a_referral_reaches_the_decision_queue.sql`** (the 130th):
- **`record_integrity_review`** is 20260915160000's body re-emitted with one call added.
  - When the decision is REFERRED_TO_INSTITUTION, it raises the INTEGRITY_REFERRAL decision through the existing **`refer_integrity_signal(p_signal, p_note)`**, in the same transaction: no review without its referral, and no referral without its review.
  - The reviewer's note becomes the decision's `raised_note`.
- **The referral keeps its own rules.**
  - It is idempotent while open: a second referral of the same open signal is the same decision.
  - It asks for CAN_REVIEW_INTEGRITY over the signal's **class node**. So a referral recorded by a reviewer whose role holds the capability in the school but does not reach that class is now refused **as a whole, review included**. That is what "no review without its referral" means, and you accepted it. NO_CONCERN and DISCUSSED_WITH_LEARNER keep the school-wide rule.

**(a) Who can be refused, and whether an everyday path is (your question).** The roles holding CAN_REVIEW_INTEGRITY (`role_capabilities`) are **HEAD_OF_DEPARTMENT, INSTITUTION_ADMIN and SYSTEM_ADMIN**. EDUCATOR, DEAN and STUDENT do not hold it.
- **The class's teacher does not review through the product.** EDUCATOR holds no CAN_REVIEW_INTEGRITY, so `/studio/integritas` lists nothing for a teacher (it keeps the institutions where the viewer holds the capability) and the database refuses them. Your question assumed a teacher reviews there; they cannot, today or before this change.
- **INSTITUTION_ADMIN** is assigned at a school's root node in every assignment in the proof database (7 of 7), and `can_on_node` covers every class below it. **SYSTEM_ADMIN** is unscoped. Neither is newly refused.
- **HEAD_OF_DEPARTMENT** is assigned at a department there (4 of 5 assignments; 1 is at a school root). It reaches its own department's classes, and the Head of Department's own referrals are unchanged.
  - **The cross-department case is a mismatch between two existing authority rules.**
    - Reading signals and recording a review are school-wide: `integrity_signals_select` and `record_integrity_review` both use `can_in_institution`.
    - `refer_integrity_signal` has required CAN_REVIEW_INTEGRITY over the signal's **class** since 24 Sep (20260924110000).
    - So a Head of Department can see another department's signal. When they record a referral of it, the referral's class rule refuses it, and because the two now share one transaction, the whole review is refused with it.
    - That keeps the existing authority rule for referrals; it is not a new rule, and it is not a regression. NO_CONCERN and DISCUSSED_WITH_LEARNER on that signal are still recorded under the school-wide rule.
    - F06-P22 tests it. On the old body the referral was recorded with no decision (0 decisions, 1 review row); now it is refused whole, with no decision and no review row, while NO_CONCERN there is still recorded.
    - As you ruled, it is accepted as built. Whether referral should follow review authority is Yazid's question, and BOB-39 does not change it.

**(b) On screen it is an existing code, not a raw error (your question).**
- `recordIntegrityReviewAction` passes any refusal through `ditolak("record_integrity_review", error)`, which answers with `kodeGalat`'s code.
- `refer_integrity_signal`'s refusal («referring an integrity signal requires CAN_REVIEW_INTEGRITY over the node it was observed in») matches `kodeGalat`'s `requires CAN_…` rule, so it is the existing **ACTION_NOT_ALLOWED**, shown with the Studio's existing sentence and no reference.
- **BOB39-K01** (static, new) reads that refusal from its migration, maps it through `kodeGalat`, and checks the action's `ditolak` path, so a rewording or a bypass fails it.
- **Unchanged:** every refusal, the audit row and the grants. The registry note now says what the review raises.
- **Nothing new:** no new family, table, column or screen. The Pendampingan and Tindak lanjut families stay without a creation path, as ruled.

## PROOF
- **F06-P22** (db, `selftest/db/fable06.sql`, on WP2's `wp2_school`, every row rolled back).
  - **Red on today's body:** `a referral through the review left 0 AWAITING_REVIEW decision(s) on the signal's class with the reviewer's note, expected 1; the Head of Department's decision queue shows 0 referral(s), expected 1; a second referral of the same open signal left 0 decision(s); a referral outside the reviewer's department was accepted, leaving 0 decision(s) and 1 review row(s); the referral could not be taken up or decided`.
  - **Green now:** a Head of Department's referral raises one AWAITING_REVIEW INTEGRITY_REFERRAL on the signal's class, with the note as `raised_note`, beside the review's audit row. It is in that Head of Department's decision queue, read through RLS exactly as `/pimpinan`'s `keputusanSaya` reads it.
- **Preserved, with tests (all in F06-P22):**
  - NO_CONCERN and DISCUSSED_WITH_LEARNER create nothing.
  - A second referral of the same open signal creates no second decision.
  - A referral outside the reviewer's department is refused whole, and NO_CONCERN there is still recorded.
  - A Head of Department over the other department does not see it.
  - A teacher without CAN_REVIEW_INTEGRITY is still refused the review.
  - «Saya yang menangani» (UNDER_REVIEW) and «Catat keputusan» (DECIDED) take it up and decide it, unchanged.
  - F05-T20 (review decisions are never verdicts; one audit row; no signal mutated) is unchanged and green.
- **Plants:** a new gate `db-bob39-gates` (`run_fable06`, control 34). Plant bob39-1 (the referral call removed) turns F06-P22 red: `a referral through the review left 0 AWAITING_REVIEW decision(s)`.
- **Restated for the changed requirement:** the migration tripwires move 129 → 130, with the reason beside them. There is no table, column or mark.
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
`record_integrity_review(signal, 'REFERRED_TO_INSTITUTION', note)` now also creates the INTEGRITY_REFERRAL decision; its refusals are `refer_integrity_signal`'s. There is no new client RPC.

## MIGRATIONS
`20261024100000`: one function redefined and one registry note. It is additive, lane-only and unmerged, with no backfill.

## COPY
None.

## D-060
No metric or grading change.

## QUESTIONS
None of mine. With Yazid, as you ruled: whether referral authority should follow review authority (school-wide) rather than the class scope `refer_integrity_signal` has had since 24 Sep. BOB-39 does not change it. Out of scope, as ruled: the review page's context and its first-signal-only form (review #7).

## READY
Yes. All four go to your gate together, on CI #239.

---
### Summary (ready to paste)
```
BOB-39 (10ba1c7, tests 5eb779b, self-contained 651b160), ready for the gate in CI #239 (run 36575178181) on 651b160, with BOB-38 to BOB-41.
Migration 20261024100000: record_integrity_review, on REFERRED_TO_INSTITUTION, raises the INTEGRITY_REFERRAL decision
through refer_integrity_signal in the same transaction (the note becomes raised_note), so /pimpinan's «Keputusan» fills.
The referral's own rules hold: idempotent while open, and it needs CAN_REVIEW_INTEGRITY over the signal's class,
so a referral by a reviewer outside that class is refused whole (on screen: the existing
ACTION_NOT_ALLOWED). CAN_REVIEW_INTEGRITY: HEAD_OF_DEPARTMENT, INSTITUTION_ADMIN, SYSTEM_ADMIN; teachers don't review.
Cross-department: review is school-wide but referral has been class-scoped since 24 Sep; the shared transaction keeps
the referral's rule (accepted as built; whether referral should follow review authority is Yazid's question).
F06-P22 red on today's body (0 decisions, empty queue), green now; NO_CONCERN/DISCUSSED create nothing; no second
decision; other department blind; teacher refused; take-up and decide work. Gate db-bob39-gates. Tripwires 130. D-060: none.
```
