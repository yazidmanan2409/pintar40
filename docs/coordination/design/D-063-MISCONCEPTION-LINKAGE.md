# D-063: the minimum schema-safe misconception mechanism

**Coordinator's design note, 30 Sep 2026.** D-063(c) asks for this before any implementation ticket. No ticket is open, and Bob and Daisy stay paused until Gate 2E is released (D-062(b)).

**The ruling (D-063, Yazid):**

- (a) Misconception feedback stays in 4.0.
- (b) Content packages carry the misconception definitions they need.
- (c) Several schools must be able to use the same canonical misconception, with no cross-tenant ownership and no global-code collision. The design may not rely on today's schools using different chapters.
- (d) No broader taxonomy redesign.

**In one line:** key each school's definitions by `(institution_id, code)`, make every option point only at its own school's definition, and have the lesson package register the definitions it carries. The code is the canonical identity shared across PINTAR. Each school owns its own row under that code.

## 1. What is wrong today

Read from the migrations on `main` `daa5721`.

1. **The key is global, but every row belongs to one school.**
    - `misconception_taxonomy.code` is the primary key (`20260912112712_content_hierarchy.sql:187`).
    - Yet each row carries `institution_id not null`. RLS allows select, insert and update per school (CAN_DRAFT, `:296-313`). A tenant-immutable trigger guards it (`20260912130904`), and it is registered as the INSTITUTION_SCOPED record class "authored taxonomy" (`:282`).
    - **Collision:** once one school holds `SMA10-M-B1-01`, a second school's insert of that code fails on the primary key. The failure also tells the second school that the code exists somewhere else.
2. **An option can point at another school's definition.**
    - `item_options.misconception_code` references `misconception_taxonomy(code)` only (`20260912112712:262`). Nothing requires the option's school to own the definition.
    - The package check `lesson_package_check` (`20261010100000:333-336`, SECURITY DEFINER) asks whether the code exists **anywhere**. So a second school's package using a code only the first school holds passes, and its options link to the first school's row. **That is cross-tenant ownership.**
3. **Three readers join on the code alone:**
    - `session_misconceptions`, the learner's feedback (`20260913091500:152`);
    - `reading_map`, the remediation on the reading map (`:351`);
    - `service_cohort_misconceptions`, the source of `class.misconceptions` (`20260928100000:148`).

    Today codes are unique, so these are correct. Under any per-school key, each would repeat a row once for every school holding the code. That doubles the class's occurrence counts and can attach another school's text.
4. **The tests already work around the global key.**
    - `fable05.sql:128` suffixes its codes with a run tag.
    - `qac_own_package` (`fable05t1_quick_canonical.sql:211`) inserts `MK-OWN-01` with `on conflict do nothing`. It is called for two different schools (`fable05t1:825`, `fable06:5920`), so the second call can end up linking to the first school's row.
5. **Nothing can register a code.** There is no screen, package field or seed. Lana's 20 chapter files sit beside the workbooks (`docs/onboarding/konten/*-miskonsepsi.csv`):
    - 277 codes, all unique;
    - named by chapter (`SD5-M-B1-01`, `SMA10-M-B1-01`, `SMA11-G-B1-01`);
    - every code matches `^[A-Z0-9]+(-[A-Z0-9]+)*$`, 13 characters at most;
    - every label, description and remediation is present (at most 57, 175 and 181 characters).

    Staging run 16 published SMA X Bab 1 with 32 `WEAK_MISCONCEPTION_LINKAGE` warnings for this reason.

## 2. The mechanism

**M1. The key.** The primary key becomes `(institution_id, code)`.

- The code is the canonical identity: `SMA10-M-B1-01` means the same thing in every school that imports Bab 1. Each school owns its own row under that code.
- There is no new table or column, no platform-owned row, and no change to RLS or the tenant trigger.

**M2. The link.** `item_options (institution_id, misconception_code)` references `misconception_taxonomy (institution_id, code)`.

- Under MATCH SIMPLE, an option with no code needs no definition, as today.
- An option can reference only its own school's definition. The database enforces this for every route: the package, the revision copy, the ad-hoc copy and a direct insert.

**M3. The readers.** Add `and mt.institution_id = o.institution_id` to the three joins in §1.3 and change nothing else in their bodies.

- **D-060, catalogue:** unchanged. The results are identical wherever every link is same-school; M2 guarantees that from now on, and the migration verifies it for existing rows. The migration header states this.
- **D-060, engine:** unchanged. This is feedback, not grading.

**M4. Definitions are append-only for each school.** The table's own comment already says so ("append-only, codes never reused"), but `authenticated` still holds UPDATE and no screen uses it.

- Revoke UPDATE on this one table.
- A changed meaning becomes a new code. So a published question's feedback never changes under it, and "the same text, reuse it" (M5) stays true.

**M5. The package carries its definitions** (D-063(b)).

- **The workbook** gains a sheet **«Miskonsepsi»** with the columns Kode, Nama, Penjelasan and Cara membantu. The package gains `misconceptions: [{code, label, description, remediation}]`.
    - Lana's CSV columns map one to one.
    - Her `questions` column is how she fills «Kode miskonsepsi» on the Pilihan sheet. It is not imported.
- **`lesson_package_check`**, for the importing school (`p_institution`) only:
    - **Each definition:** the code matches `^[A-Z0-9]+(-[A-Z0-9]+)*$` and is 3–40 characters; label, description and remediation are present and within limits; no code appears twice in one package.
    - **Each option's code** must be defined in the same package. A code the school already holds must still be carried: the package is whole.
    - **A code the importing school already holds:**
        - identical text (after trimming) → reused;
        - different text → refused, naming the code and its row. Nothing is changed.
    - Another school's rows are never read. So nothing about another school is revealed, and nothing can collide with it.
- **`lesson_package_materialise`**, in the same transaction and before the options are written:
    - insert the definitions with `on conflict (institution_id, code) do nothing`;
    - re-read each one and refuse if it differs. This stops a concurrent import from slipping in different text between the check and the write.
    - The options then satisfy M2.
- **Copies stay within a school.** `create_course_revision` and the ad-hoc paths copy options inside one school, so they need no change and M2 holds for them.
- **New problem codes**, each with a sentence Daisy writes:
    - `MISCONCEPTION_CODE_INVALID`;
    - `MISCONCEPTION_TEXT_MISSING`;
    - `MISCONCEPTION_REPEATED`;
    - `MISCONCEPTION_DEFINITION_DIFFERS`;
    - `OPTION_MISCONCEPTION_UNKNOWN`, which now means "not defined in this package".

## 3. Against the ruling

| D-063 asks | How M1–M5 meet it |
|---|---|
| The same canonical misconception in several schools | Two schools importing the same chapter each get their own row under the same code, with the same text, so learners get the same feedback. Grouping by code across schools later needs no change. |
| No cross-tenant ownership | Every row belongs to the school that imported it. An option can point only at its own school's row (M2, in the database). |
| No global-code collision | Uniqueness is per school. A second school's import neither fails nor learns that another school holds the code. |
| Not relying on schools using different chapters | The tests in §5 import the **same** chapter into two schools. |
| No broader redesign | No new table or column, platform library, editing screen or versioning. |

## 4. The migration (one, Bob)

1. **Guard first.**
    - Count options whose code resolves only to another school's row. If there are any, stop and name the count. That is not repaired silently: the coordinator reports it and Yazid decides.
    - Report the number of taxonomy rows in a notice.
    - Before merge, the ticket reads the same two counts on staging and production, read-only.
2. **Keys.** Drop `item_options_misconception_code_fkey` and `misconception_taxonomy_pkey`. Add the primary key `(institution_id, code)`, then the foreign key `(institution_id, misconception_code)`, and index it.
3. **Readers.** Replace the three definitions with the added predicate; their bodies are otherwise byte-identical.
4. **Grant.** `revoke update on public.misconception_taxonomy from authenticated`. If the schema lint expects the grant, change the lint with a reason.
5. **Package path.** The check and materialise changes (M5), with the contract in `src/lib/unggah-kontrak.ts`: the sheet, `BATAS_PAKET.miskonsepsi` and the problem codes.
6. **Verification block.**
    - The key columns and the foreign key's columns are as specified.
    - All three readers carry the predicate.
    - `authenticated` has no UPDATE on the table.
7. **The header states:** catalogue unchanged (D-060(c), the reason in M3); engine unchanged.

## 5. Proof: tests red on today's code, green after

| # | Test | Why it is red today |
|---|---|---|
| T1 | Two schools import the **same** chapter with the same codes: both succeed, each holds its own rows, each option points at its own school's row | The second registration fails on the key, or links to the first school's row |
| T2 | School B cannot link an option to a definition only school A holds, by package or by a direct insert as B's author | The package check passes it, and the foreign key accepts it |
| T3 | The same school re-imports the same definitions: reused, one row per code | (new path) |
| T4 | The same school imports a different text under a held code: refused by name, nothing written | (new path) |
| T5 | An option names a code the package does not define: refused, even if the school holds it | (new path) |
| T6 | With the same code in two schools and learners in both choosing that distractor: `session_misconceptions` returns one row per chosen option; `class.misconceptions` occurrences equal the answers (not doubled); each school sees only its own | Duplicated rows once the key is per school |
| T7 | `authenticated` cannot update a definition | UPDATE is granted |
| T8 | The existing suites stay green. `qac_own_package` uses `on conflict (institution_id, code)` | (fixture correction) |

**Staging, after the gate.** Re-import one chapter with its «Miskonsepsi» sheet.

- The publish shows no `WEAK_MISCONCEPTION_LINKAGE` for questions whose distractors all carry codes.
- A student who chooses a coded distractor sees its remediation on the result and the reading map.
- The class «Miskonsepsi» card still cannot appear in the synthetic school (D3). Audit job B proves it on the audit stack (D-064).

## 6. Who, and when (proposed; Yazid places it)

- **Bob:** §4 and the tests in §5.
- **Daisy:** the «Miskonsepsi» sheet in the downloadable template, the sentences for the new problem codes, and the template's help text.
- **Lana:** fill each chapter's «Miskonsepsi» sheet from her CSV, and Pilihan's «Kode miskonsepsi» from its `questions` column. This is mechanical, and she is paused.
- **Coordinator:** gate it; re-import on staging; extend audit job B so `class.misconceptions` shows with three or more learners.

**Proposed placement:** as brief 1 proposed, after Gate 2E (BOB-25) passes and before Gate 3 (BOB-26). BOB-15, DAISY-12 and BOB-13 are not started (Yazid, 30 Sep). Nothing is opened until Gate 2E is released.

## 7. After 4.0 (not built)

- A platform-owned library or shared ownership of definitions.
- A Studio screen for adding or editing definitions.
- Versioning or merging of definitions.
- Analysis of misconceptions across schools (M1 already allows grouping by code).
