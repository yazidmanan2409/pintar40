# Post-review rulings D-1 to D-9: execution acknowledgement and readiness plan

Bob, 18 Nov 2026, in answer to the owner's final directive of the same date (recorded as ruling 55). The decision pack
it rules on is `docs/roadmap/POST-REVIEW-DECISION-PACK-18NOV.md`. **The critical path is unchanged:**

```
A3 → C3w-1 → C3w-2 (subject to D-7) → Z → observed walkthrough → acceptance
```

No review-driven work enters `claude/a3`.

## 1 · D-1 to D-9 confirmed, with two points to clarify

> **Owner, 18 Nov (ruling 56): C-1 approved; C-2 approved on condition** that any multi-answer content which could reach learners before the repair has its entry paths contained at once; **D-7's checkpoint set** at 25 Nov 2026, 17:00 WIB, as a return for a decision, never an automatic activation. **The walkthrough uses existing 4.1 functionality only.**

All nine rulings are confirmed as written. Two points need the owner's reading. Until he answers, the defaults below
apply.

| # | Point | Bob's reading (the default unless the owner says otherwise) |
|---|---|---|
| C-1 | **D-1 says contain and repair.** Once the repaired readers pass their regression tests at Z, does multi-answer authoring stay open? | **Yes.** The containment protects learners until the repair lands; it is lifted when the repair is accepted. If the owner wants the type closed after Z as well, say so |
| C-2 | **What "contain across all entry paths" means before Z.** No school uses staging and production holds no items, so no learner can meet the defect before Z. | **Contain without temporary code:** (a) the inventory (§3) proves exposure; (b) a guard test fails on any new reader that reads a multi-answer response as one label; (c) C3w-1's draft output is single-answer until the repair is accepted. Blocking import, the workbench and publishing would be code written now and removed at Z. **If the inventory finds a multi-answer item in content a walkthrough or pilot would use, the entry-path blocks go in at Z's start.** If the owner wants the literal blocks regardless, they land first in the Z window |

## 2 · Immediate authorised tasks, owners and order around A3

**Sharon's A3 reviews always come first.** Second Eye's work is unchanged until A3 is frozen.

| Order | Task | Owner | Authority | When |
|---|---|---|---|---|
| 1 | **D-1 inventory** (§3): live readers on a fresh local build; content and fixtures in the repository; C3w output | Sharon (local), Bob (repository) | D-1, D-8 | Now; about 1 day |
| 2 | **D-8 staging inventory:** one transaction-read-only query, counts and content states only, no learner rows | Sharon | D-8 | Now, with 1 |
| 3 | **D-6 feedback round:** what it collects, who can open it, whether it is reachable, and the smallest containment. The code is at `src/app/belajar/umpan-balik/` and `src/app/edukator/ringkasan/`. No deletion | Sharon | D-6 | After 1–2; about 0.5 day |
| 4 | **The certificate policy specification** (D-2) for Dr Gladys and Sharon | Bob | D-2 | Draft by 20 Nov |
| 5 | **The Production Readiness register** (§4) | Bob; Sharon reviews | D-4 | Draft by 21 Nov |
| 6 | **The observed walkthrough plan** (§5) | Daisy | D-5 | Draft by 21 Nov |
| 7 | **The other verifications,** in the directive's order (assistance and repetition; the result in force; the reading gate; Question Health counting; transfer, rollover and authority at effect) | Sharon, local and read-only, in gaps | Directive §3.2 | From about 20 Nov; about 3–4 days, spread out |
| 8 | **Z corrections:** the D-1 repair, then the classed Z items (R-8, R-10 with N-9, R-11 with N-8, N-1, N-2, R-15's Z items, the feedback containment) | Second Eye; Sharon and Daisy review | Z, under the severity rules | After A3's freeze |

## 3 · D-1: containment and repair

**The scope is wider than "four readers".** At least ten migrations on `main` contain a reader that joins the chosen
option with `value ->> 'pilihan'`. Among them are the learner review, the class's hard questions, the misconception
counts, Question Health, professional learning, the key correction and the key in force. Later migrations supersede
some of those definitions, so the first step is to establish **which live definitions** are affected.

1. **Inventory (Sharon, local):**
   - on a fresh build of `main`, list every live function and view that reads `value -> 'pilihan'` as a scalar;
   - class each as learner-facing, teacher-facing, statistical, or not affected.
   It is a read of `pg_proc`; nothing changes.
2. **Inventory (Bob, repository):**
   - multi-answer items in the content packs, pilot and synthetic fixtures, and the walkthrough school;
   - the import contract, the workbench and `salin_kursus_revisi`'s carry-forward;
   - C3w-1's output schema.
3. **Inventory (Sharon, staging, D-8):** counts of multi-answer items by content state (draft, in review, published,
   withdrawn), and of final responses to them. Counts only.
4. **Containment until repair:** per C-2.
5. **Repair (Second Eye, Z window, test first):**
   - each affected live reader handles an array: every chosen option, with its own reason; a wrong chosen option is
     counted towards its misconception; option distributions count each chosen option once per response;
   - the corrected-key readers mark each chosen option by the key in force;
   - scoring is not touched (`set_match` is correct).
6. **Regression coverage:**
   - for every repaired reader, a failing case with one multi-answer question: all correct; one wrong option;
     two wrong options; a corrected key; a course copy;
   - a guard test that fails on any new scalar read of a multi-answer value;
   - a planted defect per repaired reader, caught;
   - one browser check that the learner's review shows the chosen options and reasons.
7. **Not included:** any Question Health redesign, thresholds or scheduling (D-12 and 4.5).
8. **Size and risk:** 1.5 to 3 Second Eye days, depending on the live count. This is the largest addition to Z (§8).

## 4 · Production Readiness: the assessment plan and exit outline

**Verify existing arrangements first.** The register is
`docs/completion-4.1/PRODUCTION-READINESS-REGISTER.md`, one row per area:

| Area | What exists | Evidence | Gap | Smallest remedy | Owner | Exit criterion |
|---|---|---|---|---|---|---|

**Areas:**
1. Governance, consent and school use: legal advice, R-2, the school data agreement, the privacy notice, OD-9 (transfer
   consent).
2. Monitoring and error capture: the production watch, scheduled-job failure, error capture.
3. Capacity for the intended operating envelope: tier, connections, the load test, the leader page.
4. Recovery: backup, point-in-time recovery, a timed restore including stored files.
5. Support and administrator coverage: named support, a second production administrator.
6. Operating without one individual: who can promote, restore and approve; the owner's authority stays separate.

**Method:**
- read the repository's recovery and release records;
- read the repository workflows;
- staging evidence already on record.

**Production-side facts can't be read by the team.** These include the watch variables, the production tier and the
backup settings. **The owner confirms them, or authorises a read.** No production action is taken.

**Exit outline:**
- every row has evidence and a named owner;
- every gap has a remedy the owner has accepted, deferred or rejected;
- Phase 8 of the recovery charter (the journey status; the 4.0 checklist was retired as the measure by D-084) holds for the intended first use;
- R-2 is decided.

## 5 · The observed walkthrough: preparation plan

**Daisy prepares it and Bob maps it to Z's journeys.**

| Part | Content |
|---|---|
| Tasks | (1) Fresh-school setup and teacher activation. (2) An educator's learning and evidence journey, including one weak section followed to a re-read and an Uji Cepat, using only approved features. (3) An interrupted, shared-device sitting and its recovery (A3). (4) One chapter through import, review and assignment |
| Observation | Completion, wrong turns, help requests, misreadings, and the time per task. Daisy's four questions are asked after each task |
| Recording | Technical correctness and human usability recorded separately. Observations classed by the existing severity rules. A feature request is recorded, never a 4.1 blocker by itself |
| Roles | Dr Gladys reviews educational meaning. The team only observes |
| Preconditions | Z complete and on staging. **A fresh synthetic school on staging is a bounded staging write and needs the owner's authorisation** (§7) |

## 6 · D-7: the checkpoint date (APPROVED as a checkpoint, ruling 56)

> **Proposed:** if, by **Wednesday 25 November 2026, 17:00 WIB**, no provider has been qualified by the owner with its
> limits set, Bob asks the owner to activate the J3 fallback.
>
> **The fallback:** J3 runs against the local stand-in, and C3w-2 is promoted separately once a provider is qualified.
> The acceptance evidence then states plainly that a stand-in integration test is not provider qualification.

**Why that date:**
- E's sheets are due by 19 Nov and J3's adjudication about a day later, so the results could be final by about 21 Nov.
- C3w-1 should finish about 25–26 Nov, after A3.
- C3w-2 needs about a day once a provider is qualified.
- Z's candidate is composed about 27 Nov.

A later date would leave C3w-2 no room before Z.

**Nothing is activated without the owner.** No unqualified provider is offered to schools.

## 7 · Owner approvals still outstanding

| Approval | Earliest needed |
|---|---|
| C-1 and C-2 (above) | **20 Nov** (before the inventory closes) |
| The D-7 trigger date | **20 Nov** |
| Dr Gladys asked to review the certificate policy (the owner relays; the specification comes from Bob by 20 Nov) | **21 Nov** |
| A3's staging promotion | When A3 is frozen, about **21–22 Nov** |
| C3w-2: provider qualification, limits, key and egress | **25 Nov** (the D-7 date) |
| Whether the certificate-policy change rides Z, or lands after Z but before any real certificate | **24 Nov** (before Z's scope closes) |
| Production-side facts for the readiness register (§4), or a read authorisation | **25 Nov** |
| The fresh synthetic school on staging for the walkthrough | At Z's staging promotion, about **28 Nov** |
| The walkthrough date and participants (O41-7) | About **25 Nov**, for an early-December session |
| Readiness remedies | After the register, about **27 Nov** |
| Pilot proposals (D-9) | After 4.1 acceptance |

## 8 · Genuine risks to the 4.1 critical path

1. **Z grows.** Before the review, Z was about 2 days. It now carries:
   - the D-1 repair (1.5–3 days);
   - the classed Z fixes (R-8, R-10 with N-9, R-11 with N-8, N-1, N-2, R-15's Z items; about 1.5 days);
   - the feedback containment (small).
   **Z is now likely 4 to 6 days, and the forecast to Z moves by about 2 to 4 days.** This is the material consequence
   of D-1 (B). It is not a reason to reverse it.
2. **Sharon is the shared constraint.** A3's reviews come first; the verifications use her gaps. If A3's reviews run
   long, the verifications slip, but A3 does not.
3. **E's timing drives C3w-2.** That is handled by D-7.
4. **Disk and pre-flight interruptions** on Second Eye's machine have already cost one re-run. One uninterrupted
   pre-flight per push is required.
