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
| Radii 8, 12 and pill | A fourth, 4 px, for checkboxes only (replacing today's literal 6 px); tags became pills after the 4 Oct references | 7 |
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
| `context`, `context-ink` (question 12) | The accent role without a new hue: one deep-ink band for a mode that changes what the screen means. |

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
- The card and the certificate, their colours and the warm gold line (D-074, D-080, and the 4 Oct rulings). The one exception, ruled on 5 Oct (question 16): their «PINTAR SELALU» line became the PINTAR wordmark.
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
7. **A 4 px radius** for checkboxes (and skeleton blocks), replacing today's literal 6 px: a fourth radius beside 8, 12 and pill. *Narrowed after the 4 Oct references:* tags are now pills like badges, so 4 px is only the small square of a checkbox, drawn as the references draw theirs. Agree, or fold it into 8?
8. **Motion.** v2 rules colour and opacity at 160 ms, and that stays the default. Do you want any of: a faster 120 ms for hover, a 240 ms for layers entering, 8 px of travel for an entering layer, a chevron that turns? All off under reduced motion.
9. **Lucide as PINTAR's one icon source,** about 40 icons copied into the product (ISC licence). Agree?
10. **WCAG 2.2 AA** as PINTAR's named accessibility standard (spec §18(9)), with the skip link. Agree?
11. **The menu.** The staff navigation lists today's places only; grouping appears only for an educator who also learns («Mengajar», «Belajar»). Any change to order or grouping before the application pass?
12. **Accent colour** (new, from your 4 Oct note). An accent where it earns its place, filled without a new hue:
    - state and attention: the status colours, with words;
    - hierarchy: PINTAR green (the action, the selection, the one value a chart is about);
    - context: a deep-ink `context` band for a mode that changes what the screen means (MODE PERAGAAN, a preview of a learner's screen).
    Every free hue sits beside a status colour or a card and certificate colour, so none is proposed. Agree to the context band, and to no new hue until a use needs one?
13. **Button and field shape** (new, from the references). Three of the four references use pill buttons, and the sheet uses pill fields. The proposal keeps v2's 8 px corners for buttons and fields: Indonesian labels wrap to two lines at 320 px, where a pill reads as a blob, and a button beside a field shares its corners. Pills stay for every small label and for the switch. Keep 8 px, or move buttons to pills?
14. **How strong a table stripe** (new, from Dr Gladys's comment). There are two options:
    - **A, proposed:** `surface-0`, existing tokens only. It is quiet (1.04:1 against white): visible on a good screen, but it may fade on a washed-out projector.
    - **A+:** #F7F6F2, halfway between `surface-0` and `surface-2`, if A proves too faint. It is a new value, though derived from two approved ones.

    `surface-2` is not proposed: neutral badges vanish on it. Please look at A on a school computer before choosing. A or A+?
15. **Date fields: the native field plus the date in words under it** (new, from Dr Gladys's comment). The field's own display follows the computer's language, and shows «10/09/2026» for 9 October on an English-language one. The line under it always says «Jumat, 9 Okt 2026, 07.30 WIB». Agree?
16. **The ID card and the certificate** (asked: do they stay «PINTAR SELALU», or move to PINTAR?). **RULED (5 Oct): approved, with a narrow reopening.**

    > The PINTAR ID Card and PINTAR Certificate remain frozen in design, layout, information architecture, colour, typography, dimensions and behaviour. The freeze is reopened solely to replace the superseded PINTAR SELALU product identity with the canonical PINTAR wordmark. This is a brand correction, not a redesign. No other changes are authorised.

    The family is one name: the application, the ID card, the certificate and the documents are all PINTAR; PT ZAYD PINTAR SELALU is the legal company. **Done, prepare only:**
    - **Card:** the front's «PINTAR SELALU» line is the wordmark. It stays in the same place and green. Its cap height went from 1.71 to 2.9 mm, the size the wordmark's 15 mm print minimum needs. See `kartu-pintar/ronde-2` README §L and render L.
    - **Certificate:** the header's «PINTAR SELALU» is the wordmark, at the same cap height and on the title's baseline; the title did not move. See `sertifikat/ronde-2` README, «The wordmark correction», and render J.
    - Nothing else in either design changed. Both are measured, before and after.
17. **A small icon** (asked: what does the browser tab show, when the wordmark cannot be read at 16 to 32 px?). **RULED (5 Oct): no new brand symbol for 4.0.**

    > The canonical logo remains the PINTAR wordmark. Do not create a standalone P, monogram, education symbol or secondary logo. A favicon/app icon is a functional identifier rather than an alternative logo. Use the simplest technically appropriate PINTAR-green treatment for now and leave a permanent app-icon design as a separate future decision.

    **Done, prepare only:**
    - A solid PINTAR-green square with nothing on it (Wordmark, «The tab icon is not a logo»), in `assets/AppIcon/`:
      - `favicon.ico` (16, 32, 48 px) and `icon.svg`, rounded;
      - `apple-icon.png` (180 px), full bleed;
      - 192 and 512 px for a manifest, if one is ever added.
    - `src/app/favicon.ico` is still the framework's default until the application pass.

**Also ruled on 5 Oct: the wordmark's typeface.**
- Helvetica Neue 65 Medium remains the canonical typeface decision.
- Production artwork and font licensing must be verified before the final master is created or distributed. This is a production and legal item; nothing here assumes what a licence permits.
- No other typeface becomes the canonical master because Helvetica Neue is unavailable in this environment.

## The canonical wordmark (approved brand ruling, 5 Oct; locked)

The wordmark is PINTAR: the name in Helvetica Neue 65 Medium capitals, in PINTAR green, and nothing else. This proposal only refines it for production (Wordmark):

- tracking +50 with metric kerning and one optical pass;
- #245F55, CMYK 84 43 65 29;
- clear space X, the cap height;
- smallest size 12 px cap height on screen, 15 mm wide in print;
- four versions: green on light, white on green, black, white;
- sizes `wordmark-nav` 18, `wordmark-bar` 16, `wordmark-standalone` 24.

It replaces the supplied «PINTAR SELALU» artwork in every specimen, and, since question 16 was ruled, the «PINTAR SELALU» line on the ID card and the certificate.

**Still needed: the outlined master,** made from Helvetica Neue 65 Medium and no other face. **Required first:** verify that the font licence permits logo artwork, outlining, and distributing the outlined files (Wordmark, «Master artwork and the font licence»). Until the master is made, every wordmark here is a proof in the viewer's own face, labelled as one.

## Dr Gladys's comments (5 Oct)

Two comments were accepted as design-system requirements. Both are prepared here and neither is applied.

1. **Table rows are striped.** Five table roles, all existing colours: the header's own ground, rows alternating white and the canvas tint, a darker row under the pointer, and a selected tint with an edge and a checked box. See «Table rows», a whole class of 31 in one table.
2. **Dates follow an Indonesian grammar:** day before month, the month in words wherever a misreading matters, «09/10/2026» only in a dense column, and always WIB. A native date field is followed by the date in words, because the field's own display follows the computer's language. See «Dates and times» and «Date and time».

## The visual references of 4 Oct

Four references arrived after `f76542b`. «Visual references» compares them against this proposal:

- what they confirmed;
- what changed: the filled selection, pagination, pill tags, the accent role and the Specimen sheet;
- what was deliberately not copied, and why.

Questions 7, 12 and 13 come from them; the rest stand.

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
