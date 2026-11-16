# Roadmap Revision 3: handover assessment

Bob, roadmap custodian, for the owner. 16 November 2026, about 06:20 UTC.

The roadmap is stored as `docs/roadmap/PINTAR-CONSOLIDATED-ROADMAP-4.0-TO-5.0-REV3.md`. Its custody note records two
source references neutralised under the repository rule.

## A · Acknowledgement

- **Read in full,** including Appendices A to E.
- **Its authority, as I will apply it:**
  - Revision 3 is the consolidated planning reference.
  - THE PLAN revision 9, its addendum and later rulings govern 4.1 execution.
  - Explicit owner rulings govern their own scope.
  - The roadmap authorises no implementation.
- **Planning, implementation, engineering and staging acceptance, educator acceptance and production authorisation**
  are kept as separate milestones.
- **Sources I could not access:**
  - `docs/roadmap/PINTAR-ROADMAP.md` and `ROADMAP-RECONCILIATION-2026-11-11.md` (S1). They are not in the repository.
  - The September Horizon Review.
  - The roadmap-folder `OWNER-DECISIONS-2026-11-11.md`.
  - The 5.5 coordination record (S5).
  - The efficiency audit (S7).

  I claim no independent verification of those.
- **One source Revision 3 could not reach, and I can:** the completion-folder `OWNER-DECISIONS-2026-11-11.md` is on
  `main`. See C, finding M-03.

## B · Current 4.1 position (verified on the branches, 06:15 UTC)

| Batch | Verified state |
|---|---|
| A2a | **Accepted on staging, and complete on `main`.** |
| A2b | **Building toward freeze** on `claude/a2b`, head `679987cb`. Details below |
| C2w, A3, C3w, Z | Not started. They follow in the approved order |
| E | Prepared, **not run** (`C3-EVALUATION-PLAN.md`). No credentials or egress, and no judges named |

**A2a's evidence**, which fills Revision 3's gap on 4.1 row A2a:

- C frozen at `c04c088e`, merged as `bbed52e4` (PR #22);
- B merged as `eff99f98` (PR #23);
- scale run 43782374237, with Sharon's verdict `6fd9fbcc`;
- staging run 43789058922, the hosted reads, and the preservation pair at `86490991`.

One A2a defect, D1-2 and D1-3, is fixed on A2b's branch and reaches staging with A2b.

**A2b in detail:**

- **R-C's removal of D4 is verified by Sharon** (`81fab3da`): the closing-date path is gone from the database, and
  the permanent test A2B-D4X guards it.
- **Done:** R-A and R-B are built; D4 is marked superseded on the page and in the migration header; the full suite
  was green at 1197 on `a1429521`.
- **Daisy's D8 screen batch 1** was handed over at 06:15.
- **Next approved action:** Daisy's screen review, then the exact candidate and its one full pre-flight, then the
  freeze. After that come PR and CI, journeys, and staging promotion. The "before" preservation read is taken BEFORE
  the merge, and the query gains its `maintenance_windows` line.

## C · Consistency findings: disposition and planning window

| ID | Disposition | Window |
|---|---|---|
| **H-01** Correction propagation | Accepted. 4.1's correction rules (O41-21, O41-22, C1w) stand. I will carry the consumer contract into planning | 4.2 historical reports; 4.5 measurement and history |
| **H-02** Two-school authority | Accepted. 4.1's constraint is already in force: O41-12 says "no new assumption that obstructs it". A2b's work-scoped refusal reads the place, not the person's only school | 4.2 design, before appointments |
| **H-03** A2b verification | **Current.** The R-C database removal is verified by Sharon. Screens, exact-candidate pre-flight, concurrency and preservation remain, all within the existing freeze gates. No owner decision | Now, at A2b's freeze; integrated proof at Z |
| **H-04** Retention dependencies | Accepted, **with a correction (M-03 below)**: retention enforcement is not in the owner's 4.2 deferral record | R-2 before production data |
| **H-05** Question Health versus validity | Accepted. Scheduling and validity stay separate. The scheduling deferral comes from EXECUTION-PLAN §4, not from the owner's §4 list | 4.2 scheduling; early-4.5 runtime reproduction |
| **M-01** Growth and interventions | Accepted | 4.5 and 5.0 planning |
| **M-02** Operational exceptions | Accepted; to be written into each plan | 4.2 and 4.5 plans |
| **M-03** Missing source evidence | **Partly closed, and it changes the 4.2 list.** See below | 4.2 planning, near Z |
| **M-04** C2w and C3w entry gates | Accepted, and already C2w's entry conditions (`PLAN-A2B-C2W.md` §3.2). F-3 and F-4 have no recorded closure and are built first if missing | C2w entry; E and C3w entry |

### M-03: the controlling 4.2 record

The controlling record is `docs/completion-4.1/OWNER-DECISIONS-2026-11-11.md` §4. Revision 3's eight items came from
my 13 November status report, which summarised §4 imprecisely. **That error is mine.**

| | Items |
|---|---|
| **In §4 (owner-deferred to 4.2)** | Exam Mode; positions, dated history, acting appointments and future-dated roles; school data export; opening past reports, with a period selector; a school admin adding one person outside an import and correcting a name after activation; declining an account request; password change while signed in; the "classes without a teacher" view; one person at two schools (O41-12); PD corrections (end a programme, remove a participant, the school ending its own PD sittings); structure corrections (reactivate or move a class, rename a school, undo a promotion run as a whole) |
| **Assigned to 4.2 by EXECUTION-PLAN §4, not by the owner's list** | Scheduled question-health recomputation; a teacher's handover view after a colleague leaves |
| **In Revision 3's eight, but in no 4.2 deferral I can find** | **Retention enforcement.** THE PLAN only notes that `retention_days` is unenforced. Its version is unassigned |
| **"Later than 4.2 unless ruled in" (§4)** | Closing or archiving a school; a foundation above several schools; editable year dates and semesters; un-revoking a certificate; restoring a withdrawn release; schools adapting platform content; briefings; learner and family deletion (with counsel). Revision 3 lists four of these eight |

**Proposed roadmap correction** (no rewrite):

- 4.2's list follows §4 above, plus the two EXECUTION-PLAN items, marked as such.
- Retention enforcement becomes **unassigned, decision at 4.2 planning**. R-2 is still needed before production data.
- I will make the edit under the change-control rule once you confirm. It needs nothing from you before Z.

## D · Dependencies that threaten 4.1

- **None at the roadmap level.**
- **The one real schedule risk is E.**
  - It gates C3w, the last batch, and it has not run.
  - Its preconditions wait on owner actions: data-terms confirmation (P1), network egress (P4), capped keys (P5) and
    named educator judges (P7).
  - The owner's own ruling is that E should run "as early as its access allows".
  - If it starts only when A3 ends, C3w and therefore Z wait for the evaluation and judging.

## E · Owner decisions

**Now, or at an approaching gate:**

1. **E's preconditions,** to keep C3w off the critical path:
   - confirm the data terms;
   - approve egress to the evaluated providers' API hosts;
   - authorise one capped key per provider, entered as network secrets by you;
   - name the educator judges.

   I'll bring this as one decision pack when you want it. It doesn't affect A2b, C2w or A3.
2. **At Z:** staging promotion and scheduling the walkthrough. That one is not due yet.

**Not now:**

- R-1, R-4, R-5;
- the broader institution model and the other unassigned items;
- the 4.2 plan, including assessment-specific time limits and the corrected 4.2 list (M-03);
- the rationalisation audit's measures;
- R-2 (before production data).

## F · Coordination approach: light, using what already exists

- **Per batch:** the completion page gains two short lines, "And then what?" (end state, failure and recovery) and
  "What else changed?" (consumers, reports, permissions, history). Each points to its row in Appendix A. Reviewers
  already check these; the lines make it explicit. Nothing new is written for future-version features.
- **Integrated journeys:** Z's acceptance scenarios are THE PLAN §8.5's five journeys, **as amended by Addendum 1**: a sixth journey (an account's life), and Journey 3 extended with a sitting on the corrected revision and the rewriting of withdrawn explanations. *(Corrected 16 Nov; first written as "five".)* At Z, I map each to the
  applicable parts of roadmap journeys A, B, C and I, as a coverage note and not as new tests.
- **Decision register:** one short file, `docs/roadmap/DECISIONS-TO-TRACK.md`, holding sections A to F of your
  handover. Each entry is updated only when a decision is made or its gate approaches.
- **Roadmap edits:** only on an owner decision, through the change-control steps. Engineering progress stays in the
  execution records.
- **Post-4.1 rationalisation:** prepared after Z, not before.

## G · Recommendation

**Revision 3 is suitable for adoption as the consolidated planning reference.**

- I found no material design contradiction.
- One factual correction is needed: the 4.2 list and retention enforcement's assignment (M-03 above). It changes
  planning inputs, not direction, and needs no general revision.
