# Verification 2 · "The result in force": the learner's reader and the teacher's (PETE-27)

Agent verification, 22 Nov 2026. Ruling 58. Run on `origin/main` `706fe8c5`, scratch database as in V1 §Setup.

## Finding: PARTLY CONFIRMED. The two readers apply two different rules, one by design and one not

| Reader | Which sitting | Which result row of that sitting | Evidence |
|---|---|---|---|
| **Learner**, `/belajar/hasil` (`src/lib/hasil-belajar.ts`:54–96) and the chapter result page | `hasil_belajar_sesi_orang`: the **latest sitting begun** (`created_at desc`); `SELESAI` only if that one is FINALIZED | `session_outcome` → `hasil_murid_id`: the latest **governed key correction**, else **the sealed original** | `20270117150000`:23–61; `20270115110000`:493–502 |
| **Teacher**: `learner.result` (`calc_learner_result`), `sebaran_murid_kelas`, `tujuan_belum_tercapai`, `murid_perlu_penguatan`, `kenaikan_awal_akhir` | the **latest finalised** sitting (`finalized_at desc`) | the **tip of the chain**: the row nothing supersedes (an ordinary recalculation or a key correction) | `20270111100000`:1225, 1458 |

- **Key corrections: the same figure for both** (`hitung_ulang_koreksi_kunci` writes the new result and its
  `assessment_result_bases` row together; the learner's page says *dikoreksi*). Read only; not run here.
- **An ordinary recalculation (`recompute_result`, SYSTEM_ADMIN, audited): different figures, deliberately.** D14
  (`20270111100000`:1541; `20270115110000`:43): the learner and the certificate keep the sealed original; reports use
  the recalculation. Markers: the chapter result page (`hasil.dihitung_ulang`, `src/app/belajar/[tugas]/hasil/page.tsx`:122)
  and the teacher's learner page (`CatatanHitungUlang`). **The Hasil Belajar summary carries no marker**
  (`hasilBelajar` never calls `sesi_saya_dihitung_ulang`).
- **A retake begun and not finished hides the learner's finished result** from Hasil Belajar, while the teacher still
  sees it. **If that retake is then ended** (V5: a rollover ended it), the summary shows only the Pemetaan Awal
  (`DITUTUP_AWAL`), and the finished Uji Penguasaan is no longer shown to the learner at all.

## Reproduction (scratch clone; each step its own transaction, since the harness's claims and `now()` are per transaction)

1. As the owner: `purge_cycle_evidence()`; the fixture school set `is_synthetic = false` on the clone so its sittings
   are OFFICIAL and reach the teacher's official readers (`derive_evidence_class`).
2. As the learner: `pre_finished(aa_pre)`; `s1 := start_learning_session(aa_post)`; `answer_paper(s1, true)`;
   `finish_my_session(s1)`.
3. **(A)** As the owner, one presented question's key flipped on the clone (standing in for anything the evaluator would
   now read differently); as `sysadmin@…`: `recompute_result(s1, '…')`.
4. **(B)** As the learner: `start_learning_session(aa_post)`, left unfinished.
5. After each step, the learner's reader (`hasil_belajar_sesi_saya()` then `session_outcome(post_session)`) and the
   class EDUCATOR's (`metric_evaluate('learner.result', learner, school, current_metric_catalogue())`).

| Step | Learner sees | Teacher sees |
|---|---|---|
| 0 · sealed | `SELESAI`, 1.0000, no marker | same sitting, 1.0000, `recomputed=false` |
| A · after `recompute_result` | `SELESAI`, **1.0000**, no marker on this read | same sitting, **0.8000**, `recomputed=true, sealed=1.0000` |
| B · retake begun | **`BERJALAN`, no result** | the finished sitting, 0.8000 |
| (V5) the retake ended by the rollover | **`DITUTUP_AWAL`, no Uji Penguasaan** | (the old class's teacher is no longer permitted) |

## Classification

- **Severity:** Medium for learners (a finished result can vanish from their own summary; after a recalculation their
  figure and the school's differ, unmarked on the summary). Low–Medium for educators (their figure is the in-force one
  and is marked).
- **Proposed: Z.** Write the one rule (PETE-27's own remedy), and at least: the learner's reader shows the **latest
  finalised** Uji Penguasaan, whatever later sitting was begun or ended; the summary carries the D14 marker. Whether
  "in progress" should replace a finished result while a retake is open is an owner wording call; losing it after the
  retake ends is a defect.
- Not run: the key-correction path end to end (two-person correction); read from code and its tests.
