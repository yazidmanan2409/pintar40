# Handbook sample · Tugas 12

One complete, reader-facing sample of the PINTAR handbook (Draft 02 structure):
**Tugas 12 · Membaca ringkasan hasil belajar seluruh kelas**.

- `PINTAR-Buku-Panduan-Contoh-Tugas-12.pdf`: the sample to inspect. It has 9 A4 pages and a reviewer-notes page.
- `tugas-12.src.html` + `style.css`: the editable layout. Each `<section class="halaman">` is one A4 page.
- `d05.svg`: flowchart D-05, inlined into the page by the build.
- `img/`: the four screenshot crops (SS-32 top and bottom, SS-32 not-yet-enough, SS-33).
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

Run it from a checkout of `main` with `npm ci` done. Write the output outside the repository.

```bash
OUT=$(mktemp -d); mkdir -p handbook-render && cp docs/handbook/contoh-tugas-12/render/* handbook-render/
node handbook-render/stylesheet.mjs "$OUT"
npx tsx handbook-render/t12-screens.tsx "$OUT"
cp -r public/fonts "$OUT/" && (cd "$OUT" && python3 -m http.server 8765 &)
NODE_PATH=$(npm root -g) node handbook-render/t12-crop.mjs http://localhost:8765 docs/handbook/contoh-tugas-12/img
```

Every school, class, name and number in the screenshots is invented. The product footer is cropped out, because it names a real person. The final handbook set will instead be captured from the accepted 5.0 build, on a fixture school the owner approves.
