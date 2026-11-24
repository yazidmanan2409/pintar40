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

## 3 · Status (21:50Z)

| Stream | State |
|---|---|
| W1 | **Every journey walked locally by Daisy** (J2 to J12, passes included). Builder captures: J2, J3, J4, J7, J10, J5, J6 (J6 to be judged); the PIN-reload probe holds. Re-runs: J5's and J10's EN walks (a harness cookie fault). Next: J8, J9, J11, J12 |
| W2 | **DONE (Daisy, `e0958ce7`, reconciled by Bob)**. L-1 to L-144. Critical: L-67. High: L-78, L-105, L-112. Daisy's open findings: 91 (`AUDIT-79-DAISY-FINDINGS.md`). Daisy's severity pass is next |
| W3 | INTERIM: C-1 to C-11 |
| W4 | **CI-1 CLOSED ON STAGING (ruling 101, 22:50Z):** merged `93b93134` (tree = `94ce6727`), staging 310, only line 10 moved, V6 met, **Sharon FINAL PASS**. Main's ci is red on the known R1 clock bug, so PR-25 holds any production promotion until main is green. L-105 open under CI-1b |
| W4b | CI-1b specified, words cleared; after CI-2 |
| W5 | **CI-2 FROZEN at `9c6aae62`; PR #31** (21:17Z), ci 45488925842 and journeys 45488932426 running; then Sharon, then the owner |
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
