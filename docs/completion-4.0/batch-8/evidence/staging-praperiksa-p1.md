# P-1 · Staging read-only pre-check (5 Nov 2026)

Run through the Supabase connector on `pintar-staging` (`keijhmdtsgrfvnvocfvk`), each query inside
`begin transaction read only`, SELECT only. Counts, digests and slugs only; nothing was changed.

| Check | Expected | Read | Result |
|---|---|---|---|
| Recorded migrations | 193, latest `20261227100000` | 193, `20261227100000` | ✓ |
| `may_start_assessment` md5 (the rollback's target) | `c9b3f4ce04f07edc20f0124b0815ce45` | the same | ✓ |
| 194's objects (`exposed_content_marks`) | absent | absent | ✓ |
| 196's function (`school_people_page`) | absent | absent | ✓ |
| Preservation digests (`batch-5/evidence/staging/preservation.sql`) | Batch 5's after-values | every value identical: demo 4/10/10/3/5/1, audit 91 (6860), people `bd41b3c9…`, accounts `7deebf17…`, results `2440c371…`, official `a14f4a40…`, certificates `ffa43edd…`, all 1592/166/45/50/1, signals `666ff1ab…`, decisions none, 15/0 | ✓ |
| The ten D-184 schools' sittings (`staging-96-sesi.md`) | 96; the newest on 9 Oct | 10 + 0 + 10 + 10 + 11 × 6 = **96**, the newest on 9 Oct | ✓ |
