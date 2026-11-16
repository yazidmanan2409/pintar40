# A2b batch 2: the red tests, before any product code

Sharon, 16 Nov 2026 (10:05 UTC). Read-only. **What I reviewed:**
- `d837181d455612346f9fd9f90d468d38a5fb754b` on `claude/a2b`: `selftest/a2b-batas.test.ts` and the manifest;
- the database tests R01, R02, A06 and A07 in full, and the app tests R03 and E01 to E03 at their assertions.

## What holds now

- **GO for the database commit.** The tests encode the approved rules:
  - the five planned codes;
  - no code on EMERGENCY rows (Bob, 09:16);
  - rows with no code stay valid, which is the preservation line;
  - `stop_pintar_now`'s signature pinned;
  - `MAINTENANCE_INPUT_INVALID` for a foreign code, or LAINNYA without text.
- **Second Eye's design question:** `p_reason_code` is a trailing parameter defaulting to NULL, so PLANNED rows are not forced to carry a code in the database. **Accepted.**
  - Forcing a code would restate M148 and L01, and A2a's accepted evidence with them. That costs more than the risk, since the screen always sends a code (R03).
  - A direct call without a code behaves exactly as it did in 4.0.
- **The database refusals for «Perpanjang» are already pinned** by K6 to K9, which I reviewed earlier:
  - PLANNED only;
  - who may extend;
  - an ended window;
  - no shortening.
  - A06 and A07 add the end-to-end evidence: the audit, the notice, and the place guard at once.
- **Not in this commit yet:** the class picker, K14, and Bob's point 4 on `maintenance_collisions`. I will read them when they come (A2B-BATCH2-PREP.md).

## Required before the database commit's PASS

None of these blocks GO. Each is a test to add, or an existing one to cite.

1. **T1: free text with a code other than LAINNYA.** What is stored and shown when the code is RUTIN and `p_reason` is "anything"?
   - If the text is kept and shown to the affected as `alasan`, the controlled list is bypassed, and free text reaches learners.
   - **The rule should be:** for a code other than LAINNYA, the text is refused (PR110), or replaced by the code. Add one case.
2. **T2: the status read for someone not affected.** R02 shows that the affected learner sees the reason. Add or cite the negative: a learner of another school, or of an untouched class, gets no entry for W1, so no reason text either.
3. **T3: the constraint is validated.**
   - R01 inserts new rows. It cannot see whether `ADD CONSTRAINT` was added `NOT VALID` and never validated, which would let a violating existing row stay hidden.
   - **Assert** `convalidated = true` for the new CHECK in `pg_constraint`.
4. **T4: 120 characters, not 120 bytes.**
   - The form says "sampai 120 karakter". If the CHECK uses `octet_length`, accented text passes the form but is refused by the database.
   - **Add:** 120 multibyte characters (for example `é`) accepted, and 121 refused.
5. **T5: plants for A06 and A07.** They were green on arrival, so nothing has shown they can fail. Add one plant each, and show it red:
   - for A06, the notice's `expires_at` left unmoved;
   - for A07, `ended_at` set from `now()` rather than the audit's time, or the guard still on.

**Could reasonably have been anticipated:** T1 and T2 (Q1, readers and writers). Who reads `alasan`, and who must not, is the question of a reason shown to learners.
