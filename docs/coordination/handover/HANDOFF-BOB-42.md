READY FOR GATE: CI #243 (run 36701992688) green on 8414df1e7273721558185a8512a1afa0ebc22ea6

# Bob → coordinator: BOB-42 (an Uji Cepat ends when its window ends)

**SHA:** `8414df1`, its own commit, on top of BOB-25's hand-off (`4176f9c`).
- **Manifest:** BOB42-S01. The lane's manifest is v128 with 446 ids.
- **CI:** CI #243 (run `36701992688`, https://github.com/yazidmanan2409/pintar40/actions/runs/36701992688) on `8414df1e7273721558185a8512a1afa0ebc22ea6`, green, 33 of 33 jobs. BOB-25's commits under it passed their own gate (CI #241, merged as `7727c8e`).
- D-067: a PINTAR 4.0 correction.

## CHANGED
**The defect (as the board has it).**
- Nothing moves an assessment assignment from OPEN to CLOSED when `closes_at` passes. There is no job, and `launch_quick_assessment` does not close the class's earlier one.
- `berjalan()` (`src/lib/pengajar.ts`) selected by status alone.
- So the Uji Cepat page's `hidup = buka.find((b) => b.adHoc)` found the first Uji Cepat for ever, and drew «Uji Cepat sedang berjalan» with «0 menit» left and no way back to Atur. **After a class's first Uji Cepat its teacher could never launch another.**
- «Keadaan hari ini» (`keadaanHariIni`, which takes `keadaan === "OPEN"`) kept presenting windows that had passed as open.
- The database never refused the second launch: `launch_quick_assessment` has no such rule. The page was the lock.

**The correction: the window decides, in the one reader.** No job, no migration, and no background architecture (D-067(c)).
- **`keadaanEfektif(status, closes_at, sekarang)`** (new, exported): an OPEN assignment whose `closes_at` has passed is CLOSED. It closes exactly at `closes_at`; a window with no end stays open; every other status is as stored.
- **`pilihBerjalan(baris, sesi, keadaan, sekarang)`** (new, exported, pure) returns each assignment in its effective state, with the same counts and fields as before. `berjalan` keeps its two RLS-bounded reads and chooses through it with `Date.now()`.
- **When CLOSED is asked for**, `berjalan` also reads the OPEN rows, since one whose window has passed is closed (`bukti` and `siapa` ask for OPEN and CLOSED).
- **Every teacher surface that reads `berjalan` follows with no change of its own:**
  - the Uji Cepat page, which draws Atur once the window has passed;
  - «Keadaan hari ini» on «Lihat bukti»;
  - the teacher's landing and the class page;
  - «Siapa sudah» and the Langkah page.
- **What learners see is unchanged.** `my_open_assessments` already reads the window, and nothing in the database changed.

## PROOF
**BOB42-S01** (db, `selftest/bob42.test.ts`).
- **The database half runs in one rolled-back transaction, with every read made as the teacher through RLS:**
  - the bootstrap school's teacher launches an Uji Cepat (3 questions, 20 minutes) in a class;
  - its learner starts, answers and finishes it, so a result exists;
  - the teacher launches a second in the same class (40 minutes).
- **Then the decision itself, `pilihBerjalan`, executed over those rows at three clock times:**
  - **Launch → active:** while its window is open it is the page's running Uji Cepat, OPEN, with minutes left and its hand-in (1) counted.
  - **Expiry → no longer active:** a minute after `closes_at`, nothing is running, so the page draws Atur, the launch form.
  - **A second launch succeeds:** the database launches it, and afterwards it alone is running.
  - **The first Uji Cepat's evidence is preserved:** it is kept as CLOSED with its hand-in (1 of 1). Its sessions and results hash the same before and after the second launch, and it has at least one result.
- **«Keadaan hari ini»:** over `bukti`'s OPEN and CLOSED, `keadaanHariIni` presents only the open one. With only the passed window, it presents that one as closed, not as open.
- **The boundary:** `keadaanEfektif` is CLOSED at `closes_at` and OPEN a millisecond before. A window with no end stays OPEN.
- **The readers:** `berjalan`'s source chooses through `pilihBerjalan` with `Date.now()` and reads OPEN rows when CLOSED is asked for. The Uji Cepat page still takes its running Uji Cepat from `berjalan([id])`.
- **Red on today's code** (`daa5721`, the same test file): `berjalan decides by status alone: src/lib/pengajar.ts has no pilihBerjalan, so an OPEN Uji Cepat whose window has passed is «sedang berjalan» for ever`.
  - On that code `berjalan` returns the first Uji Cepat after its window exactly as while it ran: status OPEN, `sisaMenit` 0.
  - `hidup` is therefore that Uji Cepat, and the page never reaches Atur.
- **Narrow (the board's third point):** an open window still shows as running (the first point above), and nothing learners see changes.

**Local, on `8414df1`, on fresh CI-shaped databases** (a new cluster; the migrations through the Supabase CLI and the seeds; `en-US` ICU; Supabase's default privileges emulated):
- **Full suite:** 413 passed, 0 failed, 32 justified skips. The one unjustified skip, UX1-PIMPINAN-AKSES-01, needs network, as before.
- **Plants:** 132 of 132.
- **Every db red-case gate in `ci.yml`** (22), each on its own stack from freshly extracted scripts: all exited 0 after really running.

**Staging (after the merge; your walk):** Q3–Q5 PASS on the synthetic class **without a data reset**.
- The Uji Cepat run 15 launched on 29 Sep has long passed its window, so the page should draw Atur at once.
- «Keadaan hari ini» should no longer list it as open.

## CI
## CI
- **CI #243 (run `36701992688`, https://github.com/yazidmanan2409/pintar40/actions/runs/36701992688), green, 33 of 33 jobs.** It was a `workflow_dispatch` on `claude/quirky-meitner-a04smj` at `8414df1e7273721558185a8512a1afa0ebc22ea6`, with `main` `daa5721` merged in, and I watched it to the end.
- **The strict selftest contract:** 446 passed, 0 failed, **0 skipped**, with BOB42-S01 among them.
- `main` has since moved to `7727c8e`, which is BOB-25's merge of this lane's own commits plus board notes. I merge it into the lane next, and it changes no BOB-42 file.


## CONTRACT
- `berjalan(nodeIds, keadaan)` has the same signature and the same `Berjalan` shape. `keadaan` is now the assignment's effective state.
- There are new pure exports, `keadaanEfektif` and `pilihBerjalan`, with their row types.
- No RPC, no query shape and no grant changed.

## MIGRATIONS
None.

## COPY
None.

## D-060
- **Metric catalogue: unchanged**, because nothing reads evidence for a metric or computes one.
- **Engine: unchanged**, because nothing grades, assembles or finalizes. The window still decides for learners exactly as before.

## QUESTIONS
None.

## READY
Yes.

---
### Summary (ready to paste)
```
BOB-42 (8414df1), ready for the gate in CI #243 (run 36701992688) on 8414df1
berjalan() now returns each assignment in its effective state: an OPEN one whose closes_at has passed is CLOSED
(keadaanEfektif; pilihBerjalan pure). The Uji Cepat page draws Atur once the window has passed, so a second launch
works; «Keadaan hari ini» no longer presents passed windows as open. No job, no migration, nothing learners see.
BOB42-S01: launch → active → expiry → nothing running → second launch runs alone, first kept CLOSED with its hand-in
and its sessions/results unchanged; red on daa5721. D-060: catalogue and engine unchanged.
```
