# Colour

PINTAR is a quiet, neutral interface with one green. Colour appears where it means something: an action to take, a place you are, a state to read. It never fills a screen because the screen looks empty.

## The palette and its roles

| Role | Token | Value | Rule |
|---|---|---|---|
| Canvas | `surface-0` | #FBFAF7 | The page and the navigation. |
| Object | `surface-1` | #FFFFFF | Tables, sheets, fields, dialogs, menus: things that stand apart. |
| Well, hover | `surface-2` | #F3F1EC | Quiet grouped information; the hover ground. |
| Pressed | `surface-3` | #EBE8E1 | **New.** The pressed ground of neutral controls. |
| Text | `ink-1` / `ink-2` / `ink-3` | #1F2A33 / #4E5A64 / #5F6A73 | Primary, secondary, metadata. |
| Disabled | `ink-disabled` | #7F8890 | **New.** Readable (3.2:1) though WCAG exempts it. |
| Hairline | `line` | ink at 12% | Divides. Never outlines a field. |
| Button outline | `line-strong` | ink at 24% | Secondary buttons, tags. |
| Field outline | `line-control` | #808A91 | **New, needs a ruling (question 3).** Every field, checkbox, radio and switch: 3:1 or better. |
| PINTAR green | `pintar-primary` | #245F55 | The one primary action, links, focus, a checked control, and a selection that must read at 3:1: the selected segment and the current page are filled, as v2's are. |
| Selected | `pintar-primary-soft` | #E3EFEC | The current place, a selected row. Never success. |
| Hover, pressed | `pintar-primary-hover`, `-pressed` | #1E5148, #19443D | The primary button's states (pressed is new). |
| Success | `status-ok` + soft | #2F6E4A on #E4F2EA | A confirmed change, a verified result. Always ✓ and a word. Rare. |
| Attention | `status-attention` + soft | #8A5F00 on #F7EED8 | Needs a look; nothing is broken, nobody did wrong. |
| Error, destructive | `status-blocked` + soft | #8C3B3B on #F6E4E4 | A failure, a refusal, a destructive confirmation. Never on a person. |
| Information | `status-info` + soft | #3D5A80 on #E7EDF5 | Neutral news. |
| Scrim | `scrim` | ink at 32% | **New, needs a ruling (question 5).** Behind a dialog or drawer only; no blur. |
| Context | `context`, `context-ink` | = `ink-1`, = `surface-0` | **New role, needs a ruling (question 12).** The accent without a new hue: one full-width band for a mode that changes what the screen means (MODE PERAGAAN, a preview of a learner's screen). Nowhere else. |

## Rules

- **Accent colour earns its place or stays out** (Yazid, 4 Oct). An accent may say context, hierarchy, state or attention; it never decorates, and the default screen stays calm. PINTAR already has an accent for each of those jobs:
  - **state and attention:** the four status colours, always with a word;
  - **hierarchy:** `pintar-primary`, the one primary action and the current selection (in a chart, the one value the page is about);
  - **context:** proposed, the `context` band in deep ink (question 12).
  No new hue is proposed. The free hue space is narrow: green is identity and success, amber, red and blue are status, and plum, the family greens, teal and the gold line belong to the card and the certificate. A new hue waits for a use none of these can carry (question 12).
- **One green, two meanings kept apart.** `pintar-primary` means "act here" or "you are here"; `status-ok` means "this really happened". They differ by only 1.2:1 in lightness, so success never relies on colour: it always has ✓ and a word, and it never fills a button at rest.
- **Success is rare.** It appears when a change is confirmed (the ✓ state of an action and its result line), when something becomes available, or on a verified result. Never as decoration, never for "normal".
- **Status discipline, already ruled** (spec §6, citing `experience.css`), kept unchanged:
  - Management pages have no red `status-blocked` ground at all; the reddest thing Management says is that someone was asked to look.
  - Readiness always uses the quiet ground: a figure PINTAR may not yet interpret is not a warning.
  - Feedback has no red-to-green scale; a distribution reads as a shape, in one ink.
  - Nothing is carried by colour alone.
- **Status is never on a person.** A learner is never red.
- **Nothing is carried by colour alone.** A badge has its word; a field in error has its message; a selected item is also bold.
- **Identity colours are not interface colours.** The card family colours (D-074) and the warm gold line belong to the card and the certificate only.
- **Light only.** PINTAR has no dark theme (`color-scheme: light`), and this proposal adds none.

## Contrast

Computed from `tokens.json` by `alat/kontras.py`. Text needs 4.5:1; a field outline, a focus ring or a mark that carries meaning needs 3:1.

| Pair | Text or mark | Ground | Contrast | Floor | |
|---|---|---|---|---|---|
| Body text | `ink-1` | `surface-0` | 14.00:1 | 4.5:1 | pass |
| Body text | `ink-1` | `surface-1` | 14.61:1 | 4.5:1 | pass |
| Body text | `ink-1` | `surface-2` | 12.94:1 | 4.5:1 | pass |
| Body text | `ink-1` | `surface-3` | 11.94:1 | 4.5:1 | pass |
| Body text, selected | `ink-1` | `pintar-primary-soft` | 12.40:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `surface-0` | 6.77:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `surface-1` | 7.07:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `surface-2` | 6.26:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `pintar-primary-soft` | 6.00:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `surface-0` | 5.30:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `surface-1` | 5.53:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `surface-2` | 4.90:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `pintar-primary-soft` | 4.70:1 | 4.5:1 | pass |
| Disabled text (WCAG-exempt; kept readable) | `ink-disabled` | `surface-2` | 3.19:1 | 3:1 | pass |
| Disabled text | `ink-disabled` | `surface-1` | 3.60:1 | 3:1 | pass |
| Link, quiet button | `pintar-primary` | `surface-0` | 7.08:1 | 4.5:1 | pass |
| Link, quiet button | `pintar-primary` | `surface-1` | 7.39:1 | 4.5:1 | pass |
| Link on hover ground | `pintar-primary` | `surface-2` | 6.54:1 | 4.5:1 | pass |
| Selected segment, current page | `pintar-primary-ink` | `pintar-primary` | 7.39:1 | 4.5:1 | pass |
| Selected segment on its track (non-text) | `pintar-primary` | `surface-2` | 6.54:1 | 3:1 | pass |
| Context band (question 12) | `context-ink` | `context` | 14.00:1 | 4.5:1 | pass |
| Primary button | `pintar-primary-ink` | `pintar-primary` | 7.39:1 | 4.5:1 | pass |
| Primary, hover | `pintar-primary-ink` | `pintar-primary-hover` | 9.03:1 | 4.5:1 | pass |
| Primary, pressed | `pintar-primary-ink` | `pintar-primary-pressed` | 10.85:1 | 4.5:1 | pass |
| Destructive confirm | `pintar-primary-ink` | `status-blocked` | 7.49:1 | 4.5:1 | pass |
| Destructive, hover | `pintar-primary-ink` | `status-blocked-hover` | 9.32:1 | 4.5:1 | pass |
| Destructive, pressed | `pintar-primary-ink` | `status-blocked-pressed` | 10.39:1 | 4.5:1 | pass |
| Destructive words | `status-blocked` | `surface-1` | 7.49:1 | 4.5:1 | pass |
| Destructive words, hover | `status-blocked` | `status-blocked-soft` | 6.11:1 | 4.5:1 | pass |
| Success badge / result | `status-ok` | `status-ok-soft` | 5.27:1 | 4.5:1 | pass |
| Success on white | `status-ok` | `surface-1` | 6.09:1 | 4.5:1 | pass |
| Attention badge | `status-attention` | `status-attention-soft` | 4.89:1 | 4.5:1 | pass |
| Error badge, error text | `status-blocked` | `status-blocked-soft` | 6.11:1 | 4.5:1 | pass |
| Info badge | `status-info` | `status-info-soft` | 6.00:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-attention-soft` | 12.65:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-blocked-soft` | 11.92:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-ok-soft` | 12.65:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-info-soft` | 12.41:1 | 4.5:1 | pass |
| Field outline (non-text, 1.4.11) | `line-control` | `surface-1` | 3.52:1 | 3:1 | pass |
| Field outline | `line-control` | `surface-0` | 3.37:1 | 3:1 | pass |
| Field outline | `line-control` | `surface-2` | 3.12:1 | 3:1 | pass |
| Focus ring (non-text) | `focus-ring` | `surface-0` | 7.08:1 | 3:1 | pass |
| Focus ring | `focus-ring` | `surface-1` | 7.39:1 | 3:1 | pass |
| Focus ring | `focus-ring` | `surface-2` | 6.54:1 | 3:1 | pass |
| Focus ring | `focus-ring` | `pintar-primary-soft` | 6.27:1 | 3:1 | pass |
| Checked control fill (non-text) | `pintar-primary` | `surface-1` | 7.39:1 | 3:1 | pass |
| Error edge (non-text) | `status-blocked` | `surface-1` | 7.49:1 | 3:1 | pass |

**For information, not a pass:**
- `line` (the hairline) on `surface-1` is 1.26:1 and `line-strong` 1.61:1. Neither identifies a control on its own: a field uses `line-control`, and a secondary button is identified by its words.
- `status-ok` against `pintar-primary` differs by 1.21:1 in lightness. That is why success always carries ✓ and a word.
