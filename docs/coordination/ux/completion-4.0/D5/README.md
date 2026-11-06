# D5 · The brand and wordmark slots (re-scoped by D-161)

> **SUPERSEDED (6 Nov) by D-192 and D-193; kept as the record.** F-11 closed without a master: the wordmark is «PINTAR» as live text in Inter Bold, `#075056`. The slots are now the text wordmark's size ladder, clear space and versions, in «Wordmark (text)» in the design system. One correction carries over from this geometry: the Digital Card's slot is **18.0 mm** wide (the word at 3.99 mm is 17.1 mm of ink), not 16.4 mm, which was drawn for «Pintar». The placeholder below is no longer drawn anywhere.

**Form C (geometry only).** Register entry D5.
**Reconciled (D-163(a)):** the wordmark is **«Pintar» in `#075056`** in every slot once the master exists. The interface palette is unchanged (`--pintar-primary` `#245F55`).
**Never here:** the artwork, a master, or anything that would freeze one (F-11). Every slot holds **the provisional placeholder, a box at the slot's exact size and position, labelled «Pintar (master pending F-11)»**.
**Not mine, and not decided here:** where «PINTAR SELALU» replaces «PINTAR» in running text, and the tab icon's colour (the owner's).

**Files:**
- `buat-d5.mts`: run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/D5/buat-d5.mts`.
- `d5.css`.
- `render/slot.png` and `slot.html`: the six slots to scale.
- `render/laporan.txt`.

---

## 1. How a slot is defined

**A slot fixes the cap height and the baseline. The width follows the master's own ratio, between a floor and a ceiling.**
- «Pintar» in mixed case is narrower than the superseded «PINTAR» in capitals, so a fixed width would distort it or leave a hole.
- **The cap height** is the height of the «P»: «Pintar» has no descender, and its ascender is at or under the cap.
- **The floor** is the smallest legible width: 66 px on screen, 15 mm in print (the existing rule).
- **The ceiling** is the room the layout has: the slot never pushes what is beside it.
- **The clear space** on every side is at least half the cap height in the product, and the full cap height when the wordmark stands alone.

**When the master arrives, one file per slot changes and nothing else:** `MerekPintar`, `MerekSertifikat`, `MerekKartu` and the email's header image. Each keeps its slot.

## 2. The slots

| Slot | Cap height | Width (floor – ceiling) | Clear space | Position |
|---|---|---|---|---|
| **Shell · staff navigation** (expanded) | 18 px (`--wordmark-nav`) | 66 – 120 px | ≥ 9 px (the navigation's 16 px padding gives it) | 16 px from the navigation's left edge; vertically centred in the head, beside «Ciutkan navigasi». **Not shown in the rail** (72 px cannot hold it with its clear space; DS/05). |
| **Shell · top bar** (under 1024 px; the learner, focus and public shells) | 16 px (`--wordmark-bar`) | 66 – 104 px | ≥ 8 px | 16 px from the bar's left edge; vertically centred in the bar |
| **Shell · standalone** (sign-in, the lock, an error page, the refusal) | 24 px (`--wordmark-standalone`) | 66 – 160 px | ≥ 24 px (full) | above the task, aligned to its column's start |
| **Certificate · header** (A4) | 3.15 mm | 15 – 20 mm | ≥ 1.6 mm | upper right, on «SERTIFIKAT PENGUASAAN»'s baseline, its right edge on the right text margin (D-120 Q16; `MerekSertifikat`). The sheet is frozen; only the slot's content changes. |
| **Digital Card · front** | 2.9 mm | 15 – 18 mm | ≥ 1.45 mm | top left, on the 6 mm text margin, the cap top at 5.57 mm (card round 2 §L; `MerekKartu`). The card is frozen; only the slot's content changes. |
| **Email · header** (for the master) | 20 px | 66 – 120 px, in a 120 × 40 px box | ≥ 10 px | the frame's top left (D1). **Until F-11 the interim logo keeps today's pinned 104 × 58 px** (D1 P3). The card block's own slot in the card email is 96 × 32 px (D1). |

**The smallest on screen:** a 12 px cap height (`--wordmark-min`). Below that, «PINTAR» is written in the text face instead (the existing rule). Which name the text face writes is the owner's (§ above).

## 3. The placeholder specification that replaces the superseded Wordmark card

The DS's Wordmark card («PINTAR» in capitals, `#245F55`, «the only identity inside the product») is **superseded, not removed**. D4's republished page marks it so. Its rules are replaced, provisionally, by:

- **The size ladder:** standalone 24 px · navigation 18 px · bar 16 px · minimum 12 px (screen); certificate 3.15 mm · card 2.9 mm · minimum 15 mm wide (print). Unchanged from the superseded card; only the word changes.
- **Clear space:** half the cap height in the product; the full cap height standing alone. Nothing else enters it, including the collapse control and the bar's place name.
- **Versions:**
  - **positive:** «Pintar» in `#075056` on a light ground, the one version for every slot above;
  - **reversed** (a dark ground: the email in dark mode, the product's dark theme): **provisional, defined with the master (F-11)**. Until then the placeholder's label is drawn in `#86CFBF` on dark, as D1 does, and nothing is frozen.
- **Never:** live text standing for the wordmark; a squashed or stretched master (height set, width from the ratio); a wordmark in the rail; a coloured box behind it.
- **Images blocked** (email): every email stays understandable without it (D1, the owner's addendum). Its alt is today's «PINTAR» until F-11, then «Pintar» with the master (D1 P2).

## 4. Acceptance checklist

- [auto] Each slot has its cap height, width floor and ceiling, clear space and position stated in px or mm (the table, and `render/slot.html` to scale).
- [auto] The placeholder is labelled «Pintar (master pending F-11)» in every slot (`render/laporan.txt`: 6 of 6).
- [auto] The shell's rail shows no wordmark; the minimum is never below a 12 px cap height on screen or 15 mm in print.
- [manual] When the master exists: each of the four files swapped, and every slot's render checked against this geometry. Nothing else changes.
- [manual] D4's republished page marks the old Wordmark card superseded, and this specification provisional.
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): one slot rule (cap height, ratio, clear space) for every surface; P19 / P20 (the shell's head).
