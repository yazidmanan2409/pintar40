# 15 — FABLE 5.1, Start Here

*Baseline amendment (2026-09-12): governing principle, authority hierarchy,
product naming, AI architecture and trust boundaries, educator
positioning, design language, security non-negotiables and reading order
(doc 16 added; scope categories renamed).*

Read this first, before FABLE-00.

## Governing principle

**CALM ON THE SURFACE. RIGOROUS UNDERNEATH.**

PINTAR absorbs complexity rather than transferring it to its users.
Learners, educators, administrators and institutional leaders should
experience clarity, calmness and obvious next actions. Underneath that
surface PINTAR remains rigorous in evidence, assessment, security,
authorization, provenance, content governance, historical
reproducibility, auditability, credential integrity, data isolation and
resilience. Simplicity in the interface is never achieved by weakening
those foundations. This is an architectural principle, not a UI slogan —
it is the Doctrine's calm-surface / invisible-engine principle applied to
every design decision, and every ADR (doc 13) records how it was honoured.

The final test of any architectural decision: *does this make PINTAR
calmer for the person using it while making the system more rigorous
underneath?* If complexity leaks unnecessarily to the user, reconsider the
surface. If simplicity weakens evidence, security, governance, historical
integrity or educational validity, reconsider the foundation.

## Authority hierarchy

Where requirements appear inconsistent, apply this order:

1. Dr. Gladys's educational vision (the learning cycle).
2. The PINTAR Doctrine (Constitution I) and the PINTAR Philosophy.
3. Validated product principles and explicitly approved architecture
   decisions (this baseline).
4. PINTAR 4.0 architecture invariants (doc 03).
5. Capabilities.
6. Implementation.

Legacy PINTAR 3.0 implementation is reference material, not migration
authority. **Preserve the lesson. Discard the implementation.** The
Doctrine changes only when PINTAR's principles change, never because
technology changes.

## Product naming

Internally this rebuild is designated **PINTAR 4.0**. Publicly the product
is **PINTAR**. "PINTAR 4.0" must never appear in learner, educator,
administrator or public-facing experiences — certificates, verification
pages, emails, reports, PDFs, public APIs/documentation, marketing.
Versioning is internal operational information where required (doc 08).

## What PINTAR is

PINTAR is an Indonesian-language, evidence-based learning platform spanning
SD → SMP → SMA → University → professional education. Its purpose is not
to deliver content. Its purpose is to measure understanding, guide
learning, generate verifiable evidence of competency, and continuously
improve the content itself from that evidence. Every screen answers one
question: what does this person need to do next?

## What PINTAR is not

Not a generic LMS. Not a quiz generator. Not a file-upload/CMS tool
wearing an education skin. Not an "AI product": PINTAR uses AI extensively
without defining itself by it, and no AI provider is part of its canonical
domain model. Any producer (AI or human) whose material can be converted
into the PLP format is interchangeable; external tools are producers, not
PINTAR's CMS.

## The learner cycle (canonical, Dr. Gladys)

```
Pre-Test — Pemetaan Awal
    ↓
Personal Reading Map — Peta Bacaan Personal
    ↓
Learning
    ↓
Post-Test — Uji Penguasaan
    ↓
Results / Growth / Mastery
```
Pre-test is diagnostic, never pass/fail. Wrong responses are evidence of
misconceptions, not lost marks. Pre-test and post-test share zero
identical items and zero parallel-group siblings (INV-24). Mastery requires
the overall passing rule and, where safety-critical content applies, 100%
on safety-critical items (INV-10). The Hesitation Window stays: hints
arrive progressively, never reveal the answer, never reduce the score, and
are configurable within governed bounds (doc 07).

## Educator positioning

PINTAR does not automate the educator. It automates unnecessary
educational workload. *PINTAR gives educators more time to do what only
they can do.* Less time preparing, grading, assembling and mechanically
analysing; more time explaining, reviewing, observing, mentoring,
discussing and teaching. Concretely: Teacher Quick Assessment launches in
about a minute; Question Health surfaces evidence and educators interpret
and decide; integrity signals inform a human, never convict; reports tell
the same evidence to different roles in different words.

## AI architecture and trust boundaries

**AI proposes → PINTAR validates → humans govern.** The Doctrine gives AI
no pedagogical authority. All AI capability is reached through a
provider-neutral AI Provider Gateway; PINTAR owns capability contracts,
canonical schemas, validation, provenance, governance and workflow. The
Authoring Intelligence Context (privileged, inside Studio) is separated
from the Learner Assistance Intelligence Context, which structurally has
no access to answer keys, misconception-to-answer mappings or grading
secrets. **Security through data boundaries, not AI obedience** (INV-31).
No AI or external tool may publish content or assign it to learners
(INV-32).

## Why this is a ground-zero rebuild

The prior implementation ("PINTAR 3.0") is not being migrated, ported, or
incrementally fixed. New codebase, new Supabase project, new migrations,
new architecture. Several of PINTAR 3.0's problems were structural
consequences of how it grew (doc 01), not bugs a patch can fix.

## What knowledge survives from the old project

Everything in `docs/rebuild/01`–`16`, plus `FABLE-00`–`06` once they are
re-crosschecked against this baseline (doc 14): product philosophy, the
Learning Safety Doctrine, the domain model, every invariant, every
lifecycle, the authorization matrix, the evidence contract, the
assessment-engine contract, the content-versioning contract, scope
boundaries, the engineering/verification system, and the specific lessons
paid for in the old build.

## What implementation does NOT survive

Old code, old migrations, old table names, old file layout, old patch-
folder history, and old *architecture*, even where it happens to still be
in a repo you encounter during research. If an old file contradicts one of
the docs/rebuild/ documents, the document wins; the old file is historical
record, not spec. Do not use PINTAR 3.0 source as implementation
inspiration; consult it only to inspect a specific historical behaviour.

## Design language

Do not redesign PINTAR visually from scratch. Inherit and refine PINTAR
3.0's established visual language: **quiet, warm, intelligent PINTAR.**
Neutral/white/off-white surfaces, the established primary visual identity,
restrained matching pastel accents, generous whitespace, strong hierarchy,
very limited typography, calm semantic status treatment. Colour
communicates hierarchy or meaning, not decoration. One screen, one
purpose. Avoid rainbow dashboards, excessive card colours, many fonts,
decorative gradients everywhere, neon "AI" aesthetics, excessive
animation, confetti, visually punitive error states, unnecessary alarms
or popups (Doctrine ch. 1). Enforced by a versioned token set (doc 16 §9).

## Security non-negotiables

1. RLS closed by default (INV-36). 2. No `USING (true)` shortcuts for
protected production data (INV-36). 3. Tenant isolation from day one
(INV-13). 4. Storage not public by default (INV-15). 5. No anonymous
privileged direct uploads (INV-15). 6. Answer keys and grading secrets
never reach the learner browser — or a learner-facing AI context (INV-01,
INV-31). 7. `SECURITY DEFINER` functions pin a safe `search_path`
(INV-14). 8. High-impact actions auditable (INV-18). 9. Append-only audit
foundations (INV-18). 10. Middleware/server authorization protects every
authenticated route, including in-progress sessions (INV-37). 11.
Service-role credentials never exposed client-side (INV-37). 12.
Certificate keys versioned from day one (INV-07). 13. One canonical
certificate verification route (INV-38). 14. Security enforcement belongs
at the server/data boundary, never UI convention (INV-37). — Consistent
with the Doctrine's "Security as a Form of Respect."

## Learning/evidence principles

Every learner response — especially a wrong one — is evidence of a mental
model, never a failure to shame. Assistance must never reveal the correct
option and must never influence scoring (physically separated telemetry).
No dead ends: a wrong answer always offers a next step. Every evidence
record carries its provenance, channel and class; only `OFFICIAL` evidence
reaches official mastery, analytics, Question Health, psychometrics and
certificates — structurally, not by remembering a filter (doc 06).
Collect today what tomorrow's psychometrics will require; do not pretend
tomorrow's psychometrics exists today.

## Content-versioning principles

APPROVED ≠ FROZEN. FROZEN means the taught-content hash is computed and
the row is immutable, permanently. A correction is always a new release,
never an edit to a frozen row. PUBLISH ≠ ASSIGN. A certificate's signed
payload binds the release id and hash, the definition version, the
identity snapshot and the key version (INV-05, INV-30). Results record the
engine and scoring-policy versions they were produced under (INV-29). See
doc 08.

## Rules against over-engineering

Build exactly doc 09 **BUILD NOW**. **FOUNDATION NOW** items get the
architectural boundary and nothing more. **LATER** and **PARK** items are
not built, regardless of how interesting they look in old design
conversations or how convenient an extension point makes them. If a phase
prompt seems to imply building one, stop and flag it rather than
proceeding.

## Rules against scope creep

If you find yourself building something not named in a FABLE phase prompt
because "it seemed necessary while I was in there," stop. Either the phase
prompt has a real gap (record it, flag it, keep going only if it's truly
blocking) or it's scope creep (don't build it). When genuinely unsure,
that uncertainty itself is the signal to ask the product owner rather than
decide silently.

## Required reading order

1. This document.
2. `FABLE-00-MASTER-OVERVIEW-PROMPT.md` (after it has been re-crosschecked
   against this baseline — doc 14 §"Post-baseline re-crosscheck").
3. `docs/rebuild/02` through `13`, in order, before writing any schema —
   especially `03-PINTAR-INVARIANTS.md` and `05-PINTAR-AUTHORIZATION-MATRIX.md`,
   which every phase's tests trace back to.
4. `docs/rebuild/16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md` — the
   delivery system every phase runs inside.
5. `docs/rebuild/14-FABLE-PROMPT-CROSSCHECK.md` — the amendments listed
   there must be reflected in FABLE-00 through 06 before you start; if they
   aren't, apply them before Phase 1, don't work around the gap ad hoc.
6. `docs/rebuild/11-PINTAR-OPEN-DECISIONS.md` — note which items are
   "MUST ASK PRODUCT OWNER" and don't proceed past the phase that needs
   that answer until it's resolved.
7. Then FABLE-01 through FABLE-06, one at a time, in order.

## Phase execution rules

Each FABLE phase is self-contained but depends on the schema/conventions
the previous phase established. Do not start a phase until the previous
phase's acceptance checklist is a fully green automated `selftest` run —
the versioned verification contract in doc 16 §4, not a manual
walkthrough. Each phase is followed by a bounded mini audit, fix and gate
(doc 16 §6). If a later phase seems to require reopening an earlier
phase's schema, stop and flag it rather than quietly patching around it.
If the same gate fails two or three times, stop stacking patches (doc 16
§7).

## Acceptance-gate rules

A phase is "done" when `npm run selftest` exits 0 for every test in the
accumulated contract (not just the current phase's new tests). Where
something genuinely can't be automated, say so explicitly and keep it as
the one deliberate manual step (the calm-surface copy/visual review),
rather than letting "hard to automate" quietly become "untested."

## Decision-log rules

Any decision matching the triggers in doc 13 gets an ADR at the time it's
made, in `docs/adr/`, including its calm-surface check and its
Requirement → Architecture → Implementation → Test → Audit Evidence trace.
This starts in Phase 1, not "once things settle down."

## When to stop and ask the product owner

Any item in doc 11 marked "MUST ASK PRODUCT OWNER." Any point where you'd
otherwise invent a source citation, a compliance policy (retention/PDP), a
transfer-consent policy, an accreditation framework detail, or a patent
claim. Any point where a FABLE phase prompt and a docs/rebuild/ document
actually conflict and you can't tell which should win. Silence is not
consent — if in doubt, ask rather than assume.

---

Requirements survive. Evidence survives. Product lessons survive. Proven
domain rules survive.

Implementation does not.

Build the PINTAR we now understand, not the PINTAR that history happened
to produce. Calm on the surface. Rigorous underneath.
