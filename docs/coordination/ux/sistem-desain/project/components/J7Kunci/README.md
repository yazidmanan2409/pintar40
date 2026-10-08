Stepping away from a shared computer: a composed journey for owner validation (11-validation.md §1).

**Status: SPECIMEN, APPLICATION READY (8 Oct).** Not PINTAR, and not applied: it shows the approved grammar working together; its findings are corrected at source.

**Who.** Rina Kartika, Guru, on the staff room's shared computer.

**What it validates.** The identity screens together; entering layers and reduced motion (8); keyboard and screen reader (10).

**Composed against the product**
- Gate 6 is built (BOB-29, D-101), so every word is the product's: jaga.peringatan and jaga.masih for the warning, kunci.* for the lock, kunci.tidak_cocok.2 for a wrong PIN. The lock names the staff member («Terkunci untuk Rina Kartika»); for a learner's class card it names no one (src/app/terkunci).
- The warning's heading is new: the product has the sentence and the button only.
- The two time steps are review steps, not PINTAR.
- Found while composing: the Lock screen and Idle warning components predate Gate 6 and use sample text («Buka PINTAR», «PIN (4 angka)», no name). Corrected 8 Oct (F4).

**The steps**
1. Working
2. 4 minutes
3. Locked
4. Wrong PIN

**Words.** 25 copy-table keys (D-014). New, not in the copy table yet (marked on the screens by «Mark new words», or listed here when they sit in an attribute):
- «PINTAR akan terkunci dalam 1 menit»: the idle warning's heading; the product has the sentence only (jaga.peringatan)
- «Mengajar»: the group label for an educator who also learns (question 11); WP6B
- «Ciutkan navigasi»: the staff navigation's collapse control (question 1); the product has no rail yet
- «Buka menu»: the top bar's menu button under 1024 px (question 1)
- «Tutup menu»: closes the drawer under 1024 px
- «Tampilkan PIN»: shows the PIN being typed
- «Langsung ke isi»: the skip link (question 10; 06-accessibility)

**The record**

| Check | 1280 | 1024 | 390 | Note |
|---|---|---|---|---|
| One obvious next action | pass | pass | pass | «Saya masih di sini» in the warning; «Lanjutkan» on the lock. |
| Where am I | pass | pass | pass | The lock says «PINTAR terkunci» and «Terkunci untuk Rina Kartika»; the title follows. |
| Every action answered, then its result in words | pass | pass | pass | A wrong PIN is told under its field (kunci.tidak_cocok.2). |
| Nothing by colour alone | pass | pass | pass |  |
| Targets 44 px (24 px floor) | pass | pass | pass | 36 px «Keluar» in the 390 top bar. |
| No sideways scroll at 390 px | — | — | pass | Found and corrected: a review step's long English label pushed the page to 450 px; review steps now wrap. |
| Keyboard order and focus | pass | pass | pass | 20 presses at 1280 and 1024, 15 at 390. The warning is announced (an alert) wherever focus is, and «Saya masih di sini» is reached from the page. The walk puts focus on each new screen's heading; the product's lock puts it on the PIN field when a PIN can be used (LayarTerkunci), and that rule stands. |
| Screen reader (the accessibility tree) | pass | — | pass | The warning is an alert with its own heading; the wrong-PIN line is an alert tied to the field. |
| Reduced motion | pass | pass | pass |  |
| Anything that fights the content | pass | pass | pass |  |

**Findings**
- F4: the Lock screen and Idle warning specimens predate Gate 6. Corrected or decided, 8 Oct.
