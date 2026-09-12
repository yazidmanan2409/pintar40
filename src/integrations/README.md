# `integrations/` — integration boundary (reserved)

Reserved in FABLE-01 §10 as a named module boundary. Empty by design: no
code, no adapters, no third-party clients live here yet.

Everything that later connects PINTAR to an outside system (institution
information systems, learning-record exports, identity providers, messaging)
enters through this boundary and nowhere else. Domain code never imports a
vendor SDK directly.

Rules that already apply:
- Nothing under `src/app` or `src/lib` may import from here until a phase
  prompt opens the boundary.
- Any first adapter is an ADR (doc 13: new abstraction with fewer than two
  callers) and a doc 09 scope-category decision.
