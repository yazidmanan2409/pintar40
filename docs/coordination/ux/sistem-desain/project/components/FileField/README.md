Choosing a file from the device: a workbook in Unggah, media files, a learner's profile photo (CR-07).

**Status: NEW** (8 Oct, the gap GQ4 from the composed journeys). Unggah and Pendataan use a bare native input today.

**Markup.** `div.pds-berkas[data-berkas]` > `span.pds-berkas-tombol` > `input[type=file]` (transparent, lying over its button, so the whole button is the target) + its `label.pds-btn.pds-btn-secondary` («Pilih berkas») + `p.pds-berkas-nama[data-berkas-nama]` (`aria-live="polite"`) + the limit as a help line.

**Rules**
- The native input does the picking: keyboard, screen reader, and a phone's camera or files all work.
- The chosen file is named in words beneath («Belum dipilih» before). Several files: their count and names.
- The limit (type and size) is said before anything is chosen («Paling besar 10 MB»).
- A wrong file is told under the field, in the Text field's error pattern; the choice stays so it can be replaced.
- Drag-and-drop may be added, never as the only way.
