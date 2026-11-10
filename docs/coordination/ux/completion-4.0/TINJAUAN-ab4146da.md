# The phone audit correction, confirmed at `ab4146da` (Daisy, 10 Nov 2026)

**Scope:** a read-only design check, not acceptance. Only C1 and C2 at 390 and 320 px, and the closed «Minta membaca lagi» page. Everything accepted at `821d3853` stays closed.

**Environment:** local only.
- this commit's own `npm ci`;
- Supabase reset to its migrations, then the report world;
- `next build` and `next start`.

**States, made through the screens:**
- 5B Bab 2 ended;
- the 5A run: 28 learners, **113** related rows. I gathered the 5C, 5E and 5F learners into 5A locally; one row fewer than at `821d3853`.

**Evidence:** `verifikasi-ab4146da/`: the screenshots named below, plus `catatan-jalan.txt` with every measurement and the focus order.

**Verification of `ab4146da`:** the local suite, CI 42785180308 and journeys 42785184326 are pending, as you reported.

## C1 and C2 at 390 and 320 px: **accepted**

My exact sequence, by keyboard: open «Catatan terkait (113)», then sub-page 2, then «Tutup catatan terkait». The same values held after each of the three steps, at both widths:

| Measured after each step | 390 | 320 |
|---|---|---|
| frame `scrollLeft` | 0 | 0 |
| «Waktu» cell inside the frame's visible box | yes | yes |
| «Tindakan» cell inside the frame's visible box | yes | partly; it runs to the frame's right edge, which shows the frame scrolls |
| header `position` | `static` (scrolls with the table) | `static` |
| element at the app bar's middle | the bar | the bar |
| «Waktu» header left = first cell left | 34 = 34 | 34 = 34 |
| the run's row top, under a 57 px bar | 72 | 72 |
| opened rows outside the frame's visible box | 0 | 0 |
| page scrolls sideways | no | no |
| sub-page 1 / sub-page 2 | 100 / 13 | 100 / 13 |

**Scrolling the frame by hand** to 200 px: «Waktu» moves with its column (header −166, cell −166). It is never held at the left, and it never labels another column.

**Scrolling the page** by 600 px: the header goes up with the table, and the bar stays the bar.

**At 1280:** nothing regressed. `scrollLeft` 0, header sticky as before, the run at 16 px.

Screenshots: `C-1buka-layar-390.png`, `C-1buka-layar-320.png`, `C-2hal2-layar-390.png`, `C-2hal2-layar-320.png`, `C-3tutup-layar-390.png`, `C-3tutup-layar-320.png`, `C-4gulir-layar-390.png`.

**Two notes, no change asked:**
- **The first Tab scrolls the frame.** After landing, Tab goes to the run's «28 murid…» summary in the last column, and the browser scrolls the frame to show it (`scrollLeft` 320 at 390 px, 390 at 320 px). That is the browser bringing focus into view, not the landing. The opened rows stay readable at the frame's visible left throughout.
- **On landing, the header row sits under the bar.** It is a 15 px empty strip between 57 and 72 px, because the anchor is the run's row and the header no longer sticks. That is acceptable: the column names are one scroll up.

## The closed «Minta membaca lagi» page: **accepted** (`B2-ulang-diakhiri-390.png`, `-320.png`)

`/ulang?penugasan=…` for the ended Bab 2 reads, in order:
1. «Matematika Kelas 5 · Bab 2: Data Sederhana»;
2. the heading «Minta membaca lagi»;
3. «Bab ini tidak lagi diberikan kepada kelas ini.»;
4. «Permintaan yang sudah dikirim».

The invitation and «target 70%» are gone, and there is no form. No sideways scroll at 390 or 320. On the learner page, «Minta membaca lagi» still shows only on Bab 1, the chapter still given.

## Still not seen

- the integrity count line;
- a certificate's date at a day boundary;
- «Materi tanpa judul»;
- real screen readers, Firefox and WebKit.
