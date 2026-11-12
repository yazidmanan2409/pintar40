# B2 · Chief Architect's notes

> **Coordination note, not a review gate.** B2's completion page is the engineer's
> (`docs/completion-4.1/batches/B2-COMPLETION.md` on the work branch, committed locally at
> `a7c32e09790f25225b7cb7dd8e20ab2086ef8ccc` and not yet pushed when this was written). This file holds rulings and
> dispositions that the page must carry.

## 0 · What holds now

1. **B2 opens for build** when Sharon has passed both the L-1 fix and the F-1 fix, and has passed B2's page in her
   pre-build review.
2. **A learner's own-results print (the page's Q1): Sharon's content rule governs** (§1). The Chief Architect's
   suggestion of the learner's live schools is **superseded** by it.
3. **One choice inside that rule is the owner's to make knowingly** (§1, "the cost"). The content rule is recommended
   and is the working assumption unless the owner chooses otherwise.
4. B2 also takes register items B1-R1 to R5, the completeness notice B1-R4, and the print step of §8.5 journey 4.
5. Existing defect found by the engineer, corrected in B2: `/belajar/hasil` offers «Cetak laporan» on an empty
   report, against THE PLAN §5.2 F.

## 1 · A learner's own-results print (04:05 UTC, 12 Nov 2026)

**The question.** The learner's results page has no class or assignment to serve as the print's scope. The engineer
proposed the learner's one live school as owner, refusing the print with no school or several.

**Agreed by all:** the print is never refused because the learner has several schools; class- and assignment-scoped
prints keep the one-school rule.

**Sharon's ruling (governs):** for a person-scoped print, the school snapshot is **the schools whose evidence the
printed report contains**, not the learner's live affiliations.

- A print is accountability for records, not for the person. B1 already rules that a print belongs to the school
  that owns the printed resource; a person-scoped print extends that rule.
- The reference exists so a school can confirm a printed report is genuine. A departed learner who shows a new school
  a history containing school A's results: under the live snapshot A could not find the reference; under the content
  rule it can.
- It avoids showing a school a print of evidence it does not own.
- **The cost, stated by her:** A's admin learns that a former learner printed A's results after leaving. The event
  carries no content.
- **The owner's alternative:** the live snapshot discloses less, and its consequence is that a departed learner's
  printed report cannot be confirmed by the school that issued its results.

**Requirements for the page:**
1. Computed in the database, from the same scope the report's content is assembled from, at print time: the schools
   of every sitting, result or certificate the page shows. Never the route's word, never the live affiliations.
2. Own prints only: `resource.person_id` is the requester. A staff member printing a learner's report uses a class
   or assignment scope.
3. `accountability_events_print_one_school` is relaxed for the person-scoped resource kind only; a test proves both
   sides.
4. No live school: a departed learner who can still sign in prints their history; the snapshot holds the schools
   whose evidence is on it; with no evidence the snapshot is empty and the event is the platform admin's alone.
   Suspended, closed and anonymised people cannot sign in and never reach this path.
5. Tests: a person at A and B with both schools' results (each finds the reference); the same person with only A's
   results (B finds nothing); a departed learner (the former school finds it, an unrelated school does not); a print
   with no evidence (platform only); a person-scoped print for someone else (refused).

**Chief Architect's note.** The content rule is the better architecture: it keeps one rule for every print (the
owner of the printed evidence), where the suggestion would have introduced a second. One thing for the page to
state under "what else did that change": B1's reader then shows a school admin an event for a person who is no
longer at that school, which is correct and should not surprise the admin; the wording of that row is Daisy's if it
needs any.

## 2 · Log

| Date | Entry |
|---|---|
| 12 Nov 2026 (04:05 UTC) | Sharon's ruling on the learner's own-results print recorded; the owner's choice put |
