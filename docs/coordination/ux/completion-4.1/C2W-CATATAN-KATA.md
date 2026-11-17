# C2w · «Catatan peninjau»: the design page reviewed, and the missing words (Daisy, 17 Nov 2026)

> **What holds now:**
> - **NO BLOCKER TO BUILD** from my side, with the words below.
> - **Answers to Second Eye's four gaps** (§1 to §4) and the placement (§5).
> - **Read:** `docs/completion-4.1/batches/C2W-COMPLETION.md` on `claude/c2w` at `be01b4f237a4bf0b6a582a6a1a979def88969831`. Existing strings checked in that commit's `hle.ts`: «Riwayat soal ({n} versi)», «Versi {n}», «Pemahaman keliru», «belum dikaitkan», `soal.tak_terkait`, and the «… 10 sampai 1000 karakter.» pattern.

## 1 · The disclosure's states

**Summary:** «Catatan peninjau ({n})», where {n} counts the **current** notes, one per option at most, as «Riwayat soal ({n} versi)» counts.

| State | Studio, for a reviewer | Studio, for a drafter (`CAN_DRAFT` only) | Beside the class report (teacher) |
|---|---|---|---|
| **No note** | The disclosure shows «Catatan peninjau (0)», and inside, per option, its write form (§2) | **Not shown** | **Not shown** |
| **One note on an option** | That option's block: the I-5 line when it applies, the text, then the attribution | The same, read only | The current note only, read only, with the teacher's I-5 line |
| **A replaced note** | The current note as above. Below it, a nested `<details>` «Catatan sebelumnya ({n})», listing the older notes, oldest last. Each has its text and its attribution, plus «Diganti pada {tanggal}» | The same | **Not shown.** A teacher reads only what holds now |

**Per-option block:**
- The heading is «Pilihan {label}».
- Options with no note are **not listed** for readers.
- For a reviewer, every option is listed, so each has its form.

## 2 · The writer's form (reviewers only)

**One form inside each option's block.** So there is **no option select**: the option is the block. That removes a choice and a way to pick the wrong one.

| Element | ID | EN |
|---|---|---|
| Button that opens it | «Tulis catatan» (no note yet) / «Ganti catatan» (a current note exists) | «Write a note» / «Replace the note» |
| Field label | «Catatan untuk pilihan {label}» | «Note on option {label}» |
| Hint | «Apa yang ditunjukkan pilihan ini tentang cara berpikir murid? Catatan ini tidak dilihat murid dan tidak mengubah soal atau nilai. Sampai 1000 karakter.» | «What does this option show about how learners think? Learners never see this note, and it changes no question or score. Up to 1000 characters.» |
| Extra hint when replacing | «Catatan lama tetap tersimpan dan terlihat di Catatan sebelumnya.» | «The old note stays saved and visible under Earlier notes.» |
| Save | «Simpan catatan» | «Save the note» |
| Cancel | «Batal» | «Cancel» |
| Result (`role="status"`) | «Catatan tersimpan.» | «Note saved.» |

**Refusals.** Each is `role="alert"` and ends «Tidak ada yang disimpan.» The form keeps the text that was typed, as A2b's BL-1 rule requires.

| Case | ID | EN |
|---|---|---|
| Empty, or over 1000 characters | «Tulis catatannya, 1 sampai 1000 karakter. Tidak ada yang disimpan.» | «Write the note, 1 to 1000 characters. Nothing was saved.» |
| Question not sealed (published) | «Catatan peninjau hanya dapat ditulis untuk soal yang sudah diterbitkan. Tidak ada yang disimpan.» | «Reviewer notes can only be written on a published question. Nothing was saved.» |
| Not a reviewer here | «Hanya peninjau sekolah pemilik soal ini yang dapat menulis catatan peninjau. Tidak ada yang disimpan.» | «Only a reviewer at the school that owns this question can write reviewer notes. Nothing was saved.» |
| A library question, by a school | «Soal Pustaka PINTAR hanya diberi catatan oleh peninjau PINTAR. Tidak ada yang disimpan.» | «PINTAR Library questions are annotated only by PINTAR's reviewers. Nothing was saved.» |
| **The neighbour: someone replaced it first** (the unique index on `menggantikan_id`) | «Catatan ini baru saja diganti oleh peninjau lain. Muat ulang halaman untuk membaca catatan terbarunya. Tidak ada yang disimpan.» | «Another reviewer has just replaced this note. Reload the page to read the latest note. Nothing was saved.» |

**On existence.** An unknown item and an unreadable item are refused alike. They take the existing `galat.action_not_allowed` («Langkah ini bukan wewenang Anda.»), as A2b's S-1 and C2w's «Tarik izin» do. **The not-a-reviewer line above is for a readable question only.** If that distinction leaks existence, Sharon decides, and both cases use `galat.action_not_allowed`.

## 3 · The attribution line (`pin-meta`, under the note's text)

| Where | ID | EN |
|---|---|---|
| Studio | «{nama} · {tanggal} · versi {n}» | «{nama} · {tanggal} · version {n}» |
| Teacher | «Peninjau: {nama} · {tanggal}» | «Reviewer: {nama} · {tanggal}» |
| **A platform-library note**, either place | {nama} becomes «Peninjau PINTAR» | «PINTAR reviewer» |

**Notes on the line:**
- **{tanggal}** is the date only, in the school's zone and format («12 Nov 2026»), with non-breaking spaces as in A2b.
- **{n}** is the same number «Riwayat soal» shows.
- **The teacher's line has no version,** as with I-5's teacher variant.
- **Library notes are not named:** a school does not see the platform's staff by name, the same choice as «Admin PINTAR».

## 4 · «belum dikaitkan dengan pemahaman keliru»: neither on every note, nor inside the note

**It stays where it already is, attached to the option, never to the note.**
- **Studio:** the option's existing «Pemahaman keliru: belum dikaitkan» (F1-R1b).
- **Class report:** the existing `soal.tak_terkait` line.

**Why:**
- On every note, it would be **false** for an option that *is* linked to a misconception.
- M-3 means the note never names a code, but the option still may have one.
- The marker describes the option's link, not the note. The reader sees both in the same block.

**Ruling 30's phrase:** the full form «belum dikaitkan dengan pemahaman keliru» appears where a sentence carries it (`soal.tak_terkait`). The short «belum dikaitkan» appears beside the «Pemahaman keliru» label. No new string.

## 5 · Placement in Studio

**After «Riwayat soal», as its own sibling disclosure, not inside it.**
- «Riwayat soal» is about the question's **versions**. The notes are about the **options' meaning** across versions.
- Inside, they would be buried two levels deep.
- Before, they would split the history from the question it follows.

**The order is:**
1. the question;
2. «Riwayat soal (n versi)»;
3. «Catatan peninjau (n)».

**Beside the class report:** directly under the question's evidence row, after the option distribution, so the note sits next to the counts it explains.

## 6 · Checks I will make at B7

- Both disclosures by keyboard: the summary, the nested «Catatan sebelumnya», and the form.
- The I-5 line as the first line, in `pin-meta`.
- 320 px with a 1000-character note.
- **Print:** nothing from the notes prints (O-3).
- No «anotasi» anywhere.

## 7 · Anticipation

**Found before the build**, by **question 2** (the neighbour: two reviewers replacing at once) and **question 5** (where «belum dikaitkan» renders, and for whom).

---

## 8 · Additions, 17 Nov 13:35, on Second Eye's build (`claude/c2w` at `5b34fa5f`)

**8.1 · NOTE_EXISTS** (two reviewers write the **first** note on one option at once): **Second Eye's provisional sentence is accepted as final.**
- ID «Pilihan ini baru saja diberi catatan oleh peninjau lain. Muat ulang halaman untuk membacanya. Tidak ada yang disimpan.»
- EN «Another reviewer has just written a note on this option. Reload the page to read it. Nothing was saved.»
- It is the sibling of §2's "replaced first" line, in the same form.

**8.2 · A note never names a learner (D4): in the form's hint, as its second sentence.** The hint becomes:
- ID «Apa yang ditunjukkan pilihan ini tentang cara berpikir murid? Jangan menyebut nama atau data murid mana pun. Catatan ini tidak dilihat murid dan tidak mengubah soal atau nilai. Sampai 1000 karakter.»
- EN «What does this option show about how learners think? Do not name any learner or include any learner's data. Learners never see this note, and it changes no question or score. Up to 1000 characters.»
- It goes in the hint, not in a refusal, because PINTAR cannot check it. The words match X-1's guide.

**8.3 · Notes on several versions of one option: keep both in Studio; one note for the teacher.**
- **Studio:**
  - Keep both current notes, as built.
  - **Order:** the note on the **version on screen** first, then the others, newest version first. Not simply newest-written first: the reader came to read this version.
  - The count «Catatan peninjau (n)» counts all of them, as built.
  - «Ganti catatan» replaces only the note on the version on screen. Notes on other versions show no button, so their attribution («versi {n}») tells the reader why.
- **Beside the class report:** **one note per option.**
  - It is the note on the revision in force when there is one.
  - Otherwise it is the newest note on an earlier revision, with the teacher's I-5 line when the key differs.
  - The teacher's line has no version number, so two unnumbered notes on one option would read as a contradiction.

**Anticipation:** 8.1 and 8.3 were found by Second Eye in the build, and both are neighbours of §2 and §1 (**question 2**). They were anticipable, and the cases are mine: I wrote §1 with one current note per option in mind.
