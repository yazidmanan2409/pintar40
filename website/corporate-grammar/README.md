# PINTAR corporate website — design grammar (proposal)

The first review gate of the corporate website design reset. This folder holds
a visual language for the website and three representative compositions. It is
**not the website**. Nothing here has been applied to the paused site in
`website/corporate`, to Mini-PINTAR or to the PINTAR application, and nothing
has been deployed. Every page is `noindex`.

## How to view it

The pages use ES modules, so they need a web server, not `file://`. Serve the
`website/` folder, so that the links to Mini-PINTAR resolve too:

```
cd website && python3 -m http.server 8080
# then open http://localhost:8080/corporate-grammar/
```

Every reference is relative, so the folder works from any subfolder of any host.

| Page | What it is |
|---|---|
| `index.html` | Overview: how to review, the three directions compared, the recommendation, the decisions, the capability boundary |
| `grammar.html` | The grammar, 24 sections. `?dir=a`, `?dir=b` or `?dir=c` re-themes every specimen |
| `a.html` | Direction A · Editorial: the landing page, composed |
| `b.html` | Direction B · Instrument: the landing page, composed |
| `c.html` | Direction C · Human: the landing page, composed |

## What is decided and what is not

Not decided: everything. The overview lists six decisions for the product owner:

1. the direction;
2. the brand teal (`#224F55` or `#245F55`);
3. a display serif, which would revise the 24 September identity ruling;
4. Parents;
5. PT ZPS's legal name and contact details;
6. photography.

My recommendation is on the overview page. It is A, plus B's staggered report
stack, and it is a recommendation, not a ruling.

## The truth boundary

The report artefacts are the product's own screens, in the product's own words
from `src/lib/hle.ts`. Only the numbers are simulated, and every artefact says
DATA SIMULASI and who sees it. Some things are deliberately absent because
PINTAR has no screen for them or does not have them:

- Question Health;
- misconceptions;
- briefings;
- anything for parents;
- AI;
- adoption figures.

The overview lists each with its reason.

## Files

```
assets/grammar.css    tokens for the three directions, and the site's components
assets/compose.css    composition layouts for A, B and C
assets/doc.css        the grammar document's own frame (not site design)
assets/specimens.js   the report artefacts, drawn from one source
assets/motion.js      entrance motion: once, on entry; off for reduced motion and without JavaScript
assets/dir.js         ?dir= for the grammar page; nothing stored
assets/roles.js       C's role pills
assets/menu.js        the phone menu
assets/doc.js         swatch values read from the live tokens; the motion demo
assets/icons.svg      one icon set, 24 px grid
assets/fonts/         Plus Jakarta Sans and IBM Plex Mono (the product's), Newsreader (A only); OFL licences included
assets/brand/         the supplied PINTAR SELALU mark, unaltered
verify/check.mjs      the check below
```

## Verification

```
node website/corporate-grammar/verify/check.mjs
```

It needs no npm install; it uses the repository's own headless-browser driver.
It serves the package from a subfolder and checks every page, including the
grammar in all three directions:

- **Pages load cleanly:** no console error, no failed or external request, and every link and asset relative and real.
- **Layout and accessibility:**
  - no sideways overflow from 320 to 1440 px;
  - contrast is measured;
  - no text is under 14 px;
  - controls are 44 px;
  - no figure covers text, a control or another figure.
- **Honest artefacts:** every artefact says DATA SIMULASI and who sees it, and has table twins. Every evidence bar uses the one neutral ink.
- **Motion:** with reduced motion or without JavaScript, nothing is hidden. With motion allowed, every entrance completes once and nothing loops.
- **Interactions:** the phone menu, role pills, direction switch and disclosures work.
- **Storage:** nothing is written to the device.
- **Product wording:** every product word the artefacts use still exists in the product, so a rename in PINTAR fails here.
- **Claims:** the compositions make no claim PINTAR cannot back.

It was proved able to fail by planting faults in a scratch copy. Thirteen
planted faults (a coloured bar, a missing badge, a renamed band, an external
font, an AI claim, a root-absolute link, a small target, low contrast, a
looping animation, a storage write, a broken id link, and two overlapping
figures) were each caught.

## Known limits of this package

- **Report artefacts need JavaScript here.** They are drawn by one shared script so that every page shows the same source. On the site they will be plain HTML. Without JavaScript the package shows the text but not the artefacts.
- **The copy is draft.** It is written only so the compositions can be read, and it is not proposed as final marketing copy.
- **Placeholder links say so.** Links to pages not yet composed (Untuk sekolah, Untuk murid, Kontak, English) are marked `data-placeholder`.
- **Photographs are labelled placeholders.** Direction C cannot be judged fully until a real shoot exists.
- **The recommended A + B combination is not composed** as its own page. It is A's composition with B's stack in the reports band.
