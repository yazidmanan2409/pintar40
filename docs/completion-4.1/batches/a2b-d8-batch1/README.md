# A2b · D8 batch 1 (D8-1 to D8-4): the learner's and the teacher's surfaces

> **For Daisy's review** (A2B-C2W-KATA.md §2). **Recaptured** by Second Eye on 16 Nov 2026 from a local build of
> `claude/a2b` at `e8dd3529`, after your review TINJAUAN-A2B-D8-B1-679987cb (see "Your review, answered" below).
> Every file here replaces the first capture's.
> - **Each state twice:** in a WIB school and in a WITA school. Each is at 390 and 320 px; D8-1 is also at 1280.
>   The capture log (`CAPTURE-LOG.txt`) gives each file's path, its horizontal overflow (0 px everywhere) and the
>   text of its `role="status"` regions.
> - **The WITA school is the same synthetic school** (Sekolah Sintetis Siklus, and Alpha for R-1), with its zone set to
>   `Asia/Makassar` for the capture and restored after. The local data has no WITA school of its own.
> - **Disposable fixtures:** a planned window inserted on the local stack for each state. Nothing here is in the repository's fixtures.

## Your review, answered (TINJAUAN-A2B-D8-B1-679987cb)

- **The D8-3 blocker: yes, my error.** The first send's final run reused a database in which the card learner's sitting,
  started by the run before, was still open. The D8-3 files showed the player, and I had checked the earlier run's
  images, not the ones I sent. Recaptured with no open sitting. The capture now stops if the learner has one open, and
  fails unless every D8-3 shot shows the disabled «Mulai». Keyboard: `CAPTURE-LOG.txt`, `papan-ketik`, both zones.
- **C-1, C-2 and C-3** are built in commit 11 (`51c52978`), with test `A2B-C01` (red on 679987cb's sources):
  - C-1: «pekerjaan kelas 5S».
  - C-2: the failed-read line no longer repeats the start.
  - C-3: «…, Selasa 17 Nov».
  - C-3 has its own state: `d8-1-{zone}-hari-lain-murid-*` and `d8-2-{zone}-hari-lain-murid-*`, a class window under way whose expected end is tomorrow.
  - The EN for C-1 is «The work of {untuk}» at a sentence's start and «{untuk}'s work» inside one. Please confirm.
- **«diperpanjang»:** not added. The status read cannot tell an extension without a new reader, so it is a note for the next batch, as you allowed.
- **One typographic question:** at 390, «Selasa 17 Nov» can break between «17» and «Nov» (`d8-2-wita-hari-lain-murid-390`).
  A non-breaking space would keep them together. Yours to say.

## What changed while capturing the first send (found by these screens)

- **D8-2 was wrong for a class window:** the page told the learner «Setelah itu PINTAR tidak dapat dipakai…», which is
  false for a work-scoped window. Fixed in commit 9 (`190a940e`, test `A2B-P01`). The page now names the class and its times.
- **The failed re-read did not fail when the browser had no connection:** the countdown ran on and the last-check line
  never showed. Fixed in commit 10 (`ad23820f`, `A2B-B01` with a plant). The `gagal` files show the corrected state.
- **D4 is superseded** (R-C; the owner's endorsement, 16 Nov). The first D4 start-screen captures were void, so D8-3 now
  shows the two refusals that remain.

## The files (`{zone}` is `wib` or `wita`)

| # | State | Files |
|---|---|---|
| D8-1 | T−60, learner and teacher (the class's own page) | `d8-1-{zone}-t60-murid-*`, `d8-1-{zone}-t60-guru-*` |
| D8-1 | T−15 (amber), learner and teacher | `d8-1-{zone}-t15-*` |
| D8-1 | Started (work-scoped: names the class, PINTAR stays usable) | `d8-1-{zone}-mulai-*` |
| D8-1, D8-2 | C-3: a class window under way whose expected end is tomorrow | `d8-1-{zone}-hari-lain-murid-*`, `d8-2-{zone}-hari-lain-murid-*` |
| D8-1 | Extended (the end moved 2 h later, as `perpanjang_pemeliharaan` writes it) | `d8-1-{zone}-diperpanjang-*` |
| D8-1 | R-1: the same teacher, the window's class (5A) and their other class (nothing) | `d8-1-{zone}-kelas-ini-guru-*`, `d8-1-{zone}-kelas-lain-guru-*` |
| D8-1 | R-B, a failed re-read: before the boundary (T−30), then after a blocked read (your §4 line; the countdown stopped) | `d8-1-{zone}-gagal-sebelum-murid-390`, `d8-1-{zone}-gagal-murid-*` |
| D8-2 | The maintenance page, a class window under way, then extended | `d8-2-{zone}-mulai-murid-*`, `d8-2-{zone}-diperpanjang-murid-*` |
| D8-3 | The start screen: inside a class window's T−15 (`galat.maintenance_no_new_start`) | `d8-3-{zone}-kelas-t15-pemetaan-*` |
| D8-3 | The start screen: a class window, and a school window, under way (`pemeliharaan.pita.asesmen_baru`) | `d8-3-{zone}-kelas-berlangsung-*`, `d8-3-{zone}-sekolah-berlangsung-*` |
| D8-4 | The player, a sitting running when the class window began | `d8-4-{zone}-pemutar-murid-*` |

**Keyboard on D8-3** (`CAPTURE-LOG.txt`, `papan-ketik`): the disabled «Mulai» leaves the tab order, as a disabled
control does. Its sentence follows it directly as visible text, tied by `aria-describedby="mulai-tolak"`, with nothing
focusable between them (your 05:26 note; asserted in UX1-S2-MELIHAT-01).

## For your review, from the first send

Points 1 to 4 are answered in your review and above. Point 4 (no reason line until D2) is for batch 2.
