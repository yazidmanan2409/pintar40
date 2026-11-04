The name of an icon-only control, shown on hover after 400 ms and at once on keyboard focus.

**Status: NEW.** Only for icon-only controls and the rail.

**Markup.** `data-tip="…"` on a control that already has the same name (its `aria-label`, or for a rail place its own visually hidden text); the tooltip is hidden from screen readers to avoid saying it twice. A rail place shows its tooltip only while the navigation is the rail (its 72 px), and at once on keyboard focus (4.0 correction, E1).

**Rules**
- Only for icon-only controls and the collapsed navigation.
- Never the only place a fact is said: a touch screen has no hover.
- One short phrase, no sentences, no links.
- Esc hides it.
