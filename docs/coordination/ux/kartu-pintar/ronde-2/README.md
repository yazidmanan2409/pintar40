# Kartu PINTAR: refinement, round 2

**Status: design only.** This refines Yazid's revised direction for the PINTAR ID card. It is input to DAISY-24 (Gate 7) and does not replace it.

- **Release:** D-072, as the brief cites it. It is not yet recorded in `DECISIONS.md` on the coordinator's branch at `00fcf4b`, which stops at D-071.
- **Scope:** this design-only refinement alone. No application code, no `hle.ts` keys, no migration, no production wiring, no CI. The Gate 2E pause holds for everything else.
- **Round 1 is untouched,** one folder up (`../`), for comparison.
- **Samples:** every person, school and PINTAR ID is invented. The QR encodes only `https://contoh.pintar.invalid/id/A14CD7ST`, a domain that can never exist (RFC 2606).

**Read first:**
- Yazid's direction mock-up, `briefs/assets/kartu-pintar-ronde-2-arah-yazid.webp` on the coordinator's branch. It was treated as a direction, not a specification.
- IDENTITY-4.0 §4, §5 and §11; D-059; C17; Terminology v1 (D-068).
- Round 1's README and results.

**Already decided by Yazid:**
- the equal-lightness direction;
- Admin platform has no second line;
- the PINTAR tile for the QR;
- Bahasa Indonesia only.

## Files

| File | What it is |
|---|---|
| `kartu.mts` | The grammar. The tokens, the palettes, the type styles, `depan` (front), `belakang` (back) and `letakUbin` (the tile's geometry). Every card goes through it. |
| `kartu-lain.mts` | Seven invented non-PINTAR cards and two backs, for the recognition test only. |
| `buat-kartu.mts` | The render script. It builds every render, the A4 proof and the context renders, then runs the checks, the decode tests and the gold-line study, and writes `render/laporan.txt`. It exits non-zero if a check fails. |
| `uji-qr.py` | The Python half, copied from round 1 and extended: decoding, colour distances (OKLab and CIEDE2000, including simulated colour blindness), CMYK round trip, font instances, A4 geometry, and the line study. |
| `requirements.txt` | The Python packages, pinned. |

**Run it from the repository root** (Chromium comes from the preinstalled Playwright):

```
python3 -m venv .venv-kartu && .venv-kartu/bin/pip install -r docs/coordination/ux/kartu-pintar/ronde-2/requirements.txt
KARTU_PY=.venv-kartu/bin/python npx tsx docs/coordination/ux/kartu-pintar/ronde-2/buat-kartu.mts
```

The last run ended **"all checks passed"** in about a minute.

## Deliverables

| | Render | What to look at |
|---|---|---|
| A | [`A-enam-depan.png`](render/A-enam-depan.png) | The six final-candidate fronts. Palette: round 1 → proposed, and the olive alternative. All 15 pairwise distances, in normal vision and in simulated deuteranopia. |
| B | [`B-guru-detail.png`](render/B-guru-detail.png) | The Guru card, front and back, with the trim, bleed, safe margin, text margin, line position and QR geometry drawn on; then clean. |
| C | [`C-garis-emas.png`](render/C-garis-emas.png) | The gold line at 0.50, 0.75 and 1.00 mm. In print: colour, greyscale and a simulated office print. On screen: 440, 358 and 266 px cards at 1× and 2×. Measured. |
| D | [`D-tipografi.png`](render/D-tipografi.png) | The type specification. The «PINTAR SELALU» treatment. The front header and back instruction side by side. Look-alike characters. |
| E | [`E-qr-ubin.png`](render/E-qr-ubin.png) | The refined tile, with its geometry and every decode and stress result. |
| F | [`F-kasus-uji.png`](render/F-kasus-uji.png) | The stress cases, Admin platform, several roles and roles at two schools. Drawn before the rulings: its «undecided» labels are now settled in §10. |
| G | [`G-uji-pengenalan.png`](render/G-uji-pengenalan.png) | The recognition test: as they are; «PINTAR SELALU» covered; among seven other cards with every brand name covered; the back with «PINTAR» covered. |
| H | [`H-email-600-terang.png`](render/H-email-600-terang.png), [`-600-gelap`](render/H-email-600-gelap.png), [`-320-terang`](render/H-email-320-terang.png), [`-320-gelap`](render/H-email-320-gelap.png), [`H-ponsel-390.png`](render/H-ponsel-390.png) | The card in the DAISY-19 email frame, and on a phone in Akun saya (a context mock; that screen is DAISY-20's). |
| I | [`I-A4-100persen.pdf`](render/I-A4-100persen.pdf) | **The print proof**, four A4 pages at 100% with crop marks. Previews: [`-halaman-1`](render/I-A4-halaman-1.png), [`-2`](render/I-A4-halaman-2.png), [`-3`](render/I-A4-halaman-3.png), [`-4`](render/I-A4-halaman-4.png). |
| J, K | this README | Every decision and measurement; the recommendation. |
| L | [`L-merek-PINTAR.png`](render/L-merek-PINTAR.png), [`L-laporan.txt`](render/L-laporan.txt) | **The wordmark correction (5 Oct):** the Guru card before and after at actual size; the corner at 3× with the clear space dashed; all six families and the longest name after; measured. Made by `merek-pintar.mts`. |

## L. The wordmark correction (5 Oct)

**Yazid's ruling (Q16, 5 Oct), verbatim:**

> The PINTAR ID Card and PINTAR Certificate remain frozen in design, layout, information architecture, colour, typography, dimensions and behaviour. The freeze is reopened solely to replace the superseded PINTAR SELALU product identity with the canonical PINTAR wordmark. This is a brand correction, not a redesign. No other changes are authorised.

The family is one name: the application, the ID card, the certificate and the documents are all **PINTAR**. PT ZAYD PINTAR SELALU is the legal company only.

**The one element that changed:** the front's top-left line. «PINTAR SELALU» in type is replaced by the canonical PINTAR wordmark (the design system's Wordmark card: Helvetica Neue 65 Medium, capitals, tracking +50, PINTAR green `#245F55`).

| | Before (30 Sep) | After (5 Oct) |
|---|---|---|
| What | «PINTAR SELALU» in type | the PINTAR wordmark |
| Face | Plus Jakarta Sans 600, 6.5 pt, tracking 0.16 em, word space +0.12 em | Helvetica Neue 65 Medium, capitals, tracking +50 |
| Colour | PINTAR green `#245F55` (7.08:1 on the paper) | the same |
| Place | the 6 mm margin; cap top 5.57 mm | the same: the 6 mm margin; cap top 5.57 mm |
| Cap height | 1.71 mm | **2.9 mm** (= X, the wordmark's clear space) |
| Width | 21.9 mm (two words) | 16.4 mm in the stand-in face; the outlined master fixes it, never under 15 mm |
| Clear space | none defined | X = 2.9 mm on every side: 5.57 mm to the top edge, 6 mm to the left, 8.3 mm to a one-line name, 3.4 mm to the longest (two-line) name |

**Why the size changed, and only the size.** The wordmark's print minimum is 15 mm wide. At the old line's cap height (1.71 mm) it would be about 9.7 mm wide, under the minimum, so the correction sets the cap height at 2.9 mm: 16.4 mm wide in the stand-in face, with a margin over 15 mm for the master's exact width. The master is measured before the print proof; if it came out under 15 mm, the cap height would grow, never the place. Its cap top stays where the old line's was, so the upper field's rhythm, the name, the ID, the line, the lower field and the back are exactly as frozen. Nothing else on the card moved: `L-laporan.txt` measures every front (cap height, width, margins, distance to the name) and the script exits non-zero if any falls short.

**What did not change:** the layout, the information, the family colours, the gold line, the type of every other element, the dimensions, the back (its instruction already said «…halaman masuk PINTAR.»), the QR tile and the behaviour.

**The renders A to I predate the correction.** They still show «PINTAR SELALU» and were not redrawn: the freeze covers them, and L shows the corrected front beside the old one. `kartu.mts` (the grammar) carries the correction, so the next run of `buat-kartu.mts` draws the wordmark everywhere.

**The wordmark here is a proof.** Helvetica Neue is not installed in this environment, so the renders draw it in Liberation Sans (Arial's metrics), with its cap height normalised to Helvetica Neue's (`font-size-adjust: cap-height 0.714`). The place and size are true; the letterforms are not. The print proof (I) is re-made from the outlined master, which is made only after the font licence is verified (the design system's Wordmark card, «Master artwork»). The card never sets the wordmark as live text in production.

## K. Status after Yazid's rulings (30 Sep)

**Yazid ruled on every round 2 question** (relayed 30 Sep; to be recorded by the Second Eye, not yet in `DECISIONS.md` at `af2d308`). The renders were not redrawn: this README records the rulings, and each section below notes where a render shows an option that has since been ruled out.

| # | Question | Ruling |
|---|---|---|
| 1 | The family colours | **Approved: the proposed palette, with plum Murid** (§4). |
| 2 | The warm-gold colour | **`#C09C4F` approved as the PINTAR artifact-signature candidate.** It belongs to the identity and artifact language only. It is **not** a general-purpose UI accent; the certificate exploration can show whether it deserves wider status (§3). |
| 3 | Which name the card carries | **«PINTAR SELALU» on the card**, physical and digital: the formal artifact identity. The product language stays «PINTAR». Nothing in the app or the emails is to be changed to «PINTAR SELALU» (§2). **Superseded 5 Oct** by the canonical wordmark ruling: the card carries the PINTAR wordmark (§L). |
| 4 | Several roles: the colour | **The family colour of the first role in the alphabetically ordered list of roles shown.** This is a deterministic presentation rule only. It does not indicate a primary role, seniority, authority, permission, importance or precedence. It is not tenure and not `display_role`. No neutral seventh colour (§10). |
| 5 | Several roles: the order | **Alphabetical**, by the Terminology v1 names. Chosen solely because it is deterministic and non-hierarchical. **Any apparent seniority that results from the Indonesian role names is coincidental and must not be read, or documented, as precedence** (§10). |
| 6 | Roles at two schools | **One role with its school per line** (option (i)) (§10). |
| 6a | More than two role and school pairs | **The 4.0 card is proven for up to two current role and school pairs.** With more, the card must not shrink its type below the approved minimum, truncate, or silently leave a role out. That state is an unresolved presentation exception, returned for product handling if it is ever met (§10). |
| 7 | The QR instruction | **Approved as it stands:** «Pindai untuk membuka halaman masuk PINTAR.» (§7). |
| 8 | Colour-blind readers | **Accepted, under the existing redundancy rule.** Colour never carries role meaning alone: the role is always written. The palette is not distorted to chase six-way separation under every colour-vision simulation (§4). |
| 9 | The QR geometry | **Not frozen merely because it fits.** Acceptance principle: the QR design that survives realistic physical use wins, even if the visually preferred version does not. If 0.598 mm modules scan reliably on the printed CR80 with ordinary phones, keep them; if not, give the QR more space (§7). |

**Ready to freeze now:**
- the family grammar: paper upper field, the line, family colour below; above the line the PINTAR wordmark (since 5 Oct; «PINTAR SELALU» before, §L), the name and the PINTAR ID; below it the role(s) and school(s); the back as drawn;
- the geometry, except the two elements that wait for the physical proof below: CR80, 3 mm safe margin, 6 mm text margin, 2 mm bleed, the line at 32 mm on both faces;
- the typography (§8);
- the palette (ruling 1).

**Candidates pending the physical proof** (print it, hold it, scan it, inspect it; then freeze):
- **the 0.75 mm ochre line**: page 2 of the A4 proof;
- **the round 2 QR geometry** (0.598 mm modules in the tile): pages 1 and 3, scanned with ordinary phones in ordinary light.

**No hidden decisions.** Nothing here changes identity behaviour:
- no new data on the card;
- no hierarchy;
- the ID, QR and link behave as IDENTITY-4.0 §4–5 says.

The multi-role colour, the order and the two-schools layout were product decisions; they were drawn as options, and Yazid has now ruled them.

## 1. The direction, refined

Yazid's mock-up was kept as the concept. Refinements:
- **Proportions.**
  - The line sits at 32 mm on both faces (the mock is about 30–32).
  - The upper field is 32 mm, enough for a two-line name under the header with generous space.
  - The lower field is 22 mm, enough for the role, a two-line school, or the two-schools case.
- **Front alignment.** Left on the 6 mm margin.
  - The name and ID stand 4.4 mm above the line; the chapter hangs 4.0 mm below it.
  - The line is the axis both groups refer to.
- **Back:**
  - The tile is centred above the line and fills that field from the safe margin to 2 mm above the line.
  - The instruction is centred at the same distance below the line as the front's role line, so the two faces share their rhythm.
  - The URL sits on the bottom text margin.
- **No new elements.** No icon, badge, photo, date, signature, «official» label, security claim, pattern or effect. The render script scans every face for PIN, password, an email address, a date of birth, validity words and verify/authentic/official claims. It found none, and it catches a planted control.

## 2. «PINTAR SELALU» in type

**Superseded 5 Oct (§L):** the canonical PINTAR wordmark replaces this line. The section is kept as the record of what was frozen on 30 Sep.

- **Set as:** Plus Jakarta Sans 600, 6.5 pt, capitals, tracking 0.16 em, word space +0.12 em, PINTAR green `#245F55` (7.08:1 on the paper). It sits top left on the 6 mm margin, 5.2 mm from the top.
- **Why:**
  - It is the same family, weight and green as the app's typeset wordmark (`--tracking-wordmark` 0.14 em), slightly more open because it carries two words.
  - The extra word space keeps «PINTAR» and «SELALU» two words once they are tracked.
  - It is the card's smallest style: the card, not a logo, carries the identity.
  - The stacked logo block is not used. This is an interim treatment for this artifact; the brand mark is reconsidered separately.
- **Name consistency: flagged, not changed** (D, bottom left).
  - The front says «PINTAR SELALU».
  - The back's instruction says «…halaman masuk PINTAR.», and the URL joins the two («pintarselalu.com»).
  - The app and the emails call the product «PINTAR» (Kartu PINTAR, Masuk ke PINTAR, Tim PINTAR), while the app's logo block reads PINTAR SELALU.
  - A reader will most likely take them as one brand, but **the card carries two names for it.** The email makes this visible: the logo, the card's header and the heading «Kartu PINTAR Anda» sit together.
  - **Ruled (30 Sep):** the card carries «PINTAR SELALU», the formal artifact identity. The product language stays «PINTAR», including the back's instruction. Nothing in the app or the emails changes.

## 3. The warm-gold line

**Purpose:** recognition and structural continuity. It is identical on every family, at the same height on both faces, and independent of role. It is not decoration or prestige.

**The colour: `#C09C4F`**, an ochre at OKLCH 0.711 / 0.105 / 85°. **Ruled (30 Sep):** approved as the PINTAR artifact-signature candidate, for the identity and artifact language only. It is not a general-purpose UI accent.

- **Chosen by lightness, not taste.** It sits at the midpoint between the paper and the family colours:
  - 2.48:1 against the paper;
  - 2.38–2.52:1 against each family colour.

  So it separates from both sides equally, in colour and in greyscale (paper `#FAFAFA` → line `#A1A1A1` → families `#5E5E5E`–`#616161`).
- **The mock-up's brighter gold** (about `#E0B21A`) measures only 1.91:1 on the paper, weak on the back where the line crosses paper, and reads nearer to "gold card".
- **No metallic effect, foil, gradient or luxury styling.** Muted chroma (0.105) keeps it ochre rather than gold.
- **In print:** CMYK 25/36/82/2, ΔE2000 0.59 through the profile. Yellow-heavy, so it may print slightly greener on some inkjets; the proof shows it.

**Widths, measured.** Visibility is the peak OKLab difference between the card with and without the line. About 0.02 is just noticeable; 0.05 is plainly visible.

| Width | Print, colour | Print, greyscale | Office print (sim.) | Screen 440 px 1× / 2× | 358 px 1× / 2× | **266 px 1× / 2×** |
|---|---|---|---|---|---|---|
| 0.50 mm | 0.293 | 0.277 | 0.385 | 0.237 / 0.293 | 0.244 / 0.293 | **0.099** / 0.278 |
| 0.75 mm | 0.293 | 0.277 | 0.385 | 0.237 / 0.293 | 0.244 / 0.293 | **0.099** / 0.278 |
| 1.00 mm | 0.293 | 0.277 | 0.387 | 0.293 / 0.293 | 0.293 / 0.293 | 0.293 / 0.293 |

- **In print, every width is plainly visible,** including the simulated office print. That simulation is 15% dot gain plus 0.04 mm ink spread: an approximation. The real test is page 2 of the proof.
- **The choice in print is character, not survival:**
  - 1.00 mm starts to read as a stripe;
  - 0.50 mm reads as an edge;
  - 0.75 mm reads as structure.
- **The 320 px email (card 266 px wide):** a 0.50 mm line is 1.55 px, 0.75 mm is 2.33 px.
  - On a 1× screen both blend into the edge they sit on. They show as a warm seam (0.099: above noticeable, but not a clean line).
  - At 2× and above, as on almost every phone, every width is a clean line.
  - Only 1.00 mm survives 1× cleanly; that is not enough reason to print a stripe.
- **Recommendation: 0.75 mm. Ruled (30 Sep):** 0.75 mm for the CR80 card, as a candidate pending the physical proof (page 2).

## 4. Family colours

**The requirement:** every pair at least 0.056 apart in OKLab, at one lightness. Round 1 had Murid/Dekan at 0.024 and Guru/Kepala departemen at 0.029; Yazid's own colours never came closer than 0.0565.

**What the geometry forces.** At one lightness, colours differ only in hue and chroma.
- Round 1 packed four families (blue, teal, sage, navy) into one quarter of the hue circle.
- Separating them needs either more chroma or a wider spread of hue.
- I used both, with rules:
  - One lightness: OKLab L 0.486–0.488, paper text 5.90–6.24:1 on every colour.
  - Similar chroma across the chromatic five (0.053–0.066), so no card looks more vivid.
  - **No violet, gold or red on any senior role.** Violet reads as prestige, gold would fight the line, red as alarm.
  - **No colour near PINTAR green** (Guru 0.055 away, Kepala departemen 0.053), so no family looks like "the official one".
  - **Admin platform at the neutral centre** (its round 1 direction was charcoal, near-neutral).
  - **Murid moves**, because it is exploration only (C17) and the student family is redesigned by level later.

| Family | Round 1 | L / C / H | **Proposed** | L / C / H | What changed, and why |
|---|---|---|---|---|---|
| Murid | #436478 | 0.486 / 0.050 / 236 | **#725471** | 0.488 / 0.059 / 328 | Slate blue → **plum**. The free hue: blue was taken by Dekan. |
| Guru | #466754 | 0.482 / 0.049 / 159 | **#446A4B** | 0.487 / 0.066 / 149 | Sage kept; slightly more chroma, 10° toward yellow-green, away from Kepala departemen and PINTAR green. |
| Kepala departemen | #406766 | 0.485 / 0.044 / 194 | **#2E6973** | 0.486 / 0.063 / 210 | Teal → **petrol**: 16° toward blue, more chroma. |
| Dekan | #51607D | 0.488 / 0.050 / 263 | **#515E83** | 0.486 / 0.062 / 269 | Navy kept; slightly more chroma. |
| Admin sekolah | #695E53 | 0.489 / 0.022 / 67 | **#7A5648** | 0.488 / 0.053 / 42 | Stone → **clay**. More chroma, 25° warmer, so it stands apart from the neutral centre. |
| Admin platform | #5B6167 | 0.489 / 0.012 / 248 | **#5E6062** | 0.488 / 0.004 / 248 | Slate, **near-neutral**: the centre of the circle. |

**All 15 pairs, proposed set** (OKLab / CIEDE2000):

| Pair | Normal vision | Simulated deuteranopia |
|---|---|---|
| Murid / Guru | 0.124 / 33.0 | 0.058 / 19.0 |
| Murid / Kepala departemen | 0.104 / 33.8 | **0.008 / 1.7** |
| Murid / Dekan | 0.059 / 15.4 | 0.036 / 7.1 |
| Murid / Admin sekolah | 0.068 / 18.4 | 0.067 / 21.3 |
| Murid / Admin platform | 0.058 / 17.5 | 0.025 / 7.5 |
| Guru / Kepala departemen | 0.065 / 18.1 | 0.065 / 20.7 |
| Guru / Dekan | 0.111 / 30.5 | 0.093 / 26.4 |
| Guru / Admin sekolah | 0.096 / 32.8 | **0.009 / 2.3** |
| Guru / Admin platform | 0.067 / 19.4 | 0.033 / 10.8 |
| Kepala departemen / Dekan | 0.061 / 18.9 | 0.028 / 5.5 |
| Kepala departemen / Admin sekolah | 0.115 / 32.5 | 0.074 / 23.1 |
| Kepala departemen / Admin platform | 0.060 / 15.6 | 0.032 / 9.1 |
| Dekan / Admin sekolah | 0.106 / 25.5 | 0.102 / 28.9 |
| Dekan / Admin platform | 0.058 / 14.2 | 0.060 / 14.2 |
| Admin sekolah / Admin platform | **0.0567** / 17.1 | 0.042 / 13.0 |

**What the numbers mean:**
- **Normal vision:** the smallest pair is 0.0567, above the 0.056 target. Every round 1 collision is gone (Murid/Dekan 0.024 → 0.059; Guru/Kepala departemen 0.029 → 0.065).
- **Deuteranopia:** at one lightness, red-green colour blindness leaves only the blue-yellow axis. Two pairs meet (Murid/Kepala departemen 0.008, Guru/Admin sekolah 0.009). This cannot be solved at one lightness, only by giving up equal lightness, which reopens the ladder. The role is always written, so no one loses the information (D-059: colour is supplementary). **Ruled (30 Sep): accepted, under the existing redundancy rule.** The palette is not distorted to chase six-way separation under every colour-vision simulation.
- **Protanopia:** the smallest pair is 0.028.

**The cost, stated plainly.** The family is more colourful than round 1: chroma about 0.06 instead of 0.05. No proposed colour reads as the "premium" edition: same lightness, similar chroma, and no violet, gold or red on a senior role.

**The olive alternative** (A, bottom row) keeps Murid in the green-yellow arc (`#67612F` olive). The rest are re-solved (smallest pair 0.0574). It avoids the plum, but the olive reads khaki and heavier. Murid's colour was the one free choice. **Ruled (30 Sep): the proposed palette, with plum Murid, is approved.**

**Print shift** (MuPDF's built-in CMYK profile, an estimate): every proposed colour round-trips with ΔE2000 ≤ 0.83. Printer risks:
- The slate (`#5E6062`, CMYK 62/53/51/23) and the clay (`#7A5648`) are four-ink colours that drift with grey balance.
- The petrol and the navy may lean on cyan and magenta.
- Dark muted colours print darker on uncoated paper. The simulated office print in C shows the Guru green darkening noticeably.
- The paper `#FBFAF7` should be the unprinted stock.

## 5. Front

- **Above the line,** what is permanent: the PINTAR wordmark (since 5 Oct, §L; «PINTAR SELALU» before), the name (12 pt), the PINTAR ID (9 pt mono).
- **Below the line,** the current chapter: role (8 pt, 600) and school (8 pt, 400), read at render time.
- **Negative space:** the header stands alone at the top; the name group stands on the line; the chapter hangs from it. The lower field keeps its bottom half empty except for long schools.
- **Stress cases** (F), measured:
  - A 45-character, six-word name takes two lines and grows upward.
  - The 68-character school wraps to two lines.
  - The apostrophe is shown as stored.
  - Names are never shrunk and never cut.
  - No text touches the line on any face (checked).

## 6. Back

The same grammar, not a copy:
- the same paper;
- the same line at the same height;
- the same type;
- a centred axis of its own (the tile, then the instruction and URL).

Round 1's back was clean but anonymous. The smallest change that makes it PINTAR's is the line itself: the one element every PINTAR face shares.

**The recognition answer** (G, panel 4). With both «PINTAR» words covered, what remains is the ochre line at 32 mm, the soft-green tile with green modules, and the mono ID. Beside two other backs, it still reads as the back of the cards on the table above it. The line does most of the work; the tile's colours do the rest.

## 7. The PINTAR QR tile

| | Value |
|---|---|
| Symbol | The app's own encoder (`src/lib/qr.ts`), unchanged: version **3-M**, 29 × 29 modules, byte mode, the 41-character sample link. The real link, `https://app.pintarselalu.com/id/…`, is 40 characters. |
| Module | **0.598 mm**. The tile fills the field above the line, so its height sets the module. Round 1's tile had 0.700 mm. |
| Symbol / with the quiet zone | 17.34 mm / **22.13 mm** (4 modules, 2.39 mm, inside the tile on every side) |
| Tile | 22.13 × 26.02 mm, corners 1.6 mm, `#E3EFEC`, centred; top 3.60 mm; bottom 2.0 mm above the line |
| Modules and ID | `#245F55` on the tile, 6.27:1. The ID is 9 pt Plex Mono, **below** the quiet zone. |

**A round 1 correction.** Round 1's tile put the ID 1.6 mm below the symbol, inside its 2.8 mm quiet zone. The decoders tolerated it, but it broke the 4-module rule. Round 2 keeps the full quiet zone, and the render script now checks that nothing enters it on every back.

**Decode and stress.** The same method as round 1: zxing-cpp and OpenCV, from the A4 PDF at 300 dpi, as a tile crop and as the whole back. Then the stress pass (downscaled, blurred, tilted in perspective, faded, all combined), and graded limits (the last value before the first failure).

**Cases:**
- page 1's back;
- the colour and greyscale fold pairs (page 2);
- page 3's backs at 0.75 and 0.50 mm lines;
- page 4's greyscale back;
- three screen renders.

**Results:**
- **zxing-cpp read every case: 8/8** on every tile crop and every whole back, in colour and greyscale.
- **OpenCV's classic detector read 6–8/8.** It missed the 25° tilt and the all-combined pass on several cases, the 100 dpi downscale on some whole backs, and once the 2.5 px blur. Every miss is listed in [`render/uji-qr.txt`](render/uji-qr.txt).
- **Limits** (zxing / OpenCV):
  - scale down to 55–60 / 80–130 dpi;
  - blur up to 3.5–3.75 / 1.5–2.75 px;
  - contrast down to 0.15 / 0.05;
  - tilt up to 72.5° / 50°.
- **Against round 1's tile** (0.700 mm modules: 50 / 75–90 dpi, blur 4.25 / 3 px), the refined tile is somewhat less robust. That is the cost of fitting it above the line.
- **Screens:** the whole email screenshots (320 light, 600 dark) and the phone screenshot decode with both decoders.

**If the phone tests on page 3 find the tile weaker than wanted** (options, not decisions):
- move the line to about 33.5 mm on both faces (module about 0.64 mm; the lower field narrows to about 20 mm); or
- move the ID beside the tile.

**Ruled (30 Sep): the QR geometry is not frozen merely because it fits.** The design that survives realistic physical use wins, even if the visually preferred version does not. If 0.598 mm scans reliably on the printed CR80 with ordinary phones, it stays; if not, the QR gets more space (one of the options above).

**Meaning.** The instruction says what happens: a page opens and the person signs in there. `/id/<PINTAR ID>` is the way into sign-in and recovery, not verification of the person. No "verify", "authentic" or "scan to check" appears anywhere. The wording «Pindai untuk membuka halaman masuk PINTAR.» is unchanged; no better one was found. **Ruled (30 Sep): approved as it stands.**

## 8. Typography

PINTAR's own typefaces, both SIL OFL 1.1: licensed for print and embedding. The PDF embeds them as TrueType subsets (static instances of the app's variable font, cut at build time).

**The wordmark is not type** (since 5 Oct, §L). It is placed as outlined artwork from the master, so no Helvetica Neue font is embedded. The master is made only after PT ZAYD PINTAR SELALU's Helvetica Neue licence is verified to permit it.

| Style | Typeface | Weight | Size | Line height | Tracking | Colour | Contrast |
|---|---|---|---|---|---|---|---|
| The PINTAR wordmark (5 Oct, §L) | Helvetica Neue 65 Medium, as outlined artwork | 500 | cap height 2.9 mm, caps | n/a | +50 (0.05 em) | PINTAR green `#245F55` | 7.08 |
| ~~PINTAR SELALU~~ (until 5 Oct) | Plus Jakarta Sans | 600 | 6.5 pt, caps | 1 | 0.16 em; words +0.12 em | PINTAR green `#245F55` | 7.08 |
| Name | Plus Jakarta Sans | 600 | 12 pt | 1.15 | −0.01 em | ink `#1F2A33` | 14.00 |
| PINTAR ID | IBM Plex Mono | 500 | 9 pt | 1.2 | 0.06 em | ink-2 `#4E5A64` (front); green (tile) | 6.77; 6.27 |
| Role | Plus Jakarta Sans | 600 | 8 pt | 1.3 | 0; words +0.06 em | paper on the family colour | 5.90–6.24 |
| School | Plus Jakarta Sans | 400 | 8 pt | 1.3 | 0.005 em; words +0.06 em | paper on the family colour | 5.90–6.24 |
| QR instruction | Plus Jakarta Sans | 400 | 8 pt | 1.35 | 0.005 em; words +0.06 em | ink | 14.00 |
| URL | Plus Jakarta Sans | 400 | 6.5 pt | 1.3 | 0.02 em | ink-3 `#5F6A73` | 5.30 |

**The system:** four sizes (12, 9, 8, 6.5 pt) and three weights, plus the wordmark, which is artwork, not a type style.

**Changes from round 1:**
- **Role, school and instruction: 7.5 → 8 pt.** The lower field has room, and on the 266 px email card 8 pt is 8.8 px instead of 8.2.
- **«PINTAR SELALU» replaces «PINTAR».**

**Unchanged:**
- The smallest printed size is 6.5 pt (x-height 1.23 mm), for the URL only (and for the header until 5 Oct).
- Plex Mono stays for the ID, kept under examination as asked. Its dotted 0 against D, flagged 1 against 7, curved 2 against Z, 5 against S, and closed 8 against B's flat spine all hold at 9 pt (D, right).

## 9. Admin platform

«Admin platform», with no second line. The space stays empty; nothing is invented (F, and page 3).

## 10. Several roles: ruled (30 Sep)

**One person, one PINTAR ID, one card.** If the person holds several current roles, all of them may be written on the card, each paired with its school where necessary.

**The order: alphabetical by the Terminology v1 names.**
- Chosen solely because it is deterministic and non-hierarchical. It follows the app's own rule for listing people: «Alphabetical, and that is the only order. There is no ranking to offer» (`src/lib/pengajar.ts:193`).
- **Any apparent seniority that results from the Indonesian role names is coincidental and must not be read, or documented, as precedence.** «Dekan» comes before «Guru», and «Admin …» first, only because of the alphabet.
- It is not seniority. It is not the app's `display_role`, which is «the highest role assignment» (`src/lib/pembelajaran.ts:21-22`).

**The colour: the family colour of the first role in the alphabetical list shown.**
- It is a deterministic presentation rule only. It does not indicate a primary role, seniority, authority, permission, importance or precedence.
- Examples: «Guru · Kepala departemen» takes the Guru colour; «Dekan · Guru» takes the Dekan colour. Each only because that role comes first alphabetically.
- The card is current state: if the roles change, the order and the colour may change with the current chapter.
- Not used: tenure (an invisible historical fact), a neutral seventh colour (it would collide with Admin platform's slate at this lightness), `display_role`.
- **In the render** (F, several roles): (a) happens to show the ruled result for «Guru · Kepala departemen» (the Guru colour), for a different reason. (b), the shared neutral, is not used. The renders were not redrawn.

**Roles at two schools: one role with its school per line.** For example:

```
Guru · SMP Cahaya Kaliandra
Kepala departemen · SMA Bukit Asri Kaliandra
```

- Identity optimises for unambiguous meaning, not for saving a line. The second render, (ii), roles then schools, is not used.
- The colour follows the same rule: the first role alphabetically.

**Capacity.** The 4.0 card is proven for **up to two current role and school pairs**.
- The lower field holds about four lines at 8 pt, so two pairs fit even when both school names wrap.
- With more than two pairs, the card must not shrink its type below the approved physical minimum, truncate, or silently leave a role out. That state is an unresolved presentation exception, returned for product handling if it is ever met.

## 11. The recognition test (G)

1. **As they are.**
2. **«PINTAR SELALU» covered.** The six still read as one family, from the paper, the ochre line at the same height, the family band, and the mono ID in the same place.
3. **Among seven other cards,** with every brand name covered on all thirteen.
    - The other cards are invented: a library, a cooperative, an event badge, a swimming club, a foundation, a museum and a clinic, all in Kaliandra.
    - They are set in ordinary system typefaces and drawn competently.
    - One of them (the foundation) deliberately shares PINTAR's white-over-green two bands, without the line.
    - **Which belong together:** the six PINTAR cards group at once, by one thing none of the others has, the ochre line on the seam, together with the paper, the mono ID and the same composition.
    - The foundation card is the closest neighbour. It is told apart by exactly the line and the typography. That is the evidence that the line, not the two bands, carries the recognition.
4. **The back, «PINTAR» covered:** see §6.

**The honest limit:** this is my reading of my own renders. The real test is people familiar with PINTAR looking at printed cards on a table, and Yazid's hand judgement.

## 12. Physical proof

**The A4 PDF**, four pages, every page headed «Cetak pada 100% … Jangan pilih «Sesuaikan dengan halaman». · Print at 100%, no fit-to-page.»:
1. The six fronts, the back, and a scale box (CR80 outline and a 50 mm ruler).
2. **A front/back pair to cut and fold, in colour and in greyscale**; the line at 0.50, 0.75 and 1.00 mm; the scale box.
    - How to use the pair: cut at the outer crop marks, fold backwards at the centre marks, and turn the card over sideways (left to right). The back is then upright.
    - Across the fold the line is one continuous line at 32 mm.
3. The stress cases, including both multi-role and both two-school options (labelled BELUM DIPUTUSKAN), and two backs for scanning (0.75 and 0.50 mm lines).
4. **The greyscale print test:** six fronts and the back, converted with luminance kept, so every contrast is the same as in colour.

**Measured in the PDF:**
- Pages are exactly 210 × 297 mm.
- Card papers measure 89.61 × 57.97–58.00 mm (89.60 × 57.98 with bleed), colour fields 89.61 × 23.97–24.00 mm, and lines 89.61 × 0.74–0.77 mm. The largest error is **0.017 mm**.
- Fonts are embedded as TrueType: Plus Jakarta Sans Regular and SemiBold, and IBM Plex Mono Medium.

**A real CR80:**
- Everything sits inside the 3 mm safe margin, checked on 17 faces.
- Colour and the line run 2 mm into the bleed.
- The line is horizontal and full-bleed, so a cut that is off by 1 mm moves nothing that matters.
- The tile's top is 3.6 mm from the edge: 2.6 mm if the cut is 1 mm off, still clear of the edge.

## 13. Future certificates

**Not designed here;** the existing certificate sheet is untouched.

**Card elements that could become PINTAR signatures:**
- **The warm-white base** (`#FBFAF7`, the app's surface-0) as the paper of every PINTAR document.
- **Disciplined typography:** Plus Jakarta Sans at 400/600 with Plex Mono for codes; few sizes; nothing bold that is not structure.
- **The warm-gold structural line:** one line at a fixed proportion of the object, the same on every PINTAR document. It is a divider with a job, not an ornament.
- **Muted context colours** at one lightness: the family colour as context, never as rank.
- **The PINTAR-green QR tile** with its human-readable code beneath.
- **Negative-space discipline:** one axis, generous margins, nothing to fill space.

**The caution.** A certificate must not become an enlarged ID card: it has its own proportions, reading distance and job. **Its future test:** several certificates on a wall; from a distance, before reading the logo, can someone familiar with PINTAR tell which one is PINTAR's? The candidates for that are the paper, the one ochre line and the typographic restraint, not the card's layout.

## Contrast (WCAG 2.x; all card text is small text, 4.5:1)

| Pair | Ratio |
|---|---|
| The PINTAR wordmark (green) on paper | 7.08 |
| Name (ink) on paper | 14.00 |
| PINTAR ID (ink-2) on paper | 6.77 |
| QR modules and the ID (green) on the tile | 6.27 |
| Instruction (ink) on paper | 14.00 |
| URL (ink-3) on paper | 5.30 |
| Role and school (paper) on Murid · Guru · Kepala departemen · Dekan · Admin sekolah · Admin platform | 6.24 · 5.90 · 5.94 · 6.14 · 6.19 · 6.05 |
| The line (structure, not text) on paper; on each family | 2.48; 2.38–2.52 |

## Checks

`render/laporan.txt` holds every measurement from the last run. The checks:
- the palette's separation and single lightness;
- every contrast pair;
- the safe margin on 17 faces;
- the quiet zone on every back;
- no text touching the line;
- name length;
- the forbidden-word scan, with its control;
- the emails' widths;
- the PDF's size, fonts and measured geometry;
- every decode.

**Not verified here:**
- a real print (page 2 has the office-print test);
- real phone cameras (page 3);
- real mail clients;
- a printer's own colour profile;
- people's recognition.
