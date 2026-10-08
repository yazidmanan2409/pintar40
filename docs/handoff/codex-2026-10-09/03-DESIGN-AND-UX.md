# 03 · Design and UX

**Read first:** APPLICATION READY is a **design freeze** of the design system. It is **not** a statement that the application is ready. No application slice has been carried into `src/`. The running app (main/staging dab5c12) still uses the v2 `pin-*` styles.

## 1. Where the design system lives

The design system lives on Daisy's lane. It is **not on main**.

| Item | Location |
|---|---|
| Branch | `ux-1/daisy-experience`, head **cc96030**. It is 23 commits ahead of main and 75 behind; every commit is `[skip ci]` and touches design docs only. |
| Verified freeze | **c42fecb**. Daisy first froze it on bb0f98a; the coordinator corrected four document defects in c42fecb. See D-136(b). |
| Hand-off | `docs/coordination/handover/HANDOFF-DAISY-42.md` (on the lane). Its first line reads «APPLICATION READY on c42fecb». It ends with the coordinator's verification section. |
| Source root | `docs/coordination/ux/sistem-desain/project/` (on the lane) |
| Tools | `docs/coordination/ux/sistem-desain/alat/` (on the lane). See the checks in §6. |
| Rendered evidence | `docs/coordination/ux/sistem-desain/render/laporan.txt` and `render/jalan/` (on the lane) |
| Published page | The «PINTAR Design System» claude.ai artifact, version 18. It **predates c42fecb**: it still shows the four uncorrected specimens. Treat the lane as canonical. |

Read the lane without checking it out:

```
git show origin/ux-1/daisy-experience:<path>
```

### Source documents

All paths are under `docs/coordination/ux/sistem-desain/project/`.

| File | Subject |
|---|---|
| `README.md` | Entry point and content rules |
| `01-colour.md` | Colour |
| `02-typography.md` | Typography |
| `03-layout.md` | Layout |
| `04-interaction.md` | Interaction |
| `05-navigation.md` | Navigation |
| `06-accessibility.md` | Accessibility |
| `07-proposal.md` | The proposal, and the owner's rulings on questions 1 to 17 |
| `08-migration.md` | The application-pass map: today's class or component, its v3 component, and the visible change |
| `09-references.md` | References |
| `10-dates.md` | Dates and times |
| `11-validation.md` | Composed journeys J1–J7, the stripe, grammar gaps, copy owed, the gate to the application pass |
| `tokens.json`, `design-system.json` | Tokens and the system definition |
| `components/<Name>/README.md` + `preview.html` | Components, about 60, plus the journey cards J1Terbit … J7Kunci. `components/bundle.css` and `bundle.js` hold the shared styles and scripts. |

### Governing decisions (on main, `docs/coordination/DECISIONS.md`)

- **D-124**: batch 4 brief.
- **D-128**: the closure sequence including Daisy.
- **D-134**: Terminology v1 is used while Dr Gladys's review continues.
- **D-135**: the owner directive. Approved design decisions are implementation authority. Daisy decides design execution. **Do not reopen ruled items.** D-135(d) lists what was settled for batch 4.
- **D-136(b)**: APPLICATION READY verified on c42fecb.

Earlier design rulings:
- questions 1–17 in `07-proposal.md`;
- D-068 (Terminology v1);
- D-079 (email);
- D-020 (the learner greeting);
- D-074 and D-080 (the card and the certificate).

## 2. J1–J7 status

The composed journeys are J1Terbit, J2Kelas, J3MengajarBelajar, J4Murid, J5Jendela, J6Peragaan and J7Kunci, under `components/`.

| Step | State | Evidence |
|---|---|---|
| Composed | Done, 7 Oct | `11-validation.md` §1; the lane at 7c6aefe; HANDOFF-DAISY-41 |
| Findings and questions (F2–F15, C1, C2, JQ1–JQ7, GQ1–GQ5) | Settled under D-135(d) and corrected at source, 8 Oct | bb0f98a, then c42fecb |
| The table stripe | **A**, final under D-135 | A three-display check is an optional field check (`11-validation.md` §2), not a condition |
| Independent verification | AMBER, then corrected | D-136(b) |
| Checks on c42fecb | Clean (coordinator re-run, 8 Oct) | 60 previews, 0 failures; 61 contrast pairs, 0 under the floor; 7 keyboard journeys, 0 findings; eslint 0 errors |

**J1–J7 were composed and walked as design specimens, with keyboard and accessibility-tree checks.** They were **not** walked as the running application by a person. The owner's own walk (CR-55) was absorbed into Daisy's freeze under D-135. It is not recorded as human acceptance.

## 3. Outstanding application slices

`08-migration.md` defines the application pass. Its sections:
- How the pass treats names;
- Actions;
- Fields;
- Navigation and identity;
- Feedback;
- Data;
- Containers;
- Known gaps;
- Print.

Rules stated in the map:
- **the `pin-` prefix stays in the product**: about 15 selftest files and the journeys select on `pin-*` classes;
- React components keep their names and behaviour;
- v2 token names stay as aliases until no rule uses them.

**Status: no row of `08-migration.md` has been applied to `src/`.** Every screen is unmigrated.

- **Today's implementation.** It lives in `src/app/experience.css` and `src/app/globals.css` (v2 `pin-*` classes and tokens) and in the shared components in `src/components/`, for example:
  - TombolKirim, BarisHasil, MemuatHalaman, TandaTautan;
  - SesiSaya, HalamanKomitmen, HalamanGalat, HalamanPenolakan;
  - CangkangPengalaman;
  - MerekPintar, KakiPintar.
- **The gate to the application pass** (`11-validation.md`, last section):
  - the authorised UI/UX stage has begun, after Engineering Complete;
  - the journeys are composed and corrected (done);
  - the stripe is decided (done).

  Whether «the authorised UI/UX stage has begun» is for the owner to declare. No record of that declaration exists.

Known gaps listed in `08-migration.md`, all unapplied:
- sizes outside the type ladder;
- 6 px radii;
- controls under 44 px:
  - `.pin-btn` 40;
  - `.pin-num-btn` 34;
  - `.pin-soalbar .pin-btn` 32;
  - `.pin-lang button` 26;
- status colour on `.pin-sehat-tanda.pin-perhatian`;
- a target-size selftest guard, planned as step 2 of the pass.

## 4. Terminology and copy obligations

- **The copy table** is `src/lib/hle.ts`. Every visible word comes from it:
  - `t(key, persona)`;
  - `enumLabel`;
  - `allKeys`.
- **Terminology v1** (D-068). Its freeze package is `docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md`; the impact list is `docs/coordination/ux/TERMINOLOGY-V1-CHANGE-IMPACT.md`.
  - Applied so far: A1–A5, N1, N2 and N9 (D-134), in L4.
  - The rest of v1's change set stays with Daisy's polish. One visible mix results: «Uji Penguasaan» beside «penilaian akhir» in `metrik.pemahaman.arti` (v1 row A9, unapplied).
- **Copy owed to `hle.ts`**, from `11-validation.md` §4 at c42fecb:
  - C1 «Keluar dari semua»;
  - C2 «murid» and «menyediakan»;
  - «Tandai soal ini»;
  - «Menerbitkan…» for step 7;
  - CR-50 (five problem sentences and a «Miskonsepsi» sheet);
  - CR-13 (three texts);
  - CR-76 (waiting texts and «Menunggu keputusan»), in c42fecb's corrected v1 words: «Kepala departemen», «Dekan», «lingkup»;
  - CR-81 (the bands' heading).
- **UX-19** (Tugaskan / Siapkan / Sediakan) is settled by D-135(d)'s acceptance of C2. `docs/coordination/ux/UX-POLISH-REGISTER.md` and v1 §5 still show it open.
- **«Lihat seperti siswa»** becomes «Lihat seperti murid» (v1 C8) with Daisy's polish.
- **Words v1 lacks** go to one consolidated register for Dr Gladys, and block nothing else (D-135(c)):
  - report-template titles;
  - visualization and standard-report names;
  - the shuffle;
  - the limits line's units;
  - audit action codes and tables;
  - the measured difficulty.

  These are listed in `docs/reports/PINTAR-4.0-CLOSURE-L4-2026-10-08.md` §4 and in the L4-G01 register (`selftest/static.test.ts`).

## 5. Accessibility verification still required

- A **screen-reader pass with NVDA or TalkBack** on the real screens. The design checks reviewed the accessibility tree only (HANDOFF-DAISY-42).
- The **target-size guard** (44 px) after the pass.
- Not yet done, and pending outside design (`11-validation.md` §5):
  - the wordmark master (font licence verification);
  - the physical print proof of the card and the certificate.

## 6. Re-running the design checks

From a checkout of `ux-1/daisy-experience` with `node_modules` installed, and `PLAYWRIGHT_BROWSERS_PATH` pointing at Chromium:

```
npx tsx docs/coordination/ux/sistem-desain/alat/pratinjau.mts --sempit   # «60 previews, 0 with a failure»
python3 docs/coordination/ux/sistem-desain/alat/kontras.py               # «61 pairs, 0 under the floor»
npx tsx docs/coordination/ux/sistem-desain/alat/jalani.mts               # «7 journeys, 0 runs with a finding»
npx eslint docs/coordination/ux/sistem-desain/alat/
```

The tools rewrite `render/laporan.txt`. Commit that file only when a source file changed.
