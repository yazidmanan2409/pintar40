# THE PLAN, revision 5: UX and human-journey review (Daisy, 11 Nov 2026)

**Document reviewed:** `docs/completion-4.1/THE-PLAN.md` on `claude/bob-41-master-plan` at **`9cd5e885`** (revision 5, final approval candidate).

**Read against:**
- `DESAIN-AWAL-4.1.md` and `TINJAUAN-A1-C1W.md` on this lane;
- the code of B0, A1 and C1w as built, at `claude/system-integrity-4.0` `3a190dbf`: `src/lib/hle.ts`, read only.

**Scope:** a review only. Nothing is implemented, merged or deployed.

**This verdict is pinned to `9cd5e885`.** Bob is making minor corrections to revision 5. My final PASS or BLOCKED is confirmed against the same final document commit as Sharon's.

## Verdict: **BLOCKED on `9cd5e885`**

The verdict rests on **two text corrections** below. Both are wording inside the plan, with the replacement text supplied. Neither reopens a decision.

If both land in the final commit and nothing else changes, my verdict on that commit is **PASS**. Everything else is non-blocking.

### Blocker 1 · B2: two browser-print rules contradict each other

- **§5.2 D, point 4,** says: «A browser print (Ctrl+P) carries no reference and claims no audit … **the footer prints page numbers only, as today.**»
- **§5.2 F** says the browser print's default footer is «**Dicetak dari browser oleh {nama} · {waktu} · tanpa nomor referensi**», shrinking to «Dicetak dari browser · tanpa nomor referensi».
- **The reconciliation record** says the plan moved from the first rule to the second. D4 was not updated.
- **D3** adds that after `afterprint` «the footer values are cleared». Read with D4, that leaves a blank footer; read with F, it returns to the browser line.

An engineer cannot build both. **F is the adopted composition** (`DESAIN-AWAL-4.1.md` §1, edge state 2, revised to the owner's 9 Nov direction). Replace D3's last sentence and D4 with:

> 3. … After the print dialog closes (`afterprint`), the footer returns to the browser line of F.
> 4. **A browser print (Ctrl+P) carries no reference and claims no audit** (owner, 9 Nov). Its footer is the browser line of F: «Dicetak dari browser oleh {nama} · {waktu} · tanpa nomor referensi».
>    - The name is rendered with the page for the signed-in person.
>    - The time is filled at `beforeprint`, in the school's zone with its word.
>    - If either cannot be filled, the line shrinks to «Dicetak dari browser · tanpa nomor referensi».
>    - It never contains «Ref.», a placeholder, or anything shaped like a reference.

**§5.2 H** («a browser print without the button shows no reference») and **I-2** stand as written. Add to H: «and shows the browser line».

### Blocker 2 · A2: the during-stop line shown to students today becomes false under D-1

- **§5.3 F, «What Daisy must revise»,** lists my after-lift sentence. It misses the line students already see **during** a stop.
- The live key `pemeliharaan.darurat.asesmen` (`hle.ts` at `3a190dbf`) reads: «Penghentian ini tidak mengumpulkan asesmen yang sedang dikerjakan. … **Bila waktunya habis selama penghentian, beri tahu guru Anda.**»
- Under D-1, a held sitting loses no time. So the screen would tell a student their time may run out, and send them to their teacher for something the system now guarantees.
- That is a false statement about the assessment's conditions, on the screen students read in an emergency.

Add it to the revision list in §5.3 F (and to §7.6's A2 row) with this text. Item 1's after-lift wording is supplied here too, so the engineer does not wait for it.

| Where | Indonesian | English |
|---|---|---|
| **During the stop:** `pemeliharaan.darurat.asesmen`, replaced | «Penghentian ini tidak mengumpulkan dan tidak menilai asesmen yang sedang dikerjakan. Asesmen itu ditahan bersama jawaban yang sudah tersimpan dan sisa waktunya. Setelah PINTAR kembali, buka lagi asesmen tersebut; sisa waktunya sama seperti saat dihentikan.» | «This stop does not submit or score an assessment that was in progress. It is held with the answers already saved and the time that was left. When PINTAR is back, open that assessment again; the time left is what it was when the stop began.» |
| **After the lift,** on «PINTAR dapat digunakan», for a student whose sitting was held (item 1) | «Asesmen yang ditahan selama penghentian dapat dibuka lagi. Jawaban yang sudah «Tersimpan» tetap ada, dan sisa waktunya sama seperti saat dihentikan.» | «An assessment held during the stop can be opened again. Answers that showed «Saved» are still there, and the time left is what it was when the stop began.» |
| **On reopening** the sitting, a `role="status"` line in the player | «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: {n} menit.» | «This assessment was held during the stop. Your time left: {n} min.» |

These hold for the edge cases of D6:
- **B3, late-sync grace:** the remaining time is zero plus the grace. The sentence still says only "what it was".
- **B4, window-timed sittings:** the moved deadline is exactly "what it was".
- **B6, a suspension-held sitting:** it stays with A1's «Ditahan · menunggu keputusan Anda». The student cannot sign in, so the line is never shown to them.

---

## The seven checks

| # | Check | Result |
|---|---|---|
| 1 | Every approved 4.1 capability has its user journeys | **Yes.** C5 (B1), C6 (B2), C7 and C8 (A2), C2 (C2w), C1 without Exam Mode (A3), C3 (C3w), each with affected users, screens and states in its F section. §8.5's five integrated journeys cover all of them, plus A1 and C1w |
| 2 | Every affected role has screens, actions, feedback and refusal states | **Yes**, with the two blockers above. The refusal wording A2 asks me for is in O-2 below, so it is ready before A2's page |
| 3 | Design-system conventions are preserved | **Yes.** §4 rule 4 names the Collection, the Dialog, the reason field, `BarisHasil`, `HalamanPenolakan`, `pin-*`, and all copy in `hle.ts` (ID and EN). The batches reuse existing surfaces: the scheduling form and pause page (A2), «Siapa» and its «Atur» panel (A2, A3), the package page and «Riwayat soal» (C2w, C3w), «Jejak audit» (B1). No second system |
| 4 | Mobile, accessibility, keyboard and responsive requirements are explicit | **Yes.** §4 rule 6 sets 1280, 390 and 320 px, keyboard only, every disclosure opened, for every batch. Each F states mobile, keyboard and print where they apply. §8.4 keeps the human NVDA and TalkBack check as a precondition |
| 5 | A1 and C1w findings reconciled with the built code | **Yes, in the code** (spot-checked at `3a190dbf`, below). The plan carries C1-R5 as N-11. The rest of my A1 and C1w register points are either built or belong to those batches' closure |
| 6 | No approved human journey missing from the remaining batches | **None missing.** The open design points the plan delegates to me are each settled below (O-3 to O-6) |
| 7 | No unnecessary redesign or scope expansion | **None found.** Every UX element traces to a capability, a ruling, or my earlier design input. The new B1 reader screen is the one C5 needs. «Cetak laporan» hidden on an empty report is my earlier §6 item 15 |

**A1 and C1w as built** (`hle.ts` at `3a190dbf`), against my review:

| Finding | Status in the code |
|---|---|
| **A1-B1** | built: `sync.diakhiri_guru_dinilai`, `sync.diakhiri_guru_tidak_dihitung`, with `sync.diakhiri_sekolah` kept |
| Teacher and student states | built: `sync.waktu_ditambah`, `sync.waktu_habis`, `sync.lanjut_sisa`; `atur.meta.ditahan*`, including «Ditahan · menunggu keputusan Anda»; «Minta satu kesempatan lagi» |
| **C1-B2** | built: `mengajar.materi.dihentikan_penerbit` |
| **C1-B1** | settled: the student's page shows the original. `hasil.dihitung_ulang` and `mengajar.murid1.dihitung_ulang` now say so consistently |
| O41-19 | built: `verifikasi.status.DITINJAU` with its explanation, and Konfigurasi «Sedang ditinjau ({n})» |

**Plan approval does not depend on** C1w's formal closure (the plan's §7.6). These are code observations, not a closure review.

---

## Non-blocking observations

None of these holds approval. Where the plan delegates a UX decision to me, I settle it here, so the engineer does not have to ask.

**O-1 · B1, the reader screen** (no pre-build UX review is planned).
- **Rows with no school** are the platform admin's only. Under D-199 they are written in **WIB, with its word**, not «the school's zone».
- **A reference that has expired** (N-3) needs its own empty state, not the plain «no match»: «Referensi ini tidak ditemukan. Catatan cetak disimpan 12 bulan, sejak {tanggal mulai}.»
- **«Outcome in plain words»:** one `hle.ts` key per failure code, said as in the sign-in screen's own refusals. For example, «Password belum cocok», never Auth's text.
- **Layout:** a Collection with stacked rows below 640 px. Do not use a wide table: the 4.0 audit's phone lessons (C1 to C3 at `ab4146da`) need not be learned again.

**O-2 · A2, the new refusal states** (its F item 2). Wording ready for the completion page:

| State | Indonesian |
|---|---|
| A teacher's act on a stopped class | «Kelas {kelas} sedang dihentikan oleh Admin PINTAR. Tindakan ini dapat dilakukan setelah penghentian diakhiri. Tidak ada yang diubah.» |
| Assignment ending or withdrawal during a stop (O1) | «Penugasan ini tidak dapat diakhiri atau ditarik selama penghentian. Tidak ada yang diubah.» |
| The promotion run during a stop (M-1, if it is refused) | «Kenaikan kelas belum dapat diterapkan: asesmen {n} murid sedang ditahan karena penghentian. Coba lagi setelah penghentian diakhiri.» |
| Activation that did not take effect (platform admin) | «Penghentian belum berlaku. Tidak ada yang dihentikan. Coba lagi.» |
| A start refused because the assessment cannot finish before the window | «Asesmen ini memerlukan {d} menit, sedangkan pemeliharaan mulai pukul {jam} {zona}. Mulailah setelah pemeliharaan selesai, pukul {jam selesai} {zona}.», tied to the disabled «Mulai» by `aria-describedby` |
| The teacher's list during a stop | «Ditahan · dilanjutkan setelah penghentian diakhiri», with no «Atur» |

**O-3 · C2w, the two points the plan leaves to me.**
- **Place:** under each question in «Soal dalam paket ini», as a second collapsed disclosure directly after «Riwayat soal»: «Catatan peninjau ({n})». A reviewer's «Tambah catatan» sits inside it.
- **Print:** annotations **do not print**, in Studio or in the class report. They are staff commentary, and a printed report is a figure-bearing document.

**O-4 · A3, the same-device case under D-2.** «di perangkat lain» is untrue when the student signed in again on the same device. Use a variant chosen by whether the device differs, if the app can tell; otherwise the neutral form:

| | Indonesian |
|---|---|
| Neutral form | «Lanjutkan di sini? Anda masuk lagi, jadi asesmen ini dilanjutkan di sesi baru. Jawaban yang sudah tersimpan tetap ada.» |
| For Uji Penguasaan | «Asesmen ini perlu diizinkan guru Anda untuk dilanjutkan, karena Anda masuk lagi.» |

The teacher's row and record keep «di perangkat lain» only when the device differs. Otherwise they read «setelah masuk lagi».

**O-5 · C3w, the three additions the plan asks of me** (its full pre-build review still applies).

| Addition | Wording |
|---|---|
| **Rights confirmation (D-5),** a required checkbox before «Buat draf» | «Saya menyatakan bahwa sekolah memiliki hak atau izin untuk memakai sumber ini dalam membuat soal.» Hint: «Pernyataan ini dicatat bersama permintaan. Pernyataan ini bukan izin hukum.» |
| **Limit reached** | «Batas pembuatan draf dengan AI untuk {bulan ini} sudah tercapai. Anda tetap dapat menulis soal sendiri.» |
| **Not yet available** (limits not set) | «Pembuatan draf dengan AI belum tersedia di sekolah ini.» The button is absent, not disabled |
| **Working** (tens of seconds) | `role="status"`: «Menyusun {n} draf soal… Ini dapat memakan waktu hingga satu menit.» On completion, focus moves to the first new card, and the status reads «{n} draf soal siap ditinjau.» |

**O-6 · A2, the teacher's list.** No act is offered on «Ditahan» while a stop is in force (O-2). After the lift, the row returns to its live state with no notice to the teacher: the student's notice is enough.

**O-7 · Register carried, unchanged** (`EXECUTION-PLAN.md` §5):
- Kenaikan step 2's «·» status line;
- the summary's group order;
- «Tambah Tingkat» suggesting «2026/2027»;
- the 320 px top bar breaking titles;
- «Kursus» in «Cabut sertifikat» (X12);
- the audit's first-Tab scroll and the 15 px header strip.

## Is THE PLAN detailed enough to build?

**Yes, once the two corrections land.** With O-1 to O-6 taken onto the batches' completion pages, every batch F section names:
- its users and screens;
- its states, including refusals;
- its wording, or the source of its wording;
- its mobile, keyboard and print rules.

The pre-build reviews that remain (B2, A2, A3, C3w, and C2w short) are confirmations against this, not open design.

---

## Addendum · revision 6 at `ed9506a7` (read the same day)

| Blocker | Status at `ed9506a7` |
|---|---|
| **1 · B2's browser print** | **Resolved.** §5.2 D3 and D4 now state the default browser line and the one referenced replacement, identically to F, and `afterprint` returns to the default |
| **2 · A2's during-stop line** | **Open.** §5.3 F's revision list is unchanged. `pemeliharaan.darurat.asesmen` («Bila waktunya habis selama penghentian, beri tahu guru Anda») is still not listed. The replacement text is in Blocker 2 above |

**Verdict on `ed9506a7`:** BLOCKED, on Blocker 2 only. It is one added item in §5.3 F's revision list and in §7.6's A2 row, with the text given above.

My final verdict is given on the final document commit, the same one Sharon reviews.

---

## Final verdict · `0b40c97758691c956581cf314c2c45b0b73d3a23` (revision 8): **PASS**

**Blocker 2 is resolved.** All three lines are in §5.3 F, item list 1 to 3, word for word, in Indonesian and in English. I compared them as text with line-wrapping removed:
- during the stop (`pemeliharaan.darurat.asesmen`, replaced);
- after the lift;
- on reopening the sitting.

The line «guru Anda yang menentukan langkah berikutnya» is recorded as withdrawn.

**Blocker 1** stays resolved (§5.2 D3, D4 and F agree).

**O-1 to O-6 are in the F sections:**

| Item | Where | Status |
|---|---|---|
| O-1 | §5.1 F | In. The rule is carried without my sample phrase, which is enough |
| O-2 and O-6 | §5.3 F, items 4 and 5 | In |
| O-3 | §5.4 F | In: «Catatan peninjau ({n})» after «Riwayat soal», and annotations do not print |
| O-4 | §5.5 F | In: the same-device variant and «setelah masuk lagi» |
| O-5 | §5.6 F | In: the rights confirmation, limit reached, not yet available, and working and done |

The promotion-run refusal agrees with ruling M-1: refused where it would end a protected sitting.

### English for §5.3 F items 4 and 5

Supplied now, so A2's pre-build review does not have to wait for it. «Ditahan» is «On hold», as A1 built it (`atur.meta.ditahan`). Students are «students», and the role is «an Admin PINTAR».

| State | English |
|---|---|
| A teacher's act on a stopped class | «Class {kelas} has been stopped by an Admin PINTAR. This can be done once the stop has ended. Nothing was changed.» |
| Assignment ending or withdrawal during a stop (O1) | «This assignment cannot be ended or withdrawn during a stop. Nothing was changed.» |
| The promotion run during a stop (M-1) | «The promotion cannot be applied yet: {n} students' assessments are on hold because of the stop. Try again once the stop has ended.» |
| Activation that did not take effect (platform admin) | «The stop has not taken effect. Nothing was stopped. Try again.» |
| A start refused because the assessment cannot finish before the window | «This assessment takes {d} min, and maintenance starts at {jam} {zona}. Start it after maintenance ends, at {jam selesai} {zona}.» |
| The teacher's list during a stop (item 5) | «On hold · continues once the stop has ended» |

THE PLAN at this commit is detailed enough to build without further UX decisions. The remaining pre-build reviews are confirmations against it.
