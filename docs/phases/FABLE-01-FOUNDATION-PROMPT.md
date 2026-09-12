# FABLE-01 — Foundation: Identity, Roles, Academic Hierarchy, Storage Contract

Paste after `FABLE-00-MASTER-OVERVIEW-PROMPT.md` has been acknowledged. This
phase has no learner-facing UI yet beyond a login screen — it is the ground
every later phase stands on. Do not start content or assessment work before
this phase's checklist passes.

## 1. Project setup

- New Next.js (App Router, TypeScript, Tailwind) project.
- New Supabase project. Record project ref, URL, anon key, service_role key
  in `.env.example` as placeholders only — never commit real secrets.
- Git repo initialized, `package-lock.json` committed from the first commit.
- CI (GitHub Actions or equivalent): install via `npm ci`, lint, typecheck,
  and one smoke test. Verify a deliberately broken PR fails it before moving
  on — this is a phase-1 acceptance item, not deferred.

## 2. Identity & sessions

- Passwordless email/magic-link auth for most users.
- A separate classroom-card PIN login path for young learners (no email
  required) — model it as its own identity type from the start, not a
  workaround bolted onto the email-user table later.
- Idle sessions expire after 24h.
- Seed personas for dev/staging only, gated behind an explicit, self-deleting
  permission statement (so re-running seed always requires fresh intent).
  Use realistic per-persona passwords for staging — do not default every
  seed account to the same password.

## 3. Academic hierarchy

`institutions → faculties → departments → programmes → subjects → cohorts`.
Every node carries an ancestor-path array (e.g. Postgres `ltree` or a
`UUID[]` "jalur" column) maintained by triggers, so authorization checks
reduce to one indexed containment check rather than recursive joins. Moving a
node must cascade the path downward so it's never a stale cache. Write the
migration so its own final check fails the whole migration if any row ends
up with a missing/malformed path — don't allow silent orphans.

## 4. Scoped roles — the authorization core

Six ranked roles: `SYSTEM_ADMIN(6) > INSTITUTION_ADMIN(5) > DEAN(4) >
HEAD_OF_DEPARTMENT(3) > EDUCATOR(2) > STUDENT(1)`.

- `users.role` (or `peran`) is a machine-maintained *display* field only —
  it is never the source of authority.
- Real authority lives in a grants table:
  `(user_id, role, scope_level, scope_id, valid_until)`. A grant at a higher
  scope level structurally covers everything under it, via the ancestor-path
  containment check from §3.
- Time-bounded grants auto-expire via a scheduled job.
- Anti-escalation, enforced by trigger: a user can never self-grant a
  non-STUDENT role. Only an active SYSTEM_ADMIN may grant SYSTEM_ADMIN or any
  platform-level role.
- Write exactly one function pair (e.g. `has_scope()` /
  `can_on_subject()`) and call it from both application code and every RLS
  policy that needs it — never let the two layers diverge. Make sure it
  fails **closed**, not open, on any unexpected input (a prior build's
  version of this function failed open — don't repeat it).
- Studio capability model, derived from role (not raw role-name string
  comparisons in code):

| Capability | Who holds it | Gates |
|---|---|---|
| `CAN_DRAFT` | Educator, Head of Dept, Institution Admin, System Admin | Import/author content |
| `CAN_REVIEW` | Head of Dept, Institution Admin, System Admin | Edit during review |
| `CAN_FREEZE_RELEASE` | Head of Dept, Institution Admin, System Admin | "Approve & Freeze" |
| `CAN_PUBLISH` | Institution Admin, System Admin only | Publish/withdraw a release |
| `CAN_FLASH_QUIZ` | Educator, Head of Dept, Institution Admin, System Admin | One-off practice quiz |

Dean holds none of these capabilities, by design — deans read, they never
author or approve.

## 5. Tenant isolation

Every table you create from this phase forward — not just PLP tables —
carries an `institution_id` (or is reachable to one via the ancestor-path).
This is a day-one constraint, not a later migration.

## 6. RLS baseline

- RLS enabled on every table at creation. No policy ships as
  `USING (true)` for any client-facing role, ever — not even temporarily.
- `ALTER DEFAULT PRIVILEGES` so newly created tables don't inherit an open
  grant by accident.
- Every `SECURITY DEFINER` function pins `search_path` explicitly in its
  definition.
- Write a black-box RLS test (using a real learner-scoped JWT through the
  REST API, not a superuser connection) for at least: a student cannot read
  another student's rows, a student cannot read answer-key-bearing columns
  they shouldn't see. This test must be runnable in CI going forward.

## 7. Storage contract

- Create the asset bucket(s) `private` from the start. No policy ever grants
  `SELECT`/`INSERT`/`UPDATE` to `public` or `anon`.
- All uploads go through a server route (`service_role`) that checks
  `CAN_DRAFT`/`CAN_REVIEW` before issuing an upload URL — never a direct
  client `.upload()` call using the anon key.
- All reads happen via a short-lived server-issued signed URL, generated per
  request, not a stored permanent URL.
- Write the black-box test: an anonymous fetch of a known object path must
  return a refusal, not the file. Run it in CI.

## 8. Audit trail

One append-only audit table from day one: actor, action, target table/row,
timestamp, before/after summary (not necessarily full row diff). Write to it
for: role grants/revocations, item edits, release freezes, certificate
issuance/revocation. Nothing reads this table for scoring or UI decisions —
it exists for accountability only.

## 9. Human Language Engine (skeleton)

A single dictionary/translation layer that every user-facing string passes
through, keyed by (event, persona, context) — so staff and student surfaces
never accidentally share internal words (e.g. system-status words like
"Menunggu"/waiting leaking into a student-facing screen). Build the
lookup mechanism and wire two or three real strings through it now; it will
fill out as later phases add screens.

## 10. Super Admin & Configuration Studio (shell)

Build the shell now — content-bank-specific panels (Phase 2/5) plug into it
later. Sidebar-organized control center, AFKSI-admin-style: grouped
sections (System & Configuration, Content & Question Banks, Assessment
Engine, Certificates & Audit), status cards (active cohorts, system health),
quick actions. In this phase, wire only what phase 1 has built:

- **System & Configuration**: global switches (maintenance mode,
  registration lock, feature toggles), multi-tenant setup (institutions,
  faculties, departments, programmes, academic years — from §3), RBAC/user
  control (assign roles with scope bindings, from §4).
- Leave Content & Question Banks / Assessment Engine / Certificates panels
  as empty placeholders that later phases fill — don't fake data into them
  now.
- This panel itself is gated behind `SYSTEM_ADMIN`/`INSTITUTION_ADMIN`
  scope per §4 — verify a lower role gets a clean refusal, not a broken UI.

## 11. Dev-only tooling

Quick dev login, instant-pass test bar, seed-session endpoints — all behind
`NODE_ENV === 'development'`, returning 404 in any other environment. Verify
this with a build run in a production-like env var setup.

## Acceptance checklist — as an automated suite, not manual QA (must be green before Phase 2)

Write each of these as a real test in the phase's `selftest` suite (real
JWTs through REST, not a superuser bypass):

- [ ] `npm ci` succeeds from a clean clone; CI is green on a good PR and red
      on a deliberately broken one — verify the red case really happens by
      committing a temporary bad PR in a test run.
- [ ] Test: a real student JWT, via REST, cannot read another user's row on
      any table that exists so far.
- [ ] Test: a real student JWT, via REST, cannot list or fetch any storage
      object by guessing its path.
- [ ] Test: granting a role above STUDENT to yourself, as a non-SYSTEM_ADMIN,
      fails.
- [ ] Schema-lint test: every table has RLS enabled; zero policies anywhere
      read `USING (true)` for a client-facing role (script this as a query
      against `pg_policies`, not a manual review).
- [ ] Schema-lint test: every `SECURITY DEFINER` function has a pinned
      `search_path` (query `pg_proc`/`pg_settings`).
- [ ] Test: performing a role-grant action produces exactly one new audit
      row with the expected actor/action/target.
- [ ] Test: a non-admin role attempting to open the Config Studio shell gets
      a clean refusal (not a partial/broken render).

`npm run selftest` must exit 0 running all of the above before Phase 2
starts.
