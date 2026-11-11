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

## 8 · Daisy's result review of `40e89308` (11 Nov 2026)

**Daisy: BLOCKED on `40e89308`, for Sharon's disclosure only. No UX defect found.** Her record is
`docs/coordination/ux/completion-4.1/TINJAUAN-B1-KONSISTENSI.md` on `ux-1/daisy-experience` at `4daf09a1`.

- **Confirmed by running it:** a person given a role at a second school and signed in through the real form. Neither
  school admin's page shows the other school; the reader function, called with either admin's own login, returns both
  schools' identifiers for that row. The correction of §4 changes nothing either admin sees on screen.
- **Consistent with «Jejak audit» and the Konfigurasi screens:** placement, time format with the zone's word, names,
  pager, filters, refusal page. Rows stack below 640 px, as she asked. No sideways scroll at 1280, 390 or 320 px; axe
  found no violation. Suspended or closed accounts, transfers and deleted persons read correctly (deletion read in
  code, not run).
- **Not B1 defects (they are B2's):** the «Cetak laporan» button and the printed footer with its reference.

**Her register, non-blocking:**

| Item | Chief Architect's disposition |
|---|---|
| The refusal says «Admin platform» where the platform's term is «Admin PINTAR» | One word in `src/lib/hle.ts`. Taken in the corrected candidate: it is the terminology consistency the owner's check 4 asks for, and it costs no review |
| «Seluruh platform» rows do not name the school, and for a two-school person the platform admin cannot tell which school's clock a row's time uses | Register. To be settled with Daisy's wording before Z; not in the corrected candidate unless it is a one-line change |
| The Konfigurasi index does not list the reader | Register, for the same candidate if it is one entry; otherwise before Z |

**What she needs for PASS:** the corrected candidate's commit, the same one Sharon reviews, with the cross-module
inventory on `B1-COMPLETION.md`. On it she re-runs the two-school check, the five states, and axe at three widths.

## 9 · The corrected candidate, and one finding outside B1 (11 Nov 2026, late)

**Corrected candidate:** `1fc719b5`, committed locally by the engineer and **not pushed**; the full local pre-flight
is running on it. Reported as carrying: the reader correction with its red-first test; Sharon's four checks; backup
and restore of B1's three tables and both jobs; a purge that works through a backlog and a health check that names
one; the cross-module inventory on `B1-COMPLETION.md` with its limitations. None of this has been read by the Chief
Architect yet, because the commit is not on the remote. One 4.0 test (F37-R01) failed once in a long mixed run and
passed alone; the engineer will root-cause it before any CI dispatch if it recurs (§4.1 P4).

**Finding outside B1, reported by the engineer, not fixed:**

| | |
|---|---|
| What | A suspended or closed account that tries to sign in is answered "cannot check right now" (503). A wrong password is answered with the normal refusal (401) |
| Consequence | A suspended person is told the service is down. Anyone trying addresses can tell a suspended or closed account from a wrong password |
| Reported cause | Suspension sets the sign-in system's ban to `banned_until = 'infinity'`, which the local Auth cannot read. Whether hosted staging runs the same Auth is unconfirmed |
| Where it belongs | 4.0's suspension work. B1 records whatever the route answers and is not affected |

**Chief Architect's reading.** This is the standing principle's third question (what happens when things go wrong)
answered late: suspension was tested for what it does to the account's rights, not for what the suspended person and
an outside observer are then told. It is a defect in existing behaviour, small, and it bears on a boundary (which
accounts exist and are suspended). It is not in THE PLAN, so adding its correction is the owner's decision.

**Recommendation put to the owner:** correct it as one small pass at the boundary after B1, with the F-1 pass, before
B2; Sharon reviews it once. Before that, confirm on a running hosted-like Auth whether the 503 occurs there, because
that decides its urgency. The correction must answer: the ban value Auth can read; the same generic refusal as a
wrong password; accounts already suspended (their stored value); reinstatement; and B1's recorded failure code.

## 10 · Owner's decisions on the two findings (11 Nov 2026)

1. **Sign-in by a suspended or closed account:** bounded correction **approved**. Its record is
   `AUTH-SUSPENDED-SIGNIN-CORRECTION.md`. After B1's close, alongside F-1, before B2.
2. **A gap in the accountability record (Daisy's B1-R4): accepted.** The platform admin's reader must not silently
   imply completeness when recording failures have been detected.
   - **What is added:** one concise, qualified notice in the platform admin's view of the reader, linking to the
     platform health information, shown when the health check reports unrecorded events in the period shown.
   - **Limits:** it does not name specific missing records or affected schools unless that is reliably known.
     School-facing notices are deferred until an attribution mechanism is properly designed.
   - **When:** **not in the corrected candidate `1fc719b5`** if its pre-flight is under way; it is not to be
     interrupted. Tracked for completion at a suitable boundary **before Z**. The natural one is B2, which works in
     the same reader for the print reference. Wording is Daisy's; one result review covers it there.
   - **Open until done:** this item. Z does not start with it open.

## 11 · Read of the corrected candidate `1fc719b5` (11 Nov 2026, 22:10 UTC)

Read-only, from `git diff 40e89308 1fc719b5`: one new migration (`M/20270116120000…`), tests, the journey, the
completion page. CI and journeys were dispatched on this commit and had not reported when this was written.

| Point | Reading | Standing |
|---|---|---|
| §4, the disclosure | `akuntabilitas_baca` returns `case when v_platform then e.institution_ids else array[p_sekolah] end`; the stored snapshot is unchanged; the migration asserts the clause is present. Test B1-S05, stated red on `40e89308` | Corrected as ruled |
| Root-cause search | Ten other client readers named on the page; no disclosure found | Done; Sharon verifies |
| Cross-module inventory | On `B1-COMPLETION.md`: sixteen interfaces, each with how it was checked, the test or journey, and its limitation | Present and bounded |
| Transitions | Listed against test ids; corrections, sealed content and emergency stop marked not applicable to B1 | Present |
| Human journey | §8.5 journey 4, B1's part, as a CI journey step and a local walk; the print step deferred to B2, stated | Present |
| Root causes found during the batch | Two, each with what was changed so it cannot recur | Present |
| Local pre-flight (engineer's report) | Lint and typecheck clean; build-identity 11 of 11; 1072 passed, 0 failed, 0 skipped; 156 of 156 planted defects; 11 of 11 groups of CI's planted-defect job | Reported, before the push |

**Two notes, neither blocking:**

1. **The purge runs all its batches in one transaction.** `akuntabilitas_buang_lama` now loops until nothing is left,
   but a function is one transaction, so a large backlog is one long transaction holding its deletions until the
   end, with one audit row. Correct, and acceptable at 4.1's volumes; the batch size bounds each statement, not the
   run. It is the "purge throughput" limitation Sharon asked to see stated, and is hers to judge.
2. **The next-state rows (`SYSTEM-INTEGRITY-4.1.md` §3a) are not on the page.** That section was added after this
   pass was built. B1's two consequential actions are both irreversible by policy and are described in the page's
   behaviour (the purge after twelve months; the clearing of origin and hash at deletion), so nothing is undefined.
   The table form starts with the next pass; B1 is not held for it.

**Not in this candidate, by decision:** the completeness notice (B1-R4, to B2); the «Admin PINTAR» wording and the
Konfigurasi index entry (Daisy's register).

**Chief Architect's boundary check for closing B1:** inventory present; transitions answered; journey run on the
candidate (to be confirmed by the CI journeys run); both reviewers to name `1fc719b5`. Nothing in this read stands in
the way of the two reviews.

## 12 · Sharon's recheck of `1fc719b5` (11 Nov 2026)

**Sharon: PASS on `1fc719b5127313bf24084695fa30d7505e15b5d1`.** CI run `43110782265` and journeys run `43110786290`
both completed successfully on that commit (checked by her on GitHub). B1 may close once Daisy's review also passes.

- **Verified:** the disclosure correction and B1-S05; the root-cause search (three remaining reads recorded as
  by-design: `murid_keluar`'s one bit, INV-25 portability, `pindah_masuk` naming the sending school); a real learner
  transfer (B1-S06); «Jejak audit» and the reader agreeing on the purge row and a purged reference (B1-S07); backup,
  restore and retention (DR-D02); journey step B1J; the inventory's accuracy and its stated limitations.
- **Governed limitation 1:** a suspended or closed account's sign-in is recorded with the route's present answer
  (`LAYANAN_TIDAK_TERSEDIA`). It is a generic code and discloses nothing in the record; it follows the scheduled
  sign-in correction. **Her acceptance condition for that correction** is carried into
  `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §5.
- **Governed limitation 2:** the magic-link success test is mandatory before `TAUTAN_MASUK_CADANGAN` is ever enabled.
- **Accepted exception:** the transfer case is proven at the database (B1-S06), not rendered through the reader
  page. Accepted because the page passes `p_sekolah` straight to the same function. If a rendered read is wanted, it
  belongs in B2's admin-lookup journey.

**Remaining for B1's close:** Daisy's verdict on the same commit.
