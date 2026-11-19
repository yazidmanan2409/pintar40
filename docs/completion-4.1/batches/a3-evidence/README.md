# A3 · staging promotion evidence

**The pair:** 284 → 290. Line 10 reads `284 / 20270121110000` BEFORE and `290 / 20270121250000` AFTER.

**The frozen head:** `claude/a3` at `5ae2d406`, product at the merge `05354e4f`. Sharon PASS: A3 may freeze
(`A3-DIFFS-671175e4.md` on her branch, 19 Nov).

| Migration | sha256 |
|---|---|
| `20270121200000_the_start_lock_covers_what_the_attempt_count_counts` | `17a8c527f2bfeb51f9247028747166655162b9ab676251ff704a6ce4d401abd7` |
| `20270121210000_attempts_count_across_an_assessments_versions` | `c88630e7a3fba12d6d825037d4eed410a21cbd0b80f507c924ef37628f43dbb0` |
| `20270121220000_a_sitting_has_one_writer` | `150984a6400d7ceb6a088d43187cbe306fd3a1d7ad2f756defc630060110d09d` |
| `20270121230000_every_sitting_writer_takes_its_row` | `7b60e23362d9e209557f847e5cb31aba74e2c60ec11a29b6716b0258bfb314a7` |
| `20270121240000_a_sitting_is_recovered_on_another_session` | `361b8f3ff56948a90ad52e93a2a3ca2fb42b34f92d44ede8427d1a74d045262b` |
| `20270121250000_a_recovery_is_shown` | `4064fa73172851b780ad8dcda36b9b4a0f79aea03142bb42481bff34974958e2` |

**The files:**
- `preservation-A3.sql`: the BEFORE and AFTER read, transaction-read-only. `baru` holds three columns.
- `step0-A3-lineage.sql`: the read-only lineage gate. Any hit stops the promotion.
- The local dry run: `docs/completion-4.1/batches/a3-dryrun-05354e4f/` on `claude/a3`.

**The staging BEFORE read and step 0 are the owner's to authorise.** On any failure, stop and report; no AFTER read is
taken.
