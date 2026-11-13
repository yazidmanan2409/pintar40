# Look-back · did 4.0 leave something foundational that makes 4.1 harder? · Sharon, 13 Nov 2026

From my own record only: this folder, `ANTICIPATION-2026-11-12.md`, and the blocks I raised. Read-only.

**1 · The 4.1 defects and blocks I raised, classed: 7 inherited from 4.0, 5 new to 4.1, 7 process or tooling.**
- **Inherited from 4.0 (7):**
  - L-1: the `'infinity'` lock that Auth could not read, and recovery grants not checked at use.
  - L1-F2: suspension locked only accounts that already existed; and 4.0's `auth_card_email_guard` writes `accounts` from inside Auth's write to `auth.users` (the second cycle).
  - L1-F4: anonymisation was not terminal.
  - L1F4-A1: `hapus_data_pribadi` checked the closure before the lock, and `buka_kembali_akun` never took the person row.
  - L1F4-A2: reopen did not check for anonymisation.
  - F1-R1b: content checked only at the entry paths, not at the status step.
- **New to 4.1 (5):** F-1 (C1w's key correction against views on the sealed key); L1-F2's first cycle (two 4.1 corrections meeting); L1-F4's timestamp measure; B2-R-S1 (two readers of one selection); A2a's 28 readers (R-1's class scope on a 4.0 schema).
- **Process or tooling (7):** three checkpoint-script blocks (no clean-up on stop; cancel and timeout; recovery against preservation); my race plants that could not bite; my reading of L's removal against item 4; my "no RLS" wording; the runner port fault.

**2 · A recurring 4.0 source: yes, one. The account lifecycle.**
- A person's state is spread over five places: `persons.anonymized_at`; an open `person_suspensions` row; `accounts`; `auth.users.banned_until`; and triggers on `auth.users` that write back into `accounts`. Each writer checked it its own way, and before L1-F2 there was no lock order.
- Evidence: all 7 inherited items and 4 of the 5 new ones touch suspend, close, reopen, delete or attach.
- **Rejected:** security definer as the only write path (it kept each fix to one function); audit and preservation against deletion (one collision, and it was operational).
- **Partly confirmed: testability.** 4.0 had no two-connection harness, so every race was invisible to CI; `selftest/balapan.ts` now exists. Three behaviours were provable only hosted; today's probes proved all three, a one-time cost.

**3 · The smallest correction.**
- One catalogue test: every function that locks or writes `persons`, `auth.users`, `accounts` or `person_suspensions` takes them in the order persons → `auth.users` → accounts. Today L1R2-S02 covers five named functions only.
- It goes **inside A2a**, beside its writer enumeration, because A2a adds the fence and A3 changes suspension and recovery. It is not a separate cycle. Nothing else needs to come first.

**4 · "Increasing failures across phases": not supported for product code.**
- **4.0:** I have no per-batch counts. Those verdicts were relayed by the owner into Bob's pages; only `D-101` is in my folder.
- **4.1 product code:** B2 and F1-R1b passed first time. L-1, F-1 and L1-F2 were each blocked once, and L1-F4 twice. Of these 5 blocks, 4 are account lifecycle, 3 of them inherited.
- **Checkpoint tooling:** blocked twice, the only artefact with repeated blocks.
- Failures concentrate in one 4.0 area and one 4.1 operation. Both are closed.
