# Ruling 58 verification batch (V1, V2, V4, V5, V6): review

Sharon, 22 Nov 2026 (22:45 UTC). Read-only. I reviewed Bob's `docs/completion-4.1/batches/verify-58/` at `feb1317b`.
- I read V2 and V6 in full, as they touch integrity and permissions, and the others by their findings.
- **I did not reproduce the runs.** The evidence cites code and steps, and I checked the two load-bearing claims myself on `706fe8c5`.

## Classes

| Item | Bob's class | Mine | Why |
|---|---|---|---|
| **V1** certifying help levels; same-question retakes | O-7 before D2-R; non-repeating retakes in 4.5 | **Agree** | D2-R's R-d removes help in certifying modes. Repetition is disclosed per D-2 (P-4) until 4.5 |
| **V2** learner reader vs teacher reader | **Z** | **Z: yes, it must be in Z** | Confirmed: `hasil_belajar_sesi_orang` orders by `s.created_at desc` (`20270117150000`, line 27 of the body). A begun-then-ended retake makes a finished, possibly certified result vanish from the learner's own summary. **That is an integrity defect in what PINTAR tells the learner, not wording.** See the conditions below |
| **V4** Question Health counts every answer row | 4.5, before any schedule or wider display | **Agree** | Matches X-16 and D-12. Any interim display of Question Health must carry the known-defect notice |
| **V5** consent `{}`; a transfer approved before a rollover | consent: owner (OD-9); rollover: 4.5; the raw error: Sharon | consent and rollover **agreed**. **The raw error: Z** | `transfer_execute` failing with `a closed enrollment is immutable` fails closed, so no data is harmed. But a raw database error reaching an administrator is a designed-refusal defect, and small. Z: refuse it with a designed code, before or at `transfer_execute`, saying the class moved up after the transfer was approved. The behaviour itself stays 4.5 |
| **V6** authority at effect | 4.5 | **Agree on 4.5,** plus one small Z check and one owner question | See below |

## Conditions for V2 in Z

1. **One rule, written down:** the learner's summary shows the **latest finalised** Uji Penguasaan of the assignment, whatever later sitting was begun or ended.
   - Whether an open retake also shows "in progress" beside it is Daisy's and the owner's wording.
   - **Losing the finished result after the retake ends is the defect.**
2. **The summary carries the D14 marker** (`sesi_saya_dihitung_ulang`) when the learner's sealed figure differs from the school's recalculated one.
3. **Red cases, first:**
   - a finished Uji Penguasaan, then a retake begun → the summary still shows the finished result;
   - the retake ended (by a rollover or by the teacher) → it still does;
   - after `recompute_result` → the summary shows the marker.
4. The **key-correction path end to end** (two-person) is in the same case set, since V2 read it only from the code.

## V6

- **No bypass was found through the product's entry points:** expiry is checked at effect, and the pre-request refuses a suspended token. I agree.
- **The single layer is already guarded in the database and in restores:**
  - BOB-29 asserts `authenticator`'s `pgrst.db_pre_request = pintar_permintaan.periksa` (`selftest/bob29.test.ts:94`, 547);
  - the restore rehearsal checks that the backup carries it (`restore-rehearsal.yml:135`).
  - **Small Z item:** add the same read-only assertion to the after-promotion checks (beside C3W-R3-BAHAN), so that staging and production show the live setting after every promotion.
- **The second layer** (a check of `orang_ditangguhkan` inside the capability helpers) goes in **4.5**, as Bob proposes. It touches every permission check, so it needs its own red cases and a performance read.
- **C′ is a question for the owner, joining OD-9:** a transfer requested by an administrator later suspended, or whose grant lapsed, is still completed by the other school. Decide whether a pending multi-party act made by a person since suspended is voided, re-confirmed by another administrator of that school, or stands. **My recommendation: re-confirmation.** A suspension may be for a safeguarding reason, and a request made by that person should not complete unseen. Until the owner rules, it stays as it is, written down.

## Not verified (Bob's list), carried

- the two-person key-correction path end to end, now in V2's cases;
- a full package import;
- STANDALONE;
- a live API server for suspension;
- the teacher's "hard questions" view's final-answer rule. **Add it to V4's 4.5 item: one final-answer rule, `session_final_responses`, for every reader.**

## Addendum · C′ ruled by the owner (ruling 73, `683c9e64`; Z-READINESS R-25)

The owner adopted re-confirmation:
- the transfer stays pending;
- another currently authorised administrator of the originating school confirms it **on their own authority**;
- the receiving school's approvals are unchanged;
- each step is audited;
- with no eligible administrator, it stays on hold;
- the check is made **at final execution**;
- a transfer completed before the suspension is not reversed.

**On my queue for 4.5, before any real transfer:** verify, when it is designed,
1. the own-authority boundary: the confirmer's own grant is checked, and nothing of the suspended person's is inherited;
2. the check at the execution point, with a red case: the confirmer's grant lapses between confirmation and execution, and execution is refused.

This goes with V6's second layer.
