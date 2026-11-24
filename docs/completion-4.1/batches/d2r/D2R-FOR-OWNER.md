# D2-R · the certificate refinement: for the owner (Bob, 24 Nov 2026)

**D2-R is the last of 4.1's gates (G-3).** G-1 (Z on staging, ruling 88) and G-2 (Z-READINESS closed) are done. When D2-R is accepted on staging, **4.1's gates are closed** (ruling 71), and ruling 79's audit opens.

## 1 · The candidate

| | |
|---|---|
| **Branch** | `claude/d2r` at **`5550e508`**, from `claude/next-base` `055738ba` (main `61a6ff9e` plus ruling 83's harness) |
| **Migration** | One: `20270124100000_a_certifying_sitting_offers_no_help_and_discloses_counts_only.sql` (**308 → 309**) |
| **Change against main** | 103 files: D2-R, ruling 83's `scripts/dev/` harness, and records |
| **CI of record** | ci **45329600686**, journeys **45329603910**. *Running at 05:10Z; the result is filled in below once both are green, with every job in one attempt* |

**What it does:** spec revision 4, §7 to §7.4, with rulings 74a, 74b, 90 and 91 applied.
- **No help in certifying sittings.** The policy is captured and sealed on each sitting at its start. Open sittings are backfilled from the old policy.
- **Certifying results disclose counts only.** This is enforced in the database for every learner route: no key, no per-question correctness, no explanation, no per-objective figure.
- **74a's guidance comes first, with the counts secondary:**
  - «Lulus.» or «Belum lulus.»;
  - the certificate (being prepared, issued, or no line at all where none can exist);
  - «Baca lagi:» advice on any below-mark section, pass or fail;
  - the retake line when not passed;
  - the counts;
  - what is not shown.
- **No percentages or Pemetaan Awal comparison** on learner-facing certifying results, including Hasil Belajar and its print (ruling 91).
- **«Predikat» removed** from the certificate, the A4 sheet, print, the learner's page and `/verifikasi`. The public RPC returns null.
- **The new wording:** «Materi Pembelajaran»; «Kesempatan ke-{n}»; the «no help» lines; reading advised before Uji Penguasaan; `verifikasi` reads «Lulus».
- **R-1:** a learner who has left, transferred or been rolled over is refused start, resume, answer and submit, in the database.
- **Ruling 90:** the two support lines promise no response time.

## 2 · Reviews: all passed (conditional only on that CI)

| Reviewer | Verdict | Record |
|---|---|---|
| **Sharon** | **PASS** on 42f6f432, then on the deltas to 5dace1ad and to **5550e508**. R-1 closes with CI | `D2R-BATCH-42f6f432.md` and its addenda |
| **Daisy** | **PASS on 5550e508**, with no finding; all three certificate states seen | `TINJAUAN-D2R-5550e508.md` (`f94f7fcc`) |

**The restated tests** (Sharon: restatements, not weakenings):
- F19-Q01 to Q04;
- C1W-S06;
- Z-R15-01;
- C1W-J01;
- DAISY-26 (whole again, with no exemptions).

## 3 · Promotion evidence, ready

- `docs/completion-4.1/d2r/evidence/step0-D2R.sql`: read-only; it counts sittings by mode and `bersertifikasi`.
- `docs/completion-4.1/d2r/evidence/preservation-D2R.sql`: BEFORE and AFTER, read-only. Expected:
  - **only line 10 moves** (the migration);
  - the `mode_policy` changes and their `mode_policy.changed` audit rows are named as expected, and no preserved line reads them (Sharon, note 1, closed);
  - the backfill writes only the three new columns.
- **After the promotion:**
  - `v6-pre-request.sql` OK;
  - the `periksa` counter rising, and its md5 equal to main's build;
  - `c3w-r3-bahan.sql` OK;
  - a read that every certifying mode has assistance off.

## 4 · What you are asked to authorise (in sequence, the same way as Z, ruling 87)

1. **Open the pull request** `claude/d2r` → `main`, at head `5550e508`.
2. **Merge it** once every required check is green, the reviewed code is unchanged and the branch protections are satisfied.
3. **Promote to staging, 308 → 309**, with step 0 and the BEFORE read taken before the merge, then the promotion, AFTER and the after-promotion checks, all reported.

**Production stays untouched at 111.** Sharon's carry-over for Z also applies to D2-R: no production promotion without its own authorisation and step-0 counts.

## 5 · When D2-R is accepted on staging

- **4.1's gates are closed** (ruling 71).
- **Ruling 79's audit opens.** The ledger has 38 rows; the scripts are final; the synthetic world and the journeys run on CI.
- **Your remaining open items** are unchanged and don't block it:
  - counsel's scope and fees;
  - PRQ-4;
  - the PR-12 and PR-15 names;
  - R-2;
  - the backup.
