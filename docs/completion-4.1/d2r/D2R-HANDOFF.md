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
2. **The database** (`d4fae0bc`): migration `20270124100000` (309) and plants `d2r-1`..`d2r-14` (now `d2r-16`).
3. **The app and Sharon's §7.2** (`1233a6b0`): the capture reshaped to `assistance_policy`, `tujuan_ulang`, the strings,
   the restated tests, CI's gate.
4. **R-1**, its own commit (`e6544f57`): `selftest/db/r1.sql` (R1-K01..K03) and plant `zr1-1`.
5. **Sharon's four conditions on `bersertifikasi`** (Bob 02:04Z): every R-h gate reads it (session_answers included), the
   insert-only seal «certifying ⇒ no help», case D2R-H20 and plant d2r-16, step 0 by mode and purpose.
6. **Daisy's two strings** (Bob 02:06Z): `hasil.percobaan_ke` «Kesempatan ke-{n}» / «Attempt {n}» (of record now); the
   certifying Asesmen Mandiri's own line `posttest.tanpa_bantuan_umum`, drawn after its intro when
   `assessment_orientation` says the sitting will certify (its new OUT column `bersertifikasi`, the policy row's
   `certifies`, the value the start captures; dropped and recreated, grants restated). D2R-W01, D05 and D04 red first.
7. **Daisy's §8 and the comparison** (Bob 03:41Z): `hasil.tidak_ditampilkan` reworded, DAISY-26's exemption removed; the
   mastery comparison not drawn on a certifying result. D2R-W01, D2R-H08 and DAISY-26-BELAJAR-01 red first.
8. **Ruling 74a in full** (the owner, Bob 04:02Z), red first (D2R-H21, D2R-C05, both rendering the component):
   item 2, «Baca lagi:» on a certifying pass too; item 4 as Daisy's D2R-KATA §9 (d79a3c8b): on a pass, «Lulus.», then
   the certificate (the link `siklus.lihat_sertifikat`; «Sertifikat Anda sedang disiapkan.» before it, one line, only when
   a certificate is really being prepared, a row in ELIGIBLE (`sedangDisiapkan`, Sharon's delta note): issued, none or a
   failed read give the link alone; never `sertifikat.disiapkan.arti`), then «Baca lagi:» when a section is below the mark, the
   counts and «Kesempatan ke-{n}», `hasil.tidak_ditampilkan`; no retake line. The Hasil Belajar row: the link only.
   D2R-H21, D2R-C05, D2R-C06. The full stop after `sertifikat.disiapkan.judul` is drawn in the component (§9's
   one-line form), so the key's text is unchanged for the certificate page's heading.
   Hasil Belajar and its print as Daisy's §11 (deacb184): every certifying row, Lulus or Belum lulus, gives its sections in
   «Disarankan dibaca lagi: {daftar}.» (more than two: `hasilbelajar.baca_lagi_banyak`) and section B lists them by name,
   marked «baca lagi», with no figure; non-certifying rows keep «Pelajari lagi». The C line (`berikutnya_ulang`, «… tanyakan
   kepada guru …») stays on «Belum lulus» rows only, unchanged, as §11 says (D2R-C07).
9. **Ruling 90** (Daisy §10, ccd42fa6): `lapor.langkah.awal` and `.awal_kelas` say only what the product does today; no
   time period (guarded), and «listed first» pinned to the triage order (D2R-L01); BOB15-K01 green.

## What changed

**The capture** (spec §7.1 F-2, Sharon §7.2 and her conditions). `assessment_sessions` gains `assistance_policy` (jsonb,
exactly `arah`, `petunjuk`, `contoh`, `reveals_rationale_on_review`, a CHECK), `bersertifikasi` (the result's purpose,
from `mode_policy.certifies`; accepted by Sharon) and `percobaan_ke`, written once at the start by one seal trigger and
immutable after. Every sitting, open and closed, is filled from the OLD policy, asserted, before the policy changes; a
second assertion proves no capture moved. At insert only, a certifying sitting is never started with help. Fail-safe
defaults (no help, no rationale, counts only) for a row written past the seal by the harness.

**R-d.** POST_TEST and STANDALONE allow no help (audited `mode_policy.changed`, D2-R R-d). The lint names a certifying
mode that allows help. `open_assistance`, `assistance_state` and `session_state` read the capture; the orientation
promises no help on a mode that offers none, says `posttest.tanpa_bantuan` on an Uji Penguasaan and
`posttest.tanpa_bantuan_umum` on an Asesmen Mandiri whose orientation says it certifies (`bersertifikasi`).

**R-h.** Every learner gate reads `bersertifikasi`, never a mode name (D2R-H20, plant d2r-16): `session_review` refuses
(PR081 RESULT_COUNTS_ONLY; then the F-3 review key and the PRE_TEST check); `session_answers` refuses a finished certifying
sitting; `reading_map` gives only the sections to read again (BACA_LAGI, no reason, no KUAT); `session_outcome` gives
`per_domain` with no numbers, the server's `tujuan_ulang`, `percobaan_ke` and `bersertifikasi`; `hasil_koreksi_saya` says
only that the result changed and the new count. The engine's
`jagaHasil` refuses a certifying result that carries any of them. The chapter result page, Hasil Belajar and its print
draw it through `HasilBersertifikasi` in Daisy's order and never ask for the review; `bagianUlang` reads `tujuan_ulang`.
The list guard (D2R-H18) classifies all 25 learner-reachable readers of answer-bearing data. Pemetaan Awal, Uji Cepat and practice are unchanged (pinned).

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
| F36-D14 | the learner's sealed objectives read from `per_domain` | from `tujuan_ulang` on a certifying result, `per_domain` bare |
| C1W-S05 | the learner's review of an unaffected sitting | its sealed counts from `session_outcome`, and the review refused by name |
| Z-D1-01 | D-1's learner readers on the seeded Uji Penguasaan | the seeded sitting marked non-certifying inside the rolled-back world |
| Z-K01-02 | the gate lines of record | Daisy's «belum lulus» for `hasil.target.belum_gerbang` and `hasilbelajar.gerbang` |
| B6C-SHEET-01, B6C-PRINT-01, B6C-DATA-01, PENUTUPAN-Q10 | the title, the achievement and the band | R-a, R-b, no band |
| UX1-BRAND-02, UX1-TUR-ORANG-01 | the migration baseline | 309 |
| A3-E01 | the declared triggers | adds the capture seal |
| F19-Q01..Q04 | a sitting started while QUICK certified, with QUICK's help | QUICK, for that one start, certifies and offers no help (condition 3), all restored at once |
| C1W-S06 | the learner's correction carried `sertifikat_ditinjau` | counts only (§7.2): the flag is absent there, the learner reads `sertifikat_saya_ditinjau` |
| Z-R15-01 | the certificate column «Paket Pembelajaran» | «Materi Pembelajaran» (rev. 4's alignment) |
| C1W-J01 | the learner's corrected Uji Penguasaan page shows 100% and «Hasil asli: 50%» | counts only: «2 dari 2 soal dijawab tepat», marked corrected, no percentage |
| CI red case FABLE-06 3i | the planted orientation's shape | adds `bersertifikasi` |
| CI-W03 | the red cases | adds `db-d2r-gates` and `db-zr1-gates` |

## For Sharon, Daisy and Bob

1. **Sharon:** the batch on the pushed head and CI (Bob 02:04Z). The fail-safe defaults; the list guard's three classes
   (D2R-H18); `session_answers` refusing only a FINISHED certifying sitting (an open one resumes from it).
2. **Daisy:** your two strings of 02:06Z are in (W01 reads them word for word). Your §8 rewording of `hasil.tidak_ditampilkan` (2bfbd3d7)
   is in, and DAISY-26's guard has no exemption. Found by C1W-J01 and closed under your §3 order: the chapter result
   page drew «Perubahan dari Pemetaan Awal» (both mastery percentages) below a certifying result; it is no longer drawn
   there (D2R-H08). `learning_delta` is unchanged (Sharon, 04:03Z: `akhir` is the counts' ratio, which `session_outcome` already gives). The R-b sentence is split on the card and sheet at `{kursus}`: the words before it on `pin-done`, the course and the
   full stop on `pin-course` (R-13 on the new sheet is yours). The teacher's sittings screen does not yet draw `percobaan_ke` (no words).
3. **Bob:** the strings are `dc275f6a`, one commit after the spec's `e64f94c2` (Daisy's §6, the no-threshold words).
