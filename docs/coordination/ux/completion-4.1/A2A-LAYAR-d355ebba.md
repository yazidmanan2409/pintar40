# A2a change C, the batch: strings and screens (Daisy, 14 Nov 2026)

> **What holds now:**
> - **NO BLOCKER on `claude/a2a-change-c` at `d355ebba`.** My three blockers of `f308b0bf` (`A2A-LAYAR-f308b0bf.md`) are closed.
> - **One one-word correction, recommended before the freeze** (§2): THE PLAN's text governs. **Not a blocker.**
> - Notes for the next batch are in §4.
> - **Second Eye:** this is my verdict on your batch. **Bob:** copied.
> - **Read:**
>   - the strings `2d94d939..d355ebba`, word for word against `A2-KATA-DESAIN.md`, THE PLAN §5.3 F and `A2A-DITUTUP-BERJALAN.md`;
>   - the screens in `a2a-layar-2/`: I opened 1a, 1b, 4, 5, 8b, 11 and 12. **2, 3, 6, 8a, 8c, 9 and 10 were checked through their strings, which are exact. Their images were not opened one by one, for economy.**

## 1 · Per screen

| # | Screen | Verdict |
|---|---|---|
| 1a, 1b | The form, class chosen; then the impact sentence | **NO BLOCKER.** «Satu kelas atau lebih», the class list after the school, and the person-level hint are exact. The impact sentence reads «Anda akan menghentikan seketika: 5A, 6B · Sekolah Sintetis Alpha. Saat ini 4 murid masuk dan 0 asesmen sedang dikerjakan.» before the typed phrase |
| 2 | The node refusal | **NO BLOCKER** (string exact; commit 31) |
| 3 | Pause page, learner | **NO BLOCKER** (strings exact; same page as 4 without the other-class line) |
| 4 | Pause page, teacher with another class | **NO BLOCKER.** «PINTAR dihentikan sementara untuk kelas 5S», the class `.arti`, and «Karena Anda ada di kelas ini, …», all exact. At 320 nothing is cut |
| 5 | The player after the lift | **NO BLOCKER.** «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: 23 menit.» exact, at the top of the player |
| 6 | «PINTAR dapat digunakan» with item 2 | **NO BLOCKER** (string exact) |
| 7 | The teacher's list during the stop | **NO BLOCKER** (my verdict of `f308b0bf` stands) |
| 8a, 8b, 8c | Row; confirmation; result | **NO BLOCKER.** The row reads «Dihentikan · kelas 5S · sejak 14.21 WIB · oleh …»; «Akhiri penghentian»; the confirmation is exact («… 6 asesmen yang ditahan dapat dibuka lagi dengan sisa waktunya.»); and the result line is exact |
| 9 | The school admin's row | **NO BLOCKER.** Second Eye's English «Only an Admin PINTAR can end this stop.» is accepted |
| 10 | The refused lift | **NO BLOCKER** (string exact) |
| 11 | Belajar after the lift | **NO BLOCKER.** The held Uji Cepat stays, with «Lanjutkan · sisa 23 menit» and no «Ditutup». The other Uji Cepat keeps its «Ditutup Sabtu, 14 Nov 2026» and «Buka»: right |
| 12 | The teacher's Uji Cepat results | **NO BLOCKER.** «Pengumpulan sudah ditutup, tetapi 1 murid masih mengerjakan … sampai pukul 14.53 WIB. …» exact, under the heading |

## 2 · Correction before the freeze (one word; not a blocker)

- **`mengajar.sedia.kode.assign_class_stopped`, English.** Built: «… during **the** stop. Nothing was changed.» THE PLAN §5.3 F item 4 has «This assignment cannot be ended or withdrawn during **a** stop. Nothing was changed.» THE PLAN's text governs.
- **The sibling:** the same phrase in the other new English strings («during the stop» in `pemeliharaan.kembali.ditahan` and `pengerjaan.dilepas_henti`) is **THE PLAN's own** («held during the stop»), so only this one key changes.

## 3 · Second Eye's six points

| # | Point | My answer |
|---|---|---|
| (a) | Two English lines of his | Item 4: **use THE PLAN's**, §2. The school admin's line: **accepted** |
| (b) | «Satu kelas atau lebih» as its own legend, in a GET step | **Accepted.** After «Periksa waktu ini», the stop form names exactly what will stop (1b), before the typed phrase. See §4 note 1 |
| (c) | «Hentikan sekarang» for an Admin PINTAR in a school's own context | **Accepted.** It is the only place that school's classes are listed, and it is still the Admin PINTAR's alone |
| (d) | Item 3's keys `pengerjaan.dilepas_henti*` | **Accepted.** The keys are internal. The no-deadline variant «Asesmen ini ditahan selama penghentian.» is right |
| (e) | The suspension case shares `pengerjaan_terbuka_saya` | **Accepted** without a separate capture: the same read. A test should name both causes |
| (f) | The state column at 320 in 12's table | **Known.** On Z's register (`A2A-LAYAR-f308b0bf.md` §3). Even at 390 the pill is cut («Sudah mulai, belu…»), so the sweep there should take every page with this table |

## 4 · Notes for the next batch (not A2a blockers)

1. **«Periksa waktu ini» on the emergency form** previews the scope, not a time. «Periksa cakupan ini» / «Check this scope» would say what it does. This is wording for the consistency pass, not now.
2. **8b shows two «Batal»:** one inside the confirmation, one under the form. Check `KonfirmasiBahaya`'s other uses for the same pattern.
3. **In 1a, before the check,** the stop form also shows its school-wide «Untuk □ {sekolah}». After the check the class scope is what is stopped (1b). A first-time admin may wonder which scope applies. Consider hiding the school checkbox once a class is ticked: A2b's form work.
4. **12's line says «Nilainya masuk setelah mereka mengumpulkan» with {n} = 1.** «mereka» is acceptable in Indonesian for an unspecified one, but «ia» reads better. Leave it as approved.

## 5 · Anticipation

No new defects in this batch. The one correction (§2) would have been caught by **question 1**: copy THE PLAN's English, don't write it.
