# Integration dossier · Batch 8 · the proofs (W6.x, W5.4) and promotions P-1 to P-4, in the form of H §2

**Status:** drafted 8 Nov from the record. Batch 8 mostly **measures** what earlier batches built. Under H §1, a check that does not apply is marked **n/a** with its reason. The checks it does touch are recorded with their evidence:
- the boundary defects its walks found;
- the security suite;
- the promotions.

Every claim names its evidence; a check with gaps says so.

## 1. Dependencies

**n/a as a feature:** Batch 8 adds no surface of its own. What each proof exercises:

| Proof | Exercises | Harness |
|---|---|---|
| W6.4 crawl | 14 personas, 55 screens, at 320, 640, 1024 and 1280 px | `audit/a11y.mjs` |
| W6.2 U-PERF | each role's first screens; clicks and saves on staging | `audit/perf/layar-pertama.mjs`; `perf-staging.yml` |
| W6.8 | 50 learners through the real player, `record_answer` | `perf-l1.yml` mode `browser` |
| W6.10 | ten clauses previously proven only at HTTP or database level | `audit/b8-jalan.mjs` |
| W5.4 | the whole manifest and `docs/audit/launch-readiness.sql` | `evidence/w54-keamanan.md` |

## 2. Data contracts and consumers

**Mostly n/a:** no contract was added. **Two contracts were found broken at a boundary and fixed at their source:**
- **The cycle order:** the screens held the Pemetaan Awal before the Uji Penguasaan, but the database did not. Migration `20261229100000` adds `PRE_TEST_NOT_FINALIZED` to `may_start_assessment` (F29-S01; red before, `evidence/f29-merah-sebelum.txt`).
- **`/akun` under an evaluation persona:** the page reached the staff check instead of giving a reason. Fixed in `src/app/akun/page.tsx` (`evidence/j18-merah-sebelum.txt`; register W6.10).

## 3. Authorisation and visibility, at the database

- **W5.4 on the candidate:**
  - the whole manifest: 843 passed, 0 failed (`evidence/w54-keamanan.md` §1);
  - launch-readiness 24/24: RLS closed, G7 grants exact, the audit trail append-only (§2);
  - the secret scan clean; production dependencies 0 advisories (§3).
  - The first run was red on 10 rows, because `school_people_page` was unregistered. It was registered, and its rule is held by F30-S01 with a planted missing scope check (§1).
  - CI 42007060565 and journeys 42007065865 green on `715f6f7d`.
- **Sessions ended elsewhere (W9.19's regression, found in Batch 8's staging walk):**
  - GS-21 R2 and R3 were red on `4d325a33` (run 42195722895): an ended session still reached `/mengajar`;
  - fixed at source, in `penggunaTerverifikasi`'s `getUser()` (W919-CABUT-01, W919-CABUT-02);
  - green on staging after P-4, 18/18 (run 42220729346; `evidence/staging-pascaperiksa-p2.md`).
- **Staging email (P-2):** only PINTAR's own and the reserved test domains (P2-PENERIMA-01; `02-STAGING-PROMOTION-PROPOSAL.md` §4).
- **Gap:** a penetration test by a third party is outside the suite (`w54-keamanan.md` §4).

## 4. Design and terminology across connected surfaces

**n/a:** no new composition. The new strings are listed as provisional:
- `evaluasi.akun_tidak_ada` (Gladys pack B36);
- `emailuji.alasan.ditahan_uji` (B37).

K1 and K2 stay provisional on staging (`02` §6).

## 5. Exceptional conditions and multi-context journeys

- **Browser walks (W6.10):** 9/9 in journeys 41972261935 job A on `c9fec859`. They walk:
  - J1.6 maintenance; J1.8; J2.1, an unknown address;
  - J2.9 «Keluar semua»; J2.10, the 60-minute and 3-PIN end; J2.12, the ladder and the assisted reset;
  - J2.18 resend; J2.20 the long idle;
  - J6.4 hints; J6.7 pause.
- **J2.7, the existing staff's transition:** 15/15 on staging (run 42163941604). The Kepala departemen, holding two purposes, lands on the chooser (T2).
- **Under load (W6.8):** with 50 learners, nothing was lost, duplicated or unscored, and 0 of 2,261 calls gave a server error (`w69` §2c).
- **A platform administrator:** first screens timed (`w69` §2, §2d); crawled among the 14 personas (§1).
- **Gaps:**
  - J10.2, the forced 500, is held only statically (BOB07-K03).
  - No proof here covers a staff member who is also learning. That is C-12 (W6.3, register), not a Batch 8 walk.

## 6. Regression

- **Promotions P-1 to P-4, read-only after each:** the demonstration school, and the results, official results, certificates and integrity signals outside the test schools, are identical:
  - `evidence/staging-pascaperiksa-p1.md`;
  - `evidence/staging-pascaperiksa-p2.md` (P-2, P-3, P-4).
- **P-4:** promoted equals audited (`kandidat-sama.sh`: SAME, KANDIDAT-SHA-01/02).
- **Guards for the measurements:**
  - W62-JEJAK-01 holds the audit-trail read fix (`w69` §2b);
  - `layar-pertama.mjs` runs in CI's journeys as a regression gate (§2).
- **Rollback:** `ROLLBACK-194-195.sql` was tested from 196, 195, 194-only and 193 (`03-P1-DECISION-NOTE.md`).

## 7. End-to-end journeys

- **P-1:** GS-01–21, administration, Studio, Batch 5 and accessibility, all green on «Sekolah Uji B8 1105» (`staging-pascaperiksa-p1.md`):
  - GS-17–21: 42049795788;
  - Studio: 42057142327;
  - Batch 5: 42059820670;
  - accessibility: 42062130434.
- **P-4:** GS-01–21 on «Sekolah Uji B8 1106»: 42211714233, 42213701786, 42217292476, 42220729346.
- **Human journey:** not accepted (no recorded walk by a person).

## 8. Evidence

- **The ledger of checks:** `evidence/w69-bukti-pemeriksaan.md`.
- **The checklist:** v2.8 rendered on `4d325a33` (`docs/coordination/RELEASE-CHECKLIST.md`). U-PERF PASS → FAIL by little; CAP-02 FAIL at 50; P0 77 of 84 (register W6.9).
- **W6.2: NOT MET as measured.**
  - From the US runner, the first screen takes 2.5–3.2 s (42192239336).
  - Co-located, it takes ≤ 492 ms (42383221915).
  - The difference is the distance to the proxy (§2d).
- **W6.8: NOT MET.** The answer-save p95 is 1,828 ms against 1 s (42110164855). The database's share is 20 ms (§2c).
- **Gap:** no measurement from Indonesia. The harness is ready (`acceptance/W62-W68-REGIONAL.md`, `perf-regional.yml`), but a machine in the region is an owner provision.

## 9. Cross-feature UX consistency (D-172)

- **Keyboard, zoom, phone width and colour:**
  - 0 axe violations;
  - 0 overflow or clipping at every width (one 320 px defect fixed, `w69` §1);
  - 200 % zoom at 640 px;
  - state never shown by colour alone (§3).
- **Gap:** NVDA and TalkBack are not run. The script is `acceptance/SCREEN-READER-SCRIPT.md`; the run needs a person with the devices (W6.12 PARTIAL).

## Verdict

- **Integration for Batch 8: n/a (measurements), as the ledger says.**
- The boundary checks it touches (2, 3, 5, 6) have evidence; each defect found was fixed at its source.
- **The proofs themselves are not met:** W6.2 and W6.8 are NOT MET as measured, and W6.12's screen-reader passes are outstanding. **Human journey: not accepted.**
- Ledger note: H §3b's Batch 8 engineering cell omits two verified items:
  - W5.4 (CI 42007060565);
  - W6.10 (journeys 41972261935), with J2.7 since walked on staging (42163941604). The register's W6.10 row still calls J2.7 blocked; that is stale.
