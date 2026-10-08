Five families of button, every one 44 px to hit, so similar acts look and behave alike everywhere in PINTAR.

**Status: CHANGED.** Builds on `.pin-btn` and TombolKirim. 40 px becomes 44 px; every family gains a pressed state; the processing look stays TombolKirim's (busy, disabled, its own «…» word), and a confirmed result now shows ✓ on the button.

**Families**
- **Primary** (`pds-btn pds-btn-primary`): the one action the screen is for. Exactly one visible at a time.
- **Secondary** (`pds-btn-secondary`): another real action beside the primary, or the only action when none is primary.
- **Quiet** (`pds-btn-quiet`): cancel, back, a low-stakes action in green words without a box.
- **Destructive** (`pds-btn-destructive`): starts a destructive act in red words; it opens a confirmation. The confirmation's own button is `pds-btn-destructive-confirm`, the only solid red in PINTAR.
- **Icon-only** (`pds-btn-icon`): only where an icon is universally understood (close, more options, collapse). Always `aria-label` and a tooltip (`data-tip`).

**Sizes.** Default 44 px (`control-md`). Large `pds-btn-lg` (52 px, `control-lg`) on sign-in and a learner's own primary action. Compact `pds-btn-sm` (36 px to look at, 44 px to hit) only in a dense table toolbar or a row.

**States.** Hover, pressed, focus and disabled as in Interaction states. Processing (`aria-busy="true"`) keeps the button's own colour and shows the working dot and the progressive word; completed (`data-keadaan="selesai"`) shows ✓ and the result word on the success ground. Both are driven by Action feedback, never set by hand.

**Rules**
- The label is a verb and its object: «Sediakan Bab 4», «Kirim kartu». Never «OK», «Ya», «Submit». A bare verb only where the heading right above it names the object («Terbitkan» under the chapter's step «Terbitkan»). Siapkan materi's last button names its object: «Sediakan {materi} untuk {kelas}».
- A disabled button always has its reason written beside it, or it stays enabled and explains on press.
- A link that goes somewhere is a link, even if it looks like a button (`<a class="pds-btn …">`); a button does something.
- No icons for decoration; a leading icon only where it speeds recognition (trash for delete).

**In PINTAR today.** `.pin-btn` (40 px), `.pin-btn.pin-primary`, `.pin-btn.pin-quiet`, `.pin-mbtn`, `.pin-sesi-keluar`, the sign-in action, and TombolKirim's pending state. v3 makes them one button at 44 px with a pressed state for every family.
