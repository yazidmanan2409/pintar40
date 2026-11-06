# P-2 · Staging read-only pre-check (6 Nov 2026)

**Authorised by:** the owner, 6 Nov («Promote branch to staging»).

**What is promoted:** the branch `claude/awesome-rubin-bqxp6p` onto `main` 38d7e701.
- **No migrations:** the diff to `main` touches none, so staging's database is not written by the promotion.
- **The app:**
  - the Konfigurasi audit read (W6.2, `d9ef8548`, W62-JEJAK-01; EFF-K02 restated in `3e4083c9`);
  - Node 22 in the three apply and restore workflows (W9.18);
  - the restore posture step (W9.12);
  - the walk and perf harness fixes;
  - evidence.
- **CI on the branch:** run 42135394467, green on `3e4083c9`; later commits change documents only.

**How it was run:** on `pintar-staging` (`keijhmdtsgrfvnvocfvk`) through the Supabase connector. Every query ran inside `begin transaction read only`. Only counts and digests were read.

| Check | Expected | Read | Result |
|---|---|---|---|
| Recorded migrations | 196, latest `20261230100000` | 196, `20261230100000` | ✓ |
| The demo school (`preservation.sql`) | P-1's values | 4/10/10/3/5/1, audit 91 (6860), people `bd41b3c9…`, accounts `7deebf17…` | ✓ identical |
| Official results outside the test schools | P-1's `a14f4a40…` | `a14f4a40…` | ✓ identical |
| Certificates outside the test schools | P-1's `ffa43edd…` | `ffa43edd…` | ✓ identical |
| Results outside the test schools | P-1's `2440c371…` | `0bb024d0…` | changed, see below |
| Integrity signals outside the test schools | P-1's `666ff1ab…` (15) | `32c726bd…` (23) | changed, see below |
| All results / official / certificates / courses / transfers | P-1's 1592/166/45/50/1 | 1704/178/48/53/2 | changed, see below |
| Management decisions | none | none | ✓ |

**Why four values changed since P-1:**
- **The cause:** the walks and the W6.8 test wrote through PINTAR's own operations, which they are meant to do:
  - the B8 walks on Sekolah Uji B8 1105, a test school;
  - W6.8 on the synthetic load school («Tingkat Beban B8»).
- **Outside the test schools:**
  - every results row is in a synthetic school (1,526), except 30 in non-synthetic schools;
  - every integrity signal is synthetic (23); none is in a non-synthetic school.
- **The baseline:** because `preservation.sql` mixes synthetic and real rows, the post-check also compares the non-synthetic part on its own. Its baseline, taken now:

| Non-synthetic, outside the test schools | Baseline (6 Nov, before P-2) |
|---|---|
| results digest | `f4fbb8c07a94fce7b90290114fab7083` |
| official results digest | `a14f4a405d09b0ee2daec14292a4777b` |
| integrity signals | 0 |

**The backup:**
- **Not asked of the owner this time:** the promotion applies no migration and writes nothing to the database.
- **What stands:** the daily physical backups recorded at P-1. Storage is still outside them (D-190).
