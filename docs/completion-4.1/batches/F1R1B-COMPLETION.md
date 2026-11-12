# C1w · F1-R1b: a key correction withdraws the explanations it makes stale (completion page)

**Its own commit, after F-1's fix, before Z.** Source: `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` on
`claude/bob-41-master-plan` (§0; §3 and §3a, Sharon's pre-implementation review; §3c, the owner's INV-03 decision A1;
§3d at `d45dfc05`, the release; §3e at `10529627`, document authority). Reviews: Sharon once, on the exact commit; Daisy
for the wording of §6 and one result review.

## What holds now

- **Status: built, awaiting review.** It gates nothing. **C1w is not promoted ahead of it** (Chief Architect, 12 Nov):
  until it is in, a key correction leaves stale explanations on the corrected revision.
- **INV-03 is amended in this same commit** (§3e): `docs/rebuild/03-PINTAR-INVARIANTS.md`, its manifest entry and
  ADR-0025, which cites ADR-0019. An option has a rationale, or names the confirmed key correction that withdrew it,
  never both and never neither.
- **One finding, closed here under §3 point 5's own requirement.** The brief expected the existing content checks to
  hold a later revision until the withdrawn explanations are written again. As built they did not:
  - `soal_draf_masalah` runs only on a question written in the app;
  - `lesson_package_check` runs only on an upload;
  - the content check (`validate_course_content`), the MCQ quality run and `langkah_konten` never read a rationale.

  So a copy of the corrected revision could have been submitted and approved with its explanations still missing. The
  same rule (`OPTION_REASON_MISSING`) is now held where a question's status moves past STRUCTURED
  (`penjelasan_terutang_jaga`). The confirming act alone is exempt (F13-K22). No other rule is added. **Please confirm
  this placement** (Sharon).
- **Wording: Daisy's** (`C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §6a at `143faf43`; her file `I6-I7-JAWABAN.md`
  §1 at `e48c4906`). The term is «belum dikaitkan / terkait» / «not linked». No screen uses «anotasi», «catat»,
  «catatan» or «tercatat». On the learner's result, a withdrawn explanation shows nothing in its place.
  ~~Four engineer's drafts for Daisy~~ (superseded by her lines).
- **Two adjustments, for Daisy to confirm at her visit:**
  - **The empty figure.** «Belum ada pemahaman keliru yang terkait dengan jawaban ini» is a new key
    (`laporan.komposisi.keliru_kosong`), shown only when nothing is withheld. Where a class's patterns are withheld
    under the class minimum, the existing «Belum ada pola jawaban keliru yang dialami cukup banyak murid…» stays,
    because "nothing linked" would then be false beside «{n} pola lain…». Bob confirmed this handling.
  - **English.** Studio's linked label is «Misunderstanding: {label}» (`studio.soal.miskonsepsi`), so the unlinked case
    reads «Misunderstanding: not linked», where her line has «Misconception: not linked». One term for both is hers to
    choose.

## As built

**Migration** `20270117140000_a_key_correction_withdraws_the_explanations_it_makes_stale.sql`:

| Step | What | Where |
|---|---|---|
| 1 | `item_options.rationale_withdrawn_by` (→ `key_corrections`, restrict); `rationale` nullable; INV-03's one CHECK replaces the old one; `key_corrections.penjelasan_dihapus` | columns |
| 2 | Who may set the reference: (a) the confirming act, on its corrected copy, for an option whose correctness it flips; (b) a copy of an option already holding it. Writing a rationale again clears it. Anything else: 42501 | `alasan_ditarik_jaga`, `_f1r1b_item_options_alasan` |
| 3 | `penjelasan_dihapus` is write-once | `key_corrections_guard` |
| 4 | **The confirming act** records what the flipped options said, then flips `is_correct` and withdraws the rationale and misconception code **in one statement**, on the draft copy, **before** the status loop. The sealed-content guard gains no exception | `tegaskan_koreksi_kunci` |
| 5 | A revision copy carries the reference | `salin_kursus_revisi` |
| 6 | `penjelasan_hilang`: from the head question while pending, from the record once decided | `koreksi_kunci_dampak`, `pratinjau_koreksi_kunci` |
| 6b | `ada_tak_terkait` per question: a wrong option, by the key in force, has no misconception code (Daisy: shown when any is unlinked) | `teacher_question_evidence` |
| 6c | Explanations owed: a question with an option still withdrawn does not step past STRUCTURED, except under the confirming act | `penjelasan_terutang_jaga`, `_f1r1b_items_penjelasan_terutang` |
| 7 | Self-check: no null rationale beforehand; the copy and the confirming act were rewritten | — |

**How an option is tied to the one it was copied from (§3d).** By its question's `supersedes_item_id` and the same
label, which `unique (item_id, label)` makes one row. The confirming act's lineage check starts from the source
question, because the fresh draft copy is not yet in `soal_leluhur_sah`'s line.

**Screens:**

| Where | What | Copy (draft) |
|---|---|---|
| Correction step 2 (`SoalKerja`) and the confirmation (`/studio/tinjau/kunci/[koreksi]`) | One line per option losing its explanation: «Pilihan {x} akan kehilangan alasan dan pemahaman keliru terkaitnya…» | `studio.kunci.dampak.penjelasan_hilang` (Daisy, §6 line 1) |
| Studio package page and the question bank | A withdrawn rationale reads «Alasan pilihan {x} ditarik karena kuncinya diperbaiki. Tuliskan alasan yang baru.», never an empty «Alasan:» | `studio.soal.alasan_ditarik` (Daisy, §6 line 2) |
| Studio package page | A wrong option with no code: «Pemahaman keliru: belum dikaitkan» | `studio.soal.belum_dikaitkan` (Daisy) |
| Studio package page and `/mengajar/[kelas]/soal` | Under the options of a question with any unlinked wrong option: «Sebagian pilihan salah belum dikaitkan dengan pemahaman keliru. Jawaban pada pilihan itu tidak masuk hitungan pemahaman keliru.» The teacher's view reads `ada_tak_terkait` | `soal.tak_terkait` (Daisy) |
| Misconception figures (`/edukator/ringkasan`, `/mengajar/[kelas]/bukti`) | An empty figure with nothing withheld: «Belum ada pemahaman keliru yang terkait dengan jawaban ini.» With patterns withheld: the existing sentence | `laporan.komposisi.keliru_kosong` (Daisy), `laporan.komposisi.keliru_belum` (unchanged) |
| The content step's refusal | Names the owed explanations | `studio.konten.kode.content_rationale_owed` (code `CONTENT_RATIONALE_OWED`) |
| The learner's result | Unchanged: a missing rationale already shows the thinking direction alone, or nothing (F-1). Whether to say more is Daisy's | — |

**TypeScript.** `rationale` is `string | null` in:
- `OpsiTinjauan.alasan` and `Opsi.rationale` (`src/lib/soal-tinjauan.ts`);
- `SoalDraf.options` (`src/lib/soal-kontrak.ts`);
- the bank's `Opsi`.

The editor pre-fills a withdrawn rationale as empty (`?? ""`), so saving it unwritten is refused as
`OPTION_REASON_MISSING`.

## The engineer's statements the brief asks for

- **Content rules on the correction path:** `tegaskan_koreksi_kunci` steps its copy's status directly. Nothing on that
  path calls `soal_draf_masalah`, `lesson_package_check` or `langkah_konten`. Step 6c exempts it by the correction's own
  authority (`koreksi_kunci_berwenang`).
- **The MCQ quality run** reads correctness, lengths and codes, not a rationale. It neither reports nor refuses a
  missing one. Holding a revision is step 6c's job, at the status step. An assignment is never moved by it.
- **Writing the explanations needs a further revision.** The corrected revision is approved and sealed when the
  confirmation ends, so the explanations are written in an ordinary revision. A copy carries the withdrawn state
  (F13-K19), and 6c holds it until they are written (F13-K22).
- **Exports:** no export or report file carries a rationale. The upload templates (`src/components/unggah/`) are
  authoring samples.
- **Every reader of the two columns:**
  - `session_review` (F-1's: null where the mark changed);
  - the Studio package page and the bank (marked);
  - `koreksi_kunci_dampak` and `pratinjau_koreksi_kunci` (listed);
  - the misconception readers, which count coded wrong options only (unchanged; worded).

  The learner's player, the reading map, the canonical preview and the AI gateway never read either column.
- **`20260915120000:499`** counts options with a non-null rationale on a revised item. It is a one-time check inside
  that migration, true when it ran, and it is not re-run.
- **A quick assessment's launch writes no option.** It reads the release's sealed questions.
- **The release digest:** a null rationale hashes as `~`, so every stored digest recomputes (F13-K20).

## Tests and plants

| Id | What | Red first |
|---|---|---|
| F13-K16 | The corrected copy: A and B flipped and withdrawn, each naming the correction. The record holds what they said, written once. The sat revision is unchanged | on `b21bec62`: the world cannot run (no column); plant bob04-17 (the confirming act flips only): red for `A:false:Ini tepat.` |
| F13-K17 | The CHECK: no rationale and no reference, an empty one, or both: 23514 each | on `b21bec62`: red |
| F13-K18 | The reference set by a direct update, or carried by an insert with no source holding it: 42501 each | on `b21bec62`: red |
| F13-K19 | A copy carries the state, and writing a rationale clears it | on `b21bec62`: red |
| F13-K20 | Every release digest recomputes, the corrected revision's included | on `b21bec62`: red (its world) |
| F13-K21 | A second correction flipping back restores nothing and records nothing twice | on `b21bec62`: red |
| F13-K23 | The teacher's marker: for every question before and after the correction, `ada_tak_terkait` is whether an option the view shows as wrong has no code; X (both coded) reads false; at least one question reads true. Each question in this world has one wrong option, so "any" and "all" are told apart by F13-K24 | plant bob04-19 (marker always off): red |
| F13-K24 | **Any, not all** (Bob's and the owner's request). X is given two wrong options. World 1: B linked, C not: marked before and after the correction (A to B). World 2: both linked: not marked, before or after. Expected `true|true;false|false` | on `b21bec62`: red (no marker); plant bob04-20 (the marker read as "all"): red, world 1 reads `false|false` |
| F13-K22 | Explanations owed: the copy's step to VALIDATED is refused while A is withdrawn, and goes through once A is written | on `b21bec62`: red; plant bob04-18 (no step guard): red for "went through" |

- **Gate:** `db-bob04-gates` control moves from 20 to 29 green rows (F-1 took it to 20).
- **The world builder** `f13_kunci_dunia` gains an optional third option C on X (`p_c`: `'-'` unlinked, or a code). Its
  default is none, so every other F13 world is unchanged.
- **Restated:**
  - the migration-count pins 237 → 238 (`selftest/experience.test.ts`, RESTATED, F1-R1b);
  - F-1's sealed-key reconstruction (F13-K06 to K10) reads the new `ada_tak_terkait` line by the sealed key, like every
    other line it rebuilds, so the uncorrected world stays byte-identical. Nothing it asserts is removed.
  - R3-SOAL-01 (`selftest/retro.test.ts`) required «Alasan:» under every option. It now requires the reason, or in its
    place the marker that a withdrawn one is owed: INV-03 as amended. Both branches are pinned. The first pre-flight
    on `aac0ce72` caught it red, so this page belongs to the amended commit.
  - The second pre-flight (on `09bcc5ef`) caught UX1-S3-BUKTI-01 red: the new empty-figure condition used `count ?? 0`,
    and no zero may stand in for a missing figure. The code was fixed (`typeof count === "number" && count > 0`), on
    the evidence screen and in `KomposisiKelas`. The test is unchanged.
- **Parity:** `scripts/baseline-parity.mjs` assertion 5 fails until doc 03, its manifest entry and ADR-0025 land in one
  commit. That is the red evidence; it passes on this commit.

## Every column and table touched: constraints and the governing invariant

This table is required by TEAM-INSTRUCTIONS, "Before any correction is built", 12 Nov 2026. It was written after the
build, because the rule arrived during it. Sharon's design review came before the build (§3, §3a).

| Column or table | Constraints after this commit | Baseline invariant |
|---|---|---|
| `item_options.rationale` | Nullable. `item_options_rationale_inv03`: a non-empty rationale and no reference, or no rationale and a reference. The sealed-content guard is unchanged | **INV-03** as amended (ADR-0025); **INV-04**: written only on the draft copy before approval; **INV-01**: no learner payload gains it (F-1's `session_review` returns none where the mark changed) |
| `item_options.rationale_withdrawn_by` | New. FK to `key_corrections` (restrict). Set only by `alasan_ditarik_jaga`'s two paths. Cleared when a rationale is written | **INV-03**; **INV-04** (it is copied, never written, on a sealed row) |
| `item_options.misconception_code` | Unchanged (taxonomy check, `OPTION_MISCONCEPTION_UNKNOWN`). Cleared with the rationale on a flipped option | **INV-04**. The misconception figures count coded wrong options only: worded, no new number |
| `item_options.is_correct` | Unchanged | **INV-01**, **INV-04** (written by the confirming act on the draft copy, as before) |
| `key_corrections.penjelasan_dihapus` | New, write-once (`key_corrections_guard`) | **INV-18**: the correction's record is audit, kept as written; **INV-03**: "keeps a durable reference" and the withdrawn text |
| `items.status` | New trigger `_f1r1b_items_penjelasan_terutang`: the step past STRUCTURED with a withdrawn option is refused, except under the confirming act. `enforce_content_status` is unchanged | **INV-35**: readiness still needs academic approval, and an approval can no longer carry an owed explanation; **INV-03** |
| `plp_releases.content_sha256` | Unchanged. A null rationale hashes as `~` | **INV-04**, **INV-05** (F13-K20) |

## Verified on

This was verified alone, not stacked: F1-R1b's own candidate. B2 is a batch and is never stacked.

## Cross-module inventory

| Module | Effect |
|---|---|
| Learner results and review | None beyond F-1: a withdrawn rationale is never shown, and the mark is the key in force's |
| Teacher views | The per-question marker. Misconception figures unchanged in value, worded "recorded only where coded" |
| Leadership, reports | Wording only (the metric's meaning). No new number (§3 row 1) |
| Studio authoring | The markers; the step held until explanations are written; the editor refuses an empty rationale as before |
| Releases, certificates, statistics | Digests reproducible; Question Health and item statistics read correctness and counts, not these columns |
| Uploads, packages | Unchanged: `lesson_package_check` still refuses a missing rationale |
| Accountability, auth, schools | None |

## Next state

| After this commit | Holds |
|---|---|
| A confirmed key correction | The corrected revision carries no stale explanation or code. Its record keeps what they said. The next ordinary revision is held until they are written |

## The four questions

1. **What changed?** INV-03 as amended. The confirming act withdraws what it makes stale, and an ordinary revision
   owes it back.
2. **What else did that change?** Every misconception screen now says "recorded only where coded". This also corrects
   an existing overstatement for options that were never coded.
3. **What happens when things go wrong?** A direct write of the reference is refused. A withdrawal survives copies. A
   second correction restores nothing.
4. **How do we know?** F13-K16 to K24, plants bob04-17 to bob04-20, red on `b21bec62`, and the pre-flight below.

## Evidence on this commit

To be filled from the pre-flight and CI on the pushed commit.
