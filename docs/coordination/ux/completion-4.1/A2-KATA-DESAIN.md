# A2a and A2b: words and screens at the design stage (Daisy, 13 Nov 2026)

> **What holds now:**
> - **Design-stage input, not a review.** Ready before A2a's build, and before A2b's page is written.
> - **Already settled, and not restated:** THE PLAN §5.3 F has my wording for the stop (items 1 to 5: during the stop, after the lift, on reopening, the refusals, the teacher's list). R-1's screen language is in `I6-I7-JAWABAN.md` §2a, the direction for A2b.
> - **This page adds only what A2a's and A2b's pages now need** and that no line yet covers.
> - **Sources:**
>   - A2a's page on `claude/system-integrity-4.0` at `55e7eed9573d7396973b48665cd9d67a048da5bf`;
>   - `TEAM-INSTRUCTIONS.md` at `16ac63b6800081338e80f5342f321190ae7e7edd`;
>   - every existing `pemeliharaan.*`, `config.pemeliharaan.*` and `galat.maintenance_*` string at that commit, searched first.
> - **Each line was checked three ways:** against the existing strings (Q1), against where it renders (Q5), and against the neighbouring act (Q2). The checks are noted per line.

## A2a · the class-scoped emergency stop and its lift

### A1 · The emergency form: choosing a class

Where it renders: Konfigurasi › «Pemeliharaan dan pengumuman» › «Hentikan sekarang». Platform admin only.

| Element | ID | EN | Note |
|---|---|---|---|
| «Untuk» (existing `config.pemeliharaan.cakupan`) gains a choice | «Satu kelas atau lebih» | «One or more classes» | Neighbouring: the planned form will offer «Satu kelas» in A2b. The emergency may hold several classes of **one** school, so it says so |
| Under it, after a school is chosen | a list of the school's classes as checkboxes, each «{kelas} · {tahun ajaran}» | same | Classes only appear once one school is chosen: the trigger requires one school (required change 2). The form makes that the only way to fill it |
| Hint under the class list | «Penghentian berlaku untuk semua murid dan guru kelas yang dipilih, di seluruh PINTAR, juga saat mereka membuka kelas lain.» | «The stop applies to every student and teacher of the chosen classes, across PINTAR, including when they open other classes.» | **The neighbouring act, honestly:** a class emergency is person-level (R-1). The admin must know before typing the phrase that a teacher of 7A is also stopped in 7B |
| The impact sentence (THE PLAN §5.3 F), class form | «Anda akan menghentikan seketika: {kelas, kelas} · {sekolah}. Saat ini {n} murid masuk dan {m} asesmen sedang dikerjakan.» | «You will stop at once: {kelas, kelas} · {sekolah}. Right now {n} students are signed in and {m} assessments are in progress.» | Unchanged form. Classes joined with «, »; **{n} counts everyone the stop reaches**, which for a person-level stop includes the classes' teachers |

### A2 · The new refusal for a class that cannot be chosen

Required change 2: a designed code, the wording mine. Rendered in the form's result line, `role="alert"`.

- **Suggested key:** `galat.maintenance_node_invalid`.
- **When it fires:** a node that is not a class, a class of another school, several schools, or the whole platform with a class.

| | |
|---|---|
| **ID** | «Kelas itu tidak dapat dipilih untuk penghentian ini. Pilih satu sekolah, lalu satu atau beberapa kelasnya. Tidak ada yang dihentikan.» |
| **EN** | «That class cannot be chosen for this stop. Choose one school, then one or more of its classes. Nothing was stopped.» |

**Why one line for all four causes:**
- The form only offers valid choices, so a person meets this line only through a stale form or a forged request.
- The fix is the same in each case.
- «Tidak ada yang dihentikan» matches the activation refusal in THE PLAN §5.3 F («Penghentian belum berlaku. Tidak ada yang dihentikan.»).

### A3 · What a stopped person sees: the pause page, class scope

Where it renders: `/pemeliharaan`, for every request of an affected person (PT503); the open player lands there within 45 s.
- **Existing:** `pemeliharaan.darurat.judul` «PINTAR dihentikan sementara» and `.arti`.
- **THE PLAN:** «the title names the class for a class scope».

| Element | ID | EN | Note |
|---|---|---|---|
| Title (class scope) | «PINTAR dihentikan sementara untuk kelas {kelas}» | «PINTAR is stopped for class {kelas}» | Several classes: «untuk kelas {kelas}, {kelas}». The school is not named: the person knows their class |
| **A line, only when the person has another class or another school** | «Karena Anda ada di kelas ini, PINTAR juga tidak dapat Anda pakai di kelas lain sampai penghentian diakhiri.» | «Because you are in this class, you cannot use PINTAR in your other classes either until the stop is ended.» | **The neighbouring act:** without it, a teacher of 7A and 7B would read «… untuk kelas 7A» and try 7B. Shown only where true |
| `.arti` (existing; the role name per THE PLAN item 6) | «Admin PINTAR menghentikan PINTAR untuk kelas ini karena ada masalah yang harus ditangani lebih dulu agar data tetap aman.» | «An Admin PINTAR stopped PINTAR for this class because a problem must be dealt with first to keep data safe.» | School and platform scope keep their own wording, with «Admin PINTAR» |
| Reason (A2b's D2; until then, the free text as today) | «Alasan: {alasan}» | «Reason: {alasan}» | The same line the planned pause page uses (THE PLAN §5.3 F) |
| During the stop, held work, and on reopening | THE PLAN §5.3 F items 1 to 3, unchanged | — | They hold for class scope as written |

**Two-school person:** the pause page at school Y names a class at school X. That is the person's own class, so nothing is disclosed to them. School Y's screens show nothing about it, which is right for an emergency.

### A4 · The lift

Where it renders: the maintenance list in Konfigurasi.
- **Existing:** `config.pemeliharaan.akhiri` «Akhiri sekarang».
- **THE PLAN:** «Akhiri penghentian» behind `KonfirmasiBahaya` for an Admin PINTAR; a school admin sees «Hanya Admin PINTAR yang dapat mengakhiri penghentian ini.»

| Element | ID | EN | Note |
|---|---|---|---|
| The list row of a class stop | «Dihentikan · kelas {kelas} · sejak {jam} {zona} · oleh {nama}» | «Stopped · class {kelas} · since {jam} {zona} · by {nama}» | The scope and the person who stopped it, as the planned row will show «Dijadwalkan oleh {nama}» (THE PLAN §5.3 F) |
| The button (Admin PINTAR) | «Akhiri penghentian» | «End the stop» | Not «Akhiri sekarang»: that is the planned window's, and A2a routes the emergency only through the fenced lift (Sharon's condition 1) |
| The confirmation's text | «Akhiri penghentian untuk kelas {kelas}? Murid dan guru kelas ini dapat memakai PINTAR lagi. {m} asesmen yang ditahan dapat dibuka lagi dengan sisa waktunya.» | «End the stop for class {kelas}? The class's students and teachers can use PINTAR again. {m} held assessments can be reopened with the time they had left.» | Says what follows: the "and then what?" |
| After the lift (replacing `galat.maintenance_ended` for an emergency) | «Penghentian diakhiri. {m} asesmen yang ditahan dapat dibuka lagi.» | «The stop is ended. {m} held assessments can be reopened.» | «Pemeliharaan diakhiri.» would misname an emergency |
| A lift that did not take effect | «Penghentian belum diakhiri. Tidak ada yang berubah. Coba lagi.» | «The stop has not been ended. Nothing changed. Try again.» | **The opposite act of the activation refusal** in THE PLAN, in the same form |

### A5 · The status notice (`pintar_status_saya`, class-scoped EMERGENCY; Sharon's condition 2)

**Who sees what:**
- **The people the stop reaches** see the pause page (A3). There is no banner beforehand: an emergency has no warning period.
- **Nobody else in the school sees anything** from the status read. That is the condition.
- **The school's own admin**, who is not in the class, sees the stop in the maintenance list (A4). No banner elsewhere.
- **The class's teacher, after the lift:** THE PLAN's teacher list line «Ditahan · dilanjutkan setelah penghentian diakhiri» becomes the sitting's normal state again. No new line.

**One check for the page:** if the status read fails, the open player must not treat that as "no stop". It keeps its existing behaviour on a failed read, and the pause page is what the next request shows.

## A2b · the reason list (D2) and "cannot finish before the window" (D4)

### B1 · The reason list (D2)

Where it renders: the planned form and the emergency form. It replaces the free «Alasan (dicatat)» (`config.pemeliharaan.alasan`).

| Element | ID | EN |
|---|---|---|
| Legend (radio group, required) | «Alasan» | «Reason» |
| Hint | «Alasan yang dipilih ditampilkan kepada orang yang terdampak.» | «The reason you choose is shown to the people affected.» |
| Options (planned and emergency) | «Pemeliharaan rutin» · «Pembaruan sistem» · «Perbaikan gangguan» · «Pemeliharaan jaringan atau listrik» · «Lainnya» | «Routine maintenance» · «System update» · «Fault repair» · «Network or power maintenance» · «Other» |
| Emergency only, added | «Masalah keamanan» · «Masalah integritas data» | «Security problem» · «Data integrity problem» |
| «Lainnya»'s field (required with it; up to 120 characters) | «Jelaskan singkat» | «Explain briefly» |
| Refusal when no reason is chosen, or «Lainnya» is empty | «Pilih alasannya. Bila memilih «Lainnya», jelaskan singkat, sampai 120 karakter.» | «Choose the reason. If you choose «Other», explain briefly, up to 120 characters.» |
| Shown to the affected (banner and pause page) | «Alasan: {alasan}» | «Reason: {alasan}» |

**Existing windows with no code:** they show their free text after «Alasan:», as today. **The neighbouring string:** `galat.maintenance_input_invalid` already asks for «alasannya» and stays valid.

**One caution for the page:**
- «Masalah keamanan» is shown to every affected learner.
- That is the approved list, and it says nothing more specific.
- The page should not allow «Lainnya»'s text on an emergency to carry detail a learner should not read. The hint says the text is shown, so the person writing it knows.

### B2 · "Cannot finish before the window" (D4)

THE PLAN §5.3 F has the line, tied by `aria-describedby` to the disabled «Mulai». It replaces `pemeliharaan.menjelang.arti`:

| Case | ID | EN |
|---|---|---|
| Window with an end (THE PLAN's line) | «Asesmen ini memerlukan {d} menit, sedangkan pemeliharaan mulai pukul {jam} {zona}. Mulailah setelah pemeliharaan selesai, pukul {jam selesai} {zona}.» | «This assessment takes {d} minutes, and maintenance starts at {jam} {zona}. Start it after maintenance ends, at {jam selesai} {zona}.» |
| **Window with no end set** (`config.pemeliharaan.tanpa_akhir` exists, so this case is real) | «Asesmen ini memerlukan {d} menit, sedangkan pemeliharaan mulai pukul {jam} {zona}. Mulailah setelah pemeliharaan selesai.» | «This assessment takes {d} minutes, and maintenance starts at {jam} {zona}. Start it after maintenance ends.» |
| **Class-scoped planned window** (R-1; the class's own work) | «Asesmen ini memerlukan {d} menit, sedangkan pemeliharaan kelas {kelas} mulai pukul {jam} {zona}. Mulailah setelah pemeliharaan selesai, pukul {jam selesai} {zona}.» | «This assessment takes {d} minutes, and maintenance for class {kelas} starts at {jam} {zona}. Start it after maintenance ends, at {jam selesai} {zona}.» |
| **The end falls on another day** | «… pukul {jam selesai} {zona}, {tanggal}.» | «… at {jam selesai} {zona} on {tanggal}.» |
| **Inside T−15** (existing `galat.maintenance_no_new_start`) | unchanged: «Pemeliharaan segera dimulai, jadi asesmen baru tidak dapat dimulai sekarang. Mulailah setelah pemeliharaan selesai.» | unchanged |

**How the refusal reaches the learner:**
- The database's designed code (D4) and the disabled «Mulai» say the same thing.
- **The button's sentence is the primary place.** The code is the fallback when the page was opened before the window was scheduled: the learner presses «Mulai» on a stale page and is refused with this line in the player's result line.
- **{d}** is whole minutes. Over 60 it stays in minutes («90 menit»), as the assessment's own duration is shown elsewhere.

### B3 · D8: the school's zone (found while searching)

- **`pemeliharaan.zona` is the fixed string «WIB»**, used by the banner and the pause page («… pukul {jam} WIB»).
- D8 must replace it with the school's zone word, from the same `zonaSekolah` the reader and the print use. **Delete this key, rather than leaving it for a later caller.**
- The form's own labels already take `{zona}`.

## What I will check at each result review

**A2a:**
- the form at 390 and 320, with the class list by keyboard;
- the pause page for a learner in the class;
- the pause page for a teacher with another class;
- a school admin outside the class seeing nothing but the list row;
- the lift with its confirmation and result line;
- the node refusal.

**A2b:**
- the reason list by keyboard, with «Lainnya»'s field;
- the start refusal in all four cases;
- every time with the school's zone;
- R-1's lines from `I6-I7-JAWABAN.md` §2a.

Each review gets the anticipation table.
