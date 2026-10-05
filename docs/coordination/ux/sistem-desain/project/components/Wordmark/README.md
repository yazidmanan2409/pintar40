PINTAR's canonical wordmark is the name in Helvetica Neue 65 Medium capitals, in PINTAR green, with nothing added.

**Status: LOCKED (approved brand ruling, 5 Oct).** This is production refinement only: no alternative is explored, nothing is added, and no letter is altered.

**The specification**
| | |
|---|---|
| Word | PINTAR, in capitals |
| Typeface | Helvetica Neue 65 Medium (Linotype's Neue Helvetica 65 Medium; «Helvetica Neue Medium» on macOS). Not Helvetica, not Helvetica Now, not Arial. |
| Tracking | +50 (thousandths of an em), so 0.05 em |
| Kerning | The font's metric kerning, then one optical pass. Every gap is judged against I–N, the two straight stems: P–I and N–T are usually a little open, and T–A is closed by the font. No pair moves more than 10 units. The result is outlined and frozen. |
| Colour | PINTAR green `pintar-primary`, #245F55, RGB 36 95 85. In print, CMYK 84 43 65 29 (an estimate through MuPDF's CMYK profile; round trip ΔE2000 0.27). |
| Clear space | X on every side, where X is the cap height. In the product's own navigation and top bar, at least ½ X, which their 16 px padding gives. |
| Smallest size | On screen, a 12 px cap height (about 66 px wide). In print, 15 mm wide. Below that, PINTAR is written in the text face instead. |

**The four versions**
| Version | Where | Contrast |
|---|---|---|
| PINTAR green on light | The default: `surface-1`, `surface-0`, `surface-2`, white or cream paper | 7.39 / 7.08 / 6.54 : 1 |
| White on PINTAR green | A solid green field at least X clear round the word | 7.39 : 1 |
| Black | One-colour printing, photocopies, faxes, engraving | 21 : 1 on white |
| White | Black or deep-ink grounds where green cannot print or show | 21 : 1 on black; 14.61 : 1 on `ink-1` |

**Sizes in PINTAR.** Each is the cap height: `wordmark-nav` 18 px (about 99 px wide), `wordmark-bar` 16 px (about 88 px), `wordmark-standalone` 24 px (about 132 px), `wordmark-min` 12 px. The rail does not show it.

**Rules**
- The wordmark is artwork: outlines from the master, placed whole. It is never retyped in another face, never live text in the product, never stretched, condensed, outlined, shadowed, tinted, rotated or recoloured.
- Green on a light ground, or one of the three other versions. Never green on a dark ground (1.98 : 1 on `ink-1`), never on a status colour, a card family colour or a photograph.
- Nothing is attached: no symbol, icon, tagline, «SELALU», company name or web address, and no standalone P.
- In running text, PINTAR is a word in the text face («Masuk ke PINTAR»), never the wordmark.
- Its accessible name is «PINTAR». In the product it is not a link.
- A school's own approved mark may one day take this place (the institution-mark ruling). It replaces the wordmark and nothing else.

**Brand architecture**
- **PINTAR** is the product and system name, and the only identity inside the product.
- **PT ZAYD PINTAR SELALU** is the legal company. It appears only where the company itself must: legal and privacy information, official corporate correspondence and contracts, and the legal line in a footer.
- **pintarselalu.com** is the web domain. It appears where an address is needed (a link, a contact line), never as a brand name.
- The company and the domain do not rename the product: never «PINTAR SELALU».
- **One name for the whole family** (Q16, 5 Oct): the application, the PINTAR ID card, the PINTAR certificate and PINTAR's documents all carry PINTAR. The ID card and the certificate replaced their «PINTAR SELALU» line with this wordmark as a brand correction; nothing else in their frozen designs changed (`kartu-pintar/ronde-2` §L, `sertifikat/ronde-2`, «The wordmark correction»).

**No second mark** (Q17, 5 Oct). This wordmark is PINTAR 4.0's only logo. There is no standalone P, monogram, education symbol or secondary logo, and none is to be made.

**The tab icon is not a logo.** The browser tab and the home-screen icon need a small square image; it is a functional identifier, not an alternative logo. For now it is the simplest PINTAR-green treatment: a solid `pintar-primary` square with nothing on it.
- Rounded (radius 6 on a 32 grid) where the file is shown as it is: `favicon.ico` (16, 32, 48 px) and `icon.svg`.
- Full bleed where the platform rounds it: `apple-icon.png` (180 px), and `icon-192.png` and `icon-512.png` for a web manifest if one is ever added (there is none today).
- The files are in `assets/AppIcon/`, made by `alat/buat-ikon-tab.py`. The names follow Next.js's file conventions (`favicon.ico`, `icon.svg`, `apple-icon.png` in `src/app/`), so the application pass copies them across; today's `src/app/favicon.ico` is the framework's default.
- On a light browser theme the green is 7.39 : 1 against white. On a dark theme it shows quieter; nothing depends on it, as the tab's title names the page.
- A permanent app-icon design is a separate decision for later.

**Master artwork and the font licence** (5 Oct). Helvetica Neue 65 Medium is the canonical typeface. Its unavailability here is not a reason to make the master in another face: no substitute becomes the canonical master.

**Required before the master is created or distributed:** production and legal verify the font licence under which the master will be made. The verification must confirm that the licence permits each use:
- making logo artwork from the typeface;
- converting the letters to outlines;
- distributing the outlined files to printers and agencies;
- placing the artwork in the product, emails and PDFs.

This design system assumes nothing about what any licence permits.

**Until the verified master exists:**
- every wordmark on this page, on the boards and in the card and certificate proofs is a proof, set in the viewer's own face (Helvetica Neue on Apple devices, a stand-in elsewhere), and labelled as one;
- a proof is never sent to print or handed on as the master.
