# PINTAR roadmap · 4.5, 5.0 and beyond

> **APPROVED AS STRATEGIC DIRECTION — the owner, 11 November 2026** (`OWNER-DECISIONS-2026-11-11.md` in this folder).
> This document is the one authoritative statement of PINTAR's direction after 4.1. It supersedes the roadmap authority
> that D-144 gave to the September documents. Implementing any part of it needs separate planning and authorization.
>
> Prepared by the Chief Architect on the owner's direction. How each earlier capability was disposed of is in
> `ROADMAP-RECONCILIATION-2026-11-11.md`. The technical findings of
> `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` remain available as evidence.

**What this document is.** Direction, capability groups, dependencies, governance and exclusions. It is not a plan:
it contains no batches, schedules, designs or acceptance tests. Each version gets its own planning when it opens.

**Order of work.** 4.0 (closed) → 4.1 (in progress; `docs/completion-4.1/`) → 4.2 (the deferred operational list in
`OWNER-DECISIONS-2026-11-11.md` §4) → 4.5 → 5.0. Nothing here adds to 4.1 or 4.2.

**The principle behind every version.** Educators remain responsible for educational judgment. PINTAR records
evidence, explains what it supports, says plainly what it does not, and never issues a judgment of a learner or an
educator on its own authority.

**How every version is built (owner's standing directive, 11 Nov 2026).** PINTAR evolves as one integrated system,
not a collection of individually successful modules. Every significant feature, state transition and correction is
examined with four questions: *And then what? What else did that change? What happens when things go wrong? Can this
action be reversed, and what survives?* Every consequential action has an explicitly defined next state. They
are asked across five dimensions: the human journey, cross-module effects, lifecycle, evidence integrity, and
boundaries (permissions, institutional separation, history, privacy). They are questions carried inside each
version's planning, review and acceptance, not additional gates. The full statement is
`docs/completion-4.1/STANDING-PRINCIPLE-ONE-SYSTEM.md` on `claude/bob-41-master-plan`, until it has a
version-independent home.

---

## A · PINTAR 4.5 — UNDERSTAND

### Purpose
Transform trustworthy educational evidence into meaningful, explainable, appropriately governed educational
intelligence.

### Capability groups

**A1 · Measurement foundations (first; everything else depends on them)**
- **Question Intelligence.** For each question, as far as the evidence supports: difficulty; how each answer option
  and distractor behaves; discrimination where there is enough evidence; the effect of a revision; and, for an
  assessment, reliability where it is statistically supportable. "Insufficient evidence" is a normal result. It
  supports educational judgment and does not manufacture certainty from small samples.
  *Starting point:* the four findings on the item statistics that the September review recorded still stand on static
  inspection; runtime verification is outstanding (reconciliation record, §2). Addressing them is early 4.5 work. 4.1
  is not reopened for them.
- **Instrument comparability.** A deterministic check of whether two assessments, or two revisions of a question, may
  be set side by side, with a reviewer's confirmation. No comparability is assumed.
- **Stable competency identity.** One identity for a competency across lessons, questions, learning objectives,
  courses, academic years, schools and curriculum revisions. Whether Indonesian curriculum references can anchor it is
  investigated in 4.5 planning. **Identity, equivalence and comparability are three different questions:** two
  competencies with similar names are not assumed to be the same, and the same competency is not assumed to be
  comparable across instruments.

**A2 · The evidence and insight classification**
Every statement PINTAR makes belongs to exactly one class, held as data and not only as wording:

| Class | Meaning |
|---|---|
| **Recorded** | Directly observed evidence |
| **Derived** | A reproducible calculation from defined evidence |
| **Inferred** | A conclusion supported by an explicit, versioned reasoning rule |
| **Not concluded** | An explicit refusal, where the evidence is insufficient or unsuitable |

Each statement keeps what applies to it: its evidence references, the calculation or rule version, the denominator,
the exclusions, the limitations, and the sufficiency or confidence conditions. AI may help express an approved
conclusion. AI does not decide what the evidence proves.

**A3 · Teacher-facing Quiet Intelligence**
- Evidence-based explanations and insights for the teacher, silent by default and present only when there is
  something sufficient and useful to say.
- Longitudinal learning patterns, subject to comparability.
- Educator-authored prerequisite relationships between competencies: professional hypotheses that evidence can support
  or question, never relationships inferred and imposed by the system.
- Recommendations that explain what an educator could do next.
- Transparent denominators, exclusions and limitations on every figure.
- **A usability principle kept from the September roadmap:** a reader knows within about a minute what needs their
  attention. It is a principle for these screens. It does not authorize a general dashboard composer.

**A4 · Governed formal educator evaluation**
The approved architecture:
1. PINTAR accumulates governed educational evidence during an evaluation period.
2. At period close, PINTAR prepares an evidence-backed draft evaluation.
3. An authorized human assessor reviews the evidence and the draft.
4. The assessor may accept or adjust conclusions and scores, with a recorded rationale.
5. The original draft and every human decision remain auditable.
6. The assessor finalizes and seals the formal evaluation.
7. The educator receives the finalized evaluation, its supporting evidence and specific recommendations for
   improvement.

Formal evaluation is institution-governed. PINTAR prepares drafts and never issues a final judgment about an educator.

*Safeguards that are part of this architecture:*
- Assessment outcomes do not automatically become measures of educator effectiveness.
- Educator-controlled assessment decisions (extra time, an ending, a sitting not counted, another attempt, a pass
  mark, the questions used) stay visible in the evidence.
- Assessment quality, participation, exclusions and unusual sitting conditions are disclosed.
- Evidence sufficiency and comparability are enforced; a draft conclusion that fails them is "not concluded".
- Every draft conclusion states its limitations and uncertainty.
- The educator has an appropriate opportunity to inspect the evidence and to respond.
- An assessor's adjustments keep their rationale and audit history.
- Ordinary learning feedback stays separate from formal evaluation.
- Formal evaluation produces no league table and no automated comparison between named educators.

**A5 · Educator protections (required before any educator-related evidence is shared)**
- Appropriate visibility for an educator into the evidence about them.
- Layered access permissions.
- An auditable record of access to sensitive evaluation information.
- A clear separation between developmental evidence and formal evaluation.
- Appropriate opportunities to correct factual errors or respond to conclusions.
- Restrictions on unsupported comparisons and rankings.

These do not promise an educator absolute control over records an institution is legitimately authorized to keep.

**A6 · Explainable history**
What a report or an evaluation said at the time it was issued can be shown again exactly: immutable snapshots,
evaluation "as of" a date, and versioned templates. A sealed evaluation depends on this.

**Carried into 4.5 by earlier rulings, outside the UNDERSTAND theme:** WhatsApp sign-in (O41-2); adaptive
unusual-access checks on staff accounts (D-088).

### Foundational dependencies
- From 4.1: stable question identity and revision lineage; the corrected-result chain with one result in force; the
  recorded marks on unusual sittings; AI provenance kept beside each question; the accountability store.
- The version discipline of D-060: a label changes when its meaning changes.
- A governed policy for retention, deletion and pseudonymization of educational evidence (section E).
- The policy choices for formal evaluation (section E).

### Governance principles
- Measurement quality comes before interpretation.
- "Not concluded" is a respectable, frequent outcome and is designed as one.
- A human confirms every comparison and every formal conclusion, and sees the evidence against it as plainly as the
  evidence for it.
- No analytics or AI path runs with service-level access; learners see no more than the closed learner projection.
- No behaviour tracking: no click, page-view or time-on-platform record is evidence of learning or of teaching.

### Explicit exclusions
- Automated judgments of educators; rankings, league tables or comparisons between named educators.
- Predictions of which learners will fail; anything resembling a diagnosis.
- AI deciding what evidence proves, or writing a causal claim.
- Question weighting (deferred; see the reconciliation record).
- Cross-school comparison of any kind.

---

## B · PINTAR 5.0 — ACT & GROW

### Purpose
Help educators and institutions act on that intelligence, pursue improvement and examine whether their actions produce
meaningful results.

### Capability groups

**B1 · Educator Growth**
- Educator-led, learner-centred improvement: Educator Growth journeys with evidence-linked development objectives.
- **The Shared Growth Compact:** the agreed terms on which growth evidence is created, seen and used, with layered
  visibility, non-penalization and auditability.
- An educator's private developmental work stays distinct from institutionally governed formal evaluation. Growth
  records do not become an automatic disciplinary scoring mechanism.

**B2 · Interventions and what followed**
- Educator-selected interventions, recorded: what, for whom, when.
- Longitudinal measurement of improvement.
- Responsible comparison between interventions, with staggered starts where appropriate.
- No withholding of necessary educational assistance.

**B3 · The three intervention claims**
PINTAR distinguishes, and never blurs:
1. An intervention was **recorded**.
2. Subsequent outcomes were **consistent with improvement**.
3. A pattern received **stronger support** through appropriately designed, repeated observations.

Repeated observation is not proof of causation. The strength of any claim depends on the evidence, its comparability,
the study design and the alternative explanations. PINTAR never says an intervention worked because results improved
afterwards. A teacher still receives useful feedback when causality cannot be established.

**B4 · Journeys beyond the fixed learning cycle**
Server-enforced progression and completion rules, and the small set of governed journey shapes that interventions and
prerequisites need.

**B5 · Institution-level improvement**
The same act-and-examine cycle at department and school level, on aggregates.

### Foundational dependencies
- All of 4.5: measurement quality, comparability, competency identity, the classification, the educator protections.
- Server-side progression (the September review's friction 2).
- Policy choices on staggered starts and on what "necessary assistance" means (section E).

### Governance principles
- The educator chooses the objective and the intervention.
- Changing learner populations, different school circumstances and incentives are stated beside every longitudinal
  figure: the cohort, the participation, the exclusions.
- A staggered start is a school's informed decision, and a teacher can end it for a learner at any time.
- Insufficient evidence is reported as such, never filled in.

### Explicit exclusions
- Any claim of causation from a single class or a simple before-and-after.
- Scores or rankings of educators derived from growth records.
- Adaptive learning paths that act without the teacher.
- A general workflow composer or user-assembled dashboards (see the reconciliation record).

---

## C · Beyond 5.0

**Credible opportunities** (possibilities, not commitments):

| Opportunity | What it would need first |
|---|---|
| Question-bank intelligence at scale: calibrated questions, exposure control, comparison of AI-drafted and human-written questions | Years of sittings per question; 4.5's measurement foundations |
| Misconception intelligence: which misunderstandings persist, across topics and years | Structured misconception coding; competency identity |
| Longitudinal educational intelligence | Comparable instruments over time; the retention policy |
| Responsible personalization, with the teacher approving what is suggested | Reliable misconception evidence |
| Institution-level improvement cycles | 5.0 in use |
| Governed cross-school research | A shared competency reference; data-sharing agreements consistent with school data ownership (D-110); pseudonymization; a research governance body |
| Stronger evidence about educational interventions | The cross-school research above; appropriate study designs |

**Research requirements.** Each of these needs evidence PINTAR does not yet have, governance that does not yet exist,
or both. None is designed until its need is demonstrated.

**Deferred or retired** (reasons in the reconciliation record): question weighting; the outward-facing Context
Passport and its QR; the general workflow composer; user-assembled dashboards; the plugin API; conversational
drill-down; theme presets.

---

## D · September roadmap reconciliation
See `ROADMAP-RECONCILIATION-2026-11-11.md`.

## E · Open owner decisions — **all five PENDING**

Only questions that are genuinely unresolved and material. None blocks 4.1. None is answered in this document.

| # | Decision | Why it is the owner's | Needed by |
|---|---|---|---|
| R-1 · PENDING | **Formal evaluation policy.** Who may be an assessor; what an evaluation period is; what an evaluation scores and who defines its rubric; how long an educator has to inspect and respond, and whether the response is sealed with the evaluation; who may read a sealed evaluation; how long it is kept | These are institutional authority and employment matters. The architecture needs them; it must not invent them | 4.5 planning |
| R-2 · PENDING | **Retention, deletion and pseudonymization of educational evidence.** Indefinite retention is not assumed appropriate; neither irreversible deletion nor permanent preservation is prescribed. It needs educational, institutional and legal examination | A governance decision with legal weight. Best made before real schools accumulate years of data | Before production data; 4.5 planning at the latest |
| R-3 · PENDING | **A misconception annotation naming a structured misconception code** (a proposed 4.1 consideration for C2w). Supported in principle; needs a separate technical review and the owner's approval, and is deferred if it cannot be added without disturbing approved work | It would change an approved 4.1 batch | Before C2w's completion page |
| R-4 · PENDING | **Staggered intervention starts.** Who in a school may approve one, what families are told, and what "necessary educational assistance" means | It is a form of research involving children | 5.0 planning |
| R-5 · PENDING | **The competency anchor.** Whether to adopt a national curriculum reference, after the 4.5 investigation reports | It binds every school's content to an external reference | During 4.5 planning |
