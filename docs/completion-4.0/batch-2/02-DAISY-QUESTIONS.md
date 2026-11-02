# Batch 2 · Questions for Daisy (prepared 2 Nov 2026)

These are design and wording questions that Batch 2 met and could not answer from the frozen design system without inventing. Each states what is built today, so nothing waits on them. Answer in any order; each becomes a small, separate change.

| # | Question | Built today (until answered) | Where |
|---|---|---|---|
| 1 | **Page titles.** Is «<page> · PINTAR» the convention? | That form on all 63 pages, from one map. A page headed by data (a learner's, class's or package's name), or one a reader may be refused, is titled by its place («Kelas · PINTAR», «Pimpinan · PINTAR»), so no name reaches a shared computer's tab. | `src/lib/judul-halaman.ts` |
| 2 | **The skip link covers the first navigation link while it has focus.** Your skip link is an overlay at the top left. While focused, it covers part of «Belajar» in the learner's shell; axe `target-size` reports 21.8 px of 24 left uncovered. Move it, give it room, or accept it as transient? | Your overlay, unchanged | `.pin-lewati` |
| 3 | **The idle warning's place.** It is now at the top of the page, in the flow, with no layer token, so it never covers the work. Is that right, or should it stay visible (sticky) when the page is scrolled? | In the flow, at the top | `.pin-jaga` |
| 4 | **Disabled reasons.** The words beside three disabled buttons. | No reason shown yet: the line (`AlasanNonaktif`) is ready | (a) the learner's «answer» button before a choice; (b) Studio «Periksa» before a workbook is chosen; (c) the pager's «Sebelumnya» and «Berikutnya» at the ends |
| 5 | **English dates.** September as «Sept» (as en-ID writes it) or «Sep» (as the Indonesian)? | «Sept» | `src/lib/tanggal.ts` |
| 6 | **The empty date echo in English** | «No date yet.» | `tanggal.belum` |
| 7 | **An email's formal date with a time** | «9 Oktober 2026 pukul 07.30 WIB» (the emails' present wording) | `tanggal(…, "resmiJam")` |
| 8 | **Konfigurasi's overlap sentence** («…selesai pukul …»): the day form reads «pukul Jumat, …» | The timestamp form | `src/app/konfigurasi/page.tsx` |
| 9 | **Seconds in Email uji's history**: a technical log (seconds) or a history (none)? | No seconds | `RiwayatEmail.tsx` |
| 10 | **The Collection with no script.** The filter needs a press to apply. | A `<noscript>` «Tampilkan» button | `FormKoleksi.tsx` |
| 11 | **The search count when nothing is searched** | Empty; the pager gives the count | `Koleksi.tsx` |
| 12 | **The pager on a single page** | «Halaman 1 dari 1», both moves disabled (as `bundle.js`) | `HalamanKoleksi` |
| 13 | **A list whose total is unknown** | No words exist for it yet; no screen uses one | Pagination |
| 14 | **English for the Collection's and FileField's words** | Mine, beside your Indonesian | `koleksi.*`, `berkas.*` in `hle.ts` |
| 15 | **The 25 dates still in the formal form on screen** («9 Oktober 2026»). Which should read «9 Okt 2026», and which with the day? | Formal, as before | `format.date` call sites |

Not for Daisy: the tab icon's `icon.svg` and `apple-icon.png` need the proxy to admit two more anonymous paths. The owner has ruled that out for now (2 Nov); `favicon.ico` carries her icon.
