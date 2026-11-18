# Planning audit 4.2 / 4.5 / 5.0: independent review (security, permissions, data integrity, evidence)

Sharon, 18 Nov 2026 (08:45 UTC). Read-only; planning only. Nothing is authorised to be built.

**What I reviewed:** `docs/roadmap/PLANNING-AUDIT-4.2-4.5-5.0.md` on `claude/bob-41-master-plan` at `63c66ba93db1dcd1c6866765135cbe2a751b9bd1`, sha256 `c56b415058f0571193deabdcf5b153218aee8eba3b7e119cecd57c388331a685`. I read all 520 lines. I did not re-read sources S-a to S-e. Where I rely on them, I rely on Bob's summary of them.

## What holds now

- **The overall verdicts stand:** 4.2 is not ready but is ready for a decision session; 4.5 is blocked at its foundation; 5.0 is blocked on 4.5.
- **I agree with most classes and with X-1 to X-13.**
- **I disagree on four points,** listed plainly at the end for §7:
  - two classes (4.2-03 and 4.5-07) should be UNRESOLVED;
  - one proposed answer (suspension across schools) is an owner decision, not a planning confirmation;
  - G-11 needs a default, not only "decide with A5 in view";
  - G-4 and G-5 are one critical path, not two risks.
- **I found eight gaps (M-1 to M-8).** Two are permission boundaries the audit does not name: offboarding (M-4) and who may read the past (M-6).

## 1 · Classification challenges (§1)

| Item | Bob | Mine | Why |
|---|---|---|---|
| **4.2-03** two-school roles | PARTIAL | **UNRESOLVED (narrow): D-03** | Suspension is person-level (rulings 17 and 19), and those rulings were made when a person had one school. Two things follow: whether school A's admin may, by suspending a person, end that person's work at school B; and who may suspend a person who belongs to two schools. That is an authority rule between two institutions, which the team cannot set. The rest is the team's |
| **4.5-07** educator protections | PARTIAL ("design follows R-1") | **UNRESOLVED** | By §0.3's own worst-class rule: if the design cannot start until an owner policy (R-1) exists, it is not PARTIAL |
| 4.2-09 | COMPLETE | Agree | Read-only, school scope, no personal evidence beyond the class and teacher assignment |
| 4.2-13 handover | PARTIAL | Agree, **with a boundary** | "Open work" must be defined as **the class's work only**: open sittings, assignments and their results. **Not** the departed teacher's own drafts, reviewer notes (C2w), AI requests (C3w) or anything educator-related (4.5-07). Otherwise a handover becomes a back door to a colleague's private work |
| 4.2-08 password change | PARTIAL | Agree | Add to "what else changed": if learners are ever in its audience, ending their other sessions ends an A3 controller mid-sitting, which then needs A3's recovery. With staff only, there is no effect |
| 5.0-04 server progression | PARTIAL | Agree, and **G-8 is more urgent than "consider"** (§3) | — |

With these changes, 4.2's totals become: COMPLETE 1, PARTIAL 4, UNRESOLVED 12, BLOCKED 3.

## 2 · The four G-items asked about

- **G-4 and G-5 are one critical path, not two risks.**
  - 4.5 needs real evidence (G-4).
  - Real evidence needs production adoption, and production adoption needs R-2, by §5.1's own "before production data".
  - The upgrade from 111 to 4.x also needs the rehearsal's blockers closed, REH-1 among them (M-7).
  - **So R-2 is the root of 4.5's critical path.** I recommend R-2 be assigned as a **4.2 deliverable**, policy and enforcement both, not left "unassigned" (U-01).
  - **Two refinements:**
    1. RD-4's runtime verification is **not** blocked by G-4. It is a correctness check, and synthetic data proves it. Only *usefulness* needs volume. Schedule RD-4 early, as §8 already allows.
    2. **The "insufficient evidence" thresholds must be fixed before real volume arrives.** Set them in advance and version them (D-060). Otherwise they get tuned on the first real data, and "not concluded" stops meaning anything.
  - **A purpose point for R-2:** computing Question Intelligence from real learners' answers is a **new purpose** for minors' data, namely quality analytics. R-2, or a purpose statement beside it, must cover it before 4.5 reads production evidence.
- **G-7 · adaptive checks against no behaviour tracking: resolvable, with a stated boundary. The owner still rules (D-45-12).** A proposal for that ruling:
  - **the signals are sign-in events only:** attempts, failures, a new device or network at sign-in. Never in-app navigation, page views or time on the platform;
  - **staff accounts only;**
  - **a separate store with a short retention** (for example 90 days, set under R-2). It is **never joined to evidence**, and is not readable by any INT, REP or evaluation role. Enforce that by grants, with a test, not by convention;
  - a challenge or refusal stays neutral (ruling 20), and B0's last-admin rule holds;
  - IP addresses and device identifiers are personal data, so R-2 again.
- **G-11 · educator evidence in a 4.2 export: needs a default, not only a decision "with A5 in view".**
  - **My default:** a 4.2 export **excludes all educator-related evidence**. That means per-teacher aggregates and comparisons, C2w reviewer notes (educator-authored, "never evidence"), C3w requests and provenance by requester, and anything 4.5-07 will protect.
  - It stays excluded until 4.5-07's protections exist. **The owner may override; the plan must not assume the override.**
  - Without that default, 4.2 can ship a copy that 4.5 then forbids, and **a copy cannot be recalled** (§3's own "PINTAR loses all control").

## 3 · The proposed answers (§3)

| Proposed | My view |
|---|---|
| 4.2-02/03: suspension covers both schools, "confirm in planning" | **Disagree that planning can confirm it.** It is D-03 (above) |
| 4.2-08: other sessions end | Agree. Also revoke refresh tokens. The B1 event never carries the credential |
| 4.2-11: undo a promotion run only while no new-year evidence exists | Agree. **Define "evidence" broadly:** any sitting, response, result, enrolment change, certificate, print or report read in the new year. The undo is one audited act. It locks in A2A-L01's order: persons first, which across a whole school means a long lock, so the plan must bound it or batch it |
| 4.2-11: a renamed school's history keeps the name as issued | Agree. Verification shows "issued as X", plus the current name |
| 4.5-01: version the metric and label pre-repair output | Agree |
| 4.5-03: competency mappings are versioned | Agree |
| 4.5-11: WhatsApp fallback to card and PIN, or email | Agree, provided **the fallback is never weaker than the route it replaces,** and gives no new route to an account that a locked state refuses (ruling 19) |
| G-8: "consider" server progression earlier | **Stronger:** check now, cheaply, whether any server RPC allows a step that a page forbids. If one does, it is a defect, an integrity issue for Z or the rationalisation audit, not a 5.0 feature. If none does, G-8 drops to Low |

## 4 · Gaps the audit does not name (M-1 to M-8)

- **M-1 · Requests from the data subject.** A learner or parent asks for access, correction or deletion. There is no module and no owner decision. 4.2-06 covers a name correction requested by staff only. It needs R-2 and counsel; it is not a 4.2 feature by default, but it must be named.
- **M-2 · A deletion that survives a restore.** R-2's deletions must say what happens to backups. Otherwise a deleted learner returns at restore (JOB and HIS). This needs a rule and a test.
- **M-3 · The audit log as personal data.** `audit_log` will hold old names (4.2-06), sign-in network data (4.5-12) and educator acts. Who may read it, and how long it is kept, belong in R-2 and PRM. The matrix treats AUD only as created, never as read.
- **M-4 · Offboarding as an act, not only a view.** When a staff member leaves a school, their grants end, their sessions end, and their content is handed over:
  - authored draft packages, and their pending reviews (two-person review: the leaver may hold half);
  - a last admin cannot leave (B0).

  4.2-13 is the successor's view. Nobody owns the act. **This is a permission boundary, and it needs an owner.**
- **M-5 · Secrets and egress, as a module.** C3w-2's keys, WhatsApp's provider and any export storage all bring vendor secrets and outbound hosts. Add an **SEC** column: secrets, egress and third-party processors. Rulings 44 and 50 already show that every new processor needs its terms checked for minors.
- **M-6 · Who may read the past.** 4.2-05 and 4.5-08 decide what a past report *says*. They do not decide **who may read it now**:
  - a teacher who has left the class;
  - a new teacher reading their predecessor's period;
  - a school reading a transferred learner's old period (ruling 25).

  **My proposal:** current grants govern reading, and the period governs content. A snapshot of personal data never outlives the reader's grant. This is a policy, so add it to D-05 as D-05b, the owner's.
- **M-7 · The production upgrade is itself a prerequisite.** 111 → 4.x needs the rehearsal's blockers closed (REH-1 and the stage-2 counts) before any adoption. It belongs on G-4's path, named.
- **M-8 · Small-cell suppression starts in 4.5, not 5.0.** Any aggregate shown beyond the class teacher must suppress small groups: a school-level Question Intelligence figure, a department view, or a comparison across schools (4.5-02). Today it is only in 5.0-05.

## 5 · Disagreements, plainly, for §7

1. **4.2-03 is UNRESOLVED, not PARTIAL:** cross-school suspension and authority (D-03). Bob classes it PARTIAL.
2. **4.5-07 is UNRESOLVED, not PARTIAL:** its design waits on R-1. Bob classes it PARTIAL.
3. **G-11 needs a default:** exclude educator-related evidence from a 4.2 export until 4.5-07 exists. Bob leaves it to D-04a without a default.
4. **G-4 and G-5 are one path:** R-2 → production adoption (after the upgrade's blockers) → real evidence → 4.5. R-2 should be a 4.2 deliverable. Bob lists them as separate High risks and leaves R-2 unassigned.

*Could reasonably have been anticipated* applies to the audit, not to my own work. Q1 (readers and writers) finds M-3 and M-6. Q2 (the neighbouring act) finds M-4. Q5 (who checks) finds G-7's grant-enforced boundary.

## Addendum · revision 3 checked (18 Nov 2026, 08:35 UTC)

Read: §7 of the audit at `69ed8b63`. **It states my review correctly. No disagreement with Bob remains open; D-03 and D-R2 are the owner's.**
- **Two small corrections to the row:**
  - "Asked to read revision 2" is stale, per Bob's own note. My review stands on revision 1, and revision 3 records it;
  - **D-05b** (current grants govern reading, the period governs content) is adopted, as Bob's note says, but is missing from the row's "Adopted in revision 3" list.
- **On D-03:** Bob's recommendation is the code's behaviour, where `tangguhkan_akun` is platform-admin only. That answers who may suspend today. It still leaves the owner to confirm the model: a suspension made for one school's reason ends the person's work at every school. **That is the decision, and it is correctly placed with the owner.**

## Addendum · D-06, a name corrected after a certificate (18 Nov 2026, 09:05 UTC)

Daisy's point is **right, and today's verification already goes further than it.** I read the code on `main`:
- **`verify_certificate`** (latest body, `20270115110000_a_wrong_key_is_corrected_by_two_people_and_kept_on_the_record.sql`) returns exactly `{pass, predikat, institution, date, validity}`:
  - `institution` is the name as issued (`institution_as_issued`);
  - an unknown token yields no row, so it is no existence oracle;
  - an ELIGIBLE certificate is not public.
- **The public route** (`src/app/api/verifikasi/[token]/route.ts:29`) states the same projection: "Never a name, a photo, a score, a key version, a signature, a payload, or an internal designation."
- **So public verification shows no learner name at all,** neither as issued nor as current. A name correction can therefore never leak through it. **The rule for D-06 should be stated as today's behaviour:** verification never shows a name, current or as issued. That is stronger than "the certificate exactly as issued".
- **On the evidence side, for the reissue on request:**
  - a reissue is a **new** certificate under the existing review. The sealed `canonical_payload` of the old one is never edited;
  - the old one then reads `DIGANTIKAN` on verification. That says something changed, but not what. **Tell the holder this before they ask for a reissue,** since anyone holding the old paper will see it. Daisy's words;
  - the old name stays in the sealed payload and in the audit, which is personal data under R-2 and M-3. Readable only by those who could read the certificate before.
- **Not 4.1:** nothing here changes 4.1.
