# I-6 and I-7: two answers (Daisy, 12 Nov 2026)

> **What holds now:**
> - **I-6:** the terms in §1 are final.
>   - C2w keeps «Catatan peninjau» / «Reviewer note», already settled in THE PLAN §5.4 F.
>   - F1-R1b uses «terkait / dikaitkan» / «linked». Its lines in §1 are final unless the engineer's screen shows a reason to adjust.
> - **I-7:** my answer is in §2. A school would not expect a class's planned maintenance to stop a teacher's other classes, nor a learner's work elsewhere. I recommend the owner decides **per class for planned maintenance, per person for an emergency**. If per person is kept for planned maintenance, §2b gives what the teacher and the scheduling admin must see.
> - **Recorded (12 Nov):** THE PLAN Addendum 1 at `3bffe6b4c5fae143253bc505533526ad010f649a` records I-6 as a C2w precondition (§4) and I-7 as an open question for the owner (§5c), after Sharon's view on enforcement.
> - **I-7 ruled (owner, 12 Nov):** Addendum 1 §5d R-1, at `e7723882e73079632442fb5d1e62d140da10eabf`.
>   - Planned maintenance is scoped to the class's work; an emergency stops the person.
>   - A2a must not ship a person-level class-scoped planned window.
>   - §2a's wording is the UX direction, subject to review on A2b's page.
>   - **§2b (if per person were kept) is superseded** by this ruling.
> - Not a review visit.

**Source:** `PLAN-REASSESSMENT-2026-11-12.md` §3, I-6 and I-7, on `claude/bob-41-master-plan` at `c95501c416715ae2ec7fc28a711f3deb1c860bc3`. Also:
- `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3 and §6;
- THE PLAN §5.3 D1, D5 and F, and §5.4 F.

## 1 · I-6: two terms that cannot be confused

| Thing | Internal name | **On screen (ID)** | **On screen (EN)** | Why |
|---|---|---|---|---|
| A reviewer's attributed, dated commentary on a sealed question (C2w) | annotation | **«Catatan peninjau»** | **«Reviewer note»** | Already settled (THE PLAN §5.4 F, my O-3). It says who wrote it and that it is a note, not evidence |
| A wrong option that carries no misconception code (F1-R1b, and every 4.0 option left without one) | "not annotated" | **«belum dikaitkan dengan pemahaman keliru»**; the noun is **«pemahaman keliru terkait»** | **«not linked to a misconception»**; **«linked misconception»** | It describes the fact: a link on the option that is absent. It claims nothing about the learner's thinking |

**Rules for both:**
- **Neither word appears in the other's place:**
  - F1-R1b never uses «catat», «catatan», «tercatat» or «dicatat», which belong to C2w's note and to «Catatan masuk dan cetak»;
  - C2w never uses «kaitkan» or «terkait».
- **«Anotasi» / «annotation» never appears on screen.** It stays an internal name.
- Studio already writes an option's code as «Pemahaman keliru: {label}». So the absent case reads in the same place, as «Pemahaman keliru: belum dikaitkan». A teacher meets the two as **a property of the option** (linked or not) and **a note beside the question** (Catatan peninjau), with different words and in different places.

**F1-R1b's lines,** using that term:

| Where | ID | EN |
|---|---|---|
| **The option, in Studio** (where «Pemahaman keliru: {label}» stands for a linked option) | «Pemahaman keliru: belum dikaitkan» | «Misconception: not linked» |
| **The marker on the question:** the teacher's per-question view and Studio, when any wrong option is unlinked. One `pin-meta` line under the options, beside F-1's line where both apply | «Sebagian pilihan salah belum dikaitkan dengan pemahaman keliru. Jawaban pada pilihan itu tidak masuk hitungan pemahaman keliru.» | «Some wrong options are not linked to a misconception. Answers on those options are not counted in the misconception figures.» |
| **A misconception figure or list that is empty or thin** (the owner's «no recorded misconception», §3 row 1) | «Belum ada pemahaman keliru yang terkait dengan jawaban ini.» Where the marker also applies, it follows: «Sebagian jawaban salah tidak terkait dengan pemahaman keliru mana pun.» | «No misconception is linked to these answers yet.» / «Some wrong answers are not linked to any misconception.» |

**Why these words:**
- **«belum» ("not yet")** says the link can be made; it is not a finding.
- **«tidak masuk hitungan»** tells the teacher what follows for the figure. That is the "and then what?" of an empty figure.
- **No new number,** as Sharon requires.

**The other two lines of the brief's §6,** for the engineer's convenience, in the same vocabulary:
- **§6 line 1, the preview and the confirmation:** «Pilihan {x} akan kehilangan alasan dan pemahaman keliru terkaitnya, karena benar-salahnya berubah. Kunci diperbaiki sekarang; alasannya ditulis sesudahnya.» / «Option {x} will lose its explanation and linked misconception, because whether it is right has changed. The key is corrected now; the explanation is written afterwards.»
- **§6 line 2, Studio, on the corrected revision:** «Alasan pilihan {x} ditarik karena kuncinya diperbaiki. Tuliskan alasan yang baru.» / «The explanation for option {x} was withdrawn when the key was corrected. Write a new one.»
- **On the learner's result:** an option with no explanation shows **nothing in its place**. A learner gains nothing from being told an explanation was withdrawn, and the mark stands on its own. The same applies for F-1's fix.

## 2 · I-7: a class's planned maintenance and a person in several classes

**Would a school expect it? No, for planned maintenance.** A school schedules maintenance for 7A because something about 7A needs it: its room, its devices, its timetable. The people who decide it, and the people who expect to be affected, think of **7A's work**, not of everyone who is ever in 7A. As written (per person):

- **Pak Yusuf teaches 7A and 7B.** A 7A window stops him in 7B, where his class is waiting for him, and he cannot even open 7B's page to see why. Nothing on the scheduling form told the admin this would happen.
- **A learner in 7A with an elective in another class** loses the elective's work. Their elective teacher sees a learner who cannot start, with no reason on their own screens.
- **A teacher at two schools** (THE PLAN's named case) is stopped at school Y by school X's planned decision. School Y's admin cannot see why, and should not have to. **This is the strongest reason:** a school's planned maintenance should not reach another school's work at all.

**For an emergency, the per-person reading is right.** It is the safe one: an emergency is about protecting a person's work and data, holding everything of an affected person is what C8 asks for, and only the platform admin can do it.

### 2a · My recommendation (the owner's decision, I-7's "possibly a decision later")

**Planned and class-scoped: the window governs the class's work, not the person.**
- 7A's assessments cannot be started from T−15.
- 7A's members get the warnings, and 7A's pages show the pause.
- The same people elsewhere are untouched.

**Emergency: per person, as written.**

Whether "the class's work" can be enforced without a per-person request block is Sharon's and the engineer's question, not mine. On the screens it means only that each notice names the class and the other classes stay normal.

**What the teacher then sees:**

| Where | ID | EN |
|---|---|---|
| The warning banner, T−60 and T−30 (only on 7A's pages and the teacher's home, not on 7B's) | «Pemeliharaan terjadwal untuk kelas 7A mulai pukul {jam} {zona}. Kelas Anda yang lain tidak terpengaruh.» | «Planned maintenance for class 7A starts at {jam} {zona}. Your other classes are not affected.» |
| T−15 (amber, not closable), the same places | «Pemeliharaan kelas 7A mulai pukul {jam} {zona}. Asesmen baru di kelas ini tidak dapat dimulai lagi. Kelas Anda yang lain tidak terpengaruh.» | «Maintenance for class 7A starts at {jam} {zona}. No new assessment can start in this class. Your other classes are not affected.» |
| During the window, on 7A's pages (in place of 7A's content; the shell and other classes stay usable) | «Kelas 7A sedang dalam pemeliharaan terjadwal sampai pukul {jam} {zona}. Alasan: {alasan}. Kelas Anda yang lain dapat dipakai seperti biasa.» | «Class 7A is in planned maintenance until {jam} {zona}. Reason: {alasan}. Your other classes can be used as usual.» |
| 7B's pages | **Nothing.** No banner, because the window is not 7B's | — |

«Kelas Anda yang lain tidak terpengaruh» appears **only when the person has another class**. For a learner, «Kelas Anda yang lain» reads naturally too.

### 2b · If per person is kept for planned maintenance too

> **Superseded 12 Nov** by the owner's ruling R-1 (Addendum 1 §5d at `e7723882e73079632442fb5d1e62d140da10eabf`): planned maintenance is scoped to the class's work. Kept as a record.

The behaviour must not surprise anyone, so it is said in two places:

1. **To the school admin, before scheduling** («Periksa waktu ini», with the existing list of the class's assessments): «Jendela ini juga menghentikan {g} guru dan {m} murid di kelas lain, karena mereka juga ada di kelas 7A: {kelas lain}.» / «This window also stops {g} teachers and {m} students in other classes, because they are also in class 7A: {other classes}.»
   - **A school must never be shown another school's classes:** for a person also at another school, the sentence says «… dan di sekolah lain» / «… and at another school», with no name.
2. **To the person, on the pause page and the warnings,** naming the cause so a teacher in 7B understands: «PINTAR tidak dapat Anda pakai sampai pukul {jam} {zona}, karena pemeliharaan terjadwal untuk kelas 7A, yang Anda ajar. Ini juga berlaku saat Anda membuka kelas lain.» / «You cannot use PINTAR until {jam} {zona}, because of planned maintenance for class 7A, which you teach. This also applies when you open your other classes.» For a learner: «… untuk kelas 7A, kelas Anda. …» / «… for class 7A, your class. …».

**Even then, I would still ask the owner** about the two-school case: school X's planned window reaching school Y's work is a boundary question, not only a wording one.

**The named cases A2a's and A2b's pages should carry, with what each screen shows:**
- the two-class teacher (7A and 7B);
- the learner with an elective in another class;
- the two-school teacher;
- each under a planned window and under an emergency.
