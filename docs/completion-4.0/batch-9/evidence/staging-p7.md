# P-7 staging promotion: the record (7 Nov 2026)

**Authorised by the owner:** «PINTAR 4.0 — Owner Authorization P-7. Decision: GO for staging promotion» (7 Nov). Staging only. **Production was not touched.**

**What it carries:** Batch 9's Visual Intelligence reports as Daisy's approved compositions (D-195), her fidelity findings (KESETIAAN #1–#28), X5 (D-196) with her patch `d86f61b3`, the PD boundary (D-069, F33-P01), and migrations 199–200. The scope, the security tests and the way back are in the proposal, reproduced in §6.

## 1. Identifiers

| | |
|---|---|
| Candidate (audited) | `d18e24e4282c95d6c675ac6c39a752a21c906d1a`, tree `b9b71877a3f2ea3acc248f97fc96d59593d0414d` |
| CI on the candidate | run 42409386105, every job green |
| Journeys pinned to the candidate | run 42409388669, A and B green (B 79/79, C12f and C12f2 PASS) |
| PR | [#16](https://github.com/yazidmanan2409/pintar40/pull/16): 69 files, 39 commits; its own `pull_request` CI 42414983455, all 18 jobs green (not stood down as ALREADY PROVEN) |
| Merge | `main` `c4944fab7d6ffc19f9b1b41512c3fbbdca64d1fa`, a merge commit (parents `002852ab`, `d18e24e4`) |
| Promoted equals audited | `scripts/release/kandidat-sama.sh d18e24e4 c4944fab`: **SAME**, tree `b9b71877…` |
| Migrations | `staging.yml` run 42417165719, success: 198 → 200 |
| The deployed app is `main` | every walk's GS-00 (`environment-facts.yml`): staging serves `c4944fab` and its 200 migrations |

## 2. Read-only checks on staging (Supabase, project `keijhmdtsgrfvnvocfvk`)

| Check | Result |
|---|---|
| Migrations | 200, latest `20270103100000` |
| The six new functions | present; each SECURITY DEFINER with a pinned search_path; `execute` false for anon, true for authenticated; each registered in `client_rpc_registry` |
| Same code as the candidate | each function's `prosrc` md5 equals the candidate's file: murid_perlu_penguatan `6e5848c0…`, jenis_belajar_saya `fc67c321…`, sebaran_murid_kelas `87d6fe0a…`, kenaikan_awal_akhir `e897f232…`, kesiapan_kelas_per_mapel `fe3332f4…`, kelas_dikecualikan_kartu `f08a2fc8…` |
| The PD boundary (F33-P01) | `member_kind = 'LEARNER'` present in `murid_perlu_penguatan` and `sebaran_murid_kelas` |
| Metric catalogue | MC-8, closure ok; `authenticated` can call no calculator |
| Official results and certificates | 225 and 60 before the walks, unchanged by the promotion |

## 3. Staging walks

Every write in the walks is a press of PINTAR's own buttons.

### Sekolah Uji P7 1107 (`sekolah-uji-p7-1107`, founded by run 42418290195)

| Walk | Run | Result |
|---|---|---|
| GS-01–03 | 42418365951 | GREEN |
| GS-04–11 | 42418693860 | GREEN |
| GS-07, GS-12–16 | 42419553396 | GREEN |
| GS-17–21 | 42420187718 | **16 PASS, 2 FAIL: a defect in the walk's reader, not the product (below)** |

**The two failures, explained.**
- **L4** (the school admin's «Kelas 5A» summary): the walk read «Mantap» 0, «Berkembang» 0, «Perlu penguatan» 0 and three unexpected rows «Mantap 2 murid (40%)» 240, «Berkembang 2 murid (40%)» 240, «Perlu penguatan 1 murid (20%)» 120.
  - The page drew exactly the expected bands: 2, 2 and 1.
  - Since the legend amendment (`a2291edf`), each legend row reads «{band} **{n} murid ({p}%)**». The walk's reader took the band with the count still attached, and every digit of «2 murid (40%)» as the count (240).
  - The same figures passed for the teacher (L1), the Kepala departemen (L2) and the Dekan (L3), whose panels use a different markup.
  - **Fix:** `029cd1d1`, in the walk only. The band is the row's words without its `<strong>`; the count is the strong's first number. The expected values are unchanged. Checked against the composition's markup (the three rows read 2, 2, 1).
- **X1** (no session left open) followed from L4: the step threw before its «Keluar», so the admin's session stayed open. Every other session closed.
- The rest of GS-17–21 passed on this school: the certificate and its eligibility (C1–C3), the card re-issue (R1), recovery by email and by PINTAR ID and PIN (R2, R3), the class computer and the shared browser locks (U1, U2, U2a), the public check (V1, V2) and the late learner (N1, GS-22).
- **Why a second school:** GS-22 runs once per school and had added «Fajar», so the read-only recipe no longer holds on this school for a second GS-17–21 (the P-6 lesson). The walk of record is on a second fresh school.

### Sekolah Uji P7B 1107 (`sekolah-uji-p7b-1107`, founded by run 42422230751): the walks of record

| Walk | Run | Result |
|---|---|---|
| found-school (GS-01) | 42422230751 | (pending) |
| GS-02–03 | | |
| GS-04–11 | | |
| GS-07, GS-12–16 | | |
| GS-17–21 | | |
| Studio end to end (other school: Sekolah Uji P7 1107) | | |
| Batch 5 walk | | |

## 4. The reports, PD reports, X5, mobile and A4

(to be completed from the walks above)

## 5. Remaining defects and open items

(to be completed)

## 6. Final staging state

(to be completed)
