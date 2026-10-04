Views of one thing. The selected tab is underlined in PINTAR green and set in 600.

**Status: CHANGED.** `.pin-tabs`, `.pin-switch` and `.pin-lingkup` become this one pattern.

**Two kinds, one look**
- **Pages:** links in a `nav` with `aria-current="page"` (`a.pds-tab`).
- **Panels in one page:** `role="tablist"`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"`. Arrow keys move between tabs; Home and End go to the ends.

**Rules**
- Use tabs to switch between views of one thing. A filter is a segmented control; a choice of value is a select or radios.
- Two to seven tabs. Labels are short nouns; a count may follow in `pds-count`.
- Tabs scroll sideways on a narrow screen; they never wrap to two rows.
- Never nest tabs inside tabs.

**In PINTAR today.** `.pin-tabs` (the header), `.pin-switch` (the class switcher) and `.pin-lingkup` (scope lists) become this.
