# Coordinator brief (saved 25 Sep 2026, ~02:30 UTC, at the pause)

This is the coordinator's working state, so a new session can pick up without the old conversation. BOARD.md (the PAUSED note and the ticket rows), DECISIONS.md and RELEASE-CHECKLIST.md stay the source of truth; this brief says how the coordinator works with them.

## Update: paused 28 Sep, ~08:40 UTC (Yazid: resume tomorrow)

**Gate PINTAR is at (D-052): working toward ENGINEERING COMPLETE.** 5 Oct is tentative only. Every readiness report names the gate.

**Since the 27 Sep pause:**
- **Staging journey (D-050 scope)** built and run (`staging-journey.yml`, `audit/staging/journey.mjs`, report `staging/2026-09-28-staging-journey.md`). Runs 6–8 and 11 are the evidence.
  - Proven on staging: setup, intake, cards, upload, two-person publish, assign, card sign-in, pre-test, post-test, results equal to the planned answers, Bank Soal scoping, Uji Cepat.
  - Class figures are NOT PROVEN: synthetic evidence is never official (by design).
- **D-051 Lana** (content lane, brief `briefs/LANA.md`, branch `claude/adoring-feynman-njmjll`). **LANA-01 (Bab 1) GATE PASS** on `69398c9`, merged; staging run 11 proves her answer key end to end. **LANA-02 (Bab 2) open**; Yazid gave her the Bab 1 and Bab 2 PDFs. After each chapter passes, tell Yazid to send the next PDF.
- **D-052** (readiness is a sequence of gates) recorded; board, report, tester form and pilot brief follow it.
- **BOB-22 GATE PASS** on `190a955` (code `d43043a`), merged: a saved lesson position is the count of pages reached.
  - CI #217 26/26, reused for the merge (D-043).
  - Audit #35: B 27 PASS, 1 NOTE; A as #34.
  - No data patched: production has 0 `lesson_progress` rows (read-only count); staging rows are test data (D-050).
- **BOB-23 (board, next for Bob before BOB-12): the lesson player saves in a loop.**
  - About 20 saves a second, 9 Supabase calls each, while any lesson is open (D-031 hot path).
  - Found at BOB-22's gate and measured by Bob; it predates BOB-22.
  - Also in production's release `5b5b68d`, but not met there (no rows).
  - Acceptance includes the staging journey's J09 idle-request measurement.

**Relayed through Yazid (the pastes are in the 28 Sep conversation):**
- Lana's LANA-01 verdict.
- Bob's BOB-22 verdict and the BOB-23 ticket.
- Bob's "no data patch" answer (he has already acted on it).

**Staging leftovers (synthetic, labelled; C-07 reset still to do):**
- Kelas Uji Kinerja A holds about 50 synthetic students from the runs, several open Bab 1 assignments, and run 8's open Uji Cepat.
- These leftovers are why J14 shows the Uji Cepat and why Q3–Q5 are skipped.
- The harness opens each run's own assignment by its link (from the panel or its card).

**Open for Yazid:**
- How misconception codes get registered (or declare them out of scope).
- Whether educator testers author lessons.
- How class figures get proven with official evidence.
- The mail path at the pilot stage (Supabase's email rate limit on staging is 2/hour; Namecheap Stellar allows 50/hour, shared with production). **Decided (D-053):** Stellar Business (10,000 per hour per domain) before external educator testing; PINTAR is not designed around 50/hour; Supabase Auth's `rate_limit_email_sent` is set separately before testing. Nothing changes now.

**Next for the coordinator:**
1. Gate BOB-23 when handed off: the hand-off's browser measurement, CI, one audit, merge, then staging J09.
2. Gate LANA-02 when handed off: her three checks on her commit, then `staging-journey.yml` with `content_ref` = her sha and `chapter` = `SD5-Matematika-Bab2`, a read of a sample, then merge.
3. Daisy: the reader walk against `ux/UX-POLISH-REGISTER.md` (UX-01…06), for the UI/UX POLISHED gate.
4. Task 45 (perf seed through the intake path) and the C-07 staging reset. The tester package waits for the EDUCATOR PILOT gate.

**Staging run 12 (BOB-22 acceptance, 36395986289, main `b1c55a1`): ACCEPTED.** J09 every lesson saved in full and read; J10 the post-test linked from the home, the assignment page and the last lesson; J11–J13 by clicking, results equal to the plan. Tally 15 PASS, 2 NOTE, 1 FAIL (J14), 2 BLOCKED (Q4, Q5), 1 NOT RUN (Q6); J14 and Q3–Q5 are the class's leftover Uji Cepat (C-07). J09's idle measurement shows BOB-23 on staging: 9 saves and about 40 page fetches in 8 s. **Checklist re-marked on `1f3b0f1`: 60 of 84 P0 PASS, 17 PARTIAL, 1 FAIL (U-PERF: BOB-23), 6 N-T; NO-GO.**

## Update: paused again 27 Sep, ~12:05 UTC (weekly usage at 94%, resets in about 9 h)

**Since the 25 Sep pause:**
- **Integration 10** is merged (main `2adce88`): DAISY-07, DAISY-15, the wording of BOB-07's messages, BOB-08.
  - CI #199 26/26; audit #27 26 PASS, 1 NOTE, 1 FAIL (S8).
  - Staging has 118 migrations.
- **D-052 (supersedes D-045's date):** readiness is a sequence of gates (Engineering complete → UI/UX polished → Yazid → Gladys → educator pilot of 20–30); 5 Oct is tentative. Earlier: D-045, testers start 5 Oct. The report form is ready but not yet shared (`TESTER-REPORT-FORM.md`).
- **GS-1** is fixed (Yazid's Google Sheets round trip). Checklist v2.1: 47 of 84 P0 PASS.
- **U-PERF (D-046)** is a must-pass gate. The evidence is in `perf/2026-09-27-staging-latency.md`.
  - **BOB-18 goes first for Bob;** **DAISY-17 first for Daisy.**
  - **BOB-18(a) is done:** both Vercel projects are on `sin1`, verified as deployed on staging (`x-vercel-id` reads `sfo1::sin1`; Supabase time per call is 21.5 ms against 277 ms before). Production switches only at its next release.

**U-PERF tooling, on main:**
- `perf-staging.yml` has two read-only modes:
  - `probe`: the deployed region and the time to first byte;
  - `region`: Vercel's configured regions, read from its API.
- A write mode that would set the region through the API was refused as a production change and is not in the repo.
- `staging-perf-seed.yml` is idempotent.

**Synthetic test data (D-046(c)), on staging only:**
- **The school:** "Sekolah Uji Kinerja (sintetis)" (`uji-kinerja`), made by operator SQL and audited.
- **The admin:** *Uji Kinerja Admin (sintetis)*, account `uji-kinerja-admin@example.co`. The address has a typo for example.com. Gladys created the person and made them Admin sekolah; the grant is recorded twice, from a double submit.
- **The teacher:** *Uji Kinerja Guru (sintetis)*, account `uji-kinerja-guru@example.com`, Guru at Kelas Uji Kinerja A. Both the structure and this grant were made by the synthetic admin through PINTAR's own functions.
- **Cleanup:** deactivate the school and both accounts after U-PERF (C-07 reset).

**Next for the coordinator:**
1. Build the U-PERF journeys on the synthetic accounts: sign-in, clicks and representative saves, with per-click timings and Supabase request counts.
2. Take the single-session baseline on today's code.
3. After BOB-18 and DAISY-17: the same run again, then the 30-session, 10-minute concurrency run.
4. Gate BOB-18 and DAISY-17 together in one integration if both are ready.

## Role

- **Coordinator, gatekeeper and release authority** for PINTAR 4.0. "Yazid authorizes. Machine executes. Machine verifies. Yazid receives READY or FAILED."
- **Lanes:**
  - Bob (back end): `claude/quirky-meitner-a04smj`.
  - Daisy (front end): `ux-1/daisy-experience`.
  - Coordinator: `claude/awesome-rubin-bqxp6p`.
  - Yazid relays messages between the lanes and the coordinator.
- **Hand-offs:** a lane hands off a head commit with its own CI run (dispatched once by the lane). The coordinator integrates the hand-offs into `main` through a gate branch.

## State at the pause

- **`main` = `7d9ed63`:** Integration 9 (`1e46714`: DAISY-14, BOB-07, BOB-16) plus the `[skip ci]` board and checklist commit.
  - Gate evidence: CI #196 26/26; audit #26 (run 36084953370) 26 PASS, 1 NOTE, 1 FAIL (S8, the intake trap BOB-10 fixes).
- **Production release:** `5b5b68d`, with 111 migrations (see RELEASES.md). Untouched.
- **Staging** (`https://staging.pintarselalu.com`): 117 migrations, the same as `main`. Integration 9 added none. SD 5 Bab 1 is imported whole.
- **Release checklist v2.1:** the Now column is on `1e46714`; 42 of 83 P0 checks pass; NO-GO. The verdict and its owners are in RELEASE-CHECKLIST.md.
- **Lanes:**
  - Bob is paused after BOB-07 and BOB-16.
  - Daisy is paused with DAISY-07's fix pushed (`a1c0d97`, no CI yet) and DAISY-15 done on her lane (`4923592`).
  - The resume order for everyone is in BOARD.md's PAUSED note.

## Standing rulings

- **D-043, CI conservation:**
  - Check locally first.
  - Never rerun green work without a reason.
  - Target the change, and use one integration run for compatible hand-offs.
  - Run full CI at real gates.
  - Diagnose every failure before any rerun; "flake" is not a cause.
  - Use `[skip ci]` only when it is safe, never to skip a gate.
  - Make staging operations idempotent.
  - Report the runs triggered and the runs avoided.
- **D-044:**
  - `SUPABASE_AUTH_FORWARDING_KEY` stays as named; the wider naming question waits until the known bugs are fixed.
  - Keep the board order.
  - Keep fixing known bugs and blockers.
  - No new product design unless a real blocker needs Yazid's ruling.
- **Queue:**
  - Bob: BOB-08, 09, 10, 11, then BOB-17 with DAISY-16, then BOB-12 with DAISY-13, then BOB-15 with DAISY-12 (before 1 Nov), then BOB-13 (before L2, 1 Dec).
  - Daisy: merge main, one CI for DAISY-07 and DAISY-15, then both hand-offs.

## Security rules (never relaxed)

- **Secrets:** never print or expose a secret. Mask it, and check a secret by its presence, shape or hash.
- **Gladys's email:** never print it. Match it by its SHA-256 digest, `52e5bbccb4be604c12b16dd38de06b0e1aa53f08d44f9356bb0759e0e47dd2a4`.
- **Refusals:** never route around an egress-proxy 403 or a classifier denial. Stop and report the options to Yazid.
- **Destructive operations:** no destructive git operations on anyone else's branch. Never create test data in production. Never reuse production secrets outside production. Never ask for or accept Yazid's Supabase password.
- **D-039:** do not create another Supabase organization, Vercel team, mailbox or environment. Do not move staging, and do not delete the Sep 11 `pintar` project. Do not change production or DNS without Yazid's approval.

## How a gate runs

1. **Build the gate branch** in a worktree of `main`: `gate/integration-N` = `main` + the lanes' hand-off commits (merge or cherry-pick; resolve the manifest version).
2. **Check it locally:** `npx tsc --noEmit`, eslint, and the targeted selftests for the tickets. A local Supabase stack cannot start here (the proxy blocks the ghcr images), so SQL is checked against Postgres 16 stubs.
3. **Dispatch one CI run and one audit run:**
   - CI: `ci.yml` via `workflow_dispatch` on `gate/integration-N`.
   - Audit: `audit-journeys.yml` dispatched **from the coordinator lane** (the up-to-date harness lives there, not on `main`), with input `ref` set to the **full commit sha** of the gate.
4. **Read the audit from job B's log** ("Gladys's path from an empty production-like database"): its `TALLY` line and each step's line. Job conclusions stay green even when steps fail.
5. **If both are green, merge:**
   - Fast-forward `main` to the gate.
   - Put the board and checklist commit on top with `[skip ci]`, and push both together. The newest commit carries `[skip ci]`, so `main` does not run CI again; CI would otherwise run on push to `main`, except for paths under `docs/coordination/**` and the other excluded docs folders.
   - Then merge `main` into the coordinator lane. For coordination files, `main`'s copy wins.
6. **If the gate carries migrations,** dispatch `staging.yml` ("staging · database and sign-in"). Lesson imports go through `staging-import-lesson.yml` (`replace_unreleased` defaults to false).

### Audit harness notes (`audit/journey.mjs`, on the coordinator lane)

- **Steps:** S1 to S19 are Gladys's path, from sign-in through the school's set-up and a lesson upload to the student's pre-test. S17 takes the real SD 5 Bab 1 to Terbit with two people, S18 has the teacher assign it (and checks the assignment window in Jakarta time), and S19 has the student reach the pre-test. P1 to P3 are the public probes.
- **The known FAIL:** S8 fails until BOB-10 lands.
- **Batch ids:** since BOB-07, redirects carry codes only (no `detail=`), so the harness reads new ingest batches from the database (`e1e89c7`).
- **Locators:** wait for headings by role, never by text. Next.js's route announcer copies the h1 into an aria-live alert, so a text locator can match two elements, which Playwright's strict mode rejects (`547e936`).

### Release checklist

- **Edit** `docs/coordination/checklist/checklist_data.py` only. The Now values are set in the block that sits before `as_dict()`.
- **Render:**
  - Markdown: `python3 docs/coordination/checklist/render_md.py`.
  - Word:
    - `python3 docs/coordination/checklist/checklist_data.py > ckl.json`
    - `DOCX_MODULES=<a dir where npm install docx was run> node docs/coordination/checklist/render_docx.mjs ckl.json docs/coordination/PINTAR-4.0-Release-Checklist-v2.1.docx`
  - Afterwards run `git checkout -- '*.pyc'`, because the tracked `__pycache__` changes on every render.
- **No LibreOffice here:** check the docx with `unzip -t` and by grepping `word/document.xml`.

## Deferred (not started)

- **Coordinator:**
  - Extend the audit to answer the pre-test and post-test (the checklist rows marked N-T).
  - Set the hosted Auth idle backstop to 168h on staging (read the setting's units first); production at release.
  - The staging reset script (C-07).
- **Yazid:**
  - REL-08 and REL-09.
  - After DAISY-15 merges, one Google Sheets round trip on the new template: type 78.145 and 007 into "Teks pilihan", download it, and upload it here.
- **Older items:** decisions A and C, token revocations, the remaining secret renames, GitHub Environments isolation, the `VERCEL_TOKEN` split, and a teacher's review of the Bab 1 transcripts and infographic.
