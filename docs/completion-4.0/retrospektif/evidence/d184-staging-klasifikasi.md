# D-184 · Staging's ten schools holding an exposed chapter: classification, read-only (4–5 Nov 2026)

**Method:** read-only SQL on staging through the Supabase connector (`execute_sql`, SELECT only). Counts and slugs only; no person, name, address or answer was read. Nothing on staging was changed.

**Staging's environment marker:** `platform_environment.environment` reads **«production»**. The database therefore cannot tell staging's test schools from a real school by environment, and D-184 forbids an environment bypass anyway.

| School (slug) | Created | Founded by | Classification changes | Sittings | OFFICIAL sittings |
|---|---|---|---:|---:|---:|
| `sd-zps` | 24 Sep | no founding record (before `operator_found_school` existed) | 0 | 0 | 0 |
| `gs-001` | 2 Oct | `operator_found_school/1` | 0 | 10 | 10 |
| `sekolah-emas-uji-20261005` | 5 Oct | `operator_found_school/1` | 0 | 10 | 10 |
| `sekolah-demo-pintar` | 6 Oct | `operator_found_school/1` | 0 | 10 | 10 |
| `sekolah-uji-b0` | 6 Oct | `operator_found_school/1` | 0 | 11 | 11 |
| `sekolah-uji-l3` | 8 Oct | `operator_found_school/1` | 0 | 11 | 11 |
| `sekolah-uji-baseline-894` | 9 Oct | `operator_found_school/1` | 0 | 11 | 11 |
| `sekolah-uji-daisy-885` | 9 Oct | `operator_found_school/1` | 0 | 11 | 11 |
| `sekolah-uji-daisy-885b` | 9 Oct | `operator_found_school/1` | 0 | 11 | 11 |
| `sekolah-uji-daisy-001a` | 9 Oct | `operator_found_school/1` | 0 | 11 | 11 |

All ten are `is_synthetic = false`, not the bootstrap tenant, with no declared evidence purpose. Each holds one exposed chapter; nine hold two open cycle assignments of it.

## What the governed workflow can represent

- **Founding:** `operator_found_school/1` (migration `20261108100000_a_school_is_founded_by_a_versioned_step.sql`) inserts every school with `is_synthetic = false`. It has no way to found a test school as synthetic.
- **Reclassification:** no PINTAR path writes `is_synthetic` (T1, migration `20261111100000_an_operational_change_says_what_it_was.sql`). Only the database owner or the service key can, and the change is audited (`institution.state_changed`). None of the ten has such a row.
- **Evidence:** a session's evidence class is fixed at write time. The only governed change is the append-only, audited override log (`evidence_class_overrides`), which may only weaken: OFFICIAL → SYNTHETIC is allowed, never the reverse.

**Conclusion:** the governed workflow **cannot represent these test schools correctly.** They are test schools by name and use, but the system records them, and their 106 sittings, as real. This is a gap in the governed workflow, not a reason to weaken the exposure control (D-184).

## Options for the owner (none taken)

1. A versioned founding step that can found a synthetic school (`operator_found_school/2`), and a governed, audited reclassification step for existing test schools. Their existing sittings would be weakened to SYNTHETIC through the override log. New schema: needs authorisation.
2. Keep the ten as they are, and move staging's test work to the synthetic replacement chapters (`docs/onboarding/konten-sintetis/`). After deployment, they keep working for everything except the exposed chapters.
3. A one-off reclassification by the database owner, audited by the existing trigger. A staging data change: needs authorisation.

**Decided (D-185, 5 Nov): option 2.** The ten schools and their 106 sittings stay unchanged; their staging tests use the synthetic replacement chapters (held by `D185-SINTETIS-01`); every staging record is test data and is never promoted into production. The migration is still not deployed: no deployment is authorised (D-183(3), D-184, D-185(6)).
