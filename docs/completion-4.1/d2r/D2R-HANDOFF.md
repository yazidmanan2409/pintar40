# D2-R · 1e · The build, handed off (Second Eye)

> **Branch:** `claude/d2r`, from `claude/next-base` `055738ba`. **Spec:** `D2-CERTIFICATE-CONDITIONS-SPEC.md` §6 and rev. 4
> (§7, final 01:05Z). **Strings of record:** Daisy's `D2R-KATA.md` at `ux-1/daisy-experience` **`dc275f6a`**, which adds
> §6 to `e64f94c2` (without a threshold, «Baca lagi:» and the advice-not-judgement note). **Build map and cases:**
> `D2R-BUILD-MAP.md`. **Red first:** `RED-055738ba.txt` (24 of 31 red before any product change).
>
> **Head, pre-flight and CI run ids:** in the hand-off message (`PREFLIGHT.md` beside this file).

## The commits

1. **Red first** (`354c1bcd`): the cases only. 31 cases (`selftest/db/fable39.sql` D2R-D*, H01..H16, C01, C04, E01, F01;
   `selftest/d2r.test.ts` the list guard, the engine check, the pages, the band, the strings, R-g, the player).
2. **The database** (`d4fae0bc`): migration `20270124100000` (309) and plants `d2r-1`..`d2r-14`.
3. **The app**, the restated tests, CI's gate (this hand-off's head).
4. **R-1**, its own commit: `selftest/db/r1.sql` (R1-K01..K03) and plant `zr1-1`.

## What changed

**The capture.** `assessment_sessions` gains `bantuan_diizinkan`, `bersertifikasi` and `percobaan_ke`, written once at
the start by a seal trigger (the pass mark's precedent) and immutable after. Every existing sitting was given what its
mode said before (so an open Uji Penguasaan keeps the help it started with, D2R-D07), and its ordinal by the lineage rule
in creation order. Fail-safe defaults (no help, counts only) for a row written past the seal by the harness.

**R-d.** POST_TEST and STANDALONE allow no help (audited `mode_policy.changed`, D2-R R-d). The lint names a certifying
mode that allows help. `open_assistance`, `assistance_state` and `session_state` read the capture; the orientation
promises no help on a mode that offers none and says `posttest.tanpa_bantuan` on an Uji Penguasaan.

**R-h.** A certifying sitting (`bersertifikasi`): `session_review` refuses (PR081 RESULT_COUNTS_ONLY); `reading_map` gives
only the sections to read again (BACA_LAGI, no reason, no KUAT); `session_outcome` drops `per_domain` and carries
`baca_lagi`, `percobaan_ke` and `bersertifikasi`; `hasil_koreksi_saya` drops the correction reason. The engine's
`jagaHasil` refuses a certifying result that carries any of them. The chapter result page, Hasil Belajar and its print
draw it through `HasilBersertifikasi` in Daisy's order and never ask for the review. The list guard (D2R-H18) classifies
all 23 learner-reachable readers of answer-bearing data. Pemetaan Awal, Uji Cepat and practice are unchanged (pinned).

**R-c.** `verify_certificate` returns `predikat` null (OUT columns, `assert_public_surface()`, eligibility, the sealed
payload and the snapshot unchanged). No band on the card, its printable record (C1-R4), the A4 sheet or `/verifikasi`.

**R-a, R-b, the two alignments.** «Sertifikat»; R-b's sentence with «Materi Pembelajaran», the course in its place on the
card and the sheet; the admin column «Materi Pembelajaran»; `verifikasi.lulus` «Lulus».

**R-e.** No change needed: extend_session_deadline records it on the sitting and its audit row, and the teacher's
sittings read shows it; D2R-E01 proves it on no public surface, payload or snapshot.

**R-f.** The ordinal on the learner's certifying result and in the teacher's sittings read (`daftar_pengerjaan.percobaan_ke`).

**R-g.** After Pemetaan Awal with lessons unread, the chapter offers Uji Penguasaan after «Lanjut membaca», with
`siklus.siap.saran`.

## Restated tests (each marked RESTATED, D2-R)

| Test | Why | Now |
|---|---|---|
| F03-T08 | INV-11 proven on an Uji Penguasaan, which no longer offers help | on a sitting that captured help at its start (POST_TEST's row allows it for that one start, restored at once) |
| F03-T09 | the doctrine sweep served help and read a review on an Uji Penguasaan | on a sitting that captured help and a non-certifying purpose at its start |
| F13-K13..K15 | F-1's rule read in a learner's review of an Uji Penguasaan | on sittings started while POST_TEST did not certify (captured), the row restored |
| F36-D14 | the learner's sealed objectives read from `per_domain` | from `baca_lagi` on a certifying result |
| C1W-S05 | the learner's review of an unaffected sitting | its sealed counts from `session_outcome`, and the review refused by name |
| Z-D1-01 | D-1's learner readers on the seeded Uji Penguasaan | the seeded sitting marked non-certifying inside the rolled-back world |
| Z-K01-02 | the gate lines of record | Daisy's «belum lulus» for `hasil.target.belum_gerbang` and `hasilbelajar.gerbang` |
| B6C-SHEET-01, B6C-PRINT-01, B6C-DATA-01, PENUTUPAN-Q10 | the title, the achievement and the band | R-a, R-b, no band |
| UX1-BRAND-02, UX1-TUR-ORANG-01 | the migration baseline | 309 |
| A3-E01 | the declared triggers | adds the capture seal |
| CI-W03 | the red cases | adds `db-d2r-gates` and `db-zr1-gates` |

## For Sharon, Daisy and Bob

1. **Sharon:** the capture's shape (two booleans and a smallint, sealed by trigger) and `session_review` refusing rather
   than nulling (D2R-H01/H02, plant d2r-5). The defaults on the two booleans. The list guard's three classes (D2R-H18).
2. **Daisy:** `hasil.percobaan_ke` («Percobaan ke-{n}» / «Attempt {n}») is **provisional**, mine, with no string of record.
   The R-b sentence is split on the card and sheet at `{kursus}`: the words before it on `pin-done`, the course and the
   full stop on `pin-course` (R-13 on the new sheet is yours). The Asesmen Mandiri has no «no help» line yet (your words
   name the Uji Penguasaan). The teacher's sittings screen does not yet draw `percobaan_ke` (no words).
3. **Bob:** the strings are `dc275f6a`, one commit after the spec's `e64f94c2` (Daisy's §6, the no-threshold words).
