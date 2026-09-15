# FABLE-06 — open questions carried out of the phase

Accumulated as they are found, so the capstone folds in a ledger rather than a
recollection. **Nothing here is a defect report.** Each entry is a real question
with a product answer, deliberately not resolved under end-of-phase time
pressure, and each names who it belongs to.

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
