READY FOR GATE: CI #252 (run 36793651616) green on 59696ad05c57b62dc9f98610eb6256dd876fe012

# Daisy → coordinator: DAISY-20 (Gate 3 screens), for the joint gate with BOB-26 and BOB-50

- **LANE:** `ux-1/daisy-experience`. Pushed there only; no PR.
- **HEAD for the gate:** `59696ad`.
  - It contains main `28d3015`, Bob's head `1246835` (BOB-26 and BOB-50, merged unchanged), DAISY-20 wired to the real routes, and the fix for #251's lint.
  - Two later `[skip ci]` commits change no code: `713c7ec` corrects one word in the proof's README («Two modules» → «Three»), and this hand-off adds only this file.
- **Also on this head (already on the lane before Bob's merge):**
  - DAISY-40, `fcdf56f`: the learner's certificate list opens each certificate. Its test, DAISY-40-SERTIFIKAT-01, is in the same CI run. Gate it with this head, or tell me and I'll say what it touches.
  - D-082(b), `c806b0c`: docs only. Certificate round 2's H is re-rendered without the reference thumbnail.
- **CI:**
  - #252 (36793651616) on `59696ad`: green, 35 of 35 jobs, `selftest contract (strict, local stack)` included.
  - #251 (36793138383) on `08c6f72` stopped at lint. The cause was my review harness (`docs/coordination/ux/aktifkan/klien.tsx`, a raw `<a href>`); I had linted `src` only. I cancelled #251 once `selftest` could no longer run, to save the Actions budget; it proves nothing. The fix is `59696ad` and changes no product code.
- **MANIFEST:** v132, 477 ids.
  - Bob's head is v131 (470 ids): BOB-26 took v130, BOB-50 took v131.
  - This lane's change set adds 7: DAISY-20-KODE/LAYAR/C17/NAMA/ALUR-01, DAISY-20-EMAIL-01 and DAISY-40-SERTIFIKAT-01.
  - The final number is yours.

## WIRED TO BOB-26 AS BUILT

- **The contract:** `src/components/aktifkan/kontrak.ts` now re-exports `src/lib/aktivasi-kontrak.ts`, plus `pengaturan-auth`'s password types and `lib/email/identitas`'s shapes. It restates no code, status or shape, and adds only the paths, which the contract file does not export.
- **The code check** posts to `/aktifkan/periksa`, Bob's one named change (INV-38).
- **Every answer is read by the contract's own reader for its route.**
  - `GET /api/aktifkan/keadaan` ships no reader, so it is read by the same rules. **FOR BOB:** a `bacaJawabanKeadaan` beside the others would let me drop that mirror.
  - A request that never comes back is still «not reached».
  - A reference is the contract's six characters, and it is shown only when the server failed.
- **Akun saya and the welcome** read the card nested as `{ ok, kartu }`, as the route answers. The published contract's transcription had it flat.
- **The identity emails:** `src/components/email/identitas.ts` now holds DAISY-20's `templatKode` (the first code, and the resend when `ulang`) and `templatKartu`. They replace Bob's placeholder words, under the names his send imports. My separate `kode.ts` and `kartu.ts` are gone, so each email exists in one place.
  - The code email says «Kode ini berlaku selama N menit.», with N taken from the canonical setting (D-079 addendum), shows the code «482 913», and greets by name only when there is one.
  - The card email carries the name, the ID 4 + 4, each role · school as the data gives it (D-059), and the way to Akun saya. It goes to staff only; Bob's send decides that (C17).
- **The page:** `/aktifkan` chooses by the session. Signed out, it shows the email then the code. Signed in, it shows the wizard (username → password → PIN → name → welcome). Bob's proxy already holds unfinished sessions there.

## RESTATED TESTS (named)

**Mine, for the contract as built:**
- DAISY-20-KODE-01: the contract's readers, the `periksa` door, the six-character reference.
- DAISY-20-ALUR-01: the module re-exports the contract, and the code goes to `/aktifkan/periksa`.
- DAISY-20-C17-01: the nested card read.
- DAISY-20-EMAIL-01 and DAISY-19-EMAIL-01: `identitas.ts`, which Bob's send renders.

**Bob's, for DAISY-20's copy (D-079(a)):**
- The BOB26-A01 line and BOB26-S01 pinned his placeholder «berlaku N menit».
- They now accept «berlaku (selama) N menit», which is the addendum's own wording.
- They still check the canonical number at 10, and at 15 and 5 when the setting changes.

## COPY

- **Confirmed unchanged:** Bob's two health-card sentences (`config.kesehatan.cek.anon_public_surface`, `.anon_reachable_http_paths`). They are accurate and follow the pattern (Terminology §2.9).
- **The code and card emails:** Bob's placeholders are replaced by the words above.

## PROOF

**Local, on `59696ad`, run as CI runs it:**
- `npm run lint`: 0 errors, the 3 existing warnings.
- `npm run typecheck`: clean.
- `npm run build`: ok, with `/aktifkan`, `/akun` and all of Bob's routes present.
- The full selftest: 164 passed, 0 failed. The database, app and mail suites need CI.

**The 320 px and accessibility proof** (`docs/coordination/ux/aktifkan/`) drives the real components against the contract's readers. It passes 64 of 64 checks:
- 16 states × 2 languages × 320 and 1280 px;
- no sideways scroll;
- every control 24 px, and every control DAISY-20 adds 44 px;
- axe-core WCAG 2.2 AA;
- focus on the new screen's heading.

**Plants, each red on a planted defect and green on this head:**
- the wizard asking a learner-only account for a card (C17-01);
- «segera» in the code email (EMAIL-01);
- the import's approval offered without the complete name list (NAMA-01);
- the old certificate list page, for DAISY-40 (all four defects).

## FOR THE COORDINATOR

1. **The team pause (Yazid, 1 Oct):** nothing merges to main during the pause, so the joint landing waits until after it. The gated head stays `59696ad`.
2. **DAISY-39 is on the lane, after this hand-off and without CI** (pushed so it isn't lost, as the pause asked).
   - It is one commit above this file, at manifest v133, with no CI run yet. It is not part of this gate. After the pause it gets one CI run and its own hand-off.
   - It rewrites the three Uji Cepat lines that claimed certificate eligibility.
   - UX1-S3-CEPAT-01 is re-pointed to the live mode policy and inverted. It is red on the old copy, naming six claims.
   - If you gate the lane's tip by mistake, you would take DAISY-39 too. The DAISY-20 gate is `59696ad`.
3. **Shared controls under PINTAR's 44 px** (they pass WCAG's 24 px):
   - the language switch, 26 px;
   - the admin `.pin-btn` and `.pin-input`, 40 px.
   They predate DAISY-20 and I did not change them. They belong in the polish register.
4. **D-082(b):** the reference thumbnail is removed from the tree, but it remains in the lane's history, at `336b274` and `4d9ae61` (never on main). Removing it from history needs a rewrite, which my rules forbid. That is Yazid's call.

## READY
Yes.
