# Synthetic development corpus (F-4)

Everything in this folder is **synthetic**: two short SD Kelas 5 Matematika chapters written new for Batch 1. No lesson, question, option, reason or misconception was copied or paraphrased from real teaching material.

## Why it exists

The repository is public (D-143). The real chapters, with their answer keys, were in `docs/onboarding/konten/`. Under the owner's F-4 decision (D-145(b)) they were removed from the active tree by normal commits. The history was not rewritten, so the removed keys must be treated as already public. Development, CI, the selftests and the audit journeys now use this corpus. None of them needs a real chapter.

The real chapters live in the **private content store**. The owner still has to create it, so it is not available yet. Real content must never be committed to this repository. The guard (`scripts/guard/sensitive-scan.mjs`, class `kunci-jawaban`) refuses keyed material in any file not declared in `scripts/guard/allowlist.json`.

## What is here

| File | What it is |
|---|---|
| `buat-korpus.mts` | The generator. It holds the content and writes every file below. |
| `SD5-Sintetis-Bab1.xlsx` / `.paket.json` | «Matematika Kelas 5 · Bab 1: Pola Bilangan»: 4 lessons, 18 questions (4 Pemetaan awal, 8 Cek penguasaan, 6 Latihan), 9 misconceptions |
| `SD5-Sintetis-Bab2.xlsx` / `.paket.json` | «Matematika Kelas 5 · Bab 2: Data Sederhana»: 4 lessons, 18 questions (4 / 8 / 6), 9 misconceptions |

The generator also writes `audit/fixtures/sd5-sintetis-bab{1,2}.paket.json`, which are byte-identical copies that `audit/journey.mjs` imports. The example workbook `docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx` is built from Bab 1 with `npm run contoh:buku-kerja`.

Each `.paket.json` is exactly what the upload page makes of its `.xlsx`, using the app's own reader and converter. PENUTUPAN-M04 checks this byte for byte. The corpus covers every markup feature the lesson renderer draws (DAISY-30-TEKS-01) and every rule of the workbook contract and of Studio's question-quality pass.

## Regenerate and check

```sh
npx tsx docs/onboarding/konten-sintetis/buat-korpus.mts
npm run contoh:buku-kerja
python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.paket.json
python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten-sintetis/SD5-Sintetis-Bab2.paket.json
```

After changing the content, update the exact counts asserted by DAISY-30-TEKS-01 (`selftest/experience.test.ts`), PENUTUPAN-M04 (`selftest/penutupan.test.ts`) and `audit/staging/golden-school-admin.mjs` (`BAB`).
