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

## 4. Decisions asked (answered 5 Oct; see below)

1. **Peer reset.** Should a School Admin be able to reset the PIN or recovery state of another staff member at their school, or only of another School Admin? Either way, never their own.
2. **Granting a second administrator.** Should a School Admin be able to appoint another School Admin? Today only the Platform Admin can (D-088(a) set up the operator route for the first one).
3. **Ending sessions.** Should every credential replacement explicitly end that person's PINTAR sessions (`sesi_akhiri_semua`-style) in the same transaction, card reissue included?

None of this was in the finite list (D-100(d)).

### The answers, 5 Oct (Yazid; recorded on D-101 in DECISIONS.md)

1. **Assisted recovery.** A School Admin may assist with PIN/recovery for another person under that school's authority, including staff and learners, where the applicable recovery journey permits it. They may never perform privileged recovery on themselves. Authority never crosses the school's boundary.
2. **A second School Admin.** An active School Admin may appoint another eligible person within the same school as School Admin. This must be explicit, confirmed and fully audited. A School Admin cannot elevate themselves, grant authority outside their school, or create Platform Admin authority. If no functioning School Admin remains, Platform Admin is the recovery authority.
3. **Sessions.** Lost/replaced/reissued credentials invalidate the old credential and terminate the affected person's existing authenticated sessions. The underlying identity, permissions, history and records remain intact. A routine authenticated PIN/password change may follow its separately ruled session policy and should not automatically be treated as credential compromise.

**Preserved:**
- Schools resolve ordinary operational problems themselves wherever this can be done safely. PINTAR Platform Admin is the recovery authority of last resort.
- Credential recovery happens at the nearest available independent authority. A person can never be the final authority for replacing or recovering their own privileged credential.

## 5. What the answers add before ENGINEERING COMPLETE, and the smallest change

**Status: not built.** Nothing in the code has changed since §1–§3.

**Required before ENGINEERING COMPLETE: yes.**
- D-101 is canonical for PINTAR 4.0, and ENGINEERING COMPLETE means the intended 4.0 functionality is in (D-052(b)). The answers turn the gaps below into specified 4.0 work.
- C-12 itself does not depend on any of it: it proves the professional-learning venue. But ENGINEERING COMPLETE is declared only after C-12 passes (D-070(f)).
- Recommended order: build this first, as one bounded item, so that C-12 runs on the finished engineering.

### The gaps, checked against the code on `main` (`227ce75`)

| Answer | Today | Gap |
|---|---|---|
| (1) staff and email-account learners | `admin_reset_recovery` and `recovery_status` admit the Platform Admin only; neither compares the caller with the person; «Keamanan akun» is the Platform Admin's page | A School Admin cannot assist anyone; nobody is refused their own reset |
| (1) class-card learners | The School Admin re-issues the card (§1) | None |
| (2) | `role_assignments_guard` (`20261111100000`) lets only the Platform Admin grant `INSTITUTION_ADMIN`; Konfigurasi offers it to the Platform Admin only. Self-grant is already refused. Every grant is already audited (`role.granted`: person, role, scope, the grantor's role) | A School Admin cannot appoint a co-admin; there is no confirming step |
| (3) | When a card is re-issued or a forgotten password is replaced, Auth ends the person's Auth sessions: refresh fails and pages go to /masuk (BOB-28's tests). PINTAR's own session records stay open, though, and the pre-request refuses only an ended record. So, as the code reads (not reproduced; the change's test will show it red first), an access token issued before the change is still accepted for the rest of its life: up to 60 minutes with `supabase/config.toml`'s `jwt_expiry = 3600`. An admin recovery reset ends no session at all | End the person's sessions where the replacement happens, in the same transaction |
| (3) routine change | 4.0 has no routine password change: the password guard allows a write only for `ACTIVATION`, `RECOVERY` and `CARD_REISSUE` | None |
| D-101(e) | Nothing recommends a second School Admin | One quiet line, possible now that (2) lets the school act on it |

### The smallest bounded change (one item, built the way the finite list's items were)

**One migration:**
1. **One authority question: may the caller assist this person's recovery?**
   - Yes for the Platform Admin.
   - Yes for an active School Admin of a school that has the person, by BOB-21's own definition: its number, a role there other than Platform Admin, or a learner there.
   - Never for the caller's own person, whoever the caller is.
   - Never for a person who holds Platform Admin authority, because that is outside the school's boundary.
2. **`recovery_status` and `admin_reset_recovery` ask that question.** Their registry rows become SCOPE `INSTITUTION_ADMIN`, and refusals are by code.
3. **One core that ends all of a person's sessions.**
   - It records every Auth session of the person, then ends each one through `sesi_akhiri_inti`, the existing audited path.
   - It runs in the transaction where a credential is replaced: the password guard's `RECOVERY` and `CARD_REISSUE` writes, and `admin_reset_recovery`.
   - `ACTIVATION`, «Keluar» and «Keluar dari semua perangkat» are unchanged.
4. **`role_assignments_guard` changes in one branch.**
   - `INSTITUTION_ADMIN` may also be granted by an active School Admin of the same school, at that school's own top node only.
   - `SYSTEM_ADMIN` grants and unscoped grants stay the Platform Admin's.
   - Self-grant stays refused, and BOB-21's "a person the school has" check applies.

**src (current components only):**
- **Konfigurasi → Peran & akses:** a School Admin is offered «Admin sekolah», scoped to their own school. A second press confirms it, the «Sudah benar» pattern already used for «Orang baru».
- **«Keamanan akun»:** the PINTAR ID lookup and the reset open to a School Admin, and the database decides for whom. The security record stays the Platform Admin's.
- **«Persiapan sekolah»:** when the school has a single School Admin, one quiet line recommends a second as recovery cover. It is never shown as an error (D-101(e)).

**Tests:** one suite, source and database (rolled back).
- The new suite is red on the 158-migration database and green after.
- The negative probes of every staff RPC (F06-N02) stay green.
- Then one CI run, main, staging and the log.

**Size:** comparable to «Laporkan masalah»: one migration, about four src files, one test file.

### Readings where the answers are silent (none needs a decision unless Yazid says otherwise)

- **Privileged recovery** means recovery done with an administrator's authority. A person's own forgotten-password recovery by email, or by PINTAR ID + PIN (Gates 4 and 5, confirmed as built in D-100(a)), proves an independent factor, so it is not affected. It still ends their other sessions, because a lost credential is replaced.
- **Platform Admin authority is outside a school's boundary:** a School Admin cannot assist a person who also holds it (answer 1).
- **An assisted PIN reset is a replacement:** the old PIN stops working. So it ends that person's sessions, although their password is unchanged.
- **Removing a co-admin is unchanged:** `revoke_role` already admits a School Admin over their school's assignments, with a reason, and audited. If a school is left with no School Admin, the Platform Admin acts, as answer (2) rules.

