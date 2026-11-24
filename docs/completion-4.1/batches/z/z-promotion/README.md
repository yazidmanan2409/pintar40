# Z · the staging promotion 300 → 308 (owner ruling 87), 23–24 Nov 2026

**Result: PASSED.** Every documented check matches its prediction, with no material discrepancy. Production is untouched at 111.

| Step | When (UTC) | Result |
|---|---|---|
| Project verified | 23 Nov 23:29 | `keijhmdtsgrfvnvocfvk`, "pintar-staging", ACTIVE_HEALTHY |
| **Step 0** (`step0-staging.txt`) | 23:29 | **0 / 0 / 0**: no pass mark below its floor |
| **BEFORE** (`preservation-Z-staging-BEFORE.txt`) | 23:30 | 300 / `20270122190000`, digest `47bb9138…`, equal to C3w-1's AFTER. **Lines 20–83 byte-identical to C3w-1's AFTER** (no drift since). batas = ('2026-11-23 23:30:21.280782+00', 10697) |
| PR #28 CI | 23:25–00:01 | run 45288739714 **success**, attempt 1, on head `a8d9ff27` (docs only on top of the verified code `7615d6b1`); `mergeable_state` clean |
| **Merge** | 24 Nov 00:06 | **`61a6ff9e`**, merge commit, head pinned, no bypass. Parents `01bba241`, `a8d9ff27`. **Main's tree equals `a8d9ff27`. All 8 migration sha256 match z-evidence/README.md** |
| **Promotion** | 00:06–00:07 | staging.yml **45294352172 success**: migrations applied, after-state equals the repository, sign-in boundary and email read back, live sign-in round trip verified |
| **AFTER** (`preservation-Z-staging-AFTER.txt`, `DIFF-staging.txt`) | 00:08 | **Only lines 10, 84, 85 and 86 move, exactly as predicted.** Line 10: 308 / `20270123170000`, digest `8844154d…`, **equal to the dry run's**. Lines 20–83 and 87 (every feedback record) read identically |
| **C4** (line 84) | 00:08 | all three pass-mark floors `convalidated = true` |
| D-6 (lines 85, 86) | 00:08 | client EXECUTE on the nine feedback functions 9 → **0**; client SELECT on feedback tables 2 → **0**; nothing deleted (line 87) |
| **v6-pre-request.sql** | 00:09 | **OK** |
| **c3w-r3-bahan.sql** | 00:09 | **OK** |
| **The owner's dashboard check** | open | No `PGRST_DB_PRE_REQUEST` override on the API server (SQL cannot see one). **For the owner** |

Every read was read-only (`set transaction read only`). The only write to staging was staging.yml's own, governed migration.
