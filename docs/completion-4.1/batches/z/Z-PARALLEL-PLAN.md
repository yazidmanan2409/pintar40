# Z · the parallel plan (Bob, 23 Nov 2026; the owner's request to shorten elapsed time without weakening anything)

**Nothing in the acceptance criteria changes:**
- every row keeps its red-first test, its reviewer and its rendered and recovery checks (rulings 78–81);
- the final candidate gets one full pre-flight, then CI and the journeys once.

**What changes is who builds what, and when.**

## 1 · Two builders, split by what they touch

| Stream | Builder | Rows | Touches |
|---|---|---|---|
| **A · data and verdict** (the critical path) | Second Eye, `claude/z` | Z0 (R-19, the D-1 guard skeleton, the K-01 inventory); Z1 (D-1, V2, K-07, K-01 SQL); Z2 (D-6, V5, V6, R-27(b)); then the **verdict screens** (K-01's screens across the inventory, V2's line); Z8's Sharon items | **All migrations** (300 → 307), all SQL, `src/lib/pengajar.ts` verdict reads, the result, ulang, sertifikat and verifikasi verdict code |
| **B · UX and words** (no SQL) | A new implementation session, `claude/z-ux` (from `claude/z`) | Z3's non-verdict rows (K-02 «Sudah kuat», K-03, K-04, K-05, M1, M2, R-8); Z4 (S-12, R-26 items 1+4 including **`TombolKirim`**, R-27(a), R-27(c), R-26 item 2, S-15, S-11's TypeScript, S-08, S-13); Z5 (R-10 + N-9, S-01, S-02 to S-07, S-16, R-26 item 3); Z7 (all words: T-03, T-09, T-02, S-09, S-10, S-14, N-1, N-2, R-15's strings) | Components, pages, route handlers, `src/lib/hle.ts` words. **No migration, no SQL** |

**The boundaries that keep them apart:**
- **SQL and migrations are A's only.** B never adds a migration. If a B row needs one, it stops and asks Bob.
- **`TombolKirim` and `hle.ts`'s existing keys are B's.**
  - A adds only the new keys its verdict screens need, in one block marked `// Z-A`. B changes the existing keys.
  - Their merges then touch different lines.
- **Shared rows have one owner:**
  - S-11's TypeScript normaliser (B) uses the same fixture list as R-27(b) (A). B takes A's fixture file once A commits it.
  - K-02 (B) reads `reading_map`, which D-1 (A) restates. K-02 is UI only. B builds it on today's reader, and A's Z1 tests run it on the restated reader.
  - The reopening page: A does R-27(b) in SQL, and B does S-12, then R-26 item 1, then R-27(a). **One rendered recheck of the page,** after both are in.
- **Integration:** Second Eye merges `claude/z-ux` into `claude/z` **with a merge commit** (no rebase) at two points: after Z2, and before the candidate.

## 2 · What else runs alongside

- **Reviews run beside the build:**
  - Sharon reviews Z1 while A builds Z2, and Z2 while A builds the verdict screens.
  - Daisy reviews each B chunk while B builds the next.
- **Bob prepares the promotion evidence in parallel:**
  - `preservation-Z.sql` (from C3w-1's), with its header written as the migrations land;
  - the expected AFTER lines;
  - the after-promotion list (C3W-R3-BAHAN, V6's new check, Sharon's (b)–(d)).

  So Z9 runs evidence that is already prepared.
- **D2-R** (certificate refinement, after Z): its specification review by Sharon and Dr Gladys can proceed now. Its build stays after Z, because it touches K-01 and K-05's code.

## 3 · Verification (ruling 81, unchanged)

- **During each chunk:** focused checks only.
- **One full pre-flight on A after Z2,** which also covers B's work merged at that point.
- **One full pre-flight on the final candidate,** then CI and the journeys once.

## 4 · Protecting the candidate

**After the second integration merge:**
- the only changes allowed are fixes for review findings on Z rows;
- nothing new enters Z, and anything new goes to the ruling 79 audit;
- the candidate is frozen when Sharon and Daisy pass it.

## 5 · The revised critical path

| | Days |
|---|---|
| **Stream A:** Z0 0.5, Z1 3.5, Z2 1.75, verdict screens about 1.25, Sharon's Z8 items 0.25 | **about 7.25** |
| Stream B, in parallel: about 6.25 (Z3 rest 1.75, Z4 1.5, Z5 2.25, Z7 0.75) | (off the path) |
| Integration, Z6's sweep over the final pages, Z8's rendered verifications, Z9 | about 2 |
| Review and round slack | about 1.5 |
| **Critical path** | **about 11 working days**, against about 15.5 plus 3. **4.1's gates close in about 3.5–4 weeks** |

**The cost:** one more session, and the integration merges, which take about half a day in total, inside the estimate. **The risk:** merge conflicts in `hle.ts`, contained by the key-block rule above.
