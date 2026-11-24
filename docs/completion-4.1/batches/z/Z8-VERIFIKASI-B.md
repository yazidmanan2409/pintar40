# Z8 · verify-closed rows, stream B (23 Nov 2026)

> **What holds now:** on `claude/z-ux` at Z6's head (`2d19d3cf`, plus this record), **none of the six findings reproduces.**
> - **Closed, verified:** A1-R1, A1-R2, C1-R2, and the in-app half of C1-R5.
> - **Closed, verified by a rendered look:** A1-R4's placement, and C1-R4 (printing while under review, with K-05).
> - **Re-look after merge 2:** two lines that stream A's K-01 is changing now: the queue row's result words (A1-R4) and
>   the certificate's predicate (C1-R4). Neither is verified on code that is about to change.
> - **Still 4.2, unchanged:** C1-R5's email. In-app only is built; the email was left unbuilt by Bob's triage (PETE-12).
> - **Left to stream A and Sharon:** R-15's Sharon items (the run-guard order; A1's approval re-check and the reports
>   rule; C1w's confirmer preference; B0's account closure).

**Sources:**
- the findings are Daisy's pre-build review, `docs/coordination/ux/completion-4.1/TINJAUAN-A1-C1W.md` (`1c2f9582`,
  revised `890a5e6b`), its register;
- her read on `main` `7ba18b03` is `R15-DAISY-7ba18b03.md` (`087b5848`).

**Method:** each row is shown on the current tree by the test or rendered step that closed it, run here (focused, local
stack). The rendered looks are `layar/tangkap-z8.ts`, keyboard only, at 1280, 390 and 320 px; notes per shot are in
`layar/CATATAN-Z8.txt`; window overflow is 0 px in every screen shot.

## The rows

| Row | The finding (Daisy's register) | On the current tree | Evidence | State |
|---|---|---|---|---|
| **A1-R1** | When the open player learns of an extension or an ending is not stated | The player asks how its sitting stands every 45 s and on every send (`ItemPlayer.tsx:236`, `window.setInterval(… periksaKeadaan …, 45_000)`). ItemPlayer has changed since `7ba18b03` (A3's recovery screens, F37), and the check is still there | **A1-K02** PASS (asserts the 45 s check and the check on every send); **A1-J01** PASS (the power-cut journey through the running app) | **Closed** |
| **A1-R2** | «the class's assessment page» does not exist | The teacher's controls are on `/mengajar/[kelas]/siapa`, with the instrument switch and «Atur» per learner, and «Ubah jadwal · {lesson}» on the class page | **A1-A01** PASS; captures `z8-04-guru-kelas-ubah-jadwal-*` (one «Ubah jadwal» link, focused by keyboard); «Siapa» itself is Z6's `z6-01` to `z6-04` | **Closed** |
| **A1-R4** | Where the approver's queue sits | The school admin: «Yang menunggu» on Konfigurasi carries «2 permintaan kesempatan tambahan menunggu persetujuan», and Enter opens `/konfigurasi/kesempatan` with the two rows. A head of department: the same line on their own home (`/pimpinan`), counting the one they may decide (their own request is decided by someone else) | **A1-A02** PASS; captures `z8-01-admin-yang-menunggu-*`, `z8-02-admin-antrean-*`, `z8-03-kadep-beranda-*` | **Placement: closed** (this was the «one look» Daisy asked for). **The row's result words: re-look after merge 2** (K-01's `kesempatan.baris.hasil_gerbang` changes them) |
| **C1-R2** | A teacher's view of an existing assignment after a corrected release | The class page row says «Ada perbaikan · terbit {tanggal}», linking to «Pindahkan penugasan»; nothing moves on its own. Neither the class page nor `keadaanTerbitanKelas` (`src/lib/pengajar.ts:445`) has changed since `7ba18b03` (the one commit on the file, Z3's K-03, does not touch it) | **C1W-K02** PASS (the copy and the class page's use of `keadaanTerbitanKelas`, the move offered after a replacement); Daisy's rendered capture `d8-1-wita-t15-guru-390` (A2b) at `7ba18b03` | **Closed.** Not re-rendered here: this session has no fixture of a replaced release on an existing assignment |
| **C1-R4** | A paper printed while a certificate is «Sedang ditinjau» | The learner's certificate under review shows «Sedang ditinjau» with its sentence, and keeps «Cetak atau simpan PDF» (focused). Printed (print media, and a PDF at 1280), the review banner is not on paper, the QR is (1 QR image), and **no status word is printed** («Berlaku», «Sedang ditinjau»: none). So the paper says nothing that the live check contradicts. **K-05 in the same session:** the public check of the same certificate reads «Sedang ditinjau», with the facts «as issued» | Captures `z8-05-sertifikat-ditinjau-*` (screen), `z8-06-sertifikat-cetak-*` and `z8-06-sertifikat-cetak.pdf` (print), `z8-07-verifikasi-ditinjau-*` (public); **Z-K05-01** PASS; **C1W-S06** PASS (DITINJAU from the moment the result changes) | **Closed.** **The predicate line on the paper («Sangat Baik»): re-look after merge 2** (K-01 reads the verdict). Note: the print-media shots at 390 and 320 report 12 px of overflow, because the card keeps its paper layout and a phone-width window does not model a page. The printed page is the PDF |
| **C1-R5** | How affected schools hear of a correction | In-app: the school's notice in «Yang menunggu» (`pemberitahuan_koreksi_kunci`), no student names | **C1W-S06** PASS (the issuing school's notice: its own sitting and review, one waiting) | **In-app: closed.** **Email: 4.2, unchanged** (PETE-12), so there is no new finding |

## Re-look after merge 2

- **A1-R4:** the approver's row («hasil terakhir {hasil}, target {target}» → K-01's `hasil_gerbang` for a gate-only
  failure). Read the row on the merged tree at 1280, 390 and 320.
- **C1-R4:** the certificate's predicate, and whether a K-01 verdict changes what a certificate under review prints. Print
  once more on the merged tree.

Both re-looks can ride Z6's post-merge sweep session (one build).

## Not mine

R-15's Sharon items are left to stream A and Sharon, each with its proposed class, as Bob asked.
