# ROLE VIEW — PARENT

**"Bagaimana anak saya?" / "How is my child?"**

**Date:** 2026-09-18 · **Status:** grammar approved; rulings R1–R8 applied.
Parent only — Student and Management remain undesigned, by instruction.

## Rulings applied

| | Ruling | What changed |
|---|---|---|
| **R1** | Parent remains LATER; no implementation scope | Nothing built, nothing proposed for build. This patch adds no scope. |
| **R2** | No keeping-up language | *"Rani mengikuti materi"* / *"Rani is keeping up"* → **"Pekerjaan Rani sejalan dengan materi yang sedang dipelajari"**. The sentence now has no second party in it at all. Enforced as a rule, not an edit. |
| **R3** | The ranking answer becomes secondary | It is a closed disclosure at the foot. The explanation is unchanged and one click away, in both languages. |
| **R4** | Guardian access means a bounded parent-facing interpretation | Recorded below as the shape any future doc 06 row would take — **not** a general read of learner evidence. |
| **R5** | No daily-refresh behaviour | *"Diperbarui hari ini"* removed rather than replaced. The page states no cadence, and cadence words are now banned. |
| **R6** | Given name is sufficient | Closed. |
| **R7** | Do not invent the concerning-evidence state | Recorded as an unresolved product decision, below. |
| **R8** | Preserve the rest | Evidence boundaries, identical palette, the five-second rule, mobile-first comprehension and *"saran, bukan tugas"* all still enforced, and all checks re-run. |

```
python3 -m http.server 8000 --directory .
# ?lang=en · ?state=berjalan | belum-cukup | perlu-perhatian
```

---

## Before anything else: this could not be built today

Not "is not built" — **could not be**. The Educator view sat on a surface
that exists. This one does not, and the gap is not a sprint.

| Missing | What exists today |
|---|---|
| **A parent principal** | `Persona` in `src/lib/hle.ts` is `learner \| educator \| staff \| public`. There is no parent. |
| **A guardian relationship** | Nothing in the schema links a person to a learner as their guardian. "Guardian" appears in the baseline only as *"learner/guardian per policy"* on Transfer authorization. |
| **A parent row in the evidence contract** | Doc 06's eligibility table names six consumers. A parent is not one of them, so there is no answer to "which evidence class may a parent read". |
| **A parent register** | Every string on this page would be a new persona in the Human Language Engine. `t(event, persona)` has nowhere to put it. |
| **A consent and identity policy** | OD-9 is OPEN on learner/guardian consent for Transfer. What a guardian may see, and who authorises it, is the adjacent unanswered question. |
| **A cross-session view of one learner** | `official_results` is per session. "Across twelve activities this month" needs an aggregate that does not exist — a query, not a new evidence class, but still new surface. |

And the governing line, `docs/rebuild/09-PINTAR-V1-SCOPE-BOUNDARIES.md`,
LATER list: **"Broader institutional operations; parent experience."**

Designing it does not move it. Building it would be a scope change needing
an explicit product-owner decision and an ADR — the same road OD-11 took to
ADR-0021.

**Everything on the page is invented for review.** The banner is the first
element in the document and has nothing to dismiss it with.

---

## The one question, and the four answers

The page answers *"Bagaimana anak saya?"* and nothing else. In order:

1. **Bagaimana perkembangannya** — the headline and the sentence under it.
2. **Yang sudah terlihat** — what the evidence supports.
3. **Yang perlu perhatian** — and, in the same breath, what it does not
   establish.
4. **Yang bisa Anda lakukan** — one small thing, framed as a suggestion.

Then two standing notes at the foot: the ranking answer, and what this page
cannot see.

---

## The five-second rule, measured

*"The parent must understand the essential message from the heading + first
sentence alone."* Indonesian measured first, as instructed; English is
first-class and reported beside it. At 200 wpm.

| State | ID skim | ID answer | ID with notes | EN skim | EN answer | EN with notes |
|---|---|---|---|---|---|---|
| Bukti cukup | **5.1 s** | 37 s | 51 s | 5.7 s | 42 s | 58 s |
| Bukti masih sedikit | **5.1 s** | 30 s | 44 s | 5.4 s | 35 s | 50 s |
| Ada pola berulang | **5.1 s** | 34 s | 48 s | 5.4 s | 38 s | 53 s |

Three numbers, not one, because they answer different questions. **Skim** is
the heading plus the first sentence. **Answer** is the whole of questions
1–4. **With notes** adds the scope note and the ranking explanation — and
since R3 the ranking explanation is behind a disclosure, so the third
column is now the cost of a parent who opens it, not of every visit.

After R2 the Indonesian skim stayed at 5.1 s in all three states; the
replacement sentence was tightened by two words to keep it there.

`verify/audit.mjs` fails if the Indonesian skim passes 18 words or the
Indonesian answer passes 40 seconds.

**The skim is also measured as a physical fact.** `verify/view.mjs` loads
every state at 390 × 844 and fails if the line telling the parent whether
they need to do anything falls below the fold. A parent should never scroll
to find out whether they must act.

**The first draft failed this.** The whole page read in 58 s Indonesian and
70 s English. The fix was structural rather than word-shaving: one
paragraph per state said what the scope note already said once for the whole
page, and two paragraphs of limit were doing the work of one.

---

## The ranking question

A parent will ask. Since R3 the answer is **on demand**: a closed disclosure at the foot,
showing only the question a parent might ask. Open it and the explanation is
unchanged.

> **Kalau Anda ingin tahu peringkat** ▸
> PINTAR tidak memberi peringkat dan tidak membandingkan Rani dengan anak
> lain. Yang dibandingkan adalah pekerjaannya dengan materi yang sedang
> dipelajari.

A parent who is not asking about rank no longer reads about it every visit;
one who is asking finds it without hunting. `verify/view.mjs` asserts it is
closed by default, that the explanation is genuinely absent from the page
until asked for, and that one click restores it word for word — in both
languages.

The audit bans the disguises as well as the word: percentile, above or below
average, top-anything, "better than most", a place in an order. It also
requires the note to **name what is compared instead** — a refusal that does
not redirect is a door with nothing behind it.

**The strongest attack on this design, and the answer.** Three states named
*Bukti cukup / Bukti masih sedikit / Ada pola berulang* are a three-band
classification, however carefully the sentences are written — if a parent
ever sees the band. They do not. The names exist only in the review switcher
inside the sample banner; a parent gets a sentence about their own child's
work and no label at all. `verify/view.mjs` asserts that no state name
appears in the parent's view as an element's own text, in either language,
in any state. The argument is a property rather than a promise.

The names were also changed during this pass: they were *Berjalan / Belum
cukup bukti / Perlu perhatian*, which echoed the page's own headings and
read like bands. They now describe the state of the **evidence**, which is
what they actually are.

---

## Evidence language

Describe the observed pattern; never the child.

> Dari dua belas kegiatan bulan ini, **bukti menunjukkan** Rani membaca
> pecahan sebagai bagian dari keseluruhan — berulang, bukan sekali.

Not *"Rani sudah menguasai pecahan"*, and certainly not *"Rani lemah
dalam…"*. The audit bans `lemah`, `malas`, `tidak mampu`, *is weak*,
*struggles with*, *poor at*; it bans the permanent labels — *Sangat Baik /
Baik sekali / Cukup baik / Kurang baik / predikat / kategori* and their
English equivalents; and it bans PINTAR's own vocabulary outright, because a
parent should not have to learn *Pemetaan Awal* or *Uji Penguasaan* to find
out how their child is.

**Every finding is followed immediately by its limit, at the same size and
one step of colour quieter — never as small print.** The browser measures
that.

> Empat dari enam cukup untuk diperhatikan, belum cukup untuk memastikan
> sebabnya — apakah soal caranya, soal waktu, atau bentuk soalnya.

**"Belum cukup bukti" is a first-class answer**, and one of the three states
exists to carry it. Its most important sentence is the one that refuses the
comfortable reading:

> Tidak ada yang perlu perhatian saat ini.
> **Bukan karena semuanya baik — karena belum ada cukup bukti untuk
> mengatakan apa pun.**

The audit fails if that state is ever removed.

---

## Action

One small thing, or none. Never homework.

> Minta Rani menjelaskan dengan kata-katanya sendiri bagaimana ia tahu
> pecahan mana yang lebih besar. Mendengarkan lebih berguna daripada
> mengoreksi.
> *Ini saran, bukan tugas. Latihan tambahan tidak diperlukan di sini.*

*"Ini saran, bukan tugas"* is the parent-register form of *"PINTAR
mengusulkan, pendidik memutuskan"*. **"Talk to the teacher" is always
available and never presented as a recommendation** — including in the state
where the action is "nothing". A parent who wants to speak to a teacher
should not have to be told to.

---

## What this carries from the Educator view, and what it does not

**Carried:** the chain — what happened, what the evidence supports, what
remains uncertain, a possible step, a human decision. The rule that the
limit is never set smaller or lighter than the finding. Suppression that
says what it looked at.

**Deliberately not carried:** the card UI. No cards, no tone rules, no
tracked micro-labels, no row of decision buttons. The Educator's grid of
labelled chain parts is right for someone working through a queue between
lessons and wrong for a parent on a phone who wants one answer. The chain is
carried by sentences here instead of by a grid.

**And nothing on this page is coloured by how the child is doing.** There is
no status tone, no band, no badge — a colour that changes with the news is a
traffic light on a child whatever it is called. `verify/view.mjs` renders
every state and compares the complete set of computed colours; they must be
identical.

---

## What holds the promises

| Promise | Where | How |
|---|---|---|
| The five-second skim | `audit.mjs`, `view.mjs` | measured in words; and the signpost must be above the fold at 390 × 844 |
| The answer well under sixty seconds | `audit.mjs` | measured; fails over 40 s Indonesian |
| All three design-test answers are in the skim | `audit.mjs` | the top block must carry an attention signal and an action signal |
| No ranking, in any disguise | `audit.mjs` | percentile, above/below average, top-anything, ordinal placement — and the refusal must name what is compared instead |
| No permanent labels | `audit.mjs` | Sangat Baik / Cukup / Kurang / predikat / kategori and English equivalents |
| The child is never described where the evidence describes a pattern | `audit.mjs` | *lemah*, *malas*, *tidak mampu*, *is weak*, *struggles with* |
| No PINTAR vocabulary | `audit.mjs` | the product's own terms banned outright |
| No identifier | `audit.mjs`, `view.mjs` | NIS, student id, UUIDs and long digit runs, in the copy **and in the URL** |
| Nothing is coloured by the news | `view.mjs` | every state's full computed palette compared; they must be identical |
| No state is ever shown as a label | `view.mjs` | no element in the parent's view has a state name as its own text |
| The limit is never small print | `view.mjs` | computed size and weight compared against the finding above it |
| The four questions, in order | `view.mjs` | headings read off the page in sequence |
| "Belum cukup bukti" stays reachable | `audit.mjs` | fails if the state is removed |
| Contrast, type floor, targets, reflow 320–1440 | `view.mjs` | measured in three states and two languages |
| No keeping-up language (R2) | `audit.mjs` | *mengikuti materi*, *keeping up*, *on track*, *behind the class* and their family |
| The ranking answer is secondary, and intact (R3) | `view.mjs` | closed by default, absent from the page until asked for, word-for-word after one click, both languages |
| The page sets no update cadence (R5) | `audit.mjs`, `view.mjs` | cadence words banned; the chrome is read back and must carry none |
| The verifiers can fail | `negative.sh` | twenty-two planted defects, twenty-two caught |

**What none of this proves.** That an Indonesian parent reads the headline
the way I intend — see A-1 below. That the design test passes with real
parents; that needs parents, and it is the only test that matters. That the
Indonesian is natural (the standing STOP-4 applies, and this adds more).

---

## Adversarial pass

Run against my own work before it reached you.

**A-1 · RESOLVED by R2.** *Mengikuti* could be heard as "keeping up with the
others" rather than "following the material", and the English *"keeping
up"* leaned further that way. Both are gone. The headline now states a
relationship between Rani's work and the material — *"Pekerjaan Rani
sejalan dengan materi yang sedang dipelajari"* — with no second party in
the sentence to compare her to. The audit bans the whole family of
keeping-up phrasings so it cannot come back by accident.

**A-2 · Three named states are a classification.** Addressed above, and
turned into an enforced property rather than an argument.

**A-3 · "Diperbarui hari ini" invites daily checking.** A page a parent
refreshes every evening is a surveillance surface with a calm voice. Raised
as Q3.

**A-4 · The action in the thin-evidence state is "nothing", and there is
still a button.** Deliberate, and stated above; a parent should never need
permission to talk to a teacher.

**A-5 · "Ada satu hal kecil yang bisa Anda lakukan."** *Kecil* is
calibration, not minimisation — but it is the kind of word that becomes
minimisation when the news is worse than the example. Worth watching if more
states are added.

---

## Questions that genuinely need you

**RESOLVED — Q1, scope.** Parent remains LATER (R1). Nothing here is
proposed for build, and this patch created no implementation scope.

**RESOLVED — Q4, identity.** A given name is sufficient (R6).

**RULED, and recorded as an architectural constraint — guardian access
(R4).** Any future doc 06 row for a parent is a row for a **bounded
parent-facing interpretation**, not for general access to learner evidence.
That is a stronger statement than "the narrowest answer" and worth writing
down precisely, because it decides the shape of the thing before anyone
designs it: a parent surface would read a purpose-built, bounded reading of
the evidence, and a guardian principal would never be granted a general
evidence read that a UI then narrows. The narrowing belongs in the contract,
not in the page.

**UNRESOLVED — update cadence (R5).** The page designs no refresh
behaviour, states no cadence, and the audit now bans cadence words. The
standing intent is that a parent update should eventually correspond to
**meaningful new evidence** rather than to a clock; what counts as
meaningful, and how a parent is told, is open.

**UNRESOLVED — the genuinely-concerning-evidence state (R7).** Not
invented, by ruling. The three states here cover steady, thin, and one
repeating pattern. A state where the evidence is genuinely worrying is the
hardest copy in the product: it decides how much PINTAR is willing to say to
a parent about their own child, and it cannot be written as a guess. It
stays a product decision, recorded here so it is not mistaken for an
oversight.

---

## Not done, by instruction

**Student** and **Management** remain undesigned. One note for whenever
Student comes: the register changes again, and the thing that is right here
— an adult being handed a limit and left to decide — is not obviously right
for a twelve-year-old being told what the evidence does not yet show about
them.
