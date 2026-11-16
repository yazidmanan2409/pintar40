# A2b · D8 batch 1 (D8-1 to D8-4): the learner's and the teacher's surfaces

> **For Daisy's review** (A2B-C2W-KATA.md §2). Captured by Second Eye on 16 Nov 2026 from a local build of
> `claude/a2b` at `d6152ec5`. The product code there is the same as at the full suite's head; later commits are documentation and comments.
> - **Each state twice:** in a WIB school and in a WITA school. Each is at 390 and 320 px; D8-1 is also at 1280.
>   The capture log (`CAPTURE-LOG.txt`) gives each file's path, its horizontal overflow (0 px everywhere) and the
>   text of its `role="status"` regions.
> - **The WITA school is the same synthetic school** (Sekolah Sintetis Siklus, and Alpha for R-1), with its zone set to
>   `Asia/Makassar` for the capture and restored after. The local data has no WITA school of its own.
> - **Disposable fixtures:** a planned window inserted on the local stack for each state. Nothing here is in the repository's fixtures.

## What changed while capturing (found by these screens)

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

## For your review (not changed by me)

1. **«diperpanjang sampai …» is not built.** No sentence is approved for it, and nothing records that a window was
   extended. The `diperpanjang` files show only the later end. It needs your words, and a decision on what marks an extension.
2. **The failed-read line repeats the start:** «Menurut pemeriksaan terakhir, pukul 14.00 WITA, pemeliharaan kelas 5S
   dijadwalkan mulai pukul 14.15 WITA. Pemeliharaan untuk kelas 5S mulai pukul 14.15 WITA. …» Your §4 replaces only
   the countdown and keeps the rest of the stage, so this follows your spec. Say if the second sentence should go.
3. **A time on another day:** the date is added to the last-check line only. The banner's start and end and the maintenance
   page's times have the same case (for example, an end after midnight). Say if they should carry it too.
4. **The D8-2 page has no reason line:** the reason list (D2) is not built yet. It shows the administrators' message when there is one.
