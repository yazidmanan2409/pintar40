# `care/` — PINTAR Care boundary (reserved)

Reserved in FABLE-01 §10 as a named module boundary. Empty by design.

PINTAR Care is the learner-wellbeing / duty-of-care surface described in the
Architecture Baseline (doc 09 FOUNDATION NOW). It is not built in FABLE-01
and no placeholder behaviour is faked here. When a phase prompt opens this
boundary, its data is tenant-scoped and audited like every other table
(INV-13, INV-18), and its learner-facing copy passes through the Human
Language Engine (`src/lib/hle.ts`).
