Colour and opacity at 160 ms, used only to acknowledge, guide attention, show continuity or confirm completion.

**Status: KEPT by default** (colour and opacity, 160 ms, off under reduced motion). The extra durations and any travel are question 8.

| Token | ms | For |
|---|---|---|
| `duration-base` | 160 | Every transition today: hover and press colour, a state change, a result line or a layer fading in |
| `duration-pulse` | 900 | One cycle of the working dot |
| `duration-fast`, `duration-slow` | 120, 240 | Proposed only (question 8); unused until ruled |

**Rules**
- Colour and opacity only, as v2 rules. Letting an entering layer travel 8 px, or a chevron turn, is question 8; nothing here uses it.
- Nothing spins, bounces, slides across the page, counts up or celebrates.
- Under `prefers-reduced-motion`, every duration is 0 and the working dot stays still (try the toggle in the preview).
- No motion delays the next action.
