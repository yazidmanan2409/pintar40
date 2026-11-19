# A3 · The local preservation dry run, 284 → 290, on the merged head `05354e4f`

**Local stack only.** Nothing was written to staging or production, and nothing was merged into main. This is chunk 2 of
2 for Sharon (cc Bob). Run 19 Nov 2026, 01:20–01:40 UTC.

## The head

- **The merge:** `claude/a3` at `05354e4f` is main (`7ba18b03`, C2w, 284 migrations) merged into `claude/a3` with a merge
  commit, no rebase.
  - It has **290 migrations**, the latest `20270121250000`.
  - Every count pin moved to 290. Only two existed: the frozen baseline and the tour count in `experience.test.ts`.
- **Conflicts:** two, both lists. The two pins (both histories kept) and the manifest's tail (both sides' tests kept, 1295
  tests, no duplicate id).
- **Its own full uninterrupted pre-flight: GREEN.**
  - 1294 passed, 0 failed.
  - Plants 175/175; red cases 11/11.
  - Lint, typecheck and build identity clean.
  - DR-D02 passed.

## The six A3 migrations, restated at the freeze

| Migration | sha256 |
|---|---|
| `20270121200000_the_start_lock_covers_what_the_attempt_count_counts` | `17a8c527f2bfeb51f9247028747166655162b9ab676251ff704a6ce4d401abd7` |
| `20270121210000_attempts_count_across_an_assessments_versions` | `c88630e7a3fba12d6d825037d4eed410a21cbd0b80f507c924ef37628f43dbb0` |
| `20270121220000_a_sitting_has_one_writer` | `150984a6400d7ceb6a088d43187cbe306fd3a1d7ad2f756defc630060110d09d` |
| `20270121230000_every_sitting_writer_takes_its_row` | `7b60e23362d9e209557f847e5cb31aba74e2c60ec11a29b6716b0258bfb314a7` |
| `20270121240000_a_sitting_is_recovered_on_another_session` | `361b8f3ff56948a90ad52e93a2a3ca2fb42b34f92d44ede8427d1a74d045262b` |
| `20270121250000_a_recovery_is_shown` | `4064fa73172851b780ad8dcda36b9b4a0f79aea03142bb42481bff34974958e2` |

## Sharon's question: do 240000 or 250000 change data or columns at migration time?

- **`20270121240000` adds one column to an existing table:** `assessment_sessions.lanjut_diminta_pada timestamptz`.
  - It is nullable with no default, so **no existing row changes value**.
  - It also creates a new table, `pengerjaan_izin_lanjut`, with its index.
  - It inserts two rows into `orang_lampiran` and three into `client_rpc_registry`. The preservation query fingerprints
    neither table.
- **`20270121250000` changes functions only.** It redefines `pengerjaan_saya` and drops and recreates
  `daftar_pengerjaan`, with grants restated. No column, no data.

### Finding: the query must leave the new column out of line 58

Line 58 fingerprints `to_jsonb(t) - baru` over ended sittings, and `baru` lists only `pengendali_sesi` and `generasi`.
The new column then appears as a `null` key on every row, so line 58 moves with no data changed.

**Shown on this run:**

- The AFTER read with the query as drafted (`after-290-as-drafted.txt`) moves line 58, `59234945…` → `2f889f46…`.
- With `'lanjut_diminta_pada'` added to `baru` (`preservation-A3-after-baru3.sql`), line 58 holds.

**Proposed fix (Bob's draft, Sharon's check):** one line.

```sql
baru as (select array['pengendali_sesi', 'generasi', 'lanjut_diminta_pada']::text[] as k),
```

The header should then say that A3 adds three columns to `assessment_sessions`.

## The query

- **The query:** `preservation-A3.sql` and `step0-A3-lineage.sql`, both on `claude/bob-41-master-plan` at `4bd22619`.

  | File | sha256 |
  |---|---|
  | `preservation-A3.sql` | `66d5da1a0e6ecc1bc9b6a54db408a732fe0456ed62985c32361d8f9717accd60` |
  | `step0-A3-lineage.sql` | `017e0ebfdcd55b1075ac5192c88d94b90200ad03bb6cfac3530890107fbab88e` |

- **The BEFORE read** ran the query unchanged, read only, with both `batas` values null.
- **The AFTER reads:**
  - `preservation-A3-after.sql` has the two printed values written in: cutoff `2026-11-19 01:25:35.001595+00`, audit
    watermark `324`.
  - `preservation-A3-after-baru3.sql` is the same, plus the `baru` fix above.
  - Every proof read uses the second.

## The steps

1. **Reset to main.** Reset the local database from a worktree of `origin/main` at `7ba18b03`, using main's migrations,
   seed and fixtures: **284 migrations, the latest `20270121110000`**.
2. **Fixtures and sittings.** Loaded main's `selftest/db/fable01`–`fable09`. With main's own functions, started two
   learners' Pemetaan Awal:
   - `a85045ae…`: open, no answer;
   - `77ed5268…`: two answers, finished (FINALIZED).
3. **Step 0 at 284** (`step0-284.txt`).
   - Lines 1 and 2 read 0.
   - Line 3 reads 4 definitions, 4 roots, 0 with a predecessor.
   - **Line 4, the S0-1 reference** for staging's step 0: four row triggers on `assessment_definitions`
     (`quick_rules_fixed`, `status_guard`, `taught_immutable`, `tenant_immutable`), in full in the file.
4. **BEFORE read** (`before-284.txt`).
5. **Applied the merged head's six migrations** from `claude/a3` at `05354e4f`, with `supabase migration up --local`.
   Result: **290 / `20270121250000`**.
6. **AFTER reads** (`after-290-as-drafted.txt`, `after-290.txt`), then the proofs, each read after the previous one.

## Sharon's six proofs

| Proof | Diff | Holds |
|---|---|---|
| (1) no plants: only lines 10 and 78 move; line 81 reads 0, ended 0 | before → `after-290`: **only line 10** (`284 / 20270121110000` → `290 / 20270121250000`) **and line 78** (`4 without a root` → `0 without a root; 4 are their own root`). Line 81 `0 of 3 (ended 0)` on both | **Yes**, with the `baru` fix; without it line 58 moves too |
| (2) a first `record_answer` on an open pre-cutoff sitting: line 81 reads 1, ended 0 | `after-290` → `proof2-first-answer` (as the learner, on a fresh session): **only line 81**, `0 of 3` → `1 of 3 (ended 0)` | **Yes** |
| (3) `note_item_view` on an ENDED pre-cutoff sitting: after V-2 it must read 0 | `proof2` → `proof3-ended-view` (as that learner): **no line moves**; line 81 stays `1 of 3 (ended 0)` | **Yes** |
| (4) a definition's title update moves line 77 only | `proof3` → `proof4-title`: **only line 77** | **Yes** |
| (5) `generasi = 2` on a pre-cutoff sitting makes line 80 read 1; the same on a pre-cutoff response makes it 2 | `proof4` → `proof5a-sitting`: **line 80** `0` → `1`. `proof5a` → `proof5b-response`: **line 80** `1` → `2`. Nothing else moves | **Yes** |
| (6) a response value update on an ended sitting moves line 79 | `proof5b` → `proof6-value`: **only line 79** | **Yes** |

Proofs 4 to 6 are written past the triggers (`session_replication_role = replica`), as an out-of-band write would be.

## The step-0 plant, and a second finding

**The plant.** On a fresh 284 database, with main's fixtures loaded, the harness planted an ambiguous chain:

- definition `c45945de…`, in a module that supersedes `6a5acb97…`'s module;
- in the superseded module, two definitions of its title and mode: `6a5acb97…` and `a762f59c…`, versions n and n+1.

**Step 0** (`step0-plant-284.txt`): line 1 reads **`1: c45945de… (2)`**, and line 2 reads 0. **The plant is caught.**

**The migration on that copy** (`plant-migration-up.txt`) **aborts at `20270121210000`.**

- The error names the definition: «A3, ruling 46: definition c45945de… has 2 predecessors … its line is ambiguous».
- 210000's changes are absent: no `lineage_root_definition_id` column, and nothing after it (no `lanjutkan_di_sini`).

**Finding: it stops at 285, not 284.** The CLI applies each migration in its own transaction, so `20270121200000` was
already committed when 210000 failed. The database reads `285 / 20270121200000`.

- **The state is consistent:** 200000 only replaces four function bodies and changes no row.
- **But it is not the "aborts cleanly at 284" the header expects.**

Options:

- **(a)** Keep step 0 as the gate that prevents it, which is its purpose. State in the header that a failure at 210000
  leaves 285, with 200000 applied and harmless, and that re-running after the data is fixed applies the remaining five.
- **(b)** Apply the six in one transaction at the promotion.

This is for Sharon and Bob to decide. I recommend (a).

## Still waiting

The staging BEFORE read waits for the owner's authorisation.
