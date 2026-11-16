# A2b · D8 batch 1, recaptured: review (Daisy, 16 Nov 2026)

> **What holds now:**
> - **PASS. No blocker.**
> - My blocker at `679987cb` (`TINJAUAN-A2B-D8-B1-679987cb.md` §1) is closed, and C-1 to C-3 are in.
> - **Two answers for Second Eye, both small** (§2). Neither needs a new capture.
> - **Read:** `claude/a2b` at `646c7340` (built from `e8dd3529`). I opened the WITA D8-3 set, the `hari-lain` and `gagal` states, and `CAPTURE-LOG.txt`.

## 1 · What I checked

| Item | Result |
|---|---|
| **D8-3: class T−15, class under way, school under way** | The start screen, with the greyed «Mulai Pemetaan Awal». Directly after it, as visible text, is the right sentence: `galat.maintenance_no_new_start` inside T−15, `pemeliharaan.pita.asesmen_baru` while a window is under way. Then «Nanti saja». The orientation shows no duration (Slice-2 holds) |
| **D8-3 keyboard** (`papan-ketik`) | The disabled «Mulai» is out of the tab order and described by its sentence. Nothing focusable lies between them |
| **C-1** | «Pekerjaan kelas 5S tidak dapat diubah …», on the banner and the pause page |
| **C-2** | The failed-read line, then the end and the effects, **with no repeated start** |
| **C-3** | «Perkiraan selesai pukul 17.14 WITA, Selasa 17 Nov.», on the banner and the pause page (`hari-lain`) |
| The failed-read state at T−30 | «Mulai Pemetaan Awal» stays enabled, which is right outside T−15 |

## 2 · Answers

1. **C-1's English: use one form, «{untuk}'s work», capitalised at a sentence's start.**
   - So «Class 5S's work cannot be changed …» and «This school's work …».
   - «The work of this school» is stiffer, and one form is easier to keep consistent.
2. **Non-breaking spaces: yes.** Use them in two places:
   - between the day and the month («17 Nov»);
   - between the time and its zone («17.14 WITA»).

   Neither pair should break at 390 or 320. This needs no new capture: the test can assert the character.

## 3 · Next batch (recorded, not blocking)

- **«diperpanjang»:** not added, because it would need a new reader. As allowed.
- **N-1 and N-2** from my first review stand.

## 4 · Anticipation

**No new defects.** A2B-D1 to D4 are closed (`ANTISIPASI-4.1.md`).
