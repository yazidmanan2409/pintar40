# A2b: the start path refuses a maintenance reason with a bare P0001 (Second Eye's finding, confirmed)

Sharon, 16 Nov 2026 (16:30 UTC). Read-only. **What I checked:**
- 20270120120000 on the candidate `3c58620ed6bdd27e3303e4d5decc462b648c2496`: `may_start_assessment` now answers MAINTENANCE_PLACE and MAINTENANCE_NO_NEW_START (lines 32 and 42);
- `start_learning_session`'s refusal, at 20270112120000:42: `raise exception 'cannot start this assessment: % (INV-27)'`, with no errcode and no DETAIL.

## What holds now

- **The defect is confirmed, and it is a blocker for A2b's promotion.** The frozen candidate cannot be promoted as it is.
- **What happens:**
  - Because `may_start_assessment` is asked first, a maintenance refusal reaches the learner as a bare P0001. The trigger's PR040 or PR110 never comes into play.
  - `mulaiAsesmen` recognises only PR110, PR040 and PT503, so **the learner gets an error page.**
- **That regresses 4.0's T−15 behaviour.** A learner who presses «Mulai» on a page loaded before T−15 used to get the notice. Now they get an error.
  - The new class and school refusal (R-1) is never shown as designed either.
- **The fix, as Second Eye recommends, which I agree with:**
  - `start_learning_session` raises the two maintenance reasons with the trigger's own codes and DETAIL: PR040 MAINTENANCE_PLACE, and PR110 MAINTENANCE_NO_NEW_START.
  - Every other reason keeps its current message.
  - **Red first, through `start_learning_session` and through `mulaiAsesmen`** (the learner sees the notice, not an error page), for both reasons.
  - **A sweep:** every caller of `may_start_assessment` and every other start path. Each must surface the two codes, never the bare message.
- **The freeze:** this changes code, so A2b is unfrozen explicitly and a new candidate frozen.
  - The preservation pair, the pre-flight and the journeys are taken on the new SHA.
  - My freeze checks are re-run on it. They are quick, since only this path changes.
- **J1.6, leg 2, asserts PR040 after the fix.** I do not accept an interim assertion of `may_start`'s MAINTENANCE_PLACE: that would encode the defect as the rule. B4-W11 may go ahead now, as it meets conditions 1 and 3.

**Could reasonably have been anticipated:** yes, by me (Q2, the neighbouring act). When I reviewed commit 3, I checked `may_start_assessment`'s new answers and the trigger. I did not follow its consumer, `start_learning_session`, which turns any refusal into one generic message. M148's T−15 legs go through the insert, so they could not see it either.

## Addendum, 16:50 UTC: the fix, reviewed at `b2f6a5529c8130b920126c19a25ac994c86aafb7`, the proposed new candidate

**What I read:**
- migration 20270120240000 in full;
- the diff from `14cb6e04` (its stat, the selftest hunks, and `src/app/belajar/actions.ts`'s exports);
- `my_open_assessments` at 20260920090000.
- **Not yet seen:** the full pre-flight.

**PASS on the fix, subject to a green pre-flight and one test, T-SP.**

- **The migration:**
  - It adds two lines before `start_learning_session`'s generic raise, anchored exactly once. MAINTENANCE_PLACE goes through `maintenance_tolak_tempat()`, the trigger's own PR040, and NO_NEW_START through `maintenance_refuse(…)`, PR110.
  - Every other reason is unchanged. There is no table, column or grant.
  - Its verification block holds the order and the grants.
- **The evidence:**
  - **A2B-SP1:** PR040 and PR110 for a school window, and for a school and a platform window at T−15. It was red as P0001 at `3c58620e`, and its plant is caught.
  - **A2B-SP2:** «Mulai» posted to the built app returns to the assignment, or to `/pemeliharaan?mulai=ditolak` for the platform T−15. No sitting is made. It was red as HTTP 500 at `3c58620e`.
  - **J1.6 (ii)** asserts PR040 under the learner's own claims. It is restated positively, with no weakening.
- **The sweep:** `start_learning_session` is the only caller of `open_assessment_session`, which is the only writer of a sitting. `may_start_assessment`'s other callers raise nothing, and `mulaiAsesmen` is now the only start in the app.
  - `src/app/belajar/actions.ts` at the candidate exports no start action. `startSession` is gone.
- **`my_open_assessments` cannot leak another school's rows.**
  - Its rows are exactly those `may_start_assessment` accepts for the caller (line 18), with `current_person_id()` required.
  - A maintenance answer can only turn `ok` false, never true, so hiding rows can only shrink the set.
  - Hiding them, or disabling «Mulai», is Daisy's ruling. Either way it is not a privacy question.
- **The preservation pair** is restated for 267 → 282. Only line 10 moves, and the controls still bite.

**T-SP, required:** Bob's ruling (16:28) asks for "a test that no unhandled start action is exported". I find none in the diff.
- `startSession` is removed, but nothing stops it from coming back.
- **Add a static test:** no exported server action in `src/app` calls `start_learning_session`, or `open_assessment_session`, except `mulaiAsesmen`. Its plant restores `startSession` and must go red.
- If such a test already exists, cite it.

## Addendum, 17:05 UTC: the candidate moves to `6e45fe5266a9b85bcd07d03022f0a27ee0bfa93e`. `b2f6a552` is superseded.

**What I read:**
- Second Eye's mapping of `7d00a549`, `3134a7c7` and `6e45fe52`;
- `may_start_assessment`'s A2b edit at 20270120120000:71–79.

**My 16:50 point that the list "can only shrink" is superseded, marked here and not deleted.** Daisy's Q-12 ruling now keeps the row during a window. `my_open_assessments`' gate becomes `s.ok or s.reason in ('MAINTENANCE_PLACE', 'MAINTENANCE_NO_NEW_START')`.

**Why this still cannot leak another school's row, checked in source:**
- A2b's maintenance answer is inserted just before `may_start_assessment`'s final `ok := true; reason := 'OK'`. Every other rule is judged before it: enrolment, membership, the assignment's place, attempts.
- So a row reaches a maintenance reason only if every other rule would have accepted it.
- `maintenance_mulai_tolak` yields only those two codes.
- A2B-Q12's other-school leg asserts it: `alpha-siswa-1` never sees the row. An assessment that is not yet open is still dropped, even inside a window.

**T-SP is closed by A2B-SP3.** No exported function in `belajar/actions.ts` starts a sitting without mapping PR110 and PR040. `mulaiAsesmen` is the one start. The plant (3c58620e's `startSession`) is caught.

**`6e45fe52` (CI only):** plant 3g is re-anchored to the new predicate, and the defect is unchanged.

**The preservation pair stands:** still 282 migrations, no column, and the query text is unchanged.

**Verdict: PASS on `6e45fe5266a9b85bcd07d03022f0a27ee0bfa93e`, subject to a green full pre-flight.** My freeze checks are re-run on it:
- **The A2B-R2 exceptions:** unchanged on this line. They were removed on C2w.
- **The `now()` branch:** still registered.
- **Staging:** marked PENDING OWNER AUTHORISATION.
- **The preservation pair:** ready.

## Addendum, 17:10 UTC: the candidate is `c507e41e39fa87a3b4edf6f0515dd0381b22fb20`. `6e45fe52` is superseded.

- **The diff from `6e45fe52` is test only:** `selftest/a2b-mulai.test.ts` and the manifest.
- **A2B-SP3 is widened** to every `"use server"` file under `src/app`, 27 of them.
  - The rule: only `mulaiAsesmen` may start a sitting, and it maps PR110 and PR040.
  - Both plants are caught: the old `startSession`, and a new file calling `start_learning_session`.
- **Q-12 (`3134a7c7`) and plant 3g (`6e45fe52`)** are already in my 17:05 addendum. They are unchanged here.
- **Verdict: PASS on `c507e41e39fa87a3b4edf6f0515dd0381b22fb20`, subject to its full pre-flight being green.** My freeze checks hold for it, because nothing outside the tests changed since `6e45fe52`.
