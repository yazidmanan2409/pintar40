APPLICATION READY on bb0f98a74a0d7411f584af8edcd4d12869eeb735

# Daisy · batch 4, closed: the design system is APPLICATION READY (8 Oct)

**From:** Daisy (UX-1). **To:** the coordinator, for Second Eye's verification and then the application slices. **Authority:**
- the approved design system (questions 1 to 17);
- the batch 4 brief §3;
- the owner directive of 8 Oct: Daisy decides design execution within the approved system, and no ruled item is reopened.

**Scope:** design only, all `[skip ci]`. Nothing in `src/`, no CI dispatched (621 of 1,900 unchanged), invented people only, the card and the certificate untouched.

## What changed since HANDOFF-DAISY-41

Every finding from the composed journeys is corrected at source:
- **F2:** the Table and Table rows specimens offer only what a teacher can do («Lihat bukti», «Minta membaca lagi»).
- **F3:** no «Uji Cepat dibuka» anywhere. Dates are the «Siapkan» window (Date and time, Dates, Panel).
- **F4:** the Lock screen and Idle warning use Gate 6's built words. A staff lock names its owner; a class card's lock names no one.
- **F5:** no teacher publishes. «Siapkan materi» / «Sediakan» replace it in App shell, Confirmation, Specimen and Action feedback, and in the README and Button examples. Publishing's result is «Terbit sejak …». The destructive example is the school admin's «Nonaktifkan Kelas 5C».
- **F7:** a state badge in a table wraps under 640 px.
- **F8:** in the rail, a hairline separates «Mengajar» and «Belajar». Order and grouping are unchanged (question 11).
- **F9:** inside the demonstration room, the page title starts «MODE PERAGAAN ·».
- **F10:** while more tabs follow, the tab row's edge fades, and the current tab is kept in view.
- **F11:** Confirmation's scope is written down. A review before the one act is a Panel; an act that needs a reason is a form page, never the Dialog.
- **F12:** a learner is never named in the bar; the first-name greeting on Belajar and the home page is D-020's one exception (Navigation, Identity, Learner shell).
- **F13:** the top bar's «Keluar» is the default 44 px button.
- **F14:** a bare verb only where the heading above names the object (Button, README).
- **F15:** the Table's count is announced.

**The open questions are decided within the approved grammar:**
- **JQ1, JQ3, JQ5, JQ6:** confirmed as composed.
- **JQ2:** «Keluar dari semua perangkat…» moves into the account menu and asks in the Dialog. The class list is one table.
- **JQ7:** the rail hairline.

**The gaps the closure register needed are closed in the grammar:**
- **GQ1:** Progress gains a «population» kind for CR-81.
- **GQ2:** CR-77's outcome is read on the page the case was referred from.
- **GQ3:** the email system stays D-079's, through the DAISY-19 frame.
- **GQ4:** the new File field component.
- **GQ5:** an act that needs a reason is a form page.

**The stripe is A.** Question 14 ruled A, with A+ only if A demonstrably fails. No failure has been shown. The three-display record stays in `11-validation.md` §2 as an optional field check, with the A+ path ready if a display ever fails.

**Copy for the slices:** `11-validation.md` §4 holds the final words. They are applied in the slices, because `hle.ts` is code:
- CR-50, CR-13, CR-76 and CR-81;
- C1 («Keluar dari semua»), C2 («murid», «menyediakan»), «Tandai soal ini», and «Menerbitkan…» for step 7.

## Checks on this commit

- `npx tsx docs/coordination/ux/sistem-desain/alat/pratinjau.mts --sempit`: «60 previews, 0 with a failure».
- `python3 docs/coordination/ux/sistem-desain/alat/kontras.py`: «61 pairs, 0 under the floor».
- `npx tsx docs/coordination/ux/sistem-desain/alat/jalani.mts`: «7 journeys, 0 runs with a finding».
- `npx eslint docs/coordination/ux/sistem-desain/alat/`: 0 errors.

## Second Eye verification (8 Oct)

An independent audit against the approved requirements only, under the owner directive's rule: every defect cites the violated requirement and shows the failure.

**The verdict:** four defects. Each is corrected at source, then the full checks were re-run:
- **D1:** «Uji Cepat dibuka» was left in Disclosure, Specimen and the Date and time rule's example. It now reads «disediakan», and the example is the «Siapkan» window.
- **D2:** Checkbox and Specimen labelled their class choices «Terbitkan untuk kelas». They now read «Sediakan untuk kelas».
- **D3:** the D-020 wording was still wrong in the README's content rules, «Visual references» and Identity's status line. It is now corrected there too.
- **D4:** `11-validation.md` still showed the stripe as provisional, J1's definition as unchanged, and A's finality as conditional. Corrected.

**Everything else was verified present:** F2, F4, F5, F7 to F11, F13, F15, the four composition corrections, File field and the population kind.

## For further verification

Verify against `11-validation.md` and each component's README. The evidence:
- `render/laporan.txt`: every preview and every journey screen at its widths;
- `render/jalan/`: the keyboard walk, the Tab stops and the accessibility trees.

The screen-reader check here is a review of the accessibility tree. A pass with NVDA or TalkBack belongs to the application pass, on the real screens.

## Next

The application pass, slice by slice, when the coordinator opens it (`08-migration.md` maps every change). Nothing is propagated to PINTAR before then.
