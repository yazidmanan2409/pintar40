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
| STAFF | `record_question_health_review` | **(3) → (2) in the Question Health migration** | needs a `question_health` row at `SIGNAL_RAISED`. There are **0 rows** today, so no success path exists to execute. The computation creates the first, which makes this reachable |
| STAFF | `transfer_reject` | **(2) reachable, never exercised** | `transfer_request`, `transfer_authorize` and `transfer_execute` each run once; the refusal branch never does |

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

## Disposition

The twelve outcome-(2) functions belong to FABLE-03, -04 and -05 by subject, and
FABLE-06 §7 item 8 is the clause that makes them this phase's problem: *"Every
checklist item from Phases 1–5 is in the manifest. If any was verified by hand
and never added, add it now."* They are carried into the state-of-the-system
document by name, as `NOT YET VERIFIED`, with this table as the evidence.
