# PINTAR's first pilot: 10 adults. A proposal

Bob, 18 Nov 2026. **Owner decision of 18 Nov (ruling 57):**
- 10 adult participants only, with no children;
- an adult professional-learning pilot;
- existing approved capabilities only;
- any increase needs a later owner decision.

**This is planning only.** It authorises no launch, invitation, account, real data, production change, new feature,
4.1 change or legal fee. **The pilot comes after 4.1's acceptance,** and stays separate from the 4.1 walkthrough.

## 1 · Objectives

We want to learn, from 10 real adults using PINTAR without the team's help:
1. **Can they get started:** activate an account, find their way, and understand what PINTAR is for?
2. **Can they complete one real cycle:** prepare a chapter, review and publish it, assign it, take Pemetaan Awal and Uji
   Penguasaan, and read the result and the evidence?
3. **Is what PINTAR shows them understood and useful:** results, misconceptions, «Belum cukup data», the next step?
4. **What stops them, and how often** they need help, and where.
5. **Does it run cleanly for real people:** no lost answers, correct results, no data surprises?

## 2 · Participants and the experience

**Reuse:** Daisy's walkthrough plan (`WALKTHROUGH-41-RENCANA-OBSERVASI.md`), the existing tester guide
(`docs/onboarding/PINTAR-Panduan-Penguji-Pilot.md`, written for an educator pilot of 20–30 people and to be cut down),
and the existing report form (`PINTAR-Formulir-Laporan-Uji-Coba.md`).

**One pilot school, one class of the 10 adults.** Each participant holds a staff role **and** a learner card in that
class, so the adults sit each other's assessments. No child, and no synthetic learner, is involved.

| Role | Number | Does |
|---|---|---|
| School admin | 1 | Setup: structure, the class, cards, pass marks; publishes |
| Reviewer (head of department) | 1–2 | Reviews and approves content |
| Teachers | 7–8 | Each prepares or imports one short chapter, has it reviewed, assigns it to the class, then reads the evidence |
| Every participant, as a learner | 10 | Takes colleagues' Pemetaan Awal, reads the lessons, takes the Uji Penguasaan, reads their result |

**Over three weeks:**
- **Week 1:** activation, setup and the first chapter.
- **Week 2:** sitting each other's chapters, with one interruption tried on purpose (A3 recovery).
- **Week 3:** reading results and evidence; one weak section followed through today's re-read request and an Uji Cepat
  (no 4.2 retry).

**Certificates:** **none issued in the pilot,** unless D-2's policy is built and verified first (ruling 55). Bob
recommends none.

## 3 · Environment and readiness (the minimum)

**Where it runs is the first decision (P-1):**

| Option | What it needs | Trade-off |
|---|---|---|
| **(a) Production, upgraded to the accepted 4.1** | The upgrade rehearsal on the 4.1 candidate (PR-17); owner authorisation of the upgrade; the watch, the backup and the drill switched on and each proved once (PR-4 to PR-6); a timed restore (PR-7) | It tests the real product and the real data handling. Production's records start clean and stay. **More preparation** |
| **(b) Staging** | Fixtures written with the owner's authorisation; no production change | Fast. But staging is the engineering promotion target: every promotion during the pilot touches the participants' data, and staging is not run as a service for real people |

**Bob recommends (a).**
- The pilot exists to put the real product in real hands.
- Staging would mix 10 people's real records with engineering promotions.
- Most of the work in (a) is already on the readiness register and needed anyway.

**The minimum readiness for (a):**

| Item | Register row | Needed for the pilot? |
|---|---|---|
| Capacity at 10 adults | PR-10 | **Already evidenced, no upgrade.** 10 learners starting together on Micro: database CPU 3%, save p95 819 ms (efficiency audit, run 36963146820); the real app at 50 learners is proven (§9) |
| The leader page's fan-out | PR-11 | **Not needed:** one class means about 7 requests, not 210 |
| The watch, the backup and the drill | PR-4 to PR-6 | **Yes:** switched on and each proved once (owner) |
| Restore, recovery point | PR-7, PR-9 | **Yes:** one timed restore; the owner accepts the recovery point (about 24 h without point-in-time recovery) for a 10-adult pilot |
| Email | PR-14 | **Yes:** activation is by email |
| Support and a second administrator | PR-15, PR-16 | **Yes:** a named contact; a second production administrator |
| Error capture | PR-12 | **The smallest form:** problem reports and server errors reach the named contact |
| Legal | PR-1 to PR-3 | **Only the pilot-scoped questions** (§7) |

## 4 · Support

| Who | Does |
|---|---|
| **One named first-line contact** (owner to name) | Answers participants during pilot hours; same-day replies |
| Bob | Coordination; the findings register; daily check of the problem reports |
| Daisy | Observation sessions; usability findings |
| Sharon | Data and privacy checks; the closing deletion or anonymisation (as §7 decides) |
| Second Eye | Fixes only for confirmed defects, under the severity rules; nothing pilot-specific |
| Dr Gladys | Educational meaning; one observed session |
| Owner | Escalation, decisions, the go or stop |

## 5 · Observation and feedback

- **Reuse Daisy's plan:**
  - two observed sessions (setup in week 1; results in week 3), each participant thinking aloud;
  - completion, wrong turns, help requests, misreadings and time;
  - her four questions.
- **The existing report form** for anything at any time.
- **One short exit conversation** per participant (about 15 minutes).
- **No analytics or click tracking.** Only what PINTAR already records, used under §7's answers.

## 6 · Success criteria and how findings are classed

**Success** (all from observation, not opinion alone):
- at least 8 of 10 complete the cycle in §2 without the team's help;
- **0 lost answers and 0 wrong results** (a data-integrity defect stops the pilot until fixed);
- at least 7 of 10 can say correctly, in their own words, what their result and the evidence page mean;
- each help request is recorded with where it happened.

**Classing:** the walkthrough's severity rules: blocker, major, minor, feature request. A feature request is never a
defect, and goes to the 4.2 evidence.

**Stop rule:** a data-integrity or privacy incident pauses the pilot, and the owner decides.

## 7 · Legal: questions specific to this pilot (no counsel engaged)

**What already exists:**
- adults close their own accounts; deletion by the platform admin; an anonymised person is terminal;
- sign-in, sign-out and print records kept 12 months, with no passwords or codes (B1);
- print references identify the printer (B2);
- audit records are append-only;
- data hosted in Supabase ap-southeast-1 (Singapore);
- the problem-report page carries a privacy line (`lapor.privasi`);
- the tester guide's "test data only" rule.

**What does not exist:**
- an in-product privacy notice or terms of use;
- a participant consent form;
- a written retention rule (R-2);
- a decision on transfer consent (OD-9), which the pilot does not use.

**The questions:**
1. **Basis and consent:** for 10 adults' names, emails, activity, answers and results, is a participant information
   sheet with written consent a sufficient basis under UU PDP? Who is the controller: the owner's entity, or also the
   participants' institution?
2. **Cross-border hosting:** does hosting in Singapore need any specific notice or safeguard for a closed pilot?
3. **Registration:** does a closed, unpaid pilot of 10 adults require PSE registration, or does that start with public
   or commercial use?
4. **Retention and erasure:** PINTAR's audit trail is append-only and its erasure is anonymisation. Is anonymisation at
   the end of the pilot, with the audit rows kept for 12 months, acceptable as erasure on request?
5. **Employer involvement:** if participants come from one school, may results about them be shown to a colleague in
   the reviewer or admin role? (They are by design.) Must the institution agree?
6. **Assessment representations:** with no certificate issued, what disclaimer must results carry ("pilot; not a
   qualification")?
7. **Pilot terms:** no warranty; the use of feedback and quotations; recordings, if any; confidentiality of unreleased
   features; withdrawal at any time.
8. **Content rights:** for material a participant uploads, the licence PINTAR needs, and how to handle third-party
   textbook content.

**Not in this pilot,** so no question is needed:
- children;
- AI drafting, unless C3w-2 is qualified and the owner includes it;
- payments;
- the anonymous feedback round (hidden, D-6).

## 8 · Duration and resources

| Phase | Time | Effort |
|---|---|---|
| Preparation, after 4.1 acceptance (decisions, legal answers, the production upgrade, readiness proofs, guide and consent) | ≈1–2 weeks elapsed, mostly owner decisions and external answers | Bob 2 d, Sharon 2 d, Daisy 2 d, Second Eye about 1 d (the upgrade run) |
| Pilot | 3 weeks | Team about 1 h a day; two observation sessions; the support contact during pilot hours |
| Findings | 1 week | Bob and Daisy 2 d each |

## 9 · Sequence

```
4.1 accepted → P-1..P-7 decided → legal answers (pilot-scoped) → production upgrade + readiness proofs
            → guide, consent sheet, accounts → 3-week pilot → findings → owner decides what next
```

## 10 · Decisions for the owner

| # | Decision | Bob recommends | Needed by |
|---|---|---|---|
| P-1 | **Environment:** production after the upgrade, or staging | Production (a) | Before preparation starts (after 4.1 acceptance) |
| P-2 | **The first-line support contact,** and a second production administrator | Name both | Before preparation |
| P-3 | **No certificates in the pilot** | No certificates | Before preparation |
| P-4 | **Legal route:** answer §7's 8 questions with counsel (a separate approval of the engagement and its fee), or decide which can be answered internally | Ask counsel only §7's questions, as one bounded engagement | When convenient; it is the longest lead |
| P-5 | **The recovery point** (about 24 h without point-in-time recovery) is acceptable for 10 adults | Accept | With P-1 |
| P-6 | **Participant source** (one school's staff, or educators from several) | One school's staff: simpler roles and support | Before recruiting |
| P-7 | **The launch itself,** and creating the accounts | — | At the end of preparation |
