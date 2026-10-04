# Proposal and open questions

**This is a proposal.** It changes nothing in PINTAR and renames nothing in `src/`. It is applied only after Yazid approves it, in a separate UI/UX application pass. That pass changes no behaviour, permission, journey or business rule: this is a visual and interaction system, not a redesign of the product.

## Built from what exists

Token set v3 evolves token set v2 (`src/app/globals.css`); it does not replace it. It starts from the design spec (`docs/coordination/design/PINTAR-DESIGN-SKILL-SPEC.md`), the components in `src/app/experience.css`, the shared interaction components (TombolKirim, BarisHasil, MemuatHalaman, TandaTautan), the shells (CangkangPengalaman, SesiSaya, `tempat.ts`) and the copy table (`src/lib/hle.ts`).

- **Every token** says in its usage note whether it is KEPT, CHANGED (and why) or NEW, and NEEDS A RULING where it departs from an existing ruling.
- **Every component** says the same in its guideline's Status line.
- **Every v2 colour value is kept.**

## Departures from existing rulings: for Yazid, not decided here

| Ruling today | This proposal | Question |
|---|---|---|
| No shadow tokens: hairlines and grounds, by design | Two small shadows, only on layers floating over the page (menus, dialogs, drawers), and a scrim | 5 |
| Radii 8, 12 and pill | A fourth, 4 px, for checkboxes and tags (replacing today's literal 6 px) | 7 |
| Motion: colour and opacity, 160 ms | Kept as the default. Two more durations, 8 px travel for an entering layer and a turning chevron are proposed, and unused | 8 |
| No modal outside the tour (spec §5) | One use for a dialog: a short destructive question from a menu («Keluar dari semua perangkat?») | 6 |
| The header shell, CangkangPengalaman | A left navigation for staff | 1 |
| 560 px phone breakpoint | Shell bands at 640, 1024 and 1280 | 1 |
| Field outlines at `line-strong` (1.6:1) | `line-control` at 3:1 or better | 3 |

**Not a departure:** the font weights. v3 uses exactly v2's: Plus Jakarta Sans 400 and 600, and IBM Plex Mono 500 for identifiers (`.pin-mono` today). No third weight.

## What is new in v3

| Addition | Why |
|---|---|
| `line-control` #808A91 | Field outlines meet WCAG 1.4.11 (3:1). |
| `surface-3`, `pintar-primary-pressed`, `status-blocked-hover` and `-pressed` | A pressed state for every button family; v2 has hover only. |
| `ink-disabled` | One disabled look, readable at 3.2:1. |
| `control-md` 44 as every control's height | Ends the sub-44 controls: `.pin-btn` and `.pin-input` (40), the question navigator (34), the question bar (32), the language switch (26). |
| The type ladder at 8 sizes | v2 has 14 interface sizes, several a pixel apart. |
| `t-page-compact` 26 | One phone title, replacing the literal 26, 27 and 32 px. |
| Lucide icons, about 40 (ISC) | PINTAR has no icon set; the rail and icon-only buttons need one. |
| A skip link | Spec §13 records its absence. |
| The identity screens of Gates 3 to 6 | One look for activation, the code, password rules, recovery, the PIN, the lock, the device question and the idle warning. |

## What becomes one

| Today | v3 |
|---|---|
| Five tab-like controls: `.pin-tabs`, `.pin-switch`, `.pin-seg`, `.pin-lingkup`, the language switch `.pin-lang` | Tabs and the segmented control |
| `.pin-btn` (40 px), `.pin-mbtn`, `.pin-num-btn`, `.pin-sesi-keluar`, the sign-in button | One button, five families, three sizes |
| `.pin-pill`, `.pin-sehat-tanda`, `.pin-kelas-tanda` | One badge (and `.pin-sehat-tanda.pin-perhatian`, attention drawn in blocked colours, ends) |
| `.pin-msg`, `.pin-banner`, `.pin-hasil`, `.pin-pending` | The result line, the alert and the loading shell |
| Konfigurasi's and Studio's Tailwind classes | The same components as every other surface |

The full class-by-class map is in «Migration map».

## What does not change

- Every v2 colour value, the two faces and their weights, the 4 px spacing scale, the content widths.
- The learner's question stem (21 / 19), the focus shell, the public verification shell.
- The card and the certificate, their colours and the warm gold line (D-074, D-080, and the 4 Oct rulings).
- The interaction components' behaviour: TombolKirim's one-save guard, TandaTautan, MemuatHalaman, BarisHasil, HalamanGalat, HalamanPenolakan.
- Status discipline (spec §6): no blocked ground on Management pages, readiness on the quiet ground, no red-to-green scale, nothing by colour alone.
- Every permission, journey and rule. A place in the navigation still decides nothing.

## Found while studying, outside this proposal

- **Two live lines claim an email was sent.** D-098(c) says PINTAR is sending, never that it has sent:
  - akun.terkirim: «Kartu sudah dikirim ke email Anda.»
  - aktifkan.w_kartu_terkirim: «Kartu PINTAR Anda juga sudah dikirim ke email Anda.»
  EMAILJUJUR-L01 checks only the two code-email lines. These two are for the copy pass, through the copy table; nothing in `src/` was changed here.
- **Field outlines are 1.6:1 today**, under WCAG 1.4.11's 3:1 for a field's boundary (question 3).

## Questions for Yazid

1. **The shells.** Staff get a sticky left navigation, replacing CangkangPengalaman's staff header; learners keep the top bar at every width (two places do not earn a sidebar, and a child's screen belongs to the lesson). The shell changes at 640, 1024 and 1280 px. Agree?
2. **«Terbitkan → Menerbitkan… → ✓ Selesai».** Your brief says «Selesai»; the spec's earlier proposal (§18(3)) said «Diterbitkan», which names what happened, as D-047(e) asks of results. Keep «Selesai», or use «Diterbitkan»?
3. **Field outlines at 3:1.** Every field becomes visibly firmer (#808A91 instead of a 24 % hairline). It is the accessible choice; it is also the most visible change here. Agree?
4. **The type ladder.** Some sizes move by 1 or 2 px (13 → 14, 17 and 20 → 18, 24 → 22). Agree to the eight sizes?
5. **Shadows on floating layers only**, small, with no blur filter: an exception to "no elevation". Or keep layers flat, with a hairline and the scrim only?
6. **One kind of dialog:** a short destructive question asked from a menu, such as «Keluar dari semua perangkat?». The in-page confirmation stays the default. Agree?
7. **A 4 px radius** for checkboxes and tags, replacing today's literal 6 px: a fourth radius beside 8, 12 and pill. Agree, or fold them into 8?
8. **Motion.** v2 rules colour and opacity at 160 ms, and that stays the default. Do you want any of: a faster 120 ms for hover, a 240 ms for layers entering, 8 px of travel for an entering layer, a chevron that turns? All off under reduced motion.
9. **Lucide as PINTAR's one icon source,** about 40 icons copied into the product (ISC licence). Agree?
10. **WCAG 2.2 AA** as PINTAR's named accessibility standard (spec §18(9)), with the skip link. Agree?
11. **The menu.** The staff navigation lists today's places only; grouping appears only for an educator who also learns («Mengajar», «Belajar»). Any change to order or grouping before the application pass?

## Where the playground lives

**Outside the product.** The playground is this Design System page, a private claude.ai artifact, and its source files in the repository at `docs/coordination/ux/sistem-desain/`. It is not a route in the app: no public surface, no inventory entry and no change to `src/`. If a development-only route is wanted later, it would return 404 outside development (as `/api/dev` does) and need its route and surface inventory entries and the token check (UX1-S0-TOKEN-01).

## If approved: the application pass

Each step is one change with its own tests and one CI run. None starts before the approval.

1. **Tokens.** Token set v3 in `globals.css`, with v2 names kept as aliases until no surface uses them. UX1-S0-TOKEN-01 and UX1-S0-CONTRAST-01 move to v3.
2. **Primitives.** Button (and TombolKirim's states), fields, the segmented control, tabs, badges, the result line (BarisHasil), the alert. A target-size guard joins the selftest.
3. **The shells,** if question 1 is approved: the staff navigation and the learner top bar, from today's place map. Nothing about who may go where changes.
4. **Surfaces, one area at a time:** the learner's, the teacher's, Pimpinan, then Konfigurasi, Pendataan and Studio (the last Tailwind surfaces). Each with 320 and 1280 px screenshots, the X.6 crawl and an accessibility run.
5. **Copy:** the two email lines above, through the copy table.

## Not received

The brief mentions attached visual references. None reached this session, so the proposal was built from the brief's words and PINTAR's own system. If they matter, send them and I'll check the proposal against them.
