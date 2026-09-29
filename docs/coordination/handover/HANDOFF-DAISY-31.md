GATE: PASS 29 Sep, CI #237 30/30 (431 passed, 0 skipped), audit #49; merged at 9907f97, on main at 4df914a. Daisy paused after this.

LANE: ux-1/daisy-experience (Daisy)
TICKET: DAISY-31, Studio «Koreksi» says its two move refusals in its own words (after BOB-35).
HEAD: f52c630 (f52c6309fe1c0e00ae9fc06dc50248969530bd62)
- = main 559b739 (fast-forward: the lane was already contained in main) + one commit.
- Pushed to ux-1/daisy-experience only. No PR.
CI: #237 (36563962133) on f52c630: GREEN, 30/30 jobs on the first attempt, including install · lint · typecheck · build and the full selftest suite.
MANIFEST: v122 (431 ids), with two new ids. The final number is yours to set.

WHAT CHANGED:
- Before: BOB-35's move raises both refusals as SQLSTATE PR060 with the code in DETAIL, but «Koreksi» read both as ACTION_FAILED. It showed «Belum tersimpan.» and the general «Ada kendala di PINTAR…» line with a reference.
- The mapping, in src/lib/galat-kontrak.ts (yours to me, per the ticket):
  - KODE_PINDAH = RELEASE_MOVE_STARTED, RELEASE_MOVE_NO_CYCLE_DEFINITION.
  - kodeGalat names them from PR060's DETAIL.
  - Every other PR060 (SESSION_RELEASE_MISMATCH) and every PR061 (QUICK_RULES_FIXED) returns ACTION_FAILED explicitly, before the message patterns. So they keep their reference whatever their messages come to say.
    - Note: QUICK_RULES_FIXED is raised as PR061, not PR060 (20261023100000_a_launched_quick_assessment_keeps_its_rules.sql).
  - KodeGalat now includes KodePindah, so Studio's ditolak(…) carries them with no change to any actions.ts.
  - kunciKode gives each its sentence under studio.terbitan.kode.*, beside the release's other refusals.
- The copy, in hle, both languages (approved, with your change to the first):
  - RELEASE_MOVE_STARTED:
    - «Penugasan ini tidak bisa dipindahkan: sudah ada siswa yang mulai mengerjakannya. Untuk memakai terbitan lain, buat penugasan baru.»
    - "This assignment cannot be moved: a student has already started it. To use another release, make a new assignment." ("student" is Studio's English for «siswa».)
  - RELEASE_MOVE_NO_CYCLE_DEFINITION:
    - «Terbitan tujuan belum punya Pemetaan Awal dan Uji Penguasaan, jadi penugasan tidak bisa dipindahkan ke sana. Pilih terbitan lain.»
    - "The target release has no Initial Mapping and Mastery Check yet, so the assignment cannot be moved there. Choose another release." (The tests' titles as learners see them: pretest.title, posttest.title.)
- On the page: «Koreksi»'s line is «Belum tersimpan.» followed by the sentence, with no reference.

TESTS: one per code, DAISY-31-PINDAH-01 (STARTED) and -02 (NO_CYCLE_DEFINITION). They share one checker. Each:
1. reads the latest migration's own raise of its code (PR060, code in DETAIL) and that raise's message;
2. checks the contract names it from that state and DETAIL, with the real message, and not under another state or from the message alone;
3. checks its sentence, in both languages:
   - its own, and not the general line or the other code's;
   - naming no code or machinery, and no INTERNAL_WORDS;
   - saying what it must (-02 names both tests by their learner titles);
4. reads the query «Koreksi» sends back with the page's own reader (kalimatHasil): «Belum tersimpan.» and the sentence, with no «Kode rujukan»;
5. from the source: «Koreksi» passes the move's refusal to ditolak, whose default is kodeGalat, and ditolak gives a refusal nobody named its reference;
6. checks the others stay ACTION_FAILED with a reference:
   - SESSION_RELEASE_MISMATCH, with both of its real messages;
   - QUICK_RULES_FIXED (PR061), with its real message;
   - an unknown PR060 DETAIL whose message says «may not»;
   - a PR061 carrying a move code with «not found»;
   - and the failed line ends «Kode rujukan: AB12CD.».

PROOF:
- Red on main's contract and copy (galat-kontrak.ts and hle.ts from 559b739, with the tests kept). Both FAIL:
  - "PR060 RELEASE_MOVE_STARTED is not named by the contract: it reads as ACTION_FAILED";
  - "…has no sentence of its own (galat.action_failed)";
  - "«Koreksi» does not answer RELEASE_MOVE_STARTED with its sentence: Belum tersimpan. …";
  - the same for RELEASE_MOVE_NO_CYCLE_DEFINITION.
- Green on f52c630.
- Local, in a clean worktree of this commit:
  - tsc: 0 errors.
  - ESLint: 0 errors (the two known warnings).
  - next build: ok.
  - selftest:local: 147 passed, 0 failed. RED only from the db/network facility skips.

FILES:
- src/lib/galat-kontrak.ts: the mapping, assigned to me by the ticket. It is Bob's contract file; no other Bob file was touched.
- src/lib/hle.ts;
- selftest/experience.test.ts; selftest/manifest.json.
- AGENTS.md and CLAUDE.md are still untracked and not committed.

READY: yes, at f52c630 (CI #237 green).
PAUSE: nothing unpushed on the lane. I stop here, per Yazid's pause plan.
