# Recovery board

**The operational board from 1 October 2026 (D-084).** It replaces `docs/coordination/BOARD.md`, which stays as the historical ticket record.
- One line per journey.
- States follow `EVIDENCE-MODEL.md`.
- From Phase 2, states are generated from runs; until then they come from the Phase 1 walk-back (`PHASE-1-STATUS.md`).
- A decision goes to `DECISIONS.md` only when a product or architecture ruling is needed.

**Phase 1: CLOSED 1 Oct.** O1 was approved (D-086), and the one-time owner access is done and verified (`PHASE-1-STATUS.md` §7). **Phase 2 is NOT authorised; it needs Yazid's explicit approval.** No engineering work is active.

**Since 1 Oct (K4):**
- The precise break for each human journey is in `PINTAR-4.0-JOURNEY-COVERAGE-CROSS-CHECK-2026-10-01.md` §7.
- Its W1–W19 are defects against agreed scope, to be fixed in journey order in Phase 4.
- D-085 (owner rulings M1–M10, T1–T4) adds lines to the inventory; they are listed in §12 of the inventory.

**Evidence for every state below** (all on main `28d3015`):
- CI #246 (run 36708706264);
- audit #55 job B (run 36708709106).

Both ran on `f86ace7`, which is identical to `28d3015` outside `docs/coordination` (D-034).
- **No Level 3 run exists.**
- **Staging's app commit is not machine-confirmed.**

| Journey | Owner | Current break or objective (known, not yet confirmed by a Golden School run) | Highest state on any part | Blocker | Next engineering action (Phase 2 or later; not started) |
|---|---|---|---|---|---|
| J1 Platform operation | Bob | Schools are born by hand-typed SQL; the C1 operator path does not exist | TESTED (sign-in, first admin); NOT BUILT (C1) | Phase 2 not authorised | Build the C1 script and workflow (Phase 2 tooling) |
| J2 Identity | Bob | Staff sign in only by magic link through Supabase's mailer (2 per hour; "sent" even when not). Gate 3 is held on lanes; Gates 4–8 are not started | TESTED (the link and the card) | — | Phase 2: the C2 mailbox reader. Phase 4: Gate 3 lands through the journey gate |
| J3 School setup | Daisy | No signposted way for a school admin to add a teacher; an unsignposted route exists and has never been walked (K1). No pass-mark setting (D-081), card re-issue (ADM-08), whole-class cards (M7) or class move (M9) | TESTED (structure, intake, cards) | — | None until the Phase 3 baseline |
| J4 Content | Daisy | The head of department's review queue has never been walked; media playback is untested | TESTED (upload, lifecycle, publish) | — | None until the baseline |
| J5 Teaching | Daisy | Uji Cepat screens are not run on `main`. No Uji Cepat score screen (EDU-10). **DEFECT on `main`:** a single Uji Cepat can certify (D-082(d); the fix BOB-50 is held) | TESTED (prepare and assign) | — | None until the baseline |
| J6 Learning | Bob | Lesson reading is not run on `main`'s code; offline and reload have never been run in a browser | TESTED (pre-test, post-test, result) | — | None until the baseline |
| J7 Evidence | Daisy | Figures shown only on the audit stack, never on a deployed environment; the dean's summary is untested | TESTED (teacher and head of department figures, audit stack) | — | None until the baseline |
| J8 Certificate | Bob | No certificate has ever been issued outside tests. The rules are changing: BOB-49 and BOB-48 TODO; BOB-50 held | BUILT (database tests only) | — | None until the baseline |
| J9 Educator as learner | Bob | Not built (BOB-43 to BOB-47 TODO) | NOT BUILT | — | Phase 5 |
| J10 Help and support | Daisy | Not built (BOB-15, DAISY-12 TODO) | NOT BUILT | — | Phase 5 |
| R Instruments and release | Coordinator | The audit harness cannot fail; no scheduled checks; no environment facts; production is 21 migrations behind; no upgrade or restore rehearsal | — | Phase 2 not authorised | Phase 2 (the list in `RECOVERY-CHARTER.md`) |

## Held work (preserved; lands only when it closes a mapped break, Phase 4)

| Item | Branch and commit | Evidence | Closes |
|---|---|---|---|
| BOB-26 (Gate 3, server) | `claude/quirky-meitner-a04smj`, `cf7dd87` | CI #249 green; audit #56 | J2.3, J2.5, J2.17 |
| BOB-50 | same lane, `1246835` | CI #250 green | J5.7, J8.1 |
| BOB-51 (proof-email button) | same lane, `4f11303` (lane head `3724f4d`) | CI #253 green; hand-off not yet read | J2.14 (proof) |
| DAISY-20 and DAISY-40 (with BOB-26 and BOB-50 merged in) | `ux-1/daisy-experience`, `59696ad` | CI #252 green | J2.3, J2.4; J8.2 |
| DAISY-39 | same lane, `957e314` (lane head `77d71ad`) | no CI run recorded | J5.5 (copy) |
| LANA-22 and LANA-23 (demonstration content) | `claude/adoring-feynman-njmjll` `f197e80` | CONTENT PASS | J9.8 (never on `main`) |

## Owner (Yazid)

- **Phase 1 exit requirements (one-time access): DONE 1 Oct** (`PHASE-1-STATUS.md` §7). Optional: the Actions budget's own threshold alerts.
- **Rulings:** `PHASE-1-STATUS.md` §6.
