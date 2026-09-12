# Rebuild Readiness Report

Final consistency check across `docs/rebuild/01`–`15` and the amended
`FABLE-00`–`06` prompts. This is a documentation-only exercise —
`pintar-3.0-consolidated/` and its database were inspected, not modified.

## 1. Is the documentation sufficient to begin the ground-zero rebuild?

**YES, WITH CONDITIONS.** The domain model, invariants, state machines,
authorization matrix, evidence contract, assessment-engine contract, and
content-versioning contract are complete and internally consistent. The
five gaps identified in `14-FABLE-PROMPT-CROSSCHECK.md` (telemetry schema
timing, explicit safety-critical column, preview-session exclusion,
explicit lifecycle enumerations for sessions/certificates, readiness-tier
thresholds, anomaly-log destination) have been applied directly to
FABLE-00 through FABLE-06. The conditions are the four blocking open
decisions in §2 below — Phase 1 can start without them, but specific later
phases cannot cross their gate without an answer.

## 2. Are there unresolved BLOCKING product decisions?

Yes, four (`11-PINTAR-OPEN-DECISIONS.md`):
- **OD-1** — which accreditation framework the Institutional Learning
  Intelligence report encodes. Blocks FABLE-06.
- **OD-3** — which source book editions/ISBNs ground V1 content. Blocks
  real content authoring in FABLE-02/03 (fixture/placeholder content can
  proceed without it).
- **OD-5** — the actual data-retention/anonymization policy for learner
  responses and telemetry. Blocks finalizing FABLE-01's audit/data-
  lifecycle schema.
- **OD-8** — which specific chapters need the newer non-MCQ item types
  (true/false battery, matching, image-anchored), pending OD-3. Blocks
  FABLE-03's polish (not its extensible-type-system work, which can and
  should proceed regardless).

## 3. Are there unresolved BLOCKING architecture decisions?

No architecture-level (not product-level) decision remains genuinely
blocking. OD-2 (pre/post-test item overlap policy), OD-4 (cross-institution
sharing), OD-6 (physical/NFC credential card), and OD-7 (NotebookLM
emphasis vs. vendor-agnostic philosophy) all have safe, documented defaults
Fable may proceed on (see doc 11's "may Fable choose a reasonable default?"
column) — none require a pause.

## 4. Are there contradictions between FABLE prompts?

None found after the amendments in §14 were applied. Before the amendments,
FABLE-03/04's implied lifecycle behavior and doc 04's explicit state-
machine tables were only "partially" aligned (correct behavior describable
without an enforced transition table) — this is now closed by requiring
explicit enumerated status + transition triggers in both phases.

## 5. Are there requirements that cannot currently be objectively tested?

One category: subjective copy/tone review (does an assistance message
genuinely read as "Mari kita pikirkan bersama" in spirit, not just
mechanically avoid the forbidden-word list) and visual layout/whitespace
judgment calls. These remain the explicit manual-review exception the
self-test doctrine (FABLE-00) already carves out — everything else in
every phase's acceptance checklist is now written as an automated test.

## 6. Are there features whose scope is ambiguous?

Two, both already flagged and resolved to a conservative default in
`09-PINTAR-V1-SCOPE-BOUNDARIES.md`: the Rasch/IRT recalibration engine
(real statistical model deferred to category B until N≥30 real responses
exist — stub it, don't fake realism against seed data) and Automated
Content Improvement Brief *auto-drafting* (the convergence-detection stays
in V1; auto-writing the brief text is deferred).

## 7. Are there old implementation behaviours that should explicitly NOT be
recreated?

Yes — the full list is `10-PINTAR-REMOVED-AND-REJECTED-FEATURES.md`. The
five with the highest risk of accidental resurrection if Fable 5.1 reads
old code/docs during research: the legacy `soal`-table bank, direct
client-side anon-key storage uploads, the briefing pipeline's dummy-data
fallback, two coexisting certificate-verification URL shapes, and the
~90-folder delivery-patch repo pattern.

## 8. Are all cross-phase dependencies accounted for?

Yes, as of the amendments applied in this pass. The specific dependencies
audited (Phase 5 on Phase 1's audit trail; Phase 3's telemetry on Phase 2's
schema; Phase 6's analytics dimensions and readiness thresholds on earlier
phases; certificate verification on the content-versioning model; Rasch
calibration's preview-session exclusion; Studio's lifecycle dependence on
the database phase; the Safety Gate's dependence on item metadata;
authorization introduced later vs. earlier RLS assumptions) are listed with
their resolutions in `14-FABLE-PROMPT-CROSSCHECK.md`, and every MISSING/
PARTIAL finding there has already been folded into the FABLE-0X files.

## 9. Can Fable 5.1 begin Phase 01 without making important product
assumptions?

**YES.** Phase 1 (foundation: identity, roles, academic hierarchy, RLS
pattern, storage contract, audit trail, Config Studio shell) depends on
none of the four blocking product decisions in §2 — it can be built purely
from the architectural/security doctrine, which is fully specified.

## 10. What should the product owner resolve before issuing FABLE-01?

Nothing is required before FABLE-01 itself. Resolve, in this order, before
the phase that needs each:
1. **OD-5** (retention/PDP policy) — before Phase 1's audit/data-lifecycle
   design is considered final (can start, shouldn't be called "done" without
   this).
2. **OD-3** (source book editions/ISBNs) — before any real content
   authoring in Phase 2/3 (fixtures can proceed without it).
3. **OD-1** (accreditation framework) — before Phase 6.
4. **OD-8** (which chapters need which non-MCQ item types) — before Phase
   3's content-specific polish, contingent on OD-3.

---

## Files created

`docs/rebuild/01` through `15` (lessons learned, canonical domain model,
invariants, state machines, authorization matrix, evidence/telemetry
contract, assessment-engine contract, content-versioning contract, V1
scope boundaries, removed/rejected features, open decisions, failure
modes, ADR template, FABLE crosscheck, start-here orientation) plus this
readiness report. `FABLE-00` through `FABLE-06` were amended in place per
the crosscheck's findings — not duplicated as new files.

## Critical blockers found

None architectural. Four product decisions (OD-1, OD-3, OD-5, OD-8) block
their respective downstream phases, not Phase 1 itself — see §2 and §10.

## FABLE prompts requiring amendments

All five identified gaps have already been applied: FABLE-00 (references
docs 09–13 and their binding rules), FABLE-02 (telemetry tables,
`is_safety_critical` column, preview-session flag), FABLE-03 (explicit
session-lifecycle enumeration), FABLE-04 (explicit certificate-lifecycle
enumeration), FABLE-05 (anomaly logs route to the audit trail), FABLE-06
(explicit readiness-tier thresholds).

## The five most important lessons the new Fable must not repeat

1. A bucket's `public` flag and its RLS storage policies are two separate
   locks — closing one does nothing to the other (the C2 root cause).
2. "Temporary, app-layer-only" is not a real authorization boundary —
   `USING (true)` should never ship, even once.
3. A signing key with no version cannot ever be safely rotated — build the
   keyring before you need it, not after a leak.
4. A "thin vertical slice to prove the architecture" needs an explicit
   retirement condition, or it quietly becomes a second permanent system
   running forever alongside the real one.
5. One trunk, one linear migration history, real commits from day one — no
   parallel numbered series, no delivery-patch-folder queue, regardless of
   how the work gets done session to session.

## Readiness verdict

**Ready for a clean rebuild**, with the four product decisions in §2
tracked as gating conditions on their respective phases rather than as
blockers to starting. Do not begin FABLE-01 execution — this package is
for product-owner review first, per the standing instruction.
