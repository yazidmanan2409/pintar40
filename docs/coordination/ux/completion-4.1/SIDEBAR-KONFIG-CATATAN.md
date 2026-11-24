# Configuration page and sidebar: the owner's four observations, held for the consolidated revision (Daisy, 24 Nov 2026)

> **What holds now:**
> - **Held, by the owner's direction:** «we can do the revision later, together with your other task, consolidated as one».
> - **Status:** nothing is sent to Bob or the builders yet. Not D2-R (ruling 93 freeze).
> - **Seen:** on staging `/konfigurasi`, from the owner's screenshot.

| # | Observation | My view | Class |
|---|---|---|---|
| K-1 | The «›» arrows sit at different places in each row | **Defect.** The row is `flex justify-between` with three children: the title, the chevron and `TandaTautan` (zero width at rest). Space-between therefore puts the chevron in the middle of the spare space (`src/app/konfigurasi/page.tsx` ~2498). **Fix:** pin the chevron to the right (`ml-auto`, or group the chevron with `TandaTautan`). Also check the other menu lists that use this row | Required |
| K-2 | «Masuk sebagai» and the name are cramped on one row; the name is cut off | Two rows: «Masuk sebagai» small, then the name at the full width. Truncate only if still too long, with the full name in its accessible name and on hover | Refinement |
| K-3 | «Keluar» is the same colour as the page | It needs a visible boundary, but not orange (none in the palette). Gold `--kartu-emas` is 2.5:1, below WCAG 1.4.11's 3:1, and is the certificate's colour. Amber is the «attention» colour. **Recommended:** a neutral outline with `--line-control` (3.4:1). **Stronger option:** a primary-green outline and text (7:1). The owner chooses | Refinement |
| K-4 | The ID / EN control takes too much room | A text switch, «**ID** · EN»: the current language bold and underlined, the other in ink-3. Targets at least 24 px, `aria-pressed` and `lang` kept | Refinement |
