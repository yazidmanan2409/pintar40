# Ruling 79 audit · J2, one chapter from start to certificate: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J2 walked end to end** on a local build of main `429b7dcc` (the D2-R accepted product), as the seeded learner «Siswa Siklus Email», chapter «Pecahan»:
>   - Pemetaan Awal → Peta Bacaan → two lessons → Uji Penguasaan → result → certificate → Hasil Belajar;
>   - the teacher's side wherever the journey touched it.
> - **Captures:** `audit79-j2/`, at 390, plus the result and certificate at 1280 and 320.
> - **10 findings:** 3 Significant, 7 Improvement, none Critical. Proposed L-ids are for Bob to assign.
> - **Ruling 81 overall:** the learner always knew what happened and their work was kept at every step (every answer confirmed «Tersimpan … Sudah dijawab: n dari 5»). The next step was unclear twice: J2-1 and J2-3.
> - **Not yet walked** for J2: the screen reader, throttled network and reduced-motion passes (Second Eye's capture run), and the EN pass.

## Significant

| # | Finding | Seen | Dim. | Fix (for the consolidated revision) |
|---|---|---|---|---|
| **J2-1** | **The certificate page promises a certificate that can never exist.** The sitting's evidence is not OFFICIAL (INV-20), so no certificate can be made. The result page correctly shows nothing (§13). But `/belajar/{t}/sertifikat` says «Sertifikat Anda sedang disiapkan … Sertifikat akan muncul di sini … Tidak ada yang perlu dilakukan.» | `j2-30-sertifikat-390` | B, H | The certificate page follows §13's three states. With no certificate possible: «Hasil ini tidak menghasilkan sertifikat.» plus «Lihat hasil Uji Penguasaan», and no promise. **Scope:** any non-OFFICIAL pass (PREVIEW, SYNTHETIC, PUBLIC_DEMO), so every demo and preview school, which is where the owner shows PINTAR |
| **J2-2** | **The teacher's home says nothing awaits them while a learner is blocked waiting for them.** The learner reads «Permintaan Anda tampil di daftar kelas guru Anda». The teacher's `/mengajar` says «Tidak ada yang menunggu keputusan Anda hari ini.» The request shows only inside the class list («minta lanjut setelah masuk lagi») | `j2-22-guru-beranda-390`, `j2-23-guru-siapa-390` | B, C | A waiting «minta lanjut» request is the teacher's «one thing to do first» on `/mengajar`, with a link to its «Atur». It also belongs to J4 |
| **J2-3** | **«Siap untuk Uji Penguasaan» carries the reading map's line.** With every lesson read, the panel says «Mulailah dari kartu paling atas. Urutannya sudah disusun untuk Anda.» above «Mulai Uji Penguasaan». The next step contradicts itself | `j2-16-bab-siap-390` | H, B | The agreed line: «Semua pelajaran sudah dibaca.» (D2R-KATA §2) |

## Improvement

| # | Finding | Seen | Dim. | Fix |
|---|---|---|---|---|
| J2-4 | Remaining time in minutes: «sisa 259191 menit» (about 180 days) on the teacher's row | `j2-23-guru-siapa-390` | H, F | Days beyond 24 hours, e.g. «sisa 180 hari»; hours beyond 60 minutes |
| J2-5 | One verdict, two words, now on three learner surfaces: the result «Lulus.»; the Belajar card «Selesai · target tercapai»; Hasil Belajar «Semua bab yang selesai sudah mencapai target», «Sertifikat bab yang targetnya tercapai …» | `j2-31`, `j2-32` | B | Joins L-33 (N-23). On certifying chapters: «Selesai · lulus», «Semua bab … sudah lulus», «Sertifikat bab yang sudah lulus …» |
| J2-6 | Two names for one concept: the Belajar card says Hasil Belajar shows «bagian yang perlu dipelajari lagi», but that page now says «baca lagi» | `j2-31` | B | «… dengan bagian yang disarankan untuk dibaca lagi.» |
| J2-7 | The result's last three lines (the advice note, the counts and ordinal, «tidak ditampilkan») run together as one small block at 390. The order is right, but the groups are not separated | `j2-28-hasil-390` | B (visual) | A paragraph gap after the note; the counts line as `pin-meta` on its own |
| J2-8 | Two page numbers on one lesson screen: «Bagian 1 · halaman 3–8» (the source book) and «Halaman 1/3» (the reader) | `j2-14-pelajaran-1-390` | H | Name the book's: «Buku halaman 3–8» |
| J2-9 | The chapter's five-step line has no labels at 390 (five dots under «Lima langkah.»). Sighted learners can't tell which dot is which | `j2-16-bab-siap-390` | A, G | The current step's name under the line, e.g. «Langkah 4 dari 5: Uji Penguasaan» |
| J2-10 | Visual pass, the chrome: on mobile «Keluar» has an outline, while on the desktop sidebar it has none (L-41). The mobile ID / EN control is as heavy as the desktop one (L-42) | every capture | B | It ships with L-41 and L-42, making mobile and desktop one style |

## Not findings (checked)

- **The two «Ada jawaban yang belum tersimpan di server» warnings** in my first runs were my script's fault: its matcher never clicked an answer. At a human pace every save confirmed. The warning blaming the connection when nothing was picked is left for J4, with Second Eye reproducing it.
- **«Guru Siklus (sintetis)»** in the teacher's own learner list is the seed enrolling the teacher as a learner: test data.
- **Kept and working:**
  - the D2-R result order and words;
  - «Kesempatan ke-1»;
  - the «Sudah kuat» line and the map's advice note;
  - the A3 recovery: the teacher's «Izinkan» and the learner's «Jangan keluar dari akun …».
