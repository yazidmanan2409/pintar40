# Z0 · K-01 consumer inventory — Sharon's check

**Work:** `docs/completion-4.1/batches/z/Z0-K01-INVENTORY.md` on `claude/z` at `c9466159` (Second Eye).
Read-only, from the source at that commit. I did not build a golden database; I read the latest definition of each function by file order.

**Verdict: PASS with conditions.** The inventory is complete for every verdict K-01 changes. It is missing three rows that are not verdicts; add them so they are not mistaken for gaps.

## Completeness

**My method:**
- every migration naming `pass_mark` (9 files), function by function;
- every SQL comparison of a mastery against a minimum;
- every `src` comparison against `batas`, `ambang`, `target` or `passMark`.

**Add three rows:**

| Reader | Where | What it states | Verdict |
|---|---|---|---|
| `murid_perlu_penguatan` | `20270102100000` | «Murid yang perlu penguatan» by the lowest band. A failed gate already falls to the lowest band, and `soal_wajib_tepat` is returned | **OK**: gate-aware already |
| `target_kelas` | `20270111100000` | the sealed mark per chapter for a class report; no learner | **Not a verdict** |
| `KomposisiKelas.tsx:68,287,306,357` (`diBawahTarget`, the per-chapter `bawah`) | the class report | a topic's or chapter's **mean** below the mark | **Not a verdict.** True as stated. It sits beside `:182`, which the inventory already names |

Nothing else compares with the mark. `finalize_session` (`20261129100000`) writes `safety_gate_passed` and states no verdict.

## Q1 · one source for the gate's objectives

**I choose the `session_outcome` key, computed by one internal helper that both readers call.**
- **The helper** is an internal SQL function from the result row to the objectives of its missed must-be-right items.
  - EXECUTE is revoked from public, anon and authenticated.
  - It has no `client_rpc_registry` row as a client RPC.
  - It returns objective ids only: no item, no answer, no count.
- **Two readers call it, each under its own authority:**
  - `session_outcome` adds the key beside `per_domain`. It stays `session_is_mine` only, so the learner sees only their own.
  - `tujuan_belum_tercapai` adds the same objectives under its existing staff rule.

**Conditions:**
1. **The objectives come from the same result row whose `safety_gate_passed` the verdict reads.** That is the current, non-superseded result, after any key correction. They must never come from grading the responses afresh against today's key; otherwise, after a correction, the list and the verdict can disagree.
2. **When the gate passed,** the key is `[]`. For a `PRE_TEST`, no key is returned (it stays diagnostic, as today). If no mark was sealed, the list may still show, but no verdict words are added.
3. **Z-K01-01 also asserts parity:**
   - the learner's key equals `tujuan_belum_tercapai`'s gate rows for the same session;
   - a learner calling `session_outcome` on another learner's session is refused, as today.

## Q3 · the gate on the two teacher pages

**Yes, within the existing rule.**
- Both pages already call `metric_evaluate('learner.result', …)` (`pengajar.ts`), and that envelope already carries `safety_gate_passed`. So reading it opens no new path and no new audience.
- The precedent is `murid_perlu_penguatan`, which already shows the same teacher `soal_wajib_tepat`.

**Condition:** if the envelope is withheld or errors, or `safety_gate_passed` is null, the page must **not** read that as a pass. Say «not known», as in K-03: never «capai», and never pre-ticked as reached.

## Q2 (Bob's answer) · the approver's retake queue

**Agreed: in scope.** It is one column in `percobaan_antrean`, under the same `can_on_node('CAN_VIEW_LEARNER_RESULT', …)` condition as the mastery. I check it in Z1 together with K-07 and K-01's SQL.

**Could reasonably have been anticipated:** nothing new from me this round.
