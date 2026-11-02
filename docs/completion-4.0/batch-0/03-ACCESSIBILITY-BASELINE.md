# Batch 0 · Deliverable 3 · Accessibility and responsive baseline (2 Nov 2026)

**Status: harness built and run. The baseline is RECORDED, not judged.**

No screen was changed: «Do not redesign application screens in Batch 0». These figures are the starting line that batches 2 and 7 are held to (E), and that Gate 2 requires to be clean (G §2).

## 1. The harness

**`audit/a11y.mjs`**, called by `audit/crawl.mjs` (job A of `audit-journeys.yml`), commits `20c198a` and the metric fix in this batch. It runs on each distinct screen (ids normalised) and on every persona's landing.

| Check | How |
|---|---|
| **axe** | axe-core **4.11.4** (pinned in `audit/package.json`), tags WCAG 2.0/2.1/2.2 A and AA |
| **Page title** | Missing, or only «PINTAR» (the same on every page) |
| **Skip link** | The first Tab stop is a same-page link whose target exists |
| **Keyboard walk** | Up to 40 Tab presses from the top. Records: stops reached; each stop's focus indicator (focused style differs from unfocused); focus stuck on one element; a page with no stop; focus off screen |
| **Overflow and clipping** | At **320, 640 (1280 at 200 % zoom), 1024 and 1280 px**: page wider than the window; text clipped by a box that hides overflow without an ellipsis |

- **It never changes the crawl's verdict.** `A11Y=0` switches it off; `A11Y=all` checks every page instead of each distinct screen.
- **Harness self-check (local):**
  - On a constructed good page it found the title, the skip link and visible focus.
  - On a constructed bad page it caught all of these:
    - the title;
    - the missing skip link;
    - 2 stops without a focus indicator;
    - axe `html-has-lang` and `label`;
    - a 908 px page at 320 px;
    - clipped text.
- **One metric was corrected after the first run.** «Focus lost to the page» counted the browser's normal end-of-page (focus on `<body>` after the last stop) as a defect, on 24 screens. It was a harness false positive and is removed. «Focus stuck» (the real trap) is kept: **0**.

## 2. Where and on what it ran

| | |
|---|---|
| Where | **Locally**: a replica of `audit-journeys.yml` job A (local Supabase stack, every migration, the synthetic seed, production build on port 3999) |
| Code | `0fb65bb` (application code identical to `main` = staging `001a357`; Batch 0 changed no application code) |
| Personas | 14 (sysadmin; demo school: admin, dean, head of department, guru, siswa; data school: admin, kaprodi, guru, siswa; bootstrap official school: admin, kaprodi, guru, siswa) |
| Pages | 389 visited by the crawl; **62 pages checked, 39 distinct screens** |
| Crawl verdict | **GREEN**: 0 broken pages for all 14 personas |
| Not covered | Public pages not linked from a signed-in landing (`/masuk*`, `/verifikasi`, `/aktifkan`) were not in the crawl; a spot check of `/masuk` is in §4. Screen readers, 200 % browser zoom (approximated by 640 px), colour vision and real devices are Batch 7 (W6.12) |

**This is a local, development-branch measurement on synthetic data. It is not a staging or Golden School verification.** The CI job (`audit-journeys.yml`, dispatched on the branch) records the same baseline in its step summary: see deliverable 2.

## 3. The baseline

| Check | Screens failing (of 39) | Note |
|---|---:|---|
| Page title missing or only «PINTAR» | **39** | Known (design reconciliation): only `layout.tsx` sets a title. W3.1, batch 2 |
| No skip link as the first Tab stop | **39** | Known: there is no skip link. W3.1, batch 2. The first stop is the nav toggle «Menu», the language button «ID», or «Akun saya» |
| A focus stop without a visible indicator | **1** | The `<audio>` control on a lesson page (`/belajar/…/pelajaran/…`) |
| Focus stuck on one element | **0** | |
| Page with no focus stop | **0** | |
| axe violations | **1 screen, 1 node** | `label` (critical): a form field without a label on `/lapor` (Laporkan masalah). 38 of 39 screens axe-clean at these tags |
| Wider than the window at 320 px | **0** | Matches the crawl's own X.6 check |
| **Wider than the window at 640 px** | **5** | Learner screens: `/belajar`, `/belajar/sertifikat`, `/belajar/[tugas]`, `…/pemetaan`, `…/pelajaran/…` are **674–675 px wide in a 640 px window**. This is the 200 % zoom case at 1280 px. A new finding: the 320 px check could not see it, so it is a layout breakpoint gap |
| At 1024 and 1280 px | **0** | |
| Clipped text, any width | **0** | |

**Also observed (not accessibility):**
- 5 requests answered **HTTP 500** on `/api/assets/read-url` for seeded lesson media (`pecahan-senilai.mp3`, `menjumlahkan-pecahan.mp4`), on `/studio/pratinjau/…` and `/belajar/…/pelajaran/…`.
- The crawl does not count these as broken (no page error).
- **Probable cause:** the local stack holds no media object at those paths. This is not verified.
- Listed for Batch 1 triage, not claimed as a product defect.

## 4. Spot check: a public page

`/masuk` (not in the crawl):
- title «PINTAR»;
- no skip link;
- **2 of 9 focus stops without a visible indicator**;
- axe clean.

Batch 2 should add the public pages to the crawl's start list (a harness extension inside W3.1; not done in Batch 0).

## 5. What it means for the plan

- **Batch 2** (W3.1, W3.3) closes the title and skip-link rows on every screen, and the focus indicators.
- **Batch 5** (learner) or **Batch 2** (shell) must close the **640 px learner overflow**. It is new, so it is added to the register as part of W3.10 (learner) at the next register update, not as a new register.
- `/lapor`'s unlabelled field belongs to W2.9/W10.1.
- **Gate 2** requires every row at 0. The harness is the measure.

**Evidence:**
- `evidence/a11y-baseline-2026-11-02.json` (per-screen rows);
- the run log (`crawl.log`) is in the session scratchpad, not committed (it is large and holds nothing more than the JSON and the crawl's existing output).
