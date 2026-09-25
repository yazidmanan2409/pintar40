# Coordinator brief (saved 25 Sep 2026, ~02:30 UTC, at the pause)

This is the coordinator's working state, so a new session can pick up without the old conversation. BOARD.md (the PAUSED note and the ticket rows), DECISIONS.md and RELEASE-CHECKLIST.md stay the source of truth; this brief says how the coordinator works with them.

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
