# 01 — Rebuild Lessons Learned

*Baseline amendment (2026-09-12): Lesson 5's ground-zero rule now points
at the one-engine invariant; Lesson 12 gains the "user is not middleware"
rule and a pointer to doc 16; Lesson 14 (MCQ testwiseness cues) added,
explicitly marked as carried from the strategic review rather than
re-verified against 3.0 source in this pass. Historical findings are
otherwise untouched.*

Post-mortem of the PINTAR 3.0 implementation (verified against
`pintar-3.0-consolidated/` source, its migrations, and the accumulated
audit/handoff documents — not just their summaries). Purpose: preserve the
lesson, discard the implementation. Nothing here is a refactor instruction.

---

### Lesson 1 — Storage policies and the RLS-shaped bucket flag are two different locks

**Old problem:** `0060` created the `content-assets` bucket `public=true`
plus a `SELECT`-for-`PUBLIC` storage policy, a `INSERT`-for-`authenticated`
policy, and an `UPDATE`-for-`authenticated` policy. `0071` later flipped
`public=false` and dropped only the one policy it had itself just created
(`content_assets_srv`). All three `0060` policies survived. Verified live:
`GET /storage/v1/object/content-assets/<path>` with only the anon key
returned a 33MB lesson video, HTTP 200.

**Why it happened:** the bucket's `public` flag and its RLS policies were
treated as one mental model ("private bucket") when they are two
independent gates — flipping the flag disables only the unauthenticated CDN
shortcut, not the RLS-governed object route, which the `PUBLIC`-role policy
still opened. The fix-migration's author assumed dropping "the" policy
meant dropping "the policies."

**Consequence:** every piece of licensed lesson media (video, audio, slide
PDFs) was readable by anyone with the public anon key — which is shipped in
every page bundle by design. Separately, any authenticated account,
including a seeded classroom-card learner, could overwrite any object up to
400MB.

**Ground-zero design rule:** storage privacy is never "set the flag."
Every storage-touching migration must assert, as part of its own
verification step, that zero policies grant `SELECT`/`INSERT`/`UPDATE` to
`public` or `anon` on any non-explicitly-public bucket — query
`storage.policies`/`pg_policies` directly, don't infer from the bucket flag.

**Already covered by FABLE?** YES — FABLE-00 non-negotiable #2, FABLE-01 §7
(black-box anon-fetch test required), FABLE-02's view-grant tests. Baseline:
INV-15, INV-36.

---

### Lesson 2 — A convention ("this is app-layer only") is not a security boundary

**Old problem:** all 15 PLP tables originally shipped
`FOR ALL TO authenticated USING (true)`, intended as a placeholder the
application layer would never actually rely on. Any learner's real
`authenticated` JWT could read every answer key, forge a passing summary,
and mint a certificate for an assessment never taken.

**Why it happened:** the schema was extended quickly across many migrations
(`0035`–`0038`) under time pressure, and "policy exists so Postgres doesn't
block the app" was conflated with "policy is correct."

**Consequence:** a P0 finding requiring an entire remediation migration
(`0069`) plus an `ALTER DEFAULT PRIVILEGES` change to stop it recurring.

**Ground-zero design rule:** RLS is written closed by default, per table,
at creation time — never `USING (true)` as a placeholder, ever, even for
one commit.

**Already covered by FABLE?** YES — FABLE-00 non-negotiable #1, FABLE-01 §6.
Baseline: INV-36.

---

### Lesson 3 — A single, non-versioned signing secret cannot ever be rotated

**Old problem:** `SERTIFIKAT_SECRET_KEY` was shared as a plaintext
screenshot mid-project (also exposing the Supabase service-role key and two
other secrets). It is dev-grade
(`12345678901234567890123456789012`, confirmed still the literal fallback in
`lib/sertifikat.ts`). It cannot be rotated because the HMAC payload/design
never included a `key_version` — rotating it would invalidate every
certificate ever printed.

**Why it happened:** the certificate signing scheme was designed once,
early, for correctness (HMAC + timing-safe compare) but rotation was never
treated as a requirement until a real credential leak made it urgent —
by then rotating was structurally blocked.

**Consequence:** a live, unresolved P0-adjacent security exposure with no
safe remediation path; the fix (`key_version` column + keyring) is fully
designed but not implemented as of the last handoff.

**Ground-zero design rule:** any cryptographic signing key must ship with a
version identifier and a keyring lookup from its very first migration —
rotation capability is not an enhancement, it's part of the key's definition.
The same lesson, generalized in the baseline: everything the certificate
attests to — release id and hash, definition version, identity snapshot —
sits *inside* the signed payload (INV-05); a binding outside the signature
is a binding that can be swapped.

**Already covered by FABLE?** YES — FABLE-00 non-negotiable #5, FABLE-04 §3.
FABLE-04 must be re-crosschecked for the INV-05 payload correction (doc 14).

---

### Lesson 4 — Parallel migration numbering series create real operational risk

**Old problem:** two independently-numbered migration series
(`supabase/sql/0001–0084` and `migrations-legacy-warisan-akar/0045–0053`)
both exist and must be run in a specific interleave; a third,
still-earlier series (`0018–0033`) lived in a completely different root
folder and was mistaken for "missing" by an earlier audit that didn't know
to look there. A real filename collision (`0065` written twice by two
different deliveries) had to be resolved by renumbering one of them after
the fact.

**Why it happened:** ~90 dated `delivery-*`/`handoff_*` patch folders were
each authored somewhat independently over time and only periodically
reconciled into one canonical tree (`pintar-3.0-consolidated/`), rather than
every contributor working against one always-current trunk.

**Consequence:** a `MIGRATION-RUN-ORDER.md` document had to exist just to
say what order to run migrations in — itself a sign the numbering scheme
had failed at its one job. An append-only ledger table (`0070`) had to be
retrofitted specifically to make this class of collision structurally
impossible going forward, but "structurally impossible going forward" still
required first surviving the collision that already happened.

**Consequence for the rebuild:** there is no "reconcile many patch
folders" problem to solve in a ground-zero rebuild — but the *pattern* that
produced it (long-lived divergent branches of the same numbered sequence)
is a general risk, not one specific to this project's history.

**Ground-zero design rule:** one linear migration history, one trunk, from
commit one. No parallel "legacy-akar"-style series ever created on purpose.
If two people need to add migrations concurrently, that's a merge-ordering
problem to solve with process, not with a second numbered folder. Migrations
are tested against a clean install and the supported upgrade path (doc 16
§2).

**Already covered by FABLE?** PARTIAL — FABLE-01 assumes a clean linear
migration history implicitly but never states the "no parallel series, no
long-lived patch-folder queue" rule explicitly. **Amend FABLE-01 §1** to add
this as an explicit repo-hygiene rule.

---

### Lesson 5 — Three content/assessment generations were allowed to coexist "temporarily," permanently

**Old problem:** a legacy `soal`-table bank (serving `/asesmen`, `/hasil`,
`/sertifikat` for the herbal EBM course), a legacy SD5 "Pecahan" fraction
pilot (same `soal` table, different subject), and a fully separate
PLP-native schema (`items`/`item_options`/…) all serve live content
simultaneously, branching on request-body shape inside
`/api/v1/assessment/*`. Whether the legacy SD5 pilot and the newer 9-chapter
PLP-native SD5 curriculum are the same content, overlapping content, or
unrelated content was never resolved in any document read.

**Why it happened:** each generation was the right call *at the time it was
built* (thin vertical slice strategy, explicitly documented and reasonable)
— but "prove the new architecture without breaking the old one" quietly
became "run both forever" because no one ever scheduled the retirement of
the old path.

**Consequence:** a genuinely unresolved content-ownership question
(are there two SD5 math curricula or one?), branching logic in the
assessment API that every future contributor has to understand both halves
of, and doctrine questions (safety-gate rules, hint-leak constraints) that
had to be implemented and verified twice.

**Ground-zero design rule:** a "thin vertical slice to prove the
architecture" is fine — but it ships with an explicit retirement date/
condition for whatever it's temporarily standing next to. Never let a
migration path become a second permanent product. In the baseline this is
the one-authoritative-engine invariant (INV-26): learning assessment,
Quick Assessment, examinations, Mini-PINTAR and future paper evidence are
*modes* of one engine, never parallel implementations.

**Already covered by FABLE?** PARTIAL — FABLE-00 non-negotiable #13 bans
building a *second* SD5 line by accident, but doesn't state the general
principle that no thin-slice/legacy-parallel path should be allowed to
outlive its proving purpose. **Amend FABLE-00** to add this as a general
non-negotiable.

---

### Lesson 6 — Dummy-data fallbacks that never got wired to real data

**Old problem:** the educator/dean briefing pipeline (`lib/briefing-pipeline.ts`)
ships a hard threshold (`AMBANG_KOHORT_SELESAI = 50`) and a stub
(`getStatusKohortLive()` always returns 0), so every briefing surface
serves fabricated mock data behind a "Mode Pengujian" banner — and whether
this was ever rewired to the real cohort-aggregation views built later
(`0037`) was **not verified** in any document.

**Why it happened:** building the UI against realistic-looking mock data
was the right sequencing call for a UI-first phase — but the hand-off point
back to real data was marked in code comments, not tracked as an open
work item with an owner, so it was easy to lose track of whether it had
happened.

**Consequence:** as of the last handoff, nobody could say with confidence
whether educators/deans were looking at real numbers or permanent fiction.
That is a trust-destroying failure mode for a product whose entire premise
is "evidence-based."

**Ground-zero design rule:** a "not enough data yet" empty state is a
legitimate, honest UI state. A fabricated-but-plausible-looking full
dataset behind a banner is not — build the honest empty state instead, and
never ship a code path whose job is to *pretend* there's data. The same
rule applies to psychometrics: empirical fields stay honestly empty until
legitimately computed (doc 02).

**Already covered by FABLE?** YES — FABLE-06 §1 explicit rule.

---

### Lesson 7 — Client-side uploads with the anon key create a hidden policy dependency

**Old problem:** `lib/plp/storage.ts` is a `"use client"` module that
calls `.upload()` directly from the browser using the anon key. This is
*why* the dangerous `content_assets_unggah_auth` policy from Lesson 1
existed at all — removing it without first moving uploads server-side would
have broken Studio uploads outright, which is exactly why the fix required
two coordinated changes instead of one migration.

**Why it happened:** direct client uploads are the fastest way to get
Studio's upload UI working, and Supabase's client SDK makes it trivial —
so it shipped as the "obvious" implementation before the server-side signed
route existed to replace it.

**Consequence:** a hard coupling between a security fix and an application
change, which is the exact reason C2 could not be closed with "just run a
migration."

**Ground-zero design rule:** the server-side signed-upload route is built
*first*, in the same phase as the bucket itself — a client module doing a
direct anon-key `.upload()` should never exist even transiently.

**Already covered by FABLE?** YES — FABLE-00 non-negotiable #2, FABLE-01 §7.

---

### Lesson 8 — Seed data hygiene: convenience passwords are a production risk if the seed script itself doesn't force distinct ones

**Old problem:** `0039` seeds 15 personas; 11 of them share the password
`admin12345`. The migration's own comment acknowledges this is fine for
staging and a disaster in production — but nothing in the schema/tooling
actually prevents that seed from being pointed at a production database.

**Why it happened:** convenience during rapid persona-based testing; the
self-deleting permission gate solved "don't re-run this accidentally" but
not "don't run this against prod at all."

**Ground-zero design rule:** seed scripts refuse to run unless a positive
"this is not production" signal is present (env flag, explicit project-ref
allowlist) — not just a one-time permission ritual. Synthetic personas live
in synthetic tenants whose evidence is `SYNTHETIC` by inheritance (doc 06,
doc 16 §3).

**Already covered by FABLE?** PARTIAL — FABLE-01 §2 says "don't default
every seed account to the same password" but doesn't require an explicit
environment guard. **Amend FABLE-01 §2** to add an explicit
non-production guard on the seed script itself. Baseline: INV-21.

---

### Lesson 9 — In-memory storage for anything that must survive a restart

**Old problem:** legacy (herbal) certificates were flagged in the original
write-up as stored in an in-memory `Map` — meaning they vanish on restart
and don't survive across serverless instances. Never independently
re-verified whether this was fixed.

**Ground-zero design rule:** certificates, sessions, and any other record
a learner or institution depends on later persist in Postgres from the
first migration touching them — never an in-process structure, not even
temporarily "to get the demo working." (A learner's *unacknowledged
responses* may additionally live in a durable client outbox for replay —
doc 07 — which is the opposite of in-process state: it exists precisely to
survive a process dying.)

**Already covered by FABLE?** YES — FABLE-04 §6.

---

### Lesson 10 — A validator that only scans the fields it was first written for

**Old problem:** the forbidden-word/safety-language linter only scans
`petunjuk`, `arah_berpikir`, and `options[].rationale`. It was never
extended when lesson body markdown, transcripts, stems, stimuli, and
misconception remediation text were added later — all fields a learner
actually reads. An audit found real hits in those unscanned fields.

**Why it happened:** the validator was written when only hints/rationale
existed as free text; later additions to the schema didn't trigger a
re-audit of every safety-critical validation surface.

**Ground-zero design rule:** whenever a new free-text column is added that
a learner can read, it is added to the safety-language validator's scope in
the *same* migration/PR that adds the column — not treated as a follow-up.

**Already covered by FABLE?** YES — FABLE-00 non-negotiable #11, FABLE-02 §8.

---

### Lesson 11 — "Fails open" is a specific, nameable bug class, not a vague risk

**Old problem:** `bolehPadaSubjek()`, one of the two core authorization
functions called from both app code and RLS, was found to fail open on
unexpected input (K-5) — the exact opposite of what a shared
authorization primitive must do.

**Ground-zero design rule:** every authorization primitive gets an explicit
test asserting it denies on malformed/unexpected/null input, not just on
well-formed "should be denied" input. Fail-closed is a property to test
for, not assume.

**Already covered by FABLE?** YES — FABLE-01 §4 explicit instruction.

---

### Lesson 12 — Repo history as patch-folder archaeology

**Old problem:** the workspace contains ~90 dated `delivery-*`/`handoff_*`
folders, several dead/redundant folders (`patch-2026-08-09-prerender-03/`
duplicating an already-merged fix), multiple full historical `archive/`
exports, and a `pintar-3.0-consolidated/` tree that is itself the result of
manually layering all of the above in dependency order. Understanding
"what is the current state of the code" required reading a
`CODE-RECONCILIATION-MANIFEST.md` just to know which folder was authoritative.

**Why it happened:** work happened across many AI-assisted sessions, each
producing its own delivery bundle rather than committing directly to one
tree with real version control history — which made the product owner the
relay between each session's output and the repository/database.

**Consequence:** enormous cognitive overhead for anyone (human or AI)
joining the project — "is this file current" required provenance research
before any actual engineering could happen.

**Ground-zero design rule:** one git repository, one trunk, real commits,
from day one — no parallel delivery-folder patch queue, ever, regardless of
how the code was authored. **The user is not middleware:** normal
engineering never requires the product owner to copy SQL between systems,
patch source files by hand, relay files between an AI session and the
repository, or apply undocumented production changes (doc 16 §1).

**Already covered by FABLE?** NO. **Amend FABLE-01 §1**: add an explicit
rule that all work commits directly to the trunk repository; no
`delivery-*`/`handoff-*`-style parallel folder pattern is ever created,
even as a working convenience.

---

### Lesson 13 — Undecided ambiguity was allowed to sit unresolved for months

**Old problem:** whether the legacy SD5 "Pecahan" pilot and the 9-chapter
PLP-native SD5 curriculum are the same content was flagged as an open
question and then never actually resolved across multiple subsequent
handoffs.

**Ground-zero design rule:** an ambiguity flagged as "needs a human
decision" gets a named owner and a deadline the moment it's flagged — not
just a permanent flag in a document that keeps getting carried forward.

**Already covered by FABLE?** N/A for the rebuild itself (moot — one
canonical line is built) — but the *general process* lesson is captured in
`11-PINTAR-OPEN-DECISIONS.md`, which forces a resolution path per open
question rather than an indefinite flag.

---

### Lesson 14 — Apparently valid MCQs can carry exploitable cues (testwiseness)

**Provenance note:** this lesson is carried from the 2026-09 strategic
review's finding that PINTAR 3.0 demonstrated apparently valid MCQs
containing systematic cues (correct-option length, grammar, precision,
distractor plausibility, answer position). It was **not re-verified
against `pintar-3.0-consolidated/` source or its content banks in this
amendment pass**; the anti-bias distractor QA already present in the
rebuild package (doc 09, FABLE-05) is consistent with it.

**Why it matters:** a learner who can infer answers from cues without
knowing the subject produces evidence that looks like mastery and is not —
which corrupts diagnosis, Question Health, psychometrics and certificates
at once.

**Ground-zero design rule:** automated MCQ Quality / Testwiseness checks
run before publication and feed Publish Readiness (doc 04 §1a, doc 07);
adversarial regression fixtures (doc 16 §4) are part of the verification
contract from the start. The checks detect exploitable *patterns*; they
never force cosmetic uniformity.

**Already covered by FABLE?** PARTIAL — anti-bias distractor QA is in
FABLE-05; the explicit pattern list, severity grading into Publish
Readiness and the adversarial fixtures are new. **Re-crosscheck FABLE-05**
(doc 14).
