# First-login tour — backend persistence contract

**Migration:** `20260922090000_tour_state_follows_the_person.sql` (0089).
**Tests:** `TOUR-P01`, `TOUR-N01`, `TOUR-N02`, `TOUR-N03` in `selftest/db/fable06.sql`.
**Red cases:** `db-tour-gates` in `.github/workflows/ci.yml` — eight planted defects.

This is the backend half only. **No tour UI, no Help surface, no anchors and no
learner-stage inference are part of it.**

## What the backend answers

One question: *should this declared tour, at its current declared version, still
be presented automatically to the person holding this session?*

Everything else — which tour applies to whom, what it says, when it is replayed
from Help — stays with Experience.

## The four client-callable functions

All are `LEARNER` exposure, `SECURITY DEFINER`, `search_path` pinned, granted to
`authenticated` and `service_role`. **None takes a person; the person is the
session.** Passing an identity is not merely refused — there is no parameter for
it.

| Function | Returns | Notes |
|---|---|---|
| `my_tour_state(p_tour_key text)` | `tour_key, tour_version, should_auto_present, auto_shown_count, auto_presentation_limit, completed, suppressed, last_shown_at` | `STABLE`. Returns a row for a declared tour whether or not the person has ever met it. Zero rows for an undeclared tour. |
| `note_tour_presented(p_tour_key text)` | `smallint` — the new count | Records **one automatic presentation**. A no-op once completed, suppressed, or at the limit. |
| `complete_tour(p_tour_key text)` | `timestamptz` | Idempotent; keeps the **first** completion instant. |
| `suppress_tour(p_tour_key text)` | `timestamptz` | "Don't show this tour again." Idempotent. |

`should_auto_present` is the only value the frontend needs in order to decide.
It is already the conjunction of every rule; do not re-derive it client-side.

### Skip is not a call

Skipping is the **absence** of `complete_tour` and of `suppress_tour`. The
presentation was already counted when it was presented. A skipped tour is
offered again until the third presentation is spent.

### Deliberate replay is not a call either

Replay from Help is a pure frontend act over a tour the person already has. It
needs nothing from this contract, and there is deliberately nothing to call:
no `reset_tour`, `replay_tour`, `clear_tour_state` or `forget_tour` exists.
Calling `note_tour_presented` during a replay by mistake is harmless — it is a
no-op once the tour is completed or suppressed.

## Declared tours

`public.tour_registry` is a contract table written **only by migration**. No
client role holds any write grant and there is no non-`SELECT` policy.

| `tour_key` | `tour_version` | `auto_presentation_limit` |
|---|---:|---:|
| `learner.first_login` | 1 | 3 |
| `educator.first_login` | 1 | 3 |

`auto_presentation_limit` carries a `CHECK (between 1 and 3)`, so no tour can
ever declare more than the ruled three.

**A materially new tour is a new registry row, in a new migration.** Nothing
derives a version from a deployment, a commit, a changed-file count, a
translation or a copy edit; there is nowhere for such a value to enter. The
current version of a tour is the greatest declared one.

**Head-of-department, dean, institution-admin and system-admin tours are not
declared.** Those Experience surfaces do not exist yet.

## No role inheritance

`tour_key` is opaque to the backend. Nothing here maps a role to a tour, so a
DEAN cannot inherit the educator tour — not by rule, but because there is
nowhere to express it. A person who holds both surfaces meets both tours, each
tracked separately.

## First login

"Never automatically presented" is the **absence of a `person_tour_state` row**.
`accounts.created_at` is not read and no last-login tracking exists.

## Learner stage

Per the product ruling, **no learner-stage field was added** and nothing infers
stage from `course.stage` or any other proxy. The frontend uses its
stage-neutral fallback.

## What this state is not

Tour state is presentation state. It is not learning evidence, assessment
evidence, progress, a scoring input, certificate evidence, an integrity signal
or educational telemetry. `public.assert_tour_state_is_not_evidence()` re-derives
that against the live schema on every run, and `F06-P08` executes it.

No audit row is written for any tour event. INV-18 lists the acts that must be
accountable and being shown a tour is not one of them.

## Authorization

- RLS on both tables; `person_tour_state` has exactly one policy —
  `SELECT` where `person_id = current_person_id()`.
- No client role holds `INSERT`, `UPDATE` or `DELETE` on either table, and no
  policy exists for those commands.
- Every write arrives through the definer functions, which run as the schema
  owner — where RLS does **not** bind, because `relforcerowsecurity` is false on
  every public table by design. The authority is therefore the trigger
  `enforce_tour_state_write()`, which **derives** `person_id` from
  `current_person_id()` rather than trusting the row, refuses `DELETE`, holds
  `auto_shown_count` monotonic, and refuses to clear `completed_at` or
  `suppressed_at` once set.

## Terminology landed alongside this work

`20260922100000` (0090) changes the **generated** quick-assessment title from
`Kuis Cepat — <stamp>` to `Uji Cepat — <stamp>`, per the ruling ID *Uji Cepat* /
EN *Quick Assessment*. Forward-only: existing definitions keep the title they
were created with. Frontend copy is **not** touched — see the residual below.
