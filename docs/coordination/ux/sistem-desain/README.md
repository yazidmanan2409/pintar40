# PINTAR design system: foundation study

**Status: a proposal for Yazid's review.** Nothing here is applied to PINTAR. No file in `src/` was changed or renamed, and no surface, route, permission, journey or rule moves. The application pass starts only after Yazid approves, one step at a time (`project/07-proposal.md`, «If approved»).

## Where to look

- **The playground:** the private Design System page at https://claude.ai/artifact/153KwNRJkTETDKAZSoorS1. It shows the tokens, the brand book and every component as a live card. It is private until it is shared.
- **The source:** `project/`, the same files the page shows.

The playground is not a route in the app. Nothing is added to `src/`, the route inventory or the surface inventory.

| Path | What it is |
|---|---|
| `project/tokens.json` | Token set v3, evolved from v2 (`src/app/globals.css`). Every token says KEPT, CHANGED, NEW, or NEEDS A RULING. |
| `project/README.md` | The brand book: intent, content, visual foundations, icons, the mark. |
| `project/01-colour.md` … `06-accessibility.md` | Colour (with the contrast table), typography, layout, interaction and motion, navigation, accessibility. |
| `project/07-proposal.md` | What is new, what departs from a ruling, what does not change, the findings, and **fifteen questions for Yazid**. |
| `project/09-references.md` | The four visual references of 4 Oct against this proposal: confirmed, changed, not copied. The images themselves are not stored here. |
| `project/08-migration.md` | Today's `pin-*` classes and shared components → v3 components; the spec §6 gaps; print. |
| `project/components/<Name>/` | 48 components: `README.md` (the guideline, with a Status line) and `preview.html` (the live card). `Cover/` is the page's cover. |
| `project/components/bundle.css`, `bundle.js` | The components' styles (`pds-*` classes) and behaviour (`window.Pintar`). `bundle.js` is generated; do not edit it. |
| `alat/` | Review tooling. It is not product code and is not published. |
| `render/kontras.md`, `render/laporan.txt` | The last contrast and preview reports. The screenshots are not committed; the harness rebuilds them. |

## Checking it

Run these from the repository root.

```sh
# Every preview at its card width and at 390 px: script errors, failed requests,
# axe (WCAG 2.0/2.1/2.2 A and AA), sideways scroll, 24 px targets (44 px reported).
npx tsx docs/coordination/ux/sistem-desain/alat/pratinjau.mts --sempit
# or only some:  … pratinjau.mts AppShell Table --sempit

# Every text and boundary pair in the palette against WCAG; writes render/kontras.md.
python3 docs/coordination/ux/sistem-desain/alat/kontras.py
```

`alat/skenario.json` holds the interaction scenarios the harness plays before it checks a card: a menu opened, a dialog shown, a table filtered, an action that fails.

## The boards (PNG)

The design language, system and grammar as 19 image boards (24 images: five boards come in two parts, so each image stays under 8000 px tall). Each is 1600 px wide and saved at 2×, built from these same files with every component card live:

```sh
npx tsx docs/coordination/ux/sistem-desain/alat/papan.mts        # all boards → papan/NN-name.png
npx tsx docs/coordination/ux/sistem-desain/alat/papan.mts 07 14  # some boards
```

The PNGs are not committed (about 22 MB); the script rebuilds them.

## Rebuilding the bundle

`bundle.js` is `alat/bundle-sumber.js` with the icon map inlined:

```sh
npm pack lucide-static@0.468.0 && tar xzf lucide-static-0.468.0.tgz   # in a scratch directory
node docs/coordination/ux/sistem-desain/alat/buat-bundle.mjs <scratch>/package/icons
```

## Icons and licence

The forty icons are Lucide (`lucide-static` 0.468.0), copied unchanged under the ISC licence:

> ISC License. Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
>
> Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

The fonts are the product's own (`public/fonts/`). The mark is the supplied PINTAR SELALU artwork (`public/brand/`).

## Not received

The brief mentions attached visual references. None reached this study.
