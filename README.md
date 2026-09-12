# PINTAR

Calm on the surface. Rigorous underneath.

This repository is the ground-zero rebuild governed by the frozen PINTAR
Architecture Baseline (`docs/rebuild/01–16`, kept in the PINTAR project) and
executed in phases `FABLE-01` … `FABLE-06`. The architecture documents are
the controlling contracts; this README is only orientation.

## Layout

- `supabase/migrations/` — one linear, canonical migration history. Every
  migration ends with its own verification block. Never edited after
  application; corrections are new migrations.
- `supabase/seed/synthetic.sql` — persona harness seed for **synthetic
  tenants only**; refuses production and requires declared intent.
- `selftest/` — the versioned verification contract (`manifest.json`) and
  its runners.
- `docs/adr/` — architecture decision records (docs/rebuild/13 template).
- `src/` — Next.js App Router application. `src/proxy.ts` protects every
  authenticated route; authority is always the database's.

## Commands

- `npm ci` · `npm run lint` · `npx tsc --noEmit` · `npm run build`
- Database selftest (against a reachable Postgres with the migrations and
  the synthetic seed applied): `psql "$SUPABASE_DB_URL" -f selftest/db/fable01.sql -c "select * from selftest.run_fable01()"`

## Status

See `docs/CHECKPOINT-FABLE-01.md`.
