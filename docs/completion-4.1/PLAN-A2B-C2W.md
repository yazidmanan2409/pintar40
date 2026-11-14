# Plan: A2b and C2w (final)

The Chief Architect's final plan, 14 November 2026.

**What changed from the first version (`e9881001`):**

- the owner's independent review, all six points accepted;
- one decision of the Chief Architect's own, §4, on the freeze sequence.

**Unchanged:** no approved design, ruling or order. **Sources:**

- THE PLAN §4.1, §5.3, §5.4 and §7.7;
- Addendum 1 §5a and §5d;
- `A2B-COMPLETION.md` on `claude/a2a`;
- `TEAM-INSTRUCTIONS.md`.

## The decisions

| # | Point | Decision | Why |
|---|---|---|---|
| 1 | A2b: prove work scope with one person in two places | **Accepted, as a required acceptance case** (§2.4, A1–A3) | An inventory test proves every writer is classed. It cannot prove that a classed writer checks the right place. Only a behavioural test with the same person in two classes and two schools proves the owner's ruling R-1, and the cross-school defect it fixes |
| 2 | A2b: settle the boundary before coding; make D3 explicit | **Accepted.** Every boundary is written as a test before the build (§2.3), and D3 gets its own evidence (§2.4, A6–A8) | Boundaries are where A2a's late defects came from (C30-1, C30-2) |
| 3 | A2b: banner refresh within the approved design | **Accepted, and decided:** no polling is added. Every banner stage, at 60, 30 and 15 minutes and at the start, re-reads the status before it shows. An extension or early end therefore shows correctly at the next status read, and a stale stage never shows. The full rendered check at 1280, 390 and 320 px, with keyboard, stays in acceptance | This keeps D8 ("one server read, no added polling") and answers Daisy's open question within it |
| 4 | C2w: entry conditions on the page | **Accepted** (§3.2) | F-1 and F1-R1b are closed. F-3 and F-4 have no recorded closure that I can find; if their evidence exists it is linked, and otherwise they are built first, as their own test commit |
| 5 | C2w: test I-5 in both places; the platform-library authorization case | **Accepted** (§3.4, B4–B6) | The reader must see at once which revision a note describes, wherever they read it |
| 6 | Define the freeze sequence once | **Decided:** the pre-freeze full run **is** the one full pre-flight (§4) | It meets the owner's step 4 (no freeze without a full run) and the rule of one full pre-flight per frozen candidate, without running everything twice |

Each point is settled with Sharon and Daisy under the current delegation. Anything that would change approved
behaviour comes to the owner.

## 1. Where they sit

```
A2a (C frozen; B, then merge, Monday) ─► A2b ─► C2w ─► A3 ─► C3w ─► Z ─► walkthrough
```

- **A2b starts when A2a is merged and accepted on staging.** It changes A2a's tables and writers, so it builds on the
  accepted A2a.
- **A2b lands before A3** (Addendum 1 §5a, condition 3).
- **C2w's design and entry conditions are prepared while A2b is being built.** The build starts once A2b is accepted:
  one engineer, one thing in acceptance at a time.

## 2. A2b: planned maintenance

### 2.1 Purpose

A school can schedule maintenance for one class or for the whole school. The maintenance refuses changes to that
class's or school's work, and nothing else. The system shows people:

- why the maintenance is happening;
- whether it was extended or ended early;
- whether a learner can still finish before it starts;
- every time in the school's own zone.

### 2.2 Already decided (it does not come back to the owner)

| Decision | Source |
|---|---|
| Planned maintenance is **work-scoped** for class and school windows alike. An emergency stays person-level (A2a). Platform-wide maintenance is unchanged | Owner, R-1 |
| Extend and resume early apply to PLANNED windows only. An EMERGENCY ends only through A2a's fenced lift | Addendum 1 §5a, condition 1 |
| Extend is its own function, `perpanjang_pemeliharaan`, the only new writer of a planned window's end. A test enumerates every writer of the end | Chief Architect, 13 Nov |
| A work-scoped refusal is `PR040`, `MAINTENANCE_PLACE`, and never `PT503`. Nobody is sent to the pause page for it | Sharon |
| The place guard reads the clock at the moment of writing, takes no person or account lock, and is skipped entirely when no window is open | Sharon |
| Every writer of a class's work is classed as refused, allowed or system closure, in a test that fails on any unclassified writer | Sharon; the A2b page |
| Banner stages re-read the status before showing. No polling is added | Decision 3 above |

### 2.3 Boundaries, written as tests before any product code

Step 1 of the build is these tests, red first, with the inventory test. Sharon reviews them before any product code is
written.

| # | Boundary | Required behaviour |
|---|---|---|
| K1 | The window starts | A transaction that began before the start and writes after it is refused. **This includes one that waits on a lock before the start and reaches the guarded write after it** (on two connections) |
| K2 | The window ends | A write after the end succeeds, read against the clock at the moment of writing |
| K3 | D4, a timed sitting | Refused when start plus duration would end after a planned window that reaches this work starts. Allowed when it would end before |
| K4 | D4, an untimed sitting | Follows T−15 only, as today |
| K5 | A running sitting when the window starts | Not cut off: it drains through its existing deadline and grace, and the system closer still ends it |
| K6 | Extend during a window, or ending it early | The guard follows the new end at once. A write refused before the change succeeds after an early end |
| K7 | An emergency window | Extend and resume early refuse it. A2a's fenced lift is the only way it ends, and A2a's regression stays green |

### 2.4 Acceptance evidence, named before the build (rule 1)

| # | Evidence | Who runs it | Where |
|---|---|---|---|
| **A1** | **The same teacher in two classes of one school.** A planned window on class 7A: 7A's work refuses the classed changes, 7B's work proceeds, and the teacher can still sign in and teach 7B | Second Eye | Local stack, then CI |
| **A2** | **The same teacher in two schools.** A school-wide planned window at school X: X's work refuses, school Y's work proceeds. This is the cross-school case R-1 fixes | Second Eye | Local stack, then CI |
| **A3** | **The same learner across two classes.** A learner's running sitting in the affected class drains through its deadline and grace (K5). New starts there are refused. Their other class's work proceeds | Second Eye | Local stack, then CI |
| A4 | K1–K7 as written in §2.3, each red first | Second Eye; Sharon reads | Local stack, then CI |
| A5 | Every refused writer in the classing table refuses with `MAINTENANCE_PLACE`, and every allowed writer and the system closure pass | Second Eye | CI |
| **A6** | **Extend, end to end.** The audit row holds before, after, reason and actor. The new end is in force for the guard. The notices change | Second Eye | Local stack, then CI |
| **A7** | **Resume early, end to end.** As for A6. Work resumes at once. The banner shows the window ended at the next status read | Second Eye | Local stack, then CI |
| **A8** | **The emergency stays protected.** Extend and resume early on an EMERGENCY window are refused with their designed code. A2a's lift tests and A2A-K01 stay green, unchanged | Second Eye | CI |
| A9 | Static: `MAINTENANCE_PLACE` never reaches the pause page; `PT503` comes only from the person-level hook; lesson progress is written by `record_lesson_progress` alone | Second Eye | CI |
| A10 | App: no redirect for a work-scoped window; the class's notice shown; another class shown nothing; banner stages re-read; times in the school's zone (WIB, WITA, WIT) | Second Eye | CI |
| A11 | Rendered check at 1280, 390 and 320 px, with keyboard, on every screen D8 touches (the list is fixed before the build) | Second Eye captures; Daisy reviews | Screenshots on the frozen commit |
| A12 | **Request hook timing.** Sharon's limit: p95 ≤ 1 ms with no window active, and after ≤ before + 0.5 ms; also with a work-scoped window active | Second Eye runs it, Sharon reads it | Local stack, on the frozen commit |
| A13 | Journeys A and B; staging promotion with preservation readings before and after | Bob | Actions; staging |

### 2.5 How it is run

- **Step 1** is the inventory test and the boundary tests (§2.3). Sharon reads them before any product code.
- **Each later commit** is handed to its reviewer under the handoff convention (notify, acknowledge, review).
- **Screens** go to Daisy from the first UI commit, at 390 and 320 px, in two batches at most. These early batches are
  development checks. The full rendered check (A11) belongs to acceptance.
- **Measurement tooling,** if any is needed, is a separate commit (rule 5).

### 2.6 Size

- **Forecast:** medium, about two working days of development, then acceptance.
- **Why it is two days, not the first version's one and a half to two:** the added boundary and two-place cases.

## 3. C2w: reviewer notes on sealed questions

### 3.1 Purpose

A reviewer records what a wrong option reveals about learners' thinking, after the question is sealed. A note never
changes a question, a score or a report, and no learner ever sees one.

### 3.2 Entry conditions, recorded on the C2w page before the build

| Condition | State | Action |
|---|---|---|
| F-1 closed (derived views read the key in force) | **Closed**: corrected, accepted and on staging | Link its evidence on the page |
| F1-R1b closed | **Closed**: corrected, accepted and on staging | Link its evidence on the page |
| **F-4:** concurrent edits of one draft, on two connections, using the shared race helper | **No recorded closure found** | If the evidence exists, link it. Otherwise build it first, as its own test-only commit |
| **F-3:** a platform administrator decides a Professional Development certificate review, with its refusal counterpart | **No recorded closure found** | The same as F-4. **If it fails, it is an authorization blocker** and is corrected before C2w (THE PLAN §7.7) |
| A2b accepted on staging | Pending | — |
| Sharon's short design review and Daisy's short review | During A2b's build | Recorded on the page |

### 3.3 Already decided

| Decision | Source |
|---|---|
| Notes are rows in their own table: attributed, dated, immutable. A correction is a new note that replaces the old; nothing is edited or deleted | THE PLAN §5.4 D |
| A note is shown for every revision of the question, stating which revision it was written on | THE PLAN §5.4 D |
| The table can never feed a report, and the metric closure test refuses it by name. Learners never see a note | THE PLAN §5.4; R-5 |
| Platform-library notes are written by the platform's content reviewers only. A school does not annotate platform content in 4.1 | THE PLAN §5.4 D |
| Notes naming a misconception-taxonomy code are out of scope | Owner, M-3 |
| The words are «Catatan peninjau» and «belum dikaitkan dengan pemahaman keliru». «anotasi» never appears on a screen | Owner, ruling 30 |
| Notes do not print | Daisy, O-3 |
| **I-5:** a note written before a key correction stays attached to its revision. Wherever it is read against a later revision whose key differs, it says plainly that it was written before the key was corrected, and which revision it describes | Decided here; Daisy writes the words. If Sharon and Daisy find it must be hidden instead, that changes what reviewers see and comes to the owner |

### 3.4 Acceptance evidence, named before the build

| # | Evidence | Who runs it | Where |
|---|---|---|---|
| B1 | Before and after a note, the question, its options, every result and every metric evaluation are byte-identical | Second Eye; Sharon reads | Local stack, then CI |
| B2 | Refusals: a non-reviewer, a learner and another school's reviewer cannot write. Nothing can update or delete a note. Declaring the table a metric source fails the closure test | Second Eye | CI |
| B3 | App: a reviewer adds and replaces a note. No learner surface or API answer contains one | Second Eye | CI |
| **B4** | **I-5 in Studio.** A note says B is a common wrong answer; the key is then corrected so that B is right. Against the corrected revision, the note shows that it predates the correction and which revision it describes | Second Eye; Daisy reviews the screen | Local stack, CI, screenshots |
| **B5** | **I-5 beside the class report.** The same case, read by a teacher beside the class misconception report | Second Eye; Daisy reviews the screen | Local stack, CI, screenshots |
| **B6** | **Platform-library notes.** A school reviewer cannot create or replace a note on a library question. A teacher in a school that received the release can read it through the class report they are authorized for | Second Eye | Local stack, then CI |
| B7 | Rendered check at 1280, 390 and 320 px, with keyboard: the Studio disclosure and the report disclosure | Second Eye captures; Daisy reviews | Screenshots on the frozen commit |
| B8 | Journeys, staging promotion with preservation readings | Bob | Actions; staging |

### 3.5 Size

- **Forecast:** about one working day, plus F-3 and F-4 if their evidence does not exist (about half a day).
- **Its one escalation:** if reading the revision chain on every display is slow, a stored chain root would add a
  column to `items`, which needs Sharon's review.

## 4. The freeze sequence, for every batch (decision 6)

**One full pre-flight per frozen candidate, and it is the run that decides the freeze.** In order:

1. **Development.** Second Eye runs only focused checks: the tests touching what changed, the batch's own suites and
   the early reads. These are rehearsals, not evidence.
2. **Candidate.** Both reviewers are clear on every commit, and Second Eye names a candidate commit.
3. **The one full pre-flight,** on that exact commit: the full regression suite, the concurrency (race) tests, the
   whole static manifest, every plant and every red case. This is the run the owner asked for before a freeze, and it
   is the acceptance pre-flight. It is not repeated.
4. **Freeze.** If the run is green, Bob freezes exactly that commit, with the run as its evidence. If it is red, there
   is no freeze; the defect is fixed, and step 3 runs again on the new candidate.
5. **Acceptance on the frozen commit:** Sharon's result review, Daisy's screen review, PR and CI, journeys, the
   batch's measurements, merge, and staging promotion with preservation readings.
6. **If a blocker forces a change,** the candidate is explicitly unfrozen, corrected, reviewed, and run through step 3
   again before refreezing.

This is how change C is being frozen now. Second Eye's full run on `f74c6060` is that commit's one full pre-flight.

## 5. Sequence and gates

| Step | When | Gate |
|---|---|---|
| **A2b** | | |
| §2.3's boundary tests and the inventory test agreed with Sharon; the banner rule confirmed with Daisy; the screen list fixed | While A2a's change B and merge run | Recorded on the A2b page |
| Build step 1 (the tests, red first), then the product commits | Once A2a is accepted on staging | Handoff and early read per commit |
| Candidate, full pre-flight, freeze, acceptance (§4) | When both reviewers are clear | Every gate in §2.4; none waived |
| **C2w** | | |
| C2w's entry conditions recorded; F-3 and F-4 evidence linked or built; design reviews done | While A2b is being built | Recorded on the C2w page |
| C2w build, then the same §4 sequence | Once A2b is accepted | Every gate in §3.4 |

**The owner is involved only at milestones:** each freeze, each staging promotion, and any answer that would change
approved behaviour. Production is untouched throughout, and every production change needs the owner's separate
authorisation.

## 6. Risks

| Risk | What we do |
|---|---|
| A classed writer checks the wrong place | The two-place cases A1–A3 |
| A boundary race, as in A2a's late findings | §2.3, written and reviewed before the code |
| A2b weakens A2a's emergency guarantees | K7 and A8; A2a's regression unchanged |
| D8 touches many screens | The screen list is fixed before the build; two batches at most |
| F-3 fails | An authorization blocker, corrected before C2w |
| C2w repeats F-1's defect through old notes | I-5, tested in both places (B4, B5) |
| Weekly usage limit | Batched screens, diff-only reviews, one full pre-flight per candidate |

Forecasts are not commitments. The January forecast for 4.1 is unchanged; the owner sets the date after Z.
