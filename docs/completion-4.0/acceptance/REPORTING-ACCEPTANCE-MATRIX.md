# PINTAR 4.0 Reporting Acceptance Matrix

Owner directive: Reporting Quality Gate, 9 Nov 2026.

Evidence head: see §8 and §12. Every figure below was checked against the raw official results, not against PINTAR's own calculators.

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
| Candidate commit | `1e50402f` on `claude/awesome-rubin-bqxp6p`, plus the C12a restatement (§12) | See §12 for the exact SHA CI and journeys ran on |
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
- The meaning line said «per murid», which described the figure wrongly. It now reads «dihitung per murid per bab: murid yang mengerjakan dua bab dihitung dua kali», and the base line reads «Dihitung dari {p} pasangan … milik {n} murid». The formula is unchanged. Tests: D78-E01, F31-K01.
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

## 12. Coverage still to complete (not converted to PASS)

| Area | State |
|---|---|
| Clean-database suite on the final head | Running at the time of writing; the tally is recorded with the head |
| Exact-SHA CI and journeys on the final head | To dispatch on the pushed head |
| Sharon's focused verification (§10) | Requested |
| Daisy's focused re-verification: N1, N3, C, Temuan, the English wording, the three new states | Requested |
| Staging | Not exercised: no deployment is authorised |
| Screen readers (NVDA, TalkBack) | Not exercised in this gate; scripts exist from task 73 |
| A4 print of the changed reports | Journey A's print walk runs in CI; the changed states are not yet printed by hand |
| PD reports | Not changed by this pass; not re-walked |

**Gate status: OPEN.** It closes only when §12's open rows are done and both reviewers confirm.

