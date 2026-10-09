# PINTAR 4.0 · To-do list to completion (from 9 Oct 2026)

**Starting point:**
- main = staging = `001a357`, 177 migrations, CI and journeys green.
- Golden School 4/4 on staging.
- Staging FROZEN for Dr Gladys (READY).
- Production `5b5b68d` (no release since 23 Sep).
- Nothing is human accepted.
- Status of every list: `docs/reports/PINTAR-4.0-CHECKLISTS-AND-FINDINGS-UPDATE-2026-10-09.md`.

**What «complete 4.0» means here**, from the recovery charter Phase 8 and the release conditions P1–P15 in `PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md` §10:
- every journey human accepted;
- every P0 PASS with zero operator steps (REL-02);
- #150 PASS;
- capacity at the chosen tier;
- the legal gate passed;
- production released through a rehearsed path;
- then the educator walk and pilot.

**Owners:**
- **Y:** Yazid (owner).
- **G:** Dr Gladys.
- **E:** engineering (Claude or Codex).
- **D:** design (Daisy's lane, applied by E).
- **S:** Second Eye (independent review).

**Order:** each phase can start only when the phase before it allows. Phases A and B are the critical path. Phases C, D and E can run in parallel once B has started.

---

## Phase A · Dr Gladys's second walkthrough (now; staging frozen)

- [ ] **A1 (Y):** On staging, open Studio home and Sekolah Demo PINTAR's published Bab. Confirm «Tidak ada yang menunggu tindakan Anda di Studio.» and «Terbit · Paket ini sudah terbit…». This is the last check before inviting her.
- [ ] **A2 (Y):** Add Dr Gladys as «Admin sekolah» of Sekolah Demo PINTAR. Record the time in `docs/coordination/walkthrough-gladys/EVIDENCE.md` §0.
- [ ] **A3 (Y):** Give her only the guide (`docs/onboarding/PINTAR-Panduan-Walkthrough-Sekolah-Demo.md`). Observe with `OBSERVER-SHEET.md`: no leading, notes in her words.
- [ ] **A4 (E):** Before she starts and after she finishes, run `environment-facts.yml`. It must show `dpl_EcwRYkkSG1hGqGjocvmVC6cKAhEg` and `001a357`.
- [ ] **A5 (E):** After she signs off:
  - re-read the demo school (read only) against the 9 Oct baseline;
  - record her findings and classify each A–F (D-140(e));
  - update the Codex handoff;
  - **STOP** for approval (D-140(g)).
- [ ] **A6 (Y, S):** Approve or reject each finding (D-117(f)), and her terminology decisions: OP-6, OP-7, the six `context.*` words, the L4 §4 word list, and UX-19.

## Phase B · Codex independent review (D-140(g), D-135)

- [ ] **B1 (Y):** Start the independent Codex investigation from `docs/handoff/codex-2026-10-09/` (read `00` §0, then `10`).
- [ ] **B2 (Codex):** Verify independently against the original requirements, not by rebuilding (handoff 09).
- [ ] **B3 (Y):** Approve the next implementation batch from A6 and B2. No new development before this approval.

## Phase C · Engineering and design to finish the product (after B3; batches, each CI-gated)

**C1. Walkthrough findings first:** the approved A and E class findings from A6.

**C2. Open functionality (engineering):**
- [ ] CR-13: the button for correcting a staff email (the server and route already exist).
- [ ] CR-14: the name-correction screen.
- [ ] CR-05: the certificate revocation screen.
- [ ] CR-27: the Uji Cepat score (class first, learners as a drill-down; D-120 Q8). Then CR-34: walk it at Level 3.
- [ ] CR-37: hide the briefings surface, as ruled (D-120 QN4).
- [ ] CR-77: the referrer sees the outcome. CR-78: a navigation link to «Laporan saya». CR-75: the integrity review remainder.
- [ ] CR-07: the student's profile photo screen (last).
- [ ] CR-49: page the platform admin's lists. CR-15: username correction without SQL (educator pilot gate).
- [ ] UX items:
  - UX-09 «nomor induk»;
  - UX-15 three release presses;
  - UX-33 waiting counts;
  - UX-34 linked Studio cards;
  - UX-36 send back to the author;
  - UX-37 per-class flags;
  - UX-40 a new result as the next action;
  - UX-43 «(D-008)» in the guidance;
  - UX-45 an educator recovery line;
  - the PARTIAL rows UX-01, 13, 18, 25, 39, 41, 46.
- [ ] FD-4: prove names and reads at 10× staging's size.

**C3. The Daisy application pass to completion (D-138; design is the authority):**
- [ ] Steps 4a–4f to done, screen by screen:
  - Learner;
  - Mengajar (RV-20);
  - Pimpinan (RV-9, CR-46 honest empty states);
  - Konfigurasi (RV-16 dates in words, RV-18, RV-24);
  - Pendataan and Aktivasi (RV-22);
  - Studio (RV-14, RV-21, RV-23, DG-25 question review layout).
- [ ] The report pages Ringkasan Kelas and Ringkasan Sekolah in the shell, naming the class, school and period (RV-11). «Laporkan masalah» in the shell.
- [ ] RV-5 file control; RV-7 no Pemetaan Awal offer without one; RV-8 a missing audio asset; RV-15 platform admin wording; RV-19 tour focus and ring (and UX-38); RV-23.
- [ ] OP-1 icon rail and OP-2 group labels: build, or record as accepted deviations (Y).
- [ ] Primitives gaps: select chevron, 44 px Radio and Checkbox rows, Alert and Badge shape.
- [ ] CR-88: the Collection pattern on the remaining lists.
- [ ] OP-5: migrations for the Terminology v1 rows held in the database (C29, C30, D23, C31, B15, B16; UX-17).
- [ ] CR-03/04 certificate, CR-21 Digital Card, CR-22 identity emails. These wait on CR-56 and the print proofs (Phase D).
- [ ] CR-57: the educator-as-learner polish.
- [ ] Republish the Design System page.

**C4. Accessibility:**
- [ ] An NVDA and TalkBack pass on the real screens; 200 % zoom; colour vision (L-a11y).
- [ ] The `auth.belum_siap` copy review (L-copy).

**C5. Regression and evidence (the batch 6 regression):**
- [ ] CR-30 network loss, CR-58 U-PERF re-measured, CR-59 universal rules as rule-level tests.
- [ ] STU-08 and SYS-05 walked in a browser.
- [ ] Regenerate the release checklist (v2.8) from `checklist_data.py`, with the out-of-date wording in update §1.2 corrected.
- [ ] After each batch: full CI, the journeys, a Golden School walk on staging, and an independent review (D-140(b)).

## Phase D · Owner decisions and actions (can run any time; several gate Phase E)

**Security and product rulings:**
- [ ] CR-91: the class-card trust boundary (HOLD).
- [ ] S1: may the source workbooks with live answer keys stay in the repository (`docs/onboarding/`)? Who has read access?
- [ ] CR-41 / OP-4: a cross-school directory for transfers (authorization).
- [ ] CR-31: the second attempt (HOLD). CR-48 / Q11: cross-school admin sign-in facts.
- [ ] Q17: scope of class feedback rounds and the evaluation hub. Q3: the size of the first real deployment.

**People and accounts:**
- [ ] CR-69 / SYS-08: name a second production SYSTEM_ADMIN, and second administrators for Supabase, Vercel, GitHub, DNS, mail and AWS (A7).
- [ ] CR-71 / REL-13: name the tier 1 and tier 2 support people; commit to the same-day answer.

**Design inputs:**
- [ ] CR-56: the wordmark font licence. Physical proofs: print at 100 %, phone QR scans, the 0.75 mm gold line (A11).
- [ ] The DNS record for `verifikasi.pintarselalu.com` (CR-11).

**Capacity:**
- [ ] D-089: the compute tier for staging and production; the forwarding key and Auth limits (CR-67, A8).
- [ ] Then E reruns L1 (CAP-01, CAP-02, CAP-07, CAP-08) and CAP-09.

**#150 backup and disaster recovery:**
- [ ] B3: a machine-readable backup read (C1, the session pooler values, A4–A5).
- [ ] B4/B5: independent recovery and escrow, by ruling.
- [ ] B6, B7, B8, B9: owner rulings, then E implements.
- [ ] Name custodian B; R2 and both possession proofs (A6).

**Legal and policy:**
- [ ] CR-74 / Q4: UU PDP, PSE registration, controller and processor, retention, parental consent.
- [ ] Q5: rights to the ministry materials.
- [ ] Q6: an AI tooling access policy.
- [ ] Q19: the school-facing commercial answers.

**Content:**
- [ ] Q7/CR-51: re-import Bab 1 as library content on staging, as ruled (D-122(2)).
- [ ] An example-only workbook to replace the withheld one (DG-36).

## Phase E · Release to production (charter Phase 8; after C, D)

- [ ] **E1 (E):** Rehearse the upgrade from production's exact level (111 → 177+ migrations) on a scratch copy (P1, CR-68).
- [ ] **E2 (E, Y):** Verify the production configuration:
  - Gate 8 Auth settings;
  - SMTP password;
  - SPF, DKIM and DMARC;
  - a production send to the test inboxes (REL-08, CR-70).
- [ ] **E3 (E):** #150 PASS: a restore proven on the off-platform path; key escrow (REL-09, CR-12, CR-66).
- [ ] **E4 (E, Y):** Rehearse the existing-staff transition (CR-24) and the break-glass for the sole production admin (C-11, A12). Retire the magic link (CR-25).
- [ ] **E5 (E):** Level 3 green on the actual release candidate: CI, journeys and a Golden School walk. REL-02 means every P0 PASS with zero operator steps (CR-72).
- [ ] **E6 (Y):** Switch on the production watch (O10). Add the privacy-notice line on backup retention (O11).
- [ ] **E7 (Y):** Approve the release (D-004). E releases through the rehearsed path, then runs the facts and read-only production checks.
- [ ] **E8 (Y, G):** Human acceptance on production for each journey J1–J10.

## Phase F · After the release (the end of 4.0)

- [ ] **F1:** A walk by 3–5 real educators (D-058(b)).
- [ ] **F2:** Re-run the real-app 50-student test on current main before any 50-person session (owner's standing instruction).
- [ ] **F3:** An observed educator pilot of 20–30 (D-052(b)). Mail capacity at that scale (CR-73).
- [ ] **F4:** Wider onboarding, gated by capacity (CAP-03 … CAP-06, CAP-10).

---

## Explicitly not 4.0 (by ruling)

These must not be pulled into 4.0 without a new ruling:
- media playback (D-050, CR-53);
- the teacher changing an assignment window (CR-28, after go-live);
- Question Health (CR-36, needs data volume);
- RPO and point-in-time recovery (D-103(c));
- the 100,000-user recovery rehearsal;
- the data-rights export (4.5);
- WhatsApp sign-in (4.1);
- certificate reissue;
- the school FAQ.

## The critical path, in one line

A (Dr Gladys) → B (Codex review and approval) → C (findings, the open screens, completing the application pass, regression) ∥ D (owner rulings, capacity, #150, legal) → E (rehearse, verify, release) → F (educators, pilot).
