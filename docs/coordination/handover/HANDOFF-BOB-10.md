# Bob → coordinator: BOB-10 (the intake refuses staff rows at validation, M5b interim)

**Head:** `7073ef3`, on main `f03c3fc` (merged first; Integration 11, `b24a95b`, beneath it).

## CHANGED

**The trap.** `import_advance` records every row that names a place as a learner first: an enrolment and a membership in that place. Only then does it grant the row's role.
- An EDUCATOR, HEAD_OF_DEPARTMENT or DEAN placed in a **Kelas** became a student of that class, with the role granted on top (M5).
- The same row placed in a **Bagian** passed "Periksa daftar ini" and then failed at recording. The membership was refused there, and the row's reason showed the database's own sentence.

**The interim rule.** `import_row_problems` now refuses any staff role (EDUCATOR, HEAD_OF_DEPARTMENT, DEAN) with a new phrase, `a staff row is not recorded by the bulk intake yet`.
- It is the same function the check, the confirmation and the recording step all call, so a staff row is refused before anything exists and can't reach the learner's path.
- The screen shows it through `MASALAH` → `pendataan.masalah.staf`:
  - id: "Peran guru dan staf belum bisa diberikan lewat pendataan massal. Kosongkan kolom peran dan tempat pada baris ini; Admin platform memberikan perannya dari Konfigurasi."
  - en: "Teacher and staff roles can't be given through a bulk intake yet. Leave this row's role and place empty; the platform admin gives the role from Konfigurasi."
- **Learner rows are unchanged:** no role or STUDENT, placed in an active Kelas or Tingkat. So are all the other phrases, including SYSTEM_ADMIN and INSTITUTION_ADMIN's "not granted by bulk provisioning" and a STUDENT with no place.
- The sentence gives the one path that works today. A teacher recorded with no role and no place gets a person and an institutional ID, and no enrolment. They then appear under "awaiting a first role" in Konfigurasi, where the **platform** admin grants the role. A school admin can't do that yet: see QUESTIONS 1.

**The board row's second half, the duplicate active grant,** was done in BOB-18 (e): the `role_assignments_unique_active` trigger, F01-T22 and F10-C04.

## PROOF

| test | red before (today's code, restated test) | green after |
|---|---|---|
| F10-M01, restated | `5 problem(s): an EDUCATOR scoped to a Bagian was accepted: []; an EDUCATOR placed in a Kelas was accepted: []; a HEAD_OF_DEPARTMENT scoped to a Bagian was accepted: []; a DEAN scoped to a Bagian was accepted: []; the intake's check does not refuse a teacher placed in a Kelas as staff: {"ok": true, …}` | 13 of 13; nobody provisioned |
| BOB01-M01 (unchanged) | would fail if the new phrase had no sentence | it now reads the new definition: all 12 phrases have a sentence in both languages |

**Restated for the changed requirement, named:**
- **F10-M01:** its EDUCATOR-at-a-Bagian row used to expect "accepted" and now expects the staff refusal. It gains three staff rows, including a teacher placed in a Kelas, and a check through `import_validate`. The learner rows are unchanged.
- **F06-P17:** its three-row import had "Guru Baru" as an EDUCATOR placed in a Kelas, the very trap this ticket closes. The row is now recorded without a role or a place. The probe's purpose (who may provision, a number and not an account, three IDs issued) is unchanged.
- **Tripwires:** the migration-count checks moved from 119 to 120, with the reason.

No test was weakened, skipped or deleted.

## CI

I dispatched one run on `7073ef3` and haven't waited on it; please read the result there.
- **Local, before dispatch:** tsc and lint are clean. A full run on a fresh database with all 120 migrations: 347 passed, and F06-P17 failed on the first run, which led to its restatement. After that, F06 is 41 of 41. The only other failure is F01-R07, which always fails locally.
- All 79 plants prove their gates.
- The inline DB red cases, rehearsed as `ci.yml` has them: all 15 `db-*` gates except `db-table-without-rls` (including `db-fable06-gates`, which runs F06-P17's suite) exit 0. After each gate the schema digest is unchanged and the DB suites are 233 of 233.
- One run, no new job.

## CONTRACT

- One new phrase from `import_row_problems`: `a staff row is not recorded by the bulk intake yet`. It is mapped in `MASALAH` (`src/lib/pendataan-kontrak.ts`).
- No error codes changed.
- `PERAN_PENDATAAN`, the roles the mapping screen offers, is unchanged. See QUESTIONS 2.

## MIGRATIONS

`20261014100000_the_intake_refuses_staff_rows.sql`, forward-only. It replaces the body of `import_row_problems` with one branch added, and its terminal checks confirm that three staff rows are refused and two learner rows are unchanged. No table, column or data changes.

## COPY

One key, `pendataan.masalah.staf`, in both languages; the wording is mine. Daisy owns it.

## QUESTIONS

1. **Your question: will staff always have an enrolment at their school? No.**
   - Staff are given roles, not enrolments. After BOB-10 a teacher recorded by the intake has a person and an institutional ID, and no enrolment.
   - `person_visible_to_me` lets a school admin see only a person enrolled at their school, a learner in their roster, or someone made portable to them. So the school admin sees the teacher's grant but not their name.
   - `persons_awaiting_first_role` is platform-admin only, so today a school admin can't find a new teacher to give a role.
   - **Proposal, for M5b / M2, not done here** because it widens who can see whom:
     - let a school admin see a person who holds an institutional identity at their school, or a role there;
     - give that admin a school-scoped "awaiting a first role" list.
   - This needs your decision, since it touches person visibility.
2. **The mapping screen still offers EDUCATOR, HEAD_OF_DEPARTMENT and DEAN** as one-value choices for the role column (`PERAN_PENDATAAN`, read by Daisy's `BacaDanPetakan.tsx`). Chosen now, every row gets the new reason at "Periksa".
   - I left the list alone: whether to hide them until M5b, or keep them visible with the reason, is a screen decision for Daisy.
   - If they go, UX1-DATA-BERKAS-01 (`PERAN_PENDATAAN.length === 4`) needs restating in the same change.

## READY

Yes, once the run on `7073ef3` is green.
