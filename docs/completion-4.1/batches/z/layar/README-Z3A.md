# Z3-A (stream A) · captures and recovery walks for Daisy

> **Taken on the local app** of `claude/z` at `36299159` (Z3-A's screens), `next start` against a fresh local stack (307
> migrations and the seed). Widths 1280, 390 and 320 px, device scale 2, the viewport only (not the full page).
> - **Keyboard only:** each page is opened, then Tab from the top (three presses: the skip link, then the shell). No clicks.
> - **`CATATAN-Z3A.txt`** has, per shot: the horizontal overflow (**0 px in all 45 shots**), the focused element, the
>   live-region text, and the text of the section the row changes. Its first line names the world.
> - **Script:** `tangkap-z3a.sh` (a fresh reset, a build, `next start`, the shots, a reset again) and `tangkap-z3a.ts`.
> - **The world** is the seeded human-evaluation school: Aisyah (peraga)'s one official Uji Penguasaan in 5A, her teacher
>   Pak Rahmat, and the head of department Bu Sari. Persona accounts have no password by design, so each is entered the
>   way the seed intends: the evaluator signs in and assumes the persona. That is why «MODE PERAGAAN» is the top bar.
>   One persona at a time, so the shots are taken per persona.
> - **The states** are written for the shots, with triggers off, and the stack is reset after the run:
>   - **The gate-only failure:** her must-be-right answer is moved to a wrong option, and her result recorded as the
>     engine would: 5 of 6 right, 83 % against a mark of 60 %, the gate false. The missed question's objective (MTK5-P1)
>     falls to 1 of 2.
>   - **Gate unknown:** the result row's gate is null.
>   - **C2:** the missed question's `objective_ids` are emptied, and its objective's own figure is put back at the mark
>     or above, so the gate is the only reason.
>   - **V2:** a later sitting of the same Uji Penguasaan is open.
>   - **D14:** the result in force is recalculated by an audited row.
>   - **N-15:** a read failure, provoked by lifting the read's grant for the shot and then restoring it.

| Shot | Row | What it shows |
|---|---|---|
| `z3a-01-murid-hasil-gerbang-*` | K-01, learner | 83 %, target 60 %, then «Belum mencapai target.» with `hasil.target.belum_gerbang`. «Pelajari lagi» lists the missed question's objective with its lesson, without a percentage (the gate is the reason) |
| `z3a-02-murid-ringkasan-gerbang-*` | K-01, summary (Hasil Belajar, the printed report's component) | The chapter «belum mencapai target». «Pelajari lagi:» names the gate's objective |
| `z3a-12-murid-hasil-c2-*` | C2 | The same verdict and the same sentence, and no «Pelajari lagi» list at all: the missed question has no objective, and the sentence reads right without one |
| `z3a-03-guru-murid-gerbang-*` | K-01, the teacher's one learner | «83 % · belum mencapai target: soal penting belum tepat · target 60 %», then «Minta membaca lagi» |
| `z3a-04-guru-tujuan-n14-*` | N-14 | `mengajar.murid1.tujuan_arti`'s new words, and the gate's objective listed |
| `z3a-05-guru-ulang-gerbang-*` | K-01, «Minta membaca lagi» | Aisyah pre-ticked: «83 % · Persentase sudah memenuhi target, tetapi ada soal penting yang belum tepat.» The chapter's lesson is ticked, as every lesson already is |
| `z3a-06-antrean-gerbang-*` | K-01, the retake queue (Bu Sari, `/pimpinan?kesempatan=buka`) | «hasil terakhir 83 %, target 60 % belum tercapai: soal penting belum tepat» |
| `z3a-09-guru-murid-tak-diketahui-*` | Gate unknown, the teacher | «83 % · belum dapat disimpulkan apakah target tercapai · target 60 %», «Minta membaca lagi» kept, and once under the table `mengajar.murid1.gerbang_tak_diketahui_arti` |
| `z3a-10-guru-ulang-tak-diketahui-*` | Gate unknown, «Minta membaca lagi» | Listed and NOT pre-ticked: «83 % · Belum dapat disimpulkan apakah target tercapai.» |
| `z3a-11-antrean-tak-diketahui-*` | Gate unknown, the queue | «hasil terakhir 83 %, target 60 %: belum dapat disimpulkan apakah tercapai» |
| `z3a-13-murid-ringkasan-v2-*` | V2, the learner's summary | The finished result stays, with `hasil.ulang_berjalan` under it |
| `z3a-14-guru-murid-v2-*` | V2, the teacher | The same line beside the finished result |
| `z3a-15-murid-ringkasan-d14-*` | D14 | The recalculated chapter marked with `hasil.dihitung_ulang`, the chapter page's own words |
| `z3a-08-laporan-kelas-tujuan-gagal-*` | N-15 | **Drawn from KomposisiKelas with the app's built stylesheet,** not from the running app. «Murid yang perlu penguatan» is drawn only past the readiness minimum (five assessed learners), and 5A has one. Aisyah's objectives unread: `mengajar.murid1.tujuan_gagal` in her row, never «nothing to study». The other two learners are read |

## Recovery walks (ruling 81 item 7), at 390

For each failure path: can the person tell what happened, was their work kept, and what next?

| Path | What happened | Work kept | Next step | Shots |
|---|---|---|---|---|
| **The gate cannot be read** (teacher's page) | Said in the row: «belum dapat disimpulkan apakah target tercapai», and once under the table that the important-question data cannot be read now. The figure stays; the verdict is withheld, never «reached» | Nothing is lost: it is a read | «Muat ulang halaman ini nanti.» Reloading once the gate reads gives the verdict (`…-pulih-390`: «belum mencapai target: soal penting belum tepat») | `09-…`, `09-…-pulih-390` |
| **The gate cannot be read** (the queue) | The line says the reach cannot be concluded; the figure and target stay | Not applicable | The same reload: `11-…-pulih-390` shows the gate line | `11-…`, `11-…-pulih-390` |
| **The gate cannot be read** («Minta membaca lagi») | Listed, not pre-ticked, after those below target. The teacher may still tick them | The form keeps its choices (nothing submitted) | Tick and send, or reload later | `10-…` |
| **The objectives cannot be read** (N-15, class report) | Said in the learner's own row: «belum dapat dibaca. Muat ulang halaman ini.» | Nothing is lost: it is a read | Reloading once the read works lists the objective (`08-…-pulih-390`) | `08-…`, `08-…-pulih-390` |

## For Daisy to judge

1. **«Pelajari lagi» without a percentage for the gate's objective** (01). The objective's own figure is the reason
   only when it is below the mark; for the gate it is the missed question. Its own figure here is 50 %, shown under
   «Penguasaan per tujuan» further down.
2. **On the teacher's page the «Minta membaca lagi» link sits directly above the `_arti` line** (09) when the gate is
   unknown. Should the line come before the link?
3. **Seen in passing, not Z3-A's:** at 320 px the header's «Mengajar» breaks as «Menga jar» (05-…-320), and the request
   page shows «target 60 %» above «Murid» rather than with the learners (05). Both are in stream B's or the shell's area.
