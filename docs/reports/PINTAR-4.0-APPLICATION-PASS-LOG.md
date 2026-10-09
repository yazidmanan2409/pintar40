# PINTAR 4.0 · Application pass log

**Authority:** D-138 (9 Oct). **Design source:** `ux-1/daisy-experience`, `docs/coordination/ux/sistem-desain/project/`, verified freeze c42fecb (D-136(b)). **Map:** `08-migration.md`. **Order:** `07-proposal.md`, «The application pass».

This log is the evidence record D-138(d) asks for. A step is **done** only when its screens are applied on the running staging application, its checks have passed, and an independent review has looked at it. CI GREEN alone is not done.

## Baseline (before any change)

| Check | Run | Result |
|---|---|---|
| CI on 894ae01 | 37876327609 | 18/18 |
| Journeys on 894ae01 | 37876329363 | crawl GREEN; 76 PASS, 0 FAIL |
| Staging = main | facts 37878894218 | 894ae01, 177 migrations |
| Golden School walk on 894ae01, school `sekolah-uji-baseline-894` | GS-02/03 37879198761; GS-04..11 37879701505; student step 37881020645; reports step 37884383500 | all four green: the baseline is clean |

## CI allowance (D-139)

1,000 additional minutes, counted from 2026-10-09T06:00:33Z with the ledger estimate (`audit/ci/actions-spend.mjs`). The coordinator stops and reports before a run would exceed it.

| Gate | Contents | Runs | Estimate | Running total |
|---|---|---|---|---|
| A | steps 1–3 | | | 0 |

**Evidence classes used below:** local PASS (this container), CI PASS (GitHub Actions on the commit), staging PASS (the running staging application), human acceptance (a person, recorded by name). They are never merged.

## Steps

| # | Step | State | Screens | Evidence |
|---|---|---|---|---|
| 1 | Tokens (v3 in `globals.css`, v2 names as aliases) | built and verified locally (643eb9e); not on staging | every page: the v2 type sizes now resolve to v3 (13 → 14, 17 and 20 → 18, 24 → 22), except the frozen certificate, which keeps every size (fixed in ce1ba94 after review) | See «Step 1» below |
| 2 | Primitives (Button, fields, segmented control, tabs, badges, result line, alert) + target-size guard | built (26a288b; fixes 3ded8bd, ce1ba94, 95b1209); review AMBER, findings addressed; verified locally on 95b1209; not on staging | every page with a button, field, select, segmented control, view tabs, the language switch, the question navigator, a result line | See «Step 2» below |
| 3 | Shells (staff left navigation, learner top bar) | built (9fc1ca5, tests restated in the step 4–5 commit); local verification in «Steps 3–5» below; not on staging | every staff page (Mengajar, Pimpinan, Pendataan, Aktivasi, Konfigurasi and its sub-pages, Studio, an educator's own learning) | See «Steps 3–5» |
| 4a | Surfaces: learner (Belajar, lesson, assessments, result, certificates) | PARTIAL: the v3 components their screens use (Alert with icon on result, continue and certificate banners; result line; type ladder) | as named | See «Steps 3–5» |
| 4b | Surfaces: teacher (Mengajar) | PARTIAL: Disclosure chevron on the class evidence, pending dot, type ladder | as named | |
| 4c | Surfaces: Pimpinan | PARTIAL: Disclosure chevron, the decision card's waiting state in words, the assessed-population heading over the readiness bands (CR-81), type ladder | as named | |
| 4d | Surfaces: Konfigurasi | PARTIAL: Jejak audit in words (DG-11), transfers by named selects (CR-41, partial), report templates by title, «sintetis» only for the platform, data table sticky head and stripes | as named | |
| 4e | Surfaces: Pendataan, Aktivasi | PARTIAL: the shell, the back links (F18), the data table | as named | |
| 4f | Surfaces: Studio | PARTIAL: Aturan Asesmen labelled and in words (DG-28, DG-29), integrity «Tindak lanjut», Terbitkan's own busy word | as named | |
| 5 | Copy (the copy owed, `11-validation.md` §4; Terminology v1 under D-134 and D-138(c)) | built: the §4 rows owed (CR-50, CR-13, CR-76, CR-81, and the four single keys) and the approved v1 change set in the copy table; OPEN items listed below | every page | See «Steps 3–5» |

"PARTIAL" means the step's components are applied where their screens use them, and the pass did not redraw those screens' composition. Nothing in 08-migration.md asks for a recomposition (it is a component map); what is not applied is listed under «Deviations and open items».

## Step 1 · Tokens (643eb9e)

- **What changed:** every token in `tokens.json` at c42fecb is declared in `src/app/globals.css` with the same value. The block is generated from the file. A copy is vendored at `selftest/fixtures/design-tokens-v3.json`, pinned by sha256. Each v2 name `08-migration.md` keeps now points at its v3 token by `var()`. The focus ring is drawn with `--focus-ring`.
- **Tests:**
  - UX1-V3-TOKENS-01 (new);
  - UX1-S0-TOKEN-01 now expects version 3;
  - UX1-S0-CONTRAST-01 adds the v3 pairs, including `line-control` at 3:1 on every surface.
- **Can fail (shown):**
  - the old `globals.css`: all three red;
  - `control-md` 40 px: TOKENS-01 red;
  - `--type-fine` back to 13px: TOKENS-01 red;
  - a faint `line-control`: TOKENS-01 and CONTRAST-01 red;
  - a misspelt `var(--measure-raed)`: TOKENS-01 red.
- **Local suite:** 654 passed, 0 failed, 1 justified local skip.
- **Crawl (job A replica):** 389 pages over 14 personas; 0 broken; 0 wider than 320 px; 0 over 3 s. This matches the baseline crawl (389, 0, 0). The crawl keeps a 1280 px screenshot of every page. It measures every page at 320 px, but saves a 320 px screenshot only when a page fails, so there is no 320 px picture set yet (see AP-3).
- **Journeys:** run together with step 2 (below), not separately.
- **Not yet:** CI, staging, independent review.

## Step 2 · Primitives (26a288b)

- **What changed** (08-migration.md, Actions / Fields / Navigation / Feedback / Data):
  - Button at 44 px, with v3 hover, pressed, disabled, busy and completed states. The destructive confirm uses its hover and pressed tokens.
  - Fields and the named selects (`.pin-input`, `.pin-picker`, `.pin-lselect`, `.pin-kp-form`, `.pin-data-peta`, `.pin-ung-isian`) at 44 px or more with the 3:1 outline. Not done: the select chevron icon (step 4).
  - The segmented control and the language switch at 44 px.
  - The view switch drawn as Tabs.
  - Back links and the close controls at 44 px.
  - The health card's attention badge in attention colours.
  - Result lines: ✓ on success; `role="alert"` on failure.
  - TombolKirim:
    - explains a wait over 3 s;
    - can show a server-confirmed result word. No page passes one yet; that comes with step 5.
- **Tests:**
  - UX1-V3-TARGET-01 (the 44 px guard; new);
  - UX1-V3-FEEDBACK-01 (rendered feedback; new);
  - restated to the ruled design: UX1-S3-FAKTA-01, DAISY-17-KIRIM-01, and two role assertions.
- **Can fail (shown):**
  - TARGET-01 on today's stylesheet: red, naming the 40 px button and field, the 34 px navigator, the 32 px question-bar button, and no 44 px floor on the language switch, selects, segments, tabs or close controls;
  - TARGET-01 with a planted `calc()`: red;
  - FEEDBACK-01 on today's components: red on five counts.
- **Local suite (26a288b):** 656 passed, 0 failed, 1 justified local skip.
- **Journeys (job B replica, 26a288b, steps 1 and 2 together):** 75 PASS. BD11 is BLOCKED locally because Firefox and WebKit are not in the container; it runs only in CI. The baseline CI run had 76 PASS with BD11 passing.
- **Crawl (job A replica):**
  - On 26a288b: **RED**. Three lesson pages were 339 px wide at 320 px (AP-2).
  - On 3ded8bd (the fix): GREEN. 389 pages, 0 broken, 0 wider than 320 px, 0 over 3 s.
- **Seen (1280 px, lesson page, before and after):** buttons at 44 px with 16 px labels; the disabled «Halaman sebelumnya» on surface-2 instead of faded; the language switch as a segmented control; the speed select at 44 px with the stronger outline; the section heading at t-subsection 18.
- **Independent review (9 Oct, read-only):** verdict **AMBER**.
  - One BLOCKING finding: step 1 had moved the frozen certificate's course line from 20 to 18 px. Fixed in ce1ba94: the certificate has its own token, and UX1-V3-TOKENS-01 now resolves every frozen certificate size (red on the old token).
  - Notes addressed in ce1ba94 and 95b1209:
    - three selects still in the v2 look;
    - the form gap;
    - the `.pin-inp` focus token;
    - the question bar as Button, small (36 px seen, 44 px hit area; TARGET-01 red without the hit area);
    - a completed button now outranks hover;
    - a disabled destructive button keeps the disabled look on hover;
    - a completed button does not resend the unchanged form;
    - the wait line's live region is present from the start;
    - `.pin-kembali` at t-body 16, the 08 row that names it (08 also says t-small for back links in general).
  - Notes carried as known limits, not fixed here:
    - TARGET-01 does not see the header tabs (step 3), inline or Tailwind heights (steps 4d–4f), or selects outside the named rules. Its manifest text now says so.
    - FEEDBACK-01 renders on the server, so it does not render the busy state, the wait line or the return to the verb. The 3-second timer is checked in the source only.
    - Not applied in step 2, and now not claimed: Alert (`.pin-banner`, `.pin-perhatian`), Badge shape, the written reason beside a disabled button, 44 px Radio/Checkbox rows, the select chevron. These go to step 4 with their screens.
  - Evidence correction: the suite (656) and the journeys (75 PASS) ran on 26a288b. Only the crawl ran on 3ded8bd.
- **Re-verification on 95b1209** (run at d732855, which adds only the log):
  - suite 656 passed, 0 failed;
  - crawl GREEN: 389 pages, 0 broken, 0 wider than 320 px;
  - journeys 75 PASS, BD11 BLOCKED locally (no Firefox or WebKit).
- **320 px screenshots:** all 389 pages captured on 3ded8bd and kept (AP-3). One observation goes to step 3: at 320 px the staff header stacks into five rows (place, language switch, «Laporkan masalah», identity, tabs). That header is what the shell step replaces.
- **Not yet:** CI, staging.

## Independent review of the application on 8851988 (9 Oct, after staging deploy)

**What was reviewed:** an independent read-only reviewer looked at the full screenshot set of the application code staging runs. The set covers 389 pages for 14 personas at 1280 and 320 px, from the crawl of f5ce56f, whose `src` is identical to 8851988. It was checked against the frozen design (08-migration.md) and D-140(c).

**Limits.** The review is of screenshots of identical code, not of the live staging site, which this container cannot reach (organisation network policy); the staging behaviour evidence is the Golden School walk. Not seen:
- an assessment in progress, a result page, an issued certificate, the Pendataan upload preview, Antrean Tinjauan with items, Integritas with items;
- the 1024–1279 px range;
- the Mengajar and Belajar landings beneath the first-run tour.

**Confirmed by the reviewer:** AP-5 fixed; AP-6 fixed; DG-11 (Jejak audit in words) fixed; AP-1/OP-3 still open; OP-9 as described.

**All findings are OPEN.** None is fixed in 8851988.

| # | Severity | Finding (as seen) | Where |
|---|---|---|---|
| RV-1 | BLOCKER (D-140(c)) | «Laporkan masalah» prints the raw page path with ids: «Halaman: /pimpinan/0ad39ff1-…» (also /mengajar/…/murid/<uuid>, /studio/paket/<uuid>). Confirmed in code: `src/app/lapor/page.tsx:52` | every persona's lapor page |
| RV-2 | BLOCKER (D-140(c)), Admin platform only | Keamanan akun's «Catatan keamanan terbaru» shows a raw event code «identity.device_declared», an unlabelled id, and a date with no year or WIB | sysadmin /konfigurasi/keamanan |
| RV-3 | MAJOR | The staff navigation reorders itself, putting the current place first; on Konfigurasi sub-pages (email uji, keamanan, akun) it shrinks and marks nothing current | sysadmin, alpha-admin |
| RV-4 | MAJOR | The phone top bar names the wrong place: «Pendataan» on Konfigurasi sub-pages and Akun saya (sysadmin has no Pendataan) | 320 px, sysadmin, alpha-admin |
| RV-5 | MAJOR | File inputs are browser defaults in English: «Choose File / No file chosen» | Studio unggah; every lapor page |
| RV-6 | MAJOR | Templat laporan: 16 unlabelled «—» selects; «Kenaikan» and «Peserta» twice; developer label «Kunci judul»; defaults disagree | Konfigurasi, school admin |
| RV-7 | MAJOR | Dead end: «Mulai Pemetaan Awal» offered where none exists, leading to a refusal page without the shell | boot-siswa (CI/dev bootstrap school) |
| RV-8 | MAJOR | Lesson audio shows «0:00 / 0:00» (the .mp3 is 404) with no message; may be a missing seed asset | siklus-siswa lesson; Studio pratinjau |
| RV-9 | MAJOR | Class summary repeats «Peserta» and «Kenaikan» with different thresholds; «(0/5)»/«(0/10)» unexplained; metric cards touch | alpha-dean Pimpinan |
| RV-10 | MAJOR | Contradiction: «Siap — Paket ini siap diterbitkan» above «Terbit sejak 9 Oktober 2026»; Studio home «Belum ada paket di sini» above a listed package | siklus-admin Studio |
| RV-11 | MAJOR | Report pages (Ringkasan Kelas / Sekolah) have no app shell and do not name the class, school or period; at 320 «Masuk se…» is cut | alpha-dean |
| RV-12 | MAJOR | At 320: the Jejak audit table is clipped at the right with no scroll cue; the «Alasan» input in Peran & akses runs past its panel | Konfigurasi |
| RV-13 | MAJOR (design) | Studio's sub-navigation is plain 14 px links, not Tabs (no current mark, under 44 px); Studio's column is wider and left-set | every Studio page |
| RV-14 | MAJOR (D-140) | Aturan Asesmen: numeric fields with no hint; limits in seconds; native 13 px checkboxes | Studio definisi |
| RV-15 | MAJOR | Technical language for the platform admin: «Lingkungan development», «20 pemeriksaan skema…», the seed name «PINTAR Bootstrap (OFFICIAL evidence — development and CI only)» (relates to OP-5) | sysadmin |
| RV-16 | MAJOR (design) | Date fields are native «mm/dd/yyyy» with no echo in words; ISO dates in text; no WIB on audit times | Konfigurasi |
| RV-17 | MAJOR (design) | Konfigurasi uses only secondary buttons: «Hentikan PINTAR sekarang» is not destructive; the main actions are not primary | Konfigurasi |
| RV-18 | MINOR | Perpindahan murid still labelled «Kode sekolah tujuan…» (relates to OP-4) | Konfigurasi |
| RV-19 | MINOR | Tour: focus box on its heading looks like a field; ring hugs its target; at 320 the sheet covers the target | Mengajar, Belajar |
| RV-20 | MINOR | «Berjalan» / «Tersedia» badges missing at 320 | Mengajar class |
| RV-21 | MINOR | Layout: touching cards; jammed hint text; doubled «Bagian bacaan Bagian 1»; native ▶ markers in Studio | various |
| RV-22 | MINOR | Pendataan field and button widths differ, hint far from its field, uppercase label; Aktivasi prints the request host (check on staging) | Pendataan, Aktivasi |
| RV-23 | MINOR | At 320 the Urutan select is cut; a competency code wraps | Studio |
| RV-24 | MINOR | Empty «Lingkungan —» tile; «PINTAR» eyebrow; index «Inteligensi & Laporan» leads to «Templat laporan»; an all-«—» «Versi» column; unstriped rows | Konfigurasi |

**Consequence for the application pass.** The surfaces (steps 4a–4f) stay PARTIAL, not done. Studio and Konfigurasi are the least migrated.


## Fix batch A (9 Oct, D-140; approved by Yazid: «Do A as per your recommendation»)

**Commits:** 44cebee (the fixes and guard D140-SAJI-01), 42990bd (the guard's manifest text, F06-S04), b117a72 (journey S23l restated for RV-1). Branch only; main and staging are still 8851988.

**Closed in code, verified locally (crawl of the fresh build, 389 pages over 14 personas, 0 broken, 0 wider than 320 px, 0 over 3 s; screenshots reviewed):**

| # | What the screen now does | Seen |
|---|---|---|
| RV-1 | «Laporkan masalah» and «Laporan saya» name the page in words («Halaman: Konfigurasi»), never a path or an id; the path is still stored for engineering | sysadmin lapor 1280; S23l «Halaman: Mengajar» |
| RV-2 | Keamanan akun's record reads «Jenis komputer dicatat · 9 Okt 2026, 19.08 WIB · PINTAR ID …» | sysadmin keamanan 320 |
| RV-3 | the staff navigation keeps Daisy's order (Konfigurasi, Pendataan, Aktivasi akun, Studio) and marks the page you are on | siklus-admin Studio, Akun, Aktivasi 1280 |
| RV-4 | the phone bar names Keamanan akun, Email uji, Akun saya and Laporkan masalah | sysadmin keamanan 320 |
| RV-6 | report template: each metric's scope named, «Tidak dipakai», the title chosen from the list | siklus-admin Konfigurasi 1280 |
| RV-12 | fields and the audit table stay inside 320 px | crawl width check 0 |
| RV-13 | Studio's sub-navigation is tabs with the current one marked | siklus-admin Studio 1280 |
| RV-17 | Konfigurasi's main actions are primary; the emergency stop is destructive | siklus-admin Konfigurasi 1280 |
| RV-5 | PARTIAL: the file control is drawn as a Button; its words («Choose File / No file chosen») are the browser's own and follow the browser's language. Not changeable without replacing the native control | sysadmin lapor 1280 |

**Evidence so far:** CI 37917925527 (44cebee): 657 passed, 1 failed (F06-S04, fixed in 42990bd); the red-case job's first attempt died at stack start (port 54322 in use, no test ran) and passed on its one re-run. Local journeys (42990bd): 74 PASS, S23l FAIL on its stale check (restated in b117a72), BD11 BLOCKED locally (no Firefox or WebKit). Final CI and journeys on b117a72: see «Verification of the final commit». Not on staging yet.

**Correction (9 Oct):** an earlier status from the coordinator called S23q / CR-52 an open governed exception. That was wrong: it repeated the 8 Oct handoff text, which predates D-137. CR-52 was closed by the known-issues batch (4693d4d; main 894ae01; journeys 37876329363, 76 PASS, 0 FAIL; D-137). S23q has passed in every journey run since, including the local run on 42990bd. A second correction: a local suite result of «656 passed» reported for batch A was a stale file from 08:06; that run had not started (the local Docker daemon had stopped). The suite evidence for batch A is CI's.

## Walkthrough readiness classification (9 Oct, on b117a72)

**The rule applied.** Dr Gladys walks as «Admin sekolah» of Sekolah Demo PINTAR, journeys 1–9 of her guide (`docs/onboarding/PINTAR-Panduan-Walkthrough-Sekolah-Demo.md`). A finding is **WALKTHROUGH BLOCKING** when she would meet it on that path and it is either an engineering problem left for her (D-140(c): raw ids, JSON, internal enums, technical language, unusable selectors), a break or dead end that stops her, or a screen that contradicts itself, so that her reading of it would record our defect rather than her experience. Everything else is **NON-BLOCKING**: it stays OPEN with its reason, and is not closed by this classification.

| # | Classification | Evidence and rationale |
|---|---|---|
| RV-10 | **BLOCKING** | Journey 4 («Lihat bab itu … bagaimana bab itu sampai ke murid»). Studio's home says «Belum ada paket di sini.» above a listed package (`src/app/studio/page.tsx:32`: the empty-task line reuses the empty-package sentence); a published package's page reads «Siap · Paket ini siap diterbitkan» above «Terbit sejak 9 Oktober 2026» (`src/app/studio/paket/[course]/page.tsx:227-230`). Seen in the crawl of the fresh build (siklus-admin Studio and Pecahan). She would be told a published chapter is not yet published. Not fixed in batch A. |
| RV-11 | NON-BLOCKING, OPEN | Journey 3. Ringkasan Kelas / Sekolah have no app shell and do not name the class, school or period (`src/app/edukator/ringkasan/page.tsx`). She reaches it from a link naming Kelas 5A, and «Kembali» returns; nothing on it is engineering language. A real gap for a report that may be printed. |
| RV-16 | NON-BLOCKING, OPEN | Journey 2. Konfigurasi prints a period as «2026-07-01 – 2027-06-30»; the date inputs are native (their format follows the browser). Legible, not an id or enum; a design gap (Daisy: dates in words). |
| RV-9 | NON-BLOCKING for her role, OPEN | Seen on Pimpinan (dean). She is Admin sekolah and reads reports under Konfigurasi (ruled behaviour, observer sheet). «(0/5)» appears only when evidence is short; Kelas 5A has five assessed. Still a defect for deans and heads of department. |
| RV-7 | NON-BLOCKING, OPEN | Only on the CI/development bootstrap school, whose chapter has no Pemetaan Awal. Sekolah Demo's chapter has one (the Golden School student step walks it: run 37918037282). The offer without a Pemetaan Awal is still a defect. |
| RV-8 | NON-BLOCKING, OPEN | Seen on a seeded lesson with an audio file missing. Lessons in this stage are text only (D-050; observer sheet). Not verified against Sekolah Demo's lessons on staging. |
| RV-14 | NON-BLOCKING, OPEN | Studio Aturan Asesmen: not on her guide's journeys; labelled, no codes; limits in seconds. |
| RV-15 | NON-BLOCKING, OPEN | Platform administrator only. |
| RV-18 | NON-BLOCKING, OPEN | Transfers are not on her journeys; the typed destination school is OP-4 (an authorization decision). |
| RV-19 – RV-21, RV-23, RV-24 | NON-BLOCKING, OPEN (MINOR) | Tour focus details, 320 px badges, touching cards, native markers, a cut select, an empty tile and an all-«—» column: visual, none engineering language. |
| RV-22 | NON-BLOCKING, OPEN (MINOR) | Pendataan widths and the uppercase label stay. The «request host» on Aktivasi is the real address on staging (staging.pintarselalu.com/aktifkan); locally it reads 127.0.0.1:3999. |
| RV-5 | NON-BLOCKING, PARTIAL | As above. |
| OP-1, OP-2 | NON-BLOCKING, OPEN (deviations) | The navigation works at every width (crawl, 320 and 1280 px). |
| OP-3 / AP-1 | NON-BLOCKING, BLOCKED | Font licence (CR-56); today's logo. |
| OP-4 | NON-BLOCKING, PARTIAL | Not on her journeys; an authorization decision. |
| OP-5 | NON-BLOCKING, OPEN | Pre-v1 wording held in migrations and seeds; legible Indonesian; needs migrations of its own (D-068(f)). She may comment on it. |
| OP-6, OP-7 | NON-BLOCKING, OPEN for her | Kept for her terminology decision (D-140(c)); never invented. |
| OP-8, OP-9 | DECIDED, recorded | As above. |

## Deviations and open items (D-140(a): what cannot be closed stays open, with its reason)

| # | Item | State | Reason and evidence |
|---|---|---|---|
| OP-1 | AppShell's icon rail at 1024–1279 px, and the reader collapsing into it | OPEN (deviation) | Step 3 draws the full 248 px navigation from 1024 px up and the top bar with its menu below. The rail needs a collapse control and its own tooltip behaviour that no PINTAR screen has yet; drawing it without them would hide the words. The navigation works at every width (crawl, 320 and 1280 px). |
| OP-2 | Navigation group labels (AppShell draws places in labelled groups) | OPEN (deviation) | Since L3 a shell shows one working context's places only, so there is one group; a label over a single group says nothing. Recorded rather than drawn. |
| OP-3 | The canonical wordmark's outlined master (AP-1) | BLOCKED | Waits on the font licence check (CR-56), outside engineering. Today's logo stays. |
| OP-4 | CR-41, transfers chosen from named lists | PARTIAL | The form now offers named selects for the institutions, periods and programmes the reader may read. A school administrator cannot see other schools, so the destination school of an outgoing transfer cannot be offered by name to them. Offering it would need a cross-school directory, which is an authorization decision (D-010, L3), not a UI one. Not invented. |
| OP-5 | Terminology v1 rows whose text lives in migrations or seeds: C29, C30 (Studio findings), D23 (a finding's location), C31 and B15/B16 (seed labels and names) | OPEN | D-068(f): strings held in migrations or seeds need a migration of their own. A copy pass does not rewrite database functions. The screens show these strings as the database returns them. |
| OP-6 | «penilaian» strings added to the copy table after the v1 inventory (29 Sep) | OPEN | v1's change set names rows by the inventory; strings written after it have no row. Where «penilaian» means the assessment object, D-068 ruling 4 suggests «asesmen», but applying it to an unlisted string is a terminology decision. Kept for Dr Gladys's review. |
| OP-7 | The bank's empirical-difficulty wording (Studio, Bank soal) | OPEN, for Dr Gladys | An educational-measurement term with no v1 entry. Not invented (D-140(c)). |
| OP-8 | The tour veil | DECIDED here, recorded | Two approved instruments disagree. Sauron's ruling (§O-2) made the veil a primary-soft composite. The frozen design (08-migration.md, Containers; Yazid's question 5, 5 Oct) gives the tour Dialog's layer tokens: `scrim`, `radius-lg`, `shadow-dialog`, "the spotlight stays". The later, specific, frozen instruction is applied (D-138(c): the design is the authority). UX1-TUR-TUNTUN-01 restated, with the old composite shown red. The guidance ground and the ring are unchanged. |
| OP-9 | Staff bar under 1024 px: the reader's name and «Akun saya» move into the menu | DECIDED here, recorded | AppShell's top bar keeps «Keluar» visible at every width (D-009). The name and «Akun saya» show when the menu opens. DAISY-02-KELUAR-01 restated: nothing may hide the strip or its way out, and only these two parts may be hidden, only on the staff bar, only where the opened menu shows them again (a planted `.pin-sesi { display: none }` is red). |

## Unresolved defects

| # | Defect | Found | State |
|---|---|---|---|
| AP-2 | Step 2: «Tampilkan langkah berikutnya» (t-body 16, nowrap) was 307 px in a 288 px column, so 3 lesson pages scrolled sideways at 320 px | 9 Oct, local crawl on 26a288b | Fixed in 3ded8bd (any `.pin-btn` may fold below 560 px; the 44 px floor stays); crawl GREEN on the fix |
| AP-3 | No 320 px screenshot set: the crawl saved one only when a page failed | 9 Oct | Fixed in 5559111 (every page); the first full set is being captured |
| AP-4 | Step 1 moved the frozen certificate's course line 20 → 18 (review, BLOCKING) | 9 Oct, review | Fixed in ce1ba94; guarded by UX1-V3-TOKENS-01 |
| AP-5 | Step 3: from 1024 px the fixed staff navigation sat a gutter off the screen's left edge, its mark, places, «Laporkan masalah», the language switch, the reader and «Keluar» cut. `globals.css` pulls every `.pin-shell` outward (the old full-bleed header) and the navigation's `margin: 0` lost the cascade. The crawl's width check did not see it: nothing was wider than the page. | 9 Oct, my review of the 1280 px screenshots | Fixed (`.pin-shell.pin-staf`); guarded in DAISY-02-KELUAR-01, red on the old selector |
| AP-6 | Studio and Konfigurasi forms (and one Evaluasi button) were drawn from Tailwind strings: about 30 px fields and selects, and a grey full-width «Simpan» that read as disabled. TARGET-01's known limit (it read only `experience.css`) | 9 Oct, my review of the 1280 px screenshots | Fixed: the shared `field` and `button` strings are the v3 Field and Button; TARGET-01 now also reads them and refuses a Tailwind padding-only control anywhere in `src` (red on the old strings) |
| AP-7 | Instruments, not the product: (a) F22-A02 read Konfigurasi's grant form from raw HTML, and React had streamed the form's fields out of order (hidden `S:` segments moved in by inline `$RS`/`$RC` scripts), so the form looked empty and the cross-school refusal never ran; the page a browser assembles was whole. (b) Four journeys (S23, S23r, S23t, S23j) and the Golden School report walk still named words this batch changed on purpose (Terminology v1, the copy owed, Jejak audit in words, the title chosen from a list). | 9 Oct, local suite and journeys on f5ce56f | (a) every reader of a rendered form now assembles the page first (`tersusun`, `selftest/konteks-uji.ts`); F22-A02 passes with its refusal checked. (b) Restated to the approved words; S23j now also fails if any code, table name or id appears on «Jejak audit» |
| AP-1 | Step 3 (shells): the canonical wordmark's outlined master does not exist yet; it waits on the font licence check (CR-56, outside engineering). | 9 Oct | Step 3 keeps today's logo until the master arrives, and records the gap |

## Developer-owned usability items (D-138(c))

Carried from the L4 list (raw codes, JSON, unclear selectors, missing labels) and resolved in the step that touches their screen: Aturan Asesmen (shuffle choices, limits line, placeholder-only inputs), Jejak audit (action codes, tables), report templates (keys as titles), transfers (typed codes, CR-41), the integrity review's next action.
