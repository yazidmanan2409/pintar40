# J12: L-155, a person entered as staff is offered a learner card

Sharon, read-only, 2026-11-25, on origin/main. Bob asked (ledger c31bdd78). This does not block CI-2.
I have not queried staging; this is a code read only.

## What holds today (checked)
CR-91's invariant is in the database in both directions (`20261212100000`):
- `accounts_card_is_learners` refuses a CLASSROOM_CARD account for a person with a live staff role (CARD_FOR_STAFF).
- `role_assignments_card_holds_no_role` refuses a staff role for a card holder.

So **a card session never carries a live staff capability.** L-155 is not a privilege escalation.

## Classification: Significant (credential policy and data integrity), not Critical
- **The test:** card eligibility is the *absence of a live staff role* (`not memegang_peran_staf(p)`), not a recorded learner property.
- **Who gets offered a card:** an adult entered as staff, before a role is given or after it lapses, is offered and can activate a ten-digit card with a short PIN printed on paper.
- **What that card reaches:** everything their person reads through `current_person_id()` without a role. For example, an educator's own feedback reading (`subject_person_id = current_person_id()`) and their own history.
- **The weak credential:** that adult data sits behind the low-entropy credential CR-91 meant for learners only.
- **The counts:** they are counted in «murid tanpa kelas», which is wrong.
- **The root (with L-154):** «guru atau staf» is browser state, so nothing records that the person is staff.

Could reasonably have been anticipated: yes. CR-91 defined "learner" negatively, and a negative test fails open whenever the positive fact (staff) is not recorded.

## The card rule
1. **Record staff-ness at intake, on the server.** The intake route sets a durable person attribute: entered as staff, the institution, who, when. It is written under CAN_PROVISION_PEOPLE and audited. It is never taken from the browser alone, and it is changed only by an audited admin act with a reason, giving the reclassification.
2. **Card eligibility is positive.** A person may hold or be offered a CLASSROOM_CARD only if they are **not** recorded as staff **and** have **never** held a staff role (revoked or expired included). The only exception is an explicit, audited reclassification to learner.
3. **One helper, read everywhere.** The card offer, `accounts_card_is_learners` (the DB refusal, which is the boundary), `authorize_account_activation`, «murid tanpa kelas» and the other counts listed at the `memegang_peran_staf` sites all read the same helper. The refusal keeps its errcode and detail, CARD_FOR_STAFF.
4. **The reverse direction is unchanged.** A card holder still can't be given a staff role (`role_assignments_card_holds_no_role`).

## What a lapsed staff role means
- **Sign-in:** their existing email account keeps working. The lapse removes capabilities, not the account. They sign in as a person with no staff role and see what such a person may see. Locking, if wanted, goes through CI-2's lock.
- **Card eligibility:** none. A lapse never makes a person a learner, and they are not counted as a learner without a class.
- **Re-granting a role:** unaffected, because they hold no card.

## Before AR-79 lands
- **Step 0 (read-only):** count CLASSROOM_CARD accounts whose person ever held a staff role, or was entered through the staff list where that can be inferred. Every hit goes to the owner, as CR-91's existing-data rule says.
- **Tests:**
  - a staff entry with no role is refused a card at the DB, not just in the UI;
  - a lapsed role is still refused;
  - a reclassified person is allowed, and the reclassification is audited;
  - the counts exclude both cases;
  - a PLANT reverts the helper to `not memegang_peran_staf` and must turn the tests red.

---

## Addendum (2026-11-25, 00:4xZ): step 0 on staging; Daisy's activation question

**Step 0:** Bob took it on staging, read-only, at 00:36:43Z. I did not take it myself; I record it from his evidence.
- 1,477 CLASSROOM_CARD accounts.
- 0 whose person ever held any role, and 0 with a live role.

So there are no staging hits. Production is counted through the authorised readiness process, and any hits there go to the owner.

**Daisy's question:** may a staff-kind person with no role yet activate by email before a role is given?

**Yes, by email only.** A person with no role has no capability, and an email credential is strong, so activating first is safe. Giving the role first and then activating is the clearer order for the admin, but it is not a security requirement, so Daisy's line can stay as guidance. The firm rule is that a card is never offered or issued for a person recorded as staff, whatever their role's state.
