# Audit 79 · the plan of record to closure (Bob, 24 Nov 2026; ruling 99)

**Authority:** ruling 99. The owner is away, and the team works independently.

**Boundaries, unchanged:**
- No merge, staging promotion or production deployment without the owner.
- No Part II, and no 4.5.
- No silent deferral, reduced coverage or premature completion.

**Escalate only:** a material decision, a critical discovery, a genuine blocker, or an action needing the owner's authorisation. Everything else Bob decides and records here.

## 1 · Workstreams

| # | Stream | Who | Ends at |
|---|---|---|---|
| W1 | **The journeys:** J9, J11 and J12 walked; every outstanding branch, plus SR, throttled and reduced-motion, captured for all twelve | Daisy (walks and judges); the audit builder (captures, committed per run to `claude/audit-79-world` under `audit/79/tangkapan/`) | Every journey's TEMUAN file complete, with no «left for the builder» line still open |
| W2 | **Classification:** every finding has an L-id, dimension, severity, cause and disposition | Bob (ledger), Daisy (severity), Sharon (anything touching access, privacy, integrity or disclosure) | The ledger has no unclassified row |
| W3 | **The common-cause analysis, final** | Bob, reviewed by Sharon, Daisy and Second Eye | `AUDIT-79-COMMON-CAUSES.md` marked FINAL after J12 |
| W4 | **CI-1** (L-67), to its spec and Sharon's amendments | Second Eye builds; Sharon verifies | Frozen, PR open, CI green in one attempt, Sharon PASS. **Merge and staging 309→310 wait for the owner** |
| W4b | **CI-1b** (L-105, HIGH; the printed copy follows the validity state): app and print stylesheet only; stacked on CI-2's frozen head. **Daisy's words: `CI1B-KATA.md` (`cfc65eb6`).** DICABUT/DIGANTIKAN print a notice page, not a mark (a mark can be cropped or photocopied away), with no name and no new number, matching the public check. DITINJAU prints one line above the certificate. **One rule (Daisy; Sharon CONFIRMED): «Periksa keaslian» with BOTH the QR and the short link text always prints, in all four states and on the notice.** Sharon: on main the printable sheet already renders both (`KartuSertifikat.tsx:166-168`, D-160), so **CI-1b first establishes, from the rendered PDFs, why the page's browser print shows neither** (the sheet isn't printed, or the print CSS hides `.pin-s-qr`/`.pin-s-tautan`), and makes EVERY print path carry both. Printing the token is acceptable for privacy and is the approved design: the token never opens the name. L-105 stays HIGH (Sharon; the action and gate are identical either way). Sharon verifies | Second Eye, after CI-2 | Frozen, PR, CI green, Sharon PASS; **merge waits for the owner** |
| W5 | **CI-2** (L-78, PR-22), to its spec and Sharon's amendments | Second Eye builds, after CI-1 freezes; Sharon verifies | As W4, with its own promotion → 311, **waiting for the owner** |
| W6 | **AR-79, the consolidated correction:** one revision resolving causes C-1 to C-10 and every confirmed finding within scope | The plan by Bob; pre-build review by Sharon and Daisy; Second Eye builds (after CI-2); the audit builder writes the cross-surface journey assertions | Frozen, PR open, CI and journeys green in one attempt; Sharon and Daisy verify; every finding re-walked. **Merge and promotion wait for the owner** |
| W7 | **The closure report** | Bob | `docs/post-4.1/AUDIT-79-CLOSURE-REPORT.md`, the seven sections ruling 99 names |

## 2 · Sequencing decisions (Bob, routine)

- **Branch stacking:**
  - **CI-1:** `claude/ci-1` from main `429b7dcc`, migration 310.
  - **CI-2:** `claude/ci-2` from **CI-1's frozen head**, migration 311. CI-2 doesn't touch CI-1's functions, but stacking keeps the migration order and the AFTER reads honest.
  - **AR-79:** `claude/ar-79` from **CI-2's frozen head**, migrations 312 onwards. AR-79 touches certificate screens (C-3) that read CI-1's helper.
  - **The PRs merge in that order**, each under its own owner authorisation, each with its own step 0 / BEFORE / AFTER. If the owner wants a different order, only the bases change.
  - **Sharon's safeguard:** CI-2 is the production blocker (PR-22). It stays **free of any dependency on CI-1's code**, so that if CI-1 is held at review or acceptance, CI-2 can be rebased onto main and go first (ruling 98: «in the order their freezes land»). Each stacked PR's preservation pair is taken against its predecessor's AFTER, and Sharon's verifications follow the same chain.
- **AR-79's scope** is every confirmed finding whose fix is a correction of existing behaviour: wording, layout, consistency, a missing state on a sibling screen, a prerequisite read, the result in force. **Excluded, and named in the closure report with the reason:**
  - (a) findings already placed in 4.5 by ruling (L-26 to L-30, L-35's 4.5 parts);
  - (b) anything that is a new feature or a policy change (ruling 79's scope), such as bulk class entry (L-91), if judged a feature;
  - (c) world-data gaps, which are fixed in the world, not the product.
  Each excluded row says why. **Nothing is silently deferred.**
- **AR-79's design rules** (rulings 95–98; the master sequence §2c):
  - one authority per state;
  - cross-surface assertions;
  - the database-owned «may do / why not» reads, with the action still deciding at press time;
  - no unsupported promise;
  - confidentiality throughout;
  - no new framework.
- **Verification discipline (ruling 93):**
  - focused tests during development;
  - the full pre-flight and the freeze check before any push;
  - one frozen candidate per PR;
  - no speculative reruns.

## 3 · Status (23:50Z)

| Stream | State |
|---|---|
| W1 | **Every journey walked locally by Daisy.** **ALL TWELVE captured and judged** (J12 `f506df5d`, J1 `8bf4a85a`). The PIN-reload probe holds. Every builder line is closed |
| W2 | **DONE** (Daisy `e0958ce7`, reconciled by Bob). L-1 to L-151. Critical: L-67 (closed by CI-1). High: L-78 (CI-2), L-105 (CI-1b), L-112 (AR-79). L-149 withdrawn (Daisy reproduced a working staff path). L-152 new, Significant |
| W3 | **FINAL (25 Nov 00:50Z):** C-1 to C-12; every finding L-1 to L-160 caused or stated "none" |
| W4 | **CI-1 CLOSED ON STAGING (ruling 101, 22:50Z):** merged `93b93134` (tree = `94ce6727`), staging 310, only line 10 moved, V6 met, **Sharon FINAL PASS**. Main's ci is red on the known R1 clock bug, so PR-25 holds any production promotion until main is green. L-105 open under CI-1b |
| W4b | CI-1b specified, words cleared; after CI-2 |
| W5 | **CI-2 RE-FROZEN at `25681b11`** (V-1, V-2, Z-S12-01); Sharon PASS on the delta's code; ci 45509971723 and journeys 45509965430 running (API 23:48Z); then the owner (update-branch at merge) |
| W6 | After W3 FINAL |
| H-1 | **FROZEN at `73fc4ab1` (21:26Z; a README-only delta from `5ab2af9a`, naming the test-only uji-* steps)**: red on main's heartbeat (VOID), green with the fix (4 RESET beats); grace 0 → INFRA (the bound holds); a database stopped with no reset → INFRA (the control). In real use: CI-2's redcase at the default heartbeat, 23 resets, no false INFRA. Harness only (2 files). The uji-* steps are kept as the regression test (inert without PREFLIGHT_UJI=1). PR #32: ci 45492159358 **FAILURE** (API, 21:50Z). The cause is NOT H-1's: R1-K01's control is red before any defect (the pre-existing school-clock bug; job log read by Bob), and selftest was skipped as a consequence. **Decision (a):** port CI-2's test-only fix `6aceed28` into H-1 as one commit. **Re-frozen at `7716f228` (22:14Z):** red 46/1 at `73fc4ab1`, green 47/0 ported, with lines identical to `6aceed28`. Pushed at `7716f228`; PR #32 ci 45499450461 is running (its first selftest run in CI). |

## 3a · Harness H-1, recurring (Bob, 14:07Z)

H-1 (the pre-flight heartbeat reads the red-case step's own `supabase db reset` as a dead database) has now voided CI-1's red-case step, as it voided D2-R's twice. **For CI-1:** the red-case step alone is rerun on the same commit with `PREFLIGHT_DENYUT=3600` (the D2-R precedent), and the freeze check names it. **Decision:** H-1 is fixed before AR-79's pre-flight, not after it. AR-79 is the largest candidate, and every VOID costs a run. It's a separate, harness-only change in `scripts/dev/`, with its own small PR, and it touches no product.

## 3b · Test-clock and test-order lessons (24 Nov, recorded for the closure report)

- **C1W-S06 (CI-1):** a test picked data by position, and the paper order is random. It passed locally and failed in CI.
- **SERTIFIKAT-A01, L1F4-K05, F22-K01/K03/K06, PENUGASAN-A01:** each passes only after other suites have created its data.
- **R1-K01 (main):** a test passed UTC `current_date` to a function that reads the school's clock, so it fails every evening (16:00–24:00Z). Fixed in CI-2's own commit, with its sibling uses swept. **Main still carries it:** any PR branched from main and run in that window goes red (H-1's PR #32, 21:47Z). The fix is ported into H-1, and it's a no-op once CI-2 lands.

- **Z-S12-01 (main, found on CI-2's `8678de21`):** two tests post to the paced reopening route from addresses drawn at random from the same 250. With about 2-in-250 odds per run, Z-S12-01 draws AKUN-A02's address inside the 60 s window and is paced. That's test isolation, not a flake: proven by matching the pepper-hashed pace keys. **Fix:** a fixed TEST-NET address per paced-route test, a sweep of every test on a paced route, and a plant. It rides CI-2 as its own test-only commit.

**Lesson:** a passing run is evidence only for the order, time and data it ran with. Tests must be independent of order, position and wall-clock time, or must pin them.

## 3d · Verification lesson (24 Nov 21:37Z)

Sharon's CI-2 verdict (21:22Z) reported both runs «green in attempt 1». The API shows both were still running (dispatched at 21:13Z). Bob relayed it to the owner unchecked. Second Eye's API read at 21:32Z caught it.
- **The real cause (Sharon, 21:40Z):** she had not read either run. Her record had it as a condition («conditional on … being green»), but her message phrased it as a claim. So this was a wording error that turned a condition into a fact, not a misread.
- **Fix:** a run result is quoted only from the API's `conclusion`, with the time read, never from another session's summary. Bob reads every run's conclusion himself before relaying it or calling anything green. Conditions are written as «required: … green», never in a form that reads as a result. Adopted by Sharon and Second Eye.
- This goes in the closure report's lessons, as an instance of ruling 99's «do not declare completion prematurely».

## 3c · Coordination lesson (24 Nov 17:50Z)

The audit builder sat idle from 15:22Z to 17:50Z after a report, waiting without a question pending; the machine had also restarted. **Fix: the standing rule that each stream goes straight on to its next item after a report**, and the 2-hourly driver checks every stream's last push. That cost 2.5 hours of capture time, and no quality.

## 4 · Pacing (owner, 24 Nov: usage isn't monitored overnight)

Bob paces the work. The usage allowance is shared by every session.
- **One heavy build at a time.** Second Eye's streams run in sequence, never in parallel. The builder's CI capture runs aren't stacked on top of Second Eye's full pre-flights.
- **No waste.** Use focused tests during development, a full verification only at the acceptance boundary (ruling 93), and no speculative reruns. Messages stay short.
- **If a session hits a usage limit, it stops cleanly.** It commits its work-in-progress notes (never a half-finished push to a PR), resumes after the reset from its own record, and never reports partial work as done.
- **Quality isn't traded for pace.** If the allowance runs short, the work takes longer; it doesn't get thinner.

## 5 · Owner decisions collected for the closure report (none blocks the work tonight)

| # | Decision | Needed before | Recommendation |
|---|---|---|---|
| OD-1 | **CI-2: a reinstated or reopened account signs in with a fresh credential** (a password reset; a new PIN from the school) | CI-2's merge | Accept (Sharon). **Sol, relayed by the owner (24 Nov): recommends approval.** Reinstatement restores authorised access; replacing the credential makes it resume securely; identity, history, results and certificates stay intact. Daisy makes recovery clear, so no one keeps trying a dead credential. **APPROVED by the owner (ruling 100):** fresh credentials are mandatory; previous credentials and sessions stay invalid; identity and records are preserved |
| OD-2 | Merge and staging promotion of CI-1, CI-2 and AR-79, in order, each with its own evidence | Each merge | — |
| OD-3 | **SD learner pages in «kamu»?** Daisy (L-158, J1-1): the tour and learner pages speak to a 9-year-old in an adult register («Anda»). She recommends «kamu» on SD learner pages | AR-79's words for SD learner pages (not blocking; AR-79 does the plain-word changes either way) | Daisy: yes. Bob: yes, scoped to SD learner-facing pages only, with one key set per register so the change stays a word-table change |


## CI-1b · 26 Nov
- **Frozen at `e8a35c3a`** (03:25Z), with Sharon's code PASS and Daisy's word PASS.
- **Journeys 45748680995: conclusion failure** (API, 03:55:34Z; PASS 81, FAIL 2). The freeze is **void**.
- **S21j:** a fixture breaks `key_corrections_independent`. The test is wrong, not the product.
- **B2J:** the Ringkasan's PDF lost its CTK reference. It passed on CI-2's journeys, and CI-1b's print CSS is the suspected cause, to be proven on main.
- Second Eye root-causes both, red first, and re-freezes. **The L-8 sweep is widened:** a print-stylesheet change has dependents beyond the certificate.
- **Re-freeze `145bd8dc`** (read 05:20Z):
  - ci 45755950858: **success** (05:06:58Z);
  - journeys 45755954130: **failure** (05:04:11Z), PASS 82, FAIL 1.
- B2J and S21j's fixture now pass. The one FAIL is an S21j sub-check: «DITINJAU printed in EN: «Periksa keaslian» is not printed».
- **Not yet a candidate.** Being root-caused: a hard-coded Indonesian expectation in the test, or a product defect in the EN sheet (Sharon classifies).
- **Candidate `5cd81f9d`** (05:40Z): `145bd8dc` plus the S21j EN heading fix, chosen by the certificate's language from hle.ts. Journey and evidence only; the product diff is empty.
  - Runs: ci 45763080807 and journeys 45763084276.
  - **A disclosure carried here, not in the branch** (Second Eye's words): «The run's own PDFs (artifact 15088389798 of journeys 45755954130) could not be read from this session: the artifact host is not allowed by its network. What stands in for them: the run's log, where salahCetak's link and QR checks run before the label check and the label was the only EN failure listed; and the local prints from main and CI-1b above.»
- **`5cd81f9d` green** (read 06:37Z):
  - ci 45763080807 attempt 2: **success** (06:25:47Z). It is the one infrastructure re-run, after attempt 1's port-54322 clash before any test body (CI-W54322, §9 of COMMON-CAUSES).
  - In attempt 2, the WP7 plants proved 14/14 and the BOB-01 plants 24/24, each red for its declared reason.
  - journeys 45763084276: **success** (06:12:11Z). Job B's TALLY is PASS 83; job A succeeded. The artifact is 15091868185.
- **PR [#33](https://github.com/yazidmanan2409/pintar40/pull/33) opened** against main `0c155a5c` (unmoved). The diff is 19 files, sha256 `e1f4c6c4…`, with no migration.
- **Sharon: CI-1b FINAL PASS at `5cd81f9d`** (06:43Z).
  - She read all 2,718 lines of the red-case job: WP7 14/14, BOB-01 24/24, BOB-35 5/5, BOB-26 8/8; no `##[error]`.
  - Her conditions:
    - a merge commit at exactly `5cd81f9d`, with the required check on that head;
    - update-branch only if main moves, with the diff proven;
    - main's ci read on the merge commit.
- **Second Eye confirmed** both runs (06:39Z).
- **Daisy: PASS** on the four prints (07:03Z).
  - The prints are local renders from `5cd81f9d` on `claude/ci-1b-evidence` `1f2689d4`. The CI artifact's download host is refused by the team's networks; that disclosure is in the branch's README.
  - Her one note, the check text under the review band, goes to AR-A. It is non-blocking.
- **The merge waits only for the owner's ruling.**
- **Ruling 104** (07:05Z): approved, subject to the PR's ci.
  - ci 45769584637 on `5cd81f9d`: **success** (07:15:19Z).
  - **PR #33 merged** at `b9ca98ef`, a merge commit with `expectedHeadSha` `5cd81f9d`. Its parents are `0c155a5c` and `5cd81f9d`, and its tree equals `5cd81f9d`'s.
  - Main's ci 45774017397 is in progress. **CI-1b closes when it concludes success.**
- **Agent Skills (after closure, under the 25 Nov conditions):**
  - `claude/eng-skills` was updated by merging main (`555fc14e`), with no rewrite. Its changed lines are identical to the reviewed `0c155a5c..f83c8d50`; only context moved.
  - [PR #34](https://github.com/yazidmanan2409/pintar40/pull/34) was opened.
- **CI-1b CLOSED (ruling 104): main's ci 45774017397 on `b9ca98ef` succeeded** (07:50:09Z). L-105 is closed on main.
  - There was no migration, so no staging step. Production is untouched, and PR-22 stays open as a production gate.
  - Daisy's check-text note is carried in AR-A.
- **Agent Skills ADOPTED.** All four owner conditions were met. ci 45774171563 on `555fc14e` succeeded (07:48:33Z), guard-scan and the db selftests included.
  - PR #34 merged at `2c96bdd2` (07:59Z). Main's ci on it is read from the API.
- ~~**Next: AR-79**, batch by batch, each by its own owner request, starting with AR-A then AR-B.~~ **Superseded by ruling 105 (08:10Z): the long-weekend pause.** AR-A did not start. Development resumes only on the owner's instruction, from the resumption record `docs/post-4.1/BOB-RESUME.md`.
  - The 08:01Z AR-A kickoff was stopped at 08:11Z.
  - Daisy's AR-A words were committed before the stop and kept for resumption: `ux-1/daisy-experience` `44b09b05`, unreviewed.
  - The driver `trig_01WheS53MVmTRwbKs3itPKNQ` is disabled.
- **Main's ci 45779343510 on `2c96bdd2`: FAILURE** (read 08:41Z).
  - The only failure, A1-S08, is a race with the live pg_cron job (COMMON-CAUSES §9); it is pre-existing and test-only.
  - The Agent Skills phase is **not** declared closed, and the pre-break checkpoint is **not** clean.
  - Escalated to the owner for a decision.
- **Ruling 106: the A1-S08 race was fixed before the pause.**
  - PR #35 (test-only): the live job is paused for the scenario, and a run during it is detected.
  - Red first locally: the original test failed with CI's symptom; the fix ran 10 of 10 clean under every-second forcing; the new check was seen red.
  - Sharon PASS at `c3824c3a`. PR ci 45792146106: success. Merged at `a72203d8`.
  - **Main's ci 45798622469 on `a72203d8`: success (10:49:02Z).** The Agent Skills implementation phase is CLOSED.
  - **CHECKPOINT CLEAN. The long-weekend pause began at 10:51Z** (rulings 105 and 106). It resumes only on the owner's instruction, from `BOB-RESUME.md`.
