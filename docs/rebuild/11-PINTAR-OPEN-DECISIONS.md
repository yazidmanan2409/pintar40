# 11 — PINTAR Open Decisions

*Baseline amendment (2026-09-12): OD-2 and OD-7 RESOLVED; OD-4 reframed
(learner Transfer is now a required domain capability distinct from content
sharing); OD-6 resolved as PARK; OD-5 narrowed (architecture resolved,
legal durations still open); OD-8 narrowed; OD-9 and OD-10 added. Resolved
items are kept here as a record with their resolution — they are not
reopened by silence.*

Unresolved questions found across the project's full history, including
contradictions between documents. None of these are silently resolved here.
Only genuine business/legal/product decisions remain open; implementation
details that can be decided safely during engineering are not listed.

---

### OD-1 — What accreditation framework should the Institutional Learning Intelligence report actually encode? — **OPEN**

**Why it matters:** the old comprehensive handoff references "LAM-PTKes
2024 alignment" in one place as if settled, but no document explains why
that specific framework or confirms it's still the target for PINTAR 4.0's
university-course tenant.

**Latest phase by which it must be resolved:** before the phase that ships
the Institutional Standard Report's accreditation shape.

**Options:** (a) LAM-PTKes 2024 as before, (b) a different/updated
framework, (c) a generic competency-report shape with the framework as
configuration, not hardcoded.

**Recommendation:** (c) — the Canonical Metric Catalogue and Standard
Reports (doc 02) already give the generic shape; bind a specific framework
by configuration later.

**May Fable choose a reasonable default?** NO — **MUST ASK PRODUCT OWNER**
which framework(s) are actually in scope for the university course tenant.

---

### OD-2 — Do pre-test and post-test share any items, ever? — **RESOLVED (baseline)**

**Resolution:** ZERO identical-item overlap and ZERO `parallel_group`
sibling overlap for the standard Dr. Gladys cycle (INV-24, doc 04 §6, doc
07). Any future controlled-overlap anchor design is a distinct, explicit
assessment mode (doc 09, LATER) and never a relaxation of the invariant.
The earlier "configurable, default zero" recommendation is withdrawn.

---

### OD-3 — What source books/editions ground the V1 content? — **OPEN**

**Why it matters:** the domain model requires page-precise Source/
SourceVersion citations; no document names the actual textbook
editions/ISBNs to author against for a ground-zero content build.

**Latest phase by which it must be resolved:** before any real content
authoring begins — placeholder/fixture content can proceed without this,
real content cannot.

**May Fable choose a reasonable default?** NO — **MUST ASK PRODUCT OWNER.**
Never invent a source citation.

---

### OD-4 — Cross-institution content sharing/licensing — **REFRAMED; remains LATER**

**Resolution of the confusion:** *learner Transfer* (a learner's portable
record following them from School B to School C) is a **required BUILD NOW
domain capability** (doc 02, doc 04 §3c, INV-25) and is not the same thing
as *institution-to-institution content sharing/licensing*, which stays
LATER (doc 09). The two must never be conflated in schema or UI.

**Still open (product):** whether a specific near-term multi-institution
content customer exists. **May Fable choose a reasonable default?** YES —
keep content sharing LATER; flag to the product owner once a second real
institution wants shared content.

---

### OD-5 — Retention policy for identifiable learner evidence — **ARCHITECTURE RESOLVED; LEGAL DURATIONS OPEN**

**Resolved:** the architecture supports institution-configurable retention
windows within applicable governance/legal requirements; identifiable
evidence is distinguished from derived/anonymized legitimate aggregate
analytics; anonymization keeps the evidentiary shape so derived statistical
history survives (doc 06). Certificates keep their identity snapshot.

**Open:** the actual durations and the anonymize-vs-delete choice per
record class under Indonesian PDP law and any institutional policy. **PINTAR
must not invent legal retention periods.**

**Latest phase by which it must be resolved:** before the retention job is
enabled for any real institution (the schema does not need the answer).

**May Fable choose a reasonable default?** NO — **MUST ASK PRODUCT OWNER /
legal.**

---

### OD-6 — Physical/NFC credential card — **RESOLVED: PARK**

**Resolution:** parked (doc 09, PARK; doc 10). The A4 printable certificate
is BUILD NOW. Reconsider only by an explicit product-owner decision recorded
as an ADR.

---

### OD-7 — "Single canonical AI-agnostic PLP format" vs "NotebookLM as *the* Content Factory" — **RESOLVED (baseline)**

**Resolution:** NotebookLM (and Claude, Gemini, OpenAI or any other tool)
is an **external producer only**. PINTAR owns the canonical content model
and vendor-neutral ingestion (Easy Upload and Structured Package Import —
doc 02); no producer's concepts enter the domain model (INV-32); no
producer-specific parser is built (doc 09, PARK). AI capabilities are
reached only through the AI Provider Gateway.

---

### OD-8 — Which non-MCQ item types need real V1 content and UI polish? — **NARROWED; OPEN**

**Resolved:** the item-type registry is extensible and source-reflective
(doc 02, doc 07) and is built regardless; every type is served by the one
engine.

**Open:** which specific V1 chapters actually need true/false battery,
matching, image-anchored or other forms — contingent on OD-3.

**May Fable choose a reasonable default?** YES for the registry; NO for
which types get real content and polish — **ASK PRODUCT OWNER** once source
material is confirmed.

---

### OD-9 — Transfer authorization and consent model — **OPEN (business/legal)**

**Why it matters:** the Transfer lifecycle (doc 04 §3c) records both
institutions and "any consent the policy requires." Who must authorize a
transfer (sending institution, receiving institution, both), whether and
when the learner or a guardian must consent, and what applies when the
sending institution is unresponsive or no longer a PINTAR customer are
policy/legal questions, not engineering defaults. The architecture supports
any of these answers.

**Latest phase by which it must be resolved:** before the Transfer workflow
is exposed to real institutions (the domain model and lifecycle can be
built first).

**May Fable choose a reasonable default?** NO for the policy — **MUST ASK
PRODUCT OWNER.** YES for building the lifecycle with policy as
configuration.

---

### OD-10 — What the Certificate Identity Snapshot presents — **OPEN (product)**

**Why it matters:** the snapshot mechanism is settled (INV-30). Whether the
printed/verified certificate shows a photo at all, which name form is used,
and which mutable profile fields (if any) an institution may allow a
learner to change after issuance are product/policy choices with privacy
weight.

**Latest phase by which it must be resolved:** before the certificate
template is finalized for the first real institution.

**May Fable choose a reasonable default?** YES for the mechanism (snapshot
name + optional photo hash); NO for the presentation policy — **ASK
PRODUCT OWNER.**

---

### OD-11 — Is the Mini-PINTAR public trial part of the first release? — **OPEN (product scope)**

**Why it matters:** the baseline puts Mini-PINTAR *isolation* (PUBLIC_DEMO
mode and evidence class, reuse of the renderer/engine/question model/
content releases) in FOUNDATION NOW (doc 09), because the strategic review
lists it there. Whether a public-facing Mini-PINTAR experience itself ships
in the first release — and with which content — is not stated in any
source document read. The architecture supports either answer; the 100k
anonymous-session stress scenario (readiness report, G-13) is answered at
the architecture level regardless.

**Latest phase by which it must be resolved:** before any public surface
beyond certificate verification is built.

**May Fable choose a reasonable default?** YES — default to FOUNDATION NOW
only (no public trial UI) until the product owner moves it to BUILD NOW.
