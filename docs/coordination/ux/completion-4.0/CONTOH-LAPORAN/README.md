# CONTOH LAPORAN · seven sample reports (owner's review)

**Form P (a specimen collection).** Seven readers, seven reports, plus one variant (2b) showing how the Guru report changes when the evidence is not yet enough. **A design and language exercise, not a proposal:** no new module, metric, permission or requirement. Every report is drawn over figures PINTAR already has; where a report gathers existing pages into one view, it says so, and the question is put to the owner.

**Data:** 100% invented, internally consistent. One simulated school (SMP Cahaya Kaliandra, 15 classes, about 470 students, Matematika and IPA), simulated answer by answer (`data.mts`). Every total, percentage, chart and sentence is computed from those answers, so they agree inside a report and between reports: Kelas 7A in report 2 is the same 7A in report 3's grid and inside report 4's school figures, and its students are the ones in report 7's account list. Every screen and every A4 page carries **«CONTOH LAPORAN — DATA SIMULASI»**.

**Words:** every label PINTAR already has is read from the copy table on the engineering branch (read only); every new word is listed below for review. Dr Gladys's definitions are untouched; where a word needs her, it is a question, not a change.

**How to review** (the owner's sequence): first 30 seconds per report without these notes; then every Indonesian heading, label and sentence; then whether each figure supports its sentence and the reader knows what to do next. One consolidated round of corrections.

**Files:** `<kode>.html` (open in a browser); `render/<kode>-1280.png`, `render/<kode>-390.png` (screen); `render/<kode>-a4.pdf` and `render/<kode>-a4-<n>.png` (A4). Rebuild: `npx tsx docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/buat-contoh.mts`.

**The visual grammar, the same in all eight:** one sentence first (what the reader should see), then one picture that shows it; a scale is always 0–100% from zero; the target is a labelled black line; PINTAR's three bands are three steps of one teal, always with their names; the one value the page is about carries the teal accent, everything else is ink; «di bawah target» is a word in the attention colour, never colour alone; missing evidence is a sentence in the figure's place. Every chart has a text equivalent in the page.

## 1-murid · Hasil belajar · murid

**Reader:** Murid. **Their question:** «Bagian mana yang sudah saya kuasai? Apa yang masih perlu saya pelajari?» **A4:** 2 pages.

**In 30 seconds:** Which chapters are done and reached their target, what is still in progress, and exactly which parts to study again: no score is compared with anyone else's.

**Where it comes from in PINTAR**
- Each chapter's result page, `/belajar/[tugas]/hasil`: «Penguasaan», «Target untuk bab ini», «Target tercapai» / «Belum mencapai target», «Pelajari lagi:»
- Pemetaan Awal against Uji Penguasaan: `siklus.delta_arti`
- Chapter in progress: `siklus.di.pelajaran` on `/belajar`
- **A page that gathers every chapter does not exist today**: this specimen lays the existing per-chapter results side by side (see the questions).

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Lead: one row per chapter, Pemetaan Awal (small grey dot) to Uji Penguasaan (filled dot), the target line through every row | **Candidate VI-C7** (a student's own path): progress against the chapter's own target, never against classmates. The chapter in progress shows only what is known. |
| Per chapter: each part as four small squares, one per question answered right | A count the learner already sees question by question on the result page; the squares make «3 dari 4» readable without a percentage. |

**Privacy and permissions:** Only Bagas's own work. No class average, no rank, no peer. First name only in the greeting (D-020); the bar says «Bukan akun Anda?» (S15).

**Questions for the owner or Dr Gladys**
- Owner: a learner's page that gathers all chapters is new presentation over existing results. Wanted, or keep results per chapter?
- The title «Hasil belajar» and the greeting are new words. Dr Gladys: the title (G6 covers report titles).

## 2-guru · Ringkasan Kelas · 7A

**Reader:** Guru. **Their question:** «Apakah kelas saya memahami materi? Bagian mana yang paling membutuhkan perhatian?» **A4:** 3 pages.

**In 30 seconds:** Which parts of the chapter the class has and has not yet got (2 of 5 topics under the target), how the class spreads across PINTAR's bands, the one recurring misunderstanding with what to do about it, and who to help first.

**Where it comes from in PINTAR**
- `/edukator/ringkasan?kelas=…` (Ringkasan Kelas, C1): `metrik.topik`, `metrik.kesiapan`, `metrik.kenaikan`, `metrik.miskonsepsi`, `metrik.peserta`, `metrik.pemahaman`
- The students in the lowest band: the class's own students, as the teacher already sees them in «Lihat bukti» (`/mengajar/[kelas]/bukti`) and the student page (`mengajar.murid1.*`)
- «Pelajari lagi» per student: `mengajar.murid1.tujuan_arti` («tujuan yang penguasaannya masih di bawah target»)

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Lead: «Penguasaan per topik» as rows on one 0–100% scale with the target line through every row | Existing display «Diagram batang» / «Daftar». Answers «which part needs attention» in one look: the bars that stop short of the line. The weakest topic carries the one accent; «di bawah target» is said in words, not colour alone. |
| Population line, then the bands as one bar over the students who took it | Existing «Sebaran» (`pds-populasi`, D-121(c)): «Belum mengerjakan» is a count, never a band. |
| One dot per student on the score line, with the band zones and the target | **Candidate VI-C1** (distribution strip): shows the class's real shape (here two groups, not one bell) that an average hides. Needs per-student scores on this page; the teacher already holds them in «Lihat bukti». |
| Kenaikan: the number, then the class's average before and after on the same scale | Existing «Angka utama»; the before→after pair is the same figure drawn at both ends (the same students in both). |
| Recurring misunderstanding: one row with its count, an example answer and the remedy | Existing «Daftar» (`metrik.miskonsepsi`, which carries its remedy). |

**Privacy and permissions:** Only this teacher's class. Students are listed by name only in the lowest band, alphabetically, never ranked, with what to study again (as `mengajar.murid1.*` already does).

**Questions for the owner or Dr Gladys**
- The page-level lead sentence is new: PINTAR would compose it from the figures below it, with no cause or advice. Owner: should reports carry one?
- «Penguasaan per topik» (this report, `metrik.topik.label`) and «Penguasaan per bagian» («Lihat bukti», `mengajar.bukti.bagian`, UX-41) name nearly the same figure on two pages. Dr Gladys: one name, or keep both?
- «poin» for Kenaikan (a difference in percentage points). Dr Gladys: «poin», «poin persentase», or no unit?
- The report title is G6 (Dr Gladys); «Ringkasan Kelas» is today's copy (`laporan.kelas.judul`).

## 2b-guru-belum-cukup · Ringkasan Kelas · 7E (belum cukup data)

**Reader:** Guru. **Their question:** «Apakah kelas saya memahami materi? (Uji Penguasaan kelas ini masih berlangsung.)» **A4:** 2 pages.

**In 30 seconds:** The same report on a class whose Mastery Check is still being held: there is nothing to conclude yet, and the page says so before anything else. Every figure stays in its place with how far it is from appearing.

**Where it comes from in PINTAR**
- `/edukator/ringkasan?kelas=…` (Ringkasan Kelas, C1)
- The «not yet» state: `laporan.metrik.belum_cukup_data`, `ketiadaan.jumlah.murid`, `laporan.muncul.*` (P14)

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Population line | Existing (`pds-populasi`): who the report covers and who is missing, before any figure. |
| Headline figures in their «not yet» form | Existing «Angka utama»: the figure's place is kept, so the page does not change shape when the data arrives. |

**Privacy and permissions:** Nothing about individual students; under the minimum sample no class figure is drawn.

**Questions:** none.

## 3-kadep · Matematika · kelas 7

**Reader:** Kepala Departemen. **Their question:** «Apakah ada pola kesulitan pembelajaran yang perlu kami tindak lanjuti?» **A4:** 3 pages.

**In 30 seconds:** Whether a difficulty is a pattern across the department or one class: here Penjumlahan dan pengurangan pecahan and Pecahan campuran sit under the target in most classes, so the follow-up is about the topic. One class has too little evidence to say anything.

**Where it comes from in PINTAR**
- `/pimpinan/[simpul]` for the Matematika node: «Yang didukung bukti» (figures per class, `pimpinan.bukti.di_kelas`), «Kesiapan bukti» (`pimpinan.kesiapan.*`), the evidence chain words (`pimpinan.rantai.*`)
- Each cell is that class's own `metrik.topik` figure, the same as its teacher's Ringkasan Kelas (7A matches report 2)

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Lead: a grid of topics × classes, each cell its value, a short bar and the target tick | **Candidate VI-C4** (competency grid), drawn with no colour ramp: the number, a bar and the word carry the value, so it needs no new token. Reading across a row shows a pattern; reading down a column shows one class. |
| Evidence chain: supported / not yet known / possible step | Existing (`pimpinan.rantai.*`): keeps the pattern apart from any explanation of it. |
| Evidence readiness per class | Existing «Kesiapan bukti»: missing evidence is stated, never drawn as a low value. |

**Privacy and permissions:** Classes only, named by class, never by teacher (Visual Intelligence: a class's results are not its teacher's rating). No student here: students are a separate, recorded action (`pimpinan.murid.sub`).

**Questions for the owner or Dr Gladys**
- Owner: the grid is a new display (VI-C4) over existing per-class figures. Adopt for `/pimpinan/[simpul]`?

## 4-dekan · Ringkasan Sekolah

**Reader:** Dekan / Pimpinan. **Their question:** «Bagaimana kondisi pembelajaran sekolah secara keseluruhan? Di mana perhatian perlu diberikan?» **A4:** 3 pages.

**In 30 seconds:** Learning is moving up across the school (+19 points since the Pemetaan Awal), and attention belongs to Listrik dan magnet serta Geometri dan pengukuran, the domains still under 60%. Every figure states its base; readiness of evidence is stated, not hidden.

**Where it comes from in PINTAR**
- `/dekan/ringkasan?simpul=…` (Ringkasan Sekolah, C1): `metrik.kompetensi`, `metrik.peserta_institusi`, `metrik.kenaikan_institusi`, `metrik.gerbang_keselamatan`, `metrik.kredensial`, `metrik.perbandingan_kohort`; the coverage line `laporan.cakupan.sekolah` (every school year, no year claimed)
- Evidence readiness per class: `/pimpinan` («Kesiapan bukti»)

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Lead: «Capaian kompetensi», one dot per domain on a 0–100% scale, PINTAR's band zones named once | A dot plot instead of bars: the question is «where on the scale is each domain», and the band zones answer «is it a concern» without a legend. Sorted high to low; the lowest carries the one accent. |
| Headline figures, each with its base | Existing «Angka utama»: four numbers a leader needs, none standing alone («Numbers never stand alone»). |
| Perbandingan angkatan on the same zoned scale | Existing figure, same visual as the lead so the eye does not relearn it; captioned as a comparison of states, not a ranking. |

**Privacy and permissions:** School aggregates only: no class, teacher or student is named in the figures. The only class names are where evidence is not yet enough.

**Questions for the owner or Dr Gladys**
- «Sertifikat terbit» here counts Mastery Check results at the target with every required item right; the real rule is the certificate service's. Engineering: confirm the figure's definition before any comparison.
- «Angkatan 2026 (kelas 7)»: is «angkatan» by entry year the school's usage? Dr Gladys.

## 5-peserta-pd · Hasil pengembangan profesi · peserta

**Reader:** Pendidik sebagai peserta. **Their question:** «Apa perkembangan saya? Apa yang sudah baik dan apa yang perlu saya tingkatkan?» **A4:** 1 page.

**In 30 seconds:** The package is finished and its target reached; each part shows where the educator started and ended, and the one part to study again is named. It is the educator's own record, never a performance rating.

**Where it comes from in PINTAR**
- The educator's own result in «Pembelajaran Saya» (`/belajar/[tugas]/hasil` for a PD package): Pemetaan Awal, Uji Penguasaan, target, «Pelajari lagi»; the record's meaning `pengembangan.arti`
- Steps: the named steps (`pds-steps`, corrected 4 Nov)

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Named steps, all done | Existing step list: where the educator is in the package. |
| Lead: per part, Pemetaan Awal → Uji Penguasaan on a 0–4 scale with the target at 3 | **Candidate VI-C7**, the same as the learner's report so one grammar serves both: growth against the package's own target, nothing else. |

**Privacy and permissions:** The educator's own result. The page says who else may see the result (D-069(b)) and that answers are shown to no one else.

**Questions for the owner or Dr Gladys**
- The sentence on who may see the result is new; owner: is it right to state it here (D-069(b), (c))?

## 6-fasilitator · Catatan pengembangan profesi · fasilitator

**Reader:** Fasilitator. **Their question:** «Bagaimana perkembangan kegiatan yang saya tangani berdasarkan informasi yang boleh saya akses?» **A4:** 3 pages.

**In 30 seconds:** Who has started, who is part-way and who has finished, person by person, and who has not begun. Results are there for each person (as the facilitator is entitled), never added up or ranked.

**Where it comes from in PINTAR**
- `/pengembangan/[simpul]` for the facilitator: the columns «Sudah mulai · Pemetaan Awal · Pelajaran selesai · Uji Penguasaan · Hasil · Selesai» (`pengembangan.kolom.*`), «Terdaftar, akun belum diaktifkan»

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Lead: one row per participant, one column per step; a filled dot when done, a short dash when not yet; lessons as five small squares | **Candidate VI-C5** (progression path), as a table: the pattern of the group is visible at a glance (the empty right-hand side), while every cell stays a person's own fact. No column totals. |

**Privacy and permissions:** Individual results for the facilitator (D-069(b)); no answers, no integrity signals (D-069(c)); alphabetical, never ordered by result.

**Questions for the owner or Dr Gladys**
- **Owner (D-069(b)):** the lead sentence counts participation («10 dari 12 sudah mulai; 6 sudah selesai»). It is not a result, but it is an aggregate on a page ruled «never an aggregate figure». Allowed for participation, or remove it?

## 7-admin · Pekerjaan administrasi · Admin sekolah

**Reader:** Admin Sekolah. **Their question:** «Siapa yang belum terdaftar, belum aktif, atau memiliki pekerjaan administrasi yang belum selesai?» **A4:** 2 pages.

**In 30 seconds:** Who cannot sign in yet (12 people, named, by class), what else waits on the administrator, and who has not finished the professional-learning package: each with the one action that resolves it.

**Where it comes from in PINTAR**
- Konfigurasi's «Yang menunggu» (`config.menunggu.*`, B1, UX-33)
- Aktivasi akun: who waits for an account, per class (`aktivasi.kelas.*`), «Buat kartu kelas», «Aktifkan dengan email»
- `/pengembangan/[simpul]` for Admin sekolah: enrolment, participation and completion only (`pengembangan.arti_terbatas`)
- **One page that gathers these does not exist today**: this specimen places existing lists side by side (see the questions).

**Each figure, and why this form**

| Figure | Why |
|---|---|
| Lead: the «Yang menunggu» rows, each a count that opens where the work is done | Existing (B1). An exception summary: only what waits is shown; «Selebihnya sudah siap» says the rest in one line. |
| Per class, only the classes with someone waiting, the names and the one action | An exception list instead of a chart of 15 classes: the administrator's question is «who», and a name is more useful than a bar. |

**Privacy and permissions:** No assessment result, score or answer. The professional-learning part shows enrolment, start and Pemetaan Awal status only (D-069(b): Admin sekolah sees enrolment, participation and completion).

**Questions for the owner or Dr Gladys**
- Owner: a single administration summary is new presentation over existing pages. Wanted, or keep Konfigurasi's «Yang menunggu» as the summary?

## All new words, for review

Every visible string that is not already in PINTAR's copy table. Numbers inside a sentence are filled from the data.

| Report | New words | Note |
|---|---|---|
| murid | Dua dari tiga bab sudah mencapai target. Di IPA Bab 1 masih ada bagian yang perlu dipelajari lagi. | learner copy: no pronoun, no comparison with anyone |
| murid | pelajari lagi |  |
| murid | Hasil belajar |  |
| murid | Halo, Bagas |  |
| murid | Semua bab yang sudah dikerjakan di TA 2026/2027, sampai 6 Nov 2026, 07.30 WIB. |  |
| murid | Pelajari lagi: Massa jenis serta Campuran dan larutan. |  |
| murid | Bagian per bab |  |
| murid | Setiap kotak satu soal yang dijawab tepat pada Uji Penguasaan. |  |
| murid | Target setiap bab ditetapkan sekolah: 15 dari 20 soal. |  |
| murid | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |
| guru-7A | Target bab ini ditetapkan sekolah: 75% (15 dari 20 soal). |  |
| guru-7A | Dua dari lima topik masih di bawah target: Penjumlahan dan pengurangan pecahan serta Pecahan campuran. | lead sentence, composed from metrik.topik and the chapter's target |
| guru-7A | 24 dari 29 murid sudah berada di pita Mantap atau Berkembang; 5 murid perlu penguatan. Rata-rata penguasaan kelas 75%. |  |
| guru-7A | di bawah target |  |
| guru-7A | soal tepat dari 20 |  |
| guru-7A | Setiap titik satu murid, diwarnai menurut pitanya. |  |
| guru-7A | poin |  |
| guru-7A | Dihitung dari 29 murid yang mengerjakan Pemetaan Awal dan Uji Penguasaan. |  |
| guru-7A | Rata-rata kelas |  |
| guru-7A | Contoh jawaban: 1/2 + 1/3 = 2/5 |  |
| guru-7A | dari 29 |  |
| guru-7A | Saran penanganan |  |
| guru-7A | Murid di pita Perlu penguatan |  |
| guru-7A | Pelajari lagi |  |
| guru-7A | soal wajib belum tepat |  |
| guru-7A | Menurut abjad. Ini daftar bagian yang perlu dipelajari lagi, bukan penilaian atas muridnya. |  |
| guru-7A | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |
| guru-7E | Target bab ini ditetapkan sekolah: 75% (15 dari 20 soal). |  |
| guru-7E | Belum cukup bukti untuk menyimpulkan apa pun tentang Kelas 7E · Matematika. |  |
| guru-7E | Baru 4 dari 33 murid mengerjakan Uji Penguasaan Bab 2 · Pecahan. Angka kelas muncul setelah paling sedikit 5 murid mengerjakannya. |  |
| guru-7E | Angka kelas |  |
| guru-7E | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |
| kadep | Penjumlahan dan pengurangan pecahan serta Pecahan campuran di bawah target di keempat kelas yang datanya cukup. | lead: a pattern across classes, from metrik.topik per class |
| kadep | Pola yang sama di banyak kelas menunjuk ke topiknya, bukan ke satu kelas. Kelas 7E belum cukup data. |  |
| kadep | Topik |  |
| kadep | di bawah target |  |
| kadep | poin |  |
| kadep | Garis tegak di setiap sel: target 75%. Angka berwarna jingga: di bawah target. Tanda —: belum cukup data. |  |
| kadep | Bab 2 · Pecahan di 5 kelas. Angka dihitung 6 Nov 2026, 07.30 WIB dari semua bukti sampai saat itu. |  |
| kadep | Setiap angka dihitung per kelas, sama dengan Ringkasan Kelas tiap kelas. |  |
| kadep | Kelas disebut menurut namanya, tidak menurut gurunya. Angka menunjukkan keadaan, bukan penilaian atas guru. |  |
| kadep | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |
| dekan | Penguasaan murid naik rata-rata 19 poin sejak Pemetaan Awal. Listrik dan magnet serta Geometri dan pengukuran masih di pita Perlu penguatan. | lead: kenaikan_institusi, then the ranah under 60% (or the lowest) |
| dekan | 6 dari 8 ranah berada di pita Berkembang atau Mantap. |  |
| dekan | 1.176 jawaban |  |
| dekan | 1.764 jawaban |  |
| dekan | 1.936 jawaban |  |
| dekan | 3.020 jawaban |  |
| dekan | 1.072 jawaban |  |
| dekan | 2.952 jawaban |  |
| dekan | 2.400 jawaban |  |
| dekan | Angka sekolah |  |
| dekan | dari 468 murid terdaftar |  |
| dekan | poin |  |
| dekan | dari 836 hasil dengan Pemetaan Awal dan Uji Penguasaan |  |
| dekan | 726 dari 836 hasil Uji Penguasaan |  |
| dekan | dari 836 hasil Uji Penguasaan |  |
| dekan | Angkatan 2026 (kelas 7) |  |
| dekan | 242 hasil |  |
| dekan | Angkatan 2025 (kelas 8) |  |
| dekan | 294 hasil |  |
| dekan | Angkatan 2024 (kelas 9) |  |
| dekan | 300 hasil |  |
| dekan | Angkatan berbeda mempelajari bab yang berbeda, jadi ini perbandingan keadaan, bukan peringkat. |  |
| dekan | Angka sekolah ini tidak menilai guru atau kelas mana pun. |  |
| dekan | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |
| peserta-pd | Target tercapai: 17 dari 20 soal tepat, naik dari 10 pada Pemetaan Awal. |  |
| peserta-pd | Paling kuat: Tujuan pembelajaran yang dapat diukur, Merancang soal diagnostik dan Menindaklanjuti hasil. Pelajari lagi: Membaca bukti belajar. |  |
| peserta-pd | Langkah Anda |  |
| peserta-pd | Pelajaran (5 dari 5) |  |
| peserta-pd | Hasil Anda sendiri, sampai 6 Nov 2026, 07.30 WIB. |  |
| peserta-pd | pelajari lagi |  |
| peserta-pd | Tentang hasil ini |  |
| peserta-pd | Hasil ini terlihat oleh Anda, fasilitator, Kepala departemen, dan Dekan. Jawaban Anda tidak ditampilkan kepada siapa pun selain Anda. |  |
| peserta-pd | Target paket ini: 75% (15 dari 20 soal); per bagian, 3 dari 4. |  |
| peserta-pd | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |
| fasilitator | 10 dari 12 peserta sudah mulai; 6 sudah selesai. Gilang Ramadhan dan Imam Syafii belum mulai. | participation only: never an aggregate of results (D-069(b)) |
| fasilitator | Peserta menurut abjad. Hasil terlihat per orang, tidak dijumlahkan dan tidak diurutkan. |  |
| fasilitator | Peserta |  |
| fasilitator | Merancang Asesmen Formatif di Kelas · 12 peserta · sampai 6 Nov 2026, 07.30 WIB. |  |
| fasilitator | Tentang catatan ini |  |
| fasilitator | Jawaban peserta dan catatan integritas tidak ditampilkan di sini. |  |
| fasilitator | Tanda —: belum ada. |  |
| fasilitator | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |
| admin | 12 orang belum bisa masuk: 11 murid di 7 kelas, dan 1 guru. Selebihnya sudah siap. |  |
| admin | Di 8 dari 15 kelas, semua murid sudah punya akun. |  |
| admin | murid sudah punya akun |  |
| admin | Pekerjaan administrasi yang belum selesai, sampai 6 Nov 2026, 07.30 WIB. |  |
| admin | Yang belum bisa masuk |  |
| admin | Pengembangan profesi guru: yang belum selesai |  |
| admin | Buka Aktivasi akun |  |
| admin | Buka Pendataan |  |
| admin | Laporan ini mengumpulkan yang sudah ada di Konfigurasi, Aktivasi akun, Pendataan, dan catatan pengembangan profesi. |  |
| admin | Apa berikutnya | siklus.berikutnya is the learner's; the staff pages reuse it |

## Checklist

- [auto] «CONTOH LAPORAN — DATA SIMULASI» on every screen and in every A4 page's header (`@page`).
- [auto] Every figure and sentence computed from one simulated data set (`data.mts`); no hand-typed total.
- [auto] axe (WCAG 2.2 AA) clean on all eight at 1280 px; no sideways scroll at 1280 or 390 px (`render/laporan.txt`).
- [auto] A4: «Halaman n dari m» on every page; the shell and the actions do not print.
- [auto] Every existing label read from the copy table; every new string listed above.
- [auto] Bands in PINTAR's order (Mantap, Berkembang, Perlu penguatan); «Belum mengerjakan» is a count, never a band (D-121(c)).
- [auto] No figure below the minimum sample (5); the «not yet» statement in its place (P14), shown in 2b and in report 3's 7E.
- [auto] The facilitator's and the administrator's reports: no aggregate of results, no ranking, no answers, no integrity signals; Admin sekolah sees no result (D-069(b), (c)).
- [auto] No class is labelled by its teacher; no learner is compared with another.
- [manual] The owner's three passes (visual, language, meaning).
- [auto] **D-172:** equivalent interactions match their canonical pattern: P1 (one primary action), P3, P6, P13, P14, P20 (no app-name eyebrow).
- [auto] **Visual intelligence:** each report states its reader, question, message, evidence and action (above); bases and periods named; missing evidence shown; no encoding by colour alone; a text equivalent for every chart.
