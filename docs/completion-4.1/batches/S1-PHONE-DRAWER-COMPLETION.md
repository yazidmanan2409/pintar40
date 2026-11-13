# S-1 · The open phone drawer is no wider than the screen: completion page

**A small shell correction, after F-1 and before B2's candidate.** Source: `TEAM-INSTRUCTIONS.md` (Second Eye, item 4),
from Daisy's review of `1fc719b5127313bf24084695fa30d7505e15b5d1` (§2b). Daisy verifies it together with B2, in one
visit.

## What holds now

- The open drawer is exactly the screen's width at 390 and 320 px, on three Konfigurasi pages, with the 16 px gutter
  on both sides. Nothing inside it reaches past the screen, and the first focus ring is whole at 320 px.
- Two causes, both corrected in `src/app/experience.css`; no markup, wording or behaviour changed.
- **What else it changed:** both rules are the shell's, so they hold on every staff page, not only Konfigurasi. And
  the expanded desktop sidebar (from 1280 px) no longer shows a duplicate of the context link. The rail mode (1024 to
  1279 px) is unchanged.

## The two causes

1. **The sheet took the shell's pull-out.** `globals.css` pulls every `.pin-shell` out by a gutter on each side
   (`margin-inline: calc(var(--gutter) * -1)`). That is right for the bar in the page's flow. The open drawer, though,
   is `position: fixed; inset: 0`, so the same margins made it 32 px wider than the screen (−16 to 406 px at 390 px).
   It also kept the bar's own uneven padding (16 px left, 8 px right). That left the drawer's contents 8 px past the
   right edge.
   - Correction: the open sheet has no pull-out, and the page gutter on both sides.
   - Its grid children may also shrink (`min-width: 0`).
2. **The rail's context link showed outside the rail.**
   - `.pin-konteks-rail { display: none }` was outranked by `.pin-staf .pin-tabs a.pin-nav-item { display: flex }`.
   - So the phone drawer and the expanded sidebar showed a second copy of the context, «SP · Mau ke mana hari ini? ·
     Seluruh platform», under the context block. Its label does not wrap: at 320 px it widened the drawer to 378 px,
     and the keyboard's focus ring on it was cut at the edge.
   - Correction: `.pin-staf .pin-tabs a.pin-konteks-rail { display: none }`. The rail's own rules (more specific, from
     1024 px) still show it.

## Rendered check (local, this commit's build, the seeded world, platform admin)

| Width | Page | Sheet | Drawer | Overflowing elements | Sideways scroll |
|---|---|---|---|---|---|
| 390 | /konfigurasi, /konfigurasi/keamanan, /konfigurasi/catatan-masuk | 0..390 (before: −16..406) | 16..374 (before: 0..398) | none (before: the drawer and its items, to 398) | 0 |
| 320 | the same three | 0..320 (before: −16..336) | 16..304 | none (before: the context link and block, to 378) | 0 (before: 26 to 58 px) |
| 1280 | /konfigurasi | — | — | the context block only; the rail link is not drawn (before: both) | — |
| 1100 (rail) | /konfigurasi | — | — | the rail link only, as before | — |

Screenshots before and after, at both widths and on the three pages, were taken for Daisy (2× scale).

**Visible differences, for Daisy:**
- The duplicate context link is gone from the drawer and from the expanded sidebar.
- The language switch's «EN» is now inside the screen at 320 px.
- «Masuk sebagai Admin Platform (sintetis)» now ends with an ellipsis at 320 px instead of running past the edge.

## Next state of each consequential action (SYSTEM-INTEGRITY-4.1 §3a)

None: no action, data or permission changes.

## Cross-module inventory (SYSTEM-INTEGRITY-4.1 §2)

| Interface | Checked how | Evidence | Limitation |
|---|---|---|---|
| The staff shell's open drawer, under 1024 px | Measured on three Konfigurasi pages at 390 and 320 px; keyboard focus | The table above | Other staff pages share the rule and were not each measured |
| The expanded sidebar, from 1280 px | The context link's display | The table above | — |
| The rail, 1024 to 1279 px | The rail link still drawn | The table above | — |
| The whole suite, including the experience tests that read the shell | The pre-flight on this commit | — | — |
