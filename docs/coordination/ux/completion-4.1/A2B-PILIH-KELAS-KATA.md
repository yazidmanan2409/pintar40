# A2b: the class choice on the planned form (Daisy, 16 Nov 2026)

> **What holds now:**
> - **Reuse A2a's picker, but two of its lines must NOT carry over:** the hint and the impact sentence (§1). Both describe a person-level stop. A planned class window is **work-scoped** (R-1), so on this form they would be false.
> - **D8-5's list gains the class choice** (§2).
> - **Read:** Bob's note (16 Nov, 09:34); A2a's picker as on `main` (`config.pemeliharaan.darurat.*`); my A1 and A2 in `A2-KATA-DESAIN.md`.

## 1 · The words, planned form

| Element | Emergency (A2a, unchanged) | **Planned form (A2b)** |
|---|---|---|
| «Untuk» (`config.pemeliharaan.cakupan`) | existing | **existing**, unchanged |
| The scope choice | «Satu kelas atau lebih», checkboxes | **«Satu kelas» / «One class», with one radio per class** if a planned window holds one class. If `jadwalkan_pemeliharaan` accepts several, reuse «Satu kelas atau lebih» and checkboxes. **Follow what the function takes; the label must match it** |
| Classes appear | after one school is chosen, «{kelas} · {tahun ajaran}» | **the same** |
| **Hint under the class list** | «Penghentian berlaku untuk semua murid dan guru kelas yang dipilih, di seluruh PINTAR, juga saat mereka membuka kelas lain.» | **New, `config.pemeliharaan.kelas_petunjuk`:** ID «Selama pemeliharaan, pekerjaan kelas yang dipilih tidak dapat diubah. Murid dan gurunya tetap dapat memakai PINTAR, juga di kelas lain, dan asesmen yang sedang dikerjakan tetap dapat diselesaikan.» EN «During maintenance, the chosen class's work cannot be changed. Its students and teachers can still use PINTAR, including in other classes, and assessments in progress can still be finished.» |
| **Impact sentence** | «Anda akan menghentikan seketika: …» | **None.** The planned form's «Periksa waktu ini» and its collision lines already say what the window meets. «menghentikan seketika» would misname a scheduled, work-scoped window |
| A class that cannot be chosen (stale form or forged request) | `galat.maintenance_node_invalid` «… untuk penghentian ini … Tidak ada yang dihentikan.» | **A planned wording,** ID «Kelas itu tidak dapat dipilih untuk pemeliharaan ini. Pilih satu sekolah, lalu kelasnya. Tidak ada yang dijadwalkan.» EN «That class cannot be chosen for this maintenance. Choose one school, then its class. Nothing was scheduled.» Use the same code with its own planned string, or a planned key; whichever the build already distinguishes |

**Why the hint must differ:**
- It is the one sentence that tells an admin what a class window does to people.
- The emergency's says "stopped everywhere, even in other classes". The planned one is the opposite: work in that class is held, and the people are not. Reusing it would tell an admin that scheduling 7A's maintenance locks a 7A teacher out of 7B, which is false (A1, K11).

**Unchanged:** the reason list (D2, planned only); the {zona} labels; the collision lines.

## 2 · D8-5's list, amended

D8-5 (Konfigurasi, the planned form) now also captures:
- **«Untuk» set to «Satu kelas»**, with a school chosen and its classes listed, and the hint, at 390 and 320 and **by keyboard**: the radio group's legend, arrow keys, and the hint tied to the group;
- **the collision lines for a class window** («Periksa waktu ini»), with the counts for that class only;
- **one WITA capture.**

`A2B-C2W-KATA.md` §2's D8-5 row is amended to read the same way.

## 3 · Anticipation

**Found before the build**, by **question 2** (the neighbouring act). The emergency picker is the neighbour, and its hint states the opposite rule.
