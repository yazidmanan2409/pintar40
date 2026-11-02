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
| **F-2** | **Approve this plan** (batch order E), lift the staging freeze, and grant a **CI allowance of about 2,800 minutes** | Approve batches 0–11 as sequenced. Routine engineering then proceeds within it without per-step authorisation (mandate §5). Push to main and production changes still need explicit approval | Without an allowance, nothing can be verified (224 minutes remain). A smaller allowance means fewer verification cycles, not less verification |
| **F-3** | **CR-91 · the class-card trust boundary.** Today any person can be activated with a class card + short PIN, including staff, and a card session gets the person's full capabilities (`authorize_account_activation`) | **Option A: class cards are for learners only.** The database refuses a card for anyone with a staff role and refuses a staff role for a card account. Educators who also learn (J9) use their email account | B (staff capabilities withheld in card sessions) is more code and relies on a session claim. C (accept) is not recommended: a 10-digit card and a short PIN would authenticate staff power |
| **F-4** | **Answer keys and content sources in the repository** (`docs/onboarding/konten/` and `contoh/`: 20 packages, 619 keys; ministry-derived). **They are public now (D-143)** | **In batch 1:** move content sources and keyed builds to a separate private store with a named access list; change L4-C01 so it no longer needs a keyed build in the repo. **Before real schools:** regenerate the Pemetaan Awal and Uji Penguasaan items for any chapter used for real assessment | Keeping them in a private repo is acceptable only if every reader is trusted content staff (option 3). A history purge helps only if no copy was taken while public |

## SOON

| # | Decision | Recommendation | Consequence |
|---|---|---|---|
| **F-5** | **How migration 162 reaches production (Q15) and the #150 PASS criteria.** Every production backup needs migration 162 (`pintar_backup`), and migrations apply in order. So #150 PASS needs a production database upgrade **before** PRODUCTION READY. Today the plan says «162 at the release», which is circular | **Separate two steps:** (1) an owner-approved **technical upgrade** of production (database and app, no new users; G6's native ≤ 26 h backup as the restore point, after the rehearsal); (2) **PRODUCTION READY** for real schools, gated on #150 PASS. **Confirm the #150 PASS criteria** as proposed in `docs/recovery/CLOSURE-PLAN-150.md` | If refused: #150 cannot pass, unless 162 is applied out of order, which breaks the in-order migration rule |
| **F-6** | **Name the second production SYSTEM_ADMIN and custodian B** (they may be the same trusted person) | Name them now: one is needed for J1.2, J1.5 (the second approver of PINTAR content), J1.7 break-glass, #150 B5 escrow (R2) and B6 | Without them: J1.5, J4.11, W6.6 cannot complete; #150 cannot pass; no release |
| **F-7** | **Who the Question Bank is for.** QN5 defines the bank as browse / filter / review with key and reason, but as built it is gated as Question Health (heads of department and admins); teachers who author cannot open it | **Teachers with CAN_DRAFT can browse their school's bank (QN5)**; Question Health signals stay head-of-department-only (J4.9) | If not ruled: J4.8 stays E and cannot be closed |
| **F-8** | **Username correction (CR-15).** The register said «no screen needed», but REL-02 requires zero operator steps, and the name correction (CR-14) does get a screen | **Build a platform-admin screen** (audited, reason required), beside name correction | If not: an operator SQL step remains, and REL-02 cannot pass |
| **F-9** | **Founding a school on production (J1.1).** The audited founding workflow refuses production, and no production path exists | **Extend the founding workflow to production**, behind the production environment's required reviewer and an owner-approved run, audited with the owner's PINTAR identity | Without it: the first real school would need hand-written production SQL, which J1.1 forbids |
| **F-10** | **Transfers between schools (J3.10).** A school admin cannot see other schools, so the destination cannot be chosen by name | **A minimal directory:** a school admin may search active schools by exact name or code (name and code only), audited; the receiving school authorises | If not: transfers stay platform-admin-assisted |
| **F-11** | **Font licence and physical print proofs** (Helvetica Neue 65 Medium for the wordmark; A4 at 100 %, QR scans, the 0.75 mm gold line) | Buy the licence and run the print proofs now. They are the only blockers of batch 6 | Without them: the certificate, card, emails and wordmark cannot be completed; J8.4 stays blocked |
| **F-12** | **Commission Daisy** for the five designs that have no approved composition: (1) the Studio question-review layout; (2) the report pages; (3) the `/` chooser and context control; (4) Konfigurasi's split or index; (5) J3 navigation restated under L3 (or accept OP-1/OP-2 as deviations) | Commission all five now, to arrive before batch 3 | Without them: batches 3–5 stall at their composition step; inventing a design is not allowed (mandate §7) |
| **F-13** | **Dr Gladys's terminology, in writing:** OP-6 («penilaian» strings), OP-7 (Bank Soal difficulty), the six context words, the L4 §4 list | Send her the list now as a written question, not a walkthrough. Her time is used for terminology only, which is her domain | Without it: those strings stay as placeholders, or the context control draws nothing, and X.4 cannot close |

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
