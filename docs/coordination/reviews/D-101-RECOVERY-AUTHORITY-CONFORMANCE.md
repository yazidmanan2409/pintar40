# D-101: recovery authority — conformance of the code as it stands

- **Date:** 5 Oct 2026.
- **Ruling:** D-101, school self-service and recovery authority.
- **Method:** read-only check of the migrations and `src/`.
- **Nothing was changed.**

M16 = `supabase/migrations/20261116100000_a_forgotten_password_is_recovered_by_pintar_id_and_pin.sql`.

## Summary

| Rule | State |
|---|---|
| (a) a student's lost card is reissued by the School Admin | **Meets the ruling** |
| (b) a School Admin's credential is recovered by another active School Admin of the same school | **Gap** |
| (c) the Platform Admin acts only when no other eligible School Admin exists | **Gap**: today every staff reset goes to the Platform Admin |
| nobody replaces their own privileged credential | **Gap**: no self-reset guard |
| (d) the appropriate sessions are ended and the action audited | **Partly**: audited; sessions are not ended explicitly |
| (e) a second School Admin is quietly recommended | **Gap**, and a School Admin cannot add one |

## 1. A student's lost card (D-101(a))

- **Who may reissue.** `authorize_card_reissue` (M16:310-351) admits:
  - `CAN_PROVISION_PEOPLE` in the learner's school, which only `INSTITUTION_ADMIN` holds;
  - or `is_system_admin()`.
- **How it runs.** The route `src/app/api/akun/kartu-kelas/route.ts` asks the database as the caller. A trigger then moves `card_number` and writes the audit row (M16:356-388).
- **The person.** The account is unchanged, so the identity and the learning history are untouched.
- **Audit.** `account.card_reissued`, with:
  - who authorised it, and their role;
  - the reason;
  - the old and new number.
- **Sessions.** The card's sessions end because Auth ends them when the card's address and password change (checked by `selftest/bob28.test.ts`). PINTAR does not end its own `device_sessions` record explicitly.

## 2. A staff member's PIN or recovery state (D-101(b), (c))

- **The only path is the Platform Admin's.**
  - `admin_reset_recovery` (`20261021100000_an_identity_foundation.sql:593-604`) checks `is_system_admin` only.
  - The «Keamanan akun» page and `recovery_status` are Platform Admin only.
  - The reset clears the lockout ladder and requires a new PIN; the person then sets that PIN themselves.
- **No peer reset.** No function lets a School Admin reset another staff member, a co-admin of the same school included.
- **No self-reset guard.** `admin_reset_recovery` never compares the caller with the person being reset.
- **No sessions ended.** A staff reset ends none of that person's sessions; it is audited as `identity.recovery_restored`.
- **The staff "PINTAR card" is only a printable record** (`my_identity_card`). There is nothing on it to revoke or reissue; a staff member's credential is their password and PIN.

## 3. A second School Admin (D-101(e))

- «Persiapan sekolah» (`src/lib/persiapan-sekolah.ts`) checks Kelas, Murid and Guru only. Nothing warns about a single administrator, and nothing recommends a second.
- **Constraint.** Only an active Platform Admin may grant `INSTITUTION_ADMIN`:
  - in the database (`20261111100000_an_operational_change_says_what_it_was.sql:155-158`);
  - in the Konfigurasi role list.

  So today a school cannot add its own second administrator. A quiet recommendation would have to point the school to the Platform Admin, unless that rule changes.

## Decisions needed before any of this is built (for Yazid)

1. **Peer reset.** Should a School Admin be able to reset the PIN or recovery state of another staff member at their school, or only of another School Admin? Either way, never their own.
2. **Granting a second administrator.** Should a School Admin be able to appoint another School Admin? Today only the Platform Admin can (D-088(a) set up the operator route for the first one).
3. **Ending sessions.** Should every credential replacement explicitly end that person's PINTAR sessions (`sesi_akhiri_semua`-style) in the same transaction, card reissue included?

None of this is in the current finite list (D-100(d)). It is recorded here so that it can be scheduled.
