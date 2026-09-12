# PINTAR 3.0 — COMPREHENSIVE HANDOFF
**Compiled 2026-08-28.** Synthesizes and updates the 2026-08-09 handoff package
(`handoff-package-2026-08-09/PINTAR-MASTER-HANDOFF-2026-08-09.md` +
`PINTAR-DATABASE-SCHEMA-REFERENCE.md` + `CONSOLIDATION-PROVENANCE.md` +
`STABILIZATION-BASELINE-PLAN.md`) against everything added since. Read this
document first; drill into the 2026-08-09 package for command-level detail on
anything it already designed — don't re-derive what's already written there.

**Evidentiary discipline (binding, from `docs/GITHUB-TRANSITION-MASTER-CONTEXT.md`):**
file presence is not proof of behavior. Every claim below is marked VERIFIED
(names the test), NOT YET VERIFIED, or DESIGNED/NOT IMPLEMENTED. Where two
project documents disagree, both are reported — never silently resolved.

**What changed since 2026-08-09, in one line:** the C2 storage-security fix
(§7) went from "design only" to "application code delivered" in
`patch-C2-remediasi/` — but nothing indicates it was deployed, verified on
staging, or that migration `0089` (which closes the actual hole) has been run.
Treat C2 as **still open** until proven otherwise. No other dated delivery
folder in this workspace postdates 2026-08-09.

---

## Table of contents

1. What PINTAR is — product, philosophy, safety doctrine
2. Complete feature inventory, by role
3. Content model — the PINTAR Learning Package (PLP)
4. Repository & folder structure — everything in this workspace, explained
5. Database schema — full migration-family breakdown
6. Security posture — audits, live tests, what's open
7. Storage & assets — the C2 finding and its remediation status
8. Certificates
9. Briefings (educator / dean intelligence)
10. GitHub transition status
11. Consolidated issue log
12. Ordered plan forward
13. Glossary
14. File index by topic

---

## 1 · What PINTAR is

PINTAR is an Indonesian-language learning platform spanning **SD (primary) →
SMP → SMA (secondary) → University → professional education**. It is not a
quiz tool — its actual product is a **diagnostic + certification +
institutional-intelligence system** built on one canonical content object,
the **PINTAR Learning Package (PLP)**.

Live content today: SD5 mathematics (two content lines — see §3.4's open
question), SMA10 mathematics (chapters 1–7), SMA11 geography (chapters 1–4),
and a university herbal-medicine evidence-based-medicine (EBM) certification
course. Internally, "2.0 → 3.0" was an architecture replacement
(Supabase-backed, PLP-native), not a visual refresh — externally the product
is always just "PINTAR".

### Objective (binding — `docs/PINTAR-3.0-PHILOSOPHY.md`)

Not "the platform with the most features" — **the least friction between
knowledge and learning.** Every screen answers one question: *what does this
person need to do next?*

Governing principles that most shape engineering decisions:
- **Knowledge is the centre**, not files/databases/AI: `Knowledge →
  Distillation → Learning Package → Learning Experience`.
- **The PLP is the one canonical educational object** — NotebookLM, Gemini,
  Claude, ChatGPT, or a human author are interchangeable *producers* feeding
  the same PLP v1.0 format. PINTAR is never locked to one AI vendor.
- **Offer creation, never configuration.** Users see "Create Learning
  Package / Assessment / Video", never "Import / Parse / Validate".
- **One screen, one question** — the workflow discovers the user (student,
  educator, dean, admin), not the reverse.
- **Progressive disclosure** — no JSON, PLP jargon, or parser status for
  non-engineers.
- **Validation reads as coaching**: Lokasi (location) · Masalah (problem) ·
  Mengapa penting (why it matters) · Cara memperbaiki (how to fix).
- **Every object has a lifecycle**: `INGESTED → STRUCTURED → VALIDATED →
  IN_REVIEW → APPROVED → FROZEN → PUBLISHED → SUPERSEDED`.
- **Human authority is preserved**: AI generates → educators review →
  institutions approve → PINTAR measures → evidence improves.
- **Entry is by purpose, not a homepage** — routing is role/intent-based
  (`beranda-db.ts`), not a marketing page.

Mantra: *Knowledge is the beginning. Learning is the purpose. Evidence is the
compass. Humans remain responsible. AI accelerates creation.*

### Learning Safety Doctrine (binding, supersedes UI/copy decisions)

> "Learning should never feel intimidating."

1. **Mistakes are evidence** of a mental model — never shame.
2. **No dead ends** — every wrong-path screen offers a next step.
3. **Support without dependency** — assistance must never reveal the correct
   option.
4. **Respect the learner** — forbidden words (`Salah`, `Gagal`, `Wrong`,
   `Incorrect`, `Penalty`) vs. preferred (`Belum tepat`, `Mari kita lihat
   dengan cara lain`, `Coba sekali lagi`, `Perlu arah berpikir?`).
5. **Challenge without fear** — wait through a hesitation window before
   offering help; assistance is an inline pill, never a modal/banner.

Progressive assistance by stage (`lib/jenjang.ts`, `SALINAN_ASISTENSI`):

| Stage | Trigger copy | Support type | Goal |
|---|---|---|---|
| SD | 🤔 Perlu contoh? | Concrete visuals (pizza, blocks, number line) | Help children **see** |
| SMP | 💡 Perlu petunjuk? | Guiding clues | Help students **notice** |
| SMA | 🧭 Perlu arah? | Structural guidance | Help students **structure** |
| University | 🧭 Perlu arah berpikir? | Clinical/professional reasoning prompts | Build **professional judgment** |
| Educator (preview) | 🧭 Perlu arah berpikir? | "what's riskiest if misunderstood" | Same, staff framing |

Hesitation telemetry (`time_before_assistance_ms`, `assistance_offered`,
`assistance_opened`, `hesitation_triggered`) is schema-enforced to never touch
scoring — it lives only on `plp_item_responses`, and no scoring view reads it.

---

## 2 · Complete feature inventory, by role

### Every learner (the "Dr. Gladys Learning Cycle")

```
QR/link arrival → passwordless onboarding (or classroom-card PIN for young learners)
  1. PRE-TEST "Pemetaan Awal"    — no timer UI, no pass/fail, no rationale, dot progress
  2. PETA BACAAN PERSONAL         — personal reading map, priority-sorted, NOT a results page
  3. Lesson(s) via MultimodalLessonPlayer — reading, listening, watching, worked examples
  4. POST-TEST "Uji Penguasaan"  — formal, timer counts up, safety gate enforced, navigator drawer
  5. HASIL + delta vs. pre-test + certificate CTA if passed
  6. /sertifikat, /verify/[hash] — public, QR-scannable, HMAC-signed credential
```
- Pre-test: no pass/fail messaging, no rationale reveal, keyboard nav (A–D
  select, Enter/→ next, ← back), progress shown as dots not a percent bar.
- Peta Bacaan (reading map): one card per competency domain, sorted
  safety-missed → wajib → disarankan → kuat, each with chapter/page
  reference and plain-language reason.
- Post-test / formal assessment canvas: counting-up timer, pause ("Simpan &
  Jeda"), flag-for-review ("tandai"), navigator drawer with per-item status,
  no auto-advance on selection.
- Hasil (results): score header, Safety Gate banner, per-domain breakdown,
  review accordion (wrong safety items pinned/auto-expanded), delta vs.
  pre-test, certificate CTA.
- Three question interaction types: `pilihan_ganda` (MCQ),
  `isian_langkah` (step-work input, matched against final answer + step
  keyword synonyms), `grid_interaktif` (cell-shading grid).
- Hesitation-triggered assistance: waits through a configurable window
  (10–300s, default ~25s), never a modal, never reveals the answer, logged
  for analytics only.
- Multimodal lesson player: paginated reading (split at `##` headings, dot
  tracker), audio/video with playback-rate control + resumable position +
  clickable transcript, worked examples revealed step-by-step, PDF companions
  (slide deck, module summary) with prominent open/download buttons, fraction
  diagrams drawn live from a directive line (`[[visual:banding 1/2,2/4,3/4]]`)
  rather than shipped as images.
- Reading progress persists both locally and server-side
  (`POST /api/v1/belajar/kemajuan`) and never regresses.
- Classroom-card login (PIN-based) for young learners, alongside
  passwordless email/magic-link onboarding for others.
- Certificate: A4 printable, QR code linking to public verification,
  HMAC-SHA256 signed, timing-safe verified.
- Delta view: per-domain growth from pre-test to post-test.

### Educator

- Studio: draft/import content (`CAN_DRAFT`), one-off flash quizzes
  (`CAN_FLASH_QUIZ`).
- Beranda (home): items I authored awaiting revision, items awaiting review
  in my subjects, open quality-blocker flags — task-first, zero-count cards
  simply don't render.
- Class Learning Intelligence briefing (`/edukator/ringkasan`, ~60s read):
  hero stats (participants / comprehension % / net gain), rich-text executive
  summary, pre/post gain bars, "do not reteach" vs. "focus" topic lists,
  ranked misconception cards (claim, affected count, root cause, chapter
  ref), a timed lesson plan (e.g. "10 MENIT reviu kasus · 8 MENIT diskusi ·
  LEWATKAN"), readiness distribution (Siap Sertifikasi / Perlu Review / Butuh
  Pendampingan Ekstra).
- Newer dashboards: `DasborSD5.tsx`, `JendelaKelas.tsx` (classroom window),
  `KartuTenang.tsx`.
- Briefing Centre inbox (`/briefings`): lifecycle
  `COLLECTING → GENERATING → READY → REVIEWED → ARCHIVED`, story-first cards
  (gain / isu / aksi).

### Head of Department (Kaprodi)

- Everything Educator sees, plus items awaiting *their* approval, department
  quality blockers, EXAM-tier bank readiness count.
- Studio capabilities: `CAN_REVIEW`, `CAN_FREEZE_RELEASE` (the "Approve &
  Freeze" button that locks content a certificate will point to).

### Dean

- Read-only. Beranda shows programme-count + "attempts below 100% safety
  accuracy" risk cards.
- Institutional Learning Intelligence report (`/dekan/ringkasan`, ~90s read):
  hero trio (participants / net gain / safety pass rate), institutional
  executive summary, cohort comparison table with highlighted program-total
  row, strongest competencies vs. curriculum-review areas, accreditation
  block (LAM-PTKes 2024 alignment, verified-credential count).
- Holds **zero** Studio capabilities by design — deans read, they don't
  author or approve.

### Institution Admin / System Admin

- `CAN_PUBLISH` (the only two roles that can publish/withdraw a release).
- Beranda: active role-grant count, legacy accessibility debt
  (`warisan_media`, can only shrink), unfit-media count.
- Full Studio pipeline access: import → review queue → item health/quality →
  media management (`/studio/{impor,antrean,mutu,butir,media}`).

### Cross-cutting platform features

- **Multi-module/subject architecture** — one installation serves many
  courses; module selected via `?modul=` (legacy) or course/release
  structure (PLP), propagated across route transitions.
- **Public certificate verification** (`/verify/[hash]`, newer
  `/verifikasi/[id]`) — returns pass/predikat/institution/date only, never
  score internals or personal data, via timing-safe HMAC comparison.
- **Scoped role/permission model** — six ranked roles, scope inheritance via
  ancestor-path (`ltree`), time-bounded grants that auto-expire.
- **Studio content pipeline** — import (CSV/manual authoring) → SME review
  queue → item-health/quality dashboard → freeze → publish, with a coaching-
  style validator (never raw JSON errors).
- **Psychometric calibration loop** — Rasch-model empirical difficulty
  recalibration from completed sessions (N≥30), misconception-cohort
  aggregation, auto-generated content-improvement briefs at ≥30% convergence
  on one distractor.
- **Human Language Engine** — a single dictionary/translation layer every
  user-facing sentence passes through, keyed by (event, persona, context),
  so e.g. staff and student surfaces never share LMS-internal words like
  "Menunggu" (waiting).
- **Dev-only tooling** (404s outside `NODE_ENV=development`): quick dev
  login bar, instant-pass test bar, seed-session/quick-pass endpoints.

---

## 3 · Content model — the PINTAR Learning Package (PLP)

### Hierarchy

```
Source / SourceVersion  (textbook edition, ISBN, page-precise citations)
  → Course              (subject × jenjang × grade label)
    → Module             (chapter, ordered)
      → Lesson            (body_markdown + summary + worked examples + media)
        → LearningObjective (Bloom level, is_core)
        → Item              (stem/stimulus/options, objective_ids)
          → ItemOption        (label A–E, text, is_correct, rationale REQUIRED
                                for every option, misconception_code)
AssessmentBlueprint  (per module: pool type, item_count, difficulty mix,
                       safety-critical minimum, passing rules, hesitation
                       threshold, shuffle flags)
MisconceptionTaxonomy  (code, label, description, remediation — NOT NULL)
PLPRelease  (one frozen/published snapshot, content_sha256, supersedes chain)
```

### Lifecycle — binding, not advisory

```
INGESTED → STRUCTURED → VALIDATED → IN_REVIEW → APPROVED → FROZEN → PUBLISHED → SUPERSEDED
                      ↘ VALIDATION_FAILED
```
**APPROVED ≠ FROZEN.** APPROVED = a human signed off. FROZEN = the content's
SHA-256 is computed and the row is now immutable (trigger-enforced). The hash
covers *what is taught*, deliberately excluding `created_at`/`status`/release
provenance — so re-releasing metadata doesn't change the taught-content hash.

### Doctrine enforced by the schema itself, not by convention

- `petunjuk`/`arah_berpikir` (hints) can never name or narrow to the correct
  option — enforced by a **regex CHECK constraint at the database level**
  (`chk_items_scaffolding_tanpa_kunci`), not a lint rule.
- Every `ItemOption.rationale` is required, non-empty — a wrong answer is
  evidence of a way of thinking, so every distractor must teach.
- No "wrong/failed/penalty" language anywhere a learner reads it (Voice
  Guide + a forbidden-word linter, `validate.ts` — see gap below).

### Three (really 3½) assessment/content generations coexist, deliberately

| Generation | Bank | Routes | Live content |
|---|---|---|---|
| Legacy — Herbal | `soal` table | `/asesmen`, `/hasil`, `/sertifikat` | Herbal EBM university course |
| Legacy — SD5 fraction pilot | Same `soal` table, `subj_matematika_sd5` | `/asesmen/sd5` | SD5 "Pecahan" — 75 items / 225 distractors, frozen per `CONTENT-FREEZE.md` |
| PLP-native | `items`/`item_options`/... | `/asesmen/plp`, `/belajar/[release]` | SMA10 Math ch1–7, SMA11 Geo ch1–4, SD5 Math ch1–9 |

`/api/v1/assessment/*` routes branch on request-body shape to serve both
without behavior change to old paths.

**⚠ Open, unresolved (flagged, not decided):** there appear to be **two
separate SD5 mathematics content lines** — the legacy-bank "Pecahan" pilot
and a full 9-chapter PLP-native curriculum (`fixtures/plp-sd5-math-ch1..9`).
Whether one subsumes the other or they overlap was not stated in any read
document. **Resolve this before further SD5 content work.**

### Content-modeling gaps (from `AUDIT-KURIKULUM-2026-08-08.md`)

`PLPItemType` is `MCQ_SINGLE | MCQ_MULTI | NUMERIC | SHORT_TEXT | GRID`. 11 of
13 audited chapter manifests record source-book item forms with no PLP
equivalent (true/false batteries, matching pairs, image-based items) —
explicitly **not** to be papered over with extra MCQs.

### `validate.ts` scope gap (open)

The forbidden-word linter only scans `petunjuk`, `arah_berpikir`, and
`options[].rationale`. It does **not** scan `options[].text`, `stem`,
`stimulus`, `lessons.body_markdown`, `misconception_taxonomy[].remediation`,
or `lessons.media.transkrip` — six fields learners actually read. 11 real
hits found across those fields in 13 audited chapters (3 genuine doctrine
violations, 8 legitimate field-of-study language like "gagal panen"/crop
failure that must not be censored). Recommendation on file: widen scope,
downgrade new hits to WARNING, keep ERROR only on the original three fields.
**Not implemented.**

---

## 4 · Repository & folder structure

This workspace is **not a clean checkout** — it is a running project history
of ~90 dated `delivery-*`/`handoff_*` patch folders, each meant to be copied
into a canonical app tree. Treat it as a patch queue, not a monorepo.

```
Pintar 3.0/                    original canonical Next.js app (pre-consolidation baseline)
  app/, components/, lib/, hooks/, supabase/migrations/ (0001–0046 in this copy),
  fixtures/, docs/, README.md, PHASE-1A/1B/2.md, middleware.ts

pintar-3.0-consolidated/       THE reconciled, build-verified tree — build/edit/push from here
  app/, components/, lib/ (~90 files incl. lib/plp/, lib/sd5-*.ts, lib/language/, lib/dev/),
  hooks/, scripts/, fixtures/ (every frozen PLP package JSON, all chapters, all subjects),
  data/ (older pre-fixtures databank JSON, kept for provenance),
  supabase/
    sql/                              0001–0084, the canonical migration series
    migrations-legacy-warisan-akar/   0045–0053, a colliding SMA10 seed series — kept
                                       physically separate on purpose (see §5.1)
    verifikasi/                       24 read-only post-migration check scripts
    MIGRATION-RUN-ORDER.md, MIGRATION-DEPENDENCY-MATRIX.md, PRAFLIGHT-MIGRASI.md,
    RENCANA-REMEDIASI-P0.md, jalankan-migrasi.sh
  docs/                              philosophy, voice guide, design language, content freeze,
                                     handoffs, audits, stabilization plan
  .github/workflows/uji-tembus.yml  CI workflow present, never exercised against a failing PR
  .gitignore, .env.example, CODE-RECONCILIATION-MANIFEST.md, CONSOLIDATION-PROVENANCE.md

supabase/, supabase-consolidated/  root-level migration folders — older/parallel numbering
                                    tracks, folded into pintar-3.0-consolidated/supabase/sql/
migrations/                        an earlier, independent "PINTAR 2.0" consolidated-DDL track
                                    (0018–0033) — real, not missing, just in a third location

docs/                              root-level, project-wide binding docs (philosophy, voice
                                    guide, design language, content freeze, handoffs, this file)
audit-2026-08-06/                  AUDIT-MENDALAM.md, AUDIT-SISTEM.md — security/architecture
                                    audit that triggered the Fase 0 security phase
delivery-fase0-2026-08-06/         Fase 0 security lockdown delivery (migrations 0069/0070)
delivery-*/  (~65 folders)         one per feature/fix batch, each with its own MANIFEST.md
handoff_*/, changed-files*/        older-style delivery folders, pre-dating "delivery-*" naming
handoff-package-2026-08-09/        the 2026-08-09 master handoff + schema reference + provenance
                                    + stabilization plan — the most detailed prior write-up
patch-C2-remediasi/                application-code delivery for the C2 storage fix (§7) —
                                    code exists, deployment/verification status unknown
patch-2026-08-09-prerender-03/     standalone extraction of one build-fix, redundant with the
                                    already-merged version in pintar-3.0-consolidated/
finding-C2-storage/                a copy of the stabilization plan focused on the C2 finding
archive/                           PINTAR-2.0-baked/ (earlier static .dc.html iteration) +
                                    changed-files-1..8 (still older patch history)
site-full-2026-07-31/              earlier static site export
uploads/, scripts/, fixtures/, data/   supporting assets and per-chapter source text extracts
extracted/                         raw source-book text extracts used to author chapter content
exports/                           a handful of exported PNGs of early .dc.html design docs
```

**Working pattern:** each `delivery-*` folder mirrors the subset of the
canonical tree it touches, plus a `MANIFEST.md`. `pintar-3.0-consolidated/`
(assembled 2026-08-09) is the result of layering every delivery folder onto
the `Pintar 3.0/` baseline in dependency order, last-writer-wins per file —
**this is the one tree to build, edit, and push.** Full reconciliation
reasoning: `CODE-RECONCILIATION-MANIFEST.md` and `CONSOLIDATION-PROVENANCE.md`
inside it.

### Application structure inside `pintar-3.0-consolidated/`

Next.js (App Router) + TypeScript + Tailwind.

```
app/
  api/v1/assessment/{start,submit,finalize,hasil}   session lifecycle, legacy+PLP branching
  api/v1/plp/{ingest,impor,draf,intelligence,rilis}  Studio import/authoring pipeline
  api/v1/studio/aset                                 signed-upload asset route (service_role)
  api/v1/belajar/kemajuan                            server-side reading-progress reporting
  api/v1/dev/{masuk,kunci,seed-session,quick-pass}    dev-only, 404 outside development
  asesmen/{plp,sd5,preview}, hasil/, sertifikat/{cetak/[nomor],preview}/, verify/[hash]/,
  verifikasi/[id]/, belajar/[release]/, beranda/, briefings/, edukator/{ringkasan,sma10}/,
  dekan/ringkasan/, masuk/, profil/, studio/{impor,antrean,mutu,butir,media}/, design-system/
components/
  asesmen/ (OptionCard, AssistanceTrigger, AssistanceDrawer, KartuUmpanBalik)
  learning/MultimodalLessonPlayer.tsx, beranda/KartuMataPelajaran.tsx, sertifikat/, studio/,
  masuk/, dev/, ui/, verifikasi/
lib/
  types/plp.ts                        full PLP v1.0 type system + lifecycle enum
  plp/{ingest,parser,validate,lokasi,intelligence,assessment-telemetry,identitas-peserta,
       sertifikat-plp,rilis-aktif,rilis-server,storage,aset-url*,pelajaran-tampil,
       gerbang-kapabilitas}.ts        (* aset-url.ts delivered in patch-C2-remediasi, not
                                        yet merged into this tree — see §7)
  assessment-assembly.ts              5-stage session assembler
  sd5-*.ts                            dedicated legacy SD5 fraction-pilot subsystem
  language/{engine,basis-data,register}.ts   Human Language Engine
  izin-studio.ts, identitas-studio.ts, kemajuan-kurikulum.ts, kredensial-tampil.ts,
  briefing-pipeline.ts, sertifikat.ts, qr.ts, skor.ts, soal.ts, penyimpanan.ts,
  supabase-{admin,server,klien}.ts
hooks/useAsesmen.ts, useHesitationTimer.ts
```

---

## 5 · Database schema

Postgres via Supabase. Full column-level/RLS-level detail lives in
`handoff-package-2026-08-09/PINTAR-DATABASE-SCHEMA-REFERENCE.md` — this
section summarizes it; consult that file before writing a migration that
touches anything listed here.

### 5.1 The two-series migration problem (deliberate, not an unfixed mess)

```
supabase/sql/                          0001–0084   "kanonik" — the series to run
supabase/migrations-legacy-warisan-akar/  0045–0053  "warisan-akar" — an independent SMA10
                                                       seed series reusing already-taken numbers
```
Renumbering a migration a real database already ran under its old filename
rewrites history a live system depended on (`0070`'s own comment: *"Mengganti
nama sejarah adalah kebohongan yang rapi"* — renaming history is a tidy lie).
Kept in separate folders instead. **Required run order:**
```
sql/0001 … sql/0046
  ── STOP. Run migrations-legacy-warisan-akar/ here, in file order (0046a BEFORE 0046): ──
  0045 → 0046a → 0046 → 0047 → 0048 → 0049 → 0050 → 0051 → 0052 → 0053
  (kanonik sql/0054 supersedes the release this series creates in its own 0053)
  ── RESUME kanonik: ──
sql/0054 … sql/0084
```
A separate insertion sequence for `0019→0033` also applies (`0085` at
position 0024/0025, `0088` before `0029`) — see `MIGRATION-RUN-ORDER.md` for
the exact interleave; not reproduced here to avoid drift between two copies
of the same instruction.

The `0065` collision (two different deliveries both wrote `0065`) was
resolved during Fase 0 by renumbering the later one to `0066`, cascading
`0066→0067`, `0067→0068` — this is recorded, not hidden, in those files'
headers.

`schema_migrations` (`0070`) is an append-only ledger, `UNIQUE(seri, nomor)`,
that makes this collision class structurally impossible going forward. It
does **not** claim to know what has run against production — every row's
`dijalankan_pada` was seeded `NULL` on purpose. **This ledger has not been
populated against the live database** — that's Phase A of the Stabilization
plan, still open.

The "0018–0033 missing" finding from an earlier audit was a **false alarm**:
those files exist in a separate root `migrations/` folder the audit didn't
grep, and are folded into `supabase/sql/` at the correct position in the
consolidated tree.

### 5.2 Migration families, in run order

| Range | Family | Notable |
|---|---|---|
| `0001` | Identity & session | Passwordless by design; idle sessions expire after 24h |
| `0002` | Legacy question bank | `soal` and friends — underlies `/asesmen` |
| `0003` | Attempts, telemetry, certificate vault | `certificates.timestamp_iso` is **TEXT** on purpose — it's the exact string inside the HMAC payload |
| `0004` | RLS baseline | one of two RLS layers everything builds on |
| `0005` | PDP retention | data-retention/anonymization job |
| `0006` | RPCs | `verifikasi_sertifikat_publik` — **open finding K-6**: `SECURITY DEFINER` with no pinned `search_path` |
| `0007` | Tier isolation | `soal.bank_tier`: `PRACTICE`/`TEST`/`EXAM`, EXAM restricted to senior roles |
| `0008` | Studio governance | content status machine `DRAFT→REVIEW→APPROVED→ACTIVE→RESTRICTED→RETIRED` |
| `0009` | Author/reviewer separation | origin of the reviewer≠author rule |
| `0010` | Per-item media | `stem-media` bucket — **the reference pattern** for what `content-assets` should have been |
| `0011` | Legacy media flag | `soal.warisan_media` — accessibility debt marker, can only shrink |
| `0012` | Academic hierarchy | `institutions→faculties→departments→programmes→subjects→cohorts`, `jalur` ancestor-path arrays — see §5.3 |
| `0013` | Scoped roles | `identity_links`, `user_scope_assignments`, `punya_cakupan()`/`boleh_pada_subjek()` — the authorization core, see §5.4 |
| `0014` | RLS + scope | policies using the `0013` functions on Studio-era tables |
| `0015` | Scope RPCs | `subjek_dalam_cakupan()` |
| `0016` | Identity claims | certificate freeze trigger, claim rate-limiting |
| `0017` | Psychometric item bank | `item_response_logs` — **the reference RLS pattern** (own-row SELECT, zero client writes). `pintar_user_id()` returns UUID — see D-critical open question, §6.4 |
| `0018–0033` | Consolidated schema patch series | SD5 databank seed, subject-model discovery, classroom auth, `pintar_catat_respons` (0026, replaced 0029), answer-key distribution |
| `0034` | Soal scaffolding | `soal.petunjuk`/`arah_berpikir` — same anti-leak CHECK pattern PLP's `items` later reuses |
| `0035` | **PLP core schema** | `sources`,`source_versions`,`courses`,`modules`,`lessons`,`learning_objectives`,`misconception_taxonomy`,`items`,`item_options`,`assessment_blueprints`,`plp_releases`,`plp_raw_imports`; view `items_publik`; freeze trigger. **RLS as originally written was blanket-open** — this is K-1/K-1a, closed by `0069` |
| `0036` | PLP sessions/exposure | `plp_sessions`, `plp_item_exposure`, view `plp_paparan_bertaruh_tinggi` — same blanket-RLS-then-0069-fix pattern |
| `0037` | PLP responses/results | `plp_item_responses`, result columns on `plp_sessions`, cohort views `plp_miskonsepsi_kohort`/`plp_butir_empiris` — same pattern |
| `0038` | Lesson media | `lessons.media` JSONB, transcript-required CHECK, freeze trigger — see §5.5 |
| `0039` | Seed test accounts | 15 personas, self-deleting permission gate — see §5.6 |
| `0040–0043` | Classroom cards & fixes | card/PIN seeding, null-auth fixes |
| `0044–0046` | Profile, content | name-column split, a specific SD5 fractions lesson |
| *(warisan-akar)* `0045–0053` | SMA10 Bab 1 seed | must run between kanonik `0046` and `0054` |
| `0054–0059` | SMA10 Math curriculum | ch1 v1.2, ch2–ch7 curriculum + corrections + releases |
| `0060` | Studio foundation | **also created the three residual `content-assets` storage policies — the C2 root cause** (see §7) |
| `0061–0065` | Teacher/academic admin | test-account relinking, degree/title columns |
| `0066` | Certificate↔release link | `certificates.plp_release_id`, additive, outside the HMAC payload |
| `0067` | PLP certificates | `plp_session_id` UNIQUE — idempotency for `terbitkanSertifikatPLP()` |
| `0068` | Sandbox Bab 0 | seed content for the dev "Instant Pass" bar |
| `0069` | **PLP RLS closure** | `pratinjau` columns; drops all `authenticated`-writable policies on 15 PLP tables + 4 views, replaces with service_role-only; `ALTER DEFAULT PRIVILEGES` |
| `0070` | Migration ledger | `schema_migrations` |
| `0071` | `content-assets` bucket | private flag, 400MB, MIME whitelist — **did not remove the `0060` policies**, the exact C2 mechanism |
| `0072–0075` | SMA11 Geography | chapter-gate migrations |
| `0076–0084` | SD5 Math subjects | chapter-gate migrations, Bab 1–9 |
| `0085–0088` | Provisional, unshipped | do not ship or delete without Phase A evidence — see §6.5 |
| `0089` | Storage policy closure (designed + now coded in `patch-C2-remediasi/`) | drops the three residual `0060` policies — **run only after the app-side signed-URL change is verified deployed** |

### 5.3 Academic hierarchy (`0012`) — ancestor-path arrays, not recursive joins

Every table carries `jalur UUID[]`, maintained by five separate trigger
functions (one per level, deliberately not one generic dynamic-SQL function —
an earlier attempt failed because `EXECUTE`'s `NEW` is an anonymous record
type). Moving a node cascades downward so `jalur` is never a stale cache.
Authorization reduces to one GIN-indexed containment check:
`scope_id = ANY(jalur)`. `soal` rows without a `subject_id` are invisible to
RLS — the migration backfills existing rows and installs a trigger rejecting
any new item whose module isn't a registered subject; **the migration's own
final check fails the whole run** if any orphan/malformed `jalur` remains.

### 5.4 Scoped roles (`0013`) — the authorization core

Six ranked roles: `SYSTEM_ADMIN(6) > INSTITUTION_ADMIN(5) > DEAN(4) >
HEAD_OF_DEPARTMENT(3) > EDUCATOR(2) > STUDENT(1)`. `users.peran` is a
machine-maintained *display* field, not the authority — real authority is
`user_scope_assignments (user_id, peran, scope_level, scope_id,
berlaku_hingga)`. Grants at a higher scope level structurally cover
everything under it via `jalur` containment. Time-bounded grants expire
automatically via a daily job. Anti-escalation enforced by trigger: you
cannot self-grant a non-STUDENT role; only an active `SYSTEM_ADMIN` may grant
`SYSTEM_ADMIN` or platform-level roles. One function,
`punya_cakupan()`/`boleh_pada_subjek()`, is called from both app code and RLS
— preventing the two layers from drifting apart.

**Studio capability model** (Phase 5, replaces raw role-name comparisons):

| Capability | Who holds it | Gates |
|---|---|---|
| `CAN_DRAFT` | Educator, Head of Dept, Institution Admin, System Admin | `/studio/impor` |
| `CAN_REVIEW` | Head of Dept, Institution Admin, System Admin | Edit during review |
| `CAN_FREEZE_RELEASE` | Head of Dept, Institution Admin, System Admin | "Approve & Freeze" |
| `CAN_PUBLISH` | Institution Admin, System Admin only | Publish/withdraw |
| `CAN_FLASH_QUIZ` | Educator, Head of Dept, Institution Admin, System Admin | One-off practice quiz |

`DEAN` holds none of these by design. Legacy `soal` bank also carries a
separate, older three-lane tier model (`PRACTICE`/`TEST`/`EXAM`, `0007`) —
distinct from the PLP capability model.

### 5.5 Lesson media (`0038`)

One JSONB column, not a fourth table. Two CHECK constraints do real work:
`chk_lessons_media_transkrip` rejects any `audio.url`/`video.url` missing a
non-empty `transkrip` — accessibility enforced at the data layer, not the UI.
A trigger blocks writing `media` on any lesson bound to a
`FROZEN`/`PUBLISHED`/`SUPERSEDED` release.

### 5.6 Seed personas (`0039`, dev/staging only)

15 accounts (5 SD students, 5 university students, 2 educators, 1 institution
admin, 1 dean, 1 system admin). Gated behind a one-statement permission
ritual that self-deletes after running, forcing fresh intent each time.
**11 accounts share the password `admin12345`** — correct for staging,
a disaster in production, per the migration's own stated reasoning.

### 5.7 Certificates, across three migrations

- `0003`: base table. `subjek_hmac` duplicates the signed user id alongside
  the FK, specifically so identity-model cleanup can never alter what a
  printed certificate's hash covers.
- `0066`: `certificates.plp_release_id`, additive, outside the HMAC payload
  and outside the freeze-trigger's watched columns — backfillable without
  invalidating anything printed.
- `0067`: PLP-specific columns, including the `plp_session_id` uniqueness
  that makes certificate issuance idempotent.

### 5.8 Views catalog

| View | Purpose | Access |
|---|---|---|
| `sertifikat_publik` | Public certificate lookup, no score internals | Anon-safe |
| `soal_publik` | Legacy bank, ACTIVE items only, no answer key | Anon-safe |
| `cakupan_saya` | Caller's own effective scope grants | Own-row only |
| `items_publik` | PLP anti-leak view — stem/options/hints only | **Revoked from anon/authenticated by `0069`** — service_role only, despite the name |
| `plp_paparan_bertaruh_tinggi` | Per-learner high-stakes exposure history | Service_role only after `0069` |
| `plp_miskonsepsi_kohort` | Cohort misconception aggregate, no `learner_id` | Service_role only, **not tenant-scoped** (K-4 gap) |
| `plp_butir_empiris` | Per-item empirical difficulty/response-time aggregate | Service_role only |
| `lessons_publik` | Lesson content, FROZEN/PUBLISHED only | Anon/authenticated/service_role — intentionally open |
| `lessons_media_perlu_dilengkapi` | Quality-completeness report (not a violation report) | Staff only |

**Note the asymmetry:** `items_publik`'s name implies openness like
`lessons_publik`, but it was pulled back to service_role-only because it
still exposes every stem/option for every frozen release — a harvestable
question bank even without answer keys. Don't assume grant level from name.

---

## 6 · Security posture

### 6.1 The critical historical finding (K-1/K-1a) — closed

All 15 PLP tables originally carried `FOR ALL TO authenticated USING(true)` —
meant as an app-layer convention, not a real boundary. Since the anon key is
public and any learner holds an `authenticated` JWT, any learner could read
every answer key, forge a passing summary, and mint a valid certificate for
an assessment never taken. **Closed by `0069`**: revoked, replaced with
service_role-only, plus `ALTER DEFAULT PRIVILEGES` so future tables don't
inherit the open default. `learner_id` is now derived server-side from the
JWT, never trusted from the request body. `terbitkanSertifikatPLP()`
independently recomputes score from raw `plp_item_responses` rather than
trusting the stored summary (K-2) — two deliberately redundant gates.

### 6.2 Live test results (2026-08-09, the most recent live testing on record)

- **C1 — RLS black-box, real learner JWT: PASS.** Tested through PostgREST
  (not psql-as-postgres, which would bypass RLS). `item_options` SELECT
  refused, `items` SELECT refused, `plp_sessions` SELECT/UPDATE refused. A
  control call confirmed the token was genuinely authenticated. **Scope
  limited** to those specific tables/operations — not exhaustive.
- **C2 — storage security: FAIL, still open.** See §7.

### 6.3 Credential rotation status (as of 2026-08-09, the last known state)

Rotated: Supabase service-role key (had been exposed as a screenshot),
`SESI_PLP_SECRET`, `KARTU_KELAS_SECRET`. **Not rotated, structurally
blocked:** `SERTIFIKAT_SECRET_KEY` — dev-grade
(`12345678901234567890123456789012`) and exposed, but has no `key_version`,
so rotating it today would invalidate every certificate ever printed. Fix
designed (§6.6/§8.4), not implemented.

### 6.4 D-critical — unresolved, live security question

`item_response_logs.user_id` was created as UUID with policy
`respons_baca_sendiri USING (user_id = pintar_user_id())`. But the successful
history of later migrations (`0026`/`0029`, which deal in class-linked,
sometimes non-UUID identities) implies the **live** column may actually be
TEXT. If so, either that policy doesn't exist on the live database, or exists
in some unread third form. **If no owner-scoped read policy exists at all,
every learner's response history has no scoped read restriction** — a live
question, not a hypothetical, and not answerable from migration text alone.
This is why the Stabilization plan places a live-database health check
(Phase A) before any further schema work. **NOT YET VERIFIED.**

### 6.5 Provisional migrations `0085`–`0088` — do not ship, do not delete

| File | Class | Disposition |
|---|---|---|
| `0085_prodi_sd5_kanonik.sql` | Likely already-applied, maybe not | Verify in Phase A — a `NOT VALID` constraint branch may not have run |
| `0086_kolom_gelar_skema.sql` | Replay-only | Retire once confirmed |
| `0087_kurikulum_sma11_geografi.sql` | Replay-only | Retire once confirmed |
| `0088_tipe_user_id_respons.sql` | **Mixed — do not ship as written** | Bundles a probably-replay type conversion with 3 possibly-live findings incl. D-critical (§6.4) |

### 6.6 Other open security findings

- **K-4**: no `institution_id` on any PLP table — no tenant isolation.
  Highest-priority non-blocker; cost only grows with more data.
- **K-5**: `bolehPadaSubjek()` still fails open.
- **K-6**: `verifikasi_sertifikat_publik` lacks a pinned `search_path`.
- **K-7**: middleware doesn't cover PLP routes — an expired class period
  doesn't stop an in-progress PLP session.
- **K-8**: no audit-trail table for item edits, release freezes, certificate
  issuance/revocation, or role grants.
- **P1-5**: class-card learners' certificates filtered by `user_id`
  (`NULL` for card identities) — invisible on their own `/sertifikat`.
  Deliberately not fixed during consolidation ("fixing unreviewed behavior"
  was explicitly rejected mid-pass).
- **P1-7**: two verification surfaces (`/verify/[hash]` vs
  `/verifikasi/[id]`) with no redirect between them. Recommendation: 308
  redirect, never delete the printed-QR path.
- No `package-lock.json` anywhere — `npm ci` is impossible, blocking CI.

All of K-4/K-5/K-6/K-7/K-8/P1-5/P1-7 remain **open as of this writing** — no
delivery folder postdating 2026-08-09 addresses them.

---

## 7 · Storage & assets — the C2 finding

### 7.1 The designed contract

```
lessons.media JSONB  →  { bucket: 'content-assets', path: '<course_id>/<package_id>/<jenis>.<ext>' }
        ↓
POST /api/v1/studio/aset   (Studio-gated, service_role, issues a signed UPLOAD url)
        ↓
storage bucket: content-assets, PRIVATE, service_role-only policy (goal, not yet true)
        ↓
render: short-lived SIGNED read URL issued server-side per lesson view (goal, not yet built)
        ↓
learner's browser
```

### 7.2 C2 — confirmed live P0, status as of this writing: OPEN

Live black-box test (2026-08-09, anon key only, no login):
```
GET /storage/v1/object/content-assets/<path>  →  HTTP 200 · 33,605,033 bytes (a lesson video)
```
Root cause: three Supabase Storage policies from `0060`
(`content_assets_baca_publik` SELECT/public,
`content_assets_unggah_auth` INSERT/authenticated,
`content_assets_ganti_auth` UPDATE/authenticated) survived `0071`, which set
the bucket's `public` flag to `false` and dropped only the policy it had
itself just created. `public=false` only disables the unauthenticated CDN
shortcut — it does nothing to the RLS-governed `/object/content-assets/…`
route, which `content_assets_baca_publik` grants to the `public` role
(includes `anon`). The `authenticated` policies are worse in a different way:
**any logged-in account, including a seeded classroom-card learner, can
overwrite any existing object** up to 400MB.

**Why it's not a one-line fix:** `lib/plp/storage.ts` (client-side upload)
*depends* on `content_assets_unggah_auth` to let the browser upload with the
anon key at all. A coordinated two-part change is required: (1) ship
signed-URL delivery + server-side upload routing, verify it works; (2) only
then run the migration dropping the three residual policies. Reversing the
order takes all lesson media dark in between.

### 7.3 Status update since 2026-08-09 — what actually changed

`patch-C2-remediasi/` now contains the **application code** for step 1:
- `lib/plp/aset-url.ts` — new, server-only, recovers the object path from a
  stored URL and returns a short-lived signed URL via service_role.
- `lib/plp/pelajaran-tampil.ts` — edited to return signed URLs.
- `lib/plp/storage.ts` — edited to route uploads through
  `POST /api/v1/studio/aset` instead of a direct anon-key `.upload()` call.
- `supabase/sql/0089_tutup_kebijakan_content_assets.sql` — the migration
  that drops the three residual policies (**step 2 — must run only after
  step 1 is verified deployed and working**).

**What this status update does NOT confirm:**
- Whether this patch's code has been merged into `pintar-3.0-consolidated/`
  (it currently sits in a separate, unmerged patch folder).
- Whether it has been deployed to staging or production.
- Whether the required verification (signed URL delivery works, Studio
  upload still works, `0089` then run, anon fetch re-tested and refused) has
  happened.
- No dated `MANIFEST.md` inside `patch-C2-remediasi/` was found recording
  any of the above.

**Conclusion, per this document's evidentiary discipline: treat C2 as
CONFIRMED OPEN until someone re-runs the black-box anon-fetch test in
`STABILIZATION-BASELINE-PLAN.md` and gets a refusal.** Code existing is not
evidence of deployment or correctness — the same rule the master handoff
itself insists on elsewhere.

### 7.4 Dead configuration

`NEXT_PUBLIC_GDRIVE_BASE_URL` / `NEXT_PUBLIC_GDRIVE_ROOT_FOLDER_ID` are read
by nothing in the entire tree (confirmed by full-tree search). Recommendation
on file: delete both rather than leave them asserting a contract PINTAR
doesn't implement.

### 7.5 Legacy `/content/...` references

`lessons.media` for SMA10 Ch2/Ch3 contains some `/content/…` paths from an
older convention that 404 today (no `public/` folder exists). `aset-url.ts`
is designed to return `null` for these, hiding the tab rather than rendering
a broken link. Fix is re-ingesting those specific assets, not code.

---

## 8 · Certificates

### 8.1 Shared cryptographic core (`lib/sertifikat.ts`, server-only)

```
payload = `${user_id}|${skor}|${timestamp_iso}|${nomor_sertifikat}`
hash    = HMAC-SHA256(payload, SERTIFIKAT_SECRET_KEY)      // 64-char hex
```
Verification recomputes and compares with `crypto.timingSafeEqual`. Secret
must be ≥32 chars; production throws at boot if unset.

### 8.2 Legacy certificates

Number format `EHC-YYYY-NNNN` (or module-specific prefix). Storage was
flagged in the original (26 July) write-up as an **in-memory Map** —
certificates vanish on restart, don't survive across serverless instances.
**Confirm current state before relying on this** — not independently
re-verified in any later document read for this handoff.

### 8.3 PLP certificates (`lib/plp/sertifikat-plp.ts`) — five binding rules

1. Threshold comes from the release's own blueprint, not a hardcoded
   module-registry constant.
2. Only POSTTEST and EXAM stages certify — PRACTICE never scores, PRETEST is
   a starting point, not an achievement.
3. Number format `CERT-PLP-<JENJANG>-<YYYYMM>-<HEX4>` — a separate numbering
   space from legacy.
4. HMAC payload unchanged; `plp_release_id`/`plp_session_id` live outside the
   signature, so one verification function serves every certificate ever
   printed.
5. Idempotent via `plp_session_id` UNIQUE — concurrent finalize calls can't
   mint two numbers for one session.

**Issuance never fails the learner's result.** A certificate error still
shows the diagnostic summary; `terbitkanUlangBilaTertinggal()` retries on the
next results-page load.

### 8.4 Certificate key-version — designed, not implemented

`SERTIFIKAT_SECRET_KEY` has no `key_version`, so it cannot simply be rotated
even though it's exposed and dev-grade. Designed fix: additive
`certificates.key_version SMALLINT DEFAULT 1` outside the HMAC payload, a
keyring (`SERTIFIKAT_SECRET_KEY_V1`, `_V2`, …), old keys demoted to
verify-only. **Ship the schema + keyring reader before ever rotating** —
rotating first with no keyring invalidates history. Not started.

### 8.5 Open certificate issues

- **P1-5**: class-card learner certificates invisible on their own page (§6.6).
- **P1-7**: two verification surfaces, no redirect (§6.6).
- **Key-version**: §8.4.

---

## 9 · Briefings (educator / dean intelligence)

**Caveat:** this section describes `lib/briefing-pipeline.ts` as of the
pre-PLP baseline. PLP has since added real cohort-aggregation views
(`plp_miskonsepsi_kohort`, `plp_butir_empiris`, `0037`) that look
purpose-built to feed this pipeline — **whether it's actually been rewired
to read them, or still serves the dummy-data fallback below, was not
verified in any document read for this handoff.** Check
`getStatusKohortLive()`'s current implementation before assuming either way.

### 9.1 The 3-Lens model

| Lens | Audience | Question | Artefact | Route | Read time |
|---|---|---|---|---|---|
| Student | Learner | "What should I study next?" | Peta Bacaan Personal | `/pre-test/hasil`, `/hasil` | — |
| Educator | Lecturer | "What should I teach next?" | Class Learning Intelligence | `/edukator/ringkasan` | ~60s |
| Institution | Dean | "Is this program working?" | Institutional Learning Intelligence | `/dekan/ringkasan` | ~90s |

Binding rule: **educators and deans get narrative and decisions, never raw
analytics.**

### 9.2 Dummy-data fallback (as of the pre-PLP baseline)

```
AMBANG_KOHORT_SELESAI = 50   // minimum submissions before a briefing compiles
getStatusKohortLive() → stub, always returns 0
⇒ every briefing surface serves full mock data, banner: "Mode Pengujian: Menampilkan Data Briefing Dummy"
```
The production hand-off point is marked in three functions
(`getBriefingInboxData`, `getRingkasanEdukatorData`, `getRingkasanDekanData`)
— once wired, they return the same typed shape with `isDummyData: false`;
page components should not need to change.

---

## 10 · GitHub transition status

Per `github.md` (last updated 2026-08-09T11:03:56Z, **not refreshed since**):

- `repo: yazidmanan2409/pintar-3.0`, `branch: main`.
- **No content has moved in either direction.** This environment has
  read-only GitHub tools — no push/write capability to send project files to
  the repo.
- The repo currently mirrors the *pre-consolidation* workspace (scattered
  `Pintar 3.0/` baseline + ~90 delivery/handoff bundles + `uploads/`). It
  does **not** contain `pintar-3.0-consolidated/`.
- **Confirmed user intent:** replace the repo's content with
  `pintar-3.0-consolidated/`, flattened to repo root, for Vercel deployment.
  That push must happen from the user's own machine/terminal.
- Screen map: not applicable — nothing has been pushed yet.

The `GITHUB-TRANSITION-MASTER-CONTEXT.md` binding rules (source of truth is
artifacts not AI memory; migrations are first-class source code, never
renumbered for tidiness; large media needs a full storage contract before it
counts as solved; report conflicts, don't silently pick one) govern all of
the above and are already reflected throughout this document.

**As of this writing, the GitHub transition is still at the "push not yet
executed" stage described on 2026-08-09** — no evidence found of it having
progressed since.

---

## 11 · Consolidated issue log

| ID | Finding | Severity | Status |
|---|---|---|---|
| C2 | `content-assets` bucket: anon read + authenticated overwrite | **P0** | **OPEN.** App-side fix coded in `patch-C2-remediasi/`, unmerged/unverified. Migration `0089` not run |
| K-1/K-1a | Blanket-open RLS on all 15 PLP tables | P0 | **Closed** by `0069`, C1-tested (limited scope) |
| K-4 | No `institution_id` — no tenant isolation | P0-priority, deferred | Open |
| K-5 | `bolehPadaSubjek()` fails open | Open | Open — deferred to "Phase 3" |
| K-6 | `verifikasi_sertifikat_publik` unpinned `search_path` | Open | Open — deferred to "Phase 3" |
| K-7 | Middleware doesn't cover PLP routes | Open | Open |
| K-8 | No audit-trail table | Open | Open |
| D-critical | `item_response_logs.user_id` type/policy uncertainty | **Live security question** | **NOT YET VERIFIED** — Phase A exists specifically to answer this |
| P1-5 | Class-card certificates invisible to owner | P1 | Open, deliberately not touched |
| P1-7 | Two verification surfaces, no redirect | P1 | Open |
| validate.ts scope gap | Forbidden-word linter misses 6 of the fields learners read | Systemic | Open |
| PLPItemType gaps | No true/false-battery, matching, image-based item type | Content-modeling | Open, do not paper over with MCQs |
| Two SD5 math content lines | Legacy "Pecahan" vs. PLP-native ch1–9 — relationship unclear | Unresolved ambiguity | Needs a human decision |
| CONTENT-FREEZE #001 | 24/225 SD5 fraction distractors miscoded | Acknowledged, not fixed | Frozen baseline since the Aug-10 Bug Bash |
| No `package-lock.json` | `npm ci` impossible | Blocks CI | Open |
| Briefing pipeline wiring | Unknown whether cohort views are actually wired in | **NOT YET VERIFIED** | Check `getStatusKohortLive()` |
| Legacy certificate storage | In-memory Map, unconfirmed if migrated to Postgres | **NOT YET VERIFIED** | Confirm before relying on it |

---

## 12 · Ordered plan forward

Carried over from `STABILIZATION-BASELINE-PLAN.md` §Q, the authoritative
next-steps source — re-read it in full before starting, don't re-derive:

| # | Step | Changes prod? | Stop condition |
|---|---|---|---|
| 1 | C1 RLS black-box (done, PASS) | No | any disclosure → halt |
| 2 | **Re-verify C2** — confirm `patch-C2-remediasi/` code is merged, deployed, and working before running `0089` | No | file still downloads via anon → do not proceed |
| 3 | C3 certificate count | No | — |
| 4 | Phase A live-database health check (identity columns, RLS shape, D-critical, curriculum-vs-fixture hash match) | No | D-critical unresolved → treat as blocker |
| 5 | Classify `0085`–`0088` against Phase A evidence | No | — |
| 6 | Ship only the forward migrations Phase A proves necessary (incl. `0089`, in correct order) | **Yes** | any fails its own verification |
| 7 | Generate + commit `package-lock.json` | No | `npm ci` fails |
| 8 | Capture baseline (schema + grants + storage config + reference data) from the live DB | No | capture incomplete |
| 9 | Restore to a disposable environment, diff structurally | No | any structural difference |
| 10 | Full application verification against restored DB | No | any gate fails |
| 11 | Restructure repo per the archive plan | No | — |
| 12 | Push to GitHub, enable CI | No | CI must fail a deliberately broken PR |
| 13 | Certificate key-version design review | No | — |
| 14 | Asset contract decision (finish or explicitly defer) | No | — |
| 15 | Identity architecture project (three id spaces, one misleadingly-named function) | Later | — |
| 16 | Assessment-engine retirement path (legacy `soal` vs. PLP) | Later | — |

---

## 13 · Glossary (Indonesian → English)

soal = question item · butir = item/entry · jawaban = answer · opsi = option
· kunci = answer key · skor = score · hasil = result · asesmen = assessment ·
pemetaan awal = initial mapping (pre-test) · uji penguasaan = mastery test
(post-test) · peta bacaan = reading map · gerbang keselamatan = safety gate ·
ambang = threshold · lulus/belum lulus = pass/not yet passed · predikat =
grade title · miskonsepsi = misconception · rasional = rationale · rujukan =
reference · bab = chapter · halaman = page · fase = phase · kohort = cohort ·
peserta = participant · ringkasan = summary/briefing · kesiapan = readiness ·
penguatan = reinforcement · rencana = plan · dekan = dean · edukator =
educator · kaprodi = head of department · sertifikat = certificate ·
penyimpanan = storage · acak = shuffle/random · tandai = flag · jeda = pause
· kosong = empty/unanswered · wajib = mandatory · disarankan = recommended ·
kuat = strong · lewatkan = skip · rilis = release · cetak biru = blueprint ·
dibekukan/beku = frozen · jenjang = education stage · sesi = session ·
petunjuk = hint · arah berpikir = thinking direction · cakupan = scope ·
pengguna = user · gelar = academic title/degree · aset = asset · unggah =
upload · tinjauan = review · antrean = queue · mutu = quality · warisan =
legacy · pratinjau = preview · diterbitkan = published/issued · dicabut =
revoked · sah = valid · tervalidasi/terverifikasi = verified.

---

## 14 · File index by topic

| Topic | Files |
|---|---|
| Product philosophy / doctrine | `docs/PINTAR-3.0-PHILOSOPHY.md`, `CLAUDE.md`, `docs/PINTAR-VOICE-GUIDE.md`, `docs/PINTAR-DESIGN-LANGUAGE.md` |
| PLP content model | `lib/types/plp.ts`, `supabase/sql/0035–0038`, `lib/plp/ingest.ts`, `lib/plp/parser.ts`, `lib/plp/validate.ts` |
| Roles / permissions | `supabase/sql/0013_peran_cakupan.sql`, `lib/izin-studio.ts`, `lib/identitas-studio.ts`, `lib/plp/gerbang-kapabilitas.ts` |
| Seed personas | `supabase/sql/0039_seed_test_accounts.sql` |
| Home / role routing | `lib/beranda-db.ts`, `app/beranda/page.tsx`, `lib/navigasi-peran.ts` |
| Lessons / player | `components/learning/MultimodalLessonPlayer.tsx`, `lib/plp/pelajaran-tampil.ts`, `app/belajar/[release]/page.tsx` |
| Assessment engine | `lib/assessment-assembly.ts`, `hooks/useAsesmen.ts`, `lib/hooks/useHesitationTimer.ts`, `lib/skor.ts` |
| Certificates | `lib/sertifikat.ts`, `lib/plp/sertifikat-plp.ts`, `lib/qr.ts`, `lib/kredensial-tampil.ts`, `supabase/sql/0066/0067/0069` |
| Assets / storage | `lib/plp/storage.ts`, `patch-C2-remediasi/lib/plp/aset-url.ts`, `app/api/v1/studio/aset/route.ts`, `STABILIZATION-BASELINE-PLAN.md` §C2/§K |
| Briefings | `lib/briefing-pipeline.ts`, `lib/edukator-db.ts`, `components/edukator/*` |
| Migration reconciliation | `pintar-3.0-consolidated/CODE-RECONCILIATION-MANIFEST.md`, `.../CONSOLIDATION-PROVENANCE.md`, `.../supabase/MIGRATION-RUN-ORDER.md` |
| Forward plan | `handoff-package-2026-08-09/STABILIZATION-BASELINE-PLAN.md` (§Q is the checklist) |
| Curriculum QA | `docs/AUDIT-KURIKULUM-2026-08-08.md`, `scripts/audit-kurikulum.ts`, `docs/CONTENT-FREEZE.md` |
| Security audits | `docs/AUDIT-SISTEM.md`, `docs/AUDIT-PRAPILOT-2026-08-08.md` |
| Prior handoffs (superseded by this file, kept for provenance) | `docs/PINTAR - System Write-Up (Handover).md` (26 Jul), `PINTAR-3.0-PROJECT-WRITEUP.md` (6 Aug), `handoff-package-2026-08-09/PINTAR-MASTER-HANDOFF-2026-08-09.md` |

*End of document. For migration-by-migration column/constraint detail, see*
*`handoff-package-2026-08-09/PINTAR-DATABASE-SCHEMA-REFERENCE.md`. For the*
*exact commands behind any "designed" item in this file, see*
*`handoff-package-2026-08-09/STABILIZATION-BASELINE-PLAN.md`.*
