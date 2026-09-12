# FABLE-03 → FABLE-06 — Roadmap and handoff

**Written:** 2026-09-12, Asia/Jakarta, by a Cowork session with Supabase
management access and **no GitHub access** to `yazidmanan2409/pintar40`.
**For:** the Claude Code session holding the repository and push rights.
**Covers:** the four remaining phases, end to end, from a green FABLE-02.

Ships with four verbatim phase prompts. Feed them **one phase at a time** —
doc 16 §6 runs `phase → mini audit → fix → gate → next phase`, and pasting
all four at once invites running ahead of a gate.

---

## 0. How to read this

- **[VERIFIED]** — I queried the live Supabase project today; quoted values
  are observed output.
- **[TRANSCRIPT]** / **[REPORTED]** — second-hand. Confirm before relying.
- **[JUDGEMENT]** — my reasoning. Argue with it.

Everything about the **repository** is second-hand (no GitHub access here).
Everything about the **database** is [VERIFIED].

---

## 1. Preflight

```bash
git log --oneline -1 && git status --porcelain | wc -l
ls supabase/migrations/ | wc -l                                                    # expect 29
python3 -c "import json;print(len(json.load(open('selftest/manifest.json'))['tests']))"
npm ci && npm run lint && npm run typecheck && npm run selftest                    # strict, no skips
```
```sql
select count(*) from supabase_migrations.schema_migrations;   -- expect 29
select count(*) from pg_namespace where nspname='selftest';   -- expect 0 on hosted
```
If the migration count or the manifest disagrees with §2, reconcile before
writing code.

---

## 2. Verified state after FABLE-02

Project `sknixmwkynzmrgbxzrvb`, org ZAYD, plan **free**, `ap-southeast-1`,
Postgres 17, `platform_environment.environment = 'development'`.

**29 migrations** — 13 from FABLE-01 plus 16: **[VERIFIED]**
```
20260912112712 content_hierarchy            20260912140823 evidence_response_result
20260912112903 content_helper_function_grants 20260912194342 telemetry_and_integrity
20260912114854 content_lifecycle            20260912194513 official_evidence_boundary
20260912124007 content_freeze_hash          20260912200213 views_aggregates_question_health
20260912125618 freeze_capability_gate       20260912203146 validator_and_publish_readiness
20260912130904 content_tenant_immutable     20260912203357 assignments_and_ingestion
20260912132335 bank_tier_isolation          20260912203519 exposure_cooling_and_inv24
20260912133821 evidence_session_root
20260912135314 evidence_class_monotonic
```

**49 tables**, lint counters **all still zero** (`tables_without_rls` 0,
`policies_using_true` 0, `secdef_unpinned` 0). **89 functions** in `public`.
**Views:** `official_sessions`, `official_responses`, `official_results`,
`published_lessons`, `service_cohort_misconceptions`,
`service_item_statistics`, `service_distractor_uptake`,
`service_exam_exposure`, `my_profile`. **[VERIFIED]**

**New enums** — reuse these, don't invent parallel vocabularies:
```
content_status  = INGESTED|STRUCTURED|VALIDATED|VALIDATION_FAILED|IN_REVIEW|APPROVED|FROZEN|PUBLISHED|SUPERSEDED
session_status  = CREATED|IN_PROGRESS|PAUSED|SUBMITTED|EXPIRED|TERMINATED|FINALIZED
assessment_mode = PRE_TEST|POST_TEST|QUICK|STANDALONE
evidence_class  = OFFICIAL|PREVIEW|SYNTHETIC|PUBLIC_DEMO
evidence_channel= ONLINE|PAPER_MANUAL_ENTRY|PAPER_IMPORTED|PUBLIC_DEMO
bank_type       = PRACTICE|TEST|EXAM        receipt_mode = LIVE|REPLAYED|LATE_SYNC
item_type       = MCQ_SINGLE|MCQ_MULTI|NUMERIC|GRID|TRUE_FALSE_BATTERY|MATCHING|IMAGE_ANCHORED
bloom_level     = REMEMBER|UNDERSTAND|APPLY|ANALYSE|EVALUATE|CREATE
question_health_state = INSUFFICIENT_EVIDENCE|OBSERVING|SIGNAL_RAISED|UNDER_REVIEW|ACKNOWLEDGED_OK|ACTION_TAKEN
integrity_category = VISIBILITY_CHANGE|NAVIGATION|RECONNECT|RAPID_OPTION_CHANGE|SUBMISSION_ANOMALY
finding_severity = ERROR|WARNING            ingest_status = RECEIVED|MAPPING_PROPOSED|CONFIRMED|MATERIALISED|REJECTED
learning_assignment_status = DRAFT|ACTIVE|ENDED|WITHDRAWN
assessment_assignment_status = DRAFT|SCHEDULED|OPEN|CLOSED
```

⚠️ **`assessment_mode` is `PRE_TEST|POST_TEST|QUICK|STANDALONE`**, but
FABLE-03 and FABLE-04 name modes `LEARNING_CYCLE_PRETEST`,
`LEARNING_CYCLE_POSTTEST`, `PRACTICE`, `TEST`, `EXAM`, `QUICK_ASSESSMENT`,
`PUBLIC_DEMO`, `PAPER`. Reconcile deliberately at the start of FABLE-03 —
either map the prompt's names onto the existing enum, or extend the enum
(additive, expand-first) and record the mapping in an ADR. Do not let two
vocabularies drift. **[VERIFIED enum / JUDGEMENT on the fix]**

---

## 3. The FABLE-02 surface phases 3–6 must call, not reinvent **[VERIFIED]**

Every one of these exists. Re-implementing any of them in application code
is an INV-26 violation waiting to be found by the mini audit.

**Session and response lifecycle** — `service_role` only, so the engine's
writes go through a server route holding the service client:
```
open_assessment_session(p_enrollment, p_definition, p_plp_release, p_channel, p_mode,
                        p_engine_version, p_scoring_policy_version, p_class_node,
                        p_cohort_node, p_authoritative_deadline, p_learning_assignment,
                        p_assessment_assignment) -> uuid                       [SECDEF] svc
submit_response(p_presented_item, p_client_seq, p_value, p_client_asserted_at,
                p_receipt_mode, p_is_final) -> (response_id, outcome)          [SECDEF] svc
```
There is **no finalize function yet** — server-side grading, mastery, the
safety gate and finalization are Phase 3/4 work.

**Item draw and INV-24** — the assembler calls these:
```
eligible_items_for_definition(p_definition) -> (item_id, parallel_group, bank_type)
drawable_items_for_definition(p_definition, p_person, p_cohort, p_learning_assignment)
excluded_items_for_post_test(p_person, p_learning_assignment) -> (item_id, reason)
exam_item_is_cooled(p_item, p_cohort) -> boolean
item_is_drawable(p_item_bank, p_definition_bank) -> boolean
bank_tier_rank(p_bank) -> smallint
```

**Evidence class** — derived, never client-supplied, and **downgrade-only**:
```
derive_evidence_class(p_institution, p_channel) -> evidence_class
effective_evidence_class(p_session)             -> evidence_class
evidence_class_min(a, b) / evidence_class_rank(c)
```

**Content lifecycle, freeze and quality:**
```
content_canonical_payload(p_course) / content_digest / content_field
course_content_sha256(p_course) / content_is_sealed(p_course)
publish_readiness(p_course) -> (status text, blockers text[])
validate_course_content(p_course) -> integer
run_mcq_quality(p_course) -> integer
validate_learner_text(p_text) -> (term_pattern, label, severity, mengapa_penting, cara_memperbaiki)
hint_reveals_answer_shape(p_text) -> boolean          -- the INV-02 check
media_entries_have_transcripts(p_media) / media_entries_are_storage_paths(p_media)
```

**Assignment and ingestion:**
```
move_learning_assignment_release(p_assignment, p_to_release, p_reason) -> uuid
ingest_structured_package(p_batch) -> integer
propose_easy_upload_mapping(p_batch) -> jsonb
can_in_institution(p_capability, p_institution) -> boolean
```

Plus the whole FABLE-01 authorization set (`has_scope`, `can_on_node`,
`is_system_admin`, `current_person_id`, `person_visible_to_me`,
`enrollment_readable`, `membership_readable`, `audit_write`, …).

---

## 4. ⛔ The decision that blocks FABLE-04 — settle it first

**No `OFFICIAL` evidence can exist on this project as currently configured,
and several Phase 4 and Phase 6 acceptance items require it.** **[VERIFIED]**

The measurements:

```
evidence_class_rank:  SYNTHETIC=0  PUBLIC_DEMO=1  PREVIEW=2  OFFICIAL=3
evidence_class_min('SYNTHETIC','OFFICIAL') = 'SYNTHETIC'      -- min(), so override can only DOWNGRADE
institutions where NOT is_synthetic = 0                        -- every tenant is synthetic
evidence_class_overrides rows = 0
```

`derive_evidence_class` returns `SYNTHETIC` for a synthetic tenant, the
effective class is `min(derived, override)`, and the migration is literally
named `evidence_class_monotonic`. So the class can be lowered and never
raised, and with zero non-synthetic institutions nothing can ever be
`OFFICIAL`.

That is **correct, fail-closed design.** It is also a wall:

| Requirement | Phase | Status under the current configuration |
|---|---|---|
| "only `OFFICIAL` evidence can reach ELIGIBLE; PREVIEW/SYNTHETIC/PUBLIC_DEMO never can" | 04 §7 | ✅ the *negative* half is testable today |
| "A certificate issued, then verified after a full process restart, still verifies" | 04 checklist | ❌ **cannot issue a single certificate** |
| "A classroom-card learner can fetch their own certificate" | 04 checklist | ❌ same |
| INV-05 tamper matrix, INV-07 key rotation, INV-30 snapshot | 04 checklist | ❌ all need an issued certificate |
| "An educator briefing renders from `OFFICIAL` seeded session data" | 06 checklist | ❌ |
| Question Health `SIGNAL_RAISED` over `OFFICIAL` evidence | 06 checklist | ❌ |

**Options, none of which should be picked silently: [JUDGEMENT]**

1. **A non-synthetic test institution in non-production only.** The seed
   already refuses to run in `production` and demands
   `app.seed_intent='synthetic'` (INV-21). Add one clearly-named
   non-synthetic tenant under those same guards. Cleanest, but it means a
   tenant whose evidence is `OFFICIAL` exists in dev/CI — write down why
   that is safe and how production is still protected.
2. **Let `evidence_class_overrides` raise the class in non-production.**
   Directly contradicts the monotonic design and the audited-override
   intent. I would not.
3. **A fourth derivation input** (e.g. an explicitly flagged test channel
   that yields `OFFICIAL` outside production). More surface, more to get
   wrong.

Whatever is chosen, it is an **ADR** — it changes what evidence eligibility
means in a test environment, which is an INV-20 concern. And if the
conclusion is that the frozen architecture forbids all three, that is the
**STOP-and-raise** case, not something to improvise around at the moment a
certificate test refuses to go green.

Decide before FABLE-04 starts. FABLE-03 is unaffected — it explicitly wants
`SYNTHETIC` evidence.

---

## 5. Cross-phase traps **[JUDGEMENT unless marked]**

### 5.1 The engine module will trip F01-S03
FABLE-03 §0 says create `lib/assessment-engine/`. FABLE-01's static test
asserts that `from "@/lib/supabase/service"` appears **only** under
`src/app/api/`:
```ts
if (/from\s+["']@\/lib\/supabase\/service["']/.test(text)) {
  c.expect(/^src[\\/]app[\\/]api[\\/]/.test(rel), `${rel} imports the service-role client outside src/app/api/`);
}
```
`open_assessment_session` and `submit_response` are `service_role`-only, so
the engine needs that client. Two clean resolutions: inject the client into
the engine from the route (preferred — keeps the engine pure and the test
untouched), or widen the allow-list to the engine directory and record why.
Decide before the first engine file, not after CI goes red.
**[VERIFIED that the functions are svc-only; static rule quoted from the
tree at `b929c12` — re-read the current `static.test.ts`]**

### 5.2 The scoring-policy registry does not exist yet
FABLE-02 put `engine_version` / `scoring_policy_version` **columns** on
sessions and results. FABLE-04 §4 requires a versioned `scoring_policy`
**registry**. When it lands, any rows written during Phase 3 will carry
version strings pointing at no registry row — decide whether Phase 3 writes
a provisional version that Phase 4 backfills, or Phase 4 creates the
registry with the Phase 3 version as its first entry. The second is
simpler. **[VERIFIED absent]**

### 5.3 Are results portable on transfer?
`record_class_registry` currently marks `assessment_results`,
`assessment_sessions`, `responses` and `presented_items` as
`INSTITUTION_SCOPED`; only `enrollments` and `memberships` are `PORTABLE`.
**[VERIFIED]** Doc 02's record-class definition puts "verified progression,
completed learning evidence, mastery history, credentials where policy
permits" in the *portable* class. Conservative is the right default and may
well be deliberate pending OD-9 — but FABLE-04 issues certificates, and
"does a learner's certificate follow them to School C?" is exactly the
question OD-9 governs. Confirm the current classification is intentional
and record it; do not let it be settled by omission.

### 5.4 Reuse the validator, don't grow a second one
`validate_learner_text` already returns
`(term_pattern, label, severity, mengapa_penting, cara_memperbaiki)`.
FABLE-05 §3 asserts a **Lokasi · Masalah · Mengapa penting · Cara
memperbaiki** response shape — "Lokasi" and "Masalah" are composed by the
caller from the field and the finding. Keep one composer so Studio (Phase
5) and learner assistance (Phase 3 §6) can't drift. Likewise FABLE-03's
"assistance validated against INV-02 before it is served" should call
`hint_reveals_answer_shape`, not a second regex.

### 5.5 CI cost is about to become the bottleneck
Already three full Supabase stack bring-ups per run and an ECR
`toomanyrequests` retry observed at 13 migrations. **[TRANSCRIPT]** At 29
migrations plus Phase 3's end-to-end flow and Phase 4's 17+8 resilience
scenario, this grows badly. Do the two cheap fixes now: gate
`migrations-upgrade-path` on `supabase/migrations/**` changing, and
cache/share one stack across jobs.

### 5.6 Shard the db runner before it becomes unmanageable
One `run_fable01()` returning 21 rows was already large. Add
`selftest/db/fable0N.sql` per phase with its own `run_fable0N()`. Three
files hardcode the FABLE-01 name — `selftest/run.ts` (68, 72, 159),
`.github/workflows/ci.yml` (119–120, 164–165), `package.json` (13) — and
both CI call sites assert on output shape. Each new runner also needs the
CI-01 privilege preamble (`grant usage on schema selftest to authenticated,
anon`; `grant execute` on the role-switch helpers; `revoke all on
run_fable0N() from public`) or it dies on a clean database.
**[VERIFIED line numbers at `b929c12`]**

### 5.7 The `ai-gateway/` boundary opens in Phase 3, narrowly
Reserved and empty since Phase 1. FABLE-03 §6 routes learner assistance
through it — **contracts and provenance only**, no multi-provider routing,
no provider-named schema object (INV-32). Update the boundary README when
it opens so the next reader knows it is no longer empty by design.

### 5.8 Middleware coverage is asserted, not assumed
FABLE-05 §11 says *confirm, don't assume* that server authorization covers
every route added in Phases 3–5 — with the INV-17 / INV-27 asymmetry:
revoking a scope interrupts an active session on the next round-trip; an
assignment window closing does not. Add routes to the proxy's coverage as
they are built, or Phase 5 becomes an audit of three phases at once.

---

## 6. Phase briefs

### FABLE-03 — Learning Experience · 13 acceptance items
The learner product end to end against seeded synthetic content, and the
**one engine** (INV-26) created here and never duplicated. New surface:
onboarding (magic link + classroom card), pre-test, reading map, lesson
player, post-test, results. New machinery: the allow-list sanitizer, the
durable client outbox with idempotency keys, hesitation-triggered
assistance in the Learner Assistance Intelligence Context, server-side
grading and finalize.
**Already available:** draw + INV-24 exclusion + cooling functions,
`open_assessment_session`, `submit_response`, telemetry and integrity
tables, `published_lessons`.
**Must build:** finalize/grading, sanitizer, engine module, all UI.
**ODs:** OD-8 limits which item types get learner UI — build
`MCQ_SINGLE`/`MCQ_MULTI` now, others only where the product owner has
confirmed content. Not blocking.
**Watch:** §5.1 (engine vs F01-S03), §5.4 (reuse the INV-02 check),
`assessment_mode` naming (§2).

### FABLE-04 — Engine completion, resilience, Quick Assessment, certificates · 16 items
Completes the engine across every mode, the full replay contract, the
educator Quick Assessment, integrity signals, and the certificate
cryptographic core with one public verification route.
**Must build:** scoring-policy registry, certificate + identity-snapshot
tables with a keyring from the first migration, verification route.
**ODs:** OD-10 governs what the certificate *presents* (photo, name form) —
the crypto and the snapshot mechanism are settled, the presentation is not.
OD-11 keeps `PUBLIC_DEMO` as an enum value with no public UI.
**Blocked on §4** for every positive certificate test.
**This is a critical-boundary audit** (doc 16 §6), not an ordinary gate.

### FABLE-05 — Studio · 15 items
Where the Phase 1 capability model gets its UI and content stops being
seeded directly. Content Factory (Easy Upload + Structured Package Import),
MCQ Quality coaching, review queue with author ≠ reviewer enforced
server-side, Publish Readiness as one calm state over three separate
underlying checks, Approve & Freeze, publish, assign, release correction
with its three learner groups, plus the Configuration Studio panels
(definition builder, integrity review center, certificate templates).
**Already available:** `publish_readiness`, `run_mcq_quality`,
`validate_course_content`, `propose_easy_upload_mapping`,
`ingest_structured_package`, `move_learning_assignment_release`, freeze
hash functions. Phase 5 is largely **UI over an existing data layer** —
resist rebuilding logic in TypeScript.
**ODs:** OD-10 bounds the certificate template manager; OD-3 still gates
*real* content (the acceptance flow uses a synthetic package).

### FABLE-06 — Intelligence and launch · 12 items
Canonical Metric Catalogue (versioned, PINTAR-owned), Standard Reports,
Institution Report Templates (**metric ids only — never a formula, never
SQL**), the educator and dean surfaces, Question Health signal computation,
the briefings inbox, and the launch-readiness pass including the
**"Friday 10:05" emergency-deployment drill** and the independent final
audit.
**ODs — this is where they bite.** OD-1 (accreditation framework) is
**MUST ASK** before the dean report's competency mapping ships. OD-5
(retention durations) must be answered before the anonymization job is
enabled — until then it stays disabled with no default anywhere. OD-9 keeps
transfer behind policy configuration. OD-11 decides whether any public
surface beyond certificate verification exists.
**Blocked on §4** for briefings and Question Health.
**Note the honesty requirement:** empirical fields stay NULL; no stubbed
realistic-looking numbers; Rasch/IRT stays LATER.

---

## 7. When each open decision actually bites **[VERIFIED against doc 11]**

| OD | Question | Must be answered by |
|---|---|---|
| **OD-3** | Which textbook editions/ISBNs ground V1 content | before **real** content authoring — fixtures proceed without it |
| **OD-8** | Which non-MCQ item types get real content + UI | FABLE-03 §5, partially — registry built regardless |
| **OD-10** | What the certificate presents (photo, name form) | FABLE-04 template / FABLE-05 template manager |
| **OD-1** | Accreditation framework for the dean report | **FABLE-06 §3 — MUST ASK, do not assume a rubric** |
| **OD-5** | Retention durations under Indonesian PDP law | before the retention job is enabled (FABLE-06 §7) |
| **OD-9** | Transfer authorization and consent policy | before transfer is exposed to a real institution |
| **OD-11** | Does Mini-PINTAR ship publicly in V1 | before any public surface beyond verification |

None blocks FABLE-03. OD-10 is the first that touches a build decision.

---

## 8. Standing conventions carried forward

The full list is in `claude/FABLE-02-HANDOFF.md` §6. The ones phases 3–6
break most often:

1. Apply migrations through the management channel, then name the repo file
   with the version the database recorded. Never edit an applied migration.
2. Every migration ends in a terminal `do $$ … raise exception … end $$;`
   verification block.
3. No `USING (true)`. RLS on at creation. `search_path` pinned on every
   `SECURITY DEFINER`.
4. Policy helpers take row **values**; they never re-read the row they
   protect.
5. One append-only `audit_log` — extend the action vocabulary, never add a
   second log. Integrity signals and review decisions are *not* a new log.
6. Every user-facing string through the HLE. Every new lifecycle enum
   introduced by these phases (`FROZEN`, `VALIDATION_FAILED`, `SYNTHETIC`,
   `PUBLIC_DEMO`, `SIGNAL_RAISED`…) is already on `INTERNAL_WORDS` and must
   never reach a learner, educator or dean surface as such.
7. Every new evidence/record table gets a `record_class_registry` row.
8. `integrations/` and `care/` stay closed. `ai-gateway/` opens in Phase 3
   for contracts and provenance only.
9. Expand → compatible deploy → backfill → switch → contract. The
   upgrade-path job is no longer vacuous; it will catch you.
10. Stop-patch-loop: 2–3 cycles of the same failure → stop, root-cause, ADR.
11. Any deviation from a phase prompt's stated instruction is an ADR, not a
    silent divergence.

---

## 9. Definition of done

**Per phase:** every §-requirement implemented; every acceptance item a
manifest id and green; `npm run selftest` **strict** green across *all*
phases so far, zero skips; CI green on a pushed commit; red-ability
demonstrated (a deliberate defect turns the *right* test red for the *right*
reason); the phase's mini audit run per doc 16 §5 with its named dangerous
patterns; ADRs written for every deviation and stop-patch-loop event.

**Phase-specific audit focus:**
- **03** — answer-key leakage including AI contexts, duplicate engine,
  telemetry joins, learner routes without middleware.
- **04** — unversioned scoring, duplicate engines, legacy routes,
  certificate payload coverage, TODO/bypass security. *Critical boundary.*
- **05** — AI direct publication paths, answer-key exposure in Studio
  preview, dummy fallbacks, provider concepts, anonymous uploads.
- **06** — the full doc 16 §5 list, by an **independent** reviewer.

**Final gate (FABLE-06):** every FABLE-00 non-negotiable true *in the
running system*, not in a migration file; the emergency-deployment drill
passed in staging; the independent final audit with zero unresolved
findings; and the "state of the system" doc where every claim is tagged
VERIFIED (naming the test id), NOT YET VERIFIED, or DESIGNED/NOT
IMPLEMENTED. **File presence is never proof of behaviour.**

Carried-over gates that must be closed or accurately recorded before
launch: HA-01 and HA-02 (both Pro-plan, no substitute control), SI-01
(hosted sign-in — ten minutes in a terminal outside any Claude sandbox),
OPS-01 (free-plan auto-pause), and the Layer-3 independent audit.

---

## 10. What not to do

- Do not weaken a requirement to obtain green. An openly recorded gap beats
  a misleading pass.
- Do not stub empirical values with realistic-looking numbers. NULL until a
  legitimate method runs over sufficient evidence.
- Do not build a second engine, a second scorer, a second sanitizer, a
  second log, or a second verification route.
- Do not let a producer's concepts into the schema.
- Do not resolve §4 by improvising when a test refuses to go green.
- Do not treat this document as authority. Verify per §1.
