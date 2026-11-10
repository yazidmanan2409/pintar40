# Daisy's Experience Readiness Audit: completion (8 Nov 2026)

**Source:** Daisy's `KESIAPAN-4.0.md` and `SIAP-A-koreksi.patch` (`ux-1/daisy-experience`, `e639540b`, base `c4944fab`).
**Owner's direction (8 Nov):** resolve A1–A3 and the six walkthrough Bs; review every other B and C; no new feature and no scope change; verify; prepare a staging candidate; do not merge or deploy.

**Candidate:** `claude/awesome-rubin-bqxp6p` at `a10d5650`, on top of main and staging `c4944fab` (migration 200). **No migration is added.**

| Commit | What it carries |
|---|---|
| `27341d50` | Daisy's patch applied clean, then A1–A3 completed and the six walkthrough Bs |
| `57162fb4` | The remaining Bs within scope |
| `cf173362` | Integration dossiers (records only) |
| `a10d5650` | A keyboard defect the readiness walk found in «Keluar dari semua», and the walk itself |

Nothing was merged, promoted or deployed. Production is untouched.

## 0. Kinds of evidence

| Mark | Meaning |
|---|---|
| **T** | A selftest (static or rendered) that fails on the old behaviour |
| **W** | `audit/siap-jalan.mjs`, run in a real browser against a fresh `next build` of the candidate on the local synthetic stack, signed in as the real personas: R1–R6, 6/6 PASS. Screenshots were inspected by eye |
| **R** | A component rendered with the built application CSS and printed by Chromium at A4 |
| **CI** | Exact-commit CI and journeys on `a10d5650` (§4) |

Nothing here was seen on staging; staging still runs `c4944fab`. A finding counts as **closed** only on T, W, R or CI evidence. A **human accessibility check** remains for every finding marked ♿ (§5).

## 1. The A findings

| # | Finding | Correction | Evidence |
|---|---|---|---|
| **A1** | A natural sheet («Nama, Kelas») auto-mapped «Kelas» to the place-id field, so every row failed with a sentence that didn't say what to do | Daisy's patch: «Kelas», «rombel», «class» and «group» are never guessed as the place; only `node_id` is. Ambiguous columns are left for the admin to map, not silently reinterpreted. **Added:** the upload states the supported shape (one list per class, a «nama» column, the class chosen once with «Satu pilihan untuk semua», CSV or pasted rows), plus a valid example list. The failure sentence says to use «Satu pilihan untuk semua» | T: the Pendataan contract tests. W R2: with no Kode sekolah, the page says so where the upload would be |
| **A2** | The Guru couldn't reach their own Ringkasan Kelas | A secondary «Ringkasan Kelas» link on a **learner** class page only; a PD class keeps its record link. The report page still authorizes itself: the link grants nothing. `asalLaporan` gets `kelas`, so the back link reads «← Mengajar» | W R1: the Guru opens 5A, follows «Ringkasan Kelas» to `/edukator/ringkasan` and the summary renders, at 1280 and 390 px with no sideways scroll. Staging D5 (`9a97bb54`, unchanged code path): the Guru of «Kelas 5A» and a Kepala departemen of another branch see no participant and no mark at that address |
| **A3** ♿ | A sideways-scrolling lesson table couldn't be reached by keyboard | `.pin-ttabel` is `role="region" tabIndex={0}`, named by its header cells (GFM requires a header row, so it is always named). **Added:** a visible `:focus-visible` ring from the focus tokens. Arrow keys scroll a focused overflow region natively | T: the token guard and the Teks render tests. *Not walked: no lesson in the local fixture has a table.* NVDA/TalkBack check S-script §5 |

## 2. The six walkthrough Bs

| # | Finding | Correction | Evidence |
|---|---|---|---|
| **B1** | Studio's waiting state said «Perlu tindakan — Ada yang bisa Anda selesaikan sekarang» to an author who couldn't act, and implied someone is notified | When the next step isn't the reader's (`bolehMengambil`), the package reads «Menunggu orang lain», names who takes the step, and says **PINTAR tidak mengirim pemberitahuan** («ask them yourself»). The reasons list is hidden from a reader who can't act on it. On Studio's list, such a row adds «Menunggu orang lain». The count «Menunggu tindakan Anda» is renamed «Draf yang belum diajukan», which is what `studio_home` actually counts | T: STUDIO3A-BERANDA-01, the Studio state tests. W R6: no promise of a notification on Studio |
| **B2** | The role-then-activation order was stated nowhere | Peran & akses gets an intro with the teacher's order (role here, then the account on Aktivasi by email) and a heading on its form. «Lingkup» is now required for a school role, with what it means per role, and «Berlaku sampai» gets a hint. Aktivasi's intro says the same order and that PINTAR sends no email | W R3: intro, heading and required scope shown; Aktivasi screenshot inspected |
| **B3** | Pendataan hid the upload until Kode sekolah was saved, without saying so; the import ended with no way on | Without a code, the page says «Simpan kode sekolah di atas lebih dulu…» where the upload would be. The done page names the way on, in order: Peran & akses for teachers' roles, then Aktivasi; learners by class card | W R2. T: UX1-DATA-JUJUR-01, restated with its one onward-link exemption; it still forbids every activation word in the flow |
| **B4** ♿ | Destructive acts weren't «red twice» | One pattern, `KonfirmasiBahaya` (FormCabut generalized). The first press checks the form and opens the question in place; focus goes to «Batal»; the act is the red `TombolKirim` (sent once); «Batal» returns focus. Applied to the Studio and Kanonik withdrawals, the Konfigurasi maintenance end and the announcement withdrawal. «Keluar dari semua» and «Ya, tutup putaran» are red. **Authorization is unchanged:** each act's server function decides, as before. **Found by the walk and fixed (`a10d5650`):** «Keluar dari semua» on /akun dropped keyboard focus to the page top when it opened. It now behaves as `KonfirmasiBahaya` | T: DAISY-06-TERBIT-01, DAISY-17-KIRIM-01, UX2-MENU-01, BOB29-*. The admin-ujung and b8-jalan walks press both steps. W R4, by keyboard: Enter opens the question, focus is on «Batal», there is one visible red button, Enter on «Batal» returns focus to the first button, and nothing is sent |
| **B5** | Topics × classes with more than six classes: the landscape page started a new page, leaving page 1 holding only the page head | The whole report takes the landscape page when it holds a wide grid (`body:has(.pin-lk):has([data-kisi-lebar])`), so there is no forced break | T: LAPORAN-CETAK-01. R: the grid at 10 classes and 8 topics prints on **1 landscape A4 page** with the page head and the grid together; at 5 classes, **1 portrait page** |
| **B6** | «Explain once» (owner, 7 Nov) wasn't applied: «di bawah target» / «Perlu penguatan» was printed under every amber value | Amber values keep their colour, bar or dot. Their words become screen-reader text, so they are heard, not drawn. Each report says it once in a legend (class, grid, school) | T: LAPORAN-KELAS-01, LAPORAN-KISI-01, LAPORAN-SEKOLAH-01. R: one legend under the grid; no cell draws the words. W R5: on the Dekan's reports, no cell draws them |

## 3. Every other finding: fixed, or deferred with its reason

**Fixed (in `57162fb4` unless marked)**

Administrator:
- Aktivasi's «Semua orang … sudah bisa masuk» when nobody was recorded: the line is now true in both cases and says where people come from.
- Pendataan: «only CSV, though the page says spreadsheet» is resolved by the upload's own sentence (save as CSV, or paste the rows).
- PD enrolment showed an empty list without saying why: it now says a participant is staff who is recorded and given a role first.
- «Persiapan sekolah» counted PD classes: it now counts teaching classes only.

Educator:
- Lihat bukti's footer contradicted its «Lihat per soal» link: it now names what is absent and where per-question answers are.

Accessibility and shell:
- `Halaman.tsx`'s fraction diagram aria-label was Indonesian whatever the language: it now comes from the copy table in the lesson's language.
- **C8:** /lapor and the PD record give an admin the staff shell.

Terminology:
- **C10:** «asesmen» replaces «penilaian» where the word means the assessment (4 keys).
- **C10:** «terbitkan ulang» named a step that doesn't exist (3 keys reworded).

Workflow guidance:
- «Yang menunggu» counted a teacher without a role under «buat kartu kelas». The line now says to give their role first; class cards are for learners only (`3928fda0`).

**Deferred, each with its reason**

| Finding | Why it waits | Does it block a first-time user? |
|---|---|---|
| C2: Konfigurasi row results under the list; generic «✓ Selesai.» | A refactor of every Konfigurasi form's result plumbing (`HasilDi baris=` per row, per-section keys). That is a code change across a dozen forms, not a copy fix | No: each act still reports its outcome on the page |
| C3: «Batal» drawn three ways | Done on every confirmation touched here (`pin-quiet`). The rest are text links in older forms that ask nothing destructive | No |
| C4: several primaries per view (Aktivasi, Struktur, Studio upload); «Periksa isi sekarang» below the primary | **Needs a ruling:** D-140 says «one primary per form»; Daisy's P1 says per view. Changing this before the ruling would undo D-140 | Partly. Aktivasi's many primaries are one per person, which D-140 allows. **Recommended for the owner's ruling before the walkthrough** |
| C5: steps drawn three ways | A visual unification across three components; no information is missing | No |
| C6: four field-label looks; Konfigurasi errors in the browser's own bubble and language; `BidangTeks` has no error slot; hints not linked (W R3 confirms «Lingkup»'s hint isn't linked by `aria-describedby`) | A form-component refactor (`galat`, `aria-describedby`) and moving Konfigurasi onto it. The browser bubble is in the browser's language: an English-language browser shows English | **Partly ♿.** A required field still refuses with a message; a screen reader hears the bubble. Listed for the human AT pass |
| C7: typography outside tokens | Cosmetic | No |
| C9: PD refusal drawn two ways | Kept: Daisy closed X5-9 on the current drawing | No |
| C11: «Kembali» as "previous"; emoji as icons; Dialog's close button; etc. | Cosmetic, per Daisy's class C | No |
| **`studio_home` omits VALIDATED, APPROVED and FROZEN: an OPEN USABILITY DEFECT, register W1.16** | Needs a database migration to the RPC, which is held out of this candidate. Mitigated only: the count is renamed to what it counts («Draf yang belum diajukan»), and rows and the package page say «Menunggu orang lain» and who acts | **It can mislead.** Studio home may show «0» while a package waits at one of those steps. The owner should know before the walkthrough |
| Lowercase «admin sekolah» (16 keys) | The approved strings are quoted verbatim by walks; to be done in Dr Gladys's copy pass | No |
| «Cek penguasaan» in the workbook help | Kept: it is the workbook's own value, which the author types | No |
| Persiapan's «murid» step is not a link | Kept: DAISY-17 forbids a link to a page the step cannot open | No |
| Dekan «Peserta 418» without a base | Daisy's class C. The figure is the database's; the base is a new read | No |
| «username» vs «nama pengguna»; «Kursus» on certificates | **Dr Gladys's word**, per Daisy | No |
| Certificate skips h2 | Class C; the certificate is a fixed A4 surface under its own sign-off | No |

## 4. Tests and journeys

| Check | Result |
|---|---|
| Typecheck (`tsc`) | Clean on `a10d5650` |
| `next build` | Clean |
| Targeted selftests on `a10d5650` | LAPORAN-*, DAISY-*, STUDIO3*, D168, UX1-DATA-*, UX2-MENU-01, BOB29-*, F22-*: all green |
| Full local selftest on a fresh build of `a10d5650` | 840 passed, 19 failed. **One was a real defect of this work:** D168-B1-6, the grant form's heading was an h3 where a section page's parts are h2; fixed in `b41aeeed`. The other 18 (F18-*, BOB28-D01, D101/D102-D01, DR-D02/D03, TOUR-P01, UX1-UB-ALUR/KELOLA-01) read accumulated local database state; none appears on CI's fresh database (next row) |
| Readiness walk `audit/siap-jalan.mjs` (W) | **7/7 PASS** on a fresh build of `b41aeeed` (R7: Struktur by keyboard) |
| SIAP-FOKUS-01 (focus sweep) | Green: every client in-place panel moves focus, the ten swapping components move it as declared, and the planted copy is caught |
| Grid print render (R) | 10 classes: 1 landscape page; 5 classes: 1 portrait page |
| CI on `a10d5650` (run 42433800520) | **874 passed, 1 failed: D168-B1-6** (above, fixed in `b41aeeed`). All 16 other jobs green. Investigated, not re-run |
| Journeys on `a10d5650` (run 42433803149) | **Green, both jobs.** A: every role's screens, W6.2 first-screen timing, Studio end to end, administration, Batch 5, A4 print, the Batch 5 focused checks, E1+E2 navigation, the identity emails, E-RB, Batch 8. B: Gladys's path from an empty production-like database |
| **Exact-commit CI and journeys on the final candidate** | _to be dispatched once, on the final head, after Sharon's selftest change is integrated_ |

**Found during verification:** the local selftest reuses any existing `.next` build, so an earlier local run on 8 Nov tested a bundle from 7 Nov. That run's app-level results are not counted here. CI always builds fresh and is unaffected.

## 4a. The focus pattern, swept (owner, 8 Nov)

The walk found «Keluar dari semua» dropping keyboard focus when its question opened (`a10d5650`). On the owner's instruction, every client component that swaps a button for a question or small form was checked. Six more lost focus, and all now move it (`3928fda0`):
- «Tutup putaran»;
- Struktur «Ubah nama» and «Nonaktifkan»;
- Aktivasi «Kartu hilang» and «Jadikan akun email»;
- the learner's finish question;
- the last step of a lesson's worked example.

The rule: opening moves focus to the safe choice, or to the field the panel asks for; leaving returns it to the button that opened it. Server-rendered panels opened by an address (Konfigurasi `?angkat`, the first admin) are page loads, not in-place swaps, and are outside this rule. SIAP-FOKUS-01 now holds the rule.

## 5. Outstanding human accessibility checks

These need a person with assistive technology, using `SCREEN-READER-SCRIPT.md` S1–S8 and NVDA 2024+ / TalkBack 14+:
1. **A3:** a lesson table on a phone with TalkBack, and on desktop with NVDA. The region is announced by its headers, and scrolls with swipe and arrow keys.
2. **B4:** each destructive confirmation by NVDA. The question is announced on open, the act is announced as the red button, and «Batal» returns.
3. **B6:** a report's amber values are announced with their words; the legend reads once.
4. **C6:** Konfigurasi's browser-bubble errors, as heard by NVDA in an Indonesian browser.
5. **The human journeys H1–H20:** none is recorded yet. The automated walks are not acceptance.

## 6. Readiness recommendation for the owner's unscripted walkthrough

**Ready for staging promotion as a candidate, once exact-commit CI and journeys are green on `a10d5650`.** It is **not yet confirmed ready for the walkthrough** until:
1. the owner authorizes promoting `a10d5650` to staging, under the protected gates;
2. Second Eye (or Daisy) runs one signed-in pass on staging over the admin, Guru and leadership journeys at 1280, 390 and A4. The local walk shows the corrected screens, but staging's data shapes differ;
3. the owner rules on C4 (one primary per view vs D-140), or accepts it as known.

All three A findings and all six walkthrough Bs are corrected with evidence. Every other B is fixed or deferred above with its reason; none of the deferrals stops a first-time user from knowing what to do next. The human accessibility checks in §5 remain open, and automated success here is not human acceptance.
