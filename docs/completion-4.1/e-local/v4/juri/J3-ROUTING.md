# E · J3's questions (the frozen routing, 20 Nov 2026)

**Command:** `nilai-juri.mjs j3`. It verified all three inputs against their committed fingerprints before reading:

| Input | SHA-256 |
|---|---|
| flags | `90e753ac…073f` (0 flags) |
| J1 | `36763680…e137` (`KEMBALI-J1.md`) |
| J2 | `391e8efb…ec35` (`KEMBALI-J2.md`) |

**Output:**
- "5 items for J3";
- `lembar-nilai-J3.csv`, SHA-256 `0c804284fea9ef971291340706a291d757933181a3ef446461fe45dfd3fe5f92`. It is kept outside the
  repository, because it carries the judges' reasons.

**The five routed questions, and what J3 decides** (the frozen rule routes a column only where the judges' scores are
two points apart, or where the key's correctness differs):

| Question | J3 decides |
|---|---|
| B2-003 | beban_tinjau |
| B2-007 | bahasa |
| B2-008 | bahasa |
| B2-026 | bahasa |
| B2-029 | bahasa, beban_tinjau |

**B1-016** goes to J3 as a **wording note for the educators**, not scored (`E-KFLAG-RECORD.md`).

**J3's package:**

| File | SHA-256 |
|---|---|
| `Lembar-Penilaian-J3.xlsx` (`lembar_j3.py make`; 5 rows; only the routed columns are open; J1's and J2's reasons shown; the B1-016 note below the table) | `2d63c5ad7f22993dc491cabe4fa812ce539c080717eb5b9e8287db82b3abefdb` |
| `PINTAR-SOAL-PENILAIAN-JURI-60-SOAL.pdf` (the same booklet as J1 and J2) | `68d4da182ae71a157c63380bcfdccd1d2491f870ee7ef310141c0f9e94783ee9` |
| `PANDUAN-JURI-PINTAR.pdf` (the same guide) | `69954b381ec5bfe65fba4f2c2daa083f092886c634d6adf56596f9fc46a8b961` |

`lembar_j3.py` is new: a workbook maker and converter for J3 only, with a self-test (6/6 PASS).
`lembar_penilaian.py` and `nilai-juri.mjs` are unchanged.

**The provider map stays sealed.** **Next:**
1. J3's returned workbook is recorded, and its checksums committed, before it is read.
2. `lembar_j3.py tocsv` converts it.
3. `nilai-juri.mjs json` produces the results.
4. The map is unsealed.
