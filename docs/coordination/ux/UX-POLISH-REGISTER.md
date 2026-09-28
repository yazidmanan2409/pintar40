# UX Polish Register (5 Oct internal test, D-050)

Short, evidence-based and **non-blocking**: wording and small interaction problems a tester will meet, found while proving the staging journey (28 Sep) or by Daisy reading the same screens. Nothing here is a redesign. A problem that stops a person is a **defect** and goes to the board, not here.

**Classes:** W = wording, U = interaction/UX. **Evidence:** a staging run of `staging · learning journey (D-050)` (the journey harness, `audit/staging/journey.mjs`), or a source line when the screen was not reached on staging yet (marked *source only*).

| # | Where | What a person meets | Evidence | Class | Small change proposed | Owner |
|---|---|---|---|---|---|---|
| UX-01 | Studio → paket → **Masalah** (the question check) | The question check first runs at **Kunci terbitan**. The reviewer presses **Setujui isi** with nothing to review, then meets 33 warnings for SD 5 Bab 1 and must press **Sudah saya tinjau** 33 times, one page reload each, before **Terbitkan** is allowed. 28 of the 33 are the same kind (WEAK_MISCONCEPTION_LINKAGE: the workbook gives no misconception codes). | Staging runs 2 and 4: 0 findings before approval; 33 created at the lock (4 IMPLAUSIBLE_DISTRACTOR, 28 WEAK_MISCONCEPTION_LINKAGE, 1 ANSWER_POSITION_SKEW). | U | Run the check when the author presses **Tandai lolos pemeriksaan**, so the findings are there before **Setujui isi**; group the list by kind with a count. | Bob (when the check runs), Daisy (grouping) |
| UX-02 | Studio → **Bank Soal** | Every question reads "Belum cukup bukti untuk menilai soal ini." (28 of 28) beside an 8-character code; there is no search, filter, or way to open or change a question. A teacher asked to "manage MCQs" finds nothing to act on here. | Staging run 2, Q1 and Q2 (teacher and admin). | W, U | Say once, at the top, what this page is for in this phase and that questions are changed by uploading a corrected workbook; drop the per-question line until there is evidence to show. | Daisy |
| UX-03 | Mengajar → kelas → **Uji Cepat** | Any refusal reads "Sudah ada Uji Cepat yang berjalan di kelas ini…", whatever the cause (too few questions, a number out of range). | *Source only:* `src/app/mengajar/actions.ts:124` sends every error to `?cepat=gagal`, which shows `mengajar.cepat.sudah_ada`. | W | Show the general "Belum tersimpan… Kode rujukan" line for any other cause. | Daisy |
| UX-04 | Studio → **Aturan Penilaian** | The school picker is labelled "Peran & akses". | *Source only:* `src/app/studio/definisi/page.tsx:59` uses `config.section.roles`. | W | Label it "Sekolah". | Daisy |

## How entries are added

One row per problem, with the run or source line that shows it. Daisy's reader walk of the same staging screens adds rows here. Anything that stops a person moves to the board as a defect.
