Where am I, how much is there, and how do I move: always all three.

**Status: NEW** as a shared component (the intake's name list pages today on its own terms). The jump select and the filled current page came from the 4 Oct visual references.

**Three patterns**
- **Under a table (the default):** «Menampilkan 21–40 dari 312 murid», «Halaman 2 dari 16», and «Sebelumnya» / «Berikutnya» buttons.
- **A report people jump around in:** page numbers with ellipses (1 … 4 5 6 … 16), then «Ke halaman [▾] dari 16», a native select that reaches any page in one move. The current page is filled `pintar-primary` with `aria-current="page"`, the same filled selection as the segmented control.
- **A list read in order:** «Tampilkan 50 nama lagi», with «Menampilkan 50 dari 500 nama».

**Small screens.** Under a table: «2 / 16» and two icon buttons with accessible names; the words step back from the eye only: they stay in the button, visually hidden, so each button keeps its own name (4.0 correction; never `display: none`). In a report: ‹ [2 ▾] dari 12 ›, where the select replaces the page numbers (seven 44 px numbers do not fit 320 px).

**Rules**
- Never hide the total. If it is not known (keyset pages), say what is shown: «Menampilkan {dari}–{sampai} {benda}» (`koleksi.menampilkan_tanpa_total`, D-172 K2), or «Menampilkan 50 nama terbaru».
- «Sebelumnya» is shown, disabled, on the first page; it is never omitted, and never «Kembali» (D-172 K2, K6).
- Page size is fixed by the surface; no «baris per halaman» control unless people asked for one.
- Moving to a page keeps the person's place: focus goes to the current page number, or to the table.
