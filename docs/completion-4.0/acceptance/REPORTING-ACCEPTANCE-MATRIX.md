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

## 5. Owner decisions (9 Nov) and how each was implemented

The owner approved the four questions this gate raised (O1–O4) and Sharon's findings (D5, D6). All six are binding 4.0 decisions. The commit and test evidence are in §8.

| Decision | Implementation | Tests | Cross-role | Visual | Limitations | Verdict |
|---|---|---|---|---|---|---|
| **O1.** No prescribed teaching interventions | `actionText` (`src/app/_intel.ts`) returns Daisy's line for each lens. It is the same whatever the value and points to a place in PINTAR. The page says «PINTAR menunjukkan; langkah berikutnya Anda yang memutuskan» once. A figure with no value keeps its «not yet» sentence, so missing evidence is still told apart from a finding | PITA-01 restated to O1; LAPORAN-KELAS-01 | Teacher, leaders and admin read the same lines | Re-walked (§7) | Misconception remediation tips are the chapter author's content, shown as «Saran penanganan»; not changed | Implemented. Daisy to confirm wording |
| **O2.** The Dekan reads targets within scope | `target_kelas(p_class)`, a SECURITY DEFINER function, gives each chapter's sealed Uji Penguasaan mark and nothing else. It goes to readers of the assignments, or to an audience of the class's own figures over that class (`audience_on_node`). `targetKelasDari` reads it | F35-O2: teacher, Dekan, Admin and Kepala departemen yes; another school's teacher and Dekan no; anon refused; returns only the release and the mark | The school's other teachers keep exactly the read the table already gave them; nothing is widened | Grid key without targets (F3) | — | Implemented |
| **O3.** Chapters kept apart; aggregation explicit | Catalogue metric **class.chapter_mastery** (MC-9, minimum from the class catalogue): per chapter, its learners counted once and their mean, or no mean under the minimum. Ringkasan Kelas section B lists the chapters when there are two or more, and says the bands use each learner's latest Uji Penguasaan from any chapter. Bands keep their governed contract | F35-D01 (c, d) | Teacher and Dekan get the same chapter figures | Re-walked | Bands still follow each learner's latest result, now said on the page | Implemented |
| **O4.** School summary follows authority over the whole school | Already enforced: `institution.*` needs an audience role at the school's root (`audience_on_node`). A Dekan over one Bagian is refused, and the page now shows the refusal page (R8). /pimpinan offers «Ringkasan sekolah» only when a school figure is readable | F35-O4: Dekan at root and Admin yes; Dekan over a Bagian, another school's Dekan, Kepala departemen and teacher no | — | Refusal page | The demonstration school's seeded «Pak Hendra (peraga)» sits at the Sekolah Dasar Bagian, so by this model he holds part of the school. The model cannot tell that this Bagian is the whole school. Recorded rather than guessed; if he is meant to lead the school, his grant belongs at the root | Implemented; ambiguity recorded |
| **D5.** Historical cohort attribution | `start_learning_session` now records, at the sitting, the Angkatan above the learner's Kelas. Provenance is immutable (INV-33). The cohort comparison reads only the recorded cohort. Sittings that recorded none form an explicit «Angkatan tidak tercatat» row and are never placed by today's structure. No evidence is rewritten. There is no correction mechanism in 4.0, and provenance cannot be edited, which keeps history stable | F35-A01: an unrecorded row; a class moved after its sittings keeps them under the old Angkatan; a recorded cohort cannot be rewritten. End to end: 102 of 102 new sittings in the report world recorded their Angkatan | — | «Angkatan tidak tercatat» named | Historical sittings before this build stay «tidak tercatat»: staging today has only those. A promotion, or a transfer between classes, keeps each sitting's own Angkatan | Implemented |
| **D6.** Every subgroup meets its own minimum, learners counted once | Every subgroup row gives `needed` and withholds its mean below the governed minimum: topics, competencies, chapters, Angkatan. Samples count distinct learners: comprehension, topics, competencies, Angkatan, safety gate. «Pemahaman» averages only the chapters that reach the minimum, so a withheld chapter cannot be recovered. The screens show withheld rows as «Belum cukup bukti — kurang dari {m} murid», never 0 | F35-S01, F35-D01 (a–d), F35-G01, F35-T01 | Dekan and teacher read the same withheld rows | Re-walked | See the population units in §6 | Implemented |

**Population units, metric by metric (D6's wider audit):**
- **Learners, counted once:** `class.participants`, `class.comprehension` and `class.readiness_distribution`. Also `class.topic_mastery`, `class.net_gain`, `class.chapter_mastery`, `institution.participants`, `institution.net_gain` and `institution.competency_outcomes`. Also `institution.cohort_comparison` and `institution.safety_gate_pass_rate`.
- **`institution.verified_credentials`:** certificates, by definition a count of certificates (minimum 1). It is not a learner statistic. Compliant.
- **`class.misconceptions`:** pattern occurrences (minimum 3). **Contract ambiguity, documented, not changed:** a class with one learner who makes three errors shows that learner's patterns to the Kepala departemen and the Dekan.
  - **Proposal:** also require the class's learner minimum (5 learners with a result) before the list is shown. The owner decides.
- **`item.*`:** results per item (minimum 30), Question Health. Out of this gate's scope.

**Recomputed results (Sharon's finding 5):** every class and school calculator takes each sitting's latest `assessment_results` row (`DISTINCT ON (session_id) … computed_at DESC`).
- The cohort comparison now does the same.
- Kenaikan takes the highest per learner per chapter, so a recomputation never adds weight.
- Legitimate repeated sittings still count as sittings in a mean (the governed rule) and once as a learner in the population.

## 6. Sharon's independent review (5cca6a5f): dispositions

| # | Finding | Disposition |
|---|---|---|
| 1 | The cohort table passes its minimum with duplicated learners; small rows show their mean | **Corrected** (D6): sample = distinct learners; each row withholds its mean below the governed minimum. F35-D01 |
| 2 | The safety gate counts results | **Corrected**: sample = distinct learners. The base line reads «Dari {n} murid yang mengerjakan Uji Penguasaan». F35-G01 |
| 3 | `org_nodes` declared as a raw metric source | **Corrected**: the fallback that needed it is gone (D5 records the cohort at the sitting). No calculator reads org structure, and `org_nodes` is not declared. Verified in the migration's verification block |
| 4 | The cohort is resolved from today's tree | **Corrected by owner decision 5**: recorded at the sitting; never inferred. F35-A01 |
| 5 | The cohort mean counts recomputed results twice | **Corrected**: latest result per sitting. Other calculators were verified compliant (§5) |
| 6 | Verification block partial | **Corrected**: a column-by-column copy-forward check of definitions and tiers, people-counted bodies, no `org_nodes`, and the recording in `start_learning_session` |
| Q | Can a VALIDATED package be submitted only by its author? | **Verified compliant**: `langkah_konten` requires CAN_DRAFT in the school and no authorship, so «Menunggu tindakan Anda» counting the school's VALIDATED packages for CAN_DRAFT readers matches what they may do. Decision 3 unchanged |

The implementation differs materially from what Sharon reviewed:
- the cohort calculator;
- the new chapter metric;
- per-row suppression;
- `target_kelas`;
- `start_learning_session`.

A focused follow-up review is requested (§8).

## 7. Daisy's design verification (5cca6a5f, `afdae96d` on ux-1/daisy-experience): dispositions

| Item | Daisy | Disposition |
|---|---|---|
| Decision 3, Studio counts | READY | Kept |
| Content-check refusal | READY; R9's walk photographed «Memproses…» | R9 now waits for the finished state (`audit/siap-jalan.mjs`) |
| Decision 1 | NOT READY (F5) | **F5 corrected**: the setup step is not done while learners lack a class, and it links to Pindah (ADM02). The end-to-end case is in the report world: a learner with an account and a registration number, listed in the admin's Pindah, sees the message on /belajar |
| F1, section E «.,» | Must fix | **Corrected**: `daftarKata` (LAPORAN-KELAS-02 restated) |
| F2, Hasil per bab heading | Must fix | **Corrected for the whole class**: `namaBab` on every learner page that names a chapter (LAPORAN-MURID-02) |
| F3, Dekan's grid key | Must fix | **Corrected**: targets now readable (O2); with none, the key says so (`laporan.kisi.tanpa_target`) |
| F4, 19 misconceptions | Must fix | **Corrected**: at most eight in the summary, «N pola lain ada di «Lihat bukti»». Every pattern stays in Lihat bukti |
| V1, target label over the 60% tick | Must fix | **Corrected**: named once in the key («Garis tegak: target kelas, 70%…»); every tick kept (LAPORAN-KELAS-01 restated) |
| V2, long leads | Approved by the owner with a condition | **Implemented**: above two items, a count, the lowest and a pointer to the list. Topics are named by short titles only where the lesson has exactly one objective (Studio's intake writes one per lesson); otherwise by the statement |
| O1 wording | Design input | **Implemented** with her lines (§5) |
| School-summary rows at 100% for one learner | Confirm the minimum | **Confirmed a real D6 defect, corrected**: the demo chapter's one learner now shows «belum cukup bukti», never 100% |
| Temuan cards' inner padding at 390 px | Noted | Open (cosmetic), for Daisy's re-check |

## 8. Evidence

Filled in at the final head: commit, CI run, journeys run, the local suite tally and the reviews.
