# Bob → coordinator: BOB-20 (a school admin sees and names their own staff; D-048)

**Head:** `HEAD_SHA`, with `main` merged in first (`f745441`, D-048 on the board). **One run:** `RUN`.

## CHANGED

**The rule** (migration `20261017100000_a_school_admin_sees_its_own_staff.sql`, `person_visible_to_me`):
- **A school's INSTITUTION_ADMIN now also sees:**
  - a person holding the school's institutional identity (the school gave them its number), or
  - a person with an active role at the school that is not SYSTEM_ADMIN.
- **Never through learner enrolment,** and no synthetic enrolment is made to reach it.
- **Own school only:** both relations are read for a school the viewer administers (`has_scope('INSTITUTION_ADMIN', school)`).
- **No platform-level person:** a SYSTEM_ADMIN row never counts, even one whose scope node is the school's.
- **Seeing grants no authority:** `role_assignments_guard` and `grant_role` are untouched.
- **By list and by id alike:** the `persons_select` policy reads this function, so the rule is the same for a list, a direct read and a profile photo through `read-url`.

**The school's own waiting list:** `persons_awaiting_first_role_at(p_institution)`.
- **Who is on it:** the people the school has recorded (an institutional identity there) who hold no role there, are not enrolled there and are not mid-transfer, newest first.
- **Who may read it:** that school's INSTITUTION_ADMIN, or the platform administrator. Everyone else is refused.
- **Registered** STAFF / SCOPE / INSTITUTION_ADMIN.
- **The platform's own list,** `persons_awaiting_first_role`, is unchanged and stays the platform administrator's.

**Konfigurasi** (`src/app/konfigurasi/page.tsx`):
- A school admin now asks `persons_awaiting_first_role_at` for each school they administer. The results are merged into the picker's "new" group, one entry per person.
- The grant list and the "known" group already take their names from `persons` under RLS, so they now name the school's staff. The platform administrator's path is unchanged.

## PROOF

| test | red before | green after |
|---|---|---|
| F10-V01 (db) | on a database without the migration: `4 problem(s): the school's admin cannot see the school's own teacher; the school's admin cannot see the teacher the school has just recorded; the school's admin reads 0 of its 2 staff by name from persons; the school's waiting list could not be read: function public.persons_awaiting_first_role_at(uuid) does not exist` | the admin sees its teacher with a role and its newly recorded teacher, reads both by name, and finds the new one (not the one with a role) in its waiting list; once given a first role, the new teacher leaves the list and stays visible |
| F10-V02 (db, red cases) | same database: red only because the waiting list does not exist; the visibility checks already held, since the old rule saw no staff at all | another school's staff (a teacher with a role and an identity, a newly recorded teacher) and a platform SYSTEM_ADMIN whose row names the school's node are invisible, by `person_visible_to_me` and by id from `persons`; the admin's own list names none of them; another school's list refuses it; a learner of the school sees no staff and is refused the list |
| F10-V03 (db) | green before, as it should be: the grant rules are unchanged | a grant at another school's node is still refused for scope, INSTITUTION_ADMIN and SYSTEM_ADMIN are still refused to a teacher the admin can now see, and no refused grant leaves a role behind |
| BOB20-A01 (app) | on the code and database before BOB-20: `the grant list does not name the school's own teacher (it shows an ID); the person picker does not offer the school's own teacher; the person picker does not offer the teacher the school has just recorded; the school admin cannot read the school's own staff by id from persons; person_visible_to_me does not answer yes for the school's own staff; the school's waiting list → 404, without the new teacher; the school's own teacher's photo → 403` | pass |

**BOB20-A01 checks the red cases too:**
- nothing on the page names another school's staff;
- by direct id, neither another school's teacher nor the platform administrator can be read;
- another school's waiting list answers nothing;
- another school's teacher's photo is refused with 403.

It builds the two schools' staff through the database owner (facility `db`), as F09-C02 does, because no seed holds a school's recorded teacher with no role.

**Locally it ran against the real database.** I wrote a local stand-in for Supabase's REST layer (scratchpad only, not committed). It answers PostgREST and RPC calls from the local Postgres as `authenticated` with the caller's claims, so RLS and every SECURITY DEFINER check decide as on the real stack. The CI run against real Supabase is the one that counts.

**Plants** (`db-bob01-gates`; control 12 → 15 green rows; the gate now proves twenty-one plants). Each turns its test red:

| plant | defect | goes red |
|---|---|---|
| bob01-16 | a SYSTEM_ADMIN row counts as staff | F10-V02, platform person |
| bob01-17 | any school's identity counts | F10-V02, another school's new teacher |
| bob01-18 | any school's role counts | F10-V02, another school's teacher |
| bob01-19 | the waiting list checks nobody | F10-V02, another school's list |
| bob01-20 | staff are seen through an enrolment | F10-V02, the learner |
| bob01-21 | the guard stops checking scope | F10-V03 |

For bob01-21, V03 now requires each refusal to be the rule's own ("lacks INSTITUTION_ADMIN scope", "only an active SYSTEM_ADMIN may grant"). Without that, the duplicate-grant rule (BOB-18) had kept it green.

**Tripwires:** 122 → 123. **Manifest:** v100.

No test was weakened, skipped or deleted.

## CI

`RUN` on `HEAD_SHA`, dispatched once and not waited on; please read the result there.
- **Local, before dispatch, every database with an `en-US` ICU collation as on CI's stack:** FULL_LOCAL
- One run, no new job.

## CONTRACT

- **New:** `persons_awaiting_first_role_at(p_institution uuid) → table (person_id uuid, display_name text)`, SCOPE INSTITUTION_ADMIN. A refusal is a plain exception; Konfigurasi only asks for schools the viewer administers.
- **Widened:** `person_visible_to_me(uuid)`, as above. Its signature and grants are unchanged.
- No PR0xx codes changed.

## MIGRATIONS

`20261017100000`, forward-only and additive:
- replaces `person_visible_to_me`;
- creates `persons_awaiting_first_role_at` and registers it;
- updates the registry note for `person_visible_to_me`;
- ends with terminal checks: the staff relations are read, a platform role is excluded, the function writes nothing, the new list is registered and not anon-executable, and the platform list keeps its gate.

No table, column or data changes. Both lookups use existing per-person indexes.

## COPY

None new. The page's existing labels are reused.

## QUESTIONS

None open. Both were answered on 28 Sep:

1. **Granting a role to a person the admin cannot see: unchanged in BOB-20, and a separate follow-up.** The current behaviour is not the intended end state. Proposed ticket, for the board:
   - **Title:** a school admin grants only to a person they may act upon.
   - **Principle:** a school admin may grant a school-scoped role only to a person they are legitimately permitted to act upon for that school. Knowing or submitting an internal person id must not bypass that boundary.
   - **Change:** `role_assignments_guard`, or `grant_role`, for a school-scoped grant by a school admin.
   - **Red case:** a person the admin cannot see, or who is out of scope, submitted by direct id to `grant_role` for a node of the admin's school is refused, and does not become visible or actionable.
   - **Plant:** the check removed, and that red case goes red.
   - **Open design point for that ticket:** what "permitted to act upon" means for a person who is not yet the school's, such as a teacher moving from another school.
2. **A former teacher holding the school's number stays visible: accepted for 4.0.** The institutional identity keeps the person identifiable to that school's admin after their role ends. That is identity, not a statement that they are current staff, and it grants no authority and no role. Historical identity is not hidden when a role ends. Distinguishing current, inactive and former staff belongs to a later staff-lifecycle design.

## READY

Yes, once `RUN` on `HEAD_SHA` is green.
