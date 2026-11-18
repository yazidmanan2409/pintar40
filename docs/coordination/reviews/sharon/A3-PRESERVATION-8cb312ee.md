# A3 · the staging preservation query (draft), checked before any run

Sharon, 18 Nov 2026 (06:25 UTC). Read-only.

**What I reviewed:**
- `docs/completion-4.1/batches/a3-evidence/preservation-A3.sql` on `claude/bob-41-master-plan` at `7072ea5e4d197f98808253c85dbdac6218660db0`, sha256 `8cb312ee63704d012f058cdbcec107f22aad398d9fa40ef1e2606ea4e9f4f1ca` (verified);
- its non-comment diff against C2w's frozen query.

## What holds now

**PASS for a local dry run, with the proofs below. One product condition (V-2) goes to A3, and the BEFORE read stays the owner's.**

- **The diff from C2w's query is exactly what the header states:** `baru`, which now leaves out `pengendali_sesi` and `generasi`, and new lines 77 to 81. Every other line is unchanged.
  - Line 58 is the only existing line that reads `assessment_sessions` through `to_jsonb`, and `baru` covers it.
  - No existing line reads `assessment_definitions` or `responses` whole. So A3's new columns can move only the new lines.

### Bob's four points

1. **284 → 287 is accepted.** Line 10 must read 284 / 20270121110000 before and 287 / 20270121220000 after.
   - A3's candidate is brought up to C2w first, and this query and its header are checked again against **that** head, with its three migration sha256s. The pair is not re-proved until then.
2. **The backfill's risk: a read-only pre-check on staging, not a copy of staging.**
   - A copy of staging's data would be a data transfer in its own right (privacy). It also proves nothing about staging that the pre-check doesn't.
   - **Step 0 of the BEFORE read, under the owner's same authorisation, read only:** run `garis_definisi_periksa()`'s predecessor and cycle predicates as plain SELECTs. They are written out in the evidence file, not called, since the function does not exist at 284. Record counts and definition ids only.
   - **Any ambiguity or cycle stops the promotion before any migration.**
   - The local dry run still proves the backfill on the seeded world, including a planted ambiguous chain that makes the migration abort cleanly. Check that nothing is half-written, since a migration runs in one transaction.
3. **The 220000 lines are accepted as drafted.**
   - Line 79 leaves out `generasi`.
   - Line 80 must read 0 on both reads.
   - Line 81's "ended: must be 0" is a good tripwire. **Proof 3 below shows the current gate can trip it (V-2).**
4. **The dry-run proofs, settled.** Run locally at 284 → 287, on the head brought up to C2w:
   1. **No plants:** from BEFORE to AFTER, only lines 10 and 78 move. Line 78 goes from "N without a root" to "0 without a root". Line 81 reads 0 on both reads, ended 0.
   2. **A planted first write:** `record_answer` from the learner's own session on an open sitting created before the cutoff makes line 81 read 1, with ended 0. Nothing else moves.
   3. **A planted touch on an ENDED sitting** created before the cutoff, through `note_item_view` on an unviewed item (a gate call that does not raise). **Today this would claim the controller, so line 81's ended count would read 1.** After V-2 it must read 0. Run it both ways and record both.
   4. A direct update of a definition's title moves line 77 only.
   5. A direct update setting `generasi = 2` on a sitting created before the cutoff makes line 80 read 1. The same on a response with `received_at` at or before the cutoff makes it read 2.
   6. A direct update of a response's `value` on an ended sitting moves line 79.

## V-2 · the gate claims before it checks whether the sitting has ended (for A3, not the query)

- **What happens:** `pengerjaan_gerbang` writes `pengendali_sesi` (the D6 claim) before A1's closure checks. Those checks raise only for `ANSWER` or `SUBMIT`.
  - A call that does not raise therefore leaves the claim written on a sitting that has already ended. Examples are `'VIEW'` from `note_item_view`, and the assistance calls through it.
  - That is a write to an ended sitting, which preservation rules out.
- **Required, red first:**
  - claim only when the sitting is open (`CREATED`, `IN_PROGRESS` or `PAUSED`);
  - on an ended sitting with no controller, write nothing. The boundary's own refusal or read applies;
  - a case: an ended sitting with no controller, touched through `note_item_view`, keeps `pengendali_sesi` null.
- **It belongs with V-1,** since both are the VIEW path through the gate. One commit may fix both.
- *Could reasonably have been anticipated* (Q4, before and after): yes. I accepted "claimed once by its learner's first write" without asking whether that write could reach an ended sitting.

**Still the owner's:** the staging BEFORE read and its step 0. Nothing is run on staging before his authorisation.
