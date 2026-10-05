# Proposal and rulings

**Approved in principle (5 Oct): every question is ruled.** It still changes nothing in PINTAR and renames nothing in `src/`. It is applied only in the UI/UX application pass, once the authorised UI/UX stage begins. That pass changes no behaviour, permission, journey or business rule: this is a visual and interaction system, not a redesign of the product. What is checked before then is in «Validation».

## Built from what exists

Token set v3 evolves token set v2 (`src/app/globals.css`); it does not replace it. It starts from the design spec (`docs/coordination/design/PINTAR-DESIGN-SKILL-SPEC.md`), the components in `src/app/experience.css`, the shared interaction components (TombolKirim, BarisHasil, MemuatHalaman, TandaTautan), the shells (CangkangPengalaman, SesiSaya, `tempat.ts`) and the copy table (`src/lib/hle.ts`).

- **Every token** says in its usage note whether it is KEPT, CHANGED (and why) or NEW, and APPROVED with its question where it departed from an earlier ruling.
- **Every component** says the same in its guideline's Status line.
- **Every v2 colour value is kept.**

## Departures from earlier rulings: approved 5 Oct

| The earlier ruling | v3, approved | Question |
|---|---|---|
| No shadow tokens: hairlines and grounds, by design | Two restrained small shadows, only on genuine floating layers (menus, dialogs, drawers), and a scrim; ordinary surfaces and cards stay flat | 5 |
| Radii 8, 12 and pill | A fourth, 4 px, for checkboxes, small square controls and skeleton blocks (replacing today's literal 6 px); 8, 12 and pill everywhere else; tags became pills after the 4 Oct references | 7 |
| Motion: colour and opacity, 160 ms | 160 ms kept for ordinary changes; hover 120 ms; a floating layer entering 240 ms with 8 px of travel at most; a disclosure's chevron turns; nonessential motion removed under reduced motion | 8 |
| No modal outside the tour (spec §5) | One short dialog pattern, for a consequential or destructive question started from a menu («Keluar dari semua perangkat?»); in-page confirmation stays the default | 6 |
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
- **Field outlines are 1.6:1 today**, under WCAG 1.4.11's 3:1 for a field's boundary (question 3, now approved: `line-control`).

## Rulings (5 Oct)

**Where the design system stands (5 Oct).** Approved in principle; all seventeen questions are ruled.
- **Brand: closed.** Questions 16 and 17, and the wordmark's status below («The canonical wordmark»).
- **Visual language: approved in principle.**
- **Interaction and navigation grammar: ruled** (questions 1 to 15). Next, validation in composed PINTAR journeys, and the table stripe on real school displays («Validation»).
- **Production propagation: not yet.** Nothing is applied to PINTAR's application until the authorised UI/UX stage begins, after Engineering Complete.

1. **The shells. AGREED.**
   - Staff: a sticky left navigation, replacing CangkangPengalaman's staff header.
   - Learners: the top bar at every width.
   - The shell changes at 640, 1024 and 1280 px.
2. **The publishing state:** Terbitkan → Menerbitkan… → **✓ Diterbitkan.** The result names what happened (D-047(e)). «Selesai» is not used for publishing; the learning status «Selesai» on a badge is unchanged.
3. **Field outlines: AGREED.** The firmer, accessible 3:1 treatment (`line-control` #808A91).
4. **The type ladder: AGREED.** The eight sizes.
5. **Floating layers: APPROVED.** A restrained small shadow for genuine floating layers only (menus, tooltips, a select's open list, dialogs, drawers). Ordinary surfaces and cards stay flat.
6. **Dialog: AGREED.** One short dialog pattern, for a consequential or destructive question started from a menu. In-page confirmation stays the default.
7. **Small-control radius: AGREED.** 4 px for checkboxes, small square controls and suitable skeleton blocks. 8, 12 and pill everywhere else.
8. **Motion: APPROVED,** a restrained vocabulary:
   - hover: 120 ms;
   - an ordinary colour or opacity change: 160 ms;
   - a floating layer entering: 240 ms;
   - travel: 8 px at most;
   - a disclosure's chevron may turn;
   - under reduced motion, nonessential motion is removed.

   The design system's own components now use it («Motion»).
9. **Icons: AGREED.** Lucide is PINTAR's single icon source.
10. **Accessibility: AGREED.** WCAG 2.2 AA is PINTAR's named accessibility standard, including the skip link.
11. **Staff navigation: KEPT** for the application pass, in the proposed order and grouping. An educator who also learns may have the distinct «Mengajar» and «Belajar» contexts. It is validated in composed journeys before it changes further.
12. **Accent and context: AGREED. No new hue.**
    - Status colours communicate state, with words.
    - PINTAR green communicates hierarchy, action and selection.
    - Deep ink may identify a context that changes the meaning of the screen, such as MODE PERAGAAN.
13. **Buttons and fields: KEPT at 8 px corners.** Pills stay for small labels, badges and switches.
14. **The table stripe: A, provisionally** (`surface-0`, existing tokens).
    - It is validated on an ordinary or poor school computer display and a projector.
    - A+ (#F7F6F2) replaces it only if A demonstrably lacks visibility. The new value is not introduced pre-emptively.
15. **Date fields: AGREED.** The native date and time control, with the unambiguous human-readable Indonesian date and time beneath it («Jumat, 9 Okt 2026, 07.30 WIB»).
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

| | Status (Yazid, 5 Oct) |
|---|---|
| Logo direction | **LOCKED** |
| Production specification | **APPROVED** |
| ID card and certificate brand correction (`05c7b51`) | **APPROVED** |
| 4.0 tab-icon treatment | **APPROVED** |
| Final outlined master artwork | **PENDING:** production from licensed Helvetica Neue 65 Medium, then optical verification |

The proofs approve placement, hierarchy, minimum sizes and clear space. They do not approve the final letter geometry: kerning and exact width are judged on the licensed master. That is production completion, not an open design question.

**Still needed: the outlined master,** made from Helvetica Neue 65 Medium and no other face. **Required first:** verify that the font licence permits logo artwork, outlining, and distributing the outlined files (Wordmark, «Master artwork and the font licence»). Until the master is made, every wordmark here is a proof in the viewer's own face, labelled as one.

## Dr Gladys's comments (5 Oct)

Two comments were accepted as design-system requirements. Both are prepared here and neither is applied. The stripe's strength is A, provisionally (question 14); the date fields are approved (question 15).

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

## The application pass (once the authorised UI/UX stage begins)

Each step is one change with its own tests and one CI run. None starts before the authorised UI/UX stage, and none before the validation in «Validation» has passed.

1. **Tokens.** Token set v3 in `globals.css`, with v2 names kept as aliases until no surface uses them. UX1-S0-TOKEN-01 and UX1-S0-CONTRAST-01 move to v3.
2. **Primitives.** Button (and TombolKirim's states), fields, the segmented control, tabs, badges, the result line (BarisHasil), the alert. A target-size guard joins the selftest.
3. **The shells** (question 1): the staff navigation and the learner top bar, from today's place map, in the order and grouping of question 11. Nothing about who may go where changes.
4. **Surfaces, one area at a time:** the learner's, the teacher's, Pimpinan, then Konfigurasi, Pendataan and Studio (the last Tailwind surfaces). Each with 320 and 1280 px screenshots, the X.6 crawl and an accessibility run.
5. **Copy,** through the copy table:
   - the two email lines above;
   - «✓ Diterbitkan» as the result of publishing (question 2).
