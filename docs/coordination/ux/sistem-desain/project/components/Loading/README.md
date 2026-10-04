The page's own shape in quiet blocks, and one sentence saying it is loading.

**Status: KEPT** (MemuatHalaman, the one loading shell), restyled.

**Markup.** `aria-busy="true"` on the region, a `role="status"` line («Memuat halaman…» with the working dot), and `pds-skeleton` blocks in the shape of what will arrive.

**Rules**
- One loading shell for every page (MemuatHalaman), so the experience is the same everywhere.
- No spinner and no shimmer sweeping across; a slow fade only, still under reduced motion.
- The shape matches the page, so nothing jumps when the content arrives.
- Over 3 seconds, the sentence says why («Jaringan sedang lambat…»).
- Never hide work that should not happen behind a loading state (D-047(a)).
