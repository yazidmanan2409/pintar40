# Happy-path sweep — the client RPC surface, 2026-09-15

**Measured, not read.** Method and caveats in `docs/audit/happy-path-sweep.sql`.
Database: clean replay of all 73 migrations, all four seeds, full `selftest:db`,
with `track_functions='all'` set **before** the replay so migration terminal
blocks count.

**Result: 69 of 82 registered client RPCs have executed to a successful return.
13 have not.** Measured at `track_functions = all`, commit `07a08e7`.

**The `track_functions` value is load-bearing and must be stated with the
number.** The setting has three values, and **`pl` tracks only
procedural-language functions**. Twelve registry entries are `language sql`,
three of them authorization-shaped — `authorized_canonical_items`,
`may_read_lesson_media`, `session_is_mine`. At `pl` all twelve would report zero
whether or not they ran, and the 13 would be worthless. This sweep ran at
`all`, confirmed by `show track_functions` in the measuring session.

**Planner inlining — checked, and it does not apply here.** A plain SQL function
can be inlined into the calling plan and then never counted. Every function in
`client_rpc_registry` is `SECURITY DEFINER`, and SECURITY DEFINER functions are
never inlined. The hazard is real in general and absent from this registry.

## Why this was done

`metric_evaluate` shipped in 0072 unable to compute anything — the dispatch built
the calculator name without the `calc_` prefix. Its verification block had four
probes and all four passed, because all four were refusals and guards sit before
the work. The question this sweep answers is whether 0072 was unusual. **It was
not the only one.**

## The thirteen

`pg_stat_user_functions.calls` counts only calls that returned, so each of these
has never completed successfully under any migration, seed or test in this build.

| exposure | function | classification | why |
|---|---|---|---|
| LEARNER | `dismiss_assistance` | **(2) reachable, never exercised** | `open_assistance` is exercised 18×; the dismissal half never is |
| LEARNER | `may_read_lesson_media` | **(2) reachable, never exercised** | needs a storage path; the suite never asks for one |
| LEARNER | `my_certificate` | **(2) reachable, never exercised** | certificates are issued and verified by fable04, but never fetched by their owner |
| LEARNER | `my_cycle_state` | **(2) reachable, never exercised** | the cycle is driven end to end; this read of it is not |
| LEARNER | `pause_session` | **(2) reachable, never exercised** | pause/resume is a whole lifecycle branch with no success path |
| LEARNER | `resume_session` | **(2) reachable, never exercised** | as above |
| LEARNER | `sanitized_item` | **CLOSED — now (1)** | **the learner-facing item projection.** Migration 0074 and `F06-P01` close it: the probe executes it to a successful return and asserts the item's real rationale text appears nowhere in the output. Read in full first and found correct; the finding was that nothing said so |
| LEARNER | `session_state` | **(2) reachable, never exercised** | `may_continue_session` runs 98×; this sibling read never returns |
| PLATFORM | `mode_policy` | **(2) reachable, never exercised** | a pure lookup; `assert_mode_policy_complete` asserts the table, never the accessor |
| STAFF | `ingest_structured_package` | **(2) reachable, never exercised** | `propose_easy_upload_mapping` runs once; the ingest it precedes does not |
| STAFF | `record_integrity_review` | **(2) reachable, never exercised** | signals are recorded 2×; the human review of one never is |
| STAFF | `record_question_health_review` | **MOVED (3) → (2), 2026-09-15** | needed a `question_health` row at `SIGNAL_RAISED`; there were **0 rows** and no success path existed to execute. Migration 0076's computation creates the first, so the human review path is now reachable and the entry is an ordinary never-exercised finding rather than an unreachable one. **Still never executed** — reaching (1) needs a suite probe |
| STAFF | `transfer_reject` | **(2) reachable, never exercised** | `transfer_request`, `transfer_authorize` and `transfer_execute` each run once; the refusal branch never does |

**A correction to the review that prompted this sweep**, recorded because it was
repeated into a migration header before being checked: the review reported all
seven `item_type_registry` rows as carrying the same four keys, so the sanitizer
allowlist "narrows nothing". **`NUMERIC` carries three** — `item_type`, `stem`,
`stimulus` — and withholds `opsi`. The allowlist is live. That strengthens the
case for constraining it rather than weakening it, so the error understated its
own argument.

**Twelve are outcome (2)** — reachable in the verification environment and simply
never exercised. Each is a function that could be as broken as `metric_evaluate`
was and nothing would say so.

**One is outcome (3)** — `record_question_health_review` has no success path to
execute because the lifecycle it reviews has never produced a row. 0074 changes
that, and it is the reason the sweep is worth doing before 0074 rather than after.

## What this does *not* say

- **Not that these twelve are broken.** It says nothing about them either way.
  That is the point: they are unverified, and an unverified function carrying a
  green suite is `DESIGNED-NOT-IMPLEMENTED` wearing a `VERIFIED` label.
- **Not a standing CI gate.** This is a measurement with a reproducible script,
  run once. Making it a gate needs `track_functions` on in CI and a
  stats-ordering discipline the suite does not currently have. Recorded as a
  candidate, not claimed as built.
- **Not a complete picture of the application surface.** It measures database
  functions. A Next.js route that is never requested is invisible here.

## Changes since the measurement

Recorded as they happen rather than recomputed at the end, so the gate sees a
live ledger instead of a second snapshot.

| date | function | change |
|---|---|---|
| 2026-09-15 | `sanitized_item` | **(2) → (1).** Migration 0074 and `F06-P01`: executed to a successful return, asserting the item's real option rationale is absent from the projection |
| 2026-09-15 | `record_question_health_review` | **(3) → (2).** Migration 0076 creates the first `question_health` rows, so a success path now exists to execute. Not yet exercised |

| 2026-09-15 | `mode_policy` | **(2) → (1).** `F06-N02` uses it as the read half of the INV-19 assertion — a dean must read successfully through the session that is refused every write |
| 2026-09-15 | `review_briefing`, `advance_briefing`, `open_briefing`, `metric_evaluate`, `generate_report`, `current_metric_catalogue`, `recompute_question_health` | **new, and executed.** Every RPC this phase added has an executed success path; `review_briefing` was briefly not, and `F06-P07` closed it |
| 2026-09-15 | `record_question_health_review` | **(2) → (1).** `F06-P07`: a reviewer moves a raised signal to `UNDER_REVIEW`. It was outcome (3) — unreachable — until this phase produced the first `question_health` row |

**RE-MEASURED at the FABLE-06 close: 76 of 86 registered client RPCs have an
executed success path; 10 have not.** Method unchanged — `track_functions = all`
set before the replay, all four seeds, full `selftest:local`. The registry grew
82 → 86 because this phase added RPCs; all of them execute.

**A premise worth correcting, because it was checked rather than taken.** It was
suggested that 0075's `search_path` pin made the sixteen calculators
non-inlinable and therefore countable for the first time, which would have made
the earlier figure unreliable. **It does not apply here:** the calculators are
not in `client_rpc_registry` at all (they carry no client grant, deliberately),
and all 86 registry functions are `SECURITY DEFINER`, which PostgreSQL never
inlines regardless of `SET` clauses. The earlier figure was sound; the re-measure
was due because the registry grew and new tests execute new paths, not because
the old number was wrong.

**The ten that remain** — all pre-FABLE-06, none of them this phase's:
`dismiss_assistance`, `ingest_structured_package`, `may_read_lesson_media`,
`my_certificate`, `my_cycle_state`, `pause_session`, `record_integrity_review`,
`resume_session`, `session_state`, `transfer_reject`.

## Disposition

The twelve outcome-(2) functions belong to FABLE-03, -04 and -05 by subject, and
FABLE-06 §7 item 8 is the clause that makes them this phase's problem: *"Every
checklist item from Phases 1–5 is in the manifest. If any was verified by hand
and never added, add it now."* They are carried into the state-of-the-system
document by name, as `NOT YET VERIFIED`, with this table as the evidence.
