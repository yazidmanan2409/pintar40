# P-1: staging promotion, the decision needed (5 Nov 2026)

**Decision needed from the owner:** authorise the consolidated staging promotion (P-1), meaning a protected merge of
the branch into `main`, `staging.yml` applying migrations 194–196, and the staging deployment. Or say what to change
first.

**What it blocks:**
- staging integration of everything since Batch 5;
- W6.5 (Studio end to end) and W6.7 (Uji Cepat Level 3) on staging;
- the Batch 6, navigation and Konfigurasi walks on staging;
- **W6.2** U-PERF and **W6.8** the 50-student test of record. Both measure staging and write synthetic rows there,
  so today they would measure Batch 5, not the candidate.

**Recommendation:** authorise. Every condition the owner set (§0 of the proposal) is answered. The rollback is tested
from every state a deployment can leave. P-2 holds staging email to PINTAR's own and test addresses.

| | |
|---|---|
| Candidate | branch `claude/awesome-rubin-bqxp6p`. Code at `715f6f7d`; `3e9c1659` adds only the status report. The final head is named when CI and journeys are green on it |
| Base | `main` `34120759` (Batch 5, PR #8), an ancestor of the branch: no conflict |
| Size | 162 commits, 365 files |
| Database | staging 193 → **196**: 194 the D-183 exposure flag (adds `exposed_content_marks` with 260 fingerprints, plus refusal triggers); 195 the cycle order (`may_start_assessment` gains PRE_TEST_NOT_FINALIZED); 196 `school_people_page` (a read-only function). No existing row is changed or removed |
| Rollback | `ROLLBACK-194-195.sql` (also covers 196). Tested locally from 196, 195, 194-only and 193: each returns to 193 with its checks passing; running it twice changes nothing; `migration up` restores 196 and the 260 marks. It keeps every sitting and assignment |
| App rollback | promote staging's previous READY Vercel deployment; the database may stay at 196 (194 and 196 only add; 195 keeps the function's signature) |
| Local verification | full selftest 843/0 on a reset database (c256cd69); on 715f6f7d, 781 passed in the full run plus the 62 a Docker failure interrupted, re-run green; launch-readiness 24/24; secret scan clean; production dependencies 0 advisories |
| CI and journeys | `715f6f7d`: CI 42007060565 and journeys 42007065865, running at the time of writing |
| Known non-blockers | staging Storage files have no independent backup (D-190); K1/K2 wording stays provisional (no word marked accepted); real assessment content stays blocked by K6, and the exposure flag refuses the exposed chapters |

**On authorisation:** the existing process in the proposal's §7:
1. open the promotion pull request;
2. CI green on it;
3. the protected merge;
4. watch `staging.yml` (count = 196) and the Vercel build;
5. the verification walks.

**Unchanged while it waits:** independent Batch 8 work on the branch (the W6.4 crawl, local performance pre-checks,
W6.12, W6.9).
