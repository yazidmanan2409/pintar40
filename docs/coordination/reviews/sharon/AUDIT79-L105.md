# Audit 79 · L-105: a revoked or replaced certificate prints as a clean, valid-looking certificate — Sharon

**Work:** the builder's J7 capture (`claude/audit-79-world` `5e0d0392`, `audit/79/tangkapan/63ff05e9/j7/`, with its PDFs). Read from the capture's description.

## (1) Severity: HIGH, the integrity of a printed credential. The QR mitigates it, but not enough

- **A printed certificate is a credential in its own right:** it is shown, filed and photocopied.
- After «Cabut» or a reissue, the browser's print drops the banner and produces a document asserting a pass and a valid award:
  - Citra's revoked /00001;
  - Ratih's replaced /00001, under her **old** name.
- **The QR resolves to the live status, but that is mitigation, not a control:** most people who receive a paper never scan it. A printout made after revocation is exactly the forged-looking artefact the revocation exists to stop.
- **Not Critical:** it takes the holder's deliberate act of printing a certificate they know is revoked, and the public check tells the truth to anyone who does verify.
- **It must be fixed before the first real certificate**, the same gate as L-67.

## (2) Yes, CI-1's principle requires the print to carry the state

- **Ruling 96's three facts apply to every surface, printed copies included.** P7 named the card **and its print.** The browser's print media is that print, whether or not the page offers «Cetak».
- **What the print must carry**, read from the same helper (`sertifikat_saya_ditinjau` / `sertifikat_dipersoalkan`, and the certificate's own status):
  - **DICABUT or DIGANTIKAN:** do not print a credential.
    - The print stylesheet shows only a notice: «Sertifikat ini telah dicabut / digantikan pada {tanggal} · periksa: {tautan}», with the QR.
    - Or it prints the sheet under an unremovable full-page mark («DICABUT» / «DIGANTIKAN»).
    - The banner must **never** be `display:none` in print.
  - **DITINJAU:** the sheet may print, with a fixed line «Status saat dicetak: sedang ditinjau oleh sekolah penerbit · periksa kode QR untuk status terkini», and the print date.
    - The comment "the QR resolves live" stays true, but the paper must not imply a settled status it doesn't have.
  - **BERLAKU:** as today.
- **The replaced certificate's old name:** for DIGANTIKAN, the notice names the replacement's existence, not the old details as a credential.

## (3) Where it goes: a small follow-up, CI-1b, after CI-1. Not AR-79

- **CI-1 is frozen and stays as it is.** CI-1b is app and print-stylesheet only, reading values the page already has, with no migration.
- **Its red-first proofs,** taken from the rendered PDF (print media) of each state:
  - DICABUT and DIGANTIKAN print no credential, or carry the mark;
  - DITINJAU prints the line;
  - BERLAKU is unchanged.
- **The plant:** the banner hidden in print turns it red.
- **It joins L-67's gate:** before the first real certificate. **It is not a production blocker** for the current scope, since no certificate exists on production.
- Daisy writes the words.
