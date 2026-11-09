# Year-end promotion, reconciled with 4.0 (Daisy, 9 Nov 2026)

**Owner approval:** a class-wide promotion with per-learner exceptions, an explicit outcome report, one confirmation and a complete audit.

**Owner rulings added:**
- Every learner has an explicit disposition. Nobody is silently omitted, and nobody is promoted against a recorded departure or repeat decision.
- Teacher assignments for the new year are confirmed explicitly.
- Reuse `period_rollover`, «Pindah kelas» and «Perpindahan murid».

**Read:**
- `period_rollover` (`20261028100000_a_new_year_carries_the_whole_class.sql`, on `claude/system-integrity-4.0` at `8d84e0e1`);
- Konfigurasi «Pergantian tahun ajaran» (`src/app/konfigurasi/page.tsx`);
- Second Eye's list of the 13 demonstrated defects.

**Not read:** the demonstration's `REPORT.md` and its 43 screenshots. They were not in my scratchpad or on any branch, and the attachment did not arrive. This review works from the 13 findings and the code. **I will revise §1 and §2 against the screenshots when I have them.**

**Builds on:** `TINJAUAN-89374424.md` §1 («Akhiri pendaftaran», «Daftarkan kembali», the reason lists, the date, the confirmation, «Jejak audit»).

---

## 0 · What 4.0 does today, in one paragraph

«Pergantian tahun ajaran» is one form:
1. Choose «dari» and «ke» periods.
2. For each Kelas, choose a Kelas or «tidak dinaikkan».
3. Press once.

`period_rollover` closes each mapped Kelas's open memberships (PENDING and ACTIVE learners) with `PERIOD_ROLLOVER` and reopens them in the target Kelas. It writes one audit row with the mapping and returns **one number**.

It does not:
- touch enrolments;
- touch learners placed only in a Tingkat;
- ask anything per learner;
- look at roles;
- check the periods' order or the target's state.

That one number is the whole outcome. That is findings 1–6, 9 and 11 in one sentence.

---

## 1 · The flow: «Kenaikan kelas dan kelulusan»

**One flow replaces the current «Pergantian tahun ajaran» form.** It is not a second system:
- `period_rollover` stays the engine for «naik kelas»;
- «Tinggal kelas» is the same membership move into a Kelas of the new year (the engine of «Pindah kelas»);
- «Lulus», «Berhenti sekolah» and «Pindah ke luar PINTAR / luar negeri» are E3 («Akhiri pendaftaran»), once per learner;
- «Pindah ke sekolah lain di PINTAR» is «Perpindahan murid», not executed here (§1.3).

**Place:** Konfigurasi › Sekolah dan tahun ajaran › «**Kenaikan kelas dan kelulusan**» (the section «Pergantian tahun ajaran» is now).

**Layout:** the existing card grammar; one column on a phone; tables become stacked rows below 640 px, as the topic grid does.

**One page, four steps,** each with the step-list pattern («Langkah 1 dari 4 · …»). The steps are sections of one form, not separate pages, so nothing is half-saved between them. **→ engineering:** whether a draft is kept if the administrator leaves mid-way. My recommendation: not in 4.0, and the page says «Belum disimpan sampai Anda mengonfirmasi».

### Step 1 · «Tahun ajaran» (findings 4, 10)

- **Fixed source:** «**Dari** 2026/27 (tahun ini)». The current period, not a free choice.
- **Target:** «**Ke**», listing only periods that **start after** the source. Each is labelled with its dates: «2027/28 · 14 Jul 2027 – 20 Jun 2028».
- **If no later period exists,** the step stops with a «not yet» line and a link:

  > «Belum ada tahun ajaran sesudah 2026/27. Buat dulu tahun ajaran 2027/28 dan Kelas-nya di **Struktur sekolah**.»

**Readiness checks,** shown as the existing «Persiapan sekolah» rows («Sudah / Belum»):
- «Kelas tahun 2027/28 sudah dibuat · 8 Kelas aktif»;
- «Batas ketuntasan tahun 2027/28 sudah ditetapkan» (or «Belum: guru belum dapat menyediakan paket»).

**The «Belum» checks block nothing in this flow;** they say what will be missing afterwards. Only a missing target period, or a target with no active Kelas, blocks.

### Step 2 · «Kelas dan murid» (findings 2, 5, 6, and the owner's «nobody silently omitted»)

**One block per source Kelas** («5B · 2026/27 · 24 murid»), with a class-level choice:
- «Semua naik ke», listing only **active** learners' Kelas of the target year, each with its year: «6B · 2027/28» (finding 4, finding 10's labels);
- for the top grade: «**Semua lulus**».

**Beneath it, every learner as a row:**
- name, registration number, and a **disposition** select defaulting to the class choice;
- the choices: «Naik ke 6B · 2027/28» · «**Tinggal kelas**» (then a Kelas of the same grade, target year: «5C · 2027/28») · «**Lulus**» (top grade) · «**Pindah ke sekolah lain di PINTAR**» · «**Pindah ke sekolah di luar PINTAR**» · «**Pindah ke luar negeri**» · «**Berhenti sekolah**»;
- the last four reasons, and «Lulus», open the reason list's date and «Jelaskan singkat» where needed, **in place** (the fields from `TINJAUAN-89374424.md` §1.3–§1.4).

**Learners placed only in the Tingkat** («Tingkat 5 · 2026/27») get **their own block**, never skipped: «**3 murid** tercatat di Tingkat 5 tanpa Kelas». They have **no default**: each needs a choice before the form can continue (finding 2).

**Recorded decisions win over the default** (the owner's ruling):

| Learner's state before the run | Their row |
|---|---|
| Enrolment already ended | Not offered. Shown greyed: «Sudah keluar 3 Jun 2026 · Pindah ke luar negeri», no select |
| A transfer requested in «Perpindahan murid» and not yet executed | Locked to «Menunggu perpindahan ke SD Harapan», never «Naik» |
| PENDING (recorded, not yet signed in) | Treated like ACTIVE, as `period_rollover` already does; a small label «belum pernah masuk» |

**«Tinggal kelas»** has no earlier record in 4.0, so this step is where it is recorded. A change from the class default to «Tinggal kelas» is shown at the row: the select turns to the exception style, with a left rule, the same as the reports' marked rows.

**The «not chosen» guard:**
- «Lanjut ke pemeriksaan» is **disabled until every listed learner has a disposition**;
- the sentence before it says how many lack one, and is tied by `aria-describedby`: «**3 murid belum punya keputusan**: Dedi, Eka, Fajar (Tingkat 5).»

### Step 3 · «Guru tahun 2027/28» (finding 11, the owner's «never carried silently»)

**One row per target Kelas:**
- «**6B · 2027/28** · Belum ada guru»;
- with last year's teacher of the source class offered **unticked**: «☐ Jadikan **Pak Yusuf Hidayat** (Guru 5B tahun lalu) Guru 6B · 2027/28».

**What carries over and what doesn't:**
- **Nothing is ticked by default.** A target Kelas left without a teacher is allowed. The review and the outcome name it: «6D belum punya guru».
- **Roles over a department or the school** (Kepala departemen, Dekan, Admin) are not year-bound. A quiet line lists them as unchanged: «Peran di departemen dan sekolah tetap: Bu Sari (Kepala departemen Matematika) …». **→ Sharon:** confirm which roles are year-bound.
- **A teacher whose employment ended** («Akhiri di sekolah ini») is never offered.

### Step 4 · «Periksa dan konfirmasi» (finding 3)

**A summary in counts, then the exceptions by name:**

> **Kenaikan kelas 2026/27 → 2027/28 · SD Cendekia Nusantara**
> 118 murid naik kelas · 30 murid lulus · 2 murid tinggal kelas · 1 murid berhenti sekolah · 1 murid pindah ke luar negeri · 1 murid menunggu perpindahan
> Pengecualian: Ani Lestari (tinggal kelas, 5C) · Budi Santoso (menunggu perpindahan ke SD Harapan) · …
> Guru: 6 peran guru akan diberikan · 2 Kelas belum punya guru (6D, 6E)

**One confirmation** (the `KonfirmasiBahaya` layout, with a primary confirm, since nothing is destroyed and every end is restorable):

> **Jalankan kenaikan kelas untuk SD Cendekia Nusantara, 2026/27 → 2027/28?**
> 153 murid diproses: 118 naik, 30 lulus, 2 tinggal kelas, 2 keluar, 1 menunggu perpindahan. 6 guru diberi peran di Kelas tahun 2027/28. Pendaftaran yang diakhiri dapat dikembalikan satu per satu dengan «Daftarkan kembali». Semua tercatat di Jejak audit.
> [Batal] [**Ya, jalankan**]

**→ Sharon:** the run is one transaction, or nothing changes. The outcome report then states either what happened or that nothing did.

---

## 2 · The outcome report (finding 1)

**Placement.** Shown on the same page after the run, in the existing result-line position and expanded into a report. It stays reachable afterwards from «Jejak audit» (the run's row) and from the section («Kenaikan terakhir: 20 Jun 2026, 09.12 WIB · lihat hasilnya»).

**Form.** One heading line, then one block per disposition: a count sentence with the names beneath, collapsed beyond 10 («dan 108 lainnya», expandable). It is printable with the report print grammar; in 4.1 it gets the C6 footer.

| Disposition | Indonesian | English |
|---|---|---|
| Heading | «✓ Kenaikan kelas 2026/27 → 2027/28 selesai pukul 09.12 WIB, oleh Bu Wulan Prasetyo.» | «✓ The 2026/27 → 2027/28 promotion finished at 09:12 WIB, by Bu Wulan Prasetyo.» |
| **Naik kelas** | «**118 murid naik kelas.** 5A → 6A · 2027/28: 29 murid · 5B → 6B: 23 murid · …» (each class expands to names) | «**118 students moved up.** 5A → 6A · 2027/28: 29 students · …» |
| **Tinggal kelas** | «**2 murid tinggal kelas:** Ani Lestari (5C · 2027/28), Dimas Pratama (5A · 2027/28).» | «**2 students are repeating the year:** …» |
| **Lulus** | «**30 murid lulus** dari Kelas 6. Pendaftaran mereka berakhir dengan alasan «Lulus»; hasil dan sertifikatnya tetap dapat mereka buka.» | «**30 students graduated** from Kelas 6. Their enrolment ended as «Graduated»; they can still open their results and certificates.» |
| **Keluar** (outside PINTAR, abroad, left school) | «**2 murid keluar:** Citra Wibowo (pindah ke luar negeri, 20 Jun 2026), Eka Rahayu (berhenti sekolah, 18 Jun 2026). Pendaftarannya diakhiri; riwayatnya tetap tersimpan.» | «**2 students left:** … Their enrolment ended; their records are kept.» |
| **Menunggu perpindahan** | «**1 murid belum dinaikkan** karena menunggu perpindahan: Budi Santoso, ke SD Harapan. Perpindahannya diselesaikan di **Perpindahan murid**.» | «**1 student was not moved up** because a transfer is waiting: … It is completed under **Student transfers**.» |
| **Tidak diproses** (a row refused at run time, e.g. ended in between) | «**1 murid tidak diproses:** Fajar Nugroho; pendaftarannya sudah berakhir pada 19 Jun 2026. Tidak ada yang diubah untuknya.» | «**1 student was not processed:** …; nothing was changed for them.» |
| **Guru** | «**6 peran guru diberikan** untuk 2027/28: Pak Yusuf Hidayat → Guru 6B, … **2 Kelas belum punya guru:** 6D, 6E. Beri perannya di **Peran & akses**.» | «**6 teacher roles given** for 2027/28 … **2 classes have no teacher yet:** … Give the role under **Roles & access**.» |
| **Langkah berikutnya** | «Kartu kelas tetap berlaku / perlu dibuat ulang untuk Kelas baru di **Aktivasi**», and «Batas ketuntasan 2027/28 di **Batas ketuntasan**», each only if it applies | — |

**The kartu kelas line depends on whether a card is per Kelas or per learner. → Sharon / engineering;** the wording follows the fact.

**When nothing was changed:**
- **Nothing to do** (every Kelas already rolled): «Tidak ada murid yang perlu dinaikkan dari 2026/27; semua sudah diproses pada 20 Jun 2026.» No audit row (finding 12).
- **Refused as a whole:** «Kenaikan kelas tidak dijalankan: {alasan}. Tidak ada yang diubah.»

---

## 3 · How it joins «Akhiri pendaftaran» and «Daftarkan kembali»

- **One function, one reason list, one record.** «Lulus» and the three «keluar» dispositions are **E3, once per learner**, with the same reason codes, the same «tanggal kejadian» and the same «Jelaskan singkat». So a graduation at year end and a mid-year withdrawal read identically on the person's record and in «Jejak audit». The run adds only a link: «bagian dari Kenaikan kelas 2026/27 → 2027/28».
- **The same lists afterwards.** Every ended learner appears in «Murid yang sudah keluar» with «Daftarkan kembali». A wrong «Lulus» or «Berhenti sekolah» is corrected there per learner, with «Membatalkan pencatatan yang keliru». A wrong «Naik ke 6B» (should have repeated) is corrected with «Pindahkan» in «Murid di kelas».
- **Never a second batch.** There is no «undo the whole run». A run is many facts, and each is corrected as itself, which keeps «Jejak audit» readable.
- **Departed learners stay departed (finding 8).** A learner whose enrolment ended **by transfer** (or by E3) is never offered in «Murid yang belum punya kelas» or in «Pindahkan». They appear only in «Murid yang sudah keluar», with «Daftarkan kembali», which is governed and audited. The sending school cannot quietly re-place a learner who now belongs to another school. **→ Sharon:** the database refusal behind it.
- **«Perpindahan murid» (finding 10):**
  - the other school shows its **name** («SD Harapan»), never «—»;
  - every Kelas picker in Konfigurasi carries its year («6B · 2027/28»), the same label everywhere.

---

## 4 · «Jejak audit» for a run (finding 12)

- **One parent row:**

  > «20 Jun 2026, 09.12 WIB · **Bu Wulan Prasetyo** (Admin sekolah) · **Kenaikan kelas** 2026/27 → 2027/28 · 153 murid: 118 naik, 30 lulus, 2 tinggal kelas, 2 keluar, 1 menunggu · 6 peran guru»

  It expands to its children, one per learner with a non-default disposition and one per role granted. Each child reads exactly as the single action would (`TINJAUAN-89374424.md` §1.5).
- **No row for a no-op.**
- **A refused run:** a row with the outcome «ditolak» and the reason, when the refusal is an administrator's attempt, not a validation the form already prevented. **→ Sharon**, because what counts as «significant» is C5's rule.

---

## 5 · What is 4.0-essential, and what can wait

**Essential:** without these, a school either cannot close its year correctly or its records mislead.

| # | Finding | Why essential |
|---|---|---|
| 1 | Named outcome per disposition | The administrator cannot check what happened. The owner asked for explicit outcome reporting |
| 2 | Tingkat-only learners get a block and a required disposition | Silent omission is ruled out |
| 3 | Review and one confirmation | A one-press, school-wide, irreversible-in-practice act |
| 4 | Only later periods and only active Kelas offered | Prevents moving a class backwards or into a closed Kelas |
| 5, 6 | «Tinggal kelas», «Lulus», «Berhenti / Pindah ke luar» per learner (via the existing move and E3) | Ruled: every learner has a disposition. Graduation cannot happen otherwise |
| 8 | A departed learner cannot be re-placed by the sending school | Authorization (Sharon) |
| 9 | Enrolments follow the new year | **→ Sharon:** essential if any reader keys on the enrolment's period (eligibility, reports). The screens assume the learner's year is the new one |
| 11 | Teacher roles for the new year, explicitly | Otherwise every new Kelas starts with no teacher and no one can teach, or authority would carry silently. Both are ruled out |
| 12 | Actor and reason in «Jejak audit»; no-op not audited | E7, already essential |

**Small, and best done in the same pass:**
- **Finding 10:** the other school's name, and year labels on every Kelas picker.
- **Finding 13:** «Batas ketuntasan» lists PINTAR Library packages, marked «Pustaka PINTAR». Without it, a school that uses the Library cannot set the mark, and teachers cannot provide those packages. That blocks a workflow, so treat it as essential if the Library is offered to schools in 4.0, which «Pustaka PINTAR untuk sekolah Anda» in Studio suggests.

**Already done:** finding 7 (the direct-update workaround is closed). Nothing in the flow relies on it.

**Can wait (4.1):**
- a saved draft of a half-completed run;
- printing the outcome with the C6 footer (the print grammar already applies);
- starting a PINTAR transfer from inside the flow (4.0 marks it «menunggu perpindahan» and links to «Perpindahan murid»);
- suggestions beyond last year's teacher.

---

## 6 · States, collected

| State | What shows |
|---|---|
| No later period | Step 1 stops: «Belum ada tahun ajaran sesudah 2026/27 …» with the Struktur link |
| Target period has no active Kelas | Step 1 stops: «Tahun ajaran 2027/28 belum punya Kelas yang aktif. Buat Kelas-nya di Struktur sekolah.» |
| Some classes already rolled | Their blocks are shown closed: «5A · sudah dinaikkan ke 6A pada 20 Jun 2026», with no select |
| Learner without a disposition | «Lanjut ke pemeriksaan» disabled; the count and names before it |
| A learner ended between review and run | «Tidak diproses» in the outcome; nothing changed for them |
| Run refused as a whole | «Kenaikan kelas tidak dijalankan: … Tidak ada yang diubah.» |
| Nothing to do | «Tidak ada murid yang perlu dinaikkan …»; no audit row |
| Phone width | Each learner row stacks: name and number, then the select; the summary and the outcome are lists, not tables |

## Not seen

- **The demonstration's screenshots** (see the top of this review).
- **Any built screen** of this flow.
- **Staging.**
- **Screen readers.**
