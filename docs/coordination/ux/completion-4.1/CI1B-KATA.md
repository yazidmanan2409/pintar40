# CI-1b · printed copies of a certificate that is not valid: words (Daisy, 24 Nov 2026)

**Asked by Bob (15:32Z).** Sharon rates L-105 / J7-10 HIGH, to be fixed before the first real certificate. Scope: the app and the print stylesheet only.

**Terms are the public check's own** (`src/lib/hle.ts` `verifikasi.status.*`):
- «Dicabut oleh penerbit» / «Revoked by the issuer»;
- «Digantikan sertifikat yang lebih baru» / «Replaced by a newer certificate»;
- «Sedang ditinjau» / «Under review».

Dates use the certificate's own format, «24 November 2026».

## Decision: a notice page, not a full-page mark

For DICABUT and DIGANTIKAN, the page prints **only a notice**: no name, no «Telah dinyatakan memenuhi kriteria kelulusan …», no subject line. Three reasons:
- **A mark leaves the credential on the paper.** A diagonal word can be cropped, covered or washed out by a photocopier, and what remains is the very sentence revocation exists to withdraw. A notice has nothing to misuse.
- **It reads at a glance.** A full-page mark asks the reader to see the certificate and then discount it. A notice says one thing.
- **It matches the public check.** The check shows no holder name either (`verifikasi.catatan`). A paper that can travel to a stranger should say no more than the check does.

## 1 · DICABUT (printed in place of the certificate)

| Part | ID | EN |
|---|---|---|
| Heading | **Dicabut oleh penerbit** | **Revoked by the issuer** |
| Statement | Sertifikat {nomor} diterbitkan oleh {sekolah} pada {tanggal_terbit}, lalu dicabut pada {tanggal_cabut}. Sertifikat ini tidak lagi berlaku dan tidak dapat dipakai sebagai bukti. | Certificate {nomor} was issued by {sekolah} on {tanggal_terbit} and revoked on {tanggal_cabut}. It is no longer valid and cannot be used as evidence. |
| Plain fact | Lembar ini bukan sertifikat. | This page is not a certificate. |
| Check (beside the QR) | Periksa keadaannya: pindai kode ini atau buka {alamat}. | Check its status: scan this code or open {alamat}. |
| Foot | Dicetak {tanggal_cetak}. | Printed {tanggal_cetak}. |

## 2 · DIGANTIKAN (printed in place of the certificate)

| Part | ID | EN |
|---|---|---|
| Heading | **Digantikan sertifikat yang lebih baru** | **Replaced by a newer certificate** |
| Statement | Sertifikat {nomor} diterbitkan oleh {sekolah} pada {tanggal_terbit}, lalu digantikan pada {tanggal_ganti}. Sertifikat ini tidak lagi dipakai. Mintalah sertifikat yang baru kepada pemegangnya. | Certificate {nomor} was issued by {sekolah} on {tanggal_terbit} and replaced on {tanggal_ganti}. It is no longer in use. Ask the holder for the new certificate. |
| Plain fact | Lembar ini bukan sertifikat. | This page is not a certificate. |
| Check | as DICABUT | as DICABUT |
| Foot | as DICABUT | as DICABUT |

- **The new number is not printed.** The public check doesn't give it to a stranger, and the paper can reach one. The holder already has «Buka sertifikat yang baru» on screen. Once J7-9 is fixed, her «Lihat sertifikat» opens the new certificate anyway.
- **If the replacement date isn't stored,** drop «, lalu digantikan pada {tanggal_ganti}» and keep «Sertifikat ini tidak lagi dipakai.»

## 3 · DITINJAU (the certificate prints, with one fixed line)

One line at the top of the printed certificate, outside the certificate's frame, in body size, not a footnote:

| ID | EN |
|---|---|
| **Sedang ditinjau:** sekolah penerbit sedang meninjau sertifikat ini. Pindai kode QR untuk keadaannya saat ini. Dicetak {tanggal_cetak}. | **Under review:** the issuing school is reviewing this certificate. Scan the QR code for its current status. Printed {tanggal_cetak}. |

- **«Keadaannya saat ini»** keeps the line true however the review ends. It is the same idea as J7-2's fix for the on-screen «Periksa keaslian» line.
- **No reason is printed.** The public check gives one («Penilaian satu soal … diperbaiki»). That reason belongs to the check, which stays current; the paper does not.

## Required for these words to work

1. **The QR and the link must print.** The screen has «Periksa keaslian» with a QR. In the builder's prints (`63ff05e9/j7/*/15`, `19`, `28`, `37`, and the four PDFs), none of it prints, on any state. DITINJAU's line points at the QR, so it needs the QR on paper.
   - **Bob's call:** BERLAKU «prints as today», but today's print has no check address either (J7-10, second half). I recommend the QR and the link print on BERLAKU too, under «Periksa keaslian» with the existing `sertifikat.periksa.arti`. That is one rule for all four states.
2. **{alamat} is printed in full,** in the monospace already used for the number, and allowed to break at «/». The QR is the main route; the link is the fallback for a reader without a camera.
3. **The print is decided by the state at print time,** not by the screen's state when the page loaded. Re-read it, or print from a server-rendered print view.
4. **Screen readers:** the notice's heading is the page's h1 in print view. On screen nothing changes: the banners already carry the state.

## Proposed keys

`cetak.DICABUT.judul`, `cetak.DICABUT.isi`, `cetak.DIGANTIKAN.judul`, `cetak.DIGANTIKAN.isi`, `cetak.DIGANTIKAN.isi_tanpa_tanggal`, `cetak.bukan_sertifikat`, `cetak.periksa`, `cetak.DITINJAU.baris`, `cetak.tanggal_cetak`. The headings reuse `verifikasi.status.DICABUT` / `verifikasi.status.DIGANTIKAN` where the builder prefers that.
