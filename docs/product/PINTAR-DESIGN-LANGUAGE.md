# PINTAR 2.0 — Design Language (baked)

Status: applied site-wide across all `.dc.html` screens and specs. This file is the
canonical reference; any new screen must be built from these tokens only.

> "Sederhana di permukaan. Terstruktur di bawahnya."

## Tokens

| Token | Hex | Use |
| --- | --- | --- |
| Gallery Canvas | `#FFFFFF` | page background — always pure white |
| Graphite Black | `#1D1D1F` | primary text, all headings |
| Charcoal | `#4B5A52` | secondary text, metadata, default link |
| Ditch The Tie | `#365147` | primary accent, CTA fills, active rails |
| Home Grown | `#B2BFB0` | progress, domain tags, "menunggu" chips |
| Kind Regards | `#E2E0D8` | card surfaces, hairline borders, "aman" chips |
| Pampas | `#ECE7DF` | secondary surface, inputs, hover fill, "info" chips |
| Terracotta | `#E4B4AB` | safety gate + penghalang: rails, borders, solid chips |
| Terracotta tint | `#FDF0F07F` | blocker **card body** fill only — never on chips |

Nothing outside this list. No gold, no emerald, no slate, no red.

## Geometry

- `border-radius: 0` everywhere. Cards, buttons, inputs, modals, chips, badges.
- 1px hairline borders. No box-shadow, no blur, no elevation.
- Progress bars: 4px tall, square caps, `#365147` or `#B2BFB0`.

## Typography

- Inter only (`SF Pro`, `Helvetica Neue` as fallbacks).
- Weights: 400 body, 500/600 headings. **Never above 600** — every `h1–h6` rule
  declares `font-weight:600` explicitly so the UA default bold can't leak back in.
- Metadata / labels / tags: `11px`, `uppercase`, `letter-spacing: 0.15em`.
- Minimum body size 13px; assessment stems and options at 16px.

## Motion

- `transition: all .2s ease-out`. Nothing spins, bounces, or flashes.
- Links: `#4B5A52` → `#1D1D1F`, or a 2px `#365147` bottom border.
- Cards: `#E2E0D8` → `#ECE7DF` fill shift.
- Buttons: opacity to 90%.

## Component rules

- **Navigation** — pure text, hairline bottom border, 2px `#365147` underline for
  active. No pills, no dark containers.
- **Status chips** — always opaque. Penghalang `#E4B4AB` + `#1D1D1F` text; menunggu
  `#B2BFB0`; aman `#E2E0D8`; info `#ECE7DF`. Alpha washes are illegible at 9.5px.
- **Safety gate / blocker card** — `#FDF0F07F` body, 3px Terracotta left rail,
  graphite text. Card-sized surfaces only.
- **Assessment canvas** — single column, `max-w-2xl`; options are white cards with
  hairline borders, hovering to `#ECE7DF`; selected gets a `#365147` border.
- **Assistance pill** — inline, no modal, appears only after the hesitation window.
  Never reveals the correct option. See `CLAUDE.md` Learning Safety Doctrine.

## Not yet migrated

The `Pintar 3.0/` Next.js codebase still carries the legacy Tailwind aliases
(`emerald`, `slate`, `mint`, `safety`, `rounded-card`, `rounded-control`, serif
font stack). Porting these tokens into `tailwind.config.ts` and `globals.css` is
the remaining work.
