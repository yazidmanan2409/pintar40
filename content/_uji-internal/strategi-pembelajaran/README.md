# [UJI INTERNAL] Strategi Pembelajaran: internal educator demo

**UJI INTERNAL / MATERI PERAGAAN — TIDAK UNTUK DISTRIBUSI PRODUKSI**

This folder holds the internal educator demo (D-069(g), D-070(d), (e)). Its content is a close
adaptation of:

> Dr. Siti Nurhasanah, M.Pd; Dr. (Cdt) Agus Jayadi, M.Pd; Dr. Rika Sa'diyah, M.Pd; Syafrimen,
> M.Ed, Ph.D. *Strategi Pembelajaran*. Jakarta: Penerbit EDU PUSTAKA, 2019, Cetakan Pertama.
> ISBN 978-623-90461-7-0.

We hold no rights to that book. Close adaptation is approved for this internal demo only.

What that means for this folder:
- It stays on the lesson author's branch.
- It is never merged to `main`.
- It never goes to production and never goes into Pustaka PINTAR.
- It is deleted after the demo unless rights are obtained (D-070(e)).
- The book scans are never committed.

| File | What it is |
|---|---|
| `strategi_pembelajaran_bab1.py` | Generator for Bab 1 (LANA-22). It holds the lessons, the questions, the facts with their pages, and every check. |
| `StrategiPembelajaran-Bab1.xlsx` | The workbook it writes, in the D-007 template. |
| `StrategiPembelajaran-Bab1.paket.json` | The package, built by `docs/onboarding/konten/ke-paket.ts`. |
| `StrategiPembelajaran-Bab1-jejak.md` | The page trace: every lesson section and every option, and the pages they rest on. |
| `LANA-22.md` | The hand-off for Bab 1. |
| `strategi_pembelajaran_bab2.py` | Generator for Bab 2 (LANA-23), with the same method and checks. |
| `StrategiPembelajaran-Bab2.xlsx`, `.paket.json`, `-jejak.md` | Its workbook, package and page trace. |
| `LANA-23.md` | The hand-off for Bab 2. |

To rebuild and check:

Bab 2 is rebuilt the same way, with `bab2` in place of `bab1`.

```
python3 content/_uji-internal/strategi-pembelajaran/strategi_pembelajaran_bab1.py [--kutipan bab1.txt,depan.txt]
npx tsx docs/onboarding/konten/ke-paket.ts content/_uji-internal/strategi-pembelajaran/StrategiPembelajaran-Bab1.xlsx content/_uji-internal/strategi-pembelajaran/StrategiPembelajaran-Bab1.paket.json
python3 docs/onboarding/konten/periksa_mutu.py content/_uji-internal/strategi-pembelajaran/StrategiPembelajaran-Bab1.paket.json
```
