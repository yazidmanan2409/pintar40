| Pair | Text or mark | Ground | Contrast | Floor | |
|---|---|---|---|---|---|
| Body text | `ink-1` | `surface-0` | 14.00:1 | 4.5:1 | pass |
| Body text | `ink-1` | `surface-1` | 14.61:1 | 4.5:1 | pass |
| Body text | `ink-1` | `surface-2` | 12.94:1 | 4.5:1 | pass |
| Body text | `ink-1` | `surface-3` | 11.94:1 | 4.5:1 | pass |
| Body text, selected | `ink-1` | `pintar-primary-soft` | 12.40:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `surface-0` | 6.77:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `surface-1` | 7.07:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `surface-2` | 6.26:1 | 4.5:1 | pass |
| Secondary text | `ink-2` | `pintar-primary-soft` | 6.00:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `surface-0` | 5.30:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `surface-1` | 5.53:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `surface-2` | 4.90:1 | 4.5:1 | pass |
| Metadata | `ink-3` | `pintar-primary-soft` | 4.70:1 | 4.5:1 | pass |
| Disabled text (WCAG-exempt; kept readable) | `ink-disabled` | `surface-2` | 3.19:1 | 3:1 | pass |
| Disabled text | `ink-disabled` | `surface-1` | 3.60:1 | 3:1 | pass |
| Link, quiet button | `pintar-primary` | `surface-0` | 7.08:1 | 4.5:1 | pass |
| Link, quiet button | `pintar-primary` | `surface-1` | 7.39:1 | 4.5:1 | pass |
| Link on hover ground | `pintar-primary` | `surface-2` | 6.54:1 | 4.5:1 | pass |
| Current page number | `pintar-primary` | `pintar-primary-soft` | 6.27:1 | 4.5:1 | pass |
| Primary button | `pintar-primary-ink` | `pintar-primary` | 7.39:1 | 4.5:1 | pass |
| Primary, hover | `pintar-primary-ink` | `pintar-primary-hover` | 9.03:1 | 4.5:1 | pass |
| Primary, pressed | `pintar-primary-ink` | `pintar-primary-pressed` | 10.85:1 | 4.5:1 | pass |
| Destructive confirm | `pintar-primary-ink` | `status-blocked` | 7.49:1 | 4.5:1 | pass |
| Destructive, hover | `pintar-primary-ink` | `status-blocked-hover` | 9.32:1 | 4.5:1 | pass |
| Destructive, pressed | `pintar-primary-ink` | `status-blocked-pressed` | 10.39:1 | 4.5:1 | pass |
| Destructive words | `status-blocked` | `surface-1` | 7.49:1 | 4.5:1 | pass |
| Destructive words, hover | `status-blocked` | `status-blocked-soft` | 6.11:1 | 4.5:1 | pass |
| Success badge / result | `status-ok` | `status-ok-soft` | 5.27:1 | 4.5:1 | pass |
| Success on white | `status-ok` | `surface-1` | 6.09:1 | 4.5:1 | pass |
| Attention badge | `status-attention` | `status-attention-soft` | 4.89:1 | 4.5:1 | pass |
| Error badge, error text | `status-blocked` | `status-blocked-soft` | 6.11:1 | 4.5:1 | pass |
| Info badge | `status-info` | `status-info-soft` | 6.00:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-attention-soft` | 12.65:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-blocked-soft` | 11.92:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-ok-soft` | 12.65:1 | 4.5:1 | pass |
| Text in a banner | `ink-1` | `status-info-soft` | 12.41:1 | 4.5:1 | pass |
| Field outline (non-text, 1.4.11) | `line-control` | `surface-1` | 3.52:1 | 3:1 | pass |
| Field outline | `line-control` | `surface-0` | 3.37:1 | 3:1 | pass |
| Field outline | `line-control` | `surface-2` | 3.12:1 | 3:1 | pass |
| Focus ring (non-text) | `focus-ring` | `surface-0` | 7.08:1 | 3:1 | pass |
| Focus ring | `focus-ring` | `surface-1` | 7.39:1 | 3:1 | pass |
| Focus ring | `focus-ring` | `surface-2` | 6.54:1 | 3:1 | pass |
| Focus ring | `focus-ring` | `pintar-primary-soft` | 6.27:1 | 3:1 | pass |
| Checked control fill (non-text) | `pintar-primary` | `surface-1` | 7.39:1 | 3:1 | pass |
| Error edge (non-text) | `status-blocked` | `surface-1` | 7.49:1 | 3:1 | pass |

**For information, not a pass:**
- `line` (the hairline) on `surface-1` is 1.26:1 and `line-strong` 1.61:1. Neither identifies a control on its own: a field uses `line-control`, and a secondary button is identified by its words.
- `status-ok` against `pintar-primary` differs by 1.21:1 in lightness. That is why success always carries ✓ and a word.
