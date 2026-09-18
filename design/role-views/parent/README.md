# ROLE VIEW — PARENT

**"Bagaimana anak saya?" / "How is my child?"**

**Date:** 2026-09-18 · **Status:** for Sauron review. Parent only — Student
and Management remain undesigned, by instruction.

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
| Bukti cukup | **5.1 s** | 37 s | 51 s | 6.3 s | 43 s | 58 s |
| Bukti masih sedikit | **5.1 s** | 30 s | 44 s | 5.4 s | 35 s | 50 s |
| Ada pola berulang | **5.1 s** | 34 s | 48 s | 5.4 s | 38 s | 53 s |

Three numbers, not one, because they answer different questions. **Skim** is
the heading plus the first sentence. **Answer** is the whole of questions
1–4. **With notes** adds the ranking answer and the scope note, which a
parent reads once rather than every visit — they are reported rather than
budgeted, and saying so is the point of listing them separately.

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

A parent will ask. The page answers before they do, at the foot, without
being defensive:

> **Kalau Anda ingin tahu peringkat**
> PINTAR tidak memberi peringkat dan tidak membandingkan Rani dengan anak
> lain. Yang dibandingkan adalah pekerjaannya dengan materi yang sedang
> dipelajari.

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
| The verifiers can fail | `negative.sh` | seventeen planted defects, seventeen caught |

**What none of this proves.** That an Indonesian parent reads the headline
the way I intend — see A-1 below. That the design test passes with real
parents; that needs parents, and it is the only test that matters. That the
Indonesian is natural (the standing STOP-4 applies, and this adds more).

---

## Adversarial pass

Run against my own work before it reached you.

**A-1 · "Rani mengikuti materi yang sedang dipelajari" may be a peer
comparison in disguise.** *Mengikuti* can be heard as "keeping up with the
others" rather than "following the material". The grammar is defensible —
the object is the material, which is what the brief permits comparing
against — but connotation is not settled by grammar, and I cannot judge it.
**This is the single most important thing for a native reader to rule on.**
The English *"keeping up with the current lessons"* leans further toward
comparison than the Indonesian does, and may need rewording.

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

**Q1 — Is the parent experience moving out of LATER?** Everything above is
a design. Building any of it is a scope change requiring a recorded decision
and an ADR. Nothing here assumes the answer.

**Q2 — What may a guardian see?** Not a UI question. A parent row in doc
06's eligibility table is a policy decision about a third party reading a
learner's evidence, and it interacts with OD-9. The design assumes the
narrowest possible answer — one child, one page, no identifiers, nothing
about anyone else's child — but the narrowest answer is still an answer
someone has to give.

**Q3 — How often should a parent look?** Daily updates make a page a habit,
and an anxious parent will check a habit. Options: leave it live; update
weekly; or say when the next meaningful change is expected. I lean to the
third — it sets an expectation and removes the reason to refresh — but it is
a product decision about the relationship, not a layout choice.

**Q4 — Is "Rani" the right amount of identity?** A given name, no class, no
year, no identifier. Adjacent to OD-10.

**Q5 — What happens when the evidence is genuinely bad?** The three states
here cover steady, thin, and one repeating pattern. A state where a child is
a long way behind the current material is the hardest copy in the entire
product, and I have not written it, because writing it without a ruling on
how much PINTAR is willing to say to a parent would be guessing at the most
consequential sentence on the surface.

---

## Not done, by instruction

**Student** and **Management** remain undesigned. One note for whenever
Student comes: the register changes again, and the thing that is right here
— an adult being handed a limit and left to decide — is not obviously right
for a twelve-year-old being told what the evidence does not yet show about
them.
