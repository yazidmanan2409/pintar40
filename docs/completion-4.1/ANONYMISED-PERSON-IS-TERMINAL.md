# An anonymised person is terminal · small correction (L1-F4)

> **Coordination record.** Owner's decision of 12 November 2026: **approved.** Kept by the Chief Architect. A
> separate, bounded correction of existing 4.0 behaviour, **before Z**, subject to Sharon's pre-implementation
> review. It does not expand or hold L-1, L1-F2, F-1 or B2. It is not a batch and changes no part of THE PLAN.

## 0 · What holds now

1. **Principle (owner).** An anonymised person is terminal for new identity attachments. A returning individual
   receives a **new** person identity, without reconnecting their anonymised record or their historical learning
   evidence.
2. **P-1 needs no implementation change** beyond its guarding test (that test is taken with L1-F2's lock trigger).
3. **Sharon's pre-implementation review: PASS on the design** (read at
   `54de9d9235834678492f6b56ff2d4d4102a12dcd`), **with four required design points** (§3a). Where they differ from
   §2, they govern.
4. **The guard covers new credentials as well as new standing,** and is INSERT-only.
5. **The deletion refuses when a live attachment exists** (the race of §3a point 3). This is the one place the
   correction touches how a deletion runs; it is a guard against a race, not a change of the deletion's rules.
6. **A certificate newly earned by an anonymised person (owner, 12 Nov 2026: Option A).** A governed key correction
   may establish that an anonymised person earned certification. That outcome is recorded accurately in the
   historical review as **earned but not issued**. No new certificate is created, and no anonymised identity is
   restored to issue one.
7. State: **built by the engineer; committed locally at `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2`, in pre-flight,
   not pushed** (as of 05:49 UTC, 12 Nov).
8. **Two instructions from the owner for its review (12 Nov 2026):**
   - **Sharon verifies the distinction between historical attachments and new live attachments.** As built, the
     deletion's refusal counts only attachments gained after the closure began, because closure leaves school roles
     in place and every teacher's deletion would otherwise be refused. She confirms where that line is drawn, that a
     role or enrolment held from before the closure is correctly treated as history to be ended by the deletion's
     bookkeeping, and that one gained after it is a live attachment that refuses the deletion.
   - **The two-connection race test is required before final acceptance.** It is not built yet; the engineer plans
     to build it with L1-F2's race test, and sharing that infrastructure is acceptable. **L1-F4 is not accepted
     until it passes.** The one-connection demonstration on the page does not stand in for it.

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

## 3a · Sharon's four required design points (these govern)

**1 · Central enforcement and its scope.**
- **One predicate, several triggers.** "One place" cannot be one trigger, because attachments go into several
  tables. One guard function, `orang_dianonimkan(person)`, called by a BEFORE INSERT trigger on each attaching table.
- **Completeness is kept by a test, not by a list on a page.** Every table with a foreign key to `persons(id)` is
  classified as guarded or exempt, with a reason. An unclassified table fails the test, so a table added later
  cannot slip past. A plant that adds such a table unclassified turns the test red.
- **Scope covers new credentials, not only new standing.** At least:
  - standing: enrolments, role assignments, institutional identities, transfers, portable visibility;
  - ways to sign in: accounts (including cards), activation grants, recovery grants and codes, new or reset PINs,
    usernames, email corrections, card reissues and conversions.
- **INSERT only.** UPDATEs that end or close existing rows are not attachments and must not be caught.

**2 · Indistinguishable responses.**
- Each path gives the unknown-id answer, compared field by field with it, including `import_validate`'s stored
  finding.
- **Who can see an anonymised person's id** (§1's "not verified"), to be verified on the page:
  - a school that once held the person can already see the record under the PINTAR ID; to that school the
    anonymisation is visible anyway, which is accepted. The requirement there is only that nothing new attaches;
  - a school with no relationship must not be able to read the id at all, and its import naming that id must look
    exactly like an unknown id.

**3 · Concurrency.**
- The guard takes `FOR SHARE` on the person's row before reading `anonymized_at`; `hapus_data_pribadi` already holds
  that row `FOR UPDATE`. Deletion first: the attachment waits, sees `anonymized_at`, and is refused. Attachment
  first: the deletion waits.
- **Required: the deletion, under its lock, refuses when a live attachment exists.** Otherwise, in the
  attachment-first order, it would anonymise a person who has just gained a live enrolment or role. Closure already
  requires no live enrolment (`minta_akun`), but nothing re-checks at deletion time. Refuse with a designed code the
  platform admin sees; refusing is simpler than ending the attachment as bookkeeping, and preserves evidence.
- **Lock order:** `import_advance` takes the school, then the person; the deletion takes its request, then the
  person, and never the school. No cycle.

**4 · Historical records and deletion bookkeeping.**
- **Allowed** (each corrects or closes what exists; none adds standing): the deletion's own steps; UPDATEs ending
  enrolments, roles and placements; audit rows and the purge; a governed key correction's superseding result (C1w); a
  certificate review's decision, and a revocation; B1's clearing of origin and hash.
- **Refused:** a certificate replacement (W2.22) for an anonymised person. It would issue a new credential under the
  PINTAR ID, and INV-30 keeps `name_as_issued` as it was.

**Her tests, beyond §5:**
1. The enumeration test, with its plant of an unclassified table.
2. Each credential path in scope refused as unknown: activation grant, recovery grant or code, PIN reset, username,
   email correction, card reissue or conversion.
3. The two kinds of school, each compared with the unknown case.
4. The deletion race, attachment first, on two real connections: the deletion is refused and nothing is anonymised.
5. A certificate replacement for an anonymised person: refused. A key correction's newly earned certificate follows
   the owner's ruling (§3b).
6. The deletion still completes on a person with no live attachment; every historical row byte-identical.

**Chief Architect's notes.**
- The deletion's new refusal is seen by the platform admin. **Its wording is Daisy's**, and it is the one screen
  consequence of this correction, so she reviews that line.
- §5's test "a certificate review still runs" stands. Its outcome for a newly earned certificate waits for §3b.

## 3c · Daisy's wording (final for the refusal; draft for the review line)

Her record: `docs/coordination/ux/completion-4.1/KATA-L1-F4.md` on `ux-1/daisy-experience` at
`fd226de5c9df769e6537982b98297ec8fce8ad36`.

**The deletion refused on a live attachment** (`akun.tinggal.galat.account_live_attachment`; platform admin,
Konfigurasi › Keamanan, beside «Hapus data pribadi»). **Final.**

- ID: «Data pribadi tidak dihapus: orang ini masih memegang pendaftaran, peran, atau keterkaitan lain yang berlaku di
  sebuah sekolah. Tidak ada yang diubah, dan permintaannya tetap terbuka. Tanyakan kepada sekolah itu apakah
  keterkaitan tersebut memang harus diakhiri; setelah diakhiri, tekan «Hapus data pribadi» sekali lagi.»
- EN: «Personal data was not deleted: this person still holds an enrolment, role or other attachment in force at a
  school. Nothing was changed, and the request stays open. Ask that school whether the attachment should end; once it
  has ended, press «Delete personal data» once more.»
- **Why "ask the school":** the refusal fires when someone gained an enrolment or role after the account was closed,
  which may mean the person has come back to a school. The platform admin should not end a school's enrolment so that
  a deletion goes through.
- **Naming the school is optional:** if it is cheap to supply, use `{sekolah}` («… di {sekolah}. … Tanyakan kepada
  {sekolah} …» / «… at {sekolah}. … Ask {sekolah} …»). Do not name the kind of attachment unless it is certain.

**Earned but not issued** (on the certificate review). **Draft; she confirms after seeing the screen.**

- ID: «Memenuhi syarat sertifikat setelah koreksi kunci, tetapi tidak diterbitkan: data pribadi orang ini sudah
  dihapus.»
- EN: «Met the certificate's requirements after the key correction, but not issued: this person's personal data has
  been deleted.»
- The screen settles: where the line sits; whether the row already shows the PINTAR ID in place of a name; and that
  no «Terbitkan» action is offered on that row. A screenshot or the commit is enough.

**Chief Architect's note, from her reasoning.** Her "ask the school" names a state worth stating on the engineer's
page: a person who closed their account and asked for deletion, then gains an enrolment, has an **open deletion
request and a live attachment at once**. The request stays open and nothing is deleted until the school ends the
attachment. That is the right holding state. It is not resolved automatically in either direction, because only the
person and the school know which of the two is the mistake.

## 3b · For the owner: a certificate newly earned by an anonymised person

A governed key correction can raise a past result so that a certificate is newly earned. C1w's rule is that "one
newly earned is issued by the usual path". This correction's rule is that nothing new attaches to an anonymised
person. For such a person the two conflict.

| Option | Consequence |
|---|---|
| **A. Do not issue it; record it on the review as earned but not issued (Sharon's recommendation; the Chief Architect agrees)** | The corrected result stands and the record shows the certificate was earned. No credential is created for an identity that no longer exists. Consistent with refusing a replacement |
| B. Issue it under the PINTAR ID | A new credential attaches to a deleted identity, bearing no name the person can use, contrary to the principle just approved |

**Decided (owner, 12 Nov 2026): Option A.** See §0 item 6, which governs. The test: a key correction that makes a
certificate newly earnable for an anonymised person supersedes the result, records the review as earned but not
issued, creates no certificate row, and leaves every existing record byte-identical; the same correction for a person
who is not anonymised still issues by the usual path.

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
| 12 Nov 2026 | Owner approved the principle and a separate bounded correction, with four points for Sharon to verify. Brief written. Awaiting her pre-implementation review |
| 12 Nov 2026 | Sharon: PASS on the design with four required points and six tests (§3a). Released to the engineer. One question put to the owner (§3b). The deletion's new refusal needs Daisy's wording |
| 12 Nov 2026 | Owner: Option A. Earned but not issued, recorded on the review; no certificate created; no identity restored. No open decision remains on this correction |
| 12 Nov 2026 | Daisy's wording for the deletion refusal (final) and a draft for "earned but not issued" recorded (§3c) |

> **Correction to this log (12 Nov 2026, 03:45 UTC, read from the clock).** Entries dated 12 Nov after 01:45 UTC carried times that were estimated, not read from a clock, and several were later than the actual time. Those times have been removed. The order of the entries is correct.
| 12 Nov 2026 (05:49 UTC) | Built; local commit `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2`. Owner: Sharon verifies historical against new live attachments; the two-connection race test must pass before final acceptance |
| 12 Nov 2026 (10:18 UTC) | **Daisy: PASS on `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2`** (`ux-1/daisy-experience` at `a13f30ff4fe0bd53727d7af219068d35d0b1b0ae` (`TINJAUAN-F1R1B-97a40ebb.md`)), non-blocking changes: the "earned but not issued" line sits in a table cell of the key correction's impact table, so it becomes «Memenuhi syarat, tidak diterbitkan: data pribadi sudah dihapus» / «Requirements met; not issued: personal data deleted»; the refused replacement becomes «Sertifikat ini tidak dapat diganti: data pribadi pemiliknya sudah dihapus. Sertifikat yang sudah terbit tetap seperti adanya. Tidak ada yang diubah.» (the draft's «atas permintaannya» is not always true). **One correctness check she raised for the engineer:** the summary above that table, «… {n} sertifikat baru dapat diterbitkan», must not count a certificate that will not be issued. **Still required before acceptance: the two-connection race test, and Sharon's result review** |
