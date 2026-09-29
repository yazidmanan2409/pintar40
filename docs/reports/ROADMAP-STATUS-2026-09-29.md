# PINTAR 4.0: roadmap status at the team pause (29 Sep 2026)

> **Status at 29 Sep 2026, 13:00 UTC.** `main` is at `4df914a`. Lana and Daisy have paused. Bob's four post-login corrections (BOB-38 to BOB-41) are built but not yet gated (section 3.1), and this report does not wait for them.

**Coordinator report (Second Eye).** Measured against the gate sequence (D-052), the identity gates (D-058), the release checklist v2.1 (D-028), the content plan, the architecture horizon review and the post-login review (D-061). Every claim cites the board (`docs/coordination/BOARD.md`), a decision (`DECISIONS.md`), a CI or audit run, or a commit.

**The gate PINTAR is at (D-052(f)): working toward ENGINEERING COMPLETE, the first of seven gates. It is not reached.**

---

## 1. At a glance

| Track | Status at the pause |
|---|---|
| **D-052 gate** | ENGINEERING COMPLETE: in progress. The six later gates have not started, by design. |
| **What still blocks ENGINEERING COMPLETE** | (1) The four post-login corrections, BOB-38 to BOB-41 (D-061): all four are built on Bob's lane, none gated yet. The first CI run (#238) stopped because BOB-39's new test borrows a helper from another test suite, which two isolated CI jobs do not load. It says nothing yet about the fixes themselves. Still to do: one test fix, one CI run for all four, and one gate, about an hour of work. (2) BOB-37: per-topic mastery can never show. (3) Identity gates 2E to 8 (D-058(c) puts identity inside ENGINEERING COMPLETE). (4) Staging proof of what has been gated since 29 Sep 04:22 UTC. |
| **Identity (D-058)** | Gates 0, 1 and 2: **PASS**. Gate 2E: the email frame prototype is accepted; the server half (BOB-25) is TODO. Gates 3 to 8: TODO. |
| **Architecture horizon review** | AMBER, no roadmap-driven change to 4.0. Both 4.0 reproducibility defects are **fixed and gated** (BOB-35, BOB-36). The version rule D-060 is in force. |
| **Release checklist P0** | **60 of 84 PASS** at its last scoring (28 Sep; baseline 24 Sep: 13). Not rescored since: a rescore needs a staging journey on the current `main`, and staging cannot deploy (below). |
| **Content** | **20 chapters CONTENT PASS: SD 5 Matematika Bab 1–9, SMA XI Geografi Bab 1–4, SMA X Matematika Bab 1–7.** 125 text lessons and 619 questions, every key verified by the coordinator. SD 5 Bab 1–4 are also accepted on staging (runs 11, 13, 14 and 15). |
| **Staging** | **Frozen at `1c52bea`** (29 Sep, 04:22 UTC). Every deploy since has been refused by Vercel's daily deployment limit. |
| **Production** | Unchanged: `5b5b68d` (23 Sep). Nothing is released to production before the gates (D-052(c), D-058(b)). |
| **Mail hosting** | Yazid is upgrading Namecheap from Stellar to Stellar Business. Namecheap moves the account to another server, and the domain is on PremiumDNS, so Yazid updates `A @`, `A mail` and SPF's `ip4` after the move. Both Supabase projects send sign-in email through `pintarselalu.com:465`. The "before" values are recorded, and the coordinator compares them after the move. |

---

## 2. The D-052 gate sequence

| # | Gate | Status | What it takes |
|---|---|---|---|
| 1 | **ENGINEERING COMPLETE** | **IN PROGRESS** | The intended 4.0 functionality, genuine defects and incomplete flows fixed, gates and staging proof. Includes identity (D-058(c)) and the D-061 corrections. |
| 2 | UI/UX POLISHED | Started early, where it waits on nothing | The polish register (UX-01 to UX-32), polish batches 1–3 (DAISY-26, DAISY-28, DAISY-29) and the shared text renderer (DAISY-30) are gated. The full pass (terminology inventory, navigation, hierarchy, feedback, responsiveness, first impression) follows ENGINEERING COMPLETE. Post-login findings #4, #5 and #7–#12 belong here (D-061). |
| 3 | YAZID GREEN LIGHT | Not started | Yazid walks the complete experience. |
| 4 | GLADYS GREEN LIGHT | Not started | Dr Gladys tests only after Yazid's green light. |
| 5 | EDUCATOR PILOT (about 20–30) | Not started | Identity Gate 8 first (D-058(b)): one controlled production release, then 3–5 educators, then ~150 testers. The tester package is drafted and held. |
| 6 | FIX / LEARN | Not started | |
| 7 | EXPAND TESTING AS NEEDED | Not started | |

---

## 3. What stands between `main` and ENGINEERING COMPLETE

### 3.1 The four post-login corrections (D-061; approved 29 Sep; each blocks ENGINEERING COMPLETE)

Each needs a test that is red on today's code, and proof that working behaviour is preserved.

| Ticket | Finding | State |
|---|---|---|
| **BOB-38** | #1: a successful email sign-in shows the failed-link screen («Tautan ini sudah tidak berlaku») before the home | **Built, not gated** (`c088f58`, test hardened in `6f3bfda`). The sign-in exchange returns its destination and the page moves on with `location.replace`, so the failed-link screen never renders on success. BOB38-K01 is red on the old code and green on the new. **The gate check is ready:** the audit's S1 now fails if the failed-link screen appears at any moment of a successful sign-in, and it is proven red on today's `main` (audit #48: «S14 shown on the way: yes, at /auth/callback»). It must pass at the gate. |
| **BOB-39** | #2: «Diteruskan ke pihak sekolah» never reaches the management decision queue | **Built, not gated** (`10ba1c7`, `5eb779b`; migration `20261024100000`). Recording «Diteruskan ke pihak sekolah» creates the referral decision in the same transaction, carrying the reviewer's note, so «Keputusan» on `/pimpinan` fills. F06-P22 is red on the old code and green locally. **CI #238 was red** because F06-P22 calls a helper defined in another suite (`selftest.f11_user`, in `fable11.sql`), which the isolated plant jobs do not load. The fix is to make the test self-contained. One consequence goes to Yazid (section 9): a Head of Department's referral outside their department is now refused rather than silently lost. |
| **BOB-40** | #3: the teacher's first suggestion ignores the class's subject, stage and grade | **Built, not gated** (`66160a3`). A (class, release) pair is suggested only when the class already holds an assignment for the same subject, stage and grade; a class with none gets no suggestion. BOB40-K01 passes. |
| **BOB-41** | #6: a question-health review cannot be concluded | **Built, not gated** (`3fef67c`, `adae662`; page only, no migration). Bank Soal offers only the legal next step for each state, and lists every SIGNAL_RAISED and UNDER_REVIEW item whatever its age. |

### 3.2 BOB-37: per-topic mastery can never show

A 4.0 defect in class evidence (EDU-12, X-10), found by Daisy while tracing UX-26 and verified by the coordinator. It is the first ticket when the team resumes.

### 3.3 Identity gates still to pass (section 4)

Gate 2E (email infrastructure: BOB-25), Gate 3 (activation and password sign-in: BOB-26, DAISY-20), Gate 4 (email recovery: BOB-27, DAISY-21), Gate 5 (PINTAR ID and PIN recovery: BOB-28, DAISY-22), Gate 6 (device modes and the shared lock: BOB-29, DAISY-23), Gate 7 (polish: DAISY-24), Gate 8 (pilot readiness: C-11), with the evidence harness C-10 from Gate 3. This is the largest block of remaining 4.0 work.

### 3.4 Staging proof

Everything gated since 04:22 UTC on 29 Sep is proven on CI and the audit journeys but **not yet on staging**:

- BOB-12 and DAISY-13 (the class-card sign-in; its staging acceptance also needs the forwarding key in Vercel);
- BOB-24, BOB-32 to BOB-36, and DAISY-27 to DAISY-31;
- the D-061 corrections;
- the SD 5 Bab 5–9, Geografi and SMA X Matematika chapters.

### 3.5 The capacity track (D-031)

BOB-15 with DAISY-12 (support reports), BOB-13 (hot paths at scale) and C-06 (load harness) follow the identity gates unless Yazid orders otherwise. The capacity P0 rows (CAP-01, CAP-02, CAP-07) are not yet tested.

---

## 4. Identity delivery (D-058), gate by gate

| Gate | Tickets | Status |
|---|---|---|
| 0: rulings, facts, sending architecture | C-09 | **DONE 29 Sep.** M1–M5 satisfied. M6 (Gmail and Outlook inboxes) carries into BOB-25's acceptance. |
| 1: the class-card morning sign-in | BOB-12 (with BOB-31), DAISY-13 | **GATE PASS 29 Sep** (CI #224, audit #40; DAISY-13 CI #225, audit #42). Staging acceptance pending: Vercel, and the forwarding key entered by Yazid. |
| 2: identity foundation | BOB-24 | **GATE PASS 29 Sep** with BOB-34, BOB-35 and BOB-36 (CI #236, 30/30; audit #47). |
| 2E: email infrastructure | BOB-25; DAISY-19 | BOB-25 **TODO**. DAISY-19's frame: **PROTOTYPE ACCEPTED 29 Sep**; it is wired after BOB-25. |
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

**Since that scoring**, three changes bear directly on it. None is counted until the rescore on staging.

- **U-PERF (the one FAIL):** its cause was the lesson player's save loop (BOB-23). BOB-23 is DONE and was accepted on staging in run 14 (J09 PASS). It should read PASS at the rescore.
- **The staging FAIL J14 (a class's leftover test activity):** its cause was removed on 29 Sep, when 15 leftover open tests were closed with Yazid's approval. The rows it blocked are to be re-run.
- **EDU-12 and X-10 (class evidence):** BOB-37 is a 4.0 defect in exactly this evidence. The rows stay PARTIAL until it is gated.

**P0 rows still open at the last scoring:**

- FAIL (1): U-PERF, whose fix is accepted on staging (above).
- Not tested (6): STU-09, HOD-03, DEA-02, CAP-01, CAP-02, CAP-07.
- PARTIAL (17), including: STU-07, STU-11 (its media half is out of scope under D-050), STU-19, EDU-04, EDU-09, EDU-12, HOD-02, HOD-04, ADM-05, X-05, X-07, X-09, X-10, X-13, CAP-08, U-DEVICE.

Most of these need walking rather than building. They are the coordinator's, on staging, once it deploys again.

---

## 6. Content plan

| Set | Chapters | Status | On staging |
|---|---|---|---|
| SD 5 Matematika | Bab 1–9 (LANA-01 to LANA-09), plus the consistency pass across all nine (LANA-14) | **All PASS** | Bab 1–4 accepted on staging (runs 11, 13, 14 and 15). Bab 5–9 wait for staging. |
| SMA XI Geografi | Bab 1–4 (LANA-10 to LANA-13) | **All CONTENT PASS** | Waiting for staging |
| SMA X Matematika | Bab 1–7 (LANA-15 to LANA-21) | **All CONTENT PASS**; Bab 7 on 29 Sep, round 1 | Waiting for staging. The chapters need DAISY-30's renderer, which is gated. |

**Totals:** 20 chapters, 125 text lessons, 619 questions.

- Every number is asserted by the chapter's generator; the SMA X chapters carry about 3,300 assertions each.
- Every definition is traced to a page of the source book, and book errors are recorded, not copied.
- Every key and every distractor was verified by the coordinator.
- Media is out of scope for the first testing phases (D-050).

**Open with Yazid since 28 Sep:** a distractor's misconception code must already be registered for the school, and nothing can register one yet. Until that is decided, the chapters publish with WEAK_MISCONCEPTION_LINKAGE warnings, which are reviewed at the Terbit step.

---

## 7. Review findings and where they stand

**Architecture horizon review (29 Sep): AMBER.**

- BOB-35 (a corrected-release move left mixed provenance) and BOB-36 (a launched Uji Cepat could change its rules): **GATE PASS**.
- D-060 (a version label changes when its meaning changes) is checked at every gate.
- Seven lower-priority observations are in the backlog; none blocks 4.0.
- Nothing from 4.5, 5.0 or 5.5 was ticketed or built.

**Post-login 60-second review (29 Sep): PARTIAL.** Twelve findings:

| Finding | Where it went |
|---|---|
| #1 failed-link screen on a successful sign-in · #2 decision queue never fed · #3 suggestion ignores subject and grade · #6 question-health review cannot conclude | **4.0 corrections** BOB-38, BOB-39, BOB-40, BOB-41 (section 3.1) |
| #4 admin landing shows no pending work · #5 Studio work counted but not reachable · #7 integrity review lacks context · #8 content review cannot send back · #9 teacher attention one class at a time · #10 modal tour · #11 action results not always said · #12 learner has no «all done» state | **UI/UX POLISHED** (D-061): the terminology and UI/UX polish review |

---

## 8. Staging: the Vercel deployment limit

- **Staging's app has been at `1c52bea` since 29 Sep, 04:22 UTC.** Every Vercel deployment since then reports "Deployment rate limited — retry in 24 hours".
- **Lane pushes reach Vercel too.** Pushes to the lane branches, not only to `main`, carry Vercel deployment statuses. Each is either "Canceled by Ignored Build Step" (the project's "Only build production" setting, `docs/deployment/STAGING.md`) or refused by the same limit. So Vercel creates a deployment for every push by every lane before deciding not to build it. With four lanes pushing all day, this is the likeliest reason the daily allowance runs out.
- **The coordinator already moves `main` only for code merges.** That alone does not keep staging deployable.
- **Proposal for Yazid** (a deployment configuration change, so it needs your approval): stop Vercel creating deployments for branches other than `main`, with `git.deploymentEnabled` in `vercel.json`, or move the staging project to a plan with a larger allowance.
- **Until then:** staging deploys at the next window. A check-in is set for 30 Sep, 04:50 UTC; after it, every staging acceptance above is walked.

---

## 9. The pause, and the order to resume

**At the pause (29 Sep):**

- **Lana:** stopped after LANA-21's CONTENT PASS. SMA X Matematika is complete, and nothing is left on her lane.
- **Bob:** stops now (coordinator's recommendation, 29 Sep 13:00). All four D-061 tickets are built, committed and pushed to his lane at `d34a3ce`; none is gated. Nothing is unpushed. The unfinished part is a one-test fix, one CI run and the gate, and it is the first thing on resume.
- **Daisy:** stopped after DAISY-31's gate (CI #237 30/30, audit #49; merged and on `main` at `4df914a`). Nothing is left on her lane.
- **Coordinator:** gated everything handed off so far: LANA-21, and DAISY-31 (merged and on `main` at `4df914a`). The board shows what is done, what is open and the resume order. BOB-38's audit check is proven red on `main`, and the mail endpoint is recorded before the Stellar Business server move (`auth/GATE-0-FACTS.md` §4). On resume: gate BOB-38 to BOB-41 and move `main` forward.

**Resume order:**

1. **Staging first:** deploy `main`, then run the staging journeys over everything listed in 3.4, then rescore the release checklist.
2. **Bob:** first, close the D-061 set. Make F06-P22 self-contained (it borrows `selftest.f11_user` from `fable11.sql`), run one CI for BOB-38 to BOB-41, then the coordinator's gate with one audit, where S1 must pass. Then BOB-37, BOB-25 (Gate 2E), BOB-26 (3), BOB-27 (4), then BOB-28 (5) and BOB-29 (6) in either order; then BOB-15 and BOB-13.
3. **Daisy:** DAISY-19's wiring with BOB-25; DAISY-20 with BOB-26's contract; DAISY-21 to DAISY-24 behind their Bob gates; the UI/UX POLISHED pass, including post-login findings #4, #5 and #7–#12.
4. **Lana:** no chapter is queued. New content is Yazid's call.

**Decisions waiting on Yazid:**

- Vercel: branch deployments off, or a larger plan (section 8).
- The forwarding key in Vercel, for BOB-12's staging acceptance.
- How misconception codes are registered.
- How class figures are proven from official evidence (EDU-12, X-10).
- REL-08 and REL-09 (Supabase settings, offline key copies).
- **The Stellar Business move (in progress):** the date, then the DNS update right after the move, then one sign-in on staging and one on production with your own address. The coordinator re-reads the records and compares them with `auth/GATE-0-FACTS.md` §4.
- **Who may refer an integrity signal to the school.** Reading signals and recording a review are school-wide for anyone holding CAN_REVIEW_INTEGRITY (`integrity_signals_select`, 12 Sep). The referral (`refer_integrity_signal`, 24 Sep) needs authority over the signal's class. So a Head of Department can review another department's signal but cannot refer it. With BOB-39 that referral is refused outright (ACTION_NOT_ALLOWED), where before it was recorded and silently went nowhere. Keep the class-scoped rule, or let the referral follow the review's school-wide authority. Either is a change to who holds authority, so it is not part of the narrow D-061 fix.
