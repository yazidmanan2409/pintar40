# «Kenaikan kelas dan kelulusan» as built, reconciled with the approved flow (Daisy, 9 Nov 2026)

**Evidence:** `docs/completion-4.0/acceptance/evidence/kenaikan-kelas-2026-11-09/dibangun/` on `claude/system-integrity-4.0` at `48241e2c`:
- shots 1–4 and 6–8 (synthetic data, Alpha's Admin sekolah, 1280 px; shot 7 at 390 px);
- the README, with its two post-shot fixes (the teacher list on one line; a departure's outcome repeating «Keluar»).

**Compared against:** `TINJAUAN-KENAIKAN-KELAS.md` (approved by the owner) and `TINJAUAN-89374424.md` §1.

**Limits:**
- Read from screenshots only. I did not press anything.
- Accessible names, focus and the «Lainnya» explanation field are therefore **not seen**.

## The three questions

### 1 · One decision per learner, from a native dropdown: clear enough for 40?

**Yes, the control is right:** a native `select` is the most robust choice for keyboard, screen readers and phones, and it is the pattern every other Konfigurasi row uses. What makes 40 rows hard is not the control but four things around it:

1. **Exceptions do not stand out** (shot 3). Citra's «Tinggal kelas» and Dimas's «Keluar» look exactly like «Naik ke Kelas 6A». With 40 rows, two exceptions are lost.
   - **Fix:** a row whose choice differs from «Naikkan semua ke» gets the exception style (left rule plus a quiet label «Pengecualian»). That is the reports' marked-row pattern.
2. **No running count.** The page says «6 murid. Setiap murid perlu satu keputusan…», but never how many are still undecided.
   - **Fix:** a status line above the list that updates as choices are made, with `role="status"`:

     > «38 naik ke 6A · 1 tinggal kelas · 1 keluar · **0 belum dipilih**»

   - «Tinjau hasil» stays disabled while anyone is undecided. The line is its `aria-describedby`, and it names the undecided when there are 5 or fewer.
3. **The bulk choice fills the Tingkat learner too** (shot 3: Fajar, «Di Tingkat, belum di kelas», ends as «Naik ke Kelas 6A»). The approved flow gives Tingkat-only learners **no default**: they were never in 5B, so «naik bersama 5B» is a guess.
   - **Fix:** «Terapkan» fills only learners of the chosen Kelas. It skips Tingkat-only learners and anyone with a recorded departure or pending transfer.
4. **The options list will be long** (every next-year Kelas, a repeat Kelas, each departure reason, «Lulus»).
   - **Fix:** group it with `optgroup`: «Naik» · «Tinggal kelas» · «Lulus» · «Keluar» · «Pindah ke sekolah lain di PINTAR». Every option carries the Kelas **with its year**: «Kelas 6A · 2027/28», never «Kelas 5A (tahun depan)».

**Also check:**
- **The accessible name.** Each row's select must be named with the learner: «Keputusan untuk Ayu Lestari». Otherwise a screen-reader user hears «— Pilih —» 40 times. Not visible in a screenshot. **→ engineering.**
- **«Terapkan» as a separate press** is acceptable: explicit, and nothing is filled by surprise. Its result should be announced: «Diterapkan ke 38 murid; 2 tidak diubah karena sudah dipilih atau di Tingkat.»

### 2 · Should the review group outcomes, with a count for each?

**Yes.** That is the approved design: «counts, then the exceptions by name». Shot 4 is one flat table in roster order, which at 40 rows makes the reviewer read every line to find the two that matter.

**Composition** (replaces the flat table; same card):

> **Kelas 5B · 2026/27 → 2027/28** · Belum ada yang berubah.
> **36 naik ke Kelas 6A · 2027/28** · **2 naik ke Kelas 6B** · **1 tinggal kelas** · **1 keluar**
>
> **Pengecualian** (always open):
> - Citra Dewi · tinggal kelas di Kelas 5A · 2027/28
> - Dimas Saputra · keluar: pindah ke sekolah di luar PINTAR · tanggal kejadian 9 Nov 2026
> - Eka Rahmawati · naik ke Kelas 6B · 2027/28
> - Fajar Nugroho · dari Tingkat 5 (belum di kelas) · naik ke Kelas 6A · 2027/28
>
> **Naik ke Kelas 6A · 2027/28 (36)** (collapsed; opens to the names)

**Order of the groups:** Pengecualian first (anything not the class's main choice, and every Tingkat-only learner), then the main group, collapsed. Nothing is hidden: every name is one press away, and the count is visible.

**The confirmation sentence** goes directly above «Konfirmasi kenaikan kelas» and repeats the counts:

> «40 murid akan diproses: 38 naik, 1 tinggal kelas, 1 keluar. Semuanya diterapkan bersama atau tidak sama sekali.»

**Teachers** (shot 4, «Penugasan guru»):
- **The honesty is right:** «tidak ikut pindah», no silent carry-over. Three corrections:
  1. **List only the destination Kelas** (6A, 6B, 5A of the new year). «Kelas 5B: belum ada guru» is this year's class and does not belong in a review of next year.
  2. **The checkbox must say what is being acknowledged,** not only that the reviewer looked:

     > «☐ Saya tahu **Kelas 6A, 6B dan 5A · 2027/28 belum punya guru**, dan akan memberikan perannya di Peran & akses.»

     When every destination has a teacher, the box says so instead.
  3. **«Buka Peran & akses» must not lose the decisions** if it leaves the page. Open it in a new tab with that stated («Buka Peran & akses di tab baru»), or keep the draft (my approved note recommended no draft in 4.0). **→ engineering:** which.

### 3 · Is the outcome page's «Sekarang» column what an admin needs?

**The idea is right; the column is not.** Reading each learner's place back from the database is the strongest thing on the page, because it proves the run. But as a column it repeats «Hasil» on five rows of six. On a phone (shot 7) it forces a three-column table into 390 px, wrapping «Naik ke Kelas 6A» one word per line.

**Correction: verify, then say only what differs.**
- **One line under the done message:**

  > «✓ Selesai. 6 murid diproses pada 9 Nov 2026, 19.28 WIB. **Diperiksa dari data PINTAR: semua sesuai.**»

- **If any learner's place does not match its decision,** they lead the page in the warning style, with both values:

  > «**1 murid tidak sesuai:** Fajar Nugroho: keputusan *naik ke Kelas 6A · 2027/28*, tercatat *Tingkat 5 · 2026/27*. Periksa di Murid di kelas.»

- **Then the outcome grouped as in the review** (same groups, same order), with the names. That is the approved outcome wording, per disposition.
- **At phone width,** the groups are lists, not tables.

**One value is wrong today.** Dimas's «Sekarang» reads «**Pindah sekolah**». He did not transfer within PINTAR: his enrolment ended, reason «pindah ke sekolah di luar PINTAR». «Pindah sekolah» is also the phrase for a PINTAR transfer («Perpindahan murid»), so it changes the meaning.
- **Fix:** «Pendaftaran berakhir · 9 Nov 2026 · pindah ke sekolah di luar PINTAR».

**«Kelas 5A (tahun depan)» after the run is wrong by next year:**
- «tahun depan» is relative, and a printed or audited record keeps it after it stops being true;
- always write the year: «Kelas 5A · 2027/28».

**Missing from the outcome** (approved, not built):
- the teacher line: «3 Kelas tahun 2027/28 belum punya guru: 6A, 6B, 5A. Beri perannya di Peran & akses.»;
- «Langkah berikutnya» (class cards, Batas ketuntasan), only where they apply.

## Other findings

| # | Where | Finding | Correction |
|---|---|---|---|
| K1 | Shot 8, «Jejak audit» | **The run is unreadable in the audit.** It writes three low-level rows per learner («Keanggotaan diakhiri», «Keanggotaan kelas», «Keanggotaan dibuat»). **No learner's name** appears in «Sasaran» («Keanggotaan · Sekolah Sintetis Alpha»). «Alasan» is empty on every row, Dimas's departure included. «Keanggotaan kelas» is not an action. The actor column (E7) is right | The approved form: **one parent row per run** («Kenaikan kelas 5B · 2026/27 → 2027/28 · 6 murid: 4 naik, 1 tinggal kelas, 1 keluar»), expanding to **one row per learner** with their name, decision and reason. The membership writes stay in the database's audit, not as the administrator's reading. **→ Sharon:** the row structure |
| K2 | Shots 2–6 | **Two year formats and a wrong level label.** The heading reads «Kelas 5B · TA 2026/2027 · **Kelas 5**»: the third «Kelas 5» is the Tingkat. Everywhere else PINTAR writes «2026/27» | «Kelas 5B · Tingkat 5 · 2026/27». One year format, «2026/27», across Konfigurasi |
| K3 | Shot 1 | **No step indicator.** The flow has three screens (choose, decide, review) plus the outcome, and the approved design used the step-list pattern | «Langkah 1 dari 3 · Pilih kelas» with the existing step list |
| K4 | Shot 1 | **One Kelas per run.** This differs from the approved per-school run, but is acceptable: simpler, and the owner's benchmark is «select the class's learners». It needs one thing the approved design had: Kelas already processed are shown as such in the picker | «Kelas 5A · 2026/27 · sudah dinaikkan 9 Nov 2026», disabled |
| K5 | Shots 3–4 | **The departure's date and «Lainnya» are not visible.** For a year-end run, today's date is right. Confirm that «Lainnya» requires «Jelaskan singkat» (10–300) in place, as approved | **→ engineering:** confirm, or add |
| K6 | Shot 6 | «Pilih kelas lain» is the only way on. After a run, the useful next action is the next Kelas not yet processed | «Lanjut ke Kelas 5C (belum diproses)» as the primary, «Pilih kelas lain» quiet |

## Verdict

**The structure matches the approved flow:**
- a decision for every learner, the Tingkat learner listed;
- a review before anything changes, all or nothing;
- teachers never carried silently;
- the outcome read back from the data;
- the actor in the audit.

**NOT READY on:**
- **the review and outcome grouping** (Q2, Q3);
- **the bulk choice filling the Tingkat learner** (Q1.3);
- **«Pindah sekolah» for a departure outside PINTAR** (it changes the meaning);
- **relative «tahun depan»;**
- **the audit (K1):** no learner name, no reason.

**Small:** the exception styling, the running count, the optgroups, K2–K6.

**Not seen:** accessible names, keyboard order, the «Lainnya» field, the post-shot fixes, the 320 px width, and screen readers.
