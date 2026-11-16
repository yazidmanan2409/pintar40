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
