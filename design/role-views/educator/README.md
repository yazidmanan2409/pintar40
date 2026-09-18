# ROLE VIEW — EDUCATOR

**"Apa yang perlu perhatian Anda hari ini?" / "What needs your attention today?"**

**Date:** 2026-09-18 · **Status:** for Sauron review. Educator only — Student
and Management are **not** designed yet, by instruction, so that the visual
grammar is reviewed once before it is propagated.

```
python3 -m http.server 8000 --directory .    # ?lang=en for English
```

---

## What this is, and is not

A **design sample**. Every figure and name on the page was written for
review; none of it comes from a school. The view is **not built** — the page
says so in a banner that is the first element in the document and has
nothing to dismiss it with, the same reasoning as
`src/app/_evaluation-banner.tsx`: its presence is a property of what this
is, so there is no state to remove it.

The decision buttons are inert on purpose. Wiring them to
`record_integrity_review` would make a sample look like a working surface,
which is the one thing the brief rules out.

---

## The sixty seconds, measured

Asserted step-times were wrong by half once already in this project (M1
§3.7), so this is counted rather than claimed. At 200 wpm:

| | Indonesian | English |
|---|---|---|
| **Orientation** — the frame plus each card's one-line *what happened* | **26 s** | **29 s** |
| **Orientation + reading one card in full** | **46 s** | **51 s** |
| Every word on the page, including the quiet footer | 90 s | 98 s |

The middle row is the brief's claim, and it is the one the audit enforces:
a person does not read three cards in full, they read three headlines and
then open the one they are going to act on. Reading *everything* takes about
a minute and a half, and that number is printed here so nobody is surprised
by it later.

`verify/audit.mjs` fails if orientation passes 35 s or if orientation plus
the longest single card passes 60 s. The budget is a build constraint, not
a note in a document.

---

## The visual grammar — the thing to review

Every card is the doctrine chain, in one fixed order, with the parts
labelled. The labels are the same on every card, which is what lets someone
who has understood the first card skim the second.

```
  TERTAHAN   Sertifikat · Kerja Laboratorium Dasar        sejak dua hari
  ────────────────────────────────────────────────────────────────────
  what happened, one sentence, set above body size — the skim line
  ────────────────────────────────────────────────────────────────────
  YANG DIDUKUNG BUKTI    the bounded reading
  YANG BELUM DIKETAHUI   the uncertainty, same size and colour
  LANGKAH YANG MUNGKIN   an offer, usually more than one
  ────────────────────────────────────────────────────────────────────
  KEPUTUSAN ANDA         [ do this ] [ or this ] [ this needed nothing ]
```

Seven decisions hold that grammar up. Each is checked, not just intended.

**1 · The uncertainty is set at the same size and the same colour as the
line above it.** Small print there would be the overclaim the chain exists
to prevent. `verify/view.mjs` measures both and fails if the uncertainty is
ever smaller or lighter.

**2 · Tones are on work, never on people.** A card's tone reaches exactly
two things: its left rule and its kind label — both of which name a *kind of
decision*. The sentence that names a learner is the same ink on every card
whatever the card's tone. Checked in the browser by comparing computed
colours, so a stylesheet cannot quietly colour a person later.

**3 · Every card can be decided as needing nothing.** Without that option
the row is a set of orders and "PINTAR proposes, the educator decides" stops
being true of the interface rather than just of the copy.

**4 · No option is styled as the primary one.** A primary button here would
be PINTAR choosing. Every option carries the same weight.

**5 · Order is stated and is not a ranking.** One line says what the order
is — what is holding someone else up comes first — and says it is an order,
not a ranking. The same sentence Mini-PINTAR uses about the Peta Bacaan, on
purpose: one product, one way of saying this.

**6 · Suppression is accounted for, not silent.** The page ends with what it
checked and found nothing in. "Nothing to report" and saying nothing are
different claims and only the first is honest about having looked. It
includes PINTAR turning the doctrine on itself: *question health signals —
not yet enough evidence to show anything*, because `question_health_state`
begins at `INSUFFICIENT_EVIDENCE` and the computation is not built.

**7 · Where PINTAR already has a word, this uses PINTAR's word.** The bucket
names, the three integrity decisions and the integrity explainer are
verbatim from `src/lib/hle.ts`; *butir penting* is the product's term for a
safety-critical item. `verify/audit.mjs` reads `hle.ts` and the migration and
fails if either side drifts — which is the only way "verbatim" survives
contact with time.

---

## What exists today, and what this proposes

Stating this precisely matters more than the design: the brief says not to
imply an unbuilt surface is production functionality, and the Educator's
home is the one place where part of it genuinely is.

**Already shipped.** `src/app/studio/page.tsx` renders the Studio home from
`studio_home()`. It is already task-first rather than a dashboard, and an
empty bucket **returns no row at all**, so a zero card cannot render — the
emptiness is in the data, not in a `count > 0` the page could forget. The
five buckets are `ACTION_REQUIRED`, `AWAITING_MY_REVIEW`, `BLOCKED`,
`QUESTION_HEALTH`, `DISTRIBUTED_CANONICAL`. `record_integrity_review`
accepts exactly three decisions and rejects anything else with *"an
integrity review records what the reviewer did, not a verdict about the
learner"*. INV-11 keeps assistance telemetry out of scoring entirely.

**What this view proposes on top of it.** Today the home shows a bucket and
a count. This shows the *item*, and the item carries the chain. That is the
whole proposal, and it is not built.

**What it would need that does not exist.** Named rather than glossed:

- Card three ("Perlu diketahui") has **no aggregate behind it.** Nothing in
  the product today groups reading maps across a class. See Q2.
- The quiet footer needs to know that a bucket was *evaluated and came back
  empty* — and `studio_home()` deliberately cannot tell you that, because it
  returns no row rather than a zero. See Q1.
- Elapsed time ("sejak dua hari") is not returned by `studio_home()` either.

---

## Open questions

**Q1 — the suppression footer wants data the home function deliberately
withholds.** `studio_home()` returns no row for an empty bucket, which is a
good decision: it makes a zero card unrenderable. But "checked, and not
waiting for you" needs exactly the distinction that choice erases — between
*evaluated and empty* and *not applicable to you*. Either a companion
function returns the evaluated bucket names without counts, or the footer
becomes static copy that claims a check it cannot prove. I would build the
companion; it is a small function and the alternative is a sentence that
sounds like evidence and is not. **Your call.**

**Q2 — should an educator surface aggregate learners at all?** Card three
is the first place PINTAR would compute something about a *group* rather
than a person. It is also the card most likely to be misread as "these five
students have a problem", which is why its uncertainty line says five of
twenty-eight is not enough to conclude a common cause. Doc 06 confines
institutional analytics to `OFFICIAL` evidence. I have designed the card
because it is the most interesting test of the grammar, and I am **not
proposing it for build** without a ruling.

**Q3 — how much of a learner does an educator surface show?** The held
certificate card names "Rani A. (7B)". OD-10 is open on identity
presentation for certificates and this is adjacent to it. Full name,
given-name-and-initial, or initials.

**Q4 — elapsed time.** "sejak dua hari" is a fact, and facts are allowed.
But a surface that shows elapsed time invites the reader to supply urgency
the system is refusing to manufacture. Keep it, or drop it and let the
ordering carry the same information implicitly?

**Q5 — the day with eleven cards.** Three fits the minute. Eleven does not,
and a scroll of eleven is the dashboard this view exists to not be. My
proposal: show what fits the minute, and say plainly how many are not shown
and where they are — never silently truncate, never scroll forever. This is
an editorial rule about what deserves a person's attention, so it is yours
rather than mine.

**Q6 — `AWAITING_MY_REVIEW` is not represented.** Three card *kinds* were
enough to establish the grammar; a fourth would have cost the sixty seconds
without testing anything new. Not an omission by accident.

---

## What holds the promises

| Promise | Where | How |
|---|---|---|
| The doctrine chain is complete on every card | `audit.mjs`, `view.mjs` | every part present in content; rendered in order as `dt`/`dd`, read back from the page |
| The uncertainty is never small print | `view.mjs` | computed size and colour compared against the line above it |
| No tone ever lands on a person | `view.mjs` | the prose naming a learner is one colour across all tones; nothing but the kind label takes the card's tone |
| Every card can be decided as needing nothing | `audit.mjs` | a refusal option must exist on every card |
| No rankings | `audit.mjs` | ranking vocabulary banned; "bukan peringkat" allowed as a negation |
| No people traffic lights | `audit.mjs` | at-risk / zone / flag vocabulary banned |
| No manufactured urgency | `audit.mjs` | urgency vocabulary banned, exclamation marks banned outright, "safety-critical" allowed as the term of art it is |
| No conclusion stronger than the evidence | `audit.mjs` | overclaim vocabulary banned |
| PINTAR's words stay PINTAR's | `audit.mjs` | five strings compared against `src/lib/hle.ts`; the decision set compared against the migration |
| It says it is a sample and not built | `audit.mjs`, `view.mjs` | banner text asserted, and asserted to be the first element with nothing to dismiss it |
| Sixty seconds | `audit.mjs` | measured at 200 wpm; fails over 35 s to orient or 60 s to orient and read one card |
| Contrast, text and non-text | `view.mjs` | measured at two widths in both languages |
| No text under 14 px, targets ≥ 44 px, no overflow 320–1440 | `view.mjs` | measured |
| The verifiers can fail | `negative.sh` | sixteen planted defects, sixteen caught |

**What none of this proves.** That an educator with fifteen minutes between
lessons actually finds this useful — that needs educators. That the
Indonesian reads well to a native speaker (the standing STOP-4 on the
Mini-PINTAR work applies here too, and this adds more Indonesian). That
three is the right number of cards on a real day.

---

## Not done, by instruction

**Student** ("What should I do now?") and **Management** ("What do I need to
know today?") are not designed. The brief says to stop here so the grammar
is reviewed once rather than propagated three times and corrected three
times.

Two things I would carry across, and one I would not:

- **Carry:** the labelled chain in a fixed order, and the rule that the
  uncertainty is never set smaller than the support.
- **Carry:** suppression that says what it checked.
- **Would not carry unchanged:** the decision row. A student's view answers
  "what should I do now?", and offering a twelve-year-old three buttons of
  which one is "this needed nothing" is an adult's affordance. That view
  needs its own thinking about what a learner is being invited to decide —
  and the register changes too, which is the trap the Mini-PINTAR
  adversarial pass caught late.
