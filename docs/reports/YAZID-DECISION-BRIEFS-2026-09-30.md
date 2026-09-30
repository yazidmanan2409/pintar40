# PINTAR 4.0: three decisions for Yazid (30 Sep 2026)

**Coordinator briefs (Second Eye).** These are the three questions D-062(e) left open:

1. How misconception codes are registered.
2. Where the proof comes from for class figures built on official evidence (EDU-12, X-10).
3. REL-08 and REL-09.

Each brief sets out:

- the current problem;
- why 4.0 needs a ruling;
- the legitimate options and their trade-offs;
- a recommendation;
- the minimum ruling 4.0 needs;
- what can wait until after 4.0.

The recommendations are the coordinator's. **Nothing here is a ruling.** Per D-062(e), no ruling is inferred until Yazid gives one.

**At a glance:**

| # | Decision | Recommendation | Minimum ruling for 4.0 |
|---|---|---|---|
| 1 | Misconception-code registration | **A: the lesson package carries its own codes**, registered for the importing school when the package is imported | Misconception diagnosis is in 4.0, and its codes are registered by package import |
| 2 | Proof of class figures built on official evidence | **A: prove it on the production-posture audit stack**, confirmed at the pilot; keep synthetic-only data on staging | Accept that proof as PASS evidence for EDU-12 and X-10 |
| 3a | REL-08 (Supabase settings) | **Restate it** to fit the identity design (D-054 to D-058) and have the coordinator verify it with the read-only workflow | Approve the restated wording and the verifier |
| 3b | REL-09 (offline copies of the two production secrets) | **Generate fresh production values at the Gate 8 release, store them offline at the moment they are created**, and record only the fact | Name the custodian and the offline location type, and confirm before the first real card or certificate |

---

## 1. Misconception-code registration

### The current problem

- **The content is ready.** Lana has prepared **277 misconception codes** across the 20 chapters (one CSV per chapter: code, label, description, remediation and the questions that use each). Every wrong option was written against one of these misconceptions.
- **Nothing can register them.**
    - Codes live in `misconception_taxonomy`, one row per school (`institution_id`); it is an INSTITUTION_SCOPED record class, "authored taxonomy".
    - Row-level security lets a CAN_DRAFT holder insert rows for their own school. But no screen, server function or package path does it, and none are seeded.
- **Consequences today:**
    1. **Import refuses** a package whose option names an unregistered code (`OPTION_MISCONCEPTION_UNKNOWN`). So the chapters are imported with no codes on their distractors.
    2. **Publishing warns** `WEAK_MISCONCEPTION_LINKAGE` on every question (about 30 per chapter). The reviewer acknowledges each one before Terbit (UX-01).
    3. **The learner's result carries no misconception feedback.** `session_misconceptions` joins the taxonomy, so label and remediation are always empty.
    4. **The teacher's «Miskonsepsi» card can never show.** `class.misconceptions` (minimum 3 learners) has nothing to count.
- **A schema detail that shapes the options:** `code` is the primary key across all schools, even though each row belongs to one school. So two schools cannot both register the same code.

### Why 4.0 needs a ruling

Misconception diagnosis is part of 4.0 as built:

- a metric in the live catalogue (`class.misconceptions`);
- remediation in every result;
- a distractor-by-misconception design in all 20 chapters.

Without a registration path these surfaces stay empty forever, and every publish carries about 30 warnings. D-052(e) says nothing that belongs to 4.0 is deferred because a date moved. So either the path is built, or the feature is explicitly ruled out of 4.0. Both are rulings.

### Options

| Option | What it is | For | Against |
|---|---|---|---|
| **A. The package carries its codes** | The workbook and package gain a «Miskonsepsi» sheet (Lana's CSVs map onto it one to one). Import registers the codes for the importing school in the same transaction. A code the school already holds with identical text is reused. A code held by another school, or with different text, is refused by name. | "A lesson arrives whole" (the migrations `a_lesson_arrives_whole` and `a_lesson_is_assigned_whole`). One authoring act; no manual entry; auditable; works for every chapter already written. | Needs one Bob ticket (import, validator, problem codes) and one Daisy ticket (template sheet, copy). Because the key is global, two schools cannot import the same chapter's codes. That is fine for 4.0 (SD content to SD, SMA content to SMA), but must be solved before schools share content. |
| **B. One platform library** | An operator registers all 277 codes once under the canonical institution (`pintar-kanonik`), and every school's questions link to them. The foreign key has no school check, so it works today. | Fast: one audited data operation (D-013), no code. | Crosses the per-school boundary of an INSTITUTION_SCOPED record class. School staff cannot read the labels (RLS is scoped to the canonical institution); only server functions can. It runs against D-029's rule that school packages do not address the canonical library. **Not recommended** for 4.0. |
| **C. A Studio screen** | Staff add and edit codes per school, by hand or by CSV upload. | Full control; also covers later edits. | The most UI work, 277 codes to enter, and a second path beside A. Better as a later editing tool. |
| **D. Defer the feature** | Publish without links; formally accept or suppress the warnings; label the teacher's card "belum tersedia"; say so in tester material. | Cheapest now. | Removes one of PINTAR's distinctive teaching features from the pilot. The warnings stay friction (UX-01), or are hidden by a special case. |

### Recommendation

**A.** Open one Bob ticket and one Daisy ticket, queued as the first work after Gate 2E is released and before Gate 3. It is small, it lets all 20 chapters publish cleanly for staging acceptance and the pilot, and it changes no identity work. The two real schools hold different content, so the global key does not bite in 4.0.

### Minimum ruling for 4.0

1. Is misconception diagnosis in 4.0? *(Recommended: yes.)*
2. If yes, the path: codes arrive in the lesson package and are registered for the importing school by the author (CAN_DRAFT) at import. For 4.0, codes are unique across the whole platform.
3. Chapters already on staging may be re-imported with their codes.

### Can wait until after 4.0

- A shared taxonomy across schools (a canonical library of codes).
- The composite key `(institution_id, code)`.
- A Studio screen for editing codes.
- Versioning and merging of taxonomies.
- Misconception analytics across schools.

---

## 2. Proof of class figures built on official evidence (EDU-12, X-10)

### The current problem

- **What passes today:** both rows are PARTIAL. The *insufficiency* half passes on staging: every figure says «Belum ada bukti yang memenuhi syarat (0/5)» and what would make it appear, and nothing is fabricated.
- **What is missing:** the *sufficient* half, a real figure drawn on the teacher's, Head of Department's and dean's screens from enough **official** evidence, has never been walked on the deployed stack.
- **Why staging cannot produce it:** three rules, each right on its own, combine against it:
    - **D-003:** SD and SMA are real schools, and demo evidence never reaches any report.
    - **D-038:** staging runs in production mode, so only real schools produce official evidence.
    - **The standing rule:** test data lives only in the synthetic school, whose evidence is never official.
- **What is already proven**, on CI against an official-evidence tenant:
    - F06-P16: sufficiency states, and the identical figure once the minimum is met.
    - F06-P20 and F06-P21.
    - F06-P23: BOB-37's per-topic mastery with five learners, giving 0.55 and 0.625.
    - Audit job A walks every role's screens in a seeded world that includes that tenant.

### Why 4.0 needs a ruling

EDU-12 and X-10 are **P0**, and the release gate needs every P0 to PASS on the release candidate. PASS needs evidence that current rules cannot produce on staging. So either the standard of evidence or the data rule has to be decided.

### Options

| Option | What it is | For | Against |
|---|---|---|---|
| **A. Prove it on the production-posture audit stack** | Extend audit job B, which builds real schools in production mode from an empty database and walks Gladys's path. Take five or more students through the post-test, then read the teacher's and Head of Department's figures on screen. Staging keeps proving the insufficiency half. | Official evidence through the real screens, with no change to any data rule. The coordinator's work alone (about half a day); no Bob or Daisy. | Not the deployed infrastructure (Vercel with hosted Supabase). It is the same code and migrations on a local stack. |
| **B. An acceptance school on staging** | A non-synthetic school on staging that holds clearly labelled test people, with a reset procedure. | Proof on the deployed stack. | Amends the standing rule for staging. Staging's "official" data becomes mixed. Needs the missing C-07 reset script first. |
| **C. Prove it at the pilot** | The first real class in production with five or more post-tests is the acceptance evidence, observed and checked against the database. | Real evidence, real infrastructure. | Under D-052 the pilot comes after ENGINEERING COMPLETE and both green lights, so EDU-12 would enter the pilot as a conditional pass. The first real figures would appear in front of real educators. |
| **D. Let synthetic evidence count on staging** | An environment flag makes the synthetic school's evidence reportable. | Easy to walk. | Weakens the invariant that demo evidence never reaches a report, and adds a code path that could reach production. **Not recommended.** |

### Recommendation

**A for 4.0, with C as confirmation.** Prove the sufficient half on the production-posture audit stack, and treat the pilot's first real class as the observed confirmation. Keep staging synthetic-only. Choose B only if deployed-stack proof is wanted, and then only after a reset tool exists.

### Minimum ruling for 4.0

1. Accept the production-posture audit stack plus the CI database tests as PASS evidence for the sufficient half of EDU-12 and X-10.
2. Staging proves the insufficiency half.
3. The synthetic-only rule on staging stands.

### Can wait until after 4.0

- An official acceptance school on staging, with reset tooling.
- Observing figures in production (at the pilot).
- Figures compared across schools.

---

## 3. REL-08 and REL-09

### 3a. REL-08: Supabase settings

**The current problem.** The row was written on 24 Sep, before the identity decisions (D-054 to D-058). It asks Yazid to check three things in the Supabase dashboard:

1. the email rate limit fits a school's morning;
2. the password policy allows class cards;
3. the magic-link email is Indonesian and names the same-device rule.

Gate 0's read-only facts show, for both projects:

- `rate_limit_email_sent` is **2 per hour**;
- the minimum password length is 6, with no required characters and the leaked-password check off;
- every email template is **Supabase's English default** (today's sign-in email is "Your sign-in link").

Since D-057, PINTAR sends its own emails (BOB-25). Password sign-in follows the Gate 0 policy (BOB-26), and the magic link becomes a fallback behind a switch. Supabase's templates become a minimal Indonesian break-glass fallback. So the row as written tests the old design, and parts of it (clause 1 against Supabase's limit, clause 3) now describe a path PINTAR is leaving.

**Why 4.0 needs a ruling.** It is a P0 release check. As written it is partly obsolete, and it rests on a dashboard look that the coordinator's read-only workflow (`identity-facts.yml`) can now do and record.

**Options:**

- **Keep it as written.** Yazid checks the dashboard; brand the Supabase magic-link template in Indonesian now; raise Supabase's email limit. This duplicates D-057's design, and the template work is thrown away at Gate 3.
- **Restate it to the identity design and verify it by workflow.** REL-08 becomes three checks:
    - (i) **Email capacity:** PINTAR's own limits (BOB-25) and the Stellar Business capacity. Supabase's own email limit matters only for the break-glass fallback.
    - (ii) **Password policy:** the Gate 0 policy, set at Gate 3 through the settings workflow, with the leaked-password check on.
    - (iii) **Supabase templates:** the minimal Indonesian break-glass fallback (D-057). The working sign-in and code emails are PINTAR's own.

  The coordinator verifies it with the read-only workflow (staging, and production from `main`). Production settings change only at Gate 8's controlled release, with Yazid's approval (D-039).

**Recommendation:** restate it.

**Minimum ruling for 4.0:** approve the restated REL-08 and the coordinator as its verifier through the read-only workflow.

**Can wait until after 4.0:** nothing substantive. The settings are set as part of Gates 3 and 8.

### 3b. REL-09: offline copies of `CARD_PEPPER` and `CERT_SECRET_KEY_V1`

**The current problem.** Both are production secrets held only as Vercel environment variables. Neither is in the database, and the coordinator never sees them (standing rule). Losing either is permanent:

- **`CARD_PEPPER`:** every class card's sign-in secret is `SHA-256(pepper | card | PIN)`, and the card cooldown keys use the same pepper. If it is lost, no card in any school can sign in, and every card must be re-issued to every student.
- **`CERT_SECRET_KEY_V1`:** verifying a certificate recomputes its signature with the key version it was sealed under. If it is lost, every certificate signed under V1 fails verification permanently. INV-07 exists precisely so old keys are never deleted.

Production today holds **0 class cards and no certificates**. Nothing is at risk yet; the risk begins with the first real card or certificate, which is the pilot.

**Why 4.0 needs a ruling.** It is a P0 release check, and custody (who, where, how many copies) is a governance decision only Yazid can make and confirm.

**Options:**

- **(a) Confirm the current values.** Yazid copies the values already in Vercel into a password manager plus one sealed offline copy (paper or USB in a safe), and confirms: "exists, where (type), custodian". Simple, but relies on the current values' history.
- **(b) Two-person custody** (Yazid plus one named person). More resilient against a single loss; one more person holds production secrets.
- **(c) Generate fresh production values at the Gate 8 controlled release, store them offline at the moment they are created, then set them in Vercel.** Production has no cards and no certificates, so rotating now breaks nothing, and custody starts clean.

**Recommendation:** **(c) with (a)'s storage.** Generate fresh values at Gate 8 and store them in a password manager plus one sealed offline copy. Record in `RELEASES.md` only that the copy exists, its location type and its custodian, never the value. Two rules follow:

- **`CARD_PEPPER` is never rotated once the first card exists.**
- **Certificate keys only ever gain versions (V2 and later); none is ever removed.**

**Minimum ruling for 4.0:**

1. Name the custodian (and a second, if any) and the offline location type.
2. Confirm before Gate 8, that is, before the first real card or certificate.
3. Adopt the two rules above.

**Can wait until after 4.0:**

- Formal key management (KMS or HSM).
- Multi-person custody procedures.
- Periodic recovery drills beyond Gate 8's break-glass rehearsal.

---

## What happens after a ruling

| Ruling | Next step |
|---|---|
| 1 = A | Open BOB-42 and DAISY-32 on the board, queued first after Gate 2E is released. After their gate, re-import the staging chapters with codes. |
| 2 = A | The coordinator extends audit job B (sufficient official figures on screen). EDU-12 and X-10 move to PASS on that evidence, with the pilot as confirmation. |
| 3a = restated | The coordinator rewrites REL-08 in the checklist and verifies it by the read-only workflow at each identity gate. |
| 3b = recommended | The steps are written into C-11 (Gate 8). Yazid records the confirmation before the first real card or certificate. |

Each ruling is recorded as a decision (D-063 onward) before any work starts.
