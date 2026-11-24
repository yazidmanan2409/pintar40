# Ruling 79 audit · J4, an interrupted sitting: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J4 walked** on the local audit world (`00fe853d`, product = main `429b7dcc`).
>   - **People:** W9, Galih Pratama (8A, mid-Uji Penguasaan with 2 of 6 saved) and his teacher Dimas Saputra.
>   - **Branches:**
>     - signed in again, so permission was needed;
>     - the teacher allows;
>     - the learner continues;
>     - the network lost and returned;
>     - the teacher ends the sitting, scored.
> - **Not walked here:**
>   - the time running out during the gap (needs the clock moved);
>   - maintenance starting (J12's world);
>   - «Akhiri tanpa menghitung»;
>   - the screen reader, throttled and reduced-motion passes.
>   These come from the builder's run.
> - **Captures:** `audit79-j4/`, at 390.
> - **5 findings: 1 Significant, 4 Improvement, none Critical.** Each one lists its **sibling screens**, those that show the same fact, and whether they agree (ruling 95).
> - **Ruling 81, «work kept»: holds on every branch.**
>   - After the permission the learner resumed with «Sudah dijawab: 2 dari 6».
>   - Offline, an answer was held («Sedang luring. Jawaban Anda disimpan dan dikirim saat tersambung lagi.») and sent on reconnect («Tersimpan», 3 of 6; the database agrees).
>   - The teacher's end scored exactly the saved answers.

## Significant

| # | Finding | Siblings (same fact) | Dim. | Fix |
|---|---|---|---|---|
| **J4-1** | **A learner whose sitting the teacher ended is not told so.** After «Akhiri dan nilai», Galih's result reads «Belum lulus … 2 dari 6 soal dijawab tepat», as if he had handed it in. He never pressed «Kumpulkan», and nothing says who ended it or that only saved answers were scored. Ruling 81's first question fails | **Disagree.** The teacher's row: «Diakhiri 17.41 WIB · jawaban yang ada dinilai». The teacher's confirmation: «Sesi Galih Pratama diakhiri. Jawaban yang ada dinilai.» The learner's result and start page say nothing | B, C | On the learner's result, under the decision: «Uji Penguasaan ini diakhiri oleh guru Anda pada {waktu}. Jawaban yang sudah tersimpan dinilai.» (and for «tanpa menghitung», on the start page: «… diakhiri oleh guru Anda dan tidak dihitung. Anda dapat memulai lagi selama jadwalnya masih terbuka.») |

## Improvement

| # | Finding | Siblings | Dim. | Fix |
|---|---|---|---|---|
| J4-2 | The teacher's home again shows nothing for a waiting «minta lanjut» request (Galih blocked, the home's «first thing» is about preparing a chapter). **This confirms L-45 (J2-2)** on a second school; it is not a new row | **Disagree.** The learner: «Permintaan Anda tampil di daftar kelas guru Anda». The sittings list: «minta lanjut setelah masuk lagi». The home: nothing | B, C | As L-45 |
| J4-3 | The learner's start card heads an open sitting «Siap untuk Uji Penguasaan» with the action «Lanjutkan Uji Penguasaan». A state that already started is called ready to start | **Disagree.** The player: «Waktu berjalan … Sudah dijawab: 2 dari 6». The teacher: «Sudah mulai, belum mengumpulkan» | B | «Uji Penguasaan sedang berjalan» + «Lanjutkan Uji Penguasaan» |
| J4-4 | «Sedang luring» uses a formal word that SD and SMP learners may not know | The banner only (its action is right) | H | «Tidak tersambung ke internet. Jawaban Anda disimpan dan dikirim saat tersambung lagi.» |
| J4-5 | «sisa 259189 menit» on the teacher's row. **This confirms L-47 (J2-4)**; not a new row | — | H | As L-47 |

## Holds (checked)

- **The permission screen** says why («Karena Anda masuk lagi atau berganti perangkat…»), where the request went, what to tell the teacher («Beri tahu guru Anda juga: Uji Penguasaan · Persamaan Linear Satu Variabel») and what to do next («Setelah guru mengizinkan, pilih Coba lagi»).
- **The teacher's «Izinkan»** asks a question that names the learner and the effect («Sesi sebelumnya tidak menyimpan jawabannya lagi. Jawaban yang sudah tersimpan tetap ada.»), with a reason that is audited. Its result names the end time.
- **On resuming:** «Jangan keluar dari akun sampai asesmen ini selesai: untuk melanjutkan lagi, guru perlu mengizinkan sekali lagi.» is honest about what happens next time.
- **The teacher's «Akhiri sesi»** explains both choices (scored, which uses an attempt; not counted, where the answers are kept and the learner can start again), then confirms in words that name the effect. That is good E practice.

## Cause tags (Bob's interim `AUDIT-79-COMMON-CAUSES.md`, 35cccdf1)

| # | Cause |
|---|---|
| J4-1 | **New cause (proposed C-7): who changed a state is recorded, but shown only to the person who acted.** The ending («diakhiri oleh guru, jawaban yang ada dinilai») lives on the sitting and its audit row, and the teacher reads it. The learner's result is derived from the outcome alone, so it cannot tell a hand-in from a teacher's end. L-59's sibling (the approved retake the learner isn't told of) is C-2, not this |
| J4-2 | C-4 (L-45) |
| J4-3 | C-2: the start card's step derivation says «Siap» while the sitting is begun. That is the same step derivation that misses the approved retake |
| J4-4 | None: wording only |
| J4-5 | None: formatting (L-47) |
