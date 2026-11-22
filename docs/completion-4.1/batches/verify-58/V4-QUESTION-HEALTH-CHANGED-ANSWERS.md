# Verification 4 · Question Health counts every answer row, not the final answer (PETE-09)

Agent verification, 22 Nov 2026. Ruling 58. Run on `origin/main` `706fe8c5`, scratch database as in V1 §Setup.

## Finding: CONFIRMED. A learner who changes an answer is counted once per row

- **What Question Health reads.** `recompute_question_health` (`20260918170000`:27) takes `evidence_count` and
  `correctness_rate` from `service_item_statistics`. That view (as deployed; last rebuilt by `20270117100000`:321)
  joins `presented_items` to **every** `academic_responses` row and counts `count(*)`: no final-answer filter, no
  `distinct` per presented item.
- **What the score reads.** `evaluate_session` uses `session_final_responses` (`20270121220000`:358): one row per
  presented item, the highest `(generasi, client_seq)`. **Question Health does not use it.**
- **`is_final` does not mean "final".** `record_answer` passes `v_scorable` as `p_is_final`
  (`20261005100000`:138–144), so every scorable answer row is `is_final = true`; the column cannot separate the last
  answer from the earlier ones.

## Reproduction (scratch clone; each step its own transaction)

1. As the owner: `purge_cycle_evidence()`; the fixture school `is_synthetic = false` on the clone (the view reads
   OFFICIAL responses only).
2. As the learner: `pre_finished(aa_pre)`; `s := start_learning_session(aa_post)`; `answer_paper(s, true)` (each
   question answered right, `client_seq` 1).
3. On the first MCQ_SINGLE question (positions read as the owner from `option_display_order`), as the learner:
   `record_answer(pid, 2, wrong₁)`, `record_answer(pid, 3, wrong₂)`, `record_answer(pid, 4, right)`;
   `finish_my_session(s)`.
4. As the owner, the reads below; then `recompute_question_health(school)` as `sysadmin@…`.

| Read | Result |
|---|---|
| `responses` for that presented item | 4 rows, `client_seq` 1–4, all `is_final = t`; right, wrong, wrong, right |
| `session_final_responses(s)` for it | **1** row; the sitting scores 1.0000 (5/5) |
| `presented_items` of that question, all sittings | **1** |
| `service_item_statistics` for it | `evidence_count` **4**, `correct_count` 2, `correctness_rate` **0.5000** |
| `question_health` after `recompute_question_health` | `INSUFFICIENT_EVIDENCE`, `evidence_count` **4** |

One learner, one sitting, answered right in the end: Question Health records four observations at 50%.

## What it means

- The evidence count runs ahead of the number of learners (`min_evidence` is 30, so 30 rows can be far fewer
  learners), and the rate mixes abandoned choices with final ones. Both errors move the 5% / 95% trigger.
- Exposure today is small: no scheduled job runs `recompute_question_health` (`cron.job` holds only the sitting closer
  and the accountability purge), nothing in `src/` calls it, and teachers do not see the table (Studio's Bank Soal reads
  `question_health` for reviewers). The register already notes the missing refresh (PETE-09).
- **Side observation, not reproduced:** `teacher_question_evidence` (the teacher's "questions the class found hard",
  `20270117100000`:151) takes the final answer as `is_final … order by client_seq desc`, without `generasi`. It does
  count one answer per question, but by a different rule from A3's.

## Classification

- **Severity:** Medium for authors and reviewers (a wrong signal, or no signal); none directly for learners; none for
  teachers today.
- **Proposed: 4.5,** fixed before anything schedules Question Health or shows it more widely: count one answer per
  presented item, the one `session_final_responses` picks (and use the same rule in `teacher_question_evidence`).
  If 4.1 schedules or widens it after all, this becomes Z.
