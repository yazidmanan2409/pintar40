# PINTAR

Calm on the surface. Rigorous underneath.

This repository is the ground-zero rebuild governed by the frozen PINTAR
Architecture Baseline (`docs/rebuild/00–16`) and executed in phases
`FABLE-01` … `FABLE-06`. The architecture documents are the controlling
contracts; this README is only orientation.

**The baseline in this repository is the source of truth** (ADR-0019). Every
baseline document is pinned by sha256 in `docs/rebuild/BASELINE-MANIFEST.json`
and checked by `npm run baseline:parity` and the `baseline-parity` CI job. A
baseline document changes only as a recognisable amendment: new bytes, a new
`baseline` identity, a matching in-document marker, and an ADR in the same
change. Build commentary never goes inside a frozen document — it goes in
`docs/implementation-notes/`.

## Layout

- `supabase/migrations/` — one linear, canonical migration history. Every
  migration ends with its own verification block. Never edited after
  application; corrections are new migrations.
- `supabase/seed/synthetic.sql` — persona harness seed for **synthetic
  tenants only**; refuses production and requires declared intent.
- `selftest/` — the versioned verification contract (`manifest.json`) and
  its runners.
- `docs/rebuild/` — the frozen Architecture Baseline, byte-pinned by
  `BASELINE-MANIFEST.json`. `fable-prompts/` — the phase prompts, pinned by the
  same manifest. Neither is edited casually; see ADR-0019.
- `docs/implementation-notes/` — build commentary *about* baseline documents,
  deliberately outside them.
- `docs/adr/` — architecture decision records (docs/rebuild/13 template).
- `src/` — Next.js App Router application. `src/proxy.ts` protects every
  authenticated route; authority is always the database's.

## Commands

- `npm ci` · `npm run lint` · `npx tsc --noEmit` · `npm run build`
- `npm run baseline:parity` — the frozen baseline is what it says it is
- Database selftest (against a reachable Postgres with the migrations and
  the synthetic seed applied): `psql "$SUPABASE_DB_URL" -f selftest/db/fable01.sql -c "select * from selftest.run_fable01()"`

## Status

See `docs/CHECKPOINT-FABLE-01.md`.
