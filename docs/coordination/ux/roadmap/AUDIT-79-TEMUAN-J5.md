# Ruling 79 audit · J5, a teacher's week: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J5 walked in part** on the local audit world (`00fe853d`), as W10 Ayu Lestari, new to PINTAR, teacher of 8A (W3, with results) and 8C (W11, nothing given).
>   - **Pages:** /mengajar, each class, «Siapkan» to its last step, «Bukti», «Uji Cepat», «Langkah berikutnya».
>   - **The «Atur» panel** («Izinkan», «Akhiri sesi») was walked in J4.
> - **Not walked here:**
>   - running an Uji Cepat (a late joiner, a stop);
>   - «Minta membaca lagi» sent;
>   - «Ubah jadwal»;
>   - «Tambah waktu»;
>   - the screen reader, throttled and reduced-motion passes.
>   These come from the builder's run.
> - **Captures:** `audit79-j5/`, at 390.
> - **5 findings: 1 Significant, 4 Improvement.**
> - **First use without the tour (A) mostly holds:**
>   - every class page says why it is shown;
>   - empty states say what is missing and what makes it appear («Sekarang 0 murid; perlu 5»);
>   - «Siapkan»'s review step says exactly who will see what, and what can't be undone.

## Significant

| # | Finding | Siblings (same fact) | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J5-1** | **«Siap disediakan» for a chapter that can't be given.** «Statistika Dasar» is labelled «Siap disediakan» on 8C's page and in «Siapkan»'s list. Its review step then says «Batas ketuntasan belum ditetapkan … belum bisa disediakan» and still offers «Sediakan Statistika Dasar untuk 8C», which is refused (`ASSIGN_PASS_MARK_MISSING`) | **Disagree.** The class page and the list say «Siap disediakan»; the review step says it can't be given; the button is offered anyway | C-3 (the list derives «ready» without the pass mark) and C-7 (the button offered whatever the fact beside it) | B, F | The list and the class page read «Menunggu batas ketuntasan dari admin sekolah», the review step keeps its sentence, and the «Sediakan» button is not drawn until the mark exists |

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J5-2 | The home's one «Layak dikerjakan lebih dulu» suggests giving «Persamaan Linear Satu Variabel (8B)» to 8A, which already runs «Persamaan Linear Satu Variabel». Meanwhile 8C has nothing at all and isn't named | The 8C page: «Materi tersedia: Belum ada». The 8A page: two chapters running | C-4 (the «first thing» covers one kind of fact) | F, B | The first thing for a class with nothing given outranks a further chapter for a class already running. (Two same-named publications are partly world data; the builder should confirm) |
| J5-3 | 8C's «Langkah berikutnya» offers «Uji Cepat untuk mengecek pemahaman hari ini», whose page then says «Belum ada bab yang disediakan … belum ada soal» with no link onward | **Disagree:** the list offers it, the page can't run it | C-7 | F | The list doesn't offer it until a chapter is given. The Uji Cepat empty state links «Siapkan materi» |
| J5-4 | «Siapkan»'s certificate step: «Diterbitkan sekolah bila murid memenuhi capaian». «capaian» was replaced on the certificate and the public check by «kriteria kelulusan» / «Lulus» (D2-R §4); this sibling was missed | **Disagree** with the certificate (R-b) and `/verifikasi` | C-6 | B | «Diterbitkan sekolah bila murid lulus Uji Penguasaan; bisa diperiksa siapa pun lewat tautan.» |
| J5-5 | «sisa … menit» and «Siap untuk» on the learners' cards were seen from the teacher's side too | — | L-47; J4-3 | H | As those rows |

## The rest of J5 walked locally (24 Nov 20:40): the Uji Cepat, a stop, a late joiner, «Ubah jadwal», «Atur»

I ran the builder's harness `audit/perjalanan/j5.mjs` at `6b248975`, at 1280, on the reloaded audit world. Captures are in my scratch run; they are not committed (the builder's run is the record).
- **L1 to L5 reached their end.**
- **L6 was skipped:** the world can't run it (below).
- **L7 and L8 stopped.** I judged them from the screens they reached.

**Harness notes for the builder** (not product):
- (a) **L2:** the window radios: Tab lands only on the **checked** radio («15 menit»). The script tabbed to `menit.first()`. That is correct browser behaviour, and I patched only my copy.
- (b) **L6:** the world's results are `SYNTHETIC`, so Rizky's page has no «Minta membaca lagi».
- (c) **L7:** the script doesn't fill «Alasan», which is required, and it types the date in a locale-dependent order. The browser field read «03/11/22026».
- (d) **The result page:** the script opens `/uji-cepat/hasil` without `?penugasan=`. Through the page's real «Lihat hasil» link, the page works.

### Holds
- **«Siapkan» an Uji Cepat:**
  - the review says, in four numbered lines, who sees it, the one chance each, that the result is evidence without a certificate, and «Murid yang tidak sempat mengerjakan tidak dicatat sebagai tidak mampu»;
  - then «✓ Uji Cepat disediakan untuk kelas ini.»
- **The teacher's running view** counts without judging: «Sudah mengumpulkan 1/6 · Sisa waktu 29 menit · Angka di atas adalah hitungan, bukan penilaian.»
- **The emergency stop, learner side:**
  - «Penghentian ini tidak mengumpulkan dan tidak menilai … sisa waktunya sama seperti saat dihentikan.»;
  - after the stop, «Lanjutkan di sini?» with the saved answers kept.
- **The late joiner:** Joko starts 1:25 after the Uji Cepat opened, and the window keeps counting from when it was given («Berhitung sejak disediakan»), as promised.
- **«Ubah jadwal»:** says «Murid yang sedang mengerjakan tetap memakai batas waktunya sendiri», and repeats each date in PINTAR's own words under the browser field («Rabu, 25 Nov 2026, 00.00 WIB»).

### New findings

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J5-6 (Significant)** | **The learner isn't told how long an Uji Cepat stays open.** The teacher gave a 30-minute window. The learner's start page says only «DITUTUP · Rabu, 25 Nov 2026», with no time. Inside the sitting, the clock counts **up** («Waktu berjalan 00:00»). Joko, joining late, has 28 minutes and nothing on his screen says so, while his teacher reads «Sisa waktu 28 menit». | **Disagree.** Teacher: «Sisa waktu 28 menit». Learner: a date. | C-3 (each page derives «when it closes» its own way) | F, B, C | Start page: «Ditutup pukul {jam} WIB (sisa {n} menit)». In the sitting, for a windowed assessment, a remaining-time line in place of elapsed time: «Sisa waktu 27.40». At 5 minutes left, one quiet notice: «Sisa 5 menit. Jawaban yang sudah tersimpan tetap dinilai.» |
| J5-7 | **«Tambah waktu» is offered where there is no time limit.** Galih's open Uji Penguasaan ends only when its schedule closes (24 May 2027). His row reads «sisa 259197 menit» (L-47), and «Atur» offers «Tambah waktu · 5 menit …» on it. The button is drawn in the red, danger style, though adding time is not a danger. | — | C-7; L-47 | F, V | For a sitting whose only end is the schedule's close: «Tanpa batas waktu · jadwal ditutup {tanggal}», and no «Tambah waktu». Where it is offered, a normal button, not the danger style. This widens L-47 from formatting to the offer itself. |
| J5-8 | «Ubah jadwal»'s «Alasan» is required, but only the browser's bubble says so («Please fill out this field.»). There is no mark on the field, in the same family as J8-1 and J10-3. | J8-1, J10-3 | C-10 | G | As C-10: PINTAR's own line by the field, on submit |
| J5-9 | **One Uji Cepat, two times, two formats.** The student page: «UJI CEPAT — 2026-11-25 03:16». The Uji Cepat pages: «Uji Cepat · 25 Nov 2026, 03.20 WIB». | **Disagree** (the time too) | C-6; C-3 | H, B | One label everywhere: «Uji Cepat · 25 Nov 2026, 03.20 WIB», from one timestamp |
| J5-10 | **A result link without its parameter is answered as a permission refusal:** «Halaman ini belum tersedia untuk akun Anda. Jika ini keliru, tanyakan kepada yang mengurus PINTAR …». This is the class's own teacher on an old or shortened link. | — | C-9's neighbour (a refusal that names the wrong cause) | H | «Uji Cepat ini tidak ditemukan. Buka dari halaman Uji Cepat kelas.» + the link |
| J5-11 | **During an emergency stop, the teacher gets the learner's page.** «Setelah PINTAR kembali, buka lagi asesmen tersebut; sisa waktunya sama …». The teacher has no sitting to reopen. | J12's maintenance page has staff words | C-6 | H | Staff variant: «Asesmen yang sedang dikerjakan murid ditahan bersama jawaban yang sudah tersimpan dan sisa waktunya. Murid melanjutkannya setelah PINTAR kembali.» |

### A world question, conditional on the builder

On this world, results are `SYNTHETIC`. Rizky's page then reads:
- «Uji Penguasaan … Sudah mengumpulkan»;
- **and** «Hasil murid: Belum ada bukti yang memenuhi syarat untuk angka ini»;
- **and** «Belum ada Uji Penguasaan dari murid ini di kelas ini».

The Uji Cepat result page shows «Belum ada nilai» for both learners who submitted.
- **If no real school can produce non-counting evidence,** this is world-only and not a finding.
- **If one can,** the third sentence is false beside the first. It should read «Belum ada Uji Penguasaan yang dapat dihitung dari murid ini di kelas ini.»
- **For the builder:** confirm, and run J5's L6 on OFFICIAL evidence.

## Capture judgement · the builder's committed J5 (`d41ed05c/j5`, `9be73ecf`), 24 Nov 21:45

Seven walks, every one reaching its last screen. My harness notes are applied, and L6 runs on OFFICIAL evidence (the bootstrap's 8K: Bambang for Sinta). **Every finding J5-1 to J5-11 stands where the capture reaches it.**
- **J5-6:** every learner's start page reads «DITUTUP · Rabu, 25 Nov 2026», and the sitting clock counts up («Waktu berjalan 00:01»), while the teacher reads «Sisa waktu 27 menit».
- **J5-7 is confirmed in the capture's own words:**
  - «Tambah 10 menit untuk Galih Pratama? Batas baru 24 Mei 2027, 03.48 WIB.»
  - then «✓ Waktu Galih Pratama ditambah 10 menit. Batas baru 24 Mei 2027 …»
  - Ten minutes were added to a deadline six months away.
- **J5-11:** the teacher's running and result views during the stop are the learner's page.

### Holds (new in the capture)
- **The stop's learner path completes:** Intan, held mid-sitting, comes back («Lanjutkan di sini? … Jawaban yang sudah tersimpan tetap ada.»), finishes and submits (`28`–`31`).
- **«Minta membaca lagi» on OFFICIAL evidence:**
  - the page explains the case exactly («Sinta Maharani 83% · Persentase sudah memenuhi target, tetapi ada soal penting yang belum tepat.»);
  - it says what it won't do («Hasil murid tidak berubah, dan tidak ada tes baru.»);
  - then «✓ Permintaan dikirim kepada 1 murid.»;
  - the learner's page carries «DIMINTA GURU ANDA · Bambang Sutrisno meminta Anda membaca lagi: …».
- **«Ubah jadwal»:** «✓ Jadwal diubah. Murid yang sedang mengerjakan tetap memakai batas waktunya sendiri.», with the end date stored as typed (31 Dec 2026, 15.00).

### New and widened

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J5-12 | **«Minta membaca lagi» pre-ticks every lesson in the chapter** («Kalimat Terbuka dan Persamaan», «Menyelesaikan Persamaan», «Persamaan dalam Soal Cerita»). Sinta's gap is one important question. The teacher's default request is therefore «re-read the whole chapter». Also, «target 60%» floats alone above «Murid», away from the 83% it qualifies. | The learner's own Hasil names only the sections to re-read («baca lagi») | C-3 | F, V | Pre-tick only the lessons tied to the learner's unmet objectives (the same set the learner's «Baca lagi:» names). Put «target 60%» beside the figure: «83% (target 60%)». |
| L-134, widened | The conditional wording also applies to the **Uji Cepat result page**. With submitted sittings that don't count, it reads «Belum ada nilai. Rata-rata nilai kelas muncul di sini setelah ada yang mengumpulkan.», beside three learners marked «Sudah mengumpulkan». | J5 world question; L-134 | C-3 | B | «Belum ada nilai yang dapat dihitung. Rata-rata kelas muncul setelah ada hasil yang dihitung.» |

### For the builder (harness, not product)
- **(e) The EN walk is EN only for L1.** `pilihBahasa` runs once (line 77). Every later sign-in, teacher, learners and Admin PINTAR alike, comes back in Indonesian. So `standar-en-1280` is mostly ID, and **I don't judge EN from it.** Re-run with `pilihBahasa` after every `masukEmail`.
- **(f) The tour covers the learner's «Diminta guru Anda» card** in `43-sinta-belajar`, as J12-4: dismiss it before capturing. The words were recorded.

**J5's «left for the builder» lines are closed, except the EN pass (e).**

## EN re-capture (`4b1de38a/j5/j5/standar-en-1280`, `7b3c7891`), 24 Nov 22:10

EN throughout, with the tour dismissed. **Harness note (e) is closed**, and the earlier EN capture is set aside.
- **The English holds:**
  - «✓ Schedule changed. Students who are already working keep their own deadline.»;
  - «Ask to read again … They will find the request on their home page.»;
  - «YOUR TEACHER'S REQUEST · Bambang Sutrisno asked you to read these again: …»;
  - the stop page («This stop does not submit or score an assessment that was in progress.»).
- **J5-6, J5-7 and J5-11 stand in EN too:**
  - «CLOSES Wednesday, 25 Nov 2026» with no time;
  - «Add 10 minutes for Galih Pratama? New deadline 24 May 2027 …»;
  - the teacher gets the learner's stop page.
- **The Admin PINTAR stop result** on this walk is J12-5 (Konfigurasi results in ID).

| # | Finding | Cause | Dim. | Fix |
|---|---|---|---|---|
| J5-13 | **EN: two words for one act on one page.** The Uji Cepat result says «The class average appears here once someone has **handed in**», beside the filter «Have **submitted**». | C-6 | H | «submitted» throughout (the learner's button is «Submit») |
| J5-14 (optional) | **EN phrasing:** «Ask for a direction to think in when a question feels stuck», and «An Admin PINTAR stopped PINTAR …». Both are understandable but awkward. | — | H | «Ask for a hint on how to think about a question when you're stuck»; «Admin PINTAR stopped PINTAR …» (the role name without an article, as T-03 uses it) |
