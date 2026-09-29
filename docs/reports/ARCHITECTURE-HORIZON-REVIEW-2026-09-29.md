# PINTAR 4.0 → 5.5 Architecture Horizon Review (29 Sep 2026)

**Second Eye, read-only.** Nothing in code, migrations or schemas was changed by this review.

The evidence came from the 126 migrations, 24 ADRs, `src/` and the self-tests on `main` `73c0be5`. It was read by the coordinator and three read-only agents, and the coordinator checked the key claims against the code. File references are `supabase/migrations/<file>:<line>` unless noted.

**Verdict: AMBER.** The path to 4.5, 5.0 and 5.5 is credible, and no roadmap-driven change to 4.0 is needed.

**Follow-up (Yazid, 29 Sep):**
- **Two 4.0 reproducibility defects** opened as **BOB-35** and **BOB-36** (BOARD.md).
- **The version-discipline rule** recorded as **D-060** (DECISIONS.md).
- **Lower-priority observations** recorded in the BOARD backlog, as non-blockers.
- **Deferred work:** nothing from 4.5, 5.0 or 5.5 was ticketed or built.

---

## 1. Executive verdict: AMBER

The foundations the roadmap depends on already exist:

- **Item-level evidence:**
  - answers are append-only;
  - every paper a student saw is recorded;
  - session provenance is immutable;
  - sealed content has a hash and revision lineage.
- **Meaning:** figures come from a versioned, immutable metric catalogue, and one evaluator (`metric_evaluate`) computes them.
- **Security:**
  - one family of permission checks serves both row-level security and the server functions;
  - the function surface is declared and closed by construction;
  - the service role is contained.

It is AMBER rather than GREEN for two reasons:

1. **Two ordinary 4.0 defects damage reproducibility.** They should be fixed before real schools generate data (§6).
2. **Version labels have drifted from their meaning.** `MC-2` and `engine_version` stayed the same while the logic behind them changed, so a future Context Passport could not trust them. That discipline starts now; it is a rule, not code (§6.3).

## 2. Roadmap compatibility matrix

| Future capability | Current foundation | Compat. | Evidence | Timing |
|---|---|---|---|---|
| 4.5 Question Intelligence | Recorded papers; every answer the server receives, append-only and with the label chosen whether right or wrong; first view per item; session provenance; item lineage; question health with a human review step | GREEN | `presented_items` (20260912133821:116); `responses` (20260912140823:49); `presented_item_views` (20260913090000:126); `supersedes_item_id` (20260915120000:55) | 4.5 (fix the statistics views; the raw data is intact) |
| 4.5 Question weighting | Scoring policy registry; immutable results, with each recompute as a new linked row; a change to an interpretive field creates a new definition version | GREEN | `scoring_policy` (20260914091500:25); `enforce_result_write`; `save_assessment_definition` (20260915150000:236) | Before 4.5: the recompute must use the session's own policy |
| 4.5 Report Intelligence | Catalogue meanings, minimum samples and audiences; structured result objects with a "not yet enough evidence" status | GREEN | `metric_definitions` (20260918100000:70); `metric_evaluate` (20260925100000) | 4.5 |
| 4.5 Context QR | Report snapshots carrying the catalogue version, template version, scope and time; a QR already served from a declared public route (certificates); signed certificate payload | AMBER | `generated_reports` (20260918120000:145); `src/lib/qr.ts`; `public_surface_registry`; `certificate_prepare` | Version rule NOW (D-060); the rest in 4.5 |
| 5.0 Composable workflows | Separate content, release, instrument, assignment and session entities; the cycle is built as one shape by `assign_release` | AMBER | `assign_release` (20261010100000:460); gates only in `penguasaan/page.tsx:33` and `peta/page.tsx:30` | Before 5.0 |
| 5.0 60-second dashboards | Scope drill-down school → branch → class → learner, each figure evaluated for the person reading it; decision queue; next-action panel | GREEN | `src/lib/pimpinan.ts` (`cabang`, `buktiPerKelas`, `rincianMurid`); `management_scope_over_node` | 5.0 |
| 5.5 Plugin API | Central predicates; declared, closed function surface; service role only in `src/app/api/`; read-gateway precedents (the canonical-content accessors, and a login-less `analytics` role limited to the `official_*` views) | AMBER | 20260912004431:27-94; `client_rpc_registry` + ADR-0021; F01-S03; ADR-0015 §6 | Before 5.5 |
| 5.x Controlled theming | Versioned semantic tokens, with Tailwind mapped onto them; `experience.css` has 1,514 `var(--…)` uses and no hex colours | GREEN | `src/app/globals.css:87-117, 218`; ten stray `text-black` in two legacy summary pages | 5.x |

No area is RED. No gap forces the destructive replacement of a core concept.

## 3. Evidence we must not lose

All of the following are captured today. The action is to protect them.

| Evidence | Status | Why it matters | Action before production? |
|---|---|---|---|
| Every server-received answer: label, `client_seq`, `received_at`, receipt mode | Append-only; UPDATE and DELETE refused | Correct rates, distractor frequencies, drift | No. Never purge it and never collapse it to final answers only |
| The papers presented, with positions | Immutable | The denominator for every item statistic | No |
| First view per item | Written once | Time on item (first view → `received_at`) | No |
| Session provenance: release, definition id and version, policy version, engine version, class, cohort, period, mode, evidence class | Immutable | Reproducing any result | **Indirectly yes:** BOB-35 writes wrong provenance |
| Sealed item content, answer key and revision lineage | Immutable once sealed | The key is read live, so sealing is the snapshot | Mostly: `items.cycle_role` escapes the seal (backlog) |
| Immutable results and recompute lineage | Captured | Reproducible results | No |
| Report snapshots (`generated_reports.body`) | Captured on each view of the summary pages | The only record of what a report said | No |
| Append-only audit log, actor derived on the server | Captured | Provenance | No |

**Deliberately not listed:**
- Choices a student changes before confirming, in the post-test and Uji Cepat. They are not sent by design and are not needed.
- Keystroke or timing surveillance. Data minimization holds.

**Caution for the future:** `institutions.retention_days` exists with no job behind it. Any future retention job must pseudonymize item-level evidence, not delete it.

## 4. Architectural seams worth protecting

1. **The tenant boundary:**
   - `institution_id` is NOT NULL on tenant data;
   - each node keeps its ancestor path (`jalur`), and nodes cannot be re-parented across schools (INV-13);
   - row-level security is on for every table, and CI asserts it;
   - people are not tenant-owned (INV-23).
2. **One predicate family serves both RLS and the RPCs** ("so the two layers cannot drift", 20260912004431:27).
3. **The function surface is closed by construction:**
   - ADR-0021;
   - `client_rpc_registry`, checked both ways;
   - `public_surface_registry` must match exactly what anonymous users can reach.
4. **The service role is contained:**
   - it is used only under `src/app/api/`;
   - one module reads the key;
   - a bundle scan checks for it;
   - each route authorizes with the caller's own client first.

   No analytics, AI or plugin path may ever run as the service role.
5. **Sealing and revision:** the release hash (ADR-0004) and revision by copy-forward with lineage (ADR-0016).
6. **The evidence chain:** presented papers → append-only responses → immutable results with lineage → immutable session provenance (INV-28, INV-29).
7. **The metric catalogue is the single meaning of a number, and `metric_evaluate` is the single evaluator.**
8. **Official-evidence classification:** synthetic, preview and demo evidence never reaches official aggregates.
9. **The signed certificate payload:** release hash, definition version and scoring policy version.
10. **The design token layer.**

## 5. Potential future friction

| # | Finding | Evidence | Consequence | Severity | Solve when |
|---|---|---|---|---|---|
| 1 | **Version labels drift from their meaning.** `MC-2` was kept while the calculators, source views and readiness rule changed. `engine_version` is constant. The recompute uses the current policy. Consumers of result lineage disagree (root, latest or max). | 20260928100000:109; 20260913090000:177; 20260914091500:174; 20260918110000:141-161 | A Context Passport would cite ambiguous labels | MEDIUM | Rule NOW (D-060); code before 4.5 |
| 2 | **The learning cycle is one fixed shape.** The order is enforced only in pages. "Read" is derived on the client from a total the client supplies. Pages are split in the browser. There is no prerequisite model. | `assign_release`; `may_start_assessment` (20260913090000:248); `LessonPlayer.tsx:72`; `siklus.ts:95` | Progression must move to the server for workflows | MEDIUM | Before 5.0 |
| 3 | **Core entities have no read API** (109 direct `.from()` reads). Visibility is wider than authorization: the school tree is visible to every member. | `src/**`; `org_nodes_select` (20260912004431:292) | A plugin gateway needs its own read accessors | MEDIUM | Before 5.5 |
| 4 | **Every principal is a person.** Authorization uses three vocabularies. The function registry is build-time metadata only. | 20260912004431:31; 20260919100000:38 | Plugins need scopes, consent and an exposure class | MEDIUM | 5.5 |
| 5 | **Report templates lose their history.** A revision deletes the prior metric list, and direct edits are neither versioned nor audited. Snapshots have no immutability trigger. Live pages persist nothing. There is no as-of evaluation. | 20261002120000:75-91; 20260918120000:145 | Old live-page screenshots are untraceable | LOW-MED | 4.5 |
| 6 | **Certificates render with the current template and school name** | `src/lib/sertifikat.ts:126` | Their appearance can change; the signed payload stays the truth | LOW | 4.5 |
| 7 | **The item statistics views overcount.** They count every answer change, treat MCQ_MULTI answers as wrong, and time items from paper assembly. `empirical_*` is never computed. | 20260928100000:109-128 | Wrong rates (Question Health reads them, backlog) | LOW; the data is intact | 4.5 |
| 8 | **Misconception codes cannot be recorded.** There is no registration path, authored content has no codes, and options are sealed. | 20260912112712:187-194, 262 | Tagging later needs a side mapping or a revision | LOW | Before 4.5 |
| 9 | **Writes that bypass the RPCs and the audit.** The content lifecycle is sequential direct updates. Content status and assignment edits are not audited. About 27 tables are still directly writable. | `src/app/studio/actions.ts:68-113` | An API is harder to draw; the audit has gaps | LOW-MED | Continue moving writes into RPCs |
| 10 | **Tenant immutability is per-table convention**, with a `feature_flags` gap | 20260912130904:37-41 | Hygiene | LOW | 4.0 backlog |
| 11 | **Project doctrine names a generic plugin system as a failure mode** | `docs/rebuild/12-PINTAR-FAILURE-MODES.md:45` | Consistent with 5.5 timing | — | Revisit at 5.5 |

## 6. PINTAR 4.0 changes required NOW

**Roadmap-driven changes: NONE.** PINTAR 4.0 stays frozen against roadmap feature work.

**Two 4.0 defects** meet the "cannot reproduce historical results" test. They are opened as ordinary 4.0 correctness work:

1. **BOB-35: a corrected-release move writes mixed provenance.**
   - `move_learning_assignment_release` (20260915130000:166) updates only the learning assignment.
   - The cycle's assessment assignments keep the old course's definitions.
   - `start_learning_session` (20260929100000) records the new release but draws from the old definition's course (`eligible_items_for_definition`).
   - A signed certificate can therefore cite v1.1's hash for v1.0 items.
   - This was found by reading the code; a red test confirms it first.
2. **BOB-36: Uji Cepat definitions stay mutable after sessions cite them.**
   - The freeze exempts ad-hoc definitions (20260929100000:285-297).
   - `authenticated` holds UPDATE under the CAN_DRAFT policy (20260912114854:171-185).
   - The verdict is computed live from `passing_rules`.
   - A change rewrites past verdicts and leaves no trace.
3. **Rule (D-060):** a version label changes when its meaning changes.

**Found in passing** (recorded in the BOARD backlog; they can wait, and the data is intact):
- `items.cycle_role` is outside the seal and the hash;
- Question Health counts every answer change;
- `predikat_bands` is outside the scoring-policy trigger;
- `feature_flags` has no tenant guard;
- consumers of result lineage disagree;
- content-status, assignment and template edits are unaudited;
- the cycle order is enforced only in pages.

## 7. Explicitly deferred (not ticketed, not built)

**4.5:**
- statistics-view corrections, cohort and time dimensions, `empirical_*`, a question-health history;
- weighting as a new scoring policy version, and recompute using the session's policy;
- misconception mapping;
- native report explanation;
- Context Passport (immutable snapshots, as-of evaluation, versioned templates, certificates rendered from the snapshot).

**5.0:**
- a workflow layer above assignments and sessions, with server-side progression and eligibility, and real completion rules;
- persisted summaries.

**5.5:**
- an extension exposure class and core-entity read accessors;
- non-human principals, scopes and consent;
- a registry enforced at runtime;
- plugin provenance;
- unifying the authorization vocabularies.

**5.x:** theme presets as swapped token values.

## 8. Final assessment

1. **Can PINTAR 4.0 ship without 4.5/5.0/5.5 concepts?** Yes.
2. **Is enough evidence kept for Question Intelligence?** Yes. The raw evidence is complete; only the views are weak, and they can be rebuilt.
3. **Can a trustworthy Context Passport be built?** Yes, with the D-060 discipline from now on.
4. **Is there a path to composable workflows?** Yes. The entities are separate, but progression must move to the server before 5.0.
5. **Can a plugin API work without direct database access?** Yes: new read accessors or a low-privilege role on the closed surface, never the service role.
6. **Do tenancy and authorization fit that future?** Yes, and they are the strongest part of the design. The gaps are visibility versus authorization, and principals that are not people.
7. **What must be protected before real school data?** BOB-35, BOB-36, D-060 and the seams in §4.
8. **What should not be touched now?** Everything in §7.

**SECOND EYE VERDICT: AMBER.** The path is credible: protect the seams and fix the two 4.0 reproducibility defects.
