# 14 — FABLE Prompt Crosscheck

*Baseline amendment (2026-09-12): §"Post-baseline re-crosscheck" added.
Synchronization pass (2026-09-12, later the same day): the FABLE-00–06
prompt files were added to the project and read in full. **Finding:** they
were the unamended originals — none of the six amendments the original
crosscheck (below) and the earlier readiness report described as "already
applied" were present in the files. All of those, plus every row of the
post-baseline table, were applied in the synchronization pass; each row's
status is now APPLIED with the file and section named. The original
crosscheck is retained below as a record, with its "already applied"
claims corrected.*

## Post-baseline re-crosscheck (REQUIRED before FABLE-01)

The Architecture Baseline (docs 01–16, 2026-09-12) changes contracts that
FABLE-00 through FABLE-06 were written against. Before Phase 1, every
FABLE prompt must be re-crosschecked and amended for the items below. This
table is the checklist; every row was applied and verified in the
synchronization pass by reading the prompt files.

| Baseline change | FABLE prompts likely affected | Required amendment | Status |
|---|---|---|---|
| Governing principle, authority hierarchy, naming (doc 15) | FABLE-00 | State the principle and hierarchy; forbid "PINTAR 4.0" on any user/public surface | APPLIED — FABLE-00 §Governing principle, §What you are building (Naming); FABLE-01 §9 copy inventory test |
| Person-centred identity; Academic Period, Enrollment, Membership, Transfer (doc 02, 04 §3a–3c, INV-23/25) | FABLE-01 (foundation schema), FABLE-02 | Replace any "user belongs to institution/class" shape with Person + Enrollment + dated Membership; add Transfer lifecycle | APPLIED — FABLE-01 §2, §3, §3a, §4, §5, checklist |
| Evidence provenance, channel, class; structural eligibility (doc 06, INV-20/33) | FABLE-02, FABLE-03, FABLE-05, FABLE-06 | Add provenance columns and eligibility views; remove any "aggregate views filter with WHERE" instruction; analytics roles get no raw-table grant | APPLIED — FABLE-02 §7–8; FABLE-03 §0; FABLE-06 §1–4 read `official_*` only |
| Zero pre/post overlap incl. parallel groups (INV-24) | FABLE-02 (definition schema), FABLE-03 | Remove `repetition_policy`-style opt-in overlap; add `parallel_group` exclusion | APPLIED — FABLE-02 §3; FABLE-03 §4; FABLE-04 §1 (old "at a rate" wording removed) |
| One engine with modes; Quick Assessment as a surface (doc 07, INV-26) | FABLE-04, FABLE-05 | Any "flash quiz" or exam-specific engine language becomes a mode of the one engine; rename `CAN_FLASH_QUIZ` → `CAN_QUICK_ASSESSMENT` | APPLIED — FABLE-01 §4 (rename); FABLE-03 §0 (module created); FABLE-04 §1, §5 |
| Start eligibility ≠ continue permission; TERMINATED; authoritative deadline; extensions (doc 04 §5, INV-17/27) | FABLE-03, FABLE-04 | Explicit continue-permission check; session deadline column; termination reason; audited extension | APPLIED — FABLE-02 §7 (columns/status enum); FABLE-03 §0; FABLE-04 §2; FABLE-05 §11 |
| Resilience: durable outbox, idempotent replay, late-sync grace (doc 07, INV-28) | FABLE-03, FABLE-04 | Idempotency key + unique constraint; replay endpoint; `receipt_mode` | APPLIED — FABLE-02 §7; FABLE-03 §4; FABLE-04 §3 (acceptance scenario as a test) |
| Scoring reproducibility: engine/scoring-policy versions (INV-29, doc 08) | FABLE-02, FABLE-04 | NOT NULL provenance on session/result; policy version registry | APPLIED — FABLE-02 §7; FABLE-04 §4 |
| Certificate payload correction (INV-05) and identity snapshot (INV-30) | FABLE-04 | Canonical signed payload includes release id + hash, definition version, snapshot, key version; snapshot table | APPLIED — FABLE-04 §7 (old five-field payload withdrawn); FABLE-00 non-negotiable 5 |
| Content lifecycle: APPROVED ≠ FROZEN explicit; Publish Readiness projection; MCQ Quality Findings (doc 04 §1/1a, INV-35) | FABLE-02, FABLE-05 | Readiness endpoint/projection; findings table; publish transition checks readiness | APPLIED — FABLE-02 §1–2, §9; FABLE-05 §3, §5, §6 |
| Easy Upload + Structured Package Import (doc 02) | FABLE-05 | Two ingestion paths converging on INGESTED; no vendor parser | APPLIED — FABLE-02 §11 (data layer); FABLE-05 §2 (UI) |
| PUBLISH ≠ ASSIGN; Learning Assignment; release-correction policy (doc 02, 04 §4, doc 08) | FABLE-02, FABLE-03, FABLE-05 | Learning Assignment entity and lifecycle; audited release moves | APPLIED — FABLE-02 §10; FABLE-03 §The cycle; FABLE-05 §7 |
| Question Health lifecycle and basic signals (doc 04 §9) | FABLE-05, FABLE-06 | Signal computation over eligible evidence; reviewer workflow; no autonomous conclusions | APPLIED — FABLE-02 §8 (table/lifecycle); FABLE-05 §8 (review); FABLE-06 §4 (signals) |
| Predicted vs empirical difficulty; no seeded empirical values (doc 02) | FABLE-02, FABLE-05 | Separate columns; empirical NULL until computed; no seed | APPLIED — FABLE-02 §1 + checklist; FABLE-05 §8; FABLE-06 §4 + checklist (Rasch loop removed from FABLE-05) |
| Hesitation window governed configuration (doc 07) | FABLE-03 | Per-definition parameter with platform bounds; no constant | APPLIED — FABLE-00 assistance behaviour; FABLE-02 §1; FABLE-03 §6; FABLE-05 §10 |
| AI Provider Gateway; Authoring vs Learner Assistance contexts (doc 02, INV-31/32) | FABLE-03 (assistance), FABLE-05 (Studio AI) | Gateway boundary; learner context built from sanitized type only | APPLIED — FABLE-01 §10 (`ai-gateway/` boundary); FABLE-03 §6; FABLE-05 §2 |
| Metric Catalogue / Standard Reports / Institution Report Templates (doc 02, INV-34) | FABLE-06 | Catalogue-driven reports; template schema is selection-only | APPLIED — FABLE-06 §1 |
| Integrity evidence category and human-only decisions (doc 06 cat. 7, doc 05) | FABLE-05 | Anomaly logs are integrity signals in the audit/evidence model; no verdicts | APPLIED — FABLE-02 §7; FABLE-04 §6; FABLE-05 §10 |
| Scope categories renamed BUILD NOW / FOUNDATION NOW / LATER / PARK (doc 09) | FABLE-00 | Reference the new categories | APPLIED — FABLE-00 §Scope |
| Engineering & verification system: GitHub truth, migration testing, persona harness, versioned selftest contract, audit cadence, stop-patch-loop, deployment scenario (doc 16) | FABLE-00, FABLE-01 | Reference doc 16; define the selftest manifest; require mini-audit after each phase | APPLIED — FABLE-00 §Verification doctrine; FABLE-01 §1–2; every phase's closing mini-audit line; FABLE-06 §7 drill |
| Anti-patterns list (doc 10 §2) | FABLE-00 | Reference explicitly | APPLIED — FABLE-00 §Security non-negotiables (closing paragraph) |
| New/renamed invariants INV-23…INV-38 (doc 03) | All phases' acceptance checklists | Add tests per invariant to the phase that introduces the mechanism | APPLIED — every INV-01…INV-38 appears in at least one phase checklist (verified by sweep) |

## Original crosscheck (2026-09, retained as record)

Auditing FABLE-00 through FABLE-06 against docs/rebuild/01–13. Legend:
COVERED / PARTIALLY COVERED / MISSING / CONFLICTING.

### Cross-phase dependency questions (asked directly)

**Does Phase 5 assume infrastructure that Phase 1 never creates?**
No new gap found — FABLE-05's Config Studio panels build on FABLE-01 §10's
shell, and its capability checks build on FABLE-01 §4. One addition needed:
FABLE-05's Integrity Control Center (anomaly logging) assumes a place to
write anomaly logs, which is really the audit trail from FABLE-01 §8 —
**PARTIALLY COVERED**: FABLE-05 doesn't explicitly say "write anomalies to
the Phase 1 audit trail," so an implementer might invent a second log
table. **Amend FABLE-05 §7** to say explicitly: anomaly logs are audit-trail
rows (FABLE-01 §8), not a new table. *(Baseline note: integrity signals are
now evidence category 7 in doc 06 with human-only decisions audited —
re-crosscheck.)*

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
them undefined. *(Baseline note: these thresholds become versioned metric
catalogue definitions — doc 02.)*

**Does certificate verification require information that the
content/versioning model fails to preserve?**
No — COVERED at the time. *(Baseline note: superseded — the release binding
must now be inside the signed payload, INV-05; FABLE-04 requires
amendment.)*

**Does Rasch calibration require response data or exclusions that earlier
phases do not collect?**
Yes — **MISSING**. FABLE-05 §8 requires "Rasch-model empirical difficulty
recalibration from completed sessions," which needs preview/dev sessions
excluded (INV-20) — but no FABLE phase explicitly requires a
preview/staff-flag on sessions at creation time. **Amend FABLE-01 §10 or
FABLE-03 §8** to add: sessions created via dev-only tooling or an explicit
educator-preview flag are marked as such at creation, and every aggregate
view (FABLE-02 §7, FABLE-05 §8, FABLE-06 §1) filters them out. *(Baseline
note: superseded by structural eligibility — `evidence_class` and
eligibility views, not per-view filters.)*

**Does Studio need lifecycle states that earlier database phases fail to
establish?**
No — COVERED. FABLE-02 §2 defines the full lifecycle; FABLE-05 consumes it
correctly (Approve & Freeze, Publish/withdraw). *(Baseline note: add
Publish Readiness projection and MCQ Quality Findings.)*

**Does the Safety Gate depend on item metadata that content ingestion does
not require?**
No — COVERED. FABLE-02 §1 includes `AssessmentBlueprint`'s
"safety-critical minimum," and items carry a safety-critical flag implicitly
via the doctrine sections; **minor gap**: FABLE-02 never explicitly lists
"is_safety_critical" as a required Item column. **PARTIALLY COVERED** —
amend FABLE-02 §1's Item description to explicitly list
`is_safety_critical: BOOLEAN` as a required field.

**Does authorization introduced later conflict with earlier RLS
assumptions?**
No direct conflict found. FABLE-05's capability checks are additive to
FABLE-01's model throughout.

### Full crosscheck against docs 01–13

| Source finding | FABLE coverage | Status | Amendment |
|---|---|---|---|
| Lesson 1 (storage two-lock problem) | FABLE-00 #2, FABLE-01 §7 | COVERED | — |
| Lesson 2 (RLS convention ≠ boundary) | FABLE-00 #1, FABLE-01 §6 | COVERED | — |
| Lesson 3 (unversioned signing key) | FABLE-00 #5, FABLE-04 §3 | COVERED | — |
| Lesson 4 (parallel migration series) | none explicit | MISSING | Add explicit rule to FABLE-01 §1 (claimed applied; NOT present in the supplied file — applied in the synchronization pass, FABLE-01 §1) |
| Lesson 5 (three generations coexisting permanently) | FABLE-00 #13 (narrow: SD5 only) | PARTIALLY COVERED | Add general non-negotiable to FABLE-00 (claimed applied; NOT present in the supplied file — applied in the synchronization pass) |
| Lesson 6 (dummy-data fallback) | FABLE-06 §1 | COVERED | — |
| Lesson 7 (client anon-key upload) | FABLE-00 #2, FABLE-01 §7 | COVERED | — |
| Lesson 8 (seed password hygiene) | FABLE-01 §2 (partial) | PARTIALLY COVERED | Add explicit non-prod guard on seed script (claimed applied; NOT present in the supplied file — applied in the synchronization pass) |
| Lesson 9 (in-memory cert store) | FABLE-04 §6 | COVERED | — |
| Lesson 10 (validator scope gap) | FABLE-00 #11, FABLE-02 §8 | COVERED | — |
| Lesson 11 (fails-open auth function) | FABLE-01 §4 | COVERED | — |
| Lesson 12 (patch-folder repo sprawl) | none | MISSING | Add explicit trunk-only rule to FABLE-01 §1 (claimed applied; NOT present in the supplied file — applied in the synchronization pass) |
| Domain model (doc 02) full entity set | FABLE-02, FABLE-01 §3–5 | COVERED at the time | Superseded by the baseline domain model — see re-crosscheck table |
| INV-01…INV-22 (doc 03) | Distributed across FABLE-00 non-negotiables + phase acceptance tests | MOSTLY COVERED | INV-20 (preview-session exclusion) — superseded by structural eligibility; INV-23…38 new |
| State machines (doc 04) | FABLE-02 §2 (PLP), FABLE-03 (session-level, implicit), FABLE-04 (certificate, implicit) | PARTIALLY COVERED | Require explicit enumerated status + transition-trigger in FABLE-03 §4 and FABLE-04 §4 (claimed applied; NOT present in the supplied file — applied in the synchronization pass); new lifecycles in baseline |
| Authorization matrix (doc 05) | FABLE-01 §4, tested throughout every phase's checklist | COVERED at the time | New rows in baseline |
| Evidence/telemetry contract (doc 06) | FABLE-03 §6 (behavior) | PARTIALLY COVERED | Schema-level gap; amend FABLE-02; baseline adds provenance/eligibility |
| Assessment engine contract (doc 07) | FABLE-04 §1–2, FABLE-02 §3 | COVERED at the time | Baseline adds modes, continue permission, resilience, versions |
| Content versioning contract (doc 08) | FABLE-02 §2 | COVERED at the time | Baseline corrects certificate binding, adds correction policy |
| V1 scope boundaries (doc 09) | Not referenced by any FABLE prompt directly | MISSING | FABLE-00 should reference doc 09's BUILD NOW list as the full V1 build and flag any FOUNDATION NOW/LATER/PARK item encountered mid-build |
| Removed/rejected features (doc 10) | Implicit via "ground-zero, no legacy" framing | PARTIALLY COVERED | FABLE-00 should explicitly reference doc 10 incl. §2 anti-patterns |
| Open decisions (doc 11) | Not referenced | MISSING | FABLE-00 or FABLE-02/03/06 should point at doc 11 and require pausing on "MUST ASK" items |
| Failure modes (doc 12) | Overlaps with self-test doctrine but not enumerated | PARTIALLY COVERED | Reference doc 12 from FABLE-00's self-test section |
| ADR template (doc 13) | Not referenced anywhere | MISSING | Add a short instruction to FABLE-00: maintain `docs/adr/` per doc 13 from Phase 1 onward |

### Recommended amendment summary (original, highest priority first)

1. FABLE-00: reference docs 09, 10, 11, 12, 13 (and now 16) explicitly.
2. FABLE-02: add telemetry tables, `is_safety_critical`, and (now) the
   provenance/eligibility columns and views.
3. FABLE-03 / FABLE-04: require explicit enumerated status + transition
   triggers for session and certificate lifecycles.
4. FABLE-05: point integrity signals at the evidence/audit model explicitly.
5. FABLE-06: state readiness-tier thresholds explicitly (as catalogue
   definitions).

These amendments must be applied to the FABLE-0X files directly (not left
as a standing to-do) before Phase 1 execution begins — together with the
post-baseline re-crosscheck table above.
