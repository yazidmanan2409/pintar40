# C2w · the local preservation dry run, 282 → 284, on the final candidate `6b6f31c5`

**Local stack only.** Nothing was written to staging or production, and nothing was merged. Sharon cleared the dry run at
`b3edc995`. Run 18 Nov 2026, 01:13–01:20 UTC.

## The query

- `docs/completion-4.1/batches/c2w-evidence/preservation-C2w.sql` on `claude/bob-41-master-plan` at `dfa542ab`, sha256 `1b686345f3adb30aaec1976711f257d064380964bb621fcb01a663adf1c278af` (Sharon verified this sha).
- **The before read** ran the query unchanged, in a read-only transaction, with both `batas` values null.
- **The after read** ran `preservation-C2w-after.sql` (here). It is the same file with only the two printed values written in: cutoff `2026-11-18 01:13:44.128096+00` and audit watermark `336`.

## The steps

1. Reset the local database from `origin/main` at `1b1cada8` (a separate worktree): **282 migrations, last 20270120240000**.
2. Loaded the harness fixtures (main's `selftest/db/`). Built one published platform release with `selftest.canonical_package`. Then, as the platform's own administrator (`kanonik-admin@pintar.test`), granted it through `grant_release_distribution` to two schools:
   - `7f9cfdf8…`, for proof 2;
   - `7d73b828…`, for proof 3.

   Both were ACTIVE at the cutoff (line 66: `2 d59092a3…`).
3. **Before read**, `before-282.txt`.
4. Applied the candidate's migrations from `claude/c2w` at `6b6f31c5` with `supabase migration up --local`: `20270121100000` and `20270121110000` (sha256 `54b6569df6d08535c6c44fcb180ea3bdf78cc15db81ae10d06a32fbc3e585196`). Result: **284**.
5. **After read**, `after-284.txt`.
6. **Proof 2**: as `kanonik-admin`, `withdraw_release_distribution('7f9cfdf8…')`, then read again: `proof2-withdrawal.txt`.
7. **Proof 3**: a direct `UPDATE` of `7d73b828…` to WITHDRAWN, written past the table's triggers (`session_replication_role = replica`) as an out-of-band write would be, with **no audit row** (0 rows above the watermark for that target). Then read again: `proof3-direct-update.txt`.

## Sharon's three proofs

| Proof | Diff | Holds |
|---|---|---|
| (1) only line 10 moves | before → after: **only line 10**, `282 / 20270120240000` → `284 / 20270121110000` (versions digest `a5b762d4…` → `1374521a…`). Every other line identical, lines 65–68 included | **Yes** |
| (2) a withdrawal through the function shows in line 67, line 68 at 0 | after → proof 2: **only line 67**, `0` → `1 d5872fb7…`. Line 68 stays `0`; line 66 does not move (it leaves out the four columns a withdrawal writes) | **Yes** |
| (3) a direct update with no audit row makes line 68 read 1 | proof 2 → proof 3: line 67 `1` → `2 9d9dae94…`; **line 68 `0` → `1`** | **Yes** |

**Still waiting:** the staging BEFORE read waits for the owner's authorisation.
