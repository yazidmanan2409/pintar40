# Sharon: SI-D03, independent verification before the fix (System Integrity Gate)

The owner's direction, 9 Nov: Sharon independently verifies whether a former school's administrator can reset the
recovery of a learner who has transferred elsewhere. If confirmed:
1. a failing regression test;
2. current, authorized school affiliation required for recovery assistance (a historical registration number alone
   never confers authority);
3. the historical registration and transfer records preserved;
4. tests for active affiliation, completed transfer, withdrawal, multiple-school affiliation and unauthorized
   administrators;
5. Sharon verifies the correction at the exact commit.

**No fix has been written.** Please review read-only on the exact head named in the commit that adds this file, on
branch `claude/system-integrity-4.0`.

## The suspected defect

- `recovery_assist_school(p_person)` returns the caller's school when the caller is its active INSTITUTION_ADMIN and
  the person has **any one** of:
  - an `institutional_identities` row at that school;
  - a live role there;
  - a PENDING/ACTIVE enrollment there.
- The registration number is permanent (`20260926100000`), so the first branch never ends.
- `recovery_may_assist` → `admin_reset_recovery` then:
  - resets the recovery ladder;
  - sets `person_pins.reset_required`;
  - ends **every** session of the person (`sesi_akhiri_orang`), at every school.
- `authorize_card_reissue` authorizes the same way (`institutional_identities … can_on_node('CAN_PROVISION_PEOPLE',
  ii.institution_id)`). Not yet reproduced: it needs a class card in the fixture.

## The reproduction: F37-S01 (`selftest/db/fable37.sql`), red on the current schema

The setup:
- School X is the suite's school; school Y is another school with an academic period.
- Four people hold X's registration number and one live `auth.sessions` row each:
  - **T** transferred X → Y (X enrollment ENDED/TRANSFERRED_OUT, Y enrollment ACTIVE);
  - **W** withdrew from X (ENDED/WITHDRAWN);
  - **M** is a learner at X and a teacher (EDUCATOR role) at Y;
  - **A** is a learner at X only.

| Caller → person | Expected | Today |
|---|---|---|
| X's admin → T (transferred to Y) | refused 42501, session kept | **accepted: T's sessions all ended, a new PIN forced** |
| X's admin → W (withdrew) | refused 42501, session kept | **accepted: the same** |
| Y's admin → A (X only) | refused | refused |
| X's Guru, X's Kepala departemen → A | refused | refused |
| Y's admin → T | accepted, sessions ended | accepted |
| X's admin → M; Y's admin → M | both accepted | both accepted |
| X's admin → A | accepted | accepted |
| X's registration numbers (4) and T's and W's ended enrollments (2) | kept | kept |

Run it with `psql "$DB" -f selftest/db/fable37.sql`, then `select * from selftest.run_fable37()`. Everything is rolled
back.

## The proposed correction (after your confirmation)

1. In `recovery_assist_school`, remove the branch that authorizes on `institutional_identities` alone. A school
   assists only a person **currently placed** there: a live role, or a PENDING/ACTIVE enrollment.
2. Give `authorize_card_reissue` the same rule. It gets its own red case with a card.
3. Nothing is written to `institutional_identities`, `enrollments` or `transfers`; the registration number stays for the
   record.

## The owner's safeguard (9 Nov)

- «A person may have a legitimate registration number without an active enrollment yet. We must not fix the
  cross-school defect by breaking legitimate onboarding.»
- The rule recognizes a **current, authorized onboarding relationship**, not the existence of a historical
  registration number.
- So the correction must keep assistance for a person the school is onboarding. For example, someone waiting for an
  account with no enrollment, or an ended placement elsewhere (CR-91, `persons_awaiting_account`). Please name the
  condition that defines "currently onboarding" (question 2).

## Please answer

1. Do you reproduce F37-S01's two accepted resets independently? Is this the defect as stated?
2. Is «currently placed: a live role or a PENDING/ACTIVE enrollment» the right authority?
   - **Case 1:** a person who was only ever given a registration number and is still waiting for an account
     (`persons_awaiting_account`, CR-91). Should their school still assist them? The first branch may exist for them.
   - **Case 2:** what about PENDING?
3. Is any other function authorized on `institutional_identities` alone, or on any historical row? Candidates:
   - `authorize_account_activation`;
   - `authorize_email_correction`;
   - `authorize_card_conversion`;
   - `person_visible_to_me` (visibility only, which may be intended).
4. Is the test's expected table complete? Should it also cover:
   - the platform admin;
   - a school admin whose own role has ended;
   - a person whose Y enrollment is PENDING?
