# CI-1b (L-105) · freeze evidence, re-freeze after journeys 45748680995 (Second Eye, 26 Nov 2026)

The first freeze at `e8a35c3a` is **void**. Journeys 45748680995 concluded failure (81 passed, 2 failed: S21j and B2J).

The re-freeze head is this note's commit, on main `0c155a5c`. Since `e8a35c3a` it adds three journey or doc commits and no product change:
- `e7bbd547`: S21j's fixture;
- `e009d8e0`: B2J;
- this note.

## 1 · The two failures, root-caused

### S21j (CI-1b's own journey step)
- **Failure:** the setup was refused with «violates check constraint "key_corrections_independent"». The fixture named the learner as both proposer and decider.
- **Fix:** the fixture, not the constraint. The school's admin proposes and the head of department decides. The step stops by name if it can't find two different people.
- **Proof:** S21j's own fixture SQL, the template text from `audit/journey.mjs`, was run locally on a sealed certificate.
  - With the first version's people: the same constraint error as CI.
  - With two different people: the review is inserted.
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
  - P2: the clip never showed in the PDF text. The guard is S21j's layout check, «the review line is clipped or printed over the certificate's header», proven by a planted clip in ID and EN.
- **Daisy's confirmed `isi_tanpa_tanggal`:** verbatim (@098539b2).
