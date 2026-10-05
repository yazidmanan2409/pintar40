The tab icon (Q17, 5 Oct): a functional identifier, not a logo. A solid PINTAR-green square (`pintar-primary`, #245F55) with nothing on it: no letter, no P, no symbol.

| File | Size | Shape | Where it goes in the application pass |
|---|---|---|---|
| `favicon.ico` | 16, 32, 48 px | rounded (radius 6 on a 32 grid), transparent corners | `src/app/favicon.ico`, replacing the framework's default |
| `icon.svg` | any | the same, as vectors | `src/app/icon.svg` |
| `apple-icon.png` | 180 px | full bleed (iOS rounds it) | `src/app/apple-icon.png` |
| `icon-192.png`, `icon-512.png` | 192, 512 px | full bleed | only with a web manifest, if one is ever added (none today) |

- **Made by** `alat/buat-ikon-tab.py` (Pillow).
- **Prepared only:** nothing is copied into `src/` until the application pass.
- **Later:** a permanent app-icon design is a separate decision.
