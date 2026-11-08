# PINTAR 4.0 · Final Experience Readiness Report (Daisy, 8 Nov 2026)

**Engineering commit reviewed:** `claude/awesome-rubin-bqxp6p` at **`14361bda`**. Its `src/` is that of `2be7a796`, «Daisy's verification (7ea99f35) F1–F10: corrections».

**Earlier reports:** `KESIAPAN-4.0.md`, `KESIAPAN-B-TRIASE.md`, `KESIAPAN-VERIFIKASI.md`.

## Evidence and its limits

**The real application.** The candidate was built (`next build`) and served (`next start`) on my own local Supabase stack, with every migration and the synthetic seed (Sekolah Sintetis Alpha). I signed in as its admin, Guru, Kepala departemen and Dekan.

**What I pressed, through PINTAR's own buttons:**
- **Admin:**
  - Kode sekolah;
  - a natural class list, with no class and then with 5A;
  - approval, done page and Aktivasi.
- **Guru:** Studio upload of the synthetic chapter, through «Susun isi», «Periksa isi» and «Ajukan» to «Setujui isi».
- **Reviewer:** Studio home and the package.
- **Both:** /akun's destructive opener.
- **Second Eye's walk** `audit/siap-jalan.mjs`: 7/7 PASS on this build, including keyboard R4 and R7.

**Rendered from this commit's components:** Ringkasan Kelas, the topics × classes grid (5 and 10 classes) and Ringkasan Sekolah, at 1280, 390 and 320 px and A4, with axe. The local seed has no below-target data and no grid, so these figures were rendered, not reached through a sign-in.

**Not seen:**
- staging, which still runs `c4944fab`;
- NVDA or TalkBack;
- the content-check *error* path of F8 (code read; my workbook was clean);
- the Studio, Kanonik and maintenance withdrawals pressed live (they share `KonfirmasiBahaya`, pressed live on /akun).

## 1. A findings

| # | Status | Evidence |
|---|---|---|
| A1 Class-list import | **Closed** | «Kelas» is never guessed (Tempat stays «Tidak dipakai»); the page shows the format and an example. **Without a class,** «Lanjut ke pemeriksaan» is disabled and the page says why and how to fix it: «2 baris belum punya kelas. Murid tanpa kelas bisa masuk, tetapi tidak menerima materi apa pun. Untuk daftar murid, pilih kelasnya pada Tempat…». A staff list has its own choice, «Ini daftar guru atau staf: catat tanpa kelas». **With 5A,** the check, approval and done page complete. Choosing the «Kelas» column gives the actionable row sentence. Checked at 1280, 390 and 320 px |
| A2 Guru → Ringkasan Kelas | **Closed** | «Ringkasan Kelas» on the class page; the report opens with «← Mengajar» (R1, at 1280 and 390 px) |
| A3 Lesson table by keyboard | **Closed; screen reader open** | Verified on `f2a52a5a` (same `Teks.tsx` and `.pin-ttabel` here): the table is reached by Tab, shows a 2 px ring, and ArrowRight / End scroll it to its last column at 390 and 320 px |

## 2. Walkthrough-critical B findings

| # | Status | Evidence |
|---|---|---|
| B1 Studio waiting state | **Closed** | The author reads «Menunggu orang lain — «Setujui isi» diambil oleh Kepala departemen atau Admin sekolah… PINTAR tidak mengirim pemberitahuan». The list row says «Menunggu orang lain». The reviewer's home shows «Menunggu tinjauan Anda 1». The reviewer's package page now offers only «Setujui isi», without the old competing reasons (F4) |
| B2 Role before activation | **Closed** | Peran & akses and Aktivasi state the order; the hints are present (R3) |
| B3 Pendataan onward | **Closed** | «✓ Kode sekolah tersimpan.» confirms the code; without one, the page says to save it first. The done page lists «Langkah berikutnya»: Peran & akses, then Aktivasi |
| B4 Destructive confirmation | **Closed** | The opener is `pin-btn pin-bahaya` (red text, `#8c3b3b`) and the act is the filled red confirm. «Batal» is quiet and takes focus; nothing is sent until confirmed (R4, keyboard) |
| B5 A4 grid | **Closed** | 10 classes on one landscape page; 5 classes on one portrait page |
| B6 Explain once | **Closed** | No value draws its words (all are `pin-sr`); one legend per figure |
| F5–F7 Principal action | **Closed** | Primary buttons now on: «Simpan kode», «Lanjut ke pemeriksaan» and «Ya, catat orang-orang ini» in Pendataan; «Buat kartu kelas» on a learner's row in Aktivasi; after a passed check, «Simpan ke Studio» alone |
| F8 Content-check integrity | **Closed (clean path live; error path by code)** | «Tandai lolos pemeriksaan» runs `validate_course_content` and `run_mcq_quality` itself; an open ERROR holds the step (`CONTENT_CHECK_ERRORS`) |
| F9 Terminology | **Closed** | The upload's result reads «Paket 1 · Bab 1 · Pelajaran 4 · Soal 18» |
| F10 Honest Studio home | **Closed as mitigated** | «Hitungan di atas belum mencakup paket yang sudah disetujui atau sedang dibuat terbitannya. Lihat daftar paket di bawah…». The full count (W1.16) still needs its migration; the owner should know |

## 3. New regressions

**None found.** The F3 regression (the grid page scrolling sideways on a phone) is fixed: Ringkasan Kelas, the grid at 5 and 10 classes, and Ringkasan Sekolah all measure exactly 390 and 320 px.

## 4. Cross-application design consistency

The journeys walked answer the five questions at every step:
1. **Where am I?** The shell, the context block, the scope line and back links named by their destination.
2. **What is done?** Result lines, «✓ Kode sekolah tersimpan», the done page, step marks.
3. **What remains?** «Yang menunggu», «Langkah berikutnya», the named steps.
4. **What can I do now?** One primary action per view on the corrected paths.
5. **What happens next?** Each step's panel; the confirmation's question.

The application speaks one grammar on these journeys. Deferred inconsistencies, each with a usable existing path:
- C2: Konfigurasi row results;
- C5: three step-list styles;
- C6: form-label and error-slot plumbing;
- C7: type outside the design tokens.

## 5. Mobile and A4

- **Screen, 390 and 320 px:** every page walked and every report rendered stays within the screen; wide tables scroll inside focusable, named regions.
- **A4:** reports print with their header, no navigation and «explain once»; the wide grid prints landscape on one page.

## 6. Accessibility

- **Shown by keyboard:** A3, B4 and Struktur's in-place panels (focus in, focus back).
- **axe:** clean on every rendered report.
- **Outstanding (human, NVDA / TalkBack):**
  - A3: the region announced by its headers;
  - B4: the question on open;
  - B6: amber values heard with their words;
  - C6: the browser's required bubble;
  - **new, minor:** the disabled «Lanjut ke pemeriksaan» is not tied by `aria-describedby` to the sentence explaining why. The sentence comes just before it in reading order.
- **Not recorded:** the human journeys H1–H20.

## 7. Remaining usability defects

**Material: none.** Minor (C), may follow:
- the «Periksa isi» panel still says «Jalankan pemeriksaan … lalu tandai», although the mark now runs the check;
- «PINTAR tidak mengirim pemberitahuan» is said twice on the author's waiting page;
- the disabled-button description above;
- the hint about a *person's* registration number sits under the school-code field;
- the lesson table has no cue that more columns lie to the right.

## 8. Verdict

**READY for the owner's unscripted walkthrough, on the corrected candidate `14361bda`, under one condition and with two notes.**

**Condition:** this commit, not `c4944fab`, is what staging serves. Promotion is the owner's decision under the protected gates. After promotion, a short signed-in pass on staging should repeat A1 (both paths), B1 (author and reviewer) and a report at 390 px, because staging's data shapes differ from the synthetic school.

**Notes:**
1. **The owner should know W1.16:** Studio home does not yet count approved or freezing packages; the page now says so.
2. **The screen-reader checks in §6 remain human work.** Automated success is not human acceptance.

## Next steps, if this session ends

1. **Second Eye:** exact-commit CI and journeys on `14361bda`, then the owner's promotion decision.
2. **On staging after promotion:** the signed-in pass above (Daisy or Second Eye).
3. **Human assistive-technology pass:** `SCREEN-READER-SCRIPT.md` S1–S8, items in §6.

**Rebuild the local verification:**
1. `dockerd`, then `npx supabase start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta`.
2. `next build && next start -p 3999`, with the CI environment from `.github/workflows/audit-journeys.yml`.
3. `audit/siap-jalan.mjs`.
