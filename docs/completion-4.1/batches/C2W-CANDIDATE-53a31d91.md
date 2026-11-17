# C2w · the candidate: `53a31d91`

**The ONE C2w candidate is `53a31d911aaa74e74240cbf41ff790e256bde235`** on `claude/c2w`. It is a development branch: nothing is merged or promoted, and nothing has been written to staging or production.

## The final migration

- `supabase/migrations/20270121110000_a_reviewer_notes_what_a_wrong_option_reveals.sql`, sha256 `54b6569df6d08535c6c44fcb180ea3bdf78cc15db81ae10d06a32fbc3e585196`.
- It includes fde309c5's `orang_lampiran` row for `catatan_peninjau.ditulis_oleh` (BEBAS), accepted by Sharon (67ec2ed7).

## Migrations, main → candidate: 282 → 284

`origin/main` is an ancestor of the candidate. The two added files:

```
A	supabase/migrations/20270121100000_a_distribution_s_place_for_its_controller.sql
A	supabase/migrations/20270121110000_a_reviewer_notes_what_a_wrong_option_reveals.sql
```

## The full pre-flight on `53a31d91` (local, fresh reset, fresh build)

```
commit 53a31d911aaa74e74240cbf41ff790e256bde235
== lint
rc=0 
== typecheck
rc=0
== build-identity
rc=0 # pass 11 # fail 0 
== whole suite (fresh reset, fresh build)
rc=0
1242 passed, 0 failed, 0 skipped, 1 justified skips accepted (local only), 0 contract problem(s) → GREEN
== planted defects (all gates)
rc=0
175/175 plant(s) proved their gate
== red-case job, locally
rc=0
all 11 red-case group(s) passed on 53a31d91
```

- The one justified skip is accepted locally only, as on every earlier candidate.
- Plants: every planted defect turned its own gate red. Red-case: all 11 groups, including the DB contract and each planted-defect group.

## What the candidate carries, after `12943afa` (pushed earlier, pre-flight green 1242/0)

| Commit | What |
|---|---|
| `55c75e37` | C2W-K01 red first: the notes' panel takes no other surface's class, and sets each note and option apart (found in the B7 captures) |
| `328e69eb` | Product: `.pin-catatan-peninjau` replaces the integrity note's `.pin-catatan`; spacing in experience.css, tokens only |
| `53a31d91` | Evidence: B4/B5/B7 captures for Daisy, `docs/completion-4.1/batches/c2w-catatan-328e69eb/` [skip ci] |

## The reviews' state

- **Sharon:** D1 to D4 are met (67ec2ed7, 93f3924b). For the candidate she asks for the preservation pair restated, with `catatan_peninjau` as a new table and her lines 65 to 68 kept.
- **Daisy:**
  - §8 (1fca435c) is built in `12943afa`.
  - The B4/B5/B7 captures went to her with this candidate, for her screen review.

## Not done, and why

**The local preservation dry run (282 → 284) has not been run.** Bob's order (23:00): it comes after his preservation-C2w.sql header check and Sharon's delta check.
