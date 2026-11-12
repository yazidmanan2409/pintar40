# A key correction clears the explanations it makes stale · small C1w correction (F1-R1b)

> **Coordination record.** Owner's decision of 12 November 2026: **Option A approved.** Kept by the Chief Architect.
> A separate, bounded correction of C1w's key-correction flow, **before Z**, with Sharon's and Daisy's reviews. It
> holds no unrelated work, and is not part of F-1. It changes no part of THE PLAN.

## 0 · What holds now

1. **Rule (owner).** When a key correction changes an option's correctness, that option's stale **rationale** and
   **misconception code** are cleared **in the corrected revision**.
2. **The original sealed content and the historical evidence are preserved.** The revision that was sat keeps its
   text exactly as it was sat.
3. **The confirmation identifies the affected explanations,** and **Studio clearly indicates** that the corrected
   revision needs updated explanations.
4. **An urgent key correction is never delayed** because replacement explanations are not ready. The correction does
   not ask for them.
5. **The two-person approval rule is unchanged.**
6. **Sharon verifies the effect of cleared misconception codes on downstream reporting,** so that the absence of an
   annotation is not misrepresented as evidence of no misconception (§3).
7. State: **awaiting Sharon's pre-implementation review and Daisy's wording.** Not started.

## 1 · The defect

Found by Daisy in Studio during her F-1 review (`ux-1/daisy-experience` at
`34004af2f22055420b4c3b9f0473aae2dd986674`); reasoning in `C1W-F1-CORRECTION.md` §9d.

- `tegaskan_koreksi_kunci` sets `is_correct` on the corrected revision's options (`M/20270115110000…:942`) and leaves
  their `rationale` and `misconception_code` as they were authored for the old key.
- So on the corrected revision the new key can read «Ini belum tepat» and name a misconception, and the old key can
  read «Ini tepat».
- Assignments are moved to the corrected revision. Every learner who sits it afterwards can be shown a mark and,
  beside it in their result, an explanation that contradicts it.
- **Not yet rendered:** a new sitting on a corrected revision. The engineer's first red test is that sitting.
- F-1's fix in `session_review` does not reach this: it compares the key in force with the sealed option, and on the
  corrected revision they are the same.

## 2 · Design direction (for Sharon's review; the engineer proposes the exact statements)

1. **In the confirming act, in the same transaction** that writes the corrected key: for each option of the corrected
   revision whose correctness differs from the revision it supersedes, set `rationale` and `misconception_code` to
   null. Options whose correctness did not change are untouched.
2. **What was cleared is recorded on the correction** (which options, and their previous text and code), so that the
   record shows it, the preview can show it before confirmation, and an educator can see the old text when writing
   the new.
3. **The preview and the confirmation screen list the affected options** and say that their explanations will be
   removed. The second person confirms the key knowing this. No new field is required of either person.
4. **Studio marks the corrected revision** as needing explanations until each cleared option has a rationale again.
   Writing them is ordinary editing through C1w's existing draft and revision path; whether that needs a further
   revision or may be done on the corrected one is the engineer's to state from how C1w seals content.
5. **Nothing sealed is rewritten.** The superseded revision, its options, the release digest, and every result and
   response are byte-identical.

## 3 · What Sharon is asked to verify (owner's instruction, and the consequences that follow)

| # | Question |
|---|---|
| 1 | **Cleared misconception codes downstream.** After the correction, the option that is now wrong (the old key) has no misconception code. `session_misconceptions`, `service_cohort_misconceptions` and the reading map's remediation join on a code, so a learner choosing it contributes **nothing** to `class.misconceptions` and gets no remediation. A teacher reading a low or empty misconception figure could take it as "no misconception here". **How is "not annotated" distinguished from "none found"** in each of those readers and on the screens that show them? If it is not, what is the smallest honest signal (a count of wrong answers with no annotation, or a marker on the question) that needs no change of a catalogue definition? |
| 2 | **Old sittings.** Sittings on the superseded revision read their own sealed options, so their misconception evidence is unchanged, and F-1 decides what counts as wrong for them. Confirm that clearing on the corrected revision cannot reach them through any shared row |
| 3 | **Question Health and the item statistics** for the corrected revision: do any of them read `rationale` or `misconception_code`, and does a null change a state or a figure? |
| 4 | **Packages, copies and annotations.** A copy or a package made from the corrected revision carries the cleared options. C2w will place annotations beside the misconception views: an annotation that names a misconception code now absent from the option must not be left dangling (C2w is not built; this is a note for its page) |
| 5 | **Content rules.** Does any check (`soal_draf_masalah`, `lesson_package_check`, the MCQ quality run) require a rationale or a misconception on an option, so that a corrected revision would be reported as invalid, or could not be published or moved to? An urgent correction must not be refused for it |
| 6 | **A second correction of the same question** (O41-22): options whose correctness flips back. Their text was already cleared; nothing is restored automatically |
| 7 | **Immutability:** which guard today permits `tegaskan_koreksi_kunci` to write `is_correct` on the corrected revision, and does the same permission cover these two columns without widening what else may be written |

## 4 · The four questions

| Question | To answer on the page |
|---|---|
| And then what? | A learner sitting the corrected revision sees a mark and no explanation for the affected options, until an educator writes one. The educator who corrected the key sees, in Studio, that explanations are owed |
| What else did that change? | §3 rows 1 to 5. The learner's result page, the reading map, the class figure, Studio's package view, copies |
| What happens when things go wrong? | A correction that fails part-way leaves the key and the explanations as they were: one transaction. A corrected revision whose explanations are never rewritten stays honest, and stays marked |
| Can it be reversed, and what survives? | The correction is superseded, never undone (C1w). The cleared text survives on the correction's record and on the superseded revision. A further correction does not restore it |

## 5 · Tests (red first)

- **The defect itself:** a new sitting on a corrected revision; the learner's result, with the disclosure opened,
  shows the mark and no contradicting rationale. Red today.
- Options whose correctness changed have null rationale and misconception code on the corrected revision; unchanged
  options are byte-identical.
- The superseded revision, its options and every result and response are byte-identical.
- The correction's record holds what was cleared; the preview lists the same options before confirmation.
- The two-person rule: unchanged tests still pass; a correction with no replacement text is confirmed.
- Studio's marker is present after the correction and absent once each cleared option has a rationale.
- Sharon's downstream cases from §3, once she has ruled.
- A second correction on the same question.

Pre-flight of THE PLAN §4.1 in full. The page carries the inventory and the next-state row.

## 6 · Wording (Daisy)

Three lines, when the engineer asks, each in Indonesian and English:

1. On the preview and the confirmation: which options will lose their explanation, and that the key is corrected now
   and the explanations are written afterwards.
2. In Studio, on the corrected revision: that these options need their explanations written.
3. If Sharon rules that a reader needs a signal for "not annotated" (§3 row 1): its wording.

On the learner's result, an option with no explanation shows none; whether anything is said in its place is Daisy's
call, together with the same question for F-1's fix.

## 7 · Review and order

- **Sharon, before implementation:** §2 and §3. Then one result review on the exact commit.
- **Daisy:** the wording of §6, and one result review of the confirmation screen, Studio's marker and the learner's
  result with the disclosure opened.
- **When:** its own commit, at any boundary before Z. It gates nothing. It should come **after F-1's fix**, because
  both touch what the learner's review shows.

## 8 · Log

| Date | Entry |
|---|---|
| 12 Nov 2026 (03:50 UTC) | Owner approved Option A with the conditions of §0. Brief written. Awaiting Sharon's pre-implementation review and Daisy's wording |
