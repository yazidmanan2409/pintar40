# 07 · Open work and blockers

**Sources.** Read these first:
- the closure register `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md`, about 99 CR rows, a snapshot as of 6 Oct;
- its 7 Oct status `docs/reports/PINTAR-4.0-CLOSURE-STATUS-2026-10-07.md` §3;
- the decisions D-122 … D-136 in `docs/coordination/DECISIONS.md`, which changed rows after 7 Oct;
- the L4 report `docs/reports/PINTAR-4.0-CLOSURE-L4-2026-10-08.md`.

**How this list was made.** No new audit was run. Where a register row's current state depends on a later decision, the decision is cited.

The register was not re-walked row by row for this handoff. Treat every «closed» in it as a claim to verify, not as fact; 02 and 06 give the evidence classes.

**Priority order:** security/correctness first, then product defects, then missing approved functionality, then the rest.

## 1. Security or correctness

| # | Item | Governing requirement | State | Smallest next action |
|---|---|---|---|---|
| S1 | **Answer keys in the repository.** The withheld example `docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx` and the source chapters `docs/onboarding/konten/*.xlsx` / `*.paket.json` carry live questions, keys and reasons. Anyone with repo read access can read them. They are not served by the app (04 §11). | D-032 (item correctness); L4 finding 1 | Fact, not ruled | Confirm who holds repo read access. Whether committed content with keys is acceptable is an owner/security question; it has not been asked under D-135(b) |
| S2 | **CR-91: the class-card trust boundary** | CR-91 in the register («an authentication-assurance question, not a UI one») | HELD for a specific ruling | Establish the intended trust boundary of a class card, then the ruling. This is a genuine owner/security decision |
| S3 | **SYSTEM_ADMIN may grant any school role at the database** | D-133(e) | Standing, audited authority; recorded as not a defect | None, unless the owner wants database-enforced narrowing (D-133(e) says that needs its own ruling) |
| S4 | **#150 backup/DR verdict NOT PASS** | `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`; D-107 … D-111 | B1–B7 with the owner. Some items built (WP-B, WP-C) | Read the review's B1–B7 table; each remaining item names its owner action (for example, the pooler value, escrow custody) |
| S5 | **CR-13 staff-email correction**: four choices the coordinator made where the ruling was silent | Register CR-13; status doc §4.1 | Closed on the server and the route; the screen is in S7; the four choices were not confirmed | The owner confirms or changes them (security boundary of a credential channel); see 07 §8 |

## 2. Product defects

| # | Item | Requirement | State | Smallest next action |
|---|---|---|---|---|
| P1 | **S23q / CR-52: the question bank** has no filter, and no answer key or reason on the bank | CR-52 as QN5 ruled (D-123) | **Unresolved governed exception. It FAILS in every journey run** (latest 37775382999). It is an A item for S7. It is **not** a pass | Build the bank filter and the key/reason review on the bank (Studio → Bank Soal); then S23q passes |
| P2 | **CR-92**: «Komputer siapa ini?» opened from Akun saya preselects «shared» | Register CR-92: «the screen preselects the choice this browser holds» | Open, minor | Preselect from the browser's stored choice |
| P3 | **L4 finding 6**: Peran & akses role list unbounded, with a revoke form per row | CR-88 (Collection) | Open, recorded (L4 report §7 row 6). The journeys find their row on it (S24) | Bound it with the Collection component once applied; keep S24 working |
| P4 | **CR-41: transfer between schools not walkable.** The form asks for internal school and year IDs no screen shows | Register CR-41 (status doc §2) | Open; an A item for Daisy's admin screens (S7) | Replace the ID fields with named choices |
| P5 | Terminology mix: «Uji Penguasaan» beside «penilaian akhir» (`metrik.pemahaman.arti`) | Terminology v1 row A9; D-134(c) | Open, with Daisy's polish | Apply v1's row A9 |

## 3. Missing approved functionality

The register's «Open: Daisy's screens» (status doc §3), less what L1–L4 and batch 3b closed since:

| Item | Requirement |
|---|---|
| CR-03 / CR-04: certificate on screen and in print (DAISY-36), one A4 page | D-074, D-080 |
| CR-05: certificate revocation screen for the school admin | register |
| CR-06: remove the raw layout choice | DAISY-36(1) |
| CR-07: the student's own profile photo screen | register |
| CR-14: the name-correction screen | D-077(d) |
| CR-21: the Digital Card final (DAISY-24) | register |
| CR-22: identity emails in the final standard (DAISY-37); the activation email is the first contact | D-079 |
| CR-27 / CR-34: where an Uji Cepat score appears, and a Level 3 Uji Cepat walk | QN / Q8 in the register |
| CR-37: the briefings surface (build or hide) | QN4 |
| CR-46: honest empty states | register |
| CR-57: educator-as-learner, inside the propagation slices | register |
| CR-49: paging in the platform admin's lists | register (D category) |

The current code state of each is in 02. Several may be partly built.

## 4. Design implementation gaps

| Item | Requirement | Smallest next action |
|---|---|---|
| **CR-54: the application pass.** No row of `08-migration.md` is applied | D-128; D-136(b); `08-migration.md` on `ux-1/daisy-experience` (freeze c42fecb) | First, the owner declares that the authorised UI/UX stage has begun (`11-validation.md`, «The gate to the application pass»). Then slice by slice, keeping the `pin-*` names |
| Copy owed to `hle.ts` (C1, C2, CR-13/50/76/81, «Tandai soal ini», «Menerbitkan…») | `11-validation.md` §4 at c42fecb | Apply it in the slices |
| The rest of Terminology v1's change set | D-068, D-134(c) | With Daisy's polish |
| CR-56: wordmark licence and outlined master; the physical print proof | `11-validation.md` §5 | Owner/Daisy actions outside engineering |
| The Design System page (version 18) predates c42fecb | D-136(b) | Republish with the next design change |

## 5. Accessibility

- An NVDA or TalkBack pass on the real screens. Only accessibility trees have been checked.
- The 44 px target-size guard after the pass (`08-migration.md`, «Controls under 44 px»).

## 6. Test and evidence gaps

| Item | Note |
|---|---|
| Full regression after APPLICATION READY | Not run. The budget boundary is D-136(d): 108 minutes left; one CI plus journeys cycle costs about 125–147 |
| CR-30 (network loss), CR-58, CR-59 | «Batch 6 regression» per the status doc; not run |
| CR-36 (question health) | Needs data volume; it cannot run on a demo |
| No human acceptance recorded | J1–J7 were verified as design specimens (03 §2); no person has accepted the running application. Final human acceptance stays the owner's |
| **Production is not verified at main's code** | It runs 5b5b68d; per facts 37782586725, 661 code files differ from main, and 111 migrations exist at its commit against 177 on main. Its database was not read, so its applied migrations are unverified |
| The real-app 50-student test | The owner's word: re-run it on current main before any 50-person session; not done |
| BD11 runs only in CI | Firefox and WebKit are not in the local container |

## 7. Approved deferred capabilities

These are outside this gate, by the owner's rulings:
- CR-28: a teacher correcting or extending a window, after go-live (QN3, P2, D-028);
- CR-36: P2, data-dependent;
- CR-53: media (D-050).

Release-day, operations and legal items (the register's «D» category):
- CR-11 (DNS);
- CR-12 (#150 B5);
- CR-15;
- CR-24 (rehearsing production's staff migration to activation);
- CR-25 (the release);
- CR-66 … CR-74 (#150, capacity Q2/Q3, release day, legal).

## 8. Genuine unresolved owner decisions

Each meets D-135(b): it is new, not covered, and outside the responsible agent's authority. Work continues without it.

| Decision | Why it is the owner's | What continues meanwhile |
|---|---|---|
| **CI allowance beyond 1,900** | Budget authority | Local verification; no CI |
| **CR-91: the class-card trust boundary** | Authentication assurance (security) | Everything else |
| **CR-13: the four choices** (status doc §4.1) | A credential channel's security boundary | The server and route are built; the screen waits in S7 |
| **#150 B1–B7** remaining items (pooler value, escrow custody and others) | Infrastructure and custody | Development; not a production release |
| **The production release** (Gate 8 / D-004) | A deliberate release step | Staging work |
| **Declaring the authorised UI/UX stage begun** (`11-validation.md` gate) | Stage authority | Engineering fixes outside the pass |
| CR-51: the second platform admin on production; gs-001 Bab 1 as a school chapter or a library re-import (status doc §4.2) | Production access and content ownership | Everything else |
| CR-31: confirm the second attempt stays on hold (D-112(b)) | A product ruling already held | Everything else |

**Not owner decisions.** These are engineering or design judgement under D-135:
- the bank filter's design (S23q);
- paging bounds;
- the CR-92 fix;
- the CR-41 named fields;
- empty states;
- applying the copy table in approved words.
