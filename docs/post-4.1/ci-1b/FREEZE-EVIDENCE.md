# CI-1b (L-105) · freeze evidence, re-freeze after journeys 45748680995 (Second Eye, 26 Nov 2026)

The first freeze at `e8a35c3a` is **void**. Journeys 45748680995 concluded failure (81 passed, 2 failed: S21j and B2J).

The re-freeze at `145bd8dc` is **void** too. ci 45755950858 concluded success, but journeys 45755954130 concluded failure (82 passed, 1 failed: S21j, in its EN print). The cause was test-only; see §6.

The re-freeze head is this note's commit, on main `0c155a5c`. Since `e8a35c3a` it adds three journey or doc commits and no product change:
- `e7bbd547`: S21j's fixture;
- `e009d8e0`: B2J;
- this note.

## 1 · The two failures, root-caused

### S21j (CI-1b's own journey step)
- **Failure:** the setup was refused with «violates check constraint "key_corrections_independent"». The fixture named the learner as both proposer and decider.
- **Fix:** the fixture, not the constraint. The school's admin proposes and the head of department decides. The step stops by name if it can't find two different people.
- ~~**Proof:** S21j's own fixture SQL, the template text from `audit/journey.mjs`, was run locally on a sealed certificate.~~
  - ~~With the first version's people: the same constraint error as CI.~~
  - ~~With two different people: the review is inserted.~~
- **Correction (§6):** the struck lines read as proof of S21j, and they were not.
  - They prove the fixture only: its SQL was run on its own.
  - S21j itself was never run before this re-freeze. Its EN branch had never executed, and in journeys 45755954130 it failed on a wrong check.
  - What was actually run, and the cause, are in §6.
- **Test-reliability cause:** the step's fixture had never been executed before the freeze. Only its PDF check had been run, against probe PDFs.

### B2J (an existing journey: the teacher's printed Ringkasan carries its print reference)
- **Red on main `0c155a5c` too.** I proved this locally with B2J's own method on the seeded Ringkasan, on a fresh build of main. CI-1b's print CSS did not cause it.
- **Cause 1 (vacuous check):** `pdfOk = teksPdf === "(pdftotext unavailable)" || …`. Job B never had `pdftotext` until CI-1b's workflow line installed it; the run log shows «Setting up poppler-utils 24.02.0» at 03:28:21Z. So B2J's PDF assertion had passed without reading the PDF in every run before 26 Nov, CI-2's 45509965430 included.
- **Cause 2 (unfaithful method):** the footer was hand-set, then `page.pdf` fired `beforeprint` as a print the browser starts. The page rightly answers that with its browser line («Dicetak dari browser · … (jam perangkat) · tanpa nomor referensi»), which overwrote the hand-set footer.
- **Fix (journey only):**
  - The PDF check fails closed.
  - The official path runs: «Cetak laporan» calls the real `window.print`. The footer is taken at the browser's `beforeprint`, after the page's own handler, and held while the PDF is made.
- **Product fact, seen in real Chromium:**
  - «Cetak laporan» → `window.print` → `beforeprint` keeps «Ref. CTK-…»;
  - the default footer returns at `afterprint`.
  So this is test-only.
- **The new check is not vacuous.** Locally, on the seeded Ringkasan:

| Build | Footer at print / at beforeprint | Reference in the PDF | Check |
|---|---|---|---|
| CI-1b, unplanted | official / official | yes; in-step plant caught | **PASS** |
| Product plant 1: AksiLaporan skips setting the official footer | browser line / browser line | no | **FAIL** |
| Product plant 2: `beforeprint` no longer tells the official print from a browser print | official / browser line | no | **FAIL** |

## 2 · PDF checks made fail-closed (Bob's condition 1)

The whole harness was searched for `pdftotext`, `pdfinfo`, «unavailable» and catch-to-pass around PDFs:
- **B2J** (`audit/journey.mjs`): the only vacuous PDF-text check. **Vacuous in every run before 26 Nov**; now fail-closed.
- **S21i, S21j and S27v** (`cetakSertifikat` / `salahCetak`, CI-1b's own): already fail-closed. A missing `pdftotext` becomes a «!! pdftotext: …» line, which is a failure. They are new on 26 Nov, so they were never vacuous.
- **S21i's A4 page count** (`stu17-sertifikat-A4.pdf`): counts pages from the PDF's bytes, not its text. It never needed `pdftotext`.
- **`audit/laporan-jalan.mjs`**: `page.pdf(...).catch(() => null)`. The PDF is evidence only, with no assertion, and the script runs in no workflow. I recorded it and didn't change it.
- **`audit/b6-cetak.mjs` and `audit/staging/golden-school-pd.mjs`**: make PDFs and count pages; no text check.

## 3 · Print sweep, main `0c155a5c` vs CI-1b `e8a35c3a` (Sharon's check 3)

**Method:**
- Each build ran on a freshly reset seeded database, with the browser clock pinned and the same people.
- Every surface was printed (print media, A4).
- The two PDFs were compared for page count, `pdftotext` text and pixels (`pdftoppm` at 40 dpi, ImageMagick `compare`).

**Surfaces:**
- **Learner:** `/belajar`, `/belajar/hasil` (report), `/belajar/sertifikat`, `/akun`.
- **Teacher:** `/mengajar`, `/edukator/ringkasan` (Ringkasan), `/akun`.
- **Head of department:** `/pimpinan`.
- **Dean:** `/dekan/ringkasan`, `/pimpinan`.
- **Admin:** `/konfigurasi`, `/konfigurasi/sertifikat`, `/aktivasi`, `/akun`.
- **b6-cetak P1–P6** (the same script on both builds; all PASS on both):
  - the staff shells;
  - the learner shell;
  - the class-card sheet (P3, P3b);
  - the Digital Card (P4);
  - the professional-learning record (P5);
  - the Konfigurasi section pages (audit, maintenance, roles).

**Result:**
- Page counts are equal everywhere, and there is no layout or print-rule difference.
- 11 PDFs are identical.
- The rest differ only in data:
  - the server's clock minute: the Ringkasan's «Angka dihitung …», Hasil's «sampai …», the audit log's times;
  - per-reset random values: PINTAR IDs, card numbers and PINs, b6-cetak's run tag;
  - the order of role rows with equal validity;
  - the guided tour open on one `/belajar` render.
- CI-1b's print rules apply only where their markup is:
  - `.pin-cetak-saja` exists only on the learner's certificate page;
  - the `body:has(.pin-cetak-pemberitahuan)` and `.pin-col:has(> .pin-cetak-pemberitahuan)` rules apply only where the notice is;
  - `@page cetak-keadaan` is named only by the notice.

## 4 · Local results

- **On `e8a35c3a`** (the product is identical at the re-freeze head; the product diff is empty):
  - lint and typecheck PASS;
  - suite 1448/0 (second run; the first was 1447/1 on DR-D02, «fetch failed», not reproducible after a clean reset, and outside CI-1b);
  - plants 192/192;
  - redcase 11/11 groups.
- **On `e009d8e0`, all static tests:** 959 passed, 1 failed, F04-S04 «deadlock detected».
  - The database log names both sides: the harness's own `selftest.purge_certificates()` (`alter table assessment_sessions disable trigger`, via `selftest.issue_material()`) and pg_cron's every-minute `pengerjaan_tutup_berkala()`.
  - It's a timing race between harness DDL and a scheduled job, both unchanged from main. F04-S04 alone: PASS.
  - Recorded as a pre-existing test-reliability finding, not fixed in CI-1b.

## 5 · For the owner and the reviewers

- **The workflow change:** `.github/workflows/audit-journeys.yml`, job B «Install the browser». Three lines: a comment, `command -v pdftotext >/dev/null || { sudo apt-get update -q && sudo apt-get install -y -q poppler-utils; }`, and `pdftotext -v`.
- **The accepted residual (Sharon):** Ctrl+P skips the refresh; the live QR covers it.
- **P1 and P2, red first:** `6992a63f` (red) and `6db4770d` (the fix).
  - P1, CI1B-K01: «src/lib/sertifikat-kontrak.ts has no tinjauanDariBacaan»; «the certificate page still reads the review with a default of false (an error prints a clean sheet)»; «the certificate page does not print the review line when the review is unknown».
  - P1, CI1B-A01: «PLANT (the review read fails): the page prints a clean certificate, with no review line».
  - P2: the clip never showed in the PDF text. The guard is S21j's layout check, «the review line is clipped or printed over the certificate's header», ~~proven by a planted clip in ID and EN~~.
    - **Correction (§6):** in S21j the planted clip runs on the ID print only (caught in journeys 45755954130). The EN print checks that the line is whole, with no plant.
- **Daisy's confirmed `isi_tanpa_tanggal`:** verbatim (@098539b2).

## 6 · Re-freeze after journeys 45755954130: S21j's EN check (26 Nov, Bob 05:30Z and 05:38Z; Sharon accepts (a), 05:28Z)

### What failed, and the cause
- **On `145bd8dc`:**
  - ci 45755950858: success.
  - journeys 45755954130: failure. Job B: 82 passed, 1 failed.
- **The one failure:** inside S21j, «DITINJAU printed in EN: «Periksa keaslian» is not printed».
- **Every other S21j check passed:**
  - DITINJAU in ID, with its plant caught;
  - the planted clip, caught;
  - the stale «Cetak», which re-read the state;
  - DIGANTIKAN, with its plant caught;
  - in the EN print: the link, the QR, the name, one page, and the EN review line, whole and ahead of the certificate.
- **The TEST was wrong, not the product.**
  - `salahCetak` always asked for the Indonesian heading «Periksa keaslian».
  - An EN certificate rightly prints `sertifikat.periksa.judul` in English, «Check it is genuine» (`src/lib/hle.ts`).
  - The sheet takes its words in the certificate's issued language (`language_as_issued`, `page.tsx`). This is main's behaviour, unchanged by CI-1b.
- **Test-reliability cause: a journey branch never executed before its freeze.**
  - S21j's EN branch had never run before `145bd8dc` was frozen.
  - In 45748680995 the step stopped at its fixture, before the EN print.
  - Locally only the fixture SQL (§1) and the PDF checks against probe PDFs had been run, never S21j's own steps.

### The fix (journey only; the product diff is empty)
- **The heading follows the certificate's language.** `salahCetak` asks for `sertifikat.periksa.judul` in that language (`f.bahasa`, as `barisKata` already does).
- **The words come from the product.** `kataProduk` reads them from the candidate's `src/lib/hle.ts` (`APP_DIR`, which job B already sets), so they cannot drift from it.
- **The other language's heading on the paper fails.**
- **Words that cannot be read fail closed.**
- **No check keeps `KATA_CETAK` equal to `hle.ts`.** None exists, and none is built here (AR-79). The heading no longer depends on one.

### Evidence (local stack, real browser, print media, A4; `page.pdf` read with `pdftotext -layout`)
- **What each build prints:**

| Build | Certificate | What the paper's check block says |
|---|---|---|
| main `0c155a5c` | EN, BERLAKU | «CHECK IT IS GENUINE», «Scan this code or open the link. That page confirms this certificate was genuinely issued and is still valid.», the link |
| CI-1b `145bd8dc` | EN, BERLAKU | the same, word for word |
| CI-1b `145bd8dc` | EN, DITINJAU | «Under review: … Printed 26 November 2026.» ahead of the certificate, then the same block |
| CI-1b | ID, BERLAKU and DITINJAU | «PERIKSA KEASLIAN», its sentence, the link |

- **Red first:** journey's own `salahCetak` at `145bd8dc`, extracted verbatim and run on the three EN PDFs.
  - It gives CI's exact message, «Periksa keaslian» is not printed», on all three.
  - That includes **main's correct EN print**.
- **The fixed check, same PDFs:**
  - EN, main and CI-1b: `[]`.
  - ID BERLAKU and DITINJAU: `[]` (no regression).
- **Plants:**
  1. An EN sheet with its heading hidden by a print rule: «Check it is genuine» is not printed».
  2. An EN certificate whose paper carries the ID heading: «Check it is genuine» is not printed», and «the check heading is printed in the other language («Periksa keaslian»)».
  3. An ID certificate whose paper carries the EN heading: caught the same way.
  4. `APP_DIR` without `hle.ts`: fails closed, naming the key.

### What was NOT run, plainly
- **S21j end to end was not run locally.** A local job-B run was started, then stopped at Bob's word (05:38Z) before reaching S21j. The last step, S21g, was cut off by the stop itself.
- **The CI journeys run on this head IS the end-to-end run.** Its S21j executes both the ID and the EN branch through the fixed check.

### For Daisy (non-blocking)
- The printed certificate, and with it CI-1b's review line and notices, takes the language the certificate was issued in, not the viewer's locale.
- This is main's existing behaviour, unchanged by CI-1b. Whether the paper should follow the viewer is hers to rule.
