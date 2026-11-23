# Z0 · K-01's consumer inventory (for Bob and Sharon, before Z1's K-01 SQL)

> **Branch:** `claude/z` (from `main` `01bba241`, 300 migrations).
> - **Read from:** the source, and a golden database built from those 300 migrations (`pg_get_functiondef`, so each
>   definition is the latest one, not one file's).
> - **Scope:** Bob's condition 2 of `Z-PLAN-APPROVAL.md` (`6a887e05`). It covers every reader that states, or implies,
>   whether a learner reached the target («tercapai», «lulus», «di bawah target», `pass`/`passed`). That includes
>   Kenaikan, `siklus.ts`, the public verification page, and every export and report.
> - **Status:** a document, not a change. No code is changed by it.

**K-01, restated (SAPU-VERIFIED §S1):**
- **The session's verdict:** `session_outcome.lulus` = `safety_gate_passed AND mastery >= pass_mark` (`20261102100000`,
  `session_outcome`).
- **The defect:** a learner who fails only the must-be-right gate is told, on some screens, that their mastery is below
  target. Their teacher is told they reached it.

## 1 · The finding in one paragraph

**The database is consistent.** Every SQL reader that states a verdict already computes gate AND mastery, and the
certificate path can only certify a gate pass.

**The defect is in four application readers.** They compare the percentage with the mark themselves, and never read
the gate:
- the teacher's per-learner page;
- «Minta membaca lagi»;
- the learner's own result wording;
- the parts-to-study list (`bagianUlang`), which is shared by the result page and the learner's printed report.

**The fifth gap is the one SQL read Bob named:** `tujuan_belum_tercapai` returns only objectives below the mark, so a
gate-only failure has nothing to study.

**The teacher's numbers already carry the gate.** Metric `learner.result` (`calc_learner_result`, `20270111100000`)
returns `safety_gate_passed` with every result, and `pengajar.ts` drops it.

**So K-01's teacher pages need no new read.** Only `tujuan_belum_tercapai` needs SQL, as the plan says (migration
`20270123130000`).

## 2 · Every consumer

**Verdict:** **OK** means it already says gate AND mastery. **K-01** means it judges on the percentage alone, and is
changed in Z. **Not a verdict** means it states no reached or not-reached.

### 2a · The database (latest definitions on 300)

| Reader | Where | What it states | Verdict |
|---|---|---|---|
| `session_outcome` | `20261102100000` | `lulus` = gate AND `mastery >= pass_mark`; `gerbang_keselamatan` beside it | **OK**: the source of truth |
| `certificate_eligibility` → `certificate_prepare` → `verify_certificate` | `20261102100000`, `20270115110000` | `passed` = gate AND mastery; ineligible with reason «the safety gate did not pass (INV-10)»; the payload's `result.passed` | **OK**: no certificate exists for a gate-only failure |
| `sertifikat_layak_dengan` | `20270115110000` | gate AND mastery (a key correction's effect on a certificate) | **OK** |
| `hasil_koreksi_saya`, `koreksi_kunci_hitung_untuk` | `20270115110000` | `lulus` before and after a key correction = gate AND mastery | **OK** (Studio's «dampak», `SoalKerja.tsx:381`) |
| `professional_learning_record` | `20261118100000` | `passed` = gate AND mastery | **OK** (Pengembangan, `pengembangan-kontrak.ts:88`) |
| `calc_learner_result` (metric `learner.result`) | `20270111100000` | `mastery` and `safety_gate_passed` per result; no verdict | **Not a verdict.** It carries the gate, and its readers drop it (§2b) |
| `percobaan_antrean` | `20270114100000` | the last result's `mastery` and the sealed mark, to a reader who may see results; no gate | **Implied, see §3 Q2** |
| `tinjauan_sertifikat_antrean` | — | before and after mastery and the target, for a certificate under review | **Not a verdict.** A certificate exists only for a gate pass |
| `tujuan_belum_tercapai` | `20270111100000:82` | the objectives whose per-domain mastery is `< pass_mark` | **K-01 (SQL)**: a gate-only failure returns `[]`. Z1, `20270123130000`, adds the `objective_ids` of the session's missed must-be-right items (no item, no answer) |
| `kenaikan_hasil`, `kenaikan_tetapkan` | `20270112210000:36` | `LULUS` is a class-promotion outcome («lulus» = leaves the school having completed it), decided from the enrollment's end, not a sitting | **Not a verdict.** Kenaikan reads no `session_outcome` or mastery |
| metric calculators (`calc_class_*`, `calc_institution_*`) | — | mastery shares and bands; the gate as its own share (`institution.safety_gate_pass_rate`) | **Not a verdict**: no calculator compares with a pass mark (checked: no `calc_*` body mentions `pass_mark`) |

### 2b · The application

| Consumer | Where | Today | Verdict | Z |
|---|---|---|---|---|
| Learner's result, the banner | `belajar/[tugas]/hasil/page.tsx:67,131-134` | `ketuntasan(outcome)` = `lulus` → «Belum mencapai target.». The explanation `hasil.target.belum_arti` says «penguasaannya masih di bawah target» | **K-01 (words)**: the verdict is right, but the reason is wrong for a gate-only failure | Z3: new `hasil.target.belum_gerbang` when `gerbang_keselamatan` is false and mastery ≥ mark |
| Learner's result, «Pelajari lagi» | `hasil/page.tsx:68` → `siklus.ts:297-307` (`bagianUlang`) | domains with `penguasaan < ambang` | **K-01**: empty for a gate-only failure | Z3: the list also takes the gate item's objectives from `tujuan_belum_tercapai`'s new rows, or the result's own, per Sharon |
| Learner's printed report | `hasil-belajar.ts:85-86` → `KomposisiMurid.tsx:24-25,77,88` | the verdict is `ketuntasan` = `lulus`; the list is `bagianUlang` | Verdict **OK**; list **K-01** (as above) | Z3, the same change as the line above |
| Belajar home and the cycle card | `belajar/page.tsx:138`, `KartuTugas.tsx:56` | `ketuntasan` = `lulus` | **OK** | — |
| `siklus.ts` | `:262-286` (`ketuntasan`), `:297` (`bagianUlang`) | `ketuntasan` reads `lulus` only; `bagianUlang` reads the domain figures only | `ketuntasan` **OK**; `bagianUlang` **K-01** | Z3 |
| Teacher, per-learner page | `mengajar/[kelas]/murid/[orang]/page.tsx:126-134` (data `pengajar.ts:956-1000`, `susunCatatan`) | «di bawah target» and «Beri ulang» only if `penguasaan < batas` | **K-01**: a gate-only failure reads as reached, with no «Beri ulang» | Z3: `susunCatatan` keeps `safety_gate_passed` from `learner.result`; the row says `mengajar.murid1.gerbang`; «Beri ulang» is offered |
| Teacher, «Minta membaca lagi» | `ulang/page.tsx:79,121` (data `pengajar.ts:1140-1162` `urutUlang`, `:1225-1235`) | status `bawah` only if `p < batas` | **K-01**: a gate-only failure is «capai», and is neither listed nor pre-ticked | Z3: `urutUlang` takes the gate; the learner is `bawah`, with `mengajar.ulang.gerbang` |
| Teacher, objectives not yet reached | `murid/[orang]/page.tsx:69` → `pengajar.ts:1026-1030` (`tujuanBelum`) | `tujuan_belum_tercapai` | **K-01** (via the SQL); also K-03 (`[]` on error, `:1029`) | Z1 (SQL), Z3 (K-03) |
| Teacher, topic grid | `KisiTopik.tsx:134,200`, `KomposisiKelas.tsx:182` | a topic's mastery below the mark: «di bawah target», for the topic | **Not the verdict**: a per-topic statement, true as stated | — (unchanged; named so it is not mistaken for one) |
| Approver's retake queue | `DaftarAntrean.tsx:62-63` (`percobaan_antrean`) | «hasil {x} · target {y}», figures only | **Implied** | §3 Q2 |
| Retake eligibility | `may_start_assessment`, `minta_percobaan`, `putuskan_percobaan`, `percobaan_izin_jumlah` | attempts and permissions; none reads mastery, the gate or the mark (checked) | **Not a verdict**: unchanged by K-01 | — |
| Certificate (learner) | `belajar/[tugas]/sertifikat/page.tsx:90` | `outcome.lulus === true` | **OK** | — |
| Certificate review (Konfigurasi) | `konfigurasi/sertifikat/page.tsx:96,158` | before, after and target figures, for a certificate under review | **Not a verdict** (only gate passes are certified) | — |
| Public verification | `verifikasi/[token]/page.tsx:129`; `api/verifikasi/[token]/route.ts`; `lib/certificates/verification.ts:55` | `pass` from the certificate's payload | **OK** for K-01. K-05 (the facts under «Sedang ditinjau») is a separate row | Z3 (K-05) |
| Pengembangan (PD) | `KomposisiPengembangan.tsx:98-99` | `passed` (gate AND mastery) | **OK** | — |
| Studio, key-correction effect | `SoalKerja.tsx:381,399` | `lulus` before and after (gate AND mastery) | **OK** | — |
| Kenaikan | `KenaikanKelas.tsx:310,363,376`; `kenaikan.ts:101-103` | «Lulus» as a promotion outcome | **Not a verdict** (see §2a) | — |
| School report | `KomposisiSekolah.tsx:15-16,37` | domain bands (80/60) and the gate's own share | **Not a verdict.** K-04 («all domains ≥ 60%» while one is withheld) is a separate row | Z3 (K-04) |
| Exports | `lib/xlsx.ts`, `pendataan-kontrak.ts`, `unggah-kontrak.ts` | imports only: no export states a result | **None exist** | — |
| Email and API | `src/app/api/**` | no message states a result («lulus», «tercapai», «penguasaan»: no match); `api/verifikasi` as above | **None** | — |

## 3 · Questions for Sharon (and Bob), before Z1's K-01 SQL

1. **Q1, where the gate's objectives come from.**
   - The plan puts them in `tujuan_belum_tercapai`, which the teacher reads.
   - The learner's «Pelajari lagi» comes from `session_outcome.per_domain`, which never lists the gate.
   - **Proposed:** one source for both. `tujuan_belum_tercapai` gains the session's missed must-be-right items'
     `objective_ids` (objectives only, no item or answer). The learner's list reads the same objectives from a
     learner-callable counterpart, or from a new `per_domain`-adjacent key in `session_outcome`.
   - **Sharon chooses.** I recommend the `session_outcome` key: it is already the learner's read, and it is one
     restatement.
2. **Q2, the approver's retake queue.** It shows «hasil 85 % · target 70 %» for a learner who failed only the gate.
   - It states no verdict, but it reads as one.
   - **Proposed:** in Z3, add the gate line when `safety_gate_passed` is false. That needs `percobaan_antrean` to return
     it, a one-column SQL addition in the K-01 migration, under the same `can_on_node('CAN_VIEW_LEARNER_RESULT', …)`
     condition as the mastery.
   - **Is it in K-01's scope (Bob)?**
3. **Q3, the teacher pages need no new read.**
   - `learner.result` already returns `safety_gate_passed` to the teacher under its existing audience rule.
   - **Confirm (Sharon) that** reading it on those two pages is within what that rule already allows. My reading is
     yes: the same rows and the same envelope.

## 4 · Red-first tests this fixes in place (from the plan's §2)

- **Z-K01-01 (SQL):** a gate-only failure: `tujuan_belum_tercapai` returns the missed must-be-right item's objective.
  Below the mark, the read is unchanged.
- **Z-K01-02 (screens):** the same learner reads «belum mencapai target» on every K-01 row above:
  - the learner's `hasil.target.belum_gerbang`, with a non-empty «Pelajari lagi»;
  - the teacher's `mengajar.murid1.gerbang` and «Beri ulang»;
  - listed and pre-ticked on «Minta membaca lagi», with `mengajar.ulang.gerbang`;
  - the printed report's list.

  Every **OK** row is unchanged, asserted on the same world: the certificate, verification, Pengembangan, Studio and the
  Belajar card.
- **Both run on a multi-answer sitting too,** after D-1 (plan §3.1).
