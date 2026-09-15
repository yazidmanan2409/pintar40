# FABLE-06 — open questions and retroactive findings

Two sections. **Open questions** are real questions with product answers,
deliberately not resolved under end-of-phase pressure. **Retroactive findings**
are gaps in closed phases that a mechanism built later exposed — recorded here
so the capstone carries them rather than Layer-3 discovering them.

Accumulated as they are found, so the capstone folds in a ledger rather than a
recollection. **Nothing here is a defect report.** Each entry is a real question
with a product answer, deliberately not resolved under end-of-phase time
pressure, and each names who it belongs to.

---

# Retroactive findings

## RF-1 — six surfaces shipped with no output-level HLE coverage

**Found by:** F06-S02 (the derived route inventory) and F06-S03 (enum in a text
position), both built in FABLE-06. **Reaches back into:** FABLE-05 and Task 2,
both of which closed with a second-eye gate behind them.

**What was missing.** Every route under `/studio/*` plus `/evaluasi` had no
rendered-output `INTERNAL_WORDS` check — five FABLE-05 surfaces and one from
Task 2. The source scan (F01-S03) was green throughout, and it is blind to
`{x.status}` by construction: it matches JSX text nodes and deliberately skips
`{...}` expressions, with the comment *"enum comparisons in code are not user
copy."* That statement is correct about what it does. Reading it as a broader
guarantee was the error, and it was made by both reviewer and builder.

**What the closure documents actually claimed — read, not assumed.**

- **FABLE-05's completion report did not overclaim.** Its row for
  *"`studio.*` / `config.*` declared staff-only in the HLE"* is marked
  **reading — flagged**, and points at F05-S03 as asserting "the other half".
  The report was careful.
- **The overclaim was in the manifest.** F05-S03's `proves` line read *"no
  Studio copy shows a lifecycle enum, version string or evidence class"* —
  which reads as a property of the Studio **surface**. What it tests is the
  **copy table** in `src/lib/hle.ts`. A page interpolating an enum passes it.
  **Amended** to say what it tests.
- **Task 2's completion report claimed nothing** about surface-level HLE
  enforcement — only *"thirteen HLE strings"*, a count. So for `/evaluasi` the
  coverage was **absent and unremarked**, which is the more honest of the two
  states and still a gap.

**It was live, not latent.** F06-S03's first run found five real
interpolations: `{i.bank_type}` on the Studio bank page, `{b.mode}` and
`{d.mode}` three times on the definitions page, and `{g.category}` on the
integrity page — rendering `PRACTICE`, `PRE_TEST`, `POST_TEST`,
`VISIBILITY_CHANGE` raw to a staff reader. **None of those values is in
`INTERNAL_WORDS`**, so no word list would ever have caught them; the rule had to
be about shape and provenance instead. All five are fixed, and the enum-bearing
column list is derived from the migrations so a new enum column is covered the
day it is created.

**The property worth carrying forward:** the HLE guard operates on the
product's actual language, not only on enum identifiers — it refused the label
*"Salah paham yang berulang"* written during this phase because `Salah` is a
verdict-shaped word. That protects copy written in the UI/UX stream after this
build closes, and it is a property of the system rather than of this phase.

---

## OQ-1 — Exposure cooling meets the safety-critical minimum

**Belongs to:** Load Lab (Tim) · **Raised by:** the FABLE-06 draw measurement ·
**Not in FABLE-06 scope.**

Two rules that are individually correct meet in an `EXAM`-bank context:

- `assemble_session` fills **safety-critical items first**, and
  `safety_critical_minimum` guarantees at least one per session — measured, and
  the reason two D1 items were presented 102 and 98 times out of 160 while the
  other ten fell between 64 and 83.
- `exam_item_is_cooled` excludes an item presented to the same cohort inside the
  institution's `cooling_days` window — and applies **only to `bank_type =
  'EXAM'`**, which is why the FABLE-06 fixture never met it: D1's bank is `TEST`.

**The question.** Safety-critical items are the ones cooling reaches first,
*precisely because* the minimum guarantees they are presented. With a bank thin
in the safety-critical dimension, can cooling exclude enough of them that
`assemble_session` cannot satisfy `safety_critical_minimum`? And if so, **which
rule yields** — does it present a cooled item, or assemble a session without the
safety guarantee?

**Why it is not answered here.** It needs a bank deliberately thin in the
safety-critical dimension to trigger, which a load laboratory constructs on
purpose and a fixture cannot stumble into. Reading the code for an answer at the
end of a phase would produce a confident sentence and no evidence — and this
project has lost rounds to exactly that. `assemble_session` does raise when the
bank cannot supply enough drawable safety-critical items, so a refusal is one
plausible behaviour; **whether that is what happens under cooling specifically
has not been measured and is not claimed here.**

**What would settle it:** an EXAM-bank institution with a cooling policy set, a
safety-critical pool small relative to cohort size, and enough repeated cohort
sessions to drive cooling across it.

---

## OQ-2 — Per-edge Question Health audit volume at institution scale

**Belongs to:** Load Lab (Tim) · **Raised by:** 0077's per-edge audit decision.

A first recompute writes at least one `audit_log` row per item, and up to two
per item that moves. Bounded in steady state by the Q4 guarantee — a rerun over
unchanged evidence writes nothing — but **unbounded on first run at institution
scale**. At D1's twelve items this is nothing. On a real bank it is a number
worth having before someone finds it.
