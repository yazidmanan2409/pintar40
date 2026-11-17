# Handbook sample · Tugas 12

One complete, reader-facing sample of the PINTAR handbook (Draft 02 structure), set to the **handbook design language v0.1**:
**Tugas 12 · Membaca ringkasan hasil belajar seluruh kelas**.

- `PINTAR-Buku-Panduan-Contoh-Tugas-12.pdf`: the sample to inspect. It has 8 A4 pages and a reviewer-notes page.
- `tugas-12.src.html` + `style.css`: the editable layout. Each `<section class="halaman">` is one A4 page.
- `d05.svg`: flowchart D-05, inlined into the page by the build.
- `img/`: seven one-idea crops of SS-32 («Lihat bukti»), SS-33 («Lihat per soal») and the not-yet-enough state, plus `figures.json`.
- `fonts/`: the product's own typefaces (SIL OFL; licences included).
- `render/`: how the screenshots were produced (see below).
- `build.mjs`: writes `tugas-12.html` and the PDF, and warns when a page overflows.

## Rebuild the PDF

```bash
NODE_PATH=$(npm root -g) node docs/handbook/contoh-tugas-12/build.mjs
```

This uses the pre-installed Playwright and Chromium.

## Re-render the screenshots

This is the same method as Daisy's review harness (`render-screens`, on the `ux-1/daisy-experience` branch). It renders the product's real components, compiled stylesheet and screen text with **fictional** data. A running app needs the local database stack, which cannot start in this work environment.

The figures follow the handbook design language v0.1, one idea per crop. They are captured at 576 px, just above the product's 560 px phone breakpoint, and printed at one shared scale (512 px = 94 mm). `img/figures.json` holds each crop's size and its callout boxes. The callout boxes are the elements' own positions plus a margin, and `tugas-12.src.html` uses the same numbers.

Run it from a checkout of `main` with `npm ci` done. Write the output outside the repository.

```bash
OUT=$(mktemp -d); mkdir -p handbook-render && cp docs/handbook/contoh-tugas-12/render/* handbook-render/
node handbook-render/stylesheet.mjs "$OUT"
npx tsx handbook-render/t12-screens.tsx "$OUT"
cp -r public/fonts "$OUT/" && (cd "$OUT" && python3 -m http.server 8765 &)
NODE_PATH=$(npm root -g) node handbook-render/t12-figures.mjs http://localhost:8765 docs/handbook/contoh-tugas-12/img
```

Every school, class, name and number in the screenshots is invented. The product footer is never inside a crop, because it names a real person. The final handbook set will instead be captured from the accepted 5.0 build, on a fixture school the owner approves.
