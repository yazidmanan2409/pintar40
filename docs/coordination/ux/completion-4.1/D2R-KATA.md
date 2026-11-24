# D2-R · Words for the certificate refinement, written before the build (Daisy, 24 Nov 2026)

> **What holds now:**
> - **Verdict (24 Nov, 01:05, ruling 89 task 1a):** R-a, R-b and R-g **PASS** against the frozen A4 grid, with one term for Bob or the owner (§1: «Materi» or «Paket» Pembelajaran). The R-h words are **final** (§3). §6.3a: **one change**, `verifikasi.lulus` to «Lulus» (§4). The pre-start conditions are found and resolved (§5.1). Read again on the new base, `claude/next-base` `055738ba`.
> - **Purpose:** my pre-code input to D2-R (`D2-CERTIFICATE-CONDITIONS-SPEC.md` §6, rulings 59, 74, 74a and 74b). It holds the R-h result words, which «Daisy writes», R-g's advisory line, the §6.3 step 2 check of R-a and R-b, and §6.3a's consistency check.
> - **Design only.** Read against the Z tree (`claude/z` `a8d9ff27`), which is accepted on staging under ruling 88.
> - **For Bob:**
>   - **one decision:** §1, «Materi» or «Paket» Pembelajaran on the certificate;
>   - **two build-time confirmations:** §3's evidence threshold (with Sharon), and §5's pre-start conditions screen.
> - **DAISY-25 checked:** no promise of notice. **Vocabulary:** «Belum dapat disimpulkan» is not used here, because ruling 74b words thin evidence as advice, not as a state.

## 1 · R-a and R-b against the A4 grid, and one term to settle

- **R-a:** `sertifikat.jenis` «Sertifikat» / «Certificate»; `sertifikat.berkas` «Sertifikat · {kursus}» / «Certificate · {kursus}». **Confirmed.**
- **R-b:** `sertifikat.diberikan` «Telah dinyatakan memenuhi kriteria kelulusan yang ditetapkan berdasarkan hasil asesmen pada Materi Pembelajaran: {kursus}.» **Confirmed as my final wording, with one point to settle.**
  - **The term:** since Z7 (C-3, `6e8c4f36`), school admins read the same thing in the certificate table as «Paket Pembelajaran» / «Learning Package». That is Studio's name for it (`studio.paket.judul`).
  - **One concept should have one name** (Q4 of the sweep).
  - **My recommendation:** use «Paket Pembelajaran» on the certificate too. «…berdasarkan hasil asesmen pada Paket Pembelajaran: {kursus}.» It is one character shorter than «Materi», so the A4 grid only gains room.
  - **The case for keeping «Materi»:** an outside reader may find «materi» more natural than «paket». If the owner prefers that, then the admin column should follow it instead. Either way, one word in both places.
  - **EN:** «Has been declared to meet the passing criteria set on the basis of assessment results in the Learning Package: {kursus}.» (or «Learning Material», to match the choice).
- **R-c (Predikat removed):** no words.
  - **Note:** `verifikasi.predikat` and `sertifikat.predikat` become unused on learner and public surfaces. Leave the keys if staff reports still read them.

## 2 · R-g · Uji Penguasaan offered once Pemetaan Awal is done

On the chapter page, beside «Lanjut membaca», when Pemetaan Awal is done and some lessons are still unread:
- **The action:** the existing «Mulai Uji Penguasaan».
- **The advisory line,** new key `siklus.siap.saran`:
  - ID: «Uji Penguasaan sudah dapat dikerjakan. Sebaiknya baca semua pelajaran lebih dulu.»
  - EN: «You can take the Mastery Check now. It is best to read every lesson first.»
- **Once every lesson is read:** the existing «Siap untuk Uji Penguasaan» / «Semua pelajaran sudah dibaca.» stands.
- **Neutral tone:** it is advice, not a warning. «Lanjut membaca» stays the first action while lessons remain.

## 3 · R-h · The certifying result (Uji Penguasaan and certifying STANDALONE)

**Order on the result page** (ruling 74a: qualitative first, counts secondary):
1. the decision («Lulus» or «Belum lulus»), with its one-line reason;
2. what to do next: sections to study, or the certificate;
3. the retake line, when «Belum lulus»;
4. the counts, secondary;
5. the one line saying what is not shown.

| Element | New key | ID | EN |
|---|---|---|---|
| Decision, passed | `hasil.lulus` | «Lulus.» | «Passed.» |
| Its line | `hasil.lulus_arti` | «Hasil Uji Penguasaan ini memenuhi kriteria kelulusan bab ini.» | «This Mastery Check result meets this chapter's passing criteria.» |
| Decision, not passed | `hasil.belum_lulus` | «Belum lulus.» | «Not passed yet.» |
| Its line, mastery below the mark | `hasil.belum_lulus_arti` | «Hasil Uji Penguasaan ini belum memenuhi kriteria kelulusan bab ini.» | «This Mastery Check result does not meet this chapter's passing criteria yet.» |
| Its line, the gate (K-01) | keep `hasil.target.belum_gerbang`, reworded: | «Persentase penguasaan bab ini sudah memenuhi target, tetapi ada soal penting yang belum dijawab dengan tepat. Karena itu Uji Penguasaan ini belum lulus. Tanyakan kepada guru Anda langkah berikutnya.» | «Your mastery percentage for this chapter meets the target, but an important question was not answered correctly. So this Mastery Check is not passed yet. Ask your teacher about the next step.» |
| Sections to study, sufficient evidence (74b) | keep `hasil.target.ulang`, reworded | «Bagian yang masih perlu dipelajari:» | «Sections still to learn:» |
| Sections to revisit, thin evidence (74b) | `hasil.baca_lagi` | «Baca lagi juga:» | «Also read again:» |
| Its note, once, under that list | `hasil.baca_lagi_arti` | «Soal untuk bagian ini sedikit, jadi hasilnya belum menunjukkan apa pun tentang bagian ini. Membacanya lagi tetap membantu.» | «There were few questions on these parts, so the result does not show anything about them yet. Reading them again still helps.» |
| Retake, when «Belum lulus» | `hasil.ulang_boleh` | «Anda dapat mengerjakan Uji Penguasaan lagi sesuai aturan sekolah. Tanyakan kepada guru Anda kapan dapat mengulang.» | «You can take the Mastery Check again under your school's rules. Ask your teacher when you can retake it.» |
| Certificate, when «Lulus» | the existing `sertifikat.disiapkan.*`, or the certificate link when issued | — | — |
| Counts (secondary, `pin-meta`) | reuse `hasilbelajar.nilai` | «{b} dari {t} soal» + new `hasil.dijawab_tepat` «dijawab tepat» → «5 dari 6 soal dijawab tepat» | «5 of 6 questions answered right» |
| What is not shown | `hasil.tidak_ditampilkan` | «Pada Uji Penguasaan, kunci jawaban dan benar atau salahnya tiap soal tidak ditampilkan.» | «In a Mastery Check, the answer key and whether each question was right are not shown.» |

**Rules for the words:**
- **«Lulus» and «Belum lulus» replace «Target tercapai» and «Belum mencapai target»** on certifying results only. Pemetaan Awal, Uji Cepat and practice keep their own words and their explanations (§6.2).
- **The K-01 verdict is unchanged.** «Lulus» is the session's `lulus`, gate included, so the gate line keeps its reason and now ends «belum lulus».
- **«Belum lulus», never «tidak lulus».** A retake is always possible under the school's rules (ruling 74 point 1).
- **No mastery claim per objective** (74b and 4.5). A section that is not listed is not called «dikuasai» anywhere.
- **The evidence threshold** decides which list an objective goes in: an approved one, confirmed with Sharon at the build.
  - **If none is approved,** every objective below the mark goes under «Baca lagi juga:» with its note, and «Bagian yang masih perlu dipelajari:» is not drawn.
  - **Both lists may appear together.** An objective appears in one list only.
- **`hasil.review.*` («Buka pembahasan», «Sudah tepat», «Belum tepat», `kunci_terkini`) are not drawn** on certifying results, on any route. Staff views are unchanged.
- **«Hasil Belajar» row (learner summary):** the verdict word follows the same rule there. `hasilbelajar.gerbang` becomes «Ada soal penting yang belum tepat, jadi Uji Penguasaan bab ini belum lulus.» The counts line is unchanged.
- **Print and export:** the same order and words. «Cetak laporan» carries no key or per-question mark.
- **Teacher and approver views are unchanged by R-h** (staff views). Their K-01 words («belum mencapai target …») stay, because a teacher reads the target, not the certificate decision.
  - The consistency of «Lulus» against «tercapai» across roles is for the ruling 79 audit (J3), not D2-R. The verdict is the same either way.

## 4 · §6.3a · Conditions against the certificate and public verification

| Surface | Words | Agree? |
|---|---|---|
| Certificate (R-b) | «…memenuhi kriteria kelulusan…» | — |
| Learner result (R-h) | «Lulus.» / «…memenuhi kriteria kelulusan bab ini.» | **Yes.** The same phrase, «kriteria kelulusan» |
| Public verification | `verifikasi.lulus` «Memenuhi capaian» / «Achieved» | **No.** «capaian» is a different concept, achievement. **Proposed:** «Lulus» / «Passed», matching the result and the certificate. `verifikasi.belum_lulus` is unused: only passed sittings are certified, which the sweep's K-05 found to be dead code |
| Under review (K-05) | «Seperti saat diterbitkan» above the facts | Unchanged; it now heads «Hasil: Lulus» |

**Sharon's part** of §6.3a (no timed test, duration or accommodation implied on the certificate or public page) is hers.

## 5 · To confirm at the build

1. **The pre-start conditions: found (`posttest.*` on `055738ba`).**
   - Today the test page opens with `posttest.intro` «Kerjakan dengan tenang. Anda bisa menandai soal dan kembali lagi.», then «Waktu berjalan» (elapsed, not a limit) and «Simpan & Jeda». None of these contradicts the certificate or «Lulus».
   - **From D2-R, add directly after `posttest.intro`,** new key `posttest.tanpa_bantuan`:
     - ID: «Selama Uji Penguasaan, petunjuk, contoh, dan arah berpikir tidak tersedia.»
     - EN: «During the Mastery Check, hints, examples and thinking prompts are not available.»
   - It is drawn on certifying modes only. Sharon's §6.3a check («Waktu berjalan» implies no timed test) is hers.
2. **The evidence threshold** (§3), with Sharon.
3. **The A4 sheet's rendered check** (R-13) on the new R-b line, with whichever term §1 settles.

## 6 · No evidence threshold in 4.1 (Sharon, via Bob, 24 Nov 01:07): two words change

With no threshold, every objective below the mark goes in the one revisit list. Two of my words assumed two lists:
- **The list label:** `hasil.baca_lagi` «Baca lagi juga:» → **«Baca lagi:»** / **«Read again:»**. With no list above it, «juga» means nothing.
- **The note:** `hasil.baca_lagi_arti` claimed «Soal untuk bagian ini sedikit…». That is now **false** for objectives that had plenty of questions. Replace it with:
  - ID: «Bagian ini disarankan untuk dibaca lagi. Saran ini bukan penilaian atas penguasaan Anda pada bagian ini.»
  - EN: «These parts are suggested for reading again. This is advice, not a judgement of your mastery of them.»
- **`hasil.target.ulang` «Bagian yang masih perlu dipelajari:»** is not drawn in 4.1. It waits for 4.5's threshold.
- **Everything else in §3 stands.**

**«Materi Pembelajaran» kept (ruling 59, Dr Gladys's sentence):** accepted. The admin certificate column follows it: `sertifikat.kelola.kolom.kursus` «Materi Pembelajaran» / «Learning Material», reversing Z7's C-3. That keeps one name.

## 7 · Two strings for the build (24 Nov, 02:00)

- **`hasil.percobaan_ke` (R-f):** «Kesempatan ke-{n}» / «Attempt {n}». Learners and teachers say «kesempatan» (T-08), so this replaces the provisional «Percobaan ke-{n}».
- **Certifying STANDALONE «no help» line:** new key `posttest.tanpa_bantuan_umum`, drawn after STANDALONE's intro, when it certifies:
  - ID: «Selama asesmen ini, petunjuk, contoh, dan arah berpikir tidak tersedia.»
  - EN: «During this assessment, hints, examples and thinking prompts are not available.»
  - Uji Penguasaan keeps `posttest.tanpa_bantuan`.

## 8 · `hasil.tidak_ditampilkan` reworded, so DAISY-26 needs no exemption (24 Nov, 03:33)

DAISY-26 bans «kunci jawaban» from every learner line, because it can be read as "lock the answer". My own §3 line broke it. **Reword rather than exempt:** a guard with a named exception invites the next one.
- ID: «Pada Uji Penguasaan, jawaban yang tepat dan hasil tiap soal tidak ditampilkan.»
- EN: «In a Mastery Check, the right answers and the result of each question are not shown.» (unchanged in meaning)
- **«tepat»** matches the counts line («5 dari 6 soal dijawab tepat»). It also avoids «benar … benar atau salahnya» in one sentence.
- **Second Eye's exemption** (`claude/d2r` `c37e6884`, D2R-HANDOFF.md) can be removed once the key carries these words.

## 9 · A passed result with sections below the mark, and the certificate on the result (ruling 74a items 2 and 4; 24 Nov, 04:10)

**«Baca lagi:» after «Lulus.» works as written.** The note («Bagian ini disarankan untuk dibaca lagi. Saran ini bukan penilaian atas penguasaan Anda pada bagian ini.») is advice in either outcome, and it does not contradict a pass. No variant is needed.

**The order on a pass:**
1. «Lulus.» with `hasil.lulus_arti`;
2. the certificate (below);
3. «Baca lagi:» with its note, only when some section is below the mark;
4. the counts and «Kesempatan ke-{n}»;
5. `hasil.tidak_ditampilkan`.

There is no retake line on a pass. The certificate comes before the advice, because it is what the learner came for.

**The certificate on the result (this closes 1f's C-1):**
- **Issued** (the certificate renders as a credential): a link to `/belajar/{tugas}/sertifikat` with `siklus.lihat_sertifikat`, «Lihat sertifikat» / «See the certificate».
- **Not yet issued:** the same link, preceded by `sertifikat.disiapkan.judul` as one line: «Sertifikat Anda sedang disiapkan.» / «Your certificate is being prepared.»
- **Not `sertifikat.disiapkan.arti`:** its «akan muncul di sini» means the certificate page, and it would be false on the result page.
- **The Hasil Belajar row:** the same link, without the line.

## 10 · The support screen's next step, under ruling 90 (24 Nov, 04:15)

**Ruling 90:** PINTAR promises no response within a set period unless an operational process can fulfil it. Option (b) of `BACA-REGISTER-PR12-15-19.md` §1 is improved here: each line now says only what the product does today.

| Key | ID | EN |
|---|---|---|
| `lapor.langkah.awal` | «Laporan ini sudah tersimpan. Admin sekolah Anda dan tim PINTAR dapat membacanya.» | «This report is saved. Your school admin and the PINTAR team can read it.» |
| `lapor.langkah.awal_kelas` | «Laporan ini ditandai menghentikan kelas. Admin sekolah Anda dan tim PINTAR melihat tanda itu, dan laporan ini tampil lebih dulu di antara laporan yang belum ditangani.» | «This report is marked as stopping a class. Your school admin and the PINTAR team see that mark, and it is listed first among reports not yet handled.» |

**Why these words are true today:**
- **«dapat membacanya»** matches `lapor.privasi` («… dibaca oleh Anda, Admin sekolah Anda dan tim PINTAR»). It names who can read the report, not when.
- **«tampil lebih dulu di antara laporan yang belum ditangani»:** a new report is `DITERIMA`. The triage list orders by status (`DITERIMA` first, in enum order), then `stops_class` first (`lapor-masalah.ts:85`). Among reports not yet handled, a class-stopping report is first.
  - It does not claim to stay first once handled.
  - It does not claim faster reading. Option (b)'s «dibaca lebih dulu» claimed that, and was dropped.
- **Dropped from option (b):** «di sini». The reporter is not looking at the triage list, so «here» pointed at nothing.
- **No time period anywhere.** The time-bound wording waits for 4.5-OF-SUP, or for PR-12 and PR-15 to name a monitored process.
- **The key «Langkah berikutnya:»** heads both lines, and still reads correctly.

## 11 · Hasil Belajar and its print: sections on a certifying result, passed or not (24 Nov, 04:20)

**Decision: the row lists the sections on a pass too** (ruling 74a item 2 applies to every certifying result). The print is what goes home, so the advice must read as advice without the result page's note beside it. The row therefore carries the advice in its own words.

**On a certifying result (Lulus or Belum lulus), new keys:**

| Key | ID | EN |
|---|---|---|
| `hasilbelajar.baca_lagi` | «Disarankan dibaca lagi: {daftar}.» | «Suggested for reading again: {daftar}.» |
| `hasilbelajar.baca_lagi_banyak` | «Ada {n} bagian yang disarankan untuk dibaca lagi; semuanya ditandai «baca lagi» di bagian B.» | «{n} parts are suggested for reading again; each is marked «read again» in section B.» |
| `hasilbelajar.baca_lagi_tanda` (the mark in section B) | «baca lagi» | «read again» |

**Rules:**
- The verb is «baca lagi», as on the result page («Baca lagi:», §6). One concept, one name, so «pelajari lagi» is not used on certifying rows.
- **Pass and not passed use the same words.** The verdict beside them says which result it is. On «Belum lulus», the existing gate and teacher lines (`hasilbelajar.gerbang`, «… tanyakan kepada guru …») stay as they are.
- **Non-certifying rows** (Pemetaan Awal, Uji Cepat, practice) keep `hasilbelajar.ulang`, `hasilbelajar.ulang_banyak` and «pelajari lagi», unchanged.
- **The certificate on the Hasil Belajar row:** the link only (§9). Not `sertifikat.disiapkan.arti`.

## 12 · The C line on a certifying «Belum lulus» row (24 Nov, 04:38)

`hasilbelajar.berikutnya_ulang` quotes the mark «pelajari lagi». On a certifying row, section B now marks «baca lagi» (§11), so the quote would point at a word the page does not show. **New key, certifying rows only:**
- `hasilbelajar.berikutnya_baca_lagi`
  - ID: «Baca lagi bagian yang ditandai «baca lagi» ({daftar}), lalu tanyakan kepada guru langkah berikutnya.»
  - EN: «Read again the parts marked «read again» ({daftar}), then ask your teacher for the next step.»
- **Non-certifying rows** keep `hasilbelajar.berikutnya_ulang` unchanged.
