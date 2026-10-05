# Navigation

**Upper navigation is what I can do in PINTAR. The bottom is me.**

**This is a proposal, not a change.** A sticky left navigation would replace the staff header of today's shell (CangkangPengalaman), so nothing here is applied without Yazid's approval (question 1).

## The four shells

| Shell | Who | What it carries |
|---|---|---|
| **Staff** (App shell) | Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform | A sticky left navigation: the PINTAR wordmark, the person's places, Bantuan where a tour exists, and at the bottom the identity block (their own name, role and school, a menu with Akun saya and the language) with «Keluar» visible under it. |
| **Learner** (Learner shell) | Murid | A top bar at every width: Belajar and Sertifikat, Bantuan, the language, «Bukan akun Anda?» and «Keluar». No name: a learner is never named on a shared screen (S15, D-020). A child's screen belongs to the lesson; two places do not earn a sidebar. |
| **Focus** | A learner inside an assessment | The wordmark, the language, «Bukan akun Anda?» and «Keluar». No other way out of a timed task. |
| **Public** | Anyone holding a verification link | The wordmark, «Pemeriksaan sertifikat» and the language. No way into PINTAR. |

Focus and Public are today's shells, unchanged.

## Which places each person sees

**This proposal does not invent the menu.** The staff navigation lists exactly the places today's product already offers each person, from the same sources the code uses:

| Source | What it decides |
|---|---|
| D-010, through `berandaPeran` | Each role's home: Guru → Kelas (`/mengajar`), Kepala departemen and Dekan → Pimpinan, Admin sekolah and Admin platform → Konfigurasi. |
| DAISY-11 (`PERAN_STUDIO`) | Studio, for the roles that may draft: Guru, Kepala departemen, Admin sekolah, Admin platform. Not Dekan. |
| WP6B | An educator also sees Pembelajaran Saya (`/belajar`), always, whether or not they are enrolled. |
| Konfigurasi's own links | Pendataan (when the school may run an intake), Aktivasi akun, and for Admin platform, Keamanan and Email uji. |
| C17 | Akun saya is for staff only. A learner sees no PINTAR-ID screen. |

The roles come from the person's active role assignments, never from `display_role`, and a place shown decides nothing: every destination still checks on arrival.

What changes is where the places are drawn: the top-bar tabs become the left navigation, and Konfigurasi's links to other places move into it. **The final menu, with its order and any grouping, is confirmed with Yazid in the application pass.**

## Grouping and collapsing

- **Group labels only where a person has two contexts.** An educator who also learns (WP6B) sees «Mengajar» and «Belajar». Everyone else sees one plain list.
- **No collapsible categories** today: no one has more than six places. Collapsible groups come only if a role ever has more than seven.
- **A place a person may not use is absent**, never disabled, locked or greyed out.

## The navigation item

- 44 px tall; icon 20 px in `ink-3` and its name in `t-body` `ink-2`.
- Hover: `surface-2`. Pressed: `surface-3`. Focus: the ring, inset.
- **Current:** `pintar-primary-soft` ground, `ink-1` text at 600, the icon in `pintar-primary`, and `aria-current="page"`. Unmistakable without shouting.
- **Clicked:** the working dot appears at once (today's TandaTautan), until the next page is on screen.

## «Keluar» and the name

- «Keluar» is visible on every signed-in screen, without opening anything: at the bottom of the navigation, as an icon (with its name) in the rail, and in the top bar under 1024 px (D-009, DAISY-02).
- Staff see their own name in the identity block. A learner is never named on any screen, because school computers are shared (S15, D-020): the learner's bar says «Bukan akun Anda?» beside «Keluar».

## Small screens

- **Rail (1024 to 1279 px, or collapsed by the reader):** icons only, 72 px wide. Each has its name as an accessible name and as a tooltip. The wordmark is not shown: 72 px cannot hold it with its clear space.
- **Under 1024 px:** a top bar (the wordmark, the current place's name, «Keluar», a menu button). The menu opens a left drawer with the same places and the identity block.

## Within a page

- **Tabs** switch between views of one thing: pages (links with `aria-current`) or panels (`role="tablist"`, arrow keys move). Underline and weight for the selected tab.
- **The segmented control** chooses one value from two to four: a filter, a language, a view. It is not navigation.
- **The scope line** names where a page sits, only when it is three or more levels deep («Pimpinan / SDN Kaliandra 1 / Bagian Matematika / Kelas 5A»). Otherwise a back link names its destination.
- **Pagination** says where you are, how much there is and how to move: «Menampilkan 21–40 dari 312», «Halaman 2 dari 16», and two buttons. Page numbers only for reports people jump around in. «Tampilkan 50 lagi» for a list read in order.

Today's five tab-like controls (`.pin-tabs`, `.pin-switch`, `.pin-seg`, `.pin-lingkup` and the language switch `.pin-lang`) become these two: Tabs and the segmented control.
