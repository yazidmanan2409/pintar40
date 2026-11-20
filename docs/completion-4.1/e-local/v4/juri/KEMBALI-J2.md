# E · J2's returned sheet (committed before any score is read)

**Received:** 20 Nov 2026 (owner, through this session). **Recorded by Bob before any score was read.**

| File | SHA-256 |
|---|---|
| J2's returned workbook (as received) | `b247597deda754fc1b24da7176ebcea85bdd04272f3392c6ef24df30cd8a602d` |
| Its conversion, `lembar-nilai-J2.csv` (`lembar_penilaian.py tocsv … J2 items.json …`) | `391e8efb3bd19b58a238120ea0a2b220e5650adb2eaa51e269c6656dfdfbec35` |
| The judges' `items.json` used for the conversion | `e37d82f4ce085d14395c4fb9eb7d9c14d0cb15b3c30a840447b85ce65c530735` (equals the recorded source, `README.md`) |

**The conversion:** exit 0, "60 rows written". The converter refuses the wrong judge, a changed or reordered code, a
missing or out-of-range score and an empty reason, so **J2's sheet is complete and well-formed.**

**Custody:**
- The workbook and the CSV are kept outside the repository, beside the judges' package.
- The owner holds the original.
- No score, reason or summary of either appears in this record.
- **The provider map stays sealed** until every score is final (J1, J2, then J3's adjudication).

**Next:**
1. J1's sheet, recorded the same way.
2. `nilai-juri.mjs j3` with the committed flags (`90e753ac…`) selects the questions for J3.
3. J3 adjudicates.
4. Then the results, after which the map is opened.
