# Bob → coordinator: BOB-21 (a school admin grants only to a person they may act upon; D-049)

**Head:** `HEAD_SHA`, with `main` merged in first (`59208b8`, Integration 14; a fast-forward). **One run:** `RUN`.

## CHANGED

**The rule** (migration `20261018100000_a_grant_needs_the_school.sql`, `role_assignments_guard`).

For a school-scoped grant by anyone but the platform administrator, the person must already have **the grant's own school**. Any one of these counts:
- its institutional identity (the school's number);
- an active role there that is not SYSTEM_ADMIN;
- a learner enrolment there (PENDING or ACTIVE).

**How it is asked:**
- **Per school, for the school the grant is for; never "visible to me".** An admin of two schools cannot move a teacher between them by granting. The migration's terminal check refuses `person_visible_to_me` in the guard.
- **What a refusal looks like:** 42501 with DETAIL `GRANT_NO_SCHOOL_RELATIONSHIP`, and nothing is created: no role, no number, no enrolment, and so no visibility. Konfigurasi already maps 42501 to `ACTION_NOT_ALLOWED`, so there is no new copy.
- **No oracle for who exists:** the check runs before the foreign key is checked, so an id that does not exist anywhere is refused identically (SQLSTATE, DETAIL and MESSAGE). F10-G01 asserts that.
- **Where it sits:** after the existing scope check, so a grant at another school's node is still refused first for scope, as F10-V03 asserts.

**Every door (point 3).** The check is in the guard, the one trigger every writer of `role_assignments` passes:

| writer | who writes | effect of BOB-21 | shown by |
|---|---|---|---|
| `grant_role` | the signed-in grantor | the rule applies to every non-platform grantor | F10-G01, G02, G03 |
| `import_advance` (the intake) | the school admin | unchanged in effect: it issues the school's number before it writes a role (and BOB-10 refuses staff rows at validation) | F10-M01/M02, F06-P17, UX1-DATA-TAHAP-01 |
| `bootstrap_first_system_admin` | unauthenticated, SYSTEM_ADMIN | untouched (the day-zero branch is before the rule) | F08's bootstrap tests |
| the synthetic seeds and fixtures | unauthenticated, `app.seed_intent = synthetic` | untouched (same branch) | every seed loads; every suite is green |

**No other path:**
- `authenticated` holds SELECT only on `role_assignments`, and the migration's terminal check refuses INSERT.
- Rollover (`period_rollover`) and transfer (`transfer_execute`) write no role.
- The only role a non-platform grantor can give is school-scoped: INSTITUTION_ADMIN, SYSTEM_ADMIN and unscoped grants still need the platform administrator.

**Unchanged:** the platform administrator's path (F10-G03), the scope check, the day-zero branch and the seeds. The staff move between schools is not designed (D-049 (d)).

## PROOF

| test | red before | green after |
|---|---|---|
| F10-G01 (db) | on a database without the migration: `4 problem(s): School B's admin granted a School-B role to a School-A-only teacher by id: ok; a person of another school and an id that does not exist are refused differently: ok / {"code": "23503", …foreign key…}; …` | refused 42501 `GRANT_NO_SCHOOL_RELATIONSHIP`, identically to an unknown id; no School-B role, number or enrolment; the teacher stays invisible to School B's admin |
| F10-G02 (db) | same database: `3 problem(s): an admin of both schools moved a School-A teacher to School B by granting: ok; an admin of both schools moved a School-B teacher to School A by granting: ok; a refused grant left a role at the other school` | both directions refused, no role left at either school |
| F10-G03 (db) | green before, as it should be | School B's admin still grants to its own teacher with a role there, to its newly recorded teacher (number only) and to a person enrolled there (enrolment only); the platform administrator still grants a School-B role to a School-A teacher |

**Plants** (`db-bob01-gates`; control 15 → 18 green rows; the gate now proves twenty-four plants):

| plant | defect | goes red |
|---|---|---|
| bob01-22 | the relationship check is gone | F10-G01 |
| bob01-23 | "visible to me" instead of the grant's own school | F10-G02 (the two-school admin) |
| bob01-24 | any school's number counts | F10-G01 |

**Restated for the changed requirement (named):** F10-C02 and F10-C04. Their two-connection races granted a role to the oldest person in the database, who has no relationship with the fixture school, so the new rule refused them before the race was reached. `selftest.f10_concurrency_fixture` now also returns one staff member of the fixture school (an active role there, one person reused across runs). `selftest/run.ts` grants to that person. Each still races, and still refuses for its own reason: `STRUCTURE_PLACE_INACTIVE` and `GRANT_ALREADY_ACTIVE`.

**Tripwires:** 123 → 124. **Manifest:** v103.

No test was weakened, skipped or deleted.

## CI

`RUN` on `HEAD_SHA`, dispatched once and not waited on; please read the result there.
- **Local, before dispatch, every database with an `en-US` ICU collation:** FULL_LOCAL
- One run, no new job.

## EXISTING DATA (point 5)

BOB-21 changes no rows: the guard runs on writes only.

**On my local seed:** every standing school-scoped grant, asked whether a school admin could grant it afresh today. That means with this row set aside, is there the school's number, another active role there, or an enrolment there?

| role | standing | would be refused if granted afresh |
|---|---|---|
| DEAN | 2 | 2 |
| EDUCATOR | 4 | 3 |
| HEAD_OF_DEPARTMENT | 4 | 4 |
| INSTITUTION_ADMIN | 5 | 5 (only the platform administrator grants this role, so the rule does not apply) |

- **Why:** the synthetic seeds give their staff a role and nothing else, with no institutional identity. The seeds write under the seed intent, so they are not re-checked, and no row changes.
- **Still allowed:** each person holds a role at their school, which is itself a relationship, so a school admin can still grant them a further role there.
- **What stops working:** if a seeded teacher's only role is revoked, their school admin can no longer re-grant it, because the school has no number for them. The platform administrator can. Recording the seeded staff through the intake (the school's number) would remove that gap. That is a seed change, not part of BOB-21.

**On staging:** `staging-perf-seed.yml` has the synthetic school admin grant EDUCATOR to "Uji Kinerja Guru (sintetis)". That teacher was created on Gladys's screen as a new person with no school, so under BOB-21 that grant would be refused. The grant already exists on staging, and the workflow reuses what exists, so a re-run skips it. A fresh re-seed would need the teacher recorded in the school first (the intake gives the school's number). **The coordinator owns that workflow and is changing it to do exactly that (28 Sep); no change on my side.** The release audit's grants (`audit/journey.mjs`) are Gladys's, as SYSTEM_ADMIN, and are unaffected.

## CONTRACT

- `grant_role` and `role_assignments_guard`: a school-scoped grant by a non-platform grantor can now be refused 42501 with DETAIL `GRANT_NO_SCHOOL_RELATIONSHIP`.
- No new function, and no PR0xx code changed.

## MIGRATIONS

`20261018100000`, forward-only:
- replaces `role_assignments_guard` with the one added check (the rest line for line as `20261004100000`);
- ends with terminal checks: the check is there, it is asked of the grant's own school and not "visible to me", it comes after the scope check, the trigger is attached, and a client cannot insert.

No table, column or data changes.

## COPY

None. The refusal reads as the existing `ACTION_NOT_ALLOWED`.

## QUESTIONS

None.

## READY

Yes, once `RUN` on `HEAD_SHA` is green.
