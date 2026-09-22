# Hosted apply-and-stamp plan — WP8

**Status: rehearsed locally, never run against hosted.** The release rehearsal
executed every step below against a production-shaped local database built to
the recorded hosted state — including the comment-stripped records, the
first-administrator bootstrap, the environment declaration, onboarding, and a
restore followed by a re-apply. No hosted Supabase has been contacted.

---

## 1. Where hosted stands

| | |
|---|---|
| repository, at this commit | **108 migrations** |
| hosted development project, last recorded | **80 migrations** (`docs/phases/FABLE-06-HOSTED-ADDENDUM.md`) |
| gap | **28 migrations**, WP6 through the two final release deltas |

The addendum is the last measurement anyone took. It is a record, not a live
reading, and **step 0 of the rehearsal is to re-measure rather than trust this
row.**

## 2. The one hazard: recorded text, not behaviour

Thirteen FABLE-01/02 migration files are recorded on hosted with their
comments stripped, and six function bodies differ from the repository's for
the same reason — `transfer_authorize`, `transfer_execute`, `transfer_request`
and three siblings. The addendum established that the difference is **comments
only**; every counter and every assertion matched.

That matters here because `supabase migration up` compares the migration
history table, not behaviour. The divergence is in rows that are **already
applied and already stamped**, so it does not block the 25 new migrations —
but a rehearsal that "repairs" it by re-stamping would rewrite history that
correctly records what ran.

**Ruling for the rehearsal: leave the thirteen alone.** Record the divergence,
apply forward, and do not re-stamp already-applied migrations.

## 3. The procedure

Run against **staging first** (see §5), then production.

0. **Re-measure.** `supabase migration list --db-url "$HOSTED"`; record the
   applied count and the last applied version. If it is not 80, this document
   is stale and the gap is recomputed before anything is applied.
1. **Back up.** Take the project's snapshot and record its identifier in the
   rehearsal log. No apply begins without one.
2. **Dry the run locally first.** `scripts/dev/golden-db.sh rebuild` replays
   all 108 from empty; CI's `migrations · clean database + seed` and
   `migrations · previous schema → HEAD` do the same on every candidate. The
   rehearsal adds nothing to that evidence — it exercises the *hosted*
   procedure.
3. **Apply forward, in order, in one run:**
   `supabase migration up --db-url "$HOSTED" --include-all`
   Each migration carries its own terminal verification block (ADR-0014), so a
   migration that applies but does not hold **fails inside its own
   transaction** and stops the run. That is the intended behaviour: stop, read
   the raised message, do not continue.
4. **Do not stamp anything by hand.** `migration repair` is not part of this
   procedure. If the history and the repository disagree in a way that blocks
   the apply, that is a finding for Sauron, not something to be typed past.
5. **Re-measure after.** Applied count equals 108; last version equals the
   repository's last file.

## 3b. The first administrator — day zero, once

A freshly applied PINTAR has no persons, no accounts and no role assignments.
INV-16 requires an authenticated grantor, forbids self-grant, and lets only an
active SYSTEM_ADMIN grant SYSTEM_ADMIN — so without this step nobody can ever
sign in with authority. The release rehearsal found exactly this and it is the
one thing the procedure could not previously do.

```
-- as the OPERATOR, with the service-role key. Never from a signed-in session.
select public.bootstrap_first_system_admin('admin@sekolah.example');
```

Before it: **create the identity in Supabase Auth** (dashboard or admin API).
PINTAR's own trigger gives that auth user a person and an account; the
bootstrap binds a role to what already exists and creates no identity itself.

The door is narrow on purpose:

- granted to `service_role` only, and refused from a signed-in session even if
  the grant were ever widened by mistake;
- it is **once per installation, for ever**: success writes a durable record
  in `platform_bootstrap`, and that record — not whether an administrator
  happens to be alive — is what closes the door. Revoking every SYSTEM_ADMIN
  does not reopen it, and the record refuses UPDATE and DELETE;
- it also refuses while an active SYSTEM_ADMIN exists, which covers an
  installation that acquired one by any other path;
- it writes exactly one global assignment, with no grantor, because there is
  nobody to be the grantor and a false one would be worse than a null;
- it is on the audit record as `role.first_system_admin_bootstrapped`.

The optional second argument sets the validity, one year by default.

**This is initialisation, not administrator recovery, and there is no recovery
door.** A tenant that loses its last administrator is an operational matter for
whoever holds the database — a restore from the snapshot in step 2 — and not
something the product reopens.

Verify: `select count(*) from public.role_assignments where role='SYSTEM_ADMIN'
and revoked_at is null` returns 1, `select count(*) from
public.platform_bootstrap` returns 1, and calling the function a second time
raises *"this installation was already initialised"*.

## 3c. Declare the environment

```
update public.platform_environment set environment = 'production',
                                       local_fixtures_enabled = false;
```

This gates the synthetic affordances, the OFFICIAL-bootstrap rule on
institutions and the unauthenticated-grantor branch of the role guard. Do it
**after** 3b, because the bootstrap is the last step that predates a
production posture, and before any school is onboarded.

## 4. Verification after the apply

Run, on the hosted database, and record each result in the rehearsal log:

1. **The launch-readiness rows** — `psql -At -F ' | ' -f docs/audit/launch-readiness.sql "$HOSTED"`.
   All 17 must be PASS. They are green locally at this commit.
2. **Every standing assertion** — every `public.assert_*()` returning
   `(ok, detail)`. There are **22** at this commit; F06-P08 enforces that floor.
3. **The counters** the FABLE-06 addendum recorded, re-taken: functions,
   tables, views, `tables_without_rls = 0`,
   `functions_executable_by_anon = 0`, `secdef_without_search_path = 0`,
   `policies_using_true = 0`, `anon_public_surface = 2`.
4. **W8-01, on hosted**: `has_function_privilege('authenticated',
   'public.org_kind_level(public.org_kind)'::regprocedure, 'execute')` is
   true. This is the one repair whose absence would be invisible until a real
   school tried to add a class.
5. **Onboarding, end to end.** As the bootstrapped SYSTEM_ADMIN: create the
   institution and its academic period, then
   `grant_role(<person>, 'INSTITUTION_ADMIN', <institution root node>, …)`.
   **The administrator must be scoped at the institution's ROOT node** — the
   node the institution row itself creates, whose id equals the institution id
   — not at a faculty, or they cannot write their own tree. Then, as that
   administrator: build the org tree and assemble the school's report
   template.

   **Selecting the person to grant.** A person created in Supabase Auth
   moments earlier holds no enrolment, no transfer and no role, and the
   configuration studio's ordinary list is built from exactly those three. They
   appear instead under **"Holds nothing yet"** in the person selector, from
   `persons_awaiting_first_role` — a SYSTEM_ADMIN-only read that returns the
   complement of those three sources and nothing wider.

**The selftest DB suites are not run against hosted.** They mutate business
data; `SUPABASE_DB_URL` is never pointed at a hosted project. That rule is
older than WP8 and WP8 does not change it.

## 5. What must be true before the rehearsal

| | state at this commit |
|---|---|
| a staging environment separate from the development project | **does not exist** — this is the gap that makes a production rehearsal a first attempt |
| a recorded backup/snapshot procedure with a restore that has been tried | **procedure below, restore exercised** in the local rehearsal; the hosted snapshot/restore itself is still untried |
| the migration set green on a clean database and on the upgrade path | **yes**, both in CI on every candidate |
| a written rollback posture | below |
| report configuration usable on a fresh institution | **yes as of WP8** — see §6 |
| a path to the first administrator | **yes** — see §3b; before it, a fresh deployment could not be administered at all |

## 6. What a fresh production institution needs, and where it comes from

Everything an institution needs in order to work is shipped **by migrations**,
so it is present the moment the apply finishes: the metric catalogue and its
definitions, the feedback question set and threshold, mode and scoring policy,
readiness tiers, platform config.

Two things are **not** seeded, correctly:

- **Report templates.** Institution-owned by design. Before WP8 there was no
  way to create one and every school's report surfaces were permanently empty;
  `save_report_template` and the configuration panel close that.
- **Evaluation personas.** Out of 4.0 release scope by ruling. Human
  Evaluation will not work on a fresh production project and is not expected to.

The synthetic seeds are local-only by construction —
`synthetic_fixtures_permitted()` is false on a production environment — so the
apply installs no fixture data.

## 7. Rollback posture

Migrations are forward-only. There is no down-migration and none will be
written: a down-migration that has never been run is a guess.

If an apply fails, the failing migration has already rolled itself back
(each is one transaction). The options are, in order: read the raised message
and fix forward in a new migration; or restore the snapshot from step 1. The
rehearsal must exercise **the restore**, at least once, on staging — a backup
nobody has restored is a belief.

## 8. What this plan does not claim

It does not claim hosted is ready, that a rehearsal has happened, or that
anything here has been executed. It is the written procedure, and its first
run is the rehearsal.
