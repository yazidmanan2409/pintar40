# Two independent reviews of PINTAR 4.0–5.0: consolidation and Bob's assessment

Bob, 18 Nov 2026, for the owner. **Nothing here is adopted.** It consolidates two independent reviews, states where
Bob agrees, qualifies or disagrees, and sets out how the recommendations would be carried out if the owner approves them.
No product, plan or schedule changes until the owner rules.

- **Review P:** Pete, "Track B", 27 findings (PETE-01 to PETE-27), 11 owner decisions (OD-P1 to OD-P11). It read the code
  on `main` `7ba18b03` and cites file and line numbers.
- **Review X:** an external reviewer, 10 findings (F01 to F10), 16 journeys, 6 owner decisions. It read the planning
  records and an old checkout (22 Sep), not the current code.

**What Bob checked himself on `main` before relying on a claim:**

| Claim | Result |
|---|---|
| PETE-07: a multi-answer question is mishandled in the learner's review | **Confirmed.** A multi-answer response is stored as an array (`grade_response`, `set_match`), but `session_review` and three readers in `20270117100000` (lines 185, 220, 282) join the option by `value ->> 'pilihan'` as a single label. The learner sees no chosen option and no reason, and the misconception counts miss it. Scoring itself is correct. The authoring contract offers the type (`unggah-kontrak.ts:42`) |
| PETE-06: the certifying test allows assistance | **Confirmed, with a nuance.** `mode_policy` gives `POST_TEST` `allows_assistance = true` and `certifies = true`. But "assistance" covers four kinds (`HINT_OPENED`, `WORKED_EXAMPLE_OPENED`, `GLOSSARY_OPENED`, `READ_ALOUD`). Two of them are accessibility support, not help with the answer |
| PETE-26: Z's third journey needs C3w-2 | **Confirmed** (`Z-READINESS.md` §3) |

The other code claims in Review P are plausible and well cited, but Bob has not re-run them. Step 0 below verifies them
before any of them is acted on.

---

## 1 · Where the two reviews agree

When both reviews reach a conclusion separately, it deserves the most weight.

| # | Shared conclusion | Review P | Review X |
|---|---|---|---|
| A-1 | **No real school or educator has used 4.x.** Every acceptance so far is engineering acceptance. Production is an empty September build | PETE-01 (Critical) | A, F02, F10, closing prediction |
| A-2 | **The loop stops at the insight.** A result does not lead to an action, a re-check or a record of what was tried | PETE-04 (rank 2) | F01 (rank 1) |
| A-3 | **The path to a real school is unplanned.** Legal and consent work, retention (R-2), capacity, monitoring, restore and named support people are each gated separately, and nobody owns the whole | PETE-02, PETE-21 | F02, F10, decision "Production rollout and R-2" |
| A-4 | **Question statistics are not yet trustworthy.** RD-4's findings must be reproduced before anything is scheduled or shown | PETE-09 | F03 |
| A-5 | **History and correction need clear meanings:** what is current, what was issued, what was printed | PETE-27 | F04 |
| A-6 | **Formal evaluation and private growth threaten teachers' trust** unless they are kept apart and governed | PETE-18 | F07 |
| A-7 | **Measure the author's time and the true AI cost,** not only cost per draft | PETE-03, PETE-26 | F08 |
| A-8 | **Keep the core.** Append-only evidence, governed two-person correction, withheld small samples, no rankings, human authority over AI, ruling 54's sequencing | §G, "what should not change" | A strengths, G |
| A-9 | **Learn from an ordinary school week before building more.** Plan 4.2 from observation | PETE-01, PETE-24 | H, closing |

## 2 · Where only one review reaches a conclusion

**Only Review P (from the code):**
- **Live defects:**
  - multi-answer questions (PETE-07);
  - the certifying conditions: assistance, and questions repeating on a retake (PETE-06);
  - a learner who misses the target hits a dead end that needs two adults to reopen (PETE-05).
- **Teacher workflow gaps:**
  - the reading map does not steer the learner (PETE-10);
  - three thresholds and about 35 terms (PETE-15);
  - "Kenaikan" (gain) compares 4 questions with 8 different ones (PETE-08);
  - setup gates such as the per-lesson pass mark (PETE-11);
  - no notifications (PETE-12);
  - no activation status list (PETE-13);
  - lessons don't work offline, and the string table is 747 KB (PETE-14);
  - no term marks recap (PETE-23);
  - semesters (PETE-22).
- **Later roadmap:**
  - 4.5 will starve for evidence unless answers about a library question are pooled (PETE-16);
  - capture a curriculum reference now (PETE-17);
  - split formal evaluation out of 4.5 (PETE-18);
  - in 5.0, an intervention record should be a by-product of what the teacher did (PETE-19).
- **Engineering:**
  - no readable current text of the database functions (PETE-20);
  - the tests look inward, with no browser test in CI and a single approver (PETE-25).
- **The anonymous student-feedback round about a named educator,** which exists in code and is on no roadmap (OD-P10).

**Only Review X:**
- **Specific journeys:**
  - a learner transferring mid-term (J08);
  - a shared lab failing during a timed sitting (J10);
  - departure, suspension and closure across schools (J12).
- **An operating envelope sized to the approved release,** with stop criteria, rather than more synthetic scale (F02).
- **Proof of operational independence:** the real production path, an independent before-and-after reading, a recovery
  rehearsal (F10).
- **The outbound privacy check for AI must be proven with zero provider calls** on a blocked excerpt, including a
  legitimate common name (G).
- **A measurement contract for 4.5:** eligible population, missing data, versions; and "a missing sample is never zero
  mastery" (G).
- **Audit without surveillance:** purpose, readership and expiry for each record type (G).

## 3 · Where the reviews differ, and Bob's view

| Topic | Review P | Review X | Bob |
|---|---|---|---|
| **How hard to push before a pilot** | A classroom pilot before 4.2 is planned (adults first, then children) | A bounded first rollout after the gates; use the walkthrough to observe | **Both, in sequence.** First an observed walkthrough on the Z candidate with a real setup task. Then a pilot with adults (professional learning). Then a classroom pilot once the legal gate opens |
| **What 4.2 should be** | Reshaped around the teacher's term; hold the speculative administration items | Scope by actual need; keep candidates optional | **Agree with P's direction**, but the deferral list is the owner's own ruling. It is a decision, not a default |
| **Certificate conditions** | No assistance at all; varied questions | Not raised | **Narrower than P.** Block hints and worked examples in a certifying sitting; keep the glossary and read-aloud as accessibility support. Record the attempt number. Disclose when questions repeat on a retake |
| **4.1's proportion** | Over-hardened for zero users (A2a at 50,000 sittings) | Treats the continuity work as a strength | **Don't reopen it.** 4.1 is owner-directed and nearly done. The lesson applies to what comes next: no more hardening ahead of use |

---

## 4 · Bob's assessment

**The reviews are right about the main thing.** PINTAR's core is trustworthy, but it is untested by the people it is for,
and what stands between it and a school is mostly not features. Bob's own planning audit said "the gaps are decisions and
evidence, not design errors". Review P is right that this holds for the architecture and **not for the product:** the
open loop (A-2), the retake dead end (PETE-05) and the certifying conditions (PETE-06) are design gaps in releases already
called complete.

**What Bob would not change:**
- **4.1's scope and gates.** Finish A3, C3w and Z as planned. These reviews are evidence for triage under the existing
  severity rules, not a reason to reopen accepted batches.
- **Ruling 54's sequence** for the rationalisation milestone.
- **The evidence core,** and the protections listed in A-8.

**Bob's recommendations, ranked:**

| Rank | Recommendation | Source | Needs the owner? |
|---|---|---|---|
| 1 | **A Production Readiness milestone with one named owner,** run in parallel with A3 and C3w. It covers legal and consent advice, retention (R-2), a school data agreement and an in-product privacy notice, named support people, a second production administrator, error tracking, the three production watches seen to fire, a tier that passes the load test, and one timed restore including stored files | A-3; PETE-02, PETE-21; F02, F10 | **Yes:** create it and name its owner. Most of it is non-engineering |
| 2 | **Contain the multi-answer defect before any school uses 4.1:** switch off multi-answer authoring in the workbook and the workbench. Fix the four readers in 4.5 | PETE-07 (confirmed) | **Yes:** it reopens RD-4's closure of 4.1 by one small, reversible policy change |
| 3 | **Decide what a certificate asserts before any certificate is issued to a real learner.** Recommended: no hints or worked examples in a certifying sitting; accessibility support kept; attempt number recorded; repeated questions disclosed | PETE-06 (confirmed, with nuance) | **Yes** (OD-P3) |
| 4 | **Turn the walkthrough into an observation.** Use the Z candidate. Include a fresh-school setup task, one fractions case from result to a targeted re-read to a short check (the small loop, done by hand), a shared-device interruption, and Daisy's four questions ("Where are my questions?", "Did my answer save?", "Who owns this next step?", "What can I do with this result?") | A-1, A-2; F01, J01, J10; PETE-01 | **Yes:** the walkthrough's form and date (O41-7) |
| 5 | **Decouple Z from C3w-2 if E slips.** Z's third journey runs on the local stand-in; C3w-2 promotes separately once the owner qualifies a provider | PETE-26 | **Yes** |
| 6 | **Plan 4.2 from observation, around a teacher's week:** the small loop (PETE-04), learning retries a teacher can grant alone (PETE-05), a reading map that steers (PETE-10), a per-question class table of final answers (PETE-09), a daily digest (PETE-12), a term marks recap (PETE-23), assignment to several classes and a school default pass mark (PETE-11). Keep export, past reports, single-person add, name correction, the handover view and password change. Hold positions, acting appointments, future-dated starts, two-school roles and Exam Mode until a school needs them | A-2, A-9; PETE-24 | **Yes:** 4.2's scope, and O41-16 for teacher-only retries |
| 7 | **Do not schedule the current Question Health figure.** Reproduce RD-4's findings at runtime first (D-12) | A-4 | Recommendation only; D-12 is already open |
| 8 | **Split 4.5:** measurement, evidence classes, Quiet Intelligence and the protections first; formal evaluation later, opened only when a school asks for it. Rule now on the existing anonymous feedback round (recommended: hide it until 4.5's protections exist) | A-6; PETE-18, OD-P10 | **Yes** |
| 9 | **At 4.5 planning, rule that pooled, de-identified statistics about one library question are not a comparison of schools,** provided no figure is ever shown per school and a minimum number of schools contribute. Write the clause into the school data agreement now | PETE-16 | **Yes**, at 4.5 planning; the clause now |
| 10 | **Measure from Indonesia, on a low-cost phone and a shared school line,** before the rationalisation milestone takes its baseline. Add a generated snapshot of every function's current text, checked in CI, and five browser journeys in CI | PETE-14, PETE-20, PETE-25; F02 | No; it already fits ruling 54 and Z |

**Things Bob would deliberately not do:**
- lower the minimum sample sizes;
- build a generated "what to teach" recommender;
- show any comparison between schools;
- feed student results into an educator's evaluation automatically;
- add a separate "record an intervention" form in 5.0 (Review P is right that the record should be a by-product).

**The small items that need no owner decision** (within approved scope; they go through Z's triage):
- one verdict per figure on teacher screens (PETE-15);
- show the question counts beside the gain figure (PETE-08);
- a written rule for "the current result" on Daisy's vocabulary page, with a test (PETE-27, A-5);
- next steps on empty states, and the four placeholder sentences (Review P §E);
- an activation status list (PETE-13).

---

## 5 · If the owner approves: how it would be done

The order keeps 4.1 intact, puts the non-engineering critical path in parallel, and lets evidence drive 4.2.

### Step 0 · Now, with no product change (Bob, Sharon, Daisy; about one day, in A3's gaps)

1. **Record both reviews** in the repository, under `docs/roadmap/reviews/`, without model identifiers.
2. **Verify the remaining code claims by test,** as read-only failing cases on a local build:
   - Second Eye: PETE-07 at runtime, PETE-06's repeated questions, PETE-27's two readers, PETE-08's question counts, the
     unbounded leader page (PETE-21), PETE-10's typed-address bypass;
   - Sharon: the transfer consent sent as an empty object (PETE-22), and whether the three production watches are on
     (repository variables);
   - Daisy: PETE-15's thresholds, and the empty states.
   Each confirmed claim becomes a row in `Z-READINESS.md` (R-16 onward), classed as **Z, 4.2 or later** under the
   existing severity rules.
3. **One owner decision pack** (`docs/roadmap/OWNER-DECISIONS-REVIEWS-18NOV.md`): recommendations 1–9 above, each with
   its options, consequence and Bob's recommendation, in the existing D-xx form.

### Step 1 · To Z (the current plan, plus only what the owner approves)

- **A3, C3w-1 and Z proceed unchanged.**
- **If approved:**
  - the multi-answer containment (rec. 2) lands with the Z fixes, after A3, test first. Its scope is the workbook
    contract, the workbench and one guard test; reversing it is one line;
  - the certifying policy (rec. 3) lands as a `mode_policy` change with failing cases first, Sharon reviewing;
  - Z decoupled from C3w-2 (rec. 5).
- **Within scope:** the small Z items in §4, and the five browser journeys in CI if they fit Z's time.
- **The walkthrough as an observation** (rec. 4): Daisy writes the observation script and the fresh-school task; Bob
  maps them to the Z journeys.

### Step 2 · In parallel from now: the Production Readiness milestone (rec. 1)

- **Owner:** the person the owner names. Bob keeps the list. The legal advice is external.
- **Engineering items** (Sharon and Second Eye; they don't touch production without separate owner authorisation):
  - error tracking;
  - each watch made to fail once on purpose and seen to alert;
  - the load test on the candidate tier;
  - a timed restore including stored files;
  - a cap or a stored summary for the leader page.
- **The exit criterion** is the 4.0 release checklist reading GO, with R-2 decided.

### Step 3 · After formal 4.1 acceptance

1. **The rationalisation milestone (ruling 54),** with its baseline measured from Indonesia (rec. 10), plus the function
   snapshot. The owner approves its plan first.
2. **A pilot with adults (professional learning) on the accepted candidate:** two or three teachers, one chapter, three
   to four weeks, with observer sheets.
3. **A classroom pilot,** once the legal gate and R-2 are done, and only with separate owner authorisation for
   production.

### Step 4 · 4.2 planned from what the pilot shows (rec. 6)

- Each 4.2 item must cite a pilot observation or an owner ruling.
- The teacher's-week items come first. The small loop is built from existing parts: a re-read request, Uji Cepat and
  per-objective results. It makes no causal claim, and its fixed wording is Daisy's.

### Step 5 · 4.5 and 5.0 planning

- **4.5:** the measurement contract first (Review X §G); RD-4 reproduced on controlled data; the split (rec. 8); the
  pooling ruling (rec. 9).
- **5.0:** interventions recorded as a by-product of what the teacher did in PINTAR, building on 4.2's small loop.

### Who does what, and the cost

| Person | Work |
|---|---|
| Bob | Step 0's records and decision pack; the readiness list; mapping the walkthrough to the journeys |
| Sharon | Step 0's security and database checks; reviewing recs 2 and 3; the readiness engineering review |
| Daisy | The observation script; the small Z wording items |
| Second Eye | Step 0's failing cases, after his current A3 commit; recs 2 and 3 after A3 |

- **Step 0 costs about a day in total,** done economically: verification tests and records only.
- **Nothing in Steps 0–1 adds a batch or moves Z,** except what the owner approves.
- **The largest cost is not engineering.** It is the legal and consent work, and finding pilot teachers.
