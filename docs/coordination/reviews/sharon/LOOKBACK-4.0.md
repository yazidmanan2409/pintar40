# Look-back · did 4.0 leave something foundational that makes 4.1 harder? · Sharon, 13 Nov 2026

From my own record only: this folder, `ANTICIPATION-2026-11-12.md`, and the blocks I raised. Read-only.

**1 · The 4.1 defects and blocks I raised, classed:** (i) inherited from 4.0: **7**; (ii) new 4.1 complexity: **5**;
(iii) a process or tooling mistake: **7**.

The 7 inherited from 4.0:
- **L-1:** the 4.0 lock wrote `'infinity'`, which Auth could not read, and recovery grants were not checked at use.
- **L1-F2:** a 4.0 suspension locked only accounts that already existed.
- **L1-F2's second cycle:** 4.0's `auth_card_email_guard` writes `accounts` from inside Auth's write to `auth.users`.
- **L1-F4:** 4.0 anonymisation was not terminal, so an import could re-attach the person.
- **L1F4-A1:** 4.0's `hapus_data_pribadi` checked the closure before taking the lock, and `buka_kembali_akun` never
  took the person row.
- **L1F4-A2:** 4.0's reopen did not check for anonymisation.
- **F1-R1b's held revision:** 4.0 validates content at the entry paths (editor, upload), not at the status step.

The 5 new to 4.1:
- **F-1:** C1w's key correction and the views that still read the sealed key.
- **L1-F2's first cycle:** two 4.1 corrections meeting (an issuer, then L1-F4's guard).
- **L1-F4's timestamp measure.**
- **B2-R-S1:** two readers of one selection.
- **A2a's 28 readers of a window's schools:** R-1's new class scope on a 4.0 schema.

The 7 process or tooling mistakes:
- three checkpoint-script blocks: no clean-up on stop; cancel and timeout; recovery against preservation;
- my race plants that could not bite;
- my reading that L's removal exercised item 4's `auth` writes;
- my "no RLS" wording;
- the runner port fault.

**2 · A recurring 4.0 source: yes, one.**

**The account lifecycle.** A person's state is spread across five places, and each writer checks it its own way:
- `persons.anonymized_at`;
- an open `person_suspensions` row, which is the lock;
- `accounts`;
- `auth.users.banned_until`, a copy in a schema Auth owns;
- triggers on `auth.users` that write back into `accounts`.

Before L1-F2 there was no lock-order discipline. **Evidence: all 7 of the inherited items, and 4 of the 5 new ones,
touch suspend, close, reopen, delete or attach.** Each was one more writer that missed one state or one lock.

**Rejected as a source:**
- **Security-definer functions as the only write path.** They are what kept every fix to one function.
- **Audit and preservation against deletion.** One collision only (a recovery against line 44), and that was
  operational.

**Partly confirmed: testability.**
- 4.0 had **no two-connection test harness**, so every race (A1, the three lock cycles) was invisible to CI.
  `selftest/balapan.ts` now exists.
- Three behaviours could only be proven hosted: GoTrue honouring `banned_until`, the insert path inside GoTrue's own
  insert, and `pg_cron` `CALL`ing a committing procedure. Today's probes proved all three; that is a one-time cost.

**3 · The smallest correction.**
- One structural test over the catalogue: **every function that locks or writes `persons`, `auth.users`, `accounts`
  or `person_suspensions` takes them in the order persons → `auth.users` → accounts.**
- Today L1R2-S02 covers five named functions only.
- It goes **inside A2a**, beside its writer enumeration: A2a adds the fence after accounts, and A3 changes the
  suspension and recovery paths. It is not a separate cycle. Nothing else needs to change before A2a.

**4 · "Increasing failures across phases".**
- **4.0: I have no per-batch counts.** My 4.0 verdicts were relayed by the owner into Bob's pages. One 4.0 review is
  in this folder (`D-101`).
- **4.1, 12–13 Nov, product code:**
  - B2 and F1-R1b passed their first result review;
  - L-1, F-1 and L1-F2 were each blocked once;
  - L1-F4 was blocked twice: its interim measure, then A1 and A2.
  - Of those 5 blocks, 4 are account lifecycle, 3 of them inherited from 4.0.
- **The checkpoint tooling** was blocked twice, plus one consolidated list. That is the only place blocks repeated on
  one artefact.
- **So my record does not support "increasing failures" in the product code.** It shows failures concentrated in one
  4.0 area (account lifecycle) and in one 4.1 operation (the checkpoint script). Both are now closed.
