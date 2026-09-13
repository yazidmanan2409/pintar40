# Re-pass: FABLE-01 and FABLE-02 against the amended doc 03

**Date:** 2026-09-13 · **Trigger:** Claude 1's round-2 review, §3.4
**Measured against:** a clean 36-migration replay, and the live development
project where noted.

## Why this exists

The repository carried a **33-line doc 03 stopping at INV-22**. The baseline
carries an amendment dated 2026-09-12 that adds **INV-23 … INV-38**, corrects
**INV-05** and strengthens **INV-20**. That amendment reached this repository
only on 2026-09-13.

So FABLE-01 and FABLE-02 were built against a document that did not contain
sixteen of the invariants they implement, and against the *pre-amendment*
wording of two more. They implemented INV-23, 25, 26, 28, 29, 32, 33, 36 and 37
from the **FABLE phase prompts** instead. FABLE-03's closeout re-checked only
the five invariants that phase implements.

This is that re-check, extended to the earlier set. It is mechanical on purpose:
the question is not "is the implementation good" but "does it match the text it
was never shown". Per doc 16 §6, *a major architectural defect found only in the
final audit means an earlier gate failed* — so the cheap version of that audit
is worth running now rather than at the end.

## Result

**No implementation contradicts the amended text.** Two invariants say more than
was built, both already recorded; one is now enforced structurally where it was
satisfied vacuously; one is a reading worth stating explicitly; and four belong
to phases not yet started.

| INV | Amended requirement | State | Verdict |
|---|---|---|---|
| **05** | Release identity **and content hash** inside the signed payload; altering any listed field fails verification | Nothing built — certificates are FABLE-04 | **Carried.** Claude 1 confirms the FABLE-04 prompt already says *"every field above is inside the signed payload"* and requires tampering with each protected field. The correction reached the phase prompt even though it never reached this repo's doc 03 |
| **20** | Non-OFFICIAL evidence excluded **structurally**; consumers "hold no direct grant on raw evidence tables" | Built against the pre-amendment text. Six raw evidence tables; grantees are `authenticated` (SELECT only, RLS-scoped) and `service_role` (full) | **Strengthened and now guarded — but the decision is open.** See below |
| **23** | Person is one platform-wide record; enrollments/memberships dated and append-only; nothing overwritten by a period change | `memberships` carries `valid_from`/`valid_to`; `persons` carries **0** tenant columns; rollover closes and recreates. F01-T08, F01-T09 | **Matches** |
| **24** | Pre/post share zero items **and zero `parallel_group` siblings**; overlap exists only as a distinct mode, never as a relaxation | Assembler excludes both; F03-T02 proves the empty intersection across the whole bank | **Matches on the first clause.** Second clause — *"attempt to configure overlap on a LEARNING_CYCLE definition; assert rejection"* — **unbuilt**; no definition-level constraint exists. Already recorded for FABLE-04 |
| **25** | Records cross an institution only by authorized, audited Transfer, and only portable classes; historical evidence keeps its original enrolment binding | `record_class_registry`: exactly `enrollments`, `memberships` PORTABLE; evidence carries an immutable `enrollment_id`; F01-T10 | **Matches.** The open question is *which* classes should be portable (OD-9), not whether the mechanism is right |
| **26** | One engine: every mode and item type assembled, sanitized, scored, evidenced by the same services | `assemble_session`, `sanitized_item`, `grade_response`, `evaluate_session`, `finalize_session` — **×1 each**; F03-S01 plus a CI red case | **Matches** |
| **27** | Start eligibility and continue permission distinct; a closed window never interrupts a started session | `may_start_assessment` / `may_continue_session`; session carries its own authoritative deadline; F03-T04 | **Matches** |
| **28** | Idempotent per (session, presented item, client sequence); replay never duplicates or drops; final submission exactly once | Unique index arbitrates; F02-T14, F02-C01, F03-T05 | **Matches.** The named acceptance scenario — *17 online, 8 offline, process killed, return, assert exactly 25* — is FABLE-04's resilience scenario, not yet run |
| **29** | Every Result **and Session** records release id, definition version, engine version, scoring policy version | Session carries all four, immutably. Result carries `engine_version` + `scoring_policy_version` directly and the other two through a **`NOT NULL`** FK to its session | **Matches, by a reading worth stating.** Copying release id onto the result would create a value that can disagree with the session's — precisely what doc 06 forbids ("a derivation must never become *the* record"). The four identifiers are always resolvable from a result, and never twice. Flagged for the Layer-3 auditor as a reading, not a fact |
| **30** | Certificate identity comes from its snapshot; later profile changes never alter an issued certificate | No certificate tables exist | **FABLE-04.** Correctly absent |
| **31** | Learner assistance context structurally has no answer keys; a prompt instruction is never the control | `buildLearnerAssistanceContext` diffs against the sanitized type and refuses an authoring row; F03-S03 | **Matches** |
| **32** | No AI provider in the domain model; no AI or external tool publishes or assigns | **0** provider-typed entities; publish requires a human `CAN_PUBLISH` holder; F02-T08 | **Matches** |
| **33** | Every evidence record carries provenance at write time, NOT NULL and immutable | `assessment_sessions`: `evidence_class`, `evidence_channel`, `institution_id`, `person_id` all NOT NULL, derived by trigger, immutable; F02-T12, F02-T13 | **Matches** |
| **34** | Report templates select and present catalogue metrics; never redefine a metric; no arbitrary SQL | No metric catalogue or template tables exist | **FABLE-06.** Correctly absent |
| **35** | Publish Readiness reports READY only on technical validation + academic approval + no unresolved ERROR finding, and names what blocks | Implemented and exercised by F02-T19 | **Implemented, but its named test does not exist.** INV-35's own "How tested" column *is* doc 16 §4's adversarial fixtures. Two of eight exist (F03-S03, F02-T22); the four MCQ banks and the eligibility-probe set do not. Already recorded |
| **36** | RLS enabled and closed by default on every table; no `USING (true)`; buckets private | **0** tables without RLS · **0** permissive policies · **0** public buckets; F01-T13 | **Matches** |
| **37** | Service-role credentials never client-side; every authenticated route server-side protected | F01-S03 scans the bundle and import graph; the proxy covers every non-public route; F03-R01 | **Matches** |
| **38** | Exactly one canonical public certificate verification route | No verification route exists | **FABLE-04.** Correctly absent |

## The one that changed state: INV-20

The amended text requires consumers to *"read only eligibility-filtered base
views/functions and hold no direct grant on raw evidence tables."* Measured:

- `authenticated` — `SELECT` only on `presented_items`, `responses`,
  `assessment_results`; none at all on `assessment_sessions`. RLS-scoped, and no
  learner is an analytics consumer.
- `service_role` — `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
  TRIGGER` on **every** raw evidence table (Supabase's default grants).
- Nobody else.

So the invariant holds today **vacuously**: there is no analytics, reporting,
psychometrics or Question Health consumer yet, so nothing holds a forbidden
grant. FABLE-02's aggregate views (`service_item_statistics`,
`service_distractor_uptake`, `service_cohort_misconceptions`,
`service_exam_exposure`) are `service_role`-only and belong to FABLE-06.

**If FABLE-06's analytics runs as `service_role`, the amended INV-20 is violated
by construction on day one**, because that consumer holds full direct grants on
every raw evidence table.

Migration 0036 does **not** decide that — the consumer role is an architectural
choice. It removes the ability to decide it by accident: the expected grantees
on raw evidence are enumerated in `assert_evidence_consumer_boundary()`, the
result is a lint counter, and `F02-T17` re-runs it. The moment a role outside
that set is granted anything on raw evidence, the build goes red. The assertion
reports its own vacuity in its detail line rather than presenting a green as
proof.

**Open decision, for the architect:** the shape the amended text implies is a
distinct, grant-poor analytics role that reads the `official_*` views and
nothing else. That is a migration now and a redesign in FABLE-06.

## What this re-pass cost, and what it says about the gate

One hour, entirely mechanical, and it found no contradiction — which is the
useful outcome, because the alternative was discovering one in FABLE-06. The
real finding is upstream of any invariant: **two phases were verified against a
document that was sixteen invariants out of date, and nothing in the process
noticed.** Doc 16 §4's harness smoke test — *"does the manifest cover every
invariant id in doc 03"* — is exactly the check that would have caught it, and
it is still unbuilt. It is now the most valuable single item on the FABLE-04
list, ahead of the RPC enumeration, because it is the check that checks the
checks.
