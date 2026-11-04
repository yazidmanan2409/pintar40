# E3 · The Batch 2 questions

**Form K (an answer per row).** Register entry E3 (`batch-2/02-DAISY-QUESTIONS.md:7-21`).
**Decides:** D. #1 goes to G only if a title is a protected term: none is. **Every answer is read against the frozen system's own rules** (DS/10-dates, Pagination, IdleWarning, 06-accessibility) and against D-172's canonical patterns (`../X-KONSISTENSI/`).

---

| # | Question | Built today | Answer |
|---|---|---|---|
| **1** | Page titles: is «<page> · PINTAR» the convention? | That form on all 63 pages; a data-headed or refusable page titled by its place | **YES, both.** «<page> · PINTAR». A page headed by a person's, class's or package's name, or one a reader may be refused, is **titled by its place** («Kelas · PINTAR»), so no name reaches a shared computer's tab. **Not mine:** whether «PINTAR SELALU» replaces «PINTAR» in running text is the owner's (D5); the titles follow that ruling from the one map (`judul-halaman.ts`). |
| **2** | The skip link covers the first navigation link while it has focus (axe `target-size` 21.8 of 24) | The DS overlay | **ACCEPT, as transient, with its reason.** The skip link exists only while it has focus: the moment focus moves to «Belajar», the skip link is gone and «Belajar» is fully uncovered. Focus is never obscured (WCAG 2.4.11). The `target-size` finding counts a link covered only while another control has focus. The DS overlay stays the one skip-link pattern on every shell (D-172). |
| **3** | The idle warning: in the flow at the top, or sticky? | In the flow, at the top | **CORRECT: sticky at the top of the main column**, on the attention ground, for its one minute. The warning exists for «someone who is reading and not touching anything» (IdleWarning): that person has often scrolled, and a banner at the top of the page would be out of sight. Sticky in the main column keeps it in view without covering the navigation. It overlaps only the top edge of the content and never takes focus (`role="alert"`, heard once). Still the DS's place, «at the top», now kept in view. |
| **4** | Words for three disabled buttons | `AlasanNonaktif` ready, unused | **(a) The learner's answer button before a choice: «Pilih satu jawaban dulu.»** («Choose one answer first.») NEW, learner-facing, **Dr Gladys confirms** (her learner voice).<br>**(b) Studio «Periksa» before a workbook is chosen: «Pilih buku kerja dulu.»** («Choose a workbook first.») NEW.<br>**(c) The pager's moves at the ends: no reason line.** Pagination: «a disabled «Sebelumnya» on the first page is fine; it is obvious why» (P9). |
| **5** | English September: «Sept» or «Sep»? | «Sept» | **«Sept».** DS/10-dates: English «as `en-ID` writes them», and `en-ID` writes «9 Sept 2026» (checked: `Intl`, `en-ID` and `en-GB`). Indonesian stays «Sep». |
| **6** | The empty date echo in English | «No date yet.» | **YES.** It matches «Belum ada tanggal.» |
| **7** | An email's formal date with a time | «9 Oktober 2026 pukul 07.30 WIB» | **YES.** The formal form for emails, with «pukul» before a time (DS/10-dates:74). |
| **8** | Konfigurasi's overlap sentence reads «… selesai pukul Jumat, …» | The timestamp form | **CORRECT.** «Pukul» belongs before a time, never before a day. **The sentences drop «pukul» and take the date-and-time form:** «Asesmen terakhir diperkirakan selesai **Sabtu, 7 Nov 2026, 19.40 WIB**.» · «Pertimbangkan memulai pemeliharaan setelah **Sabtu, 7 Nov 2026, 19.40 WIB**.» (`config.pemeliharaan.tabrakan.terakhir`, `.saran`; applied in B1's specimen and T table). |
| **9** | Seconds in Email uji's history | None | **YES, none.** It is a history a person reads (the timestamp form). Seconds are only for a technical log (DS/10-dates), and the provider's own log keeps them. |
| **10** | The Collection with no script | A `<noscript>` «Tampilkan» button | **YES.** The same word as the filter's label (`koleksi.saring.label`); it is absent when script runs. |
| **11** | The search count when nothing is searched | Empty; the pager gives the count | **YES.** The count line appears only with a search («{n} {benda} cocok dengan «{q}»»). Without one, Pagination's «Menampilkan …» already says how much there is (P9). |
| **12** | The pager on a single page | «Halaman 1 dari 1», both moves disabled (as `bundle.js`) | **YES**, as the DS component draws it: one grammar on every list, one page or many (P9; D-172). |
| **13** | A list whose total is unknown | No words, no screen | **Answered by D-172 K2:** «Menampilkan {dari}–{sampai} {benda}» (`koleksi.menampilkan_tanpa_total`, NEW, pending copy approval), in place of the total. |
| **14** | English for the Collection's and FileField's words | Engineering's, beside the Indonesian | **YES to all**, as written: «Search {benda}», «Search names», «Clear search», «{n} {benda} match «{q}»», «Show», «All», «No {benda} match», «Clear search and filter», «Pages of the {benda} list», «Previous», «Showing … of …», «Page {n} of {total}», «Next», «Choose a file», «Nothing chosen yet», «{n} files: {nama}». **One exception: `koleksi.kembali` («Back») leaves the pager** (K2): «Sebelumnya» / «Previous» is the pager's word. |
| **15** | The 25 dates still in the formal form on screen | Formal | **CORRECT, by one rule rather than 25 rows.** On screen the formal form is never used: it is for emails and printed letters (DS/10-dates). At each call site:<br>• a date someone acts on (a deadline, an opening, a window, a schedule) takes **«With the day»**, «Jumat, 9 Okt 2026»;<br>• every other date (a list, a table, a record, a result) takes **the human-readable form**, «9 Okt 2026»;<br>• a moment with a time takes the timestamp or the date-and-time form.<br>Engineering classifies each call site by this rule, through the one date helper. |

## Words (T table)

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `alasan.nonaktif.jawab` (proposed) | Pilih satu jawaban dulu. | Choose one answer first. | NEW · learner-facing; **Dr Gladys confirms** |
| `alasan.nonaktif.periksa` (proposed) | Pilih buku kerja dulu. | Choose a workbook first. | NEW · presentation |
| `config.pemeliharaan.tabrakan.terakhir` / `.saran` | without «pukul», followed by the date-and-time form | as B1 | CHANGED (#8) |
| `koleksi.menampilkan_tanpa_total` | Menampilkan {dari}–{sampai} {benda} | Showing {dari}–{sampai} {benda} | NEW (D-172 K2), pending copy approval |

**Found while answering, a D-172 correction to A5 C6:**
- The Collection already has a reset, «Hapus pencarian dan saringan» (`koleksi.kosong.reset`), in its own empty state.
- A filtered empty Bank Soal uses that state and that reset, not a sentence with «Semua» as the way back.
- A5 C6 and canonical pattern P12 are corrected to match. No new key.

## Decisions it depends on

- **Dr Gladys:** #4(a), a learner-facing word.
- **The owner:** #1's application name in titles (D5).
- **Copy approval:** the new keys.

## Acceptance checklist

- [auto] Every page title is «<page> · PINTAR»; a data-headed or refusable page is titled by its place, never by a name.
- [auto] The idle warning stays in view at the top of the main column while the page is scrolled, and never takes focus.
- [auto] The two disabled buttons carry their reason line; the pager's disabled moves carry none.
- [auto] English dates write «Sept»; no on-screen date uses the formal form; the overlap sentences have no «pukul» before a day.
- [auto] Email uji's history shows no seconds.
- [auto] A filtered, empty Collection shows «Hapus pencarian dan saringan» (A5 C6, corrected).
- [manual] The skip link's transient overlap confirmed with a keyboard walk: «Belajar» is uncovered whenever it has focus.
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): P9 (one pager, one grammar), P12 (one Collection, one reset), P13, P18 (one date helper, one rule per kind of date), P20, P16.
