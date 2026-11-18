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

## The package as delivered (18 Nov 2026, about 09:45 UTC)

**Source:** the owner's original `untuk-juri.zip` (sha256 `222d66c70269beafec759158f2927079fa8921892984440e323a02691fd7f357`).
Its `items.json` is sha256 `e37d82f4ce085d14395c4fb9eb7d9c14d0cb15b3c30a840447b85ce65c530735`.

**Proven to be the evaluated file:**
- re-running `nilai-juri.mjs flags` with Sharon's committed answers (`b7eb6424…`) reproduces the committed
  `flags.json` (`90e753ac…`, 0 flags);
- its stems and options equal the keyless `untuk-sharon/items.json` Sharon answered;
- its 60 item IDs, in order, equal the IDs in both workbooks.

| File | SHA-256 | For |
|---|---|---|
| `PINTAR-SOAL-PENILAIAN-JURI-60-SOAL.pdf` (35 pages) | `68d4da182ae71a157c63380bcfdccd1d2491f870ee7ef310141c0f9e94783ee9` | J1 and J2 (the same file) |
| `PETUNJUK-SINGKAT-PENILAIAN.pdf` (1 page) | `5f02d1422b85adf9988aee6bb2a2f3cef407ebdb8d4f0624efa21f2f69262d9c` | J1 and J2 |
| `Lembar-Penilaian-J1.xlsx` | `e5e7c0002d8113abda36a514b53a515cb44c2a89639ef93aeb32185285968cd6` | J1 only |
| `Lembar-Penilaian-J2.xlsx` | `07692b2de6120bbb4ab038fbbe6e4faf68b00300f4f9e7178d44373471823805` | J2 only |

**Booklet checks** (`booklet/verify.py`, PASS):
- 60 questions, numbered 1–60, each with its code, in `items.json` order;
- every stem, option, key, rationale, misconception and code present verbatim, in order, inside its own question;
- no stray markup;
- none of the forbidden provider, model or generation terms.

**Two presentation choices** (no wording change):
- **Tables:** eight stems hold Markdown tables, which are drawn as real tables with the same cells in the same order.
  The `|---|` separator row is formatting only.
- **Hyphenated tokens** (ke-6, SINT5-B1-03) are kept on one line, so no line breaks inside them.

**Inspected visually:** the cover, a table question (Soal 3, Soal 48), the dot-picture question (Soal 21), and the ×, −,
… and ● symbols. Every question's card stays on one page.
