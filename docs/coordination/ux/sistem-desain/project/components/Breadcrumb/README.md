The scope line: it names where a page sits, only when it is three or more levels deep.

**Status: KEPT** (BarisLingkup, `.pin-scope`), restyled.

**Markup.** `ol.pds-scope[aria-label="Lokasi"]` > `li` > `a`, the last `span[aria-current="page"]`, above the page title.

**Rules**
- Only three levels or more (Pimpinan / Sekolah / Bagian / Kelas). Two or fewer: none; a back link names its destination.
- It names places, never steps or actions.
- The «/» between places is drawn, not read: a screen reader hears the list of places only.
- Never the only way back on a small screen; the back link or the navigation is.

**In PINTAR today.** BarisLingkup (`.pin-scope`).
