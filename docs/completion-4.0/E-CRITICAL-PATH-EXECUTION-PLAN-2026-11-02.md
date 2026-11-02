# E · Critical-path execution plan (proposed, for owner approval) · 2 Nov 2026

Batches are ordered by dependency and risk (`D-DEPENDENCY-MAP`), not by module. Each batch closes named register items (`C-OPEN-WORK-REGISTER`) and named matrix lines (`B-FEATURE-COMPLETENESS-MATRIX`).

**Every batch passes the same exit routine:**
1. Local: suite, `tsc`, eslint, crawl at 320 and 1280 px with the accessibility harness, journeys.
2. CI and journeys on the batch head.
3. The owner's push approval to main (one per batch).
4. Staging deploy, then the facts run (app = head, migrations = main's).
5. A Golden School walk on a fresh school.
6. An independent review of the running application (screenshots + walk).
7. The batch report (mandate §13).

**Rollback:**
- **Application-only batches** roll back by redeploying the previous commit.
- **Batches with migrations** have no tested reversal. A migration is not claimed reversible. Recovery is restore-forward: a corrective migration, rehearsed on a clone first.

---

## Batch 0 · Restart the platform (½–1 day)

| | |
|---|---|
| **Closes** | W0.2 CI on the new runner image, W0.4 accessibility harness, W0.5 history secret scan; facts and CI re-established on current code |
| **Why first** | Nothing can be verified until CI runs on GitHub's new image (Ubuntu 26 and Node 24 since 19 Oct; no build since). The accessibility harness must exist before any screen work, or later batches cannot be held to the accessibility gate |
| **Needs first** | Owner: plan approval, CI allowance, freeze lifted |
| **Enables** | Every later batch |
| **Retires** | CI-platform risk; the unknown exposure of the public history |
| **Parallel** | The owner track (F list); Daisy's designs; Dr Gladys's written words |
| **Exit gate** | CI 18/18 and journeys green on main's current code on the new image (or a pinned image, recorded); axe and keyboard results recorded as a baseline (not yet required clean); secret scan clean or findings escalated |

## Batch 1 · Data model and security (3–4 days)

| | |
|---|---|
| **Closes** | W1.6 data part (send back: a new content-status transition), W1.8 data part (reviewer and approver in the history), W1.13 (content step atomic), W4.1 (v1 wording held in the database; finding locations in words), **W5.1 CR-91** (database enforcement per F-3), **W5.2** answer-key sources out of the repository (per F-4) |
| **Why here** | Every one changes the database or a security boundary that later screens and tests rely on. Doing them together gives one migration release and one input to the production rehearsal, instead of re-proving screens built on the old states. CR-91 is a security hold, and the mandate treats security first |
| **Needs first** | Batch 0; rulings F-3 and F-4 |
| **Enables** | Batches 3, 4 and 5; the production upgrade rehearsal (its migration set is fixed earlier) |
| **Retires** | The open security hold; the dead-end review state; the exposure of keys in the repository from here on |
| **Parallel** | Batch 2 can start once these migrations are merged |
| **Remains blocked** | Nothing in this batch if F-3 and F-4 are ruled |
| **Exit gate** | Each change red on the old code and green on the new (tests named in the batch report); migrations applied to staging and counted by facts; the security suite green; no screen yet depends on them |

## Batch 2 · Shared design foundations (4–5 days)

| | |
|---|---|
| **Closes** | W3.1 (skip link, page titles), W3.2 (empty state), W3.3 (FileField, date helper with WIB and echo, select chevron, 44 px Radio/Checkbox rows, Badge, Alert icon, disabled reason, log-out icon, tab icon, Disclosure chevrons), W3.4 (Table/Collection), W3.5 components (account menu, Dialog), W3.14 (J7 idle warning). Closes RV-5 |
| **Why here** | Every J composition and almost every open screen uses these. Built once and used everywhere, they avoid rework in batches 3–6 |
| **Needs first** | Batch 0 (harness); batch 1 merged (no conflict in the shells) |
| **Enables** | Batches 3–6 |
| **Retires** | The cross-cutting accessibility gaps (bypass blocks, page titles); RV-5 |
| **Parallel** | Daisy finishing the five designs; owner track |
| **Exit gate** | Each component under a guard test red on the old CSS; axe clean on the shells; keyboard walk of the shell and the account menu; crawl clean at 320/1024/1280 px |

## Batch 3 · Studio and teaching: the content-to-learner chain (6–8 days)

| | |
|---|---|
| **Closes** | W1.1–W1.5, W1.7, W1.9–W1.12, W1.14 (Studio complete, incl. J1Terbit and Daisy's question-review layout); W1.6 and W1.8 screens; W2.4 Uji Cepat score; W3.11 (J5 Jendela; J1 part two); W3.17; Studio and Mengajar 08 rows (W3.18). **Evidence:** W6.5 Studio end-to-end proof; W6.7 Uji Cepat at Level 3. Matrix lines J4.1, J4.3–J4.6, J4.10, J4.12, J5.4–J5.7 |
| **Why here** | The most open approved functionality is here. It feeds learning (J6) and certificates (J8), and the mandate names its end-to-end proof. Batch 1 has fixed its data model and batch 2 its components |
| **Needs first** | Batches 1–2; **Daisy's question-review layout (W1.2)**; F-7 for the bank |
| **Enables** | The Studio proof, then the certificate chain on new content; Dr Gladys's eventual Studio journey |
| **Retires** | The largest functional gap; the dead-end review; the untested teacher-author path |
| **Parallel** | Daisy on the report, Konfigurasi and chooser designs; batch 6 if F-11 is done |
| **Remains blocked** | W1.11 if F-7 is not ruled |
| **Exit gate** | W6.5 passes on staging: a never-imported chapter authored by a Guru, a failed upload fixed, one rejection and resubmission, approval by a head of department, publication by the admin, assignment, and the learner opening it. W6.7 passes. J1Terbit and J5 screens match their compositions (side-by-side in the independent review). Matrix lines above at VERIFIED with design complete |

## Batch 4 · Administration and identity (5–7 days)

| | |
|---|---|
| **Closes** | W2.1 email correction, W2.2 name correction, W2.3 username correction (per F-8), W2.8 profile photo, W2.9 «Laporan saya» link, W2.10 platform paging, W2.13 (admin part), W2.15 transfers (per F-10), W2.19 stuck sends; W3.5 J2 screens (account menu, roster Table); W3.6 Konfigurasi (Daisy's design); W3.7 Pendataan/Aktivasi. Matrix: J1.9, J2.4, J2.17, J2.21, J3.10, J8.8, J10.1, X.9 |
| **Why here** | These need the batch 2 components (menu, Dialog, Collection, FileField). They retire every «SQL-only» operation (X.9, REL-02 zero operator steps) |
| **Needs first** | Batch 2; Daisy's Konfigurasi design; F-8, F-10 |
| **Enables** | REL-02; the administration acceptance scenario |
| **Retires** | Operator dependence |
| **Parallel** | Batch 5 can overlap on different surfaces |
| **Exit gate** | Every administration action in the matrix done through screens in a browser walk, with no SQL; audit rows asserted; Konfigurasi matches its approved design |

## Batch 5 · Evidence, reports, integrity, learner (5–6 days)

| | |
|---|---|
| **Closes** | W3.8 report pages (Daisy's design), W3.9 Pimpinan, W3.10 learner, W3.12 J3 navigation (Daisy restates it or the owner accepts the deviation), W3.13 J6 band, W3.15 tour, W3.16 chooser (Daisy + words when available); W2.5 revocation, W2.6 briefings copy, W2.7 integrity outcome, W2.12, W2.13 (learner/teacher part), W2.16, W2.18. Matrix: J5.13, J6.5, J7.2–J7.6, J8.5, X.5, X.7 |
| **Why here** | These need batch 2 components and Daisy's report and chooser designs, which run in parallel during batches 0–3 |
| **Needs first** | Batch 2; Daisy's designs |
| **Enables** | The reporting and integrity acceptance scenarios |
| **Exit gate** | Report pages name class, school and period, in the shell, printable; integrity referrer sees the outcome in a browser walk; revocation walked; compositions J3, J4 and J6 matched |

## Batch 6 · Certificate, card, emails, wordmark (3–4 days; when F-11 is done)

| | |
|---|---|
| **Closes** | W3.19 (CR-03/04), W3.20 (CR-21, CR-22, OP-3), W3.21, W3.22. Matrix: J2.15, J2.16 (final), J8.4 |
| **Why here** | It is independent of batches 3–5 but blocked by the owner's font licence and physical print proofs |
| **Exit gate** | A4 print at 100 % matches the frozen design; QR scans on two phones; emails match DAISY-37; wordmark in shell and emails |

## Batch 7 · Words and accessibility (3–4 days)

| | |
|---|---|
| **Closes** | W4.2 applied (Dr Gladys's written decisions), W4.3, W2.14, W6.12 (NVDA, TalkBack, 200 % zoom, colour vision, keyboard on real screens) |
| **Why here** | The words arrive from Dr Gladys in writing during batches 0–6. The screen-reader pass is only meaningful once the screens are final |
| **Exit gate** | No string awaiting a word; NVDA and TalkBack scripts pass on each journey's key screens; zoom and keyboard checks recorded |

## Batch 8 · Full regression and evidence: Gates 1–3 (4–5 days)

| | |
|---|---|
| **Closes** | W6.1 rule-level tests (CR-59), W6.2 U-PERF (CR-58), W6.3 Level 3 additions (CR-30, J9, rollover, move), W6.6 PINTAR-standard chain (needs the second platform admin), W6.8 50-student test, W6.9 checklist v2.8, W6.10 browser walks, W2.17 FD-4 at scale, W5.4 security suite on the candidate, W9.19 efficiency |
| **Why here** | Only after all functional and design work is final, so the evidence holds |
| **Exit gate** | **Gate 1** (every approved capability implemented and verified), **Gate 2** (design complete, accessibility passed), **Gate 3** (every journey class in mandate §8 green across Chromium, Firefox and WebKit with fresh data, success and failure paths) — see `G-FINAL-ACCEPTANCE-MATRIX` |

## Batch 9 · Operational readiness: Gate 4 (engineering 4–6 days; owner lead time weeks; starts NOW in parallel)

| | |
|---|---|
| **Closes** | W9.1–W9.7, W9.9–W9.12, W9.16, W9.17 |
| **Order inside it** | C1 token → G6 reads production backups → production upgrade rehearsal on a restored copy of production (W9.10, R-1 … R-5 of `batch-0/07-MIGRATION-162-BRIEF.md`) → #150 work that does not need production at 162 (R1/R2 custody, AWS, keys, escrow procedure proven on staging). Capacity: tier → forwarding → L1 at the tier on the candidate. Legal gate. Second admins, break-glass. **Where production's upgrade sits is an owner choice (F-5, restated 2 Nov):** **(B, recommended)** one production change only, in batch 11, on the accepted candidate; #150's production-only steps (bundle from production, escrow of it, O8 on it) move from Gate 4 to Gate 6, before Dr Gladys and before real users. **(A)** a separate no-users technical upgrade here, so #150 passes at Gate 4; this is a production change before internal acceptance, and production is changed twice |
| **Why here** | Its engineering parts depend on owner actions with long lead times. It runs alongside batches 1–8 so it does not add to the end |
| **Exit gate (Gate 4)** | #150 PASS by its confirmed criteria (under option B: every criterion that does not need production at 162; the rest at Gate 6); L1 PASS at the chosen tier; CAP-01 burst passes; legal gate closed in writing; CR-91 enforced; accounts and custody named and proven; support tiers named |

## Batch 10 · Staging release candidate and internal human acceptance: Gate 5 (3–4 days + participants)

*Reordered 2 Nov (Batch 0, correction 5): people accept the candidate on staging **before** production is authorised.*

| | |
|---|---|
| **Closes** | The mandate §11 scenarios S-1 … S-16 (G §3) on the frozen candidate, with observers' records; defects fixed and retested within scope |
| **Steps** | Freeze the release candidate (one SHA) → Gates 1–4 green on that SHA → deploy to staging, facts (app = candidate, migrations = candidate's) → unaided scenarios, observed → each defect fixed makes a **new** candidate, re-verified (CI, journeys, facts) and the affected scenarios repeated → **owner GO for production** |
| **Exit gate (Gate 5)** | G §4 Gate 5: every scenario passes unaided on the candidate; matrix B 127/127 ACCEPTED on staging; owner GO recorded |

## Batch 11 · Rehearsed production release and production verification: Gate 6 (3–4 days)

| | |
|---|---|
| **Closes** | W9.8, W9.13–W9.15, W9.18; R.1, R.8 (release part) |
| **Steps** | The mandate §10 list on the **accepted** candidate: exact baseline; rehearsal on a representative copy; compatibility; Auth and mail; account transition and emergency recovery; backup verified; checklist; evidence pack; **owner authorisation of the production change**; deploy; production facts and critical journeys; **the production-applicable acceptance checks repeated** (G §4 Gate 6); monitoring and support on |
| **Exit gate (Gate 6)** | G §4 Gate 6; **explicit owner approval** → then, and only then, Dr Gladys is invited |

---

## Schedule, parallelism and assumptions (validated 2 Nov, Batch 0, correction 3)

### What actually runs in parallel

**Engineering is one lane.** Batches 1–8 are implemented by one engineer (Claude), so they are **sequential** even where E says they «can overlap». Batches 4 and 5 touch different surfaces, which lets them share a verification cycle, not run side by side. The parallelism is **between lanes**:

| Lane | Work | Needed by | Lead time (assumption) |
|---|---|---|---|
| **Engineering** | Batches 1 → 8, then 9 (engineering part), 10, 11 | — | Batch durations as above |
| **Owner: rulings** | F-3, F-4 (before batch 1); F-7, F-8, F-10 (before batches 3–4) | Batch 1 start; batch 3 start | Days, if answered in writing |
| **Owner: repository and environments** | Branch protection (before the first merge); lift the freeze; per-batch push approval | Batch 1 merge | Hours |
| **Daisy** | Five designs (F-12) | **Batch 3 start** (question review); batches 4–5 (Konfigurasi, reports, chooser, J3) | **2–3 weeks from commission** (assumption; not yet commissioned) |
| **Dr Gladys** | Written terminology (F-13, `batch-0/08`) | Batch 7 | 2–4 weeks from the written request (assumption) |
| **Owner: brand** | Font licence + print proofs (F-11) | Batch 6 | 1–2 weeks (assumption) |
| **Owner + Supabase** | C1 token (O2), pooler values; rehearsal project (F-18) | Batch 9 rehearsal | Days for the token; the rehearsal project is billable |
| **Owner + AWS** | Account, S3 Singapore with Object Lock (O3), keys (O5) | Batch 9 escrow | 1–2 weeks |
| **People** | Custodian B, second admins (F-6); support tiers (F-17); acceptance participants | Batch 9; batch 10 | Owner's network; unknown |
| **Counsel** | Legal gate (F-16) | **Before real student data**; Gate 4 | **4–8+ weeks; the longest and least certain** |

### The critical path

```
Week:          1    2    3    4    5    6    7    8    9    10   11   12   13   14
Engineering:  [B1][ B2 ][  B3  ][  B4+B5   ][B6][B7][ B8 ][B9e][  B10  ][ B11 ]
Daisy:         commission ──► designs due before B3 (end of wk 2–3)
Dr Gladys:     written request ─────────────► answers due before B7 (wk 8)
Font/print:    licence + proofs ────────► due before B6 (wk 7)
Owner #150:    O2 token ─► AWS/keys/custody ─────► rehearsal project ─► B9 (wk 10)
Counsel:       engage ─────────────────────────────────────────► closed by Gate 4 (wk 10)
```

**Two paths compete for longest:**
1. **Engineering chain:** batches 1–8 = 33–43 engineering days. At about 4 effective days a week, verification waits and approvals included, that is about **8.5–11 weeks**. Then 9 (engineering part, overlapping), 10 and 11, about **2.5–3 weeks**.
2. **Legal gate**, if it takes longer than about 10 weeks from engagement. It then sets Gate 4 and everything after it.

**Daisy's designs become critical** if they arrive after the end of week 3: every week late moves batch 3, and with it everything after.

**Estimate to Gate 6: about 11–14 weeks from Batch 1 start**, if every external lane starts in week 1. This is the same range as before, now with the assumptions stated.

### Assumptions behind the numbers

1. Batch durations are E's estimates. They are not measured velocity: the repository clone is shallow, and no comparable batch has been timed. **Batch 0** took about 1 working day of engineering, against its ½–1 day estimate.
2. One engineering lane; no batch starts without the owner's GO.
3. **Testing is not shortened.** Every batch runs the full exit routine, including journeys, the Golden School walk once per batch, and the independent review.
4. Per-batch CI cost is measured in Batch 0 (below). It is not a cost constraint (0 ms billed), only a governance one.
5. **Not included:** time to fix what Gate 5 acceptance finds (each fix is a new candidate); time to regenerate the 240 assessment items (F-4d), which is on the path to real schools, not to Gate 6.
6. The production upgrade happens once (F-5 option B). Option A adds a production change and its own rehearsal, about **+1 week**.

## CI and verification resources

- **Per batch:** CI ≈ 70 min + journeys ≈ 45 min + Golden School walk ≈ 50 min + facts ≈ 2 min ≈ **170 min**. Budget **≈ 200 per batch** with one re-run for a root-caused failure.
- **Batches 0–11:** ≈ 12 × 200 = **2,400 min**, plus ≈ 300 for L1 capacity runs, the release rehearsal and the off-platform backup drills. **Ask: an allowance of ≈ 2,800 minutes** (224 remain under D-139).
- **Optimisations already in place and kept:**
  - E1 (main reuses a proven CI);
  - documents-only commits skip CI;
  - local verification before every CI;
  - the Golden School walk once per batch, not per commit.
- **Not to be cut:** journeys, the Golden School walk, the independent review.
- If the allowance is smaller, batches 4 and 5 can share one verification cycle. That is the only safe merge, because they touch different surfaces.
