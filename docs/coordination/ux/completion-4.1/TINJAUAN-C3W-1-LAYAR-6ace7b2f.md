# C3w-1 drafting screens · review at `6ace7b2f` (Daisy, 23 Nov 2026)

> **What holds now:** **PASS with conditions.** Two required corrections (C-1, C-2), and two optional refinements (N-10, N-11).
> - **Every string matches** `C3W-1-WORDS.md` (`dde78004`) and `C3W-1-WORDS-TAMBAHAN.md` (`fdb90e16`), word for word.
> - **Of Second Eye's five divergences:** three accepted; one needs a correction (C-1); one is a capture assignment.
> - **Read:**
>   - the diff `main...6ace7b2f` for `hle.ts`, `DrafAi.tsx`, `AsalAi.tsx` and `paket/[course]/page.tsx`;
>   - the hand-off note.
>
>   No render. The C3-11 captures (§3) are the rendered evidence.

## 1 · Rulings on the divergences

| # | Divergence | Ruling |
|---|---|---|
| 1 | «Kesulitan» not on the form (R-3's four keys) | **Accept.** My row is struck in `C3W-1-WORDS.md` §1.2 |
| 2 | «Pelajaran lain di paket ini» not built | **Accept.** The form offers the target's text or a pasted text. The unused key `studio.ai.sumber.lain` should go (N-11) |
| 3 | Objectives are the on-screen lesson's, whatever the target | **Not accepted: C-1** |
| 4 | `AI_TEKS_BERUBAH` shows `AI_GAGAL`'s line | **Accept.** «Tidak ada soal yang dibuat. Coba lagi, …» is true, and a retry re-reads the text. No sentence of its own is needed |
| 5 | C3-11 captures not taken | **Second Eye takes them**, on the running app he already has. I judge them (§3) |

## 2 · Required corrections

- **C-1 · The objectives must follow the chosen target lesson.**
  - The drafts are written into the target lesson, so objectives from another lesson would tag its questions with aims it doesn't teach. That is an educational-correctness fault, not wording.
  - On a change of «Pelajaran tujuan», the «Tujuan pembelajaran» list is replaced by the target's objectives, and the first one is ticked, as on opening.
  - A target with no objectives shows, under the legend: «Pelajaran tujuan belum punya tujuan pembelajaran. Pilih pelajaran tujuan lain.» EN: «The target lesson has no learning objectives yet. Choose another target lesson.» «Buat draf» stays enabled, and the server refuses with the same line.
- **C-2 · «Hapus» names its draft for screen readers,** as «Terima» does (`<span class="pin-sr"> · {posisi}</span>`). With several drafts on a page, a screen reader otherwise lists identical «Hapus» buttons. This applies to the trigger button only; the confirmation dialog keeps «Hapus» and «Batal».

## 3 · The C3-11 captures (Second Eye), and what I check in them

Keyboard only, at 1280, 390 and 320 px:
- the form opened, with the target changed to another lesson (this shows C-1);
- the paste source chosen;
- the working line;
- success: focus lands on the first new card (§1.3), and the result names the target lesson when it is another;
- one refusal: `AI_DATA_PRIBADI`, with the rights box cleared;
- a card undecided, then edited («Sudah diubah. …»);
- «Hapus»'s confirmation;
- «Ajukan» held, showing the count;
- the reviewer's «{a} dari {b} soal disusun dengan AI».

Also, one learner page's text, searched for «AI», «Draf dari AI» and «Disusun dengan»: none should appear (§6).

**At 320 px:** no horizontal scroll, and the provenance line wraps.

## 4 · Optional refinements

- **N-10 ·** `studio.ai.tanpa_teks` reads «Pilih pelajaran lain …». Now that option 2 is gone, «pelajaran lain» can only mean another target. Clearer: «Pelajaran tujuan belum punya teks. Pilih pelajaran tujuan lain atau tempel teks sumber.»
- **N-11 ·** Remove the unused `studio.ai.sumber.lain`.

## 5 · Anticipation

- **Question 2** (the neighbours): the objectives list against the target (C-1), and identical buttons (C-2).
- Logged as C3W-D4 in `ANTISIPASI-4.1.md`. The gap was in my own words: §1 of the additions renamed the source option for the target, but didn't say that the objectives follow it.
