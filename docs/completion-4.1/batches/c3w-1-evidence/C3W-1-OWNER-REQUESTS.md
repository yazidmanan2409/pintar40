# C3w-1 · the owner's two authorisations (frozen at `8668a695`)

**These are two separate requests.** Neither is used until the owner approves it.

## Freeze conditions

| Condition | State |
|---|---|
| Second Eye: rounds 1–3; full pre-flight on the frozen head | ✔ 1328/0; plants 175/175; red cases 11/11 |
| CI on `8668a695` | ✔ run 45127093652, success |
| The audit journeys on `8668a695` | ✔ run 45127097404, success |
| Sharon: build (`6ace7b2f`) and round 2 (`bc6e50da`) | ✔ PASS (`C3W-1-BUILD-992b568f.md`) |
| Daisy: screens; rounds 2 and 3 | ✔ PASS (ux-1 `b0f66be4`) |
| Promotion evidence (`ed4a90cc`, `c3w-1-evidence/`): preservation read, local dry run 290 → 300, ten migrations with their sha256 | ✔ Only lines 10, 82 and 83 move; `c3w-r3-bahan` prints OK |
| **Sharon: the promotion proofs** | ✔ **PASS with conditions** (`C3W-1-PROMOTION-ed4a90cc.md`, `f7c6c858`). Her conditions are written into Request 2 below. No step 0 is needed: she accepted the reasoning |

## Request 1 · DONE (owner approved; 23 Nov, 08:03 UTC)

- **The project:** verified first, `keijhmdtsgrfvnvocfvk` "pintar-staging", ACTIVE_HEALTHY.
- **BEFORE: recorded** in `preservation-C3w-1-staging-BEFORE.txt`.
  - Line 10 reads `290 / 20270121250000`, matching the dry run's digest.
  - Lines 82 and 83 read absent and 0.
  - The `batas` for the AFTER read are `('2026-11-23 08:03:41.983238+00', 10697)`.

## Request 1 · the read-only staging "before" read

- **What:** run `c3w-1-evidence/preservation-C3w-1.sql` as committed (`ed4a90cc`), in a read-only transaction, with `batas` null.
- **Where:** staging **`keijhmdtsgrfvnvocfvk`** only, checked before the read. Production `trtlvibiybwixfumjrrx` is never touched.
- **Expected:**
  - line 10 reads `290 / 20270121250000`;
  - lines 82 and 83 read "0 present" and "0";
  - lines 1 and 2 print the cutoff and watermark for the AFTER read.
- **What it changes:** nothing. No write, migration or merge.
- **Evidence:** the full output, committed before the merge.

## Request 2 · DONE except check (d)'s Vercel look (owner approved; 23 Nov, 09:02–09:07 UTC)

- **The merge:** PR #27, required CI 45139146546 green; merged as `01bba241` with a merge commit and no bypass. The tree equals `ed4a90cc`.
- **The migrations:** the ten sha256 on `main` match the README. staging.yml 45143556783 succeeded, **290 → 300** (`20270122190000`).
- **AFTER** (`preservation-C3w-1-staging-AFTER.txt`): only lines 10, 82 and 83 moved, exactly as predicted. The versions digest `47bb9138…` equals the dry run's.
- **Sharon's checks** (`staging-checks-AFTER.txt`):
  - (a) C3W-R3-BAHAN: OK;
  - (b) the authenticator's pre-request is unchanged;
  - (c) authenticated may execute exactly the five registered functions; the other 18 are service_role only; anon has 0;
  - (d) the harness flag is absent from workflows, config and scripts. **Staging's Vercel env names await the owner's look:** the connector was refused for the team scope.
- **The hosted check:** environment-facts 45144060424 is **success** on `01bba241`.

## Request 2 · the merge, staging's migration, the "after" read and the checks

Asked only after Request 1's output is recorded.

1. **The merge:**
   - a PR from `claude/c3w-1` into `main` at the frozen code (`8668a695`, plus the evidence commits, which are docs only);
   - the PR's own CI must pass the required check, and its head carries no `[skip ci]`;
   - merged as is: no rebase, no bypass of any protection.
2. **Staging's migration, 290 → 300,** on `keijhmdtsgrfvnvocfvk` only, with the ten migrations (`20270122100000` to `20270122190000`), each checked against its sha256 (`c3w-1-evidence/README.md`).
3. **The "after" read:** the same query, with the BEFORE's `batas` written in.
   - Expected: only lines 10, 82 and 83 move. Line 10 reads `300 / 20270122190000`; line 82 shows seven AI tables, empty; line 83 shows five registry rows.
   - **Anything else is a material discrepancy, and it stops the work.**
4. **Sharon's staging checks, all required:**
   - (a) `scripts/release/after-promotion/c3w-r3-bahan.sql` on staging prints **OK**;
   - (b) V6: authenticator's `pgrst.db_pre_request` is unchanged;
   - (c) every `ai_*` function's EXECUTE matches its registry row, and **anon has none**;
   - (d) nothing sets `PINTAR_AI_STUB_HARNESS` in any workflow, config or staging secret.
5. **A part-way failure:** stop and report. There is no AFTER read, and nothing is retried without the owner.
6. **The hosted checks on staging,** as for A3 (environment-facts).

**Not part of either request:**
- any production action or release;
- any provider activation, key or spend (C3w-1 has no real adapter; the stub never runs on staging);
- anything from Z.
