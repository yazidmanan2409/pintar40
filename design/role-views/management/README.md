# ROLE VIEW — MANAGEMENT

**"Apa yang perlu saya ketahui hari ini, dan apakah ada keputusan yang
menunggu saya?"**
and the bounded **Umpan Balik Pendidik** experience.

**Date:** 2026-09-18 · **Status:** Sauron rulings R1–R13 applied. Management
only. Student is not started. The Educator feedback experience is named here
and is not designed here.

```
python3 -m http.server 8000 --directory .
# ?lang=en · ?screen=beranda | umpan-mulai | umpan-pertanyaan | umpan-terbit
#            | umpan-hasil | umpan-tipis
```

---

## Feedback follows the nearest accountable relationship

This is the governing direction (R2), and it decided what this prototype
demonstrates.

| Who reports | To whom | About what | Designed where |
|---|---|---|---|
| **Student** | the educator responsible for that learning | their own experience of learning | the **Educator** experience — recorded here, **not designed here** |
| **Educator** | appropriately scoped management | their own working and teaching experience | **this view** |

Feedback goes first to the person or level closest to the experience and
able to act on it. Two consequences, and both are in the prototype rather
than only in this document:

**The Management home no longer shows student feedback.** The earlier draft
put *"Umpan Balik Pembelajaran · Kelas 8A"* — students, about a class — on
the manager's home. That was the wrong relationship, and it is gone. The
Management instrument is **Umpan Balik Pendidik**: educators, about
conditions they can observe in their own working week.

**There is no Student → Management path** (R4). Not as a feed, not as a
dashboard, not as an inference. A persistent or institutional issue found
through student feedback may one day be escalated through a separately
governed process; that process is **not authorised, not designed, and not
assumed**. The start screen says so in one sentence, and `verify/audit.mjs`
fails if that sentence loses either half — that the path is undecided, and
that it is not automatic.

Two lines in the whole feedback experience may mention students at all: the
one that says where student feedback goes, and the one that says escalation
is undecided. Anywhere else in `UMPAN` or on the feedback card, a student as
respondent fails the audit and fails the browser run. That is the check that
exists so this correction cannot quietly revert.

---

## Scope, before the design

The brief says to determine what exists first. Three different answers.

### Exists, shipped

- **The management roles.** `app_role` carries `HEAD_OF_DEPARTMENT`, `DEAN`,
  `INSTITUTION_ADMIN`, authorised through scoped `role_assignments` and
  `can_in_institution()`. Unlike the Parent view, the principal is real.
- **Capabilities** granted at those tiers: `CAN_REVIEW`, `CAN_FREEZE_RELEASE`,
  `CAN_PUBLISH`, `CAN_REVIEW_INTEGRITY`, `CAN_REVIEW_QUESTION_HEALTH`,
  `CAN_MANAGE_REPORT_TEMPLATES`, `CAN_ASSIGN_LEARNING`, `CAN_AUTHORIZE_TRANSFER`.
- **`integrity_signals` and `record_integrity_review`**, which accepts three
  decisions and refuses anything else as *"not a verdict about the learner"*.
  `REFERRED_TO_INSTITUTION` is a real decision an educator can already
  record — which is exactly what the second card on the home is about.
- The evidence contract, `official_*` views, `audit_log`, `record_class_registry`.

### Exists as a surface

**Almost nothing.** `src/app/konfigurasi` assigns roles; `src/app/studio` is
the authoring home, task-first, five buckets. Neither answers *"is there a
decision waiting for me"*. There is no management view.

### In scope, not implemented

Doc 09 BUILD NOW: *"Canonical Metric Catalogue, Standard Reports (Educator
Class Learning Intelligence, **Dean Institutional Learning Intelligence**,
learner results) and Institution Report Templates … with honest
insufficient-data states."* None of it is in the schema — no metric
catalogue, no report tables. The third card on the home is that honest
insufficient-data state, and it is the only part of this design with a
scope mandate already behind it. **It stays ahead of Umpan Balik** (R13).

### Adopted as a concept, not authorised to build

**Umpan Balik.** Not a table, not a capability, not a string, not a row
anywhere. And it is on **none** of doc 09's lists: not BUILD NOW, not LATER,
not PARK.

R1 settles its status: **adopted as a concept, not authorised for
implementation.** It is a new proposed product capability requiring an ADR
before any schema or code. It does not become Slice 4 work and does not jump
the roadmap. The sample banner says both halves on every screen — adopted,
and not authorised to build — and `verify/audit.mjs` re-reads `hle.ts` and
the foundation migration on every run, so the claim that it does not exist
goes stale loudly rather than quietly.

---

## The home, in sixty seconds

| | ID | EN |
|---|---|---|
| Orientation — the frame plus each item's one-line *what happened* | **26 s** | **27 s** |
| Orientation + reading the longest item in full | **45 s** | **49 s** |
| Every item in full | 70 s | 79 s |

The middle row is the claim, and the audit fails over 35 s to orient or 60 s
to orient and read one item.

**Three items, and only two carry a decision.** The third — the report that
cannot yet be computed — has no buttons at all (R10: *Perlu diketahui* must
not manufacture a task). That is how the page answers *"is anything waiting
for me"* without a counter: if an item has a decision row, it is waiting; if
it does not, it is not. `verify/view.mjs` asserts the number of decision rows
equals the number of items that wait on someone, and the audit fails a
worth-knowing item that grows one.

**Management is not Educator higher up** (R10). The Educator home asks *what
needs my attention today*; this one asks *what decisions are waiting for me*.
That is checked **across both surfaces** — the audit imports the Educator
view's own question and fails if either drifts into the other's. An item
reaches this page because authority, coordination, escalation or an
institution-level reading is required, and the home says so; it never
reaches it merely because PINTAR can aggregate more.

**It is not a dashboard, and that is checked.** No tiles, no counters, no
charts: the browser fails the run if any element on the home is a bare
number, or if a `svg`, `canvas`, `progress` or `meter` appears.

---

## Umpan Balik Pendidik — the bounded experience

Five screens. Not a survey builder.

**1 · Mulai.** One department, one period, one instrument. Four boundaries
are stated before anything else: what is asked about (*what educators
themselves experience, not how good their management is*), the direction of
feedback, the undecided escalation path, and the record class — *these
responses are a separate record, not learning evidence*.

**2 · Pertanyaan.** A governed pool of five, nothing authored. Every
question is about what the educator can observe in their own week, in the
first person — the audit fails a pool question that is not:

- Ketentuan dan prosedur institusi jelas bagi saya.
- Saya punya keterangan yang saya butuhkan untuk mengajar dan mengambil keputusan.
- Proses asesmen dan administrasi mendukung pekerjaan saya.
- Saya bisa menyampaikan persoalan ketika ada yang perlu diangkat.
- Dukungan institusi membantu saya menjalankan tanggung jawab saya.

The page says plainly that questions asking educators to **rate their
management** are not in the pool and cannot be added — the mirror of the
rule that protected educators from student ratings, pointing the other way,
back at whoever requested the feedback. There is no free-text box, and the
reason is given: open comments raise anonymity problems that are not yet
answered.

Answers are a five-band frequency — *hampir selalu · sering · kadang ·
jarang · hampir tidak pernah*. Frequency rather than agreement, because it
asks how often something happened to the respondent rather than how much
they approve of someone.

**3 · Terbitkan.** The anonymity contract — eight terms — is stated
**before** the publish control, not reassuringly afterwards. The browser
checks the document order. Two terms carry rulings that were not in the
first draft: no administrator is an exception (R6), and answering times and
order are not kept (R8) — finely timestamped responses re-link themselves by
sorting.

**4 · Hasil.** Question by question, in words, across named bands. **No
composite, no average, no percentage** — a single figure standing for a
department is a score, and a score becomes a rank the first time two of them
sit side by side. The audit fails a row that is one figure, contains a
decimal, or contains a `%`.

**5 · Tanggapan sedikit.** *"Belum cukup tanggapan untuk menampilkan hasil
dengan aman."* No partial result, no single question, no running count —
and **no number** (R7), because the threshold is a privacy decision that
turns on group size and identifiability, and inventing one here would be
answering it with a mockup. The audit fails any invented minimum anywhere on
the surface, not only on that screen.

---

## The anonymity contract — proposed architectural requirements

**None of these exists.** They are what would have to be true, written as
requirements rather than as reassurance, so that a future implementation can
be checked against them.

**AR-1 · Two records, no link.** A participation record — this eligible
respondent, this request, submitted once — and a response record carrying the
answers, bound to the request and to nothing else. No foreign key in either
direction, and no shared surrogate that reconstructs one.

**AR-2 · Separate write and read paths.** The two are written through
separate functions with separate grants. No product role holds both reads.

**AR-3 · No correlating timestamp.** The response record carries no
timestamp finer than the collection window, and no insertion order that
survives. Two finely-timestamped logs re-link themselves by sorting; this is
the failure mode that looks anonymous and is not.

**AR-4 · No live result.** Results exist only after the period closes. In a
live view the first responder is identifiable by elimination.

**AR-5 · A minimum disclosure threshold.** Below it, nothing at all — not a
partial result, not one question, not "n so far". **The number is
unresolved**, and it must eventually turn on group size and privacy risk
rather than on one constant.

**AR-6 · The threshold survives every future cut.** Any filter or subgroup
re-applies the threshold to the subgroup, never to the whole. A result that
passes for a department and is then sliced by anything can fall below it.

**AR-7 · No individual response is readable by any product role.** Not
management, not the educator, not the institution administrator, and no
super-admin exception (R6). If a lawful path must ever exist, it is a
separate, explicitly governed, audited non-product path — and whether it
should exist is itself an open decision, not an assumption.

**AR-8 · Participation is never exposed to whoever requested it.** Not who
answered, not who did not, and not a count that makes it deducible in a
small group.

**AR-9 · A new record class, not a new evidence class.** Feedback is not
assessment evidence. It must never enter `responses`, never carry an
`evidence_class`, and never reach a scoring or certification path. It needs
its own entry in `record_class_registry`, almost certainly
`INSTITUTION_SCOPED` — it must not travel with a person on Transfer.

**AR-10 · A new capability, and probably two.** No existing `CAN_*` covers
requesting feedback. Requesting it and reading the consolidated result are
plausibly different capabilities. The exact matrix belongs in the ADR, not
here.

**AR-11 · Feedback never touches a learner.** No learner's evidence, score,
map or result changes because of anything submitted here — the principle
INV-11 applies to assistance telemetry, applied to a different record.

**AR-12 · Direction is a property of the instrument, not of the reader.**
Each request is bound to one relationship: student → educator, or
educator → management. A reader's seniority never widens what they may read;
an institution-level role does not thereby receive the student instrument.

**AR-13 · No cross-level escalation path exists.** There is no mechanism by
which responses collected for one relationship become visible at another
level, automatically or by request. Building one is a governance decision
with its own ADR, and **it is not authorised** (R4).

**AR-14 · No performance derivation, in either direction.** Student feedback
is not evidence of educator quality; educator feedback is not evidence of
management quality. No composite score, ranking, rating, league table or
hidden equivalent may be derived from either — and retention must not
gradually turn anonymous feedback into a longitudinal profile of an
individual learner, educator or manager (R9). **The retention period is
unresolved.**

---

## The management result is not a verdict

> **Supported:** educators' responses about assessment and administrative
> processes are split.
> **Not supported:** therefore the process is broken, or somebody was
> negligent.

That boundary is on the screen, in the *yang belum diketahui* line, in both
languages. R12 fixes exactly where each part goes: the aggregate supports
**what educators reported**; **why** they reported it, and **who or what
accounts for it**, sit under what is not yet known unless other evidence
exists. The audit enforces both halves — a *what the evidence supports* line
that starts explaining ("karena…", "because…") fails, and an unknown line
that has dropped *why* or *what accounts for it* fails.

Four decisions, all at the same weight, one of which is **Tidak ada tindakan
sekarang**. `verify/view.mjs` compares the computed background, colour,
border, weight, size and height of every button in a decision row and fails
if any differs, and fails if any is preselected. *No action* must be
available without being the recommendation, and without being the quiet one
at the end. **PINTAR mengusulkan, manusia memutuskan** (R11) — the sentence
is pinned by the audit, and it is the right one at this level because the
accountable person may be a head of department, a dean, an institution
administrator or someone else appropriately authorised.

---

## Adversarial pass

| Axis | Defence | Checked by |
|---|---|---|
| Ranking leakage | banned vocabulary incl. percentile, above/below average, ordinal placement, "compared with other classes" | `audit.mjs` |
| Scoring or classifying an educator | banned vocabulary; and structurally — every result row must be a multi-band distribution, never one figure, no decimal, no `%` | `audit.mjs` |
| Scoring or classifying management | the mirror ban list: leadership index, management rating, "how good is management" in the pool | `audit.mjs` |
| The wrong relationship | the instrument must name educators as respondents; students may appear only in the two lines that say where student feedback goes | `audit.mjs`, `view.mjs` |
| An assumed Student → Management feed | the direction sentence must state both halves and that student responses do not arrive here | `audit.mjs`, `view.mjs` |
| Escalation designed by mockup | the escalation line must say the path is undecided and not automatic | `audit.mjs`, `view.mjs` |
| Feedback becoming evidence | ban list incl. mastery, scoring, certification, question health, performance evidence; and the record-class sentence is required on screen | `audit.mjs`, `view.mjs` |
| Unsupported causal conclusions | banned constructions; *what the evidence supports* may not explain, and *why* must remain under what is not known | `audit.mjs` |
| False certainty from small samples | the thin-response state exists and carries its sentence; the step line names the five who did not answer | `audit.mjs`, `view.mjs` |
| An invented threshold | no number on the thin screen, and no "minimal N" anywhere on the surface | `audit.mjs` |
| A live result | live/running-total vocabulary banned; the contract requires results only after close, and no kept answering order | `audit.mjs` |
| Anonymity leakage | eight contract terms required by content, rendered before the publish control, order checked in the DOM | `audit.mjs`, `view.mjs` |
| Individual-response exposure | no control on any screen may open one; no respondent may be named; no administrator exception may be written anywhere | `audit.mjs`, `view.mjs` |
| Urgency from elapsed time | urgency vocabulary banned, exclamation marks banned; elapsed time appears only as fact | `audit.mjs` |
| A visually preferred decision | every button in a row must be computationally identical, and none preselected | `view.mjs` |
| Dashboard / count overload | no bare-number element, no chart element, at most four cards, decision rows only where something waits | `view.mjs` |
| Management becoming Educator | the two homes' questions are compared against each other, not against a description | `audit.mjs` |
| Claims beyond existing capability | the banner must say adopted-but-not-authorised; the audit re-reads `hle.ts` and the migration so the claim cannot go quietly stale | `audit.mjs` |

**Forty-five planted defects, forty-five caught** — one per rule above,
plus the structural ones. Fourteen of them are new with these rulings, and
every anchor moved when the scenario changed, which is the standing cost of
pinning a plant to a literal string.

**What none of this proves.** That a dean with ten minutes finds this
useful; that needs deans. That the Indonesian reads well (STOP-4 again).
That a governed pool of five is the right pool — that is a content question
for whoever owns the instrument. And that educators would answer honestly at
all, which is a question about the institution rather than about the
software.

---

## Questions that genuinely need you

**Q1 — The ADR.** R1 adopts the concept and withholds authorisation. The ADR
has to settle the record class, the capabilities, the threshold policy and
retention before any schema exists. Nothing here should be read as more than
a demonstration of what would have to be decided.

**Q2 — The minimum disclosure threshold.** Deliberately blank. It interacts
with group size: a threshold that protects a department of twenty-six may
make a department of six permanently unreadable, and *"you can never ask
this group"* is a legitimate outcome that somebody has to accept out loud.

**Q3 — Is there any lawful path to an individual response?** AR-7 says no
product role, and R6 forbids an administrator exception in this design. If a
legal or safeguarding path must exist, the whole design changes shape,
because a path that exists is a path that can be asked for.

**Q4 — Who may request, and who may read?** Within one relationship this is
already awkward: the manager who requests educator feedback is the person it
is about. The prototype's answer is that the educators who answered read the
same summary their management reads — a surface that reports upwards on
people and not back to them is a surveillance tool — but in a small
department that is where the anonymity risk concentrates. Your call.

**Q5 — Retention.** R9 leaves the period open and fixes the constraint:
retention must not turn anonymous feedback into a longitudinal profile of a
learner, an educator or a manager. Someone still has to name a number.

**Q6 — Escalation governance.** R4 records the gap rather than filling it.
If a pattern in *student* feedback is serious and persistent, today there is
no path to the institution except a human telling someone. Whether that path
should exist, who may open it, and what it may carry, is an unresolved
product decision — and it is the one most likely to be filled in by accident
if nobody decides it on purpose.

**Q7 — Order of building.** The third card assumes Dean Institutional
Learning Intelligence exists and is honest about insufficient data. That is
BUILD NOW and unbuilt, and R13 keeps it ahead of Umpan Balik.

---

## Not done, by instruction

**Student** is not started. One note for when it is: the decision row does
not survive the crossing. Management decides *about* things; a student is
not choosing what PINTAR should do about them, and a row of buttons that
implies otherwise would be the same register error the Mini-PINTAR
adversarial pass caught late.

**The Educator feedback experience** — student → educator, the other half of
R2 — is recorded here and **not designed here**. The Educator view is
untouched by this patch; it is imported by the Management audit only so that
the two homes can be compared, and that import reads it without changing it.

**Umpan Balik is not implemented.** No schema, no migration, no capability,
no production route, no Slice 4 work. Everything in this directory is a
design sample that stores nothing and sends nothing.
