# Migration map

**For the application pass, after approval. Nothing is renamed or restyled in `src/` during this study.**

This map lists each of today's classes and shared components beside the v3 component it becomes, so the pass is mechanical: find the class, apply the component, check the screenshot. Every row changes how something looks or how big it is to hit. No row changes what a screen does, who sees it, or what it says.

## How the pass treats names

- **The `pin-` prefix stays in the product.** Fifteen selftest files and the journeys diagnostic select on `pin-*` classes (`.pin-facts`, `.pin-btn`, `.pin-tabs`, `.pin-noprint`…). The playground's `pds-*` classes exist so the two can never collide. Each v3 component lands in `experience.css` under a `pin-*` name, and a test's selector changes only with that test.
- **React components keep their names and their behaviour.** TombolKirim, BarisHasil, MemuatHalaman, TandaTautan, SesiSaya, HalamanKomitmen, HalamanGalat and HalamanPenolakan get new markup classes and nothing else.
- **v2 token names stay as aliases** (`--radius-1` → `radius-md`, `--motion-fast` → `duration-base`, `--control-h` → `control-lg`) until no rule uses them, then go.

## Actions

| Today | v3 | What changes on screen |
|---|---|---|
| `.pin-btn` (40 px, the secondary look) | Button, secondary, `control-md` | 44 px tall; a pressed ground (`surface-3`). |
| `.pin-btn.pin-primary` | Button, primary | Pressed: `pintar-primary-pressed`. |
| `.pin-btn.pin-quiet` | Button, quiet | A 44 px target (today it is text-height). |
| `.pin-btn.pin-str-bahaya` | Button, destructive | Hover and pressed tokens. |
| `.pin-mbtn`, `.pin-mbtn-big`, `.pin-mbtn-1`, `.pin-mbtn-2` (sign-in) | Button, primary or secondary, `control-lg` / `control-xl` | Nothing in size (52 and 60 already). |
| `.pin-ub-btn`, `.pin-data-btn` | Button | Nothing in size (already 44). |
| `.pin-sesi-keluar` | Button, quiet, with the log-out icon | The icon. |
| `.pin-tur-x`, `.pin-bantuan-tutup` (6 px radius) | Button, quiet, small, with its word («Tutup») | `radius-md`; a 44 px hit area. |
| `.pin-actions`, `.pin-actions.pin-between` | The action row (Form layout) | Nothing. |
| `.pin-actions .pin-btn:disabled` (opacity 0.4) | The disabled state (`surface-2`, `ink-disabled`) and its reason beside it | Readable at 3.2:1; today's 0.4 opacity is not. |
| `.pin-back`, `.pin-kembali` | Link, back | A 44 px hit area; `t-small` 600. |
| `.pin-lihat` | Password field's show button | Nothing in size. |
| TombolKirim | Button + Action feedback | Adds the ✓ result word after the server confirms, and the 3-second line. Its one-save guard is unchanged. |

## Fields

| Today | v3 | What changes on screen |
|---|---|---|
| `.pin-input`, `.pin-isian` (40 px) | Text field, `control-md` | 44 px; outline `line-control` (3:1, question 3). |
| `.pin-inp` (52 px, sign-in) | Text field, `control-lg` | The outline. |
| `.pin-inp.pin-inp-big` (60 px, the class card) | PIN input, `control-xl` | The characters 20 → 22 px. Never masked, reformatted or auto-advanced, as today. |
| `.pin-inp-salah` | The field's error state | Its message sits under the field. |
| `.pin-label`, `.pin-lbl`, `.pin-hint` | Form layout: label and hint | Nothing. |
| `.pin-form`, `.pin-kp-form`, `.pin-str-tambah-form`, `.pin-str-isian` | Form layout | Field gaps on `space-4`. |
| `.pin-picker` (PemilihLingkup), `.pin-lselect` | Select | 44 px; the chevron icon. |
| `.pin-ub-opsi`, `.pin-ub-pilihan`, `.pin-cepat-pilih` | Radio or Checkbox | A 44 px row. |
| `.pin-seg` (a radio group drawn as segments) | Segmented control | Each segment 44 px. |
| Native date fields: Siapkan's «mulai» and «sampai», Konfigurasi's «valid_until» | Date and time: the native field plus its echo | The date in words with the day under each field. Today they show «10/09/2026» for 9 October on an English-language computer. |
| Every date written on a page (`toLocaleString`, `Intl.DateTimeFormat` per surface) | One helper in the copy table's `format`, writing the forms in «Dates and times» | WIB and the year where they are missing today (Studio, Konfigurasi, Keamanan, Email uji). |
| The learner's answer options: `.pin-op`, `.pin-opsi`, `.pin-soal-opsi` | Unchanged: the assessment's own component | Only the focus ring and pressed ground take v3 tokens. |

## Navigation and identity

| Today | v3 | What changes on screen |
|---|---|---|
| CangkangPengalaman (`.pin-top .pin-shell`) | App shell (staff), Learner shell | Only if question 1 is approved. Otherwise the header stays and only its tokens change. |
| `.pin-tabs` and TabTempat (15 px links in the header) | App shell navigation items (staff); Learner shell links | Under question 1. If not approved: `t-body` 16 and a 44 px target. |
| TandaTautan (`.pin-tanda-tautan`, `-sibuk`) | The navigation item's working dot | Nothing in behaviour. |
| SesiSaya, BarisSesi (`.pin-sesi`, `.pin-sesi-akun`, `.pin-sesi-ket`, `.pin-sesi-keluar`) | Identity (staff, with their own name); the Learner shell's «Bukan akun Anda?» and «Keluar» | Nothing in who is named (S15, D-020). «Keluar» stays visible. |
| MerekPintar (`.pin-merek`, `.pin-merek-standalone`) | The mark in each shell | Nothing: height only, never below 32 px. |
| `.pin-switch` (links between views) | Tabs, as page links | The underline and weight for the current one. |
| `.pin-lingkup` (the scope switcher) | Tabs, as page links | Nothing in size (already 44). |
| `.pin-lang`, PengalihBahasa (26 px, 6 px radius) | Segmented control | 44 px; `radius-md`. |
| `.pin-scope`, BarisLingkup | Breadcrumb | Links get a 24 px minimum. |
| `.pin-tahap`, TahapKomitmen | Progress, steps | Nothing: words and a rule, never a bar (as today). |
| `.pin-steps` (numbered instructions in a lesson) | A numbered list (Hierarchy) | Nothing. |
| KakiPintar (`.pin-kaki`) | Unchanged | Nothing; it stays out of print. |

## Feedback

| Today | v3 | What changes on screen |
|---|---|---|
| BarisHasil (`.pin-msg.pin-hasil` with `-ok`, `-netral`, `-gagal`) | Action feedback's result line | `-ok` gains ✓ and its word; `-gagal` is `role="alert"`. |
| `.pin-msg-err` | The result line, failed; or the field's error | Placed at its cause. |
| `.pin-msg-note` | The result line, neutral | Nothing. |
| `.pin-banner` (a state of a retained record) | Alert, info or attention | The icon and the word. |
| `.pin-perhatian` (needs attention, a left rule) | Alert, attention | Still absent when nothing needs attention. |
| `.pin-pending`, `.pin-dots` | Loading, the working dot | One dot at `duration-pulse`; still under reduced motion. |
| MemuatHalaman (`.pin-memuat`, `-bentuk`, `-kata`, `-bingkai`) | Loading, the page shell | Nothing in behaviour. |
| `.pin-empty` | Empty state, "not yet" or "nothing matches" | A sentence and an action. |
| KartuKetiadaan (`.pin-abs`, `.pin-metric`) | Empty state, "not enough yet" | Nothing in its words. |
| HalamanKomitmen (`.pin-commit`) | Confirmation | Nothing in behaviour. |
| `.pin-akt-periksa` (a name checked before it is made) | Confirmation, attention | Nothing. |
| HalamanPenolakan (`.pin-refusal`) | Panel with the page's own sentence and next step | Nothing in behaviour. |
| HalamanGalat | Panel, Button | Nothing in behaviour. |
| `.pin-tip` (TipSetelahTutup) | A floating Panel | `shadow-overlay`, if question 5 is approved. |

## Data

| Today | v3 | What changes on screen |
|---|---|---|
| `.pin-ttabel` | Table | Sticky header on `table-head`, striped rows (Dr Gladys, 5 Oct), tabular figures, sort and filter where the page already offers them. |
| `.pin-roster`, `.pin-nama-list` (names, alphabetical, nothing beside them) | Unchanged: a list, never a table | Nothing. Their missing status, order and count are the rule, and adding one changes the product. |
| `.pin-ub-daftar` | A list with hairlines (Hierarchy) | Nothing. |
| `.pin-row`, `.pin-list`, `.pin-rowmeta` | A list with hairlines (Hierarchy), or Table where columns compare | Nothing in what is listed. |
| `.pin-facts`, `.pin-dl` | Facts (Hierarchy) | Nothing. |
| `.pin-metric .pin-mv` (literal 32) | `t-stat` 30 | 2 px smaller. |
| `.pin-status` (36, `status-ok`) | `t-display` with its word | Nothing. |
| `.pin-pill` (`.pin-ok`, `.pin-attention`, `.pin-blocked`, `.pin-neutral`) | Badge | Nothing in colour. |
| `.pin-sehat-tanda` (`.pin-ok`, `.pin-perhatian`) | Badge | `.pin-perhatian` uses attention colours, not blocked (spec §6). |
| `.pin-kelas-tanda` | Tag | Nothing. |

## Containers

| Today | v3 | What changes on screen |
|---|---|---|
| `.pin-kp`, `.pin-lcard`, `.pin-course`, `.pin-tugas` | Panel | Nothing. |
| `.pin-hasil` (the learner's result section), `.pin-bantuan` (the lesson's help) | Panel, quiet well | Nothing. |
| `.pin-kelas-bukti` (summary with a ▾ character) | Disclosure | The chevron icon replaces the character. |
| The tour (`.pin-tur-*`) | Unchanged in behaviour: today's one modal (spec §5) | Dialog's layer tokens (`scrim`, `radius-lg`, `shadow-dialog` if question 5 is approved). The spotlight stays. |
| The help panel (PanelBantuan) | Drawer | Only its layer tokens; where it opens stays as today. |

## Known gaps (spec §6)

### Sizes outside the ladder

| Where | Today | v3 |
|---|---|---|
| `.pin-tabs a` (header tabs) | 15 px | `t-body` 16 |
| `.pin-status p`, `.pin-kembali`, `.pin-say-p` on a phone | 15 px | `t-body` 16 |
| `.pin-h1` on a phone, `.pin-mh1` | 26 px | `t-page-compact` 26 (named) |
| `.pin-say-h` (the sign-in panel) | 27 px | `t-page-compact` 26 |
| `.pin-metric .pin-mv` | 32 px | `t-stat` 30 |
| `.pin-inp-big input` | 20 px | 22 px, at `control-xl` |
| `--type-fine` (13) | 13 px | `t-small` 14 |
| `--type-card` (17), `--type-course` (20) | 17 and 20 px | `t-subsection` 18 |
| `--type-section` (24) | 24 px | `t-section` 22 |

**Not gaps, kept on purpose:** the learner's question stem (21 / 19) and every size on the certificate (name 40 and 44 printed, 32 on a phone; course 20 and 18; number 15; the verification link 12.5; the sheet's instruction 15). The certificate is frozen.

### The 6 px radius

| Where | v3 |
|---|---|
| `.pin-lang` (language switch) | `radius-md` 8 |
| `.pin-tur-x`, `.pin-bantuan-tutup` | `radius-md` 8 |
| `.pin-chip`, `.pin-qr` (the certificate's link and QR frame) | Unchanged: the certificate's geometry, and the QR's own |
| Thumbnails in the help panel (`.pin-mini-*`) | `radius-sm` 4 if question 7 is approved, otherwise `radius-md` |

### Controls under 44 px

| Control | Today | v3 |
|---|---|---|
| `.pin-btn` | 40 | 44 |
| `.pin-input`, `.pin-isian` | 40 | 44 |
| `.pin-num-btn` (the question navigator) | 34 | 44, wrapping to more rows |
| `.pin-soalbar .pin-btn` (the question bar) | 32 | 36 seen, 44 to hit (Button, small) |
| `.pin-lang button` (language) | 26 | 44 |
| `.pin-tabs a` | header-height link | 44 |
| `.pin-btn.pin-quiet`, `.pin-back` | text-height | 44 to hit |

A target-size guard in the selftest keeps them there (the application pass, step 2).

### Status colour

- `.pin-sehat-tanda.pin-perhatian` draws attention in blocked colours: it becomes Badge, attention.
- Readiness stays on the quiet ground; no blocked ground on Management pages; no red-to-green scale.

## Print

Print keeps what it has. Nothing printed is redesigned, and print uses no shadow, scrim or motion.

### The certificate

- **Classes:** `.pin-sheet`, `.pin-sheetbox`, `.pin-printwell`, `.pin-noprint`, `.pin-cert`.
- **Rules:** `@media print` at `experience.css` 346–352. The sheet is the page, and one A4 leaves the printer.
- **v3:** unchanged, and frozen (D-074, D-080, the 4 Oct rulings). Its sizes, its colours, the gold line, the QR's 96 px and 6 px inset are the certificate's own, never the interface ladder.
- **The one duty of the pass:** every new shell part carries `.pin-noprint`, so no navigation, rail, drawer, top bar, skip link or identity block reaches the paper.

### The class-card sheet

- **Classes:** `.pin-akt-lembar`, `.pin-akt-kartu-set`, `.pin-akt-kartu`.
- **Rules:** `@media print` at `experience.css` 2271–2277. Only the set prints, two cards across, and no card is split.
- **v3:** unchanged. The dashed `line-strong` edge is the cut line. `--radius-1` becomes `radius-md`, which is the same 8 px.
- **The shell can't leak onto the page:** the rule hides everything that does not contain the sheet, so a new navigation is hidden with no extra rule. The pass checks this with a print screenshot.

### Both

- Colours print as they are on screen. A print preview at A4 joins each surface's screenshots in the pass.
