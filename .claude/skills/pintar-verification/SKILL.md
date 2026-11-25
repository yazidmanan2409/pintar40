---
name: pintar-verification
description: How PINTAR proves a change before it is frozen, merged or promoted — red first, plants, redcase, the full local suite, CI and journeys conclusions read from the API, and the diff accounting. Use when preparing or checking freeze evidence, quoting a run result, or reviewing someone else's evidence.
---

# Verification

**Authority:**
- the plan of record §3d (verification wording);
- `docs/ENGINEERING-LESSONS.md` (on main);
- the specialist's record for the change (Sharon: `docs/coordination/reviews/sharon/` on her branch).

When they differ from this skill, they govern.

## The proof a candidate needs (in this order)
1. **Red first.** Each new test or plant is shown failing on the parent commit, with its failing assertion quoted, and passing on the fix.
2. **Locally:**
   - `npm run lint` and `npm run typecheck`;
   - the full suite, `npm run selftest:local` (it needs the local stack);
   - `npm run plants`;
   - the redcase groups.

   Report counts as pass/fail numbers, not adjectives.
3. **The freeze:** one pushed head sha, named as frozen. Any later change is a new freeze, with its delta accounted for.
4. **Remote:** ci and journeys on the **frozen sha**. **Quote only the API's `conclusion` and the time you read it.** «in_progress» is not green, and a claim isn't a result. Write conditions as «required: … green».
5. **Diff accounting:**
   - the PR diff against main, with its sha256 and file count;
   - after an update-branch, prove the diff is byte-identical to the reviewed one, or state the exact expected delta;
   - name any workflow change for the owner.
6. **Independent verification:** Sharon (rules, contracts, boundaries) and Daisy (words, journeys), each against the frozen head.

## Test reliability (W3 §9)
- A test pins, or is independent of, the **order** (random question order), the **time** (UTC against the school's day) and the **data** (randomly drawn addresses) it depends on.
- «Flake» is not a root cause.
- Never skip, disable or quarantine a test to get green.

## Models
- `docs/post-4.1/ci-1/CI-2-FOR-OWNER.md`
- `docs/post-4.1/ci-2/promotion/` (on `claude/bob-41-master-plan`)
