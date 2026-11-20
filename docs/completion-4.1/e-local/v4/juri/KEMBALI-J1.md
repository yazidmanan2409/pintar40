# E · J1's returned sheet (committed before any score is read)

**Received:** 20 Nov 2026 (owner, through this session). **Recorded by Bob before any score was read.**

| File | SHA-256 |
|---|---|
| J1's returned workbook (as received) | `321a3e63c98189ba1277b200120237effc3458187791510ebd2081034b9c43d6` |
| Its conversion, `lembar-nilai-J1.csv` (`lembar_penilaian.py tocsv … J1 items.json …`) | `3676368025a20b2f38ab39d01719d136ca97727198b277379c814dd87e7be137` |
| The judges' `items.json` used for the conversion | `e37d82f4ce085d14395c4fb9eb7d9c14d0cb15b3c30a840447b85ce65c530735` (equals the recorded source, `README.md`) |

**The conversion:** exit 0, "60 rows written". The converter refuses the wrong judge, a changed or reordered code, a
missing or out-of-range score and an empty reason, so **J1's sheet is complete and well-formed.**

**Independence (owner, 20 Nov):**
- each judge was told only "please assess the questions as per the guidelines";
- no judge was told another's findings.

**Custody:**
- The workbook and the CSV are kept outside the repository, beside the judges' package.
- The owner holds the original.
- No score, reason or summary of either appears in this record.
- **The provider map stays sealed.**

**Both judges are now recorded** (J2: `KEMBALI-J2.md`). **Next:**
1. `nilai-juri.mjs j3` with the committed flags (`90e753ac…`) selects the questions J3 decides, with both judges'
   reasons.
2. J3 adjudicates.
3. Then the results, after which the map is opened.
