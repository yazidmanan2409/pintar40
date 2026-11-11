# B1 · Chief Architect's read-only check of the build

> **Coordination note, not a review gate.** Sharon's and Daisy's result reviews are B1's gates. This is the Chief
> Architect's reading of the pushed build against THE PLAN §5.1 and the three execution requirements. Read at
> `claude/system-integrity-4.0` `380b9e07` on 11 Nov 2026, 17:30 UTC. Nothing was changed on that branch.

## 1 · State

| | |
|---|---|
| Build commit | `380b9e07` (15:14 UTC). Its message says the local run was the targeted one and "pre-flight continues" |
| CI on it | **Red.** Run `43053674112`, job "install · lint · typecheck · build", step `selftest:build-identity`. Every later job was skipped, so nothing else has been judged by CI. Journeys run `43053681237` also failed, within 30 seconds |
| B1 | **Not a candidate yet.** Not closed. B2 not opened |

## 2 · The CI failure, reproduced

Reproduced locally at `380b9e07` with `npx tsx selftest/build-identity.check.ts`: 10 pass, 1 fail.

- **Check:** "no selftest file reaches .next except through compiledBundle()".
- **Offender:** `selftest/b1-layar.test.ts:44`, which builds the path
  `join(repoRoot, ".next", "server", "server-reference-manifest.json")` directly.
- **Correction (the check's own instruction):** read the bundle with `compiledBundle(ctx, ...)` and declare
  `requires: ["build"]` on the test.

This is a static check that takes one second locally. It is in the scope of §4.1 P2 (complete local verification
before any push); the push at `380b9e07` went out before the pre-flight had finished. No harm beyond one wasted CI
run, but the rule stands for the candidate: nothing is sent to the reviewers until the whole local pass is green.

## 3 · The three execution requirements, as built

| Requirement | Reading of `M/20270116100000…` | Standing |
|---|---|---|
| Schools computed in the database from the person (Sharon) | `akuntabilitas_catat` takes no school argument; it calls `akuntabilitas_sekolah_orang(person, now)` (live roles within validity, PENDING or ACTIVE enrolments) | Met |
| A print belongs to the one school that owns the resource (Bob) | For `PRINT_REQUEST` the writer resolves the node's or assignment's `institution_id` itself and refuses an unknown resource; a table constraint requires exactly one school on a print row | Met, and stronger than asked |
| Governed deletion exception (Sharon's blocker 3) | The guard admits an update only under the deletion's own marker naming that row's person, only when both fields go to null and every other column is unchanged; delete only under the purge's marker and only for rows past 12 months; truncate refused | Met |

## 4 · One observation for the candidate (for Second Eye; for Sharon at her result review)

**The reader returns the whole `institution_ids` array to a school admin.** `akuntabilitas_baca` filters correctly
(`p_sekolah = any (e.institution_ids)`), but its result row carries the full array. For a person at schools A and B,
school A's admin therefore receives school B's identifier with every sign-in of that person: that the person is
affiliated elsewhere, and where. The page reads only `institution_ids[0]`, for the time zone, but the function is the
boundary, not the page.

- **Suggested correction (small, inside B1):** for a caller who is not the platform admin, return only the caller's
  own school in that column (`array[p_sekolah]`), as `network_origin` is already withheld from them. The platform
  admin keeps the full array.
- **Test:** the two-school person's sign-in, read by A's admin, names A only.
- This is the Chief Architect's observation, not an owner decision. If Sharon judges the disclosure acceptable, her
  judgment stands.

## 5 · Next

Second Eye: correct §2, consider §4, finish P1 to P6 locally, then send the exact candidate to Sharon and Daisy. When
both have passed it, B1 is closed and the C1w F-1 correction pass starts (`C1W-F1-CORRECTION.md`), before B2.

## 6 · Update, 11 Nov 2026, 19:35 UTC

| | |
|---|---|
| Head | `40e89308` |
| Since §1 | `0d716802`: §2 corrected as the check instructs (`compiledBundle`, the build declared). `40e89308`: two C1w tests (C1W-S05, C1W-C01) now walk a sitting's result chain by its supersession links, because results written in one transaction share one `computed_at`; tests only, no product code |
| CI on `40e89308` | **Green.** Run `43070532410` (ci) and run `43070539251` (journeys), both success |
| §4 (the reader returns the whole `institution_ids` to a school admin) | **Still open.** No migration changed after `380b9e07`. It remains an observation for Second Eye and for Sharon's result review |
| B1 | A green build exists. **Not closed:** Sharon's and Daisy's result reviews on the exact candidate are still to come. B2 not opened. F-1 not started, correctly |

**On the C1w test change.** The reason given is sound and was checked against the code: `hasil_terkini_id` selects
the result that nothing supersedes and uses `computed_at` only as a tie-break after that condition, so the product
reader does not depend on the ordering the tests relied on. One point for the F-1 pass, which reads the same chain:
any new read of "the result in force" goes through `hasil_terkini_id` or `hasil_murid_id`, never an ordering by
`computed_at`.


## 7 · Sharon's ruling on §4, and what the corrected candidate must carry (11 Nov 2026)

**Sharon: BLOCKED on `40e89308`.** §4 is a blocker for B1's closure; she found the same defect independently in her
result review. The correction and test of §4 are accepted as written:

- A caller who is not the platform admin receives `array[p_sekolah]` in that column; the platform admin keeps the
  full snapshot.
- Test, red first on `40e89308`: a two-school person's sign-in; A's admin reads only A, B's admin reads only B, the
  platform admin reads both.

**Her recheck of the corrected candidate is bounded to:**

1. The disclosure correction and its red-first test.
2. Four checks: the root-cause search across client RPCs for any other path that returns school identifiers or
   affiliation facts; a suspended or closed account's sign-in recorded with the generic failure code; a real learner
   transfer, read separately by A, B and the platform; «Jejak audit» and the reader agreeing on the purge row and on
   a purged print reference.
3. Consistency across authentication, membership, the print writer, L4 deletion with the deleted person's display,
   audit, retention, and backup and restore including the three tables and the reinstalled job.
4. The inventory's accuracy against the code and tests on that commit, including B2's print UI as a dependency, the
   magic-link gate before enablement, the evaluator exclusion and purge throughput.
5. CI and journeys green on the exact commit; the local pre-flight taken from the engineer's P5 note.

Her cross-module verification of `40e89308` is already done and recorded in her result review; the remaining evidence
gaps she named are backup coverage and the human journey through the real transfer path.

**State:** no corrected candidate exists; the work branch's head is still `40e89308`. B1 is not closed. Daisy's
result review is to name the same corrected commit.
