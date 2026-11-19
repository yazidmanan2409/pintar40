# A3 · Recovery screens at the frozen head: review (Daisy, 19 Nov 2026)

> **What holds now:**
> - **PASS. No blocker. Three minors, for Z.**
> - **Read:** a local build of `claude/a3` at `5ae2d406`, against `A3-KODE-PEMULIHAN.md` §1–§8.
> - **Fixtures:** the seeded learning-cycle school (5S, siklus accounts). The learner walked Pemetaan Awal and the lessons to reach the Uji Penguasaan.
> - **Evidence:** `a3-layar-5ae2d406/`.

## What holds (all words as written)

| Screen | Seen |
|---|---|
| **Low-stakes, new session** | «Lanjutkan di sini?» with its body, [Lanjutkan di sini] [Batal]. After continuing: «Anda melanjutkan di sini. Jawaban yang tersimpan sebelumnya ada di sini.» |
| **Old session** | The neutral panel: «Asesmen ini dilanjutkan di sesi lain.», the contract sentence, «1 jawaban terakhir di sini belum tersimpan.» and «Kembali ke Belajar». No retry, no take-back |
| **Uji Penguasaan, new session (NOT_AUTHORISED)** | Title, the §6.2 body («Permintaan Anda tampil di daftar kelas guru Anda …»), «Coba lagi», «Kembali ke Belajar». «Coba lagi» adds «Diperiksa pukul 09.28 WIB.» Keyboard order: Coba lagi → Kembali ke Belajar |
| **Teacher's row** | «Mulai 09.26 WIB · sisa … menit **minta lanjut setelah masuk lagi**» (O-4), with «Atur · {nama}» |
| **Teacher's form** | «Izinkan lanjut setelah masuk lagi», the §8 question with «Uji Penguasaan», ALASAN with «10 sampai 300 karakter. Dicatat di jejak audit sekolah.», then [Izinkan] (primary) and [Batal]. A short reason is held by the field, and the typed text is kept |
| **Teacher's result** | «✓ Siswa Siklus Email (sintetis) dapat melanjutkan sampai pukul 09.38 WIB.» |
| **Learner after the teacher allowed** | «Coba lagi» → the player, with «Anda melanjutkan di sini. Jangan keluar dari akun sampai asesmen ini selesai: …» |
| **Overflow** | No page overflow on any learner screen, and no framed overflow on the learner's screens. The teacher's page has the known `/siapa` framed table (R-11, not A3's) |

## Minors (Z)

| # | Finding | Fix |
|---|---|---|
| A3-M1 | The waiting screen's body sits in the **red error box** (`a3-tunggu-390.png`). The learner did nothing wrong, and it is a waiting state | Use the neutral or information style for the body. Keep `role="alert"` on arrival |
| A3-M2 | «Beri tahu guru Anda juga: **Matematika · Kelas 5 · Pecahan**». {judul} renders the course path, not the assessment | {judul} = «Uji Penguasaan · {bab}», as the teacher's form already says «Uji Penguasaan» |
| A3-M3 | The teacher's row reads «sisa **259192** menit». The deadline is the assignment's `closes_at` | Not A3's: the same root as V-2 and N-3. Above a day, show «sampai {tanggal}» instead of minutes. With N-3, for Z or 4.2 |

**Not checked:** EXPIRED and USED (they need a 10-minute wait or a second sign-out); the NOT_NEEDED path (it shows the existing `galat.action_not_allowed` by ruling, and the row offers no action); 1280 for every state (the result at 1280 was seen).
