# Engineering items found during Daisy's design work (register; NOT authorised) · 4 Nov 2026

**What this is: the implementation register for every accepted design, requirement and ruling (D-180).**
- **The four fields of every obligation (D-180):**
  1. *what must exist*: the row's item;
  2. *where it is implemented*: a path on its row («**Implemented in:**») or in its holding test's `proves`;
  3. *how it is verified*: the test, walk or inspection that names it, or «**Held by:**»;
  4. *what remains*: «**BLOCKED:**» and who decides.
- **Verification rule (D-179(a)):** every change has appropriate verification. Every defect correction has a regression test shown failing on the defect.
- **Reconciled the day a ruling is made**, in «Rulings reconciled» at the end. `R-PROSES-01` checks both directions in every CI run.
- **History:** this list began as the items found during Daisy's design work, built under D-177's authority on the development branch (below).

**Already done:** the card email's role order (D-164(b), `9b52b51`, B6K-URUTAN-02; CI and journeys green).

**Corrected under D-177 (4 Nov, development branch; evidence: `docs/completion-4.0/d177-koreksi/README.md`):**
- E-C2-1, E-C2-2, E-C2-3; E-K1, E-K2, E-K3, E-K4, E-K7, E-K8, E-K9;
- E-A2-1, E-A1-1, E-D2-1, E-B1-4;
- E-C1-1, E-C1-2, E-C1-3, E-C1-4 (words pending Dr Gladys), E-C1-5, E-C1-6, E-C1-7 (BOB43-D01 sweep with a planted control).

Each has a D168-* regression test that was red on the old source and is green now.

**Verified by render, no change needed:** E-B4-1 (D168-B4-1).

**Built under D-177 (4 Nov, `b03dbba5`):** E-E1-1, and E-E1-2's automated part, with E1 + E2 as one navigation (D168-E1-1, D168-E2-1, `audit/e1-navigasi.mjs`; `d177-koreksi/README.md` §4c). The NVDA and TalkBack passes remain manual and need devices.

**Built under D-177 (4 Nov, `c4e2ffe3`):** B1, the Konfigurasi split, with E-B1-1 (D168-B1-1; `d177-koreksi/README.md` §4d).

**Built under D-177 (4 Nov, `4b525376` … `f8ca02c9`):** every section's pattern (B1 §1), the heading order of a section page, and B1 §2's A4 rule. Proved by D168-B1-2/3/6/7, B4-W11 and P6 (`d177-koreksi/README.md` §4e).

**Still open:**
- E-B1-3 (its word);
- E-K-ALL (re-run at each CI);
- the NVDA and TalkBack passes;
- the larger compositions.

## C1 · reports, Management and professional learning (D-167)

Found by Daisy, C1 part B §8 (`ux-1/daisy-experience` at `9914bc97`).

| # | Defect | Planned regression test (red today, green after) |
|---|---|---|
| E-C1-1 | A raw data key can appear as a label | render each report surface with an entry whose `label_key` has no copy; no key-shaped text (`[a-z]+(\.[a-z_]+)+`) reaches the page; the static «every key in the table» guard extended to the keys these pages read |
| E-C1-2 | Staff pages use the educator wording (`s(…, "educator", …)` on pages a Dekan, Kepala departemen or Admin sekolah reads) | source and rendered: each staff report page asks the copy table with the staff persona; the rendered words match the staff copy |
| E-C1-3 | Two pages can render an empty heading | rendered: no `h1`–`h3` with empty text on any C1 route, in any state (including withheld and not-yet entries) |
| E-C1-4 | The `/pengembangan` refusal falls back to a generic line | the refusal renders Daisy's proposed key (after copy approval), in both languages; never the generic fallback **Implemented in:** `src/app/pengembangan/[simpul]/page.tsx` (`pengembangan.ditolak` through HalamanPenolakan); held by `D168-C1-1`. Its words: **BLOCKED:** copy approval (Dr Gladys pack B10). |
| E-C1-5 | The `/pengembangan` footer prints | the A4 print walk (`audit/b6-cetak.mjs`) gains `/pengembangan/[simpul]`: no shell part, footer included, on paper **Implemented in:** `src/app/pengembangan/[simpul]/page.tsx` (its footer) and the print stylesheet `src/app/experience.css`; held by `audit/b6-cetak.mjs` (the `/pengembangan` page on A4). |
| E-C1-6 | `/pengembangan` picks its shell from role names in the page code (`peranSaya`, `src/app/pengembangan/[simpul]/page.tsx:37–39`) | source: the shell is chosen from the working context (D-132), as every other staff page does, not by matching role names; rendered: each audience gets its own context's shell |

### E-C1-7 · The safeguard: Admin sekolah never retrieves an individual professional-learning result (owner, 4 Nov)

**The rule:** D-069(b). The facilitator, the Kepala departemen over the place and the Dekan see each participant's result/score. **Admin sekolah sees enrolment, participation and completion, never a result**, and that is enforced at the database boundary, not by hiding a column (D-069(b): «enforced at the database/RLS boundary, never only by hiding UI»).

**What is already proven:** BOB43-D01 runs against the database. As Admin sekolah it shows:
- no PD row in `assessment_sessions`, `lesson_progress`, `responses`, `presented_items` or `integrity_signals`;
- `professional_learning_record` returning only the enrolment, participation and completion columns.

**What the safeguard adds:** a sweep, as Admin sekolah, of **every other path** to a PD participant's result. Each must return nothing for a PD session, or refuse:
- `assessment_results` read directly;
- `metric_evaluate('learner.result', …)` and every catalogue metric that carries a result, for the PD participant;
- `generate_report` on a template naming such a metric, at the PD Kelas, its Bagian and the school;
- the certificate reads (`my_certificate` is the learner's own; the verification and management reads for a PD certificate);
- the `/pengembangan`, Ringkasan, `/pimpinan` and Konfigurasi API routes, read with Admin sekolah's session.

**A planted control:** the test grants Admin sekolah one read, for example a permissive policy on `assessment_results`, inside a rolled-back transaction, and must then go red. That shows the sweep can detect a leak.

**Why it matters:** the earlier educator-as-learner evidence-access defect showed that a column hidden in the page is not a boundary. This test reads the database as the person, the way BOB43-D01 does.

## C2 · the PD Kelas «Lihat bukti» (design under review)

Found by Daisy in C2 (`ux-1/daisy-experience` at `d9a27652`), or by the coordinator reviewing it.

| # | Item | Planned regression test |
|---|---|---|
| E-C2-1 | «Lihat nama murid» does not switch to the participant word for a PD Kelas (proposed key `mengajar.bukti.siapa_peserta`, pending copy approval); seen live twice. The `/siapa` names link to `/mengajar/[kelas]/murid/[orang]` | rendered PD Kelas: no «murid» anywhere on the page or on the participant's page it links to (UX1-AJAR-KATA-01 extended) |
| E-C2-2 | For a PD Kelas the page still asks for the five class metrics and draws five «not yet» cards. D-070(h): no figure is added or computed | source and rendered: for a PD Kelas the page requests no class metric and draws only the one statement and the link to the record; the ordinary class page is unchanged **Implemented in:** `src/app/mengajar/[kelas]/bukti/page.tsx` (`adaBuktiSoal`, `src/lib/mengajar.ts`); held by `D168-C2-1`. Its presentation: **BLOCKED:** C2 under review (K3). |
| E-C2-3 | «Lihat per soal» is offered on a PD Kelas, and the per-question page **refuses the facilitator** (seen live, `verifikasi-b1-c2/putaran-2`); «Minta membaca lagi» stays. The database refuses the facilitator participants' answers (BOB43-D01 `jawaban_fasilitator` 0; live probe 0) | **Fixed at the source (D-168):** the link is derived from the same permission the per-question page asks, not from a PD special case. Test: for every reader and class kind, «Lihat per soal» is offered exactly when its page admits that reader; the page still refuses, and shows no participant's answer, if reached by address |

**Checked during review:** BOB43-D01 lets Admin sekolah read a PD `assessment_sessions` row (`sesi_admin: 1`). That table holds status and timestamps only: no score or result (`supabase/migrations/20260912133821_evidence_session_root.sql`). So it is completion, which D-069(b) allows. Results live in `assessment_results`, and E-C1-7 sweeps them.

## B1 · Konfigurasi (D-166(a))

| # | Item | Planned test |
|---|---|---|
| E-B1-1 | **Every existing Konfigurasi link keeps working:** the anchors (`#struktur`, `#roles`, `#rollover`, `#pindah`, `#system`, `#pemeliharaan`) and the query parameters (`?bagian=…`, `?hasil=…`, `?muat=…`, `?sekolah=…`, `?periksa=skema`, `?cari_sekolah=…`, `?hal_jejak=…`), from server actions, Persiapan, Ringkasan and the walks | a table of every link found in `src/` and `audit/`; each lands on its section page with the same result line; the walks updated to the routes **Implemented in:** `src/components/konfigurasi/TerusBagian.tsx`, `src/lib/bagian-konfigurasi.ts`; held by `D168-B1-1` and `audit/admin-ujung.mjs` (W11). |
| E-B1-2 | `config.refused`'s English says «system administrators only»; the Indonesian says Admin sekolah or Admin platform | the rendered copy says the same thing in both languages (after copy approval) **BLOCKED:** copy approval of `config.refused` in both languages (Dr Gladys / copy approval; D-178 pass). |
| E-B1-3 | The seed school's display name: a seed-file change (`supabase/seed/official_bootstrap.sql:68`, and `audit/studio-ujung.mjs`), development and CI only; the wording waits on Dr Gladys | the seed and the walk agree; no migration **BLOCKED:** Dr Gladys, the seed school's name (D-178 pass). |
| E-B1-4 | The design system's date field: the calendar button shows no focus ring (Daisy's proposed fix; a change to the frozen system) | rendered: every Tab stop of a date field shows the focus ring |
| E-B1-5 | **«Perpindahan murid» is drawn in «Seluruh platform» against L3** (CR-83; D-127 Q2, Q11; D-132 C7). `src/app/konfigurasi/page.tsx:495` lists `transfers` in `BAGIAN_SEKOLAH` (school-shaped, not drawn in «Seluruh platform»), and the menu follows it; but its `<section id="transfers">` (`:1198`) is the one school-shaped section without `hidden={!tampil(…)}`. Found live in the B1 evidence rounds; the coordinator first misread it as a feature (round 1) | source: one rule decides both the menu and the section, so no section can be drawn that the rule hides; test: in «Seluruh platform» no school-shaped section renders, and each still renders in a school's context. **Owner, D-169(a): L3 preserved; a genuine implementation defect.** Integration regression check: for Admin platform in «Seluruh platform» and for Admin sekolah in its school, the set of sections rendered equals the set the menu lists, for every section; transfers render only in a school's context |

## A1 · the question review (D-166(b))

| # | Item | Planned test |
|---|---|---|
| E-A1-1 | The question loader (`src/lib/soal-tinjauan.ts`, `susunSoal`) does not read each question's difficulty band (`items.predicted_difficulty`) or each option's misconception (`item_options.misconception_code`) | the loader returns both; the review renders them; reading stays limited to the drafter's existing access |

| E-A1-2 | **The composition itself** (added by the retrospective, R3-1: the section held only E-A1-1, so A1 stood unbuilt): one whole lesson per view, the lesson jump and a pager naming the lesson, package-wide numbering, the key by badge, icon and word, every reason and misconception shown, the «gagal» and empty states; the loader never shows a part as the whole | **Held by:** `R3-SOAL-01` `D088H-K01` `D168-A1-1` `audit/studio-ujung.mjs` (U7b, 320 px included). Its ten new words: **BLOCKED:** copy approval (Dr Gladys pack B28) |

## A4 · Batch 3's words (accepted, D-171(b))

| # | Item | Planned test |
|---|---|---|
| E-A4-1 | The corrected words of B2, B5, C2, C5, C7 and D7 in both languages; one «(opsional)» key for every optional field (added by the retrospective, R3-2) | **Held by:** `R3-A5-01`. C3's hint and C9's sheet: **BLOCKED:** Dr Gladys (pack A5, A6; C9 also X12, K2) |

## A5 · Batch 3's layout answers (accepted, D-173(a))

| # | Item | Planned test |
|---|---|---|
| E-A5-1 | The page-level corrections B10 (a package's title is its page's h1; Studio's head aside), C1 (the sent-back badge), J5 (the window in Siapkan's review) (added by the retrospective, R3-3; B3, B12, C8 and D6 are E-K3, E-K8, E-K7 and E-K9) | **Held by:** `R3-A5-01`. B7, B9, B11's words: **BLOCKED:** copy approval (pack B1–B3) |

## B2 · «Nomor Registrasi Sekolah» (accepted, D-174, D-175)

| # | Item | Planned test |
|---|---|---|
| E-B2-1 | The 11 keys in both languages, one English term, the explanation on Pendataan and Aktivasi, the identifiers kept apart (added by the retrospective, R4-7) | **Held by:** `D168-B2-1` (both languages compared) **Implemented in:** `src/lib/hle.ts`, `src/app/pendataan/page.tsx`, `src/components/aktivasi/CariTunggu.tsx`. |
## A2 · the Uji Cepat class figure (accepted, D-170(a))

| # | Item | Planned test |
|---|---|---|
| E-A2-1 | The stored Uji Cepat title reads «UJI CEPAT · UJI CEPAT — 2026-11-02 20:26»: the page's eyebrow repeats «Uji Cepat» over a title that already carries it, and the title's date is written outside the date helper (Daisy, A2 at `de23fb04`) | **at the source:** the title is made once, where the Uji Cepat is launched, with its date through the date helper (RV-16), and the surfaces that show it do not add the word again; test: every surface that shows an Uji Cepat title (the result page, «Keadaan hari ini», Belajar, the history) shows «Uji Cepat» once and a helper-formatted date |

## E1 + E2 · the navigation (D-169(d): one integrated navigation)

| # | Item | Planned test |
|---|---|---|
| E-E1-1 | **In the rail, the design system hides each place's visible name with `display: none`, so the link loses its accessible name** (axe `link-name`; Daisy, E1 at `313fb8e5`). Her composition adds `aria-label` to every place | **at the source (D-168):** the shell's rail hides the name *visually* only (the visually-hidden technique), so the link's own text stays its name and no second copy (`aria-label`) can drift from the visible label; **approved by the owner (D-170(c))**; a change to the frozen shell. **Knock-on found by Daisy (`a3cef3bb`):** the shell's tooltip decides to show by testing whether the label is `display: none` (`perlu()` in the bundle), so hiding the label visually would silently switch the rail's tooltips off. The tooltip must instead follow **the rail's own state** (collapsed or in the rail range), the same state that hides the label. Test: in the rail every place link's accessible name equals its expanded label, for every context; no link carries `aria-label`; a focused or hovered rail link shows its tooltip, and an expanded one does not |
| E-E1-2 | **The integrated navigation (D-168, D-169(e))** | **Required (D-170(e)).** One walk per role and context, with the transitions between them: one context; a Guru who also learns (Mengajar ↔ Belajar); Admin sekolah; Kepala departemen and Dekan; Admin platform in «Seluruh platform». For each: the places are exactly `permukaanKonteks` and the extra places; the sections drawn equal the menu (E-B1-5); the context control appears only with another context; a refused action in another context shows `context.other_school`'s line; the rail, the collapse and the drawer at 1280, 1279, 1100, 1024, 1023, 820, 390, 320 **Implemented in:** `src/components/NavKonteks.tsx`, `src/components/CangkangPengalaman.tsx`, `src/lib/konteks.ts`; held by `D168-E2-1` `audit/e1-navigasi.mjs`. NVDA and TalkBack: **BLOCKED:** a manual run at acceptance. |
## D-172 · shared-pattern corrections (accepted, D-173; Daisy's consistency record, `ux-1/daisy-experience` at `1a2b911d`, `X-KONSISTENSI/README.md`)

Each correction is made **once, in the shared component or helper**, never per screen. Each is checked by **one cross-screen check inside the existing static suite or journeys**, not a new suite (D-172).

| # | Inconsistency (verified in the code or live) | Correction at the shared source | Cross-screen check |
|---|---|---|---|
| E-K1 | **Bare «Kembali» back links:** `laporan.kembali`, `pimpinan.kembali`, `umpanbalik.kembali`, `pengembangan.kembali`; live: «← Kembali» on Ringkasan and `/pengembangan`, whose destination differs by reader (`/mengajar`, `/pimpinan`, `/konfigurasi`) | one back-link helper that names its destination from that destination's own place name. **D-173(d): a fixed-destination link (a place) is distinct from a genuine browser-history back:** the helper is for the first; a page whose return depends on how the reader arrived uses the history behaviour, named as such, never a guessed place | static: no `pin-back` / `backKey` whose rendered words are only «Kembali» where the destination is known; every history-back is declared as one |
| E-K2 | **Two pagers:** `src/components/koleksi/Penomoran.tsx` says «Kembali» for the previous page, omits it on page 1 and shows no position line; the Collection pager says «Sebelumnya · Halaman n dari m · Berikutnya» (both seen live, `verifikasi-b1-c2/putaran-2`) | **one canonical pagination grammar (D-173(d)), for known and unknown totals:** one Pagination component; the keyset pager (no total, by FD-4) shows «Menampilkan {dari}–{sampai} {benda}» (`koleksi.menampilkan_tanpa_total`, pending copy approval) and «Sebelumnya» disabled, not hidden, on page 1; **no total is computed where the rule forbids one** | static: one pager component imported everywhere; no «Kembali» inside a pager; rendered: page 1 shows a disabled «Sebelumnya» |
| E-K3 | the ✓ alone on its line when BarisHasil wraps (A5 B3; J5's live result) | in BarisHasil, once | rendered at 320 px: the mark and its words share a line, on every surface that shows a result |
| E-K4 | a result line away from the action it answers | the result line belongs to its form or row (the existing `result(bagian)` pattern) | static: each action's result renders inside its form or row |
| E-K7 | the «PINTAR» eyebrow inside the shell (Konfigurasi, seen live; Studio) | one page-head rule: no app-name eyebrow inside the shell | static and rendered: no eyebrow reading «PINTAR» on any shelled page |
| E-K8 | Studio's step markers read as radio buttons | the one step-list component, as J1Terbit's named steps | rendered: the step list has no radio-like role or look |
| E-K9 | disabled date fields standing for a fixed value (Siapkan after «Disediakan») | fixed values render as text through the date helper | rendered: no disabled input shows a value that cannot be changed **Implemented in:** `src/components/bentuk/TanggalDenganGema.tsx`; held by `D168-K9-1`. |
| E-P15 / E-P17 | (guards) every refusal through HalamanPenolakan; no disclosure around required content | as built | static: kept as guards over new screens **Held by:** `UX1-PIMPINAN-LINGKUP-01` `UX1-DATA-WENANG-01` `B5C-TOLAK-K01` (E-P15, per area: Pimpinan, the data surfaces, Mengajar); `R-PROSES-01` (E-P17: every disclosure declared). |
| E-K-ALL | **A shared-component change must not break unrelated consumers (D-173(d))** | — | for each changed shared component (Pagination, the back-link helper, BarisHasil, the step list, the page head): every consuming screen listed from the source, and the existing walks of those screens re-run green **Held by:** `.github/workflows/audit-journeys.yml` (every walk re-run on each candidate head) `R-PROSES-01` (no engineering item without a holder). |
**The exceptions Daisy documented (X1–X6) are accepted as intentional differences (D-173(c)), not permission for arbitrary inconsistency.** Each is an allowed difference in the checks above, named, so a check does not flatten a deliberate behaviour.

## A3 · the small-group class figure (accepted under O3 (a), D-176)

| # | Item | Planned test |
|---|---|---|
| E-A3-1 | **The «how far» line has no participant form:** `ketiadaan.jumlah.murid` («Sekarang {have} murid; perlu {needed}.») is the only key. Daisy found it for an Uji Cepat in a PD class (A3, `e0e15d54`); round 2 saw the same line say «murid» on a PD class's Ringkasan and «Lihat bukti» (X2) | **at the source (D-168):** `kalimatJumlah` (`src/components/bukti/KartuKetiadaan.tsx`) takes the place's kind, as the base line `mengajar.cepat.hasil.dasar` already does with `{benda}`, and a participant form `ketiadaan.jumlah.peserta` is added (copy approval). One fix serves every PD surface. Test: on every surface that shows the line, a PD place says «peserta» and an academic one «murid» |
| E-A3-2 | **The ruled rule (D-176):** the Uji Cepat class figure only at **five or more official scored results**, from **one authoritative threshold** (never written into a page or its words); below five: no average, the P14 not-yet pattern with the scored count and the required five, the class total and scoring status kept; zero scored: the empty state, never «0»; **individual scores always visible to authorised educators**; no score, permission or result changed | rendered, at 0, 1, 4, 5 and 28 scored, in an academic class and a PD class: the figure appears from 5; the count line names the right people (E-A3-1); the learners' rows appear at every count; source: the threshold has one definition and no page contains the number 5 for it |

## B4, D2 (design under review)

| # | Item | Planned test |
|---|---|---|
| E-B4-1 | Daisy confirms the card with a platform role beside a school role as built (`1820300e`): «Admin platform» on its own line, then «Guru · SMP …», alphabetical, the first role's colour; the card email takes the same lines (D-164). **No render of the case exists**; she read it from the code path | rendered: a synthetic person holding SYSTEM_ADMIN and a school role, on «Akun saya» and in the card email, shows the same lines in the same order and colour; a [manual] side-by-side once reproduced **Rendered (4 Nov):** a synthetic person holding SYSTEM_ADMIN and a school role, on Akun saya at 1280 and 390 px, from a disposable local stack: «Admin platform» alone, then «Guru · Sekolah Sintetis Alpha», the first role's colour (`docs/completion-4.0/retrospektif/evidence/b4-kartu-platform-dan-sekolah-390.png`). This is visual evidence for the owner's review, **not final acceptance** of the card in every required condition. |
| E-D2-1 | Daisy confirms «Sertifikat Penguasaan · {the package's title}» as both the suggested file name and the PDF title, with no learner's name (`f33f7beb`), and adds: characters a file name cannot hold are replaced, a 150-character cap, the tab title restored after a print **or a cancelled print** | rendered: a title with `/ \ : * ? " < > \|` and a 200-character package title gives a clean, capped name and PDF title; the tab title returns after print and after cancel; no learner's name in either (W3.1) |

## D1 · the identity emails

The full plan is in `05-D1-IMPLEMENTATION-TEST-PLAN.md`.

**Built (4 Nov, `be8a68c2`):** the reason line under the heading, the context line where the data carries a place, warm white and the gold line, and the card block from `susunKartu`. Proved by D1E-K02–K08, K10, K12, K14–K16, the restated DAISY-19/20, B6K-URUTAN-02, B6K-WARNA-01 and D168-B4-1, and the walk `audit/d1-email.mjs` (K09, K13, the keyboard order). **Open:** P5 (Dr Gladys) and P6, the manual client protocol (owner).

## Reverse reconciliation: open coverage (D-179(e), D-180)

The 138 «[auto]» lines of the accepted designs, read against the tests (`docs/completion-4.0/retrospektif/04-REKONSILIASI-BALIK.md`). Ten defects were corrected (its §2). What remains is built but not yet proven. Each row below is **OPEN until a test or walk holds it**, and it counts against GREEN.

| # | Item | Status |
|---|---|---|
| E-RB-1 | Every accepted surface walked at the accepted widths (1280/820/390/320) with a judged axe run: A1, B1's section pages, C1 (Ringkasan Kelas and Sekolah, `/pimpinan`, a node), C2's PD page and record, E2's chooser | **CLOSED** (D-181). **Implemented in:** `src/app/studio/paket/[course]/page.tsx`, `src/app/konfigurasi/page.tsx`, `src/app/pimpinan/page.tsx`, `src/app/page.tsx`. **Held by:** `audit/rb-ujung.mjs` (RB1-A1, RB1-B1, RB1-C1, RB1-C2, RB9). Found and fixed: the chooser's session row at 320 px (RB9) |
| E-RB-2 | A judged keyboard walk (skip link first, a visible focus on every stop, no trap) on the same surfaces | **CLOSED** (D-181). **Implemented in:** `src/app/globals.css` (the focus ring). **Held by:** `audit/rb-ujung.mjs` (every RB1 surface and the chooser, RB9) |
| E-RB-3 | A1: the pager's accessible names at 320 px; the empty, gagal, large and long states | **CLOSED** (D-181). **Held by:** `audit/rb-ujung.mjs` (RB1-A1: the names at 320 px, the page at four widths) `R3-SOAL-01` (the loader executed: a failed read is a failure, never a list; 2,500 questions read; an empty lesson kept) `audit/studio-ujung.mjs` (U7b). The «gagal» line is the shared `BarisHasil`, held by its own tests |
| E-RB-4 | A2/A3: both languages of the label; the PD form of the base and the «how far» line; the figure at five and more | **CLOSED** (D-181). **Held by:** `R3-A5-01` (the label, both languages) `R3-PESERTA-01` (the line executed for both kinds; the class report passes its kind) `MENGAJAR3-HASIL-01` (the figure executed at 2, 4 and 5 scored, none below five) `R3-A2-01` `audit/studio-ujung.mjs` (U15, rendered). **Minor, recorded (D-181(3)):** `.belum`'s English says «The class average appears…», Daisy's draft «The class average score appears…» (copy, with K1) |
| E-RB-5 | B2 rendered: the explanation on Pendataan and as Aktivasi's search description; one name in both languages; «nomor anggota» never | **CLOSED** (D-181). **Implemented in:** `src/lib/hle.ts`, `src/components/aktivasi/CariTunggu.tsx`. **Held by:** `audit/rb-ujung.mjs` (RB5) `D168-B2-1` (both languages; «nomor anggota» added). No identifier format, column or migration changed in B2 (its commit touched copy and one component only) |
| E-RB-6 | C1: the Ringkasan pages' figures (no empty heading, no label on a withheld figure, every shown figure with its sentence) rendered | **CLOSED** (D-181). **Implemented in:** `src/app/edukator/ringkasan/page.tsx`. **Held by:** `audit/rb-ujung.mjs` (RB1-C1) `F08-P03` (the report keeps the template's order). The print header and page counter: **BLOCKED:** G6's title words (Dr Gladys, K1) |
| E-RB-7 | D1: the frame on all eight emails; the plain text's actions and footer; the recovery duration | **CLOSED** (D-181). **Held by:** `D1E-K01` (rendered from the real templates) |
| E-RB-8 | D2: the file name's language; the printed PDF's `/Title`; the tab title restored on leaving the page | **CLOSED** (Daisy, 4 Nov, `78b680d5`: the name follows the certificate's issued language, as built at `src/app/belajar/sertifikat`'s certificate page via `language_as_issued`; her D2 line corrected). **Held by:** `D168-D2-1` `B6C-PRINT-01`. **Minor, recorded (D-181(3)):** the browser tab's title while printing |
| E-RB-9 | E1–E3 rendered: no group heading in the navigation; doors at least 56 px; at most one current door; the session row whole at 320 px | **CLOSED** (D-181). **Implemented in:** `src/app/page.tsx`, `src/components/BarisSesi.tsx`, `src/app/experience.css`. **Held by:** `audit/rb-ujung.mjs` (RB9) `audit/e1-navigasi.mjs`. «A refusal without the navigation» and the lapse redirect's sentence: **BLOCKED:** G1's words (Dr Gladys, K1). The idle warning never takes focus: by inspection, `PenjagaSesi` calls no `focus()` (accepted inspection, D-181(2)) |
| E-RB-10 | K8: the step list's markers | **CLOSED** (Daisy, 4 Nov, `78b680d5`: A5 B12 final; the design system's `.pds-steps` corrected to it). **Implemented in:** `src/app/experience.css` (`.pin-lt-langkah`), `src/components/studio/LangkahTerbit.tsx`. Every marker filled: done an ink-1 dot, current the primary pill at 600 with `aria-current`, to come a line-control dot; never a ring or a segment. **Held by:** `D168-K8-1` (restated) `audit/studio-ujung.mjs` (U8, the drawn markers read from the browser) |

## K6, interim (D-182)

| # | Item | Status |
|---|---|---|
| E-K6-1 | The production data-residency architecture: where production data, files and backups reside, decided before any real-school use | **BLOCKED:** the owner, pending legal review (D-182(3)). Singapore stays for development and testing only (D-182(1)); no migration or new hosting commitment until the owner decides (D-182(4)). Not production acceptance |
| E-K6-2 | Exposed assessment questions are never reused: the 240 exposed real-assessment items retired, regenerated items new identities with no stem matching an exposed one, the store's access rules with a refusal test, and «no real use on production» verified against production evidence | **BLOCKED:** the owner, K6.1–K6.6's answers, F-4(c) (the chapters for real assessment) and F-4(e) (production evidence); `batch-1/F4-EXPOSED-ITEM-INVENTORY.md`. The retirement in the database is E-K6-3 (D-183). Until then the repository guard (`SEC-G01`, `SEC-G02`) keeps keyed material out of the tree, and only synthetic data is used (D-182(6)) |
| E-K6-3 | The exposure flag (F-4(f), D-183): the 20 exposed chapters cannot be given or sat as a real Pemetaan Awal or Cek penguasaan in a school that is not synthetic; a renamed copy or a correction keeping an exposed question is caught by fingerprint; a regenerated correction passes; synthetic schools keep working; the marks are fingerprints only and permanent | **BUILT on the branch, not deployed** (D-183(3)). **Implemented in:** `supabase/migrations/20261228100000_exposed_questions_never_give_a_real_verdict.sql`, `src/lib/penugasan-kontrak.ts`, `src/lib/hle.ts` (`mengajar.sedia.kode.assign_exposed_content`, words with K1 B35). **Held by:** `F27-X01` `F27-X02` `F27-X03` `F27-X04` `F27-X05` `F27-X06` `BOB04-K01` (red before: `docs/completion-4.0/retrospektif/evidence/d183-merah-sebelum.txt`). Deployment: the protected gates |
| E-K6-4 | Staging's test work after E-K6-3 is deployed: ten founded test and demonstration schools on staging are not synthetic (as every founded school is; staging's environment reads «production») and hold an exposed chapter with open cycle assignments, so they would be refused it | **BLOCKED:** the owner, at the deployment gate (D-183(3)): for example move staging's test work to the synthetic replacement chapters, or mark those schools synthetic. Read-only check, 4–5 Nov; nothing on staging was changed |

## Rulings reconciled to obligations (D-179(e))

**Every ruling from D-166 on is reconciled here the day it is made.** That is when design acceptance after batch closure began. Each ruling names the obligations above that carry it, or says why it carries none. `R-PROSES-01` fails on a ruling in `docs/coordination/DECISIONS.md` that has no line here, and on an obligation named here that has no row above.

| Ruling | What it accepts or directs | Obligations |
|---|---|---|
| D-166 | B1 (Konfigurasi); A1 (the question review); the interim email logo's alt | E-B1-1, E-B1-2, E-B1-3, E-B1-4, E-B1-5, E-A1-1, E-A1-2 (the alt: D1, `05-D1-IMPLEMENTATION-TEST-PLAN.md`) |
| D-167 | C1 (reports, Management, professional learning) | E-C1-1, E-C1-2, E-C1-3, E-C1-4, E-C1-5, E-C1-6 |
| D-168 | standing directive: cross-component integrity and end-to-end acceptance | none of its own: held by `R-PROSES-01` and the journeys (E-K-ALL) |
| D-169 | O11, E2 and the navigation (O6) | E-E1-2 |
| D-170 | A2; E1; O12 (one order of places) | E-A2-1, E-E1-1, E-E1-2 |
| D-171 | E1's correction; A4; X12 as one terminology reconciliation | E-E1-1, E-A4-1 (X12: **BLOCKED:** Dr Gladys and the owner, K2) |
| D-172 | standing directive: One PINTAR, One Experience | none of its own: carried by D-173's obligations |
| D-173 | the 21 canonical patterns; A5; the consistency record | E-K1, E-K2, E-K3, E-K4, E-K7, E-K8, E-K9, E-P15, E-P17, E-K-ALL, E-A5-1 |
| D-174 | B2: «Nomor Registrasi Sekolah» | E-B2-1 |
| D-175 | «PINTAR ID»; B2 accepted; D4 stage 1 | E-B2-1 (D4: none, it is Daisy's published page) |
| D-176 | O3 (the threshold of five); A3 | E-A3-1, E-A3-2 |
| D-177 | execution directive | none: a way of working |
| D-178 | the retrospective accepted; one coordinated pass | none of its own: `R-PROSES-01`; the pass, `docs/completion-4.0/retrospektif/03-LINTASAN-KEPUTUSAN.md` |
| D-179 | the pass's adjustments: verification rule, K6 as a security decision, deferral is not acceptance, K3 reconciled first, reverse reconciliation | none of its own: `R-PROSES-01` (this table); the pass's K6 and exit rules |
| D-180 | approved means implemented and verified: the four fields of every obligation; reconcile on acceptance; the register checked at each milestone; no GREEN with an unimplemented or unverified obligation | none of its own: `R-PROSES-01` (the four fields, both directions, in every CI run); this register's rule (its head) |
| D-181 | finite closure: the bounded scope (the 138 lines, E-RB-1…10, K1–K7, the release gates); no further audit cycle | none of its own: closes E-RB-1…E-RB-10 within the bounded scope (`docs/completion-4.0/retrospektif/04-REKONSILIASI-BALIK.md`) |
| D-182 | K6 interim: Singapore for development and testing; production residency deferred pending legal review; synthetic data only; exposed questions never reused | E-K6-1, E-K6-2 |
| D-183 | F-4(f): the exposure flag, in principle, with three conditions; deployment only through the protected gates | E-K6-3, E-K6-4, E-K6-2 |
