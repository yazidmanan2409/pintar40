# Staging's ten D-184 schools: the authoritative sitting count (5 Nov 2026)

**Why:** D-184's evidence page and D-185 wrote «106 sittings». The page's own table sums to 96. The owner asked for the
figure to be corrected from an authoritative read-only count (staging promotion review, 5 Nov, item 4).

**Method:** one read-only query on staging (`pintar-staging`) through the Supabase connector, inside
`begin transaction read only`, SELECT only. Counts and slugs only; no person, name, address or answer was read.
Nothing on staging was changed.
- **Exposed chapter:** a course with no `supersedes_course_id` whose title fingerprint (`exposure_fingerprint`'s
  normalisation: trimmed, white space collapsed, lower case, sha256) is one of migration 194's 20 TITLE marks.
- **A sitting's course:** taken from its assessment definition (`coalesce(d.course_id, m.course_id)`), exactly as 194's
  guard resolves it.

| School (slug) | Synthetic | All sittings | OFFICIAL | Over the exposed chapter | Newest sitting |
|---|---|---:|---:|---:|---|
| `gs-001` | no | 10 | 10 | 10 | 2 Oct |
| `sd-zps` | no | 0 | 0 | 0 | — |
| `sekolah-demo-pintar` | no | 10 | 10 | 10 | 6 Oct |
| `sekolah-emas-uji-20261005` | no | 10 | 10 | 10 | 5 Oct |
| `sekolah-uji-b0` | no | 11 | 11 | 11 | 6 Oct |
| `sekolah-uji-baseline-894` | no | 11 | 11 | 11 | 9 Oct |
| `sekolah-uji-daisy-001a` | no | 11 | 11 | 11 | 9 Oct |
| `sekolah-uji-daisy-885` | no | 11 | 11 | 11 | 9 Oct |
| `sekolah-uji-daisy-885b` | no | 11 | 11 | 11 | 9 Oct |
| `sekolah-uji-l3` | no | 11 | 11 | 11 | 8 Oct |
| **Total** | | **96** | **96** | **96** | |

**Result:**
- The authoritative figure is **96 sittings**. All of them are OFFICIAL and all are over the exposed chapter. None is
  newer than 9 Oct, so the figure has not moved since D-184 read it.
- «106» was an arithmetic slip, corrected where the figure was written:
  - D-184's evidence page;
  - E-K6-4 in `06-ENGINEERING-ITEMS-FROM-DESIGN.md`;
  - D-185's row in `DECISIONS.md`, marked *sic*, with the ruling's own words kept.
- Nothing else in D-185 depends on the number.
