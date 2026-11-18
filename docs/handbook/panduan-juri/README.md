# Panduan penilaian untuk juri · PDF

- `PANDUAN-JURI-PINTAR.pdf`: the A4 PDF for the jury teachers (4 pages).
- `panduan-juri.html`: the editable source. Its styles are inline, in the PINTAR handbook's design grammar (Plus Jakarta Sans, deep teal #075056, the same page anatomy).
- `PANDUAN-JURI.md`: the authoritative text. The PDF reproduces it word for word; only layout was added: the opening, the section strip, panels for the scoring standards and for J1/J2 versus J3, and the tables.
- `build.mjs`: prints the PDF with the pre-installed Chromium and reports the space left above each footer:
  `NODE_PATH=$(npm root -g) node docs/handbook/panduan-juri/build.mjs`
- `fonts/`: Plus Jakarta Sans and Inter Bold (wordmark), with their SIL OFL licences.

The text was checked against the Markdown sentence by sentence (`pdftotext`). The PDF names no AI provider.
