# Image placeholder inventory

Every placeholder below appears on its page as a labelled dashed box (from `shared/dom.js`'s `ph()`), sized to the real image's aspect ratio. That lets the layout be judged before any photography exists. This file lists the same inventory, so a shoot, stock brief or illustration brief can be planned in one pass.

No final photography has been sourced.
- **Avoid:** robots, AI brains, glowing networks, floating holograms, generic laptop stock photography, and children pointing theatrically at screens.
- **Prefer:** documentary-style photography of real Indonesian classrooms and educators over posed stock imagery.

| # | Page | Purpose | Type / content | Size (px) | Ratio |
|---|------|---------|-----------------|-----------|-------|
| 1 | Home (`/`) | Hero, asymmetric right | Indonesian educator working naturally in a classroom; documentary photography, not posed stock | 1400 × 1700 | 14:17 |
| 2 | Home (`/`) | "For Educators" teaser card | Sample PINTAR interface for this role; UI illustration, not a photo | 1120 × 980 | 8:7 |
| 3 | Home (`/`) | "For Management" teaser card | Sample PINTAR interface for this role; UI illustration, not a photo | 1120 × 980 | 8:7 |
| 4 | Home (`/`) | Reports teaser, asymmetric left | Sample PINTAR report on a laptop or tablet screen, shown at a slight angle (product mockup) | 1500 × 1100 | 15:11 |
| 5 | For Educators (`/untuk-pendidik/`) | Header, asymmetric right | Educator reviewing a short result on a tablet while sitting with one learner; documentary | 1300 × 1600 | 13:16 |
| 6 | For Management (`/untuk-manajemen/`) | Featured example 1 (full width) | Sample institution-level summary on a large screen; product mockup | 1600 × 1150 | 16:11.5 |
| 7 | For Management (`/untuk-manajemen/`) | Featured example 2 (half width) | Sample per-class evidence-coverage view; product mockup | 1000 × 1150 | 8:9.2 |
| 8 | For Management (`/untuk-manajemen/`) | Featured example 3 (half width) | Sample aggregated learning-pattern view with no individual identities shown; product mockup | 1000 × 1150 | 8:9.2 |

**Product mockups must be drawn from the real product.** Placeholders 2–4 and 6–8 will show PINTAR screens. When they are produced, they must show the product's own screens and words, as `/laporan/` now does:
- MC-1 figures;
- the three evidence states;
- readiness tiers as neutral rows.

They must not show an invented report model, and any numbers in them must be labelled simulated.

**Removed on 24 Sep:** the "Who builds it" team photo on `/tentang/`. It went with the claim it illustrated, for which the repository holds no evidence.

**Identity (not a placeholder):** the supplied PINTAR SELALU logo, copied byte for byte from the product (`shared/brand/pintar-selalu-logo.png`). It replaces the square mark that had been invented for this site.

**Not photographic.** These are built directly in HTML/CSS and need no placeholder:
- the report cards on `/laporan/`;
- Mini-PINTAR's school view.

Both are real markup drawn after the product's evidence cards, so they render correctly today.

**Total: 8 placeholders.** Two documentary photography briefs, two product-UI illustrations, and four product mockup screens.
