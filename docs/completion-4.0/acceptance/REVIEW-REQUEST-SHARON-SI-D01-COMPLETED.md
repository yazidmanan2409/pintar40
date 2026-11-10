# Sharon: SI-D01 completed, re-review (System Integrity Gate)

Please review this independently and read-only, on exact head `3f279361d095dd93145c1a94fcea7d6bb9d5cef2` of
`claude/system-integrity-4.0`. It is not on the reporting branch.

- **The change:** `supabase/migrations/20270112110000_evidence_is_decided_where_it_was_given.sql`, on top of
  `20270112100000`, which you reviewed.
- **The tests:** `selftest/db/fable37.sql`, F37-D01 to D06, B01, D02, C01, and `selftest/bob43.test.ts` (BOB43-D01
  restated).
- **The probe:** `audit/integritas-peran.mjs`.
- **The record:** `docs/completion-4.0/acceptance/SYSTEM-INTEGRITY-MATRIX.md` §4b.

The owner ruled D5 on 9 Nov: **APPROVED, least privilege.** «School Administrators retain legitimate operational and
integrity-review capabilities, but must not have blanket access to learners' answers or presented questions. For a
legitimate investigation, provide narrowly scoped, audited, one-sitting-at-a-time access with a required reason and an
existing qualifying integrity case. Do not create a general-purpose answer browser.»

Please answer each item: verified, or a finding with a reproducible case.

1. **Your finding 1, reclassification.**
   - The read policy, the insert policy and `enforce_evidence_override` now decide on `CAN_REVIEW_INTEGRITY` over
     `coalesce(class_node_id, cohort_node_id)`; a professional-learning sitting is the platform's.
   - F37-D03 is your case: on `4f2d2c1b`'s rules, B's head's insert returned OK.
   - Is there any other path that writes an override, or lowers a sitting's evidence class, without that check?
2. **Your finding 2, lesson progress.** The rule is: a learning assignment of the progress row's release on a node the
   reader holds CAN_ASSIGN_LEARNING over, for a learner with a membership (current or past) at that node or below it
   (`org_nodes.jalur @> array[la.node_id]`). Is this your intended rule? Does the memberships/enrollments join behave
   under the caller's rights as you found before?
3. **Your finding 3, the place.**
   - Every rule anchors on `coalesce(class_node_id, cohort_node_id)` and fails closed with neither.
   - `sesi_tempat(uuid)` is a small definer helper the policies call.
   - **A question for you (not changed):** `integrity_signals_awaiting_review` lists every observation in the school to
     any holder of the capability, beyond what the table now gives. We narrowed it, and that broke F21-I01, the list's
     approved contract (FD-7, DG-32: another department's head sees what waits, with no referral offered). So only
     `may_refer` moved to the sitting's place. Should the list show no more than the table now gives?
   - **A choice to check:** a sitting with neither a Kelas nor an Angkatan is now *reclassified* over the school's root.
     F02-T17's official sitting has no place, and the school's admin must still be able to weaken it. Only the Admin
     sekolah and the platform qualify, never a department's head. *Reading* stays fail-closed. Is that right?
4. **Your item 1, `assessment_sessions`.**
   - The rule is CAN_REVIEW_INTEGRITY or CAN_ASSIGN_LEARNING over the place; the learner's own and the PD branch are
     unchanged.
   - Before narrowing, you asked us to test cohort-assigned sittings and sittings with no class: F37-D05 covers a
     sitting with an Angkatan and no class, and F37-D01 the class's own readers.
   - The app's direct readers (`src/lib/pengajar.ts`, `src/app/studio/integritas/page.tsx`) are exercised by the
     journeys, which are still running.
   - Please name any reader you expect to lose a legitimate row.
5. **D5.**
   - Answers and questions shown now need CAN_REVIEW_INTEGRITY **and** CAN_VIEW_LEARNER_RESULT over the place.
   - `jawaban_untuk_pemeriksaan(p_session, p_alasan)`:
     - opens one sitting's final answers;
     - requires a reason of 10–500 characters;
     - requires an observation on that sitting still undecided (`integrity_signal_decided`);
     - writes one `integrity.answers_opened` audit row per open;
     - refusals (22023 INVESTIGATION_REASON, 42501 INVESTIGATION_NO_CASE / NOT_ALLOWED) write nothing (F37-D06).
   - Is the qualifying case right? Can any parameter or ordering widen it?
   - Is the audit row enough (it records the reason; the reader is the actor)?
6. **Your finding 4, the probe.**
   - An allowed call now passes only on rows > 0 where the world holds rows, otherwise NOT EXERCISED.
   - The audiences are restated: R01/R04 the Guru only; R02/R03 none; T01 no Admin; T03/T04 no Admin (D5); R09 includes
     the IPA head.
   - T07 (sittings) and M06 (reclassification) are new.
   - It has not yet been rerun on a rebuilt report world. Please check the expectations.
7. **Regressions.**
   - BOB43-D01's reference is restated to the completed rule, and its non-empty floor goes from 15 to 12, because sets
     are emptied by design.
   - Is that restatement faithful, or does it hide a reader the PD migration should have kept?
