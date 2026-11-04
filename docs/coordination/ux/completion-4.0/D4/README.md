# D4 · W3.21: republish the Design System page, stage 1

**Form P (publication).** Register entry D4.
**The page:** the private Design System page, https://claude.ai/artifact/153KwNRJkTETDKAZSoorS1, **version 21 (A3 added after O3; version 20 was stage 1, accepted)** (published 4 Nov; it was version 18 of 8 Oct, which predated the freeze c42fecb). Private: only its owner and the people they share it with can open it.
**Source:** `docs/coordination/ux/sistem-desain/project/`, the same files the page shows, changed on this lane in the same commit.
**Stage 2** follows F-11 and the decision-gated items: it resolves the provisional sections.

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
