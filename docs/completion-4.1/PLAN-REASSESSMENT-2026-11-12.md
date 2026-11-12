# THE PLAN for PINTAR 4.1 · Chief Architect's reassessment

> **An assessment, not an amendment.** Written 12 November 2026 (07:20 UTC) at the owner's request. THE PLAN
> (`THE-PLAN.md`, owner approved at `17cf4a7e59ce7a8f11dd976e2c198ea08977e1ef`) is **not edited** by this document, and
> nothing here takes effect until the owner decides. Development continues in parallel; nothing is held.

**Method.** I re-read §2 to §8 of THE PLAN (the remaining scope, the order, the rules, the six remaining batch
sections, the integration section and the acceptance framework) against: the code and records of B1, L-1, F-1 and the
five small corrections; the standing principle; and three facts read today (staging has 224 migrations and the work
branch 237; `pg_cron` is available on staging but not installed; the provider evaluation's kit was last touched on
10 November and no evaluation has run). I did not consult the team for this draft; §7 lists the three questions where
their judgment would improve it.

---

## 1 · Is THE PLAN still fundamentally sound?

**Yes.** The scope, the batch contents, the architecture of each remaining batch and the acceptance framework hold
up. Nothing we built contradicted a design decision in it. The serial order was right: every batch did touch the same
shared files. The pre-flight has done what it was written for: since it was adopted there has been no red CI caused
by the code, only two runner faults.

**What the last two days showed is not that the plan was wrong, but what it did not contain:**

1. **It had no place for corrections.** B1 was planned as one batch. Closing it produced seven further pieces of
   work (L-1, F-1, L1-F2, L1-F4, F1-R1b, S-1 and a register of seven items), each correct to do, none in the plan.
   They were absorbed by improvisation: nine coordination documents and a queue held in the engineer's head.
2. **Its promotion rule was not followed.** §3 says each closed batch is promoted to staging on the owner's
   authorization. None has been. Thirteen migrations and four closed capabilities now sit unpromoted, and the gap
   grows with every batch.
3. **Its one external dependency has not started.** C3w cannot begin without the provider evaluation's report, the
   owner's choice of provider, the limits, and network egress. E was to run "alongside". It is not running.

Those three are where I recommend change. The rest I recommend leaving alone.

---

## 2 · Material recommendations (each needs the owner's decision)

### M-A · Start the provider evaluation now

| | |
|---|---|
| **Finding** | E is the only item on the path to Z that the team cannot do by itself, and it has the longest lead time: binding terms to read for three providers, the licensing finding, named educator judges, keys with spending caps, network access, the blind run, the judging, the report, then the owner's choice and the limits. THE PLAN §5.7 says its owner-dependent actions "are brought to the owner when needed". They are needed now: every batch between here and C3w is weeks of engineering at most, and E's calendar time does not compress |
| **Recommendation** | Begin E's no-cost prerequisites immediately, in parallel, without the engineer: I prepare the data-handling and licensing findings for the three providers from their official terms (reading only; no key, no cost, no material sent). The owner names the educator judges. The cost-bearing steps (keys with caps, network access, the run itself) are brought to the owner as one decision once the findings are ready |
| **Benefit** | Removes the largest schedule risk to Z. If a provider's terms conflict with what C3w may send (THE PLAN §5.6 J), we learn it weeks earlier |
| **Cost and risk** | My time, in parallel. No engineering time. No spend until the owner authorizes it |
| **Decision needed** | Authorize the no-cost preparation; name the judges when convenient |

### M-B · One promotion checkpoint before A2

| | |
|---|---|
| **Finding** | The plan's per-batch promotion has not happened, for good reasons at each moment (C1w waited on F-1, B1 on L-1). The result is that Z is heading towards a single promotion of every 4.1 migration at once, onto a staging database that has never run them, including the first install of `pg_cron`, the rewrite of locked accounts, a baseline invariant change, and A2's emergency fence. Three things are verified nowhere but on hosted staging: the scheduler (A1), Auth's behaviour for a locked account (L-1), and the restore with its jobs (B1). The longer that waits, the more batches are built on unverified ground |
| **Recommendation** | When B2 and the open small corrections close, and **before A2 starts**, promote that state to staging as one authorized act: B0, A1, C1w, B1, B2 and their corrections. A2 is the riskiest remaining batch; it should start from a base that has been proven on hosted infrastructure. This is a return to THE PLAN §3 and §6.4, not a new rule |
| **Dependencies** | C1w not ahead of F-1 (met) and F1-R1b (in pre-flight); B1 not ahead of L-1 (met); L1-F4 accepted (needs its race test). `pg_cron` enabled on staging as part of the act. The hosted check of a suspended sign-in with one synthetic account is done then |
| **Benefit** | Reliability: hosted-only behaviour is found with five batches of change, not ten. Smaller, reviewable promotion. It also gives the owner something real to look at before Z |
| **Cost and risk** | One promotion's work by the protected process, and its verification (migration and preservation counts, both jobs, each batch's screens). It pauses the engineer for that time. Risk of the alternative: one large promotion at Z, with no room left in the schedule to absorb what it finds |
| **Decision needed** | Whether to plan for that checkpoint. The promotion itself would still need the owner's separate authorization at the time |

### M-C · Split A2 into the emergency batch and the planned-maintenance batch

| | |
|---|---|
| **Finding** | A2 is rated "M" and carries two different things. **C8, emergency containment:** the fence, protection on every sitting-changing act, the time rule, overlapping stops, the suspension interplay, the closer becoming a procedure, Sharon's nine scenarios, and a 50,000-sitting scale test. **C7, planned-maintenance improvements:** a reason list, extend and resume early, "cannot finish before the window", and warnings in the school's zone. The first is the hardest integrity work left in 4.1 and is Sharon's. The second is mostly screens and wording and is Daisy's. B1 taught us that one finding holds a whole batch: B1's screens waited two cycles on a database disclosure they had nothing to do with |
| **Recommendation** | Build and review them as two candidates: **A2a** (class scope, the emergency stop at class scope, and all of D6) and **A2b** (D2, D3, D4, D8). Same content, same order within the sequence, no change to any design. Re-rate A2a as "L" |
| **Benefit** | Each reviewer's cycle is bounded to their own subject. A2a's pre-flight and the nine scenarios are not re-run because a warning's wording changed. The promotion checkpoint of M-B can fall cleanly before A2a |
| **Cost and risk** | Two completion pages and two acceptance runs instead of one. Class scope is shared, so it must land in A2a. The batch structure of `EXECUTION-PLAN.md` was "kept unchanged" by THE PLAN, which is why this is the owner's decision |
| **Decision needed** | Approve the split, or keep A2 whole |

### M-D · A short addendum to THE PLAN, in place of silent drift

| | |
|---|---|
| **Finding** | THE PLAN is the approved baseline and I have not edited it since approval, which was right. But its statements are now behind the facts in specific places: the order diagram (§3), the dependencies (F1-R1b before C2w; L1-F2's helper used by A2 and A3), B2's browser print line (§5.2 F, replaced on integrity grounds), B1's column and reader (§5.1 D), INV-03, and the acceptance journeys (§8.5). Each is recorded somewhere, in nine separate documents |
| **Recommendation** | One document, **"THE PLAN · Addendum 1"**, owner-approved, listing only: the corrections inserted and their place in the sequence; the deviations from the plan's text, each with its ruling; the new dependencies; and whatever the owner decides from this assessment. THE PLAN itself stays byte-identical. The team then reads two documents, not eleven |
| **Benefit** | Efficiency and correctness of instruction. It is also the history the owner asked to be preserved |
| **Cost** | A few hours of mine. No engineering time |
| **Decision needed** | Approve the form. I would bring the addendum itself for approval once the decisions above are made |

---

## 3 · Improvements I can make under existing authority

None changes scope, sequence or a design. Each goes onto the relevant batch's completion page or into the integrity
standard, and I will do them unless the owner objects.

| # | Improvement | Why (evidence) | Where |
|---|---|---|---|
| I-1 | **A short design review by Sharon before any correction is built,** however small | The two corrections built straight from my brief (L-1, F-1) were each blocked at result review and needed a second cycle. The three that had her design review first (L1-F2, L1-F4, F1-R1b) each gained required points before any code existed | Standing practice; integrity standard |
| I-2 | **The impact analysis reads the constraints and the invariants, not only the callers** | Three of my briefs missed something a schema read would have shown: INV-03's NOT NULL, the recovery permit, the closer's selection. The engineer or Sharon caught each. P1 should name, for every column and table touched, its constraints and the baseline invariant that governs it | Integrity standard §2 |
| I-3 | **One enumeration of "everything that writes a sitting", shared by A2 and A3** | A2 needs a test that no sitting-changing act escapes emergency protection. A3 needs a test that no writer escapes the controller check. They enumerate the same functions. L1-F4 has just established the pattern (classify every item; an unclassified one fails; a plant proves it). Build it once in A2 with two attributes, and extend it in A3 | A2a's and A3's pages |
| I-4 | **One multi-connection test helper** | THE PLAN expected A2 to create it. L1-F2 is building it now for its race test, and L1-F4 needs it. A2 and A3 use that one | L1-F2's page; A2a's and A3's |
| I-5 | **C2w: an annotation written before a key correction** | THE PLAN §5.4 shows an annotation on every revision in a question's chain. After a key correction, a note explaining why option B is a typical error would sit on a revision where B is the key. That is F-1's defect class again. The page must say how such a note is shown (as written before the correction, or detached), and F1-R1b must close before C2w | C2w's page |
| I-6 | **C2w: two meanings of "annotation"** | F1-R1b introduces a marker for a wrong option with no misconception code, internally called "not annotated". C2w introduces reviewer notes, called annotations. Teachers will meet both on the same question. Daisy chooses two distinct terms before either ships | Daisy, at F1-R1b's wording |
| I-7 | **A2: what a class-scoped window does to a person in several classes** | THE PLAN §5.3 D1 says a class window "affects a person" enrolled in or teaching that class, and the existing block is per person. As written, planned maintenance on class 7A would stop a teacher who also teaches 7B, and a learner's work in another class. For an emergency, holding everything of an affected person is the safe reading. For planned maintenance it may not be what a school expects. The page states the rule for both, with the two-class and two-school person as named cases | A2a's and A2b's pages; possibly a decision later |
| I-8 | **A3: one teacher act, not two, after a reinstatement** | Suspension ends a learner's sessions. After reinstatement the teacher must resume the held sitting (A1), and because the learner's session is new, a Uji Penguasaan sitting then also needs the teacher's recovery authorization (A3). Two acts for one event, the second inside ten minutes. The page should let the resume of a suspension-held sitting carry the recovery authorization | A3's page |
| I-9 | **A sixth acceptance journey: an account's life** | Z's five journeys (§8.5) cover a school year, an interrupted sitting, a question's life, accountability and maintenance. The corrections of the last two days are all in the account lifecycle (suspend, neutral sign-in, reinstate, close, delete, never re-attach), and no integrated journey exercises it | Integrity standard; Z's page |
| I-10 | **Journey 3 gains two steps** | A learner sits the corrected revision and opens their result; an educator rewrites the withdrawn explanations and the assignment moves again | Z's page |
| I-11 | **Fix the CI runner fault at its cause** | Twice a run failed before any test because the runner's database could not bind its port. Each cost a re-run and about half an hour. A retry on the database start step ends it | Engineer, small |

---

## 4 · One process change worth the owner's view (small, but it touches an acceptance rule)

**Stacked verification for independent small corrections.** THE PLAN §4.7 requires the whole local suite, CI and the
journeys on each candidate commit. For a batch that is right. For five small corrections in a row it means five full
pre-flights and five CI and journey runs of about half an hour each, on one working tree that is blocked meanwhile.
S-1 was already accepted as "covered by the runs of the commit above it".

**Proposal:** up to three small corrections that touch different code may be verified together on the top commit of
their stack. Each is still its own commit, red first, with its own review on its own commit. If the stack's run is
red, it is split and each is run alone. Batches are unaffected.

**Benefit:** roughly halves the waiting on corrections. **Risk:** a failure takes longer to attribute. I rate it
worth doing for corrections and not for batches. It is the owner's because it qualifies an acceptance rule.

---

## 5 · Housekeeping

- **Coordination documents:** nineteen files and about 5,500 lines on the planning branch. With the addendum (M-D), I
  would fold the per-batch architect notes into one register of corrections, dependencies and register items, and
  keep the briefs. The instructions file and the status file stay.
- **Log times** are now read from the clock; earlier estimated times were removed.
- **Relay:** every message between the four of us passes through the owner. The rules adopted yesterday (full
  commits, prompts readable by their recipient, one current statement) have removed the errors. The volume remains.
  If the reviewers and the engineer each read the instructions file at every push, most single-line relays become
  unnecessary.
- **B1's page** now carries its close. B0's, A1's and C1w's completion pages still do not carry theirs.

---

## 6 · What should remain exactly as it is

| Keep | Why |
|---|---|
| The scope of 4.1, and everything listed as not in it | Nothing learned argues for adding or removing a capability. The corrections were defects in what exists, not new scope |
| The serial order B2 → A2 → C2w → A3 → C3w → Z | Its reasons held. A3 late and C3w last are still right. C2w stays where it is: it is small, and it now has a real dependency (F1-R1b) that will be met by then |
| A2's emergency design (§5.3 D6) and Sharon's nine scenarios | Reviewed three times and unchanged by anything since. L-1 and L1-F2 changed how an account is locked, not how a sitting is held |
| A3's controller design, and the owner's rulings D-2 and D-3 | Sound. I-8 adjusts one interaction, not the rule |
| C3w's design, its entry gate, and "generation refused until limits are set" | Sound, and the gate is exactly why M-A matters |
| The pre-flight (§4.1), the completion page before code, one pre-build review, exact-commit reviews | These are what worked. The corrections that skipped a design review are the ones that cost a second cycle |
| The standing principle and the cross-module standard | They found F-1's fourth reader, the recovery grant, the unlocked new account, the re-attached deleted person and the stale explanations. All five were real |
| No 4.5 or 5.0 capability in 4.1 | The item-statistics defects, structured misconception codes and distractor uptake's key flag stay where they were put |

---

## 7 · Are we missing anything important?

Three things, in order of weight.

1. **Hosted reality.** Everything since 4.0 closed has been proven on local databases and CI. Staging has not moved.
   That is M-B.
2. **The evaluation's calendar.** That is M-A.
3. **Capacity for what review will keep finding.** B1 produced about one unplanned correction per day of work. A2 and
   A3 touch more sensitive ground than B1 did. It would be prudent to expect the same rate and to give corrections a
   named place in the sequence (each batch boundary) rather than treat each as a surprise. The addendum (M-D) would
   state that.

**Where the team's independent judgment would improve this assessment** (three questions, none urgent, none needing
the engineer to stop):
- **Sharon:** does splitting A2 (M-C) weaken anything in her nine scenarios, and which hosted-only behaviours would she
  want proven at a checkpoint (M-B)?
- **Daisy:** the two terms of I-6, and whether I-7's planned-maintenance case matches what a school would expect.
- **Second Eye:** real durations for a pre-flight, a CI run and a journeys run, so that the saving in §4 is a
  measurement and not my estimate.

---

## 8 · Would these recommendations improve PINTAR?

| Recommendation | Correctness | Usability | Reliability | Efficiency |
|---|---|---|---|---|
| M-A start the evaluation | | | | **yes** (removes the longest wait) |
| M-B checkpoint promotion | yes (hosted proof) | | **yes** | yes (smaller promotion at Z) |
| M-C split A2 | | | yes (bounded review) | **yes** |
| M-D addendum | yes (one statement of what holds) | | | **yes** |
| I-1, I-2 design review and constraint read | **yes** | | | yes (fewer second cycles) |
| I-3, I-4 shared enumeration and helper | yes | | | **yes** (built once) |
| I-5, I-6 C2w after a correction; two terms | **yes** | **yes** | | |
| I-7, I-8 several classes; one teacher act | yes | **yes** | | |
| I-9, I-10 journeys | yes | | **yes** | |
| §4 stacked verification | | | | **yes** |

**What I would not do, having considered it:** reorder the batches; pull C2w forward; build A3 before A2; reduce the
pre-flight for batches; add a second engineer's parallel lane now (the plan allows it, but the shared files and the
single reviewers would turn the saving into merge and review contention); or fold any small correction into a batch
to save a review.

---

## 9 · The decisions that are the owner's

| # | Decision | My recommendation |
|---|---|---|
| 1 | Start E's no-cost prerequisites now, and name the judges (M-A) | Yes |
| 2 | Plan a staging checkpoint after B2 and the open corrections, before A2 (M-B) | Yes; the promotion itself authorized separately at the time |
| 3 | Split A2 into A2a and A2b (M-C) | Yes |
| 4 | Record changes in an Addendum 1, leaving THE PLAN byte-identical (M-D) | Yes |
| 5 | Stacked verification for small corrections only (§4) | Yes, with the limits stated |

Everything in §3 and §5 proceeds under existing authority unless the owner objects. Nothing in this assessment
authorizes a merge, a promotion or a deployment, and B2 and the correction work continue unchanged.
