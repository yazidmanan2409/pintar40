# 06 — PINTAR Evidence & Telemetry Contract

PINTAR's entire premise is trustworthy evidence. This contract is
authoritative over any single implementation's event names.

## Categories (every event belongs to exactly one)

1. **Source-of-truth learning evidence** — the raw fact of what happened;
   never recomputed away, never silently regenerated.
2. **Scoring evidence** — a subset of (1) that scoring functions read.
3. **Learning telemetry** — timing/interaction signals that inform
   analytics and item design but must never influence scoring (hesitation,
   assistance).
4. **Security/audit evidence** — who did what, for accountability.
5. **Analytical derivations** — computed from (1)/(2)/(3); always
   recomputable; never itself treated as source-of-truth.
6. **Psychometric derivations** — item-difficulty/misconception aggregates
   computed from (1)/(2), gated by minimum sample size; same
   non-authoritative status as (5).

A derivation (5 or 6) must never become "the" record once no raw evidence
backs it — if the underlying responses are ever purged, the derivation is
invalidated, not preserved as if it were still true.

## Event contract

For every event: name, meaning, exact moment, authoritative timestamp
source, required identifiers, session/release context, immutability,
scoring influence, diagnosis influence, analytics eligibility, psychometric
eligibility, privacy note.

| Event | Meaning | Moment | Category | Scoring? | Immutable? | Notes |
|---|---|---|---|---|---|---|
| `session_started` | Learner begins an Assessment Session | Session row created, server clock | (1) | No | Yes | Carries `plp_release_id`/blueprint id |
| `item_presented` | An item is shown to a session at a position | Server issues the item to the client | (1) | No (informs exposure/cooling) | Yes | Required for INV-12 cooling enforcement |
| `response_selected` | Learner picks/changes an answer, not yet submitted | Client event, server timestamp on receipt | (3)/(1) hybrid — the *fact* of a change is evidence; the *timing* is telemetry | No | Append-only (each change is its own row, not an overwrite) if the blueprint allows changes; else this event doesn't exist |
| `response_submitted` | Final answer for one item locked | Server receipt | (1)/(2) | **Yes** | Yes | This is what scoring reads |
| `response_duration_ms` | Time spent on the item before submission | Computed server-side from `item_presented`→`response_submitted` timestamps | (3) | No | Yes (derived once, stored) | Used for psychometrics, not scoring |
| `hesitation_threshold_reached` | Inactivity window elapsed with no selection | Server-side timer, evaluated server-side not client-side | (3) | **No — never** | Yes | INV-11 |
| `assistance_offered` | The inline pill is shown | Immediately following the above | (3) | **No — never** | Yes | |
| `assistance_opened` | Learner opens the assistance content | Client event | (3) | **No — never** | Yes | |
| `assistance_dismissed` | Learner closes without using it further | Client event | (3) | **No — never** | Yes | |
| `assistance_level_used` | Which stage-tier of assistance copy was shown | Same as offered | (3) | **No — never** | Yes | |
| `misconception_evidence_generated` | A wrong response mapped through its option's misconception code | Computed at `response_submitted` time | (1) derived immediately, then treated as (1) going forward | Informs diagnosis, not score directly | Yes | Feeds Peta Bacaan and cohort aggregates |
| `pretest_completed` | Pre-test session finalized | Session → FINALIZED | (1) | N/A (pre-test never scores pass/fail) | Yes | |
| `domain_diagnosis_generated` | Per-competency-domain read of pre-test performance | Computed at pretest_completed | (5) | No | Recomputable, not itself frozen | Feeds Peta Bacaan |
| `personal_reading_map_generated` | The learner-facing artifact from the diagnosis | Computed alongside diagnosis | (5) | No | Recomputable | |
| `lesson_opened` | Learner opens a lesson | Client navigation, server-logged | (1) | No | Yes | |
| `lesson_progress_updated` | Reading/playback position advances | Debounced client → server sync | (1) | No | Latest value only (not append-only) — but never regresses, per FABLE-03 §3 | |
| `posttest_started` / `posttest_completed` | Post-test session lifecycle | Session state change | (1) | Yes at completion | Yes | |
| `mastery_calculated` | Server-computed score + domain breakdown | At `response_submitted`-complete / finalize | (2) | Yes — this **is** scoring | Yes, plus independently recomputed at issuance (INV-09) | |
| `safety_gate_evaluated` | Pass/fail on safety-critical minimum | At finalize | (2) | Yes | Yes | INV-10 |
| `certificate_eligibility_determined` | ELIGIBLE state reached | After finalize, if applicable stage | (5) derived from (2) | No | Recomputable | |
| `certificate_issued` | ISSUED state reached | Server, idempotent per session id | (1) once issued | N/A | Yes, permanently | INV-07 |
| `certificate_verified` | A public verification lookup occurred | Request time | (4)-adjacent (access log, not learning evidence) | N/A | Append-only log optional, not required | Never logs requester PII beyond what's already public |
| `psychometric_cohort_included` / `_excluded` | Whether a session's responses count toward recalibration | At recalibration run time | (6) | No | Recomputable each run | Excludes preview/dev sessions (INV-20) |

## Excluded from learner analytics and psychometrics, always

- Sessions created via dev-only tooling (`NODE_ENV=development` routes).
- Sessions explicitly flagged as educator/staff preview.
- Any session belonging to a seed/test persona outside a designated
  staging tenant.

This exclusion is enforced at the aggregate-view/query level (a `WHERE`
clause every aggregate must include), not by hoping nobody runs a preview
session on a learner-facing route.

## Retention

- Raw responses and sessions: retained per the institution's data-retention
  policy (PDP-equivalent); anonymization job runs on a schedule, never
  deletes rows a certificate or audit record depends on — anonymize the
  learner-identifying fields, keep the evidentiary shape.
- Telemetry (hesitation/assistance): same retention window as its parent
  session; never retained longer than the evidence it's attached to.
- Audit records: retained indefinitely (accountability doctrine) or per an
  explicit, separately-documented institutional policy — decide this in
  doc `11-PINTAR-OPEN-DECISIONS.md` before shipping, don't default silently.
