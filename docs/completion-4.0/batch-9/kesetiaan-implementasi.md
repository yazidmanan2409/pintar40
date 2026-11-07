# Daisy's design-fidelity check: what engineering did (7 Nov)

**Source:** `docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/KESETIAAN.md` on `ux-1/daisy-experience` (`8cfc75b5`, and `40764f54` for #4b).

Each fix was checked against the approved specimen and rendered at 1280 px, 390 px and A4. Each is held by the test named.

| # | Finding | Status | Where it is held |
|---|---|---|---|
| 1 | Lists said as sentences («A dan B», «serta») | DONE: the shared `daftarKata` in all reports | `src/components/laporan/tata.tsx`; LAPORAN-KELAS-01, -SEKOLAH-01, -KISI-01 |
| 2 | Six advice lines | DONE: removed. The remedy appears only in D and in «Apa berikutnya» | LAPORAN-KELAS-01, LAPORAN-SEKOLAH-01 |
| 3 | A4 grammar | DONE: `@page laporan`. The header shows the wordmark plus report · place · period (`KepalaCetak`). The footer shows «Halaman n dari m». The body prints as blocks on white; a heading stays with its figure; a section shorter than a page stays whole | LAPORAN-CETAK-01 |
| 4, 4b | Section letters | DONE: one `JudulBagian`, with the letter read aloud («Bagian C»). Every heading sits outside its card. Pimpinan is lettered A… in reading order, including Kesiapan bukti | LAPORAN-*, D168-C1-2 |
| 5 | Guru E | DONE: names, «N dari M soal tepat», and «soal wajib belum tepat», from `murid_perlu_penguatan` (migration 199) | LAPORAN-KELAS-02, F32-E01/E02 |
| 6 | Guru B | PARTLY DONE: the legend now reads «17 murid (59%)». **The dot strip is not drawn.** It needs every learner's own score on the report, which no envelope a Kadep or Dekan reads holds. For the teacher it would be a new per-learner read | LAPORAN-KELAS-01 |
| 7 | Guru C, the before→after pair | **NOT DONE.** The class's mean Pemetaan Awal is not in any report envelope; adding it means a new metric. Kenaikan and its base are drawn as before | — |
| 8 | Guru D, «Saran penanganan:» at 14 px | DONE | LAPORAN-KELAS-01 |
| 9 | Duplicate Peserta tile; stat size | DONE: the tile is dropped when B's population line is drawn; scalar values use the stat size | LAPORAN-KELAS-01 |
| 10 | Target label on the scale | DONE | LAPORAN-KELAS-01 |
| 11 | 2b | DONE: one lead («Baru n dari m murid…»), then one line per figure, then «Tidak ada yang perlu dilakukan sekarang» | LAPORAN-KELAS-01 |
| 13 | Kisi: a class without evidence | DONE: one note in the header and «—» in the cells | LAPORAN-KISI-01 |
| 14 | Kisi: bases and the Kenaikan row | DONE: «n dari m murid» under each class and a Kenaikan foot row, both from envelopes Pimpinan already holds | LAPORAN-KISI-01 |
| 15 | Kisi at 10 classes | DONE: a focusable, named scroll region. On A4: a fixed name column and whole words; more than 6 classes print on a landscape page | LAPORAN-KISI-01, LAPORAN-CETAK-01 |
| 17 | Dekan lead and sub line | DONE | LAPORAN-SEKOLAH-01 |
| 18 | Dekan «Kesiapan bukti» | DONE: a section of its own, drawn as Pimpinan draws it (`RingkasKesiapan`, by figure). **It is not the specimen's per-subject class count**, which no envelope holds | LAPORAN-SEKOLAH-01 |
| 21 | Aktivasi: the excluded counts | **NOT DONE.** The form has no count of who in the chosen classes already has a card, holds a staff role, or waits in Pendataan; that needs a new count from the database | — |
| 23 | Peserta PD sentence | DONE: Daisy's corrected sentence, word for word | LAPORAN-PESERTA-01 |
| 26, 27 | Chooser | DONE: the wordmark in the head line; the reason as an info alert; «choose a place» as the h2 that names the doors (both draw nothing until Dr Gladys's words arrive) | PEMILIH-KESETIAAN-01 |
| 12, 16, 19, 20, 22, 24, 25, 28 | PASS in the review | unchanged | — |
