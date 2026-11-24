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

**The server needs pg_cron** (since A1, `20270114110000` creates it), with
`shared_preload_libraries = 'pg_cron'` and `cron.database_name` set to the
name of the database being built (`pintar_golden_<fingerprint>_building`).
pg_cron can be created only in that one database. If either is missing,
`golden-db.sh` stops before the replay and prints the exact name to set. The
clones never run a scheduled job; once the build is renamed, the scheduler no
longer finds a database by that name.

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

## The machine before the code (ruling 83)

An expensive run starts with the readiness gate and runs under a heartbeat, so a machine failure is reported as the
machine's and never as a red row. The proofs are in `docs/completion-4.1/infra-83/BUKTI.md`.

```bash
scripts/dev/siap.sh                 # READY, or one named cause: INFRA disk|runtime|image|registry|stack|port
scripts/dev/siap.sh --tanpa-pulih   # the same checks, changing nothing
scripts/dev/bersih.sh               # dry run: what the harness left in $TMPDIR, and what it keeps and why
scripts/dev/bersih.sh --hapus       # remove it (never docs/, z-evidence/, the checkout, or a name no harness file creates)
scripts/dev/preflight.sh            # lint, typecheck, build-identity, suite, plants, red-case: GREEN, RED or VOID
```

- `siap.sh` recovers what it can: it restarts containerd and dockerd, pulls a missing image **by the digest in
  `images.lock`** with backoff, starts the stack and the Mailpit sink, and stops a leaked app server on :3999.
- `preflight.sh` forces `supabase db reset --local` before the suite and the plants. Every `PREFLIGHT_DENYUT` seconds
  (default 120) it runs `siap.sh --denyut` (disk, runtime, database). The first lost heartbeat stops the run.
- Every step and every suite row is classed PASS, FAIL (the code) or INFRA (the machine, with its signal), by
  `kelas.sh`. Any FAIL makes the run RED, with INFRA rows listed beside it. VOID (not evidence either way) only when an
  INFRA row exists and nothing failed. A signal code can produce counts as INFRA only on an unhealthy machine. Every
  run is kept under `$HOME/pintar-preflight/`, with the machine trace `jejak-mesin.log`.
- `tapis.sh` strips keys from anything the gate writes. `preflight.sh --ukur` estimates a run against the machine's
  measured uptime, and warns when it won't fit.
- A CLI upgrade that changes an image tag updates `images.lock` in the same commit.
