# PINTAR 4.1 · cross-module system integrity at every batch

> **Coordination record.** The owner's instruction of 11 November 2026, kept by the Chief Architect. It enforces the
> existing acceptance standard (the 4.0 System Integrity Gate, `docs/completion-4.0/acceptance/SYSTEM-INTEGRITY-MATRIX.md`)
> throughout 4.1. It is **not** a new batch, a new gate or an amendment to THE PLAN, and it adds no scope.

**The principle behind it** is permanent and is recorded in `STANDING-PRINCIPLE-ONE-SYSTEM.md`: four questions
(*And then what? What else did that change? What happens when things go wrong? Can this action be reversed, and what
survives?*) asked across five dimensions (human
journey, cross-module effects, lifecycle, evidence integrity, boundaries). This page is its working form for 4.1.

**The acceptance question for every batch:** does PINTAR still work correctly, consistently and understandably as one
complete system after this feature is added? A batch is not complete on its own tests alone.

## 1 · The seven checks, and where each already lives

No new step is created. Each check is carried by a step THE PLAN already requires; this table says which, and what
that step must now visibly contain.

| # | Check (the owner's) | Carried by | What must be visible there |
|---|---|---|---|
| 1 | Upstream and downstream integration | §4.1 P1 (impact analysis) | The **cross-module inventory** (§2 below) on the batch's completion page |
| 2 | Cross-role and cross-institution correctness | The batch's database tests; Sharon's result review | For each new read or write: an allowed case and a refused case per role, and one cross-school denial. A person at two schools wherever a person is involved |
| 3 | One authoritative educational truth | §6 (shared objects); Sharon's result review | Every screen, report, export or job that shows a result, misconception, remediation or certificate reads the evidence in force through the one accessor. A contradiction between two readers is a defect, not a display detail |
| 4 | Platform-wide UX consistency | The engineer's rendered check; Daisy's result review | The new screen beside an existing one of the same kind: same terms, navigation, hierarchy, refusal states, keyboard and responsive behaviour; print where the batch prints |
| 5 | Complete human journeys | §8.5; the journeys run in §4.1 P2 | The batch's own journey from §8.5 run on meaningful fixtures on the candidate, by the roles who would do it. API or component tests do not stand in for it |
| 6 | Exceptional states and lifecycle transitions | The batch's verification section (H) | The transitions in §3 below that apply to the batch, each with a test or a stated reason it does not apply |
| 7 | Root-cause regression | §4.1 P4 (failure consolidation) | For every defect found: the shared cause, the other modules inspected for it, and a red-first test. Not only the screen or test that exposed it |

**The four questions against the seven checks.** *And then what?* is checks 1 and 5 (follow the action to the end
of the journey). *What else did that change?* is checks 1, 2, 3 and 4 (every consumer, role, school and screen).
*What happens when things go wrong?* is checks 6 and 7 (the transitions, the failure, the shared cause).
*Can this action be reversed, and what survives?* is check 6, made explicit in §3a.

## 2 · The cross-module inventory (one table, on the completion page)

This is P1's impact list, extended by two columns; it is not a separate document. One row per interface the batch
touches or is read by:

| Interface (producer, consumer, report, screen, export, job, dependent module) | Checked how | Evidence (test id, journey, rendered check) | Limitation, if any |
|---|---|---|---|

It is **bounded**: the interfaces that the change's own search finds (every caller and reader of each changed
object), not a re-audit of the platform. A row may say "not affected", with the search that shows it. A stated
limitation is acceptable; an unlisted interface is not.

## 3 · Transitions to consider at every batch

Corrections (key correction, result supersession) · transfer between classes or schools · changed affiliations and a
person at two schools · suspension and reinstatement · departure and account closure · personal-data deletion (L4) · backup, restore and scheduled-job
recovery · retries and duplicate requests · a failure part-way (what is left behind, and what the user is told) · the
reversal of the action itself · historical records and sealed content · an emergency stop (from A2 on).

## 3a · The next state of each consequential action

For each consequential action a batch adds or changes, the completion page's behaviour section carries one row
(`STANDING-PRINCIPLE-ONE-SYSTEM.md` §4a):

| Action | Kind (reversible, correctable, terminable, irreversible) | Work in progress | Completed work and history | People and institutions affected | Reversed or repeated | Permission, explanation, confirmation, audit |
|---|---|---|---|---|---|---|

This is part of the batch's existing behaviour section and of check 6; it is not a separate document. Most of these
answers are already settled in THE PLAN and the owner's rulings, and the row cites them. A row that cannot be filled
from an existing decision is raised, not improvised.

**The consequential actions of the remaining 4.1 work,** as the Chief Architect reads THE PLAN (the engineer's page
is authoritative):

| Batch | Actions whose next state the page states |
|---|---|
| B1 | the 12-month purge (irreversible, by policy); the nulling of origin and hash at personal-data deletion (irreversible) |
| C1w F-1 pass | none new. It makes the readers agree with an existing correctable action, the governed key correction |
| B2 | an official print and its reference (a record; the reference stops resolving at the purge) |
| A2 | activate, extend, lift and end early an emergency stop or maintenance window; the refused acts during a stop; an enrolment ended during a stop (O1) |
| C2w | add, edit and remove an annotation; what a revision or a copy of the question does to it |
| A3 | authorize a device change, and its withdrawal; what an abandoned device's unsent answers become |
| C3w | accept, edit and discard an AI draft; a review refused by the second educator |

## 4 · What each batch must trace

Guidance for the inventory, from THE PLAN's sections. The engineer's own search is authoritative; these are the
interfaces the Chief Architect expects to see.

| Batch | Interfaces expected in the inventory |
|---|---|
| **B1** accountability events | every sign-in route and method, sign-out, the auth callback; institutional membership (roles, enrolments, a person at two schools, a change of affiliation after the event); the print path that B2 will use; `hapus_data_pribadi` (L4) and the departure wording; `audit_log` (unchanged, no double record); retention and the purge; the job installer, backup, restore and the native-restore runbook; the health check; «Jejak audit» and the admin navigation |
| **C1w F-1 pass** | every reader that marks an answer or derives a misconception or remediation (`C1W-F1-CORRECTION.md` §8); the learner's result and reading map; the teacher's evidence; the class report figure; certificates and their review; history |
| **B2** printed reports | every printable report and its screen counterpart (the same figures, by the same catalogue reads); B1's event and reference; the learner's own print; a purged reference; print at each role; the reference looked up by an admin |
| **A2** stop and maintenance | every writer of a sitting (the enumeration test); the scheduled closer; suspension holds; enrolment, transfer and promotion; late sync; results and certificates after a shifted deadline; the teacher's list; announcements and maintenance warnings in the school's zone |
| **C2w** annotations | the misconception views corrected by F-1; question revisions and lineage; reports that show a question; copies and packages (an annotation's ownership across schools) |
| **A3** device control | sign-in and B1's events; a sitting's writers and A2's fence (lock order); the teacher's authorization; a same-device case; suspension and stop during a device change |
| **C3w** AI drafting | the draft functions and review by a second educator; provenance kept beside the question; limits and refusals; nothing AI-written reaching a learner unreviewed; copies and packages |
| **Z** | all five journeys of §8.5 in one sitting, and the whole inventory read once more against the integrated build |

## 5 · B1: what each party owes (owner's instruction)

- **Second Eye:** the inventory of §2 for B1, on `B1-COMPLETION.md`, with the evidence and any limitation. Existing
  green evidence stands; this is the record of what was traced, plus tests only where a row has none.
- **Sharon (result review, on the exact candidate):** accountability consistency across authentication,
  institutional membership, printing, personal-data deletion, audit history, retention and scheduled-job recovery.
- **Daisy (result review, on the same commit):** the accountability reader against existing PINTAR screens:
  terminology, role visibility and responsive design.
- **Chief Architect's read so far** (`B1-ARCHITECT-CHECK.md`): the three execution requirements are met as built. One
  finding under check 2 is open: the reader returns a two-school person's other school to a school admin. It is a
  concrete reason to change the candidate, and it should be settled before the reviews so they are made once.

## 6 · How the Chief Architect keeps this in force

At each batch boundary, before the batch is treated as closed, the Chief Architect confirms that the completion page
carries the inventory, that the applicable transitions of §3 are answered, that the batch's §8.5 journey ran on the
candidate, and that both reviewers' verdicts name the same commit. A batch missing any of these is not closed. This
adds no review and no document: it is a check that the existing ones were done against the whole platform.
