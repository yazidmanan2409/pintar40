# Sertifikat PINTAR · round 2: Yazid's Modern composition, refined

**Design only (D-076).** Nothing here is application code: no `src/` change, no `hle.ts` key, no migration, no CI. Round 1 (`../`, `dd292f6`) is left as it was, for comparison.

- **Brief:** `docs/coordination/briefs/DAISY-SERTIFIKAT-ROUND-2.md`, Yazid's draft revised by the coordinator (D-076), with Yazid's reference image. The image travels with the brief and is not committed; H shows it beside the two rounds.
- **The direction:** Yazid's revised Modern composition, refined and not redesigned. Achievement → Issuer → Verification.
- **Since then:** D-078 says certificate design is done and the next step is its truth contract (BOB-48, DAISY-36). This round is the refinement DAISY-36 implements once it is reviewed and accepted.
- **Samples:** every person, school, number and token is invented. The people and schools are the card's (`kartu-pintar/ronde-2`), so the samples agree person by person:
  - Ratna Dewi Kusumawardani holds the card's sample ID **A14CD7ST**, so her professional-learning certificate is `A14CD7ST/00001`.
  - Bagas Saputra (Yazid's reference sample) holds his own card ID **7Q2Z0D9K**. Giving him A14CD7ST would make card and certificate disagree, the opposite of the brief's aim.
- **The QRs** hold the proposed form, `https://verifikasi.pintarselalu.com/<token>`. That host does not resolve today; setting it up is a production change for Yazid (D-039). When it does resolve, these invented tokens will read as not found.

## Contents

| File | What it is |
|---|---|
| `sertifikat2.mts` | The grammar: one function, `sertifikat(data, words, options)`, returning one A4 sheet in millimetres. It reuses round 1's tokens, fonts, QR drawing and colour helpers (`../sertifikat.mts`). |
| `buat-ronde2.mts` | The render script. It builds A–F and H from the grammar, with the words from `src/lib/hle.ts`. It also runs every check and test below and writes `render/laporan.txt`, and exits non-zero if a check fails. |
| `qr.py` | Makes the study's QR symbols with segno. The app's encoder (`src/lib/qr.ts`) makes byte mode only; the render script checks that its byte symbols agree with segno's. |
| `uji-ronde2.py` | Round 2's tests: the damage sweep, what a PDF gives back for the number and link, and the printer's unprintable margin. Round 1's `../uji-sertifikat.py` runs the decode, stress and print simulations unchanged. |
| `cetak-usulan.css` | **The proposed print fix** (6): the exact replacement for the print block in `src/app/experience.css`. |
| `cetak-bukti.mts` | The print proof: today's page, before and after the fix, in round 1's harness (G). |
| `render/` | Deliverables A–H, the report `laporan.txt`, `G-laporan.txt` and `uji-qr.json`. |

**Run** from the repository root, with a Python that has `../requirements.txt` (round 1's, unchanged):

```bash
KARTU_PY=/path/to/python REF=/path/to/yazids-reference.png npx tsx docs/coordination/ux/sertifikat/ronde-2/buat-ronde2.mts
# G: the review harness first (a server-only shim may be needed, see ../README.md)
node claude/tools/render-screens/stylesheet.mjs "$OUT"
npx tsx claude/tools/render-screens/screens.tsx "$OUT"
KARTU_PY=/path/to/python npx tsx docs/coordination/ux/sertifikat/ronde-2/cetak-bukti.mts "$OUT"
```

`REF` is optional. Without it, H shows a labelled blank where the reference goes.

## Deliverables

| | What | Where |
|---|---|---|
| A | The refined certificate, normal colour (screen paper, and print on white) | `render/A-sertifikat-akademik.png`, `A-sertifikat-akademik-cetak.png` |
| B | Academic (plum) and professional learning (sage), and both in print | `render/B-plum-dan-sage.png` |
| C | Stress: long name, long course, long school, the number, a 16-character token; one-word name; a beyond-realistic probe | `render/C-stres.png` |
| D | Greyscale; office colour, monochrome and toner-saving print, simulated; why the band is inset | `render/D-abu-dan-cetak-kantor.png` |
| E | The A4 PDF at 100%: a cover marked «Cetak pada 100% … Jangan pilih "Sesuaikan dengan halaman"», with a scale check, then one certificate per page | `render/E-A4-100persen-tanpa-sesuaikan.pdf` (12 pages) |
| F | The verification detail: the QR at actual size with decode, stress and damage results, the printed link, the number | `render/F-verifikasi-detail.png` |
| G | The print proof: today's page before and after the fix, four ways, as PDFs and a board | `render/G-*.pdf`, `G-cetak-sebelum-sesudah.png`, `G-laporan.txt` |
| H | One page: what changed from round 1, and against the reference | `render/H-sebelum-sesudah.png` |
| I | This README | |

**E's pages:**
1. The cover.
2. A.
3. B.
4. C, long, with the 16-character token.
5. C, one word.
6. D, greyscale.
7–10. QR study symbols, for scanning with real phones:
    - byte V4-M;
    - alphanumeric V3-M;
    - alphanumeric V4-H;
    - the 16-character token in byte.
11. The number 4+4 with the link grouped, for reading and typing with real people.
12. The band full bleed, as the reference drew it, for comparing on real paper.

## 1. Every change, and why

H shows these on one page.

**From round 1 (Modern, `dd292f6`):**

| | Round 1 | Round 2 | Why |
|---|---|---|---|
| 1 · Axis | Left-aligned, 24 mm margin | One centred axis, 20 mm margin | Yazid's composition. A centred sheet reads as a certificate at first glance. |
| 2 · Header | «SERTIFIKAT PENGUASAAN» alone, 10.5 pt. «PINTAR SELALU» a 7 pt colophon at the foot. | «SERTIFIKAT PENGUASAAN» upper-left in the accent; «PINTAR SELALU» upper-right in PINTAR green. Both 12 pt capitals, in type. | Decided (D-074, D-076). The pair says what the paper is and whose system proves it, at one level, before the name. |
| 3 · Achievement | Name, «telah menuntaskan», course and Predikat sat on the line and grew upward. | Name 33 pt, «telah menuntaskan» 12 pt, course 16.5 pt, centred between the header and the record. | The name dominates and the course stays directly under the statement. A long name or course re-centres instead of climbing. |
| 4 · Record | Predikat under the course; date and number at the foot. | Predikat, Tanggal terbit and Nomor sertifikat in one block of three rows, 16 mm above the line. Labels are right-aligned and meet the values at the page's axis. | Decided: one restrained record block. Meeting at the axis keeps the block centred whatever the values' lengths. |
| 5 · Number | `PINTAR/SMP-CAHAYA-KALIANDRA/2026/00042`: the school's slug and the year, up to 70 characters, over two lines | `A14CD7ST/00001`, 14 characters, unbroken, Plex Mono 12 pt | The proposal (§3). Unbroken, it is the one form a reader can search and copy. |
| 6 · Band | Inset 12 mm, 5 mm padding, left-aligned; school 12.75 pt | Inset 10 mm, 34 mm tall; «Diterbitkan oleh» 9 pt capitals over the school at 16.5 pt, centred | The issuer gets the weight Yazid's band gives it, and the inset keeps it whole on every printer (§7). |
| 7 · Gold line | 0.75 mm at 176 mm | Unchanged | Its width follows the card's physical proof (§6). |
| 8 · Verification | Three columns at the foot: facts, text, QR | One centred group: «Periksa keaslian», its sentence and the printed link, with the QR beside them in its quiet zone | Decided: a quiet verification area, with the QR in generous clear space. |
| 9 · Link | `https://…/verifikasi/` + 43 characters: 83 characters, two lines | `verifikasi.pintarselalu.com/K7M4QX9P2HDT`: 40 characters, one line, no protocol | The proposal (§2). |
| 10 · QR | Byte 5-M, 37 modules of 0.70 mm | Uppercase alphanumeric 4-Q, 33 modules of 0.79 mm, the same 26 mm | §2: bigger modules and 25% recovery at the same size. |
| 11 · Type | Three print-only 7 pt sizes | Every size a step of the app's ladder; the smallest is the eyebrow, 9 pt (12 px) | One type system with the screen. Nothing on the paper is smaller than anything the app sets. |

**Against the reference.** Its slips are corrected, as the brief lists, plus refinements Yazid can overrule one by one:

| The reference | Round 2 | Why |
|---|---|---|
| «DI TERBITKAN OLEH» | «Diterbitkan oleh» | One word, as `verifikasi.institusi` (a slip). |
| «Matematika . Bab 4» | «Matematika · Bab 4» | The app's middle dot (a slip). It stays with the subject at a line break, so a line never starts «· Bab 5» (a no-break space before the dot). |
| Number and link placeholders | `A14CD7ST/00001`, `verifikasi.pintarselalu.com/<token>` | The proposals, §2–3. |
| The band to the paper's edges | Inset 10 mm | An office printer cannot print the outer 3–4.2 mm. A full-bleed band therefore ends in a thin white sliver that differs by printer and looks like a fault; an inset is deliberate and the same everywhere (D). |
| The school in capitals | The school as recorded | Capitals flatten names schools write in mixed case (MTs, SMPIT) and a long name no longer fits two lines. The label above is already in capitals. |
| A gold rule of about 2.3 mm | 0.75 mm | The card's. Its final width follows the card's physical proof. |
| Record labels in a left column | Labels right-aligned to the axis, values from it | The block stays centred on the page's axis. |
| The verification sentence (three lines) | The same words; the sentence never ends in a one-word line | `text-wrap: pretty`. |

**Nothing is added:** no photo, logo, signature, seal, border, watermark, flourish or celebratory graphic.

**The grid** (mm, A4 portrait):

| | Value |
|---|---|
| Text margin | 20 |
| Header | top at 22 |
| Achievement | centred between 36 and the record |
| Record | ends 16 above the line |
| Line | centred at 176 (the card's proportion), 0.75 wide |
| Band | 176 to 210, inset 10 each side |
| Verification group | top at 236, 130 wide, centred: a 92 mm column, 12 mm gap, then the 26 mm QR in a 4-module quiet zone |
| Foot | at least 31.4 clear |

The record, line, band and verification group never move. Only the achievement block re-centres. So every certificate has the same skeleton, whatever the lengths (C).

**The layout checks** run on 16 sheets, and all pass:
- every word at least 12 mm from each edge, the band 10 mm;
- the header's two words apart, each on one line;
- the achievement inside its space, 14 mm clear of the header and the record;
- every record value on one line;
- nothing crosses the line, and the school stays inside the band;
- the link on one line inside its column;
- the QR's quiet zone 4 modules and clear.

The beyond-realistic probe (3-line name, 4-line course, 2-line school) keeps 10.9 mm to the record: reported, not a target. The line counts and spaces per sheet are in `laporan.txt`.

## 2. The verification link and the QR

**The form.**
- The QR holds `https://verifikasi.pintarselalu.com/<token>`.
- The sheet prints `verifikasi.pintarselalu.com/<token>` without the protocol.
- The token is 12 Crockford Base32 characters (60 bits), opaque and random. It is never derived from the ID, the number or a sequence.

**Versions.** At 26 mm, the module size:

| Link | Byte | Uppercase alphanumeric |
|---|---|---|
| 12-character token (48 characters) | **4-M** (33 modules, 0.79 mm), 4-Q would be 5 | **3-M** (29 modules, 0.90 mm), **4-Q** and 4-H (33, 0.79 mm) |
| 16-character token (52 characters) | 4-M | 3-M, **4-Q**, 5-H |
| Round 1's 83-character link | 5-M (37 modules, 0.70 mm) | — |

- **Alphanumeric is smaller: 3-M against byte's 4-M.**
- At byte's own version 4, alphanumeric carries level Q (25% recovery) instead of M (15%).
- The app's encoder makes byte 4-M, the same version as segno's (checked by the script).

**Decode and stress** use round 1's method, from the PDF (E). The ✓ counts are the eight tests, each passed by both zxing-cpp and OpenCV. "Lowest dpi" and "Most blur" come from the graded sweeps; "Stain" is the damage sweep.

| Symbol | Module | Passed | Lowest dpi (zxing / OpenCV) | Most blur, σ px | Stain read through | About how far a 12 MP phone reads it (zxing / OpenCV) |
|---|---|---|---|---|---|---|
| Round 1, byte 5-M | 0.70 mm | 8/8 | 45 / 80 | 4.25 / 2 | 11% / 11% | 1.6 / 0.9 m |
| Byte 4-M (the app today) | 0.79 mm | zxing 8/8, **OpenCV 6/8** | 40 / — | 5 / — | 9% / 8% | 1.8 m / — |
| Alphanumeric 3-M | 0.90 mm | 8/8 | 35 / 65 | 6.25 / 4 | 9% / 8% | 2.1 / 1.1 m |
| **Alphanumeric 4-Q (proposal)** | 0.79 mm | 8/8 | 40 / 60 | 5.25 / 3.25 | **12% / 12%** | 1.8 / 1.2 m |
| Alphanumeric 4-H | 0.79 mm | 8/8 | 40 / 60 | 5.5 / 3.75 | 17% / 17% | 1.8 / 1.2 m |
| 16 characters, alphanumeric 4-Q | 0.79 mm | 8/8 | 40 / 60 | 5.25 / 4 | 12% / 12% | 1.8 / 1.2 m |
| 16 characters, byte 4-M | 0.79 mm | 8/8 | 40 / 85 | 5.5 / 3.5 | 9% / 9% | 1.8 / 0.85 m |

Notes on the table:
- **"Stain"** is a grey patch grown over the lower right of the symbol, clear of the finder patterns: a stain, a stamp's edge, a fold's wear.
- **The distance** is an estimate. It is the farthest at which a 12 MP phone camera (70° across 4000 px) still gives the symbol the pixels per module the decoder needed at its limit; zxing's limit is 1.24 px a module for every symbol. It is not a phone test.
- **One finding: OpenCV missed the byte 4-M symbol for this link in 2 of 8 tests** (at actual size and at low contrast), so its graded sweeps stop at the first step (—). It did read the same symbol in the damage sweep's slightly wider crop, and zxing reads it everywhere. That is a fragile read, not an unreadable symbol, and it belongs to that one matrix: the 16-character link's byte symbol reads in all 8. It is reported for the study, not counted, and it is one more reason not to stay on the current symbol.
- **Print:** in office colour, monochrome and toner-saving print (55% density), and A4 on F4, the proposal's symbol decodes in every test for both decoders (D, and `laporan.txt`).

**Recommendation: uppercase alphanumeric at level Q, version 4.**
- It is the same 33-module symbol at 26 mm whether Bob sets 12 or 16 characters, so his choice costs the design nothing.
- Against round 1 it has bigger modules (0.79 against 0.70 mm) and reads through more blur (5.25 against 4.25 px zxing; 3.25 against 2 px OpenCV). It reads at a lower resolution for OpenCV (60 against 80 dpi) and through a stain at least as large (12% against 11%).
- **Why not the others:**
  - 3-M is the smallest and reads furthest, but has the least recovery (9%). A certificate is kept for years, folded, stamped and photocopied, so recovery matters more than a few centimetres of reach.
  - H recovers most (17%) but moves to version 5 at 16 characters.

**Bob confirms:**
- The route accepts the uppercase form. The scheme and host are case-insensitive by definition; the token path must match in capitals, which Crockford tokens already are.
- The app's encoder gains alphanumeric mode and level Q. Today it makes byte mode only.

**The printed link:**
- 12 characters: 40 characters, 76.2 mm, one line.
- 16 characters: 44 characters, 83.8 mm, one line, in the 92 mm column.
- A double-click selects the token alone, and a PDF search finds the whole printed link (F).

**Grouping** (`K7M4-QX9P-2HDT`, 42 characters) is studied (E page 11, F) and **not proposed**. It helps only if Bob's route ignores the hyphens, as Crockford decoding allows, so it depends on his route.

**The brief's benefits, validated:**

| Benefit | Measured |
|---|---|
| A cleaner sheet | The link: 83 characters over two lines → 40 on one. The number: up to 70 characters over two lines → 14 on one. |
| A shorter payload and a less dense QR | 83 → 48 characters; 37 → 33 modules; each module 12% larger. |
| Easier scanning | Every limit is better than round 1 (table), and the recovery rises from 15% to 25%. |
| A PINTAR-owned destination | `verifikasi.pintarselalu.com`, pending its set-up (D-039, Yazid's). |
| Practical manual typing | 12 characters after a memorable host. Crockford is case-insensitive and has no I, L, O or U, so the characters people confuse most cannot occur. The pairs that remain are in §3. |

## 3. The number

**The proposal:** `A14CD7ST/00001`, the holder's PINTAR ID, a slash, and that person's certificate sequence. The design relies only on it being 14 characters, uppercase and fixed. The sequence and its concurrency, the change to the signed record, and C17 are not the design's to settle.

**Reading, dictating, typing: tested in three forms** (F):

| Printed as | A PDF search for the stored form | The PDF's words | Double-click on screen | Copying the value |
|---|---|---|---|---|
| **Unbroken** `A14CD7ST/00001` | **found** | `A14CD7ST/00001` (one word) | `A14CD7ST` | `A14CD7ST/00001` |
| 4+4, a space `A14C D7ST/00001` | not found | `A14C` · `D7ST/00001` | `A14C` | `A14C D7ST/00001` |
| 4+4 drawn as a gap, no space character | not found | `A14C` · `D7ST/00001` | `A14CD7ST` | `A14CD7ST/00001` |

What the forms mean for a reader:
- **The gap trick fails where it matters.** On screen it copies the stored form, but the PDF (what «Cetak atau simpan PDF» produces) turns the gap back into a space.
- **Only the unbroken form is found by a search for the number in its own PDF, and a PDF viewer takes it as one word.**
- **Dictating.** People chunk an 8-character code by themselves («A-satu-empat-C, D-tujuh-S-T, garis miring, nol-nol-nol-nol-satu»), so printed spaces add little to reading aloud.
- **Typing.** A person types what they see, so a printed space arrives in any search box, and a search matches it only if it ignores spaces as ID entry does (IDENTITY-4.0 §4).

**Recommendation: print the number unbroken, exactly as stored.**
- IDENTITY-4.0 §4 displays the *ID* 4+4, as the card does, for reading at a sign-in.
- The certificate's number is a different object: a record label people copy, search and quote.
- If Yazid prefers the card's 4+4 for consistency:
  - every search on the number must ignore spaces;
  - a PDF viewer's own search will still miss the stored form.

**IBM Plex Mono at certificate size.**
- The number is 12 pt (cap height 2.95 mm); the link is 9 pt (2.22 mm).
- The brief's pairs, plus 6/G, were rendered at 300 dpi and measured three ways. The score is the share of ink that differs between the two glyphs: sharp, then after an office copy (blur), then after that copy is photographed at 150 dpi.
- E/F is the reference: a pair nobody confuses in print.

| Pair | 12 pt (sharp / copy / photographed copy) | 9 pt |
|---|---|---|
| 0/D | 0.37 / 0.32 / 0.30 | 0.56 / 0.44 / 0.46 |
| 1/7 | 0.67 / 0.61 / 0.59 | 0.69 / 0.62 / 0.62 |
| 2/Z | 0.39 / 0.35 / 0.33 | 0.38 / 0.32 / 0.31 |
| **5/S** | 0.31 / 0.26 / **0.24** | 0.45 / 0.36 / 0.38 |
| **8/B** | 0.44 / 0.39 / 0.42 | 0.31 / 0.23 / **0.27** |
| 6/G | 0.66 / 0.57 / 0.57 | 0.47 / 0.38 / 0.38 |
| E/F (reference) | 0.30 / 0.29 / 0.32 | 0.34 / 0.31 / 0.34 |

What the scores say:
- Plex Mono separates 1/7, 6/G and 0/D (its zero has a dot) well at both sizes.
- **Two pairs fall below the reference after a photographed copy: 5/S in the number at 12 pt, and 8/B in the link at 9 pt.**
  - The number is a label, so a misread costs a failed search, not a false verification.
  - The link's token is the fallback to the QR, and a wrong token finds nothing.
  - **So the number stays at 12 pt and the link at 9 pt, never smaller.** A larger link would not fit a 16-character token on one line.
- The card uses the same face.
- Crockford's alphabet already removes I, L, O and U, the pairs that fail worst.

## 4. «telah menuntaskan»: the wording

What the certificate proves: an official result on the Uji Penguasaan reached the course's pass mark (`certificate_eligibility`). That is the mastery standard met, not the course finished.

| Candidate | Says | Against what it proves |
|---|---|---|
| **«telah menuntaskan»** (today) | brought to *tuntas* | ***Tuntas* is the school word for meeting the mastery criterion:** *ketuntasan belajar*, the minimum mastery criterion schools use, and *tuntas* / *belum tuntas* on report cards. It says the standard was met, and it shares its sense with «Penguasaan». |
| «telah menyelesaikan» | finished | **Underclaims.** It says the course was done. A learner who worked through every lesson and did not reach the pass mark has also *menyelesaikan*. |
| «telah menguasai» | has mastered | **Overclaims** for one assessment, and repeats the heading's noun as a verb. |
| «telah lulus» | passed | Reads as graduation (*lulus sekolah*), and flattens the mastery standard into a pass. |
| «dinyatakan tuntas dalam» | declared *tuntas* in | Accurate, but a report card's passive voice. It puts the institution before the learner, where the sheet puts the person first. |
| «telah memenuhi standar penguasaan» | met the mastery standard | Exact, but bureaucratic and long; the heading already says Penguasaan. |

**Recommendation: keep «telah menuntaskan».**
- It is the one verb that says what the certificate proves, in the words schools already use for it.
- It works for professional learning too. «Ratna Dewi Kusumawardani telah menuntaskan Pengembangan Profesi · Merancang Asesmen Formatif di Kelas» reads as a teacher completing a course to its standard (*menuntaskan pelatihan*).
- **Yazid decides.**

A note for DAISY-36's copy: the English telling of `sertifikat.diberikan` is "has completed", which underclaims in the same way as «menyelesaikan». The renders are in Bahasa Indonesia, and no key changes this round.

## 5. The accent

| Context | Accent | Heading on white | Band words (paper) on the accent | In greyscale |
|---|---|---|---|---|
| Academic | plum `#725471` | 6.52:1 | 6.24:1 | `#5E5E5E` |
| Professional learning | sage `#446A4B` | 6.16:1 | 5.90:1 | `#616161` |

- **The whole grammar was tested in print** (B, D). Sage is not strengthened. Plum and sage differ by hue at nearly the same lightness, so they sit as a pair and neither reads as the louder.
- **In greyscale or monochrome print they become the same grey (1.05:1).** The band does not carry the context alone:
  - its words say who issued the certificate;
  - the course title says what was learned, and a professional-learning title begins «Pengembangan Profesi ·».
  - Nothing on the sheet depends on colour.

**Contrast** (WCAG 2.x, text 4.5:1). In print the paper is white; on screen it is `#FBFAF7`.

| Pair | Ratio |
|---|---|
| Name, course, values, number, link (ink) | 14.61:1 |
| «telah menuntaskan», the verification sentence (ink-2) | 7.07:1 |
| Record labels (ink-3) | 5.53:1 (5.30:1 on screen paper) |
| «PINTAR SELALU» and the QR's modules | 7.39:1 |

All hold in greyscale.

## 6. The gold line

- 0.75 mm, the card's, at 176 mm (the card's proportion), lying on the band's top edge.
- It is structure, not information: 2.59:1 against white, 2.52:1 against plum, 2.38:1 against sage.
- It prints in every simulation (D), and prints with «Background graphics» off (E, G).
- **Its width follows the card's physical proof (D-074(12)); it is not frozen here.** One constant in the grammar, `GARIS_MM`, carries it.

## 7. Printing, and the fix for today's print

**One action, «Cetak atau simpan PDF»; no server-side PDF.** The sheet prints itself through the browser's dialog.

**Today's print**, from round 1's harness on today's head (the real `KartuSertifikat`, the real compiled stylesheet, assembled as the page is). Chromium prints it as the dialog opens:
- **two pages**;
- the on-screen card first, then the sheet broken across both pages;
- the green rule lost;
- the browser's date, title, address and page numbers on both pages.

**The fix:** `cetak-usulan.css`, the exact replacement for the print block in `src/app/experience.css` (its lines 341–349 on `ca7078c`):
1. **A named page**, `@page sertifikat { size: A4 portrait; margin: 0 }`, which the sheet takes with `page: sertifikat`. It sets the page size and margins where the sheet is, and never on another page of PINTAR someone prints.
2. **A page that holds the sheet prints only the sheet.** Everything else steps aside: the on-screen card (which is not `pin-noprint`), the print heading's empty box, a banner, anything added later. This uses `:has(.pin-printwell)`.
3. **The sheet is exactly the paper:** 210 × 297 mm, no transform, `break-inside: avoid`. `max-height: 100vh` means that if a reader overrides the margins, the sheet shrinks to the printable area instead of spilling onto a second page.
4. **`print-color-adjust: exact`** on the sheet: the rule's colour prints with «Background graphics» off.

**The proof (G).** Every PDF is in `render/`, each measured in `G-laporan.txt`.

| Printed as | Before | After |
|---|---|---|
| The dialog as it opens: A4, «Default» margins, headers and footers on, background graphics off | 2 pages; the certificate twice; the rule missing; date, title, address and «1/2», «2/2» on both | **1 page**, 209.9 × 297 mm; once; the rule printed; **no browser lines**; the QR reads back |
| Every option in the sheet's favour | 2 pages; twice | 1 page; once; the rule printed |
| Letter paper instead of A4 | 2 pages; twice; the rule missing; browser lines | 1 page (Letter); once; the rule printed; no browser lines. The sheet gives way vertically to fit 279.4 mm, and the QR keeps its size |
| The reader overrides the margins (10 mm, headers on) | 2 pages | 1 page; once; the rule printed. **The browser prints its lines in the margins the reader chose** |

**What the page can and cannot control of the browser's own lines:**
- **Date, address (URL), page numbers.**
  - The page cannot change or remove them.
  - It can leave them no room: with margin 0, the dialog's «Default» margins (which follow the page's `@page` rule) have nowhere to print them. That is the proof's first row.
  - A reader who chooses «Minimum» or custom margins and ticks «Headers and footers» gets them anyway. That is the last row, and nothing on the page can prevent it.
- **Title.**
  - The page controls what the title says: the document's title, which is also **the file name «Simpan sebagai PDF» suggests**.
  - Today every page's title is «PINTAR» (`app.name`), so a saved certificate is `PINTAR.pdf`.
  - A certificate page title such as «Sertifikat Penguasaan · Bagas Saputra» would name the file for what it is. That needs a copy key, so it is **for DAISY-36, not this round**.
- **Paper and scale.**
  - The page asks for A4 at 100%. «Simpan sebagai PDF» honours that.
  - A physical printer set to Letter or F4, or a reader choosing «Sesuaikan dengan halaman» or a custom scale, decides for itself. With the fix the sheet still leaves as one page (proof row 3; A4 on F4 is in D).
- **Other browsers.** The harness is Chromium, and named pages and `@page` size differ by engine. Firefox and Safari, on desktop and phone, are **to be checked on real devices in DAISY-36**, as is the real page (the harness assembles it from components, not from the route).

## 8. Round 1's findings: for the Second Eye and Bob, not fixed here

These went to the Second Eye for classification, and to Bob where an engineering invariant is involved. **D-078 has since ruled most of them into BOB-48 and DAISY-36:**

| Round 1 finding | Where it stands |
|---|---|
| The course read through the learner's active assignments, falling back to «Sertifikat» | BOB-48: the course from the certificate's sealed release |
| The school's name read live | BOB-48: the name as at issuance |
| «Perlu Pendampingan» on a certificate | D-078: not certificate-eligible, from the canonical grade rule; BOB-48 enforces; DAISY-36 designs the not-eligible state |
| The language following the viewer | BOB-48: one language fixed at issuance |
| Studio's layout choice doing nothing | DAISY-36: the picker removed |
| The token and QR capacity | §2 here: 48 characters, alphanumeric 4-Q; the token length is Bob's |

**Yazid's principle:** a historical certificate never silently changes meaning because the application's current state changed. So every render here shows the certificate **as issued**: the name, the course and the school as they were at issuance, in Bahasa Indonesia.

## 9. What stays open

**FOR YAZID**
1. **The wording** (§4): recommendation, keep «telah menuntaskan».
2. **The number** (§3): recommendation, print it unbroken.
3. **The refinements to your reference**, each yours to overrule: the band inset 10 mm, the school as recorded rather than in capitals, the record labels meeting at the axis, the 0.75 mm line.
4. **The physical proofs**, to be printed from E at 100% on the school printers you have in mind:
   - the certificate, the band's inset against page 12's full bleed, and the line;
   - the QRs on pages 2–10, scanned with an iPhone camera and an Android camera, including that both open the **uppercase** link;
   - page 11 read aloud and typed by a colleague.
5. **The verification host** `verifikasi.pintarselalu.com` (D-039).
6. **C17:** whether a student's academic certificate may show their PINTAR ID. The design holds any 14-character label if not.

**For Bob**
1. The token's final length. The design holds 12 or 16 characters in the same symbol and on one line.
2. The route accepts the uppercase token path. Hyphen grouping only if the route strips hyphens; not proposed.
3. The app's encoder (`src/lib/qr.ts`) gains alphanumeric mode and level Q.
4. The number's sequence, its concurrency, and the signed record's change.
5. Any search on the number ignores spaces and case, as ID entry does, whichever form is printed.

**For DAISY-36 (the implementation, after acceptance)**
1. The sheet from this grammar.
2. The print fix (`cetak-usulan.css`), checked in Firefox and Safari and on the real route.
3. The certificate page's title (the PDF's file name).
4. The not-eligible state.
5. Studio's picker removed.
6. The English telling of «telah menuntaskan».
7. «Diterbitkan oleh» as the certificate's own key.
