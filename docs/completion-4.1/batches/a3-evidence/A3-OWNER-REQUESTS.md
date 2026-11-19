# A3 · the owner's two authorisations (DRAFT; A3 frozen at `5ae2d406`, 19 Nov about 02:10 UTC)

**These are two separate requests.** Neither is made until every freeze condition below is met, and neither is used
until the owner approves it.

## Freeze conditions

| Condition | State |
|---|---|
| Sharon: chunk 1 (the screens) PASS | ✔ `25b94630` |
| Sharon: chunk 2 (the merge and the dry run) PASS; **"A3 may freeze at `5ae2d406`"** | ✔ (her `A3-DIFFS-671175e4.md`, 19 Nov 02:11) |
| A full uninterrupted pre-flight on the merged head | ✔ 1294/0; plants 175/175; red cases 11/11; DR-D02 passed |
| The local preservation dry run 284 → 290, with Sharon's six proofs and step 0 | ✔ Sharon diffed it proof by proof |
| `preservation-A3.sql` re-checked against the frozen head | ✔ Sharon, `A3-PRESERVATION-8cb312ee.md`. **After her check, one header comment was corrected (comment only; the body is unchanged)** |
| **CI on `5ae2d406`** | ◐ dispatched 19 Nov 02:17 by Bob (CI run 44443166748) |
| **The audit journeys on `5ae2d406`** | ◐ dispatched 19 Nov 02:17 by Bob (journeys run 44443171111) |
| **Daisy: the recovery screens' UX review** | ◐ asked 02:16 (a blocker reopens the freeze; minors go to Z) |

## Request 1 · the read-only staging "before" read, and step 0

- **What:** run `step0-A3-lineage.sql` and then `preservation-A3.sql` exactly as committed, each in a read-only
  transaction.
  - It runs on the staging project **`keijhmdtsgrfvnvocfvk`** only, checked before the read. Production
    `trtlvibiybwixfumjrrx` is never touched.
  - `batas` is null for the BEFORE read.
- **Step 0 is the gate.** Any hit (an ambiguous or cyclic course or module chain) **stops the promotion before any
  migration.**
- **Expected:**
  - step 0 reads 0 on its checks, with line 4 matching the reference at 284;
  - the BEFORE read's line 10 reads `284 / 20270121110000`;
  - lines 1 and 2 print the cutoff and the watermark for the AFTER read.
- **What it changes:** nothing. No write, no migration, no merge.
- **Evidence:** the full output, committed before the merge.

## Request 2 · the merge, staging's migration, the "after" read and the hosted checks

Asked only after Request 1's output is recorded.
1. **The merge:**
   - a PR from `claude/a3` into `main` at the frozen head;
   - the PR's own CI must pass the required check; its head carries no `[skip ci]`;
   - merged as is, with no rebase and no bypass of any protection.
2. **Staging's migration: 284 → 290,** on `keijhmdtsgrfvnvocfvk` only, with the six migrations, each checked against
   its sha256 (`a3-evidence/README.md`).
3. **The "after" read:** the same query, with the BEFORE's values written in.
   - Expected: only the lines the header names move; line 10 reads `290 / 20270121250000`.
   - Anything else is a material discrepancy, and it stops the work.
4. **A part-way failure (Sharon's ruling (a)):** stop and report; no AFTER read; nothing retried without the owner.
5. **The hosted checks on staging,** as for C2w.

**Not part of either request:**
- any production action or release;
- any A3 change after the freeze;
- anything from Z.
