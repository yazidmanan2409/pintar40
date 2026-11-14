# A2a change C: first screenshots, reviewed early (Daisy, 14 Nov 2026)

> **What holds now:**
> - **Two BLOCKERS on the screens so far,** both about approved words not yet built (§1). **One BLOCKER on the strings:** the class-node refusal uses other words (§2).
> - **Everything else built so far is exact.**
> - **Nine of my twelve screens are still missing** (§4).
> - **Second Eye:** please read §1 to §4. **Bob:** copied.
> - **Read:**
>   - `claude/a2a-change-c` at `f308b0bf…`;
>   - the screenshots in `docs/completion-4.1/batches/a2a-layar/` (`6b8a96f9`);
>   - the strings `git diff a6b47466..f308b0bf -- src/lib/hle.ts`;
>   - checked against `A2-KATA-DESAIN.md`, `A2A-BACA-AWAL-7b3b3d31.md` (THE PLAN §5.3 F) and `A2A-DITUTUP-BERJALAN.md`.

## 1 · Per screen

| # | Screen (file) | Verdict | Why |
|---|---|---|---|
| 7 | Teacher's list during the stop (`1-daftar-saat-henti-kaprodi`, 1280, 390, 320) | **NO BLOCKER** | «Ditahan · dilanjutkan setelah penghentian diakhiri» is exact (`atur.meta.ditahan_henti`), under the learner's name, with no «Atur». The «Ditahan» pill beside it repeats the state; acceptable. **Layout:** see the note in §3. It predates A2a, and the held line stays readable at 320 because it sits in the name column |
| 3 | Pause page, a learner of the stopped class (`2-halaman-jeda-murid`, 1280, 390) | **BLOCKER** | THE PLAN item 1 is exact, and «Admin PINTAR» is right. **But the class form is not built** (`A2-KATA-DESAIN.md` A3): **the title** should read «PINTAR dihentikan sementara untuk kelas {kelas}» (several: «… untuk kelas {kelas}, {kelas}»); **the explanation** should read «Admin PINTAR menghentikan PINTAR untuk kelas ini karena ada masalah yang harus ditangani lebih dulu agar data tetap aman.» Today the page reads exactly as a school or platform stop does, so a learner cannot tell it is their class only. *(If this capture was a school-scope stop, it shows nothing of class scope; please capture a class stop.)* |
| 4 | Pause page, a teacher who also teaches another class (`4-halaman-jeda-guru-kelas`, 390) | **BLOCKER** | **The file is byte-identical to the learner's** (the same md5), so **the other-class line is absent**: «Karena Anda ada di kelas ini, PINTAR juga tidak dapat Anda pakai di kelas lain sampai penghentian diakhiri.» / «Because you are in this class, you cannot use PINTAR in your other classes either until the stop is ended.» Shown only to someone with another class. It is the line that tells a teacher of 7A why 7B is stopped too |

## 2 · Strings already in `hle.ts`

| Key | Verdict |
|---|---|
| `pengerjaan.galat.sitting_class_stopped`, `sitting_emergency_held` | Exact (THE PLAN item 4) |
| `pengerjaan.galat.sitting_fence_busy` | Exact (my early read 1b), both languages |
| `atur.meta.ditahan_henti` | Exact (item 5) |
| `pemeliharaan.darurat.arti`, `.asesmen` | Exact (item 6; item 1). The class form of `.arti` is a **new key**; this one stays for school and platform scope |
| `galat.maintenance_stop_not_in_force`, `maintenance_lift_not_done`, `promo_stopped` | Exact |
| **`galat.maintenance_node_invalid`** | **BLOCKER: not my line.** Built: «Pilih kelas dari satu sekolah, bersama sekolah itu.» Approved (A2): «Kelas itu tidak dapat dipilih untuk penghentian ini. Pilih satu sekolah, lalu satu atau beberapa kelasnya. Tidak ada yang dihentikan.» / «That class cannot be chosen for this stop. Choose one school, then one or more of its classes. Nothing was stopped.» The built line drops **«Tidak ada yang dihentikan»**, which is what an admin needs to know after a refused stop |

**Not yet in `hle.ts` (each needs building before the freeze; one sweep covers them):**
- **A1:** «Satu kelas atau lebih»; the person-level hint; the impact sentence's class form.
- **A3:** the class title and `.arti` (§1).
- **A4:** «Dihentikan · kelas {kelas} · sejak {jam} {zona} · oleh {nama}»; «Akhiri penghentian»; its confirmation; «Penghentian diakhiri. {m} asesmen yang ditahan dapat dibuka lagi.»; «Hanya Admin PINTAR yang dapat mengakhiri penghentian ini.»
- **THE PLAN item 2:** «Asesmen yang ditahan selama penghentian dapat dibuka lagi. …»
- **THE PLAN item 3:** «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: {n} menit.»
- **THE PLAN item 4:** «Penugasan ini tidak dapat diakhiri atau ditarik selama penghentian. Tidak ada yang diubah.» Ending or withdrawing an assignment during a stop has its own line, not the stopped-class one.
- **`A2A-DITUTUP-BERJALAN.md` §2:** the teacher's «Pengumpulan sudah ditutup, tetapi {n} murid masih mengerjakan …».

## 3 · Note for the next batch (not an A2a blocker): `/mengajar/[kelas]/siapa` at phone width

This is A1's page; change C changes only one prop on it.
- **At 390 the «Keadaan» pills are cut at the table's edge** («Belum mengerjaka…»).
- **At 320 the column is cut** («Keadaar», «Belum», «Ditaha»).
- **The «Pemetaan Awal / Uji Penguasaan» switch overflows** («Uji Penguasaa…») and shows a **stray dark square** under it, at both widths.

Register it with X-1 to X-4 for Z, or fix it with A1's next touch. **The sibling to sweep:** every page using the same switch and the two-column state table, such as `/mengajar/[kelas]/soal` and `bukti`.

## 4 · Screens still missing (please capture; class-scope stop throughout)

| # | Screen | Status |
|---|---|---|
| 1 | The emergency form with a class chosen, by keyboard: hint, impact sentence | missing |
| 2 | The node refusal | missing |
| 3 | Pause page, learner | received: BLOCKER |
| 4 | Pause page, teacher with another class | received: BLOCKER |
| 5 | The player on reopening after the lift (item 3), also at 1280 | missing |
| 6 | «PINTAR dapat digunakan» after the lift (item 2) | missing |
| 7 | Teacher's list during the stop | received: NO BLOCKER |
| 8 | List row, «Akhiri penghentian», confirmation, result line (Admin PINTAR) | missing |
| 9 | The same row as the school's own admin | missing |
| 10 | The refused lift | missing |
| 11 | Learner's Belajar list after the lift, with a held Uji Cepat whose `closes_at` passed (and the suspension case) | missing |
| 12 | Teacher's Uji Cepat page in the same moment (`A2A-DITUTUP-BERJALAN.md` §2) | missing |

Each at 390 and 320.

## 5 · Anticipation

The two pause-page blockers and the node refusal would all have been caught by **question 1**, applied to the strings: a sweep of the approved wording files against `hle.ts` before the screenshots. **Suggested for Second Eye's next capture:** grep `A2-KATA-DESAIN.md`'s lines against `hle.ts` first.
