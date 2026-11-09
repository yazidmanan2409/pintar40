# PINTAR 4.0 Reporting Acceptance Matrix

Owner directive: Reporting Quality Gate, 9 Nov 2026.

Evidence head: the head after `fd02ec3e` on `claude/awesome-rubin-bqxp6p` (updated 9 Nov, after Sharon's and Daisy's reviews of `e8a5efb9` and the owner's O-B3); the run record is in §12. Every figure below was checked against the raw official results, not against PINTAR's own calculators.

**Gate status: OPEN.** O-B3 decided by the owner (9 Nov, §13). Open coverage: §12.

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
| **D6.** Every subgroup meets its own minimum, learners counted once | Every subgroup row gives `needed` and withholds its mean below the governed minimum: topics, competencies, chapters, Angkatan. Samples count distinct learners: comprehension, topics, competencies, Angkatan, safety gate. ~~«Pemahaman» averages only the chapters that reach the minimum~~ **superseded by decision 7 (§9)**: a combined figure with a small cell is withheld, never recomputed without it. The screens show withheld rows as «belum cukup bukti / belum ditampilkan», never 0 | F35-S01, F35-D01 (a–d, (c) restated to D7), F35-G01, F35-T01, F36-* | Dekan and teacher read the same withheld rows | Re-walked | See §9 | Implemented, then corrected under D7 |

**Population units, metric by metric (D6's wider audit):**
- **Learners, counted once:** `class.participants`, `class.comprehension` and `class.readiness_distribution`. Also `class.topic_mastery`, `class.net_gain`, `class.chapter_mastery`, `institution.participants`, `institution.net_gain` and `institution.competency_outcomes`. Also `institution.cohort_comparison` and `institution.safety_gate_pass_rate`.
- **`institution.verified_credentials`:** certificates, by definition a count of certificates (minimum 1). It is not a learner statistic. Compliant.
- **`class.misconceptions`:** pattern occurrences, ~~minimum 3~~. **Resolved (owner approval, 9 Nov):** each pattern is gated on its own distinct learners against the class minimum (MC-9: 5); occurrences stay occurrences; §9.
- **`item.*`:** results per item (minimum 30), Question Health. Out of this gate's scope.

**Recomputed results (Sharon's finding 5):** every class and school calculator takes each sitting's latest `assessment_results` row (`DISTINCT ON (session_id) … computed_at DESC`).
- ~~Kenaikan takes the highest per learner per chapter~~ and ~~repeated sittings count as sittings in a mean~~: **both superseded by decision 8 (§9)**. Current mastery is one result per learner and chapter (their latest sitting); Kenaikan pairs it with the earliest Pemetaan Awal; no figure reads a highest result.

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

| What | Where | Result |
|---|---|---|
| Candidate commit | `2b3b291e` on `claude/awesome-rubin-bqxp6p` (earlier candidates: `1e50402f`, `13079a9e`, `e8a5efb9`) | See §12 for the exact SHA each CI and journeys run used |
| CI and journeys on 94160304 | CI 512 (42538876168), journeys 219 (42538878758) | **Both failed**, and neither result is used here. CI failed on the 8 local failures found on that SHA, all fixed since. Journeys: A passed; B failed one step, C12a, which pinned the catalogue at 16 metrics (MC-9 adds `class.chapter_mastery`, ruling O3). Restated to 17 |
| Clean-database suite | `scratchpad/selftest-1e50402f.log` (local) | §12 |
| Report world and walk | `audit/fixtures/laporan-lokal.mjs`, `audit/laporan-jalan.mjs` | 7 classes, 66 learners, 172 real sittings; 120 views, all HTTP 200, none scrolls sideways at 1280, 390 or 320 px (§11) |
| Independent figures | SQL over the raw official sittings, not the calculators (§11) | Every page figure checked matches |
| Mutation check | The five calculators of 94160304 swapped back in | Five F36 tests fail, including both of Sharon's reconstruction paths and Daisy's «Sekarang 0 murid». Restored, all pass |

## 9. Owner decisions 7 and 8: the metric contracts

**One evidence rule (D8).**
- A **sitting's effective result** is its most recently computed official result. A recomputation (INV-29) replaces it and is never another attempt.
- A learner's **current result** in a chapter is the effective result of their **latest sitting** of it, latest by when the sitting was finalised, never by when a result was recomputed. A later, lower score is the current score.
- A learner's **baseline** in a chapter is the effective result of their **earliest** Pemetaan Awal of it.
- **No figure reads a highest result.** MC-8's Kenaikan did: it took each test's highest. Its migration says that was carried over «exactly as before», not an owner ruling, so D8 replaces it with no conflict.

**One disclosure rule (D6, D7).**
- The smallest group a report names is a **cell**: one class's learners in one chapter or topic.
- **Row rule.** A row gives its mean only when its own learners reach its governed minimum. Otherwise it gives its learners and `needed`, never a zero.
- **Combined figures.** A figure that combines cells is shown only when every cell reaches the minimum of its own row. Otherwise it is **withheld**: its meaning is not changed by recomputing it without the small cell, and its participation is still every learner who sat. This rule covers Pemahaman over chapters, a school competency or Kenaikan over classes, and an Angkatan over classes and chapters.
- **Kenaikan's pair.** The before → after pair answers only when no pair lies in a withheld chapter and, in every shown chapter, the unpaired learners number zero or at least the minimum.
- **Ordering.** Withheld rows come after shown ones, ordered by name or identifier.
- **Missing minimum.** If a minimum is missing, every mean is withheld.

| Metric | Population unit | Eligible evidence | Result selection | Weighting | Minimum | Subgroup / combined rule | Meaning | Insufficient / withheld |
|---|---|---|---|---|---|---|---|---|
| `class.comprehension` (Pemahaman) | learners (sample); figure over (learner, chapter) | official Uji Penguasaan in the class | current result per learner and chapter | each (learner, chapter) once; equals the chapters' means weighted by their learners (F36-X01) | 5 | withheld if any chapter < 5 (`class.chapter_mastery`'s minimum) | the class's current mastery over the chapters it took | < 5 learners: «belum cukup data, Sekarang n murid»; 0: «belum ada bukti»; a small chapter: «dilindungi … Sudah n murid…» |
| `class.chapter_mastery` (Per bab) | learners per chapter | as above | current result per learner and chapter | learner once per chapter | 5 | each row withheld < 5 | per chapter, current mastery | row: learners + `needed` |
| `class.topic_mastery` | learners per objective | per_domain of the current sitting | as above | learner once per objective | 5 | each row withheld < 5; withheld rows last by statement | mastery per learning objective | row: learners + `needed` |
| `class.readiness_distribution` (bands) | learners | official Uji Penguasaan in the class | each learner's latest sitting, any chapter (approved meaning) | counts | 5 | counts, no means | where each learner stands now | «belum cukup data» |
| `class.net_gain` (Kenaikan) | learners | (learner, chapter) with a baseline and a current result in the class | current − earliest Pemetaan Awal | each pair once | 5 | no per-chapter gain or baseline is shown anywhere, so it needs no complement; the before → after pair has its own rule (above) | improvement from baseline, not current mastery or highest result | «belum cukup data»; pair withheld: «tidak ditampilkan…» |
| `class.misconceptions` | learners per pattern (gate); occurrences (value) | wrong options with a defined misconception, official academic responses | every answer (a measure of answers) | occurrences | 5 learners (MC-9, was 3 occurrences) | each pattern withheld < 5 learners; `withheld` counts them | a pattern shared by enough learners | «n pola lain … kurang dari 5 murid» |
| `institution.competency_outcomes` | learners per objective | current results, school-wide | as above | learner once per objective | 10 | withheld if any class cell < 5 (`class.topic_mastery`) | the school's mastery per learning objective | «n tujuan pembelajaran … belum ditampilkan: kurang dari 10, atau satu kelas terlalu sedikit» |
| `institution.net_gain` | learners | school-wide pairs | as class | each pair once | 10 | withheld if any class's pairs (or pairs in no single class) are < 5 | the school's improvement | «dilindungi … ada kelas …» |
| `institution.cohort_comparison` | learners per recorded Angkatan | current results; the sitting's **recorded** Angkatan | as above | learner once per chapter | 5 | withheld if a (class, chapter) cell is < 5 or split into a small portion; «tidak tercatat» last | mastery by the Angkatan recorded at the sitting | row: learners + reason |
| `institution.safety_gate_pass_rate` | sittings (value), learners (gate) | each sitting's effective result | every sitting (its meaning: «bagian hasil») | per sitting | 10 learners | none combined | share of sittings with every required item right | «belum cukup data»; `sittings` reported |
| `learner.result` | the learner's own sittings | official | every sitting's effective result | — | 1 | — | history: both the 80% and the 60% | — |
| Certificates (`certificate_eligibility`) | one sitting | its sealed result | the lineage's **original** result | — | — | — | the certificate decision, governed separately and unchanged | see escalation E1 |

**E1: decided by the owner (9 Nov), implemented.**
- **Ruling.** A certificate keeps its original sealed result; reports use the latest authorised effective result.
- **Implementation.** When a sitting has been recalculated and the two figures differ, the teacher's learner page says so (`mengajar.murid1.dihitung_ulang`): reports use the latest result, and the certificate and the learner's own page keep the sealed original. Nothing about certificates changes; the audit trail is untouched.
- **Data.** `learner.result` now carries `recomputed` and `sealed_mastery`. The effective result prefers the recalculation over the original it supersedes, including on a timestamp tie.
- **Tests.** F36-E01 runs a 60% → 70% recalculation and the audited `recompute_result` path as SYSTEM_ADMIN. The certificate still reads 60%. D78-E01 covers the page.
- **The defect the real recalculation found.** The audited path writes its row in the same transaction in a test, so the original and the recalculation shared `computed_at`, and reports could keep reading the original. Fixed for every calculator; the verification block requires the fix.

**E2: decided by the owner (9 Nov), accepted for 4.0.**
- One small class withholds every school figure it contributes to. In the report world, 5D (4 learners) and 5C's second chapter (3 learners) withhold every school competency and the school's Kenaikan.
- The page says so: «Sudah ada hasil untuk n tujuan pembelajaran, tetapi belum ada yang dapat ditampilkan…», «Sudah 50 murid punya Pemetaan Awal dan Uji Penguasaan; ada kelas…». It never shows an empty section, a zero or «no participation».
- **4.1 candidate, not 4.0 scope:** privacy-preserving aggregation that keeps school figures useful when one class is small, for example coarsened or ranged values, or a governed residual threshold. It must not change any metric's population, denominator, weighting or meaning.

**Kenaikan weighting: owner's question (9 Nov).**
- The governed contract since MC-8 (H31) averages (learner, chapter) pairs, so a learner with two chapters' pairs counts twice. The calculation follows it: F31-K01 has one learner, two pairs, 0.50 and 0.05, mean 0.275, `pairs` 2, sample 1.
- The meaning line said «per murid», which described the figure wrongly. It now uses Daisy's wording, adopted by the owner: «dihitung per pasangan murid dan bab: murid yang mengerjakan dua bab memberi dua pasangan» (en: «a student who took two chapters gives two pairs»). The base line reads «Dihitung dari {p} pasangan … milik {n} murid». The formula is unchanged. Tests: D78-E01, F31-K01.
- Sharon is asked to verify the weighting independently.

## 10. Sharon's follow-up review of 94160304: dispositions

| # | Finding | Correction | Test | Disposition |
|---|---|---|---|---|
| Pop. 1 | Pemahaman's population changed | Reverted under D7: all chapters, withheld when one is small, participation kept | F35-D01 (c, restated), F36-R01, F36-P01 | **Closed** |
| Pop. 2 | The cohort comparison reads the recorded cohort and the latest result per sitting | D5 approved. D8: one current result per learner and chapter | F35-A01, F36-K01 | **Closed** |
| Pop. 3 | `start_learning_session` records the class's Angkatan | D5 approved; checked again where it is written | F36-H01, F36-H02 | **Closed** |
| Pop. 4 | Three definitions of a learner's chapter result | One rule (§9) | F36-E01, F36-X01 | **Closed** |
| 1 | A withheld chapter can be recovered through Kenaikan | The cell rule; Kenaikan's pair rule; school-level complements | F36-R01 (her exact case and four variants), F36-K01 | **Closed** |
| 2 | Row order reveals withheld means | Withheld rows last, by name or identifier | F36-R02 | **Closed** |
| 3 | Nothing executes D5's recording | A real sitting through `start_learning_session`, then a move, a second sitting and a rewrite | F36-H01 | **Closed** |
| 4 | Stale catalogue note and headers | The note, header and F35 header rewritten; the verification refuses the old wording | Migration verification | **Closed** |
| 5 | F35-G01 lacks the 4 × 3 case | Built inside an Angkatan of its own | F36-G02 | **Closed** |
| 6 | Verification is text-only | Table-by-table comparison with MC-8 (definitions, tiers, thresholds, sources); behaviour in F36, which fails when a guarantee is removed (mutation check, §8) | — | **Closed** |
| 8 | Misconceptions need a learner floor | Owner approved; implemented | F36-M01 | **Closed** |
| `open_assessment_session` | Stores a caller's cohort unchecked | Validated against the class, or the enrolment's placement | F36-H02 | **Closed** |

A focused verification by Sharon is requested on the head named in §12.

## 11. Daisy's re-verification of 94160304 (`ef7e01b8`): dispositions

Daisy's report and screenshots stay as she wrote them on `ux-1/daisy-experience` (`docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/KESIAPAN-LAPORAN-94160304.md`, `verifikasi-94160304/`).

| Item | Daisy's finding | Correction | Where | Test | Seen in the walk (120 views) | Disposition |
|---|---|---|---|---|---|---|
| N1 | No decision line on «Lihat bukti» | Said once, under «Kesimpulan» | `src/app/mengajar/[kelas]/bukti/page.tsx` | D78-N01 | guru bukti-5C: present once | **Closed**, for Daisy to confirm |
| N2 | 5D «Pemahaman» says «Belum ada bukti… 0 murid» | The sample is every learner who sat; a withheld figure says «dilindungi … Sudah n murid»; «Belum ada bukti» only for no evidence | MC-9, `KartuKetiadaan`, `muncul.ts` | F36-P01 (0/1/4/5/4+4), D78-P01 | 5C: «Sudah 7 murid mengerjakan…; ada bab … kurang dari 5»; 5D: «Sekarang 4 murid; perlu 5» | **Closed** |
| N3 | A short title stands alone | The statement on its own line under every short title, in the grid, school A and «Lihat bukti»; «tujuan pembelajaran», not «ranah» | `KisiTopik`, `KomposisiSekolah`, `BarisKesiapan`, `hle.ts` | D78-N03, D78-K01; `b5a` SEKOLAH-01 restated | IPA grid, bukti-5C at 390 px: title, then statement, then figure | **Closed**, for Daisy to confirm |
| N4 | The grid's meaning line implies a target | Three states: every class's target, some, none | `KisiTopik.tsx` | D78-K01 (rendered) | IPA's head (two marks, so no readable target): «Setiap sel … kelas itu sendiri» and «Belum ada target kelas…»; no line or amber | **Closed** |
| A | «Semua soal penting…» under 0 of 8 | The zero is the items answered right. The gate passes vacuously with no required item, so the page now says «Uji ini tidak berisi soal penting yang wajib dijawab tepat» | `belajar/[tugas]/hasil` | D78-S01 | murid hasil-bab: the new line | **Closed** |
| B | «5A · Ada angka» | «Ada angka» only for a performance figure; «Sudah ada yang mengerjakan; angkanya belum dapat ditampilkan»; «Belum ada angka» | `pimpinan/page.tsx` | D78-S01 | kadep: 5A and 5D «Sudah ada…», 5E «Belum ada angka» | **Closed** |
| C | «1murid» | A flex link drops the space: the shared `a.pin-tautan` gets a token gap and wraps | `experience.css` | D78-S01 | — | **Closed**, for Daisy to see at 390/320 |
| Temuan | Padding at 390 px | `.pin-daftar li { display: contents }` erased the panel's box | `experience.css` | D78-S01 | Not in this walk (Studio) | **Closed** in code, for Daisy to see |
| Not seen: «Angkatan tidak tercatat» | — | 5F's pre-MC-9 history in the report world | fixture | F36-K01 | admin sekolah: «Angkatan tidak tercatat saat Uji Penguasaan · 6 murid · 58%» | **Exercised** |
| Not seen: a withheld chapter or topic in a class | — | 5C's chapter 2 (3 learners) | fixture | F36-R01 | ringkasan-5C, bukti-5C | **Exercised** |
| Not seen: no readable target | — | IPA department | fixture | D78-K01 | kadepIpa pimpinan | **Exercised** |
| Not seen: English pages | — | the walk's English readers | walk | D78-P01 (en) | guruEn, dekanEn, muridEn: 18 views | **Exercised** (wording for Daisy) |

**Independent figures (§8).** Plain SQL over the raw official sittings, not the calculators, gives:
- 5B Bab 1: 60.2% over 22 learners; Bab 2: 59.4% over 20. So Pemahaman = (22 × 0.6023 + 20 × 0.5938) / 42 = **59.8%**, and the page says «Pemahaman kelas: 59,8%».
- 5C Bab 1: 37.5% over 7 (the page shows «38% · 7 murid»); Bab 2 over 3, withheld; Pemahaman withheld with its 7 learners.
- 5F: 12 sittings with no recorded Angkatan, 6 learners, 58.3% (the page shows «6 murid 58%»).

## 13. Owner decisions D9–D14, Sharon's review of 13079a9e and Daisy's A1–A7: dispositions

### Decisions

| Decision | What was done | Where | Test | Disposition |
|---|---|---|---|---|
| D9: audited management access to one learner's record | Verified, not changed. `management_learner_detail` admits only HEAD_OF_DEPARTMENT and DEAN over the learner (`audience_scope_over_learner`), and each open writes `learner_detail.opened`. The admin, the educator and the learner are refused, and a refusal writes no audit row. Aggregates still go through the cell rule (§9). | `management_learner_detail` | F06-P10 (25 cases: three opens give three audit rows, six refusals give none) | **Verified** |
| D10: Sharon's mover reconstruction | Complementary suppression. A (class, chapter) cell holding 1–4 learners who moved and re-sat elsewhere withholds that chapter's school competency rows and the Angkatan rows that touch the cell. The test was written first and seen failing: «6 × 0.6750 − 5 × 0.6500 = 0.8000 … school competency (0.5636) shown» (kept in the evidence pack). It now passes. After Sharon's review of `e8a5efb9`, a row withheld only for a mover says so (`withheld: 'moved'`, «ada murid yang pindah kelas lalu mengerjakannya lagi»), never «a class took it with too few learners». | MC-9 calculators, `KomposisiSekolah` | F36-K02, D78-N03 | **Verified by Sharon** (`e8a5efb9`; every pair tried, none gives the mover). The `moved` reason is for her re-check |
| D11: effective result chosen by supersession | Every reader takes the result nothing supersedes (`NOT EXISTS … q.supersedes_result_id = r.id`). The verification block refuses any reader without that rule. A second recalculation gets the designed refusal PR011. This pass also found **`tujuan_belum_tercapai`** (the objectives on the teacher's learner page) still choosing by timestamp. It is now structural and listed in the verification block. Two concurrent recalculations: the loser now gets the same PR011 refusal, not a raw unique violation (Sharon, `e8a5efb9`). | MC-9 | F36-L01 (recalculation stamped an hour *before* its original; identical timestamps; three repeated reads; certificate; PR011) | **Verified by Sharon** (14 readers; originals read only where E1 needs them). The PR011 catch is for her re-check |
| D12: a gate with no required question | NOT APPLICABLE, outside the denominator. The value is a share of the applicable *sittings* (`sittings`), and the evaluator says `laporan.metrik.tidak_berlaku`. A shown gate also says how many tests were not applicable. Each reader shows it the same way: the learner sees «Uji ini tidak berisi soal penting…»; the school page and the absence card say «Tidak berlaku: …», never 100%, a zero or «belum cukup». Teachers and management have no gate figure. After the reviews: the base counts results, «Dari 10 hasil Uji Penguasaan yang memuat soal wajib, milik 10 murid» (Sharon). Below the school minimum the card reads «Dari hasil Uji Penguasaan yang memuat soal wajib, baru 1 murid; perlu 10», with the not-applicable results set apart (Daisy's B1). | MC-9, `KartuKetiadaan`, `KomposisiSekolah`, `belajar/[tugas]/hasil` | F36-S01, F36-G02, D78-A01, D78-B01, D78-S01 | **Verified by Sharon** (denominators). Wording **for Daisy's re-check** |
| D13: objective coverage | The class lead counts over the topics *with a figure* («1 dari 3 topik yang punya angka…»). The withheld ones are counted apart («2 topik lainnya belum dapat ditampilkan, jadi belum diketahui apakah sudah mencapai target»). «Semua topik sudah mencapai target» is never said while one is withheld, and a class with every topic withheld says so. The school already counted shown objectives and states the withheld ones by reason (A5). | `KomposisiKelas`, `KomposisiSekolah`, `hle.ts` | D78-A01, D78-N03 | **Verified** by Sharon and Daisy (`e8a5efb9`) |
| D14: communicating a recalculation | The teacher's note sits directly under the figure (`CatatanHitungUlang`). It gives both figures and the recorded reason, and nothing when they agree. The learner's chapter result shows a neutral notice from `sesi_saya_dihitung_ulang` (their own sitting, yes or no) and still shows the sealed result; the certificate is unchanged. The real audited path was verified: `recompute_result` run as SYSTEM_ADMIN re-scores the answers (mastery and per_domain) and writes an audit row. Then the teacher's record shows the new figure with the sealed one and the reason; Section E decides on the recalculation with its own count; the objectives read it (D11 fix above); the learner's page keeps the sealed figure and sealed objectives; only the learner is told. Per-question evidence reads the responses, which a recalculation does not change. After Daisy's B3: the learner's «Terjawab tepat n dari m» is the sealed result's own count, and the notice claims only the mastery, the count and the certificate. The per-question review grades by today's key (owner decision **O-B3**). | `CatatanHitungUlang.tsx`, `murid/[orang]`, `belajar/[tugas]/hasil`, `hasil-belajar.ts`, MC-9 | F36-D14, D78-E01 (rendered), D78-A01, D78-B01 | **Verified** by Sharon (all five points) and Daisy (teacher's note; the real path staged). The learner's page is **open on O-B3** |
| Further regressions | Independent figures: school competency 0.675 over 24 and the school's Kenaikan, counted by hand, 0.58 over 10 pairs (F36-K01); Kenaikan 0.275 over 10 pairs (F36-X01). The tie test is strengthened (F36-L01). The E1 source regex is replaced by a rendered component test (D78-E01). | — | F36-K01, F36-X01, F36-L01, D78-E01 | **Closed** |
| Historical disclosure (Sharon's temporal concern) | Assessed against supported workflows. Reproducible: re-reading one class's Kenaikan before and after a small chapter is sat. Fixed: the class Kenaikan is withheld while any chapter's pairs number 1–4, and the school's Kenaikan uses (class or no class, chapter) cells. The residual is recorded as its own accepted risk, **R-T1**, below (not under E2). | MC-9 | F36-R01, F31-K01 | **Fixed; R-T1 accepted, verified by Sharon** |

### Accepted risk R-T1: one learner's result through repeated viewing (Sharon, e8a5efb9)

- **What it is.** Any shown mean read before and after its group grows by one learner gives that learner's result exactly. For example, a «Per bab» row read at 5 learners and again at 6 gives the sixth learner's score; band counts work the same way.
- **Who it matters for.** Only the School Admin. Teachers, and the Kepala departemen and Dekan through D9, may already read individual results.
- **Why no 4.0 change.** It needs no new privacy architecture, and the cell rules cannot close it. Comparison over time is open to anyone who reloads, and stored `generated_reports` are readable only by their author or scope, with no UI reading them.
- **4.1 candidate.** Privacy-preserving aggregation over time, beside E2's candidate.

### Sharon's verification of e8a5efb9: dispositions

All seven items were verified. Each finding and note is disposed of below; this pass changed no figure she verified.

| Item | Sharon's finding or note | Disposition | Test |
|---|---|---|---|
| 1, D10 | Low–Medium. A row withheld only because a learner moved class and re-sat was tagged `class`, so the page blamed «a class took it with too few learners» although class X has six learners | A third reason, `moved`, in the school competency and Angkatan calculators, used only when no small cell applies. The page says «…karena ada murid yang pindah kelas lalu mengerjakannya lagi…» (Angkatan: «ada murid yang pindah kelas lalu mengerjakan suatu bab lagi»), in Indonesian and English | F36-K02 (the competency row says `moved`; no row says `class`), D78-N03 |
| 2, D11 | Low. Two concurrent recalculations can both pass the PR011 check; the loser met the raw unique-constraint error | `recompute_result` catches `unique_violation` on the insert and raises the same designed PR011 refusal. The outcome is still exactly one recalculation | F36-L01 (PR011 on a second recalculation) |
| 3, D12 | Wording. «Dari 12 Uji Penguasaan…» counts sittings, which can read as twelve different tests | «Dari 10 **hasil** Uji Penguasaan yang memuat soal wajib, milik 10 murid» and «12 hasil Uji Penguasaan lain berasal dari uji tanpa soal wajib…», for Daisy to confirm | D78-A01 |
| 6 | The residual is broader than band counts and is not an E2 matter | Recorded as R-T1 above | — |
| 7, D9 | Verified against the matrix's statement of the ruling | The consequence stands: the cell rules protect against the School Admin only | F06-P10 |

### Daisy's verification of e8a5efb9: dispositions

Daisy's report: `docs/coordination/ux/completion-4.0/CONTOH-LAPORAN/KESIAPAN-LAPORAN-e8a5efb9.md` on `ux-1/daisy-experience` (`8dac7681`), with evidence in `verifikasi-e8a5efb9/`. She confirmed nine items in full (A3–A7, «Yang menunggu», Kenaikan, `#487A6F`, «2 di antaranya»), and items 1 and 8 apart from B1 and B3. For D14 she staged the real path: a corrected key, then `recompute_result` as SYSTEM_ADMIN (12.5% → 25%, `per_domain` re-scored, one audit row).

| Item | Daisy's finding | Correction | Test | Disposition |
|---|---|---|---|---|
| B3 | After a real recalculation the learner's result reads «Penguasaan 13% · Terjawab tepat 2 dari 8 soal»: the 13% is sealed, but the count re-grades the answers against today's corrected key; the same on «Hasil belajar»; the notice «tidak berubah» was not true of the count | The count is now the sealed result's own (`delta_inputs.correct` / `item_total`, which every writer records), on both pages (`hitunganSegel`). The notice now claims only what is sealed: «Penguasaan dan jumlah jawaban tepat di atas, serta sertifikat Anda, tetap hasil yang disegel…» | D78-B01, D78-A01 (restated) | **Closed** for the count and the notice. **Escalated:** the per-question review (below) |
| B3, per question | The per-question review marks the corrected question «Sudah tepat» | `session_review` and `reading_map` grade the answers live against today's key («recomputable, never stored», 20260913091500). No per-item grade is sealed anywhere, so «keep everything the learner sees sealed» would need a new sealed record. That is a new decision, not within E1/D14. | D78-B01 | **Decided (O-B3, below) and implemented** |
| B1 | The school's gate below its minimum read «Sekarang 1 murid; perlu 10» beside «Peserta 52», never saying the other 51 are not applicable | The evaluator passes `not_applicable` below the minimum too. The card reads «Dari hasil Uji Penguasaan yang memuat soal wajib, baru 1 murid; perlu 10. 51 hasil Uji Penguasaan lain berasal dari uji tanpa soal wajib, jadi tidak dihitung…» | D78-B01 | **Closed**, for Daisy |
| B2 | Ringkasan Sekolah ends «Pimpinan › «Kesiapan bukti»», which the Admin cannot open | The step points to the page's own section by its letter: «Bagian D di atas, «Kesiapan bukti», menyebut…»; with no such section it is not said | D78-B01 | **Closed** |
| A4 | «NOT YET ATTEMPTED 1 learners» | `format.satuan` on every count-and-noun built from `mengajar.bukti.murid` («1 learner») | D78-B01 | **Closed**. «students» and «learners» still both appear (~30 each); unifying them is a terminology change for the terminology owner, not done here |
| Teacher's note | Put the target line before the note | Not changed in this pass; for Daisy to decide | — | Open, optional |
| Palette | `#487A6F` confirmed; «Mantap» and «Berkembang» are now 1.51:1 apart (from 1.72:1); keep the light gap between segments | The gap is `var(--border-selected)` in `.pin-lk-pita-batang` (component CSS) | — | Confirmed |
| Optional | «—» repeated in eight blocks for classes with no figure; the Kepala departemen's print ends with a page holding only «Lihat lebih rinci» | Not changed in this pass | — | Open, optional |

**O-B3, decided by the owner (9 Nov).**
- **The ruling.** The learner's sealed mastery, correct-answer count and certificate stay unchanged. The per-question review and the reading map may use the current, corrected answer key, as they do today. When a recalculation changes the grading, the page explains that the per-question feedback reflects the corrected key and may differ from the original sealed result. Nothing may imply that the sealed assessment or certificate changed. No historical per-item grade storage in 4.0.
- **Implemented: the chapter result.** Where the review's current-key grading differs from the sealed count (a corrected key, recalculated or not), a note sits directly under «Tinjau kembali», above the questions: «Tanda «Sudah tepat» dan «Belum tepat» pada soal-soal di bawah mengikuti jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil yang disegel di atas (n dari m soal tepat). Hasil yang disegel dan sertifikat Anda tidak berubah.» It names the badges the learner sees, not a section name.
- **Seen rendered after a real recalculation** (local, `54b3323f`; Daisy's staging: a corrected key, then `recompute_result` as SYSTEM_ADMIN, 12.5% → 25%, one audit row). The learner's Bab 2 shows the sealed «13% · Terjawab tepat 1 dari 8 soal», the sealed per-objective counts (summing to 1) and the notice. The note sits above eight questions, two marked «Sudah tepat» under today's key. «Hasil belajar» shows «1 dari 8 soal», 13%.
- **Implemented: the reading map.** A recalculated Pemetaan Awal's reading map says the same («Peta ini mengikuti jawaban benar yang sudah diperbaiki…»; learner copy never says «kunci jawaban», DAISY-26).
- **Unchanged.** The notice under the result («…tetap hasil yang disegel…») and the sealed count (B3) stay as they are.
- **Limit.** The reading map's note shows only for a recalculated sitting. A key corrected *without* a recalculation is not detected there (the chapter result does detect it, by comparing counts). Recalculation is the audited path for a corrected key.
- **Tests.** D78-B01 (source and wording, both languages: the corrected key named; the sealed result and certificate said not to change).
- **Verification asked.** Daisy: can a first-time learner tell the sealed result from the current-key feedback? Sharon: do the evidence and recalculation contracts stay consistent?

### Daisy's report on 13079a9e

| Item | Correction | Test | Disposition |
|---|---|---|---|
| A1, A2: denominators | D13 above | D78-A01 | **Closed**, for Daisy |
| A3: topic grid on phones | Stacked below 640 px: one topic per block, each class's figure with its mark and dash, plus a block of class bases and targets. The table stays for wider screens and print, and only one of the two is ever displayed, so a screen reader meets the figures once. | D78-A01 (rendered and CSS) | **Closed**, for Daisy at 390/320 |
| A4: English | «Initial Mapping» everywhere (no «Pre-assessment»); «Answered correctly: 3 of 8 questions»; «an Initial Mapping»; `format.tunggal` makes «1 students so far» «1 student so far» on the absence sentences, band key and chapter rows | D78-A01 | **Closed**, for Daisy |
| A5: «this or that» explanations | Each withheld school objective and Angkatan row is stated with its own `withheld` reason (`learners` or `class`) | D78-N03 (restated) | **Closed** |
| A6: screen-reader order | «di bawah target» is read with the percentage, before the learners («50% (di bawah target) · 6 murid») | D78-A01 | **Closed** in markup; a real screen-reader pass is in §12 |
| A7: references to hidden sections | A withheld figure is explained once, by its reason; the second «muncul setelah…» line, with its «Per bab» pointer, is gone and its keys removed | D78-A01, D78-P01 (restated) | **Closed** |
| Cosmetic: «1» on its own line | `a.pin-tautan` no longer wraps; its gap stays | D78-S01 (restated) | **Closed**, for Daisy |
| Kenaikan wording | Daisy's wording, §9 | D78-E01 | **Closed** |
| E1 staging | Daisy's staging changed only `mastery`. A real recalculation re-scores `per_domain` too, and F36-D14 runs that path. | F36-D14 | **Answered** |

Restated tests (each with a note in the test): D78-P01 (A7), D78-N03 (A5), D78-S01 (no wrap), D78-E01 (rendered note, reason), F31-K01, F32-E01, F33 (shown chapters only), M4-K01, C12a, plant bob37-3.

## 12. Coverage still to complete (not converted to PASS)

### Run record (exact SHA)

| Head | What changed | CI | Journeys |
|---|---|---|---|
| `1d607822` | bob37-3 plant restated | 515 green | 222 red (S22m, restated in `d840b12f`) |
| `1f28a08d` | D12–D14, A1–A7 | superseded | superseded |
| `d840b12f` | clean-suite fixes; S22m restated | 518 green | 224 cancelled (superseded) |
| `48e94e7c` | walk fixes (contrast, «di antaranya») | 519 red (F36-M01 item choice, a test bug) | **225 green** |
| `e8a5efb9` | F36-M01 item chosen by property | **520 green** | 226 cancelled (superseded) |
| `f8d933bc` | Sharon's findings (`moved`, PR011, «hasil», R-T1) | **521 green** | 227 cancelled (superseded) |
| `2b3b291e` | Daisy's findings (B1, B2, B3 count, «1 learner»); matrix | 522 cancelled (superseded) | 228 cancelled (superseded) |
| `1036ca51` | matrix only | — | — |
| `54b3323f` | O-B3 implemented | 523 cancelled (superseded) | 229 cancelled (superseded) |
| `fd02ec3e` | O-B3 note names the badges (seen rendered after a real recalculation) | 524 red: 910 passed, 1 failed, DAISY-26-BELAJAR-01 (learner copy may not say «kunci jawaban», which reads as locking an answer) | **230 green** |
| next | the O-B3 notes reworded to «jawaban benar yang sudah diperbaiki» | to run | to run |

### Open

| Area | State |
|---|---|
| Exact-SHA CI and journeys on the final head | CI 524 on `fd02ec3e` failed only DAISY-26-BELAJAR-01, fixed in the next head; journeys 230 green on `fd02ec3e`. Both to run on the next head |
| Clean-database suite | The whole suite ran on `1f28a08d` (5 failures, all fixed or restated, each rerun green). Since then: targeted runs on a fresh database: `f8d933bc` 66 passed; `2b3b291e` 88 passed (D78, LAPORAN, M4-K01, F36, F06, F31, F35). The whole suite on the final head is still to run (CI's selftest job runs it) |
| Report walk | On `d840b12f`: 120 views, all 200, none scrolls sideways. CEK at 1280 (40 views) found one axe colour-contrast failure («Berkembang», 4.28:1), fixed; on re-check 0 violations, print clean, A6 tree snapshot «60% (di bawah target) · 22 murid». Daisy's walk on `e8a5efb9` (120 + 40 views) agrees. B1–B3 changed pages after that; not re-walked |
| Sharon | Verified `e8a5efb9`; dispositions in §13. **Re-check requested** on the final head: the `moved` reason, the PR011 catch, the gate below its minimum, and O-B3: the evidence and recalculation contracts stay consistent |
| Daisy | Verified `e8a5efb9` (`8dac7681`); dispositions in §13. **Re-check requested** on the final head: B1–B3, the «hasil» wording, the `moved` sentence, and O-B3: a first-time learner telling the sealed result from the current-key feedback |
| Owner | O-B3 decided and implemented (§13). For the terminology owner: «students» and «learners» both appear in English |
| Staging | Not exercised: no deployment is authorised |
| Screen readers (NVDA, TalkBack) | The accessibility tree is checked in the walk; no real screen reader has been run |
| PD reports | Not changed by this pass; not re-walked |

**Gate status: OPEN.** It closes only when the open rows above are done and both reviewers confirm, including their O-B3 checks.
