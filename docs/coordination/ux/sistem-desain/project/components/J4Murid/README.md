A lesson, a question and its result: a composed journey for owner validation (11-validation.md §1).

**Status: SPECIMEN, APPLICATION READY (8 Oct).** Not PINTAR, and not applied: it shows the approved grammar working together; its findings are corrected at source.

**Who.** Bagas, a learner in Kelas 5A, on a shared school computer and on a phone.

**What it validates.** The learner's top bar at every width (1); the question stem outside the ladder; one obvious next action; WCAG 2.2 AA with the skip link (10).

**Composed against the product**
- The learner is greeted by first name on their own page («Halo, Bagas», D-020) and named nowhere in the bar: the bar says «Bukan akun Anda?» beside «Keluar» (S15).
- The question screen wears the focus shell: no Belajar or Sertifikat, no Bantuan, only the language, «Bukan akun Anda?» and «Keluar».
- The lesson and question texts are sample content, not copy; every interface word is the copy table's (siklus.*, lesson.*, posttest.*, hasil.*).
- Submitting is confirmed in the page (question 6: in-page confirmation stays the default), with posttest.submit_confirm's own words.

**The steps**
1. Beranda
2. Lesson
3. Question
4. Result

**Words.** 39 copy-table keys (D-014). New, not in the copy table yet (marked on the screens by «Mark new words», or listed here when they sit in an attribute):
- «Bahasa»: the language switch's accessible name
- «Langsung ke isi»: the skip link (question 10; 06-accessibility)

**The record**

| Check | 1280 | 1024 | 390 | Note |
|---|---|---|---|---|
| One obvious next action | pass | pass | pass | «Lanjutkan pelajaran», «Berikutnya», «Simpan jawaban ini», then «Beranda». «Kumpulkan» stands apart, secondary, with its consequence in words. |
| Where am I | pass | pass | pass | «Belajar» is the current tab; inside the assessment the focus shell hides the tabs and the eyebrow says «Uji Penguasaan · Bab 3». |
| Every action answered, then its result in words | pass | pass | pass | «Menyimpan…», then «✓ Tersimpan» and «Sudah dijawab: 7 dari 10.» |
| Nothing by colour alone | pass | pass | pass |  |
| Targets 44 px (24 px floor) | pass | pass | pass | Every choice is a 44 px row. |
| No sideways scroll at 390 px | — | — | pass |  |
| Keyboard order and focus | pass | pass | pass | 15 presses; the arrows move the choice inside the question. |
| Screen reader (the accessibility tree) | pass | — | pass | The stem is the choices' legend, so each choice is read with its question. |
| Reduced motion | pass | pass | pass |  |
| Anything that fights the content | pass | pass | pass |  |

**Findings**
- F11: the assessment's «Kumpulkan» panel is a review before the act, not a Confirmation. Corrected or decided, 8 Oct.
- F12: the shell documents say a learner is never named; D-020 greets by first name here («Halo, Bagas»). Corrected or decided, 8 Oct.
