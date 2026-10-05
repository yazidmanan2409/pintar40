Secondary actions behind one button. Arrow keys move, Esc closes and returns focus.

**Status: NEW.** PINTAR has no menus today; for row actions and the staff identity block.

**Markup.** A button with `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`, and `div.pds-menu[role=menu]` with `role="menuitem"` items (44 px each), separators (`hr.pds-menu-pisah`) and a destructive item last (`pds-menu-bahaya`).

**Rules**
- The one primary action stays on the page; a menu holds the rest.
- A destructive item opens its confirmation; it never acts directly.
- Five items or fewer. More means the page needs structure, not a longer menu.
- The first item takes focus on open; a press outside closes it.
