# A2a change C · early read of commits 2 to 4, and Daisy's §3 ruling

Sharon, 14 Nov 2026 (02:45 UTC). Read-only. **Commits read:**
- commit 2, `7607ac75cba16fb6747d632749d6ee45ac0dcac9`;
- commit 3, `bd2f3247471c03ec6faaf935be8af250c087081b`;
- commit 4, `e076520c828eb88c6f05922e5bade2b6d6c1f126`;
- Daisy's `A2A-DITUTUP-BERJALAN.md` §3 at `4ce730409a2b2df97cf96b3f9c5a69321fa33c3f`.

The code is read on `main` at `0ea4b8adcee503507388400254b0b4f7bb25b24b`.

## What holds now

- **Commit 2, the fence: NO BLOCKER.** Two notes.
- **Commit 3, B1: NO BLOCKER.** It closes B1's cycle for every path that exists today.
- **Commit 4, A2A-T01: it meets E1 and E2.**
- **Daisy §3: a separate read, not a branch in `may_start_assessment`.** It is built in change C, because a held sitting must be reachable (D-1).

## 1 · Commit 2: the fence (`20270119100000`, A2A-F01)

**What I checked:**
- Two functions on one fixed key, `pagar_darurat_eksklusif` (`SET lock_timeout = '1500ms'`) and `pagar_darurat_bersama` (`'2s'`), each a `SET` clause, as required.
- The clause holds only while the function runs; the transaction-level lock lasts to commit. The caller's own `lock_timeout` is untouched.
- `lock_timeout` applies to advisory-lock waits, so the activation's three attempts in subtransactions catch `lock_not_available` as designed.
- **A2A-F01 meets row 5's condition:**
  - from the catalogue, exactly the two takers, each with its clause;
  - every caller is an RPC, a procedure or a trigger, and none is granted to `anon`;
  - from the repository, there is no driver, no pooler and no `pg_advisory` under `src/` or `supabase/functions/`, and no migration names the key elsewhere;
  - both plants are reported.

**Notes, not blockers:**
- **N1.** Supabase's default privileges also grant new functions to `service_role`, and the migration revokes only `public`, `anon` and `authenticated`. A `service_role` RPC would take the fence for its one transaction, which is harmless. Revoke it too for clarity, and assert it in the migration's check.
- **N2.** A2A-F01 finds a taker by the key's literal in `prosrc`. A function that computed the key would escape. The rule "the key is named only in `20270119100000`" covers the repository; that is enough while the key is a literal. Keep the page's sentence that the key is never computed.

## 2 · Commit 3: B1 (`20270119110000`)

- It reads `kind` without a lock. On EMERGENCY it takes `pagar_darurat_eksklusif()`, then the window row `FOR UPDATE`. PLANNED is unchanged. The structural check asserts the order.
- **"A window's kind never changes after it is scheduled":** I find no writer of `maintenance_windows.kind` on `main` other than the insert.
- **Condition for (C):** state it as an invariant, and test it in A2a's writer enumeration: no function sets `kind`. If one ever could, the unlocked read would no longer decide correctly.
- **The edge recorder** (`maintenance_record_edges`, `for update skip locked`) never waits on a window row, and locks nothing ranked after one, so it forms no cycle with the fence.
- **Removing A2A-L01's "pending B1" exception is right:** the window breach is gone at its source.
- **What is still to come in (C):** AKHIRI on an EMERGENCY window through the fenced lift, which reads `T_lift` under the fence and releases the held sittings. That is a later draft, with its own early read.

## 3 · Commit 4: A2A-T01 meets E1 and E2

- **E1:** `frozen_remaining_seconds` is in `KOLOM_DB`. A call to `session_state`, `pengerjaan_saya`, `daftar_pengerjaan` or `pengerjaan_tenggat_efektif` counts as a read.
- **E2:** `POLA_SRC` has `tenggat`, `sisa_detik`, `sisa_ditahan_detik`, `berakhir_pada` and `deadline`, read in code only.
  - The four files are classed.
  - `AturPengerjaan` is the new class KLIEN, checked by D6.3's shift test.
  - The third plant is reported.
- **Accepted.**

## 4 · Daisy §3: a held standalone sitting must stay reachable

**The finding is real, and it is also inherited from A1:**
- `start_learning_session` always asks `may_start_assessment` (`20270112120000…`, :16 onward).
- `may_start_assessment` answers `OUTSIDE_WINDOW` once the assignment's `closes_at` has passed (`20261229100000…`, :32–33).
- `my_open_assessments` lists only what it accepts.
- So a learner whose standalone sitting was held, by A1's suspension today or by A2a's stop, and whose assignment closes meanwhile, has no list row to reach it. That contradicts D-1: held sittings resume with the time they had.

**The shape: a separate read, not a resume branch in `may_start_assessment`.**
- `may_start_assessment` is the start gate: INV-27, the trigger, and A2b's place guard (classed "refused").
- An `ok` meant "resume only" would reach `start_learning_session`, which treats `ok` as "insert a sitting". That would let a **new** sitting start after `closes_at`. The gate must not have two meanings.

**Required:**
- The learner's open, non-final sittings come from a read keyed on the sitting:
  - `pengerjaan_saya`, which is already HARUS and shift-aware;
  - or a new learner-scoped read in the same form, classed HARUS in A2A-T01.
- Belajar's list keeps the row while such a sitting exists. The row opens the sitting by its id through `session_state`, never through `start_learning_session`.
- Resuming is gated by the sitting's own effective deadline (`pengerjaan_tenggat_efektif`, shifted), never by the assignment's `closes_at`.
- `OrientasiAsesmen` shows the sitting's time left for that learner, as Daisy wrote.
- **Tests:**
  - a held standalone sitting whose assignment closed during the stop is listed, opens, and finishes with the time it had;
  - `may_start_assessment` still refuses a new start after `closes_at`;
  - the same holds after a suspension's reinstatement (A1's path, the sibling).

**`my_open_assessments` and `may_start_assessment` in A2A-T01:**
- Both are in the table as TIDAK ("an assignment's window"), and **that is correct.** They decide starting, not a running sitting.
- The new read is the missing reader, the sibling, and it is HARUS.

**Could reasonably have been anticipated:** yes (Q2, the neighbouring act). A1 added "resume with the time it had" without asking how a learner reaches a sitting once its assignment has closed. Caught in development, by Daisy.
