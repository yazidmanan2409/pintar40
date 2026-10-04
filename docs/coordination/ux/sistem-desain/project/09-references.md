# Visual references (4 Oct)

Four visual references arrived after the foundation at `f76542b`:

1. **A design-system sheet:** a warm off-white ground, white cards, pill controls, a black primary, one orange accent, serif titles.
2. **A product screen at desktop and phone width:** an invoice with hairline cards, a black primary, a small green «Paid», and a timeline.
3. **Five paginations.**
4. **Five tab styles.**

They are inspiration for the design language. They are not templates, and they rule nothing: every PINTAR ruling stands. The images are not stored in the repository.

## What the four share

- **A quiet ground.** Off-white or light grey, with white objects and almost no colour.
- **One dark colour does the work:** the primary action, the selected segment, the current page.
- **One accent, rarely:** an orange active filter, a green «Paid». Otherwise none.
- **Light lines.** 1 px and pale. Cards are set apart by space and a hairline on the product screen; the showcase sheets float them on a soft shadow.
- **Quiet labels, clear hierarchy.** Small labels, generous space, and hierarchy from size and weight.
- **Selection is unmistakable:** a filled segment, a filled current page, an underline with a darker label.
- **At phone width the layout changes, not the content.** Two columns become one in reading order. The secondary actions wrap, the primary action goes full width, and the table stays a table.

## Against the foundation at f76542b

| Quality | In the references | In PINTAR at f76542b | Verdict |
|---|---|---|---|
| Restraint | Neutral, one dark colour, one rare accent | Neutral, one green, status only with a word | **Confirmed.** PINTAR green does the job the references give to black. |
| Whitespace | Generous | `space-6`/`space-8` between groups, a 760 px measure | **Confirmed.** |
| Type hierarchy | Size and weight; small quiet labels; serif titles on two sheets | One sans, 400 and 600, eight sizes | **Confirmed.** Serif not copied. |
| Density | The product screen is dense: 12 to 13 px text, 32 px rows | 16 px body, 14 px minimum, 44 px targets | **Kept PINTAR's.** Children and shared computers. |
| Borders | 1 px pale hairlines; a firm outline on the main search | `line` hairlines; fields at 3:1 (question 3) | **Confirmed.** The firm search outline supports question 3. |
| Radius | Pills for buttons, tags, segments and fields; 12 to 24 px cards | 8 px controls, 12 px panels, pill badges | **Partly.** Tags become pills. Buttons and fields stay at 8 px (question 13). |
| Containers | Everything in a card on the sheets; hairline cards on the product screen | A container must earn its place | **Confirmed** for the product. The sheets' cards are presentation. |
| Tabs | Underline on a hairline track; soft fill; icons; thick indicator | Underline and weight on a hairline track | **Confirmed** (the first style). The soft fill is PINTAR's current navigation item. |
| Pagination | Filled current page; words beside chevrons; «Page 1 of 24»; a jump | Position and two moves; page numbers with a tinted current page; «2 / 16» on a phone | **Changed.** Filled current page, a jump select, and ‹ [2 ▾] dari 12 › on a phone. |
| Selection | Filled (segments, pagination) | The selected segment drawn white on grey (a v3 draft change) | **Changed back to v2's fill.** The references, v2 and WCAG 1.4.11 agree. |
| Responsive change | Reflow, wrap, a full-width primary | The shell bands; full-width actions on a task screen | **Confirmed.** |
| Showing states | Every family, every state, labelled side by side | A card per component; Interaction states | **Partly.** New: the Specimen sheet. |
| Accent | One, rare; coloured icons on the timeline | None beyond status, always with a word | **Question 12.** |

## What changed in the playground

1. **The segmented control.** The selected segment is filled `pintar-primary` again, as in v2. The draft's white-on-grey selection read at about 1.1:1 against its track.
2. **Pagination.** The current page is filled. A report gains «Ke halaman [▾] dari 12», which reaches any page in one move, and on a phone it shows ‹ [2 ▾] dari 12 ›.
3. **Tags are pills,** outlined, beside the filled badges. Every small label now has one shape. `radius-sm` is left only for checkboxes, skeleton blocks and a keyboard key (question 7, narrowed).
4. **Accent.** A card and two role tokens, `context` and `context-ink` (question 12). No new hue.
5. **Specimen.** Every family on one sheet, the way the references present a system.
6. **Fixes found on the way:**
   - the scope line's «/» ends a line instead of starting one;
   - a switch's state word no longer wraps above the switch;
   - a segmented control no longer stretches inside a grid;
   - a count in a selected segment stays readable.

## Not copied, and why

| From the references | Why not for PINTAR |
|---|---|
| Black as the action colour | PINTAR green is the identity (v2). |
| Pill buttons and pill fields | Kept at 8 px (question 13). Indonesian labels wrap to two lines at 320 px, and a button beside a field shares its corners. |
| Serif titles | One family at two weights (v2). A second face is a brand change. |
| Borderless filled fields | No visible boundary (WCAG 1.4.11). Question 3 goes the other way. |
| Pale grey tab labels, placeholder text as the label | Below 4.5:1, and a label must stay visible once something is typed. |
| Spinners | Nothing spins in PINTAR; it uses the working dot. |
| Star ratings, «GOLD», prices | No points, badges or celebration (D-059(e)). |
| Photographs of people | A learner is never pictured or named on a shared screen (S15, D-020). Staff get initials. |
| Flags for languages | Languages are words. |
| A coloured icon per event | No meaning by colour. A history is one ink with words. |
| ⌘K search, a notification bell | No global search exists, and PINTAR promises no notifications. |
| Soft shadows under page cards, grid-paper grounds | Elevation is only for floating layers (question 5). The grids are the sheets' presentation. |
| Small 12 to 13 px text, 32 px rows | 16 px body, 14 px minimum, 44 px targets. |
| First and last page buttons («, ») | The jump select reaches any page with fewer controls. |
| Icons in tabs, a thick tab indicator | Decoration. An underline and weight say it. |

## Effect on the questions

| | |
|---|---|
| **3, field outlines** | Unchanged. The references' firm search outline supports it, and their borderless fields show what to avoid. |
| **5, shadows** | Unchanged. The product reference uses hairlines; the floating cards are only on the showcase sheets. |
| **7, the 4 px radius** | Narrowed to checkboxes, skeleton blocks and a keyboard key, now that tags are pills. The references draw small squares the same way. |
| **12, accent** | New. |
| **13, button shape** | New. |

Questions 1, 2, 4, 6, 8, 9, 10 and 11 are unchanged.
