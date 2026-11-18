# Katalog Lengkap Fitur PINTAR 4.0–5.0

- `PINTAR-KATALOG-FITUR-4.0-5.0.pdf`: the reader-facing A4 catalogue in Bahasa Indonesia (39 pages).
- `fitur.mjs`: **the editable content**, one record per feature (name, users, «Apa itu?», «Apa manfaatnya?», «Contoh penggunaan», status, note), plus the candidates.
- `build.mjs`: lays the content out (`katalog.html` + `katalog.css`, the PINTAR handbook's design grammar) and prints the PDF:
  `NODE_PATH=$(npm root -g) node docs/katalog-fitur/build.mjs`
- `coverage.mjs` → `KATALOG-COVERAGE.md`: the internal checklist mapping every entry to its source and status evidence, with the points for Bob. Run `node docs/katalog-fitur/coverage.mjs` after editing `fitur.mjs`.
- `fonts/`: Plus Jakarta Sans and Inter Bold (wordmark), with their SIL OFL licences.

Status is as of 18 November 2026. The catalogue is **not final** until Bob has verified the inventory and version assignments.
