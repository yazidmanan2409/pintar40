# PINTAR (internal designation: PINTAR 4.0) — Master Overview Prompt (Fable 5.1, ground-zero rebuild)

*Synchronized to the PINTAR 4.0 Architecture Baseline Candidate
(docs/rebuild/01–16, 2026-09-12). Where this prompt and a docs/rebuild/
document disagree, the document wins; this prompt is the execution
sequence, not the architecture.*

Paste this once, at the start of a new Fable 5.1 project. It sets context that
every phase prompt (01–06) assumes. Do not paste the phase prompts until this
one has been acknowledged.

## Read first

`docs/rebuild/15-FABLE-5.1-START-HERE.md`, then this prompt, then
`docs/rebuild/02`–`13` and `16` in order, then `14` and `11`. The
architecture documents are the controlling contracts:

- **02** canonical domain model · **03** invariants (INV-01…INV-38) ·
  **04** state machines · **05** authorization matrix · **06** evidence &
  telemetry contract · **07** assessment engine contract · **08** content
  versioning contract · **09** scope boundaries (BUILD NOW / FOUNDATION NOW /
  LATER / PARK) · **10** removed features and anti-patterns · **11** open
  decisions · **12** failure modes · **13** ADR template · **16**
  engineering & verification system.

Every acceptance test in Phases 1–6 traces back to an invariant id, a
lifecycle transition, or an authorization-matrix cell.

## Governing principle

**CALM ON THE SURFACE. RIGOROUS UNDERNEATH.** PINTAR absorbs complexity
rather than transferring it to its users. Learners, educators,
administrators and institutional leaders experience clarity, calm and
obvious next actions; underneath, PINTAR is rigorous in evidence,
assessment, security, authorization, provenance, content governance,
historical reproducibility, auditability, credential integrity, data
isolation and resilience. Simplicity on the surface is never bought by
weakening those foundations. Ask of every decision: does this make PINTAR
calmer for the person using it while making the system more rigorous
underneath?

Authority order when requirements conflict: Dr. Gladys's learning cycle →
Doctrine & Philosophy → approved architecture decisions (the baseline) →
invariants (doc 03) → capabilities → implementation. PINTAR 3.0 is
reference material, never migration authority. Preserve the lesson,
discard the implementation.

## What you are building

PINTAR is an Indonesian-language learning platform spanning SD (primary) →
SMP → SMA (secondary) → University → professional education. It is not a
quiz app. It is a diagnostic + certification + institutional-intelligence
system built on one canonical content object: the **PINTAR Learning Package
(PLP)**, one canonical **Person-centred learner identity** that transcends
institutions, and **one authoritative assessment engine**.

This is a **complete ground-zero rebuild** — new Supabase project, new
codebase, no migration from a prior system, no legacy tables, no historical
numbering to preserve. Where earlier design notes below mention "legacy"
patterns, they exist only as decisions already made, not code to port.

**Naming:** "PINTAR 4.0" is an internal designation. It never appears on
any learner, educator, administrator or public surface — certificates,
verification pages, emails, reports, PDFs, public APIs/docs, marketing.
Publicly the product is PINTAR.

## Product philosophy (binding on every screen you design)

Objective: not the most features — **the least friction between knowledge
and learning.** Every screen answers one question: what does this person
need to do next?

- Knowledge is the centre, not files/databases/AI: `Knowledge → Distillation
  → Learning Package → Learning Experience`.
- The PLP is the one canonical educational object. PINTAR owns the content
  model; any producer (AI or human, NotebookLM, Claude, Gemini, a
  publisher) feeds it through Easy Upload or Structured Package Import —
  never lock authoring to one vendor, never let a vendor's concepts into
  the domain model (INV-32).
- Offer creation, never configuration. Users see "Create Learning Package /
  Assessment / Video" — never "Import / Parse / Validate" as user-facing verbs.
- One screen, one question. The workflow discovers the user (student,
  educator, head of department, dean, admin) — the reverse never happens.
- Progressive disclosure: no JSON, PLP jargon, parser status, lifecycle
  enum names, evidence classes or schema language in front of non-engineers.
- Validation reads as coaching: Lokasi (location) · Masalah (problem) ·
  Mengapa penting (why it matters) · Cara memperbaiki (how to fix). Never a
  raw error message. Publish Readiness reads as `Ready` / `Action Required`
  / `Blocked` with the exact blockers named.
- Every content object has a lifecycle:
  `INGESTED → STRUCTURED → VALIDATED → IN_REVIEW → APPROVED → FROZEN →
  PUBLISHED → SUPERSEDED` (plus a `VALIDATION_FAILED` branch off VALIDATED).
  APPROVED ≠ FROZEN: APPROVED is a human sign-off; FROZEN means the content's
  hash is computed and the row becomes immutable. **PUBLISH ≠ ASSIGN:**
  publishing makes a release available to the institution; a Learning
  Assignment makes it expected of a class/cohort (doc 02, doc 04 §4).
- Human authority is preserved: **AI proposes → PINTAR validates → humans
  govern.** AI has no pedagogical authority; nothing AI-produced reaches a
  learner without human review and a human `CAN_PUBLISH`.
- The educator is not automated; unnecessary educational workload is.
  PINTAR gives educators more time to do what only they can do.
- Entry is by purpose, not a homepage. Routing is role/intent-based, never a
  marketing landing page.

## The learner cycle (canonical — Dr. Gladys)

```
Pre-Test — Pemetaan Awal → Peta Bacaan Personal → Learning → Post-Test — Uji Penguasaan → Results / Growth / Mastery
```
Pre-test is diagnostic, never pass/fail; wrong answers are misconception
evidence. Pre-test and post-test share **zero identical items and zero
`parallel_group` siblings** (INV-24) — never "avoid overlap where possible."
Mastery = overall passing rule **and** 100% on safety-critical items where
such content applies (INV-10).

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

Assistance behaviour: never immediate — wait a hesitation window that is a
**governed parameter of the Assessment Definition within platform bounds**
(a default of roughly 20–30 s is a configuration value, never a constant in
code), then reveal an inline pill, never a modal or banner. Hints arrive
progressively, never reveal the answer, never reduce the score. Telemetry
(`hesitation_threshold_reached`, `assistance_offered`, `assistance_opened`,
`assistance_level_used`) is for learning analytics and item design only —
must never feed scoring. Enforce this at the schema level (its own
table/columns, not readable by any scoring view), not just by convention
(INV-11). Any AI that produces learner-facing assistance runs in the
**Learner Assistance Intelligence Context**, built only from the
learner-sanitized item shape — it structurally cannot see answer keys,
misconception-to-answer maps or grading secrets; a prompt saying "do not
reveal" is never the control (INV-31).

## Security non-negotiables (doc 15 §"Security non-negotiables"; invariants in doc 03)

1. **RLS default is closed, always** (INV-36). Every new table starts with
   RLS enabled and zero policies until a specific policy is written and
   justified. Never ship `FOR ALL TO authenticated USING (true)` as a
   placeholder, even temporarily. Set `ALTER DEFAULT PRIVILEGES` so future
   tables never silently inherit an open grant.
2. **Storage is service_role-gated from day one** (INV-15). No bucket is
   ever `public = true`, and no storage policy ever grants
   `SELECT`/`INSERT` to `public` or `anon`. All reads happen through
   short-lived server-issued signed URLs; all writes happen through a server
   route that uses `service_role`, never a direct client `.upload()` call
   with the anon key.
3. **Hints can never leak the answer — enforce it in the database** (INV-02).
4. **Every wrong-answer option requires a non-empty rationale** (INV-03).
5. **Certificates bind, inside the signed payload, everything they attest
   to** (INV-05, INV-30): certificate number, learner identity snapshot (or
   its hash), result, issuance time, `plp_release_id` **and the release
   content hash**, assessment definition id/version, and `key_version`.
   Keys are a versioned keyring from the first migration (INV-07). The
   identity snapshot is immutable; profile changes never alter an issued
   certificate.
6. **One canonical public verification route** (INV-38).
7. **Tenant isolation from day one** (INV-13) — and learner identity is
   Person-centred: a Person is never owned by an institution or a class;
   Enrollments and Memberships are dated, append-only (INV-23, INV-25).
8. **Every `SECURITY DEFINER` function pins `search_path`** (INV-14).
9. **An append-only audit-trail table exists from day one** (INV-18).
10. **Middleware/server authorization covers every authenticated route,
    including learning and assessment routes** (INV-37) — but an assignment
    window closing or a class ending does **not** interrupt a legitimately
    started session; only revocation, scope revocation, security
    intervention or explicit authorized termination do (INV-17, INV-27).
11. **The forbidden-word/safety-language linter scans every field a learner
    can read** (stem, stimulus, option text, hints, lesson body,
    transcripts, misconception remediation). Genuine field-of-study
    language is not a violation.
12. **Service-role credentials never exist client-side; answer keys and
    grading secrets never reach the learner browser or a learner-facing AI
    context** (INV-01, INV-31, INV-37).
13. **Evidence eligibility is structural** (INV-20, INV-33): every evidence
    row carries `evidence_class` (`OFFICIAL` / `PREVIEW` / `SYNTHETIC` /
    `PUBLIC_DEMO`) and `evidence_channel`; analytics, Question Health,
    psychometrics, certificates and reporting read only eligibility views
    and hold no grant on raw evidence tables. Never a per-query `WHERE`.
14. **One authoritative assessment engine** (INV-26): learning cycle,
    practice, test, exam, Quick Assessment, public demo and paper
    (foundation) are *modes*; no second assembler, sanitizer, scorer or gate
    ever exists. A thin vertical slice ships with an explicit retirement
    condition; it never becomes a second permanent system.
15. **Historical evidence never mutates** (INV-04, INV-29, INV-33): every
    result records release id+hash, definition version, engine version and
    scoring-policy version; corrections are new releases / new policy
    versions / new audited rows.
16. **No fabricated data, ever:** honest "not enough data" states instead
    of dummy fallbacks; predicted difficulty separate from empirical;
    empirical fields honestly empty until legitimately computed.
17. **The user is not middleware** (doc 16): GitHub is source truth; CI and
    canonical, ordered, upgrade-tested migrations; no manual production SQL;
    no delivery-folder relay.
18. **One canonical content line per subject/grade** — never a second
    curriculum by accident; never reuse a legacy table name from doc 10
    (e.g. the old `soal` bank).
19. **Item types match the source material** — the type registry is
    extensible and every type is served by the one engine; which types get
    real V1 content is OD-8 (ask, don't guess).

Anti-patterns in `docs/rebuild/10-PINTAR-REMOVED-AND-REJECTED-FEATURES.md`
§2 are never reintroduced. If you meet one in old material, it is
historical record, not spec.

## The Quality Gate — every feature passes this before it ships

Three questions, in order. If any answer is "no," the feature does not ship:

1. **Calm on the surface?** Can the user complete their task without
   training or a manual? (Student scans a QR and starts immediately.
   Educator launches a Quick Assessment in about a minute. An administrator
   uploads a valid chapter and sees `Ready` or exactly what is not. No
   internal state names, versions or evidence classes shown to a
   non-engineer.)
2. **Rigorous underneath?** Server-authoritative scoring (no answer keys or
   logic on the client), enforced multi-tenant hierarchy, granular
   RBAC/scope, full evidence provenance, structural eligibility — never
   hardcoded item logic, never floating data detached from a Person,
   enrollment, release and definition.
3. **Intelligent after the data?** Does the collected evidence produce an
   actionable narrative decision for a human, not a raw chart or an
   autonomous verdict? (An educator gets a timed lesson plan built from
   real misconceptions; Question Health highlights an item for review — the
   educator decides; a dean gets a narrative over canonical metrics — never
   an unannotated number that feeds no decision.)

Apply this gate per feature, per role, before calling any phase done.

## Verification, audit and engineering doctrine (doc 16 — binding)

- **`npm run selftest` is a defined, versioned test contract** with a
  manifest listing every test by id and the invariant/lifecycle/matrix cell
  it proves — not "whatever tests happen to exist." A phase is done when
  the whole accumulated contract exits 0; no partial credit; no silently
  skipped tests.
- Tests run against a real (local/staging) Supabase instance through the
  same REST/RPC paths a real client would use — not a superuser bypass.
- **Persona harness** (doc 16 §3): a deterministic synthetic environment
  (learner, educator, reviewer, institution admin, platform admin, public
  user; at least two synthetic institutions) whose evidence is `SYNTHETIC`
  by tenant inheritance and can never reach anything official.
- **Adversarial regression fixtures** (doc 16 §4) are part of the contract
  from the phase that introduces the mechanism they attack.
- **Audit cadence:** Baseline → FABLE-01 → mini audit → fix → gate →
  FABLE-02 → … Each phase ends with a bounded independent/adversarial audit
  that searches explicitly for the dangerous patterns in doc 16 §5. A major
  defect found only at the end means an earlier gate failed.
- **Stop-patch-loop:** if the same gate fails 2–3 times, stop; root cause,
  invalid assumption, clean reproduction, design correction, regression
  test, ADR (doc 13). Then proceed.
- **ADRs from Phase 1** per doc 13's triggers, each with its calm-surface
  check and its Requirement → Architecture → Implementation → Test → Audit
  Evidence trace.
- **Engineering system:** GitHub trunk from commit one; PRs and CI for
  every contributor including AI sessions; canonical ordered migrations
  tested against a clean install and the supported upgrade path;
  expand → compatible deploy → backfill → switch → contract for anything
  touching live sessions; secrets only in the deployment secret store.
- Where something genuinely cannot be automated (copy/tone and visual
  calm-surface review), it is the one deliberate manual gate.

## Design language

Do not redesign PINTAR visually. Inherit and refine the established
language: **quiet, warm, intelligent PINTAR** — neutral/off-white surfaces,
the established primary identity, restrained pastel accents, generous
whitespace, strong hierarchy, very limited typography, calm semantic
status. No rainbow dashboards, card-colour salad, many fonts, decorative
gradients, neon "AI" aesthetics, excessive animation, confetti, punitive
error states, or unnecessary alarms/popups. Enforced by a versioned token
set (Phase 1) and the manual calm-surface review.

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS. Supabase (Postgres +
Auth + Storage) as the backend, new project, created fresh for this build.
Deployment target and infrastructure are chosen fresh under doc 16 — no
vendor/DNS recipe is inherited from old handoffs. Indonesian naming
convention for domain code and copy (`butir`, `sertifikat`, `jenjang`,
etc.) — English is fine for generic infra code (`middleware.ts`,
`lib/supabase-server.ts`). Never reuse a legacy table name listed in
doc 10.

## Scope — binding

Build exactly doc 09 **BUILD NOW**. **FOUNDATION NOW** items get the
boundary and nothing more (AI Provider Gateway, AI provenance, AI trust
contexts, Mini-PINTAR isolation, paper evidence channels, feature flags,
integration boundary, retention/anonymization shape, platform/data
versioning, historical report provenance, cross-student integrity
foundation, PINTAR Care boundary, patent/innovation register link,
extensible item-type registry). **LATER** and **PARK** items are not built,
regardless of how easy an extension point makes them — operational
Rasch/IRT, advanced Question Health, anchor-overlap mode, multi-provider AI
routing, Integrity Case workflow, paper workflow, scheduled reports,
SSO/integrations, cross-institution content sharing, parent experience,
proctoring/surveillance, OMR, NFC, cross-school benchmarking, arbitrary
SQL/formula metrics, gamification. Moving an item needs a recorded
product-owner decision and an ADR. If a phase prompt seems to imply a
LATER/PARK item, stop and flag it.

## Open decisions — do not guess

`docs/rebuild/11-PINTAR-OPEN-DECISIONS.md`: OD-1 (accreditation
framework), OD-3 (source editions/ISBNs), OD-5 (legal retention durations),
OD-8 (which non-MCQ types get real content), OD-9 (transfer
authorization/consent policy), OD-10 (certificate identity presentation),
OD-11 (public Mini-PINTAR in first release) are **MUST ASK** items. Do not
proceed past the phase that needs an answer. Never invent a source
citation, a retention period, a consent rule or an accreditation rubric.

## Content in scope for v1

SD (primary) mathematics, SMA (senior high) mathematics and geography, and a
university-level professional certification course — built as fresh
PLP-native content from source material, not ported. Confirm exact source
books/chapters with the product owner (OD-3) before content authoring
starts; do not invent source citations. Fixture content may be used for
tests and is always `SYNTHETIC`.

## How to use the phase prompts

Six phases, each a separate prompt (`FABLE-01` … `FABLE-06`):

| Phase | Owns |
|---|---|
| FABLE-01 | Foundation: Person identity, institutions, Academic Periods, Enrollments, Memberships, Transfer domain, roles/scopes/capabilities, RLS, storage, audit, engineering system, persona harness skeleton, Config Studio shell |
| FABLE-02 | PLP content model, content lifecycle, assessment definitions, evidence/session/response/telemetry/integrity schema with provenance and structural eligibility, Learning/Assessment Assignment schema, Question Health and quality-finding schema, validator, ingestion data layer |
| FABLE-03 | Learner experience: the Dr. Gladys cycle on the one engine's core services, lesson player, assistance, results |
| FABLE-04 | The one assessment engine completed (modes, continue permission, resilience/replay, scoring reproducibility, Quick Assessment, integrity evidence), certificates, verification |
| FABLE-05 | Studio: Easy Upload / Structured Package Import, MCQ Quality, review, Publish Readiness, freeze/publish, Learning Assignment and release-correction policy, Config Studio panels |
| FABLE-06 | Intelligence: metric catalogue, Standard Reports, Institution Report Templates, briefings, Question Health signals and review, launch readiness |

Work them in order — each depends on schema/conventions the previous phase
establishes. Each phase prompt ends with its own acceptance checklist and is
followed by a bounded mini audit (doc 16 §6); do not start the next phase
until the checklist is green and the audit gate is passed. If something in
a later phase seems to require re-opening an earlier phase's schema, stop
and flag it rather than quietly patching around it.
