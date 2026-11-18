# D-2 · What a PINTAR certificate asserts: the policy specification

Bob, 18 Nov 2026. **Ruling 55, D-2 (A):** a certificate means **mastery under defined test conditions.**
- **For:** Dr Gladys (educational meaning and accommodation boundaries) and Sharon (database and permissions).
- **Status:** a specification only; nothing is built.
- **When:** implemented and verified **before any real certificate is issued.** It is not automatically a Z blocker:
  whether it rides Z is the owner's call by 24 Nov.

## 1 · What holds today on `main` `7ba18b03` (read by Bob)

| Fact | Evidence |
|---|---|
| A certificate comes only from a mode whose policy certifies. **`POST_TEST` (Uji Penguasaan) and `STANDALONE` certify with assistance allowed;** `TEST`, `EXAM` and `PAPER` certify and refuse it. `QUICK` (Uji Cepat) does not certify *(corrected by Sharon, `D2-CERT-SPEC-ed8ad32b.md`)* | `mode_policy`, `20260914093000`; `20261113100000` (BOB-50) |
| **`POST_TEST` and `STANDALONE` allow assistance.** A lint keeps `EXAM` from allowing it | `20260914093000`:51–56, 103 |
| **"Assistance" in a sitting is three levels, opened a step at a time:**<br>1. «arah berpikir», a thinking prompt;<br>2. «petunjuk», a hint;<br>3. a worked example from the lesson.<br>A hint that would narrow to the answer is refused when it is served (INV-02) | `open_assistance`, `20260913093000`:395–440 |
| **The glossary and read-aloud exist only as telemetry kinds.** No server path serves them inside a sitting, and Bob found no client implementation. **The accommodation available today is extra time,** which a teacher gives through A1 | the `telemetry.assistance_kind` enum; A1 |
| The certificate states «Sertifikat Penguasaan», a grade band (predikat), the issue date and its number. **It states no attempt number and no conditions** | `src/lib/sertifikat-lembar.ts` |
| Attempt limits count across versions of an assessment (ruling 46, A3). Whether a retake can repeat the same questions is **not yet verified** (Sharon, verification item 2) | — |

**Correction to the decision pack:** the pack said "keep the glossary and read-aloud". Neither is served in a sitting
today, so there is nothing to keep. The real accessibility question is **which accommodations a certifying sitting must
offer**, not which existing ones to preserve.

## 2 · The proposed policy

| # | Rule | Change needed |
|---|---|---|
| P-1 | **No answer-providing assistance in a certifying sitting:** levels 2 (hint) and 3 (worked example) are refused in every certifying mode, **`POST_TEST` and `STANDALONE` included** | (a) A lint derived from the policy: `certifies ⇒ not allows_assistance`, not a list of named modes. (b) **The policy is captured on the sitting at its start,** because `open_assistance` reads `mode_policy` live, and flipping the row would otherwise change sittings already open (against P-6). (c) If level 1 stays (Q-1): a per-level rule, a small schema change (Sharon) |
| P-2 | **Accommodations stay available,** and are recorded with the result for staff only: extra time (A1, today); any other accommodation Dr Gladys requires (Q-2). **An accommodation is never shown on the certificate or the verification page,** because it can reveal a disability (Sharon; R-2) | Recording: a staff-only field. New accommodations are scope (Q-2) |
| P-3 | **The attempt is stated:** the result records which certifying attempt produced it, counted over the lineage (ruling 46) | **The ordinal is fixed at the START, under ruling 46's lock, with the same count as `may_start`.** Open question: are endings caused by a school act (an emergency stop, maintenance) excused? **Whether the ordinal appears on the certificate and the verification page is the owner's call** (O-1 below) |
| P-4 | **Repetition is disclosed:** if a retake presents questions already seen in an earlier attempt, the result says so (for example «sebagian soal sama dengan percobaan sebelumnya»). Alternatively the draw excludes them when the bank allows (Q-3) | Depends on Sharon's verification of the draw |
| P-5 | **Conditions, wording and verification agree:** the conditions are stated once (Daisy's wording) and appear the same on the certificate, the verification page and the learner's result | Copy, plus the verification page |
| P-6 | **Sealed certificates are never changed** (INV-30). The policy applies to sittings that start after it lands. Certificates issued before then (none yet exist with real learners) keep what they said | — |

## 3 · Questions for Dr Gladys

- **Q-1 · Level 1, «arah berpikir».** It is a thinking prompt, not a hint. May it remain in a certifying sitting, or
  does any prompt weaken "mastery"? *Bob's view: refuse all three levels. It is the simplest rule to state and verify,
  and the learning cycle already offers all three during the lessons.*
- **Q-2 · Accommodations.** Beyond extra time, what must a certifying sitting offer a learner who needs it (for
  example read-aloud of the question text, larger text, a reader)? Which of these does the certificate need to
  mention, if any? *Anything not built today is new scope and returns to the owner.*
- **Q-3 · Repetition.** Is a retake on the same questions acceptable if it is disclosed, or must a second attempt draw
  at least partly different questions? *The second needs more questions per chapter, which is content work.*
- **Q-4 · Wording.** Does «Sertifikat Penguasaan» still fit once the conditions are stated, and what single sentence
  should state them?

**For the owner (O-1):** should the attempt number appear on the certificate and the public verification page, or only on
the learner's result and in staff views? *Bob's view: on the result and in staff views only. It shows that the
certificate was earned under the conditions, without turning a public document into a record of failures.*

- **Q-5 · Reading before Uji Penguasaan** (from verification 3, `batches/verify-58/V3-READING-GATE.md`): must every
  lesson be read first, or is reading advised? Today only the chapter screen requires it; the database and a typed
  address don't.

## 4 · Verification (before any real certificate)

- **Refusal:** a certifying sitting refuses each refused assistance level, through the normal entry point and by a
  direct call (failing test first; one planted defect per mode).
- **Lint:** fails if any certifying mode allows refused assistance.
- **Recording:** an accommodation given through A1 is recorded with the result.
- **The attempt:** the attempt number on the result equals the lineage count; the certificate and the verification
  page show it.
- **Repetition:** a retake with overlapping questions shows the disclosure; one with none doesn't.
- **Consistency:** the learner's result, the certificate and the verification page state the same conditions (Daisy).
- **Sharon reviews** the policy row, the lint and the fields.

## 5 · What else it changes

- **E and C3w:** none.
- **A3:** reads the attempt count it already builds.
- **The walkthrough:** if P-1 lands before it, learners meet no hints in Uji Penguasaan. Daisy's script must match
  whichever state is on the candidate.
- **The handbook and the teacher guidance:** «hints are available in the test» becomes false.
- **Item banks:** Q-3's stricter answer needs more questions per chapter.
