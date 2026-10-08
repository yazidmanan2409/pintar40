# 01 · System and architecture

**Handoff of PINTAR 4.0 from Claude to Codex. Written 8 Oct 2026, read-only, from branch `claude/awesome-rubin-bqxp6p` = `main` `8202139`. Application code there is the same as `dab5c12`; `aad799b` and `8202139` only add documents.**

This page tells you where things are and which rules govern them. It links the canonical documents and does not copy them. If this page and a canonical document disagree, the canonical document wins. `docs/coordination/README.md` says the same of its own folder.

Every claim cites a path, a commit, a decision (D-nnn), a closure-register row (CR-nn) or a run ID. «NOT FOUND» means the repository was searched and the artifact is not there.

---

## 1. Stack and runtime

| Layer | What is in the repository | Source |
|---|---|---|
| Web app | Next.js `16.3.5`, React `19.2.8`, TypeScript 5, Tailwind CSS 4 through `@tailwindcss/postcss`, all in `src/`. Request gating is done by `src/proxy.ts`, which is Next 16's replacement for `middleware.ts`. Its matcher is at `src/proxy.ts:289-290` and excludes only `_next/static`, `_next/image`, `favicon.ico`, `brand/` and `fonts/`. Public paths are listed at `src/proxy.ts:35`, `:66` and `:210` | `package.json`, `src/proxy.ts` |
| Database | Supabase Postgres. **177 migrations** in `supabase/migrations/`, from `20260912004158_foundation_base.sql` to `20261210100000_a_session_knows_what_it_is_here_to_do.sql` (the L3 Working Context migration). Migration timestamps are ordering keys, not calendar dates: the last one is "2026-12-10" but it landed on 7–8 Oct (commit `9fa8786`) | `ls supabase/migrations \| wc -l` = 177; run 37782586725: staging has 177 of 177 applied |
| Row-level security | 57 migration files contain `enable row level security`. A user's reads and writes go through RLS via `supabaseServer()`. The service-role client is in `src/lib/supabase/service.ts`, guarded by `server-only`. It is used only by route handlers under `src/app/api/` (20 files: sign-in, recovery, activation, asset signed URLs, certificate issue and verification, email) | `src/lib/supabase/server.ts`, `src/lib/supabase/service.ts`; `grep -rl supabaseService src` |
| Edge functions | **None.** There is no `supabase/functions/` directory. `supabase/` holds `config.toml`, `auth-identitas.json`, `migrations/` and `seed/` (6 seed files) | `ls supabase` |
| Email | `nodemailer` over the SMTP settings PINTAR controls (D-057, D-079). The senders are `src/app/api/_email/*.ts`, the templates `src/components/email/*`. Staging has the `PINTAR_SMTP_*` settings (names only; facts run 37782586725) | `package.json`; D-057, D-079 |
| Hosting | Vercel, region `sin1`. Only `main` deploys (`git.deploymentEnabled: {"**": false, "main": true}`, D-062(a)). Staging is project `pintar40-staging` at staging.pintarselalu.com. Production is app.pintarselalu.com and **runs `5b5b68d`, 111 migrations, last released 23 Sep**. That is 661 code files behind `main` | `vercel.json`; `docs/coordination/RELEASES.md:12`; facts run 37782586725 |
| Supabase projects | staging `keijhmdtsgrfvnvocfvk`, production `trtlvibiybwixfumjrrx` | handoff facts; `docs/recovery/projects.json` |
| CI and ops | 45 GitHub workflows in `.github/workflows/`. `ci.yml` has 18 jobs (D-136(a), run 37775379355). `audit-journeys.yml` runs the crawl (job A) and the journeys (job B). `environment-facts.yml` is read-only. The rest cover staging Golden School walks, recovery and backup, and production deploys (`deploy-vercel-production.yml`, `deploy-supabase-production.yml`, main only by D-004) | `ls .github/workflows` |
| Tests | `npm run selftest` (`selftest/run.ts`). The manifest is `selftest/manifest.json`, version 185, with 651 tests. Database suites are `selftest/db/fable01.sql`–`fable22.sql`, plus `fable05t1_quick_canonical.sql` and `fable05t2_evaluation.sql`. The baseline parity check (`npm run baseline:parity`, ADR-0019) also runs as a CI job | `package.json`; `selftest/manifest.json` |

## 2. Code layout

| Path | Holds |
|---|---|
| `src/app/` | App Router surfaces, named in Indonesian. Learner: `belajar`. Teaching: `mengajar`, `edukator`. Leadership: `pimpinan`, `dekan`. Administration: `konfigurasi`, `aktivasi`, `pendataan`, `pemeliharaan`. Content authoring: `studio`. Professional learning: `pengembangan`. Identity and session: `masuk`, `aktifkan`, `akun`, `keluar`, `perangkat`, `terkunci`, `mulai`. Public: `verifikasi`, `id`. Also `lapor` (report a problem), `tur` (tour), `evaluasi`, and `api/` (route handlers). `konteks-actions.ts` holds the chooser's server action. Home routing by role is D-010; it is amended by D-132 C9: several purposes means the chooser |
| `src/components/` | Shared React components and per-surface folders. Examples: `TombolKirim` (submit with acknowledgement), `CangkangPengalaman` (shell), `pelajaran/Halaman.tsx` (the one lesson renderer for the player and the Studio preview, from L4), `koleksi/Penomoran.tsx` (bounded lists, from L4), `KolomRahasia` (the secret field, CR-86) |
| `src/lib/` | Server and domain logic. Each `*-kontrak.ts` file is a pure contract module that selftests drive; its sibling `*.ts` is the server side. Also: `hle.ts` (copy table), `konteks.ts` and `konteks-server.ts` (Working Context), `supabase/` (three clients), `assessment-engine/`, `certificates/` (keyring, signing, verification), `email/`, `xlsx.ts` (workbook import) |
| `src/ai-gateway/`, `src/integrations/`, `src/care/` | Reserved module boundaries (FABLE-01 §10, commit `2c24898`), mostly README stubs |
| `supabase/` | Migrations, seeds, local config |
| `selftest/` | The test harness: `*.test.ts` runners, `db/*.sql` suites, `manifest.json`, fixtures, `plants/` (planted-failure controls) |
| `audit/` | The browser walks: `journey.mjs` (job B), `crawl.mjs` (job A), `c12.mjs`, `staging/golden-school*.mjs`, `ci/proof-reuse.mjs` (E1), `ci/actions-spend.mjs` (CI budget), `restore/` |
| `scripts/` | `dev/` (golden DB, plants, RPC reachability), `recovery/` (#150 backup, escrow, rehearsal, restore bundle), `release/`, `baseline-parity.mjs`, `contoh-buku-kerja.mts` |
| `infra/aws/` | `pintar-backup.json` (#150 off-site backup template) |
| `docs/` | `rebuild/` (frozen baseline 00–16), `adr/` (0001–0024), `coordination/` (decisions, board, briefs, handover, terminology, design), `reports/` (dated status, closure and review reports), `recovery/` (charter, scope inventory, journey catalogue, journey log, #150), `phases/` (FABLE checkpoints and completion reports), `product/` (3.0-era philosophy, voice, design language, handoff), `audit/` and `audits/` (audit records), `deployment/`, `onboarding/`, `implementation-notes/`, `handoff/` |
| `fable-prompts/` | FABLE-00 to FABLE-06 phase prompts, the single copy (ADR-0019; the duplicate in `docs/phases/` was removed in `c556393`) |
| `claude/` | Earlier session records: `PINTAR-4.0-FRONTEND-IMPLEMENTATION-SPEC.md`, UX-1 records |

## 3. Governing architecture documents

**Authority order** (`docs/rebuild/15-FABLE-5.1-START-HERE.md`; `docs/rebuild/REBUILD-READINESS-REPORT.md` §A.1): Dr Gladys → Doctrine and Philosophy → approved decisions → invariants → capabilities → implementation. PINTAR 3.0 is reference material, not authority. In daily work, `docs/coordination/DECISIONS.md` is the canonical decision log. D-135 (8 Oct) makes the approved architecture, grammar, terminology and decisions «implementation authorities, not invitations to debate». It also sets an escalation standard before anyone asks the owner for a ruling.

| Document | Path |
|---|---|
| Baseline freeze record (FROZEN, 2026-09-12) | `docs/rebuild/00-ARCHITECTURE-BASELINE-FREEZE-RECORD.md` |
| Lessons learned (3.0 post-mortem) | `docs/rebuild/01-REBUILD-LESSONS-LEARNED.md` |
| Domain model, invariants (INV-01…INV-38), state machines, authorization matrix | `docs/rebuild/02`–`05` |
| Evidence and telemetry, assessment engine, content versioning | `docs/rebuild/06`–`08` |
| Scope, removed features, open decisions (OD-n), failure modes | `docs/rebuild/09`–`12` |
| ADR template, FABLE crosscheck, start-here, engineering and verification system | `docs/rebuild/13`–`16` |
| Baseline pins (sha256 per document) | `docs/rebuild/BASELINE-MANIFEST.json`; ADR-0019 |
| ADRs | `docs/adr/0001-foundation.md` … `0024-institution-report-configuration.md`. The most relevant to new work: **0013** (verification happens at the API boundary), **0015** (canonical content distribution), **0019** (the baseline is in the repository), **0021** (a new function is closed by construction: `EXECUTE` revoked from PUBLIC, plus a `client_rpc_registry` row) |
| Rules learned from defects | `docs/ENGINEERING-LESSONS.md` (build commentary, not architecture) |
| Process, roles, lanes, the gate | `docs/coordination/README.md` (§5 is the gate, D-012) |

Mismatches inside the freeze record:
- It names `claude/16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md`. The file is at `docs/rebuild/16-…`.
- It cites `claude/FABLE-SYNCHRONIZATION-REPORT.md`. That file is **NOT FOUND in the repository**, on any branch.

### 3.1 The canonical read path

The repository does not use "canonical read path" as a single named term. Two documented rules carry its meaning:

1. **Reads as the person, through RLS.**
   - Pages, route handlers and server actions read through `supabaseServer()`. That client carries the anon key plus the user's session, so «every read/write goes through RLS» (`src/lib/supabase/server.ts`, header comment).
   - The service-role client is only for the operations doc 05 lists (`src/lib/supabase/service.ts`) and is confined to `src/app/api/`.
   - Analytics consumers read eligibility views, not raw tables (INV-20, INV-33; Readiness Report §G scenario 14). The views are `official_*`, `scoped_*` and `service_*`; there are 19 views in the migrations.
   - Every figure comes from one evaluator, `metric_evaluate`, over a versioned metric catalogue (`docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` §1). D-060 adds version discipline: a change in meaning publishes a new catalogue or engine version.
2. **Canonical content (Pustaka PINTAR) is read through distribution accessors, never by tenant bypass.**
   - Canonical content is owned by a `PLATFORM_CANONICAL` tenant.
   - It reaches a school only when `release_is_distributed_to(release, institution)` is true.
   - Studio reads it through `distributed_releases`, `distributed_release_outline` and `distributed_lesson_preview` (`src/app/studio/kanonik/*`, `src/app/studio/pratinjau/[pelajaran]/page.tsx`).
   - See ADR-0015 §4–§6.
   - Since L4, the Studio preview and the learner player render through one component (`src/components/pelajaran/Halaman.tsx`; test L4-P01; `docs/reports/PINTAR-4.0-CLOSURE-L4-2026-10-08.md` §2).

### 3.2 Working Context (L3, D-127, D-132, D-133)

- **The principle** (D-127(a), verbatim in DECISIONS): identity says who the person is; entitlement says what they may do; working context says what they are doing here, in this session, on this device. Context «may narrow presentation and action choices; it must never widen authority».
- **The design:** `docs/reports/PINTAR-4.0-L3-WORKING-CONTEXT-DESIGN-2026-10-07.md`, ruled GREEN WITH MODIFICATIONS by D-132, items C1–C10, §2.11 and both scenarios.
- **The build:** `docs/reports/PINTAR-4.0-CLOSURE-L3-2026-10-08.md`, its addendum, `docs/reports/PINTAR-4.0-L3-BOB19-OPTION-B-EVIDENCE-2026-10-08.md`. L3 is GREEN by D-133, with S23q/CR-52 as the one governed exception.
- **Storage:**
  - The context is a purpose · place pair: `BELAJAR | MENGAJAR | MENGELOLA` × a school or the platform.
  - It lives on the session's own `device_sessions` row, one per Auth session (migration `20261210100000`).
  - There is one writer, `konteks_tetapkan`. It accepts only the caller's current session and only a pair the person holds.
  - `konteks_saya` reads the context back and re-checks it. `konteks_tempat_saya` lists the pairs the person holds.
- **Code:** `src/lib/konteks.ts` holds the pure rules (`rencanaMasuk`, `rencanaHalaman`, `melayani`, `pintuPilihan`). `src/lib/konteks-server.ts` applies them to a request. Its header comment says: «NARROWING ONLY. Nothing here lets anybody do anything».
- **The chooser:** `/` is the only chooser, and visiting it writes nothing (C3). A requested page may set the context only when the session has none and exactly one held pair serves the page (C4). Legacy D-010 ranking never chooses among several purposes (C9).
- **Fail closed:** if the held pairs cannot be read, the chooser offers no door (`tempatSaya`: `error ? []`). This is pinned by F22-A01 (`selftest/app.test.ts`).
- **Not part of the model:** the anonymous sign-out mark is a 4.0 stale-continuation guard (D-132(e)), not part of the enduring Working Context. Evaluation personas stay outside `device_sessions` (C10).
- **Tests:** `selftest/db/fable22.sql`, `selftest/fable22.test.ts` (F22-K01…K06, F22-P01…P05, F22-A01/A02), journeys L3A/L3D and BD11.

### 3.3 The context-bound action guard (D-132(k), §2.11)

- **The rule:** «Every context-bound human action checks that its target belongs to the active context. Authorization remains independently enforced by the database.» There is no fabricated device session for system, import or automation paths.
- **The helpers:** `wajibDalamKonteks`, `sasaranDalamKonteks`, `dalamKonteks`, `halamanDalamKonteks` and `sekolahDari` in `src/lib/konteks-server.ts:136-224`.
- **Coverage:** «53 server actions in 6 files, and the API routes, which refuse in JSON». The guard is strict: no context means refused. L3 report, table row §2.11.
- **Exempt by design:** platform-scoped operations, namely the test email and its history.
- **Tests:**
  - F22-P05 is static and has planted-check bites.
  - F22-K06 asserts that no RLS policy, capability, grant or authorization function reads the context.
- **The database/application boundary:** an active SYSTEM_ADMIN can still grant any school role at the database level. This is standing, audited authority, not a defect. The first-administrator narrowing exists only in server actions (D-133(e); BOB19 evidence §1, §8.2). Do not describe it as database-enforced.

### 3.4 The copy table: `src/lib/hle.ts`

- `src/lib/hle.ts` is the «Human Language Engine» (FABLE-01 §9), 4,834 lines.
- **Rules:**
  - Every user-visible string is a key in this file (D-014).
  - Errors are never shown raw. Server code returns stable codes, and `hle.ts` maps each code to Indonesian and English (D-011).
  - Key names are the contract.
  - Wording is owned by design (Daisy), within Terminology v1 (D-068, which amends D-014).
- **Using approved words:** D-134 allows approved v1 words, *Replace* terms included. A word v1 lacks goes to Dr Gladys's one consolidated register and is never invented (D-135(c)).
- **Semantic keys:** D-132(m) placeholders such as not-held, other-context and choose-place draw nothing until their words exist.
- **Guard:** the Human Interface Boundary guard **L4-G01** (`selftest/l4.test.ts`) fails on database IDs, enums, JSON or raw keys reaching rendered text. It keeps a register of exact-count exceptions (CR-85; L4 report §3, §7 finding 7, N3).
- **Language words:**
  - Terminology v1 is in `docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md`.
  - The polish register is `docs/coordination/ux/UX-POLISH-REGISTER.md`.
  - The voice guide, from the 3.0 era, is `docs/product/PINTAR-VOICE-GUIDE.md`.

### 3.5 Design tokens and `pin-*` classes

| Layer | On `main` | Source |
|---|---|---|
| Token set **v2** (applied) | `:root` custom properties in `src/app/globals.css`, starting with `--pintar-tokens-version: 2`: `--surface-0..2`, `--ink-1..3`, `--line`, `--pintar-primary*` (#245F55), `--status-*`, `--radius-*` and others. Tailwind is mapped onto them (Horizon Review §2, `globals.css:87-117, 218`) | `src/app/globals.css` |
| `pin-*` component classes | 479 distinct `.pin-*` selectors in `src/app/experience.css`, for example `.pin-btn`, `.pin-input`, `.pin-tabs`, `.pin-shell`, `.pin-tautan`. Selftests and the journeys diagnostic select on them, so the prefix is a test contract | `src/app/experience.css`; Daisy's `08-migration.md` «How the pass treats names» |
| Token set **v3** (APPROVED IN PRINCIPLE 5 Oct; **APPLICATION READY verified on `c42fecb`**, D-136(b)) | **Not on `main`.** It is only on `origin/ux-1/daisy-experience` (head `cc96030`), in `docs/coordination/ux/sistem-desain/project/tokens.json` and `design-system.json`, with 11 chapters (`01-colour.md` … `11-validation.md`) and components. `08-migration.md` maps each v2 class to its v3 component. It keeps the `pin-` prefix in the product and v2 token names as aliases until they are unused | `git ls-tree origin/ux-1/daisy-experience -- docs/coordination/ux/sistem-desain` (215 files); `main` has **0 files** under that path |

D-136(c): APPLICATION READY is a design freeze. The application slices in `08-migration.md`, the copy still owed and an NVDA or TalkBack pass are **not yet done**.

## 4. Data model, grouped by domain

The model below is from the `CREATE TABLE` statements across the 177 migrations: 123 distinct tables in `public` and `telemetry`, plus 19 views. A few `DROP TABLE` statements exist, and whether every listed table still exists was not re-checked. The authoritative conceptual model is `docs/rebuild/02-PINTAR-CANONICAL-DOMAIN-MODEL.md`. `src/lib/kesehatan-skema.json` holds the expected schema-health readings, for example `tables_without_rls: 0` and `unclassified_client_rpcs: 0`.

| Domain | Tables |
|---|---|
| Platform and governance | `platform_config`, `platform_environment`, `platform_bootstrap`, `feature_flags`, `audit_log`, `client_rpc_registry`, `public_surface_registry`, `record_class_registry`, `maintenance_windows`, `broadcast_notices`, `support_reports`, `tour_registry`, `person_tour_state`, `doctrine_lexicon` |
| Organisation (D-006: INSTITUTION → hidden FACULTY → Bagian → hidden Reguler → Tingkat → Kelas) | `institutions` (`tenant_kind`, ADR-0015), `org_nodes`, `classes`, `academic_periods`, `school_pass_marks` (D-081, D-088(b)), `readiness_tiers` |
| Person, identity, enrolment, roles | `persons`, `accounts`, `institutional_identities`, `enrollments`, `memberships`, `role_assignments`, `transfers`, `portable_visibility`, `learner_readable_fields`, `person_usernames` |
| Credentials, sign-in, sessions, recovery | `person_pins`, `person_pins_retired`, `account_setup`, `account_activation_grants`, `password_recovery_grants`, `password_write_permits`, `identity_attempts`, `card_reissues`, `card_signin_cooldowns`, `recovery_ladder`, `device_sessions`, `device_contexts`, `email_code_requests`, `email_corrections`, `email_send_limits`, `email_send_log` |
| Content (PLP, versioning, ingestion, quality) | `sources`, `source_versions`, `courses`, `modules`, `lessons`, `items`, `item_options`, `item_type_registry`, `item_type_learner_support`, `learning_objectives`, `misconception_taxonomy`, `plp_releases`, `release_distributions`, `course_revision_notes`, `content_status_transitions`, `ingest_batches`, `ingest_status_transitions`, `import_jobs`, `import_rows`, `mcq_quality_findings`, `coaching_findings` |
| Assignment, assessment and evidence | `learning_assignments`, `learning_assignment_status_transitions`, `learning_assignment_release_moves`, `assessment_definitions`, `assessment_definition_bounds`, `assessment_assignments`, `assessment_assignment_status_transitions`, `assessment_sessions`, `session_status_transitions`, `presented_items`, `presented_item_views`, `responses` (append-only), `assessment_results`, `scoring_policy`, `mode_policy`, `exam_cooling_policies`, `quick_assessment_selections`, `assistance_grants`, `assistance_levels`, `lesson_progress`, `lesson_review_requests`, `lesson_review_items`, `integrity_signals`, `evidence_class_overrides` |
| Question health | `question_health`, `question_health_thresholds`, `question_health_transitions` |
| Certificates | `certificates`, `certificate_templates`, `certificate_identity_snapshots` (INV-30), `certificate_number_counters` |
| Metrics, reports, leadership | `metric_catalogue`, `metric_definitions`, `metric_sources`, `metric_calculator_scope`, `report_templates`, `report_template_metrics`, `report_template_provisioning`, `generated_reports`, `management_decisions`, `briefings`, `briefing_transitions` |
| Anonymous student → educator feedback (ADR-0022, ADR-0023) | `feedback_cycles`, `feedback_cycle_transitions`, `feedback_opportunities`, `feedback_question_sets`, `feedback_questions`, `feedback_question_options`, `feedback_responses`, `feedback_results`, `feedback_thresholds` |
| Human evaluation personas (ADR-0020) | `evaluation_personas`, `evaluation_sessions`, `evaluation_evaluators` |
| `telemetry` schema | `telemetry.assistance_events`, `telemetry.hesitation_events` |
| Views (19) | `official_responses`, `official_results`, `official_sessions`, `academic_certificates`, `academic_responses`, `scoped_*` (8), `service_*` (4), `published_lessons`, `my_profile`, `content_ownership_lineage` |

## 5. Baseline freeze and stress test

| Item | Where | What it says |
|---|---|---|
| **Architecture baseline freeze** | `docs/rebuild/00-ARCHITECTURE-BASELINE-FREEZE-RECORD.md` (last commit `c35e303`, 2026-09-13) | «FROZEN — Approved by the product owner, 2026-09-12». Reconciliation PASS, FABLE sync PASS, contradictions NONE. Frozen: docs 01–16, `REBUILD-READINESS-REPORT.md` v2, FABLE-00–06. The baseline changes only through an ADR (doc 13). Open decisions OD-1, 3, 5, 8, 9, 10 and 11 travel with it. |
| **Stress-test findings** | `docs/rebuild/REBUILD-READINESS-REPORT.md` §G «Stress-Test Report» and §H | 20 scenarios: **17 PASS, 3 PASS WITH CONDITION** (#3 transfer, conditional on OD-9; #13 100k Mini-PINTAR, on OD-11; #18 institution departure, on OD-5); 0 FAIL. Verdict: «READY TO FREEZE». Condition: re-crosscheck FABLE-00–06 before FABLE-01 (doc 14). |
| Enforcement in CI | ADR-0019; `npm run baseline:parity`; `docs/rebuild/BASELINE-MANIFEST.json` | Each baseline document is pinned by sha256. |

The stress test is an **architecture-level** verdict made before any code existed. Later load evidence is separate: the L1 capacity run perf-l1.yml 36964437916 failed the 1,000-student load on staging's Micro tier. D-089 keeps that failure visible, and D-112(d) keeps it unhidden.

## 6. 4.5 / 5.0 architecture-readiness requirements

**No single "approved 4.5/5.0 architecture-readiness requirements" document was found in the repository** (searched `docs/`, the root and every branch's history). What exists:

| Artifact | Status | Path or ID |
|---|---|---|
| Architecture Horizon Review 4.0 → 5.5 (29 Sep, Second Eye, read-only) | Verdict **AMBER**. The roadmap compatibility matrix (§2) covers 4.5 Question Intelligence, weighting, Report Intelligence, Context QR; 5.0 composable workflows and 60-second dashboards; 5.5 plugin API; and themes. «Evidence we must not lose» is §3. Follow-up by Yazid: BOB-35 and BOB-36 opened, D-060 recorded, «nothing from 4.5, 5.0 or 5.5 was ticketed or built» | `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` (commit `c80ffab`) |
| D-060 version discipline | Approved (Yazid) | DECISIONS.md |
| Requirements carried into 4.5/5.0 by decision | D-046 (PASS includes responsive), D-047 (acknowledge every action), D-048(f) (visibility, membership, enrolment and role authority are distinct concepts), D-088(j) (adaptive unusual-access checks are 4.5), D-110 (NO HOSTAGE DATA; self-service export is a 4.5 candidate), D-112(e) (a data-rights model for 4.5 portability) | DECISIONS.md |
| 4.1 intake | D-125: the device handoff and Exam Mode are compatible with 4.0 (GREEN). The canonical 4.1 invariant is D-125(e). Nothing is built in 4.0 | `docs/reports/PINTAR-4.1-DEVICE-HANDOFF-AND-EXAM-BINDING-INTAKE-2026-10-07.md` |
| 4.1 local experience feasibility | A study, not a ruling | `docs/reports/PINTAR-4.1-LOCAL-EXPERIENCE-LAYER-FEASIBILITY-STUDY-2026-10-02.md` |
| Scope guard | D-118(f) and D-121(f): no 4.1, 4.5 or 5.0 work during 4.0 closure | DECISIONS.md |

## 7. Canonical documents to read next (links only)

- Decisions: `docs/coordination/DECISIONS.md` (D-001…D-136). Board: `docs/coordination/BOARD.md`.
- 4.0 scope: `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md` (D-086, frozen target). Release checklist: `docs/coordination/RELEASE-CHECKLIST.md`.
- Identity: `docs/coordination/auth/IDENTITY-4.0.md` (C1–C18, Gates 0–8).
- Journeys: `docs/recovery/PINTAR-4.0-HUMAN-JOURNEY-AND-REALITY-SCENARIO-CATALOGUE-2026-10-01.md`, `docs/recovery/GOLDEN-SCHOOL-CONTRACT.md`, `docs/recovery/JOURNEY-LOG.md`.
- Closure: `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md` (CR-01…CR-94), L1–L4 reports, `docs/reports/PINTAR-4.0-MORNING-HANDOFF-2026-10-08.md`.
- Backup and DR: `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md` (NOT PASS, D-104), `docs/recovery/CLOSURE-PLAN-150.md`, `docs/recovery/EVIDENCE-INDEX-150.md`, `docs/recovery/RUNBOOK-NATIVE-RESTORE.md`.
- History and traceability: `08-HISTORY-AND-TRACEABILITY.md` (this folder).
