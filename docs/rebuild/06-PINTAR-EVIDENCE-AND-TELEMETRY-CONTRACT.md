# 06 — PINTAR Evidence & Telemetry Contract

*Baseline amendment (2026-09-12): evidence provenance, evidence channel and
evidence class made first-class and structurally enforced (replacing the
"WHERE clause every aggregate must include" rule); integrity evidence
category added; replay/late-sync events added; scoring-provenance fields
added; retention rewritten to distinguish identifiable evidence from
derived legitimate aggregates and to cover institution departure/export.*

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
6. **Psychometric derivations** — item-difficulty/Question Health/
   misconception aggregates computed from eligible (1)/(2), gated by
   minimum sample size; same non-authoritative status as (5).
7. **Integrity evidence** — proportionate forensic events from the
   assessment surface (visibility change, navigation, reconnect, option
   change, submission). Never scoring input; produces *review signals for a
   human*, never verdicts.

A derivation (5 or 6) must never become "the" record once no raw evidence
backs it — if the underlying responses are ever purged, the derivation is
invalidated, not preserved as if it were still true (see Retention for the
one exception: legitimately anonymized aggregates).

## Evidence provenance (required on every category-1/2/3/7 record)

Recorded at write time, NOT NULL, immutable (INV-33):

| Field | Meaning |
|---|---|
| `person_id` | the learner (platform-wide identity) |
| `institution_id`, `enrollment_id`, `academic_period_id`, `class_id`/`cohort_id` (where relevant) | the institutional context at the time of the evidence — never re-parented later |
| `learning_assignment_id`, `assessment_assignment_id` | what the learner was asked to do |
| `plp_release_id` (+ release content hash, resolvable) | the content actually used |
| `assessment_definition_id` + version | the rules of the assessment |
| `session_id` | the attempt |
| `engine_version`, `scoring_policy_version` | the identity of the code and configuration that interpret the evidence (INV-29) |
| `evidence_channel` | `ONLINE` · `PAPER_MANUAL_ENTRY` · `PAPER_IMPORTED` · `PUBLIC_DEMO` |
| `evidence_class` | `OFFICIAL` · `PREVIEW` · `SYNTHETIC` · `PUBLIC_DEMO` |
| `recorded_at` (server clock) and, for replayed responses, `client_asserted_at` | authoritative vs client-asserted time, never conflated |
| `receipt_mode` | `LIVE` · `REPLAYED` · `LATE_SYNC` (doc 07) |

Paper channels are **architectural foundation only** in this baseline: the
fields exist and are validated; no paper workflow ships (doc 09).

## Eligibility is structural, not procedural

| Consumer | May read |
|---|---|
| Official learner mastery, Personal Reading Map, results, certificates | `OFFICIAL` only |
| Institutional analytics, Standard Reports, briefings, metric catalogue values | `OFFICIAL` only |
| Question Health, Item Statistics, empirical psychometrics | `OFFICIAL` only |
| Educator preview surfaces | `PREVIEW` (own) — shown as preview, never aggregated |
| Persona harness / CI | `SYNTHETIC` only, inside synthetic tenants |
| Mini-PINTAR public trial | `PUBLIC_DEMO` only, within the demo's own scope |

Enforcement (INV-20): `evidence_class` is a NOT NULL column on every raw
evidence table; every consumer above reads through eligibility-filtered
base views/functions (e.g. `official_responses`) that apply the filter
once; the roles/grants used by analytics, psychometric, reporting and
certification code have **no SELECT on the raw tables**; a CI lint fails
any such code path that references a raw evidence table directly; synthetic
organisations are flagged at the tenant level and every evidence row under
them inherits `SYNTHETIC`. Overriding a row's class (e.g. an educator
accidentally took a real assessment in preview) is a new audited override
record that the views honour — never an UPDATE of the row.

## Event contract

For every event: name, meaning, exact moment, authoritative timestamp
source, required identifiers, provenance, immutability, scoring influence,
diagnosis influence, analytics eligibility, psychometric eligibility,
privacy note.

| Event | Meaning | Moment | Category | Scoring? | Immutable? | Notes |
|---|---|---|---|---|---|---|
| `session_started` | Learner begins an Assessment Session | Session row created, server clock | (1) | No | Yes | Carries full provenance incl. authoritative deadline, mode, channel, class |
| `item_presented` | An item is shown to a session at a position | Server issues the item to the client | (1) | No (informs exposure/cooling) | Yes | Required for INV-12 cooling and INV-24 exclusion |
| `response_selected` | Learner picks/changes an answer, not yet submitted | Client event, server timestamp on receipt | (3)/(1)/(7) hybrid — the *fact* of a change is evidence; the *timing* is telemetry; the *pattern* is integrity evidence | No | Append-only (each change is its own row) if the definition allows changes; else this event doesn't exist |
| `response_submitted` | Final answer for one item locked | Server receipt; idempotency key (session, presented item, client seq) | (1)/(2) | **Yes** | Yes | This is what scoring reads. `receipt_mode` records LIVE / REPLAYED / LATE_SYNC |
| `response_replayed` | A durable-outbox response was accepted after reconnection | Server receipt | (4)-adjacent + (7) | No (the replayed `response_submitted` scores) | Yes | Exactly-once: a duplicate key is acknowledged, not re-recorded (INV-28) |
| `response_duration_ms` | Time spent on the item before submission | Computed server-side from `item_presented`→`response_submitted`; for REPLAYED responses computed from client-asserted times and flagged | (3) | No | Yes | Flagged durations are excluded from timing-based psychometrics |
| `hesitation_threshold_reached` | Configured inactivity window elapsed with no selection | Server-side timer; window is per Assessment Definition within governed bounds | (3) | **No — never** | Yes | INV-11; not raised while a client is offline |
| `assistance_offered` / `assistance_opened` / `assistance_dismissed` / `assistance_level_used` | Assistance pill lifecycle and which staged hint tier was shown | As before | (3) | **No — never** | Yes | Requires connectivity (hints are server-served, INV-02/INV-31) |
| `misconception_evidence_generated` | A wrong response mapped through its option's misconception code | Computed at `response_submitted` | (1) derived immediately, then treated as (1) | Informs diagnosis, not score | Yes | Feeds Peta Bacaan and cohort aggregates |
| `pretest_completed` | Pre-test session finalized | Session → FINALIZED | (1) | N/A (pre-test never scores pass/fail) | Yes | |
| `domain_diagnosis_generated` / `personal_reading_map_generated` | Per-domain read of pre-test performance and the learner-facing artifact | Computed at pretest_completed | (5) | No | Recomputable | |
| `lesson_opened` / `lesson_progress_updated` | Learner opens a lesson / progress advances | Client navigation, server-logged / debounced sync | (1) | No | Yes / latest value, never regresses | Media watched is participation, not mastery |
| `posttest_started` / `posttest_completed` | Post-test session lifecycle | Session state change | (1) | Yes at completion | Yes | |
| `session_deadline_extended` | Authorized extension of the authoritative deadline | Server, on the capability holder's action | (4) | No | Yes | Actor, reason, old/new deadline |
| `session_terminated` | INV-17 event ended the session | Server | (4) | No (finalizes with recorded work) | Yes | Reason class recorded |
| `mastery_calculated` | Server-computed score + domain breakdown | At finalize | (2) | Yes — this **is** scoring | Yes, plus independently recomputed at issuance (INV-09) | Records `engine_version`, `scoring_policy_version` (INV-29) |
| `safety_gate_evaluated` | Pass/fail on safety-critical minimum | At finalize | (2) | Yes | Yes | INV-10 |
| `certificate_eligibility_determined` | ELIGIBLE state reached | After finalize, if applicable stage and `OFFICIAL` class | (5) derived from (2) | No | Recomputable | |
| `certificate_issued` | ISSUED state reached | Server, idempotent per session id | (1) once issued | N/A | Yes, permanently | Identity snapshot taken; signed payload per INV-05 |
| `certificate_verified` | A public verification lookup occurred | Request time | (4)-adjacent | N/A | Append-only log optional | Never logs requester PII |
| `integrity_signal_recorded` | Visibility change, navigation, reconnect, rapid option change, submission anomaly | Server receipt | (7) | **No — never** | Yes | Proportionate; no webcam/mic/screen/keylog. Patterns → review signal, never verdict |
| `integrity_review_decided` | A human recorded a decision on a review signal | Capability holder's action | (4) | No | Yes | Human authority required |
| `question_health_signal_raised` / `_reviewed` | Item pattern crossed a threshold / a human decided | Computation run / reviewer action | (6) / (4) | No | Recomputable / Yes | `OFFICIAL` evidence only; minimum threshold per signal |
| `evidence_class_overridden` | SYSTEM_ADMIN/SERVICE reclassified a session's evidence | Action time | (4) | No | Yes (new record) | Views honour the latest override; the original row is untouched |
| `transfer_executed` | Portable record made readable to a receiving enrollment | Transfer EXECUTED | (4) | No | Yes | Lists record classes carried |
| `psychometric_cohort_included` / `_excluded` | Whether a session counts toward a calibration run | Run time | (6) | No | Recomputable each run | Always excludes non-`OFFICIAL` by construction |

## Excluded from official mastery, analytics, Question Health, psychometrics and certificates — always

- `PREVIEW` — sessions created via dev-only tooling or explicit educator/
  staff preview.
- `SYNTHETIC` — any session under a synthetic organisation or produced by
  the persona harness/CI.
- `PUBLIC_DEMO` — Mini-PINTAR/public trial sessions.

Never by a per-query filter. Always by the eligibility views and grants
described above.

## Retention, anonymization and departure

- **Identifiable evidence** (raw responses, sessions, telemetry, integrity
  signals tied to a person): retained per the institution's configured
  retention policy within applicable governance/legal requirements. **PINTAR
  does not invent legal retention durations** (doc 11, OD-5). The
  architecture supports institution-configurable windows and an
  anonymization job.
- **Anonymization** replaces the learner-identifying fields and keeps the
  evidentiary shape and provenance (release, definition, period, class-level
  scope) so that legitimate **derived/anonymized aggregate analytics**
  (Question Health history, item statistics, cohort-level metrics) survive
  the removal of identifiable records. This is the one case where a
  derivation may outlive its identifiable source — because the source was
  *anonymized*, not falsified.
- Rows a certificate or audit record depends on are never deleted;
  certificates keep their identity snapshot by design (INV-30).
- Telemetry and integrity signals: same retention window as their parent
  session; never retained longer than the evidence they're attached to.
- Audit records: retained indefinitely (accountability doctrine) or per an
  explicit, separately-documented institutional policy — decide in doc 11
  before shipping, don't default silently.
- **Institution departure/export:** an institution leaving PINTAR receives
  an authorized export of its institution-scoped records and its learners'
  evidence in a documented format; learners' Person identities and portable
  records remain the learners' (Doctrine: lifelong learning passport);
  certificates remain publicly verifiable; identifiable institution-scoped
  records are then anonymized/deleted per the retention policy while
  anonymized aggregates may be kept.
