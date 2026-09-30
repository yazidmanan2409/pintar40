READY FOR GATE: CI #250 (run 36789946641) green on 1246835d534d934b07f7200dcf238b4267702d89

# Bob → coordinator: BOB-50 (D-082(d): a single Uji Cepat does not issue a certificate)

- **SHA:** `1246835`: two commits, `7f8239c` (the change) and `1246835` (the board's other two acceptance points pinned), on top of BOB-26's hand-off (`b08ac84`). `main` `28d3015` is already in the lane.
- **Order:** after BOB-26's hand-off and before BOB-27, as the board has it. BOB-26 stays held for the joint gate with DAISY-20. BOB-50 sits on top of it on the lane, so it lands with that gate or after it, whichever the coordinator prefers. It changes no BOB-26 file.
- **Migration:** 134, `20261031100000_a_quick_assessment_does_not_certify.sql`.
- **Manifest:** v131 with 470 ids. That is 6 new: F19-Q01..Q04, BOB50-A01 and BOB50-S01.
- **D-060:** stated below.

## CHANGED
**The defect.**
- A finished Uji Cepat on a real school issued a normal, publicly verifiable «Sertifikat Penguasaan». It happened from the player after Finish, and by a direct `POST /api/certificates/issue`.
- The one cause is in the database: `mode_policy` had QUICK `certifies = true` (20260914093000), and `certificate_eligibility` accepts any mode whose policy certifies.
- Every issuance path asks that one function: the player, the direct POST, and the certificate page's `issueIfEligible`. So the one policy row decided for all three.

**The correction: one migration and one line in the player.**
- **(1) The policy:** QUICK `certifies = false`, audited as `mode_policy.changed` (from true to false, D-082(d), BOB-50).
  - `certificate_eligibility`'s body is unchanged: it already refuses a mode that does not certify («not eligible: mode QUICK does not certify»).
  - TEST, EXAM, STANDALONE and PAPER are not touched (no product path reaches them; any change is Yazid's).
  - POST_TEST, the cycle's Uji Penguasaan, still certifies.
- **(2) The lint:** `assert_mode_policy_complete` names QUICK among the modes that must not certify (with PRE_TEST, PRACTICE and PUBLIC_DEMO). A flip back fails the lint and the health card. Its revoke is restated (ADR-0021).
- **(3) Fail closed on unsigned rows:**
  - If any ELIGIBLE (unsigned) certificate from a QUICK session exists, the migration refuses to apply. It says how many and hands the decision to Yazid.
  - The ruling says there are none on staging or production today.
  - Sealed (ISSUED) certificates are never touched: an issued certificate keeps what it said (INV-30).
- **The player** (`ItemPlayer.tsx`) asks for a certificate after Finish only when its new prop `memintaSertifikat` is set. `PermukaanAsesmen.tsx` sets it only for a POST_TEST session.
  - It used to ask whenever the treatment was PENGUASAAN, which an Uji Cepat shares.
  - The request is still made from one place, never awaited.
- **Left for Daisy (DAISY-39):** UX1-S3-CEPAT-01 and every word on the Uji Cepat's result and certificate surfaces. Nothing in `src/components` or the copy tables changed.

## PROOF
**New tests:**
- **F19-Q01** (db, `selftest/db/fable19.sql`, rolled back): the bootstrap teacher launches an Uji Cepat. The learner starts it while QUICK still certifies (the policy before D-082(d)) and finishes it all correct under the policy the migrations left.
  - `certificate_eligibility` refuses it because its mode does not certify.
  - `certificate_prepare` raises for the same reason («not eligible: mode QUICK does not certify»).
  - No certificate row exists.
- **F19-Q02:** the same learner's all-correct Uji Penguasaan is eligible, and a certificate is prepared for it (the control that the fix did not overreach).
- **F19-Q03:**
  - QUICK does not certify, while POST_TEST, TEST, EXAM, STANDALONE and PAPER still do;
  - the change is audited as D-082(d);
  - the lint passes, and with QUICK flipped back to certifying it names QUICK.
- **F19-Q04:** that sitting, in progress when the policy changed, finished (SUBMITTED or FINALIZED) and is a pass. Its `session_outcome` is identical with QUICK certifying or not; `session_outcome` does not read `mode_policy`.
- **BOB50-A01** (app): a committed Uji Cepat, finished all correct by the bootstrap learner, who then signs in as herself through `/masuk/password` and asks `POST /api/certificates/issue` for it.
  - The route answers `not_eligible`.
  - No certificate row exists for the session.
- **BOB50-S01** (static):
  - the player asks from one place, only when `memintaSertifikat` is set;
  - the surface sets it only for `session?.mode === "POST_TEST"`;
  - the migration sets QUICK false and carries the refusal guard.
- **Gate `db-bob50-gates`** (`control_green` 4) plants four defects. Each turns its own test red and comes back:
  - `bob50-1`, QUICK certifies again → F19-Q01;
  - `bob50-2`, the lint's 20260914093000 list without QUICK → F19-Q03;
  - `bob50-3`, POST_TEST stops certifying too → F19-Q02;
  - `bob50-4`, `session_outcome` withholds «lulus» from a mode that does not certify, so the verdict follows the policy → F19-Q04.
- **The plant digest** now also covers `mode_policy` rows (an md5 of each row). The policy is data the lint treats as schema, and without this plants 1 and 3 read as "the schema is unchanged". That is stricter, never weaker.

**Red on `cf7dd87`** (the lane before this commit, which is BOB-26 on `main`), the same test files:
- **F19** on a fresh CI-shaped database:
  - Q01: `3 problem(s): a finished Uji Cepat is certificate-eligible (eligible); certificate_prepare prepared a certificate for an Uji Cepat; 1 certificate row(s) exist for an Uji Cepat`.
  - Q03: `QUICK certifies; the change of QUICK's policy was not audited; with QUICK certifying again the lint did not name it`.
  - Q02 and Q04 stay green. They are invariants that already held: the Uji Penguasaan certified, and the verdict never read the policy. Plants 3 and 4 show that each would catch its defect.
- **BOB50-A01** on a rig built from `cf7dd87` (Auth v2.196.0, PostgREST, the app built from that tree): `the issue route answered 200 {"status":"issued","certificate_id":"…"} for an Uji Cepat; a certificate exists for the Uji Cepat`.
- **BOB50-S01** on that tree: `the player asks for a certificate when formal, not only for the cycle's Uji Penguasaan; the surface does not tell the player to ask only for a POST_TEST session; … is missing`.

**The migration's guard, both ways,** on databases at `cf7dd87`:
- **With an unsigned Uji Cepat certificate committed** (the certificate prepared, ELIGIBLE), applying the migration raises: `BOB-50: 1 unsigned certificate(s) from an Uji Cepat exist; this migration refuses to apply. FOR YAZID: …`. QUICK still certifies afterwards: nothing applied.
- **With a sealed one** (the ISSUED certificate the red BOB50-A01 run made), the migration applies. QUICK no longer certifies, and the certificate row's md5 is identical before and after.

**Local, on `1246835`, on fresh CI-shaped databases:**
- **Full suite:** 432 passed, 0 failed. The one unjustified skip, UX1-PIMPINAN-AKSES-01, needs the network facility, which the shim does not have, as before; 37 local-only justified skips (BOB50-A01 among them, which needs Auth).
- **Plants:** 144/144 proved their gate.
- **Every db red-case gate in `ci.yml`** (24, `db-bob50-gates` included), each on its own stack from freshly extracted scripts: 24/24 exited 0 after really running (`db-bob50-gates` 4/4).
- **Rig** (real Auth): 465 passed, 0 skipped, F19-Q01..Q04, BOB50-A01 and BOB50-S01 among them. The 4 failures are the four tests that need Storage, which the rig does not run (F01-R03, BOB11-A01, BOB11-A02, BOB20-A01), as on `main`.

## CI
**CI #250 (run 36789946641, https://github.com/yazidmanan2409/pintar40/actions/runs/36789946641) on `1246835d534d934b07f7200dcf238b4267702d89`: success, 35/35 jobs green.** It is BOB-50's own run, dispatched by me once on the lane head and watched to the end.
- **Strict suite (local stack):** 470 passed, 0 failed, 0 skipped, 0 contract problems → GREEN. That includes F19-Q01..Q04, BOB50-A01 and BOB50-S01.
- **`db-bob50-gates` (new, the 35th job):** 4/4 plants proved their gate.
- Every other red case passed as well, `db-bob26-gates` among them.

## CONTRACT
- `ItemPlayerProps` gains `memintaSertifikat: boolean` (required). Its only caller, `PermukaanAsesmen`, passes it.
- `POST /api/certificates/issue` has the same shape and codes. For an Uji Cepat it now answers `not_eligible`, as it does for any mode that does not certify.
- No RPC signature and no grant changed. `assert_mode_policy_complete`'s ok and detail shape is the same; the detail's words gained «(a single Uji Cepat included)».

## MIGRATIONS
**134, `20261031100000`:**
- one `mode_policy` row, QUICK, gets `certifies` false and a new note;
- one audit row;
- `assert_mode_policy_complete` is re-emitted, with its revoke;
- the guard and the terminal verification.

No table or column changes. Nothing is backfilled, and no certificate row is written or changed.

## RESTATED TESTS (named)
- **UX1-BRAND-02, UX1-TUR-ORANG-01:** the migration count moves 133 → 134, with the reason written beside it. The checks are unchanged.

## COPY (FOR DAISY)
- None changed. UX1-S3-CEPAT-01 and the Uji Cepat result's words are DAISY-39's.
- Behaviour Daisy can rely on:
  - an Uji Cepat session never has a certificate row, so `rendersCredential` is false on its result;
  - if someone opens `/belajar/<tugas>/sertifikat` for it by address, `issueIfEligible` is refused and the page draws its existing refusal.

## D-060
- **Metric catalogue: unchanged.** No `calc_*` body, no metric source view and no readiness rule changes.
  - Any metric that counts issued credentials counts fewer from now on, because Uji Cepat sessions no longer earn one. That is the ruling's intent, not a change of definition.
  - If the coordinator reads that as a catalogue change, I will bump it.
- **Engine: unchanged.** Nothing grades, assembles or finalizes. An Uji Cepat's score, predikat and evidence are exactly as before. Only the certificate request and eligibility change.

## FOR THE COORDINATOR
1. **Staging on merge:** the migration's guard runs first. If staging holds an unsigned Uji Cepat certificate, the apply fails loudly with the count, and it is Yazid's call. The ruling says there are none.
2. **Already-issued Uji Cepat certificates**, if any exist anywhere, stay ISSUED and publicly verifiable, as D-082(d) rules («Certificates already issued stay valid and unchanged») and INV-30 requires. This migration writes no certificate row.

## QUESTIONS
None.

## READY
Yes.
