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
