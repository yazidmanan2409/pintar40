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

## `cetak.DIGANTIKAN.isi_tanpa_tanggal`, in full (25 Nov 00:45; Second Eye's EN confirmed)

- **ID:** «Sertifikat {nomor} diterbitkan oleh {sekolah} pada {tanggal_terbit}. Sertifikat ini tidak lagi dipakai. Mintalah sertifikat yang baru kepada pemegangnya.»
- **EN:** «Certificate {nomor} was issued by {sekolah} on {tanggal_terbit}. It is no longer in use. Ask the holder for the new certificate.»

Second Eye's derivation («…on {tanggal_terbit}. It is no longer in use. Ask the holder for the new certificate.») is **confirmed**. It is the with-date line with «, lalu digantikan pada {tanggal_ganti}» / «and replaced on {tanggal_ganti}» removed.

## Word check at the freeze, `e8a35c3a` (claude/ci-1b), 26 Nov 03:40: PASS (source)

- **The nine keys in `src/lib/hle.ts`** match this file in ID and EN, word for word: `cetak.DICABUT.judul`/`isi`, `cetak.DIGANTIKAN.judul`/`isi`/`isi_tanpa_tanggal` (verbatim, as confirmed @098539b2), `cetak.bukan_sertifikat`, `cetak.periksa`, `cetak.tanggal_cetak` and `cetak.DITINJAU.baris`.
- **`PemberitahuanCetak` (DICABUT, DIGANTIKAN):**
  - prints in place of the certificate: the h1 heading, the statement, «Lembar ini bukan sertifikat.» (emphasised), the QR, the link in monospace that may break anywhere, and «Dicetak {tanggal}»;
  - no name, no pass sentence, no course, no replacement number;
  - when no replacement date is stored, it chooses `isi_tanpa_tanggal`.
  - **The composition matches.**
- **`BarisDitinjauCetak`:** «Sedang ditinjau:» in bold, then the line with the print date. **It matches** (bold label as KATA §3).
- **`TanggalCetak`:** the date is rewritten at `beforeprint`, so the date printed is the paper's. It uses the certificate's date form.
- **`SegarkanKeadaan`:** the page re-reads the state on refocus. **Its named residual is Sharon's to accept** (a page never refocused, printed with the browser's own Print, prints the state it last read; the QR and the link still lead to the truth).
- **The printed link** drops `https://`, which is the certificate's existing convention (`tautanCetak`). The token and the host are whole.

**One note, not a word difference (optional):** `{sekolah}` falls back to an empty string, which would print «diterbitkan oleh  pada …». If a certificate can lack its school name, use the clause without it. Otherwise ignore this.

**The rendered check** moved to Second Eye's local render (below).

## Rendered check, `claude/ci-1b-evidence` `1f2689d4`, 26 Nov: PASS

Judged as a reader would, from the four PDFs and their page images in `docs/post-4.1/ci-1b/evidence/`. Each PDF is **one page, 595 × 842 pt (A4)**.

| Print | What a reader sees | Verdict |
|---|---|---|
| S21i BERLAKU (ID) | The certificate alone, no band: name, the pass sentence, «Materi Pembelajaran», date, number, issuer, «Periksa keaslian» with the link and the QR. Nothing cut, nothing on a second page. | PASS |
| S21j DITINJAU (ID) | A band above the certificate: «**Sedang ditinjau:** sekolah penerbit sedang meninjau sertifikat ini. Pindai kode QR untuk keadaannya saat ini. Dicetak 26 November 2026.», then the certificate whole. Bold label as KATA §3. | PASS |
| S21j DITINJAU (EN) | «**Under review:** the issuing school is reviewing this certificate. Scan the QR code for its current status. Printed 26 November 2026.» Labels in EN (CERTIFICATE, ISSUE DATE, CERTIFICATE NUMBER, ISSUED BY, CHECK IT IS GENUINE). The course name stays as authored. | PASS |
| S27v DICABUT (ID) | «Dicabut oleh penerbit»; the statement with both dates and «tidak lagi berlaku dan tidak dapat dipakai sebagai bukti»; «**Lembar ini bukan sertifikat.**»; the QR; «Periksa keadaannya …» with the link; «Dicetak 26 November 2026.» **No name, no pass sentence, no course, no certificate frame.** | PASS |

- **The revoked print can't be mistaken for a valid certificate.** It has none of the certificate's parts, says in bold that it is not one, and points to the live state.
- **The printed date is the paper's** in every print.
- **The links** show `http://127.0.0.1:3999/…` only because the local render runs on http; `tautanCetak` strips `https://` in production. The token is whole and wraps cleanly.

**Outside CI-1b's scope, for AR-A (J7-2's sibling), not a CI-1b finding:** under the «Sedang ditinjau» band, the certificate's own «Periksa keaslian» text still says «Halaman itu memastikan sertifikat ini benar diterbitkan dan masih berlaku.» (EN: «That page confirms this certificate was genuinely issued and is still valid.»). The band and the QR already tell the truth, so the paper doesn't mislead; but «masih berlaku» is a promise the page can't make for a certificate under review. **Suggested AR-A words:** «Halaman itu menunjukkan apakah sertifikat ini benar diterbitkan dan bagaimana keadaannya sekarang.» / «That page shows whether this certificate was genuinely issued and what its status is now.» This changes the certificate component, so it belongs in AR-A, not CI-1b.
