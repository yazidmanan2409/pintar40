# DAISY-19 — the base PINTAR email frame (static prototype)

**Gate 2E, D-057(a).** This is the one frame shared by all six identity emails: the activation code, the resend, password recovery, password changed, the PINTAR Digital Card, and security notices. Each email's own wording comes later, in DAISY-20 to DAISY-24.

**Status: static prototype.** Nothing in the app imports it yet. It is wired to BOB-25's template-rendering interface once Bob publishes that contract; see "Wiring" below. No ci.yml run was made or is needed until then.

| File | What it is |
|---|---|
| `bingkai.mts` | The frame: `bingkaiEmail(email) → { subjek, html, teks }`. A pure function with no dependencies. |
| `buat-prototipe.mts` | Builds the two samples, runs the static scan and the checks below, and renders them in Chromium. Run from the repository root: `npx tsx docs/coordination/ux/email-frame/buat-prototipe.mts` |
| `contoh-kode.html` / `.txt` | Sample 1, an activation code. It uses the code block and the attention note. |
| `contoh-pemberitahuan.html` / `.txt` | Sample 2, password changed. It uses the detail rows, the note, and the button with the copy-the-address fallback. |
| `render/*.png` | Chromium renders (see "Renders"). |

The two samples only exercise the frame's blocks. **Their wording is not final copy**; the timings in them follow the planned Gate 3 settings (a 6-digit code valid 10 minutes, GATE-0-FACTS) and D-055(f).

## Sender

Set by BOB-25's sending module. The frame only records the values fixed at Gate 0:

| Role | Value |
|---|---|
| FROM | **Tim PINTAR <noreply@pintarselalu.com>** (M3). On staging: "Tim PINTAR (Staging)" |
| Reply-To | **info@pintarselalu.com** (M4) |

## Anatomy

1. **Hidden preview line** (`pratinjau`): the text an inbox shows beside the subject, padded so the client does not pull body text into it.
2. **Header:** the PINTAR logo, 104 × 58, which is opaque and so safe on dark backgrounds. Its `alt` is styled as the wordmark: with images blocked, as in Outlook by default, the reader sees **PINTAR** in the brand colour. `logo: null` gives the text wordmark alone.
3. **Card:** one `<h1>` (`judul`), then the blocks, in any order:

| Block | Use | Plain text |
|---|---|---|
| `paragraf` | body text | wrapped at 72 characters |
| `kode` | a code to type (activation, recovery): a label, then the code large and spaced | `Label:` then the code, indented |
| `tombol` | one primary action. Full width on narrow screens. `cadangan: true` adds "Jika tombol tidak bisa dibuka, salin alamat ini ke peramban Anda:" with the address | `Label:` then the URL on its own line |
| `rincian` | label/value rows (when, how) | `Label: value` |
| `catatan` | a calm boxed note. `nada: "perhatian"` (amber) is for "not you?"; `"netral"` (blue) is for information | the text |

4. **Footer**, short:
   - why the person received the email. Each email can pass its own reason; the default is «Anda menerima email ini karena alamat ini terhubung dengan akun PINTAR.»;
   - «**PINTAR tidak pernah meminta PIN atau password lewat email.**»;
   - «Ada pertanyaan? Tulis ke info@pintarselalu.com.»;
   - «PT ZAYD PINTAR SELALU · pintarselalu.com».

**The PINTAR Digital Card** (D-059, spec §11) arrives with DAISY-24 as a block of its own, in the calm, muted card family, with its context always stated in text and nothing implying authority. The frame reserves nothing else for it.

## Constraints and evidence

The evidence below is from the last run of `buat-prototipe.mts`.

| Requirement | How the frame meets it | Evidence |
|---|---|---|
| Table layout, inline styles | Every layout element is a `role="presentation"` table, and every style is inline | the structure check: all tables carry `role="presentation"` |
| No scripts, no external CSS, no web fonts required | System font stacks only (Segoe UI, Roboto, Helvetica Neue, Arial; Consolas and Menlo for the code). Outlook is forced to Arial | the structure check finds no `<script>`, `<link rel=stylesheet>`, `@import` or `@font-face` |
| Works where `<style>` is stripped | The one `<style>` block only adds the narrow-screen spacing and dark mode | `320-tanpa-style` has 0 `<style>` blocks, card padding stays at the inline 32 px, and there is no sideways scroll |
| At most 600 px | `max-width:600px`. Outlook for Windows ignores max-width, so it gets a fixed 600 px table in a conditional comment | the structure check |
| Readable at 320 px | Fluid width; 16 px body, 13 px footer at the smallest; the button is 48 px tall and full width | every 320 px render: page width 320, no sideways scroll |
| Dark mode tolerated | `color-scheme` meta tags plus a `prefers-color-scheme: dark` set, used where the client honours it (Apple Mail, iOS, Outlook.com). Where a client inverts colours itself (the Gmail apps), the light palette inverts cleanly: solid backgrounds, an opaque logo, no transparent dark-on-transparent art | the `gelap` renders |
| Plain-text version | Same content, lines of 72 characters or fewer, URLs whole. The footer is set off with `--` **without** a trailing space, so clients do not fold it away as a signature and the PIN warning stays visible | `contoh-*.txt` |
| Bahasa Indonesia, `lang="id"` | On `<html>` and on the `role="article"` wrapper, which webmail keeps when it drops `<html>`; `aria-label` is the subject | the structure check |
| Accessible headings | Exactly one `<h1>`; the code has a visible label; the link text says where it goes | the structure check |
| Contrast | Every text/background pair used meets WCAG AA, in light and in dark | table below |
| Links | `https:` or `mailto:` only; the frame refuses anything else | the structure check, and `hanyaHttps` throws |
| No developer or Supabase words | The static scan (below) | 0 hits on both samples; the control is caught |
| Nothing unexpected | No tracking pixel. `format-detection` stops iOS from turning the code into a phone link. `x-apple-disable-message-reformatting` is set | the source |

**Contrast (WCAG 2.x ratios; AA needs 4.5:1 for text):**

| Pair | Light | Dark |
|---|---|---|
| body text on the card | 14.61 | 13.73 |
| secondary text on the card | 7.07 | 9.30 |
| row labels on the card | 5.53 | 7.29 |
| footer text on the page | 4.90 | 8.18 |
| links on the card | 7.39 | 9.19 |
| links and the text wordmark on the page | 6.54 | 10.32 |
| button text on the button | 7.39 | 5.46 |
| code on its box | 12.40 | 10.88 |
| code label on its box | 6.00 | 7.37 |
| text on the attention note | 12.65 | 12.69 |
| text on the neutral note | 12.41 | 12.72 |

**The static scan** reads everything a reader can see: the visible HTML text, `alt`, `title` and `aria-label`, the plain text, the subject and the preview line. It looks for these words, case-insensitive and whole-word:
- supabase, smtp, otp, token, api, json, localhost, undefined, null, nan, lorem, ipsum, todo, fixme, debug;
- staging, server, database, basis data, jwt, uuid, oauth, auth, magic link, noreply, vercel, namecheap, cpanel;
- sql, rpc, rls, env, error, exception, stack, webhook, payload, admin_gt, service role, `http://`;
- the app's own `INTERNAL_WORDS` (`src/lib/hle.ts`).

Result: **0 hits** in both samples. The control, with "OTP" and "Supabase" planted in a heading, is caught.

## Renders

**These are Chromium renders, not Gmail or Outlook screenshots.** They were made under email-client-safe constraints: table layout, inline styles, no scripts, no external CSS, no required web fonts. Real Gmail and Outlook screenshots come later, from the two real test inboxes Yazid provides (M6), once BOB-25 sends the first real message. That is Gate 2E and Gate 7 evidence.

| File | What it shows |
|---|---|
| `contoh-kode-600-terang.png` | desktop, 600 px, light |
| `contoh-kode-320-terang.png` | mobile, 320 px, light |
| `contoh-kode-600-gelap.png`, `contoh-kode-320-gelap.png` | `prefers-color-scheme: dark` emulated |
| `contoh-kode-320-tanpa-style.png` | every `<style>` block removed, as a client that strips it would; the inline styles alone |
| `contoh-kode-600-tanpa-gambar.png` | images blocked (Outlook's default): the alt text carries the PINTAR wordmark. The broken-image icon is Chromium's own; Outlook draws its own placeholder |
| `contoh-pemberitahuan-600-terang.png`, `-320-terang.png`, `-320-gelap.png` | the second sample: detail rows, the attention note, and the full-width button on mobile with the copy-the-address fallback |

## Wiring (when BOB-25 publishes its contract)

1. Move `bingkai.mts` to `src/components/email/` (Daisy's lane), unchanged in behaviour.
2. Move the frame's own words (`KATA`) into `src/lib/hle.ts` as `email.bingkai.*` (D-014). Emails render Bahasa Indonesia only.
3. Pin the static scan and the structure checks in a selftest (static), with a planted control.
4. Adapt the call to BOB-25's interface: a template's data in → `{ subject, html, text }` out. The sending module sets FROM and Reply-To, and uses the staging FROM on staging.
5. DAISY-20 to DAISY-24 supply each email's content as blocks.

## Questions for the gate

1. **Code grouping.** The sample shows «482 913» (3 + 3) for readability. If people type or paste it with the space, the code screen (DAISY-20) and verification (BOB-26) should accept it with or without the space. Otherwise the frame shows it ungrouped. Which one?
2. **The logo URL.** It is `https://app.pintarselalu.com/brand/pintar-selalu-logo.png` (the app's own asset, 766 × 429, 29 KB). Should staging emails load it from production or from staging, and do we want a smaller email-only copy?
3. **A visible staging marker** in the body, in addition to "Tim PINTAR (Staging)" in FROM? It is not built.
4. The footer says «password», as the brief does (DAISY-20 also uses "Lupa password?"). The app says «kata sandi» in one place (`auth.lede`). That is noted for the terminology review, not changed here.
