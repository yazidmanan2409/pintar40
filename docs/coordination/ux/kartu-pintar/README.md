# Kartu PINTAR: design exploration, round 1

**Status: design only.** Input to DAISY-24 (Gate 7, the card family). It does not replace DAISY-24, and nothing here is application code: no `hle.ts` keys, no migration, no CI. Yazid released Daisy from the Gate 2E pause for this task alone; DAISY-19's wiring, DAISY-20 and every code ticket stay paused.

Every person, school and PINTAR ID below is invented. The sample QR encodes `https://contoh.pintar.invalid/id/A14CD7ST`, a domain that can never exist (RFC 2606). The words on the card are proposals, not copy.

**Read first:**
- `auth/IDENTITY-4.0.md` §4, §5, §11 (at `main`);
- D-059 and C17;
- `design/PINTAR-DESIGN-SKILL-SPEC.md` §6, §7, §13, §14, §15, §17;
- `ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md` (D-068);
- `ux/email-frame/README.md`.

The spec and the Terminology v1 package are not on `main` yet; they were read from the coordinator's branch at `a026aee`.

## Files

| File | What it is |
|---|---|
| `kartu.mts` | The grammar: tokens, the six families in both palettes, the type styles, and one function per face (`depan`, `belakang`). Every card goes through it, so the six cannot drift apart. |
| `buat-kartu.mts` | The render script. It builds every render, the A4 PDF and the email and phone context, then runs the checks and writes `render/laporan.txt`. It exits non-zero if a check fails. |
| `uji-qr.py` | The Python half: the level Q/H symbols (segno), the decode tests, the colour distances, the CMYK round trip, and the PDF's font instances and page size. |
| `requirements.txt` | The Python packages, pinned. |
| `render/` | Everything listed under the deliverables below, plus `laporan.txt` (every measurement) and `uji-qr.json` / `.txt` (every decode). |

**Run it from the repository root** (Chromium comes from the preinstalled Playwright):

```
python3 -m venv .venv-kartu && .venv-kartu/bin/pip install -r docs/coordination/ux/kartu-pintar/requirements.txt
KARTU_PY=.venv-kartu/bin/python npx tsx docs/coordination/ux/kartu-pintar/buat-kartu.mts
```

The last run ended **"all checks passed"** in about 20 seconds.

## Deliverables

| | Render | What to look at |
|---|---|---|
| A | [`A-enam-depan.png`](render/A-enam-depan.png) | The six fronts: Yazid's HEX above, the equal-lightness variant below, each captioned with its colour, lightness, text colour and contrast. The lightness bars at the foot show the rank ladder. |
| A | [`A2-meja.png`](render/A2-meja.png) | The review question itself: six cards on a table with the wordmarks covered, in both palettes. |
| A | [`A3-kasus-uji.png`](render/A3-kasus-uji.png) | Stress cases, the Admin platform school line, and the two-role question. |
| B | [`B-detail.png`](render/B-detail.png) | One card, front and back, with the bleed, trim, safe margin, text margin and QR footprint drawn on; then the same card clean. |
| C | [`C-tipografi.png`](render/C-tipografi.png) | The type specification, the look-alike test and the smallest size. |
| D | [`D-qr-studi.png`](render/D-qr-studi.png) | The QR study: four treatments of the one sample link, with their specs and decode results. |
| E | [`E-A4-100persen.pdf`](render/E-A4-100persen.pdf) | **The print test.** Three A4 pages at 100%, with crop marks. Previews: [`E-A4-halaman-1.png`](render/E-A4-halaman-1.png), [`-2`](render/E-A4-halaman-2.png), [`-3`](render/E-A4-halaman-3.png). |
| F | [`F-email-600-terang.png`](render/F-email-600-terang.png), [`-600-gelap`](render/F-email-600-gelap.png), [`-320-terang`](render/F-email-320-terang.png), [`-320-gelap`](render/F-email-320-gelap.png), [`F-ponsel-390.png`](render/F-ponsel-390.png) | The card in the DAISY-19 email frame, and on a 390 px phone in Akun saya (a context mock; that screen is DAISY-20's). |
| G, H | this README | The recommendation, then every choice with its reason. |

## G. Recommendation

**The strongest direction is two layers, equal lightness, and the QR on the back in the PINTAR tile.**

1. **Two layers, the logo's own geometry.** The PINTAR SELALU mark is a light band over a dark band, and the front is built the same way:
    - The **light layer** carries what is permanent: the wordmark, the name and the PINTAR ID.
    - The **colour layer** carries the current chapter: the role and the school, read when the card is rendered.
    - That split is D-059(b) made visible: the ID is the person, the card is the chapter. With the wordmarks covered (A2), the two layers alone still say "PINTAR", and they do it with no ornament.
2. **The equal-lightness palette.**
    - All six colours sit at OKLCH L 0.482–0.489. One text colour, the card's own paper (#FBFAF7), reaches 6.00–6.06:1 on every card.
    - No card is lighter or darker than another, so a lineup no longer reads as a rank ladder (D-059(d)).
    - Yazid's hue directions are kept; only lightness, and for three colours hue or chroma, moved (§2).
3. **Back: QR B, the PINTAR tile.**
    - The QR sits on a tile in PINTAR's soft green, with the ID in mono beneath it. It is the app's own symbol (version 3-M, `src/lib/qr.ts`, unchanged), with 0.70 mm modules.
    - It decoded in all 8 tests with both decoders, and it has the same measured limits as the plain symbol (§7).
    - It is the one treatment that is recognisable as PINTAR's without touching the symbol, and it can appear the same way on paper, in the email and on screen.
    - **Fallback:** the plain QR A, if the tile's tint scans worse on Yazid's printed sheet.
    - **Not recommended:** C, the logo at the centre (§7).
4. **The front stays calm.** It has no QR: the front is who the person is, and the back is what the QR does.
    - On screen both faces are shown together, and the email repeats the ID, role and school in live text.

**The review question:** would six cards on a table, logos partly covered, still look like one PINTAR family, with none more important?
- **Equal-lightness variant:** yes on both counts ([A2](render/A2-meja.png)).
- **Yazid's HEX:** the family holds, but the lightness runs from Murid to Admin platform in near order of seniority. The text also flips from ink to paper along the way, so the charcoal card reads as the heaviest.

## 1. Format

| | Value | Reason |
|---|---|---|
| Size | CR80: 85.60 × 53.98 mm, corners 3.18 mm | ISO/IEC 7810 ID-1. The digital card keeps these proportions, so the same design prints later. |
| Safe margin | 3 mm | All type, the logo and the QR (quiet zone included) stay inside it. Checked on all 19 faces rendered: no element outside. |
| Text margin | 6 mm | Type sits well inside the safe margin, so a cut that is off by a millimetre still looks intended. |
| Bleed | 2 mm on every edge the colour touches | Both faces are full-bleed (the paper colour on top, the family colour below). Card printers differ (2–3 mm); 2 mm fits the A4 sheet's gutters. |
| Grid | Light layer 30 mm, colour layer 23.98 mm | The name group stands on the split and the chapter hangs from it, so the two read as one block. Long names grow upward; long schools grow down into the colour. |

**The A4 test sheet (E), three pages:**
1. The six fronts (equal lightness), the recommended back, and a scale box.
2. The same six in Yazid's HEX, with the plain back.
3. All four QR treatments, plus the six-word name, the two-role card and Admin platform.

**Page details:**
- Each page is headed **«Cetak pada 100% (ukuran sebenarnya). Jangan pilih «Sesuaikan dengan halaman». · Print at 100%, no fit-to-page.»**
- The scale box is a CR80 outline with a 50 mm ruler. If either measures wrong, the printer scaled the page.
- Crop marks start 3 mm off the trim, clear of the bleed.

**Measured in the PDF itself:**
- The pages are set to exactly 210 × 297 mm.
- Card papers measure 89.61 × 57.97–58.00 mm (89.60 × 57.98 expected, with bleed), and colour layers 89.61 × 25.98 mm. The largest error is **0.017 mm**.
  - Chromium snaps boxes to whole CSS pixels (0.26 mm), so the sheet is laid out ten times larger and printed at 0.1 scale.
- Fonts are embedded as TrueType: Plus Jakarta Sans Regular and SemiBold, and IBM Plex Mono Medium.
  - Chromium turns a variable font into Type3 outlines, so the script cuts static 400 and 600 instances from the app's own font file for the PDF.

## The grammar: how it was chosen

Design → render → look → revise. Three front grammars were sketched on one card before any styling:
- **Full colour field, all text reversed.** Calm, but it reads as a gift or bank card. It also puts every small line reversed out of colour, the weakest case in print, and needs a light-text colour that four of Yazid's six cannot carry.
- **A colour spine at the left** (book-like). Distinctive, but role names such as «Kepala departemen» wrap in the 27 mm spine, and the name column narrows to 48 mm.
- **Two layers (chosen).** First tried with the colour on top; it was flipped to match the logo (light over dark). The chapter was then moved from the card's foot up to the split, because a long school name crowded the split when it grew upward.

**Avoided on purpose:**
- **The bank-card look:** caps names, a number line, a chip.
- **The corporate badge:** a logo header band, a photo, a vertical format.
- **The government ID:** «Nama:» / «NIK:» labels, guilloche patterns.
- **The collectible:** foil, numbering, rarity colours.
- **Decoration:** no gradients, no borders on the card, no icons, no patterns, no security imagery.

The front carries no labels: the mono code under the name is self-evident, and the back names it «PINTAR ID».

## 2. Colours

**Yazid's working HEX, measured as given:**

| Family | HEX | OKLCH L | Paper #FBFAF7 | White | Surface-2 #F3F1EC | Ink #1F2A33 |
|---|---|---|---|---|---|---|
| Murid | #789EB5 | 0.68 | 2.73 | 2.85 | 2.53 | **5.12** |
| Guru | #688F78 | 0.61 | 3.48 | 3.63 | 3.21 | 4.03 |
| Kepala departemen | #587F7D | 0.57 | 4.24 | 4.42 | 3.92 | 3.30 |
| Dekan | #465B70 | 0.46 | **6.73** | 7.02 | 6.22 | 2.08 |
| Admin sekolah | #686560 | 0.51 | **5.56** | 5.80 | 5.14 | 2.52 |
| Admin platform | #393E41 | 0.36 | **10.37** | 10.83 | 9.59 | 1.35 |

Every text on the card is small text (4.5:1). On Guru and Kepala departemen no candidate reaches it, and on Guru even the better choice, ink, gives 4.03.

**The equal-lightness variant** keeps each hue direction and moves everything to one lightness. The target was 6:1 against the paper: enough margin that a print losing a quarter of its contrast still clears 4.5.

| Family | Yazid (OKLCH L / C / H) | Variant | L / C / H | What changed, and why |
|---|---|---|---|---|
| Murid | #789EB5 · 0.679 / 0.054 / 235 | **#436478** | 0.486 / 0.050 / 236 | Darker (−0.193). Hue kept. |
| Guru | #688F78 · 0.614 / 0.056 / 158 | **#466754** | 0.482 / 0.049 / 159 | Darker (−0.132). Hue kept. |
| Kepala departemen | #587F7D · 0.567 / 0.044 / 192 | **#406766** | 0.485 / 0.044 / 194 | Darker (−0.082). Hue kept. |
| Dekan | #465B70 · 0.462 / 0.043 / 249 | **#51607D** | 0.488 / 0.050 / 263 | Slightly lighter. Hue +15° toward indigo: at one lightness, «Deep Navy» and Murid's slate blue became the same blue. |
| Admin sekolah | #686560 · 0.508 / 0.009 / 81 | **#695E53** | 0.489 / 0.022 / 67 | Chroma doubled (warmer stone): at one lightness, the two near-greys were otherwise one grey. |
| Admin platform | #393E41 · 0.360 / 0.009 / 234 | **#5B6167** | 0.489 / 0.012 / 248 | Lighter (+0.129): «Charcoal» becomes a cool slate grey. Its darkness was exactly what put it at the top of the ladder. |

**How far apart the six stay** (CIEDE2000; 2 is roughly a just-noticeable difference, and side by side about 5 reads as clearly different):

| | Closest pairs | Median |
|---|---|---|
| Yazid, normal vision | Guru/Kepala departemen 10.2; Dekan/Admin platform 12.8 | 21.6 |
| Variant, normal vision | Guru/Kepala departemen 8.2; Murid/Dekan 8.8; Murid/Admin platform 8.9 | 17.0 |
| Yazid, deuteranopia (simulated) | Kepala departemen/Admin sekolah 9.8 | 16.8 |
| **Variant, deuteranopia (simulated)** | **Kepala departemen/Admin platform 0.9; Murid/Dekan 1.1** | 9.5 |
| Variant, protanopia (simulated) | Kepala departemen/Admin platform 1.8; Guru/Admin sekolah 2.0 | 9.8 |

**The trade-off Yazid should see.** Equal lightness removes the rank ladder, and it also removes the cue red-green colour-blind readers rely on most, which is lightness. For them, two pairs become the same colour. D-059 already requires the role to be written in text, and the card always writes it, so no one loses information. But the colour is then purely a family signal for sighted readers with full colour vision, and supplementary for everyone else. That is what IDENTITY §11 says colour should be. (The simulation uses the Machado 2009 matrices at full severity.)

**Print: which colours are likely to shift.** All sixteen colours round-trip through a CMYK profile with ΔE2000 ≤ 1.2 (MuPDF's built-in coated profile; an estimate, not the printer's own), so none is out of gamut. The risks are in the printers, not the gamut:

| Colour | CMYK build | Risk on an office or card printer |
|---|---|---|
| Admin sekolah #695E53, Admin platform #5B6167 (and Yazid's #686560, #393E41) | all four inks (e.g. 53/54/62/27) | **Highest.** Near-neutrals built from C+M+Y+K drift with the printer's grey balance: warm, green or pink casts. Proof these first. |
| Dekan #51607D (and #465B70) | 73/61/33/12 | Cyan plus heavy magenta can lean purple on inkjets. |
| Guru #466754, Kepala departemen #406766 | yellow-heavy greens and teals | Can print yellower, or duller on uncoated stock. |
| The paper #FBFAF7 | 1/2/2/0 | A 1–2% tint: either dropped or printed as speckle. **Specify it as unprinted card stock**, with the text on the colour layer knocked out to it. |
| PINTAR green #245F55 | 84/43/65/29 | Stable (ΔE 0.27). Dark colours generally print darker on uncoated paper, which raises the reversed text's contrast but can fill in thin strokes. |

## 3. Typography

PINTAR's own typefaces, self-hosted in the app (`public/fonts`, both **SIL OFL 1.1**: printing and embedding are allowed). No reason was found to depart from them.

| Style | Typeface | Weight | Size (em) | Line height | Tracking | Colour | Contrast | On screen, card 358 / 266 px |
|---|---|---|---|---|---|---|---|---|
| Person name | Plus Jakarta Sans | 600 | 12 pt (4.23 mm) | 1.15 | −0.01 em | ink #1F2A33 | 14.00 | 17.7 / 13.2 px |
| PINTAR ID | IBM Plex Mono | 500 | 9 pt (3.17 mm) | 1.2 | 0.06 em | ink-2 #4E5A64 (front), ink (back), green (tile) | 6.77 / 14.00 / 6.27 | 13.3 / 9.9 px |
| Role | Plus Jakarta Sans | 600 | 7.5 pt (2.65 mm) | 1.3 | 0; words +0.06 em | paper on the family colour | 6.00–6.06 | 11.1 / 8.2 px |
| School | Plus Jakarta Sans | 400 | 7.5 pt | 1.3 | 0.005 em; words +0.06 em | paper on the family colour | 6.00–6.06 | 11.1 / 8.2 px |
| QR instruction | Plus Jakarta Sans | 400 | 7.5 pt | 1.35 | 0.005 em; words +0.06 em | ink | 14.00 | 11.1 / 8.2 px |
| PINTAR wordmark | Plus Jakarta Sans | 600 | 6.5 pt (2.29 mm), caps | 1 | 0.14 em (`--tracking-wordmark`) | PINTAR green #245F55 | 7.08 | 9.6 / 7.1 px |
| Label («PINTAR ID») | Plus Jakarta Sans | 600 | 6.5 pt, caps | 1 | 0.08 em | ink-3 #5F6A73 | 5.30 | 9.6 / 7.1 px |
| Small supporting text | Plus Jakarta Sans | 400 | 6.5 pt | 1.3 | 0.01 em; words +0.06 em | ink-3 | 5.30 | 9.6 / 7.1 px |

**The system:**
- Two families, **four sizes** (12, 9, 7.5, 6.5 pt) and three weights: the app's own 400 and 600, and Plex Mono's single 500.
- Role and school share one size and are told apart by weight. Nothing is bigger for a more senior role.

**The hierarchy:**
1. The name.
2. The PINTAR ID, set with the name as one identity block.
3. The chapter (role, then school).
4. The wordmark: present, never loud.

**The smallest printed size is 6.5 pt,** and only for non-essential text: the wordmark, the «PINTAR ID» label and the website.
- At 6.5 pt, Plus Jakarta Sans's x-height is 1.23 mm (536/1000 em, read from the font). That is about the floor for an office laser or inkjet before the counters of a, e and s fill in.
- Everything a person must read is 7.5 pt or larger.
- Nothing below 7.5 pt is reversed out of colour.

**Word spacing.** Plus Jakarta Sans's own word space is only **0.17 em**, which is 0.45 mm at 7.5 pt: narrow enough for ink spread to close it. The small styles add 0.06 em. The name, at 12 pt, keeps the font's own spacing.

**Names are never shrunk and never cut.** A name wraps at a word to a second line and grows upward. Measured: the longest sample, «Ni Luh Putu Ayu Kartika Maharani Suryaningsih» (45 characters), takes two lines; every other sample takes one. A third line has not occurred. If a real name ever needs one, that is a question for Gate 7, not a silent shrink.

**Look-alike characters** (C, and the sample IDs, chosen to contain them):
- IBM Plex Mono's zero carries a dot, so 0 never reads as D.
- Its 1 has a flag and a foot, unlike 7. Its 2 has a curved top, unlike Z. Its 5 and S differ in their top stroke. Its 8 has two closed bowls against B's flat spine.
- Plus Jakarta Sans's zero is a plain oval: fine in a name, weaker in a code. That is why the ID is set in mono.

**Casing.** Role names are written exactly as Terminology v1 writes them (Murid, Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform). No other casing is proposed. Only the wordmark and the label are set in caps, and that is typographic, not a change to a word.

## 4. Contrast

Every pair on the card, measured with the same WCAG 2.x formula as the email frame's README. Every text on the card is small text, so the target is 4.5:1.

| Pair | Ratio |
|---|---|
| Name (ink) on paper | 14.00 |
| PINTAR ID, front (ink-2) on paper | 6.77 |
| Wordmark (PINTAR green) on paper | 7.08 |
| QR instruction (ink) on paper | 14.00 |
| «PINTAR ID» label, small text (ink-3) on paper | 5.30 |
| PINTAR ID, back (ink) on paper | 14.00 |
| QR modules (green) on paper (A, C) | 7.08 |
| QR modules and the ID (green) on the tile #E3EFEC (B) | 6.27 |
| Role and school (paper) on each family colour, **equal-lightness variant** | Murid 6.04 · Guru 6.04 · Kepala departemen 6.01 · Dekan 6.06 · Admin sekolah 6.05 · Admin platform 6.00 |
| Role and school on **Yazid's HEX** (best of paper and ink) | Murid 5.12 (ink) · **Guru 4.03 (ink), below** · **Kepala departemen 4.24 (paper), below** · Dekan 6.73 · Admin sekolah 5.56 · Admin platform 10.37 |

**The proposed text colour on the colour layer is the paper itself, #FBFAF7.** Pure white was not chosen; the alternatives were measured (table in §2):
- **The paper #FBFAF7:** 6.00–6.06 on the variant. Chosen: in print it is simply knocked out to the stock, so there is no second ink to register.
- **Pure white:** 6.27–6.33, about 0.25 more. It would be a different white from the card's own paper.
- **Surface-2 #F3F1EC:** 5.55–5.61.
- **Ink:** 2.31–2.33 on the variant, so it is not a candidate.

## 5. Samples and stress cases

| Family | Sample | Tests |
|---|---|---|
| Murid | Bagas Saputra · SMP Cahaya Kaliandra · 7Q2Z 0D9K | exploration only (C17) |
| Guru | Ratna Dewi Kusumawardani · SMP Cahaya Kaliandra · **A14C D7ST** | the detail card; the sample QR carries its ID |
| Kepala departemen | Nur'aini Rahmawati · SMA Bukit Asri Kaliandra · 5S8B 1HMR | an apostrophe |
| Dekan | Muhammad Rizky Aditya Pratama · Sekolah Cendekia Kaliandra · D0W3 Z27E | a four-word name |
| Admin sekolah | Sukarmi · Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur · B8K5 S1GX | a single-word name; a 68-character school, which wraps to two lines |
| Admin platform | Laras Pramesti · (no school) · 2ZNV 07YD | no school |
| (A3) | Ni Luh Putu Ayu Kartika Maharani Suryaningsih · Q8ZB 2D0S | a six-word name, two lines |

- **Apostrophes** are shown as stored (Nur'aini). A typographic apostrophe (’) would be a display rule to decide, not a data change.
- **The Murid card is exploration only.** Students keep the class card and see no PINTAR ID screen in 4.0 (C17). Cards by level (SD, SMP, SMA/SMK, Universitas) come later. D-059's other families are not in this round.

**Admin platform has no school (a question for Yazid).**
- **Proposed:** no second line. The role stands alone and nothing is invented.
- **Shown in A3 as an option, not proposed:** «Platform PINTAR». It reads as where the role lives, but could be read as an affiliation or employer.
- **Rejected:** «Semua sekolah». It describes a scope of access, which is a permission claim (D-059(d)).

**A person with two roles, e.g. Guru and Kepala departemen (a question for Yazid, not settled).** A3 shows:
- **(a)** One card per role. Each card is one chapter; the PINTAR ID and QR are the same on both.
- **(b)** One card with both roles written («Guru · Kepala departemen»).

With (b), which colour the card takes is part of the question. A3 shows it both ways; a rule such as «the most recent role» or «the person chooses» would decide it.

## 6. The QR as a visual signature

**What the QR does** (IDENTITY §5): it holds only the public link. The `/id/` page looks the same for every ID and offers «Masuk ke PINTAR» and recovery with the PIN. It verifies nothing. The card says nothing about verifying, checking or authenticity; the render script scans every face (and the image alt texts) for those words and for PIN, password, an email address and a date of birth. The scan found none, and it catches a planted control.

**The instruction line: proposed, not decided.** Terminology v1 words (Masuk, PINTAR); «pindai» is the verb the app already uses on certificates (`sertifikat.periksa.arti`).
1. **«Pindai untuk membuka halaman masuk PINTAR.»** (rendered). This says exactly what happens: a page opens, and the person signs in there.
2. «Pindai untuk masuk ke PINTAR.» Shorter, but it can be read as "scanning signs you in", which it does not.
3. «Arahkan kamera ponsel ke kode ini untuk masuk ke PINTAR.» Longer; the same risk as 2.

**The signature.**
- On every card, the QR is PINTAR-green modules on a light ground. It is never inverted, and it is never printed on the family colour: green on Yazid's colours measures 1.05–2.59:1, and on the equal-lightness colours 1.17–1.18:1.
- The back is the same for every family, so the QR looks the same on all six.
- What makes it recognisably PINTAR's is restraint: the one brand green, the soft-green tile (B), and the ID beneath it. Nothing is drawn into the symbol, except in C, which is shown only to measure what it costs.

## 7. The QR study (D)

Every symbol encodes the same 41-character sample link. The real link, `https://app.pintarselalu.com/id/XXXXXXXX`, has 40 characters, so the module sizes are realistic or slightly pessimistic.

| | Treatment | Version-level | Modules | Module | Symbol | With the 4-module quiet zone | Encoder |
|---|---|---|---|---|---|---|---|
| A | Plain, green on the paper | 3-M | 29 × 29 | 0.70 mm | 20.30 mm | 25.90 mm | `src/lib/qr.ts` (the app's own, unchanged) |
| **B** | **PINTAR tile**: soft-green tile (radius 1.6 mm), the ID in mono beneath | 3-M | 29 × 29 | 0.70 mm | 20.30 mm | 25.90 mm; tile 25.90 × 30.30 mm | `src/lib/qr.ts` |
| C1 | The PINTAR SELALU logo in an 11 × 7-module knock-out (5.6% of the symbol), same module as A | 5-H | 37 × 37 | 0.70 mm | 25.90 mm | 31.50 mm | segno (the app encoder only does M) |
| C2 | The same, at A's footprint | 5-H | 37 × 37 | 0.549 mm | 20.31 mm | 24.71 mm | segno |

Every module is above the 0.4 mm target. The quiet zone stays inside the 3 mm safe margin. For A and C, the symbol's edge sits on the 6 mm text margin; for B, the tile's edge does.

**The centre-mark trade-off, measured.**
- A mark needs level H (about 30% recovery against M's 15%), which pushes the link from version 3 to version 5.
- So the QR either grows by 28%, from 20.3 to 25.9 mm (C1), or its modules shrink by 22%, from 0.70 to 0.55 mm (C2).
- C2 is measurably weaker than A and B (limits below). C1 costs a QR that fills 58% of the card's height, and the logo inside it is too small to read (about 1 mm caps).
- **The mark is decoration at this size; not recommended.**

**Decode test.** Two independent decoders, zxing-cpp and OpenCV's QRCodeDetector. A case passes only when the exact sample link comes back.
- Each back was decoded from the A4 PDF itself, rendered at **300 dpi**, twice: as a QR crop, and as the whole back (where the decoder has to find the QR among the text).
- The same image then went through a stress pass: downscaled, blurred, tilted in perspective, faded, and all at once with sensor noise and JPEG.

| Test (from the 300 dpi actual-size render) | A | B | C1 | C2 |
|---|---|---|---|---|
| 300 dpi, actual size | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| downscaled to 150 dpi | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| downscaled to 100 dpi | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ (whole back: OpenCV ✗) |
| blurred, sigma 1.5 px | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| blurred, sigma 2.5 px | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ (whole back: OpenCV ✗) |
| tilted 25° in perspective, turned 8° | ✓ ✓ | ✓ ✓ (whole back: OpenCV ✗) | ✓ ✓ | ✓ ✓ |
| faded to 35% contrast | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| all combined, plus noise and JPEG | ✓ ✓ (whole back: OpenCV ✗) | ✓ ✓ (page-1 whole back: OpenCV ✗) | ✓ ✓ | ✓ ✓ |

✓ ✓ = zxing and OpenCV both pass on the QR crop. **zxing-cpp passed every test on every variant, cropped and whole back.** OpenCV's classic detector missed the cases noted in brackets, all on whole-back images. Full detail: [`render/uji-qr.txt`](render/uji-qr.txt).

**Limits: how far each variant goes before the first failure** (QR crop; zxing / OpenCV):

| | Every scale down to | Blur up to (sigma at 300 dpi) | Contrast down to | Tilt up to |
|---|---|---|---|---|
| A | 50 / 90 dpi | 4.25 / 3.25 px (0.36 / 0.28 mm) | 0.15 / 0.05 | 72.5° / 50° |
| B | 50 / 75 dpi | 4.25 / 3 px | 0.15 / 0.05 | 72.5° / 50° |
| C1 | 50 / 100 dpi | 4.5 / 3 px | 0.15 / 0.05 | 72.5° / 50° |
| C2 | **65 / 130 dpi** | **3.25 / 2.5 px** | 0.15 / 0.05 | 72.5° / 50° |

A and B behave alike: the tile's tint costs nothing measurable. **Screens:** the QR decodes (both decoders) straight from the 320 px light email, the 600 px dark email and the phone screenshot.

**What the software test cannot show.** The physical tests happen on Yazid's printed sheet, page 3:
- the office printer's real output;
- different phone cameras (iOS Camera, Google Lens, a basic Android scanner);
- dim light and glare;
- a steep angle;
- the card on a screen.

Note on phones: all four symbols should open the sample link's error page, since `contoh.pintar.invalid` does not exist. That is the expected result, not a failure.

**Found in passing, for Bob and Yazid, not used here.** If the link were written in capitals (`HTTPS://APP.PINTARSELALU.COM/ID/…`), the QR could use alphanumeric mode. The same version-3 symbol would then fit level **Q** (about 25% recovery instead of 15%) at no cost in size (segno: 3-Q, 29 × 29). It needs `/ID/…` to resolve like `/id/…` (hosts are already case-insensitive) and `src/lib/qr.ts` to gain alphanumeric mode. It is a server and encoder question, so it is raised, not assumed.

## 8. Front and back

- **Front:**
  - the wordmark;
  - the name and PINTAR ID (who the person is, permanently);
  - the role and school (the current chapter).
  - Calm, and recognisable from across a table.
- **Back:** the same for every family:
  - the PINTAR SELALU logo (the official mark, which would clash with the family colour on the front);
  - the instruction;
  - the ID;
  - `pintarselalu.com`;
  - the QR.
- **The typeset wordmark on the front.** The logo block's own dark teal band would sit badly beside five of the six family colours. The typeset wordmark uses the app's `--tracking-wordmark` and PINTAR green, as the email frame's text wordmark does.

## F. The card in context

- **Email** (the DAISY-19 frame, unchanged; the card block is added the way DAISY-24 would add it):
  - The card is a PNG at twice its display width, front above back, 440 px wide at 600 px and 266 px at 320 px. Neither width scrolls sideways.
  - **Finding:** at 320 px the card's role line renders at about 8 px, too small to read. So the email repeats the PINTAR ID, role and school as live text rows beneath the images, and the alt text carries them too.
  - On screen only, the card carries the app's one hairline (`--line`) so its paper reads on the email's white card. In dark mode the card stays light, as images do in mail clients.
- **Phone** (390 px, Akun saya as a context mock): at full width (358 px) the name is 17.7 px and the role 11.1 px, which is readable. The details repeat below it, as in the email.
- **In short:** on a screen the card is a keepsake image, and the information lives in text beside it. On paper the card carries everything.

## Questions for Yazid (via the coordinator)

1. **Palette:** the equal-lightness variant (recommended) or Yazid's HEX? If a third option is wanted, lighten the variant's floor or accept a second text colour.
2. **Colour-blind readers:** under simulated deuteranopia, two pairs of the equal-lightness colours become one colour (§2). Accept this, since the role is always written?
3. **Admin platform's school line:** none (proposed), «Platform PINTAR», or another wording?
4. **Two roles:** one card per role, or one card with both roles written; and if one card, which colour?
5. **The QR instruction wording** (§6), and whether the card is Bahasa Indonesia only, as the emails are.
6. **The QR treatment** after the phone tests on page 3: B (recommended) or A.
7. **For Bob, later:** capital-letter links for a level-Q QR at the same size (§7).

## What the checks cover

`render/laporan.txt`, from the last run:
- every contrast pair;
- the palette changes and colour distances;
- the 3 mm safe margin on all 19 faces;
- name length;
- the forbidden-word scan, with its control;
- the emails' widths;
- the PDF's page size, font embedding and measured geometry;
- every decode;
- the print-shift estimates.

**What is not verified here:**
- a real print;
- real phone cameras;
- real mail clients (the Gmail and Outlook screenshots come with BOB-25's first real send, as for DAISY-19);
- a printer's own colour profile.
