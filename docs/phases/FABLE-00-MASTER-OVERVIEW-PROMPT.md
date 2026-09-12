# PINTAR 3.0 — Master Overview Prompt (Fable 5.1, ground-zero rebuild)

Paste this once, at the start of a new Fable 5.1 project. It sets context that
every phase prompt (01–06) assumes. Do not paste the phase prompts until this
one has been acknowledged.

## What you are building

PINTAR is an Indonesian-language learning platform spanning SD (primary) →
SMP → SMA (secondary) → University → professional education. It is not a
quiz app. It is a diagnostic + certification + institutional-intelligence
system built on one canonical content object: the **PINTAR Learning Package
(PLP)**.

This is a **complete ground-zero rebuild** — new Supabase project, new
codebase, no migration from a prior system, no legacy tables, no historical
numbering to preserve. Where earlier design notes below mention "legacy"
patterns, they exist only as decisions already made, not code to port.

## Product philosophy (binding on every screen you design)

Objective: not the most features — **the least friction between knowledge
and learning.** Every screen answers one question: what does this person
need to do next?

- Knowledge is the centre, not files/databases/AI: `Knowledge → Distillation
  → Learning Package → Learning Experience`.
- The PLP is the one canonical educational object. Any producer (AI or
  human) feeds the same PLP format — never lock authoring to one AI vendor.
- Offer creation, never configuration. Users see "Create Learning Package /
  Assessment / Video" — never "Import / Parse / Validate" as user-facing verbs.
- One screen, one question. The workflow discovers the user (student,
  educator, head of department, dean, admin) — the reverse never happens.
- Progressive disclosure: no JSON, PLP jargon, parser status, or schema
  language in front of non-engineers.
- Validation reads as coaching: Lokasi (location) · Masalah (problem) ·
  Mengapa penting (why it matters) · Cara memperbaiki (how to fix). Never a
  raw error message.
- Every content object has a lifecycle:
  `INGESTED → STRUCTURED → VALIDATED → IN_REVIEW → APPROVED → FROZEN →
  PUBLISHED → SUPERSEDED` (plus a `VALIDATION_FAILED` branch off VALIDATED).
  APPROVED ≠ FROZEN: APPROVED is a human sign-off; FROZEN means the content's
  hash is computed and the row becomes immutable.
- Human authority is preserved: AI generates → educators review →
  institutions approve → PINTAR measures → evidence loops back into content.
- Entry is by purpose, not a homepage. Routing is role/intent-based, never a
  marketing landing page.

## Learning Safety Doctrine — supersedes any conflicting UI/copy decision

"Learning should never feel intimidating." Assessment exists to understand
how a learner thinks, not only whether they're right.

1. Mistakes are evidence of a mental model. Never shame; always teach.
2. No dead ends. A wrong answer always offers a next step (hint, example,
   reading recommendation) — never a static "Incorrect" screen.
3. Support without dependency: assistance gives just enough for the learner
   to find the answer themselves. It must never reveal the correct option.
4. Respect the learner. Forbidden words anywhere a learner reads them:
   `Wrong`, `Failed`, `Salah`, `Incorrect`, `Penalty`, `You should know this`.
   Preferred: `Belum tepat`, `Mari kita lihat dengan cara lain`, `Mari kita
   pikirkan bersama`, `Coba sekali lagi`, `Perlu arah berpikir?`.
5. Challenge without fear: allow productive struggle. Wait through a
   hesitation window before offering help.

Progressive assistance by stage:

| Stage | Trigger copy | Support type | Goal |
|---|---|---|---|
| SD | 🤔 Perlu contoh? | Concrete visuals (pizza, blocks, number line) | Help children see |
| SMP | 💡 Perlu petunjuk? | Guiding clues ("Perhatikan penyebutnya") | Help students notice |
| SMA | 🧭 Perlu arah? | Structural/method guidance | Help students structure |
| University | 🧭 Perlu arah berpikir? | Professional/clinical reasoning prompts | Build professional judgment |

Assistance behaviour: never immediate — wait a configurable hesitation window
(≈20–30s default, no selection made), then reveal an inline pill, never a
modal or banner. Telemetry (`time_before_assistance`, `assistance_offered`,
`assistance_opened`) is for learning analytics and item design only — must
never feed scoring. Enforce this at the schema level (its own table/columns,
not readable by any scoring view), not just by convention.

## Non-negotiables carried over from a prior build (bake these in from day one)

These are lessons paid for already — do not re-discover them by making the
same mistakes:

1. **RLS default is closed, always.** Every new table starts with RLS
   enabled and zero policies until a specific policy is written and
   justified. Never ship `FOR ALL TO authenticated USING (true)` as a
   placeholder, even temporarily. Set `ALTER DEFAULT PRIVILEGES` so future
   tables never silently inherit an open grant.
2. **Storage is service_role-gated from day one.** No bucket is ever
   `public = true`, and no storage policy ever grants `SELECT`/`INSERT` to
   `public` or `anon`. All reads happen through short-lived server-issued
   signed URLs; all writes happen through a server route that uses
   `service_role`, never a direct client `.upload()` call with the anon key.
   (A prior build shipped exactly this hole — public bucket read plus
   authenticated overwrite of any object up to 400MB — treat this as the
   canonical cautionary example, not a pattern to reference in UI or code
   comments.)
3. **Hints can never leak the answer — enforce it in the database.** Any
   column holding a hint/scaffold/"arah berpikir" gets a regex CHECK
   constraint blocking it from naming or narrowing to the correct option.
   This is a database constraint, not a lint rule.
4. **Every wrong-answer option requires a non-empty rationale.** A
   distractor without a taught reason is not allowed to exist.
5. **Certificates carry a key version from day one.** Design the HMAC
   signing key as a versioned keyring (`key_version` column, `SECRET_V1`,
   `SECRET_V2`, …) from the very first migration — never as a single secret
   with no rotation path. `subjek_hmac` (or equivalent) duplicates the signed
   identity next to the FK so identity-model changes can never alter what a
   printed certificate's hash covers.
6. **One canonical public verification route.** Do not build two verification
   URL shapes and defer reconciling them. Pick one route, one hash scheme.
7. **Tenant isolation from day one.** Every PLP content and session table
   carries an `institution_id` (or scope path) from its first migration —
   do not ship a multi-tenant-shaped product without tenant isolation and
   plan to retrofit it.
8. **Every `SECURITY DEFINER` function pins `search_path` explicitly.**
   No exceptions, checked at review time.
9. **An audit-trail table exists from day one** for item edits, release
   freezes, certificate issuance/revocation, and role grants. Do not defer
   this to "Phase 3."
10. **Middleware covers every authenticated route, including learning and
    assessment routes** — an expired class period or scope grant must
    actually stop an in-progress session, not just gate the dashboard shell.
11. **The forbidden-word/safety-language linter scans every field a learner
    can read**: stem, stimulus, option text, hints, lesson body, lesson
    transcripts, misconception remediation text — not just hints and
    rationale. Genuine field-of-study language (e.g. "gagal panen" / crop
    failure in an agriculture item) is not a violation; only doctrine-word
    hits on the forbidden list are.
12. **`npm ci` must work from commit one.** Commit a lockfile. Set up CI
    (lint, typecheck, a smoke test) before the feature surface grows, and
    make sure a deliberately broken PR actually fails it.
13. **One SD5 mathematics curriculum, not two.** Build a single canonical
    PLP-native content line per subject/grade — there is no legacy content
    line to reconcile against, so don't create a second one by accident
    (e.g. a quick "practice bank" that quietly becomes a parallel curriculum).
14. **Item types must match what's actually in the source material.** Don't
    force every source item form into multiple-choice. Support at minimum:
    single-select MCQ, multi-select MCQ, numeric/step-work entry, grid/cell
    interaction, true/false batteries, matching pairs, and image-anchored
    items. If a new form appears that doesn't fit, say so rather than
    approximating it with an MCQ.

## The Quality Gate — every feature passes this before it ships

Three questions, in order. If any answer is "no," the feature does not ship,
full stop — this is not a style preference, it's the acceptance bar:

1. **Simple on the surface?** Can the user complete their task without
   training or a manual? (Student scans a QR and starts immediately.
   Educator starts a class in one tap. No complex setup menu shown to a
   non-admin.)
2. **Structured underneath?** Server-authoritative scoring (no answer keys
   or logic on the client), enforced multi-tenant hierarchy, granular
   RBAC/scope — never hardcoded item logic, never floating data detached
   from an institution/cohort.
3. **Intelligent after the data?** Does the collected telemetry produce an
   actionable narrative decision, not a raw chart? (An educator gets a
   timed lesson plan built from real misconceptions; a dean gets an
   audit-ready accreditation narrative — never an unannotated number that
   feeds no decision.)

Apply this gate per feature, per role, before calling any phase done.

## Self-test doctrine — automated verification, not manual click-through QA

A prior build required a human to manually re-verify every phase's
checklist by hand in the browser — expensive and error-prone, and the exact
thing to not repeat. From Phase 1 onward:

- Every phase ships its own automated test suite alongside the feature code
  — not written after the fact, not deferred to "later polish." A
  checklist item that can be scripted (RLS refusal, hash immutability,
  certificate round-trip, validator catching a planted violation, etc.)
  **must** be a runnable test, not a manual step for a human to click
  through.
- Tests run against a real (local/staging) Supabase instance through the
  same REST/RPC paths a real client would use — not against a superuser
  connection that bypasses RLS, and not mocked in a way that hides the real
  policy.
- One command runs the full suite (e.g. `npm run selftest` or the CI job
  itself) and exits non-zero on any failure. A phase is not "done" until
  this command is green — the human should never need to open the app and
  click through a checklist to find out if a phase passed.
- Each phase prompt's "acceptance checklist" is written as a literal test
  list: translate every checklist item into an actual automated test
  (integration test hitting real endpoints/RLS, a unit test on a pure
  function, or a seed-and-query script) that is added to the suite that
  phase and kept running in every later phase — regressions in Phase 5 that
  break a Phase 1 guarantee must be caught automatically, not rediscovered
  by hand.
- Where something genuinely cannot be automated (a subjective copy/tone
  review, a visual layout check), say so explicitly and keep that one item
  as the only manual step — don't let "hard to automate" quietly become
  "everything is manual."

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS. Supabase (Postgres +
Auth + Storage) as the backend, new project, created fresh for this build.
Indonesian naming convention for domain code and copy (as in the doctrine
above: `soal`, `butir`, `sertifikat`, `jenjang`, etc.) — English is fine for
generic infra code (`middleware.ts`, `lib/supabase-server.ts`).

## Content in scope for v1

SD (primary) mathematics, SMA (senior high) mathematics and geography, and a
university-level professional certification course — same subject areas as
before, built as fresh PLP-native content from source material, not ported.
Confirm exact source books/chapters with the product owner before content
authoring starts; do not invent source citations.

## How to use the phase prompts

Six phases, each a separate prompt (`FABLE-01` … `FABLE-06`). Work them in
order — each depends on schema/conventions the previous phase establishes.
Each phase prompt ends with its own acceptance checklist; do not start the
next phase until that checklist passes. If something in a later phase seems
to require re-opening an earlier phase's schema, stop and flag it rather than
quietly patching around it.
