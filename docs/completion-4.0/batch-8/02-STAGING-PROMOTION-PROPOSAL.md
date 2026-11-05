# Consolidated staging promotion: proposal for review (5 Nov 2026, revised after the owner's review)

**Status: PROPOSAL ONLY.** Nothing here is authorised yet: no merge, migration or deployment, and no promotion pull
request. Production is out of scope entirely.

**Authority:**
- Owner, 5 Nov: «Authorize preparation of one consolidated staging promotion proposal … Do not authorize the actual
  merge, migration or deployment until that proposal is reviewed.»
- Owner, 5 Nov, on review: «accepted for preparation, not yet execution». Six bounded checks before P-1 is requested;
  the answers are in §0.

**How the facts below were read:**
- The repository at the branch head.
- Staging, read only: `begin transaction read only`, SELECT only, through the Supabase connector on 5 Nov. Counts,
  digests, slugs and fingerprints only; no person, name, address or answer was read.
- Production was not read.

## 0. The owner's six checks, answered

| # | Check | Answer | Where |
|---|---|---|---|
| 1 | CI and full journeys GREEN on the final promotion revision | **b097b747 was NOT green:** journeys 41982416596 green (both jobs), but CI 41982412257 failed three tests (UX1-S1-KAKI-01, B6K-QR-01, BOB51-S01). P-2's new sentence wrote the domain into the copy table, and BOB51-S01 counted four reasons. Fixed in the following commit: the sentence names «alamat milik PINTAR» instead, and BOB51-S01 is restated to five reasons, the held one asserted to show **no** send-log reference. The whole suite is green locally on a reset database (841 passed, 0 failed). CI and journeys run again on the new head; only that head's runs count. | §9 |
| 2 | The Batch 6 gate (D-159) reconciled; any unmet mandatory condition | Conditions (a)–(g) are met on the branch. **No mandatory condition blocks staging.** Two items remain **acceptance** items, not staging blockers: F-11 (with the print proofs) and the D1 real-client protocol (P5/P6). D1 leaves the branch only by P-1. | §5 |
| 3 | Rollback covers migration bookkeeping and partial failure | **Yes, tested.** Each of the three states a deployment can leave (193, 194 only, 195) was tested locally from its real state, and so was running the script twice. Each ends at exactly 193 recorded migrations with 193's schema, and a re-apply restores 195. | §7 |
| 4 | 96 versus 106 sittings | **96 is authoritative** (read-only count by slug: all OFFICIAL, all over the exposed chapter, the newest of 9 Oct). «106» was an arithmetic slip, corrected in D-184's evidence page and E-K6-4, and marked *sic* in D-185's row. | `evidence/staging-96-sesi.md` |
| 5 | Email isolation or an enforceable synthetic-recipient allowlist; no unrestricted real-inbox sending | **Built and tested** (`17763949`); **selected as built by D-187**. Outside production's origin, PINTAR sends only to its own domain or to reserved test domains, unless a reviewed change names an address. Anything else is held: not sent, not logged. | §4 |
| 6 | K1/K2 provisional wording and staging-only records, never represented as accepted production data | **Kept provisional and recorded as such.** No word is marked accepted; staging records stay on staging. | §6 |

## 1. What would be promoted

| | |
|---|---|
| Branch | `claude/awesome-rubin-bqxp6p` |
| Candidate head | the head carrying this page (§9 names it). The promotion pull request is **not** opened (owner, 5 Nov). |
| Base | `main` at `3412075` (the Batch 5 merge). `main` is an ancestor of the branch: no conflict. |
| Size | about 155 commits since `main` |
| Database | **two migrations**, 194 and 195 (§2); staging is at 193 |

**What the commits hold, by authority.** Each was developed on the branch under its own ruling and verified in CI and
the journeys. None has been on staging.

| Work | Authority | What changes on staging |
|---|---|---|
| Batch 6: the certificate as designed, the Digital Card (CR80), the email status (four provable states), the A4 print of each surface | D-159, D-160, D-164 | new screens and prints; no migration |
| D-161 branding direction recorded; today's logo stays in every slot | D-161, D-160(a) | words only; no logo asset changes (F-11) |
| D-177 corrections: back links, one pager grammar, result placement, terminology («paket», «Nomor Registrasi Sekolah», «PINTAR ID»), A1 question review, A2/A3 Uji Cepat figure from five scores, C1/C2 working context, E-K1–K9 | D-166 to D-177 | words and screens; no migration |
| E1 + E2: the integrated navigation | D-170, D-171 | every signed-in page's shell |
| B1: Konfigurasi as an index and one page per section | D-166, D-169 | Konfigurasi |
| D1: the identity emails in Daisy's frame | D-164, D-165 (design), D-177 (built; branch-only scope note) | the emails staging sends, **behind the P-2 hold** (§4) |
| Retrospective corrections and the reverse reconciliation | D-178 to D-181 | small screen and wording fixes |
| D-183: exposed questions never give a real verdict | D-183, D-184, D-185 | **migration 194** |
| Batch 8: W6.1 rule-level tests; W6.10 walks; `/akun` under an evaluation persona; the Uji Penguasaan waits for the Pemetaan Awal | D-186 | **migration 195**; one page |
| P-2: outside production, email only to PINTAR's own domain or test domains | owner, 5 Nov (this review) | `kirimEmail` |

## 2. The two migrations

### 194 · `20261228100000_exposed_questions_never_give_a_real_verdict` (D-183)

- **What it adds:** `exposed_content_marks` (260 sha256 fingerprints, no text, append-only), five functions and two
  `before insert` triggers. In a school that is not synthetic, these refuse to **assign**, or to **start a new
  sitting** of, an OFFICIAL Pemetaan Awal or Uji Penguasaan over an exposed chapter.
- **What it replaces:** nothing that existed at 193.
- **What it writes:** only its own marks.
- **On staging today:**
  - Nine of staging's 19 non-synthetic schools hold an open cycle assignment of an exposed chapter: 18 open
    assignments and 96 sittings, all OFFICIAL. The tenth D-184 school, `sd-zps`, has none.
  - After 194, those 96 sittings stay exactly as they are (D-185 option 2). The one still open can be finished, since
    the trigger acts on a new sitting only. New sittings and new assignments of those chapters are refused.
  - Eleven other open chapters in non-synthetic schools carry no exposed title or question and are unaffected; five of
    them are corrections.
  - The synthetic schools keep working (D-183(2)), including the load-test school, which also uses an exposed chapter.

### 195 · `20261229100000_the_mastery_check_waits_for_the_mapping` (W6.10)

- **What it changes:** one function, `may_start_assessment`, re-emitted with one added refusal,
  `PRE_TEST_NOT_FINALIZED`. The screens already held this order.
- **What it writes:** nothing.
- **On staging today:** 1,110 Uji Penguasaan sittings have no finished Pemetaan Awal, all in synthetic schools, from
  the load test (§8). They stay; the four still open can be finished.

### Prerequisites, read on staging on 5 Nov (to be read again immediately before the merge)

| Fact | Read |
|---|---|
| Migrations applied | 193; latest `20261227100000` (= the repository's first 193) |
| 194's objects | absent |
| `may_start_assessment` | `md5(prosrc)` = `c9b3f4ce04f07edc20f0124b0815ce45`, 193's text |

## 3. Compatibility during the deployment window

A push to `main` starts the Vercel staging build (`pintar40-staging`, Git-connected) and `staging.yml` at the same
time. **Both orders are safe:**
- **New app, database at 193.** Every database function the branch's app calls (198 names, read from `src`) is
  defined in `main`'s 193 migrations.
- **Old app, database at 195.** 194 only adds. 195 keeps the function's signature, grants and answer shape.

**No production workflow is triggered by the merge:**
- the production deploys run only on `.github/deploy-request.txt` or `.github/vercel-request.txt`, and the branch
  changes neither;
- the branch changes no `supabase/config.toml`;
- the branch's `staging-*-request.txt` records trigger on pushes to the branch only.

## 4. P-2 · staging email: the recipient hold (built, `17763949`)

**Why one rule is enough:** every email PINTAR sends goes through one function, `kirimEmail`. The only other sender,
Supabase Auth's own magic-link mailer, is switched off (`TAUTAN_MASUK_CADANGAN = false`). The evaluation and code paths
only *generate* links; they send nothing.

**The rule:** outside production's origin (`https://app.pintarselalu.com`), an address is sent to only if it is one of:
- an address at `pintarselalu.com`, exactly. Subdomains and lookalikes are held, such as `staging.pintarselalu.com`,
  `evilpintarselalu.com` and `pintarselalu.com.evil.io`;
- an address at a reserved test name of RFC 2606 / RFC 6761 (`.test`, `.invalid`, `.example`, `.localhost`,
  `example.com/.net/.org`), which no real person can hold;
- an address listed in `PENERIMA_UJI_TAMBAHAN`. The list is in the source, so only a reviewed change can add to it,
  and it is **empty**. It is where D1's dedicated synthetic test inboxes (P6) go once the owner authorises them.

**What a held send does:**
- Nothing is sent and nothing is logged; no send budget is spent.
- The answer is `DITAHAN_UJI`, and «Kirim email uji» names the reason (`emailuji.alasan.ditahan_uji`, Gladys pack B37).
- The identity routes answer the screen before they send, so a held send to a real account reads exactly as a
  stranger's request: the hold cannot reveal whether an account exists.
- Production's origin is not restricted.

**Tested:** `P2-PENERIMA-01`, red before (`evidence/p2-merah-sebelum.txt`), green after, against the real send log and
the Mailpit sink:
- six held addresses (`gmail.com`, `outlook.com`, `example.co` and three lookalikes): not sent, not logged;
- four allowed addresses sent;
- production's origin unrestricted.

`BOB25-K01`, `-S01` and `-A01` still pass.

**What it changes on staging:**
- The Golden School and test schools use `goldenschool+…@pintarselalu.com`, `…-admin@pintarselalu.com` and
  `admin_gt@pintarselalu.com`, which stay allowed. These are PINTAR's own mailboxes, not third parties.
- Staging is at origin `https://staging.pintarselalu.com`, so the hold applies there.
- **Held from now on:** the load-test staff at `example.co`, which is a real domain, not a reserved one. Their walks
  sign in by generated link and send nothing.
- **Held from now on:** `staging-journey-human.yml`'s one personal Gmail alias, which is the K7 question. Keeping it
  needs a reviewed entry in `PENERIMA_UJI_TAMBAHAN`. Until then that workflow's email step is held.

**Owner choice within P-2:**
- keep the rule as built; or
- narrow `pintarselalu.com` to the named test mailboxes only.

Either way, `PENERIMA_UJI_TAMBAHAN` stays empty until P6 names the synthetic inboxes.

## 5. The Batch 6 promotion gate (D-159), reconciled

| D-159 | Condition | State on the branch |
|---|---|---|
| (a) | Batch 5 accepted under D-158 | met (historical) |
| (b) | The approved scope, complete and working: W3.19 certificate, W3.20 Digital Card, identity emails and wordmark, W3.21 Design System page, W3.22 A4 print; J2.15, J2.16, J8.4 | **met for engineering**: built and verified (Batch 6 report §1, CI and journeys). The wordmark holds today's logo in its slot under D-160(a), a one-file swap when F-11 arrives. W3.21 is Daisy's republication, not engineering. |
| (c) | Certificate integrity, sealed evidence, identity boundaries, revocation, public verification | met: the Batch 6 guards and journeys, unchanged since |
| (d) | No student photographs on certificates or cards | met: guards plant a photo and check it never renders |
| (e) | Approved compositions; missing designs decided, not invented | met: the open items are listed, not designed (Batch 6 report §3) |
| (f) | Email status distinguishes queued, handed off, delivered and failed, as evidence allows | met: four provable states; «delivered» is never claimed (D-160(d)) |
| (g) | Tests red/green, CI, browser journeys; Batches 0–5 preserved; earlier items visible | met on the branch; the final head's CI and journeys are §0 item 1 |
| — | «Development branch only … Stop at the Batch 6 promotion gate» | **this is the gate P-1 asks to pass** |

**No mandatory condition is unmet for a staging promotion.** These remain **acceptance** conditions for Batch 6. They
do not block staging, and staging is where several of them can first be checked:
- **F-11:** the licensed wordmark master and the physical A4 and CR80 print proofs (K4);
- **D1's real-client protocol:** P6, the synthetic inboxes and a send path, which the P-2 hold keeps closed until
  named; and P5, Dr Gladys's context-line words (K5, K1). D-165 accepted D1 for design. Its build stands on the 4 Nov
  directive (P7), with the scope note «branch only». **P-1 is therefore what lets D1 leave the branch.** The owner
  may instead exclude it: a revert of D1's templates before the merge, with its own CI run;
- W3.21 (Daisy), and the Batch 6 report's open items 3–9 (owner, Daisy, Dr Gladys).

## 6. Provisional wording and staging-only records (K1, K2)

- **K1 (Dr Gladys's words, Part A and B1–B37)** and **K2 (X12: «paket» / «kursus» / «course»)** are built under
  their keys in `src/lib/hle.ts` as Daisy drew them or as Terminology v1 ruled. They are listed as pending in
  `DR-GLADYS-QUESTION-PACK.md` and `X12-TERMINOLOGY-PAKET.md`.
- The promotion carries them to staging **as provisional**. No page, record or report states them as accepted. This
  proposal does not accept them, and neither does the staging verification report that will follow (D-179(c)).
- Accepting them is K1/K2's own step, recorded in `DECISIONS.md` when given, after which only `hle.ts` changes.
- **Staging records stay on staging.** That includes the walks' schools, the 96 kept sittings, the load test's
  sittings, and anything P-2 holds or allows. Nothing copies a staging row to production:
  - production is migrated by its own workflow, from a pinned release, on a request file;
  - staging's data is never exported to it (D-185(3)).
- Production is not touched by this promotion at all.

## 7. Rollback strategy

**`ROLLBACK-194-195.sql`** (this folder) is not a migration and is never applied by any workflow. It runs as the
database owner, in one transaction that commits only if its own checks pass:
- `may_start_assessment` goes back to 193's text, checked against staging's md5;
- 194's objects are removed;
- **the two `schema_migrations` rows are removed** (the bookkeeping), so a later `supabase migration up` re-applies
  cleanly;
- the closing check requires exactly 193 recorded migrations.

**Partial failure.** `supabase db push` applies each migration file in its own transaction, together with its
bookkeeping row, and stops at the first failure. So staging can only be left at 193, at 194, or at 195. Tested
locally on 5 Nov, each from its real state:

| State | How it was made | Result of the script |
|---|---|---|
| 195 | a normal apply | 193; checks pass |
| **194 only** | a planted failure at the end of 195 («division by zero»): 195 not recorded, its function change rolled back, 260 marks present | 193; checks pass |
| 193 | the script run a second time | no change; checks pass (safe to repeat) |
| then | `supabase migration up` | 195, 260 marks, the order rule present |

`staging.yml`'s own check (staging's count equals the repository's) makes a partial apply visible as a red run at once.

| Problem after the merge | Rollback |
|---|---|
| The app only | Vercel: promote staging's previous READY deployment (built from `3412075`). The database may stay at 195 (§3). |
| A migration, full or partial | The owner runs the script. The app may stay (§3). |
| Everything | Run the script, then push a **revert commit** of the merge to `main` (a new commit; history is not rewritten). `staging.yml` then finds 193 = 193, and Vercel rebuilds the old app. |
| Data | The physical backup confirmed in step 2 below is the recovery point. Neither migration writes a row outside its own marks. |

## 8. Proposed order (each step only after P-1)

1. **Pull request** into `main`. CI and the journeys run green on its head; mergeable `clean`; no bypass.
2. **Backup (owner):** a physical staging backup less than 24 hours old, with a restore available (D-158).
3. **Staging is quiet** (D-036). The freeze is lifted for the window only.
4. **Read-only pre-check:**
   - the three facts of §2;
   - Batch 5's preservation digests (`batch-5/evidence/staging/preservation-before.txt`);
   - the 96 sittings by slug (`evidence/staging-96-sesi.md`).
5. **Merge:** a merge commit pinned to the verified head (`expectedHeadSha`).
6. **Watch** `staging.yml` (194, 195; count = 195), `ci` on `main` and the Vercel staging build. No production
   workflow may start.
7. **Read-only post-check:**
   - 195 migrations;
   - 20 + 240 marks;
   - the order rule present;
   - the preservation digests unchanged;
   - the 96 sittings unchanged.
8. **Staging walks with the existing tools:** a fresh synthetic test school (`found-school.yml`), GS-01 to GS-21,
   Studio, the Batch 5 walk, accessibility.
9. **Report, then restore the freeze.**

**Then:**
- W6.2: `perf-staging.yml` and `concurrency.mjs`.
- W6.8: `perf-l1.yml` mode `browser`, with 50 learners of the synthetic load-test school, using synthetic identities
  and data only.
  - `audit/perf/l1.mjs` (mode `wave`) now sits each Pemetaan Awal in setup, untimed. Its first run on staging is its
    proof.
- W6.9: the checklist regenerated from that evidence.
- J2.7: under its separate authorisation.
- W6.6 and K1–K7 stay recorded dependencies; no completed engineering work is reopened.

## 9. Go/no-go recommendation

**Revision:** the head that carries this revision of the page (named in the covering report), after `b097b747`'s CI failure was fixed. Its CI and journeys runs are dispatched.

**D-188's backup condition is withdrawn by D-190** (owner, 5 Nov: the backup project is stopped; the environment is a development environment with the owner as sole tester). P-1 rests on the existing safeguards: Supabase's daily physical backup of the database, confirmed by the owner from the dashboard; `ROLLBACK-194-195.sql`; the read-only fingerprint of staging's 29 Storage files (`166f7a3b…`), compared after the deployment, which the promotion does not touch. Storage files have no independent backup; this is recorded, not marked met (D-190(4)).

**Recommendation: GO for P-1, staging only, conditional on:**
- CI and both journeys jobs green on that exact SHA;
- the owner's backup confirmation (step 2);
- the owner's P-2 choice (§4: as built, or narrowed).

**If either run is red, the recommendation is NO-GO** until it is fixed and green on a new head.

**Remaining risks:**

| Risk | Size | Held by |
|---|---|---|
| A large promotion (about 155 commits: Batches 6 and 8, D-177, the navigation, Konfigurasi, D1) reaches staging at once; a regression found there touches many areas | medium | CI and journeys on the head; the GS-01..21, Studio, Batch 5 and accessibility walks on staging; rollback in §7 |
| D1's emails are not accepted (P5, P6); on staging they reach only PINTAR's own mailboxes and test domains | low | the P-2 hold; acceptance stays K5/K1 |
| Dr Gladys's provisional words (K1, K2) are seen on staging by testers as if final | low | §6; the staging report states them as provisional |
| The adapted L1 wave has never run (staging-only) | low; affects only the measurement | its first staging run is checked before W6.2/W6.8 figures are used |
| The load-test staff (`example.co`) and the human-journey workflow's personal alias are now held | low | §4; an owner decision (K7) for the alias |
| Staging's environment marker reads «production» (D-184); the rollback script cannot tell staging from production by itself | low | the operator chooses the target by its connection string. The script refuses any database not at 193–195 recorded migrations. |
| F-11's wordmark and print proofs are still missing | no staging risk | today's logo in every slot (D-160(a)); K4 |
