# F-4 · Exposed assessment items: inventory and usage (Batch 1, 2 Nov 2026)

**Authority:** D-145(b)(4), the owner's F-4 decision: «Inventory all publicly exposed assessment items and their usage».

**What this file contains:**
- counts, chapter titles and usage only;
- **no item text and no key**;
- the items stay public in history and on copies already taken (D-143). Removing them from the tree does not make them confidential again.

## 1. What was exposed

The real chapter sources in `docs/onboarding/konten/`, public since 2 Nov:
- 20 keyed builds (`.paket.json`);
- 20 workbooks (`.xlsx`);
- 20 generator scripts (`.py`, every item with its key);
- 20 misconception maps (`*-miskonsepsi.csv`, which give the key away by elimination).

**Also exposed:**
- the sample workbook `docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx` (SD5 Bab 1);
- two full copies under `audit/fixtures/` (SD5 Bab 1 and Bab 2);
- on branch `claude/adoring-feynman-njmjll` only: the internal *Strategi Pembelajaran* demo, 2 chapters (educator professional learning, J9).

| Chapter file | Title | Pemetaan Awal (PRE_TEST) | Cek penguasaan (POST_TEST) | Practice |
|---|---|---:|---:|---:|
| SD5-Matematika-Bab1 | Matematika Kelas 5 · Bab 1: Bilangan Cacah sampai 100.000 | 4 | 8 | 19 |
| SD5-Matematika-Bab2 | Matematika Kelas 5 · Bab 2: KPK dan FPB | 4 | 8 | 20 |
| SD5-Matematika-Bab3 | Matematika Kelas 5 · Bab 3: Bilangan Pecahan | 4 | 8 | 18 |
| SD5-Matematika-Bab4 | Matematika Kelas 5 · Bab 4: Keliling Bangun Datar | 4 | 8 | 18 |
| SD5-Matematika-Bab5 | Matematika Kelas 5 · Bab 5: Luas Daerah Bangun Datar | 4 | 8 | 18 |
| SD5-Matematika-Bab6 | Matematika Kelas 5 · Bab 6: Sudut | 4 | 8 | 18 |
| SD5-Matematika-Bab7 | Matematika Kelas 5 · Bab 7: Membandingkan Ciri-Ciri Bangun Datar | 4 | 8 | 19 |
| SD5-Matematika-Bab8 | Matematika Kelas 5 · Bab 8: Data | 4 | 8 | 17 |
| SD5-Matematika-Bab9 | Matematika Kelas 5 · Bab 9: Bilangan Cacah sampai 1.000.000 | 4 | 8 | 16 |
| SMA10-Matematika-Bab1 | Matematika Kelas X · Bab 1: Eksponen | 4 | 8 | 20 |
| SMA10-Matematika-Bab2 | Matematika Kelas X · Bab 2: Barisan dan Deret | 4 | 8 | 20 |
| SMA10-Matematika-Bab3 | Matematika Kelas X · Bab 3: Perbandingan Trigonometri | 4 | 8 | 20 |
| SMA10-Matematika-Bab4 | Matematika Kelas X · Bab 4: Sistem Persamaan dan Pertidaksamaan Linear | 4 | 8 | 20 |
| SMA10-Matematika-Bab5 | Matematika Kelas X · Bab 5: Persamaan dan Fungsi Kuadrat | 4 | 8 | 20 |
| SMA10-Matematika-Bab6 | Matematika Kelas X · Bab 6: Representasi dan Interpretasi Data | 4 | 8 | 20 |
| SMA10-Matematika-Bab7 | Matematika Kelas X · Bab 7: Peluang | 4 | 8 | 20 |
| SMA11-Geografi-Bab1 | Geografi Kelas XI · Bab 1: Posisi Strategis Indonesia, Potensi Sumber Daya Alam, dan Pengaruhnya Terhadap Kehidupan | 4 | 8 | 19 |
| SMA11-Geografi-Bab2 | Geografi Kelas XI · Bab 2: Keragaman Hayati Indonesia dan Dunia | 4 | 8 | 18 |
| SMA11-Geografi-Bab3 | Geografi Kelas XI · Bab 3: Lingkungan dan Kependudukan | 4 | 8 | 19 |
| SMA11-Geografi-Bab4 | Geografi Kelas XI · Bab 4: Perubahan Iklim dan Kebencanaan | 4 | 8 | 20 |
| **Total** | 20 chapters | **80** | **160** | **379** |
| **Total** | 20 chapters | **80** | **160** | **379** |

**619 items, all with their keys exposed.** Of these:
- **240** are the real-assessment items: 80 Pemetaan Awal and 160 Uji Penguasaan / Cek penguasaan. These are the ones F-4 requires regenerated before real educational use.
- **379** are practice items. They are meant to be seen, so no regeneration is needed.

## 2. Where they have been used

### 2.1 Staging (read-only count, 2 Nov 2026, project `keijhmdtsgrfvnvocfvk`)

| Chapter | Imported into | Courses | Status | Sessions with answers |
|---|---|---:|---|---|
| SD5 Bab 1 | Golden School runs (`gs-001`, `sekolah-emas-uji-20261005`), test schools (`sekolah-uji-b0`, `sekolah-uji-baseline-894`, `sekolah-uji-daisy-001a`, `-885`, `-885b`, `sekolah-uji-l3`), the demonstration school `sekolah-demo-pintar`, `sd-zps` (INGESTED only), and the performance school `uji-kinerja` (synthetic, 21 courses) | 31 | APPROVED (1 INGESTED, `sd-zps`) | 10–19 per test school; 1,241 in one `uji-kinerja` load-test course |
| SD5 Bab 2, 3, 4 | `uji-kinerja` only | 1 each | APPROVED | 10 each |
| SMA10 Bab 1 | `uji-kinerja` only | 1 | APPROVED | 10 |
| The other 15 chapters | nowhere on staging | 0 | — | — |

**Every school above is a test, performance or demonstration school.** No real learner exists on staging, so **no real assessment has used an exposed item.**

**The existing results are left exactly as they are.** This includes the demonstration school's results:
- D-145(b) forbids deleting historical results;
- D-146 protects the demonstration data.

### 2.2 Production

Not read; Batch 1 does not authorise reading it. Production has run `5b5b68d` since 23 Sep with no real school (A-CURRENT-STATE). **Confirmation of «no real use» on production is an owner-side check (§4).**

## 3. The rule for regenerated items: new identities, originals retired

D-145(b)(6) and D-144 (roadmap compatibility: 4.5 Question Intelligence must not mix exposed and clean statistics).

1. **A regenerated item is a new item.** It arrives through Studio's correction line (`revises_course_id`, D-085 M10): an uploaded corrected workbook becomes the next course of the same line, with new `items` rows and therefore new identities. The line and its change summary are kept (`course_revision_notes`). **An exposed item is never edited in place** to become a «new» question.
2. **The exposed original is retired, not deleted.** Its release is superseded through `withdraw_release` (SUPERSEDED, chain intact, never deleted). Its existing responses, results, evidence and certificates stay attached to the original item ids (`withdraw_release`: «evidence, results and certificates are untouched»).
3. **Before real use:** only chapters marked «used for real assessment» (F-4c, owner or content lead) need their 12 Pemetaan Awal and Cek penguasaan items regenerated. The check is one-off: no stem of a regenerated chapter may be identical to an exposed stem. It can be run against the exposed set held in the private store.
4. **Nothing in the database makes an exposed item ineligible yet.** Option for the owner: a flag on the 20 exposed courses (`exposure` = `TERPAPAR_2026_11_02`) that blocks assigning them as a real Pemetaan Awal or Uji Penguasaan in a non-synthetic school.
   - This is a class B provision under D-144: it adds schema and needs approval. It is not built.
   - Without it, the rule above is a procedure for the content lead, enforced by review.

## 4. Open owner items (from D-145(b))

| # | Item | Status |
|---|---|---|
| a | Create the private content store and its named access list (credentials, permissions, billing) | **BLOCKED — OWNER DECISION** (the owner's to create; D-145(b)) |
| b | Move the real sources into it (the files removed from the tree are still in git history and in the current checkout's parent commits, from where the content lead copies them) | Waits on (a) |
| c | Mark which chapters are used for real assessment (F-4c) | **BLOCKED — OWNER DECISION** |
| d | Regenerate those chapters' 240 (at most) Pemetaan Awal and Uji Penguasaan items, as new identities | Content lead, after (a) and (c); before any real school |
| e | Confirm no real use on production (owner-side read, or a read authorised for Claude) | **BLOCKED — OWNER DECISION** |
| f | Optional: the exposure flag (§3.4) | Owner decision (class B, D-144) |

## 5. What Batch 1 did (commits `1efe7dd` … `58e0d22`)

| D-145(b) step | Done in Batch 1 |
|---|---|
| (2) Remove restricted keyed material from the active tree by forward commits | **Done.** 82 files removed: 20 `.paket.json`, 20 `.xlsx`, 20 generator `.py`, 20 `*-miskonsepsi.csv` and the two `audit/fixtures/sd5-matematika-bab{1,2}.paket.json` copies. The sample workbook `contoh-buku-kerja-pintar.xlsx` is rebuilt from synthetic content. No history rewritten |
| (3) Replace real material misfiled as synthetic | **Done.** `audit/fixtures/sd5-sintetis-bab{1,2}.paket.json`, written by `docs/onboarding/konten-sintetis/buat-korpus.mts` (original synthetic content, the app's own converter) |
| (4) Inventory the exposed items and their usage | **Done** (this file, §1–2) |
| (6) New identities, originals retired | **Rule written** (§3). Applied when the content lead regenerates; nothing to regenerate in Batch 1 |
| (7) Workflows no longer need restricted keys in the public repository | **Done.** L4-C01/P01, PENUTUPAN-M04, DAISY-30-TEKS-01, `audit/journey.mjs` (S15c, S21, S26d), the Golden School audits, and the staging import and journey workflows read the synthetic corpus. Thresholds tied to the real corpus's size are now its exact synthetic counts; every rule check kept (each changed test shown red on a broken fixture, then green) |
| (8) Preventive safeguards | **Done.** The guard recognises keyed **content** (correct-answer markers in any data file, generator tuples, misconception maps with a distractor column), not only file types. SEC-G02 refuses any real-keyed declaration. SEC-G01: 26 planted red cases and 16 green ones |
| (1) Private content store | **BLOCKED — OWNER DECISION** (§4 a) |
| (5) Regenerate before real use | Waits on §4 a, c |

**Known limit of the history scan:** `sensitive-scan --history` judges an old blob by its path's current declaration. Earlier versions of `docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx` (built from real SD5 Bab 1) are therefore not flagged there. They are listed as exposed in §1. The tree and staged modes (CI and pre-commit) are unaffected.
