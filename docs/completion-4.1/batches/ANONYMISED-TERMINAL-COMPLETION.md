# L1-F4 · An anonymised person is terminal: completion page

**A bounded correction of 4.0 behaviour, before Z** (`ANONYMISED-PERSON-IS-TERMINAL.md` on `claude/bob-41-master-plan`
at `f2861db1576eae3eb9e7e0728ea37ec1dde94d7d`: §0, §3a Sharon's four points, §3b the owner's Option A, §3c Daisy's
wording). It gates nothing. Review: Sharon on the exact commit; Daisy for the deletion's refusal line, the "earned but
not issued" line (a draft) and one more draft line (below).

## What holds now

- **Built** in migration `20270117130000_an_anonymised_person_is_given_nothing_new.sql`. Tests are in the new suite
  `selftest/db/l1f4.sql` (L1F4-E01, K01–K08), red first on `bc67f72a0e1c6bc39a2c16292f728080b12710d4`.
- **Two readings for Sharon:**
  - the deletion's refusal counts only attachments **gained after the closure began** (§4);
  - "earned but not issued" is shown in the confirmer's preview, and kept in the record as a count (§5).
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
  - "After" is strict: in one transaction both instants are equal.
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

**Not built, recorded:** Sharon's race test 4 on two real connections. The attachment-first order is shown here on
one connection, with the closure backdated (K06). The two-connection proof needs A1's two-connection pattern, and goes
with L1-F2's race test, which needs the same.

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
| Deletion | Refusal on a gained attachment; completion; history | K06, F38-A05, B1-S02 | Race on two connections: with L1-F2's |
| Everything else | The whole suite | the pre-flight | — |
