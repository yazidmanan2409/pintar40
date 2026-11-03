# Batch 4 · Promotion preconditions (3 Nov 2026)

**Authority:** owner, 3 Nov: «PINTAR 4.0 — BATCH 4 PROMOTION GATE — Decision: CONDITIONAL GO» (D-153). The four conditions are below, each with its evidence. Staging was only read (Supabase project `keijhmdtsgrfvnvocfvk`, read-only queries); nothing was written to it in this step.

## 1. Migrations 184–188 against staging's 183, and the recovery plan

**Staging's history is exactly the repository's first 183 migrations.**
- Staging has 183 rows in `supabase_migrations.schema_migrations`; the last is `20261216100000`.
- The md5 of its ordered version list is `1b7c03b7621a1849ae2081cb6d4621f8`. The repository's first 183 versions give the same digest.

**What 184–188 replace is undrifted.** The four functions they re-emit have bodies on staging identical to the repository's pre-Batch-4 definitions (md5 of `prosrc`):

| Function | Last defined in | md5 (repository = staging) |
|---|---|---|
| `auth_card_email_guard()` | 20261116100000 | `0f9765673fa88138d600c5b0e8ac0013` |
| `auth_email_correction_guard()` | 20261203100000 | `e6c0943af990b0b193bae6136b6f3230` |
| `transfer_execute(uuid)` | 20260912004527 | `8dfdb7836b2910e29acb77e34c9250c8` |
| `maintenance_list()` | 20261120100000 | `6177cd70b85783aa8e36437b3dbc26ec` |

**Every prerequisite is present:**
- the triggers on `auth.users` (`pintar_card_email_guard`, `pintar_email_correction_guard`);
- the functions the new code calls: `authorize_email_correction`, `correct_person_name`, `correct_username`, `persons_awaiting_account`, `card_holders`, `issue_institutional_id`, `sesi_akhiri_orang`;
- the `transfers` columns `requested_by_institution`, `to_programme_id`, `to_enrollment_id`, `executed_at`.

**None of the new objects exist yet:** `card_conversions` and the seven new registry rows are absent.

**The data the migrations touch is empty:**
- 0 transfers, so relaxing `to_academic_period_id` and adding `transfers_executed_has_period` act on no rows;
- 0 maintenance windows and 0 notices.

**The grants are restated to staging's own.** `transfer_execute` keeps authenticated and service_role, with no anon and no public.

**The upgrade path is proved in CI.** The `migrations · previous schema → HEAD (upgrade path)` job applies 184–188 on top of 183 and is green on PR #7.

**Recovery plan.** The scheduled offsite backup workflow has skipped its recent runs, so recovery does not rely on it. Instead:
- **The rollback script:** `ROLLBACK-184-188.sql` (this folder).
  - It is never applied by any workflow, and is run only on the owner's say.
  - In one transaction it restores the four replaced functions from the repository's own pre-Batch-4 text, and removes every new function, table, constraint and registry row.
  - It refuses, changing nothing, where rolling back would lose data written after promotion: a transfer with no school year, or a carried-out card conversion.
- **Tested locally on 3 Nov:**
  - applied at 188, the four functions' hashes and `maintenance_list`'s grants equal staging's above;
  - 183 migrations remain, and the new objects are gone;
  - `supabase migration up` then re-applied 184–188 cleanly, and F24-* passed again (9/9).
- **Everything else the new functions write** (audit rows, transfers, corrected emails, names, usernames, photos) is valid under 183's schema, so it survives a rollback.

## 2. An interrupted card-to-email conversion

The conversion is one transaction by design. The account changes only inside Auth's own address update, when the `auth.users` guard consumes a live, single-use, two-minute grant for exactly that address.

**F24-K03** (database, rolled back; green) measures each interruption point.

| Where it stops | What holds |
|---|---|
| After the grant, before Auth's write | The account is still the class card: same number, same sign-in address, no set-up started. A staff role is still refused (`STAFF_ROLE_FOR_CARD`, CR-91). |
| The admin retries | One pending grant, never two. |
| The grant expires before Auth writes (a slow or failed route) | Auth's write is refused (`CARD_ADDRESS_REFUSED`) and nothing changes. |
| Auth wrote but the answer never reached the screen | A second conversion is refused (`CARD_NOT_FOUND`); nothing is converted twice. The person holds exactly one email account, set-up REQUIRED. |
| The new address was wrong or unreachable | The school corrects it before activation (`authorize_email_correction`, the supported path), and the corrected address is offered the activation code. |

F24-K01 and K02 already proved two more things. A staff role is granted only after the conversion. Any other change of the address is refused (`EMAIL_CHANGE_REFUSED`).

## 3. School isolation and historical identity in the transfer workflow

**F24-P03** (database, rolled back; green) measures the executed transfer against INV-13 and INV-25.

**Identity and history are unchanged.** A digest taken before and after the transfer is equal for:
- the learner's nomor induk at the sending school;
- their PINTAR ID;
- their sittings, official results and certificates.

The sending enrolment is kept as ENDED history; nothing is deleted or re-parented.

**The sending school still reads its own ended enrolment, but never the learner's new enrolment** («never the learner's future elsewhere»).

**The receiving school reads:**
- the enrolment it received;
- the learner's **portable** enrolment history.

INV-25 and `record_class_registry` mark enrolments and memberships as PORTABLE, readable once a transfer is executed and only for rows that existed at that moment.

**The receiving school does not read** any of the sending school's **INSTITUTION_SCOPED** records about the learner, such as its audit rows.

**Before execution** (F24-P01): the receiving school sees the learner's name only (`pindah_masuk`), not the person row. The directory finds active schools by exact name or code only, and every search is audited.

**Correction to my own first draft of F24-P03:** it asserted that the receiving school could *not* read the sending school's ended enrolment. That contradicts INV-25's portable classes, which is the platform's long-standing rule from `20260912010009_tenant_scoped_reads.sql`, rule (d). The test now asserts the canonical rule. No behaviour was changed to make it pass.

## 4. W2.10 stays incomplete

- The Aktivasi waiting-for-account list is not paged.
- It is registered as **incomplete W2.10 functionality, not an accepted deviation**. This applies in the open-work register (W2.10: PARTIAL — INCOMPLETE), in the completion report (§4) and in D-153.

## 5. CI on the final head

This document, F24-K03, F24-P03 and the register changes are the last commits before the merge. CI must be green on that final head. The end-to-end journeys ran on `b66c4bb`. The commits since then change only tests, documents and the out-of-band rollback script, never the application code, migrations, journey scripts or workflows, so the journey evidence remains valid; the merge record repeats the diff check.
