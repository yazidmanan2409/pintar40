# C2w · the owner's two authorisations, prepared (draft until the freeze)

**These are two separate requests.** Neither is made until C2w is frozen at `aa5f5741`, and neither is used until the owner approves it. The freeze needs:
- **CI:** run 44216101395 on `aa5f5741`, **success**;
- **the audit journeys** on `aa5f5741`, both jobs: run 44216105919, in progress;
- **Sharon's delta check** on the CSS and component change: requested;
- the freeze recorded in TEAM-INSTRUCTIONS, with every run id.

## Request 1 · the read-only "before" preservation read on staging

- **What:** run `docs/completion-4.1/batches/c2w-evidence/preservation-C2w.sql` exactly as committed at `dfa542ab`.
  - It runs in a read-only transaction, with the two `batas` values null.
  - It runs on the staging project **`keijhmdtsgrfvnvocfvk`** only. The project is checked before the read; production `trtlvibiybwixfumjrrx` is never touched.
- **Expected:** line 10 reads `282 / 20270120240000`. Lines 1 and 2 print the cutoff and the audit watermark, which go into the AFTER read.
- **What it changes:** nothing. It is a read only: no write, no migration, no merge.
- **Evidence kept:** the full output, committed before the merge, as A2b's was.

## Request 2 · the merge, then staging's migration and the "after" read

Asked only after Request 1's output is recorded.
1. **The merge.** PR #25 (`claude/c2w` into `main`) at head `aa5f5741`. It is merged as is and is not rebased. The branch protections and required checks are not bypassed.
2. **Staging's migration:** 282 → 284, on `keijhmdtsgrfvnvocfvk` only, with the two migrations of the merged commit:
   - `20270121100000`;
   - `20270121110000` (sha256 `54b6569d…5196`).
3. **The "after" read:** the same query, with the BEFORE's two values written in.
   - **Expected:** only line 10 moves, to `284 / 20270121110000`. Lines 65 and 66 do not move. Line 67 is state, and line 68 reads 0.
   - Anything else is a material discrepancy, and it stops the work.
4. **The hosted checks on staging,** as for A2b.

**Not part of either request:** any production action, any release, and any C2w change after the freeze.
