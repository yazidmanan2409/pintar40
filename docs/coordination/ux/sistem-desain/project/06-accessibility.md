# Accessibility and school reality

Beauty must not depend on expensive hardware, animation, a fast network or a mouse.

## The standard

WCAG 2.2 AA, as a whole (spec §18(9) asks Yazid to name it), plus PINTAR's own 44 px target. Every preview in this system is checked with axe-core for WCAG 2.0, 2.1 and 2.2 A and AA, at its card width and at 390 px.

## Keyboard

- Everything works from the keyboard, in reading order.
- **Focus is always visible:** the 2 px `focus-ring` with a 2 px offset (inset inside navigation, tabs and menus).
- Tabs and menus move with the arrow keys; Home and End go to the ends; Esc closes a menu, a tooltip, a dialog or a drawer and returns focus to what opened it.
- A dialog or drawer holds focus while open (the native `dialog`).
- A scrolling table frame is itself focusable (`tabindex="0"`, `role="region"` with a name), so it can be scrolled from the keyboard.
- When a screen changes underneath the person (a new step, a result), focus moves to its heading or the error summary.
- A skip link («Langsung ke isi») is the first focusable thing on every staff page. **New:** today there is none (spec §13).

## Seeing

- Text 4.5:1 or better; field outlines, focus rings and meaningful marks 3:1 or better (see Colour).
- Nothing is carried by colour alone: every status has a word, every selection is also bold, every error has a message.
- Text can be enlarged to 200 % without loss; nothing is wider than the screen at 320 px on the pages a phone may open.

## Touching

- Every target is at least 44 px (`control-md`). Compact buttons look 36 px but keep a 44 px hit area.
- A checkbox's whole row is its target; a table row's checkbox fills its cell.
- WCAG 2.5.8's 24 px is the floor that no exception may go below.

## Hearing a screen reader

- Results are `role="status"`; failures and the error summary are `role="alert"`; working controls carry `aria-busy`.
- Every icon-only control has an accessible name; icons themselves are hidden from the reader.
- `lang` follows the reader's language; a language option is marked in its own language.

## Motion

Under `prefers-reduced-motion`, nothing moves: every duration is 0 and the working dot stays still. Nothing in PINTAR flashes.

## Lower-powered hardware

- **CSS, not effects.** No blur, no backdrop filters, no gradients, no parallax, no large shadows; only two shadows exist, on floating layers.
- **Two font files** (Latin, and Latin Extended when needed), self-hosted and swapped in, so text shows at once in the fallback face.
- **No layout shift:** images reserve their space; the working dot takes no room at rest; a loading shell has the page's shape.
- **Plain markup first:** links are links and forms are forms, so a page works before its scripts have loaded on a slow classroom tablet.

## Imperfect networks

- Every act is acknowledged at once, even if the answer takes long.
- Over 3 seconds, PINTAR says the network is slow and that a second press is not needed.
- A failure keeps the person's input and says how to try again.
- Nothing claims to be saved until the server says so.
