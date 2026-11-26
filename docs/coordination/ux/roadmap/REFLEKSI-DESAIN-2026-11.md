# A design reflection: small refinements, read-only (Daisy, 26 Nov 2026)

> **What holds now:**
> - **The owner's brief (25 Nov):** a reflection, not an audit or a redesign. The before-and-after examples are inspiration for the thinking only. **Nothing here changes code, compositions, the Design System, approved words or AR-79's scope.** Each item is a recommendation until it is approved.
> - **Read against:**
>   - the Design System doctrine (`docs/coordination/design/PINTAR-DESIGN-SKILL-SPEC.md` §1–§7, `globals.css`, `experience.css`);
>   - the screens as built, in this audit's captures (J1–J12 at 1280, 390 and 320);
>   - the Audit 79 ledger and the AR-79 plan (`7c13efc7`), so nothing here duplicates or contradicts them.
> - **The short answer: PINTAR is already built on the thinking the examples teach.** I found three small refinements worth proposing, one note for a batch already planned, and one candidate I checked and dropped.

## What to preserve (already the examples' lesson)

The «after» screens in the examples do four things. PINTAR already does each, often more carefully:

| The examples' «after» | Where PINTAR already does it |
|---|---|
| A number that says what comes next («1 of 5 done · 4 left, next at 4:00 pm») instead of false precision («20.00%») | «Sudah mengumpulkan 1 / 6 · Sisa waktu 29 menit»; «Sekarang 1 murid; perlu 5»; «5 dari 6 soal dijawab tepat · Kesempatan ke-1». Counts, not judgements, each with the next fact. |
| One obvious next action | «Langkah berikutnya» on Belajar; «Layak dikerjakan lebih dulu» on Mengajar; «Apa berikutnya →» on every result; the doctrine's «THE ONE THING» (`experience.css:547`) |
| Less noise per row | The certificate and result pages; the intake approval («nama persis seperti akan dicatat»); refusals that name the cause in one sentence |
| A meaningful sentence instead of a cheer («Keep going!!») | PINTAR has no cheering by rule (spec §14). Its sentences say what is true and what to do: «Hasil Anda tetap tersimpan», «Tidak ada yang dicatat sampai seluruh baris bisa dibaca». |

**These should stay as they are.** So should the honest zero states, disclosure by plain markup, the panel-not-dialog confirmations, and the restrained colour.

## Three small refinements

### R-1 · Belajar: the next step appears twice, with two buttons for the same act (meaningful)

- **What we have:**
  - «Langkah berikutnya» shows the chapter, its five-step line and «Mulai Pemetaan Awal».
  - Directly below, «Pembelajaran Anda» shows the same chapter, with the same five-step line, the same sentence («Mulai dari Pemetaan Awal») and a second «Mulai Pemetaan Awal» button in a lighter style.
  - For a learner with one chapter, which is most SD learners in week one, the page is the same card twice (J1 `03`; J10 `25`, `26`).
- **Refinement:** in «Pembelajaran Anda», the card for the chapter already shown in «Langkah berikutnya» keeps its title and its one status line and drops its own step line and button. Optionally it says «di atas» (it is the next step above). Other chapters keep their cards as now.
- **Why it helps:**
  - Two buttons with the same words ask a child to choose between them, when there is nothing to choose.
  - The doctrine already says the one thing is «the ONLY element on the home that stands on the primary ground». The duplicate quietly competes with it.
  - It is less to read on a small screen. At 320 the duplicate pushes everything else below the fold.
- **Implications:** one component (the chapter card on Belajar). No words change except an optional «di atas». **Not covered by AR-79** (L-52 is the step line's labels at 390, a different issue). Accessibility: one fewer duplicate button name in the tab order.

### R-2 · Mengajar: each running assessment is listed twice (meaningful)

- **What we have:**
  - The class card lists every running assessment with its count: «Pemetaan Awal — Persamaan Linear Satu Variabel · 2/5 mengumpulkan», and three more lines.
  - Directly below, «Sedang berjalan» lists the same four again, each with a date and a «Berjalan» chip (J4 `02`).
  - The chip repeats the section heading.
  - The date («Minggu, 23 Mei 2027») has no label, so it reads as a start or an end.
- **Refinement:**
  - The class card carries one summary line: «4 penilaian berjalan · 3 murid belum mengumpulkan», with the existing link to who hasn't submitted. «Sedang berjalan» stays the one detailed list.
  - Within «Sedang berjalan», drop the «Berjalan» chip (the heading says it), and label the date: «ditutup Minggu, 23 Mei 2027».
- **Why it helps:**
  - A teacher scanning for «who needs me» reads each fact once.
  - The unlabelled date is the kind of number that invites a wrong plan; the label makes it mean something.
- **Implications:** the class card component (also on /mengajar/[kelas]) and one word, «ditutup», which the product already uses for the same fact (the learner's start page: «DITUTUP · …»). **Cross-reference:** AR-D (L-45, «waiting for you») changes what the home counts. R-2 should be composed with it, not before it, so the home changes once.

### R-3 · /pimpinan: empty sections carry their full weight (meaningful, modest)

- **What we have:**
  - Every Bagian keeps its letter, heading and explanatory sentences when it has nothing to show. For example: «A · Keputusan · Tidak ada keputusan yang menunggu Anda. PINTAR mengusulkan, manusia memutuskan.»; «B · Yang didukung bukti · Angka bagian ini dihitung per kelas. Bukalah kelasnya …»; C's method note above an empty table.
  - For a head early in the year, the page is mostly method and very little fact (J3 `08`).
- **Refinement:**
  - An empty Bagian collapses to its heading and **one** line: what it is waiting for, as today («Belum ada angka; muncul setelah …»).
  - The method sentences («Setiap sel adalah …», «Baca mendatar …») move into a «Cara membaca» disclosure (`<details>`), which the page already uses for classes.
  - A Bagian with content is unchanged.
- **Why it helps:**
  - The head's real question is «what needs me, and what do the figures say». The answer currently sits below a screen of explanation.
  - **Honesty is preserved:** every absent figure still says what will make it appear (DAISY-07).
- **Implications:** /pimpinan and the summary page (`/dekan/ringkasan`) share these blocks. **Cross-reference:** AR-G already fixes the section letters (L-138) and the legend (L-97, L-98), so R-3 should ride with that batch. **Not a change of meaning:** no figure, threshold or withheld reason moves.

## A note for a batch already planned

**AR-H (the chrome): at 320 the learner's bar takes about a third of the screen** (J1 `08`): «Bantuan» and ID·EN on one row, then «Bukan akun Anda?» with «Keluar», then the tabs.
- **«Bukan akun Anda? · Keluar» must stay visible.** It is the shared-computer safeguard, and a child needs it in plain sight.
- The language switch could move into the same row as «Bantuan» at its smaller K-4 size, so the bar is one row plus the tabs.
- **This is within L-53 and K-4.** I note it so AR-H's 320 capture checks the learner bar specifically, not only /konfigurasi.

## Checked and dropped

**The visible ring around page titles** («Halo, Intan», «Selamat malam, Dimas Saputra») in several captures.
- `FokusRute` moves focus to the title after navigation, for screen-reader users, and the ring only shows under `:focus-visible`.
- The harness walks by keyboard, so Chromium shows it; a pointer user doesn't see it.
- **Not an issue.** The behaviour is right for keyboard and screen-reader users.

## Taste, not proposed

I noticed things that are preference rather than improvement, and I'm leaving them alone:
- the weight of the section eyebrows («LANGKAH BERIKUTNYA»);
- the footer's legal block on every page;
- the certificate repeating the school's name as a caption under the card.

## In one line

**PINTAR doesn't need to be different.** Removing three repetitions (R-1, R-2, R-3), each confined to one shared component and sequenced with an AR-79 batch already planned, would make it a little calmer without losing a fact.

## Approved (26 Nov, the owner, via Bob; AR-79 plan §0a `e04ba7d7`)

R-1, R-2, R-3 and the AR-H 320 note are approved as refinements **inside existing AR-79 batches**:

| Item | Batch |
|---|---|
| R-1 | AR-C |
| R-2 | AR-D, composed with L-45 |
| R-3 | AR-G |
| The 320 learner-bar check | AR-H |

- **R-1 in AR-C is right.** I wrote «not covered by AR-79» meaning no finding covers it, but AR-C already changes the Belajar home's step derivation (L-46, L-56, L-64). So that is where the home changes once.
- **The owner's conditions apply:**
  - no new batch or workstream;
  - no unnecessary architecture;
  - meaning and every necessary explanation preserved;
  - every consuming screen verified at 1280, 390 and 320;
  - no completed batch reopened;
  - deferred until after 4.1 if substantially larger than anticipated.
- **Words go in each batch's KATA file before code:** «di atas» (optional, R-1) and «ditutup» (R-2).
