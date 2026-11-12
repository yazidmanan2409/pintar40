# B2 «Cetak laporan»: UX visit (Daisy, 12 Nov 2026)

> **What holds now:**
> - **BLOCKED on `bfe949b11935763a8c8ed7b91f4adcdbcea93645`, on one item only:** the completeness notice's layout (§3). The fix is one wrapper element.
> - **Everything else in B2 passes as built:**
>   - the print path, the official and browser footers, and the failure line;
>   - the learner's clock;
>   - B1-R1, R2, R3 and R5;
>   - S-1.
> - **Recheck:** a screenshot of the notice at 320 and 1280 on the fixed commit. No second visit.
> - **Bob, B2-R-A1: it needs its own line** (§4). One small commit; it may ride with the notice's fix.

**Queue item:** Bob's message of 12 Nov (B2, one visit, with S-1 and the learner's time zone); `B2-ARCHITECT-NOTES.md` §4 and §5.

**How it was rendered.** Locally only:
- this commit's own `npm ci` (the lock is unchanged), a fresh reset to its migrations, the report world, `next build`, then `next start`.

**What was printed:**
- **Three official prints**, through «Cetak laporan» on the running pages:
  - the teacher's class report (Pak Yusuf, 5B);
  - the school summary (Bu Wulan);
  - a learner's own «Hasil belajar» (Tono Rahayu).
- **For each one,** I overrode `window.print` to read the footer at the moment the dialog would open, then printed to PDF with that exact line.
- **The browser's own print,** tried through `beforeprint` and `afterprint`.

**Evidence:** `verifikasi-B2-bfe949b1/`, with PDF pages, screenshots and `catatan-jalan.txt`.

## 1 · The print path and the footers: **pass**

| Item | Seen | Verdict |
|---|---|---|
| **The default** (stylesheet, no script) | «Dicetak dari browser · tanpa nomor referensi», on all three pages | **Accept** |
| **The browser's own print** | On `beforeprint`: «Dicetak dari browser · 12 November 2026 pukul 23.48 WIB (jam perangkat) · tanpa nomor referensi», with «Halaman n dari m» bottom-right. On `afterprint` it returns to the short line. **No person is named, and no reference-shaped text appears** (`B2-murid-kaki-peramban-1.png`) | **Accept**: my line, Sharon's rule |
| **«Cetak laporan»** | The print is called **once**, and at that moment the footer reads «Dicetak oleh Pak Yusuf (uji laporan) · 12 November 2026 pukul 23.51 WIB · Ref. CTK-9WY8-PG44». The paper carries it bottom-left on page 1, portrait (`B2-dekan-kaki-resmi-utama-1.png`, the school summary: «… Bu Wulan … Ref. CTK-EVZD-38A0 · Halaman 1 dari 3»). **Straight after, the footer is the short line again,** so a second Ctrl+P cannot reuse the reference | **Accept** |
| **When `beforeprint` fires during an official print** | The handler leaves the official line alone (`resmi` is set first), so the paper is not given the browser line | **Accept** (read in code, and consistent with the PDFs) |
| **The failure line** (the writer revoked for one press, then restored) | **No dialog** (print called 0 times). The footer stays the short line. Under the button: «Cetakan belum dapat dicatat, jadi belum dicetak. Coba lagi.» as `role="alert"` (`B2-guru-gagal.png`) | **Accept** |
| **Each press is one reference** | Six presses across this visit, six `CTK-` references, each found in the reader | **Accept** |
| **axe** | 0 on all three report pages | — |

## 2 · The time on a learner's own print: **pass**

- **One school's results, a WIB school:** «Dicetak oleh Tono Rahayu (5B) · 12 November 2026 pukul 23.52 WIB · Ref. CTK-WV2M-1AD7».
- **The same school set to WITA for one print, then restored:** «… 13 November 2026 pukul 00.55 WITA · Ref. CTK-CPWF-TQAK» (`B2-murid-kaki-resmi-wita-1.png`).
  - The **day changes with the clock** («12» becomes «13»), as a school's own date should (D-199).
  - The teacher's class print followed the school too: «… 00.56 WITA …».
- **Several schools' results, so WIB:** not rendered. This world has no learner with two schools' evidence. Sharon's B2-P02 covers it.
- **The browser line uses the device's clock**, marked «(jam perangkat)», as it should.

## 3 · The reader: **one blocker**, the rest pass

| Item | Seen | Verdict |
|---|---|---|
| **B1-R1** | A teacher: «Catatan masuk dan cetak hanya dibaca admin sekolah untuk sekolahnya, dan Admin PINTAR.» | **Accept** |
| **B1-R2** | Platform view: each row's «Siapa» has a second line with the school, «SD Cendekia Nusantara (sekolah peragaan)». **Bu Wulan's view has no such line.** No «tanpa sekolah» row occurred in this world's prints | **Accept** |
| **B1-R3** | Konfigurasi index: **one** entry «Catatan masuk dan cetak», for Bu Wulan and for the platform admin. **A teacher's Konfigurasi offers no link to it** | **Accept** |
| **B1-R5** | The no-match and purged-reference states each have **one** «Hapus saringan» | **Accept** |
| **Prints in the reader** | Bu Wulan finds the learner's print «CTK-WV2M-1AD7» by its reference, as the school whose results it shows. The row reads «Tono Rahayu (5B) · Meminta cetakan resmi · Referensi CTK-WV2M-1AD7 · Berhasil» | **Accept** |
| **The notice's words and whom it shows to** | Platform view only, `role="status"`, above the filter: «Daftar ini mungkin tidak lengkap. Dalam 7 hari terakhir, PINTAR tidak dapat mencatat sebagian kejadian masuk atau keluar (terhitung 2, terakhir 12 Nov 2026, 23.57 WIB). Kesehatan sistem». **The count excludes failed print writes** (two `PRINT_REQUEST` failures were counted and not included), which answers my question. **Bu Wulan never sees it** | **Accept** |
| **The notice's layout** | **BLOCKER.** `.pin-banner` is a two-column grid: an `auto` icon column, then the content (`.pin-banner > :not(.pin-ikon) { grid-column: 2 }`). The notice puts **bare text** and a link directly in the `<p class="pin-banner">`. The text becomes an anonymous grid item **in the auto icon column**, at its full width. The link, the only element, goes to column 2, which is squeezed to **zero width**. **What that does:** at **320 px the page scrolls sideways** (`scrollWidth` 345; 390 → 415), a WCAG 1.4.10 reflow failure. **«Kesehatan sistem» hangs outside the banner, cut to «Keseha»** (`B2-notice-320.png`). At 1280 it sits outside the banner's right edge (`B2-notice-1280.png`). Without the notice the page is exactly the screen's width | **Change required** |

**The correction** (`src/app/konfigurasi/catatan-masuk/page.tsx`, the notice):
- Put the sentence and the link inside **one child element**, e.g. `<p className="pin-banner pin-attention" role="status" …><span>{kalimat} <Link …>Kesehatan sistem</Link></span></p>`.
- Or use a `<div className="pin-banner">` holding one `<p>`, as other banners do.
- Either way, the text and the link both go in the content column. Nothing else changes.

**The test for it:** add to B2-S02, with the notice present, `document.documentElement.scrollWidth === innerWidth` at 320 for the platform admin, and the link's box with a non-zero width inside the banner. It is red today.

## 4 · Bob's B2-R-A1: **it needs its own line**

«Laporan ini tidak dapat dicetak dari akun Anda.» is **not true** in the case Bob describes, and it points the reader at the wrong thing:
- the account can print the report, from the report's own working context;
- a person reading "dari akun Anda" concludes they lack a permission, and goes to ask an admin for one.

**The line, for that refusal** (`laporan.cetak.ditolak`; it covers the forged case too, where it is equally true). «Mau ke mana hari ini?» is a link to the chooser (`/`), which is what every other act tied to a working context offers:
- **ID:** «Laporan ini tidak dapat dicetak dari pilihan yang sedang Anda pakai di [Mau ke mana hari ini?]. Pilih yang sesuai dengan laporan ini, lalu cetak lagi.»
- **EN:** «This report cannot be printed from the choice you are using in [Where would you like to go today?]. Choose the one this report belongs to, then print again.»

**Not reproduced here:** the head of department has two working contexts in this world. A class report opened while teaching still printed after the switch to leading, because both contexts reach 5B. The case needs a report outside the new context, such as another school's, which this world lacks. The line is judged on its words.

## 5 · S-1, on this commit: **pass**

**The drawer:** for Bu Wulan and the platform admin, open on «Konfigurasi», «Jejak audit», «Catatan masuk dan cetak», «Keamanan» and «Pendataan»:
- at **390** it spans 16 to 374 px, and at **320** it spans 16 to 304 px;
- the page never scrolls sideways because of the drawer;
- the focus ring has 16 px clear on each side.

The platform admin's one wide page is the notice of §3, not the drawer.

**The desktop sidebar:** a way to change context is present in every state:

| Platform admin | What shows |
|---|---|
| 1280, expanded | The context block with «Mau ke mana hari ini?» |
| 1280, collapsed | The rail link |
| 1100, collapsed (the default) | The rail link |
| 1100, expanded | The block |

The rule that applies at every width hides only the duplicate. As in my early look (`S1-PRA-97a40ebb.md`).

## Not seen

- **A learner with two schools' results** (WIB).
- **A «tanpa sekolah» print row.**
- **B2-R-A1 in place.**
- **A paper printer's own rendering of the `@page` margin boxes** (Chromium PDF only).
- **Real screen readers.**
