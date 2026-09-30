# Sertifikat PINTAR: design exploration, round 1

**Status: design only.** An exploration of what a PINTAR certificate should look and feel like, under the PINTAR Recognition Principle (D-072). Nothing here is implemented, and nothing here changes what a certificate means.

- **Release:** D-073 (recorded on the coordinator's branch at `1c20481`); continued under D-075(c).
- **Scope:** this folder only. No certificate code, data model, issuance rule, verification behaviour, migration, `hle.ts`, production data or CI was touched.
- **Brief:** `briefs/DAISY-SERTIFIKAT-ROUND-1.md` on the coordinator's branch.
- **Carried forward:** the Kartu PINTAR round 2 language and Yazid's rulings of 30 Sep (D-074):
  - the approved palette (plum Murid `#725471`, sage Guru `#446A4B`);
  - ochre `#C09C4F` as the artifact-signature candidate at 0.75 mm, pending the card's physical proof;
  - «PINTAR SELALU» on the artifact, while the product language stays «PINTAR».
- **Samples:** every person, school, number and link is invented. The QR encodes only `https://contoh.pintar.invalid/verifikasi/<43 invented characters>`, a domain that can never exist (RFC 2606).
- **Words:** every certificate word is the app's own copy (`src/lib/hle.ts`, read by the render script), except where marked **PROPOSAL** (§16).
- **Checked against the design constitution** (`design/PINTAR-DESIGN-SKILL-SPEC.md` on the coordinator's branch):
  - §6: every type size is a token-ladder step, except three print-only sizes, which are flagged (§6 here);
  - §8: Terminology v1 (§16 here);
  - §13: contrast;
  - §14: no gamification, badge or celebration.

## The answer, in one paragraph

**Recommend one excellent certificate: Modern.**
- **It is the card, narrowed.** A warm paper field; the thin gold line at the card's own proportion (59.3% down: 176 of 297 mm, as 32 of 53.98 mm on the card); below it, a deep band in the learning context's accent, carrying the issuer «Diterbitkan oleh · SMP …», exactly where the card carries the role and school.
- **The statement sits on the line.** The name, «telah menuntaskan», the course and Predikat sit above the line and grow upward, as the card's name does.
- **The record is at the foot.** The date, the number, «Periksa keaslian» and a green QR sit in one fixed row.
- **«PINTAR SELALU» is a small colophon at the foot.** It is never the issuer.
- **Why Modern.** On a wall of certificates with every brand name covered, it is the one still found from 3 and 6 m, by its seam. Classic and Minimal are calm and credible, but without words they sit among the others.
- **The limit, stated honestly.** A band alone is not ownable (the test's control has one), and the sage professional band is weaker than the plum. So the seam works together with the rest of the grammar, not instead of it.

## Files

| File | What it is |
|---|---|
| `sertifikat.mts` | The grammar: grid, tokens, the two accents, type styles, the record block, the identifier line-breaking rules, and `sertifikat(arah, data, kata, opsi)`. Every sheet in every render goes through it. |
| `sertifikat-lain.mts` | Six certificates from invented Kaliandra organisations, for the recognition test only. One is a deliberate control. |
| `buat-sertifikat.mts` | The render script. Builds every render and the PDF, runs every check, writes `render/laporan.txt`, and exits non-zero if a check fails. |
| `kini.mts` | The current implementation, printed. It reuses the repository's review harness, which renders the real `KartuSertifikat` with the real stylesheet. Evidence for §15. |
| `uji-sertifikat.py` | The Python half: QR decode tests (round 1's method), CMYK shift, colour distances with CVD, static fonts for the PDF, PDF geometry, print simulations, the distance test. Copied from the card's `uji-qr.py` and extended. |
| `requirements.txt` | The card's Python pins, unchanged. |
| `render/` | Every output (below), `laporan.txt`, `uji-qr.json`. |

**To run** (from the repository root, with a Python that has `requirements.txt`):

```bash
KARTU_PY=/path/to/python npx tsx docs/coordination/ux/sertifikat/buat-sertifikat.mts
# the baseline, optional:
node claude/tools/render-screens/stylesheet.mjs "$OUT"
npx tsx claude/tools/render-screens/screens.tsx "$OUT"
KARTU_PY=/path/to/python npx tsx docs/coordination/ux/sertifikat/kini.mts "$OUT"
```

`screens.tsx` currently stops when it reaches `server-only` (imported through `src/lib/tur-negara.ts`). For this round it was run with a resolver hook, kept outside the repository, that maps `server-only` to an empty module. The certificate pages are written before it stops. The harness itself was not changed.

## Deliverables

| | Deliverable | Files |
|---|---|---|
| A | Three directions: Classic, Modern, Minimal | `render/A-tiga-arah.png`; each at 150 dpi: `A-classic.png`, `A-modern.png`, `A-minimal.png` |
| B | Recommendation | `render/B-rekomendasi.png`; §2 |
| C | Academic and professional-learning variants (mapping **for Yazid**) | `render/C-konteks.png`; §3 |
| D | Without and with a photo (placeholder) | `render/D-foto.png`; §4 |
| E | Without and with a school logo (hypothetical) | `render/E-logo.png`; §5 |
| F | Typography specification and stress cases | `render/F-tipografi.png`; §6 |
| G | Accent and warm-gold specification | `render/G-aksen-emas.png`; §7 |
| H | QR treatment, dimensions, decode evidence | `render/H-qr.png`, `render/uji-qr.json`; §8 |
| I | Recognition board | `render/I-pengenalan.png`; §9 |
| J | The A4 PDF at actual size, «Cetak 100% / Ukuran sebenarnya» | `render/J-A4-100persen.pdf` (15 pages); previews `J-halaman-N.png`; §10 |
| K | Greyscale, ordinary printer, A4 on F4 | `render/K-cetak.png`; page 13 of J; §11 |
| L | Screen preview; PDF viewing | `render/L-layar-390.png`, `L-layar-1280.png`, `L-pdf-muat-halaman.png`, `L-pdf-100persen.png`; §12 |
| M | The action, both ways | `render/M-aksi.png`; §13 |
| N | This README | |
| — | The current implementation, printed | `render/kini-cetak-bawaan.pdf` (Chrome's print dialog as it opens), `kini-cetak-terbaik.pdf` (every option in the sheet's favour), `kini-layar-390.png`, `kini-layar-1280.png`; §15 |

## Decisions for Yazid

| # | Decision | Recommendation | Where |
|---|---|---|---|
| 1 | Photo or no photo | **No photo (Version A).** | §4, D |
| 2 | School logo support or none | **None.** If wanted: top-left, on paper, from a stored print-quality file. Never on the band. | §5, E |
| 3 | One design or several layouts | **One: Modern.** If a centred option is kept, it is Classic *with the seam*, and the layout read must be fixed first (§15, item 6). | §2, B |
| 4 | The final visual signature | **The seam:** the 0.75 mm ochre line lying on the accent band's top edge, at 59.3% of the height, the card's proportion. The width follows the card's physical proof. | §7, G |
| 5 | The accent mapping to learning context | **As briefed:** ACADEMIC → plum `#725471`, PROFESSIONAL_DEVELOPMENT → sage `#446A4B`. There are three cautions (§3); the strongest is that sage is less recognisable than plum. | §3, C |
| 6 | Single print/save action or a server-made PDF | **Keep (i), the single action, now,** made robust by the sheet itself (§13). (ii) is an architecture decision with real costs; it earns its place only if byte-identical files matter. | §13, M |

**Found in this round, and also Yazid's (or Bob's):**

| # | Question | Where |
|---|---|---|
| 7 | «PINTAR SELALU» on the printed sheet contradicts a principle written in today's code: the printed sheet carries «never the software vendor's» identity. The brief asks for it; decide it knowingly. | §15, item 2 |
| 8 | The course line depends on the learner's *current* assignments. When the assignment is no longer active, the sheet prints «telah menuntaskan Sertifikat». | §14, §15 item 3 |
| 9 | The school's name is read live: a renamed school changes every old certificate. Should a certificate carry the name as it was at issuance? That needs a snapshot field. | §14 |
| 10 | Predikat «Perlu Pendampingan» can reach a certificate when an assessment's pass mark is below 0.70. The brief lists three values. | §15, item 8 |
| 11 | The certificate renders in the *viewer's* interface language (id or en). Should a certificate have one language? | §15, item 11 |
| 12 | Keep the production host short. At 83 characters the link is one character inside QR version 5; two more make every QR version 6. | §8 |

## 1. The Recognition Principle, applied

**What the grammar is.** Three constants hold in every direction, so the family shows before a word is read.

1. **The line at the card's proportion.** 59.3% down, on the card and on the certificate alike.
   - Above it, the statement: who, and what they achieved.
   - Below it, the record: who issued it, when, the number, the evidence.
   - As on the card, the statement sits *on* the line and grows upward.
2. **The record block.** Identical in all three directions: date and number on the left; «Periksa keaslian», its sentence and the printed link in the middle; the green QR on the right, its modules ending on the measure.
3. **«PINTAR SELALU» as a colophon.** Small, tracked capitals, PINTAR green, at the foot, away from the issuer and from where a signature would stand.

**What it is not.** The card is not enlarged:
- the card answers *who is this person now*, and the certificate answers *what did this person achieve, at that time*;
- no card layout, tile, ID or role is carried over, and two family colours return only as the learning context's accent (§3);
- only the grammar is: paper, one line, one deep accent, restrained type, the green QR.

**Round 2's prediction.** The card README's §13 named the certificate's candidate signatures:
- the paper;
- the one ochre line;
- typographic restraint.

The wall test (§9) adds a finding: on a wall, paper and a thin line are what many certificates have. What carries recognition at a distance is the line *meeting the accent*: the seam.

**Negative space and proportion.**
- Measured in the PDF, the Modern accent band covers 186 × 20.5 mm, 6.1% of the page; the rest is paper and type.
- The heading stands alone at the top. The 80–90 mm of paper under it is the card's quiet upper field, not an empty gap to fill.

## 2. Three directions (A) and the recommendation (B)

All three carry the same information, the same evidence and QR, the same accessibility and the same constants (§1).

- **Classic.** A centred axis:
  - the heading, in the accent, at the top;
  - the statement centred between the heading and the line;
  - the gold line across the measure;
  - «Diterbitkan oleh» and the school centred under it.
  
  It is the composition schools expect, without the ornament. Its weakness: without words it is a white sheet with a thin line, like many others. It also has less room: a centred photo cannot hold the realistic long text (a limit found by the checks, §17).
- **Modern.** Left-aligned, with the seam:
  - the line lies on a deep band in the accent;
  - the band runs 12 mm from each edge, beyond the 24 mm text measure;
  - it carries «Diterbitkan oleh» and the school in paper-coloured type.

  This is the card's lower field, narrowed to a band. It is the only direction still found on the wall with every brand name covered.
- **Minimal.** Type, one line and the QR; the accent appears only in the heading. It uses the least ink and colour, and depends most on typography. On the wall it is anonymous. It is the fallback if the band is refused.

**Recommendation: ship one, Modern.**
- One design is what the Recognition Principle asks for; three layouts give PINTAR three faces, and schools would be choosing between them.
- The schema's layout choice does nothing today anyway (§15, item 6).
- If Yazid keeps a centred option, it should carry the seam: B shows **Classic with the seam** so that the choice is concrete. It is not recommended over one design.

## 3. The accent by learning context, never by role (C) — mapping **for Yazid**

**The mapping as briefed:**

| Learning context | Accent | Colour source |
|---|---|---|
| `ACADEMIC` | plum `#725471` | the Murid family colour |
| `PROFESSIONAL_DEVELOPMENT` | sage `#446A4B` | the Guru family colour |

- Both are the card's approved values at one lightness (OKLab L 0.488 / 0.487). Neither context is louder, and in greyscale they are one grey (`#5E5E5E` / `#616161`).
- The accent is the heading's colour in every direction, and the band's in Modern.
- No other role colour appears.
- Nothing else differs between the two: one grammar.

**What the colour does not do:**
- It does not say which context the certificate is in. Colour is never needed; the course title says what was learned.
- It does not rank the two contexts.
- It is not the holder's role. The colour follows the course, not the person: a Guru's academic certificate would be plum, and a certificate for a professional-development course is sage, whoever holds it.

**Three cautions.**
1. **Role reading.** Plum and sage *are* the Murid and Guru card colours, so a reader who knows the cards may read them as roles. Any colour from the card palette carries a role association. Avoiding that needs a colour outside the six, which this brief did not release.
2. **Two greens.** On a professional certificate the sage band sits beside the QR's PINTAR green, 0.055 apart in OKLab. They are two different greens on one sheet, and they clash slightly in colour. In office print both go very dark (K).
3. **Recognition.** On the wall at 6 m, the sage band comes close to the control's ordinary institutional green; the plum does not (I). **Plum carries recognition better than sage.** If recognition of professional certificates matters, choose the professional accent outside the green arc, still from the card palette.

**Data.**
- The context is `courses.learning_context`. It is reached from the certificate through the signed payload: `plp_release_id` → `plp_releases.course_id` → `courses`.
- It is sealed: migration `20260929100000` puts it under the sealed-content guard, as INV-04 does the course's `subject` and `title`.
- So the accent is historical, as the brief says. **But it is not on the certificate row.** Rendering it means reading the release's course (see §14).

## 4. Photo (D) — **Yazid's decision; not implemented**

- **Version A, without a photo, is recommended.**
- **Version B** places a 30 × 40 mm (3 × 4) placeholder, «FOTO — CONTOH», at the top right, level with the heading. Nothing else moves.

**Why A:**
- Most holders are minors, and a printed, shareable A4 with a child's photograph travels further than any screen.
- A photo helps only where someone compares a face with a face, which is not how a PINTAR certificate is verified: the QR confirms the certificate, and the name is on the paper.
- On A4, a face turns the certificate towards the ID card, which the brief warns against.

**What exists:**
- The identity snapshot records a photo *reference* at issuance: `photo_path` and its hash, under INV-30.
- `certificate_templates` allows only `NAME_ONLY` (OD-10 is unanswered).
- The verification page never shows a photo.

**If Yazid wants B**, it needs:
- OD-10 answered and the `NAME_ONLY` constraint lifted;
- consent rules for minors;
- the snapshot's photo file kept as long as the certificate exists (the snapshot holds a path and a hash, not the image);
- the verification page unchanged: still no photo.

**Limit found.** B holds realistic long text. With the beyond-realistic sample (a three-line name and a four-line course), the name reaches within 5 mm of the photo. That was a probe, reported in §17.

## 5. School logo (E) — **Yazid's decision; not implemented**

- **The canonical design is complete without a logo.** The issuer is named, in type, in the band.
- **The study** places «LOGO SEKOLAH — CONTOH», marked hypothetical, top-left on paper, 18 mm, above the heading. The heading moves down 24 mm and nothing else moves.

**Why not on the band:**
- A school's logo has its own colours.
- On plum or sage it would clash, or need a white patch, which looks pasted.

**What a logo costs:**
- a file per school, stored and printed at print quality, in colours PINTAR does not control;
- a bad logo (low resolution, badly cropped) is the commonest way a certificate starts to look unofficial.

Q-7 keeps any placeholder mark out of the product; this study is not a proposal to draw one.

## 6. Typography (F)

Plus Jakarta Sans 400/600 and IBM Plex Mono 500: the app's own OFL files and the card's two families. There are no new fonts and no light weights.

**The sizes are the app's token ladder** (constitution §6: "named rather than free").
- The sheet renders at 96 dpi, so 1 pt = 1.333 px, and every size that can be a ladder step is one.
- Leading is the ladder's too: tight 1.15, heading 1.25, body 1.5. The exception is the name, which keeps the built sheet's 1.05.
- **Three print-only sizes sit below the screen ladder and are flagged, not slipped in:** the 7 pt labels, colophon and printed link. On paper at arm's length, 9 pt tracked capitals would shout; 7 pt capitals (cap height 1.84 mm) are the ordinary size for a label on a printed form. If implemented, they want a named print step in the token file.

| Style | Typeface | Size | Ladder step | Line | Tracking | Colour |
|---|---|---|---|---|---|---|
| «PINTAR SELALU» (colophon) | PJS 600, caps | 7 pt | print only | 1 | 0.16 em; words +0.12 em | PINTAR green `#245F55` |
| Heading «Sertifikat Penguasaan» | PJS 600, caps | 10.5 pt (Classic 12 pt, 0.2 em) | meta 14 px (Classic body 16 px) | 1.25 | 0.16 em; words +0.1 em | the accent |
| Recipient's name | PJS 600 | 33 pt | name-print 44 px | 1.05 | −0.018 em | ink `#1F2A33` |
| «telah menuntaskan» | PJS 400 | 12 pt | body 16 px | 1.25 | 0 | ink-2 `#4E5A64` |
| Course title | PJS 600 | 16.5 pt | subhead 22 px | 1.25 | −0.005 em | ink |
| Labels (Predikat, Tanggal terbit, Nomor sertifikat, Diterbitkan oleh) | PJS 600, caps | 7 pt | print only | 1.15 | 0.14 em; words +0.1 em | ink-3 `#5F6A73`; paper on the band |
| Predikat | PJS 600 | 15 pt | course 20 px | 1.15 | −0.005 em | ink |
| Issuing school | PJS 600 | 12.75 pt | card 17 px | 1.25 | −0.005 em | ink; paper on the band |
| Date | PJS 400 | 12 pt | body 16 px | 1.25 | 0 | ink |
| Certificate number | Plex Mono 500 | 9 pt (the card's ID size) | eyebrow 12 px | 1.5 | 0.02 em | ink |
| «Periksa keaslian» | PJS 600 | 9.75 pt | fine 13 px | 1.25 | 0 | ink |
| Verification sentence | PJS 400 | 9 pt | eyebrow 12 px | 1.5 | 0.005 em; words +0.05 em | ink-2 |
| Printed link | Plex Mono 500 | 7 pt | print only | 1.5 | 0 | ink-2 |
| Small supporting text (placeholders only) | PJS 600, caps | 6.5 pt | study only | 1.25 | 0.12 em | ink-3 |

**The first reading follows the sizes:** name 33 pt → course 16.5 pt and Predikat 15 pt → the school 12.75 pt on the band → the record at 12 pt and below. This is the brief's order: recipient, achievement, issuing school, evidence.

**Smallest printed text.**
- The 7 pt labels and colophon: capitals, cap height 1.84 mm (PJS cap height 0.745 em, read from the font).
- The 7 pt link: mono.
- All contrast is at least 5.30:1 on the screen paper and 5.53:1 on white (§18).

**The rules.**
- **Never shrunk or cut.** The name, the course and the school wrap at a word.
- **Anchored growth.** The statement sits on the line and grows upward; the band grows downward; the record row's top never moves.
- **Identifiers break only at their own structure, deterministically** (Plex Mono is monospaced, so a line's capacity is exact):
  - the number breaks after «/», keeping «2026/00042» whole;
  - a school code too long for a line breaks after its own «-»;
  - the link breaks after «/verifikasi/», so the 43-character code is one line;
  - nothing is inserted, and no hyphen appears that is not in the text.
- **The name's limit is three lines at 33 pt,** which holds a 68-character name.

**Stress cases** (F, and pages 8–10 of J):

| Case | Name | Course | School | School code | Result |
|---|---|---|---|---|---|
| Long | 45 characters, 2 lines | 125 characters, 3 lines | 69 characters, 1 line on the band | 47 characters | number 4 lines |
| Beyond realistic | 68 characters, 3 lines | 170 characters, 4 lines | 98 characters, 2 lines (the band grows) | 63 characters, the schema maximum | number 4 lines |
| Short | one word | short | — | — | nothing stretches to fill |
| Apostrophe | Nur'aini, as recorded | — | — | — | — |

## 7. The accent and the warm-gold line (G)

**The line:** `#C09C4F`, 0.75 mm, one line, always structural.

| Direction | Where the line sits | Extent | How it owns the composition |
|---|---|---|---|
| Modern | on the band's top edge | 12 to 198 mm | the meeting with the accent |
| Classic, Minimal | on paper | the text measure, 24 to 186 mm | a single rule |

**Contrast:**
- 2.59:1 on white, 2.52:1 on plum, 2.38:1 on sage;
- in greyscale, `#A1A1A1` between the paper and the accent's grey.

**Construction.**
- The line is drawn as a vector rectangle, not a CSS background, so a browser prints it even with «Background graphics» off.
- The band starts under the line's centre and the line is drawn over it.

> **Found and fixed:** a band that started at the line's lower edge left a hairline of paper at 600 dpi.

**At a distance** (peak OKLab difference at the eye's resolution; 0.02 is just noticeable, 0.05 plain):
- every width from 0.5 to 1.5 mm is still there at 4 m, in colour and greyscale;
- the lowest value is 0.059 (0.5 mm, greyscale, on the band, at 2 and 4 m);
- 0.75 mm never drops below 0.091.

So width is character, not visibility: 0.5 mm reads as an edge, 1.5 mm as a stripe, and **0.75 mm, the card's, as structure.** Keep one width across the family, following the card's physical proof.

**Does the gold deserve broader status (D-074(2))?** The certificate supports it as the *artifact* signature: card and certificate, always one structural line. Nothing here argues for it as a general UI accent.

**Print shift** (MuPDF's CMYK profile, an estimate): every colour within ΔE2000 0.92. In simulated office colour print, dot gain darkens both bands markedly; the sage goes nearly black-green (K). The school stays legible on both.

## 8. The verification QR (H)

**What it does.** It opens `/verifikasi/<code>`. That page says whether the certificate was genuinely issued and is still valid (or revoked, or replaced), with the result, predikat, school and date. It never shows the name or a photo.

**The sentence beside it** is the app's own `sertifikat.periksa.arti`: «Pindai kode ini atau buka tautannya. Halaman itu memastikan sertifikat ini benar diterbitkan dan masih berlaku.» It speaks of the certificate, never of the person. It stays unchanged.

**Treatment:**
- PINTAR green `#245F55` on paper (7.39:1), never inverted, no logo in the matrix;
- the app's own encoder (`src/lib/qr.ts`, level M);
- symbol 26 mm, at the top of the record row;
- modules end on the measure, and the 4-module quiet zone runs into the gutter and the margin.

**Sized for the real link:**

| Link | Length | QR version | Module at 26 mm |
|---|---|---|---|
| Production: `https://app.pintarselalu.com/verifikasi/` + 43 | 83 | 5-M, 37 modules (version 5-M holds 84 bytes) | 0.703 mm |
| Sample here | 84 | 5-M, 37 modules | 0.703 mm |
| Host two characters longer (a `www.`, a `.co.id`) | 85+ | 6-M, 41 modules | 0.634 mm |

The size is fixed, not the module, so the layout never changes with the host.

**Decode** (round 1's method: two decoders, the PDF at 300 dpi, fixed stress tests, then graded limits; `uji-qr.json`):

| Case | zxing | OpenCV |
|---|---|---|
| Every certificate page, QR crop, 8 fixed tests | 8/8 | 8/8 |
| Every certificate page, limits | down to 45 dpi; blur σ 4.25 px; contrast 0.15; tilt 72.5° | down to 80 dpi; blur σ 2 px; contrast 0.05; tilt 50° |
| The whole sheet, uncropped | 8/8 | 6/8 (loses blur σ 2.5 and the combined test) |
| Version 6 | 8/8, down to 50 dpi | 7/8, only down to 160 dpi |

Version 6 still works, with less margin. **Keep the host short.**

**The tile, studied and not recommended.** Modules on the card's soft-green tile (`#E3EFEC`) print as a dot screen and cost contrast in monochrome (6.21:1 against 7.34:1). They add nothing the green does not already say.

> **Found on the way:** in the first run, the longer sample host pushed the link's first line into the quiet zone, and **zxing could not decode the version 6 symbol at all** (0/8). The link now breaks after its own «/» or «.» when it must. The layout check refuses anything in the quiet zone. The QR design that survives real use wins (D-074(12)).

**Compared with today's sheet:**
- Today: about 21 mm, in ink, with a quiet zone of about 2.8 modules at version 5, inside a 2 px green border.
- This design: larger, green, with the full four modules.

## 9. The recognition test (I)

**For each direction:**
- as it is;
- «PINTAR SELALU» covered;
- greyscale;
- seen from 2, 4, 8 and 16 m (one arc-minute per sample, then scaled back up).

By 2 m the small text is gone, by 8 m the name blurs, and at 16 m only masses and the strongest edges remain.

**The others.** Six competent certificates from invented Kaliandra organisations, in ordinary typefaces:
- a bordered course certificate;
- a training certificate with a side band and QR;
- an award with a header band;
- a museum volunteer certificate;
- an appreciation certificate;
- **the control:** a chess-club certificate with Modern's band in the same place, but no gold line and other type.

They use the conventions other issuers really use, signatures and seal rings included. None is made worse.

**The wall** has three PINTAR certificates among the six, every brand name covered (one strip each), seen from 3 and 6 m. The results:
- **Plum Modern: found.** At 3 and 6 m, by its seam.
- **Classic and Minimal: not found without words.** They are credible, and they sit among the others.
- **The control shows the limit: a band alone is not ownable.**
  - At 3 m, Modern and the control are told apart by the gold edge, the heading in the accent, PINTAR's type and the record row.
  - At 6 m, mostly by the band's colour, and there **the sage professional band comes close to the control's green.**
- **The uncovered «PINTAR» words don't help.** The number's prefix and the link's host are unreadable from 2 m.

A first version of the wall also covered every «PINTAR» word. It was **dropped as unfair**: it put three strips on PINTAR sheets and one on the others, and the strips themselves marked PINTAR.

## 10. The A4 PDF (J)

15 pages, exactly 210 × 297 mm. The fonts are embedded as TrueType subsets (no Type3).

| Page(s) | Content |
|---|---|
| 1 | Printing instructions (bilingual), a 100 mm scale bar, a 50 × 50 mm square, the contents |
| 2–7 | Modern, Classic and Minimal, each academic and professional |
| 8–10 | The stress cases |
| 11 | Version B (photo) |
| 12 | The logo study |
| 13 | Greyscale |
| 14–15 | The QR studies (tile; version 6) |

Every certificate page is the certificate exactly as printed, with no notes on the sheet.

**Made with «Background graphics» off**, as a browser's print dialog opens.
- The band still prints (a CSS background marked `print-color-adjust: exact`), and so do the gold line (vector) and the photo placeholder.
- The cover's scale ticks, first drawn as backgrounds, did *not* print. They are now borders.

That small accident is the same failure today's sheet has (§15, item 1).

**Measured in the PDF on every certificate page:**
- the gold line is 0.750 mm, centred at 176.00 mm;
- the Modern band is 185.98 mm wide at x = 12.01 mm;
- the QR is 26.00 mm, with its right edge at 186.00 mm.

## 11. Print reality (K)

Simulated from the PDF at 300 dpi (estimates; the proof is J printed):

| Simulation | Model |
|---|---|
| Office colour | sRGB → CMYK → sRGB, 15% dot gain, 0.04 mm ink spread |
| Monochrome laser | luminance, with the same gain and spread |
| Toner-saving | monochrome at 55% density |
| A4 on F4 (215 × 330 mm) at 100% | placed top-left, and centred |

**Paper.** In print the paper is the stock, white. The screen's warm `#FBFAF7` is never printed: a full-page tint would print a white frame where the printer cannot reach, and costs toner.

**Colour is never needed.**
- In monochrome, the band is a dark grey field with the school knocked out, the line a mid-grey rule, and every word reads.
- Toner-saving lightens everything, and the text stays legible.

**The QR survives every simulation.** Both decoders pass all four tests on every simulated print, including toner-saving, where the modules fade to grey 142 of 255.

**F4:**
- The certificate is complete and nothing is cut; the extra 33 mm is plain paper.
- Nothing in the design refers to the sheet's edge, so the composition is unchanged.
- «Fit to page» on F4 would enlarge A4 by 2.4% (the width is the limit). The cover's scale check shows it.

**Margins.** All ink is at least 10 mm from the sheet's edge (the band 12 mm), inside any office printer's unprintable margin. This is checked.

## 12. On screen (L)

**One canonical design.** The screen shows the printed sheet itself, scaled whole (LembarA4's rule), not a second "screen card" design as today.

**Under the sheet** is the same record as text, readable at phone size and selectable:
- Predikat;
- Tanggal terbit;
- Nomor sertifikat (broken only after «/», as on the sheet);
- Diterbitkan oleh;
- the actions.

This is a **proposal** for the page, not a new field: the certificate carries nothing more.

| Width | Layout |
|---|---|
| 390 px | the sheet above the actions and facts |
| 1280 px | the sheet at 560 px beside them |

**PDF viewing:**
- `L-pdf-muat-halaman.png` is the page as a laptop viewer's «fit page» shows it: the name, the band and the QR read; the small text does not.
- `L-pdf-100persen.png` is the lower half at 100%: everything reads.

## 13. The action, both ways (M)

**(i) Today's single action: «Cetak atau simpan PDF».**
- `window.print()`; the browser's dialog does the rest, and «Simpan sebagai PDF» is one of its destinations.
- No server, no job, no stored file.
- **What the sheet must do so the reader sets nothing:**
  - declare its own page (`@page { size: A4; margin: 0 }`), so there are no browser headers or footers and no shrinking;
  - print nothing but itself;
  - mark its colour `print-color-adjust: exact`;
  - draw the line as a vector.
- **Weakness:** the dialog differs per browser and phone, and «Save as PDF» can be hard to find on phones.

**(ii) «Unduh PDF» and «Cetak»:**
- «Unduh PDF» downloads a file made on the server from the same canonical sheet, for example `Sertifikat-PINTAR-SMP-CAHAYA-KALIANDRA-2026-00042.pdf` (a PROPOSAL). «Cetak» opens the same file for printing.
- Every reader gets byte-identical output on every device.
- **Costs:**
  - a render service on the server (headless Chromium or a PDF library), and fonts there;
  - a download endpoint enforcing the page's own access (only the holder, only ISSUED);
  - a decision on whether the file is generated on request or stored.
- `AksiCetak` says plainly that none of this exists today.

**Recommendation:** (i) now, made robust as above. It is also the fix for today's printout (§15, item 1). (ii) only if byte-identical files become a requirement. **Yazid's decision; not chosen here.**

## 14. Historical state: what the record holds, and what the sheet reads

| On the sheet | Source today | Frozen at issuance? |
|---|---|---|
| Name | `certificate_identity_snapshots.name_as_issued` | **Yes** (INV-30) |
| Course (subject · title) | `my_learning_assignments()` → `courses.subject`, `courses.title` | **The words are:** INV-04 seals them with the release. **The route is not:** it only lists the learner's *active* assignments while they are enrolled (§15, item 3). |
| Learning context (the accent) | `courses.learning_context`, via the payload's `plp_release_id` | **Yes:** sealed by migration `20260929100000`. Not on the certificate row. |
| School | `institutions.name`, read live | **No.** A renamed school renames every old certificate. |
| Predikat | `canonical_payload → result → predikat` | **Yes** (signed) |
| Date | `issued_at`, formatted in Jakarta time | **Yes** |
| Number | `certificate_number`, with `upper(slug)` at issuance | **Yes** |
| QR / link | `verification_token` | **Yes** |

**What the proposals need.**
- **Nothing the certificate does not record,** apart from the context colour. It is recorded through the release, not on the row: the render reads the release's course.
- **A frozen course route** (the certificate's own release, not the learner's current assignments) and **a frozen school name** would be new reads or a snapshot field. They are **Bob's and Yazid's to decide**, not assumed here.

## 15. Conflicts with the current implementation

1. **Today's printout is not the sheet.** Reproduced with the review harness (the real `KartuSertifikat`, the real stylesheet) in Playwright's Chromium, printed as Chrome's dialog opens (`kini-cetak-bawaan.pdf`):
   - the on-screen card (`article.pin-cert`, not `pin-noprint`) prints first;
   - the A4 sheet starts below it and breaks across two pages;
   - the browser prints its date, title, address and page count;
   - the sheet's green rule, a CSS background, is dropped.
   
   Even with every option in the sheet's favour (`kini-cetak-terbaik.pdf`) the sheet still breaks across two pages. There is no `@page` rule and no `print-color-adjust` anywhere in `src/`, and in print `.pin-sheet` is `width: 100%; height: 100vh` rather than 210 × 297 mm.
   
   *To confirm on the real page in real browsers;* the harness is not the route.
2. **«PINTAR SELALU» on the paper.** `page.tsx` marks `KakiPintar` `pin-noprint` with the comment «the printed sheet carries the issuing institution's identity, never the software vendor's». The brief puts «PINTAR SELALU» on the certificate. This design makes it a colophon that can never read as the issuer, but it reverses a written principle: decide it knowingly.
3. **The course line's fallback.** `course = assignment ? \`${subject} · ${title}\` : s("sertifikat.judul")`. The assignment comes from `my_learning_assignments()`, which returns only ACTIVE assignments for a learner with an active enrolment. After the assignment ends, or the learner moves on, the sheet reads «telah menuntaskan Sertifikat». *From reading the code and the migration; not run.*
4. **The school's name is live** (`institutionNames` → `institutions.name`; only `namespace` is guarded). See §14.
5. **Two designs today.** The on-screen card and the A4 sheet differ. The brief asks for one canonical design; L proposes the sheet itself on screen.
6. **The layout choice does nothing.** Studio saves CLASSIC / MODERN / MINIMAL.
   - A learner never reads a template row: `certificate_templates_select` needs CAN_PUBLISH (`src/lib/sertifikat.ts`).
   - `page.tsx` awaits `layoutFor(...)` and discards the result.
   
   So every sheet is the one layout. The recommendation (one design) makes this moot; keeping several means fixing it first.
7. **The QR** is ink (`var(--ink-1)`), about 21 mm, with a quiet zone of about 2.8 modules (at version 5) inside a 2 px green border. The brief asks for green and at least 4 modules.
8. **Predikat has a fourth value.** `scoring_policy.predikat_bands` has «Perlu Pendampingan» (≥ 0.00), and issuance requires only the assessment's own `passing_rules.mastery_min`. So an assessment with a pass mark below 0.70 issues certificates reading «Perlu Pendampingan». The brief lists three. The design handles the length (it is the longest value); whether it should ever appear is for Yazid and Bob.
9. **The number's school code** is `upper(institutions.slug)`, 2–63 characters, not a short code; the design handles 63.
   - *Observed, not verified:* the number's year is `to_char(now(), 'YYYY')` in the database session's time zone, while the printed date is Jakarta time. If the database runs in UTC, a certificate issued between 00:00 and 07:00 WIB on 1 January prints a date in the new year and a number in the old one.
10. **«Diterbitkan oleh» is not on the certificate today.** It exists as `verifikasi.institusi`.
11. **The language follows the viewer.** `KartuSertifikat` renders with the viewer's locale, so a certificate printed from the English interface reads «Certificate of Mastery». A certificate is a document of record: should it have one language? The renders here are in Bahasa Indonesia.
12. **The printed link** today breaks anywhere (`word-break: break-all`, even inside the host). The proposal breaks it only at its own structure.

## 16. Wording (PROPOSALS only; no `hle.ts` keys added)

**Unchanged, the app's own words:**
- «Sertifikat Penguasaan», «telah menuntaskan», «Predikat», «Tanggal terbit», «Nomor sertifikat», «Periksa keaslian» and its sentence;
- the actions «Cetak atau simpan PDF» and «Salin tautan verifikasi».

**Proposed:**

| Proposal | Where | Note |
|---|---|---|
| «Diterbitkan oleh» | on the certificate | the words of `verifikasi.institusi`; a `sertifikat.penerbit` key when implemented |
| «Membuka dialog cetak peramban. Pilih pencetak, atau «Simpan sebagai PDF».» | under action (i) | |
| «Unduh PDF» / «Cetak» | action (ii) | the brief's words |
| «Unduh PDF» menyimpan berkas yang sama persis dengan yang tercetak. | under action (ii) | |
| the file name in (ii) | | |

**Not changed:** the verification sentence. It is already correct about what the page checks.

**Terminology v1 (D-068).** The certificate's words fit the frozen dictionary:
- «Sekolah» is named in the band, never «institusi»;
- «Periksa» is checking;
- «terbit» / «Diterbitkan» belong to the Terbitkan family;
- «Sertifikat» is the place's own name;
- «Uji Penguasaan» and «Sertifikat Penguasaan» share their noun.

No new term is introduced.

Copy changes belong to UI/UX POLISHED under Terminology v1.

## 17. Assumptions, and the checks

**Assumptions:**
- A4 portrait, as today's sheet.
- Ordinary white office paper.
- The date is `format.date(…, "id")` in Jakarta.
- The course line keeps its shape «subject · title».
- The link keeps its shape `appUrl + /verifikasi/ + 43`.
- Only ISSUED certificates print. REVOKED and SUPERSEDED keep today's screen behaviour: paper cannot change, so the verification page says it.
- No new fonts. Bahasa Indonesia.

**Checks** (`render/laporan.txt`; the script exits non-zero if any fails). 33 sheets are checked: every direction in both contexts, four stress cases each, photo, logo, Classic with the seam, and version 6.
- **Layout:**
  - all ink at least 10 mm from the edge;
  - the statement at least 10 mm above the line and 5 mm clear of the heading, photo and logo;
  - the issuer at least 10 mm above the record, and the record at least 4 mm above the colophon;
  - nothing in the QR's quiet zone;
  - no text across the line;
  - name lines ≤ 3.
  
  All pass on the 29 sheets that count.
- **Probes** are limit-finders, reported and not counted:
  - Version B with the beyond-realistic text;
  - Classic with a centred photo and long text.
- **Words:**
  - the required words appear exactly once on every sheet;
  - absent everywhere: score-like numbers; signature, stamp or seal words; «resmi / official / sah»; identity claims; co-issuer verbs; and a photo, except in Version B.
  
  A planted control is caught.
- **Contrast:** every text pair at least 5.30:1.
- **Colour:** distances with simulated deuteranopia and protanopia; CMYK shift.
- **The PDF:** page size, fonts, and the measured geometry of the line, band and QR on every page.
- **Decode, print simulations and distance:** §8, §11, §7.

## 18. Contrast (WCAG 2.x)

| Text | Colours | Ratio |
|---|---|---|
| Name, course, predikat, date, number, school | ink on white | 14.61:1 |
| «telah menuntaskan», the verification sentence, the link | ink-2 on white | 7.07:1 |
| Labels | ink-3 on white | 5.53:1 (5.30:1 on the screen paper) |
| «PINTAR SELALU», QR modules | PINTAR green on white | 7.39:1 |
| Heading | plum 6.52:1, sage 6.16:1 | |
| Band text | paper on plum 6.24:1, on sage 5.90:1 | |

## 19. What this round does not do

- **No implementation:**
  - no change to `KartuSertifikat`, `LembarA4`, the print CSS, the verification page, the studio or the schema;
  - no `hle.ts` keys;
  - no migrations;
  - no CI.
- **No new fields.** Photo and logo are studies, and the context colour is read, not stored.
- **Not frozen.** If Yazid changes the card's direction or the line after the physical proof, the certificate follows.
