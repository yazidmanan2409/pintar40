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

## Addendum, 16 Nov 2026 10:15 UTC: e740f572 (against my checklist) and b202ddf8 (T1 to T5)

**What I read:**
- the commit messages and Second Eye's mapping, for `a6392219` to `b202ddf8`;
- `change_maintenance`'s body, to check E05's claim.

**T1 to T5 are addressed in `b202ddf8`, as Second Eye describes it:**
- T1: a code other than LAINNYA with free text is refused, and a coded window stores its code as its reason;
- T2: the 7B negative;
- T3: `convalidated`;
- T4: 120 × 'é';
- T5: both plants red.
- I will check each when I read the database commit.

**Rulings and points:**
1. **A2B-R04, the preservation line, is the right test:** every existing row shape, run through the migration's marked section and shown unchanged. **One addition:** R04 also asserts that the migration has **no** DDL or DML on `maintenance_windows` outside its markers. A section test proves only what is inside its markers.
2. **K17 and K18 are accepted as specified.** The 500 bound is Bob's to rule; I have no objection to 500.
   - The picker is read as STAFF, refused to a teacher, and lists only the school's active classes. The privacy point is met.
3. **A2B-E05, the database clock in `change_maintenance`, is a real defect, and I confirm it.**
   - At 20261120100000 the function reads `maintenance_state(w, now())` and stamps `starts_at`, `ended_at`, `activation_recorded_at` and `withdrawn_at` with `now()`.
   - After the FENCE wait, `now()` is stale.
   - **My recommendation to Bob: fix it in batch 2.** «Akhiri sekarang» is new in A2b, so A2b exposes the defect.
     - Use one `v_kini := clock_timestamp()`, taken **after** the locks, for the state read and every stamp, PLANNED only.
     - **The EMERGENCY branch is untouched,** and a test pins that: A2a's accepted tests stay green, and the EMERGENCY branch's text is byte-identical to the frozen version. So A2a's evidence is not reopened.
   - **A07: do not weaken the test. Fix the audit time.**
     - Pass the instant to the audit row explicitly, so that `audit_log.at = v_kini`, if `audit_write` allows it. Then A07's `at = ended_at` still holds.
     - If `audit_write` cannot take an instant, comparing the summary's own instant is acceptable, but it must be re-specified first, as Second Eye says.
   - *Could reasonably have been anticipated (Q4, before and after):* yes, as K8's sibling. I did not sweep the other writers for `now()` after K8.
4. **K16 is the owner's sequence and K14 is the class count and picker.** Either naming is fine, as long as neither reuses K13.
5. **E04 and E06, green on arrival, need a plant each before the database commit's PASS**, as in T5:
   - for E04, an extend that accepts an equal end;
   - for E06, an early end that also closes running sittings.
- **Bob's rulings, 10:00 UTC:**
  - the 500 bound, refused before any lookup in both functions;
  - the E05 clock fix is in batch 2, PLANNED only, with the EMERGENCY branch pinned and A07 re-specified first;
  - ids: K16 is the owner's sequence, and K14 is the class count and picker.
  - **My read of e740f572 is the addendum above,** so the tests are GO for product code, with the plants for E04 and E06 still to be added.
  - **Two points for the fix:**
    - `v_kini` is taken **after** the FENCE and the window's lock, not at entry;
    - A07's re-specification prefers `audit_log.at = v_kini`, passed explicitly, over comparing the summary.
