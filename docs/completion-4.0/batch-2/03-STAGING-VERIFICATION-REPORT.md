# Batch 2 · Protected merge and staging verification (2 Nov 2026)

**Authority:** owner, 2 Nov: «Batch 2 Protected Merge & Staging Verification — CONDITIONAL GO» (D-148).

## Verdict: PASS

- Batch 2 is merged through the protected path and verified on staging.
- Dr Gladys's demonstration school and every existing assessment record are unchanged.
- **The staging freeze is restored** (D-148).
- Production was not touched.
- No proxy exemption was added.
- No Batch 3 work.

## 1. Protected merge

| Item | Evidence |
|---|---|
| Pull request | PR #4. GitHub held it as `blocked` until the required check passed. |
| Pre-merge correction | The crawl's /aktivasi finding, diagnosed (§4) and fixed in `4453c43` before the merge |
| Required check | `verdict · green only when every job ran and succeeded` (app 15368), green on `4453c43`. CI 41426463425: 18/18. Journeys 41426468549: A and B green. |
| Merge | `fab8e4a`, with the head SHA pinned; a merge commit, no bypass |
| Triggered on `main` | **Only `ci`** (41430417532, green). No staging-database or production workflow ran: the PR has no migration, and no request file fires on `main`. |
| Staging runs the merged commit | Environment facts 41432900275 GREEN: staging's app is `main`'s code, and its migrations are the expected 181. GS-00 re-checked this before every walk. |

## 2. Staging verification

Fresh synthetic test school: **`sekolah-uji-b2-1102`** (founded by run 41432906079).

| Check | Run | Result |
|---|---|---|
| Golden School GS-01–03 | 41433012861 | PASS |
| GS-04–11: structure and staff; the workbook uploaded through the new **FileField** (`#ung-berkas`, behaviour unchanged); the chapter reviewed and published | 41433578771 | PASS |
| GS-07, GS-12–16: class cards; learners sign in and sit both tests | 41434844205 | PASS |
| GS-17–21: every role's reports, certificate, card re-issue, recovery, the shared computer (the **idle warning** «Saya masih di sini» after a real wait, then the lock), and the public check | 41437164666 | PASS |
| **Keyboard, titles and widths (judged, fail the run when they fail)** | 41436131363 | **All PASS** (§3) |
| Accessibility harness, every staff context and the public pages (recorded) | 41436131363, re-run 41440170620 to name each finding's screen | §3 |

## 3. Keyboard, titles, widths and accessibility on staging

**Judged checks** (`audit/staging/a11y-staging.mjs`):

| Check | Result |
|---|---|
| The first Tab is «Langsung ke isi», visible; Enter lands on `main#isi` | PASS |
| The account menu's button is reached by Tab (11 presses). Enter opens it with focus on «Akun saya»; End reaches «Keluar dari semua perangkat…»; Home goes back; Esc closes and returns focus. | PASS |
| The dialog opens on «Batal». Esc closes it, focus returns to the menu button, and the person stays signed in (never confirmed). | PASS |
| The menu at 320 px fits the window (16–245 of 320) | PASS |
| No sideways scroll at 1280, 1024 or 320 px | PASS |
| **No page title carries a name of the school's people** (25 titles, 9 names) | PASS |
| **A refused page's title:** the teacher on /pimpinan is refused, and the tab reads «Pimpinan · PINTAR», nothing of the Management home | PASS |

**Recorded (Batch 0 harness), 12 distinct screens:**
- Title missing: **0**.
- axe clean: **12 of 12**.
- Wider or clipped text at any width: **0**.
- No working skip link: **1 in the first run, 0 in the re-run.** The first run's screen was not named; the re-run, which names every finding's screen, found none.
- A focus stop without an indicator: **1, the sign-in fields on /masuk. This is not a defect.** Their ring is drawn on the field's wrapper (`.pin-inp:focus-within`: solid 2 px `--focus-ring`, measured on the running app, and shown in `evidence/07-masuk-focus-1280.png`). The harness measures only the focused element itself, so it cannot see it; this is a known limit of the harness.

## 4. The /aktivasi skip-link exception: a real defect, fixed before the merge

The investigation separated it from the guided tour.

**Where it happened:**
- Only on the platform admin's /aktivasi, in the platform context.
- It happened for a person pressing Tab, not only the harness, on every load.
- Other pages in the same context were correct.

**Why:**
- The page rendered «Belum ada murid yang punya kartu kelas.» through `BarisHasil`, a result line that scrolls itself into view when it mounts.
- That moved Chromium's Tab starting point to the foot of the page, so the first Tab went to the footer's «info@pintarselalu.com».
- With JavaScript turned off, the first Tab was correct.
- No focus event fired, which is why the code had looked innocent.

**The fix (`4453c43`):**
- The note is an empty state, so it is now Batch 2's `Kosong`, which does not scroll.
- Guard UX2-KOSONG-01 is red without the fix and green with it.
- The same review removed a React `autoFocus` from the dialog's «Batal». It focused the closed dialog at mount, which was not the cause but was wrong. `showModal()` gives «Batal» focus as the dialog's first control.

**Result:**
- After the fix, the crawl's skip-link misses are **2**: the guided tour on the teacher's Mengajar and the learner's Belajar. On a first visit the tour takes focus by design, and its card is the dialog the person meets first.
- On staging: 0.

## 5. Preservation

| Fact | Before the merge | After verification |
|---|---|---|
| «Sekolah Demo PINTAR»: active roles / assessment results / official results / certificates / enrolments / courses | 4 / 10 / 10 / 3 / 5 / 1 | **4 / 10 / 10 / 3 / 5 / 1** |
| Its audit rows (last id) | 91 (6,860) | **91 (6,860)** |
| Assessment results, all schools | 1,532 | 1,543 = 1,532 + **11 in the test school** |
| Official results / certificates, all schools | 106 / 30 | 117 / 33 = **+11 / +3, all in the test school** |
| Migrations | 181 | 181 (Batch 2 has none) |

- **Nothing was written to the demonstration school.**
- **No existing record changed or disappeared.**

## 6. CI for this promotion

| Runs | Minutes |
|---|---|
| PR CI on `9988ed0` (cancelled once superseded by the /aktivasi fix) | 52 |
| PR CI and journeys on `4453c43` | 58 + 43 |
| `ci` on `main` after the merge | 65 |
| Facts, founding, four Golden School steps, two accessibility walks | 1 + 2 + 5 + 10 + 10 + 23 + 8 + 8 |
| **Total** | **285** |

## 7. Still open (unchanged, for the owner and Daisy)

- The skip link covers the learner's first navigation link while focused (`02-DAISY-QUESTIONS.md` #2).
- 15 questions for Daisy (`02-DAISY-QUESTIONS.md`).
- Adoption of the Batch 2 components on screens, in batches 3–6.
- `icon.svg` and `apple-icon.png`, held by the owner's ruling.

**STOP for owner review.**
- Staging is frozen again.
- No Batch 3.
