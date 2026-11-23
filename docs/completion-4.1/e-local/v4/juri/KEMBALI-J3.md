# E · J3's returned sheet (committed before any score is read)

**Received:** 23 Nov 2026 (owner, through this session). **Recorded by Bob before any score was read.**

| File | SHA-256 |
|---|---|
| J3's returned workbook (as received) | `4bbbbcbd2d7a573e6671cad88b9405afc5092634f8ce1163f4c3515a960b8eba` |
| The frozen routing it was checked against (`J3-ROUTING.md`) | `0c804284fea9ef971291340706a291d757933181a3ef446461fe45dfd3fe5f92` (matches) |
| The judges' `items.json` | `e37d82f4ce085d14395c4fb9eb7d9c14d0cb15b3c30a840447b85ce65c530735` (matches) |

**The conversion** (`lembar_j3.py tocsv`, `python3.13 -I`): **REFUSED**, "incomplete: B2-029, beban_tinjau: kosong".
- One routed cell is empty, so the sheet cannot be converted.
- No output was written, and no score was read.

**Next:**
- J3 fills **B2-029 · beban_tinjau** and returns the sheet.
- The new workbook gets its own checksum, recorded here before conversion.
- Then `nilai-juri.mjs json`, then the results, then the map is unsealed.

**Custody:**
- The workbook is kept outside the repository, beside the judges' package.
- No score or reason appears in this record.
- **The provider map stays sealed.**

## The second return (23 Nov 2026), recorded before conversion

| File | SHA-256 |
|---|---|
| J3's second workbook (as received) | `fc883d4e88b5b2a4f494d786073e0558a08fc83586036d1ef0012c78a8eb1ee4` |
| Its conversion, `lembar-nilai-J3-keputusan.csv` (`lembar_j3.py tocsv`; exit 0, "5 rows written") | `a881169182692e5c2bc47b99d4d8737b870ba64c388eebcbb3f5a4689a5bbf7c` |

**J3's sheet is complete and well-formed.** The converter refuses an empty routed cell, a column that was not routed, and a changed code. The CSV is kept outside the repository. No score is shown here. **The map stays sealed** until `nilai-juri.mjs json` has run.
