# C2w · Bob's check of the final candidate and its dry run (18 Nov, 01:20 UTC)

**The candidate.** The final candidate is `6b6f31c548b1797509c34bff4dd8f606b9efaad9`, on `origin/claude/c2w`, under the docs-only tip `aa5f5741`.
- **Its ancestry:** `origin/main` is its ancestor, so it adds to main and rewrites none of it.
- **Its migrations:** exactly two are added (282 → 284). No existing migration is edited.
- **Its database is unchanged since `53a31d91`:** `git diff 53a31d91 6b6f31c5 -- supabase` is empty.
  - The reviewer-notes migration's sha256 is still `54b6569d…5196`.
  - So the header check (`dfa542ab`) and Sharon's database delta check still apply.
- **What changed since `53a31d91`:** Daisy's C-7 and C-8 only, in the CSS and the component (red first `540d695e`, then the fix `ea973d70`). Sharon has been asked for her delta check on that.

**The dry run** (`docs/completion-4.1/batches/c2w-dryrun-6b6f31c5/`), read by Bob:
- **The query** in `preservation-C2w-after.sql` is the restated query at `dfa542ab`, line for line. The only difference is the two `batas` values written in: the cutoff, and the audit watermark 336.
- **Proof 1:** `before-282.txt` and `after-284.txt` have 55 lines each. **Exactly one line differs: line 10**, `282 / 20270120240000` → `284 / 20270121110000`.
- **Proof 2:** after a withdrawal through `withdraw_release_distribution`, **line 67 moves from 0 to 1 and line 68 stays at 0.** Lines 65 and 66 do not move.
- **Proof 3:** after a direct update with no audit row, **line 68 reads 1** (line 67 reads 2, counting both withdrawals). Lines 65 and 66 still do not move.

**Before the owner's two authorisations, the before-read and the merge, three things remain:**
1. Daisy's sign-off on the C-7 recapture.
2. Sharon's delta check on the CSS and component change.
3. The freeze, PR #25 and the journeys, under the existing gate.
