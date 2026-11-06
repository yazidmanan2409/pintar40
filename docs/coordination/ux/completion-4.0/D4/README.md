# D4 · W3.21: republish the Design System page, stage 1

**Form P (publication).** Register entry D4.
**The page:** the private Design System page, https://claude.ai/artifact/153KwNRJkTETDKAZSoorS1, **version 21 (A3 added after O3; version 20 was stage 1, accepted)** (published 4 Nov; it was version 18 of 8 Oct, which predated the freeze c42fecb). Private: only its owner and the people they share it with can open it.
**Source:** `docs/coordination/ux/sistem-desain/project/`, the same files the page shows, changed on this lane in the same commit.
**Stage 2** follows F-11 and the decision-gated items: it resolves the provisional sections. **Published 6 Nov (see «Stage 2» below):** F-11 was closed by D-192 and D-193.

## What was published (eight files and the index)

| File | Change |
|---|---|
| `tokens.json`, `01-colour.md`, `11-validation.md` | The freeze's own text (c42fecb's Second Eye corrections), which version 18 lacked: the table stripe's final wording, and two words in a copy row. **No token value changed** (diffed: one `usage` sentence). |
| `README.md` (the brand book) | A stage-1 status line, and the wordmark section marked **superseded in part**: the public wordmark «Pintar» in `#075056` (D-161, D-163(a)), the palette unchanged, the «PINTAR SELALU» question and the tab icon's colour the owner's, open |
| `components/Wordmark/README.md`, `preview.html` | **Marked SUPERSEDED, kept for the record, not removed.** A banner on the card, and the card's subtitle |
| `components/Cover/preview.html` | The cover's superseded «PINTAR» wordmark is replaced by **the placeholder «Pintar (master pending F-11)»** |
| `12-completion-4-0.md` (new section) | **Completion 4.0:** the change log against version 18; each item's outcome and status; D-172's 21 canonical patterns and the six accepted exceptions; **the provisional list**, with what each waits on |
| `design-system.json` (the index) | `lastChange` only; every other key as read |

**Not changed:** every token value, the palette, every component's behaviour and markup (`bundle.css`, `bundle.js`), every other guideline, the logo assets.

## Provisional, as the page marks it

- every wordmark slot, and the reversed version (F-11);
- «Akun PINTAR Anda di …» (Dr Gladys);
- the six context expressions (G1);
- the report titles and the class/school labels (G6, G2);
- the PD Kelas footnote;
- A4 C3 and C9;
- the new keys awaiting copy approval;
- B3;
- the «PINTAR SELALU» and tab-icon questions.

## Acceptance checklist

- [manual] The page lists its change log against version 18 (`12-completion-4-0.md`, «Change log against version 18»). **Done.**
- [manual] No provisional section is presented as final: each is marked, with what it waits on («Provisional, and why»; the brand book's note; the Wordmark card's banner). **Done.**
- [manual] The superseded Wordmark card is marked superseded, not silently removed. **Done.**
- [manual] Stage 2, after F-11 and the gated decisions: the provisional sections resolved, and the page republished with its change log against version 20.
- [auto] **D-172:** the page itself states the canonical patterns as the reference for equivalent interactions.

## Stage 2 (6 Nov)

**Why now:** D-192 (the text wordmark) and D-193 (in Inter Bold) closed F-11, the gate stage 1 was waiting for. W1.2 (A1) and W3.8 (C1) are accepted (D-166(b), D-167) and built on the engineering branch, so neither is provisional. Only their pending words are.

| Changed | What |
|---|---|
| `components/WordmarkText/` (new) | «Wordmark (text)»: the specification, the size ladder (22 / 18 / 16 px on screen; email 22 px and the card in it 16 px; the certificate 4.33 mm; the Digital Card 3.99 mm), clear space X, four versions with their contrast, and what is never done |
| `components/bundle.css` `.pds-merek` | Corrected from the superseded Helvetica proof (`#245F55`, weight 500) to the text wordmark (Inter Bold 700, embedded from the product's own OFL file; `#075056`; 0.14 em). Every shell preview now shows it. The old rule is kept as `.pds-merek-lama` for the superseded card only |
| 63 previews | `role="img" aria-label="PINTAR"` removed from the wordmark: it is text, and its name is its text |
| `components/Wordmark/` | The banner and subtitle: superseded by D-161, then D-192 and D-193; it still shows its own record |
| `components/Cover/preview.html` | The placeholder replaced by the wordmark |
| `assets/Logos/README.md` | No logo files: none were made, and none are to be |
| `components/AppShell/README.md` | The wordmark's sizes from the new ladder; not in the rail |
| `README.md` | Stage 2 status; the brand block |
| `12-completion-4-0.md` | Stage 2; the change log against version 18; A1, C1, D1, D5 outcomes; the provisional list without F-11 |

**Two corrections to the build,** for engineering (hand-off H27, H28):
- the card in an email: 16 px, not 13 px;
- the Digital Card's slot: 18.0 mm wide, not 16.4 mm.

**Still provisional on the page:** Dr Gladys's words (D1, E2 G1, C1 G6 and G2, C2, A4), copy approval for the new keys, B3, and whether «PINTAR SELALU» ever appears in running text.

**Checklist (stage 2)**
- [auto] The page lists its change log against version 18 (`12-completion-4-0.md`).
- [auto] The superseded Wordmark card is marked superseded and kept: its banner, its subtitle, and its proofs drawn with `.pds-merek-lama`.
- [auto] No provisional section is presented as final: the provisional table lists each one and what it waits on.
- [auto] `.pds-merek` is Inter Bold 700, `#075056`, 0.14 em; no preview names the wordmark with `role="img"` (0 left).
- [auto] DS harness: 61 previews, 0 failures; the eight shell specimens re-rendered, 0 failures.
- [auto] No token value changed (`tokens.json`, `render/tokens.css` untouched).
- [manual] Engineering's slots checked against the ladder on staging, once D-193 is there: the clear space X at every surface, and the two corrections above.
