# FABLE-06 — Intelligence Layer: Briefings for Educators & Deans, and Launch Readiness

Depends on Phases 1–5, and specifically on real cohort data existing (real
learners must have completed real sessions — do not build this phase against
fabricated dummy data as the permanent state).

## The 3-lens model

| Lens | Audience | Question | Artefact | Read time |
|---|---|---|---|---|
| Student | Learner | "What should I study next?" | Peta Bacaan Personal (built in Phase 3) | — |
| Educator | Lecturer | "What should I teach next?" | Class Learning Intelligence briefing | ~60s |
| Institution | Dean | "Is this program working?" | Institutional Learning Intelligence report | ~90s |

Binding rule: educators and deans get narrative and decisions, never raw
analytics tables or charts without an accompanying sentence saying what to
do about them.

## 1. Class Learning Intelligence (`/edukator/ringkasan`)

Hero stats (participants / comprehension % / net gain), a short rich-text
executive summary, pre/post gain bars, explicit "do not reteach" vs. "focus
here" topic lists, ranked misconception cards (claim, affected learner
count, likely root cause, chapter reference), a timed lesson-plan suggestion
(e.g. "10 min case review · 8 min discussion · skip"), and a readiness
distribution (Ready for certification / Needs review / Needs extra support).

Build this reading live from the Phase 2 cohort-misconception and
empirical-difficulty views — do not build a dummy-data fallback as a
permanent code path. If a class hasn't yet reached the minimum-submission
threshold for a reliable briefing, show an honest "not enough data yet, N of
M needed" state instead of substituting fabricated numbers.

## 2. Institutional Learning Intelligence (`/dekan/ringkasan`)

Hero trio (participants / net gain / safety-gate pass rate), an
institutional executive summary, a cohort comparison table with the
program-total row highlighted, strongest competencies vs.
curriculum-review-needed areas, and an accreditation-readiness block
(alignment against the institution's actual accreditation framework —
confirm which framework with the product owner rather than assuming one;
verified-credential count).

Dean surfaces are read-only. Confirm no Studio capability leaks into this
role's UI or API surface.

## 3. Briefings inbox (`/briefings`)

Lifecycle `COLLECTING → GENERATING → READY → REVIEWED → ARCHIVED`.
Story-first cards: gain, issue, recommended action — in that order, not a
table of numbers first.

## 4. Class window / at-a-glance components

Small always-visible classroom-status components (e.g. a "classroom window"
card summarizing current session activity) for an educator's home screen —
keep these glanceable, not a second dashboard.

## 5. Launch readiness

- Confirm CI (from Phase 1) still passes with the full feature surface —
  re-run the deliberately-broken-PR check once more before calling this
  phase done.
- Confirm every open item from the master overview's non-negotiables list
  (FABLE-00) is actually true in the running system, not just true in a
  migration file: RLS closed by default, storage private + signed-URL only,
  hint-leak CHECK constraints present, rationale-required, versioned
  certificate keys, one verification route, tenant isolation present,
  pinned `search_path` on every `SECURITY DEFINER` function, audit trail
  populated, middleware covering learning/assessment routes, validator
  scanning all six learner-read fields, lockfile committed.
- Remove or gate every dev-only tool behind `NODE_ENV==='development'` one
  more time, explicitly, as a final pass — confirm with a production build.
- Write a short "state of the system" doc mirroring this project's own
  evidentiary discipline: for every claim, mark it VERIFIED (name the test
  that proves it), NOT YET VERIFIED, or DESIGNED/NOT IMPLEMENTED. File
  presence is never treated as proof of behavior.

## Acceptance checklist — final automated gate

- [ ] Test: an educator briefing renders from real seeded session data for
      at least one class, and an honest "not enough data" state renders for
      a class seeded below threshold.
- [ ] Test: a dean report renders for at least one institution; assert no
      Studio-capability endpoint responds for the dean role.
- [ ] The full `selftest` suite (Phases 1–6 combined) is green on a good PR
      and red on a deliberately broken one, run right now — not just
      re-trusting Phase 1's original run.
- [ ] `npm run selftest` is the single command that proves every checklist
      item from Phases 1–5 still holds in the final assembled system — if
      any phase's tests were not added to the running suite, add them now
      rather than re-verifying by hand.
- [ ] The "state of the system" doc exists and every claim in it is tagged
      VERIFIED (naming the test) / NOT YET VERIFIED / DESIGNED-NOT-IMPLEMENTED.
