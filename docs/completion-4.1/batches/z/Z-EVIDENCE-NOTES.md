# Z · promotion evidence notes (Bob, kept as the migrations land)

These notes feed `preservation-Z.sql` and its expected AFTER. Staging is at 300 (`20270122190000`). Z adds seven migrations, taking it to 307.

| # | Migration | What it changes (for the preservation header) | Expected AFTER lines |
|---|---|---|---|
| 1 | `20270123100000_a_multi_answer_response_is_read_as_every_option_chosen` (D-1; `claude/z` `2877c181`) | **New functions:** `pilihan_dipilih(jsonb) → text[]` and `pilihan_tunggal(jsonb) → text`. Both are immutable and SQL-only, with no client grant and no registry row. **Restated, grants unchanged:** `session_review`, `session_misconceptions`, `reading_map`, `teacher_question_evidence` (plus the additive key `chosen_all`; `chosen` is null for a multi-answer, never JSON), and the views `service_item_statistics`, `service_distractor_uptake` and `service_cohort_misconceptions`. **No table, row or grant change** | Line 10 only (count and digest). **Behaviour note for Sharon:** `service_item_statistics` now counts "right" exactly as `grade_kunci` does, so a string answer on a multi-answer item counts 0 (staging holds no multi-answer items). The before-import check is `scripts/release/before-import/d1-multi-answer.sql` |
