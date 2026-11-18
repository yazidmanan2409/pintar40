# R-15: Daisy's items, read on `main` `7ba18b03` (18 Nov 2026)

> **Read-only: code on `main` and my existing evidence. No new build or walk.**
> - **Closed: 6.**
> - **Open: Z, 6.**
> - **Open: 4.2, 1** (C1-R5).

| Item | State | Evidence or where it goes |
|---|---|---|
| Audit first-Tab scroll | **Closed, accepted as browser behaviour** | `completion-4.0/TINJAUAN-ab4146da.md` §B9 (Tab reaches the summary cell, which the browser scrolls into view) |
| Audit 15 px header strip on a phone | **Closed, accepted** | Same review: the anchor is the run's row and the column names stay readable |
| Kenaikan step 2 status line joined with «·» | **Open: Z, one string** | `DaftarKeputusan.tsx:49` `bagian.join(" · ")`. Join with «, » |
| Its group order (the main group can come last) | **Open: Z, one line** | `DaftarKeputusan.tsx:47` keeps insertion order. Sort by count, descending |
| «Tambah Tingkat» suggesting a fixed «2026/2027» | **Closed** | `288cdb52`: `tahunKini={tahunAjaranPada(new Date(), zona)}` computes the year from the school's date |
| Titles breaking at 320 px | **Open: Z, with R-11's sweep** (style) | Not re-walked |
| «Kursus» in «Cabut sertifikat» (X12) | **Open: Z, one string** | `sertifikat.kelola.kolom.kursus` = «Kursus» → «Paket» |
| A1-R1 (the open player learns of an extension or ending) | **Closed** | `d076553f`: `ItemPlayer.tsx:231` checks every 45 s |
| A1-R2 (where the teacher's controls live) | **Closed** | `/mengajar/[kelas]/siapa` with the mode switch and «Atur» per row, and «Ubah jadwal» on the class page (A2b and C2w captures; `z-siap-7ba18b03/r11-siapa-320.png`) |
| A1-R4 (where the approver's queue sits) | **Open: Z, verify** | The heads' «Keputusan menunggu Anda» exists (`pimpinan.menunggu.*`). The school admin's placement is **not verifiable by reading**; it needs one look, against A1's acceptance (with Sharon) |
| C1-R2 (an existing assignment after a corrected release) | **Closed** | `d0b7ebf2`: «Ada perbaikan · terbit {tanggal}» with «Pindahkan penugasan», seen in the A2b capture `d8-1-wita-t15-guru-390` |
| C1-R4 (printing while a certificate is «Sedang ditinjau») | **Open: Z, verify** | Not verifiable by reading. One print look |
| C1-R5 (how affected schools hear of a correction) | **Open: 4.2** | In-app only is built. The email is left unbuilt, per Bob's triage (PETE-12) |
