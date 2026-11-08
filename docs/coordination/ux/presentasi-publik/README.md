# PINTAR public presentation · production notes and claim register (Daisy, 9 Nov 2026)

**Private preview:** https://claude.ai/artifact/TR8rudeGbeH4ZumXrMbXBo (private; owner only until shared from its Share menu).

**Source:** `index.html`, a single page with ten hash-routed screens, in two languages; images in `aset/`.

**Not deployed. Not public.** Publication needs the owner's decision, Second Eye's sign-off on the claims below, and Dr Gladys's language review.

## How it is built

- **Ten screens, one idea each**, with headlines that answer the question.
- **Routes:** each screen has a plain link, `#mulai` … `#penutup` in Indonesian and `#en-start` … `#en-closing` in English. Browser Back works.
- **Navigation:** Previous / Next, «Semua pertanyaan» (a panel; Escape closes it), «Mulai dari awal», the position line («5 dari 10 · Laporan kelas»), and the ← / → keys. The language switch keeps the screen and the report's state.
- **Tones:**
  - teal, a statement to remember (screens 1 and 10; the section bands on 3 and 6);
  - white, what PINTAR shows (3–6);
  - warm, explanation, process and limits (2, 7–9).

  PINTAR's status colours appear only inside its own screens.
- **Motion:**
  - an entrance on screens 1 and 10 (opacity and 10 px, under 0.7 s, none with reduced motion);
  - a 220 ms fade between screens;
  - the report's mark moving when the reader asks.

  Nothing loops; there are no counters and no parallax.

## Where every image comes from

| Image | Source | Status |
|---|---|---|
| `studio-langkah` (the template buttons and the three steps), `soal-kunci` (one question with its key, reasons and misconceptions), `uji-cepat` | The real application on `5919a370` (the verified engineering baseline), built and served locally, signed in through **Ruang Peragaan** as «Pak Rahmat (peraga)», SD Cendekia Nusantara | **Authentic** screen, demonstration data |
| `murid-langkah`, `murid-hasil` | The same, as «Aisyah (peraga)» | **Authentic**, demonstration data |
| `persiapan`, `struktur` | The same, as «Bu Ratna (peraga)», Admin sekolah | **Authentic**, demonstration data |
| `lap-kelas`, `lap-kelas-sedikit`, `lap-kisi`, `lap-sekolah` | PINTAR's own report components (`KomposisiKelas`, `KisiTopik`, `KomposisiSekolah`, with `BarisLingkup` and the page head) from `5919a370`, rendered with **simulated** class and school data. The data uses the demonstration package's real objectives, its real 60% pass mark and a real misconception code (MK-PCH-02); learner names are invented | **Illustrative**, labelled «Contoh · data peragaan» and «data kelas simulasi» |

The demonstration school has one learner, so it cannot show a class with enough evidence; that is why the reports are rendered with simulated data.

**The harness and capture scripts** are kept in `../completion-4.0/CONTOH-LAPORAN/verifikasi-14361bda/alat/`, with `uji/presentasi.tsx`, `cap.mjs`, `cap-lap.cjs`, `uji-pres.cjs` and `uji-int.cjs`. To rebuild:
1. Run the local stack and app as in the handover of 8 Nov.
2. Sign in as `penilai@evaluasi.pintar.test` and use **Ruang Peragaan**.

**Version 3 (visual refinement, owner review of 9 Nov):** screenshots are tight crops of one moment each, captured at a 640-px window and shown at their natural size (592 px; the report grids at 900 px); the class report is rendered at 720 px. No screenshot was edited.

## Claim register

**Status values**
- **V** verified by me on the running application (`5919a370`, local);
- **C** taken from PINTAR's own on-screen copy;
- **D** an owner or design ruling;
- **P** planned;
- **I** illustrative;
- **SE** needs Second Eye's confirmation before publication.

| Screen | Claim | Source | Status |
|---|---|---|---|
| 2 | Lessons, answers and reports come from the same data; nothing is copied between places | The architecture; the learner, teacher and leader screens read the same rows (`human_evaluation.sql`, «one school, one journey») | V / SE |
| 2, 4 | PINTAR marks the answers and records them as evidence | Aisyah's result: «Terjawab tepat 6 dari 6 soal… Target tercapai», with no teacher step | V |
| 3 | Excel template and filled-in example; every row checked; nothing saved until correct | Studio «Buat Paket» copy; the walk of 8 Nov | V, C |
| 3 | A second person approves before publishing (a Kepala departemen or Admin sekolah, not the author) | The walk of 8 Nov: the author is refused «Setujui isi»; the step names who takes it | V |
| 3 | Published questions join the school's Bank Soal and can be reused in Uji Cepat | Bank Soal page; the Uji Cepat copy «Soal diambil dari terbitan yang sudah diterbitkan sekolah» | V, C |
| 3 | No AI question writing in 4.0; AI help planned for 4.1, with the teacher deciding | Owner's roadmap (9 Nov) | D, P |
| 4 | Uji Cepat: the teacher picks the questions; everyone gets the same questions in a shuffled order; marked like other assessments | Uji Cepat page copy | C, V (page seen) |
| 4 | A student's five steps: Pemetaan Awal, Peta Bacaan Personal, Pelajaran, Uji Penguasaan, Hasil | Aisyah's chapter page | V |
| 5 | Lead sentence, denominator line, amber with words, fixed bands that are not the school's pass mark, named learners needing support, the misconception remedy | The `KomposisiKelas` render; band wording is PINTAR's own copy («Bukan batas ketuntasan sekolah») | I (data), C (wording) |
| 5 | With fewer than 5 learners, no class figure is shown | `laporan.metrik.belum_cukup_data`; Lihat bukti on the demonstration class: «Sekarang 1 murid; perlu 5» | V |
| 6 | Leaders see classes side by side; «—» where data is not enough | The `KisiTopik` render; Pimpinan on the demonstration school shows «Sekarang 1 murid; perlu 5» | I, V |
| 6 | PINTAR does not rank schools, classes or teachers | Product rulings; on-screen copy «tidak ada peringkat», «Ini perbandingan keadaan, bukan peringkat» | D, C |
| 6 | Certificates can be checked on PINTAR's verification page | The `/verifikasi/[token]` route exists; **not walked** (the demonstration learner has no sealed certificate) | **SE** |
| 6, 8 | Who sees PD results (participant, facilitator, responsible Kepala departemen, Dekan; Admin sekolah enrolment, participation and completion only) | D-069(b); `pengembangan.arti_terbatas`; the X5 staging walk | D, V |
| 7 | Setup order: structure → Pendataan → roles → accounts | Konfigurasi «Persiapan sekolah», Struktur copy, Aktivasi copy; the walk of 8 Nov | V |
| 7 | The school sets a pass mark before a teacher can provide a package | «Batas ketuntasan» page copy | C |
| 7 | Students need no email: class cards with a PIN, for one class or several at once | Aktivasi; cards made live on 8 Nov | V |
| 7 | PINTAR sends no email when an account is created | `aktivasi.intro` | C |
| 8 | A learner's answers and results: the learner, the teachers of their class, leaders in scope; opening one learner's record is recorded | Pimpinan copy «Membuka catatan satu murid adalah tindakan tersendiri, dan tercatat»; Lihat per soal | C / **SE** (exact scope) |
| 8 | Class reports: the class's teachers and leaders in scope | Mengajar and Pimpinan links | **SE** (whether Admin sekolah also reads them from Konfigurasi «Laporan»; the page does not claim it) |
| 8 | School reports: school leaders | Ringkasan Sekolah under Pimpinan | **SE** |
| 8 | Integrity signals are reviewed by the Kepala departemen, not shown to teachers | `mengajar.bukti.kaki` | C / **SE** |
| 8 | The audit trail is in Konfigurasi | «Jejak audit» entry seen as Admin sekolah | V |
| 9 | 4.0 is in final verification before release; 4.1, 4.5 and 5.0 are planned, with no dates | Owner (9 Nov); staging status | D, P |
| 10 | Contact info@pintarselalu.com and pintarselalu.com | PINTAR's own footer | C |

## Verification run on this preview (version 3, local copy of the page, Chromium)

- **Every screen,** both languages, at 1280, 390 and 320 px:
  - no sideways scroll;
  - every image loads;
  - no console errors;
  - axe WCAG 2.2 AA clean at 1280 and 390 px.
- **26 interaction checks pass:**
  - Next / Previous, ← / →, browser Back, direct links, an unknown link;
  - focus moving to each new heading;
  - the report's three steps, its keyboard, its «belum cukup bukti» switch;
  - the language switch keeping the screen and the report and Studio state;
  - the question panel (focus inside, Tab trapped, Escape back);
  - «Mulai dari awal» at the end;
  - reduced motion;
  - phone order and phone images;
  - touch targets of 24 px or more.
- **Heights** (`uji-tinggi.cjs`): every screen in both languages, and every tab, at 1920×1080, 1536×864, 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 375×667, 360×740 and 320×568. The check covers:
  - the heading and main point are visible before scrolling;
  - every frame fits between the bars;
  - a scrolling frame shows its cue and is reachable by keyboard;
  - nothing is clipped;
  - no sideways scroll.

  **One known exception:** at 320×568 (the smallest, oldest phones), screen 6's heading and lead fit, but the finding starts just below the fold.
- **Not tested:** a human screen-reader pass (NVDA / TalkBack); real phones and tablets; slow networks.

## Found while capturing (for Second Eye)

1. **B: Ringkasan Kelas on the demonstration class says «Baru 1 dari 0 murid … 0 murid di kelas ini».** One learner has a result, but the population reads 0. That screen is not used in the presentation.
2. **C: a lead sentence ends «…dengan membagi..».** A learning objective's own full stop is kept before the sentence's. The simulated data leaves the full stop out, so the preview does not show it.

## Owner decisions (9 Nov) and the review sequence

**Version 3 (refinement, not redesign):**
- the screens now fill the viewport, so content no longer floats in empty space (1, 2, 7–10);
- larger screenshots in tight crops (3, 4, 7);
- screen 5's report is wider; its dimmed part says it is dimmed on purpose and stays readable;
- screen 6 opens with the finding «3 dari 4 kelas berada di bawah target pada topik yang sama», class by class, then the matrix;
- screen 8 shows each category with «Yang dapat melihat» and its audience as chips;
- the closing statement is on three lines at a larger size.

The ten-screen structure, typography, colours and interactions are unchanged. No new claims were added: screen 6's tiles repeat the simulated grid.

**Version 4 (focused correction pass, owner review of V3):**
- **Rule:** a screen makes its main point without scrolling. Detailed evidence may scroll, but only inside a clearly marked frame.
- **Every evidence frame** is sized to fit between the top bar and the bottom navigation. Content taller than that scrolls inside the frame, which:
  - shows «Gulir untuk melihat selengkapnya», hidden once the reader scrolls;
  - becomes a named, keyboard-reachable region.

  The report is not shrunk.
- **Screen 6:** both reports are inspectable in such a frame. Each has «Buka laporan ukuran penuh» to open the full image.
- **Screen 3:** «Tinjau soal» (the question with its key, reasons and misconceptions) is the first tab. «Unggah» is second.
- **Short phones:** the section band is more compact.

**Status:** READY FOR OWNER REVIEW, NOT YET APPROVED FOR PUBLICATION. No redesign is to be made before the owner has looked at the result.

| Question | Decision | Applied |
|---|---|---|
| Demonstration names | Keep them. Frames read «Contoh sekolah · data simulasi» / «Example school · simulated data». Authentic screenshots are not altered; the question panel's note explains «(peraga)» | Version 2 of the preview |
| Contact email | Provisionally yes: info@pintarselalu.com | **Open:** confirm that the mailbox is active and monitored before publication |
| Illustrations | None for now; the typography-led opening and closing are deliberate | No change |

**Review order**
1. **The owner's visual review** of the preview, in Indonesian and English, especially screens 5 and 6.
2. **Second Eye's factual verification,** within its 4.0 reporting-quality work:
   - the screen-8 access statements;
   - certificate verification;
   - the two application defects below.
3. **Dr Gladys's editorial review** of the educational language, at the appropriate stage. This does not start the postponed 4.0 walkthrough.
4. **The publication decision,** only after the claims, screenshots, language and 4.0 release status are verified.

**Defect 1 is a reporting-integrity defect** (owner, 9 Nov). «Baru 1 dari 0 murid» must be resolved before the reporting acceptance gate can pass. Second Eye should check the population definition, the aggregation, and every report that uses the same calculation.
