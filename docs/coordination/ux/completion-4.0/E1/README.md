# E1 · W3.12: J3's navigation restated under L3

**Form C (composition).** Register entry E1 (OP-1, OP-2, F-12(5)).
**Status:** design accepted (owner, 4 Nov), with one correction applied below: in the rail, a link's own text stays in the accessibility tree, visually hidden (§4). **O12:** the menu order is confirmed (§1).

**Authority:** owner ruling **O6, option (a)**, 4 Nov:
- restate the existing J3 navigation design under the approved L3 working-context model;
- preserve the established single-context behaviour;
- complete the 1024–1279 px rail, collapse behaviour, labels, the context control and the responsive states.

**One experience with E2.**
- E1 and E2 are reviewed and implemented **together**. E2's relocated context control is not built before E1 is accepted.
- D-168: the connected navigation, context selection, permissions, visible sections, refusal behaviour and role transitions are tested together (§9).

**Surfaces:** every staff shell (CangkangStaf / CangkangPengalaman with `navKonteks`, `src/components/NavKonteks.tsx`), at 0b19707.
**The shell itself is the design system's AppShell, unchanged:** its expanded navigation (248 px), its rail (72 px), its collapse control, its tooltips, its top bar and drawer (`bundle.css`, `bundle.js`). This composition places L3's content in it.

**Files:**
- `buat-e1.mts`: run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/E1/buat-e1.mts`.
- `e1.css`, which loads on top of C1's `c1.css` and E2's `e2.css`.
- `render/<state>-<width>.png` and `render/laporan.txt`.
- `jalan/<state>-<width>.txt`: the Tab order, the tooltips and the navigation's tree.

---

## 1. The composition

### What L3 changes in J3, and what it keeps

| J3 (approved 8 Oct) | Under L3 | Why |
|---|---|---|
| Two group labels, «Mengajar» and «Belajar», for an educator who also learns (question 11) | **None.** The navigation holds one context's places. | Under L3 a person works in one context at a time (D-132). The two contexts no longer share one list, so there is nothing for a label to separate (DS/05:38: «group labels only where a person has two contexts»). **OP-2 becomes the design, not a deviation.** |
| F8 · JQ7: in the rail, a hairline keeps the two contexts apart | **Retired.** There is one context in the rail. | The same reason. |
| «Where am I» answered by the group labels | **Answered by the context control** (E2) at the top of the navigation: the purpose's short name, the place, and «Mau ke mana hari ini?» for a person with another context | The control states the one context the labels used to imply |
| The rail from 1024 to 1279 px, icons only, 72 px (DS/05:56) | **Kept, and built:** the rail by default in that range | **OP-1 is closed.** Today's build shows the full 248 px from 1024 px, with no rail. |
| «Ciutkan navigasi»: the reader may collapse the navigation to the rail at 1280 and up, and expand it in the rail range | **Kept** | J3 / question 1 |
| An educator's own learning stays in the staff shell (JQ3) | **Kept:** the Belajar context, in the staff shell, its one place «Belajar» | JQ3 |
| A place a person may not use is absent | **Kept:** the places are `permukaanKonteks(k)`, the context's own surfaces | DS/05; CR-83 |

### The navigation, top to bottom (expanded: 248 px)

1. **The wordmark slot** (the placeholder; master pending F-11) and **the collapse control** («Ciutkan navigasi», `panel-left-close`, `aria-expanded="true"`).
2. **The context control** (E2): the purpose's short name, the place, and the chooser link.
   - **The purpose's short name:** «Mengajar» or «Belajar»; for Mengelola, **G1's slot `context.manage_label`**.
   - **The place:** the school, or «Seluruh platform».
   - **The chooser link «Mau ke mana hari ini?»:** only when the person holds more than one context.
3. **The places, in today's order** for the context:

| Context | Places |
|---|---|
| Mengajar · a school | Mengajar · Studio |
| Belajar | Belajar |
| Mengelola · a school (Admin sekolah) | Konfigurasi · Pendataan · Aktivasi akun · Studio · Keamanan akun · Sertifikat sekolah |
| Mengelola · a school (Kepala departemen, Dekan) | Pimpinan · Studio (Studio not for Dekan, DAISY-11) |
| Mengelola · «Seluruh platform» | Konfigurasi · Aktivasi akun · Keamanan akun · Kirim email uji · Sertifikat sekolah |

   **The order is today's, confirmed by the owner (O12).** Dekan: Pimpinan only. These are ordering rules, not permission overrides: each context still shows only the places it serves.
4. **At the bottom:**
   - Bantuan (where a tour exists) and Laporkan masalah;
   - the identity block (avatar, name, role · school), which opens Akun saya and the language;
   - «Keluar», always visible (D-009).

**Nothing else:** no counts, no badges, no group labels.

### The rail (72 px)

**When:** by default from 1024 to 1279 px, or when the reader collapses at 1280 and up. The DS's own rail:
- icons only. **Each link keeps its own text in the accessibility tree, visually hidden** (the DS's `pds-sr` technique), never `display: none` and never repeated as an `aria-label`. Its tooltip shows that same text on hover and on focus;
- the wordmark not shown;
- the identity as its avatar;
- «Keluar» as its icon, still visible.

**The toggle names the state it offers:** «Lebarkan navigasi» (`panel-left-open`, `aria-expanded="false"`) in the rail; «Ciutkan navigasi» when expanded.

**The context control in the rail** becomes one 44 px item at the top of the places. It holds the place's initials (CSS-drawn, `aria-hidden`).
- Its own visually hidden text, and its tooltip, are «Mau ke mana hari ini? · {purpose} · {place}». It is the chooser link.
- **For a person with one context it is absent.** The rail has no room for the place's name, the person has nowhere else to go, and the page's own head says where they are.

**Expanded in the rail range** (`data-ciut="tidak"`): the full 248 px navigation, the content beside it (`mengajar-dilebarkan-1100`).

### Under 1024 px

**The DS's top bar:**
- the wordmark slot;
- **the place's name** in one line (truncated with an ellipsis; the full name is in the drawer);
- «Keluar»;
- «Buka menu».

**The drawer** (`pds-drawer`, a modal dialog with «Tutup menu») holds the context control at its top, the places, then the bottom group, exactly as expanded.

## 2. Layouts

**Widths:** 1280, **1279, 1100, 1024** (the rail's range and its edges), **1023**, 820, 390 and 320 px (`render/`). The shell does not print (`pin-noprint`, as built).

| Width | Shell |
|---|---|
| 1280 and up | expanded, 248 px; collapsible to the rail |
| 1024 – 1279 | the rail, 72 px; expandable |
| under 1024 | the top bar and the drawer |

## 3. States and roles

| State | Specimens |
|---|---|
| Mengajar, a Guru who also learns (two contexts) | `mengajar` at every width; `mengajar-diciutkan-1280` (collapsed by the reader); `mengajar-dilebarkan-1100` (expanded in the rail range); `mengajar-laci-390`, `-320` (the drawer) |
| Belajar, the same Guru learning (staff shell, JQ3) | `belajar` |
| **One context only:** no chooser link in the navigation; no context item in the rail | `tunggal` |
| Mengelola, Admin sekolah (G1's name) | `mengelola`, `mengelola-laci-390` |
| Mengelola, Kepala departemen | `pimpinan` |
| Mengelola, Admin platform in «Seluruh platform» | `platform` |

**Refusal behaviour and role transitions:**
- **A refused page** is the built HalamanPenolakan, with no navigation.
- **A page of another context** sends the person to `/` with the reason (E2, `context.other_context`).
- **A context no longer held** sends them to `/` with `context.invalid`.
- **The navigation never offers a place outside the context** (CR-83). Changing context is only `/`.

## 4. Keyboard and accessibility

The walks are in `jalan/` (1280, 1100 and 390).
- **Tab order:**
  - **expanded:** the skip link, the collapse control, «Mau ke mana hari ini?», the places, Bantuan, Laporkan masalah, «Keluar»;
  - **in the rail:** the same, with the chooser item in place of the block, each with its tooltip;
  - **under 1024:** «Keluar», «Buka menu»; in the drawer, its own order from «Tutup menu».
- `nav` named «Tempat kerja Anda»; the current place carries `aria-current="page"`. The collapse control states its expanded state.
- **Checks** (`render/laporan.txt`), all 28 renders passing:
  - axe WCAG 2.2 AA;
  - targets at least 24 px; focus rings;
  - **expanded 248 px, rail 72 px, top bar under 1024** at each width and collapse state;
  - **«Keluar» visible without opening anything at every width**;
  - **every rail item named**;
  - exactly one current place;
  - **no group label**;
  - **the chooser link present only with another context** (in the rail too);
  - **the toggle's words match its state**.

**The rail's names (owner's correction, 4 Nov).**
- In the rail the DS's AppShell hides each link's text with `display: none`, which removes it from the accessibility tree.
- **The specification now is:** the text stays, visually hidden (`position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0`, the DS's `pds-sr`). The same applies to the identity block's name in the rail. No link carries an `aria-label` that repeats its text.
- **This needs one change in the DS's tooltip, which the build takes with it.** `bundle.js` `tooltip()` shows a rail tooltip only while the label is `display: none` (`perlu()`). With the text visually hidden, that test must read **«the label is visually hidden»** (its rendered width is 1 px or less), or the rail loses its tooltips. The specimen emulates the corrected test. The DS is frozen, so the change is recorded here for the AppShell and the build, and not applied to the bundle.
- **Verified** (`jalan/*-1100.txt`, the walks re-rendered):
  - each rail link is named by its own text: «Mengajar», «Studio», «Bantuan», «Laporkan masalah», «Keluar»;
  - the chooser item is «Mau ke mana hari ini? · Mengajar · SMP Cahaya Kaliandra»;
  - each shows its tooltip on keyboard focus;
  - the identity's name and role stay in the tree.

## 5. Words (T table)

**No new words in E1.**
- **The copy table at 0b19707:** `nav.*`, `keamanan.judul`, `emailuji.judul`, `sertifikat.kelola.judul`, `entry.title`, `sesi.keluar`.
- **The DS's approved shell words** (J3 README, question 1): «Ciutkan navigasi», «Lebarkan navigasi», «Buka menu», «Tutup menu», «Langsung ke isi». They are marked new there, and enter the copy table with the build.
- **J3's group label «Mengajar»** (question 11) is no longer used as a label. It stays the purpose's short name in the context control (`nav.kelas`).
- **G1's slot:** `context.manage_label`, Dr Gladys's.

## 6. Components and tokens

**Components:** AppShell (navigation, rail, collapse, tooltip, top bar, drawer), the navigation item, the identity block, E2's context control, Icons (`panel-left-close/open`, the places' icons, `circle-help`, `triangle-alert`, `log-out`, `menu`, `x`, `chevron-right`).

**Tokens only;** no new token. The rail's initials use `surface-2`, `ink-1`, `radius-md`.

## 7. Navigation and outcomes

| Action | Outcome |
|---|---|
| A place | that surface, in this context; the working dot until it arrives |
| «Mau ke mana hari ini?» (block, or rail item) | `/`, the current door marked (E2) |
| «Ciutkan navigasi» / «Lebarkan navigasi» | the rail / the full navigation. **Engineering note:** the build sets the toggle's words from the shell's state on load and at each width change, and may keep the reader's choice per device as a convenience; nothing depends on it. |
| «Buka menu» / «Tutup menu» | the drawer opens or closes; focus moves into it and returns to «Buka menu» |
| «Keluar» | sign out |

## 8. Edge cases

- **A long school name:**
  - expanded: it wraps in the block;
  - rail: the initials, the full name in the tooltip and accessible name;
  - top bar: an ellipsis, with the full name in the drawer.
- **Two schools with the same initials:** the initials are never the only carrier; the full name is the item's name and tooltip.
- **Many places** (Admin sekolah's six): the list fits the rail's height in the specimen at 1100 × 760 (`mengelola-1100`). A taller list scrolls within the navigation, never the page.
- **No working context** (an evaluation persona, C10, or a session not given one): the roles' places, as before L3 (`TabTempat`), with no context control. Unchanged.

## 9. Acceptance checklist

- [auto] Expanded at 1280 and up (248 px); the rail from 1024 to 1279 (72 px); the top bar and drawer under 1024. Checked at 1280, 1279, 1100, 1024, 1023, 820, 390 and 320.
- [auto] The reader's collapse and expand: rail at 1280 when collapsed; full in the rail range when expanded; the toggle says «Ciutkan navigasi» or «Lebarkan navigasi» to match.
- [auto] In the rail, every link's own text is in the accessibility tree and visually hidden (never `display: none`); no navigation link carries an `aria-label`.
- [auto] A focused rail link shows its tooltip, with the same words as its name (the DS tooltip's corrected test).
- [manual] With a screen reader (NVDA, TalkBack), each rail link is heard once, by its own words; the tooltip is not read twice (it is `aria-hidden`).
- [auto] «Keluar» visible without opening anything, at every width (D-009).
- [auto] No group label under one context; exactly one current place.
- [auto] The chooser link («Mau ke mana hari ini?», block or rail item) appears only for a person with more than one context; single-context behaviour unchanged.
- [auto] axe WCAG 2.2 AA, 28 of 28 renders; targets at least 24 px; focus rings.
- [auto] **D-168, integrated (engineering, E1 + E2 as one experience):** role and context transitions, destination availability, the context chooser, the rail, collapse, the drawer, accessibility and refusal behaviour, together:
  - for each role and context, the navigation's places equal the surfaces the context serves;
  - each surface's visible sections agree with its index (B1's E-B1-5);
  - a page of another context sends the person to `/` with the reason;
  - choosing a door changes the context and the navigation together;
  - a refused page shows the refusal without the navigation;
  - a role or context that lapses mid-session reaches `context.invalid`.
- [auto] Each context's places appear in the confirmed order (O12), and only the places that context serves.
- [manual] Side-by-side review of the build with E2 at each width (brief G:14); E:90 «compositions J3, J4 and J6 matched».
