# MINI-PINTAR — IMPLEMENTATION

## Since 24 Sep 2026: the single public Mini-PINTAR, inside the corporate site

This is the approved M2. It was **moved** here from `website/mini-pintar/app/` with `git mv`, so its history is kept. It is now the only public Mini-PINTAR: the corporate site's arithmetic quiz was retired rather than linked (the reconciliation ruling of 24 Sep). The M1 governing documents stay at `website/mini-pintar/`. The shared browser tooling (`verify/driver.mjs`, `probes.mjs`) also stays there, because the role views import it.

**What did not change:**
- the journey;
- the adaptation module;
- the content model;
- the rationales;
- the internal misconception taxonomy;
- the evidence-limit sentence under every outcome;
- zero-write.

**What changed:**

- **Canonical cycle name.** *Peta Bacaan Personal / Personal Reading Map*, word for word from the product (`cycle.step.map`).
- **Lesson and questions reconciled.** L-D2 and L-D3 each gain a fourth worked-example step. It teaches the principle that the lesson's second Uji Penguasaan item tests, in words that reproduce no option. `audit.mjs` enforces that no lesson line shares a run of five or more words with any Uji Penguasaan option.
- **"Lihat dari sisi sekolah" (optional, about one minute).** It comes after the reveal.
  - **The educator's side:** the visitor as a class of one. Every class figure is below MC-1's minimum and says so in the product's own sentence. The visitor's answers are never shown. The next step is the visitor's own choice, between two of the product's actions and "no action now".
  - **The management side:** a simulated class of 24, badged DATA SIMULASI, drawn from the figures the product's management view reads.
  - `verify/journey.mjs` walks both sides in both languages, by keyboard alone, and measures contrast on each. The labels are checked against the product by `../verify/canonical.mjs`.
- **Identity.**
  - The supplied PINTAR SELALU logo leads Home.
  - The product's Plus Jakarta Sans comes from the site's `../shared/` folder, on the same origin, in its weights 400 and 600.
  - `isolation.mjs` allows exactly those three shared files, each by exact path, and nothing else.
- **Leaving.** Exit, the logo and the three doors lead to the corporate site's real routes, carrying `?lang=` and nothing else. The corporate site around Mini-PINTAR keeps nothing either.

### Run it, now

```
cd website/corporate
python3 -m http.server 8000 --directory .
open http://localhost:8000/mini-pintar/
```

### Verify it, now

```
node verify/audit.mjs             # content: languages, register, overclaim, taxonomy, bank isolation, no lesson leak
node verify/paths.mjs             # adaptation: every reachable path, by enumeration and replay
node verify/isolation.mjs         # source: no persistence, transmission or identification; exact shared assets
node verify/journey.mjs           # the journey and the school's side, in a real browser   (~10 min)
bash verify/negative.sh           # that the three source verifiers can fail                (~40 s)
bash verify/negative-browser.sh   # that the browser verifier can fail                      (~25 min)
```

The sections below are the M2 record as it was approved, kept for its history. Where they give paths, a run command or check counts, the paragraphs above supersede them.

---

## The M2 record

**Phase:** M2 implementation, then the M2 closure pass (R1–R5)
**Date:** 2026-09-18 · **Gate passed:** M1 CONTENT/INTERACTION
**Governing:** `../../mini-pintar/M1-CONTENT-AND-INTERACTION.md` (content and interaction),
`../../../docs/adr/0021-mini-pintar-public-demonstration.md` (execution model)

A public, anonymous, zero-write demonstration of the PINTAR learning cycle.
A visitor walks Pemetaan Awal → Peta Bacaan → Pelajaran → Uji Penguasaan →
Hasil in about three minutes, and then sees what just happened to them.

**Scope held.** This is Mini-PINTAR and nothing else. The rest of the
corporate website — the five nav sections, the homepage, the audience
chapters designed in `../../EXPERIENCE-ARCHITECTURE.md` — is not built here.

---

## Run it

```
python3 -m http.server 8000 --directory .    # or any static server
open http://localhost:8000/
```

`?lang=en` starts in English. It must be served over HTTP, not opened as a
`file://` path: the bundle is ES modules and the browser will refuse them
cross-origin.

## Verify it

```
node verify/audit.mjs             # content: languages, register, overclaim, taxonomy, bank isolation
node verify/paths.mjs             # adaptation: every reachable path, by enumeration and replay
node verify/isolation.mjs         # source: no persistence, transmission or identification
node verify/journey.mjs           # the journey, in a real browser          (~9 min)
bash verify/negative.sh           # that the three source verifiers can fail (~30 s)
bash verify/negative-browser.sh   # that the browser verifier can fail       (~8 min)
node verify/journey.mjs --shots   # also rewrites ../screens/
```

No npm install, no build step, no browser download. `journey.mjs` speaks
CDP to the Chromium already on the machine through `verify/driver.mjs`
(override with `CHROMIUM=/path/to/chrome`). `MINI_PINTAR_FAST=1` runs a
reduced journey for the plants; it says so in its own summary line and is
never the verification of record.

**Run the two negative scripts after editing any verifier.** Between them
they plant forty-seven specific defects — a two-minute promise, a mastery
overclaim, a child-register pronoun, a `localStorage` write, a webfont, a
mutated outcome table, an answer in the URL, a rationale that only names
the key, a leaked misconception code, a colour at 2:1, a committed answer
that is still editable — and fail if any verifier stays green.

They have now caught four checks of mine that could not fail. The worst was
in the contrast probe itself: it lived in a template literal, so `\(` and
`\s` in its regexes lost their backslashes, every colour parsed as `NaN`,
every comparison against `NaN` was false, and it reported green over text
at 2.02:1. It is a function now, compiled by Node, and both probes refuse
to pass unless they can say how many elements they measured.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The shell. Chrome, a live region, a `<noscript>` that explains itself. |
| `style.css` | The surface. Stage H visual direction, from the deck's language. |
| `content.js` | **The content**, as approved in M1 §3 plus the R1 rationales. Every string a `{id, en}` pair. |
| `adapt.js` | **The adaptation.** Pure functions, no randomness, no clock, no DOM. |
| `app.js` | The state machine, the rendering and the accessibility behaviour. |
| `verify/` | Four checks, two negative-plant harnesses, a dependency-free browser driver. |
| `../screens/` | Sixteen screens, desktop and 390 px, written by `--shots`. |
| `package.json` | `{"type":"module"}` and nothing else. No dependency, now or planned. |

`content.js` and `adapt.js` are imported by both the browser and the
verifiers, so a path the test walks is the path a visitor walks. That is
the whole reason the adaptation is a separate pure module.

---

## The closure pass

**R1 · Twenty-four rationales, authored.** Every Uji Penguasaan option now
carries one, in both languages, and the content model's rule holds over
every option in the bundle. They explain **why the reasoning holds or does
not** rather than naming the key — `audit.mjs` rejects a rationale that
contains "the correct answer is", that restates its own option, or that is
shorter than the option it explains.

They are revealed **after the visitor commits**, at the question. The
primary action reads *Lihat penjelasannya / See the reasoning*, and pressing
it shows the chosen option's reasoning and, when the choice was not the
keyed one, the keyed option's too — labelled *Pilihan Anda* and *Pilihan
yang paling tepat*, never "right" and never "wrong". A skip gets the
reasoning without being called a choice.

**The Hasil is unchanged and stays an evidence-interpretation surface.**
`audit.mjs` fails if a rationale ever reaches it.

**R2 · Misconception codes, where defensible.** Sixteen of the eighteen
check distractors carry one; two do not, because *"whether the club is
popular"* and *"how to raise it"* are unhelpful without expressing one
crisp error, and coding them would be the schema driving the content.
`audit.mjs` asserts that at least one stays uncoded, so a later edit cannot
quietly restore symmetry. Five of the nine map codes are reused where the
same error reappears; seven new codes are declared in
`CHECK_ONLY_MISCONCEPTIONS`. Correct is correct and carries no code; a skip
is insufficient response evidence and is never a misconception. **The
taxonomy is never exposed** — asserted three ways: no code in any authored
string, no read of `misconception` in the check renderer, and a sweep of
the whole document at every step of a live journey.

Codes are namespaced by the **domain of the error, not of the item**. A D3
question can elicit a D1-family mistake, and `M-D1-ATRIBUSI` on U-D3-1/C
records exactly that rather than minting a near-duplicate.

**R3 · Twelve outcome bodies, not authored.** The corrected §5 stands. The
outcome architecture and the evidence-limit sentence in every outcome are
unchanged.

**R4 · `SUDAH_TEPAT` preserved.**

**R5 · Stage H, run.** Below.

---

## Stage H — visual direction

The starting point is the PINTAR presentation deck, which is the one piece
of PINTAR visual language that has been through review. Its palette,
hairlines, left accent rules and quiet tracked labels are carried over.
This is that language spoken on a screen, not a second brand.

Nothing in the questions, answers, scoring, adaptation, evidence semantics,
outcome logic, zero-write isolation or the approved journey was touched.

**Type.** A fluid scale on `clamp()`, so the display size at the threshold
and the question size on a phone are both deliberate rather than one
compromise. Tightened tracking on large text, a balanced-wrap heading, a
34 rem measure. Still a system stack — see decision 2.

**Space.** A 4 px rhythm as tokens, applied throughout instead of ad-hoc
margins.

**Hierarchy.** The lead Peta Bacaan card now carries three signals at once
— a heavier rule, a tinted ground and more air — because one signal reads
as decoration and three read as meaning, without a badge. Every quiet
caption in the experience shares one tracked-label treatment, so they read
as one voice.

**Graphic treatment**, restrained to two marks, both inline SVG because the
bundle has no external origin and therefore no icon font:

- **The step rail.** Five segments for the five steps, filled as far as the
  visitor has come, the current one widened. An order made visible, which
  is the one thing the demonstration is about. Purely graphic, `aria-hidden`,
  with a sentence beside it naming the position.
- **The evidence-limit mark.** A line that runs, and then stops. It draws
  what the sentence beneath it says. It is not a chart and implies no
  quantity — the one place a graphic could have overclaimed is the one
  place the doctrine lives.

**Transitions.** A refined settle, plus the Peta Bacaan cards arriving one
after another — the order is the payoff, so it is worth a beat. Every one
has a static end state carrying the same meaning, which is the only reason
`prefers-reduced-motion` can remove all of them safely. The journey is
completed again with motion emulated off, as a check.

**Responsive.** Fluid type, a 4 px rhythm that holds at 320 px, the
committed-answer marks wrapping below the option text on narrow screens.

**Contrast, re-measured after Stage H** at every step of the journey, at
both widths, for text and for the non-text boundaries that carry meaning.
It found two real failures in my own stylesheet, both now fixed: the `|`
between ID and EN was a text character at 2.92:1 (it is a rule now — a
separator is not language, so it should be neither read aloud nor held to a
text ratio), and the probe was measuring the primary action's boundary
while it was disabled, which WCAG 1.4.11 exempts.

---

## Decisions taken at implementation time

**1 · A standalone static bundle, not a route in `src/app/`.** R5 approved
separate deployment, and ADR-0021 says "no application module changes" and
"no change to `src/proxy.ts`'s `PUBLIC_PATHS`". A Next.js route would make
both false and would put a public, anonymous surface inside the
application's Supabase session middleware — the perimeter INV-37 protects.

**2 · No dependency, no build step, no external origin.** This is the one
page in PINTAR whose argument is that it keeps nothing about the visitor,
and that has to be true of its own network activity first. A webfont from a
CDN is a third-party request carrying their IP and referrer, made by the
page that just told them nothing is kept. So: a system font stack, inline
SVG, and `isolation.mjs` fails on any `//host` in any shipped file. XML
namespace URIs are allowed by exact match and only as arguments to
`createElementNS`, because they are identifiers the browser compares, never
fetches.

**3 · The deck palette, not a new one.** Stage H refines it; it does not
replace it.

**4 · Back and forward are real; the URL carries a step name and nothing
else.** An answer in the URL would be an answer in the visitor's history,
their referrer header and any server log between them and the site.
`isolation.mjs` asserts no history entry carries one. Any inbound hash
naming a step is discarded, which gives M1 §5's two required behaviours
from one rule: a reload restarts, and a deep link to a result shows the
threshold.

**5 · Language is read, never written.** From the `lang` the corporate site
served, or `?lang=` for review. No educational state may enter the
corporate site's preference mechanism, and nothing here writes a preference
at all.

**6 · The tier identifier is `SUDAH_TEPAT`, not `KUAT`.** Accepted in R4.

**7 · `Tandai` is not implemented — a deliberate deviation from M1 §9.** A
flag-for-review control earns its place in a thirty-item assessment with a
review screen. In a two-question check it would do nothing observable, and
a control that does nothing is worse than no control.

**8 · Nothing is set below 14 px.** M1 §9 allowed 12 px for the step
indicator; the indicator is a rail with a visually-hidden text equivalent,
so the exception is not needed and is not taken. Measured on every step.

**9 · Committing a check answer fixes it — a bounded deviation from M1 §5**,
which says answers are not locked. That rule stands for Pemetaan Awal,
where nothing is revealed and going back to change an answer is explicitly
permitted. It cannot stand for Uji Penguasaan once R1 reveals the
reasoning: showing a visitor why an answer falls short and then letting
them change it makes the reveal pointless and the outcome gameable. The
lock is per question and applies only after the visitor presses *Lihat
penjelasannya*. Changing a Pemetaan Awal answer still discards the check
answers entirely.

**10 · The committed marks are words, not glyphs.** A filled dot against a
hollow one against a diamond is a legend the visitor was never given.
*Pilihan Anda* and *Paling tepat* need none, and being visible text they
are also what a screen reader reads — no parallel hidden copy to drift.

---

## What holds the promises

| Promise | Where it is asserted | How |
|---|---|---|
| Never imported from a PINTAR item bank (ADR-0021, binding) | `audit.mjs` | every bundle identifier searched for across `supabase/` and `src/` — 132 files |
| Every option teaches (INV-03's principle) | `audit.mjs` | every option in the bundle has a non-empty rationale in both languages |
| A rationale explains, and never just names the key (R1) | `audit.mjs` | rejects key-naming phrases, self-restatement, and rationales shorter than their option |
| The reasoning appears only after commit (R1) | `audit.mjs`, `journey.mjs` | source gate, then read off the screen before and after committing |
| The Hasil is not a correction sheet (R1) | `audit.mjs`, `journey.mjs` | no rationale in `viewHasil`; no rationale text on the rendered Hasil |
| No code is forced on for symmetry (R2) | `audit.mjs` | fails if every distractor is coded |
| The taxonomy never reaches a visitor (R2) | `audit.mjs`, `journey.mjs` | no code in any string, none read by the check renderer, whole-document sweep at every step |
| Zero pre/post overlap (INV-24's principle) | `audit.mjs` | MAP and CHECK id sets are disjoint |
| Help never names the answer (INV-02's principle) | `audit.mjs`, `journey.mjs` | authored, then checked on screen against every option's text |
| Mini-PINTAR speaks to an adult | `audit.mjs` | seven child-register tokens banned in the machine's voice |
| No surface overclaims | `audit.mjs` | seven overclaim phrases banned; negations allowed explicitly |
| The ruled duration | `audit.mjs`, `journey.mjs` | "dua menit / two minutes" fails; the threshold string is pinned |
| The evidence limit under **every** outcome | `audit.mjs`, `journey.mjs` | one shared block, its text read off the screen in all twelve terminal states |
| Deterministic adaptation | `paths.mjs` | 3,125 resolutions replayed identically; arguments and bundle unmutated |
| 8 shapes, 4 lessons, 3 outcomes, 12 terminals | `paths.mjs`, `journey.mjs` | exhaustive enumeration, then walked in the browser |
| The outcome table as ruled | `paths.mjs` | every one of 25 check states per lesson checked against the table |
| No weakness manufactured on the all-correct path | `paths.mjs` | no `PERLU_SEGERA` or `WAJIB` card reachable when nothing needs repair |
| No persistence on the device | `isolation.mjs`, `journey.mjs` | source scan, then storage read as empty after a full journey |
| No request carries an answer | `isolation.mjs`, `journey.mjs` | source scan, then every request the browser made is inspected |
| Nothing leaves the bundle | `journey.mjs` | the request log must contain only the bundle's own five files |
| Reload restarts | `journey.mjs` | a real reload mid-journey lands on the threshold |
| Keyboard completes the journey | `journey.mjs` | Tab, arrow keys, Space and Enter only, no pointer event at all |
| **Contrast, text and non-text** | `journey.mjs` | measured at every step, both widths, compositing translucency and taking a gradient's darkest stop |
| No text under 14 px, targets ≥ 44 px | `journey.mjs` | measured on every step, reported as elements rather than a count |
| The action bar covers no option | `journey.mjs` | every option hit-tested at its centre at 320 px, pill open |
| No horizontal overflow, 320–768 px and at 200 % | `journey.mjs` | measured, not eyeballed |
| Reduced motion keeps every meaning | `journey.mjs` | the journey is completed again with motion emulated off |

**What none of this proves.** That the Indonesian sounds right to an
Indonesian educator (STOP-4) — and there are now twenty-four more
paragraphs of it than when that STOP was written. That a visitor
understands more at the end than at the start; that needs people. That the
three domains are the right three.

---

## What the verification found in my own work

Nine defects, all in code or copy I had already read back and believed
correct. Listed because the useful thing about a suite is what it catches.

**In the implementation phase.** Every option's selected state was
announced to nobody (`aria-checked=""` on the chosen one, absent on the
rest, and the stylesheet's `[aria-checked="true"]` matching neither). The
quiet text buttons carried `btn--text` without `btn` and so had no styling
at all. A changed Pemetaan Awal answer left the check answers standing
while the lesson served changed underneath them. Arrow-key selection
started at the second option.

**In the closure pass.** Rewriting the check view dropped `advanceCheck`
entirely, so a committed answer could not be advanced past. `startCheckAids`
dereferenced a clock the committed view does not render, throwing once a
second. The contrast probe could not fail at all, for the template-literal
reason above. The `|` between ID and EN was text at 2.92:1. And the
committed-answer marks were three unexplained glyphs.

One thing that looked like a defect and was not: in a full-page screenshot
a `position: sticky` bar is painted at its stuck position, on top of the
options. The hit test settles it — no option is covered at 320 px — and the
screens now use a viewport tall enough that nothing is stuck.

---

## Debts carried forward

| # | Item | Blocks | Owner |
|---|---|---|---|
| **STOP-1** | **Baseline amendment owed.** Doc 09 must move Mini-PINTAR's public experience FOUNDATION NOW → BUILD NOW; doc 11 must mark OD-11 RESOLVED against ADR-0021. Governed amendment — new bytes, new `baseline` identity, in-document marker, manifest regenerated. **Until it lands, doc 11 reads OD-11 as OPEN and contradicts the ADR.** `npm run baseline:parity` still reports 25 documents byte-identical, so nothing has drifted into it by accident. | Public launch | Engineering, on your instruction |
| **STOP-4** | **Native Indonesian editorial read** of the content. Still required, and now larger: R1 added twenty-four rationales in both languages. | Public launch | You to assign |
| **STOP-5** | **Domain cutover (R5 of the architecture rulings):** `pintarselalu.com` / `app.pintarselalu.com`. The bundle is static and deployable anywhere, so this blocks launch and nothing else. | Public launch | You / infrastructure |
| **STOP-6** | **Identity asset.** The chrome carries a plain text wordmark in a replaceable slot. No mark is invented and none is approximated. | External release | Separate identity exploration |
| ~~**STOP-2**~~ | **RESOLVED.** V1 ships with no analytics. Four counters cannot be sent without a request, and a request from this bundle would break the property `isolation.mjs` asserts. | Nothing | Closed |
| ~~**STOP-9**~~ | **CLOSED.** Stage H run; contrast re-measured after it, at every step and both widths, with two real failures found and fixed. | Nothing | Closed |

## Environmental observations, not Mini-PINTAR defects

Recorded because they show up in any full check of the repository and
should not be mistaken for something this unit introduced. Per your
instruction, neither is repaired here.

- `npm run typecheck` reports five pre-existing errors in `src/proxy.ts`
  (implicit `any` on cookie-handler bindings), from commit `e81b41f`. No
  file under `src/` is touched by this unit.
- `npm run lint` cannot run in this environment: `eslint.config.mjs`
  imports `eslint`, which is not installed in `node_modules`.

---

## What this is not

Not an official assessment. It issues no certificate, produces no evidence
of any class, creates no session and no Person, and writes nothing —
anywhere, including the visitor's own device. There is no endpoint that
accepts an answer, so there is nothing to rate-limit, secure or audit.

Its answer key is in `content.js` and any visitor may read it. That is safe
only because of the rule ADR-0021 makes binding and `audit.mjs` enforces:
**this content is authored for Mini-PINTAR and exists in no PINTAR item
bank.** If anyone ever copies a real item in here, the audit fails, and it
should.
