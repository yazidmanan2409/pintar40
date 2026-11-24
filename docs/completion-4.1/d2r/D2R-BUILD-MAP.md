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
| R-c | **Public data (rev. 4 correction):** `verify_certificate` returns `TABLE(pass, predikat, institution, date, validity)` (live at 308), and `/api/verifikasi/[token]` (`route.ts:29`) passes `predikat` through. **Rev. 4:** the RPC returns `predikat` null for every certificate. The OUT columns and `assert_public_surface()` are unchanged. **Render sites:** the card `KartuSertifikat.tsx:80`, the printable record `:153` (C1-R4), the A4 sheet (`sertifikat-lembar`, `LembarA4.tsx`), `/verifikasi/[token]/page.tsx`, and the learner's own page `belajar/[tugas]/sertifikat/page.tsx:166` (not public; Daisy's call). Also `src/lib/certificates/verification.ts`, `src/lib/sertifikat-kontrak.ts` and the `sertifikat.predikat` keys in `hle.ts`. **Kept:** the band in `certificate_eligibility` (`20261102100000`), the sealed snapshot and internal reports |
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
| D2R-H16 | RPC `session_answers`, both modes (rev. 4 names it). It returns `posisi` (own chosen positions) and no correctness. Classified on the guard's list; a certifying sitting returns no correctness or key, by a direct call | — | Add `benar` to its output |
| D2R-H17 | RPC `hasil_koreksi_saya`: a correction's `alasan` gives no per-question detail for a certifying sitting (this tightens H07) | — | Add the item's key to the reason |
| D2R-H18 | **The list guard** (Z-D1-02 style, `selftest/z-d1.test.ts:71`): every function granted to `authenticated` that reads `responses`, `presented_items`, `item_options` or the key tables is on a classified list (learner-safe, learner-restricted-by-capture, or staff-only). Any new unclassified learner reader fails. **Plants** (as in `PILIHAN_TANAMAN`): a planted SQL function, a `BEGIN ATOMIC` one and a view, each must be named | — | Each plant must be named |
| D2R-H19 | **The section line** (no threshold in 4.1): every section in `reading_map` for a certifying sitting is revisit-advice («Baca lagi juga:», with the no-blame note). `tujuan_gerbang_kode` is allowed as section advice. «Bagian yang masih perlu dipelajari:» is not drawn | — | Draw `hasil.target.ulang` |

### R-a, R-b, R-c, R-e, R-f, R-g

| Id | Case | Plant |
|---|---|---|
| D2R-W01 | R-a and R-b: the three strings in ID and EN, word for word (Daisy's); the sheet guard B6C-SHEET-01; the rendered check R-13 on the new A4 | Restore the old line |
| D2R-C01 | R-c (rev. 4): for a **banded** certificate, `verify_certificate` returns `predikat` null **and** `/api/verifikasi/[token]` returns null | Return the band from the RPC |
| D2R-C02 | R-c: no «Predikat» on the card (`:80`), the printable record (`:153`, C1-R4), the A4 sheet or `/verifikasi/[token]` | Render it again on one site |
| D2R-C03 | R-c: a **list test** fails on any Predikat render site outside the internal reports | Add a render site |
| D2R-C04 | R-c: the band is still in `certificate_eligibility`, the snapshot and the internal reports. The OUT columns and `assert_public_surface()` are unchanged. F04-S01 is green | Drop the band from eligibility |
| D2R-C05 | §6.3a: `verifikasi.lulus` reads «Lulus» / «Passed»; the public contract is unchanged | Restore «Memenuhi capaian» |
| D2R-E01 | R-e: an A1 extension is recorded with the result and shown to staff. It is absent from every public surface (`verify_certificate`, the API, `/verifikasi`, the card, the A4 sheet) **and from the public snapshot** (rev. 4) | Put it in the snapshot |
| D2R-F01 | R-f: the ordinal equals the lineage count at the start (across versions, ruling 46); fixed under the lock; on the learner's result and staff views; absent from public reads | Compute it at read time |
| D2R-G01 | R-g: after Pemetaan Awal, with lessons unread, the chapter page offers Uji Penguasaan with the advisory line; the database and the test page unchanged | Restore `read >= total` |

## 5 · Rev. 4 (spec §7, final 01:05Z, on `claude/bob-41-master-plan`) folds in Sharon's `D2R-PRECODE-R-c-f.md` (`dfb5167f`) and Daisy's `D2R-KATA.md` (`e64f94c2`)

What rev. 4 settles here:

- **R-c:** the band goes from the public data as well as the pages. Cases C01–C05 above.
- **R-d:** `open_assistance` reads the policy captured on the sitting. F-1 still applies: `assistance_state` reads the same capture.
- **R-e:** absent from every public surface and from the public snapshot (E01).
- **R-h:** every learner route is named, each with a plant: `session_review` (H01–H02), `session_answers` (H16), `reading_map`'s reasons (H03–H04), `hasil_koreksi_saya` (H07, H17), and the print and export (H09, H10, H15). There is also a list guard (H18), and section lines are revisit-advice only (H19).
- **Strings:** Daisy's set at `e64f94c2`. «Materi Pembelajaran» is in R-b, and the admin column follows it. `verifikasi.lulus` reads «Lulus». R-g's string is `siklus.siap.saran`.
- **R-1 (Z-READINESS):** verified on `claude/next-base`. If no red-first test exists, one is added on `claude/d2r` as its own commit.

Still to settle at the build, with Sharon: the shape of the capture column (F-2), and refuse vs null for `session_review`. I propose refusing, as PRE_TEST already does: it closes direct calls, and the counts come from `session_outcome`.

**What is not changed** (spec §6.1 «Preserved unchanged»):
- `certificate_eligibility`, the sealed pass mark and the gate;
- official evidence;
- correction, review, reissue and revocation;
- the certificate's identity and number;
- `verify_certificate` and `assert_public_surface()`;
- the name never appearing on the public page;
- D-1's and V2's behaviour (Z).
