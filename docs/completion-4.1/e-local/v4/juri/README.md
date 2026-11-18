# E · the judges' package for J1 and J2 (owner, 18 Nov: "as straightforward as marking an examination paper")

The teachers receive three files, identical for J1 and J2 except the judge code inside the workbook:

| File | What it is | Built by |
|---|---|---|
| `PINTAR-SOAL-PENILAIAN-JURI-60-SOAL.pdf` | **Buku Soal Penilaian.** Questions numbered 1–60 in `items.json`'s order, with each question's objective, options, proposed key, rationale and distractor misconceptions, as `PANDUAN-JURI.md` §1 promises. The item ID is shown small, for traceability | `booklet/build_html.py` → `booklet/print.js`; checked by `booklet/verify.py` |
| `Lembar-Penilaian-J1.xlsx` / `-J2.xlsx` | **Lembar Penilaian.** One row per question number, with the five approved criteria and a required reason. Typing is validated, completion is shown, and the codes are hidden | `lembar_penilaian.py make` |
| `PETUNJUK-SINGKAT.pdf` | **Petunjuk Singkat.** One page: the steps, and the criteria with examples | `booklet/petunjuk.html` → `booklet/print1.js` |

**The authoritative scoring format** is the five criteria plus a reason: `benar` 0/1; `keselarasan`, `pengecoh`,
`bahasa` and `beban_tinjau` 0–2; `alasan` required.
- Sources: E-DECISION-PACK §4.3a, approved by ruling 48 (Q1 uses `benar` and the review burden; Q2 averages the four
  0–2 criteria), `PANDUAN-JURI.md` §2 and §4, and `nilai-juri.mjs` `COLS`.
- The frozen kit's `reviewer/judgements-template.csv`, which travels inside `untuk-juri.zip`, has four criteria and no
  review burden or reason, so it **cannot** score Q1 (`e-local/README.md`, 17 Nov). It is **not used**.

**Back to the data:** `lembar_penilaian.py tocsv <filled.xlsx> J1 <items.json> lembar-nilai-J1.csv` gives exactly the
CSV that `nilai-juri.mjs j3` and `json` read. It refuses:
- the wrong judge;
- a changed or reordered code;
- a missing or out-of-range score;
- an empty reason.

Its self-test checks a round trip, including a reason with a comma and quotes. A workbook saved again by LibreOffice
also converts. `lembar-nilai-J1.csv` and `-J2.csv` here are the blank reference sheets (`nilai-juri.mjs lembar`); the
teachers never see them.
