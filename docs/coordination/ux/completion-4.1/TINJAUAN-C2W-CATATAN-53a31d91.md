# C2w · «Catatan peninjau» screens (B4, B5, B7): review (Daisy, 17 Nov 2026, 23:17 UTC)

> **What holds now:**
> - **No blocker.**
> - **One required correction (C-7):** where «Ganti catatan» sits. Then **one recapture at 390** to show it.
> - **One spacing answer** (C-8, small). One note for the next batch (N-8).
> - **Read:** `claude/c2w` at `53a31d91`, `docs/completion-4.1/batches/c2w-catatan-328e69eb/` (18 files, `log.tsv`). I opened Studio open at 390, the class report at 390, and the replace form at 320, and read the log for the rest.

## 1 · What holds

| Item | Result |
|---|---|
| **Order** (§8.3) | In block A, the on-screen version's note (versi 2) comes first, then versi 1's note under its I-5 line |
| **I-5, Studio** | «Ditulis sebelum kunci soal ini diperbaiki, saat kuncinya masih A. Catatan ini tentang versi 1; kunci yang berlaku sekarang B.» Exact, first line, in `pin-meta` |
| **Replaced notes** | Block B: «Catatan sebelumnya (1)» nested, with «· Diganti pada 18 Nov 2026» |
| **Count** | «Catatan peninjau (3)» counts current notes only |
| **«Tulis catatan»** | Shown on B, which has no note on the version on screen. Right |
| **Hint (§8.2)** | Word for word, including «Jangan menyebut nama atau data murid mana pun.» and the replacing line |
| **Refusal and result** | `role="alert"` «Tulis catatannya, 1 sampai 1000 karakter. Tidak ada yang disimpan.»; `role="status"` «✓ Catatan tersimpan.» |
| **Teacher (B5)** | One note per option. «Peninjau: Kaprodi Bootstrap · 18 Nov 2026», with no version. No earlier-notes disclosure. Under the distribution and the existing key-correction and «belum dikaitkan» lines |
| **Keyboard** | A visible focus ring. Tab order: Ganti A → Catatan sebelumnya (1) → Ganti B → the next question |
| **Print** | Every notes panel is `display: none`, PDF included (O-3) |
| **1000 characters at 320** | No overflow (the panel's scroll and client width are equal) |
| **No «anotasi»** | None seen |
| **Second Eye's two fixes** | The `.pin-catatan` class clash is gone, with Q-15's integrity note untouched. Notes are separated by a dashed rule, options by a solid one. Both visible |

## 2 · Required correction

**C-7 · «Ganti catatan» sits at the END of the option's block, under the older version's note.**
- In block A at 390, the link comes after versi 1's long note.
- The form then opens there, at 320, directly under «Kaprodi Bootstrap · 18 Nov 2026 · versi 1».
- **But it replaces the versi 2 note** at the top of the block (§8.3). A reviewer reads "replace" next to the note it is not about, and may think they are correcting the old one.
- **Fix:** put «Ganti catatan», and the form it opens, **directly under the on-screen version's note**, before the dashed rule and the older notes.
- **Recapture:** `b4-studio-terbuka-390` and `b4-form-ganti-390`.

## 3 · Small

- **C-8 · Space above «Catatan sebelumnya (n)»: yes.** Give it the same top margin as between paragraphs (about 0.75rem). Today it reads as part of the attribution line. No recapture is needed for this alone; it can ride C-7's recapture.

## 4 · Note for the next batch

- **N-8 · The notes panel at 320 is about 188 px wide,** inside two card paddings. A 1000-character note becomes a very tall column. Readable, and no overflow, so not blocking.
  - For Z: reduce the inner padding of nested disclosures at ≤ 360 px, across Studio, not only here. «Riwayat soal» has the same nesting.

## 5 · Anticipation

| # | Defect | Whose | Anticipable? | Question |
|---|---|---|---|---|
| C2W-D3 | C-7: the replace action sits under the note it does not replace | build, from my §8.3 (which did not say where the button goes) | **Yes** | **5**: where it renders, in a block that holds two versions |
