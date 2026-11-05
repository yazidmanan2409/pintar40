# P-1 · Staging after the promotion: merge, migrations and the read-only post-check (5 Nov 2026)

**Merge:** PR #10 merged into `main` as `38d7e701`, a merge commit pinned to the verified head `afefaf72`, after:
- CI 42026574403 (dispatch) and 42026560581 (pull_request, re-run once after it was cancelled by concurrency before any
  job ran), both green on that head;
- journeys 42026579074, both jobs green;
- the owner's backup confirmation (step 2).

**Migrations:** `staging.yml` run 42035466406 green: 194, 195 and 196 applied; count = 196, equal to the repository's.

**Post-check:** read-only, on `pintar-staging` through the Supabase connector, inside `begin transaction read only`.

| Check | Expected | Read | Result |
|---|---|---|---|
| Recorded migrations | 196, latest `20261230100000` | 196, `20261230100000` | ✓ |
| Exposure marks (194) | 20 TITLE + 240 STEM | 20 + 240 | ✓ |
| The order rule (195) | `PRE_TEST_NOT_FINALIZED` in `may_start_assessment` | present | ✓ |
| `school_people_page` (196) | present | present | ✓ |
| Preservation digests | the pre-check's values | every value identical: demo 4/10/10/3/5/1, audit 91 (6860), people `bd41b3c9…`, accounts `7deebf17…`, results `2440c371…`, official `a14f4a40…`, certificates `ffa43edd…`, all 1592/166/45/50/1, signals `666ff1ab…`, decisions none | ✓ |
| The ten D-184 schools' sittings | 96 | 96 | ✓ |

**The app:** staging's Vercel build of `main` is read by `environment-facts.yml`. Every Golden School walk also runs it
first as GS-00, so a walk runs only on staging serving `main`'s code and migrations.
