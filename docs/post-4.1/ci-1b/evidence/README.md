# CI-1b · rendered prints for Daisy's PDF judgement (Second Eye, 26 Nov 2026)

> Local renders from 5cd81f9d stand in for the CI artifact 15091868185, whose download host is refused by the team's networks.

## What was rendered
- **Commit:** `5cd81f9d819f91261a9cb63b53f66b88b22bd6d5`, the reviewed and frozen CI-1b head (PR #33). The product is identical to `145bd8dc`.
- **Build:** `npm run build`, then `next start` in production mode on `127.0.0.1:3999`, with `PINTAR_BUILD_SHA=5cd81f9d…`.
- **Stack:** the local Supabase stack, freshly reset with the repository's seeds, plus the test harness SQL (`selftest/db/fable01, 03, 04, 06, 09, 11, 12, 13`).
- **Data: synthetic only.** The bootstrap school «PINTAR Bootstrap (OFFICIAL evidence — development and CI only)» and its learner «Siswa Bootstrap».
  - The certificate is sealed by the product's own functions, `certificate_prepare` and `certificate_seal`, signed with the local synthetic key.
  - One fresh certificate per print, so the numbers run `…/00001` to `…/00004`.
  - The state is written past the guards, as CI1B-A01 and S21j do:
    - DITINJAU: a confirmed key correction with two different people (`boot-admin` proposes, `boot-kaprodi` decides) and an open `certificate_reviews` row.
    - DICABUT: `status = 'REVOKED'` with `revoked_at = now()`.
    - EN: `language_as_issued = 'en'`.
  - The links point to `127.0.0.1:3999`.
- **Browser:** Chromium (Playwright), signed in as the learner. It opens `/belajar/<tugas>/sertifikat`, prints with print media to A4 (`printBackground`, `preferCSSPageSize`), and makes a PNG of each page with `pdftoppm -r 100`.
- **Script:** `render-ci1b.ts.txt`. It runs from `selftest/` as `npx tsx selftest/_render-ci1b.ts <app> <out.pdf> <state> <id|en>`. It is not committed as a test.

| File | Journey | State · certificate language | Print path |
|---|---|---|---|
| `S21i-BERLAKU-ID.pdf` / `-1.png` | S21i | BERLAKU (valid) · ID | official: «Cetak atau simpan PDF» → `router.refresh` → `window.print` (call recorded), then the PDF in print media |
| `S21j-DITINJAU-ID.pdf` / `-1.png` | S21j | DITINJAU (under review) · ID | official, as above |
| `S21j-DITINJAU-EN.pdf` / `-1.png` | S21j | DITINJAU (under review) · EN | official, as above |
| `S27v-DICABUT-ID.pdf` / `-1.png` | S27v | DICABUT (revoked) · ID | the browser's own print: the product removes «Cetak» for a revoked certificate |

Each PDF is one A4 page.
- **BERLAKU:** the certificate with «PERIKSA KEASLIAN», its sentence, the link and the QR.
- **DITINJAU:** the review line («Sedang ditinjau: …» / «Under review: …», with «Dicetak / Printed 26 November 2026») ahead of the same certificate. In EN the heading is «CHECK IT IS GENUINE».
- **DICABUT:** only the notice: «Dicabut oleh penerbit», the statement, «Lembar ini bukan sertifikat.», the QR, the link and «Dicetak …». No name, no pass sentence.

Headless Chromium's `window.print` returns at once. The paper is therefore made with `page.pdf` in print media after the official call. This is the same method as the earlier local prints in FREEZE-EVIDENCE.md §6.

## sha256
```
1156e17224262ba7636e3bd64014d5985098d112025ab1313da8067ac0dcfd2d  S21i-BERLAKU-ID.pdf
6f1651308cafb7be206f62a6a67708fbd1fe8271f534f54bb079db12c1dd4eec  S21j-DITINJAU-EN.pdf
c04e2b018ab10752ea50accf871ccb66093b7b0ac992e263410407e79bb131c5  S21j-DITINJAU-ID.pdf
ff1c798a267cc488da261524d98d13ea5edcf71b76ac3196ace1d47bc6b09653  S27v-DICABUT-ID.pdf
15a7c47a25f78f3e4a3bc0941f30a66c2c905363156d5cd0a074f65de388a427  S21i-BERLAKU-ID-1.png
50fe4ba24d74a5c1aa72eec30a37adb663ee1a86566fbcab531f578dc757be4d  S21j-DITINJAU-EN-1.png
88c88025c9a75c2a6f3f7ea17636fd5164454a12d6ecd01ea9919385a4e2d9b4  S21j-DITINJAU-ID-1.png
7f7d55de169b99659fa87bdf7f227654f6791ce31a84c7d0b90107f9363fc086  S27v-DICABUT-ID-1.png
eec395f30c0784ef5f9542a798f9c3f81eb430a1e35d4fc0cea9a2c69fab142b  render-ci1b.ts.txt
```
