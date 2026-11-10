# Next controlled correction (owner decisions, 8 Nov); start only after the cd94ad07 runs finish

Record these decisions in the repository with the first commit after the runs, in the register and F-OWNER-DECISIONS.

1. **Classless learner recovery (owner approved).** An authorized administrator places an existing, classless learner in a Kelas, without deleting or recreating them. Identity, records, role boundaries and audit are preserved.
   - Investigate reuse first: `pindah_masuk` (Konfigurasi «Pindah», which today takes only a Kelas or Tingkat source), enrollment and membership creation, transfers.
   - A narrow migration is authorized if genuinely necessary. Likely shape: the source list gains «Belum di Kelas mana pun» (people of the school with STUDENT standing and no open membership), and the move creates the enrollment and membership. Same capability (CAN_PROVISION_PEOPLE), and audited.
   - Regression: a DB test (red then green; the scope and role refusals), an app test, and a walk step.
   - Then: Aktivasi or the Pindah page can say «belum punya kelas» and link to Pindah.
2. **Studio content check (confirmed as built in 2be7a796).** The mark runs the check and an ERROR blocks. Verify the error path live: the explanation plus the correction route (a corrected workbook as the next version). Non-blocking findings stay as they are.
3. **Studio home count (W1.16), required before final 4.0 acceptance.** Correct `studio_home` so it counts VALIDATED, APPROVED and FROZEN packages for the person who may take each one's next step, with a migration. Then restore an honest zero line. Regression: a DB test per state.
4. **Verification and records.**
   - Gates on the resulting exact SHA: typecheck, full suite, CI, journeys.
   - Daisy's targeted re-verification.
   - Keep tracking: NVDA/TalkBack, H1–H20, the Indonesia-region figures, staging after authorization.
   - No merge or deployment without the owner.

## Verified baseline (owner accepted, 8 Nov)

**`5919a370eafbbf6de5dc042c428807f8d2fff362`:**
- CI 42442891085: success.
- Journeys 42442892785: success.
- Application tree identical to Daisy's READY `14361bda`.
- Sharon's `04abab88` is merged (`9535f65d`).

**Not promoted (owner).** A tag `siap-baseline-5919a370` exists locally; the session cannot push tags, so the SHA is the reference. Every commit after it, this one included, needs its own exact-SHA gates before it can be promoted.

## The owner's direction for this change (8 Nov)

1. **Classless learner recovery.** Prefer reusing Pindah, enrollment and membership; preserve identity, permissions and audit.
2. **Studio home count.** Correct the underlying action-required count, scoped to the user and role, with regression tests for both inclusion and exclusion.
3. **The live content-check refusal path.** Exercise it, including the correction path.
4. **Before dispatching CI and journeys,** run the consolidated local verification: full suite on a fresh build, `audit/siap-jalan.mjs` with R5 and R6 made real, and DB tests red then green.
5. **Daisy's targeted re-verification** of the affected screens: Pindah or Aktivasi, Studio home, the content-check refusal.
6. **Return one final candidate** with its SHA, the evidence, Daisy's verdict and a promotion recommendation. No merge or deployment without the owner. No invitation to Dr Gladys.
