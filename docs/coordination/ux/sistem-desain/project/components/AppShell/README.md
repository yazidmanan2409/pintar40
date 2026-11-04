The staff shell: a sticky left navigation with the person's places above and the person below, a rail on narrower screens, and a top bar with a drawer on small ones.

**Status: NEW, APPROVED (question 1, 5 Oct).** It replaces the staff header of today's CangkangPengalaman in the application pass, which waits for the authorised UI/UX stage. Its order and grouping are kept (question 11) and validated in composed journeys before anything changes further. Its places are today's, derived from roles and journeys; nothing about who may go where changes.

**Anatomy**
- The PINTAR wordmark (`wordmark-nav`, an 18 px cap height), and the collapse button.
- The places, from today's place map (see Navigation), with a group label only for an educator who also learns.
- At the bottom: Bantuan where a tour exists, the identity block (avatar, their own name, role and school) opening a menu with Akun saya and the language, and «Keluar», always visible.
- The main area: the page header (scope line, `t-page` title, the one primary action) and the page at its measure.

**Behaviour**
- 1280 px and up: expanded (248 px); the reader may collapse it to the rail.
- 1024 to 1279 px: the rail (72 px), icons with names as tooltips and accessible names; the reader may expand it.
- Under 1024 px: a top bar (the mark, the current place, «Keluar», a menu button) and a left drawer with the same contents. «Keluar» is visible without opening anything at every width (D-009, DAISY-02).
- A clicked place shows the working dot at once, until the next page arrives.
- `aria-current="page"` on the current place; the navigation is a `nav` named «Tempat kerja Anda».
- **In the rail (4.0 correction, E1):** each place keeps its own text as its name, visually hidden, never `display: none` and never an `aria-label` that repeats it. The identity button does the same (its name is its own text, after a visually hidden «Akun:»; WCAG 2.5.3). The tooltip and the collapse button follow the rail's state (the navigation at its 72 px), not a CSS property of the label.

**Rules**
- The navigation shows only places the person holds today; it decides nothing, and every page still checks on arrival.
- No counts, badges or dashboards in the navigation.
- The wordmark is never below `wordmark-min` (12 px cap height) and is not shown in the rail: 72 px cannot hold it with its clear space.

**Try it.** In the preview, change the person and the width, collapse the navigation, and open the identity menu.
