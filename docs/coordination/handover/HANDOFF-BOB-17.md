# Bob → coordinator: BOB-17 (release blockers speak in codes, D-011; audit M7)

**Head:** `cf025b3`, with Integration 12 merged in (`f48da56` / `141362e`).

**Merge conflicts, resolved as agreed:**
- `selftest/app.test.ts`: BOB19-A01 and BOB11-A02 both kept.
- Manifest version: 96 vs 97, now 98.
- `galat-kontrak.ts`: merged cleanly.
**The contract was published early**, at `7bc5a25`, so Daisy could build DAISY-16 against it: `src/lib/terbitan-kontrak.ts`, the "the blockers" section.

## CHANGED

**The catalogue** (`src/lib/terbitan-kontrak.ts`):
- **`KODE_HAMBATAN`**: nine codes.
  - `READINESS_TEXT_ERROR` and `READINESS_TEXT_WARNING`: unacknowledged findings in the learners' text, one blocker per lesson (count, lesson_id, lesson). lesson_id is absent for a finding about the course as a whole.
  - `READINESS_ITEM_ERROR` and `READINESS_ITEM_WARNING`: question-quality findings, one per lesson and pattern (count, lesson_id, lesson, pattern).
  - `READINESS_NOT_VALIDATED`, `READINESS_RETURNED` and `READINESS_AWAITING_REVIEW` (count), `READINESS_NO_RELEASE` and `READINESS_NOT_SEALED`: the package's own state.
- **`HAMBATAN_MENAHAN`**: the three that block (TEXT_ERROR, ITEM_ERROR, RETURNED).
- **`Hambatan`**: the shape `{code, count?, lesson_id?, lesson?, pattern?}`.
- **`POLA_MUTU_SOAL`**: the four patterns `run_mcq_quality` names today. A new pattern shows the general pattern line.
- **Copy helpers:** `kunciHambatan` and `kunciPola` give the copy keys; an unknown code or pattern gets the general line. `kalimatHambatan(h, s, angka)` composes one line: count, words, pattern and lesson. `kesiapanDari` makes the same BLOCKED / ACTION_REQUIRED / READY decision as the database.
- **Copy:** `hle.ts` has one line per code and pattern, the general lines and `studio.hambatan.pelajaran`. The wording is mine, and Daisy owns it.

**The database** (migration `20261016100000_release_blockers_speak_in_codes.sql`):
- **`publish_readiness`** returns `(status, blockers jsonb)`. It decides BLOCKED by code, no longer by matching `%ERROR%` in its own sentences. The same findings, counted the same way, make the same decision; only the telling changed.
- **`studio_package_state`** returns `reasons jsonb`. It is the findings blockers plus its five lifecycle codes, with the same checks and the same surface state as before.
- **The publish trigger** (`enforce_release_publish_readiness`) reads the new shape. Its refusal is still PR040 `RELEASE_NOT_READY`, and its developer message now lists codes.
- **`freeze_release`** is unchanged: it passes `to_jsonb(blockers)` straight through.

**The screens.**
- The Terbit step (`LangkahTerbit.tsx`, Daisy's) and the package page's reasons list each draw a blocker through `kalimatHambatan`. That is a one-line change in each, so the lane works on its own. DAISY-16 owns how they look.
- The freeze action's `hambatan` is now `Hambatan[]`.

**The seeds.** `learning_cycle`, `official_bootstrap` and `human_evaluation` each check that their content is publishable before they release it. They held the blockers as `text[]`, so on a fresh database the seed stopped and every db suite after it aborted. My first full local run caught this, and it was fixed at `8b77f7b`. They now hold the jsonb list and print it if the content is not publishable. No fixture content changed.

**A fixture, found by the shared-stack rehearsal.** When `canonical_package` in `fable05.sql` reuses an existing course, it took the module's definition with `limit 1` and no order. A school's QUICK paper on the same module, committed there by the FABLE-05 T1 suite, could come back first. F05 then started that school's paper as canonical content and aborted, and so did every recheck after `db-task1-gates`. CI never met it, because every job has a fresh stack. It now takes the canonical tenant's own definition, oldest first (`c1ffea2`). Red: that database aborts fable05. Green: 23 of 23, and the shared stack's recheck is 235 of 235. This is evidence for S2/S4 of the CI audit: suites that share a database expose ordering assumptions that fresh stacks hide, so a shared stack needs its fixtures to choose deterministically.

**BOB-11 gate review, riding this run** (`bd77f35`):
- `read-url` signs for an hour only lesson media redirected with `alih=1`.
- A profile photo keeps 60 s, with or without `alih`. So does the JSON answer.
- **BOB11-A02 (app)** reads the lifetime from the signed URL storage issued (its token's `exp - iat`), not from what the route says. It covers four cases: profile with `alih`, profile without, media with `alih`, media without.
  - Red on the code before the fix: `a profile photo through alih=1 was signed for 3600 s, not 60`.
  - Green after it, with BOB11-A01 still green.
  - Locally this was rehearsed against my fake Supabase, which signs with the requested lifetime. CI's run against the real storage is the one that counts.

**Deleted:** `createReleaseAction`, `freezeReleaseAction`, `publishReleaseAction` and `withdrawReleaseAction`, the four release form actions no page used. BOB07-K01 stays green.

## PROOF

| test | red before | green after |
|---|---|---|
| F12-P04 (db) | on a database without the migration: `with every findings rule planted, readiness was BLOCKED with ["1 temuan ERROR pada teks siswa", "2 temuan WARNING pada teks siswa belum diakui", "1 temuan ERROR mutu soal", …, "mutu soal: POLA_UJI_GALAT (1 soal)", …]; a course in review with no release reads ACTION_REQUIRED: ["2 bagian isi menunggu persetujuan akademik", "paket ini belum memiliki terbitan"]; …` (6 problems) | every rule is its own code with its parameters; BLOCKED, then ACTION_REQUIRED, then READY and `[]` as the findings are acknowledged; the package walks through all five lifecycle codes; the nine codes met are exactly the catalogue's |
| BOB11-A02 (app, gate review) | on the route before `bd77f35`: `a profile photo through alih=1 was signed for 3600 s, not 60` | a profile photo 60 s with and without `alih`; lesson media 3600 s with `alih`, 60 s without |
| F05 fixture (`c1ffea2`) | on the shared stack after `db-task1-gates`: fable05 aborts, `the assessment definition does not belong to the enrolment's institution, and is not canonical content distributed to it` | 23 of 23; the recheck on that stack 235 of 235 |
| BOB17-K01 (static) | on the code before BOB-17: `the release contract has no blocker catalogue …; publish_readiness … still writes a sentence; studio_package_state … still writes a sentence; the Terbit step … shows a blocker other than through kalimatHambatan; the package page shows a reason other than through kalimatHambatan; src/app/studio/actions.ts still exports createReleaseAction; …` (all four actions) | pass |

**BOB17-K01 in full:**
- The database's codes are exactly the catalogue's.
- The codes that block are the ones the database blocks on.
- Every code and pattern has its words in both languages, with no machinery words.
- **A planted sentence never reaches the Terbit step:** `{code: "2 temuan ERROR pada teks siswa"}`, a bare string blocker and an unknown pattern each render as the copy table's line.
- Both screens draw blockers through `kalimatHambatan`.
- The four actions are gone.

**New plant, bob03-10.** It puts "temuan ERROR pada teks siswa" back where the text-error code belongs; F12-P04 goes red for it, in the existing `db-bob03-gates` job.

**Restated for the changed requirement (named):**
- **F04-T15:** the blocker names its pattern as a parameter of its code, no longer inside the sentence "mutu soal: X".
- **F05-T19:** the reasons are codes. What is shown beside a code's words (the lesson, the pattern) must carry no lifecycle enum or version string. A code such as `READINESS_NOT_VALIDATED` contains "VALIDATED", but the code itself is never shown.
- **fable02, fable04, fable05, fable05t1:** `v_blockers` is jsonb. Three suites only print it on failure.
- **`db-bob03-gates`' control:** 6 → 7 green rows.
- **Tripwires:** 121 → 122.
- **Manifest:** v95 → v96 (BOB11-A02).

No test was weakened, skipped or deleted.

## CI

I dispatched one run, **ci #212**, on `cf025b3`, after merging Integration 12 into the lane, and haven't waited on it; please read the result there. It covers BOB-17 on top of Integration 12, so BOB-17's gate can reuse it (D-043).
- **Local, before dispatch:** on the merged head `cf025b3`:
  - **Full suite, fresh database:** 353 passed. F01-R07 fails, as it always does locally. 28 justified skips: the network tests, BOB11-A02 and BOB19-A01 among them.
  - **Plants:** 81 of 81 proved their gate.
  - **Shared red cases:** all 15 db-* red-case gates ran on one shared stack. Each exited 0, the schema digest stayed the same, and every recheck was 235 of 235.
  - **Seed and history:** the migration history matches the repo (122 files), and the seeds and lifecycle load.
- One run, no new job.

## CONTRACT

- `publish_readiness(uuid) → (status text, blockers jsonb)`.
- `studio_package_state(uuid) → (surface_state text, reasons jsonb, preview_lesson_id uuid)`.
- `freeze_release` returns `blockers` as that jsonb list.
- No PR0xx codes changed.
- **For DAISY-16:** show each blocker with `kalimatHambatan`, or with your own layout from `kunciHambatan`, `kunciPola` and the parameters. Never show `code` or `pattern` themselves.

## MIGRATIONS

`20261016100000`, forward-only:
- drops and recreates `publish_readiness` and `studio_package_state`, because a function's result type cannot be altered in place;
- replaces the publish trigger's function;
- updates the registry note for `studio_package_state`;
- ends with terminal checks: no sentence left in either function, patterns still read from the findings, neither function anon-executable.

No table, column or data changes.

## COPY

Sixteen keys: `studio.hambatan.*`, nine codes, four patterns and three general lines. The wording is mine; Daisy owns it.

## QUESTIONS

None. Noted for BOB-13, as you asked: `may_preview_lesson_media` and `may_read_lesson_media` scan every lesson's media for the path, and media playback will want an index on media paths at the capacity track's scale.

## READY

Yes, once ci #212 on `cf025b3` is green.
