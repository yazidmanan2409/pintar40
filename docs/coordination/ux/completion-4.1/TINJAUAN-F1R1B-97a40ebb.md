# F1-R1b and L1-F4: UX result review (Daisy, 12 Nov 2026)

> **What holds now:**
> - **Defects, marked for anticipation (13 Nov):** `ANTISIPASI-4.1.md`: 6, all anticipable, 3 of them in my own wording; plus my verification error V-1.
> - **F1-R1b: PASS on `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`.** Three small wording changes (§1c) ride the next commit that touches `hle.ts`. They do not block.
> - **L1-F4: PASS on `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2`** (an ancestor of the commit above, rendered as part of it). Two lines are adjusted (§2), also not blocking.
> - **The English term is «Misunderstanding».** My three lines that said «misconception» are superseded in §1c.
> - **A correction to my own record:** `TINJAUAN-F1-4131d7a2.md` §3 said no learner screen tied to a sitting shows a rationale. **That was wrong.** The learner's Uji Penguasaan result (`/belajar/{tugas}/hasil`) shows one under each reviewed question. I mark it there. F-1's fix (`bc67f72a`) and this pass are what keep that screen honest, as §1b shows.
> - **Bob:** three findings that predate this pass are in §3, for the register. None holds anything.

**Queue item:** `TEAM-INSTRUCTIONS.md` at `0ea2dcdfd957c3cfa21aa81a8cc1bafef706dd1b`, Daisy items 1 and 2.

**How it was rendered.** Locally only:
- this commit's own `npm ci` (the lock is unchanged), a fresh reset, the report world, `next build`, then `next start`.

**Two of the engineer's own journeys, run here with their cleanup off,** so the corrected state stays on screen:
- **C1W-J02:** a class of eleven sits a Pemetaan Awal whose «Pertanyaan awal nomor 1» is keyed A where B is right, and the key is corrected through the screens. All its checks pass; it is red only on the leftover count, which my change caused.
- **C1W-J01:** a learner sits both tests and «Pertanyaan akhir nomor 1»'s key is corrected through the screens. It **passes**.
- **On top of those:**
  - a second learner, added to J01's class, sits the Uji Penguasaan **after** the correction, on the corrected revision;
  - I proposed a second correction (on «Pertanyaan awal nomor 2») as the school admin through the Studio form, to see the proposal and confirmation screens.

**Evidence:** `verifikasi-F1R1B-97a40ebb/`, with screenshots and `catatan-jalan.txt`.

## 1 · F1-R1b

### 1a · My wording, as built

| Where | Seen | Verdict |
|---|---|---|
| **Correction step 2 and the confirmation** | Under the impact counts, one line per option whose correctness flips: «Pilihan A akan kehilangan alasan dan pemahaman keliru terkaitnya, karena benar-salahnya berubah. Kunci diperbaiki sekarang; alasannya ditulis sesudahnya.», and the same for B (`R1B-usul-langkah2.png`, `R1B-konfirmasi-390.png`). axe: 0 at 1280 and 390 | **Accept** |
| **Studio, the corrected revision** | A (now wrong): «Alasan pilihan A ditarik karena kuncinya diperbaiki. Tuliskan alasan yang baru.» and «Pemahaman keliru: belum dikaitkan». B (now the key): the withdrawn line and **no misconception line**, which is right for a key. The marker follows (`R1B-studio-X.png`). **The contradiction I found at F-1 is gone:** no «Ini belum tepat» on the key, and no misconception on the right answer | **Accept** |
| **Studio, an uncorrected question with an unlinked wrong option** | «Pemahaman keliru: belum dikaitkan» on B, and the marker (`R1B-studio-Y.png`). This is existing 4.0 content, now worded honestly | **Accept** |
| **The teacher's per-question view** | F-1's line on the corrected question. The marker on the two uncorrected questions whose wrong option has no code. No sideways scroll at 1280, 390 or 320; axe: 0 | **Accept**, with §1c's refinement of when the marker shows |
| **The class's misconception figure** | «Pemahaman keliru yang berulang di kelas ini · Keliru A … 5 kali», by the key in force | **Accept** |

### 1b · The learner's result, with the per-question disclosure opened

Both at 390 and 1280; no sideways scroll; axe: 0.

| Sitting | «Pertanyaan akhir nomor 1» in «Tinjau kembali» | Verdict |
|---|---|---|
| **Corrected** (sat under the wrong key, now 100%; `R1B-hasil-dikoreksi-390.png`) | «Sudah tepat · Jawaban Anda: Pilihan tepat 1», and **no explanation**. The page's banner says «Dihitung ulang. Hasil ini dihitung ulang karena penilaian satu soal diperbaiki. Hasil asli tetap tersimpan. Hasil asli: 50%». The uncorrected question beside it keeps «Ini tepat.» | **Accept.** Nothing contradicts the mark, and the banner explains the change |
| **Sat after the correction, on the corrected revision** (`R1B-hasil-revisi-baru-390.png`) | «Belum tepat · Jawaban Anda: Pilihan lain 1», and **nothing in place of the withdrawn explanation**. The uncorrected question keeps «Ini belum tepat.» | **Accept**, as ruled (§6a): a withdrawn explanation shows nothing |

**One consequence, recorded:** until an educator writes the explanations again, every learner who sits the corrected revision gets no explanation on that question. That is the design (the correction never waits for explanations). It is why §1c's wording for the held step matters: it is how the gap gets closed.

### 1c · My two open questions, and three small changes

1. **The empty-figure split: accept.**
   - «Belum ada pemahaman keliru yang terkait dengan jawaban ini.» shows **only when nothing is withheld**.
   - Where patterns are withheld under the class minimum, the existing «Belum ada pola jawaban keliru yang dialami cukup banyak murid…» stays.
   - That is right: "nothing linked" beside «{n} pola lain…» would be false.

2. **English: «Misunderstanding».** Every screen string already uses it for «pemahaman keliru»:
   - «Misunderstanding: {label}»;
   - «Recurring misunderstandings»;
   - «Recurring misunderstandings in this class»;
   - «… each misunderstanding …».

   «Misconception» survives only in the authors' field «Misconception code for option {x}», which names the code and may stay. **My three English lines change** (Indonesian unchanged):

   | Key | English, superseding my line of `e48c4906` |
   |---|---|
   | `studio.soal.belum_dikaitkan` (shown after «Misunderstanding:») | «not linked» (unchanged; it now reads «Misunderstanding: not linked») |
   | `soal.tak_terkait` | «Some wrong options are not linked to a misunderstanding. Answers on those options are not counted among recurring misunderstandings.» |
   | `laporan.komposisi.keliru_kosong` | «No misunderstanding is linked to these answers yet.» |
   | `studio.kunci.dampak.penjelasan_hilang` | «Option {x} will lose its explanation and linked misunderstanding, because whether it is right has changed. The key is corrected now; the explanation is written afterwards.» |

3. **The marker's meaning.** In **Studio**, "any wrong option not linked" is right: it is a fact about the question that its author can act on.
   - **On the teacher's per-question view, it should show only when at least one answer in this view landed on an unlinked wrong option.** Its second sentence is about answers («Jawaban pada pilihan itu tidak masuk hitungan …»).
   - Here it shows on two questions that all eleven answered correctly, where it tells the teacher nothing.
   - In 4.0 content, where many wrong options carry no code, it would appear on most questions and stop being read.
   - **Not a blocker:** it is honest as built. The refinement uses data `teacher_question_evidence` already returns (per-option counts and the link).

4. **The engineer's draft for the held step** (`studio.konten.kode.content_rationale_owed`). Not rendered here: it appears when a later revision is moved past STRUCTURED. Studio calls the field «Alasan», and the option says «Alasan pilihan {x} ditarik…», so the message should use the same word and point at that line:
   - **ID:** «Kunci salah satu soal di paket ini sudah diperbaiki, tetapi alasan pilihannya belum ditulis lagi. Tuliskan alasan untuk setiap pilihan yang bertanda «Alasan pilihan … ditarik», lalu lanjutkan langkah ini.»
   - **EN:** «The key of a question in this package was corrected, but its options' explanations have not been written again. Write an explanation for each option marked «The explanation for option … was withdrawn», then take this step again.»

## 2 · L1-F4 (in the build above)

**1 · «Earned but not issued»: confirmed, with one change to fit where it sits.**

**Where it sits:**
- in the impact table of the key correction (step 2 and the confirmation, `DaftarDampak`), in the **«Sertifikat»** column, one row per affected sitting;
- not on a certificate review screen.

**What the screen settles:**
- **The PINTAR ID in place of a name: yes.** «Murid» shows the person's display name, which deletion replaces with the PINTAR ID.
- **No «Terbitkan»: yes.** The table is read-only, with no action on any row.
- **The length: too long for a cell.** Its neighbours are «—» and «akan ditinjau», and the full sentence would make the narrowest column the tallest row on a phone.

**The cell line:**
- **ID:** «Memenuhi syarat, tidak diterbitkan: data pribadi sudah dihapus»
- **EN:** «Requirements met; not issued: personal data deleted»

**One check for the engineer:** the summary above the table says «… · {n} sertifikat baru dapat diterbitkan». It must **not count** a certificate that will not be issued. Otherwise the line and the row disagree.

**Not rendered with a real deleted person:** I made no anonymised learner who newly earns a certificate. The column, the name cell and the absence of actions were read from the built component; the case itself is the engineer's L1-F4 test.

**2 · The refused certificate replacement** (`sertifikat.ganti.gagal.cert_holder_deleted`, the engineer's draft). Two changes:
- **«atas permintaannya» is not always true.** A learner's deletion is requested by the school with the family.
- **Say that nothing changed,** as every refusal in this family does.

The line:
- **ID:** «Sertifikat ini tidak dapat diganti: data pribadi pemiliknya sudah dihapus. Sertifikat yang sudah terbit tetap seperti adanya. Tidak ada yang diubah.»
- **EN:** «This certificate cannot be replaced: its holder's personal data has been deleted. The certificate already issued stays as it is. Nothing was changed.»

**3 · `account_live_attachment`:** built verbatim from my final line. Not rendered: it needs the race state that L1-F2's two-connection test will make.

## 3 · Found along the way, all predating this pass (register; Bob)

| # | Finding | Change |
|---|---|---|
| X-1 | **A refusal inside Studio has two `<main id="isi">`.** `HalamanPenolakan` draws its own `<main id="isi">` inside Studio's layout, which already has one. That makes two main landmarks and two elements with the skip link's target id. axe's WCAG rules do not flag it, which is why my runs read 0 | `HalamanPenolakan` (and `HalamanGalat`, `MemuatHalaman`, if they are also used inside a layout) should render a `<div>` when a layout already provides `<main>`, or take a prop for it |
| X-2 | ~~**An old link to a moved assignment shows the generic error page.**~~ **Corrected 13 Nov** (`X2-CATATAN-DESAIN.md`): the assignment is not moved; six sub-pages under `/belajar/[tugas]/` lack the ownership check the main page has, so any id not the learner's shows the generic error page. Original text: After a key correction moves a class's assignment, a learner opening an earlier `/belajar/{id}/…` gets «Maaf, halaman ini tidak bisa ditampilkan … Kode rujukan …» (the page throws «this learning assignment is not assigned to you») | Answer it as «not found» (`notFound()`), as the same page does for a missing result, or send the learner to their assignment list |
| X-3 | An unknown or removed correction id at `/studio/tinjau/kunci/{id}` shows the refusal («not allowed») rather than «not found» | Minor. `notFound()` when the correction does not exist |

## Not seen

- **The held step's message** (§1c.4), in place.
- **«Earned but not issued»** with a real deleted person (§2.1).
- **`account_live_attachment`** in place.
- **Real screen readers.**
