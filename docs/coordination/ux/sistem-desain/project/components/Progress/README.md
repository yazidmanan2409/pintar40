How far something has come, only as PINTAR knows it: a committed count, named steps, or a sentence for work with no known end.

**Status: KEPT** (committed counts, TahapKomitmen, the reading dots), restyled.

**Kinds**
- **A count** (`pds-progress`): «Murid yang sudah mengerjakan … 24 dari 31», with a bar drawn to that count. `role="progressbar"` with `aria-valuetext`.
- **Named steps** (`pds-steps`): «Atur → Tinjau → Tersedia», with `aria-current="step"`.
- **A population** (`pds-populasi`): who a figure is about, before the figure. One line of counts, not a chart: «30 murid di kelas ini · 6 sudah mengerjakan Uji Penguasaan · 24 belum mengerjakan». Bands and bars below it are headed by their own base («Hasil 6 murid yang sudah mengerjakan») and drawn over that base only. «Belum mengerjakan» is never a bar, a band or a band colour (D-121(c), D-123(3)). When the pass mark is governed, «5 mencapai target · 1 di bawah target» sits inside the bands.
- **In flight** (`pds-result-working`): a sentence and the working dot.

**Rules**
- A bar is a committed count. It never moves by itself, never animates, and never shows a percentage PINTAR does not know.
- No progress bar for a learner's lesson: a page is a place, shown as «Bagian 2 dari 5».
- Finishing is not an achievement: no celebration at 100%.

**In PINTAR today.** TahapKomitmen (`.pin-steps`), the reading dots (`.pin-lpos`), the data stripe (`.pin-data-bar`).
