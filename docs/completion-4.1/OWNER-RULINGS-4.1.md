# PINTAR 4.1 · the owner's rulings since THE PLAN was approved

> **A digest for reading, not a new authority.** Compiled by the Chief Architect on 12 November 2026 (07:43 UTC). Each
> ruling is stated briefly and points to the record that holds it in full; where this digest and that record differ,
> the record governs. Rulings made before THE PLAN's approval are in `OWNER-DECISIONS-2026-11-11.md` and in THE PLAN
> §7.3 and are not repeated here. Records are on `claude/bob-41-master-plan` under `docs/completion-4.1/`.

**Standing throughout:** no pull request, merge, staging promotion, production deployment or production database
change is authorized. Staging is not modified. No provider API access, credential, spending or transfer of evaluation
material is authorized.

## 1 · The plan and its governance

| # | Date | Ruling | Record |
|---|---|---|---|
| 1 | 11 Nov | **THE PLAN, revision 9, approved** at `2b89e28d21efdd3fda47050c79f41aa17ce0b34b`. One governed batch at a time; routine decisions stay with the team; material changes and failed gates are escalated | `THE-PLAN.md` header |
| 2 | 11 Nov | **Cross-module system integrity** is part of every batch's acceptance, not a new gate | `SYSTEM-INTEGRITY-4.1.md` |
| 3 | 11 Nov | **Standing engineering principle, permanent:** four questions (and then what; what else did that change; what happens when things go wrong; can this action be reversed, and what survives) across five dimensions; every consequential action has a defined next state | `STANDING-PRINCIPLE-ONE-SYSTEM.md` |
| 4 | 11 Nov | The Chief Architect leads execution: issues instructions, coordinates, escalates only material decisions | `TEAM-INSTRUCTIONS.md` |
| 5 | 12 Nov | **Stale instructions are marked superseded where they stand,** not deleted; one current statement per piece of work | `TEAM-INSTRUCTIONS.md` |
| 6 | 12 Nov | **Reassessment of THE PLAN: the plan is sound; execution is improved, not redesigned** | `PLAN-REASSESSMENT-2026-11-12.md` |
| 7 | 12 Nov | **THE PLAN · Addendum 1 approved and effective,** as submitted at `0e3c63e11540a004fbb5183c1486378301e7a9f7`, with five conditions. THE PLAN stays byte-identical | `THE-PLAN-ADDENDUM-1.md` header |
| 8 | 12 Nov | **The repository is the baseline of record** (ADR-0019, confirmed). An external copy is a downstream synchronization target | `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3e |
| 9 | 12 Nov | **Keep the process proportionate:** no new document, review cycle or gate unless it demonstrably improves correctness, reliability or efficiency | Addendum 1 §5 |

## 2 · Execution

| # | Date | Ruling | Record |
|---|---|---|---|
| 10 | 11 Nov | **B1 formally closed** on `1fc719b5127313bf24084695fa30d7505e15b5d1` | `B1-ARCHITECT-CHECK.md` §13 |
| 11 | 11 Nov | **F-1 is a mandatory blocker before C1w's promotion,** corrected in a narrow pass, not in C2w | `C1W-F1-CORRECTION.md` |
| 12 | 11 Nov | **L-1 before F-1,** each a separate, independently verified pass | `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` |
| 13 | 12 Nov | **A2 is built as A2a (emergency integrity) then A2b (planned maintenance),** with Sharon's three conditions; her nine scenarios and final acceptance preserved | Addendum 1 §5, §5a |
| 14 | 12 Nov | **A staging checkpoint before A2a: approved for planning only.** Readiness evidence and the proposed boundary are brought for separate authorization; `pg_cron`'s transaction behaviour on hosted staging must be addressed before A2a | Addendum 1 §5, §5b |
| 15 | 12 Nov | **Stacked verification** for up to three genuinely independent small corrections, with safeguards; never for a batch or coupled corrections | Addendum 1 §5; `TEAM-INSTRUCTIONS.md` |
| 16 | 12 Nov | **Before any correction is built:** a short design review by Sharon; the impact analysis reads constraints and invariants | `TEAM-INSTRUCTIONS.md` |

## 3 · Accounts, sign-in and deletion

| # | Date | Ruling | Record |
|---|---|---|---|
| 17 | 11 Nov | **A suspended or closed account's sign-in must not disclose its state:** bounded correction approved; accurate internal diagnostics kept; no general redesign of authentication | `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` |
| 18 | 11 Nov | A controlled check of hosted Auth with one synthetic account is authorized; no real account or production is touched. *(Deferred by the Chief Architect to the first promotion that carries the correction; staging has no locked account)* | same, §2 |
| 19 | 12 Nov | **A suspension covers accounts created after it** (option B): the account is created and locked, with no authentication window; reinstatement releases it. Account creation for a closed person is a separate finding | `SUSPENSION-COVERS-NEW-ACCOUNTS.md` |
| 20 | 12 Nov | **No invitation or activation message while a person is suspended or closed,** and no revealing difference in the response. *(Already true; a guarding test only)* | same, §5b, §5c |
| 21 | 12 Nov | **Anonymisation stays meaningful: an anonymised person is terminal for new identity attachments.** A returning individual is a new person; history does not reappear | `ANONYMISED-PERSON-IS-TERMINAL.md` |
| 22 | 12 Nov | **A certificate newly earned by an anonymised person is recorded as earned but not issued** (option A). No certificate is created and no identity restored | same, §0 item 6 |
| 23 | 12 Nov | L1-F4's two-connection race test must pass before final acceptance; Sharon verifies historical against new live attachments | same, §0 item 8 |

## 4 · Accountability and printing

| # | Date | Ruling | Record |
|---|---|---|---|
| 24 | 11 Nov | **The platform admin's accountability reader must not imply completeness** when recording failures are detected: a qualified notice linking to health information; no school named; school-facing notices deferred | `B1-ARCHITECT-CHECK.md` §10; `B2-ARCHITECT-NOTES.md` §4 |
| 25 | 12 Nov | **A learner's own-results print belongs to the school or schools whose evidence is on the printout** (the content rule). Existing boundaries preserved; no attribution of historical evidence to a new school by transfer | `B2-ARCHITECT-NOTES.md` §0, §1 |
| 26 | 11 Nov | The shared phone drawer overflow (S-1) is corrected as bounded 4.1 consistency work | `B1-ARCHITECT-CHECK.md` §13 |

## 5 · Questions, keys and explanations

| # | Date | Ruling | Record |
|---|---|---|---|
| 27 | 12 Nov | **A key correction clears the stale rationale and misconception code** on options whose correctness changed, in the corrected revision (option A). Sealed content preserved; the confirmation names the affected explanations; Studio marks the revision; an urgent correction is never delayed; the two-person rule is unchanged | `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` |
| 28 | 12 Nov | **INV-03 amended narrowly** (option A1): an empty rationale only where a governed two-person key correction withdrew it, with a durable reference and the text on the correction's audit record, enforced in the database | same, §0 item 9, §3c |
| 29 | 12 Nov | The absence of a misconception link must not be shown as evidence of no misconception *(met by wording and a marker, no new figure)* | same, §3a |
| 30 | 12 Nov | **Terminology** (Daisy's, accepted): «Catatan peninjau» for C2w's reviewer notes; «belum dikaitkan dengan pemahaman keliru» for a missing misconception link; «anotasi» never on a screen | Addendum 1 §5d, R-2 |

## 6 · Maintenance

| # | Date | Ruling | Record |
|---|---|---|---|
| 31 | 12 Nov | **R-1: PLANNED maintenance is work-scoped, not person-scoped,** at class scope and at school scope. One school's planned maintenance must not stop the same person's work at another school. **EMERGENCY containment keeps its person-level behaviour and every protection.** Platform-wide planned maintenance is unchanged | Addendum 1 §5d, R-1 |
| 32 | 12 Nov | A2a must not expose class-scoped planned maintenance with person-level consequences; that functionality waits for A2b | same |
| 33 | 12 Nov | Sharon's analysis of the eight operations is the technical direction, subject to Second Eye's inventory and normal review; anything that cannot be safely scoped comes to the owner | same |

## 7 · AI-assisted question generation and the provider evaluation

| # | Date | Ruling | Record |
|---|---|---|---|
| 34 | 12 Nov | **The provider evaluation's no-cost preparation begins now.** The owner nominates the educator judges | `C3-EVALUATION-PREPARATION.md` |
| 35 | 12 Nov | Official documentation of the three providers is read for verification **in the dedicated `pintar40` environment,** not the shared Default; Sharon reviews the findings independently | same, §6d |
| 36 | 12 Nov | **Google is a conditional candidate** until its restriction on applications accessed by under-18s is clarified in writing for PINTAR's educator-only feature. The inquiry is approved for sending; ten working days from sending; otherwise the evaluation proceeds with the eligible providers. Not declared ineligible | same, §6a, §6b, §6d |
| 37 | 12 Nov | **R-3: no learner personal information reaches an external provider,** by enforceable handling established at C3w's design review | Addendum 1 §5d, R-3 |

## 8 · Open with the owner

| Item | What is needed |
|---|---|
| The `pintar40` environment | Add the documentation hosts listed in `C3-EVALUATION-PREPARATION.md` §6d, then a new session reads the pages |
| The Google inquiry | Send the draft of §6b; tell the Chief Architect the date, so the ten working days can be recorded |
| Educator judges | Nominate three (requirements given on 12 Nov) |

Nothing else is waiting on the owner.
