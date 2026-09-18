# MINI-PINTAR M1 — ADVERSARIAL PASS

**By:** Pete · **Date:** 2026-09-18 · **Against:** M1 as first drafted
**Result:** five defects found and fixed; two claims corrected; two questions
escalated to Sauron.

Stage N of the design process, run on my own work before Sauron reads it.
A reviewer's time is the scarcest thing in this project, and spending it on
defects I could have found myself is the most expensive way to use it.

Eight axes. Findings below are in order of consequence.

| # | Axis | Result |
|---|---|---|
| A | Item validity — is each key defensible? | 8 of 9 clean, **1 fixed** |
| B | Register and voice | **1 defect fixed** |
| C | Lesson ↔ check-question coherence | **1 defect fixed** |
| D | Outcome naming and claim strength | **1 defect fixed** |
| E | Justification honesty | **1 claim retracted** |
| F | Timing | **claim corrected, measured** |
| G | Adaptation edge cases | clean |
| H | Accessibility claims — implementable as stated? | clean, one note |

---

## A · Item validity

Each of the nine items was attacked with one question: **can a sophisticated
respondent defend a distractor as the best answer?** If yes, the item is
broken regardless of how well it teaches.

**P1 (D1), P2 (D2), P3 (D3) — clean.** The nearest miss is P1/B ("what was
last year's percentage"), which is genuinely useful information; but the
stem asks what is *most* needed to read *that* number fairly, and a trend of
two unintelligible numbers is worse than one. The option's own rationale
says so. Defensible.

**P2 is the strongest item in the set.** Its four options are a conclusion,
the reversed conclusion, the honest observation, and a conclusion rescued by
an unsupported qualifier — which is the error institutions actually make.

**U-D1-1, U-D1-2, U-D2-2, U-D3-1, U-D3-2 — clean.** U-D3-1 (self-selection
into a reading club) and U-D1-1 (90 % at 100 students vs 1,000) are the two
genuinely discriminating items; both are worth keeping exactly as written.

### DEFECT A-1 — U-D2-1 was too easy, and taught nothing

> **Was:** *"Apa yang paling perlu ditanyakan sebelum menyimpulkan bahwa
> program itu berhasil?"* with distractors about cost, principal approval,
> and demand from other classes.

Every distractor was transparently irrelevant to validity, so the item
discriminated nothing — and the correct answer ("what else changed") merely
restated the lesson's own sentence rather than asking the visitor to use it.

> **Now:** *"Mana yang paling menambah kekuatan buktinya?"* — A ✓ comparing
> with similar classes that did not take part; B adding more classes;
> C extending to two semesters; D gathering teachers' views.

B and C are the fix. Both are tempting, because *more* and *longer* feel
like stronger evidence, and neither creates a comparison. The item now
requires the concept rather than the sentence.

---

## B · Register and voice

### DEFECT B-1 — Mini-PINTAR was about to speak to adults as children

The architecture document proposed framing Pemetaan Awal in the product's
own words:

> *"Ini bukan ujian. **Jawabanmu** dipakai untuk menyusun peta bacaan yang
> pas **untukmu**."*

That sentence is `ANAK` register — it is what PINTAR says to a ten-year-old
— and the Peta Bacaan tier label carried the same problem (*"Sudah **kamu**
kuasai"*). Mini-PINTAR's visitor is a principal, a foundation board member
or a teacher, on a corporate website. That is `DEWASA`, and the Voice Guide
is unambiguous: **never speak down the ladder to an adult.**

This was the worst defect in the draft, and the least visible: every
individual string was correct *product* copy, which is exactly why it
survived the first writing. Borrowing a screen's words is right when you are
reconstructing that screen and wrong when you are building a live experience
for a different audience.

**Fixed** in §3.2, which now states the decision, gives the mapping for all
three affected strings, and explains why the
don't-alter-a-screenshot discipline does not apply here — nothing in
Mini-PINTAR is a reconstruction. The wireframes were re-rendered.

---

## C · Lesson ↔ check-question coherence

I asked of all six check questions: **is this answerable from the lesson the
visitor just read?** A check question whose answer was never taught is not a
check, it is a trick — and on a public site it would be a trick played by a
company arguing for evidential honesty.

Five of six passed. The sixth failed as a consequence of fixing A-1: the
strengthened U-D2-1 asks about a comparison group, and L-D2 taught
confounding without ever naming a comparison.

**DEFECT C-1, fixed.** L-D2's worked example, step 3, now reads *"…apa lagi
yang berubah pada waktu yang sama, **dan adakah kelompok serupa yang tidak
mencobanya**? Tanpa pembanding, buktinya belum memisahkan apa pun."*

**This is now a standing rule for the content**, recorded here so it survives
the next edit: *every check question must be answerable from the lesson
served with it.* Strengthening an item can break it, and the break is
invisible unless you re-check the pair.

---

## D · Outcome naming

### DEFECT D-1 — the best outcome was called `DIDUKUNG`

"Supported" is a claim about evidence, and two questions cannot support a
conclusion about mastery. The name contradicted the limit statement printed
directly beneath it — the one sentence Sauron approved verbatim.

**Fixed:** renamed **`KONSISTEN`**, and the headline changed from *"Yang
Anda baca tampak bisa Anda gunakan"* to *"Dua jawaban Anda sejalan dengan
bacaan itu."* Consistency is exactly what two answers can establish.

---

## E · Justification honesty

### RETRACTION E-1 — "`BELUM_CUKUP` is the commonest outcome" was false

The first draft argued that the honest refusal was the *modal* result,
because one-of-two is the likeliest score on a two-question check. That does
not survive contact with the design: the two questions come immediately
after the lesson that answers them, so an attentive visitor usually gets
both right. **Most visitors will see `KONSISTEN`.**

The claim mattered, because it was the reason I gave for the design being
honest — and Sauron was explicitly asked to confirm the outcome table on
that basis. Approving a design on a false premise is worse than the false
premise.

**Corrected in §4.2.** The doctrine is carried by the limit statement
appearing in *every* outcome, `KONSISTEN` included, rather than by the
distribution of outcomes. That is the stronger mechanism anyway: it does not
depend on most visitors being told they fell short. **Escalated to Sauron as
STOP-8**, since making the refusal modal is possible and would require
materially harder check questions — a product choice with a real cost.

---

## F · Timing

### CORRECTION F-1 — the experience is not 2–3 minutes

The architecture document put step times against the clock (Pemetaan Awal
0:10–0:55, Hasil 2:40–3:00). Those were asserted, never counted.

Counted, at 180 wpm plus five seconds of decision per question: the journey
is **3:17** and the whole thing **3:54** for a careful reader, **2:20** and
**2:45** for a fast one. The honest range is **2:20–3:55**.

**Partly fixed, partly escalated.** The three lesson bodies were trimmed
about 25 %, which is the cut available without damage, and §3.7 now carries
the measured table. The remaining gap is a product decision (STOP-7): I
recommend describing the experience as *"sekitar tiga menit" / "about three
minutes"* and keeping three Pemetaan Awal questions, because dropping to two
would leave the Peta Bacaan with two cards and make the adaptation look
thinner than it is.

Promising two minutes and delivering four would be a small dishonesty on a
website whose whole argument is that PINTAR does not overstate. It is a
small thing that the site cannot afford.

---

## G · Adaptation edge cases

All eight map shapes were walked by hand. Each produces a sensible,
non-repetitive map, and each of the four lesson presentations is reachable.

- **All three correct** → three KUAT cards plus the D2 extension reading.
  No manufactured weakness. Clean.
- **All three missed** → PERLU_SEGERA on D2, WAJIB on D3 and D1. Clean.
- **All three skipped** → same shape as all-missed, with the skip reason on
  every card. No error state, no scolding. Clean.
- **Mixed** → six remaining shapes, all sensible.

**The severity order (D2 > D3 > D1) is a judgement, not a measurement**, and
it is worth naming as such: concluding from too little is the error with the
largest institutional consequence; mistaking a link for a cause is next; a
missing denominator is the most easily repaired. If Sauron disagrees, the
order is one line of data.

---

## H · Accessibility claims

Every claim in §10 was checked for implementability rather than
aspiration — a specification that cannot be built is worse than none,
because it stops anyone asking.

All implementable. One note worth recording: the decision to expose a
persistent *Perlu arah?* button alongside the hesitation-triggered pill was
made for screen-reader users who read at their own pace, and it has a second
effect I should state plainly — **it removes WCAG 2.2.1 (Timing Adjustable)
from consideration entirely**, because help is no longer gated behind a
timer. An accessibility decision that makes a conformance question disappear
rather than answering it is the better kind.

---

## What this pass did not check

Recorded so the gaps are visible rather than assumed away.

- **Native Indonesian editorial quality.** I can check the Voice Guide's
  stated rules — `belum` versus `tidak`, pronoun and address, banned
  particles, register morphology — and I have. I cannot check whether a
  sentence *sounds* right to an Indonesian educator. STOP-4 stands.
- **Real visitor comprehension.** Whether the reveal actually produces "oh,
  now I understand" is an empirical question that needs people. No amount of
  self-review substitutes.
- **The English edition's naturalness** beyond my own ear.
- **Whether the three domains are the right three.** They are defensible and
  they align with the doctrine; another set might teach better.
