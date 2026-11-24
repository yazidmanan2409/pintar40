# D2-R · Final recheck of the candidate (Daisy, 24 Nov 2026)

> **What holds now:**
> - **PASS, conditional on CI** (ci 45329600686, journeys 45329603910). No finding.
> - **Read:** a local build of `claude/d2r` at `5550e508`, with a fresh database reset and a fresh synthetic report world. 1280, 390 and 320 px; 0 px sideways overflow on every page below.
> - **Captures:** `d2r-layar-5550e508/`.

## How the three certificate states were reached (local, disposable database only)

- **ELIGIBLE** (a row being prepared): `certificate_prepare` for one learner's passed sitting, as `/api/certificates/issue` does when the player submits.
- **ISSUED:** by opening that learner's certificate page.
- **No row, none possible:** one passed sitting set to `evidence_class = SYNTHETIC`, so `certificate_eligibility` says «not OFFICIAL and can never reach ELIGIBLE (INV-20)».
- **Note:** the report world writes sittings without the player, so its passes start with no row. In the product the player creates the row on submit, so a learner normally meets ELIGIBLE, not the empty state.

## Checks

| Check | Seen |
|---|---|
| **§13, ELIGIBLE** (`d2r3-lulus-disiapkan-390`) | «Lulus.» → «Sertifikat Anda sedang disiapkan.» → «Lihat sertifikat» → «Baca lagi:» … The Hasil Belajar row: «Lulus. Lihat sertifikat» |
| **§13, ISSUED** (`d2r3-lulus-terbit-390`, `d2r3-hb-terbit-390`) | The link alone, on the result and on the row |
| **§13, no row** (`d2r3-tanpa-baris-390`, `d2r3-hb-tanpa-baris-320`) | «Lulus.» and its line, then «Baca lagi:», with **no certificate line and no link**, on the result and on the row |
| **H-1, ruling 91** | Certifying rows read «7 dari 8 soal · Lulus.» and «2 dari 8 soal · Belum lulus.». No percentages, no bar, no Pemetaan Awal comparison, on screen and in print |
| **§12** | Section C: «Baca lagi bagian yang ditandai «baca lagi» (…), lalu tanyakan kepada guru langkah berikutnya.» It matches section B's marks |
| **N-22** | In print, «Lihat sertifikat» is not visible |
| **R-h, «Belum lulus»** | Unchanged and correct |

## Carried to the audit (not D2-R)

- N-21: the subject repeated in the course name.
- N-23 and L-33: «mencapai target» / «targetnya tercapai» beside «Lulus» in Hasil Belajar's summary and footer.
