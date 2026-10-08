When material opens and closes for a class: a composed journey for owner validation (11-validation.md §1).

**Status: SPECIMEN, APPLICATION READY (8 Oct).** Not PINTAR, and not applied: it shows the approved grammar working together; its findings are corrected at source.

**Who.** Rina Kartika, Guru, setting the window for Bab 4 in Kelas 5A.

**What it validates.** Date fields (15); 3:1 field outlines and the error under the field (3); hover and press at 120 ms (8).

**Composed against the product**
- 11-validation.md defined J5 as setting when an Uji Cepat opens. An Uji Cepat has no opening date in PINTAR: its window is counted in minutes from the moment it is made available («Berhitung sejak disediakan», mengajar.cepat.jendela.arti). The date fields a teacher really meets are the window of «Siapkan» (Mulai, Sampai; DAISY-14). J5 is composed there; confirmed 8 Oct (JQ5).
- The fields are dates only, as the product's are (type=date): «Mulai» and an optional «Sampai», where empty means «Tanpa batas akhir». The echo under each says the date in words with its day.
- The mistake is real: «Sampai» before «Mulai». Pressing «Sediakan» shows the server's own sentence under the field (mengajar.sedia.kode.assign_window_invalid) and moves focus to it; correcting the date clears it.
- Found while composing: the Date and time component's example is «Uji Cepat dibuka» with a date and a time. Corrected 8 Oct (F3).

**The steps**
1. The window

**Words.** 32 copy-table keys (D-014). New, not in the copy table yet (marked on the screens by «Mark new words», or listed here when they sit in an attribute):
- «(opsional)»: marks the optional «Sampai»; the product shows no mark today
- «Disediakan»: the result word of «Sediakan» (completion grammar); today the line only
- «Mengajar»: the group label for an educator who also learns (question 11); WP6B
- «Ciutkan navigasi»: the staff navigation's collapse control (question 1); the product has no rail yet
- «Buka menu»: the top bar's menu button under 1024 px (question 1)
- «Tutup menu»: closes the drawer under 1024 px
- «Langsung ke isi»: the skip link (question 10; 06-accessibility)

**The record**

| Check | 1280 | 1024 | 390 | Note |
|---|---|---|---|---|
| One obvious next action | pass | pass | pass | «Sediakan». |
| Where am I | pass | pass | pass |  |
| Every action answered, then its result in words | pass | pass | pass | The mistake is told under «Sampai» in the server's own sentence and focus goes there; correcting the date clears it; then «Menyediakan…», «✓ Disediakan» and the window in words. |
| Nothing by colour alone | pass | pass | pass | The error has its icon and words, and the field is marked invalid as well as outlined. |
| Targets 44 px (24 px floor) | pass | pass | pass |  |
| No sideways scroll at 390 px | — | — | pass | The two date fields stack. |
| Keyboard order and focus | pass | pass | pass | 22 presses at 1280 and 1024, 17 at 390. A native date field is three stops and the browser's own calendar button, which draws its own ring. Its order of day, month and year follows the device's language: on a device set to English it reads mm/dd/yyyy, which is why the date in words sits beneath (question 15). |
| Screen reader (the accessibility tree) | pass | — | pass | The error and the date in words are tied to their field. |
| Reduced motion | pass | pass | pass | Field outlines change at 120 ms with motion on, at once under reduced motion. |
| Anything that fights the content | pass | pass | pass |  |

**Findings**
- F1 · JQ5: an Uji Cepat has no opening date; the window of «Siapkan» is composed instead. Corrected or decided, 8 Oct.
- F3: the Date and time specimen says «Uji Cepat dibuka». Corrected or decided, 8 Oct.
