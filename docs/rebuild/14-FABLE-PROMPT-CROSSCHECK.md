# 14 — FABLE Prompt Crosscheck

Auditing FABLE-00 through FABLE-06 against docs/rebuild/01–13. Legend:
COVERED / PARTIALLY COVERED / MISSING / CONFLICTING.

## Cross-phase dependency questions (asked directly)

**Does Phase 5 assume infrastructure that Phase 1 never creates?**
No new gap found — FABLE-05's Config Studio panels build on FABLE-01 §10's
shell, and its capability checks build on FABLE-01 §4. One addition needed:
FABLE-05's Integrity Control Center (anomaly logging) assumes a place to
write anomaly logs, which is really the audit trail from FABLE-01 §8 —
**PARTIALLY COVERED**: FABLE-05 doesn't explicitly say "write anomalies to
the Phase 1 audit trail," so an implementer might invent a second log
table. **Amend FABLE-05 §7** to say explicitly: anomaly logs are audit-trail
rows (FABLE-01 §8), not a new table.

**Does Phase 3 depend on evidence Phase 2 never records?**
Yes — **MISSING**. FABLE-03 §6 requires logging
`time_before_assistance`/`assistance_offered`/`assistance_opened`, but
FABLE-02 (the schema phase) never explicitly creates these columns/table.
**Amend FABLE-02** to add a §(new) "Telemetry tables" section creating the
hesitation/assistance schema per doc 06's event contract, with the
physical-separation-from-scoring requirement (INV-11) stated as a database
fact (no FK from any scoring view), not left for FABLE-03 to invent ad hoc.

**Does Phase 6 expect analytics dimensions that earlier phases fail to
capture?**
Yes, partially — **PARTIALLY COVERED**. FABLE-06 assumes
`plp_miskonsepsi_kohort`/`plp_butir_empiris`-equivalent views exist and are
tenant-scoped (FABLE-02 §7 does create these), but FABLE-06 also implies a
"readiness distribution" (Siap Sertifikasi / Perlu Review / Butuh
Pendampingan Ekstra) whose exact thresholds are never defined in any FABLE
prompt — they exist only in the old comprehensive handoff (§2, Educator
role) and the uploaded Master Context doc. **Amend FABLE-06 §1** to state
the readiness-tier thresholds explicitly (≥80% + 100% safety gate = Siap
Sertifikasi; 60–79% = Perlu Review; <60% or failed safety gate = Butuh
Pendampingan Ekstra; pre-test-only = Belum Post-Test) rather than leaving
them undefined.

**Does certificate verification require information that the
content/versioning model fails to preserve?**
No — COVERED. FABLE-02's freeze/hash design plus FABLE-04's `plp_release_id`
binding together satisfy doc 08's requirements.

**Does Rasch calibration require response data or exclusions that earlier
phases do not collect?**
Yes — **MISSING**. FABLE-05 §8 requires "Rasch-model empirical difficulty
recalibration from completed sessions," which needs preview/dev sessions
excluded (INV-20) — but no FABLE phase explicitly requires a
preview/staff-flag on sessions at creation time. **Amend FABLE-01 §10 or
FABLE-03 §8** to add: sessions created via dev-only tooling or an explicit
educator-preview flag are marked as such at creation, and every aggregate
view (FABLE-02 §7, FABLE-05 §8, FABLE-06 §1) filters them out.

**Does Studio need lifecycle states that earlier database phases fail to
establish?**
No — COVERED. FABLE-02 §2 defines the full lifecycle; FABLE-05 consumes it
correctly (Approve & Freeze, Publish/withdraw).

**Does the Safety Gate depend on item metadata that content ingestion does
not require?**
No — COVERED. FABLE-02 §1 includes `AssessmentBlueprint`'s
"safety-critical minimum," and items carry a safety-critical flag implicitly
via the doctrine sections; **minor gap**: FABLE-02 never explicitly lists
"is_safety_critical" as a required Item column. **PARTIALLY COVERED** —
amend FABLE-02 §1's Item description to explicitly list
`is_safety_critical: BOOLEAN` as a required field, not just implied by the
blueprint referencing "safety-critical minimum."

**Does authorization introduced later conflict with earlier RLS
assumptions?**
No direct conflict found. FABLE-05's capability checks are additive to
FABLE-01's model throughout.

## Full crosscheck against docs 01–13

| Source finding | FABLE coverage | Status | Amendment |
|---|---|---|---|
| Lesson 1 (storage two-lock problem) | FABLE-00 #2, FABLE-01 §7 | COVERED | — |
| Lesson 2 (RLS convention ≠ boundary) | FABLE-00 #1, FABLE-01 §6 | COVERED | — |
| Lesson 3 (unversioned signing key) | FABLE-00 #5, FABLE-04 §3 | COVERED | — |
| Lesson 4 (parallel migration series) | none explicit | MISSING | Add explicit rule to FABLE-01 §1 (already applied in this session — see doc 01) |
| Lesson 5 (three generations coexisting permanently) | FABLE-00 #13 (narrow: SD5 only) | PARTIALLY COVERED | Add general non-negotiable to FABLE-00 (already applied — see doc 01) |
| Lesson 6 (dummy-data fallback) | FABLE-06 §1 | COVERED | — |
| Lesson 7 (client anon-key upload) | FABLE-00 #2, FABLE-01 §7 | COVERED | — |
| Lesson 8 (seed password hygiene) | FABLE-01 §2 (partial) | PARTIALLY COVERED | Add explicit non-prod guard on seed script (already applied — see doc 01) |
| Lesson 9 (in-memory cert store) | FABLE-04 §6 | COVERED | — |
| Lesson 10 (validator scope gap) | FABLE-00 #11, FABLE-02 §8 | COVERED | — |
| Lesson 11 (fails-open auth function) | FABLE-01 §4 | COVERED | — |
| Lesson 12 (patch-folder repo sprawl) | none | MISSING | Add explicit trunk-only rule to FABLE-01 §1 (already applied — see doc 01) |
| Domain model (doc 02) full entity set | FABLE-02, FABLE-01 §3–5 | COVERED | — |
| INV-01…INV-22 (doc 03) | Distributed across FABLE-00 non-negotiables + phase acceptance tests | MOSTLY COVERED | INV-20 (preview-session exclusion) not explicit anywhere — see cross-phase question above; amend FABLE-01/03 |
| State machines (doc 04) | FABLE-02 §2 (PLP), FABLE-03 (session-level, implicit), FABLE-04 (certificate, implicit) | PARTIALLY COVERED | FABLE-03/04 describe *behavior* matching the state machines but never name the explicit states/transition table — an implementer could build correct behavior with an implicit status string instead of an enforced transition table. Amend FABLE-03 §4 and FABLE-04 §4 to require an explicit enumerated status + transition-trigger, not just correct end-to-end behavior. |
| Authorization matrix (doc 05) | FABLE-01 §4, tested throughout every phase's checklist | COVERED | — |
| Evidence/telemetry contract (doc 06) | FABLE-03 §6 (behavior) | PARTIALLY COVERED | Schema-level gap — see cross-phase question above; amend FABLE-02 |
| Assessment engine contract (doc 07) | FABLE-04 §1–2, FABLE-02 §3 | COVERED | — |
| Content versioning contract (doc 08) | FABLE-02 §2 | COVERED | — |
| V1 scope boundaries (doc 09) | Not referenced by any FABLE prompt directly | MISSING | FABLE-00 should explicitly reference doc 09's category A list as "this is the full V1 build," and instruct that any B/C/D item encountered mid-build gets flagged, not built. Amend FABLE-00. |
| Removed/rejected features (doc 10) | Implicit via "ground-zero, no legacy" framing | PARTIALLY COVERED | FABLE-00 should explicitly say "if you encounter any of docs/rebuild/10's listed patterns in old material, do not recreate them" |
| Open decisions (doc 11) | Not referenced | MISSING | FABLE-00 or FABLE-02/03/06 should point at doc 11 and require pausing on OD-1/OD-3/OD-5/OD-8 (the "must ask" ones) before the phase that needs them proceeds |
| Failure modes (doc 12) | Overlaps with self-test doctrine but not enumerated | PARTIALLY COVERED | Reference doc 12 from FABLE-00's self-test section as the source of "what a green selftest suite should be catching" |
| ADR template (doc 13) | Not referenced anywhere | MISSING | Add a short instruction to FABLE-00: maintain `docs/adr/` per doc 13's rules from Phase 1 onward |

## Recommended amendment summary (highest priority first)

1. FABLE-00: reference docs 09, 10, 11, 12, 13 explicitly; state that scope
   is bounded by doc 09 category A, that doc 10's patterns are never
   recreated, that doc 11's "MUST ASK" items block their respective phases,
   and that the ADR log (doc 13) starts in Phase 1.
2. FABLE-02: add telemetry tables (hesitation/assistance, physically
   separated per INV-11), add `is_safety_critical` as an explicit Item
   column, add a preview/staff-session flag column referenced by every
   aggregate view.
3. FABLE-03 / FABLE-04: require explicit enumerated status + transition
   triggers for session and certificate lifecycles, not just correct
   end-to-end behavior.
4. FABLE-05: point anomaly logging at the Phase 1 audit trail explicitly.
5. FABLE-06: state the readiness-tier thresholds explicitly rather than
   leaving them undefined.

These amendments should be applied to the FABLE-0X files directly (not left
as a standing to-do) before Phase 1 execution begins — see the readiness
report for the go/no-go call.
