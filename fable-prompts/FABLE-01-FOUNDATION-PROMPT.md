# FABLE-01 — Foundation: Identity, Enrollment, Roles, Academic Hierarchy, Storage Contract, Engineering System

*Synchronized to the Architecture Baseline (docs/rebuild/01–16). Controlling
documents for this phase: 02 (Organisation; Identity, enrollment and
authorization), 03 (INV-07, 13–18, 21, 23, 25, 36–38), 04 §3–3c, 05, 16.*

Paste after `FABLE-00-MASTER-OVERVIEW-PROMPT.md` has been acknowledged. This
phase has no learner-facing UI yet beyond a login screen — it is the ground
every later phase stands on. Do not start content or assessment work before
this phase's checklist passes and its mini audit gate is closed.

## 1. Project setup and engineering system (doc 16 §1–2)

- New Next.js (App Router, TypeScript, Tailwind) project.
- New Supabase project. Record project ref, URL, anon key, service_role key
  in `.env.example` as placeholders only — never commit real secrets;
  secrets live only in the deployment system's secret store.
- **One GitHub repository, one trunk, real commits, from commit one.** All
  work — including work done in AI sessions — lands through branches and
  pull requests on that trunk. No `delivery-*`/`handoff-*`-style parallel
  folder pattern is ever created, even as a working convenience (Lesson 12).
  The product owner never relays files or SQL between a session and the
  repository: **the user is not middleware.**
- `package-lock.json` committed from the first commit; `npm ci` works.
- CI (GitHub Actions or equivalent): install via `npm ci`, lint, typecheck,
  the selftest contract, schema-lint, and migration runs against **both** a
  clean database **and** the previous released schema (upgrade path — from
  the second migration onward). Verify a deliberately broken PR fails it
  before moving on — a phase-1 acceptance item, not deferred.
- **One linear migration history.** No second numbered series, ever. Every
  migration is canonical, ordered, source-controlled, reproducible. No
  provisional "maybe applied" migrations. No manual production SQL as a
  workflow — immutable tables get no admin override path.
- **Selftest contract manifest** (`selftest.manifest.*`): every test has an
  id and the invariant/lifecycle/matrix cell it proves; `npm run selftest`
  runs exactly the manifest and exits non-zero on any failure or skipped
  test without a reviewed justification.
- `docs/adr/` exists with ADR-0001 (this phase's foundation decisions) per
  doc 13, including the calm-surface check and the traceability section.
- **Design tokens:** a small versioned token set (colour, type scale,
  spacing, status semantics) in the repo, matching the established PINTAR
  visual language (doc 15, doc 16 §9). No screen introduces a font, colour
  or status treatment outside it.
- Feature-flag mechanism (platform- and institution-scoped) exists as a
  foundation — used by later phases and by the emergency-deployment
  scenario (doc 16 §8).

## 2. Identity, Persons and sessions (doc 02 "Identity, enrollment and authorization")

- **Person** is the platform-wide identity: one human, never structurally
  owned by an institution or a class. Profile (display name, mutable
  fields) and **profile-photo support** live here; the photo is a storage
  path under §7's private-bucket contract, never a public URL.
- **Account** is a login credential set attached to exactly one Person:
  passwordless email/magic-link for most users, and a separate
  classroom-card PIN path for young learners (no email required), modelled
  as its own account type from the start. A Person may hold more than one
  Account over time; evidence is attributed to the Person.
- Idle auth sessions expire after 24h. (Auth-session expiry is not an
  assessment-session interruption event — see doc 04 §5.)
- **Seed/persona data** runs only inside **synthetic institutions** flagged
  at the tenant level (`is_synthetic`), gated behind an explicit
  non-production guard (env flag / project-ref allowlist — INV-21), plus the
  self-deleting permission statement. Realistic per-persona passwords; never
  one shared password. This is the skeleton of the persona harness (doc 16
  §3): learner, educator, reviewer, institution admin, platform admin,
  public user, across at least two synthetic institutions.

## 3. Academic hierarchy, Academic Periods, Enrollments, Memberships (doc 02 "Organisation"; doc 04 §3–3b)

`institutions → faculties → departments → programmes → cohorts → classes`
(subjects are an attribute of courses/classes, not a hierarchy node).
Every node carries an ancestor-path array (e.g. Postgres `ltree` or a
`UUID[]` "jalur" column) maintained by triggers, so authorization checks
reduce to one indexed containment check. Moving a node must cascade the
path downward so it's never a stale cache. The migration's own final check
fails the whole migration if any row ends up with a missing/malformed path.
Institutions are deactivated, never deleted.

- **Academic Period**: institution-defined bounded span (year/semester/
  term). Append-only — a new year is a new row.
- **Institution Enrollment**: (person, institution, academic period,
  programme where applicable, `valid_from`, `valid_to`, status, end reason)
  with the lifecycle `PENDING → ACTIVE → ENDED{COMPLETED | TRANSFERRED_OUT |
  WITHDRAWN | EXPIRED}` / `CANCELLED`, enforced by a transition trigger.
  Append-only: ending closes `valid_to`; nothing is deleted.
- **Class / Cohort Membership**: (enrollment, class or cohort, academic
  period, `valid_from`, `valid_to`, close reason). **A period rollover
  closes memberships and creates new ones; it never updates a class id in
  place** (INV-23). A Person has no mutable `class_id`/`cohort_id` column.
- **Class** carries its Academic Period and lifecycle `SCHEDULED → ACTIVE →
  ENDED` / `CANCELLED` (doc 04 §3).
- A bulk **period-rollover** service (e.g. 400 learners to the next year)
  exists in this phase as a server function with audit; its Config Studio
  surface is §10.

## 3a. Transfer domain (doc 02 "Transfer"; doc 04 §3c; INV-25) — BUILD NOW

- Transfer entity with lifecycle `REQUESTED → AUTHORIZED → EXECUTED` /
  `REJECTED` / `CANCELLED`, enforced by trigger; records requesting and
  authorizing actors on both sides, the record classes carried, and the
  consent facts the configured policy requires.
- **Record classes** are declared per evidence/record table as *portable*
  (verified progression, completed learning evidence, mastery history,
  credentials where policy permits) or *institution-scoped* (administrative
  notes, integrity cases, audit material, staff annotations). Only portable
  classes become readable to the receiving institution on EXECUTED.
- Every evidence row carries an immutable `enrollment_id`; a transfer never
  re-parents it. New evidence at the receiving institution belongs to the
  receiving enrollment.
- Execution is a server function (`service_role`) that creates the
  receiving enrollment ACTIVE, ends the sending enrollment
  `TRANSFERRED_OUT`, grants portable visibility, and writes audit rows.
- **Policy is configuration** (who must authorize; learner/guardian consent;
  behaviour when the sender is unresponsive or off-platform) and is **OD-9 —
  MUST ASK PRODUCT OWNER** before the workflow is exposed to a real
  institution. Build the lifecycle and the policy hooks; do not invent the
  policy.
- Outbound transfer to a non-PINTAR institution = authorized export of the
  portable record (doc 06 "departure/export") + enrollment ended.

## 4. Scoped roles — the authorization core (doc 05)

Six ranked roles: `SYSTEM_ADMIN(6) > INSTITUTION_ADMIN(5) > DEAN(4) >
HEAD_OF_DEPARTMENT(3) > EDUCATOR(2) > STUDENT(1)`, plus `SERVICE`
(server-only) and `PUBLIC` (anonymous: verification and, later, public
demo only).

- `users.role` (or `peran`) is a machine-maintained *display* field only —
  it is never the source of authority.
- Real authority for **staff** lives in a Role Assignment table:
  `(person_id, role, scope_level, scope_id, valid_until)`. A grant at a
  higher scope level structurally covers everything under it, via the
  ancestor-path containment check from §3. Immutable once used to gate an
  action already taken.
- **Learners are authorized through an ACTIVE Enrollment/Membership**, not
  through a Role Assignment.
- Time-bounded grants auto-expire via a scheduled job.
- Anti-escalation, enforced by trigger (INV-16): a user can never self-grant
  a non-STUDENT role. Only an active SYSTEM_ADMIN may grant SYSTEM_ADMIN or
  any platform-level role.
- Write exactly one function pair (e.g. `has_scope()` /
  `can_on_subject()`) and call it from both application code and every RLS
  policy that needs it — never let the two layers diverge. It must fail
  **closed** on any unexpected input, with a test that proves it (Lesson 11).
- Capability model, derived from role (never raw role-name string
  comparisons in code) — the full matrix is doc 05; this phase creates the
  mechanism and these capabilities:

| Capability | Who holds it | Gates |
|---|---|---|
| `CAN_DRAFT` | Educator, Head of Dept, Institution Admin, System Admin | Ingest/author content |
| `CAN_REVIEW` | Head of Dept, Institution Admin, System Admin | Review/approve; acknowledge WARNING findings |
| `CAN_FREEZE_RELEASE` | Head of Dept, Institution Admin, System Admin | "Approve & Freeze" |
| `CAN_PUBLISH` | Institution Admin, System Admin only (human only — never SERVICE) | Publish/withdraw a release |
| `CAN_ASSIGN_LEARNING` | Educator (own classes), Head of Dept (own dept), Institution Admin, System Admin | Learning Assignments; governed release moves |
| `CAN_QUICK_ASSESSMENT` | Educator, Head of Dept, Institution Admin, System Admin | Launch a Quick Assessment (was `CAN_FLASH_QUIZ`) |
| `CAN_AUTHORIZE_TRANSFER` | Institution Admin, System Admin (+ learner/guardian consent per OD-9) | Transfer request/authorization |
| `CAN_REVIEW_QUESTION_HEALTH` | Head of Dept, Institution Admin, System Admin | Decide Question Health signals |
| `CAN_MANAGE_REPORT_TEMPLATES` | Institution Admin, System Admin | Institution Report Templates |
| `CAN_REVIEW_INTEGRITY` | Head of Dept, Institution Admin, System Admin | Human integrity decisions |

Dean holds none of the Studio capabilities, by design (INV-19) — deans
read, they never author, approve, assign or decide.

## 5. Tenant isolation

Every table you create from this phase forward carries an `institution_id`
(or is reachable to one via the ancestor-path or via `enrollment_id`).
Person is the one platform-wide entity; its visibility to an institution is
always *through* an Enrollment (current or historical) or an executed
Transfer — never a global read (INV-13, INV-25).

## 6. RLS baseline (INV-36, INV-14)

- RLS enabled on every table at creation. No policy ships as
  `USING (true)` for any client-facing role, ever — not even temporarily.
- `ALTER DEFAULT PRIVILEGES` so newly created tables don't inherit an open
  grant by accident.
- Every `SECURITY DEFINER` function pins `search_path` explicitly.
- Black-box RLS tests (real learner-scoped JWT through REST, not a
  superuser connection): a student cannot read another student's rows; a
  student cannot read answer-key-bearing columns; Institution A's admin sees
  zero rows of Institution B on every tenant-scoped table (two synthetic
  institutions). Runnable in CI going forward.

## 7. Storage contract (INV-15)

- Create the asset bucket(s) `private` from the start. No policy ever grants
  `SELECT`/`INSERT`/`UPDATE` to `public` or `anon`. Every storage-touching
  migration asserts this itself by querying `storage.policies`/`pg_policies`
  (Lesson 1 — the bucket flag and the policies are two locks).
- All uploads go through a server route (`service_role`) that checks the
  relevant capability (`CAN_DRAFT`/`CAN_REVIEW`; own-profile for photos)
  before issuing an upload URL — never a direct client `.upload()` with the
  anon key. This route is built in this phase, before any bucket is used.
- All reads happen via a short-lived server-issued signed URL, generated per
  request, not a stored permanent URL.
- Black-box test: an anonymous fetch of a known object path returns a
  refusal, not the file; an authenticated overwrite of an existing object
  outside the server route is refused. Run in CI.

## 8. Audit trail (INV-18)

One **append-only** audit table from day one (no UPDATE/DELETE grant for any
role, enforced): actor, action, target table/row, timestamp, before/after
summary, commit SHA of the running build. Write to it for: role
grants/revocations, enrollment/membership changes and period rollovers,
transfers, item edits, release freezes, publications, learning-assignment
release moves, certificate issuance/revocation, integrity review decisions,
evidence-eligibility overrides, administrative session terminations and
deadline extensions, feature-flag flips. Nothing reads this table for
scoring or UI decisions — it exists for accountability only. Later phases
add their action types to this table; none creates a second log.

## 9. Human Language Engine (skeleton)

A single dictionary/translation layer that every user-facing string passes
through, keyed by (event, persona, context) — so staff and student surfaces
never accidentally share internal words (system-status words like
"Menunggu", lifecycle enums, evidence classes, version strings leaking into
a learner-facing screen). Build the lookup mechanism and wire two or three
real strings through it now. Add a route/copy inventory test that no
internal enum name or "PINTAR 4.0" appears on any user-facing surface (doc
12 "complexity leaking to the surface").

## 10. Super Admin & Configuration Studio (shell)

Build the shell now — content-bank-specific panels (Phases 2/5) plug into it
later. Sidebar-organized control center: grouped sections (System &
Configuration, Content & Question Banks, Assessment Engine, Certificates &
Audit, Intelligence & Reports), status cards (active cohorts, system
health), quick actions. In this phase, wire only what phase 1 has built:

- **System & Configuration**: global switches (maintenance mode,
  registration lock, feature flags), multi-tenant setup (institutions,
  faculties, departments, programmes, cohorts, classes, **Academic
  Periods** — from §3), enrollment/membership administration and **period
  rollover** (§3), **transfer requests/authorizations** (§3a, policy hooks
  only until OD-9), RBAC/user control (assign roles with scope bindings,
  from §4), audit-trail reader (own institution for INST_ADMIN).
- Leave Content & Question Banks / Assessment Engine / Certificates /
  Intelligence panels as empty placeholders that later phases fill — don't
  fake data into them now.
- This panel is gated behind `SYSTEM_ADMIN`/`INSTITUTION_ADMIN` scope per §4
  — verify a lower role gets a clean refusal, not a broken UI.
- Reserve named module boundaries (empty) for FOUNDATION NOW items that
  later phases or later releases fill: `integrations/` (integration
  boundary), `care/` (PINTAR Care boundary), `ai-gateway/` (AI Provider
  Gateway — contracts only; no provider integration in this phase).

## 11. Dev-only tooling (INV-21)

Quick dev login, instant-pass test bar, seed-session endpoints — all behind
`NODE_ENV === 'development'`, returning 404 in any other environment, and
all producing evidence only inside synthetic tenants (so it is `SYNTHETIC`
by inheritance once evidence tables exist in Phase 2). Verify with a build
run in a production-like env var setup.

## Acceptance checklist — as the selftest contract, not manual QA (must be green before Phase 2)

Each item is a manifest entry with the invariant/cell it proves (real JWTs
through REST, not a superuser bypass):

- [ ] `npm ci` succeeds from a clean clone; CI is green on a good PR and red
      on a deliberately broken one — verify the red case really happens.
- [ ] CI runs the migration set against a clean database and (from
      migration two onward) against the previous schema; a destructive
      migration that breaks the running version fails CI (doc 16 §2).
- [ ] Schema-lint: exactly one migrations directory; every table has RLS
      enabled; zero `USING (true)` policies for client-facing roles; every
      `SECURITY DEFINER` function pins `search_path` (INV-14, INV-36).
- [ ] Bundle scan: no service-role key in any client bundle (INV-37).
- [ ] INV-13: authenticated as a role in synthetic Institution A, zero rows
      visible from Institution B on every tenant-scoped table.
- [ ] A real student JWT cannot read another user's row on any table so far;
      cannot list or fetch any storage object by guessing its path
      (INV-15); an authenticated overwrite outside the server route fails.
- [ ] INV-16: granting a role above STUDENT to yourself, as a
      non-SYSTEM_ADMIN, fails; a non-SYSTEM_ADMIN granting SYSTEM_ADMIN fails.
- [ ] Fail-closed test: the shared authorization primitive denies on null/
      malformed/unexpected input (Lesson 11).
- [ ] INV-23: seed a class, roll the cohort to a new Academic Period; prior
      memberships remain with a closed `valid_to`; "who was in class X on
      date D" answers correctly for a date before and after the rollover; no
      mutable class id exists on Person.
- [ ] INV-25: execute a synthetic transfer A → B; B reads the portable record
      classes, cannot read A's institution-scoped records; A's evidence-class
      tables (or their stand-ins in this phase) still carry A's
      `enrollment_id`; one audit row per lifecycle step; a REQUESTED transfer
      cannot skip to EXECUTED.
- [ ] INV-18: a role grant, a membership change and a transfer step each
      produce exactly one audit row with the expected actor/action/target;
      UPDATE/DELETE on the audit table is refused for every role.
- [ ] INV-21: seed script refuses to run without the non-production signal;
      every dev-only route returns 404 in a production-like build.
- [ ] A non-admin role attempting to open the Config Studio shell gets a
      clean refusal (not a partial/broken render); DEAN is refused on every
      capability endpoint that exists so far (INV-19).
- [ ] Copy/route inventory: no internal enum name or "PINTAR 4.0" string on
      any user-facing route.
- [ ] Persona harness smoke test: seeding produces the expected counts in
      two synthetic institutions and both are flagged `is_synthetic`.
- [ ] ADR-0001 exists with all sections filled, including the traceability
      section.

`npm run selftest` must exit 0 running all of the above before Phase 2
starts. Then: **mini audit** (doc 16 §5–6) searching explicitly for
permissive RLS, client-side service role, public storage, hardcoded
credentials, unsafe `SECURITY DEFINER`, and a second migration series; fix;
gate.
