# C3w · R-3: no learner personal information reaches a provider · a checkable design

Sharon, 13 Nov 2026. A design for C3w's pre-build review, written early at Bob's request (`TEAM-INSTRUCTIONS.md`, "Work
in parallel while the checkpoint is in flight", `16ac63b6…`). It turns my five R-3 requirements
(`THE-PLAN-ADDENDUM-1.md` §5d, R-3) into checks a build can be held to, and answers the common-names question that
Addendum §5d leaves to me and Daisy.

**What this is not:**
- not a build authorization: C3w is built last, after the evaluation, the owner's choice of provider, the limits and
  network egress;
- not Daisy's wording, which is hers.

## What holds now

- **Five controls, each with a test that fails when it is removed.**
- **The common-names rule, proposed:**
  - **block** hard identifiers, the full names of learners **the educator can already see**, and anything **shaped like
    a list of people**;
  - **pass** a lone given name in prose.
  - The figures in "Evidence the rule is usable" decide it. If no rule both protects learners and leaves ordinary
    teaching text usable, it goes to the owner with the options, as R-3 says.
- **Not disclosing a learner's existence** is part of the rule: the check never tells an educator that a name belongs
  to a learner they could not already see.

## The five controls

### 1 · One builder, and it can only read content

- **One module** builds every provider request: `src/lib/ai/permintaan.ts`, server-only.
  - Its output type is a closed record: `{ excerpt, objectives[], itemSchema, promptVersion }`.
  - Nothing else is accepted: the type has no index signature, and the runtime check rejects an extra key.
- **Database reads go through one definer function**, `c3w_bahan(p_lesson, p_objectives)`, owned by a **dedicated
  NOLOGIN role** (for example `c3w_pembaca`). That role holds SELECT on the content tables only: `lessons`,
  `learning_objectives`, `modules`, `courses`.
  - Even an edited function body cannot read `persons`, `responses`, `assessment_sessions`, results, enrolments or
    accounts: **the database refuses it.**
- **A pasted excerpt** comes from the request body and is never read from the database.
- **Tests:**
  1. Static: no `fetch` or SDK call to a provider host outside `src/lib/ai/`. Allowed hosts come from one constant
     there.
  2. **Database:** for each forbidden table, `has_table_privilege('c3w_pembaca', t, 'SELECT')` is false. The
     function's owner is `c3w_pembaca` and it is `SECURITY DEFINER`.
  3. The request built for a normal draft has exactly the four keys, deep-compared with a fixture.
- **Plants:**
  - (a) grant `c3w_pembaca` SELECT on `persons`: test 2 goes red;
  - (b) add a field to the builder's output: test 3 goes red.

### 2 · The excerpt is checked before anything is sent, and a match blocks

- **One database function decides:** `c3w_periksa_bahan(p_teks text) returns jsonb`, called by the route **before** the
  ledger reserves anything and before any provider call.
  - It answers only `{ boleh: bool, kelas: text[], rentang: int4range[] }`: allowed or not, which classes of match,
    and where in the educator's own text.
  - It never returns a name, a PINTAR ID or a person's id.
- **The route refuses** when `boleh` is false: a designed code, Daisy's sentence, and the spans highlighted in the
  text the educator pasted. **Nothing is sent, and nothing is stored** apart from the ledger row (control 4).
- **The check runs on the final excerpt whatever its source.** A lesson's own text is authored content, but it is
  checked all the same: a lesson can carry a class list too.
- **The rule** is set out in "The common-names rule".

### 3 · Nothing learner-derived goes into the context

The prompt's inputs are the four keys of control 1 and nothing else. Not allowed, even aggregated:
- examples drawn from learners' answers;
- class results;
- "common mistakes" computed from evidence;
- misconception statistics.

Control 1's privilege test already makes this impossible to fetch through the builder. A static test also checks that
`src/lib/ai/` imports no module that reads results, responses or reports (an import allow-list).

### 4 · Provider-side records hold content only

- **The request carries no person:**
  - no `user` field;
  - no metadata naming a learner, an educator or a school;
  - its idempotency key and any request id are random UUIDs, unlinkable to a person.
- **Test:** deep-compare the outbound request (body and headers) with a fixture. Only the provider's documented content
  fields, the model, the limits and a random id are present.
- **PINTAR's own records:**
  - The ledger (D5) keeps a refused request with outcome `REFUSED_PERSONAL_DATA`, the match classes and their counts.
  - It keeps **no excerpt, no hash of it, and no matched text.** A hash of a text holding a learner's name is itself
    their data.
  - An allowed request keeps D3's excerpt hash as THE PLAN says.

### 5 · Tests, red first, and plants

| Test | Asserts | Plant that turns it red |
|---|---|---|
| R3-01 | An excerpt containing the full name of a learner the educator teaches is refused before any call. Zero provider calls (a stub provider counts them). The ledger row is `REFUSED_PERSONAL_DATA` with no text | the route skips the check |
| R3-02 | An excerpt with a PINTAR ID, an email address, a phone number, a 10-digit NISN-shaped number or a 16-digit NIK-shaped number: each refused | the hard-identifier class removed |
| R3-03 | A list of three or more names with scores or a class label, **none of them the school's learners**: refused (the names PINTAR cannot know) | the list-shape class removed |
| R3-04 | «Budi membeli lima apel» in prose, where a learner named Budi exists: **allowed** | a given-name-only match made blocking (proves the rule does not over-block) |
| R3-05 | The full name of a learner at the school whom **this educator cannot see**: refused as a list or identifier only if it is one; otherwise allowed, and the answer is the same as for a name of no learner | the check uses all the school's learners (it would then disclose existence) |
| R3-06 | The answer of `c3w_periksa_bahan` never contains a name, PINTAR ID or person id | the function returns the matched name |
| R3-07 | Controls 1, 3 and 4: privileges, the four keys, the outbound fixture, the import allow-list | as in each control |

## The common-names rule (the question R-3 leaves open)

The educator's text is matched against what PINTAR knows, in **three classes**. Any one blocks.

| Class | Blocks when | Why |
|---|---|---|
| **IDENTIFIER** | A token shaped like a PINTAR ID (`pintar_id_canonical`'s shape), an email address, an Indonesian phone number (`+62` or `0`, then 9 to 12 digits), a 10-digit or 16-digit number (NISN, NIK), anywhere | Teaching text has no reason to carry these. They identify a person even when PINTAR does not know them |
| **NAME** | The **full name** (two or more words, normalised for case, spaces and diacritics) of a learner **visible to the educator** (`person_visible_to_me`: their own classes, now or before) | A full name is specific, so false matches are rare. Limiting it to learners the educator can already see means a block **discloses nothing**: the educator already knows that person |
| **LIST** | Three or more lines (or table rows) in a 10-line window, each starting with a capitalised one-to-four-word name followed by a number, a grade or a class label (`Budi 85`, `Siti Rahma – 7A`); **or** three or more distinct given names of visible learners in one sentence or line | A class list or a score sheet, **including names PINTAR cannot know.** This is how "the names it cannot know" are caught, by shape and not by name |

**What passes:** a lone given name in prose ("Budi membeli lima apel", "Ani dan Budi pergi ke pasar"), even when a
learner has that name. A **one-word learner name** (common in Indonesia) counts under NAME only inside a LIST shape,
never on its own, or it would block ordinary text.

**Why "visible to the educator", not "the whole school":** matching every learner of the school would tell a teacher
that a name they typed belongs to a learner they cannot see. That is a disclosure of a minor's enrolment. Learners
outside the educator's sight are still protected by IDENTIFIER and LIST.

**What this does not stop, stated:** an educator who deliberately disguises names. R-3 is about accidental inclusion.
The rights statement (D10, with Addendum R-3's added line) is the educator's declaration, and the check is the control
for what they did not notice.

**Evidence the rule is usable (required before the build is accepted):**
- Run `c3w_periksa_bahan` over the evaluation's two synthetic chapters and a set of ordinary Indonesian teaching texts.
  - The texts are chosen by Daisy and the educator judges, and hold no learner data.
  - **Target: no block** on them.
- Run it over a fixture set of class lists, score sheets and contact lists.
  - **Target: every one blocked.**
- Record both rates on C3w's page.
- If either target cannot be met by tuning the three classes, **it goes to the owner with the options**, as R-3 says.

## For Daisy

These are hers, and the controls do not depend on their words:
- the refusal sentence;
- how the highlighted spans are shown;
- what the educator is told to do;
- the rights checkbox's added line ("the material contains no learner's personal information").

## Anticipation (the five questions, asked of this design)

- **Q1, what else reads or writes the state:** the builder, the check, the ledger and the provider adapter. All four
  are named, and the database role bounds the reads.
- **Q2, the neighbouring act:** a lesson used as the source, which is checked too. A refused request leaves only a
  ledger row with no text.
- **Q3, locks:** none taken.
- **Q4, before and after:** the check runs before the reservation, so a refused request never reserves.
- **Q5, who checks, with what access:** the check runs as a definer and returns no personal data. Tests R3-05 and
  R3-06 prove that.
