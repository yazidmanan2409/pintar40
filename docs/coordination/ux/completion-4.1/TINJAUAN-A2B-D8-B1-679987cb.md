# A2b · D8 batch 1 review (Daisy, 16 Nov 2026)

> **What holds now:**
> - **BLOCKED on one point of evidence, D8-3** (§1): its six captures show the **player**, not the start screen. Recapture only; no code change is known to be needed.
> - **Everything else in the batch: no blocker.**
>   - D8-1, D8-2 and D8-4 hold at 390, 320 and 1280, with 0 px overflow.
>   - The WIB and WITA zone words are right everywhere I looked.
>   - R-1 holds: the teacher's other class shows nothing.
>   - My R-B line renders as written.
> - **Three small corrections for the same commit** (§2), and answers to Second Eye's four points (§3).
> - **Read:** `claude/a2b` at `679987cb`, `docs/completion-4.1/batches/a2b-d8-batch1/` (84 screens, `CAPTURE-LOG.txt`). I opened the WITA set and spot-checked WIB.

## 1 · Blocker: D8-3 does not show the start screen

- All six `d8-3-*` files open on `/belajar/…/pemetaan` and show **a running sitting** (the question «Bentuk paling sederhana dari 4/8 adalah?», «Berikutnya»). The fixture learner already had a sitting open there.
- `CAPTURE-LOG.txt` agrees, for both zones: `d8-3-*-papan-ketik  no disabled Mulai`. The walk tabbed through answer options A–D.
- **So none of these is shown or walked:**
  - `galat.maintenance_no_new_start` beside a disabled «Mulai»;
  - `pemeliharaan.pita.asesmen_baru` beside it;
  - the keyboard order.
  The README's "asserted" may hold in the test, but the screens do not show it.
- **Needed:** recapture D8-3 with a learner of 5S who has **no open sitting**:
  - the class window's T−15, the class window under way and the school window under way;
  - WIB and WITA, at 390 and 320;
  - the keyboard walk in the log.
- These six files are what D8-4 should be. Keep them as D8-4's extra states, or drop them.

## 2 · Corrections (small; same commit)

| # | Where | Now | Should be | Why |
|---|---|---|---|---|
| C-1 | Banner and pause page, class scope («Selama pemeliharaan, pekerjaannya tidak dapat diubah»; «Pekerjaannya tidak dapat diubah sampai …») | «pekerjaannya» | «pekerjaan kelas {kelas}» (EN «class {kelas}'s work») | «-nya» has no clear owner. On `/belajar` the banner sits above every class's work, so «this work» could mean all of it |
| C-2 | The failed-read line (§4 of my `A2B-RA-KALIMAT.md`) | it is followed by the stage's own «Pemeliharaan untuk kelas 5S mulai pukul 14.15 WITA.» | **drop the stage's start sentence while the last-check line shows.** Keep the rest (the expected end, the effects) | My spec said only "replace the countdown". The start then appears twice. Mine; Second Eye's point 2 |
| C-3 | Any shown time on a day other than today in the school's zone: the banner's start and end, the pause page, the last-check line | a time alone | «pukul {jam} {zona}, {hari} {tanggal}» (e.g. «pukul 01.00 WITA, Selasa 17 Nov»); EN «at {jam} {zona} on {hari} {tanggal}» | Second Eye's point 3. An end after midnight with no date reads as earlier the same day |

## 3 · Second Eye's four points

1. **«diperpanjang sampai …»: optional, not needed for the freeze.**
   - The later end shown alone is true.
   - If the status read can tell cheaply that the end changed after the window began (A6's audit row), replace «Perkiraan selesai pukul {jam} {zona}.» with:
     - ID «Pemeliharaan diperpanjang. Perkiraan selesai kini pukul {jam} {zona}.»
     - EN «Maintenance has been extended. It is now expected to end at {jam} {zona}.»
   - Do not add a new reader only for this. Otherwise it is a note for the next batch.
2. **Repetition: yes, fix it.** C-2 above.
3. **Dates: yes, everywhere.** C-3 above.
4. **No reason line until D2: fine.** I will check it in batch 2 with D8-5.

## 4 · Notes for the next batch (not blocking)

- **N-1: on the player during a class window (D8-4),** the banner's «Pekerjaan … tidak dapat diubah» comes before «asesmen yang sedang dikerjakan tetap dapat diselesaikan». A learner mid-answer reads the restriction first. On the player alone, `pemeliharaan.pita.asesmen`'s own words could lead.
- **N-2:** the teacher's T−15 banner says «Asesmen baru tidak dapat dimulai …», a learner's sentence. It is true, but a teacher reads it about learners.

## 5 · Anticipation

| # | Defect | Whose | Anticipable? | Question |
|---|---|---|---|---|
| A2B-D1 | D8-3 captured on a learner with a running sitting | build (capture) | **Yes** | **5**: where it renders, and for whom: the start screen exists only without an open sitting |
| A2B-D2 | The failed-read line repeats the start (C-2) | **mine** | **Yes** | **4**: before and after. I did not read the stage as it renders after the swap |
| A2B-D3 | «pekerjaannya» without an owner (C-1) | build | **Yes** | **5**: where it renders, above work from several classes |
| A2B-D4 | Another day's time undated (C-3) | build, and my D8 list | **Yes** | **2**: the neighbouring case, an end after midnight |
