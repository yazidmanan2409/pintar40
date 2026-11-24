# CI-1 · The refusal when a now-failing certificate is confirmed (Daisy, 24 Nov 2026)

> **What holds now:** final words for `studio.koreksi.galat.cert_review_result_no_longer_passes` (database code `CERT_REVIEW_RESULT_NO_LONGER_PASSES`). This closes the wording side of J7-1 / L-67.

| | Words |
|---|---|
| **ID** | «Sertifikat ini tidak dapat dikonfirmasi berlaku: hasilnya setelah dihitung ulang tidak lagi memenuhi kriteria kelulusan. Keputusan yang tersisa adalah «Cabut». Tidak ada yang diubah.» |
| **EN** | «This certificate can't be confirmed as valid: its recalculated result no longer meets the passing criteria. The decision left is «Revoke». Nothing was changed.» |

**Why these words:**
- **«kriteria kelulusan» / «passing criteria»** is the certificate's own phrase (R-b), so the refusal speaks the same language as what it protects.
- **«Cabut» / «Revoke»** is the exact button label on the same card (`config.tinjau_sertifikat.cabut`).
- **«Tidak ada yang diubah.»** tells the reviewer the refused press left everything as it was, which is ruling 81's first question.
- **No learner figures:** the card already shows «hasil dihitung ulang 67% → 50%, target 60%».
- **No blame:** it says what the result is, not what the reviewer did wrong.
