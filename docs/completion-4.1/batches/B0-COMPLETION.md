# B0 · Administrator lock-out protection: completion page

**Lane B. Effort S. Review before build: Sharon, short.** Status: awaiting that review. No code yet.

## Why

Verified in the 4.0 code:
- Every role assignment has a mandatory end date (`valid_until`), and rows are immutable.
- `revoke_role` has no last-holder check. Only the screen hides the self-revoke button.
- So the last platform admin, or a school's only admin, can be removed or can simply expire. Recovering the platform then needs database access; the bootstrap is single-use.

## Operations

| Operation | Who | Result |
|---|---|---|
| Revoke or end the **last live platform-admin** role | anyone | **Refused**, with a designed code and sentence. Appoint a second platform admin first |
| Revoke or end a school's **last live school-admin** role | another school admin, or the staff-departure and change-roles paths | **Refused** in the same way. A platform admin may still do it (they can appoint the next one), and the screen says the school will have no admin |
| See that a role is about to expire | the holder; the school's admins (school roles); platform admins (platform roles) | A notice on Konfigurasi › «Peran & akses» from 30 days before the end date, and on the holder's own home from 7 days |
| **Renew** a role | whoever may grant that role today | One act: a new assignment with a new end date, then the old one revoked, in one transaction, audited as a renewal with a reason |
| Renew **one's own** platform-admin role when no other platform admin exists | the last platform admin | Allowed, with a reason, audited. This is the only self-grant |
| Recover a platform with **no** platform admin | an operator | A dispatched workflow, in the pattern of `found-school.yml`: it names one existing person as platform admin, with a reason, audited. No database console |

## Refused, and why

- No role becomes permanent: the end date stays mandatory.
- Expiry is still enforced for the last holder. The protection is the warning, the renewal and the operator workflow, not a silent extension of authority.

## History kept

Every refusal, renewal and operator appointment writes an audit row. Old assignments stay as they are.

## Screens and states

Konfigurasi › «Peran & akses» only. States: no role expiring; one or more expiring (count, names, dates in the school's zone); renewal succeeded; renewal refused; last-holder refusal. All copy in `hle.ts`, Indonesian and English.

## Tests: red before, green after

- Database: the last platform admin cannot be revoked (red today: accepted). The last school admin cannot be removed by a school admin or through staff departure (red today). A platform admin can remove a school's last admin. A renewal is one transaction and leaves exactly one live assignment. The self-renewal is refused when a second platform admin exists.
- App: the expiry notice shows at 30 days and not at 31. The renewal by keyboard.
- Workflow: its controlled red (a person who does not exist) refuses and writes nothing.

## Out of this batch

A school admin adding one person or correcting a name; declining an account request; password change while signed in. All 4.2.

## Questions for Sharon (to settle on this page)

1. Is the self-renewal by the last platform admin acceptable, given it is the only self-grant, audited, and refused when a second admin exists?
2. Should a platform admin removing a school's last admin need a second confirmation, as granting school admin does today?
3. Is the operator workflow an acceptable break-glass, as founding a school is, or should it need two people?
