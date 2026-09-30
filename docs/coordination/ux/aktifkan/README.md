# DAISY-20: the 320 px and accessibility proof

Review tooling, not product code. It checks what the board row asks of Gate 3's
screens ("320 px and accessibility checks") on the **built** components, in the
states a person actually reaches, by pressing what the person presses.

## What it does

`buat-bukti.mts` bundles the real DAISY-20 components (`klien.tsx`) with esbuild,
paints them with the real compiled stylesheet, serves them over http with the
fonts and the mark (as Next serves `public/`), and drives each state in the
pre-installed Chromium. `fetch` answers as BOB-26's contract
(`src/lib/aktivasi-kontrak.ts`, BOB-26 as built; the code check at `/aktifkan/periksa`) says the routes will. Nothing else about the server is
assumed. Two modules stand in for what only runs inside Next:
`tiruan-navigasi.ts` (the language control's router), `tiruan-tautan.tsx` (a link,
as an anchor) and `tiruan-aksi-masuk.ts` (the sign-in screen's server action).

**16 states × 2 languages × 2 widths (320 × 640, 1280 × 900) = 64 checks.**
Each check verifies the following:

| Check | Rule |
|---|---|
| No sideways scroll | The page is no wider than the screen |
| Targets | Every control is at least 24 px (WCAG 2.5.8 AA; a link inside a sentence is exempt, as the criterion exempts it). Every control DAISY-20 adds is at least PINTAR's own 44 px |
| axe-core | WCAG 2.0, 2.1 and 2.2, A and AA, colour contrast included |
| Focus | After the screen changes, focus is on the new screen's heading. The one exception is the class-card surface, which sends focus to its first field on purpose (UX1-MASUK-AKSES-01) |
| Words | Each state says what it must: «berlaku selama 10 menit» from `berlakuMenit`, the step line, the refusal sentence for the code the route answered |
| Requests | «482 913» is sent as `482913`. «Buat dan aktifkan» for a new person sends nothing before the check |

The states:

1. The email.
2. The code screen, with the lifetime and the resend countdown.
3. A code that does not match.
4. The username step.
5. A reserved username.
6. The password step, with today's rules.
7. A PIN in sequence.
8. The name step.
9. The name step while changing the name.
10. The welcome for staff (ID 4 + 4, QR, the card sent).
11. The welcome for a learner-only account (no ID, no card).
12. A failed password sign-in.
    - 12b. The class card surface.
13. Akun saya, with the card refused and a wait.
14. The new-person check.
15. The intake's name list (600 rows).

## Run it

```bash
npx tsx docs/coordination/ux/aktifkan/buat-bukti.mts
```

The script needs the following:

- Playwright's global install (`npm root -g`/playwright). It is not a dependency.
- The pre-installed Chromium at `/opt/pw-browsers/chromium`.
- `axe-core`, `esbuild`, `postcss` and `@tailwindcss/postcss` from `node_modules`.

The script writes `render/laporan.txt` and the Indonesian screens:

- every state at 320 px;
- the code screen, the welcome and Akun saya at 1280 px.

It exits with a non-zero code on any failure.

Every name, address, code and ID is invented.

## What it found, and what changed

- **The PIN step scrolled sideways at 320 px,** and so did the class card's PIN step on `/masuk` before it.
  - Cause: `.pin-form`'s implicit grid column was sized to its widest field. That field is a 20-character input at 20 px type with no `size`, plus the 44 px reveal: 336 px.
  - Fix: `.pin-form` now has a `minmax(0, 1fr)` column.
- **Route-line links were 18 px tall.** `min-height` does nothing on an inline box. `a.pin-tautan` is now `inline-flex`, which makes it 44 px like its button form.
- **The staff strip showed «Masuk sebagai Na…» at 320 px** once «Akun saya» joined «Keluar». At 360 px and below, the name now takes its own line, with the two doors under it on the right. From 361 px up, the strip stays one row.
- **A long email in the new-person check** now breaks inside its box.

## Notes, not changed here

The shared controls below predate DAISY-20. They pass WCAG 2.5.8's 24 px but not PINTAR's 44 px:

- the language control, 26 px;
- the admin button `.pin-btn` and field `.pin-input`, 40 px.

Changing them changes every admin screen, so they are a polish-register item, not part of this ticket.
