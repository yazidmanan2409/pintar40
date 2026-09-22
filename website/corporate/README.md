# PINTAR CORPORATE WEBSITE + MINI-PINTAR — fresh start

**Date:** 2026-09-22 · **Status:** first delivery, for Sauron review.

A ground-up design direction for the PINTAR corporate website, built fresh
rather than continuing the earlier website work. Visual inspiration: the
FYLLA reference (editorial composition, generous whitespace, oversized
type, thin structural rules, asymmetric layout) — not copied, and not the
PINTAR application's own design language.

```
python3 -m http.server 8000 --directory .
# then: http://localhost:8000/  (Home)
#       http://localhost:8000/apa-yang-dilakukan/
#       http://localhost:8000/untuk-pendidik/
#       http://localhost:8000/untuk-manajemen/
#       http://localhost:8000/cara-kerja/
#       http://localhost:8000/laporan/
#       http://localhost:8000/tentang/
#       http://localhost:8000/kontak/
#       http://localhost:8000/mini-pintar/
# ?lang=en on any page for English; the choice is then remembered
```

---

## 1 · Pages / routes created

Nine routes, each its own folder with `index.html` + `content.js` +
`app.js`, sharing one design system in `shared/`:

| Route | Purpose |
|---|---|
| `/` | Home — what PINTAR is, who it's for, why it matters, in one screen |
| `/apa-yang-dilakukan/` | What PINTAR Does — the six-stage flow as one coherent system |
| `/untuk-pendidik/` | For Educators — four lived moments, outcomes not features |
| `/untuk-manajemen/` | For Management — evidence, explicitly not surveillance |
| `/cara-kerja/` | How PINTAR Works — the operational sequence, no technical background needed |
| `/laporan/` | Reports — two worked report examples, in PINTAR's own evidence language |
| `/tentang/` | About / Philosophy — three short paragraphs, no manifesto, no fabricated bios |
| `/kontak/` | Contact / Demo — a request-a-conversation form, honestly inert |
| `/mini-pintar/` | The interactive journey (its own section below) |

The primary nav stays restrained (five links); the full sitemap lives in
the footer. `Cara Kerja` and `Kontak` are reachable from the footer and
from in-page cross-links rather than the header, so the header never
carries more than five items.

---

## 2 · Corporate visual system

`shared/style.css` — one design system, deliberately not the product's:

- **Palette.** Warm paper background (`#F7F3EA`), near-black charcoal ink,
  one restrained accent — a deep pine green, picked and *validated* with
  the dataviz skill's palette checker (chroma floor, CVD separation,
  contrast) rather than eyeballed, because the same green is reused as the
  "strong evidence" band color on the Reports and Mini-PINTAR report
  screens. A second, narrow-use ochre stands for "partial/mixed" — a
  status pair, not a brand palette.
- **Type.** System font stack only (no webfont request); an oversized,
  tight-tracked hero size down to a 14px floor everywhere, enforced by
  the browser check.
- **Structure.** Thin 1px rules as the only dividers; asymmetric
  `5fr/7fr` grids for hero and feature rows; a slim pill "chain" for the
  mini flow-teaser on Home; a numbered `seq` component for the lived-
  moment and operational-sequence pages; a labelled placeholder box that
  previews the real image's aspect ratio.
- **Not done:** rounded cards everywhere, gradients, the hero → 3 cards →
  testimonials → pricing → FAQ template.
- **Every page carries a design-sample banner** ("CONTOH RANCANGAN /
  DESIGN SAMPLE"), because this is a review artifact, not a production
  site — no page pretends otherwise, and the contact form says the same
  about itself before anyone fills it in.

---

## 3 · ID / EN implementation

Every page is one HTML file; every string is authored as an `L(id, en)`
pair (the same convention as `design/role-views`), rendered by a single
`t()` accessor keyed to the resolved language. There is no second, forked
copy of any page — both languages are the same structure by construction,
so they cannot drift apart silently.

- **Default:** Bahasa Indonesia. **Switch:** `ID`/`EN` pills in the header
  and footer, `aria-pressed` marked.
- The choice is written to `localStorage` and carried in `?lang=` on
  every internal link, so it survives navigation across the nine routes
  without re-choosing on every page — while a direct `?lang=en` link
  still works from cold, for sharing.
- Copy is written natively per language, not translated literally (e.g.
  the EN closing line on Mini-PINTAR is a rephrasing, not a gloss of the
  Indonesian).
- The content audit checks 275 bilingual string pairs for non-empty
  sides, a 65-word cap per block (no walls of text), and a banned-
  vocabulary sweep in **both** languages independently.

---

## 4 · Mini-PINTAR journey

Seven stages, one state machine, `mini-pintar/app.js`. Its own minimal
chrome (brand mark, exit, language switch, a slim progress bar) —
deliberately **not** the eight-link site header or the footer, because
this is a short story to go through, not a page to browse away from.

1. **Mulai** — the one-screen pitch, "about 3–5 minutes, no account,
   simple Mathematics," one `Mulai` button.
2. **Belajar** — `12 × 4 = 48`, two lines of explanation, no lesson.
3. **Asesmen Singkat** — five questions, one at a time, tap-to-answer,
   auto-advancing: multiplication, division, a simple fraction (¼ of 20),
   a word problem (pencils in boxes), a number pattern. Every option is a
   plain number — nothing to type, nothing to get wrong on a phone
   keyboard.
4. **Bukti** — **not** "4/5". Per-question evidence chips
   ("terjawab dengan baik" / "perlu ditinjau lagi" — never "salah"), and
   an interpretation chosen from the visitor's *actual* result: five
   correct, three-or-four correct, or fewer — each ending in the same
   small-sample clause. There is no fourth branch that fabricates
   certainty; the zero-correct branch is exercised in `verify/view.mjs`
   and still reads as evidence, not as a verdict on the visitor.
5. **Sudut Pandang Pendidik** — the same five answers, reframed: an
   assessment summary, the one concept that may deserve attention
   (**derived from the visitor's own first missed question**, or an
   honest "nothing stands out" if they got everything right), a
   PINTAR-proposes next step, and three decision buttons — computationally
   identical, none pre-selected — that the visitor clicks themself. The
   click is acknowledged ("Keputusan ini tetap milik Anda; PINTAR hanya
   mengusulkan") rather than acted on.
6. **Laporan Manajemen** — a **visibly, repeatedly labelled simulated
   class** ("KELAS CONTOH · DATA SIMULASI", stated again in prose: *"Ini
   BUKAN hasil Anda"*), using the identical band-distribution report
   component as `/laporan/`, with one concept flagged "mungkin perlu
   perhatian" and an explicit `belum cukup bukti` box. These numbers are
   fixed — they do not, and must not, vary with what the visitor answered,
   because one person's five questions cannot stand in for a class of 24.
   `verify/view.mjs` proves this by driving two opposite answer sets
   through to this screen and asserting the report is identical.
7. **Selesai** — the closing line, two CTAs out to the corporate site, and
   "Coba lagi dari awal" — which genuinely resets all state, not just the
   screen.

**Every number on screens 4–5 is computed from what the visitor actually
clicked**, never scripted. This was the one behavior worth adversarial
proof rather than a screenshot: `verify/view.mjs` runs the quiz three
times with three different, real answer sets (4/5, 5/5, 0/5) and asserts
the evidence text, the chip labels, and the flagged concept all change
correctly — including that "no concept stands out" only appears on the
all-correct run, and that no chip ever reads "needs another look" when
nothing was missed.

---

## 5 · Report / demo behaviour

Both `/laporan/` and the Mini-PINTAR management screen share one
discipline, carried over deliberately from the already-approved
Management role view:

- **No composite score, ever.** Every row is a labelled, multi-band
  distribution (raw counts, not an average or a `%`) — enforced
  structurally by the audit, which fails a row whose bands don't sum to
  its own stated total.
- **"Belum cukup bukti" is a legitimate, visible result** — not a loading
  state, not hidden. `/laporan/`'s principle section states it as PINTAR's
  own rule; both report examples carry one row explicitly marked
  insufficient, with the reason given in one plain sentence, never a
  diagnosis of why.
- **Simulated data is labelled as simulated**, not merely "example" —
  checked directly in the audit against the word "simulasi"/"simulated".
- The contact form is genuinely inert: submitting swaps the form for a
  confirmation panel and sends nothing anywhere, checked in the browser
  (no navigation, no outbound request) rather than only claimed in copy.

---

## 6 · Responsive treatment

Reflow checked in the browser at 320 / 375 / 768 / 1024 / 1440px on Home,
Reports, and Mini-PINTAR — zero horizontal overflow at any width. Every
interactive target (nav links, lang switch, footer links, quiz options,
decision buttons, form fields) is at least 44×44px; the one exception is
the skip-to-content link, which is the standard focus-only pattern (1×1,
revealed on keyboard focus) and is exempted from the sweep on that basis,
not overlooked by it. Mini-PINTAR's quiz grid is 2-up at every width down
to 320px rather than collapsing to a single column, so answering stays a
one-thumb tap. The header and its "Coba Mini-PINTAR" CTA wrap onto a
second line below ~360px instead of overflowing.

---

## 7 · Image placeholder inventory

**Nine placeholders**, itemised with type/size/ratio in
[`PLACEHOLDERS.md`](./PLACEHOLDERS.md) and rendered on the page itself as
a labelled box sized to the real image's aspect ratio — five documentary
photography briefs, two product-UI illustration briefs, two product-
mockup screens. No stock photography has been sourced; the brief's ban
list (robots, AI brains, glowing networks, holograms, generic laptop
stock, theatrical pointing children) is recorded there rather than only
implied.

---

## 8 · Verification

Same discipline as the rest of this repository: a content audit, a
browser check, and adversarial plants that prove each check can fail.

- **`verify/audit.mjs` — 41,342 checks**, 275 bilingual string pairs
  across 10 content modules. Checks: non-empty ID/EN sides; a banned-
  vocabulary sweep (AI hype, corporate jargon, exaggerated claims,
  fabricated trust signals, "PINTAR decides") in both languages
  independently; a 65-word cap per copy block; the evidence →
  understanding → human-decision chain and *"belum cukup bukti"* are both
  actually on the site, not only in this brief; every internal link
  resolves to a route in `PAGES`; the five quiz concepts are distinct and
  every question has exactly four options with a valid answer index;
  every report row's bands sum to its stated total; the Mini-PINTAR
  management step says in words that it is not the visitor's own result.
- **`verify/view.mjs` — 122 checks in a real browser.** Every route loads
  clean in both languages with no console error and no external request;
  the active nav link is marked; the footer lists every route; Mini-PINTAR
  carries neither the full nav nor the footer, by design; contrast is
  measured (not asserted) on Home, Reports, Contact, For Management, and
  Mini-PINTAR's start screen; the 14px type floor and 44px target floor
  are swept on every route; reflow is checked 320–1440px; the contact form
  is proven inert; the Mini-PINTAR journey is driven through three
  independent answer sets and the computed results are asserted to differ
  correctly, while the simulated management numbers are asserted **not**
  to.
- **`verify/negative.sh` — 12 planted defects, 12 caught.** AI hype,
  jargon, an exaggerated claim, a fabricated trust claim, PINTAR sold as
  deciding, an empty translation, mismatched report-row counts, a link to
  a route that doesn't exist, Mini-PINTAR's management screen losing its
  "not your result" disclaimer, the simulated-data badge dropping the
  word "simulated", a duplicated quiz concept, and the core principle
  disappearing from every location that states it.

**A real bug this exercise found and fixed, outside the corporate site
itself:** `website/mini-pintar/app/verify/driver.mjs`'s static server only
resolved `index.html` for the exact root path `/`; a nested route like
`/apa-yang-dilakukan/` 404'd. Every prior consumer of that shared file
(the role views, Mini-PINTAR's own M1/M2 suite) only ever serves from a
single root, so the bug was latent until a multi-page site needed it. Now
fixed as a strict superset (root behaviour is byte-identical; only paths
ending in `/` other than the root gain resolution) and re-verified against
zero regression: Mini-PINTAR M1/M2's `verify/journey.mjs` (383 checks) and
the Educator role view's `verify/view.mjs` (62 checks) both still pass.

**What none of this proves.** That a visiting principal or teacher finds
the tone right in practice — that needs real readers. That the five demo
questions are the right five (Q2's "72 ÷ 8" and Q4's word problem are
deliberately easy; whether that's the right difficulty for the brief's
"most adults can participate comfortably" is a content judgement, not a
mechanical one). That the placeholder-to-final-photography handoff in
§7 actually produces documentary-feeling, contemporary Indonesian imagery
rather than something that reads as stock once shot.

---

## 9 · Decisions that genuinely need Sauron

**Q1 — Is this meant to go live, or does it stay a review artifact?** The
sample banner and the inert contact form both say "not production" on
every page. If this direction is approved, someone has to decide what
"launch" means: real photography (§7), a real contact-form backend, and
whether the design-sample banner comes off entirely or narrows to just
Mini-PINTAR (which will likely want a "this is a demo, not your real
result" framing even once the site itself is live).

**Q2 — The accent color's second life as a data color.** `--accent` is
now used both as PINTAR's brand green *and* as the "strong evidence" band
color in every report. That reuse is deliberate — one visual vocabulary
end to end — but it does mean the corporate palette and the report-chart
palette are now coupled. If a future report ever needs a third or fourth
band color, that decision should go through the dataviz palette validator
again rather than being eyeballed to match.

**Q3 — Mini-PINTAR's difficulty and subject.** Simple arithmetic was
chosen per the brief ("so subject difficulty does not distract from the
PINTAR experience"). Whether Mathematics specifically, at this level, is
the right first impression for every visitor type in §CONTACT (a
foundation board member is a different reader than a classroom teacher)
is a product call, not a design one.

**Q4 — Where "Cara Kerja" and "Apa yang Dilakukan" should live relative
to each other long-term.** They're deliberately distinct today — one is
the conceptual flow, one is the day-to-day operational sequence — but
they're adjacent enough in content that a future information-architecture
pass might want to merge or more clearly cross-sell them from the start,
rather than relying on the one cross-link each carries now.

---

## Not done, by instruction

No final photography was sourced (§7 is the brief for that work). PINTAR's
production application and architecture were not touched — this is a new,
isolated `website/corporate/` directory; `src/`, `supabase/`, `selftest/`,
`design/role-views/`, and `docs/rebuild/` carry zero changes, and
`npm run baseline:parity` still reports 25/25 documents byte-identical to
the frozen baseline.
