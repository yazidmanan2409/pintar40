# Katalog fitur, revision 2 · factual wording changes for Bob to check

Status snapshot: **18 November 2026**. Please confirm the release states below before the final export. Nothing here changes scope or the roadmap.

## The five points the owner asked me to check with you

1. **Emergency stops (4.0 vs 4.1 A2a).** Two entries changed.
   - *4.0 «Pemeliharaan terjadwal dan penghentian darurat».* It now gives only the verified 4.0 behaviour (THE PLAN §5.3 C, D6):
     - the platform admin schedules maintenance for the platform or for listed schools;
     - notices come at 60, 30 and 15 minutes, starts are blocked from T−15, and running sittings finish;
     - the emergency stop covers the platform or one school, with a reason and a typed phrase.
     - New note: *"Di 4.0, waktu sesi asesmen tetap berjalan selama penghentian darurat. Jaminan … sisa waktu yang persis sama datang di 4.1."*
   - *4.1 «Penghentian darurat yang menahan sesi asesmen».* This entry now carries the guarantee:
     - class, school or platform scope;
     - sittings held with their accepted answers;
     - nothing silently submitted or scored;
     - resumption with exactly the remaining time.

     Source: owner ruling D-1, 11 Nov, and your status report. The Makassar example moved here from the 4.0 entry.
   - **Please confirm** that "deadlines keep running" is still the correct description of the 4.0 stop on its own.
2. **School data export and accountability.**
   - *4.1 «Catatan masuk dan cetak».* "Mengekspor" is removed. The entry now lists only sign-in, failed sign-in, sign-out and requests for an official print (THE PLAN D-4). It gains the note *"Ekspor data sekolah, beserta catatan akuntabilitasnya, baru hadir di 4.2."*
   - *4.2 «Ekspor data sekolah».* It now says the export arrives with its accountability event: who, scope and when.
   - **Your report of 18 Nov §3 says B1 records "prints and exports".** Does that mean something other than the school data export, such as a report download? If so, I'll restore it in the wording you give.
3. **Two-school roles.**
   - The entry stays in 4.2.
   - Its planning block states the open question in the owner's terms (D-03): whether a platform-admin suspension, for a reason arising at one school, ends the person's work at every school.
   - The catalogue does not state the code's current answer.
4. **Question Health.**
   - *4.2 scheduled refresh.* Status «Direncanakan», with a note: *"Tercatat dalam rencana 4.2 melalui rencana pelaksanaan; penempatannya sedang ditinjau. Beberapa dugaan keterbatasan perhitungan … masih harus dibuktikan saat sistem berjalan."* Planning state: «Menunggu keputusan» (D-12, after the runtime proof). This follows your audit row 4.2-12 and Daisy's disagreement (move it to 4.5).
   - *4.5 «Perbaikan perhitungan statistik soal».* Reworded from "diketahui masih memiliki keterbatasan" to "suspected from code inspection, to be proved at runtime first".
   - **If D-12 has been decided, tell me the decision and I'll use it.**
5. **AI drafting and import.**
   - *«Draf soal dengan AI terpadu PINTAR».* Now: a planned optional paid school add-on; when offered, schools choose from PINTAR-qualified options. Status stays «Selesai dirancang, belum dibangun» (C3w design approved). Ruling 44 is kept as the note.
   - *«Impor Studio untuk soal buatan sendiri atau draf dari AI luar»* (renamed). Standard Studio import is described as the route for both manually written and externally drafted content.
   - No provider names, evaluation findings or prices appear anywhere. The technical reference's "E" row was removed, and a line says the catalogue names none of these.

## Release states to confirm (snapshot 18 Nov)

| Release | What the catalogue says | Source |
|---|---|---|
| 4.0 (48) | «Diterima di lingkungan uji» on 10 Nov · «Belum tersedia di sekolah» | Your status report §1 |
| 4.1 (19) | **13** «Diterima di lingkungan uji» (B0, A1, C1w, B1, B2, A2a, A2b, the uniform refusal, and the Studio import route); **5** «Sedang dikembangkan» (C2w ×2, A3 ×3); **1** «Selesai dirancang, belum dibangun» (C3w). All «Belum tersedia di sekolah» | Status report §3–§5; OWNER-RETURN-18NOV 07:58 |
| C2w note | *"Pemilik PINTAR sudah menyetujui pemindahannya ke lingkungan uji; penggabungannya masih menunggu satu pemeriksaan otomatis."* | OWNER-RETURN-18NOV 07:58 (merge refused by the required-check rule). **Please confirm or correct if it has merged since** |
| 4.2 (13) | «Direncanakan». Planning state: 1 siap, 3 sebagian siap, 9 menunggu keputusan, with the open choices in reader terms | Planning audit rev. 4, rows 4.2-01 to 4.2-13 |
| 4.5 (11) | «Arah disetujui», a new label replacing «Direncanakan». Planning states from rows 4.5-01 to 4.5-12 | Planning audit |
| 5.0 (6) | «Arah disetujui». Each entry shows «Bergantung pada» with its 4.5 foundations; four are «Tertahan» | Planning audit rows 5.0-01 to 5.0-05 |

## Other factual wording changes

- **4.1 «Pemeliharaan terjadwal per kelas dan per sekolah»** (renamed). It now says scope can be one class or more, and that school admins schedule for their own school (A2b; THE PLAN §5.3 "school admins (planned)").
- **4.5 «Empat jenis pernyataan».** The reader names follow Daisy's proposal: «tercatat», «dihitung», «perkiraan», «belum dapat disimpulkan». The note says the names are still a proposal.
- **Planning blocks (4.2, 4.5, 5.0).** The open choices are paraphrased from your audit's owner and policy questions (D-01, D-02, D-03, D-04a/b, D-05, D-06, D-10, D-11a/b, D-12, R-1, R-2, R-4, R-5, D-45-11, D-45-12, D-50-01, D-50-05). The codes are not printed. **Please check that each paraphrase is faithful.** The mapping is in `rencana.mjs`.
- **«Hari-hari biasa di sekolah».** A new section of five situations based on Daisy's J42-0 and J42-9 to J42-12. It is not counted as features, and every linked entry shows its own status, so the planned 4.2 parts are visibly planned.

## Unchanged from your earlier check (still open from my first request)

- Which description of «Catatan peninjau» is current: your report, or handbook 10.9.
- Whether «Laporkan masalah» belongs in 4.0, and whether class feedback rounds and the demonstration room should appear.
- `PINTAR-ROADMAP.md` and `ROADMAP-RECONCILIATION-2026-11-11.md` are on no branch, so Rev 3 is used in their place.

---

## Revision 3 · Bob's answers applied (18 Nov, about 09:00 UTC)

Source: `BOB-VERIFIKASI-KATALOG-0a336a9a.md`.

| Change | Where |
|---|---|
| 4.2 label is now «Ditunda ke 4.2; rencana rinci belum disusun» (owner deferrals, no approved plan), in the legend, the overview and the chapter introduction | `fitur.mjs` STATUS.P, `build.mjs` |
| 4.5 and 5.0 label is now «Arah disetujui; belum direncanakan»; implementation needs separate planning and authorisation | STATUS.A, overview, 4.5 introduction |
| «Catatan peninjau» is described as free-text, attributed, dated and immutable notes beside a sealed question; never shown to learners, printed or used in calculations; explicitly not coded misconception notes | `41-catatan-peninjau` |
| `40-tinggalkan`: a learner is told the request goes through the school with the family; the deletion process is a later item (cross-reference to the candidates chapter) | `40-tinggalkan` |
| **New 4.5 entry: «Pemetaan pemahaman keliru»**, in «Menunggu keputusan» (structured codes; whether reviewer notes may ever be a source, which today they may not be). 4.5 is now 12, and the total is **98** | `45-pemahaman-keliru`, `rencana.mjs` |
| «Quiet Intelligence» notes that it is an English working name and that the owner chooses the Indonesian one | `45-quiet` |
| 4.1 additions are explicit: the class-level emergency stop; class- and school-level scheduled maintenance | `41-darurat`, `41-pemeliharaan` |
| `45-perbaikan-statistik` adds the note «Temuan dugaan dari pemeriksaan kode; belum diverifikasi saat berjalan» | `fitur.mjs` |
| `42-kesehatan-terjadwal` says its schedule depends on first checking the existing calculations | `fitur.mjs` |
| Planning states now follow audit rev 6 (`71a6f87e`). The name-correction entry now says that adding one person can be planned now and that only the certificate effect waits on a decision, with today's fact that verification never shows a name. No open choice is written as decided | `rencana.mjs` |
| The coverage checklist records the roadmap sources as on `claude/roadmap-45-50` (`2f419b52`), not on `main`. Class feedback rounds and the demonstration room are confirmed out | `KATALOG-COVERAGE.md` |

**Unchanged by design:** C2w stays «Sedang dikembangkan» with its current note until Bob confirms the merge and the staging promotion. «Laporkan masalah» was already listed in 4.0. The audit's scoring-policy prerequisite (4.5-10) is internal and is recorded in the coverage checklist, not as a feature.

**Still waiting before the final export:** Bob's word on C2w, plus a check of the new misconception-mapping entry and the D-06 paraphrase.

### Update · C2w accepted (18 Nov, 09:30 UTC)

This follows owner ruling 53 (`4a049c7a`, claude/bob-41-master-plan) and Bob's message:
- Both C2w entries («Catatan peninjau di samping soal», «Menarik materi dari peredaran sekolah») now read «Diterima di lingkungan uji», with the date 18 November 2026. They have moved into the accepted group, and the "waits on one automated check" note is gone.
- 4.1 is now **15 accepted, 3 in development (A3), 1 designed (C3w)**. All 19 read «Belum tersedia di sekolah».
- The 4.1 introduction now says eight of ten stages are on staging; one is in progress, and one is designed but not built.

With this, every open point from Bob's verification is applied.

### Bob's final answers (18 Nov, 09:45 UTC)

- **«Pemetaan pemahaman keliru»:** confirmed.
- **`42-satu-orang`:** confirmed, with one precision, now applied. "Verification never shows a name" is printed as a note on the entry, as today's behaviour: «Pemeriksaan keaslian sertifikat tidak pernah menampilkan nama. Ini sudah berlaku sekarang, bukan keputusan baru.» The open choice is now only what happens to certificates already issued.

Bob has verified the catalogue for the final export. The owner publishes.

---

## Revision 4 · owner rulings 63–74b (23 Nov)

Source: `OWNER-RULINGS-4.1.md` on `claude/bob-41-master-plan` at `3b5edd66`. Each change was read from the rulings themselves; Bob's 22 Nov message was used only as a pointer.

| Ruling | Change in the catalogue |
|---|---|
| 72 (and 71) | **4.2 is retired as a chapter.** Its 13 entries move into 4.5 as four «Operasional: … (semula 4.2)» groups, with ids `42-*` and planning rows unchanged. Their status reads «Disetujui untuk 4.5; belum dibangun»; the rest of 4.5 stays «Arah disetujui; belum direncanakan». 4.5 is retitled «Kematangan Operasional dan Pemahaman Hasil Belajar», and its introduction says the operational foundations are built first. There are now **four releases** («Empat rilis sekilas»). The 4.1 text no longer places an educator walkthrough at 4.1: there is one comprehensive review after 5.0, and school availability needs the owner's separate release approval |
| 63 | A3's three entries are «Diterima di lingkungan uji» (19 Nov). 4.1 is now **18 accepted, 1 in development, 1 designed** |
| 64–65 (Bob's summary) | «Draf soal dengan AI terpadu PINTAR» is «Sedang dikembangkan»: built against a stand-in provider with no real AI calls, single-answer drafts, accept or delete before review, and a personal-data check. The optional paid add-on wording is kept |
| 74, 74a, 74b | **New 4.1 entry «Hasil Uji Penguasaan yang tidak membuka kunci jawaban»** (D2-R, after Z; status «Selesai dirancang, belum dibangun»). It covers: no help in certifying assessments; Lulus or Belum lulus, eligibility, sections still to learn (named only with sufficient evidence, otherwise advice to revisit), a retake line, and counts as secondary; never keys, per-question correctness or explanations; retakes until passing under school rules; «Sertifikat» without predikat; no "mastered" claim before 4.5; diagnostic, quick-check and practice keep full feedback. Short "Diputuskan untuk 4.1" notes are added to `40-bantuan`, `40-uji-penguasaan`, `40-hasil` and `40-sertifikat` |
| 73 | Note on `40-pindah-sekolah`: if the requesting admin is later suspended or loses authority, the transfer waits for another authorised admin of the originating school to confirm it on their own authority (4.5) |
| 66–68 | **New 4.5 entry «Mode Jelajah untuk tamu»** («Arah disetujui; belum direncanakan»): a disposable copy per visitor with fictional data and no login, three perspectives, and context-aware «Bagikan PINTAR». Note: planning resumes after 4.1 is accepted, and children's public access needs privacy, safeguarding and legal review |
| 69, 69a, 69b | Technical reference gains «Perangkat dan browser». It covers the minimum and recommended Windows versions, preferred browsers per platform with alternatives, and that PINTAR never requires one browser. Automated tests currently run on Chromium only, and version floors are set in the post-4.1 review |

**Also:**
- Candidate statuses that said "after 4.2" now read «di luar lingkup 4.5 yang disetujui».
- The overview no longer says schools use the September version. It says production is still the September version and no school uses 4.x.

**Unchanged:** no provider names, evaluation results, prices, reviewer names or real-person data appear in the PDF (checked).

---

## Revision 5 · Sol's editorial brief (23 Nov)

Source: Sol's review and consolidated brief, passed on by the owner. It applies on top of revision 4, and no ruling has changed.

**For Bob to confirm**
1. **Count.** The former 4.2 list is now **14 entries**: 4.2-06 is split into «Menambahkan satu orang» (4.2-06a, `42-satu-orang`, «Sebagian siap») and «Membetulkan nama setelah akun aktif» (4.2-06b, `42-koreksi-nama`, «Menunggu keputusan», D-06), following `MASTER-SEQUENCE-4.1-TO-5.0.md` §2a. The planning states for the 14 are 1 siap, 4 sebagian siap and 9 menunggu keputusan. The catalogue total is **101** (4.0: 48, 4.1: 20, 4.5: 27, 5.0: 6) plus 14 candidates.
2. **«Lihat per soal» (`40-per-soal`).** The sentence "Hanya jawaban yang sudah dikumpulkan yang dipakai" is **removed** until you confirm it; Sol raised it under verification finding V3, which I can't find. Does the teacher's per-question page use final answers only?
3. **Statuses** are unchanged from revision 4: 4.1 is 18 accepted on staging, 1 in development (C3w-1) and 1 «Rancangan disetujui; belum dibangun» (D2-R).

**Changes**
- **Release titles:**
  - 4.0 «Fondasi yang Dapat Dipercaya»;
  - 4.1 «Integritas, Kendali, dan Keandalan»;
  - 4.5 «Penyempurnaan Operasional dan Memahami Bukti Pembelajaran».
- **4.5 structure:** two workstreams.
  - **A:** operational foundations: the 14 former 4.2 entries, plus WhatsApp sign-in, unusual-access checks and Guest Mode.
  - **B:** measurement, understanding and educator protections.
  - Groups are prefixed «A ·» and «B ·».
- **Status label:** R is now «Rancangan disetujui; belum dibangun».
- **Assessment timing.** Uji Cepat's 10/15/30 minutes is the time it stays open for the whole class, not a duration per learner. «Mengatur sesi asesmen satu murid» now *extends the learner's closing time*, with no minute range given, and states that PINTAR has no per-assessment duration. «Sisa waktu» now reads «sisa waktu hingga batas pengumpulan» in the emergency-stop and suspension entries. The everyday example says the Uji Cepat «dibuka selama sepuluh menit».
- **Diagnostic, not mastery.**
  - Pemetaan Awal "estimates which sections to read first" and states that it makes no mastery claim.
  - Peta Bacaan's labels are «Wajib / Disarankan / Sudah kuat» and are described as reading guidance, not mastery. The text also says lesson order is the same for every learner and all sections are read before the Uji Penguasaan (verified in code).
  - The "about PINTAR" text no longer says learners start "from the point that suits their ability".
- **Retakes.** A note on «Kesempatan tambahan»: no general retake limit; retakes until passing follow the school's access, approval and scheduling rules, including this second approval (ruling 74).
- **Certifying results.** The D2-R entry now distinguishes «belum dikuasai» (only with sufficient evidence) from insufficient evidence. It is marked as approved and planned, to be updated after staging acceptance.
- **Question Health** gets a note that suspected calculation limits are proved and corrected in 4.5, and that its signals are early indicators until then. «Lihat per soal» says the questions most often answered wrongly may point to the question, not only the learner.
- **Three ways to write questions.** The group is now «Tiga cara menyusun soal: sendiri, AI luar, atau AI terpadu». The import entry now also says PINTAR does not ask for a school's AI account, password or key.
- **Candidates.** The two former 4.2 candidates read «Kandidat, belum disetujui untuk rilis mana pun (semula kandidat 4.2)», so neither reads as approved 4.5 scope.
- **Availability.** The legend says school availability needs the owner's separate release approval, and finishing 4.1 does not by itself mean schools have it.
- **New everyday situation**, «Belajar, ujian, dan mengulang sampai lulus»: practice with help, then a certifying exam without help, then qualitative feedback with no keys, then re-reading, a retake and a pass. Every linked entry shows its own status; the result rules are marked as built in 4.1 after Z.
- **Closing section.**
  - The progression 4.0 «Menunjukkan apa yang terjadi» → 4.1 «Menjaga bukti tetap dapat dipercaya» → 4.5 «Membantu memahami bukti» → 5.0 «Membantu bertindak dan berkembang».
  - The development sequence, with internal gates per stage and one review with educators after 5.0.
  - A boxed **6.0 long-term direction** (contextual intelligence as a possible research direction; "anticipation is not automation"). It is marked outside the feature inventory and as not designed, built or scheduled.
  - The closing motto now also reads «PINTAR menunjukkan bukti, bukan vonis.»

**Unchanged:** no provider names, evaluation results, prices, reviewer names or real-person data appear in the PDF (checked).

### Revision 5 · Sol's three confirmation points (23 Nov)

- **Exam journey (ruling 74a).** Fixed: the story now opens by saying it describes the rules approved for 4.1 but not yet built, and that Uji Penguasaan still uses the old rules. It ends by saying the rules take effect only after acceptance. The earlier closing line ("sudah disetujui dan dibangun") could be read as already built.
- **Guest Mode.** It remains «Arah disetujui; belum direncanakan», with planning paused until 4.1 is accepted. This matches rulings 66–68 and 71; no later ruling on `claude/bob-41-master-plan` (`3b5edd66`) changes it. Bob to confirm.
- **Double counting.** Entry pairs where one refines another, each counted separately on purpose. Bob to confirm or merge:
  1. `40-darurat` (4.0 stop) / `41-darurat` (4.1 adds class scope and holding sittings);
  2. `40-darurat` (4.0 maintenance) / `41-pemeliharaan` (4.1 adds class and school scope);
  3. `40-kesehatan-soal` / `42-kesehatan-terjadwal` (scheduled refresh) / `45-perbaikan-statistik` (corrections);
  4. `40-uji-penguasaan`, `40-hasil`, `40-sertifikat` / `41-hasil-bersertifikat` (D2-R; the 4.0 entries carry notes, not new entries);
  5. `41-kesempatan` / `41-kesempatan-versi`;
  6. `42-satu-orang` / `42-koreksi-nama` (4.2-06a/b, split per MASTER-SEQUENCE §2a);
  7. **The one I think may be a real double count:** `40-paket` (workbook import, 4.0) / `41-ai-sendiri` (the same import route; what 4.1 adds is the external-AI guide). If Bob agrees, `41-ai-sendiri` becomes a note on `40-paket`, and the total drops to 100.

### Bob's answers applied (23 Nov, 23:55 UTC)

- **«Lihat per soal».** The sentence stays removed. The finding is V4 / Z-READINESS R-23: one rule for every reader, in 4.5.
- **Guest Mode.** Status now reads «Arah disetujui; rencana awal tersedia, belum disetujui untuk dibangun» (a per-entry label with the same diamond mark). The note reads "setelah gerbang 4.1 ditutup".
- **"After 4.1 is accepted"** is replaced everywhere: the 4.0 introduction now reads «setelah gerbang 4.1 ditutup dan pemilik PINTAR menyetujui rilisnya». No other occurrence was left.
- **Merge.** `41-ai-sendiri` is now a «Diputuskan di 4.1» note on `40-paket`, covering the external-AI drafts route, the guide, no fee, no AI account or key requested, and no special AI format. The «Tiga cara menyusun soal» group keeps the integrated-AI entry, which now points to `40-paket` as the other two ways. **Total 100**: 4.0 48, 4.1 19 (17 accepted, 1 in development, 1 designed), 4.5 27, 5.0 6.
