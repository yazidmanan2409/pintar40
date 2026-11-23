# Z6 (stream B) · R-11, the framed-overflow assertion and its sweep, N-8

> **How they were taken:** on the local app of `claude/z-ux`, by `next start` against a local stack. Widths 1280, 390
> and 320 px, and 360 and 359 for the instrument switch's boundary; device scale 2, viewport only.
> - **Keyboard only:** focus, Enter. There are no clicks.
> - **`CATATAN-Z6.txt`** has, per shot: the window's overflow (**0 px in every shot**), the rendered-check helper's own
>   framed-overflow measure inside `main` (BINGKAI), the focused element, the live region and the part the row changes.
> - **Script:** `tangkap-z6.ts`. The world: A1's Kelas with three open sittings on its Pemetaan Awal, and C1w's package,
>   published, with a reviewer's note on option B replaced once. Everything is removed after the run.

## The sweep: one command, run twice

```
PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/sapu-z6.ts "<label>" <out.txt>
```

- It reads the source for every file that draws `pin-tabel-bingkai` or `pin-seg`, opens each page as the person who
  reaches it at 390 and 320, and measures it with `BINGKAI` from `audit/a11y.mjs`, the helper the crawl uses too.
- It lists the pages it **covered** and **did not cover** (with why), and prints N-8's widths on Studio's package page.
- **Run 1** (this commit): `../z6-sapu-1.txt`, GREEN. Run 2 follows Second Eye's second integration merge (K-01's screens).

| Page | Drawn by | Run 1 |
|---|---|---|
| `/mengajar/[kelas]` | Koleksi | clean |
| `/mengajar/[kelas]/siapa` (both instruments) | Koleksi + `pin-seg-tautan` | clean (was 452 px in 324; the switch 282 in 256 at 320) |
| `/mengajar/[kelas]/uji-cepat` | `pin-seg` | **audit list:** the minutes control, 286 px in 256 at 320 |
| `/aktivasi/orang` | Koleksi | **audit list:** the people table, about 695 px in 324 / 254 |
| `/konfigurasi/catatan-masuk` | `pin-tabel-bingkai` | clean |
| `/konfigurasi/audit` | `pin-tabel-bingkai` | **audit list:** Jejak audit, about 600 px in 322 / 252 |
| not covered | `/mengajar/[kelas]/uji-cepat/hasil` and `/konfigurasi/sertifikat` draw no table with no rows; `/studio/tinjau/kunci/[koreksi]` needs a pending key correction | — |

The three audit-list parts are named in `audit/a11y.mjs` (`BINGKAI_DIKETAHUI`). The crawl reports them and holds any
OTHER framed overflow at 320 px broken.

## Shots

| Shot | Row | What it shows |
|---|---|---|
| `z6-01-siapa-pemetaan-*` | R-11 | «Siapa», focus on the switch's other option. At 1280 the table; at 390, 360, 359 and 320 the learners as blocks. The switch is one row at 360, one option a line at 359 and 320 |
| `z6-02-siapa-uji-*` | R-11 | Enter on «Uji Penguasaan»: that instrument's page, its option current (`aria-current`) |
| `z6-03-siapa-blok-*` | R-11 | Focus on «Atur» in a learner's block: the name as its heading, «Mulai … · sisa … menit», «Keadaan» with the state, «Atur» |
| `z6-04-siapa-atur-*` | R-11 | Enter on «Atur»: the panel opens under the list, focused |
| `z6-05-paket-catatan-*` | N-8 | Studio, a published package, «Catatan peninjau» opened by Enter. At 320 it is 212 px wide (was 188) |

## Recovery walks (ruling 81 item 7)

| Path | What happened | Work kept | Next step |
|---|---|---|---|
| **The other instrument** (`01` → `02`) | Enter on the option: its page, marked current | The class, the place in the list | Back, or the other option |
| **A learner's sitting** (`03` → `04`) | Enter on «Atur» in the block: the panel, focused | The list above it | The panel's own acts, or its way back to the list |

## For Daisy to judge

1. **The blocks** follow your order. A learner with no sitting has no second line: the state with its label follows the
   name directly, so the state is not said twice.
2. **The switch's link mark:** `TandaTautan`'s span took the options' pill look at 560 px and under (an empty second
   pill under each option, with its own focus ring, on the base at 390 too). Neutralised inside the switch only, as part
   of the switch's phone layout. Say if you'd rather it went to the audit list instead.
3. **N-8:** at 360 px and under, Studio's panels pad 12 px and a card inside a panel 8 px, so the nested disclosures go
   from 188 to 212 px at 320. Studio's pages are known by their tabs or `.pin-studio-halaman`.
4. **The helper's one exception** is the tab row (`.pin-switch`), which scrolls by design (v3 Tabs, your F10).
5. **Found on the walk, for the ruling 79 audit list:** besides the three parts above, «Siapa»'s state filter
   (`div.pin-seg.pin-lebar-saja`) scrolls sideways at **1280** (778 px in 712, with four states and their counts), and a
   segmented control's focus ring is clipped top and bottom by its own `overflow-x: auto`. Neither is at a phone width.
6. **A known gap:** below 640 px the pager's «back to the table» link (`#pin-siapa-murid`) points at the frame, which is
   hidden there. «Siapa» shows 50 learners a page, so it rarely pages.
