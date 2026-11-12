# B2 · Chief Architect's notes

> **Coordination note, not a review gate.** B2's completion page is the engineer's
> (`docs/completion-4.1/batches/B2-COMPLETION.md` on the work branch, committed locally at
> `a7c32e09790f25225b7cb7dd8e20ab2086ef8ccc` and not yet pushed when this was written). This file holds rulings and
> dispositions that the page must carry.

## 0 · What holds now

1. **B2 IS OPEN FOR BUILD (Chief Architect, 12 Nov 2026, 06:44 UTC).** Sharon has passed the F-1 fix
   (`bc67f72a0e1c6bc39a2c16292f728080b12710d4`), the L-1 fix (`916d12c01345816afcf567b40131e72b9857cf65`) and B2's
   page in her pre-build review (`b21bec621a449e8d4d90ed646f7fb09c15dfc6f9`), the last **with five changes that the
   page must carry before the build relies on it** (§3). No further pre-build review is needed for them; she checks
   them at the result review.
2. **A learner's own-results print (the page's Q1): Sharon's content rule governs** (§1). The Chief Architect's
   suggestion of the learner's live schools is **superseded** by it.
3. **The owner approved the content rule (12 Nov 2026).** The accountability event identifies the school or schools
   whose evidence appears in the printout, not the learner's current schools. **Existing visibility and authorization
   boundaries are preserved. Historical evidence is not attributed to a new school merely because the learner
   transferred.** (The earlier wording here, that the choice was open, is superseded.)
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

**Decided (owner, 12 Nov 2026, 06:06 UTC): the content rule.** Two conditions of the owner's, each with a test the
page must carry:

- **Boundaries preserved.** The print action shows the learner only what the page already shows them, and a school
  admin's reader shows a print event only to a school in its snapshot. Nothing about a person-scoped print widens who
  can read a result or an event.
- **No attribution by transfer.** A learner who moved from A to B and prints results earned at A produces an event
  that belongs to A alone. B, the current school, is in the snapshot only if evidence earned at B is on the
  printout. This is the second of Sharon's five tests, and it is the one that proves the owner's condition; the
  transferred learner should be its named case.

**Sharon's specification of the second test (12 Nov 2026; this is what she will check at B2's review):**

- **Fixture:** a learner who earned results at A is moved to B through the product's own transfer path
  (`transfer_minta`, `transfer_terima`, `transfer_execute`), then prints a report showing those results.
- **Asserted:** the event's snapshot is `{A}`; A's admin finds the reference and B's admin does not; the platform
  admin finds it.
- **Invariant:** the snapshot comes from each sitting's own `institution_id`, the school where it was given, never
  from the learner's current enrolment.
- **Plant:** derive the snapshot from the live affiliation instead; the test must go red.
- **A second report from the same learner:** one result earned at B is added and both are printed. The snapshot is
  `{A, B}`; each school finds that event and neither is shown the other's identity (the reader returns only the
  caller's own school, as in B1's correction).
- **Also at her review:** the print reference adds no new way for B to read A's evidence. The reference identifies
  the print; printed content is never returned to a reader. Portability (INV-25) is unchanged by B2.

**Chief Architect's note.** The content rule is the better architecture: it keeps one rule for every print (the
owner of the printed evidence), where the suggestion would have introduced a second. One thing for the page to
state under "what else did that change": B1's reader then shows a school admin an event for a person who is no
longer at that school, which is correct and should not surprise the admin; the wording of that row is Daisy's if it
needs any.

## 3 · Sharon's pre-build review of B2's page: PASS on the design, with five changes (12 Nov 2026)

Items 4, 7 and 8 of the engineer's prompt pass as written (B2-P01 to P05; the register R1 to R5; tests, plants, next
state, the four questions and the inventory). "The dialog cancelled, the event stands" is confirmed: the event records
a request, not a printout.

| # | Item | Change required |
|---|---|---|
| 1 | The print action | **The requester the writer receives comes from the verified session on the server** (`auth.getUser()`), never from the request. "Own prints only" is only as strong as where that id comes from; the page states it. *Test (B2-P05):* a request carrying another user's id still writes as the session's user, or is refused |
| 2 | The swap of the footer | `afterprint` does not fire reliably in every browser. If it does not, the referenced footer stays on screen and a later Ctrl+P prints the same reference on a second paper. **Also restore as soon as `window.print()` returns,** keeping `afterprint` as well. *Test:* with `afterprint` suppressed |
| 3 | Q1, the content rule | *Wording:* use "each printed sitting's own `institution_id`" in §2 as in B2-P02; not "the institutions of those sessions' assignments". *Requirement:* **the writer computes the snapshot from the same database read that assembles the learner's results list,** not a second implementation. *Test:* the snapshot equals the set of schools on the rendered page, for the same learner and instant |
| 5 | Q2, the default browser line | **Not reliable for the name.** A stale tab, after a sign-out and another person's sign-in elsewhere, would print a line naming the wrong person. **The default line names no person:** «Dicetak dari browser · {waktu} · tanpa nomor referensi». The device's time at `beforeprint`, with the device's zone, is acceptable because it claims no record; the short line without a time is the fallback if it clashes with the composition. **The wording is Daisy's** |
| 6 | Q3, the completeness notice | `pintar_periksa_kesehatan()` is revoked from every client role and would hand the reader the whole health read. **One new definer function, gated on `is_system_admin()`, returning only the count and last instant of unrecorded accountability writes;** the notice reads that. The rest stands: platform only, qualified wording, no school named, a link to the health check. *Test:* refused to a school admin and to non-platform staff |

**Chief Architect's notes.**
- **Item 5 changes a line of approved UX.** THE PLAN §5.2 F adopted Daisy's browser line. Sharon's ruling is an
  integrity one (a paper must not name someone who did not print it) and takes precedence over the composition; the
  replacement wording is Daisy's, and she is asked for it before the footer is built. If she and Sharon cannot agree
  a line, that comes to the owner; it is not expected.
- **Item 3's requirement is the standing principle in small:** one reader of the truth, so the event and the paper
  cannot disagree.
- **Item 2 is a "what happens when things go wrong" case** found at review instead of in use.

## 2 · Log

| Date | Entry |
|---|---|
| 12 Nov 2026 (04:05 UTC) | Sharon's ruling on the learner's own-results print recorded; the owner's choice put |
| 12 Nov 2026 (06:06 UTC) | Owner approved the content rule, with boundaries preserved and no attribution of historical evidence by transfer. No open decision on B2 |
| 12 Nov 2026 (06:07 UTC) | Sharon's specification of the transferred-learner test recorded |
| 12 Nov 2026 (06:44 UTC) | Sharon: PASS on the L-1 fix; PASS on B2's page with five changes (§3). **B2 opened for build** |
