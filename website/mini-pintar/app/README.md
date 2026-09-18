# MINI-PINTAR — IMPLEMENTATION

**Phase:** M2, the implementation phase M1 defined · **Date:** 2026-09-18
**Gate passed:** M1 CONTENT/INTERACTION, 2026-09-18, with two ruled
corrections applied
**Governing:** `../M1-CONTENT-AND-INTERACTION.md` (content and interaction),
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
node verify/audit.mjs        # content: both languages, register, overclaim, bank isolation
node verify/paths.mjs        # adaptation: every reachable path, by enumeration and replay
node verify/isolation.mjs    # source: no persistence, transmission or identification
node verify/journey.mjs      # the journey, in a real browser
bash verify/negative.sh      # that the four above can actually fail
node verify/journey.mjs --shots   # also writes ../screens/
```

No npm install, no build step, no browser download. `journey.mjs` speaks
CDP to the Chromium already on the machine through `verify/driver.mjs`
(override with `CHROMIUM=/path/to/chrome`).

**`negative.sh` is the one to run after editing a verifier.** It injects
thirty-one specific defects — a two-minute promise, a mastery overclaim, a
child-register pronoun, a `localStorage` write, a webfont, a mutated
outcome table, an answer in the URL — and fails if any verifier stays
green. A check that cannot go red is theatre, and the first version of
three of these checks was exactly that: `negative.sh` found two real
weaknesses in `audit.mjs` and `paths.mjs` before either had ever been
trusted.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The shell. Chrome, a live region, a `<noscript>` that explains itself, nothing else. |
| `style.css` | The surface. Deck palette tokens, one 34 rem column, no external font. |
| `content.js` | **The content**, as approved in M1 §3. Every string a `{id, en}` pair. |
| `adapt.js` | **The adaptation.** Pure functions, no randomness, no clock, no DOM. |
| `app.js` | The state machine, the rendering and the accessibility behaviour. |
| `verify/audit.mjs` | Content: both languages, register, overclaim, bank isolation. |
| `verify/paths.mjs` | Adaptation: every reachable path, by enumeration and replay. |
| `verify/isolation.mjs` | Source: no persistence, transmission or identification. |
| `verify/journey.mjs` | The journey, in a real browser. ~9 minutes. |
| `verify/negative.sh` | That the four above can actually fail. |
| `verify/driver.mjs` | A static server and a CDP driver, no npm dependency. |
| `../screens/` | Fourteen screens, desktop and 390 px, written by `--shots`. |
| `package.json` | `{"type":"module"}` and nothing else. No dependency, now or planned. |

`content.js` and `adapt.js` are imported by both the browser and the
verifiers, so a path the test walks is the path a visitor walks. That is
the whole reason the adaptation is a separate pure module.

---

## Decisions taken at implementation time

These were not settled by M1. Each is reversible; each is written down
because an implementation decision nobody recorded becomes a mystery.

**1 · It is a standalone static bundle, not a route in `src/app/`.** R5
approved separate deployment, and ADR-0021's *Affected components* says "no
application module changes" and "no change to `src/proxy.ts`'s
`PUBLIC_PATHS`". Building it as a Next.js route would have made both false
and would have put a public, anonymous surface inside the application's
Supabase session middleware — the perimeter INV-37 protects. Outside, there
is no perimeter to reason about.

**2 · No dependency, no build step, no external origin.** Not minimalism
for its own sake. This is the one page in PINTAR whose argument is that it
keeps nothing about you, and that has to be true of its own network
activity first. A webfont from a CDN is a third-party request carrying the
visitor's IP and referrer, made by the page that just told them nothing is
kept. So: a system font stack, and `verify/isolation.mjs` fails the build
on any `//host` appearing in any shipped file.

**3 · The deck palette, not a new one.** Visual direction is stage H and is
still outstanding. Rather than invent a second palette that stage H would
then have to reconcile, the bundle uses the tokens from the approved
presentation deck, with R6's `#245F55` as the corporate green. When stage H
lands, this is one stylesheet to revise.

**4 · Back and forward are real; the URL carries a step name and nothing
else.** Each step is a `pushState` of `#map-2`, `#peta`, `#hasil`. An
answer in the URL would be an answer in the visitor's history, their
referrer header and any server log between them and the site;
`isolation.mjs` asserts no history entry carries one. Any inbound hash
naming a step is discarded, which gives M1 §5's two required behaviours
from one rule: a reload restarts, and a deep link to `/coba/hasil` shows
the threshold, because there is no result to show someone who has not been
through it.

**5 · Language is read, never written.** The starting language comes from
the `lang` attribute the corporate site served, or from `?lang=` for
review. Per the ruling, no educational state may enter the corporate site's
preference mechanism, and nothing here writes any preference at all.

**6 · The tier identifier is `SUDAH_TEPAT`, not `KUAT`.** Flagged in M1
§3.2 and repeated here because it is in the data model: "strong" is the
same inferred-mastery word the ruling removed from the screen, and leaving
it internally would put it one debug surface away from contradicting its own
label. One rename to revert.

**7 · `Tandai` is not implemented — a deliberate deviation from M1 §9**,
which puts "Timer and *Tandai* on one line above the stem". A flag-for-review
control earns its place in a thirty-item assessment with a review screen at
the end. In a two-question check with no review screen it would do nothing
observable, and a control that does nothing is worse than no control. The
`checkbar` carries the decorative timer and the persistent *Perlu arah?*
instead. If you want it, it is a chip and a state field.

**8 · Nothing is set below 14 px.** M1 §9 allowed 12 px for the step
indicator. The indicator here is dots with a visually-hidden text
equivalent, so the exception is not needed and is not taken — the type
floor holds on every step, and `journey.mjs` measures it on every step
rather than trusting the stylesheet.

---

## What the browser test found in my own code

Four defects, all in code I had already read back and believed correct.
They are listed because the useful thing about a verification suite is the
things it catches, and because three of the four were invisible to every
check that does not run a browser.

**1 · Every option's selected state was announced to nobody.** My element
helper treated *all* attributes as HTML booleans, so the chosen option
carried `aria-checked=""` and the rest carried no `aria-checked` at all. A
screen-reader user could not tell which option was selected — and because
the stylesheet selects on `[aria-checked="true"]`, neither could a sighted
one: there was no selected state on screen either. The radio group was, in
both senses, not a radio group. Fixed, and `journey.mjs` now reads the
selected label back after a click, after Back, and after a language switch.

**2 · The quiet text buttons had no styling at all.** *Lewati*, *Kembali*
and *Ulangi* were given `class="btn--text"` and never `btn`, so they missed
the base rule and fell back to Chromium's 13.33 px default. Caught as a
type-floor failure, which is the useful kind of accident: a rule about
something small found something structural.

**3 · A changed Pemetaan Awal answer left the check answers standing.** The
map was stored rather than derived, so going back, changing an answer and
walking forward could serve a *different lesson* while two answers already
given kept their positions — answers given to one lesson's questions,
scored against another's. The map is now derived from the answers on every
render, and changing one discards the check answers. Both are regression
cases in `journey.mjs`.

**4 · Arrow-key selection started at the wrong option.** With nothing
chosen, ArrowDown selected the *second* option, because the
nothing-chosen case was folded into the wrap-around arithmetic.

And one thing that looked like a defect and was not: in a full-page
screenshot a `position: sticky` bar is painted at its stuck position, which
renders it on top of the options. It reads exactly like a layout bug. The
hit test in `journey.mjs` is what settles it — no option is covered at 320
px — and the screenshots now use a viewport tall enough that nothing is
stuck. A screenshot could never have proved either way.

---

## What holds the promises

Every claim in ADR-0021 and M1 that could be asserted mechanically is.

| Promise | Where it is asserted | How |
|---|---|---|
| Never imported from a PINTAR item bank (ADR-0021, binding) | `audit.mjs` | every bundle identifier is searched for across `supabase/` and `src/` — 132 files |
| Every option teaches (INV-03's principle) | `audit.mjs` | every MAP option has a non-empty rationale in both languages |
| Zero pre/post overlap (INV-24's principle) | `audit.mjs` | MAP and CHECK id sets are disjoint |
| Help never names the answer (INV-02's principle) | `audit.mjs`, `journey.mjs` | authored, then checked on screen against every option's text |
| Mini-PINTAR speaks to an adult | `audit.mjs` | seven child-register tokens banned in the machine's voice |
| No surface overclaims | `audit.mjs` | seven overclaim phrases banned; negations allowed explicitly |
| The ruled duration | `audit.mjs`, `journey.mjs` | "dua menit / two minutes" fails; the threshold string is pinned |
| The evidence limit under **every** outcome | `audit.mjs`, `journey.mjs` | one shared block, and its text is read off the screen in all twelve terminal states |
| Deterministic adaptation | `paths.mjs` | 3,125 resolutions replayed identically; arguments and bundle unmutated |
| 8 shapes, 4 lessons, 3 outcomes, 12 terminals | `paths.mjs`, `journey.mjs` | exhaustive enumeration, then walked in the browser |
| The outcome table as ruled | `paths.mjs` | every one of 25 check states per lesson checked against the table |
| No weakness manufactured on the all-correct path | `paths.mjs` | no `PERLU_SEGERA` or `WAJIB` card is reachable when nothing needs repair |
| No persistence on the device | `isolation.mjs`, `journey.mjs` | source scan, then `localStorage`/`sessionStorage`/cookie/IndexedDB read as empty after a full journey |
| No request carries an answer | `isolation.mjs`, `journey.mjs` | source scan, then every request the browser made is inspected |
| Nothing leaves the bundle | `journey.mjs` | the request log must contain only the bundle's own five files |
| Reload restarts | `journey.mjs` | a real reload mid-journey lands on the threshold |
| Keyboard completes the journey | `journey.mjs` | Tab, arrow keys, Space and Enter only, no pointer event at all |
| No horizontal overflow, 320–768 px and at 200 % | `journey.mjs` | measured, not eyeballed |
| Reduced motion keeps every meaning | `journey.mjs` | the journey is completed again with motion emulated off |
| The action bar covers no option | `journey.mjs` | every option is hit-tested at its centre at 320 px, pill open |
| Selected state is real | `journey.mjs` | `aria-checked` read back after click, Back, and language switch |

**What none of this proves.** That the Indonesian sounds right to an
Indonesian educator (STOP-4). That a visitor understands more at the end
than at the start — that needs people. That the three domains are the right
three. Contrast ratios are asserted in M1 §10 by construction from the deck
palette and are **not** measured here; a contrast check belongs with stage H,
when the surface is final.

---

## Findings for review

Four things M1 asserts that the content in M1 does not support. None is
invented away, because inventing content is how a document starts saying
things nobody approved.

**D-1 · Twenty-four missing rationales.** M1 §2 says `Option.rationale` is
"required and non-empty on **every** option". M1 §3.5 — the approved
content — supplies none for the six CHECK items' twenty-four options.
Nothing in the designed Hasil displays one, so none is authored here, and
`audit.mjs` asserts the field is **absent** rather than empty so the gap
cannot be mistaken for an oversight. *My recommendation:* either scope the
rule to MAP options, or author the twenty-four and show the chosen option's
rationale on the Hasil. The second is better product — a visitor who was
wrong currently learns which reading, not why — but it is content, and
content is yours.

**D-2 · No misconception codes at the check.** M1 §4.2 describes each check
answer as "`correct`, a misconception, or `skipped`", and §3.5 supplies no
codes for the check distractors. The outcome table does not use them, so
the implementation classifies check answers as correct / incorrect /
skipped. Nothing is lost today; it would matter the moment a Hasil wanted
to name the error.

**D-3 · "Every one of them is written" was not true.** M1 §5 claims twelve
distinct Hasil presentations, "every one of them is written — none is
generated by template substitution". §11 supplies three outcome bodies. The
twelve presentations are therefore three written bodies against four lesson
contexts, with the reading named from already-approved content — which is
substitution, of exactly the kind §5 disclaims. §5 is corrected to say what
exists. Authoring twelve bodies is possible and is content.

**D-4 · An enumeration is not a population.** `paths.mjs` reports
`BELUM_CUKUP` in 45 of 75 outcome slots. That is the shape of the *input
space*, and it is not evidence about visitors — under uniform guessing the
refusal dominates; after reading the lesson that answers the questions it
does not. The adversarial pass retracted a claim by confusing these two,
and the number is printed here with its meaning attached so it cannot be
quoted back as the other one.

---

## Debts carried forward

The M1 gate closed STOP-3, 7 and 8. These are still open, unchanged, and
none of them blocked this phase.

| # | Item | Blocks | Owner |
|---|---|---|---|
| **STOP-1** | Baseline amendment owed: doc 09 must move Mini-PINTAR's public experience FOUNDATION NOW → BUILD NOW, doc 11 must mark OD-11 RESOLVED against ADR-0021. Governed amendment — new bytes, new `baseline` identity, in-document marker, manifest regenerated. **Until it lands, doc 11 reads OD-11 as OPEN and contradicts the ADR.** | Public launch | Engineering, on your instruction |
| **STOP-2** | Analytics feasibility (R8). **Now answerable: V1 ships with none.** Four counters cannot be sent without a request, and a request from this bundle would break the property `isolation.mjs` asserts. R8's own fallback applies. Recorded as answered rather than closed, because reversing it is a privacy decision and yours. | Nothing | Me, answered; you if you want it revisited |
| **STOP-4** | Native Indonesian editorial read of §3's content. Confirmed still required by the M1 ruling; does not block implementation. | Public launch | You to assign |
| **STOP-5** | Domain cutover (R5): `pintarselalu.com` / `app.pintarselalu.com`. The bundle is static and deployable anywhere, so this blocks launch and nothing else. | Public launch | You / infrastructure |
| **STOP-6** | Identity asset (R7). The chrome carries a plain text wordmark in a replaceable slot. No mark is invented and none is approximated. | External release | Separate identity exploration |
| **STOP-9** | **New.** Visual direction (stage H) has not run. The surface here is the deck's palette on a system font stack — defensible and consistent, but not designed. Contrast measurement belongs with it. | External release | Me, on your go-ahead |

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
