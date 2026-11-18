# PINTAR 4.1 · The plan for A3, C3w and Z

Bob, Chief Architect, 16 November 2026. In the form of `PLAN-A2B-C2W.md`. It **adds no scope**: THE PLAN §5.5, §5.6,
§5.8, §6 and §8, Addendum 1, and rulings 1–41 govern. This page gathers them per batch, records what has changed
since THE PLAN was written, and names the evidence before the build.

## The decisions

| # | Decision | For whom | When |
|---|---|---|---|
| **1** | **APPROVED by the owner, 16 Nov (ruling 42).** **C3w is built in two steps.** C3w-1, everything with the provider replaced by the local stub, starts after A3 without waiting for E. C3w-2 (the qualified providers' adapters, the limits, the supervised staging run) waits for E, your qualification and your limits. THE PLAN §5.6 G1 lists the provider selection in the entry gate for the whole batch | **Owner** | Before C3w starts. **Recommended:** it takes E off the critical path for most of C3w. No provider call, cost or credential comes earlier |
| 2 | A recovery during a work-scoped planned window | **Owner, 16 Nov (ruling 42): proceed with the proposed rule if Sharon agrees.** The recovery preserves the original deadline, accepted answers and attempt count; emergency and platform-wide restrictions unchanged | Settled at A3's pre-build review |
| 3 | R-3's matching rule (what counts as a learner's name in teaching text) | Sharon and Daisy at C3w's pre-build review (**owner confirmed, 16 Nov**) | Comes to the owner only if no rule both protects learners and keeps ordinary text usable (Addendum 1, R-3) |

Everything else below is already decided.

## 1 · Where they sit

```
A2b (building) ─► C2w ─► A3 ─► C3w-1 ─────────► C3w-2 ─► Z ─► staging (owner) ─► walkthrough (owner)
   ─► owner's 4.1 acceptance ─► Post-4.1 Rationalisation & Performance milestone (ruling 54; DEFERRED until then) ─► 4.2
                                   E (owner's decisions, then the paid run) ──┘
```

- **The owner's directive of 16 Nov applies throughout.** At an authorisation boundary, stop, preserve, mark it
  PENDING OWNER AUTHORISATION, and move to the next batch on its own branch.
- **Freeze sequence, every batch** (`PLAN-A2B-C2W.md` §4): focused checks while building; one full pre-flight on the
  exact candidate; freeze; then acceptance (result reviews, PR and CI, journeys, merge, staging with the
  preservation pair). The **before** read precedes the merge.

## 2 · A3: recovery, one writer per sitting

### 2.1 Purpose

A learner whose device fails continues on another, and no sitting is ever written by two devices. Today two signed-in
devices can both write one sitting, the residual accepted in 4.0. Exam Mode is out (O41-9).

### 2.2 Already decided

| Rule | Source |
|---|---|
| The controller is the **verified Auth session** (`sesi_saya()`) plus a **generation** that only grows. No function takes a device id; the cookie hash is never identity | THE PLAN §5.5 D1–D3; Sharon's gaps 1 and 2 |
| One rule at every learner boundary: **emergency fence (shared) first, then the sitting's row lock**, then the controller check, then A1's gate | D4; §6.2's lock order |
| Service and staff writers are not checked against the controller but take the same lock. **A test enumerates every writer** of `assessment_sessions` and `responses` | D5 |
| Low-stakes (PRE_TEST, QUICK, PRACTICE): self-recovery after signing in again. Uji Penguasaan: the teacher authorises, single-use, **10 minutes**, no device named | D7; **D-3** |
| Signing out and in on the same device is a new session, so it needs a recovery: silent for low-stakes, teacher-authorised for Uji Penguasaan | D11; **D-2** |
| The final answer is the final response with the highest (generation, `client_seq`). No accepted answer is discarded | D8 |
| A recovery adds no time, uses no attempt, changes no answer | §5.5 E |
| The words: Daisy's `DESAIN-AWAL-4.1.md` §4, with her neutral forms (O-4); the Exam Mode sentence dropped | §5.5 F |

### 2.3 What changed since THE PLAN was written

| Change | Effect on A3 |
|---|---|
| **A2a** built the emergency fence and the held sitting with its time (D-1) | D4's order is A2a's fence. A held sitting refuses recovery with `SITTING_FROZEN`; after the lift, recovery is normal (D10) |
| **R-1 (A2b)**: planned maintenance is work-scoped, `MAINTENANCE_PLACE` (PR040), not PT503, and a running sitting drains through its deadline and grace | D10 says a recovery "cannot be made during a window", written when maintenance was person-level. **Proposed (decision 2):** a recovery of a draining sitting is **allowed** during a work-scoped planned window, because it adds no time and changes no answer, and refusing it would strand a learner whose device died mid-drain. Starting a new sitting stays refused. Platform-wide windows and emergencies keep D10 as written |
| **R-C**: no assessment has a duration; deadlines come from the assignment | D10's "deadline during a recovery" reads the sitting's authoritative deadline as today |
| **A2b's per-window draining rule** (commit 12) | Any recovery check that reads draining uses the per-window reading, never the person-wide one |
| **A1's acts** («Akhiri», «Tidak dihitung») | Unchanged; the way out of an unreconcilable sitting |

### 2.4 Entry conditions, on A3's page before the build

| Condition | State |
|---|---|
| A1, A2 (A2a and A2b) and B1 closed | A1 and B1 closed; A2a closed; A2b building |
| **N-4:** Sharon's ten further red cases from her review at `1f7b6fc2` | Not on the branches read. **Sharon supplies them before A3's page** |
| **N-5:** Sharon's verdict on the SI-D02 stronger-race re-review | Not recorded. Sharon records it, or it becomes a red case |
| The lock-order point: `start_learning_session` takes its advisory lock before the assignment `FOR SHARE` | Settled with Sharon at the pre-build review (§6.2) |
| Pre-build reviews: Sharon (the five gaps, N-4, the lock order, the enumeration test) and Daisy (journeys and words), both full | Before the build |

### 2.5 Acceptance evidence, named before the build

| # | Evidence |
|---|---|
| A3-1 | The ten cases of `C1-D125-INVESTIGATION.md` §5 and Sharon's ten (N-4), written as failing tests first, then green |
| A3-2 | **Concurrency on real connections**: two devices answering at once; finish on A with B's answers in flight; answer while paused from the other device; old A after a recovery; two recoveries at once; a recovery racing a teacher's ending, the scheduled closer, an emergency hold and the lift |
| A3-3 | Every learner boundary refuses a non-controller; the **enumeration test** finds no unguarded writer; the **lock-order lint** passes |
| A3-4 | A recovery leaves every earlier response byte-identical; the final answer follows (generation, sequence) |
| A3-5 | Uji Penguasaan: refused without, with an expired and with a used authorisation; succeeds once with a valid one |
| A3-6 | A sitting open at migration time is claimed by its first write (one-time, tested) |
| A3-7 | Decision 2's cases: recovery of a draining sitting in a work-scoped window allowed; in a platform window or an emergency refused |
| A3-8 | The cross-batch checkpoints (§6.6): recovery during an extension; after an emergency lift; of a sitting whose assignment a C1w correction moved |
| A3-9 | Answer latency measured before and after the row lock (§5.5 J's escalation trigger) |
| A3-10 | Daisy's screens at 1280, 390 and 320 px with keyboard: the three learner screens and the teacher's act |
| A3-11 | Journeys: a tablet dies in Pemetaan Awal and the learner continues; a laptop dies in Uji Penguasaan, the teacher allows it, the learner finishes; the old device returns and cannot write |

### 2.6 How it is run

**This batch rewrites nearly every sitting boundary.** The pre-flight analysis comes first (THE PLAN §5.5 G):
- every function in §5.5's table C is **redefined in full** in A3's own migration, never patched by text a third time;
- the planted defects are re-aimed (`r1-1` to `r1-3`, the inline red-case plants, the eight sitting plant files,
  A2a's and A2b's plants) and **each is run against the new bodies before the suite**;
- the source-reading tests are re-pointed;
- the concurrency tests commit by design and leave nothing behind (P3).

### 2.7 Size

The largest remaining batch. About **three to four working days** after its page is reviewed. Most of the risk is
in the pre-flight analysis, not in the code.

## 3 · C3w: AI-assisted question drafting

### 3.1 Purpose

An educator turns source material into draft questions faster, and stays the author of record for everything that
reaches a learner. **AI drafts. Educators decide.**

### 3.2 Already decided

| Rule | Source |
|---|---|
| A generated question is an ordinary draft, written through C1w's path. The requester is its author, so the two-person rule refuses them as reviewer | §5.6 D2 |
| Each generated draft is **accepted, edited or deleted** by an educator before the package can be submitted; enforced in the database | D2 |
| Provenance in one side table, immutable, never a column on `items`, unreadable by learners at the API and database | D3, D4 |
| A failed generation creates nothing | D6 |
| The source-rights confirmation, recorded with each request | D10; D-5 |
| **R-3:** no learner personal information reaches a provider. One server-side request builder from an allowlist; the excerpt is checked against the school's learner names and PINTAR IDs and obvious identifiers; **a match blocks the send** | Addendum 1, R-3; Sharon's five requirements |
| **Paid add-on per school (ruling 38).** An explicit school entitlement (status, allowance, optional validity, neutral period) and a platform-wide ceiling (S-1, S-2, **ruling 39**) | `C3W-PAID-ADDON-ASSESSMENT.md` |
| **Reserve before every call** (S-3); **every attempt accounted**, settled, released or unreconciled, never consumed by bookkeeping alone (S-4); a reconcilable ledger (S-5); the entitlement checked **only** at the request (S-6); period-neutral words with a next step (S-7) | Ruling 39 |
| **Schools choose among qualified providers (ruling 40):** a registry of AI options (S-8), the school's chosen option on its entitlement, a ceiling per provider, the option on the ledger. Provider names in staff copy only, never learner copy | §9 of the assessment |
| **A provider-side hard spend stop is a mandatory qualification check** | Sharon, 16 Nov |
| **External AI (ruling 41):** provenance can also hold a self-declared external origin, distinct from verified provenance (X-4's boundary); **no C3w change may make the workbook or structured import harder** | `EXTERNAL-AI-CONTENT-ASSESSMENT.md` |
| Not in 4.1: billing, payment, packages, prices, school-admin purchasing or usage screens, a school-facing comparison | Rulings 38–41 |

### 3.3 Two steps (decision 1)

| Step | Contents | Entry |
|---|---|---|
| **C3w-1** | The database (requests and ledger with reservations, provenance, the entitlement and both ceilings, the options registry, the Studio reader, the acceptance step, R-3's check), the contract, the server with the **provider replaced by the local stub**, the screens, all tests, the rendered check | A3 closed; C1w and B1 verified; Studio journeys green; Daisy's Studio consistency findings applied; Sharon's and Daisy's pre-build reviews of the whole design |
| **C3w-2** | One adapter per provider you qualify; their prices in the registry; the limits you set; network egress and the key; **one supervised generation on staging against the real provider**, recorded; the educator's key check of those drafts | E's results; your qualification (ruling 40); your numerical limits (D-6); E's finding on licensing and data terms (D-5); egress and key, entered by you |

**C3w-1 is not acceptance of C3w as a whole** (owner, 16 Nov). No external call, spending or bypass of a provider gate in C3w-1.

**Why:** C3w-1 is most of the batch and needs no provider. If C3w waits for E as a whole, Z waits for E's
evaluation and judging. Built to the stub, it ships "not available at this school" until C3w-2, as D7 already
requires, so nothing reaches a learner or calls a provider early. If you prefer THE PLAN's single gate, C3w starts
when E's results are in, and C2w and A3 continue meanwhile.

### 3.4 Entry conditions (C3w-1), on C3w's page before the build

- The pre-build design answers R-3's questions, including **decision 3**, the matching rule.
- The S-1 to S-8 boundaries written as tables, codes and tests, with Sharon's points: the reservation under the
  school's row lock; the three attempt outcomes; reconciliation; the mandatory hard stop as a registry field.
- Daisy's words for every state (§5.6 F), the period-neutral limit sentence, and the teacher's next step when the
  entitlement is inactive or used up.

### 3.5 Acceptance evidence, named before the build

| # | Evidence |
|---|---|
| C3-1 | No draft reaches a learner without an educator's acceptance and a second educator's approval, **proven at the database** |
| C3-2 | Provenance kept for every generated question; unreadable by learner roles at the API and database (closed-projection assertion, forbidden-key list) |
| C3-3 | A failed or invalid generation creates nothing; a double submit calls the stub once |
| C3-4 | **Spend cannot exceed the ceilings:** two simultaneous requests at an allowance's edge cannot both reach the provider; a retry cannot escape accounting; a crash leaves a held, unreconciled reservation, never a consumed one |
| C3-5 | School A cannot consume school B's allowance; two schools on two options route to their own option and ledger |
| C3-6 | An ended or exhausted entitlement leaves drafts, questions, assessments, results, reports, certificates and provenance usable |
| C3-7 | **R-3:** an excerpt containing a learner's name or PINTAR ID is refused before any call; a plant that removes the check turns the test red; the request builder's output holds only allowlisted fields |
| C3-8 | Only the provider module makes outbound calls; no vendor name in a schema name; no learner surface carries the mark |
| C3-9 | The workbook and structured import are unchanged in their tests (ruling 41's guardrail) |
| C3-10 | The cross-batch checkpoint (§6.6): a generated, published question goes through sitting, report, key correction and annotation like any other |
| C3-11 | Daisy's screens, all states, at 1280, 390 and 320 px, keyboard |
| C3-12 *(C3w-2)* | The supervised staging run, recorded; an educator checks every key; any wrong key the content check and review would not have caught blocks acceptance |

### 3.6 Size

C3w-1: about **three working days** after its page is reviewed. C3w-2: about **one day** once E and your decisions
are in, plus the staging run.

## 4 · Z: one candidate

### 4.1 Purpose

One commit on which the whole approved 4.1 experience works together, verified once. **A list of individually
passing batches is not acceptance** (THE PLAN §8).

### 4.2 Entry conditions

- Every batch closed: A2b, C2w, A3, C3w (both steps).
- **The register triaged:** blockers none; the rest stated. Items already carried to Z:
  - a departed learner's direct URL (Second Eye);
  - the simultaneous refusal-record race (Second Eye);
  - the «siapa» overflow (Daisy);
  - the person-level branch reading `now()` (Second Eye);
  - Daisy's X-2 (six `/belajar/[tugas]/` sub-pages not checking ownership) and X-3;
  - A2B-R1 (emergency reason codes): stated as deferred, not a blocker.
- X-1 (the external-AI prompts and instructions) ready, so the walkthrough can try that route.

### 4.3 Steps

1. **Freeze scope.**
2. **Extend the integrated journeys** to THE PLAN §8.5 **as amended by Addendum 1**:

   | # | Journey |
   |---|---|
   | J1 | A school year in a day: a recorded sign-in, an assignment, Pemetaan Awal, a device dies and the learner continues |
   | J2 | An interrupted Uji Penguasaan: an extension, an emergency stop and lift, a device failure with the teacher's authorisation, a finish, a certificate |
   | J3 | A question's life: drafted with AI, edited, reviewed by a second educator, published, sat, a wrong key found, corrected and confirmed, results superseded, the certificate reviewed, an annotation added. **Extended:** a sitting on the corrected revision, and the rewriting of withdrawn explanations |
   | J4 | Accountability: a failed sign-in, a sign-in, a printed report whose reference an admin looks up |
   | J5 | Maintenance: a class-scoped window announced, warned at 60, 30 and 15 in the school's zone, started, extended, ended early |
   | J6 | An account's life: suspend, neutral sign-in, reinstate, close, delete, never re-attach |

   The ten roadmap journeys are a coverage note on these, not new tests.
3. **The pre-flight in full, with P1 across all batches' changed functions together,** since Z is where one batch's
   plants meet another's rewrites. Then one full verification on the candidate: the whole local suite, CI, journeys.
4. **Sharon and Daisy once each on that exact commit** (§8.3, §8.4), including the three 4.0 rendered checks still
   outstanding on staging, if a browser can reach staging.
5. **Staging promotion, on your authorisation** (PENDING OWNER AUTHORISATION until given): the migration count, the
   preservation pair with the before read before the merge, both scheduled jobs, each batch's screens; fresh-built
   schema equal to migrated staging; restore yields both jobs.
6. **You set the walkthrough date** with Dr Gladys and her educators (O41-7). Their recorded session is the only thing
   that moves a capability to "human-accepted". **During it, observe the external-AI route** (download, generate,
   move into the workbook, upload, resolve messages), the evidence for X-2's placement.

### 4.4 Acceptance

THE PLAN §8, every part on one commit: technical (8.1), educational (8.2), Sharon's security and integrity (8.3),
Daisy's UX and accessibility (8.4), the six journeys (8.5), ready for human evaluation (8.6).

**J3 needs C3w-2.** Its "drafted with AI" step on staging needs a qualified provider, your limits, egress and the key.
Without them, Z can still verify J3 locally with the stub, but **J3 on staging stays PENDING**, and Z is not
declared accepted until it runs.

### 4.5 Size

About **two working days** from the last batch's close to the candidate's verification, plus the staging promotion
when you authorise it.

## 5 · Sequence, gates and what waits on the owner

| Point | What waits | On whom |
|---|---|---|
| Before C3w starts | Decision 1 (two steps) | Owner |
| Before E's paid run | Providers, scoring rules and judges now; then terms, limits, network, keys and the go (`E-DECISION-PACK.md` §6) | Owner |
| C3w-2 | E's results, your qualification and limits, egress and the key | Owner |
| Each batch's staging promotion, and Z's | Authorisation | Owner |
| The walkthrough | The date | Owner |

**Forecast, if nothing waits:** A2b's close, then C2w (about one day, plus F-3 and F-4 if missing), A3 (three to
four days), C3w-1 (three days), C3w-2 (one day once E is in), Z (two days). That is roughly **two working weeks**
from A2b's close. **E is the one item that can lengthen it:** if its results come later than C3w-1's end, Z waits
for them.

## 6 · Risks

| Risk | Guard |
|---|---|
| A3's rewrite breaks planted defects silently | The pre-flight analysis first; each plant run against the new bodies before the suite |
| A row lock at every answer costs too much under load | Measured before and after (A3-9); escalated per §5.5 J |
| R-3's rule either blocks ordinary text or lets names through | Designed and tested at C3w's review; to the owner with options if no rule works (decision 3) |
| A concurrency hole in the allowance | C3-4 on real connections, reviewed by Sharon |
| E finishes late | Decision 1 keeps C3w-1 moving; Z's J3 on staging waits for C3w-2 |
| Z finds an interaction no batch saw | Z's pre-flight across all batches; the six journeys on one commit |
