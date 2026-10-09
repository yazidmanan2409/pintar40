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

## Steps

| # | Step | State | Screens | Evidence |
|---|---|---|---|---|
| 1 | Tokens (v3 in `globals.css`, v2 names as aliases) | built and verified locally (643eb9e); not on staging | every page: the v2 type sizes now resolve to v3 (13 → 14, 17 and 20 → 18, 24 → 22), except the frozen certificate, which keeps every size (fixed in ce1ba94 after review) | See «Step 1» below |
| 2 | Primitives (Button, fields, segmented control, tabs, badges, result line, alert) + target-size guard | built (26a288b; fixes 3ded8bd, ce1ba94, 95b1209); review AMBER, findings addressed; verified locally on 95b1209; not on staging | every page with a button, field, select, segmented control, view tabs, the language switch, the question navigator, a result line | See «Step 2» below |
| 3 | Shells (staff left navigation, learner top bar) | not started | | |
| 4a | Surfaces: learner (Belajar, lesson, assessments, result, certificates) | not started | | |
| 4b | Surfaces: teacher (Mengajar) | not started | | |
| 4c | Surfaces: Pimpinan | not started | | |
| 4d | Surfaces: Konfigurasi | not started | | |
| 4e | Surfaces: Pendataan, Aktivasi | not started | | |
| 4f | Surfaces: Studio | not started | | |
| 5 | Copy (the copy owed, `11-validation.md` §4) | not started | | |

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

## Unresolved defects

| # | Defect | Found | State |
|---|---|---|---|
| AP-2 | Step 2: «Tampilkan langkah berikutnya» (t-body 16, nowrap) was 307 px in a 288 px column, so 3 lesson pages scrolled sideways at 320 px | 9 Oct, local crawl on 26a288b | Fixed in 3ded8bd (any `.pin-btn` may fold below 560 px; the 44 px floor stays); crawl GREEN on the fix |
| AP-3 | No 320 px screenshot set: the crawl saved one only when a page failed | 9 Oct | Fixed in 5559111 (every page); the first full set is being captured |
| AP-4 | Step 1 moved the frozen certificate's course line 20 → 18 (review, BLOCKING) | 9 Oct, review | Fixed in ce1ba94; guarded by UX1-V3-TOKENS-01 |
| AP-1 | Step 3 (shells): the canonical wordmark's outlined master does not exist yet; it waits on the font licence check (CR-56, outside engineering). | 9 Oct | Step 3 keeps today's logo until the master arrives, and records the gap |

## Developer-owned usability items (D-138(c))

Carried from the L4 list (raw codes, JSON, unclear selectors, missing labels) and resolved in the step that touches their screen: Aturan Asesmen (shuffle choices, limits line, placeholder-only inputs), Jejak audit (action codes, tables), report templates (keys as titles), transfers (typed codes, CR-41), the integrity review's next action.
