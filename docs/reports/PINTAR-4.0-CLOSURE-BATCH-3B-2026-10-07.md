# PINTAR 4.0 · Closure batch 3b: CR-52's walk, CR-82, and the two rules beneath S6 (D-122, D-123)

**7 October 2026.** Done in the order D-123 set:
1. CR-52 walked.
2. CR-82 fixed and proven.
3. W-2 (CR-76) and CR-81 built red test first, as one engineering batch before Daisy's S6.
4. Its CI, main and staging.

No screen was redesigned. The two screen changes are functional lines the rulings name, and their presentation stays S6's.

## 1. What was closed

| CR | Ruling | What changed | Proof (red before → green after) | Commit |
|---|---|---|---|---|
| CR-52 | D-120 QN5, D-123(1) | Walked, not closed. Bank Soal meets browse (newest 40, none of another school) and no authoring. It has **no filter** and **no key or reason**, and no link to them. **A item, S7, deliberately small** | journey S23q, run 37531719996 (72 PASS, S23q FAIL) | e03e239 |
| CR-82 | D-123(2) | The journey's two chapter fixtures are today's regenerated PINTAR packages (Bab 1 is now 31 questions in 5 lessons). The walk reads its counts from the package and **fails on any WEAK_MISCONCEPTION_LINKAGE finding** on PINTAR's chapters. **Proven:** Bab 1 imports whole (31 questions; the school holds all 18 of its definitions), the head of department reads 31 of 31 questions and 124 of 124 options with their reasons, and both Bab 1 (S17) and Bab 2 (S26d) publish through the real workflow with **zero** weak-linkage findings (Bab 2: no question-quality finding at all) | journeys 37547178658: 72 PASS; the one FAIL is S23q, CR-52's known A item (D-123(1)) | db62bd7 |
| CR-76 (W-2) | D-122(4), D-123(4) | **Whoever referred an integrity case neither takes it up nor decides it** (PR040 REFERRER_CANNOT_DECIDE). The table refuses a referral decided by its referrer. The referrer's card offers no move and says another leader decides. When no other head of department or dean stands over the class, it says so, and that the school admin can appoint one. Existing roles only | F06-P22 red (the referrer took it up and decided it) → green; plant bob39-2; F06-P15 restated (the dean decides); PENUTUPAN-W01 red → green | 1c3e75d, 9b94c1e |
| CR-81 | D-122(3), D-123(3) | **The bands and the floor are the assessed only** (catalogue MC-7). The class's population (placed, assessed, not yet) is reported beside them. The evaluator passes it through below the floor too, so an untested class still says who is waiting (D-121(c)). The teacher's evidence page and every report entry say it in one line | F20-N01 restated, F20-N02 new: red (3 assessed among 5 placed showed bands) → green; PENUTUPAN-K01 red → green | 1c3e75d |

## 2. Choices made where the rulings were silent

1. **The referrer may not take the case up either.** «Saya yang menangani» begins the disposition. A referrer who took it up could never decide it, and it would sit under their name. Everyone else moves the case exactly as before.
2. **"Is there anyone else?"** means an active head of department or dean whose scope contains the class, using `management_scope_over_node`'s own rule applied to another person. It is answered only to a reader who may see the decision.
3. **A learner who has left the class** keeps the band their work there earned (M9) and is counted as assessed. They are not counted as placed or as not yet.
4. **Achieved mastery / below the school's mark** (D-122(3)'s 5 · 1) is not in this batch. Counting it needs each assignment's sealed pass mark, a new governed source. It is S6's question, with CR-81's presentation.

## 3. The runs

| Step | Run | Result |
|---|---|---|
| CR-52 walk | 37531719996 | 72 PASS, S23q FAIL (the finding) |
| CR-82 proof | 37547178658 | **72 PASS**; S17 and S26d with zero weak-linkage findings; S23q FAIL (CR-52, A, expected) |
| CI on bd4c0fa (the batch head) | 37549911642 | **green first time**: 18/18 jobs, every plant gate red for its own reason (bob39-2 among them); the strict selftest **620 passed, 0 failed** |
| main fast-forwarded b5be891 → bd4c0fa (no request file touched) | — | 7 Oct 00:24 UTC |
| CI on main at bd4c0fa | 37551984401 | **green**: 18/18 jobs |
| staging migrated | 37551984344 | **green**: 171 → 173 (last 20261206100000), equal to the repository; the sign-in boundary verified |

Before the dispatch, run locally:
- the referral plant gate: 35 green controls, and bob39-1 and bob39-2 each turn F06-P22 red for their own reason;
- the inline FABLE-06 step: a green baseline, and every plant red for its reason;
- typecheck and lint.

The local full selftest showed only the known local-state failures, and one of mine: UX1-PIMPINAN-KEPUTUSAN-01, because the identifier `pemutusLain` contained the banned letters «sla». The identifier was renamed; the test was not changed.

## 4. Instruments restated with the behaviour

- **The referrer rule:**
  - F06-P15 now uses the dean to probe the state machine and record the decision.
  - The sibling-department case is now raised by the school admin, so the dean deciding it is not its referrer.
  - F06-P22 asserts the new rule.
- **The catalogue pins moved to MC-7:** F06-P23, D088G and BOB43.
- **The migration count** moved to 173 in experience's two pins.
- **The staging laporan walk** reads «Belum mengerjakan» from the population line and flags it if it appears as a band.
- **Journey S23r** asserts that the referrer's card offers no move and says another leader decides. It is proven at the next journeys run.

## 5. The allowance (D-121(d): 1,900 estimated minutes, a ceiling)

| Run | Estimate (min) |
|---|---|
| spent before this round (status of 7 Oct, 03:50 WIB) | 401 |
| CR-52 walk, journeys 37531719996 (red: the finding, D-123's evidence, not waste) | 40 |
| CR-82 proof, journeys 37547178658 | 33 |
| batch 3b CI 37549911642 | 75 |
| main CI 37551984401 | 70 |
| staging 37551984344, and two read-only environment checks (37529584356 and the nightly 37544292482) | 3 |
| **Spent** | **621** |

- **Against your estimate:** you set 441 + about 40 + about 150 ≈ 631 nominal. The actual is **621**.
- **No run was wasted this round.** The batch's CI went green first time; the 144 from batch 3 stay on the record.
- **Remaining: 1,279 of 1,900.**
- **Next forecast:** after Daisy's APPLICATION READY and before S1, as D-122(8) says.
