# PINTAR 4.1 · current instructions to the team

> Kept by the Chief Architect on `claude/bob-41-master-plan`, so that every instruction is readable by its recipient
> and names full commits. Replaced as the work moves; the log at the end keeps what was issued. It adds no gate: it is
> where the prompts live.

**Approved direction (owner, 11 Nov 2026):** B1 closure → L-1 → F-1 → B2 → A2 → C2w → A3 → C3w → Z.
**Not authorized:** any PR, merge, staging promotion or production change. Staging is not to be modified.

## State

| Item | State | Commit |
|---|---|---|
| B1 | **Closed.** Sharon PASS, Daisy PASS, CI `43110782265` and journeys `43110786290` green | `1fc719b5127313bf24084695fa30d7505e15b5d1` |
| L-1, suspended sign-in correction | **CLOSED. Sharon PASS** (12 Nov). Residual L1-R2 goes with L1-F2 | `916d12c01345816afcf567b40131e72b9857cf65` |
| F-1, C1w correction pass | **CLOSED. Sharon PASS** (12 Nov). Remaining with Daisy, not a gate: the learner's disclosure and any wording for an absent explanation | `bc67f72a0e1c6bc39a2c16292f728080b12710d4` |
| L1-F2, a suspension covers accounts created after it | Design PASS. **Unblocked** (the L-1 fix has passed). Own commit; before Z. Also takes L1-R2 (delete outstanding password-write permits at locking) and builds the two-connection race setup that L1-F4 needs | brief: `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §0, §2a |
| L1-F4, an anonymised person is terminal | **Pushed; CI and journeys running** (local pre-flight: 1101 passed, 164 of 164 planted defects, 11 of 11 groups). Not accepted until the two-connection race test passes | `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2` |
| F1-R1b, a key correction clears stale explanations | Amended design PASS (Sharon). **Released to build**, after F-1's fix; own commit; before Z; holds nothing. Includes the INV-03 baseline amendment, its manifest entry and an ADR in the same commit | brief: `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §0, §3d |
| S-1, phone drawer overflow | **Pushed.** Covered by the CI and journeys of the F-1 fix commit above it. Daisy verifies it with B2, at phone widths **and at the desktop sidebar**, because one rule hides a nav item at every width | `61a6dd3b19761dfc91e11ac4f9e0295b64a32c6e` |
| B2 | **OPEN FOR BUILD.** Pre-build PASS with five changes to carry on the page (`B2-ARCHITECT-NOTES.md` §3). Needs Daisy's wording for the default print line | page at `b21bec621a449e8d4d90ed646f7fb09c15dfc6f9` |

Work branch: `claude/system-integrity-4.0`. Briefs and records: this branch, `docs/completion-4.1/`.

## Second Eye

1. **Record B1's close.** `docs/completion-4.1/batches/B1-COMPLETION.md` still says "pre-build PASS, released for
   build". Add the result: closed on `1fc719b5127313bf24084695fa30d7505e15b5d1`; Sharon PASS (two governed
   limitations, one accepted exception); Daisy PASS (her record on `ux-1/daisy-experience` at `c3ab4eac`); CI and
   journeys run ids; the register B1-R1 to R5 going to B2. Documentation only; it may ride with the next commit.
2. **L-1 (in progress).** Brief: `AUTH-SUSPENDED-SIGNIN-CORRECTION.md`. Your reading of the one conflict is right:
   Sharon's condition governs; the accountability event records `MASUK_TIDAK_COCOK`. Three additions:
   - **Per method (added 12 Nov, from Daisy):** "the same as a wrong password" means each method's own ordinary
     mismatch (`MASUK_TIDAK_COCOK`, `CARD_NOT_MATCHED`, `PIN_TIDAK_COCOK`, and the code and link-request routes'
     own), in the response and in the accountability event. `PIN_DITANGGUHKAN` stays as it is. Brief §3.2.
   - **Staging has no locked account** (read-only check, in the brief §2). The rewrite migration must therefore be
     correct on a database with none, with some, and when run twice.
   - **State on the page whether the core change** (lock value, rewrite, route answer) **depends on any 4.1 object,**
     and keep the B1-A04 assertions separable from it. This keeps a narrow correction of `main` possible; it is not a
     request to build one.
   - **Do not suspend or close any account on staging,** and do not run the hosted test. It is deferred to the first
     promotion that carries this correction.
   When the full pre-flight is green and pushed: give the owner the 40-character commit for Sharon and Daisy.
3. **F-1.** Brief: `C1W-F1-CORRECTION.md` (§8 impact list, §9 brief). Starts when L-1 is pushed for review; it does
   not wait for L-1's verdict, because the code is independent. Its own commit; Sharon's review on that commit. If a
   screen changes (row 2, the key shown to the teacher), say so on the page so Daisy is asked.
4. **S-1.** The open phone drawer is 8 px wider than the screen on every Konfigurasi page (Daisy's review of
   `1fc719b5`, §2b; look first at `.pin-staf .pin-laci { width: 100% }` inside the fixed
   `.pin-staf[data-laci="buka"]` in `src/app/experience.css`). Required: the open sheet is no wider than the
   viewport; it keeps the 16 px gutter; the focus ring is whole at 320 px. Its own small commit, after F-1 and before
   B2's candidate, with the rendered check at 390 and 320 px on three different Konfigurasi pages, because it is a
   shell change: ask what else it changed. Daisy verifies it together with B2, in one visit.
5. **B2** opens when L-1 and F-1 both have Sharon's PASS. It takes B1-R1 to R5 (`B1-ARCHITECT-CHECK.md` §13) and the
   print step of §8.5 journey 4.
6. **Every page** carries the cross-module inventory and the next-state row (`SYSTEM-INTEGRITY-4.1.md` §2, §3a).
   **Report** at each push: the 40-character commit, the pre-flight figures, the CI and journeys run ids, and any
   limitation.

## Sharon

1. **L-1, when its commit is given to you** (one review, on that exact commit). The brief is
   `AUTH-SUSPENDED-SIGNIN-CORRECTION.md`; the engineer's page is
   `docs/completion-4.1/batches/AUTH-SUSPENDED-SIGNIN-COMPLETION.md` on the work branch. Please verify:
   - from outside, a suspended, a closed, an anonymised and an unknown account and a wrong password are
     indistinguishable in status, body and wording, for every sign-in method, whichever password is given, and that
     the measured response times do not separate them;
   - a real Auth outage still answers 503;
   - the lock value, every reader of it, reinstatement, and the rewrite of already-locked accounts (none, some, run
     twice);
   - your B1-A04 assertion: the accountability event records `MASUK_TIDAK_COCOK`. **Please confirm the
     reconciliation in the brief §5:** the true reason is kept only in the server log and the suspension's own audit
     record, never in a record a school admin reads;
   - the page's statement on whether the core change depends on any 4.1 object.
2. **F-1, when its commit is given to you:** your six acceptance requirements (`C1W-F1-CORRECTION.md` §5), the
   accessor chosen per view (§9.2), and the classification of the statistics views (§8 row 5). A proposed change to
   a catalogue definition is escalated, not reviewed in.
3. **B2's pre-build review** follows, on its completion page.
4. **Verdicts:** PASS or BLOCKED on the 40-character commit, with how the four questions were answered.

## Daisy

1. **L-1 (changed 12 Nov, 02:20): not a separate visit and not a gate.** Run it together with your F-1 review, on
   the F-1 commit, which contains L-1. The check itself is unchanged: your red-first check. A suspended or closed account's attempt reads
   exactly as a wrong password does, on the sign-in screen and as the reader's row («Email, username, atau password
   belum cocok.»), whichever password is given. Nothing else in the screens should have changed; say so if it has.
2. **F-1: you are needed.** The teacher's per-question screen gains one line naming the original key. On the F-1
   commit, when it is given: what the teacher is shown as the key in force, how the original key is named beside it,
   that a teacher cannot mistake one for the other, and that the screen is otherwise unchanged; at 1280, 390 and
   320 px. Then your L-1 confirmation (item 1), in the same visit.
3. **B2, one visit:** your design input for B2 as planned, plus the register B1-R1 to R5 (wording is yours), the
   completeness notice B1-R4 (platform admin only, qualified, linking to health; no school named), and S-1's
   verification at 390 and 320 px across Konfigurasi pages.
4. **Verdicts:** PASS or BLOCKED on the 40-character commit.

## Keeping instructions current (owner, 12 Nov 2026)

- **One current statement.** For each piece of work, the brief's "what holds now" section and this file's state table
  are what is in force. Anything else is history.
- **Whoever changes a requirement marks the old one where it stands**, as superseded or withdrawn, with a pointer to
  what replaced it. Nothing is deleted: the record of what was asked and when is kept, as PINTAR keeps its own.
- **A prompt or review that has been overtaken is not acted on.** If two instructions disagree, the later one by its
  author wins; if the authors differ, ask before building.
- **The same on each party's own documents:** the engineer's completion page, Sharon's reviews and Daisy's reviews
  each say, at the top, what currently holds.

## Relay rules (after the 38-character SHA and the unreadable prompt file)

- A commit is always given as 40 characters, copied from `git rev-parse`.
- A review instruction is either in this file or pasted in full. A file on a branch the recipient cannot read is not
  an instruction.

## Log

| When (UTC) | Issued |
|---|---|
| 11 Nov 2026, 23:58 | First issue: B1 close record; L-1 additions; F-1; S-1; B2 opening rule; reviewers' checks |
| 12 Nov 2026, 00:10 | L-1: the indistinguishable answer is per method (Second Eye, Sharon). Daisy's L-1 checks: `ux-1/daisy-experience` `f6bc7aa1d50c9a8179fecd4044a7a631bb57f937` |
| 12 Nov 2026, 00:15 | L-1, Second Eye: state on the page that the platform admin's reader also shows the ordinary mismatch for suspended or closed attempts, by intent (Sharon). Reconciliation of the brief §5 confirmed by Sharon |
| 12 Nov 2026, 01:45 | L-1 candidate `2ea60c85e4f855eca2175749c4270a170922ee33`. Sharon: also rule on the engineer's question (a pre-suspension recovery grant used after it) and see the two consequences in `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6a. Daisy: same commit |
| 12 Nov 2026 | L-1 with Sharon (prompt issued by the engineer; she should also read `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6a at this commit of the planning branch). Daisy: one visit on the F-1 commit covering F-1's teacher screen and her L-1 confirmation. F-1 built locally at `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` |
| 12 Nov 2026 | Second Eye: L-1's one blocker, `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6b (two permit checks, three red-first tests, one bounded search, the PIN-ladder note on the page). Do not disturb F-1's pre-flight; the fix is a new commit after F-1's. B2 still waits for Sharon's PASS on both |
| 12 Nov 2026 | Second Eye: `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6c. The two checks at use are required; ending grants in `akun_kunci` is optional. State on the page the PIN-ladder consequence and the two reinstatement cases. Register L1-R1 (showing "PIN reset required" at reinstatement) is not in L-1 |
| 12 Nov 2026 | All: the rule on keeping instructions current (above). L-1's current statement is `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §0 |
| 12 Nov 2026 | State table corrected (Daisy noticed it was stale): F-1 is pushed at `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`. Sharon: `C1W-F1-CORRECTION.md` §9a, two points to rule explicitly (rows 5a and 5b). Daisy: the one added line, and the L-1 confirmation |
| 12 Nov 2026 | L-1 fix local at `916d12c01345816afcf567b40131e72b9857cf65`. Finding L1-F2 recorded (`AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6d): not in L-1; Sharon to give her view on the choice at the recheck; decision is the owner's |
| 12 Nov 2026 | Sharon: pre-implementation review of `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §2 (place of the lock, no authentication window, reinstatement) and her view on §5 (closed person). Second Eye: nothing to build yet; report what happens today for §5 when convenient |
| 12 Nov 2026 | Second Eye: L1-F2 is released, `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §0 and §2a (one trigger on `public.accounts`; `FOR SHARE` on the person first; a guard on `banned_until`; six tests). Also report what happens today for a closed and an anonymised person (§5, §5a). After the L-1 fix; not before B2 if B2 is ready first |
| 12 Nov 2026 | Second Eye: `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §5b. Build the lock trigger as released. Before touching messages or matching, report the three items at the end of §5b (which paths send a message and what the school sees; what an institutional number can match after anonymisation; one test each of today's behaviour) |
| 12 Nov 2026 | Second Eye: P-1 needs only its guarding test, taken with the lock trigger. L1-F4 is with the owner; build nothing for it; the three tests of today's behaviour are still wanted, as evidence |
| 12 Nov 2026 | Sharon: pre-implementation review of `ANONYMISED-PERSON-IS-TERMINAL.md` §2 and §3 (four points from the owner). Second Eye: nothing to build for it yet; P-1's guarding test goes with the lock trigger |
| 12 Nov 2026 | Second Eye: L1-F4 released, `ANONYMISED-PERSON-IS-TERMINAL.md` §0 and §3a. Order of the small corrections after the L-1 fix is yours; none gates B2. Daisy: wording for the platform admin's refusal when a deletion meets a live attachment (one line, when the engineer asks) |
| 12 Nov 2026 | Second Eye: L1-F4's certificate case is decided (`ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 6 and §3b): earned but not issued, recorded on the review; no certificate row. Daisy: if the review screen shows this state, its wording is yours |
| 12 Nov 2026 | Second Eye: Daisy's wording is in `ANONYMISED-PERSON-IS-TERMINAL.md` §3c. Use the refusal line as final; use the review line as draft and send Daisy a screenshot or the commit for her one-reply confirmation. State on the page the holding state (an open deletion request with a live attachment) |
| 12 Nov 2026 | F-1 with both reviewers. Sharon: also rule explicitly on row 5a (`item.correctness_rate`, Question Health), `C1W-F1-CORRECTION.md` §9a and §9b. Daisy: in the same visit, see what a corrected question shows where a rationale is displayed (F1-R1, §9b) |
| 12 Nov 2026 | Second Eye: F-1's one blocker, `C1W-F1-CORRECTION.md` §0 items 1 and 2 (null rationale in `session_review` where correctness changed; three tests and a plant). A new commit, after the L-1 fix or before it as the working tree allows; each is rechecked alone. Daisy: say whether the learner's review should explain the missing rationale, and give the wording if so |

> **Correction to this log (12 Nov 2026, 03:45 UTC, read from the clock).** Entries dated 12 Nov after 01:45 UTC carried times that were estimated, not read from a clock, and several were later than the actual time. Those times have been removed. The order of the entries is correct.
| 12 Nov 2026 (03:50 UTC) | Sharon: pre-implementation review of `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §2 and §3 (row 1 is the owner's question). Daisy: the wording of its §6; and, for F-1's fix, open the per-question disclosure on the learner's result for a corrected sitting. Second Eye: nothing to build for it yet |
| 12 Nov 2026 (03:53 UTC) | Second Eye: F1-R1b released, `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §0 and §3a; after F-1's fix. Daisy: its §6, where line 3 is now required: "no recorded misconception" wherever a misconception figure or list is empty or thin, and the marker's wording |
| 12 Nov 2026 (05:44 UTC) | State table brought up to date from the work branch (head `bc67f72a0e1c6bc39a2c16292f728080b12710d4`). Second Eye: CI needed a second attempt on two commits today; if the cause is again the runner failing to start its database, say so, and treat a third as a defect of the workflow to fix at its cause, not to re-run |
| 12 Nov 2026 (05:47 UTC) | Second Eye: your INV-03 question is answered in `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3b: it is the owner's decision; keep F1-R1b held. A question for a ruling goes to the owner in full, by name, so it is not missed |
| 12 Nov 2026 (05:49 UTC) | Sharon: `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3c (four points). Second Eye: F1-R1b stays unbuilt until her verification; L1-F4's race test on two connections is required before acceptance (`ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 8) |
| 12 Nov 2026 (05:54 UTC) | Second Eye: F1-R1b released, `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3d (CHECK plus trigger; digest untouched; copy paths with a lineage link; baseline marker first, manifest, ADR in one commit). State how an option is tied to the option it was copied from |
| 12 Nov 2026 (05:56 UTC) | Second Eye: document authority is verified (`C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3e): amend INV-03 in the repository by §3d point 4; the new ADR takes the next number after 0024 and cites ADR-0019. No external copy is to be waited for |
| 12 Nov 2026 (06:03 UTC) | F-1 fix is green. Consolidated status written: `STATUS-2026-11-12.md` |
| 12 Nov 2026 (06:06 UTC) | Second Eye, Sharon: B2's learner own-results print is decided by the owner: the content rule (`B2-ARCHITECT-NOTES.md` §0 item 3 and §1). The transferred learner is the named case of the second test |
| 12 Nov 2026 (06:33 UTC) | F-1 PASS. B2 now waits on two things, both Sharon's: the L-1 fix recheck (`916d12c01345816afcf567b40131e72b9857cf65`) and the pre-build review of B2's page (work-branch head `b21bec621a449e8d4d90ed646f7fb09c15dfc6f9`) |
| 12 Nov 2026 (06:44 UTC) | **B2 is open.** Second Eye: carry Sharon's five changes onto B2's page (`B2-ARCHITECT-NOTES.md` §3), then build B2 under THE PLAN §5.2 with the full pre-flight; the order of B2 against F1-R1b, L1-F2 and L1-F4's race test is yours, but B2 is the batch and should not wait behind them. L1-F2 takes L1-R2. Daisy: the default print line that names no person (Sharon's ruling, item 5), with or without the time; and your B2 design input for the register R1 to R5 and the completeness notice. Sharon: one result review of B2 on its exact commit |
