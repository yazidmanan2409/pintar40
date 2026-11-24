# D2-R · Rendered review, 1f (Daisy, 24 Nov 2026)

> **What holds now:**
> - **PASS once C-1 lands and CI is green.** One required correction, which is small. Everything else is as written in `D2R-KATA.md` §1–§8.
> - **Read:** a local build of `claude/d2r` at `42f6f432`, with a local database reset, and the synthetic report world (`audit/fixtures/laporan-lokal.mjs`).
>   - **Learners:** one (5B) with a «Belum lulus» Uji Penguasaan in Bab 1 and a «Lulus» in Bab 2; another (5B) with Pemetaan Awal done and the lessons unread.
>   - **Widths and checks:** 1280, 390 and 320 px; the keyboard order on the result pages; ID and EN.
> - **The night date:** tested by moving the one local certificate's `issued_at` and `issued_at_iso` to 18:30 UTC (01:30 WIB the next day), then restoring them. This was on the disposable local database only.
> - **Captures:** `d2r-layar-42f6f432/`.

## 1 · What holds

| Check | Seen |
|---|---|
| **R-h, «Belum lulus»** | In order: «Belum lulus.» with `hasil.belum_lulus_arti` → «Baca lagi:» with two sections (each a link) → the §6 advice note → `hasil.ulang_boleh` → «5 dari 8 soal dijawab tepat · Kesempatan ke-1» → §8's «Pada Uji Penguasaan, jawaban yang tepat dan hasil tiap soal tidak ditampilkan.» No percentage, no per-question row, no «dikuasai». EN matches word for word |
| **R-h, «Lulus»** | «Lulus.» with `hasil.lulus_arti` → the counts and «Kesempatan ke-1» → the §8 line. But the certificate step is missing: see C-1 |
| **«Perubahan dari Pemetaan Awal»** | **Not drawn, and I confirm that was my intent.** §3 gives a certifying result no mastery figure (ruling 74a: qualitative first). A before-and-after percentage would bring the figure back. Whether `learning_delta` should also withhold `akhir` is for Sharon |
| **Keyboard** | The skip link → the header → «← Perjalanan belajar Anda» → each «Baca lagi» link → «Apa berikutnya →». Nothing is unreachable, and there are no stray stops |
| **R-g** (`d2r-bab-siap-390`) | «Mulai pelajaran» first, then «Uji Penguasaan sudah dapat dikerjakan. Sebaiknya baca semua pelajaran lebih dulu.» and «Mulai Uji Penguasaan». The tone is neutral |
| **No-help line** (`d2r-uji-mulai-390`) | «Selama Uji Penguasaan, petunjuk, contoh, dan arah berpikir tidak tersedia.» sits directly after `posttest.intro`. The STANDALONE line (`posttest.tanpa_bantuan_umum`) is not rendered here, because the world has no certifying Asesmen Mandiri. I accept it on D2R-W01's word-for-word check |
| **R-a, R-b, R-13** (`d2r-a4-1280`) | «SERTIFIKAT»; the R-b sentence with «Materi Pembelajaran:», broken at `{kursus}` (`pin-done` and `pin-course`), with no overflow. The sheet is exactly 794 × 1123, one A4 page |
| **Night-issued date** | 01:30 WIB on 25 Nov reads **25 November 2026** on the card, on the A4 sheet, in the admin table («25 Nov 2026») and on `/verifikasi`. All four agree |
| **R-c, no Predikat** | Absent from the card, the sheet, «Sertifikat Anda», the admin table and `/verifikasi` |
| **`/verifikasi`** (`d2r-verifikasi-390`) | «Berlaku … HASIL Lulus», the issuer and the date. It matches the result and R-b |
| **Admin column** (`d2r-admin-sertifikat-1280`) | «Materi Pembelajaran», so the certificate and the admin table use one name |
| **Overflow** | 0 px sideways at every width on every page above |

## 2 · Required correction

**C-1 · A «Lulus» result does not lead to the certificate.**
- **What happens:** §3's step 2 for «Lulus» is the certificate. The page draws nothing there. The learner sees «Lulus.», the counts and «Apa berikutnya →», and is not told that a certificate is ready. The certificate is one page further on (`/lanjut` → «Lihat sertifikat»).
- **Why it matters:** this is the result the whole chapter leads to. Ruling 81's third question, «is the next step clear?», fails at the moment of passing.
- **Fix:** on «Lulus», directly after the decision banner, draw a link to `/belajar/{tugas}/sertifikat` with the existing `siklus.lihat_sertifikat` label. No new words are needed. It belongs on the chapter result page and on the Hasil Belajar row.
- **Not affected:** the «Belum lulus» order, which is complete.

## 3 · Notes (not D2-R's, not blocking)

- **N-21 · «Matematika · Matematika Kelas 5 · Bab 2: Data Sederhana».** The subject is printed before a course title that already starts with the subject. It comes from `course_subject_as_issued` plus the title, so it predates D2-R and is data-shaped (the seed's titles). It is for the ruling 79 audit (J2), not this build.
- **The teacher's sittings screen** does not draw `percobaan_ke` yet, as the hand-off says. When it does, the word is «Kesempatan ke-{n}» (T-08).

## 4 · Anticipation

**No Daisy defect.** One near miss: my first night-date test moved only `issued_at`. That made the admin table and the card disagree, a mismatch I had created myself. I caught it before recording it, and re-tested with both stored times.
