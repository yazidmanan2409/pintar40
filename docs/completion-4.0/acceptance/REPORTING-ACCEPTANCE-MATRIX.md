# PINTAR 4.0 Reporting Acceptance Matrix

Owner directive: Reporting Quality Gate, 9 Nov 2026.

Evidence head: see §6. Every figure below was checked against the raw official results, not against PINTAR's own calculators.

## 1. How the reports were tested

**The world.** `audit/fixtures/laporan-lokal.mjs` builds a local school with real sittings. It is local only and synthetic: no real person, nothing on staging.
- **Chapters.** Two synthetic chapters were written and published through Studio's own operations:
  - ingest, check and send;
  - the Kepala departemen reviews, approves and locks;
  - the admin releases and publishes;
  - the school sets its pass mark at 70%.
- **Classes.** The chapters were given to four new classes in the demonstration school:

  | Class | Learners | What they sat |
  |---|---|---|
  | 5B | 24 | Both chapters. 22 sat both tests; 1 sat only the Pemetaan Awal; 1 sat nothing. About ⅔ have reached Bab 2's Uji Penguasaan |
  | 5C | 12 | 7 sat both tests |
  | 5D | 4 | 4 sat both tests, a population under the minimum of 5 |
  | 5E | 9 | Nothing: zero records |

- **Real sittings.** Every one of the 104 sittings went through the learner RPCs with the learner's own token: `start_learning_session`, `session_paper`, `record_answer`, `finish_my_session`. Every mastery figure, band and result is therefore PINTAR's own scoring.
- **Uneven on purpose.** Ability varies per learner and difficulty per objective, so the data has no bell curve built into it.

**The walk.** `audit/laporan-jalan.mjs` opened every report as its intended reader:
- Guru, Kepala departemen, Dekan, Admin sekolah, a learner with results and a learner with none;
- refusals included;
- at 1280, 390 and 320 px;
- with a full-page screenshot and the visible text of each.

That is 28 pages × 3 widths = 84 page views. None scrolls sideways.

**Independent figures.** Placed, assessed, band counts, pairs, means and gain were computed by hand-written SQL from `official_sessions` and `official_results`, and compared with each report (§3).

## 2. Defects found and repaired

Each repair has a test that failed before the change and passes after it. "Red→green" means the test was run against the old code and failed, then against the new code and passed. "Rendered" means a static render test written with the fix.

| # | Defect | Effect on a reader | Repair | Proof |
|---|---|---|---|---|
| R1 | Topic mastery, school competency outcomes and «tujuan belum tercapai» found an objective only through a module-level definition. Studio writes course-level definitions | Every chapter written in Studio showed topics as bare codes («B1P4»). Two chapters with equal codes were averaged as one topic | Migration `20270111100000`: the objective is resolved within the definition's chapter, whether module or course | F35-T01, red→green |
| R2 | Comprehension, topic mastery and competency outcomes counted their sample in **results** | A class of 24 read «Pemahaman · Dari 36 murid». Three learners who sat two chapters (six results) cleared the **5-learner minimum**, a small-population exposure | Same migration: the sample is distinct learners (H31's rule). The means are unchanged | F35-S01, red→green |
| R3 | «Perbandingan angkatan» found a cohort only through a membership of the COHORT node, which no PINTAR placement creates | The comparison's only row was named «—» in every real school | The cohort is now the Angkatan above the session's Kelas | F35-A01, red→green |
| R4 | The topic grid's lead counted «below target» over classes whose target the reader cannot read | The Dekan was told «Tidak ada topik yang di bawah target di sebagian besar kelas» over cells below target | The lead now needs at least two classes with a readable target | LAPORAN-KISI-02, rendered |
| R5 | Lists of objective statements kept each sentence's full stop | «…barisannya., Kalian…» | `daftarKata` drops each item's final punctuation | LAPORAN-KISI-02 |
| R6 | The learner's «Pelajari lagi» listed every not-yet objective in the lead | A 25-line paragraph at 390 px | Above two items, the lead gives the count and points to section B | LAPORAN-MURID-02, rendered |
| R7 | Chapter names repeated the subject | «Matematika · Matematika Kelas 5 · Bab 1» | The subject is not prefixed when the title already starts with it | LAPORAN-MURID-02 |
| R8 | A reader refused every figure got a report frame | A learner saw a class report frame («Cetak laporan» and six refusal cards); so did a teacher at another class's or the school's summary | The standard refusal page instead | LAPORAN-TOLAK-01 |

The live catalogue moves MC-8 → MC-9 (D-060(a)). Every definition, minimum, audience and tier is unchanged. Two structural sources are declared: `modules` and `org_nodes`.

## 3. Numerical integrity: report against independent count

These were read after the repairs. Each row is ✓: the report and the independent count agree.

| Figure | Report | Independent count |
|---|---|---|
| 5B placed / assessed / not yet | 24 / 22 / 2 | 24 / 22 / 2 |
| 5B bands: Mantap / Berkembang / Perlu penguatan | 4 / 7 / 11 | 4 / 7 / 11 (latest Uji Penguasaan, gate included) |
| 5B Kenaikan | +21 poin, 22 murid; 34.7% → 55.9% | 36 pairs, 22 people; 0.347 → 0.559 |
| 5B section E, named learners | 11 | 11 in the lowest band |
| 5B Pemahaman, sample | «Dari 22 murid» | 22 people, 36 results |
| 5D (4 learners) | every figure withheld: «Sekarang 4 murid; perlu 5» | under the minimum |
| 5E (0 of 9) | «Baru 0 dari 9 murid mengerjakan Uji Penguasaan» | no records |
| School participants | 35 | 1 + 23 + 7 + 4 |
| School Kenaikan | +21 poin from 33 murid | 22 + 7 + 4 people |
| School safety-gate base | 48 results | 48 |
| Kesiapan bukti | «Matematika: 2 dari 5 kelas cukup» | 5B and 5C |

## 4. The matrix

**Legend:**
- **Status:** Impl = implemented; R1–R8 refer to the repairs in §2.
- **Data:** numerical integrity.
- **UX:** UX and visual.
- **Auth:** authorization and privacy.
- **E2E:** end to end, from learning activity to report. All E2E checks below are local; staging is not yet walked.

### Guru

| Report | Purpose | Status | Data | UX | Auth | E2E | Remaining | Verdict |
|---|---|---|---|---|---|---|---|---|
| Ringkasan Kelas (`/edukator/ringkasan`) | Where the class stands, which topics, who needs reinforcement | Impl; R1, R2, R5, R8 | ✓ after R1, R2 | Good. Wording points open (O1, O3) | ✓ section E for the teacher only | ✓ local | O1, O3, V1 | READY after the re-walk, O1 pending |
| «Lihat bukti» (`/mengajar/[k]/bukti`) | What may be concluded from the evidence | Impl; R1, R2 | ✓ | Contradictory action lines (O1) | ✓ | ✓ local | O1 | NOT READY until O1 |
| Per soal (`/mengajar/[k]/soal`) | Which questions were hard, who chose what | Impl | ✓ (7 of 22 correct, options counted) | Good: the evidence level | ✓ academic class only; PD refused | ✓ local | none | READY |
| Catatan murid (`/mengajar/[k]/murid/[o]`) | One learner's record and objectives not yet reached | Impl; R1 | ✓ | Good | ✓ roster only | ✓ local | none | READY |
| Uji Cepat result, «Siapa yang sudah mengumpulkan» | Quick-check result; who has submitted | Impl | Not re-measured here (MENGAJAR3 tests) | | | | | Covered by existing tests |

### Murid

| Report | Purpose | Status | Data | UX | Auth | E2E | Remaining | Verdict |
|---|---|---|---|---|---|---|---|---|
| Hasil belajar (`/belajar/hasil`) | Every chapter, what to study again | Impl; R6, R7 | ✓ own results | Good after R6 | ✓ own only | ✓ local | none | READY after the re-walk |
| Hasil per bab (`/belajar/[t]/hasil`) | One chapter's result | Impl | ✓ | Good | ✓ | ✓ local | none | READY |

### Kepala departemen

| Report | Purpose | Status | Data | UX | Auth | E2E | Remaining | Verdict |
|---|---|---|---|---|---|---|---|---|
| Pimpinan with KisiTopik (`/pimpinan`) | Is a difficulty a pattern or one class | Impl; R1, R4, R5 | ✓ | Good. Long statements make the lead long (V2) | ✓ classes in scope | ✓ local | V2 | READY |
| Ringkasan Kelas (staff wording) | The class figures from a leader's door | Impl | ✓ | ✓ | ✓ no section E | ✓ local | none | READY |
| Murid dalam lingkup | Names only, the record opened as a separate, audited act | Impl | ✓ | ✓ | ✓ audited open | ✓ local | none | READY |

### Dekan / pimpinan

| Report | Purpose | Status | Data | UX | Auth | E2E | Remaining | Verdict |
|---|---|---|---|---|---|---|---|---|
| Pimpinan (`/pimpinan`) | The school's evidence, per class | Impl; R4 | ✓ | No class targets readable (O2) | ✓ | ✓ local | O2 | READY with O2 disclosed |
| Ringkasan Sekolah (`/dekan/ringkasan`) | The school's competencies, gain, cohorts, evidence readiness | Impl; R1, R2, R3, R8 | ✓ | Good | A Dekan scoped to a faculty node is refused the whole page by design. School-wide figures need the school root | ✓ local, read as Admin sekolah | O4 | READY |

### Admin sekolah

| Report | Purpose | Status | Data | UX | Auth | E2E | Remaining | Verdict |
|---|---|---|---|---|---|---|---|---|
| Konfigurasi «Laporan» | The way into both summaries | Impl | n/a | ✓ | ✓ /pimpinan refused by design | ✓ local | none | READY |

### PD participants and facilitators

| Report | Purpose | Status | Data | UX | Auth | E2E | Remaining | Verdict |
|---|---|---|---|---|---|---|---|---|
| Catatan pengembangan profesi, and a PD class's Ringkasan | Per-person steps, no totals (D-069) | Impl | n/a: no aggregate by design | Walked on staging (D4–D7, `staging-p7.md`) | ✓ F33-P01, F33-PA01: no individual response; never treated as a learner population | Staging (earlier build) | Not re-walked in this world | READY on the prior evidence; not re-walked here |

## 5. Open items for the owner (not changed: policy, entitlement or approved design)

- **O1. The action sentence under each figure (S-3, the three-lens rule) contradicts your directive and itself.**
  - S-3 is approved design: every figure carries a sentence saying what to do.
  - The directive says: do not prescribe interventions.
  - On the same 5B card pair, «Pemahaman 56%» says «Ulangi topik ini bersama-sama sebelum lanjut», while «Kenaikan +21» says «Tidak perlu diulang — lanjutkan ke materi berikutnya». The class has 11 of 22 in «Perlu penguatan».
  - **Proposal:** replace the prescriptive lines (`tindakan.ulangi`, `tindakan.lanjut`, `tindakan.fokus*`) with where to look next. For example: «Lihat bagian per topik di bawah»; «Lihat siapa yang perlu penguatan».
  - This changes approved copy: yours and Dr Gladys's to decide.
- **O2. A Dekan reads no class's target.**
  - `assessment_assignments` is readable only to CAN_DRAFT and CAN_ASSIGN_LEARNING.
  - So a Dekan's grid and class summary show no target line and no «di bawah target».
  - Granting the read would be a new entitlement; not done.
- **O3. Bands and «Pemahaman» in a class taught two chapters read each learner's latest Uji Penguasaan, whichever chapter it was.**
  - The page says «menurut Uji Penguasaan terakhir mereka», which is honest.
  - But a class summary mixing chapters is a metric-definition question: per chapter, or latest?
  - Not changed.
- **O4. Is a faculty-scoped Dekan meant to see school-wide figures?**
  - The demonstration school's Dekan sits at «Sekolah Dasar», a faculty node, and is refused the school summary.
  - The golden schools' Dekan sits at the root.
- **Observations:**
  - V1: the «Target 70%» label in section A crowds the 60% tick at 1280 px (cosmetic; to be checked in the re-walk).
  - V2: a lead sentence listing several full objective statements is long. It is correct, but slower than 60 seconds to read.
  - The misconception list (class floor 3 occurrences) appears for 5D, whose other figures are withheld. That is the catalogue's rule, recorded here for your awareness.

## 6. Evidence

Filled in at the final head: commit, CI run, journeys run, the local suite tally and Daisy's verdict.
