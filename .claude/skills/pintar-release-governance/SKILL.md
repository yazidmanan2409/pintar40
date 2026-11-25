---
name: pintar-release-governance
description: The authorisation sequence for merging to main, promoting staging and gating production in PINTAR — owner rulings, update-branch without rewrite, step 0, BEFORE and AFTER preservation reads, after-promotion checks, readiness register. Use before any merge, staging promotion or production-related step, or when writing an owner request.
---

# Release governance

**Authority:**
- `docs/completion-4.1/OWNER-RULINGS-4.1.md`
- `docs/completion-4.1/PRODUCTION-READINESS-REGISTER.md`
- `docs/post-4.1/AUDIT-79-PLAN-OF-RECORD.md`

All three are on `claude/bob-41-master-plan`; read them with `git show`. **Read the latest rulings before acting: a ruling can change a finding** (Sharon's A1 lesson).

## Who may do what
- **The owner:** authorises each merge, each staging promotion, and any production step, separately.
- **Bob:** writes the request and carries out what the ruling authorises, and nothing more.
- **Production** (`trtlvibiybwixfumjrrx`) changes only by a separate production authorisation, through `.github/*-request.txt` on main. Never touch those files otherwise.

## Merge (as CI-1, H-1, CI-2)
1. **Branch protection requires an up-to-date branch.** Update it with GitHub's update-branch, which adds a merge commit with no rewrite.
2. Prove the PR diff against main is the reviewed one (see `pintar-verification` §5).
3. Merge **only after** the required check on that exact head reports success in the API. Use a merge commit with `expectedHeadSha` pinned.
4. **Then read main's own ci on the merge commit.** A production promotion needs main green on the exact commit it takes (PR-25).

## Staging promotion (`keijhmdtsgrfvnvocfvk`)
**A push to main that adds a migration starts `staging.yml` by itself.** So step 0 and BEFORE are taken **before** the merge.
1. **Verify the project** with `get_project`: the exact staging ref, ACTIVE_HEALTHY.
2. **Step 0:** the change's own counts, read only.
3. **BEFORE:** the preservation query, verbatim, inside `begin; set transaction read only; … rollback;`. Record `saat` and `audit_id`, and predict exactly which lines move.
4. **Merge,** then read `staging.yml`'s API conclusion.
5. **AFTER:** the same query with BEFORE's `saat` and `audit_id`. Diff it by machine. **Any line moving beyond the prediction: stop and investigate** before declaring anything.
6. **After-promotion scripts,** each expecting OK:
   - `scripts/release/after-promotion/v6-pre-request.sql`
   - `c3w-r3-bahan.sql`

   Plus the V6 re-read after an owner staging request.
7. **Sharon's** independent promotion verdict, and main's ci on the merge, before «closed on staging».

**Evidence files are written verbatim from the tool output, never reconstructed.**
