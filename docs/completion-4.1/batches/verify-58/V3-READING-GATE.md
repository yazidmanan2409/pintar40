# Verification 3 · The reading gate: screen against server (PETE-10)

Bob, 18 Nov 2026, 21:15 UTC. Ruling 58. Read on `main` `7ba18b03`; static, nothing run or changed.

## Finding: CONFIRMED. The rule "read every lesson before Uji Penguasaan" exists only on the chapter screen

| Layer | What it checks before Uji Penguasaan | Evidence |
|---|---|---|
| The chapter page (`/belajar/[tugas]`) | Offers Uji Penguasaan only once **every lesson is read** | `src/lib/siklus.ts`:91, 175 (`PENGUASAAN` once `pelajaranSelesai = pelajaranTotal`); the page's `aksi` switch |
| The Uji Penguasaan page (`/belajar/[tugas]/penguasaan`) | Only that the assignment is the learner's, that the chapter has a test, and that **Pemetaan Awal is FINALIZED**. **Nothing about reading** | `src/app/belajar/[tugas]/penguasaan/page.tsx`:36–55 |
| The database's start (`start_learning_session`, `may_start`) | Window, attempts, lineage, the mapping-first rule (`20261229100000`). **Nothing about reading:** none of the 8 definitions across the migrations refers to lesson progress | `git grep` over every definition, latest `20270112120000` |

**So a learner who types `/belajar/<tugas>/penguasaan` after Pemetaan Awal starts Uji Penguasaan without reading,**
and the database accepts it.

## What it means

- **This is not a security or integrity defect.** The learner can only reach their own assessment, under every
  existing rule. Results are scored correctly.
- **It is a rule that the screen and the server disagree on.** Which rule is intended is a design decision, not a bug
  to fix by guessing:
  - (a) **Reading is required:** enforce it in the start function (and the page), with a refusal that names the
    lessons left.
  - (b) **Reading is advised, not required:** the screen offers the test from the start, perhaps after the reading map
    (Dr Gladys's original specification gave each card a direct route), and the screen stops implying a rule the
    server doesn't have.
- **What else it touches:** the reading map and its "strong sections" (PETE-10's steering); 4.2 learning retries (D-3,
  "after a completed re-read"); the walkthrough's T2 script (Daisy); certificate meaning (D-2), if reading is part of
  "mastery under defined conditions".

## Classification

**Z triage: minor, owner decision.** No learner is harmed: production has no learners, and staging learners are
synthetic. It joins D-2's questions to Dr Gladys, because it bears on what Uji Penguasaan certifies: **Q-5 · Must every
lesson be read before Uji Penguasaan, or is reading advised?** Bob's view: (b) for Uji Penguasaan's validity (a test
should measure, not police attendance), with the screen made honest. But it is an educational call.

**For Sharon:** a static finding with no permissions aspect, so no independent reproduction is needed unless she wants one.
