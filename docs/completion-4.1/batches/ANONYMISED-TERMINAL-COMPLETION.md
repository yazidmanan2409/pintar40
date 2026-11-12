# L1-F4 · An anonymised person is terminal: completion page

**A bounded correction of 4.0 behaviour, before Z** (`ANONYMISED-PERSON-IS-TERMINAL.md` on `claude/bob-41-master-plan`
at `f2861db1576eae3eb9e7e0728ea37ec1dde94d7d`: §0, §3a Sharon's four points, §3b the owner's Option A, §3c Daisy's
wording). It gates nothing. Review: Sharon on the exact commit; Daisy for the deletion's refusal line, the "earned but
not issued" line (a draft) and one more draft line (below).

## For Sharon: the fix after your BLOCKED of `3a63a2b2…` (this is the prompt; it supersedes the next)

**Your record:** `claude/gracious-lamport-0m1qjr` at `a809058bbc2dfd6b0aea0b92f98e77e8901c3dbf`,
`L1F4-3a63a2b2158ea4834c1f12653c864baf157c0dd5.md`; the brief's §0 item 11. **Candidate:** the commit carrying this
section, L1-F4's own, above B2's fix; one pre-flight and one set of runs for both (Bob's queue). Its 40-character hash is
in the review queue.

**Please verify** (migration `20270117200000_an_anonymised_person_is_never_reopened.sql`):
1. **L1F4-A1, the race.** `hapus_data_pribadi` takes the person `FOR UPDATE` first, before its request and before every
   check; the closure and both attachment checks are read under that lock. `buka_kembali_akun` and
   `aktifkan_kembali_akun` take the person row first too.
   - **One step further than your fix asked, and why.** Your item 4 has the deletion end the person's open REOPEN
     request. The reopen locks that request row. Had the reopen taken its request before the person, the two would
     wait on each other. So **both** the deletion and the reopen read their request's person without a lock, lock the
     person, and only then lock their own request and check it again: persons → `account_requests` →
     `person_suspensions` → `auth.users` → accounts, as L1-F2's rule.
2. **L1F4-A2, no race needed.** `buka_kembali_akun` refuses a person whose personal data was deleted:
   `ACCOUNT_ANONYMISED`. `minta_buka_kembali` records nothing for one; its answer is the same `ok` as for anyone.
   - **Found while testing:** L1-F4's own guard on `account_requests` already refuses a **new** REOPEN row for an
     anonymised person (`PERSON_UNKNOWN`). Before this fix, `minta_buka_kembali` would have tried that insert and
     raised, an answer different from anyone else's. It no longer tries.
3. **Item 4, the Chief Architect's request:** the deletion ends the person's open REOPEN request as `DECLINED`, with the
   note «Data pribadi orang ini sudah dihapus; akunnya tidak dibuka kembali.»
4. **Tests, red first on `9db58dd51aa4f785741bbb2e9fa33c76312b57d5`:**
   - **L1F4-R02**, two real connections, both orders, each act paused just after its first lock (its function swapped
     by fragment). Deletion first: the reopen waits, then is refused; the person ends anonymised, still closed, every
     account locked. Reopen first: the deletion waits, then is refused `ACCOUNT_NOT_CLOSED`; the person ends reopened
     and not anonymised. **Your second plant is its last phase:** the deletion's closure check moved back before its
     lock, with the pause between; the reopen passes through, and the person ends anonymised **and** reopened. Red on
     `9db58dd5` structurally (there is no first lock to pause after); the plant phase is that commit's order exactly.
   - **L1F4-K12**, sequential: your "L1F4-K09", **renamed because K09 was taken** (the closure-record test of
     `3a63a2b2`). A request made before the deletion: the deletion ends it, and approving it after is refused. Any
     other open request (written past the guard, as data from before this fix would be) is refused
     `ACCOUNT_ANONYMISED`. The closure stays open and every account locked. A request by PINTAR ID after the deletion
     answers `ok` and records nothing. **Red on `9db58dd5`:** "approving the earlier request after the deletion
     answered OK".
   - **Plant `l1f4-5`** (your first): the anonymised refusal removed; L1F4-K12 red, "an anonymised person answered OK".
     Gate `db-l1f4-tutup-gates`, control 4.
   - **Restated with notes:** AKUN-K01 reads the new migration's `akun_tolak`; the migration-count pins 243 → 244.
5. **Lock order for Bob's list:** all three acts take the person row first. They conform (the L1-F2 page's table is the
   list).

PASS or BLOCKED, on the candidate.

**ACCEPTED at `7e42db9690486e82aab45dcdc4fc1ea5ebb68945`** (Sharon PASS; the brief's §0 item 11 at
`2c51a0cca93a47205b8eb25668089e06955cf6af`). **The refusal line is now Daisy's, word for word** (her `KATA-L1-F4.md`
§3 at `2ca5794ddde95897d8b0951c174356ccad59052d`), `akun.tinggal.galat.account_anonymised`:
- ID: «Akun ini tidak dapat dibuka kembali: data pribadi pemiliknya sudah dihapus. Tidak ada yang diubah. Bila orang
  ini ingin memakai PINTAR lagi, ia didaftarkan sebagai orang baru.»
- EN: «This account cannot be reopened: its owner's personal data has been deleted. Nothing was changed. If this
  person wants to use PINTAR again, they are registered as a new person.»

~~**For Daisy, one line:** `akun.tinggal.galat.account_anonymised`, the platform admin's refusal. **Engineer's draft,
yours to replace:** «Akun ini tidak dibuka kembali: data pribadi pemiliknya sudah dihapus. Tidak ada yang diubah.» /
«This account is not reopened: its holder's personal data has been deleted. Nothing was changed.»~~ *(Superseded by
Daisy's final line above.)*

| Column or table | Constraints after this commit | Baseline invariant |
|---|---|---|
| `account_requests` (REOPEN) | `status` set to `DECLINED` with `decided_by`, `decided_at`, `decision_note` by the deletion; unchanged: the kind and status checks, `account_requests_one_open`, L1-F4's guard (a new row for an anonymised person is refused) | **INV-18**: the request's end is kept on the record with who and why |
| `persons` (row lock) | taken `FOR UPDATE` first by the deletion, the reopen and the reinstatement; no column changes beyond the deletion's own | **INV-23** |
| `person_suspensions` | unchanged; read and ended under the person's lock | **INV-17**: a deleted person's closure, and the lock it keeps, is never ended |

## For Sharon: the result review, with your required change (the earlier prompt, on `3a63a2b2`; answered)

**Candidate:** the commit on `claude/system-integrity-4.0` that carries this section, above L1-F2
`e27f4a77a10c7c448170bb2851462e4561daadf7`. Its 40-character hash is in the review queue (TEAM-INSTRUCTIONS.md).
Your interim review: `L1F4-INTERIM-ea3c4b6f1d10a2a01281f16e8cce893235bfbef2.md` on `claude/gracious-lamport-0m1qjr`.

**Please verify:**
1. **Your required change as built** (§4a below): live enrolments and placements with no timestamp; roles, open
   transfers and evaluator grants against the closure's record, written once by `minta_akun` under the person's
   `FOR UPDATE`; the backfill.
2. **The race, your third order, on two real connections** (L1F4-R01, on L1-F2's harness): red on `e27f4a77` as you
   predicted ("the deletion answered OK and the person reads anonymised=true"), green here.
3. **One deviation, on your second plant.** A closure with no record is read as having held nothing, so the deletion
   **refuses** (fail closed). So "remove the record's write" (`l1f4-3`) turns the **held-at-closure** case red
   (L1F4-K10: "the closure recorded nothing", and the deletion is refused), not a role-after-closure case. The plant
   still bites. Please confirm fail-closed is the reading you want.
4. **F38-A05 unchanged.** It passes as before: a teacher's role held at the closure is in the record.

PASS or BLOCKED, on the candidate.

**For Daisy (non-blocking, from her review of `ea3c4b6f`, §2):** her cell line for "earned but not issued" and her
line for the refused replacement are in, word for word. **Her correctness check found a defect, now corrected:** the
summary «… {n} sertifikat baru dapat diterbitkan» counted a certificate that would not be issued to an anonymised
learner. It now does not (L1F4-K11, plant `l1f4-4`; L1F4-K08 restated).

## 4a · Sharon's required change (interim review of `ea3c4b6f`), as built

Migration `20270117170000_a_closure_records_what_it_held.sql`:

- **Why the timestamps were wrong (her finding):** `created_at` and `started_at` are both `now()`, the start of their
  transactions. A grant or an import that began before the closure and inserted after it carried the earlier time,
  was read as history, and the deletion ended a live attachment the school had added after the person closed.
- **Enrolments and placements: no timestamp.** `minta_akun` refuses a closure while an enrolment is `PENDING` or
  `ACTIVE`, under the person's `FOR UPDATE`; the deletion holds the same row `FOR UPDATE`. So any `PENDING` or
  `ACTIVE` enrolment at deletion, or a live placement of one, was gained after the closure, and refuses it.
- **Roles, open transfers, evaluator grants: the closure's record.**
  - `person_suspensions.dipegang_saat_tutup jsonb`: `{"peran": [...], "pindah": [...], "penilai": [...]}`, the ids
    live when the closure was made (`orang_dipegang(person)`, one definition).
  - Written by `minta_akun` in its closure insert, while it holds the person `FOR UPDATE`.
  - **Written once:** `_l1f4_dipegang_saat_tutup_sekali` refuses any update that changes it (42501).
  - CHECK `person_suspensions_dipegang_hanya_tutup`: only on a `CLOSED_AT_REQUEST` row, and only an object with the
    three lists.
  - The deletion refuses on any live row of those kinds whose id is not in the record.
  - **A closure with no record** is read as having held nothing, so the deletion refuses rather than anonymise.
- **Backfill:** every open `CLOSED_AT_REQUEST` row is given what is live at migration time, before the guard exists;
  the migration checks that none is left without one. Staging and production hold no suspension today (Sharon's
  read); locally the seed makes none.
- **The measure is the only change to the deletion.** Its lock, its other checks and what it does when it proceeds
  are unchanged.

| Column or table | Constraints after this commit | Baseline invariant |
|---|---|---|
| `person_suspensions.dipegang_saat_tutup` | New. Nullable; `person_suspensions_dipegang_hanya_tutup`; written once (`_l1f4_dipegang_saat_tutup_sekali`). The table's other constraints unchanged (`person_suspension_end_pairs`, the category check, `person_suspensions_one_open`) | **INV-18**: the closure's record is kept as written; **INV-23**: it reads roles and enrolments, never rewrites them |
| `enrollments`, `memberships`, `role_assignments`, `transfers`, `evaluation_evaluators` | Read only, under the deletion's lock | **INV-23**: append-only history, untouched; **INV-25**: no transfer is changed |
| `key_corrections.outcome` (`sertifikat_baru_layak`) | Its count no longer includes a newly earned certificate of an anonymised person; `sertifikat_tidak_diterbitkan` counts it | **INV-18** (the record says what will happen); §3b Option A |

**Tests (red first on `e27f4a77a10c7c448170bb2851462e4561daadf7`):**

| Id | What | Red first |
|---|---|---|
| L1F4-K09 | A live role, and a pending enrolment, dated before the closure began but not held at it: refused `ACCOUNT_LIVE_ATTACHMENT`, nothing changed | plant `l1f4-2` (the timestamp comparison put back): red, the deletion went through. On base the suite cannot run (no column) |
| L1F4-K10 | The closure records the one role H held; rewriting the record is refused 42501; with only that role live the deletion completes | plant `l1f4-3` (no record written): red, "the closure recorded nothing" |
| L1F4-K11 | A key correction newly earning a certificate for an anonymised learner: the preview reads `0\|1` (can be issued \| earned, not issued) | plant `l1f4-4` (the old count): red, `1\|1` |
| L1F4-R01 | **Your third order, two real connections:** the grant's transaction begins, the closure commits, the grant inserts. The role's `created_at` is earlier than the closure's `started_at`, and the deletion is refused with nothing anonymised. Then the timestamp comparison put back: the same order lets the deletion through | **red on `e27f4a77`:** "the deletion answered OK and the person reads anonymised=true" |

- **The suite `selftest.run_l1f4_tutup()`** holds K09 to K11, on helpers every plant gate loads, so its three plants
  run alone. Gate `db-l1f4-tutup-gates`, control 3 green rows, in CI's red-case group "… l1f2 l1f4t".
- **The harness gains the third order:** `mulaiLebihDulu` in `selftest/balapan.ts` (the first transaction begins
  before the second and writes after it commits), and `gantiFungsi` for a plant around a race.
- **Restated with notes:** L1F4-K08 (its fixture check read the count that is now corrected: it reads both counts
  together, and expects the anonymised learner's certificate not counted as one that can be issued); the
  migration-count pins 240 → 241.

## What holds now

- **Built** in migration `20270117130000_an_anonymised_person_is_given_nothing_new.sql`. Tests are in the new suite
  `selftest/db/l1f4.sql` (L1F4-E01, K01–K08), red first on `bc67f72a0e1c6bc39a2c16292f728080b12710d4`.
- **Two readings for Sharon:**
  - the deletion's refusal counts only attachments **gained after the closure began** (§4);
  - "earned but not issued" is shown in the confirmer's preview, and kept in the record as a count (§5).
- **Now (12 Nov):** Sharon's required change and her race test are built (§4a). L1-F4 waits on her result review.
  The next bullet is the record of what was owed.
- **Not accepted yet (owner, `ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 8):** L1-F4 is accepted only when its race
  test passes on two real connections. That test is built with L1-F2's, sharing its two-connection harness. Sharon
  also verifies the line between historical attachments and new live ones (§4).
- **For Daisy:**
  - her final refusal line is used without `{sekolah}`;
  - her "earned but not issued" line is in as her draft;
  - a new line for the certificate replacement's refusal (`CERT_HOLDER_DELETED`) is the engineer's draft.

## 1 · The guard (Sharon §3a.1)

- **One predicate:** `orang_dianonimkan(person)` takes `FOR SHARE` on the person's row and reads `anonymized_at`.
  `hapus_data_pribadi` holds the same row `FOR UPDATE`, so whichever comes second waits and sees the first.
- **Several triggers:** one BEFORE INSERT trigger per guarded column, each calling the predicate.
  - A refused insert is `PR040 PERSON_UNKNOWN` ("no such person").
  - The triggers are named `_l1f4_…`, so they fire before any other trigger on the table.
  - INSERT only: an UPDATE that ends or closes a row is not caught (L1F4-K07).
- **Completeness is kept by a registry and a test:**
  - `public.orang_lampiran` classifies every foreign key to `persons(id)`, 110 today, plus the three attaching
    columns that reach a person another way. Each row is DIJAGA (guarded) or BEBAS (exempt, with its reason).
  - L1F4-E01 fails on any unclassified foreign key, and on a guarded column without its trigger.
  - The plant `l1f4-1` adds a table with an unclassified foreign key, and E01 goes red. It is in CI's red-case group
    "db · bob37 bob24 bob39 bob04 fable04 l1f4".

**Guarded (31):**
- **Standing:** enrolments, places in a class (through the enrolment), roles, institutional identities, transfers,
  portable visibility, the evaluator grant, evaluation personas, the platform's first administrator.
- **Ways to sign in:** accounts (cards included), activation grants, recovery grants and password permits (through
  the account), PINs and their replacement records, usernames, email corrections, card reissues and conversions.
- **Account requests:** a reopening would revive a deleted identity.
- **New evidence and credentials:** sittings, lesson progress, attempt grants, lesson review requests, certificates
  and their identity snapshots.
- **Records about the person:** feedback requests and cycles about them, management decisions about them, their tour
  state, their support reports.

**Exempt (82), each with its reason in the registry:**
- every **actor** column (who authorised, decided, reviewed, authored or ended something): an anonymised person can't
  sign in to act, and copies carry authors forward;
- `assessment_results`: a governed key correction supersedes their result;
- `person_suspensions`: a restriction, which narrows;
- `import_rows`: a request, answered as an unknown id; what it would attach is guarded;
- `certificate_number_counters`: a sequence, not a credential;
- `audit_log`'s actor.

## 2 · The paths answer as for an unknown id (§3a.2)

| Path | As built | Test |
|---|---|---|
| Intake: `import_row_problems`, so `import_validate` and `import_advance` | An anonymised person is "a person you may not name", the unknown id's finding word for word. A row validated before the deletion fails alone when it advances, and the rest of the batch proceeds | L1F4-K01: the former school, an unrelated school and the platform each get exactly the unknown finding. Red before: "already holds an institutional identity here" |
| Return: `daftarkan_kembali` | `PR070 PLACE_NOT_THIS_SCHOOL`, the unknown id's refusal | L1F4-K02. Red before: `ENROL_NOT_DEPARTED` |
| Departed learners: `murid_keluar` | An anonymised learner is not listed | L1F4-K03. Red before: listed |
| Credential paths (activation, cards, email correction, PIN, username, recovery) | The guard refuses the insert; the routes already answer without the database's sentence | L1F4-K04, every guarded column |

**Who can see an anonymised person's id (§1's "not verified"):**
- A school with no relationship can't read the person (`person_visible_to_me` is false; K01). Its intake row looks
  exactly like an unknown id.
- The former school can still see the record under the PINTAR ID. That is accepted (Sharon §3a.2); nothing new
  attaches.

## 3 · Certificates (§3a.4, §3b Option A, the owner's ruling)

- **A new certificate:** `certificate_prepare` answers "not eligible: the holder's personal data was deleted" before
  anything is written. One already issued is still returned as before. The issue route already treats "not eligible"
  as nothing to show.
- **A replacement (W2.22):** `sertifikat_koreksi_siapkan` refuses `CERT_HOLDER_DELETED`. INV-30 keeps
  `name_as_issued`.
- **Newly earned by a key correction:** earned but not issued, with no certificate row.
  - The confirmer's preview marks the sitting's row `sertifikat_tidak_diterbitkan`, and the screen shows Daisy's draft
    line in the certificate column.
  - The confirmed correction's outcome keeps a count, `sertifikat_tidak_diterbitkan`, beside `sertifikat_baru_layak`.
    The outcome keeps counts, not the per-sitting list.
  - Tested by L1F4-K05 and K08. Red before: a new certificate was issued to an anonymised holder, and a replacement
    went through.

## 4 · The deletion refuses on a live attachment (§3a.3), and the holding state

- *(Superseded by §4a, Sharon's required change: how "gained after" is measured. The line drawn below stands; the
  timestamp measure does not.)*
- **As built:** under its lock on the person, `hapus_data_pribadi` refuses `PR140 ACCOUNT_LIVE_ATTACHMENT`. It does so
  when the person **gained**, after their closure began, any of these:
  - a live enrolment;
  - a role;
  - a place in a class;
  - an open transfer;
  - an evaluator grant.

  Nothing is changed and the request stays open. The platform admin sees Daisy's final line,
  `akun.tinggal.galat.account_live_attachment`; the school isn't named, and the kind of attachment never is.
- **Why "gained after the closure" (for Sharon):**
  - Closure ends no school role, so a teacher's own role is still live at deletion. F38-A05 deletes exactly such a
    teacher, and B1-S02 relies on it.
  - Refusing on every live role would stop every teacher's deletion. Her point is the race: an attachment that
    arrived after the person closed, and so may mean they came back to a school.
  - What the person held at the closure is the closure's own state, and the deletion keeps it as before.
  - ~~"After" is strict: in one transaction both instants are equal.~~ *(Superseded by §4a: no timestamp is compared.)*
- **The holding state:**
  - A person who closed their account and asked for deletion, then gained an enrolment or a role, has an open deletion
    request and a live attachment at once.
  - The request stays open and nothing is deleted until the school ends the attachment.
  - It is not resolved automatically in either direction: only the person and the school know which of the two is the
    mistake.
- **Test, L1F4-K06:**
  - with a role gained after the closure: refused; the person, their roles and the request unchanged;
  - once the school ends that role: the deletion completes, the role held at the closure is kept, and every role and
    number is byte-identical.
  - Red before: the deletion went through.

## 5 · What still writes about an anonymised person (§3a.4: the guard refuses new attachment and nothing else)

- **The deletion's own steps,** updates ending enrolments, roles and placements, audit rows and the purge: none is
  an insert into a guarded column (K07 for the updates).
- **A governed key correction's superseding result:** `assessment_results` is exempt.
- **A certificate review's decision, and a revocation:** updates.
- **B1's clearing of origin and hash:** an update.

## 6 · Tests, red first on `bc67f72a0e1c6bc39a2c16292f728080b12710d4`

| Test | On `bc67f72a` | With the fix |
|---|---|---|
| L1F4-E01 the registry | red: no registry | green |
| L1F4-K01 intake, three readers | red: the former school and the platform got "already holds" | green |
| L1F4-K02 return | red: `ENROL_NOT_DEPARTED` | green |
| L1F4-K03 departed list | red: still listed | green |
| L1F4-K04 every guarded column | red: nothing guarded | green: 31 of 31 refuse the anonymised person, and none refuses a live one as unknown |
| L1F4-K05 certificates | red: a new certificate issued; a replacement went through | green |
| L1F4-K06 the deletion | red: the deletion went through | green |
| L1F4-K07 INSERT only | green, by nature: it guards against the trigger reaching updates | green |
| L1F4-K08 earned, not issued | red: no mark | green: the preview row, and the outcome count 1; no certificate row |
| Plant `l1f4-1` | — | L1F4-E01 red for `l1f4_tanam.orang` |

**Restated, with notes:**
- **AKUN-K01 and W222-K01** now read the newest definition of `akun_tolak` and `sertifikat_koreksi_tolak` across their
  first file and this one, which defines both in full with the new codes.
- **CI-W03's** list of red cases gains `db-l1f4-gates`.
- **The migration-count pins** move from 236 to 237.

The plant harness loads `l1f4.sql`, whose registry check `selftest.run_l1f4_registry()` needs no fixture.

~~**Not built, recorded:** Sharon's race test 4 on two real connections. The attachment-first order is shown here on
one connection, with the closure backdated (K06). The two-connection proof needs A1's two-connection pattern, and goes
with L1-F2's race test, which needs the same.~~ *(superseded by the owner's instruction, `ANONYMISED-PERSON-IS-TERMINAL.md`
§0 item 8: the two-connection race test is required before acceptance, and the one-connection demonstration does not
stand in for it. It is built with L1-F2's.)*

## 7 · The four questions

| Question | Answer |
|---|---|
| And then what? | A school that names the id sees the ordinary "not found". A returning person is enrolled as new, with no history: a row without a person id creates a new person, and nothing in that path looks the old one up |
| What else did that change? | Imports already validated but not yet advanced (the row fails alone, as an unknown id). The departed-learners list. Transfers in flight at the deletion (an open transfer gained after the closure stops it). Certificates (none new; a replacement refused; a correction's newly earned one recorded, not issued). Counts that include departed people are unchanged: nothing is removed |
| What happens when things go wrong? | The race: the guard's `FOR SHARE` against the deletion's `FOR UPDATE`. If the deletion runs first, the attachment waits and is refused. If the attachment runs first, the deletion waits and refuses `ACCOUNT_LIVE_ATTACHMENT`. A batch import with one such row: that row fails as an unknown id, and the rest proceed |
| Can it be reversed, and what survives? | Deletion is irreversible by policy, and now in fact. What survives is the historical record under the PINTAR ID, and nothing can be added to it |

## 8 · Next state of each consequential action (SYSTEM-INTEGRITY-4.1 §3a)

| Action | Kind | Work in progress | Completed work and history | People and institutions affected | Reversed or repeated | Permission, explanation, confirmation, audit |
|---|---|---|---|---|---|---|
| Delete personal data, with an attachment gained since the closure | Refused, nothing changed | The request stays open | Untouched | The platform admin is told to ask the school; the school learns nothing from the refusal | Pressed again once the school ends the attachment; it completes | Unchanged: platform admin only; Daisy's line explains |
| Attach anything new to an anonymised person | Refused | — | Untouched | The school sees an unknown id | Never | No audit row: nothing happened |

## 9 · Cross-module inventory (SYSTEM-INTEGRITY-4.1 §2)

| Interface | Checked how | Evidence | Limitation |
|---|---|---|---|
| Every table with a foreign key to persons | Classified; guarded columns triggered | L1F4-E01, plant l1f4-1 | — |
| Intake, return, departed list | Unknown-id answers compared | K01–K03 | Compared in the database; the routes already answer without the database's sentence |
| Credentials and standing | Every guarded column | K04 | — |
| Certificates and key corrections | Not issued; replacement refused; earned, not issued | K05, K08 | — |
| Deletion | Refusal on a gained attachment; completion; history; the closure's record | K06, K09, K10, F38-A05, B1-S02, R01 | — *(was: race on two connections, with L1-F2's; done, R01)* |
| Everything else | The whole suite | the pre-flight | — |
