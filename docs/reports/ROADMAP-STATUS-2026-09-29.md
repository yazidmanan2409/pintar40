# PINTAR 4.0: roadmap status at the team pause (29 Sep 2026)

> **Updated 29 Sep 2026, 22:15 UTC** (first issued at 13:00 UTC).
>
> - **Code:** `main` is at `1393c38`, and staging runs that same code again with a matching database.
> - **Team:** Lana and Daisy are paused. Bob is finishing BOB-37, the last ticket before his pause.
> - **What changed since 13:00** is in section 0; every other section is brought up to date.

**Coordinator report (Second Eye).** Measured against:

- the gate sequence (D-052) and the identity gates (D-058);
- the release checklist v2.1 (D-028) and the content plan;
- the architecture horizon review, and the post-login review (D-061) with its rulings (D-062).

Every claim cites the board (`docs/coordination/BOARD.md`), a decision (`DECISIONS.md`), a CI or audit run, or a commit.

**The gate PINTAR is at (D-052(f)): working toward ENGINEERING COMPLETE, the first of seven gates. It is not reached.**

---

## 0. What changed since 13:00

1. **The four post-login corrections passed their gate and are on `main`.** BOB-38 to BOB-41 (D-061) are GATE PASS, merged at `375d84f`, and no longer block ENGINEERING COMPLETE.
    - CI #239 was 31/31, with the strict contract at 437 passed, 0 skipped.
    - Audit #50 was 27 PASS, 1 NOTE.
    - A successful email sign-in no longer shows the failed-link screen: audit S1 is red on the old `main` (audit #48) and green on the fix.
    - The other three:
        - a referral now reaches the decision queue;
        - the teacher's suggestion fits the class's subject, stage and grade;
        - a question-health review can be concluded.
2. **BOB-37 (per-topic mastery never shows) is built, but not yet gated.**
    - The approach is ruled correct: the catalogue defines both figures as averages of learners' mastery.
    - It publishes metric catalogue MC-3, as D-060 requires.
    - Bob's container restarted and killed his local proof runs. He is rerunning them, then one CI run and his hand-off. A gate check-in is set for 23:11 UTC.
3. **Daisy's documentation refresh is merged** (`df48f3b`): the terminology inventory, re-based on `main` `4df914a`, and post-login findings #4, #5 and #7–#12 recorded as UX-33 to UX-40 for the UI/UX POLISHED pass. Daisy is paused.
4. **Yazid's rulings, D-062:**
    - (a) Vercel deploys `main` only.
    - (b) BOB-25 (Gate 2E) stays paused until the Stellar Business migration and the post-move mail check are both done.
    - (c) The forwarding key is added during staging acceptance.
    - (d) Integrity referral authority stays class- and department-scoped for 4.0, and an unauthorized referral fails explicitly.
    - (e) Misconception registration, official-evidence provenance and REL-08/09 stay pending, with no ruling to be inferred.
5. **Staging is unblocked.**
    - `vercel.json` now turns off deployments for every branch except `main`. Verified: a branch commit got no Vercel status, while `main` deployed.
    - The daily limit has reset, and Vercel deployed `main` `1393c38` at about 22:10 UTC.
    - Staging's database was also behind: the automatic migration run is skipped for `[skip ci]` commits. It was brought to 130 of 130 migrations by staging run #23, whose live checks passed (sign-in page, sign-up refused, one recorded admin, sign-in link on staging's own callback).
6. **Mail hosting.** The "before" values for the Stellar Business server move are recorded (`auth/GATE-0-FACTS.md` §4). Yazid is waiting for Namecheap's answers before booking the move.

---

## 1. At a glance

| Track | Status (22:15 UTC) |
|---|---|
| **D-052 gate** | ENGINEERING COMPLETE: in progress. The six later gates have not started, by design. |
| **What still blocks ENGINEERING COMPLETE** | (1) BOB-37: per-topic mastery can never show. It is built and ruled correct, but not yet gated. (2) Identity gates 2E to 8 (D-058(c) puts identity inside ENGINEERING COMPLETE); 2E is held by D-062(b). (3) Staging proof of what has been gated since 29 Sep 04:22 UTC, now possible again. The four post-login corrections, which blocked it at 13:00, are now done. |
| **Identity (D-058)** | Gates 0, 1 and 2: **PASS**. Gate 2E: the email frame prototype is accepted, and BOB-25 is **HELD** until the Stellar Business move and the mail check after it (D-062(b)). Gates 3 to 8: TODO. |
| **Architecture horizon review** | AMBER, with no roadmap-driven change to 4.0. Both 4.0 reproducibility defects are **fixed and gated** (BOB-35, BOB-36). The version rule D-060 is in force; BOB-37 applies it with MC-3. |
| **Release checklist P0** | **60 of 84 PASS** at its last scoring (28 Sep; baseline 24 Sep: 13). Not rescored yet. The rescore needs staging journeys on the current `main`, which are possible again from tonight. |
| **Content** | **20 chapters CONTENT PASS: SD 5 Matematika Bab 1–9, SMA XI Geografi Bab 1–4, SMA X Matematika Bab 1–7.** 125 text lessons and 619 questions, every key verified by the coordinator. SD 5 Bab 1–4 are also accepted on staging (runs 11, 13, 14 and 15). |
| **Staging** | **Deploying again.** The app is `main` `1393c38` (about 22:10 UTC), and the database has 130 of 130 migrations (staging run #23). Staging journeys over today's work are next. |
| **Production** | Unchanged: `5b5b68d` (23 Sep). Nothing is released to production before the gates (D-052(c), D-058(b)). |
| **Mail hosting** | Yazid is upgrading Namecheap from Stellar to Stellar Business. Namecheap moves the account to another server, and the domain is on PremiumDNS, so Yazid updates `A @`, `A mail` and SPF's `ip4` after the move. Both Supabase projects send sign-in email through `pintarselalu.com:465`. The "before" values are recorded, and the coordinator compares them after the move. |

---

## 2. The D-052 gate sequence

| # | Gate | Status | What it takes |
|---|---|---|---|
| 1 | **ENGINEERING COMPLETE** | **IN PROGRESS** | The intended 4.0 functionality, genuine defects and incomplete flows fixed, gates and staging proof. Includes identity (D-058(c)); the D-061 corrections are now done. |
| 2 | UI/UX POLISHED | Started early, where it waits on nothing | Already gated: the polish register (UX-01 to UX-32), polish batches 1–3 (DAISY-26, DAISY-28, DAISY-29) and the shared text renderer (DAISY-30). The full pass follows ENGINEERING COMPLETE: terminology inventory (refreshed tonight), navigation, hierarchy, feedback, responsiveness, first impression. Post-login findings #4, #5 and #7–#12 are in the register as UX-33 to UX-40 (D-061). |
| 3 | YAZID GREEN LIGHT | Not started | Yazid walks the complete experience. |
| 4 | GLADYS GREEN LIGHT | Not started | Dr Gladys tests only after Yazid's green light. |
| 5 | EDUCATOR PILOT (about 20–30) | Not started | Identity Gate 8 comes first (D-058(b)): one controlled production release, then 3–5 educators, then ~150 testers. The tester package is drafted and held. |
| 6 | FIX / LEARN | Not started | |
| 7 | EXPAND TESTING AS NEEDED | Not started | |

---

## 3. What stands between `main` and ENGINEERING COMPLETE

### 3.1 The four post-login corrections (D-061): **DONE**

Each needed a test that is red on the old code, and proof that working behaviour is preserved. All four are **GATE PASS 29 Sep**, on `651b160`, merged at `375d84f`. The gate evidence: CI #239 (31/31; strict contract 437 passed, 0 skipped) and audit #50 (27 PASS, 1 NOTE).

| Ticket | Finding | What changed |
|---|---|---|
| **BOB-38** | #1: a successful email sign-in showed the failed-link screen («Tautan ini sudah tidak berlaku») before the home | The exchange now answers with its destination instead of redirecting. The page leaves with `location.replace`; the destination comes only from `tujuanMasuk` and is narrowed again. Audit S1 was red on the old `main` (#48) and is green here (#50). Refused, expired and cross-browser links still show S14. |
| **BOB-39** | #2: «Diteruskan ke pihak sekolah» never reached the management decision queue | Recording the referral now raises the decision through `refer_integrity_signal`, in the same transaction (migration `20261024100000`). The referral stays class- and department-scoped (D-062(d)): a referral out of scope is refused whole, and the screen shows ACTION_NOT_ALLOWED. |
| **BOB-40** | #3: the teacher's first suggestion ignored the class's subject, stage and grade | A release is suggested only when the class already holds an assignment for the same subject, stage and grade. A class with none gets no suggestion, and «Siapkan materi» is unchanged. |
| **BOB-41** | #6: a question-health review could not be concluded | Bank Soal offers only the legal next step for each state, and lists every item waiting on a reviewer, whatever its age. |

### 3.2 BOB-37: per-topic mastery can never show (IN PROGRESS)

A 4.0 defect in class evidence (EDU-12, X-10). Built on Bob's lane (`9d6ebed`, with `main` `375d84f` merged in):

- **The change:** both calculators now average each learner's recorded `penguasaan`. The coordinator ruled this correct: the catalogue defines them as «Rata-rata penguasaan…».
- **D-060:** the migration publishes metric catalogue MC-3, copied forward from MC-2 with definitions, minimum samples and audiences identical. No stored result is rewritten.
- **The test:** F06-P23 is red on today's code and green with the fix. A new plant gate turns it red three ways.
- **A knock-on, fixed:** one db-wp1 plant had named `MC-2` as the live catalogue, and now reads the live version.

Still to come: Bob's local proof (rerun after his container restarted), one CI run, his hand-off, and the coordinator's gate with one audit.

### 3.3 Identity gates still to pass (section 4)

The remaining gates:

- **Gate 2E**, email infrastructure: BOB-25, **held** by D-062(b);
- **Gate 3**, activation and password sign-in: BOB-26, DAISY-20;
- **Gate 4**, email recovery: BOB-27, DAISY-21;
- **Gate 5**, PINTAR ID and PIN recovery: BOB-28, DAISY-22;
- **Gate 6**, device modes and the shared lock: BOB-29, DAISY-23;
- **Gate 7**, polish: DAISY-24;
- **Gate 8**, pilot readiness: C-11, with the evidence harness C-10 from Gate 3.

This is the largest block of remaining 4.0 work.

### 3.4 Staging proof

Staging runs the current `main` again, so everything gated today can now be walked there. It is proven on CI and the audit journeys, **but not yet on staging**:

- BOB-12 and DAISY-13, the class-card sign-in. The forwarding key is added during this acceptance (D-062(c)).
- BOB-24, BOB-32 to BOB-36, BOB-38 to BOB-41, and DAISY-27 to DAISY-31.
- The SD 5 Bab 5–9, Geografi and SMA X Matematika chapters.

### 3.5 The capacity track (D-031)

BOB-15 with DAISY-12 (support reports), BOB-13 (hot paths at scale) and C-06 (load harness) follow the identity gates unless Yazid orders otherwise. The capacity P0 rows (CAP-01, CAP-02, CAP-07) are not yet tested.

---

## 4. Identity delivery (D-058), gate by gate

| Gate | Tickets | Status |
|---|---|---|
| 0: rulings, facts, sending architecture | C-09 | **DONE 29 Sep.** M1–M5 satisfied. M6 (Gmail and Outlook inboxes) carries into BOB-25's acceptance. |
| 1: the class-card morning sign-in | BOB-12 (with BOB-31), DAISY-13 | **GATE PASS 29 Sep** (CI #224, audit #40; DAISY-13 CI #225, audit #42). Staging acceptance is next, now that staging deploys, with the forwarding key added during it (D-062(c)). |
| 2: identity foundation | BOB-24 | **GATE PASS 29 Sep** with BOB-34, BOB-35 and BOB-36 (CI #236, 30/30; audit #47). Its migration is now on staging (130 of 130). |
| 2E: email infrastructure | BOB-25; DAISY-19 | BOB-25 **HELD** (D-062(b)) until the Stellar Business migration and the post-move mail verification are both complete. DAISY-19's frame: **PROTOTYPE ACCEPTED 29 Sep**, wired after BOB-25. |
| 3: activation and password sign-in | BOB-26, DAISY-20 | TODO |
| 4: email recovery | BOB-27, DAISY-21 | TODO |
| 5: PINTAR ID and PIN recovery | BOB-28, DAISY-22 | TODO |
| 6: device modes and the shared lock (or the 15-minute idle fallback) | BOB-29, DAISY-23 | TODO |
| 7: polish | DAISY-24 | TODO |
| 8: pilot readiness | C-11 (with the harness C-10) | TODO |

Password sign-in never reaches production without working recovery (D-058(b)).

---

## 5. Release checklist v2.1 (P0)

**Last scored 28 Sep on `main` `1f3b0f1`: 60 PASS · 17 PARTIAL · 1 FAIL · 6 N-T, of 84 (baseline 24 Sep: 13 PASS).** Verdict then: NO-GO; working toward ENGINEERING COMPLETE.

**Since that scoring**, four changes bear directly on it. None is counted until the rescore on staging, which can now start.

- **U-PERF (the one FAIL):** its cause was the lesson player's save loop (BOB-23). BOB-23 is DONE and was accepted on staging in run 14 (J09 PASS). It should read PASS at the rescore.
- **The staging FAIL J14 (a class's leftover test activity):** its cause was removed on 29 Sep, when 15 leftover open tests were closed with Yazid's approval. The rows it blocked are to be re-run.
- **EDU-12 and X-10 (class evidence):** BOB-37 is a 4.0 defect in exactly this evidence. The rows stay PARTIAL until it is gated, and official-evidence provenance stays Yazid's decision (D-062(e)).
- **STU-01 and the sign-in experience:** BOB-38 removes the failed-link flash on success (audit S1).

**P0 rows still open at the last scoring:**

- FAIL (1): U-PERF, whose fix is accepted on staging (above).
- Not tested (6): STU-09, HOD-03, DEA-02, CAP-01, CAP-02, CAP-07.
- PARTIAL (17), including: STU-07, STU-11 (its media half is out of scope under D-050), STU-19, EDU-04, EDU-09, EDU-12, HOD-02, HOD-04, ADM-05, X-05, X-07, X-09, X-10, X-13, CAP-08, U-DEVICE.

Most of these need walking rather than building. They are the coordinator's, on staging, which is available again.

---

## 6. Content plan

| Set | Chapters | Status | On staging |
|---|---|---|---|
| SD 5 Matematika | Bab 1–9 (LANA-01 to LANA-09), plus the consistency pass across all nine (LANA-14) | **All PASS** | Bab 1–4 accepted on staging (runs 11, 13, 14 and 15). Bab 5–9 go with the next staging journeys. |
| SMA XI Geografi | Bab 1–4 (LANA-10 to LANA-13) | **All CONTENT PASS** | With the next staging journeys |
| SMA X Matematika | Bab 1–7 (LANA-15 to LANA-21) | **All CONTENT PASS**; Bab 7 on 29 Sep, round 1 | With the next staging journeys. DAISY-30's renderer, which these chapters need, is now deployed there. |

**Totals:** 20 chapters, 125 text lessons, 619 questions.

- Every number is asserted by the chapter's generator; the SMA X chapters carry about 3,300 assertions each.
- Every definition is traced to a page of the source book, and book errors are recorded, not copied.
- Every key and every distractor was verified by the coordinator.
- Media is out of scope for the first testing phases (D-050).

**Still pending Yazid (D-062(e)):** a distractor's misconception code must already be registered for the school, and nothing can register one yet. Until that is decided, the chapters publish with WEAK_MISCONCEPTION_LINKAGE warnings, which are reviewed at the Terbit step.

---

## 7. Review findings and where they stand

**Architecture horizon review (29 Sep): AMBER.**

- BOB-35 (a corrected-release move left mixed provenance) and BOB-36 (a launched Uji Cepat could change its rules): **GATE PASS**.
- D-060 (a version label changes when its meaning changes) is checked at every gate. BOB-37 is its first new catalogue version (MC-3).
- Seven lower-priority observations are in the backlog; none blocks 4.0.
- Nothing from 4.5, 5.0 or 5.5 was ticketed or built.

**Post-login 60-second review (29 Sep): PARTIAL.** Twelve findings:

| Finding | Where it went |
|---|---|
| #1 failed-link screen on a successful sign-in · #2 decision queue never fed · #3 suggestion ignores subject and grade · #6 question-health review cannot conclude | **4.0 corrections BOB-38 to BOB-41: GATE PASS 29 Sep, on `main`** (section 3.1) |
| #4 admin landing shows no pending work · #5 Studio work counted but not reachable · #7 integrity review lacks context · #8 content review cannot send back · #9 teacher attention one class at a time · #10 modal tour · #11 action results not always said · #12 learner has no «all done» state | **UI/UX POLISHED** (D-061): recorded as **UX-33 to UX-40** in the polish register (29 Sep) |

---

## 8. Staging: the Vercel deployment limit (RESOLVED)

- **The cause:** staging's app was stuck at `1c52bea` from 04:22 UTC, because every deployment was refused as "rate limited". Lane pushes also created Vercel deployments; the Ignored Build Step cancelled them, but they had already been created against the daily allowance.
- **Resolved by D-062(a)** (`1393c38`): `vercel.json` sets `git.deploymentEnabled` to `{"**": false, "main": true}`. Verified on real pushes: a branch commit received no Vercel status in 3½ minutes, where earlier ones received one within seconds, while `main` deployed. Lanes carry the setting once they merge `main`.
- **A second gap, found and closed tonight:** the staging workflow applies migrations automatically only on pushes to `main`, and GitHub skips it for `[skip ci]` commits, which every `main` update today was. Staging run #23 applied the six missing migrations: 130 of 130, with its live checks verified. From now on the coordinator runs it by hand whenever `main` gains a migration.

---

## 9. The pause, and the order to resume

**At the pause (updated 22:15 UTC):**

- **Lana:** stopped after LANA-21's CONTENT PASS. SMA X Matematika is complete, and nothing is left on her lane.
- **Bob:** Yazid let him finish his overnight runs. The D-061 set is gated and on `main`. **BOB-37** is built and awaits its proof rerun, CI run and gate. Then he stops; BOB-25 is held (D-062(b)).
- **Daisy:** stopped after DAISY-31's gate and tonight's documentation refresh (terminology inventory; UX-33 to UX-40). Nothing is left on her lane.
- **Coordinator:** gated LANA-21, DAISY-31 and the D-061 set tonight, merged Daisy's documentation and recorded D-062. Staging is deployed and migrated. Next: BOB-37's gate (check-in at 23:11 UTC), then the staging journeys.

**Resume order:**

1. **Staging acceptance now that it deploys:** run the staging journeys over everything in 3.4, add the forwarding key during BOB-12's acceptance (D-062(c)), then rescore the release checklist.
2. **Bob:** after BOB-37, BOB-26 (Gate 3) cannot start before Gate 2E. So once the mail move is verified: BOB-25 (2E), BOB-26 (3), BOB-27 (4), then BOB-28 (5) and BOB-29 (6) in either order; then BOB-15 and BOB-13.
3. **Daisy:** DAISY-19's wiring with BOB-25; DAISY-20 with BOB-26's contract; DAISY-21 to DAISY-24 behind their Bob gates; the UI/UX POLISHED pass, including UX-33 to UX-40.
4. **Lana:** no chapter is queued. New content is Yazid's call.

**Decided since 13:00 (D-062):**

- Vercel deploys `main` only (done, verified).
- BOB-25 is held until the Stellar Business move and the mail verification after it.
- The forwarding key is added during staging acceptance.
- Integrity referral authority stays class- and department-scoped for 4.0; an unauthorized referral fails explicitly, which BOB-39 already does.

**Still waiting on Yazid:**

- **The Stellar Business move:** the date, then the DNS update right after the move (`A @`, `A mail`, SPF `ip4`), then one sign-in on staging and one on production with your own address. The coordinator re-reads the records and compares them with `auth/GATE-0-FACTS.md` §4.
- **How misconception codes are registered** (D-062(e); no ruling to be inferred).
- **How class figures are proven from official evidence** (EDU-12, X-10) (D-062(e)).
- **REL-08 and REL-09** (Supabase settings, offline key copies) (D-062(e)).
