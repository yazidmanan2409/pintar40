# PINTAR 4.0: status report (5 Nov 2026)

**Branch:** `claude/awesome-rubin-bqxp6p` at `715f6f7d` · **`main`:** `34120759` (Batch 5, PR #8, 4 Nov) · **Staging:**
migration 193, Batch 5 · **Production:** not touched in 4.0.

**Sources:**
- the open work register `C-OPEN-WORK-REGISTER-2026-11-02.md` (101 rows);
- the batch completion reports;
- `daisy-design-completion/06-ENGINEERING-ITEMS-FROM-DESIGN.md`;
- `F-OWNER-DECISIONS-REQUIRED-2026-11-02.md`;
- `retrospektif/03-LINTASAN-KEPUTUSAN.md` (K1–K7);
- `DECISIONS.md` up to D-190.

> **A finding first:** the register's status column lags the work for about 30 rows that Batches 2 and 3 delivered.
> Examples: W3.1–W3.4 and W1.1–W1.14 are still marked NOT STARTED, but `batch-2/01` and `batch-3/01` record them DONE
> with tests. This report uses the batch reports. Bringing those rows up to date is one small edit, not a new audit.

---

## 1 · Where we are, in one paragraph

**On staging:**
- Batches 1–5 are merged to `main` and promoted to staging (193 migrations).
- Verified on staging: identity, administration, transfers, reports, certificates, integrity review and the tour.

**On the development branch, 161 commits ahead of `main`, not yet merged:**
- Batch 6: the certificate, Digital Card and print sheets.
- Daisy's design-completion builds: the integrated navigation, the Konfigurasi split, the identity-email frames.
- The retrospective's corrections, with E-RB-1…10 closed.
- Three new migrations:
  - 194, the D-183 exposure flag;
  - 195, the cycle order (W6.10);
  - 196, W2.17's people picker.
- P-2's email restriction.
- W5.4's security re-run and the Next.js security upgrade.

**Verification:** the full selftest passes locally (843 rows); CI and journeys are running on the head. A
consolidated staging promotion proposal is written and its rollback is tested. It waits for the owner's P-1
authorisation.

**What 4.0 still needs:**
- the Batch 8 proof work (performance, the 50-student test, the release checklist, assistive technology);
- the external words and designs (Dr Gladys, Daisy);
- the owner's and counsel's Batch 9–10 release gates (capacity, recovery, legal, production mail, DNS).

---

## 2 · What is done

### 2.1 Promoted to staging and verified (Batches 1–5)

| Area | Items |
|---|---|
| Platform | W0.2 CI on the new runner image; W0.4 accessibility harness; W0.5 secret scan of the whole history; W0.1 the public-repository consequences |
| Studio and content (Batch 3) | W1.1 J1Terbit; W1.3 Aturan Asesmen; W1.4 fewer presses to release; W1.5 question check before lock; W1.6 send back to the author; W1.7 home cards; W1.8 review history; W1.9 wording; W1.10 example workbook; W1.11 Question Bank (F-7); W1.12; W1.13 atomic step; W1.14 every Studio page on the design rows |
| Identity and administration (Batch 4) | W2.1 correct an email; W2.2 a name; W2.3 a username; W2.8 profile photo; W2.9 «Laporan saya»; W2.15 transfers by name; W2.19 email operational truth; W3.5 roster table; W3.7 Pendataan / Aktivasi |
| Reports and learning (Batch 5) | W2.5 certificate revocation; W2.6 briefings; W2.7 integrity review; W2.10 paged platform lists; W2.12; W2.16 educator as learner; W2.18 struggling objectives; W3.9 Pimpinan; W3.10 learner residue; W3.13 Peragaan band; W3.15 tour |
| Shell and primitives (Batch 2) | W3.1 skip link and titles; W3.2 empty states; W3.3 primitives; W3.4 Table / Collection; W3.14 idle warning |
| Teaching | W2.4 Uji Cepat score; W3.11 J5 Jendela; W3.17 Mengajar at 320 px; W3.18 the 08 rows |
| Trust | W5.1 CR-91 (class cards for learners only) |
| Proof | W6.1 universal rules as rule-level tests; W6.3 Level 3 coverage. W6.5 Studio end to end and W6.7 Uji Cepat at Level 3 were proven locally; staging was not run |

### 2.2 Built and verified on the branch, waiting for promotion

| Item | What it is | Evidence |
|---|---|---|
| W3.19 | The certificate as designed: one A4 page, the institution mark | Batch 6 report |
| W3.20 (card) | The Digital Card, front and back, at real size in print | Batch 6 report |
| W3.22 | A4 print of every surface, walked in a browser (in CI's journeys) | `audit/b6-cetak.mjs` |
| W3.6 / B1 | Konfigurasi split into an index and section pages, with the old links kept | E-B1-1, E-B1-4, E-B1-5 |
| W3.12 / W3.16 (E1, E2) | Integrated navigation: rail at 1024–1279 px, collapse, context control, drawer | E-E1-1, E-E1-2 walks |
| W3.20 (emails) / D1 | Identity-email frames, rendered from the real templates | D1E-K01 |
| E-RB-1…10 | The retrospective's ten reverse-reconciliation items | all CLOSED (D-181) |
| D-183 / E-K6-3 | Exposed chapters can never give a real verdict (migration 194) | refusal tests red, then green |
| W6.10 | Browser walks for ten clauses; the cycle order held by the database (migration 195) | F29-S01 |
| P-2 (D-187) | Outside production, email goes only to PINTAR's own and test addresses | P2-PENERIMA-01 |
| **W2.17** (5 Nov) | People pickers that work at 10× staging's enrolments (migration 196) | W217-SKALA-01, F30-S01 |
| **W5.4** (5 Nov) | Security suite on the release candidate; Next.js 16.3.5 → 16.4.5 (a critical advisory); production dependencies at 0 vulnerabilities | `batch-8/evidence/w54-keamanan.md` |
| W6.4 (part) | The crawl now checks clipping as well as overflow, and the 1024 px rail | 82e80117, 30deb670; the run of record is still to do |
| W9.9 | Configuration reconstruction rehearsal | implemented |

**The staging promotion package is ready:** `batch-8/02-STAGING-PROMOTION-PROPOSAL.md`, plus
`ROLLBACK-194-195.sql` (now also covering 196). The rollback was tested from 193, 194-only, 195 and 196.

---

## 3 · What is open

### 3.1 Engineering work that is not blocked (Batch 8 onward): the next things I do

| Order | Item | What it takes |
|---|---|---|
| 1 | Confirm CI and journeys on `715f6f7d` | a check-in is scheduled at 10:32 UTC |
| 2 | **W6.4** the crawl run of record (clipping, axe, 1024–1279 px) | re-run; the last run was broken when I stopped the app server mid-crawl |
| 3 | **W6.2** U-PERF re-measured after L3 and the shell (≤ 3 s first screen) | local and journey timing |
| 4 | **W6.8** the 50-student test on the current candidate | the real-app load walk |
| 5 | **W9.19** the efficiency items (Auth round trip, /pimpinan cache, prefetch) | in progress |
| 6 | **W6.12** assistive technology: the 200 % zoom, colour-vision and keyboard parts | the NVDA and TalkBack parts need a real device run |
| 7 | **W9.18** release mechanics (`RELEASE_SHA` in both deploy workflows; Node 20 actions) | workflow edits |
| 8 | **W9.12** recovery readiness after a logical restore; **W9.14** the staff transition and retiring the magic link | rehearsals |
| 9 | **W6.9** release checklist v2.8, stale PASS rows re-proved | last, after 2–8 |
| — | **W2.13** UX-09 «nomor induk»; **W2.14** «ditugaskan» residue; **W4.3 / W4.4** copy review | the build is ready; they wait on the words (§3.3) |

### 3.2 Waiting on the owner (decisions and actions)

**K1–K7 are closed for development (D-191, 5 Nov).** What still needs an outside party is tracked on its own item
(§3.3, E-K6-1 and E-K6-2 for real content). K4 and F-11 are closed by D-192: the wordmark is text, Arial and #075056, no font
or asset to buy.

| # | Decision or action | What it unblocks | Where |
|---|---|---|---|
| **P-1** | **Authorise the consolidated staging promotion** (merge, migrations 194–196, deploy) | Batch 6 onward reaching staging; W6.5 on staging; staging walks | `batch-8/02-STAGING-PROMOTION-PROPOSAL.md` |
| W5.3 | Branch protection on `main`: the register still says BLOCKED, though Batches 1–5 were merged through protected PRs. **Confirm it is in force** | the record | register W5.3 |
| F-5 | How production reaches migration 162, then the candidate | the production upgrade (W9.10) | F-5 |
| F-6 | Name the second production SYSTEM_ADMIN and custodian B | J1.2, J1.5, W6.6 (the PINTAR-standard chain), W9.7 | F-6 |
| F-9 | A production school-founding path | W2.20 | F-9 |
| F-14 | The #150 owner actions (O2 token, O3, O5–O7 escrow). **Note:** D-190 stopped the backup project, so **staging Storage files have no independent backup**; O2 is deferred for staging only (D-188) | W9.1, W9.5, W9.6 | F-14 |
| F-15 | Capacity: first deployment size (Q3), then compute tier (Q2), then Auth IP forwarding | W9.3, W9.4 | F-15 |
| F-17 | Support tiers and same-day answers; pilot mail capacity; separate staging and production mailboxes | W9.16, W9.17 | F-17 |
| F-18 | The production upgrade rehearsal method (restore a production backup to a scratch project, billable) | W9.10 | F-18 |
| W9.13 / W9.15 | Production SMTP password, Auth settings, SPF/DKIM/DMARC; DNS `verifikasi.pintarselalu.com` | production email and verification | register |
| F-19 / W1.15 | Dr Gladys's Studio notes (where and as whom she tried) | closes D-141(b) | F-19 |
| F-20 | The owner's own walk with Lana's packages | J9.8 | F-20 |
| W0.3 | Lift the staging freeze (D-140(d)/D-141(a)) | the record; promotions already go through per-batch GOs | register |
| W9.8 | Production watch on, at release | release | register |

### 3.3 Waiting on others

| Who | What | Blocks |
|---|---|---|
| **Dr Gladys** (approvals explicitly required, D-191) | The question pack: Part A A1–A10, Part B B1–B38 (B38, the «Cari orang» words, added today); X12 «paket / kursus / course» | E-B1-2, E-B1-3, E-A1-2, E-A4-1, E-A5-1, W2.13 (UX-09), W2.14, W4.2, W4.3. Her walkthrough comes after the internal gates (D-186) |
| **Daisy** | W1.2 the question-review layout; W3.8 the report body and its A4 composition (C1); W3.21 republishing the Design System page; the E2 chooser's words with Dr Gladys | W1.2, W3.8 (partial), W3.21 |
| **Counsel** (F-16) | UU PDP, PSE registration, controller and processor, retention, parental consent; content rights | **W9.11, the legal gate before any real school**; K6 residency |

---

## 4 · What is left for a complete 4.0

1. **Finish Batch 8's proofs:** the items in §3.1. All are engineering work and unblocked.
2. **Promote the branch to staging** (P-1), then:
   - walk on staging what was proven only locally (W6.5, W6.7, Batch 6, the navigation, the Konfigurasi split);
   - re-run the journeys against staging.
3. **The words and the remaining designs land** (Dr Gladys, Daisy). Each lands as copy keys in `src/lib/hle.ts` plus the
   tests already waiting for it; the screens are built.
4. **Internal acceptance gates pass:** the 138 acceptance lines (D-181), with K1–K7 ruled for development (D-191). Then Dr
   Gladys's walkthrough.
5. **Batch 9–10, release readiness:**
   - capacity (F-15);
   - recovery: backups, escrow, second administrators, break-glass (F-6, F-14);
   - the production upgrade rehearsal (F-5, F-18);
   - production email and DNS;
   - support;
   - **the legal gate** (F-16);
   - the release checklist v2.8;
   - the production watch.
6. **Production release:** a separate owner authorisation, after all of the above.

**Critical path:** P-1, then Dr Gladys's required approvals, then counsel (F-16), then capacity and recovery
(F-15, F-6, F-14). Engineering is not the bottleneck: what is left to build is small and unblocked; what is left to
decide is not.

---

## 5 · Risks to know

- **Staging Storage has no independent backup** (D-190 stopped the project). The database has Supabase's own backups;
  uploaded files do not.
- **The branch is 161 commits and three migrations ahead of staging.** The longer P-1 waits, the larger the single
  promotion. The rollback is tested; the risk is the size of the change, not an untested path.
- **Real assessment content stays blocked** until the real-content safeguards are verified (D-191 K6; E-K6-1, E-K6-2). The exposure flag (D-183) keeps the exposed chapters
  from ever giving a real verdict, but there is no regenerated content yet.
- **Dependency hygiene:** fixed today (Next.js critical). 8 moderate advisories remain in the lint tooling only, which
  never ships.
- **The local test environment is unstable** (the Docker daemon dies). CI is the run of record; local runs are
  re-run when the stack dies, and the report says so.

---

## 6 · Today's milestones (5 Nov)

| Commit | What |
|---|---|
| `30deb670` | W6.4: the narrow bar's page name wraps instead of being cut off |
| `c256cd69` | **W2.17**: people pickers at 10× scale: a read that timed out now answers in about 160 ms; migration 196 |
| `715f6f7d` | **W5.4**: the security suite on the candidate (843/0, launch readiness 24/24); Next.js 16.4.5 |
| (earlier today) | D-187 P-2; D-188 to D-190, the backup project started, then stopped; the promotion proposal; the rollback tested from every state; the 96-sitting correction |
