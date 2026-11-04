# E2 · W3.16: the `/` chooser, the context control and the six expressions

**Form C (composition).** Register entry E2 (CR-54 S2, D-132(m), F-12(3)).
**Surfaces, as built at 0b19707:**
- `/` signed in (`src/app/page.tsx`): the single deliberate chooser (D-132(c));
- the context control in every staff shell (`src/components/NavKonteks.tsx`);
- the six expressions' keys (`src/lib/istilah-menunggu.ts`).

**Status (owner, 4 Nov):** the chooser composition is **structurally accepted**; G1's six expressions remain pending.
- **O6(a): E1 and E2 are one navigation experience.** They are reviewed and implemented together. **E2's relocated context control is not implemented on its own before E1 is accepted.** E1 restates the J3 navigation under L3: the rail at 1024–1279 px, collapse, labels, the context control and the responsive states. See `../E1/`.
- **D-168:** the connected navigation, context selection, permissions, visible sections, refusal behaviour and role transitions are tested together.

**Decides:** D for the composition. **G1 for the six words:** Dr Gladys (W4.2, F-13).
- **Structural acceptance:** with the six as **empty labelled slots**, «[G1 · context.not_held]». A slot names its semantic key; it is never words.
- **Final closure only with G1:** a word placeholder is a NO-GO at Gate 2 (G:81).
- **Until the words exist,** the build draws nothing in each slot's place, as today (`istilah()` returns null). The composition is complete either way.

**Files:**
- `buat-e2.mts`: run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/E2/buat-e2.mts`.
- `e2.css`, which loads on top of C1's `c1.css` for the slot style.
- `render/<page>-<width>.png` and `render/laporan.txt`.
- `jalan/`.

---

## 1. The composition

### The chooser, `/` (signed in)

It is a focused page: **no shell**, because it is the one place a working context changes, and it belongs to none. At `measure-narrow`, centred, top to bottom:
1. **The head line:** the wordmark slot (placeholder) at the start; the session at the end, «Masuk sebagai **Citra Lestari**» and «Keluar» (SesiSaya, as built).
2. **h1 «Mau ke mana hari ini?»**, then «Halo, Citra.» (the first name, D-020).
3. **Why the person was sent here,** where a reason applies: an info alert with `role="status"`, holding one of three slots:
   - `context.not_held`: the purpose chosen is not held;
   - `context.other_context`: the page asked for belongs to another context;
   - `context.invalid`: the context is no longer held.
   
   It sits **above the doors**, so it is read before choosing.
4. **The place question,** when a purpose was asked for and it has several places: an h2 holding the slot `context.choose_place`, which also names the door list.
5. **The doors:** one per purpose · place the person holds now (`pintuPilihan`), each a full-width button (a form, as built: only its POST sets the context).
   - **The purpose's words in 18/26 600:** «Saya mau belajar», «Saya mengajar», «Saya memimpin bagian sekolah», «Saya mengelola sekolah».
   - **The place under them in 14/20 `ink-2`:** the school's name, or «Seluruh platform».
   - A chevron says it goes somewhere.
   - Height at least 64 px; 12 px between doors.

   **The current context's door is marked four ways:** a check in place of the chevron, the primary edge, the primary-soft ground, and `aria-current="true"`. Today it is marked by weight alone.
6. **Holding no place:** the Empty state with `entry.kosong`, as built.

**Order of the doors:** `pintuPilihan`'s order, as built. Nothing on this page sorts or ranks; the specimens show it as returned.

### The context control, in every staff shell

**At the top of the navigation, under the wordmark:** one quiet block (`surface-2`, `radius-md`). Today the place and the chooser link sit after the places, at the bottom of the list.
1. **The purpose's short name** as an eyebrow:
   - «Mengajar» (`nav.kelas`) for teaching, and «Belajar» for learning: these words exist;
   - for Mengelola, **the slot `context.manage_label`**: that word doesn't exist yet.
2. **The place** in 14/20 600: the school, or «Seluruh platform».
3. **«Mau ke mana hari ini?»** with its chevron, a link to `/`. **Only for a person who holds more than one context** (as built), and the one way to change it: no switch anywhere else.

**On a phone:**
- the top bar names the place in one line beside the wordmark;
- the full block opens at the top of the menu, with the places.

### The sixth expression, in the surfaces

**`context.other_school`:** an action refused because its target is outside the active context. It is a result line (BarisHasil, `pds-result-blocked` with its icon), **under the form it answers** (DAISY-18), like any refused action. The specimen draws it under Konfigurasi's «Berikan peran» (`lain-sekolah`).

### Where each of the six goes

| Key | Where | Shown when |
|---|---|---|
| `context.manage_label` | the context control's eyebrow, in the navigation (and the phone bar's hidden purpose) | the context is Mengelola |
| `context.not_held` | `/`, the status alert above the doors | sent with `alasan=tidak_dipegang` |
| `context.other_context` | `/`, the status alert above the doors | sent with `alasan=lain` |
| `context.invalid` | `/`, the status alert above the doors | sent with `alasan=tidak_berlaku` |
| `context.choose_place` | `/`, the h2 over the doors, naming the list | a purpose asked for, with several places |
| `context.other_school` | the refused action's result line, under its form | an action's target is outside the context |

## 2. Layouts

**Widths:** 1280, 820, 390 and 320 px for all 11 specimens (`render/`). The chooser has no print.

| Width | The chooser | The shell |
|---|---|---|
| 1280 / 820 | centred at `measure-narrow`; the session at the head's end | the context block at the top of the navigation |
| 390 / 320 | the session wraps under the wordmark; doors full width | the bar names the place; the block heads the opened menu |

## 3. States

| State (register) | Specimen |
|---|---|
| a Guru who also learns, two doors, the current one marked | `pilih` |
| several purposes in two schools | `pilih-banyak` |
| Admin platform: «Seluruh platform» and each school | `pilih-platform` |
| **not held** | `tidak-dipegang` |
| **another context** | `lain` |
| **invalid** | `tidak-berlaku` |
| **choose a place** | `pilih-tempat` |
| holding no place | `kosong` |
| **the «Mengelola» label**, with the chooser link | `shell-mengelola` |
| one context only: no chooser link | `shell-mengajar` |
| **another school** (an action refused) | `lain-sekolah` |

**Signed out:** the three purpose doors to `/masuk?pintu=…`, as built. They take the same door style without places; not redrawn.

## 4. Keyboard and accessibility

- **The chooser's Tab order:** «Keluar», then each door in order.
  - Each door is one button named by its purpose and place; the current one is announced as current.
  - The reason alert is `role="status"`, so it is read on arrival.
  - The place question names the list.
- **The shell:** the skip link, then «Mau ke mana hari ini?» (first in the navigation, since it is at the top), then the places.
- **Checks** (`render/laporan.txt`):
  - axe WCAG 2.2 AA in all 44 renders;
  - targets at least 24 px, and **doors at least 56 px**;
  - focus rings;
  - **at most one current door, and never marked by weight alone**;
  - **each state draws exactly its G1 slots** and no others.

## 5. Words (T table)

**No new words.** Every word is the copy table at 0b19707: `entry.*`, `sesi.*`, `nav.*`, `config.pemeliharaan.platform` «Seluruh platform».

**The six expressions are G1's slots, never filled:**

| Slot | Whose |
|---|---|
| `context.manage_label` | Dr Gladys (D-132(m)) |
| `context.not_held` | Dr Gladys |
| `context.other_context` | Dr Gladys |
| `context.invalid` | Dr Gladys |
| `context.other_school` | Dr Gladys |
| `context.choose_place` | Dr Gladys |

## 6. Components and tokens

**Components:** the door (a full-width button: `surface-1`, a `line-control` hairline, `radius-lg`; hover `surface-2`; the current one `pintar-primary-soft` with the primary edge), Alert info, Empty state, the session line, the staff shell, the result line, Icons (check, chevron-right, info).

**Tokens only;** no new token. **The wordmark** is the provisional placeholder.

## 7. Navigation and outcomes

| Action | Outcome |
|---|---|
| A door | its POST (`pilihKonteks`) sets the context and continues to `lanjut` when the person was sent here, else the purpose's home. Visiting `/` changes nothing. |
| The current door | the same POST: it re-enters the current context's home |
| «Mau ke mana hari ini?» | `/`, with the current door marked |
| «Keluar» | sign out, as built |

## 8. Edge cases

- **Many places** (Admin platform with many schools): the doors list grows, in `pintuPilihan`'s order, «Seluruh platform» first. A filter for very long lists would be new behaviour; it is not drawn here.
- **A long school name:** the place wraps under the purpose, and nothing is truncated on `/`. In the phone bar the place truncates with an ellipsis, and the full name is at the top of the opened menu.
- **No words yet:** each slot's place draws nothing (as built). No alert appears empty: the alert is drawn only when it has words.
- **One door only** (`lain`): still the choice; the person continues once it is chosen.

## 9. Acceptance checklist

- [auto] No sideways scroll at 1280, 820, 390 or 320 px, in all 11 specimens.
- [auto] axe WCAG 2.2 AA: no violations, 44 of 44 renders.
- [auto] Every door is at least 56 px tall; every target at least 24 px.
- [auto] At most one door is current; it carries `aria-current` and the check, never weight alone.
- [auto] Each state draws exactly its G1 slots: none on `pilih`, `pilih-banyak`, `pilih-platform`, `kosong` and `shell-mengajar`.
- [auto] With no words, no slot's place draws anything, and no empty alert (the build; `istilah()` returns null).
- [manual] Side-by-side review of the build at each width (brief G:14).
- [manual] **Final closure:** G1's six words set, the specimens re-rendered, no placeholder left (G:81).
