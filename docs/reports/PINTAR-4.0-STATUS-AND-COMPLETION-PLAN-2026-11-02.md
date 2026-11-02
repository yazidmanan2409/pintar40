# PINTAR 4.0 · Status and the complete list to finish 4.0 (2 Nov 2026)

**Decision:** D-141 (2 Nov). Dr Gladys's second walkthrough is deferred, and PINTAR 4.0 is completed first. This document is the plan. Implementation starts only on the owner's approval of the first batch and of a CI allowance.

**What the plan builds on:** the item-level status of every list in `docs/reports/PINTAR-4.0-CHECKLISTS-AND-FINDINGS-UPDATE-2026-10-09.md`.

**Status words** (from that document):
- **CLOSED**: fixed and machine verified, never human accepted.
- **PARTIAL**: part done.
- **OPEN**: not done.
- **HOLD**: held for a ruling.
- **BLOCKED**: waits on something outside engineering.
- **A-ITEM**: deferred by ruling.

---

## Part 1 · Latest update (verified 2 Nov 2026)

### 1.1 Environments

| | State | Evidence |
|---|---|---|
| main | **`001a357`** (9 Oct). **No commit on any branch since 9 Oct.** | `git log origin/main`; branch tip `ce3d238` (9 Oct, documents) |
| Staging | **`001a357`**, deployment `dpl_EcwRYkkSG1hGqGjocvmVC6cKAhEg`, **177 migrations**, GREEN | Nightly facts run 41358880783, 1 Nov |
| Production | **`5b5b68d`** (23 Sep), 111 migrations at its commit, database not read. **669 code files differ from main** | Same run |
| GitHub Actions since 9 Oct | Scheduled jobs only (facts, production watch, daily spend, backup offsite skipped). **No build or deployment** | Run list |
| One blip | Facts failed once, on 26 Oct: a timeout reading staging's deployment. It was GREEN every night after. **Nothing changed on staging** | Run 40417406153 |
| Staging freeze (D-140(d)) | Still in force. It ends when the owner approves the first completion batch (D-141(a)) | — |

### 1.2 What Dr Gladys's Studio attempt shows

- **The owner's report (2 Nov):** «dr gladys tried to do the studio, but it wasnt fully developed».
- **What staging records** (read only, 2 Nov):
  - Sekolah Demo PINTAR is unchanged since 9 Oct: 6 places, 4 roles, 10 results, 3 certificates, 0 problem reports, 91 audit rows.
  - **No role has been granted to anyone on staging since 9 Oct.**
  - Every staging change since then is the coordinator's own Golden School walk (`sekolah-uji-daisy-001a`).
- **So** her attempt is not visible on staging under her own account. Possibilities:
  - she used another person's staging account;
  - she used **production** (`app.pintarselalu.com`), which runs the 23 Sep build with a much older Studio;
  - or she reviewed screenshots or designs.
- **Needed:** her notes or screenshots, and the address she used. Until then it is recorded as a class F observation (needs investigation, D-140(e)).
- Her finding still holds in substance: **Studio is the least finished part of the application** (Part 3, workstream W1).

### 1.3 What was completed up to 9 Oct

- **The closure work** (6–8 Oct; L1–L4, batches 0–3b): about 60 closure items closed. These include the certificate number and seal, the working context, credential privacy, Studio roles, the human interface boundary, and the integrity separation of duties.
- **D-137:** Bank Soal filter with keys and reasons (CR-52), «Komputer siapa ini?» default (CR-92), Peran & akses paged.
- **The Daisy application pass (D-138):**
  - steps 1–3 (tokens, primitives, the staff shell) applied and on staging;
  - step 5 (copy, Terminology v1) applied;
  - **steps 4a–4f (the screens themselves) PARTIAL.**
- **D-140:** fix batch A (RV-1 … RV-6, RV-12, RV-13, RV-17) and RV-10 (Studio's contradictory status), on staging since 9 Oct.
- **Verification on 001a357:** CI 18/18, journeys green (every step), Golden School 4/4 on staging.
- **Release checklist:** P0 at **77 of 84**.
- **No journey is human accepted.**

### 1.4 Where 4.0 stands, in one paragraph

The engineering spine is built and machine verified on staging: identity, school setup, content import and publication, teaching, learning, evidence, certificates and support. What is **not** done:
- the screens are not fully on Daisy's design;
- a set of approved screens and functions is not built (Part 3, W2);
- the evidence that counts for release has not been gathered: human acceptance, capacity, backup and disaster recovery, regression;
- **production has not been released since 23 Sep.**

Several items wait on the owner's decisions, not on engineering (W7–W10).

---

## Part 2 · What «complete 4.0» means

From the recovery charter Phase 8 and the release conditions P1–P15 (`PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md` §10). 4.0 is complete when **all** of these hold:

1. Every approved 4.0 function is built and on Daisy's design, **with nothing left as a known defect on a person's path**.
2. Every P0 check PASS on the release candidate, with **zero operator steps** (REL-02).
3. **Human acceptance:**
   - Dr Gladys's walkthrough, with her findings classified and resolved;
   - the owner's acceptance of each journey J1–J10.
4. **#150 backup and disaster recovery: PASS.**
5. **Capacity** proven at the chosen compute tier (L1).
6. **The legal and data-protection gate** passed before real student data.
7. **Production released** through a rehearsed upgrade (111 → 177+), with configuration, email, monitoring and break-glass verified.
8. Then a walk by 3–5 real educators and the observed pilot of 20–30 educators. These close 4.0's first real use.

---

## Part 3 · The complete list, by workstream

**Owners:**
- **E:** engineering (Claude or Codex).
- **D:** design (Daisy's lane; E applies it).
- **Y:** Yazid, the owner.
- **G:** Dr Gladys.
- **S:** the Second Eye (independent review).

**Size:** S (≤ ½ day), M (1–2 days), L (3+ days).

### W1 · Studio (Content): finish it (E, D)

Studio is the least migrated surface and the one Dr Gladys hit.
- **Tabs:** Studio home, Buat Paket, Antrean Tinjauan, Pustaka PINTAR, Aturan Asesmen, Bank Soal, Tinjauan Integritas, the package page and Pratinjau.
- **Scope lines:** J4.1–J4.12 (`docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md`).

| # | Item | Source | State | Size |
|---|---|---|---|---|
| W1.1 | Apply Daisy's composed journey **J1Terbit** (publishing) to the package page: steps, status and actions in her layout, not the old long page | `11-validation.md` J1; step 4f | PARTIAL | L |
| W1.2 | **Question review layout** on the package page: the current «wall of questions» with native ▶ markers (DG-25, RV-21). Needs Daisy's layout (L4 §4 handed it to her) | DG-25, RV-21 | OPEN (needs D) | M + D |
| W1.3 | **Aturan Asesmen**: field hints, limits shown in minutes and words (not seconds), 44 px checkboxes and radios | RV-14, DG-28/29 residual | OPEN | M |
| W1.4 | **Release in fewer presses**: today it takes three separate presses to release (UX-15). Each step should confirm what it did (UX-39) | UX-15, UX-39 | OPEN / PARTIAL | M |
| W1.5 | **Question check earlier and grouped**: check before lock; acknowledge findings as a group, not one «Sudah saya tinjau» at a time | UX-01 | PARTIAL | M |
| W1.6 | **Send back to the author** from the review queue | UX-36 | OPEN | M |
| W1.7 | **Studio home count cards as links** to their lists | UX-34 | OPEN | S |
| W1.8 | **Finding locations in words, not database column names**; the one English finding. Needs a migration (the strings live in the database) | UX-17, OP-5 (C29, C30, D23) | OPEN | M |
| W1.9 | **Wording residues:** «Kursus ini» → package noun (UX-13); «siswa» → «murid» (UX-18); «(D-008)» removed from the workbook guidance (UX-43); English mode passes the locale in Studio (UX-25) | UX-13/18/25/43 | PARTIAL / OPEN | S |
| W1.10 | **An example workbook** a teacher can copy. The old one was withdrawn because it carried live answer keys (DG-36). Today only a blank template is offered | DG-36 | DECIDED (withheld); content work open | M (content) |
| W1.11 | Studio at 320 px (a cut select; a wrapping competency code) | RV-23 | OPEN | S |
| W1.12 | **Bank Soal**: the measured-difficulty wording (OP-7) is **Dr Gladys's word to choose**. «No authoring on the bank» is a ruling (QN5), not a gap | OP-7; CR-52 | OPEN for G | S once ruled |
| W1.13 | **Question Health** (J4.9, HOD-06) needs 30 answers per question. P2 by ruling; it cannot be shown on a demo | CR-36 | A-ITEM | — |
| W1.14 | **Media in lessons** (J4.2): out of the first phases (D-050) | CR-53 | A-ITEM | — |
| W1.15 | Integrity review remainder (labelled note and review state; CR-75). The person who referred a case sees its outcome (CR-77) | CR-75, CR-77 | PARTIAL / OPEN | M |
| W1.16 | Confirm with Dr Gladys's notes (§1.2) what she could not do, and add anything missing here | D-141(b) | F | — |

### W2 · Approved functions not yet built (E)

| # | Item | Source | State | Size |
|---|---|---|---|---|
| W2.1 | **Correct a wrong staff email**: the button (the server and route already exist; the four choices were confirmed by D-122(1)) | CR-13, ADM-08, U-RECOVER | PARTIAL | S |
| W2.2 | **Correct a name** (screen over `correct_person_name`) | CR-14, D-077(d) | OPEN | M |
| W2.3 | **Revoke a certificate** (school admin screen) | CR-05, ADM-18 | OPEN | M |
| W2.4 | **The Uji Cepat score**: the class first, learners as a drill-down (ruled, D-120 Q8). Then walk it at Level 3 (CR-34) | CR-27, CR-34, EDU-10 | OPEN | M |
| W2.5 | **Hide the briefings surface** (ruled HIDE for 4.0, D-120 QN4) | CR-37, DEA-04 | OPEN | S |
| W2.6 | **«Laporan saya» reachable from the navigation** (today only by redirect) | CR-78 | OPEN | S |
| W2.7 | **The student's own profile photo** | CR-07 | OPEN | M |
| W2.8 | **Username correction without SQL** (operations; educator pilot gate) | CR-15 | OPEN | M |
| W2.9 | **Platform admin lists paged** | CR-49, CAP-10 | PARTIAL | S |
| W2.10 | **Names and reads at scale**: prove FD-4 at 10× staging's enrolments; roster reads by id list | FD-4 | PARTIAL | M |
| W2.11 | Transfer between schools: the destination school by name **needs an authorization ruling** first (W7.3) | CR-41, OP-4, RV-18 | PARTIAL | M after Y |
| W2.12 | UX items outside Studio: «nomor induk» read as NIS (UX-09); Konfigurasi waiting counts (UX-33); per-class flags on the teacher's home (UX-37); a new result as the next action (UX-40); the educator recovery line (UX-45); the certificate refusal label (UX-46); «Penguasaan per bagian» heading (UX-41); release verbs «Siapkan/Sediakan» (UX-19, Dr Gladys's word) | UX register | OPEN / PARTIAL | M total |
| W2.13 | Pemetaan Awal offered where none exists (RV-7) | RV-7 | OPEN | S |
| W2.14 | Educator as learner: polish inside the learner screens | CR-57 | OPEN | S |

### W3 · Daisy's design on every screen (D, E)

**Authority:** D-138; the frozen design at `ux-1/daisy-experience` c42fecb (`08-migration.md`, `11-validation.md` J1–J7). The pass so far applied Daisy's components, not her screen compositions.

| # | Item | State | Size |
|---|---|---|---|
| W3.1 | Apply the composed journeys **J1–J7** screen by screen: J1Terbit (W1.1), J2Kelas, J3MengajarBelajar, J4Murid, J5Jendela, J6Peragaan, J7Kunci | NOT APPLIED | L |
| W3.2 | **Learner** (4a): composition per J4/J3 | PARTIAL | M |
| W3.3 | **Mengajar** (4b): badges at 320 px (RV-20) | PARTIAL | M |
| W3.4 | **Pimpinan** (4c): «(0/5)» explained, repeated labels, touching cards (RV-9); honest empty states everywhere (CR-46, U-EMPTY) | PARTIAL | M |
| W3.5 | **Konfigurasi** (4d): the long single page split or indexed (RV-24); dates in words, not ISO, and date inputs (RV-16); empty tile, «Versi» column | PARTIAL | L |
| W3.6 | **Pendataan, Aktivasi** (4e): field widths, hint placement, label case (RV-22) | PARTIAL | S |
| W3.7 | **Report pages** Ringkasan Kelas and Ringkasan Sekolah: inside the shell, naming the class, school and period (RV-11). **Needs Daisy's layout** (no J-composition covers them) | OPEN (needs D) | M + D |
| W3.8 | **«Laporkan masalah»** inside the shell (still the old header) | OPEN | S |
| W3.9 | Primitives gaps: select chevron; 44 px Radio and Checkbox rows; Alert and Badge shape; the file control's own words (RV-5) | PARTIAL | M |
| W3.10 | Tour: focus box and ring; the sheet covering its target at 320 px (RV-19); the tour blocking the landing (UX-38) | OPEN | M |
| W3.11 | Platform admin technical wording (RV-15: «Lingkungan development», the seed name) | OPEN | S |
| W3.12 | Layout minors: touching cards, jammed hints, doubled headings (RV-21) | OPEN | S |
| W3.13 | **OP-1** icon rail at 1024–1279 px and **OP-2** group labels: Daisy specifies the collapse behaviour, **or** the owner accepts the deviation | OPEN (D or Y) | M or none |
| W3.14 | **Collection pattern** on the remaining lists (CR-88 design part) | PARTIAL | M |
| W3.15 | **Certificate as designed, one A4 page** (CR-03/04); **Digital Card final** (CR-21); **identity emails to the final standard** (CR-22). These wait on W7.6 (font licence and print proofs) | OPEN / BLOCKED | L |
| W3.16 | Republish the Design System page (version 18 predates c42fecb) | OPEN | S |

### W4 · Words: Terminology v1 residue and Dr Gladys's decisions (E, G)

| # | Item | State |
|---|---|---|
| W4.1 | **Migrations** for the v1 rows held in the database: C29, C30, D23, C31, B15, B16 (OP-5; also UX-17, RV-15) | OPEN (E) |
| W4.2 | **Dr Gladys's terminology decisions**, which can be asked **in writing now, without a walkthrough**: «penilaian» strings after the v1 inventory (OP-6; 10 strings); Bank Soal measured difficulty (OP-7); the six `context.*` working-context words (D-132(m)); the L4 §4 word list; the assigning verbs (UX-19) | OPEN for G |
| W4.3 | The `auth.belum_siap` copy through the canonical review (L-copy) | OPEN |

### W5 · Accessibility (E)

| # | Item | State |
|---|---|---|
| W5.1 | NVDA (desktop) and TalkBack (phone) pass on the real screens. Only accessibility trees were checked so far | OPEN |
| W5.2 | 200 % zoom and colour-vision check (L-a11y) | OPEN |
| W5.3 | 44 px everywhere, including Radio and Checkbox rows and the controls TARGET-01 cannot see (inline or Tailwind heights) | PARTIAL |

### W6 · Regression, evidence and quality (E, S)

| # | Item | State |
|---|---|---|
| W6.1 | **Batch 6 regression:** network loss kept (CR-30); U-PERF re-measured (CR-58, last 28 Sep); universal rules as rule-level tests (CR-59, X.1–X.12) | OPEN |
| W6.2 | Browser walks still missing: pause and resume (STU-08); PINTAR standard content end to end (SYS-05); the Bab 1 re-import as library content on staging (D-122(2)) | OPEN |
| W6.3 | The real-app **50-student test** on current main (the owner's standing instruction before any 50-person session) | OPEN |
| W6.4 | After every batch: full CI, the journeys (crawl + 76 steps, three browsers), a Golden School walk on staging, an **independent review of the running application** (D-140(b)) | per batch |
| W6.5 | Regenerate the **release checklist v2.8** from `checklist_data.py`, with its out-of-date wording fixed (update file §1.2) | OPEN |
| W6.6 | **CI maintenance:** GitHub moved `ubuntu-latest` to Ubuntu 26 from 19 Oct, and Node 20 actions are forced onto Node 24. **No CI build has run since**, so the first one may need fixes to the local-stack action and pinned versions. Supabase CLI 2.117 → current | OPEN (verify on the first run) |
| W6.7 | The Codex independent investigation (D-140(g)), if the owner still wants it before or alongside completion | Y to decide |

### W7 · Owner decisions and actions (Y)

None of these is engineering. Each blocks the items named.

| # | Decision or action | Blocks |
|---|---|---|
| W7.1 | **CR-91: the class-card trust boundary** (held since L3) | Security sign-off |
| W7.2 | **Answer keys in the repository:** the source workbooks under `docs/onboarding/` carry live questions and keys. May they stay? Who has read access? | Security sign-off; W1.10 |
| W7.3 | **A cross-school directory** for transfers (authorization) | W2.11 |
| W7.4 | **A second production SYSTEM_ADMIN** (SYS-08, CR-69), plus second administrators for Supabase, Vercel, GitHub, DNS, mail and AWS | Release |
| W7.5 | **Support tiers named**, with the same-day answer (REL-13, CR-71) | Release |
| W7.6 | **Wordmark font licence** (Helvetica Neue 65 Medium) and **physical print proofs** (A4 at 100 %, phone QR scans, the 0.75 mm gold line) (CR-56) | W3.15, the shell logo (OP-3) |
| W7.7 | **CR-31** second attempt (held); **CR-48 / Q11** cross-school admin sign-in facts; **Q17** scope of class feedback rounds and the evaluation hub | Small rows |
| W7.8 | **A CI allowance for completion.** D-139's 1,000 minutes are about 670 used, and each verified batch costs about 125 | Every batch |
| W7.9 | **Approve the batches** in Part 4, and whether the Codex review runs first (W6.7) | Everything in E |

### W8 · Capacity (Y, then E)

| # | Item | State |
|---|---|---|
| W8.1 | **The compute tier** for staging and production (D-089). Micro failed L1 at 1,000 | Y |
| W8.2 | **IP forwarding key and Auth limits** (D-092(c); BOB-12's staging acceptance) | Y |
| W8.3 | Re-run L1 at the chosen tier: CAP-01 (N-T), CAP-02 (FAIL), CAP-07, CAP-08 (PARTIAL) | E after Y |
| W8.4 | Efficiency items (CAP-09): an Auth round trip per request; a cache for /pimpinan; learner link prefetch; Konfigurasi paging | E, owner priority |
| W8.5 | **Q3:** the size of the first real deployment and the cohorts | Y |
| W8.6 | Mail capacity at pilot scale (CR-73) | Y, E |

### W9 · #150 backup and disaster recovery: verdict NOT PASS (Y, then E)

| # | Item | State |
|---|---|---|
| W9.1 | **B3:** a machine-readable backup read (C1 token; the session-pooler values). Until then **every production migration is refused**, and so is the release | ON HOLD |
| W9.2 | **B4/B5:** copies outside Supabase, Storage files, escrow of the two production secrets. A ruling on how far independent recovery must go for 4.0 | Y ruling |
| W9.3 | **B6:** recovery rests on one person. Name custodian B; R2 and both possession proofs | Y |
| W9.4 | **B7:** G10 (the production watch) is off. Switch it on at release (O10) | Y |
| W9.5 | **B8:** reconstructing Auth and platform configuration after a restore to a new project | Y ruling, then E |
| W9.6 | **B9:** Storage files in a restore | Y ruling, with B4 |
| W9.7 | The off-platform restore rehearsal (O8) | E after the above |

### W10 · Legal, policy and content (Y)

| # | Item | State |
|---|---|---|
| W10.1 | **Data protection** (CR-74, Q4): UU PDP, PSE registration, controller and processor, retention, parental consent; approval for real student data | OPEN |
| W10.2 | Rights to the ministry materials (Q5) | OPEN |
| W10.3 | Policy for AI tooling that can reach hosted systems (Q6) | OPEN |
| W10.4 | Who authors and approves PINTAR standard content (Q7, CR-51 residual) | Partly ruled (D-120 Q7) |
| W10.5 | The school-facing commercial answers: pricing, contract, licence, data use, exit, SLA (Q19) | OPEN |
| W10.6 | The privacy-notice line on backup retention (O11) | OPEN |

### W11 · Release to production (E, Y): charter Phase 8

| # | Item | State |
|---|---|---|
| W11.1 | Rehearse the upgrade from production's exact level (111 → 177+) on a scratch copy (P1, CR-68) | NOT DONE |
| W11.2 | Production configuration: Gate 8 Auth settings, SMTP password, SPF/DKIM/DMARC, a production send to the test inboxes (REL-08, CR-70) | PARTIAL |
| W11.3 | The verification domain DNS `verifikasi.pintarselalu.com` (CR-11) | OPEN |
| W11.4 | Rehearse the existing-staff transition (CR-24), and the break-glass for the sole production admin (C-11). Retire the magic link (CR-25) | NOT DONE |
| W11.5 | Key escrow (REL-09, CR-12): part of #150 | BLOCKED |
| W11.6 | Level 3 green on the **actual release candidate**, every P0 PASS with **zero operator steps** (REL-02, CR-72) | FAIL today (77/84; the rest is media by ruling, capacity and release rows) |
| W11.7 | Switch on the production watch; read-only checks after deploy | OPEN |
| W11.8 | **The owner approves the release (D-004)**; release through the rehearsed path | Y |

### W12 · Acceptance and first real use (G, Y)

| # | Item | When |
|---|---|---|
| W12.1 | **Dr Gladys's walkthrough** on the completed staging; findings classified A–F and resolved | After W1–W5 |
| W12.2 | **Owner acceptance** of each journey J1–J10. Today: HUMAN-ACCEPTED 0 | After W12.1 |
| W12.3 | Educator-as-learner walk with Lana's packages, then withdraw them (C-13) | Any time on staging |
| W12.4 | A walk by 3–5 real educators (D-058(b)) | After release |
| W12.5 | The observed educator pilot of 20–30 (D-052(b)) | After W12.4 and W8 |

### Not 4.0 (by ruling; do not pull in without a new decision)

- media playback (D-050);
- a teacher changing an assignment window (CR-28, after go-live);
- Question Health with real data (CR-36);
- point-in-time recovery (D-103(c));
- the 100,000-user recovery rehearsal;
- the data-rights export (4.5);
- WhatsApp sign-in (4.1);
- certificate reissue;
- the school FAQ.

---

## Part 4 · Recommended sequence

Each batch: local suite, crawl at 320 and 1280 px, journeys, CI, the owner's push approval, staging, Golden School walk, independent review, pass log. **About 125 CI minutes per batch.**

| Batch | Contents | Needs first | Est. effort |
|---|---|---|---|
| **0 · Restart** | Lift the freeze (approval); check CI on the new runner image (W6.6); ask Dr Gladys's terminology decisions in writing (W4.2); get her Studio notes (W1.16) | W7.8, W7.9 | ½ day |
| **1 · Studio** | W1.1–W1.11, W1.15; W4.1 (the database wording) | Daisy for W1.2 | 4–6 days |
| **2 · Missing functions** | W2.1–W2.9, W2.12–W2.14 | — | 4–5 days |
| **3 · Design on every screen** | W3.1–W3.12, W3.14; Ringkasan pages (W3.7) | Daisy for W3.7; W3.13 decided | 6–8 days |
| **4 · Words and accessibility** | W4.2 applied, W4.3, W5.1–W5.3, W3.15 if W7.6 is done | G's words; W7.6 | 2–3 days |
| **5 · Regression and evidence** | W6.1–W6.5, W2.10 | — | 2–3 days |
| **→ Dr Gladys's walkthrough** (W12.1), then her findings resolved | | | 1 walk + a batch |
| **6 · Release readiness** | W8.3–W8.4, W9.7, W11.1–W11.7 | W7.4, W7.5, W8.1–W8.2, W9.1–W9.6, W10.1 | 3–5 days + owner actions |
| **→ Release** (W11.8), owner acceptance (W12.2), educators, pilot | | | |

**CI estimate:** six batches of about 125 minutes, plus re-runs and the release rehearsal, comes to about **900–1,100 minutes**. That exceeds the 330 left under D-139, so a new allowance is needed (W7.8).

**Critical path:**
- **Engineering:** batches 1 → 3 → 5 and the walkthrough.
- **The owner's track runs in parallel:** W7, W8.1–W8.2, W9, W10. **Production cannot be released until #150 B3 is solved**, because every production migration is refused until then.

---

## Part 5 · What is needed from the owner now

1. **Dr Gladys's Studio notes or screenshots**, and the address and account she used (§1.2).
2. **Approval of this plan's batch 0 and batch 1**, which lifts the staging freeze, plus **a CI allowance** for the completion (W7.8).
3. **A word to Daisy:** the question review layout (W1.2), the report pages (W3.7) and the icon rail (W3.13). These need her designs.
4. Start the owner track in parallel:
   - CR-91;
   - the answer keys in the repository;
   - the second production admin;
   - the support tiers;
   - the font licence and print proofs;
   - the compute tier;
   - the #150 rulings;
   - the legal gate.
5. Whether the Codex independent review runs before completion, alongside it, or after (W6.7).
