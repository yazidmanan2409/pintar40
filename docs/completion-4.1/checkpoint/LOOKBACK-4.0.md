# A look back at 4.0: did it miss something foundational? (Second Eye, 13 Nov 2026, read-only, bounded)

**Short answer:**
- 4.0 is sound in what it built.
- It left **one design gap** that 4.1 keeps paying for: **no declared lock order** across persons, `auth.users`,
  accounts and sittings.
- It also left **one infrastructure cost**: a pre-flight that is two-thirds serial red cases.
- Most of 4.1's elapsed time was operational: the hosted checkpoint was built and debugged inside the release process.

**1 · Numbers from the record** (cheap sources only):

| Phase | Commits | Review blocks (Sharon's files whose verdict reads BLOCKED) | Red pre-flights |
|---|---|---|---|
| 4.0, 2 to 9 Nov (B0 to B9) | 180 subjects naming a batch: B0 15, B1 28, B2 18, B3 29, B4 25, B5 35, B6 16, B8 9, B9 5 | no number (4.0's reviews are kept per batch elsewhere; not counted) | no number |
| 4.1, 10 to 13 Nov | 58 on the work branch: L-1, L1-F2, L1-F4 11; B1 7; C1w, F-1, F1-R1b 6; A1 5; B2 5; checkpoint 5; B0 3; S-1 1; other 15 | **4**: two on 12 Nov, two on 13 Nov (the checkpoint) | **no number**: my pre-flight records keep only the last run per commit. 34 kept: 29 complete and green, 5 stopped by me. CI and journeys reds not counted: the runs list is too large to pull cheaply |

- **"Increasing failures across phases": partly supported.** The blocks and rework cluster in two places, not across
  the board:
  - the account lifecycle's locking (L-1 to L1-F4);
  - the hosted checkpoint.

  Commits per day fell from about 70 (4.0) to about 20 (4.1), while the work moved into concurrency and hosted
  behaviour.

**2 · The 4.1 failures I fixed, classified:**

| Failure | Class | Note |
|---|---|---|
| The three failures before L1-F2 | **not classified** | not in my notes in enough detail; Bob's record has them |
| L1-F2's lock cycles | **(i) inherited**: 4.0 declared no lock order; each function locked persons, `auth.users` and accounts in its own order | made visible by (ii), 4.1's new locks |
| L1-F4 (an anonymised person reopened; the deletion's lock order) | **(i) inherited**: 4.0's account lifecycle had no "terminal" invariant, and again no lock order | |
| B2's notice wrapper | **(ii) new 4.1** | a structure detail, caught by its own test |
| The CI port fault (CI-1) | **(i) inherited tooling**: 4.0's journeys claim fixed ports | |
| The checkpoint script's rounds | **(iii) process**: a large stateful script built inside the release process, and verified by the full pre-flight. The last round used a direct first-pass method instead and passed first time (the auth probe) | |

**3 · Development infrastructure: the 4.0 decisions that cost 4.1 materially** (two):
1. **Red cases are serial.** Measured on `a33c8528`, a 47-minute pre-flight:

   | Part | Minutes |
   |---|---|
   | Red cases | 31.5 |
   | Suite | 9 |
   | Plants | 4.2 |
   | Lint, build, reset | 2 |

   Each re-run after a correction costs that 47 minutes again.
2. **No declared lock order, and no test of one.** Sharon's required change 3 for A2a is the third time the order
   had to be written down, after L1-F2 and L1-F4. Each time it cost one block and one rework round (about half a day
   each).

**Not costly:**
- targeted runs exist (`selftest:only`) and take 2 to 3 minutes with a reset;
- a synthetic signed-in staff actor now has a local stand-in, the seed's passwords (the auth probe);
- hosted-only behaviour was settled by small probes once we stopped building one verifier for everything.

**4 · The smallest corrections:**
1. **Lock order:** one catalogue test, "no function takes persons, `auth.users`, accounts and the fence out of the
   declared order". It extends A2a's own structural test, so it belongs **inside A2a** and does not precede it.
2. **Red cases:** run them in parallel (the design was sent before the checkpoint and put on hold). It can wait until
   **before A2a's freeze**, where it saves about 25 minutes on every pre-flight. It is not needed for A2a's
   development, which uses targeted runs only.
