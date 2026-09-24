# Development loop

The full manifest is a **completion gate**, not the inner loop. These four
tools exist so that iterating on one function does not cost a clean-room
rebuild and a 266-test run.

```
implement → targeted tests → iterate → local candidate → full regression once → CI once
```

## A disposable world in half a second

```bash
npm run db:golden                  # build the migrated + seeded baseline once (~40s)
npm run db:clone -- scratch        # clone it                                  (~0.5s)
npm run db:status                  # what exists, and the fingerprint it was built from
```

The golden database's name carries a fingerprint of the migration set, the
seed set and `supabase-shape.sql`. Change any of them and the next `ensure`
builds a new golden, so a stale baseline cannot be handed out silently.

It holds **migrations and seeds only** — editing a selftest suite does not
invalidate it.

It is **not** clean-install evidence. CI's `migrations · clean database +
seed` against a real Supabase stack remains the authoritative gate;
`golden-db.sh rebuild` replays from empty locally when you want the same
check nearby.

## Targeted tests

```bash
export SUPABASE_DB_URL=$(npm run --silent db:clone -- scratch)
npm run selftest:only -- F07-P14,F07-P15      # ids
npm run selftest:only -- 'F04-*'              # a whole suite
npm run selftest                              # the completion gate
```

A targeted run defines every suite file — each assumes the helpers the ones
before it install — but **executes only the suites that own the requested
ids**. A pattern that names no manifest id is a contract failure, so a typo
cannot look like a green run.

A db suite runs as one unit, so the suites that own your ids report all of
their rows. That is deliberate: a red sibling in the same suite is something
you want to see.

## Plants

```bash
npm run plants -- list --gate=db-wp7-gates
npm run plants -- run  --gate=db-wp7-gates --db-url=...
npm run plants -- run  --gate=db-wp7-gates wp7d-4 --db-url=...   # just one
```

Defects live in `selftest/plants/*.sql`, declared once in
`selftest/plants/plants.json`, and **CI runs this same harness** — the
workflow no longer carries its own copy of the SQL. Every plant must prove
four things or it is reported as failed: the mutation landed (the schema
digest moves), the named test went red, it went red for the declared reason,
and the rollback put everything back. A plant that crashes the suite is not a
successful plant.

## Reachability preflight

```bash
npm run preflight:rpc -- --db-url=... --rpc=open_feedback_cycle
npm run preflight:rpc -- --db-url=... --exposure=STAFF --strict
```

`authorized actor → RPC → required arguments → governed source for each`,
checked against the function catalogue and `client_rpc_registry`. Run it
**before** building a surface: an identity-bearing argument with no governed
source is WP7D happening again.

It is a development-time cross-check. Nothing reads
`selftest/reachability.json` at runtime and it grants nothing.
