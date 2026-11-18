# 4.1 observed walkthrough: the observation plan (Daisy, 18 Nov 2026; ruling 55)

> **What holds now:**
> - **A draft for Bob to map to Z's journeys.** Dr Gladys reviews the educational meaning: tasks 2 and 4, and the debrief questions.
> - **Four tasks** (§2), the same **measures** for each (§3), **four questions** after each (§4), one **recording sheet** (§5) and **severity** (§6).
> - **Staging needs** (§7) are a bounded write that **waits for your authorisation.**
> - **Sources:** `POST-REVIEW-EXECUTION-18NOV.md` §5 (Bob's branch).

## 1 · Roles and rules

- **Participants:** two real school staff: one admin-capable teacher for tasks 1 and 4, and one teacher for 2 and 3. **Learners are played by the team on synthetic accounts.** No real child takes part.
- **Observers:** Daisy (notes), plus one more (time and the screen record, if consented). **Observers do not help.** A help request is answered only after "What are you looking for?", and is recorded.
- **Think-aloud:** the participant says what they look for and what they expect. No hints, no "almost".
- **Not final (ruling 59):** «Sertifikat Penguasaan», the Predikat and the hints in Uji Penguasaan will be refined after Z (batch D2-R). Observers do not present them as final. Observations on them are recorded **against D2-R**, not as 4.1 defects.
- **Only approved 4.1 features are used.** A participant's wish for something else is recorded as a **feature request** (§6).
- **Consent:** a short consent line before starting (observation, notes, any screen recording, anonymised write-up). Participants may stop at any time.

## 2 · The four tasks (the participant receives only the "Goal" sentence)

| # | Goal given to the participant | Start state | Done when | Watch for |
|---|---|---|---|---|
| **T1** | «Siapkan sekolah ini untuk kelas Anda, lalu aktifkan akun guru untuk diri Anda.» | A fresh synthetic school with its admin account only | Structure (one Bagian, one Tingkat, one class) exists; the teacher is activated and signed in | Finding Konfigurasi › Struktur; the year field; activation steps; the context chooser after the first sign-in |
| **T2** | «Lihat bagaimana kelas Anda belajar bab ini. Cari satu bagian yang masih lemah, minta murid membaca ulang bagian itu, lalu buat dan berikan Uji Cepat untuknya.» | A class with finished Pemetaan Awal and Uji Penguasaan results, one section clearly weak | The weak section is named; the teacher makes **today's re-read request**; an Uji Cepat the teacher **builds by hand** is assigned (ruling 56: existing 4.1 features only; no 4.2 learning retry is implied) | Reading the class report (the letters, «di bawah target», the denominators); «Lihat bukti»; whether «Pemahaman keliru» is understood; assigning without wrong turns |
| **T3** | «Murid ini sedang mengerjakan Uji Penguasaan di komputer lab, lalu listrik padam. Bantu ia melanjutkan.» (The team plays the learner and switches the computer off mid-sitting) | A running sitting on a shared lab computer («Komputer siapa ini?» set to shared) | The learner continues on another computer; the teacher allowed it once; no answer is lost | Whether the teacher finds «minta lanjut setelah masuk lagi» on «Siapa»; «Izinkan …» and its confirmation; the learner's waiting screen and «Coba lagi»; the old screen's neutral panel |
| **T4** | «Masukkan satu bab dari buku kerja ini, minta rekan meninjaunya, lalu berikan ke kelas Anda.» | A prepared workbook (synthetic, one chapter), plus a second staff account as the reviewer | The chapter is published and assigned | The upload's error messages (one deliberate error in the file); «Ajukan untuk ditinjau»; the reviewer's steps; assigning a released package |

**No task is cut short for time.** If a participant is stuck for **5 minutes** with no progress, the observer records "not completed: stuck at {screen}" and moves on, and the help given is recorded.

## 3 · Measures (per task)

| Measure | How |
|---|---|
| **Completion** | Completed unaided · completed with help · not completed |
| **Wrong turns** | Each navigation away from the shortest path, with the screen and what the participant was looking for |
| **Help requests** | Each request, verbatim, and what was given |
| **Misreadings** | Each place the participant states a meaning the screen does not have (e.g. reads «di bawah target» as a failing grade). Quote the words |
| **Time** | From the goal read aloud to done, in minutes. Reported as a value, **never as a pass mark** |

## 4 · The four questions after each task (Indonesian, read as written)

1. «Apa yang tadi Anda coba lakukan, dan menurut Anda apakah berhasil?»
2. «Di bagian mana Anda ragu, atau harus menebak?»
3. «Ada yang terjadi tidak seperti yang Anda kira? Apa?»
4. «Besok di kelas, apa yang akan Anda lakukan dengan ini?»

Question 4 is Dr Gladys's: it checks whether the educational meaning came through, and is read with her.

## 5 · Recording: two separate columns

**One row per observation:** task · screen · what happened (quote) · measure (§3) · **technical correctness** · **usability** · severity (§6) · feature request (yes/no).

- **Technical correctness:** did the system do the right thing (data, rules, refusals)? A wrong result is a **defect**, however smooth it looked.
- **Usability:** could the person understand and do it? Confusion is recorded **even when the system was right.**
- The two are never merged. A screen can be correct and unusable, or usable and wrong.

## 6 · Severity (the existing rules)

| Class | Meaning in this walkthrough |
|---|---|
| **Blocker** | A wrong result (data, score, permission), or a task that **cannot** be completed without the team's help on a path that 4.1 promises |
| **Required correction** | Completed, but with a misreading that could mislead a decision in class, or a wrong turn that every participant takes |
| **Note for the next batch** | Friction, wording, or a single participant's hesitation |
| **Feature request** | Something 4.1 does not promise. **Recorded, never a 4.1 blocker by itself.** Forwarded to 4.2 planning |

Each observation also carries its anticipation mark (the five questions), as in `ANTISIPASI-4.1.md`.

## 7 · What staging needs (a bounded write, **pending your authorisation**)

| # | Fixture | For |
|---|---|---|
| F-1 | **One fresh synthetic school** (`sekolah-uji-…`), with only its admin account | T1 |
| F-2 | **A second synthetic school with a class of about 20 synthetic learners**, finished Pemetaan Awal and Uji Penguasaan, and one section weak by design | T2 |
| F-3 | In F-2: one Uji Penguasaan assigned and open, and **two shared lab devices** set as shared | T3 |
| F-4 | In F-2: a second staff account with `CAN_REVIEW`, and one prepared workbook (one chapter, one deliberate error, with its corrected version) | T4 |
| F-5 | The participants' own staff accounts, created through activation at the session (T1), not in advance | T1 |

**Constraints:**
- Synthetic names only.
- **No sign-ins outside the session window,** each logged (B1 rows are expected).
- **«Cetak laporan» not pressed** unless a task needs it.
- Fixtures are removed or left as the owner decides afterwards.

## 8 · After the session

- Within one day: the sheet (§5), a summary by task, and the classed list (§6), on my branch.
- Dr Gladys's review of educational meaning is added beside it, not merged into my usability notes.
