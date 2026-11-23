# Z3 stream A (K-01 screens) · review at `36299159`, captures `b8b00422` (Daisy, 23 Nov 2026)

> **What holds now:** **PASS with two conditions.**
> - **C-1:** the learner's summary row gives no reason for «belum mencapai target» at 83 % against 60 %.
> - **C-2:** on the teacher's page, the V2 line splits the figure from its verdict.
> - **Every K-01 string matches** ruling 78's words, the queue line, the gate-unknown words, V2's final words, and N-14 and N-15, word for word.
> - **The C2 teacher line** (`gerbang_tanpa_tujuan`) is checked in its addendum.
> - **Read:**
>   - the `hle.ts` diff `706fe8c5..36299159`;
>   - `CATATAN-Z3A.txt`, all 390 rows;
>   - the README.

## 1 · Rows

| Shot | Result |
|---|---|
| 01 · learner result, gate | `belum_gerbang` under «Belum mencapai target.», then «Pelajari lagi:» with the gate objective, and the `safety.missed` line. Correct |
| 12 · learner result, C2 | `belum_gerbang` with no list; the sentence makes no reference to «di bawah ini». Correct |
| 02 · learner summary, gate | **C-1** |
| 13 · summary, V2 | «Uji Penguasaan ulang sedang berlangsung. …» on the row, neutral. Correct |
| 15 · summary, D14 | Recalculated marker. Correct |
| 03 · teacher, gate | «belum mencapai target: soal penting belum tepat · target 60%», then «Minta membaca lagi». Correct |
| 09 · teacher, gate unknown | The tag is correct; the `_arti` line is placed after the link (see (b)) |
| 14 · teacher, V2 | **C-2** |
| 04 · N-14 | `tujuan_arti`, word for word |
| 05 and 10 · «Minta membaca lagi» | `ulang.gerbang` pre-ticked; `ulang.tak_diketahui` not ticked. Correct |
| 06 and 11 · queue | `hasil_gerbang` and `hasil_tak_diketahui`, word for word |
| 08 · N-15 | `tujuan_gagal` in «Murid yang perlu penguatan». The component-drawn shot is accepted (README) |

**Recovery walks** (09 → pulih, 11 → pulih, 08 → pulih): unread is said as unread, never as reached. On reading, the verdict appears. All three pass ruling 81's three questions.

## 2 · Conditions

- **C-1 · The summary row in the gate case.**
  - Hasil Belajar shows «Uji Penguasaan: 83%. Target bab ini: 60%.» and «belum mencapai target», with no reason, so the learner reads a contradiction.
  - **Add, on that row only when the gate failed,** new key `hasilbelajar.gerbang`:
    - ID: «Ada soal penting yang belum tepat, jadi target bab ini belum tercapai.»
    - EN: «An important question is not right yet, so this chapter's target is not reached.»
  - It goes directly after the figures, neutral, with no icon.
- **C-2 · The teacher's row order with V2.**
  - Shot 14 reads «83% · Uji Penguasaan ulang sedang berlangsung… · belum mencapai target: … · Minta membaca lagi». The status line sits between the figure and its verdict.
  - **Order:** figure → verdict tag → `hasil.ulang_berjalan` → «Minta membaca lagi».
  - That matches ruling 81: the latest completed result stays visible, with its verdict, and the attempt in progress is a separate, secondary status.

## 3 · Second Eye's questions

- **(a) No percentage on the gate objective in «Pelajari lagi»: yes, right.** Its own figure can be at or above the mark, and a number there would contradict the reason it is listed.
- **(b) The gate-unknown `_arti` line goes above «Minta membaca lagi»,** directly under the tag it explains. That way, a screen reader and an eye meet the reason before the action.
- **(c) Is a Z6 defect, for stream B's sweep run 2:**
  - **«Menga jar» breaking in the 320 header:** yes, Z6's no-mid-word rule. The Mengajar shell must take the same place-word row as `CangkangPengalaman`.
  - **«target 60 %» above «Murid» on the request page:**
    - Z6 if it is a wrap or reflow artefact at 320.
    - If it is the source order at every width, it is pre-existing layout, for the ruling 79 audit, unless trivial.
    - The sweep decides which, and says so.
