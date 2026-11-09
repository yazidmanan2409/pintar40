# PINTAR 4.1 · early design input (Daisy, 9 Nov 2026)

**Read from** `claude/system-integrity-4.0` at `53ab41fe`:
- `docs/completion-4.1/SCOPE-REGISTER.md`;
- the 4.0 patterns named below (`src/app/experience.css`, `KepalaCetak`, `src/lib/hle.ts`, `pemeliharaan-kontrak.ts`, Konfigurasi «Pemeliharaan», Studio's steps).

**Owner's rule (9 Nov):** reuse the approved 4.0 grammar, and no new pattern where one exists. Every composition below names the pattern it reuses. Where none exists, I say so.

**What this is.** Words and screens only. Mechanisms (C1's controller, C6's reference, C7's scheduling) are Sharon's and engineering's. Points where the design depends on a mechanism are marked **→ Sharon**.

**Images:** `gambar/`.

---

## 1 · C6 · the printed-report footer

**Reuses:**
- `@page laporan` / `laporan-lebar` margin boxes (`experience.css:3774`);
- the A4 header from `KepalaCetak` (top-right: report · place · year);
- «Halaman n dari m» (bottom-right);
- the date helper («9 Nov 2026, 14.05 WIB»).

**Composition** (`gambar/c6-footer.png`, rendered by Chromium from `gambar/c6-mock.html`):
- **Bottom-left margin box**, one line, at the header's type: 7.5–8 pt, `--ink-2`, regular.

  > **ID:** `Dicetak oleh Bu Wulan Prasetyo · 9 Nov 2026, 14.05 WIB · Ref. CTK-7Q4M-2H9X`
  > **EN:** `Printed by Bu Wulan Prasetyo · 9 Nov 2026, 14:05 WIB · Ref. CTK-7Q4M-2H9X`

- **Bottom-right:** unchanged, «Halaman 2 dari 6» / «Page 2 of 6».
- **Every page carries both,** portrait and landscape (`laporan-lebar`).

**Why this form:**
- **Monochrome:** the line is text only (no colour, no icon, no rule), `--ink-2` on white at 8 pt. It stays legible in greyscale (third strip of the image).
- **Never obscures content:** margin boxes live in the 18 mm bottom margin, outside the content area. A long report cannot run into them.
- **Quiet:** same size and colour as the header line, so the page has one frame, top and bottom.
- **The reference** is short, grouped and free of look-alike characters (no 0/O, 1/I/L): «CTK-» plus 8 characters in two groups of 4. Someone can read it aloud over the phone. Administrators find it in «Jejak audit» (C5) by typing it.
- **The time is the print request's,** not the report's. «Angka dihitung …» stays in the report, as now. The zone is the school's (see §6, item 1).
- **The name** is the signed-in person's display name, as on «Masuk sebagai». If it is long, the line keeps the name and time whole and lets the reference wrap. In practice the box holds about 95 characters at 7.5 pt in portrait.

**Not on:**
- **Certificates:** they keep their QR and verification text, as ruled. Their print CSS must exclude the box.
- **The screen:** nothing appears on screen, as with `KepalaCetak`.

**Edge states:**
1. **The request could not be recorded** (no reference). «Cetak laporan» does not open the print dialog, and the action's own result line says so: «Cetakan belum dapat dicatat, jadi belum dicetak. Coba lagi.» / «The print could not be recorded, so nothing was printed. Try again.» This is the existing `AksiLaporan` result-line pattern. **→ Sharon**
2. **The browser's own Print (Ctrl+P).** The page should still print a reference. I propose minting the reference when the page renders and recording it on `beforeprint`, so both ways of printing carry one. If that cannot be made reliable, the footer must say so honestly («Ref. —»), never print an unrecorded reference. **→ Sharon**
3. **The learner's own «Hasil belajar».** The same footer, with their name. That is consistent, and only their own report.

---

## 2 · C7 · scheduled maintenance

**Reuses:**
- Konfigurasi «Pemeliharaan»: its form, its «Periksa waktu ini» clash check, its list with state chips (Terjadwal · Segera dimulai · Berlangsung · Berakhir) and «Akhiri sekarang» / «Batalkan» behind `KonfirmasiBahaya`;
- the banner (`pemeliharaan.pita.*`);
- the pause page (`pemeliharaan.judul`, `.sejak`, `.kira`, `.aman`, `.langkah`);
- the start block (`pemeliharaan.menjelang.*`).

**No second system:** these are the same parts with a scope and a reason list.

### (a) The scheduling form (Konfigurasi › Pemeliharaan, 1280 and 390 px)

Field order follows the existing form; the new fields are marked ★. Everything stacks in one column on a phone (the existing form grammar).

1. **★ Untuk** (radio; replaces «Untuk» = school / platform):
   - «Satu kelas» → a «Kelas» select, listing the school's active learners' and PD Kelas, with the year;
   - «Seluruh sekolah».

   The platform option stays only for a PINTAR Administrator, as today.
2. **Mulai** and **Perkiraan selesai**: the existing fields. The label names the school's zone, not a fixed «WIB» (§6, item 1).
3. **★ Alasan** (radio, required):

   | Indonesian | English |
   |---|---|
   | Pemeliharaan rutin | Routine maintenance |
   | Pembaruan sistem | System update |
   | Perbaikan gangguan | Fault repair |
   | Pemeliharaan jaringan atau listrik | Network or power maintenance |
   | Lainnya | Other |

   «Lainnya» reveals **«Jelaskan singkat»** (required, up to 120 characters, with a character count).

   This replaces today's free «Alasan (dicatat)». The chosen label is what affected users see. A «Lainnya» explanation is shown to them too, so the hint says: «Ditampilkan kepada pengguna yang terdampak.» / «Shown to the people affected.»
4. **Pesan untuk pengguna** (optional): kept as is.
5. **«Periksa waktu ini»:** kept. For a class scope it lists that class's assessments in the window, and says the same thing about them («… asesmen dijadwalkan berlangsung selama periode ini … Pertimbangkan memulai pemeliharaan setelah …»).
6. **Primary:** «Jadwalkan pemeliharaan». The existing result line follows.

**The list row** (existing chips), with two additions:
- the scope: «Kelas 5B (2026/27)» or «Seluruh sekolah»;
- «Dijadwalkan oleh Bu Wulan Prasetyo».

**Actions:**
- «Perpanjang» (new: a «Perkiraan selesai» field and «Simpan»; no confirmation, since it delays rather than destroys);
- «Akhiri sekarang» and «Batalkan», as today.

### (b) The warnings at 60, 30 and 15 minutes (the existing banner)

**One banner, three states,** in the same place as today's `pemeliharaan.pita`. Only the people in scope see it: that class's students and teachers plus the school's administrators, or the whole school.

| When | Tone | Indonesian | English |
|---|---|---|---|
| T−60, T−30 | neutral (`pin-neutral`), closable until the next step | «Pemeliharaan untuk **Kelas 5B** dimulai dalam **60 menit**, pukul 10.00 WIB, karena *pemeliharaan rutin*. Perkiraan selesai pukul 11.30 WIB. Selesaikan dan simpan pekerjaan Anda sebelum itu.» | «Maintenance for **Class 5B** starts in **60 minutes**, at 10:00 WIB, for *routine maintenance*. Expected to end at 11:30 WIB. Finish and save your work before then.» |
| T−15 | warning (amber), not closable | «Pemeliharaan dimulai dalam **15 menit**, pukul 10.00 WIB. **Asesmen baru tidak dapat dimulai lagi.** Asesmen yang sedang Anda kerjakan tetap dapat diselesaikan dan dikumpulkan.» | «Maintenance starts in **15 minutes**, at 10:00 WIB. **No new assessment can be started now.** An assessment you are working on can still be finished and submitted.» |
| Arriving inside the warning | the tone of the current step | the same sentence with the minutes left, e.g. «dalam **23 menit**» | «in **23 minutes**» |

**How it behaves:**
- **Absolute time and minutes left.** The minutes are computed from the stored start time and refresh in place once a minute on the client, so no polling. They are never shown as a running seconds countdown: that adds pressure, and screen readers announce it.
- **Screen readers:** `role="status"`, announced once on arrival and once at each step (60, 30, 15), never every minute.
- **For someone in a running assessment,** the banner keeps the existing second line: «Asesmen yang sedang Anda kerjakan tetap dapat diselesaikan dan dikumpulkan. Pastikan jawaban terakhir sudah «Tersimpan» sebelum mengumpulkan asesmen.»

**A student whose running sitting finishes normally** (the owner's drain ruling). A quiet line at the top of the sitting, not a modal and not amber, from T−60 onwards:

> «Pemeliharaan dimulai pukul 10.00 WIB. Anda tetap dapat menyelesaikan dan mengumpulkan asesmen ini; waktunya tidak berubah.»
> «Maintenance starts at 10:00 WIB. You can still finish and submit this assessment; its time does not change.»

After submitting inside the window, they get the existing «Asesmen Anda sudah terkumpul pukul …», then the pause page.

**A student blocked from starting.** It applies both inside T−15 and when the assessment cannot finish before the window. The «Mulai» button is disabled and tied by `aria-describedby` to the sentence above it (see §6, item 10):

> «**Asesmen ini belum dapat dimulai.** Pemeliharaan dimulai pukul 10.00 WIB, sebelum asesmen ini dapat selesai (waktunya 40 menit). Mulailah setelah pemeliharaan selesai, sekitar pukul 11.30 WIB.»
> «**This assessment cannot be started yet.** Maintenance starts at 10:00 WIB, before this assessment could finish (it takes 40 minutes). Start it after maintenance ends, at about 11:30 WIB.»

This replaces `pemeliharaan.menjelang.arti`'s fixed «Mulai 15 menit sebelum pemeliharaan…», which is not true when the duration is the reason.

### (c) The pause page (the existing «PINTAR sedang dalam pemeliharaan»)

For a class scope, the title names it:
- **ID:** «**Kelas 5B** sedang dalam pemeliharaan»
- **EN:** «**Class 5B** is under maintenance»

For the school, it stays «PINTAR sedang dalam pemeliharaan».

**Lines, in order** (the existing keys, with the reason added):
1. «Dimulai pukul 10.00 WIB, karena *pemeliharaan rutin*. Perkiraan selesai pukul **11.30 WIB**.»
2. A school's «Pesan untuk pengguna», if any (existing).
3. «Apa pun yang sudah tersimpan di PINTAR tetap aman.»
4. «Silakan kembali setelah pukul 11.30 WIB, lalu buka PINTAR lagi.»

**When the time changes:**
- **Extended:** line 1 says «Perkiraan selesai **diperpanjang** sampai pukul 12.00 WIB.»
- **Not yet ready at the end time:** «Pemeliharaan belum selesai. Perkiraan selesai belum ditentukan; buka lagi halaman ini nanti.» This is existing `.kira_belum` plus `darurat.langkah`.

**A teacher of the paused class** sees the same page for that class, and keeps the rest of PINTAR (their other classes).

---

## 3 · C8 · the emergency pause by a PINTAR Administrator

**Reuses:**
- the existing `EMERGENCY` form («Hentikan sekarang», typed phrase, reason);
- `KonfirmasiBahaya`'s grammar (red opener, quiet «Batal» taking focus, filled red confirm);
- the pause page `pemeliharaan.darurat.*`.

**Keep «HENTIKAN SEKARANG»?** **Yes: keep the phrase, and add what it is not enough on its own to show, which is the scope.** The worst emergency mistake is the wrong scope, not a lack of intent. Directly above the phrase field, the form shows an impact sentence that updates with the selection:

> «Anda akan menghentikan seketika: **Kelas 5B · SD Cendekia Nusantara**. Saat ini **24 murid** masuk dan **3 asesmen** sedang dikerjakan.»
> «You are about to stop at once: **Class 5B · SD Cendekia Nusantara**. Right now **24 students** are signed in and **3 assessments** are in progress.»

Then «Ketik HENTIKAN SEKARANG untuk mengonfirmasi». The red «Hentikan sekarang» is enabled only when the scope, the reason and the phrase are all valid. A fixed phrase is learned once and is the same at every scope; a different word per scope (a school's name, «5B») would be a new pattern and easy to mistype.

**Reason** (radio, required):
- C7's list, plus «Masalah keamanan» («Security issue») and «Masalah integritas data» («Data integrity issue»);
- «Lainnya» with «Jelaskan singkat»;
- an optional public message, as today.

**Immediate notice.** The existing «PINTAR dihentikan sementara» page, scoped like C7:
- the title: «**Kelas 5B** dihentikan sementara»;
- the existing lines: `.darurat.aman` («Apa pun yang sudah tersimpan tetap aman…»), `.darurat.asesmen` («Penghentian ini tidak mengumpulkan asesmen yang sedang dikerjakan…») and `.darurat.langkah`.

**One correction to existing copy.** `.darurat.arti` says «**Admin platform** menghentikan PINTAR». Use the role's one name: «**Admin PINTAR** menghentikan … karena …» (see §6, item 6).

**Who lifts it.** In the list, an emergency row shows «Penghentian darurat · Berlangsung · oleh {nama} · {alasan}»:
- **A PINTAR Administrator** gets «Akhiri penghentian» behind `KonfirmasiBahaya` («Akhiri penghentian darurat untuk Kelas 5B sekarang?»).
- **A School Administrator** sees the row without the action, and the line «Hanya Admin PINTAR yang dapat mengakhiri penghentian ini.» / «Only a PINTAR Administrator can end this stop.»

**After it is lifted.** The existing «PINTAR dapat digunakan», plus for a student whose sitting was contained:

> «Asesmen yang terhenti dapat dibuka lagi. Jawaban yang sudah «Tersimpan» tetap ada. Bila waktunya habis selama penghentian, guru Anda yang menentukan langkah berikutnya.»
> «An assessment that was stopped can be opened again. Answers that showed «Saved» are still there. If its time ran out during the stop, your teacher decides what happens next.»

The governed-recovery wording waits on Sharon's containment design. **→ Sharon**

---

## 4 · C1 · recovery flows (words and screens only)

**Reuses:**
- the full-page explanation pattern of «Komputer siapa ini?» (one question, two choices);
- `KonfirmasiBahaya` for the teacher's act (non-destructive, so a primary confirm, not red);
- the «Tersimpan» vocabulary;
- the student list in «Lihat nama murid».

**No word for the mechanism** («generation», «controller») reaches a user.

### (a) A student continues a low-stakes assessment on another device, after signing in again

The screen appears on device B when they open the assessment:

> **Lanjutkan di perangkat ini?**
> Anda sedang mengerjakan *Latihan · Bab 1* di perangkat lain. Terakhir tersimpan pukul 09.42 WIB: **6 dari 10 soal** sudah terjawab.
> Bila Anda lanjut di sini, perangkat lain itu tidak menyimpan jawaban untuk asesmen ini lagi.
> [**Lanjutkan di perangkat ini**] [Batal]

> **Continue on this device?**
> You were working on *Practice · Chapter 1* on another device. Last saved at 09:42 WIB: **6 of 10 questions** answered.
> If you continue here, the other device stops saving answers for this assessment.
> [**Continue on this device**] [Cancel]

After that, a quiet line above the first unanswered question: «Anda melanjutkan di perangkat ini. Jawaban yang tersimpan sebelumnya ada di sini.»

### (b) A teacher authorizes recovery of an Uji Penguasaan

**On the student's device B:**

> **Asesmen ini sedang dikerjakan di perangkat lain.**
> Uji Penguasaan hanya dapat dilanjutkan di perangkat lain bila guru Anda mengizinkannya. Beri tahu guru Anda nama Anda dan asesmen ini: *Uji Penguasaan · Bab 1*.
> Setelah guru mengizinkan, buka lagi asesmen ini.

The last line holds until the mechanism says whether the page can refresh itself. **→ Sharon**

**On the teacher's side:**
- **Where:** Mengajar › class › «Lihat nama murid» for that assessment. The student's row reads «Sedang mengerjakan · minta lanjut di perangkat lain», with the row action «Izinkan lanjut di perangkat lain». That is one action per row (D-140).
- **The confirmation:**

  > **Izinkan Aisyah melanjutkan *Uji Penguasaan · Bab 1* di perangkat lain?**
  > Perangkat yang sekarang tidak menyimpan jawabannya lagi. Jawaban yang sudah tersimpan tetap ada. Tindakan ini dicatat.
  > [**Izinkan**] [Batal]

- **The result line:** «Aisyah dapat melanjutkan di perangkat lain sampai pukul 10.15 WIB.» If the permission expires, the row returns to «Sedang mengerjakan».

**On the teacher's learner record afterwards:**
- «Dilanjutkan di perangkat lain pukul 09.45 WIB · diizinkan oleh Pak Yusuf» (Uji Penguasaan);
- «… oleh murid sendiri setelah masuk lagi» (low-stakes).

**Exam Mode (no handoff):**

> «Asesmen ini harus diselesaikan di perangkat tempat Anda memulainya. Bila perangkat itu rusak atau hilang, beri tahu guru Anda.»

### (c) What the old device shows once the attempt has moved

On its next save or next screen, the question area is replaced by a neutral panel. It is not an error colour, because nothing went wrong for the student:

> **Asesmen ini dilanjutkan di perangkat lain** pukul 09.45 WIB.
> Jawaban dari perangkat ini tidak disimpan lagi. Jawaban yang sudah «Tersimpan» sebelumnya tetap ada.
> [Kembali ke Belajar]

If an answer was pending on this device: «**1 jawaban** terakhir di perangkat ini belum tersimpan dan tidak dikirim.» That is honest, and it tells the student which answer to give again on the new device. Whether a pending answer can be shown at all is a mechanism question. **→ Sharon**

---

## 5 · C3 · AI-drafted questions in Studio

**Reuses:**
- Studio's package page;
- the question card from «Tinjau soal» (stem, options, key, reasons, misconceptions);
- `pin-pill` state chips;
- «Langkah menuju terbit» with its step reasons («Sekarang: … · Menunggu orang lain»);
- `pin-meta` for provenance;
- the Bank Soal.

**No new review system:** a draft enters the existing steps.

**Creating.** On a package's lesson, beside the existing workbook route, a secondary button «Buat draf soal dengan AI». A short form:
- **Sumber:**
  - this lesson's text (default);
  - another lesson of the package;
  - text the educator pastes;
- **Tujuan pembelajaran:** the lesson's objectives, chosen;
- **Banyak soal:** 1–10;
- **Kesulitan:** Mudah / Sedang / Sulit (the workbook's own values).

**Primary:** «Buat draf». **On failure:** «Tidak ada soal yang dibuat. Coba lagi, atau tulis soal sendiri.» Nothing is created.

**A draft is visibly a draft** until an educator acts on it:
- **The chip:** each new card carries `pin-pill` «**Draf dari AI**» (neutral, not amber).
- **The provenance line** (`pin-meta`): «Disusun dengan AI ({model}) dari *{sumber}* · diminta oleh Bu Sari, 12 Nov 2026, 10.20 WIB».
- **Three actions per card:** «Terima» (primary), «Ubah», «Hapus» (quiet).
  - «Terima» records the educator. The chip becomes «Diterima oleh Bu Sari», and the provenance line stays.
  - «Ubah» opens the existing item editor; saving records «diubah oleh …» (C4 lineage).

**The step it joins.** In «Langkah menuju terbit», «Ajukan untuk ditinjau» is held while any draft remains, with the existing step-reason pattern:

> «**3 soal masih draf dari AI.** Setiap soal perlu diterima, diubah atau dihapus oleh pendidik sebelum paket diajukan.»

Then the steps are unchanged: Periksa isi → Ajukan → Setujui isi (another person) → Buat terbitan → Kunci → Terbitkan.

**The reviewer** at «Setujui isi» sees a count beside the package state («5 dari 12 soal disusun dengan AI»), and each card's provenance line. **Learners** see published items only, with no AI label. That holds unless the owner rules otherwise; I recommend recording the question as an owner decision.

**Provenance stays readable** in the Bank Soal and in «Riwayat perbaikan». It is never shown to learners.

**The blind evaluation of Indonesian item language.** I agree to rate language once the owner approves the external calls. My proposal for the language half:
- **Items:** 20 per provider, the same sources and objectives, shuffled and stripped of any provider mark.
- **Four criteria, each rated 1–4:**
  1. natural, correct Bahasa Indonesia for SD;
  2. clarity of the stem (one reading only);
  3. vocabulary a Grade 5 student knows;
  4. the distractors' language (as plausible as the key, with no tell such as length or a repeated word).
- **The register:** what each draft uses, «Kalian» or «Anda» (see §6, item 4).
- **Item quality** is Sharon's half.

---

## 6 · Platform consistency: what would confuse someone moving between modules

Ordered by effect.

**P1: changes meaning.**

| # | Where | What a user meets | Correction |
|---|---|---|---|
| 1 | Every time PINTAR prints or schedules | **The zone is fixed at Asia/Jakarta, «WIB»** (`hle.ts:6107`; «Mulai (WIB; …)»). A school in WITA or WIT reads every time 1–2 hours off: a print footer (C6), a maintenance start (C7), a window, «Angka dihitung …» | A school's own time zone, used by the date helper everywhere and named after each time. Needed before C6 and C7 ship |
| 2 | Studio → Mengajar → reports | **One test, two names.** The workbook's «guna» value «Cek penguasaan» becomes the assignment title in Mengajar, «Lihat bukti», «Lihat per soal» and «Catatan murid»; every report and the student's pages say «Uji Penguasaan». Likewise «Pemetaan awal» / «Pemetaan Awal» | One name, «Uji Penguasaan», from the workbook through to the report. Accept «Cek penguasaan» as an input synonym in the workbook check; display only the one name |
| 3 | Ringkasan Kelas across classes | **Section letters move with the data.** 5B: «E Murid yang perlu penguatan». 5D/5E: «A Peserta … E Pemahaman keliru …». A teacher who learnt «bagian E» on one class finds something else on another | Fix the letters per section; omit an empty section's content but keep its letter and heading with its «not yet» line |
| 4 | Staff reports and student pages | **Register.** The owner ruled «Anda» throughout, but objective statements address «**Kalian** dapat …», on teachers' and leaders' reports and on students' pages. Short titles reduce it in the reports, not on the student's «Per tujuan pembelajaran» | A content decision for Studio and Dr Gladys: statements written as the skill («Menentukan selisih pola berkurang…»), or addressed with «Anda» |
| 5 | Class report ↔ school report | **Two verdicts on one figure.** The class report marks a topic «di bawah target» against the class's target (70%); the school report bands the same figure («Berkembang» at 60–79%). A 64% reads as below target on one page and developing on the other. Each page explains itself, but nothing tells someone moving between them | One sentence on each page naming the other measure, e.g. under the school's band key: «Target tiap kelas dapat berbeda dari batas pita ini; lihat Ringkasan Kelas.» |
| 6 | Pause pages, refusals, help | **Who to contact has four names:** «Admin platform» (`pemeliharaan.darurat.arti`), «pengelola PINTAR» (`pemeliharaan.pesan`), «yang mengurus PINTAR di sekolah Anda» (refusals), and «PINTAR Administrator» (the owner's term) | Two names, one per level: «Admin sekolah» and «Admin PINTAR». Every sentence uses the one that can actually help |

**P2: interrupts a workflow.**

| # | Where | What | Correction |
|---|---|---|---|
| 7 | Every form with several actions | The primary-button rule is still unresolved (C4: one per view, against D-140: one per form) | Rule it before 4.1's new forms (C7, C8, C3 cards). My recommendation is unchanged: D-140 for row lists, P1 for a page's own next step |
| 8 | Destructive acts | Two confirmation patterns (`KonfirmasiBahaya`; the typed phrase) and, in older Konfigurasi forms, «Batal» drawn as a text link | Keep both patterns, each for its kind: a typed phrase only for emergency stops. Move every «Batal» to `pin-quiet` |
| 9 | Refusal pages | The way out differs by entry point («Mengajar», «Mau ke mana hari ini?», «Ke halaman awal») | One label, the reader's own home: «Ke halaman awal Anda» |
| 10 | Disabled actions | A disabled button says why only by position: «Lanjut ke pemeriksaan», and in 4.1 «Mulai» during maintenance and «Ajukan» with AI drafts | Every disabled action is tied by `aria-describedby` to its reason sentence. Make it part of the button component, not per page |
| 11 | Print | Ringkasan Kelas 5C prints page 2 as section A's lead and an **empty card frame** to the bottom, with the chart on page 3 (`gambar/cetak-5C-halaman-2-kosong.png`, from `e8a5efb9`'s PDF). Pimpinan's print ends with a page holding only «Lihat lebih rinci» | Let the figure card break before its chart, or keep the lead with its chart; hide interactive controls in print. Worth fixing with C6, which touches the same stylesheet |

**P3: consistency only.**

| # | What |
|---|---|
| 12 | Step lists drawn three ways; form labels and error slots (C6, 4.0); type outside the tokens (C7, 4.0) |
| 13 | «Lihat bukti» «Penguasaan per bagian» prints values without «%» («48»); every other page writes «48%» |
| 14 | At 320 px the top bar breaks the page name inside a word («Ringka/san Kelas», «Konfig/urasi») |
| 15 | «Cetak laporan» is offered on an empty report (a student with no chapter yet). With C6, that would print and record an empty page |

**Not seen for this list:**
- staging;
- NVDA / TalkBack;
- the 4.1 screens (none exist yet).

Items 1–3 are read from code and from the 4.0 walks I ran. Item 11 is seen in a Chromium PDF.
