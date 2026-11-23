# Z6 (stream B) · R-11, the framed-overflow assertion and its sweep, N-8

> **How they were taken:** on the local app of `claude/z-ux`, by `next start` against a local stack. Widths 1280, 390
> and 320 px, and 360 and 359 for the instrument switch's boundary; device scale 2, viewport only.
> - **Keyboard only:** focus, Enter. There are no clicks.
> - **`CATATAN-Z6.txt`** has, per shot: the window's overflow (**0 px in every shot**), the rendered-check helper's own
>   framed-overflow measure inside `main` (BINGKAI), the focused element, the live region and the part the row changes.
> - **Script:** `tangkap-z6.ts`. The world: A1's Kelas with three open sittings on its Pemetaan Awal and 45 more
>   learners (so «Siapa» has a second page), and C1w's package, published, with a reviewer's note on option B replaced
>   once. Everything is removed after the run.
> - **After Daisy's rulings (TINJAUAN-Z6-f322c25c):** a wide data table may scroll in a named, focusable region frame;
>   a segmented control never scrolls and wraps between whole options; the pager returns to the collection.
>   `BINGKAI_DIKETAHUI` is empty.

## The sweep: one command, run twice

```
PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/sapu-z6.ts "<label>" <out.txt>
```

- It reads the source for every file that draws `pin-tabel-bingkai` or `pin-seg`, opens each page as the person who
  reaches it at 1280, 390 and 320, and measures it with `BINGKAI` from `audit/a11y.mjs`, the helper the crawl uses too.
- On each segmented control: every option lies inside the control, and no box around it cuts the option's focus ring.
- No link mark (`TandaTautan`) draws a box of its own.
- On «Siapa» below 640 px: «Berikutnya», by keyboard, lands the reader at the collection, below the sticky bar.
- It lists the pages it **covered** and **did not cover** (with why), and prints N-8's widths on Studio's package page.
- **Run 1** (this commit): `../z6-sapu-1.txt`, GREEN. Run 2 follows Second Eye's second integration merge (K-01's screens).

| Page | Drawn by | Run 1 |
|---|---|---|
| `/mengajar/[kelas]` | Koleksi | clean |
| `/mengajar/[kelas]/siapa` (both instruments) | Koleksi + `pin-seg-tautan` | clean (was 452 px in 324; the switch 282 in 256 at 320) |
| `/mengajar/[kelas]/uji-cepat` | `pin-seg` | clean (the minutes wrap; was 286 px in 256 at 320, the rings cut at every width) |
| `/aktivasi/orang` | Koleksi | clean: the people table scrolls in its named, focusable region (allowed) |
| `/konfigurasi/catatan-masuk` | `pin-tabel-bingkai` | clean |
| `/konfigurasi/audit` | `pin-tabel-bingkai` | clean: Jejak audit scrolls in its region, named by its heading (allowed) |
| not covered | `/mengajar/[kelas]/uji-cepat/hasil` and `/konfigurasi/sertifikat` draw no table with no rows; `/studio/tinjau/kunci/[koreksi]` needs a pending key correction | — |

«Siapa»'s state filter (1280: 778 px in 712) wraps too. The crawl holds any framed overflow at 320 px broken;
`BINGKAI_DIKETAHUI` is empty.

## Shots

| Shot | Row | What it shows |
|---|---|---|
| `z6-01-siapa-pemetaan-*` | R-11 | «Siapa», focus on the switch's other option. At 1280 the table; at 390, 360, 359 and 320 the learners as blocks. The switch is one row at 360, one option a line at 359 and 320 |
| `z6-02-siapa-uji-*` | R-11 | Enter on «Uji Penguasaan»: that instrument's page, its option current (`aria-current`) |
| `z6-03-siapa-blok-*` | R-11 | Focus on «Atur» in a learner's block: the name as its heading, «Mulai … · sisa … menit», «Keadaan» with the state, «Atur» |
| `z6-04-siapa-atur-*` | R-11 | Enter on «Atur»: the panel opens under the list, focused |
| `z6-05-paket-catatan-*` | N-8 | Studio, a published package, «Catatan peninjau» opened by Enter. At 320 it is 212 px wide (was 188) |
| `z6-06-uji-cepat-menit-*` | Ruling | Uji Cepat's minutes, the last option focused: one row at 1280 and 390, wrapping at 320, the ring whole |
| `z6-07-siapa-saring-1280` | Ruling | «Siapa»'s state filter at 1280, its last option focused: it wraps between whole options |
| `z6-08-siapa-berikutnya-*` | Ruling (6) | «Berikutnya» by keyboard at 390 and 320: page 2's blocks, the collection below the sticky bar (72 and 112 px) |

## Recovery walks (ruling 81 item 7)

| Path | What happened | Work kept | Next step |
|---|---|---|---|
| **The other instrument** (`01` → `02`) | Enter on the option: its page, marked current | The class, the place in the list | Back, or the other option |
| **A learner's sitting** (`03` → `04`) | Enter on «Atur» in the block: the panel, focused | The list above it | The panel's own acts, or its way back to the list |
| **The next page** (`08`) | Enter on «Berikutnya»: page 2, at the collection | The search and the filter | «Sebelumnya», or a learner's «Atur» |

## For Daisy to judge

1. **The blocks** follow your order. A learner with no sitting has no second line: the state with its label follows the
   name directly, so the state is not said twice.
2. **The switch's link mark:** neutralised inside the switch (blessed). The sweep checks every page for any other link
   mark drawn as a box; run 1 finds none.
3. **N-8:** at 360 px and under, Studio's panels pad 12 px and a card inside a panel 8 px, so the nested disclosures go
   from 188 to 212 px at 320. Studio's pages are known by their tabs or `.pin-studio-halaman`.
4. **The helper** allows a sideways-scrolling `.pin-tabel-bingkai` only with `role="region"`, `tabindex="0"` and a name
   that resolves to text (`aria-label`, or `aria-labelledby` to text). The tab row (`.pin-switch`) stays the designed
   exception. Any `.pin-seg` wider than itself fails, scrolling or not.
5. **`.pin-seg`** wraps between options (`flex-wrap: wrap; overflow-x: visible`), each option whole on one line; on a
   phone it takes the row (`display: flex`) where it had three fixed columns. The select twins are unchanged.
6. **The pager** returns to the collection (`#…-koleksi`), and on a phone it lands below the sticky bar
   (`scroll-margin-top`: the bar and 16 px under 1024 px, two bar heights at 360 px and under, where the bar can be two
   lines). KOLEKSI-TABEL-01 is restated for the new anchor.
