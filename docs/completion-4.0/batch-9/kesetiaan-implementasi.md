# Daisy's design-fidelity check: what engineering did (7 Nov)

**Source:** `docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/KESETIAAN.md` on `ux-1/daisy-experience` (`8cfc75b5`, and `40764f54` for #4b).

Each fix was checked against the approved specimen and rendered at 1280 px, 390 px and A4. Each is held by the test named. #6, #7, #18 and #21 followed on the owner's GO of 7 Nov, under the existing metric definitions and authorization.

| # | Finding | Status | Where it is held |
|---|---|---|---|
| 1 | Lists said as sentences («A dan B», «serta») | DONE: the shared `daftarKata` in all reports | `src/components/laporan/tata.tsx`; LAPORAN-KELAS-01, -SEKOLAH-01, -KISI-01 |
| 2 | Six advice lines | DONE: removed. The remedy appears only in D and in «Apa berikutnya» | LAPORAN-KELAS-01, LAPORAN-SEKOLAH-01 |
| 3 | A4 grammar | DONE: `@page laporan`. The header shows the wordmark plus report · place · period (`KepalaCetak`). The footer shows «Halaman n dari m». The body prints as blocks on white; a heading stays with its figure; a section shorter than a page stays whole | LAPORAN-CETAK-01 |
| 4, 4b | Section letters | DONE: one `JudulBagian`, with the letter read aloud («Bagian C»). Every heading sits outside its card. Pimpinan is lettered A… in reading order, including Kesiapan bukti | LAPORAN-*, D168-C1-2 |
| 5 | Guru E | DONE: names, «N dari M soal tepat», and «soal wajib belum tepat», from `murid_perlu_penguatan` (migration 199) | LAPORAN-KELAS-02, F32-E01/E02 |
| 6 | Guru B | DONE (owner GO, 7 Nov). The legend reads «17 murid (59%)». The score line draws one dot per learner in its band's colour, in 4% steps stacked where scores meet, with the band boundaries and the target. The dots come from `sebaran_murid_kelas` (migration 200): mastery and band only, with no identity. They are for the class's teacher only; a Kepala departemen or a Dekan gets nothing | LAPORAN-KELAS-03, F33-S01 |
| 7 | Guru C, the before→after pair | DONE (owner CONDITIONAL GO). `kenaikan_awal_akhir` (migration 200) gives the mean Pemetaan Awal and the mean Uji Penguasaan over exactly the (learner, chapter) pairs Kenaikan reads, so akhir − awal equals Kenaikan; the database test checks this against `calc_class_net_gain`. It answers only when the reader's own Kenaikan is «ok». Otherwise the page says «Rata-rata sebelum dan sesudah belum dapat dibandingkan.» Both averages show one decimal | LAPORAN-KELAS-03, F33-K01 |
| 8 | Guru D, «Saran penanganan:» at 14 px | DONE | LAPORAN-KELAS-01 |
| 9 | Duplicate Peserta tile; stat size | DONE: the tile is dropped when B's population line is drawn; scalar values use the stat size | LAPORAN-KELAS-01 |
| 10 | Target label on the scale | DONE | LAPORAN-KELAS-01 |
| 11 | 2b | DONE: one lead («Baru n dari m murid…»), then one line per figure, then «Tidak ada yang perlu dilakukan sekarang» | LAPORAN-KELAS-01 |
| 13 | Kisi: a class without evidence | DONE: one note in the header and «—» in the cells | LAPORAN-KISI-01 |
| 14 | Kisi: bases and the Kenaikan row | DONE: «n dari m murid» under each class and a Kenaikan foot row, both from envelopes Pimpinan already holds | LAPORAN-KISI-01 |
| 15 | Kisi at 10 classes | DONE: a focusable, named scroll region. On A4: a fixed name column and whole words; more than 6 classes print on a landscape page | LAPORAN-KISI-01, LAPORAN-CETAK-01 |
| 17 | Dekan lead and sub line | DONE | LAPORAN-SEKOLAH-01 |
| 18 | Dekan «Kesiapan bukti» | DONE (owner GO). Per subject: «n dari m kelas cukup untuk ditafsirkan». The denominator is every active class with an active academic assignment of the subject. A class counts as enough when the learners with an official Uji Penguasaan of that subject's chapters reach the class distribution's minimum. The classes not yet enough are named with how far they are. Source: `kesiapan_kelas_per_mapel` (migration 200), for the class figures' leadership and administration readers at or above the node. If that read fails, the section shows readiness by figure, as Pimpinan does | LAPORAN-SEKOLAH-02, F33-R01 |
| 21 | Aktivasi: the excluded counts | DONE (owner GO). «Tidak termasuk: …» for the chosen classes, from `kelas_dikecualikan_kartu` (migration 200). Each person is counted once, in their class, by one reason: AKUN (placed, with an account), STAF (placed, no account, a staff role), PENDATAAN (a learner row of an import still waiting, not yet placed). No sentence when the database did not answer | AKTIVASI-KECUALI-01, F33-A01 |
| 23 | Peserta PD sentence | DONE: Daisy's corrected sentence, word for word | LAPORAN-PESERTA-01 |
| 26, 27 | Chooser | DONE: the wordmark in the head line; the reason as an info alert; «choose a place» as the h2 that names the doors (both draw nothing until Dr Gladys's words arrive) | PEMILIH-KESETIAAN-01 |
| 12, 16, 19, 20, 22, 24, 25, 28 | PASS in the review | unchanged | — |

**Boundary found during integration (7 Nov).** The score line (#6) and Section E (D-195(5)) were built for a class of learners. A facilitator over a professional-learning class could have been given the class's participants by name in the lowest band, and as dots. Measured: F33-P01 failed against the earlier functions («1 participant by name in the lowest band; 3 as dots»). D-069 lists participants alphabetically and never by result. `murid_perlu_penguatan` and `sebaran_murid_kelas` now answer only for a class whose `member_kind` is LEARNER, and Ringkasan Kelas asks for neither on a class of participants (LAPORAN-KELAS-02/-03). Academic classes are unchanged (F32-E01/E02, F33-S01 green). How a PD class's Ringkasan Kelas should read at all is still X5, an owner question: it shows the generic «not yet» lead, which under D-070(h) never resolves.

## X5 · Ringkasan Kelas of a PD class (Daisy's fidelity pass, `ux-1/daisy-experience` `c4011570`, against `fa76781b`)

Reconciled on the branch after `bd4c2c06`. Rendered with specimen 6's twelve participants, full and completion-only, at 1280, 390 and A4.

| # | Finding | Status | Held by |
|---|---|---|---|
| X5-1 | The owner's sentence as the scope line under the h1, not an alert; no letter (Q1, Q2) | DONE: `<p className="pin-intro">`, the banner removed | LAPORAN-KELAS-PD-01 |
| X5-2 | «Gilang Ramadhan dan Imam Syafii belum mulai.» | DONE: `pengembangan.belum_mulai` reads «{daftar} belum mulai.», joined by the shared list helper (`daftarKata`). This reorders approved words; no new term. Listed for Dr Gladys's copy review with the other report sentences | LAPORAN-FASILITATOR-01 |
| X5-3 | «Not yet» as the legend's dash, not an open circle | DONE: `.pin-lk-tanda:not([data-selesai])`, a 10 × 2 px bar in `ink-3`, printed | LAPORAN-FASILITATOR-01 |
| X5-4 | The mark never parts from its word | DONE: the mark and the first word sit in one nowrap span. The lesson count («5 dari 5») is one value and never wraps, which was found on A4 after the fix | LAPORAN-FASILITATOR-01 |
| X5-5 | «Hasil» in words, with no percentage | DONE, as the approved composition draws it. One case is not in the specimen: a package with no sealed mark has no «reached», so its cell shows the share, the only result there is. This is raised to Daisy, not decided | LAPORAN-FASILITATOR-01; journey C12f2 reads «Tercapai» |
| X5-6 | A record table: 14 px rows, hairline dividers, the stripe | DONE: `[data-pd-paket] .pin-lk-kisi-tabel` with `--t-small`, `border-collapse`, hairline rows, the existing stripe | LAPORAN-FASILITATOR-01 |
| X5-7 | A4: A starts under the frame; the table breaks between rows | DONE: in print, `break-inside: auto` on the section, its card and the record, with rows kept whole and the header repeated. Twelve participants: page 1 holds the frame, the sentence and nine rows; page 2 repeats the header | LAPORAN-FASILITATOR-01 |
| X5-8 | A4 headers wrap between words | PASS (unchanged) | LAPORAN-KELAS-PD-01 |
| X5-9 | Refused or empty in one line | PASS (unchanged) | LAPORAN-KELAS-PD-01, journey C12f2 |

Every change applies equally to `/pengembangan/[kelas]`, which draws the same composition.
