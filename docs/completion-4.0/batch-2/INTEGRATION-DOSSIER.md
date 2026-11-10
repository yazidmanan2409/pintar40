# Integration dossier · Batch 2 · the shell and its primitives (W3.1–W3.5, W3.14), in the form of H §2

**Status:** drafted 8 Nov from the batch's reports (`01`, `02`, `03`), `evidence/`, the register rows W3.1–W3.5 and W3.14 (`C-OPEN-WORK-REGISTER-2026-11-02.md`), the retrospective (`retrospektif/01-REGISTER.md` R2-1…R2-10 and its corrections; `04-REKONSILIASI-BALIK.md`) and the manifest's own «proves» sentences. Every test id below is in `selftest/manifest.json`. Promoted as `fab8e4a` (PR #4, D-148). Batch 2 has no migration (`01` §6). A check with gaps says so.

## 1. Dependencies

| Primitive | Source | Read by (consumers) |
|---|---|---|
| W3.1 titles | `src/lib/judul-halaman.ts`; template «%s · PINTAR» in `src/app/layout.tsx` | every `src/app/**/page.tsx` (63 at build, UX2-JUDUL-01); the certificate PDF's name (D2, D168-D2-1) |
| W3.1 skip link | «Langsung ke isi» first in `<body>`; every `<main id="isi">`; `FokusRute`; `.pin-lewati` | every page, including the two certificate pages and the refusal page given a `<main>` (`01` §1) |
| W3.2 empty | `src/components/Kosong.tsx`; `AlasanNonaktif.tsx`; `KartuKetiadaan.tsx` | Mengajar (MENGAJAR3-KOSONG-01); Belajar, Pimpinan, feedback, Pendataan, Pengembangan, Laporan saya, the chooser, both Ringkasan, Konfigurasi, the certificate list (R2-5; `04-REKONSILIASI-BALIK.md` §2 #3); /aktivasi (`03` §4) |
| W3.3 primitives | `src/components/bentuk/BidangBerkas.tsx`; `src/lib/tanggal.ts`, `TanggalDenganGema`; CSS in `experience.css`/`globals.css` | Studio workbook and media, Pendataan, /lapor (UX2-BERKAS-01); `format.date`, `jamWib`, the security email (TANGGAL-01); Siapkan, Konfigurasi (D168-K9-1) |
| W3.4 Collection | `src/components/koleksi/` (`Koleksi`, `FormKoleksi`, `Penomoran`, `aturan.ts`) | the J2 Kelas roster and `/mengajar/[kelas]/siapa` (B4-J2-K01); the 10 paged staff lists through `Penomoran` (D168-K2-1) |
| W3.5 menu, Dialog | `src/components/sesi/MenuAkun.tsx`, `src/components/Dialog.tsx`, `BarisSesi.tsx` | the staff shell (E1's drawer, walk N4 in `audit/e1-navigasi.mjs`); `/api/sesi/keluar-semua` (BOB29-A03) |
| W3.14 idle | `src/components/PenjagaSesi.tsx`, `.pin-jaga` | every signed-in page; the lock (GS-17–21) |

## 2. Data contracts and consumers

- **The title map** is one contract: each entry is a page and each page reads its own entry, in both languages (UX2-JUDUL-01).
- **The date helper** is the one source of screen dates, on WIB whatever the device's zone (TANGGAL-01/02/03); no screen writes the formal form (R2-TANGGAL-01, added by the retrospective after a screen took it again).
- **The Collection's rules** (`aturan.ts`): position, paging, search and filter executed (KOLEKSI-HAL-01); one pager grammar for every paged list (D168-K2-1, E-K2, D-173(d)).
- **Copy keys:** 22 new keys, each in Indonesian and English (`01` §1); Daisy's Indonesian, the English engineering's where she gave none (`02` #14).
- **Empty vs refused:** `Kosong`'s own rule, «a refusal is never drawn as empty», held across screens by R2-KOSONG-01 (a refusal on the feedback page and a missing package corrected, `04-REKONSILIASI-BALIK.md` §2 #3a–3b).
- **Gap:** `koleksi.menampilkan_tanpa_total` (a list with no known total) waits on copy approval (D-173(e)); no screen uses it yet (`02` #13).

## 3. Authorisation and visibility

**At the database: n/a.** Batch 2 changes no migration, permission or proxy rule (`01` §6; D-148(c): no proxy exemption for `icon.svg` / `apple-icon.png`). The primitives present what their callers were allowed to read. What they could leak, they are tested for:
- **A title carries no person's name** on a shared computer's tab: staging check JUDUL-NAMA (25 titles, 9 names) in 41436131363 (`03` §3).
- **A refused reader's tab carries nothing of the page:** JUDUL-DITOLAK (the teacher on /pimpinan reads «Pimpinan · PINTAR»); UX1-PIMPINAN-AKSES-01 was red on `7eafd50` for exactly this and fixed (`01` §3).
- **«Keluar dari semua perangkat…»** ends this and another computer's sessions (BOB29-A03); the card route still ends only its own (CR91-K01, BOB05-K01).
- **A learner has no account menu** (UX2-MENU-01).
- **Gap:** no test that a Collection's polite count or «nothing matches» cannot reveal rows the caller did not read; by construction it counts only the rows it is given (KOLEKSI-HAL-01), but no consumer is asserted for it.

## 4. Design and terminology across connected surfaces

- **Built from Daisy's frozen system** (`origin/ux-1/daisy-experience`, `docs/coordination/ux/sistem-desain`), tokens only, two declared exceptions (`639px`, `16ch`, `01` §1).
- **The same words where the same fact appears:** «Sekarang 3 murid; perlu 5.», never «(3/5)» (UX2-KOSONG-01); «Menampilkan 21–40 dari 312 murid», «Halaman 2 dari 16» (KOLEKSI-TABEL-01); no bare «Kembali» in a pager or back link (D168-K2-1, D168-K1-1).
- **Daisy's E3 answers** are recorded on her branch and implemented: titles (#1, R2-1), dates (#5–#9, #15, R2-3), the idle warning sticky (#3, R2-8), the disabled reasons (#4, R2-4).
- **Gap (BLOCKED):** `alasan.nonaktif.jawab` is learner-facing and waits on Dr Gladys (R2-4); the pager's ends carry no reason (#4(c)).
- **Gap:** no owner acceptance of the E3 answers is recorded in `docs/coordination/DECISIONS.md`.

## 5. Exceptional conditions and multi-context journeys

- **Empty, not enough, nothing matches:** each its sentence and way on (UX2-KOSONG-01, KOLEKSI-TABEL-01); a single page «Halaman 1 dari 1» (`02` #12).
- **No script:** the Collection works; the filter has a `<noscript>` «Tampilkan» (`01` §1, `02` #10).
- **A platform administrator in «Seluruh platform»:** /aktivasi's first Tab went to the footer, a real defect (an empty line scrolling itself into view); fixed by making it `Kosong`, red without the fix (UX2-KOSONG-01, `4453c43`, `03` §4, D-148(b)). The platform admin's «Keluar dari semua» across two computers (BOB29-A03).
- **Refused:** titled by place (JUDUL-DITOLAK); the refusal page has its `<main>` (`01` §1).
- **Expired session:** the warning after a real wait, then the lock (GS-17–21 41437164666).
- **A staff member also learning:** the account menu is staff-only and a learner's strip has none (UX2-MENU-01). **Gap:** no check of the shell, menu or title for one person switching between Mengajar and Belajar.
- **The first-visit tour:** D-148(b) recorded two «exceptions by design»; the retrospective showed the harness measured from the tour's headline, the skip link was first all along (R2-2, R0-3; `audit/a11y.mjs` corrected).

## 6. Regression

- **Tests restated where their markup moved, never weakened:** PENUTUPAN-L01, PENUTUPAN-J01, POLISH2-STUDIO-01, DAISY-18-DENGAR-01, DAISY-20-C17-01, D140-SAJI-01, the KartuKetiadaan render (`01` §1).
- **Against the Batch 0 baseline:** titles 39 → 0 missing; focus indicator 1 → 0; axe 38 → 40 clean (the /lapor `label` finding fixed); 640 px unchanged at 5, not Batch 2's (`01` §2.1).
- **Staging Golden School unchanged in behaviour:** the workbook through FileField (GS-04–11 41433578771), cards and tests (41434844205), reports and lock (41437164666), all PASS; the demo school 4 / 10 / 10 / 3 / 5 / 1, audit 91 (6,860) unchanged (`03` §5).
- **At the retrospective baseline** (`be8a68c2`): R2-1…R2-8 VERIFIED, two after correction (R2-3, R2-5); R2-KOSONG-01 strengthened by the reverse reconciliation.

## 7. End-to-end journeys

- **Every J record** passes through W3.1: journeys A and B on `d1bb705` (41418574826) and on the merged head `4453c43` (41426468549), job A with the accessibility crawl.
- **J7** idle and lock on staging: GS-17–21 41437164666.
- **J2** Kelas roster as a Collection: Batch 4 walk P1 41612169706 (`batch-4/04` §3; B4-J2-K01).
- **Keyboard walks:** local `evidence/keyboard-walk.mjs` 21 of 22 (`evidence/keyboard-walk-2026-11-02.json`); staging judged checks PAPAN-LEWATI, PAPAN-ISI, PAPAN-MENU-0/1/2, PAPAN-DIALOG-1/2, MENU-320 all PASS in 41436131363 (`audit/staging/a11y-staging.mjs`); E-RB-2 and E-RB-9 (`audit/rb-ujung.mjs` RB9, the session row at 320 px).
- **Human journey: not accepted (no recorded walk by a person)** (D-141).

## 8. Evidence

- CI: 41418570342 (`d1bb705`, 18/18, 688/0/0); PR 41426463425 (`4453c43`); `main` 41430417532.
- Staging: facts 41432900275; founding 41432906079; GS-01–03 41433012861; accessibility 41436131363, re-run 41440170620 (12 screens, axe 12/12, no missing title, 0 skip-link misses).
- Screens: `evidence/01-lewati-1280.png`, `02-menu-1280.png`, `03-dialog-1280.png`, `04-akun-{320,1024,1280}.png`, `05-menu-320.png`, `06-belajar-1280.png`, `07-masuk-focus-1280.png` (the /masuk ring on the wrapper, a harness limit, `03` §3).

## 9. Cross-feature UX consistency (D-172)

Batch 2 *is* the shared source for several of the 21 canonical patterns (`X-KONSISTENSI/README.md` on `origin/ux-1/daisy-experience`, D-173(b)):
- **P12 search and filter, P9 pages:** Koleksi and one pager grammar (D168-K2-1).
- **P13 empty:** Kosong, held across screens by R2-KOSONG-01.
- **P18 dates:** the helper and its echo; fixed values as text (D168-K9-1, E-K9).
- **P3 back:** names its destination (D168-K1-1, E-K1).
- **Keyboard and phone:** the menu at 320 px (MENU-320), no sideways scroll at 1280/1024/320 (`03` §3).
- **Gap:** P8 says a destructive act confirms in place; «Keluar dari semua perangkat…» confirms in the one Dialog (UX2-MENU-01). It is not among X1–X6 (D-173(c)) and its reason is not written down.
- **Gap (BLOCKED, manual):** the skip link covering «Belajar» while focused; Daisy accepted it as transient subject to a manual keyboard walk, which is not recorded (R2-9, `02` #2).
- **Gap:** no screen-reader pass by a person (W6.12) and no per-pattern side-by-side comparison by Daisy for this batch.

## Verdict

- **Integration for Batch 2: partial.** Checks 1, 6 and 8 are evidenced; check 3 is n/a at the database with its leak checks evidenced; checks 2, 4, 5, 7 (human) and 9 carry the gaps above.
- **UX consistency (D-172): partial** (the shared components are the canonical patterns; P8's Dialog, R2-9 and the screen-reader pass open).
- **Human journey: not accepted (no recorded walk by a person).**

Ledger note: H §3b's Batch 2 design cell says «the fifteen Batch 2 questions unanswered (E3)»; the retrospective records Daisy's answers on her branch, implemented (R2-1, R2-3, R2-4, R2-8, R2-9). The cell should read «answered by Daisy, owner acceptance not recorded; `alasan.nonaktif.jawab` with Dr Gladys». It stays partial.
