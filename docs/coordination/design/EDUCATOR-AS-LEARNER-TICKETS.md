# Educator as learner: ticket set

**Status: APPROVED by Yazid, 30 Sep 2026. Rows opened on the board** (section *Educator as learner*). Every decision is ruled (D-069, D-070, including clarifications (g)–(i)); the set has no open question. Prepared 30 Sep 2026 from D-069, the rulings on `EDUCATOR-AS-LEARNER-ASSESSMENT.md` §6, and updated the same day with D-070, the rulings on the six questions in §8.

- Nothing is implemented.
- The rows are open on the board as TODO; nothing starts before Gate 2E, and each lane takes them only after every item already in its queue.
- Bob, Daisy and Lana stay paused until Gate 2E is released.
- The gate order is unchanged.

**Basis:**
- **D-069** (a)–(m): purpose and invariant, visibility, integrity, place, demo route, home, content, senior roles, certificate, roadmap, terminology, the metric hard gate, acceptance.
- **D-070** (a)–(f): the six questions of §8 (DR-1 to DR-6).
- D-068 (Terminology v1) and its D-069(k) note.
- D-060 (version discipline).
- D-047 (interaction states).
- D-006 (structure).
- The educator content standard, `content/EDUCATOR-LEARNING-CONTENT-STANDARD.md`, now including the visual and experience rule.

References are `path:line`. M = `supabase/migrations/`, S = `src/`, T = `selftest/`.

---

## 1. §6 is fully ruled

| §6 decision | Ruling (D-069) |
|---|---|
| 1. Who may see PD evidence | (b): participant; facilitator; the Kepala departemen responsible for the PD Bagian; Dekan; Admin sekolah (enrolment, participation, completion only); other Guru nothing; Management decision screens nothing; Admin platform existing access only. Enforced at the database. |
| 2. Integrity signals | (c): recorded; not surfaced to leadership, the facilitator or Management; never referable |
| 3. Form of the boundary | (d): an explicit fact on the Bagian, inherited, enforced both ways in the database |
| 4. Demo route | (e): the product path; no operator preview |
| 5. PD home | (f): a dedicated Bagian → Tingkat → Kelas in each school's own tenant |
| 6. Content | (g): close adaptation of two chapters, internal demo only; [UJI INTERNAL]; Lana's branch only; removed after the demo unless rights are obtained |
| 7. Senior roles | (h): may learn; demo EDUCATOR-only; their shell and tour are UI/UX POLISHED |
| 8. Certificate | (i): existing engine; proven in Venue 1; verification page unchanged |
| 9. Roadmap | (j): a bounded 4.0 capability; after Gate 2E; nothing reordered |

All nine are ruled. Preparing the tickets exposed six narrower questions that the rulings did not settle; Yazid ruled all six the same day (D-070, summarised in §8).

---

## 2. Reconciliation: rulings against the assessment and the architecture

| # | Point | Resolution |
|---|---|---|
| R1 | **Staff see individual PD scores (rulings 1B–1D).** PINTAR's doctrine is that a number reaches a staff screen only through the metric catalogue (S/lib/pengajar.ts:33-39; migration 0072). Teachers today see no individual score even for students. The catalogue admits a PD row only to its owner (`row_in_learning_context`, M/20260927100000:84-98). | No product conflict. BOB-47 routes the ruled audiences' PD scores through the catalogue's `learner.result`. That publishes a new catalogue version (D-060(a)); every academic calculator stays byte-identical. The facilitator will see a Guru-participant's score, which no teacher sees for a Murid. That asymmetry is the ruling's, stated here so it is seen. |
| R2 | **Ruling 3 supersedes the code's statement that "an organizational node carries no context of its own"** (M/20260930100000:105-111; M/20261001100000:125-131). | BOB-43 adds the fact. The academic-only feedback refusal stays as it is and remains correct. |
| R3 | The assessment's "safe default" (Management sees nothing) is superseded. HoD and Dean now see results (1C, 1D), but not in Management decision screens (1G). | **Ruled (D-070(a)):** one read-only professional-learning record per PD Kelas (BOB-47, DAISY-34). |
| R4 | Today the Kepala departemen and Admin sekolah read answers and integrity signals school-wide (CAN_REVIEW_INTEGRITY), and every Guru reads sessions and lesson progress school-wide (CAN_ASSIGN_LEARNING). | BOB-46 narrows **PD rows only**. Academic access is unchanged and proven unchanged. |
| R5 | **Admin sekolah: "flag any operational need for more".** Checked: transfers use the enrolment only, and Pendataan and Konfigurasi read none of this. | No need found; nothing flagged. |
| R6 | **Facilitator answers: "raise a conflict with an essential workflow".** Checked: EDUCATOR holds no CAN_REVIEW_INTEGRITY, and no teacher surface reads `responses`. Teachers mark no answers in 4.0. | No conflict; the facilitator gets no answers. |
| R7 | **The Dekan lacks CAN_VIEW_LEARNER_RESULT** (M/20260926100000:143-162). | BOB-47 gives the Dekan PD scores through its audience-checked read and the catalogue. It does **not** broaden RLS on academic results. |
| R8 | **Integrity and Admin platform (rulings 1H and 2).** | School roles see no PD signal. Admin platform keeps its existing read and the existing review outcomes, **except referral**, which is refused for PD for everyone. Confirmed by Yazid (D-070(i)). |
| R9 | **«Peserta».** Terminology v1 defines it as "participants in a measurement". D-069(k) extends it to the professional-learning participant. | Recorded as a note on D-068 and in the freeze package §1. Both meanings are "those taking part". The professional-learning record (D-070(a)) shows no figures. The one place both could meet is the PD Kelas's existing «Lihat bukti» page, whose academic figures are empty by design there; how that page presents is judged in DAISY-35 (5). |
| R10 | **UX1-AJAR-KONTEKS-01** fails if any `src` file names the learning context (T/experience.test.ts:5868-5881). | Staff surfaces receive a *semantic kind* from the database, never the context itself. The Konfigurasi Bagian form is the one place that must express the choice. If that cannot be done without naming it, the guard is re-scoped to learner surfaces by a coordinator record in the gate, never evaded by renaming (stop condition in BOB-43 and DAISY-32). |
| R11 | **Only one chapter was supplied.** The files are the front matter with the table of contents (10 pages) and **Bab 1 «Pendahuluan»** (22 pages). Bab II «Klasifikasi dan Pemilihan Strategi Pembelajaran» was not among them. | **Ruled (D-070(d)):** Yazid supplied Bab II (28 pages, sections A–G). |
| R12 | **"Removed after the demo" meets append-only evidence.** Sealed content and the walk's evidence cannot be deleted through the product (INV-28; content freeze). | **Ruled (D-070(e)):** branch copy deleted; staging releases withdrawn; the sealed text and evidence stay in the synthetic school. |
| R13 | **Lana's normal gate merges to `main`.** D-069(g) forbids it here. | LANA-22/23 pass on her branch and are never merged. The staging upload uses the workbook from her branch. |
| R14 | **The assessment's C1–C7 map onto these tickets:** C1 → BOB-44; C2 → BOB-43; C3 and C5 → BOB-45; C4 → BOB-46 and BOB-47; C6 → DAISY-33 (the invariant part) and DAISY-35 (polish); C7 → each ticket's red cases plus C-12. | C4 is split into "close by default" and "open exactly to the ruled audiences". This separates the RLS risk from the catalogue change, and lets BOB-46 proceed without any open decision. |
| R15 | **Signing in on the staging walk.** Synthetic addresses get no mail. | The walk signs in the way staging runs do at that time: a server-made session today, a password once identity Gate 3 has landed. The walk sends no email. |

---

## 3. The tickets

Every ticket follows the fields asked for. "Hard gate" means D-069(l): academic readings and protected sources byte-identical before and after.

### ENGINEERING: Bob

#### BOB-43 · A place knows it is for professional learning, and material cannot cross it (C2)

1. **ID:** BOB-43 (proposed).
2. **Objective:** make "this Bagian is for professional learning" one explicit, inherited, database-enforced fact, and refuse every attachment of material whose context differs from its place's.
3. **Scope:**
   - **The fact.** One value per org node (the existing `learning_context` enum: ACADEMIC or PROFESSIONAL_DEVELOPMENT). It is set on the Bagian when it is created and defaults to ACADEMIC. The hidden «Reguler», each Tingkat and each Kelas take their Bagian's value at creation. Nodes above the Bagian carry none, and no material may attach there.
   - **Immutability.** The value is set at creation and has no change path. That meets ruling 3's immutability outright; an unused Bagian with the wrong value is replaced, not edited. A move that would put a node under a Bagian of the other context is refused (the existing move trigger in M/20260912004244).
   - **The boundary.** A trigger on `learning_assignments` and `assessment_assignments` (insert, and any update of node, release or definition) refuses when the material's course context differs from the node's, in either direction, with a stable code. `assign_release` (M/20261010100000:430-477) and `launch_quick_assessment` (M/20261020100000) surface the code through their existing refusal mapping. It holds for every write path, fixtures included.
   - **Siapkan.** Siapkan offers a Kelas only the releases that match it, through one database read (replacing `terbitan`, S/lib/pengajar.ts:235-245), so `src` stays context-blind.
   - **Standing assertion.** A new assertion checks that no assignment row's course context differs from its node's. It is run by F06-P08 with the others.
   - **Migration pre-check.** A read-only count of existing assignments whose course context differs from the value their node will get. It is expected to be 0 on the local seed, staging and production, and is reported in the hand-off.
   - **Fixtures.** The WP6 fixture's PD department is created with the fact (T/db/fable06.sql:615-672). No test is weakened.
4. **Non-scope:** enrolment (BOB-44); rosters (BOB-45); RLS (BOB-46); any screen (DAISY-32); a path to change the context; surfacing the PROGRAMME node; the academic-only feedback refusal (unchanged); the canonical tenant.
5. **Rulings:** D-069(d), (f), (j); D-006; D-060 (no catalogue change).
6. **Likely touched:** `org_nodes` and its write trigger; `create_bagian`, `create_tingkat` and `create_kelas` (M/20261006100000:267-347); new triggers on both assignment tables; `assign_release`'s refusal map; `launch_quick_assessment`; a Siapkan read; `S/lib/pengajar.ts` `terbitan`; `S/app/mengajar/[kelas]/siapkan`; the fixtures.
7. **Migration:** one migration. Additive column with a default, then backfill, then triggers, then the assertion. No existing row is rewritten.
8. **RLS:** none changed. The fact is readable wherever `org_nodes` is.
9. **Terminology/UI:** none here. The form is DAISY-32; refusal texts are DAISY-33.
10. **Invariants:**
    - A place's context is never inferred from what is assigned.
    - Every node below a Bagian carries its Bagian's value.
    - No assignment's material context differs from its node's.
    - `src` never names the context.
11. **Red cases** (red on `main`, green after):
    - an ACADEMIC release into a PD Kelas is refused;
    - a PD release into an academic Kelas is refused;
    - a direct insert into `learning_assignments` that mismatches is refused;
    - an Uji Cepat from a PD module in an academic Kelas is refused;
    - a Kelas created under a PD Bagian is PD;
    - an update of a node's context is refused;
    - a cross-context move is refused;
    - Siapkan for an academic Kelas does not list a PD release, and the reverse.
12. **Regression suites:** learning-cycle and `assign_release`; F06-P08, F06-P19–P21; F07-P01/P11 (feedback); BOB-35 (release move); BOB-42's tests if landed; structure (Konfigurasi create and rename); `assert_metric_closure` and `assert_academic_sources_are_context_bound`; UX1-AJAR-KONTEKS-01; audit jobs A and B (S14–S23 unchanged).
13. **Acceptance evidence:**
    - CI green on the full SHA;
    - the hand-off lists each red case red then green, with the pre-check counts;
    - one audit-journeys run;
    - hard gate: job B's figures unchanged.
14. **Dependency/order:** after Gate 2E, and after the items already queued for Bob (§5). First of the package.
15. **Owner:** Bob.
16. **Stop conditions (Yazid):**
    - the pre-check finds a mismatched assignment anywhere: report it, do not repair it;
    - enforcement would refuse an existing academic flow;
    - keeping `src` context-blind proves impossible (R10).

#### BOB-44 · Enrol an existing person for professional learning (C1)

1. **ID:** BOB-44 (proposed).
2. **Objective:** one authorised database action that places an existing person as a participant in a professional-learning Kelas. It creates no person, no account and no institutional number.
3. **Scope:**
   - **Caller:** holds CAN_PROVISION_PEOPLE at the Kelas's school (Admin sekolah; Admin platform).
   - **Person:** visible to the caller, and **currently holds a staff role at the school** (D-070(c)): an unrevoked role assignment within its validity, scoped inside that school (Guru, Kepala departemen, Dekan or Admin sekolah). The condition is checked when the person is placed; a membership already in place is not removed if the role later lapses, so evidence is never orphaned.
   - **Place:** an active Kelas or Tingkat in a professional-learning place (BOB-43), with an academic period.
   - **Enrolment:** reuse the person's enrolment for that school and period; otherwise create one. It is **ACTIVE** if the person has an account, and **PENDING** otherwise, so activation keeps its meaning (M/20261005120000:85-89). Reusing avoids the newest-enrolment pitfall (M/20260929100000:125-127).
   - **Membership:** one open membership; a second for the same place is refused.
   - **Audit:** one audit row.
   - **The same rule enforced on `memberships`** (D-070(c)): no membership in a professional-learning place for a person without a current staff role at the school. It therefore also covers the student intake and the INSTITUTION_ADMIN direct-insert policy (M/20260912004431:320-331).
   - **Two reads for the form:** the PD places the caller may enrol into, and the persons eligible under D-070(c).
4. **Non-scope:** ending or withdrawing a PD enrolment; bulk enrolment; transfer; the form (DAISY-32); any condition beyond D-070(c).
5. **Rulings:** D-069(a), (e), (f), (h); D-054 (no duplicate person).
6. **Likely touched:** a new function and its grants; a membership trigger (D-070(c)); `audit_log`.
7. **Migration:** one function and one trigger; no schema change.
8. **RLS:** none added. The function carries its own checks. The existing direct-insert policies stay, and are bounded by the membership trigger.
9. **Terminology/UI:** refusal codes, for DAISY-32 and DAISY-33.
10. **Invariants:**
    - persons, accounts and institutional numbers are unchanged by the action;
    - one enrolment per person, school and period;
    - `display_role` is unchanged;
    - activation keeps its meaning.
11. **Red cases:**
    - A Guru with an account gets an ACTIVE enrolment and a membership, and no new person, account or number is created.
    - A person without an account gets PENDING, which becomes ACTIVE on activation.
    - These are refused: an academic Kelas; another school's person; a caller without CAN_PROVISION_PEOPLE (Guru, Kepala departemen, Dekan); a duplicate membership; a person with no current staff role (a Murid), whether through C1, the intake or a direct insert.
    - An existing enrolment for the same period is reused.
12. **Regression suites:** activation (M/20261005120000); the intake (F11, including "already holds an institutional identity"); the identity F-series; D-054 checks; F06-P19; UX1-AJAR-BELAJAR-01.
13. **Acceptance evidence:** CI; red cases red then green; one audit run; zero new persons, accounts or numbers asserted in the test.
14. **Dependency/order:** after BOB-43.
15. **Owner:** Bob.
16. **Stop conditions (Yazid):**
    - reusing an enrolment would change an existing student's enrolment;
    - the activation trigger would need to change.

#### BOB-45 · Participants are not «Murid»: rosters, counts, lists and the briefing (C3 + C5)

1. **ID:** BOB-45 (proposed).
2. **Objective:** every roster, headcount and list that today treats every membership as a Murid separates academic learners from professional-learning participants, in the database, and returns that meaning to the UI.
3. **Scope:**
   - **One kind per membership.** Derived from BOB-43's fact and returned as a semantic value (for example LEARNER or PROFESSIONAL_PARTICIPANT; the names are Bob's) by the reads the staff surfaces use.
   - **Teacher surfaces:** the Kelas roster and headcount (`faktaKelas`, `ringkasKelas`, S/lib/pengajar.ts:172-192, 580-594), and the denominators and names of `berjalan` and `siapa` (:360-436).
   - **Management lists:** «Murid pada bagian ini» (`daftarMurid`, S/lib/pimpinan.ts:412-440) lists academic learners only. The placement in `management_learner_detail` (M/20260925100000:256-263) lists academic placements only. HoD and Dekan see PD participants on the professional-learning record instead (D-070(a); BOB-47, DAISY-34).
   - **Konfigurasi's transfer picker** (S/app/konfigurasi/page.tsx:101, 463-466) lists academic enrolments only.
   - **The briefing:** `advance_briefing` counts academic POST_TEST participants only (M/20260918180000:180-183).
4. **Non-scope:** wording (DAISY-33); PD evidence reads (BOB-46/47); any change to what a student roster contains.
5. **Rulings:** D-069(a), (b)G, (k); D-068.
6. **Likely touched:** a view or function carrying the kind; `S/lib/pengajar.ts`; `S/lib/pimpinan.ts`; `management_learner_detail`; the Konfigurasi enrolment read; `advance_briefing`.
7. **Migration:** one view or function; replacements of `management_learner_detail` and `advance_briefing`.
8. **RLS:** none new. The view is `security_invoker`, so existing policies (and BOB-46's) apply.
9. **Terminology/UI:** the kind reaches the UI; DAISY-33 maps it to «Murid» or «Peserta». `src` names the kind, never the context.
10. **Invariants:**
    - in a school with no PD place, every roster, count and list is byte-identical before and after;
    - no academic list contains a PD participant.
11. **Red cases:**
    - «Murid pada bagian ini» at school scope lists an enrolled Guru (red), and does not (green);
    - the PD Kelas roster returns the Guru with the participant kind;
    - the academic Kelas roster is unchanged;
    - a briefing at the PD Kelas counts the Guru's post-test (red: 1), and does not (green: 0);
    - the learner record of a person with both kinds of placement lists only the academic one.
12. **Regression suites:** UX1 teacher-evidence and /pimpinan tests; Konfigurasi tests; audit jobs A and B (S14–S23 rosters and figures identical); the briefing test (T/db/fable06.sql:1693-1696).
13. **Acceptance evidence:** CI; red cases red then green; one audit run; hard gate.
14. **Dependency/order:** after BOB-43; in parallel with BOB-44 and BOB-46.
15. **Owner:** Bob.
16. **Stop conditions (Yazid):**
    - any academic roster output changes for a school with no PD place;
    - a surface would need PD participants in a «Murid» list after all.

#### BOB-46 · Professional-learning evidence is closed by default at the database (C4, part 1; ruling 2)

1. **ID:** BOB-46 (proposed).
2. **Objective:** enforce ruling 1's exclusions and ruling 2 in RLS.
   - Nobody beyond the participant and the ruled audiences reads a Guru's PD evidence.
   - Answers are the participant's alone.
   - PD integrity signals reach no school role and cannot be referred.
3. **Scope** (PD rows only; academic rows keep today's policies exactly):
   - **Sessions** (M/20260912133821:331-334): the participant; the facilitator (a Guru whose scope covers the PD Kelas); the Kepala departemen whose scope covers it; the Dekan; Admin sekolah (participation and completion, 1B–1E). Not another Guru; today any CAN_ASSIGN_LEARNING holder in the school can read them.
   - **Lesson progress** (M/20260913093000:96-98): the participant; the facilitator; the responsible Kepala departemen; the Dekan. Not Admin sekolah (1E lists no progress), and not another Guru.
   - **Results** (`assessment_result_readable`, M/20260924100000:99-132): unchanged. Node-scoped RESULT already matches 1B and 1C and excludes Admin sekolah and other Guru; the Dekan's score is BOB-47.
   - **Answers and presented items** (M/20260912140823:220-224; M/20260912133821:336-339): the participant only, plus Admin platform's existing access. Today CAN_REVIEW_INTEGRITY also reads them school-wide.
   - **Integrity signals** (M/20260912194342:140-141): no school role. Admin platform keeps its existing access (R8). Studio «Integritas» (S/app/studio/integritas/page.tsx:26-30) therefore lists none to Kepala departemen or Admin sekolah.
   - **Referral:** `refer_integrity_signal` (M/20260924110000) and the review outcome REFERRED_TO_INSTITUTION (M/20261024100000:35-58) are refused for a PD signal, for everyone.
   - **Unchanged:** recording (signals are still written); certificates (holder-only already).
   - **One predicate** shared by these policies: whether this row is professional learning (release → course, as `row_in_learning_context` does), and whether the reader stands over the PD place in a ruled audience.
4. **Non-scope:** new reads or screens (BOB-47, DAISY-34); the Dekan's score; academic policies; Admin platform's bypass; the NOLOGIN `analytics` role's grants (capability only); changes to the integrity machinery.
5. **Rulings:** D-069(b), (c).
6. **Likely touched:** the six policies above; `refer_integrity_signal`; the review function; one predicate function.
7. **Migration:** policy replacements whose academic branches are carried over unchanged, plus one function.
8. **RLS:** this ticket *is* RLS. It carries the highest regression risk of the package.
9. **Terminology/UI:** none. Studio «Integritas» simply receives fewer rows.
10. **Invariants:**
    - for every ACADEMIC row, every reader's result set is identical before and after, proven by an equivalence test (every role × every table above, over the fixture);
    - a PD answer is readable only by its owner;
    - no PD signal is ever referred.
11. **Red cases:**
    - another Guru reads a PD session (yes → no);
    - Admin sekolah reads PD answers (yes → no);
    - the Kepala departemen reads PD answers (yes → no);
    - the Kepala departemen sees a PD signal in «Integritas» (yes → no);
    - Admin platform refers a PD signal (accepted → refused);
    - the facilitator reads the PD session and progress (yes → yes);
    - the participant reads their own answers (yes → yes);
    - every academic access is unchanged.
12. **Regression suites:** every teacher evidence page; the integrity lifecycle (Boundary 7) and BOB-39 referral tests; certificate issue and verify; F06-P19; audit jobs A and B; UX1 suites.
13. **Acceptance evidence:** CI; red cases red then green; the equivalence test's output; one audit run; hard gate.
14. **Dependency/order:** after BOB-43; in parallel with BOB-44 and BOB-45. It needs no open decision.
15. **Owner:** Bob.
16. **Stop conditions (Yazid):**
    - an existing essential workflow turns out to need a facilitator or Kepala departemen to read PD answers (ruling 1B);
    - narrowing a PD policy changes any academic reader's rows;
    - Admin sekolah's operational work turns out to need PD progress or results.

#### BOB-47 · The ruled audiences read professional-learning records (C4, part 2)

1. **ID:** BOB-47 (proposed).
2. **Objective:** give the facilitator, the responsible Kepala departemen, the Dekan and Admin sekolah exactly what ruling 1 allows, through one database read, with scores coming through the metric catalogue.
3. **Scope:**
   - **One audience-checked read** per PD Kelas or Bagian. Per participant and package it returns:
     - enrolment;
     - participation (started or not);
     - progress (lessons done / total), except to Admin sekolah;
     - Pemetaan Awal and Uji Penguasaan status;
     - result (mastery, predikat, passed), to the facilitator, the responsible Kepala departemen and the Dekan only;
     - completion: the package's Uji Penguasaan has been finished, whatever the outcome (D-070(b));
     - the participant kind.
   - **Who may call it:**
     - the facilitator: a Guru whose scope covers that Kelas;
     - the Kepala departemen: scope covering the PD Bagian;
     - the Dekan: the school;
     - Admin sekolah: the school, with limited columns;
     - anyone else is refused.
   - **Scores through `learner.result`**, in a **new metric catalogue version** (D-060(a)). The PD gate admits a PD result only when the reader is one of these audiences standing over that PD place. Every academic calculator's sources are unchanged. The closure assertions are extended to prove that no academic calculator can read a PD row.
   - **Not called** from any Management decision screen (1G).
   - **F06-P20's class readings are made non-vacuous.** They are also taken at the PD Kelas itself, where the PD session sits, and must stay empty; today they are read only at an academic class (T/db/fable06.sql:5583-5624). The PD session's mode is set to POST_TEST explicitly (:5555-5556).
4. **Non-scope:** any screen (DAISY-34); answers; integrity; aggregates or figures for a PD Kelas; PD analytics for Admin platform (ruling 1H); export.
5. **Rulings:** D-069(b), (j), (l); D-060; the doctrine of migration 0072.
6. **Likely touched:**
   - a new function;
   - the metric boundary (`row_in_learning_context`, M/20260927100000:84-98; `metric_evaluate`, M/20260925100000);
   - `calc_learner_result` (M/20260918140000);
   - the catalogue version;
   - `assert_metric_closure` and `assert_academic_sources_are_context_bound`.
7. **Migration:** the catalogue version, the function, and the assertion updates.
8. **RLS:** none added. The function checks its audiences explicitly and relies on BOB-46.
9. **Terminology/UI:** returns the fields and the kind. DAISY-34 presents them.
10. **Invariants:**
    - hard gate;
    - Admin sekolah never receives a score;
    - no other Guru receives anything;
    - no figures exist for a PD Kelas.
11. **Red cases:**
    - the facilitator's read of the Guru's Uji Penguasaan score (absent → present);
    - the Dekan's (absent → present);
    - Admin sekolah receives completion without a score;
    - these are refused: another Guru; the Kepala departemen of another Bagian;
    - class readings at the PD Kelas stay empty;
    - school readings are unchanged;
    - `learner.result` for every academic student is unchanged for every audience.
12. **Regression suites:** F06-P08; MC-3; BOB-37's tests; `management_learner_detail` tests; audit job B figures.
13. **Acceptance evidence:** CI; red cases red then green; the catalogue version named in the hand-off (D-060(d)); one audit run; hard gate.
14. **Dependency/order:** after BOB-43 and BOB-46. Its caller is DAISY-34 (D-070(a)).
15. **Owner:** Bob.
16. **Stop conditions (Yazid):**
    - admitting PD results to these audiences would change any academic calculator's sources or readings;
    - the Dekan's access could only be given by broadening RLS on academic results.

### ENGINEERING: Daisy (functional screens on Bob's contracts)

#### DAISY-32 · Konfigurasi: a Bagian for professional learning, and enrolling an existing person

1. **ID:** DAISY-32 (proposed).
2. **Objective:** Admin sekolah creates the professional-learning Bagian and enrols an existing Guru as a participant through PINTAR's own screens.
3. **Scope:**
   - Konfigurasi's Bagian creation offers the choice: academic (the default) or educators' professional learning. The choice is shown, read-only, on the Bagian and on its Tingkat and Kelas.
   - An enrol form beside the existing «Orang» picker (S/app/konfigurasi/page.tsx:498-515): person, then PD Kelas, then enrol. It follows D-047 (Idle → Working → Success/Error) and submits once (D-046(e)).
   - The refusal texts for BOB-43's and BOB-44's codes.
4. **Non-scope:** changing a context; bulk enrolment; ending an enrolment; roster wording (DAISY-33).
5. **Rulings:** D-069(e), (f), (k); D-006; D-047; D-068.
6. **Likely touched:** `S/app/konfigurasi/page.tsx`, `actions.ts`; `S/lib/hle.ts`; the experience tests.
7. **Migration:** none.
8. **RLS:** none.
9. **Terminology/UI:** the Bagian's purpose label and the enrol wording, under Terminology v1, using «Peserta». R10 applies.
10. **Invariants:** learner surfaces stay context-blind; `src` computes no context.
11. **Red cases** (experience tests):
    - a PD Bagian's Tingkat and Kelas show PD;
    - enrolling the Guru succeeds;
    - enrolling into an academic Kelas shows the refusal;
    - a double submit sends once.
12. **Regression suites:** Konfigurasi; UX1 suites; DAISY-17's form-behaviour tests.
13. **Acceptance evidence:** CI; screenshots at 320 px and desktop; the audit run with Bob's batch.
14. **Dependency/order:** on BOB-43's and BOB-44's contracts. The picker lists only persons who hold a current staff role at the school (D-070(c)), from BOB-44's read.
15. **Owner:** Daisy.
16. **Stop conditions (Yazid):**
    - the form cannot be built without naming the context in `src` beyond Konfigurasi (R10);

#### DAISY-33 · «Murid» or «Peserta» on staff screens, from the returned meaning

1. **ID:** DAISY-33 (proposed).
2. **Objective:** a Guru learning is never called «Murid» on a colleague's screen, and academic screens are unchanged.
3. **Scope:**
   - The teacher's Kelas roster, headcount, «Mengumpulkan n / m» and the siapa lists map BOB-45's kind to «Murid» (academic) or «Peserta» (professional learning).
   - Siapkan's refusal text for BOB-43's mismatch code.
4. **Non-scope:**
   - any mechanical replacement of «Murid»;
   - the PD record screen (DAISY-34);
   - polish (DAISY-35).
5. **Rulings:** D-069(a), (k); D-068.
6. **Likely touched:**
   - `S/app/mengajar/[kelas]/**`;
   - `S/components/bukti/KeadaanHariIni.tsx`;
   - `S/lib/hle.ts`;
   - tests.
7. **Migration:** none.
8. **RLS:** none.
9. **Terminology/UI:** exactly the kind-to-word mapping.
10. **Invariants:**
    - academic screens are byte-identical (snapshot tests);
    - there is no context logic in `src`.
11. **Red cases:**
    - the PD Kelas roster reads «Murid terdaftar» (red) and uses the participant wording (green);
    - the academic Kelas is unchanged.
12. **Regression suites:** UX1 teacher-evidence and Siapkan tests; audit job A.
13. **Acceptance evidence:**
    - CI;
    - screenshots;
    - the audit run with Bob's batch.
14. **Dependency/order:** on BOB-45, and on BOB-43 for the code.
15. **Owner:** Daisy.
16. **Stop conditions (Yazid):** one screen shows both kinds together and Terminology v1 has no rule for it. Raise it; do not invent a word.

#### DAISY-34 · Where the ruled audiences see professional learning

1. **ID:** DAISY-34 (proposed).
2. **Objective:** present BOB-47's record to the facilitator, the responsible Kepala departemen, the Dekan and Admin sekolah, as D-070(a) rules.
3. **Scope:**
   - **One read-only professional-learning record per PD Kelas** (D-070(a)): participants × Bab, with progress, test status, completion and result, in the columns each audience is allowed. Admin sekolah sees no progress and no result; completion means finished, whatever the outcome (D-070(b)).
   - **Entry points:** the facilitator reaches it from their Kelas; the responsible Kepala departemen, the Dekan and Admin sekolah from their existing home, as a link to the record, never inside the decision queue or the figures.
   - Never answers or integrity; never in a Management decision screen; «Peserta» wording.
4. **Non-scope:** figures for a PD Kelas; export; Admin platform analytics.
5. **Rulings:** D-069(b), (k).
6. **Likely touched:** one new read-only route; a link from the facilitator's Kelas page and from each audience's home; `S/lib/hle.ts`; tests.
7. **Migration:** none.
8. **RLS:** none (reads BOB-47).
9. **Terminology/UI:** Terminology v1, «Peserta»; D-047.
10. **Invariants:** a column appears only if BOB-47 returned it to that reader.
11. **Red cases:** every audience in §2 F of the assessment, shown exactly its columns, and every other role refused.
12. **Regression suites:** the facilitator's Kelas page; the `/pimpinan` home and decision queue (unchanged); the Admin sekolah home; UX1 suites.
13. **Acceptance evidence:**
    - CI;
    - screenshots per audience;
    - C-12 P5.
14. **Dependency/order:** after BOB-47.
15. **Owner:** Daisy.
16. **Stop conditions (Yazid):** an entry point could only be placed inside a Management decision screen (D-069(b)G); an audience would need a column D-069(b) does not give it.

### UI/UX POLISHED: Daisy

#### DAISY-35 · Educator as learner: polish

1. **ID:** DAISY-35 (proposed).
2. **Objective:** the shared learner screens feel right to an educator, including one who holds a senior role.
3. **Scope:**
   - (1) The `/` page offers the Belajar door from learning participation, not from display role (S/components/tempat.ts:98).
   - (2) `/belajar`'s refusal pages pass the educator persona, so the existing staff line of `tolak.arti` shows (S/lib/hle.ts:1831-1832; `HalamanPenolakan.tsx:26`).
   - (3) A Guru who also holds a senior role gets an adult learner shell and no child tour (S/lib/tur.ts:215-218; S/lib/pembelajaran.ts:33-41; ruling 7).
   - (4) The hint button's emoji is judged under the design spec.
   - (5) How a PD Kelas presents its existing «Lihat bukti» page to the facilitator: its academic figures are empty by design there, and the professional-learning record is the page that matters (D-070(a)). Presentation only; no figure is added or computed.
4. **Non-scope:**
   - the identity model (ruling 7);
   - the certificate or verification page (ruling 8);
   - new visuals.
5. **Rulings:** D-069(h), (k); D-068; the design spec; the content standard's visual rule.
6. **Likely touched:**
   - `tempat.ts`;
   - the `/belajar` refusal callers;
   - `tur.ts`;
   - `pembelajaran.ts`;
   - `hle.ts`.
7. **Migration:** none.
8. **RLS:** none.
9. **Terminology/UI:** Terminology v1.
10. **Invariants:**
    - a student's experience is unchanged;
    - UX1-AJAR-KATA-01 holds (the copy is the same for learner and educator).
11. **Red cases:**
    - an enrolled Guru sees no Belajar door on `/` (red), then sees it (green);
    - a Kepala departemen who also teaches and learns gets the child tour (red), then does not (green).
12. **Regression suites:** UX1-AJAR-*, the tour tests, the `/` tests.
13. **Acceptance evidence:**
    - CI;
    - screenshots at 320 px and desktop;
    - the UI/UX POLISHED review.
14. **Dependency/order:** inside the UI/UX POLISHED pass, after DAISY-32 and DAISY-33 have merged.
15. **Owner:** Daisy.
16. **Stop conditions (Yazid):** item (3) turns out to need an identity-model change (ruling 7 forbids one).

### CONTENT: Lana

#### LANA-22 · [UJI INTERNAL] Strategi Pembelajaran — Bab 1: Pendahuluan

1. **ID:** LANA-22 (proposed).
2. **Objective:** one internal demo package for educators, closely adapted from the supplied Bab 1, that reads as professional learning.
3. **Scope:** exact package in §6.
4. **Non-scope:**
   - any chapter beyond two;
   - images, comics or decoration;
   - misconception codes (D-063's mechanism is not built; the reviewer acknowledges the warnings);
   - merging to `main`;
   - production;
   - Pustaka PINTAR.
5. **Rulings:** D-069(g), (k); the content standard and its visual rule; D-007/D-008 (workbook); D-068.
6. **Likely touched:** Lana's branch only, in a folder marked internal demo (for example `content/_uji-internal/strategi-pembelajaran/`).
7. **Migration:** none.
8. **RLS:** none.
9. **Terminology/UI:**
   - Terminology v1 («Pemetaan Awal», «Uji Penguasaan», «Soal», «Materi»);
   - «Anda», never «kalian»;
   - no praise words.
10. **Invariants:**
    - [UJI INTERNAL] on every title;
    - never on `main`;
    - every statement traceable to a page of Bab 1.
11. **Red cases** (checks that must be clean):
    - `periksa_mutu.py` 0 ERROR;
    - no «Hebat», «Keren», «pasti bisa» or «luar biasa»;
    - no answer-length bias;
    - every key verified by the coordinator;
    - every question tests understanding or judgement, with recall used only where necessary.
12. **Regression suites:** the package builds through the app's own reader (`ke-paket.ts`) and uploads cleanly with Konteks «Pengembangan profesi».
13. **Acceptance evidence:**
    - **CONTENT PASS** by the coordinator on her branch: the checks re-run; keys verified; a read against the standard;
    - **not merged**;
    - the staging journey on it is C-13, after the engineering.
14. **Dependency/order:** starts when Gate 2E is released (Lana's queue is otherwise empty).
15. **Owner:** Lana.
16. **Stop conditions (Yazid):** the adaptation would need long verbatim passages to carry the meaning (paraphrase, or ask).

#### LANA-23 · [UJI INTERNAL] Strategi Pembelajaran — Bab 2

1. **ID:** LANA-23 (proposed). Source supplied by Yazid (D-070(d)).
2. **Objective:** the second demo package, with the same form and standard as LANA-22.
3. **Scope:** exact package in §6.
4. **Non-scope:** as LANA-22.
5. **Rulings:** as LANA-22.
6. **Likely touched:** as LANA-22.
7. **Migration:** none.
8. **RLS:** none.
9. **Terminology/UI:** as LANA-22.
10. **Invariants:** as LANA-22.
11. **Red cases:** as LANA-22.
12. **Regression suites:** as LANA-22.
13. **Acceptance evidence:** as LANA-22.
14. **Dependency/order:** after LANA-22's verdict.
15. **Owner:** Lana.
16. **Stop conditions (Yazid):** as LANA-22.

### AUDIT / ACCEPTANCE: Second Eye

#### C-12 · Venue 1: the machine proof

1. **ID:** C-12 (proposed).
2. **Objective:** prove D-069(a), (b), (c), (e), (i), (l) and tenancy in the audit harness's real-posture school, through the product only.
3. **Scope:** extend audit job B (`audit/journey.mjs`) after S23, on «SD Zayd», with two **original** filler PD packages.
   - **The packages:** `audit/fixtures/pd-uji-bab1.paket.json` and `…bab2…`. They are written by the coordinator, professional in register, marked [UJI INTERNAL], and contain no book text.
   - **The steps:** the setup, journey, pass conditions P1–P9 and evidence are in §7.
4. **Non-scope:**
   - Lana's packages;
   - staging;
   - production;
   - any direct database write that makes a step pass (a read for evidence is allowed).
5. **Rulings:** D-069(e), (l), (m); D-064 (the real-posture proof).
6. **Likely touched:**
   - `audit/journey.mjs`;
   - `audit/fixtures/`;
   - the workflow's job B.
7. **Migration:** none.
8. **RLS:** none. It reads as each role's own login.
9. **Terminology/UI:** it asserts the words: no «Murid» for the Guru, and «Peserta».
10. **Invariants:**
    - hard gate;
    - the product path only.
11. **Red cases:**
    - it fails if any academic reading or protected source differs by one byte;
    - it fails if any ruled exclusion reads a row;
    - it fails if the Guru shows as «Murid»;
    - it fails if any operator write is needed.
12. **Regression suites:** jobs A and B in full (S1–S23 unchanged).
13. **Acceptance evidence:**
    - the run id and its step table;
    - the before/after JSON;
    - the result filed on the board (as C-03 and D-064).
14. **Dependency/order:** after BOB-43–47 and DAISY-32–34 are on `main`.
15. **Owner:** Second Eye.
16. **Stop conditions (Yazid):**
    - a hard-gate failure: nothing further merges until its root cause is found;
    - a step that cannot pass without a direct write.

#### C-13 · Venue 2: Yazid's walk-through on staging, and the demo's close

1. **ID:** C-13 (proposed).
2. **Objective:** show the educator's full experience with Lana's two packages on real staging, then close the demo as D-070(e) rules.
3. **Scope:**
   - **Place:** «Sekolah Uji Kinerja (sintetis)».
   - **Setup:**
     - Admin sekolah creates «Pengembangan Guru» → Tingkat → Kelas, names a facilitator, and enrols a synthetic EDUCATOR-only Guru through C1;
     - the two workbooks are uploaded from Lana's branch and published by two people;
     - the facilitator assigns Bab 1, then Bab 2.
   - **The walk:**
     1. Sign in, then `/mengajar`, then «Pembelajaran Saya».
     2. Bab 1: Pemetaan Awal → lessons → Uji Penguasaan → Hasil.
     3. Bab 2: the same four steps.
     4. Back to «Kelas»: teaching is intact.
   - **Screens:** every screen captured at desktop and 320 px. No certificate: the evidence is synthetic (INV-20). No email is sent.
   - **Close (D-070(e)):** after Yazid has seen the walk, both releases are withdrawn on staging (no longer assignable); Lana deletes the package from her branch unless rights have been obtained; the sealed text and the walk's evidence stay in the synthetic school. No purge.
4. **Non-scope:**
   - certificates;
   - production;
   - Pustaka PINTAR;
   - data repair.
5. **Rulings:** D-069(e), (g), (m); D-046(c) (staging stays synthetic).
6. **Likely touched:**
   - staging data in the synthetic school only, through the product;
   - the staging journey record.
7. **Migration:** staging receives `main`'s migrations through `staging.yml`, as usual.
8. **RLS:** none.
9. **Terminology/UI:** checked against the content standard and its visual rule: no «Murid», no child tour, no praise words, no celebration.
10. **Invariants:**
    - product path only;
    - [UJI INTERNAL] visible on every card and test title.
11. **Red cases:**
    - it fails if any screen calls the Guru «Murid»;
    - it fails if any direct write is needed;
    - it fails if any childish or celebratory element appears.
12. **Regression suites:** the staging journey's existing J-steps, run the same day.
13. **Acceptance evidence:**
    - the screen set, sent to Yazid;
    - the staging record.
14. **Dependency/order:**
    - after C-12 PASS;
    - after LANA-22 and LANA-23 CONTENT PASS;
    - after staging carries the migrations;
    - outside any mail-server window.
15. **Owner:** Second Eye (Yazid may walk it himself).
16. **Stop conditions (Yazid):**
    - any hard-gate doubt from C-12;

---

## 4. Dependency and order

```
                       Gate 2E released
                (Stellar Business move, the after-read,
                 Yazid signs in on staging and production)
                               │
   ┌───────────────────────────┼─────────────────────────────┬──────────────────┐
   │ Bob (existing, unchanged) │ Daisy (existing, unchanged) │ Lana             │
   │ BOB-25 → BOB-26 → BOB-27  │ DAISY-19 wiring → DAISY-20  │ LANA-22 (Bab 1)  │
   │ → BOB-28 / BOB-29         │ → UI/UX POLISHED pass       │   │              │
   │ → BOB-42, BOB-15 where    │   (DAISY-21…24 with their   │ LANA-23 (Bab 2)  │
   │   already placed          │    identity gates)          │                  │
   │ (BOB-13 keeps its own     │                             │                  │
   │  trigger: the L1 figures) │                             │                  │
   └─────────────┬─────────────┴──────────────┬──────────────┴────────┬─────────┘
                 │                            │                       │
             BOB-43                           │                       │
      ┌────────┼─────────┐                    │                       │
   BOB-44   BOB-45    BOB-46                  │                       │
      │        │         │                    │                       │
      │        │      BOB-47                  │                       │
      │        │         │                    │                       │
   DAISY-32 DAISY-33  DAISY-34                │                       │
      └────────┴─────────┴────────────────────┘                       │
                  │                                                   │
      Integration A: BOB-43–46 + DAISY-32, 33   (one CI, one audit)   │
      Integration B: BOB-47 + DAISY-34          (one CI, one audit)   │
                  │                                                   │
               C-12 (Venue 1, hard gate) ─────────────────┐           │
                                                          ▼           ▼
                                        C-13 (Venue 2: staging walk; close per D-070(e))

   UI/UX POLISHED: DAISY-35, inside the pass, after DAISY-32/33 have merged.
```

With DR-1 and DR-2 ruled, the two integrations can be one if BOB-47 and DAISY-34 are ready with the rest.

---

## 5. What begins when

- **Nothing** here begins before Gate 2E is released. Gate 2E is the Stellar Business move (Namecheap: 30 Sep, 14:00 WIB, about 4 hours), the after-read against GATE-0-FACTS §4, and Yazid's sign-ins.
- **Bob.** BOB-43 starts after every item already in Bob's queue:
  - the identity gates BOB-25 → BOB-29;
  - BOB-42 and BOB-15, in the positions Yazid has given them.

  BOB-13 is unaffected: it keeps its own trigger (the L1 run's figures, before L2). When those figures exist, BOB-13 goes first. D-063's tickets, when Yazid places them, are placed by him relative to this package.
- **Daisy.** DAISY-32 and DAISY-33 start when their Bob contracts are published. They never interrupt an identity-gate screen ticket. DAISY-34 starts after BOB-47. DAISY-35 is part of the UI/UX POLISHED pass.
- **Lana.** LANA-22 can start at Gate 2E's release, since her queue is empty and the ticket touches no code. LANA-23 follows LANA-22's verdict.
- **Second Eye.** C-12 is written and run when the engineering is on `main`. C-13 follows C-12 PASS and both CONTENT PASSes.
- **ENGINEERING COMPLETE includes this package** (D-070(f)): it is declared only after BOB-43 to BOB-47 and C-12 have passed. DAISY-35 is part of the one UI/UX POLISHED pass.

**UI/UX POLISHED:** DAISY-35 only; DAISY-33's roster wording is not polish, because it protects the invariant (ruling 7's test). The polish pass also reviews DAISY-32, 33 and 34's new screens with everything else.

---

## 6. Lana's exact assignment

**Common to both packages**
- **Purpose.** Internal demo only (D-069(g)): a close adaptation of «Strategi Pembelajaran», Dr. Siti Nurhasanah, Dr. (Cdt) Agus Jayadi, Dr. Rika Sa'diyah and Syafrimen, EDU PUSTAKA 2019, ISBN 978-623-90461-7-0.
- **Workbook** (one per package):
  - Judul kursus «[UJI INTERNAL] Strategi Pembelajaran — Bab n: <title>»;
  - Mata pelajaran «Pengembangan Kompetensi»;
  - Jenjang «Guru»;
  - Kelas «Guru»;
  - Konteks «Pengembangan profesi».

  The eyebrow then reads «Pengembangan Kompetensi · Guru». The values are proposed here; Yazid may change them at approval.
- **Marking.** The first lesson opens with: «UJI INTERNAL / MATERI PERAGAAN — TIDAK UNTUK DISTRIBUSI PRODUKSI», followed by the full citation. Every title carries [UJI INTERNAL].
- **Form.**
  - Text lessons, manageable in length (a few minutes each).
  - A table or list through the shared learner-text renderer only where it clarifies (DAISY-30).
  - A diagram only if a concept genuinely needs one; no images otherwise.
  - Nothing from the visual rule's "do not use" list.
- **Teaching.** Follow the content standard: concept → why it matters → a classroom situation → professional judgement → application, where it fits. Add reflection only where it helps. Use «Anda».
- **Assessment.**
  - 4 questions marked Pemetaan Awal and 8 marked Uji Penguasaan, Lana's usual counts. Practice («Latihan») questions are optional and few, because educators have limited time.
  - Mostly scenario, application and judgement questions («Seorang guru menghadapi…», «Pada akhir pembelajaran, guru menemukan…»). Recall only where necessary.
  - Plausible, professionally credible distractors; no answer-length bias; no praise.
  - The pass mark stays the package default (mastery 0.6). There is no new configuration.
- **Branch.** Committed on Lana's branch only; never merged; removed after the demo per D-070(e) unless rights are obtained.
- **Gate.** CONTENT PASS by the coordinator, on her branch, as §3 LANA-22 describes.

**LANA-22: Bab 1 «Pendahuluan»** (source: the supplied scan, 22 pages). Five lessons, one per section of the chapter:

| Lesson | Book section |
|---|---|
| 1 | A. Pengertian Strategi Pembelajaran |
| 2 | B. Jenis-Jenis Strategi Pembelajaran |
| 3 | C. Sasaran Kegiatan Pembelajaran |
| 4 | D. Tahapan Kegiatan Pembelajaran |
| 5 | E. Istilah dalam Strategi Pembelajaran (the related terms the chapter distinguishes) |

Lana may merge two sections into one lesson if that serves the educator better; she records the choice.

**LANA-23: Bab 2 «Klasifikasi dan Pemilihan Strategi Pembelajaran»** (source: the scan Yazid supplied, 28 pages; D-070(d)). Proposed lessons, one per section of the chapter:

| Lesson | Book section |
|---|---|
| 1 | A. Klasifikasi Strategi Pembelajaran (by how teacher and students are organised; by how the message is processed) |
| 2 | B. Strategi Pembelajaran Langsung (meaning, strengths and limits, stages) |
| 3 | C. Strategi Pembelajaran Tidak Langsung |
| 4 | D. Strategi Pembelajaran Interaktif (basis, characteristics, stages, strengths) |
| 5 | E. Strategi Pembelajaran Empirik (concept, cycle and stages) |
| 6 | F. Strategi Pembelajaran Mandiri (concept, framework, strategy, activities, material) |
| 7 | G. Memilih Strategi Pembelajaran yang Tepat (the bases for choosing) |

Bab 2 is longer than Bab 1. Lana may merge sections (for example B with C) where that serves an educator with limited time; she records the choice. Section G, choosing a strategy, suits the scenario and judgement questions the standard prefers.

**Source files.** Yazid gives Lana the three scans (front matter, Bab 1, Bab 2) in her session, as with her earlier chapters. They are not committed to the repository.

---

## 7. Acceptance and audit plan

The assessment's two venues (D-069(m)), with the pass conditions from assessment §7.

### Venue 1 (C-12): audit job B, «SD Zayd», production posture, original filler packages

**Setup and journey, all through the product:**
1. **Baseline snapshot.** Taken as the Guru, the Kepala departemen and the Dekan:
   - every catalogue reading at Kelas 1A, its Bagian and the school: all 16 calculators, including topic mastery, competency outcomes, misconceptions and verified credentials;
   - the protected sources: row counts and content hashes of `academic_responses` and `academic_certificates`, question-health rows for Kelas 1A's items, and the official sessions at academic nodes;
   - Kelas 1A's roster and counts;
   - the «Murid» lists at the Bagian and the school;
   - the Konfigurasi enrolment list;
   - the briefing counts;
   - for the Kelas 1A teacher (the Guru, EDUCATOR-only): person id, account, institutional number, role assignments, `display_role` and home route.
2. **Build the PD place.** Admin sekolah creates «Pengembangan Guru» (professional learning) → Tingkat → Kelas. Admin names the facilitator (a Guru at that Kelas) and the responsible Kepala departemen, then enrols the Guru through C1.
3. **Publish the content.** The two filler packages (Konteks «Pengembangan profesi») are uploaded, reviewed and published by two people. The facilitator assigns Bab 1, then Bab 2.
4. **The Guru's journey.** Both Bab: Pemetaan Awal → lessons → Uji Penguasaan → Hasil. Then the certificate is issued and verified by token, twice.
5. **Integrity.** One integrity observation is triggered through the player during a PD test, as the Boundary 7 harness did.
6. **After snapshot:** the same set as step 1.

**Pass conditions:**

| # | Condition |
|---|---|
| P1 | **Identity:** persons +0, accounts +0, numbers +0; the same person id on every row; `display_role` EDUCATOR; roles unchanged; home `/mengajar`; the Kelas tab works |
| P2 | **Hard gate:** every reading and protected source byte-identical; on screen still «Pemahaman 75%», «+35 poin», Peserta 5 |
| P3 | **Rosters:** Kelas 1A unchanged; the «Murid» lists unchanged; the Guru appears as «Peserta» in the PD Kelas |
| P4 | **Evidence:** four FINALIZED sessions and their results, readable by the Guru; two sealed certificates, both verified; nothing rewritten; the context cannot be changed |
| P5 | **Visibility per D-069(b),** by each role's own login *and* on screen: facilitator, responsible Kepala departemen, another Kepala departemen, Dekan, Admin sekolah, another Guru, a student |
| P6 | **Integrity per D-069(c):** the signal is recorded; no school role sees it; referral is refused |
| P7 | **Tenancy:** every new row belongs to SD Zayd; a second school's Guru sees nothing; nothing in the canonical tenant |
| P8 | **Boundary:** refused: an ACADEMIC release into the PD Kelas; a PD release into Kelas 1A; C1 into Kelas 1A; the intake with the Guru's person id. Siapkan in Kelas 1A does not offer the PD releases. |
| P9 | **Marking:** [UJI INTERNAL] on every title; the packages absent from Pustaka PINTAR |

### Venue 2 (C-13): staging, «Sekolah Uji Kinerja (sintetis)», Lana's two packages

- The walk in §3 C-13, every screen captured.
- **Checks:** P1 (the Guru's side), P3 (the Guru's own and the PD Kelas screens), P9, and the educator content standard with its visual rule.
- **No certificate** (synthetic evidence).
- **Timing:** outside any mail-server window.

### Gate practice (unchanged)

For each integration:
1. CI green on the exact SHA;
2. diff read;
3. one audit-journeys run;
4. merge with a byte-identical check;
5. board entry and `[skip ci]` commit;
6. `main` fast-forwarded;
7. `staging.yml` dispatched when `main` gains a migration.

---

## 8. Decisions: all ruled (D-070, 30 Sep)

The six questions preparing the tickets raised, with Yazid's rulings. The options he chose between are in this file's history (commit `9779a7f`).

| # | Question | Ruling | Effect on the tickets |
|---|---|---|---|
| DR-1 | Where the ruled audiences see professional learning | **A:** one read-only professional-learning record per PD Kelas; the facilitator from their Kelas, the others from their existing home | DAISY-34 has a defined scope; BOB-45 keeps PD participants out of «Murid» lists |
| DR-2 | What "completion" means | **A:** the Uji Penguasaan has been finished, whatever the outcome | BOB-47 returns completion without a result to Admin sekolah |
| DR-3 | Who may be enrolled into a professional-learning place | **B:** only a person who currently holds a staff role at the school, enforced on memberships | BOB-44's person rule and membership trigger; DAISY-32's picker |
| DR-4 | The source of Bab 2 | **A:** Yazid supplied Bab II | LANA-23 unblocked (§6) |
| DR-5 | "Removed after the demo" on staging | **A:** branch copy deleted; releases withdrawn; sealed text and evidence stay in the synthetic school | C-13's close |
| DR-6 | Does ENGINEERING COMPLETE include the package | **A:** yes | §5; DAISY-35 joins the one UI/UX POLISHED pass |

**Clarifications confirmed with the approval (D-070(g)–(i)):** (g) DR-3's staff-role condition is checked when a person is placed; if the role lapses later, the existing membership and its evidence stay, and only new placements are refused. (h) A PD Kelas keeps its ordinary «Lihat bukti» page, empty of academic figures by design; its presentation is DAISY-35 (5). (i) Admin platform keeps its existing read of PD integrity signals and cannot refer them (R8).

---

## 9. Confirmation

- **NO IMPLEMENTATION PERFORMED.** Documentation only: D-069 and D-070 (with (g)–(i)), the board rows (TODO, after Gate 2E), notes on D-068 and in the freeze package, the content standard's visual rule, the assessment's status line, this file, the board note, and the Namecheap window in GATE-0-FACTS §4. No application code, database, migration, RLS, application string, content, staging data or production data was changed.
- **BOB PAUSED.**
- **DAISY PAUSED.**
- **LANA PAUSED.**
- **GATE ORDER UNCHANGED.**
