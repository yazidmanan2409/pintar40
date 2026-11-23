# Z6 · rulings on the framed-overflow sweep at `claude/z-ux` `f322c25c` (Daisy, 23 Nov 2026)

> **What holds now:** **Z6 is not complete yet. Three defects are fixed in Z6, with one fix; one more is Z6's.**
> - **R-11 and N-8 as built are accepted.**
> - **(2) and (3) are not defects.** A framed table scrolling inside its own named, focusable frame is the design. The assertion should allow it rather than list it.
> - **(1), (4) and (5) are one defect** (`pin-seg` scrolls): fix in Z6.
> - **(6) is Z6's own:** fix it.
> - **TandaTautan in the switch:** blessed.
> - **Afterwards, `BINGKAI_DIKETAHUI` should be empty,** apart from pages not yet covered, which the post-merge run reaches.
> - **Read:**
>   - `experience.css` at `f322c25c`: `.pin-tabel-bingkai`, `.pin-seg`, the R-11 container rules;
>   - every `pin-tabel-bingkai` use: all are `role="region" tabIndex={0}` with a name.

## 1 · Rulings

**(2) and (3) · Framed tables at 390 and 320: acceptable by design, not defects.**
- **Why:**
  - `.pin-tabel-bingkai` is PINTAR's designed fallback for a wide data table. It is `overflow-x: auto` inside `max-width: 100%`, with its own focus ring. Every use is `role="region"`, `tabIndex={0}` and named («Jejak audit», «Catatan masuk», the collection's name), so a keyboard user can scroll it and a screen reader announces it.
  - WCAG 1.4.10 allows two-dimensional scrolling for data tables.
  - The page itself never scrolls sideways.
- **Why R-11 still stacks `/siapa`:** it is the teacher's in-class task surface on a phone, where acting row by row matters. `/aktivasi/orang` and Jejak audit are administrative records, read more than acted on.
- **The assertion should allow it, not list it.** A sideways-scrolling box inside `main` passes **only if** it is a `.pin-tabel-bingkai` with `role="region"`, `tabindex="0"`, and an accessible name (`aria-label` or `aria-labelledby` that resolves to text). Anything else that scrolls sideways fails. A frame missing any of the three also fails.
- **(2) and (3) come off `BINGKAI_DIKETAHUI`.**
- **For the ruling 79 audit:** whether `/aktivasi/orang` would also benefit from R-11's blocks is a *later* question, not a defect.

**(1), (4) and (5) · `pin-seg` scrolls: one defect, fix in Z6.**
- A segmented control that scrolls hides some of its options. A person can't see all the choices, at 320 (1: the Uji Cepat minutes) or even at 1280 (4: «Siapa»'s state filter, 778 px in 712).
- The scroll is also what clips its own focus ring (5).
- **The fix, in `.pin-seg` itself:** it never scrolls. It wraps between options (`flex-wrap: wrap; overflow-x: visible`), and each option stays whole on one line. This is the same rule the instrument switch now follows.
- The selected state and `aria-checked` are unchanged. The focus ring is no longer clipped, because nothing scrolls.
- **Test:**
  - **Z-BINGKAI** fails any `.pin-seg` with `scrollWidth > clientWidth`.
  - At 320 and 1280, every option's box lies inside the control, and the focused option's outline is not clipped (`getComputedStyle` overflow is visible on every ancestor up to the control).
- **(1), (4) and (5) come off `BINGKAI_DIKETAHUI`.**
- **Note:** where a `pin-seg pin-lebar-saja` has a `pin-sempit-saja` select twin, the twin keeps working as before. Wrapping only changes the wide form.

**(6) · The pager's anchor below 640 px: Z6's own, fix it.**
- It comes from R-11's change: the anchor points at the table frame, which is hidden in the block view, so a page change lands nowhere.
- **The fix:** the pager's target is the collection's wrapper (`.pin-koleksi`), which is visible in both views. A page change brings the reader to the list, and the list's name is read first.
- **Test:** below 640, after «Berikutnya», `document.activeElement` or the scroll position is at the collection, not at a hidden element.

**TandaTautan inside the switch: blessed.**
- An empty second pill with its own focus ring is a stray focus stop. Neutralising it inside the switch is right.
- Let the post-merge sweep also look for any other place where `TandaTautan` draws an empty focusable box. If one is found, it is the same fix.

## 2 · After the fixes

- **`BINGKAI_DIKETAHUI`:** empty.
- **Still uncovered:** uji-cepat/hasil and sertifikat when empty, and `/studio/tinjau/kunci`. The post-merge run covers them, with the K-01 verdict screens.
- **If that run finds a new framed problem:** it is fixed then, or listed with its own audit item. It is not parked silently.

## 3 · Accepted as built

- **R-11:** blocks below 640 px. The name is the heading, then the sitting line, «Keadaan» with its chip, and «Atur». The table is hidden. The switch wraps one per line below 360, keeps `aria-current`, and never scrolls.
- **N-8:** Studio's nested disclosures go from 188 to 212 px at 320.
- **The sweep command** and run 1 green, at 390 and 320.
