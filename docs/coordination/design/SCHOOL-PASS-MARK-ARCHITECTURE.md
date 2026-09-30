# The school's minimum passing mark (D-081): architecture trace and the smallest adjustment

**For Yazid and Dr Gladys, 30 Sep 2026.** Read-only; nothing is implemented. It builds on `design/PASS-MARK-AND-GRADE-SEMANTICS-REVIEW.md` (the code and document traces, with file and line references) and is checked at source.

## 1. Where the pass mark lives today

**On the assessment definition.** `assessment_definitions.passing_rules jsonb` (`20260912114854:71`), key `mastery_min`.
- A definition belongs to a **course** (or module) and to the **institution that owns the content**. It is not tied to a class, an assignment or the school that teaches it.
- **Every product path writes 0.6:**
  - the package import (`20261010100000:127`, POST_TEST only; PRE_TEST gets `{}`);
  - every Uji Cepat (`launch_quick_assessment`, `20261020100000:141`);
  - all seeds.
  - The workbook has no field for it. Only Studio's definition builder takes free JSON, on create.
- `scoring_policy.passing_rules` is metadata only: "source: assessment_definitions.passing_rules.mastery_min, default null, no invented pass mark".

## 2. How shared content reaches schools

**By reference, not by copy.**
- Canonical content (courses, releases, definitions) is owned by the PLATFORM_CANONICAL tenant.
- A school is given an append-only grant to teach a canonical release (`release_distributions`, `20260915110000`, ADR-0015). Schools never write canonical rows.
- A school's class then gets its own, **school-scoped** assignments (`learning_assignments`, `assessment_assignments`: `institution_id`, `node_id`), which point at the canonical release and definitions.
- **Consequence today:** a canonical definition's `mastery_min` is the same for every school that teaches it. A school cannot set its own without changing shared content, which D-081 forbids.
- School-created content (a school's own workbook upload) is owned by that school, so its definition is already the school's. It just has no way to set the value (always 0.6).

## 3. Where the threshold is fixed for an attempt

- A session records `assessment_definition_id` **and `assessment_definition_version`** (`assessment_sessions`, `20260912133821`), plus `scoring_policy_version` and `engine_version`.
- A change to `passing_rules` makes a new definition version (`save_assessment_definition`, INV-29). A Uji Cepat's rules are frozen once any session cites it (PR061).
- **So today the applied mark is reproducible only indirectly, through the definition version.** Nothing on the session or the assignment records the threshold itself, and the readers look it up again every time:
  - `session_outcome` (`20260913091500:242-250`);
  - `certificate_eligibility` (`20260914103000:197-215`).

## 4. What derives from it today

| Consumer | Uses the pass mark? |
|---|---|
| `session_outcome.lulus` / `ambang` → the result page's «Target untuk bab ini: N%» | Yes: `mastery ≥ mastery_min` and the safety gate |
| `certificate_eligibility` → issuance → the signed payload's `result.passed` → verification's «Memenuhi capaian» | Yes: the same rule, computed again |
| The certificate page's «…sudah memenuhi syarat» | Yes (through `lulus`) |
| **Predikat / «Perlu Pendampingan»** | **No:** absolute bands (0.90/0.80/0.70/0.00) on `scoring_policy`. **Unchanged here; still open** (the semantic review) |
| **Readiness tiers** (<0.60 / 0.60–0.80 / ≥0.80) | **No:** fixed catalogue thresholds. **Unchanged; still open** (the semantic review) |
| `verified_credentials`, the certificate count | Indirectly: which certificates exist. Its meaning is unchanged |
| `_intel.ts:51`, the teacher's action sentence | A hard-coded 0.6, not the pass mark (review F4) |
| «tuntas» | Only the certificate verb «telah menuntaskan». No computation |

## 5. The smallest adjustment

**One definition of passing, unchanged:** *passed = mastery ≥ the applicable pass mark, and the safety gate passed.* What changes is only **where the applicable mark comes from, and that it is sealed**.

1. **The school's setting:** a new, **school-scoped, append-only** table, for example `school_pass_marks (institution_id, course_id, mastery_min, set_by, set_at, reason)`.
   - One active row per school and lesson; a change writes a new row, never an update.
   - It is written by one audited RPC for the authorised school role; it never writes canonical or shared content.
   - It works for canonical lessons (through the distribution) and for the school's own.
   - `course_id` follows the lesson's revision lineage, so a corrected release keeps the school's mark.
2. **Seal it on the assessment assignment.** When a class is given the lesson (Sediakan, `assign_release`), or an Uji Cepat is launched, the applicable mark is copied into the school-scoped `assessment_assignments` row (a new column such as `pass_mark_applied` with its source). It is immutable once written.
   - Everyone in that assignment is judged by one mark.
   - A later change to the school's setting affects **new** assignments only.
3. **Seal it on the session.** The existing `BEFORE INSERT` trigger pattern on `assessment_sessions` (as with BOB-35's release check) copies the assignment's sealed mark onto the session, immutable. Each attempt then carries its own threshold, which makes it reproducible without looking anything up.
4. **The two readers read the sealed mark:**
   - `session_outcome` and `certificate_eligibility` take `pass_mark_applied` from the session;
   - sessions from before the change fall back to their definition version's `mastery_min`, which is equally immutable;
   - both compute the one rule from one sealed number. This also ends the review's F7 drift.
5. **Resolution, done once at step 2:**
   - the school's active setting for the lesson;
   - else the lesson's own default (the definition's `mastery_min`, 0.6 today; see Q3);
   - else none. "No invented pass mark": no verdict and no certificate, as today.

**Not changed:**
- canonical content, releases, definitions, `release_distributions`;
- the scoring policy, the engine, the predikat bands, the readiness tiers, the metric catalogue;
- the verification route.

A certificate's signed payload already carries `score` and `passed`. Adding the applied mark to **new** payloads is optional, a small format addition for new rows only.

**D-060:** the grading rule does not change, so there is no engine bump. Only where the number comes from changes, and every historical outcome keeps its sealed value. No metric changes meaning.

## 6. Open questions (not inferred)

- **Q1: Granularity.** Per lesson for the **whole school** (the ruling's wording), or may it differ **per class or assignment**? The design seals per assignment either way; the setting table is per school and lesson.
- **Q2: Who in the school sets it?** The school admin (Admin sekolah), the head of department (Kepala departemen), or the teacher when providing the lesson? Also, is it audited and shown to leaders?
- **Q3: The default** when a school has not set one. Is it the lesson's own default (0.6 today, as shipped content carries it), or must the school set it before the lesson can be given to a class?
- **Q4: The allowed range and form.** A percentage in whole numbers (e.g. 50–100%)? The screen says «Target untuk bab ini: N%» today.
- **Still open from the semantic review:**
  - (a) what «Perlu Pendampingan» and the other bands mean once marks differ by school (e.g. a school at 75% puts «Cukup», 70–79%, partly below its own mark);
  - (b) the teacher's readiness tier names;
  - (F1) whether a single Uji Cepat certifies.

## 7. Size and placement

**Bob**, one ticket:
- the table and its RPC;
- the assignment and session columns with their trigger;
- the two readers;
- tests: two schools teach one canonical lesson with 60% and 75% and get different outcomes from identical answers; a later change leaves earlier outcomes and certificates identical; the canonical definition is untouched.

**Daisy:** the setting on a school screen, the words, and the target shown as today.

It fits BOB-48's slot (after Gate 6), with (4)'s eligibility reading the sealed mark. Nothing starts until Yazid and Dr Gladys answer Q1–Q4.
