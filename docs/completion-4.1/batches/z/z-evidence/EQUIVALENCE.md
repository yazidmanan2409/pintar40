# Z9 · the local pre-flight and ci.yml, component by component (stream A; ruling 86 item 4)

**For Sharon's equivalence confirmation** (via Bob).

- **The candidate:** claude/z **7615d6b1**, unchanged.
- **The local pre-flight:** `scratchpad/preflight.sh`. Its last GREEN run was on f5700bd1 (`preflight-f5700bd1/SUMMARY.txt`).
- **ci.yml:** the workflow as it stands on 7615d6b1. Every number below was read from those files and from CI 45244823300 attempt 1 on f5700bd1, the last full strict run.

## Component map

| Local pre-flight component | Local count (f5700bd1, GREEN) | The ci.yml job that covers it | CI count | Same or stricter? |
|---|---|---|---|---|
| `npm run lint` | rc 0 | `check`: `npm run lint` | rc 0 | same command |
| `npm run typecheck` (tsc) | rc 0 | `check`: `npm run typecheck` | rc 0 | same command |
| `npm run -s selftest:build-identity` | 11 pass / 0 fail | `check`: `npm run -s selftest:build-identity` | 11 / 0 | same command |
| Production build | `npm run build` inside the suite (stack env) | `check`: `npm run build` (placeholder env), **and** the `selftest` job builds again against its stack (the selftest owns the build and verifies its fingerprint) | — | stricter: built twice |
| **The whole manifest** (`full-suite.sh`: fresh `supabase db reset`, Mailpit sink, build, `next start` on :3999, **db + static + app runners**) | 1389 ids: **1388 pass**, 0 fail, **1 justified skip** (F01-R04, «facility missing: ci») | `selftest`: `./.github/actions/local-stack` (fresh reset, same `-x` exclusions), the same Mailpit image and flags, and the same env values; `npm run selftest` **strict** (no `--accept-justified-skips`), with the app runner on :3999 | 1389 ids. F01-R04 **runs** and passed on f5700bd1. On f5700bd1: 1386 pass + 3 fail (the C3W world, root cause and fix in `ci-diag/`) | stricter: no skips at all |
| **Planted defects** (`node scripts/dev/plants.mjs run`: every declaration in `selftest/plants/plants.json`, the same four proofs each) | **175/175** | `red-case`: each db group runs `node scripts/dev/plants.mjs run --gate=<gate>` for its gates. The 21 gates of plants.json are all present in ci.yml, and together they hold all **175** declarations | 175 | same harness and declarations. CI runs each gate on its own fresh stack. It also runs the inline SQL plants (FABLE-04/05 and others) that `plants.mjs` does not hold |
| **Red-case groups** (`node scripts/dev/redcase-local.mjs`, which reads ci.yml's `red-case` matrix itself) | **11/11** | `red-case`: the same 11 matrix groups (5 static, `db-table-without-rls`, and 5 db groups; CI-W02 keeps the 30 cases in exactly one group each) | 11 jobs | same definition: the local runner is a copy of these jobs |
| — (not in the local pre-flight) | — | `migrations-clean`: every migration on a clean database plus the seed; the recorded history must equal the repository's | — | CI only (extra) |
| — | — | `migrations-upgrade-path`: the previous schema → HEAD | — | CI only (extra) |
| — | — | `baseline-parity`: the frozen documents match BASELINE-MANIFEST.json | — | CI only (extra) |
| — | — | `verdict`: green only when every job ran and succeeded | — | CI only (extra) |

**Journeys** are not part of either: `audit-journeys.yml` runs once, separately, as before.

## Counts, reconciled

**«1386 vs 1388» is not a gap.**

- Both runs have the same 1389 manifest ids, and the manifest holds 1389 entries on 7615d6b1 too.
- Locally: 1388 pass + 1 justified skip.
- CI: 1386 pass + 3 fail. The one id locally skipped, F01-R04, runs in CI and passed there. It reads the upstream job results that exist only inside a CI run.
- With C3W-C32/C36/C310 fixed (367ff569), a green strict run is 1389 / 0 / 0.

## Gaps

**No component of the local pre-flight is missing from ci.yml.** Every local count has a CI job that runs the same code under the same or stricter conditions.

**Differences that are not gaps:**

1. CI runs each plant gate on its own fresh stack; locally they run against one. CI is the more isolated of the two.
2. CI's runner has 4 CPUs. Timing-dependent tests see a different schedule there. That is exactly how the C3W selection's 1-in-10 chance showed itself, and it is why the fix is deterministic rather than lucky.
3. The local run accepts the one justified skip (F01-R04); CI accepts none.

**So no separate group is needed under ruling 86's gap clause.**

## Since the last GREEN local run

The diff f5700bd1..7615d6b1 outside `docs/` is test-only, two files:

- `audit/journey.mjs`: the journey locators (c4c8f792);
- `selftest/c3w-c3.test.ts`: the C3W world's draft selection and its empty-setting guard (367ff569).

No product code, migration, manifest entry or plant changed.
