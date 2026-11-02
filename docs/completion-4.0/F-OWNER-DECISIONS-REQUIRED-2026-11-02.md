# F · Owner decisions and external dependencies (2 Nov 2026)

These are only items the approved decisions do not already settle. Each gives a recommendation and the consequence of the options.

**Contradictions resolved by authority, not asked:**
- **R.7 gate order:** settled by the mandate, D-142.
- **UX-19 verbs:** C2 under D-135(d) stands.
- **J2.12 assisted reset by a school admin:** D-101(1).
- **J1.3 and J3.1 landing:** the chooser, D-132 C3.
- **#150 B3/B4/B8/B9 required:** D-106 supersedes D-105(d).
- **REL-09 escrow:** D-107 D8.

Each is recorded in the register.

**Urgency:**
- **NOW** — blocks batch 0, or is a security exposure.
- **SOON** — blocks batches 1–5.
- **TRACK** — long lead; start now, needed by batches 9–10.

---

## NOW

| # | Decision | Recommendation | Consequence |
|---|---|---|---|
| **F-1** | **Repository public: DECIDED by the owner, 2 Nov (D-143).** What remains is its consequences | (a) Branch protection for `main` (W5.3) matters more on a public repo. (b) The answer keys and content sources already in the repo and its history are public, so F-4 now decides what happens to them. (c) The ministry-derived material is public, so content rights (Q5, F-16) become more urgent. (d) From now on nothing secret, keyed or personal is committed (W0.1 guard) | GitHub-hosted runner minutes are free for public repositories (assumption to confirm in billing). The CI allowance (F-2) is then a governance limit rather than a cost |
| **F-2** | **Approve this plan** (E, as corrected in Batch 0) and grant a **CI allowance** | Approve batches 1–11 as sequenced, with one owner GO per batch start (no automatic batch). A runner-minute allowance per E's measured cost (governance only: GitHub bills 0 ms on this public repository, verified 2 Nov) | A smaller allowance means fewer verification cycles, not less verification |
| **F-3** | **CR-91 · the class-card trust boundary.** Today any person can be activated with a class card + short PIN, including staff, and a card session gets the person's full capabilities (`authorize_account_activation`) | **Option A: class cards are for learners only.** The database refuses a card for anyone with a staff role and refuses a staff role for a card account. Educators who also learn (J9) use their email account | B (staff capabilities withheld in card sessions) is more code and relies on a session claim. C (accept) is not recommended: a 10-digit card and a short PIN would authenticate staff power |
| **F-4** | **Answer keys and content sources** (43 tracked files with real keys incl. two copies in `audit/fixtures/`; 4 more on a public branch). **Public since D-143; removing them does not make them confidential again** | **The full plan is `batch-0/05-PHASE-0-CORRECTIONS.md` §2.** Decide F-4a … F-4f: private store and access list; Claude to replace the real-chapter fixtures and remove the exposed keyed files in batch 1; which chapters are used for real assessment; regenerate their 240 Pemetaan Awal / Cek penguasaan items before real use; **no history rewrite**; keep or delete the demo branch | Without it, batch 1 cannot close W5.2, and real schools would sit tests whose keys are public |

## SOON

| # | Decision | Recommendation | Consequence |
|---|---|---|---|
| **F-5** | **How production reaches migration 162 (restated 2 Nov, Batch 0).** A database at exactly 162 runs neither the production app (four breakages) nor the candidate (needs 163–177): `batch-0/07-MIGRATION-162-BRIEF.md` | **Upgrade production to the full candidate, database and app together, rehearsed on a restored copy (R-1 … R-5), once.** Recommended placement: **E option B**, in batch 11 on the accepted candidate, with #150's production-only criteria at Gate 6. Confirm the #150 PASS criteria (`docs/recovery/CLOSURE-PLAN-150.md`) | Option A (a separate technical upgrade in batch 9) changes production twice and before internal acceptance. «162 alone with the old app» is not viable |
| **F-6** | **Name the second production SYSTEM_ADMIN and custodian B** (they may be the same trusted person) | Name them now: one is needed for J1.2, J1.5 (the second approver of PINTAR content), J1.7 break-glass, #150 B5 escrow (R2) and B6 | Without them: J1.5, J4.11, W6.6 cannot complete; #150 cannot pass; no release |
| **F-7** | **Who the Question Bank is for.** QN5 defines the bank as browse / filter / review with key and reason, but as built it is gated as Question Health (heads of department and admins); teachers who author cannot open it | **Teachers with CAN_DRAFT can browse their school's bank (QN5)**; Question Health signals stay head-of-department-only (J4.9) | If not ruled: J4.8 stays E and cannot be closed. **RULED 2 Nov (D-150): the recommendation, as written.** |
| **F-8** | **Username correction (CR-15).** The register said «no screen needed», but REL-02 requires zero operator steps, and the name correction (CR-14) does get a screen | **Build a platform-admin screen** (audited, reason required), beside name correction | If not: an operator SQL step remains, and REL-02 cannot pass |
| **F-9** | **Founding a school on production (J1.1).** The audited founding workflow refuses production, and no production path exists | **Extend the founding workflow to production**, behind the production environment's required reviewer and an owner-approved run, audited with the owner's PINTAR identity | Without it: the first real school would need hand-written production SQL, which J1.1 forbids |
| **F-10** | **Transfers between schools (J3.10).** A school admin cannot see other schools, so the destination cannot be chosen by name | **A minimal directory:** a school admin may search active schools by exact name or code (name and code only), audited; the receiving school authorises | If not: transfers stay platform-admin-assisted |
| **F-11** | **Font licence and physical print proofs** (Helvetica Neue 65 Medium for the wordmark; A4 at 100 %, QR scans, the 0.75 mm gold line) | Buy the licence and run the print proofs now. They are the only blockers of batch 6 | Without them: the certificate, card, emails and wordmark cannot be completed; J8.4 stays blocked |
| **F-12** | **Commission Daisy** for the five designs that have no approved composition: (1) the Studio question-review layout; (2) the report pages; (3) the `/` chooser and context control; (4) Konfigurasi's split or index; (5) J3 navigation restated under L3 (or accept OP-1/OP-2 as deviations) | Commission all five now, to arrive before batch 3 | Without them: batches 3–5 stall at their composition step; inventing a design is not allowed (mandate §7) |
| **F-13** | **Dr Gladys's terminology, in writing:** her universal-term proposal (which reverses v1 rows), OP-6, OP-7, the six context words, the L4 §4 list | Send `batch-0/08-TERMINOLOGY-BRIEF.md` §5 with the existing questions as **one** written request. Keep v1 in force until she answers (D-134). Adopt universal words as wording only, not as a broader institution model | Without it: placeholders stay; X.4 cannot close. Adopting the words as a broader model would be new scope (outside D-142) |

## TRACK (long lead; start now)

| # | Decision or action | Recommendation | Consequence |
|---|---|---|---|
| **F-14** | **#150 owner actions:** O2 (create the scoped token C1, about 15 min); staging pooler values; O3 (AWS account, S3 Singapore with Object Lock); O5 (Storage keys); O6 (C2); O7 (escrow); O8 (billable restore rehearsal) | Start O2 and the pooler values this week. **B3 is the first gate:** every production migration is refused until it exists | Every week of delay moves the release by a week |
| **F-15** | **Capacity:** first real deployment size (Q3), then compute tier (Q2), then Auth IP forwarding and its key (A8) | **The first deployment is the educator pilot** (≤ 50 at once, matching D-089(d)); L1 at 1,000 then gates the first school cohort | Choosing a school cohort first means a tier upgrade and an L1 pass before the release |
| **F-16** | **Legal gate:** counsel for UU PDP, PSE registration, controller/processor, retention, **parental consent**; content rights (Q5); AI-tooling policy (Q6); commercial answers (Q19); privacy line on backup retention (O11) | Engage counsel now; this is likely the longest lead item | No real student data until it closes (D-117(m)) |
| **F-17** | **Support and mail:** name tier 1 and tier 2 support with a same-day answer (CR-71); mail capacity for the pilot; whether staging and production share the `noreply@` mailbox (CR-73) | Name them with F-6; separate the mailboxes before the pilot | REL-13 and R.6 stay open |
| **F-18** | **Production upgrade rehearsal method (P1)** | Restore production's backup to a temporary project (billable; tests the real drift), rather than rebuild locally | The local rebuild is cheaper but misses production's actual state, which has never been read since 23 Sep |
| **F-19** | **Dr Gladys's Studio notes** (where and as whom she tried Studio) | Ask her or Yazid for the address and screenshots | Without them: D-141(b) stays an unverified observation |
| **F-20** | **The owner's own walk with Lana's packages (C-13, J9.8)** | Schedule during batch 8 | J9.8 stays blocked |

## External dependencies (not decisions)

- **Daisy:** five designs (F-12).
- **Dr Gladys:** written terminology (F-13); the final walkthrough after Gate 6.
- **Counsel and regulators:** F-16.
- **Supabase:** the scoped token's isolation (public alpha); billable restores; the compute tier; the `supautils` ticket.
- **AWS:** account and Object Lock bucket.
- **Namecheap:** DNS and the mailbox.
- **GitHub:** the Ubuntu 26 image.
- **People:** custodian B, the second admins, the participants in internal acceptance, and 3–5 real educators.

## Already decided (D-135: not to be reopened)

- #150 B4/B5/B8/B9 required (D-106).
- D1–D8 (D-107).
- PITR deferred (D-103).
- No R1-only escrow (D-109(c)).
- Media out of the first phases (D-050).
- The briefings surface hidden (D-120 QN4).
- Window changes after go-live (QN3).
- The second attempt held (D-112(b)).
- The Uji Cepat score layout (D-120 Q8).
- Separation of duties on integrity (D-124).
