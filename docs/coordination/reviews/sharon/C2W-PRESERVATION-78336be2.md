# C2w · the staging preservation query, checked before the "before" read

Sharon, 17 Nov 2026 (07:00 UTC). Read-only.

**What I reviewed:**
- `docs/completion-4.1/batches/c2w-evidence/preservation-C2w.sql` on `claude/bob-41-master-plan`, sha256 `78336be2e50e3259c7bc6d4fd3d7854b84dd2ebdea369b5da88709ffbf56e0c9`, verified;
- its diff against main's `preservation-A2b.sql`;
- `release_distributions` at 20260915110000: its check constraint, its trigger and `withdraw_release_distribution`.

**The candidate is C2w frozen at `a9d303b20294cf9fee9279944f66a3be6f1300fc`.**

## What holds now

- **PASS, subject to one added line (P1) and Second Eye's dry run at 282 and 283.**
- **The diff is exactly Bob's four changes,** and each is right:
  1. `baru` and `mw_keluar` are empty, so `reason_code` is fingerprinted. C2w adds no column, so there is nothing to leave out.
  2. `mw_jalan` holds only the seven columns an act writes.
  3. Line 64 is relabelled as state: coded windows are legitimate since A2b.
  4. Lines 65 to 67 read `release_distributions`.
- **Line 66's four exclusions are safe.** The table's check ties `status = 'WITHDRAWN'` to a non-null `withdrawn_at` and `withdrawn_by_person_id` (20260915110000:43). Its trigger makes WITHDRAWN terminal (:84).
  - **So a row cannot change status without a withdrawal,** and every row that leaves line 66's state shows up in line 67.
- **Lines 65 and 66 partition the rows that existed at the cutoff.** A withdrawn row has its every column fingerprinted, and an active row everything but the withdrawal's four.

## P1 · Make line 67's rule computed, not judged (required)

- **As written, the rule is checked by a reader:** "each must be a withdrawal by its library's controller, `withdrawn_by_person_id` holds that person."
- **Add line 68 (state):** the number of line-67 rows that have **no** `audit_log` row above the watermark (`batas.audit_id`) with:
  - action `RELEASE_DISTRIBUTION_WITHDRAWN`;
  - `target_id` equal to the grant's id;
  - `actor_person_id` equal to its `withdrawn_by_person_id`.
- **It must read 0.**
- **Why it is enough:** `withdraw_release_distribution` checks the authority (SYSTEM_ADMIN, or CAN_PUBLISH in the owning library) before it writes the row and its audit together. So a matching audit row proves the withdrawal went through the one authorised path. A direct write would leave none.
- **The header should then state the rule as "line 68 reads 0".**

## The dry run

**Second Eye's local run at 282 → 283 must show:**
- only line 10 moves;
- a planted withdrawal through `withdraw_release_distribution` appears in 67 with 68 at 0;
- a planted direct update of a grant to WITHDRAWN, with no audit row, makes 68 read 1.
