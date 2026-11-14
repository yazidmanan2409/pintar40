# Plan: A2b and C2w

Written by the Chief Architect for the owner on 14 November 2026. It draws on:

- THE PLAN §5.3 and §5.4;
- Addendum 1 §5a and §5d;
- the A2b page, `A2B-COMPLETION.md` on `claude/a2a`;
- the owner's rulings and the working method in `TEAM-INSTRUCTIONS.md`.

**Nothing in it changes an approved design or the order.** It sets out how both batches are run, using what A2a
taught us.

## 1. Where they sit

```
A2a (C frozen; B, then merge, Monday) ─► A2b ─► C2w ─► A3 ─► C3w ─► Z ─► walkthrough
```

- **A2b starts when A2a is merged and on staging.** A2b changes A2a's tables and writers, so it is built on the
  accepted A2a, never on a branch of it.
- **A2b must land before A3** (Addendum 1 §5a, condition 3). D4 and A3 change the same start path.
- **C2w is independent and small.** Its design reviews run while A2b is being built, so it is ready to build the
  moment A2b is accepted. It is built after A2b, never at the same time: one engineer, and one thing in acceptance at
  a time (rule 4).

## 2. A2b: planned maintenance

### Purpose

A school can schedule maintenance for one class or for the whole school without stopping anyone's other work. The
system tells people:

- why the maintenance is happening;
- whether it was extended or ended early;
- whether a learner can still finish before it starts;
- every time in the school's own zone.

### Already decided (it does not come back to the owner)

| Decision | Source |
|---|---|
| **Planned maintenance is work-scoped**, for class and school windows alike. It refuses changes to that class's work and does not stop the person. An emergency stays person-level (A2a). Platform-wide maintenance is unchanged | Owner, R-1, 12 Nov |
| A2b's extend and resume early apply to PLANNED windows only. An EMERGENCY is ended only through A2a's fenced lift | Addendum 1 §5a, condition 1 |
| Extend gets its own function, `perpanjang_pemeliharaan`, as the only new writer of a planned window's end. Nothing else may push an end later, and a test enumerates every writer of the end | Chief Architect, 13 Nov |
| A work-scoped refusal is its own code (`PR040`, `MAINTENANCE_PLACE`). It never sends anyone to the pause page | Sharon's inventory rulings |
| The place guard reads the clock at the moment of writing, takes no person or account lock, and is skipped entirely when no window is open | Sharon's rulings and early read |
| Every writer of a class's work is classed as refused, allowed or system closure, in a test that fails on any unclassified writer (the table on the A2b page) | Sharon |

### What it builds

The ten items on the A2b page:

1. the place guard;
2. the request hook keeps only person-level refusals;
3. every writer asks the place question;
4. starting work is guarded;
5. D4, "cannot finish before the window";
6. D2, the reason list;
7. D3, extend and resume early;
8. the work-scoped refusal;
9. the status read says person-level or work-scoped;
10. D8, every time in the school's zone.

It also lifts A2a's "a class window is emergency only" CHECK, in the same migration that adds the class parameter.

### Open before the build: two questions, both for the team

1. **Sharon:** is the place guard's race with the window's start acceptable for PLANNED windows, as the page states
   it? A transaction that began before the start and writes after it is refused.
2. **Daisy:** her A2b screens and words are in hand at the design stage. One question is open: does each banner stage
   re-read the state before it shows, so that a stale stage never appears?

Neither is expected to need the owner. If either answer would change approved behaviour, it comes to you.

### How it is run: A2a's lessons applied

| Lesson from A2a | What A2b does |
|---|---|
| A missed reader is the costliest defect (A2A-T01) | **Step 1 is an inventory test**, before any product change. It covers every reader and writer of `maintenance_windows` and every writer of a class's work, with a test that fails on any one unclassified. The A2b page already lists them; the test makes the list enforced |
| The screens were the scheduling risk | **Daisy reviews at the design stage, which is already done.** Screens are captured from the first UI commit, at 390 and 320 px. D8 touches every screen that shows a time, so the screen list is fixed before the build, and screens go to her in two batches at most |
| Handoffs waited | The handoff convention: notify the reviewer, they acknowledge, review starts; Bob relays only when messaging fails |
| Review against the rules, not just the tests | Sharon reads each commit against her rulings and the owner's R-1, not against Second Eye's tests |
| The full static manifest was missing from the regression set | The pre-freeze run includes regression, concurrency and the whole static manifest, every time |
| Product and tooling apart | A2b's measurement (below) needs no new tooling. If any is needed, it is a separate commit |

### Acceptance evidence, named before the build (rule 1)

Each is already on the A2b page.

| Evidence | Who runs it | Where |
|---|---|---|
| Database race tests, red first: the guard against the window's start, on two connections; every refused writer; D4 | Second Eye | Local stack, then CI |
| Static tests: `MAINTENANCE_PLACE` never reaches the pause page; `PT503` comes only from the person-level hook | Second Eye | CI |
| App tests: no redirect for a work-scoped window; the banner at 320 px; the class's notice shown, another class shown nothing | Second Eye | CI |
| **Request hook timing.** Sharon's limit: p95 ≤ 1 ms with no window active, and after ≤ before + 0.5 ms; also measured with a work-scoped window active | Second Eye runs it, Sharon reads it | Local stack, on the frozen commit |
| Journeys A and B; one full pre-flight per frozen candidate; preservation readings before and after the staging promotion | Bob | GitHub Actions; staging |

### Size

- **Forecast:** medium, about one and a half to two working days of development, then acceptance.
- **Smaller than A2a:** no fence, no held time and no lock-order changes.
- **What could stretch it:** the number of writers in the classing, and D8's reach across screens.

## 3. C2w: reviewer notes on sealed questions

### Purpose

A reviewer can record what a wrong option reveals about a learner's thinking, after the question is sealed. Doing so
never changes the question, a score or a report.

### Already decided

| Decision | Source |
|---|---|
| Notes are rows in their own table: attributed, dated, immutable. A correction is a new note that replaces the old one; nothing is edited or deleted | THE PLAN §5.4 D |
| A note is shown for every revision of the question, stating which revision it was written on | THE PLAN §5.4 D |
| The table can never feed a report. The metric closure test refuses it by name, as with feedback today. Learners never see a note | THE PLAN §5.4; R-5 |
| Notes naming a code from the misconception taxonomy are out of scope | Owner, M-3 |
| The on-screen words are «Catatan peninjau», and the missing link reads «belum dikaitkan dengan pemahaman keliru». «anotasi» never appears on a screen | Owner, ruling 30 |
| Notes do not print, in Studio or in the class report | Daisy, O-3 |

### Open before the build: one question

**I-5: a note written before a key correction.** After a key correction, a note saying "option B is a typical error"
could sit beside a revision where B is the key, which is F-1's defect again.

- **Proposal:** the note stays attached to the revision it was written on. Wherever it is shown against a later
  revision whose key differs, it carries a plain line saying it was written before the key was corrected.
- **Reviews:** Sharon reviews the rule, Daisy the words.
- **Not for the owner,** unless they conclude that such a note must be hidden. That would change what a reviewer
  sees, so it would come to you.

### What it builds

THE PLAN §5.4 G, in this order:

1. the table, its immutability guard, create and supersede, the two readers, and the metric-source refusal;
2. copy;
3. server actions;
4. the disclosure on the Studio package page, after «Riwayat soal»;
5. the quiet disclosure beside the class misconception report.

### Acceptance evidence, named before the build

| Evidence | Who runs it | Where |
|---|---|---|
| Before and after a note, the question, its options, every result and every metric evaluation are byte-identical | Second Eye; Sharon reads it | Local stack, then CI |
| Refusals: a non-reviewer, a learner, another school's reviewer; no update or delete; declaring the table a metric source fails the closure test | Second Eye | CI |
| App: a reviewer adds and replaces a note; a teacher reads it beside the report; no learner surface or API answer contains it; 320 px by keyboard | Second Eye, screens to Daisy | CI; screenshots |
| The I-5 case: a note written before a key correction, shown against the corrected revision | Second Eye | Local stack, then CI |
| Journeys, one full pre-flight per frozen candidate, staging promotion with preservation readings | Bob | Actions; staging |

### Size

- **Forecast:** small to medium, about one working day of development, then acceptance.
- **Its one escalation:** if reading the revision chain on every display proves slow, a stored chain root would add a
  column to `items`, which needs Sharon's review.

## 4. Sequence and gates

| Step | When | Gate |
|---|---|---|
| **A2b** | | |
| A2b's two open questions answered (Sharon, Daisy) | While B's scale job and A2a's merge run | Written answers on their branches |
| A2b step 1: the inventory test, red first | Once A2a is on staging | Sharon's early read |
| A2b build, early reads per commit, screens from the first UI commit | Next | Handoff per commit |
| Full regression, concurrency and static run; then the freeze | When both reviewers are clear | Green run; Bob declares the freeze |
| Sharon's result review, Daisy's screen review, one full pre-flight, PR and CI, journeys, timing measurement, merge, staging with preservation readings | Next | Each gate as in A2a; none waived |
| **C2w** | | |
| C2w design: Sharon's short review, Daisy's short review, the I-5 rule | While A2b is being built | Answers recorded on the C2w page |
| C2w build, then the same acceptance path | Once A2b is accepted | As above |

**The owner is involved only at milestones:** each freeze, each staging promotion, and any answer that would change
approved behaviour. Production is untouched throughout, and every production change still needs your separate
authorisation.

## 5. Risks

| Risk | What we do |
|---|---|
| A writer of a class's work is missed by the place guard | The classing test fails on any unclassified writer (step 1) |
| D8 touches many screens and slows Daisy's review | The screen list is fixed before the build; screens arrive in two batches at most |
| A2b weakens A2a's emergency guarantees | A2a's regression stays in the suite. Emergency windows are refused by extend and resume early. Sharon reads A2b against her §5a conditions |
| Weekly usage limit | The economy rules from 14 Nov stay: batched screens, diff-only reads, one full run before each freeze |
| C2w recreates F-1's defect through old notes | The I-5 rule and its test |

Forecasts are not commitments. The January forecast for 4.1 is unchanged; the owner sets the date after Z.
