# Daisy: resume note (1 Oct, team pause)

This note is for a fresh session picking up Daisy's lane. Read it first. Then read:

- `docs/coordination/BOARD.md`, `DECISIONS.md` and `briefs/DAISY.md`, from main, since the board moves there;
- the design constitution, `docs/coordination/design/PINTAR-DESIGN-SKILL-SPEC.md`;
- Terminology v1, `docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md`.

## Who, where, how

- **Who.** I am **Daisy**, the UX-1 front-end builder. The coordinator (another session) gates, merges and releases. Yazid relays messages and rules on product questions.
- **Lane.** `ux-1/daisy-experience` only, in `yazidmanan2409/pintar40`.
  - A fresh clone starts with `git fetch origin ux-1/daisy-experience && git switch ux-1/daisy-experience`.
  - Branch names in the old container (`gerbang-20`, `daisy-39`) do not matter. The remote lane is the truth.
- **Never:**
  - dispatch a production workflow, or touch a `.github/*-request.txt`;
  - rebase, force-push or `git reset --hard`. Merge instead; move work aside with `git switch -c` and `git cherry-pick`;
  - push anywhere but the lane, or open a PR;
  - commit `AGENTS.md` or `CLAUDE.md`. `next dev` writes them, and they stay untracked;
  - reopen the card or certificate designs (D-074, D-080);
  - put Yazid's reference image in the repository (D-082(b));
  - weaken, skip or delete a test. Restating one for a changed requirement is allowed, and it must be named in the hand-off.
- **Copy:**
  - every user-visible word lives in `src/lib/hle.ts`, in both languages (D-014);
  - never show raw server text: codes are read, and words are ours (D-011);
  - Terminology v1 (D-068).
- **CI:**
  - Pushes to the lane start no CI (D-025). The lane dispatches `ci.yml` itself, **once per hand-off**, on its head (`workflow_dispatch`, ref `ux-1/daisy-experience`).
  - Before that dispatch, run what CI's `check` runs:
    - `npm run lint`, which covers the **whole repo, `docs/` included** (CI #251 failed on a review harness under `docs/`);
    - `npm run typecheck`;
    - `npm run build`, with the CI env: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder`, `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3999`;
    - the static selftest.
- **Hand-off:**
  - The first line is `READY FOR GATE: CI #<n> (run <id>) green on <full sha>` for code, or `READY FOR REVIEW: <topic> on <sha>` for design only.
  - The file goes in `docs/coordination/handover/HANDOFF-DAISY-<n>.md`, committed `[skip ci]`.
- **Manifest:** on a `version` conflict, take the higher and add one; the ids are the union.

## State at pause (1 Oct)

The lane tip is `957e314`. From the top down:

| Commit | What | CI |
|---|---|---|
| `957e314` | **DAISY-39** (a cherry-pick of `fc1b2c2`), manifest v133 | **none yet**, and not part of any gate |
| `5a7fab7` | `HANDOFF-DAISY-20.md` `[skip ci]` | — |
| `713c7ec` | the proof README: «Two modules» → «Three» `[skip ci]` | — |
| **`59696ad`** | **the DAISY-20 gated head** | **CI #252 (run 36793651616): green, 35 of 35** |
| `08c6f72` | merge of Bob's `1246835` (BOB-26, BOB-50) and DAISY-20 wired to the real routes | #251 cancelled after its lint failure |

Under `59696ad` are main `28d3015`, DAISY-40 (`fcdf56f`) and D-082(b) (`c806b0c`, docs only).

**The pause (Yazid, 1 Oct):** nothing merges to main. After the pause, the coordinator gates main + `59696ad` (BOB-26, BOB-50, DAISY-20, DAISY-40) with one CI and one audit. The DAISY-20 hand-off was given, and its file is `docs/coordination/handover/HANDOFF-DAISY-20.md`.

## The queue on restart

1. **The joint gate's verdict on DAISY-20.** Fix any finding on the lane, then run one CI and hand off again. Bob's code is his: name any test of his you restate, as `HANDOFF-DAISY-20.md` does for BOB26-A01 and BOB26-S01.
2. **DAISY-39** (after BOB-50), on the lane as `957e314` with no CI. If main has moved by then, merge `origin/main` first. Then run one CI and hand off.
   - **Copy.** Three lines no longer say an Uji Cepat feeds certificate eligibility (D-082(d)): `mengajar.cepat.intro`, `mengajar.cepat.rv3` and `tur.pg.4.isi`, each in both languages. The board names them as hle 3170, 3189 and 2856.
   - **UX1-S3-CEPAT-01** is re-pointed and inverted. It reads QUICK's live `certifies` value through every migration after `20260914093000`, and fails if the copy claims eligibility while QUICK does not certify. It has a planted control. On the old copy it is red, naming six claims.
   - **Manifest:** v133, still 477 ids (the test is restated, not added).
3. **DAISY-38** (the school's pass-mark setting and its words) is on BOB-49's contract, after DAISY-20.
   - Not started; there is no contract yet.
   - Yazid's HOLD (`3f2aca6`) is on the pass mark, the predikat bands, «Perlu Pendampingan» and certificate eligibility. Check that DAISY-38 is clear of it before starting.
   - D-078 is amended: «Perlu Pendampingan» is descriptive only, and the bands are unchanged.
4. **The physical proof.** Yazid printed the PINTAR card and the certificate (1 Oct); his first word was «gorgeous».
   - His notes on the 0.75 mm gold line and the QR scan are still to come.
   - Then the designs freeze (D-074(12), D-080). Record that in `docs/coordination/ux/kartu-pintar/ronde-2/README.md` and `docs/coordination/ux/sertifikat/ronde-2/README.md` `[skip ci]`. Change no design unless he asks.
5. **Later, in board order:**
   - DAISY-21 to DAISY-23, each on its identity gate (BOB-27 to BOB-29);
   - DAISY-36, the certificate implemented, after BOB-48's build;
   - DAISY-37, the canonical email system, in the UI/UX POLISHED pass;
   - DAISY-24 (Gate 7);
   - the educator-as-learner tickets, DAISY-32 to DAISY-35, each on its Bob contract and never interrupting an identity-gate screen ticket.

## Open items owned by others

- **FOR BOB.** `GET /api/aktifkan/keadaan` has no `bacaJawaban*` reader in `src/lib/aktivasi-kontrak.ts`. `src/components/aktifkan/jawaban.ts` mirrors one (`bacaKeadaan`). Once Bob ships `bacaJawabanKeadaan`, drop the mirror.
- **The polish register.** Three shared controls are under PINTAR's 44 px, though they pass WCAG's 24 px: the language switch (26 px), and the admin `.pin-btn` and `.pin-input` (40 px).
- **D-082(b), Yazid's call.** The reference thumbnail is out of the tree, but it is still in the lane's history at `336b274` and `4d9ae61` (never on main). Removing it from history needs a rewrite, which my rules forbid.

## Where things are

**DAISY-20:**
- `src/app/aktifkan/page.tsx`, `src/app/akun/page.tsx`;
- `src/components/aktifkan/*`: `kontrak.ts` re-exports Bob's contract and adds only the paths; `jawaban.ts` reads each answer with the contract's reader;
- the identity emails, `src/components/email/identitas.ts`.

**Its tests:**
- `selftest/aktifkan.test.ts`;
- `selftest/email.test.ts`;
- `selftest/daisy40.test.ts`, for DAISY-40.

**The 320 px and accessibility proof** is `npx tsx docs/coordination/ux/aktifkan/buat-bukti.mts`: 64 checks. It needs:
- the global Playwright;
- `/opt/pw-browsers/chromium`;
- `axe-core` and `esbuild` from `node_modules`.

**Design rounds:** `docs/coordination/ux/kartu-pintar/ronde-2/` and `docs/coordination/ux/sertifikat/ronde-2/`. Each has its own render script and README.
