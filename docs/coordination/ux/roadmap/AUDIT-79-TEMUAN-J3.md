# Ruling 79 audit · J3, the gate, the retake and the new result: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J3 walked** on a local load of the audit world at `claude/audit-79-world` `00fe853d` (`muat.sh`, all 15 parts, checks passed; product = main `429b7dcc`). Three people:
>   - **learner:** Sinta Maharani, 8K, 83 % against 60 % with the must-be-right question missed;
>   - **teacher:** Bambang Sutrisno;
>   - **approver:** Made Wirawan, the head of department.
> - **Steps:** the gate result on all three surfaces → the teacher's retake request → approval → the learner after approval → the retake begun and left open (both sides) → the retake finished (attempt 2).
> - **Not walked here:**
>   - W7b, the retake abandoned, and W8, the gate unreadable: both need the per-journey fixtures (`muat.sh --fiksasi`);
>   - the screen reader, throttled and reduced-motion passes.
>   All come from the builder's capture run.
> - **Captures:** `audit79-j3/`, at 390.
> - **9 findings: 5 Significant, 4 Improvement, none Critical.**
> - **The core cross-role check holds:** the verdict is the same on all three surfaces. The learner reads «Belum lulus … soal penting …»; the teacher «83% belum mencapai target: soal penting belum tepat»; the approver «hasil terakhir 83%, target 60% belum tercapai: soal penting belum tepat». Only the words differ (L-33).

## Significant

| # | Finding | Seen | Dim. | Fix |
|---|---|---|---|---|
| **J3-1** | **While a retake is open, the learner's result page is «Halaman ini tidak ada».** The earlier result vanishes behind a 404. The agreed design keeps it in force with `hasil.ulang_berjalan` («Uji Penguasaan ulang sedang berlangsung. Hasil yang tampil adalah hasil uji sebelumnya.»), and the teacher's side does show that line | `j3-17`, `j3-18` | B, C | The learner's result page renders the previous result with `hasil.ulang_berjalan` and a link back into the open sitting |
| **J3-2** | **After the retake, the teacher's record shows two Uji Penguasaan rows** («83% … soal penting belum tepat» then «17% di bawah target»), each with «Minta membaca lagi», neither saying which attempt it was or which is now in force. The older one is listed first. The learner sees only attempt 2 | `j3-21` | B | Each row is labelled «Kesempatan ke-{n}» (L-43). The row in force is first and marked as current; earlier attempts are folded under it. «Minta membaca lagi» goes only on the current one. **Widens L-43** |
| **J3-3** | **After approval, the learner's start page contradicts itself:** «Tidak ada lagi yang menunggu — Semua yang disediakan untuk Anda sudah selesai.» at the top, with «Uji Penguasaan dapat dikerjakan sekali lagi · Mulai» further down | `j3-15` | B, H | An approved retake is «Langkah berikutnya» at the top: «Uji Penguasaan dapat dikerjakan sekali lagi.» + «Mulai» |
| **J3-4** | **After approval, the result and chapter pages still say «ask your teacher».** The result: «Tanyakan kepada guru Anda kapan dapat mengulang.» The chapter: «Selesai», with «Lihat hasil» and no way into the retake. Only the start page's card shows the retake | `j3-02`, `j3-13`, `j3-14` | H, B | On an approved retake: the result's retake line becomes «Kesempatan berikutnya sudah disetujui.» + «Mulai Uji Penguasaan», and the chapter panel offers it |
| **J3-5** | **The approver's page contradicts itself:** «1 permintaan kesempatan tambahan menunggu persetujuan» at the top, then «Bagian A · Keputusan — Tidak ada keputusan yang menunggu Anda.» A retake approval is a decision | `j3-09` | B | The retake request is counted in Bagian A, or Bagian A's empty line becomes «Tidak ada keputusan lain …» while a request waits |

## Improvement

| # | Finding | Seen | Dim. | Fix |
|---|---|---|---|---|
| J3-6 | The chapter page after a not-yet-passed result says «Selesai» with the map's «Mulailah dari kartu paling atas…» line (J2-3's root), and the map still marks every section «Sudah kuat … boleh membacanya sekilas» while the result says «Baca lagi: Menyelesaikan Persamaan». The map is stale against the newer result | `j3-02` | B, H | After the Uji Penguasaan, the map shows the result's «Baca lagi» sections (or the map's line says it is from the Pemetaan Awal). The panel says «Belum lulus» with the result link |
| J3-7 | The teacher's retake request is offered only in the «Atur» panel of the sittings list. Sinta's own record page, which shows the gate result, offers only «Minta membaca lagi», and the learner is told to ask her teacher | `j3-05` | F, A | On the learner's record, beside a «belum lulus» certifying result: «Minta satu kesempatan lagi» (the same form) |
| J3-8 | One verdict, different words on the learner's own pages: the result «Belum lulus»; the start card «Selesai · belum mencapai target»; Hasil Belajar «0 dari 1 bab … sudah mencapai target» | `j3-15`, Hasil Belajar | B | With L-33 and J2-5 |
| J3-9 | Approving a retake is one press with no confirmation, while refusing needs a reason. That is acceptable: approval is the requested action and is audited. Noted only for the E pass | `j3-11` | E | None proposed |

## Holds (checked)

- **The teacher's request form** says who approves, that the learner cannot retake until then, and that the old result stays. The confirmation is «✓ Permintaan dikirim, menunggu persetujuan.», and the row shows «Kesempatan tambahan diminta · menunggu persetujuan».
- **The approver's card** shows the learner, the class, the test, «1 kesempatan dipakai», the verdict with its reason, who asked and why. A refusal reason is read by the teacher, not the learner (as said).
- **The retake's intro** carries `posttest.tanpa_bantuan`. The new result reads «Kesempatan ke-2» and replaces the old one on every learner surface.
- **A fixture question, not a finding:** the teacher's «Layak dikerjakan lebih dulu: Persamaan Linear Satu Variabel … belum disediakan untuk 8K» refers to the school's own publication of the same title, not the world's «(8K)» copy. Real schools are unlikely to have two same-named publications; the builder should confirm.

## Capture judgement · the builder's committed J3 (`6792ecb9/j3`, `3c1af1ae`), 24 Nov 12:30

| Item | Verdict |
|---|---|
| **W7a (retake open)** | The learner's result is a 404 (**J3-1 / L-54**, confirmed). The teacher's «Uji Penguasaan ulang sedang berlangsung …» holds |
| **W7b (retake ended, not counted)** | The learner's result is still a 404 (added to L-54 by Bob, C-1). **New, partly good:** the learner's start card now says «Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda. Jawaban yang sudah tersimpan tetap ada.», which is exactly what J4-1 asks for in the not-counted case. But it sits under «Siap untuk Uji Penguasaan» + «Lanjutkan Uji Penguasaan» (**J4-3**) |
| **W8 (gate unreadable)** | **New, J3-10 (Significant): the learner gets counts and no decision, with no reason.** The learner's result reads only «5 dari 6 soal dijawab tepat · Kesempatan ke-1 …», with no «Lulus» or «Belum lulus» and no word why. The teacher reads «belum dapat disimpulkan apakah target tercapai · target 60%» + «Data soal penting untuk hasil ini tidak dapat dibaca sekarang. Muat ulang halaman ini nanti.» **Siblings disagree** (C-3). **Fix:** the learner's result: «Keputusan lulus untuk Uji Penguasaan ini belum dapat ditentukan sekarang. Hasil Anda tetap tersimpan. Buka halaman ini lagi nanti.» (vocabulary: «belum dapat …»; no blame) |
| **L-43** | Confirmed in every state: no «Kesempatan ke-{n}» on the teacher's record |
