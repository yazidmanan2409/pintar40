# PINTAR 4.0: status update (5 Nov 2026, evening)

This update is measured against the morning status report (`STATUS-REPORT-2026-11-05.md`).

## At a glance

| | Morning | Now |
|---|---|---|
| Branch head | `715f6f7d` | `b4be7c37`+ (26 commits since) |
| `main` | `34120759` (Batch 5) | **`38d7e701`** (PR #10, the P-1 promotion) |
| Staging | migration 193, Batch 5 | **migration 196, `main` 38d7e701** |
| Branch ahead of `main` | 161 commits, 3 migrations | 18 commits since the merge (walk and harness fixes, evidence); **0 migrations** |
| Production | not touched | not touched |

---

## 1 · What changed

### 1.1 P-1: the branch is on staging

The owner authorised P-1 and confirmed the staging backup (physical, 4 Nov 23:40 UTC).

**Before the merge:**
- read-only pre-check: 193 migrations; preservation digests taken; 96 sittings;
- CI `42026574403` and `42026560581` (pull_request), and journeys `42026579074`, green on `afefaf72`.

**The merge:** PR #10 as `main` `38d7e701`.
- `staging.yml` `42035466406`: 194, 195 and 196 applied, count 196;
- CI on `main` (`42035466448`) green.

**Read-only post-check:**
- 196 migrations;
- 20 + 240 exposure marks;
- the cycle-order rule in place;
- `school_people_page` present;
- every preservation digest identical;
- 96 sittings.

Evidence: `batch-8/evidence/staging-praperiksa-p1.md`, `staging-pascaperiksa-p1.md`.

### 1.2 Every staging walk is green on the promoted candidate

**The school:** «Sekolah Uji B8 1105» (`found-school.yml` 42037509318), real, not synthetic. The walks ran in order, each only after the one before it was green.

| Walk | Run of record | Result |
|---|---|---|
| GS-01–03 first administrator | 42037667705 | GREEN |
| GS-04–11 setup and publication | 42043970344 | GREEN (third run; two walk defects fixed) |
| GS-07, GS-12–16 learners | 42046058740 | GREEN |
| GS-17–21 reports, certificate, recovery, shared computer, public check | 42049795788 | GREEN |
| Administration (Batch 4), receiving school B5 1104 | 42054817245 | GREEN |
| **Studio end to end and Uji Cepat (W6.5, W6.7)** | 42057142327 | **GREEN**: closes the morning's "proven locally, staging not run" |
| Batch 5 (revocation, integrity review, Aktivasi pager) | 42059820670 | GREEN |
| Staging a11y | 42062130434 | GREEN |

**Walk defects found and fixed. None were product defects, and every assertion is unchanged:**
- **Konfigurasi as one page.** The walks still read Konfigurasi as one page; since B1 each section is its own page.
- **Questions one lesson at a time.** The reviewer counted only the first lesson's questions; the review now goes lesson by lesson.
- **The menu button.** The drawer now opens with «Buka menu».
- **The pager's disabled link.** «Berikutnya» is always drawn; a disabled link no longer counts as offered.
- **A check that checked nothing.** A label had been renamed («Rata-rata nilai kelas»), so one Studio check passed vacuously. It now must find the label.

### 1.3 Decisions recorded today

| | |
|---|---|
| **D-191** | K1–K7 closed for development |
| **K4** | The font is the system stack (Arial / Helvetica / sans-serif), with no font licence |
| **D-192** | A text-only «PINTAR» wordmark (#075056) replaces the supplied logo on every surface: shell, emails, certificate, card |
| **W2.14** | «ditugaskan» became «disediakan untuk Anda / kelas» (test W214-KATA-01; pack entry B39) |

### 1.4 Batch 8 proofs

| Item | Morning | Now |
|---|---|---|
| **W6.4** crawl (clipping, axe, 320–1280 px, 1024 rail) | run of record to do | **GREEN locally and in CI's journeys**: 14 personas, 55 screens, 0 axe violations, 0 overflow or clipping. One 320 px defect (Studio question review) fixed |
| **W6.2** U-PERF ≤ 3 s | to do | **Local:** 15 first screens across 6 roles, worst 488 ms. **Staging:** measured, see §2.1 |
| **W6.12** zoom, keyboard, colour vision | to do | **GREEN** (200 %, keyboard walk, three colour-vision emulations). NVDA and TalkBack still need a person with the devices |
| **W6.8** the 50-student test | to do | **In progress**, see §2.2 |
| **W6.9** checklist v2.8 | last | Evidence ledger open (`w69-bukti-pemeriksaan.md`); the render waits for W6.2 and W6.8 |

---

## 2 · What is new and needs attention

### 2.1 U-PERF is not met for the school admin on staging

**Where the run came from:** `perf-staging.yml`, probe 42064343924 and journey 42105894283, run from GitHub's runner, which is outside Indonesia.

| | |
|---|---|
| Server time to first byte | 0.36–0.61 s warm, 1.55 s cold; runs in `sin1` beside Supabase |
| **Teacher** sign-in → Mengajar | 2.4–3.2 s (at or under 3 s on 2 of 3 reps) |
| **Admin** sign-in → Konfigurasi | **4.6–5.7 s** |
| Konfigurasi index / «Laporan» section | 3.3–3.4 s / 3.5–5.0 s |
| A save, click → result line | 3.9–4.9 s (acknowledged within 4 ms) |

**What to make of it:**
- The server itself is fast. The extra time is page work plus round trips from a runner far from the server.
- So these are upper bounds, but **the row stays open** for the admin's Konfigurasi pages.
- **Next:** measure from a browser in the region, or profile what the Konfigurasi index and «Laporan» load per request.

**Harness defect behind it:** the U-PERF journey had measured nothing since 21 Oct.
- Its synthetic staff were held at the activation wizard (BOB-26), and the job still read green.
- It now answers the wizard once, before timing anything, and goes red when a step fails.

### 2.2 W6.8 needed a fresh test window

**What blocks the old one** (read-only on staging):
- The synthetic school's 45 assignments are ACTIVE, but their windows closed on 1 Nov, and most of its 1,170 learners have already sat.
- PINTAR gives a release to a class only once.
- It has no operation that ends an assignment.

**The way through:** a labelled seed (`perf-l1.yml` `label`) makes 50 learners in classes of their own («Tingkat Beban B8»), through PINTAR's own operations and with no direct database write.
- The first attempt (42107287870) was refused because the new class names repeated the old ones. That is fixed; the seed is re-running now.
- The browser test (5 jobs × 10 learners) runs after the seed.

The synthetic school's chapter is one of the 20 exposed chapters. D-183 lets it through only because the school is marked synthetic, as designed.

---

## 3 · What is unchanged

- **Still open:**
  - **Engineering (unblocked):** W9.19, W9.18, W9.12, W9.14.
  - **Copy:** W2.13 and W4.3/W4.4 wait on Dr Gladys's words.
- **Owner decisions and actions:** the morning's §3.2 list stands, except P-1 (done) and K4 (closed).
- **Waiting on others:**
  - Dr Gladys (the question pack);
  - Daisy (W1.2, W3.8, W3.21);
  - counsel (F-16, the legal gate).
- **Risks:**
  - staging Storage still has no independent backup (D-190);
  - real assessment content stays blocked until K6 is answered;
  - the local Docker stack is still unstable.
- **Retired risk:** "161 commits ahead of staging" (it is merged).

---

## 4 · Next, in order

1. **W6.8:** the seed, then the 50-learner browser test; record it.
2. **W6.2:** measure the admin pages from the region, or profile them; decide the U-PERF row on that.
3. **W6.9:** render checklist v2.8 from the ledger; mark only the rows with staging evidence.
4. Update the open-work register (about 30 stale status rows, plus today's).
5. Write the staging report, then restore the freeze.
6. Then W9.19, W9.18 and the Batch 9 rehearsals.

**The critical path is unchanged after P-1:**
1. Dr Gladys's pack (K1, K2);
2. counsel (F-16);
3. capacity and recovery (F-15, F-6, F-14).
