# PINTAR 4.1 · Status at the pause

**Bob (Chief Architect), Thursday 19 November 2026, about 23:00 UTC (Friday 06:00 WIB).** On the owner's instruction,
the whole team stops at a safe point, and the sessions are saved for later. This report records where everything
stands and how to resume.

---

## 1 · In one paragraph

**A3 is accepted on staging,** at 290 migrations. Production is untouched at 111. **C3w-1 (AI-assisted drafting) is
under way:**
- step 1 (Daisy's four Studio fixes) is complete and green;
- Sharon has passed the test cases for her five security conditions;
- the first build chunk is written, with six of its seven cases green;
- the seventh waits on chunk 2, by design.

**Evaluation E** waits for J1's and J2's sheets, Friday at the earliest. **Guest Mode (4.5)** is fully planned and
paused until 4.1 is accepted.

**No production change, provider activation, spending or gate bypass happened.** Nothing needs the owner's decision to
resume.

---

## 2 · Where 4.1 stands

```
Plan ─► B0 ─► A1 ─► C1w ─► B1 ─► B2 ─► A2a ─► A2b ─► C2w ─► A3 ─► C3w ─► Z ─► walkthrough ─► 4.1 accepted
  ✔       ✔     ✔     ✔      ✔     ✔     ✔      ✔      ✔     ✔      ◐     ○        ○
Separate track: E (AI provider evaluation) ─► teacher judging ◐
```

| Batch | State | Evidence |
|---|---|---|
| **A3**, one writer per sitting with safe recovery | **ACCEPTED on staging at 290** (ruling 63) | PR #26 merged as `706fe8c5` (its tree equals the frozen `5755c6c2`). staging.yml 44469129320 (284 → 290). The AFTER read moved only lines 10 and 78, as predicted. environment-facts 44469835665 green. Sharon's promotion PASS is final (`A3-PROMOTION-706fe8c5.md`) |
| **C3w-1**, AI-assisted drafting (stand-in provider only) | **In progress** (§3) | `claude/c3w-1` |
| **Z**, the whole of 4.1 as one candidate | Not started; its readiness list is maintained (`Z-READINESS.md`) | About 4–6 days once C3w-1 is accepted |
| **The observed walkthrough,** then 4.1 acceptance | Plan drafted (Daisy); Dr Gladys reviews its educational meaning | A date from the owner |

**Staging:** `keijhmdtsgrfvnvocfvk`, 290 migrations.
**Production:** `trtlvibiybwixfumjrrx`, 111 migrations, untouched.

---

## 3 · C3w-1 in detail

| Step | State | Evidence |
|---|---|---|
| **1 · Daisy's four Studio items** (Z-2, Z-3, N-6, N-7) | **COMPLETE** | Head `83a14825`. CI 44522491936 success. Journeys 44522496853 success on attempt 2 (attempt 1 failed in runner setup only; no test ran). Daisy passed all three sentences word for word, and Z-2's conditions, including exactly one `<h1>` on every Studio refusal page. Fixing Z-2 also found and fixed a page that drew two headings on every visit |
| **2 · Red cases for Sharon's five conditions** | **Sharon PASS** (`C3W-1-DESIGN-6e3c4231.md`) | Six cases at `6c10181f`, plus her seventh, **C3W-D1b**. She ruled three points: release locks all three rows; the timeout is one SQL constant (the call's limit + 5 min) with a static test; usage is a **closed-shape** counts-only `jsonb` (PR220 on anything else), and reading the stub's record is declined |
| **3 · Build chunk 1** (reserve, claim, settle, release, reconcile, sweep, the guard, lock order, the stub flag, R-3 control 4) | **Written; 6 of 7 cases green** | Matches all three of Sharon's rulings: `ai_lepaskan` takes the three locks in order; `ai_batas_kirim_tanpa_akhir()` is 7 min against the provider's 2-min timeout; `p_penggunaan` is checked by `ai_penggunaan_sah`. **C3W-D1 is red by design:** it needs chunk 2's request entry. Pushed at the pause as WIP (§7) |
| **4 · Sharon's R-3 tests** (R3-01 to R3-07, red first) | **Next on resume** | — |
| **5 · Chunk 2** (the request entry as the signed-in user, provenance and acceptance), then one full pre-flight, CI and journeys once, the hand-off | **After 4** | — |
| **6 · Reviews** (Sharon on the build; Daisy on the drafting screens' words), then the freeze and the staging promotion (owner) | Later | — |

**Safeguards held throughout:**
- AI drafts are **single-answer only** until the D-1 repair is accepted;
- **no provider call, key or spend**;
- the stand-in provider runs only under `PINTAR_AI_STUB_HARNESS=1`, never in staging;
- new migrations number after 290.

**The push grant:** `claude/c3w-1` may be pushed as a development branch only, with no merge, staging or production
(ruling 64).

---

## 4 · Test results tonight

| Run | Head | Result |
|---|---|---|
| CI 44509455872 | `6153f050` | success |
| Journeys 44509510146 | `6153f050` | job A success; **job B cancelled at the 60-minute limit** (browser install 41 min) |
| CI 44522491936 | `83a14825` | success |
| Journeys 44522496853 | `83a14825` | attempt 1 failed in setup (browser install; stack start); **attempt 2 success** |
| Full local pre-flight (Second Eye) | `6153f050` | 1297 passed, 0 failed; plants 175/175; red cases 11/11 |

---

## 5 · Evaluation E (AI provider evaluation)

- **Two teachers score all 60 questions independently.** Sheets expected **Friday 20 Nov at the earliest** (the
  teachers were in meetings on Thursday).
- **On arrival:**
  - convert each sheet (`lembar_penilaian.py tocsv`);
  - commit the checksums **before reading any score**;
  - J3 adjudicates;
  - then the results.
- **The provider map stays sealed until every score is final.**
- **A judge asked** whether pictures and tables were missing from the questions. The booklet was verified complete:
  the questions are text only, as written by the tools. A neutral answer was given, to be sent to all three judges
  alike. The question is recorded, without who asked.
- **Spending:** US$0.63 of the US$10 budget.
- **The D-7 checkpoint: 25 Nov, 17:00 WIB (10:00 UTC).** If no provider has qualified by then, it returns to the owner.
  Nothing is activated automatically.

---

## 6 · Owner decisions and rulings recorded this session (61–68)

| # | What |
|---|---|
| 61–62 | A3 Requests 1 and 2: the read-only BEFORE read, then the merge, staging's migration, the AFTER read and the hosted checks |
| 63 | **A3 ACCEPTED on staging at 290** |
| 64 | `claude/c3w-1` push granted (a development branch only) |
| 65 | The overnight working instruction (continue the approved plan; no new features; no bypass; one morning report) |
| 66 | Guest Mode planning direction: K1–K4 |
| 67 | **Guest Mode paused until 4.1 is accepted.** The plan is preserved at `3160b3d0`. The old 11 Sep project was checked, read-only |
| 68 | For the Guest Mode revisit: investigate the existing Free organisation (`yazidmanan2409`) for a new exploration project. Its two paused projects are not to be touched without a dependency check and approval |

**Open with the owner (none blocks the resume):**
- **The observed walkthrough's date.**
- **E's sheets** (send them on arrival).
- **The journeys workflow** (§8, a watch item): if the browser install keeps failing, the options are a cached browser
  or a longer limit. Both are CI-config changes, so the owner decides.
- **Production readiness PRQ-1:** switching the production watch on (recommended), and the backup and drill once their
  settings are confirmed.
- **The 10-adult pilot's decisions P-1 to P-7,** and the scoped legal questions. All of these come after 4.1 acceptance.
- **The Guest Mode revisit (after acceptance):** K5 (confirm the Vercel plan), K7 (any new or reused Supabase
  organisation), and K8 (the 11 Sep project; read-only so far: 83 migrations, the last on 16 Sep; nothing in the
  repository uses it; no traffic in the last 24 h).

---

## 7 · The pause: who stopped where, and how to resume

| Member | Stopped at | Resumes with |
|---|---|---|
| **Second Eye** (`claude/c3w-1`) | After pushing chunk 1 as WIP ("C3W-D1 red until chunk 2; not a hand-off"), plus a resume note at `docs/completion-4.1/batches/c3w-1-RESUME.md`. No CI or journeys on the WIP push | R3-01 to R3-07 red first → chunk 2 → one full pre-flight → CI and journeys once → the hand-off to Bob |
| **Sharon** (`claude/gracious-lamport-0m1qjr`) | Nothing pending; all records pushed | Second Eye's chunk-2 hand-off (the R-3 tests and the request entry) |
| **Daisy** (`ux-1/daisy-experience`) | Nothing pending; all records pushed | The drafting screens' words when Second Eye reaches them; Z's minors M1 and M2 (R-20) |
| **Pete** | Paused (unchanged); contacted only at the owner's request | — |
| **Bob** (`claude/bob-41-master-plan`) | All records committed and pushed. **The 2-hour driver and the morning report are switched off** | Send "resume" to the three sessions; re-arm the driver; check the WIP head and the resume note |

**Branch heads at the pause:** the team's reply SHAs are added in §9 as they arrive.

**How to resume (owner):** tell Bob "resume". Bob then:
1. sends "resume" to Second Eye, Sharon and Daisy;
2. re-arms the 2-hour driver;
3. verifies the WIP head against the resume note.

Nothing needs re-planning.

---

## 8 · Risks and watch items

1. **The journeys' browser install** was slow or failing on two of the last three runs (41 minutes once; a failure
   once). No test has failed because of PINTAR's code. **Watch, not a blocker.** If it recurs on the chunk-2 hand-off,
   Bob brings the owner the evidence and two options.
2. **The usage limit:** the account's weekly limit resets **Sun 22 Nov, 22:00 UTC.** Verification checks 1, 2, 4, 5 and
   6 stay paused until then. They are needed before Z, not before C3w-1.
3. **C3w-1 is the critical path to Z.** Sharon's review queue was not delaying it tonight; each of her verdicts returned
   within minutes.
4. **The D-1 repair** (multi-answer questions displayed incorrectly to learners; 7 live readers) lands in Z. Staging
   holds no multi-answer items, so its containment was not triggered.

---

## 9 · Branch heads at the pause

| Branch | Head | Note |
|---|---|---|
| `main` | `706fe8c5` | A3's merge |
| `claude/bob-41-master-plan` | *(this commit)* | All records |
| `claude/c3w-1` | *(awaiting Second Eye's reply)* | Was `6c10181f` before the WIP push |
| `claude/gracious-lamport-0m1qjr` (Sharon) | `96e86fd2` | Paused, clean and pushed (22:51 UTC) |
| `ux-1/daisy-experience` (Daisy) | *(awaiting reply)* | |

---

## 10 · Key files

- `docs/completion-4.1/OWNER-RULINGS-4.1.md`: rulings 55–68
- `docs/completion-4.1/OWNER-RETURN-18NOV.md`: the running log (A3, C3w-1, E, Z readiness)
- `docs/completion-4.1/Z-READINESS.md`: everything to be true or triaged before Z
- `docs/completion-4.1/batches/a3-evidence/`: A3's BEFORE and AFTER reads, step 0, the requests
- `docs/completion-4.1/PRODUCTION-READINESS-REGISTER.md` and `PILOT-10-ADULTS-PROPOSAL.md`
- `docs/completion-4.1/D2-CERTIFICATE-CONDITIONS-SPEC.md`: the certificate refinement, after Z
- `docs/roadmap/GUEST-EXPLORATION-4.5-PLAN.md`: Guest Mode, paused (as at `3160b3d0`)
