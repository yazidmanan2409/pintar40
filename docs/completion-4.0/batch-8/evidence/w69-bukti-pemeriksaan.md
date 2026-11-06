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
| W6.2 | U-PERF | staging, `main` 38d7e701, from GitHub's runner | **OPEN — MEASURED, NOT MET for the admin; the cause found and fixed on the branch, awaiting promotion and re-measurement**: the teacher's first screen 2.4–3.2 s; the admin's 4.6–5.7 s, and four admin steps over 3 s. The server answers in 0.36–0.61 s warm (TTFB). See §2b | §2b |
| **W6.8** the 50-student test through the real app | CAP-02 at 50, STU-* | staging, `main` 38d7e701, harness `4becbb1d` | **NOT MET (D-031): every correctness criterion met; the answer-save p95 1,828 ms against 1 s** (`perf-l1.yml` run 42110164855) | §2c |
| **W6.12** 200 % zoom, keyboard, contrast | L-a11y | local | **GREEN** at 640 px (1280 at 200 %) and the keyboard walk (§1); colour vision §3 | §1, §3 |
| W6.12 · **NVDA** (Windows, a recent NVDA with Chrome or Firefox) | L-a11y | human, device | **OUTSTANDING — DEVICE RUN NOT DONE**: needs a person with a Windows machine; script §4 | — |
| W6.12 · **TalkBack** (Android, a recent TalkBack with Chrome) | L-a11y | human, device | **OUTSTANDING — DEVICE RUN NOT DONE**: needs a person with an Android phone; script §4 | — |

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

## 2b · W6.2 on staging (5 Nov, after P-1)

**Probe** (`perf-staging.yml` `probe`, run 42064343924):
- the server code runs in `sin1` (Singapore), beside Supabase;
- time to first byte on `/masuk`, `/masuk?peran=staf` and `/`: 0.36–0.61 s warm; 1.55 s on the first, cold request.

**Journey** (`perf-staging.yml` `journey`, run 42105894283, three reps):
- timed from a click (or the sign-in) to a usable page (its h1 shown);
- synthetic staff only (D-046(c)).

| Role | Step | rep 1, 2, 3 (ms) |
|---|---|---|
| admin | sign-in → Konfigurasi | 5729, 4575, 4972 |
| admin | click Aktivasi akun | 1824, 1833, 1828 |
| admin | click Studio · Buat Paket · Antrean Tinjauan · Bank Soal | 52–64 · 1309–1739 · 531–1133 · 1187–1360 |
| admin | open Konfigurasi | 3298, 3414, 3293 |
| admin | click Laporan (the section page) | 4304, 4986, 3468 |
| admin | click Ringkasan sekolah | 1397, 2476, 1075 |
| admin | save «Ubah nama», click → result line (click → «saving» 2–4 ms) | 4404, 4913, 3909 |
| guru | sign-in → Mengajar | 3216, 2976, 2358 |
| guru | click the class · click Siapkan | 1320–1813 · 1223–1269 |

**What it shows:**
- **The teacher's first screen:** at or under 3 s on reps 2 and 3.
- **The admin's first screen:** over 3 s on every rep (4.6–5.7 s). So are these admin steps:
  - the Konfigurasi index (3.3–3.4 s);
  - its «Laporan» section (3.5–5.0 s);
  - a save's result line (3.9–4.9 s). The save acknowledges the click at once, within 4 ms (D-046(e)).
- **Where the time goes:** the server's own first byte is fast (above). The rest is page work and the round trips from GitHub's runner, which is not in Indonesia. These figures are upper bounds for a reader beside the server.
- **The verdict:** it is not ours to soften. **U-PERF stays open for the admin's Konfigurasi pages.** The next step is to measure from a browser in the region, or to profile what the Konfigurasi index and «Laporan» load per request.

**Profiled (5 Nov, evening), from Supabase's own edge log of that journey's windows (read-only):**
- **What a Konfigurasi render does.** The index and «Laporan» alike make about 20 parallel reads. **`GET audit_log` answered in 2,271 ms on both renders**; every other read answered in 7–145 ms. The page's second batch of reads (structure, transfers, pass marks, …) starts only after it.
- **Why.** The same query, EXPLAINed read-only as the synthetic school's admin:
  - as a plain query: 21 ms;
  - as PostgREST sends it, a prepared statement under a generic plan, with `institution_id = any($1)`: **2,538 ms**. That plan cannot use the `(institution_id, at desc)` order, so it reads all 6,386 of the school's trail rows through the row policy to keep 51;
  - with `institution_id = $1`: 21 ms.
- **Fixed on the branch** (not yet on staging): Konfigurasi reads the trail only on «Jejak audit»'s own page, which since B1 is the only page that draws it, and names one school with `eq`. Held by **W62-JEJAK-01**: a planted copy of the old read is caught.
- **The second cost: Auth round trips.** Every page load also makes several `GET /auth/v1/user` calls at about 200 ms each, against 7–15 ms for database reads. This is W9.19's Auth round trip, still open. It weighs most on sign-in, when the proxy, the page and the shell each ask.
- **Where the 200 ms comes from (6 Nov, Supabase's edge log, read-only).** The Auth and session calls are slow only when they come from the proxy:
  - the proxy's `GET /auth/v1/user` arrives through Cloudflare SJC and IAD (US): p50 200 ms (n 1,931) and 289 ms (n 485);
  - its `rpc/sesi_periksa` the same way: p50 200 ms (n 1,932) and 279 ms (n 485);
  - the same two calls arriving through SIN, from the page renders in `sin1`: 10–12 ms;
  - `sesi_periksa` in the database: 1.1 ms mean over 14,610 calls (`pg_stat_statements`).
  - **So the cost is distance, not work.** The pages run in `sin1` (`vercel.json`), but the proxy (`src/proxy.ts`, no runtime or region set) runs near the requester, here GitHub's runner in the US. Each of its two calls crosses the Pacific.
  - **What it means for a user in Indonesia:** the proxy would likely run near Singapore and the two calls would cost about what they cost through SIN. **This is inferred, not measured.** Only a measurement from the region settles it.
- **From the region:** **not measured.** No runner or host in Indonesia is available to this work, and this container cannot reach staging. The row stays open until the fix is on staging and the journey is re-measured. If the target is to be judged from the region, a regional probe is an owner provision.

**Harness defects fixed to get these figures:**
1. The synthetic staff were held at the activation wizard (BOB-26) since the identity foundation. Every earlier journey timed out at sign-in, and the job still read green (run 42064350172).
   - `lib.mjs` `settle()` now answers the wizard once, by its own screens, before anything is timed.
   - The journey is now red when a step fails.
2. The school summary moved to Konfigurasi's «Laporan» section (B1). The journey clicks it there (run 42104311580).

## 2c · W6.8 on staging (5 Nov, after P-1)

**The run:** `perf-l1.yml` `mode=browser`, run **42110164855**.
- **What it ran on:** staging serving `main` 38d7e701, harness at `4becbb1d`.
- **The learners:** 50, in classes of their own («Tingkat Beban B8», two Kelas, seeded by run 42109338605 through PINTAR's own operations); 5 jobs × 10, one Chromium context each, in the real app (pages, server actions, the player's own timer and outbox).
- **Setup:** sessions made ahead by Auth's admin link (SETUP); each Pemetaan Awal sat beforehand; T0 21:28:21 UTC.

| D-031 criterion | Result | Met |
|---|---|---|
| every learner sat and finished | 50 of 50 started and finished | yes |
| no answer lost | 0 lost (473 acknowledged) | yes |
| no answer duplicated | 0 | yes |
| every finished sitting has its result | 0 without | yes |
| server errors under 0.1 % | 0 of 2,261 | yes |
| **answer save p95 under 1 s** | **1,828 ms** (p50 1,323, p99 2,328, max 2,332; n 465) | **no** |
| answer save p99 under 3 s | 2,328 ms | yes |
| back at baseline within 10 minutes (CAP-07) | 180 s | yes |

**The rest of what it measured:**
- **Other calls (p50 / p95, ms):**
  - server actions 879 / 1,674;
  - RSC 875 / 1,825;
  - page loads 1,195 / 3,088;
  - start 1,314 / 2,814;
  - hand-in («Kumpulkan») 2,020 / 4,001;
  - offline saves sent later 8, all stored.
- **Load and the database:** peak 29.1 requests/s; the wave lasted 150 s. CPU 1 % before, 19 % at peak; 16 → 22 backends.
- **Browser-cancelled requests:** 671 RSC and 28 action requests the browser itself cancelled. These are not server answers and are counted apart.

**How to read it:**
- **Correctness under load holds:** nothing lost, duplicated, unscored or refused.
- **The save-time criterion is not met.**
- **What the figure includes:** a save is timed from the press to «Tersimpan». That covers the round trip from GitHub's runner, which is not in Indonesia, and the Next.js server. The database stayed far from saturation (19 %).
- **Against October's baseline** (50 learners, 2 Oct, the same harness kind): p95 1,366 ms. So this run is **slower by about 460 ms at p95**.
- **What it does not settle:** staging is not on production's compute tier (CAP-08). The cut below shows most of it is outside the database.
- **The save's own server time (6 Nov, Supabase's edge log for the wave, read-only):** `rpc/record_answer` 11 ms p50, 20 ms p95. The rest of the 1,828 ms is outside the database. The largest part found is the proxy's two calls from the US (§2b): about 200–290 ms each on every request, against 10–12 ms from SIN. The remainder is the action itself, from the runner to `sin1` and back.
- **Next:** the same measurement from the region. If the target is to be judged there, a regional probe is an owner provision.
- **This row is not marked PASS.**

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
