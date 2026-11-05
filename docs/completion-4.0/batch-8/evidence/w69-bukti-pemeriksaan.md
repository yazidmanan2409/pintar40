# W6.9 · The release checklist v2.8: evidence as each check closes (from 5 Nov 2026)

The checklist's source is `docs/coordination/checklist/checklist_data.py` (rendered by `render_md.py` and
`render_docx.mjs`). v2.7 (6 Oct) is pinned to the walkthrough specimen `12b480b`. v2.8 is rendered from the rows
below **once the staging rows of record exist** (after P-1): a row proven only locally is not marked PASS on the
checklist.

Each check names where it was run. The levels are kept apart:
- **local:** one machine, the stack beside the app;
- **CI:** GitHub's runners, a fresh stack per run;
- **staging:** the candidate promoted;
- **human:** a person's own walk.

| Check | Row(s) | Level | Result | Evidence |
|---|---|---|---|---|
| **W6.4** the crawl: overflow and clipping at 320 / 640 / 1024 / 1280 px, axe, titles, skip link, keyboard focus | X.6 (U-DEVICE), L-a11y | local, `715f6f7d` + the fix below | **GREEN**: 14 personas, 55 distinct screens, 0 broken; 0 axe violations (WCAG 2.0–2.2 A and AA); every screen has a title and a skip link; no invisible or stuck focus; 0 overflow and 0 clipping at every width | §1 |
| W6.4 | the same | CI journeys 42007065865 on `715f6f7d` | **GREEN** (before the fix: the runner's fonts kept the one overflow below the 1 px threshold) | the run |
| **W6.2** first screen per role ≤ 3 s | U-PERF, X.10 | local pre-check | **GREEN**: worst of three at most 488 ms on 15 first screens across 6 roles | §2 |
| W6.2 | U-PERF | staging | **PENDING P-1**: `perf-staging.yml` `journey` and `probe` on the promoted candidate | — |
| **W6.8** the 50-student test through the real app | CAP-02 at 50, STU-* | staging | **PENDING P-1**: `perf-l1.yml` `mode=browser` writes synthetic sittings on staging; today it would measure Batch 5 | — |
| **W6.12** 200 % zoom, keyboard, contrast | L-a11y | local | **GREEN** at 640 px (1280 at 200 %) and the keyboard walk (§1); colour vision §3 | §1, §3 |
| W6.12 NVDA (Windows) and TalkBack (Android) | L-a11y | human, devices | **NEEDS DEVICES**: this environment has neither; see §4 | — |

## 1 · W6.4: the crawl (local, 5 Nov)

**Defect found and fixed:** at 320 px the Studio package page (`/studio/paket/[course]`, the question review) was
322 px wide, for the admin, the head of department and the teacher of the learning-cycle school.
- **Cause:** a misconception code in an option's reason («MK-PEC-02-61105101820076», `.pin-kode`, `nowrap`, 205 px)
  inside a 125 px column, plus the option body's grid (`.pin-opsi-isi`) with an implicit `auto` column that grew to
  fit it.
- **Fix (`src/app/experience.css`):**
  - `.pin-opsi-isi` has one `minmax(0, 1fr)` column;
  - inside `.pin-opsi-alasan` only, the code may break **at its hyphens** («MK-PEC-02-» / «61105101820076»), never
    inside a segment.
  - `.pin-kode` stays `nowrap` everywhere else, as STUDIO3B requires for competency codes.
- **Result:** both pages measure 320 px; the re-run is green.

**Harness corrected:** the keyboard walk read the skip link «Langsung ke isi» as off screen on every page. It slides in
on focus and the walk read it on the first frame: top −60 px at once, 12 px after 400 ms; with reduced motion, 12 px at
once. The walk now runs with reduced motion (`audit/a11y.mjs`), so «off screen» means off screen. **Not a product
defect:** the link is visible when focused.

## 2 · W6.2: first screens (local pre-check, 5 Nov)

`audit/perf/layar-pertama.mjs` (new; read-only GETs; refuses production):
- signs each persona in;
- answers «Komputer siapa ini?» and chooses the role's door;
- opens each first screen three times, recording TTFB, DOMContentLoaded, load and the largest contentful paint;
- a page passes when its worst LCP is ≤ 3,000 ms.

It now runs in CI's journeys after the crawl, as a regression gate.

| Role | First screens | Worst |
|---|---|---|
| Admin platform | /konfigurasi, /konfigurasi/system, /konfigurasi/audit, /aktivasi | 480 ms |
| Admin sekolah | /konfigurasi, /konfigurasi/roles, /konfigurasi/transfers, /pendataan, /aktivasi | 488 ms |
| Dekan | /pimpinan | 440 ms |
| Kepala departemen | /pimpinan, /studio | 464 ms |
| Guru | /mengajar, /studio | 464 ms |
| Murid | /belajar | 448 ms |

**What this does not prove:** staging's network, Vercel's cold starts and Supabase's compute tier. The U-PERF row stays
on its staging evidence until the promoted candidate is measured.

## 3 · W6.12: colour vision (local, 5 Nov)

Method: Chromium's vision-deficiency emulation (deuteranopia, protanopia, achromatopsia) on the first screens of the
three roles whose screens carry state:
- the head of department's /pimpinan;
- the teacher's /mengajar;
- the learner's /belajar.

Every state is said in words or by shape, never by colour alone:
- «Berjalan» badges;
- «Belum ada angka»;
- the learning-path steps named under each dot, with the current step shown by weight and a ring;
- the tour's step count «1 / 7» beside its dots.

Contrast is held by axe on every screen (§1, 0 violations). **Not covered here:** the result and report screens with
figures, which the seed's first screens do not reach. They are looked at under the same emulation in the staging walk
of W6.5 and W6.7.

## 4 · W6.12: screen readers, the input needed

NVDA on Windows and TalkBack on Android need a person with those devices; this environment is Linux in a container.
The script for that walk is the crawl's persona list:
- sign in;
- the door;
- each role's first screen;
- one form;
- one refusal;
- the learner's Uji Penguasaan from start to «Kumpulkan».

For each, record whether every control is announced by its name and role, and whether headings and the skip link
work.

**Blocks:** only W6.12's screen-reader line. Everything else continues.
