# «Kenaikan kelas dan kelulusan» as built (9 Nov), for Daisy's reconciliation

**How these were made:** the real screens on the local stack, as Alpha's Admin sekolah, with synthetic data. The
learners are named «(sintetis 2)». Chromium at 1280 px, plus one phone-width view (390 px).

| Shot | Step | What it shows against the approved flow and the demonstration's findings |
|---|---|---|
| 1 | Choose the class | The school's Kelas, grouped by school year |
| 2, 3 | A decision for every learner | All six learners. Fajar, in the Tingkat with no Kelas, is listed and marked (finding 8B: no silent omission). «Naikkan semua ke Kelas 6A» pre-selects, and the exceptions are set row by row: a repeat straight into «Kelas 5A (tahun depan)», a departure with its reason, another class |
| 4 | Review | Each outcome by name, with nothing changed yet. The teachers of the class and of the destination classes, who are never carried over. The confirmation requires «Saya sudah meninjau penugasan guru» |
| 6, 7 | Outcome | «Selesai. 6 murid diproses», and each learner's outcome with where they are now, read back from the database |
| 8 | Jejak audit (E7) | «Oleh»: the actor by name and role |

**Fixed after these screenshots (the commit that adds this folder):**
- the teacher list had run together on one line;
- a departure's outcome repeated «Keluar».

**Questions for Daisy:**
- Is one decision per learner in a native select clear enough for 40 learners?
- Should the review group the outcomes (Naik / Tinggal / Lulus / Keluar / Pindah) with a count for each?
- Is the outcome page's «Sekarang» column what a school admin needs?
