# ADR-0001 — Foundation: identity, hierarchy, authorization, audit, storage

**Date:** 2026-09-12
**Phase:** FABLE-01
**Status:** Accepted (phase still open — see docs/CHECKPOINT-FABLE-01.md)

## Problem
The first schema must express Person-centred identity, dated enrollment/
membership history, transfer, a single fail-closed authorization primitive,
an append-only audit trail and a closed-by-default storage/RLS baseline
(docs/rebuild/02, 03, 04, 05, 16) in a form later phases can build on
without reopening.

## Considered options
- A. One `org_nodes` table for the whole hierarchy with a `uuid[]` ancestor
  path, vs. B. one table per level with recursive joins.
- A. Learners authorized via Enrollment/Membership; staff via Role
  Assignments, vs. B. a single grants table for everyone (the 3.0 shape).
- A. Policy helpers that receive row values, vs. B. helpers that re-read the
  row by id.
- A. Effective-privilege verification (`has_function_privilege`), vs. B.
  checking explicit grants only.

## Decision
A in every case. `org_nodes` with `jalur uuid[]` maintained by trigger and
cascaded on move; `persons` carries no institution/class column; Enrollment
and Membership are dated append-only rows; Transfer is a lifecycle with a
record-class registry and `portable_visibility`; `has_scope` /
`can_on_node` / `is_member_of_institution` / `person_visible_to_me` /
`enrollment_readable` / `membership_readable` are SECURITY DEFINER, pinned
`search_path`, fail closed, and are the only authority used by RLS and by
the application server; `audit_log` refuses UPDATE/DELETE by trigger for
every role including the owner; the `assets` bucket is private with zero
client storage policies; every function in `public` is unexecutable by
`anon`, and `authenticated` may execute only an explicit RPC allow-list.

## Reason
INV-13, 14, 15, 16, 17, 18, 21, 23, 25, 36, 37; Lessons 1, 2, 11, 12.
Role assignments expire by `valid_until` evaluated on every check (no job
needed for correctness; a scheduled sweep is optional housekeeping).

## Calm-surface check
Users see "Konfigurasi", institutions, "aktif/nonaktif", "Semua pemeriksaan
lolos"; no lifecycle enum, evidence class, version string or "PINTAR 4.0" is
rendered (HLE throws if one would reach a learner/public surface). Rigor is
entirely in the database.

## Consequences
- The database is the authority; UI display role is never trusted.
- Cross-tenant reads of a learner's *later* records at another institution
  are impossible by construction (found and fixed in this phase — below).
- Two helper functions per readable table is the pattern later phases must
  follow for policies that need joins.

## Findings recorded during the phase (doc 16 §5–7)
1. **Supabase security advisor:** Postgres grants EXECUTE to PUBLIC on new
   functions, so `anon` inherited RPC access despite direct revokes; the
   migrations' own checks looked at explicit grants. Fixed forward in
   `function_privileges` with effective-privilege verification. The 14
   remaining advisor warnings are the intended `authenticated` RPC
   allow-list; each RPC enforces its own authorization — **accepted**.
2. **Selftest F01-T02 on re-run:** after a transfer, the sending
   institution's admin could read the learner's new enrollment at the
   receiving institution (policy keyed on person visibility, not row
   institution). Fixed forward in `tenant_scoped_reads`.
3. **Stop-patch-loop applied:** the first fix (`read_helpers`) re-read the
   row by id inside the policy and failed `INSERT … RETURNING` (row not yet
   visible to the helper's snapshot). Root cause: policies must not re-read
   their own row. Corrected in `read_helpers_by_value`; the by-id helpers
   were dropped. This is the pattern for all future policy helpers.

## Traces to
- Requirement: docs/rebuild/02 §Organisation, §Identity; 04 §3–3c; 05; 16 §1–5
- Architecture: INV-13/14/15/16/17/18/21/23/25/36/37
- Implementation: supabase/migrations/2026091200{4158…10155}_*.sql;
  src/lib/{env,auth,hle,card}.ts; src/lib/supabase/*; src/proxy.ts;
  src/app/{page,masuk,konfigurasi,api/assets,api/dev}
- Test: selftest/db/fable01.sql (F01-T01…T18), selftest/manifest.json
- Audit evidence: advisor output 2026-09-12; three consecutive green runs;
  mutation check (USING(true) → T02/T03/T07/T13 red)
- Patent/innovation register entry: none supplied

## Affected database objects
Tables: platform_environment, audit_log, institutions, academic_periods,
org_nodes, classes, persons, accounts, enrollments, memberships,
role_assignments, record_class_registry, portable_visibility, transfers,
feature_flags, platform_config; view my_profile; functions as listed in
the Decision; storage bucket `assets`.

## Security implications
Stated throughout; no client role can read or write outside RLS; no
service-role key exists client-side (`server-only` guard); dev tooling
404s outside development; seeds refuse production and require declared
synthetic intent.

## Future constraints
- Phase 2 evidence tables must reuse the helper-by-value pattern.
- `--pintar-primary` in globals.css is PROVISIONAL until copied from the
  established PINTAR brand assets (open item; not an architecture change).
- Migrations are named by the versions recorded in the database
  (management channel assigns them); repo filenames were aligned to match.

## Tests proving the decision
F01-T01…T18 (db runner). Static and REST runners are planned in
selftest/manifest.json and blocked on the external gate (see checkpoint).
