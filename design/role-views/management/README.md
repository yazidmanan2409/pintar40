# ROLE VIEW — MANAGEMENT

**"Apa yang perlu saya ketahui hari ini, dan apakah ada keputusan yang
menunggu saya?"**
and the bounded **Umpan Balik Pembelajaran** experience.

**Date:** 2026-09-18 · **Status:** for Sauron review. Management only.
Student is not started.

```
python3 -m http.server 8000 --directory .
# ?lang=en · ?screen=beranda | umpan-mulai | umpan-pertanyaan | umpan-terbit
#            | umpan-hasil | umpan-tipis
```

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
scope mandate already behind it.

### Does not exist at all — and is on no list

**Umpan Balik Pembelajaran.** Not a table, not a capability, not a string,
not a row anywhere. And it is on **none** of doc 09's lists: not BUILD NOW,
not LATER, not PARK. It is a new concept.

Adopting it is a product and architecture decision with an ADR — it needs a
new record class, a new capability, new tables and an answer to a privacy
question this design deliberately leaves open. **Nothing in this repository
should be read as PINTAR having adopted it.** The sample banner says so on
every screen, and `verify/audit.mjs` re-reads `hle.ts` and the foundation
migration on every run so that the claim goes stale loudly rather than
quietly.

---

## The home, in sixty seconds

| | ID | EN |
|---|---|---|
| Orientation — the frame plus each item's one-line *what happened* | **24 s** | **26 s** |
| Orientation + reading the longest item in full | **42 s** | **46 s** |
| Every item in full | 67 s | 76 s |

The middle row is the claim, and the audit fails over 35 s to orient or 60 s
to orient and read one item.

**Three items, and only two carry a decision.** The third — the report that
cannot yet be computed — has no buttons at all. That is how the page answers
*"is anything waiting for me"* without a counter: if an item has a decision
row, it is waiting; if it does not, it is not. `verify/view.mjs` asserts the
number of decision rows equals the number of items that wait on someone.

**It is not a dashboard, and that is checked.** No tiles, no counters, no
charts: the browser fails the run if any element on the home is a bare
number, or if a `svg`, `canvas`, `progress` or `meter` appears.

---

## Umpan Balik Pembelajaran — the bounded experience

Five screens. Not a survey builder.

**1 · Mulai.** One educator, one class, one period. The boundary is stated
before anything else: *"Yang ditanyakan adalah apa yang siswa alami, bukan
seberapa baik pendidiknya. Hasilnya bukan penilaian kinerja."*

**2 · Pertanyaan.** A governed pool of five, nothing authored. Every
question is about what the student can observe, in the first person —
`verify/audit.mjs` fails a pool question that is not about the asker. The
page says plainly that questions asking students to rate their educator are
not in the pool **and cannot be added**, and that there is no free-text box,
with the reason: open comments raise anonymity problems that are not yet
answered.

Answers are a five-band frequency — *hampir selalu · sering · kadang ·
jarang · hampir tidak pernah*. Frequency rather than agreement, because it
asks how often something happened to the student rather than how much they
approve of someone.

**3 · Terbitkan.** The anonymity contract is stated **before** the publish
control, not reassuringly afterwards. The browser checks the document order.

**4 · Hasil.** Question by question, in words, across named bands. **No
composite, no average, no percentage** — a single figure standing for a
class is a score, and a score becomes a rank the first time two of them sit
side by side. The audit fails a row that is one figure, contains a decimal,
or contains a `%`.

**5 · Tanggapan sedikit.** *"Belum cukup tanggapan untuk menampilkan hasil
dengan aman."* No partial result, no single question, no running count —
and **no number**, because the threshold is a privacy decision and inventing
one here would be answering it with a mockup.

---

## The anonymity contract — proposed architectural requirements

**None of these exists.** They are what would have to be true, written as
requirements rather than as reassurance, so that a future implementation can
be checked against them.

**AR-1 · Two records, no link.** A participation record — this eligible
learner, this request, submitted once — and a response record carrying the
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
unresolved.**

**AR-6 · The threshold survives every future cut.** Any filter or subgroup
re-applies the threshold to the subgroup, never to the whole. A result that
passes for a class and is then sliced by anything can fall below it.

**AR-7 · No individual response is readable by any product role.** Not
management, not the educator, not the institution admin. If a lawful path
must exist, it is a separate audited non-product path — and whether it
should exist is itself an open decision.

**AR-8 · Participation is never exposed to the educator.** Not who answered,
not who did not, and not a count that makes it deducible in a small class.

**AR-9 · A new record class, not a new evidence class.** Feedback is not
assessment evidence. It must never enter `responses`, never carry an
`evidence_class`, and never reach a scoring or certification path. It needs
its own entry in `record_class_registry`, almost certainly
`INSTITUTION_SCOPED` — it must not travel with a learner on Transfer,
because it is not the learner's record at all.

**AR-10 · A new capability, and probably two.** No existing `CAN_*` covers
requesting feedback. Requesting it and reading the consolidated result are
plausibly different capabilities.

**AR-11 · Feedback never touches a learner.** No learner's evidence, score,
map or result changes because of anything submitted here — the principle
INV-11 applies to assistance telemetry, applied to a different record.

---

## The management result is not a verdict

> **Supported:** students' responses about opportunities to ask questions
> are mixed.
> **Not supported:** therefore the educator is ineffective.

That boundary is on the screen, in the *yang belum diketahui* line, in both
languages. The consolidated result answers four things and no more: what the
responses show, what they do not establish, whether there is a reasonable
next step, and whether management needs to decide.

Four decisions, all at the same weight, one of which is **Tidak ada tindakan
sekarang**. `verify/view.mjs` compares the computed background, colour,
border, weight, size and height of every button in a decision row and fails
if any differs, and fails if any is preselected. *No action* must be
available without being the recommendation, and without being the quiet one
at the end.

---

## Adversarial pass — the ten axes

| Axis | Defence | Checked by |
|---|---|---|
| Ranking leakage | banned vocabulary incl. percentile, above/below average, ordinal placement, "compared with other classes" | `audit.mjs` |
| Teacher scoring or classification | banned vocabulary; and structurally — every result row must be a multi-band distribution, never one figure, no decimal, no `%` | `audit.mjs` |
| Unsupported causal conclusions | banned constructions; and the boundary sentence is required on the result | `audit.mjs` |
| False certainty from small samples | the thin-response state exists and carries its sentence; the step line names the four who did not answer | `audit.mjs`, `view.mjs` |
| Anonymity leakage | six contract terms required by content, rendered before the publish control, order checked in the DOM | `audit.mjs`, `view.mjs` |
| Individual-response exposure | no control on any screen may open one; no respondent may be named; the result says sheets are available to nobody | `view.mjs` |
| Urgency from elapsed time | urgency vocabulary banned, exclamation marks banned; elapsed time appears only as fact | `audit.mjs` |
| A visually preferred decision | every button in a row must be computationally identical, and none preselected | `view.mjs` |
| Dashboard / count overload | no bare-number element, no chart element, at most four cards, decision rows only where something waits | `view.mjs` |
| Claims beyond existing capability | the banner must say the concept does not exist; the audit re-reads `hle.ts` and the migration so the claim cannot go quietly stale | `audit.mjs` |

**Twenty-one planted defects, twenty-one caught** — one per axis, plus the
usual structural ones.

**What none of this proves.** That a dean with ten minutes finds this
useful; that needs deans. That the Indonesian reads well (STOP-4 again).
That a governed pool of five is the right pool — that is a content question
for whoever owns the instrument.

---

## Questions that genuinely need you

**Q1 — Is Umpan Balik Pembelajaran adopted at all?** It is on no list.
Adopting it means a new record class, at least one new capability, new
tables and an ADR. Everything above is a design for something that has not
been agreed to exist.

**Q2 — The minimum disclosure threshold.** A privacy decision, deliberately
left blank. It interacts with class size: a threshold that protects a class
of thirty may make a class of twelve permanently unreadable, and "you can
never ask this class" is a legitimate outcome that somebody has to accept
out loud.

**Q3 — Is there any lawful path to an individual response?** AR-7 says no
product role. If a legal or safeguarding path must exist, the whole design
changes shape, because a path that exists is a path that can be asked for.

**Q4 — Who may request, and who may read?** Requesting feedback about an
educator and reading the result may not belong to the same person. And the
harder half: **should the educator see their own class's result?** I think
they should — a surface that reports on someone to their manager but not to
them is a surveillance tool — but in a small class that is where the
anonymity risk concentrates, and it is your call, not mine.

**Q5 — Retention.** How long a consolidated result lives, and whether it
survives the educator leaving. Not asked here and not designed.

**Q6 — Order of building.** The third card assumes Dean Institutional
Learning Intelligence exists and is honest about insufficient data. That is
BUILD NOW and unbuilt. A management home built before it would have one
fewer kind of item and would be the poorer for it.

---

## Not done, by instruction

**Student** is not started. One note for when it is: the decision row does
not survive the crossing. Management decides *about* things; a student is
not choosing what PINTAR should do about them, and a row of buttons that
implies otherwise would be the same register error the Mini-PINTAR
adversarial pass caught late.
