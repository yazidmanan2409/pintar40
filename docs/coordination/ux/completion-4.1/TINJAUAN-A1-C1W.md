# Design review of two 4.1 completion pages, before code (Daisy, 11 Nov 2026)

**Pages:** `docs/completion-4.1/batches/A1-COMPLETION.md` and `C1W-COMPLETION.md`, at **`2560494a`** (documentation only, on `main` at `d764d69e`).

This replaces my first reading at `3370643a` (pushed as `1c2f9582`). The owner's four rulings of 11 Nov (`OWNER-DECISIONS-2026-11-11.md` §1b, O41-16 to O41-19) are taken as settled, and I do not answer them. The two new surfaces are added:
- **A1:** another attempt by request and approval; resume or close a frozen sitting (§A1·N1, §A1·N2).
- **C1w:** the certificate «under review» on public verification and on the student's certificate, and the notice to affected schools (§C1·N1, §C1·N2).

**Method:** one review of each page (O41-15 rule 1). I read the pages against the 4.0 screens they extend:
- `/mengajar/[kelas]`, `/mengajar/[kelas]/siapa` and the player, with `ItemPlayer` and the `sync.*` keys;
- `/studio/paket/[course]`, with its «Soal dalam paket ini» and «Riwayat perbaikan» sections;
- Konfigurasi › Sertifikat;
- the 4.0 wording in `src/lib/hle.ts`.

**What «blocker» means on a page that has no code yet:** a point that must be settled on the page before build, because building it as written would tell a teacher or a student something false about scoring or results (evidence integrity). Everything else is **register**.

There are **three blockers**: A1-B1, C1-B1 and C1-B2. Each is a wording decision, not a new capability.

---

## A1 · Sitting control

### Q4 · Where the sitting list sits, and the two ways to end a sitting

**Placement: on «Siapa yang sudah mengumpulkan»** (`/mengajar/[kelas]/siapa?penugasan=…`), not on a new page.
- It is already the one page that lists each student once, alphabetically, with the sitting's state (Koleksi, search, a filter by state, paged).
- The class page's «Lihat bukti» and the assignment row already lead to it.
- A1 adds actions to rows that exist.

**The page's principle stays:** observation, not judgment. No colour per name, no rank, no reason shown. Adding actions does not change that: an action is the teacher's, not PINTAR's verdict.

**The page needs one thing it lacks today: which instrument.** A sitting belongs to Pemetaan Awal or to Uji Penguasaan, but `siapa` takes only `penugasan`.
- Add two links at the top, in the existing segmented-link pattern: «Pemetaan Awal · Uji Penguasaan». The chosen one is `aria-current`.
- Default: the instrument that has an open sitting, or else Uji Penguasaan.

**The state column.** The Badges and words, in the filter's order:

| State | Badge | Under the name, `pin-meta` |
|---|---|---|
| Belum mengerjakan | neutral | — |
| Sedang mengerjakan | neutral | «Mulai 10.05 WITA · sisa 12 menit» (sisa only if a deadline exists) |
| Ditahan | neutral | «Ditahan · sisa 12 menit», and once the student is reinstated, «Ditahan · menunggu keputusan Anda» (see §A1·N2 and A1-R3) |
| Sudah mengumpulkan | ok | «Dikumpulkan 10.41 WITA» |
| Diakhiri guru · dinilai | neutral | «Diakhiri 10.40 WITA · jawaban yang ada dinilai» |
| Diakhiri guru · tidak dihitung | neutral | «Diakhiri 10.40 WITA · tidak dihitung, tidak memakai kesempatan» |
| Waktu habis | neutral | «Berakhir 10.45 WITA · jawaban yang ada dinilai» (the abandoned sitting) |

- A row whose latest sitting came from a granted attempt adds «· kesempatan tambahan» to its meta line.
- Times are always in the school's zone (D-199).

**The row action:** one quiet link per row, «Atur» followed by a hidden «· {nama}». It opens the act panel under the list, in the `?akhiri=` pattern the class page already uses: `siapa?penugasan=…&instrumen=…&sesi=…#atur`. One panel at a time. It is not a dialog.
- The panel offers only the acts that apply to that state. An act that cannot apply is **absent, not disabled**.
  - **Open:** «Tambah waktu» and «Akhiri sesi».
  - **Handed in, or ended, with no attempt left:** «Minta satu kesempatan lagi» (O41-16; §A1·N1).
  - **Ditahan, student reinstated:** «Lanjutkan» and «Akhiri tanpa menghitung» (O41-17; §A1·N2).
  - **Ditahan, student still suspended:** no act. The row says only «Ditahan · sisa 12 menit».
  - **Not started:** no act. The link is not shown at all.
- Each act ends in the existing `KonfirmasiBahaya` (focus to «Batal»), with the reason field (10–300) as in «Akhiri atau tarik».

**«Tambah waktu»:**
- A select of 5, 10, 15 and 30 menit, plus the reason.
- Confirmation: «Tambah 10 menit untuk {nama}? Batas baru 10.55 WITA.»
- Result line: «Waktu {nama} ditambah 10 menit. Batas baru 10.55 WITA.»

**«Akhiri sesi», the two ways.** A fieldset with the legend «Bagaimana sesi ini diakhiri?» and two radios, with **no default**: the teacher must choose, and the choice is recorded.

| Value | Radio label | Hint under it | Button and red confirm |
|---|---|---|---|
| counted | «**Dinilai**: murid sudah selesai, tetapi belum mengumpulkan» | «Jawaban yang sudah tersimpan dinilai. Ini memakai satu kesempatan.» | «Akhiri dan nilai» |
| administrative | «**Tidak dihitung**: murid yang keliru, atau gangguan teknis» | «Tidak ada hasil, dan tidak memakai kesempatan. Jawaban tetap tersimpan. Murid dapat memulai lagi selama jadwalnya masih terbuka.» | «Akhiri tanpa menghitung» |

- The confirmation names the person and the instrument: «Akhiri Uji Penguasaan {nama} tanpa menghitung?»
- The button's words follow the choice, as in 4.0's «Akhiri penugasan» / «Tarik penugasan».

**«Minta satu kesempatan lagi»** is a request, not a grant. Its wording is in §A1·N1.

**«Ubah jadwal», the window change, is not on «Siapa».** It belongs to the assignment, so it goes on the class page's material row, beside «Akhiri atau tarik», as «Ubah jadwal · {kursus}». It opens a panel in the same pattern:
- «Mulai» and «Sampai», labelled with the school's zone: «Mulai (WITA)»;
- the reason;
- the note «Murid yang sedang mengerjakan tetap memakai batas waktunya sendiri.»
- Result: the row's existing «Mulai … · Sampai …» line, updated, plus «Jadwal diubah. …» in the existing result line.

### Q5 · What the student sees while the player is open

Three different ends need three different notices. Today's `sync.diakhiri_sekolah` says «tidak dinilai» and would be **false** for a sitting the teacher ended as «Dinilai». That is blocker **A1-B1** below.

| Event | In the open player | Focus | Controls |
|---|---|---|---|
| Time added | the timer updates; a `role="status"` line: «Waktu Anda ditambah 10 menit.» | stays where it is (not an interruption) | unchanged |
| Ended, counted | the closed-sitting notice pattern: «Guru Anda mengakhiri asesmen ini. Jawaban yang sudah tersimpan dinilai.» + «Lihat hasil» | moves to the notice | all disabled; the chosen answer keeps its mark (as at `821d3853`) |
| Ended, not counted | «Guru Anda mengakhiri asesmen ini. Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda. Jawaban yang sudah tersimpan tetap ada.» + «Kembali ke Belajar» | moves to the notice | all disabled |
| The assignment ended (4.0) | keep `sync.diakhiri_sekolah` as it is | — | — |
| Time ran out (abandoned, then returned) | on Belajar, the chapter card: «Waktu habis. Jawaban yang sudah tersimpan sudah dinilai.» + «Lihat hasil» | — | — |
| Frozen by suspension | the student cannot sign in; nothing to show | — | — |
| Reinstated, the teacher has not yet decided | on Belajar, the chapter card: «Asesmen ini ditahan. Guru Anda akan memutuskan kelanjutannya.» No «Mulai» | — | — |
| The teacher resumed it | on Belajar: «Lanjutkan · sisa 12 menit» | — | — |
| The teacher closed it | on Belajar: «Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda. Jawaban yang sudah tersimpan tetap ada.» | — | — |

**The page must also say when the open player learns of the change.** Today it learns only when it next sends (`ItemPlayer` deliver and finish). An extended deadline reached only on the next answer is late, and an ending reached only at «Kumpulkan» lets the student answer into a closed sitting.
- State the mechanism: a light check every 30–60 s while the player is open, and on every send. This is register **A1-R1**.

The register is the student one: «Anda», «Guru Anda». No «sesi», no «disegel», no reason shown. The teacher's reason is never shown to the student.

### Missing states (add them to the page)

1. **Attempts used up, none open.** This is the only state in which «Minta satu kesempatan lagi» appears.
2. **A request waiting, approved, or declined:** the three row states in §A1·N1.
2b. **An attempt granted, not yet started.** «Siapa» shows «Belum mengerjakan · kesempatan tambahan». Belajar shows the chapter's «Mulai» again.
3. **The act raced the student:** the sitting ended between opening the panel and confirming. The refusal reads: «Sesi ini sudah berakhir sebelum perubahan Anda disimpan. Tidak ada yang diubah.»
4. **A Professional Development class:** the «Atur» link is absent, not refused.
5. **A window changed before anyone started:** Belajar shows the new dates. Nothing else changes.
6. **The window closed while a sitting was frozen.** Under O41-17 the sitting waits for the teacher. Once the student is reinstated, the page must say whether «Lanjutkan» is still offered. My proposal: yes, with exactly the preserved remaining time, because the sitting keeps its own deadline. The page also confirms the abandoned-sitting job skips frozen sittings (its own A1-3).
7. **More than one sitting for one student:** «Siapa» shows the latest. The earlier ones are on the student's record page («Penilaian di kelas ini»), each with its state.

### Findings

| # | Class | Finding | Change |
|---|---|---|---|
| **A1-B1** | **blocker** | The player has one ended-by-school notice, which says «tidak dinilai». A1 adds an ending that **is** scored. Reusing the notice tells the student the opposite of what happened | The page names three notices, as in the table above, each with its own key, and the database's refusal code tells them apart |
| A1-R1 | register | When the open player learns of an extension or an ending is not stated | State a check while the player is open, as above |
| A1-R2 | register | «the class's assessment page» does not exist | Name `/mengajar/[kelas]/siapa` with an instrument choice, and the class page row for «Ubah jadwal» |
| A1-R3 | register | A frozen sitting. The teacher should not learn of a platform suspension from this list (the 4.0 ruling keeps suspended sign-in neutral) | A neutral «Ditahan», never «ditangguhkan». **→ Sharon**: the teacher needs only to know it is waiting for them |
| A1-R4 | register | The approver's queue can only be placed once the approver role is settled (the page's A1-2) | Use §A1·N1's placement for the school admin; a head of department gets the same rows on their own home |

### §A1·N1 · Another attempt: request, approval, and the student's view (O41-16)

**The teacher's request**, from the «Atur» panel on «Siapa»:
- The heading «Minta satu kesempatan lagi», then the reason (10–300).
- The sentence: «Permintaan ini dikirim untuk disetujui. Sampai disetujui, murid belum dapat mengerjakan lagi. Hasil sebelumnya tetap tersimpan dan tidak berubah.»
- On Uji Penguasaan, add: «Karena Uji Penguasaan dapat menghasilkan sertifikat, kesempatan ini perlu disetujui orang lain.»
- The button is «Kirim permintaan». It is not destructive, so a plain primary, with no red confirm.
- Result line: «Permintaan dikirim. Menunggu persetujuan.»

**The row on «Siapa»,** in the meta line:
- waiting: «Kesempatan tambahan diminta · menunggu persetujuan»;
- approved: «Kesempatan tambahan disetujui {tanggal}», and the state returns to «Belum mengerjakan · kesempatan tambahan»;
- declined: «Permintaan ditolak · {alasan}». The teacher may ask again with a new reason.

**The approver's queue: «Permintaan kesempatan tambahan».**
- One Collection page, newest first, reached from the «Yang menunggu» block at the top of Konfigurasi: «{n} permintaan kesempatan tambahan menunggu persetujuan». A head of department gets the same line on their own home.
- Each row gives what the decision needs, and nothing that ranks a child:
  - «{nama} · {kelas} · Uji Penguasaan {bab}»;
  - «{2} kesempatan dipakai · hasil terakhir {63%}, target {70%}»;
  - «Diminta {guru}, {tanggal} · Alasan: {alasan}».
- Actions: «Setujui», then «Tolak», which requires a reason. Both are audited.
- **The requester opening it** sees no buttons, and the line, in the pattern of `studio.temuan.orang_kedua`: «Anda yang meminta ini. Orang lain yang menyetujuinya.»
- Empty state: «Tidak ada permintaan yang menunggu.»

**The student:**
- **While waiting:** nothing. PINTAR does not promise what has not been decided.
- **After approval:** the chapter card on Belajar: «Uji Penguasaan dapat dikerjakan sekali lagi.» + «Mulai».
- **After a decline:** nothing. A child is never shown «ditolak».

### §A1·N2 · Resume or close a frozen sitting (O41-17)

**On «Siapa»**, once the student is reinstated: «Ditahan · menunggu keputusan Anda». «Atur» then offers two acts, in the same panel pattern:
- **«Lanjutkan»:** «Murid melanjutkan dengan sisa waktu yang tersimpan, {12} menit. Waktu tidak ditambah.» Plain primary, with the reason. If more time is truly needed, «Tambah waktu» is a separate, recorded act.
- **«Akhiri tanpa menghitung»:** the same wording and red confirm as the administrative end above.

**The student:** the Belajar states in the Q5 table above. Nothing resumes without the teacher.

---

## C1w · Item workbench

### Q5 · The draft editor inside the package page, and how the history reads

**Placement: inside the existing «Soal dalam paket ini» section** (`#soal`), not a new page. The section already shows each question as an `article`: position, use, band, reading, stem, options, key, rationale.

**Each question in a draft** (author, CAN_DRAFT, before submission or after it is sent back) gains one quiet link, «Ubah soal ini». It turns that one article into a form, in place: `?ubah={item}#soal-{item}`, with focus moved to the form's heading. One question is edited at a time.

**The form, in the order the article reads:**
1. «Bacaan» (optional);
2. «Pertanyaan»;
3. «Pilihan» A–E: two to five, each a field;
4. «Kunci jawaban»: radios over the options (exactly one);
5. «Alasan pilihan ini» per option, as the article already shows;
6. «Kode miskonsepsi» per wrong option (optional);
7. «Tujuan»: a select over the package's objectives.

Then «Simpan soal» (primary) and «Batal» (quiet).

**Validation is an error summary at the top of the form,** with each message also beside its field:
- «Pilih tepat satu kunci jawaban.»
- «Pilihan C masih kosong.»
- «Pertanyaan masih kosong.»

**Saved:** the article returns, with the meta line «Diubah oleh {nama}, {tanggal waktu}». That is the attribution the page requires.

**«Tambah soal»** sits at the end of each lesson's list. It opens the same form, empty.

**«Hapus soal»** is in the form, through `KonfirmasiBahaya`: «Hapus soal ini dari draf? Catatan bahwa soal ini pernah ada tetap tersimpan.»

**«Buang draf ini»** sits at the bottom of the page, beside «Perbaiki paket ini», through `KonfirmasiBahaya`:
- «Buang draf "{judul}"? {n} soal di dalamnya dihapus. Catatan audit tetap ada.»
- Afterwards the author lands on Studio with «Draf "{judul}" dibuang.»

**When the draft is submitted:** no «Ubah», and one line under the section: «Draf ini sedang ditinjau. Soal dapat diubah lagi bila dikembalikan.»

**When it is sent back:** «Ubah» returns. The reviewer's notes, if any per question, appear above that question's article.

**The history: «Riwayat soal», per question.** The package already has «Riwayat perbaikan», so the question's history needs a distinct name.
- Each published or sealed question gets a collapsed `details`: «Riwayat soal (3 versi)».
- Newest first, one line per version:

> **Versi 3 · versi ini** · diperbaiki Bu Fitri, 12 Jan 2027 · terbit 14 Jan 2027 · *Kunci: B → C*
> **Versi 2** · diperbaiki Pak Yusuf, 3 Des 2026 · terbit 5 Des 2026 · *Pertanyaan diubah*
> **Versi 1 · asli** · diunggah Pak Yusuf, 9 Nov 2026 · terbit 10 Nov 2026

- **What changed** is said in words, as in the italics: «Kunci: B → C», «Pilihan D diubah», «Pertanyaan diubah». It is not a character diff.
- Each version opens read-only («Lihat versi ini»).
- No statistic is shown across versions, so none is compared.
- A question that is new in this revision reads «Versi 1 · baru di versi paket ini».

### Q6 · The wrong-key flow, the second person, and the notes

**Entry:** in a published package's «Soal» section, each question has a quiet link: «Kunci jawaban keliru?». It opens «Perbaiki kunci jawaban» under the question, with the step list «Langkah 1 dari 3». 4.0's verb for a correction is «Perbaiki», so use it, not «Koreksi kunci».

**Step 1, the correct key.**
- The question as students saw it.
- Radios over its options: the current key is marked «kunci sekarang»; the new key cannot be the same.
- «Alasan» (10–300), recorded and shown to the second person.

**Step 2, «Yang terdampak».** Counts first, then the list:

> «Soal ini ada di {n} sesi yang sudah selesai, di {k} sekolah.
> Bila kunci diperbaiki: {a} hasil berubah · {b} keputusan target berubah · {c} sertifikat mungkin tidak lagi sesuai · {d} sertifikat baru dapat diterbitkan.»

- **Platform content:** the list is by school and class, with counts only. The proposer does not see students of other schools. **→ Sharon**, with her Q3.
- **School content:** by class, with names visible to the proposer's grants.
- **Nothing affected:** «Tidak ada sesi selesai yang memakai soal ini. Perbaikan berlaku untuk pengerjaan berikutnya.» Step 3 still requires the second person: the correction itself needs confirming.

**Step 3, «Kirim untuk konfirmasi».** The proposer then sees «Menunggu konfirmasi orang kedua · diusulkan {waktu}». The same question cannot take a second proposal while one is waiting.

**The second person:**
- Finds it in Studio's «Antrean Tinjauan» as «Perbaikan kunci menunggu konfirmasi».
- The page shows the question, the old and new key side by side, the reason, the proposer, and step 2's counts.
- «Konfirmasi perbaikan» goes through a confirmation dialog: «Hasil {n} sesi dihitung ulang. Hasil asli tetap tersimpan.»
- «Tolak» needs a reason, and returns the proposal to the proposer with it.
- **The proposer opening it** sees, in the existing pattern of `studio.temuan.orang_kedua`: «Anda yang mengusulkan perbaikan ini. Orang kedua yang mengonfirmasinya.» There are no buttons.

**Done:** «Selesai. {n} hasil dihitung ulang pada {waktu}. Hasil asli dan jawaban murid tetap tersimpan.»

**The teacher's note:** the existing `CatatanHitungUlang`, under the figure on the student's record and in the reports, with the reason «Kunci jawaban satu soal diperbaiki». The class page and Ringkasan Kelas read the result in force.

**The student's note:** see **C1-B1**. The 4.0 wording cannot stand under this batch's certificate rule.

**Konfigurasi › Sertifikat** (O41-19): a section at the top, «Sedang ditinjau ({n})», shown only when n > 0. It uses the same words the public page uses. Each row reads:

> «{nama} · {paket} · hasil dihitung ulang {asli} → {baru}, target {t} · sejak {tanggal}»

with «Konfirmasi berlaku» (reason) and «Cabut» (the existing FormCabut), each audited.
- A confirmed certificate leaves the section. Its row in the main list keeps «Dikonfirmasi setelah dihitung ulang · {alasan}».
- A newly earned certificate needs no row: it is issued.

### §C1·N1 · «Sedang ditinjau» on public verification and on the student's certificate (O41-19)

**Public verification** (`/verifikasi/{token}`). The status block gets a third state between «Berlaku» and «Dicabut», with the word and a neutral, not-ok pill. It is never the ✓ of «Berlaku»:

> **STATUS** · Sedang ditinjau
> «Sertifikat ini benar diterbitkan oleh {sekolah}. Penilaian satu soal di asesmennya diperbaiki, dan sekolah penerbit sedang meninjau sertifikat ini. Sampai selesai, sertifikat ini tidak dinyatakan berlaku. Hubungi sekolah penerbit untuk keterangan.»

- «Hasil», «Predikat» and the issue date stay as sealed, so the payload is untouched (the page's own C1w-4).
- **After the decision:** «Berlaku» again, with the line «Ditinjau ulang dan dikonfirmasi {tanggal}»; or «Dicabut», as 4.0 shows it.
- **No reason text** from the school is shown publicly. That is the 4.0 rule for reissue reasons.

**The student's certificate:**
- The list row's pill reads «Sedang ditinjau», replacing «Berlaku».
- The card says, in the student register:

  > «Sekolah Anda sedang meninjau sertifikat ini karena penilaian satu soal diperbaiki. Sertifikat tetap tersimpan. Selama ditinjau, pemeriksaan sertifikat menyebutnya sedang ditinjau.»

- «Cetak atau simpan PDF» stays available. The paper carries the QR, which resolves to the live status (register **C1-R4**).

### §C1·N2 · The notice to affected schools' admins (O41-18)

- **In-app, at the top of Konfigurasi, in «Yang menunggu»:** «Penilaian satu soal di {paket} diperbaiki pada {tanggal}. {a} hasil di sekolah ini dihitung ulang; {c} sertifikat sedang ditinjau.» It links to «Sedang ditinjau» (or, with no certificate affected, to the audit row).
- The line stays until the school has decided every certificate.
- **The page must name the channel.** In-app only, or also the existing email path? I propose in-app plus one email to the school's admins, with no student names in the email. This is register **C1-R5**.
- **The teacher** of an affected class sees no new notice. The existing `CatatanHitungUlang` under each figure is enough.

### Missing states (add them to the page)

1. **Two authors edit one draft at once.** The second save is refused: «Soal ini diubah oleh {nama} sejak Anda membukanya. Muat ulang untuk melihat perubahannya.» No silent overwrite.
2. **A workbook re-uploaded over in-app edits.** It warns before replacing: «Unggahan ini mengganti {n} soal yang diubah di aplikasi.»
3. **A key correction proposed on a question of a withdrawn release:** allowed, with step 2 counting only finished sittings.
4. **A key correction that changes nothing for anyone:** the «Tidak ada sesi selesai…» state above.
5. **Confirmation refused because the proposer lacks authority at some schools** (platform content). **→ Sharon**, with her Q3.
6. **A certificate decision already taken,** then a second correction affects it again: it returns to «Perlu keputusan».

### Findings

| # | Class | Finding | Change |
|---|---|---|---|
| **C1-B1** | **blocker** | 4.0 tells the student, under a recomputed result: «Penguasaan dan jumlah jawaban tepat di atas, serta sertifikat Anda, tetap seperti semula» (`hasil.dihitung_ulang`). The teacher is told the certificate and the student's page use the sealed original (`mengajar.murid1.dihitung_ulang`). O41-19 makes the certificate half false: it is now «Sedang ditinjau». The page still does not say what the student's **result** page shows after a wrong-key correction | The page states **what the student's result page shows: the result in force or the original**. Both notes are rewritten to match, with the certificate said as §C1·N1 says it. Proposal, if it shows the result in force: «Hasil ini dihitung ulang karena penilaian satu soal diperbaiki. Hasil asli tetap tersimpan.» **→ Sharon** for the truth; the copy follows |
| **C1-B2** | **blocker** | «Ditarik» means two things. In 4.0, a **teacher's** «Ditarik» means the results are **not counted**. A **publisher** withdrawing a release (O41-11) stops new sittings while the finished results **still count**. The same word on the class page would mislead a teacher about the figures | Do not show the word «Ditarik» to teachers or students for a withdrawn release. On the class page row: «Dihentikan penerbit · tidak dapat dimulai lagi; hasil tetap dihitung». Keep «Ditarik» inside Studio, where `studio.langkah.ditarik.*` already uses it |
| C1-R1 | register | «Riwayat» per question would collide with the package's «Riwayat perbaikan» | Name it «Riwayat soal» |
| C1-R2 | register | The page says a corrected release replaces its predecessor for new assignments, but not what a teacher sees on an existing assignment | On the class page row: «Ada perbaikan · terbit {tanggal}», linking to the existing «Pindahkan penugasan». Nothing moves on its own |
| C1-R3 | register | The key-correction step 2 counts are the mechanism's honesty test | Compute them with the recompute rule, not an estimate. Under O41-19, write «{c} sertifikat akan ditinjau sekolahnya» in place of «mungkin tidak lagi sesuai» |
| C1-R4 | register | A paper printed while a certificate is «Sedang ditinjau» | Allow it; the QR carries the live status. Say nothing on paper that the status page contradicts |
| C1-R5 | register | «Affected schools are notified» does not say how | In-app in «Yang menunggu», plus one email to the school's admins with no student names (§C1·N2) |

---

## The staging checks: **not reachable from my session**

- Both `staging.pintarselalu.com` and `pintar40-staging.vercel.app` are refused by this session's network proxy (CONNECT 403).
- I also have no staging sign-in for a school admin.
- So I have **not** seen these three checks:
  - the night-issued certificate's date;
  - the integrity count line;
  - «Materi tanpa judul».
- **For the owner to arrange:** the staging host allowed for this session, and a school-admin and a student sign-in on staging for the school with the 23 observations and for one night-issued certificate. Then the first two are about ten minutes.
- «Materi tanpa judul» cannot occur on staging. It needs a local or fixture case; I can render it locally if a fixture provides an assignment whose title cannot be read.
