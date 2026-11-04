# Visual Intelligence

**Status: ADOPTED as a cross-application principle (owner's direction, 4 Nov), for PINTAR 4.0 and after.** This section adopts the direction into the existing grammar. It changes no approved 4.0 work and adds nothing to the 4.0 scope. Patterns marked **candidate** are designed and scheduled one at a time, each with its own decision.

## The principle: SEE → UNDERSTAND → ACT

PINTAR does the hard work of organising and analysing, so a reader doesn't have to.

| Layer | Target | What it holds | In this system |
|---|---|---|---|
| **See** | 3–5 s | The one pattern that matters, said in words and shown in one picture | The figure's sentence (the built sentence, first), then the figure. The `pintar-primary` accent marks the one value the page is about; everything else is `ink-3` (Accent) |
| **Understand** | 10–15 s | Why it matters: the base, the period, the comparison, what is missing | The population line (`pds-populasi`), the base heading («Hasil 6 murid yang sudah mengerjakan»), the period, and the «not yet» statement where evidence is short (P14) |
| **Act** | 30 s | The next step a reader may take | The section's one action, beside its figure (P1, P5). Where the evidence can be opened, «Lihat bukti» (C2) |

These are design targets. They don't claim that every complex question can be understood in 30 seconds.

**Progressive disclosure keeps P17.** Layer 1 must stand on its own and is never behind a disclosure. Layers 2 and 3 may sit behind one only when they are optional reading: methodology, per-item detail, the full table. Required context (the base, the period, missing evidence) is in layer 2 and is always visible.

## Design around the question, not the chart

Every visualisation starts from a five-line brief, kept in its composition's README:

1. **Audience:** a role from the table below, at the access that role holds.
2. **Question:** the reader's own question, in their words. Not «Hasil Uji Penguasaan» but «Kompetensi mana yang paling sulit bagi kelas ini, seberapa besar, dan di mana saya mulai?»
3. **Message:** the one sentence the picture must make obvious.
4. **Evidence:** the metric, its base, its period, and its minimum sample.
5. **Action:** what the reader can do next, and where.

The chart comes last. A pie, a bar or a list is right when it is the clearest answer. An expressive form is right only when it is clearer, never because it looks impressive.

| Audience | Their question | Their level of detail |
|---|---|---|
| Teacher | Where are my class's gaps, how serious are they, who needs help next? | Their classes, down to the student and the item |
| Student | How am I doing, what am I good at, what can I do next? | Their own work only. Never a rank, never a peer comparison, and no alarm (a rule made here) |
| Head of department | Where do classes, subjects and periods differ? | Classes in their scope; a student only through the evidence they may open |
| Principal | Is learning moving across the school, where are concerns emerging, did interventions help? | The school, by class and cohort |
| Management | How is the institution doing, and what evidence supports a decision? | Aggregates in their scope |

Access stays as it is. `generate_report` re-authorises per metric for each viewer, and a visualisation never shows more than the figure it draws.

## Analytical integrity (non-negotiable)

Each rule is either already in the system or is made a rule here. An attractive picture that misleads is a failure, whatever its comprehension score.

| Rule | How |
|---|---|
| No distorted scale | A bar or band starts at zero and is drawn over its own base. A change shows both ends; an axis never starts above zero to make a difference look bigger. Slopes share one scale |
| Score is not mastery | Actual scores and the mastery threshold are drawn differently: the score is a mark, the threshold is a labelled line («Target 75»). They are never merged into one colour |
| The real distribution | Students are drawn as they are (one mark each, or counts per band). No smoothing, no curve fitted, no imposed bell shape |
| Base and period named | Every figure says whom it covers («Hasil 24 dari 31 murid») and when («Okt 2026», or «Sep → Okt 2026»). A comparison names both of its sides |
| Missing evidence shown | «Belum mengerjakan» is a count in the population line, never a bar or a band (D-121(c), D-123(3)). Below the minimum, the «not yet» statement takes the figure's place in the same shape (P14). A small group follows O3 (D-176): below five, «not yet» |
| Observed vs inferred | What PINTAR observed is stated; an explanation PINTAR infers is marked as an inference (its words go through copy approval), and only where engineering's metric defines it. No causal claim («karena …») unless the metric is causal |
| Students' results are not a teacher's rating | No figure ranks, colours or lists teachers by their classes' results. Classes are labelled by class; «Guru: …» stays a fact about who teaches, never a score |
| Colour never alone | Every encoding has a second channel: a number, a word, a position or a shape (C1: no band, figure or state is coloured to carry meaning) |
| Privacy | The same minimum samples and the same access as the figure's metric; a cell or mark that would identify a student below them is «not yet», not hidden and not drawn |
| Evidence traceable | A reader who is allowed can open the evidence behind a figure (layer 3), and the evidence shows the same base and period |

**Daisy designs how a figure is shown, never what it is.** Metric definitions, calculations, thresholds, minimum samples and bands stay engineering's and the owner's (C1 §1).

## The grammar of a visualisation

- **Calm.** It uses the existing type scale, space, 1 px lines, flat surfaces and the soft palette. No 3D, no gradients, no decorative motion; a figure doesn't animate in (Progress: «a bar never moves by itself»).
- **One accent.** `pintar-primary` marks the value the page is about. Everything else is `ink-3` or `line`. Status colours appear only where there is a state, each with its word and icon.
- **Consistent meanings.** One meaning per mark across PINTAR:

  | Mark | Meaning everywhere |
  |---|---|
  | Filled dot | One student's actual result |
  | Labelled line | A threshold, a target or a mastery level |
  | Arrow up / down / level, with its word | A change between two named periods |
  | Hollow mark or «—» with a sentence | No evidence yet |
  | `pintar-primary` | The one value the page is about |

- **Direct labels.** A value is labelled where it is drawn, and a legend is used only when direct labels can't fit. Figures are tabular.
- **Accessible.** Every figure has a text equivalent that carries the full message: the sentence, plus a table or list in the page (not only `aria-label`). Drawn shapes are `aria-hidden` when the text beside them says the same (as C1's feedback bars). Contrast is 3:1 for marks and 4.5:1 for text. Each figure is checked at 1280, 820, 390 and 320 px, and on A4.
- **Responsive.** At 390 and 320 px a figure becomes its simplest truthful form (a list with values, or small multiples stacked one per row), never a squeezed chart. It never scrolls sideways.
- **Print.** A figure doesn't split across pages. It prints in ink only, with its labels, its base and its period.

## The library

Each pattern is one entry with eight fields: **question; use and misuse; data and calculation (engineering's); encoding and interaction; accessibility; evidence and privacy; mobile and print; acceptance tests.** A module never draws its own custom graphic: it uses an entry, or proposes a new one through this section.

### Approved (already in the 4.0 grammar)

| # | Pattern | Answers | Where |
|---|---|---|---|
| VI-1 | **A count** with its bar | How far, as a committed count | Progress `pds-progress` |
| VI-2 | **The population line** | Whom a figure covers, and who is missing | Progress `pds-populasi`; C1 |
| VI-3 | **Bands over their base** | How results spread across the bands, in the fixed order | C1 «Sebaran hasil Uji Penguasaan» |
| VI-4 | **Ranked rows** | Which items matter most, up to eight | C1 «Pemahaman keliru yang berulang», «Capaian kompetensi» |
| VI-5 | **The statement in the figure's place** | Why there is no figure yet, how far it is, what makes it appear | P14; C1, C2, A3 |
| VI-6 | **A single figure with its base** | One number and what it is out of | A2 «Rata-rata nilai kelas»; C1 single figures |
| VI-7 | **Response bars** | How responses divide, the count as text | C1 part B feedback |

### Candidates (later versions, each scheduled on its own)

Each candidate is a direction, not a design yet. When one is scheduled, Daisy draws two or three approaches against its question, with invented data, and picks the one that answers it most accurately and quickly. Comprehension is tested with representative readers where practical: a principal must not need a developer to read the main message.

| # | Pattern | The question | Integrity notes | Needs before design |
|---|---|---|---|---|
| VI-C1 | **Distribution strip:** one dot per student on the score line, with the target as a labelled line | «Bagaimana sebaran nilai kelas saya sebenarnya, dan berapa yang belum mencapai target?» | Real dots, no curve; the target drawn apart from the scores; below the minimum, «not yet» | Per-student scores available to that role at that surface |
| VI-C2 | **Slope:** two named periods, one line per class or cohort, on one shared scale | «Kelas mana yang naik dan mana yang turun antara Sep dan Okt?» | Both periods and bases named; no line where a base is below the minimum | A comparison metric with two periods (Kenaikan, Perbandingan angkatan) |
| VI-C3 | **Small multiples:** the same small figure per class, same scale, side by side | «Di kelas mana pola ini berbeda?» (head of department) | Labelled by class, never by teacher; one scale for all | The per-class metric in the reader's scope |
| VI-C4 | **Competency grid:** competencies × classes (or students), each cell a value and a mark | «Kompetensi mana yang sulit, dan di mana sulitnya terkumpul?» | Each cell shows its number, not colour alone; cells below the minimum are «not yet» | A colour decision (see below) and a per-cell minimum |
| VI-C5 | **Progression path:** where students stand between the named stages, and how many moved | «Berapa murid yang sudah berpindah tahap, dan di mana mereka tertahan?» | Counts on each path; moves are observed, not inferred | Stage transitions recorded over a period |
| VI-C6 | **Annotated timeline:** one measure over named dates, with events PINTAR knows (a package published, a test held) | «Apa yang berubah, dan kapan?» | An annotation marks a coincidence in time, never a cause | A time series of the metric |
| VI-C7 | **A student's own path:** strengths and the next achievable step, in their words | «Apa yang sudah saya kuasai, dan apa langkah saya berikutnya?» | No rank, no peers, no alarm; «belum» is never red | The student's own mastery by competency |

**One decision the library will need, and not now.** VI-C4 needs a sequential ramp, a colour role that the palette doesn't have; adding one is a token change. It is raised when VI-C4 is scheduled, not before. Every other candidate fits today's tokens: `ink-3` marks, one `pintar-primary` accent, and `line` for thresholds.

## Applied to the 4.0 scope, without changing it

The approved 4.0 compositions were checked against this section:

| Composition | See → Understand → Act | Integrity | Note |
|---|---|---|---|
| C1 Ringkasan Kelas and Sekolah | The built sentence leads each figure; the base and population line follow; printing is the one action | Bands over their base; missing evidence as «not yet»; colour carries no meaning | Meets it. VI-C1 and VI-C4 would answer «where to focus» more directly: candidates, not 4.0 |
| C1 part B `/pimpinan`, `/pengembangan` | The decisions waiting are the page's work (X1) | Feedback bars `aria-hidden`, the count as text; «Guru: …» is a fact, not a rating | Meets it |
| A2 / A3 the Uji Cepat class figure | «Rata-rata nilai kelas» with its base; below five, «not yet» | O3 (D-176); individual scores stay visible | Meets it. VI-C1 is the natural next step for the same question |
| C2 PD «Lihat bukti» | Five «not yet» statements, then the evidence | No figure where the metric returns none | Meets it |

From now on, each composition that draws a figure adds one checklist line: **«[auto/manual] Visual intelligence: the brief (audience, question, message, evidence, action) is stated; the base and period are named; missing evidence is shown; no encoding by colour alone; the text equivalent carries the message.»**
