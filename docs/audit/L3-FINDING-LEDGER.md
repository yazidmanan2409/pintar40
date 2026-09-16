# Layer-3 Finding Ledger

Independent-audit findings against the PINTAR 4.0 core build. One entry per
finding, recorded at the moment of discovery with the evidence that produced
it. Findings are not closed here; closure is recorded by whoever verifies the
repair.

Measured at commit `481ff93a065a572956fa0b6dae4cb3fcb5444798` unless an entry
says otherwise. "Local replay" means a database built from zero: drop, create,
all 81 migrations, then the five seeds in the order `supabase/config.toml`
declares.

---

## L3-F01 — synthetic credential fixtures reachable on a hosted project

**Status: REPAIRED AND CLOSED.**

**Defect.** `supabase/seed/synthetic.sql` created
`sysadmin@synthetic.pintar.test` as a platform `SYSTEM_ADMIN` with a password
tracked in the repository, and those identities were live on the hosted
development project. The guard was a denylist —
`platform_environment.environment <> 'production'` — and `environment` is
`development` on every project including the hosted one, so the guard was
fail-open by construction.

**Repair.**
- A. The nine hosted `auth.users` rows were deleted; the cascade was verified
  clean beforehand (`accounts.auth_user_id → auth.users ON DELETE CASCADE`,
  nothing else references `auth.users`).
- B. Migration `20260918200000_synthetic_fixtures_are_local_only.sql` adds a
  fail-closed marker `platform_environment.local_fixtures_enabled` (default
  `false`) and the predicate `public.synthetic_fixtures_permitted()`. Every
  credential-bearing seed now refuses unless the marker is explicitly set.
- C. `seed/00_local_fixtures.sql` sets the marker and runs first in the
  `config.toml` pipeline, which a hosted project never reads. Enforced by
  `F06-S07` (static, set derived from the seed directory) and `F06-N05` (db,
  truth table in a rolled-back subtransaction), with CI red-case plants for
  both. The hosted half is `docs/audit/hosted-credential-audit.sql`, which CI
  cannot run.
- D/E. Documented in `docs/audit/L3-F01-CREDENTIAL-BOUNDARY.md`; history was
  not rewritten.

**Residual, stated honestly.** No in-SQL signal distinguishes a local Supabase
stack from a hosted one. The boundary is therefore a deliberate hosted opt-in
plus the C.2 audit. Nine login-less persons and two synthetic institutions
remain on hosted as inert `SYNTHETIC` data; removing them is a large
`NO ACTION` cascade and was out of scope.

---

## L3-F02 — the INV-19 regression detector derives its population from the
## implementation it is testing

**Status: OPEN. Gate-blocking. Not repaired.**

**Defect.** `F06-N02` computes the set of endpoints that must refuse a DEAN by
asking each candidate function's own body whether it names a capability DEAN
lacks (`prosrc like '%' || d.cap || '%'`, `selftest/db/fable06.sql:365-382`).
The population is therefore a function of the artefact under test: deleting a
capability check also deletes the endpoint from the population, so the
assertion answers a question about a smaller world and reports success. The
floor of 18 was written as the closure for exactly this, but a floor is a
cardinality guard, not a membership guard.

**Evidence (local replay, reproduced two ways).** Delete the three-line
`CAN_PUBLISH` guard from `public.save_certificate_template` — the endpoint
with zero references anywhere else in the suite:

```
DEAN PROBE: ACCEPTED -> 4aad6976-1d8b-410c-9d32-5eb396de9c2e
rows_written=1
derived_set  21 -> 20
F01-T06      true
F06-N02      true      ("refused every one of 20 mutating STAFF endpoint...")
```

Applied at source instead and replayed from zero, all 81 migrations applied
clean — `0058`'s own ADR-0014 terminal block exercises
`save_certificate_template` on the happy path only
(`20260915160000_studio_surfaces.sql:469-477`) and does not catch it. The full
suite then reported `165 passed, 0 failed → GREEN` with a live INV-19
violation committed at source.

**Claims that are false as written and must be corrected with the repair.**
- `selftest/manifest.json:933` — *"with a floor of 18 so an endpoint that
  deletes its own capability check fails rather than leaving the set."* The
  floor is 18 against a population of 21; the first three deletions pass.
- `selftest/db/fable06.sql:962-972` and `.github/workflows/ci.yml:774-779`
  carry the same claim. The CI red-case plant neuters `open_briefing` with
  `if false and public.can_in_institution(...)`, deliberately keeping the
  capability literal in the body — it was designed around this blind spot and
  cannot be the evidence that the blind spot is closed.
- `docs/phases/PINTAR-4.0-STATE-OF-THE-SYSTEM.md` lines 107, 120, 258, 263,
  450, 599-604, 700, 786 describe F06-N02 as covering "every mutating STAFF
  endpoint a dean is denied". It covers 21 of 31.

**Not repaired during Layer-3.** A design was produced and is held for
authorization; no code was changed.

---

## L3-F03 — a capability-less DEAN performs a cross-tenant destructive write

**Status: OPEN. Gate-blocking. Not repaired.**

**Defect.** Four mutating, client-exposed, `SECURITY DEFINER` STAFF RPCs
granted to `authenticated` contain no authorization predicate at all:
`run_mcq_quality`, `validate_course_content`, `ingest_structured_package`,
`propose_easy_upload_mapping`. They sit outside `F06-N02`'s derived population
(L3-F02), so no assertion has ever called them as a DEAN.

**Runtime evidence (local replay, no plant, unmodified `481ff93`).** Probed
through `selftest.as_user`, which sets the JWT claims and `set local role
authenticated` — the same harness `F06-N02` uses:

```
acting as DEAN; role_capabilities(DEAN) = {}
validate_course_content    :: ACCEPTED A DEAN
run_mcq_quality            :: ACCEPTED A DEAN
save_certificate_template  :: REFUSED -> requires CAN_PUBLISH      <- control
```

`run_mcq_quality`'s first statement is
`delete from public.mcq_quality_findings where course_id = p_course and acknowledged_at is null;`.
Driven by the DEAN of `pintar-human-evaluation` against a course owned by
`pintar-bootstrap-official`:

```
findings for the BOOTSTRAP course before the dean call: 1
findings after the foreign DEAN called run_mcq_quality:  0
```

This violates INV-19 (a dean reaching a Studio-capability endpoint) and INV-13
(a cross-tenant write). `client_rpc_registry` already *declares* a capability
for two of these — `validate_course_content` is noted "content validator;
CAN_DRAFT" and `ingest_structured_package` "authoring ingestion; CAN_DRAFT" —
and nothing compares the declaration to the implementation.

**Bounded deliberately.** `ingest_structured_package` and
`propose_easy_upload_mapping` have no authorization in their bodies, but no
seed creates an `ingest_batches` row, so they were not driven. They are
recorded as unguarded code paths, **not** as demonstrated vulnerabilities.
`generate_report` authorizes only with `is_member_of_institution`; whether that
is correct for a mutating STAFF RPC was not probed.

**Not repaired during Layer-3.**

---

## Carried limitations (not findings)

| Item | Nature |
|---|---|
| INV-20 holds **vacuously** | No analytics consumer role exists yet; the consumer role is an open decision. `assert_evidence_consumer_boundary()` says so in its own verdict. |
| INV-06 behavioural half | The timing-safe comparison is asserted structurally; "near-miss signatures fail identically fast" is not measured. |
| RF-2 | For 5 of the 21 endpoints F06-N02 reaches, refusal is proved but not that the refusal is *authorization*. |
| DB-suite repeated-run non-idempotency | `run_fable06()` adds a second CLASS node to `pintar-bootstrap-official`; `selftest/db/fable04.sql:408` then selects its fixture with an unordered `limit 1` and F04-T04 fails on a second pass. CI is unaffected (fresh database, F04 before F06). Bisected on a clean database, each probe rolled back. |
| INV-05 single-point detector | Of the four manifest entries citing INV-05, only `F04-T09` detects a missing protected field in the real builder; `F04-S02` signs a test-file literal and `F04-S04` signs whatever the builder returns. Functioning, non-blocking. |
| Pass-verdict rule implemented twice | `session_outcome` and `certificate_eligibility` each derive the verdict from the stored mastery. They disagree when a definition names no pass mark (`NULL` vs `true`). Currently unreachable — `certificate_prepare` refuses on `eligible = false` first. |
| `docs/audit/launch-readiness.sql` | Runs outside CI. |
| Retained-token expiry | Needs a real Auth stack; not exercised locally. |
