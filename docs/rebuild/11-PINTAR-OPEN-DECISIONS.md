# 11 — PINTAR Open Decisions

Unresolved questions found across the project's full history, including
contradictions between documents. None of these are silently resolved here.

---

### OD-1 — What accreditation framework should the Institutional Learning
Intelligence report actually encode?

**Why it matters:** the old comprehensive handoff references "LAM-PTKes
2024 alignment" in one place as if settled, but no document explains why
that specific framework or confirms it's still the target for PINTAR 4.0's
university-course tenant.

**Latest phase by which it must be resolved:** before FABLE-06 (briefings)
implementation begins.

**Options:** (a) LAM-PTKes 2024 as before, (b) a different/updated
framework, (c) a generic competency-report shape with the framework as
configuration, not hardcoded.

**Recommendation:** (c) — build the report structure generically, bind the
specific framework via configuration, since accreditation requirements can
change and PINTAR may serve institutions under different frameworks.

**May Fable choose a reasonable default?** NO — **MUST ASK PRODUCT OWNER**
which framework(s) are actually in scope for the university course tenant.

---

### OD-2 — Do pre-test and post-test share any items, ever?

**Why it matters:** doc 07 flags that the blueprint's `repetition_policy`
governs this, but no source document states whether PINTAR's actual product
intent allows deliberate shared items for growth-measurement validity, or
strictly forbids any overlap.

**Latest phase by which it must be resolved:** before FABLE-02 (blueprint
schema) and FABLE-03 (learning cycle) both lock in their assumptions.

**Options:** (a) zero overlap ever, (b) a controlled overlap subset for
growth validity, configurable per blueprint.

**Recommendation:** (b), configurable, defaulting to (a) — matches the
general principle of "assessment blueprints over hardcoded rules" and
doesn't foreclose a legitimate psychometric technique.

**May Fable choose a reasonable default?** YES, with the default set to (a)
zero-overlap unless a specific course's blueprint is explicitly configured
otherwise by a human reviewer.

---

### OD-3 — What source books/editions ground the V1 content (SD math, SMA
math/geography, the university course)?

**Why it matters:** the domain model requires page-precise Source/
SourceVersion citations; no document names the actual textbook
editions/ISBNs to author against for a ground-zero content build.

**Latest phase by which it must be resolved:** before any real content
authoring in FABLE-02/03 (seed content) begins — placeholder/fixture
content can proceed without this, real content cannot.

**Options:** confirm the same source books used previously, or select new
ones.

**May Fable choose a reasonable default?** NO — **MUST ASK PRODUCT OWNER.**
Never invent a source citation.

---

### OD-4 — Is cross-institution content sharing/licensing a real near-term
need, or purely hypothetical?

**Why it matters:** determines whether doc 09's "architectural awareness
only" treatment (category B) is sufficient, or whether it should actually
be category A for V1.

**Latest phase by which it must be resolved:** before FABLE-02 finalizes
the tenant-scoping shape on `PLPRelease`.

**Recommendation:** keep as category B (aware, not built) unless a specific
near-term multi-institution customer already exists.

**May Fable choose a reasonable default?** YES — default to category B,
but flag this back to the product owner once a second real institution is
onboarded.

---

### OD-5 — What is the actual retention policy for raw learner
responses/telemetry?

**Why it matters:** doc 06 notes this was never explicitly decided
(only that *some* PDP-equivalent retention/anonymization job existed in the
old system) — "how long" and "anonymize vs. delete" were never stated as a
concrete policy in any document read.

**Latest phase by which it must be resolved:** before FABLE-01's audit
trail / data-lifecycle design locks in a schema that assumes one answer.

**Options:** (a) indefinite retention with anonymization only, (b)
time-bounded retention (e.g. N years) with anonymization, (c)
institution-configurable.

**May Fable choose a reasonable default?** NO — **MUST ASK PRODUCT OWNER**,
this has real legal/compliance weight (PDP = Indonesian data-protection
law) that shouldn't be guessed.

---

### OD-6 — Should the physical/NFC credential card concept be part of V1
certification, or purely a future idea?

**Why it matters:** extensively designed in the uploaded conversations
(ID-1 ratio, flip animation, NFC glyph) but never implemented; conflicting
signal between "this was designed in detail" and "there's no evidence it
was ever requested as a near-term deliverable."

**Latest phase by which it must be resolved:** before FABLE-04 locks
certificate scope.

**May Fable choose a reasonable default?** YES — default to category C/D
per doc 09 (A4 certificate only, no physical card), but this is cheap for
the product owner to override early if wanted.

---

### OD-7 — Contradiction: "single canonical AI-agnostic PLP format" vs.
"NotebookLM as *the* Content Factory"

**Why it matters:** the core philosophy insists no AI vendor lock-in
(PLP decouples PINTAR from any specific producer); several uploaded
documents nonetheless describe NotebookLM specifically and in detail as
"the initial Content Factory," with vendor-specific parsing concerns
(Phase 4 "Manual Import Bridge Bottleneck"). These are not strictly
contradictory (NotebookLM can be *one* producer among interchangeable
ones) but the documents' emphasis leans harder on NotebookLM-specific
integration than the philosophy statement implies is appropriate.

**Recommendation:** treat NotebookLM as one example producer only; V1
ships the vendor-agnostic structured-PLP-payload ingest pipeline (doc 09,
category A), not a NotebookLM-specific parser (category D).

**May Fable choose a reasonable default?** YES, per the above — but flag to
product owner that this is a deliberate de-prioritization of a
NotebookLM-specific integration in favor of the general contract.

---

### OD-8 — Are the newly-added item types (true/false battery, matching,
image-anchored) confirmed against real source material, or anticipated?

**Why it matters:** the FABLE prompts require supporting these types
because an old audit found source-book item forms with no PLP equivalent —
but no document confirms which specific V1 chapters actually need which of
these types.

**Latest phase by which it must be resolved:** before FABLE-03 builds
learner-facing UI for a type with zero real content needing it — building
UI for a type with no confirmed content is speculative.

**May Fable choose a reasonable default?** YES for building the
*extensible* type system (do this regardless); NO for which specific extra
types get real V1 content and UI polish — **ASK PRODUCT OWNER** which
chapters need which non-MCQ forms once source material is confirmed (ties
to OD-3).
