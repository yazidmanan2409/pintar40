A restrained vocabulary, used only to acknowledge, guide attention, show continuity or confirm completion.

**Status: CHANGED, APPROVED (question 8, 5 Oct).** v2's 160 ms is kept for ordinary changes. Hover gets 120 ms, an entering floating layer 240 ms with 8 px of travel at most, and a disclosure's chevron turns.

| Token | ms | For |
|---|---|---|
| `duration-fast` | 120 | Hover and press colour, a checkbox's tick |
| `duration-base` | 160 | An ordinary colour or opacity change: a tab, a segment, a switch, a result line appearing, a chevron turning |
| `duration-slow` | 240 | A floating layer entering: a dialog (rises 8 px), a drawer (slides 8 px), a menu (4 px away from its button) |
| `duration-pulse` | 900 | One cycle of the working dot |

**Rules**
- Colour and opacity, plus a short travel for an entering floating layer: 8 px at most. A disclosure's chevron may turn.
- Nothing spins, bounces, slides across the page, counts up or celebrates.
- Under `prefers-reduced-motion`, every nonessential motion is removed: every duration is 0, nothing travels, and the working dot stays still (try the toggle in the preview).
- No motion delays the next action.
