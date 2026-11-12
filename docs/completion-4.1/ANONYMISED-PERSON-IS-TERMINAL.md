# An anonymised person is terminal · small correction (L1-F4)

> **Coordination record.** Owner's decision of 12 November 2026: **approved.** Kept by the Chief Architect. A
> separate, bounded correction of existing 4.0 behaviour, **before Z**, subject to Sharon's pre-implementation
> review. It does not expand or hold L-1, L1-F2, F-1 or B2. It is not a batch and changes no part of THE PLAN.

## 0 · What holds now

1. **Principle (owner).** An anonymised person is terminal for new identity attachments. A returning individual
   receives a **new** person identity, without reconnecting their anonymised record or their historical learning
   evidence.
2. **P-1 needs no implementation change** beyond its guarding test (that test is taken with L1-F2's lock trigger).
3. **Sharon reviews the design before anything is built,** and is asked to verify four things (§3).
4. State: **awaiting Sharon's pre-implementation review.** Not started. The engineer's three tests of today's
   behaviour are evidence for this page and may be written at any time.

## 1 · The defect

Found by the engineer's examination for `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §5b; set out in full in its §5c.

- PINTAR stores no school-issued number, so nothing is matched by number, and a row without a person id creates a new
  person.
- **But** an import row may name an existing person by their PINTAR-issued id, and neither `import_validate` nor
  `import_advance` looks at `anonymized_at`. From another school that can see the person, or from a platform admin,
  it attaches to the same `persons.id`: a new number, a pending enrolment, the history back under a live enrolment.
- `daftarkan_kembali` and `murid_keluar` do not check anonymisation either.
- Not verified: which screens would show the earlier history; which schools can see an anonymised person's id.
- Exposure today: none on staging (no anonymised person, read-only count of 12 Nov); production has no deletion
  function. Latent.

## 2 · Design direction (for Sharon's review; the engineer proposes the exact objects)

1. **Central enforcement in the database.** One guard where attachments are made: an insert that would attach a new
   enrolment, role assignment, account, card or institutional identity to a person with `anonymized_at` set is
   refused, on the pattern of the account-link trigger in `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §2a. The engineer lists
   every table through which a person acquires a new standing in a school or a new way to sign in; that list is the
   guard's scope and is on the page.
2. **Indistinguishable from outside.** Each path answers as for a person who does not exist: `import_validate`
   reports the row as it reports an unknown person id; `daftarkan_kembali` gives its ordinary refusal;
   `murid_keluar` does not offer an anonymised person. Status, code, wording and the import's finding are those of
   the unknown case, so that nothing tells a school the id belonged to someone who asked to be deleted.
3. **A returning individual is a new person.** A row with no person id already creates one. The page shows that
   nothing in that path looks up, and nothing could look up, the anonymised record.
4. **History and bookkeeping are untouched.** Sealed results, responses, certificates, audit rows and the rows kept
   under the PINTAR ID stay exactly as they are. Only **new** attachment is refused.
5. **Bounded.** No change to how deletion is requested, decided or performed.

## 3 · What Sharon is asked to verify (owner's instruction)

| # | Point | The question |
|---|---|---|
| 1 | **Central database enforcement** | Is the guard in one place that every present and future attaching path must pass, and is its scope (the list of tables) complete? |
| 2 | **Indistinguishable external responses** | For each path, are the response and any stored finding identical in every field to those for an unknown person id? As in L-1, compared directly, not by code alone |
| 3 | **Concurrency between anonymisation and attachment** | An attachment and `hapus_data_pribadi` racing each other, in both orders, on two real connections: can an attachment commit after the person is anonymised, or be read as valid by the deletion? Which row is locked, and by whom first? |
| 4 | **Legitimate historical records and deletion bookkeeping** | What must still write to, or about, an anonymised person: the deletion's own steps, the ending of open enrolments and roles, audit rows, the purge, a governed key correction that supersedes a past result of theirs, a certificate review? The guard must refuse new attachment and nothing else |

## 4 · The four questions

| Question | To answer on the page |
|---|---|
| And then what? | A school that names the id sees the ordinary "not found". A returning person is enrolled as new and starts with no history |
| What else did that change? | Imports already validated but not yet advanced that name such a person; lists and pickers that offer departed people; transfers in flight at the moment of deletion; any report or count that includes departed people |
| What happens when things go wrong? | The race of §3 row 3. A batch import with one such row: that row is refused, the rest proceed as they do for any unknown id |
| Can it be reversed, and what survives? | Deletion is irreversible by policy, and this makes it so in fact. What survives is the historical record under the PINTAR ID, and nothing can be added to it |

## 5 · Tests (red first)

- An import naming an anonymised person, from another school and from the platform: refused as an unknown id. Red
  today: it attaches.
- `daftarkan_kembali` on an anonymised learner: its ordinary refusal. `murid_keluar` does not list them.
- Each direct attachment in the guard's scope: refused.
- Each response compared field by field with the unknown-id case.
- The race, both orders, on two connections.
- Deletion itself still completes, with every bookkeeping step, on a person with open enrolments and roles.
- A governed key correction on an anonymised person's past sitting still supersedes the result (C1w), and a
  certificate review still runs.
- A new person with the same name is created normally and has no history.
- Every historical row byte-identical before and after.

Pre-flight of THE PLAN §4.1 in full. The page carries the inventory and the next-state row
(`SYSTEM-INTEGRITY-4.1.md` §2, §3a).

## 6 · Review and order

- **Sharon, before implementation,** on §2 and §3. Then one result review on the exact commit.
- **Daisy:** only if a screen or wording changes (for example, the departed-learners list).
- **When:** its own commit, at any boundary before Z. It gates nothing and waits for nothing but Sharon's review.

## 7 · Log

| Date (UTC) | Entry |
|---|---|
| 12 Nov 2026, 07:30 | Owner approved the principle and a separate bounded correction, with four points for Sharon to verify. Brief written. Awaiting her pre-implementation review |
