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
