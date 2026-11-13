# One-line test specifications · F1R1B-R1 and B2-R-S1

Sharon, 13 Nov 2026, at Bob's request. For Second Eye's register corrections. Each is red first on the current work
branch where it can be (state which is green by design).

- **F1R1B-R1 (`F13-K25`):** On a corrected revision once it is sealed, `update item_options set rationale = 'x'` on an
  option whose `rationale_withdrawn_by` is set is refused with INV-04's "is immutable once the course is frozen".
  Afterwards `rationale` is still null and `rationale_withdrawn_by` still names the confirming correction.
  *(Green on base by design: it pins INV-04. Plant: drop `rationale` from `enforce_taught_content_immutable`'s
  `item_options` column list, and it turns red.)*
- **B2-R-S1 (`B2-P07`):** For a learner with a finished chapter at school A, a closed-after-Pemetaan-Awal chapter at
  school B and one begun-only chapter:
  - the set of `institution_id`s of the sittings `hasilBelajar` **renders** equals the person-scoped print's
    `institution_ids`;
  - the assignment ids `hasil_belajar_sesi_orang` returns equal those `myLearningHistory` lists for the same chapters;
  - with an outcome made unreadable for one sitting, either the chapter is still rendered or the print is refused. It
    is never printed with a school the paper does not show.
  - *(Plant: make `hasilBelajar` drop the DITUTUP_AWAL row, and it turns red.)*
