# PINTAR 4.0 — Frontend + Experience Implementation Specification

**Role:** Daisy Code 💻🌼 — Experience implementation / repository owner
**Produced:** 2026-09-17
**Purpose:** ground-zero reconstruction evidence for Astra 6.

## Evidence legend

Every claim in this document carries one of these. Where a claim is untagged it
inherits the tag of its section heading.

| Tag | Meaning |
|---|---|
| **OBSERVED** | I read it in the repository at the baseline below, in this session. |
| **DOCUMENTED** | Stated in authoritative project documentation; not independently re-measured by me. |
| **REPORTED** | Supplied by another role/session; verified or not as noted per item. |
| **PRODUCT RULING** | Explicit decision by Yazid 💍 / Sauron 👁️🔥. |
| **RESIDUAL** | Known incomplete, deferred, bounded or unresolved. |
| **PROPOSAL** | Not implemented. Never current state. |
| **NOT ACCESSIBLE FROM THIS SESSION** | Could not be inspected from this container. |

### Standing limits of this session

- **NOT ACCESSIBLE FROM THIS SESSION:** the hosted Supabase project, its data, and
  any runtime/production state. I have the repository only.
- **NOT ACCESSIBLE FROM THIS SESSION:** a local database. The Supabase local stack
  cannot start in this container — `ghcr.io` image blobs answer 403 through the
  agent proxy. Every `db`-runner selftest therefore **skips locally** and was
  observed green only in CI. The local verdict is structurally RED for that
  reason and not because anything failed.
- I did not modify any code, migration, or database for this assignment.

---

# 1. Exact baseline

**OBSERVED.**

| Fact | Value |
|---|---|
| HEAD | `b3bec9f96bc3394fa8b3f9e8660441628429b50e` (`b3bec9f`) |
| HEAD subject | `ux1(siklus): wire the learner journey A→G onto the cleared contracts` |
| Branch | `ux-1/daisy-experience` (identical commit also on `claude/sleepy-fermat-hbmuxl`) |
| Working tree | clean |
| Migration count in repo | **85** `.sql` files under `supabase/migrations/` |
| Selftest manifest contract | `pintar-selftest`, **version 32** |
| Manifest phase string | `FABLE-06 (metric catalogue, reports and templates, question health, briefings) — the final core-build phase` |
| Manifest test count | **190** — `db` 138, `static` 42, `app` 10 |
| Latest observed CI | **run 91**, workflow `ci.yml`, event `workflow_dispatch`, head `b3bec9f`, conclusion **success**, **16/16 jobs green**, including `selftest contract (strict, local stack)` which runs the whole manifest with no skips against a real database |
| Node | v22.22.2 |
| Package manager | npm (no `packageManager` field pinned in `package.json`) |

## 1.1 Lineage relevant to Core and UX slices

**OBSERVED** (`git log --graph`):

```
b3bec9f  ux1(siklus): wire the learner journey A→G onto the cleared contracts   ← Daisy Code, Slice 2 implementation
5feebf9  UX-1 Slice 2: a learner may look at an assessment before opening it    ← Bob, assessment_orientation()
546e88f  merge: UX-1 Experience branch into the Q-12 line for the combined Slice-2 gate
 ├ c7446ba  ux1(siklus): Slice-2 foundations, and the two contract gaps that stop the rest
 ├ a93168f  ux1(bahasa,fakta): stack the facts on a narrow surface, and address the reader as Anda
 ├ a3c5bb8  ux1(brand): record the institution-mark ruling, and guard its boundary
 ├ 2cc72d2  ux1(brand): the official mark, sized by looking at it
 └ 9cffbbe  Add files via upload   ← the official logo binary, uploaded by Yazid
```

The UX-1 work was based on frozen Core baseline
`9b2cc5d1075f21b3d1f61a32a83ba1b07d25a3ba` (83 migrations at that point). Two Core
migrations landed for Slice 2 and moved the count to 85:
`20260920090000_a_learner_can_find_a_quick_assessment.sql` and
`20260921090000_a_learner_can_look_before_committing.sql`.

## 1.2 Framework versions

**OBSERVED** (`package.json`):

Dependencies: `next` **16.3.5**, `react` **19.2.8**, `react-dom` **19.2.8**,
`@supabase/ssr` **^0.12.7**, `@supabase/supabase-js` **^2.116.0**.

devDependencies: `typescript` ^5, `tailwindcss` ^4, `@tailwindcss/postcss` ^4,
`eslint` ^9, `eslint-config-next` 16.3.5, `tsx` ^4.23.13, `jsqr` ^1.4.0,
`server-only` ^0.0.1, `supabase` ^2.117.0, `dotenv` ^17.4.2, `@types/node` ^20,
`@types/react` ^19, `@types/react-dom` ^19.

TypeScript target is **ES2017** — this is load-bearing: the regex `s`
(dotAll) flag is rejected by the compiler and must not be used in repository code
or tests.

---

# 2. Repository topology

**OBSERVED.**

```
src/
  app/                     Next.js App Router. Routes, layouts, API handlers, server actions.
    globals.css            THE TOKEN FILE. :root custom properties + @theme inline + @font-face.
    experience.css         THE COMPOSITION FILE. Every .pin-* class. ~790 lines.
    layout.tsx             Root layout; imports both stylesheets; sets <html lang>.
    _intel.ts              Shared report-rendering helpers for the two ringkasan pages.
    belajar/               LEARNER surface (Slices 1–2).
      actions.ts           Every learner server action.
      _components/         ItemPlayer, LessonPlayer, PermukaanAsesmen.
    studio/                STAFF authoring surface.
      actions.ts           Every Studio server action.
    verifikasi/[token]/    PUBLIC certificate verification.
    api/                   Route handlers (see §3).
  components/              Shared Experience components, none route-bound.
    siklus/                Slice-2 cycle components.
    sertifikat/            Slice-1 certificate components.
    bukti/                 Slice-0 evidence components.
  lib/
    hle.ts                 THE COPY TABLE (Human Language Engine). 395 rows / 418 union members.
    siklus.ts              Pure cycle-position and recommendation derivation.
    assessment-engine/     index.ts + types.ts. The ONLY module that names learner RPCs.
    sertifikat-kontrak.ts  Certificate column list + state predicates. No privileged import.
    sertifikat.ts          Certificate reads (server).
    certificates/verification.ts  Public verification payload shape + TAMPERED constant.
    locale.ts              Server-side locale read (next/headers).
    locale-kontrak.ts      Cookie name + parse. No server import.
    lingkup.ts             Scope picker source (myScopes / resolveScope).
    qr.ts                  Self-contained QR encoder. No dependency.
    auth.ts, env.ts, card.ts, evaluation.ts, supabase/
selftest/
  manifest.json            190 declared cases. THE CONTRACT.
  run.ts                   Runner entry.
  static.test.ts           Static cases; imports ...experienceTests.
  experience.test.ts       ALL UX-1 cases (see §12).
  db/                      SQL cases, including Bob's UX1-S2-ORIENT-01 in fable06.sql.
  lib.ts                   Checks / SelfTest types.
supabase/migrations/       85 .sql files. FROZEN to the Experience layer.
supabase/seed/             00_local_fixtures, synthetic, learning_cycle, official_bootstrap, human_evaluation.
scripts/baseline-parity.mjs  Frozen-document digest check.
claude/                    Session records and rulings (see §14).
  tools/render-screens/    The render evidence harness (stylesheet.mjs, screens.tsx, shoot.mjs).
public/brand/, public/fonts/  Logo binary and four self-hosted woff2 faces + two OFL licences.
```

**Dependency direction (OBSERVED, and it is enforced by tests):**

```
routes/components  →  lib/assessment-engine  →  Supabase RPC
routes/components  →  lib/hle (copy)         →  no I/O at all
routes/components  →  lib/siklus (pure)      →  no I/O at all
```

- `lib/assessment-engine` holds **no privilege and no client of its own**. Every
  function takes an `EngineClient` (an object with `.rpc()`) supplied by the caller.
  Identity is never passed as an argument; it comes from the JWT inside each
  SECURITY DEFINER body.
- Three modules exist **specifically to avoid pulling a server runtime into a client
  bundle**: `locale-kontrak.ts`, `sertifikat-kontrak.ts`, `certificates/verification.ts`.
  Each holds constants/types needed by a client component or a test and has no
  `server-only` or `next/headers` import. Reconstructing these as one module with the
  server code would break the client bundle and defeat static test F01-S03.

---

# 3. Route map

**OBSERVED.** Every route under `src/app`. `ƒ` = dynamic / server-rendered on demand
(from the `next build` output at this baseline; no route is statically prerendered).

## 3.1 Public

| Route | Role | Purpose | Data source | Mutation | Authorization expectation | Slice/status |
|---|---|---|---|---|---|---|
| `/` | public | Entry by purpose. One screen, one question. | `currentViewer()`; HLE | none | none | **PENDING** (declared Slice 2 in the lint's pending list; not re-set) |
| `/verifikasi/[token]` | public | Certificate verification for a stranger. | `GET /api/verifikasi/[token]` | none | none — anonymous by design | Slice 1, re-set |
| `/api/verifikasi/[token]` | public | Five-field closed payload. | `verify_certificate` + service client | none | anonymous; D3b closed payload | Slice 1 |

## 3.2 Auth

| Route | Role | Purpose | Data source | Mutation | Authorization expectation | Slice/status |
|---|---|---|---|---|---|---|
| `/masuk` | public | Magic-link sign-in. | Supabase auth | sends link | none | **PENDING** (Slice 2 declared, not re-set) |
| `/auth/callback` | public | Exchanges the code for a session. | Supabase auth | sets cookie | none | inherited |
| `/keluar` | any | Sign out. | Supabase auth | clears cookie | authenticated | inherited |

## 3.3 Learner (Slice 2 — all re-set at this baseline)

| Route | Role | Purpose | Data source | Mutation | Authorization expectation | Slice/status |
|---|---|---|---|---|---|---|
| `/belajar` | learner | **Screen A** — home. One next action, then quiet. | `my_learning_assignments`, `my_cycle_state`, `learner_lessons`, `my_open_assessments` | none | learner's own; RPCs take no identity | Slice 2 ✅ |
| `/belajar/[tugas]` | learner | **Screen B** — the assignment: trail, current step, reading map. | `my_learning_assignments`, `my_cycle_state`, `learner_lessons`, `reading_map` | none | RPC raises if the assignment is not the caller's | Slice 2 ✅ |
| `/belajar/[tugas]/peta` | learner | Reading-map landing after mapping. | `my_cycle_state`, `reading_map`, `learner_lessons` | none | as above | Slice 2 ✅ |
| `/belajar/[tugas]/pelajaran/[pelajaran]` | learner | **Screen C** — the lesson. | `learner_lessons`, `may_read_lesson_media` | `record_lesson_progress` | assignment-bound inside the RPC | Slice 2 ✅ |
| `/belajar/[tugas]/pemetaan` | learner | **D→E** for the cycle's PRE_TEST. | `my_cycle_state`, then `assessment_orientation` **or** the player reads | `mulaiAsesmen` (form POST) | `may_start_assessment` inside both RPCs | Slice 2 ✅ |
| `/belajar/[tugas]/penguasaan` | learner | **D→E** for the cycle's POST_TEST. | same | same | same | Slice 2 ✅ |
| `/belajar/asesmen/[penugasan]` | learner | **D→E** for an ad-hoc/QUICK assessment (Q-12). | `my_open_assessments`, `assessment_orientation`, **direct read of `assessment_sessions`** | `mulaiAsesmen` | `may_start_assessment`; session read is RLS-scoped to the caller | Slice 2 ✅ |
| `/belajar/[tugas]/hasil` | learner | **Screen F** — result / feedback / observation / evidence. | `my_cycle_state`, `session_outcome`, `session_review`, `learning_delta` | none | `session_is_mine` inside the RPCs | Slice 2 ✅ |
| `/belajar/[tugas]/lanjut` | learner | **Screen G** — what next, and the honest end. | `my_learning_assignments`, `my_cycle_state`, `learner_lessons`, `my_certificate`, `my_open_assessments` | none | as above | Slice 2 ✅ |
| `/belajar/sertifikat` | learner | Certificate list. | direct `certificates` select, ten columns | none | RLS: own rows | Slice 1 ✅ |
| `/belajar/[tugas]/sertifikat` | learner | Certificate detail + A4 print preview. | `my_certificate` | none | `session_is_mine` | Slice 1 ✅ |

## 3.4 Educator / management

| Route | Role | Purpose | Data source | Mutation | Authorization expectation | Slice/status |
|---|---|---|---|---|---|---|
| `/edukator/ringkasan` | educator | Class Learning Intelligence report. | `report_templates` select + `generate_report(p_template, p_scope_node)` | none | `generate_report` = INSTITUTION_MEMBER; **per-metric** re-authorization | **PENDING** (Slice 6 in the lint's list) |
| `/dekan/ringkasan` | dean | Institution report. | same shape | none | same | **PENDING** (Slice 6) |
| `/konfigurasi` | staff | Configuration surface. | direct `role_assignments` ×2 | none | own rows | **PENDING** (Slice 7) |
| `/evaluasi` | any | Demonstration room / persona switching. | `evaluation_hub`, `evaluation_state`, `assume_persona`, `exit_persona` | persona assume/exit | ADR-0020 | **PENDING** (Slice 2 in the list; not re-set) |
| `/api/evaluation/assume` | any | Persona assumption handler. | `assume_persona` | yes | ADR-0020 | inherited |

## 3.5 Studio (staff authoring) — all **PENDING** (Slice 5 in the lint's list)

| Route | Gate observed in source | Purpose |
|---|---|---|
| `/studio` | `studio_home` RPC | Buckets by institution. |
| `/studio/definisi` | `CAN_DRAFT` | Assessment definitions; reads `assessment_definition_bounds`. |
| `/studio/unggah` | `CAN_DRAFT` | Ingestion batches. |
| `/studio/kuis` | `CAN_QUICK_ASSESSMENT` | Quick-assessment launch. |
| `/studio/paket/[course]` | course/release reads | Package state. |
| `/studio/pratinjau/[pelajaran]` | lesson reads | Lesson preview. |
| `/studio/tinjau` | `CAN_REVIEW` | Review queue. |
| `/studio/bank` | `CAN_REVIEW_QUESTION_HEALTH` | Item bank + question health. |
| `/studio/integritas` | `CAN_REVIEW_INTEGRITY` | Integrity signals. |
| `/studio/kanonik`, `/studio/kanonik/[terbitan]` | `CAN_PUBLISH` | Canonical distribution. |
| `/studio/sertifikat` | `CAN_PUBLISH` | Certificate templates. |

## 3.6 Other API handlers

| Route | Purpose | Note |
|---|---|---|
| `/api/assets/read-url` | Short-lived signed URL for lesson media. | Gated by `may_read_lesson_media`. **No public URL exists anywhere in the chain** (INV-15). |
| `/api/assets/upload-url` | Signed upload URL. | Staff path. |
| `/api/certificates/issue` | Service-role issuance. | **PRODUCT RULING V-6a: no learner page imports, calls or links this.** `UX1-S1-CERT-COLS-01` asserts it over the source. |
| `/api/dev/[[...tool]]` | Development tools. | Refuses outside development in its own body; F06-S06 asserts it. |

## 3.7 Re-set vs pending — the declared lists

**OBSERVED.** `selftest/experience.test.ts` carries two arrays,
`RESET_SURFACES` and `PENDING_SURFACES`, and `UX1-S0-TOKEN-01` asserts every
surface under `src/app` and `src/components` is in **exactly one** of them. At this
baseline: **39 re-set**, **20 pending**. Everything under `src/components/` is
re-set by construction. A new surface is in neither list and the test fails until
somebody declares it — that is the property the two-list design exists for.

---

# 4. Frontend-to-database contract map

**OBSERVED.** Every RPC named anywhere under `src/`. All learner RPCs are reached
**only** through `src/lib/assessment-engine/index.ts`; no route calls one directly.

## 4.1 Learner RPCs (exposure `LEARNER` in `client_rpc_registry`)

All are SECURITY DEFINER, take **no identity argument**, and derive the caller from
the JWT via `current_person_id()`. Refusal semantics are uniform: the function
`raise`s and `call()` in the engine converts it to `EngineError`.

| RPC | Arguments | Returns (fields the frontend uses) | Engine fn | Caller | R/W |
|---|---|---|---|---|---|
| `my_learning_assignments` | none | `learning_assignment_id, course_id, plp_release_id, subject, stage, grade_label, title, pre_test_assignment, post_test_assignment` | `myAssignments` | A, B, C, F, G | R |
| `my_cycle_state` | `p_learning_assignment` | `pre_assignment, pre_session, pre_status, post_assignment, post_session, post_status` | `cycleState` | A, B, D-routes, F, G | R |
| `learner_lessons` | `p_learning_assignment` | `lesson_id, modul, urutan, judul, ringkasan, isi, contoh, media, halaman, furthest_position, total_positions` | `lessons` | A, B, C, G | R |
| `record_lesson_progress` | `p_learning_assignment, p_lesson, p_position, p_total` | integer (never-regressing furthest) | `recordProgress` | C via `saveLessonProgress` | W |
| `reading_map` | `p_session` | `peringkat, tingkat, kode, pernyataan, modul, pelajaran, halaman, alasan` | `readingMap` | B, peta | R |
| **`my_open_assessments`** | none | `assessment_assignment_id, mode, title, node_id, node_name, item_count, opens_at, closes_at` | `openAssessments` | A, G, ad-hoc route | R |
| **`assessment_orientation`** | `p_assessment_assignment` | `mode, title, item_count, allows_pause, hesitation_window_seconds, opens_at, closes_at, attempt_limit, attempts_used` | `orientation` | `PermukaanAsesmen` (Screen D) | R |
| `may_start_assessment` | `p_assessment_assignment` | `ok, reason` | `mayStart` | **no current caller** (see §11) | R |
| `start_learning_session` | `p_assessment_assignment` | session uuid | `startSession` | **only** `mulaiAsesmen` | **W — COMMITS** |
| `session_state` | `p_session` | `status, mode, allows_pause, authoritative_deadline, started_at, submitted_at, item_count, answered_count, hesitation_window_seconds, stage` | `sessionState` | `PermukaanAsesmen` (Screen E) | R |
| `session_paper` | `p_session` | `presented_item_id, posisi, muatan` | `paper` | Screen E | R |
| `session_answers` | `p_session` | prior receipts, `client_seq`, `posisi` | `answersSoFar` | Screen E | R |
| `record_answer` | `presented_item_id, client_seq, value, receipt_mode, client_asserted_at` | outcome | `answer` | ItemPlayer | W (append-only, INV-28) |
| `note_item_view` | `p_presented_item` | server-stamped first-view time | `noteItemView` | ItemPlayer | W |
| `assistance_state` | `p_presented_item` | `windowSeconds, dwellSeconds, due, stage, answered, highestOpen, nextLevel` | `assistanceState` | ItemPlayer | R |
| `open_assistance` | `p_presented_item, p_level` | `level, kode, isi, stage` | `openAssistance` | ItemPlayer | W (records the grant) |
| `dismiss_assistance` | `p_presented_item` | — | `dismissAssistance` | ItemPlayer | W |
| `pause_session` / `resume_session` | `p_session` | — | `pause` / `resume` | ItemPlayer | W |
| `finish_my_session` | `p_session` | result id | `finish` | ItemPlayer | **W — COMMITS** |
| `session_outcome` | `p_session` | `penguasaan, per_domain, ringkasan, diagnostik, gerbang_keselamatan, lulus, ambang` | `outcome` | F | R |
| `session_review` | `p_session` | `posisi, stem, benar, jawaban_teks, alasan, arah, is_safety_critical` | `review` | F | R |
| `learning_delta` | `p_learning_assignment` | `status ∈ LENGKAP\|BELUM_ADA\|BARU_PEMETAAN\|BARU_PENGUASAAN, awal, akhir, selisih` | `delta` | F | R |
| `my_certificate` | `p_session` | `certificate_id, certificate_number, verification_token, status, issued_at_iso, predikat, name_as_issued` — **seven fields, no key material** | `myCertificate` | cert detail, G | R |
| `session_is_mine` | `p_session` | boolean | — | ownership predicate used inside other RPCs | R |
| `may_read_lesson_media` | `p_path` | boolean | — | C, directly via `supabase.rpc` | R |
| `record_integrity_signal` | session, category, … | — | `recordIntegritySignal` | **no current caller in a learner page** | W |

**Sanitization (OBSERVED, and it is a hard boundary).** `session_paper` projects
through `item_type_registry.sanitizer_allowlist`; the engine's `sanitize()`
re-applies the same allow-list client-side. `LEARNER_ITEM_KEYS = ["item_type",
"stem", "stimulus", "opsi"]`. `ANSWER_KEY_FIELDS` (`is_correct`, `rationale`,
`misconception_code`, `petunjuk`, `arah_berpikir`, `label`, `objective_ids`,
`predicted_difficulty`, `empirical_difficulty`) must never appear in a learner or
assistance payload (INV-01, INV-31). Options carry a display `posisi`, **never the
authored label**, so the shuffle cannot be undone by reading the DOM.

## 4.2 Direct table reads from the frontend (RLS-dependent)

**OBSERVED.** These bypass the RPC layer and rest on Row-Level Security.

| Table | File | Purpose | RLS that scopes it |
|---|---|---|---|
| `certificates` | `src/lib/sertifikat.ts` | Certificate list, **exactly `LIST_COLUMNS`** | own rows |
| `certificate_templates` | `src/lib/sertifikat.ts` | Layout row | `CAN_PUBLISH`-gated — **RESIDUAL, see §14** |
| `institutions` | `src/lib/sertifikat.ts`, `src/app/studio/_lib.ts` | Names | membership |
| `assessment_sessions` | `src/app/belajar/asesmen/[penugasan]/page.tsx` | Find the caller's session for an ad-hoc assignment — two columns (`id, status`) | `person_id = current_person_id()` **or** `CAN_REVIEW_INTEGRITY` **or** `CAN_ASSIGN_LEARNING` in the institution |
| `org_nodes`, `classes` | `src/lib/lingkup.ts` | Scope picker | `is_member_of_institution` — institution-wide |
| `role_assignments` | `src/app/konfigurasi/page.tsx` ×2 | Own roles | own rows |
| `courses`, `plp_releases`, `ingest_batches`, `items`, `question_health`, `integrity_signals`, `lessons`, `learning_objectives`, `mcq_quality_findings`, `learning_assignments`, `assessment_definitions`, `assessment_definition_bounds`, `assessment_assignments`, `modules` | Studio pages/actions | authoring | capability-gated RLS |
| `report_templates` | both `ringkasan` pages | find the standard template | institution |

**RESIDUAL.** The ad-hoc session lookup is the one place a *learner* surface reads a
table instead of asking a contract. There is no RPC mapping an assessment assignment
to the caller's session. It cannot widen (RLS scopes it), but it is a contract gap.

## 4.3 Staff RPCs called from Studio

**OBSERVED**, all via `src/app/studio/actions.ts`: `create_course_revision`,
`validate_course_content`, `acknowledge_finding`, `publish_release`,
`withdraw_release`, `grant_release_distribution`, `withdraw_release_distribution`,
`move_learning_assignment_release`, `propose_easy_upload_mapping`,
`ingest_structured_package`, `save_assessment_definition`,
`record_integrity_review`, `record_question_health_review`,
`save_certificate_template`, `launch_quick_assessment`, `run_mcq_quality`,
`studio_home`, `studio_package_state`, `distributed_releases`,
`distributed_release_outline`, `distributed_lesson_preview`,
`certificate_prepare`, `certificate_seal`, `grant_role`, `revoke_role`,
`period_rollover`, `platform_schema_lint`, `transfer_*`, `generate_report`.

---

# 5. Learner A→G implementation

**OBSERVED.** Every learner page is a **React Server Component**. Only three
components are `"use client"`: `ItemPlayer`, `LessonPlayer`, `PengalihBahasa`
(the language switch). The client boundary exists exactly where interaction and
local durability require it and nowhere else.

Common to every screen: `CangkangPengalaman` (shell) at the top, `KakiPintar`
(provenance footer) at the bottom, `<main className="pin-col">` between,
`export const dynamic = "force-dynamic"`.

## A — `/belajar` · home

- **Files:** `src/app/belajar/page.tsx`; `components/siklus/JejakSiklus.tsx`,
  `KartuTugas.tsx`.
- **Reads:** `myAssignments` → per assignment `cycleState` + `lessons` in parallel →
  `openAssessments`.
- **Derivation:** `posisi(state, lessons)` then `peringkat(kandidat)` from
  `src/lib/siklus.ts`. `berjalan` is true when a pre- or post-session exists and is
  not `FINALIZED`.
- **Sections:** the one-thing panel (`.pin-lanjut`, the only element on the primary
  ground), "Perlu perhatian", "Pembelajaran Anda", "Bisa dikerjakan sekarang".
  **Sections 2 and 4 are absent entirely when empty** — honest absence, never an
  empty container.
- **Refusal:** no viewer → `redirect("/masuk?lanjut=/belajar")`.

## B — `/belajar/[tugas]` · the assignment

- **Files:** `src/app/belajar/[tugas]/page.tsx`; `JejakSiklus`, `PetaBacaan`.
- **Reads:** `myAssignments` (membership check → `notFound()` if absent), then
  `cycleState` + `lessons`; `readingMap(pre_session)` **only** when
  `pre_status === "FINALIZED"`.
- **Derivation:** `posisi`; the next unread lesson is `lessons.find(l => !lessonRead(l))`.
- **Tier enum never reaches the screen**: `PetaBacaan` maps
  `PERLU_SEGERA|WAJIB|DISARANKAN|KUAT` → `map.tier.*` HLE keys. Only the first
  non-`KUAT` card is drawn heavier.

## C — `/belajar/[tugas]/pelajaran/[pelajaran]` · the lesson

- **Files:** page + `_components/LessonPlayer.tsx` (client).
- **Reads:** `lessons`; per media entry `may_read_lesson_media(path)` → a
  `/api/assets/read-url?path=…` reference, **never a public URL**.
- **Writes:** `saveLessonProgress` → `record_lesson_progress` (never-regressing).
- **Copy:** the learner is told once, quietly (`lesson.saved`), and never asked to save.

## D — orientation · `PermukaanAsesmen` with `sesi === null`

- **Files:** `_components/PermukaanAsesmen.tsx`; `components/siklus/OrientasiAsesmen.tsx`.
- **Read:** `assessment_orientation(penugasan)`.
- **Refusal:** a **null orientation renders `HalamanPenolakan`** — the single refusal
  page — never a disabled orientation. The RPC is gated by the same
  `may_start_assessment()` the start is gated by, so "may not start" and "does not
  exist" arrive at the same page in the same state.
- **Facts shown:** `item_count` and `closes_at`. **No duration.**
- **Affordances:** flag always; pause only when `allows_pause`; assistance only when
  `hesitation_window_seconds != null`.
- **Q-15** rendered as a quiet paragraph on the well (`.pin-catatan`), never an alert.

## E — the player · `PermukaanAsesmen` with a session

- Shell switches to `kind="focus"`: mark and language, **no tabs**.
- **Reads:** `paper`, `answersSoFar`, `sessionState` in parallel; prior receipts are
  folded into `accepted` and `seqs`.

## F — `/belajar/[tugas]/hasil` · the result

- **Guard:** `notFound()` unless `post_session && post_status === "FINALIZED"`.
- **Reads:** `outcome`, `review`, `delta`, `myAssignments` in parallel.
- **Four things kept apart:** result (the figure) · feedback (the sentence) ·
  observation (`per_domain` counts) · evidence (the reviewed items).
- **A number never stands alone:** the percentage is followed by
  `benar / review.length` and `outcome.ambang`, all from the engine.
- A wrong **safety-critical** item is `open` by default.

## G — `/belajar/[tugas]/lanjut` · what next

- **Reads:** `myCertificate(post_session)`, every other assignment's `cycleState` +
  `lessons` (ranked by the same `peringkat`), `openAssessments`.
- The certificate row appears only when `rendersCredential(status)` is true —
  **Slice 1's experience reused; this page never issues (V-6a).**
- **The honest end:** when nothing is open, a designed state says so and stops.

## 5.1 LOOKING ≠ COMMITTING — the architectural proof

**PRODUCT RULING (2026-09-17) + OBSERVED.**

1. **No page under `src/app` calls `startSession` or `start_learning_session` while
   rendering.** Asserted mechanically over every `page.tsx` by `UX1-S2-MELIHAT-01`.
2. **The only thing that creates a session is `mulaiAsesmen`**, a server action
   invoked by `<form action={mulaiAsesmen}>`. It is a **POST**, deliberately: a link
   is prefetched by the router, pre-rendered by the browser and brushed by a thumb
   on a scroll, any of which would silently spend the one attempt a PAPER assessment
   allows.
3. `assessment_orientation()` is `stable`, inserts nothing and spends no attempt
   (Bob's terminal verification `UX1-S2-ORIENT-01` in `selftest/db/fable06.sql`,
   **REPORTED by Bob, OBSERVED by me in the SQL**).
4. **History, preserved:** before this baseline both `pemetaan/page.tsx` and
   `penguasaan/page.tsx` called `engine.startSession()` in their render path.
   Arriving at the URL *was* the commitment, and Q-15 could not be shown before the
   thing it discloses about. That is the defect the rule prevents returning.

---

# 6. Assessment architecture

**OBSERVED.**

## 6.1 Modes and the one player

`assessment_mode` includes `PRE_TEST`, `POST_TEST`, `QUICK`, `PRACTICE`,
`STANDALONE`, `TEST`, `EXAM`, `PUBLIC_DEMO`. The frontend collapses these into a
single **`ItemPlayer`** with a two-value prop: `mode: "PEMETAAN" | "PENGUASAAN"`.

- `PEMETAAN` (diagnostic): dots instead of a progress bar, **no pass/fail wording
  anywhere on the screen or its result**, no rationale, no pause, no navigator.
- `PENGUASAAN` (formal): counting-up elapsed timer, pause where the definition
  allows it, flag-for-review, question navigator, no auto-advance.

**Negative rule:** there is one player and one scorer. Building a second of either
is forbidden; `INV-26` and a static check exist to catch a duplicate engine.

## 6.2 Three entry points, one experience

`PermukaanAsesmen` is reached by `/belajar/[tugas]/pemetaan`,
`/belajar/[tugas]/penguasaan` and `/belajar/asesmen/[penugasan]`. Each supplies
`penugasan`, `sesi`, `eyebrow`, `kembali`, `diriHref`, `selesaiHref`, `mode`. They
differ in **bounds**, not in player.

## 6.3 Session lookup and resumption

- Cycle routes get the session from `my_cycle_state` (`pre_session` / `post_session`).
- The ad-hoc route has **no RPC for this** and reads `assessment_sessions`
  (`id, status`, newest first, limit 1). A `FINALIZED` row is treated as *no session*
  so the player never offers to re-answer a submitted paper.
- Resumption is server state. The player re-reads the server on mount and replays its
  outbox; **session state is never reconstructed locally.**

## 6.4 The outbox (resilience)

Every answer is written to a durable `localStorage` outbox keyed
`pintar.outbox.<sessionId>` → `(presentedItemId, clientSeq, value)` **before** it is
sent, and removed only on server acknowledgement. On mount — refresh, reconnect,
returning tab — the component re-reads the server's state and replays what the outbox
still holds. `INV-28` makes replay safe: the same key and payload is acknowledged,
not duplicated. Receipt modes: `LIVE` | `REPLAYED` | `LATE_SYNC`.

## 6.5 Assistance ladder

**The client never decides when help is due.** It reports that the learner is looking
at a question (`note_item_view`) and asks the server (`assistance_state`), whose clock
started when the server first issued the item. The pill appears only when the server
says the window has passed. Offline, the ask fails and **nothing is offered — which is
the required behaviour, not a degradation.** `open_assistance` returns one level and
carries no answer key.

## 6.6 Bounds known to the frontend

**PRODUCT RULING, frozen:** hesitation window 3–120 s; item count 3–60; QUICK 3–20;
QUICK late-sync grace 300 s; PAPER attempt limit 1.

The frontend **does not enforce these** — they live in `assessment_definition_bounds`
(readable by any authenticated person) and in the definition. The frontend reads
`allows_pause` and `hesitation_window_seconds` from `assessment_orientation` and
renders affordances accordingly.

## 6.7 Attempt semantics

`assessment_orientation` returns `attempt_limit` and `attempts_used`.
**RESIDUAL (product fidelity):** the current Screen D renders **neither**. A learner
approaching their only PAPER attempt is not told it is their only one. The data is
present; the presentation decision has not been made. Not a defect in the contract.

## 6.8 Q-15 emission

**PRODUCT RULING, verbatim, both languages, key `siklus.catatan.isi`:**

> ID: *"Selama asesmen, aktivitas sesi tertentu dapat dicatat untuk menjaga integritas proses. Catatan ini merupakan observasi dan tidak menentukan hasil Anda secara otomatis."*
> EN: *"During the assessment, certain session activity may be recorded to support process integrity. These records are observations and do not automatically determine your result."*

Emission rules, all asserted by `UX1-S2-MELIHAT-01`:
- byte-for-byte identical to the ruling in both languages;
- `dicatat` / `recorded`, never `dipantau` / `monitored`;
- no webcam, camera, microphone, screen recording, keystroke or surveillance word;
- no category list, no device named;
- rendered on the well (`.pin-catatan`), **never** `role="alert"`, and `.pin-catatan`
  must carry no border and no attention/blocked colour;
- **absent from `ItemPlayer`** — a disclosure after the commitment is not a disclosure.

## 6.9 Explicit negative rules

- No client-side scoring, ever. Nothing on the client computes correctness.
- No second item player, no second scorer, no second assessment lifecycle.
- No invented assessment states.
- No hidden authorization: the frontend never asks `may_start_assessment` to decide
  what to show; the RPCs ask it themselves.
- The frontend adds no recommendation of its own on the result — the direction under a
  wrong answer is the item's own `arah`.

---

# 7. Certificate implementation

**OBSERVED.**

## 7.1 The ten columns (Q-11)

`src/lib/sertifikat-kontrak.ts`:

```
LIST_COLUMNS = "id, session_id, institution_id, certificate_number,
                verification_token, status, issued_at_iso, revoked_at,
                revoked_reason, supersedes_certificate_id"
```

**PRODUCT RULING Q-11:** the certificate list reads exactly these ten and no other.
`signature`, `key_version`, `canonical_payload` and `snapshot_id` are **named nowhere
on a learner surface**. `UX1-S1-CERT-COLS-01` asserts the source contains exactly one
`.from("certificates").select(...)` and that it uses this exported constant rather
than a second list written inline.

`my_certificate(p_session)` returns **seven** fields: `certificate_id`,
`certificate_number`, `verification_token`, `status`, `issued_at_iso`, `predikat`,
`name_as_issued`. No key material.

## 7.2 States

`CertificateStatus = "ELIGIBLE" | "ISSUED" | "REVOKED" | "SUPERSEDED"`.

- `rendersCredential(s)` → `s !== "ELIGIBLE"`.
- `rendersVerification(s)` → `s === "ISSUED"`.

**While ELIGIBLE, six things are suppressed**: the QR code, the verification link,
the copy-link action, the print action, the certificate number and the name-as-issued.
Reason (OBSERVED, hosted, 2026-09-16): `certificate_prepare` creates the row as
ELIGIBLE with token, number and identity snapshot **already assigned**, and
`verify_certificate` refuses an ELIGIBLE token — so a link shown in this state would
send a stranger to "not found" for a certificate the learner was just shown as real.
`UX1-S1-CERT-ELIGIBLE-01` asserts the branch order: the pending state returns before
any of the six is built.

**PRODUCT RULING V-6a:** the lifecycle does not issue. No learner page calls
`/api/certificates/issue`. Under V-6a, **ELIGIBLE is the default state a learner
meets, not an edge case**, and Slice 1 must never be represented as end-to-end complete.

## 7.3 Components and routes

`components/sertifikat/`: `KartuSertifikat` (screen + sheet variants),
`LembarA4` (the paper), `KodeVerifikasi` (the QR block), `SalinTautan`, `AksiCetak`.

## 7.4 QR

`src/lib/qr.ts` — **self-contained, no dependency, no image service**. A code fetched
from a third party would mean a URL carrying a learner's verification token leaves
PINTAR every time a certificate is rendered. Byte mode, ECC level **M**, smallest
fitting version (1–10), ISO/IEC 18004. `UX1-S1-QR-01` encodes a real verification link,
decodes the matrix back with **jsQR** and fails unless the text round-trips, at three
lengths and therefore three symbol versions; an input past capacity is refused rather
than silently truncated.

**History, preserved:** two encoder defects were found only by round-tripping through
an independent decoder — (1) the version-info BCH generator written as a 10-bit
truncation of the 13-bit `0x1F25`; (2) the data walk deriving direction from column
index parity, which desynchronised at the column-6 skip. Both were invisible to visual
inspection.

## 7.5 A4 print

794 × 1123 px = 210 × 297 mm at 96 dpi. The sheet **never reflows** — it is scaled
whole, `transform-origin: top left`, scaling computed in a `useEffect`. Under
`@media print`, `.pin-noprint` is hidden, the well loses its ground and one A4 leaves
the printer.

**PRODUCT RULING:** the A4 credential is **unbranded**. `KakiPintar` (the PINTAR
provenance footer) renders on no surface that can reach a printed page; the credential
card never renders it at all. A printed certificate carries its **issuing
institution's** identity — a software vendor's mark on the same sheet would be a
second claimant to the provenance of the evidence. `UX1-S1-KAKI-01` and
`UX1-BRAND-01` assert this.

## 7.6 Public verification

`VerificationResponse` is a **closed five-field payload (D3b)**:
`pass, predikat, institution, date, validity`. Adding a field is a D3b change.
`TAMPERED = "TIDAK SAH"` is the verifier's verdict when the recomputed HMAC does not
match the stored signature — **no certificate row ever carries it**;
`certificate_status` is only the four states above. `validity` can only be
**downgraded** by the verifier.

The public shell (`CangkangPengalaman kind="public"`) carries the wordmark, the page
name and **no navigation**: a verification page that offered a way into PINTAR would
invite somebody who came to check a certificate to go looking at something else.

**RESIDUAL:** a **replacement certificate has no learner-side detail read**. Nothing
in the schema ever writes a non-null `supersedes_certificate_id` — there is no reissue
function — and by `certificates_one_root_per_session` a replacement is the root of no
session, so `my_certificate` can never return it. The banner opens the replacement's
public verification page instead. **Belongs with V-6a as Bob's**, not as a UX-1 change.

---

# 8. Educator reconnaissance

**OBSERVED.** Measured against the 85 migrations at this baseline, read-only, on
2026-09-17. Nothing here was repaired.

## 8.1 EDUCATOR capabilities

`role_capabilities()` — `supabase/migrations/20260912004158_foundation_base.sql:51–66`:

```
EDUCATOR → ['CAN_DRAFT', 'CAN_ASSIGN_LEARNING', 'CAN_QUICK_ASSESSMENT']
```

Not held: `CAN_REVIEW`, `CAN_PUBLISH`, `CAN_FREEZE_RELEASE`,
`CAN_REVIEW_QUESTION_HEALTH`, `CAN_REVIEW_INTEGRITY`, `CAN_MANAGE_REPORT_TEMPLATES`,
`CAN_AUTHORIZE_TRANSFER`. For reference: `HEAD_OF_DEPARTMENT` adds `CAN_REVIEW`,
`CAN_FREEZE_RELEASE`, `CAN_REVIEW_QUESTION_HEALTH`, `CAN_REVIEW_INTEGRITY`;
`INSTITUTION_ADMIN` and `SYSTEM_ADMIN` hold all ten; `DEAN` and `STUDENT` hold none.

## 8.2 The two predicates — the subtree/institution asymmetry

| Predicate | File | Containment |
|---|---|---|
| `has_scope(min_role, node)` | `20260912004431_authorization.sql:51–73` | `v_jalur @> array[ra.scope_node_id]` — **ancestor-or-self: SUBTREE** |
| `can_on_node(cap, node)` | `20260912004431_authorization.sql:76–93` | same containment — **SUBTREE** |
| `can_in_institution(cap, inst)` | `20260912112712_content_hierarchy.sql:50–68` | only `n.institution_id = p_institution` — **INSTITUTION-WIDE** |
| `person_visible_to_me(person)` | `20260912004431_authorization.sql:117–136` | via `has_scope('EDUCATOR', m.node_id)` — **SUBTREE** |
| `is_member_of_institution(inst)` | `20260912004431_authorization.sql:98–112` | any active role or non-cancelled enrolment — **INSTITUTION-WIDE** |

## 8.3 V2 — exact asymmetry

**REPORTED** as "assignment authorization is believed to be institution-level rather
than target-node/subtree constrained." **OBSERVED: confirmed, and it is asymmetric —
the platform has both predicates and uses the wrong one in the assignment path.**

Correctly subtree-bound:

- `launch_quick_assessment(p_node, …)` → `can_on_node('CAN_QUICK_ASSESSMENT', p_node)`
  — `20260916110000_quick_assessment_over_canonical.sql:76–77`.
- `memberships_select` → `has_scope('EDUCATOR', node_id)` — `:326–329`.
- `persons_select` / `enrollments_select` → `person_visible_to_me()` — `:308, :318`.

Institution-wide where a node check was expected — **each of these is V2**:

| Site | Evidence |
|---|---|
| Assignment activation | `enforce_assignment_status()` → `can_in_institution('CAN_ASSIGN_LEARNING', v_inst)`; **`new.node_id` is never consulted** — `20260912201500_assignments_and_ingestion.sql:153–159`. The trigger serves **both** `learning_assignments` and `assessment_assignments`. |
| `open_briefing(p_node)` | `can_in_institution('CAN_ASSIGN_LEARNING', v_inst)` — `20260918180000_briefings.sql` |
| `move_learning_assignment_release` | `20260912201500:190–191` |
| `extend_session_deadline` | `20260914094500_resilience_late_sync_termination.sql:243–244` |
| `assessment_sessions_select` | `20260912133821_evidence_session_root.sql:331–334` |
| `assessment_results_select` | `20260912140823_evidence_response_result.sql:226–229` |
| `lesson_progress_select` | `20260913093000_lesson_progress_and_assistance.sql:96–98` |
| `learning_assignments` / `assessment_assignments` / `ingest_batches` select+insert+**update** | `20260912201500:398–425` |
| `metric_evaluate()` | authorizes on `ra.institution_id = p_institution` with **no containment check between the caller's scope and `p_node`** — `20260918110000_metric_evaluator.sql:430–436` |

**The shape for an Experience designer:** *who* an educator can see is subtree-bound;
*what those people did* is institution-wide. Rosters narrow correctly; evidence does
not. Any screen premised on "these are mine" is filtered by the application, not by
the database. PINTAR can show it; PINTAR cannot currently promise it.

**Already-shipped consequence:** `src/lib/lingkup.ts` builds the scope picker from
`org_nodes` + `classes`, both `is_member_of_institution` — so it currently offers an
educator **every** class in the school.

## 8.4 CAN SEE / CAN DO / CAN COMMIT / CANNOT CURRENTLY DO

**CAN SEE**
- The people in their own classes — subtree.
- Every learner's sessions, results and lesson progress in the whole institution — V2.
- The org chart and class list — institution-wide.
- Their own `role_assignments`, therefore their own scope nodes (`:336–338`). This is
  the anchor a trustworthy "my classes" list would be built from.
- Seven metrics via `generate_report` (§8.6).

**CAN DO** (reversible / nothing a learner sees)
- `create_course_revision`, `ingest_structured_package`, `propose_easy_upload_mapping`,
  `run_mcq_quality`, `save_assessment_definition`, `validate_course_content` — all
  `CAN_DRAFT`.
- Read a briefing: `briefings` is node-scoped with `state ∈ COLLECTING, GENERATING,
  READY, REVIEWED, ARCHIVED` and its own `have` / `needed` sufficiency counters —
  `20260918180000_briefings.sql:28–71`.

**CAN COMMIT**
- `launch_quick_assessment(p_node, p_module, p_item_count, p_minutes)` — the **one
  educator commitment that is correctly node-bound**.
- Activate a learning assignment — institution-bound (V2).
- `open_briefing`, `review_briefing(p_briefing, p_archive)`, `advance_briefing`,
  `extend_session_deadline`, `move_learning_assignment_release` — all
  `CAN_ASSIGN_LEARNING`, institution-bound.

**CANNOT CURRENTLY DO — refused by capability**
Publish/withdraw a release · review another author's course · see question health or
item statistics · see integrity signals or terminate a session · issue or revoke a
certificate · save a report template · authorize a transfer · grant or revoke a role.

**CANNOT CURRENTLY DO — no contract exists**
- "Which classes do I teach?" — derivable from own role rows, exposed by nothing.
  **No `my_*` RPC carries STAFF exposure in `client_rpc_registry`.** The learner side
  has `my_learning_assignments()` and `my_open_assessments()`; the educator side has
  no equivalent.
- "Which of my learners need attention?" — no educator-facing roster-with-progress read.
- Narrow any learner-evidence read to a class.

## 8.5 The quick-assessment loop (complete, today)

`launch_quick_assessment` → `my_open_assessments()` → `assessment_orientation()` →
the Slice-2 player. Authority correct at every step, bounds declared, learner half
already built. **This is the one educator journey buildable end to end with no caveat.**

## 8.6 Evidence and metrics

`metric_definitions` — `20260918100000_metric_catalogue.sql:288–322`. Authorization is
by `allowed_audiences app_role[]`; suppression by `minimum_sample`.

| metric_id | scope | minimum_sample | visualizations |
|---|---|---|---|
| `class.participants` | CLASS | 1 | hero_stat |
| `class.comprehension` | CLASS | 5 | hero_stat, bar |
| `class.net_gain` | CLASS | 5 | hero_stat, bar |
| `class.readiness_distribution` | CLASS | 5 | distribution |
| `class.topic_mastery` | LESSON | 5 | bar, list |
| `class.misconceptions` | CLASS | 3 | card_list |
| `learner.result` | LEARNER_IN_INSTITUTION | 1 | summary |

Every `institution.*` and `item.*` metric **excludes EDUCATOR**.

`metric_evaluate()` returns `status ∈ ok | below_minimum {have, needed} |
not_permitted | unavailable | deprecated`. **A `not_permitted` entry carries no
`label_key`** — the refusal must not disclose what it withheld; the existing
`edukator/ringkasan` page honours this by rendering no heading for those entries.

`generate_report(p_template, p_scope_node, p_catalogue_version)` requires only
`is_member_of_institution` for the template; **what the reader may see is decided per
metric, at execution time, against the viewer** — a saved template is a request, not
an entitlement.

## 8.7 V3

**NOT FOUND.** No finding labelled `V3` (or `V-3`) exists anywhere in this repository
— not in `docs/`, `claude/`, `selftest/` or the migrations. The V-numbers come from a
report held outside the repo. **NOT ACCESSIBLE FROM THIS SESSION.**

**Contradiction recorded, not resolved:** the assignment brief states V3 has an "exact
known meaning"; I cannot corroborate it from the repository. I offer the following as
the *likeliest referent* on the basis that it materially affects the minimum Slice-3
educator journey — **it is a candidate, not a match**:

### 8.8 The demonstration/OFFICIAL evidence constraint

**OBSERVED, and it is an invariant behaving correctly, not a defect.**

- `derive_evidence_class(p_institution, p_channel)`: **a synthetic tenant never
  produces OFFICIAL evidence, whatever is asked for** — it returns `SYNTHETIC`.
- `official_sessions` / `official_results` views filter to
  `effective_evidence_class(s.id) = 'OFFICIAL'` —
  `20260912194513_official_evidence_boundary.sql:111–118`.
- `metric_definitions_official_only` CHECK constrains every metric to
  `evidence_class = 'OFFICIAL'` — `20260918100000:84–85`.
- The metric evaluator references the official views **26 times**.
- `seed/learning_cycle.sql:55` — the rich demonstration tenant ("Sekolah Sintetis
  Siklus") is `is_synthetic = true`.
- `seed/official_bootstrap.sql:65–70` — the **only** non-synthetic tenant
  (`pintar-bootstrap-official`, purpose `D1_ENGINEERING_BOOTSTRAP`, development/CI
  only, enforced single-occupancy by migration 0042) — and it seeds **zero sessions
  and zero results**.

**Therefore: in every seeded environment at this baseline, every educator class metric
computes over zero rows → `sample = 0` → `below_minimum`.** The insufficiency state is
not an edge case to handle; **it is the only state that renders**. Any Slice-3 design
must treat it as the primary state.

---

# 9. Localization implementation

**OBSERVED.**

## 9.1 Architecture

One file: **`src/lib/hle.ts`** — the Human Language Engine. **395 rows** in the table,
**418 members** in the `HleEvent` union (the difference is stage-override keys and
union entries whose rows live in `stageTable`).

```ts
type Persona = "learner" | "educator" | "staff" | "public"
type Locale  = "id" | "en"
type Stage   = "SD" | "SMP" | "SMA" | "UNIVERSITAS"
t(event, persona, { locale?, stage? }) → string
```

**Row shape is deliberately flat** — `{ default, en, learner?, en_learner?, … }` on
one line per key. Reason: F05-S03 and QAC-S01 parse this file with a regular
expression that **cannot cross a closing brace**. A nested shape would silently
disable those guards. `UX1-S0-HLE-01` asserts every key carries both `default` (ID) and
`en`, and that a persona override exists **in both languages or in neither**.

**`stageTable`** is a separate map, **learner keys only**. `t()` refuses to consult it
for any other persona: a teacher reading about a Year 4 class is not a Year 4 child.

**`STAFF_ONLY_PREFIXES = ["studio.", "config."]`** — a declaration about *audience*,
not an exemption from the internal-word guard. `t()` still throws if such a key is
rendered for a learner or the public; `renderAll()` simply does not ask for a rendering
that would be a bug to perform.

## 9.2 Locale selection and persistence

`src/lib/locale-kontrak.ts` — `LOCALE_COOKIE = "pintar-lang"`,
`DEFAULT_LOCALE = "id"`, `parseLocale(v) → v === "en" ? "en" : "id"`.
`src/lib/locale.ts` reads it through `next/headers` (server).
`components/PengalihBahasa.tsx` is the client switch.

**PRODUCT RULING S0.3:** the switch is on every shell including the public
verification shell, because a stranger holding a verification link has no account to
carry a preference in.

**`UX1-S0-LANG-01` — the bilingual identity.** The interface language changes rendered
text and number formatting and **nothing else**. The learner cycle and the certificate
read are driven **twice, once per language, through a recording client**, and the
recorded RPC call sequence and payloads must be **byte-identical**. Structurally: no
source file under `src/` passes the language into an RPC, a write or a filter, and no
migration gives the preference a column. *Bounded:* this proves what the application
**asks for**, not what a live PostgREST receives.

## 9.3 Formatting

`LOCALE_TAG = { id: "id-ID", en: "en-ID" }`, `TIMEZONE = "Asia/Jakarta"`.
`format.number`, `format.percent`, `format.date` wrap `Intl`.

**RESIDUAL:** `en-ID` yields **English month names with Indonesian digit grouping**.
Invisible on Slice 1; visible on a future report. Recorded, not repaired.

## 9.4 Content vs interface separation

Interface copy lives in `hle.ts`. **Learning content never does** — lesson prose, item
stems, options, `alasan`, `arah` and reading-map `pernyataan` come from the database in
whatever language they were authored, and are rendered verbatim. The interface language
does not translate content and must never appear to.

## 9.5 The pronoun guard

**PRODUCT RULING (2026-09-16):** *prefer natural Indonesian that avoids unnecessary
pronouns; where a learner-facing pronoun is necessary, use **"Anda"**, not "kamu".*

`UX1-S0-SAPAAN-01` enforces it in two halves: every Indonesian telling `t()` renders to
a `learner` or `public` persona (**stage overrides included** — that is where the
informal register survived longest), and the raw comment-stripped source of every
**re-set** surface, because a hard-coded string bypasses the table. A word ending in
`-mu` is read as the informal clitic **unless** it ends with one of a declared list
(`ilmu, jamu, tamu, semu, temu, ramu`), so a false positive is fixed in the diff rather
than by loosening the pattern. The guard asserts it can still see what it forbids
before it sweeps.

**RESIDUAL:** `src/app/page.tsx:21` still reads `Halo, {viewer.displayName ?? "kamu"}`.
It is a **pending** surface, excluded by the same declaration the token lint uses, and
joins the rule when Slice 2 re-sets entry-by-purpose.

## 9.6 Pending surfaces (20 at this baseline)

`src/app/page.tsx`, `masuk/page.tsx`, `_evaluation-banner.tsx`, `evaluasi/page.tsx`,
`konfigurasi/page.tsx`, `edukator/ringkasan/page.tsx`, `dekan/ringkasan/page.tsx`, and
all thirteen `studio/*` surfaces.

---

# 10. CSS / design implementation

**OBSERVED.** Two stylesheets, both imported by `src/app/layout.tsx`.

## 10.1 `src/app/globals.css` — the token file

`--pintar-tokens-version: 2`. Complete token list at this baseline:

```
surfaces   --surface-0 #FBFAF7   --surface-1 #FFFFFF   --surface-2 #F3F1EC
ink        --ink-1 #1F2A33       --ink-2 #4E5A64       --ink-3 #5F6A73
lines      --line rgba(31,42,51,.12)  --line-strong rgba(31,42,51,.24)
           --line-1 → var(--line)      (an ALIAS, not a second colour)
primary    --pintar-primary #245F55    --pintar-primary-ink #FFFFFF
           --pintar-primary-soft #E3EFEC --pintar-primary-hover #1E5148
status     --status-ok #2F6E4A  --status-attention #8A5F00
           --status-blocked #8C3B3B --status-info #3D5A80   (+ *-soft grounds)
radii      --radius-1 8px  --radius-2 12px  --radius-pill 999px
space      --space-1 4 --space-2 8 --space-3 12 --space-4 16 --space-5 24
           --space-6 32 --space-7 40 --space-8 48 --space-9 64
type       --type-eyebrow 12 --type-fine 13 --type-meta 14 --type-body 16
           --type-card 17 --type-course 20 --type-subhead 22 --type-section 24
           --type-page 30 --type-hero 36 --type-name 40 --type-name-print 44
           --type-chip 12.5 --type-stem 21 --type-stem-phone 19
weight     --weight-normal 400 --weight-strong 600
tracking   --tracking-eyebrow .06em --tracking-wordmark .14em --tracking-tight -.02em
leading    --leading-tight 1.15 --leading-body 1.5 --leading-prose 1.65
           --leading-heading 1.25
logo       --logo-height 36px --logo-height-phone 32px --logo-height-standalone 44px
measure    --gutter 16px (24px ≥640) --measure-read 760 --measure-narrow 560
           --measure-stage 1120 --measure 64ch
motion     --motion-fast 160ms
fonts      --font-sans "Plus Jakarta Sans" … --font-mono "IBM Plex Mono" …
```

A second block under `@theme inline` re-exports colours as `--color-*` so Tailwind
utility names (`bg-surface-1`, `text-ink-2`) **compile to the same tokens**. The token
lint treats such a utility as a token reference, not a violation — the rule is
"resolves to a token", not "avoids Tailwind".

`.pin-shell { margin-inline: calc(var(--gutter) * -1) }` lets the header run
full-bleed inside a gutter-padded body.

**PRODUCT RULING Q-20:** primary `#245F55` approved 2026-09-16. Not frozen;
one-line-swappable.

## 10.2 `src/app/experience.css` — the composition file

All `.pin-*` classes. The `pin-` prefix was chosen **after** `px-` collided with
Tailwind's padding utility.

**CASCADE-SENSITIVE — this file has TWO `@media (max-width: 560px)` blocks**, and base
rules are written between them. At equal specificity the later rule wins, so a narrow
rule must be declared **after** the base rule it overrides. This is not stylistic: it
produced a real defect (§12).

## 10.3 The responsive fact stack

**PRODUCT RULING (2026-09-16):** compact fact summaries change from horizontal columns
to a **vertical label/value stack** on mobile/narrow, established site-wide wherever
that structure occurs; not applied mechanically to unrelated layouts; **no icons added
to support it**; desktop/wide may remain horizontal.

Implementation: one class, `.pin-facts`, used by the certificate card, the commitment
shell and the assessment orientation. Narrow rules:

```css
.pin-facts, .pin-commit .pin-facts { grid-template-columns: 1fr; }   /* block 1 */
.pin-orient .pin-facts { grid-template-columns: 1fr; }               /* block 2 */
.pin-sheet .pin-facts { grid-template-columns: repeat(3, 1fr); }     /* the exception */
```

The descendant selectors matter: `.pin-commit .pin-facts` and `.pin-orient .pin-facts`
are `(0,2,0)` and outrank the plain class at any width.

## 10.4 The A4 exception

**`.pin-sheet .pin-facts` keeps its printed row at every width.** A4 is 794 px of paper
scaled whole and never reflowed, so the viewport's width is not the sheet's width.
Before this was declared, the phone rule was narrowing the printed sheet by accident.

## 10.5 Logo and footer

`components/MerekPintar.tsx` renders `/brand/pintar-selalu-logo.png` at its intrinsic
`width={766} height={429}` with `className="pin-merek"` and `alt="PINTAR SELALU"`. It
is a plain `<img>` with **one honest** `eslint-disable-next-line
@next/next/no-img-element`.

**PRODUCT RULING:** do not redraw, reinterpret, recolour, stretch, crop, distort, or
recreate the logo using HTML text. Size it **optically, not mechanically**.

`.pin-merek` sets **a height and never a width** (`width: auto`). `UX1-BRAND-01` fails
if a width is ever set, verifies the PNG by **sha256** against the supplied file
(so a recompression fails), reads its intrinsic geometry **from the PNG header** rather
than trusting it (766×429, ratio 1.7855, 29499 bytes), and asserts the asset appears on
no surface that prints a credential.

`components/KakiPintar.tsx` — four supplied constants, **no HLE keys**, because a
person's name, a company's registered name, an email and a domain are the same string
in both languages and two keys that must never diverge are a divergence waiting to
happen:

```
PENANGGUNG_JAWAB = "Dr. dr. Gladys DT Tubarad, M.Pd.Ked"
BADAN_HUKUM      = "PT ZAYD PINTAR SELALU"
SUREL            = "info@pintarselalu.com"
RANAH            = "pintarselalu.com"
```

Protocol lives in the `href` and **not** in the visible text; the external link carries
`rel="noreferrer"`.

## 10.6 The institution-mark guard (Q-7)

**PRODUCT RULING:** *"Institution may own the mark. PINTAR owns the experience."* —
bounded branding, **not** tenant theming.

`BarisLingkup` carries a `markUrl` slot that **renders nothing** when there is no mark:
not a grey square, not initials, not a PINTAR logo standing in for a school's.

`UX1-BRAND-02` asserts, against the tree: the Q-7 source does not exist in the 85
migrations (no mark/theme column in either create-table or `alter table … add column`
shape); no public storage bucket has appeared (eleven migrations assert
`count(*) from storage.buckets where public = 0`); **no per-tenant theming mechanism**
has entered the Experience layer (`tenantTheme|institutionTheme|themeFor|customTheme|
brandingFor|tenant_theme|institution_theme|--tenant-|--institution-`); **no specific
institution is named in `src/`** (checked against the **raw** source, comments
included); and the shell identity has exactly **one** renderer.

**RESIDUAL Q-7:** whoever closes it must solve the **delivery path**, not only the
column — a mark on `/verifikasi/[token]` is read by an anonymous stranger and the
schema asserts there is no public bucket.

## 10.7 Print

`@media print`: `.pin-noprint { display: none !important }`, the well loses its ground,
`.pin-sheetbox` unclamps, `.pin-sheet` becomes static and full-width, `.pin-col` loses
its padding.

## 10.8 Fonts

Self-hosted, four `@font-face` blocks in `globals.css`, `font-display: swap`, split
latin / latin-ext by `unicode-range`:
`plus-jakarta-sans-latin.woff2`, `plus-jakarta-sans-latin-ext.woff2`,
`ibm-plex-mono-500-latin.woff2`, `ibm-plex-mono-500-latin-ext.woff2`.

**PRODUCT RULING Q-18:** self-hosted with **OFL licences committed beside the assets** —
`public/fonts/OFL-PlusJakartaSans.txt`, `public/fonts/OFL-IBMPlexMono.txt`.

---

# 11. Server actions and mutations

**OBSERVED.** `src/app/belajar/actions.ts` — 11 exports, all `"use server"`. Each opens
the **caller's own** Supabase server client and hands it to the engine; the engine holds
no privilege and passes no identity (INV-08 is enforced in the database, from the JWT).

| Export | Wraps | Used by | Commit-sensitive |
|---|---|---|---|
| `startSession` | `start_learning_session` | **NOBODY — see R-2** | yes |
| `submitAnswer` | `record_answer` | ItemPlayer | yes |
| `noteView` | `note_item_view` | ItemPlayer | yes |
| `assistance` | `assistance_state` | ItemPlayer | no |
| `openAssistance` | `open_assistance` | ItemPlayer | yes (records a grant) |
| `dismissAssistance` | `dismiss_assistance` | ItemPlayer | yes |
| `pauseSession` / `resumeSession` | `pause_session` / `resume_session` | ItemPlayer | yes |
| `finishSession` | `finish_my_session` | ItemPlayer | **yes — terminal** |
| `saveLessonProgress` | `record_lesson_progress` | LessonPlayer | yes |
| `mulaiAsesmen` | `start_learning_session` + `redirect` | `PermukaanAsesmen` form | **yes — the commitment** |

`src/app/studio/actions.ts` — 18 exports (`advanceContentAction` … `launchQuickAssessmentAction`).

## 11.1 Findings recorded, not repaired

**R-1 — unvalidated `kembali` redirect target.**
**REPORTED** by Second Eye Code; **OBSERVED and confirmed by me** at
`src/app/belajar/actions.ts:113–123`:

```ts
export async function mulaiAsesmen(formData: FormData) {
  const penugasan = String(formData.get("penugasan") ?? "");
  const kembali = String(formData.get("kembali") ?? "/belajar");
  if (!penugasan) redirect(kembali);
  await engine.startSession(await db(), penugasan);
  redirect(kembali);
}
```

`kembali` arrives from client-submitted `FormData` and is passed to `redirect()` with
**no allow-list, no same-origin check and no leading-slash check**. Every current
caller supplies a server-rendered relative `diriHref`, but the action is a public
server-action endpoint and nothing in the code constrains the value. **Open-redirect
shaped. NOT REPAIRED in this assignment.**

**R-2 — dead exported server action `startSession`.**
**REPORTED** by Second Eye Code; **OBSERVED and confirmed by me**:
`src/app/belajar/actions.ts:17` exports `startSession`, and **no call site exists**.
The only occurrences of the name elsewhere in `src/` are two explanatory comments in
`PermukaanAsesmen.tsx:31` and `pemetaan/page.tsx:14`. It was the session-creating path
before Slice 2 moved commitment into `mulaiAsesmen`. As an exported server action it
remains a reachable endpoint that creates a session from an assignment id.
**NOT REPAIRED in this assignment.**

**Note on the relationship between R-1, R-2 and §5.1.** The LOOKING ≠ COMMITTING
guard (`UX1-S2-MELIHAT-01`) asserts that no **page** starts a session while rendering
and that the start is a form POST. It does **not** assert that the exported action
surface is minimal, and it does not validate redirect targets. Both findings sit in
exactly that blind spot.

---

# 12. Tests

**OBSERVED.** 190 declared cases in `selftest/manifest.json` (version 32).
`CONTRACT` fails if a runner reports an id absent from the manifest, or vice versa.

## 12.1 UX-1 cases

| Test | Invariant | Mechanism | Known blind spot / history | CI job |
|---|---|---|---|---|
| `UX1-S0-TOKEN-01` | Every re-set surface resolves colours, radii, type and spacing to a token; every surface is declared in exactly one of two lists | Two declared arrays + raw-length/raw-colour regex over CSS, Tailwind-scale regex over TSX, inline-style scan; **48 classified constants**, each with a file, literal and reason; asserts every exemption still exists | Scope is declared, not inferred — a new surface is in neither list and fails until declared | selftest (static) |
| `UX1-S0-CONTRAST-01` | No token pair is below WCAG 2.1 AA | **Computes** 34 ratios from `globals.css` | Prevents the token lint enforcing a failing token | selftest |
| `UX1-S0-HLE-01` | Every key carries ID + EN; a persona override exists in both languages or neither | `allKeys()` + `renderAll()` sweep, both locales, every persona and stage | Asserts id/en rendering counts are equal | selftest |
| `UX1-S0-LANG-01` | Language changes text and formatting and nothing else | Behavioural: read paths driven twice through a **recording client**, transcripts compared byte-for-byte. Structural: no source passes locale into a DB call; no migration gives it a column | **Bounded**: proves what the app asks for, not what PostgREST receives | selftest |
| `UX1-S0-SAPAAN-01` | No informal second person in Indonesian learner/public copy | Rendered tellings + raw re-set sources; declared `-mu` allow-list; guard self-tests before sweeping | Pending surfaces excluded by the same declaration the token lint uses | selftest |
| `UX1-S0-FAKTA-01` | Compact fact summaries stack below 560px, wherever they occur; the A4 sheet does not | Walks **every** rule in **every** phone block whose subject is `.pin-facts`; compares **document order** against the base rule; asserts no generated marker | **False green, corrected — see 12.3** | selftest |
| `UX1-S1-CERT-COLS-01` | Q-11 ten columns; no key material on a learner surface; V-6a | Source scan: one `.from("certificates").select`, using the exported constant | — | selftest |
| `UX1-S1-CERT-ELIGIBLE-01` | ELIGIBLE renders none of six affordances | Predicates + **branch order** of the detail page | Applied to `my_certificate`'s result too, since that RPC does not filter by status | selftest |
| `UX1-S1-QR-01` | The printed symbol decodes back to the exact link | Encode → **jsQR** decode → compare, at three lengths/versions; over-capacity refused | Found two encoder defects invisible to the eye | selftest |
| `UX1-S1-KAKI-01` | Footer carries exactly the four supplied lines, and reaches no printed page | Source scan of the component and every mount | — | selftest |
| `UX1-BRAND-01` | The mark is the supplied artwork, undistorted, and not on a credential | **sha256** of the PNG; intrinsic geometry read from the PNG header; asserts `.pin-merek` never sets a width | First version would have passed a recompression | selftest |
| `UX1-BRAND-02` | The institution-mark ruling still holds | 85 migrations swept for a mark column in **both** shapes; public-bucket count; theming regex; institution names in **raw** source; single renderer | **First version matched only create-table columns** — a planted `alter table … add column logo_url text` sailed past. Broadened; proved green→red→green on three plants | selftest |
| `UX1-S2-POSISI-01` | Cycle position and the home's single recommendation | Pure function driven through **11** cycle states + ranking properties | **Blind spot, corrected — see 12.3** | selftest |
| `UX1-S2-MELIHAT-01` | The four Slice-2 rulings | No page starts a session while rendering; start is a form POST; null orientation → refusal, no `disabled`, no second eligibility opinion; no duration field/derivation/copy; Q-15 byte-for-byte + register sweep + not an alert + absent from the player | Bounded: reads source and copy table; the DB half is Bob's | selftest |
| `UX1-S2-ORIENT-01` | LOOKING IS NOT COMMITTING, in the database | Terminal SQL: builds rows, reads the orientation, asserts **no session, no `started_at`, no attempt spent**, and that a learner it is not addressed to gets the same silence as a nonexistent uuid | **Bob's**, `selftest/db/fable06.sql:1997–2106` | selftest (db) |

## 12.2 The render evidence harness

`claude/tools/render-screens/` — `stylesheet.mjs` (compiles the **real** `globals.css`
+ `experience.css` through the project's own PostCSS), `screens.tsx` (renders the
**built** components with example data), `shoot.mjs` (Playwright + the pre-installed
Chromium at `/opt/pw-browsers/chromium`).

At this baseline: **18 screens × 2 locales = 36 HTML pages → 72 screenshots** at
1280 px and 390 px, `deviceScaleFactor: 2`.

**`shoot.mjs` serves over HTTP and FAILS THE RUN if any asset 404s.** This is
load-bearing: under `file://`, `/fonts/…` and `/brand/…` resolve to the filesystem root
and fail silently, so **every screenshot before the brand round rendered in the system
fallback stack**. A review screen in the wrong typeface is worse than no review screen —
it looks fine, and it is evidence of something that is not what ships.

**Every name, number and verification token in the harness output is invented. The QR
codes are real and decode to the example links.**

## 12.3 False-green incidents, and how they were corrected

**Preserved deliberately: each of these passed while the thing it guarded was broken.**

1. **`UX1-S0-FAKTA-01` reported the orientation facts stacked while they rendered as
   two cramped columns on a phone.** The stack was declared in the **first** phone
   block; the base `.pin-orient .pin-facts` rule is written **between** the two blocks.
   Same specificity, later rule wins, stack never happened. **A screenshot caught it;
   the test did not.** Corrected by moving the rule and by making the test compare
   **document order**, not mere presence.
2. **The first version of that order check silently checked nothing.** It built a regex
   per selector, got the escaping wrong (`sel.replace(/\\\\/g, "")` against strings
   containing single backslashes), matched nothing, hit `continue` for all three
   selectors and reported success. Corrected by walking the parsed rules instead and
   asserting `ordered === 3`.
3. **`UX1-S2-POSISI-01` passed a real defect**: deleting the ranking tie-break — so the
   sort falls back to arrival order, which is list position by another name — went
   undetected, because all candidates sat at different steps and the tie-break never
   ran. Corrected by building the tie **on purpose** (two assignments at the same step,
   equally far through their lessons) and asserting the answer is stable under reversal.
4. **`UX1-BRAND-02` first matched only create-table columns**; a planted
   `alter table … add column logo_url text` passed. Broadened to both shapes.
5. **A lint-dodging indirection** (`const Img = "img"`) was written to defeat
   `@next/next/no-img-element`, recognised as dodging rather than engaging, and
   replaced with a plain `<img>` and one honest disable.

## 12.4 Adversarial plants (this session's, all restored)

Language guard: informal telling; informal hard-coded string.
Fact stack: stack on the plain class only; sheet left to reflow; icon added to carry
the change; stack declared before the rule it overrides; narrow rule deleted.
Position: naive left-to-right reading; tie-break removed.
Slice-2 rulings: render-time session start; disabled start control; derived duration;
`dicatat` → `dipantau`; disclosure as a warning box; form turned back into a link.

CI additionally runs **11 `red case` jobs**, each injecting a deliberate defect and
requiring the contract to go red **for the right reason**.

---

# 13. Assets and dependencies

**OBSERVED.**

- **Runtime deps:** `next@16.3.5`, `react@19.2.8`, `react-dom@19.2.8`,
  `@supabase/ssr@^0.12.7`, `@supabase/supabase-js@^2.116.0`. **No QR library, no chart
  library, no UI kit, no i18n library.** The QR encoder is in-repo (`src/lib/qr.ts`).
- **Dev deps relevant to reconstruction:** `jsqr@^1.4.0` (**test-only**, decodes the QR
  in `UX1-S1-QR-01`), `tsx`, `typescript`, `tailwindcss@^4` +
  `@tailwindcss/postcss@^4`, `eslint@^9` + `eslint-config-next@16.3.5`,
  `server-only@^0.0.1`, `supabase@^2.117.0`, `dotenv@^17.4.2`.
- **Not a dependency, installed ad hoc for review only:** `playwright` — the render
  harness README says `npm i --no-save playwright` because it is heavy and review-only.
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` in this environment; do **not** run
  `playwright install`.
- **Fonts — names and source expectations, binaries NOT included in this handoff:**
  *Plus Jakarta Sans* (variable, weights 200–800) and *IBM Plex Mono* (weight 500),
  both **SIL Open Font License 1.1**, subset to latin and latin-ext, served as `woff2`
  from `public/fonts/`. Reconstruction must obtain these from Google Fonts and
  **commit the OFL licence text beside them** (Q-18).
- **Logo:** `public/brand/pintar-selalu-logo.png`, 766 × 429, 29 499 bytes, supplied by
  Yazid. **Proprietary — not included in this handoff.** Reconstruction must obtain the
  original artwork; `UX1-BRAND-01` pins its sha256 and will fail on any recompression.

---

# 14. Known residuals — frontend / experience register

Nothing below is repaired. Each carries its evidence tag.

| ID | Residual | Tag | Detail |
|---|---|---|---|
| **V-6a** | Certificate issuance is not end-to-end | **PRODUCT RULING + RESIDUAL** | The lifecycle does not issue. No learner page calls `/api/certificates/issue`. **ELIGIBLE is the default state a learner meets.** Slice 1 must never be represented as end-to-end complete. Bob's gap. |
| **V-6a-b** | A replacement certificate has no learner-side detail read | **RESIDUAL** | Nothing writes a non-null `supersedes_certificate_id`; there is no reissue function; by `certificates_one_root_per_session` a replacement is the root of no session, so `my_certificate` can never return it. The banner opens the replacement's public verification page. **Open question for Sauron:** is that the intended destination, or should the reissue lifecycle carry a learner-side read when built? |
| **Q-7** | Institution mark has no source and no delivery path | **PRODUCT RULING + RESIDUAL** | No mark/theme column in 85 migrations; zero public storage buckets. The mark slot renders nothing. Whoever closes it must solve **delivery**, not only the column. |
| **Q-11** | — | **PRODUCT RULING** | Ten columns; never `signature`, `key_version`, `canonical_payload`, `snapshot_id`. Satisfied. |
| **Q-12** | — | **CLOSED at this baseline** | Ad-hoc discovery now exists (`my_open_assessments`). |
| **V2** | Assignment authority institution-wide, not subtree-bound | **OBSERVED, unrepaired** | Nine sites listed in §8.3. Blocks honest representation of "my classes / my students". |
| **V3** | Unknown | **NOT FOUND / NOT ACCESSIBLE FROM THIS SESSION** | No such label in the repository. Candidate referent in §8.8 offered as a candidate, not a match. Contradiction with the brief recorded. |
| **OFFICIAL-evidence demo constraint** | No seeded environment can show an educator a number | **OBSERVED** | §8.8. Invariant behaving correctly; the insufficiency state is the only state that renders. |
| **R-1** | Unvalidated `kembali` redirect target in `mulaiAsesmen` | **REPORTED + OBSERVED** | §11.1. Open-redirect shaped. |
| **R-2** | Dead exported server action `startSession` | **REPORTED + OBSERVED** | §11.1. No caller; still a reachable session-creating endpoint. |
| **R-3** | Attempt limit / attempts used not displayed | **RESIDUAL (product fidelity)** | `assessment_orientation` returns both; Screen D renders neither. A learner on their only PAPER attempt is not told so. |
| **R-4** | Ad-hoc session lookup is a direct table read | **RESIDUAL** | No RPC maps an assignment to the caller's session. RLS-scoped, cannot widen, but a contract gap. |
| **R-5** | `en-ID` mixes English month names with Indonesian digit grouping | **RESIDUAL** | Invisible on Slice 1; visible on a future report. |
| **R-6** | `certificate_templates_select` is `CAN_PUBLISH`-gated | **RESIDUAL** | A learner never reads a layout row; a named `CLASSIC` fallback is used. |
| **R-7** | `src/app/page.tsx` still renders `?? "kamu"` | **RESIDUAL** | Pending surface; joins the pronoun guard when Slice 2 re-sets entry-by-purpose. |
| **R-8** | 20 pending surfaces not re-set to token v2 | **RESIDUAL** | Declared in `PENDING_SURFACES` with the slice that will do it. |
| **R-9** | `may_start_assessment` has no frontend caller | **OBSERVED** | Deliberate: the RPCs ask it themselves; a second opinion in the app could drift. Recorded because the engine still exports `mayStart`. |
| **R-10** | `record_integrity_signal` has no learner-page caller | **OBSERVED** | The engine exports `recordIntegritySignal`; no current surface calls it. |
| **UX-R1** | — | **NOT FOUND** | The brief names `UX-R1`; no such identifier exists anywhere in the repository. **NOT ACCESSIBLE FROM THIS SESSION.** Contradiction recorded. |
| **Q-3** | — | **NOT FOUND** | No `Q-3` in the repository. `docs/phases/FABLE-06-OPEN-QUESTIONS.md` carries an **`OQ-3`** ("Five mutating STAFF endpoints with no direct authorization reference") which may or may not be the referent. Recorded, not assumed. |

## 14.1 Contradictions recorded, not resolved

1. **The brief asserts V3 has an exact known meaning; the repository has no V3.**
   Both claims preserved. §8.7.
2. **The brief names UX-R1 and Q-3; neither identifier exists in the repository.**
   `OQ-3` exists and is a different identifier. Preserved.
3. **Local selftest verdict is RED; CI run 91 is green.** Not a conflict: 61 cases
   require the `db` facility, which cannot start in this container. The local
   `--accept-justified-skips` run reports **42 passed / 0 failed / 61 skipped → RED**;
   CI's strict run executes all 190.

---

# 15. Ground-zero build order

**PROPOSAL** — a deterministic sequence, not current state. Each step names the backend
contracts that must already exist.

| # | Step | Backend prerequisite |
|---|---|---|
| 1 | `create-next-app` — App Router, TypeScript, **ES2017 target**. Add Tailwind v4 via `@tailwindcss/postcss`. | none |
| 2 | `src/app/globals.css`: the complete token set, `--pintar-tokens-version: 2`, the `@theme inline` colour re-export, the four `@font-face` blocks. Commit fonts + OFL licences. | none |
| 3 | `src/lib/hle.ts`: `HleEvent` union, flat one-line rows, `t()`, `stageTable`, `INTERNAL_WORDS`, `STAFF_ONLY_PREFIXES`, `format.*`, `allKeys`, `telling`, `renderAll`. **Flat shape is mandatory.** | none |
| 4 | `locale-kontrak.ts` + `locale.ts` + `PengalihBahasa`. | none |
| 5 | `src/lib/supabase/` (server/client/service via `@supabase/ssr`), `auth.ts`, `env.ts`. | Supabase project; `accounts`, `persons` |
| 6 | `src/lib/assessment-engine/` — `types.ts` then `index.ts`. `EngineClient` is `{ rpc() }`; `call()`/`rows()`; `sanitize()` re-applying `LEARNER_ITEM_KEYS`. | **all LEARNER RPCs in §4.1** |
| 7 | `src/app/experience.css` — `.pin-*`, both phone blocks. **Declare each narrow rule after the base rule it overrides.** | none |
| 8 | Shell + chrome: `CangkangPengalaman` (learner/public/focus), `MerekPintar`, `KakiPintar`, `PengalihBahasa`, `HalamanPenolakan`, `PemilihLingkup`, `lingkup.ts`. | `org_nodes`, `classes` RLS |
| 9 | Evidence components `components/bukti/` (`AngkaBerdiri`, `KartuKetiadaan`, `BarisKesiapan`, `BarisLingkup`) + `HalamanKomitmen`. | none |
| 10 | **Slice 1 certificates:** `sertifikat-kontrak.ts`, `qr.ts`, `sertifikat.ts`, `components/sertifikat/*`, `/belajar/sertifikat`, `/belajar/[tugas]/sertifikat`. | `my_certificate`, `certificates` RLS |
| 11 | Public verification: `certificates/verification.ts`, `/api/verifikasi/[token]`, `/verifikasi/[token]`. | `verify_certificate`, service client, signing keyring |
| 12 | `src/lib/siklus.ts` — pure. Write **before** any Slice-2 route; it has no I/O and is the thing most worth testing first. | none |
| 13 | `components/siklus/*` — `JejakSiklus`, `KartuTugas`, `PetaBacaan`, `OrientasiAsesmen`. | none |
| 14 | `belajar/actions.ts`, then `ItemPlayer` and `LessonPlayer` (the only `"use client"` files besides the language switch). | answer/assistance/lifecycle RPCs |
| 15 | `PermukaanAsesmen`, then the three assessment routes. | **`assessment_orientation` and `my_open_assessments` must exist** |
| 16 | Screens A, B, C, F, G. | `my_cycle_state`, `learner_lessons`, `reading_map`, `session_outcome`, `session_review`, `learning_delta` |
| 17 | `selftest/` — manifest, runner, `experience.test.ts`. **Add each guard with the rule it guards, and prove it against a plant before moving on.** | — |
| 18 | `claude/tools/render-screens/` — serve over **HTTP**, fail on any 404. | — |
| 19 | Studio and reporting surfaces. | staff RPCs, `generate_report`, metric catalogue |

**Order dependencies that are not obvious:**
- §6 before any route: nothing else may name a learner RPC.
- §12 before §16: the home cannot be written honestly without the derivation.
- §15 before §16: Screen A links to routes that must already refuse correctly.
- The token file before the composition file, and both before any component.

---

# 16. Verification commands

**OBSERVED** — these are the exact commands used at this baseline.

```bash
# install
npm ci

# the three fast gates
npm run lint                 # eslint
npm run typecheck            # tsc --noEmit
npm run build                # next build (placeholder public env is sufficient)

# static guards + app cases; db cases skip without SUPABASE_DB_URL
npm run selftest:local       # tsx selftest/run.ts --accept-justified-skips

# strict: every case, no skips. Requires a running local stack.
npm run selftest

# db cases directly
npm run selftest:db          # needs SUPABASE_DB_URL and psql

# frozen-document digests
node scripts/baseline-parity.mjs

# boundary check (must print nothing)
git status --short -- supabase/ docs/rebuild/ docs/adr/ selftest/db/ .github/

# render evidence: 36 pages → 72 screenshots, both locales, 1280px and 390px
npm i --no-save playwright
OUT=$(mktemp -d)
node  claude/tools/render-screens/stylesheet.mjs "$OUT"
npx tsx claude/tools/render-screens/screens.tsx  "$OUT"
node  claude/tools/render-screens/shoot.mjs      "$OUT"   # FAILS if any asset 404s
```

**CI-equivalent:** `.github/workflows/ci.yml`, 16 jobs —
`install · lint · typecheck · build`, `baseline · frozen documents`,
`migrations · clean database + seed`, `migrations · previous schema → HEAD`,
`selftest contract (strict, local stack)`, and **11 `red case` jobs** each injecting a
deliberate defect and requiring the contract to go red for the right reason.
Triggers: `push` to `main`, `pull_request`, and **`workflow_dispatch`** (which is how
run 91 was fired on a branch).

**Environment notes for reconstruction:**
- `.env.local` with CI placeholder Supabase values is enough for `build` and for the
  route-fetching `app` cases; without it every route 500s and three baseline cases fail
  for an environmental reason, not a code one.
- `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` and
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` in this environment. Do not run
  `playwright install`.

---

## Closing statement

This file reports the PINTAR 4.0 frontend **as it exists at
`b3bec9f96bc3394fa8b3f9e8660441628429b50e`**. Nothing was designed, repaired or
modified for this assignment. Two reported findings (R-1, R-2) were independently
confirmed and deliberately left in place. Three contradictions between the assignment
brief and the repository (V3, UX-R1, Q-3) are recorded unresolved. Every residual in
§14 is live.

*Daisy Code 💻🌼 — 2026-09-17*
