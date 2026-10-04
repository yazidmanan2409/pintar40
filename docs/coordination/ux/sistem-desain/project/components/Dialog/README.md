A short question asked from a place with no room to ask it in the page. Rare.

**Status: NEW, NEEDS A RULING (question 6).** PINTAR has no modal outside the tour today (spec §5); the in-page confirmation stays the default. Proposed for one kind of use: a destructive question asked from a menu, such as «Keluar dari semua perangkat?» (Gate 6).

**Markup.** The native `dialog.pds-dialog`, opened with `showModal()`: it holds focus, Esc closes it, and focus returns to its opener. A title (`t-subsection`), one or two sentences of consequence, and the actions at the end: the safe one first, the act named on its own button.

**When**
- A short destructive confirmation triggered from a menu, where the page has no room for an in-page confirmation: «Keluar dari semua perangkat?» from the account menu (Gate 6), with «Keluar dari semua» on the solid red button and focus on «Batal».
- Never for a form, never for information, never for something the person did not ask for.

**Rules**
- PINTAR's default confirmation is in the page (Confirmation). A dialog needs a reason (question 6 in the proposal).
- For a destructive act, focus starts on «Batal».
- The scrim (`scrim`) and `shadow-dialog` only here and on drawers.
- Under 640 px the actions stack, full width, the safe one last.
