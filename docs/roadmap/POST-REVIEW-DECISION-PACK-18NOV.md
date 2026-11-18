# PINTAR · post-review consolidation and decision pack

**Bob, 18 Nov 2026, for the owner.** Committed after the owner's final directive. **The owner's rulings (ruling 55; `docs/completion-4.1/POST-REVIEW-EXECUTION-18NOV.md`) supersede this pack where they differ.** Inputs: Pete's review (PETE-01 to
27), Review X's review (F01 to F10), Bob's consolidation (`57f1688c`, committed before this instruction), and the owner's adviser's
proposal. Nothing here is authorised. 4.1's scope, gates and schedule, and ruling 54, are unchanged.

**Evidence labels:**
- **V-Bob:** verified by Bob on `main` `7ba18b03`.
- **Cited:** the reviewer gives file and line; not re-run.
- **Inferred:** a reviewer's conclusion.
- **Unproven:** a prediction about adoption or behaviour.

**Categories (as asked):**
- **A** · correctness and learner protection;
- **B** · production and school readiness;
- **C** · human validation;
- **D** · everyday teaching;
- **E** · evidence intelligence and growth;
- **F** · engineering rationalisation.

---

## A · Consolidated findings register

**Severity** is Bob's, for real school use. Production has no school on it, so nothing below is live harm today.
**Timing:**
- **Z** = through the existing Z triage, under the severity rules;
- **PR** = Production Readiness;
- **4.2, 4.5, 5.0, F** = those windows (F = rationalisation, after 4.1 acceptance, ruling 54).

### A.1 · Pete (27)

| ID | Claim | Evidence | Sev · users | Existing ruling or commitment | Overlap or conflict | And then what / what else changes | Category · disposition · timing | Acceptance proof |
|---|---|---|---|---|---|---|---|---|
| PETE-01 | No real educator or school has used 4.x | Cited: production counts of 17 Nov; an empty walkthrough record | Critical · all | The walkthrough is a Z entry; human acceptance is separate (Rev 3.3) | F02, F10; the owner's adviser gate G4 | Every later release compounds any wrong assumption | **C** · adopt: an observed walkthrough at Z; a bounded pilot after the gates | Observer sheets; a findings list classed like the walkthrough's |
| PETE-02 | The path to a school has no owned plan (legal, retention, support, a second admin) | Cited: W9.11, W9.16; R-2 open | Critical · schools, families | R-2 is an owner decision; the legal gate is "blocked, external" | F02, F10, PETE-21 | It gates the pilot, production and 4.5's evidence | **B** · adopt: a readiness assessment now | The 4.0 release checklist reads GO; R-2 decided |
| PETE-03 | A new school has nothing to teach with; authoring needs three people | Cited: 0 items in production; the CAN_DRAFT, review and publish chain | High · teachers | The two-person review is by design (C1w); the pass mark is set by the admin | F08, PETE-11, PETE-26 | Adoption stalls before the cycle is seen | **D** + **B** · investigate the content options before the pilot (library, school-authored, import) | Time from first sign-in to a first assigned chapter, observed |
| PETE-04 | The loop stops at the insight | Cited: `bukti/page.tsx`, `ulang/page.tsx:137` | High · teachers, learners | 5.0 intervention direction | F01 (same); PETE-19 | It needs a re-read, Uji Cepat and per-objective results; risk of over-reading | **D** · a 4.2 candidate in a narrower form (§F, Q1); Daisy's concept first | The share of weak-section views that lead to an action, observed |
| PETE-05 | A learner who misses the target is at a dead end; a retry needs a teacher, a reason and a second approver | Cited; the result page has no retake link (V-Bob: `hasil` shows lesson links only) | High · learners | **O41-16** (the second approver) | — | Touches the attempt counts, certificate eligibility and A3's lineage counts | **D** · 4.2 candidate, **designed as a non-certifying retry** (§F, Q2), so O41-16 stands | A learning retry can never produce a certifying result (test) |
| PETE-06 | The certifying test allows assistance; a retake may repeat the questions | **V-Bob** (assistance: `POST_TEST allows_assistance=true, certifies=true`; four kinds, two of them accessibility); repetition inferred | High · learners, certificate readers | The 4.0 mode policy (owner-era design) | Review X is silent; the owner's adviser qualification | Certificate wording, the verification page, accommodations, item-bank size | **A** · investigate now; **owner decides the certificate's meaning before any real certificate** | A certifying sitting refuses hint and worked example (test); repeated items counted |
| PETE-07 | Multi-answer questions: the learner review, the misconception counts and the statistics read the answer as one label | **V-Bob** (`session_review`; `20270117100000`:185, 220, 282) | High · learners, teachers | RD-4 placed Question Health issues in 4.5; 4.1 is closed to them | F03 | Containment touches import, the workbench, the publish validator, C3w's output, copies of courses (`salin_kursus_revisi`) and existing items | **A** · **Z** · contain plus inventory; fix the readers if the inventory finds live content (§F, Q3) | A sitting with one multi-answer question shows the chosen options and the reason, and counts the misconception; or the type cannot reach a learner |
| PETE-08 | "Kenaikan" compares 4 questions with 8 different ones; a positive gain is near-certain | Cited | Medium · teachers, leaders | — | F03, F04 | Leaders read it as effectiveness | **A** (wording, Z if one string) + **E** (the rule, 4.5) | Question counts shown; Daisy's copy review |
| PETE-09 | Question Health counts changed answers, fires only at 5% or 95%, is never refreshed, and teachers can't see it | Cited; **V-Bob:** no scheduled job refreshes it (only two jobs exist) | Medium · authors | **D-12 open;** RD-4 | F03 | 4.2's "scheduled refresh" item would schedule a wrong figure | **A** (reproduce) → **D** (a recorded-counts table, 4.2) → **E** (statistics, 4.5) | Counts equal final answers on a known set |
| PETE-10 | The reading map doesn't steer; the reading gate is screen-only (a typed address skips it) | Cited | Medium · learners | Dr Gladys's original spec | — | Changes what the Pemetaan Awal means and its time cost | **A** (screen and server must agree: verify, Z if a mismatch) + **D** (steering, 4.2) | A typed address gets the same answer as the screen |
| PETE-11 | Setup gates: a per-lesson pass mark blocks assignment; one class at a time | Cited | Medium · teachers, admins | Pass mark set by the school (4.0) | F09 | A default must re-check authority when applied | **D** · 4.2 candidate | Forms needed to assign one chapter to three classes, before and after |
| PETE-12 | PINTAR notifies no one; the key-correction email was left unbuilt | **V-Bob** (`konfigurasi/page.tsx:661` "in-app only") | Medium · approvers | C1-R5 deferred the email | F09 | Every second-approver design depends on the approver visiting | **D** · 4.2 candidate (a counts-only digest, opt-in) | A waiting request appears in the next digest, with no learner data |
| PETE-13 | Activation depends on email; no list of "made, not activated" | Cited | Medium · admins | — | F09 | Teachers without email can't start | **D** · the list is a small Z or pre-pilot item; a staff card route only on evidence | An admin can list everyone not yet activated |
| PETE-14 | Lessons don't work offline; 747 KB string table; no measurement from Indonesia | Cited | Medium · learners | Ruling 54 (optimise after acceptance) | F02, PETE-25 | Caching touches content withdrawal and correction | **F** · measure first (before the pilot); change in F | p95 save and load measured in Indonesia on a named phone |
| PETE-15 | Three thresholds on one number; about 35 terms; two names for one thing | Cited; Daisy has recorded the 64% example | Medium · teachers | Daisy's vocabulary page (D-V) | — | The handbook would teach the confusion | **D** · Z if one string each; otherwise 4.2 | Five teachers agree whether 64% is good |
| PETE-16 | 4.5 will starve for evidence; pool answers about a library question | Inferred | High for 4.5 · authors | The no-cross-school-comparison principle | the owner's adviser: research | It needs consent, a boundary design and a contract clause | **E** · research in 4.5 planning; no ruling now | — |
| PETE-17 | Capture a curriculum reference now | Inferred | Medium · authors | R-5 (the anchor) open | — | Risks committing to the wrong structure | **E** · defer to R-5 | — |
| PETE-18 | Formal evaluation is high-risk; teachers control the sittings used as evidence; an unlisted anonymous feedback round exists | Cited (the feedback round) | High in 4.5 · teachers | **RD-5** (evaluation in 4.5) | F07; the owner's adviser: keep with a gate | Trust in Quiet Intelligence | **E** · keep RD-5 with a separate gate; **investigate the feedback round now** | A statement of which records can enter an evaluation; the round's visibility ruled |
| PETE-19 | 5.0 interventions should be a by-product of action | Inferred | Medium | 5.0 direction | PETE-04 | — | **E** · adopt as a 5.0 design principle | No separate form in the 5.0 journeys |
| PETE-20 | The current text of a database function can't be read in one place | Cited | Medium · engineers | Ruling 54 | — | Review cost on every batch | **F** · function snapshot checked in CI | CI fails on a snapshot mismatch |
| PETE-21 | Production would fail quietly (no error tracking, watches off by default, tier, restore of files) | Cited; the switch state is unknown | High · operators | Production gates | F02, F10 | — | **B** · verify existing controls first; smallest fix | Each watch fails once and alerts; a timed restore |
| PETE-22 | School year fixed 1 Jul to 30 Jun, no semesters; transfer consent is `{}`; rollover unknown | **V-Bob** (`actions.ts:83,132` `p_consent: {}`; the code comment cites OD-9) | Medium · admins | OD-9 (transfer consent policy, open); semesters "later than 4.2" | J08 | Roles expire yearly; open sittings at transfer | **A** (rollover and transfer tests) + **D** (semesters, after consultation) | A test school crosses 1 July without rollover and the result is written down |
| PETE-23 | No term marks recap | Unproven demand | Medium · teachers | — | F04 (which result in force) | Must use "the result in force" consistently | **D** · 4.2 candidate | Recap equals the results in force |
| PETE-24 | 4.2 is planned for administrators nobody has met | Inferred | Medium | **The owner's 4.2 deferral list** | the owner's adviser rejects blanket replacement | — | **D** · re-rank 4.2 with evidence; keep the owner's commitments unless revised | Each 4.2 item cites an observation or a ruling |
| PETE-25 | The tests look inward; no browser test in CI; a single approver | Cited | Medium · engineers | — | PETE-14 | — | **F** · five browser journeys (at Z if cheap); a second production admin under **B** | A broken button fails CI |
| PETE-26 | AI drafting is well governed but badly timed; Z's J3 waits on C3w-2; the paste route is undecided | **V-Bob** (J3 needs C3w-2) | Low–Medium | The Z contract; the paste route decided after the walkthrough | Bob's rec 5; the owner's adviser: prepare only | Changes the Z acceptance contract | **C** · prepare the fallback; the owner activates it on a date trigger (§E, D-7) | J3 passes on the stand-in |
| PETE-27 | "The current result" means different things to a learner and a teacher | Cited | Low–Medium | — | F04 | Prints, certificates, recap | **A** · Z: write the rule; test the two readers | One sitting, two readers, same figure or a visible marker |

### A.2 · Review X (10)

Review X read the planning records and a 22 Sep checkout. Their code-level claims are weaker evidence than Pete's.

| ID | Claim | Evidence | Sev · users | Existing ruling | Overlap or conflict | And then what | Category · disposition · timing | Acceptance proof |
|---|---|---|---|---|---|---|---|---|
| F01 | A result needs a next action and a return point | Inferred | High · teachers | 5.0 direction | PETE-04, PETE-19 | Duplicated documentation if done badly | **C** (one case in the walkthrough) → **D** | Evidence → action → next check, observed |
| F02 | Prove an operating envelope before live use | Cited (October load evidence) | High · all | Production gates | PETE-14, PETE-21 | Sizing must match the release intent | **B** + **F** | Measured envelope with stop criteria |
| F03 | Mark statistical uncertainty; reproduce RD-4 | Cited | High · authors, assessors | D-12, RD-4 | PETE-07, PETE-08, PETE-09 | — | **A** (reproduce) → **E** | Each concern reproduced or refuted |
| F04 | Govern frozen history and live correction together; R-2 | Cited | High · schools, learners | R-2 open; D-06 | PETE-27, PETE-23 | Past reports in 4.2 | **A** (semantics at Z) + **E** (history, 4.5) | Correction after export and certificate issue |
| F05 | Prove authority when a cross-school action takes effect | Inferred | High · staff, transfers | D-03; Sharon's suspension clarification | PETE-22, J08, J12 | — | **A** (verify grant expiry vs platform suspension) → 4.2 | Allowed and denied paths through normal entry points |
| F06 | Make interruptions legible and recoverable | Cited | High · learners | A2a, A2b, A3 | J10, J11 | — | **C** (observe at Z); A3 already covers the mechanics | A learner can say what was saved |
| F07 | Protect developmental privacy against indirect exposure | Inferred | High in 4.5 | R-1, R-2; the Compact | PETE-18 | Exports and aggregates | **E** | Small-cell tests across combined filters |
| F08 | Measure author burden and true AI unit cost | Inferred | High value | C3w; E | PETE-03, PETE-26 | — | **C** (one chapter through import at the walkthrough) | Time to an educator-accepted draft, and through review |
| F09 | Make routine work repeatable without copying authority | Inferred | High value | — | PETE-11, PETE-12 | Re-check authority on commit | **D** · 4.2 | Less re-entry; no accidental distribution |
| F10 | Test operational independence (production path, restore, independent reading) | Cited | High · owner | Release rules | PETE-21, PETE-25 | — | **B** | A clean recovery rehearsal on a harmless path |

**Review X's journeys J01 to J16** become walkthrough and observation tasks (§C), not separate findings. **J08** (transfer),
**J10** (lab failure) and **J12** (departure) add verification cases under A, and they are listed in the execution
sequence.

---

## B · Adopt / reject / defer matrix

**Adopt for investigation now** (agreeing with the owner's adviser's seven, with two changes):

| Item | Findings | Change from the owner's adviser's proposal |
|---|---|---|
| Multi-answer containment | PETE-07 | **Containment must be wider than switching off authoring** (§F, Q3) |
| Certificate meaning | PETE-06 | Agree, including the accessibility distinction |
| Production Readiness assessment | PETE-02, PETE-21, F02, F10 | Agree: verify existing controls first, then the smallest fix |
| Observed walkthrough | PETE-01, F01, F06, F08 | Agree |
| Question Health correctness | PETE-09, F03 | Agree |
| Result and correction semantics | PETE-27, F04 | Agree |
| Device and network measurement | PETE-14, F02 | Agree |
| **Added:** school-year rollover and transfer behaviour | PETE-22, F05, J08 | The empty consent object is verified, and rollover is unknown. Both are investigation, not build |
| **Added:** the reading-gate mismatch (typed address) | PETE-10 | If the screen and the server disagree, it is a correctness defect, not a 4.2 nicety |

**4.2 candidates** (the owner's adviser's list): agreed, with two design constraints.
1. **The small loop** ships as pre-filled actions from a weak section. It does **not** show side-by-side figures (§F, Q1).
2. **Learning retries** are a **non-certifying** retry (§F, Q2).

**Preserve for later:** agreed, all six. Bob **withdraws** his own earlier rec 8 (to split evaluation out of 4.5) in
favour of keeping RD-5 behind a separate approval gate (§F, Q6).

**Reject:** agreed, all seven.
- Bob adds an eighth: **showing a before-and-after pair of figures from different instruments as a teaching result in
  4.2.** The comparison belongs to 4.5's comparability rules.

---

## C · Prioritised execution sequence

The critical path stays: A3 → C3w-1 → (C3w-2) → Z → walkthrough → acceptance. **Nothing below enters `claude/a3` or the
Z candidate without an owner ruling.**

| Step | When | What | Who | Effort (estimated after scoping) |
|---|---|---|---|---|
| 1 | Now, beside A3 | **Code verification, run locally, read-only:** PETE-07 at runtime; PETE-06 repetition count; PETE-27's readers; PETE-08's counts; PETE-10's typed address; PETE-21's leader fan-out; RD-4's three concerns (PETE-09, F03); PETE-22 rollover and transfer; F05's grant expiry vs suspension | **Sharon** (database reproductions), **not Second Eye**, to protect A3 | ≈4–5 Sharon-days, spread over about 1.5 weeks |
| 2 | Now | **Multi-answer inventory:** count multi-answer items in the repository's content, the pilot fixtures and C3w's output schema. Staging needs a read-only count, **which needs the owner's authorisation** (state-changing operations are not involved) | Bob (repository); Sharon (staging, if authorised) | 0.5 day |
| 3 | Now | **Production Readiness assessment:** inventory the existing controls (watches, backup, restore, tier, error capture, support, second admin, legal status); list confirmed gaps, owners and minimum actions | Bob; Sharon reviews | ≈2 days |
| 4 | Before Z | **Observation plan** for the walkthrough (fresh-school setup, one fractions loop done by hand, a shared-device interruption, one import chapter, the four questions). **Small-loop concept** on existing screens | Daisy | ≈2 days |
| 5 | At Z triage | Confirmed category-A items classed under the severity rules: release-blocking → fixed in the Z window (Second Eye, after A3); otherwise 4.2 | Bob classes; owner rules on anything that changes a ruling | Depends on step 1 |
| 6 | Before any real certificate | Certificate policy ruling and its `mode_policy` change | Owner; Sharon reviews; Second Eye builds | ≈1 day of build once ruled |
| 7 | After acceptance | Ruling 54's rationalisation, with the Indonesian baseline (step 1's measurement plan); function snapshot; browser journeys | Team, plan approved by the owner | Per the milestone plan |
| 8 | After the readiness gates | An adult professional-learning pilot; a classroom pilot only after legal and R-2, with production authorised separately | Owner; Daisy observes | 3–4 weeks elapsed |
| 9 | In parallel with 8 | **4.2 design and dependency analysis may proceed** (the owner's adviser is right: the pilot is not a veto). **Final scope of the teacher-workflow items waits on pilot evidence;** defects and owner commitments don't | Bob; Daisy | — |
| 10 | Later | 4.5: measurement contract first. 5.0: by-product interventions | — | — |

**Total verification and preparation before Z:** about 9–10 person-days (Sharon ≈5, Bob ≈3, Daisy ≈2). That is not
one day; Bob's earlier estimate was too low. **Second Eye's share is zero until A3 is frozen.**

---

## D · Dependencies and responsibilities

| Dependency | Blocks |
|---|---|
| A3 frozen | Any Second Eye work on review items; the Z fixes |
| The owner's certificate ruling | The `mode_policy` change; certificate wording; the pilot issuing certificates |
| The multi-answer inventory | Choosing contain-only vs fix-readers |
| Legal advice and R-2 | The classroom pilot; production data; 4.5 real evidence |
| A named readiness owner | Production Readiness exit |
| E's results | C3w-2; the activation of the Z fallback (D-7) |
| The observed walkthrough | 4.2's teacher-workflow scope |

| Person | Owns |
|---|---|
| Bob | The register, this pack, the readiness assessment, the Z classification |
| Sharon | Step 1's reproductions; reviews of the certificate policy, the multi-answer containment, permissions, privacy and readiness |
| Daisy | The observation plan; the small-loop concept; wording items (PETE-08, PETE-15) |
| Second Eye | A3 and Z, unchanged; review-driven fixes only after A3 and only when ruled |
| Pete | **Paused.** Handbook and training translation only when the owner asks (the owner's adviser assigns him work; that needs your instruction) |
| Dr Gladys | Educational meaning of mastery, certificates and the loop, at formal human review |
| Owner | §E's decisions |

---

## E · Owner decision pack

**1. Findings requiring action before real school use:** PETE-07 (contained or fixed); PETE-06 (certificate meaning
decided); PETE-10's server and screen agreement (if a mismatch is confirmed); PETE-22's consent object (OD-9) and
rollover behaviour; PETE-02 and PETE-21 (readiness); F05 (authority at the moment of effect, if a gap is confirmed);
PETE-27 (one meaning of the current result).

**2. Suitable for the existing Z triage:**
- PETE-07's containment;
- PETE-27's rule;
- PETE-08's question counts;
- PETE-15 where one string;
- PETE-13's list;
- the empty states;
- PETE-10's mismatch.

**3. Production Readiness prerequisites:**
- legal and consent advice;
- R-2;
- a school data agreement and an in-product privacy notice;
- named support;
- a second production admin;
- error capture;
- watches proven to fire;
- a capacity tier proven by the load test;
- a timed restore including files;
- the leader page bounded.

**4. Proposed 4.2 changes:**
- add the owner's adviser's candidate list, with §B's two constraints;
- the Question Health scheduled refresh replaced by a recorded-counts table until D-12 is resolved;
- hold positions, acting appointments and future-dated starts pending evidence, **as a proposal only**: the owner's
  deferral list stands until revised.

**5. Proposed 4.5 and 5.0 changes:**
- 4.5: the measurement contract first; RD-5 behind its own approval gate; pooling as research.
- 5.0: interventions as a by-product of action.

**6. Reject or defer:** §B.

**7. Decisions that would overturn or amend earlier rulings:**

| Ruling or commitment | Proposed change | Bob's view |
|---|---|---|
| **The 4.0 mode policy** (`POST_TEST` allows assistance) | Block hints and worked examples in certifying sittings | Recommend (D-2) |
| **RD-4 / the 4.1 closure to Question Health work** | Contain or fix multi-answer at Z | Recommend (D-1) |
| **O41-16** (the second approver) | **Not needed** under Bob's design (D-3) | Leave unchanged |
| **The Z acceptance contract** (J3 on C3w-2) | A dated fallback to the stand-in | Prepare now; activate on the trigger (D-7) |
| **The owner's 4.2 deferral list** | Re-rank with evidence | Propose at 4.2 scoping, not now |
| **"Semesters later than 4.2"** | Consult schools | Decide at 4.2 scoping |
| **The paste route after the walkthrough** | Decide now (PETE-26) | **Keep as ruled:** the walkthrough is days away and the import route works |
| **RD-5** | Move evaluation out of 4.5 | **Do not change;** add a gate (D-6) |

**8. Dependencies, risks, effort, roles:** §C and §D. **The main risk** is that step 1 finds a release-blocking defect
late. Running it now, on Sharon's time, is the mitigation.

**9 and 10:** each decision below states the consequences either way; the sequence is §C.

### The decisions

**D-1 · Multi-answer questions before real school use**
- (a) Contain only: block authoring, import, publishing validation and C3w output; inventory the existing items.
- (b) Contain, and fix the readers at Z.
- (c) Leave to 4.5.
- **Bob: (a) now, and (b) if the inventory finds any multi-answer item in content a pilot would use.**
- Accepting: one small, reversible guard. Rejecting: a known learner-facing defect ships to the first school.

**D-2 · What a certificate asserts**
- (a) Mastery under test conditions: no hint or worked example; glossary and read-aloud kept; attempt number recorded;
  repetition disclosed.
- (b) Completion to a target, conditions stated.
- (c) As now.
- **Bob: (a).**
- Accepting: certificates mean what they say; chapters may need more questions for a second form. Rejecting with (c):
  the one artefact that leaves the school is the least defensible.

**D-3 · Learning retries**
- (a) A teacher may grant, in bulk, a **non-certifying** retry: a practice or Uji Cepat sitting on the weak sections that
  never counts as a certifying attempt.
- (b) The teacher alone grants further certifying attempts (overturns O41-16).
- (c) As now.
- **Bob: (a).** It gives mastery learning its retry without touching O41-16. The second-approver rule then governs only
  certifying attempts, which is what it exists for.

**D-4 · Production Readiness**
- (a) A named workstream with one owner and exit criteria.
- (b) Separate gates as now.
- **Bob: (a),** with "verify the existing controls first" (the owner's adviser) as its first step.
- Owner to name who owns it.

**D-5 · The walkthrough as an observation**
- (a) Observed tasks, including a fresh-school setup.
- (b) A guided demonstration as before.
- **Bob: (a).** Its date stays O41-7.

**D-6 · Formal educator evaluation**
- (a) Keep RD-5 in 4.5 behind its own approval gate, with a written evidence policy that marks teacher-controlled
  sittings.
- (b) Move it out of 4.5.
- (c) As planned.
- **Bob: (a).**
- **Separately, now: the anonymous feedback round.** (i) Hide it until its protections exist; (ii) keep it and list it;
  (iii) remove it. **Bob: (i), pending Sharon's read of what it collects.**

**D-7 · Z and C3w-2**
- (a) Prepare the fallback now; it activates if E's final scores are not in by a date the owner sets.
- (b) Always hold Z for C3w-2.
- (c) Decouple now.
- **Bob: (a).**

**D-8 · Read-only staging count for the multi-answer inventory** (step 2)
- Authorise, or not.
- **Bob: authorise:** one read-only, transaction-read-only query, as for C2w.

**D-9 · Pilot form**
- (a) Adults first (professional learning), then a classroom pilot after the legal gate.
- (b) A classroom pilot only.
- (c) None before 4.2.
- **Bob: (a),** and the pilot does not veto 4.2 design work (the owner's adviser).

---

## F · Disagreements, and the challenge questions

**Q1 · Is the small loop a 4.2 capability or 5.0?** **Split it.**
- **The action half is 4.2:** from a weak section, a pre-filled re-read and a pre-filled Uji Cepat, using existing
  features. No new evidence type, no claim.
- **The judgment half stays 5.0:** two results shown as a before and after. Pete's side-by-side pair compares different
  instruments and possibly different learners. Even with a caveat line, leaders will read it as an effect.
- 4.2 links to the Uji Cepat result where it already lives.
- **Here Bob disagrees with Pete** and goes further than the owner's adviser.

**Q2 · Would teacher-only retries compromise certificate governance?**
- **Only if the retry can certify.** Pete's design lets a learning retry become another attempt, with the certificate
  gated separately. That is a fragile boundary across A3's lineage counts, attempt limits and certificate eligibility.
- **Bob's design keeps the retry in a non-certifying mode,** so there is no boundary to police and O41-16 is untouched.
- What else changes: attempt counts (unchanged), the result in force (unchanged; a practice result is not a certifying
  result), and the teacher's page (a new action).

**Q3 · Does disabling multi-answer authoring contain the defect?** **No, not by itself.** Multi-answer items can also
arrive through:
- the workbook import;
- copies of existing courses (`salin_kursus_revisi` carries items forward);
- new versions of a published course;
- C3w's draft output;
- items already authored on staging or in pilot content.

**Containment means:**
- the publish validator refuses the type;
- C3w's output schema excludes it;
- import refuses it;
- an inventory proves none is live.

Production has zero items, so there is no live exposure. Fixing the four readers is a bounded change: join over the
array.

**Q4 · Are we underestimating a new school's first day?** **Yes.**
- Beyond content, the first day needs:
  - activation without reliable staff email;
  - the time zone (set by the platform admin only);
  - pass marks before any assignment;
  - year dates;
  - a person to call.
- None of these is a feature gap the reviews fully list.
- **The library question is the largest:** a small curated pilot library is the cheapest test (the owner's adviser is right not to
  make PINTAR a publisher).

**Q5 · Would a classroom pilot delay 4.2?**
- Only if it is made a veto. 4.2's defects, owner commitments and design work proceed.
- Only the teacher-workflow items' final scope waits.
- The legal gate, not the pilot, is the long pole.

**Q6 · Are we overreacting to evaluation risk?**
- **Partly, and Bob included.** The incentive risk is real but two releases away, and A1 already records
  teacher-controlled acts, so evidence can be marked.
- The cheap action now is the feedback round's visibility. Moving RD-5 is not justified yet.
- **Bob withdraws his earlier recommendation;** the owner's adviser's gate is the better answer.

**Q7 · Can Question Health be useful without compromising validity?** **Yes, if it starts as recorded counts:**
- for each question in the teacher's class: how many answered, and how many chose each option, final answers only, with
  n shown;
- no flags, no thresholds, no "health";
- difficulty with n shown can follow once counts are proven;
- discrimination and reliability wait for 4.5's measurement contract.

The first step is the existing bug: count final answers, not changed ones.

**Q8 · Too many administrative controls before observing ordinary operations?**
- **For what is not yet built, yes:** positions, acting appointments, future-dated starts.
- **For what is built (A1, A2a, A2b, B0), no:** they are finished, protect rare but serious events, and cost nothing
  further.
- The lesson applies forward.
- **Here Bob disagrees with Pete's "over-built"** as a judgment on accepted work.

**Q9 · What should stay untouched despite the criticism?**
- append-only evidence and the result chain;
- the governed two-person key correction;
- the two-person rule for certifying attempts (O41-16);
- the minimum sample rules;
- no rankings;
- AI drafts, educators decide;
- A3's single writer;
- A2a and A2b;
- the import route and the teachers' own-AI guide;
- the review lifecycle for library content;
- ruling 54.

**Q10 · What else does each change affect?** Recorded per finding in the register's "and then what" column. The
widest reach:
- **multi-answer:** import, publishing, copies, C3w, statistics;
- **certificates:** wording, verification page, accommodations, item-bank size;
- **retries:** attempts, lineage, results in force;
- **the digest:** email consent, the readiness workstream's mail health.

**Disagreements in brief:**

| With | Point | Bob's position |
|---|---|---|
| **Pete** | Remove all assistance from the certifying test | Hints and worked examples only |
| **Pete** | The side-by-side pair in 4.2 | No; 5.0 |
| **Pete** | Evaluation out of 4.5 | Keep, with a gate |
| **Pete** | The replacement 4.2 list | No blanket replacement |
| **Pete** | Decide the paste route now | Keep the ruling |
| **Pete** | 4.1 "over-built" | Not for accepted work |
| **Review X** | Code-level claims | Rest on a 22 Sep checkout; treated as leads unless Pete or Bob confirmed them |
| **Review X** | "A bounded first rollout" | Comes after an observed walkthrough and an adult pilot, not instead of them |
| **the owner's adviser** | Switching off authoring contains multi-answer | It does not; Q3 |
| **the owner's adviser** | The learning-retry boundary needs O41-16 changed | It needn't; Q2 |
| **the owner's adviser** | Pete is assigned handbook work | He is paused; that needs your instruction |
| **the owner's adviser** | "Claude / primary engineering" | That role is Second Eye |
| **the owner's adviser** | Z and C3w-2: prepare only | Agree, but name the trigger date so the decision isn't made under pressure |
| **Bob's own earlier pack** | The one-day estimate | Wrong; ≈9–10 person-days |
| **Bob's own earlier pack** | Rec 8 (move evaluation) | Withdrawn |

---

## G · Final recommendation

**What should happen next:**
1. Approve the owner's adviser's bounded triage direction (its §6 text), with three amendments:
   - containment of multi-answer as defined in Q3;
   - learning retries designed as non-certifying;
   - a dated trigger for the Z / C3w-2 fallback.
2. Authorise the read-only staging inventory (D-8).
3. Name the Production Readiness owner (D-4).
4. Let Sharon start step 1's local reproductions now, and Daisy the observation plan, both around A3.
5. Rule on the certificate's meaning (D-2) before any real certificate is issued. It need not hold Z.

**What should not happen yet:**
- no change to A3, C3w or Z;
- no review-driven code on `claude/a3`;
- no 4.2 feature;
- no production change;
- no move of RD-5;
- no revision of the roadmap documents;
- no change to O41-16.

**The one change of emphasis Bob agrees with completely:** from the walkthrough on, acceptance asks two questions.
Does it work correctly? And can an ordinary educator do something worthwhile with it, without us?
