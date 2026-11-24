# D2-R · 1c · The read-only build map and the red-first case list (Second Eye)

**What this is:**
- **Source:** `claude/d2r`, from `claude/next-base` `055738ba`, which is main `61a6ff9e` plus infra-83.
- **Read from:** the repository, and from a local database at 308 (`siap.sh` READY), read with `pg_get_functiondef`.
- **Changes:** none to product code, migrations or tests. This is a map and a case list for spec revision 4.
- **Spec:** `D2-CERTIFICATE-CONDITIONS-SPEC.md` rev. 3, §6.1–6.2 (`claude/bob-41-master-plan`).
- **Line numbers:** as of `055738ba`.

## 0 · The modes (`public.mode_policy`, live at 308)

| Mode | `certifies` | `allows_assistance` | `reveals_rationale_on_review` | D2-R |
|---|---|---|---|---|
| `POST_TEST` (Uji Penguasaan) | **true** | **true** | true | **R-d and R-h apply** |
| `STANDALONE` (Asesmen Mandiri) | **true** | **true** | true | **R-d and R-h apply** |
| `TEST`, `EXAM`, `PAPER` | true | false | true | R-h applies; assistance is already refused (pin it) |
| `PRE_TEST` (Pemetaan Awal) | false | true | false | unchanged (pin) |
| `QUICK` (Uji Cepat) | false since BOB-50 (`20261113100000`) | true | true | unchanged (pin) |
| `PRACTICE`, `PUBLIC_DEMO` | false | true | true | unchanged (pin) |

**Three findings that shape the build:**

**F-1. `assistance_state` never consults the mode.**
- Help becomes `due` purely on the definition's `hesitation_window_seconds` (`20260913093000_lesson_progress_and_assistance.sql:303`).
- So in a mode that refuses assistance, the player would still show the help offer, and then `open_assistance` refuses it.
- R-d must close both calls, not only `open_assistance`.

**F-2. The policy is read live from `mode_policy` at each call, never captured on the sitting.**
- `open_assistance` (`20260914093000_mode_policy_quick_assessment_integrity.sql:118`) reads it live.
- So R-d's «captured at the start» needs:
  - a new column on `assessment_sessions`;
  - the start path (`start_learning_session` → `assemble_session`; latest `start_learning_session` in `20270121220000_a_sitting_has_one_writer.sql`) to write it;
  - the existing `pass_mark` / `pass_mark_source` capture as the precedent.
- The same capture serves R-h: whether the sitting discloses per-question detail.

**F-3. `mode_policy.reveals_rationale_on_review` exists but is read by nothing.**
- `session_review` hard-codes `if v_s.mode = 'PRE_TEST' then raise …`.
- R-h's «governed purpose» rule should read the captured `certifies` (spec: «the mode's `certifies` policy, not its display name»). It should not add another mode list.

## 1 · R-d: each certifying mode's assistance path

| Path | Where | Today, in POST_TEST and STANDALONE |
|---|---|---|
| The window reaches the player | `src/app/belajar/_components/PermukaanAsesmen.tsx:233` passes `session.hesitation_window_seconds` as `assistanceWindow`, read from the definition by `assessment_orientation` / the session read (`20270120170000…:63`) | Non-null, so the player schedules a help check (`src/lib/bantuan-terjadwal.ts` `jedaAwal`/`jedaBantuan`) |
| «Is help due?» | `ItemPlayer.tsx:470–530` → `engine.assistanceState` (`src/lib/assessment-engine/index.ts:250`) → RPC `assistance_state(p_presented_item)` | `due` turns true after the window; the help section (`ItemPlayer.tsx:777`, `[data-bantuan-soal]`) appears |
| Opening a level | `ItemPlayer` → `engine.openAssistance` (`index.ts:264`) → RPC `open_assistance(p_presented_item, p_level)` | **Served:** level 1 `arah_berpikir`, 2 `petunjuk`, 3 the worked example |
| Dismissing | `engine.dismissAssistance` (`index.ts:270`) → `dismiss_assistance` | Recorded |
| **A direct call** | `open_assistance` and `assistance_state` are granted to `authenticated`, checking only `session_is_mine` | **Served the same:** a learner's client can call both on their own presented item |
| The AI gateway | `src/ai-gateway/contexts.ts:22` names `open_assistance` as the source it re-checks (INV-02) | Follows the database |
| The lint | `assert_mode_policy_complete()` (`20260914093000`), and BOB-50's lint shape (`20261113100000` §2, derived from `pg_enum`) | No rule `certifies ⇒ not allows_assistance` today |

**R-d's change points, for rev. 4:**
- the `mode_policy` rows for `POST_TEST` and `STANDALONE` (`allows_assistance := false`);
- the captured policy column, written by the start path;
- `open_assistance` and `assistance_state`, both reading the capture: `assistance_state` returns a null window, so the player offers nothing;
- the lint;
- open sittings keep their captured value (spec §6.2).

## 2 · R-h: every learner route, RPC, print and export, per certifying mode

**How certifying modes reach the learner:**
- **POST_TEST** is the cycle's Uji Penguasaan, and its result has screens.
- **STANDALONE** has **no learner result page today.** A finished standalone sitting sends the learner back (`src/app/belajar/actions.ts:175–213` → `kembali`). Its results are reachable **only by calling the RPCs directly** with the session id: each checks only `session_is_mine`.
- **So R-h must be enforced in the database, not only in the pages.** A page-only fix leaves STANDALONE, and any direct call, open.

### 2.1 The learner RPCs that carry per-question detail, keys or explanations

| RPC (live definition) | What it returns | Per-question correctness | Keys or explanations | Callers |
|---|---|---|---|---|
| `session_review(p_session)` (rewritten in `20270123100000`) | `posisi, stem, is_safety_critical, jawaban_teks, benar, alasan, arah` | **Yes** (`benar`) | **Yes:** `alasan` = the chosen options' rationale; `arah` | `engine.review` (`index.ts:279`) |
| `reading_map(p_session)` (`20270123100000`) | `peringkat, tingkat, kode, pernyataan, modul, pelajaran, halaman, alasan` | Per objective, from per-question scoring | **Yes:** `alasan` = `string_agg(mt.remediation)` of the misconceptions behind the learner's **wrong options** (derived from wrong answers), and `tingkat` includes **`KUAT`** (a strength verdict; 74b: no «mastered» claim) | `engine.readingMap` (`index.ts:286`) |
| `session_outcome(p_session)` (`20270123130000`) | jsonb: `lulus, penguasaan, ambang, gerbang_keselamatan, diagnostik, per_domain, ringkasan, tujuan_gerbang(_kode), public` | No | Keys no. But **`per_domain` gives per-objective mastery** (74a: «no mastery verdict»), and **`tujuan_gerbang`** names the gate's objective | `engine.outcome` (`index.ts:275`) |
| `learning_delta(p_learning_assignment)` (`20260913091500`) | jsonb, pre → post per domain | No | No; gives per-domain figures | `engine.delta` (`index.ts:290`) |
| `hasil_koreksi_saya(p_session)` (`20270115110000`) | jsonb: correction, `alasan`/`reason`, original and current mastery | No | The correction's reason | **No caller in `src/`** (direct RPC only) |
| `hasil_belajar_sesi_saya()` (`20270123110000`) | Which sittings are in force | No | No | `engine.myResultsShown`, `laporan/cetak/actions.ts:63` |
| `session_paper`, `session_answers`, `record_answer` | The paper (keys stripped by `sanitize`, INV-01), own answers, `(response_id, outcome)` | No | No (`sanitize` forbids `ANSWER_KEY_FIELDS`, `index.ts:79–88`) | The player |

The engine's forbidden-key list (`ANSWER_KEY_FIELDS`, `AI_PROVENANCE_FIELDS`) guards **item payloads only.** Result reads (`Outcome`, the review rows, the reading map) pass through unsanitised. R-h's «engine forbidden-key list» needs a **result-side** check.

### 2.2 The learner routes

| Route | Reads | POST_TEST | STANDALONE |
|---|---|---|---|
| `/belajar/[tugas]/hasil` (`page.tsx:50–57`) | `outcome`, `review`, `delta`, `readingMap(post_session)`, history | **Affected:** shows review and reading map | n/a (cycle route) |
| `/belajar/hasil`, the Hasil Belajar summary (`src/lib/hasil-belajar.ts:65–87`) | `outcome`, `review`, `delta`, `readingMap(post_session)` per chapter | **Affected** | n/a |
| **Print:** `/belajar/hasil` printed (AksiCetak) | the same `hasilBelajar()` | **Affected** | n/a |
| **Print:** `/laporan/cetak` (`src/app/laporan/cetak/actions.ts:9,63`), the learner-scoped stamped printout | `hasilBelajar()` → the same reads | **Affected** | n/a |
| `/belajar` home (`page.tsx:139`) | `outcome(post_session)` → `ketuntasan` | Passed/not only, so likely unaffected (pin it) | n/a |
| `/belajar/[tugas]/lanjut` (`page.tsx:51`), `/belajar/[tugas]/sertifikat` (`page.tsx:101`) | `outcome` → `ketuntasan` / `lulus` | Pin | n/a |
| `/belajar/[tugas]/peta`, `/belajar/[tugas]` (`readingMap(pre_session)`) | the reading map of **Pemetaan Awal** | **Unchanged** (non-certifying; pin it keeps its explanations) | n/a |
| `/belajar/asesmen/[penugasan]` (PermukaanAsesmen) | paper, answers, assistance | R-d only | **R-d; no result screen** |
| **Direct RPC calls** (any client, the learner's own session) | every RPC in §2.1 | **Affected** | **Affected: the only path today** |
| **Export** | **None exists:** no learner download or `Content-Disposition` in `src/app` | n/a | n/a |

**Staff views are unchanged:** the teacher's `/mengajar/...`, Studio, Pimpinan and Konfigurasi read through staff RPCs (`susunCatatan`, `learner.result`, per-question evidence). They are outside R-h, and are pinned unchanged.

## 3 · R-a, R-b, R-c, R-e, R-f, R-g: where they live

| # | Where |
|---|---|
| R-a | `src/lib/hle.ts:4830` `sertifikat.jenis` («Sertifikat Penguasaan»), `:4833` `sertifikat.berkas` |
| R-b | `src/lib/hle.ts:4831` `sertifikat.diberikan` («telah menuntaskan») |
| R-c | **Rendered:** `src/components/sertifikat/KartuSertifikat.tsx`, `LembarA4.tsx` (A4), `src/app/verifikasi/[token]/page.tsx`, `src/app/api/verifikasi/[token]/route.ts`, `src/lib/certificates/verification.ts`, `src/lib/sertifikat-kontrak.ts`, `src/app/belajar/[tugas]/sertifikat/page.tsx`, and the predikat copy keys in `hle.ts`. **Kept:** the band in `certificate_eligibility` (`20261102100000`), the sealed snapshot, `verify_certificate`, `assert_public_surface()` |
| R-e | `extend_session_deadline` updates `assessment_sessions.authoritative_deadline` and `deadline_extended_count`, and writes `audit_write('assessment_session.deadline_extended', …)` with the old and new deadline. «Recorded with the result» therefore means carrying it onto the result or staff read; the public reads (`verify_certificate`, the certificate) must not gain it |
| R-f | **No ordinal column today:** `assessment_sessions` has none. The count is `percobaan_terpakai` (`20270114100000:269`), across the lineage (A3, `percobaan_penugasan_segaris`), under the `minta_percobaan` advisory lock (`20270114100000:799`) and the start path's lock. R-f adds a column set at the start, under that same lock, and shown on the learner's result (`/belajar/[tugas]/hasil`) and staff views only |
| R-g | `src/lib/siklus.ts` `posisi()` `:140–165`: `PENGUASAAN` is offered only when `read >= total`. The chapter page follows it. The database (`may_start_assessment`) and the test page already allow it (spec). The copy goes in `hle.ts` (`siklus.*`) |

## 4 · The red-first case list (spec §6.2, one plant per route)

Each case is written first, seen **red** on `055738ba` (or red against its plant), and then turned green by the build. Ids are provisional; the prefix is `D2R`.

### R-d · assistance

| Id | Case | Red today | Plant (must turn it red again) |
|---|---|---|---|
| D2R-D01 | POST_TEST: `open_assistance` levels 1, 2 and 3 each refused by a **direct call** | Served | Set the captured column true on the sitting |
| D2R-D02 | STANDALONE: the same | Served | The same |
| D2R-D03 | POST_TEST: `assistance_state` gives a null window, never `due` (so **the player** offers nothing) | `due` after the window | `assistance_state` without the capture check |
| D2R-D04 | STANDALONE: the same | — | The same |
| D2R-D05 | The rendered player in a POST_TEST sitting shows no `[data-bantuan-soal]` after the window | Shown | Restore the window in the session read |
| D2R-D06 | **Pins** (green before and after): PRE_TEST, PRACTICE, QUICK and the lesson-reading assistance still serve each level they serve today | — | A plant refusing PRE_TEST must turn it red |
| D2R-D07 | An **open sitting** started before the change keeps its captured policy | — | A plant that reads `mode_policy` live |
| D2R-D08 | **The lint:** fails if any `certifies` mode has `allows_assistance` | Passes wrongly (no rule) | `update mode_policy set allows_assistance = true where mode = 'POST_TEST'` |
| D2R-D09 | TEST, EXAM and PAPER still refuse (pin) | — | — |

### R-h · counts only, on every learner route

| Id | Route | Case | Plant |
|---|---|---|---|
| D2R-H01 | RPC `session_review`, POST_TEST | No `benar`, `alasan` or `arah` for a certifying sitting (refused or nulled, per rev. 4), by a direct call | Drop the capture check |
| D2R-H02 | RPC `session_review`, STANDALONE | The same | The same |
| D2R-H03 | RPC `reading_map`, POST_TEST | No `alasan` (misconception remediation from wrong options) and no `KUAT`; the sections still to learn only, per 74b, in both evidence states | Restore `alasan` |
| D2R-H04 | RPC `reading_map`, STANDALONE | The same | The same |
| D2R-H05 | RPC `session_outcome`, both modes | The counts (correct and incorrect) present and correct; no per-objective mastery verdict in `per_domain` (74a); `lulus` and eligibility present | Restore `per_domain`'s mastery |
| D2R-H06 | RPC `learning_delta`, POST_TEST | No per-domain mastery figures, if rev. 4 rules them a verdict | Restore |
| D2R-H07 | RPC `hasil_koreksi_saya`, both modes | No key or per-question detail | Add a key field |
| D2R-H08 | Page `/belajar/[tugas]/hasil` (rendered) | No per-question rows, keys or explanations; Lulus / Belum lulus, the retake line, the sections still to learn, the counts | Render `review` again |
| D2R-H09 | Page `/belajar/hasil` and its **print** (rendered, A4 print media) | The same | The same |
| D2R-H10 | **Print** `/laporan/cetak` (learner scope) | The same | The same |
| D2R-H11 | The engine: a result-side forbidden-key check (`benar`, `alasan`, `arah`, `kunci`, `is_correct`, `rationale`) on certifying reads | No check today | Let one key through |
| D2R-H12 | **Pins:** Pemetaan Awal's reading map keeps `alasan` and its levels; PRACTICE and QUICK keep their review explanations | — | A plant hiding PRE_TEST's `alasan` |
| D2R-H13 | **Pins:** the staff views (teacher evidence, per-question, Studio) unchanged | — | — |
| D2R-H14 | **Capture:** a sitting's disclosure follows its captured `certifies`, not a later `mode_policy` edit | — | Edit `mode_policy` mid-sitting |
| D2R-H15 | **Export:** none exists. A static pin fails if a learner route gains `Content-Disposition` without passing the same check | — | Add a route |

### R-a, R-b, R-c, R-e, R-f, R-g

| Id | Case | Plant |
|---|---|---|
| D2R-W01 | R-a and R-b: the three strings in ID and EN, word for word (Daisy's); the sheet guard B6C-SHEET-01; the rendered check R-13 on the new A4 | Restore the old line |
| D2R-C01 | R-c: no «Predikat» on the card, the A4 sheet, `/verifikasi/[token]` or the API's rendered output | Render it again |
| D2R-C02 | R-c: the band is still in `certificate_eligibility` and the snapshot; `assert_public_surface()` and F04-S01 green, with no new field | Drop the band from eligibility |
| D2R-E01 | R-e: an A1 extension is recorded with the result and shown to staff; absent from every public read and the certificate | Expose it on `verify_certificate` |
| D2R-F01 | R-f: the ordinal equals the lineage count at the start (across versions, ruling 46); fixed under the lock; on the learner's result and staff views; absent from public reads | Compute it at read time |
| D2R-G01 | R-g: after Pemetaan Awal, with lessons unread, the chapter page offers Uji Penguasaan with the advisory line; the database and the test page unchanged | Restore `read >= total` |

## 5 · Questions for spec revision 4 (they decide the cases above)

1. **R-h shape:** for a certifying sitting, should `session_review` **refuse** (as PRE_TEST does today), or return rows with `benar`, `alasan` and `arah` nulled? Refusing is simpler and closes direct calls. The result page then needs only the counts, which `session_outcome` can carry.
2. **`reading_map` for certifying sittings:**
   - drop `alasan` and `KUAT`, and keep only the sections still to learn;
   - and decide which evidence threshold names a section (74b: «confirmed with Sharon at the build»).
3. **`per_domain` in `session_outcome`** (and `learning_delta`): is a per-objective mastery number a «mastery verdict» under 74a? If yes, it is withheld from the learner for certifying sittings and kept for staff.
4. **The counts' source:** `session_outcome` gains `benar` and `salah` (correct and incorrect) for certifying sittings. Pre-test counts are unchanged.
5. **The capture column:** one jsonb policy snapshot on `assessment_sessions` (`kebijakan_mode`), or two booleans (`bantuan_diizinkan`, `rinci_diungkap`)? Sharon's call (F-2).
6. **STANDALONE's learner result:** none exists. Confirm that none is in scope (D2-R adds no route); R-h then only closes the RPCs.

**What is not changed** (spec §6.1 «Preserved unchanged»):
- `certificate_eligibility`, the sealed pass mark and the gate;
- official evidence;
- correction, review, reissue and revocation;
- the certificate's identity and number;
- `verify_certificate` and `assert_public_surface()`;
- the name never appearing on the public page;
- D-1's and V2's behaviour (Z).
