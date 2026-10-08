# PINTAR 4.0 · Closure landing L3: the Working Context (D-127, D-132)

**7–8 October 2026.** The third landing: the Working Context, built to the design page as D-132 ruled it (GREEN WITH MODIFICATIONS; implementation GO). «Logging into PINTAR tells it who I am. Working Context tells it what I'm here to do right now.»

**This report is a stop.** L4 waits for the Second Eye. **Updated 8 Oct** with the corrective landing for CR-93 and CR-94 (§9) and the evidence for the Second Eye's holds (§10). The verdict is the Second Eye's; this report claims no unconditional GREEN.

What did not change:
- **No authority changed.** No RLS policy, capability, grant or authorization function reads the context (F22-K06 asserts it statically and by acting).
- **No screen was redesigned.** The shell's control is the plain, functional one; its look is Daisy's (CR-54 S2).
- **No word was invented** (D-128(g), D-132(m)). The six expressions awaiting Dr Gladys are semantic keys that draw nothing (§6).
- **CR-91 was not touched.** CR-92 waits for a closure landing.

## 1. What landed, ruling by ruling

| Ruling | What the code does | Proof |
|---|---|---|
| **The context** (D-127) | A session's purpose · place lives on its own `device_sessions` row (one row per Auth session), written by one writer, `konteks_tetapkan`. It accepts only the caller's own current session and only a pair the person holds. `konteks_saya` reads it back and re-checks it on every read; `konteks_tempat_saya` lists the pairs held. Migration `20261210100000` | F22-K01, F22-K02 |
| **C1** Belajar has no place | Belajar is the person's own learning. The chooser offers it only with participation: an active enrolment or a class card | F22-K01, F22-P01 |
| **C2** Mengajar only from teaching grants | Mengajar is derived from EDUCATOR and Kepala departemen grants only. Admin sekolah's every-class view is gone from Mengajar. The classes are those the grants reach, in the context's own school | F22-K01, F22-P02; DAISY and BOB restatements (§4) |
| **C3** `/` is the one chooser, non-mutating | Visiting `/` writes nothing; its doors are forms whose POST (`pilihKonteks`) is the one switch | F22-P04 |
| **C4** + the ambiguity guard | A page asked for sets the context only on a session that has none, and only when exactly one held pair serves it. Otherwise it goes to the chooser, with the page to continue to. Never in a server action, never on a neutral page | F22-P01, F22-P02, F22-P04; BOB20-A01 (an admin of two schools is asked) |
| **C5** the sign-out mark: a 4.0 stale-continuation guard | Ending a session destroys its context. A continuation left by an ended session is not inherited. A genuinely new request stays usable. Landing home first is the accepted fallback. Documented as a guard, not as Working Context | F22-P03, F22-K05; BD11 extended (§5) |
| **C6** a class card presents Belajar only | Presentation only. CR-91 is separate and untouched | F22-K01 |
| **C7** Pustaka PINTAR and «Seluruh platform» are places | Admin platform holds Mengelola in every active school, in the library and in «Seluruh platform». Platform-wide work is chosen deliberately | F22-K01, F22-P02 |
| **C8** Studio follows purpose and place | Studio shows the active place's capabilities, from the grants that give the active purpose there. The database still decides every act from all of the person's grants | F22-P02; DAISY-11-STUDIO-02 |
| **C9** no ranking | No door and one available pair: it is selected. Several: the chooser asks. D-010's ranking only says where a chosen pair lands | F22-P01 (27 rows) |
| **C10** evaluation personas | No session row and no context. They land on their single role's home, as before | F22-P01 |
| **§2.11** the context-bound action guard | Every context-bound human action checks that its target belongs to the active context before acting: 53 server actions in 6 files, and the API routes, which refuse in JSON. With no context set, an action is refused (strict). System and explicitly platform-scoped operations (the test email and its history) use their governed scope. Nothing fabricates a device context | F22-P05 (static, with planted-check bites); F22-K06 |
| **FD-4** | Konfigurasi's reads are bounded, with names embedded. The roster's id-list reads are noted, not changed | the existing Konfigurasi tests, restated |

## 2. Where the rulings were silent: the choices made

- **Library Mengajar:** a library author's Mengajar is in Pustaka PINTAR and serves Studio only, never Kelas (D-120 Q7).
- **The test email and its history** are explicitly platform-scoped, so they are exempt from the action guard (§2.11's own exemption). BOB51 requires a sentence for every refusal code, and none may be invented.
- **Strict on no context:** an action reached with no context is refused, never guessed.
- **Admin platform's first-admin list:** the «awaiting a first role» list is offered to Admin platform in a school's context. Otherwise a new school's first admin could not be granted without leaving that school (deadlock).
- **Notices** appear in a school's context.
- **Card holders** are found through enrolments.
- **`/akun`'s back link** goes to the context's home.
- **«Seluruh platform» has no Studio link;** Studio is a school's or the library's.
- **The chooser's Mengelola label** is `context.manage_label`, which draws nothing until Dr Gladys gives it words (§6).
- **The design's §4 rows** are all walked as F22-P01's 27 rows. The journey world holds no email-only learner and no learner who is also an admin, so those two rows are proven in F22-P01, not in a walk.

## 3. Found and fixed while proving it

| Found by | What was wrong | Fixed |
|---|---|---|
| DAISY-11-STUDIO-02 (rendered HTML) | The context's tabs were an async component, so React streamed them after the page. Script moved them into place. **Without script the shell had no tabs** | The shell awaits the tabs in its own render (`navKonteks`). The static tests read the call |
| DAISY-11-STUDIO-02 | **A dean was offered a Studio tab.** The shell's Studio rule counted any capability (a dean's roster), and Studio then refused the dean (D-021). F22-P02's own matrix had encoded the same mistake | Only Studio's own capabilities count: one list, `KEMAMPUAN_STUDIO`, read by both Studio's database question and the shell. F22-P02's Dean row corrected |
| Journeys job B (S5, S11) | **Every arrival landed on another origin.** `/mulai` built its redirect from `request.url`, which behind `next start` names the server's own host (`localhost`), not the address the browser used. That origin holds none of the session's cookies, so the person looked signed out there. (On Vercel `request.url` is the public host, so staging and production would not have shown it.) | `/mulai` answers with a relative `Location`, as the proxy's own redirects do. F22-P03 pins it (red on the old route, green on the new). `/keluar` and `/api/evaluation/assume` have built from `request.url` since before L3; they are left unchanged and noted (§8) |
| Journeys job A (the seeded crawl) | **Since Gate 6 the crawl had read one page per persona, and stayed green.** A signed-in browser is first asked «Komputer siapa ini?» (BOB-29), and the crawl never answered it. Every persona's walk ended on `/perangkat`. The CI logs are not reachable from here, but the step times are: «Walk every role's screens» took 335–420 s up to run 36971987994 (2 Oct), then 19–22 s from run 37258286723 (5 Oct, the first after Gate 6 landed at d84e0a4) through L2's 37592135705. Locally, main's own crawl stops at `/perangkat` for all 14 personas | The crawl answers «Komputer pribadi saya» as the walks do, then chooses its door on the chooser. It now reads 387 pages (14 before) |
| The corrected crawl, on main | **The crawl marked a page as the error page because an id contained «404».** On main 886554b, one «Laporkan masalah» page showed a class id «…-6102404a13d3» | «404» counts as a word only. The framework's not-found page still matches, by its sentence and by the word |
| DR-D03 | The recovery check's F1 took the first answer of a sign-in, now `/mulai`'s redirect. A platform admin then stood on the chooser with no context, and F2's card re-issue was refused (correctly) | F1 follows the application's own redirects (their path, on the checked origin), and answers the chooser as the person would for this work («Seluruh platform» when held, else its one door). A school admin with one pair never sees it |

## 4. Tests: new and restated

**New:**
- **Database (`fable22.sql`):** F22-K01 to K06. They cover what a person holds, the one writer, two sessions with two contexts, invalidation, the end, and «never authority».
- **Pure and static (`fable22.test.ts`):**
  - F22-P01: the door × person table, 27 rows.
  - F22-P02: surfaces, 16 paths × 10 pairs.
  - F22-P03: the sign-out mark.
  - F22-P04: the chooser is non-mutating, C4's writer has its only callers, and the six terms stay unresolved.
  - F22-P05: the action guard on all 53 actions and the API routes.
- **The helper `konteks-uji.ts`:** a test chooses its context exactly as a person does, by posting the chooser door's own form.

**Restated** (each marked «RESTATED FOR L3» with its ruling):
- **Where a test relied on landing or on merged schools,** it now chooses its context on the chooser: Admin platform for «Seluruh platform» or for a named school, and a Kepala departemen for Mengelola.
- **Where a test relied on the pre-L3 tabs:**
  - Educator-as-learner (UX1-AJAR-BELAJAR-01): the way between teaching and own learning is now the chooser, never a tab.
  - Sign-in destinations: every arrival goes through `/mulai`.
- **Not restated:**
  - Every PASS criterion that does not depend on landing or tabs.
  - Every DB authorization proof.

## 5. The runs

**Local.** The suite, `tsc` and ESLint ran on d66485e, the head CI ran. Job A ran on 386ca72, which differs from d66485e only in the crawl's «404» match. Job B ran on the head before the C12k restatement:

| Run | Result |
|---|---|
| Full suite on a fresh seeded database | **643 passed, 0 failed**; 1 justified skip, local only. GREEN |
| `tsc --noEmit` / ESLint | 0 errors / 0 errors (6 warnings, each also on main) |
| Job B, the journeys from an empty database (Chromium only) | 73 PASS. Two FAILs: S23q is CR-52's known A item, and C12k, whose criterion D-132 C9 restates, was fixed after this run. BD11 BLOCKED locally only: Firefox and WebKit are not installed here; its Chromium halves pass. L3D (the door × person table walked) and L3A pass |
| Job A, the seeded crawl (corrected, §3) | 14 personas, **387 pages**, 0 error pages, 0 server errors. RED on X.6 only: the two 320 px layouts in §8, both also on main |

**CI:**

| Run | Head | Result |
|---|---|---|
| CI **37703610493** | d66485e | **18 of 18 jobs succeeded**, among them the selftest contract (strict, local stack) and the verdict («green only when every job ran and succeeded»). The count of tests is in its log, which is not reachable from here; the local count on the same head is 643 |
| Journeys **37703613326** | d66485e | Job A red: «Walk every role's screens» ran 649 s (19–22 s in every run since Gate 6), exit 1. Its reasons are in the job's summary and artifact, not reachable from here. **Cancelled during job B:** job B's verdicts go only to its log and summary, so this session could not have read them |
| Journeys **37705723825** | 07bbf57 (the application identical to d66485e; the journey and crawl also write their verdicts as annotations, which the API serves) | **Job A** (598 s): 14 personas, the same page counts as locally (387 pages). **RED, 147 broken, every one X.6:** «Laporkan masalah» 440 px wide ×144, Konfigurasi's roles row 374 px ×3. No error page, no server error, no page error. **Job B: 75 PASS, 1 FAIL.** The FAIL is S23q, CR-52's A item, failing exactly as QN5 words it (D-123). **BD11 PASS** in Chromium, Firefox and WebKit, on a personal and on a shared computer: after «Keluar», 0 of the admin's sessions are open or hold a context, Back reaches only `/masuk`, and the next person's own context is theirs. **L3D PASS**: every door, for every person this world holds. **L3A PASS**: two contexts on two devices. **C12k PASS**: the readings are byte-identical (md5 `97e4a8e4…`), and the Guru, who holds two purposes, lands on the chooser (C9) |

**Main, staging and the Golden School:**

| Run | Result |
|---|---|
| main **886554b → d66485e** (a fast-forward to the head CI 37703610493 proved; job B's evidence was read first) | CI on main **37708857395**: E1. The baseline passed and the proof step cancelled its own run, the same shape as L1's ALREADY PROVEN run 37584213073. Which proof it named is in its log, not reachable here |
| Staging **37708857447** (database and sign-in) | Success. Staging lists **177 migrations**, the last `20261210100000_a_session_knows_what_it_is_here_to_do` (read only, after the run) |
| found-school **37709075256** | GS-00 (staging runs main's commit and migrations) and GS-01: «Sekolah Uji Penutupan L3» (`sekolah-uji-l3`) founded |
| GS-02/03 **37709146876** | Green: the operator appoints the first administrator, who signs in like a person (the operator chooses «Seluruh platform», then the school) |
| GS-04 to GS-11 **37709418935** | Green: the school admin sets the school up by their own screens |
| GS-07 cards, GS-12 to GS-16 **37710220867** | Green: the class's cards; the students sign in with them and sit the chapter |
| GS-17 to GS-22 **37710983410** | Green: the staff read their reports; the certificate and its public check |

Each walk exits red on any FAIL step, so a green job means every step passed. Their per-step tallies are in their summaries, which are not reachable here.

## 6. For Daisy, and for Dr Gladys's terminology review (no word invented)

The six expressions stay unresolved, as D-132(m) rules. Each is a semantic key that draws nothing: never the key itself and never a stand-in sentence. Behaviour does not depend on any of them. F22-P04 checks that each is placed in the source, draws nothing, and has no words in the copy table.

| Key | Where it appears |
|---|---|
| `context.manage_label` | the shell's name for Mengelola |
| `context.not_held` | the chooser: this account does not hold the purpose chosen |
| `context.other_context` | the chooser: the page asked for belongs to another context |
| `context.invalid` | the chooser: the context is no longer held |
| `context.other_school` | an action refused because its target is outside the active context |
| `context.choose_place` | the place question when a purpose has several places |

For Daisy:
- The shell's control is plain: the context's tabs, the place's name, and «Mau ke mana hari ini?» to the chooser. Its look is hers.
- The chooser's doors use `TombolKirim`'s existing busy state.

## 7. The allowance

**1,063 of 1,900 estimated minutes spent; 837 remain.** L3 cost 215, against the 160–174 forecast. The excess is one extra journeys run (37705723825) and the cancelled one before it (37703613326): the first run's job B verdicts could only be read on GitHub, so the run was repeated with its verdicts written as annotations. Later runs stay readable with no rerun.

## 8. For the Second Eye

### Job A was red, and it was red on main before L3 (resolved by §9)

Corrected, the crawl reads what Gate 6 had hidden from it. Two screens are wider than a 320 px window, so X.6 (D-046: responsive is part of PASS) turns job A red. Both are on main 886554b, walked locally by the same corrected crawl. L3 did not make either, and did not fix either: each is a layout change, and layout is Daisy's (no UI/UX change without a ruling).

| Screen | At 320 px | Branch | Main 886554b | Proposed |
|---|---|---|---|---|
| «Laporkan masalah» (`/lapor`), every role, every page it is opened from | 440 px wide. The form's grid column takes the width of its widest part (`form.pin-lapor > p.pin-meta`, `label.pin-lapor-isian`: 408 px) | 144 pages | 62 pages | **CR-93**: the form's column may shrink to the window (`minmax(0, 1fr)` or equivalent; Daisy's call) |
| Konfigurasi · the roles list (`#roles`), school admins | 374–380 px wide. The revoke form (reason field + button, 237 px) sits beside the name on one row | 3 pages | 5 pages | **CR-94**: the revoke form may wrap below the name on a narrow window (Daisy's call) |

Asked: may CR-93 and CR-94 be fixed? **The owner approved their correction on 8 Oct, limited to the 320 px overflow, as a small landing before L4 (§9).** Nothing was relaxed in the crawl.

### Also noted
- `/keluar` and `/api/evaluation/assume` build redirects from `request.url`, as `/mulai` did. They predate L3 and are left unchanged. Behind `next start` they would name `localhost`; on Vercel they name the public host.
- C12k's arrival criterion was restated by D-132 C9 (an owner ruling): a teacher who holds two purposes is asked, so she arrives at the chooser.

## 9. The corrective landing: CR-93 and CR-94 (owner's ruling, 8 Oct)

The ruling approves correcting both, **limited to the 320 px overflow**: no redesign; no change to content, authorization, database contracts, business logic or journeys; wider widths kept as they were. Commit **36c89dd**: two source lines and one pin test.

| | Cause, measured in Chromium | Change |
|---|---|---|
| **CR-93** «Laporkan masalah» (`/lapor`) | The picture field (`input type=file`, in `TangkapanLayar`) set the form's grid column to its own width. Every field in the form became 408 px wide, the page 440 px at a 320 px window | `src/app/experience.css`: `.pin-lapor input[type="file"] { max-width: 100%; min-width: 0; }`. It sets no width, so where the field fits it keeps its own. This follows the existing `.pin-ung-isian input[type="file"]` rule, without its `width: 100%` |
| **CR-94** Konfigurasi · roles list | Each row (`li.flex`) held the name and the revoke form (237 px) side by side and could not wrap: 374 px at 320 | `src/app/konfigurasi/page.tsx`, the roles row only: `flex` → `flex flex-wrap sm:flex-nowrap`. Below 640 px the revoke form wraps below the name; from 640 px up the row does not wrap, as before |

A first attempt used `flex-wrap` alone. That also changed the row at 768 and 1024 px, where long rows put the revoke form below the name. This was caught by the pixel comparison below and limited to below 640 px before the commit.

**Measured in the running build** (Chromium, signed in as a school admin; scripts in the coordinator's scratchpad):

| Width | `/lapor`: page width, before → after | `/lapor` form vs the old rule | Konfigurasi: page width, before → after | roles list vs the old markup |
|---|---|---|---|---|
| 320 | 440 → **320** | taller by 21 px (the field now within its column) | 374 → **320** | rows wrap |
| 375 | 440 → **375** | taller by 21 px | 375 → 375 | rows wrap |
| 480 | 480 → 480 | **pixel-identical** | 480 → 480 | rows wrap |
| 600 / 639 | unchanged | **pixel-identical** | unchanged | rows wrap |
| 640 | 640 → 640 | **pixel-identical** | 640 → 640 | **pixel-identical** |
| 768 / 1024 / 1280 | unchanged | **pixel-identical** | unchanged | **pixel-identical** |

«Before» is the old build for 320 and 375. For the other widths it is the old rule reproduced in the same page: `/lapor` with the new rule overridden, and the roles rows with the two new classes removed. Each comparison is pixel by pixel.

**Tests and runs:**

| Check | Result |
|---|---|
| **PENUTUPAN-L01** (new, static) | Pins both rules. **Red on the old source**, naming both defects (440 px, 374 px); green on the new |
| Full local suite, fresh seeded database, on 36c89dd | **644 passed, 0 failed** (643 + PENUTUPAN-L01; the same one justified local skip). `tsc` 0 errors; ESLint 0 errors (the same 6 warnings, each also on main) |
| Seeded crawl, local, against the corrected build | **GREEN, EXIT 0.** The same 14 personas and the same per-persona page counts (387 pages); **0 broken**. Before: 147 broken, every one X.6 |
| CI **37720147696** on 36c89dd | **18 of 18 jobs succeeded** |
| Journeys **37720149799** on 36c89dd | **Job A: «Crawl A GREEN»**, 387 pages across 14 personas, 0 broken: the 147 overflows are gone and nothing new failed. **Job B: 75 PASS, 1 FAIL**, the FAIL being S23q (CR-52, unchanged; §10). BD11, L3D, L3A and C12k PASS, as in 37705723825 |
| main **2875f7c → 36c89dd** (a fast-forward to the head CI 37720147696 proved) | CI on main **37722876255**: E1. The baseline's own check passed, and the proof-reuse step cancelled the run, the shape of 37708857395 and of L1's 37584213073 |
| Staging | No migration in this landing (staging stays at 177). **environment-facts 37723418842 (read only): success**. Staging's app runs main's code and its database main's migrations |
| Production | Untouched: no production request file, workflow, secret or setting |

**Allowance:** 1,189 of 1,900 estimated minutes spent, 711 left. The corrective landing cost 126: one CI run, one journeys run, main's E1 and the read-only facts check.

**Reconciled:** branch, main and the head CI proved are one commit, **36c89dd**. Main now also carries the audit-tooling commits that had been on the branch only: the crawl's «Komputer siapa ini?» answer and «404» match, the verdict annotations, and the Golden School request records. The corrected crawl stays in `audit/crawl.mjs` on main, and job A runs it on every journeys run.

## 10. For the Second Eye's holds

An independent, read-only audit (`docs/reports/PINTAR-4.0-L3-CRITERIA-AUDIT-2026-10-08.md`) compared every test and journey criterion changed between 886554b (before L3) and 36c89dd.

**No criterion was weakened without authority.**
- **Restated with a cited ruling:** every changed expectation is either setup only (the test chooses its context first) or restated, citing D-132 C3, C4, C7, C8 or C9, and the ruling text supports it.
- **Stronger than before:** BD11, S23r, BOB20-A01, BOB18-A01, DAISY-05-STRUKTUR-02 and staging A8.
- **Manifest:** no test removed, no runner changed, no skip added to an existing test. The new database tests F22-K01 to K06 carry the suite's standard justification for database tests («needs a reachable Postgres…», as F21-D01 does) and ran in CI.
- **Journey verdicts:** no FAIL or BLOCKED turned into NOTE or PASS. `step()` still fails on any thrown error, and the new waits that tolerate a timeout are each followed by an assertion.

**The C9-related changes, against the recorded rulings:**

| Criterion | Before → after | Ruling |
|---|---|---|
| C12k (audit/c12.mjs) | Guru lands on `/mengajar` → lands on `/` (the chooser). Kelas 1A must still open from `/mengajar`; identity rows unchanged | D-132 C9: «No door + multiple available purposes = ask». F22-K01 shows an enrolled Guru holds Mengajar and Belajar |
| BOB06-R01 | Head of department `/pimpinan`, Admin platform `/konfigurasi` → `/`, through `/mulai` | C9 |
| BD11 | The teacher's home was recorded only → asserted: `/mengajar` with Mengajar · SD, or `/belajar` with Belajar, by what she holds; the chooser must not show Mengelola | C9 (with C5) |
| BOB26 / BOB27 / BOB12 | Arrive at `/mengajar` → arrive through `/mulai`, which must still land on `/mengajar` or `/belajar` | C4, C9 |
| Staging G1, O4, L2, U2a, A8 | Landings move to `/`, then a chosen context; A8 now exactly `/` then `/pimpinan` | C7, C9 |

**For acknowledgement** (each is consistent with a ruling, but the Second Eye should see it):
1. **C12k was restated after it went red** (commit f9ec4ff, after the local run where it failed). D-132 C9 supports the new criterion, but the C-12 acceptance text still reads «home `/mengajar`» (`docs/coordination/design/EDUCATOR-AS-LEARNER-TICKETS.md:703`), and D-132 does not name the enrolled-Guru case. C12k no longer checks that Mengajar, once chosen, lands on `/mengajar`; L3D and BD11 check that instead.
2. **S2 was inverted.** In «Seluruh platform», Konfigurasi must now *not* link Studio. This rests on C7's list of platform views, which omits Studio, not on an explicit sentence.
3. **One property lost its test.** The deleted `pintuMasuk` sweep proved that an unreadable roles answer opens no door. The new code fails closed (`src/lib/konteks-server.ts:42` returns no doors on error), but no test pins it now. Proposed: one static pin, in a later landing, if the Second Eye wants it.
4. **BOB19-K01** pins that Admin platform, in a school's context, still reads the platform-wide «awaiting a first role» list (J1.4; §2 records why). No ruling names this explicitly.

**CR-52 stays governed.** S23q is still a FAIL in every job B, with its verdict logic unchanged (`if (kurang.length) rec.verdict = "FAIL"`). It is recorded as an A item:
- D-123(1): «CR-52 → A».
- D-130(e): «a known outstanding item».
- The closure register.

**The corrected crawl stays.** The «Komputer siapa ini?» answer, the per-persona context choice and the word-only «404» are in `audit/crawl.mjs` on main. What counts as broken is unchanged: server errors, the framework's error page, navigation and page errors, W9, and X.6 at 320 px.
- **Coverage:** each persona now walks its chosen context. Another context's pages reach the chooser and are not counted.
- **«404»:** the change cannot hide the framework's not-found page, which still matches by its sentence and by «404» as a word.
