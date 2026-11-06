PINTAR's wordmark: the word «PINTAR» as live text, in Inter Bold, deep teal `#075056`. Nothing is added to it.

**Status: SETTLED (owner: D-192, then D-193 for the face).** It replaces the supplied PINTAR SELALU artwork on every surface. It supersedes the 5 Oct Helvetica wordmark (the «Wordmark» card, kept for the record) and D-161's «Pintar» placeholder. F-11 is closed: no master artwork is made, and nothing is bought or licensed. The brand itself is not open for redesign. This card sets only the rules for using it.

**The specification**

| | |
|---|---|
| Word | «PINTAR», in capitals. Never «Pintar», never with «SELALU», a tagline or a symbol |
| Face | Inter Bold (700), SIL Open Font License 1.1, self-hosted (`public/fonts/inter-700-latin.woff2`, `-latin-ext.woff2`, `OFL-Inter.txt`). Inter is for the wordmark only: running text stays Plus Jakarta Sans |
| Fallback | Arial, then Helvetica, only while Inter loads. An email sends no font file: it names Inter first, and a reader without Inter sees Arial |
| Colour | `#075056` (deep teal). The interface green `#245F55` stays for controls and never colours the wordmark |
| Tracking | 0.14 em, with the last letter's tracking taken back, so the word's box ends at the R |
| Form | Live text, never an image, so it reads with images blocked and prints sharp. Its accessible name is its text, «PINTAR»: no `alt`, `role="img"` or `aria-label` |
| Proportions | Cap height 0.7275 of the size (1490/2048). Ink width 4.29 × the size; box width 4.51 × the size |

**The size ladder**

| Where | Size | Cap height | Width |
|---|---|---|---|
| Above a task: sign-in, activation, the lock, error and public pages | 22 px | 16.0 px | 99 px |
| The staff navigation, and every top bar at 1024 px and wider | 18 px | 13.1 px | 81 px |
| A top bar under 1024 px; the drawer | 16 px | 11.6 px | 72 px |
| The email header | 22 px (tracking 3 px) | 16.0 px | 99 px |
| The card in an email (its 96 × 32 px slot) | **16 px** (tracking 2 px) | 11.6 px | 72 px |
| The printed certificate (its header, on the title's baseline) | 4.33 mm | 3.15 mm | 19.5 mm |
| The Digital Card, front (6 mm in, cap top at 5.57 mm) | 3.99 mm | 2.90 mm | **18.0 mm** |

- **The smallest:** 16 px on screen, and a 2.9 mm cap height and 15 mm width in print. Below that, «PINTAR» is written in the running text's face as an ordinary word, not as the wordmark.
- **Two corrections to the build (engineering branch at `5dc55528`):**
  - the card in an email is set at 13 px, which is under the smallest size; it becomes 16 px, which fits its 96 px slot;
  - the Digital Card's slot was drawn 16.4 mm wide for the narrower «Pintar» placeholder (D5). At 3.99 mm, the word is 17.1 mm of ink (18.0 mm box), so the slot is 18.0 mm wide. The space to its right on the card's front is empty, so nothing moves.
- These sizes replace the superseded card's `wordmark-nav` / `-bar` / `-standalone` / `-min` (Helvetica cap heights). The product never used those tokens; it sets each surface's size in `globals.css` (`--logo-height*`, `--merek-tinggi`).

**Clear space.** X is the cap height. Keep at least X free on every side of the letters' ink: nothing (text, a line, an edge, a control) comes nearer. A slot already provides it: the card's 6 mm margin, and the navigation head's padding.

**Versions**

| Ground | Wordmark | Contrast |
|---|---|---|
| Light (`surface-0` `#FBFAF7`, `surface-1` white, the email's `#F3F1EC`) | `#075056` | 8.1–9.2 : 1 |
| Deep teal `#075056` | white (`pds-merek-putih`) | 9.2 : 1 |
| Dark, only where an email client's dark mode applies (`#0F1417`, `#182025`) | light teal `#86CFBF` (`pds-merek-gelap`), as the built email | 9.2–10.3 : 1 |
| One-colour print | black (`pds-merek-hitam`) | — |

PINTAR's interface has no dark mode. `#075056` on a dark ground is 2.0:1 and is never used.

**Never**
- Draw it as an image, outline it, or add a shadow, gradient, glow or animation.
- Set it in another face (except Arial while Inter loads), another weight, or another case.
- Change the tracking, stretch or condense it, or put it on a slant.
- Add «SELALU», a tagline, a symbol or a container.
- Colour it `#245F55`, a status colour or a family colour.
- Put it on a photograph or a pattern.
- Make it a second heading: it is the mark, and the page names itself.

**Kept as before (D-192(4)):**
- the legal company name, PT ZAYD PINTAR SELALU, in the footer and in an email's sender line;
- the tab icon, the plain PINTAR-green square (`assets/AppIcon/`).

**In PINTAR today:** built on the engineering branch, not yet on staging (D-193): `MerekPintar.tsx` (the one renderer), `MerekSertifikat.tsx`, `MerekKartu.tsx`, the email frame (`bingkai.ts`). In this system: `.pds-merek` in `bundle.css`, corrected 6 Nov from the superseded Helvetica proof.
