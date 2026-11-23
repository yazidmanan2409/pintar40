# Ruling 75 · four UX refinements: Daisy's package and Bob's recommendation

**Daisy's package** was received 23 Nov at 02:31 UTC. It is read-only: no code and no commits. Its evidence is `main` at `706fe8c5`.

**Bob's check** was made against `origin/main` at `706fe8c5` and `claude/c3w-1` at `6ace7b2f`, the same day.

**Status:** approved for planning only. Code is not yet authorised.

## Bob's verification of the package's claims

| Item | Claim | Verified |
|---|---|---|
| 1 | `masuk/buka-kembali/page.tsx:44` is a plain `<button type="submit">` | Yes |
| 1 | `TombolKirim` reads `useFormStatus`, with a capture-phase submit guard on `document` | Yes (`TombolKirim.tsx:53`, `:103`) |
| 2 | `a.pin-konteks-pilih` is `min-height: var(--control-sm)`, with no hit-area extension | Yes (`experience.css:3466`) |
| 2 | The precedent `.pin-soalbar .pin-btn::after` rule exists | Yes (`experience.css:992`) |
| 3 | `lapor.triase.simpan` and `config.struktur.simpan` each have one caller | Yes |
| 3 | `studio.definisi.simpan` is borrowed by `studio/kanonik/page.tsx:165` | Yes |
| 4 | The busy width shift at 1280 px and on inline rows | Accepted on Daisy's measurement against the real CSS; it is confirmed in the rendered app at acceptance |
| — | Does C3w-1 overlap? | `studio/kanonik/page.tsx` is changed on `claude/c3w-1` (2 lines). Nothing else in this package is touched |

## Daisy's package (verbatim)

The full text, as sent to Bob, is in the session log.

**Summary, for the record:**
1. **«Minta akun dibuka kembali».**
   - `TombolKirim` with «Mengirim…», plus one opt-in prop (`asli`) for native POST forms.
   - Pending is set by the existing capture-phase guard and cleared on `pageshow`.
   - Without JavaScript, the form still posts.
   - Acceptance:
     - one POST on a double press;
     - the result is «Terima kasih. …», not «Tunggu»;
     - Back restores the button;
     - the DAISY-17 cases are unchanged.
2. **`a.pin-konteks-pilih`:** `position: relative` and an `::after` extending the hit area to 44 px.
   - Acceptance:
     - the hit area is at least 44 px at 390 px;
     - the block is pixel-identical at 320, 390 and 1280 px.
3. **Labels:**
   - «Perbarui status»: `lapor.triase.simpan`;
   - «Simpan nama»: `config.struktur.simpan`;
   - «Buat aturan»: new key `studio.definisi.buat`;
   - «Simpan perubahan»: `studio.definisi.simpan`;
   - «Berikan izin»: new key `studio.kanonik.beri`.

   EN as given. The busy words are unchanged.
4. **`TombolKirim`:** at the captured submit, record the rendered width as `min-inline-size` until the verb returns.
   - Acceptance:
     - neighbours never move left;
     - the button never narrows;
     - buttons at rest are pixel-identical.

**Out of scope, noted by Daisy:** `buka_kembali.galat.isian` says «email atau PINTAR ID», while the field label says «Email atau username».

## Bob's recommendation

- **Placement:** inside **Z**, as one small Z item (R-26) next to M1 and M2. It is not a separate batch.
- **Order:**
  1. **Items 1 and 4 together**, one `TombolKirim` change.
  2. **Item 2.**
  3. **Item 3,** after C3w-1 is merged, because it touches `studio/kanonik`.
- **Effort:** about one working day in total, including the red-first tests and Daisy's rendered recheck.
- **Dependencies:** C3w-1 merged first (for item 3 only).
- **Risk:** `TombolKirim` is shared. The `asli` prop is opt-in, and the width rule applies only while busy. The safeguard is the whole DAISY-17 group plus one journeys run on Z's candidate.
- **Reviews:**
  - Daisy: the rendered recheck at 320, 390 and 1280 px.
  - Sharon: **not required**. There is no server, permission, data or result change. Item 1 is client-only, and the server is already safe (at most one open REOPEN request; a uniform answer).
- **Material behavioural changes:** none to approved functionality.
  - A double press on «Kirim permintaan» no longer produces a misleading «Tunggu» refusal.
  - Busy buttons no longer narrow.
- **Owner decisions:**
  1. Authorise code for R-26 within Z.
  2. **Optional:** include the one-string fix that makes `buka_kembali.galat.isian` match the field label. It is the same page, and Bob recommends yes.
