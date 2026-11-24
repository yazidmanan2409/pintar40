# Configuration page and sidebar: the owner's four observations, held for the consolidated revision (Daisy, 24 Nov 2026)

> **What holds now:**
> - **Held, by the owner's direction:** «we can do the revision later, together with your other task, consolidated as one».
> - **Status:** nothing is sent to Bob or the builders yet. Not D2-R (ruling 93 freeze).
> - **Owner, later the same day:** «you and bob decide what's best», and the same applies to other inconsistencies. **My decisions are below**, final unless Bob objects.
> - **Seen:** on staging `/konfigurasi`, from the owner's screenshot.

| # | Observation | My view | Class |
|---|---|---|---|
| K-1 | The «›» arrows sit at different places in each row | **Defect.** The row is `flex justify-between` with three children: the title, the chevron and `TandaTautan` (zero width at rest). Space-between therefore puts the chevron in the middle of the spare space (`src/app/konfigurasi/page.tsx` ~2498). **Fix:** pin the chevron to the right (`ml-auto`, or group the chevron with `TandaTautan`). Also check the other menu lists that use this row | Required |
| K-2 | «Masuk sebagai» and the name are cramped on one row; the name is cut off | Two rows: «Masuk sebagai» small, then the name at the full width. Truncate only if still too long, with the full name in its accessible name and on hover | Refinement |
| K-3 | «Keluar» is the same colour as the page | It needs a visible boundary, but not orange (none in the palette). Gold `--kartu-emas` is 2.5:1, below WCAG 1.4.11's 3:1, and is the certificate's colour. Amber is the «attention» colour. **Recommended:** a neutral outline with `--line-control` (3.4:1). **Stronger option:** a primary-green outline and text (7:1). The owner chooses | Refinement |
| K-4 | The ID / EN control takes too much room | A text switch, «**ID** · EN»: the current language bold and underlined, the other in ink-3. Targets at least 24 px, `aria-pressed` and `lang` kept | Refinement |

## Decisions (Daisy; Bob may object)

- **K-1:** chevron pinned right. Every row list that uses this pattern is checked in the same change.
- **K-2:** two rows, as above.
- **K-3:** the neutral outline, `--line-control`, with ink-1 text and `--surface-2` on hover. Green is kept for primary actions, so signing out stays quiet but clearly a button.
- **K-4:** the text switch, as above.

## Extended to the audit (owner: «this applies to other inconsistencies too»)

The ruling 79 audit adds a **visual consistency pass** (dimension B, applied to layout and chrome) on every journey's screens:
- alignment of row affordances (chevrons, counts, actions);
- one button style per role (primary, secondary, quiet, danger);
- sidebar and footer chrome at 1280, 390 and 320;
- labels cut off by truncation;
- controls that take more room than their use deserves.

Each finding is classed like any other, and the fixes ship in the same consolidated revision as K-1 to K-4.
