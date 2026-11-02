# Batch 2 · Shared UI components and accessibility foundations: completion report (2 Nov 2026)

**Authority:** owner, 2 Nov: «BATCH 1 ACCEPTED / BATCH 2 CONDITIONAL GO».

**Where the work is:**
- Development branch `claude/awesome-rubin-bqxp6p`, head `d1bb705`.
- Nothing merged to `main`, nothing deployed to staging, production untouched.
- Staging freeze in force (D-147).

**Verdict: IMPLEMENTED, VERIFIED ON THE BRANCH; at the promotion gate.**
- Every Batch 2 item is built from Daisy's frozen design system (`origin/ux-1/daisy-experience`, `docs/coordination/ux/sistem-desain`).
- Each component is held by a guard test that fails on the code before it.
- The remaining gaps are listed in §4, and the decisions for Daisy in §5.

## 1. What was built

| Item | Done | Guard (red on old code, green now) |
|---|---|---|
| **W3.1 page titles** (WCAG 2.4.2) | All 63 pages name themselves, «<page> · PINTAR», from one map (`src/lib/judul-halaman.ts`). A page headed by data (a person's, class's or package's name) is titled by its place, so names never reach a shared computer's tab. A gated home is titled by its place too, so a refused reader's tab carries nothing of it. | UX2-JUDUL-01 |
| **W3.1 skip link** (WCAG 2.4.1) | «Langsung ke isi» is the first Tab stop on every page and leads to `#isi`, now the `<main>` of every page. The crawl found three pages (both certificate pages and the refusal page) with no `<main>` at all; they now have one. After a navigation inside PINTAR, `FokusRute` puts the Tab starting point back before the skip link, never taking focus a page, the tour or a dialog placed. | UX2-LEWATI-01 |
| **W3.3 FileField** (closes **RV-5**) | `BidangBerkas` replaces all four bare file inputs: Studio's workbook and media, Pendataan, and /lapor's screenshot. The browser's «Choose File / No file chosen» never shows. **Fixes the /lapor axe `label` (critical) finding.** | UX2-BERKAS-01 |
| **W3.3 dates** (closes **RV-16**) | One helper, `src/lib/tanggal.ts`, on WIB whatever the device's zone, in Daisy's six forms. `TanggalDenganGema` gives each of Siapkan's and Konfigurasi's 8 date fields its echo in words. No ad-hoc date formatting is left in `src`. | TANGGAL-01/02/03 |
| **W3.3 primitives** | Select chevron; Radio and Checkbox rows a 44 px target with a 20 px box; Badge ✓ for success; the health mark is a badge; Alert icon on `.pin-perhatian`; «Keluar» with the log-out icon; every `<details>` is a Disclosure with the chevron (closes **RV-21**); Daisy's tab icon (`favicon.ico`); the disabled-button reason line (`AlasanNonaktif`) | UX2-PRIMITIF-01, UX2-KOSONG-01 |
| **W3.2 empty state** (**CR-46**) | `Kosong` gives each kind its own sentence and action: not yet, not enough yet, nothing matches. The absence card says «Sekarang 3 murid; perlu 5.», never «(3/5)». | UX2-KOSONG-01 |
| **W3.4 Table / Collection** (CR-88) | `Koleksi` (`src/components/koleksi/`): search with a polite count and «Hapus pencarian»; one filter as segments, with a select below 640 px; a focusable, named frame; sticky head; 52 px striped rows; `th scope=row`; nothing-matches inside the frame; «Menampilkan 21–40 dari 312 murid» and «Halaman 2 dari 16». Works with no script. | KOLEKSI-HAL-01, KOLEKSI-TABEL-01, KOLEKSI-CSS-01 |
| **W3.5 account menu and the one Dialog** (JQ2(a)) | A staff member's name opens Akun saya, Laporan saya and, last, «Keluar dari semua perangkat…», with arrows, Home/End, Esc and outside press. That last item asks in the native `<dialog>`: focus on «Batal», «Keluar dari semua» the one solid red. «Keluar» stays visible outside the menu. A learner has no menu. | UX2-MENU-01 |
| **W3.14 J7 idle warning** | An alert at the top of the page, in the flow, never over the work. It has the clock, «PINTAR akan terkunci dalam 1 menit» and the attention ground, with no countdown. | UX2-JAGA-01 |
| **Keyboard focus** | The baseline's one unmarked focus stop (the lesson's audio) now shows the ring. | UX2-LEWATI-01 (CSS) |

**Tests restated, each where the markup or rule it read moved, never weakened:**
- PENUTUPAN-L01, PENUTUPAN-J01 and POLISH2-STUDIO-01 (FileField, Disclosure);
- DAISY-18-DENGAR-01 (the idle warning's alert, which Daisy specifies);
- DAISY-20-C17-01 (Akun saya now in the menu);
- the KartuKetiadaan render (CR-46);
- D140-SAJI-01 (dates).

**Declared exceptions added to the token rule, each with its reason:**
- `639px`: Daisy's 640 px breakpoint, which a media query cannot read from a token;
- `16ch`: a table row-name minimum.

**Changes in the copy table:**
- 22 new keys, every one in Indonesian and English.
- The Indonesian words are Daisy's, from her component READMEs and J-lists.
- The English is mine where she gave none (§5).

## 2. Verification

| Check | Result |
|---|---|
| Static selftests (local, on the merged tree) | **278 passed**. The one failure (BOB26-K01) needs `CARD_PEPPER`, which only CI sets. |
| App-level selftests (local build and stack) | 149 passed. The one failure (F22-K06) needs a fixture made by a suite that this subset did not run; it passed in CI. 12 skipped: no mail sink locally. |
| CI on the branch | §3 |
| **Keyboard walk** (local build, Chromium; `evidence/keyboard-walk.mjs`) | **21 of 22.** The skip link is the first Tab stop, visible and ringed, and Enter lands on `#isi`. The name button is reached by Tab (11 presses on Konfigurasi). Enter opens the menu with focus on «Akun saya»; ↓, End, Home and ↑ wrap; Esc closes and returns focus. The dialog opens on «Batal», keeps the page behind it inert, and Esc returns focus to the button. The menu fits at 320 px inside the drawer. The one failure is §4(a). |
| **axe** (WCAG 2.0/2.1/2.2 A, AA) on the shells | Clean on Konfigurasi, Akun saya, Lapor, Laporan saya and the learner's Belajar, except §4(a). |
| **Accessibility crawl** (Batch 0 harness, every persona; journeys job A in CI, repeated locally) | Against the **Batch 0 baseline** (§2.1) |
| Browser journeys (CI) | A and B green on `4c2ff6e`; the final head is in §3 |
| Visual evidence | `evidence/01-lewati-1280.png` (the skip link), `02-menu-1280.png`, `03-dialog-1280.png`, `04-akun-{320,1024,1280}.png`, `05-menu-320.png`, `06-belajar-1280.png` |

The browser walk found two defects before this report, both now fixed:
- the menu opened downward past the window;
- the CSS reset had removed the dialog's centring.

### 2.1 Accessibility, against the Batch 0 baseline

| Measure | Batch 0 baseline (39 screens) | Batch 2 (40 screens) |
|---|---|---|
| Title missing or only «PINTAR» | 39 | **0** |
| No working skip link as the first Tab stop | 39 | **3**: two are the guided tour taking focus on a first visit (by design; the teacher's Mengajar, the learner's Belajar), one is §4(b) |
| A focus stop without a visible indicator | 1 | **0** |
| axe clean | 38 | **40** (the /lapor `label` finding fixed) |
| Wider than the window at 640 px | 5 | 5 (unchanged; not Batch 2's) |
| Clipped text, or wider at 320, 1024 or 1280 px | 0 | 0 |

## 3. CI on the branch

| Run | Commit | Result | Minutes |
|---|---|---|---|
| `ci` 41411049255 | `4c2ff6e` | RED at lint: the evidence script used `require()`; converted to an ES module | 6 |
| `audit-journeys` 41411053594 | `4c2ff6e` | GREEN (A, B) | 45 |
| `ci` 41414899272 | `7eafd50` | RED: UX1-PIMPINAN-AKSES-01. /pimpinan's title carried its heading to refused readers; fixed. Cancelled once superseded. | 84 |
| **`ci` 41418570342** | **`d1bb705`** | **GREEN: 18/18; strict selftest 688 passed, 0 failed, 0 skipped** | 72 |
| **`audit-journeys` 41418574826** | **`d1bb705`** | **GREEN: A (every role's screens, with the accessibility crawl in §2.1) and B (Gladys's path)** | 44 |
| **Batch 2 total** | | | **251** |

GitHub bills nothing for this public repository; the minutes are runner-minutes, rounded up per job.

## 4. Remaining gaps (not hidden)

**(a) The skip link overlaps the learner's first navigation link while it has focus.**
- Daisy's skip link is an overlay at the top left, above everything.
- While it has focus it covers part of «Belajar» in the learner's shell; axe `target-size` reports 21.8 px of 24 left uncovered.
- It happens only while the skip link has focus.
- Daisy to decide (§5).

**(b) One crawl screen not yet reproduced:** the platform admin's /aktivasi, where the first Tab after the crawl's route lands on «info@pintarselalu.com». A direct visit tabs correctly. To be diagnosed.

**(c) Adoption on screens is later batches' work, as planned (E §Batch 2: «built once, used everywhere» in batches 3–6):**
- the 35 `.pin-empty` lines to `Kosong` with their actions;
- the Kelas roster to `Koleksi` (Batch 4; the Konfigurasi and Definisi pagers need their total counted first);
- about 25 `format.date` places from the formal to the readable form;
- the disabled-reason line on three buttons whose words Daisy has not given (§5).

**(d) Daisy's AppShell (the sticky left navigation with the identity block) is not Batch 2.** The account menu therefore sits in today's session strip.

**(e) The tab icon's `icon.svg` and `apple-icon.png` are not shipped.**
- They would need the proxy's matcher to admit two more anonymous paths, which is a security-boundary change.
- `favicon.ico`, already admitted, carries Daisy's icon.
- Owner decision.

## 5. Decisions needed

**From Daisy:**
1. Page titles: the «<page> · PINTAR» convention and the rule that a page headed by data is titled by its place.
2. The idle warning's place: I put it at the top of the page, in the flow, with no layer token.
3. The skip link covering the first navigation link while focused (§4(a)).
4. Words for three disabled reasons:
   - the learner's answer button before a choice;
   - Studio «Periksa» before a workbook;
   - the pager's ends.
5. Dates:
   - English «Sept» vs «Sep»;
   - «No date yet.»;
   - the emails' formal form with a time;
   - the Konfigurasi overlap sentence's form;
   - whether the test-email history keeps seconds.
6. Collection:
   - the no-script filter button;
   - the search count when nothing is searched;
   - the pager on a single page;
   - unknown totals;
   - the English words.

**From the owner:**
- §4(e), the two extra icon paths.

## 6. Scope kept

- No Batch 3 Studio workflow.
- No screen redesign.
- No 4.1, 4.5 or 5.0 work.
- No migration (Batch 2 is front-end only).
- Every permission and security boundary is unchanged; the proxy matcher was left as it is (§4(e)).

## 7. GO / NO-GO

- **Batch 2 on the branch: GO** for owner review.
- **Promotion** (the protected merge and the staging verification) waits on the owner's separate authorisation.

**STOP.**
